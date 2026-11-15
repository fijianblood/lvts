// Run with: npm test (in workers/loma)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, allowedOrigin, checkUpload, cleanKnowledge, cleanMessages } from '../src/validate.ts';

const FID = 'file_011CNha8iCJcU1wXNR6q4V8w';
const img = { type: 'image', source: { type: 'file', file_id: FID } };

test('plain text conversations pass unchanged', () => {
  const r = cleanMessages([{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Bula!' }, { role: 'user', content: 'Help' }]);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.messages, [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Bula!' }, { role: 'user', content: 'Help' }]);
});

test('uploaded images and documents are accepted by file id and rebuilt without extra fields', () => {
  const r = cleanMessages([{ role: 'user', content: [
    { ...img, cache_control: { type: 'ephemeral' } },
    { type: 'document', source: { type: 'file', file_id: 'file_abcdef123' }, title: 'report.pdf', citations: { enabled: true } },
    { type: 'text', text: 'What is in these?' },
  ] }]);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.files, 2);
  assert.deepEqual(r.messages[0].content, [
    { type: 'image', source: { type: 'file', file_id: FID } },
    { type: 'document', source: { type: 'file', file_id: 'file_abcdef123' }, title: 'report.pdf' },
    { type: 'text', text: 'What is in these?' },
  ]);
});

test('bad input is refused with a reason', () => {
  const cases: [unknown, RegExp][] = [
    [undefined, /No messages/],
    [[], /No messages/],
    [[{ role: 'assistant', content: 'only me' }], /No messages/],
    [[{ role: 'user', content: '   ' }], /empty/],
    [[{ role: 'user', content: 'x' }, { role: 'tool', content: 'x' }], /role/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } }] }], /uploaded first/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'url', url: 'https://x' } }] }], /uploaded first/],
    [[{ role: 'user', content: [{ type: 'document', source: { type: 'text', media_type: 'text/plain', data: 'x' } }] }], /uploaded first/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'file', file_id: '../../etc' } }] }], /not valid/],
    [[{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'y' }] }], /not accepted/],
    [[{ role: 'user', content: 'hi' }, { role: 'assistant', content: [img] }, { role: 'user', content: 'x' }], /only contain text/],
    [[{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }], /last message/],
    [[{ role: 'user', content: 'x'.repeat(LIMITS.maxTextChars + 1) }], /too long/],
  ];
  for (const [input, want] of cases) {
    const r = cleanMessages(input);
    assert.equal(r.ok, false, String(JSON.stringify(input)).slice(0, 80));
    if (!r.ok) assert.match(r.error, want);
  }
});

test('file limits per message and per conversation', () => {
  assert.equal(cleanMessages([{ role: 'user', content: [img, img, img, img, img, img] }]).ok, false);
  assert.equal(cleanMessages([
    { role: 'user', content: [img, img, img, img, img] }, { role: 'assistant', content: 'ok' },
    { role: 'user', content: [img, img, img, img] },
  ]).ok, false);
});

test('only the newest messages are kept, starting with the visitor', () => {
  const long = Array.from({ length: 29 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `m${i}` }));
  const r = cleanMessages(long);
  assert.ok(r.ok);
  if (r.ok) {
    assert.ok(r.messages.length <= LIMITS.maxMessages);
    assert.equal(r.messages[0].role, 'user');
    assert.equal(r.messages.at(-1)?.content, 'm28');
  }
});

test('uploads are checked from their headers before anything is read', () => {
  assert.deepEqual(checkUpload('2048', 'application/pdf', 'Warranty%20card.pdf'), { ok: true, type: 'application/pdf', name: 'Warranty card.pdf' });
  assert.deepEqual(checkUpload('10', 'image/JPEG; charset=binary', null), { ok: true, type: 'image/jpeg', name: 'file' });
  const nameCheck = checkUpload('10', 'text/plain', '..%2F..%2Fsecret%0A.txt');
  assert.ok(nameCheck.ok && !/[/\n]/.test(nameCheck.name), 'slashes and control characters are removed');
  assert.ok(checkUpload('10', 'text/plain', '%E0%A4%A').ok, 'a broken name falls back instead of failing');
  const bad: [string | null, string | null, number][] = [
    [null, 'application/pdf', 411], ['0', 'application/pdf', 411], ['abc', 'application/pdf', 411],
    [String(LIMITS.maxUploadBytes + 1), 'application/pdf', 413],
    ['10', 'application/zip', 415], ['10', 'video/mp4', 415], ['10', null, 415], ['10', 'text/html', 415],
  ];
  for (const [len, type, status] of bad) {
    const r = checkUpload(len, type, 'x');
    assert.equal(r.ok, false, `${len} ${type}`);
    if (!r.ok) assert.equal(r.status, status, `${len} ${type}`);
  }
});

test('knowledge is trimmed and CORS answers only the site addresses', () => {
  assert.equal(cleanKnowledge('x'.repeat(LIMITS.maxKnowledgeChars + 50)).length, LIMITS.maxKnowledgeChars);
  assert.equal(cleanKnowledge(42), '');
  const allowed = ['https://fijianblood.github.io', 'https://lvts.lomavatatechfiji.workers.dev'];
  assert.equal(allowedOrigin('https://lvts.lomavatatechfiji.workers.dev', allowed), allowed[1]);
  assert.equal(allowedOrigin('https://evil.example', allowed), allowed[0]);
  assert.equal(allowedOrigin(null, allowed), allowed[0]);
});
