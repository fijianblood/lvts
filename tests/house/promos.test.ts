// Run with: node --test "tests/house/*.test.ts"   (Node 22.18+)
// The hidden reward cards in Damodar City's Digicel and Vodafone shops (promos.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { encodePrizeCodes } from '../../src/game/house/prizeCodec.ts';
import { SHOP_PROMOS, PROMO_CODE, promoStateOf, promoSteps, promoBy, promoTitle, promoState } from '../../src/game/house/promos.ts';
import { PROMO_SPOTS } from '../../src/game/house/layout.ts';
import { CONTEST } from '../../src/game/house/contest.ts';

// (made-up codes for the test; real ones only ever live in the GitHub secrets)
const RAW = '2026-11-03=00000001, 2026-11-10=00000002, until=2026-11-30';
const at = (iso: string) => new Date(iso);

test('a reward code is exactly 8 digits: anything else is left out, with a warning', () => {
  const { bundle, warnings } = encodePrizeCodes('2026-11-03=1234567, 2026-11-04=123456789, 2026-11-05=LVTS-123, 2026-11-06=ABCDEFGH, 2026-11-07=12345678', 'salt', PROMO_CODE);
  assert.equal(bundle.entries.length, 1);
  assert.equal(bundle.entries[0].from, '2026-11-07');
  assert.equal(warnings.length, 4);
  for (const w of warnings) assert.match(w, /exactly 8 digits/);
});

test('the live reward code follows Fiji dates; none before the first round or after the end', () => {
  const { bundle } = encodePrizeCodes(RAW, 'x', PROMO_CODE);
  assert.ok(!JSON.stringify(bundle).includes('00000001'), 'the code is in the bundle as plain text');
  const before = promoStateOf(bundle, at('2026-11-02T11:59:00Z'));   // 23:59 on 2 Nov in Fiji
  assert.deepEqual(before, { live: false, code: null, round: null, next: '2026-11-03' });
  assert.equal(promoStateOf(bundle, at('2026-11-02T12:00:00Z')).code, '00000001');   // 00:00 on 3 Nov in Fiji
  assert.equal(promoStateOf(bundle, at('2026-11-12T00:00:00Z')).code, '00000002');
  assert.equal(promoStateOf(bundle, at('2026-11-30T11:59:00Z')).live, true);
  assert.equal(promoStateOf(bundle, at('2026-11-30T12:00:00Z')).live, false, 'still live after the end');
});

test('with no codes set (no secrets), no round is running and no code is shown', () => {
  for (const p of SHOP_PROMOS) assert.deepEqual(promoState(p.id), { live: false, code: null, round: null, next: null });
});

test('the reward says it is LvTS\'s, paid by the wallet, and how to claim it on @lvtsfiji', () => {
  const byId = Object.fromEntries(SHOP_PROMOS.map((p) => [p.id, p]));
  assert.equal(byId.digicel.wallet, 'MyCash');
  assert.equal(byId.vodafone.wallet, 'M-PAiSA');
  for (const p of SHOP_PROMOS) {
    assert.equal(p.amount, '$5');
    assert.equal(promoTitle(p), `$5 ${p.wallet} cashback`);
    assert.match(promoBy(p), new RegExp(`LvTS.*not by ${p.company} or ${p.wallet}`));
    const steps = promoSteps(p).join(' ');
    assert.match(steps, /screenshot/i);
    assert.ok(steps.includes(CONTEST.handle), 'the steps should say where to post');
    assert.ok(steps.includes(`paid to your ${p.wallet} by LvTS`));
    assert.match(steps, /never ask for your .* PIN/);
    // the logos it shows are in the site
    assert.ok(existsSync(`public/neighbourhood/logos/${p.walletLogo}`), `${p.walletLogo} is missing`);
    assert.ok(existsSync(`public/neighbourhood/logos/${p.id}.png`), `${p.id}.png is missing`);
  }
});

test('each shop hides one card, and the build takes its codes from the secrets', () => {
  assert.deepEqual(PROMO_SPOTS.map((s) => s.id).sort(), SHOP_PROMOS.map((p) => p.id).sort());
  const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
  for (const p of SHOP_PROMOS) assert.ok(workflow.includes(`${p.secret}: \${{ secrets.${p.secret} }}`), `deploy.yml doesn't pass ${p.secret} to the build`);
});
