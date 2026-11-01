// The shops across McFarlane Road from the front gate. Add a shop here (with
// its logo in public/neighbourhood/logos/) and the row grows by one: the
// buildings, the footpath, the walls and the map all follow this list.
//
// The logos belong to their businesses. Before the game goes live with a
// business's logo, it's worth getting that business's OK (it can also be the
// start of an in-game offer; see `offers` in neighbourhood.ts).

export type ShopKind = 'empty' | 'shop' | 'food' | 'supermarket' | 'cinema' | 'hardware' | 'complex' | 'church' | 'mosque' | 'temple' | 'mall' | 'community';

export interface ShopDef {
  id: string;
  /** As it appears on the sign and the shop's panel. */
  name: string;
  kind: ShopKind;
  /** Frontage along the road (m). */
  width: number;
  /** Wall colour and the awning/sign colour. */
  wall: string;
  sign: string;
  /** The business's logo in public/neighbourhood/logos/, shown on the sign board above the front. */
  logo?: string;
  /** Background behind the logo (most are on white). */
  logoBg?: string;
  /** A second line for a text sign (shops without a logo). */
  sub?: string;
  blurb: string;
}

export const SHOPS: ShopDef[] = [
  { id: 'hot-bread-kitchen', name: 'The Hot Bread Kitchen', kind: 'food', width: 8.6, wall: '#f6e7c8', sign: '#d6261c', logo: 'hot-bread-kitchen.png', blurb: 'Fresh bread, buns and pies.' },
  { id: 'jacks', name: "Jack's of Fiji", kind: 'shop', width: 8.6, wall: '#eef4dc', sign: '#8dbf1e', logo: 'jacks-of-fiji.png', blurb: 'Clothing, souvenirs and gifts.' },
  { id: 'new-world', name: 'New World IGA', kind: 'supermarket', width: 12.6, wall: '#f4f2ec', sign: '#1f8a3b', logo: 'new-world-iga.png', blurb: 'Groceries and everyday shopping.' },
  { id: 'costuless', name: 'CostULess', kind: 'supermarket', width: 12.6, wall: '#f2f0ea', sign: '#d61f26', logo: 'costuless.png', blurb: 'Groceries and household goods in bulk.' },
  { id: 'damodar', name: 'Damodar Cinemas', kind: 'cinema', width: 12.6, wall: '#2b2d31', sign: '#d61f26', logo: 'damodar-cinemas.png', logoBg: '#070707', blurb: 'Movies on the big screen.' },
  { id: 'manubhai', name: 'R.C. Manubhai', kind: 'hardware', width: 8.6, wall: '#e8ecf6', sign: '#2b3990', logo: 'manubhai.png', blurb: 'Hardware and building supplies.' },
  { id: 'sardaar', name: 'Sardaar Complex', kind: 'complex', width: 16.6, wall: '#f1ecd9', sign: '#c8102e', blurb: 'Shops on the ground floor, offices upstairs.' },
];

/** The row starts here (x, m) and runs east; 0.8 m between buildings. */
const ROW_X0 = -44;
const GAP = 0.8;

/** Each shop's frontage, in order along the road. */
export const SHOP_FRONTS = (() => {
  let x = ROW_X0;
  return SHOPS.map((s) => { const x0 = x; x += s.width + GAP; return { id: s.id, x0, x1: x0 + s.width }; });
})();

/** Where the row of shops starts and ends along McFarlane Road. */
export const SHOP_ROW = { x0: ROW_X0, x1: SHOP_FRONTS.length ? SHOP_FRONTS[SHOP_FRONTS.length - 1].x1 : ROW_X0 };
