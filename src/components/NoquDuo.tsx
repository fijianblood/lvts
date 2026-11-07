import { pageLink } from '../links';

// The home page's games banner: two halves side by side, Noqublox (the 3D
// game, /noqublox/) on the left and Noqu Vuli (the kids learning page, /kids/)
// on the right, each with its own button.
// The layout (and how it shrinks on phones) is the .noqu-duo CSS in index.css.

export default function NoquDuo({ onNav }: { onNav: (p: string) => void }) {
  return (
    <section aria-labelledby="noqu-duo-title" style={{ padding: '64px 1.5rem', background: '#fff' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '0.6rem' }}>Free to play</div>
          <h2 id="noqu-duo-title" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.7rem,4vw,2.4rem)', color: '#0f172a', lineHeight: 1.15 }}>
            Explore &amp; learn <span className="grad-text">with LvTS</span>
          </h2>
        </div>

        <div className="noqu-duo">
          {/* Left half: Noqublox */}
          <div className="noqu-duo-card" style={{ background: 'linear-gradient(140deg,#0e7490 0%,#1e3a8a 100%)' }}>
            <span aria-hidden="true" className="noqu-duo-deco kids-float" style={{ right: '8%', top: '10%' }}>▣</span>
            <div className="noqu-duo-eyebrow">3D world · Free</div>
            <div className="noqu-duo-art noqu-duo-scene" aria-hidden="true">
              <span>🏠</span><span>🌴</span><span>🛍️</span><span>🚌</span>
            </div>
            <h3>Noqu<span style={{ color: '#fbbf24' }}>blox</span></h3>
            <p>Walk around Raiwai in 3D with other players, make your own character and hunt for the Golden Chip.</p>
            <div className="noqu-duo-chips">
              <span>🏠 Family home</span><span>🛍️ McFarlane Road</span><span>🌐 Play together</span><span>🏆 Golden Chip</span>
            </div>
            <a {...pageLink('house', onNav)} className="noqu-duo-btn" style={{ color: '#1e3a8a', boxShadow: '0 5px 0 #93c5fd' }}>
              Play Noqublox →
            </a>
          </div>

          {/* Right half: Noqu Vuli */}
          <div className="noqu-duo-card" style={{ background: 'linear-gradient(140deg,#7b5cff 0%,#6a46f5 50%,#5b3be6 100%)' }}>
            <span aria-hidden="true" className="noqu-duo-deco kids-float" style={{ right: '8%', top: '10%', animationDelay: '.6s' }}>A</span>
            <span aria-hidden="true" className="noqu-duo-deco kids-float" style={{ right: '22%', bottom: '12%', animationDelay: '1.2s' }}>3</span>
            <div className="noqu-duo-eyebrow">For little ones · Free</div>
            <div className="noqu-duo-art" aria-hidden="true">
              <span style={{ fontSize: '1.15em' }}>🐢</span>
              <span className="noqu-duo-tiles">
                <b style={{ background: '#ffe27a', color: '#16a34a' }}>A</b>
                <b style={{ background: '#9fd8ff', color: '#dc2626' }}>1</b>
                <b style={{ background: '#bdeb7a' }}>🐮</b>
                <b style={{ background: '#ffc6dd', color: '#9333ea' }}>★</b>
              </span>
            </div>
            <h3>Noqu <span style={{ color: '#ffd23f' }}>Vuli</span></h3>
            <p>Letters, counting, animals, shapes and colours for young children, read out loud in English and iTaukei.</p>
            <div className="noqu-duo-chips">
              <span>🔤 ABC</span><span>🔢 1–10</span><span>🐮 Animals</span><span>⭐ Stickers</span>
            </div>
            <a {...pageLink('kids', onNav)} className="noqu-duo-btn" style={{ color: '#5b3be6', boxShadow: '0 5px 0 #c9bcff' }}>
              Start Learning →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
