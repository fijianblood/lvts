import { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { type ChatMessage, SUGGESTED_PROMPTS, markdownComponents } from '../lib/lvtsChat';
import { useLvtsChat } from '../lib/useLvtsChat';
import ChatComposer, { BubbleFiles } from '../components/ChatComposer';
import { dropProps, useAttachments } from '../lib/useAttachments';

export default function AskLvtsPage() {
  const { messages, input, setInput, isTyping, busy, handleSend, resetChat } = useLvtsChat(true);
  const files = useAttachments();
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.07)', top: '-8%', left: '-5%' }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.06)', bottom: '5%', right: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> Loma
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Ask <span className="grad-text">LvTS</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          PC & laptop repairs, Windows 11 troubleshooting, websites, or our online store — ask away, or get straight through to a real person on WhatsApp.
        </p>
      </div>

      <div
        {...dropProps(files.addFiles, setDragOver)}
        style={{
          maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column',
          height: '65vh', minHeight: 480, maxHeight: 720,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(15,23,42,0.12)', overflow: 'hidden', position: 'relative',
        }}
      >
        {/* Chat header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '1rem 1.3rem', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Sparkles size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>Loma</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94a3b8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Online
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => { resetChat(); files.clear(); inputRef.current?.focus(); }}
              aria-label="Ask another question"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 999, padding: '0.4rem 0.75rem',
                fontSize: '0.72rem', fontWeight: 600, color: '#334155', cursor: 'pointer',
                fontFamily: "'Space Grotesk',sans-serif", flexShrink: 0, transition: 'border-color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#faf5ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
            >
              <RotateCcw size={13} /> New question
            </button>
          )}
        </div>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {messages.map(m => <Bubble key={m.id} message={m} />)}
          {isTyping && <TypingDots />}

          {messages.length <= 1 && !isTyping && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {SUGGESTED_PROMPTS.map(p => (
                <button key={p} onClick={() => handleSend(p)}
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 999, padding: '0.5rem 0.9rem', fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontFamily: "'Space Grotesk',sans-serif", transition: 'border-color 0.15s, background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.background = '#faf5ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>

        {dragOver && (
          <div aria-hidden style={{ position: 'absolute', inset: 0, zIndex: 2, background: 'rgba(37,99,235,0.12)', border: '3px dashed #2563eb', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#fff', padding: '0.8rem 1.2rem', borderRadius: 12, fontWeight: 700, color: '#1d4ed8' }}>
              <Upload size={18} /> Drop files to ask Loma about them
            </div>
          </div>
        )}

        {/* Input bar */}
        <div style={{ borderTop: '1px solid #f1f5f9', flexShrink: 0, background: '#fff', paddingBottom: '0.8rem' }}>
          <ChatComposer input={input} setInput={setInput} busy={busy} onSend={(t, a) => handleSend(t, a)} files={files} inputRef={inputRef} fontSize="0.9rem" />
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', padding: '0.45rem 1rem 0' }}>
            Attach a photo, screenshot, PDF, Word, Excel, PowerPoint or text file and ask about it. Files go to Loma’s AI (Claude, by Anthropic) to answer you; LvTS doesn’t keep them.
          </div>
        </div>
      </div>

      <p style={{ maxWidth: 700, margin: '0.9rem auto 0', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
        This assistant answers common questions instantly — for anything else, WhatsApp <a href="https://wa.me/6797466941" target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', fontWeight: 600 }}>746 6941</a> or call 833 1088.
      </p>

      <style>{`
        @keyframes lvts-typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .lvts-cursor::after {
          content: '▍';
          display: inline-block;
          margin-left: 1px;
          animation: lvts-blink 0.9s step-start infinite;
          color: #7c3aed;
        }
        @keyframes lvts-blink { 50% { opacity: 0; } }
        .lvts-md pre code { background: transparent; padding: 0; border-radius: 0; }
      `}</style>
    </section>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const useMarkdown = !isUser && !message.streaming;
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        className={message.streaming ? 'lvts-cursor' : undefined}
        style={{
          maxWidth: '78%', padding: '0.65rem 0.95rem', borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#f1f5f9',
          color: isUser ? '#fff' : '#0f172a', fontSize: '0.88rem', lineHeight: 1.6,
          whiteSpace: useMarkdown ? 'normal' : 'pre-wrap', wordBreak: 'break-word',
        }}
      >
        {message.files && <BubbleFiles files={message.files} />}
        {useMarkdown ? (
          <div className="lvts-md">
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', borderRadius: '14px 14px 14px 3px', padding: '0.75rem 1rem' }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%', background: '#94a3b8',
            animation: 'lvts-typing-bounce 1.1s ease-in-out infinite', animationDelay: `${i * 0.15}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
