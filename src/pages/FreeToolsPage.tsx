import { FileText, PenTool, Search } from 'lucide-react';
import PageTabs from '../components/PageTabs';
import ToolsPage from './ToolsPage';
import WhiteboardPage from './WhiteboardPage';
import SeoToolsPage from './SeoToolsPage';

// Free Tools: the photo/PDF tools, the whiteboard and the SEO checker on one page.
// The old /whiteboard/ and /seo-tools/ addresses open their tab here.

export default function FreeToolsPage() {
  return (
    <div style={{ paddingTop: 110 }}>
      <header style={{ maxWidth: 760, margin: '0 auto 1.75rem', padding: '0 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#f97316', marginBottom: '0.75rem' }}>
          Free · Works in your browser
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3.2rem)', color: '#0f172a', lineHeight: 1.1, margin: '0 0 1rem' }}>
          Free online <span className="grad-text">tools</span>
        </h1>
        <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.75, margin: 0 }}>
          Turn photos into a PDF, merge PDFs, make a pencil sketch from a photo, draw on a whiteboard, or check a website’s SEO.
          The photo and PDF tools work on your device, so your files are never uploaded.
        </p>
      </header>
      <PageTabs label="Free tools" accent="#f97316" tabs={[
        { id: 'pdf', label: 'PDF & photo tools', icon: <FileText size={17} />, render: () => <ToolsPage embedded /> },
        { id: 'whiteboard', label: 'Whiteboard', icon: <PenTool size={17} />, render: () => <WhiteboardPage embedded /> },
        { id: 'seo', label: 'SEO checker', icon: <Search size={17} />, render: () => <SeoToolsPage embedded /> },
      ]} />
    </div>
  );
}
