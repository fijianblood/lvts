import { CheckCircle2, MessageCircle } from 'lucide-react';
import { openWhatsApp } from '../data/contact';

// Website design, one of the LvTS services, on the Services page.

const WEBSITE_MESSAGE = "Bula LvTS, I'd like to talk about a website for my business.";

const INCLUDED = [
  'Designed for phones first: most visitors in Fiji browse on mobile',
  'Ready for Google: page titles, descriptions, sitemap and link previews',
  'WhatsApp, call and email buttons so customers reach you in one tap',
  'Domain, hosting and business email set up for you',
  'Help after launch: updates, new pages and fixes',
];

export default function WebDesignSection() {
  return (
    <section id="website-design" style={{ padding: '80px 1.5rem', background: '#0f172a', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: '2.5rem', alignItems: 'start' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: '0.75rem' }}>Website design</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', lineHeight: 1.12, margin: '0 0 1rem' }}>
              Websites that bring <span style={{ color: '#fbbf24' }}>Fiji businesses</span> customers
            </h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.75, margin: '0 0 1.5rem' }}>
              LomaVata Tech Services designs and builds fast, modern websites (React, Astro, Tailwind), made to be found on Google and easy to use on a phone. You tell us about your business; we design it, build it and get it online.
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

      </div>
    </section>
  );
}
