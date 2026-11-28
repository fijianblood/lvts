# LvTS website: project notes (short handoff)

Add this file to the Claude Project so new chats start with the context and don't need it
re-explained. Last updated 15 November 2026.

## The business and the site
- LomaVata Tech Services (LvTS), Raiwai, Suva, Fiji. Phone 833 1088, WhatsApp +679 746 6941.
- Website: https://fijianblood.github.io/lvts (repo `fijianblood/lvts`). Copy on Cloudflare:
  https://lvts.lomavatatechfiji.workers.dev
- **The official LvTS website, not a portfolio.** Goal: rank well on Google and bring in work.
- Built with React + TypeScript + Vite. Pushing to `main` publishes it automatically.

## Owner rules (always follow)
- Keep **MediTrack** and **Loma**.
- No client sites, LinkedIn certificates, SEO tool or whiteboard on the site (removed on purpose).
- Loma's privacy note stays hidden behind the small "Privacy" link.
- Blog posts are approved by the owner before going live.
- Nothing is merged or published without the owner's OK.
- Never paste secrets (keys, passwords) in chat. Don't put the owner's email in the code.

## Pages
Home, Services, Loma (/loma/, was Ask LvTS), Rewards, Noqublox, Kids (Noqu Vuli + Little Chef),
LabVIEW Help, Neuron Lab (/neuron-lab/) + its guide (/neuron-lab/learn/), Free Tools, MediTrack,
Blog + one page per post. 15 pages in the sitemap.
Each page has its own Google title, description and link-preview image.

## Neuron Lab (/neuron-lab/ and /neuron-lab/learn/)
- One artificial neuron (perceptron) visitors play with by hand, then teach AND, OR or NOT
  (XOR never finishes, on purpose). All in the browser: no sign-in, nothing sent anywhere.
- Maths in `src/lib/perceptron.ts` (learning rate 0.1, stops when all four are right or after
  100 rounds), tested in `tests/site/perceptron.test.ts`. Page: `src/pages/NeuronLabPage.tsx`,
  drawing: `src/components/neuron/NeuronDiagram.tsx`.
- Guide: `src/pages/NeuronLearnPage.tsx` (owner's learning notes, parts 1 to 7). Its worked
  example and chart are computed by the same code (`src/lib/neuronExamples.ts`).

## Services page (PS5 first)
- Top: PS5 overheating / loud / shutting down. Full teardown, deep dust clean, liquid metal,
  tested under load. Price quoted before starting (no fixed price shown, on purpose).
- Owner's bench video, then the owner's interactive **3D PS5 Repair Map** (original PS5 disc
  edition, steps and screw counts from iFixit, credited). The map loads only when tapped. On a
  computer the wheel scrolls the page and Ctrl + scroll zooms the model; phones and tablets open
  it as its own page.
- Then other services: PC & laptop repair (from FJD $25), Vitikart store setup, commercial gas
  ovens, website design.

## Loma (AI chat)
- Runs on Claude through the Cloudflare Worker `lvts-loma`. Visitors can attach photos, PDFs,
  Word, Excel, PowerPoint and text files (up to 50 MB each, kept 24 hours), and minimize the chat.
- Describe it to visitors as an "AI assistant" (its brain is Claude by Anthropic).
- Plan: accounts (sign in by email link, owner-only to start), saved chats, memory, then files,
  then MediTrack in accounts, then customer accounts. The database setup is ready in
  `supabase/migrations/001_loma_accounts.sql`.

## Status right now
- **Waiting for the owner's OK to merge** the branch `claude/zealous-einstein-livwpm`:
  PS5 Services page + video + 3D map (scroll fix included), smaller menu logo, Loma accounts
  database file. All tested on a local copy; not yet live.
- **Waiting for the owner:** a new Supabase project for Loma accounts. Send the Project URL and
  the public (anon/publishable) key in chat; anything secret goes through the secure form, not chat.
- Not decided yet: blog schedule and topics; free or paid Loma accounts.

## Ideas not started
- Shrink `payment-methods.png` (217 KB, loads on every page).
- Google Business Profile: right category, photos, real reviews. Re-submit the sitemap in
  Search Console after big changes.
