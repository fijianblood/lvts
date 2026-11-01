// Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticWorld, doorOBB, bodyOBB, blocked, PLAYER_R, type OBB } from '../../src/game/house/collision.ts';
import { DOORS, SPAWN, RAMPS, heightAt, SIDE_ROAD, PARKED, type GameMode } from '../../src/game/house/layout.ts';
import { SHOP_SPOTS, SHOP_LINE, STREET, VISITOR_SPOTS, visitorCharacter } from '../../src/game/house/neighbourhood.ts';
import { handle, memoryStore, LIMITS, type Ctx } from '../../workers/neighbourhood/src/registry.ts';
import { cleanName, cleanLook } from '../../workers/neighbourhood/src/rules.ts';

const doorsOpen: OBB[] = DOORS.map((d) => doorOBB(d, 1));
const visitors: OBB[] = VISITOR_SPOTS.map((p) => bodyOBB(p[0], p[2]));

// flood-fill the floor from the spawn point on a 10 cm grid, over the house and the street near the gate
type Grid = { x0: number; z0: number; step: number; nx: number; nz: number };
const FINE: Grid = { x0: -12.5, z0: -14.6, step: 0.1, nx: 450, nz: 470 };
/** All of the walkable part of Raiwai (McFarlane Road end to end, the side road), on a 20 cm grid. */
const RAIWAI_G: Grid = { x0: -63, z0: -42, step: 0.2, nx: 1132, nz: 380 };
function reach(mode: GameMode, extra: OBB[] = [], G: Grid = FINE, start: [number, number] = [SPAWN.pos[0], SPAWN.pos[2]]) {
  const world = buildStaticWorld({ mode });
  const obstacles = [...doorsOpen, ...extra];
  const seen = new Uint8Array(G.nx * G.nz);
  const free = (i: number, j: number) => !blocked([G.x0 + i * G.step, G.z0 + j * G.step], PLAYER_R, world, obstacles);
  const si = Math.round((start[0] - G.x0) / G.step), sj = Math.round((start[1] - G.z0) / G.step);
  const q = [[si, sj]];
  seen[si * G.nz + sj] = 1;
  while (q.length) {
    const [i, j] = q.pop()!;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= G.nx || b >= G.nz || seen[a * G.nz + b] || !free(a, b)) continue;
      seen[a * G.nz + b] = 1;
      q.push([a, b]);
    }
  }
  const at = (x: number, z: number) => { const i = Math.round((x - G.x0) / G.step), j = Math.round((z - G.z0) / G.step); return i >= 0 && j >= 0 && i < G.nx && j < G.nz && seen[i * G.nz + j] === 1; };
  const near = (x: number, z: number, r: number) => {
    for (let dx = -r; dx <= r; dx += G.step) for (let dz = -r; dz <= r; dz += G.step) if (Math.hypot(dx, dz) <= r && at(x + dx, z + dz)) return true;
    return false;
  };
  const any = (f: (x: number, z: number) => boolean) => {
    for (let i = 0; i < G.nx; i++) for (let j = 0; j < G.nz; j++) if (seen[i * G.nz + j] && f(G.x0 + i * G.step, G.z0 + j * G.step)) return true;
    return false;
  };
  const cliffs = () => {
    const out: string[] = [];
    for (let i = 0; i < G.nx - 1; i++) for (let j = 0; j < G.nz - 1; j++) {
      if (!seen[i * G.nz + j]) continue;
      const x = G.x0 + i * G.step, z = G.z0 + j * G.step;
      for (const [a, b] of [[i + 1, j], [i, j + 1]]) {
        if (!seen[a * G.nz + b]) continue;
        const xa = G.x0 + a * G.step, za = G.z0 + b * G.step;
        if (RAMPS.some((r) => [[x, z], [xa, za]].every(([px, pz]) => px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1))) continue;
        const d = Math.abs(heightAt(xa, za) - heightAt(x, z));
        if (d > 0.1) out.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) drops ${d.toFixed(2)} m`);
      }
    }
    return out;
  };
  return { at, near, any, cliffs };
}

test('the hunt keeps you in the compound: you never get out onto the street', () => {
  const hunt = reach('hunt');
  assert.equal(hunt.any((_x, z) => z > 24.0), false, 'walked past the finish line in the hunt');
});

test('exploring: from the house out of the gate, up to every shop, and not into the yards', () => {
  const map = reach('explore', visitors, FINE);
  for (const sp of SHOP_SPOTS) assert.ok(map.near((sp.x0 + sp.x1) / 2, SHOP_LINE - 0.4, 0.6), `can't walk up to ${sp.name}`);
  assert.equal(map.any((_x, z) => z > SHOP_LINE + 0.05), false, 'walked into a shop through the wall');
  assert.equal(map.any((x, z) => z > 21 && z < 22.25 && (x < -2.7 || x > 15.7)), false, "walked into the neighbours' front yards");
  assert.deepEqual(map.cliffs().slice(0, 6), [], 'a ledge on the way to the street');
});

test('exploring Raiwai: McFarlane Road end to end, up the side road, and no further', () => {
  const map = reach('explore', visitors, RAIWAI_G, [14, 25]);
  const inSide = (x: number) => x > SIDE_ROAD.x0 - 0.05 && x < SIDE_ROAD.x1 + 0.05;
  const inCompound = (x: number) => x > -2.75 && x < 15.75;
  assert.ok(map.near(STREET.x0 + 0.6, 26, 0.6) && map.near(STREET.x1 - 0.6, 26, 0.6), "can't reach both ends of McFarlane Road");
  assert.equal(map.any((x) => x < STREET.x0 - 0.05 || x > STREET.x1 + 0.05), false, 'walked off the end of McFarlane Road');
  assert.equal(map.any((_x, z) => z > STREET.z1 + 0.05), false, 'got over the wall or into a shop across the road');
  assert.ok(map.near((SIDE_ROAD.x0 + SIDE_ROAD.x1) / 2, SIDE_ROAD.z0 + 0.8, 0.6), "can't walk up the side road to its end");
  assert.equal(map.any((_x, z) => z < SIDE_ROAD.z0 - 0.05), false, 'walked past the end of the side road');
  assert.equal(map.any((x, z) => z < 22.25 && !inSide(x) && !inCompound(x)), false, "left the side road or McFarlane Road into someone's yard");
  for (const c of PARKED) assert.equal(map.near(c.x, c.z, 0.3), false, `walked through the parked ${c.kind} at x ${c.x}`);
  // (the compound itself is checked on the fine grid above; this coarser grid only looks outside it)
  const outside = map.cliffs().filter((m) => { const [x, z] = m.slice(1, m.indexOf(')')).split(',').map(Number); return !(inCompound(x) && z < 22.3); });
  assert.deepEqual(outside.slice(0, 6), [], 'a ledge on McFarlane Road or the side road');
});

test('visitors stand on the footpath, clear of everything, without blocking the shops', () => {
  const world = buildStaticWorld({ mode: 'explore' });
  for (const p of VISITOR_SPOTS) {
    assert.ok(p[0] > STREET.x0 && p[0] < STREET.x1 && p[2] > 29 && p[2] < SHOP_LINE, `visitor spot ${p} is off the footpath`);
    assert.equal(blocked([p[0], p[2]], 0.2, world, []), false, `visitor spot ${p} is inside something`);
  }
  for (let i = 1; i < SHOP_SPOTS.length; i++) assert.ok(SHOP_SPOTS[i].x0 >= SHOP_SPOTS[i - 1].x1, 'shops overlap');
});

test('no business is named and no offer is made until one has agreed: empty spots have no offers', () => {
  for (const sp of SHOP_SPOTS) {
    if (sp.kind === 'empty') { assert.deepEqual(sp.offers, [], `${sp.name} is empty but has offers`); assert.match(sp.name, /^Shop spot \d+$/); }
    for (const o of sp.offers) assert.ok(o.code && o.terms && o.title, `${sp.name}: offer ${o.id} is missing its code, terms or title`);
  }
});

test("a visitor's character becomes a playable character", () => {
  const look = cleanLook({ size: 'kid', skin: '#93603f', hair: '#16110e', hairStyle: 'bun', shirt: '#ec4899', pants: '#f8fafc', longPants: false, beard: false, earrings: true })!;
  const c = visitorCharacter('Mere', look, 'abc', true);
  assert.equal(c.id, 'me'); assert.equal(c.look.kind, 'kid'); assert.ok(c.eye > 1 && c.eye < 1.3);
  assert.equal(visitorCharacter('Mere', look, 'abc', false).id, 'v:abc');
});

// ── the server's rules, without the server ────────────────────────────────
const ADMIN = 'admin-key-for-tests-0001';
let n = 0;
const ctx = (store = memoryStore(), extra: Partial<Ctx> = {}): Ctx => ({
  store, now: new Date('2026-11-01T00:00:00Z'), random: (b) => `r${n++}x${b}`, hash: async (s) => `h:${s}`, visitor: 'v1', adminToken: ADMIN, authorization: null, ...extra,
});
const LOOK = { size: 'adult', skin: '#93603f', hair: '#16110e', hairStyle: 'short', shirt: '#3b82f6', pants: '#1f2937', longPants: true, beard: true, earrings: false };

test('names: first names and nicknames only', () => {
  for (const ok of ['Mere', 'Tevita', "O'Neil", 'Ana-Lisa', 'Sitiveni Jr', 'Émile', 'राम']) assert.ok(cleanName(ok), ok);
  for (const bad of ['', 'A', 'Tevita123', 'www.x.com', '@lvts', 'Bad Word Fuck', 'Admin', 'ThisNameIsWayTooLongToUse', ' ', 'Mere!']) assert.equal(cleanName(bad), null, bad);
});

test('looks: only the offered colours and styles; no beard on a kid', () => {
  assert.ok(cleanLook(LOOK));
  assert.equal(cleanLook({ ...LOOK, shirt: '#123456' }), null);
  assert.equal(cleanLook({ ...LOOK, size: 'kid' }), null, 'kid with a beard');
  assert.equal(cleanLook({ ...LOOK, hairStyle: 'baby' }), null);
  assert.equal(cleanLook({ ...LOOK, longPants: 'yes' }), null);
});

test('server: new characters wait for approval; only LvTS can approve; creators can change and delete theirs', async () => {
  const store = memoryStore();
  const made = await handle('POST', '/characters', { name: 'Mere', look: LOOK }, ctx(store));
  assert.equal(made.status, 201);
  const { id, key } = made.body as { id: string; key: string };
  assert.deepEqual((await handle('GET', '/characters', null, ctx(store))).body, { characters: [] }, 'shown before approval');
  assert.equal((await handle('POST', `/admin/${id}/approve`, null, ctx(store))).status, 401, 'approved without a key');
  assert.equal((await handle('POST', `/admin/${id}/approve`, null, ctx(store, { authorization: 'Bearer wrong-key-wrong-key-00' }))).status, 401);
  assert.equal((await handle('POST', `/admin/${id}/approve`, null, ctx(store, { adminToken: 'short', authorization: 'Bearer short' }))).status, 401, 'a too-short admin key works');
  assert.equal((await handle('POST', `/admin/${id}/approve`, null, ctx(store, { authorization: `Bearer ${ADMIN}` }))).status, 200);
  const list = (await handle('GET', '/characters', null, ctx(store))).body as { characters: { name: string; keyHash?: string }[] };
  assert.equal(list.characters[0].name, 'Mere');
  assert.equal('keyHash' in list.characters[0], false, 'secret key hash leaked');
  assert.equal((await handle('POST', `/characters/${id}`, { key: 'wrong' }, ctx(store))).status, 404);
  assert.equal(((await handle('PUT', `/characters/${id}`, { key, name: 'Mere', look: { ...LOOK, shirt: '#ef4444' } }, ctx(store))).body as { status: string }).status, 'approved', 'a new look alone needs approving again');
  assert.equal(((await handle('PUT', `/characters/${id}`, { key, name: 'Merewai', look: LOOK }, ctx(store))).body as { status: string }).status, 'pending', 'a new name skipped approval');
  assert.equal((await handle('DELETE', `/characters/${id}`, { key }, ctx(store))).status, 200);
  assert.equal(store.get(id), undefined);
});

test('server: a few characters a day per visitor, and a cap on the queue', async () => {
  const store = memoryStore();
  const results = [];
  for (let i = 0; i < LIMITS.perVisitorPerDay + 1; i++) results.push((await handle('POST', '/characters', { name: 'Mere', look: LOOK }, ctx(store))).status);
  assert.deepEqual(results, [...Array(LIMITS.perVisitorPerDay).fill(201), 429]);
  assert.equal((await handle('POST', '/characters', { name: 'Mere', look: LOOK }, ctx(store, { visitor: 'v2', now: new Date('2026-11-02T00:00:00Z') }))).status, 201, 'a new day, a new allowance');
  const full = memoryStore();
  for (let i = 0; i < LIMITS.maxPending; i++) full.insert({ id: `p${i}`, name: 'X', look: cleanLook(LOOK)!, status: 'pending', createdAt: '2026-01-01', keyHash: 'k' });
  assert.equal((await handle('POST', '/characters', { name: 'Mere', look: LOOK }, ctx(full, { visitor: 'v3' }))).status, 503);
});
