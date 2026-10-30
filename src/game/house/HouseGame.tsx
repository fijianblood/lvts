import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HouseEngine, type RunResult, type PerkPill, type TalkStart } from './engine.ts';
import { opening, questions, quiz, farewell, address, type Say, type Question, type Quiz } from './talk.ts';
import { PLACES, TOOLS, ITEMS, availableChores } from './chores.ts';
import type { ChoreSnapshot, Work } from './choreSystem.ts';
import type { Character } from './characters.ts';
import { CONTEST, prizeState, claimSteps } from './contest.ts';
import { COLLECTIBLES } from './layout.ts';
import { CHARACTERS, GROUPS, characterById, firstName, type CharacterGroup, type Look } from './characters.ts';

type Phase = 'intro' | 'playing' | 'paused' | 'won' | 'nogl';
type PauseReason = 'lock-lost' | 'poster' | 'manual';

const BEST_KEY = 'lvts_househunt_best_v1';
const MUTE_KEY = 'lvts_househunt_muted_v1';
const CHAR_KEY = 'lvts_househunt_character_v1';

function readChar(): string {
  try { return characterById(localStorage.getItem(CHAR_KEY) ?? 'josese').id; } catch { return 'josese'; }
}

/** A small low-poly portrait drawn from the same look as the 3D figure. */
function Portrait({ look, size = 52 }: { look: Look; size?: number }) {
  const baby = look.kind === 'baby';
  const head = baby ? { x: 14, y: 11, w: 32, h: 30 } : { x: 17, y: 13, w: 26, h: 27 };
  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden focusable="false">
      <rect width="60" height="60" rx="14" fill="#eef2ff" />
      <path d="M7 60 Q8 44 30 42 Q52 44 53 60 Z" fill={look.shirt} stroke="rgba(15,23,42,0.12)" />
      {look.print && <rect x="26" y="50" width="8" height="5" fill={look.print} />}
      <rect x="26" y="36" width="8" height="8" fill={look.skin} />
      <rect x={head.x} y={head.y} width={head.w} height={head.h} rx="5" fill={look.skin} />
      {look.hairStyle === 'afro'
        ? <rect x="12" y="4" width="36" height="19" rx="9" fill={look.hair} />
        : <rect x={head.x - 1} y={head.y - 2} width={head.w + 2} height={baby ? 5 : 8} rx="3" fill={look.hair} />}
      {look.hairStyle === 'bun' && <circle cx="30" cy="9" r="5.5" fill={look.hair} />}
      {look.hairStyle === 'long' && <path d={`M${head.x - 2} ${head.y + 2} h4 v${head.h + 2} h-4 z M${head.x + head.w - 2} ${head.y + 2} h4 v${head.h + 2} h-4 z`} fill={look.hair} />}
      {look.streak && <path d="M24.5 11 v7 M35.5 11 v7" stroke={look.streak} strokeWidth="1.5" strokeLinecap="round" />}
      {look.earrings && <><circle cx={head.x - 0.5} cy="31" r="1.8" fill={look.earrings} /><circle cx={head.x + head.w + 0.5} cy="31" r="1.8" fill={look.earrings} /></>}
      {look.beard && <path d="M16 27 h28 v7 q-14 11 -28 0 z" fill={look.hair} />}
      <rect x={baby ? 22 : 23} y={baby ? 25 : 24} width="3.5" height="3" fill="#1a1412" />
      <rect x={baby ? 34.5 : 33.5} y={baby ? 25 : 24} width="3.5" height="3" fill="#1a1412" />
      {!look.beard && <rect x="27" y={baby ? 33 : 32} width="6" height="1.6" rx="0.8" fill="#5a2f22" />}
    </svg>
  );
}
const BASE = import.meta.env.BASE_URL;

/** One line of conversation: the speaker in bold, a Qur'an or hadith reference in small grey. */
function Line({ say }: { say: Say }) {
  return <p className="hh-say"><b>{say.who}:</b> {say.text}{say.ref && <span className="hh-ref"> ({say.ref})</span>}</p>;
}

const THANKS = ['JazakAllahu khayran! May Allah reward you.', 'MashaAllah, what a helper!', 'Alhamdulillah, the house is shining!', 'May Allah bless your hands.'];
/** Someone in the family thanks you for a chore (Mum, or Grandpa if you are Mum). */
function thanks(me: Character | undefined, n: number): string {
  const who = characterById(me?.id === 'ronlyn' ? 'hussein' : 'ronlyn');
  const title = me ? address(me, who) : '';
  return `${title && title !== 'Dad' ? title.replace(/^./, (c) => c.toUpperCase()) : firstName(who)}: “${THANKS[n % THANKS.length]}”`;
}

interface Talk {
  start: TalkStart;
  /** What's on screen now: the last exchange. */
  lines: Say[];
  qs: Question[];
  asked: string[];
  quiz: Quiz | null;
  /** 'ask': your questions; 'answer': their question to you; 'bye': saying goodbye. */
  mode: 'ask' | 'answer' | 'bye';
}

function startTalk(t: TalkStart): Talk {
  return { start: t, lines: opening(t.player, t.npc, t.turn), qs: questions(t.player, t.npc, t.room, t.turn), asked: [], quiz: quiz(t.player, t.npc, t.room, t.turn), mode: 'ask' };
}
/** Ronlyn's warmer/colder readout, coldest first. */

function fmt(ms: number) {
  const t = ms / 1000;
  const m = Math.floor(t / 60), s = Math.floor(t % 60), d = Math.floor((t * 10) % 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${d}`;
}

function readBest(): number | null {
  try { const v = Number(localStorage.getItem(BEST_KEY)); return Number.isFinite(v) && v > 0 ? v : null; } catch { return null; }
}

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

/** Left thumb moves, right thumb looks; buttons for use, map, run and pause. */
function TouchControls({ engine, onPause, onMap, onView }: { engine: HouseEngine; onPause: () => void; onMap: () => void; onView: () => void }) {
  const stick = useRef<{ id: number; x: number; y: number } | null>(null);
  const lookPtr = useRef<{ id: number; x: number; y: number } | null>(null);
  const [knob, setKnob] = useState<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [run, setRun] = useState(false);
  const R = 48;

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    e.currentTarget.setPointerCapture(e.pointerId);
    if (x < rect.width * 0.45 && !stick.current) {
      stick.current = { id: e.pointerId, x, y };
      setKnob({ x, y, ox: x, oy: y });
    } else if (!lookPtr.current) {
      lookPtr.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (stick.current?.id === e.pointerId) {
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      let dx = x - stick.current.x, dy = y - stick.current.y;
      const len = Math.hypot(dx, dy);
      if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
      engine.setTouchMove(dx / R, -dy / R);
      setKnob({ x: stick.current.x + dx, y: stick.current.y + dy, ox: stick.current.x, oy: stick.current.y });
    } else if (lookPtr.current?.id === e.pointerId) {
      engine.look((e.clientX - lookPtr.current.x) * 0.0055, (e.clientY - lookPtr.current.y) * 0.0055);
      lookPtr.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    if (stick.current?.id === e.pointerId) { stick.current = null; setKnob(null); engine.setTouchMove(0, 0); }
    if (lookPtr.current?.id === e.pointerId) lookPtr.current = null;
  };

  return (
    <>
      <div className="hh-touch" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {knob && (
          <>
            <span className="hh-stick-base" style={{ left: knob.ox - R, top: knob.oy - R, width: R * 2, height: R * 2 }} />
            <span className="hh-stick-knob" style={{ left: knob.x - 22, top: knob.y - 22 }} />
          </>
        )}
        {!knob && <span className="hh-touch-hint">Drag left side to walk · right side to look</span>}
      </div>
      <div className="hh-touch-buttons">
        <button type="button" className="hh-tbtn hh-tbtn-use" onPointerDown={(e) => { e.stopPropagation(); engine.interact(); }} aria-label="Use: open or close what you are looking at">✋</button>
        <button type="button" className={`hh-tbtn${run ? ' on' : ''}`} onPointerDown={(e) => { e.stopPropagation(); const v = !run; setRun(v); engine.setRun(v); }} aria-label="Run">🏃</button>
        <button type="button" className="hh-tbtn" onPointerDown={(e) => { e.stopPropagation(); onMap(); }} aria-label="Map">🗺️</button>
        <button type="button" className="hh-tbtn" onPointerDown={(e) => { e.stopPropagation(); onView(); }} aria-label="Switch between first and third person">🎥</button>
        <button type="button" className="hh-tbtn" onPointerDown={(e) => { e.stopPropagation(); onPause(); }} aria-label="Pause">⏸</button>
      </div>
    </>
  );
}

export default function HouseGame() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<HTMLSpanElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<HouseEngine | null>(null);
  const toastTimer = useRef<number>(0);

  const touch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, []);
  const [phase, setPhase] = useState<Phase>('intro');
  const [reason, setReason] = useState<PauseReason>('manual');
  const [count, setCount] = useState(0);
  const [golden, setGolden] = useState(false);
  const [rooms, setRooms] = useState<[number, number]>([0, 9]);
  const [toast, setToast] = useState<{ text: string; kind: 'part' | 'gold' | 'star' | 'info' } | { lines: Say[]; kind: 'talk' } | null>(null);
  const [chores, setChores] = useState<ChoreSnapshot | null>(null);
  const [work, setWork] = useState<Work | null>(null);
  const [showChores, setShowChores] = useState(false);
  const thankCount = useRef(0);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [charId, setCharId] = useState(readChar);
  const [tab, setTab] = useState<CharacterGroup>(() => characterById(readChar()).group);
  const [third, setThird] = useState(false);
  const [perk, setPerk] = useState<PerkPill | null>(null);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [best, setBest] = useState<number | null>(() => readBest());
  const [newBest, setNewBest] = useState(false);
  const [mapBig, setMapBig] = useState(false);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } });
  const [copied, setCopied] = useState(false);
  const prize = prizeState();   // cheap: re-read on every render so a round that starts mid-visit shows up

  const showToast = useCallback((text: string, kind: 'part' | 'gold' | 'star' | 'info') => {
    setToast({ text, kind });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), kind === 'part' ? 1900 : kind === 'star' ? 3600 : kind === 'info' ? 3800 : 4200);
  }, []);
  const showSay = useCallback((lines: Say[]) => {
    setToast({ lines, kind: 'talk' });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  useEffect(() => {
    if (!stageRef.current || !timerRef.current || !promptRef.current || !mapRef.current) return;
    if (!webglAvailable()) { setPhase('nogl'); return; }
    let engine: HouseEngine;
    try {
      engine = new HouseEngine(
        stageRef.current,
        { timer: timerRef.current, prompt: promptRef.current, minimap: mapRef.current },
        {
          onPickup: ({ name, count: n, total, golden: g }) => {
            if (g) { setGolden(true); showToast('✨ Golden Chip found! Now get out the front gate to unlock your code', 'gold'); }
            else { setCount(n); showToast(`+ ${name}  ·  ${n}/${total}`, 'part'); }
          },
          onWin: (r) => {
            setResult(r);
            setPhase('won');
            const prev = readBest();
            if (prev === null || r.timeMs < prev) {
              try { localStorage.setItem(BEST_KEY, String(r.timeMs)); } catch { /* storage unavailable */ }
              setBest(r.timeMs);
              setNewBest(true);
            } else setNewBest(false);
          },
          onPause: (why) => { setReason(why); setPhase('paused'); },
          onRooms: (v, t) => setRooms([v, t]),
          onMap: (big) => setMapBig(big),
          onTalk: (t) => setTalk(t ? startTalk(t) : null),
          onSay: (lines) => showSay(lines),
          onView: (t) => setThird(t),
          onPerk: (p) => setPerk(p),
          onChores: (c) => setChores(c),
          onWork: (w) => setWork(w),
          onChoreDone: (d) => showToast(`+${d.stars} ⭐ ${d.chore.name}: done!${d.bonus ? `\n+${d.bonus} ⭐ bonus: every chore done!` : ''}\n${thanks(engineRef.current?.character, thankCount.current++)}`, 'star'),
          onUnlock: (p) => showToast(`🔓 ${p.emoji} ${p.name} unlocked!\n${p.reward}. Find it ${p.where}.`, 'gold'),
          onHint: (t) => showToast(t, 'info'),
        },
        { touch, baseUrl: BASE },
      );
    } catch {
      setPhase('nogl');
      return;
    }
    engine.setMuted(muted);
    engine.setCharacter(readChar());
    engineRef.current = engine;
    if (import.meta.env.DEV) (window as unknown as { __house?: unknown }).__house = engine.debug();
    return () => { engine.dispose(); engineRef.current = null; };
    // the engine is created once; `muted` is applied through its own effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touch, showToast, showSay]);

  useEffect(() => {
    engineRef.current?.setMuted(muted);
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [muted]);

  // fullscreen: real fullscreen where the browser allows it, a fixed overlay otherwise (iPhone Safari)
  const enterFull = useCallback(() => {
    setFull(true);
    const el = wrapRef.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    if (!el || document.fullscreenElement) return;
    try {
      if (el.requestFullscreen) void el.requestFullscreen().catch(() => { /* overlay fallback stays */ });
      else el.webkitRequestFullscreen?.();
    } catch { /* overlay fallback stays */ }
  }, []);
  const exitFull = useCallback(() => {
    setFull(false);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  }, []);
  useEffect(() => {
    const onFs = () => { if (!document.fullscreenElement) setFull(false); };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);
  // the start card too, once the game fills most of the screen: otherwise the dock sits over its Start button
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.intersectionRatio >= 0.7), { threshold: [0, 0.7, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  // while you play, the site's dock and chat bubble step out of the way of the HUD
  useEffect(() => {
    const on = full || phase === 'playing' || phase === 'paused' || phase === 'won' || (phase === 'intro' && inView);
    document.body.classList.toggle('hh-playing', on);
    return () => document.body.classList.remove('hh-playing');
  }, [phase, full, inView]);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [full]);

  const pick = (id: string) => {
    setCharId(id);
    try { localStorage.setItem(CHAR_KEY, id); } catch { /* storage unavailable */ }
    engineRef.current?.setCharacter(id);
  };
  const play = () => {
    const e = engineRef.current;
    if (!e) return;
    e.setCharacter(charId);
    if (touch) enterFull();
    setPhase('playing');
    e.start();
  };
  const resume = () => { setConfirmQuit(false); setPhase('playing'); engineRef.current?.resume(); };
  const restart = () => {
    const e = engineRef.current;
    if (!e) return;
    e.reset();
    setCount(0); setGolden(false); setResult(null); setCopied(false); setNewBest(false);
    setPhase('playing');
    e.start();
  };
  const toggleMap = () => { const big = engineRef.current?.toggleMap(); setMapBig(!!big); };
  const toggleView = () => { const t = engineRef.current?.toggleView(); setThird(!!t); };
  /** Pick menu item `i` in the conversation: one of your questions, an answer to theirs, or goodbye. */
  const choose = useCallback((i: number) => {
    const t = talk;
    if (!t || t.mode === 'bye') return;
    const { player, npc } = t.start;
    if (t.mode === 'answer' && t.quiz) {
      const c = t.quiz.choices[i];
      if (c) setTalk({ ...t, lines: c.lines, mode: 'ask', quiz: null });
      return;
    }
    const left = t.qs.filter((q) => !t.asked.includes(q.id));
    if (i === left.length) {
      setTalk({ ...t, lines: farewell(player, npc), mode: 'bye' });
      window.setTimeout(() => engineRef.current?.endTalk(npc.id), 2200);
      return;
    }
    const q = left[i];
    if (!q) return;
    const asked = [...t.asked, q.id];
    // after your second question they ask you one back
    if (asked.length === 2 && t.quiz) setTalk({ ...t, asked, lines: [...q.lines, t.quiz.ask], mode: 'answer' });
    else setTalk({ ...t, asked, lines: q.lines });
  }, [talk]);
  // number keys pick from the menu (they work while the mouse is captured, unlike clicks)
  useEffect(() => {
    if (!talk || phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      const m = /^(?:Digit|Numpad)([1-9])$/.exec(e.code);
      if (!m || e.repeat) return;
      e.preventDefault();
      choose(Number(m[1]) - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [talk, phase, choose]);
  /** Back to the start card to pick someone else. */
  const changeCharacter = () => {
    const e = engineRef.current;
    if (!e) return;
    e.reset();
    e.state = 'intro';
    setConfirmQuit(false);
    setCount(0); setGolden(false); setResult(null); setCopied(false); setNewBest(false);
    setPhase('intro');
  };
  /** The ✕ button: stop and ask first, so a stray tap doesn't throw a run away. */
  const askQuit = () => {
    if (phase === 'playing') engineRef.current?.pause('manual');
    setConfirmQuit(true);
  };
  // C opens and closes the chores list
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => { if (e.code === 'KeyC' && !e.repeat) setShowChores((v) => !v); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);
  // X on the keyboard does the same as the ✕ button (it asks first, and frees the mouse to answer)
  useEffect(() => {
    if (phase !== 'playing') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyX' || e.repeat) return;
      e.preventDefault();
      engineRef.current?.pause('manual');
      setConfirmQuit(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);
  /** End the run: back to the start card, out of full screen. */
  const quit = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    changeCharacter();
    if (full) exitFull();
  };
  const me = characterById(charId);
  const copyCode = async () => {
    try { await navigator.clipboard.writeText(prize.code); setCopied(true); } catch { setCopied(false); }
  };

  const total = COLLECTIBLES.length;
  const steps = claimSteps();

  return (
    <div ref={wrapRef} className={`hh-wrap${full ? ' hh-full' : ''}${touch ? ' hh-is-touch' : ''}`}>
      <div ref={stageRef} className="hh-stage" />

      {/* HUD */}
      <div className={`hh-hud${phase === 'playing' ? '' : ' hh-hud-dim'}`} aria-hidden={phase !== 'playing'}>
        <div className="hh-pills">
          <span className="hh-pill hh-who" title={`Playing as ${me.name}`}><Portrait look={me.look} size={20} /> <span className="hh-who-name">{firstName(me)}</span></span>
          <span className="hh-pill hh-timer" title="Time"><span aria-hidden>⏱</span> <span ref={timerRef}>00:00.0</span></span>
          <span className="hh-pill" title="Tech parts found"><span aria-hidden>🔧</span> {count}/{total}</span>
          <span className="hh-pill" title="Areas explored, inside and out"><span aria-hidden>🧭</span> {rooms[0]}/{rooms[1]}</span>
          {perk && <span className={`hh-pill hh-perk hh-perk-${perk.tone}`} title={perk.title} aria-live="polite">{perk.text}</span>}
          {chores && !chores.baby && (
            <span className="hh-pill hh-stars" title="Stars from chores (kept on this device)">
              ⭐ {chores.stars}{chores.held && <> · {ITEMS[chores.held].emoji}<span className="hh-held-name"> {ITEMS[chores.held].name}</span></>}
            </span>
          )}
          {golden && <span className="hh-pill hh-gold" title="Golden Chip">✨ Golden Chip</span>}
        </div>
        <div className={`hh-map${mapBig ? ' hh-map-big' : ''}`} onClick={toggleMap} role="button" aria-label={mapBig ? 'Shrink map' : 'Expand map'} tabIndex={-1}>
          <canvas ref={mapRef} />
          <span className="hh-map-tag">{mapBig ? 'Map · M to close' : 'M'}</span>
        </div>
        <div className="hh-cross" />
        <div ref={promptRef} className="hh-prompt" style={{ opacity: 0 }} />
        {toast && toast.kind === 'talk' && !talk && <div className="hh-toast hh-toast-talk">{toast.lines.map((l, i) => <Line key={i} say={l} />)}</div>}
        {toast && toast.kind !== 'talk' && <div className={`hh-toast hh-toast-${toast.kind}`}>{toast.text}</div>}
        {phase === 'playing' && work && (
          <div className="hh-work" role="status">
            <span>{work.emoji} {work.label}…</span>
            <div className="hh-work-bar"><i style={{ width: `${Math.round(work.progress * 100)}%` }} /></div>
          </div>
        )}
        <div className="hh-corner">
          {phase === 'playing' && <button type="button" className="hh-icon hh-quit" onClick={askQuit} aria-label="Quit the game" title="Quit the game">✕</button>}
          <button type="button" className={`hh-icon${showChores ? ' on' : ''}`} onClick={() => setShowChores((v) => !v)} aria-label="Chores and rewards" title="Chores and rewards (C)">📋</button>
          <button type="button" className="hh-icon" onClick={toggleView} aria-label={third ? 'First-person view' : 'Third-person view'} title="Switch view (V)">{third ? '👁' : '🎥'}</button>
          <button type="button" className="hh-icon" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Sound on' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
          <button type="button" className="hh-icon" onClick={() => (full ? exitFull() : enterFull())} aria-label={full ? 'Exit full screen' : 'Full screen'}>{full ? '🗗' : '⛶'}</button>
        </div>
      </div>

      {/* Chores and rewards: what's left to do this game, and the places stars unlock */}
      {phase === 'playing' && showChores && !talk && chores && (
        <div className="hh-chores" role="dialog" aria-label="Chores and rewards">
          <div className="hh-chores-head">
            <b>📋 Chores</b>
            <span className="hh-chores-stars">⭐ {chores.stars} saved{chores.runStars ? ` · +${chores.runStars} this game` : ''}</span>
            <button type="button" className="hh-talk-x" onPointerDown={(e) => { e.stopPropagation(); setShowChores(false); }} aria-label="Close chores">✕</button>
          </div>
          {chores.baby ? (
            <p className="hh-chores-note">Aisha is too little for chores: she's the one being babysat! Pick someone else to help out.</p>
          ) : (
            <>
              <ul className="hh-chore-list">
                {availableChores(false, chores.unlocked).map((c) => {
                  const n = c.steps.filter((st) => chores.done.includes(st.id)).length;
                  const done = n === c.steps.length;
                  return (
                    <li key={c.id} className={done ? 'done' : ''}>
                      <span className="hh-chore-emoji">{done ? '✅' : c.emoji}</span>
                      <span className="hh-chore-text"><b>{c.name}{c.steps.length > 1 && !done ? ` (${n}/${c.steps.length})` : ''}</b><small>{c.where}</small></span>
                      <span className="hh-chore-stars">+{c.stars}⭐</span>
                    </li>
                  );
                })}
              </ul>
              <p className="hh-chores-note">Tools: 🧹 broom, 🪣 mop and 🧽 cloth are {TOOLS[0].where}; the 💧 watering can is {TOOLS[3].where}. Finish them all for a bonus.</p>
            </>
          )}
          <div className="hh-places">
            {PLACES.map((p) => {
              const open = chores.unlocked.includes(p.id);
              return (
                <div key={p.id} className={`hh-place${open ? ' open' : ''}`}>
                  <span className="hh-chore-emoji">{open ? p.emoji : '🔒'}</span>
                  <span className="hh-chore-text"><b>{p.name}</b><small>{open ? `Open now, ${p.where}` : `${p.stars}⭐ · ${p.reward}`}</small>
                    {!open && <span className="hh-place-bar"><i style={{ width: `${Math.min(100, (chores.stars / p.stars) * 100)}%` }} /></span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation: what was just said, then the questions you can ask (or answers to theirs) */}
      {phase === 'playing' && talk && (() => {
        const left = talk.qs.filter((q) => !talk.asked.includes(q.id));
        const menu = talk.mode === 'answer' && talk.quiz ? talk.quiz.choices.map((c) => c.label) : talk.mode === 'ask' ? [...left.map((q) => q.label), 'Say goodbye'] : [];
        return (
          <div className="hh-talk" role="dialog" aria-label={`Talking with ${firstName(talk.start.npc)}`}>
            <div className="hh-talk-head">
              <Portrait look={talk.start.npc.look} size={26} />
              <b>{talk.start.npc.name}</b> <span className="hh-talk-role">{talk.start.npc.role}</span>
              <button type="button" className="hh-talk-x" onPointerDown={(e) => { e.stopPropagation(); engineRef.current?.endTalk(); }} aria-label="Stop talking">✕</button>
            </div>
            <div className="hh-talk-log" aria-live="polite">{talk.lines.map((l, i) => <Line key={`${talk.asked.length}-${i}`} say={l} />)}</div>
            {menu.length > 0 && (
              <>
                {talk.mode === 'answer' && <div className="hh-talk-tip">Your answer:</div>}
                <ol className="hh-talk-menu">
                  {menu.map((label, i) => (
                    <li key={label}>
                      <button type="button" onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); choose(i); }}>
                        <kbd>{i + 1}</kbd> {label}
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
        );
      })()}

      {phase === 'playing' && touch && engineRef.current && (
        <TouchControls engine={engineRef.current} onPause={() => engineRef.current?.pause('manual')} onMap={toggleMap} onView={toggleView} />
      )}

      {/* Start card */}
      {phase === 'intro' && (
        <div className="hh-overlay">
          <div className="hh-card">
            <div className="hh-eyebrow">LvTS · First-person 3D</div>
            <h2 className="hh-title">House <span className="grad-text">Hunt</span></h2>
            <p className="hh-lead">Explore the house and the yard, grab the {total} tech parts, hunt down the <strong>Golden Chip</strong> (it hides somewhere new every game), then get out through the front gate. Help with the chores to earn ⭐ stars and unlock new places.</p>
            <div className="hh-pick-label">Who do you want to play as?</div>
            <div className="hh-tabs" role="tablist" aria-label="Family groups">
              {GROUPS.map((g) => (
                <button key={g.id} type="button" role="tab" aria-selected={tab === g.id} className={`hh-tab${tab === g.id ? ' on' : ''}`} onClick={() => setTab(g.id)}>
                  {g.label} <span className="hh-tab-n">{CHARACTERS.filter((c) => c.group === g.id).length}</span>
                </button>
              ))}
            </div>
            <div className="hh-pick" role="radiogroup" aria-label="Choose your character">
              {CHARACTERS.filter((c) => c.group === tab).map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={charId === c.id} className={`hh-pick-tile${charId === c.id ? ' on' : ''}`} onClick={() => pick(c.id)}>
                  <Portrait look={c.look} size={touch ? 34 : 50} />
                  <span className="hh-pick-name">{firstName(c)}</span>
                  <span className="hh-pick-role">{c.role}</span>
                </button>
              ))}
            </div>
            <div className="hh-pick-perk"><b>{me.name}</b> · {me.perk}</div>
            <button type="button" className="hh-btn hh-btn-top" onClick={play}>Start as {firstName(me)} →</button>
            <ul className="hh-keys">
              {touch ? (
                <>
                  <li><b>Left thumb</b> walk</li>
                  <li><b>Right thumb</b> look</li>
                  <li><b>✋</b> open doors, talk to the family</li>
                  <li><b>🗺️</b> map · <b>📋</b> chores · <b>🎥</b> view · <b>✕</b> quit</li>
                </>
              ) : (
                <>
                  <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</li>
                  <li><b>Mouse</b> look · <kbd>X</kbd> quit</li>
                  <li><kbd>E</kbd> open doors, talk to the family</li>
                  <li><kbd>Shift</kbd> run · <kbd>M</kbd> map · <kbd>C</kbd> chores · <kbd>V</kbd> view</li>
                </>
              )}
            </ul>
            {prize.live
              ? <div className="hh-prize-live">🏆 A prize round is live: find the Golden Chip and escape to reveal this round’s secret code — winners are paid by {CONTEST.payout}.</div>
              : <div className="hh-prize-off">No prize round is running right now{prize.next ? ` — the next one starts ${prize.next}` : ''}. Follow <a href={CONTEST.facebookUrl} target="_blank" rel="noopener noreferrer">{CONTEST.handle}</a> to hear when it does.</div>}
            {best !== null && <div className="hh-best">Your best time: {fmt(best)}</div>}
          </div>
        </div>
      )}

      {/* Pause / poster */}
      {phase === 'paused' && confirmQuit && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-sm" role="alertdialog" aria-labelledby="hh-quit-title">
            <h3 className="hh-title-sm" id="hh-quit-title">Quit this game?</h3>
            <p className="hh-lead">Your time and the parts you’ve found so far won’t be kept.</p>
            <div className="hh-row">
              <button type="button" className="hh-btn hh-btn-danger" onClick={quit}>Quit game</button>
              <button type="button" className="hh-btn hh-btn-ghost" onClick={resume}>Keep playing</button>
            </div>
          </div>
        </div>
      )}
      {phase === 'paused' && !confirmQuit && reason !== 'poster' && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-sm">
            <h3 className="hh-title-sm">Paused</h3>
            <p className="hh-lead">The clock is stopped. Ready when you are.</p>
            <div className="hh-row">
              <button type="button" className="hh-btn" onClick={resume}>Resume</button>
              <button type="button" className="hh-btn hh-btn-ghost" onClick={restart}>Restart</button>
              <button type="button" className="hh-btn hh-btn-ghost" onClick={changeCharacter}>Change character</button>
              <button type="button" className="hh-btn hh-btn-ghost hh-btn-quit" onClick={quit}>✕ Quit game</button>
            </div>
          </div>
        </div>
      )}
      {phase === 'paused' && reason === 'poster' && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-poster">
            <div className="hh-row hh-poster-head">
              <h3 className="hh-title-sm">How a database index works</h3>
              <button type="button" className="hh-btn hh-btn-sm" onClick={resume}>Back to the hunt →</button>
            </div>
            <iframe className="hh-poster-frame" src={`${BASE}house-hunt/db-index.html`} title="Isometric figure: how a database index works" loading="lazy" />
            <p className="hh-poster-note">Searching every room for a part is a <b>full scan</b>. Your minimap is an <b>index</b>: it tells you where to look. The clock was paused while you read.</p>
          </div>
        </div>
      )}

      {/* Win card */}
      {phase === 'won' && result && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-win" id="house-hunt-victory">
            <div className="hh-eyebrow">You made it out!</div>
            <h2 className="hh-title">{fmt(result.timeMs)}</h2>
            <div className="hh-stats">
              <span>🔧 {result.items}/{result.total} parts</span>
              <span>🧭 {result.rooms}/{result.totalRooms} areas</span>
              <span>{result.golden ? '✨ Golden Chip' : '— no Golden Chip'}</span>
              {result.stars > 0 && <span>⭐ +{result.stars} from chores</span>}
            </div>
            {newBest && <div className="hh-best hh-best-new">New personal best!</div>}
            {!newBest && best !== null && <div className="hh-best">Your best: {fmt(best)}</div>}

            {result.golden ? (
              <div className="hh-code-box">
                <div className="hh-code-label">{prize.live ? `Secret code · round of ${prize.round}` : 'Demo code — no prize round is running right now'}</div>
                <div className="hh-code">{prize.code}</div>
                <div className="hh-row">
                  <button type="button" className="hh-btn hh-btn-sm hh-btn-ghost" onClick={copyCode}>{copied ? 'Copied ✓' : 'Copy code'}</button>
                  {prize.live && <a className="hh-btn hh-btn-sm hh-btn-fb" href={CONTEST.facebookUrl} target="_blank" rel="noopener noreferrer">Open {CONTEST.handle} →</a>}
                </div>
                {prize.live ? (
                  <>
                    <ol className="hh-steps">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
                    <p className="hh-safety">We never ask for your M-PAiSA PIN or a payment to release a prize. Only trust messages from the official {CONTEST.pageName} page.</p>
                  </>
                ) : (
                  <p className="hh-safety">{prize.next ? `The next prize round starts ${prize.next}. ` : ''}Follow <a href={CONTEST.facebookUrl} target="_blank" rel="noopener noreferrer">{CONTEST.handle}</a> to hear when codes go live.</p>
                )}
              </div>
            ) : (
              <p className="hh-lead">No Golden Chip this time. It hides in a different spot every game — corners, high places, behind things. Look up as well as around.</p>
            )}
            <div className="hh-row">
              <button type="button" className="hh-btn" onClick={restart}>Play again</button>
              <button type="button" className="hh-btn hh-btn-ghost" onClick={changeCharacter}>Change character</button>
              {full && <button type="button" className="hh-btn hh-btn-ghost" onClick={exitFull}>Exit full screen</button>}
            </div>
          </div>
        </div>
      )}

      {phase === 'nogl' && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-sm">
            <h3 className="hh-title-sm">3D isn’t available here</h3>
            <p className="hh-lead">This browser or device has WebGL turned off, which the House Hunt needs. Try an up-to-date Chrome, Safari or Firefox, or turn on hardware acceleration in your browser settings.</p>
          </div>
        </div>
      )}

      <style>{HH_CSS}</style>
    </div>
  );
}

const HH_CSS = `
body.hh-playing .dock, body.hh-playing .lvts-chat-bubble { opacity: 0 !important; pointer-events: none !important; transform: translateY(24px) scale(0.9) !important; transition: opacity .25s, transform .25s; }
.hh-wrap { position: relative; width: 100%; aspect-ratio: 16 / 9; min-height: 420px; max-height: 80vh; border-radius: 18px; overflow: hidden; background: #cfe9f7; box-shadow: 0 20px 60px rgba(15,23,42,0.18); font-family: 'Space Grotesk', sans-serif; color: #0f172a; user-select: none; -webkit-user-select: none; }
.hh-wrap.hh-is-touch { aspect-ratio: 9 / 14; max-height: 82vh; min-height: 520px; }
@media (orientation: landscape) { .hh-wrap.hh-is-touch { aspect-ratio: 16 / 9; } }
.hh-wrap.hh-full { position: fixed; inset: 0; z-index: 1000; width: 100vw; height: 100vh; height: 100dvh; max-height: none; min-height: 0; aspect-ratio: auto; border-radius: 0; }
.hh-stage { position: absolute; inset: 0; }
.hh-hud { position: absolute; inset: 0; pointer-events: none; transition: opacity .3s; }
.hh-hud-dim { opacity: 0.35; }
.hh-pills { position: absolute; top: 12px; left: 12px; display: flex; flex-wrap: wrap; gap: 6px; max-width: calc(100% - 210px); }
.hh-pill { background: rgba(15,23,42,0.78); color: #f8fafc; padding: 6px 11px; border-radius: 999px; font-size: 0.82rem; font-weight: 600; box-shadow: 0 4px 14px rgba(15,23,42,0.18); white-space: nowrap; }
.hh-timer { font-family: 'JetBrains Mono', monospace; }
.hh-gold { background: linear-gradient(135deg,#f59e0b,#fbbf24); color: #422006; }
.hh-perk { transition: background .3s; }
.hh-perk-sense-0 { background: rgba(37,99,235,0.88); }
.hh-perk-sense-1 { background: rgba(217,119,6,0.9); }
.hh-perk-sense-2 { background: rgba(234,88,12,0.92); }
.hh-perk-sense-3 { background: #dc2626; animation: hh-throb 0.9s ease-in-out infinite; }
.hh-perk-hint { background: rgba(124,58,237,0.9); }
@keyframes hh-throb { 50% { transform: scale(1.08); } }
.hh-map { position: absolute; top: 12px; right: 12px; width: 168px; height: 168px; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255,255,255,0.75); box-shadow: 0 8px 24px rgba(15,23,42,0.3); background: #0b1222; pointer-events: auto; cursor: pointer; transition: all .25s cubic-bezier(.22,1,.36,1); }
.hh-map canvas { width: 100%; height: 100%; display: block; }
.hh-map-big { top: 50%; right: 50%; transform: translate(50%, -50%); width: min(70vh, 86%); height: min(70vh, 86%); }
.hh-map-tag { position: absolute; bottom: 6px; right: 8px; font-size: 0.65rem; font-weight: 700; color: rgba(248,250,252,0.85); background: rgba(15,23,42,0.6); padding: 2px 6px; border-radius: 6px; }
.hh-cross { position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,255,255,0.9); box-shadow: 0 0 0 2px rgba(15,23,42,0.35); }
.hh-prompt { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); background: rgba(15,23,42,0.82); color: #fff; padding: 8px 16px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; transition: opacity .15s; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; }
.hh-is-touch .hh-prompt { bottom: auto; top: 92px; left: 12px; transform: none; max-width: calc(100% - 150px); white-space: normal; font-size: 0.8rem; line-height: 1.35; }
.hh-is-touch .hh-toast { top: 136px; }
.hh-btn-top { margin: 0 0 1rem; width: 100%; max-width: 340px; position: sticky; bottom: 0; z-index: 2; box-shadow: 0 -12px 14px #fff, 0 8px 20px rgba(37,99,235,0.3); }  /* stays in view however tall the picker gets */
.hh-toast { position: absolute; top: 58px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg,#2563eb,#7c3aed); color: #fff; padding: 9px 16px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 10px 30px rgba(37,99,235,0.35); animation: hh-pop .35s cubic-bezier(.34,1.56,.64,1); white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; }
.hh-toast-gold { background: linear-gradient(135deg,#f59e0b,#fbbf24); color: #422006; white-space: pre-line; text-align: center; max-width: min(460px, 92%); }
.hh-toast-star { background: linear-gradient(135deg,#15803d,#22c55e); white-space: pre-line; text-align: center; max-width: min(460px, 92%); }
.hh-toast-info { background: rgba(15,23,42,0.92); white-space: normal; text-align: center; max-width: min(440px, 92%); font-weight: 600; }
.hh-stars { background: linear-gradient(135deg,#15803d,#22c55e); }
.hh-work { position: absolute; left: 50%; bottom: 72px; transform: translateX(-50%); background: rgba(15,23,42,0.88); color: #fff; padding: 8px 14px 9px; border-radius: 12px; font-weight: 700; font-size: 0.85rem; min-width: 230px; text-align: center; pointer-events: none; }
.hh-is-touch .hh-work { bottom: auto; top: 136px; }
.hh-work-bar { height: 8px; background: rgba(255,255,255,0.2); border-radius: 99px; margin-top: 6px; overflow: hidden; }
.hh-work-bar i { display: block; height: 100%; background: linear-gradient(90deg,#22c55e,#a3e635); border-radius: 99px; }
.hh-icon.on { background: #15803d; }
.hh-chores { position: absolute; top: 56px; left: 12px; width: min(370px, 62%); max-height: calc(100% - 130px); overflow-y: auto; background: #fff; color: #0f172a; border-radius: 16px; border: 2px solid #bbf7d0; box-shadow: 0 16px 40px rgba(15,23,42,0.3); padding: 10px 12px; z-index: 4; pointer-events: auto; font-size: 0.82rem; }
.hh-is-touch .hh-chores { top: auto; left: 12px; right: 12px; bottom: 12px; width: auto; max-height: 62%; }
.hh-chores-head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.hh-chores-stars { color: #15803d; font-weight: 700; font-size: 0.78rem; }
.hh-chore-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.hh-chore-list li, .hh-place { display: flex; align-items: center; gap: 8px; padding: 5px 6px; border-radius: 10px; background: #f8fafc; }
.hh-chore-list li.done { background: #f0fdf4; color: #64748b; }
.hh-chore-list li.done b { text-decoration: line-through; }
.hh-chore-emoji { font-size: 1.1rem; width: 1.5rem; text-align: center; flex: none; }
.hh-chore-text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
.hh-chore-text small { color: #64748b; font-size: 0.7rem; }
.hh-chore-stars { font-weight: 700; color: #15803d; font-size: 0.75rem; flex: none; }
.hh-chores-note { margin: 8px 2px; color: #475569; font-size: 0.74rem; line-height: 1.4; }
.hh-places { display: grid; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 8px; }
.hh-place.open { background: #fefce8; }
.hh-place-bar { display: block; height: 6px; background: #e2e8f0; border-radius: 99px; margin-top: 4px; overflow: hidden; }
.hh-place-bar i { display: block; height: 100%; background: linear-gradient(90deg,#f59e0b,#fbbf24); }
.hh-toast-talk { background: #fff; color: #0f172a; border: 2px solid #c7d2fe; white-space: normal; text-align: left; max-width: min(460px, 92%); font-weight: 600; }
.hh-say { margin: 0 0 5px; line-height: 1.42; font-weight: 500; }
.hh-say b { color: #1d4ed8; font-weight: 700; }
.hh-ref { color: #64748b; font-weight: 500; font-size: 0.8em; white-space: nowrap; }
.hh-talk { position: absolute; left: 50%; bottom: 64px; transform: translateX(-50%); width: min(580px, 92%); max-height: 64%; overflow-y: auto; background: #fff; color: #0f172a; border: 2px solid #c7d2fe; border-radius: 16px; padding: 10px 12px; box-shadow: 0 16px 40px rgba(15,23,42,0.35); z-index: 4; pointer-events: auto; font-size: 0.88rem; animation: hh-pop .3s cubic-bezier(.34,1.56,.64,1); }
.hh-is-touch .hh-talk { left: 12px; right: 12px; bottom: 12px; width: auto; transform: none; max-height: 60%; font-size: 0.84rem; }
.hh-talk-head { display: flex; align-items: center; gap: 7px; font-size: 0.8rem; margin-bottom: 7px; }
.hh-talk-head svg { border-radius: 7px; }
.hh-talk-role { color: #94a3b8; font-weight: 600; }
.hh-talk-x { margin-left: auto; border: none; background: #f1f5f9; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; font-weight: 700; color: #475569; }
.hh-talk-tip { font-size: 0.72rem; font-weight: 700; color: #7c3aed; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 6px; }
.hh-talk-menu { list-style: none; margin: 8px 0 0; padding: 8px 0 0; border-top: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.hh-talk-menu button { width: 100%; height: 100%; text-align: left; display: flex; gap: 7px; align-items: center; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 8px; font: 600 0.8rem 'Space Grotesk', sans-serif; color: #0f172a; cursor: pointer; touch-action: manipulation; }
.hh-talk-menu button:hover { border-color: #93c5fd; background: #eff6ff; }
.hh-talk-menu kbd { flex: none; min-width: 20px; height: 20px; border-radius: 6px; background: #1d4ed8; color: #fff; font: 700 0.72rem 'JetBrains Mono', monospace; display: inline-flex; align-items: center; justify-content: center; }
.hh-is-touch .hh-talk-menu kbd { display: none; }
.hh-who { display: inline-flex; align-items: center; gap: 6px; padding-left: 4px; }
.hh-who svg { border-radius: 6px; }
.hh-pick-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; margin-bottom: 0.45rem; }
.hh-pick { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 6px; margin: 0 auto 0.5rem; max-width: 480px; }
.hh-tabs { display: inline-flex; gap: 4px; padding: 3px; margin: 0 auto 0.55rem; background: #f1f5f9; border-radius: 999px; max-width: 100%; overflow-x: auto; }
.hh-tab { border: none; background: transparent; padding: 5px 11px; border-radius: 999px; font-family: 'Space Grotesk', sans-serif; font-size: 0.76rem; font-weight: 700; color: #475569; cursor: pointer; white-space: nowrap; }
.hh-tab.on { background: #fff; color: #1d4ed8; box-shadow: 0 2px 8px rgba(15,23,42,0.12); }
.hh-tab-n { font-weight: 600; color: #94a3b8; margin-left: 2px; }
.hh-pick-tile { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px 7px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer; font-family: 'Space Grotesk', sans-serif; transition: border-color .15s, transform .15s; }
.hh-pick-tile:hover { transform: translateY(-2px); }
.hh-pick-tile.on { border-color: #2563eb; box-shadow: 0 6px 16px rgba(37,99,235,0.18); }
.hh-pick-name { font-size: 0.8rem; font-weight: 700; color: #0f172a; }
.hh-pick-role { font-size: 0.64rem; color: #64748b; line-height: 1.1; }
.hh-pick-perk { font-size: 0.78rem; color: #475569; line-height: 1.45; margin-bottom: 0.9rem; min-height: 2.3em; }
@keyframes hh-pop { from { transform: translate(-50%, -8px) scale(.9); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }
.hh-corner { position: absolute; bottom: 12px; right: 12px; display: flex; gap: 6px; pointer-events: auto; z-index: 3; }  /* above the phone's look/walk layer */
.hh-is-touch .hh-corner { bottom: auto; top: 188px; right: 12px; flex-direction: column; }
.hh-icon { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(15,23,42,0.7); color: #fff; font-size: 1rem; cursor: pointer; }
.hh-quit { order: 9; background: rgba(220,38,38,0.88); font-weight: 700; }
.hh-is-touch .hh-quit { order: -1; }
.hh-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(15,23,42,0.5); overflow-y: auto; }
.hh-card { background: #fff; border-radius: 18px; padding: 1.5rem 1.6rem; max-width: 520px; width: 100%; box-shadow: 0 24px 60px rgba(15,23,42,0.35); text-align: center; max-height: 100%; overflow-y: auto; }
.hh-card-sm { max-width: 380px; }
.hh-card-win { max-width: 480px; padding: 1.1rem 1.3rem; }
.hh-card-win .hh-title { font-size: clamp(1.5rem, 3.4vw, 2rem); margin-bottom: 0.35rem; }
.hh-card-poster { max-width: 760px; padding: 1rem; }
.hh-eyebrow { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #7c3aed; margin-bottom: 0.4rem; }
.hh-title { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(1.7rem, 4vw, 2.4rem); line-height: 1.05; margin-bottom: 0.6rem; }
.hh-title-sm { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem; margin-bottom: 0.4rem; }
.hh-lead { color: #475569; font-size: 0.92rem; line-height: 1.6; margin-bottom: 0.9rem; }
.hh-keys { list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 6px 12px; text-align: left; font-size: 0.8rem; color: #334155; margin: 0 auto 1rem; max-width: 420px; }
.hh-keys kbd { display: inline-block; min-width: 1.5em; padding: 1px 5px; margin-right: 3px; border: 1px solid #cbd5e1; border-bottom-width: 2px; border-radius: 5px; background: #f8fafc; font-family: 'JetBrains Mono', monospace; font-size: 0.72rem; text-align: center; }
.hh-prize-live { background: linear-gradient(135deg,rgba(22,163,74,0.12),rgba(8,145,178,0.1)); border: 1px solid rgba(22,163,74,0.35); color: #166534; border-radius: 10px; padding: 0.6rem 0.8rem; font-size: 0.82rem; line-height: 1.5; margin-bottom: 1rem; }
.hh-prize-off { background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; border-radius: 10px; padding: 0.6rem 0.8rem; font-size: 0.8rem; line-height: 1.5; margin-bottom: 1rem; }
.hh-prize-off a, .hh-safety a { color: #2563eb; font-weight: 700; }
.hh-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; background: linear-gradient(135deg,#2563eb,#7c3aed); color: #fff; border: none; padding: 0.75rem 1.4rem; border-radius: 11px; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 0.95rem; cursor: pointer; text-decoration: none; box-shadow: 0 8px 20px rgba(37,99,235,0.3); }
.hh-btn:hover { filter: brightness(1.08); }
.hh-btn-ghost { background: #fff; color: #334155; border: 1px solid #e2e8f0; box-shadow: none; }
.hh-btn-danger { background: #dc2626; box-shadow: 0 8px 20px rgba(220,38,38,0.3); }
.hh-btn-quit { color: #b91c1c; }
.hh-btn-sm { padding: 0.45rem 0.9rem; font-size: 0.82rem; }
.hh-btn-fb { background: #1877f2; box-shadow: 0 6px 16px rgba(24,119,242,0.3); }
.hh-row { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
.hh-best { margin-top: 0.7rem; font-size: 0.8rem; color: #64748b; font-family: 'JetBrains Mono', monospace; }
.hh-best-new { color: #16a34a; font-weight: 700; }
.hh-stats { display: flex; gap: 0.5rem 1rem; justify-content: center; flex-wrap: wrap; font-size: 0.85rem; color: #334155; font-weight: 600; }
.hh-code-box { margin: 0.7rem 0; background: linear-gradient(135deg,#fffbeb,#fef3c7); border: 1px solid #fcd34d; border-radius: 14px; padding: 0.9rem 1rem; }
.hh-code-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #92400e; margin-bottom: 0.3rem; }
.hh-code { font-family: 'JetBrains Mono', monospace; font-size: clamp(1.4rem, 5vw, 1.8rem); font-weight: 700; letter-spacing: 0.06em; color: #422006; margin-bottom: 0.45rem; user-select: all; -webkit-user-select: all; word-break: break-all; }
.hh-steps { text-align: left; font-size: 0.78rem; color: #475569; line-height: 1.45; margin: 0.6rem 0 0.2rem 1.1rem; }
.hh-safety { font-size: 0.74rem; color: #78716c; line-height: 1.5; margin-top: 0.5rem; }
.hh-poster-head { justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
.hh-poster-frame { width: 100%; height: min(58vh, 520px); border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
.hh-poster-note { font-size: 0.8rem; color: #475569; margin-top: 0.6rem; text-align: left; line-height: 1.5; }
.hh-touch { position: absolute; inset: 0; touch-action: none; }
.hh-touch-hint { position: absolute; bottom: 20px; left: 12px; max-width: calc(100% - 150px); font-size: 0.72rem; line-height: 1.35; color: rgba(15,23,42,0.8); background: rgba(255,255,255,0.8); padding: 5px 9px; border-radius: 8px; pointer-events: none; }
.hh-stick-base { position: absolute; border-radius: 50%; background: rgba(15,23,42,0.18); border: 2px solid rgba(255,255,255,0.6); pointer-events: none; }
.hh-stick-knob { position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(37,99,235,0.85); border: 2px solid #fff; box-shadow: 0 4px 12px rgba(15,23,42,0.3); pointer-events: none; }
.hh-touch-buttons { position: absolute; right: 12px; bottom: 16px; display: grid; grid-template-columns: repeat(2, 52px); gap: 8px; z-index: 2; }
.hh-touch-buttons .hh-tbtn:last-child:nth-child(odd) { grid-column: span 2; width: 112px; }
.hh-tbtn { width: 52px; height: 52px; border-radius: 16px; border: 2px solid rgba(255,255,255,0.7); background: rgba(15,23,42,0.6); font-size: 1.35rem; color: #fff; touch-action: none; }
.hh-tbtn.on { background: rgba(37,99,235,0.85); }
.hh-tbtn-use { grid-column: span 2; width: 112px; background: linear-gradient(135deg,#2563eb,#7c3aed); }
@media (max-width: 640px) {
  .hh-map { width: 120px; height: 120px; }
  .hh-pills { max-width: calc(100% - 150px); }
  .hh-pill { font-size: 0.74rem; padding: 5px 9px; }
  .hh-is-touch .hh-corner { top: 140px; }
  .hh-card { padding: 1.1rem 1rem; }
  .hh-is-touch .hh-lead { font-size: 0.84rem; margin-bottom: 0.7rem; }
  .hh-is-touch .hh-title { font-size: 1.6rem; }
  .hh-keys { grid-template-columns: 1fr 1fr; font-size: 0.74rem; }
  .hh-pick { grid-template-columns: repeat(5, minmax(0, 1fr)); max-width: 360px; gap: 4px; }
  .hh-pick-tile { padding: 4px 0 5px; border-radius: 10px; }
  .hh-pick-name { font-size: 0.68rem; }
  .hh-pick-role { font-size: 0.56rem; }
  .hh-tab { padding: 5px 8px; font-size: 0.7rem; }
  .hh-who-name { display: none; }
  .hh-held-name { display: none; }
  .hh-talk-menu { grid-template-columns: 1fr; }
}
@media (prefers-reduced-motion: reduce) { .hh-toast { animation: none; } .hh-map { transition: none; } .hh-perk-sense-3 { animation: none; } }
`;
