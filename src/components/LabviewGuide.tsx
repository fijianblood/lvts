import type { ReactNode } from 'react';
import { BookOpen, ChevronDown } from 'lucide-react';

// "How to use LabVIEW" guide on the LabVIEW Help page. Facts come from the LvTS LabVIEW lab guide,
// which was checked against NI documentation in November 2026. Keep version and licence notes in step with NI.

const INK = '#0f172a';
const BODY = '#334155';

const p = { fontSize: '0.93rem', color: BODY, lineHeight: 1.75, margin: '0 0 0.9rem' } as const;
const li = { fontSize: '0.93rem', color: BODY, lineHeight: 1.7, marginBottom: '0.45rem' } as const;
const h4 = { fontWeight: 700, color: INK, fontSize: '0.98rem', margin: '1.2rem 0 0.5rem' } as const;

function K({ children }: { children: ReactNode }) {
  return <kbd style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.8rem', background: '#f1f5f9', border: '1px solid #cbd5e1', borderBottomWidth: 2, borderRadius: 5, padding: '0.05rem 0.35rem', color: INK }}>{children}</kbd>;
}

function C({ children }: { children: ReactNode }) {
  return <code style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.82rem', background: '#f1f5f9', borderRadius: 4, padding: '0.05rem 0.3rem', color: '#0f172a' }}>{children}</code>;
}

type FirstCol = 'bold' | 'code' | 'keys';

/** Rows are plain text. The first column can be bold, code (code: second column too) or keyboard keys ("Ctrl+E"). */
function Table({ head, rows, first }: { head: string[]; rows: string[][]; first?: FirstCol }) {
  function cell(text: string, col: number): ReactNode {
    if (col === 0 && first === 'bold') return <strong>{text}</strong>;
    if (first === 'code' && col < 2) return <C>{text}</C>;
    if (col === 0 && first === 'keys') {
      return text.split('+').map((k, i) => <span key={k}>{i > 0 && '+'}<K>{k}</K></span>);
    }
    return text;
  }
  return (
    <div style={{ overflowX: 'auto', margin: '0.5rem 0 1rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: head.length > 2 ? 520 : 0 }}>
        <thead>
          <tr>{head.map((h) => <th key={h} style={{ textAlign: 'left', padding: '0.55rem 0.7rem', background: '#f1f5f9', color: INK, borderBottom: '1px solid #e2e8f0' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>{r.map((c, j) => <td key={j} style={{ padding: '0.55rem 0.7rem', borderBottom: '1px solid #e2e8f0', color: BODY, verticalAlign: 'top', lineHeight: 1.55 }}>{cell(c, j)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chapter({ n, title, summary, children, open = false }: { n: number; title: string; summary: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="lv-chapter" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: '0.9rem', overflow: 'hidden' }}>
      <summary style={{ listStyle: 'none', cursor: 'pointer', padding: '1.1rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
        <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 10, background: INK, color: '#f5a524', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{n}</span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 700, color: INK }}>{title}</span>
          <span style={{ display: 'block', fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>{summary}</span>
        </span>
        <ChevronDown size={20} color="#64748b" className="lv-chevron" style={{ flexShrink: 0, transition: 'transform 0.2s' }} />
      </summary>
      <div style={{ padding: '0 1.3rem 1.2rem', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ paddingTop: '1rem' }}>{children}</div>
      </div>
    </details>
  );
}

export default function LabviewGuide() {
  return (
    <section id="guide" style={{ padding: '80px 1.5rem', background: '#f8fafc' }}>
      <style>{`
        .lv-chapter summary::-webkit-details-marker { display: none; }
        .lv-chapter[open] .lv-chevron { transform: rotate(180deg); }
        .lv-chapter ol, .lv-chapter ul { padding-left: 1.4rem; margin: 0 0 0.9rem; }
        .lv-chapter ol { list-style: decimal; }
        .lv-chapter ul { list-style: disc; }
        .lv-chapter li::marker { color: #b45309; font-weight: 700; }
      `}</style>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>Free guide</div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.2rem)', color: INK, lineHeight: 1.15, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BookOpen size={28} color="#f5a524" /> How to use LabVIEW and NI software
        </h2>
        <p style={{ ...p, marginBottom: '1.75rem' }}>
          A step-by-step guide from installing LabVIEW to controlling real hardware from your phone. Work through the chapters in order. Each one builds on the last. Tap a chapter to open it.
        </p>

        <Chapter n={1} open title="What LabVIEW is" summary="Front panel, block diagram, VIs and dataflow">
          <p style={p}>
            <strong>LabVIEW</strong> is a graphical programming environment from <strong>NI</strong> (National Instruments, now part of Emerson). Its language is called <strong>G</strong>. You don’t type code. You draw it by placing functions and joining them with wires.
          </p>
          <Table first="bold" head={['Term', 'What it means']} rows={[
            ['Front panel', 'The user interface: knobs, switches, buttons, graphs and text boxes.'],
            ['Block diagram', 'The code. Wires carry data between function nodes.'],
            ['VI', 'A program file (Virtual Instrument), saved as .vi. Every VI has a front panel and a block diagram.'],
            ['SubVI', 'A VI used inside another VI, like a function in other languages.'],
            ['Control / indicator', 'A control is an input (you set it). An indicator is an output (the program shows a value).'],
            ['Project (.lvproj)', 'Groups your VIs, hardware targets, web services and build settings.'],
          ]} />
          <h4 style={h4}>Dataflow: the one rule to remember</h4>
          <p style={p}>
            A node runs as soon as all of its inputs have data. Order comes from the wires, not from where things sit on the screen. Two pieces of code that aren’t wired together run in parallel automatically.
          </p>
          <h4 style={h4}>Why engineers use it</h4>
          <p style={{ ...p, marginBottom: 0 }}>
            Built-in drivers for instruments (serial, USB, Ethernet, GPIB), NI measurement hardware, and maker boards like Arduino and Raspberry Pi. Ready-made UI parts such as charts, gauges and switches mean you can have a working test panel in minutes.
          </p>
        </Chapter>

        <Chapter n={2} title="The NI software you’ll use" summary="LabVIEW, Package Manager, NI-VISA, LINX, DAQmx, Web Server">
          <p style={p}>“LabVIEW NI” usually means LabVIEW plus the NI drivers and tools around it. These are the main pieces:</p>
          <Table first="bold" head={['NI software', 'What it does', 'When you need it']} rows={[
            ['LabVIEW', 'The editor where you build and run VIs.', 'Always.'],
            ['NI Package Manager (NIPM)', 'Installs, updates and removes all NI software.', 'Always. Use it to install drivers and apply updates.'],
            ['NI-VISA', 'Driver for talking to instruments over serial (COM ports), USB, Ethernet and GPIB.', 'Any project with an Arduino or instrument over USB serial.'],
            ['Hobbyist (LINX) Toolkit', 'Ready-made VIs for Arduino and Raspberry Pi. Menu: Tools » MakerHub » LINX.', 'Maker boards. Windows only, 32-bit LabVIEW only.'],
            ['NI-DAQmx', 'Driver for NI data-acquisition (DAQ) hardware.', 'If your lab uses NI DAQ devices.'],
            ['NI Web Server', 'Hosts LabVIEW Web Services so a browser or phone can talk to your VI.', 'Web control projects. Windows only.'],
            ['Application Builder', 'Turns your VI into a stand-alone .exe.', 'When you need to run it without opening LabVIEW.'],
            ['G Web Development Software', 'Draw a browser interface in G (WebVIs). It runs in any modern browser.', 'If you want a web UI without writing HTML/JS. 64-bit only.'],
          ]} />
          <h4 style={h4}>Which LabVIEW edition?</h4>
          <ul>
            <li style={li}><strong>Your university’s licence:</strong> use this for coursework if your lab provides it.</li>
            <li style={li}><strong>LabVIEW Community Edition:</strong> free from NI for <em>personal, non-commercial</em> use, renewed yearly through your ni.com account. On Windows it’s 32-bit, so any Python or DLL you call from LabVIEW must be 32-bit too.</li>
            <li style={li}><strong>Paid LabVIEW:</strong> needed for commercial or paid work. NI sells subscription and perpetual licences.</li>
          </ul>
          <p style={{ ...p, marginBottom: 0 }}>LabVIEW gets a new release twice a year. The latest at the time of writing is <strong>LabVIEW 2026 Q3</strong> (July 2026).</p>
        </Chapter>

        <Chapter n={3} title="Install LabVIEW and drivers" summary="About 30–60 minutes on Windows 10 or 11">
          <ol>
            <li style={li}>Create or sign in to your <strong>NI account</strong> at ni.com. Community Edition is activated through it.</li>
            <li style={li}>Go to <strong>ni.com/labviewcommunity</strong> (or your university’s software portal) and download LabVIEW for <strong>Windows</strong>.</li>
            <li style={li}>Run the installer. If it offers <strong>NI-VISA</strong>, tick it. Leave the <strong>Hobbyist (LINX) Toolkit</strong> selected. On Community Edition, <strong>untick “NI Nigel AI Advisor”</strong>: NI lists it as wrongly included, and it needs a paid subscription.</li>
            <li style={li}>Open LabVIEW and sign in when asked, to activate it.</li>
            <li style={li}>If the <strong>Instrument I/O » Serial</strong> palette is empty, install NI-VISA again <em>after</em> LabVIEW so it attaches to your install, then restart LabVIEW.</li>
            <li style={li}>Open <strong>NI Package Manager → Updates</strong>, install everything offered, then restart. NI has asked users of NI drivers from 2026 Q2 or earlier to apply a critical security update.</li>
            <li style={li}>Plug in your Arduino. In Windows <strong>Device Manager → Ports (COM &amp; LPT)</strong>, note its port, for example <C>COM3</C>. LabVIEW shows it as <C>COM3</C> (VISA name <C>ASRL3::INSTR</C>).</li>
          </ol>
          <p style={{ ...p, marginBottom: 0 }}>Use Windows for this path. The Arduino toolkit and NI Web Server are Windows only.</p>
        </Chapter>

        <Chapter n={4} title="Your first VI: a °C to °F converter" summary="Learn the editor in 10 minutes">
          <ol>
            <li style={li}><strong>File » New VI.</strong> Two windows open: the front panel (grey grid) and the block diagram (white). Press <K>Ctrl</K>+<K>E</K> to switch between them.</li>
            <li style={li}>On the front panel, right-click to open the <strong>Controls palette</strong>. Add a <strong>Numeric Control</strong> and name it <C>Celsius</C>. Add a <strong>Numeric Indicator</strong> and name it <C>Fahrenheit</C>.</li>
            <li style={li}>Switch to the block diagram. Both appear there as <strong>terminals</strong>.</li>
            <li style={li}>Right-click to open the <strong>Functions palette</strong> → <strong>Numeric</strong>. Place a <strong>Multiply</strong> and an <strong>Add</strong>.</li>
            <li style={li}>Hover over a terminal until the cursor becomes a spool, then click and drag to draw a wire. Wire <C>Celsius</C> into Multiply. Right-click Multiply’s other input → <strong>Create » Constant</strong> and type <C>1.8</C>. Wire the result into Add, add a constant <C>32</C>, and wire the output to <C>Fahrenheit</C>.</li>
            <li style={li}>Go back to the front panel, type a number into <C>Celsius</C> and press <strong>Run</strong> (the arrow, or <K>Ctrl</K>+<K>R</K>). <C>100</C> should show <C>212</C>.</li>
          </ol>
          <h4 style={h4}>If the Run arrow is broken</h4>
          <p style={p}>A broken (grey, cracked) arrow means the VI has errors. Click it to see the error list. Double-click an error to jump to it. <K>Ctrl</K>+<K>B</K> removes all broken wires.</p>
          <h4 style={h4}>Shortcuts worth learning on day one</h4>
          <Table first="keys" head={['Keys', 'What it does']} rows={[
            ['Ctrl+E', 'Switch between front panel and block diagram'],
            ['Ctrl+R', 'Run the VI'],
            ['Ctrl+H', 'Context Help: hover over anything to see what it is and what its inputs mean'],
            ['Ctrl+B', 'Remove broken wires'],
            ['Ctrl+Space', 'Quick Drop: type a function name instead of searching the palettes'],
          ]} />
        </Chapter>

        <Chapter n={5} title="Core building blocks" summary="Data types, loops, case structures, shift registers, errors, subVIs">
          <h4 style={{ ...h4, marginTop: 0 }}>Data types and wire colours</h4>
          <Table head={['Type', 'Wire colour', 'Example']} rows={[
            ['Floating-point number (DBL)', 'Orange', 'A temperature, a voltage'],
            ['Integer', 'Blue', 'A loop counter, a byte count'],
            ['Boolean', 'Green', 'A switch, an on/off state'],
            ['String', 'Pink', 'A serial command like LED ON'],
            ['Array', 'Thicker wire of the same colour', 'A list of readings'],
            ['Cluster', 'Brown or pink, patterned', 'Several values grouped together, like the error cluster'],
          ]} />
          <h4 style={h4}>Structures (Functions » Structures)</h4>
          <ul>
            <li style={li}><strong>While Loop:</strong> repeats until the stop terminal gets True. Wire a Stop button to it. Put a <strong>Wait (ms)</strong> inside so it doesn’t use 100% CPU.</li>
            <li style={li}><strong>For Loop:</strong> runs a set number of times (N). Wiring an array in runs once per element.</li>
            <li style={li}><strong>Case Structure:</strong> like if/else or switch. Wire a Boolean, number, string or enum to its selector.</li>
            <li style={li}><strong>Shift register:</strong> right-click a loop’s border → <strong>Add Shift Register</strong>. It carries a value from one loop run to the next, for example a running total.</li>
          </ul>
          <h4 style={h4}>The error cluster</h4>
          <p style={p}>Most NI functions have <C>error in</C> and <C>error out</C>. Chain them from one node to the next. This makes things run in the right order, and if something fails, later nodes skip their work and pass the error along. End the chain with a <strong>Simple Error Handler</strong> so you see a message.</p>
          <h4 style={h4}>Making a subVI</h4>
          <ol>
            <li style={li}>Build the code as its own VI with controls for inputs and indicators for outputs.</li>
            <li style={li}>On the front panel, top right, use the <strong>connector pane</strong>: click a terminal square, then the control it should connect to. Inputs go on the left, outputs on the right.</li>
            <li style={li}>Edit the <strong>icon</strong> next to it so you can recognise it.</li>
            <li style={li}>Save it, then drag it from the project (or use <strong>Select a VI…</strong> in the Functions palette) onto another block diagram.</li>
          </ol>
          <h4 style={h4}>Debugging tools</h4>
          <ul>
            <li style={li}><strong>Highlight Execution</strong> (light-bulb button): runs slowly and shows data moving along the wires.</li>
            <li style={li}><strong>Probe:</strong> right-click a wire → Probe to see its value while the VI runs.</li>
            <li style={li}><strong>Breakpoint:</strong> right-click a node or wire → Breakpoint to pause there.</li>
          </ul>
        </Chapter>

        <Chapter n={6} title="Talk to hardware: Arduino over NI-VISA" summary="Switch a real LED from a LabVIEW button">
          <p style={p}>The most reliable student setup is your own small text protocol over USB serial. The Arduino listens for one command per line and replies.</p>
          <Table first="code" head={['LabVIEW sends', 'Arduino replies']} rows={[
            ['PING', 'PONG'],
            ['LED ON', 'OK LED ON'],
            ['LED OFF', 'OK LED OFF'],
            ['STATUS', 'LED=1 A0=512'],
          ]} />
          <h4 style={h4}>Steps</h4>
          <ol>
            <li style={li}>Upload a sketch to the Arduino Uno that reads lines at <strong>9600 baud</strong> and answers the commands above. Test it in the Arduino IDE’s Serial Monitor (line ending: Newline), then <strong>close the Serial Monitor</strong>. Only one program can use a COM port at a time.</li>
            <li style={li}>In LabVIEW, from <strong>Instrument I/O » Serial</strong>, place <strong>VISA Configure Serial Port</strong>: 9600 baud, 8 data bits, no parity, 1 stop bit. Termination character is on by default and set to line feed (<C>\n</C>). Leave it that way.</li>
            <li style={li}>Add <strong>Wait (ms) = 2000</strong>. An Uno restarts when the port opens, and needs a moment.</li>
            <li style={li}>Add <strong>VISA Flush I/O Buffer</strong> to discard the start-up message.</li>
            <li style={li}><strong>VISA Write</strong> your command joined with a <strong>Line Feed constant</strong> (use Concatenate Strings).</li>
            <li style={li}><strong>VISA Read</strong> with a byte count such as 64. It returns when it sees the line feed. Pass the result through <strong>Trim Whitespace</strong>.</li>
            <li style={li}>When finished, <strong>VISA Close</strong>. Wire the error cluster through every VISA node.</li>
          </ol>
          <p style={{ ...p, marginBottom: 0 }}>
            Tip: put all of this in one subVI that owns the COM port (a <em>functional global variable</em> with Init, Send and Close actions). Every other part of your program calls that subVI, so the port is never opened twice.
          </p>
        </Chapter>

        <Chapter n={7} title="Design patterns that markers like" summary="State machine, event structure, producer/consumer, FGV">
          <Table first="bold" head={['Pattern', 'What it is', 'Use it for']} rows={[
            ['State machine', 'A While Loop with a Case Structure inside. An enum in a shift register picks the next state: Init → Idle → Measure → Save → Stop.', 'Almost any test or control sequence. The most common pattern in student projects.'],
            ['Event Structure', 'Waits for user actions, such as a button press or a value change, instead of checking them constantly.', 'Responsive front panels that don’t waste CPU. Put the button inside its own event case.'],
            ['Producer/consumer', 'Two loops joined by a queue. One collects data fast, the other saves or processes it.', 'Logging fast data without slowing down the measurement.'],
            ['Functional global variable (FGV)', 'A subVI with an uninitialised shift register that remembers a value between calls.', 'Sharing one resource, like a COM port, safely across the program.'],
          ]} />
          <p style={{ ...p, marginBottom: 0 }}>Explaining <em>why</em> you chose a pattern is often worth as many marks as the code.</p>
        </Chapter>

        <Chapter n={8} title="Charts, timing and saving data" summary="Plot readings live and log them to a file">
          <ul>
            <li style={li}><strong>Waveform Chart:</strong> plots one new point each loop run, like a strip chart. Good for live readings.</li>
            <li style={li}><strong>Waveform Graph:</strong> plots a whole array at once. Good for a finished measurement.</li>
            <li style={li}><strong>Timing:</strong> <em>Wait (ms)</em> pauses a set time each run. <em>Wait Until Next ms Multiple</em> keeps runs on a steady beat, better for regular sampling.</li>
            <li style={li}><strong>Saving to CSV:</strong> <em>File I/O » Write Delimited Spreadsheet</em> appends rows that open in Excel.</li>
            <li style={li}><strong>TDMS:</strong> NI’s file format for large or fast measurement data, with built-in channel names and properties.</li>
          </ul>
          <p style={{ ...p, marginBottom: 0 }}>Example: in the loop’s timeout case, send <C>STATUS</C>, pull out the number after <C>A0=</C> with <strong>Match Pattern</strong> and <strong>Decimal String To Number</strong>, then send it to the chart and the file.</p>
        </Chapter>

        <Chapter n={9} title="Control your VI from a phone or web page" summary="LabVIEW Web Services on the NI Web Server">
          <ol>
            <li style={li}>In your project: right-click <strong>My Computer » New » Web Service</strong> and give it a name, for example <C>lvtslab</C>. The name becomes part of the web address.</li>
            <li style={li}>Right-click <strong>Web Resources » New VI</strong>. This is an <strong>HTTP Method VI</strong>. Its connector-pane inputs arrive as URL query parameters, and its indicators are sent back as JSON.</li>
            <li style={li}>Example: a <C>led.vi</C> with input <C>state</C> calls your serial subVI and returns <C>{'{"ok":true,"reply":"OK LED ON"}'}</C> for <C>/lvtslab/led?state=on</C>.</li>
            <li style={li}>To serve your own web page, right-click the service → <strong>Add Public Content Folder…</strong> and put your <C>index.html</C> and JavaScript there. Files in Private content can’t be reached from a browser.</li>
            <li style={li}>Right-click the service → <strong>Start</strong>. The first time, LabVIEW helps you set up the NI Web Server.</li>
            <li style={li}>Right-click <C>led.vi</C> → <strong>Show Method URL</strong> to copy the exact address. Test it in a browser.</li>
            <li style={li}>For a phone on the same Wi-Fi, use your PC’s IP address (from <C>ipconfig</C>) and allow the port through Windows Firewall on <strong>Private</strong> networks only.</li>
          </ol>
          <p style={{ ...p, marginBottom: 0 }}><strong>Keep it on your local network.</strong> Don’t open it to the internet. For remote access, use a VPN and set up authentication on the NI Web Server first.</p>
        </Chapter>

        <Chapter n={10} title="Build an .exe and keep your work safe" summary="Application Builder, Git and good habits">
          <ul>
            <li style={li}><strong>Build an application:</strong> in the project, right-click <strong>Build Specifications » New » Application (EXE)</strong>, choose your top-level VI as the startup VI, then <strong>Build</strong>. The PC that runs it needs the LabVIEW Run-Time Engine.</li>
            <li style={li}><strong>Git:</strong> in each VI’s properties, tick <em>Separate compiled code from source file</em> so Git only sees real changes. Don’t commit <C>.lvlps</C> or <C>.aliases</C> files: they’re machine-specific.</li>
            <li style={li}><strong>Calling Python:</strong> use the <strong>Python Node</strong>. Python’s bitness must match LabVIEW’s, so use 32-bit Python with Windows Community Edition.</li>
            <li style={li}><strong>Good habits:</strong> keep block diagrams to one screen, use subVIs, label your wires, write comments with free labels, and save often.</li>
          </ul>
        </Chapter>

        <Chapter n={11} title="Common problems and fixes" summary="The errors students hit most">
          <Table head={['Problem', 'Likely cause', 'Fix']} rows={[
            ['Serial palette is empty', 'NI-VISA missing, or installed before LabVIEW', 'Install NI-VISA after LabVIEW, then restart LabVIEW'],
            ['“Resource busy” or can’t open the COM port', 'Arduino Serial Monitor or another VI has the port open', 'Close the Serial Monitor. Open the port in only one place'],
            ['First reply is READY, or the first command is ignored', 'The Uno restarts when the port opens', 'Wait 2000 ms, then flush the buffer after opening'],
            ['Strange characters', 'Baud rate mismatch', 'Use 9600 8N1 on both sides'],
            ['VISA Read times out', 'Command sent without a line feed, or termination character turned off', 'Add a Line Feed constant. Keep termination on (0x0A)'],
            ['Browser shows 404', 'Web service not started, or wrong address', 'Start the service. Check the address with Show Method URL'],
            ['Phone can’t open the page', 'Firewall, or using “localhost” on the phone', 'Use the PC’s IP address and add a firewall rule for Private networks'],
            ['Python Node fails', '64-bit Python with 32-bit LabVIEW', 'Install 32-bit Python'],
            ['LINX toolkit won’t load', 'Using 64-bit LabVIEW, or Mac/Linux', 'Use 32-bit LabVIEW on Windows'],
          ]} />
          <p style={{ ...p, marginBottom: 0 }}>Still stuck? That’s exactly what the sessions below are for.</p>
        </Chapter>

        <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6, marginTop: '1.25rem' }}>
          Version, licence and installation notes checked against NI documentation in November 2026. Menu names can differ slightly between LabVIEW versions. Official reference: ni.com/docs.
        </p>
      </div>
    </section>
  );
}
