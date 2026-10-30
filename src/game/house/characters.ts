// The Sahib family, as playable characters. The household's looks are taken
// from the clothes in the family's photos; the aunties, uncles and cousins
// don't have photos yet, so their outfits are made up. All are low-poly:
// blocky figures, not likenesses.
//
// To change how names appear in the game (for example first names only),
// edit `name` here; nothing else needs to change. `role` is the short label on
// the picker, from the kids' point of view (Dad, Aunty, Cousin…).

export type CharacterId =
  | 'hussein' | 'josese' | 'ronlyn' | 'zane' | 'mahala' | 'aisha'
  | 'nancy' | 'louzanne' | 'alicia' | 'maria' | 'zoya' | 'mira' | 'fawzia' | 'altaaf' | 'ravi' | 'malvin' | 'hakeem'
  | 'mikhyle' | 'nabeeha' | 'emaana' | 'rohan' | 'kahaani' | 'yash' | 'maanvi' | 'sarah';

/** Which tab of the picker a character sits on. */
export type CharacterGroup = 'home' | 'aunties' | 'cousins';
export const GROUPS: { id: CharacterGroup; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'aunties', label: 'Aunties & Uncles' },
  { id: 'cousins', label: 'Cousins' },
];

export interface Look {
  /** Standing height in metres (for the baby, length from head to toe). */
  height: number;
  /** Shoulder and hip width factor. */
  build: number;
  skin: string;
  hair: string;
  hairStyle: 'short' | 'afro' | 'bun' | 'grey' | 'baby' | 'ponytail' | 'long';
  /** Streaks through the hair (grey). */
  streak?: string;
  /** Small earrings. */
  earrings?: string;
  beard?: boolean;
  shirt: string;
  /** A small print on the chest. */
  print?: string;
  pants: string;
  /** Trousers to the ankle instead of shorts. */
  longPants?: boolean;
  shoes?: string;
  kind: 'adult' | 'kid' | 'baby';
}

export interface Character {
  id: CharacterId;
  name: string;
  role: string;
  group: CharacterGroup;
  /** One line shown on the picker. */
  perk: string;
  look: Look;
  eye: number;
  walk: number;
  run: number;
  radius: number;
  /** Crawls: fits under tables. */
  crawl?: boolean;
  /** How far the minimap reveals around you (default 5.5 m). */
  sight?: number;
  /** Tech parts within this distance show on the minimap even through walls. */
  radar?: number;
  /** After this many parts, the Golden Chip shows on the minimap. */
  ipadAfter?: number;
  /** Warmer/colder: tells you how close the Golden Chip is. */
  sense?: boolean;
  /** Knows which room the Golden Chip is in from the start. */
  chipRoom?: boolean;
  /** Picks parts up from this far away (default 0.85 m), as long as nothing is in between. */
  magnet?: number;
  /** The front gate is marked on the map from the start. */
  knowsWay?: boolean;
  /** Third-person camera distance. */
  thirdDist: number;
  /** What they say when you walk up and talk to them. `room` is the Golden Chip's room, or null once you have it. */
  line: (room: string | null) => string;
}

const SKIN = { hussein: '#7d4f33', josese: '#6f4529', ronlyn: '#8f5f3f', zane: '#7a4a2c', mahala: '#8a5636', aisha: '#93603f' };

type LookBits = Pick<Look, 'hairStyle' | 'shirt' | 'pants'> & Partial<Pick<Look, 'print' | 'longPants' | 'beard' | 'earrings' | 'streak' | 'shoes'>>;
type PerkBits = Pick<Character, 'perk'> & Partial<Pick<Character, 'sight' | 'radar' | 'ipadAfter' | 'sense' | 'chipRoom' | 'magnet' | 'knowsWay' | 'walk' | 'run'>>;
type Line = Character['line'];
const BLACK_HAIR = '#16110e';

function aunty(id: CharacterId, name: string, skin: string, look: LookBits, perk: PerkBits, line: Line): Character {
  return {
    id, name, role: 'Aunty', group: 'aunties', line,
    look: { height: 1.62, build: 1.1, skin, hair: BLACK_HAIR, kind: 'adult', ...look },
    eye: 1.51, walk: 2.5, run: 4.0, radius: 0.28, thirdDist: 2.5, ...perk,
  };
}
function uncle(id: CharacterId, name: string, skin: string, look: LookBits, perk: PerkBits, line: Line): Character {
  return {
    id, name, role: 'Uncle', group: 'aunties', line,
    look: { height: 1.76, build: 1.2, skin, hair: BLACK_HAIR, shoes: '#2f3237', kind: 'adult', ...look },
    eye: 1.64, walk: 2.5, run: 4.1, radius: 0.28, thirdDist: 2.6, ...perk,
  };
}
function cousin(id: CharacterId, name: string, height: number, skin: string, look: LookBits, perk: PerkBits, line: Line): Character {
  return {
    id, name, role: 'Cousin', group: 'cousins', line,
    look: { height, build: 0.92, skin, hair: BLACK_HAIR, kind: 'kid', ...look },
    eye: Math.round(height * 0.9 * 100) / 100, walk: 2.6, run: 4.4, radius: 0.25, thirdDist: 2.2, ...perk,
  };
}

export const CHARACTERS: Character[] = [
  {
    id: 'hussein', name: 'Hussein Sahib', role: 'Grandpa', group: 'home',
    perk: 'Wise eyes: the map reveals further around you',
    look: { height: 1.72, build: 1.05, skin: SKIN.hussein, hair: '#d6d3cc', hairStyle: 'grey', shirt: '#1f2226', pants: '#c4b08a', longPants: true, shoes: '#2a2a2a', kind: 'adult' },
    eye: 1.6, walk: 2.2, run: 3.4, radius: 0.28, sight: 8.5, thirdDist: 2.6,
    line: (room) => (room ? `Bula! Something shiny caught my eye in the ${room}.` : 'Vinaka! Now go down the driveway and out the front gate.'),
  },
  {
    id: 'josese', name: 'Josese Sahib', role: 'Dad', group: 'home',
    perk: 'Tech radar: parts within 7 m show on the map, even through walls',
    look: { height: 1.82, build: 1.3, skin: SKIN.josese, hair: '#16110e', hairStyle: 'afro', beard: true, shirt: '#22262b', print: '#e46a8a', pants: '#8ec5e8', shoes: '#30343a', kind: 'adult' },
    eye: 1.7, walk: 2.6, run: 4.3, radius: 0.28, radar: 7, thirdDist: 2.7,
    line: (room) => (room ? `My tech radar says the Golden Chip is somewhere in the ${room}.` : 'Nice work! The front gate is at the bottom of the driveway.'),
  },
  {
    id: 'ronlyn', name: 'Ronlyn Sahib', role: 'Mum', group: 'home',
    perk: 'Mum always knows: you get warmer or colder as you near the Golden Chip',
    look: { height: 1.62, build: 1.2, skin: SKIN.ronlyn, hair: '#221c19', hairStyle: 'ponytail', streak: '#8d8882', earrings: '#d4a537', shirt: '#8e2a33', pants: '#2b2d33', kind: 'adult' },
    eye: 1.52, walk: 2.5, run: 4.0, radius: 0.28, sense: true, thirdDist: 2.5,
    line: (room) => (room ? `Have a look in the ${room}. Mum always knows where things are.` : 'Well done! Shut the gate on your way out.'),
  },
  {
    id: 'zane', name: 'Zane Sahib', role: 'Big brother', group: 'home',
    perk: 'Fastest runner in the house',
    look: { height: 1.66, build: 0.95, skin: SKIN.zane, hair: '#16110e', hairStyle: 'short', shirt: '#f4f4f2', pants: '#1d1f22', kind: 'adult' },
    eye: 1.55, walk: 2.9, run: 5.0, radius: 0.27, thirdDist: 2.5,
    line: (room) => (room ? `I saw something gold in the ${room}. Race you there!` : 'You got it! Last one to the front gate loses.'),
  },
  {
    id: 'mahala', name: 'Mahala Sahib', role: 'Big sister', group: 'home',
    perk: 'iPad map: the Golden Chip shows on the map once you have 6 parts',
    look: { height: 1.28, build: 0.9, skin: SKIN.mahala, hair: '#16110e', hairStyle: 'bun', shirt: '#d9c6ec', pants: '#b8962e', kind: 'kid' },
    eye: 1.15, walk: 2.6, run: 4.5, radius: 0.24, ipadAfter: 6, thirdDist: 2.1,
    line: (room) => (room ? `My iPad map shows the Golden Chip in the ${room}!` : 'Yay! Now find the front gate!'),
  },
  {
    id: 'aisha', name: 'Aisha Sahib', role: 'Baby sister', group: 'home',
    perk: 'Crawls under tables (slowly, but she gets there)',
    look: { height: 0.56, build: 1, skin: SKIN.aisha, hair: '#16110e', hairStyle: 'baby', shirt: '#f2a7b4', pants: '#ecebe6', kind: 'baby' },
    eye: 0.38, walk: 1.3, run: 1.9, radius: 0.22, crawl: true, thirdDist: 1.4,
    line: (room) => (room ? `Goo goo… (Aisha waves toward the ${room})` : 'Hehehe! (Aisha claps)'),
  },

  // ── Aunties & Uncles ───────────────────────────────────────────────────
  aunty('nancy', 'Nancy', '#7a4b2f', { hairStyle: 'long', shirt: '#0f766e', pants: '#e7e5e4', longPants: true, earrings: '#d4a537' },
    { perk: 'Eagle eyes: the map clears further around you', sight: 8 },
    (room) => (room ? `Bula! Check the ${room}, I saw something shiny there.` : 'Vinaka! Off you go, out the front gate.')),
  aunty('louzanne', 'Louzanne', '#845436', { hairStyle: 'bun', shirt: '#f59e0b', pants: '#1e3a5f', longPants: true },
    { perk: 'Family group chat: knows which room the Golden Chip is in', chipRoom: true },
    (room) => (room ? `The family group chat says it's in the ${room}.` : 'Send a photo to the group chat when you get out!')),
  aunty('alicia', 'Alicia', '#8f5d3c', { hairStyle: 'ponytail', shirt: '#f8fafc', print: '#ec4899', pants: '#3b82f6' },
    { perk: 'Hawk eyes: the map clears further around you', sight: 7.5 },
    (room) => (room ? `Try the ${room}. Trust your Aunty.` : 'Well done! The gate is at the bottom of the driveway.')),
  aunty('maria', 'Maria', '#73472c', { hairStyle: 'long', shirt: '#7c3aed', pants: '#111827', longPants: true, earrings: '#cbd5e1' },
    { perk: 'Warmer or colder as you near the Golden Chip', sense: true },
    (room) => (room ? `You're getting warmer… try the ${room}.` : 'Hot, hot, hot! Now run for the gate.')),
  aunty('zoya', 'Zoya', '#9a6744', { hairStyle: 'ponytail', shirt: '#e11d48', pants: '#d6d3d1' },
    { perk: 'Phone map: the Golden Chip shows on the map after 5 parts', ipadAfter: 5 },
    (room) => (room ? `My phone says the ${room}. Don't tell the others!` : 'Go, go, go, out the front gate!')),
  uncle('mira', 'Mira', '#6b4229', { hairStyle: 'short', beard: true, shirt: '#2563eb', pants: '#78716c', longPants: true },
    { perk: 'Knows the way out: the front gate is on the map from the start', knowsWay: true },
    (room) => (room ? `Have you looked in the ${room}?` : 'Front gate, then you are done. Good job!')),
  aunty('fawzia', 'Fawzia', '#8f5d3c', { hairStyle: 'long', shirt: '#be185d', pants: '#1e293b', longPants: true, earrings: '#d4a537' },
    { perk: 'Quick hands: grabs parts from 1.8 m away', magnet: 1.8 },
    (room) => (room ? `Mira and I saw something gold in the ${room}.` : 'MashaAllah, well done! The front gate is down the driveway.')),
  uncle('altaaf', 'Altaaf', '#7a4b2f', { hairStyle: 'short', shirt: '#15803d', pants: '#1f2937' },
    { perk: 'Quick on his feet: runs fast', run: 4.8 },
    (room) => (room ? `Bet you can't beat me to the ${room}!` : 'Fast! Now beat the clock to the gate.')),
  uncle('ravi', 'Ravi', '#845436', { hairStyle: 'short', shirt: '#facc15', print: '#1e293b', pants: '#334155', longPants: true },
    { perk: 'Quick hands: grabs parts from 1.8 m away', magnet: 1.8 },
    (room) => (room ? `Something gold went into the ${room}. I'd check there.` : 'Safe travels: down the driveway and out the gate.')),
  uncle('malvin', 'Malvin', '#5f3b25', { hairStyle: 'afro', beard: true, shirt: '#b91c1c', pants: '#0f172a' },
    { perk: 'Long stride: walks faster than anyone', walk: 3.0, run: 4.4 },
    (room) => (room ? `Big clue: the ${room}.` : 'Isa, you found it! Off you go.')),
  uncle('hakeem', 'Hakeem', '#73472c', { hairStyle: 'short', beard: true, shirt: '#0ea5e9', pants: '#e5e7eb', longPants: true },
    { perk: 'Tech radar: parts within 6 m show on the map', radar: 6 },
    (room) => (room ? `My tech radar's pinging near the ${room}.` : "Nice work! The gate's that way.")),

  // ── Cousins (heights are guesses: change the number after the name) ─────
  cousin('mikhyle', 'Mikhyle', 1.5, '#7a4b2f', { hairStyle: 'short', shirt: '#1d4ed8', print: '#fde047', pants: '#111827' },
    { perk: 'Sprinter: the fastest of the cousins', run: 4.9 },
    (room) => (room ? `Psst… it's in the ${room}.` : 'You got it! Race you to the gate!')),
  cousin('nabeeha', 'Nabeeha', 1.42, '#8f5d3c', { hairStyle: 'long', shirt: '#f472b6', pants: '#1e40af' },
    { perk: 'Tablet map: the Golden Chip shows on the map after 5 parts', ipadAfter: 5 },
    (room) => (room ? `I think it's in the ${room}!` : 'Yay! Now find the front gate!')),
  cousin('emaana', 'Emaana', 1.3, '#9a6744', { hairStyle: 'bun', shirt: '#a3e635', pants: '#4b5563' },
    { perk: 'Warmer or colder as you near the Golden Chip', sense: true },
    (room) => (room ? `Warmer… warmer… try the ${room}!` : 'You found it! Now the gate!')),
  cousin('rohan', 'Rohan', 1.45, '#6b4229', { hairStyle: 'afro', shirt: '#f97316', pants: '#1f2937' },
    { perk: 'Quick hands: grabs parts from 1.8 m away', magnet: 1.8 },
    (room) => (room ? `Saw it in the ${room}. Hurry!` : 'Run! Front gate!')),
  cousin('kahaani', 'Kahaani', 1.2, '#845436', { hairStyle: 'ponytail', shirt: '#fbbf24', pants: '#7c3aed' },
    { perk: 'Family group chat: knows which room the Golden Chip is in', chipRoom: true },
    (room) => (room ? `It's in the ${room}! I saw it first!` : 'Bye bye! Out the gate!')),
  cousin('yash', 'Yash', 1.3, '#7a4b2f', { hairStyle: 'short', shirt: '#14b8a6', pants: '#374151' },
    { perk: 'Tech radar: parts within 5 m show on the map', radar: 5 },
    (room) => (room ? `Beep beep… my radar says the ${room}.` : 'Mission almost complete: front gate!')),
  cousin('maanvi', 'Maanvi', 1.15, '#a06e4a', { hairStyle: 'long', shirt: '#c084fc', pants: '#fef3c7' },
    { perk: 'Knows the way out: the front gate is on the map from the start', knowsWay: true },
    (room) => (room ? `The ${room}! The ${room}!` : 'Yay! You did it!')),
  cousin('sarah', 'Sarah', 1.38, '#8f5d3c', { hairStyle: 'ponytail', shirt: '#38bdf8', pants: '#f1f5f9' },
    { perk: 'Sharp eyes: the map clears further around you', sight: 7.5 },
    (room) => (room ? `Look in the ${room}, cousin!` : 'Go cousin, go! Out the gate!')),
];

export const characterById = (id: string): Character => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[1];

export const firstName = (c: Character) => c.name.split(' ')[0];
