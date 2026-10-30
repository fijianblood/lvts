// The House Hunt engine: builds the low-poly house and compound from
// layout.ts, runs the first- or third-person controller against collision.ts
// (with floor heights for slopes and stairs), animates doors, gates, windows,
// collectibles and the family, keeps the clock, and draws the minimap.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  C, ROOMS, WALLS, DOORS, WINDOWS, PROPS, COLLECTIBLES, GOLDEN_SPOTS, SPAWN, EXIT_ZONE, POSTER,
  BARRIERS, TREES, NEIGHBOURS, RAMPS, NPC_SPOTS, CAT_SPOT, BACK_Y, ROAD_Y, GROUND_BREAKS,
  WALL_H, CEIL_H, DOOR_TOP, roomAt, groundY, heightAt,
  type WallRun, type Prim, type Door, type HingedDoor, type WindowSpec, type Room, type XYZ, type Barrier, type NpcSpot,
} from './layout.ts';
import { buildStaticWorld, buildCameraWorld, doorOBB, bodyOBB, moveAndSlide, circleHitsOBB, blocked, type OBB, type StaticWorld } from './collision.ts';
import { CHARACTERS, characterById, firstName, type Character, type CharacterId } from './characters.ts';
import { buildFigure, animate, bakeStatic, cat, type Rig } from './figures.ts';
import type { Say } from './talk.ts';
import { Minimap } from './minimap.ts';
import { Sfx } from './audio.ts';
import * as T from './textures.ts';
import { partModel, goldenChip, ranger, palm, bushTree, banana, breadfruit, van, lambert } from './models.ts';

export type GameState = 'intro' | 'playing' | 'paused' | 'won';

export interface RunResult {
  timeMs: number;
  items: number;
  total: number;
  golden: boolean;
  rooms: number;
  totalRooms: number;
}

export interface PerkPill { text: string; tone: string; title: string }
export interface TalkStart { player: Character; npc: Character; room: string | null; turn: number }
const SENSE = ['🧊 Cold', '🌤️ Warm', '🔥 Hot', '🔥 Very hot!'];

export interface EngineHud {
  timer: HTMLElement;
  prompt: HTMLElement;
  minimap: HTMLCanvasElement;
}

export interface EngineCallbacks {
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
  /** A perk's live readout for the HUD (warmer/colder, the Golden Chip's room), or null. */
  onPerk?: (pill: PerkPill | null) => void;
}

export interface EngineOptions { touch: boolean; baseUrl: string }

const REACH = 1.8;
const PICKUP = 0.85;
const LOOK = 0.0022;
const AREAS = ROOMS.filter((r) => r.area);
const DEFAULT_SIGHT = 5.5;

// ── geometry helpers ────────────────────────────────────────────────────────
type Buckets = Map<string, THREE.BufferGeometry[]>;

function boxGeo(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  const g = new THREE.BoxGeometry(Math.max(1e-3, x1 - x0), Math.max(1e-3, y1 - y0), Math.max(1e-3, z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

function push(b: Buckets, key: string, g: THREE.BufferGeometry) {
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
  const xs: number[] = [], zs = new Set<number>(GROUND_BREAKS);
  for (let x = -45; x <= 55; x += 5) xs.push(x);
  for (let z = -45; z <= 55; z += 2.5) zs.add(z);
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
 * of one per part). Only Lambert meshes are baked; anything else stays as is.
 */
function bake(group: THREE.Object3D, buckets: Buckets, scene: THREE.Scene) {
  group.updateMatrixWorld(true);
  const keep: THREE.Object3D[] = [];
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const mat = m.material as THREE.MeshLambertMaterial;
    if (!(mat instanceof THREE.MeshLambertMaterial) || mat.transparent || mat.map) { keep.push(m); return; }
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld);
    const key = `#${mat.color.getHexString(THREE.SRGBColorSpace)}${mat.emissive.getHex() ? `|e${mat.emissive.getHexString(THREE.SRGBColorSpace)}` : ''}`;
    push(buckets, key, g);
  });
  for (const k of keep) { k.updateMatrixWorld(true); const c = k.clone(); c.matrix.copy(k.matrixWorld); c.matrixAutoUpdate = false; scene.add(c); }
}

interface DoorRig { door: Door; pivot: THREE.Object3D; open: number; target: number }
interface WindowRig { spec: WindowSpec; sashes: { pivot: THREE.Object3D; dir: number }[]; open: number; target: number }
interface Item {
  id: string; name: string; pos: XYZ; group: THREE.Group; ring: THREE.Mesh; spin?: THREE.Object3D;
  golden: boolean; taken: boolean; seen: boolean; phase: number; base: number;
}
interface Burst { mesh: THREE.InstancedMesh; vel: THREE.Vector3[]; t: number }
type FocusKind = 'door' | 'window' | 'poster' | 'npc' | 'cat';

export class HouseEngine {
  state: GameState = 'intro';
  private opts: EngineOptions;
  private hud: EngineHud;
  private cb: EngineCallbacks;
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private world = buildStaticWorld();
  private worldCrawl = buildStaticWorld({ crawl: true });
  private worldCam = buildCameraWorld();
  private char: Character = characterById('josese');
  private floorY = 0;
  private third = false;
  private player?: Rig;
  private npcs: { id: CharacterId; rig: Rig; spot: NpcSpot; obb?: OBB; baseQuat: THREE.Quaternion }[] = [];
  private kitty?: THREE.Group;
  private doors: DoorRig[] = [];
  private windows: WindowRig[] = [];
  private items: Item[] = [];
  private bursts: Burst[] = [];
  private minimap: Minimap;
  readonly sfx = new Sfx();
  private fanHead?: THREE.Object3D;
  private clock?: { tex: THREE.CanvasTexture; redraw: () => void };
  private textures: THREE.Texture[] = [];

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

  constructor(container: HTMLElement, hud: EngineHud, cb: EngineCallbacks, opts: EngineOptions) {
    this.container = container;
    this.hud = hud;
    this.cb = cb;
    this.opts = opts;
    this.renderer = new THREE.WebGLRenderer({ antialias: !opts.touch, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.touch ? 1.25 : 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.touchAction = 'none';
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(opts.touch ? 76 : 72, 1, 0.05, 160);
    this.camera.rotation.order = 'YXZ';

    const sky = new THREE.Color('#cfe9f7');
    this.scene.background = sky;
    this.scene.fog = new THREE.Fog(sky, 28, 95);
    this.scene.add(new THREE.HemisphereLight('#ffffff', '#cfc6b8', 2.0));
    const sun = new THREE.DirectionalLight('#fff3dc', 1.25);
    sun.position.set(-6, 12, 8);
    this.scene.add(sun);
    this.scene.add(new THREE.AmbientLight('#ffffff', 0.5));

    this.buildHouse();
    this.buildCompound();
    this.buildItems();
    this.minimap = new Minimap(hud.minimap);   // before the family: picking a character sets up the map
    this.buildFamily();
    this.reset();

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
      else list.push(worldPlane(room.x0, room.z0, room.x1, room.z1, 0.002, kind.tile));
      floors.set(room.floor, list);
      if (room.ceiling) ceilings.push(worldPlane(room.x0, room.z0, room.x1, room.z1, CEIL_H, 1.2, true));
    }
    for (const [kind, list] of floors) {
      const mesh = new THREE.Mesh(mergeGeometries(list), new THREE.MeshLambertMaterial({ map: floorTex[kind].tex }));
      this.scene.add(mesh);
    }
    const ceilMat = new THREE.MeshLambertMaterial({ map: this.tex(T.ceiling()), color: '#ffffff' });
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
    if (tileSkins.length) this.scene.add(new THREE.Mesh(mergeGeometries(tileSkins), new THREE.MeshLambertMaterial({ map: this.tex(T.bathTile()) })));
    if (mosaicBand.length) this.scene.add(new THREE.Mesh(mergeGeometries(mosaicBand), new THREE.MeshLambertMaterial({ map: this.tex(T.mosaic()) })));

    // furniture
    const glow: THREE.BufferGeometry[] = [];
    for (const prim of PROPS) this.addPrim(prim, solid, glow);
    if (glow.length) this.scene.add(new THREE.Mesh(mergeGeometries(glow), new THREE.MeshBasicMaterial({ color: '#fffdf5' })));

    // the bedroom-3 fan head, animated
    const fan = new THREE.Group();
    fan.position.set(7.9, 1.15, -2.45);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.12, 10), lambert(C.black));
    hub.rotation.x = Math.PI / 2;
    fan.add(hub);
    const cage = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.012, 4, 20), lambert('#6b7076'));
    cage.position.z = 0.08;
    fan.add(cage);
    const blades = new THREE.Group();
    blades.position.z = 0.08;
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.07, 0.01), lambert('#9aa0a6'));
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
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1, 2.1, 4, 1), lambert(C.roof));
    roof.rotation.y = Math.PI / 4;
    roof.scale.set(6.2 / Math.SQRT1_2, 1, 10.9 / Math.SQRT1_2);
    roof.position.set(5.5, WALL_H + 1.05, 2.7);
    this.scene.add(roof);
    const eave = new THREE.Mesh(boxGeo(-0.15, WALL_H, 13, 12.5, WALL_H + 0.12, 15.6), lambert(C.roof));
    this.scene.add(eave);
  }

  /** Merge each colour bucket into one mesh. */
  private flush(buckets: Buckets) {
    for (const [key, list] of buckets) {
      if (key === 'transparent' || !list.length) continue;
      const [color, em] = key.split('|e');
      this.scene.add(new THREE.Mesh(mergeGeometries(list), lambert(color, { emissive: em ? `#${em}` : undefined })));
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
      if (prim.tex) { this.addTexturedBox(prim); return; }
      if (prim.emissive) { glow.push(boxGeo(x0, y0, z0, x1, y1, z1)); return; }
      push(solid, prim.color, boxGeo(x0, y0, z0, x1, y1, z1));
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
        ? new THREE.MeshLambertMaterial({ color: prim.color, transparent: true, opacity: prim.opacity, side: THREE.DoubleSide, depthWrite: false })
        : lambert(prim.color),
    );
    cone.position.set(prim.base[0], prim.base[1] + prim.h / 2, prim.base[2]);
    this.scene.add(cone);
  }

  private addTexturedBox(prim: Extract<Prim, { kind: 'box' }>) {
    const [x0, y0, z0] = prim.min, [x1, y1, z1] = prim.max;
    const [name, face] = (prim.tex ?? '').split(':');
    let tex: THREE.Texture;
    if (name === 'tv') {
      tex = this.tex(new THREE.TextureLoader().load(`${this.opts.baseUrl}logo.jpg`));
      tex.colorSpace = THREE.SRGBColorSpace;
    } else if (name === 'rug') tex = this.tex(T.rug());
    else if (name === 'welcome') tex = this.tex(T.welcomeSign());
    else if (name === 'exit') tex = this.tex(T.exitSign());
    else if (name === 'clock') { this.clock = T.clockFace(); tex = this.tex(this.clock.tex); }
    else tex = this.tex(T.ceiling());
    const box = new THREE.Mesh(boxGeo(x0, y0, z0, x1, y1, z1), prim.emissive ? new THREE.MeshBasicMaterial({ color: prim.color }) : lambert(prim.color));
    this.scene.add(box);
    const w = face.endsWith('x') ? z1 - z0 : x1 - x0;
    const h = face.endsWith('y') ? z1 - z0 : y1 - y0;
    const inset = name === 'tv' ? 0.92 : 1;
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(w * inset, h * (name === 'tv' ? 0.9 : 1)),
      name === 'tv' || prim.emissive ? new THREE.MeshBasicMaterial({ map: tex }) : new THREE.MeshLambertMaterial({ map: tex }),
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
    const glassMat = new THREE.MeshLambertMaterial({ color: C.glass, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide });
    const sashMat = lambert(C.trim);
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
        const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: spec.curtain === 'sheer', opacity: spec.curtain === 'sheer' ? 0.75 : 1, side: THREE.DoubleSide });
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
    const handle = lambert('#c9cdd1');
    for (const door of DOORS) {
      if (door.kind === 'slide') {
        const alu = '#c9ccce';
        const z = door.line;
        push(solid, alu, boxGeo(door.from, 0, z - 0.09, door.to, 0.04, z + 0.09));
        push(solid, alu, boxGeo(door.from, 2.06, z - 0.09, door.to, 2.1, z + 0.09));
        push(solid, alu, boxGeo(door.from, 0, z - 0.09, door.from + 0.04, 2.1, z + 0.09));
        push(solid, alu, boxGeo(door.to - 0.04, 0, z - 0.09, door.to, 2.1, z + 0.09));
        const mid = (door.from + door.to) / 2;
        const glass = new THREE.MeshLambertMaterial({ color: C.glass, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
        // fixed half
        push(solid, alu, boxGeo(mid - 0.04, 0, z + 0.01, mid, 2.06, z + 0.05));
        const fixed = new THREE.Mesh(boxGeo(door.from, 0.04, z + 0.025, mid, 2.06, z + 0.035), glass);
        this.scene.add(fixed);
        // sliding half
        const pivot = new THREE.Group();
        const hw = (door.to - door.from) / 4;
        const panel = new THREE.Group();
        const frame = lambert(alu);
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
        pivot.add(new THREE.Mesh(gateGeo(door.width, top, door.style), lambert(door.color)));
      } else {
        pivot.add(new THREE.Mesh(boxGeo(0.02, 0.01, -0.02, door.width - 0.02, top - 0.02, 0.02), lambert(door.color)));
        const knobs = [-1, 1].map((side) => new THREE.SphereGeometry(0.03, 8, 6).translate(door.width - 0.09, 1.0, side * 0.045));
        pivot.add(new THREE.Mesh(mergeGeometries(knobs), handle));
        // a recessed panel on each face, for a bit of detail
        const insets = [-1, 1].map((side) => boxGeo(0.12, 0.25, side * 0.021 - 0.002, door.width - 0.12, top - 0.3, side * 0.021 + 0.002));
        const panelColor = door.color === C.doorWood ? '#a65726' : door.color === '#e9e6de' ? '#d9d5cb' : '#7a3f1f';
        pivot.add(new THREE.Mesh(mergeGeometries(insets), lambert(panelColor)));
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
    this.scene.add(new THREE.Mesh(terrain(), new THREE.MeshLambertMaterial({ map: this.tex(T.grass()) })));
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
      const n = Math.max(2, Math.round(Math.abs(r.y1 - r.y0) / 0.17));
      for (let k = 0; k < n; k++) {
        const za = r.z0 + ((r.z1 - r.z0) * k) / n, zb = r.z0 + ((r.z1 - r.z0) * (k + 1)) / n;
        const z0 = Math.min(za, zb), z1 = Math.max(za, zb);
        const top = r.y0 + ((r.y1 - r.y0) * (k + 0.5)) / n;
        push(out, r.style === 'tile' ? C.stepTile : C.concrete, boxGeo(r.x0, Math.min(deep(z0, z1), top - 0.4), z0, r.x1, top, z1));
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
      const mat = new THREE.MeshLambertMaterial({ map: this.tex(T.chainLink()), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
      this.scene.add(new THREE.Mesh(mergeGeometries(chain), mat));
    }

    // carport: timber beams under a corrugated roof; the Ranger
    for (const z of [-6.2, -3.6, -1.0, 1.6]) push(out, '#5b4532', boxGeo(11.1, BACK_Y + 2.38, z - 0.06, 15.6, BACK_Y + 2.52, z + 0.06));
    const roofTex = this.tex(T.corrugated());
    roofTex.repeat.set(30, 1);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 10.2), new THREE.MeshLambertMaterial({ map: roofTex, side: THREE.DoubleSide }));
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

    // the neighbours, the road, a van parked across it
    for (const n of NEIGHBOURS) {
      const gy = groundY((n.z0 + n.z1) / 2);
      push(out, n.wall, boxGeo(n.x0, gy - 1.6, n.z0, n.x1, gy + n.h, n.z1));
      const roofG = new THREE.ConeGeometry(1, 1.8, 4, 1);
      roofG.rotateY(Math.PI / 4);
      roofG.scale((n.x1 - n.x0) / 2 / Math.SQRT1_2 + 0.3, 1, (n.z1 - n.z0) / 2 / Math.SQRT1_2 + 0.3);
      roofG.translate((n.x0 + n.x1) / 2, gy + n.h + 0.9, (n.z0 + n.z1) / 2);
      push(out, n.roof, roofG);
    }
    push(out, C.concrete, boxGeo(-30, ROAD_Y - 0.3, 29, 40, ROAD_Y + 0.14, 31));
    for (let x = -28; x < 40; x += 3) push(out, '#f1f1ec', boxGeo(x, ROAD_Y + 0.006, 25.7, x + 1.5, ROAD_Y + 0.012, 25.8));
    const v = van();
    v.position.set(5.5, ROAD_Y, 27.4);
    bake(v, out, this.scene);

    this.flush(out);
  }

  /** Draw one wall, railing or fence, sitting on whatever floor is on each side of it. */
  private addBarrier(b: Barrier, out: Buckets, chain: THREE.BufferGeometry[]) {
    if (b.kind === 'invisible') return;
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
      this.npcs.push({ id: c.id, rig, spot, obb: spot.collide ? bodyOBB(spot.pos[0], spot.pos[2]) : undefined, baseQuat: rig.head.quaternion.clone() });
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
    this.perkKey = undefined;
    this.minimap.exitKnown = !!this.char.knowsWay;
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

  toggleView(): boolean {
    this.third = !this.third;
    if (this.player) this.player.root.visible = this.third;
    this.cb.onView?.(this.third);
    return this.third;
  }

  private get solid(): StaticWorld { return this.char.crawl ? this.worldCrawl : this.world; }

  /** Door panels plus anyone standing in the way. */
  private obstacles(): OBB[] {
    const list = this.doorPanels();
    for (const n of this.npcs) if (n.obb && n.rig.root.visible) list.push(n.obb);
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
    this.pos = [SPAWN.pos[0], SPAWN.pos[2]];
    this.floorY = heightAt(this.pos[0], this.pos[1]);
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
    }
    for (const d of this.doors) { d.open = 0; d.target = 0; }
    for (const w of this.windows) { w.open = 0; w.target = 0; }
    this.applyDoors();
    this.applyWindows();
    this.minimap.reset();
    if (this.minimap.expanded) { this.minimap.expanded = false; this.cb.onMap?.(false); }
    this.hud.timer.textContent = '00:00.0';
    this.setPrompt('');
    this.cb.onRooms?.(0, AREAS.length);
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
      this.cb.onTalk?.({ player: this.char, npc: characterById(n.id), room, turn: this.talkTurn++ });
      this.sfx.pickup();
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
    if (this.state !== 'playing') return;
    const code = e.code;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight', 'Space'].includes(code)) e.preventDefault();
    if (code === 'KeyE' || code === 'Enter' || code === 'KeyF') { e.preventDefault(); if (!e.repeat) this.interact(); return; }
    if (code === 'KeyM' && !e.repeat) { this.toggleMap(); return; }
    if (code === 'KeyV' && !e.repeat) { this.toggleView(); return; }
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
    if (this.lockWasHeld && !held && this.state === 'playing') this.pause('lock-lost');
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
    for (const d of this.doors) {
      if (d.open === d.target) continue;
      const dir = Math.sign(d.target - d.open);
      const next = Math.max(0, Math.min(1, d.open + dir * dt * (d.door.kind === 'slide' ? 1.6 : 2.0)));
      const blockedNow = circleHitsOBB(me, r, doorOBB(d.door, d.open));
      const blockedNext = circleHitsOBB(me, r, doorOBB(d.door, next));
      if (blockedNext && !blockedNow) continue;
      d.open = next;
    }
    this.applyDoors();
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
        this.pos = moveAndSlide(this.pos, this.vel[0] * dt, this.vel[1] * dt, r, this.solid, this.obstacles());
      }
      const sp = Math.hypot(this.vel[0], this.vel[1]);
      this.bob += sp * dt * 2.4;
      if (this.started) this.elapsed += dt;

      const room = roomAt(this.pos[0], this.pos[1]);
      if (room?.area && !this.visited.has(room.id)) {
        this.visited.add(room.id);
        this.cb.onRooms?.(this.visited.size, AREAS.length);
      }

      this.checkPickups();
      this.updateFocus();

      if (this.pos[0] >= EXIT_ZONE.x0 && this.pos[0] <= EXIT_ZONE.x1 && this.pos[1] >= EXIT_ZONE.z0 && this.pos[1] <= EXIT_ZONE.z1) this.win();
    }

    // the floor under you: ease toward it so stairs and slopes feel smooth
    const floor = heightAt(this.pos[0], this.pos[1]);
    this.floorY = Math.abs(floor - this.floorY) > 1.2 ? floor : this.floorY + (floor - this.floorY) * (1 - Math.exp(-dt * 16));

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
    const consider = (kind: FocusKind, index: number, x: number, z: number, maxDist = REACH) => {
      const dx = x - this.pos[0], dz = z - this.pos[1];
      const dist = Math.hypot(dx, dz);
      if (dist > maxDist || dist < 0.05) return;
      const facing = (dx * fx + dz * fz) / dist;
      if (facing < 0.55) return;
      const score = dist - facing;
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
    const b = best as { kind: FocusKind; index: number; score: number } | null;
    this.focus = b ? { kind: b.kind, index: b.index } : null;
    const key = this.opts.touch ? 'Tap ✋' : 'E';
    let text = '';
    if (b?.kind === 'door') { const d = this.doors[b.index]; text = `${key} · ${d.target > 0.5 ? 'Close' : 'Open'} the ${d.door.label}`; }
    if (b?.kind === 'window') { const w = this.windows[b.index]; text = `${key} · ${w.target > 0.5 ? 'Close' : 'Open'} the window`; }
    if (b?.kind === 'poster') text = `${key} · Read the poster: how a database index works`;
    if (b?.kind === 'npc') text = this.talkingTo === b.index ? `${key} · Say goodbye` : `${key} · Talk to ${firstName(characterById(this.npcs[b.index].id))}`;
    if (b?.kind === 'cat') text = `${key} · Pet the cat`;
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
    this.cb.onWin({ timeMs: Math.round(this.elapsed * 1000), items: this.collected, total: COLLECTIBLES.length, golden: this.golden, rooms: this.visited.size, totalRooms: AREAS.length });
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
      animate(this.player, this.bob * (this.char.crawl ? 2.2 : 1.6), moving);
    }
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
    this.renderer.render(this.scene, this.camera);
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
      if (blocked([x, z], 0.14, this.worldCam, panels)) break;
      if (y < heightAt(x, z) + 0.15) break;
      const room = roomAt(x, z);
      if (room?.ceiling && y > CEIL_H - 0.12) break;
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
    this.kick();
  }

  /** For the dev-only debug hook in HouseGame. */
  debug() {
    return {
      teleport: (x: number, z: number, yaw?: number) => { this.pos = [x, z]; this.floorY = heightAt(x, z); if (yaw !== undefined) this.yaw = yaw; },
      character: (id: string) => this.setCharacter(id),
      view: () => this.toggleView(),
      floor: () => this.floorY,
      openAll: () => { for (const d of this.doors) { d.open = 1; d.target = 1; } this.applyDoors(); },
      state: () => ({ pos: this.pos, yaw: this.yaw, pitch: this.pitch, state: this.state, items: this.collected, golden: this.golden, goldenSpot: this.goldenIndex, goldenPos: GOLDEN_SPOTS[this.goldenIndex].pos, elapsed: this.elapsed, focus: this.focus, prompt: this.promptText, doors: this.doors.map((d) => [d.door.id, d.open]) }),
      setLook: (yaw: number, pitch: number) => { this.yaw = yaw; this.pitch = pitch; },
      press: (code: string, down: boolean) => { if (down) this.keys.add(code); else this.keys.delete(code); },
      perf: () => this.perf,
    };
  }

  dispose() {
    this.disposed = true;
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
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
