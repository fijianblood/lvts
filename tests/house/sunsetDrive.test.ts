// Sunset Drive and the USP Room Finder kiosk (sunsetDrive.ts). Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunsetWeight, sunsetHour, SUNSET_HOUR, RINGS, KIOSK, ARCH_X, NEON, sunsetSolids, SUNSET } from '../../src/game/house/sunsetDrive.ts';
import { buildStaticWorld, blocked } from '../../src/game/house/collision.ts';
import { heightAt, roomAtLevel, MCFARLANE } from '../../src/game/house/layout.ts';

const mine = new Set(sunsetSolids().map((r) => JSON.stringify(r)));
const st = buildStaticWorld({ mode: 'explore' });
const others = { rects: st.rects.filter((r) => !mine.has(JSON.stringify(r))), circles: st.circles };

test('Sunset Drive: golden hour in the zone by day, night stays night, the rest of town keeps its time', () => {
  assert.equal(sunsetWeight(SUNSET.x0 + 10, 30), 1);
  assert.equal(sunsetWeight(0, 0), 0);
  assert.ok(sunsetWeight(SUNSET.x0 - 10, 30) > 0 && sunsetWeight(SUNSET.x0 - 10, 30) < 1);
  assert.equal(sunsetHour(12, 1), SUNSET_HOUR);
  assert.equal(sunsetHour(12, 0), 12);
  assert.equal(sunsetHour(21, 1), 21);
  assert.equal(sunsetHour(2, 1), 2);
});

test('Sunset Drive: the rings sit on McFarlane Road in order, and the arch, neon posts and kiosk are clear of everything', () => {
  for (const r of RINGS) assert.ok(r.z > MCFARLANE.z0 && r.z < MCFARLANE.z1 && r.x < MCFARLANE.x1, `ring at ${r.x}`);
  for (let i = 1; i < RINGS.length; i++) assert.ok(RINGS[i].x > RINGS[i - 1].x);
  const clear = (x: number, z: number, r: number) => !blocked([x, z], r, others, [], heightAt(x, z));
  assert.ok(clear(KIOSK.x, KIOSK.z, 0.8), 'kiosk');
  const room = roomAtLevel(KIOSK.x, KIOSK.z, heightAt(KIOSK.x, KIOSK.z));
  assert.equal(room?.id, 'usp', 'the kiosk is at USP');
  for (const z of [MCFARLANE.z0 - 1.1, MCFARLANE.z1 + 1.1]) assert.ok(clear(ARCH_X, z, 0.5), `arch post at ${z}`);
  for (const n of NEON) assert.ok(clear(n.x, n.z, 0.2), `neon post at ${n.x}, ${n.z}`);
});
