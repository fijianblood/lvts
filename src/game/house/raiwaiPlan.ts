// Where everything in Raiwai goes (plain data, no 3D): McFarlane Road runs past
// the front gate along x; the side road climbs north beside the neighbours to
// the east (+x). To the right as you come out of the gate (west), on the
// house's side of the road, the Howell Road Hindu Temple. From the gate, the Methodist Church, the pool, the teal
// building and the Lomaiviti Training Ground are to the left, along the road
// to the east, with the Raiwai Jame Masjid after the training ground on the
// same side; the commercial sheds and the sea are beyond them to the south.
// Garden City (gardenCity.ts) is after Sardaar Complex in the row of shops.
//
// The houses are Raiwai-style but made up from a seed: they aren't copies of
// anyone's real home. Public places are modelled on drone photos of the area.
import { MCFARLANE, SIDE_ROAD, NEIGHBOURS, MASJID, TEMPLE } from './layout.ts';
import { SHOP_ROW } from './shops.ts';
import { GARDEN_CITY } from './gardenCity.ts';
import { USP, USP_BUILDINGS, USP_NORTH, USP_TREES, USP_SIGN } from './uspCampus.ts';
import { DAMODAR_CITY, DAMODAR_PALMS } from './damodarCity.ts';
import { LOOKOUT, LOOKOUT_PATH, climbBox } from './towers.ts';

export interface HouseSpec {
  w: number;
  d: number;
  storeys: 1 | 2;
  wall: string;
  roof: string;
  roofStyle: 'gable' | 'hip' | 'skillion' | 'flat';
  /** Floor raised on a concrete base this high (m) above the highest ground under it. */
  base?: number;
  trim?: string;
  veranda?: boolean;
  carport?: boolean;
  tank?: boolean;
  dish?: boolean;
  /** Far away: plain windows, no extras (cheaper to draw). */
  simple?: boolean;
  seed?: number;
}

/** Colours from the drone photos. */
export const PALETTE = {
  walls: ['#f4f2ec', '#efe7d3', '#cfe3f3', '#5b8fd6', '#5fc6c9', '#f2df8a', '#8a7fd6', '#f0c9c9', '#e9e9e4', '#b9d7c8'],
  roofs: ['#c3c8cb', '#b4babd', '#3f73bf', '#3c7f5d', '#9c3d30', '#d6d4ce', '#6e7a84', '#c3c8cb'],
};

export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** A made-up Raiwai house from a seed: size, one or two storeys, colours, roof and extras. */
export function houseSpec(seed: number, simple = false): HouseSpec {
  const r = rng(seed);
  const two = r() < 0.35;
  return {
    w: 7 + r() * 5, d: 6 + r() * 3.5, storeys: two ? 2 : 1,
    wall: PALETTE.walls[Math.floor(r() * PALETTE.walls.length)],
    roof: PALETTE.roofs[Math.floor(r() * PALETTE.roofs.length)],
    roofStyle: two ? (r() < 0.5 ? 'flat' : 'hip') : (['gable', 'hip', 'skillion', 'gable'] as const)[Math.floor(r() * 4)],
    base: 0.25 + r() * 0.4,
    veranda: !simple && r() < 0.45, carport: !simple && r() < 0.3, tank: !simple && r() < 0.4, dish: !simple && r() < 0.35,
    simple, seed,
  };
}

/** Which way a thing's front faces: n = toward -z, s = +z (McFarlane Road from the north side), e = +x, w = -x. */
export type Face = 'n' | 's' | 'e' | 'w';
export const FACE_ANGLE: Record<Face, number> = { n: 0, s: Math.PI, e: -Math.PI / 2, w: Math.PI / 2 };

export type PlanKind = 'house' | 'flats' | 'campus' | 'tower' | 'church' | 'pool' | 'teal' | 'field' | 'masjid' | 'temple' | 'shed' | 'arena' | 'floodlight';
export interface PlanItem {
  kind: PlanKind;
  x: number;
  z: number;
  face: Face;
  /** Footprint: w across the front, d deep. */
  w: number;
  d: number;
  /** Only shown when exploring (far away). Near things also show from the compound in the hunt. */
  far?: boolean;
  spec?: HouseSpec;
  floors?: number;
  roof?: string;
  /** Shown on the big map. */
  label?: string;
}

/** The footprint in plan once it's turned to face its way. */
export function footprint(it: Pick<PlanItem, 'x' | 'z' | 'w' | 'd' | 'face'>) {
  const across = it.face === 'n' || it.face === 's';
  const hx = (across ? it.w : it.d) / 2, hz = (across ? it.d : it.w) / 2;
  return { x0: it.x - hx, x1: it.x + hx, z0: it.z - hz, z1: it.z + hz };
}
type Box = ReturnType<typeof footprint>;
const overlaps = (a: Box, b: Box, pad = 0) => a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.z0 < b.z1 + pad && a.z1 > b.z0 - pad;

// ── the landmarks ──────────────────────────────────────────────────────────
export const LANDMARKS: PlanItem[] = [
  // to the right out of the gate (west), on the house's side: the Howell Road Hindu Temple, its gate on the road
  { kind: 'temple', x: TEMPLE.x, z: TEMPLE.z, face: 's', w: TEMPLE.w, d: TEMPLE.d, label: 'Howell Road Hindu Temple' },
  // north side of McFarlane Road, east of the side road
  { kind: 'house', x: 47.5, z: 13.5, face: 's', w: 10, d: 10, spec: { w: 10, d: 10, storeys: 2, wall: '#f1f0ea', roof: '#b4babd', roofStyle: 'hip', base: 0.3, seed: 501 } },
  { kind: 'church', x: 103, z: -17, face: 's', w: 18, d: 26, label: 'Methodist Church' },
  { kind: 'house', x: 127, z: 11, face: 's', w: 18, d: 12, label: undefined, spec: { w: 18, d: 12, storeys: 2, wall: '#3f78c2', roof: '#c9cdd0', roofStyle: 'hip', base: 0.3, veranda: true, seed: 502 } },
  // across the road: the pool, the teal building, the training ground
  { kind: 'pool', x: 87, z: 45, face: 'n', w: 34, d: 22, label: 'Pool' },
  { kind: 'teal', x: 111.5, z: 38.6, face: 'n', w: 9, d: 7 },
  { kind: 'field', x: 158, z: 61, face: 'n', w: 72, d: 50, label: 'Lomaiviti Training Ground' },
  // and after the training ground, on the same side: the Raiwai Jame Masjid
  { kind: 'masjid', x: MASJID.x, z: MASJID.z, face: 'n', w: MASJID.w, d: MASJID.d, label: 'Raiwai Jame Masjid' },
  // the University of the South Pacific: blocks along the north side of the road, and the campus you can
  // walk round where McFarlane Road ends (uspCampus.ts), with a taller block behind its north wall
  ...USP_NORTH.map((b): PlanItem => ({ kind: 'campus', ...b, far: true })),
  ...USP_BUILDINGS.map((b): PlanItem => ({ kind: 'campus', ...b, far: true })),
];

/** Signs by the road (a logo makes it a big entrance sign). */
export interface Sign { x: number; z: number; face: Face; title: string; sub: string; color: string; logo?: string; bg?: string }
export const SIGNS: Sign[] = [
  { x: 103, z: 20.6, face: 's', title: 'METHODIST CHURCH', sub: 'Raiwai', color: '#7f1d1d' },
  { x: 125, z: 33.4, face: 'n', title: 'LOMAIVITI', sub: 'Training Ground', color: '#14532d' },
  // where McFarlane Road ends to the east: the way into the university
  { x: USP_SIGN.x, z: USP_SIGN.z, face: 'w', title: 'USP', sub: 'The University of the South Pacific', color: '#1aa0a8', logo: 'usp.png', bg: '#ffffff' },
];

/** Big-map labels for the roads. */
export const ROAD_LABELS = [
  { text: 'McFarlane Road', x: -30, z: 25.8 },
  { text: 'McFarlane Road', x: 70, z: 25.8 },
  { text: 'McFarlane Road', x: 170, z: 25.8 },
  ...(GARDEN_CITY ? [{ text: 'Garden City', x: (GARDEN_CITY.x0 + GARDEN_CITY.x1) / 2, z: 37 }] : []),
  { text: 'USP', x: 246, z: 29.5 },
  ...(DAMODAR_CITY ? [{ text: 'Damodar City', x: (DAMODAR_CITY.in0 + DAMODAR_CITY.in1) / 2, z: 47 }] : []),
  { text: 'Side road', x: (SIDE_ROAD.x0 + SIDE_ROAD.x1) / 2, z: -14, vertical: true },
];

// ── the houses, both sides of the roads ───────────────────────────────────
const items: PlanItem[] = [...LANDMARKS];
const taken: Box[] = [
  ...items.map(footprint),
  ...NEIGHBOURS.map((n) => ({ x0: n.x0, x1: n.x1, z0: n.z0, z1: n.z1 })),
  { x0: -3.2, x1: 16.2, z0: -14.5, z1: 22.3 },                               // the compound
  { x0: SHOP_ROW.x0 - 0.5, x1: SHOP_ROW.x1 + 0.5, z0: 31.6, z1: 46 },       // the shops (and their yards behind)
  ...(GARDEN_CITY ? [{ x0: GARDEN_CITY.x0 - 0.5, x1: GARDEN_CITY.x1 + 0.5, z0: 31.6, z1: GARDEN_CITY.z1 + 1 }] : []),   // Garden City, back to its rear wall
  { x0: MASJID.x - MASJID.w / 2, x1: MASJID.x + MASJID.w / 2, z0: 31.0, z1: MASJID.z + MASJID.d / 2 },    // the masjid and its steps
  { x0: USP.x0, x1: USP.x1, z0: USP.z0, z1: USP.z1 },                                                      // the USP campus grounds
  ...(DAMODAR_CITY ? [{ x0: DAMODAR_CITY.x0 - 0.5, x1: DAMODAR_CITY.x1 + 0.5, z0: 31.6, z1: DAMODAR_CITY.z1 + 1 }] : []),   // Damodar City
  { x0: SIDE_ROAD.x0 - 0.5, x1: SIDE_ROAD.x1 + 0.5, z0: SIDE_ROAD.z0 - 1, z1: 22.5 },
  { x0: 92, x1: 114, z0: -34, z1: 22 },                                      // the church grounds
];

let seed = 1000;
function place(x: number, z: number, face: Face, far: boolean, wantSpec?: HouseSpec): PlanItem | null {
  const spec = wantSpec ?? houseSpec(seed++, far);
  const it: PlanItem = { kind: 'house', x, z, face, w: spec.w, d: spec.d, spec, far };
  // put the front on the given line: x/z is where the front's middle should be
  if (face === 's') it.z = z - spec.d / 2;
  if (face === 'n') it.z = z + spec.d / 2;
  if (face === 'e') it.x = x - spec.d / 2;
  if (face === 'w') it.x = x + spec.d / 2;
  const fp = footprint(it);
  if (taken.some((t) => overlaps(fp, t, 1.2))) return null;
  taken.push(fp);
  items.push(it);
  return it;
}

/** A row of houses along a line, fronts on the line, from a to b (along x or z). */
function row(line: number, from: number, to: number, face: Face, far = false) {
  const r = rng(Math.round(line * 7 + from * 3));
  let at = from;
  while (at < to) {
    const spec = houseSpec(seed++, far);
    const across = face === 'n' || face === 's';
    const mid = at + spec.w / 2;
    if (mid + spec.w / 2 > to) break;
    const jitter = (r() - 0.5) * 2.5;
    if (across) place(mid, line + (face === 's' ? -jitter : jitter), face, far, spec);
    else place(line + (face === 'e' ? -jitter : jitter), mid, face, far, spec);
    at += spec.w + 3 + r() * 4;
  }
}

// McFarlane Road, north side (fronts face the road), and on past the walkable ends
row(18.6, MCFARLANE.x0 - 40, -15, 's', false);
row(18.6, 40.5, MCFARLANE.x1 + 40, 's', false);
// south side, fronts behind the low wall across the road
row(33.8, MCFARLANE.x0 - 40, SHOP_ROW.x0 - 1.5, 'n', false);
row(33.8, SHOP_ROW.x1 + 1.5, 69, 'n', false);
// the side road: west side faces east, east side faces west
row(SIDE_ROAD.x0 - 1.4, SIDE_ROAD.z0 + 2, -8.5, 'e', false);
row(SIDE_ROAD.x1 + 1.4, SIDE_ROAD.z0 + 2, 6, 'w', false);
// blocks of flats and the tall apartment block on the hill
for (const f of [
  { x: -52, z: 64, floors: 4, w: 18 }, { x: -36, z: 76, floors: 3, w: 16 }, { x: 72, z: -72, floors: 3, w: 18 },
  { x: -88, z: 50, floors: 3, w: 16 },
]) {
  const it: PlanItem = { kind: 'flats', x: f.x, z: f.z, face: f.z > 22 ? 'n' : 's', w: f.w, d: 9, floors: f.floors, far: true };
  const fp = footprint(it);
  if (!taken.some((t) => overlaps(fp, t, 0.5))) { items.push(it); taken.push(fp); }
}
{
  const tower: PlanItem = { kind: 'tower', x: -130, z: -112, face: 's', w: 16, d: 12, floors: 6, far: true };
  items.push(tower); taken.push(footprint(tower));
}

// further back: up the hill to the north, and the streets to the south (seen from the roads)
for (const z of [-52, -66, -80, -94, -108]) row(z, -120, 240, 's', true);
for (const z of [46, 60, 74, 88]) row(z, -120, 66, 'n', true);
row(46, 196, 250, 'n', true);
row(98, 60, 250, 'n', true);

// the commercial sheds beyond the training ground, toward the sea
for (const [x, z, w, d, roof] of [
  [60, 128, 34, 18, '#3d6fc4'], [112, 132, 40, 20, '#3d6fc4'], [162, 124, 30, 16, '#aab0b4'], [214, 136, 36, 18, '#3d6fc4'],
  [18, 152, 28, 14, '#aab0b4'], [80, 172, 44, 22, '#3d6fc4'], [150, 176, 38, 18, '#3d6fc4'], [226, 182, 30, 16, '#aab0b4'],
  [118, 212, 34, 18, '#3d6fc4'], [190, 222, 40, 18, '#aab0b4'],
] as const) items.push({ kind: 'shed', x, z, face: 'n', w, d, roof, far: true });

// the arena and the stadium lights by the sea
items.push({ kind: 'arena', x: 262, z: 236, face: 'n', w: 70, d: 70, far: true });
for (const [x, z] of [[176, 214], [228, 206], [182, 262], [232, 258]]) items.push({ kind: 'floodlight', x, z, face: 'n', w: 2, d: 2, far: true });

export const PLAN: PlanItem[] = items;

// ── trees, power poles ─────────────────────────────────────────────────────
export interface TreeSpot { kind: 'mango' | 'palm' | 'bougainvillea' | 'breadfruit'; x: number; z: number; s: number; far?: boolean }
export const RAIWAI_TREES: TreeSpot[] = [];
{
  const r = rng(77);
  const free = (x: number, z: number, pad: number) => !taken.some((t) => x > t.x0 - pad && x < t.x1 + pad && z > t.z0 - pad && z < t.z1 + pad);
  const tryTree = (x: number, z: number, far: boolean) => {
    const pick = r();
    const kind = pick < 0.45 ? 'mango' : pick < 0.75 ? 'palm' : pick < 0.88 ? 'breadfruit' : 'bougainvillea';
    const pad = kind === 'mango' ? 3 : 1.2;
    if (!free(x, z, pad)) return;
    if (z > 21.6 && z < 33) return;                                         // never on the road or footpath
    if (x > SIDE_ROAD.x0 - 0.8 && x < SIDE_ROAD.x1 + 0.8 && z > SIDE_ROAD.z0 - 1 && z < 22.5) return;
    RAIWAI_TREES.push({ kind, x, z, s: kind === 'mango' ? 0.8 + r() * 0.5 : kind === 'palm' ? 5 + r() * 2.5 : 0.8 + r() * 0.5, far });
  };
  // the tall coconut palm behind the masjid, and the USP campus's trees
  RAIWAI_TREES.push({ kind: 'palm', x: MASJID.x + 5.5, z: MASJID.z + 6, s: 7.5 });
  for (const t of USP_TREES) RAIWAI_TREES.push({ ...t, far: true });
  for (const t of DAMODAR_PALMS) RAIWAI_TREES.push({ kind: 'palm', ...t });
  for (let i = 0; i < 260; i++) {
    const x = -110 + r() * 340, z = -110 + r() * 200;
    tryTree(x, z, !(z > 0 && z < 45 && x > -70 && x < 170) && !(x > 25 && x < 50 && z > -45));
  }
}

// the Raiwai Lookout and the way over to it from the footpath stay clear of trees
{
  const t = climbBox(LOOKOUT, 1.5), path = { x0: LOOKOUT_PATH.x0 - 1, x1: LOOKOUT_PATH.x1 + 1, z0: 31, z1: t.z0 };
  const clear = (x: number, z: number) => !(x > t.x0 && x < t.x1 && z > t.z0 && z < t.z1) && !(x > path.x0 && x < path.x1 && z > path.z0 && z < path.z1);
  for (let i = RAIWAI_TREES.length - 1; i >= 0; i--) if (!clear(RAIWAI_TREES[i].x, RAIWAI_TREES[i].z)) RAIWAI_TREES.splice(i, 1);
}

/** Wooden power poles: along the north verge of McFarlane Road and the east side of the side road. Each run is wired. */
export const POLE_RUNS: [number, number][][] = [
  Array.from({ length: 10 }, (_, i) => -58 + i * 28).filter((x) => !(x > 8 && x < 20) && !(x > 31 && x < 43)).map((x): [number, number] => [x, 21.6]),
  Array.from({ length: 4 }, (_, i) => -34 + i * 18).map((z): [number, number] => [SIDE_ROAD.x1 + 0.6, z]),
];
