import { useRef, useState, type DragEvent } from 'react';
import { readAttachment, type Attachment } from './chatFiles';
import { FILE_LIMITS } from './chatPayload';
import { uid } from './lvtsChat';

// Files attached in Loma's chat before they are sent (used by ChatComposer).

/** Attached files waiting to be sent, and the actions on them. */
export function useAttachments() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  // The latest list, so several quick adds can't go over the limit before React re-renders.
  const latest = useRef<Attachment[]>([]);

  function update(next: (cur: Attachment[]) => Attachment[]) {
    latest.current = next(latest.current);
    setAttachments(latest.current);
  }

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    const room = FILE_LIMITS.perMessage - latest.current.filter((a) => a.status !== 'error').length;
    const taken = files.slice(0, Math.max(0, room));
    const extra = files.slice(taken.length);
    const pending = taken.map((f) => ({ id: uid(), file: f }));
    update((cur) => [
      ...cur,
      ...pending.map((p): Attachment => ({ id: p.id, name: p.file.name, size: p.file.size, kind: 'text', status: 'reading' })),
      ...extra.map((f): Attachment => ({ id: uid(), name: f.name, size: f.size, kind: 'unsupported', status: 'error', error: `Only ${FILE_LIMITS.perMessage} files can be sent at once.` })),
    ]);
    for (const p of pending) {
      void readAttachment(p.file, p.id).then((done) => update((cur) => cur.map((a) => (a.id === p.id ? done : a))));
    }
  }

  const remove = (id: string) => update((cur) => cur.filter((a) => a.id !== id));
  const clear = () => update(() => []);
  return { attachments, addFiles, remove, clear };
}

/** Props for an element that accepts dropped files (the chat window or panel). */
export function dropProps(addFiles: (f: FileList) => void, setOver: (v: boolean) => void) {
  return {
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes('Files')) { e.preventDefault(); setOver(true); } },
    onDragLeave: (e: DragEvent) => { if (e.currentTarget === e.target) setOver(false); },
    onDrop: (e: DragEvent) => { if (e.dataTransfer.files.length) { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); } },
  };
}
