// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { LISTED_ROUTES, ROUTES, SITE_URL, canonicalFor, ogImageFor, routeById } from '../../src/data/routes.ts';

test('every page has its own preview image (run tools/og/make_og.py after adding a page)', () => {
  for (const r of ROUTES.filter((x) => !x.aliasOf)) {
    assert.ok(existsSync(`public/og/${r.id}.jpg`), `public/og/${r.id}.jpg is missing: run python3 tools/og/make_og.py`);
    assert.equal(ogImageFor(r.id), `${SITE_URL}og/${r.id}.jpg`);
  }
});

test('no leftover preview images for pages that no longer exist', () => {
  const ids = new Set(ROUTES.filter((x) => !x.aliasOf).map((r) => r.id));
  for (const f of readdirSync('public/og')) {
    assert.ok(ids.has(f.replace(/\.jpg$/, '')), `public/og/${f} belongs to no page`);
  }
});

test('old addresses open their page (or a tab of it), point Google at it and stay out of the sitemap', () => {
  const aliases = ROUTES.filter((r) => r.aliasOf);
  assert.deepEqual(aliases.map((r) => r.id).sort(), ['ask-old', 'little-chef', 'seo', 'whiteboard']);
  for (const a of aliases) {
    const target = routeById(a.aliasOf as string);
    assert.ok(target && !target.aliasOf, `${a.id} points at a real page`);
    assert.equal(canonicalFor(a.id), canonicalFor(target.id));
    assert.equal(ogImageFor(a.id), ogImageFor(target.id));
    assert.ok(!LISTED_ROUTES.includes(a), `${a.id} is not in the sitemap`);
  }
});
