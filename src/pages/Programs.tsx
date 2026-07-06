import { useState, useMemo, useEffect } from 'react'
import { type Program, type ProgramStatus } from './prog/data'
import { Cr978_coe_programsService, Cr978_coe_eventsesService } from '../generated'
import type { Cr978_coe_programs, Cr978_coe_programsBase } from '../generated/models/Cr978_coe_programsModel'
import '../programs.css'
import Icon from '../components/Icon'
import { useScrollLock } from '../hooks/useScrollLock'
import DataSourceBadge from '../components/DataSourceBadge'
import ProgramDetailPanel, { dateProgress } from './prog/ProgramDetailPanel'
import LensBriefing from '../components/LensBriefing'

// ── Dataverse → Program ───────────────────────────────────────
function mapToProgram(r: Cr978_coe_programs): Program {
  const sn = r.cr978_coe_programstatusname
  let status: ProgramStatus = 'Active'
  if (sn === 'Completed') status = 'Completed'
  else if (sn === 'Pending') status = 'Upcoming'
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

interface Props { onNavigateToEvents: (program?: Program) => void }

function fmtShort(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusCls(s: ProgramStatus) {
  return s === 'Active' ? 'active' : s === 'Completed' ? 'completed' : 'upcoming'
}

function StatusBadge({ status }: { status: ProgramStatus }) {
  return (
    <span className={`prog-badge prog-badge-${statusCls(status)}`}>
      <span className="prog-badge-dot" />{status}
    </span>
  )
}

// ── Board-view card (kept for board toggle) ───────────────────
function ProgramCard({ program: p, onViewDetails }: { program: Program; onViewDetails: (p: Program) => void }) {
  const bdr = p.status === 'Active' ? 'prog-card-border-active' : p.status === 'Completed' ? 'prog-card-border-completed' : 'prog-card-border-upcoming'
  return (
    <div className={`prog-card ${bdr}`}>
      <div className="prog-card-head">
        <StatusBadge status={p.status} />
        <span className="prog-card-div-tag">{p.ownerDivision}</span>
      </div>
      <div className="prog-card-body">
        <div className="prog-card-name">{p.name}</div>
        <div className="prog-card-desc">{p.description}</div>
      </div>
      <div className="prog-card-meta">
        <div className="prog-card-meta-row">
          <Icon name="bi-calendar3" />
          <span>{fmtShort(p.startDate)} – {fmtShort(p.endDate)}</span>
        </div>
        <div className="prog-card-meta-row">
          <Icon name="bi-calendar-event" />
          <strong>{p.eventCount}</strong>
          <span>{p.eventCount === 1 ? 'event' : 'events'}</span>
        </div>
      </div>
      <div className="prog-card-footer">
        <button className="prog-view-btn" onClick={() => onViewDetails(p)}>
          View Events <Icon name="bi-arrow-right" />
        </button>
      </div>
    </div>
  )
}

// ── Add Program Modal ─────────────────────────────────────────
interface AddProgramForm { name: string; description: string; startDate: string; endDate: string; division: string; owner: string }
const EMPTY_FORM: AddProgramForm = { name: '', description: '', startDate: '', endDate: '', division: '', owner: '' }

function AddProgramModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Program) => void }) {
  useScrollLock()
  const [form, setForm]             = useState<AddProgramForm>(EMPTY_FORM)
  const [errors, setErrors]         = useState<Partial<AddProgramForm>>({})
  const [saving, setSaving]         = useState(false)
  const [submitError, setSubmitError] = useState('')

  function setField(f: keyof AddProgramForm, v: string) {
    setForm(prev => ({ ...prev, [f]: v }))
    setErrors(prev => ({ ...prev, [f]: undefined }))
  }

  function validate(): Partial<AddProgramForm> {
    const e: Partial<AddProgramForm> = {}
    if (!form.name.trim()) e.name = 'Program name is required'
    if (!form.startDate)   e.startDate = 'Start date is required'
    if (!form.endDate)     e.endDate = 'End date is required'
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      e.endDate = 'End date must be after start date'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true); setSubmitError('')
    try {
      const payload = {
        cr978_coe_title:       form.name.trim(),
        cr978_coe_description: form.description.trim() || undefined,
        cr978_coe_startdate:   form.startDate || undefined,
        cr978_coe_enddate:     form.endDate || undefined,
        statecode:             0 as Cr978_coe_programsBase['statecode'],
      } as Omit<Cr978_coe_programsBase, 'cr978_coe_programid'>
      const result = await Cr978_coe_programsService.create(payload)
      if (!result.data) { setSubmitError('Dataverse did not return the created record. Please try again.'); setSaving(false); return }
      onCreated(mapToProgram(result.data)); onClose()
    } catch (err) {
      setSubmitError(`Failed to save program: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setSaving(false)
    }
  }

  const inp = (err?: string): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
    border: `1px solid ${err ? '#dc2626' : '#e5e7eb'}`, outline: 'none',
    background: '#fff', color: '#111827', boxSizing: 'border-box', transition: 'border-color 0.15s',
  })
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5, display: 'block' }
  const err: React.CSSProperties = { fontSize: 11, color: '#dc2626', marginTop: 4 }
  const fw:  React.CSSProperties = { display: 'flex', flexDirection: 'column' }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, var(--dewa-navy) 0%, #004937 100%)' }}>
          <div className="modal-header-info">
            <div className="modal-title" style={{ color: '#fff' }}>New Program</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>Fill in the details to add a new program to Dataverse</div>
          </div>
          <button className="modal-close" onClick={onClose} style={{ color: 'rgba(255,255,255,0.7)' }}><Icon name="bi-x-lg" /></button>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body" style={{ gap: 16 }}>
            <div style={fw}>
              <label style={lbl}>Program Name <span style={{ color: '#dc2626' }}>*</span></label>
              <input style={inp(errors.name)} placeholder="e.g. AI Adoption Wave 3" value={form.name} onChange={e => setField('name', e.target.value)} />
              {errors.name && <span style={err}><Icon name="bi-exclamation-circle" /> {errors.name}</span>}
            </div>
            <div style={fw}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp(), resize: 'vertical', minHeight: 72, lineHeight: 1.55 }} placeholder="Brief overview…" value={form.description} onChange={e => setField('description', e.target.value)} />
            </div>
            <div className="form-2-grid">
              <div style={fw}>
                <label style={lbl}>Start Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="date" style={inp(errors.startDate)} value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
                {errors.startDate && <span style={err}><Icon name="bi-exclamation-circle" /> {errors.startDate}</span>}
              </div>
              <div style={fw}>
                <label style={lbl}>End Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="date" style={inp(errors.endDate)} value={form.endDate} onChange={e => setField('endDate', e.target.value)} />
                {errors.endDate && <span style={err}><Icon name="bi-exclamation-circle" /> {errors.endDate}</span>}
              </div>
            </div>
            <div className="form-2-grid">
              <div style={fw}>
                <label style={lbl}>Division</label>
                <input style={inp()} placeholder="e.g. Digital Transformation" value={form.division} onChange={e => setField('division', e.target.value)} />
              </div>
              <div style={fw}>
                <label style={lbl}>Target Audience / Owner</label>
                <input style={inp()} placeholder="e.g. All DEWA Staff" value={form.owner} onChange={e => setField('owner', e.target.value)} />
              </div>
            </div>
            {submitError && (
              <div style={{ background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="bi-exclamation-triangle-fill" /> {submitError}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4, borderTop: '1px solid #f3f4f6' }}>
              <button type="button" onClick={onClose} disabled={saving} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: 'var(--dewa-navy)', color: '#fff', fontSize: 13, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7, opacity: saving ? 0.75 : 1 }}>
                {saving ? <><Icon name="bi-arrow-repeat" style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…</> : <><Icon name="bi-plus-circle" /> Create Program</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Programs({ onNavigateToEvents }: Props) {
  const [programs,     setPrograms]     = useState<Program[]>([])
  const [loading,      setLoading]      = useState(true)
  const [fetchError,   setFetchError]   = useState<string | null>(null)
  const [totalEvents,  setTotalEvents]  = useState(0)
  const [statusFilter, setStatusFilter] = useState<ProgramStatus | 'All'>('All')
  const [divFilter,    setDivFilter]    = useState('All')
  const [search,       setSearch]       = useState('')
  const [showAdd,      setShowAdd]      = useState(false)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [view,         setView]         = useState<'list' | 'board'>('list')

  useEffect(() => {
    let active = true
    Cr978_coe_programsService.getAll()
      .then(r => { if (active && r.data) setPrograms(r.data.map(mapToProgram)) })
      .catch((e: unknown) => { if (active) setFetchError('Failed to load programs from Dataverse.'); console.error('[Programs]', e) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    Cr978_coe_eventsesService.getAll()
      .then(r => {
        if (!active || !r.data) return
        setTotalEvents(r.data.length)
        const map = new Map<string, number>()
        for (const ev of r.data) { const pid = ev._cr978_coe_program_value; if (pid) map.set(pid, (map.get(pid) ?? 0) + 1) }
        setPrograms(prev => prev.map(p => ({ ...p, eventCount: map.get(p.id) ?? 0 })))
      })
      .catch((e: unknown) => { if (!active) return; console.error('[Programs] events', e) })
    return () => { active = false }
  }, [])

  const divisions = useMemo(() => ['All', ...Array.from(new Set(programs.map(p => p.ownerDivision).filter(Boolean))).sort()], [programs])

  const activeCount    = programs.filter(p => p.status === 'Active').length
  const completedCount = programs.filter(p => p.status === 'Completed').length
  const upcomingCount  = programs.filter(p => p.status === 'Upcoming').length

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return programs.filter(p => {
      if (statusFilter !== 'All' && p.status !== statusFilter) return false
      if (divFilter    !== 'All' && p.ownerDivision !== divFilter) return false
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q) && !p.ownerDivision.toLowerCase().includes(q) && !p.targetAudience.toLowerCase().includes(q)) return false
      return true
    })
  }, [programs, statusFilter, divFilter, search])

  // Auto-select first visible program; preserve selection if still visible
  useEffect(() => {
    setSelectedId(prev => {
      if (!filtered.length) return null
      return filtered.some(p => p.id === prev) ? prev : filtered[0].id
    })
  }, [filtered])

  const selectedProgram = programs.find(p => p.id === selectedId) ?? null

  // Progress bar color for table column
  function barColor(pct: number) {
    if (pct >= 80) return '#007560'
    if (pct >= 50) return '#ca8a04'
    if (pct > 0)   return '#004937'
    return '#d1d5db'
  }

  return (
    <div>
      {fetchError && (
        <div style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.22)', borderRadius: 8, padding: '12px 16px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
          {fetchError}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="page-header">
        <div>
          <h1>Programs</h1>
          <p>AI initiatives and programs across all DEWA divisions</p>
          <DataSourceBadge type="simulated" title="Manually seeded data" lastUpdated="10 May 2026" />
        </div>
        <button className="prog-new-btn" onClick={() => setShowAdd(true)}>
          <Icon name="bi-plus-circle" /> New Program
        </button>
      </div>

      <LensBriefing module="programs" />

      {/* ── Filter row ── */}
      <div className="prog-filter-row">
        <div className="prog-status-chips">
          {(['All', 'Active', 'Completed', 'Upcoming'] as (ProgramStatus | 'All')[]).map(s => (
            <button key={s} className={`prog-chip${statusFilter === s ? ' on' : ''}`} onClick={() => setStatusFilter(s)}>
              {s !== 'All' && <span className={`prog-chip-dot prog-chip-dot-${statusCls(s as ProgramStatus)}`} />}
              {s}
            </button>
          ))}
        </div>
        <div className="prog-filter-right">
          <select className="prog-select" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
            {divisions.map(d => <option key={d} value={d}>{d === 'All' ? 'All Divisions' : d}</option>)}
          </select>
          <div className="prog-search-wrap">
            <Icon name="bi-search" />
            <input className="prog-search-input" placeholder="Search programs…" value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className="prog-search-clear" onClick={() => setSearch('')}><Icon name="bi-x" /></button>}
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="prog-kpi-strip">
        {[
          { label: 'Total Programmes', value: programs.length, color: '#1c1c1e' },
          { label: 'Active',           value: activeCount,     color: '#b07d10' },
          { label: 'Completed',        value: completedCount,  color: '#007560' },
          { label: 'Upcoming',         value: upcomingCount,   color: '#004937' },
        ].map(c => (
          <div key={c.label} className="prog-kpi-cell">
            <span className="prog-kpi-eyebrow">{c.label}</span>
            <span className="prog-kpi-value" style={{ color: c.color }}>{c.value}</span>
          </div>
        ))}
      </div>

      {/* ── Events banner ── */}
      <div className="prog-events-banner">
        <div className="prog-events-banner-text">
          <strong>Events Calendar</strong>
          <span>
            <span style={{ fontWeight: 800 }}>{totalEvents}</span>
            {totalEvents > 0 ? ' events' : ' events loading…'} scheduled across all programs — workshops, seminars, hackathons &amp; webinars
          </span>
        </div>
        <button className="prog-events-banner-btn" onClick={() => onNavigateToEvents()}>
          <Icon name="bi-calendar-event" /> Browse All Events
        </button>
      </div>

      {/* ── Workspace ── */}
      {loading ? (
        <div className="prog-loading-state">
          <Icon name="bi-arrow-repeat" style={{ fontSize: 28, marginBottom: 10 }} />
          Loading programs…
        </div>
      ) : (
        <div className="prog-workspace">

          {/* Table panel */}
          <div className="prog-table-panel">
            {/* Toolbar */}
            <div className="prog-toolbar">
              <div className="prog-view-seg">
                <button className={`prog-view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')}>
                  <Icon name="bi-list-ul" /> List
                </button>
                <button className={`prog-view-btn${view === 'board' ? ' active' : ''}`} onClick={() => setView('board')}>
                  <Icon name="bi-grid-3x2-gap" /> Board
                </button>
              </div>
              <span className="prog-toolbar-count">
                <strong>{filtered.length}</strong> programme{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* List view */}
            {view === 'list' ? (
              filtered.length > 0 ? (
                <div className="prog-table-scroll">
                  <table className="prog-table">
                    <thead>
                      <tr>
                        <th style={{ width: '36%' }}>Programme</th>
                        <th>Division</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Events</th>
                        <th>Owner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => {
                        const pct = p.status === 'Completed' ? 100 : p.status === 'Upcoming' ? 0 : dateProgress(p.startDate, p.endDate)
                        return (
                          <tr key={p.id} className={selectedId === p.id ? 'selected' : ''} onClick={() => setSelectedId(p.id)}>
                            <td><span className="pt-name">{p.name}</span></td>
                            <td><span className="pt-muted">{p.ownerDivision || '—'}</span></td>
                            <td><StatusBadge status={p.status} /></td>
                            <td>
                              <div className="pt-prog-wrap">
                                <div className="pt-prog-bar">
                                  <span style={{ width: `${pct}%`, background: barColor(pct) }} />
                                </div>
                                <span className="pt-prog-pct">{pct}%</span>
                              </div>
                            </td>
                            <td>
                              <span className="pt-events">
                                <Icon name="bi-calendar-event" style={{ fontSize: 11, color: '#9ca3af' }} />
                                {p.eventCount}
                              </span>
                            </td>
                            <td><span className="pt-muted">{p.targetAudience || '—'}</span></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="prog-empty-state">
                  <Icon name="bi-folder2" style={{ fontSize: 32, marginBottom: 10 }} />
                  No programs match the current filters
                </div>
              )
            ) : (
              /* Board view */
              <div style={{ padding: 16 }}>
                {filtered.length > 0 ? (
                  <div className="prog-grid">
                    {filtered.map(p => <ProgramCard key={p.id} program={p} onViewDetails={onNavigateToEvents} />)}
                  </div>
                ) : (
                  <div className="prog-empty-state">
                    <Icon name="bi-folder2" style={{ fontSize: 32, marginBottom: 10 }} />
                    No programs match the current filters
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <aside className="prog-detail-panel">
            {selectedProgram ? (
              <ProgramDetailPanel program={selectedProgram} onViewEvents={onNavigateToEvents} />
            ) : (
              <div className="prog-detail-empty">
                <Icon name="bi-cursor" style={{ fontSize: 28 }} />
                <span>Select a programme to view details</span>
              </div>
            )}
          </aside>
        </div>
      )}

      {showAdd && (
        <AddProgramModal onClose={() => setShowAdd(false)} onCreated={p => setPrograms(prev => [p, ...prev])} />
      )}
    </div>
  )
}
