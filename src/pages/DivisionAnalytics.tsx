import { useState } from 'react'
import AdoptionTab from './ps/AdoptionTab'
import AdkarTab    from './ps/AdkarTab'
import '../people-skills.css'
import Icon from '../components/Icon'
import DataSourceBadge from '../components/DataSourceBadge'
import LensBriefing    from '../components/LensBriefing'

type TabId = 'adoption' | 'adkar'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'adoption', label: 'AI Adoption by Division', icon: 'bi-bar-chart-line-fill' },
  { id: 'adkar',    label: 'ADKAR Model',              icon: 'bi-hexagon-fill'        },
]

export default function DivisionAnalytics() {
  const [activeTab, setActiveTab] = useState<TabId>('adoption')

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>Division Analytics</h1>
          <p>AI adoption rates and ADKAR change-readiness scores across all DEWA divisions</p>
        </div>
        <DataSourceBadge type="live" title="M365 Copilot Adoption · live via Power Automate flow" lastUpdated="24 Jun 2026" />
      </div>

      <LensBriefing module="division" />

      <div className="ps-tab-nav" role="tablist">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`ps-tab-btn${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {activeTab === 'adoption' ? <AdoptionTab /> : <AdkarTab />}
      </div>
    </div>
  )
}
