import { ExternalLink } from 'lucide-react';
import { hrefFor, pageLink } from '../links';
import { openWhatsApp } from '../data/contact';

// Home page, "Discover LvTS" campaign: the technology services section.
// It comes after Noqublox and Noqu Vuli on purpose: people try the games and
// learning first, then meet the business behind them. The website and
// training offers that used to sit in the top hero live here now.

const VITIKART_WEBSITE = 'https://www.vitikart.com.fj/914-website-design-development-fiji-we-make-websites';
const VITIKART_REMOTE = 'https://www.vitikart.com.fj/914-remote-it-service';

export default function DiscoverServices({ onNav }: { onNav: (p: string) => void }) {
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.5rem 1.4rem', display: 'flex', flexDirection: 'column', boxShadow: '0 6px 20px rgba(15,23,42,0.05)' };
  const icon: React.CSSProperties = { width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 26, marginBottom: '0.9rem' };
  const h3: React.CSSProperties = { fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#0f172a', marginBottom: '0.45rem' };
  const p: React.CSSProperties = { color: '#475569', fontSize: '0.92rem', lineHeight: 1.7, marginBottom: '1.1rem' };
  const cta: React.CSSProperties = { marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' };

  return (
    <section id="tech-services" style={{ padding: '80px 1.5rem', background: '#f8fafc', scrollMarginTop: 70 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto 2.4rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>💻 Technology services</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '0.9rem' }}>
            Tech for homes, schools <span className="grad-text">and businesses</span>
          </h2>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.2rem' }}>
            Behind the games and learning is a working local technology business. Discover our IT services, website
            development, computer support and other technology solutions.
          </p>
          <a href={VITIKART_REMOTE} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 9999, padding: '0.35rem 1rem', textDecoration: 'none' }}>
            <div className="pulse-ring" style={{ width: 7, height: 7, borderRadius: '50%', background: '#0891b2' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0891b2' }}>Available for hire · Raiwai, Suva, Fiji</span>
            <ExternalLink size={11} color="#0891b2" />
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '1rem' }}>
          <div style={card}>
            <div style={{ ...icon, background: 'rgba(37,99,235,0.1)' }} aria-hidden="true">🌐</div>
            <div style={h3}>Website development</div>
            <p style={p}>Websites for local businesses, built with modern tools and AI, so customers can find you and get in touch.</p>
            <a href={VITIKART_WEBSITE} target="_blank" rel="noopener noreferrer" style={cta}>Buy your own website <ExternalLink size={13} /></a>
          </div>
          <div style={card}>
            <div style={{ ...icon, background: 'rgba(124,58,237,0.1)' }} aria-hidden="true">🛠️</div>
            <div style={h3}>Computer &amp; laptop repair</div>
            <p style={p}>Slow PCs, Windows problems, upgrades, antivirus and printers, sorted in Raiwai or remotely.</p>
            <a {...pageLink('services', onNav)} style={cta}>See our services →</a>
          </div>
          <div style={card}>
            <div style={{ ...icon, background: 'rgba(242,169,60,0.14)' }} aria-hidden="true">🖧</div>
            <div style={h3}>Networking &amp; CCTV</div>
            <p style={p}>Office networks, Wi-Fi and CCTV set up properly, with a clear plan of how it all connects.</p>
            <button type="button" onClick={() => openWhatsApp("Bula LvTS, I'd like help with a network or CCTV setup.")}
              style={{ ...cta, background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit', fontWeight: 700 }}>
              Ask us on WhatsApp →
            </button>
          </div>
          <div style={card}>
            <div style={{ ...icon, background: 'rgba(51,153,51,0.12)' }} aria-hidden="true">🎓</div>
            <div style={h3}>Learn the tools</div>
            <p style={p}>Think AI can build a website on its own? Learn the tools it uses (Node.js, VS Code and Claude) on your own computer, and keep the skills.</p>
            <a href={VITIKART_REMOTE} target="_blank" rel="noopener noreferrer" style={cta}>Book your training <ExternalLink size={13} /></a>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          <a {...pageLink('services', onNav)}
            style={{ display: 'inline-flex', alignItems: 'center', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
            View all services
          </a>
          <a href={hrefFor('ask')} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1.5px solid rgba(37,99,235,0.3)', color: '#2563eb', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
            💬 Ask LvTS
          </a>
        </div>
      </div>
    </section>
  );
}
