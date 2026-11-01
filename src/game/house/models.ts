// Models: the twelve tech parts, the Golden Chip, the Ranger in the carport
// and the trees outside, plus `paint()`, the material everything solid uses.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { CollectibleKind } from './layout.ts';

/** How a surface reflects light: matte paint and cloth scatter it, skin and hair have a soft sheen, gloss and metal shine. */
export type Finish = 'matte' | 'satin' | 'cloth' | 'skin' | 'hair' | 'gloss' | 'metal';
export const FINISH: Record<Finish, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.82, metalness: 0 },
  satin: { roughness: 0.5, metalness: 0 },
  cloth: { roughness: 0.94, metalness: 0 },
  skin: { roughness: 0.6, metalness: 0 },
  hair: { roughness: 0.5, metalness: 0 },
  gloss: { roughness: 0.22, metalness: 0 },
  metal: { roughness: 0.32, metalness: 0.75 },
};

/** Fine surface detail laid over a colour: wood grain, fabric weave, or the slight texture of painted plaster. */
export type Detail = 'wood' | 'fabric' | 'plaster';

function detailCanvas(size: number, draw: (g: CanvasRenderingContext2D, s: number, r: () => number) => void) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  let seed = 9;
  const r = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 4294967296; };
  draw(g, size, r);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;     // a brightness multiplier, not a colour
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

const details = new Map<Detail, { tex: THREE.Texture; scale: number }>();
function detail(kind: Detail) {
  let d = details.get(kind);
  if (d) return d;
  if (kind === 'wood') {
    // long grain lines that wander a little, with the odd darker streak
    const tex = detailCanvas(512, (g, s, r) => {
      g.fillStyle = 'rgb(222,222,222)'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 120; i++) {
        const y0 = r() * s, amp = 2 + r() * 6, freq = (1 + Math.floor(r() * 3)) * Math.PI * 2 / s, ph = r() * 6;
        const v = 150 + Math.floor(r() * 90);
        g.strokeStyle = `rgba(${v},${v},${v},${0.25 + r() * 0.4})`;
        g.lineWidth = 0.6 + r() * 2.4;
        for (const dy of [-s, 0, s]) {
          g.beginPath();
          for (let x = 0; x <= s; x += 8) { const y = y0 + dy + Math.sin(x * freq + ph) * amp; if (x === 0) g.moveTo(x, y); else g.lineTo(x, y); }
          g.stroke();
        }
      }
    });
    d = { tex, scale: 1 / 0.9 };
  } else if (kind === 'fabric') {
    // a soft basket weave
    const tex = detailCanvas(128, (g, s, r) => {
      g.fillStyle = 'rgb(236,236,236)'; g.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 4) for (let x = 0; x < s; x += 4) {
        const v = 200 + Math.floor(r() * 40) + (((x + y) / 4) % 2 ? 12 : -6);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.fillRect(x, y, ((x + y) / 4) % 2 ? 4 : 3, ((x + y) / 4) % 2 ? 3 : 4);
      }
    });
    d = { tex, scale: 1 / 0.12 };
  } else {
    // painted plaster: a faint, even mottle
    const tex = detailCanvas(256, (g, s, r) => {
      g.fillStyle = 'rgb(250,250,250)'; g.fillRect(0, 0, s, s);
      for (let i = 0; i < 1400; i++) {
        const v = 236 + Math.floor(r() * 16), rad = 1 + r() * 5;
        g.fillStyle = `rgba(${v},${v},${v},0.22)`;
        g.beginPath(); g.arc(r() * s, r() * s, rad, 0, Math.PI * 2); g.fill();
      }
    });
    d = { tex, scale: 1 / 1.6 };
  }
  details.set(kind, d);
  return d;
}

/**
 * Lay a detail texture over a material by world position (seen straight on from
 * whichever side a surface faces), so it's the same size on every piece of
 * furniture and needs no texture coordinates.
 */
function worldDetail(m: THREE.MeshStandardMaterial, kind: Detail) {
  const d = detail(kind);
  m.map = d.tex;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.triScale = { value: d.scale };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos;\nvarying vec3 vTriN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvTriPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvTriN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTriPos;\nvarying vec3 vTriN;\nuniform float triScale;')
      .replace('#include <map_fragment>', `
        vec3 tw = pow(abs(normalize(vTriN)), vec3(4.0));
        tw /= (tw.x + tw.y + tw.z);
        vec4 sampledDiffuseColor = texture2D(map, vTriPos.zy * triScale) * tw.x
          + texture2D(map, vTriPos.xz * triScale) * tw.y
          + texture2D(map, vTriPos.xy * triScale) * tw.z;
        diffuseColor *= sampledDiffuseColor;`);
  };
  m.customProgramCacheKey = () => `world-detail-${kind}`;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();
/** A physically based material (it reacts to the lights and the room's reflections), shared per colour, finish and detail. */
export function paint(color: string, opts: { emissive?: string; finish?: Finish; detail?: Detail } = {}): THREE.MeshStandardMaterial {
  const finish = opts.finish ?? 'matte';
  const key = `${color}|${opts.emissive ?? ''}|${finish}|${opts.detail ?? ''}`;
  let m = mats.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, ...FINISH[finish] });
    if (opts.detail) worldDetail(m, opts.detail);
    if (opts.emissive) m.emissive = new THREE.Color(opts.emissive);
    if (finish === 'hair') m.side = THREE.DoubleSide;     // hair is open shells, seen from inside too
    m.userData.finish = finish;
    mats.set(key, m);
  }
  return m;
}

function addBox(g: THREE.Object3D, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0, emissive?: string) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), paint(color, { emissive }));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

function addCyl(g: THREE.Object3D, r: number, h: number, color: string, x = 0, y = 0, z = 0, seg = 14, axis: 'x' | 'y' | 'z' = 'y', emissive?: string) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), paint(color, { emissive }));
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

export interface PartModel { group: THREE.Group; spin?: THREE.Object3D }

/** Merge a group's direct mesh children by material, so a model costs a draw call per colour. */
function compact(g: THREE.Group) {
  const byMat = new Map<THREE.Material, THREE.BufferGeometry[]>();
  for (const child of [...g.children]) {
    const m = child as THREE.Mesh;
    if (!m.isMesh) continue;
    m.updateMatrix();
    const geo = m.geometry.clone().applyMatrix4(m.matrix);
    const mat = m.material as THREE.Material;
    const list = byMat.get(mat) ?? [];
    list.push(geo);
    byMat.set(mat, list);
    g.remove(m);
    m.geometry.dispose();
  }
  for (const [mat, list] of byMat) g.add(new THREE.Mesh(mergeGeometries(list), mat));
}

export function partModel(kind: CollectibleKind): PartModel {
  const g = new THREE.Group();
  let spin: THREE.Object3D | undefined;
  switch (kind) {
    case 'ram': {
      addBox(g, 0.34, 0.09, 0.02, '#1f7a3a');
      for (let i = 0; i < 4; i++) addBox(g, 0.06, 0.04, 0.012, '#15171a', -0.12 + i * 0.08, 0.012, 0.014);
      addBox(g, 0.34, 0.014, 0.024, '#d4a72c', 0, -0.045, 0);
      break;
    }
    case 'ssd': {
      addBox(g, 0.24, 0.16, 0.03, '#1e3a8a');
      addBox(g, 0.15, 0.06, 0.004, '#f8fafc', 0, 0.02, 0.017);
      addBox(g, 0.24, 0.02, 0.032, '#f59e0b', 0, -0.055, 0);
      break;
    }
    case 'cpu': {
      addBox(g, 0.2, 0.2, 0.02, '#2f5d3a');
      addBox(g, 0.13, 0.13, 0.012, '#cfd3d6', 0, 0, 0.016);
      addBox(g, 0.2, 0.2, 0.004, '#d4a72c', 0, 0, -0.012);
      break;
    }
    case 'usb': {
      addBox(g, 0.08, 0.18, 0.03, '#2563eb');
      addBox(g, 0.05, 0.06, 0.02, '#c9cdd1', 0, 0.12, 0);
      addBox(g, 0.05, 0.03, 0.032, '#f59e0b', 0, -0.06, 0);
      break;
    }
    case 'router': {
      addBox(g, 0.28, 0.06, 0.18, '#f4f4f2');
      addCyl(g, 0.01, 0.2, '#1d1f22', -0.11, 0.13, -0.07, 6);
      addCyl(g, 0.01, 0.2, '#1d1f22', 0.11, 0.13, -0.07, 6);
      for (let i = 0; i < 3; i++) addBox(g, 0.018, 0.01, 0.006, '#22c55e', -0.04 + i * 0.04, 0.012, 0.092, '#22c55e');
      break;
    }
    case 'mouse': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), paint('#33363b'));
      body.scale.set(0.07, 0.045, 0.11);
      g.add(body);
      addCyl(g, 0.012, 0.01, '#9ca3af', 0, 0.042, -0.04, 8, 'x');
      addBox(g, 0.004, 0.01, 0.06, '#1d1f22', 0, 0.04, -0.06);
      break;
    }
    case 'hdd': {
      addBox(g, 0.2, 0.03, 0.26, '#c3c8cd');
      addCyl(g, 0.07, 0.006, '#9aa1a8', 0, 0.018, -0.03, 18);
      addBox(g, 0.2, 0.01, 0.04, '#1f7a3a', 0, -0.018, 0.1);
      break;
    }
    case 'battery': {
      addBox(g, 0.3, 0.09, 0.04, '#1d1f22');
      addBox(g, 0.22, 0.02, 0.042, '#22c55e', 0, 0.02, 0);
      addBox(g, 0.05, 0.03, 0.03, '#d4a72c', 0.16, 0, 0);
      break;
    }
    case 'fan': {
      for (const [w, h, x, y] of [[0.22, 0.03, 0, 0.095], [0.22, 0.03, 0, -0.095], [0.03, 0.22, 0.095, 0], [0.03, 0.22, -0.095, 0]] as const) addBox(g, w, h, 0.04, '#1d1f22', x, y, 0);
      const rotor = new THREE.Group();
      addCyl(rotor, 0.035, 0.03, '#2563eb', 0, 0, 0, 12, 'z');
      for (let i = 0; i < 7; i++) {
        const blade = addBox(rotor, 0.07, 0.03, 0.006, '#3b82f6', 0, 0, 0);
        blade.position.set(Math.cos((i / 7) * Math.PI * 2) * 0.06, Math.sin((i / 7) * Math.PI * 2) * 0.06, 0);
        blade.rotation.z = (i / 7) * Math.PI * 2;
      }
      g.add(rotor);
      spin = rotor;
      break;
    }
    case 'gpu': {
      addBox(g, 0.36, 0.13, 0.03, '#15171a');
      addBox(g, 0.36, 0.015, 0.032, '#dc2626', 0, 0.06, 0);
      addCyl(g, 0.05, 0.01, '#3a3f45', -0.08, 0, 0.02, 16, 'z');
      addCyl(g, 0.05, 0.01, '#3a3f45', 0.08, 0, 0.02, 16, 'z');
      addBox(g, 0.02, 0.15, 0.05, '#c9cdd1', -0.19, 0, 0);
      break;
    }
    case 'hdmi': {
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 6, 18), paint('#1d1f22'));
      g.add(coil);
      addBox(g, 0.05, 0.03, 0.02, '#c9cdd1', 0.1, 0.06, 0);
      addBox(g, 0.05, 0.03, 0.02, '#c9cdd1', -0.1, -0.06, 0);
      break;
    }
    case 'sim': {
      addBox(g, 0.16, 0.1, 0.008, '#f8fafc');
      addBox(g, 0.05, 0.04, 0.003, '#d4a72c', -0.035, 0, 0.005);
      addBox(g, 0.16, 0.02, 0.009, '#7c3aed', 0, -0.04, 0);
      break;
    }
  }
  compact(g);
  g.scale.setScalar(1.35);
  return { group: g, spin };
}

/** The Golden Chip: a big gold processor with an engraved L for Loma. */
export function goldenChip(): THREE.Group {
  const g = new THREE.Group();
  addBox(g, 0.3, 0.3, 0.03, '#f5c542', 0, 0, 0, '#6b4a00');
  addBox(g, 0.2, 0.2, 0.02, '#ffe28a', 0, 0, 0.022, '#7a5600');
  addBox(g, 0.04, 0.13, 0.024, '#a06a00', -0.03, 0, 0.026);
  addBox(g, 0.1, 0.04, 0.024, '#a06a00', 0.0, -0.045, 0.026);
  for (let i = 0; i < 8; i++) {
    const t = -0.13 + i * 0.037;
    addBox(g, 0.012, 0.05, 0.01, '#d4a72c', t, 0.17, 0);
    addBox(g, 0.012, 0.05, 0.01, '#d4a72c', t, -0.17, 0);
    addBox(g, 0.05, 0.012, 0.01, '#d4a72c', 0.17, t, 0);
    addBox(g, 0.05, 0.012, 0.01, '#d4a72c', -0.17, t, 0);
  }
  compact(g);
  return g;
}

/** A black dual-cab ute with a tub cover, like the one in the carport. Built along +z, origin on the ground at its centre. */
export function ranger(): THREE.Group {
  const g = new THREE.Group();
  const black = '#141619', trim = '#2a2d31', glass = '#1f2933';
  addBox(g, 1.86, 0.62, 5.3, black, 0, 0.62, 0);                 // body
  addBox(g, 1.7, 0.66, 2.4, black, 0, 1.25, -0.55);              // cab
  addBox(g, 1.72, 0.48, 2.2, glass, 0, 1.28, -0.55);             // side glass band
  addBox(g, 1.6, 0.5, 0.05, glass, 0, 1.25, -1.78);              // windscreen
  addBox(g, 1.76, 0.08, 1.75, trim, 0, 0.96, 1.6);               // tub cover
  addBox(g, 1.5, 0.06, 0.06, '#3a3f45', 0, 1.36, 0.82);          // sports bar
  addBox(g, 1.9, 0.18, 0.2, trim, 0, 0.42, -2.62);               // front bumper
  addBox(g, 1.6, 0.26, 0.05, '#20242a', 0, 0.78, -2.66);         // grille
  addBox(g, 0.3, 0.1, 0.04, '#e5e7eb', -0.72, 0.86, -2.66, '#9aa0a6');
  addBox(g, 0.3, 0.1, 0.04, '#e5e7eb', 0.72, 0.86, -2.66, '#9aa0a6');
  addBox(g, 0.12, 0.3, 0.04, '#b91c1c', -0.86, 0.8, 2.66);
  addBox(g, 0.12, 0.3, 0.04, '#b91c1c', 0.86, 0.8, 2.66);
  addBox(g, 0.06, 0.06, 4.2, '#2a2d31', -0.96, 0.3, -0.2);       // side steps
  addBox(g, 0.06, 0.06, 4.2, '#2a2d31', 0.96, 0.3, -0.2);
  for (const z of [-1.7, 1.75]) for (const x of [-0.84, 0.84]) {
    addCyl(g, 0.4, 0.3, '#111214', x, 0.4, z, 16, 'x');
    addCyl(g, 0.24, 0.31, '#2b2e33', x, 0.4, z, 10, 'x');
  }
  return g;
}

export function palm(height = 5.5, lean = 0.25): THREE.Group {
  const g = new THREE.Group();
  const segs = 6;
  let x = 0, y = 0;
  for (let i = 0; i < segs; i++) {
    const h = height / segs;
    const m = addCyl(g, 0.16 - i * 0.012, h, i % 2 ? '#8b6b4a' : '#7a5c3e', x, y + h / 2, 0, 7);
    m.rotation.z = -lean * 0.5;
    x += Math.sin(lean * 0.5) * h * (i / segs) * 1.2;
    y += h;
  }
  for (let i = 0; i < 8; i++) {
    const frond = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.2, 4), paint(i % 2 ? '#3f8f3a' : '#4fa646'));
    frond.scale.set(1, 1, 0.25);
    frond.position.set(x, y, 0);
    frond.rotation.set(0, (i / 8) * Math.PI * 2, 0);
    frond.translateZ(0.9);
    frond.rotateX(Math.PI / 2 + 0.55);
    g.add(frond);
  }
  return g;
}

export function bushTree(size = 1.4): THREE.Group {
  const g = new THREE.Group();
  addCyl(g, 0.14, 1.4, '#7a5c3e', 0, 0.7, 0, 7);
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), paint('#4f9a45'));
  crown.position.y = 1.4 + size * 0.7;
  g.add(crown);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(size * 0.7, 0), paint('#5fae52'));
  crown2.position.set(size * 0.5, 1.4 + size * 1.2, size * 0.2);
  g.add(crown2);
  return g;
}

/** A banana plant: a fibrous trunk and long, arching leaves. */
export function banana(size = 1): THREE.Group {
  const g = new THREE.Group();
  const h = 2.4 * size;
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * size, 0.18 * size, h, 7), paint('#8b8f5a'));
  trunk.position.y = h / 2;
  g.add(trunk);
  const dead = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * size, 0.24 * size, h * 0.45, 7), paint('#a08a5c'));
  dead.position.y = h * 0.25;
  g.add(dead);
  for (let i = 0; i < 7; i++) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.42 * size, 0.02, 1.7 * size), paint(i % 2 ? '#5aa33f' : '#6bb84a'));
    const pivot = new THREE.Group();
    pivot.position.y = h;
    pivot.rotation.y = (i / 7) * Math.PI * 2 + i * 0.3;
    leaf.position.set(0, 0.35 * size, 0.75 * size);
    leaf.rotation.x = -0.55 + (i % 3) * 0.18;
    pivot.add(leaf);
    g.add(pivot);
  }
  return g;
}

/** A breadfruit tree: short trunk, big glossy dark-green crown. */
export function breadfruit(size = 1): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * size, 0.24 * size, 2.2 * size, 7), paint('#6b5038'));
  trunk.position.y = 1.1 * size;
  g.add(trunk);
  for (const [x, y, z, r, c] of [[0, 3.0, 0, 1.6, '#2f6b2b'], [0.9, 3.4, 0.4, 1.1, '#3b7d34'], [-0.8, 3.3, -0.5, 1.2, '#356f2f'], [0.2, 4.1, -0.2, 1.0, '#438a3a']] as const) {
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r * size, 0), paint(c));
    crown.position.set(x * size, y * size, z * size);
    g.add(crown);
  }
  return g;
}

/** A plain white delivery van, parked across the road. Built along +x. */
export function van(): THREE.Group {
  const g = new THREE.Group();
  addBox(g, 4.4, 1.5, 1.75, '#f4f4f2', 0, 1.0, 0);
  addBox(g, 1.3, 0.9, 1.7, '#f4f4f2', -1.6, 0.55, 0);
  addBox(g, 0.05, 0.6, 1.5, '#1f2933', -2.2, 1.25, 0);
  addBox(g, 0.9, 0.55, 0.02, '#1f2933', -1.4, 1.35, 0.876);
  addBox(g, 0.9, 0.55, 0.02, '#1f2933', -1.4, 1.35, -0.876);
  for (const x of [-1.4, 1.4]) for (const z of [-0.8, 0.8]) addCyl(g, 0.33, 0.24, '#151618', x, 0.33, z, 14, 'z');
  return g;
}
