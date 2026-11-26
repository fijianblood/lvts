// Run with: node --test tests/tools/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildLvtsLink, normalizeYoutubeLink, QUALITY_OPTIONS } from '../../src/lib/ytLink.ts';

test('accepts the YouTube link shapes the notebook accepts', () => {
  for (const link of [
    'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtube.com/watch?v=aqz-KE-bpKQ',
    'https://m.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://music.youtube.com/watch?v=aqz-KE-bpKQ',
    'https://youtu.be/aqz-KE-bpKQ',
    'https://www.youtube.com/shorts/aqz-KE-bpKQ',
    'http://www.youtube.com/watch?v=aqz-KE-bpKQ',
  ]) {
    assert.ok(normalizeYoutubeLink(link), link);
  }
});

test('adds https:// to a link pasted without it, and trims spaces', () => {
  assert.equal(normalizeYoutubeLink('  youtu.be/aqz-KE-bpKQ '), 'https://youtu.be/aqz-KE-bpKQ');
  assert.equal(normalizeYoutubeLink('www.youtube.com/watch?v=abc'), 'https://www.youtube.com/watch?v=abc');
});

test('rejects anything that is not a YouTube link', () => {
  for (const link of ['', '   ', 'hello', 'https://vimeo.com/123', 'https://notyoutube.com/watch?v=1',
    'https://youtube.com.evil.example/watch', 'javascript:alert(1)', 'ftp://youtube.com/x']) {
    assert.equal(normalizeYoutubeLink(link), null, link);
  }
});

test('adds the quality, and -drive when the Drive copy is ticked', () => {
  assert.equal(buildLvtsLink('https://youtu.be/aqz-KE-bpKQ', '720', false), 'https://youtu.be/aqz-KE-bpKQ?lvts=720');
  assert.equal(buildLvtsLink('https://youtu.be/aqz-KE-bpKQ', 'mp3', true), 'https://youtu.be/aqz-KE-bpKQ?lvts=mp3-drive');
});

test('keeps the link\'s own parameters and replaces an old lvts value', () => {
  assert.equal(
    buildLvtsLink('https://www.youtube.com/watch?v=abc&t=42s&lvts=480', '1080', false),
    'https://www.youtube.com/watch?v=abc&t=42s&lvts=1080',
  );
});

test('returns null for a bad link', () => {
  assert.equal(buildLvtsLink('https://vimeo.com/1', '720', false), null);
});

test('quality codes are unique', () => {
  assert.equal(new Set(QUALITY_OPTIONS.map(q => q.code)).size, QUALITY_OPTIONS.length);
});
