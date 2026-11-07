# Noqublox backlog (for the hourly improvement job)

Every hour, an automatic job takes the **first unticked item** below that isn't
already in an open automatic pull request (branch names start with
`noqublox-auto/`). It makes that one change on its own branch, runs the build
and all the tests, and opens a pull request for Josese to check. **Nothing goes
live until a pull request is merged.**

- Put what you want most at the top. Reword, add or delete items freely.
- The job ticks an item (`[x]`) in the same pull request that does it. If you
  close that pull request without merging, untick the item to have it tried again.
- When 3 automatic pull requests are waiting, the job adds nothing new until
  some are merged or closed.
- When the list runs out, the job picks one small fix or polish that fits this
  folder's README, and explains why in the pull request.

## Ideas

- [ ] **Kids Learning Centre in Explore mode.** A small building or a sign board
  near Loma Castle Playground, labelled "Noqu Vuli · Kids Learning", with a door.
  Pressing E there shows a card: "Play Noqu Vuli: ABC, numbers, animals and
  shapes in English and iTaukei", with a button that opens the `/kids/` page.
  It must not block any path (the walkability tests must still pass). Only do
  this once the Noqu Vuli page is on main (`id: 'kids'` in `src/data/routes.ts`);
  until then, skip to the next item.
- [ ] **Controls help.** A "?" button on the HUD (and the H key) that shows the
  controls for computer and phone, the same as the "How to play" card on the
  Noqublox page. Skip it if the game already has one.
- [ ] **Sound on/off.** A mute button on the HUD, remembered on the device, that
  every sound in `audio.ts` respects. Skip it if it already exists.
- [ ] **Low graphics for older phones.** A setting on the start card that turns
  sun shadows off and lowers the pixel ratio. Skip it if it already exists.
- [ ] **Place names on the big map.** On the big map (M), label Garden City,
  Damodar City, the USP campus, the temple, the masjid, Loma Castle Playground
  and the Raiwai Lookout, using the positions in `raiwaiPlan.ts`.
- [ ] **A learning question from the cousins.** In conversations, one of the
  cousins can ask a quick counting question (1 to 10) with the answers in
  English and iTaukei (dua, rua, tolu, va, lima, ono, vitu, walu, ciwa, tini).
  Keep `tests/house/talk.test.ts` passing and add a test for it.
- [ ] **Footsteps.** Different footstep sounds on grass, concrete and wooden
  floors, quiet enough not to annoy, respecting mute.
- [ ] **More realistic look, one piece at a time.** Improve one thing per pull
  request, starting with the family house's roof and outside walls, then the
  trees, then the parked cars: better shapes and materials, within the triangle
  and frame-rate budget in "How it looks" in the README.
