import { useState, useMemo } from 'react'
import Icon from '../../components/Icon'
import { type AHUseCase, type AHDivision, type AHStatus } from './data'
import { useAlHasbah } from './AlHasbahContext'
import UseCaseDetailPanel from './leadership/UseCaseDetailPanel'
import UseCaseFormPanel   from './usecases/UseCaseFormPanel'
import NotificationToast, { useToast } from './NotificationToast'

type DivFilter  = AHDivision | 'all'
type StatFilter = AHStatus | 'all'

const DIV_COLORS: Record<AHDivision, string> = {
  HR: '#7c3aed', Finance: '#ca8a04', Billing: '#0ea5e9',
}
const DIVISIONS: AHDivision[] = ['HR', 'Finance', 'Billing']

function statusColor(s: string) {
  return s === 'live' ? '#007560' : s === 'pipeline' ? '#3b82f6' : '#9ca3af'
}
function statusLabel(s: string) {
  return s === 'live' ? 'Live' : s === 'pipeline' ? 'In Pipeline' : 'Planned'
}
function statusIcon(s: string) {
  return s === 'live' ? 'bi-rocket-takeoff' : s === 'pipeline' ? 'bi-flask' : 'bi-calendar3'
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function UCCard({ uc, agentMap, onClick, onEdit }: { uc: AHUseCase; agentMap: Map<string, string>; onClick: () => void; onEdit: (e: React.MouseEvent) => void }) {
  const divColor = DIV_COLORS[uc.division]
  const statCol  = statusColor(uc.status)
  const effCol   = uc.expectedEfficiency >= 75 ? '#007560' : uc.expectedEfficiency >= 50 ? '#ca8a04' : '#dc2626'

  const agentName = agentMap.get(uc.agentId) ?? uc.agentId

  return (
    <div className="ah-uc-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick()}>
      {/* Badges + edit btn */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10, alignItems: 'flex-start' }}>
        <span className="ah-badge" style={{ background: `${divColor}14`, color: divColor, border: `1px solid ${divColor}28` }}>{uc.division}</span>
        <span className="ah-badge" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)', fontSize: 10 }}>{uc.domain}</span>
        <span className="ah-badge" style={{ background: `${statCol}12`, color: statCol, border: `1px solid ${statCol}28`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name={statusIcon(uc.status)} />{statusLabel(uc.status)}
        </span>
        <button
          className="ah-edit-icon-btn"
          style={{ marginLeft: 'auto', flexShrink: 0 }}
          onClick={onEdit}
          title="Edit use case"
          aria-label="Edit use case"
        >
          <Icon name="bi-pencil" />
        </button>
      </div>

      {/* Name */}
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35, marginBottom: 8 }}>{uc.name}</div>

      {/* Description — 2-line clamp */}
      <div className="ah-uc-card-desc">{uc.description}</div>

      {/* Agent chip */}
      <div style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,117,96,0.08)', color: '#007560', border: '1px solid rgba(0,117,96,0.15)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="bi-robot" />{agentName}
        </span>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,117,96,0.08)', paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Target Saving</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#007560', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <Icon name="bi-currency-dirham" />{fmt(uc.targetCostSaving)}
          </div>
        </div>
        {uc.status === 'live' ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 4 }}>AI Efficiency</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 56, height: 5, borderRadius: 3, background: 'rgba(0,117,96,0.1)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uc.expectedEfficiency}%`, borderRadius: 3, background: effCol }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: effCol }}>{uc.expectedEfficiency}%</span>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Planned Go-Live</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)' }}>{uc.plannedGoLive}</div>
          </div>
        )}
      </div>

      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8, textAlign: 'right' }}>View →</div>
    </div>
  )
}

interface Props { onNavigate?: (tab: string) => void }

export default function UseCaseRepository(_props: Props) {
  const { useCases, agents, loading, error, refreshUseCases } = useAlHasbah()
  const [search,     setSearch]     = useState('')
  const [divFilter,  setDivFilter]  = useState<DivFilter>('all')
  const [statFilter, setStatFilter] = useState<StatFilter>('all')
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set())
  const [selectedUC, setSelectedUC] = useState<AHUseCase | null>(null)
  const [editingUC,  setEditingUC]  = useState<AHUseCase | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const { toasts, dismiss, showSuccess } = useToast()

  const agentMap = useMemo(() => new Map(agents.map(a => [a.id, a.name])), [agents])

  const counts = useMemo(() => ({
    total:        useCases.length,
    live:         useCases.filter(u => u.status === 'live').length,
    pipeline:     useCases.filter(u => u.status === 'pipeline').length,
    planned:      useCases.filter(u => u.status === 'planned').length,
    liveSavings:  useCases.filter(u => u.status === 'live').reduce((s, u) => s + u.targetCostSaving, 0),
    totalSavings: useCases.reduce((s, u) => s + u.targetCostSaving, 0),
  }), [useCases])

  const filtered = useMemo(() => useCases.filter(u => {
    const q = search.toLowerCase()
    return (
      (!q || u.name.toLowerCase().includes(q) || u.domain.toLowerCase().includes(q) || u.description.toLowerCase().includes(q)) &&
      (divFilter  === 'all' || u.division === divFilter) &&
      (statFilter === 'all' || u.status   === statFilter)
    )
  }), [useCases, search, divFilter, statFilter])

  const STATS: { val: StatFilter; label: string }[] = [
    { val: 'all',      label: `All (${counts.total})` },
    { val: 'live',     label: `Live (${counts.live})` },
    { val: 'pipeline', label: `Pipeline (${counts.pipeline})` },
    { val: 'planned',  label: `Planned (${counts.planned})` },
  ]

  if (loading) return <div className="ah-loading-state"><Icon name="bi-hourglass-split" /> Loading from Dataverse…</div>
  if (error)   return <div className="ah-error-state"><Icon name="bi-exclamation-triangle" /> {error}</div>

  function toggleCollapse(div: string) {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(div)) { next.delete(div) } else { next.add(div) }
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary tiles — 6 across */}
      <div className="ah-uc-repo-summary">
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 26, fontWeight: 700, color: '#007560', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{counts.total}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Total Use Cases</div>
        </div>
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 26, fontWeight: 700, color: '#007560', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{counts.live}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Live</div>
        </div>
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 26, fontWeight: 700, color: '#3b82f6', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{counts.pipeline}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>In Pipeline</div>
        </div>
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 26, fontWeight: 700, color: '#9ca3af', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{counts.planned}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Planned</div>
        </div>
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#007560', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 2, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>
            <Icon name="bi-currency-dirham" />{fmt(counts.liveSavings)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Live Target Savings</div>
        </div>
        <div className="ah-uc-repo-sum-tile">
          <div style={{ fontSize: 15, fontWeight: 700, color: '#ca8a04', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 2, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>
            <Icon name="bi-currency-dirham" />{fmt(counts.totalSavings)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Total Target Savings</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="ah-uc-repo-filter">
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon name="bi-search" /></span>
          <input
            className="ah-search"
            placeholder="Search use cases, domains…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 30 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
          {(['all', 'HR', 'Finance', 'Billing'] as const).map(d => {
            const col = d === 'all' ? 'rgba(59,130,246,0.5)' : `${DIV_COLORS[d]}50`
            const bg  = d === 'all' ? 'rgba(59,130,246,0.1)' : `${DIV_COLORS[d]}12`
            const tx  = d === 'all' ? '#3b82f6' : DIV_COLORS[d]
            return (
              <button key={d} onClick={() => setDivFilter(d)} className="ah-agent-filter-pill"
                style={{ borderColor: divFilter === d ? col : undefined, background: divFilter === d ? bg : undefined, color: divFilter === d ? tx : undefined }}>
                {d === 'all' ? 'All' : d}
              </button>
            )
          })}
        </div>

        <div style={{ width: 1, height: 22, background: 'rgba(0,117,96,0.15)', flexShrink: 0 }} />

        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
          {STATS.map(s => {
            const col = s.val === 'all' ? 'rgba(59,130,246,0.5)' : `${statusColor(s.val)}50`
            const bg  = s.val === 'all' ? 'rgba(59,130,246,0.1)' : `${statusColor(s.val)}12`
            const tx  = s.val === 'all' ? '#3b82f6' : statusColor(s.val)
            return (
              <button key={s.val} onClick={() => setStatFilter(s.val)} className="ah-agent-filter-pill"
                style={{ borderColor: statFilter === s.val ? col : undefined, background: statFilter === s.val ? bg : undefined, color: statFilter === s.val ? tx : undefined }}>
                {s.label}
              </button>
            )
          })}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} of {counts.total} use cases</span>
          <button className="ah-add-btn" onClick={() => { setEditingUC(null); setShowForm(true) }} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="bi-plus-lg" /> Add Use Case
          </button>
        </div>
      </div>

      {/* Division groups */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <Icon name="bi-inbox" style={{ fontSize: 32 }} />
          <div style={{ marginTop: 10, fontSize: 14 }}>No use cases match the current filters.</div>
        </div>
      ) : (
        DIVISIONS.map(div => {
          const divUCs = filtered.filter(u => u.division === div)
          if (divUCs.length === 0) return null
          const isCollapsed = collapsed.has(div)
          const divColor = DIV_COLORS[div]
          const liveN    = divUCs.filter(u => u.status === 'live').length
          const pipeN    = divUCs.filter(u => u.status === 'pipeline').length
          const planN    = divUCs.filter(u => u.status === 'planned').length

          return (
            <div key={div} className="ah-uc-repo-div-group">
              <button className="ah-uc-repo-div-head" onClick={() => toggleCollapse(div)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name={isCollapsed ? 'bi-chevron-right' : 'bi-chevron-down'} />
                  <span style={{ fontWeight: 700, fontSize: 14, color: divColor }}>{div}</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{divUCs.length} use case{divUCs.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {liveN > 0 && <span className="ah-badge" style={{ background: 'rgba(0,117,96,0.12)', color: '#007560', border: '1px solid rgba(0,117,96,0.2)', fontSize: 10 }}>{liveN} Live</span>}
                  {pipeN > 0 && <span className="ah-badge" style={{ background: 'rgba(59,130,246,0.1)',  color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)', fontSize: 10 }}>{pipeN} Pipeline</span>}
                  {planN > 0 && <span className="ah-badge" style={{ background: 'rgba(156,163,175,0.1)', color: '#9ca3af', border: '1px solid rgba(156,163,175,0.2)', fontSize: 10 }}>{planN} Planned</span>}
                </div>
              </button>

              {!isCollapsed && (
                <div className="ah-uc-card-grid">
                  {divUCs.map(uc => (
                    <UCCard
                      key={uc.id}
                      uc={uc}
                      agentMap={agentMap}
                      onClick={() => setSelectedUC(uc)}
                      onEdit={e => { e.stopPropagation(); setEditingUC(uc); setShowForm(true) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {selectedUC && <UseCaseDetailPanel uc={selectedUC} onClose={() => setSelectedUC(null)} />}

      {showForm && (
        <UseCaseFormPanel
          uc={editingUC ?? undefined}
          onClose={() => { setShowForm(false); setEditingUC(null) }}
          onSaved={name => {
            const wasEdit = !!editingUC
            void (async () => {
              await new Promise(r => setTimeout(r, 600))
              await refreshUseCases()
              showSuccess(wasEdit ? `"${name}" updated successfully` : `"${name}" added to the repository`)
            })()
          }}
        />
      )}

      <NotificationToast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
