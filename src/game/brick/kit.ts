// Noqublox brick kit: the shared parts for the toy-brick look.
// Bricks are original LvTS parts (not LEGO): rounded plastic blocks with studs.
// Every brick of the same size is drawn in one batch (InstancedMesh) so a
// whole street stays light enough for phones.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

/** Stud pitch in metres (one stud = 0.4 m in the world). */
export const P = 0.4;
/** Plate height; a brick is three plates. */
export const PL = 0.16;
export const BRICK = PL * 3;
const GAP = 0.006;
const STUD_R = 0.12;
const STUD_H = 0.07;

// ── materials ──────────────────────────────────────────────
const mats = new Map<string, THREE.Material>();

/** Glossy ABS plastic. White by default so instance colours show through. */
export function plastic(color = '#ffffff', extra: THREE.MeshPhysicalMaterialParameters = {}): THREE.MeshPhysicalMaterial {
  const key = `p|${color}|${JSON.stringify(extra)}`;
  let m = mats.get(key) as THREE.MeshPhysicalMaterial | undefined;
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      envMapIntensity: 0.9,
      ...extra,
    });
    mats.set(key, m);
  }
  return m;
}

export const glass = (): THREE.MeshPhysicalMaterial =>
  plastic('#bfe4ff', { transparent: true, opacity: 0.32, roughness: 0.04, clearcoat: 1, depthWrite: false });

export const rubber = (): THREE.MeshPhysicalMaterial => plastic('#1b1d21', { roughness: 0.78, clearcoat: 0 });

export const glow = (color: string, intensity = 1.4): THREE.MeshPhysicalMaterial =>
  plastic(color, { emissive: color, emissiveIntensity: intensity });

// ── textures ───────────────────────────────────────────────
function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  return t;
}

/** One stud per tile: a bump map plus a soft contact shadow, for baseplates. */
function studTiles(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
  const S = 64;
  const r = S * 0.3;
  const map = canvasTex(S, S, (g) => {
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, S, S);
    const sh = g.createRadialGradient(S / 2 + 3, S / 2 + 4, r * 0.8, S / 2 + 3, S / 2 + 4, r * 1.35);
    sh.addColorStop(0, 'rgba(0,0,0,0.28)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.fillRect(0, 0, S, S);
    const hi = g.createRadialGradient(S / 2 - 5, S / 2 - 5, 1, S / 2, S / 2, r);
    hi.addColorStop(0, '#ffffff');
    hi.addColorStop(1, '#e6e6e6');
    g.fillStyle = hi;
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.fill();
  });
  map.colorSpace = THREE.SRGBColorSpace;
  const bump = canvasTex(S, S, (g) => {
    g.fillStyle = '#000';
    g.fillRect(0, 0, S, S);
    g.filter = 'blur(1.2px)';
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.fill();
  });
  for (const t of [map, bump]) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}

let tiles: ReturnType<typeof studTiles> | null = null;

/** A studded baseplate material, tiled so one texture repeat = one stud. */
export function baseplate(color: string, w: number, d: number): THREE.MeshPhysicalMaterial {
  tiles ??= studTiles();
  const map = tiles.map.clone();
  const bump = tiles.bump.clone();
  for (const t of [map, bump]) {
    t.repeat.set(w / P, d / P);
    t.needsUpdate = true;
  }
  return new THREE.MeshPhysicalMaterial({
    color, map, bumpMap: bump, bumpScale: 1.6,
    roughness: 0.38, clearcoat: 0.4, clearcoatRoughness: 0.25,
  });
}

/** Smooth tiles (roads, footpaths) with faint seams every few studs. */
export function tiles2(color: string, w: number, d: number, every = 8, matte = false): THREE.MeshPhysicalMaterial {
  const S = 256;
  const map = canvasTex(S, S, (g) => {
    g.fillStyle = '#fff';
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(0,0,0,0.22)';
    g.lineWidth = 3;
    g.strokeRect(0, 0, S, S);
  });
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(w / (P * every), d / (P * every));
  return new THREE.MeshPhysicalMaterial({ color, map, roughness: matte ? 0.75 : 0.45, clearcoat: matte ? 0.05 : 0.3, clearcoatRoughness: 0.35 });
}

/** A printed tile: text on a coloured background. */
export function label(text: string, bg: string, fg: string, w = 512, h = 128, font = 'bold 64px system-ui, sans-serif'): THREE.MeshPhysicalMaterial {
  const map = canvasTex(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = fg;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    let size = parseInt(font.match(/(\d+)px/)?.[1] ?? '64', 10);
    while (g.measureText(text).width > w * 0.9 && size > 10) {
      size -= 2;
      g.font = font.replace(/\d+px/, `${size}px`);
    }
    g.fillText(text, w / 2, h / 2 + 2);
  });
  map.colorSpace = THREE.SRGBColorSpace;
  return plastic('#ffffff', { map, roughness: 0.3 });
}

/** A face print for the brick figures (original LvTS design). */
export function faceMaterial(skin: string, mood: 'smile' | 'worried' = 'smile'): THREE.MeshPhysicalMaterial {
  const S = 128;
  const map = canvasTex(S, S, (g) => {
    g.fillStyle = skin;
    g.fillRect(0, 0, S, S);
    g.fillStyle = '#16181c';
    for (const x of [44, 84]) {
      g.beginPath();
      g.ellipse(x, 56, 7, 10, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = '#fff';
    for (const x of [46, 86]) g.fillRect(x - 1, 50, 3, 4);
    g.strokeStyle = '#16181c';
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    if (mood === 'smile') g.arc(64, 78, 18, 0.15 * Math.PI, 0.85 * Math.PI);
    else g.arc(64, 98, 14, 1.2 * Math.PI, 1.8 * Math.PI);
    g.stroke();
  });
  map.colorSpace = THREE.SRGBColorSpace;
  return plastic('#ffffff', { map });
}

// ── batching ───────────────────────────────────────────────
interface Inst { m: THREE.Matrix4; c: THREE.Color }

/**
 * Collects bricks and studs, then builds one InstancedMesh per brick size.
 * Each brick gets a tiny colour and position wobble so walls look hand-built.
 */
export class Batch {
  private boxes = new Map<string, { w: number; h: number; d: number; list: Inst[] }>();
  private studs: Inst[] = [];
  private rnd: () => number;

  constructor(seed = 7) {
    let s = seed >>> 0;
    this.rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  private tint(color: string): THREE.Color {
    const c = new THREE.Color(color);
    const j = (this.rnd() - 0.5) * 0.05;
    c.offsetHSL(0, 0, j);
    return c;
  }

  /**
   * Add a part. w and d are in studs, plates in plate units (3 = one brick).
   * (x, z) is the part's centre in metres, y its bottom.
   */
  part(w: number, d: number, plates: number, x: number, y: number, z: number, color: string, opts: { rotY?: number; studs?: boolean } = {}): void {
    const W = w * P, D = d * P, Hh = plates * PL;
    const key = `${w}|${d}|${plates}`;
    let b = this.boxes.get(key);
    if (!b) this.boxes.set(key, (b = { w: W, h: Hh, d: D, list: [] }));
    const rot = opts.rotY ?? 0;
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot);
    const wob = () => (this.rnd() - 0.5) * 0.004;
    const pos = new THREE.Vector3(x + wob(), y + Hh / 2, z + wob());
    const c = this.tint(color);
    b.list.push({ m: new THREE.Matrix4().compose(pos, q, new THREE.Vector3(1, 1, 1)), c });
    if (opts.studs === false) return;
    const cos = Math.cos(rot), sin = Math.sin(rot);
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        const lx = (i + 0.5) * P - W / 2, lz = (j + 0.5) * P - D / 2;
        const sx = x + lx * cos + lz * sin, sz = z - lx * sin + lz * cos;
        this.studs.push({ m: new THREE.Matrix4().makeTranslation(sx, y + Hh + STUD_H / 2, sz), c });
      }
    }
  }

  /** Build everything into a group. */
  build(segments = 2): THREE.Group {
    const g = new THREE.Group();
    const mat = plastic();
    for (const b of this.boxes.values()) {
      const r = Math.min(0.03, b.h / 3, b.w / 3, b.d / 3);
      const geo = new RoundedBoxGeometry(b.w - GAP, b.h - GAP, b.d - GAP, segments, r);
      g.add(this.inst(geo, mat, b.list));
    }
    if (this.studs.length) {
      const geo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 14);
      const m = this.inst(geo, mat, this.studs);
      m.castShadow = false;
      g.add(m);
    }
    return g;
  }

  private inst(geo: THREE.BufferGeometry, mat: THREE.Material, list: Inst[]): THREE.InstancedMesh {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach((it, i) => {
      im.setMatrixAt(i, it.m);
      im.setColorAt(i, it.c);
    });
    im.castShadow = true;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    return im;
  }
}

// ── builders ───────────────────────────────────────────────
export interface Gap { from: number; to: number; rowFrom: number; rowTo: number }

/**
 * A straight wall of staggered bricks along x (rotY 0) or z (rotY = PI/2).
 * Gaps (doors, windows) are in studs and rows; the top row gets studs.
 */
export function wall(b: Batch, x0: number, z0: number, lengthStuds: number, rows: number, y0: number, color: string | ((row: number) => string), alongZ = false, gaps: Gap[] = []): void {
  for (let r = 0; r < rows; r++) {
    const col = typeof color === 'string' ? color : color(r);
    // solid runs in this row
    const solid: boolean[] = Array.from({ length: lengthStuds }, (_, i) => !gaps.some((g) => r >= g.rowFrom && r <= g.rowTo && i >= g.from && i < g.to));
    let i = 0;
    while (i < lengthStuds) {
      if (!solid[i]) { i++; continue; }
      let len = i === 0 && r % 2 === 1 ? 2 : 4;
      let n = 0;
      while (n < len && i + n < lengthStuds && solid[i + n]) n++;
      len = n;
      const mid = (i + len / 2) * P;
      const x = alongZ ? x0 : x0 + mid;
      const z = alongZ ? z0 + mid : z0;
      b.part(len, 1, 3, x, y0 + r * BRICK, z, col, { rotY: alongZ ? Math.PI / 2 : 0, studs: r === rows - 1 || gaps.some((g) => r + 1 >= g.rowFrom && r + 1 <= g.rowTo && i < g.to && i + len > g.from) });
      i += len;
    }
  }
}

/** A flat slab (floor, roof, baseplate) as one mesh with a material. */
export function slab(w: number, h: number, d: number, mat: THREE.Material, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y + h / 2, z);
  m.receiveShadow = true;
  m.castShadow = h > 0.1;
  return m;
}

/** Simple rounded single mesh (for vehicles and figures). */
export function block(w: number, h: number, d: number, mat: THREE.Material, r = 0.03): THREE.Mesh {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Studs on top of a part of size w×d studs, added to a group at height y. */
export function studsOn(group: THREE.Object3D, w: number, d: number, cx: number, y: number, cz: number, mat: THREE.Material): void {
  const geo = new THREE.CylinderGeometry(STUD_R, STUD_R, STUD_H, 14);
  const im = new THREE.InstancedMesh(geo, mat, w * d);
  let k = 0;
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) {
    im.setMatrixAt(k++, new THREE.Matrix4().makeTranslation(cx + (i + 0.5) * P - (w * P) / 2, y + STUD_H / 2, cz + (j + 0.5) * P - (d * P) / 2));
  }
  im.castShadow = true;
  group.add(im);
}
