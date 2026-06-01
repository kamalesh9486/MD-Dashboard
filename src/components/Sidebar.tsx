import { useState, useEffect, type ReactNode } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import Icon from './Icon'

export type TabId =
  | 'executive-summary' | 'people-skills' | 'programs' | 'events'
  | 'discovery-catalog' | 'division-analytics' | 'technology-stack'
  | 'ai-incident' | 'finance' | 'strategic-roadmap' | 'ai-command-center'
  | 'al-hasbah'
  | 'ah-leadership' | 'ah-kpi-performance' | 'ah-kpi-repository'
  | 'ah-agent-repository' | 'ah-use-case-repository' | 'ah-health'

interface NavChild {
  id: TabId
  label: string
  icon: string
}

interface NavItem {
  id: TabId
  label: string
  icon?: string
  svgIcon?: ReactNode
  children?: NavChild[]
  /** Tab to navigate to when the parent is clicked (defaults to its own id). */
  landingTab?: TabId
}

interface SidebarProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  collapsed: boolean
  mobileOpen?: boolean
  onLogout: () => void
}

const NAV_ITEMS: NavItem[] = [
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
  {
    id: 'al-hasbah' as TabId,
    label: 'Al Hasbah',
    icon: 'bi-robot',
    landingTab: 'ah-leadership' as TabId,
    children: [
      { id: 'ah-leadership' as TabId,        label: 'Leadership Dashboard',  icon: 'bi-speedometer2'       },
      { id: 'ah-kpi-performance' as TabId,   label: 'KPI Performance',       icon: 'bi-graph-up-arrow'     },
      { id: 'ah-kpi-repository' as TabId,    label: 'KPI Repository',        icon: 'bi-table'              },
      { id: 'ah-agent-repository' as TabId,  label: 'AI Agent Repository',   icon: 'bi-robot'              },
      { id: 'ah-use-case-repository' as TabId, label: 'Use Case Repository', icon: 'bi-collection-fill'    },
      { id: 'ah-health' as TabId,            label: 'AI Health & Incidents', icon: 'bi-shield-exclamation' },
    ],
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
  'al-hasbah':          'Al Hasbah',
  'ah-leadership':          'Al Hasbah — Leadership Dashboard',
  'ah-kpi-performance':     'Al Hasbah — KPI Performance',
  'ah-kpi-repository':      'Al Hasbah — KPI Repository',
  'ah-agent-repository':    'Al Hasbah — AI Agent Repository',
  'ah-use-case-repository': 'Al Hasbah — Use Case Repository',
  'ah-health':              'Al Hasbah — AI Health & Incidents',
}

export { PAGE_TITLES }

export default function Sidebar({ activeTab, onTabChange, collapsed, mobileOpen, onLogout }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => ({
    programs:    activeTab === 'programs' || activeTab === 'events',
    'al-hasbah': activeTab === 'al-hasbah' || activeTab.startsWith('ah-'),
  }))

  // Accordion: auto-expand the menu owning the active tab and collapse the rest,
  // so the nav stays compact (and in-page drill buttons keep the right menu open).
  useEffect(() => {
    if (activeTab === 'programs' || activeTab === 'events') {
      setOpenMenus({ programs: true })
    } else if (activeTab === 'al-hasbah' || activeTab.startsWith('ah-')) {
      setOpenMenus({ 'al-hasbah': true })
    }
  }, [activeTab])

  const isActive = (id: TabId) => activeTab === id
  const childIds = (item: NavItem) => item.children?.map((c) => c.id) ?? []
  const isParentActive = (item: NavItem) => isActive(item.id) || childIds(item).includes(activeTab)

  function handleNavClick(item: NavItem) {
    if (item.children) {
      // Accordion toggle: open this one (closing others), or collapse if already open.
      setOpenMenus((prev) => (prev[item.id] ? {} : { [item.id]: true }))
      onTabChange(item.landingTab ?? item.id)
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
          const active = item.children ? isParentActive(item) : isActive(item.id)
          const isExpanded = item.children ? !!openMenus[item.id] : false

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
