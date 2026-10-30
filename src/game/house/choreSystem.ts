// Chores in the 3D house: the messes you clean up, the tools you carry, the
// timed work, the stars, and the locks on the places stars unlock.
// The rules and data live in chores.ts; this is the part with three.js.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lambert } from './models.ts';
import { canvasTexture } from './textures.ts';
import { heightAt } from './layout.ts';
import type { OBB } from './collision.ts';
import {
  STEPS, TOOLS, PLACES, ITEMS, ALL_DONE_BONUS, availableChores, unlockedAt, lockOBB, loadProgress, saveProgress,
  type Chore, type Item, type Place, type PlaceId,
} from './chores.ts';

export interface ChoreSnapshot {
  stars: number;
  runStars: number;
  held: Item | null;
  /** Step ids done this game. */
  done: string[];
  unlocked: PlaceId[];
  baby: boolean;
}
export interface Work { label: string; emoji: string; progress: number }
export interface ChoreCallbacks {
  onChores?: (s: ChoreSnapshot) => void;
  onWork?: (w: Work | null) => void;
  onChoreDone?: (d: { chore: Chore; stars: number; bonus: number; total: number }) => void;
  onUnlock?: (p: Place) => void;
  onHint?: (text: string) => void;
}
export type ChoreFocus = 'chore' | 'tool' | 'lock';

const B = (x: number, z: number) => heightAt(x, z);

function mesh(geo: THREE.BufferGeometry, color: string, x: number, y: number, z: number, opts: { opacity?: number; ry?: number; rx?: number; rz?: number } = {}) {
  const mat = opts.opacity !== undefined
    ? new THREE.MeshLambertMaterial({ color, transparent: true, opacity: opts.opacity, depthWrite: false })
    : lambert(color);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.rotation.set(opts.rx ?? 0, opts.ry ?? 0, opts.rz ?? 0);
  return m;
}
const box = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
const cyl = (r: number, h: number, seg = 10) => new THREE.CylinderGeometry(r, r, h, seg);

/** A floating label that always faces you ("LOCKED · 6 ★", "Zzz"). */
function label(lines: string[], color = '#0f172a', bg = 'rgba(255,255,255,0.92)'): THREE.Sprite {
  const tex = canvasTexture(256, 128, (g, w, h) => {
    g.fillStyle = bg;
    g.beginPath(); g.roundRect(6, 6, w - 12, h - 12, 22); g.fill();
    g.fillStyle = color;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    lines.forEach((t, i) => { g.font = `${i === 0 ? 800 : 700} ${i === 0 ? 40 : 34}px sans-serif`; g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * 42); });
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  s.scale.set(0.7, 0.35, 1);
  return s;
}

/** What each step looks like before (the mess) and after (put right). */
function looks(id: string): { mess?: THREE.Object3D; after?: THREE.Object3D } {
  const g = () => new THREE.Group();
  const mess = g(), after = g();
  switch (id) {
    case 'dishes':
      for (let i = 0; i < 4; i++) mess.add(mesh(cyl(0.11, 0.02, 14), '#f3efe6', 0.42, 0.93 + i * 0.025, 5.95));
      mess.add(mesh(box(0.05, 0.005, 0.04), '#8b5a2b', 0.4, 1.04, 5.93), mesh(box(0.04, 0.005, 0.05), '#a16207', 0.46, 1.04, 5.99));
      mess.add(mesh(cyl(0.04, 0.08, 10), '#e5e7eb', 0.3, 0.95, 6.1), mesh(cyl(0.04, 0.08, 10), '#fca5a5', 0.55, 0.95, 5.8));
      after.add(mesh(box(0.34, 0.03, 0.26), '#9ca3af', 0.42, 0.915, 7.1));
      for (let i = 0; i < 4; i++) after.add(mesh(box(0.012, 0.2, 0.2), '#ffffff', 0.32 + i * 0.065, 1.02, 7.1));
      break;
    case 'laundry-get':
      ['#ef4444', '#3b82f6', '#fbbf24', '#f8fafc'].forEach((c, i) => mess.add(mesh(box(0.22, 0.06, 0.18), c, 7.95 + (i % 2 ? 0.05 : -0.05), 0.45 + i * 0.05, 2.05 + (i - 1.5) * 0.03, { ry: i * 0.7 })));
      break;
    case 'laundry-wash':
      after.add(mesh(cyl(0.16, 0.01, 18), '#60a5fa', 0.81, 0.45, -6.08, { rz: Math.PI / 2, opacity: 0.8 }));
      break;
    case 'laundry-hang':
      ['#ef4444', '#3b82f6', '#fbbf24', '#f8fafc', '#a855f7'].forEach((c, i) => after.add(mesh(box(0.34, 0.45, 0.01), c, 7.1 + i * 0.42, B(7, -13.55) + 1.6, -13.55)));
      break;
    case 'babysit': {
      const z = label(['Zzz'], '#4338ca', 'rgba(255,255,255,0)');
      z.position.set(7.8, 1.05, 6.1);
      after.add(z);
      break;
    }
    case 'rubbish-tie':
      mess.add(mesh(new THREE.IcosahedronGeometry(0.16, 0), '#111827', 0.42, 0.6, 7.95), mesh(box(0.08, 0.02, 0.06), '#fde68a', 0.5, 0.56, 8.05), mesh(box(0.06, 0.02, 0.08), '#86efac', 0.33, 0.55, 7.88));
      break;
    case 'cat-bowl':
      for (let i = 0; i < 6; i++) after.add(mesh(box(0.03, 0.02, 0.03), '#92400e', 5.95 + Math.cos(i) * 0.07, B(5.95, -9.25) + 0.11, -9.25 + Math.sin(i) * 0.07));
      break;
    case 'shoes':
      [[1.55, 13.35, 0.4, '#1f2937'], [1.75, 13.6, 1.4, '#f97316'], [2.0, 13.4, 2.2, '#2563eb'], [1.9, 13.75, 0.9, '#f8fafc']].forEach(([x, z, r, c]) => mess.add(mesh(box(0.11, 0.07, 0.26), c as string, x as number, 0.035, z as number, { ry: r as number })));
      break;
  }
  if (id.startsWith('sweep-')) {
    const s = STEPS.find((x) => x.step.id === id)!.step.pos;
    mess.add(mesh(new THREE.ConeGeometry(0.22, 0.07, 9), '#8a7559', s[0], s[1] + 0.01, s[2]));
    for (let i = 0; i < 5; i++) mess.add(mesh(box(0.03, 0.01, 0.03), '#6b5b45', s[0] + Math.cos(i * 2) * 0.35, s[1] - 0.025, s[2] + Math.sin(i * 2) * 0.3));
  }
  if (id.startsWith('mop-')) {
    const s = STEPS.find((x) => x.step.id === id)!.step.pos;
    mess.add(mesh(cyl(0.34, 0.004, 18), '#a16207', s[0], s[1] - 0.012, s[2], { opacity: 0.45 }));
    mess.add(mesh(cyl(0.16, 0.005, 12), '#a16207', s[0] + 0.3, s[1] - 0.011, s[2] + 0.15, { opacity: 0.4 }));
  }
  if (id.startsWith('dust-')) {
    const s = STEPS.find((x) => x.step.id === id)!.step.pos;
    mess.add(mesh(box(0.34, 0.008, 0.26), '#9ca3af', s[0], s[1] - 0.01, s[2], { opacity: 0.75 }));
    for (let i = 0; i < 4; i++) mess.add(mesh(new THREE.OctahedronGeometry(0.015, 0), '#d1d5db', s[0] + (i - 1.5) * 0.08, s[1] + 0.06 + (i % 2) * 0.05, s[2]));
  }
  if (id.startsWith('win-')) {
    const s = STEPS.find((x) => x.step.id === id)!.step.pos;
    const alongX = id === 'win-dine-s';
    mess.add(mesh(box(alongX ? 0.9 : 0.004, 0.55, alongX ? 0.004 : 0.9), '#78716c', s[0], s[1], s[2], { opacity: 0.38 }));
    mess.add(mesh(box(alongX ? 0.35 : 0.005, 0.25, alongX ? 0.005 : 0.35), '#57534e', s[0] + (alongX ? 0.2 : 0), s[1] + 0.15, s[2] + (alongX ? 0 : 0.2), { opacity: 0.35 }));
  }
  if (id.startsWith('plant-') || id.startsWith('garden-')) {
    const s = STEPS.find((x) => x.step.id === id)!.step.pos;
    const wide = id.startsWith('garden-');
    after.add(mesh(wide ? box(3.05, 0.012, 0.5) : cyl(0.2, 0.012, 10), '#3b2414', wide ? 13.75 : s[0], (wide ? B(13, -12) + 0.15 : s[1] - 0.1), s[2], { opacity: 0.85 }));
    for (let i = 0; i < 3; i++) after.add(mesh(new THREE.OctahedronGeometry(0.02, 0), '#60a5fa', s[0] + (i - 1) * 0.12, s[1] + 0.12, s[2]));
  }
  return { mess: mess.children.length ? mess : undefined, after: after.children.length ? after : undefined };
}

const painted = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

/** Merge a group's solid boxes into one vertex-coloured mesh (one draw call); see-through and label parts stay as they are. */
function bake(group: THREE.Group | undefined): THREE.Group | undefined {
  if (!group) return group;
  const parts: THREE.BufferGeometry[] = [];
  const keep: THREE.Object3D[] = [];
  group.updateMatrixWorld(true);
  for (const c of group.children) {
    const m = c as THREE.Mesh;
    const mat = m.material as THREE.Material | undefined;
    if (!m.isMesh || !(mat instanceof THREE.MeshLambertMaterial) || mat.transparent) { keep.push(c); continue; }
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    const n = g.getAttribute('position').count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = mat.color.r; col[i * 3 + 1] = mat.color.g; col[i * 3 + 2] = mat.color.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
    parts.push(g);
  }
  const out = new THREE.Group();
  if (parts.length) out.add(new THREE.Mesh(mergeGeometries(parts), painted));
  for (const k of keep) out.add(k);
  return out;
}

/** The tools on their rack (and the watering can by the tubs). */
function toolModel(id: Item): THREE.Group {
  const g = new THREE.Group();
  if (id === 'broom') {
    g.add(mesh(cyl(0.018, 1.25, 6), '#a16207', 0, 0.75, 0, { rx: 0.12 }));
    g.add(mesh(box(0.3, 0.12, 0.06), '#facc15', 0, 0.08, -0.07));
  } else if (id === 'mop') {
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.28, 12), '#2563eb', 0, 0.14, 0));
    g.add(mesh(cyl(0.016, 1.2, 6), '#9ca3af', 0.06, 0.75, 0, { rz: -0.1 }));
    g.add(mesh(box(0.14, 0.1, 0.14), '#e5e7eb', 0.0, 0.3, 0));
  } else if (id === 'cloth') {
    g.add(mesh(box(0.2, 0.22, 0.02), '#facc15', 0, 0.11, 0));
  } else if (id === 'can') {
    g.add(mesh(box(0.28, 0.22, 0.16), '#16a34a', 0, 0.11, 0));
    g.add(mesh(cyl(0.02, 0.3, 6), '#15803d', 0.2, 0.22, 0, { rz: -0.9 }));
    g.add(mesh(box(0.04, 0.12, 0.04), '#15803d', -0.12, 0.28, 0));
  }
  return g;
}

export class ChoreSystem {
  private cb: ChoreCallbacks;
  private stars = loadProgress().stars;
  private runStars = 0;
  private bonusGiven = false;
  private baby = false;
  held: Item | null = null;
  private done = new Set<string>();
  private work: { i: number; t: number; sent: number } | null = null;
  private steps: { mess?: THREE.Object3D; after?: THREE.Object3D; marker: THREE.Group }[] = [];
  private tools = new Map<Item, THREE.Group>();
  private gates = new Map<PlaceId, THREE.Group>();
  private time = 0;

  constructor(scene: THREE.Scene, cb: ChoreCallbacks) {
    this.cb = cb;
    const ringGeo = new THREE.RingGeometry(0.18, 0.25, 24).rotateX(-Math.PI / 2);
    for (const { step } of STEPS) {
      const raw = looks(step.id);
      const mess = bake(raw.mess as THREE.Group | undefined), after = bake(raw.after as THREE.Group | undefined);
      if (mess) scene.add(mess);
      if (after) { after.visible = false; scene.add(after); }
      const marker = new THREE.Group();
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.55, depthWrite: false }));
      // a ring on the floor for messes on the floor; a gem alone for things up on a counter or a wall
      const floor = heightAt(step.pos[0], step.pos[2]);
      ring.position.y = floor - step.pos[1] + 0.015;
      ring.visible = step.pos[1] - floor < 0.3;
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.06, 0), new THREE.MeshBasicMaterial({ color: '#4ade80' }));
      gem.position.y = 0.32;
      marker.add(ring, gem);
      marker.position.set(step.pos[0], step.pos[1], step.pos[2]);
      marker.userData.gem = gem;
      scene.add(marker);
      this.steps.push({ mess, after, marker });
    }
    for (const t of TOOLS) {
      const m = bake(toolModel(t.id))!;
      m.position.set(t.pos[0], t.pos[1], t.pos[2]);
      scene.add(m);
      this.tools.set(t.id, m);
    }
    for (const p of PLACES) {
      const g = new THREE.Group();
      const [ax, az] = p.lock.a, [bx, bz] = p.lock.b;
      const cx = (ax + bx) / 2, cz = (az + bz) / 2, y = heightAt(cx, cz);
      const along = ax === bx;
      const len = Math.hypot(bx - ax, bz - az);
      const color = p.id === 'garden' ? '#f4f1ea' : p.id === 'bure' ? '#8f6a3c' : '#a0703f';
      g.add(mesh(box(along ? 0.05 : len, 0.95, along ? len : 0.05), color, cx, y + 0.5, cz));
      g.add(mesh(box(along ? 0.07 : 0.12, 0.14, along ? 0.12 : 0.07), '#eab308', cx, y + 0.62, cz));   // padlock
      const sign = label(['LOCKED', `${p.stars} ★ to open`], '#7c2d12', 'rgba(254,243,199,0.95)');
      sign.position.set(cx, y + 1.35, cz);
      g.add(sign);
      scene.add(g);
      this.gates.set(p.id, g);
    }
    this.reset(false);
  }

  get unlocked(): PlaceId[] { return unlockedAt(this.stars); }

  /** A new game: the mess comes back. */
  reset(baby: boolean) {
    this.baby = baby;
    this.done.clear();
    this.held = null;
    this.runStars = 0;
    this.bonusGiven = false;
    if (this.work) { this.work = null; this.cb.onWork?.(null); }
    this.steps.forEach((s) => { if (s.mess) s.mess.visible = true; if (s.after) s.after.visible = false; });
    for (const m of this.tools.values()) m.visible = true;
    for (const [id, g] of this.gates) g.visible = !this.unlocked.includes(id);
    this.refreshMarkers();
    this.emit();
  }

  /** Who's playing changed (between games). */
  setBaby(baby: boolean) { if (baby !== this.baby) this.reset(baby); }

  stopWork() { if (this.work) { this.work = null; this.cb.onWork?.(null); } }

  private available(i: number): boolean {
    const { chore, step, index } = STEPS[i];
    if (this.baby || this.done.has(step.id)) return false;
    if (chore.place && !this.unlocked.includes(chore.place)) return false;
    if (chore.ordered && index > 0 && !this.done.has(chore.steps[index - 1].id)) return false;
    return true;
  }

  private open: boolean[] = [];
  private refreshMarkers() { this.open = STEPS.map((_, i) => this.available(i)); }

  /** Locked places' gates, for collision. */
  obstacles(): OBB[] { return PLACES.filter((p) => !this.unlocked.includes(p.id)).map(lockOBB); }

  /** Offer everything you could act on to the engine's focus picker. */
  candidates(consider: (kind: ChoreFocus, index: number, x: number, z: number, range: number, bonus: number) => void) {
    STEPS.forEach(({ step }, i) => {
      if (!this.available(i)) return;
      const ready = !step.needs || this.held === step.needs;
      consider('chore', i, step.pos[0], step.pos[2], 1.6, ready ? 0.35 : 0);
    });
    if (!this.baby) TOOLS.forEach((t, i) => { if (this.held !== t.id) consider('tool', i, t.pos[0], t.pos[2], 1.4, 0.2); });
    PLACES.forEach((p, i) => {
      if (this.unlocked.includes(p.id)) return;
      consider('lock', i, (p.lock.a[0] + p.lock.b[0]) / 2, (p.lock.a[1] + p.lock.b[1]) / 2, 2.2, 0);
    });
  }

  prompt(kind: ChoreFocus, index: number, key: string): string {
    if (kind === 'chore') {
      const { step } = STEPS[index];
      if (this.work?.i === index) return '';      // the progress bar says it
      if (step.needs && this.held !== step.needs) return `${key} · ${step.label} (you need the ${ITEMS[step.needs].name})`;
      return `${key} · ${step.label}`;
    }
    if (kind === 'tool') {
      const t = TOOLS[index];
      if (this.held && !ITEMS[this.held].tool) return `Your hands are full (${ITEMS[this.held].name})`;
      return `${key} · ${this.held ? `Swap the ${ITEMS[this.held].name} for the` : 'Pick up the'} ${ITEMS[t.id].name}`;
    }
    const p = PLACES[index];
    return `🔒 ${p.name} · ${p.stars} ★ to unlock (you have ${this.stars})`;
  }

  interact(kind: ChoreFocus, index: number) {
    if (kind === 'chore') {
      const { step } = STEPS[index];
      if (this.work) return;
      if (step.needs && this.held !== step.needs) {
        const tool = TOOLS.find((t) => t.id === step.needs);
        this.cb.onHint?.(`You need the ${ITEMS[step.needs].emoji} ${ITEMS[step.needs].name}${tool ? `: it's ${tool.where}` : ''}.`);
        return;
      }
      this.work = { i: index, t: 0, sent: -1 };
      this.cb.onWork?.({ label: step.label, emoji: STEPS[index].chore.emoji, progress: 0 });
      return;
    }
    if (kind === 'tool') {
      const t = TOOLS[index];
      if (this.held && !ITEMS[this.held].tool) { this.cb.onHint?.(`Your hands are full: finish with the ${ITEMS[this.held].name} first.`); return; }
      if (this.held) this.tools.get(this.held)!.visible = true;      // the old tool goes back on the rack
      this.held = t.id;
      this.tools.get(t.id)!.visible = false;
      this.refreshMarkers();
      this.emit();
      return;
    }
    const p = PLACES[index];
    this.cb.onHint?.(`${p.emoji} The ${p.name.toLowerCase()} opens at ${p.stars} ★. You have ${this.stars} ★. Do chores to earn more!`);
  }

  /** Every frame: the work in hand, and the sparkles. */
  update(dt: number, pos: [number, number]) {
    this.time += dt;
    // sparkles only on chores you can do, and only nearby (fewer things to draw)
    this.steps.forEach((s, i) => {
      const p = STEPS[i].step.pos;
      s.marker.visible = !!this.open[i] && Math.abs(p[0] - pos[0]) + Math.abs(p[2] - pos[1]) < 16;
    });
    for (const s of this.steps) {
      if (!s.marker.visible) continue;
      const gem = s.marker.userData.gem as THREE.Mesh;
      gem.rotation.y += dt * 2;
      gem.position.y = 0.32 + Math.sin(this.time * 2.4) * 0.04;
    }
    if (!this.work) return;
    const { step, chore } = STEPS[this.work.i];
    if (Math.hypot(step.pos[0] - pos[0], step.pos[2] - pos[1]) > 2.0) { this.stopWork(); return; }
    this.work.t += dt;
    const p = Math.min(1, this.work.t / step.seconds);
    if (p - this.work.sent >= 0.04 || p >= 1) { this.work.sent = p; this.cb.onWork?.({ label: step.label, emoji: chore.emoji, progress: p }); }
    if (p >= 1) { const i = this.work.i; this.work = null; this.cb.onWork?.(null); this.complete(i); }
  }

  private complete(i: number) {
    const { chore, step } = STEPS[i];
    const look = this.steps[i];
    this.done.add(step.id);
    if (look.mess) look.mess.visible = false;
    if (look.after) look.after.visible = true;
    if (step.takes) this.held = null;
    if (step.gives) {
      if (this.held && ITEMS[this.held].tool) this.tools.get(this.held)!.visible = true;   // put the tool back to carry this
      this.held = step.gives;
    }
    if (chore.steps.every((s) => this.done.has(s.id))) {
      const before = this.unlocked;
      let bonus = 0;
      this.stars += chore.stars;
      this.runStars += chore.stars;
      const all = availableChores(this.baby, this.unlocked);
      if (!this.bonusGiven && all.every((c) => c.steps.every((s) => this.done.has(s.id)))) {
        bonus = ALL_DONE_BONUS;
        this.bonusGiven = true;
        this.stars += bonus;
        this.runStars += bonus;
      }
      saveProgress({ stars: this.stars });
      this.cb.onChoreDone?.({ chore, stars: chore.stars, bonus, total: this.stars });
      for (const p of PLACES) {
        if (before.includes(p.id) || !this.unlocked.includes(p.id)) continue;
        this.gates.get(p.id)!.visible = false;
        this.cb.onUnlock?.(p);
      }
    }
    this.refreshMarkers();
    this.emit();
  }

  snapshot(): ChoreSnapshot {
    return { stars: this.stars, runStars: this.runStars, held: this.held, done: [...this.done], unlocked: this.unlocked, baby: this.baby };
  }
  private emit() { this.cb.onChores?.(this.snapshot()); }

  /** Dev-only: set the saved stars (to try the unlocks). */
  debugStars(n: number) {
    this.stars = Math.max(0, Math.floor(n));
    saveProgress({ stars: this.stars });
    for (const [id, g] of this.gates) g.visible = !this.unlocked.includes(id);
    this.refreshMarkers();
    this.emit();
  }
  /** Dev-only: finish a step on the spot. */
  debugFinish(stepId: string) { const i = STEPS.findIndex((s) => s.step.id === stepId); if (i >= 0 && this.available(i)) this.complete(i); }
}

