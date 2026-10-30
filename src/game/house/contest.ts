// House Hunt contest settings — edit these, not the game code.
//
// The prize codes themselves are NOT here (the repo is public). Set them in the
// GitHub repository secret HOUSE_PRIZE_CODES; the build scrambles them into the
// game. See prizeCodec.ts for the format and for what the scrambling does and
// does not protect against.
import { EMPTY_BUNDLE, activeEntry, decodePrizeCode, nextRound, type PrizeBundle } from './prizeCodec.ts';

declare const __HOUSE_PRIZE__: PrizeBundle | undefined;
const BUNDLE: PrizeBundle = typeof __HOUSE_PRIZE__ !== 'undefined' ? __HOUSE_PRIZE__ : EMPTY_BUNDLE;

export const CONTEST = {
  pageName: 'LomaVata Tech Services',
  handle: '@lvtsfiji',
  facebookUrl: 'https://www.facebook.com/lvtsfiji',
  /** Shown on the win card, e.g. '$20 FJD cash'. */
  prize: 'cash prize',
  payout: 'M-PAiSA',
  /**
   * How winners claim.
   *  'comment'  — comment the code on the pinned House Hunt post on the LvTS Facebook page (default).
   *  'timeline' — post the code on your own Facebook and tag the page. Meta's Pages promotion rules
   *               say personal Timelines must not be used to administer a promotion ("share on your
   *               Timeline to enter" and "tag your friends to enter" are given as not permitted), so this
   *               option risks the page's promotion being taken down. It is here because it was asked for.
   */
  claimMethod: 'comment' as 'comment' | 'timeline',
  /** Shown when no code is live. */
  demoCode: 'LVTS-DEMO',
};

export interface PrizeState {
  live: boolean;
  /** The code to show on the win card (the demo code when nothing is live). */
  code: string;
  /** The date (YYYY-MM-DD, Fiji) the live round started. */
  round: string | null;
  /** The next scheduled round, if any. */
  next: string | null;
}

export function prizeState(now: Date = new Date()): PrizeState {
  const entry = activeEntry(BUNDLE, now);
  if (!entry) return { live: false, code: CONTEST.demoCode, round: null, next: nextRound(BUNDLE, now) };
  return { live: true, code: decodePrizeCode(BUNDLE, entry), round: entry.from, next: null };
}

export function claimSteps(): string[] {
  const fb = CONTEST.facebookUrl.replace('https://www.', '');
  const steps = CONTEST.claimMethod === 'comment'
    ? [`Comment this code on the pinned House Hunt post on ${fb}.`, `The first correct comment for each code wins the ${CONTEST.prize}.`]
    : [`Post this code on your Facebook and tag ${CONTEST.pageName} (${CONTEST.handle}).`, `The first correct post for each code wins the ${CONTEST.prize}.`];
  steps.push(`We pay winners by ${CONTEST.payout} after we message you from the official ${CONTEST.pageName} page.`);
  return steps;
}
