// What the family say to each other. Anyone can talk to anyone: press E next
// to someone and you greet each other (the younger one with respect and
// thanks, the elder with a blessing, in whichever direction), then you pick
// questions to ask them: how they are, where the Golden Chip is, the beauty of
// nature, how Allah created us, the family's declaration, and one that fits
// the two of you. After a couple of questions they ask you one back and you
// pick an answer.
//
// The Qur'an and hadith lines are short paraphrases of the meaning with the
// reference, not quotations from any one translation. Pure functions, no
// three.js, so they can be unit-tested.

import { firstName, type Character, type CharacterId } from './characters.ts';

export interface Say { who: string; text: string; ref?: string }
export type Step = Say[];

/** The family's declaration, word for word as the family gave it. */
export const DECLARATION = 'I bear witness that there is no god but God, and I bear witness that Muhammad is the Messenger of God.';

export type Generation = 'grand' | 'parent' | 'child' | 'baby';
const RANK: Record<Generation, number> = { grand: 3, parent: 2, child: 1, baby: 0 };
/** Married into the family: they don't call Grandpa "Dad". */
const IN_LAW: ReadonlySet<CharacterId> = new Set(['ronlyn', 'malvin', 'hakeem', 'fawzia']);
/** Josese and Ronlyn's own children. */
const OWN_KIDS: ReadonlySet<CharacterId> = new Set(['zane', 'mahala', 'aisha']);

export function generation(c: Character): Generation {
  if (c.id === 'hussein') return 'grand';
  if (c.look.kind === 'baby') return 'baby';
  if (c.group === 'cousins' || c.id === 'zane' || c.id === 'mahala') return 'child';
  return 'parent';
}

/** What `speaker` calls `listener`, or '' where a plain salaam is better than guessing a title. */
export function address(speaker: Character, listener: Character): string {
  const young = RANK[generation(speaker)] <= RANK.child;
  const name = firstName(listener);
  if (listener.id === 'hussein') return young ? 'Grandpa' : IN_LAW.has(speaker.id) ? '' : 'Dad';
  if (listener.id === 'josese') return OWN_KIDS.has(speaker.id) ? 'Dad' : young ? 'Uncle Josese' : speaker.id === 'hussein' ? 'my son' : name;
  if (listener.id === 'ronlyn') return OWN_KIDS.has(speaker.id) ? 'Mum' : young ? 'Aunty Ronlyn' : name;
  if (listener.id === 'aisha') return 'little Aisha';
  if (listener.group === 'aunties' && young) return `${listener.role} ${name}`;
  return name;
}

const salaam = (to: string) => `Assalamu alaikum${to ? `, ${to}` : ''}!`;
const answer = (to: string) => `Wa alaikum assalam${to ? `, ${to}` : ''}!`;
const pick = <T,>(list: readonly T[], n: number): T => list[((n % list.length) + list.length) % list.length];

// ── Greetings ────────────────────────────────────────────────────────────
const YOUNG_TO_ELDER = [
  'Thank you for everything you do for our family.',
  'JazakAllahu khayran for always looking after us.',
  'It is so good to see you. You make our home happy.',
  'You always make us smile. May Allah bless you.',
];
const ELDER_BLESSING = [
  'MashaAllah, you are growing up so kind. May Allah bless you always.',
  'Be good to your parents and your elders, and Allah will be pleased with you.',
  'May Allah keep you healthy, happy and full of knowledge. Ameen.',
  'Say Bismillah before you start and Alhamdulillah when you finish, and your day will be full of barakah.',
];
const ELDER_TO_YOUNG: Omit<Say, 'who'>[] = [
  { text: 'MashaAllah, look how you have grown! May Allah protect you.' },
  { text: 'Are you being good to your parents? May Allah reward you for it.' },
  { text: 'Keep smiling: a smile for your brother or sister is charity.', ref: 'Hadith, Tirmidhi' },
  { text: 'May Allah fill your life with goodness and knowledge.' },
];
const YOUNG_THANKS = [
  'Thank you! Ameen, and may Allah bless you too.',
  'InshaAllah, I will make you proud.',
  'JazakAllahu khayran. We love you!',
  'Ameen! I will always listen to my elders.',
];
const GRAND_TO_GROWN = [
  'Alhamdulillah, seeing my family together is the greatest blessing.',
  'May Allah reward you for raising these children so well.',
];
const GROWN_TO_GRAND = [
  'How are you feeling today? Can I bring you some tea?',
  'Your duas keep this family together. JazakAllahu khayran.',
];
const GRAND_REPLY = [
  'Alhamdulillah, Allah has blessed me with all of you.',
  'May Allah bless you and your family.',
];
const GROWN_TO_GRAND_REPLY = [
  'May Allah grant you a long and healthy life. Ameen.',
  'Everything good in us, we learned from you.',
];
const GROWN_PEERS: [string, string][] = [
  ['Alhamdulillah, it is good to have the whole family here.', 'Alhamdulillah! Family is a blessing from Allah.'],
  ['SubhanAllah, look how big the kids are getting!', 'MashaAllah. May Allah keep them safe.'],
];
const KID_PEERS: [string, string][] = [
  ['Want to hunt for the Golden Chip together?', "Bismillah, let's go!"],
  ['Did you see how tall the banana trees are out the back?', 'Yes! SubhanAllah, they are huge!'],
];

// ── Nature and creation ─────────────────────────────────────────────────
export const NATURE: Omit<Say, 'who'>[] = [
  { text: 'SubhanAllah, look at the palm trees and the sky. In the creation of the heavens and the earth, and in night following day, are signs for people who think.', ref: "Qur'an 3:190" },
  { text: 'Every banana and breadfruit in this yard grows from the rain Allah sends down. Alhamdulillah for every meal.', ref: "Qur'an 16:10–11" },
  { text: 'Allah created us in the best of forms. Look after your body and your heart: both are gifts from Him.', ref: "Qur'an 95:4" },
  { text: 'Allah made us into peoples and families so we would come to know one another. That is why Fiji is so beautiful.', ref: "Qur'an 49:13" },
  { text: 'Our different languages and colours are among His signs, just like the heavens and the earth.', ref: "Qur'an 30:22" },
  { text: "Look up at the sky over Suva. Look again and again: you won't find a single flaw in what the Most Merciful created.", ref: "Qur'an 67:3" },
  { text: 'Even the birds flying over the garden glorify Allah, along with everything in the heavens and the earth.', ref: "Qur'an 24:41" },
  { text: 'The sea gives us pearls and coral, and the trees give us fruit. Which of the favours of your Lord would you deny?', ref: "Qur'an 55:13, 55:22" },
  { text: 'When the rain falls on Suva, see the mercy of Allah: He brings the dry earth back to life.', ref: "Qur'an 30:50" },
  { text: 'The sun and the moon each swim in their own orbit, and the night never overtakes the day. SubhanAllah!', ref: "Qur'an 36:40" },
  { text: "Allah is beautiful and loves beauty. Let's keep our home and garden clean and green.", ref: 'Hadith, Sahih Muslim' },
  { text: 'SubhanAllah, look at the hibiscus in the front garden. Every petal is just as Allah made it.' },
];

/** The salaam both ways, with good words in the right direction for the two of you. */
export function opening(player: Character, npc: Character, n: number): Step {
  const P = firstName(player), N = firstName(npc);
  const gp = generation(player), gn = generation(npc);
  const toNpc = address(player, npc), toPlayer = address(npc, player);
  if (gp === 'baby') {
    const reply = RANK[gn] >= RANK.parent
      ? 'MashaAllah, little Aisha! May Allah protect you and fill your life with goodness.'
      : OWN_KIDS.has(npc.id) ? 'Aww, Aisha! MashaAllah, you are the cutest little sister.' : 'Aww, Aisha! MashaAllah, you are the cutest.';
    return [{ who: P, text: `(Aisha babbles happily and reaches out to ${toNpc})` }, { who: N, text: reply }];
  }
  if (gn === 'baby') {
    return [{ who: P, text: `${salaam(toNpc)} MashaAllah, what a blessing from Allah you are.` }, { who: N, text: pick(['(Aisha smiles and coos)', '(Aisha giggles and grabs your finger)'], n) }];
  }
  if (gp === 'grand' || gn === 'grand') {
    const grand = gp === 'grand' ? player : npc, other = grand === player ? npc : player;
    const toGrand = address(other, grand), toOther = address(grand, other);
    const otherYoung = generation(other) === 'child';
    const grandLine = otherYoung ? pick(ELDER_BLESSING, n) : pick(GRAND_REPLY, n);
    if (grand === player) {
      // Grandpa speaks first
      const first = otherYoung ? pick(ELDER_TO_YOUNG, n) : { text: pick(GRAND_TO_GROWN, n) };
      return [{ who: P, text: `${salaam(toOther)} ${first.text}`, ref: first.ref }, { who: N, text: `${answer(toGrand)} ${otherYoung ? pick(YOUNG_THANKS, n) : pick(GROWN_TO_GRAND_REPLY, n)}` }];
    }
    const first = otherYoung ? pick(YOUNG_TO_ELDER, n) : pick(GROWN_TO_GRAND, n);
    return [{ who: P, text: `${salaam(toGrand)} ${first}` }, { who: N, text: `${answer(toOther)} ${grandLine}` }];
  }
  if (RANK[gp] < RANK[gn]) {
    // a nephew, niece or child greets an elder; the elder answers with a blessing
    return [{ who: P, text: `${salaam(toNpc)} ${pick(YOUNG_TO_ELDER, n)}` }, { who: N, text: `${answer(toPlayer)} ${pick(ELDER_BLESSING, n)}` }];
  }
  if (RANK[gp] > RANK[gn]) {
    // an elder greets a youngster with a blessing; the youngster thanks them
    const first = pick(ELDER_TO_YOUNG, n);
    return [{ who: P, text: `${salaam(toNpc)} ${first.text}`, ref: first.ref }, { who: N, text: `${answer(toPlayer)} ${pick(YOUNG_THANKS, n)}` }];
  }
  const [a, b] = pick(gp === 'child' ? KID_PEERS : GROWN_PEERS, n);
  return [{ who: P, text: `${salaam(toNpc)} ${a}` }, { who: N, text: `${answer(toPlayer)} ${b}` }];
}

// ── Questions you can ask ───────────────────────────────────────────────────
export interface Question { id: string; label: string; lines: Say[] }
export interface Quiz { ask: Say; choices: { label: string; lines: Say[] }[] }

const HOW_ARE_YOU: Record<Generation, string[]> = {
  grand: ['Alhamdulillah, my health is good and my heart is full, with all of you here.', 'Alhamdulillah, Allah has given me another beautiful day with my family.'],
  parent: ['Alhamdulillah, all good! Enjoying the family day.', 'Alhamdulillah! Busy, but blessed.'],
  child: ["Alhamdulillah, great! I'm having so much fun.", 'Alhamdulillah! Hungry, but happy.'],
  baby: ['(Aisha kicks her legs happily)'],
};

export const CREATION: Omit<Say, 'who'>[] = [
  { text: 'Allah created us in the best of forms, and gave us hearts to love and minds to think.', ref: "Qur'an 95:4" },
  { text: 'Allah made us from one man and one woman, then into peoples and families, so we would come to know one another.', ref: "Qur'an 49:13" },
  { text: 'Allah created us to worship Him: to pray, to be thankful and to do good.', ref: "Qur'an 51:56" },
  { text: 'Our different languages and colours are signs of Allah. He made each of us just right.', ref: "Qur'an 30:22" },
  { text: 'Allah breathed life into Adam and taught him the names of all things. We are made to learn and to wonder.', ref: "Qur'an 15:29, 2:31" },
];

/** A question that only makes sense for the two of you. */
function personal(player: Character, npc: Character, n: number): { label: string; answer: string } {
  const rp = RANK[generation(player)], rn = RANK[generation(npc)];
  if (rp < rn) {
    return pick([
      { label: 'Can I help you with anything?', answer: 'JazakAllahu khayran! Just keep being kind: that is the best help of all.' },
      { label: 'What were you like when you were my age?', answer: 'Always climbing the mango trees, and always home before Maghrib!' },
    ], n);
  }
  if (rp > rn) {
    return pick([
      { label: 'Have you been good to your parents?', answer: 'Yes! I help with the dishes every day, InshaAllah.' },
      { label: 'What did you learn this week?', answer: 'Our teacher said a smile is charity, so I keep smiling!' },
    ], n);
  }
  return rp === RANK.child
    ? { label: 'Want to race to the front gate later?', answer: 'After we find the Golden Chip! Bismillah!' }
    : { label: 'Shall we make tea for everyone?', answer: "Yes! Bismillah, I'll boil the kettle." };
}

/**
 * The questions you can ask `npc`, in menu order. `room` is the Golden Chip's
 * room, or null once you have it. `n` varies the answers between visits.
 */
export function questions(player: Character, npc: Character, room: string | null, n: number): Question[] {
  const P = firstName(player), N = firstName(npc);
  const to = address(player, npc);
  const youBaby = generation(player) === 'baby', themBaby = generation(npc) === 'baby';
  const ask = (words: string, baby: string): Say => ({ who: P, text: youBaby ? baby : words });
  const q = (id: string, label: string, babyLabel: string, lines: Say[]): Question => ({ id, label: youBaby ? babyLabel : label, lines });
  const nature = pick(NATURE, n + npc.id.length);
  const made = pick(CREATION, n + player.id.length);
  const mine = personal(player, npc, n);
  const list: Question[] = [
    q('how', `How are you${to ? `, ${to}` : ''}?`, 'Smile and babble hello', [ask(`How are you${to ? `, ${to}` : ''}?`, '(Aisha smiles and babbles)'), { who: N, text: pick(HOW_ARE_YOU[generation(npc)], n) }]),
    q('chip', room ? 'Have you seen the Golden Chip?' : "I've got the Golden Chip! Where's the gate?", 'Look around for something shiny', [
      ask(room ? 'Have you seen the Golden Chip?' : "I've got the Golden Chip! Where's the gate?", '(Aisha looks around for something shiny)'),
      { who: N, text: npc.line(room) },
    ]),
    q('nature', 'What do you love about nature?', 'Point at the trees outside', themBaby
      ? [ask('Look at the trees, little Aisha! Allah made every leaf.', ''), { who: N, text: '(Aisha watches the palm leaves sway and giggles)' }]
      : [ask('What do you love about nature?', '(Aisha points at the trees outside)'), { who: N, ...nature }]),
    q('made', 'How did Allah create us?', 'Look up at the sky', themBaby
      ? [ask('Allah created you in the best of forms, little one.', ''), { who: N, text: '(Aisha coos and holds your finger)' }]
      : [ask('How did Allah create us?', '(Aisha looks up at the sky, amazed)'), { who: N, ...made }]),
    q('declaration', "What is our family's declaration?", 'Listen to the family', themBaby
      ? [{ who: P, text: `One day you will say it too, little one: “${DECLARATION}”` }, { who: N, text: '(Aisha listens with big, bright eyes)' }]
      : [
        ask("What is our family's declaration?", '(Aisha looks up and listens)'),
        { who: N, text: `We say it with our whole heart: “${DECLARATION}”` },
        ...(RANK[generation(npc)] > RANK[generation(player)] ? [{ who: N, text: youBaby ? 'One day you will say it too, little one.' : 'Keep it in your heart always.' }] : []),
      ]),
  ];
  if (!youBaby && !themBaby) list.push(q('mine', mine.label, '', [ask(mine.label, ''), { who: N, text: mine.answer }]));
  if (youBaby) list.push(q('hug', 'Reach out for a cuddle', 'Reach out for a cuddle', [{ who: P, text: `(Aisha reaches out to ${to})` }, { who: N, text: 'MashaAllah! Come here, little one. May Allah protect you always.' }]));
  return list;
}

/** What they ask you back, with the answers you can choose. Null when they can't (the baby). */
export function quiz(player: Character, npc: Character, room: string | null, n: number): Quiz | null {
  const P = firstName(player), N = firstName(npc);
  const gp = generation(player), gn = generation(npc);
  if (gn === 'baby') return null;
  const me = (text: string): Say => ({ who: P, text });
  const them = (text: string): Say => ({ who: N, text });
  if (gp === 'baby') {
    return { ask: them("Who's the happiest baby in Fiji?"), choices: [
      { label: '(Giggle)', lines: [me('(Aisha giggles)'), them('MashaAllah, it is you!')] },
      { label: '(Clap)', lines: [me('(Aisha claps her tiny hands)'), them('MashaAllah! Clap, clap, clap!')] },
    ] };
  }
  if (RANK[gn] > RANK[gp] && gp === 'child') {
    return pick<Quiz>([
      { ask: them('Who created the sea, the trees and the sky?'), choices: [
        { label: 'Allah', lines: [me('Allah!'), them('MashaAllah! SubhanAllah, everything we see is His creation.')] },
        { label: 'The fishermen', lines: [me('The fishermen?'), them('Hehe, no! Allah created all of it, even the fishermen.')] },
        { label: 'Nobody knows', lines: [me('Nobody knows?'), them('We do know: Allah created everything. SubhanAllah!')] },
      ] },
      { ask: them('What do we say before we eat?'), choices: [
        { label: 'Bismillah', lines: [me('Bismillah!'), them("MashaAllah, that's right!")] },
        { label: 'Alhamdulillah', lines: [me('Alhamdulillah!'), them('Close! We say Alhamdulillah when we finish. Before, we say Bismillah.')] },
        { label: 'Yum!', lines: [me('Yum!'), them('Haha! Bismillah first, then yum!')] },
      ] },
      { ask: them('What do we say when we see something beautiful?'), choices: [
        { label: 'SubhanAllah', lines: [me('SubhanAllah!'), them('MashaAllah! The wonder of creation fills your heart.')] },
        { label: 'MashaAllah', lines: [me('MashaAllah!'), them("Beautiful! We say MashaAllah for the blessings Allah gives, and SubhanAllah for His wonders.")] },
        { label: 'Whatever', lines: [me('Whatever.'), them('Oh no! Try SubhanAllah: it fills your heart.')] },
      ] },
      { ask: them('How should we treat our elders?'), choices: [
        { label: 'With respect and kindness', lines: [me('With respect and kindness.'), them('MashaAllah! That is what the Prophet (peace be upon him) taught us.')] },
        { label: 'Only when they give us lollies', lines: [me('Only when they give us lollies?'), them('Hehe! Respect and kindness always, lollies or not.')] },
      ] },
      { ask: them('What do we say to thank someone?'), choices: [
        { label: 'JazakAllahu khayran', lines: [me('JazakAllahu khayran!'), them('MashaAllah! May Allah reward you with good too.')] },
        { label: 'Vinaka vakalevu', lines: [me('Vinaka vakalevu!'), them('Vinaka! Thanking people is beautiful in every language.')] },
      ] },
    ], n);
  }
  if (RANK[gn] > RANK[gp]) {
    // Grandpa asks one of the grown-ups
    return { ask: them('Are you looking after your health?'), choices: [
      { label: "Alhamdulillah, I'm trying", lines: [me("Alhamdulillah, I'm trying."), them('Good. Your body is an amanah, a trust from Allah.')] },
      { label: "InshaAllah, I'll walk more", lines: [me("InshaAllah, I'll walk more."), them('InshaAllah. Come walk with me in the mornings!')] },
    ] };
  }
  if (gp === 'grand' && gn === 'parent') {
    // one of the grown-ups looks after Grandpa
    const to = address(npc, player);
    return { ask: them(`${to ? `${to}, would` : 'Would'} you like a cup of tea?`), choices: [
      { label: 'Yes please, with two sugars', lines: [me('Yes please, with two sugars.'), them('Coming right up, Bismillah!')] },
      { label: "Alhamdulillah, I'm fine", lines: [me("Alhamdulillah, I'm fine."), them('Just call me if you need anything.')] },
    ] };
  }
  if (RANK[gn] < RANK[gp]) {
    // a youngster asks you, the elder
    const help = room
      ? { label: `Try the ${room}`, lines: [me(`Try the ${room}.`), them('JazakAllahu khayran! Bismillah, here I go!')] }
      : { label: 'Out the front gate!', lines: [me('Out the front gate!'), them('JazakAllahu khayran!')] };
    return pick<Quiz>([
      { ask: them(`${address(npc, player) || firstName(player)}, why is the sky so big?`), choices: [
        { label: 'Allah made it that way, as a sign for us', lines: [me('Allah made it that way, as a sign for us.'), them('SubhanAllah! I want to look at it every day.')] },
        { label: 'So the birds have room to fly', lines: [me('So the birds have room to fly!'), them('Hehe! And the birds glorify Allah up there too.')] },
      ] },
      { ask: them('Will you tell me a story tonight?'), choices: [
        { label: 'InshaAllah, after dinner', lines: [me('InshaAllah, after dinner.'), them('Yay! JazakAllahu khayran!')] },
        { label: 'If you finish your homework', lines: [me('If you finish your homework.'), them("Deal! InshaAllah I'll finish it.")] },
      ] },
      { ask: them(room ? 'Can you help me find the Golden Chip?' : 'Where do I go now?'), choices: [
        help,
        { label: "Keep looking, you'll find it", lines: [me("Keep looking, you'll find it!"), them('InshaAllah! Bismillah!')] },
      ] },
    ], n);
  }
  // the same generation
  return gp === 'child'
    ? { ask: them('Do you want to race to the front gate?'), choices: [
      { label: "Bismillah, let's go!", lines: [me("Bismillah, let's go!"), them('Wait for me!')] },
      { label: 'After I find all the parts', lines: [me('After I find all the parts.'), them("Okay, I'll help you look!")] },
    ] }
    : { ask: them("Isn't it beautiful when the whole family is together?"), choices: [
      { label: 'Alhamdulillah, it is', lines: [me('Alhamdulillah, it is.'), them('May Allah keep us together always. Ameen.')] },
      { label: 'Yes, and so much food!', lines: [me('Yes, and so much food!'), them('Haha! Alhamdulillah for the food too.')] },
    ] };
}

/** Saying goodbye. */
export function farewell(player: Character, npc: Character): Step {
  const P = firstName(player), N = firstName(npc);
  if (generation(player) === 'baby') return [{ who: P, text: '(Aisha waves bye-bye)' }, { who: N, text: 'Bye bye, little Aisha! Fi amanillah.' }];
  if (generation(npc) === 'baby') return [{ who: P, text: 'Bye bye, little Aisha! Fi amanillah.' }, { who: N, text: '(Aisha waves her tiny hand)' }];
  return [{ who: P, text: 'Assalamu alaikum, see you soon!' }, { who: N, text: 'Wa alaikum assalam! Fi amanillah.' }];
}
