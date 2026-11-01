// LvTS only: approve or remove the characters visitors make for Noqublox
// neighbourhood. Not linked from anywhere; the admin key is what protects it
// (checked by the server, kept in this browser tab only).
import { useCallback, useEffect, useState } from 'react';
import { API, visitorLook, type VisitorCharacter } from '../game/house/neighbourhood.ts';
import { Portrait } from '../game/house/portrait.tsx';

const KEY = 'neighbourhood-admin-key';

export default function NeighbourhoodAdminPage() {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } });
  const [pending, setPending] = useState<VisitorCharacter[] | null>(null);
  const [approved, setApproved] = useState<VisitorCharacter[] | null>(null);
  const [msg, setMsg] = useState('');

  const call = useCallback(async (method: string, path: string) => {
    const res = await fetch(API + path, { method, headers: { Authorization: `Bearer ${key}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
    return data;
  }, [key]);

  const load = useCallback(async (keepMessage = false) => {
    if (!API) { setMsg('The neighbourhood server is switched off in this build.'); return; }
    if (!key) return;
    try {
      const [p, a] = await Promise.all([call('GET', '/admin/pending'), call('GET', '/admin/approved')]);
      setPending(p.characters); setApproved(a.characters); if (!keepMessage) setMsg('');
      try { sessionStorage.setItem(KEY, key); } catch { /* fine */ }
    } catch (e) { setMsg((e as Error).message === 'Failed to fetch' ? "The neighbourhood server can't be reached. Is it deployed?" : (e as Error).message); setPending(null); setApproved(null); }
  }, [call, key]);

  // with a key kept from earlier in this tab, load straight away (after the first paint)
  useEffect(() => { if (!key) return; const t = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(t); }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (path: string, method: string, done: string) => {
    try { await call(method, path); setMsg(done); await load(true); } catch (e) { setMsg((e as Error).message); }
  };

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
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', marginBottom: 6 }}>Neighbourhood characters</h1>
      <p style={{ color: '#64748b', marginBottom: 18 }}>Approve the characters visitors make before anyone else sees them. Check the name is fine for a family site.</p>
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
    </section>
  );
}
