// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { ROUTES, SITE_URL, canonicalFor, pageFromPath, pathFor, routeById } from '../../src/data/routes.ts';

const BASES = ['/lvts/', '/'];

test('ids and addresses are unique, and only home has an empty address', () => {
  assert.equal(new Set(ROUTES.map((r) => r.id)).size, ROUTES.length);
  assert.equal(new Set(ROUTES.map((r) => r.slug)).size, ROUTES.length);
  assert.deepEqual(ROUTES.filter((r) => r.slug === '').map((r) => r.id), ['home']);
  for (const r of ROUTES) assert.match(r.slug, /^$|^[a-z0-9]+(-[a-z0-9]+)*$/, r.id);
});

test('every page address turns back into its page, on both hosts', () => {
  for (const base of BASES) {
    for (const r of ROUTES) {
      const path = pathFor(r.id, base);
      assert.equal(pageFromPath(path, base), r.id, path);
      if (r.slug) {
        assert.equal(pageFromPath(path.slice(0, -1), base), r.id, `${path} without the last /`);
        assert.equal(pageFromPath(`${path}index.html`, base), r.id, `${path}index.html`);
      }
    }
  }
  assert.equal(pageFromPath('/lvts', '/lvts/'), 'home');
  assert.equal(pageFromPath('/lvts/index.html', '/lvts/'), 'home');
});

test('addresses that are not pages are not mistaken for one', () => {
  for (const p of ['/lvts/nope/', '/lvts/services/extra/', '/other/services/', '/lvts/house/', '/lvts/contact/']) {
    assert.equal(pageFromPath(p, '/lvts/'), null, p);
  }
  assert.equal(pageFromPath('/meditrack/app.html', '/'), null);
});

test('canonical addresses are all on the main site', () => {
  assert.equal(canonicalFor('home'), SITE_URL);
  assert.equal(canonicalFor('services'), `${SITE_URL}services/`);
  for (const r of ROUTES) assert.ok(canonicalFor(r.id).startsWith(SITE_URL));
});

test('titles and descriptions fit what Google shows', () => {
  for (const r of ROUTES.filter((x) => x.index !== false)) {
    assert.ok(r.title.length <= 62, `${r.id} title is ${r.title.length} characters`);
    assert.ok(r.description.length >= 70 && r.description.length <= 160, `${r.id} description is ${r.description.length} characters`);
    assert.ok(r.heading.length > 0 && r.label.length > 0, r.id);
  }
  assert.equal(new Set(ROUTES.map((r) => r.title)).size, ROUTES.length, 'every title is different');
});

test('the admin page is kept out of Google', () => {
  assert.equal(routeById('neighbours-admin')?.index, false);
});

test('no page address would overwrite a file in public/', () => {
  for (const r of ROUTES.filter((x) => x.slug)) {
    assert.ok(!existsSync(`public/${r.slug}/index.html`), `public/${r.slug}/index.html would be replaced by the ${r.id} page`);
    assert.ok(!existsSync(`public/${r.slug}.html`), r.slug);
  }
});

test('every page in the menu has an address, and the app can show every address', () => {
  const sitePages = readFileSync('src/data/sitePages.ts', 'utf8');
  const menuIds = [...sitePages.matchAll(/\{ id: '([^']+)'/g)].map((m) => m[1]);
  for (const id of menuIds) assert.ok(routeById(id), `menu page ${id} has no address in routes.ts`);
  const app = readFileSync('src/App.tsx', 'utf8');
  for (const r of ROUTES) assert.ok(app.includes(`case '${r.id}':`), `App.tsx renderPage has no case for ${r.id}`);
});
