// Low-poly people (and the cat), built from boxes with joints so they can
// walk, sit, crawl or lie down. A figure faces -z with its origin on the floor
// under its hips.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lambert } from './models.ts';
import { canvasTexture } from './textures.ts';
import type { Look } from './characters.ts';

export type FigurePose = 'stand' | 'sit' | 'lie' | 'crawl' | 'ipad';

export interface Rig {
  root: THREE.Group;
  body: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  armL: THREE.Group;
  armR: THREE.Group;
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

function part(parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(color));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

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

/** Build a person. Proportions follow the look's kind: adult, kid or baby. */
export function buildFigure(look: Look, pose: FigurePose = 'stand', seat = 0.45): Rig {
  const H = look.height;
  const kid = look.kind === 'kid', baby = look.kind === 'baby';
  // lengths
  const shin = baby ? 0.1 : (kid ? 0.23 : 0.245) * H;
  const thigh = baby ? 0.1 : (kid ? 0.22 : 0.235) * H;
  const torsoL = baby ? 0.2 : (kid ? 0.27 : 0.3) * H;
  const neck = baby ? 0.012 : 0.03 * H;
  const headH = baby ? 0.16 : (kid ? 0.16 : 0.13) * H;
  const headW = baby ? 0.14 : (kid ? 0.13 : 0.105) * H;
  const headD = baby ? 0.15 : (kid ? 0.145 : 0.12) * H;
  const arm = baby ? 0.15 : (kid ? 0.32 : 0.33) * H;
  const armW = baby ? 0.045 : 0.062 * H;
  const torsoW = baby ? 0.15 : 0.23 * H * look.build;
  const torsoD = baby ? 0.11 : 0.12 * H * Math.sqrt(look.build);
  const legW = baby ? 0.06 : 0.078 * H * Math.min(1.15, look.build);
  const hip = thigh + shin;

  const root = new THREE.Group();
  const body = group(root, 0, hip, 0);
  const torso = group(body);

  // torso: waistband in the trouser colour, shirt above, a print on the chest
  const waist = baby ? 0.04 : 0.07 * H;
  part(torso, torsoW * 0.96, waist, torsoD * 0.96, look.pants, 0, waist / 2, 0);
  part(torso, torsoW, torsoL - waist + 0.01, torsoD, look.shirt, 0, waist + (torsoL - waist) / 2, 0);
  if (look.print) part(torso, torsoW * 0.36, torsoL * 0.22, 0.006, look.print, 0, torsoL * 0.66, -torsoD / 2 - 0.003);
  part(torso, headW * 0.42, neck + 0.02, headD * 0.4, look.skin, 0, torsoL + neck / 2, 0);

  // head, face, hair
  const head = group(torso, 0, torsoL + neck, 0);
  part(head, headW, headH, headD, look.skin, 0, headH / 2, 0);
  const eyeW = headW * 0.14, eyeH = headH * 0.09, eyeY = headH * (baby ? 0.5 : 0.56);
  for (const s of [-1, 1]) part(head, eyeW, eyeH, 0.006, '#1a1412', s * headW * 0.22, eyeY, -headD / 2 - 0.002);
  if (!baby) part(head, headW * 0.32, headH * 0.04, 0.006, '#5a2f22', 0, headH * 0.24, -headD / 2 - 0.002);
  const hairT = 0.03 * H;
  if (look.hairStyle === 'afro') {
    part(head, headW * 1.28, 0.075 * H, headD * 1.22, look.hair, 0, headH + 0.02 * H, 0.012 * H);
    part(head, headW * 1.18, headH * 0.6, headD * 0.72, look.hair, 0, headH * 0.68, headD * 0.24);
  } else if (look.hairStyle === 'baby') {
    part(head, headW * 1.04, 0.02, headD * 1.04, look.hair, 0, headH + 0.005, 0.004);
    part(head, headW * 1.04, headH * 0.5, headD * 0.5, look.hair, 0, headH * 0.72, headD * 0.27);
  } else {
    const t = look.hairStyle === 'grey' ? hairT * 0.6 : hairT;
    part(head, headW * 1.08, t, headD * 1.08, look.hair, 0, headH + t / 2 - 0.005, 0.004);
    part(head, headW * 1.08, headH * 0.55, headD * 0.52, look.hair, 0, headH * 0.7, headD * 0.27);
    if (look.hairStyle === 'bun') {
      const bun = new THREE.Mesh(new THREE.IcosahedronGeometry(headW * 0.26, 0), lambert(look.hair));
      bun.position.set(0, headH * 0.92, headD * 0.56);
      head.add(bun);
    }
  }
  if (look.beard) {
    const front = -headD / 2 - 0.012, back = headD * 0.12;
    part(head, headW * 1.1, headH * 0.46, back - front, look.hair, 0, headH * 0.2, (front + back) / 2);
  }

  // arms: a short sleeve in the shirt colour, then bare arm and hand
  const armY = torsoL - 0.025 * H;
  const makeArm = (side: number) => {
    const g = group(torso, side * (torsoW / 2 + armW / 2 + 0.004), armY, 0);
    const sleeve = arm * (baby ? 0.5 : 0.36);
    part(g, armW * 1.12, sleeve, armW * 1.12, look.shirt, 0, -sleeve / 2, 0);
    part(g, armW, arm - sleeve, armW, look.skin, 0, -sleeve - (arm - sleeve) / 2, 0);
    return g;
  };
  const armR = makeArm(1), armL = makeArm(-1);

  // legs: thigh in the trouser colour; shin bare for shorts; shoes or bare feet
  const makeLeg = (side: number) => {
    const g = group(body, side * (torsoW / 2 - legW / 2 - 0.006), 0, 0);
    part(g, legW, thigh + 0.01, legW, look.pants, 0, -thigh / 2, 0);
    const knee = group(g, 0, -thigh, 0);
    part(knee, legW * 0.92, shin, legW * 0.92, look.longPants || baby ? look.pants : look.skin, 0, -shin / 2, 0);
    const foot = baby ? 0.035 : 0.035 * H;
    part(knee, legW * 1.02, foot, legW * 1.6, look.shoes ?? (baby ? look.pants : look.skin), 0, -shin + foot / 2, -legW * 0.3);
    return { g, knee };
  };
  const r = makeLeg(1), l = makeLeg(-1);

  const rig: Rig = { root, body, torso, head, armL, armR, legL: l.g, legR: r.g, kneeL: l.knee, kneeR: r.knee, hip, thigh, arm, legW, pose };

  if (pose === 'ipad') {
    const tablet = new THREE.Group();
    const a = 1.15;
    tablet.position.set(0, armY - arm * Math.cos(a) + 0.02, -arm * Math.sin(a) - 0.02);
    tablet.rotation.x = -0.85;
    const w = 0.24 * (H / 1.3), h = 0.17 * (H / 1.3);
    tablet.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), lambert('#1d1f22')));
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
  const { body, torso, head, armL, armR, legL, legR, kneeL, kneeR } = rig;
  for (const o of [body, torso, head, armL, armR, legL, legR, kneeL, kneeR]) o.rotation.set(0, 0, 0);
  body.position.set(0, rig.hip, 0);
  if (pose === 'sit') {
    body.position.y = seat;
    legL.rotation.x = legR.rotation.x = Math.PI / 2;
    kneeL.rotation.x = kneeR.rotation.x = -Math.PI / 2;
    armL.rotation.x = armR.rotation.x = 0.5;
    torso.rotation.x = -0.06;
  } else if (pose === 'ipad') {
    armL.rotation.x = armR.rotation.x = 1.15;
    armL.rotation.z = -0.18; armR.rotation.z = 0.18;
    head.rotation.x = -0.35;
  } else if (pose === 'lie') {
    // on her back: legs toward -z, head toward +z, face up
    body.rotation.x = Math.PI / 2;
    const torsoD = 0.11;
    body.position.set(0, torsoD / 2, -0.06);
    legL.rotation.x = legR.rotation.x = 0.35;
    kneeL.rotation.x = kneeR.rotation.x = -0.5;
    armL.rotation.z = -0.5; armR.rotation.z = 0.5;
  } else if (pose === 'crawl') {
    body.position.y = Math.max(rig.thigh + rig.legW / 2, rig.arm - 0.01);
    torso.rotation.x = -Math.PI / 2;
    head.rotation.x = Math.PI / 2 * 0.85;
    armL.rotation.x = armR.rotation.x = Math.PI / 2;
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
  rig.legL.rotation.x = 0.55 * s;
  rig.legR.rotation.x = -0.55 * s;
  rig.kneeL.rotation.x = -0.6 * Math.max(0, -Math.sin(phase)) * amount;
  rig.kneeR.rotation.x = -0.6 * Math.max(0, Math.sin(phase)) * amount;
  rig.armL.rotation.x = -0.45 * s;
  rig.armR.rotation.x = 0.45 * s;
  rig.body.position.y = rig.hip + Math.abs(Math.cos(phase)) * 0.025 * amount;
}

/**
 * Merge everything but the head into one mesh per colour, for figures that
 * only ever turn their head (the family members you are not playing).
 */
export function bakeStatic(rig: Rig) {
  rig.root.updateMatrixWorld(true);
  rig.root.attach(rig.head);
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  rig.body.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.Material;
    if (mat instanceof THREE.MeshBasicMaterial) return;
    const list = byMat.get(mat) ?? [];
    list.push(m.geometry.clone().applyMatrix4(m.matrixWorld));
    byMat.set(mat, list);
  });
  const extras: THREE.Object3D[] = [];
  rig.body.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material instanceof THREE.MeshBasicMaterial) extras.push(m); });
  for (const e of extras) rig.root.attach(e);
  rig.root.remove(rig.body);
  for (const [mat, list] of byMat) rig.root.add(new THREE.Mesh(mergeGeometries(list), mat));
}

/** The orange cat from the back walkway, sitting. */
export function cat(): THREE.Group {
  const g = new THREE.Group();
  const fur = '#d9822b', light = '#f0b46a';
  part(g, 0.14, 0.18, 0.26, fur, 0, 0.12, 0.02);
  part(g, 0.12, 0.1, 0.1, light, 0, 0.1, -0.1);
  part(g, 0.13, 0.11, 0.11, fur, 0, 0.27, -0.12);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.05, 4), lambert(fur));
    ear.position.set(s * 0.04, 0.345, -0.12);
    g.add(ear);
    part(g, 0.016, 0.016, 0.004, '#1f3b1f', s * 0.03, 0.285, -0.177);
    part(g, 0.035, 0.06, 0.04, light, s * 0.04, 0.03, -0.12);
  }
  const tail = part(g, 0.03, 0.03, 0.26, fur, 0.07, 0.04, 0.2);
  tail.rotation.y = 0.5;
  return g;
}
