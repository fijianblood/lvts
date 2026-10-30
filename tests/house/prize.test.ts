// Run with: node --test "tests/house/*.test.ts"   (Node 22.18+)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodePrizeCodes, decodePrizeCode, activeEntry, nextRound } from '../../src/game/house/prizeCodec.ts';

const RAW = '2026-11-02=LVTS-7KQ2X9, 2026-11-09=LVTS-M3P8RA; until=2026-11-30';

test('codes round-trip and never appear as plain text in the bundle', () => {
  const { bundle, warnings } = encodePrizeCodes(RAW, 'a1b2c3d4e5f6');
  assert.deepEqual(warnings, []);
  assert.equal(bundle.entries.length, 2);
  const json = JSON.stringify(bundle);
  assert.ok(!json.includes('7KQ2X9') && !json.includes('M3P8RA'), json);
  assert.equal(decodePrizeCode(bundle, bundle.entries[0]), 'LVTS-7KQ2X9');
  assert.equal(decodePrizeCode(bundle, bundle.entries[1]), 'LVTS-M3P8RA');
});

test('a different build salt scrambles the same code differently', () => {
  const a = encodePrizeCodes(RAW, 'salt-one').bundle;
  const b = encodePrizeCodes(RAW, 'salt-two').bundle;
  assert.notEqual(a.entries[0].data, b.entries[0].data);
});

test('the live code follows Fiji dates, and nothing is live outside the rounds', () => {
  const { bundle } = encodePrizeCodes(RAW, 'x');
  const at = (iso: string) => activeEntry(bundle, new Date(iso));
  assert.equal(at('2026-11-01T23:59:00+12:00'), null);
  assert.equal(at('2026-11-02T00:00:00+12:00')?.from, '2026-11-02');
  assert.equal(at('2026-11-08T23:59:00+12:00')?.from, '2026-11-02');
  assert.equal(at('2026-11-09T00:01:00+12:00')?.from, '2026-11-09');
  assert.equal(at('2026-11-30T23:00:00+12:00')?.from, '2026-11-09');
  assert.equal(at('2026-12-01T00:00:01+12:00'), null);
  assert.equal(nextRound(bundle, new Date('2026-11-05T12:00:00+12:00')), '2026-11-09');
});

test('bad entries are skipped with a warning instead of breaking the build', () => {
  const { bundle, warnings } = encodePrizeCodes('2026-13-40=LVTS-1, 2026-11-02=has space, 2026-11-03=GOOD-123', 'x');
  assert.equal(bundle.entries.length, 1);
  assert.equal(warnings.length, 2);
  assert.equal(decodePrizeCode(bundle, bundle.entries[0]), 'GOOD-123');
});

test('no codes means an empty bundle (the game shows its demo code)', () => {
  const { bundle } = encodePrizeCodes(undefined, 'x');
  assert.deepEqual(bundle, { salt: '', until: null, entries: [] });
  assert.equal(activeEntry(bundle), null);
});
