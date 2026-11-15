import type { ComponentType } from 'react';
import {
  IconTool, IconGift,
  IconHammer, IconHeartbeat, IconMessageCircle,
  IconKey, IconHomeSearch, IconAbc, IconCpu, IconNews,
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
  { id: 'kids', label: 'Kids', icon: IconAbc, color: '#6d4aff',
    blurb: 'Two free games for young children in Fiji, in English and iTaukei: Noqu Vuli (ABC, counting 1 to 10, animals and their sounds, shapes and colours, with a daily challenge, stars and a sticker book) and Little Chef Fiji (pretend cooking for ages 3 to 5). Words are read out loud. No sign-up or ads; progress stays on the device.' },
  { id: 'ask', label: 'Loma', icon: IconMessageCircle, color: '#6366f1',
    blurb: 'Loma, the free LvTS AI assistant: ask about repairs, Windows 11 problems, prices and services, or attach a photo, screenshot, PDF, Word, Excel or text file and ask about it.' },
  { id: 'services', label: 'Services', icon: IconTool, color: '#2563eb',
    blurb: 'PS5 service in Raiwai, Suva: full teardown, deep dust clean and fresh liquid metal for overheating, loud or shutting-down consoles. Also PC and laptop repair, website design, networking, antivirus, printers, email hosting, gas ovens and Vitikart store setup.' },
  { id: 'blog', label: 'Blog', icon: IconNews, color: '#0ea5e9',
    blurb: 'The LvTS Blog: practical articles on PC security, Windows fixes, websites, networking and technology news for Fiji and the Pacific.' },
  { id: 'labview', label: 'LabVIEW Help', icon: IconCpu, color: '#f5a524',
    blurb: 'LabVIEW project help for university students: one-to-one tutoring in Raiwai, Suva or online. Debugging VIs, Arduino control over NI-VISA, state machines, data logging and web control. Students build their own project; LvTS coaches them.' },
  { id: 'rewards', label: 'Rewards', icon: IconGift, color: '#f59e0b',
    blurb: 'LomaVata Rewards — a Fiji prize-draw loyalty program. Buy an entry or monthly membership via M-PAiSA/My Cash for weekly draws and a monthly Mega Draw.' },
  { id: 'tools', label: 'Free Tools', icon: IconHammer, color: '#f97316',
    blurb: 'Free browser tools: an image-to-PDF converter (JPEG, HEIC, DNG), a PDF merger and a photo-to-pencil-sketch maker. Your files are never uploaded.' },
  { id: 'meditrack', label: 'MediTrack', icon: IconHeartbeat, color: '#c1443b',
    blurb: 'A private, device-only health dashboard for blood pressure trends, test results, appointments, and medical history — nothing uploads.' },
  { id: 'activation', label: 'Activation', icon: IconKey, color: '#8b5cf6',
    blurb: 'Help with Windows and software activation — keys, troubleshooting, and guides.' },

];
