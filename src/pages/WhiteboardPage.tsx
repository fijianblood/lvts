import { lazy, Suspense } from 'react';
import '@excalidraw/excalidraw/index.css';

const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then(mod => ({ default: mod.Excalidraw })),
);

export default function WhiteboardPage() {
  return (
    <section style={{ padding: '96px 1.5rem 100px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(6,182,212,0.08)', top: '-5%', right: '-5%' }} />
      <div className="orb" style={{ width: 280, height: 280, background: 'rgba(124,58,237,0.06)', bottom: '5%', left: '0%', animationDelay: '2s' }} />

      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2rem', position: 'relative' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#0891b2', marginBottom: '0.75rem' }}>
          Free Tool
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          <span className="grad-text">Whiteboard</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.75 }}>
          Sketch a diagram, jot down notes, or draw out an idea — right here in your browser, powered by the
          open-source <a href="https://github.com/excalidraw/excalidraw" target="_blank" rel="noopener noreferrer" style={{ color: '#0891b2', fontWeight: 600 }}>Excalidraw</a>.
        </p>
      </div>

      <div
        style={{
          maxWidth: 1200, margin: '0 auto', borderRadius: 20, overflow: 'hidden',
          border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(15,23,42,0.12)',
          position: 'relative', height: '75vh', minHeight: 560,
        }}
      >
        <Suspense fallback={<WhiteboardLoading />}>
          <Excalidraw />
        </Suspense>
      </div>
    </section>
  );
}

function WhiteboardLoading() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem', background: '#f8fafc' }}>
      Loading whiteboard…
    </div>
  );
}
