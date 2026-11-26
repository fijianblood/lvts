import { useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';
import { CONTACT } from '../data/contact';
import { SITE_URL } from '../data/routes';
import { BASE } from '../links';
import { buildLvtsLink, DEFAULT_QUALITY, QUALITY_OPTIONS, type QualityCode } from '../lib/ytLink';

// The Python side is the owner's notebook in public/colab/. Colab opens the copy on main
// straight from GitHub; the site also serves the file for anyone who wants to upload it.
const NOTEBOOK_PATH = 'public/colab/LvTS_YouTube_Downloader.ipynb';
export const COLAB_URL = `https://colab.research.google.com/github/fijianblood/lvts/blob/main/${NOTEBOOK_PATH}`;
const NOTEBOOK_FILE = `${BASE}colab/LvTS_YouTube_Downloader.ipynb`;

// Same look as the card the notebook draws (see lvts_card in the notebook).
const FONT = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
const NAVY = '#0b1d4d';
const AMBER = '#f59e0b';
const GOLD = '#fbbf24';

const label: CSSProperties = { display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 };
const field: CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a',
  padding: '11px 12px', borderRadius: 10, fontSize: 15, fontFamily: FONT,
};
const link: CSSProperties = { color: GOLD, textDecoration: 'none' };

type Copied = 'idle' | 'yes' | 'no';

function Bar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', margin: '8px 0' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg,${AMBER},${GOLD})`, transition: 'width .3s' }} />
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function YoutubeDownloaderTool() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<QualityCode>(DEFAULT_QUALITY);
  const [drive, setDrive] = useState(false);
  const [error, setError] = useState('');
  const [lvtsLink, setLvtsLink] = useState('');
  const [copied, setCopied] = useState<Copied>('idle');

  // The button is a real link to Colab, so the new tab is never blocked as a pop-up.
  // The copy starts inside the click, while this page still has focus.
  function onDownload(e: MouseEvent<HTMLAnchorElement>) {
    const built = buildLvtsLink(url, quality, drive);
    if (!built) {
      e.preventDefault();
      setLvtsLink('');
      setError('Please paste a YouTube link. It starts with https://www.youtube.com/ or https://youtu.be/');
      return;
    }
    setError('');
    setLvtsLink(built);
    setCopied('idle');
    void copyText(built).then(ok => setCopied(ok ? 'yes' : 'no'));
  }

  async function copyAgain() {
    setCopied((await copyText(lvtsLink)) ? 'yes' : 'no');
  }

  function edit(next: () => void) {
    next();
    setError('');
    setLvtsLink('');
  }

  return (
    <div id="youtube-downloader" style={{ marginTop: '3.5rem', scrollMarginTop: 90 }}>
      <div style={{ textAlign: 'center', marginBottom: '1.2rem' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>
          Free Tool
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
          Save a YouTube video as an MP4 (up to 1080p) or just the sound as an MP3.
        </p>
      </div>

      <div style={{ fontFamily: FONT, borderRadius: 16, overflow: 'hidden', boxShadow: '0 6px 24px rgba(10,20,60,.25)', background: '#fff' }}>
        <div style={{ background: `linear-gradient(135deg,${NAVY} 0%,#1e40af 60%,#4338ca 100%)`, color: '#fff', padding: '18px 22px' }}>
          <span style={{ display: 'inline-block', background: AMBER, color: NAVY, fontWeight: 700, borderRadius: 999, padding: '2px 10px', fontSize: 12, marginBottom: 8 }}>
            JS 🏝 LvTS
          </span>
          <h2 style={{ margin: 0, fontSize: 'clamp(20px,4.5vw,24px)', fontWeight: 800, letterSpacing: '.3px', fontFamily: FONT }}>LvTS YouTube Downloader</h2>
          <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: 14 }}>LomaVata Tech Services · Living With Technology · Suva, Fiji</p>
        </div>

        <div style={{ color: '#0f172a', padding: '18px 22px', fontSize: 14 }}>
          <label htmlFor="yt-url" style={label}>YouTube link</label>
          <input id="yt-url" type="url" inputMode="url" autoComplete="off" spellCheck={false}
            placeholder="https://www.youtube.com/watch?v=…" value={url}
            onChange={e => edit(() => setUrl(e.target.value))} style={field} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(220px,100%),1fr))', gap: 12, marginTop: 14, alignItems: 'end' }}>
            <div>
              <label htmlFor="yt-quality" style={label}>Quality</label>
              <select id="yt-quality" value={quality} onChange={e => edit(() => setQuality(e.target.value as QualityCode))} style={field}>
                {QUALITY_OPTIONS.map(q => <option key={q.code} value={q.code}>{q.label}</option>)}
              </select>
              {quality === 'best' && (
                <div style={{ fontSize: 12, color: '#92400e', marginTop: 4 }}>On a phone, 1080p, 720p or 480p is safer: some iPhones can't save "Best" videos to Photos.</div>
              )}
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155', padding: '11px 0', cursor: 'pointer' }}>
              <input type="checkbox" checked={drive} onChange={e => edit(() => setDrive(e.target.checked))}
                style={{ width: 18, height: 18, accentColor: AMBER }} />
              Also save a copy to my Google Drive
            </label>
          </div>

          <a href={COLAB_URL} target="_blank" rel="noopener noreferrer" onClick={onDownload}
            style={{
              marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box',
              background: `linear-gradient(90deg,${AMBER},${GOLD})`, color: NAVY, padding: '13px 16px', borderRadius: 10,
              fontWeight: 800, fontSize: 16, textDecoration: 'none', boxShadow: '0 4px 14px rgba(245,158,11,.35)',
            }}>
            ⬇️ Download with Google Colab
          </a>
          <div style={{ marginTop: 6, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
            Opens Google Colab in a new tab. Free; you need a Google account.
          </div>

          <div aria-live="polite">
            {error && <div style={{ marginTop: 12, color: '#b91c1c', fontWeight: 700 }}>❌ {error}</div>}

            {lvtsLink && (
              <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div>
                  {copied === 'no'
                    ? <>📋 <b>Copy the link below</b>, then switch to the Colab tab.</>
                    : <>📋 <b>Link copied!</b> Colab is opening in a new tab.</>}
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Step 2 of 3 done. Finish in Colab:</div>
                <Bar pct={67} />
                <ol style={{ margin: '6px 0 0', paddingLeft: 20, lineHeight: 1.7, color: '#334155', listStyle: 'decimal' }}>
                  <li>Sign in with your Google account (top right).</li>
                  <li>Paste the link into the <b>video_url</b> box.</li>
                  <li>Press <b>▶ Run</b>. If Colab warns about this notebook, click <b>Run anyway</b>.</li>
                </ol>
                <div style={{ fontSize: 12, color: '#475569', margin: '6px 0 10px' }}>
                  The first run installs the tools (about 30 seconds), then the file comes straight to this phone or computer.
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '8px 12px', fontSize: 13, color: '#1e3a8a', lineHeight: 1.55, marginBottom: 10 }}>
                  <b>📱 On a phone?</b> Browsers save to Downloads first, then:<br />
                  <b>Android:</b> the video shows in <b>Google Photos → Library → Download</b> (or Gallery → Download).<br />
                  <b>iPhone:</b> open the <b>Files</b> app → <b>Downloads</b>, tap the video, then <b>Share → Save Video</b> to put it in Photos.
                  {quality === 'mp3' && <><br />MP3 files stay in Downloads (Files app).</>}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input readOnly value={lvtsLink} aria-label="Your link for Colab" onFocus={e => e.currentTarget.select()}
                    style={{ ...field, flex: 1, minWidth: 0, fontSize: 13, fontFamily: "'JetBrains Mono',ui-monospace,monospace" }} />
                  <button type="button" onClick={copyAgain}
                    style={{ flexShrink: 0, border: `1px solid ${NAVY}`, background: NAVY, color: '#fff', borderRadius: 10, padding: '0 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FONT }}>
                    {copied === 'yes' ? 'Copied ✓' : 'Copy again'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'flex-start', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#1e3a8a', lineHeight: 1.55 }}>
            <span aria-hidden="true">🐍</span>
            <span>
              <b>The Python script runs on Google Colab</b>, Google's free cloud computers, signed in with your own Google account.
              It doesn't run on the LvTS website or on your device. <b>The file comes straight to your phone or computer</b>, and
              Colab deletes it as soon as it arrives, so nothing is kept there.{' '}
              <a href={NOTEBOOK_FILE} download="LvTS_YouTube_Downloader.ipynb" style={{ color: '#1d4ed8', fontWeight: 700 }}>Download the notebook</a>
            </span>
          </div>

          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: '#78350f', lineHeight: 1.55 }}>
            <span aria-hidden="true">⚖️</span>
            <span>
              <b>Please download only videos you own, have permission to download, or that are licensed for reuse</b> (for example
              Creative Commons). Downloading other videos may break YouTube's Terms of Service or copyright law.
            </span>
          </div>
        </div>

        <div style={{ background: NAVY, color: '#e2e8f0', padding: '10px 22px', fontSize: 13, lineHeight: 1.7 }}>
          📞 <a href={CONTACT.phoneHref} style={{ ...link, color: '#fff', fontWeight: 700 }}>{CONTACT.phone}</a>
          {' · '}
          <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" style={{ ...link, color: '#fff', fontWeight: 700 }}>{CONTACT.whatsapp}</a>
          {' | '}✉️ <a href={`mailto:${CONTACT.email}`} style={link}>{CONTACT.email}</a>
          <br />
          🌐 <a href={SITE_URL} style={link}>fijianblood.github.io/lvts</a>
          {' | '}Facebook <b>@lvtsfiji</b>{' | '}TikTok <b>@fijianblood8</b>
        </div>
      </div>
    </div>
  );
}
