import { useState, useEffect, useRef } from 'react';
import type { DashboardData } from '../types/ranger';
import { STORAGE_KEY, DEFAULT_DATA, SERVICES, TYRE, VEHICLE_INFO } from '../data/ranger';
import { formatNum, daysBetween, formatDateLong } from '../utils/ranger';
import { Save, Edit3, Eye, CheckCircle, AlertTriangle, RotateCcw, DollarSign, ArrowRight } from 'lucide-react';

// ─── localStorage helpers ────────────────────────────────────────────────────

function loadData(): DashboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_DATA };
    return { ...DEFAULT_DATA, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

function saveData(data: DashboardData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 8, padding: '1rem 1.2rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: accent }} />
      <div style={{ fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.4rem', fontWeight: 600, color: '#fff', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.3rem' }}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#f59e0b', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
      {children}
      <div style={{ flex: 1, height: 1, background: '#1e3355' }} />
    </div>
  );
}

// ─── Inline edit field ───────────────────────────────────────────────────────
function EditField({
  label, field, value, type = 'number', hint,
  onChange,
}: {
  label: string; field: keyof DashboardData; value: string | number;
  type?: string; hint?: string;
  onChange: (field: keyof DashboardData, val: string | number) => void;
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.4rem' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(field, type === 'number' ? Number(e.target.value) : e.target.value)}
        style={{ width: '100%', background: '#0b1a30', border: '1px solid #1e3355', borderRadius: 6, padding: '0.6rem 0.9rem', color: '#fff', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.9rem', outline: 'none', transition: 'border-color 0.2s' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(245,158,11,0.15)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1e3355'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      {hint && <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: '0.3rem' }}>{hint}</div>}
    </div>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────

export default function RangerPage() {
  const [data, setData] = useState<DashboardData>(loadData);
  const [view, setView] = useState<'dashboard' | 'edit'>('dashboard');
  const [saved, setSaved] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto-save 800ms after any change
  useEffect(() => {
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      saveData(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }, 800);
    return () => clearTimeout(autoSaveTimer.current);
  }, [data]);

  function update(field: keyof DashboardData, val: string | number) {
    setData(prev => ({ ...prev, [field]: val }));
  }

  function resetToDefaults() {
    setData({ ...DEFAULT_DATA });
    saveData({ ...DEFAULT_DATA });
    setResetConfirm(false);
  }

  const days = daysBetween(String(data.deliveryDate));
  const nextService = Math.ceil(data.currentKm / 10000) * 10000;
  const kmToNext = nextService - data.currentKm;

  return (
    <div style={{ background: '#0a1628', minHeight: '100vh', paddingTop: 68 }}>

      {/* ── Inner header ── */}
      <div style={{ background: 'linear-gradient(135deg,#003478 0%,#0a1628 100%)', borderBottom: '2px solid #f59e0b', padding: '0 1.5rem', position: 'sticky', top: 68, zIndex: 30, boxShadow: '0 4px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: '#003478', border: '2px solid #c0c8d4', borderRadius: '50%', width: 40, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '0.7rem', color: '#fff', boxShadow: '0 0 12px rgba(0,52,120,0.8)' }}>FORD</div>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.1rem', letterSpacing: 2, textTransform: 'uppercase', color: '#fff', lineHeight: 1 }}>Ranger XL 4×4</div>
              <div style={{ fontSize: '0.6rem', color: '#f59e0b', letterSpacing: 3, textTransform: 'uppercase', marginTop: 1 }}>2024 · Personal Service Log</div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Auto-save indicator */}
            {saved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                <CheckCircle size={13} /> Auto-saved
              </div>
            )}

            {/* View toggle */}
            <button
              onClick={() => setView(view === 'dashboard' ? 'edit' : 'dashboard')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: view === 'edit' ? '#f59e0b' : 'transparent', border: '1px solid #f59e0b', color: view === 'edit' ? '#0a1628' : '#f59e0b', padding: '0.4rem 1rem', borderRadius: 6, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.75rem', letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.2s' }}
            >
              {view === 'dashboard' ? <><Edit3 size={13}/> Edit Values</> : <><Eye size={13}/> View Dashboard</>}
            </button>

            {/* Reset */}
            {!resetConfirm ? (
              <button onClick={() => setResetConfirm(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid #334155', color: '#64748b', padding: '0.4rem 0.8rem', borderRadius: 6, fontSize: '0.72rem', cursor: 'pointer' }}>
                <RotateCcw size={12}/> Reset
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>Reset to defaults?</span>
                <button onClick={resetToDefaults} style={{ background: '#ef4444', border: 'none', color: '#fff', padding: '0.3rem 0.6rem', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer', fontWeight: 700 }}>Yes</button>
                <button onClick={() => setResetConfirm(false)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: 4, fontSize: '0.7rem', cursor: 'pointer' }}>No</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PRICING PITCH BANNER */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <a
          href="https://www.vitikart.com.fj/914-website-design-development-fiji-we-make-websites"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: 'none', display: 'block' }}
        >
          <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.12),rgba(245,158,11,0.06))', border: '1px solid #10b981', borderRadius: 10, padding: '1rem 1.3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <DollarSign size={19} color="#10b981" />
              </div>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  Like this dashboard? It's yours from <span style={{ color: '#10b981' }}>$5/month</span> — less than $1 a day.
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8b9ab0', marginTop: '0.15rem' }}>
                  That's the whole cost to design, host & keep a website like this one live — and it grows with you.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#10b981', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0 }}>
              Get Yours <ArrowRight size={15} />
            </div>
          </div>
        </a>
      </div>

      {/* YOUTUBE SHORTS EMBED */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '1.5rem 1.5rem 0' }}>
        <div style={{ maxWidth: 360, margin: '0 auto', borderRadius: 12, overflow: 'hidden', border: '1px solid #1e3355', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}>
          <div style={{ position: 'relative', paddingBottom: '177.78%', height: 0 }}>
            <iframe
              src="https://www.youtube.com/embed/jphOMn-m5Os"
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title="Ford Ranger XL 4x4 2024 — Personal Service Log"
            />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* EDIT VIEW */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'edit' && (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Live preview strip */}
          <SectionTitle>Live Preview</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.8rem', marginBottom: '2rem' }}>
            {[
              { label: 'Odometer', value: formatNum(data.currentKm) + ' km', accent: '#f59e0b' },
              { label: 'Services', value: String(data.totalServices), accent: '#3b82f6' },
              { label: 'Service Cost', value: 'FJD ' + formatNum(data.totalCost), accent: '#10b981' },
              { label: 'Days Owned', value: daysBetween(String(data.deliveryDate)) + ' days', accent: '#2dd4bf' },
              { label: 'Warranty', value: formatDateLong(data.warrantyDate), accent: '#a78bfa' },
            ].map(s => <StatCard key={s.label} label={s.label} value={s.value} accent={s.accent} />)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.5rem' }}>

            {/* Odometer & services */}
            <div style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ color: '#f59e0b', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1.2rem' }}>Vehicle Metrics</div>
              <EditField label="Current Odometer (km)" field="currentKm" value={data.currentKm} onChange={update} />
              <EditField label="Total Services Completed" field="totalServices" value={data.totalServices} onChange={update} />
              <EditField label="Total Service Cost (FJD)" field="totalCost" value={data.totalCost} onChange={update} />
            </div>

            {/* Financial */}
            <div style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ color: '#ef4444', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1.2rem' }}>Financial</div>
              <EditField label="Purchase Price (FJD)" field="purchasePrice" value={data.purchasePrice} onChange={update} />
            </div>

            {/* Dates */}
            <div style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 12, padding: '1.5rem' }}>
              <div style={{ color: '#2dd4bf', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase', marginBottom: '1.2rem' }}>Dates</div>
              <EditField label="Delivery Date" field="deliveryDate" value={data.deliveryDate} type="date" hint="Days Owned calculates automatically from this date" onChange={update} />
              <EditField label="Warranty Expires" field="warrantyDate" value={data.warrantyDate} type="date" onChange={update} />
            </div>
          </div>

          {/* Save tip */}
          <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '0.8rem 1rem' }}>
            <Save size={15} color="#f59e0b" />
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Changes are <strong style={{ color: '#f59e0b' }}>auto-saved</strong> to your browser 0.8 seconds after you stop typing. No button needed.</span>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* DASHBOARD VIEW */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {view === 'dashboard' && (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2rem 1.5rem', backgroundImage: 'radial-gradient(ellipse at 20% 10%,rgba(0,52,120,0.2) 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,rgba(26,58,107,0.15) 0%,transparent 50%)' }}>

          {/* STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <StatCard label="Odometer"      value={formatNum(data.currentKm) + ' km'}   accent="#f59e0b" />
            <StatCard label="Total Services" value={String(data.totalServices)}            accent="#3b82f6" />
            <StatCard label="Days Owned"    value={String(days)}                          sub={`Since ${formatDateLong(data.deliveryDate)}`} accent="#2dd4bf" />
            <StatCard label="Service Cost"  value={`FJD ${formatNum(data.totalCost)}`}   accent="#10b981" />
            <StatCard label="Purchase Price" value={`FJD ${formatNum(data.purchasePrice)}`} accent="#a78bfa" />
            <StatCard label="Warranty Exp"  value={formatDateLong(data.warrantyDate)}     accent="#f59e0b" />
          </div>

          {/* VEHICLE INFO */}
          <SectionTitle>Vehicle Information</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
            {VEHICLE_INFO.map(item => (
              <div key={item.label} style={{ background: '#0b1a30', border: '1px solid #1e3355', borderRadius: 8, padding: '0.8rem 1rem' }}>
                <div style={{ fontSize: '0.58rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.25rem' }}>{item.label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {item.label === 'Dealer' && (
                    <img src={`${import.meta.env.BASE_URL}gmh-autos-logo.jpg`} alt="GMH Autos" style={{ height: 20, width: 20, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* NEXT SERVICE ALERT */}
          <SectionTitle>Next Service</SectionTitle>
          <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.1),rgba(245,158,11,0.03))', border: '1px solid #f59e0b', borderRadius: 10, padding: '1.3rem 1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 12, height: 12, background: '#f59e0b', borderRadius: '50%', flexShrink: 0, animation: 'pulse-ring 2s infinite' }} />
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '0.7rem', letterSpacing: 3, textTransform: 'uppercase', color: '#f59e0b', marginBottom: '0.25rem' }}>Next Service Due</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.6rem', color: '#fff' }}>
                  {formatNum(nextService)} km
                  {kmToNext <= 0
                    ? <span style={{ fontSize: '0.9rem', color: '#ef4444', marginLeft: '0.7rem' }}>— Overdue!</span>
                    : <span style={{ fontSize: '0.9rem', color: '#f59e0b', marginLeft: '0.7rem' }}>— {formatNum(kmToNext)} km to go</span>
                  }
                </div>
                <div style={{ fontSize: '0.78rem', color: '#8b9ab0', marginTop: '0.2rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span>Current: {formatNum(data.currentKm)} km · Book at</span>
                  <img src={`${import.meta.env.BASE_URL}gmh-autos-logo.jpg`} alt="GMH Autos" style={{ height: 16, width: 16, borderRadius: 4, objectFit: 'cover' }} />
                  <span>GMH Autos · Ph: 702 6945</span>
                </div>
              </div>
            </div>
            {kmToNext <= 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '0.6rem 1rem' }}>
                <AlertTriangle size={16} color="#ef4444" />
                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>Service overdue — book now</span>
              </div>
            )}
          </div>

          {/* TYRE STATUS */}
          <SectionTitle>Tyre Status — {TYRE.spec}</SectionTitle>
          <div style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 10, padding: '1.4rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.4rem' }}>Replaced At</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#fff', fontSize: '1rem' }}>{TYRE.replacedAt}</div>
              <div style={{ fontSize: '0.7rem', color: '#10b981', marginTop: '0.3rem' }}>{TYRE.note}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.4rem' }}>KMs on Current Tyres</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#fff', fontSize: '1rem' }}>{TYRE.kmsOnCurrent}</div>
              <div style={{ fontSize: '0.7rem', color: '#8b9ab0', marginTop: '0.3rem' }}>{TYRE.remainingEst}</div>
              <div style={{ background: '#0f2344', borderRadius: 4, height: 8, marginTop: '0.8rem', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'linear-gradient(90deg,#10b981,#f59e0b)', width: `${TYRE.percentUsed}%`, borderRadius: 4, transition: 'width 0.8s ease' }} />
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '0.3rem' }}>~{TYRE.percentUsed}% of estimated life used</div>
            </div>
            <div>
              <div style={{ fontSize: '0.6rem', letterSpacing: 2, textTransform: 'uppercase', color: '#8b9ab0', marginBottom: '0.4rem' }}>Next Rotation Due</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", color: '#fff', fontSize: '1rem' }}>{TYRE.nextRotation}</div>
              <div style={{ fontSize: '0.7rem', color: '#8b9ab0', marginTop: '0.3rem' }}>Rotate every 10,000 km</div>
            </div>
          </div>

          {/* SERVICE HISTORY */}
          <SectionTitle>Service History</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(360px,100%),1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {SERVICES.map(s => (
              <div key={s.id} style={{ background: '#0d1f3c', border: '1px solid #1e3355', borderRadius: 10, overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ background: '#1a3a6b', padding: '0.9rem 1.3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f59e0b' }}>
                  <div>
                    <div style={{ fontSize: '0.65rem', letterSpacing: 3, color: '#f59e0b', textTransform: 'uppercase', fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>{s.number}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.2rem', color: '#fff', fontWeight: 500 }}>{s.km}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '1.1rem', color: '#fff', lineHeight: 1 }}>{s.day}</div>
                    <div style={{ fontSize: '0.65rem', color: '#8b9ab0', letterSpacing: 1 }}>{s.monthYear}</div>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: 2 }}>{s.dow}</div>
                  </div>
                </div>
                {/* Works */}
                <div style={{ padding: '1rem 1.3rem' }}>
                  <ul style={{ listStyle: 'none', marginBottom: '1rem' }}>
                    {s.works.map((w, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.28rem 0', fontSize: '0.78rem', color: w.isWarning ? '#f59e0b' : '#c8d4e3', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <span style={{ color: '#f59e0b', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>›</span>
                        <span style={{ flex: 1 }}>{w.text}</span>
                        {w.isNew && <span style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.5rem', padding: '1px 4px', borderRadius: 3, textTransform: 'uppercase', flexShrink: 0 }}>New</span>}
                      </li>
                    ))}
                  </ul>
                  {/* Costs */}
                  <div style={{ borderTop: '1px solid #1e3355', paddingTop: '0.75rem' }}>
                    {s.costs.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '0.75rem', color: '#8b9ab0' }}>
                        <span>{c.label}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#e2e8f0' }}>{c.value}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0 0.2rem', borderTop: '1px solid #1e3355', marginTop: '0.4rem', fontWeight: 600 }}>
                      <span style={{ fontSize: '0.8rem', color: '#e2e8f0' }}>Total Invoice</span>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", color: '#f59e0b', fontSize: '0.95rem' }}>{s.total}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', padding: '1.5rem', color: '#334155', fontSize: '0.68rem', letterSpacing: 1, borderTop: '1px solid #1e3355' }}>
            Ford Ranger XL 4×4 · Chassis TRABC240012 · GMH Autos, Samabula, Suva, Fiji
          </div>
        </div>
      )}
    </div>
  );
}
