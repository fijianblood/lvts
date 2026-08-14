// Phase 1: levels 1-36, contest runs 12-30 Aug 2026, winner decided at level 36.
// Phase 2: levels 37-50 stay locked until 10 Sep 2026, contest runs 10 Sep - 20 Oct 2026.
export const PHASE1_LEVEL_COUNT = 36;
export const PHASE1_LAST_IDX = PHASE1_LEVEL_COUNT - 1;
export const PHASE1_END = new Date('2026-08-30T19:00:00+12:00');
export const PHASE2_UNLOCK_DATE = new Date('2026-09-10T00:00:00+12:00');
export const PHASE2_END = new Date('2026-10-20T19:00:00+12:00');

export type ContestPhase = 'phase1' | 'phase2-locked' | 'phase2' | 'ended';

export function getContestPhase(now: Date = new Date()): ContestPhase {
  if (now < PHASE1_END) return 'phase1';
  if (now < PHASE2_UNLOCK_DATE) return 'phase2-locked';
  if (now < PHASE2_END) return 'phase2';
  return 'ended';
}
