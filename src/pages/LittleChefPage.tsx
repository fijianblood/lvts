import { pageLink } from '../links';

// Little Chef Fiji: a pretend-cooking game for young children, part of the
// Little Learners Fiji platform. The game is one self-contained page,
// public/little-chef/app.html, shown here in a frame (like Noqu Vuli and
// MediTrack). It needs nothing from the internet and saves progress on the
// device only. It is digital pretend play — no real knives, stove or heat.

export default function LittleChefPage({ onNav }: { onNav: (p: string) => void }) {
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #f0e2d0', borderRadius: 16, padding: '1.3rem 1.4rem' };
  const h3: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#3b2a1e', fontSize: '1rem', marginBottom: '0.5rem' };
  const p: React.CSSProperties = { color: '#6b5544', fontSize: '0.9rem', lineHeight: 1.7 };

  return (
    <section style={{ padding: '96px 1.5rem 100px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(255,122,47,0.10)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(255,210,63,0.14)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '1.75rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#e85d12', marginBottom: '0.75rem' }}>
          Little Learners Fiji · Ages 3–5 · Free
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#3b2a1e', lineHeight: 1.1, marginBottom: '1rem' }}>
          Little <span className="grad-text">Chef</span> Fiji
        </h1>
        <p style={{ color: '#6b5544', fontSize: '1rem', lineHeight: 1.75 }}>
          A friendly pretend-cooking game for young children. Make a tropical fruit salad — choose the fruit, wash it,
          slice it (all pretend!), mix it in the bowl and serve — while learning fruit names, colours and counting.
          Instructions are read out loud, with iTaukei words along the way.
        </p>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto 2.5rem', position: 'relative' }}>
        <iframe
          src={`${import.meta.env.BASE_URL}little-chef/app.html`}
          title="Little Chef Fiji pretend cooking game"
          allow="autoplay"
          style={{ width: '100%', height: 'min(900px, calc(100vh - 120px))', minHeight: 640, border: 'none', display: 'block', borderRadius: 32 }}
        />
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '1rem' }}>
        <div style={card}>
          <div style={h3}>Pretend play, kept safe</div>
          <p style={p}>Everything is digital pretend cooking — no real knives, stove or hot things, and we ask a grown-up to play along. No camera, no ads, no sign-up.</p>
        </div>
        <div style={card}>
          <div style={h3}>For parents &amp; teachers</div>
          <p style={p}>Short, gentle activities with spoken words, big buttons and lots of encouragement. Your child's name and stars are saved on this device only; nothing is uploaded.</p>
        </div>
        <div style={card}>
          <div style={h3}>Learn with Noqu Vuli too</div>
          <p style={p}>
            Letters, numbers, animals and shapes in English and iTaukei are in{' '}
            <a {...pageLink('kids', onNav)} style={{ color: '#e85d12', fontWeight: 700 }}>Noqu Vuli</a>, our free kids app.
          </p>
        </div>
      </div>
    </section>
  );
}
