import DataSourceBadge from '../components/DataSourceBadge'
import LeadershipDashboard from './alhasbah/LeadershipDashboard'
import KPIPerformance      from './alhasbah/KPIPerformance'
import KPIRepository       from './alhasbah/KPIRepository'
import AIAgentRepository   from './alhasbah/AIAgentRepository'
import UseCaseRepository   from './alhasbah/UseCaseRepository'
import Incidents           from './alhasbah/Incidents'
import '../al-hasbah.css'
import '../people-skills.css'

export type AlHasbahTabId =
  | 'leadership'
  | 'kpi-performance'
  | 'kpi-repository'
  | 'agent-repository'
  | 'use-case-repository'
  | 'ai-health'

interface AlHasbahProps {
  activeTab: AlHasbahTabId
  onNavigate: (tab: AlHasbahTabId) => void
}

export default function AlHasbah({ activeTab, onNavigate }: AlHasbahProps) {
  // Sub-components are typed with `onNavigate?: (tab: string) => void` — wrap to bridge the cast.
  const nav = (tab: string) => onNavigate(tab as AlHasbahTabId)

  function renderTab() {
    switch (activeTab) {
      case 'leadership':          return <LeadershipDashboard onNavigate={nav} />
      case 'kpi-performance':     return <KPIPerformance onNavigate={nav} />
      case 'kpi-repository':      return <KPIRepository onNavigate={nav} />
      case 'agent-repository':    return <AIAgentRepository onNavigate={nav} />
      case 'use-case-repository': return <UseCaseRepository onNavigate={nav} />
      case 'ai-health':           return <Incidents onNavigate={nav} />
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Al Hasbah</h1>
          <p>AI agent adoption programme — portfolio health, KPIs, use cases and incidents</p>
        </div>
        <DataSourceBadge
          type="simulated"
          title="Static seed data · backend integration pending"
          lastUpdated="25 May 2026"
        />
      </div>

      <div role="tabpanel">
        {renderTab()}
      </div>
    </div>
  )
}
