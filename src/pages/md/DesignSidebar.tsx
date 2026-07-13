/* Icon rail (from the Claude Design handoff) that expands on hover to reveal
   labels. Nav mirrors the four board tabs — Overview / People / Services /
   Processes — and drives the same active tab. */
import { useCurrentUser } from '../../hooks/useCurrentUser'
import Icon from '../../components/Icon'
import type { BoardSectionId } from './Board'
import coeLogo from '../../assets/coe-logo.webp'

const NAV: { id: BoardSectionId; icon: string; label: string }[] = [
  { id: 'overview', icon: 'bi-speedometer2', label: 'Overview' },
  { id: 'people', icon: 'bi-people-fill', label: 'People' },
  { id: 'customer', icon: 'bi-chat-dots-fill', label: 'Services' },
  { id: 'processes', icon: 'bi-gear', label: 'Processes' },
]

export default function DesignSidebar({ active, onSelect }: { active: BoardSectionId; onSelect: (id: BoardSectionId) => void }) {
  const user = useCurrentUser()
  const initials = (user.name || 'User')
    .trim().split(/\s+/).map(w => w[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || 'U'

  return (
    <aside className="mdx-rail">
      <div className="mdx-rail-inner">
        <div className="mdx-rail-brand">
          <span className="mdx-rail-slot"><img className="mdx-rail-logo" src={coeLogo} alt="COE" /></span>
          <span className="mdx-rail-brandtext"><b>Agentic AI</b><small>MD Dashboard</small></span>
        </div>

        <nav className="mdx-rail-nav">
          {NAV.map(n => (
            <button key={n.id} className={`mdx-rail-btn${active === n.id ? ' on' : ''}`} title={n.label} onClick={() => onSelect(n.id)}>
              <span className="mdx-rail-slot"><Icon name={n.icon} size={21} /></span>
              <span className="mdx-rail-label">{n.label}</span>
            </button>
          ))}
        </nav>

        <div className="mdx-rail-user">
          <span className="mdx-rail-slot"><span className="mdx-rail-avatar">{initials}</span></span>
          <span className="mdx-rail-userinfo">
            <b>{user.loading ? 'Loading…' : user.name}</b>
            <small>{user.role || 'Member'}</small>
          </span>
        </div>
      </div>
    </aside>
  )
}
