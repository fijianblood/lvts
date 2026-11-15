import { useEffect, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { ExternalLink, Shield, Gauge, Users, Search, FileCheck } from 'lucide-react';
import SitePagesFaq from '../components/SitePagesFaq';
import NoquDuo from '../components/NoquDuo';
import DiscoverServices from '../components/DiscoverServices';
import DiscoverVision from '../components/DiscoverVision';
import WhyLvts from '../components/WhyLvts';
import { pageLink } from '../links';

// The line that types itself under the slogan in the hero.
const TITLES = ['Explore Raiwai in 3D', 'Learn in English & iTaukei', 'Play together online', 'Connect with local tech', 'Websites for Fiji businesses', 'PC & laptop repair'];

function TypeWriter() {
  const [idx, setIdx] = useState(0);
  const [char, setChar] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const speed = deleting ? 40 : 80;
    const t = setTimeout(() => {
      const current = TITLES[idx];
      if (!deleting && char < current.length) { setChar(c => c + 1); }
      else if (!deleting && char === current.length) { setTimeout(() => setDeleting(true), 1600); }
      else if (deleting && char > 0) { setChar(c => c - 1); }
      else { setDeleting(false); setIdx(i => (i + 1) % TITLES.length); }
    }, speed);
    return () => clearTimeout(t);
  }, [char, deleting, idx]);
  return (
    <span className="cursor" style={{ fontFamily: "'JetBrains Mono',monospace", color: '#0891b2', fontSize: 'clamp(1rem,3vw,1.4rem)', fontWeight: 500 }}>
      {TITLES[idx].slice(0, char)}
    </span>
  );
}

export default function HomePage({ onNav }: { onNav: (p: string) => void }) {
  const aboutRef  = useScrollFade();
  const newsRef   = useScrollFade();

  return (
    <>
      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', padding: '100px 1.5rem 60px' }}>
        <video
          autoPlay muted loop playsInline preload="auto" aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.65, zIndex: 0 }}
        >
          <source src={`${import.meta.env.BASE_URL}hero-bg.mp4`} type="video/mp4" />
        </video>
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(240,247,255,0.4) 0%, rgba(250,250,254,0.32) 50%, rgba(245,240,255,0.4) 100%)', zIndex: 0 }} />
        <div className="orb" style={{ width: 500, height: 500, background: 'rgba(37,99,235,0.08)', top: '-10%', left: '-8%' }} />
        <div className="orb" style={{ width: 350, height: 350, background: 'rgba(124,58,237,0.07)', bottom: '5%', right: '-5%', animationDelay: '3s' }} />
        <div className="orb" style={{ width: 200, height: 200, background: 'rgba(8,145,178,0.06)', top: '40%', right: '15%', animationDelay: '1.5s' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 960, textAlign: 'center' }}>
          {/* Discover LvTS campaign: the message first, then the two experiences, then services. */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 9999, padding: '0.35rem 1rem', marginBottom: '1rem' }}>
            <div className="pulse-ring" style={{ width: 7, height: 7, borderRadius: '50%', background: '#0891b2' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0891b2' }}>🌐 Discover LvTS · Raiwai, Suva, Fiji</span>
          </div>

          <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: '0.8rem' }}>
            LomaVata Tech Services · Living With Technology
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.3rem,6.4vw,4.5rem)', lineHeight: 1.0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Technology brings <span className="grad-text">us together.</span>
            </h1>
            <div className="glitch-layer" aria-hidden>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.3rem,6.4vw,4.5rem)', lineHeight: 1.0, letterSpacing: '-0.02em', opacity: 0.2 }}>
                Technology brings us together.
              </h1>
            </div>
          </div>

          <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.2rem,3.6vw,1.9rem)', display: 'flex', gap: '0.55rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '0.9rem' }}>
            <span style={{ color: '#2563eb' }}>Explore.</span><span style={{ color: '#7c3aed' }}>Learn.</span><span style={{ color: '#d97706' }}>Play.</span><span style={{ color: '#0891b2' }}>Connect.</span>
          </p>

          <div style={{ marginBottom: '1.2rem', minHeight: '2.4rem' }}><TypeWriter /></div>

          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: '#475569', lineHeight: 1.75, maxWidth: 660, margin: '0 auto 1.6rem' }}>
            Technology is not just something we use. It is something we can <strong style={{ color: '#0f172a' }}>build, learn from and share</strong>.
            LomaVata Tech Services is a Fiji-based technology initiative bringing together digital services, interactive learning, gaming and local digital experiences.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a {...pageLink('house', onNav)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(140deg,#0e7490,#1e3a8a)', color: '#fff', padding: '0.85rem 1.6rem', borderRadius: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 20px rgba(30,58,138,0.28)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              🎮 Play Noqublox
            </a>
            <a {...pageLink('kids', onNav)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(140deg,#7b5cff,#5b3be6)', color: '#fff', padding: '0.85rem 1.6rem', borderRadius: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 8px 20px rgba(91,59,230,0.28)', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              📚 Start Noqu Vuli
            </a>
            <a href="#tech-services"
              onClick={e => { e.preventDefault(); document.getElementById('tech-services')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1.5px solid rgba(37,99,235,0.3)', color: '#2563eb', padding: '0.85rem 1.6rem', borderRadius: 12, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(37,99,235,0.1)' }}>
              💻 Our Tech Services
            </a>
          </div>

          <p style={{ marginTop: '1.3rem', fontSize: '0.88rem', color: '#64748b' }}>
            🏝️ Locally inspired. Built in Fiji. You don't have to be a technology expert to explore.
          </p>

          {/* Stat strip */}
          <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '1px', background: 'rgba(37,99,235,0.1)', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(37,99,235,0.12)' }}>
            {[{ n: '10+', l: 'Years IT Experience' }, { n: '1500+', l: 'Devices Repaired' }, { n: '4', l: 'Web Projects Live' }, { n: '500+', l: 'Projects Not Live' }].map(s => (
              <div key={s.l} style={{ background: '#fff', padding: '1.2rem 1rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{s.n}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '0.2rem' }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GAMES: NOQUBLOX (left) AND NOQU VULI (right) */}
      <NoquDuo onNav={onNav} />

      {/* TECHNOLOGY SERVICES, then OUR VISION and who LvTS is for */}
      <DiscoverServices onNav={onNav} />
      <DiscoverVision onNav={onNav} />

      {/* ABOUT THIS PAGE */}
      <section ref={aboutRef} className="fade-in" style={{ padding: '80px 1.5rem 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>About This Site</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1.2rem' }}>
            One Home Base, <span className="grad-text">Everything LvTS</span>
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem' }}>
            This site is the front door to everything LomaVata Tech Services does — repairs, web builds, the
            Noqublox game, Noqu Vuli for kids, MediTrack, network setup help, and more. Use the directory below to jump straight
            to any page, or check the FAQ if you're not sure where to start.
          </p>
        </div>
      </section>

      {/* EXPLORE + FAQ */}
      <SitePagesFaq onNav={onNav} />

      {/* WEBSITE AUDIT & CYBERSECURITY ASSESSMENT */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>Capability Spotlight</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1.2rem' }}>
              Website Audits & <span className="grad-text">Cybersecurity Assessments</span>
            </h2>
            <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem', maxWidth: 760, margin: '0 auto' }}>
              LomaVata Tech Services is a locally owned IT and digital services firm based in Raiwai, Suva, founded by
              Josese Sahib. "Loma Vata" means togetherness — working alongside clients like family to solve real
              problems with technology, across web development, IT support, networking, Linux, and digital consulting.
              What sets LvTS apart is a dual capability rare among Fiji-based web agencies: combining modern
              frontend/backend development with hands-on cybersecurity and OSINT skills using professional tools like
              Kali Linux — examining a site's infrastructure, security posture, and digital footprint the way a real
              external threat actor would, not just a surface-level review.
            </p>
          </div>

          {/* What an audit covers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem' }}>
            {[
              { icon: <Shield size={20} />, title: 'Infrastructure & Security', desc: 'WHOIS, DNS, SSL, open ports, vulnerability scanning, OSINT digital footprint.' },
              { icon: <Gauge size={20} />, title: 'Performance', desc: 'PageSpeed, Core Web Vitals, Lighthouse, load times, CDN assessment.' },
              { icon: <Users size={20} />, title: 'UX & Accessibility', desc: 'Cross-device review, WCAG compliance, navigation and content structure.' },
              { icon: <Search size={20} />, title: 'SEO & Content', desc: 'Meta tags, sitemap, keyword gaps, internal linking, analytics review.' },
              { icon: <FileCheck size={20} />, title: 'Reporting & Roadmap', desc: 'Risk severity matrix, prioritised recommendations, executive summary.' },
            ].map(c => (
              <div key={c.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ color: '#0891b2' }}>{c.icon}</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{c.title}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>{c.desc}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* WHY LVTS: business reasons to choose LvTS, and how a job works */}
      <WhyLvts onNav={onNav} />

      {/* RESOURCES */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={newsRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>Resources</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              Tech Tips & <span className="grad-text">Downloads</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Windows 11 Repair Commands', img: `${import.meta.env.BASE_URL}windows-repair.png`, desc: 'Essential CMD tools: sfc, DISM, chkdsk and more to fix your Windows install.', tag: 'Windows Tips' },
              { title: 'PC Running Slow?',            img: `${import.meta.env.BASE_URL}pc-slow.png`,       desc: 'Fix the Windows 11 Search Indexer issue causing high CPU and SSD usage.',    tag: 'Troubleshoot' },
              { title: 'RAMMap by Sysinternals',      img: `${import.meta.env.BASE_URL}rammap.png`,        desc: 'Advanced physical memory analysis utility — identify memory hogs and leaks.', tag: 'Advanced Tools' },
            ].map(n => (
              <div key={n.title} className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                <a href={n.img} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                  <img src={n.img} alt={n.title} loading="lazy" decoding="async" style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
                </a>
                <div style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'inline-block', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: '#2563eb', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>{n.tag}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.6 }}>{n.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(124,58,237,0.06))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 14, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Need Windows on a USB Bootable Drive?</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Buy a pre-loaded Windows 10 or 11 USB from our Vitikart store.</div>
            </div>
            <a href="https://www.vitikart.com.fj/16gb-usb-flash-drive-preloaded-windows-bootable" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', padding: '0.7rem 1.4rem', borderRadius: 9, fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Buy Now <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
