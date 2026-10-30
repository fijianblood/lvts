// The minimap: a plan of the house and compound hidden under fog, cleared by
// what the player can actually see (rays stopped by walls and shut doors),
// with a breadcrumb trail of the path walked.
import { ROOMS, WALLS, BARRIERS, EXIT_ZONE, barrierRect, barrierBlocksSight, type WallRun, type Rect, type Room } from './layout.ts';
import type { OBB } from './collision.ts';

const B = { x0: -4.0, x1: 17.0, z0: -15.0, z1: 24.5 };
const PPM = 14;              // base-map pixels per metre
const GRID = 0.1;            // sight-grid cell, metres
const RAYS = 110;
const CELL = 0.5;            // 'have I seen this spot?' grid, metres (read back without touching the canvas)

const INK = {
  fog: '#0b1222',
  floor: '#e2e8f0',
  bath: '#dbeafe',
  veranda: '#fde7b0',
  outside: '#cdeccf',
  grass: '#bbe5b8',
  concrete: '#cfd6de',
  deck: '#ecd5ae',
  stairs: '#f6c9a0',
  road: '#5b6472',
  fence: 'rgba(15,23,42,0.45)',
  rail: 'rgba(15,23,42,0.6)',
  gold: '#fbbf24',
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
  private seen: Uint8Array;
  private cx: number;
  private gx: number;
  private gz: number;
  private trail: [number, number][] = [];
  private exitSeen = false;
  /** Show the exit from the start (a character who knows the way). */
  exitKnown = false;
  expanded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const w = Math.ceil((B.x1 - B.x0) * PPM), h = Math.ceil((B.z1 - B.z0) * PPM);
    this.base = document.createElement('canvas');
    this.base.width = w; this.base.height = h;
    this.fog = document.createElement('canvas');
    this.fog.width = w; this.fog.height = h;
    this.fogCtx = this.fog.getContext('2d')!;
    this.gx = Math.ceil((B.x1 - B.x0) / GRID);
    this.gz = Math.ceil((B.z1 - B.z0) / GRID);
    this.sight = new Uint8Array(this.gx * this.gz);
    this.cx = Math.ceil((B.x1 - B.x0) / CELL);
    this.seen = new Uint8Array(this.cx * Math.ceil((B.z1 - B.z0) / CELL));
    for (const wall of WALLS) for (const r of sightRects(wall)) this.markRect(r);
    for (const b of BARRIERS) if (barrierBlocksSight(b)) this.markRect(barrierRect(b));
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
    // ground first, then raised floors and stairs, then the house
    const rank = (r: Room) => (r.floor === 'road' ? 0 : r.floor === 'grass' ? 1 : r.ground ? 2 : r.floor === 'stairs' ? 4 : r.outside || r.id === 'veranda' ? 3 : 5);
    const fill = (r: Room) => ({ grass: INK.grass, concrete: INK.concrete, deck: INK.deck, stairs: INK.stairs, road: INK.road, veranda: INK.veranda, bath: INK.bath, tile: INK.floor } as Record<string, string>)[r.floor];
    for (const room of [...ROOMS].sort((a, b) => rank(a) - rank(b))) {
      g.fillStyle = fill(room);
      g.fillRect(this.mx(room.x0), this.my(room.z0), (room.x1 - room.x0) * PPM, (room.z1 - room.z0) * PPM);
      if (room.floor === 'stairs') {
        g.strokeStyle = 'rgba(120,60,20,0.35)';
        g.lineWidth = 1;
        for (let z = room.z0 + 0.28; z < room.z1; z += 0.28) { g.beginPath(); g.moveTo(this.mx(room.x0), this.my(z)); g.lineTo(this.mx(room.x1), this.my(z)); g.stroke(); }
      }
    }
    for (const b of BARRIERS) {
      if (b.kind === 'invisible') continue;
      const r = barrierRect(b);
      g.fillStyle = barrierBlocksSight(b) ? INK.wall : b.kind === 'fence' ? INK.fence : INK.rail;
      const thin = barrierBlocksSight(b) ? 2 : 1.4;
      g.fillRect(this.mx(r.x0), this.my(r.z0), Math.max(thin, (r.x1 - r.x0) * PPM), Math.max(thin, (r.z1 - r.z0) * PPM));
    }
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
    this.seen.fill(0);
  }

  private markSeen(x: number, z: number) {
    const i = Math.floor((x - B.x0) / CELL), j = Math.floor((z - B.z0) / CELL);
    if (i >= 0 && j >= 0 && i < this.cx) { const k = j * this.cx + i; if (k < this.seen.length) this.seen[k] = 1; }
  }

  /** Clear the fog for everything in sight of (px, pz). `shut` are the door panels that block sight. */
  reveal(px: number, pz: number, shut: OBB[], sight = 5.5) {
    const g = this.fogCtx;
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = '#000';
    const r = 0.45;
    // march each ray to the first wall or shut door, then clear the whole fan in one fill
    // (plus a soft round end on every ray) rather than stamping a circle at every step
    const ends: [number, number][] = [];
    for (let k = 0; k < RAYS; k++) {
      const a = (k / RAYS) * Math.PI * 2;
      const dx = Math.cos(a), dz = Math.sin(a);
      let reach = 0;
      for (let d = 0; d <= sight; d += GRID * 1.5) {
        const x = px + dx * d, z = pz + dz * d;
        const i = Math.floor((x - B.x0) / GRID), j = Math.floor((z - B.z0) / GRID);
        if (i < 0 || j < 0 || i >= this.gx || j >= this.gz) break;
        reach = d;
        this.markSeen(x, z);
        if (!this.exitSeen && x >= EXIT_ZONE.x0 - 0.3 && x <= EXIT_ZONE.x1 + 0.3 && z >= EXIT_ZONE.z0 - 0.3 && z <= EXIT_ZONE.z1 + 0.3) this.exitSeen = true;
        if (this.sight[i * this.gz + j]) break;
        let stop = false;
        for (const b of shut) if (insideOBB(x, z, b, 0.06)) { stop = true; break; }
        if (stop) break;
      }
      ends.push([px + dx * reach, pz + dz * reach]);
    }
    g.beginPath();
    ends.forEach(([x, z], k) => {
      const a = (k / RAYS) * Math.PI * 2;
      const ex = this.mx(x + Math.cos(a) * r * 0.6), ez = this.my(z + Math.sin(a) * r * 0.6);
      if (k === 0) g.moveTo(ex, ez); else g.lineTo(ex, ez);
    });
    g.closePath();
    g.fill();
    g.beginPath();
    for (const [x, z] of ends) { g.moveTo(this.mx(x) + r * PPM, this.my(z)); g.arc(this.mx(x), this.my(z), r * PPM, 0, Math.PI * 2); }
    g.moveTo(this.mx(px) + r * PPM, this.my(pz)); g.arc(this.mx(px), this.my(pz), r * PPM, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last[0] - px, last[1] - pz) > 0.35) this.trail.push([px, pz]);
  }

  isRevealed(x: number, z: number): boolean {
    const i = Math.floor((x - B.x0) / CELL), j = Math.floor((z - B.z0) / CELL);
    return i >= 0 && j >= 0 && i < this.cx && this.seen[j * this.cx + i] === 1;
  }

  get sawExit() { return this.exitSeen; }

  draw(px: number, pz: number, yaw: number, items: [number, number][], golden: [number, number] | null = null) {
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

    if (golden) {
      g.fillStyle = INK.gold;
      g.strokeStyle = '#fff';
      g.lineWidth = 1.5 / scale * dpr;
      g.beginPath(); g.arc(this.mx(golden[0]), this.my(golden[1]), 5 / scale * dpr, 0, Math.PI * 2); g.fill(); g.stroke();
    }

    if (this.exitSeen || this.exitKnown) {
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
