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
import KidsLearnPage from './pages/KidsLearnPage';
import { canonicalFor, pageFromPath, routeById } from './data/routes';
import { BASE, hrefFor } from './links';

// three.js is heavy, so the game (Noqublox) loads only when someone opens it.
const HouseHuntPage = lazy(() => import('./pages/HouseHuntPage'));
// LvTS only (not linked anywhere): approve visitors' neighbourhood characters.
const NeighbourhoodAdminPage = lazy(() => import('./pages/NeighbourhoodAdminPage'));

// Each page has its own address (/lvts/services/), listed in src/data/routes.ts.
// Links people already shared still use the old # addresses (/lvts/#services):
// move those to the page's real address.
function upgradeOldHashLink() {
  const id = window.location.hash.slice(1);
  if (id && routeById(id) && pageFromPath(window.location.pathname, BASE) === 'home') {
    window.history.replaceState(null, '', hrefFor(id));
  }
}

function currentPage(): string {
  const page = pageFromPath(window.location.pathname, BASE);
  if (page) return page;
  // Not one of the pages (an old or mistyped address): show the home page at the home address.
  window.history.replaceState(null, '', BASE);
  return 'home';
}

function setHeadAttr(selector: string, attr: string, value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

/** Keeps the tab title, description and canonical address in step with the page on screen. */
function applyPageHead(id: string) {
  const route = routeById(id);
  if (!route) return;
  const url = canonicalFor(id);
  document.title = route.title;
  setHeadAttr('meta[name="description"]', 'content', route.description);
  setHeadAttr('link[rel="canonical"]', 'href', url);
  setHeadAttr('meta[property="og:url"]', 'content', url);
  setHeadAttr('meta[property="og:title"]', 'content', route.title);
  setHeadAttr('meta[property="og:description"]', 'content', route.description);
  setHeadAttr('meta[name="twitter:title"]', 'content', route.title);
  setHeadAttr('meta[name="twitter:description"]', 'content', route.description);
  let robots = document.head.querySelector('meta[name="robots"]');
  if (route.index === false) {
    if (!robots) {
      robots = document.createElement('meta');
      robots.setAttribute('name', 'robots');
      document.head.appendChild(robots);
    }
    robots.setAttribute('content', 'noindex');
  } else {
    robots?.remove();
  }
}

function renderPage(page: string, onNav: (p: string) => void) {
  switch (page) {
    case 'home':     return <HomePage     onNav={onNav} />;
    case 'services': return <ServicesPage />;
    case 'rewards':  return <RewardsPage />;
    case 'house':    return (
      <Suspense fallback={<div style={{ padding: '160px 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading Noqublox…</div>}>
        <HouseHuntPage onNav={onNav} />
      </Suspense>
    );
    case 'kids':     return <KidsLearnPage onNav={onNav} />;
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
  const [page, setPage] = useState(() => {
    upgradeOldHashLink();
    return currentPage();
  });
  const reduceMotion = useReducedMotion();

  const navigate = useCallback((p: string) => {
    const path = hrefFor(p);
    if (window.location.pathname !== path || window.location.hash) window.history.pushState(null, '', path);
    setPage(p);
  }, []);

  // The browser's back and forward buttons (and someone typing an old # link).
  useEffect(() => {
    function onAddressChange() {
      upgradeOldHashLink();
      setPage(currentPage());
    }
    window.addEventListener('popstate', onAddressChange);
    window.addEventListener('hashchange', onAddressChange);
    return () => {
      window.removeEventListener('popstate', onAddressChange);
      window.removeEventListener('hashchange', onAddressChange);
    };
  }, []);

  useEffect(() => { applyPageHead(page); }, [page]);

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
