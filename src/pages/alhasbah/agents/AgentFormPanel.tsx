import { useState } from 'react'
import Icon from '../../../components/Icon'
import { useScrollLock } from '../../../hooks/useScrollLock'
import {
  type AHAgent, type AHDivision, type AHStatus,
  addAgent, updateAgent,
} from '../data'

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
  agent?: AHAgent   // present → edit mode; absent → add mode
  onClose: () => void
  onSaved: (name: string) => void
}

export default function AgentFormPanel({ agent, onClose, onSaved }: Props) {
  useScrollLock()
  const isEdit = !!agent

  const [name,               setName]               = useState(agent?.name ?? '')
  const [division,           setDivision]           = useState<AHDivision>(agent?.division ?? 'HR')
  const [status,             setStatus]             = useState<AHStatus>(agent?.status ?? 'planned')
  const [businessOwner,      setBusinessOwner]      = useState(agent?.businessOwner ?? '')
  const [targetEndUsers,     setTargetEndUsers]     = useState(agent?.targetEndUsers ?? '')
  const [description,        setDescription]        = useState(agent?.description ?? '')
  const [targetCostSaving,   setTargetCostSaving]   = useState(String(agent?.targetCostSaving ?? ''))
  const [fteSavingsTarget,   setFteSavingsTarget]   = useState(String(agent?.fteSavingsTarget ?? ''))
  const [annualTransactions, setAnnualTransactions] = useState(String(agent?.annualTransactions ?? '0'))
  const [aiAdoptionPct,      setAiAdoptionPct]      = useState(String(agent?.aiAdoptionPct ?? '0'))
  const [ptuUsage,           setPtuUsage]           = useState(String(agent?.ptuUsage ?? '0'))
  const [totalUseCases,      setTotalUseCases]      = useState(String(agent?.totalUseCases ?? '0'))
  const [liveUseCases,       setLiveUseCases]       = useState(String(agent?.liveUseCases ?? '0'))
  const [openIncidents,      setOpenIncidents]      = useState(String(agent?.openIncidents ?? '0'))
  const [modelsUsed,         setModelsUsed]         = useState<string[]>(agent?.modelsUsed ?? [])
  const [systemsIntegrated,  setSystemsIntegrated]  = useState<string[]>(agent?.systemsIntegrated ?? [])
  const [mcpServers,         setMcpServers]         = useState<string[]>(agent?.mcpServers ?? [])
  const [aiTools,            setAiTools]            = useState<string[]>(agent?.aiTools ?? [])
  const [error, setError] = useState('')

  function validate() {
    if (!name.trim())          { setError('Agent name is required'); return false }
    if (!businessOwner.trim()) { setError('Business owner is required'); return false }
    if (!description.trim())   { setError('Description is required'); return false }
    return true
  }

  function handleSubmit() {
    if (!validate()) return
    const payload = {
      name: name.trim(),
      division,
      status,
      businessOwner:     businessOwner.trim(),
      targetEndUsers:    targetEndUsers.trim(),
      description:       description.trim(),
      targetCostSaving:  Number(targetCostSaving)  || 0,
      fteSavingsTarget:  Number(fteSavingsTarget)   || 0,
      annualTransactions: Number(annualTransactions) || 0,
      aiAdoptionPct:     Number(aiAdoptionPct)      || 0,
      ptuUsage:          Number(ptuUsage)           || 0,
      totalUseCases:     Number(totalUseCases)      || 0,
      liveUseCases:      Number(liveUseCases)       || 0,
      openIncidents:     Number(openIncidents)      || 0,
      modelsUsed,
      systemsIntegrated,
      mcpServers,
      aiTools,
    }
    if (isEdit) {
      updateAgent(agent.id, payload)
    } else {
      addAgent(payload)
    }
    onSaved(name.trim())
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
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
              {isEdit ? 'Edit AI Agent' : 'Add New AI Agent'}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>
              {isEdit
                ? `Editing: ${agent.name}`
                : 'Register a new agent in the Al Hasbah portfolio'}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="ah-panel-body">
          {error && (
            <div style={{
              marginBottom: 14, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(220,38,38,0.08)', color: '#dc2626',
              fontSize: 12, border: '1px solid rgba(220,38,38,0.2)',
            }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div className="ah-form-group">
            <label className="ah-form-label">Agent Name *</label>
            <input
              className="ah-select" type="text"
              placeholder="e.g. Vendor Invoice Processor"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
            />
          </div>

          {/* Division + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Division *</label>
              <select className="ah-select" value={division} onChange={e => setDivision(e.target.value as AHDivision)}>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Billing">Billing</option>
              </select>
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Status *</label>
              <select className="ah-select" value={status} onChange={e => setStatus(e.target.value as AHStatus)}>
                <option value="planned">Planned</option>
                <option value="pipeline">In Pipeline</option>
                <option value="live">Live</option>
              </select>
            </div>
          </div>

          {/* Business Owner + Target Users */}
          <div className="ah-form-group">
            <label className="ah-form-label">Business Owner *</label>
            <input
              className="ah-select" type="text"
              placeholder="Full name"
              value={businessOwner}
              onChange={e => { setBusinessOwner(e.target.value); setError('') }}
            />
          </div>
          <div className="ah-form-group">
            <label className="ah-form-label">Target End Users</label>
            <input
              className="ah-select" type="text"
              placeholder="e.g. AP Team, Procurement Officers"
              value={targetEndUsers}
              onChange={e => setTargetEndUsers(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="ah-form-group">
            <label className="ah-form-label">Description *</label>
            <textarea
              className="ah-select"
              style={{ minHeight: 80, resize: 'vertical', fontFamily: 'inherit' }}
              placeholder="What this agent does and its business value…"
              value={description}
              onChange={e => { setDescription(e.target.value); setError('') }}
            />
          </div>

          {/* Financial + operational targets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="ah-form-group">
              <label className="ah-form-label">Target Cost Saving (AED)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={targetCostSaving} onChange={e => setTargetCostSaving(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">FTE Hrs / yr Target</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={fteSavingsTarget} onChange={e => setFteSavingsTarget(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Annual Transactions</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={annualTransactions} onChange={e => setAnnualTransactions(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">AI Adoption %</label>
              <input className="ah-select" type="number" min="0" max="100" placeholder="0" value={aiAdoptionPct} onChange={e => setAiAdoptionPct(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">PTU Usage (tokens/mo)</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={ptuUsage} onChange={e => setPtuUsage(e.target.value)} />
            </div>
            <div className="ah-form-group">
              <label className="ah-form-label">Open Incidents</label>
              <input className="ah-select" type="number" min="0" placeholder="0" value={openIncidents} onChange={e => setOpenIncidents(e.target.value)} />
            </div>
            <div className="ah-form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="ah-form-label">Total Use Cases / Live Use Cases</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="ah-select" type="number" min="0" placeholder="Total" value={totalUseCases} onChange={e => setTotalUseCases(e.target.value)} style={{ flex: 1 }} />
                <input className="ah-select" type="number" min="0" placeholder="Live"  value={liveUseCases}  onChange={e => setLiveUseCases(e.target.value)}  style={{ flex: 1 }} />
              </div>
            </div>
          </div>

          {/* Chip inputs */}
          <ChipInput
            label="AI Models Used"
            values={modelsUsed}
            onChange={setModelsUsed}
            placeholder="e.g. Claude Sonnet 4.5 — press Enter"
          />
          <ChipInput
            label="Systems Integrated"
            values={systemsIntegrated}
            onChange={setSystemsIntegrated}
            placeholder="e.g. SAP FICO — press Enter"
          />
          <ChipInput
            label="MCP Servers"
            values={mcpServers}
            onChange={setMcpServers}
            placeholder="e.g. MCP-SAP-FICO — press Enter"
          />
          <ChipInput
            label="AI Tools / SDKs"
            values={aiTools}
            onChange={setAiTools}
            placeholder="e.g. Anthropic SDK — press Enter"
          />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="ah-add-btn" style={{ flex: 1 }} onClick={handleSubmit}>
              <Icon name={isEdit ? 'bi-check-lg' : 'bi-robot'} />
              {isEdit ? ' Save Changes' : ' Add Agent'}
            </button>
            <button className="ah-pill-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </>
  )
}
