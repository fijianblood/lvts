// LvTS Neighbourhood server: keeps the characters visitors make for Noqublox,
// and runs the shared world where everyone exploring sees each other and
// chats. One Durable Object holds it all: the characters, reports and bans in
// its own SQLite database, and the players' WebSockets (free on the Workers
// Free plan; it sleeps when nobody is connected).
//
// GET    /characters                 approved characters (what the game shows)
// POST   /characters                 { name, look } -> { id, key, status: 'pending' }
// POST   /characters/:id             { key } -> the creator checks their status
// PUT    /characters/:id             { key, name, look } -> change it (a new name is checked again)
// DELETE /characters/:id             { key } -> delete it
// GET    /admin/pending | /admin/approved          (Authorization: Bearer ADMIN_TOKEN)
// POST   /admin/:id/approve | /admin/:id/reject    DELETE /admin/:id
// GET    /admin/reports   DELETE /admin/reports/:id   GET|POST /admin/bans   DELETE /admin/bans/:visitor   GET /admin/online
// GET    /world   (WebSocket)  the shared world: see world.ts for the messages

import { DurableObject } from 'cloudflare:workers';
import { approvedName, handle, isBanned, LIMITS, type BanRow, type ReportRow, type Row, type Status, type Store } from './registry.ts';
import { World, type Conn, type Saved } from './world.ts';

export interface Env {
  REGISTRY: DurableObjectNamespace<Registry>;
  ADMIN_TOKEN?: string;
  /** Comma-separated sites allowed to call the API from a browser. */
  ALLOWED_ORIGINS?: string;
  /** Salt for hashing visitors' IP addresses (the IPs themselves are never stored). */
  VISITOR_SALT?: string;
}

// The site's two homes (GitHub Pages and the "lvts" Worker on Cloudflare), plus local testing.
const DEFAULT_ORIGINS = ['https://fijianblood.github.io', 'https://lvts.lomavatatechfiji.workers.dev', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];

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

    // the shared world: a WebSocket, only from the site itself
    if (url.pathname === '/world') {
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response(JSON.stringify({ error: 'WebSocket only.' }), { status: 426, headers });
      if (!origin || !headers['Access-Control-Allow-Origin']) return new Response(JSON.stringify({ error: 'Not from this site.' }), { status: 403, headers });
      const fwd = new Headers(req.headers);
      fwd.set('X-Visitor', visitor);
      return stub.fetch(new Request(req.url, { headers: fwd }));
    }
    const res = await stub.call(req.method, url.pathname, body, visitor, req.headers.get('Authorization'));
    if (req.method === 'GET' && url.pathname === '/characters' && res.status === 200) headers['Cache-Control'] = 'public, max-age=60';
    return new Response(res.json, { status: res.status, headers });
  },
} satisfies ExportedHandler<Env>;

/** A WebSocket as the world sees it (one per socket, so the world can tell them apart). */
interface SocketConn extends Conn { ws: WebSocket }

export class Registry extends DurableObject<Env> {
  private store: Store;
  private world: World;
  private conns = new WeakMap<WebSocket, SocketConn>();

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    sql.exec(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, reporter TEXT NOT NULL, target TEXT NOT NULL,
      label TEXT NOT NULL, family TEXT, why TEXT NOT NULL, lines TEXT NOT NULL)`);
    sql.exec('CREATE TABLE IF NOT EXISTS bans (visitor TEXT PRIMARY KEY, until TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL)');
    const toReport = (r: Record<string, SqlStorageValue>): ReportRow => ({
      id: String(r.id), createdAt: String(r.created_at), reporter: String(r.reporter), target: String(r.target), label: String(r.label),
      ...(r.family ? { family: String(r.family) } : {}), why: String(r.why), lines: JSON.parse(String(r.lines)),
    });
    const toBan = (r: Record<string, SqlStorageValue>): BanRow => ({ visitor: String(r.visitor), until: String(r.until), reason: String(r.reason), createdAt: String(r.created_at) });
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
      addReport: (r) => { sql.exec('INSERT INTO reports (id, created_at, reporter, target, label, family, why, lines) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', r.id, r.createdAt, r.reporter, r.target, r.label, r.family ?? null, r.why, JSON.stringify(r.lines)); },
      listReports: (n) => sql.exec('SELECT * FROM reports ORDER BY created_at DESC LIMIT ?', n).toArray().map(toReport),
      countReports: () => Number(sql.exec('SELECT COUNT(*) AS n FROM reports').one().n),
      removeReport: (id) => sql.exec('DELETE FROM reports WHERE id = ?', id).rowsWritten > 0,
      ban: (b) => { sql.exec('INSERT INTO bans (visitor, until, reason, created_at) VALUES (?, ?, ?, ?) ON CONFLICT (visitor) DO UPDATE SET until = excluded.until, reason = excluded.reason, created_at = excluded.created_at', b.visitor, b.until, b.reason, b.createdAt); },
      unban: (v) => sql.exec('DELETE FROM bans WHERE visitor = ?', v).rowsWritten > 0,
      listBans: (now) => { sql.exec('DELETE FROM bans WHERE until <= ?', now); return sql.exec('SELECT * FROM bans ORDER BY created_at DESC').toArray().map(toBan); },
    };

    // the shared world; "ping" gets "pong" from the platform, without waking it up
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.world = new World({
      now: () => Date.now(),
      random,
      approvedName: (id, key) => approvedName(this.store, sha256, id, key),
      isBanned: (v) => isBanned(this.store, v, new Date()),
      report: (r) => {
        if (this.store.countReports() >= LIMITS.maxReports) return false;
        this.store.addReport({ id: random(9), createdAt: new Date().toISOString(), ...r });
        return true;
      },
      later: (fn, ms) => { setTimeout(fn, ms); },
      lastPing: (c) => this.ctx.getWebSocketAutoResponseTimestamp((c as SocketConn).ws)?.getTime() ?? null,
    });
    // after a sleep, everyone still connected is put back where they were
    for (const ws of ctx.getWebSockets()) this.world.restore(this.conn(ws), ws.deserializeAttachment() as Saved);
  }

  private conn(ws: WebSocket): SocketConn {
    let c = this.conns.get(ws);
    if (!c) {
      c = {
        ws,
        send: (s) => ws.send(s),
        close: (code, reason) => { try { ws.close(code, reason); } catch { /* already closed */ } },
        save: (s) => ws.serializeAttachment(s),
      };
      this.conns.set(ws, c);
    }
    return c;
  }

  /** A player arriving (the Worker has checked it's a WebSocket from the site, and added the hashed visitor id). */
  async fetch(req: Request): Promise<Response> {
    const visitor = req.headers.get('X-Visitor') ?? '';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server);
    this.world.connect(this.conn(server), visitor);
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message === 'string') await this.world.message(this.conn(ws), message);
  }

  /** The player closed the connection: answer their close (so it ends cleanly), and they're out of the world. */
  async webSocketClose(ws: WebSocket) {
    try { ws.close(1000, 'bye'); } catch { /* already closed */ }
    this.world.leave(this.conn(ws));
  }

  async webSocketError(ws: WebSocket) { this.world.leave(this.conn(ws)); }

  /** Called by the Worker for every request; answers with a status and a JSON string. */
  async call(method: string, path: string, body: unknown, visitor: string, authorization: string | null): Promise<{ status: number; json: string }> {
    const res = await handle(method, path, body, {
      store: this.store, now: new Date(), random, hash: sha256, visitor, adminToken: this.env.ADMIN_TOKEN, authorization,
      online: () => this.world.online(), onBan: (v) => this.world.kick(v),
    });
    return { status: res.status, json: JSON.stringify(res.body) };
  }
}
