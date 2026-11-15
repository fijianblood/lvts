// Reads files a visitor attaches to Loma's chat, in the browser, and turns each
// into a block the Worker accepts (see chatPayload.ts). Nothing is uploaded
// until the visitor sends the message.
//   - Photos and screenshots: resized to 1568 px on the long side; HEIC/DNG converted.
//   - PDFs: sent whole for Claude to read (text and pages).
//   - Word, Excel and PowerPoint (.docx/.xlsx/.pptx): their text is taken out here.
//   - Text, code, JSON, CSV and other text files: read as text.

import { resolveImageSource } from './imageSource';
import {
  type ApiBlock, type FileKind, FILE_LIMITS, classifyFile, docxText, isKnownTextName, looksLikeText, pptxSlideText,
  unsupportedReason, xlsxSharedStrings, xlsxSheetText,
} from './chatPayload';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  kind: FileKind;
  status: 'reading' | 'ready' | 'error';
  error?: string;
  /** What goes to the Worker. */
  block?: ApiBlock;
  /** A small preview for images (object URL). */
  previewUrl?: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

function dataUrlBase64(dataUrl: string): string {
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

function tooLong(name: string): string {
  return `${name} has more text than Loma can read at once. Split it into smaller files, or attach the part you need.`;
}

async function readImage(file: File): Promise<{ block: ApiBlock; previewUrl: string }> {
  const { url, w, h } = await resolveImageSource(file);
  const scale = Math.min(1, FILE_LIMITS.imageLongSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new window.Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('This image could not be opened.'));
    el.src = url;
  });
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot prepare images.');
  // PNG keeps screenshots and diagrams sharp; photos and everything else become JPEG.
  const keepPng = file.type === 'image/png' && cw * ch <= 1_200_000;
  if (!keepPng) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch); }
  ctx.drawImage(img, 0, 0, cw, ch);
  const mediaType = keepPng ? 'image/png' : 'image/jpeg';
  const data = dataUrlBase64(canvas.toDataURL(mediaType, 0.85));
  return { block: { type: 'image', source: { type: 'base64', media_type: mediaType, data } }, previewUrl: url };
}

async function readOffice(file: File): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const read = (path: string) => zip.file(path)?.async('string') ?? Promise.resolve('');
  const byNumber = (re: RegExp) => Object.keys(zip.files).filter((p) => re.test(p))
    .sort((a, b) => Number(a.match(/(\d+)\.xml$/)?.[1]) - Number(b.match(/(\d+)\.xml$/)?.[1]));
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) return docxText(await read('word/document.xml'));
  if (name.endsWith('.pptx')) {
    const slides = byNumber(/^ppt\/slides\/slide\d+\.xml$/);
    const texts = await Promise.all(slides.map(read));
    return texts.map((t, i) => `Slide ${i + 1}:\n${pptxSlideText(t)}`).join('\n\n');
  }
  const shared = xlsxSharedStrings(await read('xl/sharedStrings.xml'));
  const sheets = byNumber(/^xl\/worksheets\/sheet\d+\.xml$/);
  const texts = await Promise.all(sheets.map(read));
  return texts.map((t, i) => `Sheet ${i + 1}:\n${xlsxSheetText(t, shared)}`).join('\n\n');
}

async function readText(file: File, unknownType: boolean): Promise<string> {
  if (unknownType && file.size > FILE_LIMITS.maxUnknownTextBytes) throw new Error(unsupportedReason(file.name));
  const text = new TextDecoder('utf-8', { fatal: false }).decode(await file.arrayBuffer());
  if (!looksLikeText(text.slice(0, 20000))) throw new Error(unsupportedReason(file.name));
  return text;
}

/** Reads one attached file. Never throws: problems come back as status 'error' with a reason. */
export async function readAttachment(file: File, id: string): Promise<Attachment> {
  const kind = classifyFile(file.name, file.type);
  const base: Attachment = { id, name: file.name, size: file.size, kind, status: 'ready' };
  try {
    if (kind === 'unsupported') throw new Error(unsupportedReason(file.name));
    if (file.size === 0) throw new Error(`${file.name} is empty.`);
    if (file.size > FILE_LIMITS.maxFileBytes) throw new Error(`${file.name} is too large (over 25 MB).`);
    if (kind === 'image') {
      const { block, previewUrl } = await readImage(file);
      return { ...base, block, previewUrl };
    }
    if (kind === 'pdf') {
      if (file.size > FILE_LIMITS.maxPdfBytes) throw new Error(`${file.name} is too large: PDFs can be up to 15 MB.`);
      const data = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
      return { ...base, block: { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data }, title: file.name } };
    }
    const knownText = kind === 'office' || isKnownTextName(file.name) || file.type.startsWith('text/');
    const text = kind === 'office' ? await readOffice(file) : await readText(file, !knownText);
    if (!text.trim()) throw new Error(`Loma couldn't find any text in ${file.name}.`);
    if (text.length > FILE_LIMITS.maxTextChars) throw new Error(tooLong(file.name));
    return { ...base, block: { type: 'document', source: { type: 'text', media_type: 'text/plain', data: text }, title: file.name } };
  } catch (e) {
    return { ...base, status: 'error', error: e instanceof Error ? e.message : `Loma couldn't read ${file.name}.` };
  }
}
