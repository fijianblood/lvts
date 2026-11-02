// The shared world's state for the game: joining while you explore, the other
// players' figures (drawn by the engine), who's here and the chat lines. The
// connection is online.ts; the screens are SharedWorld.tsx. Explore mode only:
// the hunt (and its prize) stays a game you play on your own.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { HouseEngine } from './engine.ts';
import { characterById, firstName, type Look } from './characters.ts';
import { visitorCharacter } from './neighbourhood.ts';
import { WorldLink, type JoinWho, type LinkStatus, type Pub, type ReportWhy } from './online.ts';
import { CHAT } from '../../../workers/neighbourhood/src/chat.ts';

export { SHARED } from './online.ts';
export type { JoinWho, LinkStatus, ReportWhy } from './online.ts';
/** Longest chat message (the server has the final say). */
export const CHAT_MAX = CHAT.maxLength;

export interface WorldPlayer { id: string; label: string; sub?: string }
export interface ChatLine { n: number; kind: 'me' | 'them' | 'sys'; who?: string; text: string }

const STATUS_LINE: Partial<Record<LinkStatus, string>> = {
  full: "The shared world is full right now, so you're exploring on your own. It will try again in a minute.",
  banned: 'LvTS has taken you out of the shared world. You can still explore on your own.',
  offline: "Can't reach the shared world right now, so you're exploring on your own.",
};

/** How another player looks, and the small line under their name. */
function figureOf(p: Pub): { look: Look; crawl: boolean; sub?: string } | null {
  if (p.f) { const c = characterById(p.f); return { look: c.look, crawl: !!c.crawl, sub: `as ${firstName(c)}` }; }
  if (p.l) return { look: visitorCharacter(p.n, p.l, p.id, false).look, crawl: false };
  return null;
}

/**
 * Join the shared world while `who` is set (exploring), and keep the engine's
 * figures, the list of who's here and the chat in step with it.
 */
export function useSharedWorld(engine: HouseEngine | null, who: JoinWho | null) {
  const [status, setStatus] = useState<LinkStatus>('off');
  const [players, setPlayers] = useState<WorldPlayer[]>([]);
  const [me, setMe] = useState<string | null>(null);
  const [lines, setLines] = useState<ChatLine[]>([]);
  const linkRef = useRef<WorldLink | null>(null);
  const seq = useRef(0);
  const whoKey = who ? JSON.stringify(who) : '';

  const add = useCallback((l: Omit<ChatLine, 'n'>) => {
    setLines((ls) => [...ls.slice(-59), { ...l, n: seq.current++ }]);
  }, []);

  useEffect(() => {
    if (!engine || !whoKey) return;
    const w = JSON.parse(whoKey) as JoinWho;
    const names = new Map<string, WorldPlayer>();
    let last: LinkStatus = 'off';
    const sync = () => setPlayers([...names.values()]);
    const clear = () => { engine.remoteClear(); names.clear(); sync(); };
    const addFigure = (p: Pub) => {
      const f = figureOf(p);
      if (!f) return null;
      engine.remoteAdd(p.id, f.look, p.n, f.sub, p.p, f.crawl);
      const wp = { id: p.id, label: p.n, sub: f.sub };
      names.set(p.id, wp);
      return wp;
    };
    const link = new WorldLink(w, () => engine.netPos(), {
      status: (s) => {
        setStatus(s);
        if (s !== 'online' && s !== 'connecting') { clear(); setMe(null); }
        if (s !== last && STATUS_LINE[s]) add({ kind: 'sys', text: STATUS_LINE[s]! });
        last = s;
      },
      welcome: (_you, label, list) => {
        clear();
        list.forEach(addFigure);
        sync();
        setMe(label);
        add({ kind: 'sys', text: `You're in the shared world as ${label}. ${list.length ? `${list.length} other ${list.length === 1 ? 'person is' : 'people are'} exploring too.` : 'Nobody else is here yet.'}` });
      },
      join: (p) => {
        const wp = addFigure(p);
        sync();
        if (wp) add({ kind: 'sys', text: `${wp.label}${wp.sub ? ` (${wp.sub})` : ''} joined` });
      },
      leave: (id) => {
        const wp = names.get(id);
        engine.remoteRemove(id);
        names.delete(id);
        sync();
        if (wp) add({ kind: 'sys', text: `${wp.label} left` });
      },
      moves: (m) => { for (const [id, x, y, z, r] of m) engine.remoteMove(id, [x, y, z, r]); },
      chat: (id, text) => {
        if (id === link.me) { add({ kind: 'me', who: 'You', text }); return; }
        engine.remoteSay(id, text);
        add({ kind: 'them', who: names.get(id)?.label ?? 'Someone', text });
      },
      notice: (text) => add({ kind: 'sys', text }),
    });
    linkRef.current = link;
    link.start();
    return () => {
      link.stop();
      linkRef.current = null;
      engine.remoteClear();
      setPlayers([]); setMe(null); setStatus('off'); setLines([]);
    };
  }, [engine, whoKey, add]);

  /** Say something; a line in the chat says why if it can't go. True if it went. */
  const say = useCallback((text: string) => {
    const why = linkRef.current ? linkRef.current.say(text) : "You're not connected to the shared world right now.";
    if (why) add({ kind: 'sys', text: why });
    return !why;
  }, [add]);
  const report = useCallback((id: string, why: ReportWhy) => { linkRef.current?.report(id, why); }, []);

  return { status, players, me, lines, say, report };
}

export const SHARED_CSS = `
.hh-world-online { background: linear-gradient(135deg,#0891b2,#2563eb); }
.hh-world-connecting { background: rgba(15,23,42,0.6); }
.hh-world-full, .hh-world-offline, .hh-world-banned { background: rgba(71,85,105,0.85); }
.hh-feed { position: absolute; left: 12px; bottom: 16px; width: min(380px, 55%); display: flex; flex-direction: column; gap: 4px; pointer-events: none; }
.hh-is-touch .hh-feed { bottom: 56px; width: calc(100% - 150px); max-width: 380px; }
.hh-feed .hh-line { background: rgba(15,23,42,0.66); color: #f8fafc; animation: hh-fade 12s forwards; }
.hh-feed .hh-line-sys { color: #cbd5e1; }
@keyframes hh-fade { 0%, 82% { opacity: 1; } 100% { opacity: 0; } }
.hh-line { margin: 0; padding: 4px 9px; border-radius: 9px; font-size: 0.8rem; line-height: 1.35; overflow-wrap: anywhere; width: fit-content; max-width: 100%; }
.hh-line b { font-weight: 700; }
.hh-line-me b { color: #93c5fd; }
.hh-line-them b { color: #fde68a; }
.hh-line-sys { font-style: italic; }
.hh-chatbox { position: absolute; left: 12px; bottom: 12px; width: min(400px, 62%); max-height: min(70%, 460px); display: flex; flex-direction: column; background: #fff; color: #0f172a; border-radius: 16px; border: 2px solid #bae6fd; box-shadow: 0 16px 40px rgba(15,23,42,0.3); padding: 10px 12px; z-index: 5; pointer-events: auto; font-size: 0.82rem; }
.hh-is-touch .hh-chatbox { top: 12px; bottom: auto; left: 12px; right: 12px; width: auto; max-height: 52%; }
.hh-chatlog { flex: 1; min-height: 90px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; padding: 2px 0 6px; }
.hh-chatlog .hh-line { background: #f1f5f9; color: #0f172a; }
.hh-chatlog .hh-line-me { background: #eff6ff; }
.hh-chatlog .hh-line-me b { color: #1d4ed8; }
.hh-chatlog .hh-line-them b { color: #b45309; }
.hh-chatlog .hh-line-sys { background: transparent; color: #64748b; padding: 2px 4px; }
.hh-chatlog .hh-line-safe { background: #fefce8; color: #854d0e; font-style: normal; font-size: 0.74rem; }
.hh-chatform { display: flex; gap: 6px; margin-top: 6px; }
.hh-chatform input { flex: 1; min-width: 0; border: 2px solid #e2e8f0; border-radius: 10px; padding: 7px 10px; font: 500 0.9rem 'Space Grotesk', sans-serif; color: #0f172a; }
.hh-chatform input:focus { outline: none; border-color: #2563eb; }
.hh-people { list-style: none; margin: 0; padding: 2px 0 6px; display: grid; gap: 4px; overflow-y: auto; flex: 1; min-height: 90px; }
.hh-people li { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 5px 6px; border-radius: 10px; background: #f8fafc; }
.hh-people-name { flex: 1; min-width: 0; }
.hh-people-name small { color: #64748b; }
.hh-people-none { color: #64748b; font-style: italic; }
.hh-report-btn, .hh-report button { border: 1px solid #fecaca; background: #fff; color: #b91c1c; border-radius: 8px; padding: 3px 8px; font: 600 0.74rem 'Space Grotesk', sans-serif; cursor: pointer; }
.hh-report { display: flex; flex-wrap: wrap; gap: 4px; width: 100%; }
.hh-report .hh-report-cancel { border-color: #e2e8f0; color: #475569; }
@media (prefers-reduced-motion: reduce) { .hh-feed .hh-line { animation: none; } }
`;
