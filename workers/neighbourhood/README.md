# LvTS Neighbourhood server

Keeps the characters visitors make in Noqublox's character creator, so
they stay in the neighbourhood for everyone, and runs the **shared world**:
everyone exploring at the same time sees each other walk around and can chat.
A Cloudflare Worker with one Durable Object, which keeps the characters,
reports and bans in its own SQLite database and holds the players' WebSockets.
It runs on Cloudflare's free Workers plan.

- New characters wait for approval; nobody else sees them until LvTS approves
  them on the site's hidden admin page: `https://fijianblood.github.io/lvts/neighbours-admin/`.
- Names are first names or nicknames only: 2–16 letters, no numbers, links or
  symbols. Looks are picked from fixed lists, so nothing else a visitor types is stored.
- The creator gets a secret key (kept on their device) to change or delete
  their character. Changing the name sends it back for approval.
- At most 3 new characters per visitor per day (visitors are told apart by a
  salted hash of their IP address; the address itself is never stored), and no
  new ones while 300 are waiting.
- Only the Noqublox site (and local development) can call it from a browser.

### The shared world

- Explore mode only: the hunt (and its prize) stays a game you play on your own.
- Up to 40 players at once; anyone after that explores on their own and the
  game tries again a minute later. Positions go out about 6 times a second.
- Names: a character LvTS has approved shows its own name (checked with its
  secret key). Everyone else is "Visitor 12", and someone playing as a family
  member shows "as Josese" under it, so nobody can pass themselves off as LvTS
  or the family.
- **Chat** is typed (up to 100 characters), and checked here as well as in the
  game. A message is not sent if it has rude words (English and Fiji Hindi,
  however they're spelled) or anything that looks like a way to find or
  contact someone: phone numbers (even spelled out), emails, links, social
  media names, "where do you live", "what school", "meet up". Three blocked
  messages in 5 minutes and that player can't chat for 10 minutes. No filter
  catches everything, so:
- **Report**: any player can report another (rude, personal details, spam,
  other). The report keeps the reported player's last 20 lines of chat;
  messages the filter stopped are kept only as "not sent", never what they said.
- **Bans**: on the admin page LvTS sees the reports, who's in the world now,
  and can ban a visitor for 1, 7 or 30 days (they're removed straight away).
  Visitors are told apart by the salted hash of their internet address, so a
  ban can also catch others on the same Wi-Fi, and a different connection gets
  round it.
- Chat isn't stored, except the lines kept with a report. When nobody is
  connected the Durable Object sleeps and costs nothing.

**Free plan limits** ([Cloudflare's pricing page](https://developers.cloudflare.com/durable-objects/platform/pricing)):
100,000 requests a day, where each connection counts as one and incoming
WebSocket messages count 20 to 1. Players send about 5
messages a second while they move, so that's very roughly 100 player-hours of
moving about a day. Past it, the shared world stops until 00:00 UTC (12 noon in
Fiji) and the game carries on with everyone exploring on their own.

## Setting it up (once)

1. Cloudflare dashboard → **My Profile → API Tokens → Create Token** → use the
   **Edit Cloudflare Workers** template, scoped to your account. Copy the token.
2. Copy your **Account ID** (Workers & Pages overview, right-hand side).
3. GitHub → this repo → **Settings → Secrets and variables → Actions → New repository secret**, add:
   - `CLOUDFLARE_API_TOKEN` — the token
   - `CLOUDFLARE_ACCOUNT_ID` — the account ID
   - `NEIGHBOURHOOD_ADMIN_TOKEN` — a long random password (16+ characters) for approving characters
4. **Actions → Deploy neighbourhood server → Run workflow.** It deploys to
   `https://lvts-neighbourhood.<your-subdomain>.workers.dev`.

The settings are in `wrangler.jsonc`. Keep it a `.jsonc` file: Wrangler looks
for `wrangler.jsonc` in the folders above before it looks for a
`wrangler.toml` here, so a `.toml` loses to the website's `wrangler.jsonc` in
the repo's top folder and `wrangler deploy` would pick up the website instead.

The site expects `https://lvts-neighbourhood.lomavatatechfiji.workers.dev` (the
same Cloudflare account as the Loma chatbot). If yours is different, add a
repository **variable** (not a secret) `NEIGHBOURHOOD_API` with the address and
re-run the Pages deploy.

## API

| Call | What it does |
|---|---|
| `GET /characters` | Approved characters (newest 60) |
| `POST /characters` `{ name, look }` | Make one → `{ id, key, status: 'pending' }` |
| `POST /characters/:id` `{ key }` | The creator checks its status |
| `PUT /characters/:id` `{ key, name, look }` | Change it |
| `DELETE /characters/:id` `{ key }` | Delete it |
| `GET /admin/pending`, `GET /admin/approved` | Lists (needs `Authorization: Bearer <admin key>`) |
| `POST /admin/:id/approve`, `POST /admin/:id/reject`, `DELETE /admin/:id` | Approve, reject, remove |
| `GET /admin/reports`, `DELETE /admin/reports/:id` | Reports from the shared world; dismiss one |
| `GET /admin/bans`, `POST /admin/bans` `{ visitor, days, reason }`, `DELETE /admin/bans/:visitor` | Bans |
| `GET /admin/online` | Who's in the shared world now |
| `GET /world` (WebSocket) | The shared world; the messages are listed at the top of `src/world.ts` |

## Running it on your computer

```
cd workers/neighbourhood
npm install
printf 'ADMIN_TOKEN=a-long-local-test-key\nVISITOR_SALT=dev\n' > .dev.vars
npx wrangler dev
```

Then run the site with `NEIGHBOURHOOD_API=http://127.0.0.1:8787 npm run dev`.
The rules live in `src/registry.ts` and `src/rules.ts`, the shared world in
`src/world.ts` and the chat filter in `src/chat.ts`; `npm run test:game` in the
repo root tests them. To try the shared world with two players, open the site
in two different browsers (or one normal and one private window) and explore
in both.
