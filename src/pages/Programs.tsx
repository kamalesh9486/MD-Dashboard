import { useState, useMemo, useEffect } from 'react'
import { type Program, type ProgramStatus } from './prog/data'
import { Cr978_coe_programsService, Cr978_coe_eventsesService } from '../generated'
import type { Cr978_coe_programs, Cr978_coe_programsBase } from '../generated/models/Cr978_coe_programsModel'
import '../programs.css'
import Icon from '../components/Icon'
import { useScrollLock } from '../hooks/useScrollLock'
import DataSourceBadge from '../components/DataSourceBadge'

// ── Map Dataverse record → Program ───────────────────────────
function mapToProgram(r: Cr978_coe_programs): Program {
  const statusName = r.cr978_coe_programstatusname
  let status: ProgramStatus = 'Active'
  if (statusName === 'Completed') status = 'Completed'
  else if (statusName === 'Pending') status = 'Upcoming'
  return {
    id:                r.cr978_coe_programid,
    name:              r.cr978_coe_title,
    description:       r.cr978_coe_description ?? '',
    startDate:         r.cr978_coe_startdate ?? '',
    endDate:           r.cr978_coe_enddate ?? '',
    status,
    ownerDivision:     r.cr978_coe_divisionname ?? '',
    eventCount:        0,
    objectives:        [],
    targetAudience:    r.cr978_coe_programownername ?? '',
    totalParticipants: 0,
  }
}

interface Props {
  onNavigateToEvents: (program?: Program) => void
}

// ── Helpers ──────────────────────────────────────────────────
function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
// ── Status helpers ───────────────────────────────────────────
function statusClass(s: ProgramStatus) {
  return s === 'Active' ? 'active' : s === 'Completed' ? 'completed' : 'upcoming'
}
function borderClass(s: ProgramStatus) {
  return s === 'Active' ? 'prog-card-border-active' : s === 'Completed' ? 'prog-card-border-completed' : 'prog-card-border-upcoming'
}

// ── StatusBadge ──────────────────────────────────────────────
function StatusBadge({ status }: { status: ProgramStatus }) {
  return (
    <span className={`prog-badge prog-badge-${statusClass(status)}`}>
      <span className="prog-badge-dot" />{status}
    </span>
  )
}

// ── Program Card ─────────────────────────────────────────────
function ProgramCard({ program, onViewDetails }: { program: Program; onViewDetails: (p: Program) => void }) {
  return (
    <div className={`prog-card ${borderClass(program.status)}`}>
      <div className="prog-card-head">
        <StatusBadge status={program.status} />
        <span className="prog-card-div-tag">{program.ownerDivision}</span>
      </div>
      <div className="prog-card-body">
        <div className="prog-card-name">{program.name}</div>
        <div className="prog-card-desc">{program.description}</div>
      </div>
      <div className="prog-card-meta">
        <div className="prog-card-meta-row">
          <Icon name="bi-calendar3" />
          <span>{formatDateShort(program.startDate)} – {formatDateShort(program.endDate)}</span>
        </div>
        <div className="prog-card-meta-row">
          <Icon name="bi-calendar-event" />
          <strong>{program.eventCount}</strong>
          <span>{program.eventCount === 1 ? 'event' : 'events'}</span>
          {program.totalParticipants > 0 && (
            <>
              <Icon name="bi-dot" style={{ color: '#d1d5db' }} />
              <Icon name="bi-people" />
              <strong>{program.totalParticipants.toLocaleString()}</strong>
              <span>participants</span>
            </>
          )}
        </div>
      </div>
      <div className="prog-card-footer">
        <button className="prog-view-btn" onClick={() => onViewDetails(program)}>
          View Details <Icon name="bi-arrow-right" />
        </button>
      </div>
    </div>
  )
}


// ── Add Program Modal ─────────────────────────────────────────
interface AddProgramForm {
  name: string
  description: string
  startDate: string
  endDate: string
  division: string
  owner: string
}
const EMPTY_FORM: AddProgramForm = { name: '', description: '', startDate: '', endDate: '', division: '', owner: '' }

function AddProgramModal({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (p: Program) => void
}) {
  useScrollLock()
  const [form, setForm] = useState<AddProgramForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<AddProgramForm>>({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function setField(field: keyof AddProgramForm, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  function validate(): Partial<AddProgramForm> {
    const e: Partial<AddProgramForm> = {}
    if (!form.name.trim())     e.name = 'Program name is required'
    if (!form.startDate)       e.startDate = 'Start date is required'
    if (!form.endDate)         e.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'End date must be after start date'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    setSubmitError('')
    try {
      // ownerid/owneridtype are omitted — the PowerApps SDK injects the current
      // user automatically. Passing an empty string causes Dataverse to reject the record.
      const payload = {
        cr978_coe_title:       form.name.trim(),
        cr978_coe_description: form.description.trim() || undefined,
        cr978_coe_startdate:   form.startDate || undefined,
        cr978_coe_enddate:     form.endDate || undefined,
        statecode: 0 as Cr978_coe_programsBase['statecode'],
      } as Omit<Cr978_coe_programsBase, 'cr978_coe_programid'>
      const result = await Cr978_coe_programsService.create(payload)
      if (!result.data) {
        setSubmitError('Dataverse did not return the created record. Please try again.')
        setSaving(false)
        return
      }
      onCreated(mapToProgram(result.data))
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setSubmitError(`Failed to save program: ${msg}`)
      setSaving(false)
    }
  }

  const inputStyle = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: `1px solid ${err ? '#dc2626' : '#e5e7eb'}`, outline: 'none',
    background: '#fff', color: '#111827', boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  })
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 700, color: '#374151',
    textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5, display: 'block',
  }
  const errStyle: React.CSSProperties = { fontSize: 11, color: '#dc2626', marginTop: 4 }
  const fieldWrap: React.CSSProperties = { display: 'flex', flexDirection: 'column' }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--dewa-navy) 0%, #004937 100%)' }}>
          <div className="modal-header-info">
            <div className="modal-title" style={{ color: '#fff' }}>New Program</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
              Fill in the details below to add a new program to Dataverse
            </div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="bi-x-lg" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ gap: 16 }}>

            {/* Program Name */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Program Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input
                style={inputStyle(errors.name)}
                placeholder="e.g. AI Adoption Wave 3"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
              />
              {errors.name && <span style={errStyle}><Icon name="bi-exclamation-circle" /> {errors.name}</span>}
            </div>

            {/* Description */}
            <div style={fieldWrap}>
              <label style={labelStyle}>Description</label>
              <textarea
                style={{ ...inputStyle(), resize: 'vertical', minHeight: 72, lineHeight: 1.55 }}
                placeholder="Brief overview of the program's goals and scope…"
                value={form.description}
                onChange={e => setField('description', e.target.value)}
              />
            </div>

            {/* Dates */}
            <div className="form-2-grid">
              <div style={fieldWrap}>
                <label style={labelStyle}>Start Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="date" style={inputStyle(errors.startDate)}
                  value={form.startDate}
                  onChange={e => setField('startDate', e.target.value)}
                />
                {errors.startDate && <span style={errStyle}><Icon name="bi-exclamation-circle" /> {errors.startDate}</span>}
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>End Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="date" style={inputStyle(errors.endDate)}
                  value={form.endDate}
                  onChange={e => setField('endDate', e.target.value)}
                />
                {errors.endDate && <span style={errStyle}><Icon name="bi-exclamation-circle" /> {errors.endDate}</span>}
              </div>
            </div>

            {/* Division & Owner */}
            <div className="form-2-grid">
              <div style={fieldWrap}>
                <label style={labelStyle}>Division</label>
                <input
                  style={inputStyle()}
                  placeholder="e.g. Digital Transformation"
                  value={form.division}
                  onChange={e => setField('division', e.target.value)}
                />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Target Audience / Owner</label>
                <input
                  style={inputStyle()}
                  placeholder="e.g. All DEWA Staff"
                  value={form.owner}
                  onChange={e => setField('owner', e.target.value)}
                />
              </div>
            </div>

            {/* Submit error */}
            {submitError && (
              <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="bi-exclamation-triangle-fill" /> {submitError}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f3f4f6' }}>
              <button
                type="button" onClick={onClose} disabled={saving}
                style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                Cancel
              </button>
              <button
                type="submit" disabled={saving}
                style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--dewa-navy)', color: '#fff', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.75 : 1 }}
              >
                {saving
                  ? <><Icon name="bi-arrow-repeat" style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</>
                  : <><Icon name="bi-plus-circle" /> Create Program</>}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function Programs({ onNavigateToEvents }: Props) {
  const [programs,     setPrograms]     = useState<Program[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)
  const [totalEvents,  setTotalEvents]  = useState(0)
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | 'All'>('All')
  const [divFilter,    setDivFilter]    = useState('All')
  const [yearFilter,   setYearFilter]   = useState('All')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    let active = true
    Cr978_coe_programsService.getAll()
      .then(result => {
        if (!active) return
        if (result.data) setPrograms(result.data.map(mapToProgram))
      })
      .catch((err: unknown) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Programs] Failed to load programs:', msg)
        setError('Failed to load programs from Dataverse.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    Cr978_coe_eventsesService.getAll()
      .then(result => {
        if (!active || !result.data) return
        setTotalEvents(result.data.length)
        const countMap = new Map<string, number>()
        for (const ev of result.data) {
          const pid = ev._cr978_coe_program_value
          if (pid) countMap.set(pid, (countMap.get(pid) ?? 0) + 1)
        }
        setPrograms(prev => prev.map(p => ({ ...p, eventCount: countMap.get(p.id) ?? 0 })))
      })
      .catch((err: unknown) => {
        if (!active) return
        const msg = err instanceof Error ? err.message : String(err)
        console.error('[Programs] Failed to load event counts:', msg)
      })
    return () => { active = false }
  }, [])

  const divisions = ['All', ...Array.from(new Set(programs.map(p => p.ownerDivision))).sort()]
  const years     = ['All', '2025', '2026', '2027']

  const activeCount    = programs.filter(p => p.status === 'Active').length
  const completedCount = programs.filter(p => p.status === 'Completed').length
  const upcomingCount  = programs.filter(p => p.status === 'Upcoming').length

  const filtered = useMemo(() => {
    return programs.filter(p => {
      const matchS = statusFilter === 'All' || p.status === statusFilter
      const matchD = divFilter    === 'All' || p.ownerDivision === divFilter
      const matchY = yearFilter   === 'All' ||
        p.startDate.startsWith(yearFilter) || p.endDate.startsWith(yearFilter)
      return matchS && matchD && matchY
    })
  }, [statusFilter, divFilter, yearFilter, programs])

  return (
    <div>
      {error && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>Programs</h1>
          <p>AI initiatives and programs across all DEWA divisions</p>
          <DataSourceBadge type="simulated" title="Manually seeded data" lastUpdated="10 May 2026" />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 9, border: 'none', background: 'var(--dewa-navy)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,117,96,0.18)', transition: 'opacity 0.18s' }}
          onMouseOver={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseOut={e => (e.currentTarget.style.opacity = '1')}
        >
          <Icon name="bi-plus-circle" /> New Program
        </button>
      </div>

      {/* KPI strip */}
      <div className="kpi-4-grid" style={{ gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Programs', value: programs.length, icon: 'bi-folder2-open',       bg: 'rgba(0,117,96,0.08)',   color: '#007560' },
          { label: 'Active',          value: activeCount,     icon: 'bi-play-circle-fill',   bg: 'rgba(202,138,4,0.12)', color: '#b07d10' },
          { label: 'Completed',       value: completedCount,  icon: 'bi-check-circle-fill',  bg: 'rgba(0,117,96,0.1)',   color: '#007560' },
          { label: 'Upcoming',        value: upcomingCount,   icon: 'bi-clock-fill',          bg: 'rgba(0,73,55,0.1)',   color: '#004937' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <Icon name={s.icon} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigate to Events banner */}
      <div className="prog-events-banner">
        <div className="prog-events-banner-text">
          <strong>Events Calendar</strong>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 800, fontSize: 15 }}>{totalEvents}</span>
            {totalEvents > 0 ? ' events' : ' events loading…'} scheduled across all programs — workshops, seminars, hackathons &amp; webinars
          </span>
        </div>
        <button className="prog-events-banner-btn" onClick={() => onNavigateToEvents()}>
          <Icon name="bi-calendar-event" /> Browse All Events
        </button>
      </div>

      {/* Filter bar */}
      <div className="prog-filter-bar">
        <div className="prog-status-pills">
          {(['All', 'Active', 'Completed', 'Upcoming'] as (ProgramStatus | 'All')[]).map(s => (
            <button
              key={s}
              className={`prog-pill${statusFilter === s ? ' active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <select className="prog-select" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
          {divisions.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="prog-select" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y === 'All' ? 'All Years' : y}</option>)}
        </select>
        <span className="prog-result-count">
          Showing {filtered.length} of {programs.length} programs
        </span>
      </div>

      {/* Programs grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <Icon name="bi-arrow-repeat" style={{ fontSize: 28, marginBottom: 10 }} />
          Loading programs…
        </div>
      ) : filtered.length > 0 ? (
        <div className="prog-grid">
          {filtered.map(p => (
            <ProgramCard key={p.id} program={p} onViewDetails={onNavigateToEvents} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', color: '#9ca3af' }}>
          <Icon name="bi-folder2" style={{ fontSize: 32, marginBottom: 10 }} />
          No programs match the current filters
        </div>
      )}

      {/* Add program modal */}
      {showAddModal && (
        <AddProgramModal
          onClose={() => setShowAddModal(false)}
          onCreated={newProgram => setPrograms(prev => [newProgram, ...prev])}
        />
      )}
    </div>
  )
}

