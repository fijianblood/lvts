// People (and the cat) as brick figures, with joints so they can walk, sit,
// crawl or lie down: square heads with a printed face, block hair, a block
// body, round arms with ball hands, block legs and shoes. They follow each
// person's look (colours, hair, build), but they are made up from that
// description, not likenesses.
// A figure faces -z with its origin on the floor under its hips.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { coatOn } from './bricks.ts';
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

// ── the brick figure ───────────────────────────────────────────────────────
/** A rounded block, centred on its own middle. */
function blockGeo(w: number, h: number, d: number, r = 0.02) {
  return new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3));
}

/** A round limb from its joint (y = 0) down to y = -len. */
function rod(r: number, len: number) {
  const g = new THREE.CylinderGeometry(r, r, len, 14);
  g.translate(0, -len / 2, 0);
  return g;
}

const faces = new Map<string, THREE.Texture>();
/** The printed face: eyes with a shine, brows and a smile, on a clear background. */
function faceTexture(kind: Look['kind'], brow: string) {
  const key = `${kind}|${brow}`;
  let t = faces.get(key);
  if (t) return t;
  const big = kind !== 'adult';
  t = canvasTexture(256, 256, (g, w) => {
    g.clearRect(0, 0, w, w);
    const ey = w * 0.47, ex = w * (big ? 0.16 : 0.14), rx = w * (big ? 0.055 : 0.045), ry = w * (big ? 0.075 : 0.062);
    for (const s of [-1, 1]) {
      g.fillStyle = '#17191d';
      g.beginPath(); g.ellipse(w / 2 + s * ex, ey, rx, ry, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath(); g.arc(w / 2 + s * ex + rx * 0.3, ey - ry * 0.35, rx * 0.32, 0, Math.PI * 2); g.fill();
      if (kind !== 'baby') {
        g.strokeStyle = brow;
        g.lineWidth = w * 0.03;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(w / 2 + s * (ex - rx * 1.1), ey - ry * 1.75); g.lineTo(w / 2 + s * (ex + rx * 1.1), ey - ry * 1.95); g.stroke();
      }
    }
    g.strokeStyle = '#17191d';
    g.lineWidth = w * 0.035;
    g.lineCap = 'round';
    g.beginPath(); g.arc(w / 2, w * 0.62, w * (big ? 0.11 : 0.12), 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();
  });
  faces.set(key, t);
  return t;
}

/** Hair as blocks on the head (`W` × `H` × `D`, bottom at y = 0, face toward -z). */
function brickHair(head: THREE.Group, look: Look, W: number, H: number, D: number) {
  const hair = look.hair, cap = H * 0.22;
  const capOn = (w = W + 0.014, d = D + 0.014, h = cap) => add(head, blockGeo(w, h, d, 0.02), hair, 'hair', 0, H + h / 2 - 0.012, 0);
  const fringe = () => add(head, blockGeo(W + 0.014, H * 0.12, D * 0.18, 0.012), hair, 'hair', 0, H - H * 0.06, -D / 2 + D * 0.07);
  switch (look.hairStyle) {
    case 'afro':
      add(head, blockGeo(W * 1.32, H * 0.55, D * 1.28, 0.06), hair, 'hair', 0, H * 0.86, D * 0.05);
      break;
    case 'bun':
      capOn(); fringe();
      add(head, new THREE.SphereGeometry(H * 0.17, 14, 10), hair, 'hair', 0, H + cap + H * 0.08, D * 0.18);
      break;
    case 'ponytail':
      capOn(); fringe();
      add(head, blockGeo(W * 0.32, H * 0.62, D * 0.2, 0.03), hair, 'hair', 0, H * 0.62, D / 2 + D * 0.08);
      break;
    case 'long':
      capOn(); fringe();
      add(head, blockGeo(W + 0.03, H * 1.05, D * 0.16, 0.02), hair, 'hair', 0, H * 0.55, D / 2 + D * 0.04);
      for (const s of [-1, 1]) add(head, blockGeo(W * 0.1, H * 0.85, D * 0.75, 0.015), hair, 'hair', s * (W / 2 + W * 0.04), H * 0.62, D * 0.1);
      break;
    case 'baby':
      add(head, blockGeo(W * 0.4, H * 0.08, D * 0.35, 0.015), hair, 'hair', 0, H + H * 0.03, -D * 0.05);
      break;
    default:   // short and grey
      capOn(); fringe();
      if (look.streak) add(head, blockGeo(W * 0.16, cap + 0.004, D + 0.02, 0.01), look.streak, 'hair', W * 0.18, H + cap / 2 - 0.01, 0);
  }
  if (look.beard) {
    add(head, blockGeo(W + 0.01, H * 0.34, D * 0.14, 0.015), hair, 'hair', 0, H * 0.17, -D / 2 + D * 0.05);
    for (const s of [-1, 1]) add(head, blockGeo(W * 0.1, H * 0.6, D * 0.6, 0.012), hair, 'hair', s * (W / 2 + 0.004), H * 0.4, -D * 0.12);
  }
  if (look.earrings) for (const s of [-1, 1]) add(head, new THREE.SphereGeometry(W * 0.06, 10, 8), look.earrings, 'gloss', s * (W / 2 + W * 0.03), H * 0.32, 0);
}

/**
 * A brick figure (LvTS's own design, not a LEGO minifigure): a square head with
 * a printed face, a block body, round arms with ball hands, block legs and shoes.
 * Same joints as before (hips, shoulders, elbows, knees), so every pose and the
 * walk still work.
 */
export function buildFigure(look: Look, pose: FigurePose = 'stand', seat = 0.45): Rig {
  const H = look.height;
  const kid = look.kind === 'kid', baby = look.kind === 'baby';
  const shin = (baby ? 0.12 : kid ? 0.18 : 0.21) * H;
  const thigh = (baby ? 0.12 : kid ? 0.17 : 0.2) * H;
  const torsoL = (baby ? 0.3 : kid ? 0.27 : 0.29) * H;
  const neck = (baby ? 0.01 : kid ? 0.02 : 0.025) * H;
  const headH = (baby ? 0.3 : kid ? 0.26 : 0.2) * H;
  const headW = (baby ? 0.3 : kid ? 0.26 : 0.21) * H;
  const headD = (baby ? 0.28 : kid ? 0.25 : 0.2) * H;
  const torsoW = (baby ? 0.32 : kid ? 0.27 : 0.26) * H * Math.sqrt(look.build);
  const torsoD = (baby ? 0.2 : 0.14) * H * Math.sqrt(look.build);
  const legW = torsoW * 0.47;
  const armR = (baby ? 0.055 : 0.042) * H;
  const upper = (baby ? 0.13 : 0.17) * H, fore = (baby ? 0.11 : 0.15) * H, handR = (baby ? 0.06 : 0.05) * H;
  const arm = upper + fore + handR * 1.6;
  const hip = thigh + shin;
  const cloth: Finish = 'cloth';

  const root = new THREE.Group();
  const body = group(root, 0, hip, 0);
  const torso = group(body);

  // hips in the trouser colour, then the shirt, a little narrower at the shoulders
  add(torso, blockGeo(torsoW, H * 0.07, torsoD * 0.96, 0.02), look.pants, cloth, 0, H * 0.025, 0);
  const shirt = blockGeo(torsoW, torsoL - H * 0.06, torsoD, 0.03);
  const sp = shirt.getAttribute('position') as THREE.BufferAttribute;
  for (let i = 0; i < sp.count; i++) if (sp.getY(i) > 0) sp.setX(i, sp.getX(i) * (1 - 0.14 * (sp.getY(i) / ((torsoL - H * 0.06) / 2))));
  add(torso, shirt, look.shirt, cloth, 0, H * 0.06 + (torsoL - H * 0.06) / 2, 0);
  if (look.print) {
    const print = new THREE.Mesh(new THREE.PlaneGeometry(torsoW * 0.32, torsoL * 0.22), paint(look.print, { finish: cloth }));
    print.position.set(0, torsoL * 0.62, -torsoD / 2 - 0.003);
    print.rotation.y = Math.PI;
    torso.add(print);
  }
  add(torso, new THREE.CylinderGeometry(headW * 0.22, headW * 0.24, neck + 0.04, 12), look.skin, 'skin', 0, torsoL + neck / 2 - 0.01, 0);

  // the head: a block with the face printed on the front
  const head = group(torso, 0, torsoL + neck, 0);
  add(head, blockGeo(headW, headH, headD, 0.035), look.skin, 'skin', 0, headH / 2, 0);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(headW * 0.92, headH * 0.92), new THREE.MeshStandardMaterial({ map: faceTexture(look.kind, shade(look.hair, 0.15)), alphaTest: 0.5, roughness: 0.4 }));
  face.position.set(0, headH * 0.5, -headD / 2 - 0.004);
  face.rotation.y = Math.PI;
  head.add(face);
  brickHair(head, look, headW, headH, headD);

  // arms: round sleeves all the way down, then a ball hand
  const armY = torsoL - armR * 1.3;
  const makeArm = (side: number) => {
    const g = group(torso, side * (torsoW / 2 + armR * 0.8), armY, 0);
    add(g, new THREE.SphereGeometry(armR * 1.08, 12, 10), look.shirt, cloth);
    add(g, rod(armR, upper + armR * 0.3), look.shirt, cloth);
    const elbow = group(g, 0, -upper, 0);
    add(elbow, new THREE.SphereGeometry(armR, 12, 10), look.shirt, cloth);
    add(elbow, rod(armR * 0.95, fore), look.shirt, cloth);
    add(elbow, new THREE.SphereGeometry(handR, 14, 10), look.skin, 'skin', 0, -fore - handR * 0.6, 0);
    return { g, elbow };
  };
  const aR = makeArm(1), aL = makeArm(-1);

  // legs: block thighs, knees, shins (bare below shorts) and a shoe that sticks out in front
  const footH = (baby ? 0.03 : 0.055) * H, footL = legW * 1.35;
  const makeLeg = (side: number) => {
    const g = group(body, side * (torsoW / 2 - legW / 2 - 0.003), 0, 0);
    add(g, blockGeo(legW, thigh + 0.02, torsoD * 0.9, 0.025), look.pants, cloth, 0, -thigh / 2 + 0.01, 0);
    const knee = group(g, 0, -thigh, 0);
    const longLeg = look.longPants || baby;
    const shinH = shin - footH;
    add(knee, blockGeo(legW * 0.94, shinH + 0.02, torsoD * 0.82, 0.025), longLeg ? look.pants : look.skin, longLeg ? cloth : 'skin', 0, -shinH / 2 + 0.01, 0);
    const shoe = look.shoes ?? (baby ? look.pants : look.skin);
    add(knee, blockGeo(legW * 0.98, footH, footL, 0.02), shoe, look.shoes ? 'satin' : 'skin', 0, -shin + footH / 2, -(footL - torsoD * 0.82) / 2);
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
  // shiny plastic like the rest of Noqublox (the clear coat is skipped on phones)
  const m = coatOn()
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 1, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.2, side: THREE.DoubleSide })
    : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, side: THREE.DoubleSide });
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
