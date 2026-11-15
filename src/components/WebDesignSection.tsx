import { CheckCircle2, ExternalLink, MessageCircle } from 'lucide-react';
import { openWhatsApp } from '../data/contact';

// Website design on the Services page, with sites LvTS has built as a portfolio.
// Screenshots are in public/portfolio/ (1280x800 captures, saved at 800x500).

const WEBSITE_MESSAGE = "Bula LvTS, I'd like to talk about a website for my business.";

const INCLUDED = [
  'Designed for phones first: most visitors in Fiji browse on mobile',
  'Ready for Google: page titles, descriptions, sitemap and link previews',
  'WhatsApp, call and email buttons so customers reach you in one tap',
  'Domain, hosting and business email set up for you',
  'Help after launch: updates, new pages and fixes',
];

const PORTFOLIO = [
  { name: 'Content Rental Tours', what: 'Vehicle hire, guided tours and airport transfers, Korolevu', img: 'content-tours.jpg', url: 'https://contentrentaltour.netlify.app/' },
  { name: 'Red Hill Real Estate', what: 'Licensed real estate agent, Suva', img: 'red-hill.jpg', url: 'https://redhillrealestate.netlify.app/' },
  { name: 'One Nation', what: 'Political party website with its constitution and news', img: 'one-nation.jpg', url: 'https://onenationfiji.netlify.app/' },
];

export default function WebDesignSection() {
  return (
    <section id="website-design" style={{ padding: '80px 1.5rem', background: '#0f172a', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: '2.5rem', alignItems: 'start', marginBottom: '3rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: '0.75rem' }}>Website design</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', lineHeight: 1.12, margin: '0 0 1rem' }}>
              Websites that bring <span style={{ color: '#fbbf24' }}>Fiji businesses</span> customers
            </h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
              Fast, modern websites built with the same tools as this one (React, Astro, Tailwind), made to be found on Google and easy to use on a phone. You tell us about your business; we design it, build it and get it online.
            </p>
            <button type="button" onClick={() => openWhatsApp(WEBSITE_MESSAGE)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.85rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              <MessageCircle size={18} /> Let’s discuss your website
            </button>
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
            {INCLUDED.map((t) => (
              <li key={t} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '0.85rem 1rem', color: '#e2e8f0', fontSize: '0.93rem', lineHeight: 1.55 }}>
                <CheckCircle2 size={18} color="#4ade80" style={{ flexShrink: 0, marginTop: 2 }} /> {t}
              </li>
            ))}
          </ul>
        </div>

        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.35rem', margin: '0 0 1.25rem' }}>Sites we’ve built</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: '1.25rem' }}>
          {PORTFOLIO.map((p) => (
            <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" className="card-3d"
              style={{ display: 'block', background: '#fff', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: '#0f172a', boxShadow: '0 12px 30px rgba(0,0,0,0.25)' }}>
              <img src={`${import.meta.env.BASE_URL}portfolio/${p.img}`} alt={`${p.name} website home page`} width={800} height={500} loading="lazy" decoding="async"
                style={{ width: '100%', height: 'auto', aspectRatio: '8 / 5', objectFit: 'cover', display: 'block', borderBottom: '1px solid #e2e8f0' }} />
              <div style={{ padding: '1rem 1.15rem' }}>
                <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{p.name}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '0.6rem' }}>{p.what}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 700, fontSize: '0.85rem' }}>Visit site <ExternalLink size={14} /></span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
