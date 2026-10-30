// The Sahib family, as playable characters. Looks are taken from the clothes
// in the family's photos and kept low-poly: blocky figures, not likenesses.
//
// To change how names appear in the game (for example first names only),
// edit `name` here; nothing else needs to change.

export type CharacterId = 'hussein' | 'josese' | 'zane' | 'mahala' | 'aisha';

export interface Look {
  /** Standing height in metres (for the baby, length from head to toe). */
  height: number;
  /** Shoulder and hip width factor. */
  build: number;
  skin: string;
  hair: string;
  hairStyle: 'short' | 'afro' | 'bun' | 'grey' | 'baby';
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
  /** Third-person camera distance. */
  thirdDist: number;
  /** What they say when you walk up and talk to them. `room` is the Golden Chip's room, or null once you have it. */
  line: (room: string | null) => string;
}

const SKIN = { hussein: '#7d4f33', josese: '#6f4529', zane: '#7a4a2c', mahala: '#8a5636', aisha: '#93603f' };

export const CHARACTERS: Character[] = [
  {
    id: 'hussein', name: 'Hussein Sahib', role: 'Grandpa',
    perk: 'Wise eyes: the map reveals further around you',
    look: { height: 1.72, build: 1.05, skin: SKIN.hussein, hair: '#d6d3cc', hairStyle: 'grey', shirt: '#1f2226', pants: '#c4b08a', longPants: true, shoes: '#2a2a2a', kind: 'adult' },
    eye: 1.6, walk: 2.2, run: 3.4, radius: 0.28, sight: 8.5, thirdDist: 2.6,
    line: (room) => (room ? `Bula! Something shiny caught my eye in the ${room}.` : 'Vinaka! Now go down the driveway and out the front gate.'),
  },
  {
    id: 'josese', name: 'Josese Sahib', role: 'Dad',
    perk: 'Tech radar: parts within 7 m show on the map, even through walls',
    look: { height: 1.82, build: 1.3, skin: SKIN.josese, hair: '#16110e', hairStyle: 'afro', beard: true, shirt: '#22262b', print: '#e46a8a', pants: '#8ec5e8', shoes: '#30343a', kind: 'adult' },
    eye: 1.7, walk: 2.6, run: 4.3, radius: 0.28, radar: 7, thirdDist: 2.7,
    line: (room) => (room ? `My tech radar says the Golden Chip is somewhere in the ${room}.` : 'Nice work! The front gate is at the bottom of the driveway.'),
  },
  {
    id: 'zane', name: 'Zane Sahib', role: 'Big brother',
    perk: 'Fastest runner in the house',
    look: { height: 1.66, build: 0.95, skin: SKIN.zane, hair: '#16110e', hairStyle: 'short', shirt: '#f4f4f2', pants: '#1d1f22', kind: 'adult' },
    eye: 1.55, walk: 2.9, run: 5.0, radius: 0.27, thirdDist: 2.5,
    line: (room) => (room ? `I saw something gold in the ${room}. Race you there!` : 'You got it! Last one to the front gate loses.'),
  },
  {
    id: 'mahala', name: 'Mahala Sahib', role: 'Big sister',
    perk: 'iPad map: the Golden Chip shows on the map once you have 6 parts',
    look: { height: 1.28, build: 0.9, skin: SKIN.mahala, hair: '#16110e', hairStyle: 'bun', shirt: '#d9c6ec', pants: '#b8962e', kind: 'kid' },
    eye: 1.15, walk: 2.6, run: 4.5, radius: 0.24, ipadAfter: 6, thirdDist: 2.1,
    line: (room) => (room ? `My iPad map shows the Golden Chip in the ${room}!` : 'Yay! Now find the front gate!'),
  },
  {
    id: 'aisha', name: 'Aisha Sahib', role: 'Baby sister',
    perk: 'Crawls under tables (slowly, but she gets there)',
    look: { height: 0.56, build: 1, skin: SKIN.aisha, hair: '#16110e', hairStyle: 'baby', shirt: '#f2a7b4', pants: '#ecebe6', kind: 'baby' },
    eye: 0.38, walk: 1.3, run: 1.9, radius: 0.22, crawl: true, thirdDist: 1.4,
    line: (room) => (room ? `Goo goo… (Aisha waves toward the ${room})` : 'Hehehe! (Aisha claps)'),
  },
];

export const characterById = (id: string): Character => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[1];

export const firstName = (c: Character) => c.name.split(' ')[0];
