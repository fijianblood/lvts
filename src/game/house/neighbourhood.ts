// Explore Your Neighbourhood: the street outside the front gate, the shop spots
// along it, the offers businesses can put in them, and visitors' characters.
//
// Visitors' characters live on the LvTS Neighbourhood server
// (workers/neighbourhood). A new character only appears to other people after
// LvTS approves it. Until the server is set up, a visitor's character is kept
// on their own device and the street shows only the family.

import { ROAD_Y, type XYZ } from './layout.ts';
import type { Character, Look } from './characters.ts';
import { cleanLook, cleanName, type VisitorCharacter, type VisitorLook } from '../../../workers/neighbourhood/src/rules.ts';

export { SKIN, HAIR, CLOTHES, HAIR_STYLES, SIZES, cleanName, cleanLook, type VisitorLook, type VisitorCharacter } from '../../../workers/neighbourhood/src/rules.ts';

declare const __NEIGHBOURHOOD_API__: string | undefined;
/** Where the server lives (set at build time; see vite.config.ts). */
export const API = (typeof __NEIGHBOURHOOD_API__ === 'string' ? __NEIGHBOURHOOD_API__ : '').replace(/\/+$/, '');

// ── The street ─────────────────────────────────────────────────────────────
/** Where you can walk in explore mode: the road and the footpath across it. */
export const STREET = { x0: -12, x1: 32, z0: 22.3, z1: 31.6 };
/** The shopfronts face the road along this line. */
export const SHOP_LINE = 31.6;
const SHOP_DEPTH = 6;

/** How an offer is unlocked in the game. */
export type Unlock =
  | { type: 'visit' }                       // walk up to the shop
  | { type: 'stars'; stars: number }        // have this many ⭐ from chores
  | { type: 'chip' };                       // have found the Golden Chip this game

export interface Offer {
  id: string;
  /** "Free soft drink with any pie", "10% off phone repairs". */
  title: string;
  details: string;
  kind: 'free' | 'discount';
  unlock: Unlock;
  /**
   * What the player shows at the shop. It is in the website's code, so anyone
   * determined could find it: only use it for offers a business is happy to
   * give anyone who asks. Limited or one-per-person offers need codes from the
   * server (planned for a later stage).
   */
  code: string;
  terms: string;
  /** YYYY-MM-DD (Fiji). The offer only shows between these dates. */
  from?: string;
  until?: string;
}

export interface ShopSpot {
  id: string;
  /** The business's name as it should appear, once it has agreed to be in the game. */
  name: string;
  kind: 'empty' | 'shop' | 'food' | 'church' | 'mosque' | 'temple' | 'mall' | 'community';
  /** Along the street (x, metres). */
  x0: number;
  x1: number;
  /** Wall and sign colours. */
  wall: string;
  sign: string;
  /** A photo of the real shopfront in public/neighbourhood/ (e.g. 'shop-1.jpg'), shown on the front of the building. */
  photo?: string;
  blurb: string;
  offers: Offer[];
}

/**
 * The shops across the road. They are all empty spots for now: no real
 * business is named and no offer is made until a business has agreed to it.
 * To add one, fill in a spot (name, kind, photo, blurb, offers); see the README.
 */
export const SHOP_SPOTS: ShopSpot[] = [
  { id: 'spot-1', name: 'Shop spot 1', kind: 'empty', x0: -11, x1: -3.2, wall: '#f4d35e', sign: '#1f2937', blurb: '', offers: [] },
  { id: 'spot-2', name: 'Shop spot 2', kind: 'empty', x0: -2.4, x1: 5.4, wall: '#9bd3ae', sign: '#14532d', blurb: '', offers: [] },
  { id: 'spot-3', name: 'Shop spot 3', kind: 'empty', x0: 6.2, x1: 14.0, wall: '#f5a3a3', sign: '#7f1d1d', blurb: '', offers: [] },
  { id: 'spot-4', name: 'Shop spot 4', kind: 'empty', x0: 14.8, x1: 22.6, wall: '#a5c8f0', sign: '#1e3a8a', blurb: '', offers: [] },
  { id: 'spot-5', name: 'Shop spot 5', kind: 'empty', x0: 23.4, x1: 31.4, wall: '#d8b4fe', sign: '#4c1d95', blurb: '', offers: [] },
];
export const shopBox = (s: ShopSpot) => ({ x0: s.x0, x1: s.x1, z0: SHOP_LINE, z1: SHOP_LINE + SHOP_DEPTH, y: ROAD_Y });

/** Is an offer showing today? `today` is YYYY-MM-DD. */
export const offerLive = (o: Offer, today: string) => (!o.from || today >= o.from) && (!o.until || today <= o.until);

/** Has the player unlocked an offer? */
export function unlocked(o: Offer, s: { stars: number; golden: boolean }) {
  if (o.unlock.type === 'visit') return true;
  if (o.unlock.type === 'stars') return s.stars >= o.unlock.stars;
  return s.golden;
}

/** Where visitors' characters stand: along the footpath, facing the road. */
export const VISITOR_SPOTS: XYZ[] = [];
for (let x = -10.2; x <= 30.5; x += 1.75) VISITOR_SPOTS.push([Math.round(x * 100) / 100, ROAD_Y, 30.55]);

// ── Turning a visitor's look into a 3D character ───────────────────────────
const HEIGHT = { kid: 1.25, teen: 1.58, adult: 1.74 } as const;

export function visitorLook(v: VisitorLook): Look {
  return {
    height: HEIGHT[v.size], build: v.size === 'kid' ? 0.92 : 1.05, skin: v.skin, hair: v.hair, hairStyle: v.hairStyle,
    shirt: v.shirt, pants: v.pants, longPants: v.longPants, beard: v.beard, earrings: v.earrings ? '#d4a537' : undefined,
    shoes: '#2f3237', kind: v.size === 'kid' ? 'kid' : 'adult',
  };
}

const line = (name: string) => (room: string | null) =>
  room ? `Bula! I'm ${name}, new in the neighbourhood. Someone said the Golden Chip is in the ${room}.` : `Bula! I'm ${name}. Vinaka for visiting the neighbourhood!`;

/** A character for the game from a visitor's name and look. `mine` is the visitor's own (playable as 'me'). */
export function visitorCharacter(name: string, look: VisitorLook, id: string, mine: boolean): Character {
  const l = visitorLook(look);
  return {
    id: mine ? 'me' : `v:${id}`, name, role: mine ? 'You' : 'Neighbour', group: mine ? 'you' : 'visitors',
    perk: mine ? 'Your own character, made by you' : 'A visitor to the neighbourhood',
    look: l, eye: Math.round(l.height * 0.92 * 100) / 100, walk: 2.6, run: 4.4, radius: look.size === 'kid' ? 0.25 : 0.28,
    thirdDist: look.size === 'kid' ? 2.2 : 2.6, line: line(name),
  };
}

// ── Your own character, kept on this device ────────────────────────────────
const KEY = 'neighbourhood-me-v1';
export type Sharing = 'local' | 'pending' | 'approved' | 'offline';
export interface Mine { name: string; look: VisitorLook; id?: string; key?: string; status?: 'pending' | 'approved' }

export function loadMine(): Mine | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Mine;
    const name = cleanName(m.name), look = cleanLook(m.look);
    return name && look ? { ...m, name, look } : null;
  } catch { return null; }
}
export function storeMine(m: Mine | null) {
  try { if (m) localStorage.setItem(KEY, JSON.stringify(m)); else localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}

export const DEFAULT_LOOK: VisitorLook = { size: 'adult', skin: '#93603f', hair: '#16110e', hairStyle: 'short', shirt: '#3b82f6', pants: '#1f2937', longPants: false, beard: false, earrings: false };

// ── Talking to the server ──────────────────────────────────────────────────
async function call<T>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; data: T | { error: string } }> {
  if (!API) return { ok: false, status: 0, data: { error: 'Sharing is not switched on yet.' } };
  try {
    const res = await fetch(API + path, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({ error: 'Unexpected answer from the server.' }));
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "The neighbourhood server can't be reached right now." } };
  }
}

/** Everyone's approved characters (empty if the server can't be reached). */
export async function fetchNeighbours(): Promise<VisitorCharacter[]> {
  const r = await call<{ characters: VisitorCharacter[] }>('GET', '/characters');
  if (!r.ok || !('characters' in r.data)) return [];
  return r.data.characters.filter((c) => cleanName(c.name) && cleanLook(c.look));
}

/** Save your character: on this device straight away, and on the server for approval. */
export async function shareMine(m: Mine): Promise<{ mine: Mine; sharing: Sharing; message?: string }> {
  storeMine(m);
  if (!API) return { mine: m, sharing: 'local' };
  const r = m.id && m.key
    ? await call<{ id: string; status: 'pending' | 'approved' }>('PUT', `/characters/${m.id}`, { key: m.key, name: m.name, look: m.look })
    : await call<{ id: string; key: string; status: 'pending' }>('POST', '/characters', { name: m.name, look: m.look });
  if (r.ok && 'status' in r.data) {
    const next: Mine = { ...m, id: r.data.id, status: r.data.status, key: 'key' in r.data && typeof r.data.key === 'string' ? r.data.key : m.key };
    storeMine(next);
    return { mine: next, sharing: next.status === 'approved' ? 'approved' : 'pending' };
  }
  // the server didn't take it (bad name, limit reached, unreachable): it's still saved on this device
  if (r.status === 404 && m.id) { const fresh = { name: m.name, look: m.look }; storeMine(fresh); return shareMine(fresh); }
  return { mine: m, sharing: r.status === 0 ? 'offline' : 'local', message: 'error' in r.data ? r.data.error : undefined };
}

/** Delete your character: from the server (if it was shared) and from this device. */
export async function deleteMine(m: Mine): Promise<void> {
  if (API && m.id && m.key) await call('DELETE', `/characters/${m.id}`, { key: m.key });
  storeMine(null);
}

/** Has LvTS approved your character yet? */
export async function checkMine(m: Mine): Promise<Sharing> {
  if (!API) return 'local';
  if (!m.id || !m.key) return 'local';
  const r = await call<{ status: 'pending' | 'approved' }>('POST', `/characters/${m.id}`, { key: m.key });
  if (r.ok && 'status' in r.data) { if (r.data.status !== m.status) storeMine({ ...m, status: r.data.status }); return r.data.status; }
  return r.status === 0 ? 'offline' : 'local';
}
