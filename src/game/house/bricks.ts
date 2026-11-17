// The Noqublox brick look: shiny plastic everywhere, staggered brick seams on
// walls and studs on flat tops, drawn in the shader from world position so the
// whole town turns into bricks without rebuilding a single wall.
// The bricks are LvTS's own toy-brick style (not LEGO): a 1×4 brick is 1.6 m
// long and 0.48 m tall, and studs sit every 0.4 m.
import * as THREE from 'three';
import type { Finish } from './models.ts';

/** Stud pitch, brick length and brick height, in metres. */
export const BRICK = { pitch: 0.4, length: 1.6, height: 0.48 } as const;

/** How shiny each finish is as plastic. Phones skip the clear coat (it costs a little more to draw). */
const PLASTIC: Record<Finish, { roughness: number; metalness: number; clearcoat: number; clearcoatRoughness: number }> = {
  matte: { roughness: 0.42, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.25 },
  satin: { roughness: 0.36, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.2 },
  cloth: { roughness: 0.55, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.4 },
  skin: { roughness: 0.36, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.2 },
  hair: { roughness: 0.38, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.22 },
  gloss: { roughness: 0.2, metalness: 0, clearcoat: 0.8, clearcoatRoughness: 0.1 },
  metal: { roughness: 0.3, metalness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.2 },
};

let clearcoat = true;
/** Turn the clear coat off for phones; call before anything is painted. */
export function setPlasticCoat(on: boolean) { clearcoat = on; }
export const coatOn = () => clearcoat;

/** A plastic material for a colour and finish. */
export function plasticMaterial(color: string, finish: Finish): THREE.MeshStandardMaterial {
  const p = PLASTIC[finish];
  if (!clearcoat) return new THREE.MeshStandardMaterial({ color, roughness: p.roughness * 0.9, metalness: p.metalness });
  return new THREE.MeshPhysicalMaterial({ color, ...p });
}

/**
 * The brick pattern, in GLSL. `vBrickW` is 1 on pieces big enough to be built
 * from bricks (walls, floors of buildings, big furniture) and 0 on small things.
 */
const GLSL = /* glsl */ `
varying float vBrickW;
varying vec3 vBrickPos;
varying vec3 vBrickN;
float brickHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void brickShade(inout vec3 col) {
  if (vBrickW < 0.5) return;
  vec3 n = normalize(vBrickN);
  vec3 p = vBrickPos;
  if (abs(n.y) < 0.35) {
    // a wall: staggered 1x4 bricks, every other row shifted half a brick
    float u = abs(n.x) > abs(n.z) ? p.z : p.x;
    float row = floor(p.y / ${BRICK.height.toFixed(2)});
    float bu = u / ${BRICK.length.toFixed(2)} + 0.5 * mod(row, 2.0);
    float cell = floor(bu);
    vec2 f = vec2(fract(bu) * ${BRICK.length.toFixed(2)}, fract(p.y / ${BRICK.height.toFixed(2)}) * ${BRICK.height.toFixed(2)});
    float e = min(min(f.x, ${BRICK.length.toFixed(2)} - f.x), min(f.y, ${BRICK.height.toFixed(2)} - f.y));
    float aa = fwidth(u) + fwidth(p.y);
    float fade = 1.0 - smoothstep(0.02, 0.07, aa);
    float seam = 1.0 - smoothstep(0.005, 0.005 + max(aa, 0.003) * 1.5, e);
    float tint = (brickHash(vec2(cell, row)) - 0.5) * 0.07;
    float lip = (1.0 - smoothstep(0.0, 0.035, ${BRICK.height.toFixed(2)} - f.y)) * 0.07;
    col *= (1.0 + tint * fade) * (1.0 - seam * 0.5 * fade) * (1.0 + lip * fade);
  } else if (n.y > 0.9) {
    // a flat top: a stud every 0.4 m, lit from the top left, with a soft shadow
    vec2 c = (fract(p.xz / ${BRICK.pitch.toFixed(2)}) - 0.5) * ${BRICK.pitch.toFixed(2)};
    float d = length(c);
    float aa = fwidth(p.x) + fwidth(p.z);
    float fade = 1.0 - smoothstep(0.02, 0.05, aa);
    float disk = 1.0 - smoothstep(0.11, 0.12 + aa, d);
    float ring = smoothstep(0.09, 0.12, d) * disk;
    float shadow = (1.0 - smoothstep(0.11, 0.17, length(c - vec2(0.025, 0.03)))) * (1.0 - disk);
    float hi = (1.0 - smoothstep(0.0, 0.09, length(c + vec2(0.03, 0.03)))) * disk;
    col *= 1.0 + fade * (hi * 0.16 - ring * 0.16 - shadow * 0.2);
  }
}
`;

/** Draw brick seams and studs on a material whose geometry carries a `brickw` attribute. */
export function brickify(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float brickw;\nvarying float vBrickW;\nvarying vec3 vBrickPos;\nvarying vec3 vBrickN;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvBrickW = brickw;\nvBrickPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvBrickN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${GLSL}`)
      .replace('#include <color_fragment>', '#include <color_fragment>\nbrickShade(diffuseColor.rgb);');
  };
  m.customProgramCacheKey = () => 'noqublox-brick-1';
}

/** Big enough to be built from bricks: at least 0.9 m one way and 0.45 m another. */
export function brickSized(g: THREE.BufferGeometry): boolean {
  if (!g.boundingBox) g.computeBoundingBox();
  const s = g.boundingBox!.getSize(new THREE.Vector3());
  const d = [s.x, s.y, s.z].sort((a, b) => a - b);
  return d[2] >= 0.9 && d[1] >= 0.45;
}

/** Tag a geometry for brickify(): 1 to build it from bricks, 0 to leave it smooth. */
export function tagBricks(g: THREE.BufferGeometry, on: boolean): void {
  const n = g.getAttribute('position').count;
  g.setAttribute('brickw', new THREE.Float32BufferAttribute(new Float32Array(n).fill(on && brickSized(g) ? 1 : 0), 1));
}

/**
 * A green studded baseplate for the ground: 10 × 10 studs per texture repeat
 * (4 m), with the lawn's soft patches kept so the grass isn't one flat colour.
 */
export function baseplateCanvas(g: CanvasRenderingContext2D, w: number, h: number, base: string, r: () => number): void {
  g.fillStyle = base;
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const x = r() * w, y = r() * h, rad = 40 + r() * 100;
    const tone = r() > 0.5 ? '140,200,90' : '40,100,40';
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      const grd = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, rad);
      grd.addColorStop(0, `rgba(${tone},0.14)`);
      grd.addColorStop(1, `rgba(${tone},0)`);
      g.fillStyle = grd;
      g.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
    }
  }
  const n = 10, s = w / n, rad = s * 0.3;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const cx = (i + 0.5) * s, cy = (j + 0.5) * s;
    // contact shadow to the lower right, then the stud with a highlight top left
    const sh = g.createRadialGradient(cx + s * 0.06, cy + s * 0.08, rad * 0.7, cx + s * 0.06, cy + s * 0.08, rad * 1.4);
    sh.addColorStop(0, 'rgba(0,0,0,0.3)');
    sh.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = sh;
    g.fillRect(cx - s / 2, cy - s / 2, s, s);
    const hi = g.createRadialGradient(cx - rad * 0.4, cy - rad * 0.4, 1, cx, cy, rad);
    hi.addColorStop(0, 'rgba(255,255,255,0.32)');
    hi.addColorStop(0.7, 'rgba(255,255,255,0.06)');
    hi.addColorStop(1, 'rgba(0,0,0,0.12)');
    g.fillStyle = base;
    g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.fill();
    g.fillStyle = hi;
    g.beginPath(); g.arc(cx, cy, rad, 0, Math.PI * 2); g.fill();
  }
}
