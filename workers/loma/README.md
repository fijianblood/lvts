# Loma chat server (`lvts-loma`)

The Cloudflare Worker behind Loma, the chat assistant on the LvTS website. The
site (`src/lib/useLvtsChat.ts`) sends the conversation here and this calls
Claude.

- **Files:** `POST /upload` takes one file as the raw request body (photos,
  PDFs and text, up to 50 MB) and stores it in Claude's Files API, where it
  expires after 24 hours. Chat messages then refer to it by file id, so they stay
  small: Cloudflare's free plan allows only about 10 ms of processing per request,
  and the upload is passed on without being read in JavaScript. The browser
  resizes photos and pulls the text out of Word, Excel, PowerPoint and text files
  first (`src/lib/chatFiles.ts`).
- **Limits:** 50 MB per file (Cloudflare allows 100 MB per request on the free
  plan; the rest is headroom for the Worker's 128 MB of memory). Claude reads up to
  600 pages of a PDF, and a whole conversation must fit its context window.
- **Checks:** `src/validate.ts` only lets through text and uploaded files by id,
  rebuilt field by field, with size and count limits; uploads are checked by size,
  type and name before they are read.
- **Who can call it:** only the site's two addresses (GitHub Pages and the
  Cloudflare copy).
- **Model:** `LOMA_MODEL` in `wrangler.jsonc`.
- **Key:** the Worker secret `ANTHROPIC_API_KEY` (Cloudflare dashboard → Workers →
  lvts-loma → Settings → Variables and Secrets). Deploying new code keeps it.

```bash
npm ci
npm test            # the message checks
npx tsc --noEmit    # type-check
```

Deploys automatically from `main` when this folder changes
(`.github/workflows/loma-server.yml`).
