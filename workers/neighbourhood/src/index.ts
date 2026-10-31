// LvTS Neighbourhood server: keeps the characters visitors make for the House
// Hunt neighbourhood. One Durable Object holds them all in its own SQLite
// database (free on the Workers Free plan).
//
// GET    /characters                 approved characters (what the game shows)
// POST   /characters                 { name, look } -> { id, key, status: 'pending' }
// POST   /characters/:id             { key } -> the creator checks their status
// PUT    /characters/:id             { key, name, look } -> change it (a new name is checked again)
// DELETE /characters/:id             { key } -> delete it
// GET    /admin/pending | /admin/approved          (Authorization: Bearer ADMIN_TOKEN)
// POST   /admin/:id/approve | /admin/:id/reject    DELETE /admin/:id

import { DurableObject } from 'cloudflare:workers';
import { handle, type Row, type Status, type Store } from './registry.ts';

export interface Env {
  REGISTRY: DurableObjectNamespace<Registry>;
  ADMIN_TOKEN?: string;
  /** Comma-separated sites allowed to call the API from a browser. */
  ALLOWED_ORIGINS?: string;
  /** Salt for hashing visitors' IP addresses (the IPs themselves are never stored). */
  VISITOR_SALT?: string;
}

const DEFAULT_ORIGINS = ['https://fijianblood.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];

function cors(origin: string | null, env: Env): Record<string, string> {
  const allowed = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()) : DEFAULT_ORIGINS;
  const h: Record<string, string> = { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '86400', Vary: 'Origin' };
  if (origin && allowed.includes(origin)) h['Access-Control-Allow-Origin'] = origin;
  return h;
}

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (s: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const random = (bytes: number) => {
  const a = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...a)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin');
    const headers: Record<string, string> = { ...cors(origin, env), 'Content-Type': 'application/json; charset=utf-8' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    const url = new URL(req.url);
    if (url.pathname === '/' && req.method === 'GET') return new Response(JSON.stringify({ ok: true, service: 'lvts-neighbourhood' }), { headers });

    let body: unknown = null;
    if (req.method !== 'GET') {
      const text = await req.text();
      if (text.length > 4000) return new Response(JSON.stringify({ error: 'Too big.' }), { status: 413, headers });
      try { body = text ? JSON.parse(text) : null; } catch { return new Response(JSON.stringify({ error: 'Bad JSON.' }), { status: 400, headers }); }
    }
    const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
    const visitor = (await sha256(`${env.VISITOR_SALT ?? 'lvts'}|${ip}`)).slice(0, 24);
    const stub = env.REGISTRY.get(env.REGISTRY.idFromName('neighbourhood'));
    const res = await stub.call(req.method, url.pathname, body, visitor, req.headers.get('Authorization'));
    if (req.method === 'GET' && url.pathname === '/characters' && res.status === 200) headers['Cache-Control'] = 'public, max-age=60';
    return new Response(res.json, { status: res.status, headers });
  },
} satisfies ExportedHandler<Env>;

export class Registry extends DurableObject<Env> {
  private store: Store;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, look TEXT NOT NULL, status TEXT NOT NULL,
      created_at TEXT NOT NULL, key_hash TEXT NOT NULL)`);
    sql.exec('CREATE INDEX IF NOT EXISTS by_status ON characters (status, created_at)');
    sql.exec('CREATE TABLE IF NOT EXISTS visits (visitor TEXT NOT NULL, day TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (visitor, day))');
    const toRow = (r: Record<string, SqlStorageValue>): Row => ({
      id: String(r.id), name: String(r.name), look: JSON.parse(String(r.look)), status: String(r.status) as Status, createdAt: String(r.created_at), keyHash: String(r.key_hash),
    });
    this.store = {
      insert: (r) => { sql.exec('INSERT INTO characters (id, name, look, status, created_at, key_hash) VALUES (?, ?, ?, ?, ?, ?)', r.id, r.name, JSON.stringify(r.look), r.status, r.createdAt, r.keyHash); },
      get: (id) => { const rows = sql.exec('SELECT * FROM characters WHERE id = ?', id).toArray(); return rows.length ? toRow(rows[0]) : undefined; },
      list: (s, n) => sql.exec('SELECT * FROM characters WHERE status = ? ORDER BY created_at DESC LIMIT ?', s, n).toArray().map(toRow),
      count: (s) => Number(sql.exec('SELECT COUNT(*) AS n FROM characters WHERE status = ?', s).one().n),
      setStatus: (id, s) => sql.exec('UPDATE characters SET status = ? WHERE id = ?', s, id).rowsWritten > 0,
      remove: (id) => sql.exec('DELETE FROM characters WHERE id = ?', id).rowsWritten > 0,
      update: (id, name, look, s) => sql.exec('UPDATE characters SET name = ?, look = ?, status = ? WHERE id = ?', name, JSON.stringify(look), s, id).rowsWritten > 0,
      bump: (v, day) => {
        sql.exec('DELETE FROM visits WHERE day < ?', day);
        sql.exec('INSERT INTO visits (visitor, day, n) VALUES (?, ?, 1) ON CONFLICT (visitor, day) DO UPDATE SET n = n + 1', v, day);
        return Number(sql.exec('SELECT n FROM visits WHERE visitor = ? AND day = ?', v, day).one().n);
      },
    };
  }

  /** Called by the Worker for every request; answers with a status and a JSON string. */
  async call(method: string, path: string, body: unknown, visitor: string, authorization: string | null): Promise<{ status: number; json: string }> {
    const res = await handle(method, path, body, {
      store: this.store, now: new Date(), random, hash: sha256, visitor, adminToken: this.env.ADMIN_TOKEN, authorization,
    });
    return { status: res.status, json: JSON.stringify(res.body) };
  }
}
