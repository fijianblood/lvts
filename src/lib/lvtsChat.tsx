import { LVTS_KNOWLEDGE } from '../data/lvtsKnowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  streaming?: boolean;
}

export const WHATSAPP_URL = 'https://wa.me/6797466941';

export const WELCOME =
  "Bula! I'm **Loma** 🌺 Welcome to LomaVata Tech Services. Whether you need IT support, a website, or just have a question — I'm here. What can I help you with?\n\n" +
  "*Ni Bula vinaka mai Lomavata Tech Services. Ke o ni gadreva na veivuke ni IT, na i vola mata ni nomu kabani, se dua na vakatataro — keitou sa tiko qoi. Meu na vukei kemuni e na cava nikua?*";

export const NO_MATCH =
  "I don't have a canned answer for that one yet — [tap here to chat with us directly on WhatsApp](" + WHATSAPP_URL + "), or call LvTS on **833 1088 / 746 6941**.";

export const SUGGESTED_PROMPTS = [
  'My Wi-Fi is not connecting',
  'How much for a laptop repair?',
  'Do you build websites?',
  'Where can I buy from your store?',
  'My PC is really slow',
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function hasWord(text: string, word: string): boolean {
  return new RegExp(`\\b${escapeRegex(word)}\\b`).test(text);
}

function hasKeyword(text: string, keyword: string): boolean {
  const words = keyword.split(' ');
  // Single words need a word-boundary check — otherwise short keywords like
  // "hi" would match inside "th_is_", "wh_i_te", "n_i_ght", etc.
  if (words.length === 1) return hasWord(text, keyword);
  // Multi-word phrases match if every word is present anywhere in the input
  // (not necessarily adjacent) — natural phrasing constantly inserts filler
  // words ("is", "my", "the") that would break an exact-phrase substring
  // check, e.g. "start menu not opening" vs "my start menu is not opening".
  return words.every(w => hasWord(text, w));
}

export function findAnswer(input: string): string {
  const text = input.toLowerCase();
  let best: { score: number; answer: string } | null = null;
  for (const entry of LVTS_KNOWLEDGE) {
    let score = 0;
    for (const kw of entry.keywords) {
      if (hasKeyword(text, kw)) score += kw.split(' ').length;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: entry.answer };
  }
  return best ? best.answer : NO_MATCH;
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const markdownComponents = {
  p: (props: React.ComponentProps<'p'>) => <p style={{ margin: '0 0 0.5em' }} {...props} />,
  ul: (props: React.ComponentProps<'ul'>) => <ul style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }} {...props} />,
  ol: (props: React.ComponentProps<'ol'>) => <ol style={{ margin: '0 0 0.5em', paddingLeft: '1.2em' }} {...props} />,
  li: (props: React.ComponentProps<'li'>) => <li style={{ margin: '0.15em 0' }} {...props} />,
  a: (props: React.ComponentProps<'a'>) => (
    <a {...props} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => <strong style={{ fontWeight: 700 }} {...props} />,
  code: (props: React.ComponentProps<'code'>) => (
    <code style={{ background: 'rgba(15,23,42,0.06)', borderRadius: 4, padding: '0.1em 0.35em', fontSize: '0.85em', fontFamily: 'monospace' }} {...props} />
  ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: 8, padding: '0.6em 0.8em', margin: '0.4em 0', overflowX: 'auto', fontSize: '0.82em' }} {...props} />
  ),
};
