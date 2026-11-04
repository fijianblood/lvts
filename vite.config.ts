import { randomBytes } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { encodePrizeCodes } from './src/game/house/prizeCodec.ts'
import { SHOP_PROMOS, PROMO_CODE } from './src/game/house/promos.ts'
import { ROUTES, canonicalFor, pathFor, type PageRoute } from './src/data/routes.ts'

// Every page has a real address (/lvts/services/), and GitHub Pages only serves
// files that exist, so after the build this writes one HTML file per page
// (dist/services/index.html, ...) from dist/index.html. Each has the page's own
// title, description and canonical address for Google and link previews, and a
// heading, summary and links to every page inside #root, which the app replaces
// as soon as it starts. It also writes sitemap.xml (every page) and 404.html.
// The pages, their addresses and their wording are in src/data/routes.ts.
function pageFiles(base: string): Plugin {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const tag = (attr: 'name' | 'property', key: string) => new RegExp(`<meta ${attr}="${key}" content="[^"]*"\\s*/?>`)
  function swap(html: string, re: RegExp, value: string, what: string) {
    if (!re.test(html)) throw new Error(`[pages] index.html has no ${what} to replace`)
    return html.replace(re, () => value)
  }
  const listed = ROUTES.filter((r) => r.index !== false)
  const links = listed.map((r) => `<a href="${pathFor(r.id, base)}" style="color:#2563eb;margin:0 .5rem;white-space:nowrap">${esc(r.label)}</a>`).join(' ')
  const body = (heading: string, text: string) =>
    `<div style="max-width:760px;margin:0 auto;padding:120px 24px 60px;text-align:center;font-family:'Space Grotesk',system-ui,sans-serif;color:#0f172a">` +
    `<h1 style="font-family:'Syne',system-ui,sans-serif;font-size:clamp(1.6rem,4vw,2.3rem);line-height:1.2;margin:0 0 1rem">${esc(heading)}</h1>` +
    `<p style="color:#475569;line-height:1.7;margin:0 0 1.5rem">${esc(text)}</p>` +
    `<nav aria-label="Pages" style="font-size:.9rem;line-height:2.2">${links}</nav></div>`

  function pageHtml(shell: string, r: PageRoute) {
    const url = canonicalFor(r.id)
    let html = shell
    html = swap(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`, 'title')
    html = swap(html, tag('name', 'description'), `<meta name="description" content="${esc(r.description)}" />`, 'description')
    html = swap(html, /<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`, 'canonical link')
    html = swap(html, tag('property', 'og:url'), `<meta property="og:url" content="${url}" />`, 'og:url')
    html = swap(html, tag('property', 'og:title'), `<meta property="og:title" content="${esc(r.title)}" />`, 'og:title')
    html = swap(html, tag('property', 'og:description'), `<meta property="og:description" content="${esc(r.description)}" />`, 'og:description')
    html = swap(html, tag('name', 'twitter:title'), `<meta name="twitter:title" content="${esc(r.title)}" />`, 'twitter:title')
    html = swap(html, tag('name', 'twitter:description'), `<meta name="twitter:description" content="${esc(r.description)}" />`, 'twitter:description')
    if (r.index === false) html = html.replace('</title>', '</title>\n    <meta name="robots" content="noindex" />')
    return swap(html, /<div id="root"><\/div>/, `<div id="root">${body(r.heading, r.description)}</div>`, '<div id="root">')
  }

  return {
    name: 'lvts-page-files',
    apply: 'build',
    writeBundle(options) {
      const out = options.dir ?? 'dist'
      const shell = readFileSync(join(out, 'index.html'), 'utf8')
      for (const r of ROUTES) {
        const dir = r.slug ? join(out, r.slug) : out
        mkdirSync(dir, { recursive: true })
        writeFileSync(join(dir, 'index.html'), pageHtml(shell, r))
      }
      // GitHub Pages sends this (with a "not found" status) for any address that isn't a page.
      // The app then shows the home page.
      let notFound = swap(shell, /<title>[\s\S]*?<\/title>/, '<title>Page not found | LomaVata Tech Services</title>\n    <meta name="robots" content="noindex" />', 'title')
      notFound = swap(notFound, /<link rel="canonical" href="[^"]*"\s*\/?>/, '', 'canonical link')
      notFound = swap(notFound, /<div id="root"><\/div>/, `<div id="root">${body('Page not found', "That page isn't here any more. Try one of these:")}</div>`, '<div id="root">')
      writeFileSync(join(out, '404.html'), notFound)
      const urls = listed.map((r) => `  <url>\n    <loc>${canonicalFor(r.id)}</loc>\n  </url>`).join('\n')
      writeFileSync(join(out, 'sitemap.xml'),
        `<?xml version="1.0" encoding="UTF-8"?>\n<!-- Written by the build from src/data/routes.ts. Submit it in Google Search Console. -->\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
      console.log(`[pages] wrote ${ROUTES.length} page files, 404.html and sitemap.xml (${listed.length} addresses)`)
    },
  }
}

export default defineConfig(({ mode }) => {
  // The site is hosted in two places from this repo:
  //  - GitHub Pages (.github/workflows/deploy.yml) serves it at fijianblood.github.io/lvts/
  //  - Cloudflare Workers Builds (wrangler.jsonc) serves it at the root of its address.
  // Workers Builds sets WORKERS_CI=1, so the build picks the right base path by itself.
  const base = process.env.WORKERS_CI === '1' ? '/' : '/lvts/'
  console.log(`[site] base path: ${base}${base === '/' ? ' (Cloudflare)' : ' (GitHub Pages)'}`)

  // Noqublox prize codes come from the HOUSE_PRIZE_CODES secret (GitHub Actions)
  // or .env.local, never from the repo. They are scrambled with a fresh salt on
  // every build. See src/game/house/prizeCodec.ts.
  const env = loadEnv(mode, process.cwd(), '')
  const rawCodes = process.env.HOUSE_PRIZE_CODES ?? env.HOUSE_PRIZE_CODES
  const { bundle: housePrize, warnings } = encodePrizeCodes(rawCodes, randomBytes(12).toString('hex'))
  for (const w of warnings) console.warn(`[house-hunt] ${w}`)
  console.log(`[house-hunt] ${housePrize.entries.length} prize code(s) loaded${housePrize.until ? `, contest ends ${housePrize.until}` : ''}`)
  // The hidden reward cards in Damodar City's Digicel and Vodafone shops: 8-digit codes from
  // DIGICEL_PROMO_CODES and VODAFONE_PROMO_CODES, the same format and scrambling (see promos.ts).
  const shopPromos = Object.fromEntries(SHOP_PROMOS.map((p) => {
    const { bundle, warnings: w } = encodePrizeCodes(process.env[p.secret] ?? env[p.secret], randomBytes(12).toString('hex'), PROMO_CODE)
    for (const msg of w) console.warn(`[house-hunt] ${p.secret}: ${msg}`)
    console.log(`[house-hunt] ${p.shop} reward: ${bundle.entries.length} code(s) loaded${bundle.until ? `, ends ${bundle.until}` : ''}`)
    return [p.id, bundle]
  }))
  // The neighbourhood server (workers/neighbourhood). Set NEIGHBOURHOOD_API to change it, or to 'off' for none.
  const hoodRaw = process.env.NEIGHBOURHOOD_API ?? env.NEIGHBOURHOOD_API
  const hood = hoodRaw === 'off' ? '' : hoodRaw || 'https://lvts-neighbourhood.lomavatatechfiji.workers.dev'
  console.log(`[house-hunt] neighbourhood server: ${hood || 'off'}`)

  return {
    base,
    define: {
      __HOUSE_PRIZE__: JSON.stringify(housePrize),
      __SHOP_PROMOS__: JSON.stringify(shopPromos),
      __NEIGHBOURHOOD_API__: JSON.stringify(hood),
    },
    plugins: [
      react(),
      tailwindcss(),
      pageFiles(base),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'LomaVata Tech Services',
          short_name: 'LvTS',
          description: 'IT Sales Pro, Web Dev, Laptop & PC Repair in Raiwai, Suva, Fiji.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          ],
        },
        workbox: {
          // Precache only the true app shell: the eagerly-loaded entry JS/CSS,
          // the HTML shell, and small icons. ToolsPage's heavy dynamic imports
          // (heic2any, jspdf, html2canvas) and all photos/videos are NOT
          // precached — they're cached lazily via runtimeCaching below the
          // first time they're actually requested, so a first-time visitor
          // isn't forced to download megabytes of code/media they never use.
          globPatterns: ['index.html', 'favicon.png', 'pwa-192.png', 'pwa-512.png', 'apple-touch-icon.png', 'icons.svg', 'assets/index-*.js', 'assets/index-*.css'],
          navigateFallback: `${base}index.html`,
          // Don't hijack direct navigations to real static files (images, videos,
          // pdfs, etc — anything with a file extension) — only fall back to the
          // SPA shell for actual app routes. Without this, clicking a
          // target="_blank" link straight to e.g. /lvts/rammap.png gets
          // intercepted as a navigation and incorrectly redirected to index.html.
          navigateFallbackDenylist: [/\.[a-zA-Z0-9]{2,5}$/],
          runtimeCaching: [
            {
              // Any other hashed JS/CSS chunk (dynamic imports like jspdf,
              // heic2any, html2canvas) — filenames are content-hashed so it's
              // safe to cache forever once actually fetched.
              urlPattern: ({ url, request }) => (request.destination === 'script' || request.destination === 'style') && url.pathname.includes('/assets/'),
              handler: 'CacheFirst',
              options: {
                cacheName: 'lvts-assets',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'lvts-images',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'video',
              handler: 'CacheFirst',
              options: {
                cacheName: 'lvts-videos',
                expiration: { maxEntries: 6, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
                rangeRequests: true,
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                cacheableResponse: { statuses: [0, 200] },
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
      }),
    ],
  }
})
