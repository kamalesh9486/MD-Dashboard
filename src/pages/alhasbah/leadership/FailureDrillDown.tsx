import { useState, useMemo } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { AH_REJECTION_BREAKDOWN, type AHRejectionIssueType } from '../data'

interface Props {
  category: AHRejectionIssueType | undefined
  onClose: () => void
}

const COARSE_CONFIG: Record<AHRejectionIssueType, { label: string; color: string; icon: string; desc: string }> = {
  ai_issue:        { label: 'AI Issues',       color: '#ef4444', icon: 'bi-exclamation-circle', desc: 'Mismatch or logic errors produced by the AI model — document fields differ from HR records in ways the model should have caught.' },
  user_awareness:  { label: 'User Awareness',  color: '#ca8a04', icon: 'bi-people',             desc: 'HR system fields are undefined or missing — often because employees have incomplete records in the source system.' },
  ocr_doc_quality: { label: 'OCR Issues',      color: '#7c3aed', icon: 'bi-file-earmark-text',  desc: 'Optical character recognition could not extract fields with sufficient confidence from the uploaded document scan.' },
  other:           { label: 'Other',           color: '#6b7280', icon: 'bi-shield-exclamation', desc: 'Rejection reasons that do not fit the primary categories.' },
}

// Fine-grained sub-categories mirroring the real AlHasbah rejection breakdown
const FINE_GRAINED: Record<AHRejectionIssueType, { key: string; label: string; color: string; desc: string }[]> = {
  ai_issue: [
    { key: 'completely_different',    label: 'Completely Different Values',  color: '#ef4444', desc: 'Document fields (name, nationality, DOB, place of birth, gender) completely differ from HR records.' },
    { key: 'date_mismatch',           label: 'Date Mismatch',                color: '#f97316', desc: 'DOB, issue date, or expiry date differs between document and HR system.' },
    { key: 'name_mismatch',           label: 'Name / Nationality Mismatch',  color: '#3b82f6', desc: 'First name not matched within tolerance, or nationality differs.' },
    { key: 'place_mismatch',          label: 'Place Mismatch',               color: '#8b5cf6', desc: 'Place of birth or place of issue differs between document and HR record.' },
    { key: 'document_field_mismatch', label: 'Document Field Mismatch',      color: '#06b6d4', desc: 'Passport number, ID number, file number, or occupation differs.' },
    { key: 'missing_field',           label: 'Missing Required Field',       color: '#f59e0b', desc: 'Required field missing for non-UAE national (issuing place, occupation, etc.).' },
  ],
  user_awareness: [
    { key: 'hr_undefined', label: 'HR System Undefined', color: '#ca8a04', desc: 'HR system fields (name, nationality, DOB, place of birth, gender) are undefined or missing.' },
  ],
  ocr_doc_quality: [
    { key: 'ocr_low_confidence', label: 'OCR Low Confidence', color: '#7c3aed', desc: 'OCR extraction confidence too low to reliably compare fields. Document quality or lighting insufficient.' },
  ],
  other: [
    { key: 'other', label: 'Other', color: '#6b7280', desc: 'Mismatch reason that does not fit the primary categories. Requires manual triage.' },
  ],
}

// Map AH_REJECTION_BREAKDOWN items to fine-grained keys (best effort)
const BREAKDOWN_TO_FINE: Record<string, string> = {
  completely_different: 'completely_different',
  date_mismatch:        'date_mismatch',
  name_mismatch:        'name_mismatch',
  hr_undefined:         'hr_undefined',
  ocr_low_confidence:   'ocr_low_confidence',
  other:                'other',
}

export default function FailureDrillDown({ category, onClose }: Props) {
  useScrollLock()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [catFilter, setCatFilter] = useState<AHRejectionIssueType | 'all'>('all')

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  const totalIssues = AH_REJECTION_BREAKDOWN.reduce((s, r) => s + r.count, 0)

  const ALL_TYPES: AHRejectionIssueType[] = ['ai_issue', 'user_awareness', 'ocr_doc_quality', 'other']

  // Effective filter: use the prop (from IssueBar click) if set, else state
  const activeFilter = category ?? (catFilter === 'all' ? undefined : catFilter)

  const groups = useMemo(() => ALL_TYPES
    .filter(t => !activeFilter || t === activeFilter)
    .map(t => ({
      type: t,
      coarseItems: AH_REJECTION_BREAKDOWN.filter(r => r.issueType === t),
      fineItems:   FINE_GRAINED[t],
    }))
    .filter(g => g.coarseItems.length > 0),
  [activeFilter])

  const headerCfg = activeFilter
    ? COARSE_CONFIG[activeFilter]
    : { label: 'All Failure Categories', color: '#007560', icon: 'bi-bug' }

  const filteredTotal = groups.reduce((s, g) => s + g.coarseItems.reduce((a, b) => a + b.count, 0), 0)

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="ah-panel ah-drill-panel-960" role="dialog" aria-label="Failure Drill-Down">

        {/* ── Header ── */}
        <div className="ah-panel-head" style={{ flexShrink: 0 }}>
          <button className="ah-panel-close" onClick={onClose} aria-label="Close">
            <Icon name="bi-x-lg" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span style={{ color: headerCfg.color }}><Icon name={headerCfg.icon} /></span>
            <div className="ah-panel-name">Main Agent Failures — Rejection Log</div>
          </div>
          {activeFilter && (
            <div style={{ marginBottom: 4 }}>
              <span className="ah-badge" style={{ background: `${COARSE_CONFIG[activeFilter].color}18`, color: COARSE_CONFIG[activeFilter].color }}>
                Filtered · {COARSE_CONFIG[activeFilter].label}
              </span>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
            {filteredTotal.toLocaleString()} of {totalIssues.toLocaleString()} rejected records · grouped by mismatch reason
          </div>
        </div>

        {/* ── Filter bar (when showing all categories) ── */}
        {!category && (
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'flex-end', background: 'var(--surface)' }}>
            <div>
              <div className="ah-filter-label">Category</div>
              <select
                className="ah-select"
                value={catFilter}
                onChange={e => setCatFilter(e.target.value as AHRejectionIssueType | 'all')}
              >
                <option value="all">All Categories</option>
                {ALL_TYPES.map(t => (
                  <option key={t} value={t}>{COARSE_CONFIG[t].label}</option>
                ))}
              </select>
            </div>
            {catFilter !== 'all' && (
              <button className="ah-stream-drill-btn" onClick={() => setCatFilter('all')}>
                <Icon name="bi-x-circle" /> Clear
              </button>
            )}
            <span style={{ fontSize: 12, color: 'var(--text-muted)', paddingBottom: 6, marginLeft: 'auto' }}>
              {filteredTotal.toLocaleString()} issues shown
            </span>
          </div>
        )}

        {/* ── Groups ── */}
        <div className="ah-panel-body" style={{ padding: 0, flex: 1, overflowY: 'auto' }}>
          {groups.map(group => {
            const cfg        = COARSE_CONFIG[group.type]
            const groupTotal = group.coarseItems.reduce((s, r) => s + r.count, 0)
            const isOpen     = expanded.has(group.type)
            return (
              <div key={group.type} style={{ borderBottom: '1px solid var(--border)' }}>
                {/* Group header */}
                <button onClick={() => toggle(group.type)} className="ah-failure-group-head">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name={isOpen ? 'bi-chevron-down' : 'bi-chevron-right'} />
                    <span style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: cfg.color, flexShrink: 0, display: 'inline-block',
                    }} />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{cfg.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: cfg.color }}>{groupTotal.toLocaleString()}</span>
                    <span className="ah-badge" style={{ background: `${cfg.color}18`, color: cfg.color }}>
                      {Math.round(groupTotal / totalIssues * 100)}% of total
                    </span>
                    <Icon name={isOpen ? 'bi-dash-lg' : 'bi-plus-lg'} />
                  </div>
                </button>

                {isOpen && (
                  <div style={{ padding: '0 20px 20px' }}>
                    {/* Progress bar */}
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,117,96,0.08)', marginBottom: 16, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(groupTotal / totalIssues * 100)}%`, background: cfg.color, borderRadius: 3 }} />
                    </div>

                    {/* Fine-grained sub-category descriptions */}
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Sub-categories in this group
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {group.fineItems.map(fine => {
                          const match = AH_REJECTION_BREAKDOWN.find(r => BREAKDOWN_TO_FINE[r.category] === fine.key)
                          const count = match?.count ?? 0
                          const pct   = count > 0 ? Math.round((count / groupTotal) * 100) : 0
                          return (
                            <div key={fine.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: `${fine.color}06`, border: `1px solid ${fine.color}22` }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: fine.color, flexShrink: 0, marginTop: 5 }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{fine.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.45 }}>{fine.desc}</div>
                              </div>
                              {count > 0 && (
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: fine.color }}>{count.toLocaleString()}</div>
                                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pct}%</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Aggregate table */}
                    <table className="ah-table">
                      <thead>
                        <tr>
                          <th>Rejection Category</th>
                          <th style={{ textAlign: 'right' }}>Count</th>
                          <th style={{ textAlign: 'right' }}>% of Group</th>
                          <th style={{ textAlign: 'right' }}>% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.coarseItems.map(item => (
                          <tr key={item.category}>
                            <td style={{ fontWeight: 600, fontSize: 12.5 }}>{item.label}</td>
                            <td style={{ textAlign: 'right', fontWeight: 700, color: cfg.color }}>{item.count.toLocaleString()}</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{Math.round(item.count / groupTotal * 100)}%</td>
                            <td style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 12 }}>{Math.round(item.count / totalIssues * 100)}%</td>
                          </tr>
                        ))}
                        <tr style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>
                          <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>Subtotal</td>
                          <td style={{ textAlign: 'right', color: cfg.color }}>{groupTotal.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>100%</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{Math.round(groupTotal / totalIssues * 100)}%</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Data note */}
                    <div style={{ marginTop: 12, display: 'flex', gap: 6, alignItems: 'flex-start', padding: '8px 12px', borderRadius: 6, background: 'rgba(107,114,128,0.05)', border: '1px solid rgba(107,114,128,0.12)' }}>
                      <Icon name="bi-info-circle" style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        Showing aggregated rejection statistics from {new Date().toLocaleDateString('en-AE', { month: 'long', year: 'numeric' })}. Data covers 6,379 total records processed from Feb–Apr 2026.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {groups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)' }}>
              <Icon name="bi-inbox" style={{ fontSize: 28 }} />
              <div style={{ marginTop: 10, fontSize: 14 }}>No data for the selected category</div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
