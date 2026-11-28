import type { KeyboardEvent } from 'react';
import { type Bit, type Neuron, fmt, guess, signed, total } from '../../lib/perceptron';

// The neuron drawing on the Neuron Lab page: two input arrows, the neuron
// circle with its total, the bias coming in from below and the output arrow.
// Arrow thickness follows the size of the weight; blue is positive, red is
// negative. Faded arrows carry an input of 0, so they add nothing.

const BLUE = '#2563eb';
const RED = '#dc2626';
const GREY = '#94a3b8';
const INK = '#0f172a';

const C = { x: 330, y: 160, r: 70 };
const IN = [{ x: 56, y: 84 }, { x: 56, y: 236 }];
const NODE = 72;
const OUT = { x: 556, y: 160 };
const BIAS = { x: 330, y: 298 };
/** How far along each input arrow its weight label sits (0 = start, 1 = tip), clear of the arrowhead. */
const LABEL_AT = 0.4;

const colourFor = (v: number) => (v > 0 ? BLUE : v < 0 ? RED : GREY);
const widthFor = (v: number) => 2 + Math.min(2, Math.abs(v)) * 4.5;

interface Pt { x: number; y: number }

/** A straight arrow from a to b with a filled head, its line stopping short of the tip. */
function Arrow({ a, b, colour, width, opacity = 1 }: { a: Pt; b: Pt; colour: string; width: number; opacity?: number }) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const head = 12 + width * 1.1;
  const half = head * 0.62;
  const baseX = b.x - ux * head;
  const baseY = b.y - uy * head;
  const pts = `${b.x},${b.y} ${baseX - uy * half},${baseY + ux * half} ${baseX + uy * half},${baseY - ux * half}`;
  return (
    <g className="nl-anim" style={{ opacity }}>
      <line x1={a.x} y1={a.y} x2={b.x - ux * head * 0.8} y2={b.y - uy * head * 0.8} stroke={colour} strokeWidth={width} strokeLinecap="round" className="nl-anim" />
      <polygon points={pts} fill={colour} className="nl-anim" />
    </g>
  );
}

/** Where the line from p to the circle's centre meets the circle (with a small gap). */
function edgeOfCircle(p: Pt, gap = 4): Pt {
  const dx = C.x - p.x;
  const dy = C.y - p.y;
  const len = Math.hypot(dx, dy);
  return { x: C.x - (dx / len) * (C.r + gap), y: C.y - (dy / len) * (C.r + gap) };
}

function Pill({ x, y, text, colour, width = 126 }: { x: number; y: number; text: string; colour: string; width?: number }) {
  return (
    <g>
      <rect x={x - width / 2} y={y - 18} width={width} height={36} rx={18} fill="#fff" stroke={colour} strokeWidth={2.5} className="nl-anim" />
      <text x={x} y={y + 7} textAnchor="middle" fontSize={19} fontWeight={700} fill={INK}>{text}</text>
    </g>
  );
}

/** "+0.1" / "−0.1" that pops up next to a number the last teaching step changed. */
function NudgeBadge({ x, y, change, flash }: { x: number; y: number; change: number; flash: number }) {
  if (!change) return null;
  const up = change > 0;
  return (
    <g key={flash} className="nl-pop" style={{ transformOrigin: `${x}px ${y}px` }}>
      <rect x={x - 30} y={y - 14} width={60} height={28} rx={14} fill={up ? '#16a34a' : '#ea580c'} />
      <text x={x} y={y + 6} textAnchor="middle" fontSize={16} fontWeight={800} fill="#fff">{signed(change)}</text>
    </g>
  );
}

export interface DiagramProps {
  neuron: Neuron;
  inputs: [Bit, Bit];
  onToggle: (i: 0 | 1) => void;
  /** How much the last teaching step moved each number (all 0 when it didn't). */
  change: Neuron | null;
  /** Changes with every teaching step, so the badges pop again. */
  flash: number;
}

export default function NeuronDiagram({ neuron, inputs, onToggle, change, flash }: DiagramProps) {
  const [x1, x2] = inputs;
  const sum = total(neuron, x1, x2);
  const yes = guess(neuron, x1, x2) === 1;
  const weights = [neuron.w1, neuron.w2];

  function keyToggle(e: KeyboardEvent, i: 0 | 1) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(i); }
  }

  return (
    <svg viewBox="0 0 600 320" width="100%" role="group" aria-labelledby="nl-diagram-title"
      style={{ display: 'block', maxWidth: 620, margin: '0 auto', fontFamily: "'Space Grotesk',system-ui,sans-serif", overflow: 'visible' }}>
      <title id="nl-diagram-title">
        {`Neuron drawing. Input 1 is ${x1}, Input 2 is ${x2}. Weight 1 is ${fmt(neuron.w1)}, weight 2 is ${fmt(neuron.w2)}, bias is ${fmt(neuron.bias)}. Total ${fmt(sum)}, so the answer is ${yes ? '1, yes' : '0, no'}.`}
      </title>
      <defs>
        <radialGradient id="nl-lit" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="55%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <filter id="nl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* Input arrows, with each weight written on its arrow */}
      {IN.map((p, i) => {
        const w = weights[i];
        const from = { x: p.x + NODE / 2 + 2, y: p.y };
        const to = edgeOfCircle(from);
        const mid = { x: from.x + (to.x - from.x) * LABEL_AT, y: from.y + (to.y - from.y) * LABEL_AT };
        const on = inputs[i] === 1;
        return (
          <g key={i}>
            <Arrow a={from} b={to} colour={colourFor(w)} width={widthFor(w)} opacity={on ? 1 : 0.35} />
            <Pill x={mid.x} y={mid.y} text={`weight ${fmt(w)}`} colour={colourFor(w)} />
            <NudgeBadge x={mid.x} y={i === 0 ? mid.y - 36 : mid.y + 36} change={change ? (i === 0 ? change.w1 : change.w2) : 0} flash={flash} />
          </g>
        );
      })}

      {/* Input boxes: tap to switch between 0 and 1 */}
      {IN.map((p, i) => {
        const on = inputs[i] === 1;
        const idx = i as 0 | 1;
        return (
          <g key={`in-${i}`} role="button" tabIndex={0} aria-pressed={on} aria-label={`Input ${i + 1} is ${inputs[i]}. Tap to switch.`}
            onClick={() => onToggle(idx)} onKeyDown={(e) => keyToggle(e, idx)} className="nl-input-node" style={{ cursor: 'pointer' }}>
            <text x={p.x} y={i === 0 ? p.y - NODE / 2 - 12 : p.y + NODE / 2 + 26} textAnchor="middle" fontSize={20} fontWeight={700} fill="#334155">Input {i + 1}</text>
            <rect x={p.x - NODE / 2} y={p.y - NODE / 2} width={NODE} height={NODE} rx={16}
              fill={on ? INK : '#fff'} stroke={on ? INK : '#cbd5e1'} strokeWidth={3} className="nl-node-box" />
            <text x={p.x} y={p.y + 14} textAnchor="middle" fontSize={40} fontWeight={800} fill={on ? '#fff' : '#94a3b8'}>{inputs[i]}</text>
          </g>
        );
      })}

      {/* Bias, coming in from below */}
      <Arrow a={{ x: BIAS.x, y: BIAS.y - 18 }} b={{ x: C.x, y: C.y + C.r + 4 }} colour={colourFor(neuron.bias)} width={widthFor(neuron.bias)} />
      <Pill x={BIAS.x} y={BIAS.y} text={`bias ${fmt(neuron.bias)}`} colour={colourFor(neuron.bias)} width={122} />
      <NudgeBadge x={BIAS.x + 98} y={BIAS.y} change={change ? change.bias : 0} flash={flash} />

      {/* The neuron: lights up when it says yes */}
      {yes && <circle cx={C.x} cy={C.y} r={C.r + 6} fill="#fbbf24" opacity={0.75} filter="url(#nl-glow)" className="nl-glow" />}
      <circle cx={C.x} cy={C.y} r={C.r} fill={yes ? 'url(#nl-lit)' : '#fff'} stroke={yes ? '#d97706' : '#cbd5e1'} strokeWidth={4} className="nl-anim" />
      <text x={C.x} y={C.y - 16} textAnchor="middle" fontSize={16} fontWeight={600} fill={yes ? '#78350f' : '#64748b'}>total</text>
      <text x={C.x} y={C.y + 22} textAnchor="middle" fontSize={34} fontWeight={800} fill={INK}>{fmt(sum)}</text>

      {/* Output */}
      <Arrow a={{ x: C.x + C.r + 4, y: C.y }} b={{ x: OUT.x - NODE / 2 - 6, y: OUT.y }} colour={yes ? '#f59e0b' : GREY} width={6} />
      <text x={OUT.x} y={OUT.y - NODE / 2 - 12} textAnchor="middle" fontSize={20} fontWeight={700} fill="#334155">Output</text>
      <rect x={OUT.x - NODE / 2} y={OUT.y - NODE / 2} width={NODE} height={NODE} rx={16}
        fill={yes ? '#fde047' : '#fff'} stroke={yes ? '#d97706' : '#cbd5e1'} strokeWidth={3} />
      <text x={OUT.x} y={OUT.y + 14} textAnchor="middle" fontSize={40} fontWeight={800} fill={yes ? INK : '#94a3b8'}>{yes ? 1 : 0}</text>
      <text x={OUT.x} y={OUT.y + NODE / 2 + 26} textAnchor="middle" fontSize={20} fontWeight={800} fill={yes ? '#b45309' : '#64748b'}>{yes ? 'yes' : 'no'}</text>
    </svg>
  );
}
