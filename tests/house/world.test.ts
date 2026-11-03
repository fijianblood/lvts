// The shared world (workers/neighbourhood/src/world.ts) and its chat filter.
// Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanChat, CHAT } from '../../workers/neighbourhood/src/chat.ts';
import { World, WORLD, CLOSE, cleanPos, type Conn, type Hooks, type Saved, type ReportIn } from '../../workers/neighbourhood/src/world.ts';
import { handle, memoryStore, approvedName, isBanned, type Ctx } from '../../workers/neighbourhood/src/registry.ts';

// ── chat ─────────────────────────────────────────────────────────────────────
test('chat: friendly messages go through, tidied', () => {
  for (const ok of ['Bula!', 'Bula vinaka 😊', "Let's go to USP", 'I have 3 dogs', 'Meet you at Garden City? jk', 'Vinaka vakalevu', 'The bus is at 10.30',
    'Nigeria and Niger are in Africa', 'my mother figure', 'Hi Dickson', 'I passed my class', 'assess this', 'Scored 455 points', 'Namaste', 'moce mada', 'as if',
    'see you at the shop. me too', 'grass is green', 'I got 2 out of 10']) {
    const v = cleanChat(ok);
    assert.ok(v.ok, `blocked: ${ok} (${!v.ok && v.why})`);
  }
  assert.deepEqual(cleanChat('  bula​   vinaka ‮ '), { ok: true, text: 'bula vinaka' }, 'invisible characters and extra spaces kept');
  assert.equal(cleanChat('').ok, false);
  assert.equal(cleanChat('   ').ok, false);
  assert.equal(cleanChat(42).ok, false);
  assert.equal(cleanChat('a'.repeat(CHAT.maxLength + 1)).ok, false);
});

test('chat: rude words are blocked, however they are spelled', () => {
  for (const bad of ['fuck', 'FUCK you', 'f u c k', 'f.u.c.k', 'fuuuuck', 'sh1t', 'sh!t', '$hit', 'you b1tch', 'a55hole', 'what the f*ck is fuk', 'kys', 'kill yourself',
    'send nudes', 'madarchod', 'tu chutiya hai', 'gandu', 'ur a cunt', 'shiiit that was close']) {
    const v = cleanChat(bad);
    assert.ok(!v.ok, `went through: ${bad}`);
  }
  assert.deepEqual(cleanChat('shit!'), { ok: false, why: 'rude' });
});

test('chat: ways to find or contact someone are never sent', () => {
  for (const bad of ['833 1088', 'call 8331088', '+679 833-1088', 'my number is 83 31 08 8', 'eight three three one zero eight eight', 'joe@gmail.com', 'joe at gmail',
    'joe (at) mail (dot) com', 'add me @fijianblood8', 'follow @joe_99', 'https://example.com', 'go to www.thing.net', 'lvts.com', 'check fijianblood.github.io',
    'whatsapp me', 'my snap is joe', 'find me on insta', 'my ig is joe', 'on fb', 'tiktok me', 'where do you live?', 'where u stay', 'what school do you go to', 'send pic', 'meet me at the bus stop', 'text me']) {
    const v = cleanChat(bad);
    assert.ok(!v.ok && v.why === 'personal', `went through (or the wrong reason): ${bad} → ${JSON.stringify(v)}`);
  }
});

// ── the world ────────────────────────────────────────────────────────────────
interface Fake extends Conn { sent: Record<string, unknown>[]; closed?: [number, string]; saved?: Saved }
const fake = (): Fake => {
  const c: Fake = {
    sent: [],
    send: (s) => { c.sent.push(JSON.parse(s)); },
    close: (code, reason) => { c.closed = [code, reason]; },
    save: (s) => { c.saved = structuredClone(s); },
  };
  return c;
};
const LOOK = { size: 'adult', skin: '#93603f', hair: '#16110e', hairStyle: 'short', shirt: '#3b82f6', pants: '#1f2937', longPants: false, beard: false, earrings: false };

let n = 0;   // ids never repeat across worlds in a test, as random ones wouldn't
function setup(over: Partial<Hooks> = {}) {
  let t = 1_800_000_000_000;
  const timers: (() => void)[] = [];
  const reports: ReportIn[] = [];
  const banned = new Set<string>();
  const hooks: Hooks = {
    now: () => t,
    random: () => `id${++n}`,
    approvedName: async (id, key) => (id === 'ch1' && key === 'secret' ? 'Mere' : null),
    isBanned: (v) => banned.has(v),
    report: (r) => { reports.push(r); return true; },
    later: (fn) => { timers.push(fn); },
    ...over,
  };
  const world = new World(hooks);
  const join = async (visitor: string, who: unknown = { kind: 'family', id: 'zane' }, p: number[] = [0, -3.6, 20, 0]) => {
    const c = fake();
    world.connect(c, visitor);
    await world.message(c, JSON.stringify({ t: 'join', who, p }));
    return c;
  };
  const tick = (ms: number) => { t += ms; };
  const flush = () => { while (timers.length) timers.shift()!(); };
  return { world, join, tick, flush, reports, banned, hooks };
}
const last = (c: Fake, type: string) => [...c.sent].reverse().find((m) => m.t === type) as Record<string, any> | undefined;

test('world: players join, see who is already there, and are told about each other', async () => {
  const { world, join } = setup();
  const a = await join('va');
  const wa = last(a, 'welcome')!;
  assert.equal(wa.label, 'Visitor 1');
  assert.deepEqual(wa.players, []);
  const b = await join('vb', { kind: 'mine', look: LOOK });
  const wb = last(b, 'welcome')!;
  assert.equal(wb.label, 'Visitor 2', 'an unapproved character showed a name');
  assert.equal(wb.players.length, 1);
  assert.equal(wb.players[0].f, 'zane', 'the family member someone plays as');
  assert.equal(wb.players[0].n, 'Visitor 1', 'playing a family member shows their name');
  const joined = last(a, 'join')!;
  assert.equal(joined.p.n, 'Visitor 2');
  assert.deepEqual(joined.p.l, LOOK);
  assert.equal(world.players.length, 2);
  world.leave(b);
  assert.equal(last(a, 'leave')!.id, wb.you);
  const c = await join('vc');
  assert.equal(last(c, 'welcome')!.label, 'Visitor 2', 'numbers are reused');
});

test('world: only an approved character (with its secret key) shows its own name', async () => {
  const { join } = setup();
  assert.equal(last(await join('v1', { kind: 'mine', look: LOOK, id: 'ch1', key: 'secret' }), 'welcome')!.label, 'Mere');
  assert.equal(last(await join('v2', { kind: 'mine', look: LOOK, id: 'ch1', key: 'guess' }), 'welcome')!.label, 'Visitor 2');
  const bad = await join('v3', { kind: 'mine', look: { ...LOOK, shirt: '#123456' } });
  assert.equal(bad.closed?.[0], CLOSE.badJoin, 'a made-up look got in');
  const weird = await join('v4', { kind: 'family', id: '<script>' });
  assert.equal(weird.closed?.[0], CLOSE.badJoin);
  const nowhere = await join('v5', { kind: 'family', id: 'zane' }, [Number.NaN, 0, 0, 0]);
  assert.equal(nowhere.closed?.[0], CLOSE.badJoin);
});

test('world: moves go out together, kept inside Raiwai, and not too often', async () => {
  const { world, join, tick, flush } = setup();
  const a = await join('va');
  const b = await join('vb');
  const ida = last(a, 'welcome')!.you;
  tick(200);
  await world.message(a, JSON.stringify({ t: 'm', p: [5.123, -3.6, 21, 7] }));
  await world.message(a, JSON.stringify({ t: 'm', p: [6, -3.6, 21, 0] }));   // too soon: dropped
  flush();
  const s = last(b, 's')!;
  assert.deepEqual(s.m, [[ida, 5.12, -3.6, 21, Math.round(Math.atan2(Math.sin(7), Math.cos(7)) * 1000) / 1000]]);
  assert.deepEqual(cleanPos([9999, -99, 0, 0]), [320, -30, 0, 0]);
  // the whole free-roam map fits: the edge of the map, and the lookout's roof
  assert.deepEqual(cleanPos([-150, 16.4, 264, 0]), [-150, 16.4, 264, 0]);
  assert.deepEqual(cleanPos([300, -3.6, -130, 0]), [300, -3.6, -130, 0]);
  assert.equal(cleanPos([1, 2, 3]), null);
  assert.equal(cleanPos(['1', 2, 3, 4]), null);
  assert.deepEqual(a.saved?.player?.p, [5.12, -3.6, 21, s.m[0][4]], 'position not saved for after a sleep');
});

test('world: how a player is posed (sitting, on the ground, on a swing) goes to everyone with their moves; anything else is standing', async () => {
  const { world, join, tick, flush } = setup();
  const a = await join('va');
  const b = await join('vb');
  const ida = last(a, 'welcome')!.you;
  tick(200);
  await world.message(a, JSON.stringify({ t: 'm', p: [53, -0.05, -3, 0, 3] }));   // on a swing at Loma Castle
  flush();
  assert.deepEqual(last(b, 's')!.m, [[ida, 53, -0.05, -3, 0, 3]]);
  assert.deepEqual(a.saved?.player?.p, [53, -0.05, -3, 0, 3]);
  tick(200);
  await world.message(a, JSON.stringify({ t: 'm', p: [54, -0.6, -1, 0] }));        // standing again: no fifth number
  flush();
  assert.deepEqual(last(b, 's')!.m, [[ida, 54, -0.6, -1, 0]]);
  // a pose is 1, 2 or 3; anything else is dropped (standing), and more than five numbers isn't a position
  assert.deepEqual(cleanPos([1, 2, 3, 0, 1]), [1, 2, 3, 0, 1]);
  assert.deepEqual(cleanPos([1, 2, 3, 0, 2]), [1, 2, 3, 0, 2]);
  for (const bad of [0, 4, 1.5, -1]) assert.deepEqual(cleanPos([1, 2, 3, 0, bad]), [1, 2, 3, 0]);
  assert.equal(cleanPos([1, 2, 3, 0, 1, 1]), null);
  assert.equal(cleanPos([1, 2, 3, 0, Number.NaN]), null);
});

test('world: chat goes to everyone; slow down, filters, and a mute after repeated blocked messages', async () => {
  const { world, join, tick } = setup();
  const a = await join('va');
  const b = await join('vb');
  await world.message(a, JSON.stringify({ t: 'c', text: 'Bula!' }));
  assert.equal(last(b, 'c')!.text, 'Bula!');
  await world.message(a, JSON.stringify({ t: 'c', text: 'again' }));
  assert.equal(last(a, 'no')!.why, 'slow');
  tick(CHAT.gapMs);
  await world.message(a, JSON.stringify({ t: 'c', text: 'call me 8331088' }));
  assert.equal(last(a, 'no')!.why, 'personal');
  assert.notEqual(last(b, 'c')!.text, 'call me 8331088', 'a phone number was passed on');
  for (let i = 0; i < CHAT.strikes - 1; i++) { tick(CHAT.gapMs); await world.message(a, JSON.stringify({ t: 'c', text: 'fuck' })); }
  assert.ok(last(a, 'muted'), 'not muted after repeated blocked messages');
  tick(CHAT.gapMs);
  await world.message(a, JSON.stringify({ t: 'c', text: 'sorry' }));
  assert.equal(last(b, 'c')!.text, 'Bula!', 'a muted player chatted');
  tick(CHAT.muteMs);
  await world.message(a, JSON.stringify({ t: 'c', text: 'sorry' }));
  assert.equal(last(b, 'c')!.text, 'sorry', 'still muted after the mute ran out');
});

test('world: a report keeps the reported player’s recent chat (never what was blocked), once per 10 minutes', async () => {
  const { world, join, tick, reports } = setup();
  const a = await join('va');
  const b = await join('vb');
  const idb = last(b, 'welcome')!.you;
  await world.message(b, JSON.stringify({ t: 'c', text: 'hello' }));
  tick(CHAT.gapMs);
  await world.message(b, JSON.stringify({ t: 'c', text: 'my number is 833 1088' }));
  await world.message(a, JSON.stringify({ t: 'report', id: idb, why: 'personal' }));
  assert.equal(last(a, 'reported')!.id, idb);
  assert.equal(reports.length, 1);
  assert.equal(reports[0].target, 'vb');
  assert.equal(reports[0].reporter, 'va');
  assert.equal(reports[0].why, 'personal');
  assert.deepEqual(reports[0].lines.map((l) => l.text), ['hello', '(not sent: personal details)']);
  await world.message(a, JSON.stringify({ t: 'report', id: idb, why: 'rude' }));
  assert.equal(reports.length, 1, 'reported twice in a row');
  await world.message(a, JSON.stringify({ t: 'report', id: last(a, 'welcome')!.you, why: 'rude' }));
  assert.equal(reports.length, 1, 'reported themselves');
  tick(WORLD.reportGapMs);
  await world.message(a, JSON.stringify({ t: 'report', id: idb, why: 'nonsense' }));
  assert.equal(reports.length, 2);
  assert.equal(reports[1].why, 'other');
});

test('world: full, banned, kicked, flooding and idle players are turned away or dropped', async () => {
  const { world, join, tick, flush, banned } = setup();
  const first = await join('v0');
  for (let i = 1; i < WORLD.maxPlayers; i++) await join(`v${i}`);
  const extra = await join('extra');
  assert.equal(extra.closed?.[0], CLOSE.full);
  assert.equal(last(extra, 'full')!.max, WORLD.maxPlayers);

  const s = setup();
  s.banned.add('bad');
  const b = await s.join('bad');
  assert.equal(b.closed?.[0], CLOSE.banned);
  const ok = await s.join('ok');
  s.world.kick('ok');
  assert.equal(ok.closed?.[0], CLOSE.kicked);
  assert.equal(s.world.players.length, 0);

  const f = await s.join('flood');
  for (let i = 0; i < WORLD.maxPerSecond + 1; i++) await s.world.message(f, JSON.stringify({ t: 'm', p: [0, 0, 0, 0] }));
  assert.equal(f.closed?.[0], CLOSE.flood);

  banned.clear();
  tick(WORLD.idleMs + 1);
  const fresh = await join('fresh');
  await world.message(fresh, JSON.stringify({ t: 'm', p: [1, 0, 1, 0] }));
  flush();
  assert.equal(first.closed?.[0], CLOSE.idle, 'a silent player was kept');
  assert.equal(fresh.closed, undefined);
});

test('world: a ping counts as still being there', async () => {
  const pings = new Map<Conn, number>();
  const s = setup({ lastPing: (c) => pings.get(c) ?? null });
  const quiet = await s.join('quiet');
  const mover = await s.join('mover');
  s.tick(WORLD.idleMs - 1000);
  pings.set(quiet, s.hooks.now());
  s.tick(5000);
  await s.world.message(mover, JSON.stringify({ t: 'm', p: [1, 0, 1, 0] }));
  s.flush();
  assert.equal(quiet.closed, undefined, 'a player who pings was dropped');
});

test('world: rebuilt after a sleep from what each connection saved', async () => {
  const { world, join } = setup();
  const a = await join('va');
  const b = await join('vb');
  const s2 = setup();
  const a2: Fake = { ...fake(), saved: a.saved };
  const b2: Fake = { ...fake(), saved: b.saved };
  s2.world.restore(a2, a.saved!);
  s2.world.restore(b2, b.saved!);
  assert.deepEqual(s2.world.players.map((p) => p.n).sort(), world.players.map((p) => p.n).sort());
  const c = await s2.join('vc');
  assert.equal(last(c, 'welcome')!.label, 'Visitor 3', 'numbers clash after a sleep');
  assert.equal(last(c, 'welcome')!.players.length, 2);
});

// ── reports and bans on the admin side ───────────────────────────────────────
const ADMIN = 'admin-key-admin-key-01';
const ctx = (store: ReturnType<typeof memoryStore>, over: Partial<Ctx> = {}): Ctx => ({
  store, now: new Date('2026-11-02T00:00:00Z'), random: (n) => `r${n}${Math.random().toString(36).slice(2, 8)}`, hash: async (s) => `h:${s}`, visitor: 'v1',
  adminToken: ADMIN, authorization: `Bearer ${ADMIN}`, ...over,
});

test('admin: reports can be read and dismissed; bans keep a visitor out and kick them now', async () => {
  const store = memoryStore();
  store.addReport({ id: 'rep1', createdAt: '2026-11-01T00:00:00Z', reporter: 'a'.repeat(24), target: 'b'.repeat(24), label: 'Visitor 3', why: 'rude', lines: [{ at: 'x', text: 'hi' }] });
  assert.equal((await handle('GET', '/admin/reports', null, ctx(store, { authorization: null }))).status, 401, 'reports without the key');
  const r = (await handle('GET', '/admin/reports', null, ctx(store))).body as { reports: { id: string }[] };
  assert.equal(r.reports[0].id, 'rep1');
  assert.equal((await handle('DELETE', '/admin/reports/rep1', null, ctx(store))).status, 200);
  assert.equal(store.countReports(), 0);

  const kicked: string[] = [];
  const v = 'b'.repeat(24);
  assert.equal((await handle('POST', '/admin/bans', { visitor: 'nope', days: 1 }, ctx(store))).status, 400);
  assert.equal((await handle('POST', '/admin/bans', { visitor: v, days: 0 }, ctx(store))).status, 400);
  assert.equal((await handle('POST', '/admin/bans', { visitor: v, days: 7, reason: 'rude in chat' }, ctx(store, { onBan: (x) => kicked.push(x) }))).status, 200);
  assert.deepEqual(kicked, [v]);
  assert.ok(isBanned(store, v, new Date('2026-11-05T00:00:00Z')));
  assert.ok(!isBanned(store, v, new Date('2026-11-10T00:00:00Z')), 'a 7-day ban never ended');
  assert.equal(((await handle('GET', '/admin/bans', null, ctx(store))).body as { bans: unknown[] }).bans.length, 1);
  assert.equal((await handle('DELETE', `/admin/bans/${v}`, null, ctx(store))).status, 200);
  assert.ok(!isBanned(store, v, new Date('2026-11-05T00:00:00Z')));
  assert.deepEqual((await handle('GET', '/admin/online', null, ctx(store, { online: () => [{ label: 'Visitor 1' }] }))).body, { players: [{ label: 'Visitor 1' }] });
});

test('admin: approvedName only for an approved character with the right key', async () => {
  const store = memoryStore();
  const hash = async (s: string) => `h:${s}`;
  store.insert({ id: 'c1', name: 'Mere', look: LOOK as never, status: 'pending', createdAt: '2026-11-01', keyHash: 'h:k' });
  assert.equal(await approvedName(store, hash, 'c1', 'k'), null, 'a name shown before approval');
  store.setStatus('c1', 'approved');
  assert.equal(await approvedName(store, hash, 'c1', 'k'), 'Mere');
  assert.equal(await approvedName(store, hash, 'c1', 'x'), null);
  assert.equal(await approvedName(store, hash, 'zz', 'k'), null);
});
