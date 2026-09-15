// One contest: all 50 levels, single $50 FJD prize for whoever finishes level 50 first.
// Runs 12 Aug 2026 6:00 PM – 20 Oct 2026 7:00 PM (Fiji time).
export const CONTEST_START = new Date('2026-08-12T18:00:00+12:00');
export const CONTEST_END = new Date('2026-10-20T19:00:00+12:00');

export type ContestPhase = 'live' | 'ended';

export function getContestPhase(now: Date = new Date()): ContestPhase {
  return now < CONTEST_END ? 'live' : 'ended';
}
