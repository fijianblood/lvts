import { BookOpen, ChefHat } from 'lucide-react';
import PageTabs from '../components/PageTabs';
import KidsLearnPage from './KidsLearnPage';
import LittleChefPage from './LittleChefPage';

// Kids: Noqu Vuli and Little Chef Fiji on one page. The old /little-chef/ address opens its tab here.

export default function KidsPage({ onNav }: { onNav: (p: string) => void }) {
  return (
    <div style={{ paddingTop: 110 }}>
      <header style={{ maxWidth: 760, margin: '0 auto 1.75rem', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6d4aff', marginBottom: '0.75rem' }}>
          Kids · English + iTaukei · Free
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, margin: '0 0 1rem' }}>
          Play and <span className="grad-text">learn</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, margin: 0 }}>
          Two free games for young children in Fiji, with words read out loud in English and iTaukei. No sign-up and no ads, and progress stays on your device.
        </p>
      </header>
      <PageTabs label="Kids games" accent="#6d4aff" tabs={[
        { id: 'noqu-vuli', label: 'Noqu Vuli', icon: <BookOpen size={17} />, render: () => <KidsLearnPage onNav={onNav} embedded /> },
        { id: 'little-chef', label: 'Little Chef', icon: <ChefHat size={17} />, render: () => <LittleChefPage onNav={onNav} embedded /> },
      ]} />
    </div>
  );
}
