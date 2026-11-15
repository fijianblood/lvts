// Loads blog post Markdown (src/blog/posts/*.md) and small helpers for the blog pages.

const FILES = import.meta.glob('../blog/posts/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

/** The Markdown body of a post, or '' if its file is missing. */
export function postMarkdown(slug: string): string {
  return FILES[`../blog/posts/${slug}.md`] ?? '';
}

/** Reading time at about 200 words a minute, at least 1. */
export function readMinutes(markdown: string): number {
  const words = markdown.replace(/[`*_#>|[\]()-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** "2026-11-15" as "15 November 2026" (the date as written, whatever the visitor's time zone). */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}
