import { useState } from 'react';
import { pageLink } from '../links';
import { SITE_URL } from '../data/routes';

// Home page, "Discover LvTS" campaign: the vision, who LvTS is for, and a
// Share button so visitors can pass the site on (the campaign's last step).

const SHARE_TEXT = 'Discover LvTS: Living With Technology. Explore. Learn. Play. Connect. Built in Fiji.';

export default function DiscoverVision({ onNav }: { onNav: (p: string) => void }) {
  const [shared, setShared] = useState('');

  // Phones open their own share sheet; computers copy the link instead.
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Discover LvTS', text: SHARE_TEXT, url: SITE_URL });
        return;
      }
      await navigator.clipboard.writeText(`${SHARE_TEXT} ${SITE_URL}`);
      setShared('Link copied. Paste it anywhere to share.');
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') setShared(`Copy this link: ${SITE_URL}`);
    }
  }

  const who = [
    { e: '👪', t: 'Parents', d: 'A free, ad-free place for little ones to learn letters, numbers, animals and more.', page: 'kids', go: 'Try Noqu Vuli' },
    { e: '🎒', t: 'Children & students', d: 'Explore Raiwai in 3D, make a character and learn through play.', page: 'house', go: 'Play Noqublox' },
    { e: '🏫', t: 'Schools & teachers', d: 'See what interactive digital learning in English and iTaukei can look like.', page: 'kids', go: 'See Noqu Vuli' },
    { e: '🏪', t: 'Local businesses', d: 'Websites and digital services that help customers find you and get in touch.', page: 'services', go: 'Our services' },
  ];

  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.3rem 1.3rem', display: 'flex', flexDirection: 'column' };

  return (
    <section style={{ padding: '80px 1.5rem', background: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 380, height: 380, background: 'rgba(8,145,178,0.07)', top: '-8%', left: '-6%' }} />
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', maxWidth: 760, margin: '0 auto 2.4rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0891b2', marginBottom: '0.6rem' }}>🏝️ Our vision</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '0.9rem' }}>
            Locally inspired. Built in Fiji. <span className="grad-text">Designed to connect people.</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
            Our vision is simple: make technology accessible, encourage learning and create opportunities for our
            local communities. You don't have to be a technology expert to explore what we are building.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(230px,100%),1fr))', gap: '1rem' }}>
          {who.map(w => (
            <div key={w.t} style={card}>
              <div style={{ fontSize: 30, marginBottom: '0.6rem' }} aria-hidden="true">{w.e}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '0.4rem' }}>{w.t}</div>
              <p style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '0.9rem' }}>{w.d}</p>
              <a {...pageLink(w.page, onNav)} style={{ marginTop: 'auto', color: '#2563eb', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>{w.go} →</a>
            </div>
          ))}
        </div>

        {/* Communities: the closing line and the Share button */}
        <div style={{ marginTop: '1.4rem', borderRadius: 24, padding: '2rem 1.5rem', textAlign: 'center', color: '#fff', background: 'linear-gradient(135deg,#2563eb 0%,#7c3aed 55%,#0891b2 100%)', boxShadow: '0 16px 36px rgba(37,99,235,0.25)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.9, marginBottom: '0.6rem' }}>🤝 For Fiji communities</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.35rem,3.6vw,2rem)', lineHeight: 1.2, marginBottom: '0.6rem' }}>
            One website. Multiple experiences. One local vision.
          </div>
          <p style={{ opacity: 0.92, fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 1.3rem' }}>
            Support technology made here. Explore what we're building, then share it with family, friends and your school.
          </p>
          <button type="button" onClick={share}
            style={{ background: '#fff', color: '#2563eb', border: 'none', borderRadius: 9999, padding: '0.85rem 1.9rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.98rem', cursor: 'pointer', boxShadow: '0 5px 0 rgba(255,255,255,0.45)' }}>
            Share LvTS 🔗
          </button>
          <div role="status" style={{ minHeight: '1.4rem', marginTop: '0.8rem', fontSize: '0.88rem', fontWeight: 600, wordBreak: 'break-all' }}>{shared}</div>
        </div>
      </div>
    </section>
  );
}
