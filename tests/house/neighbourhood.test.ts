// Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticWorld, roamSolids, doorOBB, bodyOBB, blocked, PLAYER_R, JUMP_ROAM, type OBB, type StaticWorld } from '../../src/game/house/collision.ts';
import { DOORS, SPAWN, RAMPS, ROOMS, PROPS, BARRIERS, PROMO_SPOTS, heightAt, floorAt, roomAtLevel, jumpTop, PARKED, MASJID, MASJID_YARD, MCFARLANE, TEMPLE, TEMPLE_GATE, WORLD_EDGE, LOOKOUT_TOP, LOOKOUT_START, UPPER_REACH, ROAD_Y, type GameMode } from '../../src/game/house/layout.ts';
import { LOOKOUT, climbBox } from '../../src/game/house/towers.ts';
import { PLACES, lockOBB } from '../../src/game/house/chores.ts';
import { SHOP_INSIDES } from '../../src/game/house/shopInsides.ts';
import { USP, USP_BUILDINGS, uspFootprints } from '../../src/game/house/uspCampus.ts';
import { GARDEN_CITY, GC_UPPER, GC_STAIRS } from '../../src/game/house/gardenCity.ts';
import { DAMODAR_CITY } from '../../src/game/house/damodarCity.ts';
import { SHOP_SPOTS, SHOP_LINE, STREET, VISITOR_SPOTS, visitorCharacter } from '../../src/game/house/neighbourhood.ts';
import { handle, memoryStore, LIMITS, type Ctx } from '../../workers/neighbourhood/src/registry.ts';
import { cleanName, cleanLook } from '../../workers/neighbourhood/src/rules.ts';

const doorsOpen: OBB[] = DOORS.map((d) => doorOBB(d, 1));
const doorsShut: OBB[] = DOORS.map((d) => doorOBB(d, 0));
/** The temple's plot: its grounds behind the gate, and the strip between its gate and the road. */
const inTemplePlot = (x: number, z: number) => x > TEMPLE.x - TEMPLE.w / 2 - 0.05 && x < TEMPLE.x + TEMPLE.w / 2 + 0.05 && z > TEMPLE.z - TEMPLE.d / 2 - 0.05;
/** The temple's raised base and steps, and the masjid's two buildings (never walked into). */
const templeBase = (x: number, z: number) => x > TEMPLE.x - 4.55 && x < TEMPLE.x + 4.55 && z > TEMPLE.z - 6.65 && z < TEMPLE.z + 1.25;
const masjidBuildings = (x: number, z: number) => (x > MASJID.x - 1.5 && x < MASJID.x + 6.5 && z > MASJID.z - 2.5 && z < MASJID.z + 5.3) || (x > MASJID.x - 6.9 && x < MASJID.x - 1.5 && z > MASJID.z - 0.5 && z < MASJID.z + 5.3);
const masjidYard = (x: number, z: number) => x > MASJID.x - MASJID_YARD.sideX && x < MASJID.x + MASJID_YARD.sideX && z > MASJID.z + MASJID_YARD.steps.z1 + 0.2 && z < MASJID.z + MASJID_YARD.backZ;
const visitors: OBB[] = VISITOR_SPOTS.map((p) => bodyOBB(p[0], p[2]));

// flood-fill the floor from the spawn point on a 10 cm grid, over the house and the street near the gate
type Grid = { x0: number; z0: number; step: number; nx: number; nz: number };
const FINE: Grid = { x0: -12.5, z0: -14.6, step: 0.1, nx: 450, nz: 470 };
/** All of the walkable part of Raiwai (McFarlane Road end to end, the side road, Garden City, the USP campus), on a 20 cm grid. */
const RAIWAI_G: Grid = { x0: -63, z0: -42, step: 0.2, nx: 1685, nz: 575 };
/** As if you could jump over every piece of furniture and every loose thing (more than a jump can really do). */
const hopAll = (w: StaticWorld): StaticWorld => ({ rects: w.rects.filter((q) => q.top === undefined), circles: w.circles.filter((c) => c.top === undefined) });
/** The whole free-roam map (exploring), on a 50 cm grid. */
const WORLD_G: Grid = { x0: WORLD_EDGE.x0 + 0.5, z0: WORLD_EDGE.z0 + 0.5, step: 0.5, nx: Math.floor((WORLD_EDGE.x1 - WORLD_EDGE.x0 - 1) / 0.5) + 1, nz: Math.floor((WORLD_EDGE.z1 - WORLD_EDGE.z0 - 1) / 0.5) + 1 };
/** The world's solids sorted into 4 m squares, so a spot is only tested against what's near it. */
function nearby(world: StaticWorld, cell = 4): (x: number, z: number) => StaticWorld {
  const buckets = new Map<number, StaticWorld>();
  const key = (i: number, j: number) => i * 100003 + j;
  const pad = PLAYER_R + 0.05;
  const put = (x0: number, z0: number, x1: number, z1: number, add: (w: StaticWorld) => void) => {
    for (let i = Math.floor((x0 - pad) / cell); i <= Math.floor((x1 + pad) / cell); i++) for (let j = Math.floor((z0 - pad) / cell); j <= Math.floor((z1 + pad) / cell); j++) {
      let b = buckets.get(key(i, j));
      if (!b) buckets.set(key(i, j), (b = { rects: [], circles: [] }));
      add(b);
    }
  };
  for (const r of world.rects) put(r.x0, r.z0, r.x1, r.z1, (b) => b.rects.push(r));
  for (const c of world.circles) put(c.x - c.r, c.z - c.r, c.x + c.r, c.z + c.r, (b) => b.circles.push(c));
  const none: StaticWorld = { rects: [], circles: [] };
  return (x, z) => buckets.get(key(Math.floor(x / cell), Math.floor(z / cell))) ?? none;
}
function reach(mode: GameMode, extra: OBB[] = [], G: Grid = FINE, start: [number, number] = [SPAWN.pos[0], SPAWN.pos[2]], jumping = false, doors: OBB[] = doorsOpen) {
  const near = nearby(jumping ? hopAll(buildStaticWorld({ mode })) : buildStaticWorld({ mode }));
  const obstacles = [...doors, ...extra];
  const seen = new Uint8Array(G.nx * G.nz);
  const free = (i: number, j: number) => { const x = G.x0 + i * G.step, z = G.z0 + j * G.step; return !blocked([x, z], PLAYER_R, near(x, z), obstacles); };
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
  const close = (x: number, z: number, r: number) => {
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
        // two spots on the same stairs; or, on a coarse grid, a spot on stairs beside the landing it meets
        const onRamp = ([px, pz]: number[]) => RAMPS.some((r) => px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1);
        if (RAMPS.some((r) => [[x, z], [xa, za]].every(([px, pz]) => px >= r.x0 && px <= r.x1 && pz >= r.z0 && pz <= r.z1))) continue;
        if (G.step > 0.25 && (onRamp([x, z]) || onRamp([xa, za]))) continue;
        const d = Math.abs(heightAt(xa, za) - heightAt(x, z));
        if (d > 0.1) out.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) drops ${d.toFixed(2)} m`);
      }
    }
    return out;
  };
  return { at, near: close, any, cliffs };
}

test('the hunt keeps you in the compound: you never get out onto the street', () => {
  const hunt = reach('hunt');
  assert.equal(hunt.any((_x, z) => z > 24.0), false, 'walked past the finish line in the hunt');
});

test('jumping never gets you out of the compound in the hunt, even hopping over every piece of furniture', () => {
  const hunt = reach('hunt', [], FINE, undefined, true);
  assert.equal(hunt.any((_x, z) => z > 24.0), false, 'jumped out past the finish line in the hunt');
  assert.equal(hunt.any((x, z) => z < 21.9 && (x < -2.75 || x > 15.75)), false, 'jumped over the compound fence');
});

test('exploring: from the house out of the gate onto McFarlane Road, with no ledge on the way', () => {
  const map = reach('explore', visitors, FINE);
  assert.ok(map.near(14, 26, 0.5), "can't get from the house out of the gate onto McFarlane Road");
  assert.deepEqual(map.cliffs().slice(0, 6), [], 'a ledge on the way to the street');
});

let raiwai: ReturnType<typeof reach> | undefined;
const raiwaiMap = () => (raiwai ??= reach('explore', visitors, RAIWAI_G, [14, 25]));
let world: ReturnType<typeof reach> | undefined;
const worldMap = () => (world ??= reach('explore', visitors, WORLD_G, [14, 25]));
const GC = GARDEN_CITY!;
const inGardenCity = (x: number, z: number) => x > GC.x0 - 0.05 && x < GC.x1 + 0.05 && z < GC.z1 + 0.05;
const DC = DAMODAR_CITY!;
const inCompound = (x: number, z: number) => x > -2.75 && x < 15.75 && z > -14.05 && z < 21.95;
/** Inside a solid box (a building), away from its walls. */
const inside = (r: { x0: number; x1: number; z0: number; z1: number }, pad = 0.35) => (x: number, z: number) => x > r.x0 + pad && x < r.x1 - pad && z > r.z0 + pad && z < r.z1 - pad;
const lookoutBox = climbBox(LOOKOUT);

test('free roam: from the gate you can walk anywhere in Raiwai, out to the hills and the shore, but never past the edge or into a building', () => {
  const map = worldMap();
  const places: [string, number, number][] = [
    ['McFarlane Road, west past where it used to stop', -100, 26], ['McFarlane Road, east past the USP campus', 285, 26],
    ['the side road, and on up past its end', 37, -110], ['the hills to the north-west', -140, -120], ['the north-east corner', 290, -120],
    ['the training ground', 158, 61], ['behind the sheds', 110, 150], ['the shore', 100, 258], ['round the arena', 215, 240],
    ['the back of the shops', -20, 40], ['round behind Garden City', 55, 60], ['the neighbours\' yards across the side road', 46, 5],
  ];
  for (const [name, x, z] of places) assert.ok(map.near(x, z, 1.0), `can't walk to ${name} (${x}, ${z})`);
  assert.equal(map.any((x, z) => x < WORLD_EDGE.x0 || x > WORLD_EDGE.x1 || z < WORLD_EDGE.z0 || z > WORLD_EDGE.z1), false, 'walked off the edge of the map');
  for (const r of roamSolids().rects) assert.equal(map.any(inside(r)), false, `walked into the building at ${((r.x0 + r.x1) / 2).toFixed(0)}, ${((r.z0 + r.z1) / 2).toFixed(0)}`);
  for (const b of USP_BUILDINGS) for (const r of Object.values(uspFootprints(b))) assert.equal(map.any(inside(r, 0.1)), false, `walked into the USP block at ${b.x}, ${b.z}`);
  for (const c of PARKED) assert.equal(map.near(c.x, c.z, 0.3), false, `walked through the parked ${c.kind} at ${c.x}, ${c.z}`);
  const outside = map.cliffs().filter((m) => { const [x, z] = m.slice(1, m.indexOf(')')).split(',').map(Number); return !inCompound(x, z); });
  assert.deepEqual(outside.slice(0, 6), [], 'a ledge out in Raiwai');
});

test('free roam: jumping clears fences and walls, but never the edge of the map, a building, a locked place, or a place of worship\'s walls', () => {
  // with every door and gate shut, and the chores' places still locked
  const hop = reach('explore', [...visitors, ...PLACES.map(lockOBB)], WORLD_G, [14, 25], true, doorsShut);
  assert.equal(hop.any((x, z) => x < WORLD_EDGE.x0 || x > WORLD_EDGE.x1 || z < WORLD_EDGE.z0 || z > WORLD_EDGE.z1), false, 'jumped off the edge of the map');
  for (const r of roamSolids().rects) assert.equal(hop.any(inside(r)), false, `jumped into the building at ${((r.x0 + r.x1) / 2).toFixed(0)}, ${((r.z0 + r.z1) / 2).toFixed(0)}`);
  for (const b of USP_BUILDINGS) for (const r of Object.values(uspFootprints(b))) assert.equal(hop.any(inside(r, 0.1)), false, `jumped into the USP block at ${b.x}, ${b.z}`);
  assert.equal(hop.any(templeBase), false, "jumped onto the temple's base");
  assert.equal(hop.any(masjidBuildings), false, 'jumped into the masjid');
  assert.equal(hop.any((x, z) => inTemplePlot(x, z) && z < TEMPLE_GATE.z - 0.2), false, "jumped over the temple's walls with its gate shut");
  assert.equal(hop.any(masjidYard), false, "jumped over the masjid's walls with its gate shut");
  for (const pl of PLACES) {
    const r = ROOMS.find((q) => q.id === pl.id)!;
    assert.equal(hop.any(inside(r, 0.3)), false, `jumped into the locked ${pl.name}`);
  }
  assert.equal(hop.any((x, z) => inGardenCity(x, z) && z > GC.z1 - 0.15), false, "jumped through Garden City's back wall");
  // and jumping does get you over the compound's fences and Garden City's palisade, gate shut or not
  assert.ok(hop.near(-8, 0, 1) && hop.near(20, -5, 1), "can't jump the compound's fences");
  assert.ok(hop.any((x, z) => inGardenCity(x, z) && z > GC.z0 + 1 && z < GC.walk), "can't jump Garden City's palisade with its gate shut");
});

test('exploring: fences, garden walls, railings and low walls can be jumped; walls, buildings, gates, worship walls, the tower and the edge of the map never', () => {
  const ok = new Set(['fence', 'block', 'woven', 'picket', 'grille', 'rail', 'low']);
  for (const b of BARRIERS) {
    const top = jumpTop(b);
    if (top === undefined) continue;
    assert.ok(ok.has(b.kind) || b.jump, `a ${b.kind} at [${b.a}] can be jumped`);
    assert.ok(!b.noJump, `a locked place's ${b.kind} at [${b.a}] can be jumped`);
    assert.ok(top > Math.max(heightAt(...b.a), heightAt(...b.b)), `the ${b.kind} at [${b.a}] has its top below the ground`);
  }
  const near = (b: (typeof BARRIERS)[number], r: { x0: number; x1: number; z0: number; z1: number }) => [b.a, b.b].every(([x, z]) => x >= r.x0 - 0.01 && x <= r.x1 + 0.01 && z >= r.z0 - 0.01 && z <= r.z1 + 0.01);
  for (const b of BARRIERS.filter((q) => q.mode === 'explore')) {
    if (near(b, lookoutBox)) assert.equal(jumpTop(b), undefined, `the lookout's ${b.kind} at [${b.a}] can be jumped`);
    if ([b.a, b.b].some(([x, z]) => x <= WORLD_EDGE.x0 || x >= WORLD_EDGE.x1 || z <= WORLD_EDGE.z0 || z >= WORLD_EDGE.z1)) assert.equal(jumpTop(b), undefined, 'the edge of the map can be jumped');
  }
  for (const b of BARRIERS.filter((q) => q.kind === 'facade' || q.kind === 'wall')) assert.equal(jumpTop(b), undefined, `a ${b.kind} at [${b.a}] can be jumped`);
});

test('the Raiwai Lookout: up its stairs from the north-west corner to its roof 20 m up, with no ledge on the way, and no other way up', () => {
  const map = worldMap();
  const [sx, sz] = LOOKOUT_START;
  const xw = LOOKOUT.cx - LOOKOUT.hx, xe = LOOKOUT.cx + LOOKOUT.hx, zn = LOOKOUT.cz - LOOKOUT.hz, zs = LOOKOUT.cz + LOOKOUT.hz;
  assert.ok(map.near(sx, sz, 0.6), "can't walk to the bottom of the lookout's stairs");
  assert.ok(map.near(LOOKOUT.cx, LOOKOUT.cz, 0.5), "can't walk up onto the lookout's roof");
  assert.equal(Math.round((LOOKOUT_TOP - heightAt(sx, sz)) * 10) / 10, 20, 'the roof should be 20 m up');
  assert.equal(heightAt(LOOKOUT.cx, LOOKOUT.cz), LOOKOUT_TOP);
  // the way up is one long climb, never a jump: every step up the strip is small
  const strip: [number, number][] = [];
  for (let x = xw; x <= xe + 0.7; x += 0.25) strip.push([x, zn - 0.7]);
  for (let z = zn - 0.7; z <= zs + 0.7; z += 0.25) strip.push([xe + 0.7, z]);
  for (let x = xe + 0.7; x >= xw - 0.7; x -= 0.25) strip.push([x, zs + 0.7]);
  for (let z = zs + 0.7; z >= zn + 0.3; z -= 0.25) strip.push([xw - 0.7, z]);
  strip.push([xw + 0.4, zn + 2]);
  for (let i = 1; i < strip.length; i++) assert.ok(Math.abs(heightAt(...strip[i]) - heightAt(...strip[i - 1])) < 0.16, `a step on the lookout's stairs at ${strip[i]}`);
  // with the stairs' rails and the walls taken away, the roof is a 20 m wall: a jump (2.7 m) never gets you up
  assert.ok(LOOKOUT_TOP - heightAt(sx, sz) > 2.7 * 5);
});

test('the shops along McFarlane Road: in through each door when it is open, not when it is shut', () => {
  const open = raiwaiMap();
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  const insides = ROOMS.filter((r) => r.id.startsWith('in-'));
  assert.ok(insides.length >= SHOP_INSIDES.length, 'every shop should have an inside');
  for (const r of insides) {
    const inRoom = (x: number, z: number) => x > r.x0 + 0.05 && x < r.x1 - 0.05 && z > r.z0 + 0.3 && z < r.z1 - 0.05;
    assert.ok(open.any(inRoom), `can't walk into ${r.name} with its door open`);
    assert.equal(shut.any(inRoom), false, `walked into ${r.name} with its door shut`);
  }
});

test('Garden City: its gate stands open; in across the car park and into every unit, the last one with the stairs up', () => {
  const map = raiwaiMap();
  const uw = (GC.x1 - GC.x0) / GC.units;
  const gates = DOORS.filter((d) => d.id.startsWith('gc-gate'));
  assert.equal(gates.length, 2);
  for (const g of gates) assert.ok(g.kind === 'hinged' && g.startOpen, `${g.id} should start open`);
  assert.ok(map.near((GC.gate[0] + GC.gate[1]) / 2, GC.z0 + 1.5, 0.4), "can't get in through Garden City's gate");
  assert.ok(map.near((GC.gate[0] + GC.gate[1]) / 2, GC.walk + 1, 0.4), "can't cross the car park to the building");
  for (let k = 0; k < GC.units; k++) assert.ok(map.near(GC.x0 + (k + 0.5) * uw - (k === GC.units - 1 ? 0.8 : 0), (GC.build + GC.z1) / 2 + 2, 1.2), `can't walk into unit ${k + 1}`);
  assert.ok(map.near((GC_STAIRS.x0 + GC.x1) / 2, GC_STAIRS.z0 + 0.3, 0.3), "can't walk up to the bottom of the stairs");
  // the floor plan is drawn at ground level: the stairs are reached only from the bottom step, never over their side wall
  assert.equal(map.any((x, z) => x > GC_STAIRS.x0 && x < GC.x1 && z > GC_STAIRS.z0 + 1.0 && z < GC.z1 && heightAt(x, z) < ROAD_Y + 0.4), false, 'got onto the stairs over their side');
  assert.equal(map.any((x, z) => inGardenCity(x, z) && z > GC.z1 - 0.15), false, 'walked through the back wall');
});

/**
 * Walk Garden City on both floors: a flood fill on a 10 cm grid where each
 * spot carries the height of your feet (the floor under you: floorAt), so the
 * same spot can be reached downstairs and upstairs. A step to a neighbour that
 * changes your height by more than a stair's tread is a ledge.
 */
function gardenCityFloors(doors: OBB[] = doorsOpen) {
  const near = nearby(buildStaticWorld({ mode: 'explore' }));
  const obstacles = [...doors, ...visitors];
  const G = { x0: GC.x0 - 0.5, z0: GC.walk - 1.5, step: 0.1, nx: Math.round((GC.x1 - GC.x0 + 1) / 0.1) + 1, nz: Math.round((GC.z1 - GC.walk + 2) / 0.1) + 1 };
  const UP = ROAD_Y + GC_UPPER.rise;
  const band = (feet: number) => (feet > ROAD_Y + GC_UPPER.rise / 2 ? 1 : 0);
  const seen = [new Float64Array(G.nx * G.nz).fill(NaN), new Float64Array(G.nx * G.nz).fill(NaN)];
  const ledges: string[] = [];
  const si = Math.round(((GC_STAIRS.x0 + GC.x1) / 2 - 0.3 - G.x0) / G.step), sj = Math.round((GC.walk + 1 - G.z0) / G.step);
  const q: [number, number, number][] = [[si, sj, ROAD_Y]];
  seen[0][si * G.nz + sj] = ROAD_Y;
  while (q.length) {
    const [i, j, feet] = q.pop()!;
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= G.nx || b >= G.nz) continue;
      const x = G.x0 + a * G.step, z = G.z0 + b * G.step;
      const f = floorAt(x, z, feet);
      if (blocked([x, z], PLAYER_R, near(x, z), obstacles, f)) continue;
      if (Math.abs(f - feet) > 0.16) { ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}): ${feet.toFixed(2)} to ${f.toFixed(2)}`); continue; }
      const s = seen[band(f)];
      if (!Number.isNaN(s[a * G.nz + b])) continue;
      s[a * G.nz + b] = f;
      q.push([a, b, f]);
    }
  }
  const cell = (x: number, z: number) => Math.round((x - G.x0) / G.step) * G.nz + Math.round((z - G.z0) / G.step);
  const at = (floor: 0 | 1, x: number, z: number, r = 0.25) => {
    for (let dx = -r; dx <= r + 1e-9; dx += G.step) for (let dz = -r; dz <= r + 1e-9; dz += G.step) if (!Number.isNaN(seen[floor][cell(x + dx, z + dz)])) return true;
    return false;
  };
  const any = (floor: 0 | 1, f: (x: number, z: number, feet: number) => boolean) => {
    for (let i = 0; i < G.nx; i++) for (let j = 0; j < G.nz; j++) { const v = seen[floor][i * G.nz + j]; if (!Number.isNaN(v) && f(G.x0 + i * G.step, G.z0 + j * G.step, v)) return true; }
    return false;
  };
  return { at, any, ledges, UP };
}

test('Garden City: up the stairs to the first floor, along its corridor and into every unit, with no ledge and no other way up', () => {
  const m = gardenCityFloors();
  const uw = (GC.x1 - GC.x0) / GC.units, ux = (k: number) => GC.x0 + k * uw;
  const { corridor: UZ } = GC_UPPER;
  const FZ = GC.build + 0.4;
  assert.deepEqual(m.ledges, [], 'a ledge on the way');
  // up the stairs to the landing at the top, and on to the first floor
  assert.ok(m.at(1, (GC_STAIRS.x0 + GC.x1) / 2, (GC_STAIRS.z1 + GC.z1) / 2), "can't climb to the landing at the top of the stairs");
  assert.ok(m.at(1, (GC.x0 + GC_STAIRS.x0) / 2, (FZ + UZ) / 2), "can't walk the first floor's corridor");
  for (let k = 0; k < GC.units - 1; k++) assert.ok(m.at(1, ux(k) + uw / 2, (UZ + GC.z1) / 2), `can't walk into unit ${k + 1} upstairs`);
  assert.ok(m.at(1, (ux(GC.units - 1) + GC_STAIRS.x0) / 2, (UZ + GC.z1) / 2), "can't walk round the stairs' lobby upstairs");
  // upstairs you walk over the walls between the shops below, but not through the walls between the units up there
  assert.ok(m.at(1, ux(1), (FZ + UZ) / 2, 0.1), 'the corridor upstairs is cut by a wall from downstairs');
  assert.ok(m.at(0, ux(2) + uw / 2, UZ, 0.1), "downstairs, a unit's front upstairs is in the way");
  assert.equal(m.any(1, (x, z) => Math.abs(x - ux(1)) < 0.2 && z > UZ + 0.4), false, 'walked through a wall between units upstairs');
  // upstairs is all inside the building: never out over the canopy, through a wall, or into the stairwell
  assert.equal(m.any(1, (x, z) => x < GC.x0 + 0.15 || x > GC.x1 - 0.15 || z < FZ + 0.1 || z > GC.z1 - 0.15), false, 'got out of the first floor');
  assert.equal(m.any(1, (x, z, feet) => x > GC_STAIRS.x0 && z < GC_STAIRS.z1 - 0.3 && Math.abs(feet - heightAt(x, z)) > 0.01), false, 'fell into the stairwell, or floated over it');
  assert.equal(m.any(1, (_x, _z, feet) => Math.abs(feet - m.UP) > 0.01 && feet > m.UP), false, 'stood higher than the first floor');
  // downstairs never lands on the first floor's height (the only way up is the stairs)
  assert.equal(m.any(0, (x, z, feet) => feet > ROAD_Y + 0.3 && !(x > GC_STAIRS.x0 && z < GC_STAIRS.z1)), false, 'got up off the ground floor somewhere other than the stairs');
  // the bench upstairs in the lobby is in the way upstairs, not downstairs
  const bench: [number, number] = [ux(GC.units - 1) + 0.7, 53.4];
  assert.ok(m.at(0, ...bench, 0.1), 'downstairs, the bench upstairs is in the way');
  assert.equal(m.at(1, ...bench, 0.1), false, 'walked through the bench upstairs');
});

test('Garden City: a jump never reaches the first floor, and every ceiling keeps your head under it', () => {
  const UP = ROAD_Y + GC_UPPER.rise;
  assert.ok(JUMP_ROAM.up < GC_UPPER.rise - UPPER_REACH, 'a jump from the ground floor could land you upstairs');
  const room = (id: string) => ROOMS.find((r) => r.id === id)!;
  assert.ok(room('gcunits').cap! <= ROAD_Y + 3.5, "the ground floor's ceiling is above the first floor's slab");
  for (const id of ['gcup', 'gcup-lobby', 'gcup-0', 'gcstairs']) assert.ok(room(id).cap! <= ROAD_Y + GC_UPPER.ceiling && room(id).cap! - UP > 2.5, `${id}'s ceiling`);
  // where the floors overlap, the room is the one at your level
  const x = GC.x0 + 2.6, z = 52;
  assert.equal(roomAtLevel(x, z, ROAD_Y)?.id, 'gcunits');
  assert.equal(roomAtLevel(x, z, ROAD_Y + 1.6)?.id, 'gcunits', 'a jump downstairs is still downstairs');
  assert.equal(roomAtLevel(x, z, UP)?.id, 'gcup-0');
  assert.equal(roomAtLevel((GC_STAIRS.x0 + GC.x1) / 2, 50, heightAt((GC_STAIRS.x0 + GC.x1) / 2, 50))?.id, 'gcstairs');
});

test('Garden City: in through its gate and Westpac\'s doors when they are open, not when they are shut', () => {
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  assert.equal(shut.any((x, z) => inGardenCity(x, z) && z > GC.z0 + 0.4), false, "got into Garden City with its gate shut");
  const westpac = ROOMS.find((r) => r.id === 'gcunits')!;
  assert.ok(raiwaiMap().any((x, z) => x > westpac.x0 && z > GC.build + 1), "can't get into Garden City's units with the gate open");
});

test('Garden City: Westpac is open, its ATMs within reach', () => {
  const map = raiwaiMap();
  const u = GC.x0 + GC.westpac * ((GC.x1 - GC.x0) / GC.units);
  assert.ok(map.near(u + 0.95, 47.7, 0.3) && map.near(u + 0.95, 48.8, 0.3), "can't walk up to Westpac's ATMs");
  assert.ok(map.near(u + 2.6, 53.0, 0.3), "can't walk up to Westpac's counter");
  assert.equal(map.any((x, z) => x > u + 0.6 && x < u + 4.6 && z > 54.35 && z < GC.z1), false, "got behind Westpac's counter");
});

test('Damodar City: in from the road, round the car park and along the shops; into every shop, BSP, Vodafone, Digicel, Bondwell and the cinema through their doors', () => {
  const map = raiwaiMap();
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  const bx0 = DC.x0 + DC.bsp * DC.unitW, bx1 = bx0 + DC.unitW;
  assert.ok(map.near((DC.in0 + DC.in1) / 2, DC.back - 2, 0.5), "can't walk in from McFarlane Road");
  assert.ok(map.near(DC.x0 + 12, 47, 0.5) && map.near(DC.x1 - 5, 47, 0.5), "can't cross the car park");
  assert.ok(map.near(DC.x0 + 2, DC.front - 1, 0.5) && map.near(DC.x1 - 3, DC.front - 1, 0.5), "can't walk the length of the shops");
  const insides = ROOMS.filter((r) => /^(dcu-|dcw-|dcbsp|dcbondwell|dcdigicel|dcvodafone|dccinema)/.test(r.id));
  assert.equal(insides.length, DC.units - 1 + 3 + 1 + 1, 'every shop, BSP, Vodafone, Digicel, Bondwell, the cinema and the wing shops should have an inside');
  for (const r of insides) {
    const inRoom = (x: number, z: number) => x > r.x0 + 0.3 && x < r.x1 - 0.3 && z > r.z0 + 0.3 && z < r.z1 - 0.3;
    assert.ok(map.any(inRoom), `can't walk into ${r.name} (${r.id}) with its door open`);
    assert.equal(shut.any(inRoom), false, `walked into ${r.name} (${r.id}) with its door shut`);
  }
  assert.ok(map.near(bx0 + 0.9, 59.8, 0.3), "can't walk up to BSP's ATMs");
  assert.equal(map.any((x, z) => x > bx0 && x < bx1 && z > 66.75 && z < DC.z1), false, "got behind BSP's counter");
  // side by side along the block, west to east: Vodafone, BSP, Digicel, Bondwell
  assert.equal(DC.vodafone, DC.bsp - 1, 'Vodafone should be the next unit west of BSP');
  assert.equal(DC.digicel, DC.bsp + 1, 'Digicel should be the next unit east of BSP');
  assert.equal(DC.bondwell, DC.digicel + 1, 'Bondwell should be the next unit east of Digicel');
  for (const [id, name] of [['dcvodafone', 'Vodafone, Damodar City'], ['dcdigicel', 'Digicel, Damodar City']]) assert.equal(ROOMS.find((r) => r.id === id)?.name, name);
  // Bondwell, the ICT shop: up to its laptops and its counter, never behind it
  const wx0 = DC.x0 + DC.bondwell * DC.unitW, wx1 = wx0 + DC.unitW;
  assert.equal(ROOMS.find((r) => r.id === 'dcbondwell')?.name, 'Bondwell, Damodar City');
  assert.ok(map.near((wx0 + wx1) / 2, 62.2, 0.3), "can't walk between Bondwell's laptop tables");
  assert.ok(map.near(wx0 + 1.1, 62.2, 0.2) && map.near(wx1 - 0.8, 62.2, 0.2), "can't walk down the aisles either side of Bondwell's tables");
  assert.ok(map.near((wx0 + wx1) / 2, 65.6, 0.3), "can't walk up to Bondwell's counter");
  assert.equal(map.any((x, z) => x > wx0 && x < wx1 && z > 66.8 && z < DC.z1), false, "got behind Bondwell's counter");
  for (const c of PARKED) assert.equal(map.near(c.x, c.z, 0.3), false, `walked through the parked car at ${c.x}, ${c.z}`);
});

test('Damodar City: a reward card is hidden in Digicel and in Vodafone, inside, within reach once you find it, and only through the door', () => {
  const map = raiwaiMap();
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  assert.equal(PROMO_SPOTS.length, 2);
  for (const sp of PROMO_SPOTS) {
    const room = ROOMS.find((r) => r.id === sp.room)!;
    assert.equal(sp.room, `dc${sp.id}`);
    assert.ok(sp.x > room.x0 && sp.x < room.x1 && sp.z > room.z0 && sp.z < room.z1, `${sp.id}'s card isn't inside its shop`);
    // (the engine only offers it from inside the shop, so outside the window doesn't count)
    const reachable = (x: number, z: number) => x > room.x0 && x < room.x1 && z > room.z0 && z < room.z1 && Math.hypot(x - sp.x, z - sp.z) < 1.3;
    assert.ok(map.any(reachable), `can't get within reach of ${sp.id}'s card`);
    assert.equal(shut.any(reachable), false, `reached ${sp.id}'s card with the door shut`);
    // hidden: not out in the open in the middle of the shop, but in a corner (by a wall, behind or on something)
    assert.ok(Math.min(sp.x - room.x0, room.x1 - sp.x) < 1.0, `${sp.id}'s card is out in the open`);
  }
  // Digicel's is on the floor behind the banner; Vodafone's on top of the cabinet, over your head
  const by = Object.fromEntries(PROMO_SPOTS.map((s) => [s.id, s]));
  assert.ok(Math.abs(by.digicel.y - by.digicel.ground) < 0.05);
  assert.ok(by.vodafone.y - by.vodafone.ground > 1.9);
});

test('the Howell Road Hindu Temple: to the right out of the gate; into its grounds through its gate when open, not when shut, never onto its base', () => {
  assert.ok(TEMPLE.x < -2.7, 'the temple should be to the right (west) of the gate');
  const grounds = (x: number, z: number) => inTemplePlot(x, z) && z < TEMPLE_GATE.z - 0.2;
  const open = raiwaiMap();
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  assert.ok(open.near(TEMPLE.x, 22.0, 0.3), "can't walk up to the temple's gate");
  assert.ok(open.near(TEMPLE.x, TEMPLE.z + 3.2, 0.4), "can't walk into the temple's grounds with the gate open");
  assert.equal(shut.any(grounds), false, "walked into the temple's grounds with the gate shut");
  assert.equal(open.any(templeBase), false, "walked onto the temple's base");
  for (const c of PARKED) assert.ok(c.z > 25 || Math.abs(c.x - TEMPLE.x) > 4, `a car is parked across the temple's gate at x ${c.x}`);
});

test('the Raiwai Jame Masjid: McFarlane Road goes on to it; up its steps and through its gate into the yard when open, never into the buildings', () => {
  const open = raiwaiMap();
  const shut = reach('explore', visitors, RAIWAI_G, [14, 25], false, doorsShut);
  const steps = MASJID_YARD.steps;
  assert.ok(open.near(MASJID.x, SHOP_LINE - 0.5, 0.5), "can't walk along McFarlane Road to the masjid");
  assert.ok(shut.near(MASJID.x + (steps.x0 + steps.x1) / 2, MASJID.z + steps.z0 + 0.6, 0.3), "can't climb the masjid's steps to its gate");
  assert.ok(open.near(MASJID.x + 2, MASJID.z - 4.5, 0.4), "can't get into the masjid's yard with its gate open");
  assert.equal(shut.any(masjidYard), false, "got into the masjid's yard with its gate shut");
  assert.equal(open.any(masjidBuildings), false, 'walked into the masjid');
  assert.equal(open.any((x, z) => z > SHOP_LINE + 0.05 && z < MASJID.z + MASJID_YARD.wallZ && x > MASJID.x - MASJID.w / 2 && x < MASJID.x + MASJID.w / 2 && !(x > MASJID.x + steps.x0 - 0.05 && x < MASJID.x + steps.x1 + 0.05)), false, 'stepped off the side of the masjid steps');
});

test('the USP campus: in from the end of McFarlane Road, round the plaza and all round the buildings, not through them', () => {
  assert.equal(USP.x0, MCFARLANE.x1, "the campus doesn't start where McFarlane Road ends");
  const map = raiwaiMap();
  assert.ok(map.near(USP.x0 + 8, 26, 0.5), "can't walk from McFarlane Road into the campus");
  assert.ok(map.near(246, 28, 0.5) && map.near(240, 39.5, 0.5), "can't reach the plaza or its shelter");
  for (const b of USP_BUILDINGS) {
    const { body } = uspFootprints(b);
    // the front, and the far side: you can walk all the way round
    const front = b.face === 'n' ? [b.x, body.z0 - 0.6] : b.face === 'w' ? [body.x0 - 0.6, b.z] : b.face === 's' ? [b.x, body.z1 + 0.6] : [body.x1 + 0.6, b.z];
    const back = b.face === 'n' ? [b.x, body.z1 + 0.8] : b.face === 'w' ? [body.x1 + 0.8, b.z] : b.face === 's' ? [b.x, body.z0 - 0.8] : [body.x0 - 0.8, b.z];
    assert.ok(map.near(front[0], front[1], 0.5), `can't walk up to the front of the block at ${b.x}, ${b.z}`);
    assert.ok(map.near(back[0], back[1], 0.5), `can't walk round behind the block at ${b.x}, ${b.z}`);
    for (const r of Object.values(uspFootprints(b))) {
      assert.equal(map.any((x, z) => x > r.x0 + 0.1 && x < r.x1 - 0.1 && z > r.z0 + 0.1 && z < r.z1 - 0.1), false, `walked into the block at ${b.x}, ${b.z}`);
    }
  }
});

test('the LvTS plaque: once on each shop, centre, cinema and USP block, small, and never on a place of worship', () => {
  const plaques = PROPS.filter((p) => p.kind === 'box' && p.tex?.startsWith('lvts:')) as Extract<(typeof PROPS)[number], { kind: 'box' }>[];
  // 6 shops on McFarlane Road (Sardaar Complex once), Damodar City's main block, wing and cinema, Garden City, 4 USP blocks
  assert.equal(plaques.length, 14, `${plaques.length} plaques`);
  for (const p of plaques) {
    const [x0, y0, z0] = p.min, [x1, y1, z1] = p.max;
    const w = Math.max(x1 - x0, z1 - z0), h = y1 - y0;
    assert.ok(w <= 0.91 && h <= 0.43, `a plaque is ${w.toFixed(2)} by ${h.toFixed(2)} m: too big next to the shop signs`);
  }
  const plots = [
    { name: 'the Raiwai Jame Masjid', x0: MASJID.x - MASJID.w / 2 - 1, x1: MASJID.x + MASJID.w / 2 + 1, z0: MASJID.z - MASJID.d / 2 - 2, z1: MASJID.z + MASJID.d / 2 + 1 },
    { name: 'the Howell Road Hindu Temple', x0: TEMPLE.x - TEMPLE.w / 2 - 1, x1: TEMPLE.x + TEMPLE.w / 2 + 1, z0: TEMPLE.z - TEMPLE.d / 2 - 1, z1: TEMPLE.z + TEMPLE.d / 2 + 1 },
    { name: 'the Methodist Church', x0: 92, x1: 114, z0: -32, z1: -2 },
  ];
  for (const q of plots) for (const p of plaques) {
    const cx = (p.min[0] + p.max[0]) / 2, cz = (p.min[2] + p.max[2]) / 2;
    assert.ok(!(cx > q.x0 && cx < q.x1 && cz > q.z0 && cz < q.z1), `a plaque on ${q.name}`);
  }
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
