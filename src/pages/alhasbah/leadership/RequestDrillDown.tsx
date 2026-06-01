import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { AH_AGENTS, AH_MONTHLY_FLOW, AH_USE_CASES } from '../data'

interface Props { onClose: () => void }

const DIV_COLORS: Record<string, string> = { HR: '#7c3aed', Finance: '#0ea5e9', Billing: '#007560' }

export default function RequestDrillDown({ onClose }: Props) {
  useScrollLock()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const totalAI     = AH_MONTHLY_FLOW.reduce((s, m) => s + m.aiFlows, 0)
  const totalManual = AH_MONTHLY_FLOW.reduce((s, m) => s + m.manualFlows, 0)
  const grandTotal  = totalAI + totalManual

  // Build per-agent row data (distribute flows proportionally by liveUseCases)
  const totalLiveUCs = AH_AGENTS.filter(a => a.status === 'live').reduce((s, a) => s + a.liveUseCases, 0)
  const agentRows = AH_AGENTS
    .filter(a => a.liveUseCases > 0 || a.status !== 'planned')
    .map(agent => {
      const weight   = totalLiveUCs > 0 ? (agent.liveUseCases / totalLiveUCs) : (1 / AH_AGENTS.length)
      const ai       = Math.round(totalAI * weight)
      const manual   = Math.round(totalManual * weight)
      const total    = ai + manual
      const adoption = total > 0 ? Math.round((ai / total) * 100) : 0
      const uc       = AH_USE_CASES.filter(u => u.agentId === agent.id)
      return { agent, ai, manual, total, adoption, uc }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ah-panel ah-drill-panel-620" role="dialog" aria-label="Request Volume Drill-Down">
        <div className="ah-panel-head" style={{ background: 'linear-gradient(135deg, #001f18, #003828)' }}>
          <button className="ah-panel-close" onClick={onClose} aria-label="Close">
            <Icon name="bi-x-lg" />
          </button>
          <div className="ah-panel-name">Request Volume — Agent Drill-Down</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            Grand Total: {grandTotal.toLocaleString()} requests across {AH_AGENTS.length} agents
          </div>
        </div>

        <div className="ah-panel-body" style={{ padding: 0 }}>
          {agentRows.map(row => {
            const isOpen = expanded.has(row.agent.id)
            const adoptColor = row.adoption >= 80 ? '#007560' : row.adoption >= 50 ? '#ca8a04' : '#dc2626'
            return (
              <div key={row.agent.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggle(row.agent.id)}
                  style={{ width: '100%', background: 'none', border: 'none', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'left' }}
                >
                  <Icon name={isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: DIV_COLORS[row.agent.division] ?? '#9ca3af', flexShrink: 0, display: 'inline-block' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{row.agent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.agent.division}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{row.total.toLocaleString()}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round((row.total / grandTotal) * 100)}% of total</div>
                  </div>
                </button>

                {isOpen && (
                  <div className="ah-agent-row-expand">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <span className="ah-badge ah-status-live">AI: {row.ai.toLocaleString()}</span>
                      <span className="ah-badge ah-status-pipeline">Manual: {row.manual.toLocaleString()}</span>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Adoption</span>
                        <span style={{ color: adoptColor, fontWeight: 700 }}>{row.adoption}%</span>
                      </div>
                      <div style={{ background: 'rgba(0,117,96,0.1)', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${row.adoption}%`, background: adoptColor, borderRadius: 4 }} />
                      </div>
                    </div>
                    {row.uc.length > 0 && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 8 }}>Use Cases</div>
                        {row.uc.map(uc => {
                          const ucAI     = Math.round(row.ai / Math.max(row.uc.length, 1))
                          const ucManual = Math.round(row.manual / Math.max(row.uc.length, 1))
                          const ucTotal  = ucAI + ucManual
                          const ucAdopt  = ucTotal > 0 ? Math.round((ucAI / ucTotal) * 100) : 0
                          return (
                            <div key={uc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(0,117,96,0.06)', fontSize: 12 }}>
                              <span style={{ color: 'var(--text)', fontWeight: 500 }}>{uc.name}</span>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--text)', fontWeight: 600 }}>{ucTotal.toLocaleString()}</div>
                                <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{ucAdopt}% AI</div>
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </>
  )
}
