import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, CalendarDays, Clock, MessageCircle } from 'lucide-react';
import type { BlogPost } from '../data/blogPosts';
import { pageLink } from '../links';
import { formatDate, postMarkdown, readMinutes } from '../lib/blog';

export default function BlogPostPage({ post, onNav }: { post: BlogPost; onNav: (p: string) => void }) {
  const md = postMarkdown(post.slug);
  return (
    <article style={{ background: '#fff' }}>
      <style>{`
        .blog-body { color: #1e293b; font-size: 1.05rem; line-height: 1.8; }
        .blog-body p { margin: 0 0 1.2rem; }
        .blog-body h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(1.35rem, 3.2vw, 1.75rem); color: #0f172a; line-height: 1.25; margin: 2.4rem 0 0.9rem; }
        .blog-body h3 { font-weight: 800; font-size: 1.15rem; color: #0f172a; margin: 1.8rem 0 0.6rem; }
        .blog-body ul, .blog-body ol { margin: 0 0 1.2rem; padding-left: 1.4rem; }
        .blog-body ul { list-style: disc; }
        .blog-body ol { list-style: decimal; }
        .blog-body li { margin-bottom: 0.45rem; }
        .blog-body li::marker { color: #2563eb; font-weight: 700; }
        .blog-body a { color: #2563eb; font-weight: 600; text-decoration: underline; text-underline-offset: 3px; }
        .blog-body strong { color: #0f172a; }
        .blog-body code { font-family: 'JetBrains Mono', monospace; font-size: 0.85em; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 5px; padding: 0.05rem 0.35rem; overflow-wrap: anywhere; }
        .blog-body pre { background: #0f172a; color: #e2e8f0; border-radius: 12px; padding: 1rem; overflow-x: auto; }
        .blog-body pre code { background: none; border: none; color: inherit; padding: 0; }
        .blog-body blockquote { margin: 0 0 1.2rem; padding: 0.8rem 1.1rem; border-left: 4px solid #2563eb; background: #eff6ff; border-radius: 0 10px 10px 0; color: #1e3a8a; }
        .blog-body .table-wrap { overflow-x: auto; margin: 0 0 1.4rem; border: 1px solid #e2e8f0; border-radius: 12px; }
        .blog-body table { width: 100%; border-collapse: collapse; font-size: 0.93rem; min-width: 520px; }
        .blog-body th { text-align: left; background: #f1f5f9; color: #0f172a; padding: 0.65rem 0.8rem; border-bottom: 1px solid #e2e8f0; }
        .blog-body td { padding: 0.65rem 0.8rem; border-bottom: 1px solid #e2e8f0; vertical-align: top; line-height: 1.55; }
        .blog-body tr:last-child td { border-bottom: none; }
      `}</style>
      <header style={{ padding: '110px 1.5rem 40px', background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <a {...pageLink('blog', onNav)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#93c5fd', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', marginBottom: '1.25rem' }}>
            <ArrowLeft size={16} /> All posts
          </a>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.9rem' }}>
            {post.tags.map((t) => (
              <span key={t} style={{ background: 'rgba(147,197,253,0.15)', border: '1px solid rgba(147,197,253,0.35)', color: '#bfdbfe', borderRadius: 6, padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>{t}</span>
            ))}
          </div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4.5vw,2.7rem)', lineHeight: 1.15, margin: '0 0 1.1rem' }}>{post.title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.1rem', fontSize: '0.88rem', color: '#cbd5e1' }}>
            <span>By {post.author}, LomaVata Tech Services</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={15} /> <time dateTime={post.date}>{formatDate(post.date)}</time></span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={15} /> {readMinutes(md)} min read</span>
          </div>
        </div>
      </header>

      <div style={{ padding: '40px 1.5rem 60px' }}>
        <div className="blog-body" style={{ maxWidth: 760, margin: '0 auto' }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              table: ({ children }) => <div className="table-wrap"><table>{children}</table></div>,
              a: ({ href, children }) => {
                const external = !!href && /^https?:\/\//.test(href);
                return <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
              },
            }}
          >
            {md}
          </ReactMarkdown>
        </div>
      </div>

      <footer style={{ padding: '0 1.5rem 120px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '0.25rem' }}>Questions about your PC or website?</div>
            <div style={{ color: '#64748b', fontSize: '0.92rem' }}>LomaVata Tech Services, Raiwai, Suva · 833 1088</div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <a href="https://wa.me/6797466941" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#16a34a', color: '#fff', padding: '0.75rem 1.2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
              <MessageCircle size={18} /> WhatsApp us
            </a>
            <a {...pageLink('blog', onNav)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '0.75rem 1.2rem', borderRadius: 12, fontWeight: 700, textDecoration: 'none' }}>
              More posts
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}
