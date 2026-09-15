import { useState } from 'react';
import { CheckCircle, Monitor, KeyRound, RefreshCw, ShieldCheck, ChevronRight, HelpCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Issue {
  id: string;
  icon: React.ReactNode;
  name: string;
  badge: string;
  badgeColor: string;
  summary: string;
  steps: string[];
}

// ─── Issues data ────────────────────────────────────────────────────────────

const ISSUES: Issue[] = [
  {
    id: 'not-activated',
    icon: <ShieldCheck size={22} />,
    name: 'Windows says "Not activated"',
    badge: 'Most common',
    badgeColor: '#16a34a',
    summary: 'A fresh install or a copied install often shows this even when your PC is entitled to a genuine license.',
    steps: [
      'Open Settings → System → Activation to see your exact status',
      'If it says "Windows is activated with a digital license linked to your Microsoft account" but shows an error — sign in with the Microsoft account you originally used',
      'Go to Settings → Accounts and make sure you are signed in with that same account',
      'Restart your PC — activation often re-checks automatically after sign-in',
      'Still stuck? Book a free check with LvTS below and we will look at your specific case',
    ],
  },
  {
    id: 'new-hardware',
    icon: <Monitor size={22} />,
    name: 'Activation lost after new hardware',
    badge: 'Hardware change',
    badgeColor: '#0284c7',
    summary: 'Replacing a motherboard or doing a major upgrade can un-link your digital license from the new hardware ID.',
    steps: [
      'Open Settings → System → Activation',
      'Click "Troubleshoot" next to the activation error',
      'Choose "I changed hardware on this device recently"',
      'Sign in with the Microsoft account tied to your original license and confirm the device',
      'Windows re-links the license to your new hardware automatically',
    ],
  },
  {
    id: 'office',
    icon: <RefreshCw size={22} />,
    name: 'Office says "Unlicensed Product"',
    badge: 'For Office',
    badgeColor: '#d97706',
    summary: 'Usually means Office is signed in with the wrong account, or the subscription/key was never linked to this install.',
    steps: [
      'Open any Office app (e.g. Word) → File → Account',
      'Check which Microsoft account is signed in at the top right',
      'Sign out and sign back in with the account that purchased Office or Microsoft 365',
      'If you don’t remember the account, check account.microsoft.com/services for your licenses',
      'From there you can also reinstall Office directly, already linked to your license',
    ],
  },
  {
    id: 'no-license',
    icon: <KeyRound size={22} />,
    name: 'I don’t have a genuine license yet',
    badge: 'Need a key',
    badgeColor: '#7c3aed',
    summary: 'If your Windows or Office was never genuinely licensed, the only lasting fix is a real license — everything else is temporary.',
    steps: [
      'Windows and Office keys can be bought directly from the Microsoft Store or an authorised reseller',
      'Avoid marketplace "keys" that are suspiciously cheap — many are stolen, blacklisted, or stop working after a few months',
      'LvTS can help you pick the right edition (Home vs Pro, Office plan) for what you actually need',
      'We can also source and install a genuine license for you, in person or remotely',
    ],
  },
];

// ─── Issue card ───────────────────────────────────────────────────────────────

function IssueCard({ issue, selected, onSelect }: { issue: Issue; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        background: selected ? 'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(124,58,237,0.08))' : '#f8fafc',
        border: `2px solid ${selected ? '#2563eb' : '#e2e8f0'}`,
        borderRadius: 14,
        padding: '1rem 1.2rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.9rem',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.borderColor = '#cbd5e1'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = '#e2e8f0'; }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: selected ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? '#fff' : '#64748b', transition: 'all 0.15s',
      }}>
        {issue.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', fontFamily: "'Syne',sans-serif" }}>
            {issue.name}
          </span>
          <span style={{
            background: issue.badgeColor, color: '#fff', borderRadius: 999,
            padding: '0.1rem 0.55rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
          }}>
            {issue.badge}
          </span>
        </div>
        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
          {issue.summary}
        </div>
      </div>

      <ChevronRight size={18} style={{ color: selected ? '#2563eb' : '#cbd5e1', flexShrink: 0, marginTop: 4, transition: 'color 0.15s' }} />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivationHelpPage() {
  const [selectedId, setSelectedId] = useState<string>('not-activated');
  const selected = ISSUES.find(i => i.id === selectedId)!;

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(37,99,235,0.06)', top: '-10%', right: '-5%' }} />
      <div className="orb" style={{ width: 350, height: 350, background: 'rgba(124,58,237,0.05)', bottom: '5%', left: '-3%', animationDelay: '3s' }} />

      <div style={{ maxWidth: 800, margin: '0 auto 3rem', textAlign: 'center', position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem',
        }}>
          <HelpCircle size={14} /> Windows & Office Activation Help
        </div>
        <h1 style={{
          fontFamily: "'Syne',sans-serif", fontWeight: 800,
          fontSize: 'clamp(1.9rem,5vw,3rem)', color: '#0f172a',
          lineHeight: 1.1, marginBottom: '1rem',
        }}>
          Activation Problems, <span className="grad-text">Sorted Properly</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
          Pick the issue that matches what you're seeing. These are the official, built-in
          Windows and Microsoft account fixes — no scripts, no shortcuts.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.5rem', alignItems: 'start' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.25rem' }}>
            What's the problem?
          </div>
          {ISSUES.map(i => (
            <IssueCard
              key={i.id}
              issue={i}
              selected={selectedId === i.id}
              onSelect={() => setSelectedId(i.id)}
            />
          ))}
        </div>

        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)', overflow: 'hidden',
          position: 'sticky', top: '100px',
        }}>
          <div style={{
            background: 'linear-gradient(135deg,#1e293b,#0f172a)',
            padding: '1.2rem 1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9,
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {selected.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem', fontFamily: "'Syne',sans-serif" }}>
                {selected.name}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Official fix path
              </div>
            </div>
          </div>

          <div style={{ padding: '1.4rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selected.steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#2563eb,#7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 700, color: '#fff', marginTop: 1,
                }}>
                  {i + 1}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                  {step}
                </p>
              </div>
            ))}

            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#f8fafc', borderRadius: 8, padding: '0.65rem 0.9rem',
              fontSize: '0.78rem', color: '#64748b',
            }}>
              <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
              These are Microsoft's own recommended steps — nothing here bypasses licensing.
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1000, margin: '2.5rem auto 0',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 16, padding: '1.2rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
            Still stuck, or need a genuine license sourced?
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            LvTS can fix activation issues and set you up with a proper license — remotely or in person, Suva & surrounds.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <a href="tel:8331088" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff',
            borderRadius: 10, padding: '0.6rem 1.1rem', textDecoration: 'none',
            fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
          }}>
            Call 833 1088
          </a>
          <a href="https://wa.me/6797466941" target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: '#16a34a', color: '#fff', borderRadius: 10,
            padding: '0.6rem 1.1rem', textDecoration: 'none',
            fontSize: '0.82rem', fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
          }}>
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}
