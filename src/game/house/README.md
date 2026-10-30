# LvTS House Hunt

A first-person, low-poly 3D walk through the house, at `#house` on the site.
Find the 12 tech parts, hunt the Golden Chip (it hides in one of six spots,
picked at random each game), and leave through the back door. If you have the
Golden Chip when you escape, the win card shows the secret code for the
current prize round.

## Running a prize round

The repo is public, so **prize codes are never committed**. They come from a
GitHub Actions secret and are scrambled into the build.

1. GitHub → the `lvts` repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Name: `HOUSE_PRIZE_CODES`. Value, for example:

   ```
   2026-11-02=LVTS-7KQ2X9, 2026-11-09=LVTS-M3P8RA, until=2026-11-30
   ```

   Each code is live from 00:00 Fiji time on its date until the next code's
   date. `until` (optional) ends the contest after that day. Codes are 4–32
   letters, digits or dashes. Bad entries are skipped and named in the build log.
3. Re-run the **Deploy to GitHub Pages** workflow (or push any commit). The
   build log prints `[house-hunt] N prize code(s) loaded`.

With no secret set, the game still works and shows `LVTS-DEMO` with a
"no prize round is running" note. While a round is live, the site-wide banner
promotes the House Hunt instead of the Weave Playground.

Prize wording, the Facebook link, the payout method and the claim rule live in
`contest.ts`. By default winners comment the code on the pinned House Hunt post
on facebook.com/lvtsfiji. A `timeline` option ("post it on your own Facebook and
tag the page") exists, but Meta's Pages promotion rules say personal Timelines
must not be used to administer promotions, so it is off by default.

### What the scrambling does and does not protect

It stops anyone finding a code by searching the repo or the page source. A
determined developer could still step through the game's JavaScript and pull a
code out. Keep each round's prize modest, rotate codes, and judge by the first
correct comment. To close the gap completely, a server (for example the
Cloudflare Worker already used for the Loma chatbot) would have to hand out the
code after the run.

### Testing a round on your computer

Create `.env.local` in the repo root (it is git-ignored):

```
HOUSE_PRIZE_CODES=2026-10-01=LVTS-TEST01
```

then `npm run dev` and open `http://localhost:5173/lvts/#house`.

## Files

| File | What it is |
|---|---|
| `layout.ts` | The house as data: rooms, walls, doors, windows, furniture, parts, Golden Chip spots, spawn, exit. The renderer, collision and minimap all read it. |
| `collision.ts` | Player-vs-wall/furniture/door collision (circle vs boxes), with sliding. |
| `engine.ts` | three.js scene, controls, doors and windows, pickups, timer, win. |
| `minimap.ts` | Fog-of-war minimap revealed by line of sight, with a breadcrumb trail. |
| `HouseGame.tsx` | HUD, start/pause/win cards, touch controls, fullscreen. |
| `contest.ts`, `prizeCodec.ts` | Contest settings and the code scrambling. |
| `../../pages/HouseHuntPage.tsx` | The page around the game. |
| `../../../public/house-hunt/` | The database-index figure (in-game poster and its live version). Rebuilt with `tools/db-index-figure/build.mjs`, which needs the Anatomy kit. |

## Tests

`npm run test:game` (Node 22.18 or newer) checks collision, that every part,
every Golden Chip spot and the exit can be reached with the doors open, that a
shut door blocks its doorway, that no door swings through furniture, and the
prize-code scrambling and round dates.
