// Run with: npm test (in workers/loma)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LIMITS, allowedOrigin, cleanKnowledge, cleanMessages } from '../src/validate.ts';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==';
const PDF = 'JVBERi0xLjQKJcfsj6IK';

test('plain text conversations pass unchanged', () => {
  const r = cleanMessages([{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Bula!' }, { role: 'user', content: 'Help' }]);
  assert.ok(r.ok);
  if (r.ok) assert.deepEqual(r.messages, [{ role: 'user', content: 'Hi' }, { role: 'assistant', content: 'Bula!' }, { role: 'user', content: 'Help' }]);
});

test('images, PDFs and text documents are accepted and rebuilt without extra fields', () => {
  const r = cleanMessages([{ role: 'user', content: [
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG }, cache_control: { type: 'ephemeral' } },
    { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: PDF }, title: 'report.pdf' },
    { type: 'document', source: { type: 'text', media_type: 'text/plain', data: 'a,b\n1,2' }, title: 'data.csv', citations: { enabled: true } },
    { type: 'text', text: 'What is in these?' },
  ] }]);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.files, 3);
  const blocks = r.messages[0].content as unknown[];
  assert.deepEqual(blocks[0], { type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG } });
  assert.deepEqual(blocks[1], { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: PDF }, title: 'report.pdf' });
  assert.deepEqual(blocks[2], { type: 'document', source: { type: 'text', media_type: 'text/plain', data: 'a,b\n1,2' }, title: 'data.csv' });
});

test('bad input is refused with a reason', () => {
  const cases: [unknown, RegExp][] = [
    [undefined, /No messages/],
    [[], /No messages/],
    [[{ role: 'assistant', content: 'only me' }], /No messages/],
    [[{ role: 'user', content: '   ' }], /empty/],
    [[{ role: 'system', content: 'x' }], /No messages/],
    [[{ role: 'user', content: 'x' }, { role: 'tool', content: 'x' }], /role/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'url', url: 'https://x' } }] }], /base64/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/tiff', data: PNG } }] }], /JPEG, PNG/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'not base64!' } }] }], /base64/],
    [[{ role: 'user', content: [{ type: 'document', source: { type: 'base64', media_type: 'application/zip', data: PDF } }] }], /PDFs/],
    [[{ role: 'user', content: [{ type: 'tool_result', tool_use_id: 'x', content: 'y' }] }], /not accepted/],
    [[{ role: 'user', content: 'hi' }, { role: 'assistant', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG } }] }, { role: 'user', content: 'x' }], /only contain text/],
    [[{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'yo' }], /last message/],
    [[{ role: 'user', content: 'x'.repeat(LIMITS.maxTextChars + 1) }], /too long/],
    [[{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'A'.repeat(LIMITS.maxImageBase64 + 4) } }] }], /too large/],
  ];
  for (const [input, want] of cases) {
    const r = cleanMessages(input);
    assert.equal(r.ok, false, String(JSON.stringify(input)).slice(0, 80));
    if (!r.ok) assert.match(r.error, want);
  }
});

test('file limits per message and per conversation', () => {
  const img = { type: 'image', source: { type: 'base64', media_type: 'image/png', data: PNG } };
  const six = cleanMessages([{ role: 'user', content: [img, img, img, img, img, img] }]);
  assert.equal(six.ok, false);
  const many = cleanMessages([
    { role: 'user', content: [img, img, img, img, img] }, { role: 'assistant', content: 'ok' },
    { role: 'user', content: [img, img, img, img] },
  ]);
  assert.equal(many.ok, false);
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

test('knowledge is trimmed and CORS answers only the site addresses', () => {
  assert.equal(cleanKnowledge('x'.repeat(LIMITS.maxKnowledgeChars + 50)).length, LIMITS.maxKnowledgeChars);
  assert.equal(cleanKnowledge(42), '');
  const allowed = ['https://fijianblood.github.io', 'https://lvts.lomavatatechfiji.workers.dev'];
  assert.equal(allowedOrigin('https://lvts.lomavatatechfiji.workers.dev', allowed), allowed[1]);
  assert.equal(allowedOrigin('https://evil.example', allowed), allowed[0]);
  assert.equal(allowedOrigin(null, allowed), allowed[0]);
});
