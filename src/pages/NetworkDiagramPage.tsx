import { useEffect, useRef, useState } from 'react';

interface NetworkDiagramPageProps {
  onNav: (page: string) => void;
}

export default function NetworkDiagramPage({ onNav }: NetworkDiagramPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(1280);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    let observer: ResizeObserver | undefined;

    function attach() {
      try {
        const doc = iframe!.contentDocument;
        if (!doc) return;
        const measure = () => setHeight(doc.documentElement.scrollHeight);
        measure();
        observer = new ResizeObserver(measure);
        observer.observe(doc.documentElement);
      } catch {
        // cross-origin fallback — keep the default height
      }
    }

    iframe.addEventListener('load', attach);
    return () => {
      iframe.removeEventListener('load', attach);
      observer?.disconnect();
    };
  }, []);

  return (
    <section style={{ padding: '96px 1.5rem 100px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(242,169,60,0.06)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(95,216,208,0.08)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>
          Network Architecture · Interactive Diagram
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          Small Office <span className="grad-text">IT Setup</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          An isometric map of how a reliable, secure, scalable small-office network fits together — from the ISP
          hand-off through firewall, switch, servers, Wi-Fi, and endpoints. This is the way LomaVata Tech Services
          designs and deploys it.
        </p>
      </div>

      <div style={{ maxWidth: 1040, margin: '0 auto 2.5rem' }}>
        <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(8,18,38,0.35)' }}>
          <iframe
            ref={iframeRef}
            src={`${import.meta.env.BASE_URL}network-diagram/index.html`}
            title="Small Office IT Setup — Isometric Network Diagram"
            style={{ width: '100%', height, border: 'none', display: 'block' }}
          />
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <button
          onClick={() => onNav('contact')}
          style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '1.1rem', borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Set Up My Office Network →
        </button>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1.25rem' }}>
          Raiwai, Suva, Fiji · lomavatatechfiji@gmail.com · 7466941 / 8331088
        </p>
      </div>
    </section>
  );
}
