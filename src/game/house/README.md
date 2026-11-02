# Noqublox (LvTS)

The game was called the House Hunt, then Vaqara Raiwai; it's now **Noqublox**.
*Noqu* is iTaukei for "my", so it reads as "my blox". You play in Raiwai, by
USP and around the blocks. The page is still at `#house`, so links already
shared keep working.

A first-person 3D walk through the house and the compound around it,
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

**Jumping** (Space, or the ⬆️ button on phones). In the hunt: about a metre
up (a bit less for the kids; Aisha crawls, so she doesn't jump). You can jump
over or onto furniture and loose things (benches, tables, beds, crates, cement
bags, the red water barriers) because each knows how tall it is (`top` in
`collision.ts`); walk off whatever you're standing on and you drop. Walls,
fences, railings, doors, the chore locks and people always stop you, so a
jump never takes you anywhere you couldn't walk: no over the compound fence in
a prize round, no into a locked place.

**Exploring** is free roam, and you jump higher: about 2.7 m (2.4 m for the
kids), enough to clear the compound's fences and walls at a run. Fences,
garden and block walls, railings, low walls and Garden City's palisade get a
top when exploring (`jumpTop` in `layout.ts`: the barrier's height above the
higher ground either side, on its curb), so a jump clears them. Buildings and
house walls, doors and gates, the places you unlock with chores (the
vegetable garden, the bure, the treehouse), the temple's and the masjid's
walls, the lookout tower and the edge of the map still always stop you.
Indoors the ceiling caps the jump so your head stays under it.

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

Aunties & Uncles (Josese's sisters, brothers, brothers-in-law and Mira's wife Fawzia) and Cousins
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
| Fawzia | Aunty | Quick hands: grabs parts from 1.8 m (Mira's wife; sits beside him in the carport) |
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
only: veranda, lounge, kitchen, dining table, carport, yards). Their spots are
`NPC_SPOTS` in `layout.ts`; anyone standing blocks your way, and a test checks
that nobody blocks a part, a Golden Chip spot or the exit. V switches to a
third-person view. The pick is remembered in `localStorage`.

## Conversations

Anyone can talk to anyone. Press E next to someone and a conversation opens
(`talk.ts`, shown by `HouseGame.tsx`):

- **Bula both ways**: everyone greets with "Bula!" and answers "Bula
  vinaka!". The younger one greets the elder with respect and thanks, and
  the elder answers with a blessing, or the other way round.
  Grown-ups of the same generation and the cousins greet each other as
  friends. Everyone is called the right thing (Dad, Mum, Grandpa,
  Aunty Nancy, Uncle Ravi…); see `address()`.
- **Your questions** (keys 1–7, or tap): how are you; have you seen the Golden
  Chip (the hint); what do you love about nature; how did Allah create us; what
  is our family's declaration; and one that fits the two of you.
- **Their question back** after your second one, with answers to pick.
- **Say goodbye**, E again, ✕, or walking away ends it.

The family's declaration is used word for word: "I bear witness that there is
no god but God, and I bear witness that Muhammad is the Messenger of God."
The Qur'an and hadith lines are short paraphrases of the meaning with the
reference (e.g. Qur'an 3:190, 95:4, 49:13), not quotations from one
translation. Please have them read over by someone you trust before you rely
on them. Baby Aisha babbles, coos and reaches for cuddles instead of talking.
`tests/house/talk.test.ts` checks every one of the 600 pairings.

## Explore Your Neighbourhood (stage 1)

*Explore virtually. Discover locally. Connect in real life.*

- **Your own character.** The **You** tab on the start card opens a character
  creator: a first name or nickname, size (kid, teen, grown-up), skin, hair
  style and colour, top, shorts or long, earrings, beard. It's saved on the
  device straight away and can be played in the hunt or when exploring.
- **In the game for good.** The character is also sent to the LvTS
  Neighbourhood server (`workers/neighbourhood`). Nobody else sees it until
  LvTS approves it on the hidden admin page, `#neighbours-admin`. Once
  approved, it stands on the footpath across the road for everyone who
  explores, and you can talk to it. The creator can change or delete it from
  the same card (a new name goes back for approval). Until the server is
  deployed, characters stay on the visitor's own device; nothing breaks.
- **Explore mode.** "Explore the neighbourhood" on the start card: no timer,
  no parts or Golden Chip; the front gate leads out onto McFarlane Road in
  Raiwai (see "Raiwai" below), with a row of shops across the road. Chores
  and stars work as in the hunt.
- **Shops.** The list is `SHOPS` in `shops.ts`; the row across the road grows
  with it (buildings, footpath, walls and the map all follow). Each shop's
  logo goes in `public/neighbourhood/logos/` and shows on a sign board above
  its front, fitted without stretching. To add a shop:

  ```ts
  { id: 'my-shop', name: 'My Shop', kind: 'shop', width: 8.6, wall: '#f4f2ec', sign: '#1f8a3b',
    logo: 'my-shop.png', blurb: 'What it sells.' },
  ```

  `kind` sets the front and what's inside (see "Walking into the shops"
  below): 'supermarket' (taller, long windows, double doors), 'complex' (two
  storeys and a door per unit, like Sardaar Complex), 'food', 'shop' or
  'hardware' (windows and a door), or 'mall' for a centre that's built in its
  own file (Garden City, Damodar City). 'cinema' still works but gives a tall
  front with an empty room. A shop without a logo gets its name
  in letters (`sub` for a second line). **The logos belong to their
  businesses**, so get each business's OK before it goes live.
- **Walking into the shops.** Every shop on the row has a glass door (two for
  the supermarkets, one per unit for Sardaar Complex) that opens with E, like
  the house's doors, and starts shut. Inside, by `kind`: 'food' has a counter
  with buns, bread shelves, an oven, a menu board and two tables; 'shop' has
  clothes racks, gift shelves, a counter and a mirror; 'supermarket' has
  checkouts, baskets, aisles of goods and fridges; 'hardware' has paint
  shelves, a pegboard of tools and a timber rack; 'complex' has four small
  units with a counter and shelves each. The insides are plain data in
  `shopInsides.ts`, which also makes each front (walls, windows, door frames)
  so the doorway lines up with the door.
- **Garden City** ('mall', after Sardaar Complex) is different: a shopping
  complex set back behind its own car park, and you can walk in. Its iron
  fence, grey pillars with lanterns and the "Garden City" sign are at the
  road; through the iron gates (they open with E) are the car park (a corner fenced off with red water
  barriers), a covered walkway and five ground-floor units still being built,
  each with a "coming soon" board (the last one is shut off behind barriers).
  The second unit is already open: **Westpac**, through a pair of glass
  doors, with its logo over the door and on a red back wall, a counter, two
  ATMs, chairs and queue posts.
  It is all plain data in `gardenCity.ts`; the signs are drawn in
  `textures.ts`, not copied from photos. When shops move in, their signs can
  go on the boards.
- **Damodar City** ('mall', across the road from the gate) is the shopping
  centre with Damodar Cinemas, from photos of the real one. Its frontage on
  McFarlane Road is the way in, past a pylon sign (the name, the cinema's and
  BSP's logos, "coming soon"); the car park opens out behind the
  neighbouring shops: bays, islands with yellow kerbs, shrubs and palms,
  round-topped lamp posts, parked cars. Along the back, a two-storey block of
  eight shops with a glass-fronted walkway upstairs, white pillars and a
  blue-grey roof band, and the cinema at the east end with its logo up high;
  a smaller block down the west side. Every ground-floor shop has a glass
  door that opens with E. **BSP** is open (double doors; its logo on a green
  wall, a counter, ATMs, chairs); the other shops are coming soon, and inside
  each is an empty unit being fitted out (a "coming soon" board, boxes, a
  ladder). **Damodar Cinemas** has double doors into its lobby: a red carpet,
  the ticket counter, the candy bar with popcorn, film posters, a bench and
  the two screen doors with green exit lights. All in `damodarCity.ts`.
- **The LvTS plaque.** Each public building (every shop and unit row,
  Garden City, Damodar City's two blocks and the cinema, and the USP blocks)
  carries one small plaque, 0.9 by 0.42 m, about waist to shoulder height by
  the door: the LvTS logo (the same one as on the house's TV, from
  `public/logo.jpg`) and "Call 8331088". It is kept small so it never
  competes with a shop's own sign. Places of worship and the neighbours'
  houses don't get one. In data it's `lvtsPlaque(x, y, z)` from
  `shopInsides.ts` (a box with `tex: 'lvts:-z'`; the engine draws the texture
  once and shares it). A test checks there is one per building, and none on
  the masjid, temple or church.
- **Logos on buildings**: a box prop with `tex: 'logo/file.png:-z'` shows that
  logo (from `public/neighbourhood/logos/`) on a sign board filling that face,
  fitted without stretching; `'logo/file.png@#070707:-z'` for a board that
  isn't white. The box's colour is the board's frame.
- **Offers** go in `OFFERS` in `neighbourhood.ts`, by shop id, once the
  business has agreed:

  ```ts
  export const OFFERS: Record<string, Offer[]> = {
    'hot-bread-kitchen': [{
      id: 'pie-drink', title: 'Free soft drink with any pie', details: 'At the counter, any day.',
      kind: 'free', unlock: { type: 'stars', stars: 10 }, code: 'LVTS-PIE',
      terms: 'One per customer per day. While stocks last.', until: '2026-12-31',
    }],
  };
  ```

  Unlocks: `{ type: 'visit' }` (walk up to the shop), `{ type: 'stars', stars: N }`
  (chores), `{ type: 'chip' }` (found the Golden Chip this game). The code is in
  the website's code, so anyone determined could find it: only use it for
  offers a business is happy to give anyone who asks. Limited or
  one-per-person offers need codes the server hands out and the shop can mark
  as used (a later stage). A test fails if an empty spot has offers.
- **Talking.** Visitors greet with "Bula!" and the family welcomes them. A
  visitor can ask the family about their declaration, but other visitors'
  characters only make small talk and never speak about faith.
- **Exploring together (the shared world).** Everyone exploring at the same
  time is in one Raiwai: you see the other players walk about (their character,
  with "Visitor 12" or their approved name over their head, and "as Zane" if
  they're playing a family member), and the 🌐 pill says how many are here.
  Press **T** (or 💬) to chat: typed messages up to 100 characters, shown in a
  speech bubble over the player and in the lines at the bottom left. Rude words
  and anything that looks like contact details (phone numbers, emails, links,
  social media, "where do you live") are never sent, and the player is told
  why. The chat box's **Here** tab lists everyone, with a 🚩 Report button.
  LvTS reads reports and bans players on the admin page (`#neighbours-admin`).
  The hunt stays a game you play on your own. With no server, or when it can't
  be reached or is full (40 players), you simply explore on your own. The game
  side is `online.ts` (the connection) and `SharedWorld.tsx` (the screens); the
  server side, the chat filter and the free-plan limits are in
  `workers/neighbourhood/` and its README. Other players' figures are baked into
  one mesh per moving part (`bakeMoving` in `figures.ts`: about 10 draw calls a
  person), and only the nearest 16 within 90 m are drawn.
- **The look.** See "How it looks" below.

## How it looks (and keeping it fast)

- **People** are built from smooth shapes: rounded heads with eyes, brows,
  nose, lips and ears, shaped hair, elbows and knees, hands with fingers,
  shoes. They follow each person's look in `characters.ts`; they aren't
  likenesses. Each is baked into two meshes (~7,000 triangles).
- **Materials** are physically based (`paint()` in `models.ts`): matte paint,
  satin wood, cloth, skin, glossy and metal surfaces. Wood gets a grain,
  sofas and chairs a fabric weave and walls a faint plaster texture, laid on
  by world position so the grain is the same size on every piece.
- **Light**: an afternoon sun from the west, sky light and soft reflected room
  light, with film-like tone mapping. **Sun shadows** are drawn once (and
  again only when a door moves or who's standing where changes), so they cost
  almost nothing per frame. The roof and walls keep the sun out, so it only
  comes in through windows and doors.
- **Soft corner shading** (ambient occlusion, `GTAOPass`) on computers only.
  If frames get slow (under about 36 a second for a few seconds) it switches
  itself off for the rest of the visit. Phones never use it.
- **Furniture** has rounded edges that catch the light; thin parts stay sharp.

## Raiwai (exploring)

In **Explore the neighbourhood** the whole of Raiwai is open (**free roam**):
out of the front gate (or over the fence) onto **McFarlane Road**, along it
both ways, up the **side road** beside the neighbours to the east, and on
anywhere: the neighbours' yards, up the hill, round the training ground, past
the sheds and the arena, down to the beach. The edge of the map
(`WORLD_EDGE` in `layout.ts`) is an invisible wall: the hills to the north,
open country east and west, the sand at the shore to the south. Every
building out there is solid (`roamSolids` in `collision.ts`: the houses, the
flats, the church, the pool, the teal building, the sheds, the arena, the
apartment block, the floodlights, from their footprints in `raiwaiPlan.ts`),
and so are the trunks of the trees and the power poles. The hunt keeps you in
the compound as before. To the right as you come out of the gate (west), on the house's side
of the road, is the **Howell Road Hindu Temple**, from a photo of its
entrance: the yellow arch with red "OM SHAKTHI · PARA SHAKTHI" lettering
between two red-and-yellow tiered pillars, the metal gate, strings of
coloured flags up to tall bamboo poles, and the temple up the slope behind
(cream with red and saffron bands, a pillared porch, a tiered tower with a
gold kalash). Its gate opens with E and you can walk around the grounds
(the flag poles, up to the base); the temple itself stays shut.
From the gate, the places along the road to the left (east) are:

- the **Methodist Church** (Raiwai branch), the big A-frame church, set back up the bank with its sign by the road;
- across the road, the **pool** with its covered stand, the **teal two-storey building**, and the **Lomaiviti Training Ground** with rugby posts;
- after the training ground, on the same side, the **Raiwai Jame Masjid**: white with teal roofs, on a raised yard behind a teal wall with white pillars and little minaret tops, and steps up from the footpath to a teal gate that opens with E onto the yard (`MASJID_YARD` in `layout.ts`); the buildings stay shut;
- the green **Nasese bus** at the stop by the pool, and cars parked along both edges (you bump into them);
- across from the training ground, the campus of **The University of the South Pacific** (USP), with its entrance sign where McFarlane Road ends to the east;
- beyond the training ground, the commercial sheds, the arena and stadium lights, and the sea with the reef's surf;
- up the hill to the north and west, more houses, flats and an apartment block, and the hills behind;
- between the teal building and the training ground, the **Raiwai Lookout** (new, `towers.ts`): a 10 m square cream tower with orange bands and stairs up its outside to a railed roof 20 m up. The stairs start at its north-west corner and wrap once round the tower (a flight up each side, a landing at each corner), so you walk all the way up; nothing on it can be jumped. At the top you get a message and the whole map is cleared, like the treehouse. There's a gap in the footpath's low wall across the road from the training ground to walk over to it.

The minimap shows the street map in detail as before, over a coarser map of
all of Raiwai when exploring (no fog out there), and the big map (M) can be
scrolled out to anywhere.

The neighbours' houses are Raiwai-style (corrugated-iron roofs, concrete bases
on the slope, louvre windows, verandas, carports, water tanks, satellite
dishes) but made up from a seed. They are not copies of anyone's real home.
The public places are modelled on drone photos of the area.

- `raiwaiPlan.ts`: where everything goes (plain data: footprints, faces, which things only show when exploring), the signs, the road labels, trees and power poles.
- `towers.ts`: the Raiwai Lookout (its stairs as ramps and landings, its walls and rails, and what's drawn).
- `raiwai.ts`: the 3D pieces (houses, flats, church, pool, teal building, training ground, the masjid, the temple, sheds, bus, cars, poles, mango trees, bougainvillea).
- `layout.ts`: `MCFARLANE`, `SIDE_ROAD`, `MASJID`, the walls along them, and `PARKED` (cars and the bus, with colliders).
- `gardenCity.ts`: Garden City (see "Shops" above).

When exploring, the view opens up (fog from 70 to 700 m, the camera sees 1.6 km);
the far part of Raiwai is hidden in the hunt to keep it cheap. Raiwai adds about
130 draw calls and 120,000 triangles when you can see all of it.

## Rotating on phones

On touch devices the 🔄 button switches between landscape and portrait. Where
the browser allows it (Android Chrome and Firefox), the game goes full screen
and asks the phone to rotate for real (Screen Orientation `lock()`, which only
works in full screen). Elsewhere (iPhone, iPad, most others) the game turns
itself a quarter turn on screen, and the touch controls are remapped to match;
turn the phone sideways to play. Pressing 🔄 again, leaving full screen, or
physically turning the phone turns it back. Computers don't show the button.

## Chores, stars and new places

Chores are optional and never touch the hunt or the prize. The mess comes back
every game; finishing a chore earns ⭐ stars, which are kept on the player's
device (`localStorage`, key `house-hunt-stars-v1`) and add up across games.
Press C (or 📋) for the list. Stand next to the green sparkle and press E; the
bar fills while you work, and walking away stops it.

| Chore | Where | ⭐ |
|---|---|---|
| Wash the dishes | kitchen sink | 2 |
| Do the laundry | kids' room basket → washing machine → washing line | 3 |
| Sweep the floors (broom) | hallway, lounge, veranda | 2 |
| Mop the floors (mop) | kitchen, bathroom | 2 |
| Dusting (cloth) | TV unit, side table, back-room shelves | 2 |
| Wipe the windows (cloth) | lounge, dining room | 2 |
| Babysit Aisha | lounge, by the bassinet | 2 |
| Take out the rubbish | kitchen bin → wheelie bin | 1 |
| Water the plants (watering can) | veranda, lounge, side path | 2 |
| Feed the cat | pantry → cat bowl | 1 |
| Tidy the shoes | veranda | 1 |
| Water the vegetables (watering can) | vegetable garden, once it's open | 2 |

Finishing every chore you can do in one game adds a 3 ⭐ bonus. The broom,
mop and cloth hang on a rack in the back room; the watering can is by the
laundry tubs. You carry one thing at a time. Baby Aisha has no chores (she's
the one being babysat).

Stars unlock three places for good:

| Place | ⭐ | What's there |
|---|---|---|
| Vegetable garden | 6 | Dalo, cassava and bele behind the storeroom, and a new chore |
| Family bure | 15 | A thatched hut with mats and cushions, past the back steps |
| Treehouse | 30 | A lookout by the breadfruit tree: climbing it reveals the whole map |

Until then each has one gate with a padlock and a sign. A test checks that
every part, Golden Chip spot and the exit can be reached with all three
locked, so the contest is the same for everyone. Chores and places are data in
`chores.ts`; `choreSystem.ts` draws them and runs the timing.

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
"no prize round is running" note.

Prize wording, the Facebook link, the payout method and the claim rule live in
`contest.ts`. By default winners comment the code on the pinned Noqublox post
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
| `collision.ts` | Player-vs-wall/furniture/door collision (circle vs boxes), with sliding; a crawling version for Aisha and a walls-only version for the third-person camera. Jumping: furniture's heights, standing on things, and the jump-and-fall step. |
| `engine.ts` | three.js scene, controls, doors and windows, pickups, the family, third-person camera, timer, win. |
| `characters.ts` | The 25 playable family members, plus your own. |
| `talk.ts` | What they say to each other: greetings, questions and answers, the declaration. |
| `chores.ts`, `choreSystem.ts` | Chores, stars, the places they unlock, and the 3D side of them. |
| `neighbourhood.ts` | The street, shop spots and offers, visitors' characters, and talking to the server. |
| `raiwaiPlan.ts` | Where everything in Raiwai goes (plain data, used by the engine, the minimap and the tests). |
| `raiwai.ts` | Raiwai's 3D pieces: houses, flats, the Methodist Church, the pool, the teal building, the Lomaiviti Training Ground, the Raiwai Jame Masjid, the Howell Road Hindu Temple, sheds, the Nasese bus, cars, power poles, trees. |
| `towers.ts` | The Raiwai Lookout, the tower you can walk up when exploring: its stairs round the outside (ramps and landings), walls, rails and what's drawn. |
| `gardenCity.ts` | Garden City, the shopping complex being built after Sardaar Complex: plain data for its fence, sign, car park, building, building site and the Westpac branch. |
| `damodarCity.ts` | Damodar City, the centre across the road: its sign, car park, shops (with doors and insides), the BSP branch and Damodar Cinemas' lobby. |
| `shopInsides.ts` | The row of shops across the road, opened up: each front's walls, windows and glass doors, and what's inside by kind. Also `lvtsPlaque()`, the small LvTS logo-and-number plaque. |
| `uspCampus.ts` | The USP campus you can walk around: its blocks, paths, trees and sign. |
| `online.ts`, `SharedWorld.tsx` | The shared world on the game's side: the connection to the server, and the 🌐 pill, chat lines, chat box and report button. |
| `portrait.tsx` | The little portraits on the picker, the HUD and the admin page. |
| `../../../workers/neighbourhood/` | The Neighbourhood server (Cloudflare Worker); its own README has the setup steps. |
| `../../pages/NeighbourhoodAdminPage.tsx` | The hidden page for approving characters. |
| `figures.ts` | The people (rounded heads with eyes, brows, nose, lips and ears; shaped hair; elbows, knees, hands with fingers; poses, walk and crawl cycles) and the cat. Everyone you aren't playing is baked into two meshes (body, and head on its own pivot), with colour and shininess on the vertices, so a full house stays cheap to draw (about 7,000 triangles a person). |
| `minimap.ts` | Fog-of-war minimap revealed by line of sight, with a breadcrumb trail. |
| `HouseGame.tsx` | HUD, start/pause/win cards, touch controls, fullscreen. |
| `contest.ts`, `prizeCodec.ts` | Contest settings and the code scrambling. |
| `../../pages/HouseHuntPage.tsx` | The page around the game. |
| `../../../public/house-hunt/` | The database-index figure (in-game poster and its live version). Rebuilt with `tools/db-index-figure/build.mjs`, which needs the Anatomy kit. |

## Tests

`npm run test:game` (Node 22.18 or newer) checks collision, that every part,
every Golden Chip spot and the exit can be reached with the doors open (walking
and crawling), that you can never walk off a ledge, that a shut door blocks its
doorway, that no door or gate swings through furniture, that each shop, centre,
bank, the cinema and the temple and masjid grounds can be reached with their
doors open and not with them shut (and never into the temple or masjid
buildings), free roam (from the gate out to the hills, the shore and round the
arena, never past the edge of the map, into a building or through a parked
car, with no ledge anywhere; jumping clears fences and walls but never the
edge, a building, a locked place or a place of worship's walls; which
barriers can be jumped), the Raiwai Lookout (up its stairs to its roof 20 m
up with no step too big, and no other way up), that there's one LvTS plaque per building, the shared world
(joining, names, moves, the chat filter, mutes, reports, bans, full and idle
players, waking up after a sleep), and the prize-code
scrambling and round dates. For jumping, it checks the jump itself (height,
landing, the ceiling cap, clearing a barrier at a run, walls stopping you),
and re-runs the walkability checks as if every piece of furniture could be
hopped over: you still can't leave the compound in the hunt or get into a
locked place; and that exploring, a running jump clears the compound's fence
while in the hunt it doesn't.
