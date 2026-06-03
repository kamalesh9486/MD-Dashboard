import { useState, useMemo } from 'react'
import Icon from '../../components/Icon'
import {
  AH_SLA_DAYS,
  AH_SLA_LABEL,
  getAssignedTeam,
  daysSince,
  type AHSeverity,
  type AHIncidentStatus,
  type AHIncidentType,
  type AHIncident,
} from './data'
import { useAlHasbah } from './AlHasbahContext'
import IncidentDetailPanel from './incidents/IncidentDetailPanel'
import IncidentFormPanel   from './incidents/IncidentFormPanel'
import KnowledgeGapsPanel  from './incidents/KnowledgeGapsPanel'
import ChangeManagementPanel from './incidents/ChangeManagementPanel'

const SEV_COLORS: Record<AHSeverity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#94a3b8',
}

function sevClass(s: AHSeverity) {
  return s === 'critical'
    ? 'ah-badge ah-sev-critical'
    : s === 'high'
      ? 'ah-badge ah-sev-high'
      : s === 'medium'
        ? 'ah-badge ah-sev-medium'
        : 'ah-badge ah-sev-low'
}

function statusClass(s: AHIncidentStatus) {
  return s === 'open'
    ? 'ah-badge ah-inc-open'
    : s === 'in_progress'
      ? 'ah-badge ah-inc-in-progress'
      : 'ah-badge ah-inc-resolved'
}

function statusLabel(s: AHIncidentStatus) {
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
}

function typeClass(t: AHIncidentType) {
  return t === 'ai_agent'
    ? 'ah-badge ah-type-ai-agent'
    : t === 'sap'
      ? 'ah-badge ah-type-sap'
      : t === 'business_process'
        ? 'ah-badge ah-type-business-process'
        : 'ah-badge ah-type-knowledge-gap'
}

function typeLabel(t: AHIncidentType) {
  return t === 'ai_agent'
    ? 'AI Agent'
    : t === 'sap'
      ? 'SAP'
      : t === 'business_process'
        ? 'Business Process'
        : 'Knowledge Gap'
}

interface FilterSelectProps {
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (v: string) => void
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div>
      <div className="ah-filter-label">{label}</div>
      <select className="ah-select" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

interface SLATooltipData { x: number; y: number; sev: AHSeverity }

interface Props {
  onNavigate?: (tab: string) => void
}

export default function Incidents({ onNavigate: _nav }: Props) {
  void _nav // prop accepted for future cross-tab navigation from sub-tabs
  const { incidents, useCases, loading, error, refreshIncidents } = useAlHasbah()
  const [filterSeverity, setFilterSeverity]   = useState<AHSeverity | 'all'>('all')
  const [filterStatus, setFilterStatus]       = useState<AHIncidentStatus | 'all'>('all')
  const [filterType, setFilterType]           = useState<AHIncidentType | 'all'>('all')
  const [filterTeam, setFilterTeam]           = useState('all')
  const [filterUC, setFilterUC]               = useState('all')
  const [filterDateFrom, setFilterDateFrom]   = useState('')
  const [filterDateTo, setFilterDateTo]       = useState('')
  const [selectedIncident, setSelectedIncident] = useState<AHIncident | null>(null)
  const [showForm, setShowForm]               = useState(false)
  const [subTab, setSubTab]                   = useState<'list' | 'knowledge-gaps' | 'change-management'>('list')
  const [slaTooltip, setSlaTooltip]           = useState<SLATooltipData | null>(null)

  const ucMap     = useMemo(() => new Map(useCases.map(u => [u.id, u.name])), [useCases])
  const allTeams  = useMemo(() => [...new Set(incidents.map(i => getAssignedTeam(i.type, i.division)))].sort(), [incidents])
  const ucOptions = useMemo(() => useCases.map(u => ({ label: u.name, value: u.id })), [useCases])

  const hasActiveFilters =
    filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' ||
    filterTeam !== 'all' || filterUC !== 'all' || filterDateFrom !== '' || filterDateTo !== ''

  const filtered = incidents.filter(i => {
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
    if (filterStatus   !== 'all' && i.status   !== filterStatus)   return false
    if (filterType     !== 'all' && i.type     !== filterType)     return false
    if (filterTeam     !== 'all' && getAssignedTeam(i.type, i.division) !== filterTeam) return false
    if (filterUC !== 'all') {
      const matchedUC = useCases.find(u => u.id === filterUC)
      if (!matchedUC || matchedUC.agentId !== i.agentId) return false
    }
    if (filterDateFrom && i.reportedDate < filterDateFrom) return false
    if (filterDateTo   && i.reportedDate > filterDateTo)   return false
    return true
  })

  function clearFilters() {
    setFilterSeverity('all'); setFilterStatus('all'); setFilterType('all')
    setFilterTeam('all'); setFilterUC('all'); setFilterDateFrom(''); setFilterDateTo('')
  }

  function handleSLAEnter(e: React.MouseEvent, sev: AHSeverity) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setSlaTooltip({ x: r.right + 8, y: r.top, sev })
  }

  // ── Summary counts ──────────────────────────────────────────────────────────
  const cTotal      = incidents.length
  const cOpen       = incidents.filter(i => i.status === 'open').length
  const cInProgress = incidents.filter(i => i.status === 'in_progress').length
  const cResolved   = incidents.filter(i => i.status === 'resolved').length
  const cCM         = incidents.filter(i => i.changeManagementTriggered).length

  const cSev = (s: AHSeverity)   => incidents.filter(i => i.severity === s).length
  const cTyp = (t: AHIncidentType) => incidents.filter(i => i.type === t).length

  const SUB_TABS = [
    { id: 'list' as const,              label: 'Incident List',       icon: 'bi-list-ul' },
    { id: 'knowledge-gaps' as const,    label: 'Knowledge Gaps',      icon: 'bi-book' },
    { id: 'change-management' as const, label: 'Change Management',   icon: 'bi-flag' },
  ]

  if (loading) return <div className="ah-loading-state"><Icon name="bi-hourglass-split" /> Loading from Dataverse…</div>
  if (error)   return <div className="ah-error-state"><Icon name="bi-exclamation-triangle" /> {error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Section A — Page header */}
      <div className="ah-incidents-page-header">
        <div>
          <div className="ah-incidents-page-title">AI Health &amp; Incidents</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            Monitor, triage and resolve AI agent and process incidents
          </div>
        </div>
        <button
          className="ah-add-btn"
          onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Icon name="bi-shield-plus" /> Report Incident
        </button>
      </div>

      {/* Section B — Summary row 1: status + CM */}
      <div className="ah-inc-summary-row">
        <button
          className="ah-inc-summary-tile"
          onClick={clearFilters}
          title="Clear all filters"
        >
          <div className="ah-inc-summary-tile-val" style={{ color: 'var(--text)' }}>{cTotal}</div>
          <div className="ah-inc-summary-tile-label">Total Incidents</div>
        </button>

        <button
          className={`ah-inc-summary-tile${filterStatus === 'open' ? ' active' : ''}`}
          style={{ color: '#dc2626' }}
          onClick={() => setFilterStatus(s => s === 'open' ? 'all' : 'open')}
        >
          <div className="ah-inc-summary-tile-val" style={{ color: '#dc2626' }}>{cOpen}</div>
          <div className="ah-inc-summary-tile-label">Open</div>
        </button>

        <button
          className={`ah-inc-summary-tile${filterStatus === 'in_progress' ? ' active' : ''}`}
          style={{ color: '#ca8a04' }}
          onClick={() => setFilterStatus(s => s === 'in_progress' ? 'all' : 'in_progress')}
        >
          <div className="ah-inc-summary-tile-val" style={{ color: '#ca8a04' }}>{cInProgress}</div>
          <div className="ah-inc-summary-tile-label">In Progress</div>
        </button>

        <button
          className={`ah-inc-summary-tile${filterStatus === 'resolved' ? ' active' : ''}`}
          style={{ color: '#6b7280' }}
          onClick={() => setFilterStatus(s => s === 'resolved' ? 'all' : 'resolved')}
        >
          <div className="ah-inc-summary-tile-val" style={{ color: '#6b7280' }}>{cResolved}</div>
          <div className="ah-inc-summary-tile-label">Resolved</div>
        </button>

        <div className="ah-inc-summary-tile" style={{ cursor: 'default' }}>
          <div
            className="ah-inc-summary-tile-val"
            style={{ color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Icon name="bi-flag-fill" style={{ fontSize: 18 }} />
            {cCM}
          </div>
          <div className="ah-inc-summary-tile-label">CM Triggered</div>
        </div>
      </div>

      {/* Section B — Summary row 2: severity tiles */}
      <div className="ah-inc-summary-row">
        {(['critical', 'high', 'medium', 'low'] as AHSeverity[]).map(sev => (
          <button
            key={sev}
            className={`ah-inc-summary-tile${filterSeverity === sev ? ' active' : ''}`}
            style={{ color: SEV_COLORS[sev] }}
            onClick={() => setFilterSeverity(s => s === sev ? 'all' : sev)}
          >
            <div className="ah-inc-summary-tile-val" style={{ color: SEV_COLORS[sev] }}>{cSev(sev)}</div>
            <div className="ah-inc-summary-tile-label" style={{ textTransform: 'capitalize' }}>{sev}</div>
          </button>
        ))}
      </div>

      {/* Section B — Summary row 3: type tiles */}
      <div className="ah-inc-summary-row">
        {([
          { t: 'ai_agent' as AHIncidentType, label: 'AI Agent', color: '#7c3aed' },
          { t: 'sap' as AHIncidentType, label: 'SAP', color: '#0ea5e9' },
          { t: 'business_process' as AHIncidentType, label: 'Business Process', color: '#007560' },
          { t: 'knowledge_gap' as AHIncidentType, label: 'Knowledge Gap', color: '#f97316' },
        ]).map(({ t, label, color }) => (
          <button
            key={t}
            className={`ah-inc-summary-tile${filterType === t ? ' active' : ''}`}
            style={{ color }}
            onClick={() => setFilterType(f => f === t ? 'all' : t)}
          >
            <div className="ah-inc-summary-tile-val" style={{ color }}>{cTyp(t)}</div>
            <div className="ah-inc-summary-tile-label">{label}</div>
          </button>
        ))}
      </div>

      {/* Section C — Sub-tab nav */}
      <div className="ah-sub-tab-nav" role="tablist">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={subTab === tab.id}
            className={`ah-sub-tab-btn${subTab === tab.id ? ' active' : ''}`}
            onClick={() => setSubTab(tab.id)}
          >
            <Icon name={tab.icon} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Section D — Tab content */}
      {subTab === 'list' && (
        <div className="ah-table-wrap">
          {/* Filter bar */}
          <div
            className="ah-filter-bar"
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(0,117,96,0.02)',
            }}
          >
            <FilterSelect
              label="Criticality"
              value={filterSeverity}
              onChange={v => setFilterSeverity(v as AHSeverity | 'all')}
              options={[
                { label: 'All Criticality', value: 'all' },
                { label: 'Critical', value: 'critical' },
                { label: 'High',     value: 'high' },
                { label: 'Medium',   value: 'medium' },
                { label: 'Low',      value: 'low' },
              ]}
            />
            <FilterSelect
              label="Status"
              value={filterStatus}
              onChange={v => setFilterStatus(v as AHIncidentStatus | 'all')}
              options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Open',         value: 'open' },
                { label: 'In Progress',  value: 'in_progress' },
                { label: 'Resolved',     value: 'resolved' },
              ]}
            />
            <FilterSelect
              label="Incident Type"
              value={filterType}
              onChange={v => setFilterType(v as AHIncidentType | 'all')}
              options={[
                { label: 'All Types',        value: 'all' },
                { label: 'AI Agent',         value: 'ai_agent' },
                { label: 'SAP',              value: 'sap' },
                { label: 'Business Process', value: 'business_process' },
                { label: 'Knowledge Gap',    value: 'knowledge_gap' },
              ]}
            />
            <FilterSelect
              label="Assigned Team"
              value={filterTeam}
              onChange={setFilterTeam}
              options={[{ label: 'All Teams', value: 'all' }, ...allTeams.map(t => ({ label: t, value: t }))]}
            />
            <FilterSelect
              label="Use Case"
              value={filterUC}
              onChange={setFilterUC}
              options={[{ label: 'All Use Cases', value: 'all' }, ...ucOptions]}
            />
            <div>
              <div className="ah-filter-label">Date From</div>
              <input
                type="date"
                className="ah-select"
                value={filterDateFrom}
                onChange={e => setFilterDateFrom(e.target.value)}
              />
            </div>
            <div>
              <div className="ah-filter-label">Date To</div>
              <input
                type="date"
                className="ah-select"
                value={filterDateTo}
                onChange={e => setFilterDateTo(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <div style={{ alignSelf: 'flex-end' }}>
                <div className="ah-filter-label">&nbsp;</div>
                <button
                  className="ah-stream-drill-btn"
                  onClick={clearFilters}
                >
                  <Icon name="bi-x-circle" /> Clear
                </button>
              </div>
            )}
            <div
              style={{
                marginLeft: 'auto',
                alignSelf: 'flex-end',
                fontSize: 12,
                color: 'var(--text-muted)',
                marginBottom: 2,
                whiteSpace: 'nowrap',
              }}
            >
              {filtered.length} of {incidents.length} incidents
            </div>
          </div>

          {/* Incident table */}
          <table className="ah-table">
            <thead>
              <tr>
                <th>Incident No</th>
                <th>Description</th>
                <th>Use Case</th>
                <th>Type</th>
                <th>Assigned Team</th>
                <th>Date</th>
                <th>Status</th>
                <th>Days</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inc, idx) => {
                const days     = daysSince(inc.reportedDate)
                const slaDays  = AH_SLA_DAYS[inc.severity]
                const breached = inc.status !== 'resolved' && days > slaDays
                const ucName   = inc.useCaseId
                  ? (ucMap.get(inc.useCaseId) ?? '—')
                  : (useCases.find(u => u.agentId === inc.agentId)?.name ?? '—')
                const team = getAssignedTeam(inc.type, inc.division)

                return (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    style={{
                      background: idx % 2 === 1 ? 'rgba(0,117,96,0.02)' : undefined,
                      borderLeft: `3px solid ${SEV_COLORS[inc.severity]}40`,
                      cursor: 'pointer',
                    }}
                    className={inc.changeManagementTriggered ? 'ah-row-cm' : ''}
                  >
                    <td>
                      <span className={sevClass(inc.severity)} style={{ fontSize: 10.5 }}>
                        {inc.severity.toUpperCase().slice(0, 4)}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{inc.id.toUpperCase()}</div>
                      {inc.changeManagementTriggered && (
                        <span style={{ fontSize: 10, color: '#ca8a04', marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Icon name="bi-flag-fill" /> CM
                        </span>
                      )}
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12.5,
                          overflow: 'hidden',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {inc.title}
                      </div>
                    </td>
                    <td style={{ fontSize: 11.5, color: 'var(--text-muted)', maxWidth: 180 }}>{ucName}</td>
                    <td><span className={typeClass(inc.type)}>{typeLabel(inc.type)}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{team}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{inc.reportedDate}</td>
                    <td><span className={statusClass(inc.status)}>{statusLabel(inc.status)}</span></td>
                    <td>
                      <div
                        className="ah-days-col"
                        onMouseEnter={e => handleSLAEnter(e, inc.severity)}
                        onMouseLeave={() => setSlaTooltip(null)}
                      >
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: breached ? '#dc2626' : '#007560',
                            lineHeight: 1,
                          }}
                        >
                          {days}
                        </div>
                        {breached ? (
                          <div style={{ fontSize: 10, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Icon name="bi-exclamation-triangle-fill" /> SLA breached
                          </div>
                        ) : (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SLA: {AH_SLA_LABEL[inc.severity]}</div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>
                    <Icon name="bi-inbox" style={{ fontSize: 28 }} />
                    <div style={{ marginTop: 8, fontSize: 14 }}>No incidents match this filter</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {subTab === 'knowledge-gaps' && (
        <KnowledgeGapsPanel onSelectIncident={setSelectedIncident} />
      )}

      {subTab === 'change-management' && (
        <ChangeManagementPanel />
      )}

      {/* Panels */}
      {selectedIncident && (
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdate={() => {
            void (async () => {
              await new Promise(r => setTimeout(r, 600))
              await refreshIncidents()
            })()
            setSelectedIncident(null)
          }}
        />
      )}

      {showForm && (
        <IncidentFormPanel
          onClose={() => setShowForm(false)}
          onAdded={() => {
            void (async () => {
              await new Promise(r => setTimeout(r, 600))
              await refreshIncidents()
            })()
          }}
        />
      )}

      {/* SLA Tooltip (fixed position) */}
      {slaTooltip && (
        <div
          className="ah-sla-tooltip"
          style={{ left: slaTooltip.x, top: slaTooltip.y }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 11.5 }}>SLA Thresholds</div>
          <table style={{ borderCollapse: 'collapse', fontSize: 11.5 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', color: 'rgba(255,255,255,0.6)', paddingRight: 16, paddingBottom: 6, fontWeight: 600 }}>Severity</th>
                <th style={{ textAlign: 'right', color: 'rgba(255,255,255,0.6)', paddingBottom: 6, fontWeight: 600 }}>SLA</th>
              </tr>
            </thead>
            <tbody>
              {(['critical', 'high', 'medium', 'low'] as AHSeverity[]).map(sev => (
                <tr key={sev} style={{ background: sev === slaTooltip.sev ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
                  <td
                    style={{
                      padding: '4px 16px 4px 6px',
                      textTransform: 'capitalize',
                      color: SEV_COLORS[sev],
                      fontWeight: sev === slaTooltip.sev ? 700 : 400,
                    }}
                  >
                    {sev}
                  </td>
                  <td
                    style={{
                      textAlign: 'right',
                      padding: '4px 6px',
                      color: '#fff',
                      fontWeight: sev === slaTooltip.sev ? 700 : 400,
                    }}
                  >
                    {AH_SLA_LABEL[sev]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
