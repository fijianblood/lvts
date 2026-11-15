// The LvTS blog: one entry per post, newest first.
//
// Plain data with no React, because the build (vite.config.ts, through routes.ts)
// reads it to write each post's own page file and sitemap entry.
//
// To add a post:
//  1. Write it in Markdown at src/blog/posts/<slug>.md (no title line: the page
//     shows the title from here).
//  2. Add an entry at the TOP of BLOG_POSTS with the same slug.
// Keep titles to about 60 characters (with " | LvTS") and descriptions to 70-160.

export interface BlogPost {
  /** The post's address after /blog/, and its Markdown file name. Lower case and hyphens. */
  slug: string;
  /** The heading on the page. */
  title: string;
  /** The <title> Google shows. Ends with " | LvTS". */
  seoTitle: string;
  /** The grey text under the title in Google, and the summary on the blog page. */
  description: string;
  /** Publication date, YYYY-MM-DD. */
  date: string;
  author: string;
  /** Short topic labels shown on the post card. */
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'windows-activators-risks',
    title: 'Windows activation scripts: how they work, and the risks the tutorials don’t mention',
    seoTitle: 'Windows Activators Explained: the Real Risks | LvTS',
    description: 'What Windows activation tools like MAS really do, how they spread online, the fake copies that carried malware, and affordable ways to go genuine in Fiji.',
    date: '2026-11-15',
    author: 'Josese Sahib',
    tags: ['Security', 'Windows', 'Licensing'],
  },
  {
    slug: 'cracked-software-malware',
    title: '“Free” cracked software can empty your bank account. Here’s how to check your PC',
    seoTitle: 'Cracked Software Malware: Check and Clean Your PC | LvTS',
    description: 'How cracked software hides malware inside trusted programs, the warning signs, what to do straight away, and how technicians find and remove it.',
    date: '2026-11-15',
    author: 'Josese Sahib',
    tags: ['Security', 'Windows', 'Malware'],
  },
];

export const postById = (id: string): BlogPost | undefined =>
  BLOG_POSTS.find((p) => `post-${p.slug}` === id);
