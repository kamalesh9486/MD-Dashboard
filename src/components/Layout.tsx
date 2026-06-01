import { useState, useEffect } from 'react'
import Sidebar, { type TabId } from './Sidebar'
import ExecutiveSummary from '../pages/ExecutiveSummary'
import PeopleSkills from '../pages/PeopleSkills'
import Programs from '../pages/Programs'
import Events from '../pages/Events'
import type { Program } from '../pages/prog/data'
import DiscoveryCatalog   from '../pages/DiscoveryCatalog'
import DivisionAnalytics  from '../pages/DivisionAnalytics'
import TechnologyStack    from '../pages/TechnologyStack'
import AIIncident        from '../pages/AIIncident'
import Finance           from '../pages/Finance'
import StrategicRoadmap  from '../pages/StrategicRoadmap'
import AICommandCenter   from '../pages/AICommandCenter'
import AlHasbah, { type AlHasbahTabId } from '../pages/AlHasbah'
import Icon              from './Icon'
import { ErrorBoundary } from './ErrorBoundary'
import dewaLogo          from '../assets/dewa-logo.svg'
import '../layout.css'

interface LayoutProps { onLogout: () => void }

// Map global sidebar tab IDs ↔ Al Hasbah's internal sub-tab IDs
const AH_TO_SUB: Partial<Record<TabId, AlHasbahTabId>> = {
  'al-hasbah':              'leadership',
  'ah-leadership':          'leadership',
  'ah-kpi-performance':     'kpi-performance',
  'ah-kpi-repository':      'kpi-repository',
  'ah-agent-repository':    'agent-repository',
  'ah-use-case-repository': 'use-case-repository',
  'ah-health':              'ai-health',
}
const SUB_TO_AH: Record<AlHasbahTabId, TabId> = {
  'leadership':          'ah-leadership',
  'kpi-performance':     'ah-kpi-performance',
  'kpi-repository':      'ah-kpi-repository',
  'agent-repository':    'ah-agent-repository',
  'use-case-repository': 'ah-use-case-repository',
  'ai-health':           'ah-health',
}

export default function Layout({ onLogout }: LayoutProps) {
  const [activeTab,        setActiveTab]        = useState<TabId>('executive-summary')
  const [collapsed,        setCollapsed]        = useState(false)
  const [mobileOpen,       setMobileOpen]       = useState(false)
  const [isMobile,         setIsMobile]         = useState(window.innerWidth <= 768)
  const [contextProgram,   setContextProgram]   = useState<Program | null>(null)

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleTabChange(tab: TabId) {
    if (tab !== 'events') setContextProgram(null)
    setActiveTab(tab)
    if (isMobile) setMobileOpen(false)
  }

  function toggleSidebar() {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }

  function renderPage() {
    switch (activeTab) {
      case 'executive-summary':
        return <ExecutiveSummary />
      case 'people-skills':
        return <PeopleSkills />
      case 'programs':
        return (
          <Programs
            onNavigateToEvents={(program?) => {
              setContextProgram(program ?? null)
              setActiveTab('events')
            }}
          />
        )
      case 'events':
        return (
          <Events
            fromProgram={contextProgram}
            onBackToPrograms={() => {
              setContextProgram(null)
              setActiveTab('programs')
            }}
          />
        )
      case 'division-analytics':
        return <DivisionAnalytics />
      case 'technology-stack':
        return <TechnologyStack />
      case 'discovery-catalog':
        return <DiscoveryCatalog />
      case 'ai-incident':
        return <AIIncident />
      case 'finance':
        return <Finance />
      case 'strategic-roadmap':
        return <StrategicRoadmap />
      case 'ai-command-center':
        return <AICommandCenter />
      case 'al-hasbah':
      case 'ah-leadership':
      case 'ah-kpi-performance':
      case 'ah-kpi-repository':
      case 'ah-agent-repository':
      case 'ah-use-case-repository':
      case 'ah-health':
        return (
          <AlHasbah
            activeTab={AH_TO_SUB[activeTab] ?? 'leadership'}
            onNavigate={(sub) => setActiveTab(SUB_TO_AH[sub])}
          />
        )
    }
  }

  const mainClass = [
    'main-wrapper',
    !isMobile && collapsed ? 'collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="dewa-app">
      {/* Mobile overlay */}
      {isMobile && (
        <div
          className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={!isMobile && collapsed}
        mobileOpen={isMobile && mobileOpen}
        onLogout={onLogout}
      />

      {/* Main */}
      <div className={mainClass}>
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="topbar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <Icon name={mobileOpen ? 'bi-x-lg' : 'bi-list'} aria-hidden="true" />
            </button>
            <span className="topbar-page-title">Center of Excellence</span>
          </div>
          <div className="topbar-right">
            <img src={dewaLogo} alt="DEWA" className="topbar-logo" />
          </div>
        </header>

        {/* Page content — wrapped in ErrorBoundary so a broken page never blanks the whole app */}
        <main className="page-content">
          <ErrorBoundary key={activeTab}>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}