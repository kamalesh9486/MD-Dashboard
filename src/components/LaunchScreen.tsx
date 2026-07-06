import { useState, useEffect, useRef } from 'react'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { Ai_coe_applogsService } from '../generated/services/Ai_coe_applogsService'
import type { Ai_coe_applogsBase } from '../generated/models/Ai_coe_applogsModel'
import dewaLogo from '../assets/dewa-logo.svg'
import '../launch-screen.css'



interface Props { onLaunch: () => void }

// ── DEWA COE animated platform preview ───────────────────────
const PROGRESS_ITEMS = [
  { label: 'Load AI adoption data',  tip: 'Fetching from Dataverse' },
  { label: 'Sync division metrics',  tip: 'Cross-referencing 8 divisions' },
  { label: 'Fetch discoveries',      tip: 'Loading discovery catalog' },
  { label: 'Build dashboards',       tip: 'Compiling chart data' },
  { label: 'Compile insights',       tip: 'Running AI analysis' },
  { label: 'Export report',          tip: 'Preparing summary data' },
]

const CTX_ITEMS = [
  { label: 'Programs Data',     icon: 'doc',    accent: '#007560', tip: '12 active programs' },
  { label: 'Discovery Catalog', icon: 'search', accent: '#0891b2', tip: '47 discoveries tracked' },
  { label: 'People Skills',     icon: 'people', accent: '#8b5cf6', tip: 'AI readiness scores' },
  { label: 'AI Incidents',      icon: 'warn',   accent: '#ef4444', tip: 'Risk monitoring active' },
  { label: 'Events Calendar',   icon: 'cal',    accent: '#f59e0b', tip: 'Upcoming COE events' },
]

const FOLDER_ITEMS = [
  { label: 'AI Analytics',     tip: 'Tool usage & adoption trends' },
  { label: 'Division Reports', tip: 'KPI breakdown by division' },
  { label: 'Program Data',     tip: 'Active COE program details' },
  { label: 'KPI Metrics',      tip: 'Real-time performance indicators' },
]

const KPIS = [
  { label: 'Programs',    value: 12, color: '#007560' },
  { label: 'Discoveries', value: 47, color: '#0891b2' },
  { label: 'AI Tools',    value: 8,  color: '#8b5cf6' },
  { label: 'Events',      value: 23, color: '#f59e0b' },
]

const MODULES = [
  { name: 'Executive Summary',  pct: 100, color: '#007560' },
  { name: 'People & Skills',    pct: 84,  color: '#0891b2' },
  { name: 'Programs',           pct: 76,  color: '#8b5cf6' },
  { name: 'Discovery Catalog',  pct: 68,  color: '#f59e0b' },
  { name: 'AI Command Center',  pct: 72,  color: '#ef4444' },
  { name: 'Finance',            pct: 60,  color: '#16a34a' },
]

function CtxIcon({ type, accent }: { type: string; accent: string }) {
  if (type === 'doc') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="12" height="14" rx="2" stroke={accent} strokeWidth="1.2"/>
      <path d="M5 5h6M5 8h6M5 11h4" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'search') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="6.5" cy="6.5" r="4.5" stroke={accent} strokeWidth="1.2"/>
      <path d="M10 10l3.5 3.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'people') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="5" r="2.5" stroke={accent} strokeWidth="1.2"/>
      <path d="M1 14c0-3 2-4 5-4s5 1 5 4" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="2" stroke={accent} strokeWidth="1" opacity="0.5"/>
    </svg>
  )
  if (type === 'warn') return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L14.5 13.5H1.5L8 2z" stroke={accent} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M8 7v3M8 11.5v.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="11" rx="1.5" stroke={accent} strokeWidth="1.2"/>
      <path d="M4 3V2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1" stroke={accent} strokeWidth="1.2"/>
      <path d="M8 8v3M6.5 9.5H9.5" stroke={accent} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function LaunchAnim() {
  const [visibleCtx,    setVisibleCtx]    = useState<number[]>([])
  const [progressState, setProgressState] = useState(0)
  const [hoveredCard,   setHoveredCard]   = useState<string | null>(null)
  const [activeTab,     setActiveTab]     = useState<'analytics' | 'platform'>('platform')
  const [analyticsIn,   setAnalyticsIn]   = useState(false)

  useEffect(() => {
    let active = true
    const timers: number[] = []
    function schedule(fn: () => void, ms: number) {
      timers.push(window.setTimeout(() => { if (active) fn() }, ms))
    }
    CTX_ITEMS.forEach((_, i) => schedule(() => setVisibleCtx(p => [...p, i]), 500 + i * 140))
    function cycleProgress(offset: number) {
      PROGRESS_ITEMS.forEach((_, i) =>
        schedule(() => setProgressState(i + 1), offset + i * 460)
      )
      schedule(() => {
        setProgressState(0)
        schedule(() => cycleProgress(0), 600)
      }, offset + PROGRESS_ITEMS.length * 460 + 1400)
    }
    cycleProgress(900)
    return () => { active = false; timers.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    if (activeTab !== 'analytics') return
    setAnalyticsIn(false)
    const id = window.setTimeout(() => setAnalyticsIn(true), 50)
    return () => clearTimeout(id)
  }, [activeTab])

  const G = '#007560'

  function cardStyle(name: string): React.CSSProperties {
    const blurred = hoveredCard !== null && hoveredCard !== name
    const active  = hoveredCard === name
    return {
      background: '#ffffff',
      border: `1px solid ${active ? 'rgba(0,117,96,0.4)' : 'rgba(0,117,96,0.14)'}`,
      padding: 14,
      fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
      boxShadow: active
        ? '0 18px 48px rgba(0,117,96,0.2), 0 4px 12px rgba(0,0,0,0.08)'
        : '0 4px 16px rgba(0,117,96,0.08), 0 1px 4px rgba(0,0,0,0.05)',
      filter: blurred ? 'blur(2.5px) brightness(0.92)' : 'none',
      opacity: blurred ? 0.55 : 1,
      transition: 'filter 0.3s ease, opacity 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease, transform 0.3s ease',
    }
  }

  return (
    <div className="la-scene">
      <div className="la-grid-bg" />

      {/* Tab bar */}
      <div className="la-tab-bar">
        <div
          className={`la-tab${activeTab === 'analytics' ? ' la-tab--active' : ''}`}
          onClick={() => setActiveTab('analytics')}
          style={{ cursor: 'pointer' }}
        >Analytics</div>
        <div
          className={`la-tab${activeTab === 'platform' ? ' la-tab--active' : ''}`}
          onClick={() => setActiveTab('platform')}
          style={{ cursor: 'pointer' }}
        >Platform</div>
      </div>

      {activeTab === 'analytics' ? (

        /* ── Analytics overview ───────────────────────────────── */
        <div style={{ width: '100%', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', boxSizing: 'border-box' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 16, border: '1px solid rgba(0,117,96,0.14)', boxShadow: '0 4px 28px rgba(0,117,96,0.1)', padding: '18px 20px', animation: 'la-card-in-center 0.4s cubic-bezier(0.16,1,0.3,1) both' }}>

            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1c1c1e', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Platform Overview
              <span style={{ fontSize: 10, color: G, fontWeight: 600, background: 'rgba(0,117,96,0.09)', borderRadius: 5, padding: '2px 8px' }}>11 modules</span>
            </div>

            {/* KPI strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {KPIS.map(k => (
                <div key={k.label} style={{ background: `${k.color}0d`, border: `1px solid ${k.color}22`, borderRadius: 9, padding: '8px 6px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: k.color, lineHeight: 1 }}>{k.value}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 3, fontWeight: 500 }}>{k.label}</div>
                </div>
              ))}
            </div>

            {/* Module coverage bars */}
            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#374151', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Module Coverage
              <span style={{ fontSize: 9.5, color: '#9ca3af', fontWeight: 400 }}>% data connected</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {MODULES.map((m, i) => (
                <div key={m.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10.5, color: '#374151', fontWeight: 500 }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: m.color, fontWeight: 600 }}>{m.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: '#e9f5f1', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 4, background: m.color, width: analyticsIn ? `${m.pct}%` : '0%', transition: `width 0.55s ${0.06 + i * 0.07}s ease` }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      ) : (

        /* ── Platform cards ───────────────────────────────────── */
        <div className="la-cards-area">

          {/* LEFT — file browser */}
          <div
            className="la-card-file"
            style={cardStyle('file')}
            onMouseEnter={() => setHoveredCard('file')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#f3faf7', border: '1px solid rgba(0,117,96,0.13)', borderRadius: 7, padding: '5px 9px', marginBottom: 11 }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke={G} strokeWidth="1.5"/>
                <path d="M10 10l3.5 3.5" stroke={G} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span style={{ fontSize: 10.5, color: '#9ca3af' }}>Search…</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 11 }}>
              {FOLDER_ITEMS.map(f => (
                <div key={f.label} className="la-tip-wrap" data-tip={f.tip} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'default' }}>
                  <svg width="34" height="27" viewBox="0 0 44 36" fill="none">
                    <path d="M2 8C2 5.8 3.8 4 6 4h10l4 4h18c2.2 0 4 1.8 4 4v16c0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4V8z" fill="#c7ede4"/>
                    <path d="M2 12C2 9.8 3.8 8 6 8h32c2.2 0 4 1.8 4 4v14c0 2.2-1.8 4-4 4H6c-2.2 0-4-1.8-4-4V12z" fill="#00b896"/>
                  </svg>
                  <span style={{ fontSize: 8.5, color: '#5a6672', textAlign: 'center', lineHeight: 1.3, fontWeight: 500 }}>{f.label}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button style={{ padding: '3px 9px', borderRadius: 6, border: '1px solid rgba(0,117,96,0.18)', background: 'transparent', color: '#5a6672', fontSize: 10, cursor: 'pointer' }}>Cancel</button>
              <button style={{ padding: '3px 11px', borderRadius: 6, border: 'none', background: G, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>Open</button>
            </div>
          </div>

          {/* CENTER — progress */}
          <div
            className="la-card-progress"
            style={cardStyle('progress')}
            onMouseEnter={() => setHoveredCard('progress')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1c1c1e' }}>Platform Sync</span>
              <span style={{ fontSize: 9.5, color: progressState >= PROGRESS_ITEMS.length ? G : '#9ca3af', fontWeight: 600, background: progressState >= PROGRESS_ITEMS.length ? 'rgba(0,117,96,0.1)' : '#f3f4f6', borderRadius: 5, padding: '2px 7px' }}>
                {progressState}/{PROGRESS_ITEMS.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PROGRESS_ITEMS.map(({ label, tip }, i) => {
                const isDone   = i < progressState
                const isActive = i === progressState
                return (
                  <div key={i} className="la-tip-wrap" data-tip={tip} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'default' }}>
                    <div style={{ width: 17, height: 17, borderRadius: '50%', flexShrink: 0, background: isDone ? G : 'transparent', border: isDone ? 'none' : `2px solid ${isActive ? G : '#d1d5db'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s ease, border-color 0.3s ease' }}>
                      {isDone ? (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : isActive ? <div className="la-active-dot" /> : null}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10.5, fontWeight: isDone || isActive ? 600 : 400, color: isDone ? G : isActive ? '#1c1c1e' : '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2, transition: 'color 0.3s ease' }}>{label}</div>
                      <div style={{ height: 3, background: '#e9f5f1', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 3, background: isDone ? G : isActive ? G : 'transparent', width: isDone ? '100%' : isActive ? '55%' : '0%', transition: isDone ? 'width 0.45s ease' : 'none', animation: isActive ? 'la-bar-shimmer 1.4s ease-in-out infinite' : 'none', opacity: isActive ? 0.55 : 1 }}/>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT — context sources */}
          <div
            className="la-card-context"
            style={cardStyle('context')}
            onMouseEnter={() => setHoveredCard('context')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1c1c1e' }}>Sources</span>
              <span style={{ fontSize: 9, color: G, fontWeight: 700, background: 'rgba(0,117,96,0.09)', borderRadius: 5, padding: '2px 6px' }}>{CTX_ITEMS.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {CTX_ITEMS.map(({ label, icon, accent, tip }, i) => {
                const visible = visibleCtx.includes(i)
                return (
                  <div key={i} className="la-tip-wrap" data-tip={tip} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 4px', borderRadius: 7, background: visible ? `${accent}0d` : 'transparent', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(10px)', transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.3s ease', cursor: 'default' }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${accent}14`, border: `1px solid ${accent}2e`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CtxIcon type={icon} accent={accent} />
                    </div>
                    <span style={{ fontSize: 10.5, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}

      <div className="la-status">
        <span className="la-status-dot" />
        COE Intelligence Platform · Dev
      </div>
    </div>
  )
}

// ── Main LaunchScreen ─────────────────────────────────────────
export default function LaunchScreen({ onLaunch }: Props) {
  const user = useCurrentUser()
  const [launching, setLaunching]   = useState(false)
  const launchTimer = useRef(0)
  const [typedName, setTypedName]   = useState('')
  const [cursorOn, setCursorOn]     = useState(true)

  useEffect(() => {
    if (user.loading || !user.name) return
    const name = user.name
    let i = 0
    const t = setInterval(() => {
      i++
      setTypedName(name.slice(0, i))
      if (i >= name.length) clearInterval(t)
    }, 52)
    return () => clearInterval(t)
  }, [user.name, user.loading])

  useEffect(() => {
    const t = setInterval(() => setCursorOn(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  useEffect(() => () => clearTimeout(launchTimer.current), [])

  function handleLaunch() {
    if (launching) return
    setLaunching(true)
    // Fire-and-forget — log failure must never block the user
    Ai_coe_applogsService.create({
      ai_coe_name:      `Platform Login — ${user.name || user.email}`,
      ai_coe_username:  user.name,
      ai_coe_useremail: user.email,
      ai_coe_userrole:  user.role,
      ai_coe_logintime: new Date().toISOString(),
      statecode:        0 as Ai_coe_applogsBase['statecode'],
    } as Parameters<typeof Ai_coe_applogsService.create>[0]).catch(() => {})
    launchTimer.current = window.setTimeout(onLaunch, 700)
  }

  return (
    <div className={`ls-root${launching ? ' ls-launching' : ''}`}>

      {/* Floating lines — full-screen background layer */}

      {/* Ambient blobs */}
      <div className="ls-blob ls-blob--tl" />
      <div className="ls-blob ls-blob--br" />

      {/* Two-column body */}
      <div className="ls-body">

        {/* LEFT — editorial hero + launch */}
        <div className="ls-left">
          <div className="ls-brand-logo-wrap">
            <img src={dewaLogo} alt="DEWA" className="ls-brand-logo" />
          </div>

         

          <h1 className="ls-hero-title">
            <span className="ls-ht-center">CENTER</span>
            <span className="ls-ht-of">OF</span>
            <span className="ls-ht-excellence">EXCELLENCE</span>
          </h1>

          <p className="ls-sub">
            <strong>AI Intelligence Platform</strong> — the single source of truth
            for DEWA's AI adoption, programmes, workforce readiness, and risk governance.
          </p>

          <div className="ls-ai-pills">
            <span className="ls-pill ls-pill--ai"><span className="ls-pill-dot" /> AI-Powered</span>
            <span className="ls-pill ls-pill--coe"><span className="ls-pill-dot" /> Center of Excellence</span>
            <span className="ls-pill ls-pill--dewa"><span className="ls-pill-dot" /> DEWA COE</span>
            <span className="ls-pill ls-pill--innov"><span className="ls-pill-dot" /> Innovation Hub</span>
          </div>

          <button
            className={`ls-launch-btn${launching ? ' ls-launch-btn--go' : ''}`}
            onClick={handleLaunch}
            disabled={launching}
            aria-label="Get Started with DEWA AI Intelligence Platform"
          >
            <span className="ls-launch-text">
              {launching ? 'Initialising…' : 'Get Started'}
            </span>
            <span className="ls-launch-icon">
              {launching ? (
                <svg className="ls-launch-spinner" viewBox="0 0 24 24" width="18" height="18" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeDasharray="40 20" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" width="18" height="18" fill="currentColor">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd"/>
                </svg>
              )}
            </span>
          </button>
        </div>

        {/* RIGHT — animated platform preview */}
        <div className="ls-right">
          <LaunchAnim />
        </div>
      </div>

      {/* Bottom — welcome bar */}
      <div className="ls-bottom">
        <div className="ls-welcome">
          <div className="ls-welcome-greet">Signed in as</div>
          <div className="ls-welcome-name">
            {user.loading
              ? <span className="ls-welcome-shimmer">Authenticating…</span>
              : <>{typedName}<span className={`ls-cursor${cursorOn ? '' : ' ls-cursor--off'}`}>|</span></>
            }
          </div>
          {!user.loading && user.role && (
            <div className="ls-welcome-role">{user.role}</div>
          )}
        </div>
        <div className="ls-bottom-meta">
          <span className="ls-bm-tag">Microsoft Power Platform</span>
          <span className="ls-bm-sep">·</span>
          <span className="ls-bm-tag">AI COE v2.0</span>
          <span className="ls-bm-sep">·</span>
          <span className="ls-bm-tag">Q1 2026</span>
        </div>
      </div>

    </div>
  )
}
