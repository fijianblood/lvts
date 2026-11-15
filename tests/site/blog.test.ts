// Run with: npm run test:site
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { BLOG_POSTS } from '../../src/data/blogPosts.ts';
import { pageFromPath, routeById } from '../../src/data/routes.ts';

test('every post has its Markdown file, with no title line of its own', () => {
  for (const p of BLOG_POSTS) {
    const file = `src/blog/posts/${p.slug}.md`;
    assert.ok(existsSync(file), `${file} is missing`);
    const md = readFileSync(file, 'utf8');
    assert.ok(md.trim().length > 500, `${file} looks empty`);
    assert.ok(!/^# /m.test(md), `${file} has a "# " title line; the page shows the title from blogPosts.ts`);
  }
});

test('posts have unique slugs, real dates, and are newest first', () => {
  assert.equal(new Set(BLOG_POSTS.map((p) => p.slug)).size, BLOG_POSTS.length);
  for (const p of BLOG_POSTS) {
    assert.match(p.date, /^\d{4}-\d{2}-\d{2}$/, p.slug);
    assert.ok(!Number.isNaN(Date.parse(p.date)), p.slug);
    assert.ok(p.seoTitle.endsWith(' | LvTS'), `${p.slug} seoTitle should end with " | LvTS"`);
  }
  const dates = BLOG_POSTS.map((p) => p.date);
  assert.deepEqual(dates, [...dates].sort().reverse(), 'BLOG_POSTS must be newest first');
});

test('each post has its own page address', () => {
  for (const p of BLOG_POSTS) {
    assert.ok(routeById(`post-${p.slug}`), p.slug);
    for (const base of ['/lvts/', '/']) {
      assert.equal(pageFromPath(`${base}blog/${p.slug}/`, base), `post-${p.slug}`);
      assert.equal(pageFromPath(`${base}blog/${p.slug}`, base), `post-${p.slug}`);
    }
  }
  assert.equal(pageFromPath('/lvts/blog/', '/lvts/'), 'blog');
});
