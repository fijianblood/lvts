// A small portrait drawn from the same look as the 3D figure (picker tiles, HUD, admin page).
import type { Look } from './characters.ts';

/** A small low-poly portrait drawn from the same look as the 3D figure. */
export function Portrait({ look, size = 52 }: { look: Look; size?: number }) {
  const baby = look.kind === 'baby';
  const head = baby ? { x: 14, y: 11, w: 32, h: 30 } : { x: 17, y: 13, w: 26, h: 27 };
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden focusable="false">
      <rect width="60" height="60" rx="14" fill="#eef2ff" />
      <path d="M7 60 Q8 44 30 42 Q52 44 53 60 Z" fill={look.shirt} stroke="rgba(15,23,42,0.12)" />
      {look.print && <rect x="26" y="50" width="8" height="5" fill={look.print} />}
      <rect x="26" y="36" width="8" height="8" fill={look.skin} />
      <rect x={head.x} y={head.y} width={head.w} height={head.h} rx="5" fill={look.skin} />
      {look.hairStyle === 'afro'
        ? <rect x="12" y="4" width="36" height="19" rx="9" fill={look.hair} />
        : <rect x={head.x - 1} y={head.y - 2} width={head.w + 2} height={baby ? 5 : 8} rx="3" fill={look.hair} />}
      {look.hairStyle === 'bun' && <circle cx="30" cy="9" r="5.5" fill={look.hair} />}
      {look.hairStyle === 'long' && <path d={`M${head.x - 2} ${head.y + 2} h4 v${head.h + 2} h-4 z M${head.x + head.w - 2} ${head.y + 2} h4 v${head.h + 2} h-4 z`} fill={look.hair} />}
      {look.streak && <path d="M24.5 11 v7 M35.5 11 v7" stroke={look.streak} strokeWidth="1.5" strokeLinecap="round" />}
      {look.earrings && <><circle cx={head.x - 0.5} cy="31" r="1.8" fill={look.earrings} /><circle cx={head.x + head.w + 0.5} cy="31" r="1.8" fill={look.earrings} /></>}
      {look.beard && <path d="M16 27 h28 v7 q-14 11 -28 0 z" fill={look.hair} />}
      <rect x={baby ? 22 : 23} y={baby ? 25 : 24} width="3.5" height="3" fill="#1a1412" />
      <rect x={baby ? 34.5 : 33.5} y={baby ? 25 : 24} width="3.5" height="3" fill="#1a1412" />
      {!look.beard && <rect x="27" y={baby ? 33 : 32} width="6" height="1.6" rx="0.8" fill="#5a2f22" />}
    </svg>
  );
}
