import { useEffect, useRef, useState } from 'react';
import { Thermometer, Wind, Gauge, Power, Wrench, Sparkles, Droplets, Activity, MessageCircle, Phone, AlertTriangle, HelpCircle, Box, Maximize2 } from 'lucide-react';
import { CONTACT, openWhatsApp } from '../data/contact';

// The PS5 service at the top of the Services page, with a clip of a PS5 on the LvTS bench
// (public/services/ps5-service.mp4: no sound, 720x1280, made from the owner's video).
// No price on purpose: it's quoted per console.

const BOOK_MESSAGE = "Bula LvTS, I'd like to book a PS5 service. My PS5 is (shutting down / loud / overheating / just due for a clean): ";

const SIGNS = [
  { icon: <Power size={20} />, title: 'Shuts down mid-game', desc: 'Or shows an overheating warning.' },
  { icon: <Wind size={20} />, title: 'Loud like a jet engine', desc: 'The fan roars even in menus or light games.' },
  { icon: <Gauge size={20} />, title: 'Lags after a while', desc: 'Smooth at first, then stutters after a couple of hours.' },
  { icon: <Thermometer size={20} />, title: 'Very hot air or dust', desc: 'Hot to the touch, or dust visible in the vents.' },
];

const STEPS = [
  { icon: <Wrench size={22} />, title: 'Full teardown', desc: 'We take off the outer plates and open the console down to the fan, shielding and main board, carefully and with the right tools.' },
  { icon: <Sparkles size={22} />, title: 'Deep dust clean', desc: 'Dust, pet hair and fluff cleared from the fan blades, heatsink fins, power supply vents and inside the case.' },
  { icon: <Droplets size={22} />, title: 'Liquid metal service', desc: 'We check the liquid metal between the processor and the heatsink. If it has dried, oxidised or spread unevenly, we clean it off and apply a fresh, even layer.' },
  { icon: <Activity size={22} />, title: 'Tested before handover', desc: 'Thermal pads and putty checked, then the PS5 is run under load to make sure it stays cool and the fan noise is back to normal.' },
];

const ASK = [
  'How will you clean the fan and heatsink?',
  'Will you replace the liquid metal, or only clean around it, and why?',
  'How do you stop liquid metal touching the board?',
  'Will you test it under load before I collect it?',
  'Is there a warranty on your work?',
];

/** A muted looping clip that only plays while it is on screen (saves phone battery and data). */
function BenchVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) void v.play().catch(() => {}); else v.pause(); }, { threshold: 0.25 });
    obs.observe(v);
    return () => obs.disconnect();
  }, []);
  const base = import.meta.env.BASE_URL;
  return (
    <figure style={{ margin: 0 }}>
      <video ref={ref} muted loop playsInline preload="metadata" poster={`${base}services/ps5-service-poster.jpg`}
        aria-label="A PS5 being taken apart for cleaning on the LvTS bench"
        style={{ width: '100%', maxWidth: 360, aspectRatio: '9 / 16', objectFit: 'cover', borderRadius: 20, display: 'block', margin: '0 auto', background: '#0f172a', boxShadow: '0 20px 50px rgba(15,23,42,0.35)' }}>
        <source src={`${base}services/ps5-service.mp4`} type="video/mp4" />
      </video>
      <figcaption style={{ textAlign: 'center', fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.6rem' }}>A PS5 on our bench in Raiwai, Suva</figcaption>
    </figure>
  );
}

/**
 * The owner's interactive 3D PS5 teardown map (public/services/ps5-repair-map.html, a standalone page
 * using three.js from jsDelivr). It loads only when someone taps the preview, so the Services page
 * stays light on phones.
 */
function RepairMap() {
  const [live, setLive] = useState(false);
  const base = import.meta.env.BASE_URL;
  const src = `${base}services/ps5-repair-map.html`;
  return (
    <section id="ps5-3d" style={{ padding: '70px 1.5rem', background: '#0b1020', color: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#93c5fd', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
            <Box size={14} /> Interactive 3D
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', margin: '0 0 0.6rem' }}>See inside a PS5</h2>
          <p style={{ color: '#cbd5e1', maxWidth: 640, margin: '0 auto', lineHeight: 1.7 }}>
            Our PS5 Repair Map shows every part we take out, step by step: faceplates, fan, shield plate, main board and the liquid metal on the processor, with the screws for each step. Turn it, pull it apart and tap any part.
          </p>
        </div>
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.3)', background: '#e3e6e2', height: live ? 'min(860px, 88vh)' : undefined }}>
          {live ? (
            <iframe src={src} title="PS5 Repair Map: interactive 3D model of the PS5" style={{ width: '100%', height: '100%', border: 0, display: 'block' }} />
          ) : (
            <button type="button" aria-label="Open the interactive 3D PS5 Repair Map"
              onClick={() => {
                // On phones the map's 3D area takes every swipe (to turn the console), so embedded it would
                // trap the page scroll. Open it as its own page there instead; it links back to this page.
                if (window.matchMedia('(max-width: 899px)').matches) window.location.href = src;
                else setLive(true);
              }}
              style={{ display: 'block', width: '100%', padding: 0, border: 0, cursor: 'pointer', background: 'none', position: 'relative' }}>
              <img src={`${base}services/ps5-repair-map.jpg`} alt="The PS5 Repair Map: a 3D PS5 pulled apart into its cases, fan, shield, main board and faceplates" width={749} height={590} loading="lazy"
                style={{ width: '100%', height: 'auto', maxHeight: 520, objectFit: 'cover', display: 'block' }} />
              <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'linear-gradient(180deg,rgba(11,16,32,0) 40%,rgba(11,16,32,0.55) 100%)' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#2563eb', color: '#fff', padding: '0.9rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.97rem', boxShadow: '0 10px 30px rgba(15,23,42,0.4)' }}>
                  <Box size={18} /> Open the 3D map
                </span>
              </span>
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.9rem', fontSize: '0.85rem', color: '#94a3b8' }}>
          <span>Original PS5 with disc drive. Steps and screw counts from iFixit’s guides, credited inside.</span>
          <a href={src} target="_blank" rel="noopener" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#93c5fd', fontWeight: 700, textDecoration: 'none' }}>
            <Maximize2 size={15} /> Open full screen
          </a>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '0.75rem 1rem', marginTop: '1.5rem', textAlign: 'center' }}>
          <span style={{ color: '#cbd5e1' }}>42 screws on the shield alone, and liquid metal that can short the board. Rather we do it?</span>
          <button type="button" onClick={() => openWhatsApp(BOOK_MESSAGE)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.75rem 1.2rem', borderRadius: 12, fontWeight: 700, fontSize: '0.93rem', cursor: 'pointer' }}>
            <MessageCircle size={17} /> Book a PS5 service
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Ps5Service() {
  return (
    <>
      <section style={{ padding: '110px 1.5rem 70px', background: 'linear-gradient(160deg,#0b1020 0%,#14213d 55%,#1e3a8a 100%)', color: '#fff', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: '2.5rem', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.4)', color: '#93c5fd', borderRadius: 999, padding: '0.35rem 0.9rem', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1.1rem' }}>
              PS5 service · Raiwai, Suva
            </div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.1rem)', lineHeight: 1.08, margin: '0 0 1rem' }}>
              PS5 overheating, shutting down or <span style={{ color: '#60a5fa' }}>loud like a jet engine?</span>
            </h1>
            <p style={{ color: '#cbd5e1', fontSize: '1.03rem', lineHeight: 1.75, margin: '0 0 1.6rem' }}>
              LomaVata Tech Services gives your PlayStation 5 a full service: a complete teardown, a deep dust clean and a fresh liquid metal layer where it’s needed, so it runs cool and quiet again. Running fine? A clean now helps keep it that way.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button type="button" onClick={() => openWhatsApp(BOOK_MESSAGE)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#16a34a', color: '#fff', border: 'none', padding: '0.9rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.97rem', cursor: 'pointer' }}>
                <MessageCircle size={18} /> Book a PS5 service
              </button>
              <a href={CONTACT.phoneHref}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)', padding: '0.9rem 1.4rem', borderRadius: 12, fontWeight: 700, fontSize: '0.97rem', textDecoration: 'none' }}>
                <Phone size={18} /> Call {CONTACT.phone}
              </a>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1.25rem', fontSize: '0.85rem', color: '#94a3b8' }}>
              <span>PS5 (original) and PS5 Slim</span><span>·</span><span>Disc and digital</span><span>·</span><span>Price quoted before we start</span>
            </div>
          </div>
          <BenchVideo />
        </div>
      </section>

      <section style={{ padding: '70px 1.5rem', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: '#0f172a', margin: '0 0 1.5rem', textAlign: 'center' }}>
            Signs your PS5 needs a service
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: '1rem', marginBottom: '3.5rem' }}>
            {SIGNS.map((s) => (
              <div key={s.title} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 14, padding: '1.2rem' }}>
                <div style={{ color: '#dc2626', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.86rem', color: '#64748b', lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: '#0f172a', margin: '0 0 0.6rem', textAlign: 'center' }}>
            What our PS5 service includes
          </h2>
          <p style={{ color: '#64748b', textAlign: 'center', maxWidth: 640, margin: '0 auto 1.75rem', lineHeight: 1.7 }}>
            Overheating is almost always inside the console: dust packed into the heatsink and fan, and a worn layer of liquid metal on the processor.
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '0 0 3.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(240px,100%),1fr))', gap: '1rem' }}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="card-3d" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: 14, padding: '1.3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#2563eb', marginBottom: '0.6rem' }}>
                  {s.icon}<span style={{ fontWeight: 800, color: '#cbd5e1', fontSize: '1.4rem' }}>{i + 1}</span>
                </div>
                <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.35rem' }}>{s.title}</div>
                <div style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
              </li>
            ))}
          </ol>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1.25rem' }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 16, padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1d4ed8', marginBottom: '0.6rem' }}><Droplets size={20} /> What is liquid metal?</div>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: '0 0 0.6rem' }}>
                The PS5 uses a thin layer of liquid metal to carry heat from the processor to the heatsink. Over time it can dry out, oxidise or spread unevenly, and the console runs hotter.
              </p>
              <p style={{ fontSize: '0.9rem', color: '#334155', lineHeight: 1.7, margin: 0 }}>
                It doesn’t always need replacing: if the layer is still even, we clean around it and tell you. Liquid metal also conducts electricity, so a spill on the board can cause damage. It’s a job for a careful technician, not a quick video tutorial.
              </p>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.4rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}><HelpCircle size={20} /> Questions to ask any technician</div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', listStyle: 'disc', color: '#334155', fontSize: '0.9rem', lineHeight: 1.75 }}>
                {ASK.map((q) => <li key={q}>{q}</li>)}
              </ul>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0.6rem 0 0' }}>We’re happy to answer every one of these before we start.</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 14, padding: '1rem 1.2rem', marginTop: '1.25rem', fontSize: '0.88rem', color: '#78350f', lineHeight: 1.6 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>Still under Sony’s warranty? Check with your seller first: opening the console can affect the warranty.</span>
          </div>
        </div>
      </section>

      <RepairMap />
    </>
  );
}
