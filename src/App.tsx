import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import './index.css';
import NavBar from './components/NavBar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import RewardsPage from './pages/RewardsPage';
import ToolsPage from './pages/ToolsPage';
import AskLvtsPage from './pages/AskLvtsPage';
import ChatWidget from './components/ChatWidget';
import WhiteboardPage from './pages/WhiteboardPage';
import MediTrackPage from './pages/MediTrackPage';
import SeoToolsPage from './pages/SeoToolsPage';
import NetworkDiagramPage from './pages/NetworkDiagramPage';
import ActivationHelpPage from './pages/ActivationHelpPage';

// three.js is heavy, so the game (Noqublox) loads only when someone opens it.
const HouseHuntPage = lazy(() => import('./pages/HouseHuntPage'));
// LvTS only (not linked anywhere): approve visitors' neighbourhood characters.
const NeighbourhoodAdminPage = lazy(() => import('./pages/NeighbourhoodAdminPage'));

const VALID_PAGES = ['home', 'services', 'rewards', 'house', 'tools', 'whiteboard', 'meditrack', 'seo', 'network', 'ask', 'activation', 'neighbours-admin'];

function initialPage() {
  const hash = window.location.hash.replace('#', '');
  return VALID_PAGES.includes(hash) ? hash : 'home';
}

function renderPage(page: string, onNav: (p: string) => void) {
  switch (page) {
    case 'home':     return <HomePage     onNav={onNav} />;
    case 'services': return <ServicesPage />;
    case 'rewards':  return <RewardsPage />;
    case 'house':    return (
      <Suspense fallback={<div style={{ padding: '160px 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading Noqublox…</div>}>
        <HouseHuntPage />
      </Suspense>
    );
    case 'tools':    return <ToolsPage />;
    case 'whiteboard': return <WhiteboardPage />;
    case 'meditrack': return <MediTrackPage />;
    case 'seo':      return <SeoToolsPage />;
    case 'network':  return <NetworkDiagramPage />;
    case 'ask':      return <AskLvtsPage />;
    case 'activation': return <ActivationHelpPage />;
    case 'neighbours-admin': return <Suspense fallback={null}><NeighbourhoodAdminPage /></Suspense>;
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
