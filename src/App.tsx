import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './index.css';
import NavBar from './components/NavBar';
import CompetitionBanner from './components/CompetitionBanner';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import WebsitePage from './pages/WebsitePage';
import ThreeDPage from './pages/ThreeDPage';
import RewardsPage from './pages/RewardsPage';
import RangerPage from './pages/RangerPage';
import ContactPage from './pages/ContactPage';
import PlayPage from './pages/PlayPage';
import ToolsPage from './pages/ToolsPage';
import AskLvtsPage from './pages/AskLvtsPage';
import ChatWidget from './components/ChatWidget';
import WhiteboardPage from './pages/WhiteboardPage';
import MediTrackPage from './pages/MediTrackPage';
import SeoToolsPage from './pages/SeoToolsPage';
import NetworkDiagramPage from './pages/NetworkDiagramPage';

const VALID_PAGES = ['home', 'services', 'website', 'threed', 'rewards', 'ranger', 'play', 'tools', 'whiteboard', 'meditrack', 'seo', 'network', 'ask', 'contact'];

function initialPage() {
  const hash = window.location.hash.replace('#', '');
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

function renderPage(page: string, onNav: (p: string) => void) {
  switch (page) {
    case 'home':     return <HomePage     onNav={onNav} />;
    case 'services': return <ServicesPage onNav={onNav} />;
    case 'website':  return <WebsitePage  onNav={onNav} />;
    case 'threed':   return <ThreeDPage   onNav={onNav} />;
    case 'rewards':  return <RewardsPage  onNav={onNav} />;
    case 'ranger':   return <RangerPage />;
    case 'play':     return <PlayPage />;
    case 'tools':    return <ToolsPage />;
    case 'whiteboard': return <WhiteboardPage />;
    case 'meditrack': return <MediTrackPage onNav={onNav} />;
    case 'seo':      return <SeoToolsPage />;
    case 'network':  return <NetworkDiagramPage onNav={onNav} />;
    case 'ask':      return <AskLvtsPage />;
    case 'contact':  return <ContactPage />;
    default:         return null;
  }
}

// Apple's UINavigationController easing curve — gives page swaps an iOS "push" feel.
const IOS_EASE: [number, number, number, number] = [0.32, 0.72, 0, 1];

export default function App() {
  const [page, setPage] = useState(initialPage);
  const reduceMotion = useReducedMotion();

  const navigate = useCallback((p: string) => {
    if (window.location.hash !== `#${p}`) window.location.hash = p;
    setPage(p);
  }, []);

  useEffect(() => {
    function onHashChange() {
      setPage(initialPage());
    }
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return (
    <>
      <CompetitionBanner onNav={navigate} />
      <NavBar page={page} onNav={navigate} />
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <motion.div
          key={page}
          initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, scale: 0.97, y: -12 }}
          transition={{ duration: 0.32, ease: IOS_EASE }}
        >
          {renderPage(page, navigate)}
        </motion.div>
      </AnimatePresence>
      <Footer />
      <ChatWidget page={page} />
    </>
  );
}
