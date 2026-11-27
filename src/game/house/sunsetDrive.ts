// Sunset Drive: the east end of McFarlane Road down to USP glows like a summer
// evening whatever the time (pink-gold sky, neon lights along the road), with
// a run through glowing rings to the USP entrance. Plus the USP Room Finder
// kiosk at the campus, which opens Samuel Ganey Tubuna's 3D campus map.
// Our own look (no GTA names, logos or music), and kid-friendly: just driving.
import type { Solid } from './collision.ts';
import { MCFARLANE } from './layout.ts';

/** Where the sunset look is full strength; it fades in over FADE metres around it. */
export const SUNSET = { x0: 156, x1: 280, z0: 12, z1: 72 };
const FADE = 22;
/** The evening hour the zone looks like. */
export const SUNSET_HOUR = 18.3;

/** 0 outside the zone, 1 inside, easing in between. */
export function sunsetWeight(x: number, z: number): number {
  const dx = Math.max(SUNSET.x0 - x, 0, x - SUNSET.x1), dz = Math.max(SUNSET.z0 - z, 0, z - SUNSET.z1);
  const t = Math.max(0, 1 - Math.hypot(dx, dz) / FADE);
  return t * t * (3 - 2 * t);
}

/** The hour the sky should show here: daytime turns to sunset in the zone; evening and night stay as they are. */
export function sunsetHour(hour: number, w: number): number {
  if (w <= 0 || hour >= SUNSET_HOUR || hour < 5) return hour;
  return hour + (SUNSET_HOUR - hour) * w;
}

/** The neon arch over the road where Sunset Drive starts. */
export const ARCH_X = 156;
const LANE_N = MCFARLANE.z0 + 2.3;
/** Rings to drive through, along the eastbound (north) lane to the USP entrance. */
export const RINGS: { x: number; z: number }[] = [158, 167, 176, 185, 194, 203, 212].map((x) => ({ x, z: LANE_N }));
export const RING_R = 1.9;
/** Neon light posts along both kerbs. */
export const NEON: { x: number; z: number; color: string }[] = [];
for (let x = 160, i = 0; x <= 212; x += 8, i++) for (const [z, s] of [[MCFARLANE.z0 - 0.9, 0], [MCFARLANE.z1 + 0.9, 1]] as const) {
  if (s === 1 && x >= 200) continue;   // buildings come right up to the road there
  NEON.push({ x, z, color: ['#ff3ea5', '#2ee6ff', '#b45cff'][(i + s) % 3] });
}

/** The USP Room Finder kiosk, on the lawn by the entrance sign. */
export const KIOSK = { x: 222.5, z: 34.6 };
export const ROOM_FINDER_URL = 'https://room-finder-usp.vituganey.workers.dev/';

export function sunsetSolids(): Solid[] {
  const out: Solid[] = [{ x0: KIOSK.x - 0.45, x1: KIOSK.x + 0.45, z0: KIOSK.z - 0.3, z1: KIOSK.z + 0.3, top: 4 }];
  for (const z of [MCFARLANE.z0 - 1.1, MCFARLANE.z1 + 1.1]) out.push({ x0: ARCH_X - 0.3, x1: ARCH_X + 0.3, z0: z - 0.3, z1: z + 0.3, top: 9 });
  return out;
}
