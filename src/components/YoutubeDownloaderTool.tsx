import { ExternalLink, FileDown, Scale, Shield } from 'lucide-react';
import { BASE } from '../links';

// The notebook lives in public/colab/ so it is both served by the site (direct download)
// and readable by Colab straight from the GitHub repo. Colab always opens the copy on main.
const NOTEBOOK_PATH = 'public/colab/LvTS_YouTube_Downloader.ipynb';
export const COLAB_URL = `https://colab.research.google.com/github/fijianblood/lvts/blob/main/${NOTEBOOK_PATH}`;
const NOTEBOOK_FILE = `${BASE}colab/LvTS_YouTube_Downloader.ipynb`;

const STEPS: { title: string; text: string }[] = [
  { title: 'Open it in Google Colab', text: 'Tap the button below and sign in with your Google account (top right). It is free and there is nothing to install.' },
  { title: 'Run Step 1', text: 'Click ▶ Run on Step 1 and wait for ✅ Ready (about 30 seconds). If Colab shows a warning about this notebook, click Run anyway.' },
  { title: 'Paste your link', text: 'In Step 2, paste a YouTube link, choose a quality (1080p, 720p, 480p, best, or MP3 audio), then click ▶ Run.' },
  { title: 'Get your file', text: 'Your browser downloads the file when it is done. You can also tick the box to save a copy to your Google Drive.' },
];

export default function YoutubeDownloaderTool() {
  return (
    <>
      <div style={{ marginTop: '3.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.75rem' }}>
          <Shield size={14} /> Free Tool
        </div>
        <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.6rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15, marginBottom: '0.75rem' }}>
          YouTube <span className="grad-text">Downloader</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7 }}>
          Save a YouTube video as an MP4 (up to 1080p) or just the sound as an MP3. It runs free on Google Colab with your own Google account, not on your device.
        </p>
      </div>

      <div className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.8rem', boxShadow: '0 8px 40px rgba(0,0,0,0.06)' }}>
        <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {STEPS.map((step, i) => (
            <li key={step.title} style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '0.75rem 0.9rem' }}>
              <span aria-hidden="true" style={{
                flexShrink: 0, width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg,#2563eb,#7c3aed)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', fontFamily: "'JetBrains Mono',monospace",
              }}>{i + 1}</span>
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', marginBottom: '0.15rem' }}>{step.title}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{step.text}</div>
              </div>
            </li>
          ))}
        </ol>

        <a href={COLAB_URL} target="_blank" rel="noopener noreferrer"
          style={{
            marginTop: '1.4rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            background: 'linear-gradient(135deg,#2563eb,#7c3aed)', border: 'none', color: '#fff', padding: '0.9rem', borderRadius: 10,
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none', boxSizing: 'border-box',
          }}>
          <ExternalLink size={18} /> Open in Google Colab
        </a>

        <div style={{ marginTop: '0.8rem', textAlign: 'center' }}>
          <a href={NOTEBOOK_FILE} download="LvTS_YouTube_Downloader.ipynb"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
            <FileDown size={15} /> Or download the notebook (.ipynb) and upload it to Colab yourself
          </a>
        </div>

        <div role="note" style={{ marginTop: '1.2rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 10, padding: '0.75rem 0.9rem' }}>
          <Scale size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.6 }}>
            <strong>Please download only videos you own, have permission to download, or that are licensed for reuse</strong> (for example Creative Commons). Downloading other videos may break YouTube's Terms of Service or copyright law.
          </div>
        </div>
      </div>
    </>
  );
}
