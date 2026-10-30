// The minimap: a plan of the house hidden under fog, cleared by what the
// player can actually see (rays stopped by walls and shut doors), with a
// breadcrumb trail of the path walked.
import { ROOMS, WALLS, EXIT_ZONE, type WallRun, type Rect } from './layout.ts';
import type { OBB } from './collision.ts';

const B = { x0: -0.8, x1: 16.0, z0: -9.8, z1: 15.8 };
const PPM = 14;              // base-map pixels per metre
const GRID = 0.1;            // sight-grid cell, metres
const SIGHT = 5.5;           // how far you can see, metres
const RAYS = 90;

const INK = {
  fog: '#0b1222',
  floor: '#e2e8f0',
  bath: '#dbeafe',
  veranda: '#fde7b0',
  outside: '#cdeccf',
  wall: '#0f172a',
  door: '#f59e0b',
  trail: 'rgba(124,58,237,0.75)',
  player: '#2563eb',
  item: '#7c3aed',
  exit: '#16a34a',
};

/** Solid spans of a wall for sight: doors and windows are both see-through openings here (shut doors are tested separately). */
function sightRects(wall: WallRun): Rect[] {
  const open = [...wall.openings].sort((a, b) => a.from - b.from);
  const spans: [number, number][] = [];
  let c = wall.from;
  for (const o of open) { if (o.from > c) spans.push([c, o.from]); c = Math.max(c, o.to); }
  if (c < wall.to) spans.push([c, wall.to]);
  const h = wall.t / 2;
  return spans.map(([a, b]) => (wall.at === 'x' ? { x0: wall.line - h, x1: wall.line + h, z0: a, z1: b } : { x0: a, x1: b, z0: wall.line - h, z1: wall.line + h }));
}

function insideOBB(x: number, z: number, b: OBB, pad: number): boolean {
  const c = Math.cos(b.angle), s = Math.sin(b.angle);
  const rx = x - b.cx, rz = z - b.cz;
  const lx = rx * c + rz * s, lz = -rx * s + rz * c;
  return Math.abs(lx) <= b.hx + pad && Math.abs(lz) <= b.hz + pad;
}

export class Minimap {
  private canvas: HTMLCanvasElement;
  private base: HTMLCanvasElement;
  private fog: HTMLCanvasElement;
  private fogCtx: CanvasRenderingContext2D;
  private sight: Uint8Array;
  private gx: number;
  private gz: number;
  private trail: [number, number][] = [];
  private exitSeen = false;
  expanded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const w = Math.ceil((B.x1 - B.x0) * PPM), h = Math.ceil((B.z1 - B.z0) * PPM);
    this.base = document.createElement('canvas');
    this.base.width = w; this.base.height = h;
    this.fog = document.createElement('canvas');
    this.fog.width = w; this.fog.height = h;
    this.fogCtx = this.fog.getContext('2d', { willReadFrequently: true })!;
    this.gx = Math.ceil((B.x1 - B.x0) / GRID);
    this.gz = Math.ceil((B.z1 - B.z0) / GRID);
    this.sight = new Uint8Array(this.gx * this.gz);
    for (const wall of WALLS) for (const r of sightRects(wall)) this.markRect(r);
    this.drawBase();
    this.reset();
  }

  private markRect(r: Rect) {
    const i0 = Math.floor((r.x0 - B.x0) / GRID), i1 = Math.ceil((r.x1 - B.x0) / GRID);
    const j0 = Math.floor((r.z0 - B.z0) / GRID), j1 = Math.ceil((r.z1 - B.z0) / GRID);
    for (let i = Math.max(0, i0); i < Math.min(this.gx, i1); i++)
      for (let j = Math.max(0, j0); j < Math.min(this.gz, j1); j++) this.sight[i * this.gz + j] = 1;
  }

  private mx(x: number) { return (x - B.x0) * PPM; }
  private my(z: number) { return (z - B.z0) * PPM; }

  private drawBase() {
    const g = this.base.getContext('2d')!;
    g.clearRect(0, 0, this.base.width, this.base.height);
    for (const room of ROOMS) {
      g.fillStyle = room.outside ? INK.outside : room.floor === 'bath' ? INK.bath : room.floor === 'veranda' ? INK.veranda : INK.floor;
      g.fillRect(this.mx(room.x0), this.my(room.z0), (room.x1 - room.x0) * PPM, (room.z1 - room.z0) * PPM);
    }
    // yard around the back steps and the carport apron
    g.fillStyle = INK.outside;
    g.fillRect(this.mx(-0.8), this.my(-9.8), 16.8 * PPM, 2.2 * PPM);
    g.fillStyle = INK.wall;
    for (const wall of WALLS) {
      for (const r of sightRects(wall)) g.fillRect(this.mx(r.x0), this.my(r.z0), Math.max(2, (r.x1 - r.x0) * PPM), Math.max(2, (r.z1 - r.z0) * PPM));
      for (const o of wall.openings) {
        if (o.kind === 'window') {
          g.fillStyle = '#7dd3fc';
          if (wall.at === 'x') g.fillRect(this.mx(wall.line) - 1.5, this.my(o.from), 3, (o.to - o.from) * PPM);
          else g.fillRect(this.mx(o.from), this.my(wall.line) - 1.5, (o.to - o.from) * PPM, 3);
          g.fillStyle = INK.wall;
        }
      }
    }
    g.fillStyle = 'rgba(22,163,74,0.35)';
    g.fillRect(this.mx(EXIT_ZONE.x0), this.my(EXIT_ZONE.z0), (EXIT_ZONE.x1 - EXIT_ZONE.x0) * PPM, (EXIT_ZONE.z1 - EXIT_ZONE.z0) * PPM);
  }

  reset() {
    const g = this.fogCtx;
    g.globalCompositeOperation = 'source-over';
    g.fillStyle = INK.fog;
    g.fillRect(0, 0, this.fog.width, this.fog.height);
    this.trail = [];
    this.exitSeen = false;
  }

  /** Clear the fog for everything in sight of (px, pz). `shut` are the door panels that block sight. */
  reveal(px: number, pz: number, shut: OBB[]) {
    const g = this.fogCtx;
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    const r = 0.45 * PPM;
    for (let k = 0; k < RAYS; k++) {
      const a = (k / RAYS) * Math.PI * 2;
      const dx = Math.cos(a), dz = Math.sin(a);
      for (let d = 0; d <= SIGHT; d += GRID * 1.5) {
        const x = px + dx * d, z = pz + dz * d;
        const i = Math.floor((x - B.x0) / GRID), j = Math.floor((z - B.z0) / GRID);
        if (i < 0 || j < 0 || i >= this.gx || j >= this.gz) break;
        g.beginPath(); g.arc(this.mx(x), this.my(z), r, 0, Math.PI * 2); g.fill();
        if (this.sight[i * this.gz + j]) break;
        let stop = false;
        for (const b of shut) if (insideOBB(x, z, b, 0.06)) { stop = true; break; }
        if (stop) break;
        if (!this.exitSeen && x >= EXIT_ZONE.x0 - 0.3 && x <= EXIT_ZONE.x1 + 0.3 && z >= EXIT_ZONE.z0 - 0.3 && z <= EXIT_ZONE.z1 + 0.3) this.exitSeen = true;
      }
    }
    g.globalCompositeOperation = 'source-over';
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last[0] - px, last[1] - pz) > 0.35) this.trail.push([px, pz]);
  }

  isRevealed(x: number, z: number): boolean {
    const p = this.fogCtx.getImageData(Math.floor(this.mx(x)), Math.floor(this.my(z)), 1, 1).data;
    return p[3] < 40;
  }

  get sawExit() { return this.exitSeen; }

  draw(px: number, pz: number, yaw: number, items: [number, number][]) {
    const c = this.canvas;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = c.clientWidth || 180, cssH = c.clientHeight || 180;
    if (c.width !== Math.round(cssW * dpr) || c.height !== Math.round(cssH * dpr)) { c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr); }
    const g = c.getContext('2d')!;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = INK.fog;
    g.fillRect(0, 0, c.width, c.height);

    // world -> screen: centred on the player (small map) or the whole house (expanded)
    let scale: number, ox: number, oy: number;
    if (this.expanded) {
      const fx = (B.x1 - B.x0) * PPM, fz = (B.z1 - B.z0) * PPM;
      scale = Math.min(c.width / fx, c.height / fz) * 0.96;
      ox = (c.width - fx * scale) / 2;
      oy = (c.height - fz * scale) / 2;
    } else {
      const view = 7.5; // metres from centre to edge
      scale = c.width / (view * 2 * PPM);
      ox = c.width / 2 - this.mx(px) * scale;
      oy = c.height / 2 - this.my(pz) * scale;
    }
    g.setTransform(scale, 0, 0, scale, ox, oy);
    g.imageSmoothingEnabled = true;
    g.drawImage(this.base, 0, 0);
    g.drawImage(this.fog, 0, 0);

    // breadcrumb trail
    if (this.trail.length > 1) {
      g.strokeStyle = INK.trail;
      g.lineWidth = 2.2 / scale * dpr;
      g.setLineDash([4 / scale * dpr, 4 / scale * dpr]);
      g.beginPath();
      this.trail.forEach(([x, z], i) => (i ? g.lineTo(this.mx(x), this.my(z)) : g.moveTo(this.mx(x), this.my(z))));
      g.lineTo(this.mx(px), this.my(pz));
      g.stroke();
      g.setLineDash([]);
    }

    // parts you have spotted but not picked up
    g.fillStyle = INK.item;
    for (const [x, z] of items) { g.beginPath(); g.arc(this.mx(x), this.my(z), 3.4 / scale * dpr, 0, Math.PI * 2); g.fill(); }

    if (this.exitSeen) {
      const ex = this.mx((EXIT_ZONE.x0 + EXIT_ZONE.x1) / 2), ez = this.my((EXIT_ZONE.z0 + EXIT_ZONE.z1) / 2);
      g.fillStyle = INK.exit;
      g.beginPath(); g.arc(ex, ez, 5 / scale * dpr, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#fff';
      g.font = `${800} ${9 / scale * dpr}px "Space Grotesk", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('EXIT', ex, ez - 11 / scale * dpr);
    }

    if (this.expanded) {
      g.font = `600 ${8.5 / scale * dpr}px "Space Grotesk", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const room of ROOMS) {
        if (room.outside) continue;
        const cx = (room.x0 + room.x1) / 2, cz = (room.z0 + room.z1) / 2;
        if (!this.isRevealed(cx, cz)) continue;
        g.fillStyle = 'rgba(15,23,42,0.55)';
        g.fillText(room.name, this.mx(cx), this.my(cz));
      }
    }

    // the player: an arrow pointing where you look
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    const ang = Math.atan2(fz, fx);
    g.save();
    g.translate(this.mx(px), this.my(pz));
    g.rotate(ang);
    const s = 7 / scale * dpr;
    g.fillStyle = INK.player;
    g.strokeStyle = '#fff';
    g.lineWidth = 1.6 / scale * dpr;
    g.beginPath(); g.moveTo(s * 1.25, 0); g.lineTo(-s * 0.8, s * 0.8); g.lineTo(-s * 0.35, 0); g.lineTo(-s * 0.8, -s * 0.8); g.closePath();
    g.fill(); g.stroke();
    g.restore();
  }
}
