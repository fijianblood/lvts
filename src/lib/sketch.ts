// Photo → pencil sketch, the classic "colour dodge" recipe done in plain JS so it
// runs in the browser with no OpenCV:
//
//   gray            = grayscale(photo)
//   blurred         = gaussianBlur(255 - gray)
//   sketch          = gray * 256 / (255 - blurred)      (clamped to 0..255)
//
// The blur is three box-blur passes, which closely approximates a Gaussian and
// avoids ctx.filter = 'blur()' (not available on every browser, e.g. iOS Safari).

export interface SketchOptions {
  /** Blur radius in pixels. Bigger = thicker, softer lines. */
  radius: number;
  /** Pencil darkness, 1 = the plain recipe; above 1 darkens the strokes. */
  darkness: number;
}

/** Rec. 601 luma, same weights OpenCV's COLOR_BGR2GRAY uses. */
export function toGray(rgba: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(w * h);
  for (let i = 0, p = 0; i < out.length; i++, p += 4) {
    out[i] = 0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2];
  }
  return out;
}

// One horizontal + vertical running-sum box blur, edges clamped.
function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const size = r * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let k = -r; k <= r; k++) sum += src[row + Math.min(w - 1, Math.max(0, k))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / size;
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let k = -r; k <= r; k++) sum += tmp[Math.min(h - 1, Math.max(0, k)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / size;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

export function gaussianApprox(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const r = Math.max(1, Math.round(radius / 1.7));
  let buf = src;
  for (let pass = 0; pass < 3; pass++) buf = boxBlur(buf, w, h, r);
  return buf;
}

/** Returns a single-channel sketch (0 = black, 255 = white). */
export function sketchGray(gray: Uint8ClampedArray, w: number, h: number, opts: SketchOptions): Uint8ClampedArray {
  const inverted = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) inverted[i] = 255 - gray[i];
  const blurred = gaussianApprox(inverted, w, h, opts.radius);

  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const denom = 255 - blurred[i];
    let v = denom <= 0 ? 255 : Math.min(255, (gray[i] * 256) / denom);
    if (opts.darkness !== 1) v = 255 * Math.pow(v / 255, opts.darkness);
    out[i] = v;
  }
  return out;
}

/** Full RGBA → RGBA conversion, ready for putImageData. */
export function sketchImageData(rgba: Uint8ClampedArray, w: number, h: number, opts: SketchOptions): Uint8ClampedArray<ArrayBuffer> {
  const s = sketchGray(toGray(rgba, w, h), w, h, opts);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0, p = 0; i < s.length; i++, p += 4) {
    out[p] = out[p + 1] = out[p + 2] = s[i];
    out[p + 3] = 255;
  }
  return out;
}
