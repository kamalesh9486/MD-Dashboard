import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { useScrollLock } from '../hooks/useScrollLock'
import { Cr978_coe_discoveriesService } from '../generated/services/Cr978_coe_discoveriesService'
import { Cr978_coe_divisionsService }   from '../generated/services/Cr978_coe_divisionsService'
import { Cr978_coe_departmentsService } from '../generated/services/Cr978_coe_departmentsService'
import { Cr978_coe_personsService }     from '../generated/services/Cr978_coe_personsService'
import type { Cr978_coe_discoveries as Discovery } from '../generated/models/Cr978_coe_discoveriesModel'
import '../discovery-catalog.css'
import Icon from '../components/Icon'
import DataSourceBadge from '../components/DataSourceBadge'

// ── Shared tooltip style ──────────────────────────────────────
const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none',
  borderRadius: 9, padding: '8px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 }

// ── Lookup map types ──────────────────────────────────────────
type IdNameMap = Map<string, string>

interface LookupMaps {
  divMap:    IdNameMap   // cr978_coe_divisionid   → cr978_divisionname
  deptMap:   IdNameMap   // cr978_coe_departmentid → cr978_departmentname
  personMap: IdNameMap   // cr978_coe_personid     → cr978_personname
}

// ── Lookup resolvers ──────────────────────────────────────────
function resolveDivision(r: Discovery, maps: LookupMaps): string {
  const id = r._cr978_coe_requestingdivision_value
  return (id && maps.divMap.get(id)) || '—'
}
function resolveDepartment(r: Discovery, maps: LookupMaps): string {
  const id = r._cr978_coe_requestingdepartment_value
  return (id && maps.deptMap.get(id)) || '—'
}
function resolveITLead(r: Discovery, maps: LookupMaps): string {
  const id = r._cr978_it_lead_value
  return (id && maps.personMap.get(id)) || '—'
}

// ── Formatters ────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

// ── Status badge ──────────────────────────────────────────────
const STATUS_BADGE_MAP: Record<string, string> = {
  'submitted':        'dc-badge-submitted',
  'under review':     'dc-badge-review',
  'approved':         'dc-badge-approved',
  'in development':   'dc-badge-development',
  'in testing':       'dc-badge-testing',
  'delivered':        'dc-badge-delivered',
  'rejected':         'dc-badge-rejected',
  'on hold':          'dc-badge-onhold',
}
const STATUS_ICONS: Record<string, string> = {
  'submitted':        'bi-send',
  'under review':     'bi-hourglass-split',
  'approved':         'bi-check-circle-fill',
  'in development':   'bi-code-slash',
  'in testing':       'bi-bug',
  'delivered':        'bi-check2-all',
  'rejected':         'bi-x-circle-fill',
  'on hold':          'bi-pause-circle-fill',
}
function statusBadgeCls(status?: string) { return STATUS_BADGE_MAP[(status ?? '').toLowerCase()] ?? 'dc-badge-submitted' }
function statusIcon(status?: string)     { return STATUS_ICONS[(status ?? '').toLowerCase()] ?? 'bi-send' }

function StatusBadge({ status }: { status?: string }) {
  if (!status) return <span className="dc-badge dc-badge-submitted">—</span>
  return <span className={`dc-badge ${statusBadgeCls(status)}`}><Icon name={statusIcon(status)} /> {status}</span>
}

function AITypeBadge({ value }: { value?: string }) {
  if (!value) return <span className="dc-type-nonai"><Icon name="bi-gear" /> —</span>
  const ai = value.toLowerCase().includes('ai') && !value.toLowerCase().startsWith('non')
  return ai
    ? <span className="dc-type-ai"><Icon name="bi-cpu" /> {value}</span>
    : <span className="dc-type-nonai"><Icon name="bi-gear" /> {value}</span>
}

// ── KPI Strip ─────────────────────────────────────────────────
function KpiStrip({ items }: { items: Discovery[] }) {
  const total          = items.length
  const allocatedCnt   = items.filter(r => !!r._cr978_it_lead_value).length
  const unallocatedCnt = items.filter(r => !r._cr978_it_lead_value).length
  const divCount       = new Set(items.map(r => r._cr978_coe_requestingdivision_value).filter(Boolean)).size
  const deptCount      = new Set(items.map(r => r._cr978_coe_requestingdepartment_value).filter(Boolean)).size
  const leadCount      = new Set(items.map(r => r._cr978_it_lead_value).filter(Boolean)).size

  const kpis = [
    { label: 'Total Discoveries',   value: total,          icon: 'bi-collection',     bg: 'rgba(0,51,102,0.08)',   color: '#003366' },
    { label: 'Allocated Demands',   value: allocatedCnt,   icon: 'bi-check-circle-fill', bg: 'rgba(0,117,96,0.1)',  color: '#007560' },
    { label: 'Unallocated Demands', value: unallocatedCnt, icon: 'bi-hourglass-split', bg: 'rgba(239,68,68,0.1)', color: '#dc2626' },
    { label: 'Divisions',           value: divCount,       icon: 'bi-diagram-3-fill', bg: 'rgba(8,145,178,0.1)',   color: '#0891b2' },
    { label: 'Departments',         value: deptCount,      icon: 'bi-building',       bg: 'rgba(245,166,35,0.12)', color: '#b07d10' },
    { label: 'IT Leads',            value: leadCount,      icon: 'bi-people-fill',    bg: 'rgba(16,185,129,0.1)', color: '#059669' },
  ]
  return (
    <div className="dc-kpi-strip">
      {kpis.map(k => (
        <div key={k.label} className="dc-kpi-card">
          <div className="dc-kpi-icon" style={{ background: k.bg, color: k.color }}>
            <Icon name={k.icon} />
          </div>
          <div>
            <div className="dc-kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className="dc-kpi-label">{k.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Custom Tooltip ────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="dc-chart-tooltip">
      <div className="dc-chart-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="dc-chart-tooltip-row">
          <span className="dc-chart-tooltip-dot" style={{ background: p.fill }} />
          <span>{p.name}</span>
          <strong>{p.value}</strong>
        </div>
      ))}
      {payload.length > 1 && (
        <div className="dc-chart-tooltip-total">Total: <strong>{total}</strong></div>
      )}
    </div>
  )
}

// ── Colour palettes ───────────────────────────────────────────
const DEPT_PALETTE = [
  '#007560', '#ca8a04', '#004937', '#0891b2', '#6366f1',
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16',
  '#f97316', '#a855f7',
]

// ── Chart 1: Division + Department combined stacked bar ───────
function DivisionChart({ items, maps }: { items: Discovery[]; maps: LookupMaps }) {
  const { data, depts } = useMemo(() => {
    // collect unique departments in sorted order
    const deptSet = new Set<string>()
    for (const r of items) {
      const dept = resolveDepartment(r, maps)
      if (dept !== '—') deptSet.add(dept)
    }
    const depts = [...deptSet].sort()

    // group discoveries by division, count per department
    const divAgg = new Map<string, Record<string, number>>()
    for (const r of items) {
      const div  = resolveDivision(r, maps)
      const dept = resolveDepartment(r, maps)
      if (!divAgg.has(div)) divAgg.set(div, {})
      const entry = divAgg.get(div)!
      entry[dept] = (entry[dept] ?? 0) + 1
    }

    const data = [...divAgg.entries()]
      .map(([name, deptCounts]) => {
        const total = Object.values(deptCounts).reduce((s, v) => s + v, 0)
        return {
          name: name.length > 24 ? name.slice(0, 22) + '…' : name,
          ...deptCounts,
          _total: total,
        }
      })
      .sort((a, b) => b._total - a._total)

    return { data, depts }
  }, [items, maps])

  return (
    <div className="dc-chart-card">
      <div className="dc-chart-title">
        <Icon name="bi-diagram-3-fill" />
        Division + Department Breakdown
        <span className="dc-chart-subtitle">Discoveries per division, coloured by department</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 8, bottom: 4 }} barSize={16}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={150} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          {depts.map((dept, i) => (
            <Bar
              key={dept}
              dataKey={dept}
              stackId="s"
              fill={DEPT_PALETTE[i % DEPT_PALETTE.length]}
              radius={i === depts.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Chart 2: Status Distribution (Donut) ─────────────────────
const CHART_PALETTE = [
  '#007560', '#ca8a04', '#004937', '#0891b2', '#6366f1',
  '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#84cc16',
  '#f97316', '#a855f7', '#dc2626',
]

function StatusChart({ items }: { items: Discovery[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of items) {
      const s = r.cr978_status ?? 'Unknown'
      map.set(s, (map.get(s) ?? 0) + 1)
    }
    return [...map.entries()].map(([name, value], idx) => ({
      name, value, color: CHART_PALETTE[idx % CHART_PALETTE.length],
    }))
  }, [items])

  return (
    <div className="dc-chart-card">
      <div className="dc-chart-title">
        <Icon name="bi-pie-chart-fill" />
        Status Distribution
        <span className="dc-chart-subtitle">Discoveries by current status</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
            {data.map(d => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', marginTop: 4 }}>
        {data.map(d => (
          <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#374151' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, display: 'inline-block' }} />
            {d.name} <strong style={{ color: '#1c1c1e' }}>{d.value}</strong>
          </span>
        ))}
      </div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────
function DiscoveryModal({ item: d, maps, onClose }: { item: Discovery; maps: LookupMaps; onClose: () => void }) {
  useScrollLock()

  const divName    = resolveDivision(d, maps)
  const deptName   = resolveDepartment(d, maps)
  const leadName   = resolveITLead(d, maps)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel dc-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--dewa-navy) 0%, #004d99 100%)' }}>
          <div className="modal-header-info">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              {d.cr978_demand_no && <span className="dc-demand-id-tag">{d.cr978_demand_no}</span>}
              <AITypeBadge value={d.cr978_ai_type} />
              {d.cr978_sap_type && (
                <span className="dc-category-tag" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
                  SAP: {d.cr978_sap_type}
                </span>
              )}
            </div>
            <div className="modal-title" style={{ color: '#fff' }}>{d.cr978_discoveryname}</div>
            <div style={{ marginTop: 6 }}>
              <StatusBadge status={d.cr978_status} />
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="bi-x-lg" />
          </button>
        </div>

        <div className="modal-body">
          {/* Core Details */}
          <div className="modal-section">
            <div className="modal-section-title"><Icon name="bi-info-circle" /> Discovery Details</div>
            <div className="dc-meta-grid">
              {[
                { label: 'Demand No',      value: d.cr978_demand_no ?? '—' },
                { label: 'AI Type',        value: d.cr978_ai_type ?? '—' },
                { label: 'SAP Type',       value: d.cr978_sap_type ?? '—' },
                { label: 'Status',         value: d.cr978_status ?? '—' },
                { label: 'Submitted On',   value: fmtDate(d.cr978_submitteddate) },
                { label: 'Discovery Date', value: fmtDate(d.cr978_discoverydate) },
              ].map(cell => (
                <div key={cell.label} className="modal-meta-cell">
                  <div className="modal-meta-label">{cell.label}</div>
                  <div className="modal-meta-value">{cell.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Organisation — names resolved from lookup tables */}
          <div className="modal-section">
            <div className="modal-section-title"><Icon name="bi-building" /> Organisation</div>
            <div className="dc-meta-grid">
              <div className="modal-meta-cell">
                <div className="modal-meta-label">Division</div>
                <div className="modal-meta-value">{divName}</div>
              </div>
              <div className="modal-meta-cell">
                <div className="modal-meta-label">Department</div>
                <div className="modal-meta-value">{deptName}</div>
              </div>
              <div className="modal-meta-cell">
                <div className="modal-meta-label">IT Lead</div>
                <div className="modal-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  {leadName !== '—' && <div className="dc-mini-avatar">{initials(leadName)}</div>}
                  {leadName}
                </div>
              </div>
              {d.cr978_discoveredbyname && (
                <div className="modal-meta-cell">
                  <div className="modal-meta-label">Discovered By</div>
                  <div className="modal-meta-value" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div className="dc-mini-avatar">{initials(d.cr978_discoveredbyname)}</div>
                    {d.cr978_discoveredbyname}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {d.cr978_notes && (
            <div className="modal-section">
              <div className="modal-section-title"><Icon name="bi-file-text" /> Notes</div>
              <p className="modal-desc">{d.cr978_notes}</p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
            <button
              onClick={onClose}
              style={{ padding: '9px 22px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Loading / Error States ────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: 'var(--text-muted)', fontSize: 14 }}>
      <Icon name="bi-arrow-repeat" />
      Loading discoveries…
    </div>
  )
}
function ErrorState({ msg, onRetry }: { msg: string; onRetry: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: '#dc2626', fontSize: 13 }}>
      <Icon name="bi-exclamation-triangle-fill" style={{ fontSize: 32 }} />
      <span>{msg}</span>
      <button onClick={onRetry} style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid #dc2626', background: 'rgba(220,38,38,0.07)', color: '#dc2626', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
        Retry
      </button>
    </div>
  )
}

const EMPTY_MAPS: LookupMaps = { divMap: new Map(), deptMap: new Map(), personMap: new Map() }

// ── Main Component ────────────────────────────────────────────
export default function DiscoveryCatalog() {
  const [items,        setItems]        = useState<Discovery[]>([])
  const [maps,         setMaps]         = useState<LookupMaps>(EMPTY_MAPS)
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [divFilter,    setDivFilter]    = useState('All')
  const [deptFilter,   setDeptFilter]   = useState('All')
  const [selected,     setSelected]     = useState<Discovery | null>(null)
  const [sortKey,      setSortKey]      = useState<'cr978_demand_no' | 'cr978_discoveryname' | 'cr978_submitteddate'>('cr978_submitteddate')
  const [sortDir,      setSortDir]      = useState<'asc' | 'desc'>('desc')

  const fetchData = useCallback(() => {
    let active = true
    setLoading(true)
    setError('')
    Promise.all([
      Cr978_coe_discoveriesService.getAll(),
      Cr978_coe_divisionsService.getAll(),
      Cr978_coe_departmentsService.getAll(),
      Cr978_coe_personsService.getAll(),
    ])
      .then(([discRes, divRes, deptRes, personRes]) => {
        if (!active) return
        setMaps({
          divMap:    new Map((divRes.data    ?? []).map(d => [d.cr978_coe_divisionid,   d.cr978_divisionname])),
          deptMap:   new Map((deptRes.data   ?? []).map(d => [d.cr978_coe_departmentid, d.cr978_departmentname])),
          personMap: new Map((personRes.data ?? []).map(p => [p.cr978_coe_personid,     p.cr978_personname])),
        })
        setItems(discRes.data ?? [])
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[DiscoveryCatalog] Failed to fetch data:', msg)
        setError('Failed to load data. Please try again.')
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => fetchData(), [fetchData])

  // Unique resolved names for filter dropdowns
  const allStatuses = useMemo(() =>
    [...new Set(items.map(r => r.cr978_status).filter((s): s is string => !!s))].sort(),
    [items])

  const allDivisions = useMemo(() =>
    [...new Set(
      items
        .map(r => r._cr978_coe_requestingdivision_value)
        .filter((id): id is string => !!id && maps.divMap.has(id))
        .map(id => maps.divMap.get(id)!)
    )].sort(),
    [items, maps])

  const allDepts = useMemo(() =>
    [...new Set(
      items
        .map(r => r._cr978_coe_requestingdepartment_value)
        .filter((id): id is string => !!id && maps.deptMap.has(id))
        .map(id => maps.deptMap.get(id)!)
    )].sort(),
    [items, maps])

  const filtered = useMemo(() => {
    let list = items.filter(r => {
      const q       = search.toLowerCase()
      const divName  = resolveDivision(r, maps)
      const deptName = resolveDepartment(r, maps)
      const leadName = resolveITLead(r, maps)

      const matchQ = !q ||
        (r.cr978_discoveryname ?? '').toLowerCase().includes(q) ||
        (r.cr978_demand_no ?? '').toLowerCase().includes(q) ||
        leadName.toLowerCase().includes(q) ||
        divName.toLowerCase().includes(q) ||
        deptName.toLowerCase().includes(q) ||
        (r.cr978_sap_type ?? '').toLowerCase().includes(q) ||
        (r.cr978_ai_type  ?? '').toLowerCase().includes(q)

      const matchS  = statusFilter === 'All' || r.cr978_status === statusFilter
      const matchDv = divFilter  === 'All' || divName  === divFilter
      const matchDp = deptFilter === 'All' || deptName === deptFilter

      return matchQ && matchS && matchDv && matchDp
    })

    list = [...list].sort((a, b) => {
      const va = (a[sortKey] ?? '') as string
      const vb = (b[sortKey] ?? '') as string
      const cmp = va.localeCompare(vb)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [items, maps, search, statusFilter, divFilter, deptFilter, sortKey, sortDir])

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: typeof sortKey }) {
    if (sortKey !== col) return <Icon name="bi-arrow-down-up" className="dc-sort-icon muted" />
    return sortDir === 'asc'
      ? <Icon name="bi-sort-up" className="dc-sort-icon" />
      : <Icon name="bi-sort-down" className="dc-sort-icon" />
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>Discovery Catalog</h1>
          <p>Live Dataverse data — all discoveries with AI type, SAP type, status, division &amp; department</p>
        </div>
        <DataSourceBadge type="live" title="Manually fed live data" lastUpdated="11 May 2026" />
      </div>

      {loading ? <LoadingState /> : error ? <ErrorState msg={error} onRetry={fetchData} /> : (
        <>
          <KpiStrip items={items} />

          <div className="dc-charts-row">
            <DivisionChart items={items} maps={maps} />
            <StatusChart items={items} />
          </div>

          {/* Filter bar */}
          <div className="dc-filter-bar">
            <div className="dc-search-wrap">
              <Icon name="bi-search" className="dc-search-icon" />
              <input
                className="dc-search-input"
                placeholder="Search name, demand no, division, department, IT lead…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className="dc-search-clear" onClick={() => setSearch('')} title="Clear">
                  <Icon name="bi-x" />
                </button>
              )}
            </div>

            <div className="dc-selects-row">
              <select className="prog-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="All">All Statuses</option>
                {allStatuses.map(s => <option key={s}>{s}</option>)}
              </select>
              <select className="prog-select" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
                <option value="All">All Divisions</option>
                {allDivisions.map(d => <option key={d}>{d}</option>)}
              </select>
              <select className="prog-select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="All">All Departments</option>
                {allDepts.map(d => <option key={d}>{d}</option>)}
              </select>
              <span className="prog-result-count">{filtered.length} of {items.length} discoveries</span>
            </div>
          </div>

          {/* Table */}
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th className="dc-th-sortable" onClick={() => toggleSort('cr978_demand_no')}>
                    Demand No <SortIcon col="cr978_demand_no" />
                  </th>
                  <th className="dc-th-sortable" onClick={() => toggleSort('cr978_discoveryname')}>
                    Discovery Name <SortIcon col="cr978_discoveryname" />
                  </th>
                  <th>Status</th>
                  <th>Division</th>
                  <th>IT Lead</th>
                  <th className="dc-th-sortable" onClick={() => toggleSort('cr978_submitteddate')}>
                    Submitted On <SortIcon col="cr978_submitteddate" />
                  </th>
                  <th style={{ textAlign: 'center' }}>D2D Portal</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="dc-empty-row">
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Icon name="bi-inbox" style={{ fontSize: 28, marginBottom: 8 }} />
                        No discoveries match the current filters
                      </div>
                    </td>
                  </tr>
                ) : filtered.map(r => {
                  const divName  = resolveDivision(r, maps)
                  const deptName = resolveDepartment(r, maps)
                  const leadName = resolveITLead(r, maps)
                  return (
                    <tr key={r.cr978_coe_discoveryid} className="dc-tr" onClick={() => setSelected(r)}>
                      <td>
                        <span className="dc-id-pill">{r.cr978_demand_no ?? '—'}</span>
                      </td>
                      <td>
                        <div className="dc-title-cell">
                          <div className="dc-title-text">{r.cr978_discoveryname}</div>
                        </div>
                      </td>
                      <td><StatusBadge status={r.cr978_status} /></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                 <span className="dc-div-tag">{divName}</span>

                          { <span className="dc-dept-name">{deptName}</span>}
                        </div>

                                                 

                      </td>
                      
                      <td>
                        {leadName !== '—' ? (
                          <div className="dc-person-cell">
                            <div className="dc-mini-avatar">{initials(leadName)}</div>
                            <span>{leadName}</span>
                          </div>
                        ) : <span style={{ color: '#a8a29e' }}>—</span>}
                      </td>
                      <td className="dc-date-cell">{fmtDate(r.cr978_submitteddate)}</td>
                      <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                        {r.cr978_demand_no ? (
                          <a
                            href={`https://d2d.dewa.gov.ae/demand/${r.cr978_demand_no}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="dc-d2d-link"
                            title={`Open ${r.cr978_demand_no} in D2D Portal`}
                          >
                            <Icon name="bi-box-arrow-up-right" />
                          </a>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {selected && (
        <DiscoveryModal
          item={selected}
          maps={maps}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
