import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, Brain, ExternalLink } from 'lucide-react';
import { DotsSquare, MistakesChart, XorNetwork } from '../components/neuron/LearnDiagrams';
import { workedExample, xorRows } from '../lib/neuronExamples';
import { fmt } from '../lib/perceptron';
import { pageLink } from '../links';

// The Neuron Lab's "Learn more" notes, at /neuron-lab/learn/. Plain, friendly
// words for visitors (sections 1 to 5) and for people who want to start
// learning AI themselves (sections 6 and 7).
// Dates and names were checked against sources in November 2026 (see the pull
// request that added this page). The worked example and the mistakes chart are
// computed by src/lib/perceptron.ts, the same code the Neuron Lab runs.

const ACCENT = '#0d9488';
const INK = '#0f172a';
const MUTED = '#64748b';
const BODY = '#334155';

const TOC = [
  { id: 'where-ai-begins', label: '1. Where AI begins' },
  { id: 'one-neuron', label: '2. How one neuron works' },
  { id: 'how-it-learns', label: '3. How a neuron learns' },
  { id: 'many-neurons', label: '4. From one neuron to many' },
  { id: 'modern-ai', label: '5. Modern AI' },
  { id: 'at-home', label: '6. Starting at home' },
  { id: 'learning-path', label: '7. A learning path' },
];

const TIMELINE: { year: string; title: string; text: ReactNode }[] = [
  { year: '1943', title: 'The first artificial neuron',
    text: <>Warren McCulloch, a brain scientist, and Walter Pitts, a young maths prodigy, noticed that a real neuron collects signals from other cells, adds them up, and only “fires” when the total is strong enough. They wrote this down as a maths rule: inputs go in, they are added, and the answer is yes (1) or no (0). They showed that a network of these simple on-off units could, in theory, do logic, like a tiny computer. Their neuron could not learn yet: a person had to set every number by hand.</> },
  { year: '1949', title: 'Learning means stronger connections',
    text: <>In his book <i>The Organization of Behavior</i>, psychologist Donald Hebb suggested that the brain learns by strengthening the links between cells that are active together. Today his idea is often summed up as “cells that fire together, wire together” (a phrase coined decades later). The idea that learning means changing the strength of connections is still at the heart of AI. In a computer, those connection strengths are called <b>weights</b>.</> },
  { year: '1956', title: 'AI gets its name',
    text: <>In 1955, John McCarthy, with Marvin Minsky, Nathaniel Rochester and Claude Shannon, wrote a proposal for a summer workshop at Dartmouth College in the United States, and used the name “artificial intelligence” in it. The workshop took place in the summer of 1956 and is seen as the start of AI as a field. The researchers were very hopeful and expected fast progress.</> },
  { year: '1957–1960', title: 'The perceptron, a neuron that learns',
    text: <>Frank Rosenblatt, a psychologist at the Cornell Aeronautical Laboratory in Buffalo, New York, took the McCulloch–Pitts neuron and added a learning rule: when the neuron guesses wrong, nudge its weights a little toward the right answer. He first tried it on an IBM 704 computer in 1957 and showed it to the public in 1958, then built a real machine, the Mark I Perceptron, with a 20 × 20 grid of 400 light sensors, finished around 1960. It learned to tell simple shapes apart, and newspapers got very excited. <b>The neuron in Neuron Lab is a perceptron.</b></> },
  { year: '1969', title: 'The first setback',
    text: <>Marvin Minsky and Seymour Papert published a book, <i>Perceptrons</i>, showing that a single perceptron cannot learn some very simple patterns. The famous example is XOR: “say yes if exactly one input is on, but not both.” One neuron can only draw one straight dividing line, and XOR needs two. The book is often blamed for the sharp drop in interest and funding that followed.</> },
  { year: '1970s and late 1980s', title: 'The “AI winters”',
    text: <>Twice, big promises were not met, money dried up, and many researchers moved to other fields. During these quiet years, a few people kept working on neural networks anyway.</> },
  { year: '1986', title: 'The comeback: backpropagation',
    text: <>David Rumelhart, Geoffrey Hinton and Ronald Williams made popular a method called <b>backpropagation</b> (others had found the maths earlier). It sends the error backwards through several layers of neurons, so every neuron learns its share of the fix. With layers, networks could finally learn XOR and much harder problems.</> },
  { year: '1989–1998', title: 'Reading handwriting',
    text: <>Yann LeCun and his team at AT&T Bell Labs built networks that read handwritten postcode digits (1989). By the late 1990s, networks like theirs were reading millions of bank cheques a day. Their 1998 paper described MNIST, a collection of 70,000 handwritten digits (60,000 to learn from, 10,000 to test with). LvTS founder Joe trained his own digit reader on this same dataset in Google Colab.</> },
  { year: '2009–2012', title: 'Big data plus graphics cards',
    text: <>Fei-Fei Li’s team created ImageNet, first shown in 2009 and now more than 14 million labelled photos. In 2012, a deep network called AlexNet, from Alex Krizhevsky, Ilya Sutskever and Geoffrey Hinton, trained on two graphics cards (GPUs), won the ImageNet contest by a huge margin: about 15 wrong answers in every 100 against about 26 for the next best. This moment started the modern deep-learning boom.</> },
  { year: '2017', title: 'The transformer',
    text: <>Researchers at Google published “Attention Is All You Need,” describing the <b>transformer</b>, a network design that is very good at understanding language by looking at how every word relates to every other word. Almost every modern chatbot is built on it.</> },
  { year: '2018 onward', title: 'Large language models',
    text: <>Companies trained transformers on enormous amounts of text to predict the next word. As they grew bigger, they became able to write, explain, translate and code. ChatGPT was released to the public in November 2022, and AI assistants like Claude followed in 2023. Under the hood, they still use the same basic idea from 1943: huge numbers of tiny neurons adding up numbers, with weights learned from examples.</> },
  { year: 'Awards', title: 'The top prizes',
    text: <>Hinton, LeCun and Yoshua Bengio received the 2018 Turing Award, often called the Nobel Prize of computing, for deep learning. In 2024, Hinton and John Hopfield received the Nobel Prize in Physics for early work on neural networks.</> },
];

function Section({ id, n, title, children, alt = false }: { id: string; n: number; title: string; children: ReactNode; alt?: boolean }) {
  return (
    <section id={id} className="ln-section" style={{ background: alt ? '#f8fafc' : '#fff' }}>
      <div className="ln-wrap">
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, marginBottom: '0.5rem' }}>Part {n}</div>
        <h2 className="ln-h2">{title}</h2>
        {children}
      </div>
    </section>
  );
}

const H3 = ({ children }: { children: ReactNode }) => <h3 className="ln-h3">{children}</h3>;
const P = ({ children }: { children: ReactNode }) => <p className="ln-p">{children}</p>;

/** A simple table. With boldFirst, the first cell of each row is the row's name, in bold. */
function Table({ head, rows, caption, boldFirst = false }: { head: ReactNode[]; rows: ReactNode[][]; caption?: string; boldFirst?: boolean }) {
  return (
    <div className="ln-table-wrap">
      <table className="ln-table">
        {caption && <caption>{caption}</caption>}
        <thead><tr>{head.map((h, i) => <th key={i} scope="col">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => (boldFirst && j === 0
          ? <th key={j} scope="row" className="ln-rowhead">{c}</th>
          : <td key={j}>{c}</td>))}</tr>)}</tbody>
      </table>
    </div>
  );
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="ln-link">{children}<ExternalLink size={13} style={{ marginLeft: 3, verticalAlign: '-1px' }} /></a>;
}

const Code = ({ children }: { children: string }) => <pre className="ln-code"><code>{children}</code></pre>;

function Note({ children }: { children: ReactNode }) {
  return <div className="ln-note">{children}</div>;
}

const ROUND_WORD = (r: number) => `${r} ${r === 1 ? 'round' : 'rounds'}`;

export default function NeuronLearnPage({ onNav }: { onNav: (p: string) => void }) {
  const worked = workedExample();
  const xor = xorRows();
  const f = worked.final;

  return (
    <div className="ln-page">
      <style>{CSS}</style>

      {/* Hero */}
      <section style={{ padding: '110px 1.5rem 44px', background: 'linear-gradient(160deg,#0f172a 0%,#123a3a 60%,#0f4c4a 100%)', color: '#fff' }}>
        <div className="ln-wrap">
          <a {...pageLink('neuron-lab', onNav)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#5eead4', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none', marginBottom: '1rem' }}>
            <ArrowLeft size={16} /> Back to the Neuron Lab
          </a>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5.5vw,3rem)', lineHeight: 1.1, marginBottom: '1rem' }}>
            How AI learns: from one neuron to chatbots
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 680, marginBottom: '1.4rem' }}>
            The story of AI in plain words: where it started, how one neuron works and learns, why we join many of them together, how chatbots are made, and how you can start learning AI at home.
          </p>
          <nav aria-label="On this page" className="ln-toc">
            {TOC.map((t) => <a key={t.id} href={`#${t.id}`}>{t.label}</a>)}
          </nav>
        </div>
      </section>

      <Section id="where-ai-begins" n={1} title="Where AI begins">
        <P>AI did not start with computers that talk. It started more than 80 years ago with a simple question: can we describe a brain cell with maths?</P>
        <ol className="ln-timeline">
          {TIMELINE.map((t) => (
            <li key={t.year}>
              <div className="ln-year">{t.year}</div>
              <div>
                <div className="ln-tl-title">{t.title}</div>
                <p className="ln-p" style={{ margin: 0 }}>{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
        <Note><b>The big lesson:</b> AI grew in waves. The core idea is old and simple; what changed is that we now have far more data and far faster computers to run it at huge scale.</Note>
      </Section>

      <Section id="one-neuron" n={2} title="How one neuron works" alt>
        <P>A neuron is a tiny decision-maker. It takes in a few numbers, weighs them up, and gives one answer: yes (1) or no (0). It has four parts.</P>
        <Table boldFirst head={['Part', 'What it is', 'Everyday picture']} rows={[
          ['Inputs', 'The clues coming in, usually numbers like 0 or 1', '“Is it sunny?” “Is it the weekend?”'],
          ['Weights', 'One number per input: how much the neuron trusts that clue', 'The weekend matters a lot, sunshine only a bit'],
          ['Bias', 'One extra number added to the total', 'How keen you are anyway, like a volume knob'],
          ['Rule (activation)', 'Turns the total into the answer', 'If the total is above zero, say yes'],
        ]} />
        <H3>The recipe, every time</H3>
        <ol className="ln-list">
          <li>Multiply each input by its weight.</li>
          <li>Add those results together.</li>
          <li>Add the bias.</li>
          <li>If the total is above zero, the answer is 1 (yes). Otherwise it is 0 (no).</li>
        </ol>
        <div className="ln-formula" role="math" aria-label="total equals x1 times w1 plus x2 times w2 plus b. The answer is 1 if the total is above 0, otherwise 0.">
          <div>total = (x₁ × w₁) + (x₂ × w₂) + b</div>
          <div>answer = 1 if total &gt; 0, otherwise 0</div>
        </div>
        <P>Here x₁ and x₂ are the inputs, w₁ and w₂ are the weights, and b is the bias.</P>

        <H3>A worked example: should I go fishing?</H3>
        <P>Say the neuron has these settings: weight for “sunny” = 0.3, weight for “weekend” = 0.8, bias = −0.5.</P>
        <Table head={['Sunny?', 'Weekend?', 'Sum: sunny × 0.3 + weekend × 0.8 − 0.5', 'Total', 'Answer']} rows={[
          ['0', '0', '0 + 0 − 0.5', '−0.5', '0, stay home'],
          ['1', '0', '0.3 + 0 − 0.5', '−0.2', '0, stay home'],
          ['0', '1', '0 + 0.8 − 0.5', '0.3', <b key="a">1, go fishing</b>],
          ['1', '1', '0.3 + 0.8 − 0.5', '0.6', <b key="a">1, go fishing</b>],
        ]} />
        <P>With these weights, the neuron goes fishing on any weekend, sunny or not, and never on a weekday. Change the numbers and it makes different choices. The weights and bias are the neuron’s whole “personality.”</P>
        <P><b>Why the bias matters.</b> Look at the first row: both inputs are 0, so without a bias the total would always be 0, whatever the weights are. The neuron could never change its mind in that case. The bias moves the line where “no” turns into “yes.” A positive bias makes the neuron say yes easily; a negative bias makes it need strong reasons.</P>
        <P><b>What positive and negative weights mean.</b> A positive weight means “this clue pushes me toward yes.” A negative weight means “this clue pushes me toward no,” for example “Is it raining?” for fishing. A weight near zero means “I ignore this clue.”</P>
        <P><b>One neuron draws one line.</b> If you plot the four input combinations as four dots on a square, a single neuron splits them with one straight line: yes on one side, no on the other. That is why it can learn AND and OR, but not XOR, which needs two lines (see part 4).</P>
        <div className="ln-dots">
          <DotsSquare lesson="and" lines={[1.5]} />
          <DotsSquare lesson="or" lines={[0.5]} />
          <DotsSquare lesson="xor" lines={[0.5, 1.5]} />
        </div>
        <P><b>How this maps to the Neuron Lab.</b> The two input buttons are x₁ and x₂. The two weight sliders are w₁ and w₂, and the bias slider is b. The number inside the circle is the total, and the circle lights up when the answer is 1. You can move the sliders by hand and watch the answers change before letting the neuron teach itself.</P>
        <Note><b>A note on real brains.</b> The artificial neuron is only loosely inspired by brain cells. A real neuron is far more complex, with thousands of connections and chemical signals. The computer version keeps just the core idea: add up weighted signals and decide.</Note>
      </Section>

      <Section id="how-it-learns" n={3} title="How a neuron learns">
        <P>A new neuron knows nothing. Its weights and bias start at zero or at random numbers, so its first answers are guesses. Learning means fixing those numbers, a little at a time, using examples where we already know the right answer.</P>
        <P><b>The examples (training data).</b> To teach AND (“say yes only when both inputs are 1”), we give it four examples:</P>
        <Table head={['Input 1', 'Input 2', 'Right answer']} rows={[['0', '0', '0'], ['0', '1', '0'], ['1', '0', '0'], ['1', '1', '1']]} />
        <H3>The nudge rule (perceptron learning rule)</H3>
        <P>For each example:</P>
        <ol className="ln-list">
          <li>Let the neuron guess.</li>
          <li>Work out the error: <b>error = right answer − guess</b>. It can only be 0 (correct), +1 (said no, should be yes) or −1 (said yes, should be no).</li>
          <li>Nudge each weight: <b>new weight = old weight + learning rate × error × that input</b>.</li>
          <li>Nudge the bias: <b>new bias = old bias + learning rate × error</b>.</li>
        </ol>
        <P>The <b>learning rate</b> is how big each nudge is. The Neuron Lab uses 0.1. Too big and the neuron jumps around; too small and it learns slowly.</P>
        <P>Notice three things about the rule:</P>
        <ul className="ln-list">
          <li>If the guess was right, the error is 0, so nothing changes.</li>
          <li>If the neuron said no but should have said yes, the weights go up, making yes easier next time. If it said yes but should have said no, they go down.</li>
          <li>An input of 0 played no part in the decision, so its weight is not changed.</li>
        </ul>

        <H3>Worked example: teaching AND</H3>
        <P>Start: weight 1 = 0, weight 2 = 0, bias = 0, learning rate 0.1. One pass through all four examples is called a <b>round</b> (in AI jargon, an <i>epoch</i>). The table lists only the mistakes, because correct guesses change nothing.</P>
        <Table head={['Round', 'Example', 'Guess', 'Should be', 'Nudge', 'Weight 1', 'Weight 2', 'Bias']}
          rows={worked.rows.map((r) => [String(r.round), r.example, String(r.guess), String(r.right), r.up ? 'up' : 'down', fmt(r.after.w1), fmt(r.after.w2), fmt(r.after.bias)])} />
        <P>
          After the nudge in round {worked.rounds}, every guess is right, so the Neuron Lab stops and says “Learned it in {ROUND_WORD(worked.rounds)}!”
          (Many textbooks run one more round to double-check: no mistakes, so nothing changes.) Check the final numbers:
          for 1, 1 the total is {fmt(f.w1)} + {fmt(f.w2)} − {fmt(-f.bias)} = 0.1, above zero, so yes.
          For 1, 0 it is {fmt(f.w1)} − {fmt(-f.bias)} = 0, not above zero, so no.
          For 0, 1 it is {fmt(f.w2)} − {fmt(-f.bias)} = −0.1, so no. For 0, 0 it is {fmt(f.bias)}, so no. Exactly AND.
        </P>
        <figure className="ln-figure">
          <MistakesChart mistakes={worked.mistakes} />
          <figcaption>Mistakes in each round of the worked example. The number drops as the neuron learns, and the final check finds none.</figcaption>
        </figure>
        <P>In the Neuron Lab the weights start random, so each run takes a different number of rounds and ends with different numbers. That is normal: there are many sets of weights that all do the job.</P>
        <P><b>Teaching it something new.</b> Switch the lesson to OR (“yes if either input is 1”) and press teach again. The same neuron, with the same rule, rewires itself for the new job. This is the key idea of machine learning: we don’t write the rules; we give examples and a way to learn from mistakes, and the machine finds the rules itself.</P>
        <P><b>Will it always finish?</b> For problems one straight line can split, like AND and OR, yes. Mathematicians proved in the early 1960s that the perceptron rule always gets there in a limited number of steps. For XOR it never finishes, because no single line works, which is why the Neuron Lab stops after 100 rounds.</P>
        <P><b>Who does what?</b> The programmer chooses the problem, collects the examples, writes the rule and picks the learning rate, then presses run. The computer does all the guessing and nudging by itself, thousands of times if needed. The programmer then tests the result and, if it isn’t good enough, changes the examples or the design and trains again.</P>
      </Section>

      <Section id="many-neurons" n={4} title="From one neuron to many" alt>
        <P>One neuron can only draw one straight line between yes and no. Real problems, like reading handwriting or understanding a sentence, need far more. The answer is to connect many neurons in layers.</P>
        <H3>The XOR problem</H3>
        <P>XOR means “yes if exactly one input is on, but not both.”</P>
        <Table head={['Input 1', 'Input 2', 'XOR answer']} rows={[['0', '0', '0'], ['0', '1', '1'], ['1', '0', '1'], ['1', '1', '0']]} />
        <P>Plot these four dots on a square: the two yes dots sit on opposite corners. No single straight line can put both yes dots on one side and both no dots on the other. So one neuron can never learn it, however long it trains. This is the problem Minsky and Papert pointed out in 1969.</P>
        <H3>Solving XOR with three neurons</H3>
        <P>Put two neurons side by side in a <b>hidden layer</b>, then one more neuron that combines them.</P>
        <Table head={['Neuron', 'Job', 'Weights', 'Bias']} rows={[
          ['Hidden A', 'OR: yes if either input is on', '1, 1', '−0.5'],
          ['Hidden B', 'NAND: yes unless both are on', '−1, −1', '1.5'],
          ['Output', 'AND of A and B', '1, 1', '−1.5'],
        ]} />
        <figure className="ln-figure"><XorNetwork /></figure>
        <P>Check 1, 1: A says yes (1 + 1 − 0.5 = 1.5), B says no (−1 − 1 + 1.5 = −0.5), so the output gets 1 and 0, and 1 + 0 − 1.5 = −0.5, which is no. Correct. Try the other three rows yourself: they all come out right.</P>
        <details className="ln-details">
          <summary>Show all four rows</summary>
          <Table head={['Input 1', 'Input 2', 'A (OR)', 'B (NAND)', 'Output', 'XOR answer']}
            rows={xor.map((r) => [String(r.a), String(r.b), String(r.A), String(r.B), <b key="out">{r.out}</b>, `${r.right} ${r.out === r.right ? '✓' : '✗'}`])} />
        </details>
        <P>Each hidden neuron draws one line, and the output neuron combines the two lines into a shape no single neuron could make. That is the whole secret of deep learning: simple pieces, stacked, can draw very complicated shapes.</P>
        <H3>Layers, named</H3>
        <ul className="ln-list">
          <li><b>Input layer:</b> the raw data going in. For an MNIST digit, that is 784 numbers, one for each pixel of a 28 × 28 picture.</li>
          <li><b>Hidden layers:</b> neurons in the middle that find patterns. Early layers might spot edges and curves; later ones combine them into loops and strokes.</li>
          <li><b>Output layer:</b> the final answers. For MNIST, 10 neurons, one for each digit 0 to 9; the one that lights up most is the guess.</li>
        </ul>
        <P>A network with many hidden layers is called a <b>deep</b> network, which is where the words <i>deep learning</i> come from.</P>
        <H3>Softer neurons: activation functions</H3>
        <P>The Neuron Lab neuron jumps straight from 0 to 1, like a light switch. That is fine for one neuron, but for many layers to learn together, each neuron needs to change smoothly, like a dimmer. So modern networks use smooth rules:</P>
        <ul className="ln-list">
          <li><b>Sigmoid:</b> squashes any total into a number between 0 and 1. Used in early networks.</li>
          <li><b>ReLU:</b> if the total is negative, output 0; otherwise output the total itself. Very simple and very popular today.</li>
        </ul>
        <P>The smooth change lets the network work out how much each tiny adjustment helps, which is what the next idea needs.</P>
        <H3>Backpropagation: sharing the blame</H3>
        <P>With one neuron, it’s obvious who made the mistake. With thousands of neurons in layers, which ones should change, and by how much? Backpropagation answers this:</P>
        <ol className="ln-list">
          <li><b>Forward pass:</b> an example goes in, flows through all the layers, and an answer comes out.</li>
          <li><b>Measure the error:</b> compare the answer with the right one. The size of the error is called the <b>loss</b>.</li>
          <li><b>Backward pass:</b> send the error backwards, layer by layer, working out how much each weight contributed to it.</li>
          <li><b>Nudge every weight</b> a little in the direction that would have shrunk the error.</li>
        </ol>
        <P>Repeat this for thousands or millions of examples, and the whole network slowly improves.</P>
        <P><b>Gradient descent, the picture.</b> Imagine standing on a hilly field in the dark, trying to reach the lowest valley, where the error is smallest. You can’t see far, but you can feel which way the ground slopes under your feet. So you take a small step downhill, feel again, and step again. The learning rate is the size of each step. Backpropagation is how the network feels the slope for every one of its weights at once.</P>
        <P><b>Why it needs so many examples.</b> A network with millions of weights has millions of knobs to set. To set them well, it needs to see enough examples, with enough variety, that it learns the general pattern instead of just memorising the training examples. Memorising is called <b>overfitting</b>: the network does well on examples it has seen and badly on new ones. That’s why we always test on examples kept aside, which the network never trained on.</P>
        <Note><b>Connection to Joe’s MNIST model.</b> The Keras model Joe trained in Google Colab did exactly this: 784 inputs, one or more hidden layers, 10 outputs, backpropagation and gradient descent, run automatically by TensorFlow. The Neuron Lab shows the same process with one neuron, so every number is visible.</Note>
      </Section>

      <Section id="modern-ai" n={5} title="Modern AI: from neurons to chatbots">
        <P>The ideas in parts 2 to 4 were mostly known by the late 1980s. Modern AI took off around 2012 because three things finally came together: huge amounts of data, much faster computers, and better network designs.</P>
        <P><b>1. Data.</b> The internet made billions of photos, web pages, books and videos available. A network learns from examples, so more good examples mean better learning. ImageNet (millions of labelled photos) and, later, huge text collections were key.</P>
        <P><b>2. Graphics cards (GPUs).</b> A graphics card was built to draw video-game scenes, which means doing millions of small sums at the same time. Training a neural network is the same kind of work: multiplying inputs by weights and adding them up, over and over. A GPU can do this many times faster than a normal processor (CPU). In 2012, AlexNet showed that training on GPUs made deep networks practical. Today, AI companies train their biggest models on thousands of specialised AI chips running for weeks or months.</P>
        <Table boldFirst head={['', 'CPU (normal processor)', 'GPU (graphics card)']} rows={[
          ['Built for', 'Doing a few complicated jobs, one after another', 'Doing thousands of simple sums at once'],
          ['Good at', 'Running your apps and the operating system', 'Graphics, games, and training AI'],
          ['Speed for AI training', 'Slow', 'Many times faster'],
        ]} />
        <P><b>3. Better designs.</b> Researchers invented network shapes suited to each kind of data:</P>
        <ul className="ln-list">
          <li><b>Convolutional networks (CNNs)</b> for pictures. They slide small pattern-detectors across an image, so a cat is recognised whether it’s in the corner or the middle. They power face unlock, photo search and medical scans.</li>
          <li><b>Recurrent networks (RNNs)</b> for sequences like speech and text, reading one piece at a time and keeping a memory. Mostly replaced now by transformers.</li>
          <li><b>Transformers (2017)</b> for language and much more. Instead of reading word by word, a transformer looks at all the words at once and works out which words matter to each other. This is called <b>attention</b>. In “The PS5 overheated because it was full of dust,” attention helps the model link “it” to “the PS5”.</li>
        </ul>
        <H3>How a chatbot like ChatGPT or Claude is made, simply</H3>
        <ol className="ln-list">
          <li><b>Words become numbers.</b> Text is split into small pieces called <b>tokens</b> (whole words or parts of words), and each token is turned into a list of numbers the network can work with.</li>
          <li><b>Pre-training: predict the next word.</b> The model reads an enormous amount of text and, again and again, tries to guess the next token. Every wrong guess nudges its weights: the same idea as the Neuron Lab neuron, but with billions of weights. By getting good at predicting text, it picks up grammar, facts, reasoning patterns and writing styles.</li>
          <li><b>Fine-tuning: learning to be a helpful assistant.</b> The model is then trained further on examples of good conversations, and people rate its answers so it learns which responses are helpful, honest and safe.</li>
          <li><b>Using it.</b> When you type a question, the model predicts a reply one token at a time, each new token chosen based on everything before it.</li>
        </ol>
        <P>The result is called a <b>large language model (LLM)</b>. “Large” refers to the number of weights, often called <b>parameters</b>: small models have around a billion, and the biggest have hundreds of billions or more.</P>
        <P><b>What AI can and can’t do.</b> Modern AI can write, translate, summarise, code, describe pictures and hold conversations. But it can also make confident mistakes (sometimes called <i>hallucinations</i>), it only knows what it learned from data, and it doesn’t understand the world the way people do. Always check important answers.</P>
        <P><b>Why even engineers can’t fully explain it.</b> Engineers choose the data, the design and the learning rule. But the billions of weights are set automatically by training, and nobody can read them one by one to see exactly why the model gave a particular answer. A research field called <b>interpretability</b> works on looking inside these networks to understand what they’ve learned. Meanwhile, AI companies guide their models through careful training, rules and lots of testing.</P>
        <H3>Open models and closed models</H3>
        <ul className="ln-list">
          <li><b>Closed models</b> (like Claude or ChatGPT) are used through a company’s app or API. You can’t download their weights.</li>
          <li><b>Open-weight models</b> (like Meta’s Llama, Google’s Gemma, Mistral’s open models and Alibaba’s Qwen) publish their trained weights, so anyone can download and run them on their own computer, under each model’s licence. Check the licence before using one in a business.</li>
        </ul>
        <Note><b>The thread from 1943 to today.</b> A chatbot is, at heart, made of the same building block as the Neuron Lab neuron: inputs times weights, plus a bias, passed through a rule, learned from mistakes. The difference is scale: billions of weights, trillions of words of examples, and thousands of fast chips.</Note>
      </Section>

      <Section id="at-home" n={6} title="Starting at home: the computer and the software" alt>
        <P>You don’t need a supercomputer to start learning AI. You can begin today in a web browser, then move to your own laptop or PC as you grow. The computer levels below are rough guides from experience, not checked against current models or Fiji prices; newer equivalents of the parts named work too.</P>
        <P><b>Step zero: start free in the browser.</b> <Ext href="https://colab.research.google.com/">Google Colab</Ext> runs Python in your browser on Google’s computers, with a free graphics card you can switch on (when one is available). Any laptop, even an old one, is enough. Everything in the Neuron Lab, and a first MNIST model, runs fine there. The free version has limits, such as sessions that stop after a while.</P>
        <H3>What matters most in a computer for AI</H3>
        <Table boldFirst head={['Part', 'Why it matters for AI']} rows={[
          ['Graphics card (GPU) and its memory (VRAM)', 'The biggest factor. Training and running models happens here, and the model must fit in the GPU’s memory.'],
          ['System memory (RAM)', 'Holds your data and programs. Too little and everything slows down or crashes.'],
          ['Storage (SSD)', 'Datasets and models are big files, often several gigabytes each. A fast SSD loads them quickly.'],
          ['Processor (CPU)', 'Matters less for AI, but a modern one keeps everything else smooth.'],
          ['Cooling and power', 'Training runs a computer flat out for long periods. Good airflow helps, and in Fiji a surge protector or UPS protects against power cuts and spikes.'],
        ]} />
        <H3>Three levels of home computer</H3>
        <Table boldFirst head={['Level', 'Rough setup', 'What you can do']} rows={[
          ['Starter', 'Any laptop with 8 GB RAM, no special graphics card', 'Learn Python, build the one neuron, small networks; use Colab for anything heavier; use AI through apps and APIs'],
          ['Good', '16 GB RAM, SSD, NVIDIA graphics card with 8 GB VRAM or more (for example an RTX 3060 or 4060 class card)', 'Train image models like MNIST and small CNNs on your own machine; run small open models (about 3 to 8 billion parameters) with Ollama'],
          ['Strong', '32 GB RAM or more, NVIDIA card with 12 to 24 GB VRAM (for example RTX 4070 Ti, 4080, 4090 or 3090 class, or newer)', 'Run medium open models (around 13 to 30 billion parameters), fine-tune small models on your own data, run a voice avatar like Open-LLM-VTuber smoothly'],
        ]} />
        <H3>About other kinds of computers</H3>
        <ul className="ln-list">
          <li><b>NVIDIA graphics cards</b> are the easiest choice for AI, because most AI software is built and tested for them first (through NVIDIA’s CUDA system).</li>
          <li><b>Apple Silicon Macs</b> (M-series chips) share memory between the processor and graphics, so a Mac with 16 GB or more runs local models well. Training works too, though more slowly than a strong NVIDIA card.</li>
          <li><b>AMD graphics cards</b> can work, mainly on Linux, but setup is harder for beginners.</li>
        </ul>
        <P><b>How big a model can I run?</b> A rough rule for compressed (“4-bit quantised”) open models: about 0.5 to 0.7 GB of memory per billion parameters, plus some extra. So an 8-billion-parameter model needs roughly 5 to 6 GB, which fits on an 8 GB card. Treat this as an estimate and check each model’s listed size.</P>
        <H3>The software toolkit (all free)</H3>
        <Table boldFirst head={['Tool', 'What it’s for']} rows={[
          [<Ext key="t" href="https://www.python.org/downloads/">Python</Ext>, 'The main programming language for AI'],
          [<Ext key="t" href="https://code.visualstudio.com/">VS Code</Ext>, 'A free code editor to write and run your programs'],
          ['Jupyter notebooks', 'Run code in small blocks and see results, like Colab on your own computer'],
          ['NumPy', 'Fast maths with lists of numbers, the base of most AI code'],
          ['Matplotlib', 'Draw charts, for example to watch the error drop while training'],
          [<span key="t"><Ext href="https://pytorch.org/get-started/locally/">PyTorch</Ext> or TensorFlow/Keras</span>, 'The main frameworks for building and training neural networks'],
          [<Ext key="t" href="https://git-scm.com/">Git and GitHub</Ext>, 'Save versions of your code and share it'],
          [<span key="t"><Ext href="https://ollama.com/">Ollama</Ext> or <Ext href="https://lmstudio.ai/">LM Studio</Ext></span>, 'Download and run open AI models on your own computer'],
          ['NVIDIA driver', 'Lets the AI software use your graphics card'],
        ]} />
        <H3>Setting up on Omarchy (Arch Linux), in the terminal</H3>
        <P>Check each tool’s install page first; commands can change.</P>
        <Code>{`sudo pacman -S python python-pip git     # Python and Git
python -m venv ~/ai-env                  # a private space for AI packages
source ~/ai-env/bin/activate             # switch into it
pip install numpy matplotlib jupyter     # the basics`}</Code>
        <P>Then install PyTorch using the command its website gives for your computer (it asks whether you have an NVIDIA card).</P>
        <H3>Setting up on a Windows PC</H3>
        <P>Install Python from python.org. Windows now uses the Python install manager (also in the Microsoft Store); if you use the older installer instead, tick “Add python.exe to PATH”. Then install VS Code and Git, update the NVIDIA graphics driver from NVIDIA’s site, and install PyTorch with the command from its website. For local chat models, install Ollama or LM Studio from their official sites.</P>
        <H3>Check that your graphics card is ready</H3>
        <P>On a computer with an NVIDIA card, run <code className="ln-inline">nvidia-smi</code> in a terminal: it lists the card and its memory. In Python, after installing PyTorch:</P>
        <Code>{`import torch
print(torch.cuda.is_available())   # True means PyTorch can use the NVIDIA card`}</Code>
        <H3>Run your first local AI model</H3>
        <P>After installing Ollama, one command downloads a small model and opens a chat in the terminal (model names change over time; pick a current small one from Ollama’s library):</P>
        <Code>{`ollama run llama3.2`}</Code>
        <H3>Good habits from day one</H3>
        <ul className="ln-list">
          <li>Keep API keys and passwords out of your code and out of chats; store them in private settings files that Git ignores.</li>
          <li>Save your work to GitHub regularly.</li>
          <li>Start small, get it working, then grow. A tiny project that runs teaches more than a big one that never finishes.</li>
          <li>Check each open model’s licence before using it in a business.</li>
        </ul>
      </Section>

      <Section id="learning-path" n={7} title="A learning path and first projects">
        <P>Learn AI the way a neuron learns: small steps, lots of practice, and fix your mistakes as you go. Each stage builds on the one before. Go at your own pace; the time guides assume a few hours a week.</P>
        <ol className="ln-stages">
          <li><b>Stage 1: Python basics (2 to 4 weeks).</b> Variables, lists, loops, “if” decisions and functions. Write small programs, like a tip calculator or a quiz. Goal: read and change simple code without fear.</li>
          <li><b>Stage 2: One neuron from scratch (1 week).</b> Build the perceptron in plain Python, no libraries. Teach it AND, then OR. Print each round to watch it learn. Try XOR and see it fail. Goal: understand inputs, weights, bias, error and nudging by heart.</li>
          <li><b>Stage 3: The maths you actually need (2 to 4 weeks, alongside other stages).</b> Not a degree, just the ideas: multiplying and adding lists of numbers (vectors and matrices), which is what every layer does; slopes (the idea behind derivatives), meaning how much the error changes when a weight changes; and averages and chances (basic statistics and probability) for reading results. Visual video series make these much easier than textbooks.</li>
          <li><b>Stage 4: A small network with NumPy (2 to 3 weeks).</b> Build a network with one hidden layer, solve XOR, then train it on MNIST digits, writing backpropagation yourself. Draw a chart of the error falling. Goal: know exactly what frameworks like Keras do behind the scenes.</li>
          <li><b>Stage 5: A real framework (3 to 4 weeks).</b> Rebuild the MNIST model in PyTorch or Keras. Then try a convolutional network on pictures. Learn to split data into training and test sets, and spot overfitting.</li>
          <li><b>Stage 6: Language models (4 weeks or more).</b> Build a tiny model that learns to predict the next letter, for example generating new Fijian-sounding names from a list of real ones. Then learn how transformers and attention work, building a small one step by step.</li>
          <li><b>Stage 7: Using and adapting big models.</b> Run open models locally with Ollama, connect them to your own apps, and try fine-tuning a small model on your own data. Learn to build tools for AI (MCP servers) and to use APIs like Claude’s in real products.</li>
        </ol>
        <H3>First projects</H3>
        <Table head={['Project', 'What you learn', 'Stage']} rows={[
          ['One-neuron demo (like the Neuron Lab)', 'How a neuron learns', '2'],
          ['MNIST digit reader from scratch', 'Layers and backpropagation', '4'],
          ['Fijian name generator', 'Predicting the next character, a tiny language model', '6'],
          ['PS5 fault helper: guess the likely fault from symptoms (noise, heat, shut-downs)', 'Turning real repair records into training data', '5'],
          ['Laptop part recogniser from photos', 'Image classification with a CNN', '5'],
          ['Local FAQ chatbot running on your own PC with Ollama', 'Running and connecting open models', '7'],
          ['Quiz helper in English and iTaukei, like Noqu Vuli', 'Using AI safely for children’s learning', '7'],
        ]} />
        <H3>Free learning resources</H3>
        <ul className="ln-list">
          <li><Ext href="https://www.3blue1brown.com/topics/neural-networks">3Blue1Brown, “Neural Networks”</Ext>: beautiful visual explanations of neurons, layers and backpropagation.</li>
          <li><Ext href="https://karpathy.ai/zero-to-hero.html">Andrej Karpathy, “Neural Networks: Zero to Hero”</Ext>: builds everything from the basics of backpropagation up to a small GPT, coding along step by step.</li>
          <li><Ext href="https://course.fast.ai/">fast.ai, “Practical Deep Learning for Coders”</Ext>: a free, hands-on course that gets you building real models quickly.</li>
          <li><Ext href="https://developers.google.com/machine-learning/crash-course">Google’s Machine Learning Crash Course</Ext>: short lessons with exercises.</li>
          <li><Ext href="https://www.kaggle.com/learn">Kaggle Learn</Ext>: free mini-courses in Python and machine learning, with practice datasets and competitions.</li>
          <li>The official <Ext href="https://pytorch.org/tutorials/">PyTorch tutorials</Ext> and <Ext href="https://www.tensorflow.org/tutorials">TensorFlow tutorials</Ext>, and the free <Ext href="https://huggingface.co/learn">Hugging Face courses</Ext> for language models.</li>
        </ul>
        <H3>Tips for learning well</H3>
        <ul className="ln-list">
          <li>Type the code yourself instead of copying; mistakes are where the learning happens.</li>
          <li>After each tutorial, change something and predict what will happen before running it.</li>
          <li>Keep a learning diary or a GitHub repo of everything you build. It becomes a portfolio for clients.</li>
          <li>Explain what you learned to someone else, like a family member or a customer. If you can explain it simply, you understand it.</li>
          <li>Use AI assistants as tutors: ask them to explain errors and concepts, but write and test the code yourself.</li>
        </ul>
      </Section>

      {/* Back to the lab + credits */}
      <section style={{ padding: '56px 1.5rem 72px', background: '#f8fafc' }}>
        <div className="ln-wrap" style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: ACCENT, fontWeight: 700, marginBottom: '0.6rem' }}><Brain size={18} /> Ready to try it?</div>
          <h2 className="ln-h2" style={{ marginBottom: '1rem' }}>Watch the neuron learn for yourself</h2>
          <a {...pageLink('neuron-lab', onNav)} className="ln-btn"><BookOpen size={18} /> Open the Neuron Lab</a>
          <p style={{ maxWidth: 680, margin: '2rem auto 0', color: BODY, lineHeight: 1.75 }}>
            Built by LomaVata Tech Services, Raiwai, Suva. Want AI or a website for your business?{' '}
            <a {...pageLink('services', onNav)} style={{ color: '#2563eb', fontWeight: 700 }}>Contact LvTS</a>.
          </p>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.ln-wrap { max-width: 860px; margin: 0 auto; }
.ln-section { padding: 60px 1.5rem; scroll-margin-top: 12px; }
.ln-h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(1.6rem, 4vw, 2.2rem); color: ${INK}; line-height: 1.15; margin-bottom: 1.1rem; }
.ln-h3 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem; color: ${INK}; margin: 1.8rem 0 0.7rem; }
.ln-p { color: ${BODY}; line-height: 1.75; font-size: 1rem; margin-bottom: 1rem; }
.ln-list { color: ${BODY}; line-height: 1.7; padding-left: 1.4rem; margin-bottom: 1rem; display: grid; gap: 0.35rem; }
ol.ln-list { list-style: decimal; }
ul.ln-list { list-style: disc; }
.ln-list li::marker { color: ${ACCENT}; font-weight: 700; }
.ln-stages { color: ${BODY}; line-height: 1.7; list-style: none; padding: 0; display: grid; gap: 0.7rem; margin-bottom: 1rem; }
.ln-stages li { background: #fff; border: 1px solid #e2e8f0; border-left: 4px solid ${ACCENT}; border-radius: 12px; padding: 0.8rem 1rem; }
.ln-toc { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ln-toc a { color: #e2e8f0; text-decoration: none; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(148,163,184,0.4); border-radius: 999px; padding: 0.4rem 0.8rem; }
.ln-toc a:hover, .ln-toc a:focus-visible { border-color: #5eead4; color: #5eead4; }
.ln-timeline { list-style: none; padding: 0; margin: 1.2rem 0; display: grid; gap: 0; }
.ln-timeline li { display: grid; grid-template-columns: 8.5rem 1fr; gap: 1rem; padding: 1rem 0; border-top: 1px solid #e2e8f0; }
.ln-year { font-family: 'Syne', sans-serif; font-weight: 800; color: ${ACCENT}; font-size: 1.05rem; line-height: 1.3; }
.ln-tl-title { font-weight: 800; color: ${INK}; margin-bottom: 0.25rem; }
@media (max-width: 600px) { .ln-timeline li { grid-template-columns: 1fr; gap: 0.2rem; } }
.ln-note { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 14px; padding: 1rem 1.2rem; color: ${BODY}; line-height: 1.7; margin: 1.2rem 0; }
.ln-table-wrap { overflow-x: auto; margin: 0.5rem 0 1.2rem; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; }
.ln-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; color: ${BODY}; font-variant-numeric: tabular-nums; }
.ln-table caption { text-align: left; padding: 0.6rem 0.8rem; font-weight: 700; color: ${INK}; }
.ln-table th { text-align: left; background: #f1f5f9; color: ${INK}; font-weight: 700; padding: 0.6rem 0.8rem; font-size: 0.82rem; }
.ln-table .ln-rowhead { text-align: left; font-weight: 700; color: ${INK}; padding: 0.55rem 0.8rem; border-top: 1px solid #e2e8f0; line-height: 1.5; vertical-align: top; background: #fff; font-size: 0.92rem; }
.ln-table td { padding: 0.55rem 0.8rem; border-top: 1px solid #e2e8f0; line-height: 1.5; vertical-align: top; }
.ln-formula { background: ${INK}; color: #e2e8f0; border-radius: 14px; padding: 1rem 1.2rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: clamp(0.85rem, 2.6vw, 1.05rem); line-height: 1.9; margin: 0.6rem 0 1rem; overflow-x: auto; }
.ln-code { background: ${INK}; color: #e2e8f0; border-radius: 12px; padding: 0.9rem 1rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.82rem; line-height: 1.7; overflow-x: auto; margin: 0.4rem 0 1rem; }
.ln-inline { background: #e2e8f0; color: ${INK}; border-radius: 6px; padding: 0.05rem 0.35rem; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.88em; }
.ln-dots { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem 0.5rem; margin: 0.4rem 0 1.2rem; }
.ln-figure { margin: 0.6rem 0 1.2rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; }
.ln-figure figcaption { font-size: 0.85rem; color: ${MUTED}; margin-top: 0.5rem; line-height: 1.5; }
.ln-details { margin: 0 0 1rem; }
.ln-details summary { cursor: pointer; font-weight: 700; color: ${ACCENT}; padding: 0.4rem 0; }
.ln-link { color: #2563eb; font-weight: 600; text-decoration: underline; text-underline-offset: 2px; }
.ln-btn { display: inline-flex; align-items: center; gap: 0.5rem; background: ${ACCENT}; color: #fff; font-weight: 700; padding: 0.85rem 1.5rem; border-radius: 12px; text-decoration: none; }
.ln-btn:hover { background: #0f766e; }
.ln-btn:focus-visible, .ln-link:focus-visible { outline: 3px solid #5eead4; outline-offset: 2px; }
`;
