import { EXAMPLES, lessonById, type LessonId } from '../../lib/perceptron';

// Small drawings for the Neuron Lab's Learn page. The numbers they show come
// from src/lib/neuronExamples.ts, worked out by the same code as the Neuron Lab.

const INK = '#0f172a';
const FONT = "'Space Grotesk',system-ui,sans-serif";

/** Bars: mistakes in each round of the worked example, then a final check with 0. */
export function MistakesChart({ mistakes }: { mistakes: number[] }) {
  const bars = [...mistakes.map((m, i) => ({ label: `Round ${i + 1}`, short: `${i + 1}`, value: m })), { label: 'Final check', short: 'Check', value: 0 }];
  const W = 520, H = 240, left = 44, bottom = 44, top = 20;
  const max = 4;
  const slot = (W - left - 10) / bars.length;
  const y = (v: number) => top + (H - top - bottom) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" style={{ display: 'block', maxWidth: 560, fontFamily: FONT }}
      aria-label={`Mistakes in each round: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}.`}>
      {[0, 1, 2, 3, 4].map((v) => (
        <g key={v}>
          <line x1={left} x2={W - 10} y1={y(v)} y2={y(v)} stroke="#e2e8f0" strokeWidth={1} />
          <text x={left - 10} y={y(v) + 5} textAnchor="end" fontSize={14} fill="#64748b">{v}</text>
        </g>
      ))}
      {bars.map((b, i) => {
        const x = left + i * slot + slot * 0.18;
        const w = slot * 0.64;
        return (
          <g key={b.label}>
            {b.value > 0 && <rect x={x} y={y(b.value)} width={w} height={y(0) - y(b.value)} rx={6} fill={i === bars.length - 1 ? '#16a34a' : '#0d9488'} />}
            <text x={x + w / 2} y={(b.value > 0 ? y(b.value) : y(0)) - 8} textAnchor="middle" fontSize={16} fontWeight={800} fill={b.value ? INK : '#16a34a'}>{b.value}</text>
            <text x={x + w / 2} y={H - bottom + 22} textAnchor="middle" fontSize={14} fill="#475569">{b.short}</text>
          </g>
        );
      })}
      <text x={left} y={H - 4} fontSize={13} fill="#64748b">Round →</text>
    </svg>
  );
}

/**
 * The four input combinations as dots on a square (yes = filled), with the
 * straight line one neuron would draw. XOR shows the two lines it would need.
 */
export function DotsSquare({ lesson, lines }: { lesson: LessonId; lines: number[] }) {
  // Each line is x + y = c, drawn across the square.
  const S = 150, pad = 34;
  const px = (v: number) => pad + v * S;
  const py = (v: number) => pad + (1 - v) * S;
  const l = lessonById(lesson);
  const ok = l.learnable;
  return (
    <figure style={{ margin: 0, textAlign: 'center' }}>
      <svg viewBox={`0 0 ${S + pad * 2} ${S + pad * 2 + 6}`} width="100%" role="img" style={{ display: 'block', maxWidth: 220, margin: '0 auto', fontFamily: FONT }}
        aria-label={`${l.label}: ${ok ? 'one straight line splits the yes dots from the no dots' : 'no single straight line can split the yes dots from the no dots; it needs two'}.`}>
        <rect x={px(0)} y={py(1)} width={S} height={S} fill="#f8fafc" stroke="#cbd5e1" strokeWidth={1.5} rx={6} />
        {lines.map((c) => {
          // x + y = c, clipped to the square (with a little overhang).
          const a = { x: Math.max(-0.12, c - 1.12), y: 0 };
          a.y = c - a.x;
          const b = { x: Math.min(1.12, c + 0.12), y: 0 };
          b.y = c - b.x;
          return <line key={c} x1={px(a.x)} y1={py(a.y)} x2={px(b.x)} y2={py(b.y)} stroke={ok ? '#0d9488' : '#ea580c'} strokeWidth={4} strokeDasharray={ok ? undefined : '9 7'} strokeLinecap="round" />;
        })}
        {EXAMPLES.map(([a, b]) => {
          const yes = l.answer(a, b) === 1;
          return (
            <g key={`${a}${b}`}>
              <circle cx={px(a)} cy={py(b)} r={15} fill={yes ? '#fbbf24' : '#fff'} stroke={yes ? '#d97706' : '#94a3b8'} strokeWidth={3} />
              <text x={px(a)} y={py(b) + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill={yes ? INK : '#64748b'}>{yes ? 1 : 0}</text>
            </g>
          );
        })}
        <text x={px(0.5)} y={S + pad * 2} textAnchor="middle" fontSize={12} fill="#64748b">Input 1 →</text>
        <text x={10} y={py(0.5)} textAnchor="middle" fontSize={12} fill="#64748b" transform={`rotate(-90 10 ${py(0.5)})`}>Input 2 →</text>
      </svg>
      <figcaption style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.3rem', lineHeight: 1.4 }}>
        <b>{l.label}</b>: {ok ? 'one line does it' : 'needs two lines'}
      </figcaption>
    </figure>
  );
}

/** Two inputs, a hidden layer of two neurons (OR and NAND), and one output neuron (AND). */
export function XorNetwork() {
  const inX = 60, hidX = 260, outX = 460;
  const nodes = {
    x1: { x: inX, y: 70 }, x2: { x: inX, y: 210 },
    A: { x: hidX, y: 70 }, B: { x: hidX, y: 210 },
    O: { x: outX, y: 140 },
  };
  const edge = (from: keyof typeof nodes, to: keyof typeof nodes, w: number, labelAt = 0.32) => {
    const a = nodes[from], b = nodes[to];
    const lx = a.x + (b.x - a.x) * labelAt, ly = a.y + (b.y - a.y) * labelAt;
    const colour = w > 0 ? '#2563eb' : '#dc2626';
    return (
      <g key={`${from}${to}`}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={colour} strokeWidth={3} opacity={0.75} />
        <rect x={lx - 18} y={ly - 13} width={36} height={24} rx={12} fill="#fff" stroke={colour} strokeWidth={1.5} />
        <text x={lx} y={ly + 4} textAnchor="middle" fontSize={13} fontWeight={800} fill={INK}>{w > 0 ? w : `−${-w}`}</text>
      </g>
    );
  };
  const neuron = (k: 'A' | 'B' | 'O', title: string, bias: number) => {
    const p = nodes[k];
    return (
      <g key={k}>
        <circle cx={p.x} cy={p.y} r={41} fill="#fff" stroke="#0d9488" strokeWidth={3.5} />
        <text x={p.x} y={p.y + 5} textAnchor="middle" fontSize={14} fontWeight={800} fill={INK}>{title}</text>
        <text x={p.x} y={p.y + 58} textAnchor="middle" fontSize={12} fill="#475569">bias {bias > 0 ? bias : `−${-bias}`}</text>
      </g>
    );
  };
  return (
    <svg viewBox="0 0 540 280" width="100%" role="img" style={{ display: 'block', maxWidth: 560, margin: '0 auto', fontFamily: FONT }}
      aria-label="XOR with three neurons: Input 1 and Input 2 both feed hidden neuron A (OR, weights 1 and 1, bias −0.5) and hidden neuron B (NAND, weights −1 and −1, bias 1.5). A and B feed the output neuron (AND, weights 1 and 1, bias −1.5).">
      {edge('x1', 'A', 1, 0.45)}{edge('x2', 'A', 1, 0.3)}{edge('x1', 'B', -1, 0.3)}{edge('x2', 'B', -1, 0.45)}
      {edge('A', 'O', 1, 0.45)}{edge('B', 'O', 1, 0.45)}
      {(['x1', 'x2'] as const).map((k, i) => (
        <g key={k}>
          <rect x={nodes[k].x - 30} y={nodes[k].y - 26} width={60} height={52} rx={12} fill={INK} />
          <text x={nodes[k].x} y={nodes[k].y + 6} textAnchor="middle" fontSize={15} fontWeight={800} fill="#fff">Input {i + 1}</text>
        </g>
      ))}
      {neuron('A', 'A: OR', -0.5)}
      {neuron('B', 'B: NAND', 1.5)}
      {neuron('O', 'AND', -1.5)}
      <text x={hidX} y={20} textAnchor="middle" fontSize={13} fontWeight={700} fill="#64748b">hidden layer</text>
      <text x={outX} y={64} textAnchor="middle" fontSize={13} fontWeight={700} fill="#64748b">output</text>
    </svg>
  );
}
