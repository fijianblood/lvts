// Builds the "LvTS link" that the website hands to the Colab notebook.
//
// It is the visitor's YouTube link with one extra query parameter, lvts=<quality>[-drive],
// e.g. https://youtu.be/aqz-KE-bpKQ?lvts=720-drive. YouTube ignores the extra parameter;
// the notebook reads it, removes it, and uses that quality (and the Drive copy when "-drive"
// is there). Keep QUALITY_OPTIONS in step with QUALITIES in
// public/colab/LvTS_YouTube_Downloader.ipynb.

export const QUALITY_OPTIONS = [
  { code: '1080', label: '1080p' },
  { code: '720', label: '720p (recommended)' },
  { code: '480', label: '480p' },
  { code: 'best', label: 'Best available (largest file)' },
  { code: 'mp3', label: 'Audio only (MP3)' },
] as const;

export type QualityCode = (typeof QUALITY_OPTIONS)[number]['code'];

export const DEFAULT_QUALITY: QualityCode = '720';

// Same check as the notebook: http(s), optional www./m./music., youtube.com or youtu.be.
const YOUTUBE_LINK = /^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//;

/**
 * Tidies a pasted YouTube link and checks it. Adds https:// when someone pastes
 * "youtube.com/..." or "youtu.be/..." without it. Returns null if it isn't a YouTube link.
 */
export function normalizeYoutubeLink(raw: string): string | null {
  let text = raw.trim();
  if (!text) return null;
  if (!/^https?:\/\//i.test(text) && /^(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(text)) {
    text = `https://${text}`;
  }
  if (!YOUTUBE_LINK.test(text)) return null;
  try {
    return new URL(text).toString();
  } catch {
    return null;
  }
}

/** The link the visitor pastes into Colab, or null if `raw` isn't a YouTube link. */
export function buildLvtsLink(raw: string, quality: QualityCode, saveToDrive: boolean): string | null {
  const link = normalizeYoutubeLink(raw);
  if (!link) return null;
  const url = new URL(link);
  url.searchParams.set('lvts', saveToDrive ? `${quality}-drive` : quality);
  return url.toString();
}
