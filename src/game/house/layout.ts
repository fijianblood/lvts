// The house, as data. Everything the renderer draws and everything the
// collision and minimap code tests comes from this one file, so the walls you
// see are the walls you bump into.
//
// Units are metres. x runs east (right when you stand on the road looking at
// the house), z runs south toward the road, y is up. The plan is an estimate
// worked out from the owner's photos: veranda and lounge at the front, the
// kitchen and dining/office on the west, a hallway running back past the kids'
// room, bathroom and bedroom 3 to the main bedroom, and a back room whose back
// door is the way out. The carport with the Ranger sits on the east side.

export type XZ = [number, number];
export type XYZ = [number, number, number];

export const WALL_H = 2.6;
export const CEIL_H = 2.55;
export const DOOR_TOP = 2.05;
export const EXT_T = 0.2;
export const INT_T = 0.15;

export type FloorKind = 'tile' | 'bath' | 'veranda' | 'concrete' | 'grass' | 'deck';

export interface Room {
  id: string;
  name: string;
  x0: number; x1: number; z0: number; z1: number;
  floor: FloorKind;
  /** Rooms with a roof over them get a ceiling. */
  ceiling: boolean;
  /** Tile skin on the inside faces (the bathroom's white tiles and mosaic band). */
  tiled?: boolean;
  /** Outside spaces count for the minimap but are never "explored" rooms in the HUD. */
  outside?: boolean;
}

export type OpeningKind = 'door' | 'window' | 'gap';

export interface Opening {
  kind: OpeningKind;
  /** Along the wall's own axis (z for a wall at constant x, x for a wall at constant z). */
  from: number;
  to: number;
  id?: string;
  sill?: number;
  top?: number;
}

export interface WallRun {
  /** 'x' means the wall sits at constant x and runs along z. */
  at: 'x' | 'z';
  line: number;
  from: number;
  to: number;
  t: number;
  exterior?: boolean;
  /** Which way is outside, for exterior walls: +1 or -1 along the wall's normal axis. */
  outward?: 1 | -1;
  openings: Opening[];
}

export interface HingedDoor {
  kind: 'hinged';
  id: string;
  label: string;
  hinge: XZ;
  width: number;
  /** Direction of the panel from the hinge when shut, as an angle in the x–z plane (x = cos, z = sin). */
  closed: number;
  /** Signed swing from shut to fully open. */
  swing: number;
  color: string;
  exterior?: boolean;
}

export interface SlidingDoor {
  kind: 'slide';
  id: string;
  label: string;
  /** The wall line (constant z) and the opening span along x. */
  line: number;
  from: number;
  to: number;
}

export type Door = HingedDoor | SlidingDoor;

export interface WindowSpec {
  id: string;
  at: 'x' | 'z';
  line: number;
  from: number;
  to: number;
  sill: number;
  top: number;
  outward: 1 | -1;
  curtain?: 'floral' | 'gold' | 'yellow' | 'polka' | 'sheer' | 'towel';
  grille: boolean;
}

export type Prim =
  /** `tex` is 'name:face' — a texture drawn on one face of the box ('+x', '-x', '+y', '+z', '-z'). */
  | { kind: 'box'; min: XYZ; max: XYZ; color: string; solid?: boolean; emissive?: boolean; tex?: string }
  | { kind: 'cyl'; base: XYZ; r: number; h: number; color: string; solid?: boolean; seg?: number; top?: number }
  | { kind: 'cone'; base: XYZ; r: number; h: number; color: string; seg?: number; opacity?: number; flip?: boolean };

export interface Collectible {
  id: string;
  kind: CollectibleKind;
  name: string;
  pos: XYZ;
  room: string;
}

export type CollectibleKind =
  | 'ram' | 'ssd' | 'cpu' | 'usb' | 'router' | 'mouse'
  | 'hdd' | 'battery' | 'fan' | 'gpu' | 'hdmi' | 'sim';

// ── Palette, sampled from the photos ────────────────────────────────────────
export const C = {
  wall: '#ece8df',
  wallOut: '#e9e4d8',
  skirt: '#cfc8b8',
  trim: '#f6f4ee',
  ceiling: '#f3f1ea',
  tile: '#c9844a',
  doorWood: '#b4612c',
  frameWood: '#6e3a20',
  darkWood: '#6b2f1b',
  counter: '#4e2416',
  oak: '#b08a5a',
  sofa: '#5b4636',
  sofa2: '#6e6259',
  rug: '#8e3b33',
  fridge: '#ecebe6',
  steel: '#a7adb2',
  black: '#1d1f22',
  greyChair: '#8c8a88',
  sheetBeige: '#b9a58c',
  sheetWhite: '#eeeae2',
  quilt: '#f1efe9',
  pink: '#e8458b',
  basinLime: '#a6e22e',
  bathTile: '#f3f1ea',
  mosaic: '#7d8288',
  glass: '#bfe3f2',
  grille: '#f4f1e8',
  ranger: '#141619',
  concrete: '#b9b7b1',
  grass: '#7fb069',
  roof: '#757b80',
  lvtsBlue: '#2563eb',
  lvtsViolet: '#7c3aed',
  lvtsOrange: '#f59e0b',
} as const;

// ── Rooms ───────────────────────────────────────────────────────────────────
export const ROOMS: Room[] = [
  { id: 'veranda', name: 'Front veranda', x0: 6.2, x1: 11, z0: 13, z1: 15.2, floor: 'veranda', ceiling: true },
  { id: 'lounge', name: 'Lounge', x0: 6.2, x1: 11, z0: 2.5, z1: 13, floor: 'tile', ceiling: true },
  { id: 'kitchen', name: 'Kitchen', x0: 0, x1: 6.2, z0: 2.5, z1: 8.5, floor: 'tile', ceiling: true },
  { id: 'dining', name: 'Dining & office', x0: 0, x1: 6.2, z0: 8.5, z1: 13, floor: 'tile', ceiling: true },
  { id: 'hall', name: 'Hallway', x0: 5.0, x1: 6.2, z0: -4.0, z1: 2.5, floor: 'tile', ceiling: true },
  { id: 'kids', name: "Kids' room", x0: 6.2, x1: 11, z0: -0.9, z1: 2.5, floor: 'tile', ceiling: true },
  { id: 'bed3', name: 'Bedroom 3', x0: 6.2, x1: 11, z0: -4.0, z1: -0.9, floor: 'tile', ceiling: true },
  { id: 'master', name: 'Main bedroom', x0: 5.0, x1: 11, z0: -7.6, z1: -4.0, floor: 'tile', ceiling: true },
  { id: 'bath', name: 'Bathroom', x0: 0, x1: 5.0, z0: -1.4, z1: 2.5, floor: 'bath', ceiling: true, tiled: true },
  { id: 'back', name: 'Back room', x0: 0, x1: 5.0, z0: -7.6, z1: -1.4, floor: 'tile', ceiling: true },
  { id: 'landing', name: 'Back steps', x0: 0.7, x1: 2.2, z0: -9.0, z1: -7.6, floor: 'deck', ceiling: false, outside: true },
  { id: 'carport', name: 'Carport', x0: 11, x1: 15.6, z0: -7.4, z1: 2.4, floor: 'concrete', ceiling: false, outside: true },
];

// The house footprint (interior faces of the exterior walls sit 0.1 inside these).
export const HOUSE = { x0: 0, x1: 11, z0: -7.6, z1: 13 };

// ── Walls ───────────────────────────────────────────────────────────────────
export const WALLS: WallRun[] = [
  // Exterior
  { at: 'x', line: 0, from: -7.6, to: 13, t: EXT_T, exterior: true, outward: -1, openings: [
    { kind: 'window', id: 'w-back', from: -5.6, to: -4.4, sill: 1.0, top: DOOR_TOP },
    { kind: 'window', id: 'w-bath', from: 0.4, to: 1.0, sill: 1.45, top: 1.95 },
    { kind: 'window', id: 'w-dine-w', from: 9.6, to: 11.0, sill: 0.9, top: DOOR_TOP },
  ] },
  { at: 'z', line: 13, from: 0, to: 11, t: EXT_T, exterior: true, outward: 1, openings: [
    { kind: 'window', id: 'w-dine-s', from: 2.2, to: 3.8, sill: 0.9, top: DOOR_TOP },
    { kind: 'door', id: 'slider', from: 7.2, to: 10.2, top: 2.1 },
  ] },
  { at: 'x', line: 11, from: -7.6, to: 13, t: EXT_T, exterior: true, outward: 1, openings: [
    { kind: 'window', id: 'w-master-e', from: -6.4, to: -5.2, sill: 0.95, top: DOOR_TOP },
    { kind: 'window', id: 'w-bed3', from: -2.9, to: -1.9, sill: 1.0, top: DOOR_TOP },
    { kind: 'window', id: 'w-kids', from: 0.4, to: 1.6, sill: 0.95, top: DOOR_TOP },
    { kind: 'window', id: 'w-lounge', from: 4.0, to: 5.4, sill: 0.9, top: DOOR_TOP },
  ] },
  { at: 'z', line: -7.6, from: 0, to: 11, t: EXT_T, exterior: true, outward: -1, openings: [
    { kind: 'door', id: 'back', from: 1.0, to: 1.9 },
    { kind: 'window', id: 'w-master-n', from: 7.4, to: 8.6, sill: 1.1, top: DOOR_TOP },
  ] },
  // Interior
  { at: 'z', line: 2.5, from: 0.1, to: 5.0, t: INT_T, openings: [] },            // kitchen | bathroom
  { at: 'z', line: 2.5, from: 6.2, to: 10.9, t: INT_T, openings: [] },           // lounge | kids
  { at: 'x', line: 5.0, from: -4.0, to: 2.575, t: INT_T, openings: [             // hallway, west side
    { kind: 'door', id: 'bath', from: 0.2, to: 1.0 },
    { kind: 'door', id: 'backroom', from: -3.2, to: -2.4 },
  ] },
  { at: 'x', line: 6.2, from: -4.0, to: 2.575, t: INT_T, openings: [             // hallway, east side
    { kind: 'door', id: 'kids', from: 1.5, to: 2.3 },
    { kind: 'door', id: 'bed3', from: -3.4, to: -2.6 },
  ] },
  { at: 'z', line: -1.4, from: 0.1, to: 5.0, t: INT_T, openings: [] },           // bathroom | back room
  { at: 'z', line: -0.9, from: 6.2, to: 10.9, t: INT_T, openings: [] },          // kids | bedroom 3
  { at: 'z', line: -4.0, from: 5.0, to: 10.9, t: INT_T, openings: [              // hallway end | main bedroom
    { kind: 'door', id: 'master', from: 5.15, to: 6.05 },
  ] },
  { at: 'x', line: 5.0, from: -7.5, to: -4.0, t: INT_T, openings: [] },          // back room | main bedroom
  { at: 'x', line: 6.2, from: 8.6, to: 12.95, t: INT_T, openings: [] },          // dining | lounge
  { at: 'x', line: 2.2, from: -1.4, to: 2.5, t: INT_T, openings: [               // bathroom stall fronts
    { kind: 'door', id: 'shower', from: -0.9, to: -0.2 },
    { kind: 'gap', from: 1.2, to: 1.9, top: DOOR_TOP },
  ] },
  { at: 'z', line: 0.55, from: 0.1, to: 2.2, t: INT_T, openings: [] },           // shower | toilet partition
];

// ── Doors ───────────────────────────────────────────────────────────────────
const HALF_PI = Math.PI / 2;
export const DOORS: Door[] = [
  { kind: 'slide', id: 'slider', label: 'sliding door', line: 13, from: 7.2, to: 10.2 },
  { kind: 'hinged', id: 'bath', label: 'bathroom door', hinge: [5.0, 0.2], width: 0.8, closed: HALF_PI, swing: HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'backroom', label: 'back room door', hinge: [5.0, -3.2], width: 0.8, closed: HALF_PI, swing: HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'kids', label: "kids' room door", hinge: [6.2, 2.3], width: 0.8, closed: -HALF_PI, swing: HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'bed3', label: 'bedroom door', hinge: [6.2, -3.4], width: 0.8, closed: HALF_PI, swing: -HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'master', label: 'bedroom door', hinge: [6.05, -4.0], width: 0.9, closed: Math.PI, swing: HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'shower', label: 'shower door', hinge: [2.2, -0.9], width: 0.7, closed: HALF_PI, swing: -HALF_PI, color: C.doorWood },
  { kind: 'hinged', id: 'back', label: 'back door', hinge: [1.0, -7.6], width: 0.9, closed: 0, swing: -HALF_PI, color: '#8a4a26', exterior: true },
];

// ── Windows (every window opening on an exterior wall) ─────────────────────
const CURTAINS: Record<string, WindowSpec['curtain']> = {
  'w-back': 'sheer', 'w-bath': undefined, 'w-dine-w': 'sheer', 'w-dine-s': 'polka',
  'w-master-e': 'gold', 'w-bed3': 'towel', 'w-kids': 'floral', 'w-lounge': 'sheer', 'w-master-n': 'gold',
};

export const WINDOWS: WindowSpec[] = WALLS.flatMap((wall) =>
  wall.openings
    .filter((o) => o.kind === 'window' && o.id)
    .map((o) => ({
      id: o.id as string,
      at: wall.at,
      line: wall.line,
      from: o.from,
      to: o.to,
      sill: o.sill ?? 0.9,
      top: o.top ?? DOOR_TOP,
      outward: wall.outward ?? 1,
      curtain: CURTAINS[o.id as string],
      grille: true,
    })),
);

// ── Furniture helpers (pure data) ───────────────────────────────────────────
type P = Prim[];
const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/** A chair seen as seat, back and four legs. `face` is the direction the sitter looks. */
function chair(x: number, z: number, face: 'n' | 's' | 'e' | 'w', color: string = C.greyChair, solid = true): P {
  const s = 0.23;
  const out: P = [box(x - s, 0.42, z - s, x + s, 0.5, z + s, color, solid)];
  const legs: XZ[] = [[x - s + 0.03, z - s + 0.03], [x + s - 0.03, z - s + 0.03], [x - s + 0.03, z + s - 0.03], [x + s - 0.03, z + s - 0.03]];
  for (const [lx, lz] of legs) out.push(box(lx - 0.02, 0, lz - 0.02, lx + 0.02, 0.42, lz + 0.02, C.black));
  const back = 1.0;
  if (face === 'e') out.push(box(x - s, 0.5, z - s, x - s + 0.06, back, z + s, color));
  if (face === 'w') out.push(box(x + s - 0.06, 0.5, z - s, x + s, back, z + s, color));
  if (face === 's') out.push(box(x - s, 0.5, z - s, x + s, back, z - s + 0.06, color));
  if (face === 'n') out.push(box(x - s, 0.5, z + s - 0.06, x + s, back, z + s, color));
  return out;
}

/** A bed: frame, mattress, sheet, pillows and a headboard against `head`. */
function bed(x0: number, z0: number, x1: number, z1: number, head: 'n' | 'e' | 's' | 'w', sheet: string, frame: string, metal = false): P {
  const out: P = [
    box(x0, 0, z0, x1, 0.36, z1, frame, true),
    box(x0 + 0.03, 0.36, z0 + 0.03, x1 - 0.03, 0.52, z1 - 0.03, sheet),
  ];
  const hb = metal ? C.black : frame;
  const pillow = (px0: number, pz0: number, px1: number, pz1: number) => out.push(box(px0, 0.52, pz0, px1, 0.64, pz1, '#f4f1ea'));
  const w = x1 - x0, d = z1 - z0;
  if (head === 'n') { out.push(box(x0, 0, z0 - 0.06, x1, 1.05, z0, hb)); pillow(x0 + 0.1, z0 + 0.08, x0 + w / 2 - 0.05, z0 + 0.45); if (w > 1.2) pillow(x0 + w / 2 + 0.05, z0 + 0.08, x1 - 0.1, z0 + 0.45); }
  if (head === 'e') { out.push(box(x1, 0, z0, x1 + 0.06, 1.05, z1, hb)); pillow(x1 - 0.45, z0 + 0.1, x1 - 0.08, z0 + d / 2 - 0.05); if (d > 1.2) pillow(x1 - 0.45, z0 + d / 2 + 0.05, x1 - 0.08, z1 - 0.1); }
  if (head === 's') { out.push(box(x0, 0, z1, x1, 1.05, z1 + 0.06, hb)); pillow(x0 + 0.1, z1 - 0.45, x1 - 0.1, z1 - 0.08); }
  if (head === 'w') { out.push(box(x0 - 0.06, 0, z0, x0, 1.05, z1, hb)); pillow(x0 + 0.08, z0 + 0.1, x0 + 0.45, z1 - 0.1); }
  if (metal) {
    // the kids' beds have turned wooden posts on black metal frames
    for (const [px, pz] of head === 'n' ? [[x0, z0], [x1, z0]] as XZ[] : [[x0, z1], [x1, z1]] as XZ[]) out.push(cyl(px, 0, pz, 0.04, 1.15, C.oak));
  }
  return out;
}

/** A low-poly sofa facing `face`. */
function sofa(x0: number, z0: number, x1: number, z1: number, face: 'n' | 's' | 'e' | 'w', color: string): P {
  const out: P = [box(x0, 0, z0, x1, 0.42, z1, color, true)];
  const t = 0.22;
  if (face === 'e') out.push(box(x0, 0.42, z0, x0 + t, 0.85, z1, color), box(x0, 0.42, z0, x1, 0.62, z0 + 0.18, color), box(x0, 0.42, z1 - 0.18, x1, 0.62, z1, color));
  if (face === 'w') out.push(box(x1 - t, 0.42, z0, x1, 0.85, z1, color), box(x0, 0.42, z0, x1, 0.62, z0 + 0.18, color), box(x0, 0.42, z1 - 0.18, x1, 0.62, z1, color));
  if (face === 'n') out.push(box(x0, 0.42, z1 - t, x1, 0.85, z1, color), box(x0, 0.42, z0, x0 + 0.18, 0.62, z1, color), box(x1 - 0.18, 0.42, z0, x1, 0.62, z1, color));
  if (face === 's') out.push(box(x0, 0.42, z0, x1, 0.85, z0 + t, color), box(x0, 0.42, z0, x0 + 0.18, 0.62, z1, color), box(x1 - 0.18, 0.42, z0, x1, 0.62, z1, color));
  return out;
}

/** Dark-wood base cabinets with a counter top and door seams. */
function cabinets(x0: number, z0: number, x1: number, z1: number, h = 0.9): P {
  return [
    box(x0, 0, z0, x1, h - 0.04, z1, C.darkWood, true),
    box(x0 - 0.02, h - 0.04, z0 - 0.02, x1 + 0.02, h, z1 + 0.02, C.counter),
    box(x0, 0, z0, x1, 0.08, z1, C.counter),
  ];
}

function ceilingLight(x: number, z: number, along: 'x' | 'z' = 'x'): P {
  const l = 0.6, w = 0.07;
  return along === 'x'
    ? [box(x - l, CEIL_H - 0.06, z - w, x + l, CEIL_H - 0.005, z + w, '#ffffff', false, { emissive: true })]
    : [box(x - w, CEIL_H - 0.06, z - l, x + w, CEIL_H - 0.005, z + l, '#ffffff', false, { emissive: true })];
}

function pottedPlant(x: number, z: number, s = 1): P {
  return [
    cyl(x, 0, z, 0.2 * s, 0.35 * s, '#a0522d', true, 10, 0.24 * s),
    { kind: 'cone', base: [x, 0.35 * s, z], r: 0.32 * s, h: 0.9 * s, color: '#3f8f3a', seg: 6 },
    { kind: 'cone', base: [x, 0.7 * s, z], r: 0.24 * s, h: 0.7 * s, color: '#4fa646', seg: 6 },
  ];
}

// ── Furniture, room by room ─────────────────────────────────────────────────
export const PROPS: Prim[] = [
  // Lounge — TV wall to the east, sofas, rug, round coffee table
  box(10.5, 0, 7.1, 10.92, 0.5, 9.3, C.oak, true),
  box(10.52, 0.05, 7.2, 10.54, 0.45, 8.1, '#8f6d43'),
  box(10.7, 0.5, 7.9, 10.78, 0.56, 8.5, C.black),
  box(10.74, 0.56, 7.45, 10.8, 1.35, 8.95, C.black, false, { tex: 'tv:-x' }),
  box(7.5, 0, 6.6, 10.3, 0.006, 10.2, C.rug, false, { tex: 'rug:+y' }),
  ...sofa(7.3, 6.7, 8.2, 9.5, 'e', C.sofa),
  ...sofa(8.0, 10.6, 10.0, 11.5, 'n', C.sofa2),
  cyl(9.3, 0, 8.2, 0.42, 0.45, '#5f4a35', true, 16),
  cyl(9.3, 0.45, 8.2, 0.44, 0.03, '#3e3024', false, 16),
  ...pottedPlant(10.55, 12.5),
  ...ceilingLight(8.6, 6.5), ...ceilingLight(8.6, 10.6),
  box(10.4, 0, 3.0, 10.9, 0.75, 3.6, C.oak, true),           // side table under the lounge window

  // Pillar between counter and lounge, with the "Welcome Home" key holder
  box(5.95, 0, 8.1, 6.45, WALL_H, 8.6, C.wall, true),
  box(6.45, 1.5, 8.18, 6.47, 1.68, 8.52, C.frameWood, false, { tex: 'welcome:+x' }),

  // Kitchen — cabinets along the back wall, stove, fridge by the hallway, island, peninsula
  ...cabinets(0.1, 2.6, 1.5, 3.2),
  box(1.5, 0, 2.6, 2.25, 0.9, 3.2, C.steel, true),
  box(1.52, 0.12, 3.2, 2.23, 0.62, 3.21, '#2a2c2f'),
  cyl(1.68, 0.9, 2.78, 0.07, 0.02, C.black), cyl(2.07, 0.9, 2.78, 0.07, 0.02, C.black),
  cyl(1.68, 0.9, 3.02, 0.07, 0.02, C.black), cyl(2.07, 0.9, 3.02, 0.07, 0.02, C.black),
  cyl(2.07, 0.92, 2.95, 0.16, 0.18, '#c9cdd1'),               // pot on the stove
  ...cabinets(2.25, 2.6, 3.9, 3.2),
  box(0.4, 1.45, 2.6, 1.45, 2.2, 2.95, C.darkWood),           // upper cabinets
  box(2.4, 1.45, 2.6, 3.9, 2.2, 2.95, C.darkWood),
  box(1.55, 1.75, 2.6, 2.2, 1.95, 2.95, '#8b9196'),           // range hood
  box(0.15, 0.9, 2.58, 3.9, 1.45, 2.6, '#f2f0ea'),            // splashback tiles
  box(3.95, 0, 2.62, 4.75, 1.75, 3.32, C.fridge, true),       // fridge, right next to the hallway
  box(4.0, 1.05, 3.32, 4.7, 1.06, 3.33, '#c8c7c2'),
  box(0.1, 0, 3.55, 0.7, 2.2, 4.75, C.darkWood, true),        // tall pantry cupboard
  box(0.7, 1.0, 4.1, 0.71, 1.4, 4.13, '#d9d9d9'),
  ...cabinets(0.1, 5.0, 0.7, 7.1),                             // sink run on the west wall
  box(0.18, 0.86, 5.6, 0.62, 0.91, 6.3, '#c7ccd0'),
  box(2.3, 0, 5.0, 3.3, 0.86, 6.2, C.darkWood, true),         // island
  box(2.25, 0.86, 4.95, 3.35, 0.9, 6.25, '#7a5a2e'),
  cyl(2.8, 0.9, 5.45, 0.22, 0.14, C.basinLime, false, 14, 0.27),
  ...cabinets(5.65, 4.9, 6.3, 8.1, 0.95),                      // peninsula counter
  box(6.2, 0.95, 4.9, 6.3, 1.12, 8.1, C.darkWood),            // its raised back lip
  cyl(5.95, 0.95, 7.2, 0.09, 0.26, '#d8d2c6'),                // kettle
  cyl(5.9, 0.95, 6.3, 0.15, 0.1, '#c9cdd1'),                  // bowl
  ...ceilingLight(2.6, 4.2), ...ceilingLight(2.6, 7.0),
  box(0, CEIL_H - 0.18, 8.45, 5.95, CEIL_H, 8.6, C.trim),     // ceiling beam over kitchen | dining

  // Dining & office — long table, grey chairs, desk under the west window
  box(2.4, 0.72, 9.4, 3.5, 0.78, 12.0, '#5a3220', true),
  box(2.45, 0, 9.45, 2.55, 0.72, 9.55, '#4a2818', true), box(3.35, 0, 9.45, 3.45, 0.72, 9.55, '#4a2818', true),
  box(2.45, 0, 11.85, 2.55, 0.72, 11.95, '#4a2818', true), box(3.35, 0, 11.85, 3.45, 0.72, 11.95, '#4a2818', true),
  box(2.42, 0, 9.42, 3.48, 0.72, 11.98, 'transparent', true),  // collision skirt for the table
  ...chair(2.05, 9.9, 'e'), ...chair(2.05, 10.8, 'e'), ...chair(2.05, 11.6, 'e'),
  ...chair(3.85, 9.9, 'w'), ...chair(3.85, 10.8, 'w'), ...chair(3.85, 11.6, 'w'),
  box(2.95, 0.78, 10.3, 3.25, 0.98, 10.9, '#c79a3b'),         // pineapples / fruit bowl
  box(0.15, 0.72, 9.0, 0.9, 0.76, 10.7, '#6a3c22', true),
  box(0.17, 0, 9.02, 0.88, 0.72, 10.68, '#5a321c', true),
  box(0.35, 0.76, 9.5, 0.4, 1.15, 10.1, C.black),             // monitor
  box(0.38, 0.76, 9.7, 0.6, 0.8, 9.9, C.black),
  box(0.5, 0.76, 10.15, 0.78, 0.78, 10.55, '#3b3d41'),        // laptop
  box(0.15, 0, 11.2, 0.75, 0.62, 11.85, C.black, true),        // printer cabinet
  box(0.2, 0.62, 11.25, 0.7, 0.86, 11.8, '#2b2d31'),          // printer
  ...chair(1.25, 9.8, 'w', '#222326'),
  box(4.6, 0, 12.25, 5.25, 1.7, 12.9, '#b8bcc0', true),       // stainless fridge
  box(5.5, 0, 12.4, 5.95, 1.1, 12.85, '#c9ccce', true),       // water dispenser
  box(5.6, 1.1, 12.5, 5.85, 1.45, 12.75, '#dfe6ea'),
  box(6.115, 1.85, 10.0, 6.125, 2.25, 10.4, '#2b2f33', false, { tex: 'clock:-x' }),
  ...ceilingLight(3.0, 10.7, 'z'),

  // Hallway — ceiling hatch and a tube light
  box(5.25, CEIL_H - 0.01, -1.6, 5.95, CEIL_H, -0.9, '#3a3631'),
  ...ceilingLight(5.6, 0.8, 'z'),

  // Kids' room — two single beds, mosquito net, laundry basket, mat
  ...bed(6.45, -0.8, 7.45, 1.15, 'n', C.sheetBeige, C.oak, true),
  ...bed(8.35, -0.8, 9.35, 1.15, 'n', C.sheetWhite, C.oak, true),
  { kind: 'cone', base: [8.85, 1.35, 0.15], r: 0.62, h: 1.18, color: '#ffffff', seg: 14, opacity: 0.42 },
  cyl(8.85, 1.25, 0.15, 0.11, 0.18, '#ffffff'),
  cyl(7.95, 0, 2.05, 0.24, 0.42, C.pink, true, 14, 0.27),
  box(9.6, 0, 1.4, 10.4, 0.01, 1.9, '#b9b2a4'),
  ...ceilingLight(8.6, 0.8),

  // Bedroom 3 — double bed under the window, fan, ironing board, chair
  ...bed(8.9, -3.2, 10.9, -1.7, 'e', '#c9ccd2', '#d8d4cc'),
  box(7.2, 0.82, -3.88, 8.5, 0.86, -3.52, '#d39aa8', true),   // ironing board
  box(7.4, 0, -3.75, 7.44, 0.82, -3.65, '#555'), box(8.26, 0, -3.75, 8.3, 0.82, -3.65, '#555'),
  cyl(8.1, 0.86, -3.7, 0.08, 0.12, '#3b3b40'),                // iron
  cyl(7.9, 0, -2.45, 0.22, 0.04, C.black, true, 12),          // fan base
  cyl(7.9, 0.04, -2.45, 0.025, 1.1, C.black, false, 8),       // fan pole (head is animated)
  ...chair(6.95, -1.35, 'e', '#5b4a40'),
  ...ceilingLight(8.6, -2.45),

  // Main bedroom — double bed against the north wall, wardrobe, blue mat
  ...bed(7.2, -7.5, 8.8, -5.4, 'n', C.quilt, '#5e2f1b'),
  box(10.3, 0, -7.45, 10.9, 2.1, -5.6, C.darkWood, true),     // wardrobe
  box(10.29, 0.1, -6.53, 10.3, 2.0, -6.52, '#3e1c10'),
  box(9.3, 0, -7.4, 9.8, 0.55, -6.9, C.darkWood, true),       // bedside drawers
  box(5.3, 0, -5.2, 6.0, 0.01, -4.5, '#3b82c4'),              // blue mat
  cyl(9.6, 0, -4.6, 0.25, 0.7, '#e8e6e0', true, 10),          // stack of toilet rolls (bought in bulk)
  ...ceilingLight(8.0, -5.8),

  // Bathroom — two stalls on the west, vanity by the door, mosaic band on the tiles
  box(4.3, 0, -1.25, 4.9, 0.85, -0.45, '#e9e7e1', true),      // vanity
  box(4.35, 0.85, -1.15, 4.85, 0.9, -0.55, '#d9d9d6'),
  box(4.86, 1.1, -1.1, 4.9, 1.8, -0.6, '#cfe6ee'),            // mirror
  box(0.15, 0, 1.6, 0.6, 0.4, 2.1, '#f2f2f0', true),          // toilet
  box(0.12, 0.4, 1.6, 0.3, 0.85, 2.1, '#f2f2f0', true),
  cyl(0.95, 0.001, -0.45, 0.06, 0.004, '#8a8f94'),            // shower drain
  cyl(0.25, 1.9, -0.45, 0.08, 0.06, '#c0c4c8'),               // shower head
  ...ceilingLight(3.6, 0.6, 'z'),

  // Back room — laundry and storage by the back door
  box(0.15, 0, -6.4, 0.8, 0.85, -5.75, '#f0f0ec', true),      // washing machine
  cyl(0.8, 0.45, -6.08, 0.18, 0.005, '#3a4148'),
  box(3.6, 0, -7.45, 4.85, 1.8, -7.0, '#7b5a3c', true),       // shelves
  box(3.7, 0.9, -7.4, 4.1, 1.2, -7.05, '#c79a5b'), box(4.2, 0.9, -7.4, 4.75, 1.25, -7.05, '#b98a4b'),
  box(3.7, 1.35, -7.4, 4.3, 1.62, -7.05, '#d6a868'),
  box(0.15, 0, -3.0, 1.0, 0.6, -2.0, '#c79a5b', true),        // boxes
  box(0.2, 0.6, -2.9, 0.85, 1.0, -2.3, '#b98a4b', true),
  box(1.05, 2.15, -7.42, 1.85, 2.4, -7.4, '#16a34a', false, { emissive: true, tex: 'exit:+z' }),
  ...ceilingLight(2.5, -4.5),

  // Veranda — wrought-iron railing, posts, a chair, plants
  cyl(6.32, 0, 15.08, 0.07, CEIL_H, C.grille, true, 10), cyl(10.88, 0, 15.08, 0.07, CEIL_H, C.grille, true, 10),
  ...chair(10.55, 14.6, 'w', '#6b4a33'),
  ...pottedPlant(6.6, 14.8, 1.1),
];

// The veranda railing (white wrought iron) — posts and rails, all solid.
function railing(): P {
  const out: P = [];
  const top = 1.0;
  const run = (x0: number, z0: number, x1: number, z1: number) => {
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    const len = alongX ? x1 - x0 : z1 - z0;
    const n = Math.max(2, Math.round(Math.abs(len) / 0.14));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t;
      out.push(box(x - 0.012, 0, z - 0.012, x + 0.012, top, z + 0.012, C.grille));
    }
    out.push(alongX
      ? box(Math.min(x0, x1), top - 0.04, z0 - 0.04, Math.max(x0, x1), top + 0.02, z0 + 0.04, C.grille, true)
      : box(x0 - 0.04, top - 0.04, Math.min(z0, z1), x0 + 0.04, top + 0.02, Math.max(z0, z1), C.grille, true));
    out.push(alongX
      ? box(Math.min(x0, x1), 0, z0 - 0.06, Math.max(x0, x1), top, z0 + 0.06, 'transparent', true)
      : box(x0 - 0.06, 0, Math.min(z0, z1), x0 + 0.06, top, Math.max(z0, z1), 'transparent', true));
  };
  run(6.25, 15.15, 11.0, 15.15);
  run(10.95, 13.1, 10.95, 15.15);
  run(6.25, 13.1, 6.25, 15.15);
  return out;
}
PROPS.push(...railing());

// The back landing and the yard beyond it: low invisible bounds so the run
// ends on the steps, and a small sign that says you made it.
PROPS.push(
  box(0.55, 0, -9.4, 0.65, 1.2, -7.6, 'transparent', true),
  box(2.25, 0, -9.4, 2.35, 1.2, -7.6, 'transparent', true),
  box(0.55, 0, -9.5, 2.35, 1.2, -9.4, 'transparent', true),
);

// ── Collectibles: twelve tech parts for an IT shop ─────────────────────────
export const COLLECTIBLES: Collectible[] = [
  { id: 'c1', kind: 'ram', name: 'RAM stick', pos: [7.2, 0.7, 14.2], room: 'veranda' },
  { id: 'c2', kind: 'mouse', name: 'Wireless mouse', pos: [6.75, 0.55, 8.0], room: 'lounge' },
  { id: 'c3', kind: 'hdmi', name: 'HDMI cable', pos: [10.1, 0.6, 6.2], room: 'lounge' },
  { id: 'c4', kind: 'cpu', name: 'CPU chip', pos: [2.8, 1.3, 5.75], room: 'kitchen' },
  { id: 'c5', kind: 'usb', name: 'USB drive', pos: [0.62, 1.05, 9.35], room: 'dining' },
  { id: 'c6', kind: 'ssd', name: 'SSD', pos: [5.6, 0.6, 0.0], room: 'hall' },
  { id: 'c7', kind: 'battery', name: 'Laptop battery', pos: [5.6, 0.6, -3.0], room: 'hall' },
  { id: 'c8', kind: 'sim', name: 'Phone SIM card', pos: [7.9, 0.55, 0.3], room: 'kids' },
  { id: 'c9', kind: 'fan', name: 'Cooling fan', pos: [7.3, 0.6, -1.9], room: 'bed3' },
  { id: 'c10', kind: 'router', name: 'Wi-Fi router', pos: [6.3, 0.55, -6.8], room: 'master' },
  { id: 'c11', kind: 'hdd', name: 'Hard drive', pos: [1.1, 0.55, -0.5], room: 'bath' },
  { id: 'c12', kind: 'gpu', name: 'Graphics card', pos: [3.6, 0.6, -5.0], room: 'back' },
];

/** Where the Golden Chip can hide. One is picked at random for each run. */
export const GOLDEN_SPOTS: { pos: XYZ; room: string }[] = [
  { pos: [0.45, 0.35, 2.15], room: 'bath' },       // in the toilet stall, by the wall
  { pos: [4.35, 1.98, 3.0], room: 'kitchen' },     // on top of the fridge
  { pos: [0.5, 0.35, -6.75], room: 'back' },       // behind the washing machine
  { pos: [10.6, 0.35, -4.4], room: 'master' },     // the corner past the wardrobe
  { pos: [10.65, 0.35, -1.15], room: 'bed3' },     // the corner by the window
  { pos: [10.75, 0.35, 9.65], room: 'lounge' },    // tucked past the end of the TV unit
];

export const SPAWN = { pos: [9.45, 0, 14.3] as XYZ, yaw: 0 };   // on the veranda, in front of the sliding half of the door (yaw 0 looks north, -z)

/** Step in here (through the open back door) and the run is won. */
export const EXIT_ZONE = { x0: 0.7, x1: 2.2, z0: -9.0, z1: -7.85 };

/** The study poster: the isometric database-index figure, on the dining wall facing the lounge. */
export const POSTER = { x: 6.29, y: 1.55, z: 10.9, w: 1.25, h: 0.93, facing: 'east' as const };

// ── Small geometry helpers shared by the renderer, collision and minimap ────
export function roomAt(x: number, z: number): Room | undefined {
  return ROOMS.find((r) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1);
}

export interface Rect { x0: number; z0: number; x1: number; z1: number }

/** The solid pieces of one wall run, in plan: every span that is not a door or gap, and window spans too (sills block). */
export function wallSolidRects(wall: WallRun): Rect[] {
  const passable = wall.openings.filter((o) => o.kind !== 'window').sort((a, b) => a.from - b.from);
  const spans: [number, number][] = [];
  let cursor = wall.from;
  for (const o of passable) {
    if (o.from > cursor) spans.push([cursor, o.from]);
    cursor = Math.max(cursor, o.to);
  }
  if (cursor < wall.to) spans.push([cursor, wall.to]);
  const h = wall.t / 2;
  return spans.map(([a, b]) =>
    wall.at === 'x' ? { x0: wall.line - h, x1: wall.line + h, z0: a, z1: b } : { x0: a, x1: b, z0: wall.line - h, z1: wall.line + h },
  );
}
