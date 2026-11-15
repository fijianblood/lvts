// Checks and cleans what the website sends before it goes to Claude.
// Files are uploaded separately (POST /upload, stored in Claude's Files API) and
// messages refer to them by file id, so a chat message stays small and quick to
// check: Cloudflare's free plan allows only about 10 ms of processing per request.
// Only the block types Loma uses get through, rebuilt field by field.
// Plain TypeScript with no Worker or SDK runtime imports, so test/validate.test.ts
// can run it with node --test.

import type { ContentBlockParam, MessageParam } from '@anthropic-ai/sdk/resources/messages';

export const LIMITS = {
  /** Messages kept from the conversation (the newest ones). */
  maxMessages: 12,
  /** Files in one message. */
  maxFilesPerMessage: 5,
  /** Files across the whole conversation that is sent. */
  maxFilesTotal: 8,
  /** Characters in one text block or message. */
  maxTextChars: 20_000,
  /** The whole chat request body, in bytes. Files never travel in it. */
  maxChatBytes: 1_000_000,
  /** Characters of the site's knowledge summary. */
  maxKnowledgeChars: 60_000,
  /** Largest file accepted by POST /upload (Cloudflare's free plan allows 100 MB per request). */
  maxUploadBytes: 50 * 1024 * 1024,
  /** Uploaded files expire after this many seconds (Claude's Files API allows 1 hour to 90 days). */
  fileLifetimeSeconds: 24 * 60 * 60,
};

/** File types /upload accepts: the ones Claude reads as images or documents. */
export const UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'] as const;

const FILE_ID = /^file_[A-Za-z0-9_-]{6,120}$/;

export type Cleaned = { ok: true; messages: MessageParam[]; files: number } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cleanTitle(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : undefined;
}

/** One content block, or an error message. `file` is true for images and documents. */
function cleanBlock(b: unknown, role: 'user' | 'assistant'): { block: ContentBlockParam; file: boolean } | string {
  if (!isObject(b)) return 'a content block is not an object';
  if (b.type === 'text') {
    if (typeof b.text !== 'string' || !b.text.trim()) return 'a text block is empty';
    if (b.text.length > LIMITS.maxTextChars) return 'a text block is too long';
    return { block: { type: 'text', text: b.text }, file: false };
  }
  if (b.type !== 'image' && b.type !== 'document') return `blocks of type "${String(b.type)}" are not accepted`;
  if (role === 'assistant') return 'replies can only contain text';
  const src = b.source;
  if (!isObject(src) || src.type !== 'file' || typeof src.file_id !== 'string') return 'files must be uploaded first and sent by file id';
  if (!FILE_ID.test(src.file_id)) return 'a file id is not valid';
  if (b.type === 'image') return { block: { type: 'image', source: { type: 'file', file_id: src.file_id } }, file: true };
  const title = cleanTitle(b.title);
  return { block: { type: 'document', source: { type: 'file', file_id: src.file_id }, ...(title ? { title } : {}) }, file: true };
}

/** Cleans the conversation the website sends. */
export function cleanMessages(input: unknown): Cleaned {
  if (!Array.isArray(input) || input.length === 0) return { ok: false, error: 'No messages provided' };
  let list = input.slice(-LIMITS.maxMessages);
  // A conversation must start with the visitor.
  while (list.length && (!isObject(list[0]) || list[0].role !== 'user')) list = list.slice(1);
  if (!list.length) return { ok: false, error: 'No messages provided' };

  const out: MessageParam[] = [];
  let files = 0;
  for (const m of list) {
    if (!isObject(m) || (m.role !== 'user' && m.role !== 'assistant')) return { ok: false, error: 'a message has no valid role' };
    const role = m.role;
    if (typeof m.content === 'string') {
      if (!m.content.trim()) return { ok: false, error: 'a message is empty' };
      if (m.content.length > LIMITS.maxTextChars) return { ok: false, error: 'a message is too long' };
      out.push({ role, content: m.content });
      continue;
    }
    if (!Array.isArray(m.content) || m.content.length === 0) return { ok: false, error: 'a message is empty' };
    const blocks: ContentBlockParam[] = [];
    let inMessage = 0;
    for (const b of m.content) {
      const r = cleanBlock(b, role);
      if (typeof r === 'string') return { ok: false, error: r };
      blocks.push(r.block);
      if (r.file) inMessage++;
    }
    if (inMessage > LIMITS.maxFilesPerMessage) return { ok: false, error: `at most ${LIMITS.maxFilesPerMessage} files per message` };
    files += inMessage;
    out.push({ role, content: blocks });
  }
  if (files > LIMITS.maxFilesTotal) return { ok: false, error: `at most ${LIMITS.maxFilesTotal} files in one conversation` };
  if (out[out.length - 1].role !== 'user') return { ok: false, error: 'the last message must be from the visitor' };
  return { ok: true, messages: out, files };
}

/** The site's knowledge summary, trimmed to its limit. */
export function cleanKnowledge(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, LIMITS.maxKnowledgeChars) : '';
}

/** The CORS origin to answer with: the caller's, when it is one of the site's addresses. */
export function allowedOrigin(origin: string | null, allowed: readonly string[]): string {
  return origin && allowed.includes(origin) ? origin : allowed[0];
}

export type UploadCheck = { ok: true; type: (typeof UPLOAD_TYPES)[number]; name: string } | { ok: false; status: number; error: string };

/** Checks an upload's declared size, type and name (from its headers) before any of it is read. */
export function checkUpload(contentLength: string | null, contentType: string | null, fileName: string | null): UploadCheck {
  const size = Number(contentLength);
  if (!contentLength || !Number.isFinite(size) || size <= 0) return { ok: false, status: 411, error: 'The file size is missing' };
  if (size > LIMITS.maxUploadBytes) return { ok: false, status: 413, error: `Files can be up to ${LIMITS.maxUploadBytes / 1024 / 1024} MB` };
  const type = (contentType ?? '').split(';')[0].trim().toLowerCase();
  if (!UPLOAD_TYPES.includes(type as (typeof UPLOAD_TYPES)[number])) return { ok: false, status: 415, error: 'Only images, PDFs and text can be uploaded' };
  let name = 'file';
  try {
    // Removing control characters from the name is the point here.
    // eslint-disable-next-line no-control-regex
    name = decodeURIComponent(fileName ?? '').replace(/[\\/\u0000-\u001f]/g, '_').trim().slice(0, 200) || 'file';
  } catch {
    name = 'file';
  }
  return { ok: true, type: type as (typeof UPLOAD_TYPES)[number], name };
}
