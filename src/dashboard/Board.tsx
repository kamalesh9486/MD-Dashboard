/* MD Dashboard shell — header banner + tab bar, routing to the Executive
   Overview and People views (recreated from the Claude Design handoff and wired
   to computed BoardData / PeopleData). Services & Processes are handoff
   placeholders. Exports BOARD_SECTIONS / BoardSectionId consumed by
   MdDashboard.tsx and the DesignSidebar rail. */
import { useEffect, useState } from 'react'
import type { BoardData } from './lib/boardTypes'
import type { PeopleData } from './lib/peopleAnalytics'
import { T, HEAD_FONT, BODY_FONT } from './lib/tokens'
import ExecOverview from './ExecOverview'
import PeopleView from './PeopleView'
import DesignSidebar from './DesignSidebar'
import '../styles/md-dashboard.css'

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: 'bi-speedometer2' },
  { id: 'people', label: 'People', icon: 'bi-people-fill' },
  { id: 'customer', label: 'Services', icon: 'bi-chat-dots-fill' },
  { id: 'processes', label: 'Processes', icon: 'bi-gear' },
] as const
export type BoardSectionId = typeof TABS[number]['id']
type TabId = BoardSectionId

/** Board sections shared with the app sidebar so both navigate the same set. */
export const BOARD_SECTIONS: { id: BoardSectionId; label: string; icon: string }[] =
  TABS.map(t => ({ id: t.id, label: t.label, icon: t.icon }))

function Placeholder({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 40px' }}>
      <div style={{ textAlign: 'center', maxWidth: 380 }}>
        <div style={{ width: 72, height: 72, margin: '0 auto', borderRadius: 20, background: T.bgGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.green, fontSize: 32 }}>
          <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><rect x="7" y="12" width="3" height="6" rx="1" /><rect x="12.5" y="8" width="3" height="10" rx="1" /><rect x="18" y="5" width="3" height="13" rx="1" /></svg>
        </div>
        <div style={{ font: `700 20px/1.2 ${HEAD_FONT}`, color: T.inkDeep, marginTop: 20 }}>{label} view</div>
        <div style={{ font: `500 13.5px/1.6 ${BODY_FONT}`, color: T.mut2, marginTop: 10 }}>
          Detailed {label} analytics are being wired into the command center. Switch back to{' '}
          <a href="#" onClick={e => { e.preventDefault(); onBack() }} style={{ color: T.green }}>Executive Overview</a> for the live rollup.
        </div>
      </div>
    </div>
  )
}

export function BoardViewV2({ data: d, people, active: activeProp, onActiveChange }: {
  data: BoardData; people: PeopleData; active?: BoardSectionId; onActiveChange?: (id: BoardSectionId) => void
}) {
  const [activeState, setActiveState] = useState<TabId>('overview')
  const active = activeProp ?? activeState
  const setActive = (id: TabId) => { setActiveState(id); onActiveChange?.(id) }
  // Switching tabs should always land at the top — the window is the scroller
  // (the rail is position:sticky), so reset its scroll on every section change.
  useEffect(() => { window.scrollTo({ top: 0, left: 0 }) }, [active])
  const asOf = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const otherLabel = active === 'customer' ? 'Services' : 'Processes'

  return (
    <div className="mdx-shell">
      <DesignSidebar active={active} onSelect={setActive} />
      <div className="mdx">
      {/* HEADER BANNER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ font: `800 30px/1.05 ${HEAD_FONT}`, letterSpacing: '-.02em', color: T.inkDeep, margin: 0 }}>Agentic AI Transformation</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
            <span style={{ font: `600 11px/1 ${BODY_FONT}`, letterSpacing: '.14em', textTransform: 'uppercase', color: T.mut2 }}>AI Transformation Mandate</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, background: `linear-gradient(135deg, ${T.green}, ${T.greenBright})`, color: '#fff', font: `800 12px/1 ${HEAD_FONT}`, letterSpacing: '.01em', boxShadow: '0 6px 16px -8px rgba(11,122,70,.8)' }}>
              <span style={{ font: `800 15px/1 ${HEAD_FONT}` }}>50%</span> Target
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ font: `600 13px/1.4 ${BODY_FONT}`, color: T.inkDeep }}>As of {asOf}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, marginTop: 8, padding: '6px 12px', borderRadius: 999, background: T.bgAmber, border: `1px solid ${T.border}` }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.amber }} />
            <span style={{ font: `600 12px/1 ${BODY_FONT}`, color: T.amberInk }}>Target April 2028</span>
          </div>
        </div>
      </header>

      {/* TAB BAR */}
      <div className="mdx-tabs" style={{ display: 'flex', gap: 4, marginTop: 22, marginBottom: 26, borderBottom: `1px solid ${T.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '11px 18px 14px', font: `600 14px/1 ${BODY_FONT}`, color: active === t.id ? T.green : T.mut2, borderBottom: `2.5px solid ${active === t.id ? T.green : 'transparent'}`, marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {active === 'overview' && <ExecOverview d={d} />}
      {active === 'people' && <PeopleView d={d} people={people} />}
      {(active === 'customer' || active === 'processes') && <Placeholder label={otherLabel} onBack={() => setActive('overview')} />}
      </div>
    </div>
  )
}
