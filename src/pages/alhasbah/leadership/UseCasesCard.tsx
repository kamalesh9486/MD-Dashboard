import Icon from '../../../components/Icon'
import { useAlHasbah } from '../AlHasbahContext'

interface Props { onNavigate: () => void }

export default function UseCasesCard({ onNavigate }: Props) {
  const { useCases, flowMetrics } = useAlHasbah()

  const live     = useCases.filter(u => u.status === 'live').length
  const pipeline = useCases.filter(u => u.status === 'pipeline').length
  const planned  = useCases.filter(u => u.status === 'planned').length
  const total    = useCases.length

  const totalAI     = flowMetrics.reduce((s, m) => s + m.aiFlows, 0)
  const totalManual = flowMetrics.reduce((s, m) => s + m.manualFlows, 0)
  const adoptionPct = Math.round((totalAI / (totalAI + totalManual)) * 100)
  const TARGET_PCT  = 80

  const byAudience: { label: string; count: number; division: 'HR' | 'Finance' | 'Billing' }[] = [
    { label: 'HR Employees',   count: useCases.filter(u => u.division === 'HR').length,      division: 'HR' },
    { label: 'Finance Staff',  count: useCases.filter(u => u.division === 'Finance').length,  division: 'Finance' },
    { label: 'Billing Staff',  count: useCases.filter(u => u.division === 'Billing').length,  division: 'Billing' },
  ]

  const AUDIENCE_COLORS: Record<string, string> = {
    HR: '#7c3aed', Finance: '#0ea5e9', Billing: '#007560',
  }

  return (
    <div className="ah-stream-card">
      {/* Header */}
      <div className="ah-stream-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="ah-stream-icon-box" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}>
            <Icon name="bi-collection-fill" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Use Cases</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Portfolio snapshot</div>
          </div>
        </div>
        <button className="ah-stream-drill-btn" onClick={onNavigate}>
          View Repository <Icon name="bi-arrow-right" />
        </button>
      </div>

      {/* Total + status chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)' }}>{total}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <span className="ah-badge ah-status-live">{live} Live</span>
          <span className="ah-badge ah-status-pipeline">{pipeline} Pipeline</span>
          <span className="ah-badge ah-status-planned">{planned} Planned</span>
        </div>
      </div>

      {/* AI adoption bar */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 6 }}>
          <span>Overall AI Adoption</span>
          <span style={{ fontWeight: 700, color: adoptionPct >= TARGET_PCT ? '#007560' : '#ca8a04' }}>{adoptionPct}% <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/ {TARGET_PCT}% target</span></span>
        </div>
        <div style={{ background: 'rgba(0,117,96,0.1)', borderRadius: 6, height: 10, overflow: 'hidden', position: 'relative' }}>
          {/* Target marker */}
          <div style={{ position: 'absolute', left: `${TARGET_PCT}%`, top: 0, bottom: 0, width: 2, background: 'rgba(0,0,0,0.2)', zIndex: 1 }} />
          <div style={{ height: '100%', width: `${adoptionPct}%`, background: adoptionPct >= TARGET_PCT ? '#007560' : '#ca8a04', borderRadius: 6, transition: 'width .4s ease' }} />
        </div>
      </div>

      {/* By Audience */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 10 }}>By Audience</div>
        {byAudience.map(row => (
          <div key={row.division} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>{row.label}</span>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>{row.count} UCs</span>
            </div>
            <div style={{ background: 'rgba(0,117,96,0.08)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(row.count / total * 100)}%`, background: AUDIENCE_COLORS[row.division], borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
