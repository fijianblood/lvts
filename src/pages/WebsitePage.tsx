import { useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import {
  CheckCircle, ExternalLink, Globe, Code2,
  Zap, Shield, BarChart2, Palette, Mail, ShoppingCart,
  Star, Clock, MessageCircle, Award,
  Box, Sparkles, MousePointer2, Smartphone, Layers, Rotate3d,
} from 'lucide-react';

// ── Tech stack data ──────────────────────────────────────────────────────────
const FRONTEND = [
  { name: 'HTML5',       color: '#e34f26', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg' },
  { name: 'CSS3',        color: '#1572b6', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg' },
  { name: 'JavaScript',  color: '#f7df1e', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { name: 'TypeScript',  color: '#3178c6', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
  { name: 'React',       color: '#61dafb', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
  { name: 'Next.js',     color: '#000000', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
  { name: 'Tailwind',    color: '#06b6d4', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
  { name: 'Astro',       color: '#ff5d01', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/astro/astro-original.svg' },
];

const BACKEND = [
  { name: 'Node.js',     color: '#339933', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
  { name: 'Express',     color: '#000000', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
  { name: 'PHP',         color: '#777bb4', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg' },
  { name: 'Laravel',     color: '#ff2d20', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/laravel/laravel-original.svg' },
  { name: 'Python',      color: '#3776ab', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
];

const DATABASES = [
  { name: 'MySQL',       color: '#4479a1', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg' },
  { name: 'PostgreSQL',  color: '#336791', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { name: 'MongoDB',     color: '#47a248', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg' },
  { name: 'Firebase',    color: '#ffca28', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-original.svg' },
  { name: 'Supabase',    color: '#3ecf8e', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/supabase/supabase-original.svg' },
];

// ── Services grid (CWS-style + extras) ───────────────────────────────────────
const SERVICES = [
  { icon: <Globe size={22}/>,        title: 'Domain Names',             desc: 'Research, registration and DNS configuration for your business domain.' },
  { icon: <Shield size={22}/>,       title: 'Website Hosting',          desc: 'Shared, VPS, and dedicated server setup. Netlify, Vercel & cPanel.' },
  { icon: <Mail size={22}/>,         title: 'Email Hosting',            desc: 'Custom business email — name@yourdomain.com via cPanel or Google Workspace.' },
  { icon: <Code2 size={22}/>,        title: 'Web Design & Development', desc: 'Static and dynamic websites. Modern, clean, responsive design.' },
  { icon: <Zap size={22}/>,          title: 'Website Maintenance',      desc: 'Monthly plans — updates, security patches, backups, and content changes.' },
  { icon: <Palette size={22}/>,      title: 'Graphic Design',           desc: 'Company logos, banners, flyers, social media graphics and branding assets.' },
  { icon: <BarChart2 size={22}/>,    title: 'SEO Optimization',         desc: 'Search engine optimisation — rank higher on Google and drive organic traffic.' },
  { icon: <Shield size={22}/>,       title: 'Security',                 desc: 'Website & web server security, SSL certificates, firewall setup.' },
  { icon: <Palette size={22}/>,      title: 'Company Branding',         desc: 'Colour schemes, brand identity, consistent visual design across all materials.' },
  { icon: <BarChart2 size={22}/>,    title: 'Analytics',                desc: 'Google Analytics, visitor tracking, heatmaps and performance dashboards.' },
  { icon: <ShoppingCart size={22}/>, title: 'E-commerce',               desc: 'Online stores with product management, cart, payment gateway integration.' },
  { icon: <MessageCircle size={22}/>, title: 'Social Media Integration', desc: 'Facebook, Instagram, TikTok feeds and share buttons built into your site.' },
];

// ── Packages ──────────────────────────────────────────────────────────────────
const PACKAGES = [
  {
    name: 'Basic',
    price: 'FJD $25',
    label: 'Landing Page',
    delivery: '1–2 days',
    color: '#2563eb',
    popular: false,
    desc: 'One-page full stack website with up to 3 sections + Landing page + Responsive design',
    features: [
      'Up to 3 sections',
      'Responsive design',
      'Contact form',
      'Mobile friendly',
      'Basic SEO setup',
    ],
  },
  {
    name: 'Standard',
    price: 'FJD $280',
    label: 'Advanced Website',
    delivery: '2–5 days',
    color: '#7c3aed',
    popular: true,
    desc: 'Full stack website design & development up to 5 pages with functional design + social media integration',
    features: [
      'Up to 5 pages',
      'Social media integration',
      'Responsive design',
      'Contact & booking forms',
      'Google Maps embed',
      'Basic SEO optimization',
      'Speed optimization',
    ],
  },
  {
    name: 'Premium',
    price: 'FJD $1,800',
    label: 'Ultimate Website',
    delivery: '15–20 days',
    color: '#f59e0b',
    popular: false,
    desc: 'Full stack website design & development up to 10 pages with API integration, e-commerce and custom features',
    features: [
      'Up to 10 pages',
      'E-commerce functionality',
      'Payment gateway integration',
      'API integration',
      'Custom website design',
      'Content upload',
      'Hosting setup',
      'Opt-in form + autoresponder',
      'Speed & SEO optimization',
      'Social media icons',
      '24/7 support',
    ],
  },
];

// ── Why Me stats ──────────────────────────────────────────────────────────────
const WHY_ME = [
  { icon: <Clock size={20}/>,   stat: '24/7',   label: 'Quick Response & Support' },
  { icon: <CheckCircle size={20}/>, stat: '100%', label: 'Client Satisfaction' },
  { icon: <Star size={20}/>,    stat: '10+',     label: 'Years IT Experience' },
  { icon: <Award size={20}/>,   stat: 'Fiji',   label: 'Local Fijian Developer 🏝' },
];

// ── Website features (tags) ───────────────────────────────────────────────────
const FEATURES = ['Payment','Social Media','Inventory','Analytics','Chat',
                  'Membership','Booking','Portfolio','Dashboard','Landing Page',
                  'API Integration','SEO','Responsive','E-commerce'];

// ── 3D websites: features, packages, demos ────────────────────────────────────
const FEATURES_3D = [
  { icon: <Sparkles size={22}/>,     title: 'Interactive 3D Hero',    desc: 'A WebGL-powered animated scene as your homepage centerpiece — moves as visitors scroll or move their mouse.' },
  { icon: <Rotate3d size={22}/>,     title: '3D Product Viewer',      desc: 'Let customers rotate, zoom, and inspect a product model right in the browser — no app required.' },
  { icon: <Box size={22}/>,          title: 'Animated Logo Reveal',   desc: 'A short 3D logo intro that plays when your site loads, giving first-time visitors a strong first impression.' },
  { icon: <Layers size={22}/>,       title: 'Virtual Showroom',       desc: 'Walkthrough-style 3D spaces for shops, resorts, and real estate — explore a place before visiting in person.' },
  { icon: <MousePointer2 size={22}/>,title: 'Scroll & Mouse Effects', desc: 'Depth, parallax, and particle effects that respond to scrolling and cursor movement.' },
  { icon: <Smartphone size={22}/>,   title: 'Mobile-Optimized 3D',    desc: 'Every 3D build is tuned to stay smooth on phones and tablets, not just desktop.' },
];

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

const DEMO_CLIPS = [
  { src: '3d-demo-1.mp4', label: 'Demo Clip 1' },
  { src: '3d-demo-2.mp4', label: 'Demo Clip 2' },
  { src: '3d-demo-3.mp4', label: 'Demo Clip 3' },
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

// ── Tech Logo component ───────────────────────────────────────────────────────
function TechBadge({ name, icon }: { name: string; color: string; icon: string }) {
  return (
    <div
      className="card-3d"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
        background: '#ffffff', border: '1px solid #e2e8f0',
        borderRadius: 12, padding: '0.9rem 0.7rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        transition: 'transform 0.3s, box-shadow 0.3s',
        minWidth: 80,
      }}
    >
      <img src={icon} alt={name} style={{ width: 36, height: 36, objectFit: 'contain' }}
           onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#334155', letterSpacing: '0.03em' }}>{name}</span>
    </div>
  );
}

export default function WebsitePage({ onNav }: { onNav: (p: string) => void }) {
  const heroRef    = useScrollFade();
  const servRef    = useScrollFade();
  const techRef    = useScrollFade();
  const gigRef     = useScrollFade();
  const pkgRef     = useScrollFade();
  const whyRef     = useScrollFade();
  const feat3dRef  = useScrollFade();
  const demoRef    = useScrollFade();

  const [activeTab, setActiveTab] = useState<'frontend'|'backend'|'database'>('frontend');
  const techMap = { frontend: FRONTEND, backend: BACKEND, database: DATABASES };

  return (
    <>
      {/* ── HERO ── */}
      <section style={{ paddingTop: 100, paddingBottom: 60, background: 'linear-gradient(135deg,#eff6ff 0%,#f8fafc 50%,#faf5ff 100%)', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(37,99,235,0.08)', top: '-10%', left: '-5%' }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(124,58,237,0.07)', bottom: 0, right: '5%', animationDelay: '2s' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center' }}>
          {/* Left text */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 9999, padding: '0.3rem 1rem', marginBottom: '1.2rem' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb' }}>Open for Projects · Fiji & Remote</span>
            </div>

            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.4rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
              Need a <span className="grad-text">Website?</span>
            </h1>

            <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Full stack web developer based in <strong style={{ color: '#0f172a' }}>Raiwai, Suva, Fiji</strong>. I build modern, clean, and responsive websites — from landing pages to full e-commerce platforms. End-to-end solutions, from design to deployment.
            </p>

            {/* Feature tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
              {FEATURES.map(f => (
                <span key={f} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{f}</span>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button onClick={() => onNav('contact')}
                style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                Let's Discuss →
              </button>
              <a href="https://www.vitikart.com.fj/914-website-design-development-fiji-we-make-websites" target="_blank" rel="noopener noreferrer"
                className="pulse-cta"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#16a34a,#0891b2)', border: 'none', color: '#fff', padding: '0.85rem 1.6rem', borderRadius: 10, fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', boxShadow: '0 4px 20px rgba(22,163,74,0.35)', transition: 'transform 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}>
                <ShoppingCart size={16}/> Buy Your Website NOW <ExternalLink size={13}/>
              </a>
            </div>
          </div>

          {/* Gig banner image — joe.jpg composited on copy.jpeg layout */}
          <div style={{ position: 'relative' }}>
            <div className="card-3d" style={{ borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.1)' }}>
              <img src={`${import.meta.env.BASE_URL}gig-banner.jpg`} alt="LomaVata Tech Services — Website Development" style={{ width: '100%', display: 'block' }}
                   onError={e => { (e.target as HTMLImageElement).src = `${import.meta.env.BASE_URL}joe.jpg`; }} />
              <img src={`${import.meta.env.BASE_URL}stack.png`} alt="Technology stack" style={{ width: '100%', display: 'block', marginTop: 8 }} />
            </div>
            {/* Floating badge */}
            <div style={{ position: 'absolute', bottom: '-1rem', right: '-1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.7rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>From FJD $25</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>Websites built for Fiji</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY ME STATS ── */}
      <section style={{ background: '#fff', padding: '50px 1.5rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
        <div ref={whyRef} className="fade-in" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' }}>
          {WHY_ME.map(w => (
            <div key={w.label} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>{w.icon}</div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#0f172a', lineHeight: 1 }}>{w.stat}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{w.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SERVICES GRID (CWS style) ── */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={servRef} className="fade-in" style={{ marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>Full Offerings</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a', marginBottom: '0.5rem' }}>
              Website <span className="grad-text">Services</span>
            </h2>
            <p style={{ color: '#64748b', maxWidth: 560 }}>Contact us for a free consultation. We handle the technical part while you focus on your organisation.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem' }}>
            {SERVICES.map((s, i) => (
              <div key={s.title} className="card-3d"
                style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', display: 'flex', gap: '1rem', alignItems: 'flex-start', transitionDelay: `${i*0.04}s` }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem', fontSize: '0.95rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECH STACK ── */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={techRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>The Stack</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a' }}>
              Technologies <span className="grad-text">I Use</span>
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>The heart of every website is its code.</p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {(['frontend','backend','database'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ background: activeTab === tab ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#f1f5f9', color: activeTab === tab ? '#fff' : '#475569', border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s' }}>
                {tab === 'frontend' ? '⚡ Frontend' : tab === 'backend' ? '⚙️ Backend' : '🗄️ Database'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
            {techMap[activeTab].map(t => <TechBadge key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── ALSO AVAILABLE: 3D WEBSITES ── */}
      <section style={{ padding: '80px 1.5rem', background: 'linear-gradient(135deg,#eff6ff 0%,#f8fafc 50%,#faf5ff 100%)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center', marginBottom: '3rem' }}>
            <div ref={feat3dRef} className="fade-in">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 9999, padding: '0.3rem 1rem', marginBottom: '1.2rem' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed' }}>Also Available</span>
              </div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1rem' }}>
                3D <span className="grad-text">Websites</span>
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                Want a site that moves? I also build interactive 3D web experiences — animated heroes, product viewers, and virtual showrooms — that run right in the browser, no app download needed.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {['WebGL','Interactive','Product Viewer','Animated Hero','Virtual Showroom','Mobile-Ready'].map(f => (
                  <span key={f} style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '0.25rem 0.65rem', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{f}</span>
                ))}
              </div>
            </div>

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

          {/* 3D features grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.2rem', marginBottom: '3rem' }}>
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

          {/* Demo reel */}
          <div ref={demoRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>See It In Action</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#0f172a' }}>Demo Reel</h3>
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

      {/* ── GIG ABOUT ── */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '3rem', alignItems: 'center' }}>
          {/* Photo */}
          <div ref={gigRef} className="fade-in" style={{ position: 'relative' }}>
            <div style={{ borderRadius: 18, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 12px 40px rgba(37,99,235,0.1)' }}>
              <img src={`${import.meta.env.BASE_URL}joe.jpg`} alt="LomaVata Tech Services" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 520 }} />
            </div>
            {/* Floating stat cards */}
            <div className="card-3d" style={{ position: 'absolute', top: '1rem', right: '-1.2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.8rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#2563eb' }}>Full Stack</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Developer</div>
            </div>
            <div className="card-3d" style={{ position: 'absolute', bottom: '1.5rem', left: '-1.2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.8rem 1rem', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#7c3aed' }}>Raiwai 🏝</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Suva, Fiji</div>
            </div>
          </div>

          {/* Gig description */}
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>About This Gig</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '1rem' }}>
              Custom Website Development<br /><span className="grad-text">End-to-End Solutions</span>
            </h2>
            <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
              Are you looking for an expert full stack web developer for custom website development with a modern, clean, and responsive design?
            </p>
            <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              With strong experience as a full stack web developer, I offer end-to-end solutions — from building new websites to upgrading existing ones into modern, high-performing platforms.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem', fontSize: '0.95rem' }}>What I Offer:</div>
              {[
                'Fully custom website development',
                'Responsive design for all devices',
                'PSD to HTML, CSS, React.js',
                'Front-end and Back-end development',
                'E-commerce & payment gateways',
                'API integration',
              ].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.35rem 0', fontSize: '0.875rem', color: '#334155' }}>
                  <CheckCircle size={15} color="#10b981" style={{ flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>

            <button onClick={() => onNav('contact')}
              style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Contact Me Today →
            </button>
          </div>
        </div>
      </section>

      {/* ── PACKAGES ── */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={pkgRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>Compare</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.6rem)', color: '#0f172a' }}>
              Website <span className="grad-text">Packages</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem', alignItems: 'start' }}>
            {PACKAGES.map(pkg => (
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

          {/* 3D add-on packages */}
          <div style={{ textAlign: 'center', margin: '3.5rem 0 2rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.5rem' }}>Compare</div>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#0f172a' }}>3D Add-Ons</h3>
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

      {/* ── RANGER DASHBOARD HIGHLIGHT ── */}
<section style={{ padding: '60px 1.5rem', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
  <div style={{ maxWidth: 1100, margin: '0 auto' }}>
    <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '1rem' }}>Featured Project</div>
    <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: '#0f172a', marginBottom: '2rem' }}>
      Built With the Same Stack
    </h2>

    {/* Dashboard highlight card */}
    <div className="card-3d" style={{
      background: 'linear-gradient(135deg, #324a7b 0%, #080f1b 100%)',
      borderRadius: 18,
      overflow: 'hidden',
      border: '1px solid #1e3355',
      boxShadow: '0 20px 60px rgba(10,22,40,0.25)',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))',
    }}>

      {/* Left — stat strip */}
      <div style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
        {/* Badge */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 9999, padding: '0.3rem 0.9rem', marginBottom: '1.2rem' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', animation: 'pulse-ring 2.5s infinite' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f59e0b' }}>Live Project</span>
          </div>

          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 'clamp(1.4rem,3vw,2rem)', color: '#fff', lineHeight: 1.1, marginBottom: '0.5rem' }}>
            Ford Ranger XL<br />
            <span style={{ color: '#f59e0b' }}>Service Dashboard</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.7 }}>
            A personal vehicle service log built with React + TypeScript + Tailwind — featuring a live odometer, service history cards, tyre tracker, and an edit form backed by localStorage.
          </div>
        </div>

        {/* Stat grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          {[
            { label: 'Odometer',      value: '40,000 km',  color: '#f59e0b' },
            { label: 'Services Done', value: '3',           color: '#10b981' },
            { label: 'Days Owned',    value: '437 days',    color: '#06b6d4' },
            { label: 'Service Cost',  value: 'FJD $1,234',  color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '0.8rem' }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.1rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tech pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {['React 19','TypeScript','Vite','Tailwind v4','localStorage','IntersectionObserver'].map(t => (
            <span key={t} style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: 6, padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontWeight: 600, color: '#93c5fd' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Right — service card preview */}
      <div style={{ padding: '2.5rem', borderLeft: '1px solid #1e3355', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.25rem' }}>Service History Preview</div>

        {/* Mock service card */}
        {[
          { num: 'Service 01', km: '10,357 km', date: '30 Oct 2024', cost: 'FJD $320.00' },
          { num: 'Service 02', km: '19,000 km', date: '28 May 2025', cost: 'FJD $450.00' },
          { num: 'Service 03', km: '30,000 km', date: '12 Dec 2025', cost: 'FJD $464.45' },
        ].map((s, i) => (
          <div key={s.num} style={{
            background: i === 1 ? 'rgba(245,158,11,0.07)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${i === 1 ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: 10,
            padding: '0.9rem 1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.2rem' }}>{s.num}</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1rem', color: '#fff', fontWeight: 600 }}>{s.km}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>{s.date}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>Total</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>{s.cost}</div>
            </div>
          </div>
        ))}

        {/* Next service alert */}
        <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, animation: 'pulse-ring 2s infinite' }} />
          <div>
            <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next Service Due</div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>40,000 km — Due Now!</div>
          </div>
        </div>

        {/* Chassis info */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #1e3355', fontSize: '0.7rem', color: '#334155', letterSpacing: '0.05em' }}>
          Chassis TRABC240012 · GMH Autos, Samabula, Suva, Fiji
        </div>
      </div>

    </div>
  </div>
</section>

      {/* ── FOOTER CTA ── */}
      <section style={{ padding: '60px 1.5rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#fff', marginBottom: '1rem' }}>
          Ready to build your website?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem', marginBottom: '2rem' }}>
          Contact me today — Fijian local developer, 24/7 support, on-time delivery.
        </p>
        <button onClick={() => onNav('contact')}
          style={{ background: '#fff', border: 'none', color: '#2563eb', padding: '1rem 2.5rem', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>
          Let's Discuss Your Project →
        </button>
        <a href={`${import.meta.env.BASE_URL}lvts-contact-flyer.png`} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.5rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '0.85rem', textDecoration: 'none' }}>
          📇 Save our contact card <ExternalLink size={12}/>
        </a>
      </section>
    </>
  );
}
