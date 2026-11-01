// Raiwai: the pieces the neighbourhood is built from, modelled on drone photos
// of the area: houses with corrugated-iron roofs (single and two storey, raised
// on concrete bases, with verandas, carports, water tanks and satellite
// dishes), blocks of flats, the big A-frame church, the public pool, the teal
// two-storey building, the sports ground with rugby posts, the commercial
// sheds, the green bus, cars, power poles and the big mango trees.
//
// Every builder returns a group with its origin on the ground at the middle of
// its footprint, facing -z (the front faces the street at -z). Colours are
// plain so the engine can fold them into its colour buckets.
import * as THREE from 'three';
import { paint as basePaint } from './models.ts';
import { canvasTexture } from './textures.ts';
import { rng, houseSpec, type HouseSpec } from './raiwaiPlan.ts';
export type { HouseSpec } from './raiwaiPlan.ts';

type G = THREE.Object3D;

const GLASS = '#2b3a44';
/** Physically based paint; window glass is glossy. */
const paint = (color: string) => basePaint(color, { finish: color === GLASS || color === '#1e2a30' ? 'gloss' : 'matte' });

function box(g: G, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.005, w), Math.max(0.005, h), Math.max(0.005, d)), paint(color));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

function cyl(g: G, rTop: number, rBot: number, h: number, color: string, x = 0, y = 0, z = 0, seg = 10) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg), paint(color));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

function sub(parent: G, x = 0, y = 0, z = 0, ry = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  parent.add(g);
  return g;
}

/** A triangle (a gable end) in the z-y plane, `t` thick along x: base from -half to +half at y = 0, apex at `rise`. */
function gable(g: G, half: number, rise: number, t: number, color: string, x: number, y: number, z = 0) {
  const s = new THREE.Shape();
  s.moveTo(-half, 0); s.lineTo(half, 0); s.lineTo(0, rise); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  geo.translate(0, 0, -t / 2);
  geo.rotateY(Math.PI / 2);                 // shape's x becomes z
  const m = new THREE.Mesh(geo, paint(color));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

/** A hipped roof: eaves rectangle `w` by `d` at y = 0, ridge along the longer side. */
function hipGeometry(w: number, d: number, rise: number): THREE.BufferGeometry {
  const a = w / 2, b = d / 2;
  const along = w >= d;
  const r = along ? Math.max(0, a - b) : Math.max(0, b - a);
  const P = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const e = [P(-a, 0, -b), P(a, 0, -b), P(a, 0, b), P(-a, 0, b)];
  const r0 = along ? P(-r, rise, 0) : P(0, rise, -r), r1 = along ? P(r, rise, 0) : P(0, rise, r);
  const tris: THREE.Vector3[] = [];
  const quad = (p: THREE.Vector3, q: THREE.Vector3, s: THREE.Vector3, t: THREE.Vector3) => tris.push(p, q, s, p, s, t);
  if (along) {
    quad(e[0], r0, r1, e[1]);           // front
    quad(e[2], r1, r0, e[3]);           // back
    tris.push(e[1], r1, e[2]);          // right end
    tris.push(e[3], r0, e[0]);          // left end
  } else {
    quad(e[1], r0, r1, e[2]);
    quad(e[3], r1, r0, e[0]);
    tris.push(e[0], r0, e[1]);
    tris.push(e[2], r1, e[3]);
  }
  const g = new THREE.BufferGeometry().setFromPoints(tris);
  g.computeVertexNormals();
  return g;
}

// ── colours from the photos ───────────────────────────────────────────────
export const RAIWAI = {
  trim: '#f6f5f0',
  glass: '#2b3a44',
  louvre: '#7f939d',
  concrete: '#9d998f',
  step: '#b1aca2',
  roadside: '#c9c4b6',
};

// ── a window: white frame, dark glass, louvre slats (facing -z at its origin) ─
function windowAt(g: G, x: number, y: number, z: number, ry: number, w = 1.0, h = 1.15, simple = false) {
  const o = sub(g, x, y, z, ry);
  if (simple) { box(o, w, h, 0.08, RAIWAI.glass, 0, 0, -0.04); return; }
  box(o, w + 0.12, h + 0.12, 0.06, RAIWAI.trim, 0, 0, -0.03);
  box(o, w, h, 0.07, RAIWAI.glass, 0, 0, -0.045);
  for (let i = 1; i <= 4; i++) box(o, w * 0.96, 0.02, 0.02, RAIWAI.louvre, 0, -h / 2 + (h * i) / 5, -0.085);
}

const STOREY = 2.7;

/** A Raiwai house. */
export function house(spec: HouseSpec): THREE.Group {
  const g = new THREE.Group();
  const r = rng(spec.seed ?? 1);
  const { w, d } = spec;
  const base = spec.base ?? 0.3;
  const H = spec.storeys * STOREY;
  const trim = spec.trim ?? RAIWAI.trim;
  if (base > 0) box(g, w + 0.1, base, d + 0.1, RAIWAI.concrete, 0, base / 2, 0);
  box(g, w, H, d, spec.wall, 0, base + H / 2, 0);
  if (spec.storeys === 2) box(g, w + 0.06, 0.14, d + 0.06, trim, 0, base + STOREY, 0);

  // windows all round; the front door in the middle of the ground floor
  const doorX = (r() - 0.5) * w * 0.3;
  for (let s = 0; s < spec.storeys; s++) {
    const y = base + s * STOREY + 1.45;
    const nf = Math.max(1, Math.floor(w / 2.3));
    for (let i = 0; i < nf; i++) {
      const x = -w / 2 + (w / nf) * (i + 0.5);
      if (s === 0 && Math.abs(x - doorX) < 0.9) continue;
      windowAt(g, x, y, -d / 2, 0, 1.0, 1.15, spec.simple);
      if (!spec.simple && r() > 0.25) windowAt(g, x, y, d / 2, Math.PI);
    }
    if (spec.simple) continue;
    const ns = Math.max(1, Math.floor(d / 2.6));
    for (let i = 0; i < ns; i++) {
      const z = -d / 2 + (d / ns) * (i + 0.5);
      windowAt(g, -w / 2, y, z, -Math.PI / 2, 0.9);
      windowAt(g, w / 2, y, z, Math.PI / 2, 0.9);
    }
  }
  box(g, 0.95, 2.1, 0.08, r() > 0.5 ? '#7a4a2a' : '#f1efe8', doorX, base + 1.05, -d / 2 - 0.04);
  if (base > 0.15) box(g, 1.4, base, 0.9, RAIWAI.step, doorX, base / 2, -d / 2 - 0.45);

  // roof: corrugated iron with an overhang
  const top = base + H;
  const o = 0.45;
  if (spec.roofStyle === 'gable') {
    const p = 0.27, half = d / 2 + o, rise = (d / 2) * Math.tan(p);
    const len = half / Math.cos(p);
    for (const s of [-1, 1]) {
      const plane = box(g, w + o * 2, 0.07, len, spec.roof, 0, top + (half / 2) * Math.tan(p) - o * Math.tan(p) * 0.5, s * half / 2);
      plane.rotation.x = s * p;
    }
    for (const s of [-1, 1]) gable(g, d / 2, rise, 0.1, spec.wall, s * (w / 2 - 0.05), top);
    box(g, w + o * 2 + 0.05, 0.08, 0.16, spec.roof, 0, top + rise + 0.05, 0);    // ridge cap
  } else if (spec.roofStyle === 'hip') {
    const m = new THREE.Mesh(hipGeometry(w + o * 2, d + o * 2, Math.min(w, d) * 0.22), paint(spec.roof));
    m.position.y = top;
    g.add(m);
  } else if (spec.roofStyle === 'skillion') {
    const p = 0.1;
    const plane = box(g, w + o * 2, 0.07, (d + o * 2) / Math.cos(p), spec.roof, 0, top + ((d + o * 2) / 2) * Math.tan(p) * 0.5, 0);
    plane.rotation.x = p;           // high at the front, falling to the back
  } else {
    box(g, w - 0.2, 0.06, d - 0.2, spec.roof, 0, top + 0.05, 0);
    for (const [pw, pd, px, pz] of [[w, 0.15, 0, -d / 2], [w, 0.15, 0, d / 2], [0.15, d, -w / 2, 0], [0.15, d, w / 2, 0]] as const) box(g, pw, 0.4, pd, spec.wall, px, top + 0.2, pz);
  }

  if (spec.veranda) {
    const vw = Math.min(w * 0.7, 6), vd = 2.0;
    box(g, vw, 0.12, vd, RAIWAI.step, doorX, base, -d / 2 - vd / 2);
    for (const sx of [-1, 1]) cyl(g, 0.07, 0.07, 2.4, trim, doorX + sx * (vw / 2 - 0.15), base + 1.2, -d / 2 - vd + 0.15, 8);
    const vr = box(g, vw + 0.3, 0.06, vd + 0.3, spec.roof, doorX, base + 2.45, -d / 2 - vd / 2);
    vr.rotation.x = -0.08;
    box(g, vw, 0.9, 0.05, trim, doorX, base + 0.55, -d / 2 - vd + 0.05);      // rail
  }
  if (spec.carport) {
    const cw = 3.2, cx = w / 2 + cw / 2;
    for (const [px, pz] of [[cx + cw / 2 - 0.15, -d / 2 + 0.3], [cx + cw / 2 - 0.15, d / 2 - 0.3]] as const) cyl(g, 0.06, 0.06, 2.5, trim, px, 1.25, pz, 8);
    const cr = box(g, cw + 0.3, 0.06, d, spec.roof, cx, 2.55, 0);
    cr.rotation.z = -0.05;
    box(g, cw, 0.04, d - 0.2, '#8f8b82', cx, 0.02, 0);
  }
  if (spec.tank) cyl(g, 0.65, 0.65, 1.7, r() > 0.5 ? '#1d1f22' : '#2f6b4a', w / 2 - 0.7, 0.85, d / 2 + 0.8, 14);
  if (spec.dish) {
    const dish = cyl(g, 0.32, 0.05, 0.12, '#f1f1ee', -w / 2 + 0.6, top + 0.5, -d / 2 + 0.6, 12);
    dish.rotation.x = 0.9;
  }
  return g;
}

/** A random Raiwai house from a seed (size, storeys, colours, roof, extras). */
export function randomHouse(seed: number, simple = false): THREE.Group {
  return house(houseSpec(seed, simple));
}

/** A block of flats (three or four floors), balconies along the front and a stair tower at one end. */
export function flats(opts: { floors?: number; w?: number; d?: number; wall?: string; trim?: string; roof?: string; seed?: number } = {}): THREE.Group {
  const g = new THREE.Group();
  const floors = opts.floors ?? 3, w = opts.w ?? 18, d = opts.d ?? 9;
  const wall = opts.wall ?? '#efe6cf', trim = opts.trim ?? '#3f6fb3', roof = opts.roof ?? '#b4babd';
  const H = floors * 2.9;
  box(g, w, H, d, wall, 0, H / 2, 0);
  const bays = Math.floor(w / 3.6);
  for (let f = 0; f < floors; f++) {
    const y = f * 2.9;
    box(g, w + 0.1, 0.18, d + 0.1, trim, 0, y + 0.09, 0);
    for (let i = 0; i < bays; i++) {
      const x = -w / 2 + (w / bays) * (i + 0.5);
      windowAt(g, x - 0.7, y + 1.5, -d / 2, 0, 0.9, 1.1);
      box(g, 0.85, 2.0, 0.06, '#6b4a36', x + 0.75, y + 1.0, -d / 2 - 0.03);
      windowAt(g, x, y + 1.5, d / 2, Math.PI, 1.2, 1.0);
      if (f > 0) {
        box(g, w / bays - 0.3, 0.12, 1.1, '#d8d3c4', x, y + 0.06, -d / 2 - 0.55);
        box(g, w / bays - 0.3, 0.95, 0.05, trim, x, y + 0.55, -d / 2 - 1.08);
      }
    }
  }
  box(g, w + 0.1, 0.25, d + 0.1, trim, 0, H + 0.12, 0);
  const m = new THREE.Mesh(hipGeometry(w + 0.6, d + 0.6, 1.2), paint(roof));
  m.position.y = H + 0.24;
  g.add(m);
  box(g, 3, H + 0.9, 3.2, wall, w / 2 + 1.5, (H + 0.9) / 2, 0);      // stair tower
  for (let f = 0; f < floors; f++) box(g, 0.05, 1.6, 2.2, RAIWAI.glass, w / 2 + 3.03, f * 2.9 + 1.6, 0);
  return g;
}

/** The big church with the steep A-frame roof, and its smaller A-frame entrance. */
export function aFrameChurch(): THREE.Group {
  const g = new THREE.Group();
  const W = 18, L = 26, ridge = 13.5, eave = 1.3;
  const roof = '#a9aca8', white = '#f4f3ef', glass = RAIWAI.glass;
  // the long roof comes almost to the ground on both sides
  const run = W / 2, rise = ridge - eave, len = Math.hypot(run, rise), a = Math.atan2(rise, run);
  for (const s of [-1, 1]) {
    const plane = box(g, 0.14, len + 0.6, L + 1.2, roof, s * run / 2, eave + rise / 2, 0);
    plane.rotation.z = s * (Math.PI / 2 - a);
  }
  box(g, W - 1.2, eave, L, white, 0, eave / 2, 0);          // low walls under the eaves
  for (const z of [-L / 2, L / 2]) {
    gable(g, run - 0.2, rise, 0.25, white, 0, eave, z).rotation.y = Math.PI / 2;   // across the front, not along the side
    // tall triangular windows in the gable
    const s = new THREE.Shape();
    s.moveTo(-2.4, 0); s.lineTo(2.4, 0); s.lineTo(0, 7.5); s.closePath();
    const win = new THREE.Mesh(new THREE.ShapeGeometry(s), paint(glass));
    win.position.set(0, eave + 1.2, z + (z < 0 ? -0.14 : 0.14));
    if (z < 0) win.rotation.y = Math.PI;     // face outwards (front faces -z)
    g.add(win);
  }
  // the entrance: a smaller A-frame with a white front and a door
  const e = sub(g, 0, 0, -L / 2 - 3.2);
  const ew = 7, el = 6.4, er = 6.8;
  const erun = ew / 2, erise = er - 0.6, elen = Math.hypot(erun, erise), ea = Math.atan2(erise, erun);
  for (const s of [-1, 1]) {
    const plane = box(e, 0.12, elen + 0.4, el, roof, s * erun / 2, 0.6 + erise / 2, 0);
    plane.rotation.z = s * (Math.PI / 2 - ea);
  }
  gable(e, erun - 0.1, erise, 0.2, white, 0, 0.6, -el / 2).rotation.y = Math.PI / 2;
  box(e, ew - 0.6, 0.6, el, white, 0, 0.3, 0);
  box(e, 1.8, 2.6, 0.1, '#6b3d24', 0, 1.3, -el / 2 - 0.12);
  for (const sx of [-1.5, 1.5]) windowAt(e, sx, 3.4, -el / 2 - 0.1, 0, 0.7, 1.4);
  return g;
}

/** The public pool: the pool in its concrete deck, a covered stand along the back, a white fence along the front. */
export function publicPool(): THREE.Group {
  const g = new THREE.Group();
  const W = 34, D = 22;
  box(g, W, 0.12, D, '#d9d5cb', 0, 0.06, 0);
  box(g, 25.4, 0.05, 12.6, '#f4f2ec', 0, 0.12, -1);          // coping
  box(g, 25, 0.06, 12.2, '#7fcfe3', 0, 0.13, -1);            // water
  for (let i = 1; i < 6; i++) box(g, 0.08, 0.065, 12.0, '#e9f6fa', -12.5 + i * (25 / 6), 0.135, -1);   // lane lines
  for (let i = 0; i < 6; i++) box(g, 0.6, 0.5, 0.6, '#f4f2ec', -12.5 + (i + 0.5) * (25 / 6), 0.37, -7.6);
  // covered stand: three tiers under a long roof
  const sd = 5.5, sz = D / 2 - sd / 2 - 0.3;
  for (let t = 0; t < 3; t++) box(g, 26, 0.45, 1.4, '#a9a59c', 0, 0.35 + t * 0.45, sz - 1.6 + t * 1.4);
  for (let i = 0; i <= 6; i++) cyl(g, 0.1, 0.1, 3.6, '#f4f2ec', -13 + i * (26 / 6), 1.8, sz + sd / 2 - 0.2, 8);
  const roof = box(g, 27, 0.08, sd + 1, '#7d3a2c', 0, 3.75, sz);
  roof.rotation.x = 0.12;
  // the white fence along the front
  for (let i = 0; i <= 16; i++) box(g, 0.14, 1.6, 0.14, '#f4f2ec', -W / 2 + i * (W / 16), 0.8, -D / 2);
  box(g, W, 0.08, 0.06, '#f4f2ec', 0, 1.5, -D / 2);
  return g;
}

/** The teal two-storey building with the orange door and a deck upstairs. */
export function tealBuilding(): THREE.Group {
  const g = house({ w: 9, d: 7, storeys: 2, wall: '#2fbf9f', roof: '#b4babd', roofStyle: 'gable', base: 0.3, seed: 77 });
  box(g, 1.6, 2.3, 0.1, '#e8873a', 2.2, 1.45, -3.55);        // orange panel and door
  // a deck upstairs on the right, with a rail and its own roof
  box(g, 2.6, 0.14, 6.6, '#9a6b45', 5.8, 3.0, 0);
  for (const z of [-3.1, 0, 3.1]) cyl(g, 0.07, 0.07, 3.0, '#f6f5f0', 7.0, 1.5, z, 8);
  box(g, 0.05, 0.9, 6.4, '#f6f5f0', 7.05, 3.55, 0);
  const r = box(g, 2.9, 0.06, 7.2, '#b4babd', 5.8, 5.75, 0);
  r.rotation.z = -0.12;
  return g;
}

/** The sports ground: dry grass with greener patches, and rugby posts at each end (along x). */
export function sportsField(w = 72, d = 50): THREE.Group {
  const g = new THREE.Group();
  box(g, w, 0.04, d, '#a29c6c', 0, 0.02, 0);
  const r = rng(5);
  for (let i = 0; i < 14; i++) box(g, 6 + r() * 12, 0.045, 5 + r() * 10, r() > 0.5 ? '#8f9a5c' : '#b3a77a', (r() - 0.5) * (w - 14), 0.025, (r() - 0.5) * (d - 12));
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 4);
    for (const z of [-2.8, 2.8]) cyl(g, 0.09, 0.09, 10, '#f6f5f0', x, 5, z, 8);
    const bar = box(g, 0.14, 0.14, 5.6, '#f6f5f0', x, 3, 0);
    bar.castShadow = true;
  }
  return g;
}

/** A low commercial shed with a blue (or grey) roof and roller doors along the front. */
export function shed(w = 30, d = 16, roof = '#3d6fc4'): THREE.Group {
  const g = new THREE.Group();
  box(g, w, 5, d, '#ebe9e3', 0, 2.5, 0);
  const half = d / 2 + 0.5, p = 0.08;
  for (const s of [-1, 1]) {
    const plane = box(g, w + 1, 0.08, half / Math.cos(p), roof, 0, 5 + (half / 2) * Math.tan(p), s * half / 2);
    plane.rotation.x = s * p;
  }
  for (const s of [-1, 1]) gable(g, d / 2, (d / 2) * Math.tan(p), 0.1, '#ebe9e3', s * (w / 2 - 0.05), 5);
  const n = Math.floor(w / 6);
  for (let i = 0; i < n; i++) box(g, 3.6, 3.4, 0.08, '#b9bec2', -w / 2 + (w / n) * (i + 0.5), 1.7, -d / 2 - 0.04);
  box(g, w, 0.9, 0.1, '#1f3b73', 0, 4.3, -d / 2 - 0.06);       // fascia sign band
  return g;
}

let busSides: THREE.Texture | null = null;
let busFront: THREE.Texture | null = null;
/** Lettering for the bus: the company's name along the sides, where it's going above the windscreen. */
function busTextures() {
  busSides ??= canvasTexture(512, 64, (g, w, h) => {
    g.fillStyle = '#36b45f'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = '800 40px "Space Grotesk", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('NASESE BUS', w / 2, h / 2 + 2);
  });
  busFront ??= canvasTexture(256, 48, (g, w, h) => {
    g.fillStyle = '#111417'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fbbf24'; g.font = '700 30px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('RAIWAI', w / 2, h / 2 + 1);
  });
  return { sides: busSides, front: busFront };
}

/** The green Nasese bus: white roof, open windows, its name along the sides. Built along +x (front at +x). */
export function greenBus(): THREE.Group {
  const g = new THREE.Group();
  const L = 10.5, W = 2.5;
  box(g, L, 1.3, W, '#36b45f', 0, 1.15, 0);
  box(g, L, 0.95, W - 0.04, '#1e2a30', 0, 2.25, 0);           // the window band
  for (let i = 0; i < 9; i++) for (const s of [-1, 1]) box(g, 0.1, 0.95, 0.04, '#36b45f', -L / 2 + 0.6 + i * 1.15, 2.25, s * (W / 2 - 0.01));
  box(g, L, 0.25, W, '#f1f1ee', 0, 2.85, 0);
  box(g, 0.06, 0.95, W - 0.3, '#2b3a44', L / 2 + 0.01, 2.2, 0);   // windscreen
  const tex = busTextures();
  for (const s of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.65), new THREE.MeshStandardMaterial({ map: tex.sides, roughness: 0.5 }));
    side.position.set(-0.6, 1.15, s * (W / 2 + 0.006));
    if (s < 0) side.rotation.y = Math.PI;
    g.add(side);
  }
  const dest = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.3), new THREE.MeshBasicMaterial({ map: tex.front }));
  dest.position.set(L / 2 + 0.03, 2.82, 0);
  dest.rotation.y = Math.PI / 2;
  g.add(dest);
  box(g, 0.08, 0.25, W, '#e8e6df', L / 2, 0.55, 0);              // bumper
  for (const x of [-3.4, 3.2]) for (const s of [-1, 1]) {
    const wh = cyl(g, 0.5, 0.5, 0.3, '#151618', x, 0.5, s * (W / 2 - 0.1), 14);
    wh.rotation.x = Math.PI / 2;
  }
  return g;
}

/** A parked car: an SUV or a double-cab ute. Built along +x (front at +x). */
export function car(kind: 'suv' | 'ute' = 'suv', color = '#f2f2f0'): THREE.Group {
  const g = new THREE.Group();
  const W = 1.85;
  if (kind === 'suv') {
    box(g, 4.6, 0.85, W, color, 0, 0.75, 0);
    box(g, 3.0, 0.7, W - 0.12, color, -0.3, 1.5, 0);
    box(g, 2.9, 0.5, W - 0.08, RAIWAI.glass, -0.3, 1.5, 0);
  } else {
    box(g, 5.2, 0.85, W, color, 0, 0.78, 0);
    box(g, 2.6, 0.7, W - 0.1, color, 0.7, 1.55, 0);
    box(g, 2.5, 0.5, W - 0.06, RAIWAI.glass, 0.7, 1.55, 0);
    box(g, 1.9, 0.5, W - 0.1, '#2a2c2f', -1.5, 1.42, 0);           // the tray
  }
  for (const x of [-1.4, 1.45]) for (const s of [-1, 1]) {
    const wh = cyl(g, 0.36, 0.36, 0.26, '#151618', x, 0.36, s * (W / 2 - 0.08), 12);
    wh.rotation.x = Math.PI / 2;
  }
  return g;
}

/** A wooden power pole: a crossarm across z for the wires, and a street light reaching out to -z. `tops` are where the wires attach. */
export function powerPole(): { group: THREE.Group; tops: THREE.Vector3[] } {
  const g = new THREE.Group();
  cyl(g, 0.11, 0.15, 9, '#6b5a45', 0, 4.5, 0, 8);
  box(g, 0.12, 0.12, 2.2, '#6b5a45', 0, 8.6, 0);
  const tops = [-0.95, 0, 0.95].map((z) => new THREE.Vector3(0, 8.75, z));
  for (const t of tops) cyl(g, 0.04, 0.04, 0.16, '#d9d6cf', t.x, t.y, t.z, 6);
  // the street light reaches out toward -z (turn the pole so that's over the road)
  const arm = box(g, 0.07, 0.07, 1.8, '#9ba3a9', 0, 7.4, -0.9);
  arm.rotation.x = -0.08;
  box(g, 0.28, 0.12, 0.5, '#e8e6df', 0, 7.3, -1.75);
  return { group: g, tops };
}

/** The big round, dark mango trees that shade the yards. */
export function mangoTree(size = 1, seed = 3): THREE.Group {
  const g = new THREE.Group();
  const r = rng(seed);
  cyl(g, 0.22 * size, 0.38 * size, 2.6 * size, '#5a4635', 0, 1.3 * size, 0, 8);
  const greens = ['#2c5a27', '#356b2e', '#2f622a', '#3d7333'];
  for (let i = 0; i < 6; i++) {
    const rad = (1.7 + r() * 1.3) * size;
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 1), paint(greens[i % greens.length]));
    const a = (i / 6) * Math.PI * 2;
    m.position.set(Math.cos(a) * 1.6 * size, (3.8 + r() * 1.6) * size, Math.sin(a) * 1.6 * size);
    g.add(m);
  }
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4 * size, 1), paint('#336628'));
  crown.position.y = 5.6 * size;
  g.add(crown);
  return g;
}

/** A bougainvillea bush in flower. */
export function bougainvillea(size = 1, seed = 4): THREE.Group {
  const g = new THREE.Group();
  const r = rng(seed);
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry((0.5 + r() * 0.5) * size, 0), paint(i % 3 === 0 ? '#4d8a3c' : r() > 0.5 ? '#e0408f' : '#f06aa8'));
    m.position.set((r() - 0.5) * 1.6 * size, (0.6 + r() * 1.2) * size, (r() - 0.5) * 1.2 * size);
    g.add(m);
  }
  return g;
}

/** Sagging wires between poles (cheap lines). */
export function wires(points: THREE.Vector3[][], color = '#2a2c2f'): THREE.LineSegments {
  const pos: number[] = [];
  for (const run of points) {
    for (let i = 0; i < run.length - 1; i++) {
      const a = run[i], b = run[i + 1];
      const n = 8;
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const sag = (t: number) => -Math.sin(Math.PI * t) * 0.45;
        pos.push(a.x + (b.x - a.x) * t0, a.y + (b.y - a.y) * t0 + sag(t0), a.z + (b.z - a.z) * t0);
        pos.push(a.x + (b.x - a.x) * t1, a.y + (b.y - a.y) * t1 + sag(t1), a.z + (b.z - a.z) * t1);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color }));
}

/** A big covered arena with a teal curved roof (seen across the sheds by the sea). */
export function arena(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 34, 34, 10, '#e9e7e1', 0, 5, 0, 32);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(36, 32, 10, 0, Math.PI * 2, 0, Math.PI * 0.28), paint('#2fb3a6'));
  dome.scale.set(1, 0.55, 1);
  dome.position.y = 10 - 36 * 0.55 * Math.cos(Math.PI * 0.28);
  g.add(dome);
  return g;
}

/** A stadium floodlight tower. */
export function floodlight(): THREE.Group {
  const g = new THREE.Group();
  cyl(g, 0.5, 0.9, 38, '#9ba3a9', 0, 19, 0, 8);
  box(g, 7, 3.5, 0.6, '#5a6066', 0, 38.5, 0);
  box(g, 6.4, 2.9, 0.1, '#fdf8e1', 0, 38.5, -0.35);
  return g;
}

/** A tall apartment block: white, brown balcony bands. */
export function tower(floors = 6): THREE.Group {
  return flats({ floors, w: 16, d: 12, wall: '#f4f3ef', trim: '#5b3a2a', roof: '#c9cdd0' });
}
