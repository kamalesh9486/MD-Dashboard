import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import { CopilotAdoptionService, type CopilotAdoptionData } from '../../services/CopilotAdoptionService'
import CopilotAdoptionKpiSection from './CopilotAdoptionKpiSection'
import CopilotAdoptionChartsSection from './CopilotAdoptionChartsSection'

const B = '#0078d4'

export default function CopilotAdoptionPanel({ onBack }: { onBack: () => void }) {
  const [data,    setData]    = useState<CopilotAdoptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    let active = true
    CopilotAdoptionService.fetch().then(r => {
      if (!active) return
      if (r.error) setError(r.error)
      else setData(r.data)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  const adoptionPct  = data ? Math.round(data.kpi.adoptionPct * 1000) / 10 : null
  const totalActions = data ? data.kpi.totalActions : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'var(--surface)', border: '1.5px solid var(--border-card)',
          borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600,
          color: 'var(--text-muted)', cursor: 'pointer', width: 'fit-content',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = B
          e.currentTarget.style.borderColor = `${B}50`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-muted)'
          e.currentTarget.style.borderColor = 'var(--border-card)'
        }}
      >
        <Icon name="bi-chevron-left" />
        Back to all Technology
      </button>

      {/* Header banner */}
      <div style={{
        background: `linear-gradient(135deg, ${B} 0%, #005fa3 100%)`,
        borderRadius: 16, padding: '20px 28px',
        display: 'flex', alignItems: 'center', gap: 16,
        boxShadow: `0 4px 20px ${B}40`,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0, color: '#fff',
        }}>
          <Icon name="bi-microsoft" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>M365 Copilot Adoption Dashboard</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>
            Live M365 Copilot adoption metrics — usage, savings, and division coverage
          </div>
        </div>
        {data && (
          <div style={{ display: 'flex', gap: 32, textAlign: 'center' }}>
            {[
              { label: 'Active Users',   value: data.kpi.activeUsers.toLocaleString() },
              { label: 'Adoption Rate',  value: `${adoptionPct}%` },
              { label: 'Total Actions',  value: `${((totalActions ?? 0) / 1e6).toFixed(2)}M` },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ padding: '48px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          <Icon name="bi-arrow-repeat" style={{ marginRight: 8 }} />
          Loading Copilot adoption data…
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{ padding: '12px 16px', borderRadius: 8, background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', fontSize: 13 }}>
          <Icon name="bi-exclamation-triangle-fill" style={{ marginRight: 8 }} />
          {error}
        </div>
      )}

      {/* Dashboard sections */}
      {!loading && !error && data && (
        <>
          <CopilotAdoptionKpiSection   data={data} />
          <CopilotAdoptionChartsSection data={data} />
        </>
      )}
    </div>
  )
}
