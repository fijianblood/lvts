// Day and night in Noqublox, and when the Diwali lights are lit.
//
// The sky, sun and fog follow the player's own clock: it is day when it is day
// where they are, and dark at night. skyAt(hour) blends a few keyframes (night,
// the warm glow at sunrise/sunset, and full day) so the change is smooth.
//
// Diwali: the lights come on only on Diwali day (local date), all day and all
// night, and are gone the next day. Add each year's date to DIWALI_DATES.

import * as THREE from 'three';

/** One moment's sky, as plain colours and numbers. */
type SkyKey = {
  zenith: string; mid: string; horizon: string;   // sky gradient, top to bottom
  sun: string; sunI: number;                       // the sun (directional light)
  hemiSky: string; hemiGround: string; hemiI: number;  // soft fill light
  env: number;                                     // reflections (environment) strength
  fog: string; stars: number; exposure: number;    // fog colour, star opacity, tone-map exposure
};

const NIGHT: SkyKey = { zenith: '#05060f', mid: '#0a1030', horizon: '#121a36', sun: '#3a4a7a', sunI: 0.18,
  hemiSky: '#263150', hemiGround: '#0e121c', hemiI: 0.22, env: 0.08, fog: '#0b1126', stars: 1, exposure: 0.92 };
const GOLD: SkyKey = { zenith: '#2f4a86', mid: '#ff9a5a', horizon: '#ffd3a0', sun: '#ff914d', sunI: 2.4,
  hemiSky: '#ffd6ac', hemiGround: '#6a5038', hemiI: 0.5, env: 0.3, fog: '#ffc593', stars: 0.15, exposure: 1.0 };
const DAY: SkyKey = { zenith: '#1e7bea', mid: '#5eb3ff', horizon: '#bfe6ff', sun: '#fff0d4', sunI: 6.5,
  hemiSky: '#f4f8ff', hemiGround: '#b9ab98', hemiI: 0.6, env: 0.45, fog: '#a9dcff', stars: 0, exposure: 1.0 };

// Local hour -> sky. Sunrise about 6:20, sunset about 18:30 (Fiji is near the equator).
const FRAMES: [number, SkyKey][] = [
  [0, NIGHT], [5, NIGHT], [6.3, GOLD], [8, DAY], [17, DAY], [18.5, GOLD], [20, NIGHT], [24, NIGHT],
];

/** The same thing resolved into THREE colours, ready to copy onto the scene. */
export type Sky = {
  zenith: THREE.Color; mid: THREE.Color; horizon: THREE.Color;
  sun: THREE.Color; sunI: number;
  hemiSky: THREE.Color; hemiGround: THREE.Color; hemiI: number;
  env: number; fog: THREE.Color; stars: number; exposure: number;
};

const smooth = (t: number) => t * t * (3 - 2 * t);

function blend(a: SkyKey, b: SkyKey, t: number): Sky {
  const c = (x: string, y: string) => new THREE.Color(x).lerp(new THREE.Color(y), t);
  const n = (x: number, y: number) => x + (y - x) * t;
  return { zenith: c(a.zenith, b.zenith), mid: c(a.mid, b.mid), horizon: c(a.horizon, b.horizon),
    sun: c(a.sun, b.sun), sunI: n(a.sunI, b.sunI), hemiSky: c(a.hemiSky, b.hemiSky), hemiGround: c(a.hemiGround, b.hemiGround),
    hemiI: n(a.hemiI, b.hemiI), env: n(a.env, b.env), fog: c(a.fog, b.fog), stars: n(a.stars, b.stars), exposure: n(a.exposure, b.exposure) };
}

/** The sky at a local hour (0–24). Wraps, so 25 is 1am. */
export function skyAt(hour: number): Sky {
  const h = ((hour % 24) + 24) % 24;
  for (let i = 0; i < FRAMES.length - 1; i++) {
    const [h0, k0] = FRAMES[i], [h1, k1] = FRAMES[i + 1];
    if (h >= h0 && h <= h1) return blend(k0, k1, h1 === h0 ? 0 : smooth((h - h0) / (h1 - h0)));
  }
  return blend(NIGHT, NIGHT, 0);
}

/** A date as a fractional local hour, e.g. 18:30 -> 18.5. */
export function hourOf(d: Date): number {
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/** 1 at full day, 0 at full night (for anything that should only show after dark). */
export function darkness(hour: number): number {
  return 1 - skyAt(hour).hemiI / DAY.hemiI;
}

// Diwali (Deepavali) days, by local date (YYYY-MM-DD). Add each year as it comes.
export const DIWALI_DATES = new Set<string>(['2026-11-08']);

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Is it Diwali where the player is? */
export function isDiwali(d: Date = new Date()): boolean {
  return DIWALI_DATES.has(ymd(d));
}
