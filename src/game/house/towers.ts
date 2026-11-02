// The Raiwai Lookout: a new tower by the Lomaiviti Training Ground that you can
// walk up when exploring, to stand on its roof and look down over Raiwai. Plain
// data, like the other places: ramps and landings for the floor height, walls
// and rails for collision, and boxes for what's drawn.
//
// The stairs wrap once round the outside of the tower and never pass over
// themselves, so the floor height is still one number per spot (heightAt): a
// strip 1.4 m wide with a flight up each side and a landing at each corner, the
// last side levelling off with the roof so you step across onto it. You start
// at the north-west corner on the ground; the tower's walls and the stairs'
// rails stop you anywhere else, and none of them can be jumped.

import type { Barrier, Prim, Platform, Ramp, Room } from './layout.ts';

/** A tower you can climb: its plan (centre, half sizes along x and z) and how high its roof is above the ground. */
export interface Climb {
  id: string;
  name: string;
  cx: number; cz: number; hx: number; hz: number;
  rise: number;
  body: string;
  band: string;
}

/** The Raiwai Lookout: 10 m square, its roof 20 m up, between the pool's teal building and the training ground. */
export const LOOKOUT: Climb = { id: 'lookout', name: 'Raiwai Lookout', cx: 113, cz: 52, hx: 5, hz: 5, rise: 20, body: '#d9d4c8', band: '#e0592a' };
/** The gap in the footpath's low wall across McFarlane Road, between the teal building and the training ground: the way over to the tower. */
export const LOOKOUT_PATH = { x0: 116.5, x1: 121.5 };

/** Width of the stair strip, and how much of the last side is the level landing at the top. */
const W = 1.4;
const TOP_LANDING = 4;
const RAIL_H = 1.05;
const STEP = 0.2;
const STAIR = '#bfbab0';
const STAIR_EDGE = '#8f8a80';
const RAIL = '#3b4046';

/** The plan of the tower and its stair strip (trees and houses keep clear of this). */
export const climbBox = (c: Climb, pad = 0) => ({ x0: c.cx - c.hx - W - pad, x1: c.cx + c.hx + W + pad, z0: c.cz - c.hz - W - pad, z1: c.cz + c.hz + W + pad });

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string): Prim =>
  ({ kind: 'box', min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)], color, solid: false, plain: true });

/** Heights at the turns of the stairs, from the ground `g` to the roof, shared out by the length of each flight. */
export function stairHeights(c: Climb, g: number) {
  const runs = [2 * c.hx, 2 * c.hz, 2 * c.hx, 2 * c.hz - TOP_LANDING];
  const total = runs.reduce((a, b) => a + b, 0);
  const at: number[] = [g];
  for (const r of runs) at.push(at[at.length - 1] + (c.rise * r) / total);
  return { at, top: g + c.rise, slope: c.rise / total };
}

/**
 * Everything for the tower standing on ground at height `g`. The flights go:
 * east along the north side, south down the east side, west along the south
 * side, then north up the west side to the landing at the top, beside the roof.
 */
export function climb(c: Climb, g: number) {
  const { cx, cz, hx, hz } = c;
  const xw = cx - hx, xe = cx + hx, zn = cz - hz, zs = cz + hz;   // the tower's walls
  const { at, top } = stairHeights(c, g);
  const [y0, y1, y2, y3, y4] = at;   // y4 === top
  const ramps: Ramp[] = [
    { x0: xw, x1: xe, z0: zn - W, z1: zn, y0, y1, axis: 'x', style: 'drawn' },              // north side, rising east
    { x0: xe, x1: xe + W, z0: zn, z1: zs, y0: y1, y1: y2, style: 'drawn' },                  // east side, rising south
    { x0: xw, x1: xe, z0: zs, z1: zs + W, y0: y3, y1: y2, axis: 'x', style: 'drawn' },      // south side, rising west
    { x0: xw - W, x1: xw, z0: zn + TOP_LANDING, z1: zs, y0: y4, y1: y3, style: 'drawn' },   // west side, rising north
  ];
  const platforms: Platform[] = [
    { x0: xe, x1: xe + W, z0: zn - W, z1: zn, y: y1 },             // north-east landing
    { x0: xe, x1: xe + W, z0: zs, z1: zs + W, y: y2 },             // south-east landing
    { x0: xw - W, x1: xw, z0: zs, z1: zs + W, y: y3 },             // south-west landing
    { x0: xw - W, x1: xw, z0: zn, z1: zn + TOP_LANDING, y: top },  // the landing at the top, beside the roof
    { x0: xw, x1: xe, z0: zn, z1: zs, y: top },                    // the roof
  ];
  // collision (nothing here can be jumped, and none of it is drawn by the engine: the props below are):
  // the stairs' outer rails; the tower's walls, which also keep you on the roof, open only where
  // the top landing meets it; and the top landing's north end, a long drop to the corner you start from
  const rail = (a: [number, number], b: [number, number]): Barrier => ({ a, b, kind: 'invisible', h: RAIL_H, t: 0.08, mode: 'explore' });
  const wall = (a: [number, number], b: [number, number]): Barrier => ({ a, b, kind: 'facade', h: 3, t: 0.2, mode: 'explore' });
  const barriers: Barrier[] = [
    rail([xw + 1.2, zn - W], [xe + W, zn - W]),     // north side's outer edge (open for its first 1.2 m: the way on)
    rail([xe + W, zn - W], [xe + W, zs + W]),       // east side's outer edge, round both landings
    rail([xe + W, zs + W], [xw - W, zs + W]),       // south side's outer edge
    rail([xw - W, zs + W], [xw - W, zn]),           // west side's outer edge, up to the top landing
    rail([xw - W, zn], [xw, zn]),                   // the top landing's north end
    wall([xw, zn], [xe, zn]), wall([xe, zn], [xe, zs]), wall([xw, zs], [xe, zs]),
    wall([xw, zn + TOP_LANDING], [xw, zs]),         // the west wall beside the last flight (the landing is the way across)
  ];
  const props: Prim[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };
  // the tower: cream with orange bands, the roof's edge
  add(box(xw, g, zn, xe, top, zs, c.body));
  for (let y = g + 5; y < top - 1; y += 5) add(box(xw - 0.04, y, zn - 0.04, xe + 0.04, y + 0.5, zs + 0.04, c.band));
  add(box(xw - 0.12, top - 0.25, zn - 0.12, xe + 0.12, top, zs + 0.12, c.band));
  // the steps of a flight along x or z, from `from` to `to`, across the strip from `a` to `b`, rising from ya to yb
  const flight = (along: 'x' | 'z', from: number, to: number, a: number, b: number, ya: number, yb: number) => {
    const n = Math.max(1, Math.ceil(Math.abs(yb - ya) / STEP));
    for (let i = 0; i < n; i++) {
      const s0 = from + ((to - from) * i) / n, s1 = from + ((to - from) * (i + 1)) / n;
      const y = ya + ((yb - ya) * (i + 1)) / n;   // each tread at the top of its rise
      if (along === 'x') add(box(s0, y - 0.3, a, s1, y, b, i % 2 ? STAIR : STAIR_EDGE));
      else add(box(a, y - 0.3, s0, b, y, s1, i % 2 ? STAIR : STAIR_EDGE));
    }
  };
  flight('x', xw, xe, zn - W, zn, y0, y1);
  flight('z', zn, zs, xe, xe + W, y1, y2);
  flight('x', xe, xw, zs, zs + W, y2, y3);
  flight('z', zs, zn + TOP_LANDING, xw - W, xw, y3, y4);
  // the landings, and the roof's surface
  for (const p of platforms.slice(0, 4)) add(box(p.x0, p.y - 0.3, p.z0, p.x1, p.y, p.z1, STAIR));
  add(box(xw + 0.02, top - 0.04, zn + 0.02, xe - 0.02, top + 0.005, zs - 0.02, '#c9cdd0'));
  // rails: posts and a top rail along each edge, following the stairs, and round the roof
  const railRun = (pts: [number, number, number][]) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az, ay] = pts[i], [bx, bz, by] = pts[i + 1];
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 0.6));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
        const ya = ay + (by - ay) * t0, yb = ay + (by - ay) * t1, ym = Math.max(ya, yb);
        add(box(x0 - 0.03, ym + RAIL_H - 0.05, z0 - 0.03, x1 + 0.03, ym + RAIL_H, z1 + 0.03, RAIL));          // top rail
        if (k % 2 === 0) add(box(x0 - 0.03, ya - 0.05, z0 - 0.03, x0 + 0.03, ya + RAIL_H, z0 + 0.03, RAIL));   // post
      }
    }
  };
  railRun([[xw + 1.2, zn - W, y0 + (y1 - y0) * (1.2 / (2 * hx))], [xe, zn - W, y1], [xe + W, zn - W, y1], [xe + W, zn, y1], [xe + W, zs, y2], [xe + W, zs + W, y2], [xe, zs + W, y2], [xw, zs + W, y3], [xw - W, zs + W, y3], [xw - W, zs, y3], [xw - W, zn + TOP_LANDING, top], [xw - W, zn, top], [xw, zn, top]]);
  railRun([[xw, zn + TOP_LANDING, top], [xw, zs, top], [xe, zs, top], [xe, zn, top], [xw, zn, top]]);
  const rooms: Room[] = [
    { id: `${c.id}-top`, name: c.name, x0: xw, x1: xe, z0: zn, z1: zs, floor: 'concrete', y: top, explore: true, ceiling: false, outside: true, area: true },
  ];
  return { ramps, platforms, barriers, props, rooms, top, start: [xw + 0.6, zn - W - 0.6] as [number, number] };
}
