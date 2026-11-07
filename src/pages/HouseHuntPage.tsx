import { Gamepad2, Trophy, ShieldCheck, Map as MapIcon, Database, BookOpen } from 'lucide-react';
import { pageLink } from '../links';
import { useScrollFade } from '../hooks/useScrollFade';
import HouseGame from '../game/house/HouseGame';
import { CONTEST, prizeState, claimSteps } from '../game/house/contest';

const BASE = import.meta.env.BASE_URL;

export default function HouseHuntPage({ onNav }: { onNav: (p: string) => void }) {
  const heroRef = useScrollFade();
  const prize = prizeState();
  // The tab title for this page is set by App.tsx from src/data/routes.ts.
  const card: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.3rem 1.4rem' };
  const h3: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.6rem' };
  const p: React.CSSProperties = { color: '#475569', fontSize: '0.88rem', lineHeight: 1.7 };

  return (
    <section style={{ padding: '120px 1.5rem 110px', position: 'relative', overflow: 'hidden' }}>
      <div className="orb" style={{ width: 420, height: 420, background: 'rgba(245,158,11,0.10)', top: '-8%', right: '-6%' }} />
      <div ref={heroRef} className="fade-in" style={{ maxWidth: 820, margin: '0 auto 2rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d97706', marginBottom: '0.75rem' }}>
          <Gamepad2 size={14} /> Interactive 3D Experience
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
          LvTS Noqu<span className="grad-text">blox</span>
        </h1>
        <p style={{ color: '#475569', fontSize: '1rem', fontWeight: 600, lineHeight: 1.75, marginBottom: '0.9rem' }}>
          <em>Noqu</em> means “my” in iTaukei, so Noqublox is <em>my blox</em>: play in Raiwai, by USP and around the blocks.
        </p>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, marginBottom: '0.9rem' }}>
          Take a first-person 3D walk-through of a Suva family home! Explore the house, discover the different rooms, find hidden technology parts and interact with the home environment.
        </p>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.1rem' }}>
          Step inside, explore the family’s home, uncover its technology secrets and connect with the family along the way. Every corner has something to discover!
        </p>
        <p style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1rem,2.4vw,1.2rem)', color: '#0f172a', lineHeight: 1.4 }}>
          Explore. Discover. Connect. <span className="grad-text">Experience Suva family life.</span>
        </p>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto 2rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.3rem 1.4rem' }}>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.25rem', color: '#0f172a', marginBottom: '0.7rem' }}>
          What is Noqu<span className="grad-text">blox</span>?
        </h2>
        <ul style={{ color: '#475569', fontSize: '0.92rem', lineHeight: 1.7, paddingLeft: '1.2rem', display: 'grid', gap: '0.45rem' }}>
          <li><strong style={{ color: '#0f172a' }}>A virtual universe of Fiji, made by LvTS.</strong> Visit places here in Fiji, built in 3D. Right now that’s Raiwai, by USP and around the blocks: the family home, McFarlane Road and its shops, Garden City, Damodar City, the temple, the masjid and the USP campus.</li>
          <li><strong style={{ color: '#0f172a' }}>Explore together.</strong> Everyone exploring at the same time is in one shared world, up to 40 players: you see each other walking around and can chat (press T on a computer, or 💬 on a phone). Chat is filtered for rude words and personal details, and anyone can be reported to LvTS. The hunt for the Golden Chip stays a game you play on your own.</li>
          <li><strong style={{ color: '#0f172a' }}>Make your own character.</strong> Once LvTS approves it, it stays in the world for everyone who explores, with your name over your head.</li>
          <li><strong style={{ color: '#0f172a' }}>Plays in your web browser.</strong> Nothing to install, on a computer or a phone.</li>
          <li><strong style={{ color: '#0f172a' }}>Where it’s heading:</strong> a place to program, share and play your own 3D games with other players, and visit more of Fiji. Making your own games isn’t built yet.</li>
        </ul>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <HouseGame />
      </div>

      <div style={{ maxWidth: 1100, margin: '2.5rem auto 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(280px,100%),1fr))', gap: '1rem' }}>
        <div style={card}>
          <div style={h3}><MapIcon size={18} color="#2563eb" /> How to play</div>
          <p style={p}>
            Make your own character on the <b>You</b> tab, or pick who you play as: anyone at home (Grandpa Hussein, Dad Josese, Mum Ronlyn, Zane, Mahala or baby Aisha), one of the aunties and uncles, or one of the cousins. Each one moves differently and has a perk. Choose <b>Start the hunt</b> for the timed hunt, or <b>Explore the neighbourhood</b> to walk out the front gate onto the street, where the shops are coming soon and other visitors' characters hang out. On a computer: <b>W A S D</b> to walk, the <b>mouse</b> to look, <b>E</b> to open doors, gates and windows, talk to the family (then <b>1–7</b> to pick a question) or do a chore, <b>C</b> for the chores list, <b>Shift</b> to run, <b>V</b> to switch between first and third person, <b>M</b> for the big map, <b>Esc</b> to pause and <b>X</b> to quit. On a phone: drag the left side to walk, the right side to look, tap ✋ to open things, talk (then tap a question) or do a chore, 📋 for the chores list, 🔄 to switch between landscape and portrait, and tap the red ✕ to quit.
            The minimap only shows what you have actually seen, and leaves a trail of where you have been. Ask the family about the Golden Chip: they have seen where it is.
          </p>
        </div>
        <div style={card}>
          <div style={h3}><Trophy size={18} color="#d97706" /> Prize rounds</div>
          <ol style={{ ...p, paddingLeft: '1.1rem' }}>
            <li>Find the Golden Chip and get out through the front gate at the bottom of the driveway. The win screen shows the secret code for the current round.</li>
            {claimSteps().map((s) => <li key={s}>{s}</li>)}
            <li>One prize per person per round. The code changes every round.</li>
          </ol>
          {!prize.live && <p style={{ ...p, marginTop: '0.5rem', color: '#64748b' }}>No round is running right now{prize.next ? ` — the next starts ${prize.next}` : ''}. Follow <a href={CONTEST.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>{CONTEST.handle}</a> to hear first.</p>}
        </div>
        <div style={card}>
          <div style={h3}><ShieldCheck size={18} color="#16a34a" /> Stay safe</div>
          <p style={p}>
            We only contact winners from the official {CONTEST.pageName} Facebook page. We will never ask for your M-PAiSA PIN, a password, or a payment to release a prize. If someone in the comments offers to “help you claim”, it isn’t us.
          </p>
        </div>
        <div style={card}>
          <div style={h3}><BookOpen size={18} color="#6d4aff" /> For little ones: Noqu Vuli</div>
          <p style={p}>
            Younger brothers and sisters can play and learn ABC, numbers, animals, shapes and colours in English
            and iTaukei. <a {...pageLink('kids', onNav)} style={{ color: '#6d4aff', fontWeight: 700 }}>Open Noqu Vuli →</a>
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '1rem auto 0', ...card }}>
        <div style={h3}><Database size={18} color="#7c3aed" /> Bonus: the poster on the dining-room wall</div>
        <p style={{ ...p, marginBottom: '0.8rem' }}>
          Walk up to the poster in the house to read it in the game, or try it here. It shows how a database index finds a row in a few reads where a full scan has to open every page.
        </p>
        <iframe src={`${BASE}house-hunt/db-index.html`} title="Isometric figure: how a database index works" loading="lazy" style={{ width: '100%', height: 560, border: '1px solid #e2e8f0', borderRadius: 12 }} />
      </div>
    </section>
  );
}
