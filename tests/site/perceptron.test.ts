// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  EXAMPLES, LESSONS, MAX_ROUNDS, START, allRight, fmt, guess, lessonById, nudge, randomNeuron, signed, step, teach, total,
  type Neuron,
} from '../../src/lib/perceptron.ts';

const AND = lessonById('and');
const OR = lessonById('or');
const NOT = lessonById('not');
const XOR = lessonById('xor');

test('the lessons give the right answers', () => {
  const table = (id: Parameters<typeof lessonById>[0]) => EXAMPLES.map(([a, b]) => lessonById(id).answer(a, b));
  assert.deepEqual(table('and'), [0, 0, 0, 1]);
  assert.deepEqual(table('or'), [0, 1, 1, 1]);
  assert.deepEqual(table('not'), [1, 1, 0, 0]);
  assert.deepEqual(table('xor'), [0, 1, 1, 0]);
  assert.deepEqual(LESSONS.map((l) => l.id), ['and', 'or', 'not', 'xor']);
});

test('the fishing example from the Learn page', () => {
  const n: Neuron = { w1: 0.3, w2: 0.8, bias: -0.5 };
  assert.deepEqual(EXAMPLES.map(([a, b]) => total(n, a, b)), [-0.5, 0.3, -0.2, 0.6]);
  assert.deepEqual(EXAMPLES.map(([a, b]) => guess(n, a, b)), [0, 1, 0, 1]);
});

test('a total of exactly 0 means no, even after many additions of 0.1', () => {
  // 0.2 − 0.1 − 0.1 is not exactly 0 in floating point; tidy() fixes it.
  let n: Neuron = { w1: 0, w2: 0, bias: 0.2 };
  n = nudge(n, 0, 0, 0).neuron; // 0.2 > 0 says yes, should be no: bias 0.1
  n = nudge(n, 0, 0, 0).neuron; // bias 0.0
  assert.equal(n.bias, 0);
  assert.equal(guess(n, 0, 0), 0);
});

test('the nudge rule: right guesses change nothing, inputs of 0 keep their weight', () => {
  const n: Neuron = { w1: 0.5, w2: -0.3, bias: 0.1 };
  assert.deepEqual(nudge(n, 1, 0, 1).change, { w1: 0, w2: 0, bias: 0 });
  const up = nudge({ w1: 0, w2: 0, bias: 0 }, 1, 0, 1);
  assert.equal(up.error, 1);
  assert.deepEqual(up.neuron, { w1: 0.1, w2: 0, bias: 0.1 });
  const down = nudge({ w1: 0.2, w2: 0.2, bias: 0.1 }, 0, 1, 0);
  assert.equal(down.error, -1);
  assert.deepEqual(down.neuron, { w1: 0.2, w2: 0.1, bias: 0 });
});

test('the worked AND example on the Learn page, step by step', () => {
  const { neuron, state, steps } = teach({ w1: 0, w2: 0, bias: 0 }, AND);
  const mistakes = steps.filter((s) => s.result?.error).map((s) => ({
    round: s.state.status === 'learned' ? state.round : roundOf(s),
    example: EXAMPLES[s.checked as number].join(', '),
    after: [s.neuron.w1, s.neuron.w2, s.neuron.bias],
  }));
  assert.deepEqual(mistakes, [
    { round: 1, example: '1, 1', after: [0.1, 0.1, 0.1] },
    { round: 2, example: '0, 0', after: [0.1, 0.1, 0] },
    { round: 2, example: '0, 1', after: [0.1, 0, -0.1] },
    { round: 2, example: '1, 1', after: [0.2, 0.1, 0] },
    { round: 3, example: '0, 1', after: [0.2, 0, -0.1] },
    { round: 3, example: '1, 0', after: [0.1, 0, -0.2] },
    { round: 3, example: '1, 1', after: [0.2, 0.1, -0.1] },
    { round: 4, example: '1, 0', after: [0.1, 0.1, -0.2] },
    { round: 4, example: '1, 1', after: [0.2, 0.2, -0.1] },
    { round: 5, example: '0, 1', after: [0.2, 0.1, -0.2] },
  ]);
  assert.equal(state.status, 'learned');
  assert.equal(state.round, 5, 'all four are right after the nudge in round 5');
  assert.deepEqual(state.mistakes, [1, 3, 3, 2, 1]);
  assert.deepEqual(neuron, { w1: 0.2, w2: 0.1, bias: -0.2 });
  assert.deepEqual(EXAMPLES.map(([a, b]) => total(neuron, a, b)), [-0.2, -0.1, 0, 0.1]);
});

// The round a step belonged to: the state after the step has moved on when it was the last example.
function roundOf(s: ReturnType<typeof step>): number {
  return s.checked === EXAMPLES.length - 1 && s.state.next === 0 ? s.state.round - 1 : s.state.round;
}

test('AND, OR and NOT are learned from every starting point the Randomise button can pick', () => {
  const values = Array.from({ length: 21 }, (_, i) => (i - 10) / 10);
  for (const lesson of [AND, OR, NOT]) {
    let worst = 0;
    for (const w1 of values) for (const w2 of values) for (const bias of values) {
      const { neuron, state } = teach({ w1, w2, bias }, lesson);
      assert.equal(state.status, 'learned', `${lesson.id} from ${w1}, ${w2}, ${bias}`);
      assert.ok(allRight(neuron, lesson));
      worst = Math.max(worst, state.round);
    }
    assert.ok(worst < MAX_ROUNDS, `${lesson.id} took up to ${worst} rounds`);
  }
});

test('a neuron that already knows the lesson is learned in 0 rounds', () => {
  const r = step({ w1: 0.2, w2: 0.1, bias: -0.2 }, AND, START);
  assert.equal(r.state.status, 'learned');
  assert.equal(r.state.round, 0);
  assert.equal(r.checked, null);
});

test('XOR never finishes and stops after 100 rounds', () => {
  for (let k = 0; k < 50; k++) {
    let seed = k + 1;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const { state, steps } = teach(randomNeuron(rand), XOR);
    assert.equal(state.status, 'stuck');
    assert.equal(state.round, MAX_ROUNDS);
    assert.equal(steps.length, MAX_ROUNDS * 4);
  }
});

test('teaching numbers stay inside the sliders (−2 to 2)', () => {
  const { steps } = teach({ w1: 1, w2: -1, bias: 1 }, XOR);
  for (const s of steps) for (const v of [s.neuron.w1, s.neuron.w2, s.neuron.bias]) assert.ok(v >= -2 && v <= 2, String(v));
});

test('random neurons are multiples of 0.1 between −1 and 1', () => {
  for (const r of [0, 0.03, 0.5, 0.9999]) {
    const n = randomNeuron(() => r);
    for (const v of [n.w1, n.w2, n.bias]) {
      assert.ok(v >= -1 && v <= 1, String(v));
      assert.equal(Math.round(v * 10) / 10, v);
    }
  }
});

test('numbers are shown with a real minus sign', () => {
  assert.equal(fmt(-0.5), '−0.5');
  assert.equal(fmt(0), '0.0');
  assert.equal(fmt(-0.0000001), '0.0');
  assert.equal(fmt(1.2), '1.2');
  assert.equal(signed(0.1), '+0.1');
  assert.equal(signed(-0.1), '−0.1');
});
