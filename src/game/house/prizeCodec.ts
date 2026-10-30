// Prize codes for the House Hunt.
//
// The site's repo is public, so the real codes never live in the source. They
// come from the HOUSE_PRIZE_CODES environment variable at build time (a GitHub
// Actions secret in production, .env.local when testing), and are stored in
// the built JavaScript scrambled rather than as plain text.
//
// Be clear about what that buys: it stops anyone finding a code by searching
// the repo or the page source, but a determined developer can still step
// through the game's code and pull one out. Only a server that hands out the
// code after checking the run (for example the Cloudflare Worker already used
// for the Loma chatbot) closes that gap. Rotating codes each round and "first
// valid comment wins" keep the damage of a leaked code small.
//
// Format of HOUSE_PRIZE_CODES (commas, semicolons or new lines between items):
//   2026-11-02=LVTS-7KQ2X9, 2026-11-09=LVTS-M3P8RA, until=2026-11-30
// Each code is live from 00:00 Fiji time on its date until the next code's
// date. `until` (optional) ends the contest after that day.

export interface PrizeEntry { from: string; data: string }
export interface PrizeBundle { salt: string; until: string | null; entries: PrizeEntry[] }

export const EMPTY_BUNDLE: PrizeBundle = { salt: '', until: null, entries: [] };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CODE_RE = /^[A-Za-z0-9-]{4,32}$/;

function seedOf(text: string): number {
  // FNV-1a, 32 bit
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0 || 1;
}

function keystream(seedText: string, n: number): Uint8Array {
  let x = seedOf(seedText);
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    // xorshift32
    x ^= x << 13; x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5; x >>>= 0;
    out[i] = x & 0xff;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromBase64(text: string): Uint8Array {
  const bin = atob(text);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function validDate(text: string): boolean {
  if (!DATE_RE.test(text)) return false;
  const d = new Date(`${text}T00:00:00+12:00`);
  return !Number.isNaN(d.getTime()) && d.toISOString().length > 0;
}

export function encodePrizeCodes(raw: string | undefined, salt: string): { bundle: PrizeBundle; warnings: string[] } {
  const warnings: string[] = [];
  const entries: PrizeEntry[] = [];
  let until: string | null = null;
  const items = (raw ?? '').split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
  for (const item of items) {
    const [left, right] = item.split('=').map((s) => s?.trim() ?? '');
    if (left.toLowerCase() === 'until') {
      if (validDate(right)) until = right;
      else warnings.push(`ignored "until" with a bad date: ${right}`);
      continue;
    }
    if (!validDate(left)) { warnings.push(`ignored an entry with a bad date (want YYYY-MM-DD): ${left}`); continue; }
    if (!CODE_RE.test(right)) { warnings.push(`ignored the code for ${left}: use 4-32 letters, digits or dashes`); continue; }
    const bytes = new TextEncoder().encode(right);
    const key = keystream(salt + left, bytes.length);
    entries.push({ from: left, data: toBase64(bytes.map((b, i) => b ^ key[i])) });
  }
  entries.sort((a, b) => a.from.localeCompare(b.from));
  return { bundle: { salt: entries.length ? salt : '', until, entries }, warnings };
}

export function decodePrizeCode(bundle: PrizeBundle, entry: PrizeEntry): string {
  const bytes = fromBase64(entry.data);
  const key = keystream(bundle.salt + entry.from, bytes.length);
  return new TextDecoder().decode(bytes.map((b, i) => b ^ key[i]));
}

const startOf = (date: string) => new Date(`${date}T00:00:00+12:00`).getTime();
const endOf = (date: string) => new Date(`${date}T23:59:59.999+12:00`).getTime();

/** The code that is live right now, or null when no round is running. */
export function activeEntry(bundle: PrizeBundle, now: Date = new Date()): PrizeEntry | null {
  const t = now.getTime();
  if (bundle.until && t > endOf(bundle.until)) return null;
  let live: PrizeEntry | null = null;
  for (const e of bundle.entries) if (startOf(e.from) <= t) live = e;
  return live;
}

/** When the next round starts, if one is scheduled after `now`. */
export function nextRound(bundle: PrizeBundle, now: Date = new Date()): string | null {
  const t = now.getTime();
  const next = bundle.entries.find((e) => startOf(e.from) > t);
  if (!next) return null;
  if (bundle.until && startOf(next.from) > endOf(bundle.until)) return null;
  return next.from;
}
