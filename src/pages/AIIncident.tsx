import { useState, useEffect, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts'
import '../ai-incident.css'
import { Cr978_coe_aiincidentsService } from '../generated'
import type { Cr978_coe_aiincidents } from '../generated/models/Cr978_coe_aiincidentsModel'
import Icon from '../components/Icon'
import { useScrollLock } from '../hooks/useScrollLock'
import DataSourceBadge from '../components/DataSourceBadge'

// ── Types ─────────────────────────────────────────────────────────────────────

type IncidentStatus   = 'Open' | 'In Progress' | 'Resolved' | 'Closed'
type IncidentPriority = 'Critical' | 'High' | 'Medium' | 'Low'
type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'

interface AIIncidentRecord {
  id: string
  ticketNo: string
  name: string
  platform: string
  type: string
  tags: string[]
  summary: string
  happenedOn: string
  dataRisk: boolean
  priority: IncidentPriority
  severity: IncidentSeverity
  reportedBy: string
  additionalInfo: string
  peopleAffected: number
  status: IncidentStatus
  assignedTo: string
  // Timeline
  createdOn?: string
  reportedOn?: string
  acknowledgedOn?: string
  resolvedOn?: string
  closedOn?: string
}

// ── Dataverse mapper ──────────────────────────────────────────────────────────

function toSafeStatus(s: string | undefined): IncidentStatus {
  const map: Record<string, IncidentStatus> = {
    'open': 'Open', 'in progress': 'In Progress',
    'resolved': 'Resolved', 'closed': 'Closed',
  }
  return map[(s ?? '').toLowerCase()] ?? 'Open'
}

function toSafePriority(s: string | undefined): IncidentPriority {
  const map: Record<string, IncidentPriority> = {
    'critical': 'Critical', 'high': 'High', 'medium': 'Medium', 'low': 'Low',
  }
  return map[(s ?? '').toLowerCase()] ?? 'Medium'
}

function toSafeSeverity(s: string | undefined): IncidentSeverity {
  const v = (s ?? '').toUpperCase()
  return (['P1', 'P2', 'P3', 'P4'] as IncidentSeverity[]).includes(v as IncidentSeverity)
    ? (v as IncidentSeverity)
    : 'P3'
}

function mapRecord(r: Cr978_coe_aiincidents): AIIncidentRecord {
  return {
    id:              r.cr978_coe_aiincidentid,
    ticketNo:        r.cr978_coe_ticketnumber ?? '—',
    name:            r.cr978_incidentname ?? r.cr978_coe_title ?? 'Unnamed Incident',
    platform:        r.cr978_coe_platform ?? '—',
    type:            r.cr978_coe_incident_type ?? 'Other',
    tags:            r.cr978_coe_ai_incident_tags
                       ? r.cr978_coe_ai_incident_tags.split(',').map(t => t.trim()).filter(Boolean)
                       : [],
    summary:         r.cr978_coe_description ?? '',
    happenedOn:      (r.cr978_incidentdate ?? r.createdon ?? '').split('T')[0],
    dataRisk:        !!r.cr978_coe_isdatarisk,
    priority:        toSafePriority(r.cr978_coe_priority),
    severity:        toSafeSeverity(r.cr978_coe_severity),
    reportedBy:      r.cr978_coe_repotedby ?? '—',
    additionalInfo:  r.cr978_coe_rootcause ?? '',
    peopleAffected:  parseInt(r.cr978_coe_noofpeopleaffected ?? '0', 10) || 0,
    status:          toSafeStatus(r.cr978_coe_status),
    assignedTo:      r.owneridname ?? 'Unassigned',
    createdOn:       r.createdon,
    reportedOn:      r.cr978_coe_reportedon,
    acknowledgedOn:  r.cr978_coe_acknowledgedon,
    resolvedOn:      r.cr978_coe_resolvedon,
    closedOn:        r.cr978_coe_closedon,
  }
}

// ── Colour maps ───────────────────────────────────────────────────────────────

const PRIORITY_C: Record<IncidentPriority, { color: string; bg: string; border: string }> = {
  Critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.22)' },
  High:     { color: '#ea580c', bg: 'rgba(234,88,12,0.08)',  border: 'rgba(234,88,12,0.22)' },
  Medium:   { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   border: 'rgba(202,138,4,0.2)'  },
  Low:      { color: '#007560', bg: 'rgba(0,117,96,0.08)',   border: 'rgba(0,117,96,0.2)'   },
}
const PRIORITY_COLORS: Record<IncidentPriority, string> = {
  Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#007560',
}

const SEVERITY_C: Record<IncidentSeverity, { color: string; bg: string }> = {
  P1: { color: '#dc2626', bg: 'rgba(220,38,38,0.1)'  },
  P2: { color: '#ea580c', bg: 'rgba(234,88,12,0.1)'  },
  P3: { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)'  },
  P4: { color: '#007560', bg: 'rgba(0,117,96,0.08)'  },
}

const STATUS_C: Record<IncidentStatus, { color: string; bg: string; border: string; dot: string }> = {
  'Open':        { color: '#dc2626', bg: 'rgba(220,38,38,0.08)',   border: 'rgba(220,38,38,0.22)',   dot: '#dc2626' },
  'In Progress': { color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',    border: 'rgba(202,138,4,0.22)',   dot: '#ca8a04' },
  'Resolved':    { color: '#007560', bg: 'rgba(0,117,96,0.1)',     border: 'rgba(0,117,96,0.22)',    dot: '#007560' },
  'Closed':      { color: '#78716c', bg: 'rgba(120,113,108,0.08)', border: 'rgba(120,113,108,0.18)', dot: '#78716c' },
}

const PRIORITY_BORDER: Record<IncidentPriority, string> = {
  Critical: '#dc2626', High: '#ea580c', Medium: '#ca8a04', Low: '#007560',
}

// Type colors — explicit map so each incident type gets a stable, meaningful colour.
// Unknown types cycle through the fallback palette by their first character code.
const TYPE_COLOUR_MAP: Record<string, string> = {
  'Bias / Fairness':       '#ca8a04',
  'Data Privacy':          '#dc2626',
  'Cybersecurity':         '#7c3aed',
  'Reliability':           '#007560',
  'Vendor Risk':           '#004937',
  'Model Hallucination':   '#ea580c',
  'Prompt Injection':      '#b91c1c',
  'Unauthorised Access':   '#0891b2',
  'Data Leakage':          '#6d28d9',
  'Performance Degradation': '#15803d',
}
const TYPE_FALLBACK_PALETTE = [
  '#7c3aed', '#dc2626', '#ea580c', '#004937',
  '#b91c1c', '#ca8a04', '#007560', '#0891b2',
  '#6d28d9', '#15803d',
]
function typeColor(type: string): string {
  if (TYPE_COLOUR_MAP[type]) return TYPE_COLOUR_MAP[type]
  // Deterministic fallback based on string hash so the same type always gets the same colour
  const hash = type.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return TYPE_FALLBACK_PALETTE[hash % TYPE_FALLBACK_PALETTE.length]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Chart Tooltips ────────────────────────────────────────────────────────────

function BarTip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(28,28,30,0.92)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{payload[0].value} incidents</div>
    </div>
  )
}

function PieTip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={{ background: 'rgba(28,28,30,0.92)', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: p.payload.color, fontWeight: 600, marginBottom: 2 }}>{p.name}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{p.value} incidents</div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function IncidentModal({ inc, onClose }: { inc: AIIncidentRecord; onClose: () => void }) {
  useScrollLock()
  const sC   = STATUS_C[inc.status]
  const pC   = PRIORITY_C[inc.priority]
  const sevC = SEVERITY_C[inc.severity]
  const tColor = typeColor(inc.type)

  const timelineSteps: { label: string; date: string | undefined; color: string; alwaysShow: boolean }[] = [
    { label: 'Incident Reported',  date: inc.reportedOn ?? inc.createdOn,  color: '#007560', alwaysShow: true  },
    { label: 'Acknowledged',       date: inc.acknowledgedOn,               color: '#ca8a04', alwaysShow: false },
    { label: 'Resolved',           date: inc.resolvedOn,                   color: '#004937', alwaysShow: false },
    { label: 'Closed',             date: inc.closedOn,                     color: '#78716c', alwaysShow: false },
  ]
  // Always show all steps; mark future ones as pending
  const lastDoneIdx = timelineSteps.reduce((acc, s, i) => s.date ? i : acc, -1)

  return (
    <div className="inc-modal-backdrop" onClick={onClose}>
      <div
        className="inc-modal-panel"
        style={{ borderTop: `3px solid ${PRIORITY_BORDER[inc.priority]}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="inc-modal-header">
          <div className="inc-modal-header-top">
            <div>
              <div className="inc-modal-ticket">{inc.ticketNo}</div>
              <div className="inc-modal-name">{inc.name}</div>
            </div>
            <button className="inc-modal-close" onClick={onClose}>
              <Icon name="bi-x-lg" />
            </button>
          </div>
          <div className="inc-modal-badges">
            <span className="inc-status-badge" style={{ color: sC.color, background: sC.bg, border: `1px solid ${sC.border}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: sC.dot, flexShrink: 0 }} />
              {inc.status}
            </span>
            <span className="inc-priority-badge" style={{ color: pC.color, background: pC.bg, border: `1px solid ${pC.border}` }}>
              <Icon name="bi-flag-fill" style={{ fontSize: 9, marginRight: 4 }} />{inc.priority}
            </span>
            <span className="inc-sev-badge" style={{ color: sevC.color, background: sevC.bg, border: `1px solid ${sevC.color}35` }}>
              {inc.severity}
            </span>
            <span className="inc-type-badge" style={{ color: tColor, background: `${tColor}12`, border: `1px solid ${tColor}25` }}>
              {inc.type}
            </span>
            {inc.dataRisk && (
              <span style={{ color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="bi-shield-exclamation" style={{ fontSize: 10 }} /> Data Risk
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="inc-modal-body">

          {/* Meta grid */}
          <div className="inc-meta-grid">
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Ticket No</div>
              <div className="inc-meta-value" style={{ fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", fontSize: 12 }}>{inc.ticketNo}</div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Happened On</div>
              <div className="inc-meta-value">{fmtDate(inc.happenedOn)}</div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Severity</div>
              <div className="inc-meta-value">
                <span className="inc-sev-badge" style={{ color: sevC.color, background: sevC.bg }}>{inc.severity}</span>
              </div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Priority</div>
              <div className="inc-meta-value">
                <span className="inc-priority-badge" style={{ color: pC.color, background: pC.bg, border: `1px solid ${pC.border}` }}>{inc.priority}</span>
              </div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">People Affected</div>
              <div className="inc-meta-value" style={{ color: inc.peopleAffected > 100 ? '#dc2626' : inc.peopleAffected > 0 ? '#ca8a04' : '#007560' }}>
                {inc.peopleAffected > 0 ? inc.peopleAffected.toLocaleString() : 'None'}
              </div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Data Risk</div>
              <div className="inc-meta-value" style={{ color: inc.dataRisk ? '#dc2626' : '#007560' }}>
                {inc.dataRisk
                  ? <><Icon name="bi-exclamation-triangle-fill" style={{ marginRight: 4 }} />Yes</>
                  : <><Icon name="bi-check-circle-fill" style={{ marginRight: 4 }} />No</>
                }
              </div>
            </div>
            <div className="inc-meta-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="inc-meta-label">Platform</div>
              <div className="inc-meta-value">{inc.platform}</div>
            </div>
            <div className="inc-meta-cell">
              <div className="inc-meta-label">Reported By</div>
              <div className="inc-meta-value">{inc.reportedBy}</div>
            </div>
            <div className="inc-meta-cell" style={{ gridColumn: 'span 2' }}>
              <div className="inc-meta-label">Assigned To</div>
              <div className="inc-meta-value" style={{ color: inc.assignedTo === 'Unassigned' ? '#dc2626' : '#1c1c1e' }}>{inc.assignedTo}</div>
            </div>
          </div>

          {/* Tags */}
          {inc.tags.length > 0 && (
            <div>
              <div className="inc-section-label"><Icon name="bi-tags-fill" /> Tags</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {inc.tags.map(t => <span key={t} className="inc-tag">{t}</span>)}
              </div>
            </div>
          )}

          {/* Summary */}
          {inc.summary && (
            <div>
              <div className="inc-section-label"><Icon name="bi-file-text" /> Summary</div>
              <p className="inc-body-text">{inc.summary}</p>
            </div>
          )}

          {/* Additional info */}
          {inc.additionalInfo && (
            <div>
              <div className="inc-section-label"><Icon name="bi-info-circle-fill" /> Root Cause / Additional Information</div>
              <p className="inc-body-text">{inc.additionalInfo}</p>
            </div>
          )}

          {/* Activity Timeline */}
          <div>
            <div className="inc-section-label"><Icon name="bi-clock-history" /> Activity Timeline</div>
            <div className="inc-timeline">
              {timelineSteps.map((step, i) => {
                const isDone    = !!step.date
                const isPending = !isDone && i > lastDoneIdx
                const isLast    = i === timelineSteps.length - 1
                return (
                  <div key={step.label} className={`inc-tl-item${isPending ? ' pending' : ''}`}>
                    <div className="inc-tl-spine">
                      <div
                        className="inc-tl-dot"
                        style={{ color: isDone ? step.color : undefined, background: isDone ? step.color : undefined }}
                      />
                      {!isLast && <div className="inc-tl-connector" />}
                    </div>
                    <div className="inc-tl-content">
                      <div className="inc-tl-label">{step.label}</div>
                      <div className="inc-tl-date">
                        {isDone ? fmtDateTime(step.date) : 'Pending'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Close */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(0,117,96,0.18)', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AIIncident() {
  const [incidents,      setIncidents]      = useState<AIIncidentRecord[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState<string | null>(null)
  const [statusFilter,   setStatusFilter]   = useState<IncidentStatus | 'All'>('All')
  const [priorityFilter, setPriorityFilter] = useState<'All' | IncidentPriority>('All')
  const [typeFilter,     setTypeFilter]     = useState<string>('All')
  const [search,         setSearch]         = useState('')
  const [selected,       setSelected]       = useState<AIIncidentRecord | null>(null)

  useEffect(() => {
    Cr978_coe_aiincidentsService.getAll()
      .then(result => {
        if (result.data) setIncidents(result.data.map(mapRecord))
      })
      .catch((err: unknown) => {
        console.error('[AIIncident] Failed to load incidents:', err instanceof Error ? err.message : String(err))
        setError('Failed to load incidents from Dataverse.')
      })
      .finally(() => setLoading(false))
  }, [])

  const allTypes = useMemo(
    () => [...new Set(incidents.map(i => i.type))].sort(),
    [incidents]
  )

  const counts = useMemo(() => ({
    total:      incidents.length,
    open:       incidents.filter(i => i.status === 'Open').length,
    inProgress: incidents.filter(i => i.status === 'In Progress').length,
    resolved:   incidents.filter(i => i.status === 'Resolved').length,
    dataRisk:   incidents.filter(i => i.dataRisk).length,
  }), [incidents])

  // Chart data — by type
  const typeChartData = useMemo(() =>
    allTypes.map(t => ({ name: t, count: incidents.filter(i => i.type === t).length, color: typeColor(t) }))
      .sort((a, b) => b.count - a.count),
    [incidents, allTypes]
  )

  // Chart data — by priority
  const priorityChartData = useMemo(() =>
    (['Critical', 'High', 'Medium', 'Low'] as IncidentPriority[])
      .map(p => ({ name: p, value: incidents.filter(i => i.priority === p).length, color: PRIORITY_COLORS[p] }))
      .filter(d => d.value > 0),
    [incidents]
  )
  const totalForDonut = priorityChartData.reduce((a, d) => a + d.value, 0)

  const STATUS_ORDER: Record<IncidentStatus, number> = { 'Open': 0, 'In Progress': 1, 'Resolved': 2, 'Closed': 3 }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return incidents.filter(i => {
      const matchQ = !q || i.name.toLowerCase().includes(q) || i.ticketNo.toLowerCase().includes(q) ||
                     i.platform.toLowerCase().includes(q) || i.reportedBy.toLowerCase().includes(q) ||
                     i.assignedTo.toLowerCase().includes(q) || i.type.toLowerCase().includes(q)
      const matchS = statusFilter   === 'All' || i.status   === statusFilter
      const matchP = priorityFilter === 'All' || i.priority === priorityFilter
      const matchT = typeFilter     === 'All' || i.type     === typeFilter
      return matchQ && matchS && matchP && matchT
    }).sort((a, b) => {
      if (STATUS_ORDER[a.status] !== STATUS_ORDER[b.status])
        return STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      return b.happenedOn.localeCompare(a.happenedOn)
    })
  }, [search, statusFilter, priorityFilter, typeFilter, incidents])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>AI Incidents</h1>
          <p>Track, investigate and resolve AI-related incidents across all DEWA divisions</p>
        </div>
        <DataSourceBadge type="simulated" title="Dummy data fed through AI agent" lastUpdated="13 May 2026" />
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="kpi-4-grid" style={{ gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Incidents',   value: counts.total,      icon: 'bi-shield-exclamation',      bg: 'rgba(0,117,96,0.08)',   color: '#007560' },
          { label: 'Open',              value: counts.open,       icon: 'bi-exclamation-circle-fill', bg: 'rgba(220,38,38,0.08)', color: '#dc2626' },
          { label: 'In Progress',       value: counts.inProgress, icon: 'bi-arrow-repeat',            bg: 'rgba(202,138,4,0.1)',  color: '#ca8a04' },
          { label: 'Data Risk Flagged', value: counts.dataRisk,   icon: 'bi-database-exclamation',    bg: 'rgba(234,88,12,0.08)', color: '#ea580c' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid rgba(0,117,96,0.12)', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <Icon name={s.icon} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      {!loading && incidents.length > 0 && (
        <div className="inc-charts-row">

          {/* Incidents by Type */}
          <div className="inc-chart-card">
            <div className="inc-chart-title">
              <Icon name="bi-bar-chart-horizontal-fill" /> Incidents by Type
            </div>
            <ResponsiveContainer width="100%" height={Math.max(160, typeChartData.length * 34)}>
              <BarChart
                data={typeChartData}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 4, bottom: 0 }}
                barSize={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(0,117,96,0.04)' }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="count" name="Incidents" radius={[0, 5, 5, 0]}
                  label={{ position: 'right', fontSize: 11, fontWeight: 700, fill: '#374151' }}>
                  {typeChartData.map(d => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Incidents by Priority — donut */}
          <div className="inc-chart-card">
            <div className="inc-chart-title">
              <Icon name="bi-pie-chart-fill" /> Incidents by Priority
            </div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {priorityChartData.map(d => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1c1e', lineHeight: 1 }}>{totalForDonut}</div>
                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>incidents</div>
              </div>
            </div>
            <div className="inc-chart-legend">
              {priorityChartData.map(d => (
                <div key={d.name} className="inc-chart-legend-item">
                  <div className="inc-chart-legend-dot" style={{ background: d.color }} />
                  <span style={{ color: d.color, fontWeight: 600 }}>{d.name}</span>
                  <span>({d.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="inc-filter-bar">
        <input
          className="inc-search"
          placeholder="Search by name, ticket, platform, type, assignee…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="inc-status-pills">
          {(['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as (IncidentStatus | 'All')[]).map(s => (
            <button key={s} className={`inc-pill${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s}
            </button>
          ))}
        </div>
        <select className="inc-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as 'All' | IncidentPriority)}>
          <option value="All">All Priorities</option>
          {(['Critical', 'High', 'Medium', 'Low'] as IncidentPriority[]).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select className="inc-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="All">All Types</option>
          {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <span className="inc-result-count">
          {loading ? 'Loading…' : `${filtered.length} of ${incidents.length} incidents`}
        </span>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', color: '#9ca3af', fontSize: 14 }}>
          <Icon name="bi-arrow-repeat" style={{ fontSize: 28, marginBottom: 10, animation: 'spin 1s linear infinite' }} />
          Loading incidents…
        </div>
      )}

      {/* ── Desktop table ── */}
      {!loading && (
        <div className="inc-table-wrap">
          <table className="inc-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Incident Name</th>
                <th>Type</th>
                <th>Platform</th>
                <th>Sev</th>
                <th>Priority</th>
                <th>Affected</th>
                <th>Date</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => {
                const sC   = STATUS_C[inc.status]
                const pC   = PRIORITY_C[inc.priority]
                const sevC = SEVERITY_C[inc.severity]
                const tColor = typeColor(inc.type)
                return (
                  <tr
                    key={inc.id}
                    className="inc-row"
                    style={{ borderLeftColor: PRIORITY_BORDER[inc.priority] }}
                    onClick={() => setSelected(inc)}
                  >
                    <td><code className="inc-ticket-code">{inc.ticketNo}</code></td>
                    <td>
                      <div className="inc-name-cell">
                        <span className="inc-name">{inc.name}</span>
                        {inc.dataRisk && (
                          <span className="inc-data-risk-chip">
                            <Icon name="bi-shield-exclamation" /> Data Risk
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="inc-type-badge" style={{ color: tColor, background: `${tColor}12` }}>
                        {inc.type}
                      </span>
                    </td>
                    <td><span className="inc-platform">{inc.platform}</span></td>
                    <td>
                      <span className="inc-sev-badge" style={{ color: sevC.color, background: sevC.bg }}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className="inc-priority-badge" style={{ color: pC.color, background: pC.bg, border: `1px solid ${pC.border}` }}>
                        {inc.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, fontWeight: 700, color: inc.peopleAffected > 100 ? '#dc2626' : inc.peopleAffected > 0 ? '#ca8a04' : '#9ca3af' }}>
                        {inc.peopleAffected > 0 ? inc.peopleAffected.toLocaleString() : '—'}
                      </span>
                    </td>
                    <td><span className="inc-date">{fmtDate(inc.happenedOn)}</span></td>
                    <td>
                      <span className="inc-status-badge" style={{ color: sC.color, background: sC.bg, border: `1px solid ${sC.border}` }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: sC.dot, flexShrink: 0 }} />
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <span className="inc-assignee" style={{ color: inc.assignedTo === 'Unassigned' ? '#dc2626' : '#374151' }}>
                        {inc.assignedTo}
                      </span>
                    </td>
                    <td>
                      <button className="inc-view-btn" onClick={e => { e.stopPropagation(); setSelected(inc) }}>
                        <Icon name="bi-arrow-right" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ padding: '48px 24px', color: '#9ca3af' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Icon name="bi-shield-check" style={{ fontSize: 32, marginBottom: 10 }} />
                      No incidents match the current filters
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile card list ── */}
      {!loading && (
        <div className="inc-card-list">
          {filtered.map(inc => {
            const sC   = STATUS_C[inc.status]
            const pC   = PRIORITY_C[inc.priority]
            const sevC = SEVERITY_C[inc.severity]
            const tColor = typeColor(inc.type)
            return (
              <div
                key={inc.id}
                className="inc-card"
                style={{ borderLeftColor: PRIORITY_BORDER[inc.priority] }}
                onClick={() => setSelected(inc)}
              >
                <div className="inc-card-top">
                  <code className="inc-ticket-code">{inc.ticketNo}</code>
                  <span className="inc-status-badge" style={{ color: sC.color, background: sC.bg, border: `1px solid ${sC.border}` }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: sC.dot, flexShrink: 0 }} />
                    {inc.status}
                  </span>
                </div>
                <div className="inc-card-name">{inc.name}</div>
                <div className="inc-card-meta">
                  <span className="inc-sev-badge" style={{ color: sevC.color, background: sevC.bg }}>{inc.severity}</span>
                  <span className="inc-priority-badge" style={{ color: pC.color, background: pC.bg, border: `1px solid ${pC.border}` }}>{inc.priority}</span>
                  <span className="inc-type-badge" style={{ color: tColor, background: `${tColor}12` }}>{inc.type}</span>
                  {inc.dataRisk && (
                    <span className="inc-data-risk-chip"><Icon name="bi-shield-exclamation" /> Risk</span>
                  )}
                </div>
                <div className="inc-card-footer-row">
                  <span style={{ fontSize: 11, color: '#a8a29e' }}>
                    <Icon name="bi-calendar3" style={{ marginRight: 4 }} />{fmtDate(inc.happenedOn)}
                  </span>
                  <span style={{ fontSize: 11, color: inc.assignedTo === 'Unassigned' ? '#dc2626' : '#a8a29e' }}>
                    <Icon name="bi-person" style={{ marginRight: 4 }} />{inc.assignedTo}
                  </span>
                  {inc.peopleAffected > 0 && (
                    <span style={{ fontSize: 11, color: '#a8a29e' }}>
                      <Icon name="bi-people" style={{ marginRight: 4 }} />{inc.peopleAffected.toLocaleString()} affected
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1px solid rgba(0,117,96,0.12)', color: '#9ca3af' }}>
              <Icon name="bi-shield-check" style={{ fontSize: 32, marginBottom: 10 }} />
              No incidents match the current filters
            </div>
          )}
        </div>
      )}

      {selected && <IncidentModal inc={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
