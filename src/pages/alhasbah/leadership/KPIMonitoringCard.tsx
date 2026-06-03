import Icon from '../../../components/Icon'
import { AH_KPI_FAMILIES } from '../data'
import { useAlHasbah } from '../AlHasbahContext'

interface Props { onNavigate: () => void }

export default function KPIMonitoringCard({ onNavigate }: Props) {
  const { kpis } = useAlHasbah()

  const total    = kpis.length
  const onTrack  = kpis.filter(k => k.status === 'on_track').length
  const atRisk   = kpis.filter(k => k.status === 'at_risk').length
  const offTrack = kpis.filter(k => k.status === 'off_track').length
  const healthPct = total > 0 ? Math.round((onTrack / total) * 100) : 0

  const divisions = ['HR', 'Finance', 'Billing'] as const
  const byDiv = divisions.map(d => ({
    label: d,
    count: kpis.filter(k => k.division === d).length,
  }))

  return (
    <div className="ah-stream-card">
      {/* Header */}
      <div className="ah-stream-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ah-stream-icon-box" style={{ background: 'rgba(6,182,212,0.1)', color: '#06b6d4' }}>
            <Icon name="bi-activity" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>KPI Monitoring</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Performance at a glance</div>
          </div>
        </div>
        <button className="ah-stream-drill-btn" onClick={onNavigate}>
          Open Repository <Icon name="bi-arrow-right" />
        </button>
      </div>

      {/* Total + status chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{total}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span className="ah-badge ah-kpi-on-track">{onTrack} On Track</span>
          <span className="ah-badge ah-kpi-at-risk">{atRisk} At Risk</span>
          <span className="ah-badge ah-kpi-off-track">{offTrack} Off Track</span>
        </div>
      </div>

      {/* Health bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>KPI Health</span>
          <span style={{ fontWeight: 700, color: healthPct >= 75 ? '#007560' : '#ca8a04' }}>{healthPct}%</span>
        </div>
        <div style={{ background: 'rgba(0,117,96,0.1)', borderRadius: 6, height: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${healthPct}%`, background: healthPct >= 75 ? '#007560' : '#ca8a04', borderRadius: 6, transition: 'width .4s ease' }} />
        </div>
      </div>

      {/* By Division */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {byDiv.map(d => (
          <span key={d.label} className={`ah-badge ah-badge-${d.label.toLowerCase()}`}>
            {d.label}: {d.count}
          </span>
        ))}
      </div>

      {/* Top KPI Families */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>Top 5 Families</div>
        {AH_KPI_FAMILIES.map(fam => {
          const pct = Math.round((fam.onTrack / fam.total) * 100)
          return (
            <div key={fam.family} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--text)' }}>{fam.family}</span>
                <span style={{ color: 'var(--text-muted)' }}>{fam.onTrack}/{fam.total} on track</span>
              </div>
              <div style={{ background: 'rgba(0,117,96,0.08)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#007560' : pct >= 75 ? '#ca8a04' : '#dc2626', borderRadius: 4 }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
