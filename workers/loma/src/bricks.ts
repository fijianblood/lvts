// The Noqublox brick builder: turns what a player typed ("a bure with a coconut
// tree") into a list of bricks for a build plot. Claude answers with data only
// (bricks with a place and a colour), never code, so nothing an AI wrote ever
// runs in a child's browser. Only the Neighbourhood server can call this (a
// service binding: it has no web address of its own); that server checks what
// was typed, limits builds per visitor and keeps every build for LvTS to approve.

import Anthropic from '@anthropic-ai/sdk';
import { WorkerEntrypoint } from 'cloudflare:workers';
import { GRID, LAYERS, MAX_BRICKS, MAX_SIZE, PALETTE, type BrickReply } from '../../neighbourhood/src/builds.ts';

interface Env { ANTHROPIC_API_KEY: string; LOMA_MODEL?: string }

const SYSTEM = `You build models out of toy bricks for Noqublox, a friendly 3D game for children in Fiji made by LvTS.

The build plot is ${GRID} × ${GRID} studs (each stud is 0.4 m, so the plot is 8 m square). Bricks are 0.48 m tall and stack in layers 0 to ${LAYERS - 1}; layer 0 sits on the plot.
Each brick is [x, y, z, w, d, c]:
- x, z: the brick's corner stud, 0 to ${GRID - 1} (x goes left to right as players look at the plot; z goes from the back to the front, and players stand in front, past z = ${GRID - 1})
- y: its layer, 0 to ${LAYERS - 1}
- w, d: its size in studs along x and along z, 1 to ${MAX_SIZE}
- c: its colour number:
${PALETTE.map((p, i) => `  ${i} ${p.name}`).join('\n')}

How to build:
- Make the thing the player asked for, recognisable from a few metres away, about 3 to 8 m wide, centred on the plot. Use at most ${MAX_BRICKS} bricks; bigger bricks (up to ${MAX_SIZE} × ${MAX_SIZE}) save bricks.
- Bricks rest on the plot or on other bricks: no floating bricks. Walls one stud thick, with gaps for doors and windows. Roofs step in layer by layer.
- Real colours: brown trunks and green leaves, tan or brown thatch for a bure, blue for water, white or grey for concrete.
- Fiji words are welcome: a bure is a traditional thatched house, a drua a double-hulled canoe, a lali a wooden drum.
- No letters, words, numbers, symbols or flags made of bricks.
- name: 1 to 4 plain words for the build, like "Bure with coconut tree".

Only friendly builds for children. If the request is about weapons, fighting, violence, scary or gory things, rude or adult things, alcohol, smoking or drugs, real people, brands or logos, or characters from films, TV or games, set refused to true, name to "", and bricks to [].`;

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
export async function makeBricks(env: Env, prompt: string): Promise<BrickReply> {
  if (!env.ANTHROPIC_API_KEY) return { ok: false, why: 'failed' };
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  try {
    const res = await client.messages.create({
      model: env.LOMA_MODEL || 'claude-haiku-5-5',
      max_tokens: 8000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content: `Build this: ${prompt}` }],
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
  async build(prompt: string): Promise<BrickReply> {
    return makeBricks(this.env, String(prompt).slice(0, 200));
  }
}
