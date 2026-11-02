// The shared world on screen: the 🌐 pill, the chat lines over the game, and the
// chat box with who's here and a report button. The state is useSharedWorld.ts.

import { useEffect, useRef, useState } from 'react';
import { REPORT_WHY } from './online.ts';
import type { ChatLine, LinkStatus, ReportWhy, WorldPlayer } from './useSharedWorld.ts';

const REPORT_LABEL: Record<ReportWhy, string> = {
  rude: 'Rude or mean',
  personal: 'Personal details',
  spam: 'Spamming',
  other: 'Something else',
};

/** The pill in the top corner: how many are here, or that you're on your own. */
export function WorldPill({ status, count }: { status: LinkStatus; count: number }) {
  if (status === 'off') return null;
  const text = status === 'online' ? `🌐 ${count + 1} here` : status === 'connecting' ? '🌐 Joining…' : '🌐 On your own';
  const title = status === 'online' ? `${count + 1} ${count ? 'people' : 'person'} in the shared world (you included). T or 💬 to chat.` : status === 'connecting' ? 'Joining the shared world' : 'Not in the shared world right now';
  return <span className={`hh-pill hh-world hh-world-${status}`} title={title}>{text}</span>;
}

/** The last few chat lines over the game, fading out (the chat box shows them all). */
export function ChatFeed({ lines }: { lines: ChatLine[] }) {
  const shown = lines.slice(-5);
  if (!shown.length) return null;
  return (
    <div className="hh-feed" aria-live="polite">
      {shown.map((l) => <ChatRow key={l.n} line={l} />)}
    </div>
  );
}

function ChatRow({ line }: { line: ChatLine }) {
  if (line.kind === 'sys') return <p className="hh-line hh-line-sys">{line.text}</p>;
  return <p className={`hh-line hh-line-${line.kind}`}><b>{line.who}:</b> {line.text}</p>;
}

/**
 * The chat box: everything said since you came, who's here (with a report button), and a line to type in.
 * On a computer it closes after each message (so the keys walk you again); on a phone it stays open.
 */
export function ChatPanel({ lines, players, me, maxLength, onSay, onReport, onClose, touch }: {
  lines: ChatLine[]; players: WorldPlayer[]; me: string | null; maxLength: number;
  onSay: (text: string) => boolean; onReport: (id: string, why: ReportWhy) => void; onClose: () => void; touch: boolean;
}) {
  const closeOnSend = !touch;
  const [text, setText] = useState('');
  const [tab, setTab] = useState<'chat' | 'people'>('chat');
  const [reporting, setReporting] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  // Escape closes it even when the typing line isn't focused (keys pressed inside the box are handled below)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [lines, tab]);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) { if (closeOnSend) onClose(); return; }
    if (onSay(text)) { setText(''); if (closeOnSend) onClose(); }
  };

  return (
    <div className="hh-chatbox" role="dialog" aria-label="Chat" onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); onClose(); } }}>
      <div className="hh-chores-head">
        <div className="hh-seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'chat'} className={tab === 'chat' ? 'on' : ''} onClick={() => setTab('chat')}>💬 Chat</button>
          <button type="button" role="tab" aria-selected={tab === 'people'} className={tab === 'people' ? 'on' : ''} onClick={() => setTab('people')}>👥 Here ({players.length + 1})</button>
        </div>
        <button type="button" className="hh-talk-x" onPointerDown={(e) => { e.stopPropagation(); onClose(); }} aria-label="Close the chat">✕</button>
      </div>
      {tab === 'chat' ? (
        <div className="hh-chatlog" ref={logRef}>
          <p className="hh-line hh-line-safe">Be kind: kids play here too. Never share your phone number, where you live, your school or social media. Report anyone who makes you uncomfortable.</p>
          {lines.map((l) => <ChatRow key={l.n} line={l} />)}
        </div>
      ) : (
        <ul className="hh-people">
          <li><span className="hh-people-name"><b>{me ?? 'You'}</b> <small>(you)</small></span></li>
          {players.map((p) => (
            <li key={p.id}>
              <span className="hh-people-name"><b>{p.label}</b>{p.sub && <small> {p.sub}</small>}</span>
              {reporting === p.id ? (
                <span className="hh-report">
                  {REPORT_WHY.map((w) => <button key={w} type="button" onClick={() => { onReport(p.id, w); setReporting(null); setTab('chat'); if (!touch) inputRef.current?.focus(); }}>{REPORT_LABEL[w]}</button>)}
                  <button type="button" className="hh-report-cancel" onClick={() => setReporting(null)}>Cancel</button>
                </span>
              ) : (
                <button type="button" className="hh-report-btn" onClick={() => setReporting(p.id)} aria-label={`Report ${p.label} to LvTS`}>🚩 Report</button>
              )}
            </li>
          ))}
          {!players.length && <li className="hh-people-none">Nobody else is exploring right now.</li>}
        </ul>
      )}
      <form className="hh-chatform" onSubmit={send}>
        <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} maxLength={maxLength} placeholder="Say something friendly…" aria-label="Chat message" autoComplete="off" enterKeyHint="send" />
        <button type="submit" className="hh-btn hh-btn-sm">Send</button>
      </form>
    </div>
  );
}
