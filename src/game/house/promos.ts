// The hidden reward cards in Damodar City's Digicel and Vodafone shops.
//
// This is LvTS's own reward, not Digicel's or Vodafone's: LomaVata Tech
// Services runs it and pays the winners, by MyCash for the card in the Digicel
// shop and by M-PAiSA for the one in the Vodafone shop. Every place the game
// shows it says so (the board in each shop, and the card you find).
//
// Somewhere in each shop is a small reward card. Walk up to it and press E and
// it shows this round's 8-digit code; take a screenshot and post it on the
// @lvtsfiji Facebook page to claim a chance to win.
//
// The codes are NOT here (the repo is public). They come from the GitHub
// repository secrets DIGICEL_PROMO_CODES and VODAFONE_PROMO_CODES at build time,
// scrambled into the game the same way as the prize codes (prizeCodec.ts, which
// also says what that does and doesn't protect against). Format, with each
// NNNNNNNN an 8-digit code you make up (never one written here):
//   2026-11-03=NNNNNNNN, 2026-11-10=NNNNNNNN, until=2026-11-30
// Each code is live from 00:00 Fiji time on its date until the next one's;
// `until` (optional) ends the promotion after that day.
import { CONTEST } from './contest.ts';
import { EMPTY_BUNDLE, activeEntry, decodePrizeCode, nextRound, type CodeRule, type PrizeBundle } from './prizeCodec.ts';

declare const __SHOP_PROMOS__: Record<string, PrizeBundle> | undefined;
const BUNDLES: Record<string, PrizeBundle> = typeof __SHOP_PROMOS__ !== 'undefined' ? __SHOP_PROMOS__ : {};

export type PromoId = 'digicel' | 'vodafone';
export interface ShopPromo {
  id: PromoId;
  /** The shop it's hidden in, and the company that runs that shop (which does NOT run this reward). */
  shop: string;
  company: string;
  /** How LvTS pays the winners, and that wallet's logo in public/neighbourhood/logos/. */
  wallet: string;
  walletLogo: string;
  /** The reward, as shown in the game. */
  amount: string;
  /** The GitHub secret its codes come from. */
  secret: string;
  /** The shop's colour, for the card. */
  colour: string;
}

export const SHOP_PROMOS: ShopPromo[] = [
  { id: 'digicel', shop: 'Digicel', company: 'Digicel', wallet: 'MyCash', walletLogo: 'mycash.png', amount: '$5', secret: 'DIGICEL_PROMO_CODES', colour: '#d0021b' },
  { id: 'vodafone', shop: 'Vodafone', company: 'Vodafone', wallet: 'M-PAiSA', walletLogo: 'mpaisa.png', amount: '$5', secret: 'VODAFONE_PROMO_CODES', colour: '#e60000' },
];
export const promoById = (id: string) => SHOP_PROMOS.find((p) => p.id === id);

/** A reward code is exactly 8 digits. */
export const PROMO_CODE: CodeRule = { re: /^\d{8}$/, says: 'exactly 8 digits' };

export interface PromoState {
  live: boolean;
  /** This round's 8-digit code, or null when no round is running. */
  code: string | null;
  /** The date (YYYY-MM-DD, Fiji) the live round started, and the next scheduled round. */
  round: string | null;
  next: string | null;
}

/** The round running in a bundle at `now` (exported for the tests). */
export function promoStateOf(bundle: PrizeBundle, now: Date = new Date()): PromoState {
  const entry = activeEntry(bundle, now);
  if (!entry) return { live: false, code: null, round: null, next: nextRound(bundle, now) };
  return { live: true, code: decodePrizeCode(bundle, entry), round: entry.from, next: null };
}
export const promoState = (id: PromoId, now: Date = new Date()) => promoStateOf(BUNDLES[id] ?? EMPTY_BUNDLE, now);

/** The heading on the card and the board: "$5 MyCash cashback". */
export const promoTitle = (p: ShopPromo) => `${p.amount} ${p.wallet} cashback`;
/** Who runs it, said everywhere it's shown. */
export const promoBy = (p: ShopPromo) => `Run and paid by ${CONTEST.pageName} (LvTS), not by ${p.company} or ${p.wallet}.`;

/** How to claim, step by step (shown on the card when a round is live). */
export function promoSteps(p: ShopPromo): string[] {
  const where = CONTEST.claimMethod === 'comment'
    ? `Post your screenshot on the ${CONTEST.handle} Facebook page, as a comment on the pinned Noqublox post.`
    : `Post your screenshot on your Facebook and tag ${CONTEST.pageName} (${CONTEST.handle}).`;
  return [
    'Take a screenshot of this card, with the code showing.',
    where,
    `That gives you a chance to win ${p.amount} cashback, paid to your ${p.wallet} by LvTS. Post while this round's code is live.`,
    `We pay winners by ${p.wallet} after we message you from the official ${CONTEST.pageName} page. We never ask for your ${p.wallet} PIN or any payment.`,
  ];
}
