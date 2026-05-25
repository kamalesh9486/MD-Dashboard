import { useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import Icon from './Icon'

export type TabId = 'executive-summary' | 'people-skills' | 'programs' | 'events' | 'discovery-catalog' | 'division-analytics' | 'technology-stack' | 'ai-incident' | 'finance' | 'strategic-roadmap' | 'ai-command-center'

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  collapsed: boolean
  mobileOpen?: boolean
  onLogout: () => void
}

const NAV_ITEMS = [
  {
    id: 'executive-summary' as TabId,
    label: 'Executive Summary',
    icon: 'bi-bar-chart-line-fill',
  },
  
  {
    id: 'division-analytics' as TabId,
    label: 'Division Analytics',
    icon: 'bi-diagram-3-fill',
  },
  
  {
    id: 'programs' as TabId,
    label: 'Programs',
    icon: 'bi-folder2-open',
    children: [
      { id: 'events' as TabId, label: 'Events', icon: 'bi-calendar-event' },
    ],
  },
  {
    id: 'people-skills' as TabId,
    label: 'People & Skills',
    icon: 'bi-people-fill',
  },
  {
    id: 'technology-stack' as TabId,
    label: 'Technology Stack',
    icon: 'bi-cpu-fill',
  },
  {
    id: 'discovery-catalog' as TabId,
    label: 'Discovery Catalog',
    icon: 'bi-kanban',
  },
  {
    id: 'ai-incident' as TabId,
    label: 'AI Incidents',
    icon: 'bi-shield-exclamation',
  },
 /* {
    id: 'finance' as TabId,
    label: 'Finance',
    icon: 'bi-currency-dirham',
  },
  {
    id: 'strategic-roadmap' as TabId,
    label: 'Strategic Roadmap',
    icon: 'bi-rocket-takeoff',
  },*/
  {
    id: 'ai-command-center' as TabId,
    label: 'AI Command Center',
    icon: 'bi-columns-gap',
  },
 
]

const PAGE_TITLES: Record<TabId, string> = {
  'executive-summary': 'Executive Summary',
  'people-skills': 'People & Skills',
  programs: 'Programs',
  events: 'Events',
  'division-analytics': 'Division Analytics',
  'technology-stack':   'Technology Stack',
  'discovery-catalog':  'Discovery Catalog',
  'ai-incident':        'AI Incidents',
  'finance':            'Finance',
  'strategic-roadmap':  'Strategic Roadmap',
  'ai-command-center':  'AI Command Center',
}

export { PAGE_TITLES }

export default function Sidebar({ activeTab, onTabChange, collapsed, mobileOpen, onLogout }: SidebarProps) {
  const [programsOpen, setProgramsOpen] = useState(
    activeTab === 'programs' || activeTab === 'events'
  )

  const isActive = (id: TabId) => activeTab === id
  const isProgramsActive = activeTab === 'programs' || activeTab === 'events'

  function handleNavClick(item: (typeof NAV_ITEMS)[number]) {
    if (item.children) {
      setProgramsOpen((prev) => !prev)
      onTabChange(item.id)
    } else {
      onTabChange(item.id)
    }
  }

  const initials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const user = useCurrentUser()
  const avatarText = user.loading ? '··' : initials(user.name)

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo-mark">
          {/* AI Neural Network icon */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Center node */}
            <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
            {/* Outer nodes */}
            <circle cx="12" cy="3"  r="1.8" fill="currentColor" opacity="0.9"/>
            <circle cx="12" cy="21" r="1.8" fill="currentColor" opacity="0.9"/>
            <circle cx="3"  cy="8"  r="1.8" fill="currentColor" opacity="0.9"/>
            <circle cx="21" cy="8"  r="1.8" fill="currentColor" opacity="0.9"/>
            <circle cx="3"  cy="16" r="1.8" fill="currentColor" opacity="0.9"/>
            <circle cx="21" cy="16" r="1.8" fill="currentColor" opacity="0.9"/>
            {/* Connections */}
            <line x1="12" y1="4.8"  x2="12" y2="9.5"  stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="12" y1="14.5" x2="12" y2="19.2" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="4.5"  y1="8.8"  x2="9.7"  y2="11.2" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="14.3" y1="12.8" x2="19.5" y2="15.2" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="4.5"  y1="15.2" x2="9.7"  y2="12.8" stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="14.3" y1="11.2" x2="19.5" y2="8.8"  stroke="currentColor" strokeWidth="1.2" opacity="0.6"/>
            <line x1="4.8"  y1="8.2"  x2="10.4" y2="4.2"  stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
            <line x1="13.6" y1="4.2"  x2="19.2" y2="8.2"  stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
            <line x1="4.8"  y1="15.8" x2="10.4" y2="19.8" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
            <line x1="13.6" y1="19.8" x2="19.2" y2="15.8" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/>
          </svg>
        </div>
        {!collapsed && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">AI COE</div>
            <div className="sidebar-brand-sub">Center of Excellence</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        {!collapsed && (
          <div className="nav-section-label">Navigation</div>
        )}

        {NAV_ITEMS.map((item) => {
          const active = item.children ? isProgramsActive : isActive(item.id)
          const isExpanded = item.id === 'programs' ? programsOpen : false

          return (
            <div className="nav-item" key={item.id}>
              <button
                className={`nav-link-btn${active ? ' active' : ''}`}
                onClick={() => handleNavClick(item)}
                title={collapsed ? item.label : undefined}
                aria-expanded={item.children ? isExpanded : undefined}
              >
                {'svgIcon' in item
                  ? (item as { svgIcon: React.ReactNode }).svgIcon
                  : <Icon name={(item as { icon: string }).icon} className="nav-icon" aria-hidden="true" />
                }
                {!collapsed && (
                  <>
                    <span className="nav-label">{item.label}</span>
                    {item.children && (
                      <Icon
                        name="bi-chevron-down"
                        className={`nav-chevron${isExpanded ? ' open' : ''}`}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}
                {collapsed && <span className="nav-tooltip">{item.label}</span>}
              </button>

              {/* Submenu */}
              {item.children && !collapsed && (
                <div className={`submenu${isExpanded ? ' open' : ''}`}>
                  {item.children.map((child) => (
                    <button
                      key={child.id}
                      className={`submenu-link-btn${isActive(child.id) ? ' active' : ''}`}
                      onClick={() => onTabChange(child.id)}
                    >
                      <Icon name={child.icon} className="sub-icon" aria-hidden="true" />
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer – User Profile */}
      <div className="sidebar-footer">
        <div className="user-profile-row">
          <div className="user-avatar" title={user.name}>
            {avatarText}
          </div>
          {!collapsed && (
            <>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <button
                className="logout-btn"
                title="Logout"
                onClick={onLogout}
              >
                <Icon name="bi-box-arrow-right" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
