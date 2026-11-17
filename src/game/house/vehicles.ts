// Drivable brick vehicles for the shared world: two brick cars on McFarlane
// Road and the LvTS pickup in the carport (where the Ranger used to stand).
// A vehicle faces -z at yaw 0, like everyone in the game, and its driver sits
// on the right-hand side, because Fiji drives on the left.
// The models are LvTS's own brick style (not LEGO); the physics is a simple
// bicycle model: speed along the nose, turning by speed / wheelbase × tan(steer).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { paint, type Finish } from './models.ts';
import { canvasTexture } from './textures.ts';
import { MCFARLANE } from './layout.ts';

export type VehicleKind = 'car' | 'pickup';

export interface VehicleSpec {
  id: string;
  kind: VehicleKind;
  name: string;
  color: string;
  /** Where it's parked at the start (and after every reset). */
  x: number;
  z: number;
  yaw: number;
}

/** Size and handling, per kind. `seat`: where the driver's hips sit (x right, y up from the ground, z toward the back). */
export interface VehicleDims {
  halfL: number;
  halfW: number;
  base: number;
  wheelR: number;
  maxSpeed: number;
  accel: number;
  seat: [number, number, number];
  /** The driver's hip height above the floor of the cab, for the sitting pose. */
  sit: number;
  /** How far behind the camera follows. */
  cam: number;
}

export const DIMS: Record<VehicleKind, VehicleDims> = {
  car: { halfL: 2.35, halfW: 1.05, base: 2.9, wheelR: 0.36, maxSpeed: 13, accel: 6, seat: [0.42, 0.58, 0.32], sit: 0.3, cam: 7.5 },
  pickup: { halfL: 2.75, halfW: 1.05, base: 3.5, wheelR: 0.44, maxSpeed: 12, accel: 5, seat: [0.42, 0.76, -0.38], sit: 0.28, cam: 8.5 },
};

/** Road level by McFarlane Road (its crown); the lanes: Fiji drives on the left, so eastbound (+x) keeps to the north side. */
const LANE_N = MCFARLANE.z0 + 2.3, LANE_S = MCFARLANE.z1 - 2.3;

export const VEHICLES: VehicleSpec[] = [
  { id: 'blue-car', kind: 'car', name: 'blue brick car', color: '#2f5fd0', x: -14, z: LANE_N, yaw: -Math.PI / 2 },
  { id: 'red-car', kind: 'car', name: 'red brick car', color: '#d83a2f', x: 26, z: LANE_S, yaw: Math.PI / 2 },
  // nose in under the carport, where the Ranger stood
  { id: 'pickup', kind: 'pickup', name: 'LvTS pickup', color: '#24282f', x: 13.5, z: -2.6, yaw: 0 },
];

/** The pose number other players see while you drive vehicle `i` (after stand, seat, floor and swing). */
export const DRIVE_POSE = 4;
export const poseForVehicle = (i: number) => DRIVE_POSE + i;
export const vehicleForPose = (pose: number) => (pose >= DRIVE_POSE && pose < DRIVE_POSE + VEHICLES.length ? pose - DRIVE_POSE : -1);

// ── handling ───────────────────────────────────────────────────────────────
/** New speed after a step: throttle (-1..1) speeds up, the other way brakes hard, nothing rolls to a stop. */
export function nextSpeed(speed: number, throttle: number, d: VehicleDims, dt: number): number {
  let v = speed;
  if (throttle !== 0 && Math.sign(throttle) !== Math.sign(v) && Math.abs(v) > 0.2) v += throttle * d.accel * 2.6 * dt;
  else if (throttle !== 0) v += throttle * d.accel * dt;
  else v -= Math.sign(v) * Math.min(Math.abs(v), 3.5 * dt);
  return Math.max(-d.maxSpeed * 0.4, Math.min(d.maxSpeed, v));
}

/** The front wheels' angle for a steering input (-1 left .. 1 right): less lock at speed. Negative turns right. */
export function steerFor(input: number, speed: number, d: VehicleDims): number {
  return -input * 0.55 * (1 - Math.min(Math.abs(speed) / d.maxSpeed, 1) * 0.55);
}

/** One step of the bicycle model: the new position and heading. Forward is (-sin yaw, -cos yaw). */
export function drive(x: number, z: number, yaw: number, speed: number, steer: number, d: VehicleDims, dt: number): [number, number, number] {
  const ny = yaw + (speed / d.base) * Math.tan(steer) * dt;
  return [x - Math.sin(ny) * speed * dt, z - Math.cos(ny) * speed * dt, ny];
}

/** Points along the vehicle's middle, each the centre of a circle of radius halfW: what bumps into things. */
export function bumpers(x: number, z: number, yaw: number, d: VehicleDims): [number, number][] {
  const o = d.halfL - d.halfW, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
  return [[x + fx * o, z + fz * o], [x, z], [x - fx * o, z - fz * o]];
}

/** The vehicle's outline in plan, for collision.ts (its angle turns local x/z into world x/z). */
export function outline(x: number, z: number, yaw: number, d: VehicleDims) {
  return { cx: x, cz: z, hx: d.halfW, hz: d.halfL, angle: -yaw };
}

// ── models ─────────────────────────────────────────────────────────────────
// Built facing +z (it's easier to read), then turned round to face -z.
const P = 0.4, PL = 0.16, BRICK = 0.48;

function block(parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number, finish: Finish = 'gloss', r = 0.03) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3)), paint(color, { finish }));
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function glowBlock(parent: THREE.Object3D, w: number, h: number, d: number, color: string, x: number, y: number, z: number) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(0.02, w / 3, h / 3, d / 3)), paint(color, { emissive: color, finish: 'gloss' }));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}

const studGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.07, 14);
/** Studs on top of a w × d (studs) part centred at (cx, cz), sitting on height y (drawn later, all at once: see finishModel). */
function studs(parent: THREE.Object3D, w: number, d: number, cx: number, y: number, cz: number, color: string) {
  const list: THREE.Matrix4[] = (parent.userData.studs ??= {})[color] ??= [];
  for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) list.push(new THREE.Matrix4().makeTranslation(cx + (i + 0.5) * P - (w * P) / 2, y + 0.035, cz + (j + 0.5) * P - (d * P) / 2));
}

/** Merge a group's meshes by material and its studs into one instanced mesh per colour: a handful of draw calls per vehicle. */
function compact(g: THREE.Group) {
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const child of [...g.children]) {
    const m = child as THREE.Mesh;
    if (!m.isMesh || (m as THREE.Mesh & { isInstancedMesh?: boolean }).isInstancedMesh) continue;
    m.updateMatrix();
    let geo = m.geometry.clone().applyMatrix4(m.matrix);
    if (geo.index) geo = geo.toNonIndexed();
    for (const k of Object.keys(geo.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') geo.deleteAttribute(k);
    const mat = m.material as THREE.Material;
    (byMat.get(mat) ?? byMat.set(mat, []).get(mat)!).push(geo);
    g.remove(m);
  }
  for (const [mat, list] of byMat) {
    const merged = new THREE.Mesh(mergeGeometries(list), mat);
    merged.castShadow = !(mat as THREE.MeshStandardMaterial).transparent;
    merged.receiveShadow = true;
    g.add(merged);
  }
  const studs = (g.userData.studs ?? {}) as Record<string, THREE.Matrix4[]>;
  for (const [color, list] of Object.entries(studs)) {
    const im = new THREE.InstancedMesh(studGeo, paint(color, { finish: 'gloss' }), list.length);
    list.forEach((mx, i) => im.setMatrixAt(i, mx));
    im.castShadow = true;
    g.add(im);
  }
  delete g.userData.studs;
}

function glassPane(parent: THREE.Object3D, w: number, h: number, d: number, x: number, y: number, z: number, tilt = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), glassMat());
  m.position.set(x, y, z);
  m.rotation.x = tilt;
  parent.add(m);
}
let glassM: THREE.MeshStandardMaterial | null = null;
const glassMat = () => (glassM ??= new THREE.MeshStandardMaterial({ color: '#bfe4ff', transparent: true, opacity: 0.32, roughness: 0.05, depthWrite: false }));

function wheel(r: number, w: number, rim: string) {
  const steer = new THREE.Group();
  const spin = new THREE.Group();
  const tyreGeo = new THREE.CylinderGeometry(r, r, w, 28);
  tyreGeo.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh<THREE.BufferGeometry>(tyreGeo, paint('#1b1d21', { finish: 'cloth' }));
  tyre.castShadow = true;
  const rimGeo = new THREE.CylinderGeometry(r * 0.58, r * 0.58, w + 0.02, 20);
  rimGeo.rotateZ(Math.PI / 2);
  const hubGeo = new THREE.CylinderGeometry(r * 0.2, r * 0.2, w + 0.06, 12);
  hubGeo.rotateZ(Math.PI / 2);
  // tread blocks round the tyre (so you can see the wheels turn), all one mesh with it
  const parts: THREE.BufferGeometry[] = [tyreGeo.index ? tyreGeo.toNonIndexed() : tyreGeo];
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const b = new THREE.BoxGeometry(w * 0.9, 0.05, 0.08).toNonIndexed();
    b.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(0, Math.cos(a) * r, Math.sin(a) * r), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -a), new THREE.Vector3(1, 1, 1)));
    parts.push(b);
  }
  tyre.geometry = mergeGeometries(parts);
  // the rim and its hub cap as one piece: two draw calls a wheel
  spin.add(tyre, new THREE.Mesh(mergeGeometries([rimGeo.toNonIndexed(), hubGeo.toNonIndexed()]), paint(rim, { finish: 'metal' })));
  steer.add(spin);
  return { steer, spin };
}

export interface VehicleModel {
  /** Placed at the vehicle's position and heading (pitch for slopes). */
  group: THREE.Group;
  /** Rolls a little in corners. */
  body: THREE.Group;
  wheels: THREE.Object3D[];
  steer: THREE.Object3D[];
}

function finishModel(inner: THREE.Group, body: THREE.Group, wheels: THREE.Object3D[], steer: THREE.Object3D[]): VehicleModel {
  compact(body);
  const group = new THREE.Group();
  group.rotation.order = 'YXZ';
  inner.rotation.y = Math.PI;   // built facing +z; the game's forward is -z
  group.add(inner);
  return { group, body, wheels, steer };
}

function addWheels(inner: THREE.Group, wheels: THREE.Object3D[], steer: THREE.Object3D[], r: number, w: number, x: number, zf: number, zr: number, rim: string) {
  for (const [sx, sz, front] of [[-x, zf, true], [x, zf, true], [-x, zr, false], [x, zr, false]] as const) {
    const wh = wheel(r, w, rim);
    wh.steer.position.set(sx, r, sz);
    inner.add(wh.steer);
    wheels.push(wh.spin);
    if (front) steer.push(wh.steer);
  }
}

/** The blue brick car from the LvTS videos: studded bonnet, round headlights, slatted grille, open top. */
export function carModel(color: string): VehicleModel {
  const inner = new THREE.Group(), body = new THREE.Group();
  inner.add(body);
  const W = 5 * P, L = 11 * P, y0 = 0.42, yb = y0 + PL;
  const grey = '#cfd3d8', dark = '#2b2e35';
  const wheels: THREE.Object3D[] = [], steer: THREE.Object3D[] = [];
  block(body, W, PL, L, grey, 0, y0 + PL / 2, 0, 'gloss', 0.02);
  block(body, W, BRICK, 3.5 * P, color, 0, yb + BRICK / 2, L / 2 - 1.75 * P);
  studs(body, 5, 3, 0, yb + BRICK, L / 2 - 1.75 * P, color);
  block(body, 0.9, 0.28, 0.06, dark, 0, yb + 0.22, L / 2 + 0.01, 'satin', 0.02);
  for (let i = -3; i <= 3; i++) block(body, 0.04, 0.22, 0.03, '#565b64', i * 0.11, yb + 0.22, L / 2 + 0.05, 'satin', 0.01);
  for (const sx of [-0.7, 0.7]) {
    const g = new THREE.CylinderGeometry(0.13, 0.13, 0.06, 20);
    g.rotateX(Math.PI / 2);
    const h = new THREE.Mesh(g, paint('#fff2b0', { emissive: '#fff2b0', finish: 'gloss' }));
    h.position.set(sx, yb + 0.24, L / 2 + 0.02);
    body.add(h);
  }
  block(body, W + 0.24, PL, 0.36, grey, 0, y0 + PL / 2, L / 2 + 0.1);
  for (const sx of [-1, 1]) {
    block(body, P, BRICK, 5.5 * P, color, sx * (W / 2 - P / 2), yb + BRICK / 2, -0.25 * P);
    studs(body, 1, 5, sx * (W / 2 - P / 2), yb + BRICK, -0.25 * P, color);
  }
  block(body, W, BRICK, 2 * P, color, 0, yb + BRICK / 2, -L / 2 + P);
  studs(body, 5, 2, 0, yb + BRICK, -L / 2 + P, color);
  for (const sx of [-0.75, 0.75]) glowBlock(body, 0.3, 0.14, 0.04, '#e3262b', sx, yb + 0.3, -L / 2 - 0.01);
  for (const sx of [-0.42, 0.42]) {
    block(body, 0.62, 0.3, 0.6, dark, sx, yb + 0.15, -0.35, 'satin');
    block(body, 0.62, 0.62, 0.14, dark, sx, yb + 0.35, -0.72, 'satin');
  }
  glassPane(body, W - 0.3, 0.46, 0.04, 0, yb + BRICK + 0.31, 0.6, -0.22);
  block(body, W - 0.1, 0.06, 0.08, grey, 0, yb + BRICK + 0.6, 0.5, 'gloss', 0.02);
  for (const s of [-1, 1]) block(body, 0.07, 0.6, 0.07, grey, s * (W / 2 - 0.08), yb + BRICK + 0.3, 0.57, 'gloss', 0.02).rotation.x = -0.22;
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), paint(dark, { finish: 'satin' }));
  sw.position.set(-0.42, yb + BRICK + 0.05, 0.28);
  sw.rotation.x = -1.0;
  body.add(sw);
  addWheels(inner, wheels, steer, 0.36, 0.3, W / 2 - 0.05, 1.45, -1.45, '#d9dde2');
  return finishModel(inner, body, wheels, steer);
}

/** The LvTS twin-cab pickup: bull bar, sports bar, tray, chunky tyres, LvTS on the doors. */
export function pickupModel(color: string): VehicleModel {
  const inner = new THREE.Group(), body = new THREE.Group();
  inner.add(body);
  const W = 5 * P, L = 13 * P, y0 = 0.6, yb = y0 + PL;
  const grey = '#8d939b', dark = '#1e2126';
  const wheels: THREE.Object3D[] = [], steer: THREE.Object3D[] = [];
  const zCabF = 1.1, zCabR = -0.95, zFront = L / 2;
  block(body, W, PL, L, dark, 0, y0 + PL / 2, 0, 'satin', 0.02);
  block(body, W, BRICK, zFront - zCabF, color, 0, yb + BRICK / 2, (zFront + zCabF) / 2);
  studs(body, 5, 3, 0, yb + BRICK, (zFront + zCabF) / 2, color);
  block(body, 1.3, 0.34, 0.06, dark, 0, yb + 0.26, zFront + 0.01, 'satin', 0.02);
  for (const y of [0.18, 0.32]) block(body, 1.34, 0.05, 0.05, grey, 0, yb + y, zFront + 0.05, 'metal', 0.02);
  for (const sx of [-0.82, 0.82]) glowBlock(body, 0.3, 0.14, 0.05, '#fff6d6', sx, yb + 0.34, zFront + 0.01);
  for (const sx of [-0.35, 0.35]) block(body, 0.08, 0.62, 0.08, grey, sx, yb + 0.1, zFront + 0.32, 'metal');
  for (const y of [-0.1, 0.38]) block(body, W + 0.1, 0.08, 0.08, grey, 0, yb + y, zFront + 0.32, 'metal');
  const cabL = zCabF - zCabR, cabZ = (zCabF + zCabR) / 2;
  const decal = new THREE.MeshStandardMaterial({
    map: canvasTexture(256, 72, (g, w, h) => { g.fillStyle = color; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 52px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LvTS', w / 2, h / 2 + 2); }),
    roughness: 0.3,
  });
  for (const sx of [-1, 1]) {
    block(body, P, BRICK, cabL, color, sx * (W / 2 - P / 2), yb + BRICK / 2, cabZ);
    glassPane(body, 0.05, BRICK * 1.3, cabL - 0.3, sx * (W / 2 - 0.05), yb + BRICK * 1.65, cabZ);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.28), decal);
    d.position.set(sx * (W / 2 + 0.005), yb + BRICK / 2, cabZ + 0.2);
    d.rotation.y = sx * Math.PI / 2;
    body.add(d);
    block(body, 0.08, 0.18, 0.22, dark, sx * (W / 2 + 0.08), yb + BRICK + 0.12, zCabF - 0.1, 'satin', 0.02);
    block(body, 0.22, 0.06, 1.7, grey, sx * (W / 2 + 0.06), y0 - 0.05, cabZ, 'metal', 0.02);
  }
  glassPane(body, W - 0.2, BRICK * 1.3, 0.05, 0, yb + BRICK * 1.65, zCabF - 0.02, -0.18);
  glassPane(body, W - 0.2, BRICK * 1.3, 0.05, 0, yb + BRICK * 1.65, zCabR + 0.02);
  block(body, W, BRICK, P, color, 0, yb + BRICK / 2, zCabR + P / 2);
  for (const sx of [-1, 1]) for (const z of [zCabF - 0.08, zCabR + 0.08, cabZ]) block(body, 0.1, BRICK * 1.3, 0.1, color, sx * (W / 2 - 0.06), yb + BRICK * 1.65, z, 'gloss', 0.02);
  block(body, W, PL, cabL + 0.1, color, 0, yb + BRICK * 2.3 + PL / 2, cabZ - 0.05);
  studs(body, 5, 5, 0, yb + BRICK * 2.3 + PL, cabZ - 0.05, color);
  for (const z of [0.35, -0.5]) for (const sx of [-0.42, 0.42]) {
    block(body, 0.62, 0.28, 0.55, dark, sx, yb + 0.14, z, 'satin');
    block(body, 0.62, 0.6, 0.12, dark, sx, yb + 0.35, z - 0.33, 'satin');
  }
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), paint(dark, { finish: 'satin' }));
  sw.position.set(-0.42, yb + BRICK + 0.12, 0.85);
  sw.rotation.x = -1.0;
  body.add(sw);
  const trayL = zCabR + L / 2, trayZ = (zCabR - L / 2) / 2;
  block(body, W, PL, trayL, dark, 0, yb + PL / 2, trayZ, 'satin', 0.02);
  for (const sx of [-1, 1]) {
    block(body, P, BRICK, trayL, color, sx * (W / 2 - P / 2), yb + BRICK / 2, trayZ);
    studs(body, 1, Math.round(trayL / P), sx * (W / 2 - P / 2), yb + BRICK, trayZ, color);
  }
  block(body, W, BRICK, P, color, 0, yb + BRICK / 2, -L / 2 + P / 2);
  for (const sx of [-0.8, 0.8]) glowBlock(body, 0.22, 0.3, 0.04, '#e3262b', sx, yb + 0.25, -L / 2 - 0.01);
  for (const sx of [-0.85, 0.85]) block(body, 0.08, 0.7, 0.08, grey, sx, yb + BRICK + 0.35, zCabR - 0.3, 'metal');
  block(body, 1.78, 0.08, 0.08, grey, 0, yb + BRICK + 0.7, zCabR - 0.3, 'metal');
  block(body, W + 0.1, 0.16, 0.25, grey, 0, y0 - 0.02, -L / 2 - 0.08, 'metal');
  addWheels(inner, wheels, steer, 0.44, 0.38, W / 2 - 0.02, 1.75, -1.75, '#a7adb5');
  return finishModel(inner, body, wheels, steer);
}

export const vehicleModel = (s: VehicleSpec): VehicleModel => (s.kind === 'pickup' ? pickupModel(s.color) : carModel(s.color));
