// A small portrait drawn from the same look as the 3D figure (picker tiles, HUD, admin page).
import type { Look } from './characters.ts';

/** A small portrait drawn from the same look as the 3D figure. */
export function Portrait({ look, size = 52 }: { look: Look; size?: number }) {
  const baby = look.kind === 'baby';
  const cx = 30, cy = baby ? 27 : 26;
  const rx = baby ? 14 : 11.5, ry = baby ? 14 : 14;
  const eyeY = cy + (baby ? 1 : -1), eyeDx = baby ? 5.5 : 4.6;
  const lip = '#7d3b35';
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden focusable="false">
      <rect width="60" height="60" rx="14" fill="#eef2ff" />
      {/* long hair falls behind the shoulders */}
      {look.hairStyle === 'long' && <path d={`M${cx - rx - 2} ${cy - 4} Q${cx - rx - 4} ${cy + 18} ${cx - rx + 2} ${cy + 20} H${cx + rx - 2} Q${cx + rx + 4} ${cy + 18} ${cx + rx + 2} ${cy - 4} Z`} fill={look.hair} />}
      <path d="M7 60 Q8 45 22 42.5 Q30 46 38 42.5 Q52 45 53 60 Z" fill={look.shirt} stroke="rgba(15,23,42,0.12)" />
      {look.print && <rect x="26.5" y="51" width="7" height="4.5" rx="1" fill={look.print} />}
      <path d={`M${cx - 4} ${cy + 10} h8 v8 q-4 3 -8 0 z`} fill={look.skin} />
      {look.hairStyle === 'afro' && <ellipse cx={cx} cy={cy - 6} rx={rx + 6} ry={ry - 1} fill={look.hair} />}
      {/* ears, then the face: rounder at the top, narrowing to the chin */}
      {!baby && <><ellipse cx={cx - rx + 0.5} cy={cy + 1} rx="2.2" ry="3.4" fill={look.skin} /><ellipse cx={cx + rx - 0.5} cy={cy + 1} rx="2.2" ry="3.4" fill={look.skin} /></>}
      <path d={`M${cx - rx} ${cy - 2} Q${cx - rx} ${cy - ry} ${cx} ${cy - ry} Q${cx + rx} ${cy - ry} ${cx + rx} ${cy - 2} Q${cx + rx - 1} ${cy + ry - 3} ${cx} ${cy + ry} Q${cx - rx + 1} ${cy + ry - 3} ${cx - rx} ${cy - 2} Z`} fill={look.skin} />
      {look.hairStyle !== 'afro' && (
        <path d={`M${cx - rx - 1} ${cy - 1} Q${cx - rx - 1} ${cy - ry - 2} ${cx} ${cy - ry - 2} Q${cx + rx + 1} ${cy - ry - 2} ${cx + rx + 1} ${cy - 1} Q${cx + rx - 2} ${cy - ry + (baby ? 6 : 5)} ${cx} ${cy - ry + (baby ? 5 : 6)} Q${cx - rx + 2} ${cy - ry + (baby ? 6 : 5)} ${cx - rx - 1} ${cy - 1} Z`}
          fill={look.hair} opacity={baby ? 0.8 : 1} />
      )}
      {look.hairStyle === 'bun' && <circle cx={cx} cy={cy - ry - 3} r="5" fill={look.hair} />}
      {look.hairStyle === 'ponytail' && <circle cx={cx + rx - 1} cy={cy - ry + 3} r="3" fill={look.hair} />}
      {look.streak && <path d={`M${cx - 4} ${cy - ry - 1} v5 M${cx + 3} ${cy - ry - 1} v5`} stroke={look.streak} strokeWidth="1.4" strokeLinecap="round" />}
      {look.earrings && <><circle cx={cx - rx + 0.5} cy={cy + 5} r="1.4" fill={look.earrings} /><circle cx={cx + rx - 0.5} cy={cy + 5} r="1.4" fill={look.earrings} /></>}
      {look.beard && <path d={`M${cx - rx + 0.5} ${cy + 1} Q${cx - rx + 1} ${cy + ry + 1} ${cx} ${cy + ry + 1} Q${cx + rx - 1} ${cy + ry + 1} ${cx + rx - 0.5} ${cy + 1} Q${cx + 6} ${cy + 6} ${cx} ${cy + 5.5} Q${cx - 6} ${cy + 6} ${cx - rx + 0.5} ${cy + 1} Z`} fill={look.hair} />}
      {/* brows, eyes (white, iris), nose, lips */}
      {!baby && <><path d={`M${cx - eyeDx - 2.4} ${eyeY - 3.6} q2.4 -1.2 4.8 0`} stroke={look.hairStyle === 'grey' ? '#8a8580' : '#1f1611'} strokeWidth="1.1" fill="none" strokeLinecap="round" />
        <path d={`M${cx + eyeDx - 2.4} ${eyeY - 3.6} q2.4 -1.2 4.8 0`} stroke={look.hairStyle === 'grey' ? '#8a8580' : '#1f1611'} strokeWidth="1.1" fill="none" strokeLinecap="round" /></>}
      {[-1, 1].map((s) => (
        <g key={s}>
          <ellipse cx={cx + s * eyeDx} cy={eyeY} rx={baby ? 2.4 : 2.2} ry={baby ? 2.2 : 1.6} fill="#f6f1ea" />
          <circle cx={cx + s * eyeDx} cy={eyeY + 0.1} r={baby ? 1.5 : 1.2} fill="#2a1a10" />
        </g>
      ))}
      <path d={`M${cx - 1.3} ${cy + 4.5} q1.3 1 2.6 0`} stroke="rgba(0,0,0,0.28)" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      <path d={`M${cx - (baby ? 2.2 : 3)} ${cy + (baby ? 7.5 : 8.2)} q${baby ? 2.2 : 3} ${baby ? 1.6 : 1.8} ${baby ? 4.4 : 6} 0`} stroke={lip} strokeWidth={baby ? 1.2 : 1.5} fill="none" strokeLinecap="round" />
    </svg>
  );
}
