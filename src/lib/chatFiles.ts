// Reads files a visitor attaches to Loma's chat, prepares them in the browser and
// uploads each one to Loma's Worker (stored for 24 hours in Claude's Files API).
// The message then refers to the file by its id (see chatPayload.ts).
//   - Photos and screenshots: resized to 1568 px on the long side; HEIC/DNG converted.
//   - PDFs: sent whole for Claude to read (text and pages), up to 50 MB.
//   - Word, Excel and PowerPoint (.docx/.xlsx/.pptx): their text is taken out here.
//   - Text, code, JSON, CSV and other text files: read as text.

import { resolveImageSource } from './imageSource';
import {
  type ApiBlock, type FileKind, FILE_LIMITS, classifyFile, docxText, isKnownTextName, looksLikeText, pptxSlideText,
  unsupportedReason, xlsxSharedStrings, xlsxSheetText,
} from './chatPayload';
import { WorkerError, isOldWorker, uploadFile } from './lomaApi';

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

function tooLong(name: string): string {
  return `${name} has more text than Loma can read at once. Split it into smaller files, or attach the part you need.`;
}

async function prepareImage(file: File): Promise<{ blob: Blob; type: 'image/jpeg' | 'image/png'; previewUrl: string }> {
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
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (!blob) throw new Error('This image could not be prepared.');
  return { blob, type, previewUrl: url };
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

/** Turns an upload problem into words for the visitor. */
function uploadProblem(err: unknown, name: string): string {
  if (err instanceof WorkerError) return `${name}: ${err.message}.`;
  return `${name} couldn't be uploaded. Check your connection and try again.`;
}

/** Reads and uploads one attached file. Never throws: problems come back as status 'error' with a reason. */
export async function readAttachment(file: File, id: string): Promise<Attachment> {
  const kind = classifyFile(file.name, file.type);
  const base: Attachment = { id, name: file.name, size: file.size, kind, status: 'ready' };
  try {
    if (kind === 'unsupported') throw new Error(unsupportedReason(file.name));
    if (file.size === 0) throw new Error(`${file.name} is empty.`);
    if (file.size > FILE_LIMITS.maxFileBytes) throw new Error(`${file.name} is too large: files can be up to 50 MB.`);

    if (kind === 'image' || kind === 'pdf') {
      if (kind === 'pdf' && file.size > FILE_LIMITS.maxPdfBytes) throw new Error(`${file.name} is too large: PDFs can be up to 50 MB.`);
      const prepared = kind === 'image' ? await prepareImage(file) : { blob: file as Blob, type: 'application/pdf', previewUrl: undefined };
      try {
        const fileId = await uploadFile(prepared.blob, file.name, prepared.type);
        const block: ApiBlock = kind === 'image'
          ? { type: 'image', source: { type: 'file', file_id: fileId }, title: file.name }
          : { type: 'document', source: { type: 'file', file_id: fileId }, title: file.name };
        return { ...base, block, previewUrl: prepared.previewUrl };
      } catch (err) {
        if (isOldWorker(err)) throw new Error(`Loma can't read photos and PDFs just yet: that update is on its way. Text, Word and Excel files work now.`);
        throw new Error(uploadProblem(err, file.name));
      }
    }

    const knownText = kind === 'office' || isKnownTextName(file.name) || file.type.startsWith('text/');
    const text = kind === 'office' ? await readOffice(file) : await readText(file, !knownText);
    if (!text.trim()) throw new Error(`Loma couldn't find any text in ${file.name}.`);
    if (text.length > FILE_LIMITS.maxTextChars) throw new Error(tooLong(file.name));
    try {
      const fileId = await uploadFile(new Blob([text], { type: 'text/plain' }), `${file.name}.txt`, 'text/plain');
      return { ...base, block: { type: 'document', source: { type: 'file', file_id: fileId }, title: file.name } };
    } catch (err) {
      // The older Worker can't store files: send the text inside the message instead.
      if (isOldWorker(err)) return { ...base, block: { type: 'document', source: { type: 'text', media_type: 'text/plain', data: text }, title: file.name } };
      throw new Error(uploadProblem(err, file.name));
    }
  } catch (e) {
    return { ...base, status: 'error', error: e instanceof Error ? e.message : `Loma couldn't read ${file.name}.` };
  }
}
