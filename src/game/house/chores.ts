// House chores, the stars they earn, and the places those stars unlock.
//
// Chores are optional: the mess comes back every game, each chore you finish
// earns stars, and stars are kept on this device across games. Reaching a
// place's star count opens it for good. Nothing here touches the Golden Chip
// hunt or the prize: no part, chip spot or exit is ever behind a lock.
//
// Pure data and helpers, no three.js, so it can be unit-tested.

import { BACK_Y, groundY, type XYZ, type XZ } from './layout.ts';
import type { OBB } from './collision.ts';

const B = BACK_Y;

/** Things you can hold: tools from the cupboard, and what a chore has you carry. One at a time. */
export type Item = 'broom' | 'mop' | 'cloth' | 'can' | 'laundry' | 'washing' | 'rubbish' | 'catfood';
export const ITEMS: Record<Item, { name: string; emoji: string; tool: boolean }> = {
  broom: { name: 'broom', emoji: '🧹', tool: true },
  mop: { name: 'mop and bucket', emoji: '🪣', tool: true },
  cloth: { name: 'cleaning cloth', emoji: '🧽', tool: true },
  can: { name: 'watering can', emoji: '💧', tool: true },
  laundry: { name: 'laundry basket', emoji: '🧺', tool: false },
  washing: { name: 'clean washing', emoji: '👕', tool: false },
  rubbish: { name: 'rubbish bag', emoji: '🗑️', tool: false },
  catfood: { name: 'cat food', emoji: '🐟', tool: false },
};

/** Where each tool lives. */
export interface Tool { id: Item; pos: XYZ; where: string }
export const TOOLS: Tool[] = [
  { id: 'broom', pos: [2.2, 0, -1.6], where: 'in the back room, on the rack by the bathroom wall' },
  { id: 'mop', pos: [2.85, 0, -1.65], where: 'in the back room, on the rack by the bathroom wall' },
  { id: 'cloth', pos: [3.5, 0.95, -1.55], where: 'in the back room, on the rack by the bathroom wall' },
  { id: 'can', pos: [4.9, B, -8.6], where: 'on the back walkway, by the laundry tubs' },
];

export type PlaceId = 'garden' | 'bure' | 'treehouse';

export interface ChoreStep {
  id: string;
  /** Where the work is (the sparkle floats here). */
  pos: XYZ;
  /** What the prompt says: "E · Sweep up the dirt". */
  label: string;
  /** How long it takes, standing next to it. */
  seconds: number;
  needs?: Item;
  /** Used up when you finish (the laundry goes in the machine). */
  takes?: boolean;
  /** What you're holding afterwards. */
  gives?: Item;
}

export interface Chore {
  id: string;
  name: string;
  emoji: string;
  where: string;
  stars: number;
  /** Steps have to be done in order (laundry: pick up, wash, hang out). */
  ordered?: boolean;
  steps: ChoreStep[];
  /** Only once this place is unlocked. */
  place?: PlaceId;
}

export const CHORES: Chore[] = [
  { id: 'dishes', name: 'Wash the dishes', emoji: '🍽️', where: 'Kitchen sink', stars: 2, steps: [
    { id: 'dishes', pos: [0.42, 0.95, 5.95], label: 'Wash the dishes', seconds: 4 },
  ] },
  { id: 'laundry', name: 'Do the laundry', emoji: '🧺', where: "Kids' room → washing machine → washing line", stars: 3, ordered: true, steps: [
    { id: 'laundry-get', pos: [7.95, 0.62, 2.05], label: 'Pick up the laundry basket', seconds: 1, gives: 'laundry' },
    { id: 'laundry-wash', pos: [0.5, 0.95, -6.08], label: 'Load the washing machine', seconds: 3, needs: 'laundry', takes: true, gives: 'washing' },
    { id: 'laundry-hang', pos: [7.9, B + 1.3, -13.55], label: 'Hang the washing on the line', seconds: 3, needs: 'washing', takes: true },
  ] },
  { id: 'sweep', name: 'Sweep the floors', emoji: '🧹', where: 'Hallway, lounge and veranda', stars: 2, steps: [
    { id: 'sweep-hall', pos: [5.6, 0.04, -2.6], label: 'Sweep up the dirt', seconds: 2, needs: 'broom' },
    { id: 'sweep-lounge', pos: [8.6, 0.04, 3.6], label: 'Sweep up the dirt', seconds: 2, needs: 'broom' },
    { id: 'sweep-veranda', pos: [2.6, 0.04, 13.65], label: 'Sweep up the dirt', seconds: 2, needs: 'broom' },
  ] },
  { id: 'mop', name: 'Mop the floors', emoji: '🪣', where: 'Kitchen and bathroom', stars: 2, steps: [
    { id: 'mop-kitchen1', pos: [1.6, 0.02, 4.5], label: 'Mop up the spill', seconds: 2.5, needs: 'mop' },
    { id: 'mop-kitchen2', pos: [4.4, 0.02, 4.2], label: 'Mop up the spill', seconds: 2.5, needs: 'mop' },
    { id: 'mop-bath', pos: [2.6, 0.02, 0.6], label: 'Mop the bathroom floor', seconds: 2.5, needs: 'mop' },
  ] },
  { id: 'dust', name: 'Dusting', emoji: '🪶', where: 'TV unit, lounge side table, back-room shelves', stars: 2, steps: [
    { id: 'dust-tv', pos: [10.62, 0.53, 7.4], label: 'Dust the TV unit', seconds: 1.5, needs: 'cloth' },
    { id: 'dust-table', pos: [10.65, 0.78, 3.3], label: 'Dust the side table', seconds: 1.5, needs: 'cloth' },
    { id: 'dust-shelf', pos: [4.2, 1.83, -7.2], label: 'Dust the shelves', seconds: 1.5, needs: 'cloth' },
  ] },
  { id: 'windows', name: 'Wipe the windows', emoji: '🪟', where: 'Lounge and dining room', stars: 2, steps: [
    { id: 'win-lounge', pos: [10.86, 1.45, 4.7], label: 'Wipe the window', seconds: 2, needs: 'cloth' },
    { id: 'win-dine-w', pos: [0.14, 1.45, 10.3], label: 'Wipe the window', seconds: 2, needs: 'cloth' },
    { id: 'win-dine-s', pos: [3.0, 1.45, 12.86], label: 'Wipe the window', seconds: 2, needs: 'cloth' },
  ] },
  { id: 'babysit', name: 'Babysit Aisha', emoji: '👶', where: "Lounge, by Aisha's bassinet", stars: 2, steps: [
    { id: 'babysit', pos: [8.3, 0.6, 6.1], label: 'Rock Aisha to sleep', seconds: 6 },
  ] },
  { id: 'rubbish', name: 'Take out the rubbish', emoji: '🗑️', where: 'Kitchen bin → wheelie bin on the back walkway', stars: 1, ordered: true, steps: [
    { id: 'rubbish-tie', pos: [0.42, 0.6, 7.95], label: 'Tie up the rubbish bag', seconds: 1.5, gives: 'rubbish' },
    { id: 'rubbish-bin', pos: [6.58, B + 1.1, -8.05], label: 'Put it in the wheelie bin', seconds: 1, needs: 'rubbish', takes: true },
  ] },
  { id: 'plants', name: 'Water the plants', emoji: '🪴', where: 'Veranda, lounge and side path', stars: 2, steps: [
    { id: 'plant-veranda', pos: [6.6, 0.5, 14.8], label: 'Water the plant', seconds: 1.5, needs: 'can' },
    { id: 'plant-lounge', pos: [10.55, 0.45, 12.5], label: 'Water the plant', seconds: 1.5, needs: 'can' },
    { id: 'plant-side', pos: [-2.3, groundY(7.65) + 0.45, 7.65], label: 'Water the plants', seconds: 1.5, needs: 'can' },
  ] },
  { id: 'cat', name: 'Feed the cat', emoji: '🐈', where: 'Kitchen pantry → cat bowl on the back walkway', stars: 1, ordered: true, steps: [
    { id: 'cat-food', pos: [0.4, 1.0, 4.85], label: 'Get the cat food', seconds: 1, gives: 'catfood' },
    { id: 'cat-bowl', pos: [5.95, B + 0.12, -9.25], label: 'Fill the cat bowl', seconds: 1.5, needs: 'catfood', takes: true },
  ] },
  { id: 'shoes', name: 'Tidy the shoes', emoji: '👟', where: 'Front veranda', stars: 1, steps: [
    { id: 'shoes', pos: [1.8, 0.15, 13.45], label: 'Put the shoes on the rack', seconds: 2.5 },
  ] },
  { id: 'garden', name: 'Water the vegetables', emoji: '🥬', where: 'Vegetable garden', stars: 2, place: 'garden', steps: [
    { id: 'garden-1', pos: [13.7, B + 0.35, -13.4], label: 'Water the dalo', seconds: 1.5, needs: 'can' },
    { id: 'garden-2', pos: [13.7, B + 0.35, -12.5], label: 'Water the cassava', seconds: 1.5, needs: 'can' },
    { id: 'garden-3', pos: [13.7, B + 0.35, -11.6], label: 'Water the bele', seconds: 1.5, needs: 'can' },
  ] },
];

/** Extra stars for finishing every chore you can do in one game. */
export const ALL_DONE_BONUS = 3;

export interface Place {
  id: PlaceId;
  name: string;
  emoji: string;
  /** Stars (earned in total, never spent) that open it. */
  stars: number;
  where: string;
  /** What's waiting there. */
  reward: string;
  /** The one way in, shut until it's unlocked. */
  lock: { a: XZ; b: XZ };
}

export const PLACES: Place[] = [
  { id: 'garden', name: 'Vegetable garden', emoji: '🌱', stars: 6, where: 'in the back yard, behind the storeroom',
    reward: 'Dalo, cassava and bele, and a new chore: water the vegetables', lock: { a: [11.8, -12.9], b: [11.8, -12.1] } },
  { id: 'bure', name: 'Family bure', emoji: '🛖', stars: 15, where: 'in the back yard, past the back steps',
    reward: 'A cosy thatched hut with mats and cushions for the whole family', lock: { a: [-0.8, -11.2], b: [0.2, -11.2] } },
  { id: 'treehouse', name: 'Treehouse', emoji: '🌳', stars: 30, where: 'in the front garden, by the breadfruit tree',
    reward: 'A lookout: from up there the whole map is revealed', lock: { a: [2.6, 20.8], b: [3.4, 20.8] } },
];

/** The lock across a place's way in, as a thin box for collision. */
export function lockOBB(p: Place): OBB {
  const [ax, az] = p.lock.a, [bx, bz] = p.lock.b;
  const len = Math.hypot(bx - ax, bz - az);
  return { cx: (ax + bx) / 2, cz: (az + bz) / 2, hx: len / 2, hz: 0.05, angle: Math.atan2(bz - az, bx - ax) };
}

/** Places open at this many stars. */
export const unlockedAt = (stars: number): PlaceId[] => PLACES.filter((p) => stars >= p.stars).map((p) => p.id);

/** Every chore step, in list order. */
export const STEPS: { chore: Chore; step: ChoreStep; index: number }[] = CHORES.flatMap((chore) => chore.steps.map((step, index) => ({ chore, step, index })));

/** Chores you can do in a game, given what's unlocked. Baby Aisha is too little for chores (she's the one being babysat!). */
export const availableChores = (baby: boolean, unlocked: readonly PlaceId[]) =>
  baby ? [] : CHORES.filter((c) => !c.place || unlocked.includes(c.place));

// ── saved progress (this device only) ─────────────────────────────────────
const KEY = 'house-hunt-stars-v1';
export interface Progress { stars: number }

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    const n = raw ? Number(JSON.parse(raw).stars) : 0;
    return { stars: Number.isFinite(n) && n > 0 ? Math.floor(n) : 0 };
  } catch { return { stars: 0 }; }
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify({ stars: p.stars })); } catch { /* storage unavailable: stars last this visit */ }
}
