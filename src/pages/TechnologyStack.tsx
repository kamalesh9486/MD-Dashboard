import AIToolsTab from './ps/AIToolsTab'
import { ErrorBoundary } from '../components/ErrorBoundary'
import '../people-skills.css'
import DataSourceBadge from '../components/DataSourceBadge'
import LensBriefing    from '../components/LensBriefing'

export default function TechnologyStack() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>Technology Stack</h1>
          <p>AI tools deployed across divisions — usage, adoption and departmental coverage</p>
        </div>
        <DataSourceBadge type="mixed" title="Microsoft Copilot agent and Rammas: live · All other tools: simulated" lastUpdated="5 May 2026" />
      </div>
      <LensBriefing module="technology" />
      <ErrorBoundary>
        <AIToolsTab />
      </ErrorBoundary>
    </div>
  )
}
