// Run with: node --test tests/tools/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toGray, gaussianApprox, sketchGray, sketchImageData } from '../../src/lib/sketch.ts';

test('grayscale uses OpenCV BGR2GRAY weights', () => {
  const px = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
  assert.deepEqual([...toGray(px, 4, 1)], [76, 150, 29, 255]);
});

test('blur keeps a flat image flat', () => {
  const flat = new Float32Array(30 * 20).fill(100);
  for (const v of gaussianApprox(flat, 30, 20, 8)) assert.ok(Math.abs(v - 100) < 1e-3);
});

test('flat areas turn white, edges turn dark', () => {
  const w = 40, h = 10;
  const gray = new Uint8ClampedArray(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) gray[y * w + x] = x < 20 ? 60 : 200;
  const s = sketchGray(gray, w, h, { radius: 4, darkness: 1 });
  assert.ok(s[5 * w + 2] > 240, `far-left should be paper white, got ${s[5 * w + 2]}`);
  assert.ok(s[5 * w + 37] > 240, `far-right should be paper white, got ${s[5 * w + 37]}`);
  assert.ok(s[5 * w + 19] < 200, `edge should leave a pencil line, got ${s[5 * w + 19]}`);
});

test('darkness only darkens', () => {
  const gray = new Uint8ClampedArray(64).map((_, i) => (i * 37) % 256);
  const a = sketchGray(gray, 8, 8, { radius: 2, darkness: 1 });
  const b = sketchGray(gray, 8, 8, { radius: 2, darkness: 2 });
  for (let i = 0; i < a.length; i++) assert.ok(b[i] <= a[i]);
});

test('RGBA output is opaque gray', () => {
  const rgba = new Uint8ClampedArray(4 * 9).fill(128);
  const out = sketchImageData(rgba, 3, 3, { radius: 1, darkness: 1 });
  assert.equal(out.length, 36);
  for (let p = 0; p < out.length; p += 4) {
    assert.equal(out[p], out[p + 1]);
    assert.equal(out[p], out[p + 2]);
    assert.equal(out[p + 3], 255);
  }
});
