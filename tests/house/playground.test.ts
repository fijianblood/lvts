// Run with: node --test "tests/house/*.test.ts"   (Node 22.18+)
// Loma Castle Playground (playground.ts): the bouncy castle, the slide, the swings and benches.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStaticWorld, blocked, airStep, jumpSpeed, rebound, PLAYER_R, JUMP, JUMP_ROAM, BOUNCE, type StaticWorld } from '../../src/game/house/collision.ts';
import { ROOMS, RAMPS, PLATFORMS, BARRIERS, SEATS, SWINGS, SIDE_ROAD, heightAt, groundY, jumpTop, roomAtLevel } from '../../src/game/house/layout.ts';
import { LOMA, CASTLE, SLIDE, SWING_SET } from '../../src/game/house/playground.ts';
import { CHARACTERS } from '../../src/game/house/characters.ts';

const g = groundY(LOMA.z0);
const world = buildStaticWorld({ mode: 'explore' });
/** Only what's near the playground, so the flood below stays quick. */
const near = (w: StaticWorld, x0: number, x1: number, z0: number, z1: number): StaticWorld => ({
  rects: w.rects.filter((r) => r.x1 > x0 - 1 && r.x0 < x1 + 1 && r.z1 > z0 - 1 && r.z0 < z1 + 1),
  circles: w.circles.filter((c) => c.x > x0 - 2 && c.x < x1 + 2 && c.z > z0 - 2 && c.z < z1 + 2),
});

/** Walk the playground from the side road on a 10 cm grid; a step to a neighbour higher or lower than a tread is a ledge. */
function playground() {
  const G = { x0: SIDE_ROAD.x0 + 0.5, z0: LOMA.z0 - 1, step: 0.1 };
  const nx = Math.round((LOMA.x1 + 1 - G.x0) / G.step) + 1, nz = Math.round((LOMA.z1 + 1 - G.z0) / G.step) + 1;
  const w = near(world, G.x0, LOMA.x1 + 1, G.z0, LOMA.z1 + 1);
  const seen = new Uint8Array(nx * nz);
  const ledges: string[] = [];
  const at = (i: number, j: number): [number, number] => [G.x0 + i * G.step, G.z0 + j * G.step];
  const si = Math.round((37 - G.x0) / G.step), sj = Math.round((-13.5 - G.z0) / G.step);
  seen[si * nz + sj] = 1;
  const q = [[si, sj]];
  while (q.length) {
    const [i, j] = q.pop()!;
    const [x, z] = at(i, j), h = heightAt(x, z);
    for (const [a, b] of [[i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]]) {
      if (a < 0 || b < 0 || a >= nx || b >= nz || seen[a * nz + b]) continue;
      const [xa, za] = at(a, b);
      if (blocked([xa, za], PLAYER_R, w, [])) continue;
      if (Math.abs(heightAt(xa, za) - h) > 0.16) { ledges.push(`(${xa.toFixed(1)}, ${za.toFixed(1)})`); continue; }
      seen[a * nz + b] = 1;
      q.push([a, b]);
    }
  }
  const reached = (x: number, z: number, r = 0.25) => {
    for (let dx = -r; dx <= r + 1e-9; dx += G.step) for (let dz = -r; dz <= r + 1e-9; dz += G.step) {
      const i = Math.round((x + dx - G.x0) / G.step), j = Math.round((z + dz - G.z0) / G.step);
      if (i >= 0 && j >= 0 && i < nx && j < nz && seen[i * nz + j]) return true;
    }
    return false;
  };
  return { reached, ledges };
}
const map = playground();

test('Loma Castle Playground: in from the side road through its gate, into the bouncy castle, up the steps and down the slide, with no ledge anywhere', () => {
  assert.deepEqual(map.ledges.slice(0, 5), [], 'a ledge (a drop or a step up you could walk off or onto)');
  const [gz0, gz1] = LOMA.gate;
  assert.ok(map.reached(LOMA.x0 + 1.5, (gz0 + gz1) / 2), "can't get in through the playground's gate");
  assert.ok(map.reached((CASTLE.x0 + CASTLE.x1) / 2, (CASTLE.z0 + CASTLE.z1) / 2, 0.3), "can't get into the bouncy castle");
  assert.equal(heightAt((CASTLE.x0 + CASTLE.x1) / 2, (CASTLE.z0 + CASTLE.z1) / 2), g + CASTLE.rise);
  assert.ok(map.reached((SLIDE.x0 + SLIDE.climb) / 2, (SLIDE.z0 + SLIDE.top) / 2), "can't climb to the top of the slide");
  assert.equal(heightAt((SLIDE.x0 + SLIDE.climb) / 2, (SLIDE.z0 + SLIDE.top) / 2), g + SLIDE.rise);
  assert.ok(map.reached((SLIDE.x0 + SLIDE.x1) / 2, SLIDE.end + 1), "can't get to the bottom of the slide");
  for (const x of SWING_SET.at) assert.ok(map.reached(x, SWING_SET.z - 1.3), `can't walk up to the swing at x ${x}`);
  // the castle has one way in: everywhere else round it, its walls stop you
  for (let z = CASTLE.z0 + 1; z < CASTLE.z1 - 1; z += 0.5) {
    if (z > CASTLE.door[0] - 0.3 && z < CASTLE.door[1] + 0.3) continue;
    assert.ok(blocked([CASTLE.x0 + CASTLE.wall / 2, z], PLAYER_R, world, []), `a gap in the castle's west wall at z ${z}`);
  }
});

test('the bouncy castle: it throws you back up when you land, its walls hold you in however high you bounce, and its roof keeps your head under it', () => {
  const castle = ROOMS.find((r) => r.id === 'loma-castle')!;
  assert.ok(castle.bouncy && castle.cap !== undefined);
  const mid: [number, number] = [(CASTLE.x0 + CASTLE.x1) / 2, (CASTLE.z0 + CASTLE.z1) / 2];
  assert.equal(roomAtLevel(...mid, g + CASTLE.rise)?.id, 'loma-castle');
  assert.equal(roomAtLevel(...mid, g + CASTLE.rise + 2.5)?.id, 'loma-castle', 'bouncing high is still in the castle');
  // land fast, bounce back up at most of the speed; small landings stop
  assert.equal(rebound(-10), 10 * BOUNCE.keep);
  assert.equal(rebound(-BOUNCE.min + 0.1), 0);
  // a big jump on the bouncy floor, then bounces that die away, all under the roof
  const eyes = CHARACTERS.filter((c) => !c.crawl).map((c) => c.eye);
  for (const eye of [Math.max(...eyes), Math.min(...eyes)]) {
    const cap = castle.cap! - eye - 0.18, floor = g + CASTLE.rise;
    let s = { feet: floor, vy: jumpSpeed(JUMP_ROAM.up * BOUNCE.jump), air: true }, top = floor, bounces = 0;
    for (let i = 0; i < 1200 && (s.air || bounces === 0); i++) {
      const falling = s.vy;
      s = airStep(s, floor, cap, 1 / 60);
      top = Math.max(top, s.feet);
      if (!s.air) { const up = rebound(falling); if (up) { s = { feet: floor, vy: up, air: true }; bounces++; } }
    }
    assert.ok(top + eye + 0.1 < castle.cap!, 'your head went through the roof');
    assert.ok(bounces >= 2 && bounces < 12, `bounced ${bounces} times`);
    assert.equal(s.air, false, 'never stopped bouncing');
    // at the top of a bounce, the walls still stop you (they have no top to clear)
    assert.ok(blocked([CASTLE.x1 - CASTLE.wall / 2, mid[1]], PLAYER_R, world, [], top));
    assert.ok(blocked([mid[0], CASTLE.z0 + CASTLE.wall / 2], PLAYER_R, world, [], top));
  }
  for (const b of BARRIERS.filter((b) => b.kind === 'invisible' && b.a[0] >= CASTLE.x0 - 0.1 && b.b[0] <= SLIDE.climb + 0.1 && b.a[1] >= SLIDE.z0 - 0.1 && b.b[1] <= CASTLE.z1 + 0.1)) {
    assert.equal(jumpTop(b), undefined, "a castle or slide wall that can be jumped");
  }
  // a jump from the floor (not the castle) never gets anyone over the castle's walls or onto the slide's platform
  assert.ok(JUMP_ROAM.up < SLIDE.rise);
  assert.equal(JUMP.up < CASTLE.wallH, true);
});

test('the slide goes down from the platform at the top to the ground, and the steps go up beside it', () => {
  const slides = RAMPS.filter((r) => r.slide);
  assert.equal(slides.length, 1);
  const s = slides[0];
  assert.equal(s.y0, g + SLIDE.rise);
  assert.equal(s.y1, g, 'the bottom of the slide should be on the ground');
  const plat = PLATFORMS.find((p) => p.y === g + SLIDE.rise && p.x0 === SLIDE.x0)!;
  assert.ok(plat, 'no platform at the top');
  assert.equal(s.z0, plat.z1, "the slide doesn't start at the platform");
  const steps = RAMPS.find((r) => !r.slide && r.x0 === SLIDE.x1 && r.z0 === SLIDE.top)!;
  assert.ok(steps && steps.y0 === g + SLIDE.rise && steps.y1 === g);
  // steep enough to be fun, not so steep it's a drop
  const fall = (s.y0 - s.y1) / (s.z1 - s.z0);
  assert.ok(fall > 0.3 && fall < 0.7, `the slide falls ${fall.toFixed(2)} m a metre`);
});

test('the benches and swings: you can walk up to each one, sit on it, and get up again somewhere clear; the swings swing clear of everything', () => {
  assert.equal(SWINGS.length, SWING_SET.at.length);
  assert.equal(new Set(SEATS.map((s) => s.id)).size, SEATS.length);
  const benches = SEATS.filter((s) => s.swing === undefined);
  assert.ok(benches.length >= 4, 'a few benches to sit on');
  for (const s of SEATS) {
    assert.ok(s.x > LOMA.x0 && s.x < LOMA.x1 && s.z > LOMA.z0 && s.z < LOMA.z1, `${s.id} is outside the playground`);
    assert.ok(map.reached(s.stand[0], s.stand[1], 0.3), `can't walk up to ${s.id}`);
    assert.equal(blocked(s.stand, PLAYER_R, world, []), false, `getting up from ${s.id} puts you inside something`);
    assert.ok(Math.hypot(s.stand[0] - s.x, s.stand[1] - s.z) < 1.7, `${s.id} is out of reach from where you get up`);
  }
  // nothing solid where a swing swings (as far as it goes, plus the seat)
  for (const sw of SWINGS) {
    const reachZ = sw.rope * Math.sin(0.95) + 0.25;
    const sweep = { x0: sw.x - 0.4, x1: sw.x + 0.4, z0: sw.z - reachZ, z1: sw.z + reachZ };
    assert.equal(world.rects.some((r) => r.x1 > sweep.x0 && r.x0 < sweep.x1 && r.z1 > sweep.z0 && r.z0 < sweep.z1), false, `something in the way of the swing at x ${sw.x}`);
    assert.equal(world.circles.some((c) => c.x + c.r > sweep.x0 && c.x - c.r < sweep.x1 && c.z + c.r > sweep.z0 && c.z - c.r < sweep.z1), false, `a post in the way of the swing at x ${sw.x}`);
    assert.ok(sw.pivot - sw.rope - (sw.ground) > 0.35, 'the swing seat is too low');
  }
});

test('the playground is only for exploring, and is counted as a place you can explore', () => {
  const room = ROOMS.find((r) => r.id === 'loma')!;
  assert.ok(room.explore && room.area && room.name === LOMA.name);
  for (const b of BARRIERS.filter((b) => b.a[0] >= LOMA.x0 - 0.5 && b.b[0] <= LOMA.x1 + 0.5 && b.a[1] >= LOMA.z0 - 0.5 && b.b[1] <= LOMA.z1 + 0.5)) assert.equal(b.mode, 'explore');
});
