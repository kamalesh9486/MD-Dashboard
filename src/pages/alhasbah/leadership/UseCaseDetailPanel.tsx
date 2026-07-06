import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { type AHUseCase, type AHDivision } from '../data'
import { useAlHasbah } from '../AlHasbahContext'

interface Props {
  uc: AHUseCase
  onClose: () => void
}

const DIV_COLORS: Record<AHDivision, string> = {
  HR: '#7c3aed', Finance: '#ca8a04', Billing: '#0ea5e9',
}

function statusColor(s: string) {
  return s === 'live' ? '#007560' : s === 'pipeline' ? '#3b82f6' : '#9ca3af'
}
function statusLabel(s: string) {
  return s === 'live' ? 'Live' : s === 'pipeline' ? 'In Pipeline' : 'Planned'
}
function statusIcon(s: string) {
  return s === 'live' ? 'bi-rocket-takeoff' : s === 'pipeline' ? 'bi-flask' : 'bi-calendar3'
}
function sevColor(s: string) {
  return s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#ca8a04' : '#94a3b8'
}
function incStatusColor(s: string) {
  return s === 'open' ? '#ef4444' : s === 'in_progress' ? '#ca8a04' : '#007560'
}
function incStatusLabel(s: string) {
  return s === 'open' ? 'Open' : s === 'in_progress' ? 'In Progress' : 'Resolved'
}
function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)', borderRadius: 8, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
    </div>
  )
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}><Icon name={icon} /></span>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
    </div>
  )
}

type Tab = 'overview' | 'performance' | 'incidents'

export default function UseCaseDetailPanel({ uc, onClose }: Props) {
  useScrollLock()
  const { agents, incidents: allIncidents, kpis: allKpis } = useAlHasbah()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const divColor  = DIV_COLORS[uc.division]
  const statCol   = statusColor(uc.status)
  const incidents = allIncidents.filter(i => i.agentId === uc.agentId)
  const openInc   = incidents.filter(i => i.status !== 'resolved')
  const kpis      = allKpis.filter(k => k.agentId === uc.agentId)
  const agentName = agents.find(a => a.id === uc.agentId)?.name ?? uc.agentId

  const milestones    = uc.milestones ?? []
  const processes     = uc.processes ?? []
  const sysInteg      = uc.systemsForIntegration ?? []
  const aiHandled     = Math.round(uc.annualVolume * uc.expectedEfficiency / 100)
  const manualFallbk  = uc.annualVolume - aiHandled
  const completedMs   = milestones.filter(m => m.status === 'completed').length
  const milestonePct  = milestones.length > 0 ? Math.round(completedMs / milestones.length * 100) : 0
  const effCol        = uc.expectedEfficiency >= 75 ? '#007560' : uc.expectedEfficiency >= 50 ? '#ca8a04' : '#dc2626'

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview',    label: 'Overview',                   icon: 'bi-info-circle' },
    { id: 'performance', label: 'Performance',                icon: 'bi-activity' },
    { id: 'incidents',   label: `Incidents (${incidents.length})`, icon: 'bi-exclamation-triangle' },
  ]

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ah-panel ah-uc-detail-panel" role="dialog" aria-label={`${uc.name} detail`}>
        {/* Header */}
        <div className="ah-panel-head" style={{ borderBottom: `2px solid ${divColor}60` }}>
          <button className="ah-panel-close" onClick={onClose} aria-label="Close">
            <Icon name="bi-x-lg" />
          </button>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <span className="ah-badge" style={{ background: `${divColor}14`, color: divColor, border: `1px solid ${divColor}28` }}>{uc.division}</span>
            <span className="ah-badge" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.2)', fontSize: 10 }}>{uc.domain}</span>
            <span className="ah-badge" style={{ background: `${statCol}12`, color: statCol, border: `1px solid ${statCol}28`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icon name={statusIcon(uc.status)} />{statusLabel(uc.status)}
            </span>
            {openInc.length > 0 && (
              <span className="ah-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="bi-exclamation-triangle" />{openInc.length} open
              </span>
            )}
          </div>
          <div className="ah-panel-name" style={{ fontSize: 14, lineHeight: 1.35 }}>{uc.name}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon name="bi-robot" />{agentName}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(0,117,96,0.08)' }}>
            {[
              { label: 'Annual Volume', val: uc.annualVolume > 0 ? uc.annualVolume.toLocaleString() : '—' },
              { label: 'Efficiency Target', val: `${uc.expectedEfficiency}%` },
              { label: 'Milestones', val: `${completedMs}/${milestones.length} done` },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div className="ah-uc-tab-bar">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`ah-uc-tab-btn${activeTab === t.id ? ' active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <Icon name={t.icon} />{t.label}
            </button>
          ))}
        </div>

        {/* Tab body */}
        <div className="ah-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* ── OVERVIEW ─────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <>
              <div>
                <SectionLabel icon="bi-file-text" title="Description" />
                <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)' }}>
                  {uc.description}
                </div>
              </div>

              <div>
                <SectionLabel icon="bi-bar-chart-line" title="Key Metrics" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <StatBox label="Target Cost Saving" value={`AED ${fmt(uc.targetCostSaving)}`} color="#007560" />
                  <StatBox label="Annual Volume"       value={uc.annualVolume > 0 ? uc.annualVolume.toLocaleString() : '—'} />
                  <StatBox label="Efficiency Target"   value={`${uc.expectedEfficiency}%`} color={effCol} />
                </div>
              </div>

              <div>
                <SectionLabel icon="bi-layers" title="SAP Module" />
                <span style={{ fontSize: 12, padding: '4px 10px', borderRadius: 5, background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)', display: 'inline-block' }}>
                  {uc.sapModule}
                </span>
              </div>

              <div>
                <SectionLabel icon="bi-database" title="Systems for Integration" />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {sysInteg.map(s => (
                    <span key={s} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: 'rgba(0,117,96,0.06)', color: 'var(--text-muted)', border: '1px solid rgba(0,117,96,0.12)' }}>{s}</span>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel icon="bi-calendar3" title="Key Dates" />
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {uc.startDate && (
                    <div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Start Date</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{uc.startDate}</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Planned Go-Live</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{uc.plannedGoLive || '—'}</div>
                  </div>
                  {uc.actualGoLive && (
                    <div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Actual Go-Live</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#007560' }}>{uc.actualGoLive}</div>
                    </div>
                  )}
                  {uc.targetEndDate && (
                    <div>
                      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Target End Date</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{uc.targetEndDate}</div>
                    </div>
                  )}
                </div>
              </div>

              {(uc.measurementType || uc.fteAvoidance) && (
                <div>
                  <SectionLabel icon="bi-activity" title="Measurement" />
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    {uc.measurementType && (
                      <div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>Measurement Type</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{uc.measurementType}</div>
                      </div>
                    )}
                    {uc.fteAvoidance !== undefined && uc.fteAvoidance > 0 && (
                      <div>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>FTE Avoidance</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{uc.fteAvoidance}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <SectionLabel icon="bi-check2-square" title={`Milestones (${completedMs}/${milestones.length})`} />
                <div style={{ marginBottom: 10 }}>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,117,96,0.1)', overflow: 'hidden', marginBottom: 4 }}>
                    <div style={{ height: '100%', width: `${milestonePct}%`, borderRadius: 3, background: '#007560', transition: 'width 0.4s' }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{milestonePct}% complete</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {milestones.map((ms, i) => {
                    const msIcon  = ms.status === 'completed' ? 'bi-check-circle-fill' : ms.status === 'in_progress' ? 'bi-clock' : 'bi-circle'
                    const msColor = ms.status === 'completed' ? '#007560' : ms.status === 'in_progress' ? '#ca8a04' : '#9ca3af'
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.07)' }}>
                        <span style={{ color: msColor, flexShrink: 0 }}><Icon name={msIcon} /></span>
                        <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{ms.name}</span>
                        {ms.plannedDate && <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{ms.plannedDate}</span>}
                        <span className="ah-badge" style={{ background: `${msColor}14`, color: msColor, border: `1px solid ${msColor}28`, fontSize: 10 }}>
                          {ms.status === 'completed' ? 'Done' : ms.status === 'in_progress' ? 'In Progress' : 'Pending'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Current State */}
              {uc.currentState && (
                <div>
                  <SectionLabel icon="bi-arrow-right-circle" title="Current State" />
                  <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, padding: '10px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.03)', border: '1px solid rgba(220,38,38,0.1)' }}>
                    {uc.currentState}
                  </div>
                </div>
              )}

              {/* Future State */}
              {uc.futureState && (
                <div>
                  <SectionLabel icon="bi-arrow-right-circle-fill" title="Future State (AI)" />
                  <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.7, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.12)' }}>
                    {uc.futureState}
                  </div>
                </div>
              )}

              {/* Processes */}
              {processes.length > 0 && (
                <div>
                  <SectionLabel icon="bi-diagram-3" title="Key Processes" />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {processes.map(p => (
                      <span key={p} style={{ fontSize: 11, padding: '3px 9px', borderRadius: 5, background: 'rgba(14,165,233,0.08)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dev Effort */}
              {uc.totalDevelopmentEffort > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)', borderRadius: 8 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#ca8a04', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{uc.totalDevelopmentEffort} days</div>
                    <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>Total Development Effort</div>
                  </div>
                </div>
              )}

              {kpis.length > 0 && (
                <div>
                  <SectionLabel icon="bi-activity" title={`Agent KPIs (${kpis.length})`} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {kpis.slice(0, 3).map(kpi => {
                      const col = kpi.status === 'on_track' ? '#007560' : kpi.status === 'at_risk' ? '#ca8a04' : '#dc2626'
                      return (
                        <div key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 6, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)' }}>
                          <span className="ah-badge" style={{ background: `${col}15`, color: col, fontSize: 10, flexShrink: 0 }}>
                            {kpi.status === 'on_track' ? 'On Track' : kpi.status === 'at_risk' ? 'At Risk' : 'Off Track'}
                          </span>
                          <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{kpi.kpiName}</span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{kpi.currentValue}{kpi.unit}</span>
                        </div>
                      )
                    })}
                    {kpis.length > 3 && <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 4 }}>+{kpis.length - 3} more KPIs on this agent</div>}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── PERFORMANCE ──────────────────────────────────────── */}
          {activeTab === 'performance' && (
            <>
              {uc.status === 'live' && uc.annualVolume > 0 ? (
                <>
                  <div>
                    <SectionLabel icon="bi-bar-chart-line" title="Volume & Adoption" />
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <StatBox label="Annual Transactions" value={uc.annualVolume.toLocaleString()} />
                      <StatBox label="AI Handled"          value={aiHandled.toLocaleString()}       color="#007560" />
                      <StatBox label="Manual Fallback"     value={manualFallbk.toLocaleString()}    color="#ca8a04" />
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)' }}>
                      <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,117,96,0.1)', overflow: 'hidden', marginBottom: 6 }}>
                        <div style={{ height: '100%', width: `${uc.expectedEfficiency}%`, borderRadius: 4, background: effCol, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                        <span style={{ color: '#007560' }}>Target AI {uc.expectedEfficiency}%</span>
                        <span style={{ color: '#ca8a04' }}>Manual {100 - uc.expectedEfficiency}%</span>
                      </div>
                    </div>
                    {uc.adoptionActual !== undefined && (
                      <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.1)' }}>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Actual vs Target Adoption</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 3 }}>Actual</div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,117,96,0.1)', overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', width: `${uc.adoptionActual}%`, borderRadius: 3, background: uc.adoptionActual >= uc.expectedEfficiency ? '#007560' : '#ca8a04' }} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: uc.adoptionActual >= uc.expectedEfficiency ? '#007560' : '#ca8a04' }}>{uc.adoptionActual}%</div>
                          </div>
                          <div style={{ width: 1, background: 'rgba(0,117,96,0.1)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 3 }}>Target</div>
                            <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,117,96,0.1)', overflow: 'hidden', marginBottom: 3 }}>
                              <div style={{ height: '100%', width: `${uc.expectedEfficiency}%`, borderRadius: 3, background: `${effCol}60` }} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: effCol }}>{uc.expectedEfficiency}%</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <SectionLabel icon="bi-currency-dirham" title="Cost Impact" />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <StatBox label="Target Cost Saving" value={`AED ${fmt(uc.targetCostSaving)}`} color="#007560" />
                      <StatBox label="AI Efficiency Rate"  value={`${uc.expectedEfficiency}%`}       color={effCol} />
                      <StatBox label="Est. AI Cost Saving" value={`AED ${fmt(Math.round(uc.targetCostSaving * uc.expectedEfficiency / 100))}`} color="#06b6d4" />
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <span style={{ fontSize: 32 }}><Icon name="bi-bar-chart" /></span>
                  <div style={{ marginTop: 12, fontSize: 13 }}>Performance data available after go-live</div>
                  <div style={{ fontSize: 11.5, marginTop: 4 }}>Planned go-live: {uc.plannedGoLive}</div>
                </div>
              )}
            </>
          )}

          {/* ── INCIDENTS ─────────────────────────────────────────── */}
          {activeTab === 'incidents' && (
            <>
              <SectionLabel icon="bi-exclamation-triangle" title={`Agent Incidents (${incidents.length})`} />
              {incidents.length === 0 ? (
                <div style={{ padding: '12px 14px', borderRadius: 8, textAlign: 'center', background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)', fontSize: 12, color: 'var(--text-muted)' }}>
                  No incidents reported for this agent.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {incidents.map(inc => (
                    <div key={inc.id} style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <span className="ah-badge" style={{ background: `${sevColor(inc.severity)}12`, color: sevColor(inc.severity), border: `1px solid ${sevColor(inc.severity)}28`, fontSize: 10, flexShrink: 0 }}>
                          {inc.severity.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inc.title}
                        </span>
                        <span className="ah-badge" style={{ background: `${incStatusColor(inc.status)}10`, color: incStatusColor(inc.status), fontSize: 10, flexShrink: 0 }}>
                          {incStatusLabel(inc.status)}
                        </span>
                      </div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {inc.description.length > 120 ? `${inc.description.slice(0, 120)}…` : inc.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </aside>
    </>
  )
}
