// The shops along McFarlane Road, opened up: each is a building you can walk
// into, with a glass door you open with E (double doors for the supermarkets),
// and an inside to suit the shop: the bakery's counter and shelves of bread,
// Jack's clothes racks, the supermarkets' aisles, checkouts and fridges,
// Manubhai's paint, tools and timber, and four small shops in Sardaar Complex.
// A small LvTS plaque (logo and number) sits by each shop's windows.
//
// Pure data, no three.js: layout.ts adds the rooms, barriers, props and doors;
// the engine draws the awnings, the sign boards and Sardaar's upper storey.
import type { Prim, Barrier, Room, Door, XZ } from './layout.ts';
import { SHOPS, SHOP_FRONTS, type ShopKind } from './shops.ts';

/** The shop line (neighbourhood.ts SHOP_LINE) and the back of the shops (SHOP_DEPTH 6 m behind it). */
const F = 31.6, K = 37.6, T = 0.12;
const HALF_PI = Math.PI / 2;

/** How tall each kind of shop is (m). */
export const shopTall = (kind: ShopKind) => (kind === 'complex' ? 7.4 : kind === 'cinema' ? 6.2 : kind === 'supermarket' ? 5.2 : 4.2);

export interface ShopInside {
  id: string; name: string; kind: ShopKind; wall: string;
  x0: number; x1: number;
  /** The doorways in the front wall, along x. */
  doors: { x0: number; x1: number }[];
  /** Sardaar Complex's four shops, along x (the walls between them sit in the gaps). */
  units?: { x0: number; x1: number }[];
}

/** Sardaar Complex's shops: four across the front, with piers between them (as its facade is drawn). */
export function complexUnits(x0: number, x1: number) {
  const w = x1 - x0, n = 4;
  return Array.from({ length: n }, (_, i) => {
    const a = x0 + 0.3 + (i * (w - 0.6)) / n;
    return { x0: a, x1: a + (w - 0.6) / n - 0.25 };
  });
}

export const SHOP_INSIDES: ShopInside[] = SHOPS.flatMap((s, i): ShopInside[] => {
  if (s.kind === 'mall') return [];
  const { x0, x1 } = SHOP_FRONTS[i], m = (x0 + x1) / 2;
  if (s.kind === 'complex') {
    const units = complexUnits(x0, x1);
    return [{ id: s.id, name: s.name, kind: s.kind, wall: s.wall, x0, x1, units, doors: units.map((u) => ({ x0: (u.x0 + u.x1) / 2 - 0.45, x1: (u.x0 + u.x1) / 2 + 0.45 })) }];
  }
  const half = s.kind === 'supermarket' ? 1.0 : 0.5;
  return [{ id: s.id, name: s.name, kind: s.kind, wall: s.wall, x0, x1, doors: [{ x0: m - half, x1: m + half }] }];
});

/** Every shop doorway along the front (layout.ts leaves these gaps in the shopfront line). */
export const SHOP_DOOR_GAPS = SHOP_INSIDES.flatMap((s) => s.doors);

const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, color: string, solid = false, extra: Partial<Extract<Prim, { kind: 'box' }>> = {}): Prim =>
  ({ kind: 'box', min: [x0, y0, z0], max: [x1, y1, z1], color, solid, plain: true, ...extra });
const cyl = (x: number, y: number, z: number, r: number, h: number, color: string, solid = false, seg = 12, top?: number): Prim =>
  ({ kind: 'cyl', base: [x, y, z], r, h, color, solid, seg, top });

/** A seeded random, so every visitor sees the same shelves. */
function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
const GOODS = ['#d63a2f', '#f2b705', '#2f6db5', '#2f9e44', '#f2f2ef', '#e8742b', '#7c3aed', '#0891b2', '#c2410c', '#be185d'];

/** The small LvTS plaque: the logo and the number, 0.9 m by 0.42 m, on a wall facing -z with its left end at x. */
export const lvtsPlaque = (x: number, y: number, z: number): Prim => box(x, y, z - 0.03, x + 0.9, y + 0.42, z, '#ffffff', false, { tex: 'lvts:-z' });

/** The shops' rooms, barriers, props and doors, on ground at height `y` (the road). */
export function shopInsides(y: number): { rooms: Room[]; barriers: Barrier[]; props: Prim[]; doors: Door[] } {
  const rooms: Room[] = [], barriers: Barrier[] = [], props: Prim[] = [], doors: Door[] = [];
  const add = (...p: Prim[]) => { props.push(...p); };
  const wall = (a: XZ, b: XZ): Barrier => ({ a, b, kind: 'facade', h: 3.2, t: 0.12, mode: 'explore' });
  const f = F + T, k = K - T;                   // the inside faces of the front and back walls

  for (const s of SHOP_INSIDES) {
    const { x0, x1 } = s, tall = shopTall(s.kind), ceil = s.kind === 'supermarket' ? 3.4 : 3.2;
    const a = x0 + T, b = x1 - T;               // the inside faces of the side walls
    const r = rng(Math.round(x0 * 31 + 7));

    // ── the shell: front wall (doorways left open), back, sides, roof, a ceiling inside ──
    let at = x0;
    for (const d of s.doors) {
      add(box(at, y - 0.3, F, d.x0, y + tall, F + T, s.wall));
      add(box(d.x0, y + 2.25, F, d.x1, y + tall, F + T, s.wall));
      // a dark frame round the doorway
      add(box(d.x0 - 0.06, y, F - 0.03, d.x0, y + 2.25, F + T + 0.03, '#3b3f44'), box(d.x1, y, F - 0.03, d.x1 + 0.06, y + 2.25, F + T + 0.03, '#3b3f44'));
      add(box(d.x0 - 0.06, y + 2.19, F - 0.03, d.x1 + 0.06, y + 2.25, F + T + 0.03, '#3b3f44'));
      at = d.x1;
    }
    add(box(at, y - 0.3, F, x1, y + tall, F + T, s.wall));
    add(
      box(x0, y - 0.3, k, x1, y + tall, K, s.wall),
      box(x0, y - 0.3, F, a, y + tall, K, s.wall), box(b, y - 0.3, F, x1, y + tall, K, s.wall),
      box(x0, y + tall - 0.2, F, x1, y + tall, K, s.wall),
      box(a, y + ceil, f, b, y + ceil + 0.06, k, '#f4f4f2'),
    );
    if (s.kind === 'complex') add(box(x0, y + ceil + 0.06, F, x1, y + tall - 0.2, K, s.wall));   // the offices upstairs
    barriers.push(wall([x0 + 0.06, F], [x0 + 0.06, K]), wall([x1 - 0.06, F], [x1 - 0.06, K]), wall([x0, K - 0.06], [x1, K - 0.06]));

    // ── the doors ──
    s.doors.forEach((d, i) => {
      const id = `door-${s.id}${s.doors.length > 1 ? `-${i + 1}` : ''}`;
      const label = s.kind === 'complex' ? `${s.name} shop door` : `${s.name} door`;
      const base = { kind: 'hinged' as const, label, color: '#3b3f44', exterior: true, style: 'glass' as const, height: 2.2, base: y };
      if (d.x1 - d.x0 > 1.5) {
        const w = (d.x1 - d.x0) / 2;
        doors.push({ ...base, id: `${id}-l`, hinge: [d.x0, F + 0.06], width: w, closed: 0, swing: HALF_PI, pair: `${id}-r` });
        doors.push({ ...base, id: `${id}-r`, hinge: [d.x1, F + 0.06], width: w, closed: Math.PI, swing: -HALF_PI, pair: `${id}-l` });
      } else {
        doors.push({ ...base, id, hinge: [d.x0, F + 0.06], width: d.x1 - d.x0, closed: 0, swing: HALF_PI });
      }
    });

    // ── windows either side of the door (glass inside and out), and the LvTS plaque by the right-hand window ──
    const glass = (wx0: number, wx1: number, gy0: number, gy1: number) => {
      if (wx1 - wx0 < 0.3) return;
      add(box(wx0, y + gy0, F - 0.03, wx1, y + gy1, F, '#cfe8f5'), box(wx0, y + gy0, F + T, wx1, y + gy1, F + T + 0.02, '#cfe8f5'));
    };
    const plaqueX = x1 - 1.45;
    if (s.kind === 'complex') {
      // Sardaar's four shops: glass either side of each door, a coloured band over each
      const bands = ['#2f6db5', '#2f9e44', '#e8742b', '#f3d36b'];
      s.units!.forEach((u, i) => {
        const d = s.doors[i];
        glass(u.x0, d.x0 - 0.08, 0.4, 2.3);
        glass(d.x1 + 0.08, i === s.units!.length - 1 ? u.x1 - 1.05 : u.x1, 0.4, 2.3);
        add(box(u.x0, y + 2.45, F - 0.04, u.x1, y + 2.8, F, bands[i]));
      });
      add(lvtsPlaque(s.units!.at(-1)!.x1 - 0.95, y + 1.25, F - 0.005));
    } else if (s.kind === 'supermarket') {
      const d = s.doors[0];
      glass(x0 + 0.4, d.x0 - 0.08, 0.15, 2.4);
      glass(d.x1 + 0.08, plaqueX - 0.15, 0.15, 2.4);
      for (let x = x0 + 1.6; x < plaqueX - 0.2; x += 1.6) if (x < d.x0 - 0.1 || x > d.x1 + 0.1) add(box(x - 0.04, y + 0.15, F - 0.05, x + 0.04, y + 2.4, F - 0.03, '#9aa3aa'));
      add(lvtsPlaque(plaqueX, y + 1.25, F - 0.005));
    } else {
      const d = s.doors[0];
      glass(x0 + 0.5, d.x0 - 0.2, 0.6, 2.2);
      glass(d.x1 + 0.2, plaqueX - 0.15, 0.6, 2.2);
      add(lvtsPlaque(plaqueX, y + 1.25, F - 0.005));
    }

    // ── lights ──
    for (let x = a + 1.4; x < b - 0.8; x += 2.8) add(box(x - 0.5, y + ceil - 0.04, (f + k) / 2 - 0.2, x + 0.5, y + ceil, (f + k) / 2 + 0.2, '#fffdf5', false, { emissive: true }));

    // ── the inside, by kind of shop (nothing in front of a door where it swings) ──
    const m = (x0 + x1) / 2;
    const floor: Room['floor'] = s.kind === 'food' ? 'tile' : s.kind === 'shop' ? 'deck' : s.kind === 'hardware' ? 'concrete' : 'bath';
    if (s.kind === 'food') {
      // the bakery: a glass counter of buns and pies, shelves of bread behind, the oven, two tables
      add(box(a + 1.0, y, f + 2.0, b - 1.0, y + 0.95, f + 2.6, '#f4f1ea', true), box(a + 1.0, y + 0.95, f + 2.0, b - 1.0, y + 1.3, f + 2.6, '#d6ecf3'));
      for (let x = a + 1.2; x < b - 1.3; x += 0.42) add(box(x, y + 0.97, f + 2.15, x + 0.3, y + 1.08, f + 2.45, r() < 0.5 ? '#c98b4a' : '#e0b070'));
      add(box(a + 0.4, y, k - 0.45, b - 0.4, y + 2.0, k, '#8a5a36', true));
      for (const h of [0.5, 1.0, 1.5]) for (let x = a + 0.5; x < b - 0.7; x += 0.38) add(box(x, y + h, k - 0.4, x + 0.3, y + h + 0.16, k - 0.12, r() < 0.5 ? '#c98b4a' : '#d9a066'));
      add(box(a + 0.15, y, f + 3.3, a + 0.95, y + 1.6, f + 4.3, '#b8bcc0', true), box(a + 0.95, y + 0.6, f + 3.45, a + 0.97, y + 1.3, f + 4.15, '#2b2f33'));
      add(box(m - 1.5, y + 2.25, k - 0.04, m + 1.5, y + 2.95, k, '#2b2f33'));
      for (let i = 0; i < 4; i++) add(box(m - 1.3, y + 2.38 + i * 0.14, k - 0.05, m + (i % 2 ? 0.6 : 1.1), y + 2.42 + i * 0.14, k - 0.04, '#f4f4f2'));
      for (const tx of [a + 1.0, b - 1.0]) {
        add(cyl(tx, y + 0.72, f + 1.3, 0.38, 0.04, '#f4f1ea', true, 16), cyl(tx, y, f + 1.3, 0.05, 0.72, '#3b3f44', false, 8));
        for (const sx of [-0.55, 0.55]) add(cyl(tx + sx, y, f + 1.3, 0.16, 0.45, '#8a5a36', true, 10));
      }
    } else if (s.kind === 'shop') {
      // Jack's: racks of clothes, shelves of gifts down both walls, the counter, a mirror
      for (const rz of [f + 2.2, f + 3.7]) for (const [rx0, rx1] of [[a + 0.9, m - 0.9], [m + 0.9, b - 0.9]]) {
        add(cyl(rx0, y, rz, 0.025, 1.5, '#9aa0a6', false, 6), cyl(rx1, y, rz, 0.025, 1.5, '#9aa0a6', false, 6), box(rx0, y + 1.45, rz - 0.02, rx1, y + 1.5, rz + 0.02, '#9aa0a6'));
        for (let x = rx0 + 0.15; x < rx1 - 0.1; x += 0.14) add(box(x, y + 0.55, rz - 0.22, x + 0.06, y + 1.42, rz + 0.22, GOODS[Math.floor(r() * GOODS.length)]));
        add(box(rx0 - 0.05, y, rz - 0.26, rx1 + 0.05, y + 1.5, rz + 0.26, 'transparent', true));
      }
      for (const [sx0, sx1] of [[a, a + 0.42], [b - 0.42, b]]) {
        add(box(sx0, y, f + 1.3, sx1, y + 2.1, k - 0.3, '#e9e4d8', true));
        for (const h of [0.45, 1.0, 1.55]) for (let z = f + 1.4; z < k - 0.5; z += 0.32) add(box(sx0 + 0.04, y + h, z, sx1 - 0.04, y + h + 0.18, z + 0.24, GOODS[Math.floor(r() * GOODS.length)]));
      }
      add(box(m - 1.2, y, k - 1.4, m + 1.2, y + 1.0, k - 0.8, '#8a5a36', true), box(m + 0.5, y + 1.0, k - 1.25, m + 0.9, y + 1.25, k - 0.95, '#1d1f22'));
      add(box(b - 1.3, y + 0.3, k - 0.04, b - 0.6, y + 2.0, k, '#d6ecf3'));
    } else if (s.kind === 'supermarket') {
      // a supermarket: two checkouts by the door, three aisles of shelves, fridges along the back
      for (const [cx0, cx1] of [[a + 0.6, a + 2.4], [b - 2.4, b - 0.6]]) {
        add(box(cx0, y, f + 1.3, cx1, y + 0.9, f + 1.9, '#e9e4d8', true), box(cx0, y + 0.9, f + 1.3, cx1, y + 0.93, f + 1.9, '#2b2f33'));
        add(box(cx1 - 0.45, y + 0.93, f + 1.4, cx1 - 0.1, y + 1.2, f + 1.7, '#1d1f22'));
      }
      add(box(a + 0.3, y, f + 0.3, a + 0.8, y + 0.5, f + 0.8, '#d63a2f', true));
      for (const gx of [m - 3.6, m, m + 3.6]) {
        const gz0 = f + 2.8, gz1 = k - 1.6;
        add(box(gx - 0.5, y, gz0, gx + 0.5, y + 1.6, gz1, '#f4f4f2', true));
        for (const side of [-1, 1]) for (const h of [0.15, 0.6, 1.05]) for (let z = gz0 + 0.05; z < gz1 - 0.1; z += (gz1 - gz0 - 0.1) / 3) {
          const fx = gx + side * 0.5;
          add(box(Math.min(fx, fx + side * 0.03), y + h, z, Math.max(fx, fx + side * 0.03), y + h + 0.32, z + (gz1 - gz0 - 0.1) / 3 - 0.04, GOODS[Math.floor(r() * GOODS.length)]));
        }
      }
      add(box(a + 0.3, y, k - 0.7, b - 0.3, y + 2.1, k, '#e9eef0', true));
      for (let x = a + 0.35; x < b - 0.9; x += 0.9) add(box(x, y + 0.2, k - 0.72, x + 0.82, y + 1.95, k - 0.7, '#d7f0f7'));
    } else if (s.kind === 'hardware') {
      // Manubhai: paint on tall shelves, a wall of tools, a rack of timber, the counter
      add(box(a, y, f + 1.3, a + 0.6, y + 2.4, k - 0.2, '#8a5a36', true));
      for (const h of [0.1, 0.8, 1.5]) for (let z = f + 1.45; z < k - 0.45; z += 0.36) add(cyl(a + 0.3, y + h, z, 0.14, 0.32, r() < 0.3 ? '#f4f4f2' : GOODS[Math.floor(r() * GOODS.length)], false, 10));
      add(box(a + 0.9, y + 0.9, k - 0.04, b - 0.9, y + 2.4, k, '#c9a96e'));
      for (let x = a + 1.1; x < b - 1.1; x += 0.35) add(box(x, y + 1.2 + (Math.round(x * 10) % 3) * 0.3, k - 0.08, x + 0.06, y + 1.6 + (Math.round(x * 10) % 3) * 0.3, k - 0.04, r() < 0.5 ? '#1d1f22' : '#d63a2f'));
      add(box(m - 0.45, y, f + 1.8, m + 0.45, y + 0.9, k - 1.2, '#6b4a2b', true));
      for (let i = 0; i < 5; i++) add(box(m - 0.42 + i * 0.17, y + 0.9, f + 1.8, m - 0.28 + i * 0.17, y + 1.02 + (i % 2) * 0.08, k - 1.2, '#d9b77e'));
      add(box(b - 1.8, y, f + 1.2, b - 0.4, y + 1.0, f + 1.8, '#8a5a36', true), box(b - 0.9, y + 1.0, f + 1.3, b - 0.5, y + 1.25, f + 1.6, '#1d1f22'));
    } else if (s.kind === 'complex') {
      // Sardaar: four small shops, a wall between each, a counter and shelves in each
      const u = s.units!;
      const edges = [x0 + T, ...u.slice(0, -1).map((q) => q.x1 + 0.125), x1 - T];
      for (let i = 1; i < edges.length - 1; i++) {
        add(box(edges[i] - 0.06, y, F + T, edges[i] + 0.06, y + ceil, k, s.wall));
        barriers.push(wall([edges[i], F], [edges[i], K]));
      }
      for (let i = 0; i < u.length; i++) {
        const ua = edges[i], ub = edges[i + 1];
        add(box(ua + 0.3, y, k - 1.2, ub - 0.3, y + 1.0, k - 0.7, '#8a5a36', true));
        add(box(ua + 0.06, y, f + 1.2, ua + 0.46, y + 2.0, k - 1.5, '#e9e4d8', true));
        for (const h of [0.4, 0.95, 1.5]) for (let z = f + 1.3; z < k - 1.7; z += 0.3) add(box(ua + 0.1, y + h, z, ua + 0.42, y + h + 0.2, z + 0.22, GOODS[Math.floor(r() * GOODS.length)]));
        rooms.push({ id: `in-${s.id}-${i + 1}`, name: `${s.name}, shop ${i + 1}`, x0: ua, x1: ub, z0: F, z1: k, floor, ceiling: false, outside: false, ground: true, area: true, explore: true });
      }
      continue;
    }
    rooms.push({ id: `in-${s.id}`, name: s.name, x0: a, x1: b, z0: F, z1: k, floor, ceiling: false, outside: false, ground: true, area: true, explore: true });
  }
  return { rooms, barriers, props, doors };
}
