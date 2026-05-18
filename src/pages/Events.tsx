import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie,
} from 'recharts'
import { type AppEvent, type EventStatus, type EventType, type Program, type ProgramStatus } from './prog/data'
import { Cr978_coe_eventsesService, Cr978_coe_divisionsService } from '../generated'
import type { Cr978_coe_eventses } from '../generated/models/Cr978_coe_eventsesModel'
import '../events.css'
import Icon from '../components/Icon'
import { useScrollLock } from '../hooks/useScrollLock'
import DataSourceBadge from '../components/DataSourceBadge'

// ── Map Dataverse record → AppEvent ──────────────────────────
function mapToAppEvent(r: Cr978_coe_eventses, divisionMap: Map<string, string>): AppEvent {
  const STATUS_MAP: Record<number, EventStatus> = {
    893470003: 'Completed',
    893470004: 'Cancelled',
  }
  const status: EventStatus = STATUS_MAP[r.cr978_coe_event_status as number] ?? 'Upcoming'

  const TYPE_MAP: Record<number, EventType> = {
    893470000: 'Webinar',
    893470001: 'Instructor-led Training',
    893470002: 'Hands-on Workshop',
    893470003: 'Hackathon',
  }
  // eventtype1 is primary; fall back to eventtype for older records
  const type: EventType =
    TYPE_MAP[r.cr978_coe_eventtype1 as number] ??
    TYPE_MAP[r.cr978_coe_eventtype  as number] ??
    'Webinar'

  const date  = r.cr978_coe_eventdate ? r.cr978_coe_eventdate.split('T')[0] : ''
  const start = r.cr978_coe_eventstarttime ?? ''
  const end   = r.cr978_coe_eventendtime   ?? ''
  const time  = start && end ? `${start} – ${end}` : start || end || ''

  const speakers = r.cr978_coe_eventtrainer
    ? [{ name: r.cr978_coe_eventtrainer, title: 'Trainer', division: r.cr978_coe_eventdivision ?? '' }]
    : []

  const attendees    = parseInt(r.cr978_coe_nofattendees ?? '0', 10) || 0
  const invitees     = parseInt(r.cr978_coe_noofinvitees  ?? '0', 10) || 0
  const adoptionRate = invitees > 0 ? Math.round((attendees / invitees) * 100) : undefined

  return {
    id:             r.cr978_coe_eventsid,
    programId:      r._cr978_coe_program_value ?? '',
    title:          r.cr978_coe_eventname,
    type,
    date,
    time,
    location:       r.cr978_coe_eventvenue ?? '',
    attendees,
    status,
    description:    r.cr978_coe_description ?? '',
    speakers,
    attendeesList:  [],
    outcomes:       [],
    duration:       r.cr978_coe_eventduration,
    invitees:       invitees || undefined,
    adoptionRate,
    techStack:      r.cr978_coe_eventtechstackname,
    eventCode:      r.cr978_coe_eventcode,
    targetAudience: r.cr978_coe_targetedaudience,
    division:       divisionMap.get(r._cr978_coe_division_value ?? '') ?? r.cr978_coe_divisionname,
    program:        r.cr978_coe_programname,
  }
}

// ── Types ────────────────────────────────────────────────────
type LayoutMode = 'timeline' | 'grid' | 'calendar'

// ── Constants ─────────────────────────────────────────────────
const TYPE_COVER: Record<EventType, string> = {
  Workshop:                  'linear-gradient(135deg,#0e6f6a,#1a9a94,#31b6b0)',
  Seminar:                   'linear-gradient(135deg,#1c4aa8,#2b63c8,#3d7ae0)',
  Hackathon:                 'linear-gradient(135deg,#0a7d3e,#17944a,#2aa95a)',
  Webinar:                   'linear-gradient(135deg,#6a3fb3,#8b5fd6,#a682e8)',
  'Town Hall':               'linear-gradient(135deg,#1e2a44,#3a4561,#5a6682)',
  'Instructor-led Training': 'linear-gradient(135deg,#1c4aa8,#2b63c8,#3d7ae0)',
  'Hands-on Workshop':       'linear-gradient(135deg,#0e6f6a,#1a9a94,#31b6b0)',
}
const CANCELLED_COVER = 'linear-gradient(135deg,#7a3530,#a84038,#c8352c)'

const TYPE_ICONS: Record<EventType, string> = {
  Workshop:                  'bi-tools',
  Seminar:                   'bi-person-video3',
  Hackathon:                 'bi-lightning-charge-fill',
  Webinar:                   'bi-camera-video-fill',
  'Town Hall':               'bi-people-fill',
  'Instructor-led Training': 'bi-person-video3',
  'Hands-on Workshop':       'bi-tools',
}

const TYPE_CLASS: Record<EventType, string> = {
  Workshop:                  'ev-type-workshop',
  Seminar:                   'ev-type-seminar',
  Hackathon:                 'ev-type-hackathon',
  Webinar:                   'ev-type-webinar',
  'Town Hall':               'ev-type-town-hall',
  'Instructor-led Training': 'ev-type-ilt',
  'Hands-on Workshop':       'ev-type-how',
}

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9,
  padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }
const DIV_COLORS = ['#007560', '#1d6fa5', '#ca8a04', '#6a3fb3', '#dc2626', '#4d7c0f']

// ── Helpers ───────────────────────────────────────────────────
function formatDateFull(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
function formatDateShort(iso: string): { mo: string; day: number } {
  if (!iso) return { mo: '', day: 0 }
  const d = new Date(iso)
  return { mo: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), day: d.getDate() }
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
function daysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((new Date(dateStr).getTime() - today.getTime()) / 86400000))
}
function coverGradient(type: EventType, status: EventStatus): string {
  return status === 'Cancelled' ? CANCELLED_COVER : TYPE_COVER[type]
}

// ── Type + Status badges ──────────────────────────────────────
function TypeBadge({ type }: { type: EventType }) {
  return (
    <span className={`ev-type ${TYPE_CLASS[type]}`}>
      <Icon name={TYPE_ICONS[type]} style={{ fontSize: 10 }} /> {type}
    </span>
  )
}

function StatusBadge({ status }: { status: EventStatus }) {
  const cls = status === 'Upcoming' ? 'upcoming' : status === 'Completed' ? 'completed' : 'cancelled'
  return (
    <span className={`prog-badge prog-badge-${cls}`}>
      <span className="prog-badge-dot" />{status}
    </span>
  )
}

// ── Charts row ────────────────────────────────────────────────
function EventsChartsRow({ events }: { events: AppEvent[] }) {
  const monthlyData = useMemo(() => {
    const now = new Date()
    const result: Array<{ month: string; Completed: number; Upcoming: number; Cancelled: number }> = []
    for (let i = -9; i <= 1; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const me = events.filter(e => e.date.startsWith(key))
      result.push({
        month:     d.toLocaleDateString('en-US', { month: 'short' }),
        Completed: me.filter(e => e.status === 'Completed').length,
        Upcoming:  me.filter(e => e.status === 'Upcoming').length,
        Cancelled: me.filter(e => e.status === 'Cancelled').length,
      })
    }
    return result
  }, [events])

  const divisionData = useMemo(() => {
    const map = new Map<string, number>()
    events.forEach(e => {
      const div = e.division ?? 'Unspecified'
      map.set(div, (map.get(div) ?? 0) + 1)
    })
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }))
  }, [events])

  const attendanceData = useMemo(() => {
    return events
      .filter(e => e.status === 'Completed' && e.adoptionRate !== undefined)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-6)
      .map(e => ({ name: e.title.slice(0, 14) + (e.title.length > 14 ? '…' : ''), rate: e.adoptionRate! }))
  }, [events])

  const avgRate = attendanceData.length > 0
    ? Math.round(attendanceData.reduce((s, d) => s + d.rate, 0) / attendanceData.length)
    : 0

  return (
    <div className="ev2-charts-row">
      {/* Monthly stacked bar */}
      <div className="ev2-chart-card">
        <div className="ev2-chart-head">
          <div>
            <div className="ev2-chart-title">Events Delivered &amp; Planned</div>
            <div className="ev2-chart-sub">Monthly volume by status</div>
          </div>
          <div>
            <div className="ev2-chart-val">{events.length}</div>
            <div className="ev2-chart-legend">
              <span><span className="ev2-sw" style={{ background: '#007560' }} />Completed</span>
              <span><span className="ev2-sw" style={{ background: '#1d6fa5' }} />Upcoming</span>
              <span><span className="ev2-sw" style={{ background: '#dc2626' }} />Cancelled</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -22, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
            <Bar dataKey="Completed" stackId="a" fill="#007560" />
            <Bar dataKey="Upcoming"  stackId="a" fill="#1d6fa5" />
            <Bar dataKey="Cancelled" stackId="a" fill="#dc2626" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Events by division — donut */}
      <div className="ev2-chart-card">
        <div className="ev2-chart-head">
          <div>
            <div className="ev2-chart-title">By Division</div>
            <div className="ev2-chart-sub">Events per DEWA division</div>
          </div>
        </div>
        {divisionData.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={divisionData} cx="50%" cy="50%" innerRadius={30} outerRadius={52} dataKey="value" paddingAngle={2}>
                  {divisionData.map((_, i) => <Cell key={i} fill={DIV_COLORS[i % DIV_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT_STYLE} formatter={(v, n) => [v, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="ev2-div-legend">
              {divisionData.slice(0, 5).map((d, i) => (
                <div key={d.name} className="ev2-div-legend-row">
                  <span className="ev2-sw" style={{ background: DIV_COLORS[i % DIV_COLORS.length], borderRadius: '50%' }} />
                  <span className="ev2-div-name">{d.name}</span>
                  <span className="ev2-div-count">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No data</div>
        )}
      </div>

      {/* Attendance sparkline */}
      <div className="ev2-chart-card">
        <div className="ev2-chart-head">
          <div>
            <div className="ev2-chart-title">Attendance Rate</div>
            <div className="ev2-chart-sub">Show-up rate, last 6 events</div>
          </div>
          {avgRate > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div className="ev2-chart-val">{avgRate}<span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>%</span></div>
            </div>
          )}
        </div>
        {attendanceData.length > 0 ? (
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={attendanceData} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v) => [`${v}%`, 'Attendance']} />
              <Line type="monotone" dataKey="rate" stroke="#007560" strokeWidth={2} dot={{ r: 3, fill: '#007560' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ padding: '20px 0', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>No attendance data yet</div>
        )}
      </div>
    </div>
  )
}

// ── Featured banner ───────────────────────────────────────────
function FeaturedBanner({ event: ev, onSelect }: { event: AppEvent; onSelect: (ev: AppEvent) => void }) {
  const days = daysUntil(ev.date)
  const { mo, day } = formatDateShort(ev.date)
  return (
    <div className="ev2-featured">
      <div className="ev2-featured-date">
        <div className="ev2-featured-mo">{mo}</div>
        <div className="ev2-featured-day">{day}</div>
      </div>
      <div className="ev2-featured-info">
        <div className="ev2-featured-eyebrow">Featured · Upcoming</div>
        <div className="ev2-featured-title">{ev.title}</div>
        <div className="ev2-featured-meta">
          {ev.time     && <span><Icon name="bi-clock"    style={{ fontSize: 11 }} /> {ev.time}</span>}
          {ev.location && <span><Icon name="bi-geo-alt"  style={{ fontSize: 11 }} /> {ev.location.split('—')[0].trim()}</span>}
          {ev.division && <span><Icon name="bi-building" style={{ fontSize: 11 }} /> {ev.division}</span>}
        </div>
      </div>
      <div className="ev2-featured-right">
        <div className="ev2-cd-cell">
          <div className="ev2-cd-val">{days}</div>
          <div className="ev2-cd-lbl">{days === 1 ? 'Day away' : 'Days away'}</div>
        </div>
        <button className="ev2-featured-btn" onClick={() => onSelect(ev)}>
          View Details <Icon name="bi-arrow-right" />
        </button>
      </div>
    </div>
  )
}

// ── Event card (timeline row or grid cover card) ──────────────
function EventCard({ event: ev, layout, onSelect }: {
  event: AppEvent; layout: 'timeline' | 'grid'; onSelect: (ev: AppEvent) => void
}) {
  const { mo, day } = formatDateShort(ev.date)
  const statusCls  = ev.status === 'Upcoming' ? 'upcoming' : ev.status === 'Completed' ? 'completed' : 'cancelled'
  const fill = ev.status === 'Cancelled' ? CANCELLED_COVER : TYPE_COVER[ev.type]

  return (
    <article
      className={`ev2-card ev2-card--${statusCls}${layout === 'timeline' ? ' ev2-card--row' : ' ev2-card--cover'}`}
      onClick={() => onSelect(ev)}
    >
      {layout === 'grid' && (
        <div className="ev2-cover" style={{ background: fill }}>
          <div className="ev2-cover-icon">
            <Icon name={TYPE_ICONS[ev.type]} style={{ fontSize: 30, color: 'rgba(255,255,255,0.9)' }} />
          </div>
          <div className="ev2-cover-badges">
            <TypeBadge type={ev.type} />
            <StatusBadge status={ev.status} />
          </div>
        </div>
      )}

      <div className="ev2-body">
        <div className={`ev2-dt ev2-dt--${statusCls}`}>
          <div className="ev2-dt-mo">{mo}</div>
          <div className="ev2-dt-day">{day}</div>
        </div>

        <div className="ev2-card-info">
          {layout === 'timeline' && (
            <div className="ev2-card-badges">
              <TypeBadge type={ev.type} />
              <StatusBadge status={ev.status} />
            </div>
          )}
          <div className="ev2-card-title">{ev.title}</div>
          <div className="ev2-card-meta">
            {ev.time       && <span className="ev2-meta-it"><Icon name="bi-clock"   style={{ fontSize: 10 }} />{ev.time}</span>}
            {ev.location   && <span className="ev2-meta-it"><Icon name="bi-geo-alt" style={{ fontSize: 10 }} />{ev.location.split('—')[0].trim().slice(0, 32)}</span>}
            {ev.attendees > 0 && <span className="ev2-meta-it"><Icon name="bi-people" style={{ fontSize: 10 }} />{ev.attendees.toLocaleString()}</span>}
          </div>
        </div>

       

        <button className="ev2-vd" onClick={e => { e.stopPropagation(); onSelect(ev) }}>
          <Icon name="bi-arrow-right" style={{ fontSize: 12 }} />
        </button>
      </div>
    </article>
  )
}

// ── Calendar view ─────────────────────────────────────────────
function CalendarView({ events, calMonth, setCalMonth, onSelect }: {
  events: AppEvent[]
  calMonth: { year: number; month: number }
  setCalMonth: (v: { year: number; month: number }) => void
  onSelect: (ev: AppEvent) => void
}) {
  const { year, month } = calMonth
  const today = new Date()

  const eventsByDate = useMemo(() => {
    const map = new Map<number, AppEvent[]>()
    events.forEach(e => {
      if (!e.date) return
      const d = new Date(e.date)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(e)
      }
    })
    return map
  }, [events, year, month])

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const monthLabel     = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => month === 0
    ? setCalMonth({ year: year - 1, month: 11 })
    : setCalMonth({ year, month: month - 1 })
  const nextMonth = () => month === 11
    ? setCalMonth({ year: year + 1, month: 0 })
    : setCalMonth({ year, month: month + 1 })

  return (
    <div className="ev2-cal">
      <div className="ev2-cal-head">
        <button className="ev2-cal-nav" onClick={prevMonth} aria-label="Previous month">
          <Icon name="bi-chevron-left" />
        </button>
        <div className="ev2-cal-month-label">{monthLabel}</div>
        <button className="ev2-cal-nav" onClick={nextMonth} aria-label="Next month">
          <Icon name="bi-chevron-right" />
        </button>
        {!isCurrentMonth && (
          <button
            className="ev2-cal-today"
            onClick={() => setCalMonth({ year: today.getFullYear(), month: today.getMonth() })}
          >
            Today
          </button>
        )}
        <div className="ev2-cal-legend">
          <span><span className="ev2-cal-leg-dot ev2-cal-leg-dot--upcoming" />Upcoming</span>
          <span><span className="ev2-cal-leg-dot ev2-cal-leg-dot--completed" />Completed</span>
          <span><span className="ev2-cal-leg-dot ev2-cal-leg-dot--cancelled" />Cancelled</span>
        </div>
      </div>
      <div className="ev2-cal-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="ev2-cal-dh">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="ev2-cal-cell ev2-cal-cell--empty" />
          const dayEvents = eventsByDate.get(day) ?? []
          const isToday   = isCurrentMonth && today.getDate() === day
          return (
            <div key={day} className={`ev2-cal-cell${isToday ? ' ev2-cal-cell--today' : ''}`}>
              <div className={`ev2-cal-dayn${isToday ? ' ev2-cal-dayn--today' : ''}`}>{day}</div>
              <div className="ev2-cal-events">
                {dayEvents.slice(0, 2).map(ev => (
                  <button
                    key={ev.id}
                    className={`ev2-cal-ev ev2-cal-ev--${ev.status.toLowerCase()}`}
                    onClick={() => onSelect(ev)}
                    title={ev.title}
                  >
                    <span className="ev2-cal-ev-dot" />
                    <span className="ev2-cal-ev-name">{ev.title}</span>
                  </button>
                ))}
                {dayEvents.length > 2 && (
                  <div className="ev2-cal-more">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Event detail slide-in panel ───────────────────────────────
function EventDetailPanel({ event: ev, onClose }: { event: AppEvent; onClose: () => void }) {
  useScrollLock()
  const cover = coverGradient(ev.type, ev.status)
  return (
    <>
      <div className="ev2-overlay" onClick={onClose} />
      <div className="ev2-panel">
        <div className="ev2-panel-head" style={{ background: cover }} />

        <div className="ev2-panel-body">
          {/* Prominent type + status pills in body */}
          <div className="ev2-panel-badge-row">
            <span className={`ev2-panel-type-pill ev2-ptp--${TYPE_CLASS[ev.type]}`}>
              <Icon name={TYPE_ICONS[ev.type]} style={{ fontSize: 13 }} />
              {ev.type}
            </span>
            <span className={`ev2-panel-status-pill ev2-psp--${ev.status.toLowerCase()}`}>
              {ev.status}
            </span>
          </div>

          <div className="ev2-panel-meta">
            <div className="ev2-meta-cell">
              <div className="ev2-meta-k">Date</div>
              <div className="ev2-meta-v">{formatDateFull(ev.date)}</div>
            </div>
            <div className="ev2-meta-cell">
              <div className="ev2-meta-k">Time</div>
              <div className="ev2-meta-v">{ev.time || '—'}</div>
            </div>
            <div className="ev2-meta-cell" style={{ gridColumn: '1 / -1' }}>
              <div className="ev2-meta-k">Location</div>
              <div className="ev2-meta-v" style={{ fontSize: 12, fontWeight: 500 }}>{ev.location || '—'}</div>
            </div>
            {ev.division && (
              <div className="ev2-meta-cell">
                <div className="ev2-meta-k">Division</div>
                <div className="ev2-meta-v">{ev.division}</div>
              </div>
            )}
            <div className="ev2-meta-cell">
              <div className="ev2-meta-k">Attendees</div>
              <div className="ev2-meta-v">{ev.attendees > 0 ? ev.attendees.toLocaleString() : '—'}</div>
            </div>
            {ev.invitees && (
              <div className="ev2-meta-cell">
                <div className="ev2-meta-k">Invitees</div>
                <div className="ev2-meta-v">{ev.invitees.toLocaleString()}</div>
              </div>
            )}
            {ev.adoptionRate !== undefined && (
              <div className="ev2-meta-cell">
                <div className="ev2-meta-k">Attendance Rate</div>
                <div className="ev2-meta-v">
                  <span style={{ fontWeight: 700, color: ev.adoptionRate >= 75 ? '#007560' : ev.adoptionRate >= 50 ? '#b07d10' : '#dc2626' }}>
                    {ev.adoptionRate}%
                  </span>
                  <div style={{ marginTop: 4, height: 5, background: '#e5e7eb', borderRadius: 3 }}>
                    <div style={{ width: `${ev.adoptionRate}%`, height: '100%', borderRadius: 3, background: ev.adoptionRate >= 75 ? '#007560' : '#ca8a04' }} />
                  </div>
                </div>
              </div>
            )}
            {ev.duration && (
              <div className="ev2-meta-cell">
                <div className="ev2-meta-k">Duration</div>
                <div className="ev2-meta-v">{ev.duration}</div>
              </div>
            )}
            {ev.eventCode && (
              <div className="ev2-meta-cell">
                <div className="ev2-meta-k">Event Code</div>
                <div className="ev2-meta-v">
                  <code style={{ background: '#f3f4f6', padding: '2px 7px', borderRadius: 5, fontSize: 12, fontFamily: "'Dubai','Segoe UI',system-ui,sans-serif", color: '#374151' }}>{ev.eventCode}</code>
                </div>
              </div>
            )}
            {ev.program && (
              <div className="ev2-meta-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="ev2-meta-k">Programme</div>
                <div className="ev2-meta-v">{ev.program}</div>
              </div>
            )}
            {ev.targetAudience && (
              <div className="ev2-meta-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="ev2-meta-k">Target Audience</div>
                <div className="ev2-meta-v">{ev.targetAudience}</div>
              </div>
            )}
            {ev.techStack && (
              <div className="ev2-meta-cell" style={{ gridColumn: '1 / -1' }}>
                <div className="ev2-meta-k">Technology Stack</div>
                <div className="ev2-meta-v">{ev.techStack}</div>
              </div>
            )}
          </div>

          {ev.description && (
            <div className="ev2-panel-section">
              <div className="ev2-panel-section-title"><Icon name="bi-file-text" /> About This Event</div>
              <p className="ev2-panel-desc">{ev.description}</p>
            </div>
          )}

          {ev.speakers.length > 0 && (
            <div className="ev2-panel-section">
              <div className="ev2-panel-section-title"><Icon name="bi-mic-fill" /> Speakers / Trainers</div>
              {ev.speakers.map((s, i) => (
                <div key={i} className="ev2-speaker">
                  <div className="ev2-speaker-av">{initials(s.name)}</div>
                  <div>
                    <div className="ev2-speaker-nm">{s.name}</div>
                    <div className="ev2-speaker-rl">{s.title} · {s.division}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {ev.status === 'Completed' && ev.outcomes && ev.outcomes.length > 0 && (
            <div className="ev2-panel-section">
              <div className="ev2-panel-section-title"><Icon name="bi-trophy-fill" /> Outcomes &amp; Highlights</div>
              <ul className="ev2-panel-outcomes">
                {ev.outcomes.map((o, i) => (
                  <li key={i}><span className="ev2-outcome-dot" />{o}</li>
                ))}
              </ul>
            </div>
          )}

          {ev.status === 'Cancelled' && (
            <div className="ev2-cancelled-note">
              <Icon name="bi-exclamation-circle-fill" />
              <span>This event was cancelled. {ev.description}</span>
            </div>
          )}

          {ev.attendeesList.length > 0 && (
            <div className="ev2-panel-section">
              <div className="ev2-panel-section-title"><Icon name="bi-people-fill" /> Notable Attendees</div>
              <div className="ev2-attendees">
                {ev.attendeesList.map((a, i) => (
                  <span key={i} className="ev2-attendee-chip">
                    <span className="ev2-attendee-dot" />
                    {a.name}
                    <span style={{ color: '#9ca3af', fontSize: 10 }}>· {a.division}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          <button onClick={onClose} className="ev2-panel-close-btn">Close</button>
        </div>
      </div>
    </>
  )
}

// ── Program detail panel (unchanged) ─────────────────────────
function progStatusCls(s: ProgramStatus) {
  return s === 'Active' ? 'active' : s === 'Completed' ? 'completed' : 'upcoming'
}

function ProgramDetailPanel({ program: p, onBack }: { program: Program; onBack: () => void }) {
  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  return (
    <div style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.10)', border: '1px solid rgba(0,117,96,0.15)' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--dewa-navy) 0%, #004937 100%)', padding: '18px 24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', color: 'rgba(255,255,255,0.85)', borderRadius: 7, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginBottom: 10, transition: 'background 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
            onMouseOut={e  => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          >
            <Icon name="bi-arrow-left" /> Back to Programs
          </button>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.25, marginBottom: 8 }}>{p.name}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`prog-badge prog-badge-${progStatusCls(p.status)}`}>
              <span className="prog-badge-dot" />{p.status}
            </span>
            {p.ownerDivision && (
              <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                {p.ownerDivision}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>Start Date</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="bi-calendar3" style={{ fontSize: 12, color: '#007560' }} />
              {p.startDate ? fmtDate(p.startDate) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>End Date</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="bi-calendar-event" style={{ fontSize: 12, color: '#007560' }} />
              {p.endDate ? fmtDate(p.endDate) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>Events</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', display: 'flex', alignItems: 'center', gap: 5 }}>
              <Icon name="bi-collection" style={{ fontSize: 12, color: '#007560' }} />
              {p.eventCount}
            </div>
          </div>
          {p.totalParticipants > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>Participants</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="bi-people" style={{ fontSize: 12, color: '#007560' }} />
                {p.totalParticipants.toLocaleString()}
              </div>
            </div>
          )}
          {p.targetAudience && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>Target Audience</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{p.targetAudience}</div>
            </div>
          )}
        </div>
        {p.description && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 5 }}>Overview</div>
            <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>{p.description}</p>
          </div>
        )}
        {p.objectives.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 6 }}>Objectives</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {p.objectives.map((o, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#374151' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#007560', marginTop: 5, flexShrink: 0, display: 'inline-block' }} />
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────
interface EventsProps {
  fromProgram?: Program | null
  onBackToPrograms?: () => void
}

export default function Events({ fromProgram, onBackToPrograms }: EventsProps = {}) {
  const [tabFilter,      setTabFilter]      = useState<EventStatus>('Upcoming')
  const [typeFilter,     setTypeFilter]     = useState<EventType | 'All'>('All')
  const [divisionFilter, setDivisionFilter] = useState<string>('All')
  const [searchQuery,    setSearchQuery]    = useState<string>('')
  const [layoutMode,     setLayoutMode]     = useState<LayoutMode>('timeline')
  const [calMonth,       setCalMonth]       = useState<{ year: number; month: number }>(() => {
    const n = new Date()
    return { year: n.getFullYear(), month: n.getMonth() }
  })
  const [selected, setSelected] = useState<AppEvent | null>(null)
  const [events,   setEvents]   = useState<AppEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      Cr978_coe_eventsesService.getAll(),
      Cr978_coe_divisionsService.getAll(),
    ]).then(([eventsResult, divisionsResult]) => {
      if (!active) return
      const divisionMap = new Map<string, string>()
      divisionsResult.data?.forEach(d => {
        divisionMap.set(d.cr978_coe_divisionid, d.cr978_divisionname)
      })
      if (eventsResult.data) setEvents(eventsResult.data.map(r => mapToAppEvent(r, divisionMap)))
    }).catch((err: unknown) => {
      if (!active) return
      console.error('[Events] Failed to load:', err instanceof Error ? err.message : String(err))
      setError('Failed to load events from Dataverse.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const scopedEvents = fromProgram ? events.filter(e => e.programId === fromProgram.id) : events

  const divisions = useMemo(() => {
    const s = new Set<string>()
    scopedEvents.forEach(e => { if (e.division) s.add(e.division) })
    return [...s].sort()
  }, [scopedEvents])

  const counts = useMemo(() => ({
    Upcoming:  scopedEvents.filter(e => e.status === 'Upcoming').length,
    Completed: scopedEvents.filter(e => e.status === 'Completed').length,
    Cancelled: scopedEvents.filter(e => e.status === 'Cancelled').length,
  }), [scopedEvents])

  // Shared filter: type + division + search (calendar also uses this)
  const filteredBase = useMemo(() => {
    let base = scopedEvents
    if (typeFilter !== 'All') base = base.filter(e => e.type === typeFilter)
    if (divisionFilter !== 'All') base = base.filter(e => e.division === divisionFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      base = base.filter(e =>
        e.title.toLowerCase().includes(q) ||
        (e.location ?? '').toLowerCase().includes(q) ||
        (e.division ?? '').toLowerCase().includes(q) ||
        e.speakers.some(s => s.name.toLowerCase().includes(q))
      )
    }
    return base
  }, [scopedEvents, typeFilter, divisionFilter, searchQuery])

  // List views: add tab filter + sort newest (highest date) first
  const visibleEvents = useMemo(() => {
    const base = filteredBase.filter(e => e.status === tabFilter)
    return [...base].sort((a, b) => b.date.localeCompare(a.date))
  }, [filteredBase, tabFilter])

  const timelineGroups = useMemo(() => {
    if (layoutMode !== 'timeline') return []
    const groups = new Map<string, AppEvent[]>()
    visibleEvents.forEach(e => {
      if (!e.date) return
      const key = e.date.slice(0, 7)
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(e)
    })
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([key, evs]) => {
      const d = new Date(key + '-01')
      return {
        key,
        monthName: d.toLocaleDateString('en-US', { month: 'long' }),
        year:      d.getFullYear().toString(),
        events:    evs,
      }
    })
  }, [visibleEvents, layoutMode])

  // Featured: soonest upcoming event
  const featuredEvent =
    tabFilter === 'Upcoming' && typeFilter === 'All' && divisionFilter === 'All' && !searchQuery.trim() && visibleEvents.length > 0
      ? [...visibleEvents].sort((a, b) => a.date.localeCompare(b.date))[0]
      : null

  const EVENT_TYPES: (EventType | 'All')[] = ['All', 'Webinar', 'Instructor-led Training', 'Hands-on Workshop', 'Hackathon']

  const TABS: { id: EventStatus; label: string }[] = [
    { id: 'Upcoming',  label: 'Upcoming'  },
    { id: 'Completed', label: 'Completed' },
    { id: 'Cancelled', label: 'Cancelled' },
  ]

  return (
    <div>
      {fromProgram ? (
        <ProgramDetailPanel program={fromProgram} onBack={onBackToPrograms ?? (() => {})} />
      ) : (
        <div className="page-header">
          <div>
            <h1>Events</h1>
            <p>Workshops, seminars, hackathons and webinars across all AI programmes</p>
          </div>
          <DataSourceBadge type="simulated" title="Manually seeded data" lastUpdated="14 May 2026" />
        </div>
      )}

      {error && <div className="ev2-error">{error}</div>}

      {!fromProgram && !loading && events.length > 0 && (
        <EventsChartsRow events={events} />
      )}

      {/* Tabs + layout toggle */}
      <div className="ev2-tabs-row">
        <div className="ev2-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`ev2-tab${tabFilter === t.id ? ' ev2-tab--on' : ''}`}
              onClick={() => { setTabFilter(t.id); setTypeFilter('All') }}
            >
              {t.label}
              <span className="ev2-tab-ct">{counts[t.id]}</span>
            </button>
          ))}
        </div>
        <div className="ev2-seg">
          <button className={layoutMode === 'timeline' ? 'on' : ''} onClick={() => setLayoutMode('timeline')}>
            <Icon name="bi-list-ul" /> Timeline
          </button>
          <button className={layoutMode === 'grid' ? 'on' : ''} onClick={() => setLayoutMode('grid')}>
            <Icon name="bi-kanban" /> Grid
          </button>
          <button className={layoutMode === 'calendar' ? 'on' : ''} onClick={() => setLayoutMode('calendar')}>
            <Icon name="bi-calendar3" /> Calendar
          </button>
        </div>
      </div>

      {/* Search + Division + Type filter row */}
      <div className="ev2-filter-row">
        <div className="ev2-search-wrap">
          <Icon name="bi-search" className="ev2-search-icon" style={{ fontSize: 12 }} />
          <input
            className="ev2-search-input"
            type="text"
            placeholder="Search events…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="ev2-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear">
              <Icon name="bi-x-lg" style={{ fontSize: 9 }} />
            </button>
          )}
        </div>

        {divisions.length > 1 && (
          <select
            className="ev2-division-select"
            value={divisionFilter}
            onChange={e => setDivisionFilter(e.target.value)}
          >
            <option value="All">All Divisions</option>
            {divisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        )}

        <div className="ev2-chip-group">
          {EVENT_TYPES.map(t => (
            <button
              key={t}
              className={`ev2-chip${typeFilter === t ? ' ev2-chip--on' : ''}`}
              onClick={() => setTypeFilter(t)}
            >
              {t === 'All' ? 'All types' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="ev2-loading">
          <Icon name="bi-arrow-repeat" style={{ fontSize: 28 }} />
          Loading events…
        </div>
      ) : (
        <div className="ev2-content">
          {layoutMode === 'calendar' ? (
            <CalendarView
              events={filteredBase}
              calMonth={calMonth}
              setCalMonth={setCalMonth}
              onSelect={setSelected}
            />
          ) : (
            <>
              {featuredEvent && !fromProgram && layoutMode === 'timeline' && (
                <FeaturedBanner event={featuredEvent} onSelect={setSelected} />
              )}

              {visibleEvents.length === 0 ? (
                <div className="ev2-empty">
                  <Icon name="bi-calendar-x" style={{ fontSize: 28, marginBottom: 8 }} />
                  No {tabFilter.toLowerCase()} events
                  {typeFilter !== 'All' && ` of type "${typeFilter}"`}
                </div>
              ) : layoutMode === 'timeline' ? (
                <div className="ev2-timeline">
                  {timelineGroups.map(g => (
                    <div key={g.key} className="ev2-tl-group">
                      <div className="ev2-tl-month">
                        <div className="ev2-tl-mo-name">{g.monthName}</div>
                        <div className="ev2-tl-mo-yr">{g.year}</div>
                        <div className="ev2-tl-mo-ct">{g.events.length} event{g.events.length !== 1 ? 's' : ''}</div>
                      </div>
                      <div className="ev2-tl-list">
                        {g.events.map(ev => (
                          <EventCard key={ev.id} event={ev} layout="timeline" onSelect={setSelected} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ev2-grid">
                  {visibleEvents.map(ev => (
                    <EventCard key={ev.id} event={ev} layout="grid" onSelect={setSelected} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {selected && <EventDetailPanel event={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
