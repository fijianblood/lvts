// Noqublox builds: a player types what they want ("a bure with a coconut tree"),
// Claude answers with a list of bricks (never code), and the build goes on one of
// the build plots. These rules are shared by the server, Loma's brick builder and
// the game, so a build always fits a plot and always looks like Noqublox.

/** Build plots on the map (their places are in the game's buildZone.ts). */
export const PLOT_COUNT = 6;
/** A plot is GRID × GRID studs, and builds go up to LAYERS bricks high. */
export const GRID = 20;
export const LAYERS = 20;
/** Most bricks in one build, and the widest brick (in studs). */
export const MAX_BRICKS = 300;
export const MAX_SIZE = 4;

/** The brick colours a build can use (names are what Claude sees). */
export const PALETTE: { name: string; hex: string }[] = [
  { name: 'white', hex: '#f4f4f2' }, { name: 'light grey', hex: '#a3a8ad' }, { name: 'dark grey', hex: '#5b6066' }, { name: 'black', hex: '#1d1f22' },
  { name: 'red', hex: '#d0312d' }, { name: 'orange', hex: '#f08a24' }, { name: 'yellow', hex: '#f6c90e' }, { name: 'lime', hex: '#9bd13b' },
  { name: 'green', hex: '#2e9a4a' }, { name: 'dark green', hex: '#1f5e33' }, { name: 'sky blue', hex: '#58b7e8' }, { name: 'blue', hex: '#1f5fbf' },
  { name: 'navy', hex: '#13254a' }, { name: 'purple', hex: '#7a3fb0' }, { name: 'pink', hex: '#f17bb0' }, { name: 'tan', hex: '#d8c08a' },
  { name: 'brown', hex: '#7a4b2a' }, { name: 'dark brown', hex: '#4a2c19' }, { name: 'sand', hex: '#efe0b0' }, { name: 'teal', hex: '#13938a' },
];

/** One brick: x and z are its corner stud on the plot (0 to GRID-1), y its layer (0 sits on the plot), w and d its size in studs along x and z, c its colour (PALETTE index). */
export type Brick = [x: number, y: number, z: number, w: number, d: number, c: number];

export interface Build { id: string; plot: number; name: string; prompt: string; bricks: Brick[]; createdAt: string }

/** What Loma's brick builder answers. */
export type BrickReply = { ok: true; name: string; bricks: unknown } | { ok: false; why: 'refused' | 'busy' | 'failed' };

const int = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null);

/** Only bricks that fit the plot, sizes and colours allowed; bricks hanging over the edge are trimmed; repeats dropped. Null if none are left. */
export function cleanBricks(raw: unknown): Brick[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Brick[] = [];
  const seen = new Set<string>();
  for (const b of raw) {
    if (out.length >= MAX_BRICKS) break;
    if (!Array.isArray(b) || b.length !== 6) continue;
    const x = int(b[0], 0, GRID - 1), y = int(b[1], 0, LAYERS - 1), z = int(b[2], 0, GRID - 1);
    const w0 = int(b[3], 1, MAX_SIZE), d0 = int(b[4], 1, MAX_SIZE), c = int(b[5], 0, PALETTE.length - 1);
    if (x === null || y === null || z === null || w0 === null || d0 === null || c === null) continue;
    const w = Math.min(w0, GRID - x), d = Math.min(d0, GRID - z);
    const k = `${x},${y},${z},${w},${d}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push([x, y, z, w, d, c]);
  }
  return out.length ? out : null;
}

/** A build's name as Claude gave it: short plain words. */
export function cleanBuildName(raw: unknown, fallback: string): string {
  const s = typeof raw === 'string' ? raw.normalize('NFC').replace(/[^\p{L}\p{M}\p{N}' -]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 32) : '';
  return s.length >= 2 ? s : fallback.slice(0, 32);
}

/** Words that are never sent to the AI (Claude also turns down anything not right for kids, and LvTS checks every build). */
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'pussy', 'dick', 'penis', 'vagina', 'boob', 'sex', 'porn', 'naked', 'nude', 'nigg', 'nazi', 'swastika', 'kkk', 'gun', 'rifle', 'pistol', 'bomb', 'knife', 'kill', 'blood', 'gore', 'drug', 'weed', 'beer', 'cigarette'];
const LINK = /https?:|www\.|\.(com|net|org|fj|io|ly)\b|@/i;

export type PromptVerdict = { ok: true; prompt: string } | { ok: false; why: string };

/** What a player typed: 3 to 120 characters of plain words, no links, nothing rude or violent. */
export function cleanPrompt(raw: unknown): PromptVerdict {
  if (typeof raw !== 'string') return { ok: false, why: 'Type what you want to build.' };
  const prompt = raw.normalize('NFC').replace(/[\p{Cc}\p{Cf}]/gu, '').replace(/\s+/g, ' ').trim();
  if (prompt.length < 3) return { ok: false, why: 'Tell us a bit more: what should we build?' };
  if (prompt.length > 120) return { ok: false, why: 'Keep it short: 120 letters or less.' };
  if (LINK.test(prompt)) return { ok: false, why: 'No links or emails, please.' };
  const words = prompt.toLowerCase().split(/[^\p{L}\p{N}]+/u);
  const flat = words.join('');
  if (BLOCKED.some((w) => (w.length <= 4 ? words.includes(w) || words.includes(`${w}s`) : flat.includes(w)))) return { ok: false, why: "Let's build something friendly instead." };
  return { ok: true, prompt };
}
