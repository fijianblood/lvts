// People (and the cat), built from smooth shapes with joints so they can walk,
// sit, crawl or lie down: rounded heads with eyes, brows, nose, lips and ears,
// shaped hair, tapered limbs with elbows and knees, hands with fingers, and
// shoes. They follow each person's look (colours, hair, build), but they are
// made up from that description, not likenesses.
// A figure faces -z with its origin on the floor under its hips.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paint, type Finish } from './models.ts';
import { canvasTexture } from './textures.ts';
import type { Look } from './characters.ts';

export type FigurePose = 'stand' | 'sit' | 'lie' | 'crawl' | 'ipad' | 'floor';

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
  elbowL: THREE.Group;
  elbowR: THREE.Group;
  legL: THREE.Group;
  legR: THREE.Group;
  kneeL: THREE.Group;
  kneeR: THREE.Group;
  hip: number;
  thigh: number;
  arm: number;
  legW: number;
  pose: FigurePose;
}

// ── shapes ──────────────────────────────────────────────────────────────────
function add(parent: THREE.Object3D, geo: THREE.BufferGeometry, color: string, finish: Finish, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, paint(color, { finish }));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

function ellipsoid(rx: number, ry: number, rz: number, w = 16, h = 12) {
  const g = new THREE.SphereGeometry(1, w, h);
  g.scale(rx, ry, rz);
  return g;
}

/** A limb from its joint (y = 0) down to y = -len, round at both ends, narrowing from rTop to rBot. */
function limb(rTop: number, rBot: number, len: number, seg = 10) {
  const pts: THREE.Vector2[] = [];
  const n = 4;
  for (let i = 0; i <= n; i++) {                          // bottom cap
    const a = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(rBot * Math.sin(a), -len + rBot - rBot * Math.cos(a)));
  }
  for (let i = 0; i <= n; i++) {                          // top cap
    const a = Math.PI / 2 + (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0, rTop * Math.sin(a)), -rTop - rTop * Math.cos(a)));
  }
  return new THREE.LatheGeometry(pts, seg);
}

/** A body of revolution from (radius, height) pairs, squashed front to back by `depth`. */
function lathe(profile: [number, number][], depth: number, seg = 18) {
  const g = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  g.scale(1, 1, depth);
  return g;
}

const mix = (a: string, b: string, t: number) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const shade = (c: string, t: number) => mix(c, '#000000', t);

const group = (parent: THREE.Object3D, x = 0, y = 0, z = 0) => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
};

let ipadTex: THREE.Texture | null = null;
function ipadScreen() {
  // a tiny picture of the game itself, as in the photo
  ipadTex ??= canvasTexture(96, 72, (g, w, h) => {
    g.fillStyle = '#f3efe6'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9844a';
    g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.35, h * 0.5); g.lineTo(w * 0.65, h * 0.5); g.lineTo(w, h); g.fill();
    g.fillStyle = '#1d1f22'; g.fillRect(w * 0.08, h * 0.3, w * 0.18, h * 0.14); g.fillRect(w * 0.6, h * 0.32, w * 0.12, h * 0.1);
    g.fillStyle = '#2563eb'; g.fillRect(w * 0.78, h * 0.06, w * 0.16, h * 0.16);
  });
  return ipadTex;
}

// ── the head ────────────────────────────────────────────────────────────────
/** The head's surface: an egg shape whose lower half narrows to the jaw and chin. */
function jaw(x: number, y: number, z: number): [number, number, number] {
  if (y >= 0) return [x, y, z];
  const t = Math.pow(-y, 1.4);
  return [x * (1 - 0.2 * t), y, z * (1 - 0.08 * t)];
}

function headShape(rx: number, ry: number, rz: number) {
  const g = new THREE.SphereGeometry(1, 24, 16);
  const p = g.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < p.count; i++) {
    const [x, y, z] = jaw(p.getX(i), p.getY(i), p.getZ(i));
    p.setXYZ(i, x * rx, y * ry, z * rz);
  }
  g.computeVertexNormals();
  return g;
}

/** Where the face's surface is (z, negative = front) at a point across (u, -1..1) and up (v, -1..1) the head. */
function faceZ(u: number, v: number, rz: number) {
  const s = Math.max(0, 1 - u * u - v * v);
  const t = v < 0 ? Math.pow(-v, 1.4) : 0;
  return -Math.sqrt(s) * (1 - 0.08 * t) * rz;
}

/**
 * Part of a sphere around the head (hair or a beard): `cap` is how far down
 * from the crown it reaches (radians), `tilt` leans it back so it sits higher
 * at the forehead than at the nape. `cut` removes triangles (the mouth).
 */
function shell(rx: number, ry: number, rz: number, opts: { cap?: number; from?: number; tilt?: number; arc?: [number, number]; jawFit?: boolean; cut?: (x: number, y: number, z: number) => boolean; seg?: [number, number] }) {
  const from = opts.from ?? 0, cap = opts.cap ?? Math.PI / 2;
  const [phiStart, phiLength] = opts.arc ?? [0, Math.PI * 2];
  const [sw, sh] = opts.seg ?? [22, 12];
  let g: THREE.BufferGeometry = new THREE.SphereGeometry(1, sw, sh, phiStart, phiLength, from, cap - from);
  if (opts.jawFit) {
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) { const [x, y, z] = jaw(p.getX(i), p.getY(i), p.getZ(i)); p.setXYZ(i, x, y, z); }
  }
  g.rotateX(opts.tilt ?? 0);
  g.scale(rx, ry, rz);
  if (opts.cut) {
    g = g.toNonIndexed();
    const p = g.attributes.position as THREE.BufferAttribute;
    const keep: number[] = [];
    for (let i = 0; i < p.count; i += 3) {
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3;
      const cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3;
      if (!opts.cut(cx, cy, cz)) for (let k = 0; k < 3; k++) keep.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
    }
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(keep, 3));
  }
  g.computeVertexNormals();
  return g;
}

function buildHead(head: THREE.Group, look: Look, W: number, H: number, D: number) {
  const baby = look.kind === 'baby', kid = look.kind === 'kid';
  const rx = W / 2, ry = H / 2, rz = D / 2, cy = H / 2;
  const skin = look.skin;
  add(head, headShape(rx, ry, rz), skin, 'skin', 0, cy, 0);

  // ears
  for (const s of [-1, 1]) add(head, ellipsoid(W * 0.07, H * 0.13, D * 0.1, 8, 6), shade(skin, 0.04), 'skin', s * rx * 0.97, H * 0.47, D * 0.06);

  // eyes: white, iris, pupil, set into the face, with brows above
  const eyeU = baby ? 0.36 : 0.4, eyeV = baby ? -0.02 : 0.12;
  const eR = W * (baby ? 0.085 : kid ? 0.08 : 0.072);
  for (const s of [-1, 1]) {
    const x = s * eyeU * rx, y = cy + eyeV * ry;
    const z = faceZ(eyeU, eyeV, rz) + eR * 0.8;
    add(head, ellipsoid(eR, eR, eR, 10, 8), '#f3eee6', 'gloss', x, y, z);
    // iris and pupil: small caps on the front of the eyeball
    add(head, shell(eR * 1.012, eR * 1.012, eR * 1.012, { cap: 0.64, tilt: -Math.PI / 2, seg: [12, 3] }), '#3a2416', 'gloss', x, y, z);
    add(head, shell(eR * 1.02, eR * 1.02, eR * 1.02, { cap: 0.3, tilt: -Math.PI / 2, seg: [10, 2] }), '#0b0807', 'gloss', x, y, z);
    // upper lid: a crescent of skin over the top of the eye
    add(head, shell(eR * 1.07, eR * 1.0, eR * 1.07, { cap: 0.78, tilt: -0.55, seg: [12, 4] }), skin, 'skin', x, y, z);
    if (!baby) {
      const brow = new THREE.CapsuleGeometry(H * 0.013, W * 0.15, 3, 6);
      brow.rotateZ(Math.PI / 2 + s * 0.12);
      const bv = eyeV + 0.24;
      add(head, brow, look.hairStyle === 'grey' ? '#8a8580' : shade(look.hair, 0.15), 'hair', s * eyeU * rx * 1.02, cy + bv * ry, faceZ(eyeU, bv, rz) - H * 0.006);
    }
  }

  // nose
  const nv = baby ? -0.2 : -0.14;
  const nose = ellipsoid(W * (baby ? 0.07 : 0.075), H * (baby ? 0.06 : 0.1), D * 0.085, 10, 8);
  add(head, nose, skin, 'skin', 0, cy + nv * ry, faceZ(0, nv, rz) + D * 0.025);
  if (!baby) for (const s of [-1, 1]) add(head, ellipsoid(W * 0.035, H * 0.03, D * 0.04, 8, 6), shade(skin, 0.06), 'skin', s * W * 0.05, cy + (nv - 0.12) * ry, faceZ(0.1, nv - 0.12, rz) + D * 0.005);

  // lips
  const lip = mix(skin, '#7d3434', 0.32);
  const mv = baby ? -0.42 : -0.44;
  add(head, ellipsoid(W * (baby ? 0.09 : 0.13), H * 0.026, D * 0.045, 10, 6), lip, 'skin', 0, cy + mv * ry, faceZ(0, mv, rz) + D * 0.012);
  add(head, ellipsoid(W * (baby ? 0.08 : 0.12), H * 0.03, D * 0.045, 10, 6), shade(lip, 0.05), 'skin', 0, cy + (mv - 0.11) * ry, faceZ(0, mv - 0.11, rz) + D * 0.016);

  buildHair(head, look, rx, ry, rz, cy);

  if (look.earrings) for (const s of [-1, 1]) add(head, new THREE.TorusGeometry(W * 0.045, W * 0.012, 6, 14), look.earrings, 'metal', s * rx * 1.0, H * 0.33, D * 0.06).rotation.y = Math.PI / 2;
}

function buildHair(head: THREE.Group, look: Look, rx: number, ry: number, rz: number, cy: number) {
  const hair = look.hair;
  const style = look.hairStyle;
  const g = (geo: THREE.BufferGeometry, color = hair, x = 0, y = cy, z = 0) => add(head, geo, color, 'hair', x, y, z);

  if (style === 'afro') {
    const geo = shell(rx * 1.42, ry * 1.34, rz * 1.38, { cap: Math.PI * 0.62, tilt: 0.55 });
    const p = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {                    // a soft, uneven surface
      const k = 1 + 0.035 * Math.sin(p.getX(i) * 90) * Math.sin(p.getY(i) * 80 + p.getZ(i) * 70);
      p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    geo.computeVertexNormals();
    g(geo, hair, 0, cy + ry * 0.24, rz * 0.12);
  } else if (style === 'baby') {
    g(shell(rx * 1.02, ry * 1.02, rz * 1.02, { cap: Math.PI * 0.4, tilt: 0.45 }));
  } else {
    const grey = style === 'grey';
    const k = grey ? 1.035 : 1.06;
    g(shell(rx * k * 1.02, ry * k, rz * k * 1.02, { cap: Math.PI * (style === 'long' ? 0.5 : 0.45), tilt: 0.5 }), hair, 0, cy + ry * 0.02, rz * 0.02);
    if (style === 'bun') g(ellipsoid(rx * 0.5, rx * 0.46, rx * 0.46, 14, 10), hair, 0, cy + ry * 0.78, rz * 0.82);
    if (style === 'ponytail') {
      g(new THREE.TorusGeometry(rx * 0.16, rx * 0.05, 6, 12), shade(hair, 0.2), 0, cy + ry * 0.48, rz * 1.04).rotation.x = 0.4;
      const tail = limb(rx * 0.2, rx * 0.1, ry * 1.25);
      g(tail, hair, 0, cy + ry * 0.5, rz * 1.12).rotation.x = 0.25;
    }
    if (style === 'long') {
      // worn down over the back to the shoulders, framing the face
      const back = new THREE.CylinderGeometry(rx * 1.08, rx * 1.18, ry * 1.9, 20, 1, true, -1.95, 3.9);
      back.scale(1, 1, rz / rx);
      g(back, hair, 0, cy - ry * 0.45, rz * 0.12);
      for (const s of [-1, 1]) g(limb(rx * 0.16, rx * 0.12, ry * 1.5), hair, s * rx * 0.94, cy + ry * 0.55, -rz * 0.1);
    }
    if (look.streak) for (const x of [-0.24, 0.2]) {
      const st = new THREE.CapsuleGeometry(rx * 0.05, rz * 1.2, 3, 6);
      st.rotateX(Math.PI / 2 - 0.25);
      g(st, look.streak, rx * x, cy + ry * 0.98, rz * 0.12);
    }
  }

  if (look.beard) {
    // around the jaw and chin, leaving the lips clear; a moustache above them
    const geo = shell(rx * 1.07, ry * 1.04, rz * 1.09, {
      from: Math.PI * 0.52, cap: Math.PI * 0.97, arc: [Math.PI * 0.75, Math.PI * 1.5], jawFit: true,
      cut: (x, y, z) => z < 0 && Math.abs(x) < rx * 0.26 && y > -ry * 0.62 && y < -ry * 0.3,
    });
    g(geo);
    const mo = new THREE.CapsuleGeometry(ry * 0.035, rx * 0.34, 3, 6);
    mo.rotateZ(Math.PI / 2);
    g(mo, hair, 0, cy - ry * 0.32, faceZ(0, -0.32, rz) - rz * 0.02);
  }
}

// ── the body ────────────────────────────────────────────────────────────────
/** Build a person. Proportions follow the look's kind: adult, kid or baby. */
export function buildFigure(look: Look, pose: FigurePose = 'stand', seat = 0.45): Rig {
  const H = look.height;
  const kid = look.kind === 'kid', baby = look.kind === 'baby';
  const shin = baby ? 0.1 : (kid ? 0.23 : 0.245) * H;
  const thigh = baby ? 0.1 : (kid ? 0.22 : 0.235) * H;
  const torsoL = baby ? 0.2 : (kid ? 0.27 : 0.3) * H;
  const neck = baby ? 0.012 : 0.03 * H;
  const headH = baby ? 0.16 : (kid ? 0.16 : 0.13) * H;
  const headW = baby ? 0.14 : (kid ? 0.125 : 0.1) * H;
  const headD = baby ? 0.15 : (kid ? 0.145 : 0.12) * H;
  const arm = baby ? 0.16 : (kid ? 0.37 : 0.38) * H;
  const armW = baby ? 0.045 : 0.06 * H;
  const torsoW = baby ? 0.15 : 0.23 * H * look.build;
  const torsoD = baby ? 0.11 : 0.125 * H * Math.sqrt(look.build);
  const legW = baby ? 0.06 : 0.08 * H * Math.min(1.15, look.build);
  const hip = thigh + shin;
  const cloth: Finish = 'cloth';

  const root = new THREE.Group();
  const body = group(root, 0, hip, 0);
  const torso = group(body);

  // hips in the trouser colour, then the shirt: waist, chest, shoulders
  const waist = baby ? 0.05 : 0.09 * H;
  const r = torsoW / 2, depth = torsoD / torsoW;
  const belly = Math.max(0, look.build - 1) * 0.9;
  add(torso, lathe([[0, -0.03 * H], [r * 0.78, -0.028 * H], [r * 0.95, 0.01 * H], [r * 0.97, waist * 0.6], [r * 0.95, waist + 0.01]], depth), look.pants, cloth);
  const shirt: [number, number][] = [
    [r * 0.97, waist - 0.012], [r * (0.94 + belly), torsoL * 0.38], [r * (0.98 + belly * 0.4), torsoL * 0.6],
    [r * 1.0, torsoL * 0.78], [r * 0.98, torsoL * 0.87], [r * 0.84, torsoL * 0.94], [r * 0.55, torsoL * 0.985], [r * 0.28, torsoL * 1.0], [0, torsoL * 1.0],
  ];
  add(torso, lathe(shirt, depth, 20), look.shirt, cloth);
  if (!baby) add(torso, new THREE.TorusGeometry(headW * 0.24, headW * 0.045, 6, 16), shade(look.shirt, 0.08), cloth, 0, torsoL * 0.985, 0).rotation.x = Math.PI / 2;
  if (look.print) {
    const print = new THREE.Mesh(new THREE.PlaneGeometry(torsoW * 0.26, torsoL * 0.18), paint(look.print, { finish: cloth }));
    print.position.set(0, torsoL * 0.64, -r * 0.985 * depth - 0.004);
    print.rotation.y = Math.PI;
    torso.add(print);
  }
  // neck
  add(torso, new THREE.CylinderGeometry(headW * 0.21, headW * 0.24, neck + 0.05, 12), look.skin, 'skin', 0, torsoL + neck / 2 - 0.01, headD * 0.04);

  const head = group(torso, 0, torsoL + neck, 0);
  buildHead(head, look, headW, headH, headD);

  // arms: shoulder, short sleeve, upper arm, elbow, forearm, hand
  const armY = torsoL - (baby ? 0.03 : 0.048 * H);
  const upper = arm * 0.44, fore = arm * 0.37, hand = arm - upper - fore;
  const rU = armW * 0.5, rF = armW * 0.42, rW = armW * 0.34;
  const makeArm = (side: number) => {
    const g = group(torso, side * (r * 0.96 + rU * 0.45), armY, 0);
    // the sleeve's rounded top blends into the shoulder line
    add(g, limb(rU * 1.1, rU * 1.07, upper * (baby ? 0.9 : 0.5)), look.shirt, cloth);
    add(g, limb(rU, rF, upper + rF * 0.6), look.skin, 'skin');
    const elbow = group(g, 0, -upper, 0);
    add(elbow, limb(rF, rW, fore + rW), look.skin, 'skin');
    const wrist = group(elbow, 0, -fore, 0);
    buildHand(wrist, look.skin, hand, armW, side);
    return { g, elbow };
  };
  const aR = makeArm(1), aL = makeArm(-1);

  // legs: thigh, knee, shin (bare below shorts), shoe or bare foot
  const footH = baby ? 0.03 : 0.045 * H, footL = baby ? 0.07 : (kid ? 0.16 : 0.15) * H;
  const rT = legW * 0.6, rK = legW * 0.44, rA = legW * 0.3;
  const makeLeg = (side: number) => {
    const g = group(body, side * (r - rT * 0.95), 0, 0);
    add(g, limb(rT, rK * 1.05, thigh + rK), look.pants, cloth);
    const knee = group(g, 0, -thigh, 0);
    const longLeg = look.longPants || baby;
    if (longLeg) add(knee, limb(rK * 1.06, rA * 1.25, shin - footH * 0.4), look.pants, cloth);
    else {
      add(knee, new THREE.CylinderGeometry(rK * 1.18, rK * 1.12, thigh * 0.12, 12, 1, true), look.pants, cloth, 0, thigh * 0.02, 0);
      add(knee, limb(rK, rA, shin - footH * 0.4), look.skin, 'skin');
    }
    const shoe = look.shoes ?? (baby ? look.pants : look.skin);
    const bare = !look.shoes && !baby;
    const foot = ellipsoid(legW * (bare ? 0.36 : 0.42), footH * 0.62, footL / 2, 14, 8);
    add(knee, foot, shoe, bare ? 'skin' : 'matte', 0, -shin + footH * 0.55, -footL * 0.26);
    if (!bare && !baby) add(knee, ellipsoid(legW * 0.44, footH * 0.2, footL * 0.52, 14, 6), shade(shoe, 0.35), 'matte', 0, -shin + footH * 0.12, -footL * 0.26);
    return { g, knee };
  };
  const lR = makeLeg(1), lL = makeLeg(-1);

  const rig: Rig = { root, body, torso, head, armL: aL.g, armR: aR.g, elbowL: aL.elbow, elbowR: aR.elbow, legL: lL.g, legR: lR.g, kneeL: lL.knee, kneeR: lR.knee, hip, thigh, arm, legW, pose };

  if (pose === 'ipad') {
    // held in both hands in front of the chest
    const tablet = new THREE.Group();
    tablet.position.set(0, armY - upper * 0.94 + 0.01, -(upper * 0.34 + fore));
    tablet.rotation.x = -0.75;
    const w = 0.24 * (H / 1.3), h = 0.17 * (H / 1.3);
    tablet.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), paint('#1d1f22', { finish: 'gloss' })));
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, h * 0.84), new THREE.MeshBasicMaterial({ map: ipadScreen() }));
    screen.rotation.y = Math.PI;      // faces the holder
    screen.position.z = 0.0075;
    tablet.add(screen);
    torso.add(tablet);
  }
  applyPose(rig, pose, seat);
  return rig;
}

/** A hand hanging from the wrist: palm, four fingers and a thumb toward the front. */
function buildHand(wrist: THREE.Group, skin: string, len: number, armW: number, side: number) {
  const palmL = len * 0.52, fingL = len * 0.5;
  const w = armW * 0.78, t = armW * 0.3;
  add(wrist, ellipsoid(t / 2, palmL / 2, w / 2, 10, 8), skin, 'skin', 0, -palmL / 2, 0);
  const fr = w * 0.11;
  for (let i = 0; i < 4; i++) {
    const z = (-0.36 + i * 0.24) * w;
    const f = limb(fr, fr * 0.85, fingL * (i === 0 || i === 3 ? 0.84 : 1), 6);
    const m = add(wrist, f, skin, 'skin', 0, -palmL * 0.9, z);
    m.rotation.x = 0.06 * (i - 1.5);
    m.rotation.z = -side * 0.12;                          // fingers curl in toward the leg a little
  }
  const thumb = limb(fr * 1.15, fr, fingL * 0.75, 6);
  const th = add(wrist, thumb, skin, 'skin', side * -t * 0.1, -palmL * 0.35, -w * 0.42);
  th.rotation.x = 0.55;
}

export function applyPose(rig: Rig, pose: FigurePose, seat = 0.45) {
  rig.pose = pose;
  const { body, torso, head, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR } = rig;
  for (const o of [body, torso, head, armL, armR, elbowL, elbowR, legL, legR, kneeL, kneeR]) o.rotation.set(0, 0, 0);
  body.position.set(0, rig.hip, 0);
  // arms rest slightly bent and away from the body
  armL.rotation.z = -0.06; armR.rotation.z = 0.06;
  elbowL.rotation.x = elbowR.rotation.x = 0.12;
  if (pose === 'sit') {
    body.position.y = seat;
    legL.rotation.x = legR.rotation.x = Math.PI / 2;
    kneeL.rotation.x = kneeR.rotation.x = -Math.PI / 2;
    armL.rotation.x = armR.rotation.x = 0.28;
    elbowL.rotation.x = elbowR.rotation.x = 0.95;        // hands resting on the lap
    armL.rotation.z = -0.12; armR.rotation.z = 0.12;
    torso.rotation.x = -0.06;
  } else if (pose === 'ipad') {
    armL.rotation.x = armR.rotation.x = 0.35;
    elbowL.rotation.x = elbowR.rotation.x = 1.25;
    armL.rotation.z = 0.15; armR.rotation.z = -0.15;    // hands come together on the tablet
    head.rotation.x = -0.35;
  } else if (pose === 'lie') {
    // on her back: legs toward -z, head toward +z, face up
    body.rotation.x = Math.PI / 2;
    body.position.set(0, 0.06, -0.06);
    legL.rotation.x = legR.rotation.x = 0.35;
    kneeL.rotation.x = kneeR.rotation.x = -0.5;
    armL.rotation.z = -0.5; armR.rotation.z = 0.5;
    elbowL.rotation.x = elbowR.rotation.x = 0.8;
  } else if (pose === 'floor') {
    // sitting on the ground, legs straight out in front
    body.position.y = rig.legW / 2 + 0.01;
    legL.rotation.x = legR.rotation.x = Math.PI / 2;
    armL.rotation.x = armR.rotation.x = 0.3;
    elbowL.rotation.x = elbowR.rotation.x = 0.5;
    torso.rotation.x = 0.08;
  } else if (pose === 'crawl') {
    body.position.y = Math.max(rig.thigh + rig.legW / 2, rig.arm - 0.01);
    torso.rotation.x = -Math.PI / 2;
    head.rotation.x = Math.PI / 2 * 0.85;
    armL.rotation.x = armR.rotation.x = Math.PI / 2;
    armL.rotation.z = armR.rotation.z = 0;
    elbowL.rotation.x = elbowR.rotation.x = 0;
    kneeL.rotation.x = kneeR.rotation.x = -Math.PI / 2;
  }
}

/** Walk or crawl cycle. `phase` advances with distance walked; `amount` 0..1 fades it in and out. */
export function animate(rig: Rig, phase: number, amount: number) {
  const s = Math.sin(phase) * amount;
  if (rig.pose === 'crawl') {
    rig.armL.rotation.x = Math.PI / 2 + 0.4 * s;
    rig.armR.rotation.x = Math.PI / 2 - 0.4 * s;
    rig.legL.rotation.x = -0.35 * s;
    rig.legR.rotation.x = 0.35 * s;
    return;
  }
  if (rig.pose !== 'stand') return;
  rig.legL.rotation.x = 0.5 * s;
  rig.legR.rotation.x = -0.5 * s;
  rig.kneeL.rotation.x = -0.7 * Math.max(0, -Math.sin(phase)) * amount;
  rig.kneeR.rotation.x = -0.7 * Math.max(0, Math.sin(phase)) * amount;
  rig.armL.rotation.x = -0.4 * s;
  rig.armR.rotation.x = 0.4 * s;
  rig.elbowL.rotation.x = 0.12 + 0.3 * Math.max(0, -s);   // the forward arm bends more
  rig.elbowR.rotation.x = 0.12 + 0.3 * Math.max(0, s);
  rig.torso.rotation.y = 0.05 * s;
  rig.body.position.y = rig.hip + Math.abs(Math.cos(phase)) * 0.022 * amount;
}

// ── baking: one draw call per person (and one for the head) ───────────────
let baked: THREE.MeshStandardMaterial | null = null;
/** Colour and roughness come from each vertex, so skin, cloth, hair and eyes share one material. */
function bakedMaterial() {
  if (baked) return baked;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float rough;\nvarying float vRough;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRough = rough;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vRough;')
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = vRough;');
  };
  m.customProgramCacheKey = () => 'baked-figure';
  baked = m;
  return m;
}

const paintable = (m: THREE.Mesh) => m.isMesh && m.material instanceof THREE.MeshStandardMaterial && !m.material.map && !m.material.transparent;

/** Merge the painted parts under `from` into one mesh, in `space`'s coordinates. */
function mergePainted(from: THREE.Object3D, space: THREE.Object3D): THREE.Mesh | null {
  const meshes: THREE.Mesh[] = [];
  from.traverse((o) => { if (paintable(o as THREE.Mesh)) meshes.push(o as THREE.Mesh); });
  return mergeMeshes(meshes, space);
}

/** These painted meshes as one mesh in `space` (colour and roughness on the vertices). */
function mergeMeshes(meshes: THREE.Mesh[], space: THREE.Object3D): THREE.Mesh | null {
  space.updateMatrixWorld(true);
  const toSpace = space.matrixWorld.clone().invert();
  const parts: THREE.BufferGeometry[] = [];
  meshes.forEach((m) => {
    const mat = m.material as THREE.MeshStandardMaterial;
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(toSpace.clone().multiply(m.matrixWorld));
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const c = mat.color;
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 3), rough = new Float32Array(n);
    for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; rough[i] = mat.roughness; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('rough', new THREE.BufferAttribute(rough, 1));
    for (const key of Object.keys(g.attributes)) if (!['position', 'normal', 'color', 'rough'].includes(key)) g.deleteAttribute(key);
    parts.push(g);
  });
  if (!parts.length) return null;
  return new THREE.Mesh(mergeGeometries(parts), bakedMaterial());
}

/**
 * Bake a figure that only ever turns its head (the family members you are not
 * playing) into a few meshes: the body, and the head on its own pivot. Anything
 * else (the iPad screen) is kept as it is.
 */
/**
 * Bake a figure that walks (the other players in the shared world): one mesh per
 * moving part (hips, chest, head, upper and lower arms and legs), so it still
 * swings its arms and legs but is about 11 draw calls instead of about 50.
 */
export function bakeMoving(rig: Rig) {
  const parts: THREE.Object3D[] = [rig.body, rig.torso, rig.head, rig.armL, rig.elbowL, rig.armR, rig.elbowR, rig.legL, rig.kneeL, rig.legR, rig.kneeR];
  const set = new Set(parts);
  rig.root.updateMatrixWorld(true);
  const owner = (o: THREE.Object3D) => { for (let q = o.parent; q; q = q.parent) if (set.has(q)) return q; return null; };
  const groups = new Map<THREE.Object3D, THREE.Mesh[]>();
  rig.root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!paintable(m)) return;
    const g = owner(m);
    if (!g) return;
    const list = groups.get(g);
    if (list) list.push(m); else groups.set(g, [m]);
  });
  for (const [g, meshes] of groups) {
    const merged = mergeMeshes(meshes, g);
    if (!merged) continue;
    for (const m of meshes) { m.removeFromParent(); m.geometry.dispose(); }
    g.add(merged);
  }
}

export function bakeStatic(rig: Rig) {
  rig.root.updateMatrixWorld(true);
  rig.root.attach(rig.head);
  const other: THREE.Object3D[] = [];
  rig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !paintable(m)) other.push(m); });
  for (const u of other) if (!isInside(u, rig.head)) rig.root.attach(u);
  const body = mergePainted(rig.body, rig.root);
  const head = mergePainted(rig.head, rig.head);
  rig.root.remove(rig.body);
  for (const c of [...rig.head.children]) if (!other.includes(c)) rig.head.remove(c);
  if (body) rig.root.add(body);
  if (head) rig.head.add(head);
}

function isInside(o: THREE.Object3D, parent: THREE.Object3D): boolean {
  for (let p = o.parent; p; p = p.parent) if (p === parent) return true;
  return false;
}

/** The orange cat from the back walkway, sitting. */
export function cat(): THREE.Group {
  const g = new THREE.Group();
  const fur = '#d9822b', light = '#f0b46a';
  const f: Finish = 'hair';
  add(g, ellipsoid(0.075, 0.1, 0.13, 16, 12), fur, f, 0, 0.11, 0.03);          // body, sitting up
  add(g, ellipsoid(0.06, 0.07, 0.05, 12, 10), light, f, 0, 0.12, -0.08);       // chest
  add(g, ellipsoid(0.065, 0.058, 0.06, 16, 12), fur, f, 0, 0.27, -0.1);        // head
  add(g, ellipsoid(0.03, 0.022, 0.028, 10, 8), light, f, 0, 0.255, -0.152);    // muzzle
  add(g, ellipsoid(0.008, 0.006, 0.006, 6, 4), '#7a3b3b', 'skin', 0, 0.266, -0.178);
  for (const s of [-1, 1]) {
    const ear = add(g, new THREE.ConeGeometry(0.022, 0.05, 8), fur, f, s * 0.035, 0.33, -0.1);
    ear.rotation.z = -s * 0.25;
    add(g, ellipsoid(0.011, 0.012, 0.006, 10, 8), '#9bbf3a', 'gloss', s * 0.024, 0.282, -0.153);
    add(g, ellipsoid(0.004, 0.009, 0.003, 6, 6), '#0b0807', 'gloss', s * 0.024, 0.282, -0.158);
    add(g, ellipsoid(0.022, 0.03, 0.035, 10, 8), light, f, s * 0.04, 0.025, -0.1);   // front paws
    add(g, ellipsoid(0.03, 0.05, 0.06, 10, 8), fur, f, s * 0.055, 0.05, 0.08);       // haunches
  }
  const tail = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.03, 0.15), new THREE.Vector3(0.08, 0.02, 0.2), new THREE.Vector3(0.14, 0.03, 0.12), new THREE.Vector3(0.15, 0.06, 0.02),
  ]), 16, 0.016, 8);
  add(g, tail, fur, f);
  return g;
}
