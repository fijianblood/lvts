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

/** The main address. The Cloudflare copy points search engines here too. */
export const SITE_URL = 'https://fijianblood.github.io/lvts/';

export interface PageRoute {
  /** The page's id inside the app (renderPage in App.tsx, SITE_PAGES). */
  id: string;
  /** Its short name, as in the menu. */
  label: string;
  /** Its address after the site's base path: '' for home, 'services' for /lvts/services/. */
  slug: string;
  /** The <title>: shown in Google's results and the browser tab. */
  title: string;
  /** The meta description: the grey text under the title in Google. */
  description: string;
  /** The heading shown in the page file while the app loads (and to crawlers that don't run JavaScript). */
  heading: string;
  /** false keeps the page out of Google and out of the sitemap. */
  index?: boolean;
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
    title: 'IT Services in Suva: Laptop & PC Repair, CCTV | LvTS',
    description: 'Laptop and PC repair, networking and CCTV, antivirus, printers, email hosting and gas oven servicing from LomaVata Tech Services in Raiwai, Suva.',
    heading: 'IT services in Suva, Fiji',
  },
  {
    id: 'ask', label: 'Ask LvTS', slug: 'ask',
    title: 'Ask LvTS: Free Tech Help Chat | LomaVata Tech Services',
    description: "Chat with Loma, LvTS's free assistant, for quick answers about PC and laptop repairs, Windows 11 problems, prices and our services in Fiji.",
    heading: 'Ask LvTS: free tech help chat',
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
    id: 'kids', label: 'Kids Learn', slug: 'kids',
    title: 'Noqu Vuli: Kids Learning Games in English & iTaukei | LvTS',
    description: 'Free play-and-learn games for young children in Fiji: ABC, numbers, animals, shapes and colours in English and iTaukei. No sign-up, no ads.',
    heading: 'Noqu Vuli: kids learning games in English and iTaukei',
  },
  {
    id: 'tools', label: 'Tools', slug: 'tools',
    title: 'Free Image to PDF, PDF Merge & Photo Sketch Tools | LvTS',
    description: 'Free tools that run in your browser: turn photos (JPEG, HEIC, DNG) into a PDF, merge PDFs, or make a pencil sketch from a photo. Nothing is uploaded.',
    heading: 'Free image to PDF, PDF merge and photo sketch tools',
  },
  {
    id: 'whiteboard', label: 'Whiteboard', slug: 'whiteboard',
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
    id: 'seo', label: 'SEO Tools', slug: 'seo-tools',
    title: 'Free SEO & Website Analysis Tools | LvTS',
    description: 'Free SEO, keyword and website analysis tools in one place, powered by SEOStudio Tools, from LomaVata Tech Services in Suva, Fiji.',
    heading: 'Free SEO and website analysis tools',
  },
  {
    id: 'activation', label: 'Activation', slug: 'activation',
    title: 'Windows & Software Activation Help | LvTS',
    description: 'Help with Windows and software activation: product keys, fixing activation problems, and step-by-step guides from LomaVata Tech Services in Fiji.',
    heading: 'Windows and software activation help',
  },
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

/** The page's main (canonical) address, always on SITE_URL. */
export function canonicalFor(id: string): string {
  const slug = routeById(id)?.slug ?? '';
  return slug ? `${SITE_URL}${slug}/` : SITE_URL;
}

/** Which page an address is for: 'home' for the base path, null when it isn't one of the pages. */
export function pageFromPath(pathname: string, base: string): string | null {
  const b = base.endsWith('/') ? base : `${base}/`;
  if (pathname === b.slice(0, -1) || pathname === b || pathname === `${b}index.html`) return 'home';
  if (!pathname.startsWith(b)) return null;
  const rest = pathname.slice(b.length).replace(/\/index\.html$/, '').replace(/\/+$/, '');
  if (!rest || rest.includes('/')) return null;
  return ROUTES.find((r) => r.slug === rest)?.id ?? null;
}
