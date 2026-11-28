import { useEffect, useReducer, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Brain, Footprints, Play, Pause, Shuffle, RotateCcw, Fish, BookOpen, Check, X, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import NeuronDiagram from '../components/neuron/NeuronDiagram';
import {
  EXAMPLES, MAX_ROUNDS, START, allRight, fmt, guess, lessonById, randomNeuron, signed, step, total,
  type Bit, type LessonId, type Neuron, type StepResult, type TeachState,
} from '../lib/perceptron';
import { pageLink } from '../links';

// Neuron Lab: one artificial neuron (a perceptron) that visitors can play with
// by hand, then watch learn AND, OR or NOT by itself. Everything runs in the
// browser: no sign-in, no tracking, nothing is sent anywhere.
// The maths lives in src/lib/perceptron.ts (tested in tests/site/perceptron.test.ts).

const ACCENT = '#0d9488';
const INK = '#0f172a';
const MUTED = '#64748b';

interface LabState {
  neuron: Neuron;
  inputs: [Bit, Bit];
  lesson: LessonId;
  teach: TeachState;
  last: StepResult | null;
  running: boolean;
  /** Goes up with every teaching step, so the nudge badges pop again. */
  flash: number;
}

type Action =
  | { type: 'toggle'; i: 0 | 1 }
  | { type: 'setInputs'; inputs: [Bit, Bit] }
  | { type: 'slide'; key: keyof Neuron; value: number }
  | { type: 'lesson'; id: LessonId }
  | { type: 'randomise' }
  | { type: 'reset' }
  | { type: 'fishing' }
  | { type: 'step' }
  | { type: 'run' }
  | { type: 'pause' }
  | { type: 'teachAll' };

/** A random neuron that doesn't already know the lesson (so there is something to watch). */
function freshNeuron(lesson: LessonId): Neuron {
  const l = lessonById(lesson);
  let n = randomNeuron();
  for (let i = 0; i < 30 && allRight(n, l); i++) n = randomNeuron();
  return n;
}

const restart = (s: LabState, patch: Partial<LabState>): LabState => ({ ...s, teach: START, last: null, running: false, ...patch });

function applyStep(s: LabState, r: StepResult): LabState {
  const done = r.state.status === 'learned' || r.state.status === 'stuck';
  return {
    ...s,
    neuron: r.neuron,
    teach: r.state,
    last: r.checked === null ? s.last : r,
    inputs: r.checked === null ? s.inputs : [...EXAMPLES[r.checked]] as [Bit, Bit],
    running: s.running && !done,
    flash: s.flash + 1,
  };
}

function reducer(s: LabState, a: Action): LabState {
  switch (a.type) {
    case 'toggle': {
      const inputs: [Bit, Bit] = [...s.inputs];
      inputs[a.i] = inputs[a.i] ? 0 : 1;
      return { ...s, inputs };
    }
    case 'setInputs': return { ...s, inputs: a.inputs };
    case 'slide': return restart(s, { neuron: { ...s.neuron, [a.key]: a.value } });
    case 'lesson': return restart(s, { lesson: a.id });
    case 'randomise': return restart(s, { neuron: freshNeuron(s.lesson) });
    case 'reset': return restart(s, { neuron: { w1: 0, w2: 0, bias: 0 } });
    case 'fishing': return restart(s, { neuron: { w1: 0.3, w2: 0.8, bias: -0.5 } });
    case 'step': return applyStep(s, step(s.neuron, lessonById(s.lesson), s.teach));
    case 'run':
      if (s.teach.status === 'learned' || s.teach.status === 'stuck') return s;
      return { ...s, running: true };
    case 'pause': return { ...s, running: false };
    case 'teachAll': {
      // Reduced motion: no step-by-step animation, jump straight to the result.
      const lesson = lessonById(s.lesson);
      let n = s.neuron;
      let t = s.teach;
      let last = s.last;
      for (let guard = 0; guard < MAX_ROUNDS * 4 + 2; guard++) {
        const r = step(n, lesson, t);
        n = r.neuron; t = r.state;
        if (r.checked !== null) last = r;
        if (t.status === 'learned' || t.status === 'stuck') break;
      }
      return { ...s, neuron: n, teach: t, last, running: false, flash: s.flash + 1,
        inputs: last && last.checked !== null ? [...EXAMPLES[last.checked]] as [Bit, Bit] : s.inputs };
    }
  }
}

function initState(): LabState {
  return { neuron: freshNeuron('and'), inputs: [1, 1], lesson: 'and', teach: START, last: null, running: false, flash: 0 };
}

/** Slow at first so visitors can follow each check, then faster. */
function delayFor(round: number): number {
  if (round <= 2) return 650;
  if (round <= 5) return 320;
  if (round <= 12) return 130;
  return 45;
}

const EX_LABEL = (i: number) => EXAMPLES[i].join(', ');

function Message({ s }: { s: LabState }) {
  const lesson = lessonById(s.lesson);
  const { teach: t, last } = s;
  if (t.status === 'learned' && t.round === 0) {
    return <p className="nl-msg nl-msg-ok"><Sparkles size={18} /> It already gets all four right. Press <b>Randomise</b> to give it something to learn.</p>;
  }
  if (t.status === 'learned') {
    return (
      <div className="nl-msg nl-msg-win" role="status">
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.35rem' }}>Learned it in {t.round} {t.round === 1 ? 'round' : 'rounds'}!</div>
        <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
          It worked out Weight 1 = {fmt(s.neuron.w1)}, Weight 2 = {fmt(s.neuron.w2)} and Bias = {fmt(s.neuron.bias)} by itself.
          {lesson.id !== 'or' ? ' Now pick OR and teach it again.' : ' Now pick AND and teach it again.'}
        </div>
      </div>
    );
  }
  if (t.status === 'stuck') {
    return lesson.learnable
      ? <p className="nl-msg nl-msg-bad">Stopped after {MAX_ROUNDS} rounds.</p>
      : (
        <div className="nl-msg nl-msg-bad" role="status">
          <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>One neuron can’t learn this. That’s why AI uses many neurons in layers.</div>
          <div style={{ fontSize: '0.88rem', marginTop: '0.25rem' }}>It tried for {MAX_ROUNDS} rounds. One neuron can only draw one straight line between yes and no, and XOR needs two.</div>
        </div>
      );
  }
  if (!last || last.checked === null || !last.result) {
    return <p className="nl-msg">Press <b>Teach one step</b> to check one example, or <b>Teach until it learns</b> and watch it fix itself.</p>;
  }
  const [a, b] = EXAMPLES[last.checked];
  const right = lesson.answer(a, b);
  const said = (right - last.result.error) as Bit;
  if (last.result.error === 0) {
    return <p className="nl-msg"><Check size={18} color="#16a34a" /> Checked {a}, {b}: it said {said}, the right answer is {right}. Correct, so nothing changes.</p>;
  }
  const c = last.result.change;
  const parts = [c.w1 && `Weight 1 ${signed(c.w1)}`, c.w2 && `Weight 2 ${signed(c.w2)}`, c.bias && `Bias ${signed(c.bias)}`].filter(Boolean);
  return (
    <p className="nl-msg nl-msg-nudge">
      <X size={18} color="#dc2626" /> Checked {a}, {b}: it said {said}, but the answer is {right}.
      {' '}Nudge {last.result.error > 0 ? 'up' : 'down'}: {parts.length ? parts.join(', ') : 'already at the limit'}.
    </p>
  );
}

function Slider({ id, label, value, onChange }: { id: keyof Neuron; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="nl-slider">
      <label htmlFor={`nl-${id}`}><span>{label}</span><output htmlFor={`nl-${id}`} style={{ color: value > 0 ? '#2563eb' : value < 0 ? '#dc2626' : MUTED }}>{fmt(value)}</output></label>
      <input id={`nl-${id}`} type="range" min={-2} max={2} step={0.1} value={value}
        onChange={(e) => onChange(Math.round(Number(e.target.value) * 10) / 10)} />
      <div className="nl-scale" aria-hidden="true"><span>−2</span><span>0</span><span>2</span></div>
    </div>
  );
}

function Card({ title, icon, children, className = '' }: { title: string; icon: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`nl-card ${className}`} aria-label={title}>
      <h2 className="nl-card-title">{icon}{title}</h2>
      {children}
    </section>
  );
}

const EXPLAIN: { title: string; text: string }[] = [
  { title: 'What is a neuron?', text: 'A tiny switch that looks at a few clues and decides yes or no.' },
  { title: 'Weights', text: 'How much the neuron trusts each clue.' },
  { title: 'Bias', text: 'How easily the neuron says yes, like a volume knob.' },
  { title: 'Learning', text: 'Every time it’s wrong, it nudges its weights and bias a little, all by itself.' },
  { title: 'The big picture', text: 'An AI like a chatbot is billions of these switches joined in layers.' },
];

export default function NeuronLabPage({ onNav }: { onNav: (p: string) => void }) {
  const [s, dispatch] = useReducer(reducer, undefined, initState);
  const reduceMotion = useReducedMotion();
  const lesson = lessonById(s.lesson);
  const done = s.teach.status === 'learned' || s.teach.status === 'stuck';

  // "Teach until it learns": one step at a time, on a timer.
  useEffect(() => {
    if (!s.running) return;
    const id = window.setTimeout(() => dispatch({ type: 'step' }), delayFor(Math.max(1, s.teach.round)));
    return () => window.clearTimeout(id);
  }, [s.running, s.flash, s.teach.round]);

  const [x1, x2] = s.inputs;
  const sum = total(s.neuron, x1, x2);
  const answer = guess(s.neuron, x1, x2);
  // After checking the last example of a round, the counter has already moved on; keep showing the round just checked.
  const shownRound = s.teach.status === 'teaching' && s.last?.checked === EXAMPLES.length - 1 ? s.teach.round - 1 : s.teach.round;
  const score = EXAMPLES.filter(([a, b]) => guess(s.neuron, a, b) === lesson.answer(a, b)).length;
  // The nudge badges show what the latest teaching step changed (cleared by Reset, Randomise, sliders and lesson).
  const lastChange = s.last?.result && s.last.result.error !== 0 ? s.last.result.change : null;

  function teachAll() {
    if (reduceMotion) dispatch({ type: 'teachAll' });
    else dispatch({ type: s.running ? 'pause' : 'run' });
  }

  return (
    <div className="nl-page">
      <style>{CSS}</style>

      {/* Hero */}
      <section style={{ padding: '110px 1.5rem 48px', background: 'linear-gradient(160deg,#0f172a 0%,#123a3a 60%,#0f4c4a 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(45,212,191,0.14)', border: '1px solid rgba(45,212,191,0.45)', color: '#5eead4', borderRadius: 999, padding: '0.35rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
            <Brain size={14} /> Neuron Lab
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5.5vw,3.2rem)', lineHeight: 1.08, marginBottom: '1rem' }}>
            Watch one artificial neuron <span style={{ color: '#5eead4' }}>learn</span>
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 700, marginBottom: '1.25rem' }}>
            Every AI, even a chatbot, is built from tiny switches called neurons. Here is one of them. Move its numbers by hand, then press teach and watch it learn a rule by itself, fixing its own mistakes.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.4rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            <span className="nl-fact"><ShieldCheck size={16} color="#5eead4" /> No sign-in, nothing sent anywhere</span>
            <span className="nl-fact"><Smartphone size={16} color="#5eead4" /> Works on phones and computers</span>
            <a href="#nl-explain" style={{ color: '#5eead4', fontWeight: 600 }}>New to this? Read the plain-words guide ↓</a>
          </div>
        </div>
      </section>

      {/* The lab */}
      <section style={{ padding: '32px 1rem 56px', background: '#f8fafc' }}>
        <div className="nl-grid">
          <Card title="The neuron" icon={<Brain size={18} color={ACCENT} />} className="nl-area-diagram">
            <NeuronDiagram neuron={s.neuron} inputs={s.inputs} onToggle={(i) => dispatch({ type: 'toggle', i })} change={lastChange} flash={s.flash} />
            <p className="nl-sum" aria-live="polite">
              ({x1} × {fmt(s.neuron.w1)}) + ({x2} × {fmt(s.neuron.w2)}) + ({fmt(s.neuron.bias)}) = <b>{fmt(sum)}</b>
              {' '}→ {sum > 0 ? 'above zero' : 'not above zero'}, so the answer is <b style={{ color: answer ? '#b45309' : MUTED }}>{answer} ({answer ? 'yes' : 'no'})</b>
            </p>
            <p className="nl-legend">
              <span><i style={{ background: '#2563eb' }} /> blue = positive weight</span>
              <span><i style={{ background: '#dc2626' }} /> red = negative</span>
              <span>thicker = stronger</span>
              <span>faded = that input is 0, so it adds nothing</span>
            </p>
          </Card>

          <Card title="Teach it" icon={<Sparkles size={18} color={ACCENT} />} className="nl-area-teach">
            <label htmlFor="nl-lesson" className="nl-label">Pick a lesson</label>
            <select id="nl-lesson" className="nl-select" value={s.lesson} onChange={(e) => dispatch({ type: 'lesson', id: e.target.value as LessonId })}>
              <option value="and">AND: both must be 1</option>
              <option value="or">OR: either can be 1</option>
              <option value="not">NOT: Input 1 must be 0</option>
              <option value="xor">XOR: exactly one is 1 (tricky!)</option>
            </select>
            <p style={{ fontSize: '0.85rem', color: MUTED, margin: '0.4rem 0 0.9rem' }}>{lesson.rule}.</p>

            <div className="nl-buttons">
              <button type="button" className="nl-btn" onClick={() => dispatch({ type: 'step' })} disabled={done || s.running}>
                <Footprints size={18} /> Teach one step
              </button>
              <button type="button" className="nl-btn nl-btn-primary" onClick={teachAll} disabled={done}>
                {s.running ? <><Pause size={18} /> Pause</> : <><Play size={18} /> Teach until it learns</>}
              </button>
              <button type="button" className="nl-btn" onClick={() => dispatch({ type: 'randomise' })}><Shuffle size={18} /> Randomise</button>
              <button type="button" className="nl-btn" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={18} /> Reset</button>
            </div>

            <div className="nl-status">
              <span><b>Round {shownRound}</b> <span style={{ color: MUTED }}>(stops at {MAX_ROUNDS})</span></span>
              <span><b>{score} of 4</b> right</span>
            </div>
            <div aria-live="polite"><Message s={s} /></div>

            <table className="nl-table">
              <caption className="nl-sr">The four examples for {lesson.label}, with the right answer and the neuron’s guess</caption>
              <thead>
                <tr><th scope="col">Input 1</th><th scope="col">Input 2</th><th scope="col">Right answer</th><th scope="col">Neuron’s guess</th><th scope="col"><span className="nl-sr">Right or wrong</span></th></tr>
              </thead>
              <tbody>
                {EXAMPLES.map(([a, b], i) => {
                  const right = lesson.answer(a, b);
                  const g = guess(s.neuron, a, b);
                  const checking = s.last?.checked === i && s.teach.status !== 'ready';
                  const showing = x1 === a && x2 === b;
                  return (
                    <tr key={i} className={`${checking ? 'nl-row-check' : ''} ${showing ? 'nl-row-show' : ''}`}
                      onClick={() => dispatch({ type: 'setInputs', inputs: [a, b] })} title={`Show ${EX_LABEL(i)} on the neuron`}>
                      <td>{a}</td><td>{b}</td><td>{right}</td><td>{g}</td>
                      <td>{g === right
                        ? <Check size={20} color="#16a34a" aria-label="right" />
                        : <X size={20} color="#dc2626" aria-label="wrong" />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p style={{ fontSize: '0.78rem', color: MUTED, marginTop: '0.5rem' }}>
              The highlighted row is the example being checked. Tap a row to show it on the neuron.
            </p>
          </Card>

          <Card title="Play by hand" icon={<Footprints size={18} color={ACCENT} />} className="nl-area-hand">
            <div className="nl-label" id="nl-inputs-label">Inputs</div>
            <div className="nl-toggles" role="group" aria-labelledby="nl-inputs-label">
              {([0, 1] as const).map((i) => (
                <button key={i} type="button" className={`nl-toggle ${s.inputs[i] ? 'on' : ''}`} aria-pressed={s.inputs[i] === 1}
                  onClick={() => dispatch({ type: 'toggle', i })}>
                  Input {i + 1}: <b>{s.inputs[i]}</b>
                </button>
              ))}
            </div>
            <Slider id="w1" label="Weight 1" value={s.neuron.w1} onChange={(v) => dispatch({ type: 'slide', key: 'w1', value: v })} />
            <Slider id="w2" label="Weight 2" value={s.neuron.w2} onChange={(v) => dispatch({ type: 'slide', key: 'w2', value: v })} />
            <Slider id="bias" label="Bias" value={s.neuron.bias} onChange={(v) => dispatch({ type: 'slide', key: 'bias', value: v })} />
            <p style={{ fontSize: '0.8rem', color: MUTED, lineHeight: 1.55 }}>
              Can you set the sliders so the table shows four ticks for AND, before the neuron does it itself?
            </p>
          </Card>
        </div>
      </section>

      {/* Plain-language explanations */}
      <section id="nl-explain" style={{ padding: '64px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, marginBottom: '0.6rem' }}>In plain words</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: INK, lineHeight: 1.15, marginBottom: '1.5rem' }}>How a neuron thinks and learns</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: '1rem' }}>
            {EXPLAIN.map((e) => (
              <div key={e.title} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.2rem' }}>
                <div style={{ fontWeight: 800, color: INK, marginBottom: '0.4rem' }}>{e.title}</div>
                <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.6 }}>“{e.text}”</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1rem' }}>
            <div style={{ background: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: 16, padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#155e75', marginBottom: '0.5rem' }}><Fish size={20} /> Everyday example: should I go fishing?</div>
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.65, marginBottom: '0.9rem' }}>
                Input 1: is it sunny? Input 2: is it the weekend? Give sunshine a small weight (0.3), the weekend a big one (0.8), and a bias of −0.5.
                The neuron then goes fishing on any weekend, sunny or not, and never on a weekday.
              </p>
              <button type="button" className="nl-btn" onClick={() => { dispatch({ type: 'fishing' }); document.querySelector('.nl-area-diagram')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }}>
                <Fish size={18} /> Try these numbers
              </button>
            </div>
            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: '1.4rem' }}>
              <div style={{ fontWeight: 800, color: '#9a3412', marginBottom: '0.5rem' }}>Try XOR: the one it can’t learn</div>
              <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.65, margin: 0 }}>
                XOR means “yes if exactly one input is 1, but not both”. One neuron can only draw one straight line between yes and no, and XOR needs two.
                Pick XOR and press teach: it keeps trying for {MAX_ROUNDS} rounds and never gets all four. That’s why real AI joins many neurons in layers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Learn more */}
      <section style={{ padding: '56px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', background: 'linear-gradient(135deg,#0f172a,#134e4a)', borderRadius: 22, padding: 'clamp(1.5rem,4vw,2.4rem)', color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#5eead4', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}><BookOpen size={16} /> Learn more</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.4rem,3.5vw,1.9rem)', lineHeight: 1.2, marginBottom: '0.7rem' }}>From one neuron to chatbots</h2>
          <p style={{ color: '#cbd5e1', lineHeight: 1.7, marginBottom: '1.3rem', maxWidth: 640 }}>
            Where AI began in 1943, how this neuron works and learns step by step, why layers solve XOR, how chatbots are made, and how to start learning AI on your own computer.
          </p>
          <a {...pageLink('neuron-learn', onNav)} className="nl-btn nl-btn-light">Read the guide</a>
        </div>
      </section>

      {/* Credits */}
      <section style={{ padding: '40px 1.5rem 72px', background: '#fff', textAlign: 'center' }}>
        <p style={{ maxWidth: 680, margin: '0 auto', color: '#334155', lineHeight: 1.75 }}>
          Built by LomaVata Tech Services, Raiwai, Suva. Want AI or a website for your business?{' '}
          <a {...pageLink('services', onNav)} style={{ color: '#2563eb', fontWeight: 700 }}>Contact LvTS</a>.
        </p>
      </section>
    </div>
  );
}

const CSS = `
.nl-page .nl-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.nl-fact { display: inline-flex; align-items: center; gap: 0.4rem; }
.nl-grid { max-width: 1160px; margin: 0 auto; display: grid; gap: 1rem;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  grid-template-areas: "diagram teach" "hand teach"; align-items: start; }
.nl-area-diagram { grid-area: diagram; }
.nl-area-teach { grid-area: teach; }
.nl-area-hand { grid-area: hand; }
@media (max-width: 900px) {
  .nl-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "diagram" "teach" "hand"; }
}
.nl-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.1rem 1.1rem 1.2rem; box-shadow: 0 1px 3px rgba(15,23,42,0.05); }
.nl-card-title { display: flex; align-items: center; gap: 0.45rem; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.1rem; color: ${INK}; margin-bottom: 0.8rem; }
.nl-sum { text-align: center; font-size: 0.95rem; color: #334155; line-height: 1.6; margin-top: 0.6rem; font-variant-numeric: tabular-nums; }
.nl-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.3rem 1rem; font-size: 0.76rem; color: ${MUTED}; margin-top: 0.5rem; }
.nl-legend i { display: inline-block; width: 18px; height: 5px; border-radius: 3px; vertical-align: middle; margin-right: 0.3rem; }
.nl-label { display: block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #475569; margin-bottom: 0.35rem; }
.nl-select { width: 100%; min-height: 46px; border: 1px solid #cbd5e1; border-radius: 12px; padding: 0 0.8rem; font: inherit; font-weight: 700; color: ${INK}; background: #fff; }
.nl-select:focus-visible, .nl-btn:focus-visible, .nl-toggle:focus-visible, .nl-slider input:focus-visible { outline: 3px solid #5eead4; outline-offset: 2px; }
.nl-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; }
.nl-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; min-height: 46px; padding: 0.6rem 0.9rem; border-radius: 12px;
  border: 1px solid #cbd5e1; background: #fff; color: ${INK}; font: inherit; font-weight: 700; font-size: 0.92rem; cursor: pointer; text-decoration: none; line-height: 1.2; text-align: center; }
.nl-btn:hover:not(:disabled) { border-color: ${ACCENT}; }
.nl-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.nl-btn-primary { background: ${ACCENT}; border-color: ${ACCENT}; color: #fff; }
.nl-btn-primary:hover:not(:disabled) { background: #0f766e; }
.nl-btn-light { background: #fff; color: ${INK}; border: none; padding: 0.8rem 1.4rem; }
.nl-status { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 0.9rem; color: ${INK}; margin: 1rem 0 0.5rem; }
.nl-msg { display: block; min-height: 3.2rem; background: #f1f5f9; border-radius: 12px; padding: 0.65rem 0.8rem; font-size: 0.9rem; line-height: 1.5; color: #334155; margin: 0; }
.nl-msg > svg { display: inline-block; vertical-align: -4px; margin-right: 0.3rem; }
.nl-msg-nudge { background: #fff7ed; }
.nl-msg-ok { background: #ecfdf5; }
.nl-msg-win { background: linear-gradient(135deg,#ccfbf1,#fef9c3); color: #134e4a; border: 1px solid #5eead4; }
.nl-msg-bad { background: #fef2f2; color: #7f1d1d; border: 1px solid #fecaca; }
.nl-table { width: 100%; border-collapse: separate; border-spacing: 0; margin-top: 0.9rem; font-size: 0.92rem; text-align: center; font-variant-numeric: tabular-nums; }
.nl-table th { font-size: 0.72rem; font-weight: 700; color: #475569; padding: 0.4rem 0.25rem; border-bottom: 1px solid #e2e8f0; line-height: 1.25; }
.nl-table td { padding: 0.55rem 0.25rem; border-bottom: 1px solid #f1f5f9; font-weight: 700; color: ${INK}; cursor: pointer; }
.nl-table td svg { vertical-align: middle; }
.nl-table tr.nl-row-show td { background: #f0fdfa; }
.nl-table tr.nl-row-check td { background: #fef08a; }
.nl-table tr.nl-row-check td:first-child { box-shadow: inset 4px 0 0 #eab308; }
.nl-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 0.55rem; margin-bottom: 1rem; }
.nl-toggle { min-height: 48px; border-radius: 12px; border: 2px solid #cbd5e1; background: #fff; color: #475569; font: inherit; font-weight: 600; font-size: 0.95rem; cursor: pointer; }
.nl-toggle b { font-size: 1.1rem; }
.nl-toggle.on { background: ${INK}; border-color: ${INK}; color: #fff; }
.nl-slider { margin-bottom: 0.9rem; }
.nl-slider label { display: flex; justify-content: space-between; align-items: baseline; font-weight: 700; color: ${INK}; font-size: 0.95rem; margin-bottom: 0.15rem; }
.nl-slider output { font-variant-numeric: tabular-nums; font-size: 1.05rem; font-weight: 800; }
.nl-slider input[type=range] { width: 100%; height: 32px; accent-color: ${ACCENT}; cursor: pointer; touch-action: pan-y; }
.nl-scale { display: flex; justify-content: space-between; font-size: 0.7rem; color: #94a3b8; margin-top: -4px; }
.nl-input-node:focus { outline: none; }
.nl-input-node:focus-visible .nl-node-box { stroke: #14b8a6; stroke-width: 5; }
.nl-anim { transition: stroke-width 0.25s ease, fill 0.25s ease, stroke 0.25s ease, opacity 0.25s ease; }
.nl-glow { animation: nl-glow 1.8s ease-in-out infinite alternate; }
@keyframes nl-glow { from { opacity: 0.55; } to { opacity: 0.9; } }
.nl-pop { animation: nl-pop 0.35s cubic-bezier(0.34,1.56,0.64,1); }
@keyframes nl-pop { from { transform: scale(0.3); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .nl-anim { transition: none; }
  .nl-glow, .nl-pop { animation: none; }
}
`;
