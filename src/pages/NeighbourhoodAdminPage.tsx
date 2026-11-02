// LvTS only: approve or remove the characters visitors make for Noqublox, and
// look after the shared world (who's in it now, reports, bans). Not linked from
// anywhere; the admin key is what protects it (checked by the server, kept in
// this browser tab only).
import { useCallback, useEffect, useState } from 'react';
import { API, visitorLook, type VisitorCharacter } from '../game/house/neighbourhood.ts';
import { Portrait } from '../game/house/portrait.tsx';
import { characterById } from '../game/house/characters.ts';
import type { BanRow, ReportRow } from '../../workers/neighbourhood/src/registry.ts';

interface OnlineRow { label: string; family?: string; visitor: string; since: string }
const WHY: Record<string, string> = { rude: 'Rude or mean', personal: 'Personal details', spam: 'Spamming', other: 'Something else' };
const fijiTime = (iso: string) => new Date(iso).toLocaleString('en-FJ', { timeZone: 'Pacific/Fiji' });
/** Who someone was playing as, for the lists. */
const asWho = (label: string, family?: string) => (family ? `${label} (as ${characterById(family).name})` : label);

const KEY = 'neighbourhood-admin-key';

export default function NeighbourhoodAdminPage() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } });
  const [pending, setPending] = useState<VisitorCharacter[] | null>(null);
  const [approved, setApproved] = useState<VisitorCharacter[] | null>(null);
  const [msg, setMsg] = useState('');
  const [online, setOnline] = useState<OnlineRow[] | null>(null);
  const [reports, setReports] = useState<ReportRow[] | null>(null);
  const [bans, setBans] = useState<BanRow[] | null>(null);

  const call = useCallback(async (method: string, path: string, body?: unknown) => {
    const res = await fetch(API + path, {
      method,
      headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
    return data;
  }, [key]);

  const load = useCallback(async (keepMessage = false) => {
    if (!API) { setMsg('The neighbourhood server is switched off in this build.'); return; }
    if (!key) return;
    try {
      const [p, a, o, r, b] = await Promise.all([call('GET', '/admin/pending'), call('GET', '/admin/approved'), call('GET', '/admin/online'), call('GET', '/admin/reports'), call('GET', '/admin/bans')]);
      setPending(p.characters); setApproved(a.characters); setOnline(o.players); setReports(r.reports); setBans(b.bans); if (!keepMessage) setMsg('');
      try { sessionStorage.setItem(KEY, key); } catch { /* fine */ }
    } catch (e) { setMsg((e as Error).message === 'Failed to fetch' ? "The neighbourhood server can't be reached. Is it deployed?" : (e as Error).message); setPending(null); setApproved(null); setOnline(null); setReports(null); setBans(null); }
  }, [call, key]);

  // with a key kept from earlier in this tab, load straight away (after the first paint)
  useEffect(() => { if (!key) return; const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (path: string, method: string, done: string, body?: unknown) => {
    try { await call(method, path, body); setMsg(done); await load(true); } catch (e) { setMsg((e as Error).message); }
  };
  /** Keep a visitor out of the shared world (they're removed straight away if they're in it). */
  const ban = (visitor: string, who: string, days: number, reason: string) => {
    if (window.confirm(`Keep ${who} out of the shared world for ${days} day${days === 1 ? '' : 's'}?`)) void act('/admin/bans', 'POST', `${who} is out of the shared world for ${days} day${days === 1 ? '' : 's'}.`, { visitor, days, reason });
  };
  const banButtons = (visitor: string, who: string, reason: string) => (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {btn('Ban 1 day', () => ban(visitor, who, 1, reason), '#b45309')}
      {btn('Ban 7 days', () => ban(visitor, who, 7, reason), '#c2410c')}
      {btn('Ban 30 days', () => ban(visitor, who, 30, reason), '#b91c1c')}
    </div>
  );
  const h2: React.CSSProperties = { fontWeight: 800, fontSize: '1.2rem', margin: '22px 0 10px' };
  const row: React.CSSProperties = { padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff' };

  const card = (c: VisitorCharacter, actions: React.ReactNode) => (
    <li key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff' }}>
      <Portrait look={visitorLook(c.look)} size={56} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{c.name}</div>
        <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{c.look.size} · made {new Date(c.createdAt).toLocaleString('en-FJ', { timeZone: 'Pacific/Fiji' })}</div>
      </div>
      {actions}
    </li>
  );
  const btn = (label: string, onClick: () => void, color: string) => (
    <button type="button" onClick={onClick} style={{ background: color, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontWeight: 700, cursor: 'pointer' }}>{label}</button>
  );

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: '120px 1.25rem 120px', fontFamily: "'Space Grotesk', sans-serif", color: '#0f172a' }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', marginBottom: 6 }}>Noqublox admin</h1>
      <p style={{ color: '#64748b', marginBottom: 18 }}>Approve the characters visitors make before anyone else sees them (check the name is fine for a family site), and look after the shared world: reports, who's in it, and bans.</p>
      <form onSubmit={(e) => { e.preventDefault(); void load(); }} style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key" autoComplete="current-password" style={{ flex: '1 1 240px', padding: '10px 12px', borderRadius: 10, border: '2px solid #e2e8f0', fontSize: '1rem' }} />
        <button type="submit" style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}>Load</button>
      </form>
      {msg && <p role="status" style={{ background: '#f1f5f9', padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>{msg}</p>}
      {pending && (
        <>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', margin: '10px 0' }}>Waiting for approval ({pending.length})</h2>
          {pending.length === 0 && <p style={{ color: '#64748b' }}>Nothing waiting.</p>}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {pending.map((c) => card(c, <div style={{ display: 'flex', gap: 6 }}>{btn('Approve', () => void act(`/admin/${c.id}/approve`, 'POST', `Approved ${c.name}.`), '#16a34a')}{btn('Reject', () => void act(`/admin/${c.id}/reject`, 'POST', `Rejected ${c.name}.`), '#dc2626')}</div>))}
          </ul>
        </>
      )}
      {approved && (
        <>
          <h2 style={{ fontWeight: 800, fontSize: '1.2rem', margin: '22px 0 10px' }}>In the neighbourhood ({approved.length})</h2>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {approved.map((c) => card(c, btn('Remove', () => { if (window.confirm(`Remove ${c.name} from the neighbourhood?`)) void act(`/admin/${c.id}`, 'DELETE', `Removed ${c.name}.`); }, '#64748b')))}
          </ul>
        </>
      )}
      {reports && (
        <>
          <h2 style={h2}>Reports from the shared world ({reports.length})</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 10 }}>Each report keeps the reported player's last lines of chat. Messages the filter blocked are shown only as "not sent", never what they said. Ban them, or dismiss the report if it's nothing.</p>
          {reports.length === 0 && <p style={{ color: '#64748b' }}>No reports.</p>}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {reports.map((r) => (
              <li key={r.id} style={row}>
                <div style={{ fontWeight: 700 }}>{asWho(r.label, r.family)} <span style={{ color: '#b91c1c', fontWeight: 600 }}>· {WHY[r.why] ?? r.why}</span></div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 6 }}>Reported {fijiTime(r.createdAt)}</div>
                {r.lines.length
                  ? <ol style={{ margin: '0 0 8px', paddingLeft: 18, fontSize: '0.88rem', lineHeight: 1.5 }}>{r.lines.map((l, i) => <li key={i}><span style={{ color: '#94a3b8' }}>{new Date(l.at).toLocaleTimeString('en-FJ', { timeZone: 'Pacific/Fiji', hour: 'numeric', minute: '2-digit' })}</span> {l.text}</li>)}</ol>
                  : <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 8px' }}>They hadn't said anything.</p>}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {banButtons(r.target, r.label, `Reported: ${WHY[r.why] ?? r.why}`)}
                  {btn('Dismiss', () => void act(`/admin/reports/${r.id}`, 'DELETE', 'Report dismissed.'), '#64748b')}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {online && (
        <>
          <h2 style={h2}>In the shared world now ({online.length})</h2>
          {online.length === 0 && <p style={{ color: '#64748b' }}>Nobody is exploring right now.</p>}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {online.map((o) => (
              <li key={o.visitor + o.since} style={{ ...row, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700 }}>{asWho(o.label, o.family)}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Since {fijiTime(o.since)}</div>
                </div>
                {banButtons(o.visitor, o.label, 'Removed from the shared world by LvTS')}
              </li>
            ))}
          </ul>
        </>
      )}
      {bans && (
        <>
          <h2 style={h2}>Banned from the shared world ({bans.length})</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 10 }}>Visitors are told apart by a scrambled code made from their internet address, not by name, so a ban can also keep out others on the same Wi-Fi, and someone can get round it on a different connection.</p>
          {bans.length === 0 && <p style={{ color: '#64748b' }}>Nobody is banned.</p>}
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 8 }}>
            {bans.map((b) => (
              <li key={b.visitor} style={{ ...row, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontWeight: 700 }}>Visitor {b.visitor.slice(0, 6)}</div>
                  <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{b.reason || 'No reason given'} · until {fijiTime(b.until)}</div>
                </div>
                {btn('Unban', () => void act(`/admin/bans/${b.visitor}`, 'DELETE', 'Unbanned.'), '#2563eb')}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
