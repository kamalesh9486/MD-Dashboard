import { useState } from 'react'
import Icon from '../../../components/Icon'
import { AH_INCIDENTS, AH_USE_CASES, AH_SLA_DAYS, AH_SLA_LABEL, type AHSeverity, type AHIncidentStatus, type AHIncidentType } from '../data'

const SEV_COLORS: Record<AHSeverity, string> = {
  critical: '#dc2626', high: '#f97316', medium: '#f59e0b', low: '#94a3b8',
}

function sevClass(s: AHSeverity) {
  return s === 'critical' ? 'ah-badge ah-sev-critical' : s === 'high' ? 'ah-badge ah-sev-high' : s === 'medium' ? 'ah-badge ah-sev-medium' : 'ah-badge ah-sev-low'
}
function statusClass(s: AHIncidentStatus) {
  return s === 'open' ? 'ah-badge ah-inc-open' : s === 'in_progress' ? 'ah-badge ah-inc-in-progress' : 'ah-badge ah-inc-resolved'
}
function statusLabel(s: AHIncidentStatus) {
  return s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
}
function typeClass(t: AHIncidentType) {
  return t === 'ai_agent' ? 'ah-badge ah-type-ai-agent' : t === 'sap' ? 'ah-badge ah-type-sap' : t === 'business_process' ? 'ah-badge ah-type-business-process' : 'ah-badge ah-type-knowledge-gap'
}
function typeLabel(t: AHIncidentType) {
  return t === 'ai_agent' ? 'AI Agent' : t === 'sap' ? 'SAP' : t === 'business_process' ? 'Business Process' : 'Knowledge Gap'
}
function getAssignedTeam(t: AHIncidentType, div: string): string {
  if (t === 'ai_agent' && div === 'Finance') return 'AI Engineering'
  if (t === 'ai_agent') return 'AI Automation'
  if (t === 'sap') return 'SAP Function'
  if (t === 'knowledge_gap') return 'AI Adoption'
  return `${div} Operations`
}
function daysSince(dateStr: string): number {
  const d = new Date(dateStr)
  return Math.round((Date.now() - d.getTime()) / 86_400_000)
}

interface SLATooltip { x: number; y: number; sev: AHSeverity }

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

interface IncidentsSectionProps {
  onNavigate?: (tab: string) => void
}

export default function IncidentsSection({ onNavigate }: IncidentsSectionProps) {
  const [filterSeverity, setFilterSeverity] = useState<AHSeverity | 'all'>('all')
  const [filterStatus,   setFilterStatus]   = useState<AHIncidentStatus | 'all'>('all')
  const [filterType,     setFilterType]     = useState<AHIncidentType | 'all'>('all')
  const [filterTeam,     setFilterTeam]     = useState('all')
  const [filterUC,       setFilterUC]       = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo,   setFilterDateTo]   = useState('')
  const [slaTooltip,     setSlaTooltip]     = useState<SLATooltip | null>(null)

  const hasActiveFilters = filterSeverity !== 'all' || filterStatus !== 'all' || filterType !== 'all' ||
    filterTeam !== 'all' || filterUC !== 'all' || filterDateFrom !== '' || filterDateTo !== ''

  const allTeams  = [...new Set(AH_INCIDENTS.map(i => getAssignedTeam(i.type, i.division)))].sort()
  const allUCIds  = [...new Set(AH_INCIDENTS.map(i => i.agentId))]
  const ucOptions = allUCIds.flatMap(aid => AH_USE_CASES.filter(u => u.agentId === aid).map(u => ({ label: u.name, value: u.id })))

  const filtered = AH_INCIDENTS.filter(i => {
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) return false
    if (filterStatus   !== 'all' && i.status   !== filterStatus)   return false
    if (filterType     !== 'all' && i.type     !== filterType)     return false
    if (filterTeam     !== 'all' && getAssignedTeam(i.type, i.division) !== filterTeam) return false
    if (filterUC       !== 'all' && !AH_USE_CASES.filter(u => u.agentId === i.agentId).some(u => u.id === filterUC)) return false
    if (filterDateFrom && i.reportedDate < filterDateFrom) return false
    if (filterDateTo   && i.reportedDate > filterDateTo)   return false
    return true
  })

  const countBySev = (s: AHSeverity) => AH_INCIDENTS.filter(i => i.severity === s).length
  const countByStat = (s: AHIncidentStatus) => AH_INCIDENTS.filter(i => i.status === s).length

  function handleSLAEnter(e: React.MouseEvent, sev: AHSeverity) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setSlaTooltip({ x: r.right + 8, y: r.top, sev })
  }

  return (
    <div className="ah-table-wrap">
      <div className="ah-table-header">
        <div>
          <div className="ah-table-title">AI Usecase Health — Incident Stream</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {AH_INCIDENTS.filter(i => i.status !== 'resolved').length} open · {AH_INCIDENTS.filter(i => i.changeManagementTriggered).length} CM-triggered
          </div>
        </div>
        <button
          className="ah-pill-btn"
          onClick={() => onNavigate?.('ai-health')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          View All Incidents <Icon name="bi-arrow-right" />
        </button>
      </div>

      {/* Summary tile row */}
      <div className="ah-summary-tile-row">
        {/* Total tile */}
        <button
          className="ah-sev-tile"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-card)', borderRadius: 10, padding: '14px 20px', cursor: 'pointer', textAlign: 'left' }}
          onClick={() => { setFilterSeverity('all'); setFilterStatus('all') }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{AH_INCIDENTS.length}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Total Incidents</div>
        </button>

        {/* Severity tiles */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['critical', 'high', 'medium', 'low'] as AHSeverity[]).map(sev => (
            <button
              key={sev}
              className={`ah-sev-tile${filterSeverity === sev ? ' active' : ''}`}
              style={{
                flex: 1, background: 'var(--surface)', borderRadius: 10, padding: '12px 10px',
                cursor: 'pointer', textAlign: 'center', transition: '.2s',
                border: `2px solid ${filterSeverity === sev ? SEV_COLORS[sev] : 'var(--border-card)'}`,
              }}
              onClick={() => setFilterSeverity(prev => prev === sev ? 'all' : sev)}
            >
              <div style={{ fontSize: 20, fontWeight: 700, color: SEV_COLORS[sev] }}>{countBySev(sev)}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{sev}</div>
            </button>
          ))}
        </div>

        {/* Status tiles */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['open', 'in_progress', 'resolved'] as AHIncidentStatus[]).map(stat => {
            const c = stat === 'open' ? '#dc2626' : stat === 'in_progress' ? '#ca8a04' : '#6b7280'
            return (
              <button
                key={stat}
                className={`ah-sev-tile${filterStatus === stat ? ' active' : ''}`}
                style={{
                  flex: 1, background: 'var(--surface)', borderRadius: 10, padding: '12px 10px',
                  cursor: 'pointer', textAlign: 'center', transition: '.2s',
                  border: `2px solid ${filterStatus === stat ? c : 'var(--border-card)'}`,
                }}
                onClick={() => setFilterStatus(prev => prev === stat ? 'all' : stat)}
              >
                <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{countByStat(stat)}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{stat === 'in_progress' ? 'In Progress' : stat.charAt(0).toUpperCase() + stat.slice(1)}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 7-filter bar */}
      <div className="ah-filter-bar" style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'rgba(0,117,96,0.02)' }}>
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
            { label: 'All Statuses',  value: 'all' },
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
            { label: 'All Types',         value: 'all' },
            { label: 'AI Agent',          value: 'ai_agent' },
            { label: 'SAP',               value: 'sap' },
            { label: 'Business Process',  value: 'business_process' },
            { label: 'Knowledge Gap',     value: 'knowledge_gap' },
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
          <input type="date" className="ah-select" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>
        <div>
          <div className="ah-filter-label">Date To</div>
          <input type="date" className="ah-select" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>
        {hasActiveFilters && (
          <div style={{ alignSelf: 'flex-end' }}>
            <div className="ah-filter-label">&nbsp;</div>
            <button
              className="ah-stream-drill-btn"
              onClick={() => { setFilterSeverity('all'); setFilterStatus('all'); setFilterType('all'); setFilterTeam('all'); setFilterUC('all'); setFilterDateFrom(''); setFilterDateTo('') }}
            >
              <Icon name="bi-x-circle" /> Clear
            </button>
          </div>
        )}
        <div style={{ marginLeft: 'auto', alignSelf: 'flex-end', fontSize: 12, color: 'var(--text-muted)', marginBottom: 2, whiteSpace: 'nowrap' }}>
          {filtered.length} of {AH_INCIDENTS.length} incidents
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
            const days    = daysSince(inc.reportedDate)
            const slaDays = AH_SLA_DAYS[inc.severity]
            const breached = days > slaDays
            const ucName  = AH_USE_CASES.find(u => u.agentId === inc.agentId)?.name ?? '—'
            const team    = getAssignedTeam(inc.type, inc.division)
            return (
              <tr
                key={inc.id}
                style={{
                  background: idx % 2 === 1 ? 'rgba(0,117,96,0.02)' : undefined,
                  borderLeft: `3px solid ${SEV_COLORS[inc.severity]}40`,
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
                  <div style={{ fontWeight: 600, fontSize: 12.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
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
                    style={{ cursor: 'help' }}
                    onMouseEnter={e => handleSLAEnter(e, inc.severity)}
                    onMouseLeave={() => setSlaTooltip(null)}
                  >
                    <div style={{ fontSize: 16, fontWeight: 700, color: breached ? '#dc2626' : '#007560', lineHeight: 1 }}>{days}</div>
                    {breached
                      ? <div style={{ fontSize: 10, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 2 }}><Icon name="bi-exclamation-triangle-fill" /> SLA breached</div>
                      : <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SLA: {AH_SLA_LABEL[inc.severity]}</div>
                    }
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
                  <td style={{ padding: '4px 16px 4px 6px', textTransform: 'capitalize', color: SEV_COLORS[sev], fontWeight: sev === slaTooltip.sev ? 700 : 400 }}>{sev}</td>
                  <td style={{ textAlign: 'right', padding: '4px 6px', color: '#fff', fontWeight: sev === slaTooltip.sev ? 700 : 400 }}>{AH_SLA_LABEL[sev]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
