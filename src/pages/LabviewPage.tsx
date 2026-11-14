import type { ReactNode } from 'react';
import LabviewGuide from '../components/LabviewGuide';
import {
  MessageCircle, Mail, Phone, Cpu, Cable, Workflow, LineChart, Globe, Code2, Package, CircuitBoard,
  CheckCircle2, ShieldCheck, AlertTriangle, GraduationCap, Wrench, Users, FileSearch,
} from 'lucide-react';

// LabVIEW project help for university students: tutoring and mentoring, not doing graded work for them.
// Topics match what the LvTS LabVIEW lab guide covers (Arduino over NI-VISA, design patterns, web services).

const WHATSAPP = 'https://wa.me/6797466941?text=' + encodeURIComponent(
  'Bula! I need help with a LabVIEW project.\nUniversity and course:\nWhat the project must do:\nHardware (if any):\nDeadline:',
);
const EMAIL = 'mailto:lomavatatechfiji@gmail.com?subject=' + encodeURIComponent('LabVIEW project help');

const ACCENT = '#f5a524';
const INK = '#0f172a';
const MUTED = '#64748b';

const HELP: { icon: ReactNode; title: string; desc: string }[] = [
  { icon: <Users size={22} />, title: 'One-to-one sessions', desc: 'In person in Raiwai, Suva, or online by video call. We work through your project together at your pace.' },
  { icon: <Wrench size={22} />, title: 'Debugging your VI', desc: 'Broken wires, errors you can’t explain, a VISA read that times out, a loop that never stops. I show you why it happens and how to find it next time.' },
  { icon: <CircuitBoard size={22} />, title: 'Getting hardware talking', desc: 'Arduino or other devices over USB serial with NI-VISA, wiring checks, COM port problems, and safe low-voltage setups.' },
  { icon: <FileSearch size={22} />, title: 'Review before you submit', desc: 'I go through your block diagram and front panel and tell you what to improve: structure, error handling, naming and documentation.' },
  { icon: <GraduationCap size={22} />, title: 'Understanding the concepts', desc: 'Dataflow, shift registers, case structures, state machines and queues, explained with small examples until they make sense.' },
  { icon: <Workflow size={22} />, title: 'Planning your project', desc: 'Turn the brief into a plan: what the VI must do, which design pattern fits, what hardware you need and a realistic timeline.' },
];

const TOPICS: { icon: ReactNode; title: string; items: string[] }[] = [
  { icon: <Cpu size={20} />, title: 'LabVIEW fundamentals', items: ['Front panel and block diagram', 'Data types, loops, case structures', 'SubVIs and connector panes', 'The error cluster'] },
  { icon: <Workflow size={20} />, title: 'Design patterns', items: ['State machines', 'Event structures', 'Producer/consumer with queues', 'Functional global variables'] },
  { icon: <Cable size={20} />, title: 'Serial and NI-VISA', items: ['Arduino control over USB', 'Baud rate, termination characters, timeouts', 'Your own command protocol', 'Hobbyist (LINX) Toolkit'] },
  { icon: <LineChart size={20} />, title: 'Measurement and logging', items: ['Charts and graphs', 'Logging to CSV or TDMS', 'Loop timing', 'Reading sensors on analog pins'] },
  { icon: <Globe size={20} />, title: 'Control from a web page', items: ['LabVIEW Web Services', 'HTTP method VIs returning JSON', 'An HTML/JS page on your phone', 'Keeping it safe on your network'] },
  { icon: <Code2 size={20} />, title: 'Going further', items: ['Python Node (matching bitness)', 'Building an EXE with Application Builder', 'Source control with Git', 'Raspberry Pi with LINX'] },
];

const IDEAS = [
  'Room temperature and humidity logger with a live web dashboard',
  'Phone-controlled lamp or fan through a 5 V relay module',
  'Serial device tester that sends a script of commands and logs the replies',
  'Potentiometer or sensor reading plotted live, with alarms and a CSV log',
];

const STEPS = [
  { n: 1, title: 'Message me', desc: 'Send your course, the project brief, any hardware you’re using and your deadline.' },
  { n: 2, title: 'Free first look', desc: 'I read the brief, tell you honestly what’s involved, and give you a quote before anything starts.' },
  { n: 3, title: 'We work on it together', desc: 'Sessions in person or online. You build the VI; I coach, explain and help you fix problems.' },
  { n: 4, title: 'You submit your own work', desc: 'You finish with a project you understand and can explain in your demo or viva.' },
];

function SectionLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>{children}</div>;
}

function H2({ children }: { children: ReactNode }) {
  return <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: INK, lineHeight: 1.15, marginBottom: '1rem' }}>{children}</h2>;
}

function ContactButtons({ center = false }: { center?: boolean }) {
  const btn = { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none' } as const;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: center ? 'center' : 'flex-start' }}>
      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#16a34a', color: '#fff' }}>
        <MessageCircle size={18} /> WhatsApp 746 6941
      </a>
      <a href="tel:+6798331088" style={{ ...btn, background: '#fff', color: INK, border: '1px solid #cbd5e1' }}>
        <Phone size={18} /> Call 833 1088
      </a>
      <a href={EMAIL} style={{ ...btn, background: '#fff', color: INK, border: '1px solid #cbd5e1' }}>
        <Mail size={18} /> Email
      </a>
    </div>
  );
}

export default function LabviewPage() {
  return (
    <>
      {/* Hero */}
      <section style={{ padding: '120px 1.5rem 70px', background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#273449 100%)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245,165,36,0.15)', border: '1px solid rgba(245,165,36,0.4)', color: ACCENT, borderRadius: 999, padding: '0.35rem 0.9rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
            <GraduationCap size={14} /> For university students
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2.1rem,5.5vw,3.4rem)', lineHeight: 1.08, marginBottom: '1.1rem' }}>
            Stuck on your <span style={{ color: ACCENT }}>LabVIEW</span> project?<br />Let’s get it working, together.
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.75, maxWidth: 680, marginBottom: '2rem' }}>
            One-to-one LabVIEW tutoring and project mentoring for engineering, physics and IT students at USP, FNU, the University of Fiji and online.
            Hardware control with Arduino and NI-VISA, data logging, state machines and web control: I help you understand it, debug it and finish it yourself.
          </p>
          <ContactButtons />
          <a href="#guide" style={{ display: 'inline-block', marginTop: '1rem', color: ACCENT, fontWeight: 600, fontSize: '0.92rem' }}>New to LabVIEW? Read the free step-by-step guide ↓</a>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>
            {['In person in Raiwai, Suva', 'Online anywhere', 'Free first look at your brief'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={16} color={ACCENT} /> {t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How I help */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>How I help</SectionLabel>
          <H2>You build it. I coach you through it.</H2>
          <p style={{ color: MUTED, lineHeight: 1.75, maxWidth: 720, marginBottom: '2.5rem' }}>
            LabVIEW is drawn, not typed, and a single wrong wire can stop a whole project. Most students don’t need someone to do it for them. They need someone to sit beside them, explain what’s going on and help them find the problem.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(300px,100%),1fr))', gap: '1.25rem' }}>
            {HELP.map((h) => (
              <div key={h.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.4rem' }}>
                <div style={{ color: '#2563eb', marginBottom: '0.75rem' }}>{h.icon}</div>
                <div style={{ fontWeight: 700, color: INK, marginBottom: '0.4rem' }}>{h.title}</div>
                <div style={{ fontSize: '0.88rem', color: MUTED, lineHeight: 1.65 }}>{h.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Topics */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <SectionLabel>What we can cover</SectionLabel>
          <H2>LabVIEW and NI topics</H2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            {TOPICS.map((t) => (
              <div key={t.title} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
                  <span style={{ display: 'inline-flex', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', background: 'rgba(245,165,36,0.14)', color: '#b45309' }}>{t.icon}</span>
                  <span style={{ fontWeight: 700, color: INK }}>{t.title}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.4rem' }}>
                  {t.items.map((i) => (
                    <li key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
                      <CheckCircle2 size={16} color="#16a34a" style={{ flexShrink: 0, marginTop: 2 }} /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LabviewGuide />

      {/* Project ideas + steps */}
      <section style={{ padding: '80px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(380px,100%),1fr))', gap: '3rem' }}>
          <div>
            <SectionLabel>Project ideas</SectionLabel>
            <H2>Need a project idea?</H2>
            <p style={{ color: MUTED, lineHeight: 1.7, marginBottom: '1.25rem' }}>Good starting points that use cheap, safe hardware (an Arduino Uno, LEDs, sensors and a 5 V relay module):</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.75rem' }}>
              {IDEAS.map((i) => (
                <li key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '0.9rem 1rem', color: '#334155', fontSize: '0.92rem', lineHeight: 1.5 }}>
                  <Package size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} /> {i}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionLabel>How it works</SectionLabel>
            <H2>Four simple steps</H2>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '1rem' }}>
              {STEPS.map((s) => (
                <li key={s.n} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', background: INK, color: ACCENT, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{s.n}</span>
                  <div>
                    <div style={{ fontWeight: 700, color: INK, marginBottom: '0.2rem' }}>{s.title}</div>
                    <div style={{ fontSize: '0.9rem', color: MUTED, lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Honest notes */}
      <section style={{ padding: '70px 1.5rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.6rem' }}><ShieldCheck size={20} /> Academic honesty</div>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
              This is tutoring and mentoring. I don’t complete graded assignments for you, write your report or sit tests for you.
              Check your course’s rules on outside help, and tell your supervisor you’re getting tutoring if your course asks you to.
            </p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: INK, marginBottom: '0.6rem' }}><Cpu size={20} /> Your LabVIEW software</div>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
              Use the LabVIEW licence from your university or lab. NI’s free LabVIEW Community Edition is for personal, non-commercial learning.
              On Windows it’s 32-bit, so any Python or DLL you call from it must be 32-bit too.
            </p>
          </div>
          <div style={{ background: '#fff', border: '1px solid #fde68a', borderRadius: 14, padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#b45309', marginBottom: '0.6rem' }}><AlertTriangle size={20} /> Safety first</div>
            <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
              We work at 5 V and 12 V DC. Anything on 240 V mains must go through a properly rated, enclosed relay module or contactor installed by a licensed electrician.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 1.5rem 120px', background: '#fff', textAlign: 'center' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <H2>Tell me about your project</H2>
          <p style={{ color: MUTED, lineHeight: 1.75, marginBottom: '1.75rem' }}>
            Send your course, the brief and your deadline. The WhatsApp button fills in the questions for you. The earlier you message, the more time we have to get it right.
          </p>
          <ContactButtons center />
          <p style={{ color: '#94a3b8', fontSize: '0.75rem', lineHeight: 1.6, marginTop: '3rem' }}>
            LabVIEW and NI are trademarks of National Instruments Corporation, part of Emerson. LomaVata Tech Services is an independent tutor and is not affiliated with or endorsed by NI, Emerson or any university named on this page.
          </p>
        </div>
      </section>
    </>
  );
}
