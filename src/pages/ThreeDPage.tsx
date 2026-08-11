import { useScrollFade } from '../hooks/useScrollFade';
import {
  Box, Sparkles, MousePointer2, Smartphone, Layers, Rotate3d,
  CheckCircle, Clock, Image as ImageIcon,
} from 'lucide-react';

// ── What's included ──────────────────────────────────────────────────────────
const FEATURES_3D = [
  { icon: <Sparkles size={22}/>,     title: 'Interactive 3D Hero',    desc: 'A WebGL-powered animated scene as your homepage centerpiece — moves as visitors scroll or move their mouse.' },
  { icon: <Rotate3d size={22}/>,     title: '3D Product Viewer',      desc: 'Let customers rotate, zoom, and inspect a product model right in the browser — no app required.' },
  { icon: <Box size={22}/>,          title: 'Animated Logo Reveal',   desc: 'A short 3D logo intro that plays when your site loads, giving first-time visitors a strong first impression.' },
  { icon: <Layers size={22}/>,       title: 'Virtual Showroom',       desc: 'Walkthrough-style 3D spaces for shops, resorts, and real estate — explore a place before visiting in person.' },
  { icon: <MousePointer2 size={22}/>,title: 'Scroll & Mouse Effects', desc: 'Depth, parallax, and particle effects that respond to scrolling and cursor movement.' },
  { icon: <Smartphone size={22}/>,   title: 'Mobile-Optimized 3D',    desc: 'Every 3D build is tuned to stay smooth on phones and tablets, not just desktop.' },
];

// ── Packages ──────────────────────────────────────────────────────────────────
const PACKAGES_3D = [
  {
    name: 'Add-On',
    price: 'From FJD $150',
    label: '3D Hero Section',
    delivery: '3–5 days',
    color: '#2563eb',
    popular: false,
    desc: 'Add one 3D animated section — a hero banner, logo reveal, or product viewer — to an existing website.',
    features: [
      'One interactive 3D section',
      'Works with your current site',
      'Mobile-optimized',
      'Fast load, no app needed',
    ],
  },
  {
    name: 'Full Build',
    price: 'From FJD $600',
    label: 'Complete 3D Website',
    delivery: '10–15 days',
    color: '#7c3aed',
    popular: true,
    desc: 'A full site designed around interactive 3D — multiple animated sections, product or space viewers, and standard pages.',
    features: [
      'Multiple 3D sections',
      'Product or space viewer',
      'Responsive design',
      'Contact & booking forms',
      'Speed-optimized 3D assets',
      'Hosting setup',
    ],
  },
];

// ── Why go 3D stats ─────────────────────────────────────────────────────────
const WHY_3D = [
  { icon: <Clock size={20}/>,       stat: '3–15',  label: 'Days to Build' },
  { icon: <CheckCircle size={20}/>, stat: '100%',  label: 'Mobile Friendly' },
  { icon: <Box size={20}/>,         stat: 'WebGL', label: 'Runs in the Browser' },
  { icon: <Sparkles size={20}/>,    stat: 'Fiji',  label: 'Local Fijian Developer 🏝' },
];

// ── Rotating CSS 3D cube — live preview, no extra libraries needed ──────────
function LiveCube() {
  return (
    <div className="cube3d-wrap">
      <div className="cube3d-stage">
        <div className="cube3d">
          <div className="cube3d-face front" />
          <div className="cube3d-face back" />
          <div className="cube3d-face right" />
          <div className="cube3d-face left" />
          <div className="cube3d-face top" />
          <div className="cube3d-face bottom" />
        </div>
      </div>
      <style>{`
        .cube3d-wrap { display:flex; align-items:center; justify-content:center; }
        .cube3d-stage { width:170px; height:170px; perspective:900px; }
        .cube3d {
          position:relative; width:100%; height:100%;
          transform-style:preserve-3d;
          animation: cube3d-spin 9s linear infinite;
        }
        .cube3d-face {
          position:absolute; width:170px; height:170px;
          border:1px solid rgba(255,255,255,0.25);
          background:linear-gradient(135deg, rgba(37,99,235,0.85), rgba(124,58,237,0.85));
          box-shadow: inset 0 0 30px rgba(255,255,255,0.1);
          border-radius: 8px;
        }
        .cube3d-face.front  { transform: translateZ(85px); }
        .cube3d-face.back   { transform: translateZ(-85px) rotateY(180deg); }
        .cube3d-face.right  { transform: rotateY(90deg) translateZ(85px); }
        .cube3d-face.left   { transform: rotateY(-90deg) translateZ(85px); }
        .cube3d-face.top    { transform: rotateX(90deg) translateZ(85px); background:linear-gradient(135deg, rgba(6,182,212,0.85), rgba(37,99,235,0.85)); }
        .cube3d-face.bottom { transform: rotateX(-90deg) translateZ(85px); background:linear-gradient(135deg, rgba(124,58,237,0.85), rgba(6,182,212,0.85)); }
        @keyframes cube3d-spin {
          from { transform: rotateX(0deg) rotateY(0deg); }
          to   { transform: rotateX(360deg) rotateY(360deg); }
        }
      `}</style>
    </div>
  );
}

// ── Demo clips ────────────────────────────────────────────────────────────────
const DEMO_CLIPS = [
  { src: '3d-demo-1.mp4', label: 'Demo Clip 1' },
  { src: '3d-demo-2.mp4', label: 'Demo Clip 2' },
  { src: '3d-demo-3.mp4', label: 'Demo Clip 3' },
];

// ── Placeholder box for images to be uploaded later ─────────────────────────
function ImageSlot({ label, height = 280 }: { label: string; height?: number }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 16,
      border: '2px dashed #cbd5e1', background: '#f8fafc',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: '0.6rem', color: '#94a3b8', textAlign: 'center', padding: '1rem',
    }}>
      <ImageIcon size={30} />
      <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.03em', maxWidth: 220 }}>{label}</span>
    </div>
  );
}

export default function ThreeDPage({ onNav }: { onNav: (p: string) => void }) {
  const heroRef = useScrollFade();
  const featRef = useScrollFade();
  const whyRef  = useScrollFade();
  const demoRef = useScrollFade();
  const authRef = useScrollFade();
  const flyRef  = useScrollFade();
  const pkgRef  = useScrollFade();

  return (
    <>
      {/* ── HERO ── */}
      <section style={{ paddingTop: 100, paddingBottom: 60, background: 'linear-gradient(135deg,#eff6ff 0%,#f8fafc 50%,#faf5ff 100%)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(124,58,237,0.08)', top: '-10%', left: '-5%' }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(6,182,212,0.07)', bottom: 0, right: '5%', animationDelay: '2s' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 9999, padding: '0.3rem 1rem', marginBottom: '1.2rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed' }}>New Offering · Fiji & Remote</span>
            </div>

            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.4rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
              3D <span className="grad-text">Websites</span>
            </h1>

            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Give your business a website that moves. I build interactive 3D web experiences — animated heroes, product viewers, and virtual showrooms — that run right in the browser, no app download needed.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {['WebGL','Interactive','Product Viewer','Animated Hero','Virtual Showroom','Mobile-Ready'].map(f => (
                <span key={f} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{f}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => onNav('contact')}
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                Let's Discuss →
              </button>
            </div>
          </div>

          {/* Live 3D preview */}
          <div style={{ position: 'relative' }}>
            <div className="card-3d" style={{ borderRadius: 18, background: 'linear-gradient(135deg,#0f172a,#1e293b)', padding: '2rem', boxShadow: '0 20px 60px rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.15)' }}>
              <LiveCube />
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.72rem', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.5rem' }}>Live Preview — CSS 3D</div>
            </div>
            <div style={{ position: 'absolute', bottom: '-1rem', right: '-1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.7rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>From FJD $150</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>3D sections built for Fiji</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LIVE DEMO SHOWCASE ── */}
      <section style={{ padding: '60px 1.5rem 0', background: 'linear-gradient(135deg,#eff6ff 0%,#f8fafc 50%,#faf5ff 100%)' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div className="card-3d" style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 20px 60px rgba(15,23,42,0.14)', background: '#0f172a' }}>
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px', background: '#1e293b' }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
            </div>
            <video
              autoPlay muted loop playsInline preload="auto"
              aria-label="A quick look at an interactive 3D website I built"
              style={{ width: '100%', display: 'block', maxHeight: 360, objectFit: 'cover' }}
            >
              <source src={`${import.meta.env.BASE_URL}3d-demo-1.mp4`} type="video/mp4" />
            </video>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '0.75rem' }}>
            A 3D site I built, live in the browser.
          </p>
        </div>
      </section>

      {/* ── WHY 3D STATS ── */}
      <section style={{ background: '#fff', padding: '50px 1.5rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div ref={whyRef} className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' }}>
          {WHY_3D.map(w => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>{w.icon}</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', lineHeight: 1 }}>{w.stat}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{w.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES GRID ── */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={featRef} className="fade-in" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>What's Included</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a', marginBottom: '0.5rem' }}>
              3D <span className="grad-text">Features</span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: 560 }}>Every build is tailored — pick one 3D section or a full interactive site.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem' }}>
            {FEATURES_3D.map((s, i) => (
              <div key={s.title} className="card-3d"
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', gap: '1rem', alignItems: 'flex-start', transitionDelay: `${i * 0.04}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c3aed', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem', fontSize: '0.95rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO REEL ── */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={demoRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>See It In Action</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a' }}>
              Demo <span className="grad-text">Reel</span>
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>A few clips from recent work — more to come.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem' }}>
            {DEMO_CLIPS.map(clip => (
              <div key={clip.src} className="card-3d" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', background: '#0f172a' }}>
                <video controls playsInline preload="metadata" style={{ width: '100%', display: 'block', maxHeight: 340, background: '#0f172a' }}>
                  <source src={`${import.meta.env.BASE_URL}${clip.src}`} type="video/mp4" />
                  Your browser doesn't support this video format.
                </video>
                <div style={{ padding: '0.6rem 0.9rem', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{clip.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AUTHOR PHOTO (placeholder — upload later) ── */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center' }}>
          <div ref={authRef} className="fade-in" style={{ position: 'relative' }}>
            <div className="card-3d" style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(124,58,237,0.1)' }}>
              <img src={`${import.meta.env.BASE_URL}author-photo.jpg`} alt="LomaVata Tech Services" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 420 }} />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem' }}>Built By</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1rem' }}>
              <span className="grad-text">LomaVata Tech Services</span>
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Full stack developer based in Raiwai, Suva, Fiji, now bringing interactive 3D to local websites — from small animated touches to full immersive builds.
            </p>
            <button onClick={() => onNav('contact')}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Contact Me Today →
            </button>
          </div>
        </div>
      </section>

      {/* ── FLYER GALLERY (placeholders — upload later) ── */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={flyRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>Promo Material</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a' }}>
              Flyers <span className="grad-text">& Posters</span>
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>More flyer artwork will go here once uploaded.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.5rem' }}>
            <a href={`${import.meta.env.BASE_URL}lvts-contact-flyer.png`} target="_blank" rel="noopener noreferrer"
              className="card-3d" style={{ display: 'block', height: 320, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
              <img src={`${import.meta.env.BASE_URL}lvts-contact-flyer.png`} alt="LvTS contact card flyer" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </a>
            <ImageSlot label="Flyer 2 — upload here later" height={320} />
            <ImageSlot label="Flyer 3 — upload here later" height={320} />
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={pkgRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>Compare</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a' }}>
              3D <span className="grad-text">Packages</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {PACKAGES_3D.map(pkg => (
              <div key={pkg.name} className="card-3d"
                style={{ background: pkg.popular ? `linear-gradient(135deg,${pkg.color}08,${pkg.color}04)` : '#fff', border: `2px solid ${pkg.popular ? pkg.color : '#e2e8f0'}`, borderRadius: 18, padding: '2rem', position: 'relative', boxShadow: pkg.popular ? `0 12px 40px ${pkg.color}20` : '0 2px 12px rgba(0,0,0,0.04)' }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${pkg.color},#06b6d4)`, color: '#fff', borderRadius: 20, padding: '0.25rem 1rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Most Popular</div>
                )}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: pkg.color, marginBottom: '0.5rem' }}>{pkg.name}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '2rem', color: '#0f172a', marginBottom: '0.25rem' }}>{pkg.price}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>{pkg.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#64748b', marginBottom: '1rem' }}>
                  <Clock size={13}/> {pkg.delivery} delivery
                </div>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>{pkg.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {pkg.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#334155' }}>
                      <CheckCircle size={14} color={pkg.color} style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => onNav('contact')}
                  style={{ width: '100%', background: pkg.popular ? `linear-gradient(135deg,${pkg.color},#06b6d4)` : '#f8fafc', border: pkg.popular ? 'none' : `1px solid ${pkg.color}`, color: pkg.popular ? '#fff' : pkg.color, padding: '0.8rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Get Started →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{ padding: '60px 1.5rem', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#fff', marginBottom: '1rem' }}>
          Ready to make your site move?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '2rem' }}>
          Contact me today — Fijian local developer, 24/7 support, on-time delivery.
        </p>
        <button onClick={() => onNav('contact')}
          style={{ background: '#fff', border: 'none', color: '#7c3aed', padding: '1rem 2.5rem', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>
          Let's Discuss Your Project →
        </button>
      </section>
    </>
  );
}
