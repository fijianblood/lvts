import { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { type ChatMessage, SUGGESTED_PROMPTS, markdownComponents } from '../lib/lvtsChat';
import { useLvtsChat } from '../lib/useLvtsChat';

export default function ChatWidget({ page }: { page: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, input, setInput, isTyping, busy, handleSend, resetChat } = useLvtsChat(isOpen);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.classList.add('lvts-chat-open');
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.classList.remove('lvts-chat-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.classList.remove('lvts-chat-open');
    };
  }, [isOpen]);

  if (page === 'ask') return null;

  return (
    <>
      {isOpen && (
        <div
          className="lvts-chat-window"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.85rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
            paddingTop: 'max(0.85rem, env(safe-area-inset-top))',
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
              <button
                onClick={() => { resetChat(); }}
                aria-label="New chat"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0 }}
              >
                <RotateCcw size={14} color="#fff" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={16} color="#fff" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch' as never,
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              background: '#f8fafc',
            }}
          >
            {messages.map(m => <Bubble key={m.id} message={m} />)}
            {isTyping && <TypingDots />}

            {messages.length <= 1 && !isTyping && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => handleSend(p)}
                    style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 999, padding: '0.5rem 0.9rem', fontSize: '0.8rem', color: '#334155', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif" }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            flexShrink: 0,
            background: '#fff',
            borderTop: '1px solid #f1f5f9',
            paddingBottom: 'max(0.7rem, env(safe-area-inset-bottom))',
          }}>
            <form
              onSubmit={e => { e.preventDefault(); handleSend(input); }}
              style={{ display: 'flex', gap: '0.5rem', padding: '0.7rem 0.8rem 0' }}
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type a message…"
                disabled={busy}
                style={{
                  flex: 1,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: '0.65rem 0.9rem',
                  fontSize: '16px',
                  color: '#0f172a',
                  outline: 'none',
                  fontFamily: "'Space Grotesk',sans-serif",
                  WebkitAppearance: 'none' as never,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label="Send"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                  background: input.trim() && !busy ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0',
                  border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'default',
                }}
              >
                <Send size={16} color={input.trim() && !busy ? '#fff' : '#94a3b8'} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bubble toggle — hidden when chat is open on mobile */}
      <button
        className="lvts-chat-bubble"
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close chat' : 'Chat with Loma'}
        style={{
          position: 'fixed', right: 16, zIndex: 62,
          width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.08)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {isOpen ? <X size={22} color="#fff" /> : <MessageCircle size={22} color="#fff" />}
      </button>

      <style>{`
        /* Desktop */
        .lvts-chat-bubble { bottom: 24px; }

        /* Mobile */
        @media (max-width: 768px) {
          .lvts-chat-bubble { bottom: 96px !important; }

          /* Hide bubble when chat is open */
          .lvts-chat-open .lvts-chat-bubble {
            display: none !important;
          }
        }

        @keyframes lvts-widget-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .lvts-widget-cursor::after {
          content: '▍';
          display: inline-block;
          margin-left: 1px;
          animation: lvts-widget-blink 0.9s step-start infinite;
          color: #7c3aed;
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
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: '50%', background: '#94a3b8',
            animation: 'lvts-widget-bounce 1.1s ease-in-out infinite', animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
