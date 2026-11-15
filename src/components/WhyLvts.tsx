import { BadgeCheck, MapPin, MessageCircle, Star, Tag, Wrench } from 'lucide-react';
import { CONTACT, openWhatsApp } from '../data/contact';
import { pageLink } from '../links';

// "Why work with LvTS" on the home page: the business reasons to choose LvTS and how
// a job works. Facts here match the Services page (prices, guarantee, Google rating).

const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps?cid=7436351358223208834';
const START_MESSAGE = "Bula LvTS, I'd like some help with ";

const REASONS = [
  { icon: <Tag size={22} />, color: '#2563eb', title: 'Quoted upfront', desc: 'Repairs from FJD $25. You know the price before any work starts, with no hidden fees.' },
  { icon: <BadgeCheck size={22} />, color: '#7c3aed', title: 'Checked before handover', desc: 'Every repair is tested before you collect it. No shortcuts, no surprises.' },
  { icon: <Wrench size={22} />, color: '#0891b2', title: 'Everything tech, one place', desc: 'PC and laptop repair, websites, networking and CCTV, business email and LabVIEW tutoring.' },
  { icon: <MapPin size={22} />, color: '#d97706', title: 'Local in Raiwai, Suva', desc: 'Drop your device off or arrange a pickup, and talk to a real person on WhatsApp.' },
];

const STEPS = [
  { n: 1, title: 'Message us', desc: `Tell us what you need on WhatsApp ${CONTACT.whatsapp}, or call ${CONTACT.phone}.` },
  { n: 2, title: 'Get a quote', desc: 'We look at the problem or the project and give you a clear price.' },
  { n: 3, title: 'We get it done', desc: 'We fix it, build it or set it up, check it, and hand it over.' },
];

export default function WhyLvts({ onNav }: { onNav: (p: string) => void }) {
  return (
    <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>Why LvTS</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, margin: '0 0 0.9rem' }}>
            Why work with <span className="grad-text">LomaVata Tech Services</span>
          </h2>
          <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#0f172a', textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem' }}>
            <span style={{ display: 'inline-flex', gap: 2, color: '#f59e0b' }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
            </span>
            Rated 5.0 on Google
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
          {REASONS.map((r) => (
            <div key={r.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: `3px solid ${r.color}`, borderRadius: 14, padding: '1.4rem' }}>
              <div style={{ color: r.color, marginBottom: '0.7rem' }}>{r.icon}</div>
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.4rem' }}>{r.title}</div>
              <div style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>{r.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(124,58,237,0.06))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 18, padding: 'clamp(1.25rem,3vw,2rem)' }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.3rem', color: '#0f172a', margin: '0 0 1.25rem' }}>How it works</h3>
          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: '1.25rem' }}>
            {STEPS.map((s) => (
              <li key={s.n} style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: '50%', background: '#0f172a', color: '#fff', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.2rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.55 }}>{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            <button type="button" onClick={() => openWhatsApp(START_MESSAGE)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.8rem 1.3rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              <MessageCircle size={18} /> Message us on WhatsApp
            </button>
            <a {...pageLink('services', onNav)}
              style={{ display: 'inline-flex', alignItems: 'center', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.8rem 1.3rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' }}>
              See all services
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
