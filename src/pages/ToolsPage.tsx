import { useRef, useState } from 'react';
import type { jsPDF as JsPDFCtor } from 'jspdf';
import { UploadCloud, ArrowUp, ArrowDown, X, FileDown, Loader2, CheckCircle2, AlertCircle, Shield, Layers, FileText } from 'lucide-react';
import { useScrollFade } from '../hooks/useScrollFade';
import { formatSize, isSupportedFile, isIOS, resolveImageSource } from '../lib/imageSource';
import SketchTool from '../components/SketchTool';

interface ImgItem {
  id: number;
  file: File;
  url: string;
  w: number;
  h: number;
}

type PageSize = 'a4' | 'letter' | 'fit';
type Orientation = 'auto' | 'portrait' | 'landscape';

interface PdfItem {
  id: number;
  file: File;
}

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function toJpegDataUrl(url: string, w: number, h: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
    img.src = url;
  });
}

let idCounter = 0;

export default function ToolsPage() {
  const heroRef = useScrollFade();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImgItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>('a4');
  const [orientation, setOrientation] = useState<Orientation>('auto');
  const [quality, setQuality] = useState(85);
  const [converting, setConverting] = useState(false);
  const [status, setStatus] = useState<{ msg: string; type: 'ok' | 'err' | '' }>({ msg: '', type: '' });

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfItems, setPdfItems] = useState<PdfItem[]>([]);
  const [pdfDragActive, setPdfDragActive] = useState(false);
  const [merging, setMerging] = useState(false);
  const [mergeStatus, setMergeStatus] = useState<{ msg: string; type: 'ok' | 'err' | '' }>({ msg: '', type: '' });

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(isSupportedFile);
    if (!files.length) {
      setStatus({ msg: 'No valid image files found.', type: 'err' });
      return;
    }
    files.forEach(async file => {
      const id = idCounter++;
      try {
        const { url, w, h } = await resolveImageSource(file);
        setItems(prev => [...prev, { id, file, url, w, h }]);
      } catch {
        setStatus({ msg: `Couldn't read "${file.name}" — skipped.`, type: 'err' });
      }
    });
    setStatus({ msg: '', type: '' });
  }

  function removeItem(id: number) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function moveItem(id: number, dir: number) {
    setItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  async function convert() {
    if (!items.length) return;

    // iOS Safari doesn't support jsPDF's auto-download — it either silently fails or gets
    // blocked as a popup if opened after the async work below. Open a blank tab now, while
    // we're still inside the click's trusted user-gesture window, then fill it in once ready.
    const ios = isIOS();
    const iosTab = ios ? window.open('', '_blank') : null;

    setConverting(true);
    setStatus({ msg: 'Converting…', type: '' });

    try {
      const { jsPDF } = await import('jspdf');
      let doc: JsPDFCtor | null = null;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        setStatus({ msg: `Converting image ${i + 1} of ${items.length}…`, type: '' });

        const dataUrl = await toJpegDataUrl(item.url, item.w, item.h, quality / 100);
        const imgRatio = item.w / item.h;
        let orient: 'portrait' | 'landscape' = orientation === 'auto' ? (imgRatio >= 1 ? 'landscape' : 'portrait') : orientation;

        const format: string | number[] = pageSize === 'fit' ? [item.w, item.h] : pageSize;
        const unit = pageSize === 'fit' ? 'px' : 'mm';
        const jsOrientation: 'l' | 'p' = pageSize === 'fit' ? (imgRatio >= 1 ? 'l' : 'p') : (orient === 'landscape' ? 'l' : 'p');

        if (i === 0) {
          doc = new jsPDF({ orientation: jsOrientation, unit, format: format as string | number[] });
        } else {
          doc!.addPage(format as string | number[], jsOrientation);
        }

        const pageW = doc!.internal.pageSize.getWidth();
        const pageH = doc!.internal.pageSize.getHeight();

        let drawW: number, drawH: number;
        if (pageSize === 'fit') {
          drawW = pageW; drawH = pageH;
        } else {
          const scale = Math.min(pageW / item.w, pageH / item.h);
          drawW = item.w * scale;
          drawH = item.h * scale;
        }
        const x = (pageW - drawW) / 2;
        const y = (pageH - drawH) / 2;

        doc!.addImage(dataUrl, 'JPEG', x, y, drawW, drawH);
      }

      if (ios) {
        const blob = doc!.output('blob');
        const pdfFile = new File([blob], 'converted.pdf', { type: 'application/pdf' });
        const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };

        if (nav.canShare && nav.canShare({ files: [pdfFile] }) && nav.share) {
          // Best path: opens the native iOS share sheet directly — no hunting for a button.
          iosTab?.close();
          try {
            await nav.share({ files: [pdfFile], title: 'converted.pdf' });
            setStatus({ msg: `Done — ${items.length} image${items.length > 1 ? 's' : ''} converted.`, type: 'ok' });
          } catch (shareErr) {
            if ((shareErr as Error)?.name === 'AbortError') {
              setStatus({ msg: 'Cancelled.', type: '' });
            } else {
              throw shareErr;
            }
          }
        } else {
          const blobUrl = URL.createObjectURL(blob);
          if (iosTab) {
            iosTab.location.href = blobUrl;
          } else {
            window.location.href = blobUrl;
          }
          setStatus({ msg: 'Done — opened in a new tab. If you don\'t see a toolbar, tap once near the top or bottom of the screen, then look for the Share icon (a square with an arrow) to save it.', type: 'ok' });
        }
      } else {
        doc!.save('converted.pdf');
        setStatus({ msg: `Done — ${items.length} image${items.length > 1 ? 's' : ''} converted.`, type: 'ok' });
      }
    } catch (err) {
      console.error(err);
      iosTab?.close();
      setStatus({ msg: 'Something went wrong converting these images. Try again or use fewer files at once.', type: 'err' });
    } finally {
      setConverting(false);
    }
  }

  function handlePdfFiles(fileList: FileList | null) {
    if (!fileList) return;
    const files = Array.from(fileList).filter(isPdfFile);
    if (!files.length) {
      setMergeStatus({ msg: 'No valid PDF files found.', type: 'err' });
      return;
    }
    setPdfItems(prev => [...prev, ...files.map(file => ({ id: idCounter++, file }))]);
    setMergeStatus({ msg: '', type: '' });
  }

  function removePdfItem(id: number) {
    setPdfItems(prev => prev.filter(i => i.id !== id));
  }

  function movePdfItem(id: number, dir: number) {
    setPdfItems(prev => {
      const idx = prev.findIndex(i => i.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }

  async function mergePdfs() {
    if (pdfItems.length < 2) return;

    const ios = isIOS();
    const iosTab = ios ? window.open('', '_blank') : null;

    setMerging(true);
    setMergeStatus({ msg: 'Merging…', type: '' });

    try {
      const { PDFDocument } = await import('pdf-lib');
      const mergedPdf = await PDFDocument.create();

      for (let i = 0; i < pdfItems.length; i++) {
        setMergeStatus({ msg: `Merging file ${i + 1} of ${pdfItems.length}…`, type: '' });
        const bytes = await pdfItems[i].file.arrayBuffer();
        const srcDoc = await PDFDocument.load(bytes);
        const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
        copiedPages.forEach(page => mergedPdf.addPage(page));
      }

      const mergedBytes = await mergedPdf.save();
      const blob = new Blob([mergedBytes as BlobPart], { type: 'application/pdf' });

      if (ios) {
        const pdfFile = new File([blob], 'merged.pdf', { type: 'application/pdf' });
        const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean; share?: (data: ShareData) => Promise<void> };

        if (nav.canShare && nav.canShare({ files: [pdfFile] }) && nav.share) {
          iosTab?.close();
          try {
            await nav.share({ files: [pdfFile], title: 'merged.pdf' });
            setMergeStatus({ msg: `Done — ${pdfItems.length} PDFs merged.`, type: 'ok' });
          } catch (shareErr) {
            if ((shareErr as Error)?.name === 'AbortError') {
              setMergeStatus({ msg: 'Cancelled.', type: '' });
            } else {
              throw shareErr;
            }
          }
        } else {
          const blobUrl = URL.createObjectURL(blob);
          if (iosTab) {
            iosTab.location.href = blobUrl;
          } else {
            window.location.href = blobUrl;
          }
          setMergeStatus({ msg: 'Done — opened in a new tab. If you don\'t see a toolbar, tap once near the top or bottom of the screen, then look for the Share icon (a square with an arrow) to save it.', type: 'ok' });
        }
      } else {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'merged.pdf';
        a.click();
        URL.revokeObjectURL(blobUrl);
        setMergeStatus({ msg: `Done — ${pdfItems.length} PDFs merged into one file.`, type: 'ok' });
      }
    } catch (err) {
      console.error(err);
      iosTab?.close();
      setMergeStatus({ msg: "Something went wrong merging these PDFs. Make sure none of them are password-protected or corrupted.", type: 'err' });
    } finally {
      setMerging(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a',
    padding: '0.6rem 0.75rem', borderRadius: 8, fontSize: '0.875rem', fontFamily: "'Space Grotesk',sans-serif",
  };

  return (
    <>
      <section style={{ padding: '120px 1.5rem 80px', position: 'relative', overflow: 'hidden' }}>
        <div className="orb" style={{ width: 400, height: 400, background: 'rgba(37,99,235,0.06)', top: '-10%', right: '-5%' }} />

        <div ref={heroRef} className="fade-in" style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
            <Shield size={14} /> Free Tool
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, marginBottom: '1rem' }}>
            Image <span className="grad-text">→ PDF</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75 }}>
            Drop in any images, arrange the order, download one merged PDF. Everything happens right here in your browser — nothing is ever uploaded anywhere.
          </p>
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.8rem', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
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
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.3rem' }}>Click to choose images, or drag them here</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>JPG, PNG, WebP, GIF, BMP, HEIC/HEIF (iPhone), DNG (RAW) — any order, any number</div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*,.heic,.heif,.dng" multiple style={{ display: 'none' }}
              onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />

            {items.length > 0 && (
              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {items.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.5rem 0.7rem' }}>
                    <img src={item.url} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0, background: '#e2e8f0' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx + 1}. {item.file.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>{formatSize(item.file.size)} · {item.w}×{item.h}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => moveItem(item.id, -1)} title="Move up"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => moveItem(item.id, 1)} title="Move down"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removeItem(item.id)} title="Remove"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(180px,100%),1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>Page Size</label>
                <select value={pageSize} onChange={e => setPageSize(e.target.value as PageSize)} style={selectStyle}>
                  <option value="a4">A4</option>
                  <option value="letter">Letter</option>
                  <option value="fit">Fit to image</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>Orientation</label>
                <select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)} disabled={pageSize === 'fit'} style={{ ...selectStyle, opacity: pageSize === 'fit' ? 0.5 : 1 }}>
                  <option value="auto">Auto (match image)</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#64748b', marginBottom: '0.4rem' }}>
                <span>Image Quality (smaller ⇄ sharper)</span>
                <span style={{ color: '#2563eb', fontFamily: "'JetBrains Mono',monospace" }}>{quality}%</span>
              </label>
              <input type="range" min={40} max={100} step={5} value={quality} onChange={e => setQuality(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#2563eb' }} />
            </div>

            <button onClick={convert} disabled={!items.length || converting}
              style={{
                marginTop: '1.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.9rem', borderRadius: 10,
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem',
                cursor: !items.length || converting ? 'not-allowed' : 'pointer', opacity: !items.length || converting ? 0.5 : 1,
              }}>
              {converting ? <><Loader2 size={18} className="animate-spin" /> Converting…</> : <><FileDown size={18} /> Convert to PDF</>}
            </button>

            {status.msg && (
              <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: status.type === 'ok' ? '#16a34a' : status.type === 'err' ? '#ef4444' : '#64748b' }}>
                {status.type === 'ok' && <CheckCircle2 size={15} />}
                {status.type === 'err' && <AlertCircle size={15} />}
                {status.msg}
              </div>
            )}
          </div>

          <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
              <Shield size={14} /> Free Tool
            </div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '0.75rem' }}>
              Merge <span className="grad-text">PDF Files</span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
              Combine two or more PDFs into a single file, in whatever order you choose. Runs entirely in your browser — nothing is ever uploaded.
            </p>
          </div>

          <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.8rem', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
            <div
              onClick={() => pdfInputRef.current?.click()}
              onDragEnter={e => { e.preventDefault(); setPdfDragActive(true); }}
              onDragOver={e => { e.preventDefault(); setPdfDragActive(true); }}
              onDragLeave={e => { e.preventDefault(); setPdfDragActive(false); }}
              onDrop={e => { e.preventDefault(); setPdfDragActive(false); handlePdfFiles(e.dataTransfer.files); }}
              style={{
                border: `2px dashed ${pdfDragActive ? '#2563eb' : '#e2e8f0'}`,
                background: pdfDragActive ? 'rgba(37,99,235,0.05)' : '#f8fafc',
                borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s ease',
              }}>
              <UploadCloud size={32} color="#2563eb" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginBottom: '0.3rem' }}>Click to choose PDFs, or drag them here</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Add 2 or more PDF files — arrange the order below</div>
            </div>
            <input ref={pdfInputRef} type="file" accept="application/pdf,.pdf" multiple style={{ display: 'none' }}
              onChange={e => { handlePdfFiles(e.target.files); e.target.value = ''; }} />

            {pdfItems.length > 0 && (
              <div style={{ marginTop: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {pdfItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.5rem 0.7rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="#2563eb" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{idx + 1}. {item.file.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: "'JetBrains Mono',monospace" }}>{formatSize(item.file.size)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button onClick={() => movePdfItem(item.id, -1)} title="Move up"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => movePdfItem(item.id, 1)} title="Move down"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => removePdfItem(item.id)} title="Remove"
                        style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={mergePdfs} disabled={pdfItems.length < 2 || merging}
              style={{
                marginTop: '1.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.9rem', borderRadius: 10,
                fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem',
                cursor: pdfItems.length < 2 || merging ? 'not-allowed' : 'pointer', opacity: pdfItems.length < 2 || merging ? 0.5 : 1,
              }}>
              {merging ? <><Loader2 size={18} className="animate-spin" /> Merging…</> : <><Layers size={18} /> Merge PDFs</>}
            </button>

            {pdfItems.length === 1 && (
              <div style={{ marginTop: '0.7rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>Add at least one more PDF to merge.</div>
            )}

            {mergeStatus.msg && (
              <div style={{ marginTop: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.8rem', color: mergeStatus.type === 'ok' ? '#16a34a' : mergeStatus.type === 'err' ? '#ef4444' : '#64748b' }}>
                {mergeStatus.type === 'ok' && <CheckCircle2 size={15} />}
                {mergeStatus.type === 'err' && <AlertCircle size={15} />}
                {mergeStatus.msg}
              </div>
            )}
          </div>

          <SketchTool />

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.7 }}>
            🔒 Runs 100% locally in your browser — your files never leave your device.<br />
            Brought to you free by <span style={{ fontWeight: 700, color: '#2563eb' }}>LomaVata Tech Services</span>.
          </div>
        </div>
      </section>
    </>
  );
}
