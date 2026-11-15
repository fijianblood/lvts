# LomaVata Tech Services website

The official website of LomaVata Tech Services (LvTS), Raiwai, Suva, Fiji:
<https://fijianblood.github.io/lvts/>

React + TypeScript, built with Vite. The plan, the owner's decisions and what
comes next are in [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Run and check

```bash
npm ci
npm run dev          # local site
npm run build        # production build in dist/ (one HTML file per page + sitemap)
npm run lint
npm run test:site    # pages, addresses, blog, preview images, kit protocol
npm run test:game    # Noqublox
npm run test:tools   # photo sketch tool
```

## Where things are

- **Pages:** `src/pages/`; their addresses, titles and descriptions in
  `src/data/routes.ts`; the menu in `src/data/sitePages.ts`.
- **Blog posts:** Markdown in `src/blog/posts/`, listed in `src/data/blogPosts.ts`.
- **Link-preview images:** `public/og/`, made by `python3 tools/og/make_og.py`
  (needs Python with Pillow, and Node). Run it after adding a page or post.
- **Noqublox game:** `src/game/house/`; its neighbourhood server is in
  `workers/neighbourhood/`.
- **Arduino kit firmware** for the LabVIEW page: `src/kit/lvts_kit.ino`.

## Publishing

Pushing to `main` publishes the site to GitHub Pages
(`.github/workflows/deploy.yml`). Cloudflare Workers Builds publishes the
Cloudflare copy (`wrangler.jsonc`).
