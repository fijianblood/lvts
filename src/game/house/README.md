# LvTS House Hunt

A first-person, low-poly 3D walk through the house and the compound around it,
at `#house` on the site. Pick a family member to play as, find the 12 tech
parts, hunt the Golden Chip (it hides in one of 12 spots, picked at random each
game), and leave through the front gate at the bottom of the driveway. If you
have the Golden Chip when you escape, the win card shows the secret code for
the current prize round.

## The compound

The site falls about 3 m from the back yard to the road. Outdoors the ground
height is `groundY(z)` in `layout.ts`: flat at the back (yard, walkway, carport,
storeroom), then a straight slope down the driveway and front garden to the
road. The house, veranda, kitchen balcony and the landings are raised floors
(`PLATFORMS`); the veranda stairs, the side stairs and the back steps are walked
as ramps (`RAMPS`). Collision stays 2D; the camera height follows `heightAt`.
Every place the floor height jumps is walled or railed except at stairs, and a
test proves it.

Doors and gates: the kitchen back door, the veranda gate, the side gate, the
storeroom door and the double front gate all open with E. The veranda gate and
the front gate swing away from you if you are standing where they would open.

## Characters

Edit `characters.ts` to change names, roles, looks or perks. `name` is what the
game shows; change it there to show first names only. The picker has three
tabs (`group`): Home, Aunties & Uncles, and Cousins.

Home:

| Character | Role | Eye height | Perk |
|---|---|---|---|
| Hussein | Grandpa | 1.6 m | Sees further: the map clears 8.5 m around him |
| Josese | Dad | 1.7 m | Tech radar: parts within 7 m show on the map, even through walls |
| Ronlyn | Mum | 1.52 m | Mum always knows: a Cold / Warm / Hot / Very hot pill shows how close the Golden Chip is |
| Zane | Big brother | 1.55 m | Fastest runner |
| Mahala | Big sister | 1.15 m | After 6 parts her iPad marks the Golden Chip on the map |
| Aisha | Baby sister | 0.38 m | Crawls (slowly) and fits under tables |

Aunties & Uncles (Josese's sisters, brothers and brothers-in-law) and Cousins
(his nieces and nephews) have no photos yet, so their clothes and hair are made
up, and the cousins' heights are guesses: change them in `characters.ts`.

| Character | Role | Perk |
|---|---|---|
| Nancy | Aunty | Eagle eyes: the map clears 8 m around her |
| Louzanne | Aunty | Family group chat: a pill names the Golden Chip's room |
| Alicia | Aunty | Hawk eyes: the map clears 7.5 m around her |
| Maria | Aunty | Warmer / colder, like Ronlyn |
| Zoya | Aunty | Phone map: the Golden Chip shows on the map after 5 parts |
| Mira | Uncle | Knows the way out: the front gate is on the map from the start |
| Altaaf | Uncle | Quick on his feet: runs fast |
| Ravi | Uncle | Quick hands: grabs parts from 1.8 m (never through a wall or shut door) |
| Malvin | Uncle | Long stride: the fastest walker |
| Hakeem | Uncle | Tech radar: parts within 6 m show on the map |
| Mikhyle | Cousin | Sprinter: the fastest of the cousins |
| Nabeeha | Cousin | Tablet map after 5 parts |
| Emaana | Cousin | Warmer / colder |
| Rohan | Cousin | Quick hands (1.8 m) |
| Kahaani | Cousin | Family group chat |
| Yash | Cousin | Tech radar (5 m) |
| Maanvi | Cousin | Knows the way out |
| Sarah | Cousin | Sharp eyes (7.5 m) |

Everyone you are not playing is somewhere in the house or yard (common areas
only: veranda, lounge, kitchen, dining table, carport, yards) and says
something when you press E next to them: until you have the Golden Chip, each
of them hints at the room it is in. Their spots are `NPC_SPOTS` in `layout.ts`;
anyone standing blocks your way, and a test checks that nobody blocks a part,
a Golden Chip spot or the exit. V switches to a third-person view. The pick is
remembered in `localStorage`.

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
| `layout.ts` | The house and compound as data: rooms and outdoor areas, ground heights, walls, fences and railings, doors and gates, windows, furniture, trees, the family's spots, parts, Golden Chip spots, spawn, exit. The renderer, collision and minimap all read it. |
| `collision.ts` | Player-vs-wall/furniture/door collision (circle vs boxes), with sliding; a crawling version for Aisha and a walls-only version for the third-person camera. |
| `engine.ts` | three.js scene, controls, doors and windows, pickups, the family, third-person camera, timer, win. |
| `characters.ts` | The 24 playable family members. |
| `figures.ts` | The low-poly people (poses, walk and crawl cycles) and the cat. Everyone you aren't playing is baked into two meshes (body, and head on its own pivot) so a full house stays cheap to draw. |
| `minimap.ts` | Fog-of-war minimap revealed by line of sight, with a breadcrumb trail. |
| `HouseGame.tsx` | HUD, start/pause/win cards, touch controls, fullscreen. |
| `contest.ts`, `prizeCodec.ts` | Contest settings and the code scrambling. |
| `../../pages/HouseHuntPage.tsx` | The page around the game. |
| `../../../public/house-hunt/` | The database-index figure (in-game poster and its live version). Rebuilt with `tools/db-index-figure/build.mjs`, which needs the Anatomy kit. |

## Tests

`npm run test:game` (Node 22.18 or newer) checks collision, that every part,
every Golden Chip spot and the exit can be reached with the doors open (walking
and crawling), that you can never walk off a ledge, that a shut door blocks its
doorway, that no door or gate swings through furniture, and the prize-code
scrambling and round dates.
