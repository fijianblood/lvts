import type { ComponentType } from 'react';
import {
  IconTool, IconWorld, IconCube, IconGift, IconTruck,
  IconDeviceGamepad2, IconHammer, IconChalkboard, IconHeartbeat, IconSeo, IconMessageCircle, IconMail,
  IconTopologyStar3,
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
  { id: 'ask', label: 'Ask LvTS', icon: IconMessageCircle, color: '#6366f1',
    blurb: 'Chat with Loma, a free instant-answer assistant for repairs, Windows 11 troubleshooting, pricing, and general site questions.' },
  { id: 'services', label: 'Services', icon: IconTool, color: '#2563eb',
    blurb: 'An overview of everything LomaVata Tech Services offers across Fiji — PC/laptop repair, gas oven servicing, networking/CCTV, antivirus, printers, email hosting, and the Vitikart store.' },
  { id: 'website', label: 'Website', icon: IconWorld, color: '#06b6d4',
    blurb: 'Web development services — landing pages up to full e-commerce platforms, with tiered Basic/Standard/Premium pricing packages.' },
  { id: 'threed', label: '3D Sites', icon: IconCube, color: '#7c3aed',
    blurb: 'Interactive 3D web experiences — animated hero sections, product viewers, and virtual showrooms that run right in the browser.' },
  { id: 'rewards', label: 'Rewards', icon: IconGift, color: '#f59e0b',
    blurb: 'LomaVata Rewards — a Fiji prize-draw loyalty program. Buy an entry or monthly membership via M-PAiSA/My Cash for weekly draws and a monthly Mega Draw.' },
  { id: 'ranger', label: 'Ranger XL', icon: IconTruck, color: '#16a34a',
    blurb: "A personal service-log dashboard for Joe's 2024 Ford Ranger XL 4x4 — tracks kilometres, service dates, and delivery date." },
  { id: 'play', label: 'Play', icon: IconDeviceGamepad2, color: '#ec4899',
    blurb: 'The Weave Playground — a custom coding language and game built from scratch, with two $50 FJD contests to win by solving levels.' },
  { id: 'tools', label: 'Tools', icon: IconHammer, color: '#f97316',
    blurb: 'A free browser-based image-to-PDF converter and PDF merger — supports JPEG/HEIC/DNG uploads with page size, orientation, and quality options.' },
  { id: 'whiteboard', label: 'Whiteboard', icon: IconChalkboard, color: '#0891b2',
    blurb: 'A free embedded collaborative whiteboard (powered by Excalidraw) for sketching diagrams or jotting notes right in the browser.' },
  { id: 'meditrack', label: 'MediTrack', icon: IconHeartbeat, color: '#c1443b',
    blurb: 'A private, device-only health dashboard for blood pressure trends, test results, appointments, and medical history — nothing uploads.' },
  { id: 'network', label: 'Network Setup', icon: IconTopologyStar3, color: '#f2a93c',
    blurb: 'An interactive 3D diagram showing how a reliable, secure small-office network is architected — ISP hand-off through firewall, switches, servers, and Wi-Fi.' },
  { id: 'seo', label: 'SEO Tools', icon: IconSeo, color: '#2563eb',
    blurb: 'A free embedded suite of SEO, keyword, and website-analysis tools, powered by SEOStudio Tools.' },
  { id: 'contact', label: 'Contact', icon: IconMail, color: '#ef4444',
    blurb: 'Get in touch — book a repair, request a quote, see contact details, and learn more about Joe and LomaVata Tech Services.' },
];
