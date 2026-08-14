import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface MediTrackPageProps {
  onNav: (page: string) => void;
}

// Stored reversed and split so it isn't a plain grep-able string in the bundle.
const TREASURE_CODE_PARTS = ['02ERUSAERT', '-STVL'];
function getTreasureCode() {
  return TREASURE_CODE_PARTS.join('').split('').reverse().join('');
}

export default function MediTrackPage({ onNav }: MediTrackPageProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(760);
  const [showTreasure, setShowTreasure] = useState(false);

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
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(193,68,59,0.06)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(47,111,118,0.08)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0891b2', marginBottom: '0.75rem' }}>
          MediTrack Fiji · Local Only
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          <span className="grad-text">MediTrack</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
          Blood pressure trends, blood results, doctor's appointments, visit history, and medical history — all in
          one dashboard. Every entry, and any file you attach, saves to this device only. Nothing uploads.
        </p>
      </div>

      <div style={{ maxWidth: 760, margin: '0 auto 2.5rem' }}>
        <iframe
          ref={iframeRef}
          src={`${import.meta.env.BASE_URL}meditrack/index.html`}
          title="MediTrack Fiji"
          style={{ width: '100%', height, border: 'none', display: 'block' }}
        />
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem 2rem', marginBottom: '1.5rem' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.04em', color: '#2563eb', marginBottom: '0.75rem' }}>
            A REAL SCENARIO
          </div>
          <p style={{ color: '#334155', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: '1rem' }}>
            For 5 years, someone gets a blood test done every year and saves the file in a laptop folder. On its
            own, that file does nothing. But if something ever happens to them — with one click, someone close can
            open 5 years of history on a clear dashboard for the doctor — and the data never left the laptop.
          </p>
          <p style={{ color: '#2563eb', fontWeight: 700, fontSize: '0.95rem' }}>
            That's what we build, together.
          </p>
        </div>

        <button
          onClick={() => onNav('contact')}
          style={{ display: 'block', width: '100%', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '1.1rem', borderRadius: 14, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          Let's Discuss →
        </button>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', marginTop: '1.25rem' }}>
          Raiwai, Suva, Fiji{' '}
          <button
            onClick={() => setShowTreasure(true)}
            tabIndex={-1}
            style={{ background: 'none', border: 'none', padding: 0, margin: 0, color: 'inherit', font: 'inherit', cursor: 'text' }}
          >
            ·
          </button>{' '}
          lomavatatechfiji@gmail.com · 7466941 / 8331088
        </p>
      </div>

      {showTreasure && <TreasureModal onClose={() => setShowTreasure(false)} />}
    </section>
  );
}

function TreasureModal({ onClose }: { onClose: () => void }) {
  const code = getTreasureCode();
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(10,15,25,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative', width: 'min(360px, 100%)', aspectRatio: '9 / 16',
          borderRadius: 20, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}treasure-victory.png`}
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,10,20,0.62)' }} />

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}
        >
          <X size={18} />
        </button>

        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem 1.5rem',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎉</div>
          <div style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#fff',
            lineHeight: 1.2, marginBottom: '1.5rem',
          }}>
            You found the<br />hidden treasure!
          </div>
          <div style={{
            background: '#0891b2', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 800,
            fontSize: 'clamp(0.85rem,4vw,1.1rem)', letterSpacing: '0.02em', padding: '0.75rem 1.25rem',
            borderRadius: 999, marginBottom: '1.5rem', whiteSpace: 'nowrap',
          }}>
            {code}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Screenshot this and post it on our Facebook page to claim your <strong>$20 voucher</strong> — first to post wins!
          </p>
          <a
            href="https://www.facebook.com/lvtsfiji"
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginTop: '1rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'underline' }}
          >
            facebook.com/lvtsfiji →
          </a>
        </div>
      </div>
    </div>
  );
}
