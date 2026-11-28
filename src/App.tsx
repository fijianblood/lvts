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
import MediTrackPage from './pages/MediTrackPage';
import KidsPage from './pages/KidsPage';
import LabviewPage from './pages/LabviewPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import { postById } from './data/blogPosts';
import { canonicalFor, ogImageFor, pageFromPath, routeById } from './data/routes';
import { BASE, hrefFor } from './links';

// three.js is heavy, so the game (Noqublox) loads only when someone opens it.
const HouseHuntPage = lazy(() => import('./pages/HouseHuntPage'));
// LvTS only (not linked anywhere): approve visitors' neighbourhood characters.
const NeighbourhoodAdminPage = lazy(() => import('./pages/NeighbourhoodAdminPage'));
// Neuron Lab and its Learn page load only when someone opens them.
const NeuronLabPage = lazy(() => import('./pages/NeuronLabPage'));
const NeuronLearnPage = lazy(() => import('./pages/NeuronLearnPage'));

// Each page has its own address (/lvts/services/), listed in src/data/routes.ts.
// Links people already shared still use the old # addresses (/lvts/#services):
// move those to the page's real address.
function upgradeOldHashLink() {
  const id = window.location.hash.slice(1);
  if (id && routeById(id) && pageFromPath(window.location.pathname, BASE) === 'home') {
    window.history.replaceState(null, '', hrefFor(id));
  }
}

/** An old address that is now a tab of another page: the page's address, with ?tab=. */
function aliasTarget(id: string): { page: string; path: string } | null {
  const r = routeById(id);
  return r?.aliasOf ? { page: r.aliasOf, path: `${hrefFor(r.aliasOf)}${r.tab ? `?tab=${r.tab}` : ''}` } : null;
}

function currentPage(): string {
  const page = pageFromPath(window.location.pathname, BASE);
  const alias = page ? aliasTarget(page) : null;
  if (alias) {
    window.history.replaceState(null, '', alias.path);
    return alias.page;
  }
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
  setHeadAttr('meta[property="og:image"]', 'content', ogImageFor(id));
  setHeadAttr('meta[name="twitter:image"]', 'content', ogImageFor(id));
  setHeadAttr('meta[property="og:image:alt"]', 'content', route.heading);
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

function PageLoading({ what }: { what: string }) {
  return <div style={{ padding: '160px 1.5rem', textAlign: 'center', color: '#64748b' }}>Loading {what}…</div>;
}

/** The menu icon to light up: blog posts light Blog, the Neuron Lab guide lights Neuron Lab. */
function menuPage(page: string): string {
  if (page.startsWith('post-')) return 'blog';
  if (page === 'neuron-learn') return 'neuron-lab';
  return page;
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
    case 'kids':     return <KidsPage onNav={onNav} />;
    case 'little-chef': return <KidsPage onNav={onNav} />; // old address: currentPage opens the Kids tab
    case 'labview':  return <LabviewPage />;
    case 'tools':    return <ToolsPage />;
    case 'whiteboard': return <ToolsPage />; // removed page: its old address opens Free Tools
    case 'meditrack': return <MediTrackPage />;
    case 'seo':      return <ToolsPage />; // removed page, as above
    case 'ask':      return <AskLvtsPage />;
    case 'ask-old':  return <AskLvtsPage />; // old address: currentPage moves it to /loma/
    case 'neighbours-admin': return <Suspense fallback={null}><NeighbourhoodAdminPage /></Suspense>;
    case 'neuron-lab': return <Suspense fallback={<PageLoading what="Neuron Lab" />}><NeuronLabPage onNav={onNav} /></Suspense>;
    case 'neuron-learn': return <Suspense fallback={<PageLoading what="the guide" />}><NeuronLearnPage onNav={onNav} /></Suspense>;
    case 'blog':     return <BlogPage onNav={onNav} />;
    default: {
      const post = postById(page);
      return post ? <BlogPostPage post={post} onNav={onNav} /> : null;
    }
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
    const alias = aliasTarget(p);
    const path = alias ? alias.path : hrefFor(p);
    if (`${window.location.pathname}${window.location.search}` !== path || window.location.hash) window.history.pushState(null, '', path);
    setPage(alias ? alias.page : p);
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
      <NavBar page={menuPage(page)} onNav={navigate} />
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
