// The Build Zone: six empty plots on open ground behind the house, where players
// build with words ("a bure with a coconut tree"). Claude answers with bricks
// (workers/neighbourhood/src/builds.ts and workers/loma/src/bricks.ts), and
// builds only ever go here, so they never cover the real places on the map.
import type { OBB } from './collision.ts';
import { BRICK } from './bricks.ts';
import { GRID, PLOT_COUNT, PALETTE, type Brick, type Build } from '../../../workers/neighbourhood/src/builds.ts';
export { GRID, LAYERS, PLOT_COUNT, PALETTE, MAX_BRICKS, cleanBricks, cleanPrompt, type Brick, type Build } from '../../../workers/neighbourhood/src/builds.ts';

/** One stud (and one build cell) is a stud pitch; one layer is a brick's height. */
export const CELL = BRICK.pitch;
export const LAYER = BRICK.height;
/** A plot's side, in metres (8 m). */
export const PLOT_SIZE = GRID * CELL;
/** Ground level here (the back yard's level) and the top of the baseplates. */
export const ZONE_Y = -0.6;
export const PLATE = 0.06;

export interface Plot { x0: number; z0: number; sign: { x: number; z: number } }
/** Front row (nearest the house) first, left to right, then the back row. Corners sit on the stud grid. */
export const PLOTS: Plot[] = [-9.6, -20].flatMap((z0) => [-36, -25.6, -15.2].map((x0) => ({ x0, z0, sign: { x: x0 + PLOT_SIZE / 2, z: z0 + PLOT_SIZE + 0.55 } })));
if (PLOTS.length !== PLOT_COUNT) throw new Error('PLOTS and PLOT_COUNT disagree');
/** The whole zone, for showing and culling. */
export const ZONE = { x0: -36, x1: -15.2 + PLOT_SIZE, z0: -20, z1: -9.6 + PLOT_SIZE };

/** A brick's box in the world. */
export function brickBox(p: Plot, b: Brick) {
  const [x, y, z, w, d] = b;
  return { x0: p.x0 + x * CELL, x1: p.x0 + (x + w) * CELL, y0: ZONE_Y + PLATE + y * LAYER, y1: ZONE_Y + PLATE + (y + 1) * LAYER, z0: p.z0 + z * CELL, z1: p.z0 + (z + d) * CELL };
}

export const brickColor = (c: number) => PALETTE[c]?.hex ?? PALETTE[0].hex;

/** What you bump into: the studs covered by bricks in the bottom layers (a roof up high doesn't stop you), merged into strips. */
export function buildObstacles(p: Plot, bricks: Brick[]): OBB[] {
  const low = new Set<number>();
  for (const [x, y, z, w, d] of bricks) if (y <= 2) for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) low.add(j * GRID + i);
  const out: OBB[] = [];
  for (let j = 0; j < GRID; j++) {
    for (let i = 0; i < GRID; i++) {
      if (!low.has(j * GRID + i)) continue;
      let k = i;
      while (k + 1 < GRID && low.has(j * GRID + k + 1)) k++;
      out.push({ cx: p.x0 + ((i + k + 1) / 2) * CELL, cz: p.z0 + (j + 0.5) * CELL, hx: ((k - i + 1) * CELL) / 2, hz: CELL / 2, angle: 0 });
      i = k;
    }
  }
  return out;
}

// The player's own builds that LvTS hasn't approved yet: kept in this browser so they see them.
const MINE = 'noqublox-my-builds';
export function loadMyBuilds(): Build[] {
  try {
    const v = JSON.parse(localStorage.getItem(MINE) ?? '[]');
    return Array.isArray(v) ? v.filter((b) => b && typeof b.id === 'string' && Number.isInteger(b.plot) && Array.isArray(b.bricks)).slice(-PLOT_COUNT) : [];
  } catch { return []; }
}
export function storeMyBuilds(list: Build[]) {
  try { localStorage.setItem(MINE, JSON.stringify(list.slice(-PLOT_COUNT))); } catch { /* storage full or blocked: they still see it until they leave */ }
}
