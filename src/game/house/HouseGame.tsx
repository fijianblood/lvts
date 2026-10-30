import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HouseEngine, type RunResult } from './engine.ts';
import { CONTEST, prizeState, claimSteps } from './contest.ts';
import { COLLECTIBLES } from './layout.ts';

type Phase = 'intro' | 'playing' | 'paused' | 'won' | 'nogl';
type PauseReason = 'lock-lost' | 'poster' | 'manual';

const BEST_KEY = 'lvts_househunt_best_v1';
const MUTE_KEY = 'lvts_househunt_muted_v1';
const BASE = import.meta.env.BASE_URL;

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
function TouchControls({ engine, onPause, onMap }: { engine: HouseEngine; onPause: () => void; onMap: () => void }) {
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
  const [toast, setToast] = useState<{ text: string; golden: boolean } | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);
  const [best, setBest] = useState<number | null>(() => readBest());
  const [newBest, setNewBest] = useState(false);
  const [mapBig, setMapBig] = useState(false);
  const [full, setFull] = useState(false);
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; } });
  const [copied, setCopied] = useState(false);
  const prize = prizeState();   // cheap: re-read on every render so a round that starts mid-visit shows up

  const showToast = useCallback((text: string, isGolden: boolean) => {
    setToast({ text, golden: isGolden });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), isGolden ? 4200 : 1900);
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
            if (g) { setGolden(true); showToast('✨ Golden Chip found! Now find the way out to unlock your code', true); }
            else { setCount(n); showToast(`+ ${name}  ·  ${n}/${total}`, false); }
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
        },
        { touch, baseUrl: BASE },
      );
    } catch {
      setPhase('nogl');
      return;
    }
    engine.setMuted(muted);
    engineRef.current = engine;
    if (import.meta.env.DEV) (window as unknown as { __house?: unknown }).__house = engine.debug();
    return () => { engine.dispose(); engineRef.current = null; };
    // the engine is created once; `muted` is applied through its own effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touch, showToast]);

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
  // while you play, the site's dock and chat bubble step out of the way of the HUD
  useEffect(() => {
    const on = full || phase === 'playing' || phase === 'paused' || phase === 'won';
    document.body.classList.toggle('hh-playing', on);
    return () => document.body.classList.remove('hh-playing');
  }, [phase, full]);

  useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [full]);

  const play = () => {
    const e = engineRef.current;
    if (!e) return;
    if (touch) enterFull();
    setPhase('playing');
    e.start();
  };
  const resume = () => { setPhase('playing'); engineRef.current?.resume(); };
  const restart = () => {
    const e = engineRef.current;
    if (!e) return;
    e.reset();
    setCount(0); setGolden(false); setResult(null); setCopied(false); setNewBest(false);
    setPhase('playing');
    e.start();
  };
  const toggleMap = () => { const big = engineRef.current?.toggleMap(); setMapBig(!!big); };
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
          <span className="hh-pill hh-timer" title="Time"><span aria-hidden>⏱</span> <span ref={timerRef}>00:00.0</span></span>
          <span className="hh-pill" title="Tech parts found"><span aria-hidden>🔧</span> {count}/{total}</span>
          <span className="hh-pill" title="Rooms explored"><span aria-hidden>🚪</span> {rooms[0]}/{rooms[1]}</span>
          {golden && <span className="hh-pill hh-gold" title="Golden Chip">✨ Golden Chip</span>}
        </div>
        <div className={`hh-map${mapBig ? ' hh-map-big' : ''}`} onClick={toggleMap} role="button" aria-label={mapBig ? 'Shrink map' : 'Expand map'} tabIndex={-1}>
          <canvas ref={mapRef} />
          <span className="hh-map-tag">{mapBig ? 'Map · M to close' : 'M'}</span>
        </div>
        <div className="hh-cross" />
        <div ref={promptRef} className="hh-prompt" style={{ opacity: 0 }} />
        {toast && <div className={`hh-toast${toast.golden ? ' hh-toast-gold' : ''}`}>{toast.text}</div>}
        <div className="hh-corner">
          <button type="button" className="hh-icon" onClick={() => setMuted((m) => !m)} aria-label={muted ? 'Sound on' : 'Mute'}>{muted ? '🔇' : '🔊'}</button>
          <button type="button" className="hh-icon" onClick={() => (full ? exitFull() : enterFull())} aria-label={full ? 'Exit full screen' : 'Full screen'}>{full ? '🗗' : '⛶'}</button>
        </div>
      </div>

      {phase === 'playing' && touch && engineRef.current && (
        <TouchControls engine={engineRef.current} onPause={() => engineRef.current?.pause('manual')} onMap={toggleMap} />
      )}

      {/* Start card */}
      {phase === 'intro' && (
        <div className="hh-overlay">
          <div className="hh-card">
            <div className="hh-eyebrow">LvTS · First-person 3D</div>
            <h2 className="hh-title">House <span className="grad-text">Hunt</span></h2>
            <p className="hh-lead">Explore the house, grab the {total} tech parts hidden in its rooms and corridors, hunt down the <strong>Golden Chip</strong> (it hides somewhere new every game), then find the back door.</p>
            {touch && <button type="button" className="hh-btn hh-btn-top" onClick={play}>Start the hunt →</button>}
            <ul className="hh-keys">
              {touch ? (
                <>
                  <li><b>Left thumb</b> walk</li>
                  <li><b>Right thumb</b> look</li>
                  <li><b>✋</b> open doors &amp; windows</li>
                  <li><b>🗺️</b> big map</li>
                </>
              ) : (
                <>
                  <li><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> walk</li>
                  <li><b>Mouse</b> look</li>
                  <li><kbd>E</kbd> open doors &amp; windows</li>
                  <li><kbd>Shift</kbd> run · <kbd>M</kbd> map · <kbd>Esc</kbd> pause</li>
                </>
              )}
            </ul>
            {prize.live
              ? <div className="hh-prize-live">🏆 A prize round is live: find the Golden Chip and escape to reveal this round’s secret code — winners are paid by {CONTEST.payout}.</div>
              : <div className="hh-prize-off">No prize round is running right now{prize.next ? ` — the next one starts ${prize.next}` : ''}. Follow <a href={CONTEST.facebookUrl} target="_blank" rel="noopener noreferrer">{CONTEST.handle}</a> to hear when it does.</div>}
            {!touch && <button type="button" className="hh-btn" onClick={play}>Start the hunt →</button>}
            {best !== null && <div className="hh-best">Your best time: {fmt(best)}</div>}
          </div>
        </div>
      )}

      {/* Pause / poster */}
      {phase === 'paused' && reason !== 'poster' && (
        <div className="hh-overlay">
          <div className="hh-card hh-card-sm">
            <h3 className="hh-title-sm">Paused</h3>
            <p className="hh-lead">The clock is stopped. Ready when you are.</p>
            <div className="hh-row">
              <button type="button" className="hh-btn" onClick={resume}>Resume</button>
              <button type="button" className="hh-btn hh-btn-ghost" onClick={restart}>Restart</button>
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
              <span>🚪 {result.rooms}/{result.totalRooms} rooms</span>
              <span>{result.golden ? '✨ Golden Chip' : '— no Golden Chip'}</span>
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
.hh-map { position: absolute; top: 12px; right: 12px; width: 168px; height: 168px; border-radius: 16px; overflow: hidden; border: 2px solid rgba(255,255,255,0.75); box-shadow: 0 8px 24px rgba(15,23,42,0.3); background: #0b1222; pointer-events: auto; cursor: pointer; transition: all .25s cubic-bezier(.22,1,.36,1); }
.hh-map canvas { width: 100%; height: 100%; display: block; }
.hh-map-big { top: 50%; right: 50%; transform: translate(50%, -50%); width: min(70vh, 86%); height: min(70vh, 86%); }
.hh-map-tag { position: absolute; bottom: 6px; right: 8px; font-size: 0.65rem; font-weight: 700; color: rgba(248,250,252,0.85); background: rgba(15,23,42,0.6); padding: 2px 6px; border-radius: 6px; }
.hh-cross { position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; border-radius: 50%; background: rgba(255,255,255,0.9); box-shadow: 0 0 0 2px rgba(15,23,42,0.35); }
.hh-prompt { position: absolute; left: 50%; bottom: 22px; transform: translateX(-50%); background: rgba(15,23,42,0.82); color: #fff; padding: 8px 16px; border-radius: 12px; font-weight: 600; font-size: 0.9rem; transition: opacity .15s; white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; }
.hh-is-touch .hh-prompt { bottom: auto; top: 54px; left: 12px; transform: none; max-width: calc(100% - 150px); white-space: normal; font-size: 0.8rem; line-height: 1.35; }
.hh-is-touch .hh-toast { top: 92px; }
.hh-btn-top { margin: 0 0 1rem; width: 100%; }
.hh-toast { position: absolute; top: 58px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg,#2563eb,#7c3aed); color: #fff; padding: 9px 16px; border-radius: 12px; font-weight: 700; font-size: 0.9rem; box-shadow: 0 10px 30px rgba(37,99,235,0.35); animation: hh-pop .35s cubic-bezier(.34,1.56,.64,1); white-space: nowrap; max-width: 92%; overflow: hidden; text-overflow: ellipsis; }
.hh-toast-gold { background: linear-gradient(135deg,#f59e0b,#fbbf24); color: #422006; white-space: normal; text-align: center; }
@keyframes hh-pop { from { transform: translate(-50%, -8px) scale(.9); opacity: 0; } to { transform: translate(-50%, 0) scale(1); opacity: 1; } }
.hh-corner { position: absolute; bottom: 12px; right: 12px; display: flex; gap: 6px; pointer-events: auto; }
.hh-is-touch .hh-corner { bottom: auto; top: 188px; right: 12px; flex-direction: column; }
.hh-icon { width: 36px; height: 36px; border-radius: 10px; border: none; background: rgba(15,23,42,0.7); color: #fff; font-size: 1rem; cursor: pointer; }
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
}
@media (prefers-reduced-motion: reduce) { .hh-toast { animation: none; } .hh-map { transition: none; } }
`;
