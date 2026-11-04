import type { MouseEvent } from 'react';
import { pathFor } from './data/routes';

/** '/lvts/' on GitHub Pages, '/' on Cloudflare. */
export const BASE = import.meta.env.BASE_URL;

/** The address of one of the site's pages on this host, e.g. '/lvts/services/'. */
export const hrefFor = (id: string) => pathFor(id, BASE);

/**
 * Props for an <a> that goes to one of the site's pages. It is a real link
 * (Google follows it, and right-click / Ctrl-click open a new tab as usual),
 * but a plain click switches page without reloading the site.
 *
 *   <a {...pageLink('services', onNav)}>View Services</a>
 */
export function pageLink(id: string, onNav: (p: string) => void) {
  return {
    href: hrefFor(id),
    onClick: (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      onNav(id);
    },
  };
}
