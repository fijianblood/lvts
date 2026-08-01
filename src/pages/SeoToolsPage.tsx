import { ExternalLink } from 'lucide-react';

export default function SeoToolsPage() {
  return (
    <section style={{ padding: '96px 1.5rem 100px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(37,99,235,0.08)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(124,58,237,0.06)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
          Powered by SEOStudio Tools
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          <span className="grad-text">SEO Tools</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          A full suite of free SEO, keyword, and website analysis tools — browse and use them right here, no need
          to leave this page.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1200, margin: '0 auto', borderRadius: 20, overflow: 'hidden',
          border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(15,23,42,0.12)', background: '#fff',
        }}
      >
        <iframe
          src="https://seostudio.tools/"
          title="SEOStudio Tools"
          style={{ width: '100%', height: '80vh', minHeight: 640, border: 'none', display: 'block' }}
          loading="lazy"
        />
      </div>

      <p style={{ maxWidth: 1200, margin: '0.9rem auto 0', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
        This tool is provided by a third party (seostudio.tools) and embedded here for convenience — LomaVata Tech
        Services isn't affiliated with it.{' '}
        <a href="https://seostudio.tools/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
          Open in a new tab <ExternalLink size={11} />
        </a>
      </p>
    </section>
  );
}
