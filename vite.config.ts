import { randomBytes } from 'node:crypto'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { encodePrizeCodes } from './src/game/house/prizeCodec.ts'

export default defineConfig(({ mode }) => {
  // House Hunt prize codes come from the HOUSE_PRIZE_CODES secret (GitHub Actions)
  // or .env.local, never from the repo. They are scrambled with a fresh salt on
  // every build. See src/game/house/prizeCodec.ts.
  const env = loadEnv(mode, process.cwd(), '')
  const rawCodes = process.env.HOUSE_PRIZE_CODES ?? env.HOUSE_PRIZE_CODES
  const { bundle: housePrize, warnings } = encodePrizeCodes(rawCodes, randomBytes(12).toString('hex'))
  for (const w of warnings) console.warn(`[house-hunt] ${w}`)
  console.log(`[house-hunt] ${housePrize.entries.length} prize code(s) loaded${housePrize.until ? `, contest ends ${housePrize.until}` : ''}`)

  return {
    base: '/lvts/',
    define: {
      __HOUSE_PRIZE__: JSON.stringify(housePrize),
    },
    plugins: [
      react(),
      tailwindcss(),
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
          start_url: '/lvts/',
          scope: '/lvts/',
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
          navigateFallback: '/lvts/index.html',
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
