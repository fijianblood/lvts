// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  type ApiMessage, FILE_LIMITS, classifyFile, decodeXml, docxText, fitHistory, hasFiles, isKnownTextName,
  looksLikeText, pptxSlideText, toTextOnly, unsupportedReason, xlsxSharedStrings, xlsxSheetText,
} from '../../src/lib/chatPayload.ts';

test('files are sorted by kind from their name and type', () => {
  const cases: [string, string, string][] = [
    ['photo.jpg', 'image/jpeg', 'image'], ['IMG_0030.HEIC', '', 'image'], ['shot.png', 'image/png', 'image'],
    ['report.pdf', 'application/pdf', 'pdf'], ['scan.PDF', '', 'pdf'],
    ['cv.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'office'],
    ['budget.xlsx', '', 'office'], ['talk.pptx', '', 'office'],
    ['notes.txt', 'text/plain', 'text'], ['data.json', 'application/json', 'text'], ['data.jso', '', 'text'],
    ['app.tsx', '', 'text'], ['logo.svg', 'image/svg+xml', 'text'], ['README', '', 'text'],
    ['weird.cfgx', 'application/octet-stream', 'text'],
    ['song.mp3', 'audio/mpeg', 'unsupported'], ['clip.mp4', 'video/mp4', 'unsupported'],
    ['old.doc', 'application/msword', 'unsupported'], ['site.zip', 'application/zip', 'unsupported'],
    ['setup.exe', 'application/octet-stream', 'unsupported'],
  ];
  for (const [name, mime, want] of cases) assert.equal(classifyFile(name, mime), want, `${name} (${mime || 'no type'})`);
  assert.ok(isKnownTextName('a.csv') && !isKnownTextName('a.xyz'));
});

test('unsupported files get a helpful reason', () => {
  assert.match(unsupportedReason('old.doc'), /\.docx or PDF/);
  assert.match(unsupportedReason('clip.mp4'), /screenshot/);
  assert.match(unsupportedReason('site.zip'), /Unzip/);
  assert.match(unsupportedReason('thing.bin'), /\.bin/);
});

test('Word text comes out paragraph by paragraph, with entities decoded', () => {
  const xml = '<w:document><w:body>'
    + '<w:p><w:r><w:t>Bula &amp; welcome</w:t></w:r></w:p>'
    + '<w:p><w:pPr/><w:r><w:t xml:space="preserve">Price: </w:t></w:r><w:r><w:t>FJD $25</w:t></w:r><w:r><w:tab/><w:t>each</w:t></w:r></w:p>'
    + '<w:p><w:r><w:t>Line one</w:t><w:br/><w:t>Line two &#x2013; done</w:t></w:r></w:p>'
    + '</w:body></w:document>';
  assert.equal(docxText(xml), 'Bula & welcome\nPrice: FJD $25\teach\nLine one\nLine two – done');
});

test('PowerPoint slide text and spreadsheet cells come out readable', () => {
  const slide = '<p:sld><a:p><a:r><a:t>Title</a:t></a:r></a:p><a:p></a:p><a:p><a:r><a:t>Point &lt;1&gt;</a:t></a:r></a:p></p:sld>';
  assert.equal(pptxSlideText(slide), 'Title\nPoint <1>');
  const shared = xlsxSharedStrings('<sst><si><t>Item</t></si><si><r><t>Pri</t></r><r><t>ce</t></r></si><si><t>Laptop</t></si></sst>');
  assert.deepEqual(shared, ['Item', 'Price', 'Laptop']);
  const sheet = '<worksheet><sheetData>'
    + '<row r="1"><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row>'
    + '<row r="2"><c r="A2" t="s"><v>2</v></c><c r="B2"><v>899.5</v></c><c r="C2" t="inlineStr"><is><t>note</t></is></c></row>'
    + '<row r="3"><c r="A3"/></row>'
    + '<row r="4"><c t="s"><v>2</v></c><c><v>12</v></c><c/></row>'
    + '</sheetData></worksheet>';
  assert.equal(xlsxSheetText(sheet, shared), 'Item\tPrice\nLaptop\t899.5\tnote\nLaptop\t12\t');
  assert.equal(decodeXml('&quot;a&quot; &apos;b&apos; &#65;'), '"a" \'b\' A');
});

test('text detection rejects binary', () => {
  assert.ok(looksLikeText('{"ok": true}\nhello'));
  assert.ok(!looksLikeText('PK\u0003\u0004\u0000\u0000binary'));
  assert.ok(!looksLikeText('���ab'));
  assert.ok(!looksLikeText(''));
});

const img = (n: number) => ({ type: 'image' as const, source: { type: 'base64' as const, media_type: 'image/png' as const, data: 'A'.repeat(n) } });

test('old files are swapped for a note when the conversation has too many or too much', () => {
  const history: ApiMessage[] = [];
  for (let i = 0; i < 6; i++) {
    history.push({ role: 'user', content: [img(10), img(10), { type: 'text', text: `q${i}` }] });
    history.push({ role: 'assistant', content: `a${i}` });
  }
  history.push({ role: 'user', content: [img(10), { type: 'text', text: 'last' }] });
  const fitted = fitHistory(history);
  const count = fitted.reduce((n, m) => n + (Array.isArray(m.content) ? m.content.filter((b) => b.type === 'image').length : 0), 0);
  assert.ok(count <= FILE_LIMITS.inConversation, `${count} files kept`);
  const last = fitted.at(-1)!.content as { type: string }[];
  assert.equal(last[0].type, 'image', 'the newest message keeps its file');
  assert.match(JSON.stringify(fitted[0].content), /no longer attached/);
  assert.equal(history[0].content.length, 3, 'the original history is not changed');
  assert.equal((history[0].content as { type: string }[])[0].type, 'image');

  const big: ApiMessage[] = [
    { role: 'user', content: [img(FILE_LIMITS.maxPayloadBase64 - 10), { type: 'text', text: 'one' }] },
    { role: 'assistant', content: 'ok' },
    { role: 'user', content: [img(100), { type: 'text', text: 'two' }] },
  ];
  const fittedBig = fitHistory(big);
  assert.match(JSON.stringify(fittedBig[0].content), /no longer attached/);
  assert.equal((fittedBig[2].content as { type: string }[])[0].type, 'image');
});

test('the text-only version keeps text files and notes the rest', () => {
  const history: ApiMessage[] = [{
    role: 'user', content: [
      { type: 'document', source: { type: 'text', media_type: 'text/plain', data: 'a,b\n1,2' }, title: 'data.csv' },
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0x' }, title: 'scan.pdf' },
      img(4),
      { type: 'text', text: 'What is this?' },
    ],
  }];
  assert.ok(hasFiles(history));
  const [m] = toTextOnly(history);
  assert.equal(typeof m.content, 'string');
  assert.match(m.content, /--- File: data\.csv ---\na,b\n1,2/);
  assert.match(m.content, /scan\.pdf, but it couldn't be read/);
  assert.match(m.content, /an image, but it couldn't be read/);
  assert.match(m.content, /What is this\?$/);
  assert.ok(!hasFiles([{ role: 'user', content: 'hi' }]));
});
