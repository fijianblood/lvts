// Fig: how a database index works, drawn with the Anatomy kit as a real object.
//
// A card catalogue (the index) on the left, a shelf of sixteen archive boxes
// (the table, rows stored in arrival order) on the right, and a reader carriage
// on rails that fetches one box. A seek opens the root drawer, then one leaf
// drawer, then reads one box: 3 reads. A scan has to open every box: 16 reads.
// Every number on the card comes from the same small model that moves the parts.
//
// Build:  ANATOMY=/path/to/anatomy node tools/db-index-figure/build.mjs
// Writes public/house-hunt/db-index.html. The Anatomy kit (MIT, (c) 2026 Ryan)
// is inlined into that page.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ANATOMY = process.env.ANATOMY ?? "/mnt/skills/plugins/anatomy";
const k = await import(pathToFileURL(join(ANATOMY, "kit/iso-kit.mjs")).href);
const { kitScript } = await import(pathToFileURL(join(ANATOMY, "scripts/inline-kit.mjs")).href);
const OUT = resolve(HERE, "../../public/house-hunt");
const theme = process.argv.includes("--dark") ? "dark" : "light";

// ── the model ────────────────────────────────────────────────────────────────
const ROWS = 64;            // keys 1..64
const PER_BOX = 4;          // rows per table page
const BOXES = ROWS / PER_BOX;
const FANOUT = 4;           // root guide cards; each leaf drawer holds 16 sorted keys
const PER_LEAF = ROWS / FANOUT;
// rows arrive in no particular order: a fixed shuffle decides which box each key lives in
function seeded(seed) { let s = seed; return () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296); }
const order = Array.from({ length: ROWS }, (_, i) => i + 1);
{ const r = seeded(37); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; } }
const BOX_OF = {};
order.forEach((key, i) => { BOX_OF[key] = Math.floor(i / PER_BOX); });

// ── layout (world units, about 1 px each; x right, y toward the viewer, z up) ─
const W = 640, H = 400;
const PLATE = { x: -176, y: -72, w: 350, d: 128, r: 8 };
const PLATE_H = 10, FOOT_H = 5;

const FRONT = 2;                                   // cabinet front face, y
const CAB = { x: -164, y: FRONT - 62, w: 96, d: 62, r: 1.4 };
const CAB_Z0 = 6, CAB_TOP = 86;
const DEPTH = 46;                                  // drawer depth
const ROOT = { x: -156, w: 80, z0: 60, z1: 78 };
const LEAF_W = 17.5, LEAF_GAP = 3;
const LEAVES = Array.from({ length: FANOUT }, (_, j) => ({ x: -156 + j * (LEAF_W + LEAF_GAP), w: LEAF_W, z0: 34, z1: 54 }));
const CUP = { x: -156, w: 80, z0: 12, z1: 28 };

const BOX = { pitch: 11.8, w: 10.6, y0: -38, y1: -9, z0: 5, z1: 33 };
const boxX = (i) => -40 + i * BOX.pitch;
const boxCentre = (i) => boxX(i) + BOX.w / 2;
const LIFT = 9;
const RAIL_Y = [5, 13];
const CARRIAGE = { x: -10, y: 2, w: 20, d: 16, r: 2 };
const OPEN = 26;                                   // how far a drawer slides out

const AZ = 54;
const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [CAB.x, CAB.y, CAB_TOP + 4], [CAB.x + CAB.w, FRONT + OPEN + 3, ROOT.z1 + 6], [boxX(15) + BOX.w + 8, BOX.y0 - 6, BOX.z1 + LIFT + 6]],
  W, H, { pad: 26, azimuth: AZ },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const Dots = (points, style) => k.dotsSvg(points, style);
const fmt = (n) => Math.round(n * 10) / 10;
const path3 = (pts, close = false) => pts.map((p, i) => { const [x, y] = at(p); return `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`; }).join("") + (close ? "Z" : "");
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function hull(points) {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [], upper = [];
  for (const p of pts) { while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop(); lower.push(p); }
  for (const p of [...pts].reverse()) { while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop(); upper.push(p); }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// ── base plate, feet, ruler strip, label plate ──────────────────────────────
function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "faint" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip under the rails: one major tick under every box
  const strip = { x: boxX(0) - 4, y: 24, w: boxX(15) + BOX.w + 4 - (boxX(0) - 4), d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(boxCentre(0), boxCentre(15), BOX.pitch / 2, 2, strip.y + 0.6, 0.6, [2, 3.8], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(Dots([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate, front left
  const lp = { x: -160, y: 26, w: 44, d: 16, r: 1.2 };
  out.push(S(k.slabOf(lp, 0, 0.8, P, 4), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(lp, 1.6), 0.8, P, 4), { tone: "faint" }));
  [[6, 36], [6, 28], [6, 32]].forEach(([x0, len], i) => out.push(L(k.lineOnTop([lp.x + x0, lp.y + 4.5 + i * 3.4], [lp.x + x0 + len - (i === 1 ? 8 : 0), lp.y + 4.5 + i * 3.4], 0.8, P), { tone: "lo", free: true })));
  out.push(Dots([at([lp.x + 2.4, lp.y + 2.4, 0.8]), at([lp.x + lp.w - 2.4, lp.y + lp.d - 2.4, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ── the catalogue cabinet ───────────────────────────────────────────────────
function opening(o) {
  // the dark cavity behind a drawer front, drawn on the cabinet's front face
  return `<path class="iso-shade" data-shade="0" d="${path3([[o.x, FRONT + 0.05, o.z0], [o.x + o.w, FRONT + 0.05, o.z0], [o.x + o.w, FRONT + 0.05, o.z1], [o.x, FRONT + 0.05, o.z1]], true)}"/>`
    + L(path3([[o.x, FRONT + 0.06, o.z0], [o.x + o.w, FRONT + 0.06, o.z0], [o.x + o.w, FRONT + 0.06, o.z1], [o.x, FRONT + 0.06, o.z1]], true), { tone: "lo" });
}

function cabinet() {
  const out = [];
  out.push(S(k.slabOf({ x: CAB.x + 2, y: CAB.y + 2, w: CAB.w - 4, d: CAB.d - 2, r: 1 }, 0, CAB_Z0, P, 3, 0.4), { tone: "lo" }));
  out.push(S(k.slabOf(CAB, CAB_Z0, CAB_TOP - CAB_Z0, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(CAB, CAB_Z0 + 2, P, 3), { tone: "faint" }) }));
  // rails between drawer rows, as lines across the full face
  for (const z of [ROOT.z0 - 3, LEAVES[0].z0 - 3, CUP.z1 + 3]) out.push(L(path3([[CAB.x, FRONT + 0.05, z], [CAB.x + CAB.w, FRONT + 0.05, z]]), { tone: "faint" }));
  out.push(opening(ROOT));
  for (const o of LEAVES) out.push(opening(o));
  // the cupboard at the bottom: two doors with small knobs, shut
  for (const [x0, x1] of [[CUP.x, CUP.x + CUP.w / 2 - 0.5], [CUP.x + CUP.w / 2 + 0.5, CUP.x + CUP.w]]) {
    out.push(S(k.slabOf({ x: x0, y: FRONT, w: x1 - x0, d: 1.2, r: 0.3 }, CUP.z0, CUP.z1 - CUP.z0, P, 2, 0.3), { tone: "mid" }));
  }
  for (const x of [CUP.x + CUP.w / 2 - 4, CUP.x + CUP.w / 2 + 2]) out.push(S(k.slabOf({ x, y: FRONT + 1.2, w: 2, d: 1.6, r: 0.4 }, (CUP.z0 + CUP.z1) / 2 - 1, 2, P, 2), { tone: "mid" }));
  // the lid, with a brass label plate engraved INDEX (the figure's one label)
  const lid = { x: CAB.x - 1, y: CAB.y - 1, w: CAB.w + 2, d: CAB.d + 1, r: 1.6 };
  out.push(S(k.slabOf(lid, CAB_TOP, 4, P, 4, 1.0), { tone: "mid" }));
  const brass = { x: CAB.x + CAB.w / 2 - 14, y: FRONT - 16, w: 28, d: 9, r: 0.8 };
  out.push(S(k.slabOf(brass, CAB_TOP + 4, 0.6, P, 3), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(brass, 1.2), CAB_TOP + 4.6, P, 3), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([brass.x + brass.w / 2, brass.y + brass.d / 2 + 1.1], CAB_TOP + 4.6, P, "x"), "INDEX", { size: 3.4, tone: "lo", anchor: "middle" }));
  out.push(Dots([at([brass.x + 1.6, brass.y + brass.d / 2, CAB_TOP + 4.6]), at([brass.x + brass.w - 1.6, brass.y + brass.d / 2, CAB_TOP + 4.6])], { size: 0.4 }));
  // the side: a framed panel and a brass carrying handle, so the big side face has its real parts
  const X = CAB.x + CAB.w;
  const panel = (inset) => path3([[X + 0.05, CAB.y + inset, CAB_Z0 + inset], [X + 0.05, FRONT - inset, CAB_Z0 + inset], [X + 0.05, FRONT - inset, CAB_TOP - inset], [X + 0.05, CAB.y + inset, CAB_TOP - inset]], true);
  out.push(L(panel(5), { tone: "lo" }), L(panel(7), { tone: "faint" }));
  const hz = CAB_TOP - 22, hy0 = CAB.y + 20, hy1 = FRONT - 20;
  for (const y of [hy0, hy1 - 1.6]) out.push(S(k.slabOf({ x: X, y, w: 2.4, d: 1.6, r: 0.4 }, hz, 1.8, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: X + 2.4, y: hy0 - 0.6, w: 1.6, d: hy1 - hy0 + 1.2, r: 0.6 }, hz - 0.2, 2.2, P, 3), { tone: "hi", crease: "lo" }));
  out.push(Dots([[CAB.y + 9, CAB_Z0 + 9], [FRONT - 9, CAB_Z0 + 9], [CAB.y + 9, CAB_TOP - 9], [FRONT - 9, CAB_TOP - 9]].map(([y, z]) => at([X + 0.06, y, z])), { size: 0.45 }));
  // screws at the face corners
  out.push(Dots([[CAB.x + 2.5, CAB_Z0 + 2.5], [CAB.x + CAB.w - 2.5, CAB_Z0 + 2.5], [CAB.x + 2.5, CAB_TOP - 2.5], [CAB.x + CAB.w - 2.5, CAB_TOP - 2.5]].map(([x, z]) => at([x, FRONT + 0.06, z])), { size: 0.45 }));
  return out.join("");
}

/**
 * One drawer, built shut. Its box, cards and front live in a group that slides
 * along +y; a clip (the opening swept toward the viewer) hides whatever is
 * still inside the cabinet.
 */
function drawer(o, id, cards, tabbed) {
  const inner = { x: o.x + 1, w: o.w - 2 };
  const y0 = FRONT - DEPTH, floorZ = o.z0 + 1, wallTop = o.z1 - 5;
  const parts = [];
  parts.push(S(k.slabOf({ x: inner.x, y: y0, w: inner.w, d: DEPTH, r: 0.3 }, o.z0 + 0.2, 0.8, P, 2), { tone: "lo", crease: "none" }));
  parts.push(S(k.slabOf({ x: inner.x, y: y0, w: inner.w, d: 1, r: 0.2 }, floorZ, wallTop - floorZ, P, 2), { tone: "mid" }));
  parts.push(S(k.slabOf({ x: inner.x, y: y0, w: 1, d: DEPTH, r: 0.2 }, floorZ, wallTop - floorZ, P, 2), { tone: "mid" }));
  const cardH = o.z1 - 2 - floorZ;
  const span = DEPTH - 6;
  cards.forEach((c, i) => {
    const y = y0 + 3 + (i + 0.5) * (span / cards.length) - 0.35;
    const plan = { x: inner.x + 1.6, y, w: inner.w - 3.2, d: 0.7, r: 0.2 };
    let svg = S(k.slabOf(plan, floorZ, cardH - (tabbed ? 3 : 0), P, 2), { tone: "hi", crease: "lo" });
    if (tabbed) {
      // guide cards carry a tab, staggered across the drawer like a real catalogue
      const tw = (inner.w - 3.2) / cards.length;
      svg += S(k.slabOf({ x: plan.x + i * tw, y, w: tw, d: 0.7, r: 0.2 }, floorZ + cardH - 3, 3, P, 2), { tone: "hi", crease: "lo" });
    }
    parts.push(`<g data-card="${id}:${i}" data-key="${c}">${svg}</g>`);
  });
  parts.push(S(k.slabOf({ x: inner.x + inner.w - 1, y: y0, w: 1, d: DEPTH, r: 0.2 }, floorZ, wallTop - floorZ, P, 2), { tone: "mid" }));
  // the front: panel, label holder with its card, and a pull
  const front = { x: o.x - 0.8, y: FRONT, w: o.w + 1.6, d: 2.2, r: 0.5 };
  parts.push(S(k.slabOf(front, o.z0 - 0.8, o.z1 - o.z0 + 1.6, P, 3, 0.4), { tone: "mid" }));
  const cx = o.x + o.w / 2, hz = o.z1 - 5.5;
  const holder = { x: cx - 4.5, y: FRONT + 2.2, w: 9, d: 0.5, r: 0.2 };
  parts.push(S(k.slabOf(holder, hz - 2.6, 5.2, P, 2), { tone: "mid" }));
  parts.push(L(k.segment([holder.x + 1.6, holder.y + 0.52, hz + 0.9], [holder.x + 7.4, holder.y + 0.52, hz + 0.9], P), { tone: "lo", free: true }));
  parts.push(L(k.segment([holder.x + 1.6, holder.y + 0.52, hz - 0.9], [holder.x + 5.6, holder.y + 0.52, hz - 0.9], P), { tone: "lo", free: true }));
  parts.push(Dots([at([holder.x + 0.7, holder.y + 0.5, hz]), at([holder.x + 8.3, holder.y + 0.5, hz])], { size: 0.35 }));
  const pz = o.z0 + 4.2;
  for (const x of [cx - 4.2, cx + 3]) parts.push(S(k.slabOf({ x, y: FRONT + 2.2, w: 1.2, d: 2.2, r: 0.3 }, pz - 0.6, 1.2, P, 2), { tone: "mid" }));
  parts.push(S(k.slabOf({ x: cx - 4.8, y: FRONT + 4.4, w: 9.6, d: 1.3, r: 0.5 }, pz - 0.8, 1.6, P, 3), { tone: "hi", crease: "lo" }));

  // the clip: the opening (plus the front's overlap) swept toward the viewer
  const m = 1.0;
  const corners = [];
  for (const y of [FRONT, FRONT + 90]) for (const [x, z] of [[o.x - m, o.z0 - m], [o.x + o.w + m, o.z0 - m], [o.x + o.w + m, o.z1 + m + 0.2], [o.x - m, o.z1 + m + 0.2]]) corners.push(at([x, y, z]));
  const clip = hull(corners).map(([x, y], i) => `${i ? "L" : "M"}${fmt(x)} ${fmt(y)}`).join("") + "Z";
  return `<clipPath id="clip-${id}"><path d="${clip}"/></clipPath><g clip-path="url(#clip-${id})"><g data-drawer="${id}">${parts.join("")}</g></g>`;
}

// ── the shelf (the table) ───────────────────────────────────────────────────
function shelf() {
  const out = [];
  const base = { x: boxX(0) - 6, y: BOX.y0 - 5, w: boxX(15) + BOX.w + 6 - (boxX(0) - 6) + 6, d: BOX.y1 - BOX.y0 + 9, r: 1.2 };
  out.push(`<path class="iso-halo" d="${k.haloOf(base, 0, 5, P)}" style="filter:blur(5px)"/>`);
  out.push(S(k.slabOf(base, 0, 5, P, 3, 0.6), { tone: "mid" }));
  const left = { x: base.x, y: base.y, w: 5, d: base.d, r: 0.8 };
  const right = { x: base.x + base.w - 5, y: base.y, w: 5, d: base.d, r: 0.8 };
  out.push(S(k.slabOf(left, 5, 44, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: base.x + 5, y: base.y, w: base.w - 10, d: 3, r: 0.6 }, 40, 4, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: base.x + 5, y: base.y, w: base.w - 10, d: 3, r: 0.6 }, 5, 5, P, 3, 0.4), { tone: "mid" }));
  out.push(Dots([at([left.x + 2.5, left.y + 2.5, 49]), at([left.x + 2.5, left.y + left.d - 2.5, 49])], { size: 0.45 }));
  for (let i = 0; i < BOXES; i++) {
    const plan = { x: boxX(i), y: BOX.y0, w: BOX.w, d: BOX.y1 - BOX.y0, r: 0.8 };
    const lid = k.sideSeam(plan, BOX.z1 - 4, P, 3);
    let svg = S(k.slabOf(plan, BOX.z0, BOX.z1 - BOX.z0, P, 3, 0.5), { tone: "hi", crease: "lo", inner: L(lid, { tone: "faint" }) });
    const holder = { x: plan.x + 2, y: BOX.y1, w: plan.w - 4, d: 0.5, r: 0.2 };
    svg += S(k.slabOf(holder, BOX.z0 + 13, 6, P, 2), { tone: "mid" });
    svg += L(k.segment([holder.x + 1.2, BOX.y1 + 0.52, BOX.z0 + 16.8], [holder.x + holder.w - 1.6, BOX.y1 + 0.52, BOX.z0 + 16.8], P), { tone: "lo", free: true });
    svg += L(k.segment([holder.x + 1.2, BOX.y1 + 0.52, BOX.z0 + 15], [holder.x + holder.w - 2.8, BOX.y1 + 0.52, BOX.z0 + 15], P), { tone: "lo", free: true });
    // a finger hole near the bottom of each box
    svg += L(path3(Array.from({ length: 13 }, (_, s) => { const a = (s / 12) * Math.PI * 2; return [plan.x + plan.w / 2 + Math.cos(a) * 1.8, BOX.y1 + 0.05, BOX.z0 + 7 + Math.sin(a) * 1.1]; })), { tone: "lo" });
    out.push(`<g data-box="${i}">${svg}</g>`);
  }
  out.push(S(k.slabOf(right, 5, 44, P, 3, 0.5), { tone: "mid" }));
  out.push(Dots([at([right.x + 2.5, right.y + 2.5, 49]), at([right.x + 2.5, right.y + right.d - 2.5, 49])], { size: 0.45 }));
  return out.join("");
}

// ── rails and the reader carriage ───────────────────────────────────────────
const RAIL_X0 = boxX(0) - 6, RAIL_X1 = boxX(15) + BOX.w + 6;
function rails() {
  const out = [];
  for (const y of RAIL_Y) {
    out.push(S(k.slabOf({ x: RAIL_X0, y, w: RAIL_X1 - RAIL_X0, d: 3.2, r: 0.8 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
    out.push(Dots([RAIL_X0 + 5, (RAIL_X0 + RAIL_X1) / 2, RAIL_X1 - 5].map((x) => at([x, y + 1.6, 3])), { size: 0.4 }));
  }
  for (const x of [RAIL_X0 - 5, RAIL_X1]) {
    out.push(S(k.slabOf({ x, y: RAIL_Y[0] - 2, w: 5, d: RAIL_Y[1] - RAIL_Y[0] + 7, r: 1 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
    out.push(Dots([at([x + 2.5, RAIL_Y[0] + 1, 7]), at([x + 2.5, RAIL_Y[1] + 2, 7])], { size: 0.45 }));
  }
  return out.join("");
}

function carriage() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CARRIAGE, 3), 3, 0.1, P)}" style="filter:blur(4px)"/>`];
  for (const [x, y] of byDepth([[CARRIAGE.x + 2, RAIL_Y[0] - 0.4], [CARRIAGE.x + CARRIAGE.w - 6, RAIL_Y[0] - 0.4], [CARRIAGE.x + 2, RAIL_Y[1] - 0.4], [CARRIAGE.x + CARRIAGE.w - 6, RAIL_Y[1] - 0.4]])) {
    out.push(S(k.slabOf({ x, y, w: 4, d: 4, r: 0.6 }, 2.2, 2.6, P, 2), { tone: "mid" }));
  }
  out.push(S(k.slabOf(CARRIAGE, 4.8, 4, P, 4, 0.6), { tone: "mid" }));
  out.push(Dots([-6, -2, 2, 6].map((x) => at([x, CARRIAGE.y + CARRIAGE.d - 1.6, 8.8])), { size: 0.4, tone: "lo" }));
  // post with a collar, an arm reaching back to the boxes, and the reader head
  out.push(S(k.cylinder(0, 8, 4.4, 8.8, 2.6, P, 24), { tone: "mid" }));
  out.push(S(k.cylinder(0, 8, 2.6, 11.4, 25, P, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(0, 8, 2.6, 24, P, 12), { tone: "faint" }));
  out.push(S(k.slabOf({ x: -2, y: BOX.y1 + 3.2, w: 4, d: 8 - (BOX.y1 + 3.2) + 2, r: 0.8 }, 36.4, 3, P, 3, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -3.4, y: BOX.y1 + 1.4, w: 6.8, d: 4.6, r: 1 }, 33.4, 7.2, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  out.push(Dots([at([0, BOX.y1 + 3.7, 40.6])], { size: 0.5, tone: "hi" }));
  // a knurled knob on the carriage side
  out.push(S(k.slabOf({ x: CARRIAGE.x + CARRIAGE.w, y: 9, w: 2.2, d: 2, r: 0.4 }, 5.8, 2, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(CARRIAGE.x + CARRIAGE.w + 4.2, 10, 2.6, 4.8, 4.4, P, 20), { tone: "mid" }));
  out.push(L(k.knurl(CARRIAGE.x + CARRIAGE.w + 4.2, 10, 2.6, 4.8, 9.2, 18, P), { tone: "lo" }));
  return out.join("");
}

// ── assemble ───────────────────────────────────────────────────────────────
const leafKeys = (j) => Array.from({ length: PER_LEAF }, (_, i) => j * PER_LEAF + i + 1);
const guideRanges = Array.from({ length: FANOUT }, (_, g) => `${g * PER_LEAF + 1}-${(g + 1) * PER_LEAF}`);

const leafDrawers = byDepth(LEAVES.map((o, j) => [o.x, FRONT, j])).map(([, , j]) => drawer(LEAVES[j], `leaf${j}`, leafKeys(j), false));
const svg = k.figureSvg({
  width: W,
  height: H,
  label: "A card-catalogue cabinet beside a shelf of sixteen archive boxes on a base plate. The cabinet is the index: a root drawer of four guide cards and four leaf drawers of sixteen sorted cards. The boxes are the table, four rows each, stored in arrival order. A reader carriage on two rails fetches one box. A seek opens the root drawer, one leaf drawer and one box; a scan opens every box.",
  body: [
    plate(),
    rails(),
    cabinet(),
    ...leafDrawers,
    drawer(ROOT, "root", guideRanges, true),
    shelf(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [boxCentre(0), 0, 0])}">${carriage()}</g>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const BOX_OF = ${JSON.stringify(BOX_OF)};
const CENTRES = ${JSON.stringify(Array.from({ length: BOXES }, (_, i) => boxCentre(i)))};
const BOXES = ${BOXES}, PER_LEAF = ${PER_LEAF}, ROWS = ${ROWS}, OPEN = ${OPEN}, LIFT = ${LIFT};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const q = (s) => svg.querySelector(s);
const drawers = { root: q('[data-drawer="root"]') };
for (let j = 0; j < 4; j++) drawers["leaf" + j] = q('[data-drawer="leaf' + j + '"]');
const cards = {}; svg.querySelectorAll("[data-card]").forEach((el) => { cards[el.dataset.card] = el; });
const boxes = [...svg.querySelectorAll("[data-box]")];
const carriage = q('[data-part="carriage"]');

// eased values, each following its target
const v = {}; const target = {};
const val = (name, start = 0) => { if (!(name in v)) { v[name] = start; target[name] = start; } return v[name]; };
const set = (name, to) => { val(name); target[name] = to; };
val("carriage", CENTRES[0]);

let mode = "seek", key = 37, clock = 0, touring = !still.matches, idleTimer = 0;
let frame = 0, last = 0, visible = false;
const leafOf = (key) => Math.floor((key - 1) / PER_LEAF);

function plan(t) {
  // targets for every part at time t into the current lookup
  for (const n of Object.keys(target)) if (n !== "carriage") target[n] = 0;
  const leaf = leafOf(key), card = (key - 1) % PER_LEAF, box = BOX_OF[key];
  let lit = null, phase = "", reads = 0;
  if (mode === "seek") {
    if (t > 0.3 && t < 5.8) set("drawer:root", 1);
    if (t > 0.9 && t < 2.6) { set("card:root:" + leaf, 1); lit = "card:root:" + leaf; }
    if (t > 1.7 && t < 5.8) set("drawer:leaf" + leaf, 1);
    if (t > 2.4 && t < 3.8) { set("card:leaf" + leaf + ":" + card, 1); lit = "card:leaf" + leaf + ":" + card; }
    if (t > 3.0) target.carriage = CENTRES[box];
    if (t > 3.8 && t < 6.2) { set("box:" + box, 1); lit = "box:" + box; }
  } else {
    const step = 0.42, start = 0.5;
    const i = Math.floor((t - start) / step);
    if (t > start) {
      const cur = Math.min(BOXES - 1, Math.max(0, i));
      target.carriage = CENTRES[cur];
      if (i >= 0 && i < BOXES && (t - start) % step > 0.12) { set("box:" + cur, 1); lit = "box:" + cur; }
      if (i > box && i < BOXES + 3) set("box:" + box, 0.55);
    }
    if (t > start + BOXES * step + 1.6) target.carriage = CENTRES[0];
  }
  return { lit, phase, reads };
}

function length() { return mode === "seek" ? 7.0 : 0.5 + BOXES * 0.42 + 2.6; }
// the moment a lookup has done all its reading; a lookup you start holds here
function hold() { return mode === "seek" ? 4.6 : 0.5 + BOXES * 0.42 + 0.2; }

function readText() {
  const leaf = leafOf(key), box = BOX_OF[key];
  if (mode === "seek") {
    const r = (val("drawer:root") > 0.6 ? 1 : 0) + (val("drawer:leaf" + leaf) > 0.6 ? 1 : 0) + (val("box:" + box) > 0.6 ? 1 : 0);
    const path = r === 0 ? "" : r === 1 ? " → root" : r === 2 ? " → root → drawer " + (leaf + 1) : " → drawer " + (leaf + 1) + " → box " + (box + 1);
    return "seek · key " + key + path + " · " + r + (r === 1 ? " read" : " reads");
  }
  const read = Math.min(BOXES, Math.max(0, Math.floor((clock - 0.5) / 0.42) + 1));
  if (read <= 0) return "scan · key " + key + " · 0 reads";
  return "scan · key " + key + " · box " + read + "/" + BOXES + " · " + read + (read === 1 ? " read" : " reads");
}

let litName = null;
function draw() {
  const ease = (name) => val(name);
  for (const n of ["root", "leaf0", "leaf1", "leaf2", "leaf3"]) drawers[n].setAttribute("transform", translateAlong(P, [0, OPEN * ease("drawer:" + n), 0]));
  for (const [id, el] of Object.entries(cards)) {
    const lift = ease("card:" + id);
    el.setAttribute("transform", translateAlong(P, [0, 0, 6 * lift]));
  }
  boxes.forEach((el, i) => el.setAttribute("transform", translateAlong(P, [0, 0, LIFT * ease("box:" + i)])));
  carriage.setAttribute("transform", translateAlong(P, [v.carriage, 0, 0]));
  for (const el of svg.querySelectorAll("[data-lit]")) el.removeAttribute("data-lit");
  if (litName) {
    const el = litName.startsWith("box:") ? boxes[+litName.slice(4)] : cards[litName.slice(5)];
    if (el) el.querySelectorAll(".iso-solid").forEach((s) => s.setAttribute("data-lit", ""));
  }
  const text = readText();
  if (readout.textContent !== text) readout.textContent = text;
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  clock += dt;
  if (!touring || calm) clock = Math.min(clock, hold());
  else if (clock > length()) {
    if (mode === "scan") { mode = "seek"; key = 1 + Math.floor(Math.random() * ROWS); } else mode = "scan";
    clock = 0;
  }
  const { lit } = plan(clock);
  litName = lit;
  for (const n of Object.keys(target)) {
    const tau = n === "carriage" ? (mode === "scan" ? 0.12 : 0.35) : 0.22;
    v[n] = calm ? target[n] : v[n] + (target[n] - v[n]) * (1 - Math.exp(-dt / tau));
    if (Math.abs(target[n] - v[n]) < 1e-3) v[n] = target[n];
  }
  draw();
  const settled = (!touring || calm) && clock >= hold() && Object.keys(target).every((n) => v[n] === target[n]);
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
function lookup(nextMode, nextKey) {
  mode = nextMode; key = nextKey; clock = 0;
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => { touring = !still.matches; run(); }, 9000);
  stage.setAttribute("aria-valuenow", String(key));
  stage.setAttribute("aria-valuetext", (mode === "seek" ? "Index seek" : "Full scan") + " for key " + key);
  run();
}
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("click", () => lookup(mode === "seek" ? "scan" : "seek", key));
stage.addEventListener("keydown", (e) => {
  let next = null;
  if (e.key === "ArrowRight" || e.key === "ArrowUp") next = Math.min(ROWS, key + (e.shiftKey ? 8 : 1));
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") next = Math.max(1, key - (e.shiftKey ? 8 : 1));
  if (e.key === "Home") next = 1;
  if (e.key === "End") next = ROWS;
  if (e.key === " " || e.key === "Enter") { e.preventDefault(); lookup(mode === "seek" ? "scan" : "seek", key); return; }
  if (next === null) return;
  e.preventDefault();
  lookup(mode, next);
});
if (still.matches) { touring = false; clock = hold(); }
plan(clock);
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "Index seek vs full scan",
  hint: "Click: seek / scan",
  readout: "seek · key 37 · 0 reads",
  keys: [
    { mark: "lit", label: "The card or box being read right now" },
    { mark: "raised", label: "Index: a root drawer of 4 guide cards, then 4 drawers of 16 cards sorted by key" },
    { mark: "flat", label: "Table: 16 boxes of 4 rows, kept in the order the rows arrived" },
  ],
  caption:
    "A card catalogue is an index: cards sorted by key, each naming the box that holds the row. A seek opens the root drawer, one leaf drawer and goes straight to one box, 3 reads. Without the index the reader has to open every box, because rows sit in arrival order and nothing says a key appears only once: 16 reads. At a million rows, with about 100 rows to a page and about 100 keys to an index page, that is about 4 reads against about 10,000.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Database index figure: click or press Enter to switch between an index seek and a full scan; arrow keys choose the key" aria-valuemin="1" aria-valuemax="${ROWS}" aria-valuenow="37" aria-valuetext="Index seek for key 37" style="cursor:pointer">${svg}</div>`,
});

mkdirSync(OUT, { recursive: true });
const credit = "<!-- Drawn with the Anatomy kit (MIT License, (c) 2026 Ryan), inlined below. Source: tools/db-index-figure/build.mjs -->\n";
const page = k.pageHtml({ title: "How a database index works", theme, body, script: kitScript() + live })
  .replace("<head>", `<head>\n${credit}<meta name="robots" content="noindex">`);
const file = join(OUT, theme === "light" ? "db-index.html" : "db-index-dark.html");
writeFileSync(file, page);
console.log("wrote", file, `${(page.length / 1024).toFixed(0)} KB`);
