import { useState, useMemo } from 'react'
import Icon from '../../components/Icon'
import { AH_KPI_FAMILIES, type AHKPI, type AHDivision, type AHKPIStatus } from './data'
import { useAlHasbah } from './AlHasbahContext'
import KPIDetailOverlay from './leadership/KPIDetailOverlay'
import NotAchievableModal from './kpis/NotAchievableModal'
import KPIFormPanel from './kpis/KPIFormPanel'
import NotificationToast, { useToast } from './NotificationToast'

type DivFilter    = AHDivision | 'all'
type StatFilter   = AHKPIStatus | 'all'
type ScopeFilter  = 'all' | 'enterprise' | 'division' | 'department'

function achievementPct(kpi: AHKPI) {
  if (kpi.targetValue === 0) return 0
  const ratio = kpi.lowerIsBetter
    ? kpi.currentValue <= kpi.targetValue ? 1 : kpi.targetValue / kpi.currentValue
    : kpi.currentValue / kpi.targetValue
  return Math.min(Math.round(ratio * 100), 100)
}

function statusColor(s: AHKPIStatus) {
  return s === 'on_track' ? '#007560' : s === 'at_risk' ? '#ca8a04' : '#dc2626'
}
function statusLabel(s: AHKPIStatus) {
  return s === 'on_track' ? 'On Track' : s === 'at_risk' ? 'At Risk' : 'Off Track'
}

function SummaryCard({ val, label, color }: { val: number; label: string; color?: string }) {
  return (
    <div className="ah-kpi-repo-sum-card">
      <div className="ah-kpi-repo-sum-val" style={color ? { color } : undefined}>{val}</div>
      <div className="ah-kpi-repo-sum-label">{label}</div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, children }: {
  label: string; value: string; onChange: (v: string) => void; children: React.ReactNode
}) {
  return (
    <div>
      <div className="ah-filter-label">{label}</div>
      <select className="ah-select" value={value} onChange={e => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  )
}

interface Props { onNavigate?: (tab: string) => void }

export default function KPIRepository({ onNavigate }: Props) {
  const { kpis, loading, error, refreshKpis } = useAlHasbah()
  const [search,       setSearch]       = useState('')
  const [divFilter,    setDivFilter]    = useState<DivFilter>('all')
  const [statFilter,   setStatFilter]   = useState<StatFilter>('all')
  const [familyFilter, setFamilyFilter] = useState('all')
  const [scopeFilter,  setScopeFilter]  = useState<ScopeFilter>('all')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedKPI,  setSelectedKPI]  = useState<AHKPI | null>(null)
  const [selectedNAKPI, setSelectedNAKPI] = useState<AHKPI | null>(null)
  const [showKPIForm,  setShowKPIForm]  = useState(false)
  const { toasts, dismiss, showSuccess } = useToast()

  const families = useMemo(() => [...new Set(kpis.map(k => k.kpiFamily))].sort(), [kpis])

  const filtered = useMemo(() => kpis.filter(k => {
    const q = search.toLowerCase()
    return (
      (!q || k.kpiName.toLowerCase().includes(q) || k.function.toLowerCase().includes(q) || k.kpiDefinition.toLowerCase().includes(q)) &&
      (divFilter    === 'all' || k.division  === divFilter) &&
      (statFilter   === 'all' || k.status    === statFilter) &&
      (familyFilter === 'all' || k.kpiFamily === familyFilter) &&
      (scopeFilter  === 'all' || k.scope     === scopeFilter)
    )
  }), [kpis, search, divFilter, statFilter, familyFilter, scopeFilter])

  const grouped = useMemo(() => {
    const map: Record<string, AHKPI[]> = {}
    for (const kpi of filtered) {
      const key = `${kpi.division} — ${kpi.function}`
      if (!map[key]) map[key] = []
      map[key].push(kpi)
    }
    return map
  }, [filtered])

  const onTrackCount  = kpis.filter(k => k.status === 'on_track').length
  const atRiskCount   = kpis.filter(k => k.status === 'at_risk').length
  const offTrackCount = kpis.filter(k => k.status === 'off_track').length

  if (loading) return <div className="ah-loading-state"><Icon name="bi-hourglass-split" /> Loading from Dataverse…</div>
  if (error)   return <div className="ah-error-state"><Icon name="bi-exclamation-triangle" /> {error}</div>

  function toggleGroup(key: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const hasFilters = divFilter !== 'all' || statFilter !== 'all' || familyFilter !== 'all' || scopeFilter !== 'all' || search !== ''

  function clearFilters() {
    setSearch(''); setDivFilter('all'); setStatFilter('all'); setFamilyFilter('all'); setScopeFilter('all')
  }

  async function handleSaved(name: string) {
    // Brief delay for Dataverse eventual consistency before re-fetching
    await new Promise(r => setTimeout(r, 600))
    await refreshKpis()
    showSuccess(`KPI "${name}" added successfully`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div className="ah-kpi-repo-header">
        <div>
          {onNavigate && (
            <button
              className="ah-pill-btn"
              style={{ marginBottom: 6, fontSize: 11 }}
              onClick={() => onNavigate('leadership')}
            >
              <Icon name="bi-arrow-left" /> Dashboard
            </button>
          )}
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>KPI Repository</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
            {kpis.length} KPIs across {families.length} families
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className="ah-badge ah-kpi-on-track">{onTrackCount} On Track</span>
          <span className="ah-badge ah-kpi-at-risk">{atRiskCount} At Risk</span>
          <span className="ah-badge ah-kpi-off-track">{offTrackCount} Off Track</span>
          <button className="ah-add-btn" onClick={() => setShowKPIForm(true)}>
            <Icon name="bi-plus-lg" /> Add KPI
          </button>
        </div>
      </div>

      {/* 7 summary cards */}
      <div className="ah-kpi-repo-summary">
        <SummaryCard val={kpis.length}                                           label="Total KPIs" />
        <SummaryCard val={onTrackCount}                                          label="On Track"     color="#007560" />
        <SummaryCard val={atRiskCount}                                           label="At Risk"      color="#ca8a04" />
        <SummaryCard val={offTrackCount}                                         label="Off Track"    color="#dc2626" />
        <SummaryCard val={kpis.filter(k => k.division === 'HR').length}      label="HR KPIs"      color="#7c3aed" />
        <SummaryCard val={kpis.filter(k => k.division === 'Finance').length} label="Finance KPIs" color="#0ea5e9" />
        <SummaryCard val={kpis.filter(k => k.division === 'Billing').length} label="Billing KPIs" color="#007560" />
      </div>

      {/* KPI Families health pills */}
      <div className="ah-kpi-repo-families">
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 6, whiteSpace: 'nowrap' }}>
          KPI Families
        </span>
        {AH_KPI_FAMILIES.map(fam => {
          const pct      = Math.round(fam.onTrack / fam.total * 100)
          const col      = pct >= 80 ? '#007560' : pct >= 60 ? '#ca8a04' : '#dc2626'
          const isActive = familyFilter === fam.family
          return (
            <button
              key={fam.family}
              onClick={() => setFamilyFilter(isActive ? 'all' : fam.family)}
              className="ah-kpi-family-pill"
              style={{
                borderColor:  isActive ? col : 'rgba(0,117,96,0.2)',
                background:   isActive ? `${col}18` : 'transparent',
                color:        isActive ? col : 'var(--text)',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 12 }}>{fam.family}</span>
              <span style={{ fontSize: 11, marginLeft: 6, color: col }}>{fam.onTrack}/{fam.total}</span>
            </button>
          )
        })}
      </div>

      {/* Filter bar */}
      <div className="ah-kpi-repo-filter-bar">
        <div style={{ flex: 1, minWidth: 180 }}>
          <div className="ah-filter-label">Search</div>
          <input
            className="ah-search"
            placeholder="KPI name, function…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <FilterSelect label="Division" value={divFilter} onChange={v => setDivFilter(v as DivFilter)}>
          <option value="all">All Divisions</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Billing">Billing</option>
        </FilterSelect>
        <FilterSelect label="Status" value={statFilter} onChange={v => setStatFilter(v as StatFilter)}>
          <option value="all">All Statuses</option>
          <option value="on_track">On Track</option>
          <option value="at_risk">At Risk</option>
          <option value="off_track">Off Track</option>
        </FilterSelect>
        <FilterSelect label="KPI Family" value={familyFilter} onChange={v => setFamilyFilter(v)}>
          <option value="all">All Families</option>
          {families.map(f => <option key={f} value={f}>{f}</option>)}
        </FilterSelect>
        <FilterSelect label="Scope" value={scopeFilter} onChange={v => setScopeFilter(v as ScopeFilter)}>
          <option value="all">All Scopes</option>
          <option value="enterprise">Enterprise</option>
          <option value="division">Division</option>
          <option value="department">Department</option>
        </FilterSelect>
        {hasFilters && (
          <div>
            <div className="ah-filter-label">&nbsp;</div>
            <button className="ah-stream-drill-btn" onClick={clearFilters}>
              <Icon name="bi-x-circle" /> Clear
            </button>
          </div>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', paddingBottom: 6 }}>
            {filtered.length}/{kpis.length}
          </span>
          <button className="ah-stream-drill-btn" onClick={() => setExpandedGroups(new Set(Object.keys(grouped)))}>
            <Icon name="bi-arrows-expand" /> Expand All
          </button>
          <button className="ah-stream-drill-btn" onClick={() => setExpandedGroups(new Set())}>
            <Icon name="bi-arrows-collapse" /> Collapse All
          </button>
        </div>
      </div>

      {/* KPI Groups */}
      {Object.entries(grouped).map(([groupKey, groupKpis]) => {
        const isOpen    = expandedGroups.has(groupKey)
        const [div]     = groupKey.split(' — ')
        const onTrackN  = groupKpis.filter(k => k.status === 'on_track').length
        const atRiskN   = groupKpis.filter(k => k.status === 'at_risk').length
        const offTrackN = groupKpis.filter(k => k.status === 'off_track').length
        return (
          <div key={groupKey} className="ah-kpi-repo-group">
            <button className="ah-kpi-repo-group-head" onClick={() => toggleGroup(groupKey)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Icon name={isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} />
                <span style={{ fontWeight: 700, fontSize: 13 }}>{groupKey}</span>
                <span className={`ah-badge ah-badge-${div.toLowerCase()}`} style={{ fontSize: 10 }}>{div}</span>
                <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{groupKpis.length} KPI{groupKpis.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {onTrackN  > 0 && <span className="ah-badge ah-kpi-on-track">{onTrackN} On Track</span>}
                {atRiskN   > 0 && <span className="ah-badge ah-kpi-at-risk">{atRiskN} At Risk</span>}
                {offTrackN > 0 && <span className="ah-badge ah-kpi-off-track">{offTrackN} Off Track</span>}
              </div>
            </button>

            {isOpen && (
              <div style={{ overflowX: 'auto' }}>
                <table className="ah-table">
                  <thead>
                    <tr>
                      <th>KPI Name</th>
                      <th>Family</th>
                      <th>Current</th>
                      <th>Target</th>
                      <th>Status</th>
                      <th>Trend</th>
                      <th>Frequency</th>
                      <th>Owner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupKpis.map(kpi => {
                      const col     = statusColor(kpi.status)
                      const pct     = achievementPct(kpi)
                      const isGood  = kpi.lowerIsBetter ? kpi.trend === 'down' : kpi.trend === 'up'
                      const trendCol = kpi.trend === 'flat' ? 'var(--text-muted)' : isGood ? '#007560' : '#dc2626'
                      const isNA    = kpi.achievable === 'no'
                      return (
                        <tr key={kpi.id} onClick={() => setSelectedKPI(kpi)} className="ah-kpi-repo-row">
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: 12.5 }}>{kpi.kpiName}</span>
                              {isNA && (
                                <button
                                  className="ah-ban-badge"
                                  style={{ cursor: 'pointer' }}
                                  onClick={e => { e.stopPropagation(); setSelectedNAKPI(kpi) }}
                                  title="View not-achievable assessment"
                                >
                                  <Icon name="bi-x-circle-fill" /> Not Achievable
                                </button>
                              )}
                            </div>
                            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2 }}>{pct}% achieved · {kpi.scope}</div>
                          </td>
                          <td>
                            <span className="ah-badge" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', fontSize: 10.5 }}>
                              {kpi.kpiFamily}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, fontSize: 13, color: col, whiteSpace: 'nowrap' }}>
                            {kpi.currentValue}{kpi.unit}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {kpi.targetValue}{kpi.unit}
                          </td>
                          <td>
                            <span className="ah-badge" style={{ background: `${col}18`, color: col }}>
                              {statusLabel(kpi.status)}
                            </span>
                          </td>
                          <td style={{ color: trendCol, fontSize: 12.5, whiteSpace: 'nowrap' }}>
                            {kpi.trend === 'up'   && <><Icon name="bi-caret-up-fill" /> +{kpi.trendDelta}</>}
                            {kpi.trend === 'down' && <><Icon name="bi-caret-down-fill" /> {kpi.trendDelta}</>}
                            {kpi.trend === 'flat' && <><Icon name="bi-dash" /> Flat</>}
                          </td>
                          <td style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {kpi.frequency}
                          </td>
                          <td style={{ fontSize: 11.5 }}>{kpi.owner.split(' ').slice(0, 2).join(' ')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
          <Icon name="bi-inbox" style={{ fontSize: 32 }} />
          <div style={{ marginTop: 10, fontSize: 14 }}>No KPIs match your filters</div>
          {hasFilters && (
            <button className="ah-stream-drill-btn" onClick={clearFilters} style={{ marginTop: 12 }}>
              <Icon name="bi-x-circle" /> Clear Filters
            </button>
          )}
        </div>
      )}

      {selectedKPI    && <KPIDetailOverlay kpi={selectedKPI} onClose={() => setSelectedKPI(null)} />}
      {selectedNAKPI  && <NotAchievableModal kpi={selectedNAKPI} onClose={() => setSelectedNAKPI(null)} />}
      {showKPIForm    && (
        <KPIFormPanel
          onClose={() => setShowKPIForm(false)}
          onSaved={handleSaved}
        />
      )}
      <NotificationToast toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
