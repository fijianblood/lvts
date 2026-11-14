// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matrixCommand, parseStatus, rgbCommand } from '../../src/lib/kitProtocol.ts';

test('STATUS replies are read into numbers', () => {
  assert.deepEqual(parseStatus('POT=512 LDR=300 JX=1023 JY=0 JSW=1 BTN=0 LINE=1 LED=1'),
    { POT: 512, LDR: 300, JX: 1023, JY: 0, JSW: 1, BTN: 0, LINE: 1, LED: 1 });
  assert.deepEqual(parseStatus('POT=1 LDR=2 JX=3 JY=4 JSW=0 BTN=0 LINE=0 LED=0\r')?.LED, 0);
});

test('other lines are not mistaken for readings', () => {
  for (const l of ['PONG', 'OK LED ON', 'POT=512', 'POT=x LDR=1 JX=1 JY=1 JSW=1 BTN=1 LINE=1 LED=1', '']) {
    assert.equal(parseStatus(l), null, l);
  }
});

test('the matrix grid becomes 8 hex rows', () => {
  const grid = Array.from({ length: 8 }, () => Array<boolean>(8).fill(false));
  assert.equal(matrixCommand(grid), 'MATRIX 00 00 00 00 00 00 00 00');
  grid[0][0] = true; grid[7][7] = true; grid[3] = Array<boolean>(8).fill(true);
  assert.equal(matrixCommand(grid), 'MATRIX 80 00 00 FF 00 00 00 01');
  assert.equal(matrixCommand(grid, true), 'MATRIX 01 00 00 FF 00 00 00 80');
});

test('colours become RGB commands', () => {
  assert.equal(rgbCommand('#ff0080'), 'RGB 255 0 128');
  assert.equal(rgbCommand('#000000'), 'RGB 0 0 0');
});
