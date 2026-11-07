// Diwali decorations for Noqublox: string lights, terracotta diyas, a marigold
// toran and a rangoli. Everything is built from plain shapes and one drawn
// texture (no image files), and the lamps glow by their own light (emissive),
// so they read as "lit" in the day and shine at night. The engine only adds
// these on Diwali day; see daynight.ts (isDiwali) and engine.ts (buildDiwali).

import * as THREE from 'three';
import { paint } from './models.ts';
import { canvasTexture } from './textures.ts';

const V = THREE.Vector3;

// Festive bulb colours: warm gold, orange, pink, blue, green, violet.
const BULB = ['#ffcf3a', '#ff7a2f', '#ff3d6e', '#3aa0ff', '#38d66e', '#b56bff'];
const glow = (color: string) => paint(color, { emissive: color, finish: 'gloss' });

/** One glowing bulb. */
function bulb(color: string, r = 0.055): THREE.Mesh {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), glow(color));
}

/** A sagging string of little bulbs between two points (fairy lights). */
export function lightString(a: THREE.Vector3, b: THREE.Vector3, count = 10, sag = 0.18): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const p = a.clone().lerp(b, t);
    p.y -= Math.sin(t * Math.PI) * sag;
    const m = bulb(BULB[i % BULB.length]);
    m.position.copy(p);
    g.add(m);
  }
  return g;
}

/** String lights draped around the four top edges of a footprint (a building's eaves). */
export function eaveLights(x0: number, z0: number, x1: number, z1: number, y: number, sag = 0.22): THREE.Group {
  const g = new THREE.Group();
  const c = [new V(x0, y, z0), new V(x1, y, z0), new V(x1, y, z1), new V(x0, y, z1)];
  for (let i = 0; i < 4; i++) {
    const a = c[i], b = c[(i + 1) % 4];
    g.add(lightString(a, b, Math.max(3, Math.round(a.distanceTo(b) / 0.7)), sag));
  }
  return g;
}

/** A terracotta oil lamp with a glowing flame. Sits on the ground at its origin. */
export function diya(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.055, 0.05, 10), paint('#a8502a'));
  bowl.position.y = 0.028;
  g.add(bowl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.014, 6, 12), paint('#7c3a1d'));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.052;
  g.add(rim);
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), paint('#ffd23a', { emissive: '#ff9b16' }));
  flame.scale.set(0.7, 1.5, 0.7); flame.position.y = 0.125;
  g.add(flame);
  if (scale !== 1) g.scale.setScalar(scale);
  return g;
}

/** A line of diyas from (x0,z0) to (x1,z1) on a surface at height y. */
export function diyaRow(x0: number, z0: number, x1: number, z1: number, y: number, count: number, scale = 1): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const d = diya(scale);
    d.position.set(x0 + (x1 - x0) * t, y, z0 + (z1 - z0) * t);
    g.add(d);
  }
  return g;
}

/** A marigold toran (garland) that hangs across a doorway of `width`, centred on x=0, draping below y=0. */
export function toran(width: number): THREE.Group {
  const g = new THREE.Group();
  const bead = (c: string, r = 0.07) => new THREE.Mesh(new THREE.SphereGeometry(r, 7, 6), paint(c, { emissive: c === '#2f9e44' ? '#1d5a2a' : c }));
  const cols = ['#ff7a1a', '#ffb81a', '#ff7a1a', '#ffd23a'];
  const n = Math.max(8, Math.round(width / 0.2));
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = -width / 2 + width * t;
    const y = -Math.sin(t * Math.PI) * 0.18;       // the garland dips in the middle
    const f = bead(cols[i % cols.length]);
    f.position.set(x, y, 0);
    g.add(f);
    if (i % 3 === 0 && i > 0 && i < n) {            // a hanging strand every few beads
      const strands = 2 + (i % 2);
      for (let k = 1; k <= strands; k++) {
        const b = bead(k === strands ? '#2f9e44' : cols[(i + k) % cols.length], 0.055);
        b.position.set(x, y - 0.13 * k, 0);
        g.add(b);
      }
    }
  }
  return g;
}

// One shared rangoli texture and material, so every rangoli is a single cheap draw.
let rangoliMat: THREE.MeshBasicMaterial | undefined;
function rangoliMaterial(): THREE.MeshBasicMaterial {
  if (rangoliMat) return rangoliMat;
  const tex = canvasTexture(256, 256, (c, w, h) => {
    const cx = w / 2, cy = h / 2;
    c.fillStyle = '#2a0820'; c.beginPath(); c.arc(cx, cy, w / 2 - 2, 0, Math.PI * 2); c.fill();   // deep base so colours pop
    const ring = (r: number, col: string, lw: number) => { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke(); };
    ring(120, '#ff7a1a', 8); ring(106, '#ffd23a', 5);
    const petalCols = ['#ff3d6e', '#3aa0ff', '#38d66e', '#ffd23a'];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      c.save(); c.translate(cx + Math.cos(a) * 82, cy + Math.sin(a) * 82); c.rotate(a);
      c.fillStyle = petalCols[i % petalCols.length];
      c.beginPath(); c.ellipse(0, 0, 17, 8, 0, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    ring(60, '#ff7a1a', 6);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillStyle = '#fdf6e3'; c.beginPath(); c.arc(cx + Math.cos(a) * 44, cy + Math.sin(a) * 44, 4.5, 0, Math.PI * 2); c.fill(); }
    c.fillStyle = '#ffd23a'; c.beginPath(); c.arc(cx, cy, 18, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ff3d6e'; c.beginPath(); c.arc(cx, cy, 9, 0, Math.PI * 2); c.fill();
  });
  rangoliMat = new THREE.MeshBasicMaterial({ map: tex });
  return rangoliMat;
}

/** A rangoli laid flat on the ground (colourful whether it is lit or not). Place its centre at the spot. */
export function rangoli(radius = 1.1): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 40), rangoliMaterial());
  m.rotation.x = -Math.PI / 2;
  return m;
}
