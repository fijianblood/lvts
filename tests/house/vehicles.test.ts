// The drivable brick vehicles (vehicles.ts): handling, where they park, and the
// pose other players see. Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VEHICLES, DIMS, nextSpeed, steerFor, drive, bumpers, outline, poseForVehicle, vehicleForPose, DRIVE_POSE } from '../../src/game/house/vehicles.ts';
import { buildStaticWorld, blocked, circleHitsOBB } from '../../src/game/house/collision.ts';
import { floorAt, heightAt, roomAtLevel, MCFARLANE } from '../../src/game/house/layout.ts';
import { cleanPos, POSES } from '../../workers/neighbourhood/src/world.ts';

const explore = buildStaticWorld({ mode: 'explore' });

/** Would a vehicle of this kind fit at (x, z) facing yaw, on its floor at y? (what the engine checks, minus doors and people) */
function fits(kind: keyof typeof DIMS, x: number, z: number, yaw: number, y: number): string | null {
  const d = DIMS[kind];
  for (const [px, pz] of bumpers(x, z, yaw, d)) {
    if (blocked([px, pz], d.halfW * 0.9, explore, [], y + 0.25)) return `blocked at ${px.toFixed(1)}, ${pz.toFixed(1)}`;
    const room = roomAtLevel(px, pz, y);
    if (room && !room.outside) return `indoors (${room.id}) at ${px.toFixed(1)}, ${pz.toFixed(1)}`;
    if (Math.abs(floorAt(px, pz, y) - y) > 0.6) return `a drop at ${px.toFixed(1)}, ${pz.toFixed(1)}`;
  }
  return null;
}

test('vehicles: speed up to the limit, brake hard, roll to a stop, and reverse slowly', () => {
  const d = DIMS.car;
  let v = 0;
  for (let i = 0; i < 600; i++) v = nextSpeed(v, 1, d, 1 / 60);
  assert.equal(v, d.maxSpeed);
  const braking = nextSpeed(v, -1, d, 1 / 60);
  assert.ok(v - braking > d.accel / 60 * 2, 'braking is harder than speeding up');
  let coast = 5;
  for (let i = 0; i < 300; i++) coast = nextSpeed(coast, 0, d, 1 / 60);
  assert.equal(coast, 0);
  let back = 0;
  for (let i = 0; i < 600; i++) back = nextSpeed(back, -1, d, 1 / 60);
  assert.equal(back, -d.maxSpeed * 0.4);
});

test('vehicles: right turns right and left turns left, going forward and backward', () => {
  const d = DIMS.car;
  // facing -z (yaw 0), right is +x
  let [x, z, yaw] = [0, 0, 0];
  for (let i = 0; i < 60; i++) [x, z, yaw] = drive(x, z, yaw, 8, steerFor(1, 8, d), d, 1 / 60);
  assert.ok(x > 1 && z < -4, `turned right: ${x.toFixed(2)}, ${z.toFixed(2)}`);
  [x, z, yaw] = [0, 0, 0];
  for (let i = 0; i < 60; i++) [x, z, yaw] = drive(x, z, yaw, 8, steerFor(-1, 8, d), d, 1 / 60);
  assert.ok(x < -1 && z < -4, `turned left: ${x.toFixed(2)}, ${z.toFixed(2)}`);
  // less lock at speed
  assert.ok(Math.abs(steerFor(1, d.maxSpeed, d)) < Math.abs(steerFor(1, 0, d)));
});

test('vehicles: each one parks somewhere clear, on its own floor, outdoors, apart from the others', () => {
  for (const v of VEHICLES) {
    const y = floorAt(v.x, v.z, heightAt(v.x, v.z) + 0.3);
    assert.equal(fits(v.kind, v.x, v.z, v.yaw, y), null, `${v.name} at ${v.x}, ${v.z}`);
  }
  for (const a of VEHICLES) for (const b of VEHICLES) {
    if (a === b) continue;
    for (const p of bumpers(a.x, a.z, a.yaw, DIMS[a.kind])) assert.ok(!circleHitsOBB(p, DIMS[a.kind].halfW, outline(b.x, b.z, b.yaw, DIMS[b.kind])), `${a.name} overlaps ${b.name}`);
  }
  // the cars keep left on McFarlane Road: eastbound on the north side, westbound on the south
  for (const v of VEHICLES.filter((q) => q.kind === 'car')) {
    assert.ok(v.z > MCFARLANE.z0 && v.z < MCFARLANE.z1, `${v.name} is on McFarlane Road`);
    const east = -Math.sin(v.yaw) > 0.9, mid = (MCFARLANE.z0 + MCFARLANE.z1) / 2;
    assert.ok(east ? v.z < mid : v.z > mid, `${v.name} keeps left`);
  }
});

test('vehicles: the LvTS pickup backs out of the carport, down the driveway and onto McFarlane Road', () => {
  const p = VEHICLES.find((v) => v.kind === 'pickup')!;
  let y = floorAt(p.x, p.z, heightAt(p.x, p.z) + 0.3);
  for (let z = p.z; z <= MCFARLANE.z0 + 3; z += 0.1) {
    const ny = floorAt(p.x, z, y);
    assert.equal(fits('pickup', p.x, z, p.yaw, ny), null, `stuck at z ${z.toFixed(1)}`);
    y = ny;
  }
  assert.ok(Math.abs(y - floorAt(p.x, MCFARLANE.z0 + 3, y)) < 0.01);
});

test('vehicles: other players see you driving (poses 4 to 6), and the server passes those on', () => {
  VEHICLES.forEach((_, i) => {
    assert.equal(vehicleForPose(poseForVehicle(i)), i);
    assert.deepEqual(cleanPos([1, 2, 3, 0, poseForVehicle(i)]), [1, 2, 3, 0, poseForVehicle(i)]);
  });
  assert.equal(POSES, DRIVE_POSE + VEHICLES.length - 1);
  for (const p of [0, 1, 2, 3, DRIVE_POSE + VEHICLES.length]) assert.equal(vehicleForPose(p), -1);
});
