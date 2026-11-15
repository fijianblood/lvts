// Talking to Loma's Worker (workers/loma): the chat and file uploads.

export const WORKER_URL = 'https://lvts-loma.lomavatatechfiji.workers.dev/';

/** A problem the Worker explained (for example a file Claude couldn't read). Shown to the visitor. */
export class WorkerError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** True for the Worker version before file support, which answers every POST with this. */
export const isOldWorker = (err: unknown) => err instanceof WorkerError && err.status === 400 && /No messages provided/.test(err.message);

/** Sends the conversation; returns Loma's reply text. */
export async function postChat(messages: unknown, knowledge: string): Promise<string> {
  const response = await fetch(WORKER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, knowledge }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new WorkerError(response.status, data?.error?.message ?? `Worker error: ${response.status}`);
  const content = data?.content;
  if (Array.isArray(content)) {
    const textBlock = content.find((b: { type: string }) => b.type === 'text');
    if (textBlock?.text) return textBlock.text;
  }
  throw new Error('No text in response');
}

/** Uploads one file (it expires after 24 hours); returns its file id. */
export async function uploadFile(blob: Blob, name: string, type: string): Promise<string> {
  const response = await fetch(`${WORKER_URL}upload`, {
    method: 'POST',
    headers: { 'Content-Type': type, 'X-File-Name': encodeURIComponent(name) },
    body: blob,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || typeof data?.file_id !== 'string') {
    throw new WorkerError(response.status, data?.error?.message ?? `Upload failed: ${response.status}`);
  }
  return data.file_id;
}
