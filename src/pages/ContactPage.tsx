import { useState } from 'react';
import { useScrollFade } from '../hooks/useScrollFade';
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle, Loader2, Link2, ShoppingBag, Compass, Flag, Home, Music2 } from 'lucide-react';

const SOCIALS = [
  { label: 'Linktree', handle: 'linktr.ee/sahibjoe', url: 'https://linktr.ee/sahibjoe', color: '#7c3aed', icon: Link2 },
  { label: 'Vitikart', handle: 'joesahib store', url: 'https://www.vitikart.com.fj/marketplace/joesahib.html', color: '#81d709', icon: ShoppingBag },
  { label: 'Content Tours', handle: 'Korolevu, Sigatoka', url: 'https://contentrentaltour.netlify.app/', color: '#d2dc14', icon: Compass },
  { label: 'One Nation Political Party', handle: 'One Nation Fiji', url: 'https://onenationfiji.netlify.app/', color: '#3ea97e', icon: Flag },
  { label: 'Red-Hill Real Estate', handle: 'Suva, Fiji', url: 'https://redhillrealestate.netlify.app/', color: '#cd0f0f', icon: Home },
  { label: 'TikTok', handle: '@fijianblood8', url: 'https://www.tiktok.com/@fijianblood8', color: '#06b6d4', icon: Music2 },
];

type Status = 'idle' | 'sending' | 'success' | 'error';

export default function ContactPage() {
  const heroRef = useScrollFade();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errMsg, setErrMsg] = useState('');

  function update(k: string, v: string) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('sending');
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k === 'email' ? '_replyto' : k, v));
    try {
      const res = await fetch('https://formspree.io/f/xzdlvpyl', { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', phone: '', message: '' });
      } else {
        const j = await res.json();
        setErrMsg(j.errors?.map((e: { message: string }) => e.message).join(', ') || 'Submission failed.');
        setStatus('error');
      }
    } catch {
      setErrMsg('Network error. Please try again.');
      setStatus('error');
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: 10,
    padding: '0.75rem 1rem',
    color: '#0f172a',
    fontFamily: "'Space Grotesk',sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.75rem',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: '0.5rem',
  };

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '120px 1.5rem 60px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 450, height: 450, background: 'rgba(124,58,237,0.05)', top: '-5%', left: '-5%' }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(37,99,235,0.08)', bottom: '10%', right: '5%', animationDelay: '2s' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>Let's Connect</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
            Get In <span className="grad-text">Touch</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
            Book a repair, request a quote, or just say bula. I'm based in Raiwai, Suva and serve clients across Fiji.
          </p>
        </div>

        {/* Contact info cards */}
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { icon: <Phone size={22} />, label: 'Phone', value: '8331088 / 7466941', href: 'tel:+6798331088', color: '#2563eb' },
            { icon: <Mail size={22} />, label: 'Email', value: 'lomavatatechfiji@gmail.com', href: 'mailto:lomavatatechfiji@gmail.com', color: '#2563eb' },
            { icon: <Mail size={22} />, label: 'Alt Email', value: 'lomavatatechfiji@gmail.com', href: 'mailto:lomavatatechfiji@gmail.com', color: '#7c3aed' },
            { icon: <MapPin size={22} />, label: 'Location', value: 'Raiwai, Suva, Fiji', href: '#', color: '#f59e0b' },
          ].map(c => (
            <a key={c.label} href={c.href} className="card-3d"
              style={{ display: 'block', background: '#fff', border: `1px solid ${c.color}25`, borderTop: `3px solid ${c.color}`, borderRadius: 12, padding: '1.3rem', textDecoration: 'none', transition: 'border-color 0.2s' }}>
              <div style={{ color: c.color, marginBottom: '0.6rem' }}>{c.icon}</div>
              <div style={{ fontSize: '0.65rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.3rem' }}>{c.label}</div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.9rem', wordBreak: 'break-word' }}>{c.value}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Form + Socials */}
      <section style={{ padding: '0 1.5rem 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '2.5rem', alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem' }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '1.4rem', color: '#0f172a', marginBottom: '0.4rem' }}>Repair Request</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.8rem' }}>Describe your device issue and we'll get back to you promptly.</p>

            {status === 'success' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <CheckCircle size={48} color="#06b6d4" />
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1.1rem' }}>Request Sent!</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>We'll get back to you shortly. Vinaka!</div>
                <button onClick={() => setStatus('idle')} style={{ marginTop: '0.5rem', background: 'none', border: '1px solid rgba(37,99,235,0.4)', color: '#06b6d4', padding: '0.5rem 1.2rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input type="text" required value={form.name} onChange={e => update('name', e.target.value)} placeholder="Your name" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={labelStyle}>Email Address</label>
                  <input type="email" required value={form.email} onChange={e => update('email', e.target.value)} placeholder="you@email.com" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+679 xxxxxxx" style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>
                <div>
                  <label style={labelStyle}>Issue / Message</label>
                  <textarea required rows={4} value={form.message} onChange={e => update('message', e.target.value)} placeholder="Describe the issue with your laptop, computer, or printer..." style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.15)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(37,99,235,0.2)'; e.currentTarget.style.boxShadow = 'none'; }} />
                </div>

                {status === 'error' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.85rem' }}>
                    <AlertCircle size={16} /> {errMsg}
                  </div>
                )}

                <button type="submit" disabled={status === 'sending'}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.85rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: status === 'sending' ? 'not-allowed' : 'pointer', opacity: status === 'sending' ? 0.7 : 1 }}>
                  {status === 'sending' ? <><Loader2 size={18} className="animate-spin" /> Sending…</> : <><Send size={18} /> Submit Request</>}
                </button>
              </form>
            )}
          </div>

          {/* Right side: socials + photo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Photo */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid #e2e8f0', position: 'relative' }}>
              <img src={`${import.meta.env.BASE_URL}joewithmv.jpg`} alt="Josese with his Ranger" style={{ width: '100%', display: 'block', maxHeight: 280, objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(4,8,15,0.8), transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem' }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>LomaVata Tech Services</div>
                <div style={{ fontSize: '0.75rem', color: '#06b6d4' }}>IT Sales Pro · Raiwai, Suva</div>
              </div>
            </div>

            {/* Social links */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '1rem' }}>Personal Projects</div>
              <div className="flex flex-wrap gap-3">
                {SOCIALS.map(s => {
                  const Icon = s.icon;
                  return (
                    <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" title={`${s.label} — ${s.handle}`} aria-label={s.label}
                      className="flex items-center justify-center size-[44px] rounded-full bg-white cursor-pointer transition-[transform,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.165,0.84,0.44,1)] active:scale-[0.95]"
                      style={{ border: `1.5px solid ${s.color}40` }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 6px 16px ${s.color}30`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = `${s.color}40`; e.currentTarget.style.boxShadow = 'none'; }}>
                      <Icon size={18} color={s.color} />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
