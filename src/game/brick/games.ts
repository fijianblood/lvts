// Noqublox brick test games:
// - Hop & Climb: an obstacle course over the water, west of the shops. Hop the
//   stepping stones, climb the brick steps, jump the spinning bar, cross the
//   beam and reach the gold star. Fall in the water and you go back to the
//   last checkpoint.
// - Riddle Hunt: six riddle posts around the street. Walk up to a "?" post,
//   pick the answer, and it turns into a star.
import * as THREE from 'three';
import { P, BRICK, Batch, label, plastic, block } from './kit.ts';
import type { Box } from './world.ts';

export interface Solid extends Box { y0: number; y1: number; kind?: 'start' | 'check' | 'finish' }
export interface Riddle { q: string; options: string[]; answer: number }
export interface Post { x: number; z: number; riddle: Riddle; solved: boolean; sign: THREE.Mesh }
export interface Spinner { bar: THREE.Group; cx: number; cz: number; top: number; half: number; speed: number }
export interface Games {
  group: THREE.Group;
  solids: Solid[];
  water: Box[];
  start: THREE.Vector3;
  spinner: Spinner;
  star: THREE.Object3D;
  posts: Post[];
  solvedMat: THREE.Material[];
}

/** Children's riddles: classic ones plus a few from around Fiji. */
const RIDDLES: Riddle[] = [
  { q: 'I have hands but I cannot clap. What am I?', options: ['A glove', 'A clock', 'A tree'], answer: 1 },
  { q: 'I am green outside and white inside, and you can drink the water inside me. What am I?', options: ['A coconut', 'A banana', 'A rock'], answer: 0 },
  { q: 'The more of me you take, the more you leave behind. What am I?', options: ['Mangoes', 'Coins', 'Footsteps'], answer: 2 },
  { q: 'I go up and down, but I never move. What am I?', options: ['Stairs', 'A bird', 'A ball'], answer: 0 },
  { q: 'I get wetter the more I dry. What am I?', options: ['Rain', 'A towel', 'A fish'], answer: 1 },
  { q: 'I have a hard shell, I live by the sea, and I walk sideways. What am I?', options: ['A turtle', 'A shark', 'A crab'], answer: 2 },
];

function starGeometry(r: number, depth: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2 });
  g.center();
  return g;
}

export function buildGames(quality: 'low' | 'high'): Games {
  const group = new THREE.Group();
  const b = new Batch(23);
  const solids: Solid[] = [];

  // a stacked brick column with studs on top; returns its top height
  const column = (cx: number, cz: number, w: number, d: number, bricks: number, color: string, kind?: Solid['kind']) => {
    for (let k = 0; k < bricks; k++) b.part(w, d, 3, cx, k * BRICK, cz, color, { studs: k === bricks - 1 });
    const top = bricks * BRICK;
    solids.push({ x0: cx - (w * P) / 2, x1: cx + (w * P) / 2, z0: cz - (d * P) / 2, z1: cz + (d * P) / 2, y0: 0, y1: top, kind });
    return top;
  };
  const flag = (x: number, z: number, y: number, color: string) => {
    for (let k = 0; k < 4; k++) b.part(1, 1, 3, x, y + k * BRICK, z, '#f4f4f2', { studs: false });
    b.part(1, 3, 3, x, y + 3 * BRICK, z + 0.8, color, { studs: false });
  };

  // ── Hop & Climb ──
  const water: Box[] = [{ x0: -60, x1: -34, z0: 12, z1: 46 }];
  const pool = new THREE.Mesh(new THREE.BoxGeometry(26, 0.04, 34), plastic('#2a86d6', { roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25, envMapIntensity: 0.5 }));
  pool.position.set(-47, 0.02, 29);
  pool.receiveShadow = true;
  group.add(pool);
  // sand edge
  const sand = new THREE.Mesh(new THREE.BoxGeometry(27.6, 0.03, 35.6), plastic('#e9d9a6', { roughness: 0.6, clearcoat: 0 }));
  sand.position.set(-47, 0.012, 29);
  sand.receiveShadow = true;
  group.add(sand);

  column(-48, 10.5, 6, 6, 1, '#f2f2f2', 'start');
  column(-48, 14.5, 3, 3, 2, '#e8322b');
  column(-48, 18, 3, 3, 2, '#f5b400');
  column(-45.5, 21, 3, 3, 3, '#2f6fd8');
  const cp1 = column(-42, 24, 6, 6, 3, '#2fae4a', 'check');
  flag(-43, 23, cp1, '#2fae4a');
  column(-38, 27, 4, 4, 4, '#e8322b');
  column(-38, 30.5, 4, 4, 6, '#f5b400');
  column(-41.5, 33, 4, 4, 8, '#2f6fd8');
  const spinTop = column(-46.5, 33, 12, 12, 10, '#f5b400');
  const cp2 = column(-52, 33, 6, 6, 10, '#2fae4a', 'check');
  flag(-53, 32, cp2, '#2fae4a');
  column(-52, 37.4, 2, 10, 10, '#8e44ad');
  const finTop = column(-52, 42, 6, 6, 11, '#ffffff', 'finish');

  // start arch
  for (const x of [-50.2, -45.8]) {
    for (let k = 0; k < 7; k++) b.part(1, 1, 3, x, k * BRICK, 8.4, '#13254a', { studs: false });
    solids.push({ x0: x - 0.2, x1: x + 0.2, z0: 8.2, z1: 8.6, y0: 0, y1: 4 });
  }
  const archMat = label('Hop & Climb', '#ffd23f', '#13254a', 512, 96);
  const archNavy = plastic('#13254a');
  const arch = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.62, 0.14), [archNavy, archNavy, archNavy, archNavy, archMat, archMat]);
  arch.position.set(-48, 7 * BRICK + 0.31, 8.4);
  arch.castShadow = true;
  group.add(arch);

  // spinning bar on the yellow platform
  const bar = new THREE.Group();
  bar.position.set(-46.5, spinTop + 0.32, 33);
  const beam = block(4.4, 0.26, 0.26, plastic('#e8322b'), 0.06);
  for (const s of [-1, 1]) {
    const cap = block(0.3, 0.3, 0.3, plastic('#ffffff'), 0.06);
    cap.position.x = s * 2.2;
    bar.add(cap);
  }
  bar.add(beam);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.62, 16), plastic('#5b6068'));
  hub.position.set(-46.5, spinTop + 0.31, 33);
  hub.castShadow = true;
  group.add(bar, hub);
  solids.push({ x0: -46.75, x1: -46.25, z0: 32.75, z1: 33.25, y0: spinTop, y1: spinTop + 0.62 });

  // gold star on the finish
  const star = new THREE.Mesh(starGeometry(0.6, 0.18), plastic('#ffc61a', { metalness: 0.6, roughness: 0.2, emissive: '#7a5200', emissiveIntensity: 0.4 }));
  star.position.set(-52, finTop + 1.2, 42);
  star.castShadow = true;
  group.add(star);

  // ── Riddle Hunt posts ──
  const askMat = label('?', '#ffd23f', '#5b2a86', 256, 256, 'bold 200px system-ui, sans-serif');
  const purple = plastic('#6a35a0');
  const solvedFace = label('★', '#ffd23f', '#d98a00', 256, 256, 'bold 200px system-ui, sans-serif');
  const spots: [number, number][] = [[-24, -5.3], [20, -5.3], [-6, 5.3], [35.3, -30], [-40, 8], [-10, -14]];
  const posts: Post[] = spots.map(([x, z], i) => {
    for (let k = 0; k < 4; k++) b.part(2, 2, 3, x, k * BRICK, z, '#6a35a0', { studs: false });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), [askMat, askMat, purple, purple, askMat, askMat]);
    sign.position.set(x, 4 * BRICK + 0.5, z);
    sign.castShadow = true;
    group.add(sign);
    solids.push({ x0: x - 0.45, x1: x + 0.45, z0: z - 0.45, z1: z + 0.45, y0: 0, y1: 3 });
    return { x, z, riddle: RIDDLES[i], solved: false, sign };
  });

  group.add(b.build(quality === 'high' ? 2 : 1));
  return {
    group,
    solids,
    water,
    start: new THREE.Vector3(-48, 0.48, 10.5),
    spinner: { bar, cx: -46.5, cz: 33, top: spinTop, half: 2.35, speed: 1.4 },
    star,
    posts,
    solvedMat: [solvedFace, solvedFace, purple, purple, solvedFace, solvedFace],
  };
}
