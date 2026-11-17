// Games in the shared world (explore mode), as plain data for the engine and
// collision.ts:
// - Hop & Climb: an obstacle course over a pool on the open lot behind the
//   Methodist Church. Hop the stepping stones, climb the brick steps, jump the
//   spinning bar, cross the beam and stand on the gold star's tower. Fall in the
//   water and you're back at the last checkpoint.
// - The Riddle Hunt: six "?" posts along McFarlane Road with children's riddles.
// Every gap can be jumped at a walk, and every step up is at most three bricks,
// so the youngest players can finish it too.
import type { Solid } from './collision.ts';
import { heightAt } from './layout.ts';

const STUD = 0.4, BRICK = 0.48;

/** The pool the course stands in. */
export const POOL = { x0: 128, x1: 154, z0: -44, z1: -10 };
/** The ground there (it's flat), and the brick row everything is built up from. */
export const GROUND = heightAt((POOL.x0 + POOL.x1) / 2, (POOL.z0 + POOL.z1) / 2);
const BASE = Math.ceil(GROUND / BRICK) * BRICK;

export type ColumnKind = 'start' | 'check' | 'finish';
export interface Column { x: number; z: number; w: number; d: number; bricks: number; color: string; kind?: ColumnKind }

/** Snap a part w studs wide so its edges fall on the stud grid (the studs then line up with its sides). */
const snap = (v: number, studs: number) => Math.round((v - (studs * STUD) / 2) / STUD) * STUD + (studs * STUD) / 2;
const col = (x: number, z: number, w: number, d: number, bricks: number, color: string, kind?: ColumnKind): Column => ({ x: snap(x, w), z: snap(z, d), w, d, bricks, color, kind });

export const COLUMNS: Column[] = [
  col(141, -8, 6, 6, 1, '#f2f2f2', 'start'),
  col(141, -11.4, 3, 3, 2, '#e8322b'),
  col(141, -14.2, 3, 3, 2, '#f5b400'),
  col(143.4, -16.4, 3, 3, 3, '#2f6fd8'),
  col(146.2, -19, 6, 6, 3, '#2fae4a', 'check'),
  col(146.2, -22.6, 4, 4, 5, '#e8322b'),
  col(143, -24.6, 4, 4, 7, '#f5b400'),
  col(143, -27.6, 4, 4, 9, '#2f6fd8'),
  col(138.4, -29.6, 12, 12, 10, '#f5b400'),
  col(133.2, -29.6, 6, 6, 10, '#2fae4a', 'check'),
  col(133.2, -34, 2, 10, 10, '#8e44ad'),
  col(133.2, -38.4, 6, 6, 11, '#ffffff', 'finish'),
];

export const columnTop = (c: Column) => BASE + c.bricks * BRICK;
export const columnRect = (c: Column) => ({ x0: c.x - (c.w * STUD) / 2, x1: c.x + (c.w * STUD) / 2, z0: c.z - (c.d * STUD) / 2, z1: c.z + (c.d * STUD) / 2 });
export const START = COLUMNS[0];

/** The spinning bar on the big yellow platform: jump it or it knocks you back. */
const SPIN = COLUMNS[8];
export const SPINNER = { x: SPIN.x, z: SPIN.z, top: columnTop(SPIN), half: 2.2, speed: 1.4 };

/** Where the bar is at time t (seconds): its angle about the hub. */
export const spinnerAngle = (t: number) => t * SPINNER.speed;

/** Does the bar at angle a hit someone of radius r standing at (x, z) on the platform? */
export function spinnerHits(x: number, z: number, r: number, a: number): boolean {
  const ex = Math.cos(a) * SPINNER.half, ez = -Math.sin(a) * SPINNER.half;
  const px = x - SPINNER.x, pz = z - SPINNER.z;
  const t = Math.max(-1, Math.min(1, (px * ex + pz * ez) / (SPINNER.half * SPINNER.half)));
  return Math.hypot(px - ex * t, pz - ez * t) < r + 0.15;
}

/** The arch over the way in, south of the start. */
export const ARCH = { z: snap(-5.4, 1), x: [snap(138.6, 1), snap(143.4, 1)], bricks: 7 };

export const inPool = (x: number, z: number) => x > POOL.x0 && x < POOL.x1 && z > POOL.z0 && z < POOL.z1;

// ── the Riddle Hunt ────────────────────────────────────────────────────────
export interface Riddle { q: string; options: [string, string, string]; answer: 0 | 1 | 2 }

/** Children's riddles: classic ones and a couple from around Fiji. */
export const RIDDLES: Riddle[] = [
  { q: 'I have hands but I cannot clap. What am I?', options: ['A glove', 'A clock', 'A tree'], answer: 1 },
  { q: 'I am green outside and white inside, and you can drink the water inside me. What am I?', options: ['A coconut', 'A banana', 'A rock'], answer: 0 },
  { q: 'The more of me you take, the more you leave behind. What am I?', options: ['Mangoes', 'Coins', 'Footsteps'], answer: 2 },
  { q: 'I go up and down, but I never move. What am I?', options: ['Stairs', 'A bird', 'A ball'], answer: 0 },
  { q: 'I get wetter the more I dry. What am I?', options: ['Rain', 'A towel', 'A fish'], answer: 1 },
  { q: 'I have a hard shell, I live by the sea, and I walk sideways. What am I?', options: ['A turtle', 'A shark', 'A crab'], answer: 2 },
];

/** The posts, on the verges of McFarlane Road: by the LvTS gate, toward the temple, the side road, the church, and past the lookout. */
export const RIDDLE_POSTS: { x: number; z: number }[] = [
  { x: 18, z: 20.6 }, { x: -6, z: 20.6 }, { x: 48, z: 20.6 }, { x: 96, z: 20.6 }, { x: 138, z: 33.8 }, { x: 180, z: 33.8 },
];
export const POST_BRICKS = 4;

/** Everything here you bump into or stand on, for collision.ts (explore mode only). */
export function gameSolids(): Solid[] {
  const out: Solid[] = COLUMNS.map((c) => ({ ...columnRect(c), top: columnTop(c) }));
  for (const x of ARCH.x) out.push({ x0: x - STUD / 2, x1: x + STUD / 2, z0: ARCH.z - STUD / 2, z1: ARCH.z + STUD / 2, top: BASE + ARCH.bricks * BRICK + 0.6 });
  out.push({ x0: SPINNER.x - 0.25, x1: SPINNER.x + 0.25, z0: SPINNER.z - 0.25, z1: SPINNER.z + 0.25, top: SPINNER.top + 0.62 });
  for (const p of RIDDLE_POSTS) {
    const base = Math.ceil(heightAt(p.x, p.z) / BRICK) * BRICK;
    out.push({ x0: p.x - STUD, x1: p.x + STUD, z0: p.z - STUD, z1: p.z + STUD, top: base + POST_BRICKS * BRICK + 1.0 });
  }
  return out;
}
