import { CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { BLOG_POSTS } from '../data/blogPosts';
import { pageLink } from '../links';
import { formatDate, postMarkdown, readMinutes } from '../lib/blog';

export default function BlogPage({ onNav }: { onNav: (p: string) => void }) {
  return (
    <>
      <section style={{ padding: '120px 1.5rem 50px', background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 100%)', color: '#fff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#93c5fd', marginBottom: '0.75rem' }}>LvTS Blog</div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(2rem,5vw,3rem)', lineHeight: 1.1, margin: '0 0 1rem' }}>
            Tech tips, security and IT news for Fiji
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.02rem', lineHeight: 1.75, maxWidth: 680, margin: 0 }}>
            Practical articles from LomaVata Tech Services in Raiwai, Suva: keeping your PC and accounts safe, fixing Windows, websites, networking and the technology changing life in the Pacific.
          </p>
        </div>
      </section>

      <section style={{ padding: '50px 1.5rem 120px', background: '#f8fafc' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gap: '1.25rem' }}>
          {BLOG_POSTS.map((p) => (
            <article key={p.slug} className="card-3d" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                {p.tags.map((t) => (
                  <span key={t} style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', borderRadius: 6, padding: '0.15rem 0.55rem', fontSize: '0.72rem', fontWeight: 700 }}>{t}</span>
                ))}
              </div>
              <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 'clamp(1.25rem,3vw,1.6rem)', lineHeight: 1.25, margin: '0 0 0.6rem' }}>
                <a {...pageLink(`post-${p.slug}`, onNav)} style={{ color: '#0f172a', textDecoration: 'none' }}>{p.title}</a>
              </h2>
              <p style={{ color: '#475569', lineHeight: 1.7, margin: '0 0 1rem' }}>{p.description}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', fontSize: '0.82rem', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><CalendarDays size={15} /> <time dateTime={p.date}>{formatDate(p.date)}</time></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><Clock size={15} /> {readMinutes(postMarkdown(p.slug))} min read</span>
                <span>By {p.author}</span>
                <a {...pageLink(`post-${p.slug}`, onNav)} style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
                  Read <ArrowRight size={15} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
