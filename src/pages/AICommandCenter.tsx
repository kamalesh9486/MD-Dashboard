import { useState, useEffect, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Cr978_powerbidashboardsService } from '../generated'
import type { Cr978_powerbidashboards } from '../generated/models/Cr978_powerbidashboardsModel'
import {
  Cr978_powerbidashboardscr978_status  as STATUS_ENUM,
  Cr978_powerbidashboardscr978_phase   as PHASE_ENUM,
  Cr978_powerbidashboardscr978_priority as PRIORITY_ENUM,
} from '../generated/models/Cr978_powerbidashboardsModel'
import Icon from '../components/Icon'
import DataSourceBadge from '../components/DataSourceBadge'
import LensBriefing    from '../components/LensBriefing'
import '../ai-command-center.css'

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG = {
  Completed:  { label: 'Completed',   icon: 'bi-check-circle-fill',      color: '#007560', bg: 'rgba(0,117,96,0.1)',    border: 'rgba(0,117,96,0.2)'    },
  InProgress: { label: 'In Progress', icon: 'bi-arrow-repeat',           color: '#0284c7', bg: 'rgba(2,132,199,0.1)',   border: 'rgba(2,132,199,0.2)'   },
  OnHold:     { label: 'On Hold',     icon: 'bi-pause-circle-fill',      color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',  border: 'rgba(202,138,4,0.2)'   },
  NotStarted: { label: 'Not Started', icon: 'bi-clock',                  color: '#64748b', bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.2)' },
} as const

// ── Phase config ──────────────────────────────────────────────
const PHASE_CFG = {
  Completed:   { label: 'Completed',   color: '#007560', bg: 'rgba(0,117,96,0.1)',    icon: 'bi-check2-all'        },
  Deployment:  { label: 'Deployment',  color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  icon: 'bi-cloud-upload-fill' },
  Development: { label: 'Development', color: '#0284c7', bg: 'rgba(2,132,199,0.1)',   icon: 'bi-code-slash'        },
  OnHold:      { label: 'On Hold',     color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   icon: 'bi-pause-circle-fill' },
  UAT:         { label: 'UAT',         color: '#9333ea', bg: 'rgba(147,51,234,0.1)',  icon: 'bi-bug-fill'          },
  Pending:     { label: 'Pending',     color: '#64748b', bg: 'rgba(100,116,139,0.1)', icon: 'bi-hourglass-split'   },
} as const

// ── Priority config ───────────────────────────────────────────
const PRIORITY_CFG = {
  High:    { label: 'High',    color: '#dc2626', bg: 'rgba(220,38,38,0.08)',    icon: 'bi-arrow-up-circle-fill'   },
  Medium:  { label: 'Medium',  color: '#ca8a04', bg: 'rgba(202,138,4,0.08)',   icon: 'bi-dash-circle-fill'       },
  Low:     { label: 'Low',     color: '#007560', bg: 'rgba(0,117,96,0.08)',    icon: 'bi-arrow-down-circle-fill' },
  On_Hold: { label: 'On Hold', color: '#64748b', bg: 'rgba(100,116,139,0.08)', icon: 'bi-pause-circle-fill'      },
} as const

type StatusKey   = keyof typeof STATUS_CFG
type PhaseKey    = keyof typeof PHASE_CFG
type PriorityKey = keyof typeof PRIORITY_CFG

function getStatus(r: Cr978_powerbidashboards): StatusKey {
  if (r.cr978_status == null) return 'NotStarted'
  const name = STATUS_ENUM[r.cr978_status]
  return (name in STATUS_CFG) ? (name as StatusKey) : 'NotStarted'
}
function getPhase(r: Cr978_powerbidashboards): PhaseKey | null {
  if (r.cr978_phase == null) return null
  const name = PHASE_ENUM[r.cr978_phase]
  return (name in PHASE_CFG) ? (name as PhaseKey) : null
}
function getPriority(r: Cr978_powerbidashboards): PriorityKey | null {
  if (r.cr978_priority == null) return null
  const name = PRIORITY_ENUM[r.cr978_priority]
  return (name in PRIORITY_CFG) ? (name as PriorityKey) : null
}

const ALL_STATUSES = Object.keys(STATUS_CFG) as StatusKey[]

// ── Chart tooltips ────────────────────────────────────────────
const TOOLTIP_STYLE = {
  background: 'rgba(28,28,30,0.93)', borderRadius: 9,
  padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  color: '#fff',   // fallback so text is always readable on the dark bg
}

function DonutTip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontSize: 11, color: p.payload.color, fontWeight: 700, marginBottom: 2 }}>{p.name}</div>
      <div style={{ fontSize: 13, color: '#fff', fontWeight: 800 }}>{p.value} dashboards</div>
    </div>
  )
}

function BarTip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; payload: { color: string } }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  // phase colour lives on the data entry — access via payload.payload
  const phaseColor = payload[0].payload.color
  return (
    <div style={TOOLTIP_STYLE}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: phaseColor, fontWeight: 800 }}>{payload[0].value} dashboards</div>
    </div>
  )
}

export default function AICommandCenter() {
  const [records,      setRecords]      = useState<Cr978_powerbidashboards[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'All'>('All')

  useEffect(() => {
    let active = true
    setLoading(true)
    Cr978_powerbidashboardsService.getAll()
      .then(res  => { if (active) setRecords(res.data ?? []) })
      .catch(()  => { if (active) setError('Failed to load dashboards.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  // ── Derived counts ────────────────────────────────────────
  const statusCounts = useMemo(() => {
    const c: Record<StatusKey, number> = { Completed: 0, InProgress: 0, OnHold: 0, NotStarted: 0 }
    records.forEach(r => { c[getStatus(r)]++ })
    return c
  }, [records])

  const phaseCounts = useMemo(() => {
    const c: Partial<Record<PhaseKey, number>> = {}
    records.forEach(r => {
      const p = getPhase(r)
      if (p) c[p] = (c[p] ?? 0) + 1
    })
    return c
  }, [records])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records
      .filter(r => {
        const matchSearch =
          !q ||
          (r.cr978_dashboardname ?? '').toLowerCase().includes(q) ||
          (r.cr978_description   ?? '').toLowerCase().includes(q)
        const matchStatus = statusFilter === 'All' || getStatus(r) === statusFilter
        return matchSearch && matchStatus
      })
      .sort((a, b) => (b.cr978_launchlink ? 1 : 0) - (a.cr978_launchlink ? 1 : 0))
  }, [records, search, statusFilter])

  return (
    <div className="acc-root">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="acc-page-header">
        <div>
          <h1 className="acc-page-title">AI Command Center</h1>
          <p className="acc-page-sub">
            Power BI dashboards powering DEWA's AI Centre of Excellence — analytics, adoption and performance in one place.
          </p>
        </div>
        <DataSourceBadge type="live" title="Live Dataverse data" lastUpdated="15 May 2026" />
      </div>

      <LensBriefing module="executive" />

      {/* ── Status KPIs ─────────────────────────────────── */}
      <section>
        <div className="acc-section-label">
          <Icon name="bi-activity" aria-hidden="true" />
          Dashboard Status
        </div>
        <div className="acc-kpi-row">
          {/* Total */}
          <div
            className={`acc-kpi-card acc-kpi-card--clickable${statusFilter === 'All' ? ' acc-kpi-card--active' : ''}`}
            style={{ '--acc-accent': '#007560' } as React.CSSProperties}
            onClick={() => setStatusFilter('All')}
          >
            <div className="acc-kpi-icon" style={{ background: 'rgba(0,117,96,0.1)', color: '#007560', borderColor: 'rgba(0,117,96,0.18)' }}>
              <Icon name="bi-bar-chart-fill" aria-hidden="true" />
            </div>
            <div className="acc-kpi-value">{loading ? '—' : records.length}</div>
            <div className="acc-kpi-label">Total Dashboards</div>
            <div className="acc-kpi-sub">across all statuses</div>
          </div>

          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CFG[s]
            return (
              <div
                key={s}
                className={`acc-kpi-card acc-kpi-card--clickable${statusFilter === s ? ' acc-kpi-card--active' : ''}`}
                onClick={() => setStatusFilter(prev => prev === s ? 'All' : s)}
                style={{ '--acc-accent': cfg.color } as React.CSSProperties}
              >
                <div className="acc-kpi-icon" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                  <Icon name={cfg.icon} aria-hidden="true" />
                </div>
                <div className="acc-kpi-value">{loading ? '—' : statusCounts[s]}</div>
                <div className="acc-kpi-label">{cfg.label}</div>
                <div className="acc-kpi-sub">
                  {!loading && records.length > 0
                    ? `${Math.round((statusCounts[s] / records.length) * 100)}% of total`
                    : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      {!loading && !error && records.length > 0 && (
        <div className="acc-charts-row">

          {/* Donut — Status distribution */}
          <div className="content-card acc-chart-card">
            <h2>Status Distribution</h2>
            <div className="acc-chart-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={ALL_STATUSES.map(s => ({ name: STATUS_CFG[s].label, value: statusCounts[s], color: STATUS_CFG[s].color }))}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {ALL_STATUSES.map(s => (
                      <Cell key={s} fill={STATUS_CFG[s].color} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <div className="acc-donut-center">
                <div className="acc-donut-total">{records.length}</div>
                <div className="acc-donut-sub">Total</div>
              </div>
            </div>
            {/* Legend */}
            <div className="acc-chart-legend">
              {ALL_STATUSES.filter(s => statusCounts[s] > 0).map(s => (
                <div key={s} className="acc-legend-item">
                  <span className="acc-legend-dot" style={{ background: STATUS_CFG[s].color }} />
                  <span className="acc-legend-label">{STATUS_CFG[s].label}</span>
                  <span className="acc-legend-val">{statusCounts[s]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bar — Phase distribution */}
          <div className="content-card acc-chart-card">
            <h2>Phase Breakdown</h2>
            <div className="acc-chart-wrap acc-chart-wrap--bar">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={(Object.keys(PHASE_CFG) as PhaseKey[])
                    .map(p => ({ name: PHASE_CFG[p].label, value: phaseCounts[p] ?? 0, color: PHASE_CFG[p].color }))
                    .filter(d => d.value > 0)}
                  layout="vertical"
                  margin={{ top: 0, right: 24, bottom: 0, left: 8 }}
                >
                  <CartesianGrid horizontal={false} stroke="rgba(0,117,96,0.07)" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={88} axisLine={false} tickLine={false} />
                  <Tooltip content={<BarTip />} cursor={{ fill: 'rgba(0,117,96,0.05)' }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                  <Bar dataKey="value" name="Dashboards" radius={[0, 6, 6, 0]} maxBarSize={22}>
                    {(Object.keys(PHASE_CFG) as PhaseKey[])
                      .filter(p => (phaseCounts[p] ?? 0) > 0)
                      .map(p => <Cell key={p} fill={PHASE_CFG[p].color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="acc-filters">
        <div className="acc-search-wrap">
          <Icon name="bi-search" className="acc-search-icon" aria-hidden="true" />
          <input
            className="acc-search"
            type="text"
            placeholder="Search dashboards…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="acc-search-clear" onClick={() => setSearch('')} aria-label="Clear">
              <Icon name="bi-x" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="acc-select-wrap">
          <Icon name="bi-funnel-fill" className="acc-select-icon" aria-hidden="true" />
          <select
            className="acc-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusKey | 'All')}
          >
            <option value="All">All Status</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>
                {STATUS_CFG[s].label} ({loading ? '…' : statusCounts[s]})
              </option>
            ))}
          </select>
        </div>

        {!loading && (
          <span className="acc-result-count">
            {filtered.length} {filtered.length === 1 ? 'dashboard' : 'dashboards'}
          </span>
        )}
      </div>

      {/* ── States ──────────────────────────────────────── */}
      {loading && (
        <div className="acc-state">
          <div className="acc-spinner" />
          <span>Loading dashboards…</span>
        </div>
      )}
      {!loading && error && (
        <div className="acc-state acc-state--error">
          <Icon name="bi-exclamation-triangle-fill" />
          <span>{error}</span>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div className="acc-state">
          <Icon name="bi-search" />
          <span>No dashboards match your search.</span>
        </div>
      )}

      {/* ── Dashboard cards grid ─────────────────────────── */}
      {!loading && !error && filtered.length > 0 && (
        <div className="acc-grid">
          {filtered.map(r => {
            const status   = getStatus(r)
            const phase    = getPhase(r)
            const priority = getPriority(r)
            const sCfg     = STATUS_CFG[status]
            const hasLink  = !!r.cr978_launchlink

            return (
              <div key={r.cr978_powerbidashboardid} className="acc-card">

                {/* Card header */}
                <div className="acc-card-head">
                  <div className="acc-card-icon-wrap">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
                      <rect x="2"  y="13" width="5" height="8"  rx="1" fill="currentColor" opacity="0.5"/>
                      <rect x="9"  y="7"  width="5" height="14" rx="1" fill="currentColor" opacity="0.75"/>
                      <rect x="16" y="3"  width="5" height="18" rx="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <span
                    className="acc-status-badge"
                    style={{ color: sCfg.color, background: sCfg.bg, borderColor: sCfg.border }}
                  >
                    <Icon name={sCfg.icon} aria-hidden="true" />
                    {sCfg.label}
                  </span>
                </div>

                {/* Name + description */}
                <div className="acc-card-body">
                  <h3 className="acc-card-name">{r.cr978_dashboardname ?? 'Untitled Dashboard'}</h3>
                  {r.cr978_description && (
                    <p className="acc-card-desc">{r.cr978_description}</p>
                  )}
                </div>

                {/* Meta row */}
                <div className="acc-card-meta">
                  {phase && (
                    <span className="acc-badge" style={{ color: PHASE_CFG[phase].color, background: PHASE_CFG[phase].bg }}>
                      <Icon name={PHASE_CFG[phase].icon} aria-hidden="true" />
                      {PHASE_CFG[phase].label}
                    </span>
                  )}
                  {priority && (
                    <span className="acc-badge" style={{ color: PRIORITY_CFG[priority].color, background: PRIORITY_CFG[priority].bg }}>
                      <Icon name={PRIORITY_CFG[priority].icon} aria-hidden="true" />
                      {PRIORITY_CFG[priority].label}
                    </span>
                  )}
                  
                </div>

                {/* Footer */}
                <div className="acc-card-footer">
                  {hasLink ? (
                    <a
                      href={r.cr978_launchlink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="acc-launch-btn"
                    >
                      <Icon name="bi-box-arrow-up-right" aria-hidden="true" />
                      Launch Dashboard
                    </a>
                  ) : (
                    <span className="acc-launch-btn acc-launch-btn--disabled">
                      <Icon name="bi-link-45deg" aria-hidden="true" />
                      No Link Available
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
