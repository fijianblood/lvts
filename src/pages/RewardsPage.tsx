import { useScrollFade } from '../hooks/useScrollFade';
import {
  Gift, Ticket, Trophy, Fuel, ShoppingCart, Sparkles,
  CheckCircle2, Shield, Calendar, ArrowRight,
} from 'lucide-react';
import { openWhatsApp } from '../data/contact';

const REGISTER_MESSAGE = "Bula LvTS, I'd like to register my interest in LomaVata Rewards.";

const HOW_IT_WORKS = [
  { icon: <Ticket size={22} />, title: 'Choose a Package', desc: 'Pick a single entry for one draw, or a monthly membership for ongoing entries.' },
  { icon: <Sparkles size={22} />, title: 'Pay via Mobile Money', desc: 'Pay with Vodafone M-PAiSA or Digicel My Cash and submit your transaction reference.' },
  { icon: <CheckCircle2 size={22} />, title: 'Get Verified & Entered', desc: 'Once your payment is confirmed, you\'re automatically entered into the next draw.' },
  { icon: <Trophy size={22} />, title: 'Win Real Prizes', desc: 'Weekly draw winners and Mega Draw winners are announced and vouchers issued.' },
];

const PACKAGES = [
  {
    name: 'Single Entry',
    price: 'FJD $10',
    period: 'one-off',
    color: '#2563eb',
    popular: false,
    desc: 'Try your luck in the next weekly draw with a single paid entry.',
    features: ['1 entry into the next weekly draw', 'Eligible for grocery & fuel voucher prizes', 'Pay via M-PAiSA or My Cash'],
  },
  {
    name: 'Monthly Membership',
    price: 'FJD $25',
    period: '/ month',
    color: '#f59e0b',
    popular: true,
    desc: 'Stay entered into every weekly draw for the whole month, plus the Mega Draw.',
    features: ['Entry into every weekly draw that month', 'Automatic entry into the Mega Draw', 'Best value per entry', 'Cancel anytime'],
  },
];

const PRIZES = [
  { icon: <ShoppingCart size={26} />, title: 'Grocery Cash Vouchers', desc: 'Weekly winners receive grocery vouchers to use at participating stores.', color: '#2563eb' },
  { icon: <Fuel size={26} />, title: 'Fuel Vouchers', desc: 'Fill up for free — fuel vouchers awarded to select weekly winners.', color: '#06b6d4' },
  { icon: <Trophy size={26} />, title: 'Mega Draw Cash Prize', desc: 'Monthly members are entered into a bigger cash prize draw each month.', color: '#f59e0b' },
];

const FAQ = [
  { q: 'What\'s the difference between a single entry and a membership?', a: 'A single entry gets you into the very next weekly draw only. A monthly membership keeps you entered into every weekly draw for the month and adds an automatic entry into that month\'s Mega Draw.' },
  { q: 'How do I pay?', a: 'Payments are made via Vodafone M-PAiSA or Digicel My Cash to our registered business number. After paying, you submit your transaction reference so we can verify and activate your entry.' },
  { q: 'How long does verification take?', a: 'Most payments are verified within 24 hours. You\'ll be notified once your entry is confirmed and active.' },
  { q: 'How are winners chosen?', a: 'Each draw is run using a randomized selection process across all verified, eligible entries for that draw period. Results are published on this page and announced to members directly.' },
  { q: 'Can I enter more than once?', a: 'Yes — you can purchase additional single entries, or stack your odds by staying on a monthly membership across multiple draw periods.' },
];

export default function RewardsPage() {
  const heroRef = useScrollFade();
  const howRef = useScrollFade();
  const pkgRef = useScrollFade();
  const prizeRef = useScrollFade();
  const trustRef = useScrollFade();
  const faqRef = useScrollFade();

  return (
    <>
      {/* Hero */}
      <section style={{ padding: '120px 1.5rem 60px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#fffbeb 0%,#f8fafc 50%,#eff6ff 100%)' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(245,158,11,0.08)', top: '-10%', right: '-5%' }} />
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(37,99,235,0.06)', bottom: '5%', left: '-5%', animationDelay: '2s' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 9999, padding: '0.35rem 1rem', marginBottom: '1.5rem' }}>
            <Gift size={14} color="#b45309" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b45309' }}>LomaVata Rewards</span>
          </div>

          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.2rem,5vw,3.4rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
            Win Real Prizes, <span className="grad-text">Every Week</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.8, maxWidth: 620, margin: '0 auto 2rem' }}>
            Join LomaVata Rewards, Fiji's newest loyalty and prize draw program. Purchase a single entry or a monthly membership and get automatically entered into weekly draws — plus a monthly Mega Draw — to win grocery cash vouchers, fuel vouchers, and cash prizes.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => openWhatsApp(REGISTER_MESSAGE)}
              style={{ background: 'linear-gradient(135deg,#f59e0b,#ea580c)', border: 'none', color: '#fff', padding: '0.85rem 2rem', borderRadius: 10, fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}>
              Register Your Interest <ArrowRight size={16} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1rem' }}>
            Member sign-up portal launching soon — register your interest and we'll notify you when it opens.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={howRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.75rem' }}>How It Works</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              Four Steps to <span className="grad-text">Winning</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1.5rem' }}>
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.5rem', transitionDelay: `${i * 0.05}s` }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309', marginBottom: '0.9rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div ref={pkgRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.75rem' }}>Packages</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              Pick Your <span className="grad-text">Entry</span>
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Prices shown are illustrative starting points — final pricing to be confirmed.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1.5rem' }}>
            {PACKAGES.map(pkg => (
              <div key={pkg.name} className="card-3d"
                style={{ background: pkg.popular ? `linear-gradient(135deg,${pkg.color}0c,${pkg.color}04)` : '#fff', border: `2px solid ${pkg.popular ? pkg.color : '#e2e8f0'}`, borderRadius: 18, padding: '2rem', position: 'relative', boxShadow: pkg.popular ? `0 12px 40px ${pkg.color}25` : '0 2px 12px rgba(0,0,0,0.04)' }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: `linear-gradient(135deg,${pkg.color},#ea580c)`, color: '#fff', borderRadius: 20, padding: '0.25rem 1rem', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Best Value</div>
                )}
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: pkg.color, marginBottom: '0.5rem' }}>{pkg.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: '2.2rem', color: '#0f172a' }}>{pkg.price}</span>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{pkg.period}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>{pkg.desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {pkg.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.83rem', color: '#334155' }}>
                      <CheckCircle2 size={14} color={pkg.color} style={{ flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button onClick={() => openWhatsApp(REGISTER_MESSAGE)}
                  style={{ width: '100%', background: pkg.popular ? `linear-gradient(135deg,${pkg.color},#ea580c)` : '#f8fafc', border: pkg.popular ? 'none' : `1px solid ${pkg.color}`, color: pkg.popular ? '#fff' : pkg.color, padding: '0.8rem', borderRadius: 10, fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', transition: 'opacity 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                  Register Interest →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Prizes */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div ref={prizeRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.75rem' }}>Prizes</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              What You Could <span className="grad-text">Win</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.5rem' }}>
            {PRIZES.map(p => (
              <div key={p.title} className="card-3d" style={{ background: '#fff', border: `1px solid ${p.color}25`, borderTop: `3px solid ${p.color}`, borderRadius: 14, padding: '1.6rem', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
                <div style={{ color: p.color, marginBottom: '0.75rem' }}>{p.icon}</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem' }}>{p.title}</div>
                <div style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Transparency */}
      <section style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div ref={trustRef} className="fade-in">
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb', margin: '0 auto 1.2rem' }}>
              <Shield size={24} />
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', color: '#0f172a', marginBottom: '1rem' }}>
              How Winners Are Chosen
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Every weekly draw and Mega Draw is run using a randomized selection process across all verified, eligible entries for that period. We're launching soon — once our first draw runs, results and winner announcements will be published right here for full transparency.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 9999, padding: '0.5rem 1.2rem' }}>
              <Calendar size={15} color="#2563eb" />
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>First draw date to be announced</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <div ref={faqRef} className="fade-in" style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#b45309', marginBottom: '0.75rem' }}>FAQ</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,2.4rem)', color: '#0f172a' }}>
              Questions? <span className="grad-text">Answered.</span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {FAQ.map(f => (
              <div key={f.q} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.3rem 1.5rem' }}>
                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>{f.q}</div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.7 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ padding: '60px 1.5rem', background: 'linear-gradient(135deg,#f59e0b,#ea580c)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#fff', marginBottom: '1rem' }}>
          Be first in line when we launch
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginBottom: '2rem' }}>
          Register your interest and we'll let you know the moment sign-ups open.
        </p>
        <button onClick={() => openWhatsApp(REGISTER_MESSAGE)}
          style={{ background: '#fff', border: 'none', color: '#b45309', padding: '1rem 2.5rem', borderRadius: 12, fontWeight: 800, fontSize: '1rem', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'; }}>
          Register Your Interest →
        </button>
      </section>
    </>
  );
}
