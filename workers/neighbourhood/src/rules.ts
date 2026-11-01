// What a visitor's character can be. Only these values are accepted, so nothing
// a visitor types ends up in the game except their (checked) display name.
// Shared by the server and the game (src/game/house/neighbourhood.ts imports it).

export const SKIN = ['#f1c9a5', '#d9a47a', '#b97a52', '#93603f', '#7a4b2f', '#5f3b25'] as const;
export const HAIR = ['#16110e', '#4a2f1d', '#8a5a2b', '#c9a227', '#d6d3cc', '#c2410c', '#7c3aed', '#2563eb'] as const;
export const CLOTHES = [
  '#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7',
  '#ec4899', '#f8fafc', '#94a3b8', '#1f2937', '#8b5e34', '#b8962e', '#8ec5e8', '#0f766e',
] as const;
export const HAIR_STYLES = ['short', 'afro', 'bun', 'ponytail', 'long', 'grey', 'baby'] as const;
export const SIZES = ['kid', 'teen', 'adult'] as const;

export interface VisitorLook {
  size: (typeof SIZES)[number];
  skin: string;
  hair: string;
  hairStyle: Exclude<(typeof HAIR_STYLES)[number], 'baby' | 'grey'> | 'grey';
  shirt: string;
  pants: string;
  longPants: boolean;
  beard: boolean;
  earrings: boolean;
}

export interface VisitorCharacter { id: string; name: string; look: VisitorLook; createdAt: string }

/** Letters (any language, with their accents and vowel signs), spaces, hyphens and apostrophes; 2 to 16 characters; no digits, links or symbols. */
const NAME_RE = /^[\p{L}][\p{L}\p{M}' -]{0,14}[\p{L}\p{M}]$/u;
/** A short list of words that are never allowed; everything else waits for a person to approve it. */
// (kept short so real names like Dickson or Sexton aren't caught; a person checks every name anyway)
const BLOCKED = ['fuck', 'shit', 'bitch', 'cunt', 'pussy', 'porn', 'nigg', 'nazi', 'admin', 'lvts', 'lomavata'];

export function cleanName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const name = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
  if (!NAME_RE.test(name)) return null;
  const flat = name.toLowerCase().replace(/[^\p{L}\p{M}]/gu, '');
  if (BLOCKED.some((w) => flat.includes(w))) return null;
  return name;
}

const oneOf = <T extends string>(list: readonly T[], v: unknown): v is T => typeof v === 'string' && (list as readonly string[]).includes(v);

/** A look built only from the allowed values, or null. */
export function cleanLook(raw: unknown): VisitorLook | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (!oneOf(SIZES, r.size) || !oneOf(SKIN, r.skin) || !oneOf(HAIR, r.hair) || !oneOf(HAIR_STYLES, r.hairStyle)) return null;
  if (r.hairStyle === 'baby') return null;
  if (!oneOf(CLOTHES, r.shirt) || !oneOf(CLOTHES, r.pants)) return null;
  for (const k of ['longPants', 'beard', 'earrings']) if (typeof r[k] !== 'boolean') return null;
  if (r.beard && r.size !== 'adult') return null;
  return {
    size: r.size, skin: r.skin, hair: r.hair, hairStyle: r.hairStyle as VisitorLook['hairStyle'],
    shirt: r.shirt, pants: r.pants, longPants: r.longPants as boolean, beard: r.beard as boolean, earrings: r.earrings as boolean,
  };
}
