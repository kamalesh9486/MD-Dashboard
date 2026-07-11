import { useState } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { BoardSectionId } from '../pages/md/Board'
import Icon from './Icon'

interface SidebarProps {
  sections: readonly { id: BoardSectionId; label: string; icon: string }[]
  active: BoardSectionId
  onSelect: (id: BoardSectionId) => void
  /** Pinned-collapsed state (icon rail). The rail still expands on hover. */
  collapsed: boolean
  mobileOpen?: boolean
}

export default function Sidebar({ sections, active, onSelect, collapsed, mobileOpen }: SidebarProps) {
  // Hover expands the collapsed rail without changing the pinned state.
  const [hovered, setHovered] = useState(false)
  const showExpanded = !collapsed || hovered

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
    <aside
      className={`sidebar${!showExpanded ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
        {showExpanded && (
          <div className="sidebar-brand">
            <div className="sidebar-brand-name">AI COE</div>
            <div className="sidebar-brand-sub">MD Dashboard</div>
          </div>
        )}
      </div>

      {/* Navigation — MD Dashboard sections */}
      <nav className="sidebar-nav" aria-label="Dashboard sections">
        {showExpanded && (
          <div className="nav-section-label">Sections</div>
        )}

        {sections.map((item) => (
          <div className="nav-item" key={item.id}>
            <button
              className={`nav-link-btn${active === item.id ? ' active' : ''}`}
              onClick={() => onSelect(item.id)}
              title={!showExpanded ? item.label : undefined}
              aria-current={active === item.id ? 'page' : undefined}
            >
              <Icon name={item.icon} className="nav-icon" aria-hidden="true" />
              {showExpanded && <span className="nav-label">{item.label}</span>}
              {!showExpanded && <span className="nav-tooltip">{item.label}</span>}
            </button>
          </div>
        ))}
      </nav>

      {/* Footer – User Profile */}
      <div className="sidebar-footer">
        <div className="user-profile-row">
          <div className="user-avatar" title={user.name}>
            {avatarText}
          </div>
          {showExpanded && (
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
