interface Rule {
  keywords: string[];
  reply: string;
}

// Order matters — first matching rule wins, so more specific topics come first.
const RULES: Rule[] = [
  {
    keywords: ['3d', 'three d', '3-d', 'animation', 'animated', 'interactive site'],
    reply: "3D websites start from FJD $150 for a single animated section (Add-On), or FJD $600 for a full 3D build with multiple sections — interactive heroes, product viewers, virtual showrooms, that kind of thing. Check out the 3D Sites page for the full breakdown.",
  },
  {
    keywords: ['website', 'web design', 'web dev', 'landing page', 'e-commerce', 'ecommerce', 'domain', 'hosting'],
    reply: "Web design packages: Basic FJD $25 (landing page, 1–2 days), Standard FJD $280 (up to 5 pages, most popular), Premium FJD $1,800 (up to 10 pages + e-commerce). Full stack — React, Next.js, Node, PHP, you name it. See the Website page for details.",
  },
  {
    keywords: ['reward', 'rewards', 'prize', 'draw', 'giveaway', 'win', 'lottery'],
    reply: "LomaVata Rewards is a loyalty prize draw launching soon — Single Entry is FJD $10, or FJD $25/month for a Monthly Membership covering every weekly draw plus the Mega Draw. Payments go through M-PAiSA or MyCash. Sign-ups aren't open yet, but you can register your interest on the Rewards page.",
  },
  {
    keywords: ['tool', 'tools', 'pdf', 'convert', 'merge', 'heic'],
    reply: "The Tools page has two free browser-based tools: an Image → PDF converter and a PDF merge tool. Everything runs locally in your browser — nothing gets uploaded anywhere.",
  },
  {
    keywords: ['meditrack', 'blood pressure', 'medical history', 'health dashboard'],
    reply: "MediTrack Fiji is a free personal health dashboard — track blood pressure trends, blood results, and doctor's appointments. Everything's stored only on your device, nothing gets uploaded.",
  },
  {
    keywords: ['live tv', 'watch tv', 'channel', 'stream', 'iptv'],
    reply: "The Live TV page streams thousands of free-to-air channels, powered by the open iptv-org directory — every link is manually tested and dead ones get pulled.",
  },
  {
    keywords: ['ranger', 'ford', 'truck', 'vehicle', '4x4'],
    reply: "The Ranger XL page is a personal project — a service-log dashboard for Joe's 2024 Ford Ranger, built to show off what LomaVata Tech Services can build for you. Sites like it start from about $5/month.",
  },
  {
    keywords: ['repair', 'laptop', 'pc', 'computer', 'screen', 'virus', 'malware', 'slow', 'broken', 'fix', 'printer'],
    reply: "PC & laptop repairs start from FJD $25, with an upfront quote and no hidden fees — any brand (Dell, HP, Acer, ASUS, Toshiba, Apple). Joe also handles virus/malware removal, OS installs, screen replacements, and printer/peripheral setup. Check the Services page for the full list, or hit Contact to book one in.",
  },
  {
    keywords: ['price', 'prices', 'cost', 'how much', 'quote', 'fee', 'fees'],
    reply: "Pricing depends on the service — repairs start from $25, websites from $25 to $1,800 depending on the package, and 3D sites from $150. Want specifics on a particular service?",
  },
  {
    keywords: ['contact', 'phone', 'number', 'email', 'call', 'address', 'where', 'located', 'location', 'whatsapp'],
    reply: "You can reach LomaVata Tech Services on 📞 8331088 / 7466941, ✉️ lomavatatechfiji@gmail.com — based in Raiwai, Suva, Fiji. Or head straight to the Contact page to send a repair request.",
  },
  {
    keywords: ['who are you', 'what are you', 'are you real', 'are you human', 'are you ai', 'chatbot', 'robot'],
    reply: "I'm a virtual assistant for LomaVata Tech Services — built to answer quick questions about services, pricing, and the site. I'm not a live person, but I can point you in the right direction. For anything I can't handle, Joe's just a message away on the Contact page.",
  },
  {
    keywords: ['who is joe', 'about you', 'experience', 'how long', 'josese', 'founder', 'owner'],
    reply: "Josese \"Joe\" Sahib runs LomaVata Tech Services out of Raiwai, Suva. He's got 8+ years as an IT pre-sales consultant working with government departments and SMEs across Fiji, plus certifications in Software Development and System Administration from LinkedIn Learning.",
  },
  {
    keywords: ['thank', 'thanks', 'vinaka', 'cheers'],
    reply: "Vinaka vakalevu! 🙏 Anything else I can help with?",
  },
  {
    keywords: ['bye', 'goodbye', 'see you', 'moce', 'later'],
    reply: "Moce! Feel free to come back anytime, or head to the Contact page to reach Joe directly. 👋",
  },
  {
    keywords: ['bula', 'hello', 'hi', 'hey', 'kia ora', 'good morning', 'good afternoon', 'good evening'],
    reply: "Bula! 👋 I'm the LvTS virtual assistant. Ask me about repairs, web design, pricing, rewards, or how to reach Joe — happy to help.",
  },
];

const FALLBACK =
  "That's a bit outside what I know for sure! For anything specific, the best move is reaching out directly — 📞 8331088 / 7466941 or via the Contact page, and Joe will sort you out.";

function hasKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(' ')) return text.includes(keyword);
  return new RegExp(`\\b${keyword}\\b`, 'i').test(text);
}

export function getBotReply(input: string): string {
  const text = input.trim().toLowerCase();
  if (!text) return FALLBACK;

  for (const rule of RULES) {
    if (rule.keywords.some(k => hasKeyword(text, k))) return rule.reply;
  }
  return FALLBACK;
}

export const SUGGESTED_PROMPTS = [
  'How much for a laptop repair?',
  'What does a website cost?',
  'Tell me about LomaVata Rewards',
  'How do I contact Joe?',
];
