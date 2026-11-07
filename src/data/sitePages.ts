import type { ComponentType } from 'react';
import {
  IconTool, IconGift,
  IconHammer, IconChalkboard, IconHeartbeat, IconSeo, IconMessageCircle,
  IconKey, IconHomeSearch, IconAbc,
} from '@tabler/icons-react';

export interface SitePage {
  id: string;
  label: string;
  icon?: ComponentType<{ size?: number; color?: string; stroke?: number }>;
  color: string;
  blurb: string;
}

export const SITE_PAGES: SitePage[] = [
  { id: 'home', label: 'Home', color: '#2563eb',
    blurb: 'The main landing page — an overview of LomaVata Tech Services, skills, certifications, and tech tips.' },
  { id: 'house', label: 'Noqublox', icon: IconHomeSearch, color: '#f59e0b',
    blurb: 'Noqublox ("noqu" is iTaukei for "my"): a virtual universe of places in Fiji, made by LvTS and played in your web browser. Right now it is Raiwai, by USP and around the blocks — a 3D walk-through of a Suva family home and its yard: play as a member of the family, find 12 hidden tech parts, hunt the Golden Chip and get out through the front gate. During prize rounds the win screen shows a secret code to claim a cash prize paid by M-PAiSA. Visitors can create their own character and explore the neighbourhood together with everyone else online (one shared world with filtered chat): McFarlane Road and its shops, Garden City, Damodar City, the temple, the masjid and the USP campus.' },
  { id: 'kids', label: 'Kids Learn', icon: IconAbc, color: '#6d4aff',
    blurb: 'Noqu Vuli: a free play-and-learn game for young children in Fiji. ABC, counting 1 to 10, animals and their sounds, shapes and colours, in English and iTaukei, with a daily challenge, stars and a sticker book. Questions are read out loud. No sign-up; progress stays on the device.' },
  { id: 'ask', label: 'Ask LvTS', icon: IconMessageCircle, color: '#6366f1',
    blurb: 'Chat with Loma, a free instant-answer assistant for repairs, Windows 11 troubleshooting, pricing, and general site questions.' },
  { id: 'services', label: 'Services', icon: IconTool, color: '#2563eb',
    blurb: 'An overview of everything LomaVata Tech Services offers across Fiji — PC/laptop repair, gas oven servicing, networking/CCTV, antivirus, printers, email hosting, and the Vitikart store.' },
  { id: 'rewards', label: 'Rewards', icon: IconGift, color: '#f59e0b',
    blurb: 'LomaVata Rewards — a Fiji prize-draw loyalty program. Buy an entry or monthly membership via M-PAiSA/My Cash for weekly draws and a monthly Mega Draw.' },
  { id: 'tools', label: 'Tools', icon: IconHammer, color: '#f97316',
    blurb: 'Free browser-based tools: an image-to-PDF converter, a PDF merger, and a photo-to-pencil-sketch maker — supports JPEG/HEIC/DNG uploads, and nothing is uploaded.' },
  { id: 'whiteboard', label: 'Whiteboard', icon: IconChalkboard, color: '#0891b2',
    blurb: 'A free embedded collaborative whiteboard (powered by Excalidraw) for sketching diagrams or jotting notes right in the browser.' },
  { id: 'meditrack', label: 'MediTrack', icon: IconHeartbeat, color: '#c1443b',
    blurb: 'A private, device-only health dashboard for blood pressure trends, test results, appointments, and medical history — nothing uploads.' },
  { id: 'seo', label: 'SEO Tools', icon: IconSeo, color: '#2563eb',
    blurb: 'A free embedded suite of SEO, keyword, and website-analysis tools, powered by SEOStudio Tools.' },
  { id: 'activation', label: 'Activation', icon: IconKey, color: '#8b5cf6',
    blurb: 'Help with Windows and software activation — keys, troubleshooting, and guides.' },

];
