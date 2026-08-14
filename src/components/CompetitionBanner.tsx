import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
import { getContestPhase, type ContestPhase } from '../lib/weaveContest';

interface CompetitionBannerProps {
  onNav: (p: string) => void;
}

const TREASURE_TEASER = '💰 A hidden $20 redeemable voucher code is also hidden somewhere on the site — find it to win!';

const MESSAGES: Record<ContestPhase, string> = {
  phase1: '🏆 The Weave Playground contest is LIVE! Phase 1 — Levels 1–36: open 12 August 2026, 6:00 PM – 30 August 2026, 7:00 PM (Fiji time). First to finish level 36, screenshot the victory page, and post it in the comments wins $50 FJD. ' + TREASURE_TEASER,
  'phase2-locked': '🎮 Phase 1 of the Weave Playground has wrapped. Phase 2 — Levels 37–50: stay locked until 10 September 2026, then run until 20 October 2026, 7:00 PM (Fiji time). First to finish level 50 during that window wins a second $50 FJD. ' + TREASURE_TEASER,
  phase2: '🏆 Phase 2 of the Weave Playground is LIVE! Levels 37–50, running until 20 October 2026, 7:00 PM (Fiji time). First to finish level 50 wins a second $50 FJD! ' + TREASURE_TEASER,
  ended: '🎮 Play the Weave Playground — my custom coding language and game, free to try right now. ' + TREASURE_TEASER,
};

const FAST_SPEED = 9; // % of bar width per second — slow, easy to read
const HOVER_SPEED = 0; // eases all the way to a stop while hovered, waiting for the click
const EASE = 0.045; // per-frame lerp toward target speed — gives a smooth glide, not a jump
const START_POS = 130; // % — off-screen right
const END_POS = -70; // % — off-screen left, loops back to START_POS

export default function CompetitionBanner({ onNav }: CompetitionBannerProps) {
  const reduceMotion = useReducedMotion();
  const trackRef = useRef<HTMLSpanElement>(null);
  const posRef = useRef(START_POS);
  const speedRef = useRef(FAST_SPEED);
  const hoveredRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  const message = MESSAGES[getContestPhase()];
  const fullText = `${message}  ·  Tap to play the Weave Playground →`;

  useEffect(() => {
    if (reduceMotion) return;

    function tick(t: number) {
      if (lastRef.current == null) lastRef.current = t;
      const dt = (t - lastRef.current) / 1000;
      lastRef.current = t;

      const target = hoveredRef.current ? HOVER_SPEED : FAST_SPEED;
      speedRef.current += (target - speedRef.current) * EASE;

      // right-to-left: position decreases over time
      posRef.current -= speedRef.current * dt;
      if (posRef.current < END_POS) posRef.current = START_POS;

      if (trackRef.current) trackRef.current.style.left = `${posRef.current}%`;
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      lastRef.current = null;
    };
  }, [reduceMotion]);

  return (
    <button
      onClick={() => onNav('play')}
      onMouseEnter={() => { hoveredRef.current = true; }}
      onMouseLeave={() => { hoveredRef.current = false; }}
      className="contest-banner"
      aria-label={`${message} Tap to go to the Weave Playground.`}
      style={{
        display: 'block', width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
        position: 'sticky', top: 0, zIndex: 55, height: 46, overflow: 'hidden',
        background: 'linear-gradient(90deg,#16a34a,#0891b2,#2563eb,#7c3aed)',
      }}
    >
      {reduceMotion ? (
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%',
          color: '#fff', fontWeight: 800, fontSize: 'clamp(0.8rem,1.6vw,1rem)',
          fontFamily: "'Syne',sans-serif", padding: '0 1rem', textAlign: 'center',
          textShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>
          {fullText}
        </span>
      ) : (
        <span
          ref={trackRef}
          style={{
            position: 'absolute', left: `${START_POS}%`, top: '50%', transform: 'translateY(-50%)',
            whiteSpace: 'nowrap', color: '#fff', fontWeight: 800, fontSize: 'clamp(0.8rem,1.6vw,1rem)',
            fontFamily: "'Syne',sans-serif", letterSpacing: '0.01em',
            textShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          {fullText}
        </span>
      )}

      <style>{`
        .contest-banner { transition: filter 0.2s ease; }
        .contest-banner:hover { filter: brightness(1.1); }
      `}</style>
    </button>
  );
}
