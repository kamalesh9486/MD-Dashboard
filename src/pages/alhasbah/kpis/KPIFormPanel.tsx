import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import { AH_AGENTS_MUT, type AHKPI, type AHDivision, type AHKPIStatus, type AHTrend, addKPI } from '../data'

interface Props {
  onClose: () => void
  onSaved: (name: string) => void
}

export default function KPIFormPanel({ onClose, onSaved }: Props) {
  useScrollLock()

  const [agentId,              setAgentId]             = useState(AH_AGENTS_MUT[0]?.id ?? '')
  const [kpiFunction,          setKpiFunction]         = useState('')
  const [kpiName,              setKpiName]             = useState('')
  const [kpiDefinition,        setKpiDefinition]       = useState('')
  const [unit,                 setUnit]                = useState<AHKPI['unit']>('%')
  const [targetValue,          setTargetValue]         = useState('')
  const [currentValue,         setCurrentValue]        = useState('')
  const [status,               setStatus]              = useState<AHKPIStatus>('at_risk')
  const [trend,                setTrend]               = useState<AHTrend>('flat')
  const [trendDelta,           setTrendDelta]          = useState('0')
  const [frequency,            setFrequency]           = useState<AHKPI['frequency']>('monthly')
  const [owner,                setOwner]               = useState('')
  const [kpiFamily,            setKpiFamily]           = useState('')
  const [scope,                setScope]               = useState<AHKPI['scope']>('division')
  const [achievable,           setAchievable]          = useState<AHKPI['achievable']>('yes')
  const [notAchievableReason,  setNotAchievableReason] = useState('')
  const [lowerIsBetter,        setLowerIsBetter]       = useState(false)
  const [lastMeasured,         setLastMeasured]        = useState(new Date().toISOString().slice(0, 10))
  const [error, setError] = useState('')

  const agent    = AH_AGENTS_MUT.find(a => a.id === agentId)
  const division = (agent?.division ?? 'HR') as AHDivision

  function validate() {
    if (!kpiName.trim())       { setError('KPI name is required'); return false }
    if (!kpiFunction.trim())   { setError('Function is required'); return false }
    if (!kpiDefinition.trim()) { setError('KPI definition is required'); return false }
    if (!owner.trim())         { setError('Owner is required'); return false }
    if (!kpiFamily.trim())     { setError('KPI family is required'); return false }
    return true
  }

  function handleSubmit() {
    if (!validate()) return
    addKPI({
      agentId,
      division,
      function: kpiFunction.trim(),
      kpiName: kpiName.trim(),
      kpiDefinition: kpiDefinition.trim(),
      unit,
      targetValue:  Number(targetValue)  || 0,
      currentValue: Number(currentValue) || 0,
      status,
      trend,
      trendDelta: Number(trendDelta) || 0,
      frequency,
      owner: owner.trim(),
      history: [],
      lowerIsBetter,
      kpiFamily: kpiFamily.trim(),
      scope,
      achievable,
      notAchievableReason: achievable === 'no' ? notAchievableReason.trim() : undefined,
      lastMeasured,
    })
    onSaved(kpiName.trim())
    onClose()
  }

  return (
    <>
      <div className="ah-panel-backdrop" onClick={onClose} />
      <div className="ah-panel ah-form-panel-540">
        {/* Header */}
        <div className="ah-panel-head">
          <button className="ah-panel-close" onClick={onClose}><Icon name="bi-x-lg" /></button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Add New KPI</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>Register a new KPI in the Al Hasbah programme</div>
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
              {AH_AGENTS_MUT.map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.division})</option>
              ))}
            </select>
          </div>

          {/* Function + KPI Name */}
          <div className="ah-form-group">
            <label className="ah-form-label">Business Function *</label>
            <input className="ah-select" type="text" placeholder="e.g. Accounts Payable" value={kpiFunction} onChange={e => { setKpiFunction(e.target.value); setError('') }} />
          </div>
          <div className="ah-form-group">
            <label className="ah-form-label">KPI Name *</label>
            <input className="ah-select" type="text" placeholder="e.g. Invoice Auto-Match Rate" value={kpiName} onChange={e => { setKpiName(e.target.value); setError('') }} />
          </div>
          <div className="ah-form-group">
            <label className="ah-form-label">KPI Definition *</label>
            <textarea
              className="ah-select"
              style={{ minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="What this KPI measures and how it is calculated…"
              value={kpiDefinition}
              onChange={e => { setKpiDefinition(e.target.value); setError('') }}
            />
          </div>

          {/* Unit + Frequency */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Unit</label>
              <select className="ah-select" value={unit} onChange={e => setUnit(e.target.value as AHKPI['unit'])}>
                <option value="%">%</option>
                <option value="hours">hours</option>
                <option value="AED">AED</option>
                <option value="days">days</option>
                <option value="count">count</option>
              </select>
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Measurement Frequency</label>
              <select className="ah-select" value={frequency} onChange={e => setFrequency(e.target.value as AHKPI['frequency'])}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          {/* Target + Current values */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Target Value</label>
              <input className="ah-select" type="number" placeholder="0" value={targetValue} onChange={e => setTargetValue(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Current Value</label>
              <input className="ah-select" type="number" placeholder="0" value={currentValue} onChange={e => setCurrentValue(e.target.value)} />
            </div>
          </div>

          {/* Lower is better toggle */}
          <div className="ah-form-group" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setLowerIsBetter(v => !v)}>
            <div style={{
              width: 20, height: 20, borderRadius: 4,
              border: `2px solid ${lowerIsBetter ? '#007560' : 'var(--border)'}`,
              background: lowerIsBetter ? '#007560' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '.15s',
            }}>
              {lowerIsBetter && <Icon name="bi-check" style={{ color: '#fff', fontSize: 12 }} />}
            </div>
            <span style={{ fontSize: 13, color: 'var(--text)' }}>Lower is better (e.g. processing time, error rate)</span>
          </div>

          {/* Status + Trend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Status</label>
              <select className="ah-select" value={status} onChange={e => setStatus(e.target.value as AHKPIStatus)}>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
              </select>
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Trend</label>
              <select className="ah-select" value={trend} onChange={e => setTrend(e.target.value as AHTrend)}>
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="flat">Flat</option>
              </select>
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Trend Delta</label>
              <input className="ah-select" type="number" step="0.1" placeholder="0" value={trendDelta} onChange={e => setTrendDelta(e.target.value)} />
            </div>
          </div>

          {/* KPI Family + Scope */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">KPI Family *</label>
              <input className="ah-select" type="text" placeholder="e.g. Efficiency" value={kpiFamily} onChange={e => { setKpiFamily(e.target.value); setError('') }} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Scope</label>
              <select className="ah-select" value={scope} onChange={e => setScope(e.target.value as AHKPI['scope'])}>
                <option value="enterprise">Enterprise</option>
                <option value="division">Division</option>
                <option value="department">Department</option>
              </select>
            </div>
          </div>

          {/* Owner + Last Measured */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">KPI Owner *</label>
              <input className="ah-select" type="text" placeholder="Full name" value={owner} onChange={e => { setOwner(e.target.value); setError('') }} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Last Measured</label>
              <input className="ah-select" type="date" value={lastMeasured} onChange={e => setLastMeasured(e.target.value)} />
            </div>
          </div>

          {/* Achievability */}
          <div className="ah-form-group">
            <label className="ah-form-label">Achievability</label>
            <select className="ah-select" value={achievable} onChange={e => setAchievable(e.target.value as AHKPI['achievable'])}>
              <option value="yes">Yes — achievable within current plan</option>
              <option value="partial">Partial — achievable with additional effort</option>
              <option value="no">No — not achievable in current period</option>
            </select>
          </div>
          {achievable === 'no' && (
            <div className="ah-form-group">
              <label className="ah-form-label">Reason for Not Achievable</label>
              <textarea
                className="ah-select"
                style={{ minHeight: 70, resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Explain why this KPI target cannot be achieved and what would need to change…"
                value={notAchievableReason}
                onChange={e => setNotAchievableReason(e.target.value)}
              />
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ah-add-btn" style={{ flex: 1 }} onClick={handleSubmit}>
              <Icon name="bi-graph-up" /> Add KPI
            </button>
            <button className="ah-pill-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
