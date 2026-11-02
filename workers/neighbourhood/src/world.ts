// Noqublox's shared world: everyone exploring Raiwai at the same time, seeing
// each other move and chatting. Plain logic over a tiny connection interface,
// so it runs inside the Durable Object (WebSockets) or in a test (fakes).
//
// The messages (JSON). From a player:
//   { t: 'join', who: { kind: 'family', id } | { kind: 'mine', look, id?, key? }, p: [x, y, z, yaw] }
//   { t: 'm', p: [x, y, z, yaw] }          where I am now (a few times a second while moving)
//   { t: 'c', text }                       say something
//   { t: 'report', id, why }               report a player to LvTS
// From the world:
//   { t: 'welcome', you, label, max, players: [Pub] }    { t: 'join', p: Pub }    { t: 'leave', id }
//   { t: 's', m: [[id, x, y, z, yaw], ...] }             everyone who moved since last time
//   { t: 'c', id, text }    { t: 'no', why, text }    { t: 'muted', until }    { t: 'reported', id }
// "ping" is answered with "pong" by the platform without waking the world.

import { cleanLook, type VisitorLook } from './rules.ts';
import { CHAT, CHAT_WHY, cleanChat } from './chat.ts';

export const WORLD = {
  /** Players in the world at once; anyone after that is told it's full and plays on their own. */
  maxPlayers: 40,
  /** How often moves are sent out (ms). */
  flushMs: 150,
  /** Moves closer together than this from one player are dropped (ms). */
  minMoveMs: 90,
  /** More messages than this in a second and the connection is closed. */
  maxPerSecond: 25,
  /** A player who hasn't been heard from (not even a ping) for this long is dropped (ms). */
  idleMs: 120_000,
  /** A connection that hasn't joined within this long is closed (ms). Generous: a slow phone may still be busy drawing. */
  joinMs: 30_000,
  /** Lines of each player's chat kept (in memory only) for a report. */
  history: 20,
  /** One report per reporter per player in this long (ms). */
  reportGapMs: 10 * 60_000,
} as const;

/** Close codes the game understands. */
export const CLOSE = { full: 4000, banned: 4001, badJoin: 4002, kicked: 4003, flood: 4004, idle: 4005 } as const;

export const REPORT_WHY = ['rude', 'personal', 'spam', 'other'] as const;
export type ReportWhy = (typeof REPORT_WHY)[number];

/** A player as everyone else sees them. `f` is the family member they play as; `l` their own character's look. */
export interface Pub { id: string; n: string; f?: string; l?: VisitorLook; p: [number, number, number, number] }

/** What's kept with each connection, so the world can be rebuilt after the Durable Object sleeps. */
export interface Saved {
  visitor: string;
  joinedAt: number;
  player?: { id: string; num: number; label: string; family?: string; look?: VisitorLook; p: [number, number, number, number]; mutedUntil: number };
}

/** One connection, as the world sees it (a WebSocket in the Durable Object; a fake in tests). */
export interface Conn {
  send(msg: string): void;
  close(code: number, reason: string): void;
  save(s: Saved): void;
}

export interface ReportIn { reporter: string; target: string; label: string; family?: string; why: ReportWhy; lines: { at: string; text: string }[] }

export interface Hooks {
  now(): number;
  random(bytes: number): string;
  /** The name of a visitor's own character, if the id and key are right and LvTS has approved it. */
  approvedName(id: string, key: string): Promise<string | null>;
  isBanned(visitor: string): boolean;
  /** Keep a report for LvTS; false if too many are waiting already. */
  report(r: ReportIn): boolean;
  /** Call `fn` once in `ms` (the moves going out). */
  later(fn: () => void, ms: number): void;
  /** When the platform last answered this connection's "ping" (ms), if it has. */
  lastPing?(c: Conn): number | null;
}

interface Live {
  conn: Conn;
  saved: Saved;
  lastSeen: number;
  lastMove: number;
  second: number;
  inSecond: number;
  chats: number[];
  strikes: number[];
  history: { at: string; text: string }[];
}

const FAMILY_ID = /^[a-z][a-z-]{1,23}$/;
const round = (v: number, d = 100) => Math.round(v * d) / d;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** A position from a message, kept inside Raiwai and rounded; null if it isn't one. */
export function cleanPos(raw: unknown): [number, number, number, number] | null {
  if (!Array.isArray(raw) || raw.length !== 4 || !raw.every((v) => typeof v === 'number' && Number.isFinite(v))) return null;
  const [x, y, z, r] = raw as number[];
  const yaw = Math.atan2(Math.sin(r), Math.cos(r));
  return [round(clamp(x, -120, 320)), round(clamp(y, -30, 60)), round(clamp(z, -120, 140)), round(yaw, 1000)];
}

const pub = (s: Saved): Pub => {
  const p = s.player!;
  return { id: p.id, n: p.label, ...(p.family ? { f: p.family } : {}), ...(p.look ? { l: p.look } : {}), p: p.p };
};

export class World {
  private live = new Map<Conn, Live>();
  private moved = new Set<Conn>();
  private flushing = false;
  private reported = new Map<string, number>();
  private hooks: Hooks;

  constructor(hooks: Hooks) { this.hooks = hooks; }

  /** Players in the world now. */
  get players(): Pub[] { return [...this.live.values()].filter((l) => l.saved.player).map((l) => pub(l.saved)); }
  /** For the admin page: who's in the world now, with their (hashed) visitor id. */
  online(): { label: string; family?: string; visitor: string; since: string }[] {
    return [...this.live.values()].filter((l) => l.saved.player).map((l) => ({ label: l.saved.player!.label, family: l.saved.player!.family, visitor: l.saved.visitor, since: new Date(l.saved.joinedAt).toISOString() }));
  }

  /** A new connection (not in the world until it sends 'join'). */
  connect(conn: Conn, visitor: string) {
    if (this.hooks.isBanned(visitor)) { conn.close(CLOSE.banned, 'banned'); return; }
    const saved: Saved = { visitor, joinedAt: this.hooks.now() };
    conn.save(saved);
    this.track(conn, saved);
  }

  /** A connection brought back after the Durable Object woke up. */
  restore(conn: Conn, saved: Saved) {
    if (!saved || typeof saved.visitor !== 'string') { conn.close(CLOSE.badJoin, 'lost'); return; }
    this.track(conn, saved);
  }

  private track(conn: Conn, saved: Saved) {
    const now = this.hooks.now();
    this.live.set(conn, { conn, saved, lastSeen: now, lastMove: 0, second: 0, inSecond: 0, chats: [], strikes: [], history: [] });
  }

  /** The connection closed (or errored). */
  leave(conn: Conn) {
    const l = this.live.get(conn);
    if (!l) return;
    this.live.delete(conn);
    this.moved.delete(conn);
    if (l.saved.player) this.broadcast({ t: 'leave', id: l.saved.player.id });
  }

  /** LvTS banned this visitor: out of the world now. */
  kick(visitor: string) {
    for (const l of [...this.live.values()]) if (l.saved.visitor === visitor) { l.conn.close(CLOSE.kicked, 'removed by LvTS'); this.leave(l.conn); }
  }

  async message(conn: Conn, raw: string) {
    const l = this.live.get(conn);
    if (!l) return;
    const now = this.hooks.now();
    l.lastSeen = now;
    // flood guard
    const sec = Math.floor(now / 1000);
    if (sec !== l.second) { l.second = sec; l.inSecond = 0; }
    if (++l.inSecond > WORLD.maxPerSecond) { conn.close(CLOSE.flood, 'too many messages'); this.leave(conn); return; }
    if (raw.length > 2000) return;
    let m: Record<string, unknown>;
    try { m = JSON.parse(raw) as Record<string, unknown>; } catch { return; }
    if (!m || typeof m !== 'object') return;

    if (m.t === 'join') { await this.join(l, m); return; }
    const p = l.saved.player;
    if (!p) return;
    if (m.t === 'm') {
      if (now - l.lastMove < WORLD.minMoveMs) return;
      const pos = cleanPos(m.p);
      if (!pos) return;
      l.lastMove = now;
      p.p = pos;
      this.moved.add(conn);
      this.scheduleFlush();
      return;
    }
    if (m.t === 'c') { this.chat(l, m.text); return; }
    if (m.t === 'report') { this.report(l, m.id, m.why); return; }
  }

  private async join(l: Live, m: Record<string, unknown>) {
    if (l.saved.player) return;
    const now = this.hooks.now();
    if (this.hooks.isBanned(l.saved.visitor)) { l.conn.close(CLOSE.banned, 'banned'); this.leave(l.conn); return; }
    this.sweep(now);   // make room: anyone gone quiet is dropped before deciding the world is full
    if (this.players.length >= WORLD.maxPlayers) { l.conn.send(JSON.stringify({ t: 'full', max: WORLD.maxPlayers })); l.conn.close(CLOSE.full, 'full'); this.leave(l.conn); return; }
    const pos = cleanPos(m.p);
    const who = (m.who ?? {}) as Record<string, unknown>;
    if (!pos) { l.conn.close(CLOSE.badJoin, 'bad join'); this.leave(l.conn); return; }
    let family: string | undefined, look: VisitorLook | undefined, name: string | null = null;
    if (who.kind === 'family' && typeof who.id === 'string' && FAMILY_ID.test(who.id)) family = who.id;
    else if (who.kind === 'mine') {
      look = cleanLook(who.look) ?? undefined;
      if (!look) { l.conn.close(CLOSE.badJoin, 'bad look'); this.leave(l.conn); return; }
      // only a name LvTS has approved is shown; anyone else is "Visitor 12"
      if (typeof who.id === 'string' && typeof who.key === 'string' && who.id.length < 40 && who.key.length < 80) name = await this.hooks.approvedName(who.id, who.key);
    } else { l.conn.close(CLOSE.badJoin, 'bad join'); this.leave(l.conn); return; }
    if (!this.live.has(l.conn) || l.saved.player) return;   // left (or joined twice) while we were checking the name
    if (this.players.length >= WORLD.maxPlayers) { l.conn.send(JSON.stringify({ t: 'full', max: WORLD.maxPlayers })); l.conn.close(CLOSE.full, 'full'); this.leave(l.conn); return; }
    const num = this.freeNumber();
    const label = name ?? `Visitor ${num}`;
    const id = this.hooks.random(6);
    l.saved.player = { id, num, label, family, look, p: pos, mutedUntil: 0 };
    l.saved.joinedAt = now;
    l.conn.save(l.saved);
    l.conn.send(JSON.stringify({ t: 'welcome', you: id, label, max: WORLD.maxPlayers, chat: CHAT, players: this.players.filter((x) => x.id !== id) }));
    this.broadcast({ t: 'join', p: pub(l.saved) }, l.conn);
  }

  private freeNumber(): number {
    const used = new Set([...this.live.values()].map((l) => l.saved.player?.num).filter((n) => n !== undefined));
    for (let n = 1; n < 1000; n++) if (!used.has(n)) return n;
    return 1000;
  }

  private chat(l: Live, raw: unknown) {
    const p = l.saved.player!;
    const now = this.hooks.now();
    if (p.mutedUntil > now) { l.conn.send(JSON.stringify({ t: 'muted', until: p.mutedUntil })); return; }
    l.chats = l.chats.filter((t) => now - t < CHAT.burstMs);
    if ((l.chats.length && now - l.chats[l.chats.length - 1] < CHAT.gapMs) || l.chats.length >= CHAT.burst) {
      l.conn.send(JSON.stringify({ t: 'no', why: 'slow', text: 'Slow down a little.' }));
      return;
    }
    const v = cleanChat(raw);
    if (!v.ok) {
      l.conn.send(JSON.stringify({ t: 'no', why: v.why, text: CHAT_WHY[v.why] }));
      if (v.why === 'rude' || v.why === 'personal') {
        // kept for a report as what it was, never as what it said (it may be someone's phone number)
        this.remember(l, `(not sent: ${v.why === 'rude' ? 'rude' : 'personal details'})`);
        l.strikes = [...l.strikes.filter((t) => now - t < CHAT.strikeMs), now];
        if (l.strikes.length >= CHAT.strikes) {
          p.mutedUntil = now + CHAT.muteMs;
          l.strikes = [];
          l.conn.save(l.saved);
          l.conn.send(JSON.stringify({ t: 'muted', until: p.mutedUntil }));
        }
      }
      return;
    }
    l.chats.push(now);
    this.remember(l, v.text);
    this.broadcast({ t: 'c', id: p.id, text: v.text });
  }

  private remember(l: Live, text: string) {
    l.history.push({ at: new Date(this.hooks.now()).toISOString(), text });
    if (l.history.length > WORLD.history) l.history.shift();
  }

  private report(l: Live, id: unknown, why: unknown) {
    const reason = (REPORT_WHY as readonly unknown[]).includes(why) ? (why as ReportWhy) : 'other';
    const target = [...this.live.values()].find((x) => x.saved.player?.id === id);
    if (!target || target === l) return;
    const key = `${l.saved.visitor}>${target.saved.visitor}`;
    const now = this.hooks.now();
    const last = this.reported.get(key);
    if (last === undefined || now - last >= WORLD.reportGapMs) {
      const tp = target.saved.player!;
      const kept = this.hooks.report({ reporter: l.saved.visitor, target: target.saved.visitor, label: tp.label, family: tp.family, why: reason, lines: [...target.history] });
      if (kept) this.reported.set(key, now);
    }
    // the same answer either way, so a reporter can't tell whether a repeat counted
    l.conn.send(JSON.stringify({ t: 'reported', id }));
  }

  private scheduleFlush() {
    if (this.flushing) return;
    this.flushing = true;
    this.hooks.later(() => this.flush(), WORLD.flushMs);
  }

  /** Drop connections that never joined, and players not heard from (not even a ping) for a while. */
  private sweep(now: number) {
    for (const l of [...this.live.values()]) {
      const heard = Math.max(l.lastSeen, this.hooks.lastPing?.(l.conn) ?? 0);
      if (!l.saved.player && now - l.saved.joinedAt > WORLD.joinMs && now - heard > WORLD.joinMs) { l.conn.close(CLOSE.badJoin, 'no join'); this.leave(l.conn); continue; }
      if (now - heard > WORLD.idleMs) { l.conn.close(CLOSE.idle, 'idle'); this.leave(l.conn); }
    }
  }

  /** Send everyone the moves since last time (and drop anyone gone quiet). */
  flush() {
    this.flushing = false;
    this.sweep(this.hooks.now());
    if (!this.moved.size) return;
    const m: (string | number)[][] = [];
    for (const conn of this.moved) {
      const l = this.live.get(conn);
      if (!l?.saved.player) continue;
      m.push([l.saved.player.id, ...l.saved.player.p]);
      conn.save(l.saved);
    }
    this.moved.clear();
    if (m.length) this.broadcast({ t: 's', m });
  }

  private broadcast(msg: unknown, except?: Conn) {
    const s = JSON.stringify(msg);
    for (const l of this.live.values()) {
      if (l.conn === except || !l.saved.player) continue;
      try { l.conn.send(s); } catch { /* closing; its close event will tidy up */ }
    }
  }
}
