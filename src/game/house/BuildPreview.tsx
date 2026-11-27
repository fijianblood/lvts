// A small drawing of a build (looking at it from the front corner), for LvTS to check builds on the admin page.
import { useEffect, useRef } from 'react';
import { GRID, PALETTE, type Brick } from './buildZone.ts';

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
};

export function BuildPreview({ bricks, size = 220 }: { bricks: Brick[]; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current?.getContext('2d');
    if (!c) return;
    const a = size / (GRID * 2 + 2), h = a * 1.2;   // a stud across, a layer up
    const ox = size / 2, oy = size * 0.62;
    const P = (x: number, y: number, z: number): [number, number] => [ox + (x - z) * a, oy + (x + z - GRID) * a * 0.5 - y * h];
    const poly = (pts: [number, number][], fill: string) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = fill; c.fill(); c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 0.6; c.stroke(); };
    c.clearRect(0, 0, size, size);
    poly([P(0, 0, 0), P(GRID, 0, 0), P(GRID, 0, GRID), P(0, 0, GRID)], '#d6d9dd');
    for (const [x, y, z, w, d, ci] of [...bricks].sort((p, q) => p[1] - q[1] || p[0] + p[2] - (q[0] + q[2]))) {
      const col = PALETTE[ci]?.hex ?? '#ffffff';
      const x1 = x + w, z1 = z + d, y1 = y + 1;
      poly([P(x, y1, z1), P(x1, y1, z1), P(x1, y, z1), P(x, y, z1)], shade(col, 0.82));
      poly([P(x1, y1, z), P(x1, y1, z1), P(x1, y, z1), P(x1, y, z)], shade(col, 0.66));
      poly([P(x, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x, y1, z1)], col);
    }
  }, [bricks, size]);
  return <canvas ref={ref} width={size} height={size} style={{ width: size, height: size, borderRadius: 10, background: '#eef2f7', flex: 'none' }} aria-label="Picture of the build" />;
}
