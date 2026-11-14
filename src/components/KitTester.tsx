import { useEffect, useRef, useState } from 'react';
import { Plug, Unplug, Send, Volume2, Trash2 } from 'lucide-react';
import { matrixCommand, parseStatus, rgbCommand, type KitReadings } from '../lib/kitProtocol';

// Talks to the LvTS Kit Firmware (src/kit/lvts_kit.ino) over USB with the Web Serial API.
// Chrome and Edge on a computer support it; Safari, Firefox and most phones don't.

interface SerialPortLike {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}
interface SerialLike {
  requestPort(): Promise<SerialPortLike>;
}
const serialApi = (): SerialLike | undefined => (navigator as Navigator & { serial?: SerialLike }).serial;

const PRESETS: Record<string, string[]> = {
  Heart: ['01100110', '11111111', '11111111', '11111111', '01111110', '00111100', '00011000', '00000000'],
  Smile: ['00111100', '01000010', '10100101', '10000001', '10100101', '10011001', '01000010', '00111100'],
  Arrow: ['00011000', '00111100', '01111110', '11011011', '00011000', '00011000', '00011000', '00011000'],
};
const emptyGrid = () => Array.from({ length: 8 }, () => Array<boolean>(8).fill(false));
const fromPreset = (rows: string[]) => rows.map((r) => r.split('').map((c) => c === '1'));

const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '1.1rem' } as const;
const label = { fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' } as const;
const btn = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 0.9rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' } as const;

function Toggle({ on, onClick, text, color }: { on: boolean; onClick: () => void; text: string; color: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      style={{ ...btn, background: on ? color : '#fff', color: on ? '#fff' : '#0f172a', borderColor: on ? color : '#cbd5e1' }}>
      {text} {on ? 'ON' : 'OFF'}
    </button>
  );
}

function Bar({ name, value, max = 1023 }: { name: string; value: number | undefined; max?: number }) {
  const pct = value === undefined ? 0 : Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '0.55rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
        <span>{name}</span><span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{value ?? '–'}</span>
      </div>
      <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#2563eb', transition: 'width 0.2s' }} />
      </div>
    </div>
  );
}

function Dot({ name, on }: { name: string; on: boolean | undefined }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: '#334155', marginRight: '0.9rem' }}>
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: on ? '#16a34a' : '#e2e8f0', border: '1px solid #cbd5e1' }} />{name}
    </span>
  );
}

export default function KitTester() {
  const supported = typeof navigator !== 'undefined' && !!serialApi();
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [readings, setReadings] = useState<KitReadings | null>(null);
  const [live, setLive] = useState(true);
  const [led, setLed] = useState(false);
  const [red, setRed] = useState(false);
  const [green, setGreen] = useState(false);
  const [rgb, setRgb] = useState('#000000');
  const [servoAngle, setServoAngle] = useState(90);
  const [grid, setGrid] = useState(emptyGrid);
  const [mirror, setMirror] = useState(false);
  const [custom, setCustom] = useState('');

  const portRef = useRef<SerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter<Uint8Array> | null>(null);
  const encoder = useRef(new TextEncoder());

  const addLog = (line: string) => setLog((l) => [...l.slice(-60), line]);

  async function send(cmd: string) {
    const writer = writerRef.current;
    if (!writer) return;
    try {
      await writer.write(encoder.current.encode(`${cmd}\n`));
      if (cmd !== 'STATUS') addLog(`> ${cmd}`);
    } catch (e) {
      setError(`Couldn't send: ${(e as Error).message}`);
    }
  }

  async function readLoop(reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    let buf = '';
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let i: number;
        while ((i = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, i).replace(/\r$/, '');
          buf = buf.slice(i + 1);
          const status = parseStatus(line);
          if (status) setReadings(status);
          else if (line) addLog(line);
        }
      }
    } catch {
      // The port was closed or the board was unplugged.
    }
  }

  async function connect() {
    const api = serialApi();
    if (!api) return;
    setError('');
    setBusy(true);
    try {
      const port = await api.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      writerRef.current = port.writable?.getWriter() ?? null;
      const reader = port.readable?.getReader() ?? null;
      readerRef.current = reader;
      if (reader) void readLoop(reader);
      setConnected(true);
      addLog('Connected. Waiting for the board to restart…');
      await new Promise((r) => setTimeout(r, 2000)); // an Uno restarts when the port opens
      await send('PING');
    } catch (e) {
      const msg = (e as Error).message || String(e);
      setError(/No port selected/i.test(msg) ? 'No board chosen.' : `Couldn't connect: ${msg}. Close the Arduino Serial Monitor and LabVIEW if they have the port open.`);
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setConnected(false);
    try { await readerRef.current?.cancel(); } catch { /* already closed */ }
    readerRef.current?.releaseLock();
    try { writerRef.current?.releaseLock(); } catch { /* already released */ }
    try { await portRef.current?.close(); } catch { /* already closed */ }
    readerRef.current = null;
    writerRef.current = null;
    portRef.current = null;
    addLog('Disconnected.');
  }

  // Ask for readings twice a second while connected.
  useEffect(() => {
    if (!connected || !live) return;
    const t = setInterval(() => { void send('STATUS'); }, 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, live]);

  // Close the port if the visitor leaves the page.
  useEffect(() => () => { void disconnect(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function sendRgb(hex: string) {
    setRgb(hex);
    void send(rgbCommand(hex));
  }

  const off = !connected;

  if (!supported) {
    return (
      <div style={{ ...card, background: '#fffbeb', borderColor: '#fde68a', color: '#92400e', fontSize: '0.9rem', lineHeight: 1.6 }}>
        <strong>Kit tester:</strong> open this page in <strong>Chrome or Edge on a computer</strong> to control your kit from here. This browser doesn’t support Web Serial (Safari, Firefox and most phones don’t). Everything else on this page still works.
      </div>
    );
  }

  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        {connected
          ? <button type="button" onClick={disconnect} style={{ ...btn, background: '#fee2e2', borderColor: '#fecaca', color: '#991b1b' }}><Unplug size={16} /> Disconnect</button>
          : <button type="button" onClick={connect} disabled={busy} style={{ ...btn, background: '#0f172a', color: '#fff', borderColor: '#0f172a' }}><Plug size={16} /> {busy ? 'Connecting…' : 'Connect your Uno'}</button>}
        <span style={{ fontSize: '0.85rem', color: connected ? '#16a34a' : '#64748b', fontWeight: 600 }}>{connected ? '● Connected' : 'Not connected'}</span>
        <label style={{ fontSize: '0.85rem', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live readings
        </label>
      </div>
      {error && <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>}

      <fieldset disabled={off} style={{ border: 'none', padding: 0, margin: 0, opacity: off ? 0.55 : 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: '1rem' }}>
          <div style={card}>
            <div style={label}>Outputs</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.9rem' }}>
              <Toggle on={led} text="Built-in LED" color="#f59e0b" onClick={() => { setLed(!led); void send(`LED ${led ? 'OFF' : 'ON'}`); }} />
              <Toggle on={red} text="Red" color="#dc2626" onClick={() => { setRed(!red); void send(`RED ${red ? 'OFF' : 'ON'}`); }} />
              <Toggle on={green} text="Green" color="#16a34a" onClick={() => { setGreen(!green); void send(`GREEN ${green ? 'OFF' : 'ON'}`); }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: '#334155', marginBottom: '0.9rem' }}>
              RGB LED <input type="color" value={rgb} onChange={(e) => sendRgb(e.target.value)} style={{ width: 48, height: 32, border: 'none', background: 'none' }} />
              <button type="button" style={btn} onClick={() => sendRgb('#000000')}>Off</button>
            </label>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#334155', marginBottom: '0.9rem' }}>
              Servo: <strong>{servoAngle}°</strong>
              <input type="range" min={0} max={180} value={servoAngle} style={{ width: '100%' }}
                onChange={(e) => setServoAngle(Number(e.target.value))}
                onPointerUp={() => void send(`SERVO ${servoAngle}`)}
                onKeyUp={() => void send(`SERVO ${servoAngle}`)} />
            </label>
            <button type="button" style={btn} onClick={() => void send('BEEP 1000 200')}><Volume2 size={16} /> Beep</button>
          </div>

          <div style={card}>
            <div style={label}>Live readings</div>
            <Bar name="Potentiometer (A0)" value={readings?.POT} />
            <Bar name="Light, LDR (A1)" value={readings?.LDR} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.8rem 0' }}>
              <div aria-label="Joystick position" style={{ position: 'relative', width: 84, height: 84, borderRadius: 12, background: '#f1f5f9', border: '1px solid #e2e8f0', flexShrink: 0 }}>
                {readings && <span style={{ position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: readings.JSW ? '#dc2626' : '#2563eb', left: `calc(${(readings.JX / 1023) * 100}% - 7px)`, top: `calc(${(readings.JY / 1023) * 100}% - 7px)` }} />}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.7, fontFamily: "'JetBrains Mono',monospace" }}>
                Joystick<br />X {readings?.JX ?? '–'} · Y {readings?.JY ?? '–'}
              </div>
            </div>
            <div><Dot name="Button" on={readings ? readings.BTN === 1 : undefined} /><Dot name="Joystick press" on={readings ? readings.JSW === 1 : undefined} /><Dot name="Line sensor" on={readings ? readings.LINE === 1 : undefined} /></div>
          </div>

          <div style={card}>
            <div style={label}>8×8 LED matrix</div>
            <div role="grid" aria-label="Matrix drawing grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4, maxWidth: 220, marginBottom: '0.75rem' }}>
              {grid.map((row, r) => row.map((on, c) => (
                <button key={`${r}-${c}`} type="button" aria-label={`Row ${r + 1} column ${c + 1}`} aria-pressed={on}
                  onClick={() => setGrid((g) => g.map((rr, ri) => rr.map((v, ci) => (ri === r && ci === c ? !v : v))))}
                  style={{ aspectRatio: '1', borderRadius: '50%', border: '1px solid #cbd5e1', background: on ? '#ef4444' : '#fff', padding: 0, cursor: 'pointer' }} />
              )))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.6rem' }}>
              {Object.keys(PRESETS).map((k) => <button key={k} type="button" style={btn} onClick={() => setGrid(fromPreset(PRESETS[k]))}>{k}</button>)}
              <button type="button" style={btn} onClick={() => { setGrid(emptyGrid()); void send('MATRIX CLEAR'); }}><Trash2 size={14} /> Clear</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button type="button" style={{ ...btn, background: '#0f172a', color: '#fff', borderColor: '#0f172a' }} onClick={() => void send(matrixCommand(grid, mirror))}><Send size={14} /> Show on matrix</button>
              <label style={{ fontSize: '0.8rem', color: '#334155', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} /> Mirror (if it shows backwards)
              </label>
            </div>
          </div>
        </div>

        <div style={{ ...card, marginTop: '1rem' }}>
          <div style={label}>Board replies</div>
          <pre aria-live="polite" style={{ margin: '0 0 0.75rem', background: '#0f172a', color: '#e2e8f0', borderRadius: 10, padding: '0.75rem', height: 150, overflowY: 'auto', fontSize: '0.78rem', fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'pre-wrap' }}>
            {log.length ? log.join('\n') : 'Replies from your board appear here.'}
          </pre>
          <form onSubmit={(e) => { e.preventDefault(); if (custom.trim()) { void send(custom.trim()); setCustom(''); } }} style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Type a command, e.g. SERVO 45" aria-label="Command"
              style={{ flex: 1, minWidth: 0, padding: '0.55rem 0.75rem', borderRadius: 10, border: '1px solid #cbd5e1', fontFamily: "'JetBrains Mono',monospace", fontSize: '0.85rem' }} />
            <button type="submit" style={btn}><Send size={14} /> Send</button>
          </form>
        </div>
      </fieldset>
      <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0.75rem 0 0' }}>
        Chrome asks which device to connect: choose your Uno’s COM port. Nothing is sent to LvTS. Only one program can use the port, so close this tab (or press Disconnect) before opening the port in LabVIEW or the Arduino IDE.
      </p>
    </div>
  );
}
