// Damodar City: the shopping centre across McFarlane Road from the front gate,
// from photos of the real one. Its frontage on the road is the way in, past a
// pylon sign; the car park opens out behind the neighbouring shops (bays,
// islands with yellow kerbs, shrubs and palms, round-topped lamp posts). Along
// the back, a two-storey block of shops with a glass-fronted walkway upstairs,
// white pillars and a blue-grey roof band, and Damodar Cinemas at the east
// end; a smaller block of shops down the west side. BSP is open (walk in: a
// counter, ATMs, its logo on a green wall); the other shops are coming soon.
//
// Pure data, no three.js: layout.ts adds the rooms, barriers, props and parked
// cars; the engine draws the props (logos via `tex: 'logo/…'`).
import type { Prim, Barrier, Room, Parked, XZ } from './layout.ts';
import { SHOP_FRONTS } from './shops.ts';

const front = SHOP_FRONTS.find((f) => f.id === 'damodar');

/** In plan: the way in from the road, the car park behind the shops, the walkway, the main block, the west wing. */
export const DAMODAR_CITY = front ? {
  /** The way in: the frontage on the road, out to the neighbouring shops' side walls. */
  in0: front.x0 - 0.8, in1: front.x1 + 0.8,
  x0: -20, x1: 38,
  /** The road's shop line, the back of the shops, the walkway's edge, the main block's shopfronts, its back. */
  road: 31.6, back: 37.6, walk: 55.6, front: 58, z1: 70,
  /** The main block's shops (west to east) and the cinema (east of them). */
  units: 8, unitW: 5.5,
  /** BSP's shop (0-based, from the west): straight ahead as you come in. */
  bsp: 5,
  /** The west wing: its shopfront faces east along this line, from z0 to the walkway. */
  wing: { x1: -10, z0: 40 },
} : null;

const SLATE = '#4a5a6e';
const WALL = '#e9ecef';
const WHITE = '#f4f4f2';
const GLASS = '#bfe0ee';
const DARK_GLASS = '#2b3a44';
const LINE = '#f1f1ec';
const YELLOW = '#f2c230';
const BSP_GREEN = '#0f8a43';

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/** Where the palms grow (drawn by the engine with Raiwai's trees). */
export const DAMODAR_PALMS: { x: number; z: number; s: number }[] = [
  { x: -6, z: 45.2, s: 6 }, { x: 19.5, z: 45.6, s: 6.5 }, { x: 36, z: 45.2, s: 6 },
];

/** Damodar City's rooms, barriers, props and parked cars, on ground at height `y` (the road). */
export function damodarCity(y: number): { rooms: Room[]; barriers: Barrier[]; props: Prim[]; parked: Parked[] } {
  const P = DAMODAR_CITY;
  if (!P) return { rooms: [], barriers: [], props: [], parked: [] };
  const { x0, x1, in0, in1, road: R, back: K, walk: W, front: F, z1: Z, unitW: uw } = P;
  const ux = (k: number) => x0 + k * uw;
  const cin = ux(P.units);                       // the cinema, from here to x1
  const props: Prim[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };

  // ── the way in: a pylon sign, the drive's centre line ──
  const px0 = in0 + 0.6, px1 = px0 + 2.0;
  add(
    box(px0, y, R + 0.2, px1, y + 4.2, R + 0.6, SLATE, true),
    box(px0 - 0.1, y + 4.2, R + 0.15, px1 + 0.1, y + 5.0, R + 0.65, '#3f4d5e', false, { tex: 'dcname:-z' }),
    box(px0 + 0.1, y + 3.05, R + 0.14, px1 - 0.1, y + 4.05, R + 0.66, '#d61f26', false, { tex: 'logo/damodar-cinemas.png@#070707:-z' }),
    box(px0 + 0.1, y + 1.9, R + 0.14, px1 - 0.1, y + 2.9, R + 0.66, BSP_GREEN, false, { tex: 'logo/bsp.png:-z' }),
    box(px0 + 0.1, y + 0.75, R + 0.14, px1 - 0.1, y + 1.75, R + 0.66, '#ffffff', false, { tex: 'dcsoon:-z' }),
  );
  const mid = (in0 + in1) / 2 + 1;
  for (let z = R + 0.6; z < K - 0.4; z += 1.4) add(box(mid - 0.06, y + 0.006, z, mid + 0.06, y + 0.014, z + 0.7, LINE));

  // ── the car park: two rows of bays, islands with yellow kerbs, lamp posts ──
  const rowN = [K + 0.2, K + 5.0], rowS = [W - 4.8, W - 0.2];
  const bays = (xs: number, xe: number, [za, zb]: number[]) => {
    for (let x = xs; x <= xe + 0.01; x += 2.6) add(box(x - 0.05, y + 0.006, za, x + 0.05, y + 0.014, zb, LINE));
    const zEnd = za < (K + W) / 2 ? zb : za;
    add(box(xs, y + 0.006, zEnd - 0.05, xe, y + 0.014, zEnd + 0.05, LINE));
  };
  bays(-7.6, 0.2, rowN); bays(in1 + 0.5, x1 - 0.5, rowN);
  bays(-7.6, 2.8, rowS); bays(12.5, x1 - 0.5, rowS);
  const island = (ix0: number, iz0: number, ix1: number, iz1: number) => {
    add(box(ix0, y, iz0, ix1, y + 0.2, iz1, YELLOW, true), box(ix0 + 0.15, y + 0.2, iz0 + 0.15, ix1 - 0.15, y + 0.22, iz1 - 0.15, '#5b4a3a'));
    for (let x = ix0 + 0.6; x < ix1 - 0.3; x += 1.1) for (let z = iz0 + 0.6; z < iz1 - 0.3; z += 1.3) {
      add(cyl(x, y + 0.22, z, 0.42, 0.55, (Math.round(x * 3 + z) % 3) ? '#3f8f3a' : '#4f9d45', false, 8, 0.22));
      if ((Math.round(x * 7 + z * 3) % 4) === 0) add(cyl(x + 0.2, y + 0.6, z, 0.16, 0.18, '#e05a8a', false, 6, 0.08));
    }
  };
  island(-7.5, K + 6.0, -4.5, W - 5.8); island(17.5, K + 7.0, 21.5, W - 6.8); island(x1 - 3.5, K + 6.0, x1 - 0.5, W - 5.8);
  const lamp = (lx: number, lz: number) => add(
    cyl(lx, y, lz, 0.07, 5.0, '#5d6268', true, 8),
    cyl(lx, y + 5.0, lz, 0.38, 0.1, '#5d6268', false, 16),
    cyl(lx, y + 4.92, lz, 0.3, 0.08, '#fff3c4', false, 16),
  );
  lamp(-6, 48.4); lamp(19.5, 47.8); lamp(36, 48.4);

  // ── the main block: two storeys, a walkway upstairs behind glass, white pillars, the blue-grey roof band ──
  const bx0 = ux(P.bsp), bx1 = ux(P.bsp + 1), bmid = (bx0 + bx1) / 2;
  add(
    box(x0, y, F + 0.3, bx0, y + 3.5, Z, WALL), box(bx1, y, F + 0.3, cin, y + 3.5, Z, WALL),     // downstairs, either side of BSP
    box(bx0, y, Z - 0.2, bx1, y + 3.5, Z, WALL),                                                  // BSP's back wall
    box(x0, y + 3.72, F, cin, y + 7.2, Z, WALL),                                                  // upstairs
    box(x0, y + 3.5, W, x1, y + 3.72, Z, '#d9dcdf'),                                              // the first floor, and the walkway
    box(x0, y + 3.45, W - 0.05, x1, y + 3.75, W + 0.1, SLATE),                                    // its edge
    box(x0, y + 3.75, W + 0.02, cin, y + 4.75, W + 0.08, '#cfe3ea'),                              // glass balustrade
    box(x0, y + 4.75, W, cin, y + 4.82, W + 0.1, '#9aa3aa'),
    box(x0 - 0.1, y + 7.2, W - 0.3, x1 + 0.1, y + 7.9, Z + 0.1, SLATE),                           // the roof band
    box(x0 - 0.1, y + 7.15, W - 0.32, x1 + 0.1, y + 7.25, W - 0.28, WHITE),
  );
  for (let k = 0; k <= P.units; k++) {
    const px = Math.max(ux(k), x0 + 0.22);
    add(box(px - 0.22, y, W - 0.2, px + 0.22, y + 7.9, W + 0.24, WHITE, true));
  }
  add(box(x1 - 0.44, y, W - 0.2, x1, y + 7.9, W + 0.24, WHITE, true));
  for (let k = 0; k < P.units; k++) {
    const u = ux(k), u1 = u + uw, m = (u + u1) / 2;
    // its sign on the balustrade, its upstairs window (a poster in some)
    add(box(u + 0.9, y + 3.86, W - 0.03, u1 - 0.9, y + 4.62, W, k === P.bsp ? BSP_GREEN : '#ffffff', false, { tex: k === P.bsp ? 'logo/bsp.png:-z' : 'dcsoon:-z' }));
    add(box(u + 0.3, y + 3.95, F - 0.04, u1 - 0.3, y + 6.7, F, k % 3 ? DARK_GLASS : '#bfd6e0'));
    if (k % 2 === 0) add(box(u + 1.5, y + 4.6, F - 0.06, u1 - 1.5, y + 5.6, F - 0.04, '#ffffff', false, { tex: 'dcsoon:-z' }));
    if (k === P.bsp) continue;
    // downstairs: a glass front with a door, a "coming soon" poster
    add(
      box(u + 0.25, y, F, u1 - 0.25, y + 3.3, F + 0.06, GLASS),
      box(m - 0.5, y, F - 0.01, m + 0.5, y + 2.2, F, '#3b4045'),
      box(u + 0.6, y + 1.0, F - 0.03, u + 2.3, y + 1.85, F - 0.01, '#ffffff', false, { tex: 'dcsoon:-z' }),
      box(u + 0.25, y + 3.3, F, u1 - 0.25, y + 3.5, F + 0.06, SLATE),
    );
  }

  // ── BSP, open: glass either side of an open door, a green wall with the logo, a counter, ATMs, chairs ──
  add(
    box(bx0 + 0.25, y, F, bmid - 1.0, y + 3.3, F + 0.06, GLASS), box(bmid + 1.0, y, F, bx1 - 0.25, y + 3.3, F + 0.06, GLASS),
    box(bmid - 1.0, y + 2.4, F, bmid + 1.0, y + 3.3, F + 0.06, GLASS),
    box(bmid - 1.05, y, F - 0.02, bmid - 0.95, y + 3.3, F + 0.08, '#3b3f44'), box(bmid + 0.95, y, F - 0.02, bmid + 1.05, y + 3.3, F + 0.08, '#3b3f44'),
    box(bx0 + 0.25, y + 3.3, F, bx1 - 0.25, y + 3.5, F + 0.06, BSP_GREEN),
    box(bx0 + 0.02, y, Z - 0.25, bx1 - 0.02, y + 3.5, Z - 0.2, BSP_GREEN),
    box(bx0 + 1.1, y + 2.0, Z - 0.28, bx1 - 1.1, y + 2.9, Z - 0.25, '#ffffff', false, { tex: 'logo/bsp.png:-z' }),
    box(bx0 + 0.6, y, 66.0, bx1 - 0.6, y + 1.05, 66.7, WHITE, true), box(bx0 + 0.6, y + 0.25, 65.98, bx1 - 0.6, y + 0.85, 66.0, BSP_GREEN),
    box(bx0 + 0.55, y + 1.05, 65.95, bx1 - 0.55, y + 1.1, 66.75, '#3b3f44'), box(bx0 + 0.6, y + 1.1, 66.3, bx1 - 0.6, y + 1.6, 66.32, '#d6ecf3'),
    ...[59.0, 60.1].flatMap((z) => [
      box(bx0 + 0.02, y, z, bx0 + 0.5, y + 1.7, z + 0.8, BSP_GREEN, true),
      box(bx0 + 0.5, y + 1.05, z + 0.15, bx0 + 0.52, y + 1.4, z + 0.65, '#1e2a30'),
      box(bx0 + 0.5, y + 0.85, z + 0.25, bx0 + 0.56, y + 0.95, z + 0.55, '#9aa0a6'),
    ]),
    box(bmid - 0.8, y + 3.44, 61.5, bmid + 0.8, y + 3.48, 61.9, '#fffdf5', false, { emissive: true }),
    box(bmid - 0.8, y + 3.44, 64.5, bmid + 0.8, y + 3.48, 64.9, '#fffdf5', false, { emissive: true }),
    cyl(bx1 - 0.5, y, F + 0.6, 0.22, 0.4, '#3c3f42', true, 10), cyl(bx1 - 0.5, y + 0.4, F + 0.6, 0.3, 0.8, '#3f8f3a', false, 7, 0),
  );
  for (const z of [61.4, 62.2, 63.0]) add(box(bx1 - 0.6, y + 0.44, z, bx1 - 0.15, y + 0.49, z + 0.55, '#3b3f44', true), box(bx1 - 0.19, y + 0.49, z, bx1 - 0.15, y + 0.95, z + 0.55, '#3b3f44'));

  // ── Damodar Cinemas at the east end: taller and dark, posters by the doors, its logo up top ──
  add(
    box(cin, y, F, x1, y + 10, Z, '#2b2d31'),
    box(cin - 0.1, y + 10, F - 0.1, x1 + 0.1, y + 10.3, Z + 0.1, '#1d1f22'),
    box(cin + 4.5, y, F - 0.04, x1 - 4.5, y + 2.6, F, '#1e2a30'),
    box(cin + 1.2, y + 0.6, F - 0.04, cin + 3.4, y + 3.0, F - 0.02, '#f3d36b'), box(x1 - 3.4, y + 0.6, F - 0.04, x1 - 1.2, y + 3.0, F - 0.02, '#f3d36b'),
    box(cin + 1.5, y + 8.1, F - 0.06, x1 - 1.5, y + 9.7, F - 0.02, '#d61f26', false, { tex: 'logo/damodar-cinemas.png@#070707:-z' }),
  );

  // ── the west wing: two storeys, its shops facing east under a canopy ──
  const wx1 = P.wing.x1, wz0 = P.wing.z0, wn = 3, wl = (W - wz0) / wn;
  add(
    box(x0, y, wz0, wx1, y + 7.2, W, WALL),
    box(x0 - 0.1, y + 7.2, wz0 - 0.1, wx1 + 0.3, y + 7.9, W, SLATE),
    box(wx1, y + 3.4, wz0, wx1 + 1.8, y + 3.62, W - 0.3, '#d9dcdf'),
    box(wx1 + 1.75, y + 3.35, wz0, wx1 + 1.85, y + 3.7, W - 0.3, SLATE),
  );
  for (let i = 0; i < wn; i++) {
    const za = wz0 + i * wl, zb = za + wl;
    add(
      box(wx1, y, za + 0.25, wx1 + 0.06, y + 3.2, zb - 0.25, GLASS),
      box(wx1 + 0.06, y + 1.0, za + 0.6, wx1 + 0.08, y + 1.85, za + 2.3, '#ffffff', false, { tex: 'dcsoon:+x' }),
      box(wx1, y + 4.0, za + 0.3, wx1 + 0.04, y + 6.6, zb - 0.3, DARK_GLASS),
      box(wx1 + 1.85, y + 3.72, za + 0.9, wx1 + 1.88, y + 4.4, zb - 0.9, '#ffffff', false, { tex: 'dcsoon:+x' }),
      cyl(wx1 + 1.6, y, za + 0.3, 0.1, 3.4, WHITE, true, 10),
    );
  }

  const wall = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'facade', h: 3.5, t: 0.15, mode: 'explore' });
  const barriers: Barrier[] = [
    wall([in0, R], [in0, K]), wall([in1, R], [in1, K]),                  // the way in, between the neighbouring shops
    wall([x0, K], [in0, K]), wall([in1, K], [x1, K]),                    // the backs of the shops
    wall([x0, K], [x0, Z]), wall([x1, K], [x1, Z]),                      // the sides
    wall([wx1, wz0], [wx1, W]), wall([x0, wz0], [wx1, wz0]), wall([x0, W], [wx1, W]),   // the west wing, closed all round
    wall([x0, F], [bmid - 1.0, F]), wall([bmid + 1.0, F], [x1, F]),      // the shopfronts and the cinema, open at BSP's door
    wall([bx0, F], [bx0, Z]), wall([bx1, F], [bx1, Z]), wall([bx0, Z - 0.2], [bx1, Z - 0.2]),   // inside BSP
  ];

  const area = { ceiling: false, outside: true, ground: true, explore: true } as const;
  const rooms: Room[] = [
    { id: 'dcin', name: 'Damodar City', x0: in0, x1: in1, z0: R, z1: K, floor: 'road', ...area },
    { id: 'dcwing', name: 'Damodar City', x0: wx1, x1: wx1 + 1.8, z0: wz0, z1: W, floor: 'concrete', ...area },
    { id: 'dcpark', name: 'Damodar City', x0, x1, z0: K, z1: W, floor: 'road', ...area, area: true },
    { id: 'dcwalk', name: 'Damodar City', x0, x1, z0: W, z1: F, floor: 'concrete', ...area },
    { id: 'dcbsp', name: 'BSP, Damodar City', x0: bx0, x1: bx1, z0: F, z1: Z - 0.2, floor: 'bath', ...area, area: true },
  ];

  // cars nosed into the bays, both rows
  const parked: Parked[] = [
    { x: -6.3, z: K + 2.6, kind: 'suv', color: '#c9ccce', facing: -1, across: true },
    { x: 16.8, z: K + 2.6, kind: 'suv', color: '#f2f2f0', facing: -1, across: true },
    { x: 22.0, z: K + 2.6, kind: 'ute', color: '#1d1f22', facing: -1, across: true },
    { x: 29.8, z: K + 2.6, kind: 'suv', color: '#8a1c1c', facing: -1, across: true },
    { x: -3.7, z: W - 2.4, kind: 'suv', color: '#2f4a7a', facing: 1, across: true },
    { x: 16.4, z: W - 2.4, kind: 'suv', color: '#f2f2f0', facing: 1, across: true },
    { x: 26.8, z: W - 2.6, kind: 'ute', color: '#c9ccce', facing: 1, across: true },
    { x: 34.6, z: W - 2.4, kind: 'suv', color: '#4b5157', facing: 1, across: true },
  ];

  return { rooms, barriers, props, parked };
}
