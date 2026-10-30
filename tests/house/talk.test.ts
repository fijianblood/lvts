// Run with: node --test tests/house/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, characterById, firstName } from '../../src/game/house/characters.ts';
import { opening, questions, quiz, farewell, address, generation, DECLARATION, type Say } from '../../src/game/house/talk.ts';

const by = characterById;
const pairs = CHARACTERS.flatMap((p) => CHARACTERS.filter((n) => n.id !== p.id).map((n) => [p, n] as const));

function clean(lines: Say[], who: string[], where: string) {
  for (const l of lines) {
    assert.ok(who.includes(l.who), `${where}: "${l.who}" is not one of ${who.join(' / ')}`);
    assert.ok(l.text.trim().length > 0, `${where}: empty line`);
    assert.doesNotMatch(l.text, /undefined|null|NaN|\$\{|, !|\?\?/, `${where}: "${l.text}"`);
    assert.ok(l.text.length <= 220, `${where}: too long for the panel (${l.text.length}): "${l.text}"`);
  }
}

test("the family's declaration is word for word", () => {
  assert.equal(DECLARATION, 'I bear witness that there is no god but God, and I bear witness that Muhammad is the Messenger of God.');
});

test('anyone can talk to anyone: every pairing has a greeting, questions, their question back and a goodbye', () => {
  assert.equal(pairs.length, 24 * 23);
  for (const [p, n] of pairs) {
    const who = [firstName(p), firstName(n)];
    for (const [k, room] of [[0, 'kitchen'], [3, null]] as const) {
      const where = `${p.id} → ${n.id} (turn ${k})`;
      const hello = opening(p, n, k);
      assert.equal(hello.length, 2, where);
      assert.equal(hello[0].who, firstName(p), `${where}: you speak first`);
      clean(hello, who, where);
      const qs = questions(p, n, room, k);
      assert.ok(qs.length >= 5, `${where}: only ${qs.length} questions`);
      assert.equal(new Set(qs.map((q) => q.id)).size, qs.length, `${where}: duplicate question`);
      for (const q of qs) {
        assert.ok(q.label.trim(), `${where}: blank menu label for ${q.id}`);
        assert.ok(q.lines.length >= 2, `${where}: ${q.id} has no answer`);
        clean(q.lines, who, `${where} ${q.id}`);
      }
      const back = quiz(p, n, room, k);
      if (generation(n) === 'baby') assert.equal(back, null, `${where}: the baby can't ask questions`);
      else {
        assert.ok(back && back.choices.length >= 2, `${where}: no question back`);
        assert.equal(back!.ask.who, firstName(n));
        for (const c of back!.choices) clean(c.lines, who, `${where} quiz`);
      }
      clean(farewell(p, n), who, `${where} goodbye`);
    }
  }
});

test('the hint about the Golden Chip names the right room, and the gate once you have it', () => {
  const hint = questions(by('rohan'), by('nancy'), 'main bedroom', 0).find((q) => q.id === 'chip')!;
  assert.match(hint.lines[1].text, /main bedroom/);
  const after = questions(by('rohan'), by('nancy'), null, 0).find((q) => q.id === 'chip')!;
  assert.match(after.label, /gate/);
});

test('asking about the declaration gets it word for word, from anyone old enough to say it', () => {
  for (const [p, n] of pairs) {
    if (generation(n) === 'baby') continue;
    const q = questions(p, n, null, 1).find((x) => x.id === 'declaration')!;
    assert.ok(q.lines.some((l) => l.who === firstName(n) && l.text.includes(DECLARATION)), `${p.id} → ${n.id}`);
  }
});

test('the young greet their elders with respect, and the elders answer with a blessing (and the other way round)', () => {
  const [kid, aunty] = opening(by('kahaani'), by('louzanne'), 0);
  assert.match(kid.text, /^Assalamu alaikum, Aunty Louzanne!/);
  assert.match(aunty.text, /^Wa alaikum assalam, Kahaani!/);
  assert.match(aunty.text, /Allah|MashaAllah|Bismillah/);
  const [uncle, nephew] = opening(by('hakeem'), by('yash'), 1);
  assert.match(uncle.text, /^Assalamu alaikum, Yash!/);
  assert.match(nephew.text, /^Wa alaikum assalam, Uncle Hakeem!/);
});

test('everyone is called the right thing', () => {
  const cases: [string, string, string][] = [
    ['zane', 'josese', 'Dad'], ['mahala', 'ronlyn', 'Mum'], ['rohan', 'josese', 'Uncle Josese'], ['sarah', 'ronlyn', 'Aunty Ronlyn'],
    ['rohan', 'nancy', 'Aunty Nancy'], ['emaana', 'ravi', 'Uncle Ravi'], ['maanvi', 'hussein', 'Grandpa'], ['nancy', 'hussein', 'Dad'],
    ['malvin', 'hussein', ''], ['hussein', 'josese', 'my son'], ['nancy', 'ravi', 'Ravi'], ['yash', 'sarah', 'Sarah'], ['ravi', 'aisha', 'little Aisha'],
  ];
  for (const [a, b, want] of cases) assert.equal(address(by(a), by(b)), want, `${a} → ${b}`);
});
