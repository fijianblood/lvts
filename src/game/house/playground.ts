// Loma Castle Playground: a big bouncy castle, a slide, swings and benches, on
// the open ground east of the side road (up the side road from McFarlane Road,
// on your right). For exploring, with friends in the shared world.
//
// - The bouncy castle: in through the arch in its west wall, up a step onto
//   the bouncy floor. It throws you back up when you land (`bouncy` on its
//   room: the engine), walking bounces you, and a jump goes higher, but its
//   walls and netting keep you in and its roof keeps your head under it.
// - The slide: up the inflatable steps on its east side to the platform at the
//   top, then down the slide (`slide` on its ramp: you sit and slide down).
// - The swings: walk up to one and press E to sit on it; hold W to swing higher.
// - The benches: press E to sit down. (And Z sits you down anywhere.)
//
// Plain data, like the other places: ramps and platforms for the floor height,
// barriers for collision, props for what's drawn. The swings are drawn by the
// engine (they move), from SWINGS.

import type { Barrier, Prim, Platform, Ramp, Room, XZ } from './layout.ts';

/** The playground's plot, the gate in its fence on the side road's side, and its name. */
export const LOMA = { name: 'Loma Castle Playground', x0: 43, x1: 79, z0: -22, z1: 2.2, gate: [-15.2, -11.8] as XZ };
/** The bouncy castle: its plan, how high its bouncy floor is, its walls, roof and the doorway in its west wall. */
export const CASTLE = { x0: 49, x1: 63, z0: -20, z1: -8, rise: 0.45, wall: 0.6, wallH: 2.0, roof: 5.3, door: [-15.5, -12.5] as XZ };
/** The slide: the platform at the top (x0 to the climb's far side, z0 to top), the slide (x0..x1, top..end), the steps up (x1..climb, top..climbEnd). */
export const SLIDE = { x0: 65, x1: 69, climb: 71, z0: -21.5, top: -18.5, end: -10.5, climbEnd: -6.5, rise: 3.6 };
/** Swings hang from a beam along x at z, each `rope` long; you sit facing -z and swing along z. */
export const SWING_SET = { x0: 46.8, x1: 59.2, z: -3, beam: 2.75, rope: 2.2, at: [49.5, 53, 56.5] };

/** A seat you sit on with E: on a bench (its seat height above the ground) or on a swing (`swing`, an index into SWINGS). */
export interface Seat { id: string; label: string; x: number; z: number; yaw: number; seat: number; stand: XZ; swing?: number }
/** A swing: where its beam is (pivot, world y), its rope's length, and the floor under it. */
export interface Swing { x: number; z: number; pivot: number; rope: number; ground: number }

const RED = '#e02424', BLUE = '#1f6fe0', YELLOW = '#facc15', GREEN = '#22a35a', WHITE = '#f8fafc', NET = '#1f2937', TIMBER = '#a87444', STEEL = '#7b8794';

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 14): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg });
/** A sloping slab (a slide, or the top of a wall beside it): its top runs from y0 at z0 to y1 at z1, `thick` deep. */
const slope = (x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, thick: number, color: string): Prim =>
  ({ kind: 'slope', x0, x1, z0, z1, y0, y1, thick, color });

/** Everything for the playground on flat ground at height `g`. */
export function lomaCastle(g: number) {
  const props: Prim[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };
  const barriers: Barrier[] = [];
  /** An inflatable wall or rail you can never get over (it has no top): the castle's, the slide's. */
  const soft = (a: XZ, b: XZ, t = 0.3) => barriers.push({ a, b, kind: 'invisible', h: 2.5, t, mode: 'explore' });

  // ── the plot: a picket fence round it, the arch over the gate, soft mats under the castle and the swings ──
  const P = LOMA, [gz0, gz1] = P.gate;
  const fence = (a: XZ, b: XZ) => barriers.push({ a, b, kind: 'picket', h: 1.0, t: 0.08, mode: 'explore' });
  fence([P.x0, P.z0], [P.x1, P.z0]); fence([P.x1, P.z0], [P.x1, P.z1]); fence([P.x0, P.z1], [P.x1, P.z1]);
  fence([P.x0, P.z0], [P.x0, gz0]); fence([P.x0, gz1], [P.x0, P.z1]);
  add(
    box(P.x0 - 0.3, g, gz0 - 0.6, P.x0 + 0.3, g + 3.4, gz0, RED, true), box(P.x0 - 0.3, g, gz1, P.x0 + 0.3, g + 3.4, gz1 + 0.6, BLUE, true),
    ...[0.6, 1.5, 2.4].flatMap((h) => [box(P.x0 - 0.31, g + h, gz0 - 0.61, P.x0 + 0.31, g + h + 0.25, gz0 + 0.01, YELLOW), box(P.x0 - 0.31, g + h, gz1 - 0.01, P.x0 + 0.31, g + h + 0.25, gz1 + 0.61, YELLOW)]),
    box(P.x0 - 0.2, g + 3.0, gz0 - 0.6, P.x0 + 0.2, g + 4.1, gz1 + 0.6, YELLOW, false, { tex: 'lomasign:-x' }),
    box(P.x0 - 0.2, g + 3.0, gz0 - 0.6, P.x0 + 0.2, g + 4.1, gz1 + 0.6, YELLOW, false, { tex: 'lomasign:+x' }),
    box(P.x0 + 0.3, g + 0.004, gz0, CASTLE.x0 - 1.6, g + 0.012, gz1, '#d8c79f'),                 // a path from the gate to the castle
    box(CASTLE.x0 - 2, g + 0.004, CASTLE.z0 - 1.5, SLIDE.climb + 1.5, g + 0.012, CASTLE.z1 + 2.5, GREEN),   // soft green mats round the castle and the slide
    box(SWING_SET.x0 - 0.6, g + 0.004, SWING_SET.z - 2.3, SWING_SET.x1 + 0.6, g + 0.012, SWING_SET.z + 2.3, '#c4553a'),   // and under the swings
  );

  // ── the bouncy castle ──
  const C = CASTLE, [d0, d1] = C.door, f = g + C.rise, wt = f + C.wallH, roof = g + C.roof, W = C.wall;
  add(box(C.x0, g, C.z0, C.x1, f, C.z1, BLUE));                                                 // the inflated base
  for (let x = C.x0 + W, i = 0; x < C.x1 - W - 0.01; x += 1.6, i++) add(box(x, f, C.z0 + W, Math.min(x + 1.6, C.x1 - W), f + 0.012, C.z1 - W, i % 2 ? RED : YELLOW));   // the bouncy floor, striped
  // the walls: thick and soft, red with a yellow tube along the top; a doorway in the west wall
  const wallBox = (x0: number, z0: number, x1: number, z1: number) => {
    add(box(x0, f, z0, x1, wt, z1, RED));
    const alongX = x1 - x0 > z1 - z0;
    add({ kind: 'cyl', base: [(x0 + x1) / 2, wt, (z0 + z1) / 2], r: 0.2, h: alongX ? x1 - x0 : z1 - z0, color: YELLOW, axis: alongX ? 'x' : 'z', seg: 10 });
  };
  wallBox(C.x0, C.z0, C.x1, C.z0 + W); wallBox(C.x0, C.z1 - W, C.x1, C.z1);
  wallBox(C.x1 - W, C.z0, C.x1, C.z1);
  wallBox(C.x0, C.z0, C.x0 + W, d0); wallBox(C.x0, d1, C.x0 + W, C.z1);
  soft([C.x0 + W / 2, C.z0], [C.x0 + W / 2, d0], W); soft([C.x0 + W / 2, d1], [C.x0 + W / 2, C.z1], W);
  soft([C.x1 - W / 2, C.z0], [C.x1 - W / 2, C.z1], W);
  soft([C.x0, C.z0 + W / 2], [C.x1, C.z0 + W / 2], W); soft([C.x0, C.z1 - W / 2], [C.x1, C.z1 - W / 2], W);
  // the doorway: a soft step up between soft side cushions, a turret either side, a banner with the castle's name over it
  soft([C.x0 - 1.6, d0], [C.x0, d0]); soft([C.x0 - 1.6, d1], [C.x0, d1]);
  add(
    box(C.x0 - 1.6, g, d0, C.x0, g + 0.2, d1, YELLOW), box(C.x0 - 0.8, g + 0.2, d0, C.x0, g + 0.4, d1, YELLOW),
    box(C.x0 - 1.6, g, d0 - 0.15, C.x0, g + 0.75, d0 + 0.15, BLUE), box(C.x0 - 1.6, g, d1 - 0.15, C.x0, g + 0.75, d1 + 0.15, BLUE),
    cyl(C.x0, g, d0 - 0.45, 0.45, 3.4, YELLOW, true), cyl(C.x0, g, d1 + 0.45, 0.45, 3.4, YELLOW, true),
    { kind: 'cone', base: [C.x0, g + 3.4, d0 - 0.45], r: 0.55, h: 0.8, color: RED }, { kind: 'cone', base: [C.x0, g + 3.4, d1 + 0.45], r: 0.55, h: 0.8, color: RED },
    box(C.x0 - 0.12, wt, d0 - 0.2, C.x0 + 0.12, wt + 1.0, d1 + 0.2, WHITE, false, { tex: 'lomacastle:-x' }),
  );
  // a turret at each corner, above the roof, with a pointed top and a flag
  for (const [x, z] of [[C.x0, C.z0], [C.x1, C.z0], [C.x0, C.z1], [C.x1, C.z1]]) {
    add(cyl(x, g, z, 1.0, roof + 0.7 - g, RED, true, 16));
    for (const h of [1.2, 2.6, 4.0]) add(cyl(x, g + h, z, 1.03, 0.3, YELLOW, false, 16));
    add({ kind: 'cone', base: [x, roof + 0.7, z], r: 1.25, h: 1.6, color: BLUE, seg: 16 });
    add(cyl(x, roof + 2.3, z, 0.03, 0.9, STEEL, false, 6), box(x, roof + 2.85, z - 0.02, x + 0.6, roof + 3.2, z + 0.02, YELLOW));
  }
  // netting between the walls and the roof: dark cords, so you can see out
  const cords = (x0: number, z0: number, x1: number, z1: number) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.round(len / 0.45);
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
      add(box(x - 0.012, wt + 0.15, z - 0.012, x + 0.012, roof, z + 0.012, NET));
    }
    for (let h = wt + 0.6; h < roof - 0.1; h += 0.6) add(box(Math.min(x0, x1) - 0.012, h, Math.min(z0, z1) - 0.012, Math.max(x0, x1) + 0.012, h + 0.024, Math.max(z0, z1) + 0.012, NET));
  };
  const m = W / 2;
  cords(C.x0 + 1.0, C.z0 + m, C.x1 - 1.0, C.z0 + m); cords(C.x0 + 1.0, C.z1 - m, C.x1 - 1.0, C.z1 - m);
  cords(C.x1 - m, C.z0 + 1.0, C.x1 - m, C.z1 - 1.0);
  cords(C.x0 + m, C.z0 + 1.0, C.x0 + m, d0 - 0.9); cords(C.x0 + m, d1 + 0.9, C.x0 + m, C.z1 - 1.0);
  // the roof: a striped canopy with a scalloped edge
  for (let x = C.x0, i = 0; x < C.x1 - 0.01; x += 1.4, i++) add(box(x, roof, C.z0, Math.min(x + 1.4, C.x1), roof + 0.18, C.z1, i % 2 ? WHITE : RED));
  for (let x = C.x0 + 0.35; x < C.x1; x += 0.7) for (const z of [C.z0 - 0.05, C.z1 + 0.05]) add(box(x - 0.3, roof - 0.28, z - 0.03, x + 0.3, roof, z + 0.03, YELLOW));
  for (let z = C.z0 + 0.35; z < C.z1; z += 0.7) for (const x of [C.x0 - 0.05, C.x1 + 0.05]) add(box(x - 0.03, roof - 0.28, z - 0.3, x + 0.03, roof, z + 0.3, YELLOW));

  // ── the slide: a platform at the top, the slide down (two lanes), the inflatable steps up ──
  const S = SLIDE, top = g + S.rise;
  add(
    box(S.x0, g, S.z0, S.climb, top, S.top, BLUE),                                                   // under the platform
    box(S.x0, top, S.z0, S.climb, top + 0.012, S.top, YELLOW),
    // the slide's two lanes and the bump between them; its side walls follow it down
    slope(S.x0 + 0.35, S.x1 - 0.35, S.top, S.end, top, g + 0.02, 0.4, BLUE),
    slope((S.x0 + S.x1) / 2 - 0.08, (S.x0 + S.x1) / 2 + 0.08, S.top, S.end, top + 0.25, g + 0.27, 0.6, YELLOW),
    slope(S.x0, S.x0 + 0.35, S.top, S.end, top + 1.0, g + 0.8, S.rise + 1.0, RED),
    // the wall between the slide and the steps follows the steps (the higher of the two)
    slope(S.x1 - 0.35, S.x1 + 0.2, S.top, S.climbEnd, top + 1.0, g + 1.0, S.rise + 1.0, RED),
    slope(S.climb - 0.2, S.climb + 0.15, S.top, S.climbEnd, top + 1.0, g + 1.0, S.rise + 1.0, RED),
    // a soft landing at the bottom of the slide
    box(S.x0 + 0.35, g, S.end, S.x1 - 0.35, g + 0.02, S.end + 2.5, YELLOW),
    // round the platform's three open sides, soft rails
    box(S.x0, top, S.z0, S.climb, top + 1.1, S.z0 + 0.3, RED), box(S.x0, top, S.z0, S.x0 + 0.3, top + 1.1, S.top, RED),
    box(S.climb - 0.3, top, S.z0, S.climb, top + 1.1, S.top, RED),
    { kind: 'cyl', base: [(S.x0 + S.climb) / 2, top + 1.1, S.z0 + 0.15], r: 0.18, h: S.climb - S.x0, color: YELLOW, axis: 'x', seg: 10 },
  );
  const steps = Math.ceil(S.rise / 0.3);
  for (let i = 0; i < steps; i++) {
    const za = S.climbEnd + ((S.top - S.climbEnd) * i) / steps, zb = S.climbEnd + ((S.top - S.climbEnd) * (i + 1)) / steps;
    add(box(S.x1 + 0.2, g, za, S.climb - 0.2, g + (S.rise * (i + 1)) / steps, zb, i % 2 ? YELLOW : GREEN));   // each step, inflated down to the ground
  }
  soft([S.x0, S.z0], [S.climb, S.z0]); soft([S.x0, S.z0], [S.x0, S.end]); soft([S.climb, S.z0], [S.climb, S.climbEnd]);
  soft([S.x1, S.top], [S.x1, S.climbEnd]);
  // a sign at the bottom of the steps
  add(box(S.climb + 0.25, g + 1.1, S.climbEnd + 0.3, S.climb + 0.3, g + 1.7, S.climbEnd + 1.3, YELLOW, false, { tex: 'lomaslide:+x' }), box(S.climb + 0.3, g, S.climbEnd + 0.78, S.climb + 0.36, g + 1.1, S.climbEnd + 0.82, STEEL));

  // ── the swing set: posts and a beam (the swings themselves are the engine's: they move) ──
  const SW = SWING_SET;
  for (const x of [SW.x0, SW.x1]) for (const dz of [-0.9, 0.9]) add(cyl(x, g, SW.z + dz, 0.08, SW.beam + 0.1, BLUE, true, 10));
  for (const x of [SW.x0, SW.x1]) add(box(x - 0.06, g + 1.2, SW.z - 0.9, x + 0.06, g + 1.28, SW.z + 0.9, BLUE));
  add(box(SW.x0 - 0.1, g + SW.beam, SW.z - 0.07, SW.x1 + 0.1, g + SW.beam + 0.14, SW.z + 0.07, RED));
  const swings: Swing[] = SW.at.map((x) => ({ x, z: SW.z, pivot: g + SW.beam, rope: SW.rope, ground: g }));

  // ── benches, facing the castle and the slide; you sit on them with E ──
  const seats: Seat[] = [];
  const bench = (x: number, z: number, yaw: number) => {
    const fx = -Math.sin(yaw), fz = -Math.cos(yaw);          // the way you face when you sit
    const ax = Math.abs(fz) > 0.5;                            // the bench runs along x
    const hw = 0.8, hd = 0.22;
    const b = (a0: number, a1: number, b0: number, b1: number, y0: number, y1: number, color: string, solid = false) =>
      ax ? box(x + a0, g + y0, z + b0, x + a1, g + y1, z + b1, color, solid) : box(x + b0, g + y0, z + a0, x + b1, g + y1, z + a1, color, solid);
    const back = ax ? -fz : -fx;                               // the back is behind you
    add(
      b(-hw, hw, -hd, hd, 0.4, 0.46, TIMBER, true),
      b(-hw, hw, back * hd - 0.03, back * hd + 0.03, 0.55, 0.95, TIMBER),
      ...[-hw + 0.1, hw - 0.1].map((a) => b(a - 0.04, a + 0.04, -hd, hd, 0, 0.4, STEEL)),
    );
    seats.push({ id: `bench-${seats.length + 1}`, label: 'the bench', x, z, yaw, seat: 0.46, stand: [x + fx * 0.75, z + fz * 0.75] });
  };
  bench(66, 0.6, 0); bench(70, 0.6, 0);                       // facing north, toward the slide
  bench(76.5, -14, Math.PI / 2); bench(76.5, -9, Math.PI / 2); // facing west, toward the slide's steps
  bench(45.2, -3, -Math.PI / 2);                              // facing east, toward the swings
  swings.forEach((s, i) => seats.push({ id: `swing-${i + 1}`, label: 'the swing', x: s.x, z: s.z, yaw: 0, seat: 0, stand: [s.x, s.z - 1.6], swing: i }));

  // ── floors: the bouncy floor and the step up to it; the slide, its platform and the steps ──
  const ramps: Ramp[] = [
    { x0: C.x0 - 1.6, x1: C.x0 + W, z0: d0, z1: d1, y0: g, y1: f, axis: 'x', style: 'drawn' },
    { x0: S.x0, x1: S.x1, z0: S.top, z1: S.end, y0: top, y1: g, style: 'drawn', slide: true },
    { x0: S.x1, x1: S.climb, z0: S.top, z1: S.climbEnd, y0: top, y1: g, style: 'drawn' },
  ];
  const platforms: Platform[] = [
    { x0: C.x0 + W, x1: C.x1 - W, z0: C.z0 + W, z1: C.z1 - W, y: f },
    { x0: S.x0, x1: S.climb, z0: S.z0, z1: S.top, y: top },
  ];
  const rooms: Room[] = [
    // (most particular first: where rooms overlap, the first wins)
    { id: 'loma-castle', name: 'Loma Castle', x0: C.x0 + W, x1: C.x1 - W, z0: C.z0 + W, z1: C.z1 - W, y: f, floor: 'grass', ceiling: false, outside: true, explore: true, cap: roof - 0.05, bouncy: true },
    { id: 'loma-slide', name: 'Loma Castle slide', x0: S.x0, x1: S.climb, z0: S.z0, z1: S.climbEnd, floor: 'grass', ceiling: false, outside: true, explore: true },
    { id: 'loma', name: LOMA.name, x0: P.x0, x1: P.x1, z0: P.z0, z1: P.z1, floor: 'grass', ceiling: false, outside: true, ground: true, area: true, explore: true },
  ];
  return { props, barriers, ramps, platforms, rooms, seats, swings };
}
