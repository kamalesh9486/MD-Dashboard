import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import AumBoardV3 from '../pages/AumBoardV3'
import { BOARD_SECTIONS, type BoardSectionId } from '../pages/md/boardV2'
import Icon from './Icon'
import { ErrorBoundary } from './ErrorBoundary'
import dewaLogo from '../assets/dewa-logo.svg'
import '../layout.css'

export default function Layout() {
  const [section, setSection] = useState<BoardSectionId>('overview')
  // Sidebar starts closed (icon rail); it expands on hover — see Sidebar.
  const [collapsed, setCollapsed] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    function handleResize() {
      const mobile = window.innerWidth <= 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function handleSelect(id: BoardSectionId) {
    setSection(id)
    if (isMobile) setMobileOpen(false)
  }

  function toggleSidebar() {
    if (isMobile) {
      setMobileOpen((prev) => !prev)
    } else {
      setCollapsed((prev) => !prev)
    }
  }

  const mainClass = [
    'main-wrapper',
    !isMobile && collapsed ? 'collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const activeLabel = BOARD_SECTIONS.find((s) => s.id === section)?.label ?? ''

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
        sections={BOARD_SECTIONS}
        active={section}
        onSelect={handleSelect}
        collapsed={!isMobile && collapsed}
        mobileOpen={isMobile && mobileOpen}
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
            <span className="topbar-page-title">Agentic AI-MD Dashboard{activeLabel ? ` · ${activeLabel}` : ''}</span>
          </div>
          <div className="topbar-right">
            <img src={dewaLogo} alt="DEWA" className="topbar-logo" />
          </div>
        </header>

        {/* Page content — wrapped in ErrorBoundary so a render error never blanks the whole app */}
        <main className="page-content">
          <ErrorBoundary>
            <AumBoardV3 section={section} onSectionChange={setSection} />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
