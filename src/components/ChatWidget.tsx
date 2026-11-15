import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Sparkles, RotateCcw, Minus, ChevronUp, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { type ChatMessage, SUGGESTED_PROMPTS, markdownComponents } from '../lib/lvtsChat';
import { useLvtsChat } from '../lib/useLvtsChat';
import ChatComposer, { BubbleFiles } from './ChatComposer';
import { dropProps, useAttachments } from '../lib/useAttachments';

// Loma's chat window on every page (the Loma page has its own full-page chat).
// Three states: closed (the round button), open (the full chat), and minimized
// (a small bar that keeps the conversation and shows Loma's latest reply).
type Mode = 'closed' | 'open' | 'minimized';

/** The last bot message as one plain line, for the minimized bar. */
function preview(messages: ChatMessage[]): string {
  const last = [...messages].reverse().find((m) => m.role === 'bot' && m.text);
  if (!last) return 'Chat minimized';
  return last.text.replace(/[*_`#>[\]()]/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim();
}

export default function ChatWidget({ page }: { page: string }) {
  const [mode, setMode] = useState<Mode>('closed');
  const isOpen = mode === 'open';
  const { messages, input, setInput, isTyping, busy, handleSend, resetChat } = useLvtsChat(mode !== 'closed');
  const files = useAttachments();
  const [dragOver, setDragOver] = useState(false);
  const [seenBotCount, setSeenBotCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const botCount = messages.filter((m) => m.role === 'bot' && !m.streaming).length;
  const unread = mode === 'minimized' && botCount > seenBotCount;

  function open() { setMode('open'); }
  function minimize() { setSeenBotCount(botCount); setMode('minimized'); }

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping, isOpen]);

  // Esc minimizes the open chat.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') minimize(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, botCount]);

  useEffect(() => {
    const lock = (on: boolean) => {
      document.body.style.overflow = on ? 'hidden' : '';
      document.body.style.position = on ? 'fixed' : '';
      document.body.style.width = on ? '100%' : '';
      document.body.classList.toggle('lvts-chat-open', on);
    };
    lock(isOpen);
    return () => lock(false);
  }, [isOpen]);

  if (page === 'ask') return null;

  const headerBtn = { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0 } as const;

  return (
    <>
      {isOpen && (
        <div className="lvts-chat-window" role="dialog" aria-label="Chat with Loma" {...dropProps(files.addFiles, setDragOver)}
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', flexShrink: 0,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', paddingTop: 'max(0.85rem, env(safe-area-inset-top))',
          }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>Loma</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.8)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac', display: 'inline-block' }} />
                Online · LomaVata Tech Services
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={() => { resetChat(); files.clear(); }} aria-label="New chat" title="New chat" style={headerBtn}>
                <RotateCcw size={14} color="#fff" />
              </button>
            )}
            <button onClick={minimize} aria-label="Minimize chat" title="Minimize (keeps your chat)" style={headerBtn}>
              <Minus size={16} color="#fff" />
            </button>
            <button onClick={() => setMode('closed')} aria-label="Close chat" title="Close" style={headerBtn}>
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as never, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem', background: '#f8fafc', position: 'relative' }}>
            {messages.map((m) => <Bubble key={m.id} message={m} />)}
            {isTyping && <TypingDots />}
            {messages.length <= 1 && !isTyping && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {SUGGESTED_PROMPTS.map((p) => (
                  <button key={p} onClick={() => handleSend(p)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {p}
                  </button>
                ))}
                <div style={{ width: '100%', fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
                  Tip: tap the paperclip to ask about a photo, screenshot, PDF, Word, Excel or text file.
                </div>
              </div>
            )}
          </div>

          {dragOver && (
            <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(37,99,235,0.12)', border: '3px dashed #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.8rem 1.2rem', borderRadius: 12, fontWeight: 700, color: '#1d4ed8', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                <Upload size={18} /> Drop files to ask Loma about them
              </div>
            </div>
          )}

          {/* Input */}
          <div style={{ flexShrink: 0, background: '#fff', borderTop: '1px solid #f1f5f9', paddingBottom: 'max(0.7rem, env(safe-area-inset-bottom))' }}>
            <ChatComposer input={input} setInput={setInput} busy={busy} onSend={(t, a) => handleSend(t, a)} files={files} inputRef={inputRef} />
          </div>
        </div>
      )}

      {/* Minimized: a small bar that keeps the chat going */}
      {mode === 'minimized' && (
        <div className="lvts-chat-mini" role="region" aria-label="Loma chat, minimized"
          style={{ position: 'fixed', right: 16, zIndex: 62, width: 'min(320px, calc(100vw - 32px))', background: '#fff', borderRadius: 16, boxShadow: '0 10px 30px rgba(15,23,42,0.22)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.6rem 0.6rem 0.75rem' }}>
          <button onClick={open} aria-label="Open chat with Loma"
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
            <span style={{ position: 'relative', width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="#fff" />
              {unread && <span aria-label="New reply" style={{ position: 'absolute', top: -2, right: -2, width: 11, height: 11, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>
                Loma {isTyping ? '· typing…' : unread ? '· new reply' : ''}
              </span>
              <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {preview(messages)}
              </span>
            </span>
            <ChevronUp size={18} color="#64748b" style={{ flexShrink: 0 }} />
          </button>
          <button onClick={() => setMode('closed')} aria-label="Close chat"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', flexShrink: 0 }}>
            <X size={14} color="#475569" />
          </button>
        </div>
      )}

      {/* Round button: only when the chat is closed */}
      {mode === 'closed' && (
        <button className="lvts-chat-bubble" onClick={open} aria-label="Chat with Loma"
          style={{ position: 'fixed', right: 16, zIndex: 62, width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(124,58,237,0.4)', transition: 'transform 0.15s' }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
          <MessageCircle size={22} color="#fff" />
        </button>
      )}

      <style>{`
        .lvts-chat-bubble, .lvts-chat-mini { bottom: 24px; }
        @media (max-width: 768px) {
          .lvts-chat-bubble, .lvts-chat-mini { bottom: 96px !important; }
        }
        @keyframes lvts-widget-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .lvts-widget-cursor::after {
          content: '▍'; display: inline-block; margin-left: 1px;
          animation: lvts-widget-blink 0.9s step-start infinite; color: #7c3aed;
        }
        @keyframes lvts-widget-blink { 50% { opacity: 0; } }
        .lvts-widget-md pre code { background: transparent; padding: 0; border-radius: 0; }
      `}</style>
    </>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const useMarkdown = !isUser && !message.streaming;
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        className={message.streaming ? 'lvts-widget-cursor' : undefined}
        style={{
          maxWidth: '85%', padding: '0.6rem 0.9rem',
          borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#fff',
          color: isUser ? '#fff' : '#0f172a', fontSize: '0.875rem', lineHeight: 1.6,
          whiteSpace: useMarkdown ? 'normal' : 'pre-wrap', wordBreak: 'break-word',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}
      >
        {message.files && <BubbleFiles files={message.files} />}
        {useMarkdown ? (
          <div className="lvts-widget-md">
            <ReactMarkdown components={markdownComponents}>{message.text}</ReactMarkdown>
          </div>
        ) : message.text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', borderRadius: '14px 14px 14px 3px', padding: '0.7rem 1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#94a3b8', animation: 'lvts-widget-bounce 1.1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  );
}
