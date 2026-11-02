// The character registry: every character a visitor has made, and whether it
// has been approved yet. Plain logic over a tiny storage interface, so it can
// run inside the Durable Object (SQLite) or in a test (in memory).

import { cleanLook, cleanName, type VisitorCharacter, type VisitorLook } from './rules.ts';

export type Status = 'pending' | 'approved';
export interface Row { id: string; name: string; look: VisitorLook; status: Status; createdAt: string; keyHash: string }
/** A player reported from the shared world, with their last lines of chat. `target` and `reporter` are hashed visitor ids. */
export interface ReportRow { id: string; createdAt: string; reporter: string; target: string; label: string; family?: string; why: string; lines: { at: string; text: string }[] }
/** A visitor kept out of the shared world until `until` (ISO time). */
export interface BanRow { visitor: string; until: string; reason: string; createdAt: string }

export interface Store {
  insert(row: Row): void;
  get(id: string): Row | undefined;
  list(status: Status, limit: number): Row[];
  count(status: Status): number;
  setStatus(id: string, status: Status): boolean;
  remove(id: string): boolean;
  update(id: string, name: string, look: VisitorLook, status: Status): boolean;
  /** How many times this (hashed) visitor has created a character today; bumps the count. */
  bump(visitor: string, day: string): number;
  addReport(r: ReportRow): void;
  listReports(limit: number): ReportRow[];
  countReports(): number;
  removeReport(id: string): boolean;
  ban(b: BanRow): void;
  unban(visitor: string): boolean;
  /** Bans still running at `now` (ISO time). */
  listBans(now: string): BanRow[];
}

export const LIMITS = {
  /** Characters one visitor can make per day. */
  perVisitorPerDay: 3,
  /** Stop taking new ones while this many are waiting for approval. */
  maxPending: 300,
  /** Approved characters sent to the game (most recent first). */
  publicList: 60,
  /** Stop keeping new reports while this many are waiting. */
  maxReports: 500,
  /** Longest ban, in days. */
  maxBanDays: 365,
};

const VISITOR_RE = /^[0-9a-f]{24}$/;

export interface Result { status: number; body: unknown }
const ok = (body: unknown, status = 200): Result => ({ status, body });
const err = (status: number, error: string): Result => ({ status, body: { error } });

const pub = (r: Row): VisitorCharacter => ({ id: r.id, name: r.name, look: r.look, createdAt: r.createdAt });

export interface Ctx {
  store: Store;
  now: Date;
  /** A random id and a random secret, from the platform. */
  random: (bytes: number) => string;
  hash: (s: string) => Promise<string>;
  /** Hashed visitor (from their IP and a salt), for the daily limit. */
  visitor: string;
  adminToken: string | undefined;
  authorization: string | null;
  /** The shared world: who's in it now, and removing a visitor LvTS has just banned. */
  online?: () => unknown[];
  onBan?: (visitor: string) => void;
}

/** The name of a visitor's own character, if the id and secret key match and LvTS has approved it. */
export async function approvedName(store: Store, hash: (s: string) => Promise<string>, id: string, key: string): Promise<string | null> {
  const row = store.get(id);
  if (!row || row.status !== 'approved' || !key || !sameText(await hash(key), row.keyHash)) return null;
  return row.name;
}

/** Is this visitor banned from the shared world right now? */
export const isBanned = (store: Store, visitor: string, now: Date) => store.listBans(now.toISOString()).some((b) => b.visitor === visitor);

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const isAdmin = (c: Ctx) => !!c.adminToken && c.adminToken.length >= 16 && !!c.authorization && sameText(c.authorization, `Bearer ${c.adminToken}`);

/** Handle one API call. `path` is like "/characters" or "/admin/abc123/approve". */
export async function handle(method: string, path: string, body: unknown, c: Ctx): Promise<Result> {
  const parts = path.split('/').filter(Boolean);

  // the game: everyone's approved characters
  if (method === 'GET' && path === '/characters') return ok({ characters: c.store.list('approved', LIMITS.publicList).map(pub) });

  // a visitor makes their character
  if (method === 'POST' && path === '/characters') {
    const b = (body ?? {}) as Record<string, unknown>;
    const name = cleanName(b.name), look = cleanLook(b.look);
    if (!name) return err(400, 'Please use a first name or nickname: 2 to 16 letters, no numbers or symbols.');
    if (!look) return err(400, 'That character look is not allowed.');
    if (c.store.count('pending') >= LIMITS.maxPending) return err(503, 'Lots of new characters are waiting to be checked. Please try again tomorrow.');
    if (c.store.bump(c.visitor, c.now.toISOString().slice(0, 10)) > LIMITS.perVisitorPerDay) return err(429, 'You have made enough characters for today. Try again tomorrow.');
    const id = c.random(9), key = c.random(18);
    c.store.insert({ id, name, look, status: 'pending', createdAt: c.now.toISOString(), keyHash: await c.hash(key) });
    return ok({ id, key, status: 'pending' }, 201);
  }

  // the creator checks on, changes or deletes their own character (with the secret key they were given)
  if (parts[0] === 'characters' && parts.length === 2) {
    const row = c.store.get(parts[1]);
    const b = (body ?? {}) as Record<string, unknown>;
    const key = typeof b.key === 'string' ? b.key : '';
    if (!row || !key || !sameText(await c.hash(key), row.keyHash)) return err(404, 'Character not found.');
    if (method === 'POST') return ok({ id: row.id, status: row.status, name: row.name, look: row.look });
    if (method === 'PUT') {
      const name = cleanName(b.name), look = cleanLook(b.look);
      if (!name || !look) return err(400, 'That name or look is not allowed.');
      // a new name has to be checked again; a new look alone keeps an approved character approved
      const status: Status = name === row.name ? row.status : 'pending';
      c.store.update(row.id, name, look, status);
      return ok({ id: row.id, status });
    }
    if (method === 'DELETE') { c.store.remove(row.id); return ok({ deleted: true }); }
  }

  // LvTS: approve or remove characters
  if (parts[0] === 'admin') {
    if (!isAdmin(c)) return err(401, 'Admin key needed.');
    if (method === 'GET' && parts[1] === 'pending') return ok({ characters: c.store.list('pending', 200).map(pub) });
    if (method === 'GET' && parts[1] === 'approved') return ok({ characters: c.store.list('approved', 500).map(pub) });
    if (method === 'POST' && parts.length === 3 && parts[2] === 'approve') return c.store.setStatus(parts[1], 'approved') ? ok({ approved: parts[1] }) : err(404, 'Not found.');
    // the shared world: reports, bans, and who's in it now
    if (method === 'GET' && path === '/admin/reports') return ok({ reports: c.store.listReports(200) });
    if (method === 'DELETE' && parts[1] === 'reports' && parts.length === 3) return c.store.removeReport(parts[2]) ? ok({ dismissed: parts[2] }) : err(404, 'Not found.');
    if (method === 'GET' && path === '/admin/bans') return ok({ bans: c.store.listBans(c.now.toISOString()) });
    if (method === 'POST' && path === '/admin/bans') {
      const b = (body ?? {}) as Record<string, unknown>;
      const visitor = typeof b.visitor === 'string' ? b.visitor : '';
      const days = typeof b.days === 'number' && Number.isInteger(b.days) ? b.days : 0;
      if (!VISITOR_RE.test(visitor)) return err(400, 'Unknown visitor.');
      if (days < 1 || days > LIMITS.maxBanDays) return err(400, `Ban for 1 to ${LIMITS.maxBanDays} days.`);
      const reason = typeof b.reason === 'string' ? b.reason.replace(/[\p{Cc}]/gu, '').slice(0, 120) : '';
      const until = new Date(c.now.getTime() + days * 86_400_000).toISOString();
      c.store.ban({ visitor, until, reason, createdAt: c.now.toISOString() });
      c.onBan?.(visitor);
      return ok({ banned: visitor, until });
    }
    if (method === 'DELETE' && parts[1] === 'bans' && parts.length === 3) return c.store.unban(parts[2]) ? ok({ unbanned: parts[2] }) : err(404, 'Not found.');
    if (method === 'GET' && path === '/admin/online') return ok({ players: c.online?.() ?? [] });
    if ((method === 'POST' && parts.length === 3 && parts[2] === 'reject') || (method === 'DELETE' && parts.length === 2)) return c.store.remove(parts[1]) ? ok({ removed: parts[1] }) : err(404, 'Not found.');
  }

  return err(404, 'Not found.');
}

/** An in-memory store, for tests. */
export function memoryStore(): Store {
  const rows = new Map<string, Row>();
  const visits = new Map<string, number>();
  const reports = new Map<string, ReportRow>();
  const bans = new Map<string, BanRow>();
  const byNewest = (s: Status) => [...rows.values()].filter((r) => r.status === s).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    insert: (r) => { rows.set(r.id, { ...r }); },
    get: (id) => rows.get(id),
    list: (s, n) => byNewest(s).slice(0, n),
    count: (s) => byNewest(s).length,
    setStatus: (id, s) => { const r = rows.get(id); if (!r) return false; r.status = s; return true; },
    remove: (id) => rows.delete(id),
    update: (id, name, look, s) => { const r = rows.get(id); if (!r) return false; Object.assign(r, { name, look, status: s }); return true; },
    bump: (v, day) => { const k = `${v}|${day}`; const n = (visits.get(k) ?? 0) + 1; visits.set(k, n); return n; },
    addReport: (r) => { reports.set(r.id, { ...r }); },
    listReports: (n) => [...reports.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, n),
    countReports: () => reports.size,
    removeReport: (id) => reports.delete(id),
    ban: (b) => { bans.set(b.visitor, { ...b }); },
    unban: (v) => bans.delete(v),
    listBans: (now) => [...bans.values()].filter((b) => b.until > now).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
}
