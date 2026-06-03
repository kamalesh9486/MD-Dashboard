import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import {
  type AHDivision,
  type AHSeverity,
  type AHIncidentType,
} from '../data'
import { useAlHasbah } from '../AlHasbahContext'
import { createIncident } from '../services/incidentService'

interface Props {
  onClose: () => void
  onAdded: () => void
}

export default function IncidentFormPanel({ onClose, onAdded }: Props) {
  useScrollLock()
  const { agents } = useAlHasbah()

  const [agentId, setAgentId]         = useState('')
  const [title, setTitle]             = useState('')
  const [type, setType]               = useState<AHIncidentType>('ai_agent')
  const [severity, setSeverity]       = useState<AHSeverity>('medium')
  const [description, setDescription] = useState('')
  const [submitterName, setSubmitterName] = useState('')
  const [submitterEmail, setSubmitterEmail] = useState('')
  const [cmRequired, setCmRequired]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const selectedAgent = agents.find(a => a.id === agentId)

  function validate(): boolean {
    if (!agentId)           { setError('Please select an AI agent.'); return false }
    if (!title.trim())      { setError('Title is required.'); return false }
    if (!description.trim()){ setError('Description is required.'); return false }
    if (!submitterName.trim()) { setError('Submitter name is required.'); return false }
    if (!submitterEmail.trim()) { setError('Submitter email is required.'); return false }
    return true
  }

  async function handleSubmit() {
    setError('')
    if (!validate()) return
    setSaving(true)

    const division: AHDivision = selectedAgent?.division ?? 'HR'

    try {
      await createIncident({
        agentId,
        title: title.trim(),
        type,
        severity,
        status: 'open',
        division,
        reportedDate: new Date().toISOString().slice(0, 10),
        changeManagementTriggered: cmRequired,
        description: description.trim(),
        submitterName: submitterName.trim(),
        submitterEmail: submitterEmail.trim(),
        comments: [],
      })
      onAdded()
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} />
      <div
        className="ah-panel ah-form-panel-540"
        role="dialog"
        aria-modal="true"
        aria-label="Report new incident"
      >
        {/* Header */}
        <div className="ah-panel-head">
          <button className="ah-panel-close" onClick={onClose} aria-label="Close panel">
            <Icon name="bi-x-lg" />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Icon name="bi-shield-plus" style={{ fontSize: 16 }} />
              <span style={{ fontSize: 15, fontWeight: 700 }}>Report Incident</span>
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Log a new AI Health or process incident</div>
          </div>
        </div>

        {/* Body */}
        <div className="ah-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {error && (
            <div
              style={{
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12.5,
                color: '#dc2626',
              }}
            >
              <Icon name="bi-exclamation-circle-fill" />
              {error}
            </div>
          )}

          {/* Agent select */}
          <div className="ah-form-group">
            <label className="ah-form-label" htmlFor="inc-agent">AI Agent *</label>
            <select
              id="inc-agent"
              className="ah-select"
              style={{ width: '100%' }}
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
            >
              <option value="">Select agent...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} — {a.division}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="ah-form-group">
            <label className="ah-form-label" htmlFor="inc-title">Title *</label>
            <input
              id="inc-title"
              type="text"
              className="ah-select"
              style={{ width: '100%', boxSizing: 'border-box' }}
              placeholder="Brief incident title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Type + Severity row */}
          <div className="ah-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="ah-form-label" htmlFor="inc-type">Type</label>
              <select
                id="inc-type"
                className="ah-select"
                style={{ width: '100%' }}
                value={type}
                onChange={e => setType(e.target.value as AHIncidentType)}
              >
                <option value="ai_agent">AI Agent</option>
                <option value="sap">SAP</option>
                <option value="business_process">Business Process</option>
                <option value="knowledge_gap">Knowledge Gap</option>
              </select>
            </div>
            <div>
              <label className="ah-form-label" htmlFor="inc-severity">Severity</label>
              <select
                id="inc-severity"
                className="ah-select"
                style={{ width: '100%' }}
                value={severity}
                onChange={e => setSeverity(e.target.value as AHSeverity)}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="ah-form-group">
            <label className="ah-form-label" htmlFor="inc-desc">Description *</label>
            <textarea
              id="inc-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the incident in detail..."
              rows={4}
              style={{
                width: '100%',
                minHeight: 100,
                resize: 'vertical',
                padding: '8px 12px',
                borderRadius: 9,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                fontSize: 13,
                color: 'var(--text)',
                fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {/* Submitter Name + Email */}
          <div className="ah-form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="ah-form-label" htmlFor="inc-name">Submitter Name *</label>
              <input
                id="inc-name"
                type="text"
                className="ah-select"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="Full name"
                value={submitterName}
                onChange={e => setSubmitterName(e.target.value)}
              />
            </div>
            <div>
              <label className="ah-form-label" htmlFor="inc-email">Submitter Email *</label>
              <input
                id="inc-email"
                type="email"
                className="ah-select"
                style={{ width: '100%', boxSizing: 'border-box' }}
                placeholder="name@dewa.gov.ae"
                value={submitterEmail}
                onChange={e => setSubmitterEmail(e.target.value)}
              />
            </div>
          </div>

          {/* CM Required toggle */}
          <div className="ah-form-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setCmRequired(v => !v)}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  background: cmRequired ? '#ca8a04' : 'rgba(0,0,0,0.12)',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
                aria-checked={cmRequired}
                role="switch"
                aria-label="Change Management required"
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: cmRequired ? 23 : 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: cmRequired ? '#ca8a04' : 'var(--text)' }}>
                  Change Management Required
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Triggers CM activity tracking and notifications
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
            <button className="ah-add-btn" onClick={() => { void handleSubmit() }} style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
              <Icon name={saving ? 'bi-hourglass-split' : 'bi-shield-plus'} />
              {saving ? ' Submitting…' : ' Submit Incident'}
            </button>
            <button className="ah-pill-btn" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
