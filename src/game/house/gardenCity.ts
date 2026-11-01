// Garden City: the new shopping complex after Sardaar Complex, set back behind
// its own car park. The shops are coming soon; for now it's a building site
// you can walk into: through the gate past the "Garden City" sign, across the
// car park (the builders have fenced off a corner with red water barriers), and
// into the ground-floor units, where their things are lying about. The last
// unit is shut off behind barriers.
//
// Pure data, no three.js: layout.ts adds the rooms, barriers, props and parked
// cars; the engine draws the props (the signs are textures named in `tex`).
import type { Prim, Barrier, Room, Parked, XZ } from './layout.ts';
import { SHOP_FRONTS } from './shops.ts';

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

/** Boxes are plain (sharp edges): a building site needs no rounded furniture edges, and it keeps the triangle count down. */
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/** Garden City's rooms, barriers, props and parked cars, on ground at height `y` (the road). */
export function gardenCity(y: number): { rooms: Room[]; barriers: Barrier[]; props: Prim[]; parked: Parked[] } {
  const P = GARDEN_CITY;
  if (!P) return { rooms: [], barriers: [], props: [], parked: [] };
  const { x0, x1, z0: F, walk: W, build: Bf, z1: Bk } = P;
  const [g0, g1] = P.gate;
  const uw = (x1 - x0) / P.units;
  const ux = (k: number) => x0 + k * uw;
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
  // the gates, swung open into the car park
  for (const gx of [g0 + 0.08, g1 - 0.08]) {
    for (let z = F + 0.35; z <= F + 3.0; z += 0.16) add(cyl(gx, y + 0.1, z, 0.016, 1.75, BLACK, false, 4));
    for (const h of [0.1, 0.95, 1.8]) add(box(gx - 0.025, y + h, F + 0.35, gx + 0.025, y + h + 0.05, F + 3.0, BLACK));
    add(box(gx - 0.05, y, F + 0.35, gx + 0.05, y + 1.9, F + 3.0, 'transparent', true));
  }
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
  add(
    box(x0, y + 3.5, W, x1, y + 3.8, Bk, '#c9c6bf'),                                // first-floor slab, and the canopy over the walkway
    box(x0, y + 3.4, W - 0.05, x1, y + 3.9, W + 0.15, '#f2f3f1'),                  // the canopy's edge
    box(x0, y + 3.8, Bf + 0.4, x1, y + 7.0, Bk, '#e3e5e6'),                       // upstairs
    box(x0 - 0.1, y + 7.0, Bf + 0.2, x1 + 0.1, y + 7.6, Bk + 0.1, '#f2f3f1'),     // parapet
    box(x0 + 3, y + 7.05, Bf + 0.14, x1 - 3, y + 7.55, Bf + 0.2, '#4f9a3a', false, { tex: 'gcbanner:-z' }),
    box(x0, y, Bf, x0 + 0.2, y + 3.5, Bk, BLOCK), box(x1 - 0.2, y, Bf, x1, y + 3.5, Bk, BLOCK),   // side walls
    box(x0, y, Bk - 0.2, x1, y + 3.5, Bk, BLOCK),                                                 // back wall
  );
  for (let k = 0; k < P.units; k++) {
    const wx0 = ux(k) + 0.6, wx1 = ux(k + 1) - 0.6;
    add(box(wx0, y + 4.5, Bf + 0.32, wx1, y + 6.2, Bf + 0.4, k % 2 ? '#2b3a44' : '#dfe7ea'), box(wx0 - 0.1, y + 4.42, Bf + 0.28, wx1 + 0.1, y + 4.5, Bf + 0.4, '#cfd2d4'));
  }
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
    const u = ux(k), mid = u + uw / 2;
    add(
      box(u + 1.4, y + 1.5, Bk - 0.26, u + uw - 1.4, y + 2.5, Bk - 0.2, '#ffffff', false, { tex: 'gcsoon:-z' }),
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
    // 2: wrapped panels against the wall, a trestle bench with tools, tins of paint
    const u = ux(1);
    for (let i = 0; i < 4; i++) {
      const px = u + uw - 0.3 - i * 0.07, pz = 49.0 + i * 0.18;
      add(box(px - 0.05, y, pz, px, y + 2.4, pz + 1.2, PANEL), box(px - 0.055, y + 1.2, pz + 0.35, px - 0.05, y + 1.6, pz + 0.85, MARK));
    }
    add(box(u + uw - 0.6, y, 48.9, u + uw - 0.15, y + 2.4, 50.8, 'transparent', true));
    add(box(u + 1.0, y + 0.85, 51.5, u + 3.0, y + 0.9, 52.3, '#c49a6c', true));
    for (const [lx, lz] of [[u + 1.15, 51.6], [u + 2.85, 51.6], [u + 1.15, 52.2], [u + 2.85, 52.2]]) add(box(lx - 0.03, y, lz - 0.03, lx + 0.03, y + 0.85, lz + 0.03, '#7d6a55'));
    add(box(u + 1.3, y + 0.9, 51.7, u + 1.9, y + 0.91, 51.85, '#9aa0a6'), box(u + 2.3, y + 0.9, 51.8, u + 2.55, y + 1.05, 51.95, '#f2b705'));
    for (const [i, lid] of [[0, '#2f6db5'], [1, '#d63a2f'], [2, '#f2f2ef']] as const) add(cyl(u + 1.2 + i * 0.36, y, 54.9, 0.14, 0.3, '#f2f2ef', true, 10), cyl(u + 1.2 + i * 0.36, y + 0.3, 54.9, 0.145, 0.02, lid, false, 10));
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
    // 5: shut off behind red barriers, a mixer and blocks inside
    const u = ux(4), bx0 = u + 0.25, bx1 = x1 - 0.5, n = 4;
    for (let i = 0; i < n; i++) barrier(bx0 + ((bx1 - bx0) * i) / n, Bf + 0.55, bx0 + ((bx1 - bx0) * (i + 1)) / n - 0.02, Bf + 1.0);
    add(
      box(u + 1.6, y + 0.85, Bf + 0.5, u + 2.8, y + 1.65, Bf + 0.55, '#f6c21c', false, { tex: 'gcbuild:-z' }),
      box(u + 2.2, y, 52.4, u + 3.0, y + 0.5, 52.9, '#3b3f44', true),
      { kind: 'cyl', base: [u + 2.6, y + 0.9, 52.65], r: 0.45, h: 0.9, color: '#e2762b', axis: 'x', top: 0.3 },
      box(u + 0.6, y, 54.4, u + 1.8, y + 0.6, 55.4, '#a8a7a1', true),
    );
  }

  const inv = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'invisible', h: 2, t: 0.12, mode: 'explore' });
  const wall = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'facade', h: 3.5, t: 0.2, mode: 'explore' });
  const barriers: Barrier[] = [
    inv([x0, F], [g0, F]), inv([g1, F], [x1 + 0.4, F]),          // the front fence, open at the gate
    inv([x0, F], [x0, Bf]), inv([x1, F], [x1, Bf]),              // the side fences
    wall([x0, Bf], [x0, Bk]), wall([x1, Bf], [x1, Bk]), wall([x0, Bk], [x1, Bk]),
    ...Array.from({ length: P.units - 1 }, (_, i) => wall([ux(i + 1), Bf], [ux(i + 1), Bk])),
  ];

  const rooms: Room[] = [
    { id: 'gcpark', name: 'Garden City', x0, x1, z0: F, z1: W, floor: 'road', ceiling: false, outside: true, ground: true, area: true, explore: true },
    { id: 'gcwalk', name: 'Garden City', x0, x1, z0: W, z1: Bf, floor: 'concrete', ceiling: false, outside: true, ground: true, explore: true },
    { id: 'gcunits', name: 'Garden City (being built)', x0, x1, z0: Bf, z1: Bk, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true, explore: true },
  ];

  // a few cars nosed into the bays (the builders' ute among them)
  const parked: Parked[] = [
    { x: x0 + 1.9, z: 41.7, kind: 'suv', color: '#c9ccce', facing: 1, across: true },
    { x: x0 + 7.1, z: 41.5, kind: 'ute', color: '#f2f2f0', facing: 1, across: true },
    { x: x0 + 19.5, z: 41.7, kind: 'suv', color: '#2f4a7a', facing: 1, across: true },
  ];

  return { rooms, barriers, props, parked };
}
