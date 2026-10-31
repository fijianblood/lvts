# LvTS Neighbourhood server

Keeps the characters visitors make in the House Hunt's character creator, so
they stay in the neighbourhood for everyone. A Cloudflare Worker with one
Durable Object, which keeps the characters in its own SQLite database. It runs
on Cloudflare's free Workers plan.

- New characters wait for approval; nobody else sees them until LvTS approves
  them on the site's hidden admin page: `https://fijianblood.github.io/lvts/#neighbours-admin`.
- Names are first names or nicknames only: 2–16 letters, no numbers, links or
  symbols. Looks are picked from fixed lists, so nothing else a visitor types is stored.
- The creator gets a secret key (kept on their device) to change or delete
  their character. Changing the name sends it back for approval.
- At most 3 new characters per visitor per day (visitors are told apart by a
  salted hash of their IP address; the address itself is never stored), and no
  new ones while 300 are waiting.
- Only the House Hunt site (and local development) can call it from a browser.

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

## Running it on your computer

```
cd workers/neighbourhood
npm install
printf 'ADMIN_TOKEN=a-long-local-test-key\nVISITOR_SALT=dev\n' > .dev.vars
npx wrangler dev
```

Then run the site with `NEIGHBOURHOOD_API=http://127.0.0.1:8787 npm run dev`.
The rules live in `src/registry.ts` and `src/rules.ts`; `npm run test:game` in
the repo root tests them.
