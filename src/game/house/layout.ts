// The house and its compound, as data. Everything the renderer draws and
// everything the collision and minimap code tests comes from this one file, so
// the walls you see are the walls you bump into.
//
// Units are metres. x runs east (right when you stand on the road looking at
// the house), z runs south toward the road, y is up. The house floor is y = 0.
// The plan is an estimate worked out from the owner's photos: a long veranda
// across the front with tiled stairs down to the driveway, lounge and
// dining/office behind it, the kitchen with a back door onto a small balcony
// and concrete side stairs, a hallway past the kids' room, bathroom and
// bedroom 3 to the main bedroom, and a back room with steps down to the back
// walkway. The site slopes: the back yard and carport sit 0.6 m below the
// floor and the driveway falls about 3 m to the road, where the front gate is
// the way out.

export type XZ = [number, number];
export type XYZ = [number, number, number];

export const WALL_H = 2.6;
export const CEIL_H = 2.55;
export const DOOR_TOP = 2.05;
export const EXT_T = 0.2;
export const INT_T = 0.15;

export type FloorKind = 'tile' | 'bath' | 'veranda' | 'concrete' | 'grass' | 'deck' | 'stairs' | 'road';

export interface Room {
  id: string;
  name: string;
  x0: number; x1: number; z0: number; z1: number;
  floor: FloorKind;
  /** Rooms with a roof over them get a ceiling. */
  ceiling: boolean;
  /** Tile skin on the inside faces (the bathroom's white tiles and mosaic band). */
  tiled?: boolean;
  /** Outside spaces: windows can't be opened from here. */
  outside?: boolean;
  /** At ground level, so its floor follows the slope of the site. */
  ground?: boolean;
  /** Counts toward "areas explored". */
  area?: boolean;
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
  /** Floor height under the hinge (defaults to the house floor, 0). */
  base?: number;
  /** 'wood' is a solid door; 'grille' the white scroll ironwork; 'bars' a plain steel gate. */
  style?: 'wood' | 'grille' | 'bars';
  /** Panel height (defaults to a door height). */
  height?: number;
  /** Another door that opens and shuts with this one (the two leaves of the front gate). */
  pair?: string;
  /** Swings the other way when you're standing where it would open (the gates, which have room on both sides). */
  bothWays?: boolean;
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
  /** `crawl`: a crawling baby fits under it (table skirts and desk blocks). */
  | { kind: 'box'; min: XYZ; max: XYZ; color: string; solid?: boolean; emissive?: boolean; tex?: string; crawl?: boolean }
  /** `axis`: 'y' (default) stands up from `base`; 'x' or 'z' lies along that axis, centred on `base` (wheels, a satellite dish). */
  | { kind: 'cyl'; base: XYZ; r: number; h: number; color: string; solid?: boolean; seg?: number; top?: number; axis?: 'x' | 'y' | 'z' }
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
  rail: '#8e979c',
  stepTile: '#c0602e',
  plaster: '#e6e3db',
  pebble: '#d6d1c4',
} as const;

// ── The slope of the site ───────────────────────────────────────────────────
/** Back yard, walkway, carport and storeroom: 0.6 m below the house floor. */
export const BACK_Y = -0.6;
/** The road out front. */
export const ROAD_Y = -3.6;
const SLOPE_FROM = 2.4;   // the ground starts falling at the front of the carport…
const SLOPE_TO = 22.5;    // …and reaches the road here
/** z values where the ground changes slope (meshes put a vertex row on each). */
export const GROUND_BREAKS = [SLOPE_FROM, SLOPE_TO];

/** Ground height outdoors. It depends only on z: the site falls toward the road. */
export function groundY(z: number): number {
  if (z <= SLOPE_FROM) return BACK_Y;
  if (z >= SLOPE_TO) return ROAD_Y;
  return BACK_Y + (ROAD_Y - BACK_Y) * (z - SLOPE_FROM) / (SLOPE_TO - SLOPE_FROM);
}

export interface Platform { x0: number; x1: number; z0: number; z1: number; y: number }
/** Raised floors. Every edge is walled or railed except where stairs meet them. */
export const PLATFORMS: Platform[] = [
  { x0: -0.1, x1: 11.1, z0: -7.7, z1: 13.1, y: 0 },      // the house
  { x0: 0, x1: 12.3, z0: 13, z1: 15.4, y: 0 },           // front veranda
  { x0: -1.52, x1: 0, z0: 2.3, z1: 6.3, y: 0 },          // kitchen balcony
  { x0: -2.65, x1: -1.52, z0: 2.35, z1: 3.25, y: 0 },    // top of the side stairs
  { x0: 0.65, x1: 2.25, z0: -8.6, z1: -7.6, y: 0 },      // back landing
];

/** Stairs, walked as ramps: height runs linearly from y0 at z0 to y1 at z1. */
export interface Ramp { x0: number; x1: number; z0: number; z1: number; y0: number; y1: number; style: 'tile' | 'concrete' }
export const RAMPS: Ramp[] = [
  { x0: 11.1, x1: 12.28, z0: 9.6, z1: 13.0, y0: groundY(9.6), y1: 0, style: 'tile' },        // veranda stairs
  { x0: -2.65, x1: -1.52, z0: 3.25, z1: 5.25, y0: 0, y1: groundY(5.25), style: 'concrete' }, // side stairs
  { x0: 0.65, x1: 2.25, z0: -10.0, z1: -8.6, y0: BACK_Y, y1: 0, style: 'concrete' },         // back steps
];

/** Floor height anywhere: stairs, then raised floors, then the ground. */
export function heightAt(x: number, z: number): number {
  for (const r of RAMPS) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.y0 + (r.y1 - r.y0) * (z - r.z0) / (r.z1 - r.z0);
  for (const p of PLATFORMS) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return p.y;
  return groundY(z);
}

// ── Rooms and outdoor areas ─────────────────────────────────────────────────
// Order matters: roomAt() returns the first match, so stairs and raised floors
// come before the yards they sit over.
export const ROOMS: Room[] = [
  { id: 'lounge', name: 'Lounge', x0: 6.2, x1: 11, z0: 2.5, z1: 13, floor: 'tile', ceiling: true, area: true },
  { id: 'kitchen', name: 'Kitchen', x0: 0, x1: 6.2, z0: 2.5, z1: 8.5, floor: 'tile', ceiling: true, area: true },
  { id: 'dining', name: 'Dining & office', x0: 0, x1: 6.2, z0: 8.5, z1: 13, floor: 'tile', ceiling: true, area: true },
  { id: 'hall', name: 'Hallway', x0: 5.0, x1: 6.2, z0: -4.0, z1: 2.5, floor: 'tile', ceiling: true, area: true },
  { id: 'kids', name: "Kids' room", x0: 6.2, x1: 11, z0: -0.9, z1: 2.5, floor: 'tile', ceiling: true, area: true },
  { id: 'bed3', name: 'Bedroom 3', x0: 6.2, x1: 11, z0: -4.0, z1: -0.9, floor: 'tile', ceiling: true, area: true },
  { id: 'master', name: 'Main bedroom', x0: 5.0, x1: 11, z0: -7.6, z1: -4.0, floor: 'tile', ceiling: true, area: true },
  { id: 'bath', name: 'Bathroom', x0: 0, x1: 5.0, z0: -1.4, z1: 2.5, floor: 'bath', ceiling: true, tiled: true, area: true },
  { id: 'back', name: 'Back room', x0: 0, x1: 5.0, z0: -7.6, z1: -1.4, floor: 'tile', ceiling: true, area: true },
  { id: 'veranda', name: 'Front veranda', x0: 0, x1: 12.3, z0: 13, z1: 15.4, floor: 'veranda', ceiling: true, area: true },
  { id: 'balcony', name: 'Kitchen balcony', x0: -1.52, x1: 0, z0: 2.3, z1: 6.3, floor: 'veranda', ceiling: true, outside: true, area: true },
  { id: 'sidetop', name: 'Side stairs', x0: -2.65, x1: -1.52, z0: 2.35, z1: 3.25, floor: 'concrete', ceiling: false, outside: true },
  { id: 'sidestairs', name: 'Side stairs', x0: -2.65, x1: -1.52, z0: 3.25, z1: 5.25, floor: 'stairs', ceiling: false, outside: true },
  { id: 'vstairs', name: 'Veranda stairs', x0: 11.1, x1: 12.28, z0: 9.6, z1: 13.0, floor: 'stairs', ceiling: false, outside: true },
  { id: 'landing', name: 'Back steps', x0: 0.65, x1: 2.25, z0: -8.6, z1: -7.6, floor: 'deck', ceiling: false, outside: true },
  { id: 'backsteps', name: 'Back steps', x0: 0.65, x1: 2.25, z0: -10.0, z1: -8.6, floor: 'stairs', ceiling: false, outside: true },
  { id: 'storage', name: 'Storeroom', x0: 11.2, x1: 15.6, z0: -10.6, z1: -7.4, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true },
  { id: 'carport', name: 'Carport', x0: 11.1, x1: 15.6, z0: -7.4, z1: 2.4, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true },
  { id: 'walkway', name: 'Back walkway', x0: 2.25, x1: 11.2, z0: -9.75, z1: -7.7, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true },
  { id: 'driveway', name: 'Driveway', x0: 11.1, x1: 15.65, z0: 2.4, z1: 22.5, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true },
  { id: 'sidepath', name: 'Side path', x0: -2.7, x1: -0.1, z0: -7.7, z1: 15.4, floor: 'concrete', ceiling: false, outside: true, ground: true, area: true },
  { id: 'frontyard', name: 'Front garden', x0: -2.7, x1: 12.3, z0: 15.4, z1: 21.9, floor: 'grass', ceiling: false, outside: true, ground: true, area: true },
  { id: 'backyard', name: 'Back yard', x0: -2.7, x1: 15.65, z0: -14, z1: -7.7, floor: 'grass', ceiling: false, outside: true, ground: true, area: true },
  { id: 'road', name: 'Road', x0: -30, x1: 40, z0: 22.5, z1: 29, floor: 'road', ceiling: false, outside: true, ground: true },
];

// The house footprint (interior faces of the exterior walls sit 0.1 inside these).
export const HOUSE = { x0: 0, x1: 11, z0: -7.6, z1: 13 };

// ── Walls ───────────────────────────────────────────────────────────────────
export const WALLS: WallRun[] = [
  // Exterior
  { at: 'x', line: 0, from: -7.6, to: 13, t: EXT_T, exterior: true, outward: -1, openings: [
    { kind: 'window', id: 'w-back', from: -5.6, to: -4.4, sill: 1.0, top: DOOR_TOP },
    { kind: 'window', id: 'w-bath', from: 0.4, to: 1.0, sill: 1.45, top: 1.95 },
    { kind: 'door', id: 'kback', from: 3.3, to: 4.15 },
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
  { kind: 'hinged', id: 'kback', label: 'kitchen door', hinge: [0, 3.3], width: 0.85, closed: HALF_PI, swing: -HALF_PI, color: '#8a4a26', exterior: true },
  { kind: 'hinged', id: 'vgate', label: 'veranda gate', hinge: [11.13, 13.0], width: 1.12, closed: 0, swing: HALF_PI, color: '#b9bec2', exterior: true, style: 'grille', height: 2.0 , bothWays: true },
  { kind: 'hinged', id: 'sgate', label: 'side gate', hinge: [-2.63, 5.25], width: 1.08, closed: 0, swing: HALF_PI, color: C.rail, exterior: true, style: 'bars', height: 1.5, base: groundY(5.25) },
  { kind: 'hinged', id: 'cdoor', label: 'storeroom door', hinge: [14.2, -7.4], width: 0.8, closed: 0, swing: HALF_PI, color: '#e9e6de', exterior: true, base: BACK_Y },
  { kind: 'hinged', id: 'gateL', label: 'front gate', hinge: [12.47, 21.95], width: 1.5, closed: 0, swing: -HALF_PI, color: C.grille, exterior: true, style: 'grille', height: 1.5, base: groundY(21.95), pair: 'gateR' , bothWays: true },
  { kind: 'hinged', id: 'gateR', label: 'front gate', hinge: [15.48, 21.95], width: 1.5, closed: Math.PI, swing: HALF_PI, color: C.grille, exterior: true, style: 'grille', height: 1.5, base: groundY(21.95), pair: 'gateL' , bothWays: true },
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
/** A cylinder lying along x or z, centred on (x, y, z). */
const lying = (axis: 'x' | 'z', x: number, y: number, z: number, r: number, len: number, color: string, solid = false, seg = 16): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h: len, color, solid, seg, axis });

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

function pottedPlant(x: number, z: number, s = 1, y = 0): P {
  return [
    cyl(x, y, z, 0.2 * s, 0.35 * s, '#a0522d', true, 10, 0.24 * s),
    { kind: 'cone', base: [x, y + 0.35 * s, z], r: 0.32 * s, h: 0.9 * s, color: '#3f8f3a', seg: 6 },
    { kind: 'cone', base: [x, y + 0.7 * s, z], r: 0.24 * s, h: 0.7 * s, color: '#4fa646', seg: 6 },
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
  ...sofa(10.05, 9.6, 10.85, 10.4, 'w', '#d9875a'),           // the orange armchair beside the TV
  box(7.45, 0, 5.75, 8.15, 0.32, 6.45, '#c9b48a', true),      // baby's bassinet: stand…
  box(7.47, 0.32, 5.77, 8.13, 0.54, 6.43, '#e8d9b5'),         // …woven basket
  box(7.53, 0.4, 5.83, 8.07, 0.44, 6.37, '#f4f0ea'),          // …and mattress

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
  box(0.1, 0, 4.25, 0.7, 2.2, 5.45, C.darkWood, true),        // tall pantry cupboard, beside the back door
  box(0.7, 1.0, 4.8, 0.71, 1.4, 4.83, '#d9d9d9'),
  box(0.12, 2.2, 4.4, 0.24, 2.42, 4.52, '#c0392b'), box(0.3, 2.2, 4.4, 0.42, 2.42, 4.52, '#c0392b'),   // spray cans on top
  ...cabinets(0.1, 5.6, 0.7, 7.4),                             // sink run on the west wall
  box(0.18, 0.86, 6.1, 0.62, 0.91, 6.8, '#c7ccd0'),
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
  box(2.42, 0, 9.42, 3.48, 0.72, 11.98, 'transparent', true, { crawl: true }),  // collision skirt for the table
  ...chair(2.05, 9.9, 'e'), ...chair(2.05, 10.8, 'e'), ...chair(2.05, 11.6, 'e'),
  ...chair(3.85, 9.9, 'w'), ...chair(3.85, 10.8, 'w'), ...chair(3.85, 11.6, 'w'),
  box(2.95, 0.78, 10.3, 3.25, 0.98, 10.9, '#c79a3b'),         // pineapples / fruit bowl
  box(0.15, 0.72, 9.0, 0.9, 0.76, 10.7, '#6a3c22', true),
  box(0.17, 0, 9.02, 0.88, 0.72, 10.68, '#5a321c', true, { crawl: true }),
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
  ...ceilingLight(2.5, -4.5),

  // Veranda — storage at the west end, Grandpa's sofa, bench seats, posts, plant
  box(0.3, 0, 14.85, 2.0, 1.3, 15.2, '#c75b7a', true),        // mattress stood on end…
  box(0.25, 1.0, 14.8, 1.4, 1.36, 15.25, '#2563eb'),          // …under a blue tarp
  box(0.15, 0, 13.25, 0.55, 1.1, 14.3, '#9aa0a6', true),      // shoe rack
  box(0.2, 0.3, 13.35, 0.5, 0.38, 13.65, '#5eead4'), box(0.2, 0.62, 13.7, 0.5, 0.7, 14.0, '#f8fafc'), box(0.2, 0.92, 13.4, 0.5, 1.0, 13.7, '#a16207'),
  ...chair(1.25, 14.05, 's', '#6b7a8c'),
  cyl(2.25, 0, 14.55, 0.18, 0.62, '#a07a52', true, 10),        // wooden stool
  box(4.2, 0, 14.5, 6.2, 0.38, 15.25, '#7a5233', true),       // wooden-frame sofa
  box(4.25, 0.38, 14.55, 6.15, 0.5, 15.2, '#4a4444'),
  box(4.2, 0.5, 15.03, 6.2, 1.0, 15.25, '#4a4444'),
  box(4.2, 0.38, 14.5, 4.3, 0.7, 15.25, '#7a5233'), box(6.1, 0.38, 14.5, 6.2, 0.7, 15.25, '#7a5233'),
  box(7.0, 0, 14.8, 9.0, 0.4, 15.25, '#8a6038', true),        // bench seats with blue cushions
  box(7.05, 0.4, 14.82, 7.95, 0.5, 15.23, '#3d4f66'), box(8.05, 0.4, 14.82, 8.95, 0.5, 15.23, '#3d4f66'),
  ...pottedPlant(6.6, 14.8, 1.1),
  ...[0.4, 4.05, 8.05, 12.1].map((x) => cyl(x, 0, 15.2, 0.08, CEIL_H, C.grille, true, 10)),
  ...ceilingLight(6.2, 14.2),
];

// ── The compound ────────────────────────────────────────────────────────────
// Walls, railings and fences outside, all axis-aligned. Each one is solid to
// walk into; 'wall' and 'block' also block sight on the minimap.
export type BarrierKind = 'wall' | 'block' | 'fence' | 'rail' | 'grille' | 'low' | 'invisible';
export interface Barrier { a: XZ; b: XZ; kind: BarrierKind; h: number; t?: number; curb?: number }

export const BARRIERS: Barrier[] = [
  // front veranda: end wall, scroll-iron railing on the open sides
  { a: [0, 13.0], b: [0, 15.45], kind: 'wall', h: 2.6, t: 0.2 },
  { a: [0.1, 15.35], b: [12.28, 15.35], kind: 'grille', h: 1.0 },
  { a: [12.28, 13.0], b: [12.28, 15.35], kind: 'grille', h: 1.0 },
  // veranda stairs: steel rail on the driveway side, open at the bottom
  { a: [12.3, 9.85], b: [12.3, 13.0], kind: 'rail', h: 0.95, t: 0.06 },
  // kitchen balcony, and the block wall at the top of the side stairs
  { a: [-1.52, 2.3], b: [-0.1, 2.3], kind: 'rail', h: 1.0, t: 0.06 },
  { a: [-1.52, 3.2], b: [-1.52, 6.3], kind: 'rail', h: 1.0, t: 0.06 },
  { a: [-1.52, 6.3], b: [-0.1, 6.3], kind: 'rail', h: 1.0, t: 0.06 },
  { a: [-2.7, 2.35], b: [-1.52, 2.35], kind: 'block', h: 1.4, t: 0.15 },
  // back steps
  { a: [0.65, -9.75], b: [0.65, -7.7], kind: 'rail', h: 0.95, t: 0.06 },
  { a: [2.25, -9.75], b: [2.25, -7.7], kind: 'rail', h: 0.95, t: 0.06 },
  // carport and storeroom walls (the storeroom door sits in the gap at x 14.15–15.05)
  { a: [11.1, -7.4], b: [14.15, -7.4], kind: 'wall', h: 2.5, t: 0.15 },
  { a: [15.05, -7.4], b: [15.6, -7.4], kind: 'wall', h: 2.5, t: 0.15 },
  { a: [15.6, -10.6], b: [15.6, 2.4], kind: 'wall', h: 2.5, t: 0.15 },
  { a: [11.2, -10.6], b: [15.6, -10.6], kind: 'wall', h: 2.5, t: 0.15 },
  { a: [11.2, -10.6], b: [11.2, -9.6], kind: 'wall', h: 2.5, t: 0.15 },
  { a: [11.2, -8.6], b: [11.2, -7.4], kind: 'wall', h: 2.5, t: 0.15 },
  // boundary: chain-link on block posts; a white wall along the driveway and the road
  { a: [-2.7, -14], b: [-2.7, 21.9], kind: 'fence', h: 1.8 },
  { a: [-2.7, -14], b: [15.65, -14], kind: 'fence', h: 1.8 },
  { a: [15.65, -14], b: [15.65, 21.9], kind: 'fence', h: 1.8, curb: 0.6 },
  { a: [-2.7, 21.9], b: [12.25, 21.9], kind: 'fence', h: 1.7, curb: 0.9 },
  { a: [12.25, 21.9], b: [12.45, 21.9], kind: 'block', h: 1.75, t: 0.3 },   // gate pillars
  { a: [15.5, 21.9], b: [15.7, 21.9], kind: 'block', h: 1.75, t: 0.3 },
  // low wall between the front garden and the driveway, open near the bottom
  { a: [12.3, 15.45], b: [12.3, 19.5], kind: 'low', h: 0.6, t: 0.2 },
  // past the gate is the finish: keep runners in front of it
  { a: [12.25, 21.9], b: [12.25, 23.8], kind: 'invisible', h: 1, t: 0.1 },
  { a: [15.7, 21.9], b: [15.7, 23.8], kind: 'invisible', h: 1, t: 0.1 },
  { a: [12.25, 23.8], b: [15.7, 23.8], kind: 'invisible', h: 1, t: 0.1 },
];

export const barrierBlocksSight = (b: Barrier) => b.kind === 'wall' || b.kind === 'block';

/** The barrier's footprint in plan. */
export function barrierRect(b: Barrier): Rect {
  const h = (b.t ?? 0.1) / 2;
  return {
    x0: Math.min(b.a[0], b.b[0]) - (b.a[0] === b.b[0] ? h : 0),
    x1: Math.max(b.a[0], b.b[0]) + (b.a[0] === b.b[0] ? h : 0),
    z0: Math.min(b.a[1], b.b[1]) - (b.a[1] === b.b[1] ? h : 0),
    z1: Math.max(b.a[1], b.b[1]) + (b.a[1] === b.b[1] ? h : 0),
  };
}

export interface Tree { kind: 'palm' | 'banana' | 'bush' | 'breadfruit'; x: number; z: number; s: number }
/** `s` is a size factor (for palms, the height in metres). */
export const TREES: Tree[] = [
  // back yard: banana trees along the fence, one tall palm
  { kind: 'banana', x: -1.2, z: -11.8, s: 1 }, { kind: 'banana', x: 1.8, z: -12.9, s: 1.1 }, { kind: 'banana', x: 6.0, z: -12.6, s: 1 },
  { kind: 'banana', x: 9.4, z: -12.9, s: 1.05 }, { kind: 'banana', x: 12.8, z: -12.4, s: 1 }, { kind: 'palm', x: 4.2, z: -13.3, s: 6 },
  // front garden
  { kind: 'breadfruit', x: 3.0, z: 18.2, s: 1.2 }, { kind: 'bush', x: 0.6, z: 19.6, s: 1.0 }, { kind: 'bush', x: 6.8, z: 20.4, s: 0.9 },
  { kind: 'bush', x: 9.8, z: 19.0, s: 0.9 }, { kind: 'palm', x: -1.6, z: 17.2, s: 5.2 },
  // beyond the fences
  { kind: 'palm', x: -4.2, z: 6, s: 6 }, { kind: 'palm', x: -4.0, z: -3, s: 5.4 }, { kind: 'palm', x: 18.0, z: 9, s: 6.2 },
  { kind: 'palm', x: 18.4, z: -1, s: 5.6 }, { kind: 'palm', x: 16.9, z: -12, s: 6.4 }, { kind: 'breadfruit', x: 17.6, z: 15.5, s: 1.3 },
  { kind: 'breadfruit', x: 18.2, z: 3.5, s: 1.2 }, { kind: 'bush', x: -4.4, z: 12.5, s: 1.5 }, { kind: 'bush', x: -4.5, z: 0.5, s: 1.2 },
  { kind: 'bush', x: 18.5, z: -9, s: 1.4 }, { kind: 'bush', x: -4.0, z: -9.5, s: 1.5 }, { kind: 'banana', x: -4.2, z: -12.5, s: 1 },
];

/** Neighbouring houses, kept plain so they don't copy anyone's real home. */
export interface Neighbour { x0: number; x1: number; z0: number; z1: number; h: number; wall: string; roof: string }
export const NEIGHBOURS: Neighbour[] = [
  { x0: -13, x1: -5.5, z0: -4, z1: 9, h: 5.2, wall: '#e8e4da', roof: '#7a2f2f' },
  { x0: -12, x1: -5.5, z0: 12, z1: 20, h: 4.6, wall: '#dfe7ec', roof: '#3f8f5f' },
  { x0: -1, x1: 9, z0: -25, z1: -17, h: 4.8, wall: '#efe9dc', roof: '#9aa7b3' },
  { x0: 12, x1: 20, z0: -24, z1: -16.5, h: 4.4, wall: '#e8ecef', roof: '#5b8fbf' },
  { x0: 21, x1: 29, z0: -6, z1: 6, h: 5, wall: '#f1efe8', roof: '#c9cdd1' },
  { x0: -6, x1: 4, z0: 31, z1: 39, h: 5, wall: '#f3e6c9', roof: '#d08a3a' },
  { x0: 8, x1: 18, z0: 31, z1: 39, h: 5.4, wall: '#e3eef3', roof: '#7a8b99' },
];

// Outdoor furniture and clutter, from the photos.
const B = BACK_Y;
const picket = (x0: number, z: number, n: number, y: number): P => [
  ...Array.from({ length: n }, (_, i) => box(x0 + 0.05 + i * 0.2, y, z - 0.03, x0 + 0.13 + i * 0.2, y + 1.25, z + 0.03, '#f4f4f2')),
  box(x0, y + 0.3, z + 0.03, x0 + n * 0.2, y + 0.38, z + 0.07, '#f4f4f2'),
  box(x0, y + 0.9, z + 0.03, x0 + n * 0.2, y + 0.98, z + 0.07, '#f4f4f2'),
  box(x0, y, z - 0.07, x0 + n * 0.2, y + 1.25, z + 0.07, 'transparent', true),
];
PROPS.push(
  // kitchen balcony: blue bucket, a pot plant, washing over the rail
  cyl(-1.2, 0, 5.85, 0.15, 0.28, '#2563eb', true, 12, 0.18),
  ...pottedPlant(-1.15, 4.7, 0.55),
  box(-1.57, 0.35, 3.6, -1.47, 1.0, 4.2, '#b05d7a'), box(-1.57, 0.45, 4.3, -1.47, 1.0, 4.8, '#f1f1ef'), box(-1.57, 0.3, 4.9, -1.47, 1.0, 5.5, '#556b2f'),

  // side path: pot plants, a black corrugated sheet against the fence
  ...pottedPlant(-2.3, 7.0, 0.8, groundY(7.0)), ...pottedPlant(-2.3, 8.3, 0.7, groundY(8.3)),
  box(-2.64, groundY(12.6) - 0.05, 11.4, -2.58, groundY(11.4) + 1.8, 12.6, '#2b2d31', true),

  // back walkway: laundry tubs, gas bottles, wheelie bin, basin, posts and a slatted roof
  box(4.2, B, -8.32, 5.4, B + 0.88, -7.72, C.steel, true),
  box(4.28, B + 0.62, -8.24, 4.76, B + 0.89, -7.8, '#7d858c'), box(4.84, B + 0.62, -8.24, 5.32, B + 0.89, -7.8, '#7d858c'),
  box(4.95, B + 0.95, -7.78, 5.0, B + 1.15, -7.72, '#c0c4c8'),
  cyl(5.75, B, -7.95, 0.17, 0.62, '#c3c8cd', true, 12), cyl(3.85, B, -7.95, 0.17, 0.62, '#c3c8cd', true, 12),
  cyl(5.75, B + 0.62, -7.95, 0.05, 0.08, '#16a34a'), cyl(3.85, B + 0.62, -7.95, 0.05, 0.08, '#2563eb'),
  box(6.3, B, -8.35, 6.85, B + 0.95, -7.75, '#2f7d5b', true), box(6.27, B + 0.95, -8.38, 6.88, B + 1.02, -7.72, '#2a6e50'),
  cyl(5.95, B, -9.25, 0.15, 0.12, '#dc2626', false, 4),
  ...[3.2, 6.6, 10.0].map((x) => cyl(x, B, -9.62, 0.05, 2.5, '#9aa0a6', true, 8)),
  box(2.25, B + 2.5, -9.8, 11.2, B + 2.58, -7.6, '#a2a6a3'),
  box(2.25, B, -9.78, 11.2, B + 0.1, -9.7, C.pebble),
  box(2.5, B, -11.6, 4.0, B + 0.02, -10.9, '#2563eb'),                       // blue tarp on the lawn

  // carport: the Ranger's footprint, bench and crate on the side wall, bins, fence panels
  box(12.37, B, -5.25, 14.23, B + 1.9, 0.05, 'transparent', true),
  box(15.05, B, -1.4, 15.5, B + 0.45, 0.4, '#8a6a4a', true),
  box(15.0, B, 0.6, 15.52, B + 0.55, 1.2, '#7a4a2e', true),
  box(14.95, B, -6.5, 15.5, B + 1.0, -5.95, '#f2f2f0', true), box(14.6, B, -6.4, 14.92, B + 0.4, -6.0, '#1b1b1d'),
  ...picket(11.4, -7.26, 10, B),
  box(11.1, B + 2.3, 2.3, 15.6, B + 2.5, 2.45, '#6e5a44'),
  box(12.8, B + 2.36, -2.7, 13.8, B + 2.4, -2.6, '#ffffff', false, { emissive: true }),

  // storeroom: satellite dish, fence panels, crates, an old chair, spare wheels, a bulb
  lying('z', 14.4, B + 0.62, -10.4, 0.6, 0.06, '#e5e5e2', true, 24),
  box(14.38, B, -10.36, 14.42, B + 0.62, -10.3, '#9aa0a6'),
  ...picket(11.35, -10.42, 9, B),
  box(11.35, B, -8.4, 12.2, B + 0.7, -7.55, '#8a5a32', true), box(11.4, B + 0.7, -8.3, 12.0, B + 1.05, -7.65, '#a8743f'),
  box(13.0, B + 0.42, -9.3, 13.45, B + 0.47, -8.85, '#d97706', true),
  ...[[13.03, -9.27], [13.42, -9.27], [13.03, -8.88], [13.42, -8.88]].map(([x, z]) => box(x - 0.015, B, z - 0.015, x + 0.015, B + 0.42, z + 0.015, '#3b3b3e')),
  box(13.0, B + 0.47, -8.9, 13.45, B + 0.9, -8.85, '#d97706'),
  lying('x', 15.3, B + 0.33, -9.0, 0.33, 0.22, '#1d1f22', true), lying('x', 15.3, B + 0.33, -9.0, 0.2, 0.23, '#b8bcc0'),
  lying('x', 15.3, B + 0.33, -8.3, 0.33, 0.22, '#1d1f22', true), lying('x', 15.3, B + 0.33, -8.3, 0.2, 0.23, '#b8bcc0'),
  box(13.38, B + 2.2, -9.02, 13.42, B + 2.3, -8.98, '#fff7cc', false, { emissive: true }),
  box(11.2, B + 2.5, -10.6, 15.6, B + 2.6, -7.4, '#5f6468'),

  // the way out: a green sign on the gate pillar
  box(15.2, groundY(21.9) + 1.55, 21.72, 15.7, groundY(21.9) + 1.75, 21.74, '#16a34a', false, { emissive: true, tex: 'exit:-z' }),
);

// ── The family: where each one is when you play as someone else ─────────────
export type NpcPose = 'stand' | 'sit' | 'lie' | 'ipad' | 'floor';
export interface NpcSpot { pos: XYZ; yaw: number; pose: NpcPose; seat?: number; collide?: boolean }
/** Keyed by character id (see characters.ts). Yaw 0 faces north (-z). */
export const NPC_SPOTS: Record<string, NpcSpot> = {
  hussein: { pos: [5.2, 0, 14.92], yaw: 0, pose: 'sit', seat: 0.5 },          // on the veranda sofa
  josese: { pos: [1.36, 0, 9.8], yaw: HALF_PI, pose: 'sit', seat: 0.5 },      // at the office desk
  ronlyn: { pos: [7.6, 0, 7.3], yaw: -HALF_PI, pose: 'sit', seat: 0.42 },     // on the lounge sofa, next to the baby
  zane: { pos: [10.55, 0, 10.0], yaw: HALF_PI, pose: 'sit', seat: 0.42 },     // in the orange armchair
  mahala: { pos: [3.3, 0, 14.1], yaw: -HALF_PI, pose: 'ipad', collide: true }, // on the veranda with her iPad
  aisha: { pos: [7.8, 0.45, 6.1], yaw: HALF_PI, pose: 'lie' },                // in the bassinet by the sofa

  // aunties: round the dining table, and one at the kitchen counter
  nancy: { pos: [1.98, 0, 10.8], yaw: -HALF_PI, pose: 'sit', seat: 0.5 },
  louzanne: { pos: [3.92, 0, 9.9], yaw: HALF_PI, pose: 'sit', seat: 0.5 },
  alicia: { pos: [3.92, 0, 11.6], yaw: HALF_PI, pose: 'sit', seat: 0.5 },
  maria: { pos: [4.6, 0, 7.3], yaw: -HALF_PI, pose: 'stand', collide: true },     // by the kettle on the peninsula
  zoya: { pos: [7.5, 0, 15.02], yaw: 0, pose: 'sit', seat: 0.5 },                // on the veranda bench
  // uncles: in the carport with the Ranger, and out in the back yard
  mira: { pos: [15.33, BACK_Y, -0.5], yaw: HALF_PI, pose: 'sit', seat: 0.45 },  // on the carport bench
  fawzia: { pos: [15.33, BACK_Y, 0.08], yaw: HALF_PI, pose: 'sit', seat: 0.45 }, // beside Mira, her husband
  altaaf: { pos: [13.3, BACK_Y, -5.75], yaw: Math.PI, pose: 'stand', collide: true }, // looking under the Ranger's bonnet
  ravi: { pos: [10.0, BACK_Y, -11.0], yaw: HALF_PI, pose: 'stand', collide: true },
  hakeem: { pos: [9.0, BACK_Y, -11.0], yaw: -HALF_PI, pose: 'stand', collide: true },
  malvin: { pos: [4.3, groundY(17.6), 17.6], yaw: Math.PI, pose: 'stand', collide: true },  // in the front garden
  // cousins: playing out the back and in the front garden, one on the lounge sofa, one with Mahala
  mikhyle: { pos: [6.8, BACK_Y, -10.9], yaw: HALF_PI, pose: 'stand', collide: true },
  sarah: { pos: [5.6, BACK_Y, -10.9], yaw: -HALF_PI, pose: 'stand', collide: true },
  nabeeha: { pos: [2.85, BACK_Y + 0.02, -11.45], yaw: Math.PI, pose: 'floor', collide: true },   // on the blue tarp
  emaana: { pos: [3.6, BACK_Y + 0.02, -11.45], yaw: Math.PI, pose: 'floor', collide: true },
  rohan: { pos: [8.2, groundY(18.2), 18.2], yaw: HALF_PI, pose: 'stand', collide: true },
  kahaani: { pos: [6.4, groundY(18.6), 18.6], yaw: -HALF_PI, pose: 'stand', collide: true },
  yash: { pos: [9.3, 0, 11.15], yaw: 0, pose: 'sit', seat: 0.42 },               // on the grey sofa
  maanvi: { pos: [3.3, 0, 14.62], yaw: -HALF_PI, pose: 'stand', collide: true }, // next to Mahala and her iPad
};
export const CAT_SPOT = { pos: [5.95, BACK_Y, -8.5] as XYZ, yaw: 0.6 };

// ── Collectibles: twelve tech parts for an IT shop ─────────────────────────
export const COLLECTIBLES: Collectible[] = [
  { id: 'c1', kind: 'ram', name: 'RAM stick', pos: [7.2, 0.7, 14.2], room: 'veranda' },
  { id: 'c2', kind: 'mouse', name: 'Wireless mouse', pos: [6.75, 0.55, 8.0], room: 'lounge' },
  { id: 'c3', kind: 'hdmi', name: 'HDMI cable', pos: [11.65, BACK_Y + 0.55, -1.2], room: 'carport' },
  { id: 'c4', kind: 'cpu', name: 'CPU chip', pos: [2.8, 1.3, 5.75], room: 'kitchen' },
  { id: 'c5', kind: 'usb', name: 'USB drive', pos: [0.62, 1.05, 9.35], room: 'dining' },
  { id: 'c6', kind: 'ssd', name: 'SSD', pos: [5.6, 0.6, 0.0], room: 'hall' },
  { id: 'c7', kind: 'battery', name: 'Laptop battery', pos: [8.7, BACK_Y + 0.55, -8.85], room: 'walkway' },
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
  { pos: [10.6, 0.35, 11.8], room: 'lounge' },     // behind the pot plant by the slider
  { pos: [7.2, BACK_Y + 0.3, -7.95], room: 'walkway' },        // beside the green bin
  { pos: [15.25, BACK_Y + 0.3, -10.25], room: 'storage' },     // behind the satellite dish
  { pos: [13.3, BACK_Y + 1.15, -0.35], room: 'carport' },      // on the Ranger's tub cover
  { pos: [1.0, groundY(19.5) + 0.3, 19.5], room: 'frontyard' },   // under the hibiscus
  { pos: [-1.2, 0.3, 5.75], room: 'balcony' },                 // by the blue bucket
  { pos: [-2.35, groundY(12) + 0.3, 12.0], room: 'sidepath' },    // by the corrugated sheet
];

export const SPAWN = { pos: [9.45, 0, 14.3] as XYZ, yaw: 0 };   // on the veranda, in front of the sliding half of the door (yaw 0 looks north, -z)

/** Step out of the front gate onto the road and the run is won. */
export const EXIT_ZONE = { x0: 12.5, x1: 15.45, z0: 22.4, z1: 23.7 };

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
