# LvTS website roadmap

The plan for fijianblood.github.io/lvts, kept here so any future work session
can pick up where the last one stopped. Update it when a step is done or the
plan changes.

Last updated: 15 November 2026.

## Where the site is now

- **This is the official LomaVata Tech Services website, not a portfolio.**
- **Services page = PS5 service first** (`src/components/Ps5Service.tsx`): bench video
  (`public/services/ps5-service.mp4`), signs, what's included, liquid metal, questions to ask,
  then the owner's interactive 3D **PS5 Repair Map** (`public/services/ps5-repair-map.html`,
  three.js 0.147 from jsDelivr, noindex). The map loads only on tap; embedded on desktop it never
  scrolls inside and the wheel scrolls the page (Ctrl + scroll zooms); phones and touch tablets
  open it as its own page. Then PC repair, Vitikart, gas ovens, Website Design. No PS5 price on
  purpose ("quoted before we start").
- **Pages (14 in Google):** Home, Services (with a Website Design section),
  Loma (was Ask LvTS, at /loma/), Rewards, Noqublox, Kids (Noqu Vuli + Little Chef), LabVIEW Help,
  Free Tools (image to PDF, PDF merge, photo sketch), MediTrack, Activation,
  Blog, and one page per blog post.
- **Old addresses still work:** `/little-chef/` opens its tab on Kids; the
  removed `/whiteboard/` and `/seo-tools/` open Free Tools (`aliasOf` in
  `src/data/routes.ts`).
- **Every page has its own link-preview image** in `public/og/`, made by
  `python3 tools/og/make_og.py`. Run it after adding a page or blog post.
- **Blog:** posts are Markdown in `src/blog/posts/`, listed in
  `src/data/blogPosts.ts`. Each gets its own address and sitemap entry.
- **Loma (chat):** Cloudflare Worker `lvts-loma` calling Claude, now kept in
  `workers/loma/` and deployed by `.github/workflows/loma-server.yml`; key stored
  as the Worker secret `ANTHROPIC_API_KEY`. Visitors can attach photos, PDFs,
  Word/Excel/PowerPoint and text files (up to 50 MB each, stored in Claude's Files
  API for 24 hours), and minimize the chat. The privacy note is behind a small
  "Privacy" link under the message box. Shared answers in
  Supabase (`loma_conversations`); conversations with files are never saved there.

## Owner decisions on record

- **Keep the Activation page as it is.** Don't change or remove it.
- **Keep MediTrack** in the menu and in Google. It will store records in
  accounts once the database exists (below).
- **Keep Loma (formerly Ask LvTS).** It will grow into the accounts platform (below).
- LinkedIn certificates were removed from the site on purpose.
- The SEO tool, the Whiteboard and the client-site portfolio were removed on purpose.
  Don't add client sites to the website.
- Blog posts are reviewed and approved by the owner before going live.

## Next: accounts, memory and uploads (Loma, then MediTrack)

Goal: people sign in on the Loma page; Loma remembers each person; they can upload
photos, PDFs, documents and videos; LvTS can later host accounts for customers.

Proposed stack (services already in use):

| Part | Service | Notes |
|---|---|---|
| Sign-in and database | Supabase | Free plan to start; Pro about US$25/month when needed |
| Files and videos | Cloudflare R2 | 10 GB free/month, no charge for downloads |
| AI | `lvts-loma` Worker (Claude) | Per-account limits so costs can't run away |

Steps:

1. **Lock down security first.** The Supabase key in `src/lib/useLvtsChat.ts`
   is public (normal for Supabase), so `loma_conversations` must have
   row-level security that limits what that key can do. Check and fix before
   any personal data goes in.
2. **Accounts and memory:** sign-in (email and/or Google), saved chats, saved
   facts per person.
3. **Photos and PDFs:** private per account; Loma can read them.
4. **Videos and any file type:** per-account gallery with storage limits.
5. **MediTrack in accounts:** strictest privacy (owner-only, nothing shared
   with Loma unless the person chooses), with a clear privacy note.
6. **Hosting accounts for customers:** possibly paid plans.

Before opening to the public: privacy policy and terms, malware checks on
uploads, a way to report content, storage and message limits, and backups.

Decided (15 Nov 2026): accounts for the owner only at first, to test; sign in
with an email link; a new Supabase project (the owner is creating it). The
database setup is ready in `supabase/migrations/001_loma_accounts.sql`
(sign-ups limited to `allowed_emails`, owner-only row level security on every
table).

Open questions for the owner:

- Who gets accounts first (owner only, customers, everyone)?
- Sign-in with email, Google, or both?
- Free, paid, or free with paid upgrades?

## Blog plan

- 2 to 3 original posts a week on tech that matters in Fiji and the Pacific:
  scams, security, Windows fixes, internet and mobile, AI, small-business tech.
- Each post: our own words, original sources linked, what it means locally,
  how LvTS can help. No copying news articles; no mass-produced posts.
- Option: a scheduled task drafts posts and opens a pull request for the owner
  to approve. Waiting on the owner for frequency and topics to avoid.

## Google and growth

- Re-submit `https://fijianblood.github.io/lvts/sitemap.xml` in Search Console
  after big changes.
- Google Business Profile: right category, photos, real customer reviews.
- Links from other Fiji websites (clients, partners, directories).
