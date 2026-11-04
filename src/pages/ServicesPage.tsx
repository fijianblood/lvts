import { useScrollFade } from '../hooks/useScrollFade';
import { Monitor, Wrench, Wifi, ShieldCheck, Globe, Printer, Rss, ExternalLink, Award, BadgeCheck, Tag, Star } from 'lucide-react';
import { openWhatsApp } from '../data/contact';

const BOOK_REPAIR_MESSAGE = "Bula LvTS, I'd like to book a repair.";

const GOOGLE_REVIEWS_URL = 'https://www.google.com/maps?cid=7436351358223208834';

const TRUST_STATS = [
  { icon: <Award size={22} />, value: '10+', label: 'Years IT Experience', color: '#2563eb' },
  { icon: <Wrench size={22} />, value: '1500+', label: 'Devices Repaired', color: '#06b6d4' },
];

const TRUST_CERTS = [
  { title: 'Career Skills in Software Development', issuer: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/certificates/9415915c8a737909b30a164b9d03fd868b04b7abe90a5f0abbdd275d41f26aa6' },
  { title: 'Career Essentials in System Administration', issuer: 'LinkedIn Learning', url: 'https://www.linkedin.com/learning/certificates/ca37c329baa5d7ba0dd24c667cb6bd51b73c4db26b1014daa23c082255ac73db' },
];

const SERVICES = [
  {
    icon: <Wrench size={28} />,
    title: 'PC & Laptop Repair',
    color: '#2563eb',
    desc: 'Any brand, any problem. Hardware faults, screen replacement, OS install, virus removal. Repairs from FJD $25.',
    video: 'https://www.facebook.com/plugins/video.php?height=476&href=https%3A%2F%2Fwww.facebook.com%2Flvtsfiji%2Fvideos%2F688488585674443%2F&show_text=false&width=382&t=0',
    tags: ['Dell','HP','Acer','ASUS','Toshiba','Apple'],
  },
  {
    icon: <Monitor size={28} />,
    title: 'Commercial Gas Oven',
    color: '#f59e0b',
    desc: 'Supply and service of commercial gas ovens for bakeries, restaurants, and food businesses across Fiji.',
    video: 'https://www.youtube.com/embed/HeQvnVyRKL0?si=d8BfJr-YfsCBa1Aa',
    tags: ['Commercial','Supply','Service','Warranty'],
  },
  {
    icon: <Globe size={28} />,
    title: 'Vitikart Store Setup',
    color: '#06b6d4',
    desc: 'Get your own online store on Vitikart.com.fj. Sell products digitally in Fiji with your own marketplace page.',
    video: 'https://www.youtube.com/embed/eG8yy1N62h4?si=8rqO9h1NGXL1NYvp',
    tags: ['eCommerce','Digital','Fiji','Online'],
  },
];

const EXTRA = [
  { icon: <ShieldCheck size={20} />, title: 'Antivirus & Security', desc: 'Remove viruses, malware, ransomware. Install proper antivirus protection.' },
  { icon: <Wifi size={20} />, title: 'Network & CCTV', desc: 'Home and office network setup, CCTV installation and configuration.' },
  { icon: <Globe size={20} />, title: 'Web Designing', desc: 'Modern websites, landing pages and portfolio sites for your business.' },
  { icon: <Monitor size={20} />, title: 'Software & OS', desc: 'Windows 10/11 installation, Microsoft Office, driver updates.' },
  { icon: <Printer size={20} />, title: 'Printer & Peripherals', desc: 'OKI MC342w color printer setup. Toner, drums, and maintenance.' },
  { icon: <ShieldCheck size={20} />, title: 'Email Hosting', desc: 'Business email setup, hosting, and domain configuration.' },
];

function ServiceCard({ s, i }: { s: (typeof SERVICES)[number]; i: number }) {
  const ref = useScrollFade();
  return (
    <div key={s.title} ref={ref} className="fade-in card-3d"
      style={{ background: '#fff', border: `1px solid ${s.color}30`, borderTop: `3px solid ${s.color}`, borderRadius: 14, overflow: 'hidden', transitionDelay: `${i * 0.1}s` }}>
      {/* Video */}
      <div style={{ position: 'relative', paddingBottom: '60%', height: 0, overflow: 'hidden', background: '#000' }}>
        <iframe
          src={s.video}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title={s.title}
        />
      </div>
      <div style={{ padding: '1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ color: s.color }}>{s.icon}</div>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>{s.title}</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.7, marginBottom: '1rem' }}>{s.desc}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {s.tags.map(t => (
            <span key={t} style={{ background: `${s.color}18`, border: `1px solid ${s.color}35`, color: s.color, borderRadius: 6, padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 600 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  const heroRef = useScrollFade();
  const extraRef = useScrollFade();
  const trustRef = useScrollFade();
  const flyerRef = useScrollFade();
  const fbRef = useScrollFade();

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '120px 1.5rem 60px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(37,99,235,0.06)', top: '-10%', right: '-5%' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>What We Do</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
            Tech Services Built for <span className="grad-text">Fiji</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
            From laptop repairs to full network installations — LomaVata Tech Services covers all your IT needs across Suva and the wider Fiji region.
          </p>
        </div>

        {/* Main service cards with video */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.title} s={s} i={i} />
          ))}
        </div>
      </section>

      {/* Additional services grid */}
      <section style={{ padding: '60px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={extraRef} className="fade-in" style={{ marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>Full Offerings</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', color: '#0f172a' }}>Everything We Cover</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
            {EXTRA.map((e, i) => (
              <div key={e.title} className="card-3d"
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.3rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', transitionDelay: `${i * 0.05}s` }}>
                <div style={{ color: '#06b6d4', flexShrink: 0, marginTop: 2 }}>{e.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem', fontSize: '0.95rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{e.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={trustRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(204deg,#292929 3%,#666 51%,#292929 100%)', border: '1px solid #bababa', borderRadius: 10, padding: '0.3rem 0.9rem', marginBottom: '1rem' }}>
              <BadgeCheck size={13} color="#fff" />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#fff', letterSpacing: '0.02em' }}>Verified &amp; Trusted</span>
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a', marginBottom: '0.75rem' }}>
              Why Fiji Trusts <span className="grad-text">LomaVata</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>
              A decade of hands-on repair work, verifiable credentials, and a 5-star record you can check on Google — trust you can check, not just take our word for.
            </p>
          </div>

          {/* Top bento row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {TRUST_STATS.map(s => (
              <div key={s.label} className="card-3d" style={{ background: '#fff', border: `1px solid ${s.color}30`, borderTop: `3px solid ${s.color}`, borderRadius: 14, padding: '1.6rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div style={{ color: s.color, marginBottom: '0.6rem' }}>{s.icon}</div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#0f172a', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem' }}>{s.label}</div>
              </div>
            ))}
            <a href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer" className="card-3d"
              style={{ background: '#fff', border: '1px solid rgba(245,158,11,0.3)', borderTop: '3px solid #f59e0b', borderRadius: 14, padding: '1.6rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)', textDecoration: 'none', display: 'block' }}>
              <div style={{ display: 'flex', gap: 2, color: '#f59e0b', marginBottom: '0.6rem' }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} fill="#f59e0b" />)}
              </div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#0f172a', lineHeight: 1 }}>5.0</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>Google Reviews (2) <ExternalLink size={12} /></div>
            </a>
            <div className="card-3d" style={{ background: '#fff', border: '1px solid rgba(124,58,237,0.2)', borderTop: '3px solid #7c3aed', borderRadius: 14, padding: '1.6rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
              <div style={{ color: '#7c3aed', marginBottom: '0.6rem' }}><ShieldCheck size={22} /></div>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Repair Guarantee</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>Every repair is checked before handover — no shortcuts, no surprises.</div>
            </div>
          </div>

          {/* Bottom bento row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.25rem' }}>
            <div className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.6rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.9rem' }}>Verified Credentials</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {TRUST_CERTS.map(c => (
                  <a key={c.title} href={c.url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.7rem 0.9rem', textDecoration: 'none' }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0f172a' }}>{c.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#2563eb' }}>{c.issuer}</div>
                    </div>
                    <ExternalLink size={15} color="#94a3b8" />
                  </a>
                ))}
              </div>
            </div>
            <div className="card-3d" style={{ background: 'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(124,58,237,0.06))', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 14, padding: '1.6rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ color: '#2563eb', marginBottom: '0.6rem' }}><Tag size={22} /></div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>Transparent Pricing</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1rem' }}>Repairs from FJD $25, quoted upfront before any work begins — no hidden fees.</div>
              </div>
              <button onClick={() => openWhatsApp(BOOK_REPAIR_MESSAGE)}
                style={{ alignSelf: 'flex-start', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.6rem 1.3rem', borderRadius: 8, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                Book a Repair
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Laptop Repair Flyer + Map */}
      <section style={{ padding: '80px 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '2rem', alignItems: 'start' }}>
          <div ref={flyerRef} className="fade-in">
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '1rem' }}>Repair Flyer</div>
            <div className="card-3d" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img src={`${import.meta.env.BASE_URL}laptop-flyer.jpg`} alt="Laptop Repair Services" style={{ width: '100%', display: 'block' }} />
            </div>
            <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg,rgba(37,99,235,0.12),rgba(6,182,212,0.04))', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 12, padding: '1.2rem' }}>
              <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Laptop/Computer/Printer</div>
              <div style={{ fontSize: '1.5rem', fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#06b6d4' }}>Repairs from FJD $25</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.4rem' }}>Any brand · Any problem · Suva & surrounds</div>
              <button onClick={() => openWhatsApp(BOOK_REPAIR_MESSAGE)}
                style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.65rem 1.4rem', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
                Book a Repair
              </button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '1rem' }}>Find Us</div>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3791.4908083861474!2d178.44417367348993!3d-18.14129068510718!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6e1be1d0639b9073%3A0x67333a292be35182!2sLomaVata%20Tech%20Services!5e0!3m2!1sen!2sfj!4v1781860419297!5m2!1sen!2sfj"
                width="100%" height="340" style={{ border: 0, display: 'block' }} allowFullScreen loading="lazy" title="LomaVata Tech Services Location"
              />
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[
                { label: 'Address', value: 'Raiwai, Suva, Fiji' },
                { label: 'Phone', value: '8331088 / 7466941' },
                { label: 'Email', value: 'lomavatatechfiji@gmail.com' },
                { label: 'TikTok', value: '@fijianblood8' },
              ].map(c => (
                <div key={c.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.8rem' }}>
                  <div style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.2rem' }}>{c.label}</div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f172a' }}>{c.value}</div>
                </div>
              ))}
            </div>

            <a href={`${import.meta.env.BASE_URL}lvts-contact-flyer.png`} target="_blank" rel="noopener noreferrer"
              className="card-3d" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.7rem', textDecoration: 'none' }}>
              <img src={`${import.meta.env.BASE_URL}lvts-contact-flyer.png`} alt="LvTS contact card" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Save Our Contact Card</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Tap to view full size</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FACEBOOK LIVE FEED */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div ref={fbRef} className="fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.5rem' }}>Stay In The Loop</div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', color: '#0f172a', marginBottom: '0.75rem' }}>Latest From Facebook</h2>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
            This feed updates automatically whenever we post — repair tips, new stock, and behind-the-scenes, straight from our Facebook page.
          </p>
        </div>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div className="card-3d" style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
            <iframe
              src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Flvtsfiji&tabs=timeline&width=560&height=700&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
              width="100%" height="700" style={{ border: 'none', display: 'block', overflow: 'hidden' }}
              allow="encrypted-media" loading="lazy"
              title="LomaVata Tech Services Facebook Page"
            />
          </div>
          <a href="https://www.facebook.com/lvtsfiji" target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1rem', color: '#2563eb', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
            <Rss size={15} /> Follow @lvtsfiji on Facebook <ExternalLink size={12} />
          </a>
        </div>
      </section>
    </>
  );
}
