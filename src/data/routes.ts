// Every page's own web address, and what Google shows for it.
//
// Pages used to be #hash links (fijianblood.github.io/lvts/#services), but
// Google ignores everything after the #, so only the home page could ever be
// found. Each page now has a real address (fijianblood.github.io/lvts/services/).
//
// This file is plain data with no React, because two things read it:
//  - the app (src/App.tsx) to switch pages and update the tab title, and
//  - the build (vite.config.ts) to write one HTML file per page, each with its
//    own title, description and canonical address, plus sitemap.xml.
//
// To add a page: add it here, in SITE_PAGES (src/data/sitePages.ts) for the
// menu, and in renderPage (src/App.tsx). Keep titles to about 60 characters and
// descriptions to about 155: Google cuts off anything longer.

import { BLOG_POSTS } from './blogPosts.ts';

/** The main address. The Cloudflare copy points search engines here too. */
export const SITE_URL = 'https://fijianblood.github.io/lvts/';

export interface PageRoute {
  /** The page's id inside the app (renderPage in App.tsx, SITE_PAGES). */
  id: string;
  /** Its short name, as in the menu. */
  label: string;
  /** Its address after the site's base path: '' for home, 'services' for /lvts/services/, 'blog/<post>' for a blog post, 'neuron-lab/learn' for a page under another. */
  slug: string;
  /** The <title>: shown in Google's results and the browser tab. */
  title: string;
  /** The meta description: the grey text under the title in Google. */
  description: string;
  /** The heading shown in the page file while the app loads (and to crawlers that don't run JavaScript). */
  heading: string;
  /** false keeps the page out of Google and out of the sitemap. */
  index?: boolean;
  /**
   * An old address that now opens another page, or a tab of it (e.g. /little-chef/ opens
   * the Little Chef tab of Kids; the removed /whiteboard/ and /seo-tools/ open Free Tools).
   * It keeps working for shared links, points Google at that page (canonical), shares its
   * preview image and isn't in the sitemap.
   */
  aliasOf?: string;
  /** The tab it opens on that page, if any. */
  tab?: string;
}

export const ROUTES: PageRoute[] = [
  {
    id: 'home', label: 'Home', slug: '',
    title: 'LomaVata Tech Services | Explore. Learn. Play. Connect.',
    description: 'Discover LvTS, technology built in Fiji: walk Raiwai in 3D in Noqublox, learn with Noqu Vuli in English and iTaukei, and get IT and web services.',
    heading: 'Discover LvTS: technology brings us together. Explore, learn, play and connect, from Raiwai, Suva, Fiji',
  },
  {
    id: 'services', label: 'Services', slug: 'services',
    title: 'PS5 Cleaning & Liquid Metal Service in Suva, Fiji | LvTS',
    description: 'PS5 overheating, shutting down or loud? LvTS in Raiwai, Suva does a full teardown, deep dust clean and fresh liquid metal. Plus PC repair and IT services.',
    heading: 'PS5 overheating, shutting down or loud like a jet engine? PS5 service in Suva, Fiji',
  },
  {
    id: 'ask', label: 'Loma', slug: 'loma',
    title: 'Loma: Free AI Tech Help Chat for Fiji | LvTS',
    description: "Chat with Loma, LvTS's free AI assistant: ask about PC and laptop problems, Windows, prices and services, or attach a photo, PDF or document.",
    heading: 'Loma: free AI tech help chat',
  },
  {
    // The page's old address (Ask LvTS): opens Loma.
    id: 'ask-old', label: 'Ask LvTS', slug: 'ask', aliasOf: 'ask',
    title: 'Ask LvTS is now Loma | LvTS',
    description: "Ask LvTS is now Loma, LvTS's free AI assistant for tech help in Fiji. Ask a question or attach a photo, PDF or document.",
    heading: 'Ask LvTS is now Loma',
  },
  {
    id: 'rewards', label: 'Rewards', slug: 'rewards',
    title: 'LomaVata Rewards: Prize Draws in Fiji | LvTS',
    description: 'LomaVata Rewards: buy an entry or a monthly membership with M-PAiSA or MyCash for weekly grocery and fuel voucher draws and a monthly Mega Draw.',
    heading: 'LomaVata Rewards',
  },
  {
    id: 'house', label: 'Noqublox', slug: 'noqublox',
    title: 'Noqublox: Explore Raiwai, Suva in 3D | Free Browser Game',
    description: "Noqublox is LvTS's free 3D world of Raiwai, Suva, played in your browser. Explore the neighbourhood with others online and hunt for hidden tech parts.",
    heading: 'Noqublox: explore Raiwai, Suva in 3D',
  },
  {
    id: 'kids', label: 'Kids', slug: 'kids',
    title: 'Free Kids Learning Games in English & iTaukei | LvTS',
    description: 'Two free games for young children in Fiji: Noqu Vuli (ABC, numbers, animals, shapes) and Little Chef pretend cooking, in English and iTaukei. No ads.',
    heading: 'Free kids learning games in English and iTaukei: Noqu Vuli and Little Chef',
  },
  {
    id: 'little-chef', label: 'Little Chef', slug: 'little-chef', aliasOf: 'kids', tab: 'little-chef',
    title: 'Little Chef Fiji: Pretend Cooking Game for Kids | LvTS',
    description: 'A free pretend-cooking game for young children in Fiji: make a tropical fruit salad and learn fruit names, colours and counting in English and iTaukei.',
    heading: 'Little Chef Fiji: pretend cooking for kids',
  },
  {
    id: 'labview', label: 'LabVIEW Help', slug: 'labview',
    title: 'LabVIEW Project Help for University Students in Fiji | LvTS',
    description: 'One-to-one LabVIEW tutoring for university students in Fiji: NI DAQ with NI-DAQmx, Arduino with NI-VISA, debugging VIs and finishing your project.',
    heading: 'LabVIEW project help for university students in Fiji',
  },
  {
    id: 'neuron-lab', label: 'Neuron Lab', slug: 'neuron-lab',
    title: 'Neuron Lab: See How AI Learns, One Neuron at a Time | LvTS',
    description: 'Watch one artificial neuron learn AND and OR in your browser. Move its weights, press teach and see how AI learns, in plain words. Free, from LvTS in Suva.',
    heading: 'Neuron Lab: watch one artificial neuron learn',
  },
  {
    // The Neuron Lab's "Learn more" notes, linked from the Neuron Lab page (not in the menu).
    id: 'neuron-learn', label: 'How AI Learns', slug: 'neuron-lab/learn',
    title: 'How AI Learns: From One Neuron to Chatbots | LvTS',
    description: 'A plain-language guide to AI: how it began in 1943, how one neuron works and learns, why layers matter, how chatbots are made and how to start learning AI.',
    heading: 'How AI learns: from one neuron to chatbots',
  },
  {
    id: 'tools', label: 'Free Tools', slug: 'tools',
    title: 'Free Image to PDF, PDF Merge & Photo Sketch Tools | LvTS',
    description: 'Free tools: photos (JPEG, HEIC, DNG) to PDF, PDF merge and pencil sketch, all in your browser, plus a free YouTube downloader that runs on Google Colab.',
    heading: 'Free image to PDF, PDF merge, photo sketch and YouTube downloader tools',
  },
  {
    id: 'whiteboard', label: 'Whiteboard', slug: 'whiteboard', aliasOf: 'tools',
    title: 'Free Online Whiteboard | LomaVata Tech Services',
    description: 'A free online whiteboard for sketching diagrams and jotting notes right in your browser, from LomaVata Tech Services in Suva, Fiji.',
    heading: 'Free online whiteboard',
  },
  {
    id: 'meditrack', label: 'MediTrack', slug: 'meditrack',
    title: 'MediTrack: Private Health Dashboard | LvTS',
    description: 'Track blood pressure, test results, appointments and medical history in a private dashboard that stays on your device. Nothing is uploaded.',
    heading: 'MediTrack: a private health dashboard',
  },
  {
    id: 'seo', label: 'SEO Tools', slug: 'seo-tools', aliasOf: 'tools',
    title: 'Free SEO & Website Analysis Tools | LvTS',
    description: 'Free SEO, keyword and website analysis tools in one place, powered by SEOStudio Tools, from LomaVata Tech Services in Suva, Fiji.',
    heading: 'Free SEO and website analysis tools',
  },
  {
    id: 'blog', label: 'Blog', slug: 'blog',
    title: 'LvTS Blog: Tech Tips, Security and IT News for Fiji',
    description: 'Practical tech articles from LomaVata Tech Services in Suva: PC security, Windows fixes, websites, networking and technology news for Fiji and the Pacific.',
    heading: 'LvTS Blog: tech tips, security and IT news for Fiji',
  },
  // One page per blog post (src/data/blogPosts.ts), at /blog/<slug>/.
  ...BLOG_POSTS.map((p): PageRoute => ({
    id: `post-${p.slug}`, label: p.title, slug: `blog/${p.slug}`,
    title: p.seoTitle, description: p.description, heading: p.title,
  })),
  {
    // LvTS only: approve visitors' neighbourhood characters. Not linked anywhere.
    id: 'neighbours-admin', label: 'Admin', slug: 'neighbours-admin', index: false,
    title: 'Neighbourhood admin | LvTS',
    description: 'LvTS admin page.',
    heading: 'Neighbourhood admin',
  },
];

export const routeById = (id: string): PageRoute | undefined => ROUTES.find((r) => r.id === id);

/** The page's path on this host, e.g. pathFor('services', '/lvts/') is '/lvts/services/'. */
export function pathFor(id: string, base: string): string {
  const slug = routeById(id)?.slug ?? '';
  return slug ? `${base}${slug}/` : base;
}

/** The page's main (canonical) address, always on SITE_URL. An old alias address points at its page. */
export function canonicalFor(id: string): string {
  const r = routeById(id);
  if (r?.aliasOf) return canonicalFor(r.aliasOf);
  const slug = r?.slug ?? '';
  return slug ? `${SITE_URL}${slug}/` : SITE_URL;
}

/** The page's own link-preview image (public/og/<id>.jpg, made by tools/og/make_og.py). */
export function ogImageFor(id: string): string {
  const r = routeById(id);
  return `${SITE_URL}og/${r?.aliasOf ?? id}.jpg`;
}

/** Pages that belong in Google's index and the sitemap: not hidden, not an old alias. */
export const LISTED_ROUTES: PageRoute[] = ROUTES.filter((r) => r.index !== false && !r.aliasOf);

/** Which page an address is for: 'home' for the base path, null when it isn't one of the pages. */
export function pageFromPath(pathname: string, base: string): string | null {
  const b = base.endsWith('/') ? base : `${base}/`;
  if (pathname === b.slice(0, -1) || pathname === b || pathname === `${b}index.html`) return 'home';
  if (!pathname.startsWith(b)) return null;
  const rest = pathname.slice(b.length).replace(/\/index\.html$/, '').replace(/\/+$/, '');
  if (!rest) return null;
  return ROUTES.find((r) => r.slug === rest)?.id ?? null;
}
