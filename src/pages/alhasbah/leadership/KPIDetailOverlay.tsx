import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { AH_AGENTS, AH_USE_CASES, type AHKPI, type AHKPIStatus } from '../data'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts'

interface Props {
  kpi: AHKPI
  onClose: () => void
}

const TT_STYLE = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 }

function statusColor(s: AHKPIStatus) {
  return s === 'on_track' ? '#007560' : s === 'at_risk' ? '#ca8a04' : '#dc2626'
}
function statusLabel(s: AHKPIStatus) {
  return s === 'on_track' ? 'On Track' : s === 'at_risk' ? 'At Risk' : 'Off Track'
}
function statusIcon(s: AHKPIStatus) {
  return s === 'on_track' ? 'bi-check-circle-fill' : s === 'at_risk' ? 'bi-exclamation-circle' : 'bi-x-circle'
}
function achievementPct(kpi: AHKPI) {
  if (kpi.targetValue === 0) return 0
  const ratio = kpi.lowerIsBetter
    ? kpi.currentValue <= kpi.targetValue ? 1 : kpi.targetValue / kpi.currentValue
    : kpi.currentValue / kpi.targetValue
  return Math.min(Math.round(ratio * 100), 100)
}

function scopeLabel(s: string) {
  return s === 'enterprise' ? 'Enterprise' : s === 'division' ? 'Division' : 'Department'
}

function achievableLabel(a: string) {
  return a === 'yes' ? 'Achievable' : a === 'partial' ? 'Partially Achievable' : 'Not Achievable'
}
function achievableColor(a: string) {
  return a === 'yes' ? '#007560' : a === 'partial' ? '#ca8a04' : '#dc2626'
}

function statusInterpretation(kpi: AHKPI) {
  const pct = achievementPct(kpi)
  if (kpi.status === 'on_track')  return `This KPI is performing well at ${pct}% achievement. ${kpi.lowerIsBetter ? 'The value is trending in the right direction.' : 'Continue current trajectory to maintain target.'}`
  if (kpi.status === 'at_risk')   return `This KPI is at ${pct}% of target and requires attention. ${kpi.lowerIsBetter ? 'Further reduction is needed to meet the target.' : 'Corrective actions should be reviewed within 30 days.'}`
  return `This KPI is significantly below target at ${pct}% achievement. Immediate escalation and corrective plan required.`
}

export default function KPIDetailOverlay({ kpi, onClose }: Props) {
  useScrollLock()

  const col  = statusColor(kpi.status)
  const pct  = achievementPct(kpi)
  const agent = AH_AGENTS.find(a => a.id === kpi.agentId)
  const linkedUCs = AH_USE_CASES.filter(u => u.agentId === kpi.agentId && u.division === kpi.division).slice(0, 4)

  const isGoodTrend = kpi.lowerIsBetter ? kpi.trend === 'down' : kpi.trend === 'up'
  const trendColor  = kpi.trend === 'flat' ? 'var(--text-muted)' : isGoodTrend ? '#007560' : '#dc2626'
  const trendIcon   = kpi.trend === 'up' ? 'bi-caret-up-fill' : kpi.trend === 'down' ? 'bi-caret-down-fill' : 'bi-dash'

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ah-panel ah-kpi-overlay-panel" role="dialog" aria-label="KPI Detail">
        {/* Header */}
        <div className="ah-panel-head" style={{ borderBottom: `2px solid ${col}60` }}>
          <button className="ah-panel-close" onClick={onClose} aria-label="Close">
            <Icon name="bi-x-lg" />
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 20 }}><Icon name={statusIcon(kpi.status)} /></span>
            <div>
              <div className="ah-panel-name" style={{ fontSize: 14, lineHeight: 1.3 }}>{kpi.kpiName}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                <span className="ah-badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{kpi.division}</span>
                <span className="ah-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}>{kpi.kpiFamily}</span>
                <span className="ah-badge" style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)' }}>{scopeLabel(kpi.scope)}</span>
                <span className="ah-badge" style={{ background: `${col}50`, color: '#fff', border: `1px solid ${col}80` }}>
                  <Icon name={statusIcon(kpi.status)} /> {statusLabel(kpi.status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="ah-panel-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Definition */}
          <div className="ah-kpi-definition-box">
            <span style={{ color: '#007560', flexShrink: 0 }}><Icon name="bi-info-circle" /></span>
            <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{kpi.kpiDefinition}</div>
          </div>

          {/* Current vs Target hero */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: `${col}10`, border: `1px solid ${col}30`, borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6 }}>Current</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: col, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", lineHeight: 1 }}>
                {kpi.currentValue}<span style={{ fontSize: 16 }}>{kpi.unit}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>Last measured {kpi.lastMeasured}</div>
            </div>
            <div style={{ background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.12)', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 6 }}>Target</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", lineHeight: 1 }}>
                {kpi.targetValue}<span style={{ fontSize: 16, color: 'var(--text-muted)' }}>{kpi.unit}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 6 }}>{kpi.frequency} frequency</div>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Achievement</span>
              <span style={{ fontWeight: 700, color: col }}>{pct}%</span>
            </div>
            <div style={{ height: 10, borderRadius: 5, background: 'rgba(0,117,96,0.08)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 5, background: col, transition: 'width 0.5s ease' }} />
            </div>
          </div>

          {/* 6-cell detail grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {[
              { label: 'Frequency',   val: kpi.frequency.charAt(0).toUpperCase() + kpi.frequency.slice(1) },
              { label: 'Owner',       val: kpi.owner },
              { label: 'Data Source', val: kpi.dataSource ?? 'Agent Processing Log' },
              { label: 'Last Measured', val: kpi.lastMeasured },
              { label: 'Trend',       val: kpi.trend === 'flat' ? 'Flat' : `${kpi.trendDelta > 0 ? '+' : ''}${kpi.trendDelta}${kpi.unit}`, color: trendColor, icon: trendIcon },
              { label: 'Achievable',  val: achievableLabel(kpi.achievable), color: achievableColor(kpi.achievable) },
            ].map(cell => (
              <div key={cell.label} className="ah-kpi-meta-cell">
                <div className="ah-kpi-meta-label">{cell.label}</div>
                <div className="ah-kpi-meta-val" style={cell.color ? { color: cell.color } : undefined}>
                  {cell.icon && <span style={{ marginRight: 4 }}><Icon name={cell.icon} /></span>}
                  {cell.val}
                </div>
              </div>
            ))}
          </div>

          {/* Not achievable reason */}
          {kpi.achievable === 'no' && kpi.notAchievableReason && (
            <div style={{ background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: '#dc2626' }}><Icon name="bi-x-circle" /></span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Why Not Achievable</span>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{kpi.notAchievableReason}</div>
            </div>
          )}

          {/* Historical trend chart */}
          <div>
            <div className="ah-kpi-section-label">Historical Trend</div>
            <div className="ah-kpi-chart-wrap">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={kpi.history} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                  <ReferenceLine y={kpi.targetValue} stroke="#06b6d4" strokeDasharray="4 3" strokeWidth={1.5} />
                  <Line dataKey="target" stroke="#06b6d4" strokeWidth={1.5} dot={false} strokeDasharray="4 3" name="Target" />
                  <Line dataKey="actual" stroke={col} strokeWidth={2.5} dot={{ r: 3, fill: col }} activeDot={{ r: 5 }} name="Actual" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Status interpretation */}
          <div style={{ background: `${col}08`, border: `1px solid ${col}20`, borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: col, marginBottom: 6 }}>Status Interpretation</div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{statusInterpretation(kpi)}</div>
          </div>

          {/* Linked agent & use cases */}
          {agent && (
            <div>
              <div className="ah-kpi-section-label">Linked Agent</div>
              <div style={{ background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Icon name="bi-robot" />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{agent.division} · {agent.status}</div>
                </div>
              </div>
            </div>
          )}
          {linkedUCs.length > 0 && (
            <div>
              <div className="ah-kpi-section-label">Related Use Cases</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {linkedUCs.map(uc => (
                  <div key={uc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)', borderRadius: 7 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{uc.name}</div>
                    <span className="ah-badge" style={{ fontSize: 10, background: uc.status === 'live' ? 'rgba(0,117,96,0.12)' : 'rgba(202,138,4,0.12)', color: uc.status === 'live' ? '#007560' : '#ca8a04' }}>
                      {uc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
