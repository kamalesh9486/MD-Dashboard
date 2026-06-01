import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { type AHKPI } from '../data'

function statusColor(s: string) {
  return s === 'on_track' ? '#007560' : s === 'at_risk' ? '#ca8a04' : '#dc2626'
}

interface Props {
  kpi: AHKPI
  onClose: () => void
}

export default function NotAchievableModal({ kpi, onClose }: Props) {
  useScrollLock()
  const col = statusColor(kpi.status)

  return (
    <div className="ah-not-achievable-backdrop" onClick={onClose}>
      <div
        className="ah-not-achievable-modal"
        role="dialog"
        aria-labelledby="na-modal-title"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(220,38,38,0.08), rgba(220,38,38,0.04))',
          borderBottom: '1px solid rgba(220,38,38,0.15)',
          padding: '18px 20px', borderRadius: '12px 12px 0 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="ah-ban-badge">
                <Icon name="bi-x-circle-fill" /> Not Achievable
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.id.toUpperCase()}</span>
            </div>
            <div id="na-modal-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.35 }}>
              {kpi.kpiName}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>
              {kpi.division} · {kpi.function} · {kpi.kpiFamily}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ah-panel-close"
            aria-label="Close"
          >
            <Icon name="bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Current vs Target */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: `${col}0a`, border: `1px solid ${col}28`, textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Current Value</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: col, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>
                {kpi.currentValue}{kpi.unit}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                {kpi.lowerIsBetter ? 'Lower is better' : 'Higher is better'}
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.15)', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Target Value</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#007560', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>
                {kpi.targetValue}{kpi.unit}
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>
                {kpi.frequency} measurement
              </div>
            </div>
          </div>

          {/* Gap indicator */}
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.12)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#dc2626', flexShrink: 0, fontSize: 16 }}><Icon name="bi-exclamation-triangle-fill" /></span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Performance Gap</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {kpi.lowerIsBetter
                  ? `Current is ${(kpi.currentValue - kpi.targetValue).toFixed(1)}${kpi.unit} above target`
                  : `Current is ${(kpi.targetValue - kpi.currentValue).toFixed(1)}${kpi.unit} below target`
                } · Achievability: <span style={{ fontWeight: 700, color: '#dc2626' }}>Not Achievable</span>
              </div>
            </div>
          </div>

          {/* Reason */}
          {kpi.notAchievableReason && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="bi-chat-left-text" /> Reason for Not Achievable Assessment
              </div>
              <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.75, padding: '14px 16px', borderRadius: 10, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.1)' }}>
                {kpi.notAchievableReason}
              </div>
            </div>
          )}

          {/* Owner + last measured */}
          <div style={{ display: 'flex', gap: 20, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>KPI Owner</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{kpi.owner}</div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Last Measured</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{kpi.lastMeasured}</div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Scope</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', textTransform: 'capitalize' }}>{kpi.scope}</div>
            </div>
          </div>

          {/* Close button */}
          <button className="ah-add-btn" onClick={onClose} style={{ width: '100%', marginTop: 4 }}>
            <Icon name="bi-check-lg" /> Acknowledged
          </button>
        </div>
      </div>
    </div>
  )
}
