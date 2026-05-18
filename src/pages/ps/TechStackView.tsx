import { type TechEntry, type TechCategory } from './data'
import Icon from '../../components/Icon'

type ViewMode = 'category' | 'table' | 'map'

// ── Single tech card ──────────────────────────────────────────────
function TechCard({ t, onSelect, liveCount }: { t: TechEntry; onSelect: (t: TechEntry) => void; liveCount?: number | null }) {
  const displayUsers = (t.panelType === 'copilot' && liveCount != null) ? liveCount.toLocaleString() + ' agents' : t.users
  return (
    <article
      onClick={() => onSelect(t)}
      style={{ background: '#fff', border: '1px solid rgba(0,117,96,0.13)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, cursor: 'pointer', position: 'relative', minHeight: 180, transition: 'border-color .15s, box-shadow .15s, transform .15s' }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,117,96,0.3)'; el.style.boxShadow = '0 4px 20px rgba(0,117,96,0.1)'; el.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(0,117,96,0.13)'; el.style.boxShadow = ''; el.style.transform = '' }}
    >
      {t.panelType && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: '#dcfce7', color: '#15803d', fontSize: 9, fontWeight: 800, letterSpacing: '0.6px', padding: '2px 8px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />LIVE
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11, paddingRight: t.panelType ? 52 : 0 }}>
        <div style={{ width: 40, height: 40, borderRadius: 9, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon name={t.icon ?? 'bi-tools'} style={{ fontSize: 18, color: '#fff' }} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1e', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
          <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{t.vendor}</div>
        </div>
      </div>
      <div style={{ fontSize: 12.5, color: '#5a6672', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{t.desc}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, paddingTop: 10, borderTop: '1px dashed rgba(0,117,96,0.15)' }}>
        {[['Users', displayUsers], ['Run rate', t.spend]].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 9.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', letterSpacing: '-0.01em' }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {t.tags.slice(0, 2).map(tag => (
            <span key={tag} style={{ fontSize: 10.5, fontWeight: 500, color: '#6b7280', background: '#f3f4f6', border: '1px solid rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 5 }}>{tag}</span>
          ))}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {t.panelType ? 'Open dashboard' : 'View details'} <Icon name="bi-chevron-right" style={{ fontSize: 11 }} />
        </span>
      </div>
    </article>
  )
}

// ── Category view ─────────────────────────────────────────────────
function CategoryView({ items, cats, onSelect, liveCount }: { items: TechEntry[]; cats: TechCategory[]; onSelect: (t: TechEntry) => void; liveCount: number | null }) {
  const catItems = cats.map(c => ({ cat: c, items: items.filter(t => t.cat === c.id) })).filter(x => x.items.length > 0)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {catItems.map(({ cat, items: ci }) => (
        <section key={cat.id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: cat.color, flexShrink: 0 }} />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em', color: '#1c1c1e' }}>{cat.name}</h2>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>{ci.length} technologies</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,117,96,0.1)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 14 }}>
            {ci.map(t => <TechCard key={t.id} t={t} onSelect={onSelect} liveCount={liveCount} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

// ── Table view ────────────────────────────────────────────────────
function TableView({ items, cats, onSelect }: { items: TechEntry[]; cats: TechCategory[]; onSelect: (t: TechEntry) => void }) {
  const catMap = new Map(cats.map(c => [c.id, c]))
  const th: React.CSSProperties = { textAlign: 'left', padding: '8px 14px', fontSize: 10.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,117,96,0.13)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.9fr 0.9fr 0.9fr', gap: 12, padding: '10px 14px', background: '#f9fafb', borderBottom: '1px solid rgba(0,117,96,0.1)' }}>
        {['Technology', 'Category', 'Owner', 'Users', 'Run rate'].map(h => <span key={h} style={th}>{h}</span>)}
      </div>
      {items.map((t, i) => {
        const cat = catMap.get(t.cat)
        return (
          <div key={t.id} onClick={() => onSelect(t)} style={{ display: 'grid', gridTemplateColumns: '2.2fr 1fr 0.9fr 0.9fr 0.9fr', gap: 12, padding: '10px 14px', borderTop: '1px solid rgba(0,117,96,0.07)', background: i % 2 === 0 ? 'transparent' : '#fafafa', cursor: 'pointer', alignItems: 'center' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ecf7f0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? 'transparent' : '#fafafa' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name={t.icon ?? 'bi-tools'} style={{ fontSize: 14, color: '#fff' }} />
              </div>
              <div><div style={{ fontWeight: 600, color: '#1c1c1e', fontSize: 13 }}>{t.name}</div><div style={{ fontSize: 11.5, color: '#9ca3af' }}>{t.vendor}</div></div>
            </div>
            <span style={{ fontSize: 12, color: '#5a6672', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: cat?.color, display: 'inline-block', flexShrink: 0 }} />
              {cat?.name.split(' ').slice(0, 2).join(' ')}
            </span>
            <span style={{ fontSize: 12, color: '#5a6672', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.owner}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{t.users}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{t.spend}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Treemap view ──────────────────────────────────────────────────
function TreemapView({ items, cats, onSelect }: { items: TechEntry[]; cats: TechCategory[]; onSelect: (t: TechEntry) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {cats.map(c => {
        const ci = items.filter(t => t.cat === c.id)
        if (!ci.length) return null
        const total = ci.reduce((s, t) => s + parseFloat(t.spend.replace(/[^\d.]/g, '')), 0)
        return (
          <section key={c.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: c.color }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1c1e' }}>{c.name}</span>
              <span style={{ fontSize: 12, color: '#9ca3af' }}>AED {total.toFixed(1)}M annual run rate</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(0,117,96,0.1)' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ci.map(t => {
                const v = parseFloat(t.spend.replace(/[^\d.]/g, ''))
                const pct = Math.max(15, Math.min(40, Math.round((v / total) * 100)))
                return (
                  <article key={t.id} onClick={() => onSelect(t)} style={{ minHeight: 110, width: `calc(${pct}% - 8px)`, minWidth: 120, background: '#fff', border: '1px solid rgba(0,117,96,0.13)', borderRadius: 10, padding: 14, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden', transition: 'box-shadow .15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 16px rgba(0,117,96,0.12)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '' }}>
                    <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: t.color }} />
                    <div>
                      <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{t.vendor}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1c1c1e' }}>{t.name}</div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#1c1c1e', letterSpacing: '-0.025em' }}>{t.spend}</div>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────
export default function TechStackView({ items, cats, view, onSelect, liveCount }: {
  items: TechEntry[]; cats: TechCategory[]; view: ViewMode
  onSelect: (t: TechEntry) => void; liveCount: number | null
}) {
  if (view === 'table')    return <TableView    items={items} cats={cats} onSelect={onSelect} />
  if (view === 'map')      return <TreemapView  items={items} cats={cats} onSelect={onSelect} />
  return <CategoryView items={items} cats={cats} onSelect={onSelect} liveCount={liveCount} />
}
