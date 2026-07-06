import { useState, useEffect } from 'react'
import Icon from '../../components/Icon'
import LensBriefing from '../../components/LensBriefing'
import AgentPortfolioWidget from './leadership/AgentPortfolioWidget'
import UseCasesCard         from './leadership/UseCasesCard'
import KPIMonitoringCard    from './leadership/KPIMonitoringCard'
import IncidentsSection     from './leadership/IncidentsSection'
import RequestDrillDown     from './leadership/RequestDrillDown'
import FailureDrillDown     from './leadership/FailureDrillDown'
import { type AHRejectionIssueType } from './data'

interface Props { onNavigate: (tab: string) => void }

function pad(n: number) { return String(n).padStart(2, '0') }
function fmtDate(d: Date) { return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}` }

function IntroStrip({ now }: { now: Date }) {
  return (
    <div className="ah-intro-strip">
      <div>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#007560', marginBottom: 4 }}>Leadership Dashboard</div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
          4 KPI streams: AI Agents · Use Cases · KPI Monitoring · Incidents
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Animated Tech Radar */}
        <div className="ah-radar-btn" aria-hidden="true">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="20" fill="none" stroke="rgba(0,117,96,0.2)" strokeWidth="1" />
            <circle cx="22" cy="22" r="14" fill="none" stroke="rgba(0,117,96,0.15)" strokeWidth="1" />
            <circle cx="22" cy="22" r="8"  fill="none" stroke="rgba(0,117,96,0.12)" strokeWidth="1" />
            <line x1="22" y1="2"  x2="22" y2="42" stroke="rgba(0,117,96,0.1)" strokeWidth="0.8" />
            <line x1="2"  y1="22" x2="42" y2="22" stroke="rgba(0,117,96,0.1)" strokeWidth="0.8" />
            {/* Rotating sweep arm */}
            <g className="ah-radar-sweep">
              <line x1="22" y1="22" x2="22" y2="2" stroke="#007560" strokeWidth="1.5" strokeOpacity="0.7" />
            </g>
            {/* Blips */}
            <circle cx="28" cy="14" r="2.5" fill="#007560" opacity="0.85" />
            <circle cx="16" cy="30" r="2"   fill="#ca8a04" opacity="0.75" />
            <circle cx="32" cy="28" r="1.8" fill="#007560" opacity="0.65" />
            <circle cx="12" cy="16" r="1.5" fill="#007560" opacity="0.5"  />
          </svg>
        </div>
        {/* Date badge */}
        <div className="ah-date-badge">
          <Icon name="bi-calendar3" />
          <span>As of {fmtDate(now)}</span>
        </div>
      </div>
    </div>
  )
}

export default function LeadershipDashboard({ onNavigate }: Props) {
  const [showRequestDrillDown,  setShowRequestDrillDown]  = useState(false)
  const [showFailureDrillDown,  setShowFailureDrillDown]  = useState(false)
  const [failureCategory, setFailureCategory] = useState<AHRejectionIssueType | undefined>()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  function openFailureDrill(cat: AHRejectionIssueType) {
    setFailureCategory(cat)
    setShowFailureDrillDown(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 1. Intro strip */}
      <IntroStrip now={now} />

      <LensBriefing module="al-hasbah" />

      {/* 2. Agent Portfolio Widget */}
      <AgentPortfolioWidget
        onDrillRequests={() => setShowRequestDrillDown(true)}
        onDrillCategory={openFailureDrill}
      />

      {/* 3. 2-col grid */}
      <div className="ah-stream-grid">
        <UseCasesCard    onNavigate={() => onNavigate('use-case-repository')} />
        <KPIMonitoringCard onNavigate={() => onNavigate('kpi-repository')} />
      </div>

      {/* 4. Incidents */}
      <IncidentsSection onNavigate={onNavigate} />

      {/* Drill-down panels */}
      {showRequestDrillDown && <RequestDrillDown onClose={() => setShowRequestDrillDown(false)} />}
      {showFailureDrillDown && <FailureDrillDown category={failureCategory} onClose={() => { setShowFailureDrillDown(false); setFailureCategory(undefined) }} />}
    </div>
  )
}
