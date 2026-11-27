// The Noqublox brick builder: turns what a player typed ("a bure with a coconut
// tree") into a list of bricks for a build plot. Claude answers with data only
// (bricks with a place and a colour), never code, so nothing an AI wrote ever
// runs in a child's browser. Only the Neighbourhood server can call this (a
// service binding: it has no web address of its own); that server checks what
// was typed, limits builds per visitor and keeps every build for LvTS to approve.

import Anthropic from '@anthropic-ai/sdk';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { GRID, LAYERS, MAX_ADD, MAX_BRICKS, MAX_SIZE, MAX_TOTAL, PALETTE, cleanBricks, floorPlan, type AddTo, type BrickReply } from '../../neighbourhood/src/builds.ts';

interface Env { ANTHROPIC_API_KEY: string; LOMA_MODEL?: string }

const BASICS = `You build models out of toy bricks for Noqublox, a friendly 3D game for children in Fiji made by LvTS. Players walk around as toy figures about 1.7 m tall (about 3.5 bricks).

The build plot is ${GRID} × ${GRID} studs (each stud is 0.4 m, so the plot is 8 m square). Bricks are 0.48 m tall and stack in layers 0 to ${LAYERS - 1}; layer 0 sits on the plot.
Each brick is [x, y, z, w, d, c]:
- x, z: the brick's corner stud, 0 to ${GRID - 1} (x goes left to right as players look at the plot; z goes from the back to the front, and players come from the front, past z = ${GRID - 1})
- y: its layer, 0 to ${LAYERS - 1}
- w, d: its size in studs along x and along z, 1 to ${MAX_SIZE}
- c: its colour number:
${PALETTE.map((p, i) => `  ${i} ${p.name}`).join('\n')}

Always:
- Bricks rest on the plot or on other bricks: no floating bricks, and no two bricks in the same place.
- Real colours: brown trunks and green leaves, tan or brown thatch for a bure, blue for water, white or grey for concrete, wood browns for furniture.
- Fiji words are welcome: a bure is a traditional thatched house, a drua a double-hulled canoe, a lali a wooden drum, a tanoa a kava bowl.
- No letters, words, numbers, symbols or flags made of bricks.

Only friendly builds for children. If the request is about weapons, fighting, violence, scary or gory things, rude or adult things, alcohol, smoking or drugs, real people, brands or logos, or characters from films, TV or games, set refused to true, name to "", and bricks to [].`;

const NEW_BUILD = `${BASICS}

Make a new build of what the player asks for. Take care: this is shown to everyone, so make it detailed and good looking, something a child is proud of.
- Use the plot well: about 5 to 7.5 m wide, centred. Use up to ${MAX_BRICKS} bricks; bigger bricks (up to ${MAX_SIZE} × ${MAX_SIZE}) for big flat parts, small ones for details.
- Anything people live or work in (a house, bure, shop, school, church, hall) must be big enough to walk inside and furnish:
  - walls one stud thick around an empty inside at least 10 × 10 studs, and walls at least 6 layers high
  - a doorway in the front wall (the z = ${GRID - 1} side or the wall nearest it), 3 studs wide and 5 layers high, with nothing in front of it
  - the floor inside left empty (no bricks on layer 0 inside the walls) so players can walk in and add furniture
  - windows (gaps 2 studs wide, 2 layers high, starting at layer 2), and a roof that covers the walls and steps in layer by layer
- Add details that make it come alive: steps or a path to the door, plants, a fence, a garden, a tree, things that belong with it.
- name: 1 to 4 plain words for the build, like "Bure with coconut tree".`;

const ADD_TO = `${BASICS}

The player is standing inside or next to a build on this plot and wants to add something there (like a bed, a table and chairs, a wardrobe, a TV, a kava bowl). Answer with ONLY the new bricks for that thing.
- Put it on empty floor (. in the floor plan), near where the player stands (P), not on the player's own stud, and inside the same room as the player if they are inside walls.
- Only where there's headroom: the thing must fit under the ceiling (the number on the second plan is how many layers are free).
- Never block a doorway, and leave space to walk around it.
- Toy scale (bricks are at most 4 studs long, so join bricks for longer things): a bed is 2 × 5 studs, 1 layer (a pillow on top); a chair is 1 × 1 stud with a seat at layer 0 and a back 2 layers high; a table is 2 × 3 studs on 1-stud legs with the top at layer 1; a wardrobe is 1 × 3 studs and 4 layers high.
- Use at most ${MAX_ADD} bricks, and make it look like the real thing.
- name: 1 to 3 plain words for what you added, like "Double bed".`;

const SCHEMA = {
  type: 'object',
  properties: {
    refused: { type: 'boolean' },
    name: { type: 'string' },
    bricks: { type: 'array', items: { type: 'array', items: { type: 'integer' } } },
  },
  required: ['refused', 'name', 'bricks'],
  additionalProperties: false,
};

/** Ask Claude for a build. Always answers (never throws): a refusal or a failure is part of the reply. */
export async function makeBricks(env: Env, prompt: string, add?: AddTo): Promise<BrickReply> {
  if (!env.ANTHROPIC_API_KEY) return { ok: false, why: 'failed' };
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const res = await client.messages.create({
      model: env.LOMA_MODEL || 'claude-haiku-5-5',
      max_tokens: add ? 8000 : 24000,
      // a new build is seen by everyone: medium effort for a detailed, well made build
      output_config: { effort: add ? 'low' : 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: add ? ADD_TO : NEW_BUILD,
      messages: [{ role: 'user', content: add ? `The build on the plot now, seen from above:\n${floorPlan(add.bricks, add.at)}\n\nAdd this where the player is standing: ${prompt}` : `Build this: ${prompt}` }],
    });
    if (res.stop_reason === 'refusal') return { ok: false, why: 'refused' };
    if (res.stop_reason === 'max_tokens') return { ok: false, why: 'failed' };
    const text = res.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
    const data = JSON.parse(text) as { refused?: boolean; name?: string; bricks?: unknown };
    if (data.refused) return { ok: false, why: 'refused' };
    return { ok: true, name: String(data.name ?? ''), bricks: data.bricks };
  } catch (err) {
    const status = (err as { status?: number }).status;
    return { ok: false, why: status === 429 || status === 529 ? 'busy' : 'failed' };
  }
}

/** What the Neighbourhood server calls through its BRICKS service binding. */
export class BrickBuilder extends WorkerEntrypoint<Env> {
  async build(prompt: string, add?: AddTo): Promise<BrickReply> {
    // what the server sent is checked again here before it goes into the request
    const bricks = add ? cleanBricks(add.bricks, MAX_TOTAL) : null;
    const at = add && Array.isArray(add.at) ? add.at.map((v) => (Number.isInteger(v) ? Math.min(GRID - 1, Math.max(0, v)) : 0)) as [number, number] : ([0, 0] as [number, number]);
    return makeBricks(this.env, String(prompt).slice(0, 200), bricks ? { bricks, at } : undefined);
  }
}
