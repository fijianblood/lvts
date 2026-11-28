// One artificial neuron (a perceptron) for the Neuron Lab page.
//
// Plain TypeScript with no React, so the page and the tests (tests/site/perceptron.test.ts)
// share exactly the same maths:
//
//   total  = (input 1 × weight 1) + (input 2 × weight 2) + bias
//   answer = 1 (yes) if total > 0, otherwise 0 (no)
//
// Learning (the perceptron rule), for one example at a time:
//   error   = right answer − guess          (0, +1 or −1)
//   weight += 0.1 × error × input
//   bias   += 0.1 × error
// Teaching stops as soon as all four examples are right, or after 100 rounds
// (one round = one pass through the four examples).

export type Bit = 0 | 1;

export interface Neuron {
  w1: number;
  w2: number;
  bias: number;
}

export type LessonId = 'and' | 'or' | 'not' | 'xor';

export interface Lesson {
  id: LessonId;
  /** Name in the "Pick a lesson" menu. */
  label: string;
  /** The rule in plain words. */
  rule: string;
  answer: (x1: Bit, x2: Bit) => Bit;
  /** false for XOR: one neuron can never get all four right. */
  learnable: boolean;
}

export const LESSONS: Lesson[] = [
  { id: 'and', label: 'AND', rule: 'Yes only when both inputs are 1', answer: (a, b) => (a && b ? 1 : 0), learnable: true },
  { id: 'or', label: 'OR', rule: 'Yes when either input is 1', answer: (a, b) => (a || b ? 1 : 0), learnable: true },
  { id: 'not', label: 'NOT', rule: 'Yes when Input 1 is 0 (Input 2 doesn’t matter)', answer: (a) => (a ? 0 : 1), learnable: true },
  { id: 'xor', label: 'XOR', rule: 'Yes when exactly one input is 1, but not both', answer: (a, b) => (a !== b ? 1 : 0), learnable: false },
];

export const lessonById = (id: LessonId): Lesson => LESSONS.find((l) => l.id === id) ?? LESSONS[0];

/** The four examples, always checked in this order. */
export const EXAMPLES: readonly (readonly [Bit, Bit])[] = [[0, 0], [0, 1], [1, 0], [1, 1]];

export const LEARNING_RATE = 0.1;
export const MAX_ROUNDS = 100;
/** The sliders go from −2 to 2; learning never pushes a number past them. */
export const LIMIT = 2;

/**
 * Rounds to 3 decimal places. Computers store 0.1 slightly inaccurately, so
 * 0.2 − 0.1 − 0.1 can come out as 0.0000000000000000277 instead of 0, and that
 * tiny leftover would flip a "total > 0" decision. Every number here is a
 * multiple of 0.1 (sliders step by 0.1), so rounding keeps them exact.
 */
export const tidy = (v: number): number => {
  const r = Math.round(v * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
};

const clamp = (v: number) => Math.min(LIMIT, Math.max(-LIMIT, v));

export function total(n: Neuron, x1: Bit, x2: Bit): number {
  return tidy(x1 * n.w1 + x2 * n.w2 + n.bias);
}

export function guess(n: Neuron, x1: Bit, x2: Bit): Bit {
  return total(n, x1, x2) > 0 ? 1 : 0;
}

export function allRight(n: Neuron, lesson: Lesson): boolean {
  return EXAMPLES.every(([a, b]) => guess(n, a, b) === lesson.answer(a, b));
}

export interface Nudge {
  neuron: Neuron;
  /** right answer − guess: 0 (right), 1 (said no, should be yes), −1 (said yes, should be no). */
  error: -1 | 0 | 1;
  /** How much each number moved (0 when nothing changed). */
  change: Neuron;
}

/** Checks one example and nudges the weights and bias if the guess was wrong. */
export function nudge(n: Neuron, x1: Bit, x2: Bit, answer: Bit): Nudge {
  const error = (answer - guess(n, x1, x2)) as -1 | 0 | 1;
  if (error === 0) return { neuron: n, error, change: { w1: 0, w2: 0, bias: 0 } };
  const next: Neuron = {
    w1: tidy(clamp(n.w1 + LEARNING_RATE * error * x1)),
    w2: tidy(clamp(n.w2 + LEARNING_RATE * error * x2)),
    bias: tidy(clamp(n.bias + LEARNING_RATE * error)),
  };
  return {
    neuron: next,
    error,
    change: { w1: tidy(next.w1 - n.w1), w2: tidy(next.w2 - n.w2), bias: tidy(next.bias - n.bias) },
  };
}

export type TeachStatus = 'ready' | 'teaching' | 'learned' | 'stuck';

export interface TeachState {
  /** The round being worked on (0 before teaching starts). */
  round: number;
  /** Which of the four examples is checked next (0 to 3). */
  next: number;
  status: TeachStatus;
  /** Mistakes made in each round so far (for the "errors dropping" chart). */
  mistakes: number[];
}

export const START: TeachState = { round: 0, next: 0, status: 'ready', mistakes: [] };

export interface StepResult {
  neuron: Neuron;
  state: TeachState;
  /** The example just checked (index into EXAMPLES), or null when nothing was checked. */
  checked: number | null;
  result: Nudge | null;
}

/**
 * One teaching step: check the next example and nudge if it was wrong.
 * Before the first step, a neuron that already gets all four right is marked
 * learned in 0 rounds without checking anything.
 */
export function step(n: Neuron, lesson: Lesson, s: TeachState): StepResult {
  if (s.status === 'learned' || s.status === 'stuck') return { neuron: n, state: s, checked: null, result: null };
  if (s.round === 0) {
    if (allRight(n, lesson)) return { neuron: n, state: { ...s, status: 'learned' }, checked: null, result: null };
    s = { round: 1, next: 0, status: 'teaching', mistakes: [0] };
  }
  const i = s.next;
  const [a, b] = EXAMPLES[i];
  const result = nudge(n, a, b, lesson.answer(a, b));
  const mistakes = [...s.mistakes];
  if (result.error !== 0) mistakes[mistakes.length - 1] += 1;
  let state: TeachState = { ...s, mistakes };
  if (result.error !== 0 && allRight(result.neuron, lesson)) {
    state = { ...state, status: 'learned' };
  } else if (i === EXAMPLES.length - 1) {
    state = s.round >= MAX_ROUNDS
      ? { ...state, status: 'stuck' }
      : { ...state, round: s.round + 1, next: 0, mistakes: [...mistakes, 0] };
  } else {
    state = { ...state, next: i + 1 };
  }
  return { neuron: result.neuron, state, checked: i, result };
}

/** Teaches until it learns or gives up. Used by the tests and the Learn page's chart. */
export function teach(n: Neuron, lesson: Lesson): { neuron: Neuron; state: TeachState; steps: StepResult[] } {
  let neuron = n;
  let state = START;
  const steps: StepResult[] = [];
  for (let guard = 0; guard < MAX_ROUNDS * EXAMPLES.length + 2; guard++) {
    const r = step(neuron, lesson, state);
    neuron = r.neuron;
    state = r.state;
    if (r.checked !== null) steps.push(r);
    if (state.status === 'learned' || state.status === 'stuck') break;
  }
  return { neuron, state, steps };
}

/** A fresh neuron with random settings: multiples of 0.1 between −1 and 1. */
export function randomNeuron(rand: () => number = Math.random): Neuron {
  const pick = () => tidy((Math.floor(rand() * 21) - 10) / 10);
  return { w1: pick(), w2: pick(), bias: pick() };
}

/** Shows a number with one decimal and a real minus sign: −0.5, 0.0, 1.2. */
export function fmt(v: number): string {
  const t = tidy(v);
  const s = Math.abs(t).toFixed(1);
  return t < 0 && s !== '0.0' ? `−${s}` : s;
}

/** Like fmt, with a + in front of positive numbers: +0.1, −0.1. */
export function signed(v: number): string {
  return tidy(v) > 0 ? `+${fmt(v)}` : fmt(v);
}
