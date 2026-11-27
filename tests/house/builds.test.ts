// The Build Zone: builds from words (buildZone.ts, workers/neighbourhood/src/builds.ts). Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanBricks, cleanPrompt, GRID, MAX_BRICKS, PLOT_COUNT, type BrickReply } from '../../workers/neighbourhood/src/builds.ts';
import { handle, memoryStore, LIMITS, type Ctx } from '../../workers/neighbourhood/src/registry.ts';
import { PLOTS, ZONE, ZONE_Y, PLOT_SIZE, CELL, brickBox, buildObstacles } from '../../src/game/house/buildZone.ts';
import { buildStaticWorld, blocked } from '../../src/game/house/collision.ts';
import { heightAt, roomAtLevel } from '../../src/game/house/layout.ts';

test('bricks: only ones that fit the plot, trimmed at the edge, no repeats, at most MAX_BRICKS', () => {
  assert.deepEqual(cleanBricks([[0, 0, 0, 2, 2, 4], [19, 0, 19, 4, 4, 1], [0, 0, 0, 2, 2, 4], [20, 0, 0, 1, 1, 0], [0, -1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 99], [1.5, 0, 0, 1, 1, 0], 'x', [0, 0, 0, 1, 1]]), [[0, 0, 0, 2, 2, 4], [19, 0, 19, 1, 1, 1]]);
  assert.equal(cleanBricks([]), null);
  assert.equal(cleanBricks('nope'), null);
  const many = Array.from({ length: 500 }, (_, i) => [i % GRID, Math.floor(i / 400), Math.floor(i / GRID) % GRID, 1, 1, 0]);
  assert.equal(cleanBricks(many)!.length, MAX_BRICKS);
});

test('prompts: short plain words; no links, nothing rude or violent', () => {
  for (const ok of ['a bure with a coconut tree', 'Drua canoe', 'a big sea turtle 🐢', 'Sussex house']) assert.ok(cleanPrompt(ok).ok, ok);
  for (const bad of ['', 'hi', 'x'.repeat(121), 'see www.site.com', 'a big gun', 'guns', 'a bomb house', 'fuck', 'kill the turtle', 'a beer can']) assert.equal(cleanPrompt(bad).ok, false, bad);
});

let n = 0;
const ADMIN = 'admin-key-admin-key-1234';
const fake = (reply: BrickReply) => async () => reply;
const ctx = (store = memoryStore(), extra: Partial<Ctx> = {}): Ctx => ({
  store, now: new Date('2026-11-27T00:00:00Z'), random: (b) => `r${n++}x${b}`, hash: async (s) => `h:${s}`, visitor: 'v1', adminToken: ADMIN, authorization: null,
  makeBricks: fake({ ok: true, name: 'Bure', bricks: [[0, 0, 0, 2, 2, 16], [2, 1, 2, 2, 2, 15]] }), ...extra,
});

test('builds: made by Claude, waiting until LvTS approves, then on their plot for everyone (replacing the last one)', async () => {
  const store = memoryStore(), said: unknown[] = [];
  const admin = { authorization: `Bearer ${ADMIN}`, announce: (m: unknown) => said.push(m) };
  const made = await handle('POST', '/builds', { prompt: 'a bure', plot: 2 }, ctx(store));
  assert.equal(made.status, 201);
  const b1 = (made.body as { build: { id: string; plot: number; name: string; bricks: unknown[] } }).build;
  assert.equal(b1.plot, 2); assert.equal(b1.name, 'Bure'); assert.equal(b1.bricks.length, 2);
  assert.deepEqual((await handle('GET', '/builds', null, ctx(store))).body, { builds: [] }, 'shown before approval');
  assert.equal((await handle('POST', `/admin/builds/${b1.id}/approve`, null, ctx(store))).status, 401, 'approved without the key');
  assert.equal((await handle('POST', `/admin/builds/${b1.id}/approve`, null, ctx(store, admin))).status, 200);
  assert.deepEqual(said, [{ t: 'builds' }], 'everyone online is told');
  assert.deepEqual(((await handle('GET', '/builds', null, ctx(store))).body as { builds: { id: string }[] }).builds.map((b) => b.id), [b1.id]);
  // a second build on the same plot replaces the first once approved
  const b2 = ((await handle('POST', '/builds', { prompt: 'a boat', plot: 2 }, ctx(store, { visitor: 'v2' }))).body as { build: { id: string } }).build;
  await handle('POST', `/admin/builds/${b2.id}/approve`, null, ctx(store, admin));
  assert.deepEqual(((await handle('GET', '/builds', null, ctx(store))).body as { builds: { id: string }[] }).builds.map((b) => b.id), [b2.id]);
  // removing it empties the plot, and tells everyone
  assert.equal((await handle('DELETE', `/admin/builds/${b2.id}`, null, ctx(store, admin))).status, 200);
  assert.deepEqual((await handle('GET', '/builds', null, ctx(store))).body, { builds: [] });
  assert.equal(said.length, 3);
});

test('builds: bad plots and prompts, refusals, failures and the daily limit', async () => {
  const store = memoryStore();
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: PLOT_COUNT }, ctx(store))).status, 400);
  assert.equal((await handle('POST', '/builds', { prompt: 'a gun', plot: 0 }, ctx(store))).status, 400);
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 0 }, ctx(store, { makeBricks: undefined }))).status, 503, 'no builder, no build');
  assert.equal((await handle('POST', '/builds', { prompt: 'a scary monster', plot: 0 }, ctx(store, { makeBricks: fake({ ok: false, why: 'refused' }) }))).status, 422);
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 0 }, ctx(store, { makeBricks: async () => { throw new Error('down'); } }))).status, 503);
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 0 }, ctx(store, { makeBricks: fake({ ok: true, name: 'x', bricks: [[99, 0, 0, 1, 1, 0]] }) }))).status, 503, 'no usable bricks');
  // the refused, failed and empty ones were tries 1 to 3 (bad plots and prompts don't count); two more go through, then it stops
  for (let i = 0; i < LIMITS.buildsPerDay - 3; i++) assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 1 }, ctx(store))).status, 201);
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 1 }, ctx(store))).status, 429);
  assert.equal((await handle('POST', '/builds', { prompt: 'a bure', plot: 1 }, ctx(store, { visitor: 'v9' }))).status, 201, 'someone else still can');
});

const st = buildStaticWorld({ mode: 'explore' });
test('Build Zone: six plots on flat open ground, clear of everything and of every real place, signs in front', () => {
  assert.equal(PLOTS.length, PLOT_COUNT);
  for (const [i, p] of PLOTS.entries()) {
    for (let x = p.x0; x <= p.x0 + PLOT_SIZE; x += 0.8) for (let z = p.z0; z <= p.z0 + PLOT_SIZE + 0.8; z += 0.8) {
      assert.ok(Math.abs(heightAt(x, z) - ZONE_Y) < 0.01, `plot ${i + 1} flat at ${x}, ${z}`);
      assert.ok(!blocked([x, z], 0.3, st, [], ZONE_Y), `plot ${i + 1} clear at ${x}, ${z}`);
      assert.equal(roomAtLevel(x, z, ZONE_Y), undefined, `plot ${i + 1} is not in a real place at ${x}, ${z}`);
    }
    assert.ok(Math.abs(p.x0 / CELL - Math.round(p.x0 / CELL)) < 1e-9 && Math.abs(p.z0 / CELL - Math.round(p.z0 / CELL)) < 1e-9, 'on the stud grid');
    assert.ok(p.sign.z > p.z0 + PLOT_SIZE && p.sign.x > ZONE.x0 && p.sign.x < ZONE.x1);
  }
  // plots don't overlap
  for (let i = 0; i < PLOTS.length; i++) for (let j = i + 1; j < PLOTS.length; j++) {
    const a = PLOTS[i], b = PLOTS[j];
    assert.ok(a.x0 + PLOT_SIZE < b.x0 || b.x0 + PLOT_SIZE < a.x0 || a.z0 + PLOT_SIZE < b.z0 || b.z0 + PLOT_SIZE < a.z0, `plots ${i + 1} and ${j + 1}`);
  }
});

test('Build Zone: bricks sit on the plot, and the bottom ones are what you bump into', () => {
  const p = PLOTS[0];
  const box = brickBox(p, [GRID - 1, 0, GRID - 1, 1, 1, 0]);
  assert.ok(box.x1 <= p.x0 + PLOT_SIZE + 1e-9 && box.z1 <= p.z0 + PLOT_SIZE + 1e-9 && box.y0 > ZONE_Y);
  // a wall 4 studs long at the bottom is one strip; a roof brick up high doesn't block
  const obbs = buildObstacles(p, [[0, 0, 0, 4, 1, 0], [0, 10, 5, 4, 4, 0]]);
  assert.equal(obbs.length, 1);
  assert.ok(Math.abs(obbs[0].hx - 2 * CELL) < 1e-9);
});
