// Checks and cleans what the website sends before it goes to Claude.
// Only the block types Loma uses get through (text, images, PDFs, plain-text
// documents), rebuilt field by field so nothing else can be smuggled in.
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
  /** Base64 length of one image (about 5 MB of image). */
  maxImageBase64: 7_000_000,
  /** Base64 length of one PDF (about 15 MB of PDF). */
  maxPdfBase64: 20_000_000,
  /** Characters in one text block or plain-text document. */
  maxTextChars: 400_000,
  /** The whole request body, in bytes (Claude's limit is 32 MB per request). */
  maxBodyBytes: 30_000_000,
  /** Characters of the site's knowledge summary. */
  maxKnowledgeChars: 60_000,
};

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export type Cleaned = { ok: true; messages: MessageParam[]; files: number } | { ok: false; error: string };

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function cleanTitle(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, 200) : undefined;
}

/** One content block, or an error message. `files` counts images and documents. */
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
  if (!isObject(src)) return 'a file has no source';
  if (b.type === 'image') {
    if (src.type !== 'base64' || typeof src.data !== 'string') return 'images must be sent as base64';
    if (!IMAGE_TYPES.includes(src.media_type as ImageType)) return 'images must be JPEG, PNG, GIF or WebP';
    if (src.data.length > LIMITS.maxImageBase64) return 'an image is too large';
    if (!BASE64.test(src.data)) return 'an image is not valid base64';
    return { block: { type: 'image', source: { type: 'base64', media_type: src.media_type as ImageType, data: src.data } }, file: true };
  }
  if (b.type === 'document') {
    const title = cleanTitle(b.title);
    if (src.type === 'base64') {
      if (src.media_type !== 'application/pdf' || typeof src.data !== 'string') return 'documents sent as base64 must be PDFs';
      if (src.data.length > LIMITS.maxPdfBase64) return 'a PDF is too large';
      if (!BASE64.test(src.data)) return 'a PDF is not valid base64';
      return { block: { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: src.data }, ...(title ? { title } : {}) }, file: true };
    }
    if (src.type === 'text') {
      if (typeof src.data !== 'string' || !src.data.trim()) return 'a text document is empty';
      if (src.data.length > LIMITS.maxTextChars) return 'a text document is too long';
      return { block: { type: 'document', source: { type: 'text', media_type: 'text/plain', data: src.data }, ...(title ? { title } : {}) }, file: true };
    }
    return 'documents must be PDFs or plain text';
  }
  return `blocks of type "${String(b.type)}" are not accepted`;
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
