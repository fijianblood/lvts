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
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  if (page === 'ask') return null;

  return (
    <>
      {isOpen && (
        <div
          style={{
            position: 'fixed', bottom: 96, right: 16, zIndex: 61,
            width: 360, maxWidth: 'calc(100vw - 32px)',
            height: 500, maxHeight: 'calc(100vh - 180px)',
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18,
            boxShadow: '0 20px 60px rgba(15,23,42,0.25)', overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.85rem 1rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.85rem' }}>Loma</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Online
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { resetChat(); inputRef.current?.focus(); }}
                aria-label="Ask another question"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0 }}
              >
                <RotateCcw size={13} color="#334155" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', flexShrink: 0 }}
            >
              <X size={14} color="#334155" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {messages.map(m => <Bubble key={m.id} message={m} />)}
            {isTyping && <TypingDots />}

            {messages.length <= 1 && !isTyping && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
                {SUGGESTED_PROMPTS.map(p => (
                  <button key={p} onClick={() => handleSend(p)}
                    style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '0.4rem 0.7rem', fontSize: '0.72rem', color: '#334155', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", transition: 'border-color 0.15s, background 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#faf5ff'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={e => { e.preventDefault(); handleSend(input); }}
            style={{ display: 'flex', gap: '0.5rem', padding: '0.7rem 0.8rem', borderTop: '1px solid #f1f5f9', flexShrink: 0, background: '#fff' }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message…"
              disabled={busy}
              style={{
                flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
                padding: '0.55rem 0.8rem', fontSize: '0.82rem', color: '#0f172a', outline: 'none',
                fontFamily: "'Space Grotesk',sans-serif", transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.15)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none'; }}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Send"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !busy ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0',
                border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'default', transition: 'opacity 0.2s',
              }}
            >
              <Send size={15} color={input.trim() && !busy ? '#fff' : '#94a3b8'} />
            </button>
          </form>
        </div>
      )}

      {/* Bubble toggle */}
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Close chat' : 'Chat with Loma'}
        style={{
          position: 'fixed', bottom: 20, right: 16, zIndex: 61,
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
          maxWidth: '85%', padding: '0.55rem 0.8rem', borderRadius: isUser ? '13px 13px 3px 13px' : '13px 13px 13px 3px',
          background: isUser ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#f1f5f9',
          color: isUser ? '#fff' : '#0f172a', fontSize: '0.8rem', lineHeight: 1.55,
          whiteSpace: useMarkdown ? 'normal' : 'pre-wrap', wordBreak: 'break-word',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', borderRadius: '13px 13px 13px 3px', padding: '0.65rem 0.9rem' }}>
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
