// Hop & Climb and the Riddle Hunt (hopClimb.ts). Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, columnRect, columnTop, POOL, GROUND, START, SPINNER, spinnerHits, inPool, RIDDLES, RIDDLE_POSTS, gameSolids, ARCH } from '../../src/game/house/hopClimb.ts';
import { buildStaticWorld, roamSolids, blocked, JUMP, JUMP_ROAM, jumpSpeed } from '../../src/game/house/collision.ts';
import { heightAt, roomAtLevel, MCFARLANE } from '../../src/game/house/layout.ts';
import { RAIWAI_TREES } from '../../src/game/house/raiwaiPlan.ts';
import { VISITOR_SPOTS } from '../../src/game/house/neighbourhood.ts';
import { CHARACTERS } from '../../src/game/house/characters.ts';

const mine = new Set(gameSolids().map((r) => JSON.stringify(r)));
const explore = buildStaticWorld({ mode: 'explore' });
const others = { rects: explore.rects.filter((r) => !mine.has(JSON.stringify(r))), circles: explore.circles };

/** How far you get at a walk, jumping from one block to one `rise` higher, before you come down on it. */
function reach(walk: number, apex: number, rise: number): number {
  const v = jumpSpeed(apex), g = JUMP.gravity;
  const disc = v * v - 2 * g * rise;
  if (disc < 0) return 0;
  return walk * ((v + Math.sqrt(disc)) / g);
}

test('Hop & Climb: every block can be reached from the one before at a walk, by every character who can jump', () => {
  for (const c of CHARACTERS) {
    if (c.crawl) continue;
    const apex = c.look.kind === 'kid' ? JUMP_ROAM.kid : JUMP_ROAM.up;
    for (let i = 1; i < COLUMNS.length; i++) {
      const a = columnRect(COLUMNS[i - 1]), b = columnRect(COLUMNS[i]);
      const gap = Math.hypot(Math.max(0, b.x0 - a.x1, a.x0 - b.x1), Math.max(0, b.z0 - a.z1, a.z0 - b.z1));
      const rise = columnTop(COLUMNS[i]) - columnTop(COLUMNS[i - 1]);
      assert.ok(rise <= 0.96 + 1e-6, `step ${i} rises ${rise.toFixed(2)} m`);
      assert.ok(reach(c.walk, apex, rise) > gap + 0.4, `${c.name} can't make the jump to block ${i} (gap ${gap.toFixed(2)} m, up ${rise.toFixed(2)} m)`);
    }
  }
});

test('Hop & Climb: the course stands in its pool on clear, flat ground, with the start on dry land', () => {
  for (let x = POOL.x0 - 3; x <= POOL.x1 + 3; x += 1) for (let z = POOL.z0 - 3; z <= POOL.z1 + 6; z += 1) assert.ok(Math.abs(heightAt(x, z) - GROUND) < 0.05, `ground at ${x}, ${z}`);
  for (const c of COLUMNS) {
    const r = columnRect(c);
    if (c === START) assert.ok(!inPool((r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2), 'the start is on land');
    else assert.ok(r.x0 > POOL.x0 && r.x1 < POOL.x1 && r.z0 > POOL.z0 && r.z1 < POOL.z1, `block at ${c.x}, ${c.z} is in the pool`);
    // nothing else there: no building, wall or tree
    for (const q of others.rects) assert.ok(r.x1 <= q.x0 || r.x0 >= q.x1 || r.z1 <= q.z0 || r.z0 >= q.z1, `block at ${c.x}, ${c.z} overlaps a solid at ${q.x0}, ${q.z0}`);
  }
  for (const t of RAIWAI_TREES) assert.ok(!(t.x > POOL.x0 - 2 && t.x < POOL.x1 + 2 && t.z > POOL.z0 - 2 && t.z < POOL.z1 + 2), `a tree in the pool at ${t.x}, ${t.z}`);
  // you can walk straight from McFarlane Road to the arch, somewhere between its pillars
  const clear = (x: number) => { for (let z = MCFARLANE.z0 - 0.5; z > ARCH.z + 0.5; z -= 0.25) if (blocked([x, z], 0.3, others, [])) return false; return true; };
  let way = false;
  for (let x = ARCH.x[0] + 0.6; x < ARCH.x[1] - 0.6; x += 0.25) way ||= clear(x);
  assert.ok(way, 'no clear way in from McFarlane Road to the arch');
});

test('Hop & Climb: the spinning bar knocks you over where it is, not elsewhere', () => {
  const a = 0.7;
  const on = [SPINNER.x + Math.cos(a) * 1.5, SPINNER.z - Math.sin(a) * 1.5] as const;
  const across = [SPINNER.x + Math.cos(a + Math.PI / 2) * 1.5, SPINNER.z - Math.sin(a + Math.PI / 2) * 1.5] as const;
  assert.equal(spinnerHits(on[0], on[1], 0.28, a), true);
  assert.equal(spinnerHits(across[0], across[1], 0.28, a), false);
  assert.equal(spinnerHits(SPINNER.x + 6, SPINNER.z, 0.28, 0), false);
});

test('the Riddle Hunt: six posts by the road, each with a riddle and one right answer', () => {
  assert.equal(RIDDLES.length, RIDDLE_POSTS.length);
  for (const r of RIDDLES) {
    assert.ok([0, 1, 2].includes(r.answer));
    assert.equal(new Set(r.options).size, 3, `repeated answers in "${r.q}"`);
  }
  // the right answer isn't always in the same place
  assert.ok(new Set(RIDDLES.map((r) => r.answer)).size === 3);
  for (const p of RIDDLE_POSTS) {
    const y = heightAt(p.x, p.z), room = roomAtLevel(p.x, p.z, y);
    assert.ok(!room || (room.outside && room.floor !== 'road'), `the post at ${p.x}, ${p.z} is off the road`);
    assert.ok(!blocked([p.x, p.z], 1.2, others, [], y), `the post at ${p.x}, ${p.z} is clear of everything else`);
    for (const v of VISITOR_SPOTS) assert.ok(Math.hypot(v[0] - p.x, v[2] - p.z) > 2, `the post at ${p.x}, ${p.z} is on a visitor's spot`);
  }
  // and they are in the free-roam world, so you bump into them
  const roam = roamSolids().rects;
  for (const p of RIDDLE_POSTS) assert.ok(roam.some((r) => p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1));
});
