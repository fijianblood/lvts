// Shared by the Tools page: turn any picked file (incl. iPhone HEIC and DNG RAW)
// into a normal browser image URL.
import { extractJpegCandidates } from './rawPreview';

export function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function isSupportedFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(heic|heif|dng)$/i.test(file.name);
}

function isHeic(file: File): boolean {
  return /^image\/hei[cf]/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
}

function isDng(file: File): boolean {
  return /adobe-dng|x-dng/i.test(file.type) || /\.dng$/i.test(file.name);
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function loadImageDims(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = url;
  });
}

// Converts a file into a browser-decodable image URL, handling HEIC/HEIF
// (via client-side conversion) and DNG/RAW (via embedded-preview extraction)
// transparently — everything downstream just sees a normal image URL.
export async function resolveImageSource(file: File): Promise<{ url: string; w: number; h: number }> {
  let sourceBlob: Blob = file;

  if (isHeic(file)) {
    const heic2any = (await import('heic2any')).default;
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    sourceBlob = Array.isArray(converted) ? converted[0] : converted;
  } else if (isDng(file)) {
    const buffer = await file.arrayBuffer();
    const candidates = extractJpegCandidates(buffer);
    if (!candidates.length) throw new Error('No embedded preview image found in this DNG file.');
    let found: Blob | null = null;
    for (const candidate of candidates) {
      const testUrl = URL.createObjectURL(candidate);
      try {
        await loadImageDims(testUrl);
        found = candidate;
        URL.revokeObjectURL(testUrl);
        break;
      } catch {
        URL.revokeObjectURL(testUrl);
      }
    }
    if (!found) throw new Error('Could not extract a usable preview from this DNG file.');
    sourceBlob = found;
  }

  const url = URL.createObjectURL(sourceBlob);
  const dims = await loadImageDims(url);
  return { url, w: dims.w, h: dims.h };
}
