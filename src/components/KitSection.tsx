import { useState } from 'react';
import { Download, Copy, Check, AlertTriangle, Cpu } from 'lucide-react';
import firmware from '../kit/lvts_kit.ino?raw';
import KitTester from './KitTester';

// The duinotech Learning Kit (Uno compatible), the LvTS Kit Firmware and a browser tester for it.
// Pin numbers here must match the wiring comment at the top of src/kit/lvts_kit.ino.

const INK = '#0f172a';
const BODY = '#334155';
const MUTED = '#64748b';

interface Part { name: string; what: string; pins: string; lesson: string }

const PARTS: Part[] = [
  { name: 'Uno board', what: 'Uno-compatible board with an ATmega328P chip. Runs the firmware and talks to LabVIEW over USB.', pins: 'USB to your PC', lesson: 'NI-VISA serial: open, write, read, close' },
  { name: 'USB cable', what: 'Powers the Uno and carries the serial data.', pins: 'USB-B to USB-A', lesson: 'Finding the COM port in Device Manager' },
  { name: 'Breadboard + jumper leads', what: 'Connect parts without soldering. The long side rails carry 5V and GND.', pins: '5V and GND rails', lesson: 'Wiring safely' },
  { name: 'LEDs (red, green)', what: 'Light up when the pin is HIGH. The long leg is + and goes to the pin side.', pins: 'D7 red, D8 green, each with a 220 Ω resistor', lesson: 'Boolean control and case structures' },
  { name: 'Resistors + colour card', what: 'Limit LED current. Read the value with the colour card.', pins: '220 Ω: red red black black brown (5-band)', lesson: 'Ohm’s law' },
  { name: 'Buttons', what: 'Push buttons. The firmware turns on the Uno’s internal pull-up, so no resistor is needed.', pins: 'D2 and GND', lesson: 'Event counting and edge detection' },
  { name: 'Potentiometer', what: 'A knob that gives 0–1023.', pins: 'Outer legs 5V and GND, middle leg A0', lesson: 'Charts, scaling and loop timing' },
  { name: 'LDR module', what: 'Light sensor. Reading changes with light level.', pins: 'Analog out to A1', lesson: 'Thresholds: an automatic night light' },
  { name: 'Joystick module', what: 'Two knobs (X and Y) plus a press switch.', pins: 'VRx A2, VRy A3, SW D4', lesson: 'XY graphs and clusters' },
  { name: 'Line trace module', what: 'Infrared sensor that tells dark from light surfaces.', pins: 'Digital out to A4', lesson: 'Digital inputs and state machines' },
  { name: 'Piezo buzzer module', what: 'Makes a beep at a chosen pitch.', pins: 'Signal to A5', lesson: 'Alarms with timing' },
  { name: 'RGB LED module', what: 'Red, green and blue in one LED. Mix any colour.', pins: 'R D3, G D5, B D6', lesson: 'Numeric controls and colour boxes' },
  { name: 'SG90 micro servo', what: 'Turns to an angle from 0 to 180°.', pins: 'Brown GND, red 5V, orange D9', lesson: 'Slider to position control' },
  { name: '8×8 LED matrix (MAX7219)', what: '64 LEDs driven by a MAX7219 chip over 3 wires.', pins: 'DIN D12, CLK D11, CS D10', lesson: '2D Boolean arrays and bytes' },
];

const COMMANDS: [string, string, string][] = [
  ['PING', 'PONG', 'Check the board is answering'],
  ['LED ON / LED OFF', 'OK LED ON', 'Built-in LED on pin 13'],
  ['RED ON / GREEN ON (or OFF)', 'OK RED ON', 'Red LED pin 7, green LED pin 8'],
  ['RGB 255 0 128', 'OK RGB 255 0 128', 'RGB LED, each colour 0–255'],
  ['SERVO 45', 'OK SERVO 45', 'Servo angle 0–180'],
  ['BEEP 1000 200', 'OK BEEP 1000 200', 'Pitch in Hz (100–5000), length in ms (10–2000)'],
  ['MATRIX 18 3C 7E FF FF 7E 3C 18', 'OK MATRIX', '8 rows in hex, top row first'],
  ['MATRIX CLEAR', 'OK MATRIX', 'Turn all 64 LEDs off'],
  ['STATUS', 'POT=512 LDR=300 JX=510 JY=520 JSW=0 BTN=0 LINE=1 LED=0', 'All sensor readings in one line'],
];

const th = { textAlign: 'left', padding: '0.55rem 0.7rem', background: '#f1f5f9', color: INK, borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem' } as const;
const td = { padding: '0.55rem 0.7rem', borderBottom: '1px solid #e2e8f0', color: BODY, verticalAlign: 'top', lineHeight: 1.5, fontSize: '0.86rem' } as const;
const mono = { fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem' } as const;
const btn = { display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.1rem', borderRadius: 10, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', border: '1px solid #cbd5e1', background: '#fff', color: INK } as const;

function downloadFirmware() {
  const url = URL.createObjectURL(new Blob([firmware], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'lvts_kit.ino';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function KitSection() {
  const [copied, setCopied] = useState(false);

  async function copyFirmware() {
    try {
      await navigator.clipboard.writeText(firmware);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="kit" style={{ padding: '80px 1.5rem', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>The hardware</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: INK, lineHeight: 1.15, marginBottom: '1rem' }}>
          One kit, every lesson: the duinotech Uno Learning Kit
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: '2rem', alignItems: 'start', marginBottom: '2.5rem' }}>
          <figure style={{ margin: 0 }}>
            <img src={`${import.meta.env.BASE_URL}kit/duinotech-kit.jpg`} alt="The duinotech Learning Kit laid out: Uno board, breadboard, LEDs, resistors, servo, LED matrix, joystick, sensors and jumper leads"
              width={900} height={1362} loading="lazy" decoding="async"
              style={{ width: '100%', height: 'auto', maxHeight: 560, objectFit: 'cover', borderRadius: 16, border: '1px solid #e2e8f0', display: 'block' }} />
            <figcaption style={{ fontSize: '0.78rem', color: MUTED, marginTop: '0.5rem' }}>The kit used in sessions and in every example on this page.</figcaption>
          </figure>
          <div>
            <p style={{ color: BODY, lineHeight: 1.75, marginTop: 0 }}>
              Every example on this page uses the <strong>duinotech Learning Kit</strong> (sold by Jaycar): an Uno-compatible board plus 14 parts.
              Any Arduino Uno with similar parts works too.
            </p>
            <p style={{ color: BODY, lineHeight: 1.75 }}>
              Instead of a different sketch for every lesson, you upload the <strong>LvTS Kit Firmware</strong> once. It lets LabVIEW control every part of the kit with simple text commands over USB, like <code style={mono}>SERVO 90</code> or <code style={mono}>STATUS</code>. That means you spend your time learning LabVIEW, not rewriting Arduino code.
            </p>
            <ol style={{ color: BODY, lineHeight: 1.8, paddingLeft: '1.3rem', listStyle: 'decimal' }}>
              <li>Wire the parts using the table below. Start with just one or two.</li>
              <li>Download the firmware and open it in the free <strong>Arduino IDE</strong>.</li>
              <li>Choose <strong>Tools » Board » Arduino Uno</strong> and your COM port, then <strong>Upload</strong>.</li>
              <li>Test your wiring with the kit tester below, then close it and use the same commands from LabVIEW.</li>
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '1rem' }}>
              <button type="button" onClick={downloadFirmware} style={{ ...btn, background: INK, color: '#fff', borderColor: INK }}><Download size={16} /> Download lvts_kit.ino</button>
              <button type="button" onClick={copyFirmware} style={btn}>{copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />} {copied ? 'Copied' : 'Copy code'}</button>
            </div>
          </div>
        </div>

        <h3 style={{ fontWeight: 800, color: INK, fontSize: '1.2rem', margin: '0 0 0.75rem' }}>Parts, pins and what each one teaches</h3>
        <div style={{ overflowX: 'auto', marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
            <thead><tr><th style={th}>Part</th><th style={th}>What it does</th><th style={th}>Connect to</th><th style={th}>LabVIEW lesson</th></tr></thead>
            <tbody>
              {PARTS.map((p) => (
                <tr key={p.name}>
                  <td style={{ ...td, fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>{p.name}</td>
                  <td style={td}>{p.what}</td>
                  <td style={{ ...td, ...mono }}>{p.pins}</td>
                  <td style={td}>{p.lesson}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(320px,100%),1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '1rem 1.1rem', fontSize: '0.87rem', color: BODY, lineHeight: 1.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#b45309', marginBottom: '0.4rem' }}><AlertTriangle size={18} /> Wiring tips</div>
            Join every GND together. Follow the pin names printed on each module, because layouts differ between makers. If your RGB LED or LEDs have no resistor on board, add 220 Ω on each colour. Unplug USB while you change wiring.
          </div>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '1rem 1.1rem', fontSize: '0.87rem', color: BODY, lineHeight: 1.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#1d4ed8', marginBottom: '0.4rem' }}><Cpu size={18} /> Power</div>
            USB power is enough for the LEDs, sensors and the matrix (the firmware keeps it dim). A servo can pull enough current to restart the Uno. If the board keeps printing <code style={mono}>READY</code>, power the servo from a separate 5 V supply and join its GND to the Uno’s GND.
          </div>
        </div>

        <h3 style={{ fontWeight: 800, color: INK, fontSize: '1.2rem', margin: '0 0 0.75rem' }}>Firmware commands</h3>
        <p style={{ color: BODY, lineHeight: 1.7, marginTop: 0 }}>9600 baud, 8 data bits, no parity, 1 stop bit. Send one command per line, ending with a line feed (<code style={mono}>\n</code>). Upper or lower case both work.</p>
        <div style={{ overflowX: 'auto', marginBottom: '1rem', border: '1px solid #e2e8f0', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead><tr><th style={th}>Send</th><th style={th}>Reply</th><th style={th}>What it does</th></tr></thead>
            <tbody>
              {COMMANDS.map(([c, r, w]) => (
                <tr key={c}><td style={{ ...td, ...mono, color: INK }}>{c}</td><td style={{ ...td, ...mono }}>{r}</td><td style={td}>{w}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <details style={{ marginBottom: '2.5rem', border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
          <summary style={{ cursor: 'pointer', padding: '0.8rem 1rem', fontWeight: 700, color: INK }}>Show the full firmware code</summary>
          <pre style={{ margin: 0, padding: '1rem', background: '#0f172a', color: '#e2e8f0', overflowX: 'auto', fontSize: '0.75rem', lineHeight: 1.55, borderRadius: '0 0 12px 12px', fontFamily: "'JetBrains Mono',monospace" }}>{firmware}</pre>
        </details>

        <h3 style={{ fontWeight: 800, color: INK, fontSize: '1.2rem', margin: '0 0 0.4rem' }}>Try your kit from this page</h3>
        <p style={{ color: BODY, lineHeight: 1.7, marginTop: 0 }}>Plug in your Uno with the firmware uploaded, then connect. Use it to check your wiring before you start in LabVIEW.</p>
        <KitTester />
      </div>
    </section>
  );
}
