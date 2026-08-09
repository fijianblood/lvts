import { useEffect, useRef, useState } from 'react';
import { Send, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { WINDOWS_KNOWLEDGE } from '../data/windowsKnowledge';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}

const WELCOME =
  "Bula! 👋 I'm the LvTS Windows 11 troubleshooting assistant. Ask me about Wi-Fi issues, slow PCs, corrupted files, disk space, blue screens, and more. If I can't help, call LvTS directly on **833 1088**.";

const NO_MATCH =
  "I don't have a canned answer for that one yet — for anything I can't cover, reach LvTS directly on **833 1088 / 746 6941** or lomavatatechfiji@gmail.com, and we'll sort it out.";

const SUGGESTED_PROMPTS = [
  'My Wi-Fi is not connecting',
  'How do I repair corrupted system files?',
  'My screenshots show a black screen',
  'How do I free up disk space?',
  'My PC is really slow',
];

function findAnswer(input: string): string {
  const text = input.toLowerCase();
  let best: { score: number; answer: string } | null = null;
  for (const entry of WINDOWS_KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (text.includes(kw)) score += kw.split(' ').length;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: entry.answer };
  }
  return best ? best.answer : NO_MATCH;
}

const markdownComponents = {
  p: (props: React.ComponentProps<'p'>) => <p style={{ margin: '0 0 0.5em' }} {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }} {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }} {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li style={{ margin: '0.15em 0' }} {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => <strong style={{ fontWeight: 700 }} {...props} />,
  code: (props: React.ComponentProps<'code'>) => (
    <code style={{ background: 'rgba(15,23,42,0.06)', borderRadius: 4, padding: '0.1em 0.35em', fontSize: '0.85em', fontFamily: 'monospace' }} {...props} />
  ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: '0.6em 0.8em', margin: '0.4em 0', overflowX: 'auto', fontSize: '0.82em' }} {...props} />
  ),
};

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

    const answer = findAnswer(trimmed);
    streamMessage(answer, 500);
  }

  function resetChat() {
    setMessages([]);
    setInput('');
    setIsTyping(false);
    streamMessage(WELCOME, 200);
    inputRef.current?.focus();
  }

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.07)', top: '-8%', left: '-5%' }} />
      <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.06)', bottom: '5%', right: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>
          <Sparkles size={14} /> Windows 11 Troubleshooting
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Ask <span className="grad-text">LvTS</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          Type your Windows 11 problem and get step-by-step fixes — Wi-Fi issues, slow PCs, corrupted files, disk space, and more.
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
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>LvTS Windows 11 Assistant</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: '#94a3b8' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
              Online
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={resetChat}
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
        This assistant answers common Windows 11 issues instantly — for anything else, or if a fix doesn't work, call LvTS on 833 1088 / 746 6941.
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
