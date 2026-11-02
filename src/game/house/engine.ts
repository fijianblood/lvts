// The Noqublox engine: builds the house, the compound and Raiwai from
// layout.ts, runs the first- or third-person controller against collision.ts
// (with floor heights for slopes and stairs), animates doors, gates, windows,
// collectibles and the family, keeps the clock, and draws the minimap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  C, ROOMS, WALLS, DOORS, WINDOWS, PROPS, COLLECTIBLES, GOLDEN_SPOTS, SPAWN, EXIT_ZONE, POSTER, PROMO_SPOTS,
  BARRIERS, TREES, NEIGHBOURS, RAMPS, NPC_SPOTS, CAT_SPOT, BACK_Y, ROAD_Y, GROUND_BREAKS, PARKED, MCFARLANE,
  WALL_H, CEIL_H, DOOR_TOP, HOUSE, roomAt, roomAtLevel, groundY, heightAt, floorAt,
  type GameMode, type WallRun, type Prim, type Door, type HingedDoor, type WindowSpec, type Room, type XYZ, type Barrier, type NpcSpot,
} from './layout.ts';
import { buildStaticWorld, buildCameraWorld, doorOBB, bodyOBB, moveAndSlide, circleHitsOBB, blocked, supportAt, airStep, jumpSpeed, JUMP, JUMP_ROAM, type OBB, type StaticWorld } from './collision.ts';
import { CHARACTERS, characterById, firstName, type Character, type CharacterId, type Look } from './characters.ts';
import { buildFigure, animate, bakeStatic, bakeMoving, cat, type Rig } from './figures.ts';
import type { Say } from './talk.ts';
import { ChoreSystem, type ChoreCallbacks, type ChoreFocus } from './choreSystem.ts';
import { PLACES } from './chores.ts';
import { SHOP_SPOTS, SHOP_LINE, VISITOR_SPOTS, shopBox, visitorCharacter, type ShopSpot, type VisitorCharacter } from './neighbourhood.ts';
import { SHOP_PROMOS, type PromoId } from './promos.ts';
import { Minimap } from './minimap.ts';
import { shopTall } from './shopInsides.ts';
import { Sfx } from './audio.ts';
import * as T from './textures.ts';
import * as R from './raiwai.ts';
import { PLAN, SIGNS, RAIWAI_TREES, POLE_RUNS, FACE_ANGLE, footprint, houseSpec, rng, type PlanItem } from './raiwaiPlan.ts';
import { partModel, goldenChip, ranger, palm, bushTree, banana, breadfruit, van, paint, type Finish, type Detail } from './models.ts';

export type GameState = 'intro' | 'playing' | 'paused' | 'won';

export interface RunResult {
  timeMs: number;
  items: number;
  total: number;
  golden: boolean;
  rooms: number;
  totalRooms: number;
  /** Stars earned from chores this game. */
  stars: number;
}

export interface PerkPill { text: string; tone: string; title: string }
export interface TalkStart { player: Character; npc: Character; room: string | null; turn: number }
const SENSE = ['🧊 Cold', '🌤️ Warm', '🔥 Hot', '🔥 Very hot!'];

export interface EngineHud {
  timer: HTMLElement;
  prompt: HTMLElement;
  minimap: HTMLCanvasElement;
}

export interface EngineCallbacks extends ChoreCallbacks {
  onPickup: (info: { name: string; count: number; total: number; golden: boolean }) => void;
  onWin: (result: RunResult) => void;
  onPause: (reason: 'lock-lost' | 'poster' | 'manual') => void;
  onRooms?: (visited: number, total: number) => void;
  onMap?: (expanded: boolean) => void;
  /** Someone in the family (or the cat) said something. */
  /** A conversation starts (you, them, the Golden Chip's room or null, a number to vary the lines) or ends (null). */
  onTalk?: (talk: TalkStart | null) => void;
  /** Something said in passing (the cat). */
  onSay?: (lines: Say[]) => void;
  onView?: (third: boolean) => void;
  /** You walked up to a shop on the street and pressed E. */
  onShop?: (spot: ShopSpot) => void;
  /** Found the hidden reward card in Digicel or Vodafone (promos.ts). */
  onPromo?: (id: PromoId) => void;
  /** A perk's live readout for the HUD (warmer/colder, the Golden Chip's room), or null. */
  onPerk?: (pill: PerkPill | null) => void;
}

export interface EngineOptions { touch: boolean; baseUrl: string }

const REACH = 1.8;
/** How close you have to be to a hidden reward card to pick it up. */
const PROMO_REACH = 1.5;
const PICKUP = 0.85;
const LOOK = 0.0022;
const AREAS = ROOMS.filter((r) => r.area);
/** Signs drawn in code (Garden City, Damodar City), by the name their props give in `tex`. */
const NAMED_TEX: Record<string, () => THREE.Texture> = {
  gcsign: T.gardenCitySign, gcboard: T.gardenCityBoard, gcbanner: T.comingSoonBanner, gcbuild: T.constructionSign,
  ...Object.fromEntries(SHOP_PROMOS.map((p) => [`promo-${p.id}`, () => T.promoBoard(p)])),
  gcsoon: () => T.shopComingSoon('Garden City'), gcup: () => T.floorSign('FIRST FLOOR', 'Up the stairs', 1), gcdown: () => T.floorSign('WAY OUT', 'Down the stairs', -1), dcsoon: () => T.shopComingSoon('Damodar City'), dcname: T.damodarCitySign,
};
const DEFAULT_SIGHT = 5.5;
/** Feet this far above the floor count as up on something (walking down stairs your feet trail the steps by a few cm). */
const LIFTED = 0.15;

// ── geometry helpers ────────────────────────────────────────────────────────
type Buckets = Map<string, THREE.BufferGeometry[]>;

function boxGeo(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  const g = new THREE.BoxGeometry(Math.max(1e-3, x1 - x0), Math.max(1e-3, y1 - y0), Math.max(1e-3, z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** Furniture: a box with softly rounded edges that catch the light (thin parts stay sharp). */
function furnBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const min = Math.min(w, h, d);
  if (min < 0.04) return boxGeo(x0, y0, z0, x1, y1, z1);
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(0.022, min * 0.18));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** What each colour in the house is made of: its sheen, and wood grain, fabric weave or plaster. */
const WOOD = { finish: 'satin', detail: 'wood' } as const;
const FABRIC = { finish: 'cloth', detail: 'fabric' } as const;
const PLASTER = { finish: 'matte', detail: 'plaster' } as const;
const SURFACES: Record<string, { finish: Finish; detail?: Detail }> = {
  [C.doorWood]: WOOD, [C.frameWood]: WOOD, [C.darkWood]: WOOD, [C.counter]: WOOD, [C.oak]: WOOD,
  [C.sofa]: FABRIC, [C.sofa2]: FABRIC, [C.greyChair]: FABRIC, [C.sheetBeige]: FABRIC, [C.sheetWhite]: FABRIC, [C.quilt]: FABRIC,
  [C.wall]: PLASTER, [C.wallOut]: PLASTER, [C.plaster]: PLASTER,
  [C.steel]: { finish: 'metal' }, [C.fridge]: { finish: 'gloss' }, [C.black]: { finish: 'satin' },
  [C.stepTile]: { finish: 'matte' }, [C.tile]: { finish: 'matte' },
};
const hsl = { h: 0, s: 0, l: 0 };
function surfaceFor(color: string): { finish: Finish; detail?: Detail } {
  const known = SURFACES[color.toLowerCase()];
  if (known) return known;
  // other browns are wooden furniture
  new THREE.Color(color).getHSL(hsl, THREE.SRGBColorSpace);
  if (hsl.h > 0.03 && hsl.h < 0.12 && hsl.s > 0.25 && hsl.l > 0.12 && hsl.l < 0.6) return WOOD;
  return { finish: 'matte' };
}

function push(b: Buckets, key: string, g: THREE.BufferGeometry) {
  // merging needs every piece alike: unindexed (rounded boxes come that way), with position, normal and uv (roof shapes come without some)
  if (g.index) g = g.toNonIndexed();
  if (!g.getAttribute('normal')) g.computeVertexNormals();
  if (!g.getAttribute('uv')) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count * 2), 2));
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv') g.deleteAttribute(k);
  const list = b.get(key);
  if (list) list.push(g); else b.set(key, [g]);
}

/** A horizontal rectangle whose UVs follow world x/z, so neighbouring floors tile seamlessly. */
function worldPlane(x0: number, z0: number, x1: number, z1: number, y: number, tile: number, down = false) {
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0);
  g.rotateX(down ? Math.PI / 2 : -Math.PI / 2);
  g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tile, -pos.getZ(i) / tile);
  uv.needsUpdate = true;
  return g;
}

/**
 * A horizontal strip whose height follows the ground (groundY), split at the
 * slope's break lines so it lies exactly on the terrain.
 */
function groundStrip(x0: number, z0: number, x1: number, z1: number, lift: number, tile: number): THREE.BufferGeometry[] {
  const cuts = [z0, ...GROUND_BREAKS.filter((z) => z > z0 && z < z1), z1];
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < cuts.length - 1; i++) {
    const g = worldPlane(x0, cuts[i], x1, cuts[i + 1], 0, tile);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) pos.setY(k, groundY(pos.getZ(k)) + lift);
    pos.needsUpdate = true;
    g.computeVertexNormals();
    out.push(g);
  }
  return out;
}

/** The ground for the whole scene: a grid whose rows land on every slope break. */
function terrain(): THREE.BufferGeometry {
  // fine where you walk (Raiwai), coarser out toward the hills; it stops at the shore
  const xs: number[] = [-900, -600, -400, -300, -220, -160], zs = new Set<number>([...GROUND_BREAKS, -900, -600, -400, -300, -220, -160, 180, 220, SHORE]);
  for (let x = -120; x <= 240; x += 5) xs.push(x);
  xs.push(300, 400, 600, 900);
  for (let z = -120; z <= 150; z += 2.5) zs.add(z);
  const zl = [...zs].sort((a, b) => a - b);
  const pos: number[] = [], uv: number[] = [], index: number[] = [];
  for (const z of zl) for (const x of xs) { pos.push(x, groundY(z) - 0.02, z); uv.push(x / 4, -z / 4); }
  const w = xs.length;
  for (let j = 0; j < zl.length - 1; j++) for (let i = 0; i < w - 1; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    index.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/** Where the land meets the sea, south of the town. */
const SHORE = 270;

/** A round bar from a to b. */
function tubeGeo(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 6) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r, r, Math.max(1e-3, len), seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()));
  const m = a.clone().add(b).multiplyScalar(0.5);
  g.translate(m.x, m.y, m.z);
  return g;
}

/** A gate leaf in its own frame: hinge at the origin, running along +x. */
function gateGeo(width: number, height: number, style: 'grille' | 'bars'): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const f = 0.035;
  parts.push(boxGeo(0.02, 0.05, -f / 2, width - 0.02, 0.05 + f, f / 2), boxGeo(0.02, height - f, -f / 2, width - 0.02, height, f / 2));
  parts.push(boxGeo(0.02, 0.05, -f / 2, 0.02 + f, height, f / 2), boxGeo(width - 0.02 - f, 0.05, -f / 2, width - 0.02, height, f / 2));
  const bars = Math.max(2, Math.round(width / 0.12));
  for (let i = 1; i < bars; i++) {
    const x = 0.02 + ((width - 0.04) * i) / bars;
    parts.push(boxGeo(x - 0.008, 0.05, -0.008, x + 0.008, height, 0.008));
  }
  if (style === 'grille') {
    // scroll rings in a band across the upper half, like the ironwork in the photos
    parts.push(boxGeo(0.02, height * 0.62, -0.01, width - 0.02, height * 0.62 + 0.02, 0.01));
    const n = Math.max(1, Math.round(width / 0.32));
    for (let i = 0; i < n; i++) {
      const ring = new THREE.TorusGeometry(Math.min(0.1, width / n / 2.6), 0.008, 4, 14);
      ring.translate(0.02 + ((width - 0.04) * (i + 0.5)) / n, height * 0.78, 0);
      parts.push(ring);
    }
  }
  return mergeGeometries(parts.map((g) => (g.index ? g.toNonIndexed() : g)));
}

/** Solid wall pieces of a run, in 3D: full-height spans, lintels over doors, and the wall below and above windows. */
function wallBoxes(w: WallRun): [number, number, number, number, number, number][] {
  const out: [number, number, number, number, number, number][] = [];
  const h = w.t / 2;
  const piece = (a: number, b: number, y0: number, y1: number) => {
    if (b - a < 1e-3 || y1 - y0 < 1e-3) return;
    out.push(w.at === 'x' ? [w.line - h, y0, a, w.line + h, y1, b] : [a, y0, w.line - h, b, y1, w.line + h]);
  };
  let cursor = w.from;
  for (const o of [...w.openings].sort((a, b) => a.from - b.from)) {
    piece(cursor, o.from, 0, WALL_H);
    if (o.kind === 'window') { piece(o.from, o.to, 0, o.sill ?? 0.9); piece(o.from, o.to, o.top ?? DOOR_TOP, WALL_H); }
    else piece(o.from, o.to, o.top ?? DOOR_TOP, WALL_H);
    cursor = Math.max(cursor, o.to);
  }
  piece(cursor, w.to, 0, WALL_H);
  return out;
}

/** A box in world space given as along/height/across a wall run. */
function onWall(w: WallRun, a0: number, a1: number, y0: number, y1: number, n0: number, n1: number) {
  return w.at === 'x' ? boxGeo(w.line + n0, y0, a0, w.line + n1, y1, a1) : boxGeo(a0, y0, w.line + n0, a1, y1, w.line + n1);
}

/**
 * Fold a static group into the colour buckets (one draw call per colour instead
 * of one per part). Only plain painted meshes are baked (keeping their finish);
 * anything textured or see-through stays as is.
 */
function bake(group: THREE.Object3D, buckets: Buckets, scene: THREE.Object3D) {
  group.updateMatrixWorld(true);
  const keep: THREE.Object3D[] = [];
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (!(mat instanceof THREE.MeshStandardMaterial) || mat.transparent || mat.map) { keep.push(m); return; }
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const finish = (mat.userData.finish as Finish | undefined) ?? 'matte';
    const key = `#${mat.color.getHexString(THREE.SRGBColorSpace)}${mat.emissive.getHex() ? `|e${mat.emissive.getHexString(THREE.SRGBColorSpace)}` : ''}${finish !== 'matte' ? `|f${finish}` : ''}`;
    push(buckets, key, g);
  });
  for (const k of keep) { k.updateMatrixWorld(true); const c = k.clone(); c.matrix.copy(k.matrixWorld); c.matrixAutoUpdate = false; scene.add(c); }
}

/** Another player in the shared world: their figure, name tag, speech bubble, and where they're heading. */
interface Remote {
  rig: Rig;
  tag: THREE.Sprite;
  bubble?: THREE.Sprite;
  target: [number, number, number, number];
  phase: number;
  speed: number;
  height: number;
  bubbleUntil: number;
}

/** A flat picture that always faces the camera, `w` metres wide, drawn on a canvas. */
function canvasSprite(cw: number, ch: number, w: number, draw: (g: CanvasRenderingContext2D) => void): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const g = canvas.getContext('2d');
  if (g) draw(g);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(w, (w * ch) / cw, 1);
  sprite.renderOrder = 5;
  return sprite;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A player's name over their head (and, smaller, who they're playing as). */
function labelSprite(name: string, sub?: string): THREE.Sprite {
  const W = 512, H = sub ? 132 : 92;
  const BIG = '700 46px system-ui, sans-serif', SMALL = '500 30px system-ui, sans-serif';
  return canvasSprite(W, H, sub ? 1.15 : 1.0, (g) => {
    /** `t` cut short (with …) to fit `max` pixels in `font`; and its width. */
    const fit = (t: string, font: string, max: number): [string, number] => {
      g.font = font;
      let s = t;
      while (s.length > 1 && g.measureText(s === t ? s : `${s}…`).width > max) s = s.slice(0, -1);
      const out = s === t ? t : `${s.trimEnd()}…`;
      return [out, g.measureText(out).width];
    };
    const [top, tw] = fit(name, BIG, W - 60);
    const [low, lw] = sub ? fit(sub, SMALL, W - 60) : ['', 0];
    const bw = Math.min(W - 8, Math.max(tw, lw) + 44);
    g.fillStyle = 'rgba(15,23,42,0.72)';
    roundRect(g, (W - bw) / 2, 4, bw, H - 8, 26);
    g.fill();
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#ffffff'; g.font = BIG;
    g.fillText(top, W / 2, sub ? 48 : H / 2 + 2);
    if (sub) { g.fillStyle = '#cbd5e1'; g.font = SMALL; g.fillText(low, W / 2, 98); }
  });
}

/** What a player just said, in a white bubble over their head (wrapped to a few lines). */
function bubbleSprite(text: string): THREE.Sprite {
  const W = 640, PAD = 28, LH = 44, MAXW = W - PAD * 2;
  const measure = document.createElement('canvas').getContext('2d');
  const font = '500 36px system-ui, sans-serif';
  const lines: string[] = [];
  if (measure) {
    measure.font = font;
    let cur = '';
    for (const word of text.split(' ')) {
      const next = cur ? `${cur} ${word}` : word;
      if (measure.measureText(next).width <= MAXW) { cur = next; continue; }
      if (cur) lines.push(cur);
      cur = word;
      while (measure.measureText(cur).width > MAXW && cur.length > 1) {   // one very long word: break it
        let cut = cur.length;
        while (cut > 1 && measure.measureText(cur.slice(0, cut)).width > MAXW) cut--;
        lines.push(cur.slice(0, cut));
        cur = cur.slice(cut);
      }
    }
    if (cur) lines.push(cur);
  } else lines.push(text);
  const shown = lines.slice(0, 4);
  if (lines.length > 4) shown[3] = `${shown[3].replace(/.$/, '')}…`;
  const H = shown.length * LH + PAD * 2 + 18;
  return canvasSprite(W, H, 1.9, (g) => {
    g.font = font;
    const tw = Math.max(...shown.map((l) => g.measureText(l).width));
    const bw = Math.min(W - 6, tw + PAD * 2), bx = (W - bw) / 2, bh = H - 22;
    g.fillStyle = 'rgba(255,255,255,0.95)';
    roundRect(g, bx, 3, bw, bh, 22);
    g.fill();
    g.beginPath(); g.moveTo(W / 2 - 14, bh + 2); g.lineTo(W / 2, H - 3); g.lineTo(W / 2 + 14, bh + 2); g.closePath(); g.fill();
    g.fillStyle = '#0f172a'; g.textAlign = 'center'; g.textBaseline = 'middle';
    shown.forEach((l, i) => g.fillText(l, W / 2, 3 + PAD + LH * i + LH / 2 - 4));
  });
}

interface DoorRig { door: Door; pivot: THREE.Object3D; open: number; target: number }
interface WindowRig { spec: WindowSpec; sashes: { pivot: THREE.Object3D; dir: number }[]; open: number; target: number }
interface Item {
  id: string; name: string; pos: XYZ; group: THREE.Group; ring: THREE.Mesh; spin?: THREE.Object3D;
  golden: boolean; taken: boolean; seen: boolean; phase: number; base: number;
}
interface Burst { mesh: THREE.InstancedMesh; vel: THREE.Vector3[]; t: number }
type FocusKind = 'door' | 'window' | 'poster' | 'npc' | 'cat' | 'shop' | 'promo' | ChoreFocus;

export class HouseEngine {
  state: GameState = 'intro';
  private opts: EngineOptions;
  private hud: EngineHud;
  private cb: EngineCallbacks;
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  /** The hunt (timer, parts, Golden Chip, win at the gate) or exploring the neighbourhood (out onto the street). */
  private mode: GameMode = 'hunt';
  private worlds = {
    hunt: { walk: buildStaticWorld(), crawl: buildStaticWorld({ crawl: true }), cam: buildCameraWorld() },
    explore: { walk: buildStaticWorld({ mode: 'explore' }), crawl: buildStaticWorld({ crawl: true, mode: 'explore' }), cam: buildCameraWorld('explore') },
  };
  private get worldCam(): StaticWorld { return this.worlds[this.mode].cam; }
  private char: Character = characterById('josese');
  /** Your feet: the floor (eased on stairs), whatever you're standing on, or in the air when jumping. */
  private floorY = 0;
  /** Jumping or falling, and how fast you're going up (m/s). */
  private air = false;
  private vy = 0;
  private third = false;
  private player?: Rig;
  private npcs: { id: CharacterId; char: Character; rig: Rig; spot: NpcSpot; obb?: OBB; baseQuat: THREE.Quaternion; visitor?: boolean }[] = [];
  private kitty?: THREE.Group;
  /** Other players in the shared world (explore mode): eased towards where they last said they were. */
  private remotes = new Map<string, Remote>();
  private remoteSort = 0;
  /** A chat box or panel has the keyboard and mouse: keys don't move you, and freeing the mouse doesn't pause. */
  private uiOpen = false;
  private doors: DoorRig[] = [];
  private windows: WindowRig[] = [];
  private items: Item[] = [];
  private bursts: Burst[] = [];
  private minimap: Minimap;
  readonly sfx = new Sfx();
  private fanHead?: THREE.Object3D;
  private clock?: { tex: THREE.CanvasTexture; redraw: () => void };
  private textures: THREE.Texture[] = [];
  /** Raiwai near the house (also seen from the compound in the hunt), and the rest (only when exploring). */
  private raiwaiNear = new THREE.Group();
  private raiwaiFar = new THREE.Group();

  // player
  private pos: [number, number] = [SPAWN.pos[0], SPAWN.pos[2]];
  private vel: [number, number] = [0, 0];
  private yaw = SPAWN.yaw;
  private pitch = -0.05;
  private bob = 0;
  private keys = new Set<string>();
  private touchMove: [number, number] = [0, 0];
  private running = false;

  // run
  private elapsed = 0;
  private started = false;
  private collected = 0;
  private golden = false;
  private visited = new Set<string>();
  private goldenIndex = 0;
  private perkKey: string | undefined = undefined;
  /** Index into `npcs` of who you're talking to. */
  private talkingTo: number | null = null;
  private chores!: ChoreSystem;
  /** Climbed the treehouse this game (the map's been revealed). */
  private lookedOut = false;
  /** Been up the Raiwai Lookout this time (exploring). */
  private lookedOutTower = false;
  private talkTurn = Math.floor(Math.random() * 12);

  private raf = 0;
  private last = 0;
  private revealClock = 0;
  private mapFrame = 0;
  private promptText = '';
  private focus: { kind: FocusKind; index: number } | null = null;
  private visible = true;
  private disposed = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private time = 0;
  private perf = { step: 0, hud: 0, render: 0, calls: 0, tris: 0 };
  /** Soft shading where surfaces meet (computers only; switched off if the frame rate drops). */
  private composer?: EffectComposer;
  private ao?: GTAOPass;
  private frameAvg = 1 / 60;
  private slowFor = 0;
  /** Testing only: never switch the soft shading off. */
  private aoPinned = false;
  private sun!: THREE.DirectionalLight;
  /** Where the sun's shadows are centred: the compound, or (exploring) wherever in Raiwai you've walked to. */
  private sunAt: [number, number] = [10, 11];

  constructor(container: HTMLElement, hud: EngineHud, cb: EngineCallbacks, opts: EngineOptions) {
    this.container = container;
    this.hud = hud;
    this.cb = cb;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: !opts.touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.touch ? 1.25 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    // film-like response to light, keeping the family's clothes their true colours
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(opts.touch ? 76 : 72, 1, 0.05, 160);
    this.camera.rotation.order = 'YXZ';

    // a bright sky: deep blue overhead, paler at the horizon (where the fog blends in)
    const horizon = new THREE.Color('#a9dcff');
    this.scene.background = this.tex(T.skyGradient());
    this.scene.fog = new THREE.Fog(horizon, 34, 110);
    // soft light bouncing round a room: gives every surface gentle shading and reflections
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const room = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(room, 0.04).texture;
    this.scene.environmentIntensity = 0.45;
    room.dispose();
    pmrem.dispose();
    this.scene.add(new THREE.HemisphereLight('#f4f8ff', '#b9ab98', 0.6));
    // an afternoon sun from the west, strong as real sunshine is next to the sky's light
    const sun = new THREE.DirectionalLight('#fff0d4', 6.5);
    this.sun = sun;
    this.aimSun(10, 11);
    this.scene.add(sun, sun.target);
    // sun shadows: the roof and walls keep the sun out, so it only reaches indoors
    // through the windows and doors. Drawn once, and again only when something moves
    // (a door, who's standing where), so they cost almost nothing per frame.
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 34, bottom: -34, near: 1, far: 100 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = opts.touch ? 1.5 : 3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;

    this.buildHouse();
    this.buildCompound();
    this.buildRaiwai();
    this.buildItems();
    this.chores = new ChoreSystem(this.scene, {
      onChores: (s) => this.cb.onChores?.(s),
      onWork: (w) => this.cb.onWork?.(w),
      onChoreDone: (d) => { this.sfx.pickup(); this.cb.onChoreDone?.(d); },
      onUnlock: (p) => { this.sfx.golden(); this.cb.onUnlock?.(p); this.cb.onRooms?.(this.visited.size, this.areaTotal); },
      onHint: (t) => this.cb.onHint?.(t),
    });
    this.minimap = new Minimap(hud.minimap);   // before the family: picking a character sets up the map
    this.buildFamily();
    this.reset();
    this.setupShadows();
    if (!opts.touch) this.setupAO();

    this.bindInput();
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.io = new IntersectionObserver((entries) => {
      this.visible = entries[entries.length - 1].isIntersecting;
      if (this.visible) this.kick();
    }, { rootMargin: '80px' });
    this.io.observe(container);
    this.resize();
    this.kick();
  }

  // ── building the house ──────────────────────────────────────────────────
  private tex(t: THREE.Texture) { this.textures.push(t); return t; }

  private buildHouse() {
    const solid: Buckets = new Map();

    // floors and ceilings
    const floorTex: Record<string, { tex: THREE.Texture; tile: number }> = {
      tile: { tex: this.tex(T.floorTile()), tile: 0.5 },
      bath: { tex: this.tex(T.bathTile()), tile: 0.3 },
      veranda: { tex: this.tex(T.verandaTile()), tile: 0.33 },
      concrete: { tex: this.tex(T.concrete()), tile: 2 },
      deck: { tex: this.tex(T.deck()), tile: 1 },
      road: { tex: this.tex(T.asphalt()), tile: 3 },
    };
    const floors = new Map<string, THREE.BufferGeometry[]>();
    const ceilings: THREE.BufferGeometry[] = [];
    for (const room of ROOMS) {
      if (room.floor === 'grass' || room.floor === 'stairs') continue;
      const kind = floorTex[room.floor];
      const list = floors.get(room.floor) ?? [];
      if (room.ground) list.push(...groundStrip(room.x0, room.z0, room.x1, room.z1, room.floor === 'road' ? 0.004 : 0.012, kind.tile));
      else list.push(worldPlane(room.x0, room.z0, room.x1, room.z1, (room.y ?? 0) + 0.002, kind.tile));
      floors.set(room.floor, list);
      if (room.ceiling) ceilings.push(worldPlane(room.x0, room.z0, room.x1, room.z1, CEIL_H, 1.2, true));
    }
    for (const [kind, list] of floors) {
      const mesh = new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ map: floorTex[kind].tex }));
      this.scene.add(mesh);
    }
    const ceilMat = new THREE.MeshStandardMaterial({ map: this.tex(T.ceiling()), color: '#ffffff' });
    this.scene.add(new THREE.Mesh(mergeGeometries(ceilings), ceilMat));

    // walls, door frames and window frames
    for (const wall of WALLS) {
      for (const [x0, y0, z0, x1, y1, z1] of wallBoxes(wall)) push(solid, C.wall, boxGeo(x0, y0, z0, x1, y1, z1));
      const n = wall.t / 2 + 0.018;
      for (const o of wall.openings) {
        if (o.kind === 'window') {
          const top = o.top ?? DOOR_TOP, sill = o.sill ?? 0.9;
          push(solid, C.trim, onWall(wall, o.from - 0.05, o.from, sill, top, -n, n));
          push(solid, C.trim, onWall(wall, o.to, o.to + 0.05, sill, top, -n, n));
          push(solid, C.trim, onWall(wall, o.from - 0.05, o.to + 0.05, top, top + 0.05, -n, n));
          const inside = -(wall.outward ?? 1);
          push(solid, C.trim, onWall(wall, o.from - 0.08, o.to + 0.08, sill - 0.04, sill, Math.min(inside * (n + 0.07), -n * inside), Math.max(inside * (n + 0.07), -n * inside)));
        } else if (o.id !== 'slider') {
          const top = o.top ?? DOOR_TOP;
          push(solid, C.frameWood, onWall(wall, o.from - 0.05, o.from, 0, top, -n, n));
          push(solid, C.frameWood, onWall(wall, o.to, o.to + 0.05, 0, top, -n, n));
          push(solid, C.frameWood, onWall(wall, o.from - 0.05, o.to + 0.05, top, top + 0.06, -n, n));
        }
      }
    }

    // bathroom tile skins and mosaic band
    const tileSkins: THREE.BufferGeometry[] = [];
    const mosaicBand: THREE.BufferGeometry[] = [];
    for (const room of ROOMS.filter((r) => r.tiled)) this.skinRoom(room, tileSkins, mosaicBand);
    if (tileSkins.length) this.scene.add(new THREE.Mesh(mergeGeometries(tileSkins), new THREE.MeshStandardMaterial({ map: this.tex(T.bathTile()) })));
    if (mosaicBand.length) this.scene.add(new THREE.Mesh(mergeGeometries(mosaicBand), new THREE.MeshStandardMaterial({ map: this.tex(T.mosaic()) })));

    // furniture
    const glow: THREE.BufferGeometry[] = [];
    for (const prim of PROPS) this.addPrim(prim, solid, glow);
    // the signs drawn in code (coming-soon boards, the LvTS plaques…): one mesh per texture
    for (const [name, list] of this.namedPlanes) this.scene.add(new THREE.Mesh(mergeGeometries(list), new THREE.MeshStandardMaterial({ map: this.named.get(name) })));
    this.namedPlanes.clear();
    if (glow.length) this.scene.add(new THREE.Mesh(mergeGeometries(glow), new THREE.MeshBasicMaterial({ color: '#fffdf5' })));

    // the bedroom-3 fan head, animated
    const fan = new THREE.Group();
    fan.position.set(7.9, 1.15, -2.45);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), paint(C.black));
    hub.rotation.x = Math.PI / 2;
    fan.add(hub);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 4, 20), paint('#6b7076'));
    cage.position.z = 0.08;
    fan.add(cage);
    const blades = new THREE.Group();
    blades.position.z = 0.08;
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.01), paint('#9aa0a6'));
      b.position.set(Math.cos((i / 3) * Math.PI * 2) * 0.1, Math.sin((i / 3) * Math.PI * 2) * 0.1, 0);
      b.rotation.z = (i / 3) * Math.PI * 2;
      blades.add(b);
    }
    fan.add(blades);
    fan.userData.blades = blades;
    this.scene.add(fan);
    this.fanHead = fan;

    this.buildWindows(solid);
    this.buildDoors(solid);
    this.buildPoster(solid);

    this.flush(solid);

    // roof over the house and the veranda
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 2.1, 4, 1), paint(C.roof));
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(6.2 / Math.SQRT1_2, 1, 10.9 / Math.SQRT1_2);
    roof.position.set(5.5, WALL_H + 1.05, 2.7);
    this.scene.add(roof);
    const eave = new THREE.Mesh(boxGeo(-0.15, WALL_H, 13, 12.5, WALL_H + 0.12, 15.6), paint(C.roof));
    this.scene.add(eave);
  }

  /** Merge each colour bucket into one mesh. */
  private flush(buckets: Buckets, parent: THREE.Object3D = this.scene) {
    for (const [key, list] of buckets) {
      if (key === 'transparent' || !list.length) continue;
      const [color, ...rest] = key.split('|');
      const em = rest.find((r) => r.startsWith('e'))?.slice(1);
      const finish = rest.find((r) => r.startsWith('f'))?.slice(1) as Finish | undefined;
      const surface = finish ? { finish } : em ? { finish: 'matte' as Finish } : surfaceFor(color);
      parent.add(new THREE.Mesh(mergeGeometries(list), paint(color, { emissive: em ? `#${em}` : undefined, ...surface })));
    }
  }

  private skinRoom(room: Room, tiles: THREE.BufferGeometry[], band: THREE.BufferGeometry[]) {
    const inset = 0.006;
    for (const wall of WALLS) {
      const h = wall.t / 2;
      const a0 = Math.max(wall.from, wall.at === 'x' ? room.z0 : room.x0);
      const a1 = Math.min(wall.to, wall.at === 'x' ? room.z1 : room.x1);
      if (a1 - a0 < 0.05) continue;
      for (const side of [-1, 1]) {
        const face = wall.line + side * (h + inset);
        const probe = wall.line + side * (h + 0.05);
        const inRoom = wall.at === 'x' ? probe > room.x0 && probe < room.x1 : probe > room.z0 && probe < room.z1;
        if (!inRoom) continue;
        const openings = wall.openings.filter((o) => o.to > a0 && o.from < a1).sort((a, b) => a.from - b.from);
        const strip = (s0: number, s1: number, y0: number, y1: number, into: THREE.BufferGeometry[], tile: number) => {
          if (s1 - s0 < 0.01 || y1 - y0 < 0.01) return;
          const g = new THREE.PlaneGeometry(s1 - s0, y1 - y0);
          const uv = g.attributes.uv as THREE.BufferAttribute;
          for (let i = 0; i < uv.count; i++) uv.setXY(i, (s0 + uv.getX(i) * (s1 - s0)) / tile, (y0 + uv.getY(i) * (y1 - y0)) / (into === band ? (y1 - y0) : tile));
          if (wall.at === 'x') { g.rotateY(side > 0 ? Math.PI / 2 : -Math.PI / 2); g.translate(face, (y0 + y1) / 2, (s0 + s1) / 2); }
          else { if (side < 0) g.rotateY(Math.PI); g.translate((s0 + s1) / 2, (y0 + y1) / 2, face); }
          into.push(g);
        };
        const run = (s0: number, s1: number) => {
          strip(s0, s1, 0, 1.05, tiles, 0.3);
          strip(s0, s1, 1.05, 1.15, band, 0.5);
          strip(s0, s1, 1.15, 2.1, tiles, 0.3);
        };
        let c = a0;
        for (const o of openings) {
          run(c, Math.max(c, o.from));
          if (o.kind === 'window') {
            const sill = o.sill ?? 0.9, top = o.top ?? DOOR_TOP;
            const s0 = Math.max(a0, o.from), s1 = Math.min(a1, o.to);
            if (sill > 0) { strip(s0, s1, 0, Math.min(sill, 1.05), tiles, 0.3); if (sill > 1.15) { strip(s0, s1, 1.05, 1.15, band, 0.5); strip(s0, s1, 1.15, sill, tiles, 0.3); } }
            if (top < 2.1) strip(s0, s1, top, 2.1, tiles, 0.3);
          }
          c = Math.max(c, o.to);
        }
        run(c, a1);
      }
    }
  }

  private addPrim(prim: Prim, solid: Buckets, glow: THREE.BufferGeometry[]) {
    if (prim.kind === 'box') {
      if (prim.color === 'transparent') return;
      const [x0, y0, z0] = prim.min, [x1, y1, z1] = prim.max;
      if (prim.tex) { this.addTexturedBox(prim, solid); return; }
      if (prim.emissive) { glow.push(boxGeo(x0, y0, z0, x1, y1, z1)); return; }
      push(solid, prim.color, prim.plain ? boxGeo(x0, y0, z0, x1, y1, z1) : furnBox(x0, y0, z0, x1, y1, z1));
      return;
    }
    if (prim.kind === 'cyl') {
      const g = new THREE.CylinderGeometry(prim.top ?? prim.r, prim.r, prim.h, prim.seg ?? 12);
      const [x, y, z] = prim.base;
      if (prim.axis === 'x') { g.rotateZ(Math.PI / 2); g.translate(x, y, z); }
      else if (prim.axis === 'z') { g.rotateX(Math.PI / 2); g.translate(x, y, z); }
      else g.translate(x, y + prim.h / 2, z);
      push(solid, prim.color, g);
      return;
    }
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(prim.r, prim.h, prim.seg ?? 8, 1, prim.opacity !== undefined),
      prim.opacity !== undefined
        ? new THREE.MeshStandardMaterial({ color: prim.color, transparent: true, opacity: prim.opacity, side: THREE.DoubleSide, depthWrite: false })
        : paint(prim.color),
    );
    cone.position.set(prim.base[0], prim.base[1] + prim.h / 2, prim.base[2]);
    this.scene.add(cone);
  }

  /** The small LvTS plaque on the buildings: the logo (as on the TV) and the number, white, with a thin border. */
  private lvtsPlaque(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 240;
    const g = canvas.getContext('2d')!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    const draw = (logo?: HTMLImageElement) => {
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, 512, 240);
      g.strokeStyle = '#c9d3e6'; g.lineWidth = 6; g.strokeRect(3, 3, 506, 234);
      if (logo) {
        const s = Math.min(470 / logo.width, 140 / logo.height), lw = logo.width * s, lh = logo.height * s;
        g.drawImage(logo, (512 - lw) / 2, 18 + (140 - lh) / 2, lw, lh);
      }
      g.fillStyle = '#1b2a5c'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = '800 46px "Space Grotesk", Arial, sans-serif';
      g.fillText('Call 8331088', 256, 196);
      tex.needsUpdate = true;
    };
    draw();
    const img = new Image();
    img.onload = () => { draw(img); this.kick(); };
    img.src = `${this.opts.baseUrl}logo.jpg`;
    return tex;
  }

  /** One texture per name, however many boxes show it (Garden City's signs). */
  private named = new Map<string, THREE.Texture>();
  private namedTex(name: string, make: () => THREE.Texture) {
    let t = this.named.get(name);
    if (!t) { t = this.tex(make()); this.named.set(name, t); }
    return t;
  }

  /**
   * A business's logo on a sign board filling one face of a box (`tex: 'logo/file.png:-z'`, or
   * 'logo/file.png@#070707:-z' for a board that isn't white). The box's colour is the board's frame.
   */
  private addLogoBox(prim: Extract<Prim, { kind: 'box' }>, spec: string, face: string) {
    const [file, bg = '#ffffff'] = spec.split('@');
    const [x0, y0, z0] = prim.min, [x1, y1, z1] = prim.max;
    const w = face.endsWith('x') ? z1 - z0 : x1 - x0, h = y1 - y0;
    const board = this.logoBoard(file, bg, prim.color, Math.max(0.1, w - 0.16), Math.max(0.1, h - 0.16));
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    if (face === '-z') board.position.set(cx, cy, z0 + 0.03);
    if (face === '+z') { board.rotation.y = Math.PI; board.position.set(cx, cy, z1 - 0.03); }
    if (face === '+x') { board.rotation.y = -Math.PI / 2; board.position.set(x1 - 0.03, cy, cz); }
    if (face === '-x') { board.rotation.y = Math.PI / 2; board.position.set(x0 + 0.03, cy, cz); }
    this.scene.add(board);
  }

  /** Planes showing a shared sign texture, by texture name, merged into one mesh each once the props are built. */
  private namedPlanes = new Map<string, THREE.BufferGeometry[]>();

  private addTexturedBox(prim: Extract<Prim, { kind: 'box' }>, solid?: Buckets) {
    const [x0, y0, z0] = prim.min, [x1, y1, z1] = prim.max;
    const [name, face] = (prim.tex ?? '').split(':');
    if (name.startsWith('logo/')) { this.addLogoBox(prim, name.slice(5), face); return; }
    if (solid && !prim.emissive && (name in NAMED_TEX || name === 'lvts')) {
      // a shared sign: its box joins the colour buckets, its face waits to be merged with the others like it
      this.namedTex(name, name === 'lvts' ? () => this.lvtsPlaque() : NAMED_TEX[name]);
      push(solid, prim.color, boxGeo(x0, y0, z0, x1, y1, z1));
      const w = face.endsWith('x') ? z1 - z0 : x1 - x0, h = y1 - y0, e = 0.004;
      const g = new THREE.PlaneGeometry(w, h);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
      if (face === '+x') g.rotateY(Math.PI / 2).translate(x1 + e, cy, cz);
      else if (face === '-x') g.rotateY(-Math.PI / 2).translate(x0 - e, cy, cz);
      else if (face === '+z') g.translate(cx, cy, z1 + e);
      else g.rotateY(Math.PI).translate(cx, cy, z0 - e);
      const list = this.namedPlanes.get(name) ?? [];
      list.push(g);
      this.namedPlanes.set(name, list);
      return;
    }
    let tex: THREE.Texture;
    if (name === 'tv') {
      tex = this.tex(new THREE.TextureLoader().load(`${this.opts.baseUrl}logo.jpg`));
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (name === 'rug') tex = this.tex(T.rug());
    else if (name === 'welcome') tex = this.tex(T.welcomeSign());
    else if (name === 'exit') tex = this.tex(T.exitSign());
    else if (name === 'clock') { this.clock = T.clockFace(); tex = this.tex(this.clock.tex); }
    else if (name in NAMED_TEX) tex = this.namedTex(name, NAMED_TEX[name]);
    else if (name === 'lvts') tex = this.namedTex(name, () => this.lvtsPlaque());
    else tex = this.tex(T.ceiling());
    const box = new THREE.Mesh(boxGeo(x0, y0, z0, x1, y1, z1), prim.emissive ? new THREE.MeshBasicMaterial({ color: prim.color }) : paint(prim.color));
    this.scene.add(box);
    const w = face.endsWith('x') ? z1 - z0 : x1 - x0;
    const h = face.endsWith('y') ? z1 - z0 : y1 - y0;
    const inset = name === 'tv' ? 0.92 : 1;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w * inset, h * (name === 'tv' ? 0.9 : 1)),
      name === 'tv' || prim.emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshStandardMaterial({ map: tex }),
    );
    const e = 0.004;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2;
    if (face === '+x') { plane.rotation.y = Math.PI / 2; plane.position.set(x1 + e, cy, cz); }
    if (face === '-x') { plane.rotation.y = -Math.PI / 2; plane.position.set(x0 - e, cy, cz); }
    if (face === '+z') { plane.position.set(cx, cy, z1 + e); }
    if (face === '-z') { plane.rotation.y = Math.PI; plane.position.set(cx, cy, z0 - e); }
    if (face === '+y') { plane.rotation.x = -Math.PI / 2; plane.position.set(cx, y1 + e, cz); }
    this.scene.add(plane);
  }

  private buildWindows(solid: Buckets) {
    const glassMat = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.16, roughness: 0.08, envMapIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide });
    const sashMat = paint(C.trim);
    const curtainTex: Partial<Record<NonNullable<WindowSpec['curtain']>, THREE.Texture>> = {};
    for (const spec of WINDOWS) {
      const wall = WALLS.find((w) => w.at === spec.at && w.line === spec.line && w.exterior)!;
      const out = spec.outward;
      const width = spec.to - spec.from, height = spec.top - spec.sill;
      const outerFace = out * (wall.t / 2 - 0.03);
      const sashCount = width > 0.8 ? 2 : 1;
      const sw = width / sashCount;
      const rig: WindowRig = { spec, sashes: [], open: 0, target: 0 };
      for (let s = 0; s < sashCount; s++) {
        const hingeAlong = s === 0 ? spec.from : spec.to;
        const dirAlong = s === 0 ? 1 : -1;
        const pivot = new THREE.Group();
        if (spec.at === 'x') pivot.position.set(spec.line + outerFace, spec.sill, hingeAlong);
        else pivot.position.set(hingeAlong, spec.sill, spec.line + outerFace);
        const sash = new THREE.Group();
        const bar = 0.04;
        const frameParts: THREE.BufferGeometry[] = [];
        const along = (a0: number, a1: number, y0: number, y1: number, depth = 0.035) => {
          const g = new THREE.BoxGeometry(Math.abs(a1 - a0), y1 - y0, depth);
          g.translate((a0 + a1) / 2, (y0 + y1) / 2, 0);
          return g;
        };
        const a0 = 0, a1 = dirAlong * sw;
        frameParts.push(
          along(a0, a1, 0, bar),
          along(a0, a1, height - bar, height),
          along(a0, a0 + dirAlong * bar, 0, height),
          along(a1 - dirAlong * bar, a1, 0, height),
          along(a0, a1, height * 0.55, height * 0.55 + 0.025),
        );
        sash.add(new THREE.Mesh(mergeGeometries(frameParts), sashMat));
        sash.add(new THREE.Mesh(along(a0, a1, 0, height, 0.006), glassMat));
        // the sash lives in the wall plane: its local x runs along the wall
        if (spec.at === 'x') sash.rotation.y = -Math.PI / 2;
        pivot.add(sash);
        this.scene.add(pivot);
        rig.sashes.push({ pivot, dir: dirAlong });
      }
      this.windows.push(rig);

      // scroll grille on the inside, as in the photos (static, merged)
      const inside = -out;
      const gz = inside * (wall.t / 2 - 0.035);
      const add = (geo: THREE.BufferGeometry) => push(solid, C.grille, geo);
      const bars = 3;
      for (let i = 1; i <= bars; i++) {
        const a = spec.from + (width * i) / (bars + 1);
        add(onWall(wall, a - 0.008, a + 0.008, spec.sill + 0.03, spec.top - 0.03, gz - 0.008, gz + 0.008));
      }
      for (const y of [spec.sill + height * 0.2, spec.sill + height * 0.8]) add(onWall(wall, spec.from + 0.03, spec.to - 0.03, y - 0.008, y + 0.008, gz - 0.008, gz + 0.008));
      for (let i = 0; i <= bars; i++) {
        const a = spec.from + (width * (i + 0.5)) / (bars + 1);
        if (a > spec.to - 0.08) continue;
        for (const y of [spec.sill + height * 0.5]) {
          const ring = new THREE.TorusGeometry(Math.min(0.08, width / (bars + 1) / 2.4), 0.008, 4, 14);
          if (spec.at === 'x') ring.rotateY(Math.PI / 2);
          if (spec.at === 'x') ring.translate(spec.line + gz, y, a); else ring.translate(a, y, spec.line + gz);
          add(ring);
        }
      }

      // curtains and rod on the room side
      if (spec.curtain) {
        const tex = curtainTex[spec.curtain] ?? (curtainTex[spec.curtain] = this.tex(T.curtain(spec.curtain)));
        const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: spec.curtain === 'sheer', opacity: spec.curtain === 'sheer' ? 0.75 : 1, side: THREE.DoubleSide });
        const face = inside * (wall.t / 2 + 0.07);
        const rodY = spec.top + 0.1;
        const rod = new THREE.CylinderGeometry(0.014, 0.014, width + 0.5, 6);
        rod.rotateZ(Math.PI / 2);
        if (spec.at === 'x') rod.rotateY(Math.PI / 2);
        if (spec.at === 'x') rod.translate(spec.line + face, rodY, (spec.from + spec.to) / 2); else rod.translate((spec.from + spec.to) / 2, rodY, spec.line + face);
        push(solid, '#6e3a20', rod);
        const panelW = spec.curtain === 'towel' ? width * 0.5 : Math.min(0.42, width * 0.35);
        const bottom = Math.max(0.05, spec.sill - 0.15);
        const panels = spec.curtain === 'towel' ? [[spec.from + 0.05, spec.from + 0.05 + panelW]] : [[spec.from - 0.2, spec.from - 0.2 + panelW], [spec.to + 0.2 - panelW, spec.to + 0.2]];
        const cloth = panels.map(([p0, p1]) => {
          const geo = new THREE.PlaneGeometry(p1 - p0, rodY - bottom);
          if (spec.at === 'x') { geo.rotateY(Math.PI / 2); geo.translate(spec.line + face, (rodY + bottom) / 2, (p0 + p1) / 2); }
          else geo.translate((p0 + p1) / 2, (rodY + bottom) / 2, spec.line + face);
          return geo;
        });
        this.scene.add(new THREE.Mesh(mergeGeometries(cloth), mat));
      }
    }
  }

  private buildDoors(solid: Buckets) {
    const handle = paint('#c9cdd1');
    for (const door of DOORS) {
      if (door.kind === 'slide') {
        const alu = '#c9ccce';
        const z = door.line;
        push(solid, alu, boxGeo(door.from, 0, z - 0.09, door.to, 0.04, z + 0.09));
        push(solid, alu, boxGeo(door.from, 2.06, z - 0.09, door.to, 2.1, z + 0.09));
        push(solid, alu, boxGeo(door.from, 0, z - 0.09, door.from + 0.04, 2.1, z + 0.09));
        push(solid, alu, boxGeo(door.to - 0.04, 0, z - 0.09, door.to, 2.1, z + 0.09));
        const mid = (door.from + door.to) / 2;
        const glass = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.15, roughness: 0.08, envMapIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide });
        // fixed half
        push(solid, alu, boxGeo(mid - 0.04, 0, z + 0.01, mid, 2.06, z + 0.05));
        const fixed = new THREE.Mesh(boxGeo(door.from, 0.04, z + 0.025, mid, 2.06, z + 0.035), glass);
        this.scene.add(fixed);
        // sliding half
        const pivot = new THREE.Group();
        const hw = (door.to - door.from) / 4;
        const panel = new THREE.Group();
        const frame = paint(alu);
        for (const [x0, y0, x1, y1] of [[-hw, 0.04, hw, 0.08], [-hw, 2.02, hw, 2.06], [-hw, 0.04, -hw + 0.05, 2.06], [hw - 0.05, 0.04, hw, 2.06]]) {
          const m = new THREE.Mesh(boxGeo(x0, y0, -0.02, x1, y1, 0.02), frame);
          panel.add(m);
        }
        panel.add(new THREE.Mesh(boxGeo(-hw, 0.08, -0.005, hw, 2.02, 0.005), glass));
        const knob = new THREE.Mesh(boxGeo(-hw + 0.07, 0.95, -0.04, -hw + 0.1, 1.15, 0.04), handle);
        panel.add(knob);
        pivot.add(panel);
        pivot.position.set(0, 0, z - 0.05);
        this.scene.add(pivot);
        this.doors.push({ door, pivot, open: 0, target: 0 });
        continue;
      }
      const pivot = new THREE.Group();
      pivot.position.set(door.hinge[0], door.base ?? 0, door.hinge[1]);
      const top = door.height ?? DOOR_TOP;
      if (door.style === 'grille' || door.style === 'bars') {
        pivot.add(new THREE.Mesh(gateGeo(door.width, top, door.style), paint(door.color)));
      } else if (door.style === 'glass') {
        // a shop door: a dark frame round a pane of glass, a push bar on each face
        const fw = 0.06, frame = [
          boxGeo(0.01, 0.01, -0.025, door.width - 0.01, 0.12, 0.025), boxGeo(0.01, top - 0.08, -0.025, door.width - 0.01, top - 0.01, 0.025),
          boxGeo(0.01, 0.01, -0.025, 0.01 + fw, top - 0.01, 0.025), boxGeo(door.width - 0.01 - fw, 0.01, -0.025, door.width - 0.01, top - 0.01, 0.025),
          ...[-1, 1].map((side) => boxGeo(0.12, 1.0, side * 0.045 - 0.012, door.width - 0.12, 1.04, side * 0.045 + 0.012)),
        ];
        pivot.add(new THREE.Mesh(mergeGeometries(frame), paint(door.color)));
        const pane = new THREE.MeshStandardMaterial({ color: C.glass, transparent: true, opacity: 0.22, roughness: 0.08, envMapIntensity: 0.35, depthWrite: false, side: THREE.DoubleSide });
        pivot.add(new THREE.Mesh(boxGeo(0.01 + fw, 0.12, -0.006, door.width - 0.01 - fw, top - 0.08, 0.006), pane));
      } else {
        pivot.add(new THREE.Mesh(boxGeo(0.02, 0.01, -0.02, door.width - 0.02, top - 0.02, 0.02), paint(door.color, surfaceFor(door.color))));
        const knobs = [-1, 1].map((side) => new THREE.SphereGeometry(0.03, 8, 6).translate(door.width - 0.09, 1.0, side * 0.045));
        pivot.add(new THREE.Mesh(mergeGeometries(knobs), handle));
        // a recessed panel on each face, for a bit of detail
        const insets = [-1, 1].map((side) => boxGeo(0.12, 0.25, side * 0.021 - 0.002, door.width - 0.12, top - 0.3, side * 0.021 + 0.002));
        const panelColor = door.color === C.doorWood ? '#a65726' : door.color === '#e9e6de' ? '#d9d5cb' : '#7a3f1f';
        pivot.add(new THREE.Mesh(mergeGeometries(insets), paint(panelColor)));
      }
      this.scene.add(pivot);
      // gates that can swing either way get their own copy, so the swing can flip at run time
      this.doors.push({ door: door.bothWays ? { ...door } : door, pivot, open: 0, target: 0 });
    }
    this.applyDoors();
  }

  private buildPoster(solid: Buckets) {
    const { x, y, z, w, h } = POSTER;
    push(solid, '#2b2f33', boxGeo(x - 0.02, y - h / 2 - 0.04, z - w / 2 - 0.04, x + 0.02, y + h / 2 + 0.04, z + w / 2 + 0.04));
    const tex = this.tex(new THREE.TextureLoader().load(`${this.opts.baseUrl}house-hunt/db-index-poster.jpg`));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, color: '#ffffff' }));
    plane.rotation.y = Math.PI / 2;
    plane.position.set(x + 0.025, y, z);
    this.scene.add(plane);
  }

  private buildCompound() {
    this.scene.add(new THREE.Mesh(terrain(), new THREE.MeshStandardMaterial({ map: this.tex(T.grass()) })));
    const out: Buckets = new Map();
    const deep = (z0: number, z1: number) => Math.min(groundY(z0), groundY(z1)) - 0.35;

    // what holds the raised floors up: the house's plinth with a pebble-dash band, the veranda's lower wall, the balcony and landings
    push(out, C.plaster, boxGeo(-0.12, deep(-7.72, 13.12), -7.72, 11.12, -0.001, 13.12));
    push(out, C.pebble, boxGeo(-0.14, -0.55, -7.74, 11.14, -0.06, 13.14));
    push(out, C.plaster, boxGeo(0.05, deep(13.1, 15.4), 13.1, 12.25, -0.001, 15.4));
    push(out, C.plaster, boxGeo(-0.1, -0.16, 13.0, 12.3, -0.001, 15.45));
    for (const [x0, x1] of [[1.0, 3.6], [5.0, 7.6], [8.8, 11.4]]) push(out, '#2b2f33', boxGeo(x0, groundY(15.4) + 0.35, 15.4, x1, -0.55, 15.43));
    push(out, C.plaster, boxGeo(-1.5, deep(2.3, 6.3), 2.32, -0.02, -0.001, 6.28));
    push(out, C.plaster, boxGeo(-2.63, deep(2.35, 3.25), 2.37, -1.54, -0.001, 3.25));
    push(out, C.concrete, boxGeo(-2.65, -0.02, 2.35, -1.52, 0.002, 3.25));
    push(out, C.plaster, boxGeo(0.67, BACK_Y - 0.3, -8.6, 2.23, -0.001, -7.62));

    // stairs: one box per step, from below the ground up to the step's mid height
    for (const r of RAMPS) {
      if (r.style === 'drawn') continue;            // its builder draws these steps (the masjid's)
      const n = Math.max(2, Math.round(Math.abs(r.y1 - r.y0) / 0.17));
      for (let k = 0; k < n; k++) {
        const za = r.z0 + ((r.z1 - r.z0) * k) / n, zb = r.z0 + ((r.z1 - r.z0) * (k + 1)) / n;
        const z0 = Math.min(za, zb), z1 = Math.max(za, zb);
        const top = r.y0 + ((r.y1 - r.y0) * (k + 0.5)) / n;
        push(out, r.style === 'tile' ? C.stepTile : r.style === 'wood' ? '#8b5e34' : C.concrete, boxGeo(r.x0, Math.min(deep(z0, z1), top - (r.style === 'wood' ? 0.12 : 0.4)), z0, r.x1, top, z1));
        if (r.style === 'tile') {
          const nose = r.y1 > r.y0 ? z0 : z1;
          push(out, '#3b2a22', boxGeo(r.x0, top - 0.025, nose - 0.025, r.x1, top + 0.004, nose + 0.025));
        }
      }
    }

    // walls, railings and fences
    const chain: THREE.BufferGeometry[] = [];
    for (const b of BARRIERS) this.addBarrier(b, out, chain);
    if (chain.length) {
      const mat = new THREE.MeshStandardMaterial({ map: this.tex(T.chainLink()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      this.scene.add(new THREE.Mesh(mergeGeometries(chain), mat));
    }

    // carport: timber beams under a corrugated roof; the Ranger
    for (const z of [-6.2, -3.6, -1.0, 1.6]) push(out, '#5b4532', boxGeo(11.1, BACK_Y + 2.38, z - 0.06, 15.6, BACK_Y + 2.52, z + 0.06));
    const roofTex = this.tex(T.corrugated());
    roofTex.repeat.set(30, 1);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 10.2), new THREE.MeshStandardMaterial({ map: roofTex, side: THREE.DoubleSide }));
    roof.rotation.set(-Math.PI / 2, -0.05, 0);
    roof.position.set(13.35, BACK_Y + 2.62, -2.5);
    this.scene.add(roof);
    const ute = ranger();
    ute.position.set(13.3, BACK_Y, -2.6);
    bake(ute, out, this.scene);

    // trees
    for (const t of TREES) {
      const tree = t.kind === 'palm' ? palm(t.s, 0.3) : t.kind === 'banana' ? banana(t.s) : t.kind === 'breadfruit' ? breadfruit(t.s) : bushTree(t.s);
      tree.position.set(t.x, groundY(t.z), t.z);
      tree.rotation.y = t.x * 1.7 + t.z;
      bake(tree, out, this.scene);
    }

    // the neighbours: Raiwai houses on the same plots (made up, not copies of anyone's home)
    NEIGHBOURS.forEach((n, i) => {
      const w = n.x1 - n.x0, d = n.z1 - n.z0;
      const spec = { ...houseSpec(300 + i), w, d, wall: n.wall, roof: n.roof, storeys: (n.h > 5 ? 2 : 1) as 1 | 2 };
      const item: PlanItem = { kind: 'house', x: (n.x0 + n.x1) / 2, z: (n.z0 + n.z1) / 2, face: n.z0 > 0 ? 's' : 'n', w, d, spec };
      bake(this.placeRaiwai(item), out, this.scene);
    });
    // the shops across the road, and the centre line all along McFarlane Road
    this.buildShops(out);
    for (let x = -68; x < MCFARLANE.x1 - 1; x += 3) push(out, '#f1f1ec', boxGeo(x, ROAD_Y + 0.006, 25.7, x + 1.5, ROAD_Y + 0.012, 25.8));
    const v = van();
    v.position.set(5.5, ROAD_Y, 27.4);
    bake(v, out, this.scene);

    this.flush(out);
  }

  /** One thing from the Raiwai plan, built, turned to face its way and set on the ground (houses get a base on the slope). */
  private placeRaiwai(it: PlanItem): THREE.Group {
    const fp = footprint(it);
    const corners = [heightAt(fp.x0, fp.z0), heightAt(fp.x1, fp.z0), heightAt(fp.x0, fp.z1), heightAt(fp.x1, fp.z1), heightAt(it.x, it.z)];
    const lo = Math.min(...corners), hi = Math.max(...corners);
    let g: THREE.Group;
    switch (it.kind) {
      case 'house': g = R.house({ ...it.spec!, base: (it.spec!.base ?? 0.3) + (hi - lo) }); break;
      case 'flats': g = R.flats({ floors: it.floors ?? 3, w: it.w, d: it.d }); break;
      case 'campus': g = R.flats({ floors: it.floors ?? 3, w: it.w, d: it.d, wall: '#f4f3ef', trim: '#1aa0a8', roof: '#c9cdd0' }); break;
      case 'tower': g = R.tower(it.floors ?? 6); break;
      case 'church': g = R.aFrameChurch(); break;
      case 'pool': g = R.publicPool(); break;
      case 'teal': g = R.tealBuilding(); break;
      case 'field': g = R.sportsField(it.w, it.d); break;
      case 'masjid': g = R.jameMasjid(); break;
      case 'temple': g = R.hinduTemple(hi - lo, it.d); break;
      case 'shed': g = R.shed(it.w, it.d, it.roof); break;
      case 'arena': g = R.arena(); break;
      default: g = R.floodlight();
    }
    // blocks on the slope stand on a concrete base down to the lowest ground under them
    if ((it.kind === 'flats' || it.kind === 'campus' || it.kind === 'tower') && hi - lo > 0.05) {
      const h = hi - lo + 0.3;
      const base = new THREE.Mesh(new THREE.BoxGeometry(it.w + 0.2, h, it.d + 0.2), paint('#bdb9b0'));
      base.position.y = -h / 2;
      g.add(base);
    }
    // houses and the temple stand at the low (road) side and build up the slope themselves
    g.position.set(it.x, it.kind === 'house' || it.kind === 'temple' ? lo : hi, it.z);
    g.rotation.y = FACE_ANGLE[it.face];
    return g;
  }

  /**
   * Raiwai around the house: McFarlane Road's houses, the side road, the
   * Methodist Church, the pool, the teal building, the Lomaiviti Training
   * Ground, flats, sheds, trees, power poles, parked cars and the Nasese bus;
   * further out the hills and the sea. See raiwaiPlan.ts for where things go.
   */
  private buildRaiwai() {
    const near: Buckets = new Map(), far: Buckets = new Map();
    for (const it of PLAN) bake(this.placeRaiwai(it), it.far ? far : near, it.far ? this.raiwaiFar : this.raiwaiNear);

    for (const t of RAIWAI_TREES) {
      const tree = t.kind === 'mango' ? R.mangoTree(t.s, Math.round(t.x * 13 + t.z)) : t.kind === 'palm' ? palm(t.s, 0.25) : t.kind === 'breadfruit' ? breadfruit(t.s) : R.bougainvillea(t.s, Math.round(t.x + t.z * 7));
      tree.position.set(t.x, heightAt(t.x, t.z), t.z);
      tree.rotation.y = t.x * 1.3 + t.z;
      bake(tree, t.far ? far : near, t.far ? this.raiwaiFar : this.raiwaiNear);
    }

    // power poles, wired along each run
    const runs: THREE.Vector3[][][] = [];
    for (const run of POLE_RUNS) {
      const tops: THREE.Vector3[][] = [];
      for (const [x, z] of run) {
        const p = R.powerPole();
        const y = heightAt(x, z);
        p.group.position.set(x, y, z);
        // the light over the road: McFarlane Road is south (+z) of its poles, the side road west (-x) of its
        p.group.rotation.y = run[0][0] === run[run.length - 1][0] ? Math.PI / 2 : Math.PI;
        p.group.updateMatrixWorld(true);
        tops.push(p.tops.map((v) => v.clone().applyMatrix4(p.group.matrixWorld)));
        bake(p.group, near, this.raiwaiNear);
      }
      runs.push([0, 1, 2].map((k) => tops.map((t) => t[k])));
    }
    for (const r of runs) this.raiwaiNear.add(R.wires(r));

    // parked cars and the Nasese bus
    for (const c of PARKED) {
      const v = c.kind === 'bus' ? R.greenBus() : R.car(c.kind, c.color);
      v.position.set(c.x, ROAD_Y, c.z);
      // built along +x; nosed into a bay along z in Garden City's car park
      v.rotation.y = c.across ? (c.facing > 0 ? -Math.PI / 2 : Math.PI / 2) : c.facing > 0 ? 0 : Math.PI;
      bake(v, near, this.raiwaiNear);
    }

    // signs by the road: the Methodist Church, the Lomaiviti Training Ground
    for (const sg of SIGNS) {
      if (sg.logo) {
        // a big entrance sign on a plinth, the logo on it (USP)
        const y = heightAt(sg.x, sg.z);
        const g = new THREE.Group();
        const plinth = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.9, 0.9), paint('#d9d5cb'));
        plinth.position.y = 0.45;
        g.add(plinth);
        for (const sx of [-2.3, 2.3]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.2, 0.25), paint('#d9d5cb')); post.position.set(sx, 1.9, 0); g.add(post); }
        const board = this.logoBoard(sg.logo, sg.bg ?? '#ffffff', sg.color, 4.8, 2.4);
        board.position.set(0, 2.6, 0);
        g.add(board);
        g.position.set(sg.x, y, sg.z);
        g.rotation.y = FACE_ANGLE[sg.face];
        this.raiwaiNear.add(g);
        continue;
      }
      const g = new THREE.Group();
      const y = heightAt(sg.x, sg.z);
      for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.6, 0.1), paint('#3b3f44')); post.position.set(s * 1.35, 0.8, 0); g.add(post); }
      const board = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.62, 0.08), paint(sg.color));
      board.position.y = 1.75;
      g.add(board);
      const face = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 0.52), new THREE.MeshBasicMaterial({ map: this.tex(T.shopSign(sg.title, sg.sub, sg.color)) }));
      face.position.set(0, 1.75, -0.045);
      face.rotation.y = Math.PI;
      g.add(face);
      g.position.set(sg.x, y, sg.z);
      g.rotation.y = FACE_ANGLE[sg.face];
      bake(g, near, this.raiwaiNear);
    }

    this.buildScenery(far);
    this.flush(near, this.raiwaiNear);
    this.flush(far, this.raiwaiFar);
    this.raiwaiFar.visible = this.mode === 'explore';
    this.scene.add(this.raiwaiNear, this.raiwaiFar);
  }

  /** Far away: the hills to the north and west with houses on their slopes, the sea and the reef to the south. */
  private buildScenery(far: Buckets) {
    const r = rng(9);
    const hills: [number, number, number, number][] = [
      [40, -520, 330, 85], [-380, -420, 280, 70], [-560, -60, 260, 55], [420, -480, 300, 80], [640, -120, 240, 50],
    ];
    hills.forEach(([cx, cz, rad, h], i) => {
      const geo = new THREE.SphereGeometry(1, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      geo.scale(rad, h, rad);
      geo.translate(cx, BACK_Y - 1, cz);
      push(far, i % 2 ? '#4c8a3c' : '#55943f', geo);
      // houses dotted up the side facing the town
      const toTown = Math.atan2(0 - cz, 60 - cx);
      for (let k = 0; k < 46; k++) {
        const a = toTown + (r() - 0.5) * 2.2, d = rad * (0.3 + r() * 0.6);
        const x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        const y = BACK_Y - 1 + h * Math.sqrt(Math.max(0, 1 - (d / rad) ** 2));
        const w = 6 + r() * 6, dd = 5 + r() * 4;
        push(far, ['#f4f2ec', '#cfe3f3', '#efe7d3', '#e9e9e4', '#5fc6c9'][k % 5], boxGeo(x - w / 2, y - 1, z - dd / 2, x + w / 2, y + 3, z + dd / 2));
        push(far, ['#c3c8cb', '#9c3d30', '#3f73bf', '#b4babd'][k % 4], boxGeo(x - w / 2 - 0.4, y + 3, z - dd / 2 - 0.4, x + w / 2 + 0.4, y + 3.4, z + dd / 2 + 0.4));
      }
    });
    // the sea, with the reef's line of surf
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(3200, 1400), paint('#2e6da4'));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(60, ROAD_Y - 0.3, SHORE - 6 + 700);
    this.raiwaiFar.add(sea);
    push(far, '#d9eef2', boxGeo(-1500, ROAD_Y - 0.28, 352, 1600, ROAD_Y - 0.26, 358));
    // the beach: a strip of sand along the shore (exploring, you can walk down to it: the edge of the map is on the sand)
    push(far, '#e9d9aa', boxGeo(-900, ROAD_Y - 0.01, SHORE - 9, 900, ROAD_Y + 0.004, SHORE));
  }

  /**
   * The shops across the road (shops.ts): a building per shop, the logo on a
   * sign board above the front, a striped awning, and the front itself: glass
   * for the supermarkets, a tall blank front for the cinema, two storeys for
   * Sardaar Complex, a window and a door for the rest (or a photo of the real
   * shopfront if there is one).
   */
  private buildShops(out: Buckets) {
    for (const sp of SHOP_SPOTS) {
      if (sp.kind === 'mall') continue;          // Garden City is built from its props (gardenCity.ts)
      const b = shopBox(sp);
      const mid = (b.x0 + b.x1) / 2, w = b.x1 - b.x0;
      // the walls, windows, doors and insides are shopInsides.ts's props; here the parapet, awning and sign
      const tall = shopTall(sp.kind);
      push(out, '#e5e7eb', boxGeo(b.x0 - 0.05, b.y + tall, b.z0, b.x1 + 0.05, b.y + tall + 0.25, b.z1 + 0.05));     // parapet
      if (sp.kind === 'complex') { this.buildComplex(sp, out); continue; }
      // awning in stripes
      for (let i = 0; i < 8; i++) {
        const x0 = b.x0 + (w * i) / 8, x1 = b.x0 + (w * (i + 1)) / 8;
        push(out, i % 2 ? '#ffffff' : sp.sign, boxGeo(x0, b.y + 2.55, b.z0 - 1.1, x1, b.y + 2.62, b.z0 + 0.06));
      }
      // the sign board: the logo if there is one, otherwise the name in letters
      const signY = b.y + Math.min(tall - 0.85, 3.6);
      const bw = Math.min(w - 0.6, 8), bh = 1.4;
      if (sp.logo) {
        const board = this.logoBoard(sp.logo, sp.logoBg ?? '#ffffff', sp.sign, bw, bh);
        board.position.set(mid, signY, b.z0 - 0.04);
        this.scene.add(board);
      } else {
        const sign = this.tex(T.shopSign(sp.name, sp.kind === 'empty' ? 'COMING SOON' : sp.sub ?? (sp.offers.length ? 'Offers inside!' : ''), sp.sign));
        const board = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w - 0.6, 6.4), 1.1), new THREE.MeshBasicMaterial({ map: sign }));
        board.rotation.y = Math.PI;
        board.position.set(mid, signY, b.z0 - 0.002);
        this.scene.add(board);
      }
    }
  }

  /** A sign board with a business's logo on it, fitted without stretching. Faces -z from its origin (the board's middle). */
  private logoBoard(file: string, bg: string, edge: string, bw: number, bh: number): THREE.Group {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(bw + 0.16, bh + 0.16, 0.08), paint(edge));
    frame.position.z = 0.02;
    g.add(frame);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ color: bg }));
    panel.rotation.y = Math.PI;
    panel.position.z = -0.025;
    g.add(panel);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true }));
    logo.rotation.y = Math.PI;
    logo.position.z = -0.03;
    logo.visible = false;
    g.add(logo);
    new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}neighbourhood/logos/${file}`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      this.tex(tex);
      const img = tex.image as { width: number; height: number };
      const aspect = img.width / Math.max(1, img.height);
      const lw = Math.min(bw * 0.94, bh * 0.88 * aspect), lh = lw / aspect;
      logo.scale.set(lw, lh, 1);
      (logo.material as THREE.MeshBasicMaterial).map = tex;
      (logo.material as THREE.MeshBasicMaterial).needsUpdate = true;
      logo.visible = true;
      this.kick();
    });
    return g;
  }

  /** Sardaar Complex's upper storey: red sign bands, barred windows between pillars, its name on a white panel. */
  private buildComplex(sp: ShopSpot, out: Buckets) {
    const b = shopBox(sp);
    const w = b.x1 - b.x0, z = b.z0;
    const red = sp.sign;
    // the ground floor's four shops (glass fronts, doors, insides) are shopInsides.ts's props
    push(out, red, boxGeo(b.x0 - 0.1, b.y + 2.9, z - 0.25, b.x1 + 0.1, b.y + 3.8, z + 0.06));      // the first sign band
    // upstairs: three barred windows between pillars
    for (let i = 0; i < 3; i++) {
      const cx = b.x0 + (w * (i + 0.5)) / 3;
      push(out, '#2f3a42', boxGeo(cx - 1.2, b.y + 4.4, z - 0.02, cx + 1.2, b.y + 5.8, z + 0.04));
      for (let k = -2; k <= 2; k++) push(out, '#d9d6cf', boxGeo(cx + k * 0.45 - 0.02, b.y + 4.4, z - 0.05, cx + k * 0.45 + 0.02, b.y + 5.8, z - 0.02));
    }
    for (let i = 0; i <= 3; i++) push(out, '#e9e3cf', boxGeo(b.x0 + (w * i) / 3 - 0.2, b.y + 3.8, z - 0.15, b.x0 + (w * i) / 3 + 0.2, b.y + 6.4, z + 0.05));
    push(out, red, boxGeo(b.x0 + 3.4, b.y + 6.4, z - 0.25, b.x1 + 0.1, b.y + 7.5, z + 0.06));        // the top band
    // the name: a white panel at the top left
    const name = this.tex(T.canvasTexture(256, 84, (g, cw, ch) => {
      g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, cw, ch);
      g.fillStyle = '#3a3d42'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '700 30px "Space Grotesk", Arial, sans-serif';
      g.fillText('SARDAAR', cw / 2, ch * 0.3); g.fillText('COMPLEX', cw / 2, ch * 0.72);
    }));
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.1), new THREE.MeshBasicMaterial({ map: name }));
    panel.rotation.y = Math.PI;
    panel.position.set(b.x0 + 1.7, b.y + 6.95, z - 0.27);
    this.scene.add(panel);
  }

  /** Draw one wall, railing or fence, sitting on whatever floor is on each side of it. */
  private addBarrier(b: Barrier, out: Buckets, chain: THREE.BufferGeometry[]) {
    if (b.kind === 'invisible' || b.kind === 'facade') return;
    const alongZ = b.a[0] === b.b[0];
    const len = alongZ ? Math.abs(b.b[1] - b.a[1]) : Math.abs(b.b[0] - b.a[0]);
    const at = (t: number): [number, number] => [b.a[0] + (b.b[0] - b.a[0]) * t, b.a[1] + (b.b[1] - b.a[1]) * t];
    const sides = (t: number) => {
      const [x, z] = at(t);
      const o = 0.12;
      return alongZ ? [heightAt(x - o, z), heightAt(x + o, z)] : [heightAt(x, z - o), heightAt(x, z + o)];
    };
    const high = (t: number) => Math.max(...sides(t));
    const low = (t: number) => Math.min(...sides(t));
    const box3 = (t0: number, t1: number, y0: number, y1: number, thick: number) => {
      const [xa, za] = at(t0), [xb, zb] = at(t1);
      const h = thick / 2;
      return alongZ ? boxGeo(xa - h, y0, Math.min(za, zb), xa + h, y1, Math.max(za, zb)) : boxGeo(Math.min(xa, xb), y0, za - h, Math.max(xa, xb), y1, za + h);
    };
    const v3 = (t: number, y: number) => { const [x, z] = at(t); return new THREE.Vector3(x, y, z); };

    if (b.kind === 'wall' || b.kind === 'block') {
      let y0 = Infinity, y1 = -Infinity;
      for (let t = 0; t <= 1.0001; t += 0.25) { y0 = Math.min(y0, low(t) - 0.35); y1 = Math.max(y1, high(t) + b.h); }
      push(out, b.kind === 'wall' ? C.plaster : '#d4d1c9', box3(0, 1, y0, y1, b.t ?? 0.2));
      return;
    }
    const sloped = Math.abs(high(0) - high(1)) > 0.05 || Math.abs(low(0) - low(1)) > 0.05;
    const n = Math.max(1, Math.ceil(len / (sloped ? 1.0 : 2.5)));
    if (b.kind === 'woven') {
      // the bure's walls: woven panels between timber posts
      push(out, '#b08850', box3(0, 1, low(0.5) - 0.05, high(0.5) + b.h, b.t ?? 0.12));
      for (let i = 0; i <= Math.max(1, Math.round(len / 1.1)); i++) {
        const t = i / Math.max(1, Math.round(len / 1.1));
        push(out, '#5b3a22', box3(Math.max(0, t - 0.06 / len), Math.min(1, t + 0.06 / len), low(t) - 0.05, high(t) + b.h + 0.05, (b.t ?? 0.12) + 0.06));
      }
      for (const y of [0.4, 0.8, 1.2]) push(out, '#8f6a3c', box3(0, 1, high(0.5) + y, high(0.5) + y + 0.04, (b.t ?? 0.12) + 0.02));
      return;
    }
    if (b.kind === 'picket') {
      // a white picket fence round the vegetable garden
      const count = Math.max(2, Math.round(len / 0.14));
      for (let i = 0; i <= count; i++) {
        const t = i / count, g = high(t);
        push(out, '#f4f1ea', box3(Math.max(0, t - 0.03 / len), Math.min(1, t + 0.03 / len), g - 0.05, g + b.h - (i % 2 ? 0.06 : 0), 0.025));
      }
      for (const y of [0.25, 0.65]) push(out, '#e7e2d6', box3(0, 1, high(0.5) + y, high(0.5) + y + 0.06, 0.04));
      return;
    }
    if (b.kind === 'low') {
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, g = high((t0 + t1) / 2);
        push(out, '#f2f0ea', box3(t0, t1, low((t0 + t1) / 2) - 0.35, g + b.h, b.t ?? 0.2));
      }
      return;
    }
    if (b.kind === 'fence') {
      const curb = b.curb ?? 0.25;
      for (let i = 0; i < n; i++) {
        const t0 = i / n, t1 = (i + 1) / n, gm = high((t0 + t1) / 2);
        push(out, curb > 0.4 ? '#f2f0ea' : '#cfcac0', box3(t0, t1, low((t0 + t1) / 2) - 0.35, gm + curb, curb > 0.4 ? 0.2 : 0.16));
        // chain-link above the curb, a sheared quad following the ground
        const ga = high(t0), gb = high(t1);
        const p0 = v3(t0, ga + curb), p1 = v3(t1, gb + curb), p2 = v3(t1, gb + b.h - 0.05), p3 = v3(t0, ga + b.h - 0.05);
        const seg = len / n, tall = b.h - curb;
        const q = new THREE.BufferGeometry();
        q.setAttribute('position', new THREE.Float32BufferAttribute([p0.x, p0.y, p0.z, p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p3.x, p3.y, p3.z], 3));
        q.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, seg / 0.1, 0, seg / 0.1, tall / 0.1, 0, tall / 0.1], 2));
        q.setIndex([0, 1, 2, 0, 2, 3]);
        q.computeVertexNormals();
        chain.push(q);
        push(out, C.rail, tubeGeo(p3, p2, 0.022));
      }
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        push(out, '#c8c3b8', box3(Math.max(0, t - 0.09 / len), Math.min(1, t + 0.09 / len), low(t) - 0.3, high(t) + b.h, 0.18));
      }
      return;
    }
    // rails and grilles: posts, a top rail and a bottom rail following the floor, and balusters
    const color = b.kind === 'grille' ? C.grille : C.rail;
    const top = (t: number) => high(t) + b.h;
    const bars = Math.max(2, Math.round(len / (b.kind === 'grille' ? 0.14 : 0.13)));
    for (let i = 0; i <= n; i++) push(out, color, tubeGeo(v3(i / n, high(i / n)), v3(i / n, top(i / n)), 0.03));
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      push(out, color, tubeGeo(v3(t0, top(t0)), v3(t1, top(t1)), 0.028));
      push(out, color, tubeGeo(v3(t0, high(t0) + 0.08), v3(t1, high(t1) + 0.08), 0.015));
    }
    for (let i = 1; i < bars; i++) {
      const t = i / bars;
      push(out, color, tubeGeo(v3(t, high(t) + 0.08), v3(t, top(t)), 0.009, 4));
    }
    if (b.kind === 'grille') {
      const rings = Math.max(1, Math.round(len / 0.55));
      for (let i = 0; i < rings; i++) {
        const t = (i + 0.5) / rings;
        const ring = new THREE.TorusGeometry(0.11, 0.009, 4, 16);
        if (alongZ) ring.rotateY(Math.PI / 2);
        const p = v3(t, high(t) + b.h * 0.62);
        ring.translate(p.x, p.y, p.z);
        push(out, color, ring);
      }
    }
  }

  /** The family members you are not playing, sitting where the photos have them, and the cat. */
  private buildFamily() {
    for (const c of CHARACTERS) {
      const spot = NPC_SPOTS[c.id];
      const rig = buildFigure(c.look, spot.pose, spot.seat ?? 0.45);
      bakeStatic(rig);
      rig.root.position.set(spot.pos[0], spot.pos[1], spot.pos[2]);
      rig.root.rotation.y = spot.yaw;
      this.scene.add(rig.root);
      this.npcs.push({ id: c.id, char: c, rig, spot, obb: spot.collide ? bodyOBB(spot.pos[0], spot.pos[2]) : undefined, baseQuat: rig.head.quaternion.clone() });
    }
    const k = cat();
    k.position.set(CAT_SPOT.pos[0], CAT_SPOT.pos[1], CAT_SPOT.pos[2]);
    k.rotation.y = CAT_SPOT.yaw;
    this.scene.add(k);
    this.kitty = k;
    this.setCharacter(this.char.id);
  }

  /** Who you play. Only takes effect between runs. */
  setCharacter(id: string) {
    this.char = characterById(id);
    for (const n of this.npcs) n.rig.root.visible = n.id !== this.char.id;
    if (this.player) {
      this.scene.remove(this.player.root);
      this.player.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    }
    this.player = buildFigure(this.char.look, this.char.crawl ? 'crawl' : 'stand');
    this.player.root.visible = this.third;
    this.scene.add(this.player.root);
    this.markPlayerShadow();
    this.refreshShadows();
    this.perkKey = undefined;
    this.minimap.exitKnown = !!this.char.knowsWay;
    this.chores?.setBaby(!!this.char.crawl);
    this.kick();
  }

  /** A perk's live readout: warmer/colder, or the Golden Chip's room. */
  private updatePerk() {
    let pill: PerkPill | null = null;
    if (!this.golden && (this.state === 'playing' || this.state === 'paused')) {
      const spot = GOLDEN_SPOTS[this.goldenIndex];
      if (this.char.sense) {
        const d = Math.hypot(spot.pos[0] - this.pos[0], spot.pos[2] - this.pos[1]);
        const level = d < 3.5 ? 3 : d < 7 ? 2 : d < 12 ? 1 : 0;
        pill = { text: SENSE[level], tone: `sense-${level}`, title: 'How close the Golden Chip is' };
      } else if (this.char.chipRoom) {
        pill = { text: `📍 ${ROOMS.find((r) => r.id === spot.room)?.name ?? 'Somewhere'}`, tone: 'hint', title: 'The family group chat says the Golden Chip is in this room' };
      }
    }
    const key = pill ? pill.tone + pill.text : '';
    if (key !== this.perkKey) { this.perkKey = key; this.cb.onPerk?.(pill); }
  }

  /** Nothing tall (a wall, a shut door) between you and the point (x, z). */
  private clearLine(x: number, z: number): boolean {
    const [px, pz] = this.pos;
    const n = Math.ceil(Math.hypot(x - px, z - pz) / 0.1);
    const panels = this.doorPanels();
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (blocked([px + (x - px) * t, pz + (z - pz) * t], 0.02, this.worldCam, panels)) return false;
    }
    return true;
  }

  get character(): Character { return this.char; }

  /** Hunt or explore. Only between runs (call reset() after). */
  setMode(mode: GameMode) {
    this.mode = mode;
    // exploring opens up the view: the whole of Raiwai, the hills and the sea
    const explore = mode === 'explore';
    this.raiwaiFar.visible = explore;
    const fog = this.scene.fog as THREE.Fog;
    fog.near = explore ? 70 : 34;
    fog.far = explore ? 700 : 110;
    this.camera.far = explore ? 1600 : 160;
    this.camera.updateProjectionMatrix();
    this.followSun();
    this.refreshShadows();
    this.minimap.showExit = mode === 'hunt';
    this.minimap.setMode(mode);
  }
  get gameMode(): GameMode { return this.mode; }

  /** Other visitors' approved characters, standing along the footpath across the road. */
  setNeighbours(list: VisitorCharacter[]) {
    for (const n of this.npcs.filter((x) => x.visitor)) {
      this.scene.remove(n.rig.root);
      n.rig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.geometry.dispose(); });
    }
    this.npcs = this.npcs.filter((x) => !x.visitor);
    if (this.talkingTo !== null && this.talkingTo >= this.npcs.length) this.endTalk();
    list.slice(0, VISITOR_SPOTS.length).forEach((v, i) => {
      const c = visitorCharacter(v.name, v.look, v.id, false);
      const pos = VISITOR_SPOTS[i];
      const spot: NpcSpot = { pos, yaw: (i % 3 - 1) * 0.35, pose: 'stand', collide: true };
      const rig = buildFigure(c.look, 'stand');
      bakeStatic(rig);
      rig.root.position.set(pos[0], pos[1], pos[2]);
      rig.root.rotation.y = spot.yaw;
      this.scene.add(rig.root);
      rig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      this.npcs.push({ id: c.id, char: c, rig, spot, obb: bodyOBB(pos[0], pos[2]), baseQuat: rig.head.quaternion.clone(), visitor: true });
    });
    this.refreshShadows();
    this.kick();
  }

  // ── other players (the shared world) ─────────────────────────────────────
  /** Where you are, for the shared world: [x, feet height, z, facing]. */
  netPos(): [number, number, number, number] { return [this.pos[0], this.floorY, this.pos[1], this.yaw]; }

  /** A chat box or panel is open (keys go to it, and freeing the mouse doesn't pause the game). */
  setUiOpen(on: boolean) {
    this.uiOpen = on;
    if (on) { this.keys.clear(); this.touchMove = [0, 0]; }
  }

  /** Someone else joined (or was already there): their figure, with their name over their head. */
  remoteAdd(id: string, look: Look, name: string, sub: string | undefined, p: [number, number, number, number], crawl = false) {
    this.remoteRemove(id);
    const rig = buildFigure(look, crawl ? 'crawl' : 'stand');
    bakeMoving(rig);
    rig.root.position.set(p[0], p[1], p[2]);
    rig.root.rotation.y = p[3];
    rig.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
    const tag = labelSprite(name, sub);
    tag.position.set(0, (crawl ? 0.55 : look.height) + 0.32, 0);
    rig.root.add(tag);
    this.scene.add(rig.root);
    this.remotes.set(id, { rig, tag, target: [...p], phase: 0, speed: 0, height: crawl ? 0.55 : look.height, bubbleUntil: 0 });
    this.kick();
  }

  remoteMove(id: string, p: [number, number, number, number]) {
    const r = this.remotes.get(id);
    if (r) r.target = p;
  }

  remoteRemove(id: string) {
    const r = this.remotes.get(id);
    if (!r) return;
    this.scene.remove(r.rig.root);
    r.rig.root.traverse((o) => {
      const m = o as THREE.Mesh;
      if ((o as THREE.Sprite).isSprite) { const mat = (o as THREE.Sprite).material; mat.map?.dispose(); mat.dispose(); }
      else if (m.isMesh) m.geometry.dispose();
    });
    this.remotes.delete(id);
  }

  remoteClear() { for (const id of [...this.remotes.keys()]) this.remoteRemove(id); }

  /** A speech bubble over their head for a few seconds. */
  remoteSay(id: string, text: string) {
    const r = this.remotes.get(id);
    if (!r) return;
    if (r.bubble) { r.rig.root.remove(r.bubble); r.bubble.material.map?.dispose(); r.bubble.material.dispose(); }
    r.bubble = bubbleSprite(text);
    r.bubble.position.set(0, r.height + 0.85, 0);
    r.rig.root.add(r.bubble);
    r.bubbleUntil = performance.now() + 7000;
  }

  /** Ease everyone towards where they last were, walk their legs, and only draw the nearest few. */
  private stepRemotes(dt: number, now: number) {
    const k = 1 - Math.exp(-dt * 9);
    for (const r of this.remotes.values()) {
      const root = r.rig.root;
      const [tx, ty, tz, tr] = r.target;
      const dx = tx - root.position.x, dz = tz - root.position.z;
      const far = Math.hypot(dx, dz);
      if (far > 12) root.position.set(tx, ty, tz);   // a jump across the map (a gap in the updates): no sliding
      else { root.position.x += dx * k; root.position.z += dz * k; root.position.y += (ty - root.position.y) * k; }
      const turn = Math.atan2(Math.sin(tr - root.rotation.y), Math.cos(tr - root.rotation.y));
      root.rotation.y += turn * k;
      const moved = far > 12 ? 0 : Math.hypot(dx * k, dz * k);
      r.speed += (moved / Math.max(dt, 1e-3) - r.speed) * Math.min(1, dt * 8);
      r.phase += moved * 3.4;
      animate(r.rig, r.phase, Math.min(1, r.speed / 2.4));
      if (r.bubble && now > r.bubbleUntil) { root.remove(r.bubble); r.bubble.material.map?.dispose(); r.bubble.material.dispose(); r.bubble = undefined; }
    }
    // the nearest 16 within 90 m are drawn (figures aren't cheap on a phone)
    if ((this.remoteSort -= dt) <= 0) {
      this.remoteSort = 0.5;
      const list = [...this.remotes.values()].map((r) => ({ r, d: Math.hypot(r.rig.root.position.x - this.pos[0], r.rig.root.position.z - this.pos[1]) })).sort((a, b) => a.d - b.d);
      list.forEach(({ r, d }, i) => { r.rig.root.visible = i < 16 && d < 90; });
    }
  }

  toggleView(): boolean {
    this.third = !this.third;
    if (this.player) this.player.root.visible = this.third;
    this.cb.onView?.(this.third);
    return this.third;
  }

  /** Areas you can explore: the locked places only count once they're open. */
  private get areaTotal(): number {
    const open = this.chores.unlocked;
    return AREAS.filter((r) => (this.mode === 'explore' || !r.explore) && !PLACES.some((p) => p.id === r.id && !open.includes(p.id))).length;
  }

  private get solid(): StaticWorld { const w = this.worlds[this.mode]; return this.char.crawl ? w.crawl : w.walk; }

  /** Door panels plus anyone standing in the way. */
  private obstacles(): OBB[] {
    const list = this.doorPanels();
    for (const n of this.npcs) if (n.obb && n.rig.root.visible) list.push(n.obb);
    list.push(...this.chores.obstacles());
    return list;
  }

  private buildItems() {
    const ringGeo = new THREE.RingGeometry(0.2, 0.28, 28);
    ringGeo.rotateX(-Math.PI / 2);
    for (const c of COLLECTIBLES) {
      const model = partModel(c.kind);
      const ringMat = new THREE.MeshBasicMaterial({ color: '#60a5fa', transparent: true, opacity: 0.55, depthWrite: false });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      this.scene.add(model.group, ring);
      this.items.push({ id: c.id, name: c.name, pos: c.pos, group: model.group, ring, spin: model.spin, golden: false, taken: false, seen: false, phase: Math.random() * 6, base: model.group.scale.x });
    }
    const chip = goldenChip();
    const sparkles = new THREE.Group();
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(new THREE.OctahedronGeometry(0.035, 0), new THREE.MeshBasicMaterial({ color: '#fff2a8' }));
      s.position.set(Math.cos((i / 4) * Math.PI * 2) * 0.32, 0, Math.sin((i / 4) * Math.PI * 2) * 0.32);
      sparkles.add(s);
    }
    chip.add(sparkles);
    chip.userData.sparkles = sparkles;
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.65, depthWrite: false }));
    this.scene.add(chip, ring);
    this.items.push({ id: 'golden', name: 'Golden Chip', pos: GOLDEN_SPOTS[0].pos, group: chip, ring, golden: true, taken: false, seen: false, phase: 0, base: 1 });
  }

  // ── run lifecycle ────────────────────────────────────────────────────────
  reset() {
    this.endTalk();
    this.chores.reset(!!this.char.crawl);
    this.lookedOut = false;
    this.lookedOutTower = false;
    this.pos = [SPAWN.pos[0], SPAWN.pos[2]];
    this.floorY = heightAt(this.pos[0], this.pos[1]);
    this.air = false;
    this.vy = 0;
    this.vel = [0, 0];
    this.yaw = SPAWN.yaw;
    this.pitch = -0.05;
    this.elapsed = 0;
    this.started = false;
    this.collected = 0;
    this.golden = false;
    this.visited.clear();
    this.goldenIndex = Math.floor(Math.random() * GOLDEN_SPOTS.length);
    for (const it of this.items) {
      it.taken = false;
      it.seen = false;
      if (it.golden) it.pos = GOLDEN_SPOTS[this.goldenIndex].pos;
      it.group.visible = true;
      it.ring.visible = true;
      it.group.scale.setScalar(it.base);
      it.group.position.set(it.pos[0], it.pos[1], it.pos[2]);
      it.ring.position.set(it.pos[0], this.floorUnder(it.pos), it.pos[2]);
      // exploring is just for walking about: no parts, no Golden Chip, no clock
      if (this.mode === 'explore') { it.taken = true; it.group.visible = false; it.ring.visible = false; }
    }
    for (const d of this.doors) d.open = d.target = d.door.kind === 'hinged' && d.door.startOpen ? 1 : 0;
    for (const w of this.windows) { w.open = 0; w.target = 0; }
    this.applyDoors();
    this.applyWindows();
    this.minimap.reset();
    if (this.minimap.expanded) { this.minimap.expanded = false; this.cb.onMap?.(false); }
    this.hud.timer.textContent = '00:00.0';
    this.setPrompt('');
    this.cb.onRooms?.(0, this.areaTotal);
    this.kick();
  }

  /** The height of the surface an item floats over (its glow ring sits there). */
  private floorUnder(p: XYZ) {
    let top = heightAt(p[0], p[2]) + 0.012;
    for (const prim of PROPS) {
      if (prim.kind !== 'box' || prim.color === 'transparent' || prim.max[1] > p[1] - 0.05) continue;
      if (p[0] >= prim.min[0] && p[0] <= prim.max[0] && p[2] >= prim.min[2] && p[2] <= prim.max[2]) top = Math.max(top, prim.max[1] + 0.006);
    }
    return top;
  }

  start() {
    this.sfx.unlock();
    if (this.state === 'intro') { this.yaw = SPAWN.yaw; this.pitch = 0; }
    this.state = 'playing';
    this.requestLock();
    this.last = 0;
    this.kick();
  }

  pause(reason: 'lock-lost' | 'poster' | 'manual' = 'manual') {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.endTalk();
    this.chores.stopWork();
    this.keys.clear();
    this.touchMove = [0, 0];
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.cb.onPause(reason);
  }

  resume() {
    if (this.state !== 'paused') return;
    this.sfx.unlock();
    this.state = 'playing';
    this.requestLock();
    this.last = 0;
    this.kick();
  }

  requestLock() {
    if (this.opts.touch) return;
    const el = this.renderer.domElement as HTMLCanvasElement & { requestPointerLock?: () => Promise<void> | void };
    try {
      const r = el.requestPointerLock?.();
      if (r && typeof (r as Promise<void>).catch === 'function') (r as Promise<void>).catch(() => { /* drag-to-look fallback stays available */ });
    } catch { /* not supported: drag-to-look fallback */ }
  }

  setTouchMove(x: number, y: number) { this.touchMove = [x, y]; }
  look(dx: number, dy: number) {
    this.yaw -= dx;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch - dy));
  }
  setRun(on: boolean) { this.running = on; }

  /** Jump (Space, or the jump button). Not in the air already, and not the baby (she crawls). Exploring, you jump higher: over fences and walls. */
  jump() {
    if (this.state !== 'playing' || this.air || this.char.crawl) return;
    this.air = true;
    const j = this.mode === 'explore' ? JUMP_ROAM : JUMP;
    this.vy = jumpSpeed(this.char.look.kind === 'kid' ? j.kid : j.up);
    this.started = true;
    this.sfx.jump();
  }

  /** The highest your feet can go here: under a ceiling, low enough that your head stays below it. */
  private ceilingCap(): number {
    const [x, z] = this.pos;
    const room = roomAtLevel(x, z, this.floorY);
    if (room?.cap !== undefined) return room.cap - this.char.eye - 0.18;
    const roofed = room ? room.ceiling : x > HOUSE.x0 - 0.2 && x < HOUSE.x1 + 0.2 && z > HOUSE.z0 - 0.2 && z < HOUSE.z1 + 0.2;   // a doorway in the house
    return roofed ? (room?.y ?? 0) + CEIL_H - this.char.eye - 0.18 : Infinity;
  }
  toggleMap(): boolean {
    this.minimap.expanded = !this.minimap.expanded;
    this.mapFrame = 0;
    this.cb.onMap?.(this.minimap.expanded);
    return this.minimap.expanded;
  }
  setMuted(m: boolean) { this.sfx.muted = m; }

  /** Use whatever you are looking at: a door, a window or the poster. */
  interact() {
    if (this.state !== 'playing' || !this.focus) return;
    const f = this.focus;
    if (f.kind === 'door') {
      const d = this.doors[f.index];
      d.target = d.target > 0.5 ? 0 : 1;
      const pair = d.door.kind === 'hinged' ? (d.door as HingedDoor).pair : undefined;
      const other = pair ? this.doors.find((o) => o.door.id === pair) : undefined;
      if (other) other.target = d.target;
      if (d.target === 1) this.swingAway(other ? [d, other] : [d]);
      this.sfx.door(d.target > 0.5);
    } else if (f.kind === 'npc') {
      // E next to someone starts a conversation; E again (or walking away) ends it
      const n = this.npcs[f.index];
      if (this.talkingTo === f.index) { this.endTalk(); return; }
      const room = this.golden ? null : (ROOMS.find((r) => r.id === GOLDEN_SPOTS[this.goldenIndex].room)?.name ?? 'house').toLowerCase();
      this.talkingTo = f.index;
      this.cb.onTalk?.({ player: this.char, npc: n.char, room, turn: this.talkTurn++ });
      this.sfx.pickup();
    } else if (f.kind === 'shop') {
      this.cb.onShop?.(SHOP_SPOTS[f.index]);
    } else if (f.kind === 'promo') {
      this.cb.onPromo?.(PROMO_SPOTS[f.index].id);
      this.sfx.pickup();
    } else if (f.kind === 'chore' || f.kind === 'tool' || f.kind === 'lock') {
      this.chores.interact(f.kind, f.index);
    } else if (f.kind === 'cat') {
      this.cb.onSay?.([{ who: 'The cat', text: 'Purrr… (it flicks its tail and goes back to sleep)' }]);
    } else if (f.kind === 'window') {
      const w = this.windows[f.index];
      w.target = w.target > 0.5 ? 0 : 1;
      this.sfx.window();
    } else if (f.kind === 'poster') {
      this.pause('poster');
    }
  }

  // ── input ────────────────────────────────────────────────────────────────
  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state !== 'playing' || this.uiOpen) return;
    if ((e.target as HTMLElement | null)?.closest?.('input, textarea, select')) return;
    const code = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'].includes(code)) e.preventDefault();
    if (code === 'KeyE' || code === 'Enter' || code === 'KeyF') { e.preventDefault(); if (!e.repeat) this.interact(); return; }
    if (code === 'KeyM' && !e.repeat) { this.toggleMap(); return; }
    if (code === 'KeyV' && !e.repeat) { this.toggleView(); return; }
    if (code === 'Space') { if (!e.repeat) this.jump(); return; }
    this.keys.add(code);
  };
  private onKeyUp = (e: KeyboardEvent) => { this.keys.delete(e.code); };
  private onMouseMove = (e: MouseEvent) => {
    if (this.state !== 'playing') return;
    if (document.pointerLockElement === this.renderer.domElement) this.look(e.movementX * LOOK, e.movementY * LOOK);
    else if (this.dragging) { this.look((e.clientX - this.dragging[0]) * LOOK * 1.4, (e.clientY - this.dragging[1]) * LOOK * 1.4); this.dragging = [e.clientX, e.clientY]; }
  };
  private dragging: [number, number] | null = null;
  private onMouseDown = (e: MouseEvent) => {
    if (this.opts.touch || this.state !== 'playing') return;
    if (document.pointerLockElement !== this.renderer.domElement) { this.dragging = [e.clientX, e.clientY]; this.requestLock(); }
  };
  private onMouseUp = () => { this.dragging = null; };
  private lockWasHeld = false;
  private onLockChange = () => {
    const held = document.pointerLockElement === this.renderer.domElement;
    if (this.lockWasHeld && !held && this.state === 'playing' && !this.uiOpen) this.pause('lock-lost');
    this.lockWasHeld = held;
  };
  private onBlur = () => { this.keys.clear(); };

  private bindInput() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('blur', this.onBlur);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('pointerlockchange', this.onLockChange);
  }

  // ── simulation ───────────────────────────────────────────────────────────
  private doorPanels(): OBB[] { return this.doors.map((d) => doorOBB(d.door, d.open)); }

  /** A gate shut in front of you opens away from you rather than waiting for you to step back. */
  private swingAway(leaves: DoorRig[]) {
    const gates = leaves.filter((l) => l.open === 0 && l.door.kind === 'hinged' && l.door.bothWays) as (DoorRig & { door: HingedDoor })[];
    if (gates.length !== leaves.length) return;
    const r = this.char.radius + 0.05;
    const hits = (sign: number) => gates.some((g) => [0.25, 0.5, 0.75, 1].some((t) =>
      circleHitsOBB(this.pos, r, doorOBB({ ...g.door, swing: g.door.swing * sign }, t))));
    if (hits(1) && !hits(-1)) for (const g of gates) g.door.swing = -g.door.swing;
  }

  /** Close the conversation (you said goodbye, walked off, or the run stopped). */
  endTalk(onlyWith?: string) {
    if (this.talkingTo === null) return;
    if (onlyWith && this.npcs[this.talkingTo].id !== onlyWith) return;
    this.talkingTo = null;
    this.cb.onTalk?.(null);
  }

  /** Everything solid casts and catches shadows, except the moving bits (the player, the spinning parts). */
  private setupShadows() {
    const skip = new Set<THREE.Object3D>();
    for (const it of this.items) it.group.traverse((o) => skip.add(o));
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || skip.has(m)) return;
      const mat = m.material as THREE.Material;
      const solid = mat instanceof THREE.MeshStandardMaterial && !mat.transparent;
      m.castShadow = solid;
      m.receiveShadow = solid;
    });
    this.markPlayerShadow();
    this.renderer.shadowMap.needsUpdate = true;
  }

  /** The player's figure never casts (it moves every frame), but catches shadows. */
  private markPlayerShadow() {
    this.player?.root.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = false; m.receiveShadow = true; } });
  }

  /**
   * Ambient occlusion: corners, the floor under furniture and the ground round
   * people's feet get the soft shade they have in real life. Glass and other
   * see-through things are left out.
   */
  private setupAO() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(Math.max(1, size.x), Math.max(1, size.y), { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(this.renderer, target);
    composer.addPass(new RenderPass(this.scene, this.camera));
    const ao = new GTAOPass(this.scene, this.camera, Math.max(1, size.x), Math.max(1, size.y));
    ao.output = GTAOPass.OUTPUT.Default;
    ao.blendIntensity = 1;
    ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.3, thickness: 1.2, scale: 1.1, samples: 16 });
    // smoothing that stops at edges (otherwise corners get a fuzzy fringe)
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 10, normalPhi: 8, radius: 6, rings: 2, samples: 16 });
    // leave see-through things (glass, the item rings, floating labels) out of the depth the shading is worked out from
    const pass = ao as unknown as { _overrideVisibility: () => void; _visibilityCache: THREE.Object3D[] };
    const hideBase = pass._overrideVisibility.bind(pass);
    pass._overrideVisibility = () => {
      hideBase();
      this.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        const seeThrough = (m.isMesh && (m.material as THREE.Material).transparent) || (o as THREE.Sprite).isSprite;
        if (seeThrough && o.visible) { o.visible = false; pass._visibilityCache.push(o); }
      });
    };
    composer.addPass(ao);
    composer.addPass(new OutputPass());
    this.composer = composer;
    this.ao = ao;
    this.sizeAO();
  }

  private sizeAO() {
    if (!this.composer || !this.ao) return;
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.composer.setPixelRatio(this.renderer.getPixelRatio());
    this.composer.setSize(w, h);
  }

  /** If frames are slow with the soft shading on, turn it off for the rest of the visit. */
  private watchFrameRate(dt: number) {
    if (!this.composer || this.state !== 'playing' || this.aoPinned) return;
    this.frameAvg += (dt - this.frameAvg) * 0.05;
    this.slowFor = this.frameAvg > 1 / 36 ? this.slowFor + dt : 0;
    if (this.slowFor > 2.5) {
      this.composer.dispose();
      this.ao?.dispose();
      this.composer = undefined;
      this.ao = undefined;
      console.info('[house-hunt] soft shading switched off to keep the game smooth');
    }
  }

  /** Redraw the sun's shadows on the next frame (after a door moves or someone appears). */
  private refreshShadows() { this.renderer.shadowMap.needsUpdate = true; }

  /** Centre the sun's shadow area (about 68 m across) on a spot. */
  private aimSun(x: number, z: number) {
    const centre = new THREE.Vector3(x, 0, z);
    this.sun.position.copy(centre).add(new THREE.Vector3(-10, 9, 4).normalize().multiplyScalar(45));
    this.sun.target.position.copy(centre);
    this.sun.target.updateMatrixWorld();
    this.sunAt = [x, z];
  }

  /** Exploring: when you've walked well away from where the shadows are drawn, draw them round you instead. */
  private followSun() {
    const [x, z] = this.mode === 'explore' ? this.pos : [10, 11];
    if (Math.hypot(x - this.sunAt[0], z - this.sunAt[1]) < (this.mode === 'explore' ? 18 : 0.5)) return;
    this.aimSun(x, z);
    this.refreshShadows();
  }

  private applyDoors() {
    for (const d of this.doors) {
      if (d.door.kind === 'slide') {
        const b = doorOBB(d.door, d.open);
        d.pivot.position.x = b.cx;
      } else {
        d.pivot.rotation.y = -(d.door.closed + d.door.swing * d.open);
      }
    }
  }

  private applyWindows() {
    for (const w of this.windows) {
      for (const s of w.sashes) {
        const swing = w.open * 1.25 * s.dir * w.spec.outward;
        s.pivot.rotation.y = w.spec.at === 'x' ? swing : -swing;
      }
    }
  }

  private step(dt: number) {
    // walk off mid-conversation and it ends
    if (this.talkingTo !== null) {
      const s = this.npcs[this.talkingTo].spot.pos;
      if (Math.hypot(s[0] - this.pos[0], s[2] - this.pos[1]) > 2.8) this.endTalk();
    }
    this.time += dt;
    // doors and windows ease toward their targets; a door that would swing into you waits
    const me: [number, number] = this.pos;
    const r = this.char.radius;
    let doorMoved = false;
    for (const d of this.doors) {
      if (d.open === d.target) continue;
      const dir = Math.sign(d.target - d.open);
      const next = Math.max(0, Math.min(1, d.open + dir * dt * (d.door.kind === 'slide' ? 1.6 : 2.0)));
      const blockedNow = circleHitsOBB(me, r, doorOBB(d.door, d.open));
      const blockedNext = circleHitsOBB(me, r, doorOBB(d.door, next));
      if (blockedNext && !blockedNow) continue;
      d.open = next;
      doorMoved = true;
    }
    this.applyDoors();
    if (doorMoved) this.refreshShadows();
    for (const w of this.windows) {
      if (w.open === w.target) continue;
      w.open = Math.max(0, Math.min(1, w.open + Math.sign(w.target - w.open) * dt * 2.2));
    }
    this.applyWindows();

    if (this.state === 'playing') {
      let fx = 0, fz = 0;
      const k = this.keys;
      const fwd = (k.has('KeyW') || k.has('ArrowUp') ? 1 : 0) - (k.has('KeyS') || k.has('ArrowDown') ? 1 : 0) + this.touchMove[1];
      const side = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0) + this.touchMove[0];
      const run = this.running || k.has('ShiftLeft') || k.has('ShiftRight');
      const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
      fx = -sin * fwd + cos * side;
      fz = -cos * fwd - sin * side;
      const len = Math.hypot(fx, fz);
      if (len > 1) { fx /= len; fz /= len; }
      const speed = run ? this.char.run : this.char.walk;
      const blend = 1 - Math.exp(-dt * 12);
      this.vel[0] += (fx * speed - this.vel[0]) * blend;
      this.vel[1] += (fz * speed - this.vel[1]) * blend;
      if (!this.started && len > 0.05) this.started = true;
      if (Math.hypot(this.vel[0], this.vel[1]) > 0.01) {
        // in the air or up on something you pass over whatever is below your feet; upstairs, over the walls below
        this.pos = moveAndSlide(this.pos, this.vel[0] * dt, this.vel[1] * dt, r, this.solid, this.obstacles(), this.floorY);
      }
      const sp = Math.hypot(this.vel[0], this.vel[1]);
      this.bob += sp * dt * 2.4;
      if (this.started && this.mode === 'hunt') this.elapsed += dt;

      const room = roomAtLevel(this.pos[0], this.pos[1], this.floorY);
      if (room?.area && !this.visited.has(room.id)) {
        this.visited.add(room.id);
        this.cb.onRooms?.(this.visited.size, this.areaTotal);
      }

      this.checkPickups();
      this.chores.update(dt, this.pos);
      if (room?.id === 'treehouse' && !this.lookedOut) {
        // the treehouse's reward: from up here you can see the whole compound
        this.lookedOut = true;
        this.minimap.revealAll();
        for (const it of this.items) if (!it.golden) it.seen = true;
        this.cb.onHint?.('🌳 From up here you can see everything! The whole map is clear.');
      }
      if (room?.id === 'lookout-top' && !this.lookedOutTower) {
        // the top of the Raiwai Lookout: all of Raiwai below you
        this.lookedOutTower = true;
        this.minimap.revealAll();
        this.cb.onHint?.('🗼 The top of the Raiwai Lookout! All of Raiwai is below you, and the whole map is clear.');
      }
      this.updateFocus();

      if (this.mode === 'hunt' && this.pos[0] >= EXIT_ZONE.x0 && this.pos[0] <= EXIT_ZONE.x1 && this.pos[1] >= EXIT_ZONE.z0 && this.pos[1] <= EXIT_ZONE.z1) this.win();
    }

    // the floor under you (or what you're standing on): ease toward it so stairs and slopes feel smooth;
    // in the air, gravity until you land; walk off the edge of something and you drop
    const ground = floorAt(this.pos[0], this.pos[1], this.floorY);
    const lifted = this.air || this.floorY > ground + LIFTED;
    const floor = lifted ? Math.max(ground, supportAt(this.pos, r, this.solid, this.floorY)) : ground;
    if (this.air) {
      const s = airStep({ feet: this.floorY, vy: this.vy, air: true }, floor, this.ceilingCap(), dt);
      this.floorY = s.feet; this.vy = s.vy; this.air = s.air;
    } else if (floor < this.floorY - 0.25) {
      this.air = true; this.vy = 0;
    } else {
      this.floorY = Math.abs(floor - this.floorY) > 1.2 ? floor : this.floorY + (floor - this.floorY) * (1 - Math.exp(-dt * 16));
    }

    // items bob and turn
    for (const it of this.items) {
      if (!it.group.visible) continue;
      if (it.taken) {
        const s = it.group.scale.x * (1 - dt * 6);
        it.group.scale.setScalar(Math.max(0, s));
        it.group.position.y += dt * 1.5;
        if (s < 0.05) { it.group.visible = false; it.ring.visible = false; }
        continue;
      }
      it.group.rotation.y += dt * (it.golden ? 1.6 : 1.1);
      it.group.rotation.x = it.golden ? 0 : -0.35;
      it.group.position.y = it.pos[1] + Math.sin(this.time * 2 + it.phase) * 0.05;
      if (it.spin) it.spin.rotation.z += dt * 9;
      const sparkles = it.group.userData.sparkles as THREE.Group | undefined;
      if (sparkles) sparkles.rotation.y -= dt * 3.2;
      const m = it.ring.material as THREE.MeshBasicMaterial;
      m.opacity = 0.35 + 0.25 * Math.sin(this.time * 3 + it.phase);
    }
    // bursts
    for (const b of this.bursts) {
      b.t += dt;
      const dummy = new THREE.Object3D();
      for (let i = 0; i < b.vel.length; i++) {
        b.mesh.getMatrixAt(i, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        b.vel[i].y -= dt * 3;
        dummy.position.addScaledVector(b.vel[i], dt);
        dummy.scale.setScalar(Math.max(0.001, 1 - b.t / 0.7));
        dummy.updateMatrix();
        b.mesh.setMatrixAt(i, dummy.matrix);
      }
      b.mesh.instanceMatrix.needsUpdate = true;
    }
    for (const b of this.bursts.filter((x) => x.t > 0.7)) { this.scene.remove(b.mesh); b.mesh.geometry.dispose(); (b.mesh.material as THREE.Material).dispose(); }
    this.bursts = this.bursts.filter((x) => x.t <= 0.7);

    // the fan oscillates and spins
    if (this.fanHead) {
      this.fanHead.rotation.y = Math.PI * 0.75 + Math.sin(this.time * 0.6) * 0.7;
      (this.fanHead.userData.blades as THREE.Object3D).rotation.z += dt * 22;
    }
  }

  private checkPickups() {
    for (const it of this.items) {
      if (it.taken) continue;
      const d = Math.hypot(it.pos[0] - this.pos[0], it.pos[2] - this.pos[1]);
      const reach = Math.max(PICKUP, this.char.magnet ?? 0);
      if (d > reach || Math.abs(it.pos[1] - (this.floorY + 0.9)) > 1.4) continue;
      if (d > PICKUP && !this.clearLine(it.pos[0], it.pos[2])) continue;
      it.taken = true;
      this.spawnBurst(it.pos, it.golden ? '#fbbf24' : '#60a5fa');
      if (it.golden) { this.golden = true; this.sfx.golden(); }
      else { this.collected++; this.sfx.pickup(); }
      this.cb.onPickup({ name: it.name, count: this.collected, total: COLLECTIBLES.length, golden: it.golden });
    }
  }

  private spawnBurst(p: XYZ, color: string) {
    const n = 16;
    const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.035, 0.035, 0.035), new THREE.MeshBasicMaterial({ color }), n);
    const vel: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      dummy.position.set(p[0], p[1], p[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const a = (i / n) * Math.PI * 2;
      vel.push(new THREE.Vector3(Math.cos(a) * 1.4, 1.2 + Math.random() * 1.4, Math.sin(a) * 1.4));
    }
    this.scene.add(mesh);
    this.bursts.push({ mesh, vel, t: 0 });
  }

  private updateFocus() {
    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    let best: { kind: FocusKind; index: number; score: number } | null = null;
    const consider = (kind: FocusKind, index: number, x: number, z: number, maxDist = REACH, bonus = 0) => {
      const dx = x - this.pos[0], dz = z - this.pos[1];
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist) return;
      const facing = dist < 0.05 ? 1 : (dx * fx + dz * fz) / dist;
      if (facing < 0.55) return;
      const score = dist - facing - bonus;
      if (!best || score < best.score) best = { kind, index, score };
    };
    this.doors.forEach((d, i) => {
      if (d.door.kind === 'slide') consider('door', i, (d.door.from + d.door.to) / 2 + 0.6, d.door.line);
      else {
        if (Math.abs((d.door.base ?? 0) - this.floorY) > 1.6) return;
        const a = d.door.closed;
        consider('door', i, d.door.hinge[0] + Math.cos(a) * d.door.width / 2, d.door.hinge[1] + Math.sin(a) * d.door.width / 2);
      }
    });
    this.npcs.forEach((n, i) => { if (n.rig.root.visible) consider('npc', i, n.spot.pos[0], n.spot.pos[2], 2.0); });
    if (this.kitty) consider('cat', 0, CAT_SPOT.pos[0], CAT_SPOT.pos[2], 1.6);
    const inside = roomAt(this.pos[0], this.pos[1]);
    if (inside && !inside.outside) this.windows.forEach((w, i) => {
      const mid = (w.spec.from + w.spec.to) / 2;
      if (w.spec.at === 'x') consider('window', i, w.spec.line, mid, 1.8); else consider('window', i, mid, w.spec.line, 1.8);
    });
    consider('poster', 0, POSTER.x, POSTER.z, 2.2);
    if (this.mode === 'explore') SHOP_SPOTS.forEach((sp, i) => {
      // the nearest point of the shopfront
      const x = Math.max(sp.x0 + 0.5, Math.min(this.pos[0], sp.x1 - 0.5));
      consider('shop', i, x, SHOP_LINE, 3.6);
    });
    // the hidden reward cards: you have to be inside the shop and come close for the prompt (never through the window)
    if (this.mode === 'explore') {
      const here = roomAtLevel(this.pos[0], this.pos[1], this.floorY)?.id;
      PROMO_SPOTS.forEach((p, i) => { if (here === p.room) consider('promo', i, p.x, p.z, PROMO_REACH, 0.5); });
    }
    this.chores.candidates(consider);
    const b = best as { kind: FocusKind; index: number; score: number } | null;
    this.focus = b ? { kind: b.kind, index: b.index } : null;
    const key = this.opts.touch ? 'Tap ✋' : 'E';
    let text = '';
    if (b?.kind === 'door') { const d = this.doors[b.index]; text = `${key} · ${d.target > 0.5 ? 'Close' : 'Open'} the ${d.door.label}`; }
    if (b?.kind === 'window') { const w = this.windows[b.index]; text = `${key} · ${w.target > 0.5 ? 'Close' : 'Open'} the window`; }
    if (b?.kind === 'poster') text = `${key} · Read the poster: how a database index works`;
    if (b?.kind === 'npc') text = this.talkingTo === b.index ? `${key} · Say goodbye` : `${key} · Talk to ${firstName(this.npcs[b.index].char)}`;
    if (b?.kind === 'cat') text = `${key} · Pet the cat`;
    if (b?.kind === 'promo') text = `${key} · You found a hidden reward card! Pick it up`;
    if (b?.kind === 'shop') { const sp = SHOP_SPOTS[b.index]; text = `${key} · ${sp.kind === 'empty' ? `Look at ${sp.name}` : `Visit ${sp.name}`}${sp.offers.length ? ' · offers inside' : ''}`; }
    if (b?.kind === 'chore' || b?.kind === 'tool' || b?.kind === 'lock') text = this.chores.prompt(b.kind, b.index, key);
    this.setPrompt(text);
  }

  private setPrompt(text: string) {
    if (text === this.promptText) return;
    this.promptText = text;
    this.hud.prompt.textContent = text;
    this.hud.prompt.style.opacity = text ? '1' : '0';
  }

  private win() {
    this.state = 'won';
    this.keys.clear();
    this.touchMove = [0, 0];
    this.setPrompt('');
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.sfx.win();
    this.cb.onWin({ timeMs: Math.round(this.elapsed * 1000), items: this.collected, total: COLLECTIBLES.length, golden: this.golden, rooms: this.visited.size, totalRooms: this.areaTotal, stars: this.chores.snapshot().runStars });
  }

  // ── frame loop ───────────────────────────────────────────────────────────
  private kick() {
    if (!this.raf && !this.disposed) this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed) return;
    const dt = this.last ? Math.min(0.05, (now - this.last) / 1000) : 1 / 60;
    this.last = now;
    const t0 = performance.now();
    this.step(dt);
    const t1 = performance.now();

    if (this.state === 'intro') {
      // a slow look around while the start card is up
      this.yaw = SPAWN.yaw + Math.sin(now / 4000) * 0.35;
      this.pitch = 0.02 + Math.sin(now / 5200) * 0.04;
    }
    const moving = this.state === 'playing' ? Math.min(1, Math.hypot(this.vel[0], this.vel[1]) / this.char.walk) : 0;
    const bobY = this.third ? 0 : Math.sin(this.bob * 2) * (this.char.crawl ? 0.015 : 0.03) * moving;
    const headY = this.floorY + this.char.eye + bobY;
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    if (this.third) this.placeThirdPerson(headY);
    else this.camera.position.set(this.pos[0], headY, this.pos[1]);
    if (this.player) {
      this.player.root.position.set(this.pos[0], this.floorY, this.pos[1]);
      this.player.root.rotation.y = this.yaw;
      animate(this.player, this.bob * (this.char.crawl ? 2.2 : 1.6), this.air ? moving * 0.3 : moving);
    }
    this.followSun();
    // the family turn their heads to look at you when you come close
    for (const n of this.npcs) {
      if (!n.rig.root.visible || n.spot.pose === 'lie') continue;
      const dx = this.pos[0] - n.spot.pos[0], dz = this.pos[1] - n.spot.pos[2];
      const near = Math.hypot(dx, dz) < 3.5;
      let turn = 0;
      if (near) {
        const want = Math.atan2(-dx, -dz) - n.spot.yaw;
        turn = Math.max(-1.0, Math.min(1.0, Math.atan2(Math.sin(want), Math.cos(want))));
      }
      const cur = (n.rig.head.userData.turn as number | undefined) ?? 0;
      const next = cur + (turn - cur) * (1 - Math.exp(-dt * 5));
      n.rig.head.userData.turn = next;
      n.rig.head.quaternion.copy(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), next)).multiply(n.baseQuat);
    }
    if (this.remotes.size) this.stepRemotes(dt, now);

    if (this.state === 'playing' || this.state === 'intro') {
      this.revealClock -= dt;
      if (this.revealClock <= 0) {
        this.revealClock = 0.12;
        const shut = this.doors.filter((d) => d.open < 0.4).map((d) => doorOBB(d.door, d.open));
        this.minimap.reveal(this.pos[0], this.pos[1], shut, this.char.sight ?? DEFAULT_SIGHT);
        const radar = this.char.radar ?? 0;
        for (const it of this.items) {
          if (it.golden || it.taken || it.seen) continue;
          if (this.minimap.isRevealed(it.pos[0], it.pos[2]) || Math.hypot(it.pos[0] - this.pos[0], it.pos[2] - this.pos[1]) < radar) it.seen = true;
        }
      }
    }
    if (this.mapFrame++ % (this.minimap.expanded ? 2 : 3) === 0) {
      const spotted = this.items.filter((it) => !it.golden && it.seen && !it.taken).map((it) => [it.pos[0], it.pos[2]] as [number, number]);
      const ipad = this.char.ipadAfter !== undefined && this.collected >= this.char.ipadAfter && !this.golden;
      const g = this.items.find((it) => it.golden);
      this.minimap.draw(this.pos[0], this.pos[1], this.yaw, spotted, ipad && g ? [g.pos[0], g.pos[2]] : null);
    }
    if (this.clock && Math.floor(now / 60000) !== Math.floor((now - dt * 1000) / 60000)) this.clock.redraw();

    const t = this.elapsed;
    const mm = Math.floor(t / 60), ss = Math.floor(t % 60), ds = Math.floor((t * 10) % 10);
    const txt = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${ds}`;
    if (this.hud.timer.textContent !== txt) this.hud.timer.textContent = txt;

    this.updatePerk();
    const t2 = performance.now();
    if (this.composer) this.composer.render(dt); else this.renderer.render(this.scene, this.camera);
    this.watchFrameRate(dt);
    const t3 = performance.now();
    this.perf = { step: t1 - t0, hud: t2 - t1, render: t3 - t2, calls: this.renderer.info.render.calls, tris: this.renderer.info.render.triangles };
    if (this.visible) this.kick();
  };

  /** Put the camera behind and a little above you, pulled in so it never goes through a wall, floor or ceiling. */
  private placeThirdPerson(headY: number) {
    const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const fx = -Math.sin(this.yaw) * cp, fy = sp, fz = -Math.cos(this.yaw) * cp;
    const tx = this.pos[0], ty = headY + 0.1, tz = this.pos[1];
    const full = this.char.thirdDist;
    const panels = this.doorPanels();
    let best = 0.25;
    for (let d = 0.25; d <= full + 1e-6; d += 0.08) {
      const x = tx - fx * d, z = tz - fz * d, y = ty - fy * d + 0.3 * (d / full);
      if (blocked([x, z], 0.14, this.worldCam, panels, this.floorY)) break;
      if (y < floorAt(x, z, this.floorY) + 0.15) break;
      const room = roomAtLevel(x, z, this.floorY);
      if (room?.ceiling && y > CEIL_H - 0.12) break;
      if (room?.cap !== undefined && y > room.cap - 0.12) break;
      best = d;
    }
    this.camera.position.set(tx - fx * best, ty - fy * best + 0.3 * (best / full), tz - fz * best);
    // squeezed right up behind your own head (a tight corridor): hide yourself rather than fill the screen
    if (this.player) this.player.root.visible = best > Math.min(0.8, full * 0.45);
  }

  private resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.sizeAO();
    this.kick();
  }

  /** For the dev-only debug hook in HouseGame. */
  debug() {
    return {
      /** `feet`: land on the floor at that height where floors overlap (upstairs at Garden City). */
      teleport: (x: number, z: number, yaw?: number, feet?: number) => { this.pos = [x, z]; this.floorY = feet === undefined ? heightAt(x, z) : floorAt(x, z, feet); this.air = false; this.vy = 0; if (yaw !== undefined) this.yaw = yaw; },
      jump: () => this.jump(),
      /** Run the simulation `n` steps of `dt` seconds (tests: the same every time, however slow the browser is). */
      tick: (dt: number, n = 1) => { for (let i = 0; i < n; i++) this.step(dt); },
      air: () => ({ air: this.air, feet: this.floorY, vy: this.vy }),
      character: (id: string) => this.setCharacter(id),
      view: () => this.toggleView(),
      floor: () => this.floorY,
      openAll: () => { for (const d of this.doors) { d.open = 1; d.target = 1; } this.applyDoors(); this.refreshShadows(); },
      state: () => ({ pos: this.pos, yaw: this.yaw, pitch: this.pitch, state: this.state, items: this.collected, golden: this.golden, goldenSpot: this.goldenIndex, goldenPos: GOLDEN_SPOTS[this.goldenIndex].pos, elapsed: this.elapsed, focus: this.focus, prompt: this.promptText, doors: this.doors.map((d) => [d.door.id, d.open]) }),
      setLook: (yaw: number, pitch: number) => { this.yaw = yaw; this.pitch = pitch; },
      press: (code: string, down: boolean) => { if (down) this.keys.add(code); else this.keys.delete(code); },
      perf: () => this.perf,
      stars: (n: number) => this.chores.debugStars(n),
      finish: (stepId: string) => this.chores.debugFinish(stepId),
      chores: () => this.chores.snapshot(),
      neighbours: (list: VisitorCharacter[]) => this.setNeighbours(list),
      remotes: () => [...this.remotes.entries()].map(([id, r]) => ({ id, pos: [r.rig.root.position.x, r.rig.root.position.y, r.rig.root.position.z], visible: r.rig.root.visible, bubble: !!r.bubble })),
      mode: () => this.mode,
      raiwaiLayers: (near: boolean, far: boolean) => { this.raiwaiNear.visible = near; this.raiwaiFar.visible = far; },
      refreshShadows: () => this.refreshShadows(),
      ao: () => !!this.composer,
      keepAO: () => { this.aoPinned = true; },
      shadows: () => {
        let casters = 0, receivers = 0;
        this.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { if (m.castShadow) casters++; if (m.receiveShadow) receivers++; } });
        const sun = this.scene.children.find((c) => (c as THREE.DirectionalLight).isDirectionalLight) as THREE.DirectionalLight | undefined;
        return { enabled: this.renderer.shadowMap.enabled, casters, receivers, map: sun?.shadow.map?.width ?? null, cast: sun?.castShadow };
      },
    };
  }

  dispose() {
    this.disposed = true;
    this.remoteClear();
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('blur', this.onBlur);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('pointerlockchange', this.onLockChange);
    if (document.pointerLockElement === this.renderer.domElement) document.exitPointerLock();
    this.io?.disconnect();
    this.ro?.disconnect();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
    for (const t of this.textures) t.dispose();
    this.composer?.dispose();
    this.ao?.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
