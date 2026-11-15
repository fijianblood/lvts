import { useRef, type CSSProperties, type RefObject } from 'react';
import { FileText, FileSpreadsheet, FileImage, File as FileIcon, Paperclip, Send, X, Loader2, AlertCircle } from 'lucide-react';
import type { Attachment } from '../lib/chatFiles';
import type { ChatFile } from '../lib/lvtsChat';
import type { useAttachments } from '../lib/useAttachments';

// The message box for Loma's chat (the chat window and the Ask LvTS page): text,
// a paperclip to attach files, drag-and-drop and paste, and chips for each file.

function FileKindIcon({ kind, size = 15 }: { kind: ChatFile['kind'] | Attachment['kind']; size?: number }) {
  if (kind === 'image') return <FileImage size={size} />;
  if (kind === 'pdf' || kind === 'text') return <FileText size={size} />;
  if (kind === 'office') return <FileSpreadsheet size={size} />;
  return <FileIcon size={size} />;
}

const chip: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem', maxWidth: '100%', padding: '0.3rem 0.4rem 0.3rem 0.55rem',
  borderRadius: 10, fontSize: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155',
};

interface ComposerProps {
  input: string;
  setInput: (v: string) => void;
  busy: boolean;
  onSend: (text: string, attachments: Attachment[]) => void;
  files: ReturnType<typeof useAttachments>;
  inputRef?: RefObject<HTMLInputElement | null>;
  /** Input font size: 16px stops phones zooming in on the chat window. */
  fontSize?: string;
}

export default function ChatComposer({ input, setInput, busy, onSend, files, inputRef, fontSize = '16px' }: ComposerProps) {
  const pickerRef = useRef<HTMLInputElement>(null);
  const { attachments, addFiles, remove, clear } = files;
  const reading = attachments.some((a) => a.status === 'reading');
  const ready = attachments.filter((a) => a.status === 'ready');
  const canSend = !busy && !reading && (input.trim().length > 0 || ready.length > 0);

  function submit() {
    if (!canSend) return;
    onSend(input, ready);
    clear();
  }

  return (
    <div>
      {attachments.length > 0 && (
        <div aria-label="Attached files" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.6rem 0.8rem 0' }}>
          {attachments.map((a) => (
            <span key={a.id} title={a.error ?? a.name}
              style={{ ...chip, ...(a.status === 'error' ? { borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' } : {}) }}>
              {a.status === 'reading' ? <Loader2 size={15} className="lvts-spin" /> : a.status === 'error' ? <AlertCircle size={15} /> : a.previewUrl
                ? <img src={a.previewUrl} alt="" style={{ width: 22, height: 22, objectFit: 'cover', borderRadius: 4 }} />
                : <FileKindIcon kind={a.kind} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                {a.status === 'error' ? a.error : a.name}
              </span>
              <button type="button" onClick={() => remove(a.id)} aria-label={`Remove ${a.name}`}
                style={{ display: 'inline-flex', border: 'none', background: 'none', padding: 2, cursor: 'pointer', color: 'inherit' }}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} style={{ display: 'flex', gap: '0.5rem', padding: '0.7rem 0.8rem 0', alignItems: 'center' }}>
        <input ref={pickerRef} type="file" multiple hidden aria-hidden tabIndex={-1}
          onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }} />
        <button type="button" onClick={() => pickerRef.current?.click()} disabled={busy} aria-label="Attach files"
          title="Attach photos, PDFs, Word, Excel, PowerPoint or text files"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: busy ? 'default' : 'pointer', color: '#475569' }}>
          <Paperclip size={18} />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={(e) => { if (e.clipboardData.files.length) { e.preventDefault(); addFiles(e.clipboardData.files); } }}
          placeholder={ready.length ? 'Ask about your file…' : 'Type a message…'}
          disabled={busy}
          style={{ flex: 1, minWidth: 0, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.65rem 0.9rem', fontSize, color: '#0f172a', outline: 'none', fontFamily: "'Space Grotesk',sans-serif" }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button type="submit" disabled={!canSend} aria-label="Send"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 10, flexShrink: 0, background: canSend ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0', border: 'none', cursor: canSend ? 'pointer' : 'default' }}>
          <Send size={16} color={canSend ? '#fff' : '#94a3b8'} />
        </button>
      </form>
      <style>{`.lvts-spin { animation: lvts-spin 0.9s linear infinite; } @keyframes lvts-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/** The files on a visitor's chat bubble. */
export function BubbleFiles({ files }: { files: ChatFile[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.35rem' }}>
      {files.map((f, i) => f.previewUrl
        ? <img key={i} src={f.previewUrl} alt={f.name} title={f.name} style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)' }} />
        : (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.18)', borderRadius: 8, padding: '0.3rem 0.5rem', fontSize: '0.75rem', maxWidth: '100%' }}>
            <FileKindIcon kind={f.kind} size={14} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{f.name}</span>
          </span>
        ))}
    </div>
  );
}
