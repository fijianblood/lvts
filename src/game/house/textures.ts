// Small canvas-drawn textures, so the game ships no image files of its own.
import * as THREE from 'three';

type Draw = (g: CanvasRenderingContext2D, w: number, h: number) => void;

export function canvasTexture(w: number, h: number, draw: Draw, repeat = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d')!;
  draw(g, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (repeat) { tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; }
  return tex;
}

/** A seeded random so every visitor sees the same speckle. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

/** Terracotta floor tiles — one texture repeat is one 50 cm tile. */
export const floorTile = () => canvasTexture(128, 128, (g, w, h) => {
  const r = rng(7);
  g.fillStyle = '#c9844a'; g.fillRect(0, 0, w, h);
  // faint wood-look grain the photos show on these tiles
  for (let i = 0; i < 26; i++) {
    g.strokeStyle = `rgba(${r() > 0.5 ? '255,220,180' : '120,60,20'},${0.05 + r() * 0.06})`;
    g.lineWidth = 1 + r() * 2;
    const y = r() * h;
    g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * 0.3, y + r() * 6 - 3, w * 0.6, y + r() * 6 - 3, w, y + r() * 4 - 2); g.stroke();
  }
  g.strokeStyle = 'rgba(90,45,20,0.55)'; g.lineWidth = 2;
  g.strokeRect(1, 1, w - 2, h - 2);
}, true);

export const bathTile = () => canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = '#f2f0e9'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(140,140,135,0.55)'; g.lineWidth = 2;
  g.strokeRect(1, 1, w - 2, h - 2);
  g.strokeStyle = 'rgba(140,140,135,0.25)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
}, true);

/** The grey brick mosaic band that runs round the bathroom tiles. */
export const mosaic = () => canvasTexture(256, 32, (g, w, h) => {
  const r = rng(3);
  g.fillStyle = '#e9e7e1'; g.fillRect(0, 0, w, h);
  const shades = ['#5d6268', '#8a9096', '#b6bbc0', '#474b50', '#9aa0a6'];
  for (let row = 0; row < 2; row++) {
    let x = row ? -10 : 0;
    while (x < w) {
      const len = 18 + Math.floor(r() * 18);
      g.fillStyle = shades[Math.floor(r() * shades.length)];
      g.fillRect(x + 1, 2 + row * 15, len - 2, 12);
      x += len;
    }
  }
}, true);

export const verandaTile = () => canvasTexture(64, 64, (g, w, h) => {
  g.fillStyle = '#b45a3c'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(70,30,20,0.5)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2);
}, true);

export const concrete = () => canvasTexture(128, 128, (g, w, h) => {
  const r = rng(11);
  g.fillStyle = '#b9b7b1'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '60,60,60'},${r() * 0.08})`; g.fillRect(r() * w, r() * h, 2, 2); }
}, true);

export const deck = () => canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = '#9a7b5a'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(60,40,20,0.5)'; g.lineWidth = 2;
  for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, true);

export const grass = () => canvasTexture(128, 128, (g, w, h) => {
  const r = rng(5);
  g.fillStyle = '#7fb069'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '40,90,30' : '170,210,120'},${0.08 + r() * 0.12})`; g.fillRect(r() * w, r() * h, 2, 3); }
}, true);

/** Ceiling: painted fibre-board panels with white cover strips, as in the photos. One repeat is 1.2 m. */
export const ceiling = () => canvasTexture(128, 128, (g, w, h) => {
  g.fillStyle = '#f1efe8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, 5); g.fillRect(0, 0, 5, h);
  g.fillStyle = 'rgba(0,0,0,0.06)'; g.fillRect(0, 5, w, 2); g.fillRect(5, 0, 2, h);
}, true);

/** The patterned lounge rug: a red field, a navy medallion and a cream border. */
export const rug = () => canvasTexture(256, 320, (g, w, h) => {
  g.fillStyle = '#8e3b33'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#efe2c8'; g.lineWidth = 10; g.strokeRect(10, 10, w - 20, h - 20);
  g.strokeStyle = '#2d3a5a'; g.lineWidth = 6; g.strokeRect(24, 24, w - 48, h - 48);
  const cx = w / 2, cy = h / 2;
  for (let i = 6; i > 0; i--) {
    g.beginPath(); g.ellipse(cx, cy, i * 17, i * 21, 0, 0, Math.PI * 2);
    g.fillStyle = i % 2 ? '#2d3a5a' : '#c9a46a'; g.fill();
  }
  g.fillStyle = '#efe2c8';
  for (let a = 0; a < 16; a++) {
    const t = (a / 16) * Math.PI * 2;
    g.beginPath(); g.arc(cx + Math.cos(t) * 112, cy + Math.sin(t) * 138, 6, 0, Math.PI * 2); g.fill();
  }
});

const flowers = (g: CanvasRenderingContext2D, w: number, h: number, bg: string, seed: number) => {
  const r = rng(seed);
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h;
    g.fillStyle = '#3f8f3a';
    g.beginPath(); g.ellipse(x + 10, y + 8, 14, 5, r() * 3, 0, Math.PI * 2); g.fill();
    g.fillStyle = r() > 0.5 ? '#e23b3b' : '#f06aa8';
    for (let p = 0; p < 5; p++) { const t = (p / 5) * Math.PI * 2; g.beginPath(); g.arc(x + Math.cos(t) * 7, y + Math.sin(t) * 7, 6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = '#f7d046'; g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
  }
};

export const curtain = (kind: 'floral' | 'gold' | 'yellow' | 'polka' | 'sheer' | 'towel') => canvasTexture(128, 256, (g, w, h) => {
  if (kind === 'floral') flowers(g, w, h, '#f4f1ea', 21);
  if (kind === 'gold' || kind === 'yellow') {
    g.fillStyle = kind === 'gold' ? '#d9b46a' : '#f2e3a0'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 12) { g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(x, 0, 5, h); }
  }
  if (kind === 'polka') {
    g.fillStyle = '#1d2228'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8e8e8';
    for (let y = 8; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { g.beginPath(); g.arc(x, y, 2.5, 0, Math.PI * 2); g.fill(); }
  }
  if (kind === 'sheer') {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 10) { g.fillStyle = 'rgba(0,0,0,0.05)'; g.fillRect(x, 0, 4, h); }
  }
  if (kind === 'towel') {
    g.fillStyle = '#b9c79a'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e8d24a'; g.fillRect(8, 0, w * 0.55, h * 0.6);
  }
});

export const welcomeSign = () => canvasTexture(256, 128, (g, w, h) => {
  g.fillStyle = '#5a2e18'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#d4a94a'; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = '#f0cf72';
  g.font = 'italic 700 40px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('Welcome', w / 2, h / 2 - 16);
  g.fillText('Home', w / 2, h / 2 + 24);
});

export const exitSign = () => canvasTexture(256, 72, (g, w, h) => {
  g.fillStyle = '#16a34a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff';
  g.font = '800 46px "Syne", "Space Grotesk", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('EXIT →', w / 2, h / 2 + 2);
});

/** A wall clock showing the real time in Fiji, redrawn once a minute. */
export function clockFace() {
  const tex = canvasTexture(128, 128, () => {});
  const redraw = () => {
    const canvas = tex.image as HTMLCanvasElement;
    const g = canvas.getContext('2d')!;
    const w = canvas.width, c = w / 2;
    g.clearRect(0, 0, w, w);
    g.fillStyle = '#2b2f33'; g.beginPath(); g.arc(c, c, c - 1, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#f2f2ef'; g.beginPath(); g.arc(c, c, c - 9, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2b2f33';
    for (let i = 0; i < 12; i++) {
      const t = (i / 12) * Math.PI * 2;
      g.lineWidth = i % 3 ? 2 : 4;
      g.beginPath(); g.moveTo(c + Math.sin(t) * (c - 14), c - Math.cos(t) * (c - 14)); g.lineTo(c + Math.sin(t) * (c - 22), c - Math.cos(t) * (c - 22)); g.stroke();
    }
    const fiji = new Date(Date.now() + 12 * 3600 * 1000);   // Fiji is UTC+12 with no daylight saving
    const m = fiji.getUTCMinutes(), hr = (fiji.getUTCHours() % 12) + m / 60;
    const hand = (turn: number, len: number, width: number) => {
      const t = turn * Math.PI * 2;
      g.lineWidth = width; g.lineCap = 'round';
      g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(t) * len, c - Math.cos(t) * len); g.stroke();
    };
    hand(hr / 12, c * 0.48, 5);
    hand(m / 60, c * 0.7, 3);
    tex.needsUpdate = true;
  };
  redraw();
  return { tex, redraw };
}

/** Corrugated iron, for the carport roof. */
export const corrugated = () => canvasTexture(64, 64, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, 0);
  for (let i = 0; i <= 4; i++) { grd.addColorStop(i / 4, i % 2 ? '#c9cdd1' : '#8e959b'); }
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}, true);

export const chainLink = () => canvasTexture(64, 64, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  g.strokeStyle = 'rgba(150,155,160,0.9)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
}, true);
