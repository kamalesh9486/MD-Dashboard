import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { type AHUseCase, type AHDivision, type AHStatus, type AHMeasurementType, type AHMilestone } from '../data'
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

  const initialAgent = agents.find(a => a.id === uc?.agentId)
  const [division,             setDivision]            = useState<AHDivision>(uc?.division ?? initialAgent?.division ?? 'HR')
  const [agentId,              setAgentId]             = useState(uc?.agentId ?? '')
  const [name,                 setName]                = useState(uc?.name ?? '')
  const [domain,               setDomain]              = useState(uc?.domain ?? '')
  const [status,               setStatus]              = useState<AHStatus>(uc?.status ?? 'planned')
  const [startDate,            setStartDate]           = useState(uc?.startDate ?? '')
  const [plannedGoLive,        setPlannedGoLive]       = useState(uc?.plannedGoLive ?? '')
  const [actualGoLive,         setActualGoLive]        = useState(uc?.actualGoLive ?? '')
  const [targetEndDate,        setTargetEndDate]       = useState(uc?.targetEndDate ?? '')
  const [annualVolume,         setAnnualVolume]        = useState(String(uc?.annualVolume ?? '0'))
  const [expectedEfficiency,   setExpectedEfficiency]  = useState(String(uc?.expectedEfficiency ?? '0'))
  const [fteAvoidance,         setFteAvoidance]        = useState(String(uc?.fteAvoidance ?? ''))
  const [measurementType,      setMeasurementType]     = useState<AHMeasurementType>(uc?.measurementType ?? '')
  const [targetCostSaving,     setTargetCostSaving]    = useState(String(uc?.targetCostSaving ?? ''))
  const [description,          setDescription]         = useState(uc?.description ?? '')
  const [sapModule,            setSapModule]           = useState(uc?.sapModule ?? '')
  const [systemsForIntegration, setSystemsForIntegration] = useState<string[]>(uc?.systemsForIntegration ?? [])
  const [currentState,         setCurrentState]        = useState(uc?.currentState ?? '')
  const [futureState,          setFutureState]         = useState(uc?.futureState ?? '')
  const [processes,            setProcesses]           = useState<string[]>(uc?.processes ?? [])
  const [totalDevelopmentEffort, setTotalDevelopmentEffort] = useState(String(uc?.totalDevelopmentEffort ?? '0'))
  const [adoptionActual,       setAdoptionActual]      = useState(String(uc?.adoptionActual ?? ''))
  const [milestones,           setMilestones]          = useState<AHMilestone[]>(
    uc?.milestones ?? [
      { name: 'Design',      status: 'pending' },
      { name: 'Development', status: 'pending' },
      { name: 'UAT',         status: 'pending' },
      { name: 'Go-Live',     status: 'pending' },
    ],
  )
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  function updateMilestone(i: number, patch: Partial<AHMilestone>) {
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, ...patch } : m))
  }
  function addMilestone() {
    setMilestones(ms => [...ms, { name: '', status: 'pending' }])
  }
  function removeMilestone(i: number) {
    setMilestones(ms => ms.filter((_, idx) => idx !== i))
  }

  const divisionAgents = agents.filter(a => a.division === division)

  function validate() {
    if (!name.trim())        { setError('Use case name is required'); return false }
    if (!agentId)            { setError('Please select an AI agent'); return false }
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
      startDate:     startDate || undefined,
      plannedGoLive,
      actualGoLive: actualGoLive || undefined,
      targetEndDate: targetEndDate || undefined,
      annualVolume:           Number(annualVolume)           || 0,
      expectedEfficiency:     Number(expectedEfficiency)     || 0,
      fteAvoidance:  fteAvoidance ? Number(fteAvoidance) : undefined,
      targetCostSaving:       Number(targetCostSaving)       || 0,
      measurementType: measurementType || undefined,
      description: description.trim(),
      sapModule:   sapModule.trim(),
      systemsForIntegration,
      currentState:  currentState.trim(),
      futureState:   futureState.trim(),
      processes,
      totalDevelopmentEffort: Number(totalDevelopmentEffort) || 0,
      adoptionActual: adoptionActual ? Number(adoptionActual) : undefined,
      milestones: milestones.filter(m => m.name.trim()),
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

          {/* Division + Agent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Division *</label>
              <select
                className="ah-select"
                value={division}
                onChange={e => { setDivision(e.target.value as AHDivision); setAgentId('') }}
              >
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Billing">Billing</option>
              </select>
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Linked AI Agent *</label>
              <select className="ah-select" value={agentId} onChange={e => { setAgentId(e.target.value); setError('') }}>
                <option value="">{divisionAgents.length ? 'Select an agent…' : `No agents in ${division}`}</option>
                {divisionAgents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
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
              <label className="ah-form-label">Start Date</label>
              <input className="ah-select" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Planned Go-Live</label>
              <input className="ah-select" type="date" value={plannedGoLive} onChange={e => setPlannedGoLive(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Actual Go-Live</label>
              <input className="ah-select" type="date" value={actualGoLive} onChange={e => setActualGoLive(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Target End Date</label>
              <input className="ah-select" type="date" value={targetEndDate} onChange={e => setTargetEndDate(e.target.value)} />
            </div>
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
              <label className="ah-form-label">Dev Effort (mandays)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={totalDevelopmentEffort} onChange={e => setTotalDevelopmentEffort(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">FTE Avoidance</label>
              <input className="ah-select" type="number" min="0" step="0.1" placeholder="e.g. 2.5" value={fteAvoidance} onChange={e => setFteAvoidance(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Measurement Type</label>
              <select className="ah-select" value={measurementType} onChange={e => setMeasurementType(e.target.value as AHMeasurementType)}>
                <option value="">Select…</option>
                <option value="Requests">Requests</option>
                <option value="Transactions">Transactions</option>
                <option value="Device">Device</option>
                <option value="Systems">Systems</option>
              </select>
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

          {/* Milestones */}
          <div className="ah-form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="ah-form-label" style={{ marginBottom: 0 }}>Milestones</label>
              <button type="button" className="ah-pill-btn" style={{ fontSize: 11, padding: '3px 10px' }} onClick={addMilestone}>
                <Icon name="bi-plus-lg" /> Add Milestone
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 120px 28px', gap: 6, alignItems: 'center' }}>
                  <input
                    className="ah-select" type="text" placeholder="Milestone name"
                    value={m.name}
                    onChange={e => updateMilestone(i, { name: e.target.value })}
                  />
                  <input
                    className="ah-select" type="date"
                    value={m.plannedDate ?? ''}
                    onChange={e => updateMilestone(i, { plannedDate: e.target.value })}
                  />
                  <select
                    className="ah-select"
                    value={m.status}
                    onChange={e => updateMilestone(i, { status: e.target.value as AHMilestone['status'] })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    aria-label="Remove milestone"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 14, padding: 4 }}
                  >
                    <Icon name="bi-trash" />
                  </button>
                </div>
              ))}
              {milestones.length === 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>No milestones added.</div>
              )}
            </div>
          </div>

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
