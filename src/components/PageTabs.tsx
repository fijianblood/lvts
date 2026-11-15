import { useState, type ReactNode } from 'react';

// Tabs for a combined page (Free Tools, Kids). The open tab is kept in the
// address as ?tab=<id>, so a link can open a tab directly, and the old page
// addresses (/whiteboard/, /seo-tools/, /little-chef/) land on their tab
// (see aliasOf in src/data/routes.ts and currentPage in src/App.tsx).

export interface PageTab {
  id: string;
  label: string;
  icon?: ReactNode;
  render: () => ReactNode;
}

function tabFromAddress(tabs: PageTab[]): string {
  const wanted = new URLSearchParams(window.location.search).get('tab');
  return tabs.some((t) => t.id === wanted) ? (wanted as string) : tabs[0].id;
}

export default function PageTabs({ tabs, accent, label }: { tabs: PageTab[]; accent: string; label: string }) {
  const [active, setActive] = useState(() => tabFromAddress(tabs));

  function choose(id: string) {
    setActive(id);
    const query = id === tabs[0].id ? '' : `?tab=${id}`;
    window.history.replaceState(null, '', `${window.location.pathname}${query}`);
  }

  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <>
      <div role="tablist" aria-label={label}
        style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem', padding: '0 1.5rem', maxWidth: 900, margin: '0 auto' }}>
        {tabs.map((t) => {
          const on = t.id === current.id;
          return (
            <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={on} aria-controls={`panel-${t.id}`}
              onClick={() => choose(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 1.15rem', borderRadius: 999,
                border: on ? `1px solid ${accent}` : '1px solid #e2e8f0', background: on ? accent : '#fff',
                color: on ? '#fff' : '#0f172a', fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                boxShadow: on ? `0 6px 18px ${accent}40` : '0 1px 3px rgba(15,23,42,0.06)', fontFamily: "'Space Grotesk',sans-serif",
              }}>
              {t.icon}{t.label}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${current.id}`} aria-labelledby={`tab-${current.id}`}>
        {current.render()}
      </div>
    </>
  );
}
