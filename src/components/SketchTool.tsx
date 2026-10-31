import { useEffect, useRef, useState } from 'react';
import { UploadCloud, Download, Loader2, CheckCircle2, AlertCircle, Shield, PencilLine, X } from 'lucide-react';
import { isSupportedFile, isIOS, resolveImageSource } from '../lib/imageSource';
import { sketchImageData } from '../lib/sketch';

// Big phone photos (12–48 MP) are scaled down first so the sketch stays quick
// and doesn't run a phone out of memory. 2400px on the long side still prints well.
const MAX_SIDE = 2400;

type Format = 'png' | 'jpeg';

interface Source {
  name: string;
  img: HTMLImageElement;
  w: number;
  h: number;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode image'));
    img.src = url;
  });
}

const labelStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em',
  textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem',
};

export default function SketchTool() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [softness, setSoftness] = useState(8);
  const [darkness, setDarkness] = useState(1.4);
  const [format, setFormat] = useState<Format>('png');
  const [loading, setLoading] = useState(false);
  // What the canvas currently shows, so "Drawing…" can be derived instead of stored.
  const [drawn, setDrawn] = useState<{ source: Source; key: string } | null>(null);
  const drawKey = `${softness}|${darkness}`;
  const drawing = !!source && (drawn?.source !== source || drawn.key !== drawKey);
  const working = loading || drawing;
  const [status, setStatus] = useState<{ msg: string; type: 'ok' | 'err' | '' }>({ msg: '', type: '' });

  async function handleFiles(fileList: FileList | null) {
    const file = fileList && Array.from(fileList).find(isSupportedFile);
    if (!file) {
      setStatus({ msg: 'Please choose an image file.', type: 'err' });
      return;
    }
    setLoading(true);
    setStatus({ msg: 'Reading photo…', type: '' });
    try {
      const { url } = await resolveImageSource(file);
      const img = await loadImage(url);
      const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
      setSource({
        name: file.name.replace(/\.[^.]+$/, ''),
        img,
        w: Math.round(img.naturalWidth * scale),
        h: Math.round(img.naturalHeight * scale),
      });
      setStatus({ msg: '', type: '' });
    } catch {
      setStatus({ msg: `Couldn't read "${file.name}". Try a JPG or PNG.`, type: 'err' });
    } finally {
      setLoading(false);
    }
  }

  // Redraw the sketch whenever the photo or a slider changes. The short delay
  // stops a slider drag from re-running the whole filter on every pixel of movement.
  useEffect(() => {
    if (!source) return;
    const t = window.setTimeout(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (!canvas || !ctx) return;
      canvas.width = source.w;
      canvas.height = source.h;
      ctx.drawImage(source.img, 0, 0, source.w, source.h);
      const { data } = ctx.getImageData(0, 0, source.w, source.h);
      // Slider value is tuned for a ~1200px photo; scale it so the look is the same at any size.
      const radius = softness * Math.max(source.w, source.h) / 1200;
      const out = sketchImageData(data, source.w, source.h, { radius, darkness });
      ctx.putImageData(new ImageData(out, source.w, source.h), 0, 0);
      setDrawn({ source, key: `${softness}|${darkness}` });
    }, 120);
    return () => window.clearTimeout(t);
  }, [source, softness, darkness]);

  function clear() {
    setSource(null);
    setStatus({ msg: '', type: '' });
  }

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const mime = format === 'png' ? 'image/png' : 'image/jpeg';
    const filename = `${source.name}-sketch.${format === 'png' ? 'png' : 'jpg'}`;
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, mime, 0.92));
    if (!blob) {
      setStatus({ msg: 'Could not create the image file. Try again.', type: 'err' });
      return;
    }

    // Same approach as the PDF tools: iPhones ignore <a download>, so use the share sheet there.
    const file = new File([blob], filename, { type: mime });
    const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
    if (isIOS() && nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: filename });
        setStatus({ msg: 'Done — choose "Save Image" to put it in your Photos.', type: 'ok' });
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') setStatus({ msg: 'Sharing failed. Press and hold the sketch to save it instead.', type: 'err' });
      }
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setStatus({ msg: `Downloaded ${filename}`, type: 'ok' });
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.875rem', fontFamily: "'Space Grotesk',sans-serif",
  };

  return (
    <>
      <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
          <Shield size={14} /> Free Tool
        </div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '0.75rem' }}>
          Photo <span className="grad-text">→ Pencil Sketch</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Turn any photo into a hand-drawn pencil sketch, adjust the look, and download it. Runs entirely in your browser — your photo is never uploaded.
        </p>
      </div>

      <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.8rem', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
        {!source && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragEnter={e => { e.preventDefault(); setDragActive(true); }}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
            style={{
              border: `2px dashed ${dragActive ? '#2563eb' : '#e2e8f0'}`,
              background: dragActive ? 'rgba(37,99,235,0.05)' : '#f8fafc',
              borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease',
            }}>
            <UploadCloud size={32} color="#2563eb" style={{ marginBottom: '0.75rem' }} />
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.3rem' }}>Click to choose a photo, or drag it here</div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>JPG, PNG, WebP, HEIC/HEIF (iPhone), DNG (RAW) — portraits and pets work best</div>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*,.heic,.heif,.dng" style={{ display: 'none' }}
          onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

        <div style={{ display: source ? 'block' : 'none' }}>
          <div style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <canvas ref={canvasRef} aria-label="Pencil sketch preview" style={{ display: 'block', width: '100%', height: 'auto' }} />
            {working && (
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.9)', borderRadius: 8, padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: '#64748b' }}>
                <Loader2 size={14} className="animate-spin" /> Drawing…
              </div>
            )}
            <button onClick={clear} title="Choose a different photo"
              style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={16} />
            </button>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>
                <span>Line softness</span>
                <span style={{ color: '#2563eb', fontFamily: "'JetBrains Mono',monospace" }}>{softness}</span>
              </label>
              <input type="range" min={2} max={25} step={1} value={softness} onChange={e => setSoftness(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>
            <div>
              <label style={labelStyle}>
                <span>Pencil darkness</span>
                <span style={{ color: '#2563eb', fontFamily: "'JetBrains Mono',monospace" }}>{darkness.toFixed(1)}</span>
              </label>
              <input type="range" min={1} max={3} step={0.1} value={darkness} onChange={e => setDarkness(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={labelStyle}><span>File type</span></label>
            <select value={format} onChange={e => setFormat(e.target.value as Format)} style={selectStyle}>
              <option value="png">PNG (best quality)</option>
              <option value="jpeg">JPG (smaller file)</option>
            </select>
          </div>

          <button onClick={download} disabled={working}
            style={{
              marginTop: '1.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.9rem', borderRadius: 10,
              fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem',
              cursor: working ? 'not-allowed' : 'pointer', opacity: working ? 0.5 : 1,
            }}>
            {working ? <><Loader2 size={18} className="animate-spin" /> Drawing…</> : <><Download size={18} /> Download Sketch</>}
          </button>
        </div>

        {!source && loading && (
          <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#64748b' }}>
            <PencilLine size={15} /> {status.msg}
          </div>
        )}
        {status.msg && !(!source && loading) && (
          <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: status.type === 'ok' ? '#16a34a' : status.type === 'err' ? '#ef4444' : '#64748b' }}>
            {status.type === 'ok' && <CheckCircle2 size={15} />}
            {status.type === 'err' && <AlertCircle size={15} />}
            {status.msg}
          </div>
        )}
      </div>
    </>
  );
}
