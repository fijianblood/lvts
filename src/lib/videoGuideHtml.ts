// Builds the standalone /lvts/save-your-videos/ page as plain HTML at build time
// (see vite.config.ts). The app's own pages live behind #hash links, which search
// engines don't index as separate pages; this one is a real URL with its own
// title and description, readable without JavaScript.
import { CHECKED_ON, GUIDE_DESCRIPTION, GUIDE_TITLE, OTHER_PEOPLES_VIDEOS, VIDEO_GUIDES } from '../data/videoGuides.ts';

export const GUIDE_PATH = 'save-your-videos/';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const accent = (g: { color: string; darkColor?: string }) => `--c:${g.color}${g.darkColor ? `;--cd:${g.darkColor}` : ''}`;

export function videoGuideHtml(base: string, canonical: string): string {
  const toc = VIDEO_GUIDES.map(g => `<a href="#${g.id}" style="${accent(g)}">${esc(g.name)}</a>`).join('');

  const sections = VIDEO_GUIDES.map(g => `
    <section id="${g.id}" style="${accent(g)}">
      <h2>${esc(g.name)}</h2>
      <p class="summary">${esc(g.summary)}</p>
      ${g.methods.map(m => `
      <div class="method">
        <h3>${esc(m.title)}</h3>
        <ol>${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        ${m.notes?.length ? `<ul class="notes">${m.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
      </div>`).join('')}
      <p class="sources">Official help: ${g.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ')}</p>
    </section>`).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(GUIDE_TITLE)} | LvTS</title>
<meta name="description" content="${esc(GUIDE_DESCRIPTION)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(GUIDE_TITLE)}">
<meta property="og:description" content="${esc(GUIDE_DESCRIPTION)}">
<meta property="og:url" content="${esc(canonical)}">
<link rel="icon" type="image/png" href="${base}favicon.png">
<meta name="theme-color" content="#0f172a">
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; --card:#fff; --accent:#2563eb; }
  @media (prefers-color-scheme: dark) { :root { --ink:#e2e8f0; --muted:#94a3b8; --line:#1e293b; --bg:#0b1220; --card:#0f172a; --accent:#60a5fa; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  .wrap { max-width:760px; margin:0 auto; padding:2rem 1rem 4rem; }
  header a.home { color:var(--accent); font-weight:700; text-decoration:none; font-size:.9rem; }
  h1 { font-size:clamp(1.6rem,5vw,2.4rem); line-height:1.15; margin:1rem 0 .75rem; }
  .lead { color:var(--muted); margin:0 0 .5rem; }
  .checked { color:var(--muted); font-size:.8rem; margin:0 0 1.5rem; }
  nav.toc { display:flex; flex-wrap:wrap; gap:.5rem; margin-bottom:2rem; }
  nav.toc a { border:1px solid var(--line); border-left:4px solid var(--c); background:var(--card); color:var(--ink); padding:.4rem .8rem; border-radius:8px; text-decoration:none; font-weight:600; font-size:.9rem; }
  section { background:var(--card); border:1px solid var(--line); border-top:4px solid var(--c); border-radius:14px; padding:1.25rem 1.25rem .75rem; margin-bottom:1.5rem; }
  h2 { margin:0 0 .25rem; font-size:1.5rem; }
  .summary { color:var(--muted); margin:0 0 1rem; }
  .method { border-top:1px solid var(--line); padding-top:.75rem; margin-bottom:.75rem; }
  h3 { font-size:1.05rem; margin:0 0 .4rem; }
  ol { margin:0 0 .5rem; padding-left:1.4rem; }
  ol li { margin-bottom:.25rem; }
  ul.notes { margin:0 0 .5rem; padding-left:1.2rem; color:var(--muted); font-size:.9rem; }
  .sources { font-size:.8rem; color:var(--muted); border-top:1px solid var(--line); padding-top:.6rem; overflow-wrap:anywhere; }
  .sources a, .callout a { color:var(--accent); }
  .callout { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:1.25rem; margin-bottom:1.5rem; }
  .callout h2 { font-size:1.2rem; }
  footer { color:var(--muted); font-size:.85rem; text-align:center; margin-top:2rem; }
  @media (prefers-color-scheme: dark) {
    nav.toc a { border-left-color: var(--cd, var(--c)); }
    section { border-top-color: var(--cd, var(--c)); }
  }
</style>
</head>
<body>
<div class="wrap">
  <header><a class="home" href="${base}">← LomaVata Tech Services</a></header>
  <h1>${esc(GUIDE_TITLE)}</h1>
  <p class="lead">${esc(GUIDE_DESCRIPTION)}</p>
  <p class="checked">Steps checked against each platform's official help pages on ${esc(CHECKED_ON)}. Apps change their menus often — if yours looks different, follow the official help link under each section.</p>
  <nav class="toc" aria-label="Platforms">${toc}</nav>
  ${sections}
  <div class="callout">
    <h2>What about other people's videos?</h2>
    <p>${esc(OTHER_PEOPLES_VIDEOS)}</p>
  </div>
  <div class="callout">
    <h2>Need a hand?</h2>
    <p>Phone full, lost videos, or can't open the export file? LomaVata Tech Services in Raiwai, Suva can help. <a href="${base}#contact">Get in touch</a>.</p>
  </div>
  <footer>© LomaVata Tech Services · Suva, Fiji · Not affiliated with YouTube, TikTok, Meta or X.</footer>
</div>
</body>
</html>
`;
}
