// Noqublox builds: a player types what they want ("a bure with a coconut tree"),
// Claude answers with a list of bricks (never code), and the build goes on one of
// the build plots. These rules are shared by the server, Loma's brick builder and
// the game, so a build always fits a plot and always looks like Noqublox.

/** Build plots on the map (their places are in the game's buildZone.ts). */
export const PLOT_COUNT = 6;
/** A plot is GRID × GRID studs, and builds go up to LAYERS bricks high. */
export const GRID = 20;
export const LAYERS = 20;
/** Most bricks in a new build, most added at once (a bed, a table…), most on one plot in all, and the widest brick (in studs). */
export const MAX_BRICKS = 800;
export const MAX_ADD = 200;
export const MAX_TOTAL = 1200;
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

/** A build on a plot. An addition (furniture inside a house…) is a new version of the build it was added to: `parent` is that build, `added` how many bricks are new. */
export interface Build { id: string; plot: number; name: string; prompt: string; bricks: Brick[]; createdAt: string; parent?: string; added?: number }

/** Adding to a build: what's there now, and the stud the player is standing on. */
export interface AddTo { bricks: Brick[]; at: [number, number] }

/** What Loma's brick builder answers. */
export type BrickReply = { ok: true; name: string; bricks: unknown } | { ok: false; why: 'refused' | 'busy' | 'failed' };

const int = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi ? v : null);

/** Only bricks that fit the plot, in colours allowed; bricks hanging over the edge are trimmed; a brick longer than MAX_SIZE (a 2 × 5 bed) is split into pieces; repeats dropped. Null if none are left. */
export function cleanBricks(raw: unknown, max = MAX_BRICKS): Brick[] | null {
  if (!Array.isArray(raw)) return null;
  const out: Brick[] = [];
  const seen = new Set<string>();
  for (const b of raw) {
    if (out.length >= max) break;
    if (!Array.isArray(b) || b.length !== 6) continue;
    const x = int(b[0], 0, GRID - 1), y = int(b[1], 0, LAYERS - 1), z = int(b[2], 0, GRID - 1);
    const w0 = int(b[3], 1, GRID), d0 = int(b[4], 1, GRID), c = int(b[5], 0, PALETTE.length - 1);
    if (x === null || y === null || z === null || w0 === null || d0 === null || c === null) continue;
    const w = Math.min(w0, GRID - x), d = Math.min(d0, GRID - z);
    for (let i = 0; i < w && out.length < max; i += MAX_SIZE) for (let j = 0; j < d && out.length < max; j += MAX_SIZE) {
      const piece: Brick = [x + i, y, z + j, Math.min(MAX_SIZE, w - i), Math.min(MAX_SIZE, d - j), c];
      const k = piece.slice(0, 5).join(',');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(piece);
    }
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

const key3 = (x: number, y: number, z: number) => (y * GRID + z) * GRID + x;
function occupied(bricks: Brick[]): Set<number> {
  const s = new Set<number>();
  for (const [x, y, z, w, d] of bricks) for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) s.add(key3(i, y, j));
  return s;
}

/** An addition on top of a build: new bricks that would go through bricks already there are dropped, and the plot never holds more than MAX_TOTAL. */
export function mergeBricks(base: Brick[], extra: Brick[]): { bricks: Brick[]; added: number } {
  const taken = occupied(base);
  const out = base.slice(0, MAX_TOTAL);
  let added = 0;
  for (const b of extra) {
    if (out.length >= MAX_TOTAL) break;
    const [x, y, z, w, d] = b;
    let clear = true;
    for (let i = x; i < x + w && clear; i++) for (let j = z; j < z + d && clear; j++) if (taken.has(key3(i, y, j))) clear = false;
    if (!clear) continue;
    for (let i = x; i < x + w; i++) for (let j = z; j < z + d; j++) taken.add(key3(i, y, j));
    out.push(b);
    added++;
  }
  return { bricks: out, added };
}

/** The plot seen from above, for adding to a build: what's on the floor, and how many empty layers there are above each stud before a brick (a ceiling). */
export function floorPlan(bricks: Brick[], at: [number, number]): string {
  const taken = occupied(bricks);
  const floor: string[] = [], room: string[] = [];
  for (let z = 0; z < GRID; z++) {
    let f = '', r = '';
    for (let x = 0; x < GRID; x++) {
      const here = x === at[0] && z === at[1];
      f += here ? 'P' : taken.has(key3(x, 0, z)) ? '#' : '.';
      let n = 0;
      while (n < LAYERS && !taken.has(key3(x, n, z))) n++;
      r += here ? 'P' : n >= 10 ? '+' : String(n);
    }
    floor.push(`${String(z).padStart(2)} ${f}`);
    room.push(`${String(z).padStart(2)} ${r}`);
  }
  const head = '   ' + Array.from({ length: GRID }, (_, x) => String(x % 10)).join('');
  return `Layer 0 (the floor): # = a brick, . = empty, P = where the player stands.\n${head}\n${floor.join('\n')}\n\nEmpty layers above the floor before the first brick (0 = a brick on the floor, + = 10 or more, open sky):\n${head}\n${room.join('\n')}`;
}

/** The bricks (and name) from a reply that was cut off part way. */
export function salvage(text: string): { refused: boolean; name: string; bricks: number[][] } {
  const name = /"name"\s*:\s*"([^"]*)"/.exec(text)?.[1] ?? '';
  const bricks = [...text.matchAll(/\[\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*,\s*(-?\d+)\s*\]/g)].map((m) => m.slice(1, 7).map(Number));
  return { refused: /"refused"\s*:\s*true/.test(text), name, bricks };
}
