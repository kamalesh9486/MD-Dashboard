import { useState } from 'react'
import Icon from './Icon'
import type { InsightModule } from '../pages/coe-lens/insights'
import { getBriefingForModule } from '../pages/coe-lens/insights'
import { useCoELens } from '../context/CoELensContext'
import '../lens-components.css'

const COLLAPSE_KEY = 'coe_lens_briefing_v1'

interface Props { module: InsightModule }

export default function LensBriefing({ module }: Props) {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true' } catch { return false }
  })

  // Pull AI-generated briefing from context for the incidents module.
  // All other modules use the static computed fallback.
  const { incidentsBriefing, incidentsLoading, incidentsIsAI, refreshIncidents } = useCoELens()

  const isIncidents = module === 'incidents'
  const loading     = isIncidents ? incidentsLoading  : false
  const _isAI       = isIncidents ? incidentsIsAI     : false; void _isAI
  const aiBriefing  = isIncidents ? incidentsBriefing : null

  // Always have something to show — AI result when ready, static while loading/fallback
  const b = aiBriefing ?? getBriefingForModule(module)

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem(COLLAPSE_KEY, String(next)) } catch { /* ignore */ }
  }

  // ── Collapsed strip ──────────────────────────────────────────────────────────

  if (collapsed) {
    return (
      <div
        className="lb-strip"
        onClick={toggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && toggle()}
        aria-label="Expand CoE Lens briefing"
      >
        <span className="lb-strip-icon">
          <Icon name="bi-lightbulb-fill" aria-hidden="true" />
          <span className="lb-icon-stars"><Icon name="bi-stars" aria-hidden="true" /></span>
        </span>
        <span className="lb-strip-label">CoE Lens</span>
        <span className="lb-ai-badge">AI</span>
        <span className="lb-strip-sep">·</span>
        <span className="lb-strip-narrative">
          {loading ? 'Generating AI briefing…' : `${b.narrative.split('.')[0]}.`}
        </span>
        <span className="lb-strip-expand">Expand <Icon name="bi-chevron-down" aria-hidden="true" /></span>
      </div>
    )
  }

  // ── Expanded card ────────────────────────────────────────────────────────────

  return (
    <div className="lb-card" role="region" aria-label="CoE Lens AI Briefing">
      {/* Header */}
      <div className="lb-card-head">
        <div className="lb-card-title">
          <span className="lb-icon">
            <Icon name="bi-lightbulb-fill" aria-hidden="true" />
            <span className="lb-icon-stars"><Icon name="bi-stars" aria-hidden="true" /></span>
          </span>
          CoE Lens
          <span className="lb-ai-badge">AI</span>
          <span className="lb-live-dot" aria-hidden="true" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Refresh — only for live AI modules */}
          {isIncidents && (
            <button
              className="lb-refresh-btn"
              onClick={refreshIncidents}
              disabled={loading}
              title="Re-fetch live data and regenerate AI briefing"
              aria-label="Refresh CoE Lens briefing"
            >
              <span className={loading ? 'lb-spin' : ''}>
                <Icon name="bi-arrow-clockwise" aria-hidden="true" />
              </span>
              {loading ? 'Generating…' : 'Refresh'}
            </button>
          )}
          <button className="lb-collapse-btn" onClick={toggle} aria-label="Collapse">
            Collapse <Icon name="bi-caret-up-fill" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Skeleton while PTU flow is in flight */}
      {loading ? (
        <div className="lb-loading-body">
          <div className="lb-generating-label">
            <span className="lb-generating-dot" />
            Fetching live incident data and generating AI briefing…
          </div>
          <div className="lb-skeleton lb-skeleton-line" style={{ width: '95%' }} />
          <div className="lb-skeleton lb-skeleton-line" style={{ width: '80%' }} />
          <div className="lb-skeleton lb-skeleton-line" style={{ width: '65%' }} />
          <div className="lb-skeleton-chips">
            <div className="lb-skeleton lb-skeleton-chip" />
            <div className="lb-skeleton lb-skeleton-chip" />
            <div className="lb-skeleton lb-skeleton-chip" />
          </div>
        </div>
      ) : (
        <div className="lb-content lb-content--visible">
          <p className="lb-narrative">{b.narrative}</p>

          <div className="lb-chips">
            {b.win && (
              <div className="lb-chip lb-chip--win">
                <Icon name="bi-trophy-fill" aria-hidden="true" />
                <div>
                  <div className="lb-chip-label">Biggest Win</div>
                  <div className="lb-chip-text">{b.win}</div>
                </div>
              </div>
            )}
            {b.watchlist && (
              <div className="lb-chip lb-chip--watch">
                <Icon name="bi-exclamation-circle" aria-hidden="true" />
                <div>
                  <div className="lb-chip-label">Watch List</div>
                  <div className="lb-chip-text">{b.watchlist}</div>
                </div>
              </div>
            )}
            {b.critical && (
              <div className="lb-chip lb-chip--critical">
                <Icon name="bi-exclamation-triangle-fill" aria-hidden="true" />
                <div>
                  <div className="lb-chip-label">Critical Risk</div>
                  <div className="lb-chip-text">{b.critical}</div>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
