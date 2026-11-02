// Garden City: the new shopping complex after Sardaar Complex, set back behind
// its own car park. The shops are coming soon, but it's open to visitors: in
// through the open gate past the "Garden City" sign, across the car park (the
// builders have fenced off a corner with red water barriers), and into the
// ground-floor units, where their things are lying about. The second unit is
// already open: a Westpac bank. In the last unit, stairs go up the east wall to
// the first floor: a corridor along the front windows, and four more units
// still waiting for their shops.
//
// The first floor is an upper floor (layout.ts UPPER_FLOORS) over the shops:
// its walls start at its floor (`bottom`), so downstairs you walk under them,
// and the walls between the shops below stop at its slab (`top`), so upstairs
// you walk over them.
//
// Pure data, no three.js: layout.ts adds the rooms, barriers, props, parked
// cars, stairs and floors; the engine draws the props (the signs are textures
// named in `tex`).
import type { Prim, Barrier, Room, Parked, Door, Platform, Ramp, XZ } from './layout.ts';
import { SHOP_FRONTS } from './shops.ts';
import { lvtsPlaque } from './shopInsides.ts';

const HALF_PI = Math.PI / 2;

const front = SHOP_FRONTS.find((f) => f.id === 'garden-city');

/** The plot, in plan: the fence on the shop line, the car park, the covered walkway, then the building. */
export const GARDEN_CITY = front ? {
  x0: front.x0, x1: front.x1,
  /** The front fence, on the shop line (neighbourhood.ts SHOP_LINE). */
  z0: 31.6,
  /** The covered walkway starts here, the building here, and its back wall here. */
  walk: 44, build: 46, z1: 56,
  /** The gateway between the two gate pillars. */
  gate: [front.x0 + 9.2, front.x0 + 14.8] as XZ,
  units: 5,
  /** The unit that's already open: Westpac (0-based, from the west). */
  westpac: 1,
} : null;

const BLACK = '#1d1f22';
const PILLAR = '#8f9291';
const BLOCK = '#b3b1aa';
const LINE = '#f1f1ec';
const PANEL = '#eef1f3';
const MARK = '#5fa8d8';
const RED = '#d63a2f';
const TIMBER = '#b98b55';
const STEEL = '#9aa3aa';
/** Upstairs: its walls (rendered outside), the stairs' treads and their edges. */
const UPPER_WALL = '#e3e5e6';
const TREAD = '#bdb9b0';
const TREAD_EDGE = '#8f8a80';

/** Boxes are plain (sharp edges): a building site needs no rounded furniture edges, and it keeps the triangle count down. */
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/** The first floor: its height above the car park, how far back its corridor runs (the units' fronts), its ceiling. */
export const GC_UPPER = { rise: 3.8, corridor: 48.6, ceiling: 7.0 };
/** The stairs, up the east wall of the last unit: x from its wall to the building's side wall, z from the bottom tread to the landing at the top. */
export const GC_STAIRS = { x0: 66.2, z0: 46.6, z1: 54.0 };

/** Garden City's rooms, barriers, props and parked cars, on ground at height `y` (the road), and its stairs and first floor. */
export function gardenCity(y: number): { rooms: Room[]; barriers: Barrier[]; props: Prim[]; parked: Parked[]; doors: Door[]; ramps: Ramp[]; platforms: Platform[]; upper: Platform[] } {
  const P = GARDEN_CITY;
  if (!P) return { rooms: [], barriers: [], props: [], parked: [], doors: [], ramps: [], platforms: [], upper: [] };
  const { x0, x1, z0: F, walk: W, build: Bf, z1: Bk } = P;
  const [g0, g1] = P.gate;
  const uw = (x1 - x0) / P.units;
  const ux = (k: number) => x0 + k * uw;
  const UP = y + GC_UPPER.rise, UZ = GC_UPPER.corridor, ROOF = y + GC_UPPER.ceiling;
  const { x0: LX, z0: SZ0, z1: SZ1 } = GC_STAIRS;
  const SX1 = x1 - 0.2;                        // the stairs run up against the side wall
  const lobby = P.units - 1;                   // the last unit: the stairs, and the way up
  const props: Prim[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };

  // ── the front: iron palisade on grey pillars with lanterns, the sign, the open gates ──
  add(box(x0, y, F - 0.12, g0, y + 0.2, F + 0.12, '#b9b6ae'), box(g1, y, F - 0.12, x1, y + 0.2, F + 0.12, '#b9b6ae'));
  for (const px of [x0 + 0.3, x0 + 5.3, g0 - 0.3, g1 + 0.3, x1 - 5.3, x1 - 0.3]) {
    add(
      box(px - 0.3, y, F - 0.3, px + 0.3, y + 2.6, F + 0.3, PILLAR, true),
      box(px - 0.36, y + 2.6, F - 0.36, px + 0.36, y + 2.72, F + 0.36, '#7e8180'),
      cyl(px, y + 2.72, F, 0.05, 0.25, BLACK, false, 8),
      box(px - 0.16, y + 2.97, F - 0.16, px + 0.16, y + 3.37, F + 0.16, BLACK),
      box(px - 0.12, y + 3.0, F - 0.17, px + 0.12, y + 3.32, F + 0.17, '#fff3c4', false, { emissive: true }),
      box(px - 0.2, y + 3.37, F - 0.2, px + 0.2, y + 3.45, F + 0.2, BLACK),
    );
  }
  /** Iron bars with spear tops along a straight line (along x or z), with two rails. */
  const palisade = (a: XZ, b: XZ, base = y + 0.2) => {
    const alongX = a[1] === b[1];
    const len = alongX ? b[0] - a[0] : b[1] - a[1];
    const n = Math.max(1, Math.round(len / 0.16));
    for (let i = 0; i <= n; i++) {
      const x = alongX ? a[0] + (len * i) / n : a[0], z = alongX ? a[1] : a[1] + (len * i) / n;
      add(cyl(x, base, z, 0.018, 1.8, BLACK, false, 4), cyl(x, base + 1.8, z, 0.035, 0.14, BLACK, false, 4, 0));
    }
    for (const h of [0.25, 1.55]) add(alongX ? box(a[0], base + h, a[1] - 0.025, b[0], base + h + 0.05, a[1] + 0.025, BLACK) : box(a[0] - 0.025, base + h, a[1], a[0] + 0.025, base + h + 0.05, b[1], BLACK));
  };
  palisade([x0 + 0.6, F], [x0 + 5.0, F]);
  palisade([g1 + 0.6, F], [x1 - 5.6, F]);
  palisade([x1 - 5.0, F], [x1 - 0.6, F]);
  palisade([x0, F + 0.3], [x0, Bf]);
  palisade([x1, F + 0.3], [x1, Bf]);
  // the sign between the pillars, left of the gate: "Garden City" over a board of shops still to come
  add(
    box(x0 + 5.75, y, F - 0.08, x0 + 8.45, y + 2.45, F + 0.08, '#5b6066', true, { tex: 'gcboard:-z' }),
    box(x0 + 5.35, y + 2.5, F - 0.12, x0 + 8.85, y + 3.4, F + 0.12, '#f7f7f4', false, { tex: 'gcsign:-z' }),
  );
  // the gates: a pair of iron leaves between the gate pillars, standing open (E shuts them; they swing into the car park)
  const gw = (g1 - g0) / 2;
  const doors: Door[] = [
    { kind: 'hinged', id: 'gc-gate-l', label: 'Garden City gate', hinge: [g0, F], width: gw, closed: 0, swing: HALF_PI, color: BLACK, exterior: true, style: 'bars', height: 1.8, base: y, pair: 'gc-gate-r', startOpen: true },
    { kind: 'hinged', id: 'gc-gate-r', label: 'Garden City gate', hinge: [g1, F], width: gw, closed: Math.PI, swing: -HALF_PI, color: BLACK, exterior: true, style: 'bars', height: 1.8, base: y, pair: 'gc-gate-l', startOpen: true },
  ];
  // a sign inside the gate, and a potted palm in each front corner
  add(
    box(g1 + 1.0, y + 0.9, F + 1.4, g1 + 2.2, y + 1.7, F + 1.45, '#f6c21c', false, { tex: 'gcbuild:-z' }),
    box(g1 + 1.05, y, F + 1.45, g1 + 1.1, y + 0.9, F + 1.5, '#3b3f44', true), box(g1 + 2.1, y, F + 1.45, g1 + 2.15, y + 0.9, F + 1.5, '#3b3f44', true),
  );
  for (const [px, pz] of [[x0 + 0.9, F + 1.0], [x1 - 0.9, F + 1.0]]) add(cyl(px, y, pz, 0.32, 0.55, '#3c3f42', true, 12), cyl(px, y + 0.55, pz, 0.45, 1.3, '#3f8f3a', false, 7, 0));

  // ── the car park: bays in front of the building, a crossing from the gate, the builders' corner ──
  const bayEnd = 39.2;
  for (const r of [0.6, 3.2, 5.8, 8.4, 15.6, 18.2, 20.8, 23.4]) add(box(x0 + r - 0.05, y + 0.006, bayEnd, x0 + r + 0.05, y + 0.014, W - 0.1, LINE));
  add(box(x0 + 0.6, y + 0.006, bayEnd - 0.1, x0 + 8.4, y + 0.014, bayEnd, LINE), box(x0 + 15.6, y + 0.006, bayEnd - 0.1, x1 - 0.2, y + 0.014, bayEnd, LINE));
  for (let z = bayEnd + 0.4; z < W - 0.3; z += 0.6) add(box(x0 + 9.6, y + 0.006, z, x0 + 14.4, y + 0.014, z + 0.3, LINE));
  // red water barriers round a corner of the car park: a stack of wrapped panels, sand, blocks and a mixer
  const zx0 = x0 + 18.5, zx1 = x1 - 0.15, zz0 = 33.6, zz1 = 38.4;
  const barrier = (bx0: number, bz0: number, bx1: number, bz1: number) => add(
    box(bx0, y, bz0, bx1, y + 0.8, bz1, RED, true),
    box(bx0 - 0.01, y + 0.42, bz0 - 0.01, bx1 + 0.01, y + 0.52, bz1 + 0.01, '#f3f3f1'),
  );
  for (let x = zx0; x < zx1 - 0.2; x += 1.2) { barrier(x, zz0, Math.min(x + 1.15, zx1), zz0 + 0.45); barrier(x, zz1 - 0.45, Math.min(x + 1.15, zx1), zz1); }
  for (let z = zz0 + 0.5; z < zz1 - 0.5; z += 1.2) barrier(zx0, z, zx0 + 0.45, Math.min(z + 1.15, zz1 - 0.5));
  add(
    box(zx0 + 0.8, y, zz0 + 0.9, zx0 + 3.3, y + 0.9, zz0 + 2.2, PANEL, true),                        // panels lying in a stack
    ...[0.2, 1.0, 1.8].map((d) => box(zx0 + 0.8 + d, y + 0.3, zz0 + 0.895, zx0 + 1.3 + d, y + 0.6, zz0 + 0.9, MARK)),
    box(zx1 - 0.55, y, zz0 + 0.8, zx1 - 0.25, y + 2.4, zz0 + 3.6, PANEL, true),                      // and standing against the fence
    ...[1.1, 2.4].map((d) => box(zx1 - 0.555, y + 1.0, zz0 + 0.8 + d - 0.25, zx1 - 0.55, y + 1.5, zz0 + 0.8 + d + 0.25, MARK)),
    cyl(zx0 + 4.8, y, zz0 + 3.0, 1.0, 0.75, '#cdb27a', true, 10, 0.05),                               // sand
    box(zx0 + 0.9, y, zz1 - 1.8, zx0 + 2.1, y + 0.12, zz1 - 0.8, '#9b7a52', true),                    // a pallet of blocks
    box(zx0 + 0.95, y + 0.12, zz1 - 1.75, zx0 + 2.05, y + 0.72, zz1 - 0.85, '#a8a7a1', true),
    box(zx0 + 3.1, y, zz1 - 1.55, zx0 + 3.9, y + 0.5, zz1 - 1.05, '#3b3f44', true),                   // the mixer
    { kind: 'cyl', base: [zx0 + 3.5, y + 0.9, zz1 - 1.3], r: 0.45, h: 0.9, color: '#e2762b', axis: 'x', top: 0.3 },
  );

  // ── the building: two storeys, the ground floor still bare, the upstairs windows half done ──
  const FZ = Bf + 0.4, FZ1 = Bf + 0.54;   // the upstairs front wall, over the columns
  add(
    // the first-floor slab and the canopy over the walkway, open over the stairs
    box(x0, y + 3.5, W, LX, y + 3.8, Bk, '#c9c6bf'),
    box(LX, y + 3.5, W, x1, y + 3.8, SZ0, '#c9c6bf'),
    box(LX, y + 3.5, SZ1, x1, y + 3.8, Bk, '#c9c6bf'),                            // (under the landing at the top)
    box(x0, y + 3.4, W - 0.05, x1, y + 3.9, W + 0.15, '#f2f3f1'),                  // the canopy's edge
    box(x0 - 0.1, ROOF, Bf + 0.2, x1 + 0.1, y + 7.6, Bk + 0.1, '#f2f3f1'),        // roof and parapet (its underside is the ceiling upstairs)
    box(x0 + 3, y + 7.05, Bf + 0.14, x1 - 3, y + 7.55, Bf + 0.2, '#4f9a3a', false, { tex: 'gcbanner:-z' }),
    lvtsPlaque(x1 - 1.4, y + 3.44, W - 0.055),                                    // the LvTS plaque, on the canopy's edge
    box(x0, y, Bf, x0 + 0.2, y + 3.5, Bk, BLOCK), box(x1 - 0.2, y, Bf, x1, y + 3.5, Bk, BLOCK),   // side walls
    box(x0, y, Bk - 0.2, x1, y + 3.5, Bk, BLOCK),                                                 // back wall
    // upstairs: rendered outside, bare plaster inside
    box(x0, UP, FZ, x0 + 0.2, ROOF, Bk, UPPER_WALL), box(x1 - 0.2, UP, FZ, x1, ROOF, Bk, UPPER_WALL),
    box(x0, UP, Bk - 0.2, x1, ROOF, Bk, UPPER_WALL),
    box(x0, UP, FZ, x1, y + 4.5, FZ1, UPPER_WALL), box(x0, y + 6.2, FZ, x1, ROOF, FZ1, UPPER_WALL),   // under and over the windows
  );
  // the upstairs windows: every other one glazed, the rest still open holes you can look out of
  for (let k = 0; k < P.units; k++) {
    const wx0 = ux(k) + 0.6, wx1 = ux(k + 1) - 0.6;
    add(box(wx0 - 0.1, y + 4.42, Bf + 0.28, wx1 + 0.1, y + 4.5, FZ1 + 0.06, '#cfd2d4'));                        // the sill
    if (k % 2) add(box(wx0, y + 4.5, Bf + 0.32, wx1, y + 6.2, FZ, '#2b3a44'));
    else for (const fx of [wx0, wx1 - 0.06]) add(box(fx, y + 4.5, Bf + 0.34, fx + 0.06, y + 6.2, Bf + 0.4, '#cfd2d4'));   // the frame, no glass yet
  }
  for (let k = 0; k <= P.units; k++) add(box(Math.max(x0, ux(k) - 0.6), y + 4.5, FZ, Math.min(x1, ux(k) + 0.6), y + 6.2, FZ1, UPPER_WALL));   // between the windows
  for (let k = 0; k <= P.units; k++) {
    const cx = Math.min(Math.max(ux(k), x0 + 0.25), x1 - 0.25);
    add(box(cx - 0.25, y, Bf, cx + 0.25, y + 3.5, Bf + 0.5, '#5d6268', true));                   // columns along the front
    if (k > 0 && k < P.units) add(box(cx - 0.1, y, Bf + 0.5, cx + 0.1, y + 3.5, Bk - 0.2, BLOCK)); // bare block walls between the units
  }
  // scaffolding up the front, standing on the canopy
  for (let x = x0 + 0.5; x <= x0 + 11; x += 2.6) for (const z of [W + 0.4, Bf - 0.2]) add(cyl(x, y + 3.9, z, 0.03, 4.0, STEEL, false, 6));
  for (const h of [5.3, 7.0]) for (const z of [W + 0.4, Bf - 0.2]) add(box(x0 + 0.5, y + h, z - 0.02, x0 + 10.9, y + h + 0.04, z + 0.02, STEEL));
  add(box(x0 + 0.4, y + 5.34, W + 0.3, x0 + 11.0, y + 5.4, Bf - 0.1, TIMBER));

  // ── inside the units: a "coming soon" board on each back wall and a work light; the builders' things ──
  for (let k = 0; k < P.units; k++) {
    if (k === P.westpac) continue;
    const u = ux(k), mid = u + uw / 2;
    add(
      ...(k === lobby ? [] : [box(u + 1.4, y + 1.5, Bk - 0.26, u + uw - 1.4, y + 2.5, Bk - 0.2, '#ffffff', false, { tex: 'gcsoon:-z' })]),
      cyl(mid, y + 3.38, 51, 0.01, 0.12, BLACK, false, 4),
      box(mid - 0.08, y + 3.2, 50.92, mid + 0.08, y + 3.38, 51.08, '#fff3c4', false, { emissive: true }),
    );
  }
  {
    // 1: a scaffold tower, cement bags, a wheelbarrow
    const u = ux(0);
    for (const [px, pz] of [[u + 0.8, 48.0], [u + 2.4, 48.0], [u + 0.8, 49.6], [u + 2.4, 49.6]]) add(cyl(px, y, pz, 0.03, 3.45, STEEL, true, 6));
    for (const h of [1.7, 3.0]) add(box(u + 0.7, y + h, 47.9, u + 2.5, y + h + 0.05, 49.7, TIMBER));
    for (const z of [48.0, 49.6]) add(box(u + 0.8, y + 0.3, z - 0.02, u + 2.4, y + 0.33, z + 0.02, STEEL));
    for (let i = 0; i < 3; i++) add(box(u + 3.0 + i * 0.62, y, 54.6, u + 3.58 + i * 0.62, y + 0.22, 55.5, '#ddd6c6', true));
    for (let i = 0; i < 2; i++) add(box(u + 3.3 + i * 0.62, y + 0.24, 54.6, u + 3.88 + i * 0.62, y + 0.46, 55.5, '#ddd6c6', true));
    add(
      box(u + 3.2, y + 0.45, 47.9, u + 4.0, y + 0.75, 48.9, '#2f6db5', true),
      { kind: 'cyl', base: [u + 3.6, y + 0.18, 47.75], r: 0.18, h: 0.08, color: BLACK, axis: 'x' },
      box(u + 3.25, y + 0.6, 48.9, u + 3.3, y + 0.65, 49.6, '#5b4a3a'), box(u + 3.9, y + 0.6, 48.9, u + 3.95, y + 0.65, 49.6, '#5b4a3a'),
      box(u + 3.27, y, 48.8, u + 3.31, y + 0.45, 48.84, '#5b4a3a'), box(u + 3.89, y, 48.8, u + 3.93, y + 0.45, 48.84, '#5b4a3a'),
    );
  }
  {
    // 2: Westpac, open for business: a glass front with the door open, the logo over it and on a red back wall,
    // a service counter, two ATMs, chairs to wait on and queue posts
    const u = ux(P.westpac), u1 = u + uw, mid = u + uw / 2, RED_W = '#d5002b', fz = Bf + 0.5;
    add(
      box(u + 0.1, y + 0.002, fz, u1 - 0.1, y + 0.014, Bk - 0.2, '#ecebe8'),                                    // a finished floor
      box(u + 0.1, y, fz, u + 0.14, y + 3.48, Bk - 0.2, '#f4f4f2'), box(u1 - 0.14, y, fz, u1 - 0.1, y + 3.48, Bk - 0.2, '#f4f4f2'),
      box(u + 0.1, y, Bk - 0.24, u1 - 0.1, y + 3.48, Bk - 0.2, RED_W),                                          // red back wall
      box(u + 1.0, y + 2.0, Bk - 0.27, u1 - 1.0, y + 2.9, Bk - 0.24, '#ffffff', false, { tex: 'logo/westpac.png:-z' }),
      // the shopfront: glass either side of an open doorway, a white band with the logo
      box(u + 0.25, y, fz, mid - 0.9, y + 2.7, fz + 0.06, '#bfe0ee', true), box(mid + 0.9, y, fz, u1 - 0.25, y + 2.7, fz + 0.06, '#bfe0ee', true),
      box(mid - 0.9, y + 2.3, fz, mid + 0.9, y + 2.7, fz + 0.06, '#bfe0ee'),                  // over the double glass doors (below)
      box(mid - 0.95, y, fz - 0.02, mid - 0.85, y + 2.7, fz + 0.08, '#3b3f44'), box(mid + 0.85, y, fz - 0.02, mid + 0.95, y + 2.7, fz + 0.08, '#3b3f44'),
      box(u + 0.25, y + 2.7, fz - 0.04, u1 - 0.25, y + 3.48, fz + 0.06, '#ffffff'),
      box(u + 0.6, y + 2.76, fz - 0.07, u1 - 0.6, y + 3.42, fz - 0.04, '#ffffff', false, { tex: 'logo/westpac.png:-z' }),
      box(u + 0.6, y + 3.42, W - 0.09, u1 - 0.6, y + 3.88, W - 0.06, '#ffffff', false, { tex: 'logo/westpac.png:-z' }),   // on the canopy's edge too
      // the counter along the back, with a glass screen
      box(u + 0.6, y, 53.6, u1 - 0.6, y + 1.05, 54.3, '#f4f4f2', true), box(u + 0.6, y + 0.25, 53.58, u1 - 0.6, y + 0.85, 53.6, RED_W),
      box(u + 0.55, y + 1.05, 53.55, u1 - 0.55, y + 1.1, 54.35, '#3b3f44'), box(u + 0.6, y + 1.1, 53.9, u1 - 0.6, y + 1.6, 53.92, '#d6ecf3'),
      box(u + 1.2, y + 1.1, 54.0, u + 1.6, y + 1.38, 54.05, '#1e2a30'), box(u1 - 1.6, y + 1.1, 54.0, u1 - 1.2, y + 1.38, 54.05, '#1e2a30'),
      // two ATMs on the left wall, near the door
      ...[47.3, 48.4].flatMap((z) => [
        box(u + 0.14, y, z, u + 0.6, y + 1.7, z + 0.8, RED_W, true),
        box(u + 0.6, y + 1.05, z + 0.15, u + 0.62, y + 1.4, z + 0.65, '#1e2a30'),
        box(u + 0.6, y + 0.85, z + 0.25, u + 0.66, y + 0.95, z + 0.55, '#9aa0a6'),
      ]),
      // lights
      box(mid - 0.8, y + 3.44, 49.0, mid + 0.8, y + 3.48, 49.4, '#fffdf5', false, { emissive: true }),
      box(mid - 0.8, y + 3.44, 52.0, mid + 0.8, y + 3.48, 52.4, '#fffdf5', false, { emissive: true }),
      // a plant by the door
      cyl(u1 - 0.5, y, fz + 0.5, 0.22, 0.4, '#3c3f42', true, 10), cyl(u1 - 0.5, y + 0.4, fz + 0.5, 0.3, 0.8, '#3f8f3a', false, 7, 0),
    );
    // chairs along the right wall, queue posts with a red belt in front of the counter
    for (const z of [49.4, 50.2, 51.0]) add(box(u1 - 0.65, y + 0.44, z, u1 - 0.2, y + 0.49, z + 0.55, '#3b3f44', true), box(u1 - 0.24, y + 0.49, z, u1 - 0.2, y + 0.95, z + 0.55, '#3b3f44'));
    for (const x of [u + 1.2, mid, u1 - 1.8]) add(cyl(x, y, 52.4, 0.035, 0.95, '#c0c4c8', true, 8), cyl(x, y, 52.4, 0.15, 0.03, '#3b3f44', false, 10));
    doors.push(
      { kind: 'hinged', id: 'gc-westpac-l', label: 'Westpac door', hinge: [mid - 0.9, fz + 0.03], width: 0.9, closed: 0, swing: HALF_PI, color: '#3b3f44', exterior: true, style: 'glass', height: 2.3, base: y, pair: 'gc-westpac-r' },
      { kind: 'hinged', id: 'gc-westpac-r', label: 'Westpac door', hinge: [mid + 0.9, fz + 0.03], width: 0.9, closed: Math.PI, swing: -HALF_PI, color: '#3b3f44', exterior: true, style: 'glass', height: 2.3, base: y, pair: 'gc-westpac-l' },
    );
    add(box(u + 1.2, y + 0.85, 52.39, u1 - 1.8, y + 0.9, 52.41, RED_W));
  }
  {
    // 3 (straight in from the gate): a sign at the door, a ladder, a tarpaulin
    const u = ux(2), mid = u + uw / 2;
    add(
      box(mid - 0.6, y + 0.9, Bf + 1.2, mid + 0.6, y + 1.7, Bf + 1.25, '#f6c21c', false, { tex: 'gcbuild:-z' }),
      box(mid - 0.55, y, Bf + 1.25, mid - 0.5, y + 0.9, Bf + 1.3, '#3b3f44', true), box(mid + 0.5, y, Bf + 1.25, mid + 0.55, y + 0.9, Bf + 1.3, '#3b3f44', true),
      box(u + 0.6, y, Bk - 0.35, u + 0.65, y + 3.2, Bk - 0.3, '#c0c4c8'), box(u + 1.05, y, Bk - 0.35, u + 1.1, y + 3.2, Bk - 0.3, '#c0c4c8'),
      box(u + 3.4, y, 52.0, u + 4.6, y + 0.35, 53.2, '#2d6fb7', true), box(u + 3.6, y + 0.35, 52.3, u + 4.3, y + 0.45, 52.9, '#2d6fb7'),
    );
    for (let h = 0.3; h < 3.1; h += 0.3) add(box(u + 0.6, y + h, Bk - 0.34, u + 1.1, y + h + 0.04, Bk - 0.31, '#c0c4c8'));
  }
  {
    // 4: a block wall half built across the unit, a mortar tub, sand and a shovel
    const u = ux(3);
    add(box(u + 0.3, y, 51.0, u + uw - 1.6, y + 1.2, 51.2, '#a9a8a2', true));
    for (let h = 0.2; h < 1.2; h += 0.2) add(box(u + 0.3, y + h, 50.995, u + uw - 1.6, y + h + 0.012, 51.0, '#8e8d87'));
    for (const bx of [0.3, 0.75, 1.2]) add(box(u + bx, y + 1.2, 51.0, u + bx + 0.4, y + 1.4, 51.2, '#a9a8a2'));
    add(
      box(u + uw - 1.2, y, 49.0, u + uw - 0.5, y + 0.3, 49.6, '#2f3237', true),
      cyl(u + 1.2, y, 48.6, 0.8, 0.55, '#cdb27a', true, 10, 0.05),
      box(u + 2.3, y, 48.55, u + 2.55, y + 0.3, 48.58, '#6b7075'), box(u + 2.41, y + 0.3, 48.55, u + 2.44, y + 1.4, 48.58, '#9b7a52'),
    );
  }
  {
    // 5: the way up. Concrete stairs up the east wall to a landing at the top, behind a block wall on
    // their open side (a steel rail along it upstairs, round the stairwell); a sign over the bottom step
    const u = ux(lobby);
    const n = Math.ceil(GC_UPPER.rise / 0.19);
    for (let i = 0; i < n; i++) {
      const s0 = SZ0 + ((SZ1 - SZ0) * i) / n, s1 = SZ0 + ((SZ1 - SZ0) * (i + 1)) / n;
      add(box(LX + 0.06, y, s0, SX1, y + (GC_UPPER.rise * (i + 1)) / n, s1, i % 2 ? TREAD : TREAD_EDGE));   // each step, solid down to the floor
    }
    add(
      box(LX - 0.06, y, Bf + 0.5, LX + 0.06, UP, Bk - 0.2, BLOCK),                                   // the wall along the stairs' open side
      box(LX + 0.1, y + 2.75, Bf - 0.03, SX1 - 0.25, y + 3.3, Bf + 0.03, '#2f6b23', false, { tex: 'gcup:-z' }),   // "First floor", over the bottom step
      box(u + 0.8, y + 1.5, Bk - 0.26, u + 2.8, y + 2.5, Bk - 0.2, '#ffffff', false, { tex: 'gcup:-z' }),        // and on the back wall
    );
    // the handrail on the side wall, following the stairs up
    const rails = 8;
    for (let i = 0; i < rails; i++) {
      const za = SZ0 + ((SZ1 - SZ0) * i) / rails, zb = SZ0 + ((SZ1 - SZ0) * (i + 1)) / rails;
      const ya = y + (GC_UPPER.rise * i) / rails, yb = y + (GC_UPPER.rise * (i + 1)) / rails;
      add(box(SX1 - 0.08, Math.max(ya, yb) + 0.88, za, SX1 - 0.03, Math.max(ya, yb) + 0.93, zb, STEEL));
    }
    // the rail round the stairwell upstairs: posts, a mid rail and a top rail on the wall, and a sign for the way down
    for (let z = Bf + 0.7; z < SZ1; z += 0.6) add(box(LX - 0.03, UP, z - 0.03, LX + 0.03, UP + 1.05, z + 0.03, STEEL));
    add(
      box(LX - 0.04, UP + 1.0, FZ1, LX + 0.04, UP + 1.06, SZ1, STEEL), box(LX - 0.02, UP + 0.5, FZ1, LX + 0.02, UP + 0.54, SZ1, STEEL),
      box(LX - 0.1, UP + 0.45, 50.4, LX - 0.06, UP + 0.95, 51.6, '#2f6b23', false, { tex: 'gcdown:-x' }),
    );
  }

  // ── upstairs: a corridor along the front windows; four units off it still waiting for their shops, and the stairs' lobby ──
  for (let k = 0; k <= P.units; k++) {
    const cx = Math.min(Math.max(ux(k), x0 + 0.2), x1 - 0.2);
    if (k > 0 && k < P.units) add(box(cx - 0.1, UP, UZ, cx + 0.1, ROOF, Bk - 0.2, BLOCK));   // between the units
  }
  for (let k = 0; k < P.units; k++) {
    const u = ux(k), u1 = ux(k + 1), mid = u + uw / 2;
    // the corridor's lights, one outside each unit
    add(box(mid - 0.7, ROOF - 0.05, (FZ1 + UZ) / 2 - 0.15, mid + 0.7, ROOF, (FZ1 + UZ) / 2 + 0.15, '#fffdf5', false, { emissive: true }));
    if (k === lobby) continue;
    // its front onto the corridor: block either side of a doorway, a "coming soon" board over it
    add(
      box(u + 0.1, UP, UZ - 0.08, mid - 0.8, ROOF, UZ + 0.08, BLOCK), box(mid + 0.8, UP, UZ - 0.08, u1 - 0.1, ROOF, UZ + 0.08, BLOCK),
      box(mid - 0.8, UP + 2.4, UZ - 0.08, mid + 0.8, ROOF, UZ + 0.08, BLOCK),
      box(mid - 0.75, UP + 2.48, UZ - 0.11, mid + 0.75, UP + 3.06, UZ - 0.08, '#ffffff', false, { tex: 'gcsoon:-z' }),
      // inside: a bare light, a stack of plasterboard, paint tins
      cyl(mid, ROOF - 0.12, 52.2, 0.01, 0.12, BLACK, false, 4),
      box(mid - 0.08, ROOF - 0.3, 52.12, mid + 0.08, ROOF - 0.12, 52.28, '#fff3c4', false, { emissive: true }),
      box(u + 0.4, UP, Bk - 1.0, u + 2.8, UP + 0.35, Bk - 0.35, PANEL, true),
      ...[0.5, 0.9].map((d) => cyl(u1 - d, UP, Bk - 0.6, 0.15, 0.32, k % 2 ? '#f2f2ee' : '#5fa8d8', true, 10)),
    );
    if (k % 2 === 0) {
      // a stepladder by the side wall
      add(
        box(u + 0.5, UP, 50.2, u + 0.55, UP + 1.8, 50.25, STEEL), box(u + 1.05, UP, 50.2, u + 1.1, UP + 1.8, 50.25, STEEL),
        box(u + 0.5, UP, 50.95, u + 0.55, UP + 1.6, 51.0, STEEL), box(u + 1.05, UP, 50.95, u + 1.1, UP + 1.6, 51.0, STEEL),
        box(u + 0.48, UP, 50.18, u + 1.12, UP + 1.82, 51.02, 'transparent', true),
      );
      for (const h of [0.5, 1.0, 1.5]) add(box(u + 0.55, UP + h, 50.2, u + 1.05, UP + h + 0.04, 50.3, STEEL));
    }
  }
  {
    // the stairs' lobby: a bench to sit on, a pot plant, and a "coming soon" board on its back wall
    const u = ux(lobby);
    add(
      box(u + 0.5, UP + 0.42, 52.4, u + 0.9, UP + 0.47, 54.4, TIMBER, true), box(u + 0.55, UP, 52.5, u + 0.85, UP + 0.42, 52.6, '#3b3f44'),
      box(u + 0.55, UP, 54.2, u + 0.85, UP + 0.42, 54.3, '#3b3f44'),
      cyl(u + 0.7, UP, 49.4, 0.25, 0.45, '#3c3f42', true, 10), cyl(u + 0.7, UP + 0.45, 49.4, 0.34, 0.95, '#3f8f3a', false, 7, 0),
      box(u + 1.0, UP + 1.5, Bk - 0.26, LX - 0.6, UP + 2.5, Bk - 0.2, '#ffffff', false, { tex: 'gcsoon:-z' }),
      cyl(u + 1.8, ROOF - 0.12, 52.2, 0.01, 0.12, BLACK, false, 4),
      box(u + 1.72, ROOF - 0.3, 52.12, u + 1.88, ROOF - 0.12, 52.28, '#fff3c4', false, { emissive: true }),
    );
  }

  // the palisade is drawn as bars and pillars (props); these are its walls, which a jump clears when exploring
  const inv = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'invisible', h: 2, t: 0.12, mode: 'explore', jump: true });
  const wall = (a: XZ, b: XZ, more: Partial<Barrier> = {}): Barrier => ({ a, b, kind: 'facade', h: 3.5, t: 0.2, mode: 'explore', ...more });
  /** Downstairs only: it stops at the first floor's slab, and upstairs you walk over it. */
  const below = { top: y + 3.5 };
  /** Upstairs only: it stands on the first floor, and downstairs you walk under it. */
  const above = { bottom: UP, h: GC_UPPER.ceiling - GC_UPPER.rise };
  const barriers: Barrier[] = [
    inv([x0, F], [g0, F]), inv([g1, F], [x1 + 0.4, F]),          // the front fence, open at the gate
    inv([x0, F], [x0, Bf]), inv([x1, F], [x1, Bf]),              // the side fences
    wall([x0, Bf], [x0, Bk]), wall([x1, Bf], [x1, Bk]), wall([x0, Bk], [x1, Bk]),   // the side and back walls, both floors
    ...Array.from({ length: P.units - 1 }, (_, i) => wall([ux(i + 1), Bf], [ux(i + 1), Bk], below)),
    // the stairs: the wall on their open side, both floors (it's the stairwell's rail upstairs); under the landing at the top
    wall([LX, Bf + 0.4], [LX, SZ1], { t: 0.12 }),
    wall([LX, SZ1], [LX, Bk], { t: 0.12, ...below }),
    // upstairs: the front wall, the walls between the units, and their fronts either side of a doorway
    wall([x0, (FZ + FZ1) / 2], [x1, (FZ + FZ1) / 2], { t: FZ1 - FZ, ...above }),
    ...Array.from({ length: P.units - 1 }, (_, i) => wall([ux(i + 1), UZ], [ux(i + 1), Bk], above)),
    ...Array.from({ length: P.units - 1 }, (_, k) => {
      const mid = ux(k) + uw / 2;
      return [wall([ux(k), UZ], [mid - 0.8, UZ], { t: 0.16, ...above }), wall([mid + 0.8, UZ], [ux(k + 1), UZ], { t: 0.16, ...above })];
    }).flat(),
  ];

  const upstairs = { y: UP, floor: 'concrete', ceiling: false, outside: true, explore: true, cap: ROOF - 0.05 } as const;
  const rooms: Room[] = [
    // (the stairs first: where rooms overlap, the first wins)
    { id: 'gcstairs', name: 'Garden City, the stairs', x0: LX, x1, z0: SZ0, z1: Bk, floor: 'stairs', ceiling: false, outside: true, explore: true, cap: ROOF - 0.05 },
    { id: 'gcpark', name: 'Garden City', x0, x1, z0: F, z1: W, floor: 'road', ceiling: false, outside: true, ground: true, area: true, explore: true },
    { id: 'gcwalk', name: 'Garden City', x0, x1, z0: W, z1: Bf, floor: 'concrete', ceiling: false, outside: true, ground: true, explore: true, cap: y + 3.38 },   // under the canopy
    { id: 'gcunits', name: 'Garden City (being built)', x0, x1, z0: Bf, z1: Bk, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true, explore: true, cap: y + 3.45 },   // under the first floor
    { id: 'gcup', name: 'Garden City, first floor', x0, x1: LX, z0: FZ, z1: UZ, area: true, ...upstairs },
    { id: 'gcup-lobby', name: 'Garden City, first floor', x0: ux(lobby), x1: LX, z0: UZ, z1: Bk, ...upstairs },
    ...Array.from({ length: lobby }, (_, k): Room => ({ id: `gcup-${k}`, name: 'Garden City, first floor (a shop coming soon)', x0: ux(k), x1: ux(k + 1), z0: UZ, z1: Bk, ...upstairs })),
  ];
  // the stairs (drawn above, step by step), the landing at the top, and the first floor
  const ramps: Ramp[] = [{ x0: LX, x1: SX1, z0: SZ0, z1: SZ1, y0: y, y1: UP, style: 'drawn' }];
  const platforms: Platform[] = [{ x0: LX, x1: SX1, z0: SZ1, z1: Bk, y: UP }];
  const upper: Platform[] = [{ x0, x1: LX, z0: FZ, z1: Bk, y: UP }];

  // a few cars nosed into the bays (the builders' ute among them)
  const parked: Parked[] = [
    { x: x0 + 1.9, z: 41.7, kind: 'suv', color: '#c9ccce', facing: 1, across: true },
    { x: x0 + 7.1, z: 41.5, kind: 'ute', color: '#f2f2f0', facing: 1, across: true },
    { x: x0 + 19.5, z: 41.7, kind: 'suv', color: '#2f4a7a', facing: 1, across: true },
  ];

  return { rooms, barriers, props, parked, doors, ramps, platforms, upper };
}
