import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { type AHUseCase, type AHDivision, type AHStatus } from '../data'
import { useAlHasbah } from '../AlHasbahContext'
import { createUseCase, updateUseCase } from '../services/useCaseService'

// ── Chip multi-input ──────────────────────────────────────────────────────────
interface ChipInputProps {
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
}

function ChipInput({ label, values, onChange, placeholder }: ChipInputProps) {
  const [inputVal, setInputVal] = useState('')

  function commit() {
    const v = inputVal.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInputVal('')
  }

  return (
    <div className="ah-form-group">
      <label className="ah-form-label">{label}</label>
      <div className="ah-chip-input-wrap">
        {values.map(v => (
          <span key={v} className="ah-chip-input-chip">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter(x => x !== v))}
              aria-label={`Remove ${v}`}
            >
              <Icon name="bi-x" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commit() }
            if (e.key === 'Backspace' && !inputVal && values.length > 0) {
              onChange(values.slice(0, -1))
            }
          }}
          onBlur={commit}
          placeholder={placeholder ?? 'Type and press Enter…'}
          style={{
            border: 'none', outline: 'none', background: 'transparent',
            fontSize: 12, minWidth: 120, flex: 1,
            color: 'var(--text)', padding: '2px 4px',
            fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif",
          }}
        />
      </div>
    </div>
  )
}

// ── Form panel ────────────────────────────────────────────────────────────────
interface Props {
  uc?: AHUseCase   // present → edit mode; absent → add mode
  onClose: () => void
  onSaved: (name: string) => void
}

export default function UseCaseFormPanel({ uc, onClose, onSaved }: Props) {
  useScrollLock()
  const isEdit = !!uc
  const { agents } = useAlHasbah()

  const [agentId,              setAgentId]             = useState(uc?.agentId ?? (agents[0]?.id ?? ''))
  const [name,                 setName]                = useState(uc?.name ?? '')
  const [domain,               setDomain]              = useState(uc?.domain ?? '')
  const [status,               setStatus]              = useState<AHStatus>(uc?.status ?? 'planned')
  const [plannedGoLive,        setPlannedGoLive]       = useState(uc?.plannedGoLive ?? '')
  const [actualGoLive,         setActualGoLive]        = useState(uc?.actualGoLive ?? '')
  const [annualVolume,         setAnnualVolume]        = useState(String(uc?.annualVolume ?? '0'))
  const [expectedEfficiency,   setExpectedEfficiency]  = useState(String(uc?.expectedEfficiency ?? '0'))
  const [targetCostSaving,     setTargetCostSaving]    = useState(String(uc?.targetCostSaving ?? ''))
  const [description,          setDescription]         = useState(uc?.description ?? '')
  const [sapModule,            setSapModule]           = useState(uc?.sapModule ?? '')
  const [systemsForIntegration, setSystemsForIntegration] = useState<string[]>(uc?.systemsForIntegration ?? [])
  const [currentState,         setCurrentState]        = useState(uc?.currentState ?? '')
  const [futureState,          setFutureState]         = useState(uc?.futureState ?? '')
  const [processes,            setProcesses]           = useState<string[]>(uc?.processes ?? [])
  const [totalDevelopmentEffort, setTotalDevelopmentEffort] = useState(String(uc?.totalDevelopmentEffort ?? '0'))
  const [adoptionActual,       setAdoptionActual]      = useState(String(uc?.adoptionActual ?? ''))
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const agent    = agents.find(a => a.id === agentId)
  const division = (agent?.division ?? 'HR') as AHDivision

  function validate() {
    if (!name.trim())        { setError('Use case name is required'); return false }
    if (!domain.trim())      { setError('Domain is required'); return false }
    if (!description.trim()) { setError('Description is required'); return false }
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setSaving(true)
    setError('')

    const payload: Omit<AHUseCase, 'id' | '_dvId'> = {
      agentId,
      name: name.trim(),
      division,
      domain: domain.trim(),
      status,
      plannedGoLive,
      actualGoLive: actualGoLive || undefined,
      annualVolume:           Number(annualVolume)           || 0,
      expectedEfficiency:     Number(expectedEfficiency)     || 0,
      targetCostSaving:       Number(targetCostSaving)       || 0,
      description: description.trim(),
      sapModule:   sapModule.trim(),
      systemsForIntegration,
      currentState:  currentState.trim(),
      futureState:   futureState.trim(),
      processes,
      totalDevelopmentEffort: Number(totalDevelopmentEffort) || 0,
      adoptionActual: adoptionActual ? Number(adoptionActual) : undefined,
      milestones: uc?.milestones ?? [
        { name: 'Design',      status: 'pending' },
        { name: 'Development', status: 'pending' },
        { name: 'UAT',         status: 'pending' },
        { name: 'Go-Live',     status: 'pending' },
      ],
    }

    try {
      if (isEdit && uc._dvId) {
        await updateUseCase(uc._dvId, payload)
      } else {
        await createUseCase(payload)
      }
      onSaved(name.trim())
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} />
      <div className="ah-panel ah-uc-detail-panel">
        {/* Header */}
        <div className="ah-panel-head">
          <button className="ah-panel-close" onClick={onClose}><Icon name="bi-x-lg" /></button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {isEdit ? 'Edit Use Case' : 'Add New Use Case'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              {isEdit ? `Editing: ${uc.name}` : 'Register a new use case in the Al Hasbah portfolio'}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ah-panel-body">
          {error && (
            <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 6, background: 'rgba(220,38,38,0.08)', color: '#dc2626', fontSize: 12, border: '1px solid rgba(220,38,38,0.2)' }}>
              {error}
            </div>
          )}

          {/* Agent */}
          <div className="ah-form-group">
            <label className="ah-form-label">Linked AI Agent *</label>
            <select className="ah-select" value={agentId} onChange={e => setAgentId(e.target.value)}>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.division})</option>
              ))}
            </select>
          </div>

          {/* Name */}
          <div className="ah-form-group">
            <label className="ah-form-label">Use Case Name *</label>
            <input
              className="ah-select" type="text"
              placeholder="e.g. Invoice Auto-Matching"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
            />
          </div>

          {/* Domain + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Domain *</label>
              <input
                className="ah-select" type="text"
                placeholder="e.g. Accounts Payable"
                value={domain}
                onChange={e => { setDomain(e.target.value); setError('') }}
              />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Status</label>
              <select className="ah-select" value={status} onChange={e => setStatus(e.target.value as AHStatus)}>
                <option value="planned">Planned</option>
                <option value="pipeline">In Pipeline</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Planned Go-Live</label>
              <input className="ah-select" type="date" value={plannedGoLive} onChange={e => setPlannedGoLive(e.target.value)} />
            </div>
            {status === 'live' && (
              <div className="ah-form-group">
                <label className="ah-form-label">Actual Go-Live</label>
                <input className="ah-select" type="date" value={actualGoLive} onChange={e => setActualGoLive(e.target.value)} />
              </div>
            )}
          </div>

          {/* Description */}
          <div className="ah-form-group">
            <label className="ah-form-label">Description *</label>
            <textarea
              className="ah-select"
              style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="What this use case does and its business value…"
              value={description}
              onChange={e => { setDescription(e.target.value); setError('') }}
            />
          </div>

          {/* Current State + Future State */}
          <div className="ah-form-group">
            <label className="ah-form-label">Current State</label>
            <textarea
              className="ah-select"
              style={{ minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="How this process works today (manual steps, pain points)…"
              value={currentState}
              onChange={e => setCurrentState(e.target.value)}
            />
          </div>
          <div className="ah-form-group">
            <label className="ah-form-label">Future State</label>
            <textarea
              className="ah-select"
              style={{ minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="How the AI will transform this process…"
              value={futureState}
              onChange={e => setFutureState(e.target.value)}
            />
          </div>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Target Cost Saving (AED)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={targetCostSaving} onChange={e => setTargetCostSaving(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Annual Volume (transactions)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={annualVolume} onChange={e => setAnnualVolume(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Expected AI Efficiency %</label>
              <input className="ah-select" type="number" min="0" max="100" placeholder="0" value={expectedEfficiency} onChange={e => setExpectedEfficiency(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Dev Effort (days)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={totalDevelopmentEffort} onChange={e => setTotalDevelopmentEffort(e.target.value)} />
            </div>
            {status === 'live' && (
              <div className="ah-form-group">
                <label className="ah-form-label">Actual Adoption % (live)</label>
                <input className="ah-select" type="number" min="0" max="100" placeholder="0" value={adoptionActual} onChange={e => setAdoptionActual(e.target.value)} />
              </div>
            )}
          </div>

          {/* SAP Module */}
          <div className="ah-form-group">
            <label className="ah-form-label">SAP Module</label>
            <input className="ah-select" type="text" placeholder="e.g. SAP FICO — Accounts Payable" value={sapModule} onChange={e => setSapModule(e.target.value)} />
          </div>

          {/* Chip inputs */}
          <ChipInput
            label="Systems for Integration"
            values={systemsForIntegration}
            onChange={setSystemsForIntegration}
            placeholder="e.g. SAP FICO — press Enter"
          />
          <ChipInput
            label="Key Processes"
            values={processes}
            onChange={setProcesses}
            placeholder="e.g. Invoice Validation — press Enter"
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ah-add-btn" style={{ flex: 1 }} onClick={() => { void handleSubmit() }} disabled={saving}>
              <Icon name={saving ? 'bi-hourglass-split' : isEdit ? 'bi-check-lg' : 'bi-collection-fill'} />
              {saving ? ' Saving…' : isEdit ? ' Save Changes' : ' Add Use Case'}
            </button>
            <button className="ah-pill-btn" onClick={onClose} disabled={saving}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
