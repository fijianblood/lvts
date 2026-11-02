// What players can say to each other in Noqublox's shared world. Shared by the
// server (which has the final say) and the game (which checks first, so a
// player sees straight away why a message didn't go).
//
// Children play this game and strangers meet in it, so on top of a rude-word
// filter, any message that looks like it carries a way to find or contact
// someone (a phone number, an email, a link, a social media name, an address
// question) is not sent at all. No filter catches everything: the report
// button and the admin page are the other half of keeping chat safe.

export const CHAT = {
  /** Longest message, in characters. */
  maxLength: 100,
  /** At least this long between two messages from one player (ms). */
  gapMs: 1200,
  /** At most this many messages in `burstMs`. */
  burst: 5,
  burstMs: 15_000,
  /** This many blocked messages in `strikeMs` and the player can't chat for `muteMs`. */
  strikes: 3,
  strikeMs: 5 * 60_000,
  muteMs: 10 * 60_000,
} as const;

export type ChatVerdict =
  | { ok: true; text: string }
  | { ok: false; why: 'empty' | 'long' | 'rude' | 'personal' };

/** What the player is told when a message doesn't go. */
export const CHAT_WHY: Record<Exclude<ChatVerdict, { ok: true }>['why'], string> = {
  empty: 'Type something first.',
  long: `Keep it under ${CHAT.maxLength} characters.`,
  rude: "That message wasn't sent. Please keep it friendly: kids play here too.",
  personal: "That message wasn't sent. Never share phone numbers, emails, links, social media or where you live.",
};

// ── Rude words ───────────────────────────────────────────────────────────────
// Matched as whole words (after undoing l33t spellings and stretched letters).
// English, plus common Fiji Hindi swears. Add words in lower case; iTaukei and
// other words LvTS wants blocked can go here too.
const RUDE_WORDS = [
  'fuck', 'fucks', 'fucked', 'fucker', 'fuckers', 'fucking', 'fuckin', 'fck', 'fk', 'fuk', 'fuking', 'wtf', 'stfu', 'motherfucker', 'mf',
  'shit', 'shits', 'shitty', 'bullshit', 'bitch', 'bitches', 'bastard', 'bastards', 'cunt', 'cunts', 'dick', 'dicks', 'dickhead', 'cock', 'cocks',
  'pussy', 'pussies', 'ass', 'arse', 'asshole', 'arsehole', 'twat', 'wanker', 'wank', 'slut', 'sluts', 'whore', 'whores', 'hoe', 'hoes', 'prick',
  'retard', 'retarded', 'fag', 'fags', 'faggot', 'nigger', 'niggers', 'nigga', 'niggas', 'coon', 'chink', 'paki', 'kike', 'spic',
  'sex', 'sexy', 'porn', 'porno', 'nude', 'nudes', 'naked', 'horny', 'boobs', 'tits', 'penis', 'vagina', 'dildo', 'rape', 'rapist', 'pedo', 'paedo',
  'kill yourself', 'kys',
  // Fiji Hindi
  'madarchod', 'maderchod', 'bhenchod', 'behenchod', 'benchod', 'chutiya', 'chutia', 'chut', 'gandu', 'gaandu', 'randi', 'harami', 'bhosdi', 'bhosdike', 'lund', 'lauda', 'loda',
];
/** Rude even when hidden inside other letters or spaced out ("f u c k", "fuuuuck"). Only strings that aren't part of everyday words. */
// (not 'nigger': squeezed it is inside 'Nigeria'; whole words catch it)
const RUDE_ANYWHERE = ['fuck', 'cunt', 'faggot', 'madarchod', 'bhenchod', 'behenchod', 'chutiya', 'bhosdi'];

// ── Ways to find or contact someone ──────────────────────────────────────────
const CONTACT_WORDS = [
  'whatsapp', 'whats app', 'watsapp', 'viber', 'telegram', 'signal app', 'discord', 'snapchat', 'snap me', 'my snap', 'instagram', 'insta', 'my ig',
  'facebook', 'fb', 'messenger', 'tiktok', 'tik tok', 'twitter', 'youtube', 'gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'email', 'e-mail',
  'phone number', 'my number', 'ur number', 'your number', 'call me', 'text me', 'dm me', 'pm me', 'inbox me', 'add me',
  'where do you live', 'where u live', 'where you live', 'where do u live', 'where u stay', 'where do you stay', 'your address', 'ur address', 'my address',
  'what school', 'which school', 'meet me', 'meet up', 'meetup', 'come to my house', 'send pic', 'send a pic', 'send photo', 'send me a photo', 'send me pic',
];
const NUMBER_WORDS = new Set(['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '@': 'a', '$': 's', '!': 'i', '|': 'l', '+': 't' };

/**
 * Lower case, accents off, l33t undone, everything that isn't a letter turned into a space.
 * Digits only count as letters inside a word that has letters ("sh1t", not "455 points"), and
 * symbols only when a letter or digit follows ("sh!t", "$hit", but not the "!" in "shit!").
 */
function words(text: string): string {
  const flat = text.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '');
  const toks = flat.split(/\s+/).map((tok) => {
    if (!/[a-z]/.test(tok)) return tok;
    return tok.replace(/[0134578@$!|+]/g, (c, i: number) => (/\d/.test(c) || /[a-z0-9]/.test(tok[i + 1] ?? '') ? LEET[c] : ' '));
  });
  return ` ${toks.join(' ').replace(/[^a-z]+/g, ' ').trim()} `;
}
/** The same, with stretched letters squeezed ("fuuuuck" → "fuck", "shiiit" → "shit"). */
const squeeze = (w: string) => w.replace(/([a-z])\1+/g, '$1');

const hasPhrase = (hay: string, list: readonly string[]) => list.some((w) => hay.includes(` ${w} `));

function looksRude(text: string): boolean {
  const w = words(text);
  if (hasPhrase(w, RUDE_WORDS) || hasPhrase(squeeze(w), RUDE_WORDS)) return true;
  const solid = squeeze(w.replace(/ /g, ''));
  return RUDE_ANYWHERE.some((x) => solid.includes(squeeze(x)));
}

function looksPersonal(text: string): boolean {
  const lower = text.toLowerCase();
  // a phone number or any long number: 6 or more digits, even with spaces, dots or dashes between them
  if (/(?:\d[\s.\-()_/]*){6,}/.test(lower)) return true;
  // numbers spelled out: four number words in a row ("eight three three one")
  let run = 0;
  for (const t of lower.split(/[^a-z]+/)) { run = NUMBER_WORDS.has(t) ? run + 1 : 0; if (run >= 4) return true; }
  // emails and handles: name@place, @name
  if (/[\w.+-]+\s*(?:@|\(at\)|\[at\])\s*[\w-]+\s*(?:\.|[([]?dot[)\]]?)\s*[a-z]{2,}/i.test(lower) || /(?:^|\s)@[\w.]{2,}/.test(lower)) return true;
  // links: http(s)://, www., or a name.domain
  if (/https?:\/\/|www\.|\b[\w-]+\.(?:com|net|org|fj|io|me|ly|gg|app|xyz|co|info|biz|tv|link|site|online|au|nz)\b|\bdot\W{0,3}(?:com|net|org|fj)\b/i.test(lower)) return true;
  return hasPhrase(words(text), CONTACT_WORDS);
}

/** Tidy a message and decide whether it can be sent. */
export function cleanChat(raw: unknown): ChatVerdict {
  if (typeof raw !== 'string') return { ok: false, why: 'empty' };
  // no control characters, no invisible or direction-changing characters, single spaces
  const text = raw.normalize('NFC').replace(/[\p{Cc}\p{Cf}\u2028\u2029]/gu, '').replace(/\s+/g, ' ').trim();
  if (!text) return { ok: false, why: 'empty' };
  if (text.length > CHAT.maxLength) return { ok: false, why: 'long' };
  if (looksPersonal(text)) return { ok: false, why: 'personal' };
  if (looksRude(text)) return { ok: false, why: 'rude' };
  return { ok: true, text };
}
