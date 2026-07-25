import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { getBotReply, SUGGESTED_PROMPTS } from '../lib/askBotEngine';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}

const WELCOME = "Bula! 👋 I'm the LvTS virtual assistant. Ask me about repairs, web design, pricing, rewards, or how to reach Joe — happy to help.";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function AskLvtsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasWelcomed = useRef(false);
  const busy = isTyping || messages.some(m => m.streaming);

  useEffect(() => {
    inputRef.current?.focus();
    if (hasWelcomed.current) return;
    hasWelcomed.current = true;
    return streamMessage(WELCOME, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  function streamMessage(fullText: string, initialDelay = 0) {
    const id = uid();
    let interval: ReturnType<typeof setInterval> | null = null;
    const timeout = window.setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id, role: 'bot', text: '', streaming: true }]);
      let i = 0;
      interval = setInterval(() => {
        i += Math.random() < 0.3 ? 2 : 1;
        const chunk = fullText.slice(0, i);
        setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: chunk } : m)));
        if (i >= fullText.length) {
          if (interval) clearInterval(interval);
          setMessages(prev => prev.map(m => (m.id === id ? { ...m, text: fullText, streaming: false } : m)));
        }
      }, 18);
    }, initialDelay);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setMessages(prev => [...prev, { id: uid(), role: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    const reply = getBotReply(trimmed);
    const thinkDelay = 500 + Math.random() * 500;
    streamMessage(reply, thinkDelay);
  }

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.07)', top: '-8%', left: '-5%' }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.06)', bottom: '5%', right: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> Virtual Assistant
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Ask <span className="grad-text">LvTS</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          Chat with our assistant about services, pricing, or anything else on the site.
        </p>
      </div>

      <div
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
          <div>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>LvTS Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94a3b8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Online
            </div>
          </div>
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

        {/* Input bar */}
        <form
          onSubmit={e => { e.preventDefault(); handleSend(input); }}
          style={{ display: 'flex', gap: '0.6rem', padding: '0.9rem 1rem', borderTop: '1px solid #f1f5f9', flexShrink: 0, background: '#fff' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={busy}
            style={{
              flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '0.7rem 1rem', fontSize: '0.9rem', color: '#0f172a', outline: 'none',
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: input.trim() && !busy ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0',
              border: 'none', cursor: input.trim() && !busy ? 'pointer' : 'default', transition: 'opacity 0.2s',
            }}
          >
            <Send size={17} color={input.trim() && !busy ? '#fff' : '#94a3b8'} />
          </button>
        </form>
      </div>

      <p style={{ maxWidth: 700, margin: '0.9rem auto 0', textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
        This assistant answers from what's on the site — for anything else, reach Joe directly via the Contact page.
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
      `}</style>
    </section>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div
        className={message.streaming ? 'lvts-cursor' : undefined}
        style={{
          maxWidth: '78%', padding: '0.65rem 0.95rem', borderRadius: isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
          background: isUser ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#f1f5f9',
          color: isUser ? '#fff' : '#0f172a', fontSize: '0.88rem', lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      >
        {message.text}
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
