import { type Program } from './data'
import Icon from '../../components/Icon'

function fmt(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function dateProgress(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const now = Date.now()
  const s = new Date(startDate).getTime()
  const e = new Date(endDate).getTime()
  if (e <= s) return 0
  return Math.max(0, Math.min(100, Math.round(((now - s) / (e - s)) * 100)))
}

interface Props {
  program: Program
  onViewEvents: (p: Program) => void
}

export default function ProgramDetailPanel({ program: p, onViewEvents }: Props) {
  const pct   = p.status === 'Completed' ? 100 : p.status === 'Upcoming' ? 0 : dateProgress(p.startDate, p.endDate)
  const stCls = p.status === 'Active' ? 'active' : p.status === 'Completed' ? 'completed' : 'upcoming'

  return (
    <>
      {/* Header */}
      <div className="pdet-header">
        <div className="pdet-header-top">
          <span className={`prog-badge prog-badge-${stCls}`}>
            <span className="prog-badge-dot" />{p.status}
          </span>
          {p.ownerDivision && <span className="pdet-div-tag">{p.ownerDivision}</span>}
        </div>
        <h2 className="pdet-title">{p.name}</h2>
      </div>

      {/* Body */}
      <div className="pdet-body">
        {p.description && <p className="pdet-desc">{p.description}</p>}

        {/* Progress block */}
        <div className="pdet-section">
          <div className="pdet-section-top">
            <div>
              <div className="pdet-eyebrow">Programme Progress</div>
              <div className="pdet-pct">{pct}<span className="pdet-pct-unit">%</span></div>
            </div>
            <div className="pdet-end-date">ends: <strong>{fmt(p.endDate)}</strong></div>
          </div>
          <div className="pdet-bar"><span style={{ width: `${pct}%` }} /></div>
          <div className="pdet-bar-labels">
            <span>{fmt(p.startDate)}</span>
            <span>{fmt(p.endDate)}</span>
          </div>
        </div>

        {/* KV grid */}
        <div>
          <div className="pdet-label">Programme Details</div>
          <div className="pdet-kv-grid">
            {[
              { k: 'Start Date',      v: fmt(p.startDate) },
              { k: 'End Date',        v: fmt(p.endDate) },
              { k: 'Events',          v: String(p.eventCount) },
              { k: 'Target Audience', v: p.targetAudience || '—' },
            ].map(({ k, v }) => (
              <div key={k} className="pdet-kv">
                <span className="pdet-kv-k">{k}</span>
                <span className="pdet-kv-v">{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        {p.objectives.length > 0 && (
          <div>
            <div className="pdet-label">Objectives</div>
            <div className="pdet-objectives">
              {p.objectives.map((obj, i) => (
                <div key={i} className="pdet-obj-row">
                  <span className="pdet-obj-dot" />
                  <span>{obj}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pdet-hr" />
        <div className="pdet-actions">
          <button className="pdet-btn-primary" onClick={() => onViewEvents(p)}>
            <Icon name="bi-calendar-event" /> View Events
          </button>
        </div>
      </div>
    </>
  )
}
