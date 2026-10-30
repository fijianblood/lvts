// Solid walls and furniture for a first-person player, as circles against
// boxes in plan. Pure functions, no three.js, so they can be unit-tested.

import { WALLS, PROPS, DOORS, wallSolidRects, type Rect, type Door, type XZ } from './layout.ts';

export interface Circle { x: number; z: number; r: number }

/** An oriented box in plan: centre, half extents along its own axes, and the angle of its local x axis (x = cos, z = sin). */
export interface OBB { cx: number; cz: number; hx: number; hz: number; angle: number }

export const PLAYER_R = 0.28;

/** Anything whose bottom is above this height is overhead (upper cabinets, lights) and never blocks you. */
const OVERHEAD = 1.2;

/** Pushes overshoot by a micrometre so a resolved circle tests clear on the next check. */
const EPS = 1e-6;

export interface StaticWorld { rects: Rect[]; circles: Circle[] }

export function buildStaticWorld(): StaticWorld {
  const rects: Rect[] = [];
  for (const wall of WALLS) rects.push(...wallSolidRects(wall));
  const circles: Circle[] = [];
  for (const prim of PROPS) {
    if (prim.kind === 'box' && prim.solid && prim.min[1] < OVERHEAD) {
      rects.push({ x0: prim.min[0], x1: prim.max[0], z0: prim.min[2], z1: prim.max[2] });
    } else if (prim.kind === 'cyl' && prim.solid && prim.base[1] < OVERHEAD) {
      circles.push({ x: prim.base[0], z: prim.base[2], r: prim.r });
    }
  }
  // the fixed half of the sliding door
  const slider = DOORS.find((d) => d.kind === 'slide');
  if (slider && slider.kind === 'slide') {
    const mid = (slider.from + slider.to) / 2;
    rects.push({ x0: slider.from, x1: mid, z0: slider.line - 0.04, z1: slider.line + 0.04 });
  }
  return { rects, circles };
}

const SLIDE_INSET = 0.05;

/** The panel of a door at `openness` (0 shut, 1 fully open), in plan. */
export function doorOBB(door: Door, openness: number): OBB {
  if (door.kind === 'slide') {
    const half = (door.to - door.from) / 4;
    const shut = door.from + 3 * half;   // centre of the moving half when shut
    const open = door.from + half;       // slid behind the fixed half
    return { cx: shut + (open - shut) * openness, cz: door.line - SLIDE_INSET, hx: half, hz: 0.035, angle: 0 };
  }
  const theta = door.closed + door.swing * openness;
  const ux = Math.cos(theta), uz = Math.sin(theta);
  const half = door.width / 2;
  // pull the panel 2 cm off the hinge and the frame so a shut door never jams in its own wall
  return { cx: door.hinge[0] + ux * half, cz: door.hinge[1] + uz * half, hx: half - 0.02, hz: 0.03, angle: theta };
}

function pushFromRect(p: XZ, r: number, x0: number, z0: number, x1: number, z1: number): XZ | null {
  const [px, pz] = p;
  const cx = Math.max(x0, Math.min(px, x1));
  const cz = Math.max(z0, Math.min(pz, z1));
  const dx = px - cx, dz = pz - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return null;
  if (d2 > 1e-12) {
    const d = Math.sqrt(d2);
    const k = (r - d + EPS) / d;
    return [dx * k, dz * k];
  }
  // centre inside the box: leave by the nearest face
  const left = px - x0 + r + EPS, right = x1 - px + r + EPS, near = pz - z0 + r + EPS, far = z1 - pz + r + EPS;
  const m = Math.min(left, right, near, far);
  if (m === left) return [-left, 0];
  if (m === right) return [right, 0];
  if (m === near) return [0, -near];
  return [0, far];
}

function pushFromOBB(p: XZ, r: number, b: OBB): XZ | null {
  const c = Math.cos(b.angle), s = Math.sin(b.angle);
  const rx = p[0] - b.cx, rz = p[1] - b.cz;
  // into the box's frame
  const lx = rx * c + rz * s;
  const lz = -rx * s + rz * c;
  const push = pushFromRect([lx, lz], r, -b.hx, -b.hz, b.hx, b.hz);
  if (!push) return null;
  // back out
  return [push[0] * c - push[1] * s, push[0] * s + push[1] * c];
}

function pushFromCircle(p: XZ, r: number, c: Circle): XZ | null {
  const dx = p[0] - c.x, dz = p[1] - c.z;
  const rr = r + c.r;
  const d2 = dx * dx + dz * dz;
  if (d2 >= rr * rr) return null;
  const d = Math.sqrt(d2);
  if (d < 1e-9) return [rr + EPS, 0];
  const k = (rr - d + EPS) / d;
  return [dx * k, dz * k];
}

export function circleHitsOBB(p: XZ, r: number, b: OBB): boolean {
  return pushFromOBB(p, r, b) !== null;
}

/** True when a circle at `p` overlaps any solid (static or the given door panels). */
export function blocked(p: XZ, r: number, world: StaticWorld, doors: OBB[]): boolean {
  for (const q of world.rects) if (pushFromRect(p, r, q.x0, q.z0, q.x1, q.z1)) return true;
  for (const c of world.circles) if (pushFromCircle(p, r, c)) return true;
  for (const b of doors) if (pushFromOBB(p, r, b)) return true;
  return false;
}

/** Push `p` out of everything it overlaps. A few passes settle corners where two solids meet. */
export function resolve(p: XZ, r: number, world: StaticWorld, doors: OBB[], passes = 4): XZ {
  let x = p[0], z = p[1];
  for (let pass = 0; pass < passes; pass++) {
    let moved = false;
    for (const q of world.rects) {
      // cheap reject before the exact test
      if (x < q.x0 - r || x > q.x1 + r || z < q.z0 - r || z > q.z1 + r) continue;
      const push = pushFromRect([x, z], r, q.x0, q.z0, q.x1, q.z1);
      if (push) { x += push[0]; z += push[1]; moved = true; }
    }
    for (const c of world.circles) {
      const push = pushFromCircle([x, z], r, c);
      if (push) { x += push[0]; z += push[1]; moved = true; }
    }
    for (const b of doors) {
      const push = pushFromOBB([x, z], r, b);
      if (push) { x += push[0]; z += push[1]; moved = true; }
    }
    if (!moved) break;
  }
  return [x, z];
}

/**
 * Move a circle by (dx, dz) and slide along whatever it meets. The move is cut
 * into steps no longer than a third of the radius, so a fast step can never
 * tunnel through a 15 cm wall.
 */
export function moveAndSlide(p: XZ, dx: number, dz: number, r: number, world: StaticWorld, doors: OBB[]): XZ {
  const len = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(len / (r / 3)));
  let cur: XZ = p;
  for (let i = 0; i < steps; i++) cur = resolve([cur[0] + dx / steps, cur[1] + dz / steps], r, world, doors);
  return cur;
}
