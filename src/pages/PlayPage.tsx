import { useEffect, useMemo, useState } from 'react';
import { Play, RotateCcw, CheckCircle2, Lock, Trophy, Lightbulb, Gamepad2, User, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { useScrollFade } from '../hooks/useScrollFade';
import { runWeave } from '../lang/weave';
import { WEAVE_CHALLENGES, SANDBOX_SAMPLE, CHEATSHEET } from '../data/weaveChallenges';
import { PHASE1_LEVEL_COUNT, PHASE1_LAST_IDX, PHASE2_UNLOCK_DATE } from '../lib/weaveContest';

const PROGRESS_KEY = 'weave_progress_v1';
const SIGNUP_KEY = 'weave_signup_v1';
const COMPLETION_KEY_PHASE1 = 'weave_completion_notified_phase1_v1';
const COMPLETION_KEY_PHASE2 = 'weave_completion_notified_phase2_v1';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdlvpyl';

interface Player {
  name: string;
  email: string;
  phone: string;
}

function loadProgress(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
}
function saveProgress(p: Record<string, boolean>) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

function loadPlayer(): Player | null {
  try { return JSON.parse(localStorage.getItem(SIGNUP_KEY) || 'null'); } catch { return null; }
}
function savePlayer(p: Player) {
  try { localStorage.setItem(SIGNUP_KEY, JSON.stringify(p)); } catch { /* storage unavailable */ }
}

function outputsMatch(actual: string[], expected: string[]) {
  if (actual.length !== expected.length) return false;
  return actual.every((line, i) => line.trim() === expected[i].trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+\-\s()]{6,20}$/;

function SignupGate({ onSignedUp }: { onSignedUp: (p: Player) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) { setError('Please enter your name.'); return; }
    if (!EMAIL_RE.test(email.trim())) { setError('Please enter a valid email address.'); return; }
    if (!PHONE_RE.test(trimmedPhone)) { setError('Please enter a valid phone number.'); return; }

    setError('');
    setSubmitting(true);
    const player: Player = { name: trimmedName, email: email.trim(), phone: trimmedPhone };
    try {
      const data = new FormData();
      data.append('name', player.name);
      data.append('email', player.email);
      data.append('phone', player.phone);
      data.append('_subject', 'Weave Playground — new signup');
      data.append('message', `${player.name} just signed up to play the Weave Playground $50 FJD contest.`);
      const res = await fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('Submission failed');
      savePlayer(player);
      onSignedUp(player);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '0.75rem 1rem 0.75rem 2.5rem', color: '#0f172a', fontFamily: "'Space Grotesk',sans-serif",
    fontSize: '0.95rem', outline: 'none',
  };
  const iconStyle: React.CSSProperties = { position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };

  return (
    <div style={{ maxWidth: 460, margin: '0 auto' }}>
      <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.6rem' }}>
        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', marginBottom: '0.4rem' }}>Enter to play</div>
        <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
          Sign up with your name, email, and phone number to unlock Level 1. This is how the winner gets contacted — no account, no password.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ position: 'relative' }}>
            <User size={16} style={iconStyle} />
            <input type="text" placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={iconStyle} />
            <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ position: 'relative' }}>
            <Phone size={16} style={iconStyle} />
            <input type="tel" placeholder="Phone number" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.6rem 0.75rem', color: '#ef4444', fontSize: '0.8rem' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.8rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9rem', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Signing up…</> : 'Start Playing →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const heroRef = useScrollFade();
  const [player, setPlayer] = useState<Player | null>(() => loadPlayer());
  const [mode, setMode] = useState<'challenges' | 'sandbox'>('challenges');
  const [progress, setProgress] = useState<Record<string, boolean>>(() => loadProgress());
  const [levelIdx, setLevelIdx] = useState(0);
  const [code, setCode] = useState(WEAVE_CHALLENGES[0].starter);
  const [sandboxCode, setSandboxCode] = useState(SANDBOX_SAMPLE);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | undefined>();
  const [solved, setSolved] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [sandboxHasRun, setSandboxHasRun] = useState(false);

  const level = WEAVE_CHALLENGES[levelIdx];
  const solvedCount = useMemo(() => Object.values(progress).filter(Boolean).length, [progress]);
  const hintAvailable = levelIdx < 10; // levels 11-20 are hint-free — figure it out yourself

  useEffect(() => {
    setCode(level.starter);
    setOutput([]);
    setError(undefined);
    setSolved(false);
    setShowHint(false);
    setHasRun(false);
  }, [levelIdx, level.starter]);

  useEffect(() => {
    if (!solved || levelIdx !== PHASE1_LAST_IDX || !player) return;
    if (localStorage.getItem(COMPLETION_KEY_PHASE1)) return;
    localStorage.setItem(COMPLETION_KEY_PHASE1, '1');
    const data = new FormData();
    data.append('name', player.name);
    data.append('email', player.email);
    data.append('phone', player.phone);
    data.append('_subject', `Weave Playground — Phase 1 WINNER finished level ${PHASE1_LEVEL_COUNT}`);
    data.append('message', `${player.name} (${player.email}, ${player.phone}) just completed level ${PHASE1_LEVEL_COUNT} (Phase 1) at ${new Date().toISOString()}.`);
    fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } }).catch(() => {
      // best-effort — the visible victory page + comment is the primary claim path
    });
  }, [solved, levelIdx, player]);

  useEffect(() => {
    if (!solved || levelIdx !== WEAVE_CHALLENGES.length - 1 || !player) return;
    if (localStorage.getItem(COMPLETION_KEY_PHASE2)) return;
    localStorage.setItem(COMPLETION_KEY_PHASE2, '1');
    const data = new FormData();
    data.append('name', player.name);
    data.append('email', player.email);
    data.append('phone', player.phone);
    data.append('_subject', 'Weave Playground — Phase 2 WINNER finished all 50 levels');
    data.append('message', `${player.name} (${player.email}, ${player.phone}) just completed all ${WEAVE_CHALLENGES.length} levels (Phase 2) at ${new Date().toISOString()}.`);
    fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } }).catch(() => {
      // best-effort — the visible victory page + comment is the primary claim path
    });
  }, [solved, levelIdx, player]);

  function runChallenge() {
    const result = runWeave(code);
    setOutput(result.output);
    setError(result.error);
    setHasRun(true);
    if (!result.error && outputsMatch(result.output, level.expected)) {
      setSolved(true);
      if (!progress[level.id]) {
        const next = { ...progress, [level.id]: true };
        setProgress(next);
        saveProgress(next);
      }
    } else {
      setSolved(false);
    }
  }

  function runSandbox() {
    const result = runWeave(sandboxCode);
    setOutput(result.output);
    setError(result.error);
    setSandboxHasRun(true);
  }

  const isDateLocked = (idx: number) => idx > PHASE1_LAST_IDX && new Date() < PHASE2_UNLOCK_DATE;
  const isUnlocked = (idx: number) => !isDateLocked(idx) && (idx === 0 || progress[WEAVE_CHALLENGES[idx - 1].id]);

  const consoleStyle: React.CSSProperties = {
    background: '#0a1120',
    border: '1px solid #1e3355',
    borderRadius: 10,
    padding: '1rem',
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: '0.8rem',
    color: '#d1e5ff',
    minHeight: 160,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowY: 'auto',
    maxHeight: 320,
  };

  const editorStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 220,
    background: '#0d1f3c',
    border: '1px solid #1e3355',
    borderRadius: 10,
    padding: '1rem',
    color: '#e6f0ff',
    fontFamily: "'JetBrains Mono',monospace",
    fontSize: '0.8rem',
    lineHeight: 1.6,
    resize: 'vertical',
    outline: 'none',
  };

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '120px 1.5rem 50px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.08)', top: '-10%', left: '-5%' }} />
        <div ref={heroRef} className="fade-in" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>
            <Gamepad2 size={14} /> Interactive
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
            The <span className="grad-text">Weave</span> Playground
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
            A tiny coding language I built where the keywords are web-dev concepts — <code style={{ color: '#0891b2' }}>state</code>, <code style={{ color: '#0891b2' }}>component</code>, <code style={{ color: '#0891b2' }}>mount</code>, <code style={{ color: '#0891b2' }}>route</code>. Real interpreter, running live in your browser. Play through the levels or freestyle in the sandbox.
          </p>

          <div style={{ marginTop: '1.75rem', background: 'linear-gradient(135deg,#16a34a,#0891b2,#2563eb)', borderRadius: 14, padding: '1.2rem 1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <Trophy size={18} color="#fff" />
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Two $50 FJD Contests</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.85rem', lineHeight: 1.7, textAlign: 'left', maxWidth: 560, margin: '0 auto' }}>
              <strong>Phase 1 — Levels 1–{PHASE1_LEVEL_COUNT}:</strong> open 12 August 2026, 6:00 PM – 30 August 2026, 7:00 PM (Fiji time).
              First to finish level {PHASE1_LEVEL_COUNT}, screenshot the victory page, and post it in the comments wins $50 FJD.
              <br /><br />
              <strong>Phase 2 — Levels {PHASE1_LEVEL_COUNT + 1}–{WEAVE_CHALLENGES.length}:</strong> stay locked until 10 September 2026, then run until 20 October 2026, 7:00 PM (Fiji time).
              First to finish level {WEAVE_CHALLENGES.length} during that window wins a second $50 FJD.
            </div>
          </div>
        </div>

        {!player ? (
          <SignupGate onSignedUp={setPlayer} />
        ) : (
        <>
        {/* Mode toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {(['challenges', 'sandbox'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                background: mode === m ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#fff',
                color: mode === m ? '#fff' : '#475569',
                border: mode === m ? 'none' : '1px solid #e2e8f0',
                padding: '0.6rem 1.4rem', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
                fontFamily: "'Space Grotesk',sans-serif",
              }}>
              {m === 'challenges' ? '🎮 Challenges' : '🛠 Sandbox'}
            </button>
          ))}
        </div>

        {mode === 'challenges' ? (
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: '2rem', alignItems: 'start' }}>
            {/* Level list */}
            <div>
              <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.2rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Trophy size={18} color="#d97706" />
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{solvedCount} / {WEAVE_CHALLENGES.length} Levels Complete</div>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(solvedCount / WEAVE_CHALLENGES.length) * 100}%`, background: 'linear-gradient(90deg,#2563eb,#7c3aed)', transition: 'width 0.4s ease' }} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {WEAVE_CHALLENGES.map((c, idx) => {
                  const unlocked = isUnlocked(idx);
                  const dateLocked = isDateLocked(idx);
                  const done = !!progress[c.id];
                  return (
                    <button key={c.id} disabled={!unlocked} onClick={() => setLevelIdx(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'left',
                        background: idx === levelIdx ? 'rgba(37,99,235,0.08)' : '#fff',
                        border: idx === levelIdx ? '1px solid rgba(37,99,235,0.4)' : '1px solid #e2e8f0',
                        borderRadius: 10, padding: '0.75rem 0.9rem', cursor: unlocked ? 'pointer' : 'not-allowed',
                        opacity: unlocked ? 1 : 0.5, fontFamily: "'Space Grotesk',sans-serif",
                      }}>
                      {done ? <CheckCircle2 size={16} color="#16a34a" /> : unlocked ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #94a3b8', display: 'inline-block' }} /> : <Lock size={14} color="#94a3b8" />}
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: unlocked ? '#0f172a' : '#94a3b8', flex: 1 }}>{c.title}</span>
                      {dateLocked && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 999, padding: '0.15rem 0.5rem', flexShrink: 0 }}>
                          Opens Sep 10
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editor + console */}
            <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
              <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.4rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem', marginBottom: '0.4rem' }}>{level.title}</div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>{level.brief}</p>

                <textarea spellCheck={false} value={code} onChange={e => setCode(e.target.value)} style={editorStyle} />

                <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
                  <button onClick={runChallenge}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.6rem 1.3rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <Play size={15} /> Run
                  </button>
                  <button onClick={() => { setCode(level.starter); setOutput([]); setError(undefined); setSolved(false); setHasRun(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid #e2e8f0', color: '#475569', padding: '0.6rem 1.1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                    <RotateCcw size={14} /> Reset
                  </button>
                  {hintAvailable && (
                    <button onClick={() => setShowHint(h => !h)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid #e2e8f0', color: '#d97706', padding: '0.6rem 1.1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      <Lightbulb size={14} /> {showHint ? 'Hide Hint' : 'Hint'}
                    </button>
                  )}
                </div>

                {hintAvailable && showHint && (
                  <pre style={{ marginTop: '0.8rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', color: '#92400e', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'pre-wrap' }}>{level.hint}</pre>
                )}

                {solved && levelIdx !== PHASE1_LAST_IDX && levelIdx !== WEAVE_CHALLENGES.length - 1 && (
                  <div style={{ marginTop: '0.9rem', background: 'linear-gradient(135deg,rgba(22,163,74,0.1),rgba(8,145,178,0.06))', border: '1px solid rgba(22,163,74,0.3)', borderRadius: 10, padding: '0.9rem 1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={18} color="#16a34a" />
                      <span style={{ fontWeight: 700, color: '#166534', fontSize: '0.9rem' }}>Level solved! 🎉</span>
                    </div>
                    {!isDateLocked(levelIdx + 1) && (
                      <button onClick={() => setLevelIdx(i => i + 1)}
                        style={{ background: 'linear-gradient(135deg,#16a34a,#0891b2)', border: 'none', color: '#fff', padding: '0.5rem 1.1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Next Level →
                      </button>
                    )}
                  </div>
                )}

                {solved && levelIdx === PHASE1_LAST_IDX && (
                  <div id="phase1-victory-page" style={{ marginTop: '0.9rem', background: 'linear-gradient(135deg,#16a34a,#0891b2,#2563eb)', borderRadius: 12, padding: '1.4rem 1.6rem', textAlign: 'center' }}>
                    <Trophy size={26} color="#fff" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>
                      PHASE 1 COMPLETE — Level {PHASE1_LEVEL_COUNT} solved! 🏆
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.7 }}>
                      Screenshot this page and post it in the comments to claim your $50 FJD — first to comment wins.
                      Phase 1 runs 12 August 2026 6:00 PM – 30 August 2026 7:00 PM.
                      <br />
                      Levels 37–50 open 10 September 2026 for a second $50 FJD prize — come back then!
                    </div>
                    <a href={`${import.meta.env.BASE_URL}#contact`}
                      style={{ display: 'inline-block', background: '#fff', color: '#166534', padding: '0.6rem 1.4rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                      Contact Me →
                    </a>
                  </div>
                )}

                {solved && levelIdx === WEAVE_CHALLENGES.length - 1 && (
                  <div id="victory-page" style={{ marginTop: '0.9rem', background: 'linear-gradient(135deg,#16a34a,#0891b2,#2563eb)', borderRadius: 12, padding: '1.4rem 1.6rem', textAlign: 'center' }}>
                    <Trophy size={26} color="#fff" style={{ marginBottom: '0.5rem' }} />
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#fff', marginBottom: '0.4rem' }}>
                      PHASE 2 COMPLETE — All {WEAVE_CHALLENGES.length} levels complete! 🏆
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.7 }}>
                      Screenshot this page and post it in the comments to claim your $50 FJD — first to comment wins.
                      Phase 2 runs 10 September 2026 6:00 PM – 20 October 2026 7:00 PM.
                    </div>
                    <a href={`${import.meta.env.BASE_URL}#contact`}
                      style={{ display: 'inline-block', background: '#fff', color: '#166534', padding: '0.6rem 1.4rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                      Contact Me →
                    </a>
                  </div>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>Output</div>
                  <div style={consoleStyle}>
                    {error ? <span style={{ color: '#f87171' }}>Error: {error}</span>
                      : output.length ? output.join('\n')
                      : hasRun ? <span style={{ color: '#475569' }}>(no output — your code ran, but nothing called mount() to print anything)</span>
                      : <span style={{ color: '#475569' }}>Run your code to see output here…</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.4rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.05rem' }}>Free Sandbox</div>
                <button onClick={() => { setSandboxCode(SANDBOX_SAMPLE); setOutput([]); setError(undefined); setSandboxHasRun(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid #e2e8f0', color: '#475569', padding: '0.45rem 1rem', borderRadius: 8, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <RotateCcw size={13} /> Reset Sample
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1rem' }}>
                <textarea spellCheck={false} value={sandboxCode} onChange={e => setSandboxCode(e.target.value)} style={{ ...editorStyle, minHeight: 320 }} />
                <div style={{ ...consoleStyle, maxHeight: 320, minHeight: 320 }}>
                  {error ? <span style={{ color: '#f87171' }}>Error: {error}</span>
                    : output.length ? output.join('\n')
                    : sandboxHasRun ? <span style={{ color: '#475569' }}>(no output — nothing called mount() to print anything)</span>
                    : <span style={{ color: '#475569' }}>Hit Run to see the sample program execute, then edit the code directly — it's a real interpreter.</span>}
                </div>
              </div>
              <button onClick={runSandbox}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.9rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.6rem 1.3rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                <Play size={15} /> Run
              </button>
            </div>
          </div>
        )}

        {/* Cheatsheet */}
        <div style={{ maxWidth: 1100, margin: '3rem auto 0' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem', textAlign: 'center' }}>Keyword Cheatsheet</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: '0.75rem' }}>
            {CHEATSHEET.map(k => (
              <div key={k.code} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.8rem 1rem' }}>
                <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.78rem', color: '#0891b2', fontWeight: 700 }}>{k.code}</code>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{k.desc}</div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}
      </section>
    </>
  );
}
