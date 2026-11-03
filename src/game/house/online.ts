// The game's side of Noqublox's shared world (workers/neighbourhood/src/world.ts):
// one WebSocket while you explore, your position a few times a second, other
// players' moves and chat coming in. With no server (or it can't be reached),
// the game simply plays on your own.

import { API } from './neighbourhood.ts';
import { cleanChat, CHAT_WHY } from '../../../workers/neighbourhood/src/chat.ts';
import { CLOSE, type Pub, type ReportWhy } from '../../../workers/neighbourhood/src/world.ts';
import type { VisitorLook } from '../../../workers/neighbourhood/src/rules.ts';

export type { Pub, ReportWhy };
export { REPORT_WHY } from '../../../workers/neighbourhood/src/world.ts';

export type LinkStatus = 'off' | 'connecting' | 'online' | 'full' | 'banned' | 'offline';
export type JoinWho = { kind: 'family'; id: string } | { kind: 'mine'; look: VisitorLook; id?: string; key?: string };
/** Where you are: x, feet height, z, facing; then how you're posed (sitting, swinging…), left off when you're standing. */
export type Pos = number[];

export interface LinkEvents {
  status(s: LinkStatus): void;
  welcome(you: string, label: string, players: Pub[]): void;
  join(p: Pub): void;
  leave(id: string): void;
  /** Everyone who moved: [id, x, y, z, facing] and, when they aren't standing, how they're posed. */
  moves(m: [string, ...number[]][]): void;
  chat(id: string, text: string): void;
  /** Something to tell the player: a message that didn't go, a mute, a report received. */
  notice(text: string): void;
}

/** Is there a shared world to join in this build? */
export const SHARED = !!API;

const SEND_MS = 200;
const PING_MS = 25_000;
const GIVE_UP = 4;

export class WorldLink {
  private ws: WebSocket | null = null;
  private stopped = false;
  private sent: Pos | null = null;
  private timer = 0;
  private pinger = 0;
  private retry = 0;
  private failures = 0;
  private opened = false;
  private you = '';
  private who: JoinWho;
  private getPos: () => Pos;
  private on: LinkEvents;

  constructor(who: JoinWho, getPos: () => Pos, on: LinkEvents) {
    this.who = who;
    this.getPos = getPos;
    this.on = on;
  }

  get me(): string { return this.you; }

  start() {
    if (!API) { this.on.status('off'); return; }
    this.stopped = false;
    this.connect();
  }

  stop() {
    this.stopped = true;
    window.clearTimeout(this.retry);
    window.clearInterval(this.timer);
    window.clearInterval(this.pinger);
    const ws = this.ws;
    this.ws = null;
    if (ws) { ws.onclose = null; ws.onerror = null; ws.onmessage = null; try { ws.close(1000, 'bye'); } catch { /* already closed */ } }
  }

  /** Say something. Returns why it can't go, or null if it went. */
  say(raw: string): string | null {
    const v = cleanChat(raw);
    if (!v.ok) return CHAT_WHY[v.why];
    if (!this.send({ t: 'c', text: v.text })) return "You're not connected to the shared world right now.";
    return null;
  }

  report(id: string, why: ReportWhy) { this.send({ t: 'report', id, why }); }

  private send(m: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(m));
    return true;
  }

  private connect() {
    this.on.status('connecting');
    let ws: WebSocket;
    try { ws = new WebSocket(`${API.replace(/^http/, 'ws')}/world`); } catch { this.again(); return; }
    this.ws = ws;
    this.opened = false;
    ws.onopen = () => {
      this.opened = true;
      this.failures = 0;
      this.sent = this.getPos();
      ws.send(JSON.stringify({ t: 'join', who: this.who, p: this.sent }));
    };
    ws.onmessage = (e) => this.receive(e.data);
    ws.onerror = () => { /* the close event follows */ };
    ws.onclose = (e) => {
      window.clearInterval(this.timer);
      window.clearInterval(this.pinger);
      this.ws = null;
      if (this.stopped) return;
      if (e.code === CLOSE.banned || e.code === CLOSE.kicked) { this.on.status('banned'); return; }
      if (e.code === CLOSE.full) { this.on.status('full'); this.retry = window.setTimeout(() => this.connect(), 60_000); return; }
      // turned away for a bad join: don't keep trying (but a join that was just slow to arrive is tried again)
      if (e.code === CLOSE.badJoin && e.reason !== 'no join') { this.on.status('offline'); return; }
      this.again();
    };
  }

  /** Lost the connection (or never got it): try again a few times, waiting longer each time. */
  private again() {
    if (this.stopped) return;
    if (!this.opened) this.failures++;
    if (this.failures >= GIVE_UP) { this.on.status('offline'); return; }
    this.on.status('connecting');
    const wait = Math.min(30_000, 2000 * 2 ** this.failures);
    this.retry = window.setTimeout(() => this.connect(), wait);
  }

  private receive(data: unknown) {
    if (typeof data !== 'string' || data === 'pong') return;
    let m: Record<string, unknown>;
    try { m = JSON.parse(data) as Record<string, unknown>; } catch { return; }
    switch (m.t) {
      case 'welcome':
        this.you = String(m.you);
        this.on.welcome(this.you, String(m.label), (m.players as Pub[]) ?? []);
        this.on.status('online');
        // where you are, a few times a second (only when it changed); a ping now and then keeps the line open
        this.timer = window.setInterval(() => this.tick(), SEND_MS);
        this.pinger = window.setInterval(() => { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send('ping'); }, PING_MS);
        break;
      case 'join': if (m.p && (m.p as Pub).id !== this.you) this.on.join(m.p as Pub); break;
      case 'leave': this.on.leave(String(m.id)); break;
      case 's': this.on.moves(((m.m as [string, ...number[]][]) ?? []).filter((x) => x[0] !== this.you)); break;
      case 'c': this.on.chat(String(m.id), String(m.text)); break;
      case 'no': this.on.notice(String(m.text)); break;
      case 'muted': this.on.notice(`You can't chat for a while (until ${new Date(Number(m.until)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}) after several blocked messages.`); break;
      case 'reported': this.on.notice('Thanks. Your report went to LvTS, who will look at it.'); break;
    }
  }

  private tick() {
    const p = this.getPos();
    const s = this.sent;
    if (s && Math.abs(p[0] - s[0]) < 0.02 && Math.abs(p[1] - s[1]) < 0.02 && Math.abs(p[2] - s[2]) < 0.02 && Math.abs(p[3] - s[3]) < 0.02 && (p[4] ?? 0) === (s[4] ?? 0)) return;
    if (this.send({ t: 'm', p: p.map((v, i) => (i === 4 ? Math.round(v) : Math.round(v * (i === 3 ? 1000 : 100)) / (i === 3 ? 1000 : 100))) })) this.sent = p;
  }
}
