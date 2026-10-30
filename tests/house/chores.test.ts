// Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticWorld, doorOBB, bodyOBB, blocked, PLAYER_R, type OBB } from '../../src/game/house/collision.ts';
import { DOORS, COLLECTIBLES, GOLDEN_SPOTS, SPAWN, EXIT_ZONE, NPC_SPOTS, ROOMS, heightAt } from '../../src/game/house/layout.ts';
import { CHORES, STEPS, TOOLS, PLACES, ITEMS, ALL_DONE_BONUS, lockOBB, unlockedAt, availableChores, type Item } from '../../src/game/house/chores.ts';

const world = buildStaticWorld();
const doorsOpen: OBB[] = DOORS.map((d) => doorOBB(d, 1));
const standing: OBB[] = Object.values(NPC_SPOTS).filter((n) => n.collide).map((n) => bodyOBB(n.pos[0], n.pos[2]));
const locks = (open: boolean): OBB[] => (open ? [] : PLACES.map(lockOBB));

// flood-fill the floor from the spawn point, as in collision.test.ts
const G = { x0: -3.2, z0: -14.6, step: 0.1, nx: 196, nz: 390 };
function reach(obstacles: OBB[]) {
  const seen = new Uint8Array(G.nx * G.nz);
  const free = (i: number, j: number) => !blocked([G.x0 + i * G.step, G.z0 + j * G.step], PLAYER_R, world, obstacles);
  const si = Math.round((SPAWN.pos[0] - G.x0) / G.step), sj = Math.round((SPAWN.pos[2] - G.z0) / G.step);
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
  const near = (x: number, z: number, r: number) => {
    for (let i = Math.floor((x - r - G.x0) / G.step); i <= Math.ceil((x + r - G.x0) / G.step); i++)
      for (let j = Math.floor((z - r - G.z0) / G.step); j <= Math.ceil((z + r - G.z0) / G.step); j++)
        if (i >= 0 && j >= 0 && i < G.nx && j < G.nz && seen[i * G.nz + j] && Math.hypot(G.x0 + i * G.step - x, G.z0 + j * G.step - z) <= r) return true;
    return false;
  };
  const inRoom = (id: string) => {
    const r = ROOMS.find((x) => x.id === id)!;
    for (let i = 0; i < G.nx; i++) for (let j = 0; j < G.nz; j++) {
      const x = G.x0 + i * G.step, z = G.z0 + j * G.step;
      if (seen[i * G.nz + j] && x > r.x0 + 0.05 && x < r.x1 - 0.05 && z > r.z0 + 0.05 && z < r.z1 - 0.05) return true;
    }
    return false;
  };
  return { near, inRoom };
}

test('chore data: unique ids, every step needs only things you can get, places open in order', () => {
  const ids = STEPS.map((s) => s.step.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate step id');
  assert.equal(new Set(CHORES.map((c) => c.id)).size, CHORES.length, 'duplicate chore id');
  const tools = new Set<Item>(TOOLS.map((t) => t.id));
  for (const c of CHORES) {
    let carrying: Item | null = null;
    for (const s of c.steps) {
      if (s.needs) assert.ok(tools.has(s.needs) || (c.ordered && carrying === s.needs), `${s.id} needs ${s.needs}, which you can't get`);
      if (s.takes) carrying = null;
      if (s.gives) carrying = s.gives;
      assert.ok(s.seconds > 0 && s.seconds <= 8, `${s.id}: ${s.seconds}s`);
    }
    if (c.ordered) assert.ok(c.steps.length > 1);
    assert.ok(c.stars >= 1);
  }
  for (const t of TOOLS) assert.ok(ITEMS[t.id].tool, `${t.id} is not a tool`);
  for (let i = 1; i < PLACES.length; i++) assert.ok(PLACES[i].stars > PLACES[i - 1].stars, 'places should open in order');
  assert.deepEqual(unlockedAt(0), []);
  assert.deepEqual(unlockedAt(PLACES.at(-1)!.stars), PLACES.map((p) => p.id));
  // one full game (before the garden opens) earns enough to open the first place, and two get you most of the way
  const perGame = availableChores(false, []).reduce((n, c) => n + c.stars, 0) + ALL_DONE_BONUS;
  assert.ok(perGame >= PLACES[0].stars && perGame * 2 >= PLACES[1].stars, `a full game earns ${perGame} stars`);
  assert.deepEqual(availableChores(true, ['garden']), [], 'the baby has no chores');
});

test('locked places are shut, and opening them never changes the hunt', () => {
  const shut = reach([...doorsOpen, ...standing, ...locks(false)]);
  for (const p of PLACES) assert.equal(shut.inRoom(p.id), false, `walked into the locked ${p.name}`);
  // the hunt is the same either way: every part, Golden Chip spot and the exit with the locks shut
  for (const c of COLLECTIBLES) assert.ok(shut.near(c.pos[0], c.pos[2], 0.85), `${c.name} is behind a lock`);
  for (const g of GOLDEN_SPOTS) assert.ok(shut.near(g.pos[0], g.pos[2], 0.85), `golden spot in ${g.room} is behind a lock`);
  assert.ok(shut.near((EXIT_ZONE.x0 + EXIT_ZONE.x1) / 2, (EXIT_ZONE.z0 + EXIT_ZONE.z1) / 2, 0.8), 'exit is behind a lock');
  const open = reach([...doorsOpen, ...standing, ...locks(true)]);
  for (const p of PLACES) assert.ok(open.inRoom(p.id), `can't get into the ${p.name} once it's unlocked`);
});

test('every chore, tool and lock can be reached and worked from where you can stand', () => {
  const open = reach([...doorsOpen, ...standing, ...locks(true)]);
  const shut = reach([...doorsOpen, ...standing, ...locks(false)]);
  for (const { chore, step } of STEPS) {
    const map = chore.place ? open : shut;      // a garden chore once the garden's open; the rest with everything locked
    assert.ok(map.near(step.pos[0], step.pos[2], 1.45), `${step.id} (${chore.name}) is out of reach`);
  }
  for (const t of TOOLS) assert.ok(shut.near(t.pos[0], t.pos[2], 1.3), `the ${t.id} is out of reach`);
  for (const p of PLACES) {
    const cx = (p.lock.a[0] + p.lock.b[0]) / 2, cz = (p.lock.a[1] + p.lock.b[1]) / 2;
    assert.ok(shut.near(cx, cz, 2.0), `can't walk up to the ${p.name}'s lock`);
  }
});

test('the treehouse is up in the tree, and the ladder joins it to the garden', () => {
  const deck = heightAt(3.0, 17.4), below = heightAt(3.0, 16.6);
  assert.ok(deck - below > 1.7, `deck only ${(deck - below).toFixed(2)} m up`);
  assert.ok(Math.abs(heightAt(3.0, 19.41) - deck) < 0.03, 'the ladder top meets the deck');
  assert.ok(Math.abs(heightAt(3.0, 20.79) - heightAt(3.0, 20.9)) < 0.05, 'the ladder foot meets the garden');
});
