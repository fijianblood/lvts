// Noqublox brick test: a small McFarlane Road street (not the full Raiwai map)
// to try the realistic toy-brick look before converting the whole game.
// McFarlane Road runs along x at z = 0; the LvTS house is to the north (-z),
// a row of shops to the south (+z), and a side road goes north at x = 40.
import * as THREE from 'three';
import { P, PL, BRICK, Batch, wall, slab, baseplate, tiles2, label, plastic, glass, glow, type Gap } from './kit.ts';

export interface Box { x0: number; x1: number; z0: number; z1: number }
export interface Spot { kind: 'car' | 'truck'; color: string; name: string; x: number; z: number; yaw: number }
export interface World {
  group: THREE.Group;
  colliders: Box[];
  heightAt(x: number, z: number): number;
  spawn: { x: number; z: number; yaw: number };
  vehicles: Spot[];
  bounds: Box;
}

type WinGap = Gap & { door?: boolean };

const inside = (b: Box, x: number, z: number) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
const rect = (x0: number, x1: number, z0: number, z1: number): Box => ({ x0, x1, z0, z1 });

export function buildWorld(quality: 'low' | 'high'): World {
  const group = new THREE.Group();
  const b = new Batch(11);
  const colliders: Box[] = [];
  const bounds = rect(-68, 68, -68, 48);

  // ── ground: studded grass, smooth roads, raised footpaths ──
  group.add(slab(140, PL, 120, baseplate('#3f9a46', 140, 120), 0, -PL, -10));
  const roads = [rect(-70, 70, -4, 4), rect(36.5, 43.5, -68, -4), rect(3, 9, -22, -4)];
  const paths = [
    rect(-70, 70, 4, 6.5),
    rect(-70, 3, -6.5, -4), rect(9, 36.5, -6.5, -4), rect(43.5, 70, -6.5, -4),
    rect(34, 36.5, -68, -6.5), rect(43.5, 46, -68, -6.5),
  ];
  const roadMat = (w: number, d: number) => tiles2('#3a3e45', w, d, 10, true);
  for (const r of roads) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const drive = r.x0 === 3;
    group.add(slab(w, 0.03, d, drive ? tiles2('#a9adb3', w, d, 4) : roadMat(w, d), (r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2));
  }
  for (const r of paths) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    group.add(slab(w, PL, d, tiles2('#cdd1d6', w, d, 5), (r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2));
  }
  // lane dashes
  const dashes: THREE.Matrix4[] = [];
  for (let x = -66; x <= 66; x += 4) if (x < 34 || x > 46) dashes.push(new THREE.Matrix4().makeTranslation(x, 0.035, 0));
  for (let z = -10; z >= -66; z -= 4) dashes.push(new THREE.Matrix4().compose(new THREE.Vector3(40, 0.035, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2), new THREE.Vector3(1, 1, 1)));
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.012, 0.16), plastic('#f4f4f0'), dashes.length);
  dashes.forEach((m, i) => dashMesh.setMatrixAt(i, m));
  dashMesh.receiveShadow = true;
  group.add(dashMesh);

  // ── glass for window gaps ──
  const panes = (gaps: WinGap[], x0: number, z0: number, y0: number, alongZ: boolean) => {
    for (const g of gaps) {
      if (g.door) continue;
      const len = (g.to - g.from) * P, h = (g.rowTo - g.rowFrom + 1) * BRICK;
      const mid = ((g.from + g.to) / 2) * P;
      const m = new THREE.Mesh(new THREE.BoxGeometry(alongZ ? 0.05 : len, h, alongZ ? len : 0.05), glass());
      m.position.set(alongZ ? x0 : x0 + mid, y0 + g.rowFrom * BRICK + h / 2, alongZ ? z0 + mid : z0);
      group.add(m);
    }
  };

  // ── a brick house facing the road (+z) with a stepped roof ──
  const house = (cx: number, cz: number, w: number, d: number, rows: number, wallC: string, roofC: string, trim: string) => {
    const x0 = cx - (w * P) / 2, z0 = cz - (d * P) / 2;
    const zF = z0 + d * P - P / 2, zB = z0 + P / 2;
    const up = rows > 9;
    const front: WinGap[] = [
      { from: Math.floor(w / 2) - 2, to: Math.floor(w / 2) + 2, rowFrom: 0, rowTo: 4, door: true },
      { from: 3, to: 9, rowFrom: 1, rowTo: 4 }, { from: w - 9, to: w - 3, rowFrom: 1, rowTo: 4 },
    ];
    if (up) front.push({ from: 3, to: 9, rowFrom: 7, rowTo: 9 }, { from: Math.floor(w / 2) - 3, to: Math.floor(w / 2) + 3, rowFrom: 7, rowTo: 9 }, { from: w - 9, to: w - 3, rowFrom: 7, rowTo: 9 });
    const side: WinGap[] = [{ from: 6, to: 11, rowFrom: 1, rowTo: 4 }];
    if (up) side.push({ from: 6, to: 11, rowFrom: 7, rowTo: 9 });
    const col = (r: number) => (r === 0 || r === rows - 1 ? trim : wallC);
    wall(b, x0, zF, w, rows, 0, col, false, front);
    wall(b, x0, zB, w, rows, 0, col, false, []);
    wall(b, x0 + P / 2, z0 + P, d - 2, rows, 0, col, true, side);
    wall(b, x0 + w * P - P / 2, z0 + P, d - 2, rows, 0, col, true, side);
    panes(front, x0, zF, 0, false);
    panes(side, x0 + P / 2, z0 + P, 0, true);
    panes(side, x0 + w * P - P / 2, z0 + P, 0, true);
    // door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.3, 0.08), plastic('#7a4a2a'));
    door.position.set(cx, 1.17, zF - 0.1);
    door.castShadow = true;
    group.add(door);
    // stepped roof, each layer one brick, stepping in two studs
    const top = rows * BRICK;
    for (let k = 0, ww = w + 2, dd = d + 2; ww > 4 && dd > 4; k++, ww -= 4, dd -= 4) {
      b.part(ww, dd, 2, cx, top + k * 2 * PL, cz, roofC);
    }
    colliders.push(rect(x0, x0 + w * P, z0, z0 + d * P));
  };

  // ── a shop on the south side, front on the road (-z) ──
  const shop = (x0: number, w: number, name: string, wallC: string, signC: string) => {
    const z0 = 7.0, d = 25, rows = 14;
    const zF = z0 + P / 2;
    const gaps: WinGap[] = [
      { from: Math.floor(w / 2) - 2, to: Math.floor(w / 2) + 2, rowFrom: 0, rowTo: 4, door: true },
      { from: 2, to: Math.floor(w / 2) - 3, rowFrom: 1, rowTo: 4 },
      { from: Math.floor(w / 2) + 3, to: w - 2, rowFrom: 1, rowTo: 4 },
      { from: 3, to: Math.floor(w / 2) - 2, rowFrom: 8, rowTo: 10 },
      { from: Math.floor(w / 2) + 2, to: w - 3, rowFrom: 8, rowTo: 10 },
    ];
    const col = (r: number) => (r === 6 ? signC : r === rows - 1 ? signC : wallC);
    wall(b, x0, zF, w, rows, 0, col, false, gaps);
    wall(b, x0, z0 + d * P - P / 2, w, rows, 0, wallC, false, []);
    wall(b, x0 + P / 2, z0 + P, d - 2, rows, 0, wallC, true, []);
    wall(b, x0 + w * P - P / 2, z0 + P, d - 2, rows, 0, wallC, true, []);
    panes(gaps, x0, zF, 0, false);
    const cx = x0 + (w * P) / 2;
    // sign printed on a tile across the sign row
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(w * P - 0.8, BRICK * 0.86), label(name, signC, '#ffffff', 1024, 64, 'bold 48px system-ui, sans-serif'));
    sign.position.set(cx, 6 * BRICK + BRICK / 2, z0 - 0.012);
    sign.rotation.y = Math.PI;
    group.add(sign);
    // studded awning over the footpath
    b.part(w - 1, 2, 1, cx, 5 * BRICK + 0.02, z0 - 0.4, signC);
    // floor, roof, a counter inside
    group.add(slab(w * P - 0.8, 0.04, d * P - 0.8, tiles2('#ddd8cf', w * P, d * P, 3), cx, 0, z0 + (d * P) / 2));
    group.add(slab(w * P, PL, d * P, baseplate('#9aa0a7', w * P, d * P), cx, rows * BRICK, z0 + (d * P) / 2));
    b.part(8, 2, 3, cx, 0, z0 + 4.5, signC);
    b.part(8, 2, 3, cx, BRICK, z0 + 4.5, '#f2f2f2');
    // includes the awning, so the camera stays out from under it
    colliders.push(rect(x0, x0 + w * P, z0 - 0.45, z0 + d * P));
  };

  // ── palm: a curved trunk of round bricks and flat leaf plates ──
  const trunkMat = plastic('#8b5a33');
  const trunkGeo = new THREE.CylinderGeometry(0.36, 0.4, BRICK - 0.006, 16);
  const trunks: THREE.Matrix4[] = [];
  const palm = (x: number, z: number, rows: number, lean: number) => {
    for (let k = 0; k < rows; k++) trunks.push(new THREE.Matrix4().makeTranslation(x + Math.pow(k / rows, 2) * lean, k * BRICK + BRICK / 2, z));
    const tx = x + lean, ty = rows * BRICK;
    for (let i = 0; i < 7; i++) b.part(1, 7, 1, tx + Math.sin((i / 7) * Math.PI * 2) * 1.3, ty, z + Math.cos((i / 7) * Math.PI * 2) * 1.3, '#2f8f3a', { rotY: (i / 7) * Math.PI * 2 });
    for (let i = 0; i < 7; i++) b.part(1, 5, 1, tx + Math.sin(((i + 0.5) / 7) * Math.PI * 2) * 0.9, ty + PL, z + Math.cos(((i + 0.5) / 7) * Math.PI * 2) * 0.9, '#46ad4c', { rotY: ((i + 0.5) / 7) * Math.PI * 2 });
    b.part(2, 2, 2, tx, ty + PL * 2, z, '#6b4426');
    colliders.push(rect(x - 0.45, x + 0.45, z - 0.45, z + 0.45));
  };

  // ── street lamp ──
  const lamps: THREE.Vector3[] = [];
  const lamp = (x: number, z: number, dir: number) => {
    for (let k = 0; k < 9; k++) b.part(1, 1, 3, x, PL + k * BRICK, z, '#7b828c', { studs: false });
    b.part(1, 5, 1, x, PL + 9 * BRICK, z + dir * 0.8, '#7b828c');
    lamps.push(new THREE.Vector3(x, PL + 9 * BRICK - 0.06, z + dir * 1.6));
    colliders.push(rect(x - 0.25, x + 0.25, z - 0.25, z + 0.25));
  };

  // ── the LvTS house compound (north side) ──
  const white = '#f3f3ef';
  wall(b, -19.8, -6.9, 80, 3, 0, white, false, [{ from: 57, to: 72, rowFrom: 0, rowTo: 2 }]);
  wall(b, -19.6, -34, 68, 3, 0, white, true, []);
  wall(b, 12.0, -34, 68, 3, 0, white, true, []);
  colliders.push(rect(-19.8, 3, -7.1, -6.7), rect(9, 12.2, -7.1, -6.7), rect(-19.8, -19.4, -34, -6.7), rect(11.8, 12.2, -34, -6.7));
  const lvtsSign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 0.9), label('LomaVata Tech Services  ·  833 1088', '#13254a', '#ffd23f', 1024, 176, 'bold 64px system-ui, sans-serif'));
  lvtsSign.position.set(-8, 0.72, -6.69);
  group.add(lvtsSign);
  house(-6, -25, 40, 22, 12, '#f1e2bf', '#24467e', '#d9c79e');
  // carport over the driveway
  for (const [x, z] of [[3.4, -12.4], [8.6, -12.4], [3.4, -19.6], [8.6, -19.6]]) {
    for (let k = 0; k < 6; k++) b.part(2, 2, 3, x, k * BRICK, z, '#bfc4ca', { studs: k === 5 });
    colliders.push(rect(x - 0.4, x + 0.4, z - 0.4, z + 0.4));
  }
  b.part(16, 21, 1, 6, 6 * BRICK, -16, '#aeb4bb');
  palm(-15, -10, 11, 0.9);
  palm(10, -9.5, 9, -0.7);

  // ── neighbours ──
  house(-45, -24, 30, 22, 8, '#ecc6d4', '#b23a3a', '#d8a9bb');
  house(24, -24, 24, 20, 8, '#f3d6a3', '#7a4a29', '#ddb987');
  house(56, -24, 26, 22, 8, '#cfe3c6', '#3b6b4f', '#b4ceaa');
  palm(-30, -10, 10, 0.8);
  palm(50, -10, 10, -0.8);

  // ── the shops (south side) ──
  shop(-18, 22, 'The Hot Bread Kitchen', '#f6e7c8', '#d6261c');
  shop(-9.2, 22, "Jack's of Fiji", '#eef4dc', '#7fb51a');
  shop(-0.4, 22, 'R.C. Manubhai', '#e8ecf6', '#2b3990');
  palm(14, 10, 10, 0.7);
  palm(22, 12, 11, -0.6);
  palm(-26, 10, 10, -0.8);
  for (const x of [-34, -22, 12, 30]) lamp(x, 6.0, -1);

  // street sign at the corner
  for (let k = 0; k < 6; k++) b.part(1, 1, 3, 34.6, PL + k * BRICK, -7, '#7b828c', { studs: false });
  const signMat = label('McFarlane Rd', '#1f4fa3', '#ffffff', 512, 128);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.5, 0.06), [plastic('#1f4fa3'), plastic('#1f4fa3'), plastic('#1f4fa3'), plastic('#1f4fa3'), signMat, signMat]);
  plate.position.set(34.6, PL + 6 * BRICK + 0.3, -7);
  plate.castShadow = true;
  group.add(plate);

  // build the batches
  group.add(b.build(quality === 'high' ? 2 : 1));
  const trunkMesh = new THREE.InstancedMesh(trunkGeo, trunkMat, trunks.length);
  trunks.forEach((m, i) => trunkMesh.setMatrixAt(i, m));
  trunkMesh.castShadow = trunkMesh.receiveShadow = true;
  group.add(trunkMesh);
  for (const p of lamps) {
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.34), glow('#fff4c8', 1.6));
    bulb.position.copy(p);
    group.add(bulb);
  }

  const heightAt = (x: number, z: number) => (paths.some((r) => inside(r, x, z)) ? PL : roads.some((r) => inside(r, x, z)) ? 0.03 : 0);

  return {
    group,
    colliders,
    heightAt,
    spawn: { x: -14, z: -5.2, yaw: Math.PI / 2 },
    vehicles: [
      { kind: 'car', color: '#2f5fd0', name: 'Blue brick car', x: -5, z: -2.1, yaw: Math.PI / 2 },
      { kind: 'car', color: '#d83a2f', name: 'Red brick car', x: 16, z: 2.1, yaw: -Math.PI / 2 },
      { kind: 'truck', color: '#24282f', name: 'LvTS pickup', x: 6, z: -16, yaw: 0 },
    ],
    bounds,
  };
}
