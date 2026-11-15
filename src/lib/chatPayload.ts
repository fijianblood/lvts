// What Loma's chat sends to the Worker (workers/loma), and how files become
// message blocks. Plain functions with no DOM or React, so
// tests/site/chatPayload.test.ts can check them. Reading the actual files in
// the browser is in src/lib/chatFiles.ts.

/** A block in a message to the Worker. The Worker accepts exactly these (workers/loma/src/validate.ts). */
export type ApiBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string }; title?: string }
  | { type: 'document'; source: { type: 'text'; media_type: 'text/plain'; data: string }; title?: string };

export interface ApiMessage {
  role: 'user' | 'assistant';
  content: string | ApiBlock[];
}

export const FILE_LIMITS = {
  /** Files attached to one message (the Worker's limit too). */
  perMessage: 5,
  /** Files kept across the conversation; older ones become a short note. */
  inConversation: 8,
  /** Photos are resized to this many pixels on the long side (Claude's recommended size). */
  imageLongSide: 1568,
  /** Largest file accepted before reading it. */
  maxFileBytes: 25 * 1024 * 1024,
  /** Largest PDF (sent whole). */
  maxPdfBytes: 15 * 1024 * 1024,
  /** Characters of text taken from one file; longer files are refused, not cut. */
  maxTextChars: 400_000,
  /** Base64 characters of files sent in one request, leaving room under the 30 MB the Worker accepts. */
  maxPayloadBase64: 24_000_000,
  /** Files up to this size with an unknown extension are tried as text. */
  maxUnknownTextBytes: 2 * 1024 * 1024,
};

export type FileKind = 'image' | 'pdf' | 'office' | 'text' | 'unsupported';

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|heic|heif|dng|avif)$/i;
const OFFICE_EXT = /\.(docx|xlsx|pptx)$/i;
const TEXT_EXT = /\.(txt|text|md|markdown|csv|tsv|json|jsonl|jso|geojson|xml|html?|css|scss|js|mjs|cjs|jsx|ts|tsx|py|rb|php|java|kt|c|h|cpp|hpp|cs|go|rs|swift|sh|bash|ps1|bat|sql|yaml|yml|toml|ini|cfg|conf|env|log|srt|vtt|svg|ino|r|lua|pl|dart|vue|gradle|properties|rtf|tex)$/i;
const BINARY_EXT = /\.(zip|rar|7z|tar|gz|exe|msi|dll|apk|iso|dmg|mp3|wav|m4a|aac|ogg|flac|mp4|mov|avi|mkv|webm|wmv|doc|xls|ppt|psd|ai|ttf|otf|woff2?)$/i;

/** What kind of file this is, from its name and browser type. Unknown small files are tried as text later. */
export function classifyFile(name: string, mime: string): FileKind {
  if (mime === 'application/pdf' || /\.pdf$/i.test(name)) return 'pdf';
  if (OFFICE_EXT.test(name)) return 'office';
  if (mime.startsWith('image/') && mime !== 'image/svg+xml') return 'image';
  if (IMAGE_EXT.test(name)) return 'image';
  if (mime.startsWith('text/') || /json|xml|javascript|yaml|csv|sql|x-sh/.test(mime) || TEXT_EXT.test(name)) return 'text';
  if (BINARY_EXT.test(name) || /^(audio|video)\//.test(mime) || /zip|compressed|octet-stream|msword|ms-excel|ms-powerpoint/.test(mime)) {
    // octet-stream is also what browsers report for many text files with odd extensions.
    return mime === 'application/octet-stream' && !BINARY_EXT.test(name) ? 'text' : 'unsupported';
  }
  return 'text';
}

/** True when the file's extension is one of the known text formats (code, data, documents). */
export function isKnownTextName(name: string): boolean {
  return TEXT_EXT.test(name);
}

/** A short, friendly reason a file type can't be read. */
export function unsupportedReason(name: string): string {
  const ext = (name.match(/\.([a-z0-9]+)$/i)?.[1] ?? '').toLowerCase();
  if (['doc', 'xls', 'ppt'].includes(ext)) return `Loma can't open old .${ext} files. Save it as .${ext}x or PDF and attach that.`;
  if (['mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac'].includes(ext)) return "Loma can't listen to audio files yet.";
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'wmv'].includes(ext)) return "Loma can't watch videos yet. A screenshot of the important part works.";
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return 'Loma can\'t open compressed folders. Unzip it and attach the files inside.';
  return `Loma can't read .${ext || 'this kind of'} files. Try a photo, PDF, Word/Excel/PowerPoint (.docx, .xlsx, .pptx) or text file.`;
}

/** Decodes the XML entities that appear inside Office text. */
export function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** Text of one run of Word/PowerPoint XML: <w:t>/<a:t> pieces, with tabs and line breaks. */
function runsText(xml: string, ns: 'w' | 'a'): string {
  const re = new RegExp(`<${ns}:t(?:\\s[^>]*)?>([\\s\\S]*?)</${ns}:t>|<${ns}:tab\\s*/>|<${ns}:br\\s*/>`, 'g');
  let out = '';
  for (const m of xml.matchAll(re)) {
    if (m[1] !== undefined) out += decodeXml(m[1]);
    else out += m[0].includes(':tab') ? '\t' : '\n';
  }
  return out;
}

/** Text of a Word document's word/document.xml, one paragraph per line. */
export function docxText(xml: string): string {
  const paras = [...xml.matchAll(/<w:p[\s>][\s\S]*?<\/w:p>/g)].map((m) => runsText(m[0], 'w'));
  return paras.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Text of one PowerPoint slide (ppt/slides/slideN.xml), one paragraph per line. */
export function pptxSlideText(xml: string): string {
  const paras = [...xml.matchAll(/<a:p[\s>][\s\S]*?<\/a:p>/g)].map((m) => runsText(m[0], 'a'));
  return paras.filter((p) => p.trim()).join('\n').trim();
}

/** The shared strings table of a spreadsheet (xl/sharedStrings.xml). */
export function xlsxSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => decodeXml(t[1])).join(''),
  );
}

/** One worksheet (xl/worksheets/sheetN.xml) as tab-separated rows. */
export function xlsxSheetText(xml: string, shared: string[]): string {
  const rows: string[] = [];
  for (const row of xml.matchAll(/<row[\s>][\s\S]*?<\/row>/g)) {
    const cells: string[] = [];
    for (const c of row[0].matchAll(/<c(\s[^>]*?)?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = c[1] ?? '';
      const inner = c[2] ?? '';
      const type = attrs.match(/\st="([^"]+)"/)?.[1];
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let text = '';
      if (type === 's' && v !== undefined) text = shared[Number(v)] ?? '';
      else if (type === 'inlineStr') text = [...inner.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((t) => decodeXml(t[1])).join('');
      else if (v !== undefined) text = decodeXml(v);
      cells.push(text);
    }
    if (cells.some((x) => x.trim())) rows.push(cells.join('\t'));
  }
  return rows.join('\n');
}

/** True when the start of a file reads as text (no NUL bytes, few undecodable characters). */
export function looksLikeText(decoded: string): boolean {
  if (!decoded) return false;
  if (decoded.includes('\u0000')) return false;
  const bad = (decoded.match(/�/g) ?? []).length;
  return bad / decoded.length < 0.02;
}

const isFileBlock = (b: ApiBlock) => b.type === 'image' || b.type === 'document';

function blockTitle(b: ApiBlock): string {
  return b.type === 'document' && b.title ? b.title : b.type === 'image' ? 'an image' : 'a file';
}

function base64Size(b: ApiBlock): number {
  return b.type === 'image' || (b.type === 'document' && b.source.type === 'base64') ? b.source.data.length : 0;
}

/**
 * Keeps the conversation inside the Worker's limits: at most FILE_LIMITS.inConversation
 * files and FILE_LIMITS.maxPayloadBase64 of file data. The oldest files are replaced by a
 * short note first; the newest message's files are always kept.
 */
export function fitHistory(history: ApiMessage[]): ApiMessage[] {
  const out = history.map((m) => ({ ...m, content: Array.isArray(m.content) ? [...m.content] : m.content }));
  const fileCount = () => out.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter(isFileBlock).length : 0), 0);
  const payload = () => out.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.reduce((s, b) => s + base64Size(b), 0) : 0), 0);
  for (let i = 0; i < out.length - 1 && (fileCount() > FILE_LIMITS.inConversation || payload() > FILE_LIMITS.maxPayloadBase64); i++) {
    const m = out[i];
    if (!Array.isArray(m.content) || !m.content.some(isFileBlock)) continue;
    m.content = m.content.map((b) =>
      isFileBlock(b) ? { type: 'text' as const, text: `[Earlier the visitor shared ${blockTitle(b)}; it is no longer attached.]` } : b,
    );
  }
  return out;
}

/**
 * The same conversation as plain text, for a Worker that only accepts text messages
 * (the version before file support). Text documents are kept; images and PDFs become a note.
 */
export function toTextOnly(history: ApiMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return history.map((m) => {
    if (typeof m.content === 'string') return { role: m.role, content: m.content };
    const parts = m.content.map((b) => {
      if (b.type === 'text') return b.text;
      if (b.type === 'document' && b.source.type === 'text') return `--- File: ${b.title ?? 'attached file'} ---\n${b.source.data}\n--- End of file ---`;
      return `[The visitor attached ${blockTitle(b)}, but it couldn't be read on this server yet.]`;
    });
    return { role: m.role, content: parts.join('\n\n') };
  });
}

/** True when any message carries a file. */
export function hasFiles(history: ApiMessage[]): boolean {
  return history.some((m) => Array.isArray(m.content) && m.content.some(isFileBlock));
}
