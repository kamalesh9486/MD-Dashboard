import { useState } from 'react'
import PeopleAdoptionTab from './ps/PeopleAdoptionTab'
import CertificationsTab from './ps/CertificationsTab'
import SkillsTab         from './ps/SkillsTab'
import PerformanceTab    from './ps/PerformanceTab'
import '../people-skills.css'
import Icon from '../components/Icon'
import DataSourceBadge, { type DataSourceType } from '../components/DataSourceBadge'

type TabId = 'people-adoption' | 'certifications' | 'skills' | 'performance'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'people-adoption', label: 'People Adoption',   icon: 'bi-people-fill'      },
  { id: 'certifications',  label: 'Certifications',    icon: 'bi-patch-check-fill' },
  { id: 'skills',          label: 'Skills',            icon: 'bi-tags-fill'        },
  { id: 'performance',     label: 'Performance Rating',icon: 'bi-star-fill'        },
]

const TAB_SOURCE: Record<TabId, { type: DataSourceType; title: string }> = {
  'people-adoption': { type: 'internal',  title: 'Live internal datasource' },
  'certifications':  { type: 'simulated', title: 'Dummy data from backend'  },
  'skills':          { type: 'simulated', title: 'Dummy data from backend'  },
  'performance':     { type: 'simulated', title: 'Dummy data from backend'  },
}

export default function PeopleSkills() {
  const [activeTab, setActiveTab] = useState<TabId>('people-adoption')

  function renderTab() {
    switch (activeTab) {
      case 'people-adoption': return <PeopleAdoptionTab />
      case 'certifications':  return <CertificationsTab />
      case 'skills':          return <SkillsTab />
      case 'performance':     return <PerformanceTab />
    }
  }

  const src = TAB_SOURCE[activeTab]

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>People &amp; Skills</h1>
          <p>AI workforce capability — adoption, development, certifications and performance</p>
        </div>
        <DataSourceBadge type={src.type} title={src.title} lastUpdated="12 May 2026" />
      </div>

      {/* Inner tab navigation */}
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

      {/* Active tab content */}
      <div role="tabpanel">
        {renderTab()}
      </div>
    </div>
  )
}
