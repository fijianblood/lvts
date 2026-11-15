# Loma chat server (`lvts-loma`)

The Cloudflare Worker behind Loma, the chat assistant on the LvTS website. The
site (`src/lib/useLvtsChat.ts`) sends the conversation here and this calls
Claude.

- **Files:** visitors can attach photos (JPEG/PNG/GIF/WebP), PDFs and text
  documents. The browser resizes photos and pulls the text out of Word, Excel,
  PowerPoint and text files before sending (`src/lib/chatFiles.ts`).
- **Checks:** `src/validate.ts` only lets through text, images, PDFs and plain-text
  documents, rebuilt field by field, with size and count limits.
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
