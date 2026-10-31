import { CheckCircle2, ExternalLink, Info, Link2, ShieldAlert, Video } from 'lucide-react';
import { useScrollFade } from '../hooks/useScrollFade';
import { CHECKED_ON, GUIDE_DESCRIPTION, OTHER_PEOPLES_VIDEOS, VIDEO_GUIDES } from '../data/videoGuides';

// The same guide is also built as a plain, search-indexable page (see vite.config.ts).
const SHARE_URL = `${import.meta.env.BASE_URL}save-your-videos/`;

export default function SaveVideosPage({ onNav }: { onNav: (p: string) => void }) {
  const heroRef = useScrollFade();

  // The app routes on #hash, so jump links scroll instead of changing the hash.
  function jump(id: string) {
    document.getElementById(`guide-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 400, height: 400, background: 'rgba(37,99,235,0.06)', top: '-10%', right: '-5%' }} />

      <div ref={heroRef} className="fade-in" style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
          <Video size={14} /> Free Guide
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Save Your <span className="grad-text">Own Videos</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, marginBottom: '0.75rem' }}>{GUIDE_DESCRIPTION}</p>
        <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6 }}>
          Checked against each platform's official help pages on {CHECKED_ON}. Menus change often — if yours looks different, use the official help link under each section.
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          {VIDEO_GUIDES.map(g => (
            <button key={g.id} onClick={() => jump(g.id)}
              style={{ background: '#fff', border: '1px solid #e2e8f0', borderLeft: `4px solid ${g.color}`, borderRadius: 8, padding: '0.45rem 0.85rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', cursor: 'pointer' }}>
              {g.name}
            </button>
          ))}
        </div>

        {VIDEO_GUIDES.map(g => (
          <div key={g.id} id={`guide-${g.id}`} className="card-3d"
            style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `4px solid ${g.color}`, borderRadius: 16, padding: '1.6rem', boxShadow: '0 8px 40px rgba(0,0,0,0.06)', marginBottom: '1.5rem', scrollMarginTop: 100 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', marginBottom: '0.3rem' }}>{g.name}</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>{g.summary}</p>

            {g.methods.map(m => (
              <div key={m.title} style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.9rem', marginBottom: '0.9rem' }}>
                <h3 style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.6rem' }}>{m.title}</h3>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {m.steps.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.9rem', color: '#334155', lineHeight: 1.55 }}>
                      <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: g.color, color: '#fff', fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
                {m.notes?.length ? (
                  <ul style={{ listStyle: 'none', padding: '0.7rem 0.8rem', margin: '0.7rem 0 0', background: '#f8fafc', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {m.notes.map((n, i) => (
                      <li key={i} style={{ display: 'flex', gap: '0.45rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                        <Info size={14} style={{ flexShrink: 0, marginTop: 2 }} /> <span>{n}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.7rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#94a3b8' }}>Official help</div>
              {g.sources.map(s => (
                <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', overflowWrap: 'anywhere' }}>
                  <ExternalLink size={13} style={{ flexShrink: 0 }} /> {s.label}
                </a>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: '1.4rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#9a3412', marginBottom: '0.5rem' }}>
            <ShieldAlert size={18} /> What about other people's videos?
          </div>
          <p style={{ color: '#7c2d12', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>{OTHER_PEOPLES_VIDEOS}</p>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.4rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>
            <CheckCircle2 size={18} color="#16a34a" /> Need a hand?
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1rem' }}>
            Phone full, lost videos, or can't open the export file? We can help in Raiwai, Suva.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.6rem' }}>
            <button onClick={() => onNav('contact')}
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.7rem 1.2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Contact LvTS
            </button>
            <a href={SHARE_URL}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', padding: '0.7rem 1.2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
              <Link2 size={16} /> Shareable version
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
