import { useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { SITE_PAGES } from '../data/sitePages';

interface SitePagesFaqProps {
  onNav: (p: string) => void;
}

const PAGES = SITE_PAGES.filter(p => p.id !== 'home');

export default function SitePagesFaq({ onNav }: SitePagesFaqProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section style={{ padding: '40px 1.5rem 80px', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '3rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
            Not Sure Where To Start?
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1.2rem' }}>
            Explore Every <span className="grad-text">Page</span>
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem' }}>
            Everything LomaVata Tech Services does lives on this one site. Tap an icon to jump straight to a page,
            or open a question to see what it actually does before you click.
          </p>
        </div>

        <div>
          {/* Page directory */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: '0.7rem', marginBottom: '2rem' }}>
            {PAGES.map(p => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => onNav(p.id)}
                  className="card-3d"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                    background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem 0.4rem',
                    cursor: 'pointer', transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {Icon && <Icon size={18} color={p.color} stroke={2} />}
                  </div>
                  <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#334155', textAlign: 'center', lineHeight: 1.2 }}>{p.label}</span>
                </button>
              );
            })}
          </div>

          {/* FAQ accordion */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '0.6rem', alignItems: 'start' }}>
            {PAGES.map(p => {
              const open = openId === p.id;
              return (
                <div key={p.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                  <button
                    onClick={() => setOpenId(open ? null : p.id)}
                    aria-expanded={open}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem',
                      background: 'none', border: 'none', padding: '0.85rem 1rem', cursor: 'pointer', textAlign: 'left',
                      fontFamily: "'Space Grotesk',sans-serif",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>What does {p.label} offer?</span>
                    <IconChevronDown
                      size={16} color="#94a3b8"
                      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
                    />
                  </button>
                  {open && (
                    <div style={{ padding: '0 1rem 1rem' }}>
                      <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.7, marginBottom: '0.6rem' }}>{p.blurb}</p>
                      <button
                        onClick={() => onNav(p.id)}
                        style={{ background: 'none', border: 'none', color: p.color, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
                      >
                        Go to {p.label} →
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
