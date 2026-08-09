import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  IconTool, IconWorld, IconCube, IconGift, IconTruck,
  IconDeviceGamepad2, IconHammer, IconChalkboard, IconHeartbeat, IconSeo, IconMessageCircle, IconMail,
  IconTopologyStar3,
} from '@tabler/icons-react';

interface NavBarProps {
  page: string;
  onNav: (p: string) => void;
}

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'ask', label: 'Ask LvTS', icon: IconMessageCircle, color: '#6366f1' },
  { id: 'services', label: 'Services', icon: IconTool, color: '#2563eb' },
  { id: 'website', label: 'Website', icon: IconWorld, color: '#06b6d4' },
  { id: 'threed', label: '3D Sites', icon: IconCube, color: '#7c3aed' },
  { id: 'rewards', label: 'Rewards', icon: IconGift, color: '#f59e0b' },
  { id: 'ranger', label: 'Ranger XL', icon: IconTruck, color: '#16a34a' },
  { id: 'play', label: 'Play', icon: IconDeviceGamepad2, color: '#ec4899' },
  { id: 'tools', label: 'Tools', icon: IconHammer, color: '#f97316' },
  { id: 'whiteboard', label: 'Whiteboard', icon: IconChalkboard, color: '#0891b2' },
  { id: 'meditrack', label: 'MediTrack', icon: IconHeartbeat, color: '#c1443b' },
  { id: 'network', label: 'Network Setup', icon: IconTopologyStar3, color: '#f2a93c' },
  { id: 'seo', label: 'SEO Tools', icon: IconSeo, color: '#2563eb' },
  { id: 'contact', label: 'Contact', icon: IconMail, color: '#ef4444' },
];

const BASE_SIZE = 44;
const MAX_SCALE = 1.5;
const INFLUENCE = 100;

export default function NavBar({ page, onNav }: NavBarProps) {
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const mouseX = e.clientX;
    itemRefs.current.forEach(el => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - center);
      const scale = dist < INFLUENCE ? 1 + (MAX_SCALE - 1) * (1 - dist / INFLUENCE) : 1;
      el.style.transform = `translateY(${-(scale - 1) * 20}px) scale(${scale})`;
    });
  }

  function resetDock() {
    itemRefs.current.forEach(el => { if (el) el.style.transform = 'translateY(0) scale(1)'; });
  }

  return (
    <nav style={{ position: 'fixed', bottom: 16, left: 0, right: 0, zIndex: 50, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={resetDock}
        className="dock"
        style={{
          pointerEvents: 'auto', display: 'flex', alignItems: 'flex-end', gap: 10,
          padding: '10px 14px', borderRadius: 22, maxWidth: 'calc(100vw - 20px)',
          transformOrigin: 'bottom center',
        }}>
        {LINKS.map((l, i) => {
          const Icon = l.icon;
          const active = page === l.id;
          const accent = l.color ?? '#2563eb';
          const activeBg = l.id === 'home' ? 'linear-gradient(135deg,#2563eb,#7c3aed)' : accent;
          const tile = (
            <div
              ref={el => { itemRefs.current[i] = el; }}
              className="dock-item"
              style={{
                width: BASE_SIZE, height: BASE_SIZE, borderRadius: 13, flexShrink: 0,
                background: active ? activeBg : '#fff',
                border: active ? 'none' : '1px solid rgba(15,23,42,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                boxShadow: active ? `0 6px 16px ${accent}59` : '0 2px 6px rgba(15,23,42,0.08)',
                transformOrigin: 'bottom center', transition: 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1), background 0.2s', cursor: 'pointer',
              }}>
              {l.id === 'home'
                ? <img src={`${import.meta.env.BASE_URL}logo.jpg`} alt="Home" style={{ width: '70%', height: '70%', objectFit: 'contain', borderRadius: 6 }} />
                : Icon && <Icon size={20} color={active ? '#fff' : accent} stroke={2} />}
              <span className="dock-tooltip">{l.label}</span>
              {active && <span style={{ position: 'absolute', bottom: -7, left: '50%', transform: 'translateX(-50%)', width: 4, height: 4, borderRadius: '50%', background: accent }} />}
            </div>
          );
          return (
            <motion.button key={l.id} onClick={() => onNav(l.id)} aria-label={l.label}
              whileTap={{ scale: 0.85 }} transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              {tile}
            </motion.button>
          );
        })}
      </div>

      <style>{`
        .dock::-webkit-scrollbar { display: none; }
        .dock {
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.6);
          box-shadow: 0 10px 40px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.4) inset;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), background 0.35s ease, backdrop-filter 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, opacity 0.35s ease;
        }
        .dock-tooltip {
          position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%);
          background: rgba(15,23,42,0.92); color: #fff; font-size: 0.7rem; font-weight: 600;
          padding: 0.3rem 0.6rem; border-radius: 6px; white-space: nowrap;
          opacity: 0; pointer-events: none; transition: opacity 0.15s;
        }
        .dock-item:hover .dock-tooltip { opacity: 1; }
        @media (hover: hover) and (pointer: fine) {
          .dock {
            transform: scale(0.8);
            opacity: 0.55;
            background: rgba(255,255,255,0.12);
            backdrop-filter: blur(6px) saturate(140%);
            -webkit-backdrop-filter: blur(6px) saturate(140%);
            border-color: rgba(255,255,255,0.2);
            box-shadow: 0 4px 16px rgba(15,23,42,0.08);
          }
          .dock:hover {
            transform: scale(1);
            opacity: 1;
            background: rgba(255,255,255,0.65);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-color: rgba(255,255,255,0.6);
            box-shadow: 0 10px 40px rgba(15,23,42,0.18), 0 1px 0 rgba(255,255,255,0.4) inset;
          }
        }
        @media (max-width: 640px) {
          .dock { gap: 6px !important; padding: 8px 10px !important; overflow-x: auto; }
        }
      `}</style>
    </nav>
  );
}
