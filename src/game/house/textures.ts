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

/**
 * A lawn: patches of lighter and darker green, thousands of short blades in
 * several greens, a few dry and bare spots. Seamless; one repeat is 4 m.
 */
export const grass = () => {
  const t = canvasTexture(512, 512, (g, w, h) => {
    const r = rng(5);
    g.fillStyle = '#5f9a3c'; g.fillRect(0, 0, w, h);
    const wrap = (x: number, y: number, draw: (x: number, y: number) => void) => {
      for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) draw(x + dx, y + dy);
    };
    // soft patches, so the lawn isn't one flat colour
    for (let i = 0; i < 70; i++) {
      const x = r() * w, y = r() * h, rad = 30 + r() * 90;
      const tone = r() > 0.5 ? '120,170,70' : '60,110,40';
      wrap(x, y, (cx, cy) => {
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grd.addColorStop(0, `rgba(${tone},0.22)`); grd.addColorStop(1, `rgba(${tone},0)`);
        g.fillStyle = grd; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      });
    }
    // a few dry or bare spots
    for (let i = 0; i < 10; i++) {
      const x = r() * w, y = r() * h, rad = 6 + r() * 16;
      wrap(x, y, (cx, cy) => {
        const grd = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
        grd.addColorStop(0, r() > 0.5 ? 'rgba(150,140,80,0.5)' : 'rgba(110,90,60,0.45)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
      });
    }
    // blades
    const blades = ['#4d8530', '#6aa845', '#7fbb52', '#578f36', '#8cbf5d', '#3f7426', '#a3c46a'];
    g.lineCap = 'round';
    for (let i = 0; i < 9000; i++) {
      const x = r() * w, y = r() * h, len = 3 + r() * 7, lean = (r() - 0.5) * 4;
      g.strokeStyle = blades[Math.floor(r() * blades.length)];
      g.globalAlpha = 0.55 + r() * 0.45;
      g.lineWidth = 0.8 + r() * 1.2;
      wrap(x, y, (cx, cy) => {
        if (cx < -12 || cx > w + 12 || cy < -12 || cy > h + 12) return;
        g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + lean, cy - len); g.stroke();
      });
    }
    g.globalAlpha = 1;
  }, true);
  t.anisotropy = 8;
  return t;
};

/** The sky behind everything: deep blue at the top, pale at the horizon. */
export const skyGradient = () => canvasTexture(4, 256, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, '#1e7bea');
  grd.addColorStop(0.55, '#5eb3ff');
  grd.addColorStop(1, '#bfe6ff');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
});

/** A shop's sign board: its name, and a line under it. */
export const shopSign = (name: string, sub: string, color: string) => canvasTexture(512, 88, (g, w, h) => {
  g.fillStyle = color; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 5; g.strokeRect(5, 5, w - 10, h - 10);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `800 ${sub ? 34 : 40}px sans-serif`; g.fillText(name, w / 2, sub ? 32 : h / 2, w - 30);
  if (sub) { g.font = '700 22px sans-serif'; g.fillStyle = '#fde68a'; g.fillText(sub, w / 2, 66, w - 30); }
});

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

export const asphalt = () => canvasTexture(128, 128, (g, w, h) => {
  let s = 17;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  g.fillStyle = '#44474b'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${r() * 0.1})`; g.fillRect(r() * w, r() * h, 2, 2); }
}, true);

// ── Garden City (gardenCity.ts) ─────────────────────────────────────────────
const GC_GREEN = '#4f9a3a';

/** Garden City's name board over the gate: green script letters on white. */
export const gardenCitySign = () => canvasTexture(512, 128, (g, w, h) => {
  g.fillStyle = '#f7f7f4'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#d5d8d4'; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.font = 'italic 700 76px "Brush Script MT", "Segoe Script", "Snell Roundhand", "Dancing Script", cursive';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#3c7f2c'; g.strokeText('Garden City', w / 2, h / 2 + 4, w - 44);
  g.fillStyle = '#7cc24e'; g.fillText('Garden City', w / 2, h / 2 + 4, w - 44);
});

/** The board under the name: a tile for each shop to come, all still "coming soon". */
export const gardenCityBoard = () => canvasTexture(256, 232, (g, w, h) => {
  g.fillStyle = '#5b6066'; g.fillRect(0, 0, w, h);
  const cols = 4, rows = 3, pad = 14, gap = 9;
  const tw = (w - pad * 2 - gap * (cols - 1)) / cols, th = (h - pad * 2 - gap * (rows - 1)) / rows;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const x = pad + c * (tw + gap), y = pad + r * (th + gap);
    g.fillStyle = '#f3f4f2'; g.fillRect(x, y, tw, th);
    g.fillStyle = '#7b8086'; g.font = '700 11px "Space Grotesk", Arial, sans-serif';
    g.fillText('COMING', x + tw / 2, y + th / 2 - 7); g.fillText('SOON', x + tw / 2, y + th / 2 + 7);
  }
});

/** The banner along the top of the building. */
export const comingSoonBanner = () => canvasTexture(1024, 48, (g, w, h) => {
  g.fillStyle = GC_GREEN; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.font = '800 30px "Space Grotesk", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SHOPS COMING SOON  ·  GARDEN CITY', w / 2, h / 2 + 1, w - 30);
});

/** A yellow builders' sign. */
export const constructionSign = () => canvasTexture(256, 168, (g, w, h) => {
  g.fillStyle = '#f6c21c'; g.fillRect(0, 0, w, h);
  // black and yellow stripes along the top and bottom
  g.save(); g.beginPath(); g.rect(0, 0, w, 20); g.rect(0, h - 20, w, 20); g.clip();
  g.fillStyle = '#16181a';
  for (let x = -h; x < w + h; x += 28) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 14, 0); g.lineTo(x + 14 + h, h); g.lineTo(x + h, h); g.closePath(); g.fill(); }
  g.restore();
  g.fillStyle = '#16181a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '800 30px "Space Grotesk", Arial, sans-serif'; g.fillText('UNDER', w / 2, 56); g.fillText('CONSTRUCTION', w / 2, 90, w - 16);
  g.font = '600 17px "Space Grotesk", Arial, sans-serif'; g.fillText('Shops coming soon', w / 2, 124);
});

/** On each unit still waiting for a shop, with the centre's name in script. */
export const shopComingSoon = (place: string) => canvasTexture(256, 104, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.strokeStyle = GC_GREEN; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#5b6066'; g.font = '700 16px "Space Grotesk", Arial, sans-serif'; g.fillText('THIS SHOP', w / 2, 26);
  g.fillStyle = '#2f6b23'; g.font = '800 28px "Space Grotesk", Arial, sans-serif'; g.fillText('COMING SOON', w / 2, 54, w - 20);
  g.fillStyle = GC_GREEN; g.font = 'italic 700 22px "Brush Script MT", "Segoe Script", "Snell Roundhand", cursive'; g.fillText(place, w / 2, 82);
});

/** Garden City's stair signs, in the centre's green: an arrow (up or down) and where it takes you. */
export const floorSign = (big: string, small: string, dir: 1 | -1) => canvasTexture(256, 96, (g, w, h) => {
  g.fillStyle = '#2f6b23'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 4; g.strokeRect(5, 5, w - 10, h - 10);
  // the arrow, drawn rather than typed so it never depends on a font
  const ax = 44, ay = h / 2;
  g.fillStyle = '#ffffff'; g.beginPath();
  g.moveTo(ax, ay - dir * 26); g.lineTo(ax + 20, ay - dir * 4); g.lineTo(ax + 8, ay - dir * 4); g.lineTo(ax + 8, ay + dir * 24);
  g.lineTo(ax - 8, ay + dir * 24); g.lineTo(ax - 8, ay - dir * 4); g.lineTo(ax - 20, ay - dir * 4); g.closePath(); g.fill();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = '800 30px "Space Grotesk", Arial, sans-serif'; g.fillText(big, 80, 38, w - 92);
  g.font = '600 17px "Space Grotesk", Arial, sans-serif'; g.fillText(small, 80, 70, w - 92);
});

/**
 * The board for LvTS's hidden reward in the Digicel and Vodafone shops
 * (promos.ts): the reward, the wallet it's paid by, what to do, and that LvTS
 * runs it, not the company whose shop it's in.
 */
export const promoBoard = (p: { amount: string; wallet: string; company: string; colour: string }) => canvasTexture(400, 256, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = p.colour; g.fillRect(0, 0, w, 52);
  g.strokeStyle = p.colour; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff'; g.textAlign = 'center';
  g.font = '800 24px "Space Grotesk", Arial, sans-serif'; g.fillText('LvTS · NOQUBLOX REWARD', w / 2, 28, w - 24);
  g.textAlign = 'left'; g.fillStyle = p.colour;
  g.font = '800 92px "Space Grotesk", Arial, sans-serif'; g.fillText(p.amount, 20, 112);
  const left = 20 + g.measureText(p.amount).width + 14;
  g.font = '800 40px "Space Grotesk", Arial, sans-serif'; g.fillText(p.wallet, left, 94, w - left - 16);
  g.fillStyle = '#1f2937'; g.font = '800 30px "Space Grotesk", Arial, sans-serif'; g.fillText('CASHBACK', left, 132, w - left - 16);
  g.textAlign = 'center'; g.fillStyle = '#111827';
  g.font = '700 21px "Space Grotesk", Arial, sans-serif'; g.fillText('A reward card is hidden in this shop!', w / 2, 178, w - 24);
  g.font = '600 16px "Space Grotesk", Arial, sans-serif'; g.fillText('Find it, screenshot the code, post it on @lvtsfiji', w / 2, 204, w - 24);
  g.fillStyle = '#6b7280'; g.font = '600 12px "Space Grotesk", Arial, sans-serif';
  g.fillText(`Run & paid by LvTS. Not a ${p.company} or ${p.wallet} promotion.`, w / 2, 234, w - 24);
});

// ── Loma Castle Playground (playground.ts) ──────────────────────────────────
/** The arch over the playground's gate: its name in big, bright letters. */
export const lomaSign = () => canvasTexture(512, 112, (g, w, h) => {
  g.fillStyle = '#facc15'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e02424'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const words = ['L', 'O', 'M', 'A'], colours = ['#e02424', '#1f6fe0', '#22a35a', '#e02424'];
  g.font = '900 46px "Space Grotesk", Arial, sans-serif';
  const lw = g.measureText('LOMA ').width, cw = g.measureText('CASTLE').width;
  let x = w / 2 - (lw + cw) / 2;
  words.forEach((c, i) => { g.fillStyle = colours[i]; const cwid = g.measureText(c).width; g.fillText(c, x + cwid / 2, 44); x += cwid; });
  x += g.measureText(' ').width;
  g.fillStyle = '#1f6fe0'; g.fillText('CASTLE', x + cw / 2, 44);
  g.fillStyle = '#7c2d12'; g.font = '800 26px "Space Grotesk", Arial, sans-serif'; g.fillText('PLAYGROUND', w / 2, 86, w - 40);
});
/** The banner over the bouncy castle's doorway. */
export const lomaCastleBanner = () => canvasTexture(256, 96, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e02424'; for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 16, 12);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#1f6fe0'; g.font = '900 34px "Space Grotesk", Arial, sans-serif'; g.fillText('LOMA CASTLE', w / 2, 48, w - 20);
  g.fillStyle = '#7c2d12'; g.font = '700 15px "Space Grotesk", Arial, sans-serif'; g.fillText('Bounce! Shoes off, have fun', w / 2, 78, w - 20);
});
/** At the bottom of the slide's steps. */
export const lomaSlideSign = () => canvasTexture(256, 256, (g, w, h) => {
  g.fillStyle = '#facc15'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#1f2937'; g.lineWidth = 8; g.strokeRect(4, 4, w - 8, h - 8);
  g.fillStyle = '#e02424'; g.beginPath(); g.moveTo(w / 2, 34); g.lineTo(w / 2 + 50, 104); g.lineTo(w / 2 + 18, 104); g.lineTo(w / 2 + 18, 150); g.lineTo(w / 2 - 18, 150); g.lineTo(w / 2 - 18, 104); g.lineTo(w / 2 - 50, 104); g.closePath(); g.fill();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#1f2937';
  g.font = '900 40px "Space Grotesk", Arial, sans-serif'; g.fillText('SLIDE', w / 2, 186);
  g.font = '700 20px "Space Grotesk", Arial, sans-serif'; g.fillText('Up the steps', w / 2, 222);
});

// ── Damodar City (damodarCity.ts) ───────────────────────────────────────────
/** The centre's name, on its pylon sign by the entrance. */
export const damodarCitySign = () => canvasTexture(512, 144, (g, w, h) => {
  g.fillStyle = '#3f4d5e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 6; g.strokeRect(6, 6, w - 12, h - 12);
  g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '800 58px "Space Grotesk", Arial, sans-serif'; g.fillText('DAMODAR CITY', w / 2, h / 2 + 2, w - 40);
});
