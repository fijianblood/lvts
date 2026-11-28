// The Learn page's worked examples, computed with the Neuron Lab's own code
// (src/lib/perceptron.ts), so the page can never disagree with the demo.
// Checked in tests/site/perceptron.test.ts.
import { EXAMPLES, START, guess, lessonById, step, type Bit, type Neuron } from './perceptron.ts';

export interface WorkedRow {
  round: number;
  example: string;
  guess: Bit;
  right: Bit;
  up: boolean;
  after: Neuron;
}

/** Teaching AND from all zeros, step by step: every mistake, and the mistakes in each round. */
export function workedExample(): { rows: WorkedRow[]; mistakes: number[]; rounds: number; final: Neuron } {
  const lesson = lessonById('and');
  let n: Neuron = { w1: 0, w2: 0, bias: 0 };
  let s = START;
  const rows: WorkedRow[] = [];
  for (let guard = 0; guard < 500 && s.status !== 'learned' && s.status !== 'stuck'; guard++) {
    const round = Math.max(1, s.round);
    const r = step(n, lesson, s);
    if (r.checked !== null && r.result && r.result.error !== 0) {
      const [a, b] = EXAMPLES[r.checked];
      rows.push({ round, example: `${a}, ${b}`, guess: guess(n, a, b), right: lesson.answer(a, b), up: r.result.error > 0, after: r.neuron });
    }
    n = r.neuron;
    s = r.state;
  }
  return { rows, mistakes: s.mistakes, rounds: s.round, final: n };
}

const XOR_NET = {
  A: { w: [1, 1], b: -0.5 },
  B: { w: [-1, -1], b: 1.5 },
  O: { w: [1, 1], b: -1.5 },
};

/** The three-neuron XOR network, worked out for all four rows. */
export function xorRows() {
  const fire = (w: number[], b: number, x: Bit[]) => guess({ w1: w[0], w2: w[1], bias: b }, x[0], x[1]);
  return EXAMPLES.map(([a, b]) => {
    const A = fire(XOR_NET.A.w, XOR_NET.A.b, [a, b]);
    const B = fire(XOR_NET.B.w, XOR_NET.B.b, [a, b]);
    const out = fire(XOR_NET.O.w, XOR_NET.O.b, [A, B]);
    return { a, b, A, B, out, right: lessonById('xor').answer(a, b) };
  });
}

