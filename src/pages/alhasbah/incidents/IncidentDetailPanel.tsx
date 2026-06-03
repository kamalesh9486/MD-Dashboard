import { useState, useMemo } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import {
  AH_CM_ACTIVITIES_MUT,
  AH_SLA_DAYS,
  AH_SLA_LABEL,
  getAssignedTeam,
  daysSince,
  type AHIncident,
  type AHIncidentResolution,
  type AHSeverity,
  type AHIncidentStatus,
  type AHCMActivityType,
} from '../data'
import { useAlHasbah } from '../AlHasbahContext'
import { updateIncidentDv, addCommentDv } from '../services/incidentService'

const SEV_COLORS: Record<AHSeverity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#94a3b8',
}

const TYPE_LABELS: Record<AHIncident['type'], string> = {
  ai_agent: 'AI Agent',
  sap: 'SAP',
  business_process: 'Business Process',
  knowledge_gap: 'Knowledge Gap',
}

function sevClass(s: AHSeverity) {
  return s === 'critical'
    ? 'ah-badge ah-sev-critical'
    : s === 'high'
      ? 'ah-badge ah-sev-high'
      : s === 'medium'
        ? 'ah-badge ah-sev-medium'
        : 'ah-badge ah-sev-low'
}

function cmTypeIcon(type: AHCMActivityType): string {
  if (type === 'awareness_session') return 'bi-megaphone'
  if (type === 'documentation')     return 'bi-file-text'
  if (type === 'training')          return 'bi-mortarboard'
  return 'bi-envelope'
}

function cmStatusBadge(status: string) {
  if (status === 'completed')  return <span className="ah-badge" style={{ background: 'rgba(0,117,96,0.1)', color: '#007560' }}>Completed</span>
  if (status === 'in_progress') return <span className="ah-badge" style={{ background: 'rgba(202,138,4,0.1)', color: '#ca8a04' }}>In Progress</span>
  return <span className="ah-badge" style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>Planned</span>
}

function SectionLabel({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Icon name={icon} style={{ color: '#007560', fontSize: 13 }} />
      <span className="ah-detail-box-label">{title}</span>
    </div>
  )
}

interface ResFormState {
  summary: string
  rootCause: string
  fixedBy: string
  testedBy: string
  preventiveMeasures: string
}

interface ResErrors {
  rootCause?: string
  fixedBy?: string
}

interface Props {
  incident: AHIncident
  onClose: () => void
  onUpdate: () => void
}

export default function IncidentDetailPanel({ incident, onClose, onUpdate }: Props) {
  useScrollLock()

  const [localStatus, setLocalStatus] = useState<AHIncidentStatus>(incident.status)
  const [showCommentBox, setShowCommentBox] = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [showResForm,  setShowResForm]  = useState(false)
  const [resForm, setResForm] = useState<ResFormState>({
    summary: '', rootCause: '', fixedBy: '', testedBy: '', preventiveMeasures: '',
  })
  const [resErrors, setResErrors] = useState<ResErrors>({})

  const { agents, incidents: allIncidents } = useAlHasbah()

  const isResolved = localStatus === 'resolved'
  const days       = daysSince(incident.reportedDate)
  const slaDays    = AH_SLA_DAYS[incident.severity]
  const breached   = !isResolved && days > slaDays
  const agent      = agents.find(a => a.id === incident.agentId)
  const team       = getAssignedTeam(incident.type, incident.division)
  const cmActs     = AH_CM_ACTIVITIES_MUT.filter(a => a.incidentId === incident.id)
  const sevColor   = SEV_COLORS[incident.severity]

  const suggestedSolutions = useMemo(() => {
    if (isResolved) return []
    return allIncidents.filter(
      i => i.status === 'resolved' && i.type === incident.type && i.id !== incident.id && i.resolution,
    )
  }, [allIncidents, incident.id, incident.type, isResolved])

  function changeStatus(newStatus: AHIncidentStatus) {
    const patch: Partial<AHIncident> = { status: newStatus }
    if (newStatus === 'resolved') {
      patch.resolvedDate = new Date().toISOString().split('T')[0]
    }
    setLocalStatus(newStatus)
    if (incident._dvId) {
      void updateIncidentDv(incident._dvId, patch).then(() => onUpdate())
    } else {
      onUpdate()
    }
  }

  function handleAddComment() {
    if (!commentText.trim()) return
    const comment = {
      author: 'Current User',
      timestamp: new Date().toISOString(),
      text: commentText.trim(),
    }
    setCommentText('')
    setShowCommentBox(false)
    if (incident._dvId) {
      void addCommentDv(incident._dvId, incident.comments ?? [], comment).then(() => {
        if (localStatus === 'open') changeStatus('in_progress')
        onUpdate()
      })
    } else {
      if (localStatus === 'open') changeStatus('in_progress')
      onUpdate()
    }
  }

  function validateResolution(): boolean {
    const errs: ResErrors = {}
    if (!resForm.rootCause.trim()) errs.rootCause = 'Required'
    if (!resForm.fixedBy.trim())   errs.fixedBy   = 'Required'
    setResErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleResolve() {
    if (!validateResolution()) return
    const resolution: AHIncidentResolution = {
      summary:            resForm.summary.trim() || 'Resolved.',
      rootCause:          resForm.rootCause.trim(),
      fixedBy:            resForm.fixedBy.trim(),
      testedBy:           resForm.testedBy.trim() || undefined,
      preventiveMeasures: resForm.preventiveMeasures.trim() || undefined,
    }
    const patch = {
      resolution,
      status: 'resolved' as AHIncidentStatus,
      resolvedDate: new Date().toISOString().split('T')[0],
    }
    setLocalStatus('resolved')
    setShowResForm(false)
    if (incident._dvId) {
      void updateIncidentDv(incident._dvId, patch).then(() => onUpdate())
    } else {
      onUpdate()
    }
  }

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} />
      <div
        className="ah-panel ah-uc-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Incident ${incident.id.toUpperCase()} details`}
        style={{ display: 'flex', flexDirection: 'column' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="ah-panel-head" style={{ borderBottom: `3px solid ${sevColor}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span className={sevClass(incident.severity)}>{incident.severity.toUpperCase()}</span>
                <span style={{ fontSize: 12, opacity: 0.7 }}>{incident.id.toUpperCase()}</span>
                <span className="ah-badge" style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', fontSize: 10.5 }}>
                  {TYPE_LABELS[incident.type]}
                </span>
                {incident.changeManagementTriggered && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ca8a04', background: 'rgba(202,138,4,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                    <Icon name="bi-flag-fill" /> CM Triggered
                  </span>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>{incident.title}</div>
            </div>
            <button className="ah-panel-close" onClick={onClose} aria-label="Close panel">
              <Icon name="bi-x-lg" />
            </button>
          </div>
        </div>

        {/* ── Body (scrollable) ────────────────────────────────────────────── */}
        <div className="ah-panel-body" style={{ flex: 1, overflowY: 'auto' }}>

          {/* Meta grid 2×3 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            <div className="ah-detail-box">
              <div className="ah-detail-box-label">Status</div>
              {isResolved ? (
                <span className="ah-badge ah-inc-resolved" style={{ marginTop: 4, display: 'inline-block' }}>Resolved</span>
              ) : (
                <select
                  className="ah-select"
                  style={{ fontSize: 12, padding: '4px 8px', marginTop: 4 }}
                  value={localStatus}
                  onChange={e => changeStatus(e.target.value as AHIncidentStatus)}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                </select>
              )}
            </div>
            <div className="ah-detail-box">
              <div className="ah-detail-box-label">Assigned Team</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{team}</div>
            </div>
            <div className="ah-detail-box">
              <div className="ah-detail-box-label">Division</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{incident.division}</div>
            </div>
            <div className="ah-detail-box">
              <div className="ah-detail-box-label">AI Agent</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{agent?.name ?? '—'}</div>
            </div>
            <div className="ah-detail-box">
              <div className="ah-detail-box-label">Reported Date</div>
              <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{incident.reportedDate}</div>
            </div>
            {incident.resolvedDate ? (
              <div className="ah-detail-box">
                <div className="ah-detail-box-label">Resolved Date</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4, color: '#007560' }}>{incident.resolvedDate}</div>
              </div>
            ) : (
              <div className="ah-detail-box">
                <div className="ah-detail-box-label">Type</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{TYPE_LABELS[incident.type]}</div>
              </div>
            )}
          </div>

          {/* SLA Status */}
          <div style={{
            padding: '12px 14px', borderRadius: 10, marginBottom: 16,
            background: breached ? 'rgba(220,38,38,0.06)' : 'rgba(0,117,96,0.06)',
            border: `1px solid ${breached ? 'rgba(220,38,38,0.2)' : 'rgba(0,117,96,0.2)'}`,
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <Icon
              name={breached ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}
              style={{ color: breached ? '#dc2626' : '#007560', fontSize: 18, flexShrink: 0 }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: breached ? '#dc2626' : '#007560' }}>
                {isResolved
                  ? `Resolved in ${daysSince(incident.reportedDate)} day${daysSince(incident.reportedDate) !== 1 ? 's' : ''} — SLA: ${AH_SLA_LABEL[incident.severity]}`
                  : `${days} days since report — SLA: ${AH_SLA_LABEL[incident.severity]}`}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {isResolved
                  ? 'Incident closed'
                  : breached
                    ? `SLA breached by ${days - slaDays} day${days - slaDays !== 1 ? 's' : ''}`
                    : `${slaDays - days} day${slaDays - days !== 1 ? 's' : ''} remaining`}
              </div>
            </div>
          </div>

          {/* Submitter */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
            background: 'rgba(0,117,96,0.03)', border: '1px solid var(--border-card)',
            borderRadius: 10, marginBottom: 16,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #007560, #004937)',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {incident.submitterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{incident.submitterName}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{incident.submitterEmail}</div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <SectionLabel icon="bi-card-text" title="Description" />
            <div style={{
              fontSize: 13, lineHeight: 1.65, color: 'var(--text)',
              background: 'rgba(0,117,96,0.03)', border: '1px solid var(--border-card)',
              borderRadius: 8, padding: '12px 14px',
            }}>
              {incident.description}
            </div>
          </div>

          {/* Resolution detail (when resolved) */}
          {isResolved && incident.resolution && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel icon="bi-check-circle-fill" title="Resolution" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {incident.resolution.summary && (
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(0,117,96,0.06)', border: '1px solid rgba(0,117,96,0.18)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#007560', marginBottom: 5 }}>Summary</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{incident.resolution.summary}</div>
                  </div>
                )}
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.15)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#dc2626', marginBottom: 5 }}>Root Cause</div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{incident.resolution.rootCause}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div className="ah-detail-box">
                    <div className="ah-detail-box-label">Fixed By</div>
                    <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{incident.resolution.fixedBy}</div>
                  </div>
                  {incident.resolution.testedBy && (
                    <div className="ah-detail-box">
                      <div className="ah-detail-box-label">Tested By</div>
                      <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }}>{incident.resolution.testedBy}</div>
                    </div>
                  )}
                </div>
                {incident.resolution.preventiveMeasures && (
                  <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#3b82f6', marginBottom: 5 }}>Preventive Measures</div>
                    <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text)' }}>{incident.resolution.preventiveMeasures}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CM Activities */}
          {incident.changeManagementTriggered && cmActs.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <SectionLabel icon="bi-flag-fill" title="Change Management Activities" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {cmActs.map(act => (
                  <div key={act.id} style={{
                    background: 'rgba(202,138,4,0.06)', border: '1px solid rgba(202,138,4,0.2)',
                    borderRadius: 10, padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, background: 'rgba(202,138,4,0.15)',
                        color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon name={cmTypeIcon(act.type)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{act.title}</div>
                      </div>
                      {cmStatusBadge(act.status)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{act.description}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span><strong>Scheduled:</strong> {act.scheduledDate}</span>
                      {act.completedDate && <span><strong>Completed:</strong> {act.completedDate}</span>}
                      <span><strong>Audience:</strong> {act.targetAudience}</span>
                      {act.attendees !== undefined && <span><strong>Attendees:</strong> {act.attendees}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <SectionLabel icon="bi-chat-dots" title={`Comments (${incident.comments?.length ?? 0})`} />
              {!isResolved && !showCommentBox && (
                <button className="ah-pill-btn" onClick={() => setShowCommentBox(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name="bi-chat-dots" /> Add Comment
                </button>
              )}
            </div>

            {isResolved && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(107,114,128,0.06)', border: '1px solid rgba(107,114,128,0.15)', color: 'var(--text-muted)', fontSize: 12, marginBottom: 10 }}>
                <Icon name="bi-lock-fill" /> Incident is resolved. Comments are locked.
              </div>
            )}

            {incident.comments && incident.comments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                {incident.comments.map(c => (
                  <div key={c.id} style={{
                    background: 'rgba(0,117,96,0.03)', border: '1px solid var(--border-card)',
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{c.author}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(c.timestamp).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>{c.text}</div>
                  </div>
                ))}
              </div>
            )}

            {!isResolved && showCommentBox && (
              <div style={{ background: 'rgba(0,117,96,0.03)', border: '1px solid rgba(0,117,96,0.2)', borderRadius: 10, padding: 12 }}>
                <textarea
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add your comment… (Ctrl+Enter to submit)"
                  rows={3}
                  onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) handleAddComment() }}
                  className="ah-select"
                  style={{ width: '100%', resize: 'vertical', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", boxSizing: 'border-box', minHeight: 72 }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="ah-add-btn" style={{ fontSize: 12, padding: '6px 14px' }} onClick={handleAddComment} disabled={!commentText.trim()}>
                    Submit
                  </button>
                  <button className="ah-pill-btn" style={{ fontSize: 12 }} onClick={() => { setShowCommentBox(false); setCommentText('') }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Resolution Form (shown when Resolve & Close clicked) ─────── */}
          {!isResolved && showResForm && (
            <div style={{ marginTop: 16, padding: '16px', borderRadius: 10, background: 'rgba(0,117,96,0.04)', border: '1px solid rgba(0,117,96,0.2)' }}>
              <SectionLabel icon="bi-check-circle" title="Resolve Incident" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="ah-form-group">
                  <label className="ah-form-label">Resolution Summary</label>
                  <textarea
                    className="ah-select"
                    rows={2}
                    placeholder="What was done to resolve this incident?"
                    value={resForm.summary}
                    onChange={e => setResForm(p => ({ ...p, summary: e.target.value }))}
                    style={{ resize: 'vertical', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", minHeight: 60 }}
                  />
                </div>
                <div className="ah-form-group">
                  <label className="ah-form-label">Root Cause *</label>
                  <textarea
                    className="ah-select"
                    rows={2}
                    placeholder="What caused this incident?"
                    value={resForm.rootCause}
                    onChange={e => { setResForm(p => ({ ...p, rootCause: e.target.value })); setResErrors(p => ({ ...p, rootCause: undefined })) }}
                    style={{ resize: 'vertical', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", minHeight: 60, borderColor: resErrors.rootCause ? '#dc2626' : undefined }}
                  />
                  {resErrors.rootCause && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{resErrors.rootCause}</div>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="ah-form-group">
                    <label className="ah-form-label">Fixed By *</label>
                    <input
                      className="ah-select"
                      type="text"
                      placeholder="Person or team"
                      value={resForm.fixedBy}
                      onChange={e => { setResForm(p => ({ ...p, fixedBy: e.target.value })); setResErrors(p => ({ ...p, fixedBy: undefined })) }}
                      style={{ borderColor: resErrors.fixedBy ? '#dc2626' : undefined }}
                    />
                    {resErrors.fixedBy && <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>{resErrors.fixedBy}</div>}
                  </div>
                  <div className="ah-form-group">
                    <label className="ah-form-label">Tested By</label>
                    <input
                      className="ah-select"
                      type="text"
                      placeholder="QA or reviewer (optional)"
                      value={resForm.testedBy}
                      onChange={e => setResForm(p => ({ ...p, testedBy: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="ah-form-group">
                  <label className="ah-form-label">Preventive Measures</label>
                  <textarea
                    className="ah-select"
                    rows={2}
                    placeholder="Steps to prevent recurrence (optional)"
                    value={resForm.preventiveMeasures}
                    onChange={e => setResForm(p => ({ ...p, preventiveMeasures: e.target.value }))}
                    style={{ resize: 'vertical', fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", minHeight: 56 }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="ah-add-btn" onClick={handleResolve} style={{ flex: 1 }}>
                    <Icon name="bi-check-lg" /> Resolve &amp; Close
                  </button>
                  <button className="ah-pill-btn" onClick={() => setShowResForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Suggested Solutions (open/in_progress, not showing resolve form) */}
          {!isResolved && !showResForm && (
            <div style={{ marginTop: 16 }}>
              <SectionLabel icon="bi-lightbulb" title="Suggested Solutions" />
              {suggestedSolutions.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '12px 14px', borderRadius: 8, background: 'rgba(107,114,128,0.05)', border: '1px solid rgba(107,114,128,0.12)' }}>
                  No historical resolved incidents of the same type found. Escalate to the relevant team for triage.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 4 }}>
                    Based on {suggestedSolutions.length} similar resolved {TYPE_LABELS[incident.type]} incident{suggestedSolutions.length !== 1 ? 's' : ''}:
                  </div>
                  {suggestedSolutions.map(similar => (
                    <div key={similar.id} style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.22)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#ca8a04', letterSpacing: '0.08em' }}>{similar.id.toUpperCase()}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', lineHeight: 1.4 }}>{similar.title}</span>
                      </div>
                      {similar.resolution && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Root Cause</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>{similar.resolution.rootCause}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#007560', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>How it was fixed</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>{similar.resolution.summary}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Fixed by <strong style={{ color: 'var(--text)' }}>{similar.resolution.fixedBy}</strong>
                            {similar.resolvedDate && ` · Resolved ${similar.resolvedDate}`}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer action bar (sticky, hidden when resolved) ─────────────── */}
        {!isResolved && (
          <div style={{
            padding: '12px 20px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0, gap: 10, background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {localStatus === 'open' && (
                <button
                  onClick={() => changeStatus('in_progress')}
                  style={{ padding: '7px 14px', background: 'rgba(202,138,4,0.1)', border: '1px solid rgba(202,138,4,0.3)', borderRadius: 6, cursor: 'pointer', color: '#ca8a04', fontSize: 12.5, fontWeight: 600, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Icon name="bi-arrow-clockwise" /> Mark In Progress
                </button>
              )}
              {localStatus === 'in_progress' && (
                <button
                  onClick={() => changeStatus('open')}
                  style={{ padding: '7px 14px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 6, cursor: 'pointer', color: '#dc2626', fontSize: 12.5, fontWeight: 600, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Icon name="bi-arrow-counterclockwise" /> Reopen
                </button>
              )}
            </div>
            {!showResForm && (
              <button
                onClick={() => setShowResForm(true)}
                style={{ padding: '7px 16px', background: '#007560', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', fontSize: 12.5, fontWeight: 600, fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <Icon name="bi-check-circle-fill" /> Resolve &amp; Close
              </button>
            )}
          </div>
        )}
      </div>
    </>
  )
}
