import { pageLink } from '../links';

// Noqu Vuli: a play-and-learn game for young children (ABC, numbers, animals,
// shapes and colours) in English and iTaukei.
//
// The game itself is one self-contained page, public/kids/app.html, shown here
// in a frame (like MediTrack). It needs nothing from the internet and saves
// progress on the device only. The iTaukei words and how to add your own
// recordings are explained at the top of that file.

export default function KidsLearnPage({ onNav }: { onNav: (p: string) => void }) {
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.3rem 1.4rem' };
  const h3: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#0f172a', fontSize: '1rem', marginBottom: '0.5rem' };
  const p: React.CSSProperties = { color: '#475569', fontSize: '0.9rem', lineHeight: 1.7 };

  return (
    <section style={{ padding: '96px 1.5rem 100px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(109,74,255,0.08)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(255,210,63,0.12)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '1.75rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6d4aff', marginBottom: '0.75rem' }}>
          Kids · English + iTaukei · Free
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Noqu <span className="grad-text">Vuli</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          Play and learn for young children: letters, counting, animals, shapes and colours, with a daily
          challenge, stars and a sticker book. Questions are read out loud, and the words come in English and iTaukei.
        </p>
      </div>

      <div style={{ maxWidth: 460, margin: '0 auto 2.5rem', position: 'relative' }}>
        <iframe
          src={`${import.meta.env.BASE_URL}kids/app.html`}
          title="Noqu Vuli kids learning game"
          allow="autoplay"
          style={{ width: '100%', height: 'min(880px, calc(100vh - 120px))', minHeight: 640, border: 'none', display: 'block', borderRadius: 32 }}
        />
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '1rem' }}>
        <div style={card}>
          <div style={h3}>For parents</div>
          <p style={p}>No sign-up and no ads. Your child's name, stars and stickers are saved on this device only; nothing is uploaded. You can clear it under Profile.</p>
        </div>
        <div style={card}>
          <div style={h3}>iTaukei words</div>
          <p style={p}>Numbers 1 to 10, colours, animals and everyday things show their iTaukei word. Turn it off under Profile for English only.</p>
        </div>
        <div style={card}>
          <div style={h3}>Explore Noqublox</div>
          <p style={p}>
            Older kids can walk around Raiwai in 3D in{' '}
            <a {...pageLink('house', onNav)} style={{ color: '#2563eb', fontWeight: 700 }}>Noqublox</a>, our free browser game.
          </p>
        </div>
      </div>
    </section>
  );
}
