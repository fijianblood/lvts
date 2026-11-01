// The USP campus, open to visitors: where McFarlane Road ends, it carries on
// as the campus drive into a paved plaza (a shade shelter with benches, lamp
// posts, a palm in a planter), with paths and a covered walkway to the
// teaching blocks, and lawns with trees, all inside a low wall. You can walk
// all round the buildings, not into them.
//
// Pure data, no three.js: layout.ts adds the rooms, barriers and props;
// raiwaiPlan.ts draws the buildings (USP_BUILDINGS) and the trees (USP_TREES).
import type { Prim, Barrier, Room, XZ } from './layout.ts';

/** The grounds: from the end of McFarlane Road (layout.ts MCFARLANE.x1; a test checks they meet) east. */
export const USP = { x0: 216, x1: 272, z0: 22.3, z1: 66 };
/** The USP entrance sign (raiwaiPlan.ts SIGNS) stands on the lawn beside the drive, facing the road. */
export const USP_SIGN = { x: USP.x0 + 3, z: 34.6 };
/** The drive in from the road, the footpath beside it, the plaza. */
const DRIVE = { x0: USP.x0, x1: 236, z0: 22.5, z1: 29 };
const WALK = { x0: USP.x0, x1: 236, z0: 29, z1: 31.6 };
const PLAZA = { x0: 236, x1: 256, z0: 24, z1: 44 };

type Face = 'n' | 's' | 'e' | 'w';
/** The teaching blocks you can walk round (built by raiwai.ts flats(), with a stair tower 3 m off one end). */
export const USP_BUILDINGS: { x: number; z: number; face: Face; w: number; d: number; floors: number }[] = [
  { x: 244, z: 56, face: 'n', w: 28, d: 12, floors: 3 },     // facing the plaza across the covered walkway
  { x: 264, z: 38, face: 'w', w: 22, d: 12, floors: 3 },     // along the east side, facing the plaza
];
/** USP's blocks along the north side of McFarlane Road and behind the campus's north wall (seen, not walked round). */
export const USP_NORTH: { x: number; z: number; face: Face; w: number; d: number; floors: number }[] = [
  { x: 190, z: 6, face: 's', w: 30, d: 14, floors: 3 },
  { x: 232, z: 10, face: 's', w: 26, d: 14, floors: 4 },
];
/** Trees on the lawns (drawn by the engine; their trunks are solid). */
export const USP_TREES: { kind: 'mango' | 'palm'; x: number; z: number; s: number }[] = [
  { kind: 'palm', x: 246, z: 34, s: 8 },                     // in the planter in the plaza
  { kind: 'mango', x: 224, z: 44, s: 1.1 }, { kind: 'mango', x: 224, z: 58, s: 1.0 }, { kind: 'mango', x: 268, z: 60, s: 1.05 },
  { kind: 'palm', x: 229, z: 36, s: 7 }, { kind: 'palm', x: 266, z: 52, s: 6.5 },
];

/** A building's footprint, and its stair tower's (in plan, once turned to face its way). */
export function uspFootprints(b: (typeof USP_BUILDINGS)[number]) {
  const across = b.face === 'n' || b.face === 's';
  const hx = (across ? b.w : b.d) / 2, hz = (across ? b.d : b.w) / 2;
  const body = { x0: b.x - hx, x1: b.x + hx, z0: b.z - hz, z1: b.z + hz };
  // the tower is on the builder's +x end: +x facing n, -x facing s, -z facing w, +z facing e
  const half = b.w / 2;
  const tower = b.face === 'n' ? { x0: b.x + half, x1: b.x + half + 3, z0: b.z - 1.6, z1: b.z + 1.6 }
    : b.face === 's' ? { x0: b.x - half - 3, x1: b.x - half, z0: b.z - 1.6, z1: b.z + 1.6 }
    : b.face === 'w' ? { x0: b.x - 1.6, x1: b.x + 1.6, z0: b.z - half - 3, z1: b.z - half }
    : { x0: b.x - 1.6, x1: b.x + 1.6, z0: b.z + half, z1: b.z + half + 3 };
  return { body, tower };
}

const TEAL = '#1aa0a8';
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/**
 * The small LvTS plaque (logo and number) on a block's front, at ground level on the
 * stretch of wall between a door and the next window in its middle bay (as flats() lays them out).
 */
function blockPlaque(b: { x: number; z: number; face: Face; w: number; d: number }, floor: number): Prim {
  const bays = Math.floor(b.w / 3.6), bw = b.w / bays, lx = -b.w / 2 + bw * (Math.floor(bays / 2) + 0.5);
  const s0 = lx + 1.3, s1 = lx + 2.2, y0 = floor + 1.2, y1 = floor + 1.62;
  const tex = (face: string) => ({ tex: `lvts:${face}` });
  if (b.face === 'n') { const z = b.z - b.d / 2; return box(b.x + s0, y0, z - 0.03, b.x + s1, y1, z, '#ffffff', false, tex('-z')); }
  if (b.face === 's') { const z = b.z + b.d / 2; return box(b.x - s1, y0, z, b.x - s0, y1, z + 0.03, '#ffffff', false, tex('+z')); }
  if (b.face === 'w') { const x = b.x - b.d / 2; return box(x - 0.03, y0, b.z - s1, x, y1, b.z - s0, '#ffffff', false, tex('-x')); }
  const x = b.x + b.d / 2;
  return box(x, y0, b.z + s0, x + 0.03, y1, b.z + s1, '#ffffff', false, tex('+x'));
}

/** The campus's rooms, barriers and props, on ground at height `y` (the road); `heightAt` for the blocks on the slope. */
export function uspCampus(y: number, heightAt: (x: number, z: number) => number): { rooms: Room[]; barriers: Barrier[]; props: Prim[] } {
  const props: Prim[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };
  const sign = USP_SIGN;

  // an LvTS plaque on every USP block (the ones on the slope stand on their highest ground, as the engine sets them)
  for (const b of USP_BUILDINGS) add(blockPlaque(b, y));
  for (const b of USP_NORTH) {
    const f = uspFootprints(b).body;
    const hi = Math.max(heightAt(f.x0, f.z0), heightAt(f.x1, f.z0), heightAt(f.x0, f.z1), heightAt(f.x1, f.z1), heightAt(b.x, b.z));
    add(blockPlaque(b, hi));
  }

  // the entrance sign's plinth (the sign itself is raiwaiPlan.ts SIGNS), facing the road
  add(box(sign.x - 0.45, y, sign.z - 2.8, sign.x + 0.45, y + 3.6, sign.z + 2.8, 'transparent', true));
  // kerbs along the drive
  add(box(DRIVE.x0, y, DRIVE.z1 - 0.1, DRIVE.x1, y + 0.12, DRIVE.z1 + 0.1, '#c9c4b6'));

  // the plaza: a planter with a palm, a shade shelter with benches, lamp posts at the corners
  add(cyl(246, y, 34, 1.8, 0.5, '#b9b6ae', true, 20), cyl(246, y + 0.5, 34, 1.6, 0.04, '#5b4a3a', false, 20));
  const bench = (x: number, z: number, alongX: boolean) => {
    const [hx, hz] = alongX ? [0.9, 0.22] : [0.22, 0.9];
    add(box(x - hx, y + 0.42, z - hz, x + hx, y + 0.47, z + hz, '#a0703f', true));
    add(alongX ? box(x - hx, y + 0.47, z + hz - 0.05, x + hx, y + 0.85, z + hz, '#a0703f') : box(x + hx - 0.05, y + 0.47, z - hz, x + hx, y + 0.85, z + hz, '#a0703f'));
    for (const s of [-1, 1]) add(alongX ? box(x + s * (hx - 0.1) - 0.04, y, z - hz, x + s * (hx - 0.1) + 0.04, y + 0.42, z + hz, '#3b3f44') : box(x - hx, y, z + s * (hz - 0.1) - 0.04, x + hx, y + 0.42, z + s * (hz - 0.1) + 0.04, '#3b3f44'));
  };
  bench(249.8, 34, false); bench(242.2, 34, false);                 // either side of the planter
  // the shelter: open sides, four posts, a teal-edged roof
  const sx0 = 237.5, sx1 = 243.5, sz0 = 36.5, sz1 = 42.5;
  for (const [px, pz] of [[sx0 + 0.3, sz0 + 0.3], [sx1 - 0.3, sz0 + 0.3], [sx0 + 0.3, sz1 - 0.3], [sx1 - 0.3, sz1 - 0.3]]) add(cyl(px, y, pz, 0.1, 2.75, '#f4f3ef', true, 10));
  add(
    box(sx0 - 0.4, y + 2.75, sz0 - 0.4, sx1 + 0.4, y + 2.95, sz1 + 0.4, TEAL),
    box(sx0 + 0.6, y + 2.95, sz0 + 0.6, sx1 - 0.6, y + 3.4, sz1 - 0.6, '#c9cdd0'),
  );
  bench(240.5, sz0 + 1.4, true); bench(240.5, sz1 - 1.4, true);
  for (const [px, pz] of [[PLAZA.x0 + 0.5, PLAZA.z0 + 0.5], [PLAZA.x1 - 0.5, PLAZA.z0 + 0.5], [PLAZA.x0 + 0.5, PLAZA.z1 - 0.5], [PLAZA.x1 - 0.5, PLAZA.z1 - 0.5]]) {
    add(cyl(px, y, pz, 0.07, 4.2, '#3b3f44', true, 8), box(px - 0.18, y + 4.2, pz - 0.18, px + 0.18, y + 4.35, pz + 0.18, '#3b3f44'), box(px - 0.13, y + 4.05, pz - 0.13, px + 0.13, y + 4.2, pz + 0.13, '#fff3c4', false, { emissive: true }));
  }

  // the covered walkway from the plaza to the block facing it
  const A = USP_BUILDINGS[0], aFront = uspFootprints(A).body.z0;
  for (let z = PLAZA.z1 + 0.4; z < aFront; z += 2) for (const px of [A.x - 2.2, A.x + 2.2]) add(cyl(px, y, z, 0.08, 2.7, '#f4f3ef', true, 8));
  add(box(A.x - 2.6, y + 2.7, PLAZA.z1, A.x + 2.6, y + 2.85, aFront, TEAL), box(A.x - 2.5, y + 2.85, PLAZA.z1 + 0.1, A.x + 2.5, y + 2.9, aFront - 0.1, '#c9cdd0'));

  // tree trunks are solid
  for (const t of USP_TREES) { const r = t.kind === 'mango' ? 0.35 : 0.2; add(box(t.x - r, y, t.z - r, t.x + r, y + 2.5, t.z + r, 'transparent', true)); }

  const low = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'low', h: 0.9, t: 0.2, mode: 'explore' });
  const wall = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'facade', h: 3, t: 0.12, mode: 'explore' });
  const rect = (r: { x0: number; x1: number; z0: number; z1: number }) => [
    wall([r.x0, r.z0], [r.x1, r.z0]), wall([r.x0, r.z1], [r.x1, r.z1]), wall([r.x0, r.z0], [r.x0, r.z1]), wall([r.x1, r.z0], [r.x1, r.z1]),
  ];
  const barriers: Barrier[] = [
    // a low wall round the grounds, open only where the road comes in (z 22.3–31.6 on the west side)
    low([USP.x0, USP.z0], [USP.x1, USP.z0]), low([USP.x1, USP.z0], [USP.x1, USP.z1]),
    low([USP.x0, USP.z1], [USP.x1, USP.z1]), low([USP.x0, 31.6], [USP.x0, USP.z1]),
    // the buildings: walk round them, not through them
    ...USP_BUILDINGS.flatMap((b) => { const f = uspFootprints(b); return [...rect(f.body), ...rect(f.tower)]; }),
  ];

  const A_PATH = { x0: A.x - 2, x1: A.x + 2, z0: PLAZA.z1, z1: aFront };
  const B = USP_BUILDINGS[1], bFront = uspFootprints(B).body.x0;
  const B_PATH = { x0: PLAZA.x1, x1: bFront, z0: B.z - 2, z1: B.z + 2 };
  const area = { ceiling: false, outside: true, ground: true, explore: true } as const;
  const rooms: Room[] = [
    { id: 'uspdrive', name: 'USP campus', ...DRIVE, floor: 'road', ...area },
    { id: 'uspwalk', name: 'USP campus', ...WALK, floor: 'concrete', ...area },
    { id: 'uspplaza', name: 'USP campus', ...PLAZA, floor: 'concrete', ...area },
    { id: 'usppath1', name: 'USP campus', ...A_PATH, floor: 'concrete', ...area },
    { id: 'usppath2', name: 'USP campus', ...B_PATH, floor: 'concrete', ...area },
    // the lawns: everything else inside the wall (after the paths, so they win where they overlap)
    { id: 'usp', name: 'USP campus', x0: USP.x0, x1: USP.x1, z0: USP.z0, z1: USP.z1, floor: 'grass', ...area, area: true },
  ];

  return { rooms, barriers, props };
}
