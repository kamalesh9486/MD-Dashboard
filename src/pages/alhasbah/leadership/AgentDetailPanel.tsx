import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { AH_USE_CASES_MUT, AH_INCIDENTS_MUT, AH_KPIS, type AHAgent, type AHDivision } from '../data'

interface Props {
  agent: AHAgent
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

function StatBox({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)', borderRadius: 8, minWidth: 0 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: color ?? 'var(--text)', lineHeight: 1, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif" }}>{value}</div>
      <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 10.5, color: color ?? 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
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

function Chip({ label, color }: { label: string; color?: string }) {
  return (
    <span style={{
      fontSize: 11, padding: '3px 9px', borderRadius: 5,
      background: color ? `${color}14` : 'rgba(0,117,96,0.06)',
      color: color ?? 'var(--text-muted)',
      border: `1px solid ${color ? `${color}28` : 'rgba(0,117,96,0.12)'}`,
      whiteSpace: 'nowrap',
      fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
    }}>
      {label}
    </span>
  )
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export default function AgentDetailPanel({ agent, onClose }: Props) {
  useScrollLock()

  const divColor  = DIV_COLORS[agent.division]
  const statCol   = statusColor(agent.status)
  const linkedUCs = AH_USE_CASES_MUT.filter(u => u.agentId === agent.id)
  const incidents  = AH_INCIDENTS_MUT.filter(i => i.agentId === agent.id)
  const openInc    = incidents.filter(i => i.status !== 'resolved')
  const kpis       = AH_KPIS.filter(k => k.agentId === agent.id)

  const adoptCol = agent.aiAdoptionPct >= 80 ? '#007560' : agent.aiAdoptionPct >= 50 ? '#ca8a04' : '#dc2626'

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ah-panel ah-agent-detail-panel" role="dialog" aria-label={`${agent.name} detail`}>
        {/* Header */}
        <div className="ah-panel-head" style={{ borderBottom: `2px solid ${divColor}60` }}>
          <button className="ah-panel-close" onClick={onClose} aria-label="Close">
            <Icon name="bi-x-lg" />
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 11, background: `${divColor}14`, border: `1px solid ${divColor}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: divColor, fontSize: 20, flexShrink: 0 }}>
              <Icon name="bi-robot" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                <span className="ah-badge" style={{ background: `${divColor}14`, color: divColor, border: `1px solid ${divColor}28` }}>{agent.division}</span>
                <span className="ah-badge" style={{ background: `${statCol}12`, color: statCol, border: `1px solid ${statCol}28`, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon name={statusIcon(agent.status)} />{statusLabel(agent.status)}
                </span>
                {openInc.length > 0 && (
                  <span className="ah-badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="bi-exclamation-triangle" />{openInc.length} open
                  </span>
                )}
              </div>
              <div className="ah-panel-name" style={{ fontSize: 14, lineHeight: 1.35 }}>{agent.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 3 }}>{agent.targetEndUsers}</div>
            </div>
          </div>
          {/* Quick meta row */}
          <div style={{ display: 'flex', gap: 20, marginTop: 14, paddingTop: 10, borderTop: '1px solid rgba(0,117,96,0.08)' }}>
            {[
              { label: 'Business Owner', val: agent.businessOwner },
              { label: 'Linked UCs',     val: String(linkedUCs.length) },
              { label: 'Total Incidents',val: String(incidents.length), color: incidents.length > 0 ? '#ca8a04' : undefined },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginBottom: 2 }}>{m.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: m.color ?? 'var(--text)' }}>{m.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="ah-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Description */}
          {agent.description && (
            <div>
              <SectionLabel icon="bi-chat-left-text" title="Description" />
              <div style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.7,
                background: 'rgba(0,117,96,0.03)', borderRadius: 8,
                padding: '12px 14px', border: '1px solid rgba(0,117,96,0.1)',
              }}>
                {agent.description}
              </div>
            </div>
          )}

          {/* Cost & Value */}
          <div>
            <SectionLabel icon="bi-currency-dirham" title="Cost & Value" />
            <div style={{ display: 'flex', gap: 8 }}>
              <StatBox label="Target Cost Saving" value={`AED ${fmt(agent.targetCostSaving)}`} color="#007560" />
              <StatBox label="FTE Hrs/yr Target"  value={fmt(agent.fteSavingsTarget)}            color="#06b6d4" />
              <StatBox label="Open Incidents"     value={agent.openIncidents} color={agent.openIncidents > 0 ? '#ef4444' : '#007560'} />
              <StatBox label="UC Adoption"        value={`${agent.liveUseCases}/${agent.totalUseCases}`} />
            </div>
          </div>

          {/* Request Volume (live/pipeline with transactions) */}
          {agent.annualTransactions > 0 && (
            <div>
              <SectionLabel icon="bi-activity" title="Request Volume" />
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <StatBox label="Annual Transactions" value={agent.annualTransactions.toLocaleString()} color="var(--text)" />
                <StatBox label="AI Handled"          value={`${Math.round(agent.annualTransactions * agent.aiAdoptionPct / 100).toLocaleString()}`} color="#007560" />
                <StatBox label="Manual Fallback"     value={`${Math.round(agent.annualTransactions * (1 - agent.aiAdoptionPct / 100)).toLocaleString()}`} color="#ca8a04" />
              </div>
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.1)' }}>
                <div style={{ height: 8, borderRadius: 4, background: 'rgba(0,117,96,0.1)', overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${agent.aiAdoptionPct}%`, borderRadius: 4, background: adoptCol, transition: 'width 0.4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600 }}>
                  <span style={{ color: '#007560' }}>AI {agent.aiAdoptionPct}%</span>
                  <span style={{ color: '#ca8a04' }}>Manual {100 - agent.aiAdoptionPct}%</span>
                </div>
              </div>
            </div>
          )}

          {/* AI Configuration */}
          <div>
            <SectionLabel icon="bi-cpu" title="AI Configuration" />
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>Models Used</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {agent.modelsUsed.map(m => <Chip key={m} label={m} color="#7c3aed" />)}
              </div>
            </div>
          </div>

          {/* Integrated Systems */}
          <div>
            <SectionLabel icon="bi-database" title="Integrated Systems" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {agent.systemsIntegrated.map(s => <Chip key={s} label={s} />)}
            </div>
          </div>

          {/* Technology Stack */}
          {(agent.mcpServers.length > 0 || agent.aiTools.length > 0 || agent.ptuUsage > 0) && (
            <div>
              <SectionLabel icon="bi-stack" title="Technology Stack" />
              {agent.mcpServers.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>MCP Servers</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {agent.mcpServers.map(s => <Chip key={s} label={s} color="#0ea5e9" />)}
                  </div>
                </div>
              )}
              {agent.aiTools.length > 0 && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>AI Tools / SDKs</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {agent.aiTools.map(t => <Chip key={t} label={t} color="#7c3aed" />)}
                  </div>
                </div>
              )}
              {agent.ptuUsage > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <StatBox label="PTU Usage" value={`${agent.ptuUsage.toLocaleString()} tokens/mo`} color="#007560" />
                </div>
              )}
            </div>
          )}

          {/* KPIs */}
          {kpis.length > 0 && (
            <div>
              <SectionLabel icon="bi-bar-chart-line" title={`KPIs (${kpis.length})`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {kpis.map(kpi => {
                  const col = kpi.status === 'on_track' ? '#007560' : kpi.status === 'at_risk' ? '#ca8a04' : '#dc2626'
                  return (
                    <div key={kpi.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 7, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)' }}>
                      <span className="ah-badge" style={{ background: `${col}15`, color: col, fontSize: 10, flexShrink: 0 }}>
                        {kpi.status === 'on_track' ? 'On Track' : kpi.status === 'at_risk' ? 'At Risk' : 'Off Track'}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{kpi.kpiName}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>{kpi.currentValue}{kpi.unit}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Linked Use Cases */}
          {linkedUCs.length > 0 && (
            <div>
              <SectionLabel icon="bi-layers" title={`Linked Use Cases (${linkedUCs.length})`} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {linkedUCs.map(uc => {
                  const sc = uc.status === 'live' ? '#007560' : uc.status === 'pipeline' ? '#3b82f6' : '#9ca3af'
                  return (
                    <div key={uc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 11px', borderRadius: 7, background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.08)' }}>
                      <span className="ah-badge" style={{ background: `${sc}12`, color: sc, border: `1px solid ${sc}28`, fontSize: 10, flexShrink: 0 }}>
                        {uc.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text)', flex: 1 }}>{uc.name}</span>
                      <span style={{ fontSize: 10.5, color: 'var(--text-muted)', flexShrink: 0 }}>{uc.domain}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Incidents */}
          <div>
            <SectionLabel icon="bi-exclamation-triangle" title={`Reported Incidents (${incidents.length})`} />
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
          </div>

        </div>
      </aside>
    </>
  )
}
