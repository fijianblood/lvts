import { pageLink } from '../links';

// The home page's banner for Noqu Vuli, the kids learning page (/kids/).
// The phone on the right is a drawing made with plain HTML (no image file),
// a small copy of the game's home screen. The whole banner links to the page.

const TILES = [
  { bg: '#ffe27a', label: 'ABC', art: <><span style={{ color: '#22c55e' }}>A</span><span style={{ color: '#ef4444' }}>B</span><span style={{ color: '#3b82f6' }}>C</span></> },
  { bg: '#9fd8ff', label: 'Numbers', art: <><span style={{ color: '#ef4444' }}>1</span><span style={{ color: '#f59e0b' }}>2</span><span style={{ color: '#7c3aed' }}>3</span></> },
  { bg: '#bdeb7a', label: 'Animals', art: <span>🐮</span> },
  { bg: '#ffc6dd', label: 'Shapes', art: <span style={{ color: '#a855f7' }}>★▲</span> },
];

const CHIPS = ['🔤 ABC', '🔢 Count 1–10', '🐮 Animals', '🔺 Shapes & colours', '🔊 Read out loud'];

const DECOS: [string, string, string, number][] = [
  ['A', '4%', '12%', 44], ['1', '46%', '8%', 34], ['★', '92%', '14%', 30],
  ['B', '40%', '82%', 38], ['3', '94%', '78%', 40], ['✦', '8%', '84%', 26],
];

export default function KidsHero({ onNav }: { onNav: (p: string) => void }) {
  const link = pageLink('kids', onNav);

  return (
    <section
      aria-labelledby="kids-hero-title"
      style={{ position: 'relative', overflow: 'hidden', padding: '72px 1.5rem', background: 'linear-gradient(140deg,#7b5cff 0%,#6a46f5 50%,#5b3be6 100%)', color: '#fff' }}
    >
      {DECOS.map(([t, x, y, s], i) => (
        <span key={i} aria-hidden="true" className="kids-float"
          style={{ position: 'absolute', left: x, top: y, fontSize: s, fontWeight: 900, opacity: 0.14, animationDelay: `${i * 0.7}s`, pointerEvents: 'none', fontFamily: "'Syne',sans-serif" }}>
          {t}
        </span>
      ))}

      <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '2.5rem', alignItems: 'center' }}>
        {/* Words */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(255,255,255,0.16)', borderRadius: 9999, padding: '0.35rem 0.95rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
            New · Free for kids
          </div>
          <h2 id="kids-hero-title" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.1rem,5.5vw,3.6rem)', lineHeight: 1.04, letterSpacing: '-0.01em', marginBottom: '1rem', textShadow: '0 4px 0 rgba(40,20,140,0.22)' }}>
            Learn &amp; play with <span style={{ color: '#ffd23f' }}>Noqu Vuli</span>
          </h2>
          <p style={{ fontSize: 'clamp(0.98rem,2vw,1.1rem)', lineHeight: 1.75, color: 'rgba(255,255,255,0.92)', maxWidth: 520, marginBottom: '1.3rem' }}>
            Letters, counting, animals, shapes and colours for young children in Fiji, read out loud and in
            English and iTaukei. Daily challenges, stars and a sticker book keep them coming back.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.8rem' }}>
            {CHIPS.map(c => (
              <span key={c} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 9999, padding: '0.35rem 0.8rem', fontSize: '0.82rem', fontWeight: 600 }}>{c}</span>
            ))}
          </div>
          <a {...link}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', color: '#5b3be6', padding: '0.95rem 2rem', borderRadius: 9999, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '1rem', textDecoration: 'none', boxShadow: '0 6px 0 #c9bcff, 0 14px 26px rgba(20,0,90,0.28)', transition: 'transform 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
            Start Learning →
          </a>
          <p style={{ marginTop: '1.1rem', fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)' }}>
            No sign-up, no ads. Works on phones, tablets and computers.
          </p>
        </div>

        {/* Phone drawing */}
        <a {...link} aria-label="Open Noqu Vuli" style={{ justifySelf: 'center', position: 'relative', textDecoration: 'none', color: 'inherit', padding: '0 0 0 4.5rem' }}>
          <div style={{ width: 'min(270px,72vw)', background: '#f4f1ff', borderRadius: 36, border: '7px solid #fff', boxShadow: '0 30px 70px rgba(20,0,90,0.38)', padding: '1.1rem 0.9rem 1rem', color: '#1e1b3a', transform: 'rotate(3deg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.8rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#ffd23f,#ff9f43)', display: 'grid', placeItems: 'center', fontSize: 18 }}>🐢</div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>Bula!</div>
                <div style={{ fontSize: '0.66rem', color: '#6b6790', fontWeight: 600 }}>Let's learn something new!</div>
              </div>
              <div style={{ marginLeft: 'auto', background: '#fff', borderRadius: 9999, padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 800 }}>⭐ 85</div>
            </div>
            <div style={{ borderRadius: 18, padding: '0.8rem', background: 'linear-gradient(135deg,#7b5cff,#5b3be6)', color: '#fff', display: 'flex', alignItems: 'center', marginBottom: '0.8rem' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1rem', lineHeight: 1.05 }}>Daily<br />Challenge</div>
                <div style={{ display: 'inline-block', marginTop: '0.45rem', background: '#fff', color: '#6d4aff', borderRadius: 9999, padding: '0.18rem 0.6rem', fontSize: '0.62rem', fontWeight: 800 }}>Let's Go</div>
              </div>
              <span style={{ marginLeft: 'auto', fontSize: 40 }} aria-hidden="true">🏆</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
              {TILES.map(t => (
                <div key={t.label} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', textAlign: 'center' }}>
                  <div style={{ background: t.bg, height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, fontFamily: "'Syne',sans-serif" }}>{t.art}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, padding: '0.3rem 0' }}>{t.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Vonu the turtle, peeking out from the side */}
          <div aria-hidden="true" className="kids-float" style={{ position: 'absolute', left: 0, bottom: '-1.5rem', textAlign: 'center' }}>
            <div style={{ background: '#fff', color: '#1e1b3a', borderRadius: 14, padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.2rem', boxShadow: '0 6px 16px rgba(20,0,90,0.2)' }}>Bula! I'm Vonu.</div>
            <div style={{ fontSize: 68, lineHeight: 1, filter: 'drop-shadow(0 10px 12px rgba(20,0,90,0.35))' }}>🐢</div>
          </div>
        </a>
      </div>
    </section>
  );
}
