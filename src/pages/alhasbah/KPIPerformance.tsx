import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import Icon from '../../components/Icon'
import LensInsightChip, { type LensChipType } from '../../components/LensInsightChip'
import { type AHKPI, type AHDivision, type AHKPIStatus } from './data'
import { useAlHasbah } from './AlHasbahContext'

// ── Constants ────────────────────────────────────────────────────────────────

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9,
  padding: '8px 14px', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

const STATUS_COLORS: Record<AHKPIStatus, string> = {
  on_track:  '#007560',
  at_risk:   '#ca8a04',
  off_track: '#dc2626',
}
const STATUS_LABELS: Record<AHKPIStatus, string> = {
  on_track: 'On Track', at_risk: 'At Risk', off_track: 'Off Track',
}
const STATUS_ICONS: Record<AHKPIStatus, string> = {
  on_track: 'bi-check-circle-fill', at_risk: 'bi-exclamation-circle', off_track: 'bi-x-circle',
}

const DIV_COLORS: Record<AHDivision, string> = {
  HR: '#7c3aed', Finance: '#0ea5e9', Billing: '#007560',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtValue(value: number, unit: string): string {
  if (unit === '%')     return `${value}%`
  if (unit === 'hours') return `${value}h`
  if (unit === 'days')  return `${value}d`
  if (unit === 'AED')   return `AED ${value.toLocaleString()}`
  return value.toLocaleString()
}

function achievementPct(kpi: AHKPI): number {
  if (kpi.targetValue === 0) return 0
  const ratio = kpi.lowerIsBetter
    ? (kpi.currentValue <= kpi.targetValue ? 1 : kpi.targetValue / kpi.currentValue)
    : kpi.currentValue / kpi.targetValue
  return Math.min(Math.round(ratio * 100), 100)
}

// ── Trend chart ──────────────────────────────────────────────────────────────

function TrendChart({ kpi }: { kpi: AHKPI }) {
  const statusColor = STATUS_COLORS[kpi.status]
  const data = kpi.history.map(h => ({ period: h.period, actual: h.actual, target: h.target }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 60, bottom: 4, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
        <XAxis dataKey="period" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
          formatter={(v) => [fmtValue(Number(v), kpi.unit), '']}
        />
        <ReferenceLine
          y={kpi.targetValue}
          stroke="#06b6d4"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Target: ${fmtValue(kpi.targetValue, kpi.unit)}`, position: 'right', fill: '#06b6d4', fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="actual"
          stroke={statusColor}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: statusColor, strokeWidth: 0 }}
          activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--surface)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── CoE Lens insight for a KPI ──────────────────────────────────────────────

function kpiLensChip(kpi: AHKPI): { text: string; type: LensChipType } {
  const deltaSign  = kpi.trendDelta >= 0 ? '+' : ''
  const unitSuffix = kpi.unit === '%' ? 'pp' : kpi.unit === 'hours' ? 'h' : kpi.unit === 'days' ? 'd' : ''
  const delta      = `${deltaSign}${kpi.trendDelta}${unitSuffix}`
  const achiev     = achievementPct(kpi)
  if (kpi.status === 'off_track') {
    const reason = kpi.notAchievableReason ? kpi.notAchievableReason.split('.')[0] : `${achiev}% of target achieved`
    return { text: `Off-track — ${reason}`, type: 'critical' }
  }
  if (kpi.status === 'at_risk') {
    return { text: `At risk — trending ${delta} · ${achiev}% of target — close but not yet on track`, type: 'attention' }
  }
  return { text: `On track — trend ${delta} · ${achiev}% achieved · above target`, type: 'positive' }
}

// ── Expandable KPI row ───────────────────────────────────────────────────────

function KPIRow({ kpi }: { kpi: AHKPI }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = STATUS_COLORS[kpi.status]
  const isGoodTrend = kpi.lowerIsBetter ? kpi.trend === 'down' : kpi.trend === 'up'
  const trendColor  = kpi.trend === 'flat' ? '#9ca3af' : isGoodTrend ? '#007560' : '#dc2626'
  const trendIcon   = kpi.trend === 'up' ? 'bi-caret-up-fill' : kpi.trend === 'down' ? 'bi-caret-down-fill' : 'bi-dash'
  const deltaSign   = kpi.trendDelta >= 0 ? '+' : ''
  const unitSuffix  = kpi.unit === '%' ? 'pp' : kpi.unit === 'hours' ? 'h' : kpi.unit === 'days' ? 'd' : ''
  const dataSource  = kpi.dataSource ?? 'Agent Processing Log'

  return (
    <div
      className="ah-kpi-row-card"
      style={{ border: `1px solid ${expanded ? `${statusColor}40` : 'var(--border-card)'}` }}
    >
      {/* Header */}
      <button
        className="ah-kpi-row-head"
        onClick={() => setExpanded(v => !v)}
      >
        <span style={{ color: statusColor, flexShrink: 0 }}>
          <Icon name={STATUS_ICONS[kpi.status]} />
        </span>

        {/* Name + meta */}
        <div style={{ flex: '1 1 180px', minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{kpi.kpiName}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
            {kpi.frequency.charAt(0).toUpperCase() + kpi.frequency.slice(1)} · {kpi.owner}
          </div>
        </div>

        {/* Current / Target */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: statusColor }}>
            {fmtValue(kpi.currentValue, kpi.unit)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Target: {fmtValue(kpi.targetValue, kpi.unit)}
          </div>
        </div>

        {/* Trend pill */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', borderRadius: 6, flexShrink: 0,
            background: `${trendColor}14`,
            border: `1px solid ${trendColor}30`,
          }}
        >
          <span style={{ color: trendColor, fontSize: 11 }}><Icon name={trendIcon} /></span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: trendColor }}>
            {kpi.trend === 'flat' ? 'Flat' : `${deltaSign}${kpi.trendDelta}${unitSuffix}`}
          </span>
        </div>

        {/* Status badge */}
        <span
          className={`ah-badge ${kpi.status === 'on_track' ? 'ah-kpi-on-track' : kpi.status === 'at_risk' ? 'ah-kpi-at-risk' : 'ah-kpi-off-track'}`}
          style={{ flexShrink: 0 }}
        >
          {STATUS_LABELS[kpi.status]}
        </span>

        <Icon name={expanded ? 'bi-chevron-down' : 'bi-chevron-right'} />
      </button>

      {/* CoE Lens inline insight */}
      {!expanded && (() => { const c = kpiLensChip(kpi); return <LensInsightChip text={c.text} type={c.type} /> })()}

      {/* Expanded detail */}
      {expanded && (
        <div className="ah-kpi-row-expand">
          {/* Definition */}
          <div className="ah-kpi-definition-box">
            <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><Icon name="bi-info-circle" /></span>
            <span style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>{kpi.kpiDefinition}</span>
          </div>

          {/* Chart + breakdown grid */}
          <div className="ah-kpi-detail-grid">
            {/* Historical trend chart */}
            <div>
              <div className="ah-kpi-section-label">Historical Trend</div>
              <div className="ah-kpi-chart-wrap">
                <TrendChart kpi={kpi} />
              </div>
            </div>

            {/* Metadata + achievement */}
            <div>
              <div className="ah-kpi-section-label">Progress</div>
              <div className="ah-kpi-chart-wrap" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px' }}>
                {/* Achievement bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-muted)' }}>% Achieved</span>
                    <span style={{ fontWeight: 700, color: statusColor }}>{achievementPct(kpi)}%</span>
                  </div>
                  <div style={{ background: 'rgba(0,117,96,0.1)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${achievementPct(kpi)}%`, background: statusColor, borderRadius: 6, transition: 'width .4s' }} />
                  </div>
                  {kpi.lowerIsBetter && (
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Icon name="bi-arrow-down-circle" /> Lower is better for this KPI
                    </div>
                  )}
                </div>

                {/* Division badge */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Division</div>
                  <span className={`ah-badge ah-badge-${kpi.division.toLowerCase()}`} style={{ fontSize: 12 }}>{kpi.division}</span>
                </div>

                {/* Function */}
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Function</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text)' }}>{kpi.function}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata 5-cell row */}
          <div className="ah-kpi-meta-row">
            {[
              { label: 'Frequency', value: kpi.frequency.charAt(0).toUpperCase() + kpi.frequency.slice(1) },
              { label: 'Data Source', value: dataSource },
              { label: 'Owner',       value: kpi.owner },
              { label: 'Division',    value: kpi.division },
              { label: 'Unit',        value: kpi.unit === '%' ? 'Percentage' : kpi.unit === 'hours' ? 'Hours' : kpi.unit === 'days' ? 'Days' : kpi.unit === 'AED' ? 'AED' : 'Count' },
            ].map(item => (
              <div key={item.label} className="ah-kpi-meta-cell">
                <div className="ah-kpi-meta-label">{item.label}</div>
                <div className="ah-kpi-meta-val">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Historical actuals grid */}
          <div style={{ marginTop: 16 }}>
            <div className="ah-kpi-section-label">Historical Actuals</div>
            <div className="ah-kpi-history-grid" style={{ gridTemplateColumns: `repeat(${kpi.history.length}, minmax(72px, 1fr))` }}>
              {kpi.history.map((h, i) => {
                const isLatest = i === kpi.history.length - 1
                const met = kpi.lowerIsBetter ? h.actual <= h.target : h.actual >= h.target
                const cellColor = met ? '#007560' : '#ca8a04'
                return (
                  <div
                    key={h.period}
                    className="ah-kpi-history-cell"
                    style={{
                      background: isLatest ? `${statusColor}08` : 'rgba(0,117,96,0.02)',
                      border: `1px solid ${isLatest ? `${statusColor}35` : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 4 }}>{h.period}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: cellColor }}>{fmtValue(h.actual, kpi.unit)}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>tgt: {fmtValue(h.target, kpi.unit)}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({ label, active, color, onClick }: { label: string; active: boolean; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 6, fontSize: 12, fontWeight: active ? 700 : 500,
        cursor: 'pointer', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
        background: active ? `${color}18` : 'var(--surface)',
        border: `1px solid ${active ? `${color}50` : 'var(--border)'}`,
        color: active ? color : 'var(--text-muted)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function KPIPerformance(_: { onNavigate?: (tab: string) => void }) {
  const { kpis, loading, error } = useAlHasbah()
  const [filterStatus,   setFilterStatus]   = useState<AHKPIStatus | 'all'>('all')
  const [filterDivision, setFilterDivision] = useState<AHDivision | 'all'>('all')
  const [filterFreq,     setFilterFreq]     = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all')

  const summary = useMemo(() => {
    const total    = kpis.length
    const onTrack  = kpis.filter(k => k.status === 'on_track').length
    const atRisk   = kpis.filter(k => k.status === 'at_risk').length
    const offTrack = kpis.filter(k => k.status === 'off_track').length
    const avgPct   = total > 0 ? Math.round(kpis.reduce((s, k) => s + achievementPct(k), 0) / total) : 0
    return { total, onTrack, atRisk, offTrack, avgPct }
  }, [kpis])

  const hasActiveFilters = filterStatus !== 'all' || filterDivision !== 'all' || filterFreq !== 'all'

  const filtered = useMemo(() => kpis.filter(k => {
    if (filterStatus   !== 'all' && k.status    !== filterStatus)   return false
    if (filterDivision !== 'all' && k.division  !== filterDivision) return false
    if (filterFreq     !== 'all' && k.frequency !== filterFreq)     return false
    return true
  }), [kpis, filterStatus, filterDivision, filterFreq])

  const avgColor = summary.avgPct >= 80 ? '#007560' : '#ca8a04'

  if (loading) return <div className="ah-loading-state"><Icon name="bi-hourglass-split" /> Loading from Dataverse…</div>
  if (error)   return <div className="ah-error-state"><Icon name="bi-exclamation-triangle" /> {error}</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header strip */}
      <div className="ah-kpi-perf-header">
        <div>
          <span style={{ fontWeight: 700, color: '#007560', fontSize: 13.5 }}>KPI Performance Registry</span>
          <span style={{ fontSize: 12.5, color: 'var(--text-muted)', marginLeft: 12 }}>
            {kpis.length} KPIs across HR, Finance &amp; Billing
          </span>
        </div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px',
            background: `${avgColor}10`, border: `1px solid ${avgColor}30`,
            borderRadius: 8,
          }}
        >
          <Icon name="bi-speedometer2" />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>
            {summary.avgPct}% avg. achievement
          </span>
        </div>
      </div>

      {/* Summary tiles */}
      <div className="ah-kpi-summary-tiles">
        {[
          { label: 'Total KPIs', value: summary.total,    color: '#06b6d4',  filter: 'all'      as const },
          { label: 'On Track',   value: summary.onTrack,  color: '#007560',  filter: 'on_track' as const },
          { label: 'At Risk',    value: summary.atRisk,   color: '#ca8a04',  filter: 'at_risk'  as const },
          { label: 'Off Track',  value: summary.offTrack, color: '#dc2626',  filter: 'off_track'as const },
        ].map(tile => {
          const active = tile.filter === 'all' ? false : filterStatus === tile.filter
          return (
            <button
              key={tile.label}
              onClick={() => {
                if (tile.filter === 'all') setFilterStatus('all')
                else setFilterStatus(prev => prev === tile.filter ? 'all' : tile.filter)
              }}
              className="ah-kpi-summary-tile"
              style={{ border: `1px solid ${active ? `${tile.color}50` : 'var(--border-card)'}` }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: tile.color, lineHeight: 1 }}>{tile.value}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>{tile.label}</div>
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="ah-kpi-filter-bar">
        <Icon name="bi-funnel" />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Filters</span>
        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Status */}
        {(['on_track', 'at_risk', 'off_track'] as AHKPIStatus[]).map(s => (
          <FilterChip key={s} label={STATUS_LABELS[s]} active={filterStatus === s} color={STATUS_COLORS[s]}
            onClick={() => setFilterStatus(prev => prev === s ? 'all' : s)} />
        ))}

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Division */}
        {(['HR', 'Finance', 'Billing'] as AHDivision[]).map(d => (
          <FilterChip key={d} label={d} active={filterDivision === d} color={DIV_COLORS[d]}
            onClick={() => setFilterDivision(prev => prev === d ? 'all' : d)} />
        ))}

        <div style={{ width: 1, height: 16, background: 'var(--border)' }} />

        {/* Frequency */}
        {(['weekly', 'monthly'] as const).map(f => (
          <FilterChip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filterFreq === f} color="#06b6d4"
            onClick={() => setFilterFreq(prev => prev === f ? 'all' : f)} />
        ))}

        {hasActiveFilters && (
          <button
            onClick={() => { setFilterStatus('all'); setFilterDivision('all'); setFilterFreq('all') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: '1px solid var(--border)', borderRadius: 6,
              padding: '4px 10px', fontSize: 11.5, color: 'var(--text-muted)', cursor: 'pointer',
              fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            <Icon name="bi-x-lg" /> Clear
          </button>
        )}

        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Showing {filtered.length} of {kpis.length} KPIs
        </span>
      </div>

      {/* KPI rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(kpi => <KPIRow key={kpi.id} kpi={kpi} />)}
        {filtered.length === 0 && (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Icon name="bi-inbox" style={{ fontSize: 32 }} />
            <div style={{ marginTop: 10, fontSize: 14 }}>No KPIs match the selected filters.</div>
          </div>
        )}
      </div>
    </div>
  )
}
