/* People-tab analytics for the MD Dashboard — 100% live from cr978_coe_events.
   Anything with no backing data returns null → renders as NA. */
import type { Cr978_coe_eventses } from '../../generated/models/Cr978_coe_eventsesModel'
import { Cr978_coe_eventsescr978_coe_eventtype1 as EVTYPE } from '../../generated/models/Cr978_coe_eventsesModel'
import { C } from './boardTypes'

/** Minimal shape for the optional automation time-savings rows (was AumRow). */
interface TimeSavingRow { timesavingshrsmonth: number }

const n = (x: unknown): number => (typeof x === 'number' ? x : Number(x)) || 0
const int = (v: number): string => Math.round(v).toLocaleString('en-US')

/** Parse an event-duration cell (cr978_coe_eventduration) → HOURS.
 *  Stored as "HH:MM" (hours:minutes — "18:00" = 18h, "1:30" = 1.5h) or a plain
 *  number of hours ("18" = 18h). Number("18:00") is NaN, so the plain n() helper
 *  silently drops time-formatted durations to 0 — this handles both forms.
 *  Blank / unparseable → 0. */
export function durationHours(raw: unknown): number {
  if (typeof raw === 'number') return isFinite(raw) ? raw : 0
  const s = String(raw ?? '').trim()
  if (!s) return 0
  if (s.includes(':')) {
    const [h, m] = s.split(':')
    return (parseInt(h, 10) || 0) + (parseInt(m, 10) || 0) / 60
  }
  const v = parseFloat(s.replace(/[^0-9.]/g, ''))
  return isFinite(v) ? v : 0
}

export interface Datum { name: string; value: number }
export interface PeopleKPI { key: string; label: string; icon: string; value: string | null; accent: string; sub?: string; formula?: string }
export interface ArrowKPI { key: string; label: string; icon: string; beforeLabel: string; before: string | null; afterLabel: string; after: string | null; note: string | null }
export interface People2Data {
  kpis: PeopleKPI[]
  byMonth: Datum[]
  byTech: Datum[]
  byCategory: Datum[]
  byTrainer: Datum[]
  byDivision: Datum[]
  byAudience: Datum[]
}
export interface PeopleData {
  eventsLoaded: boolean
  kpis: PeopleKPI[]
  byCategory: Datum[]
  byMonth: Datum[]
  arrows: ArrowKPI[]
  p2: People2Data
  /** Raw aggregates for the redesigned People view (participant reach, hours, distributions). */
  view: PeopleView
}

/** Everything the redesigned People tab renders — 100% derived from cr978_coe_events.
 *  "reach" = Σ attendees (participants), not event counts. null → NA. */
export interface PeopleView {
  trained: number | null
  /** Unique employees trained (fixed — the events table holds attendee counts,
   *  not a per-employee roster, so uniqueness can't be derived from it). */
  uniqueTrained: number | null
  trainings: number | null
  hoursTotal: number | null
  reachByProgram: Datum[]
  reachTotal: number | null
  deliveryByMonth: Datum[]
  techDistribution: Datum[]
  reachByDivision: Datum[]
}

/** Fixed unique-employee count for the "Employees Trained on Agentic AI" KPI. */
const UNIQUE_TRAINED = 307

/** Participant-reach aggregates for the People view (attendees grouped by program /
 *  month / technology / division). Sourced only from event columns; NA when empty. */
export function peopleView(events: Cr978_coe_eventses[], divisions: Map<string, string> = new Map()): PeopleView {
  const att = (e: Cr978_coe_eventses) => n(e.cr978_coe_nofattendees)
  const trained = events.reduce((s, e) => s + att(e), 0)
  const hoursTotal = events.reduce((s, e) => s + durationHours(e.cr978_coe_eventduration) * att(e), 0)

  // Reach by learning program = Σ attendees (participants) grouped by the event
  // category free-text field (cr978_coe_eventcategory). Blank categories skipped.
  const catMap = new Map<string, number>()
  for (const e of events) { const c = (e.cr978_coe_eventcategory ?? '').trim(); if (c) catMap.set(c, (catMap.get(c) ?? 0) + att(e)) }
  const reachByProgram = [...catMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)
  const reachTotal = reachByProgram.reduce((s, d) => s + d.value, 0)

  // Training delivery by month = COUNT of training events per calendar month.
  const mMap = new Map<string, { v: number; sort: number }>()
  for (const e of events) {
    const raw = e.cr978_coe_eventdate
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    // Skip implausible/placeholder dates (e.g. a blank cell parsing to 1999) that
    // would otherwise anchor the axis at a stray "Nov 99".
    const yr = d.getFullYear()
    if (yr < 2020 || yr > 2035) continue
    const sort = yr * 12 + d.getMonth()
    const label = `${MONTHS[d.getMonth()]} ${String(yr).slice(2)}`
    const cur = mMap.get(label) ?? { v: 0, sort }
    cur.v += 1; mMap.set(label, cur)
  }
  const deliveryByMonth = [...mMap.entries()].sort((a, b) => a[1].sort - b[1].sort).map(([name, x]) => ({ name, value: x.v }))

  // Technology distribution = COUNT of events per technology, from the tech-stack
  // lookup (cr978_coe_eventtechstack → name), then the multi-select / free-text.
  const techMap = new Map<string, number>()
  for (const e of events) for (const t of techStackLabels(e)) techMap.set(t, (techMap.get(t) ?? 0) + 1)
  const techDistribution = [...techMap.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 6)

  // Reach by division = Σ attendees per division (top 8). Division resolves from the
  // lookup GUID via the divisions map first, then the formatted name / free-text field.
  const divName = (e: Cr978_coe_eventses) =>
    ((e._cr978_coe_division_value ? divisions.get(e._cr978_coe_division_value) : '') || e.cr978_coe_divisionname || e.cr978_coe_eventdivision || '').trim()
  const divCount = new Map<string, number>()
  for (const e of events) { const dv = divName(e); if (dv) divCount.set(dv, (divCount.get(dv) ?? 0) + att(e)) }
  // All divisions (no cap), highest reach first.
  const reachByDivision = [...divCount.entries()].map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  return {
    trained: trained || null,
    uniqueTrained: UNIQUE_TRAINED,
    trainings: events.length || null,
    hoursTotal: hoursTotal || null,
    reachByProgram, reachTotal: reachTotal || null,
    deliveryByMonth, techDistribution, reachByDivision,
  }
}

/** 4 real event categories → short display labels. */
const CAT_LABEL: Record<string, string> = {
  Webinar: 'Webinar',
  Instructor_ledTraining: 'ILT',
  Hands_onWorkshop: 'Workshop',
  Hackathon: 'Hackathon',
}

/** Resolve an event's category robustly. The type may arrive as a numeric code
 *  or enum key on cr978_coe_eventtype1; when that's blank the category is instead
 *  recorded as free text in cr978_coe_eventtype1name / eventcategory / eventtypename. */
function categoryOf(e: Cr978_coe_eventses): string {
  const raw: unknown = e.cr978_coe_eventtype1
  let key = ''
  if (typeof raw === 'number') key = (EVTYPE as Record<number, string>)[raw] ?? ''
  else if (typeof raw === 'string') key = raw
  if (CAT_LABEL[key]) return CAT_LABEL[key]
  const text = `${e.cr978_coe_eventtype1name ?? ''} ${e.cr978_coe_eventcategory ?? ''} ${e.cr978_coe_eventtypename ?? ''}`.toLowerCase()
  if (/hackathon/.test(text)) return 'Hackathon'
  if (/workshop|hands/.test(text)) return 'Workshop'
  if (/instructor|ilt|training/.test(text)) return 'ILT'
  if (/webinar/.test(text)) return 'Webinar'
  return 'Other'
}

const LEAD_RE = /champion|ambassador|evp|leader/i
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Training-event COUNT per calendar month, keyed by the "Mon YY" label used by
 *  the portfolio-growth chart (mdCompute) so the People series can be merged in.
 *  Same implausible-year guard as deliveryByMonth. */
export function eventCountByMonth(events: Cr978_coe_eventses[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const e of events) {
    const raw = e.cr978_coe_eventdate
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const yr = d.getFullYear()
    if (yr < 2020 || yr > 2035) continue
    const label = `${MONTHS[d.getMonth()]} ${String(yr).slice(2)}`
    m.set(label, (m.get(label) ?? 0) + 1)
  }
  return m
}

/** Group events by calendar month from cr978_coe_eventdate (chronological). */
function monthsFrom(events: Cr978_coe_eventses[]): Datum[] {
  const m = new Map<string, { label: string; value: number; sort: number }>()
  for (const e of events) {
    const raw = e.cr978_coe_eventdate
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const sort = d.getFullYear() * 12 + d.getMonth()
    const label = `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`
    const cur = m.get(label) ?? { label, value: 0, sort }
    cur.value++
    m.set(label, cur)
  }
  return [...m.values()].sort((a, b) => a.sort - b.sort).map(({ label, value }) => ({ name: label, value }))
}

/** Count events by a single string attribute (blank values skipped). */
function countBy(events: Cr978_coe_eventses[], pick: (e: Cr978_coe_eventses) => string): Datum[] {
  const m = new Map<string, number>()
  for (const e of events) { const k = pick(e).trim(); if (k) m.set(k, (m.get(k) ?? 0) + 1) }
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** Map both enum keys AND raw option-set codes to readable labels so the same
 *  technology never appears twice (e.g. "893470000" and "Copilot Studio"). */
const TECH_LABEL: Record<string, string> = {
  CopilotStudio: 'Copilot Studio', M365Copilot: 'M365 Copilot',
  '893470000': 'Copilot Studio', '893470001': 'M365 Copilot',
}
const normTech = (s: string): string => { const t = s.trim(); return TECH_LABEL[t] ?? t }
/** An event may carry a free-text technology, a formatted-name field, or a
 *  multi-select tech-stack — return every technology label attached to it. */
function techLabels(e: Cr978_coe_eventses): string[] {
  const s = (e.cr978_coe_event_technology || e.cr978_coe_techstackname || e.cr978_coe_eventtechstackname || '').trim()
  if (s) return s.split(/[;,/]+/).map(normTech).filter(Boolean)
  const arr = e.cr978_coe_techstack
  if (Array.isArray(arr) && arr.length) return arr.map(k => normTech(String(k)))
  return []
}
/** Technology label(s) sourced from the tech-stack LOOKUP first
 *  (cr978_coe_eventtechstack → cr978_coe_eventtechstackname), then the
 *  multi-select option-set, then the free-text technology. Used for the
 *  event-count Technology Distribution. */
function techStackLabels(e: Cr978_coe_eventses): string[] {
  const nm = (e.cr978_coe_eventtechstackname || '').trim()
  if (nm) return nm.split(/[;,/]+/).map(normTech).filter(Boolean)
  const arr = e.cr978_coe_techstack
  if (Array.isArray(arr) && arr.length) return arr.map(k => normTech(String(k)))
  const s = (e.cr978_coe_event_technology || e.cr978_coe_techstackname || '').trim()
  if (s) return s.split(/[;,/]+/).map(normTech).filter(Boolean)
  return []
}
function countByMulti(events: Cr978_coe_eventses[], pick: (e: Cr978_coe_eventses) => string[]): Datum[] {
  const m = new Map<string, number>()
  for (const e of events) for (const raw of pick(e)) { const k = raw.trim(); if (k) m.set(k, (m.get(k) ?? 0) + 1) }
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

/** An event counts as "AI" when its technology (cr978_coe_event_technology /
 *  tech-stack) matches an AI/GenAI tool. Matched against the real fetched
 *  values — no per-event hard-coding. Adjust the list to taste. */
const AI_TECH_RE = /copilot|claude|\bgpt\b|openai|gemini|genai|generative|\bllm\b|langchain|mistral|llama|bedrock|\bai\b/i
function isAiEvent(e: Cr978_coe_eventses): boolean {
  return techLabels(e).some(t => AI_TECH_RE.test(t))
}

/** People analytics — KPI cards/charts are sourced ONLY from cr978_coe_events
 *  columns (AI adoption rate, literacy, certifications, satisfaction have no
 *  event column → excluded/NA). The one exception is the "Hours saved" arrow,
 *  which uses the aum time-savings column (automation impact) and is labelled
 *  as such so it isn't confused with event-based "Training hours delivered". */
export function peopleAnalytics(events: Cr978_coe_eventses[], rows: TimeSavingRow[] = [], divisions: Map<string, string> = new Map()): PeopleData {
  // ── event-sourced aggregates ──────────────────────────
  const attendees = events.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0) // total reach, all events
  const hours = events.reduce((s, e) => s + durationHours(e.cr978_coe_eventduration) * n(e.cr978_coe_nofattendees), 0)
  const lead = events.filter(e => LEAD_RE.test(e.cr978_coe_targetedaudience ?? ''))

  // Conversion is measured ONLY over events that actually recorded invitees, so
  // attendees from no-invite events can't push the rate above 100%.
  const invScope = events.filter(e => n(e.cr978_coe_noofinvitees) > 0)
  const invited = invScope.reduce((s, e) => s + n(e.cr978_coe_noofinvitees), 0)
  const attendedInvited = invScope.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0)
  const conversion = invited > 0 ? Math.round((attendedInvited / invited) * 100) : null

  const catCount: Record<string, number> = { Webinar: 0, ILT: 0, Workshop: 0, Hackathon: 0, Other: 0 }
  for (const e of events) catCount[categoryOf(e)]++
  const webinarsIlt = catCount.Webinar + catCount.ILT

  // AI adoption by technology: AI-tool events ÷ events with invitees recorded.
  const aiEvents = events.filter(isAiEvent).length

  // Hours saved via automation — aum time-savings column (NOT an event metric).
  // Used only for the "Hours saved" arrow below; per-month is the yearly ÷ 12 average.
  const hrsMonth = rows.reduce((s, r) => s + r.timesavingshrsmonth, 0)
  const hrsYear = hrsMonth * 12

  // null when there is no real data → the card shows NA (no dummy substitute).
  // Every KPI card/chart below is derived ONLY from cr978_coe_events columns.
  const orNull = (v: number, fmt: (x: number) => string): string | null => (v > 0 ? fmt(v) : null)

  const kpis: PeopleKPI[] = [
    { key: 'equipped', label: 'People equipped in AI', icon: 'bi-people-fill', accent: C.gold, value: orNull(attendees, int), formula: 'Σ attendees across all events (cr978_coe_nofattendees).' },
    { key: 'events', label: 'AI Training Delivered', icon: 'bi-calendar-check-fill', accent: C.blue, value: orNull(events.length, int), formula: 'COUNT of training events (cr978_coe_events).' },
    { key: 'hackathons', label: 'Hackathons held', icon: 'bi-trophy-fill', accent: C.green, value: orNull(catCount.Hackathon, int), formula: 'COUNT of events where type = Hackathon.' },
    { key: 'workshops', label: 'Workshops held', icon: 'bi-tools', accent: C.teal, value: orNull(catCount.Workshop, int), formula: 'COUNT of events where type = Workshop.' },
    { key: 'webinars', label: 'Webinars & ILT sessions', icon: 'bi-camera-video-fill', accent: C.blue, value: orNull(webinarsIlt, int), formula: 'COUNT of events where type ∈ {Webinar, Instructor-Led Training}.' },
    { key: 'hours', label: 'Training hours delivered', icon: 'bi-clock-history', accent: C.gold, value: hours > 0 ? `${int(hours)} person-hrs` : null, formula: 'Σ (event duration × attendees).' },
    { key: 'attendance', label: 'Avg attendance rate', icon: 'bi-graph-up-arrow', accent: C.green, value: conversion == null ? null : `${conversion}%`, formula: 'Attended ÷ Invited × 100, over events that recorded invitees.' },
    { key: 'leadership', label: 'Leadership sessions', icon: 'bi-award-fill', accent: C.teal, value: orNull(lead.length, int), formula: 'COUNT of events whose audience ~ leader / champion / EVP.' },
  ]

  // Expand the ILT abbreviation for display; keep the internal count key as 'ILT'.
  const CAT_DISPLAY: Record<string, string> = { ILT: 'Instructor-Led Training' }
  const byCategory: Datum[] = (['Webinar', 'ILT', 'Workshop', 'Hackathon'] as const)
    .map(k => ({ name: CAT_DISPLAY[k] ?? k, value: catCount[k] }))
    .filter(d => d.value > 0)
  const byMonth = monthsFrom(events)

  // ── People 2 — event participation analytics (all live) ──
  const eventsWithInvites = invScope.length
  const nEvents = events.length
  const aiAdoption = eventsWithInvites > 0 ? Math.round((aiEvents / eventsWithInvites) * 100) : null
  const p2: People2Data = {
    kpis: [
      { key: 'p2events', label: 'Total events (invitees recorded)', icon: 'bi-calendar-check-fill', accent: C.blue, value: orNull(eventsWithInvites, int) },
      { key: 'p2ai', label: 'AI events (by technology)', icon: 'bi-robot', accent: C.teal, value: orNull(aiEvents, int) },
      { key: 'p2aiadopt', label: 'AI adoption rate', icon: 'bi-cpu-fill', accent: C.green, value: aiAdoption == null ? null : `${aiAdoption}%` },
      { key: 'p2inv', label: 'Total invitees', icon: 'bi-send', accent: C.gold, value: orNull(invited, int) },
      { key: 'p2att', label: 'Total attendees', icon: 'bi-people-fill', accent: C.green, value: orNull(attendees, int) },
      { key: 'p2conv', label: 'Conversion rate', icon: 'bi-graph-up-arrow', accent: C.teal, value: conversion == null ? null : `${conversion}%` },
      { key: 'p2avgatt', label: 'Avg attendees / event', icon: 'bi-person', accent: C.green, value: nEvents > 0 && attendees > 0 ? int(attendees / nEvents) : null },
      { key: 'p2avginv', label: 'Avg invitees / event', icon: 'bi-people', accent: C.gold, value: eventsWithInvites > 0 && invited > 0 ? int(invited / eventsWithInvites) : null },
    ],
    byMonth,
    byTech: countByMulti(events, techLabels).slice(0, 8),
    byCategory,
    byTrainer: countBy(events, e => e.cr978_coe_eventtrainer ?? '').slice(0, 8),
    byDivision: countBy(events, e => e.cr978_coe_eventdivision || e.cr978_coe_divisionname || '').slice(0, 10),
    byAudience: countBy(events, e => e.cr978_coe_targetedaudience ?? ''),
  }

  const arrows: ArrowKPI[] = [
    {
      key: 'attendance', label: 'Invited → Attended', icon: 'bi-people-fill',
      beforeLabel: 'Invited', before: orNull(invited, int),
      afterLabel: 'Attended', after: orNull(attendedInvited, int),
      note: conversion == null ? null : `${conversion}% attendance · events with invites only`,
    },
    {
      key: 'hours', label: 'Hours saved: monthly → yearly', icon: 'bi-hourglass-split',
      beforeLabel: 'Per month (avg)', before: hrsYear > 0 ? `${int(hrsYear / 12)} hrs` : null,
      afterLabel: 'Per year', after: hrsYear > 0 ? `${int(hrsYear)} hrs` : null,
      note: hrsYear > 0 ? 'annual ÷ 12 · automation time saved (aum)' : null,
    },
  ]

  return { eventsLoaded: events.length > 0, kpis, byCategory, byMonth, arrows, p2, view: peopleView(events, divisions) }
}
