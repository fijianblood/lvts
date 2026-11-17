// Noqublox brick models: the players' figures and the drivable vehicles.
// The figures are LvTS's own design (square heads, round hands), not LEGO
// minifigures. Vehicles face +z; their right-hand (driver's) side is -x,
// because Fiji drives on the left.
import * as THREE from 'three';
import { P, PL, BRICK, plastic, glass, rubber, glow, label, faceMaterial, block, studsOn } from './kit.ts';

// ── figure ─────────────────────────────────────────────────
export interface FigureLook { skin: string; hair: string; shirt: string; pants: string; shoes?: string }

export interface Figure {
  root: THREE.Group;
  /** phase advances with walking speed */
  animate(speed: number, dt: number): void;
  sit(on: boolean): void;
}

export function makeFigure(look: FigureLook): Figure {
  const root = new THREE.Group();
  const skin = plastic(look.skin);
  const shirt = plastic(look.shirt);
  const pants = plastic(look.pants);
  const shoes = plastic(look.shoes ?? '#2a2d33');
  const hip = 0.62;

  const legs: THREE.Group[] = [];
  for (const sx of [-0.13, 0.13]) {
    const g = new THREE.Group();
    g.position.set(sx, hip, 0);
    const leg = block(0.25, 0.56, 0.3, pants, 0.04);
    leg.position.y = -0.28;
    const shoe = block(0.27, 0.09, 0.36, shoes, 0.03);
    shoe.position.set(0, -0.57, 0.03);
    g.add(leg, shoe);
    root.add(g);
    legs.push(g);
  }
  const hips = block(0.54, 0.12, 0.3, pants, 0.03);
  hips.position.y = hip + 0.04;
  const torso = block(0.58, 0.5, 0.32, shirt, 0.05);
  torso.position.y = hip + 0.35;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 12), skin);
  neck.position.y = hip + 0.63;
  // head: face printed on the front only
  const faceMat = faceMaterial(look.skin);
  const headGeo = new THREE.BoxGeometry(0.42, 0.4, 0.4);
  const head = new THREE.Mesh(headGeo, [skin, skin, skin, skin, faceMat, skin]);
  head.position.y = hip + 0.86;
  head.castShadow = true;
  const hair = block(0.45, 0.12, 0.43, plastic(look.hair), 0.03);
  hair.position.set(0, hip + 1.1, -0.01);
  const fringe = block(0.45, 0.06, 0.08, plastic(look.hair), 0.02);
  fringe.position.set(0, hip + 1.03, 0.19);
  root.add(hips, torso, neck, head, hair, fringe);

  const arms: THREE.Group[] = [];
  for (const sx of [-0.36, 0.36]) {
    const g = new THREE.Group();
    g.position.set(sx, hip + 0.55, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.46, 12), shirt);
    arm.position.y = -0.2;
    arm.castShadow = true;
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), skin);
    hand.position.y = -0.46;
    hand.castShadow = true;
    g.add(arm, hand);
    g.rotation.z = sx < 0 ? -0.08 : 0.08;
    root.add(g);
    arms.push(g);
  }

  let phase = 0;
  let sitting = false;
  return {
    root,
    animate(speed, dt) {
      if (sitting) return;
      phase += dt * (2 + speed * 2.2);
      const a = Math.min(1, speed / 3) * 0.6;
      legs[0].rotation.x = Math.sin(phase) * a;
      legs[1].rotation.x = -Math.sin(phase) * a;
      arms[0].rotation.x = -Math.sin(phase) * a * 0.9;
      arms[1].rotation.x = Math.sin(phase) * a * 0.9;
    },
    sit(on) {
      sitting = on;
      for (const l of legs) l.rotation.x = on ? -Math.PI / 2 : 0;
      for (const a of arms) a.rotation.x = on ? -1.1 : 0;
    },
  };
}

// ── vehicles ───────────────────────────────────────────────
export interface Vehicle {
  name: string;
  group: THREE.Group;
  body: THREE.Group;
  wheels: THREE.Object3D[];
  steer: THREE.Object3D[];
  wheelR: number;
  /** distance between axles */
  base: number;
  /** half length / half width, for bumping into things */
  halfL: number;
  halfW: number;
  seat: THREE.Vector3;
  maxSpeed: number;
  accel: number;
  speed: number;
  yaw: number;
}

function wheel(r: number, w: number, rim: string): { steer: THREE.Group; spin: THREE.Group } {
  const steer = new THREE.Group();
  const spin = new THREE.Group();
  const tyreGeo = new THREE.CylinderGeometry(r, r, w, 28);
  tyreGeo.rotateZ(Math.PI / 2);
  const tyre = new THREE.Mesh(tyreGeo, rubber());
  tyre.castShadow = true;
  const rimGeo = new THREE.CylinderGeometry(r * 0.58, r * 0.58, w + 0.02, 20);
  rimGeo.rotateZ(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, plastic(rim, { metalness: 0.35, roughness: 0.25 }));
  const hubGeo = new THREE.CylinderGeometry(r * 0.2, r * 0.2, w + 0.06, 12);
  hubGeo.rotateZ(Math.PI / 2);
  const hub = new THREE.Mesh(hubGeo, plastic('#5b6068'));
  // tread blocks, so you can see the wheels turn
  const tread = new THREE.InstancedMesh(new THREE.BoxGeometry(w * 0.9, 0.05, 0.08), rubber(), 14);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    tread.setMatrixAt(i, new THREE.Matrix4().compose(
      new THREE.Vector3(0, Math.cos(a) * r, Math.sin(a) * r),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -a),
      new THREE.Vector3(1, 1, 1)));
  }
  spin.add(tyre, rimMesh, hub, tread);
  steer.add(spin);
  return { steer, spin };
}

function addWheels(v: Pick<Vehicle, 'group' | 'wheels' | 'steer'>, r: number, w: number, x: number, zf: number, zr: number, rim: string): void {
  for (const [sx, sz, front] of [[-x, zf, true], [x, zf, true], [-x, zr, false], [x, zr, false]] as const) {
    const wh = wheel(r, w, rim);
    wh.steer.position.set(sx, r, sz);
    v.group.add(wh.steer);
    v.wheels.push(wh.spin);
    if (front) v.steer.push(wh.steer);
  }
}

/** Shiny round headlight tile facing +z. */
function headlight(r: number, color = '#fff2b0'): THREE.Mesh {
  const g = new THREE.CylinderGeometry(r, r, 0.06, 20);
  g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, glow(color, 1.1));
}

/** The blue brick car from the LvTS videos: studded bonnet, round lights, slatted grille. */
export function makeCar(color = '#2f5fd0', name = 'Brick car'): Vehicle {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const paint = plastic(color);
  const grey = plastic('#cfd3d8');
  const dark = plastic('#2b2e35');
  const v: Vehicle = { name, group, body, wheels: [], steer: [], wheelR: 0.36, base: 2.9, halfL: 2.3, halfW: 1.1, seat: new THREE.Vector3(-0.42, 0.28, -0.32), maxSpeed: 16, accel: 7, speed: 0, yaw: 0 };
  const W = 5 * P, L = 11 * P;
  const y0 = 0.42;
  // chassis plate
  const chassis = block(W, PL, L, grey, 0.02);
  chassis.position.y = y0 + PL / 2;
  body.add(chassis);
  const yb = y0 + PL;
  // bonnet block + studs
  const bonnet = block(W, BRICK, 3.5 * P, paint);
  bonnet.position.set(0, yb + BRICK / 2, L / 2 - 1.75 * P);
  body.add(bonnet);
  studsOn(body, 5, 3, 0, yb + BRICK, L / 2 - 1.75 * P - 0.05 * P, paint);
  // grille with slats
  const grille = block(0.9, 0.28, 0.06, dark, 0.02);
  grille.position.set(0, yb + 0.22, L / 2 + 0.01);
  body.add(grille);
  for (let i = -3; i <= 3; i++) {
    const s = block(0.04, 0.22, 0.03, plastic('#565b64'), 0.01);
    s.position.set(i * 0.11, yb + 0.22, L / 2 + 0.05);
    body.add(s);
  }
  for (const sx of [-0.7, 0.7]) {
    const h = headlight(0.13);
    h.position.set(sx, yb + 0.24, L / 2 + 0.02);
    body.add(h);
  }
  // front bumper, a little wider than the body
  const bumper = block(W + 0.24, PL, 0.36, grey, 0.03);
  bumper.position.set(0, y0 + PL / 2, L / 2 + 0.1);
  body.add(bumper);
  // cabin sides and back
  for (const sx of [-1, 1]) {
    const side = block(P, BRICK, 5.5 * P, paint);
    side.position.set(sx * (W / 2 - P / 2), yb + BRICK / 2, -0.25 * P);
    body.add(side);
    studsOn(body, 1, 5, sx * (W / 2 - P / 2), yb + BRICK, -0.25 * P, paint);
  }
  const boot = block(W, BRICK, 2 * P, paint);
  boot.position.set(0, yb + BRICK / 2, -L / 2 + P);
  body.add(boot);
  studsOn(body, 5, 2, 0, yb + BRICK, -L / 2 + P, paint);
  for (const sx of [-0.75, 0.75]) {
    const t = block(0.3, 0.14, 0.04, glow('#e3262b', 0.6), 0.02);
    t.position.set(sx, yb + 0.3, -L / 2 - 0.01);
    body.add(t);
  }
  // seats
  for (const sx of [-0.42, 0.42]) {
    const seat = block(0.62, 0.3, 0.6, dark);
    seat.position.set(sx, yb + 0.15, -0.35);
    const back = block(0.62, 0.62, 0.14, dark);
    back.position.set(sx, yb + 0.35, -0.72);
    body.add(seat, back);
  }
  // windscreen in a grey frame, and the steering wheel
  const screen = new THREE.Mesh(new THREE.BoxGeometry(W - 0.3, 0.46, 0.04), glass());
  screen.position.set(0, yb + BRICK + 0.31, 0.6);
  screen.rotation.x = -0.22;
  body.add(screen);
  const frameTop = block(W - 0.1, 0.06, 0.08, grey, 0.02);
  frameTop.position.set(0, yb + BRICK + 0.6, 0.5);
  const framePosts = [-1, 1].map((s) => {
    const p = block(0.07, 0.6, 0.07, grey, 0.02);
    p.position.set(s * (W / 2 - 0.08), yb + BRICK + 0.3, 0.57);
    p.rotation.x = -0.22;
    return p;
  });
  body.add(frameTop, ...framePosts);
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), dark);
  sw.position.set(-0.42, yb + BRICK + 0.05, 0.28);
  sw.rotation.x = -1.0;
  body.add(sw);
  addWheels(v, 0.36, 0.3, W / 2 - 0.05, 1.45, -1.45, '#d9dde2');
  return v;
}

/** A twin-cab brick pickup: bull bar, sports bar, tray, chunky off-road tyres. */
export function makeTruck(color = '#24282f', name = 'LvTS pickup'): Vehicle {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);
  const paint = plastic(color, { clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const grey = plastic('#8d939b', { metalness: 0.3 });
  const dark = plastic('#1e2126');
  const W = 5 * P, L = 13 * P;
  const v: Vehicle = { name, group, body, wheels: [], steer: [], wheelR: 0.44, base: 3.4, halfL: 2.75, halfW: 1.15, seat: new THREE.Vector3(-0.42, 0.44, 0.38), maxSpeed: 14, accel: 6, speed: 0, yaw: 0 };
  const y0 = 0.6;
  const chassis = block(W, PL, L, dark, 0.02);
  chassis.position.y = y0 + PL / 2;
  body.add(chassis);
  const yb = y0 + PL;
  const zCabF = 1.1, zCabR = -0.95, zFront = L / 2;
  // bonnet
  const bonnet = block(W, BRICK, zFront - zCabF, paint);
  bonnet.position.set(0, yb + BRICK / 2, (zFront + zCabF) / 2);
  body.add(bonnet);
  studsOn(body, 5, 3, 0, yb + BRICK, (zFront + zCabF) / 2, paint);
  // big grille with two bars, square lights
  const grille = block(1.3, 0.34, 0.06, dark, 0.02);
  grille.position.set(0, yb + 0.26, zFront + 0.01);
  body.add(grille);
  for (const y of [0.18, 0.32]) {
    const bar = block(1.34, 0.05, 0.05, grey, 0.02);
    bar.position.set(0, yb + y, zFront + 0.05);
    body.add(bar);
  }
  for (const sx of [-0.82, 0.82]) {
    const l = block(0.3, 0.14, 0.05, glow('#fff6d6', 1.2), 0.02);
    l.position.set(sx, yb + 0.34, zFront + 0.01);
    body.add(l);
  }
  // bull bar
  const bb = grey;
  for (const sx of [-0.35, 0.35]) {
    const post = block(0.08, 0.62, 0.08, bb, 0.03);
    post.position.set(sx, yb + 0.1, zFront + 0.32);
    body.add(post);
  }
  for (const y of [-0.1, 0.38]) {
    const rail = block(W + 0.1, 0.08, 0.08, bb, 0.03);
    rail.position.set(0, yb + y, zFront + 0.32);
    body.add(rail);
  }
  // cab: lower body, glass row, studded roof
  const cabL = zCabF - zCabR, cabZ = (zCabF + zCabR) / 2;
  for (const sx of [-1, 1]) {
    const side = block(P, BRICK, cabL, paint);
    side.position.set(sx * (W / 2 - P / 2), yb + BRICK / 2, cabZ);
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.05, BRICK * 1.3, cabL - 0.3), glass());
    win.position.set(sx * (W / 2 - 0.05), yb + BRICK * 1.65, cabZ);
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.28), label('LvTS', color, '#ffffff', 256, 72));
    decal.position.set(sx * (W / 2 + 0.005), yb + BRICK / 2, cabZ + 0.2);
    decal.rotation.y = sx * Math.PI / 2;
    body.add(side, win, decal);
    // mirrors
    const mirror = block(0.08, 0.18, 0.22, dark, 0.02);
    mirror.position.set(sx * (W / 2 + 0.08), yb + BRICK + 0.12, zCabF - 0.1);
    body.add(mirror);
    // side steps
    const step = block(0.22, 0.06, 1.7, grey, 0.02);
    step.position.set(sx * (W / 2 + 0.06), y0 - 0.05, cabZ);
    body.add(step);
  }
  for (const [z, s] of [[zCabF, 1], [zCabR, -1]] as const) {
    const pane = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, BRICK * 1.3, 0.05), glass());
    pane.position.set(0, yb + BRICK * 1.65, z - s * 0.02);
    if (s > 0) pane.rotation.x = -0.18;
    body.add(pane);
  }
  const back = block(W, BRICK, P, paint);
  back.position.set(0, yb + BRICK / 2, zCabR + P / 2);
  body.add(back);
  for (const sx of [-1, 1]) for (const z of [zCabF - 0.08, zCabR + 0.08, cabZ]) {
    const pillar = block(0.1, BRICK * 1.3, 0.1, paint, 0.02);
    pillar.position.set(sx * (W / 2 - 0.06), yb + BRICK * 1.65, z);
    body.add(pillar);
  }
  const roof = block(W, PL, cabL + 0.1, paint, 0.03);
  roof.position.set(0, yb + BRICK * 2.3 + PL / 2, cabZ - 0.05);
  body.add(roof);
  studsOn(body, 5, 5, 0, yb + BRICK * 2.3 + PL, cabZ - 0.05, paint);
  // seats, two rows
  for (const z of [0.35, -0.5]) for (const sx of [-0.42, 0.42]) {
    const seat = block(0.62, 0.28, 0.55, dark);
    seat.position.set(sx, yb + 0.14, z);
    const sb = block(0.62, 0.6, 0.12, dark);
    sb.position.set(sx, yb + 0.35, z - 0.33);
    body.add(seat, sb);
  }
  const sw = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 8, 20), dark);
  sw.position.set(-0.42, yb + BRICK + 0.12, 0.85);
  sw.rotation.x = -1.0;
  body.add(sw);
  // tray: floor, sides, tailgate with lights
  const trayL = zCabR - -L / 2, trayZ = (zCabR - L / 2) / 2;
  const floor = block(W, PL, trayL, dark, 0.02);
  floor.position.set(0, yb + PL / 2, trayZ);
  body.add(floor);
  for (const sx of [-1, 1]) {
    const s = block(P, BRICK, trayL, paint);
    s.position.set(sx * (W / 2 - P / 2), yb + BRICK / 2, trayZ);
    body.add(s);
    studsOn(body, 1, Math.round(trayL / P), sx * (W / 2 - P / 2), yb + BRICK, trayZ, paint);
  }
  const gate = block(W, BRICK, P, paint);
  gate.position.set(0, yb + BRICK / 2, -L / 2 + P / 2);
  body.add(gate);
  for (const sx of [-0.8, 0.8]) {
    const t = block(0.22, 0.3, 0.04, glow('#e3262b', 0.6), 0.02);
    t.position.set(sx, yb + 0.25, -L / 2 - 0.01);
    body.add(t);
  }
  // sports bar behind the cab
  for (const sx of [-0.85, 0.85]) {
    const up = block(0.08, 0.7, 0.08, grey, 0.03);
    up.position.set(sx, yb + BRICK + 0.35, zCabR - 0.3);
    body.add(up);
  }
  const top = block(1.78, 0.08, 0.08, grey, 0.03);
  top.position.set(0, yb + BRICK + 0.7, zCabR - 0.3);
  body.add(top);
  // rear bumper
  const rb = block(W + 0.1, 0.16, 0.25, grey, 0.03);
  rb.position.set(0, y0 - 0.02, -L / 2 - 0.08);
  body.add(rb);
  addWheels(v, 0.44, 0.38, W / 2 - 0.02, 1.75, -1.75, '#a7adb5');
  return v;
}
