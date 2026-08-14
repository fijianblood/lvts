import { useEffect, useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { ExternalLink, Award, Code2, Cpu, Globe, Rocket, GraduationCap, Shield, Gauge, Users, Search, FileCheck } from 'lucide-react';
import SitePagesFaq from '../components/SitePagesFaq';

const TITLES = ['IT Sales Pro', 'Web Dev Enthusiast', 'PC & Laptop Repair', 'Fiji 🏝 Tech Builder', 'Laptops for sale', 'PC & Laptop Repair'];

const SKILLS = [
  { label: 'Technical Knowledge', pct: 95, color: '#2563eb' },
  { label: 'Communication',       pct: 85, color: '#0891b2' },
  { label: 'Problem Solving',     pct: 82, color: '#7c3aed' },
  { label: 'Market Knowledge',    pct: 78, color: '#d97706' },
];

const CERTS = [
  { title: 'Career Skills in Software Development',       issuer: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/certificates/9415915c8a737909b30a164b9d03fd868b04b7abe90a5f0abbdd275d41f26aa6' },
  { title: 'Career Essentials in System Administration',  issuer: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/certificates/ca37c329baa5d7ba0dd24c667cb6bd51b73c4db26b1014daa23c082255ac73db' },
];

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

function SkillBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  const ref = useScrollFade();
  const [filled, setFilled] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setFilled(pct); obs.unobserve(el); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [pct, ref]);
  return (
    <div ref={ref} className="fade-in" style={{ marginBottom: '1.2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontFamily: "'JetBrains Mono',monospace", color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, borderRadius: 9999, background: '#e2e8f0' }}>
        <div className="skill-bar-fill" style={{ width: `${filled}%`, background: `linear-gradient(90deg, ${color}, #0891b2)` }} />
      </div>
    </div>
  );
}

export default function HomePage({ onNav }: { onNav: (p: string) => void }) {
  const aboutRef  = useScrollFade();
  const skillsRef = useScrollFade();
  const newsRef   = useScrollFade();
  const certsRef  = useScrollFade();

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

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, textAlign: 'center' }}>
          <a href="https://www.vitikart.com.fj/914-remote-it-service" target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 9999, padding: '0.35rem 1rem', marginBottom: '1.8rem', textDecoration: 'none', cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.14)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.08)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; }}>
            <div className="pulse-ring" style={{ width: 7, height: 7, borderRadius: '50%', background: '#0891b2' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0891b2' }}>Available for Hire · Raiwai, Suva, Fiji</span>
            <ExternalLink size={11} color="#0891b2" />
          </a>

          <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.8rem,9vw,6rem)', lineHeight: 1.0, color: '#0f172a', letterSpacing: '-0.02em' }}>
              LomaVata <span className="grad-text">Tech Services</span>
            </h1>
            <div className="glitch-layer" aria-hidden>
              <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.8rem,9vw,6rem)', lineHeight: 1.0, letterSpacing: '-0.02em', opacity: 0.2 }}>
                LomaVata Tech Services
              </h1>
            </div>
          </div>

          <div style={{ marginBottom: '2rem', minHeight: '2.4rem' }}><TypeWriter /></div>

          <p style={{ fontSize: 'clamp(0.95rem,2vw,1.1rem)', color: '#64748b', lineHeight: 1.75, maxWidth: 640, margin: '0 auto 1.5rem' }}>
            Node.js isn't as scary as it sounds — think of it like Windows 11, just another environment your computer runs on. I combine <strong style={{ color: '#339933' }}>Node.js</strong>, <strong style={{ color: '#7c3aed' }}>Claude AI</strong>, and <strong style={{ color: '#0f172a' }}>VS Code</strong> to build and sell real websites for clients across Fiji. Book me and I'll walk you through the unseen world inside your own computer.
          </p>

          <a href="https://www.vitikart.com.fj/914-website-design-development-fiji-we-make-websites" target="_blank" rel="noopener noreferrer"
            className="pulse-cta"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.8rem 1.8rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: '0.95rem', textDecoration: 'none', marginBottom: '1.8rem', transition: 'transform 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}>
            <Rocket size={17}/> Buy Your Own Website Today —  <ExternalLink size={13}/>
          </a>

          <p style={{ fontSize: 'clamp(0.9rem,1.8vw,1rem)', color: '#64748b', lineHeight: 1.85, maxWidth: 640, margin: '0 auto 2.5rem' }}>
            Think ChatGPT or another AI can build your website on its own? First question:{' '}
            do you have{' '}
            <a href="https://nodejs.org/en" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(51,153,51,0.1)', border: '1px solid rgba(51,153,51,0.35)', color: '#2d7a2d', padding: '0.1rem 0.6rem', borderRadius: 6, fontWeight: 700, fontSize: '0.9em', textDecoration: 'none', verticalAlign: 'middle' }}>
              Node.js <ExternalLink size={11}/>
            </a>{' '}
            installed on your laptop? If not,{' '}
            <a href="https://www.vitikart.com.fj/914-remote-it-service" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 700, textDecoration: 'underline', verticalAlign: 'middle' }}>
              <GraduationCap size={14}/> click here to book your training schedule
            </a>{' '}
            — you'll get a clear picture of exactly which tools AI uses to build a website, and unlike a site built for you, those tools and skills stay with you on your own computer, forever.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => onNav('services')}
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s, opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              View Services
            </button>
            <a href={`${import.meta.env.BASE_URL}#ask`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1.5px solid rgba(37,99,235,0.3)', color: '#2563eb', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(37,99,235,0.1)', textDecoration: 'none' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(37,99,235,0.05)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}>
              💬 Ask LvTS
            </a>
            <button onClick={() => onNav('network')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1.5px solid rgba(242,169,60,0.45)', color: '#b76e00', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(242,169,60,0.12)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(242,169,60,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.transform = 'translateY(0)'; }}
              aria-label="View the interactive 3D small-office network diagram">
              🖧 See Network Setup
            </button>
          </div>

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

      {/* ABOUT THIS PAGE */}
      <section ref={aboutRef} className="fade-in" style={{ padding: '80px 1.5rem 40px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>About This Site</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.5rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1.2rem' }}>
            One Home Base, <span className="grad-text">Everything LvTS</span>
          </h2>
          <p style={{ color: '#64748b', lineHeight: 1.8, fontSize: '0.95rem' }}>
            This site is the front door to everything LomaVata Tech Services does — repairs, web builds, the Weave
            Playground coding game, MediTrack, network setup help, and more. Use the directory below to jump straight
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
              problems with technology, across web development, IT support, networking, CCTV, and digital consulting.
              What sets LvTS apart is a dual capability rare among Fiji-based web agencies: combining modern
              frontend/backend development with hands-on cybersecurity and OSINT skills using professional tools like
              Kali Linux — examining a site's infrastructure, security posture, and digital footprint the way a real
              external threat actor would, not just a surface-level review.
            </p>
          </div>

          {/* What an audit covers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.25rem', marginBottom: '3rem' }}>
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

          {/* Real delivered work */}
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#64748b', marginBottom: '1rem', textAlign: 'center' }}>
            Delivered For Real Fijian & Pacific Clients
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {[
              { label: 'Content Rental & Tours', url: 'https://contentrentaltours.com.fj' },
              { label: 'VeloTech', url: 'https://velotech.com.fj' },
              { label: 'Pacific Blue Shipping', url: 'https://pacificblueshippingpartnership.netlify.app' },
              { label: 'Red Hill Real Estate', url: 'https://redhillrealestate.netlify.app' },
              { label: 'One Nation Fiji', url: 'https://onenationfiji.netlify.app' },
            ].map(w => (
              <a key={w.label} href={w.url} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', padding: '0.5rem 1rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
                {w.label} <ExternalLink size={11} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* SKILLS */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div ref={skillsRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>Expertise</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              Skills & <span className="grad-text">Capabilities</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: '3rem' }}>
            <div>{SKILLS.map(s => <SkillBar key={s.label} {...s} />)}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {[
                { icon: <Cpu size={22} />,   title: 'Hardware',    desc: 'BIOS · RAM · Storage · Motherboards' },
                { icon: <Code2 size={22} />, title: 'Software',    desc: 'Windows · Office · Drivers · OS Install' },
                { icon: <Globe size={22} />, title: 'Web Dev',     desc: 'React · Astro · Tailwind · Vite' },
                { icon: <Award size={22} />, title: 'Networking',  desc: 'LAN · WiFi · CCTV · Setup' },
              ].map(c => (
                <div key={c.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div style={{ color: '#0891b2' }}>{c.icon}</div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CERTS */}
      <section style={{ padding: '60px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div ref={certsRef} className="fade-in" style={{ marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>Verified</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: '#0f172a' }}>Certifications</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {CERTS.map(c => (
              <a key={c.title} href={c.url} target="_blank" rel="noopener noreferrer" className="card-3d"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.2rem 1.5rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#e2e8f0')}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>{c.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#2563eb' }}>{c.issuer}</div>
                </div>
                <ExternalLink size={18} color="#94a3b8" />
              </a>
            ))}
          </div>
        </div>
      </section>

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
                  <img src={n.img} alt={n.title} style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }} />
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
