import { MessageSquare, UserRound, FolderHeart, Building2, MessageCircle } from 'lucide-react';
import { openWhatsApp } from '../data/contact';

// "Loma is growing" on the Loma page: what Loma can do now and what is coming.
// No dates on purpose. Keep it in step with docs/ROADMAP.md.

const EARLY_ACCESS_MESSAGE = "Bula LvTS, I'd like early access to Loma's new features.";

const STAGES = [
  {
    icon: <MessageSquare size={22} />, color: '#16a34a', badge: 'Available now', title: 'Chat and files',
    desc: 'Ask tech questions any time, and attach a photo, screenshot, PDF, Word, Excel or text file to ask about it.',
  },
  {
    icon: <UserRound size={22} />, color: '#2563eb', badge: 'Coming next', title: 'Your own Loma account',
    desc: 'Sign in so Loma remembers you, your devices and your past chats, and picks up where you left off.',
  },
  {
    icon: <FolderHeart size={22} />, color: '#7c3aed', badge: 'Planned', title: 'Your personal workspace',
    desc: 'Keep your files, photos and videos in one private place, and save your MediTrack health records to your account.',
  },
  {
    icon: <Building2 size={22} />, color: '#d97706', badge: 'Planned', title: 'Loma for business and schools',
    desc: 'Accounts for small businesses, schools and teams, with free and paid plans.',
  },
];

export default function LomaRoadmap() {
  return (
    <section aria-labelledby="loma-growing" style={{ maxWidth: 900, margin: '4rem auto 0', position: 'relative' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.6rem' }}>The road ahead</div>
        <h2 id="loma-growing" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem,4vw,2.3rem)', color: '#0f172a', lineHeight: 1.15, margin: '0 0 0.8rem' }}>
          Loma is <span className="grad-text">growing</span>
        </h2>
        <p style={{ color: '#64748b', lineHeight: 1.75, maxWidth: 620, margin: '0 auto' }}>
          Loma is the LvTS AI assistant, built in Raiwai, Suva for people in Fiji and the Pacific. Here’s what Loma can do today, and what we’re building next.
        </p>
      </div>

      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(200px,100%),1fr))', gap: '1rem' }}>
        {STAGES.map((s, i) => (
          <li key={s.title} className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: '1.3rem', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <span style={{ color: s.color }}>{s.icon}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: s.color, background: `${s.color}14`, border: `1px solid ${s.color}33`, borderRadius: 999, padding: '0.15rem 0.55rem' }}>
                {s.badge}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700, marginBottom: '0.2rem' }}>Step {i + 1}</div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>{s.title}</div>
            <div style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
          </li>
        ))}
      </ol>

      <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
        <button type="button" onClick={() => openWhatsApp(EARLY_ACCESS_MESSAGE)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.85rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
          <MessageCircle size={18} /> Get early access
        </button>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.6rem' }}>Tell us on WhatsApp and we’ll let you know when accounts open.</div>
      </div>
    </section>
  );
}
