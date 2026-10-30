// Run with: node --test tests/house/   (Node 22.18+ runs TypeScript directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticWorld, doorOBB, bodyOBB, moveAndSlide, blocked, resolve, PLAYER_R, type OBB } from '../../src/game/house/collision.ts';
import { DOORS, COLLECTIBLES, GOLDEN_SPOTS, SPAWN, EXIT_ZONE, PROPS, NPC_SPOTS, heightAt, type XZ } from '../../src/game/house/layout.ts';
import { CHARACTERS } from '../../src/game/house/characters.ts';

const world = buildStaticWorld();
const allDoors = (openness: number): OBB[] => DOORS.map((d) => doorOBB(d, openness));
const PICKUP = 0.85;

test('an exterior wall stops you however fast you run at it', () => {
  let p: XZ = [9, 5];
  for (let i = 0; i < 120; i++) p = moveAndSlide(p, 0.5, 0, PLAYER_R, world, allDoors(0));
  assert.ok(p[0] <= 11 - 0.1 - PLAYER_R + 1e-6, `ended at x=${p[0]}`);
  assert.ok(p[0] > 10.4, 'should have walked right up to the wall');
});

test('walking diagonally into a wall slides along it instead of sticking', () => {
  // lounge east wall, a stretch with no furniture (z 9.6..12.5 is clear past the TV unit)
  let p: XZ = [10.5, 12.4];
  const before = p[1];
  for (let i = 0; i < 20; i++) p = moveAndSlide(p, 0.05, -0.05, PLAYER_R, world, allDoors(0));
  assert.ok(before - p[1] > 0.7, `slid only ${before - p[1]} m`);
});

test('a shut door blocks its doorway and an open one does not', () => {
  const kids = DOORS.find((d) => d.id === 'kids')!;
  const others = DOORS.filter((d) => d !== kids).map((d) => doorOBB(d, 0));
  // walk east out of the hallway through the kids' doorway (z 1.5..2.3)
  const walk = (open: number) => {
    let p: XZ = [5.6, 1.9];
    for (let i = 0; i < 60; i++) p = moveAndSlide(p, 0.05, 0, PLAYER_R, world, [...others, doorOBB(kids, open)]);
    return p;
  };
  assert.ok(walk(0)[0] < 6.2, 'got through a shut door');
  assert.ok(walk(1)[0] > 7.0, 'could not get through an open door');
});

test('windows block movement (you cannot climb out of the lounge window)', () => {
  let p: XZ = [10.3, 4.7];
  for (let i = 0; i < 40; i++) p = moveAndSlide(p, 0.1, 0, PLAYER_R, world, allDoors(1));
  assert.ok(p[0] < 11, `passed the window to x=${p[0]}`);
});

test('resolve pushes a circle out of a box it starts inside', () => {
  const p = resolve([9.3, 8.2], PLAYER_R, world, []);      // centre of the coffee table
  assert.equal(blocked(p, PLAYER_R, world, []), false);
});

// Flood-fill the walkable floor from the spawn point on a 10 cm grid.
const GRID = { x0: -3.2, z0: -14.6, step: 0.1, nx: 196, nz: 390 };
function reachable(doors: OBB[], w = world, r = PLAYER_R) {
  const { x0, z0, step, nx, nz } = GRID;
  const key = (i: number, j: number) => i * nz + j;
  const seen = new Uint8Array(nx * nz);
  const free = (i: number, j: number) => !blocked([x0 + i * step, z0 + j * step], r, w, doors);
  const si = Math.round((SPAWN.pos[0] - x0) / step), sj = Math.round((SPAWN.pos[2] - z0) / step);
  assert.ok(free(si, sj), 'spawn point is inside something');
  const queue = [[si, sj]];
  seen[key(si, sj)] = 1;
  while (queue.length) {
    const [i, j] = queue.pop()!;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen[key(a, b)]) continue;
      if (!free(a, b)) continue;
      seen[key(a, b)] = 1;
      queue.push([a, b]);
    }
  }
  const near = (x: number, z: number, radius: number) => {
    for (let i = Math.floor((x - radius - x0) / step); i <= Math.ceil((x + radius - x0) / step); i++)
      for (let j = Math.floor((z - radius - z0) / step); j <= Math.ceil((z + radius - z0) / step); j++)
        if (i >= 0 && j >= 0 && i < nx && j < nz && seen[key(i, j)] && Math.hypot(x0 + i * step - x, z0 + j * step - z) <= radius) return true;
    return false;
  };
  const inside = (q: { x0: number; x1: number; z0: number; z1: number }) => {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const x = x0 + i * step, z = z0 + j * step;
      if (seen[key(i, j)] && x >= q.x0 && x <= q.x1 && z >= q.z0 && z <= q.z1) return true;
    }
    return false;
  };
  /** Every pair of neighbouring walkable cells whose floor heights differ by more than `limit`: a ledge you could walk off. */
  const cliffs = (limit: number) => {
    const out: string[] = [];
    for (let i = 0; i < nx - 1; i++) for (let j = 0; j < nz - 1; j++) {
      if (!seen[key(i, j)]) continue;
      const x = x0 + i * step, z = z0 + j * step, h = heightAt(x, z);
      for (const [a, b] of [[i + 1, j], [i, j + 1]]) {
        if (!seen[key(a, b)]) continue;
        const d = Math.abs(heightAt(x0 + a * step, z0 + b * step) - h);
        if (d > limit) out.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) drops ${d.toFixed(2)} m`);
      }
    }
    return out;
  };
  return { near, inside, cliffs };
}

test('with every door open, all 12 parts, every Golden Chip spot and the exit can be reached', () => {
  const map = reachable(allDoors(1));
  for (const c of COLLECTIBLES) assert.ok(map.near(c.pos[0], c.pos[2], PICKUP), `${c.name} in ${c.room} is out of reach`);
  for (const g of GOLDEN_SPOTS) assert.ok(map.near(g.pos[0], g.pos[2], PICKUP), `golden spot in ${g.room} is out of reach`);
  assert.ok(map.inside(EXIT_ZONE), 'exit zone is out of reach');
});

// everyone who stands (or sits on the ground) blocks you; people on chairs and sofas don't add anything
const standing = (): OBB[] => Object.values(NPC_SPOTS).filter((n) => n.collide).map((n) => bodyOBB(n.pos[0], n.pos[2]));

test('every character has a place in the house, and their ids and names are unique', () => {
  const ids = new Set(CHARACTERS.map((c) => c.id));
  assert.equal(ids.size, CHARACTERS.length, 'duplicate id');
  assert.equal(new Set(CHARACTERS.map((c) => c.name)).size, CHARACTERS.length, 'duplicate name');
  for (const c of CHARACTERS) assert.ok(NPC_SPOTS[c.id], `${c.name} has no spot in NPC_SPOTS`);
  assert.deepEqual(Object.keys(NPC_SPOTS).filter((k) => !ids.has(k as never)), [], 'spot for someone who is not a character');
});

test('nobody stands inside a wall or a piece of furniture', () => {
  for (const [id, n] of Object.entries(NPC_SPOTS)) {
    if (!n.collide) continue;
    assert.equal(blocked([n.pos[0], n.pos[2]], 0.2, world, allDoors(1)), false, `${id} is standing inside something`);
    assert.ok(Math.abs(n.pos[1] - heightAt(n.pos[0], n.pos[2])) < 0.05, `${id} is floating or sunk: y ${n.pos[1]} vs floor ${heightAt(n.pos[0], n.pos[2]).toFixed(2)}`);
  }
});

test('with the whole family standing about, every part, Golden Chip spot and the exit can still be reached', () => {
  const map = reachable([...allDoors(1), ...standing()]);
  for (const c of COLLECTIBLES) assert.ok(map.near(c.pos[0], c.pos[2], PICKUP), `${c.name} in ${c.room} is blocked by someone standing`);
  for (const g of GOLDEN_SPOTS) assert.ok(map.near(g.pos[0], g.pos[2], PICKUP), `golden spot in ${g.room} is blocked by someone standing`);
  assert.ok(map.inside(EXIT_ZONE), 'exit blocked by someone standing');
  const baby = reachable([...allDoors(1), ...standing()], buildStaticWorld({ crawl: true }), 0.22);
  for (const c of COLLECTIBLES) assert.ok(baby.near(c.pos[0], c.pos[2], PICKUP), `${c.name} blocked for the baby`);
  assert.ok(baby.inside(EXIT_ZONE));
});

test('nowhere can you walk off a ledge: every height change is a slope or stairs', () => {
  const found = reachable(allDoors(1)).cliffs(0.1);
  assert.deepEqual(found.slice(0, 8), [], `${found.length} ledges`);
});

test('a crawling baby reaches everything too, and fits under the dining table', () => {
  const crawlWorld = buildStaticWorld({ crawl: true });
  const map = reachable(allDoors(1), crawlWorld, 0.22);
  for (const c of COLLECTIBLES) assert.ok(map.near(c.pos[0], c.pos[2], PICKUP), `${c.name} out of reach for the baby`);
  assert.ok(map.inside(EXIT_ZONE));
  assert.ok(map.near(2.95, 10.7, 0.15), 'cannot crawl under the dining table');
  assert.equal(reachable(allDoors(1)).near(2.95, 10.7, 0.15), false, 'grown-ups should not fit under the table');
});

test('with every door shut you are stuck on the veranda', () => {
  const map = reachable(allDoors(0));
  assert.equal(map.inside({ x0: 6.3, x1: 10.9, z0: 3, z1: 12.8 }), false, 'walked into the lounge through a shut slider');
  assert.equal(map.inside(EXIT_ZONE), false);
});

test('no door swings through furniture', () => {
  const solids = PROPS.filter((p) => p.kind === 'box' && p.solid && p.min[1] < 1.2) as Extract<(typeof PROPS)[number], { kind: 'box' }>[];
  // a gate that can open either way is checked both ways
  const swings = DOORS.flatMap((d) => (d.kind !== 'hinged' ? [] : d.bothWays ? [d, { ...d, swing: -d.swing }] : [d]));
  for (const door of swings) {
    for (let k = 0; k <= 20; k++) {
      const b = doorOBB(door, k / 20);
      for (const s of solids) {
        // sample the panel's centreline against each box
        for (let t = -1; t <= 1; t += 0.1) {
          const x = b.cx + Math.cos(b.angle) * b.hx * t, z = b.cz + Math.sin(b.angle) * b.hx * t;
          const hit = x > s.min[0] && x < s.max[0] && z > s.min[2] && z < s.max[2];
          assert.ok(!hit, `${door.id} door hits furniture at openness ${k / 20}`);
        }
      }
    }
  }
});

test('from the spawn point, walking straight ahead goes in through the open half of the slider', () => {
  const doors = DOORS.map((d) => doorOBB(d, d.id === 'slider' ? 1 : 0));
  let p: XZ = [SPAWN.pos[0], SPAWN.pos[2]];
  for (let i = 0; i < 80; i++) p = moveAndSlide(p, 0, -0.05, PLAYER_R, world, doors);   // yaw 0 looks toward -z
  assert.ok(p[1] < 12, `stopped at z=${p[1]}`);
  let q: XZ = [SPAWN.pos[0], SPAWN.pos[2]];
  const shut = DOORS.map((d) => doorOBB(d, 0));
  for (let i = 0; i < 80; i++) q = moveAndSlide(q, 0, -0.05, PLAYER_R, world, shut);
  assert.ok(q[1] > 13, `walked through the shut slider to z=${q[1]}`);
});
