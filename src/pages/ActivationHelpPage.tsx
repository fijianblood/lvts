import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, Monitor, Shield, Zap, RefreshCw, ChevronRight, Terminal, AlertTriangle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Method {
  id: string;
  icon: React.ReactNode;
  name: string;
  badge: string;
  badgeColor: string;
  target: string;
  period: string;
  internet: boolean;
  description: string;
  command: string;
  steps: string[];
  note?: string;
}

// ─── Activation methods data ──────────────────────────────────────────────────

const METHODS: Method[] = [
  {
    id: 'hwid',
    icon: <Shield size={22} />,
    name: 'HWID',
    badge: 'Recommended',
    badgeColor: '#16a34a',
    target: 'Windows 10 / 11',
    period: 'Permanent',
    internet: true,
    description:
      'Hardware ID (Digital License) activation — the most reliable method. Links a permanent digital licence directly to your hardware. Works exactly like a genuine retail key.',
    command: 'irm https://get.activated.win | iex',
    steps: [
      'Click the Start Menu and search for PowerShell',
      'Right-click PowerShell and select "Run as Administrator"',
      'Copy the command below and paste it into PowerShell, then press Enter',
      'When the MAS menu appears, press 1 for HWID activation',
      'Wait for the process to complete — Windows is now permanently activated',
    ],
    note: 'If your ISP blocks the URL, use the alternative command below.',
  },
  {
    id: 'ohook',
    icon: <Zap size={22} />,
    name: 'Ohook',
    badge: 'For Office',
    badgeColor: '#d97706',
    target: 'Microsoft Office',
    period: 'Permanent',
    internet: false,
    description:
      'Permanently activates Microsoft Office without an internet connection. Works on all modern Office versions. No KMS server needed.',
    command: 'irm https://get.activated.win | iex',
    steps: [
      'Click the Start Menu and search for PowerShell',
      'Right-click PowerShell and select "Run as Administrator"',
      'Copy the command below and paste it into PowerShell, then press Enter',
      'When the MAS menu appears, press 2 for Ohook activation',
      'Office is now permanently activated — no internet required after this',
    ],
  },
  {
    id: 'tsforge',
    icon: <Monitor size={22} />,
    name: 'TSforge',
    badge: 'Advanced',
    badgeColor: '#7c3aed',
    target: 'Windows / ESU / Office',
    period: 'Permanent',
    internet: false,
    description:
      'Advanced activation method covering Windows, Extended Security Updates (ESU), and Office. Ideal for enterprise environments and older systems.',
    command: 'irm https://get.activated.win | iex',
    steps: [
      'Click the Start Menu and search for PowerShell',
      'Right-click PowerShell and select "Run as Administrator"',
      'Copy the command below and paste it into PowerShell, then press Enter',
      'When the MAS menu appears, press 3 for TSforge activation',
      'Follow the on-screen prompts to complete activation',
    ],
  },
  {
    id: 'kms',
    icon: <RefreshCw size={22} />,
    name: 'Online KMS',
    badge: '180 Days',
    badgeColor: '#0284c7',
    target: 'Windows / Office',
    period: '180 Days (auto-renews)',
    internet: true,
    description:
      'Activates Windows and Office for 180 days with an automatic renewal task installed. A good option when HWID is not available for your version.',
    command: 'irm https://get.activated.win | iex',
    steps: [
      'Click the Start Menu and search for PowerShell',
      'Right-click PowerShell and select "Run as Administrator"',
      'Copy the command below and paste it into PowerShell, then press Enter',
      'When the MAS menu appears, press 4 for Online KMS activation',
      'A renewal task is automatically created — activation stays active as long as you have internet',
    ],
  },
];

const ALT_COMMAND =
  'iex (curl.exe -s --doh-url https://1.1.1.1/dns-query https://get.activated.win | Out-String)';

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy command' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        background: copied ? '#16a34a' : 'linear-gradient(135deg,#2563eb,#7c3aed)',
        color: '#fff',
        border: 'none',
        borderRadius: 10,
        padding: '0.6rem 1.1rem',
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Space Grotesk',sans-serif",
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      {copied ? <CheckCircle size={15} /> : <Copy size={15} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Method card ──────────────────────────────────────────────────────────────

function MethodCard({ method, selected, onSelect }: { method: Method; selected: boolean; onSelect: () => void }) {
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
      {/* Icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 10, flexShrink: 0,
        background: selected ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : '#e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: selected ? '#fff' : '#64748b', transition: 'all 0.15s',
      }}>
        {method.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem', fontFamily: "'Syne',sans-serif" }}>
            {method.name}
          </span>
          <span style={{
            background: method.badgeColor, color: '#fff', borderRadius: 999,
            padding: '0.1rem 0.55rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em',
          }}>
            {method.badge}
          </span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '0.25rem' }}>
          {method.target} · {method.period}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
          {method.description}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight size={18} style={{ color: selected ? '#2563eb' : '#cbd5e1', flexShrink: 0, marginTop: 4, transition: 'color 0.15s' }} />
    </button>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ActivationHelpPage() {
  const [selectedId, setSelectedId] = useState<string>('hwid');
  const selected = METHODS.find(m => m.id === selectedId)!;

  return (
    <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
      {/* Orbs */}
      <div className="orb" style={{ width: 500, height: 500, background: 'rgba(37,99,235,0.06)', top: '-10%', right: '-5%' }} />
      <div className="orb" style={{ width: 350, height: 350, background: 'rgba(124,58,237,0.05)', bottom: '5%', left: '-3%', animationDelay: '3s' }} />

      {/* Header */}
      <div style={{ maxWidth: 800, margin: '0 auto 3rem', textAlign: 'center', position: 'relative' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#7c3aed', marginBottom: '0.75rem',
        }}>
          <Terminal size={14} /> Windows & Office Activation
        </div>
        <h1 style={{
          fontFamily: "'Syne',sans-serif", fontWeight: 800,
          fontSize: 'clamp(1.9rem,5vw,3rem)', color: '#0f172a',
          lineHeight: 1.1, marginBottom: '1rem',
        }}>
          Activate Windows & Office{' '}
          <span className="grad-text">the Right Way</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, maxWidth: 600, margin: '0 auto' }}>
          LvTS uses{' '}
          <a href="https://massgrave.dev" target="_blank" rel="noopener noreferrer"
            style={{ color: '#2563eb', textDecoration: 'underline' }}>
            Microsoft Activation Scripts (MAS)
          </a>{' '}
          — a fully open-source, trusted activation tool used by IT professionals worldwide.
          Select your method below and follow the steps.
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.5rem', alignItems: 'start' }}>

        {/* Left — Method selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '0.25rem' }}>
            Select Activation Method
          </div>
          {METHODS.map(m => (
            <MethodCard
              key={m.id}
              method={m}
              selected={selectedId === m.id}
              onSelect={() => setSelectedId(m.id)}
            />
          ))}

          {/* MAS attribution */}
          <a
            href="https://github.com/massgravel/Microsoft-Activation-Scripts"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              fontSize: '0.72rem', color: '#94a3b8', textDecoration: 'none',
              padding: '0.5rem 0', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          >
            <ExternalLink size={12} />
            Powered by Microsoft Activation Scripts (MAS) — Open Source, MIT Licensed
          </a>
        </div>

        {/* Right — Step by step guide */}
        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
          boxShadow: '0 20px 60px rgba(15,23,42,0.08)', overflow: 'hidden',
          position: 'sticky', top: '100px',
        }}>
          {/* Card header */}
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
                {selected.name} Activation Guide
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                {selected.target} · {selected.period}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.68rem', color: selected.internet ? '#86efac' : '#fca5a5', fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: selected.internet ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
                {selected.internet ? 'Internet required' : 'Works offline'}
              </span>
            </div>
          </div>

          {/* Steps */}
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

            {/* Command block */}
            <div style={{ background: '#0f172a', borderRadius: 12, padding: '1rem 1.1rem', marginTop: '0.25rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                PowerShell Command
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <code style={{
                  flex: 1, color: '#86efac', fontSize: '0.82rem',
                  fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5,
                }}>
                  {selected.command}
                </code>
                <CopyButton text={selected.command} />
              </div>
            </div>

            {/* Alternative command (for HWID) */}
            {selected.id === 'hwid' && (
              <div style={{ background: '#fefce8', border: '1px solid #fde047', borderRadius: 10, padding: '0.9rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <AlertTriangle size={15} style={{ color: '#ca8a04', flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#92400e' }}>
                    If the command is blocked by your ISP or DNS:
                  </span>
                </div>
                <div style={{ background: '#0f172a', borderRadius: 8, padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                  <code style={{ flex: 1, color: '#fbbf24', fontSize: '0.73rem', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
                    {ALT_COMMAND}
                  </code>
                  <CopyButton text={ALT_COMMAND} label="Copy alt" />
                </div>
              </div>
            )}

            {/* Internet indicator */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              background: '#f8fafc', borderRadius: 8, padding: '0.65rem 0.9rem',
              fontSize: '0.78rem', color: '#64748b',
            }}>
              <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
              Fully open source · Source verified at{' '}
              <a href="https://github.com/massgravel/Microsoft-Activation-Scripts" target="_blank"
                rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>
                github.com/massgravel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom info strip */}
      <div style={{
        maxWidth: 1000, margin: '2.5rem auto 0',
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 16, padding: '1.2rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '1rem',
      }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
            Need hands-on help activating your PC?
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
            LvTS can activate Windows and Office for you remotely or in person — Suva & surrounds.
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

      {/* Disclaimer */}
      <p style={{ maxWidth: 1000, margin: '1rem auto 0', textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.6 }}>
        Microsoft Activation Scripts (MAS) is an independent open-source project not affiliated with Microsoft Corporation.
        LvTS provides this tool as a convenience for our customers. Always download scripts only from verified sources.
        Source: <a href="https://github.com/massgravel/Microsoft-Activation-Scripts" target="_blank"
          rel="noopener noreferrer" style={{ color: '#7c3aed' }}>github.com/massgravel/Microsoft-Activation-Scripts</a>
      </p>
    </section>
  );
}
