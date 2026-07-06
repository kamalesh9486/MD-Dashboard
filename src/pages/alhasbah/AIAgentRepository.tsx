import { useState, useMemo } from 'react'
import Icon from '../../components/Icon'
import LensInsightChip, { type LensChipType } from '../../components/LensInsightChip'
import { type AHAgent, type AHDivision, type AHStatus } from './data'
import { useAlHasbah } from './AlHasbahContext'
import AgentDetailPanel from './leadership/AgentDetailPanel'
import AgentFormPanel   from './agents/AgentFormPanel'
import NotificationToast, { useToast } from './NotificationToast'
import FormulaInfo from './FormulaInfo'

type DivFilter  = AHDivision | 'all'
type StatFilter = AHStatus | 'all'

const DIV_COLORS: Record<AHDivision, string> = {
  HR: '#7c3aed', Finance: '#ca8a04', Billing: '#0ea5e9',
}

function statusColor(s: string) {
  return s === 'live' ? '#007560' : s === 'pipeline' ? '#3b82f6' : '#9ca3af'
}
function statusLabel(s: string) {
  return s === 'live' ? 'Live' : s === 'pipeline' ? 'In Pipeline' : 'Planned'
}
function statusIcon(s: string) {
  return s === 'live' ? 'bi-rocket-takeoff' : s === 'pipeline' ? 'bi-flask' : 'bi-calendar3'
}

// ── Stat box with optional FormulaInfo tooltip ────────────────────────────────
type FormulaMetric = 'transactions' | 'adoption' | 'issues' | 'usecases' | 'ptu'

function StatBox({
  label, value, sub, color, metric,
}: {
  label: string; value: string | number; sub?: string; color?: string; metric?: FormulaMetric
}) {
  return (
    <div style={{
      flex: 1, padding: '9px 10px',
      background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)',
      borderRadius: 7, minWidth: 0, position: 'relative',
    }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
        {metric && <FormulaInfo metric={metric} />}
      </div>
      {sub && <div style={{ fontSize: 10, color: color ?? 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

// ── CoE Lens insight for an agent ────────────────────────────────────────────

const PROG_AVG = 42
function agentLensChip(agent: AHAgent): { text: string; type: LensChipType } {
  if (agent.status === 'planned' || agent.aiAdoptionPct === 0)
    return { text: 'Not yet deployed — awaiting go-live', type: 'neutral' }
  if (agent.aiAdoptionPct >= 80)
    return { text: `High adoption — top performer, well above ${PROG_AVG}% programme average`, type: 'positive' }
  if (agent.aiAdoptionPct >= PROG_AVG)
    return { text: `Above programme average (${PROG_AVG}%) — steady adoption`, type: 'positive' }
  if (agent.aiAdoptionPct >= 30)
    return { text: `Below programme average (${PROG_AVG}%) — change management recommended`, type: 'attention' }
  return { text: `Sub-30% adoption — critical gap, targeted intervention needed`, type: 'critical' }
}

// ── Agent card ────────────────────────────────────────────────────────────────
function AgentCard({
  agent, onClick, onEdit,
}: {
  agent: AHAgent
  onClick: () => void
  onEdit: (e: React.MouseEvent) => void
}) {
  const divColor = DIV_COLORS[agent.division]
  const statCol  = statusColor(agent.status)
  const adoptCol = agent.aiAdoptionPct >= 80 ? '#007560' : agent.aiAdoptionPct >= 50 ? '#ca8a04' : agent.aiAdoptionPct > 0 ? '#dc2626' : '#9ca3af'

  return (
    <div
      className="ah-agent-repo-card"
      onClick={onClick}
      role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${divColor}14`, border: `1px solid ${divColor}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: divColor, fontSize: 18, flexShrink: 0,
        }}>
          <Icon name="bi-robot" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3, marginBottom: 6 }}>{agent.name}</div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="ah-badge" style={{ background: `${divColor}14`, color: divColor, border: `1px solid ${divColor}28` }}>{agent.division}</span>
            <span className="ah-badge" style={{ background: `${statCol}12`, color: statCol, border: `1px solid ${statCol}28`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name={statusIcon(agent.status)} />{statusLabel(agent.status)}
            </span>
            {agent.openIncidents > 0 && (
              <span className="ah-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="bi-exclamation-triangle" />{agent.openIncidents} open
              </span>
            )}
          </div>
        </div>
        {/* Edit button */}
        <button
          className="ah-edit-icon-btn"
          onClick={onEdit}
          title="Edit agent"
          aria-label="Edit agent"
        >
          <Icon name="bi-pencil" />
        </button>
      </div>

      {/* Owner + target users */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Business Owner</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{agent.businessOwner}</div>
        </div>
        <div>
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Target Users</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.targetEndUsers}</div>
        </div>
      </div>

      {/* 4 stat boxes with formula info */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <StatBox
          label="Transactions" metric="transactions"
          value={agent.annualTransactions > 0 ? agent.annualTransactions.toLocaleString() : '–'}
          color="var(--text)"
        />
        <StatBox
          label="AI Adoption" metric="adoption"
          value={agent.annualTransactions > 0 ? `${agent.aiAdoptionPct}%` : '–'}
          color={agent.annualTransactions > 0 ? adoptCol : undefined}
        />
        <StatBox
          label="Incidents" metric="issues"
          value={agent.openIncidents}
          sub={agent.openIncidents > 0 ? `${agent.openIncidents} open` : 'none open'}
          color={agent.openIncidents > 0 ? '#ef4444' : undefined}
        />
        <StatBox label="Use Cases" metric="usecases" value={`${agent.liveUseCases}/${agent.totalUseCases}`} />
      </div>

      {/* Adoption bar */}
      {agent.annualTransactions > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,117,96,0.08)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${agent.aiAdoptionPct}%`, borderRadius: 3, background: adoptCol, transition: 'width 0.4s' }} />
          </div>
        </div>
      )}

      {/* Model chips */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {agent.modelsUsed.slice(0, 2).map(m => (
          <span key={m} style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)' }}>{m}</span>
        ))}
        {agent.modelsUsed.length > 2 && (
          <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 4, background: 'rgba(0,117,96,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(0,117,96,0.1)' }}>+{agent.modelsUsed.length - 2}</span>
        )}
      </div>
      {(() => { const c = agentLensChip(agent); return <LensInsightChip text={c.text} type={c.type} /> })()}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIAgentRepository(_: { onNavigate?: (tab: string) => void }) {
  const { agents, loading, error, refreshAgents } = useAlHasbah()
  const [search,        setSearch]        = useState('')
  const [divFilter,     setDivFilter]     = useState<DivFilter>('all')
  const [statFilter,    setStatFilter]    = useState<StatFilter>('all')
  const [selectedAgent, setSelectedAgent] = useState<AHAgent | null>(null)
  const [editingAgent,  setEditingAgent]  = useState<AHAgent | null>(null)
  const [showForm,      setShowForm]      = useState(false)
  const { toasts, dismiss, showSuccess }  = useToast()

  const counts = useMemo(() => ({
    total:    agents.length,
    live:     agents.filter(a => a.status === 'live').length,
    pipeline: agents.filter(a => a.status === 'pipeline').length,
    planned:  agents.filter(a => a.status === 'planned').length,
    HR:       agents.filter(a => a.division === 'HR').length,
    Finance:  agents.filter(a => a.division === 'Finance').length,
    Billing:  agents.filter(a => a.division === 'Billing').length,
  }), [agents])

  const filtered = useMemo(() => agents.filter(a => {
    const q = search.toLowerCase()
    return (
      (!q || a.name.toLowerCase().includes(q) || a.businessOwner.toLowerCase().includes(q) || a.targetEndUsers.toLowerCase().includes(q)) &&
      (divFilter  === 'all' || a.division === divFilter) &&
      (statFilter === 'all' || a.status   === statFilter)
    )
  }), [agents, search, divFilter, statFilter])

  const hasFilters = divFilter !== 'all' || statFilter !== 'all' || search !== ''

  const summaryTiles = [
    { label: 'Total Agents',   value: counts.total,    color: '#007560',          onClick: () => { setDivFilter('all'); setStatFilter('all'); setSearch('') }, showAllLabel: true },
    { label: 'Live',           value: counts.live,     color: '#007560',          onClick: () => setStatFilter(p => p === 'live'     ? 'all' : 'live')     },
    { label: 'In Pipeline',    value: counts.pipeline, color: '#3b82f6',          onClick: () => setStatFilter(p => p === 'pipeline' ? 'all' : 'pipeline') },
    { label: 'Planned',        value: counts.planned,  color: '#9ca3af',          onClick: () => setStatFilter(p => p === 'planned'  ? 'all' : 'planned')  },
    { label: 'HR Agents',      value: counts.HR,       color: DIV_COLORS.HR,      onClick: () => setDivFilter(p => p === 'HR'      ? 'all' : 'HR')       },
    { label: 'Finance Agents', value: counts.Finance,  color: DIV_COLORS.Finance, onClick: () => setDivFilter(p => p === 'Finance' ? 'all' : 'Finance')  },
    { label: 'Billing Agents', value: counts.Billing,  color: DIV_COLORS.Billing, onClick: () => setDivFilter(p => p === 'Billing' ? 'all' : 'Billing')  },
  ] as const

  const DIVS:  { val: DivFilter;  label: string }[] = [{ val: 'all', label: 'All' }, { val: 'HR', label: 'HR' }, { val: 'Finance', label: 'Finance' }, { val: 'Billing', label: 'Billing' }]
  const STATS: { val: StatFilter; label: string }[] = [{ val: 'all', label: 'All Statuses' }, { val: 'live', label: 'Live' }, { val: 'pipeline', label: 'In Pipeline' }, { val: 'planned', label: 'Planned' }]

  function handleEdit(e: React.MouseEvent, agent: AHAgent) {
    e.stopPropagation()
    setEditingAgent(agent)
    setShowForm(true)
  }

  function handleAddNew() {
    setEditingAgent(null)
    setShowForm(true)
  }

  async function handleSaved(name: string) {
    const wasEdit = editingAgent !== null
    await new Promise(r => setTimeout(r, 600))
    await refreshAgents()
    showSuccess(wasEdit ? `"${name}" updated successfully` : `"${name}" added to the portfolio`)
  }

  if (loading) return <div className="ah-loading-state"><Icon name="bi-hourglass-split" /> Loading from Dataverse…</div>
  if (error)   return <div className="ah-error-state"><Icon name="bi-exclamation-triangle" /> {error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 7 summary tiles */}
      <div className="ah-agent-repo-summary">
        {summaryTiles.map(tile => {
          const isActive = 'showAllLabel' in tile ? hasFilters : false
          return (
            <div
              key={tile.label}
              className="ah-agent-repo-sum-tile"
              onClick={tile.onClick}
              style={{
                borderColor: isActive ? `${tile.color}50` : undefined,
                background:  isActive ? `${tile.color}10` : undefined,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 700, color: tile.color, lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{tile.value}</div>
              <div style={{ fontSize: 11, color: isActive ? tile.color : 'var(--text-muted)', marginTop: 4, fontWeight: isActive ? 600 : 400 }}>
                {'showAllLabel' in tile && hasFilters ? 'Show all →' : tile.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="ah-agent-repo-filter">
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}><Icon name="bi-search" /></span>
          <input
            className="ah-search"
            placeholder="Search agents, owners, users…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 30 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 5, flexWrap: 'nowrap' }}>
          {DIVS.map(d => {
            const col = d.val === 'all' ? 'rgba(59,130,246,0.5)' : `${DIV_COLORS[d.val as AHDivision]}50`
            const bg  = d.val === 'all' ? 'rgba(59,130,246,0.1)' : `${DIV_COLORS[d.val as AHDivision]}12`
            const tx  = d.val === 'all' ? '#3b82f6' : DIV_COLORS[d.val as AHDivision]
            return (
              <button key={d.val} onClick={() => setDivFilter(d.val)} className="ah-agent-filter-pill"
                style={{ borderColor: divFilter === d.val ? col : undefined, background: divFilter === d.val ? bg : undefined, color: divFilter === d.val ? tx : undefined }}>
                {d.label}
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
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} of {counts.total} agents</span>
          <button className="ah-add-btn" onClick={handleAddNew} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="bi-plus-lg" /> Add Agent
          </button>
        </div>
      </div>

      {/* Agent grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <Icon name="bi-inbox" style={{ fontSize: 32 }} />
          <div style={{ marginTop: 10, fontSize: 14 }}>No agents match the current filters.</div>
        </div>
      ) : (
        <div className="ah-agent-repo-grid">
          {filtered.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => setSelectedAgent(agent)}
              onEdit={e => handleEdit(e, agent)}
            />
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedAgent && (
        <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}

      {/* Add / Edit form panel */}
      {showForm && (
        <AgentFormPanel
          agent={editingAgent ?? undefined}
          onClose={() => { setShowForm(false); setEditingAgent(null) }}
          onSaved={handleSaved}
        />
      )}

      {/* Toast notifications */}
      <NotificationToast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
