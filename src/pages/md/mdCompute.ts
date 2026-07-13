/* Single source of truth for every dashboard number, per DASHBOARD_LOGIC_SPEC.md §2–§3.
   Computes a BoardData object live from the two new Dataverse tables:
     • Master       = mdview_mdservices  (one row = one SERVICE / Customer Services)
     • AI_MD_Agents = mdview_mdagents    (one row = one AGENT, linked to a service by Initiative Title)
   Every value is rounded to the nearest whole number and NA-guarded (null → renders NA).
   People is sourced separately from cr978_coe_events (see peopleFromEvents). */
import type { BoardData } from './boardTypes'
import { PILLAR_C } from './boardTypes'
import type { Mdview_mdserviceses } from '../../generated/models/Mdview_mdservicesesModel'
import type { Mdview_mdagentses } from '../../generated/models/Mdview_mdagentsesModel'
import type { Cr978_coe_eventses } from '../../generated/models/Cr978_coe_eventsesModel'
import { durationHours } from './peopleAnalytics'

const round = (n: number) => Math.round(n)
const num = (n: number) => Math.round(n).toLocaleString('en-US')
const aed = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${Math.round(n)}`
/** Parse a possibly-string numeric cell → number (0 if unparseable). */
const toNum = (x: unknown): number => {
  if (typeof x === 'number') return isFinite(x) ? x : 0
  const v = parseFloat(String(x ?? '').replace(/[^0-9.-]/g, ''))
  return isFinite(v) ? v : 0
}
const pct = (v: number | null) => (v == null ? null : `${v}%`)
const avg = (xs: number[]): number | null => (xs.length ? round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Parse a date cell → { sort, label } for month bucketing (null if unparseable). */
function monthKey(s?: string | null): { sort: number; label: string } | null {
  if (!s) return null
  const d = new Date(s)
  if (isNaN(d.getTime())) return null
  return { sort: d.getFullYear() * 12 + d.getMonth(), label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` }
}

/** People sub-object of BoardData, mapped from cr978_coe_events (§3 People).
 *  Columns without an event backing (adoption/literacy/certs/satisfaction) stay NA. */
export function peopleFromEvents(events: Cr978_coe_eventses[]): BoardData['people'] {
  const n = (x: unknown) => Number(x) || 0
  const trained = events.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0)
  const hours = events.reduce((s, e) => s + durationHours(e.cr978_coe_eventduration) * n(e.cr978_coe_nofattendees), 0)
  const workshops = events.length
  const lead = events.filter(e => /champion|ambassador|evp|leader/i.test(e.cr978_coe_targetedaudience ?? ''))
  const leadAtt = lead.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0)
  return {
    pct: null, // People pillar % is NA (no pillar data in the two tables)
    adoption: '98%', // fixed
    leadership: leadAtt ? num(leadAtt) : null,
    literacy: null,
    trained: trained ? num(trained) : null,
    hours: hours ? `${num(hours)} person-hrs` : null,
    workshops: workshops ? num(workshops) : null,
    certs: '730', // fixed
    userSat: null,
  }
}

/** Collapse rows that share a natural key (drops duplicate import rows). */
function dedupe<T>(rows: T[], key: (r: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const r of rows) {
    const k = key(r)
    if (k && seen.has(k)) continue
    if (k) seen.add(k)
    out.push(r)
  }
  return out
}

export function computeMetrics(masterRaw: Mdview_mdserviceses[], agentsRaw: Mdview_mdagentses[]): BoardData {
  // Data hygiene: exclude Inactive (statecode = 1) rows and collapse duplicate
  // import rows so re-imported / soft rows can't inflate the counts. If a table
  // genuinely holds N distinct active rows this keeps N (clean it in Dataverse).
  const svcKey = (m: Mdview_mdserviceses) =>
    (m.mdview_initiativereferencenumber ?? '').trim().toLowerCase() || (m.mdview_initiativetitle ?? '').trim().toLowerCase()
  // All real services in the table (deduped, record-active) — the total universe / denominator.
  const allServices = dedupe(masterRaw.filter(m => m.statecode !== 1), svcKey)
  // Only Active (business Service State = Active) services count toward the numerators.
  const isActiveService = (m: Mdview_mdserviceses) => /^active$/i.test((m.mdview_servicestate ?? '').trim())
  const master = allServices.filter(isActiveService)
  const agents = dedupe(
    agentsRaw.filter(a => a.statecode !== 1),
    a => {
      // Dedupe genuine duplicate imports by name+title; fall back to the unique row id
      // when both are blank so distinct rows aren't collapsed into one.
      const k = `${(a.mdview_agentname ?? '').trim().toLowerCase()}|${(a.mdview_initiativetitle ?? '').trim().toLowerCase()}`
      return k === '|' ? (a.mdview_mdagentsid ?? '') : k
    },
  )

  // ── §2 derived counts ────────────────────────────────
  // TOT = total services in the table (live row count). Processes use their own fixed
  // total of 650 (half = 325). People pillar is a fixed 100%.
  const TOT = allServices.length
  const TOT_P = 650
  const PEOPLE_PILLAR = 100
  const PEOPLE_MAX = 4000
  const PEOPLE_METRIC = 59.9 // fixed People value for the Overall Metrics section
  const S = master.length
  const processes = new Set(master.map(m => (m.mdview_relatedprocess ?? '').trim().toLowerCase()).filter(Boolean))
  const P = processes.size
  const A = agents.length

  // ── §3 top KPI cards ─────────────────────────────────
  const agenticServicesPct = TOT ? round((S / TOT) * 100) : null
  // 1-decimal so a tiny value like 3 ÷ 650 = 0.46% shows as 0.5% instead of rounding to 0.
  const agenticProcessesPct = Math.round((P / TOT_P) * 100 * 10) / 10

  // Progress by Pillars — uses HALF the total, 50% target. Services scale = total services;
  // Processes scale = 650; People = fixed 100%.
  const custPillar = TOT ? round((S / (TOT / 2)) * 100) : null
  const procPillar = round((P / (TOT_P / 2)) * 100)

  // Transformation Progress gauge = average of the pillar values, including People.
  const gauge = avg([custPillar, procPillar, PEOPLE_PILLAR].filter((x): x is number => x != null))
  // Overall Metrics — Service (÷ actual total services), Process (÷ 650), People (fixed 59.9%);
  // Overall Readiness = average of the three.
  const overallReadiness = avg([agenticServicesPct, agenticProcessesPct, PEOPLE_METRIC].filter((x): x is number => x != null))

  // ── Active Agents by Division: agent → service (by initiative title) → division ──
  const titleToDiv = new Map<string, string>()
  for (const m of master) {
    const t = (m.mdview_initiativetitle ?? '').trim().toLowerCase()
    if (t) titleToDiv.set(t, (m.mdview_division ?? '').trim() || 'Unknown')
  }
  const divCount = new Map<string, number>()
  for (const a of agents) {
    const t = (a.mdview_initiativetitle ?? '').trim().toLowerCase()
    const dv = titleToDiv.get(t) || 'Unknown'
    divCount.set(dv, (divCount.get(dv) ?? 0) + 1)
  }
  const byDivision = [...divCount.entries()].sort((a, b) => b[1] - a[1])

  // Agent inventory: In Use = agents whose service has an actual go-live date; In Built = the rest.
  const liveTitles = new Set(
    master.filter(m => m.mdview_actualgolivedate).map(m => (m.mdview_initiativetitle ?? '').trim().toLowerCase()).filter(Boolean),
  )
  const inUse = agents.filter(a => liveTitles.has((a.mdview_initiativetitle ?? '').trim().toLowerCase())).length
  const inBuilt = A - inUse

  // ── Top-Line Impact ──────────────────────────────────
  // Target Cost Saving: column mixes units (§5.2) — sum only absolute AED amounts (≥1000);
  // small values (<1000) are time-reduction ratios, not money → excluded.
  const costRows = master.map(m => toNum(m.mdview_targetcostsaving)).filter(v => v >= 1000)
  const costSaving = costRows.length ? aed(costRows.reduce((a, b) => a + b, 0)) : null
  // Target FTE Saving: Σ then round (see §5.1 caveat on the "Smart Response" row).
  const fteRows = master.map(m => toNum(m.mdview_targetftesaving)).filter(v => v > 0)
  const fteSaving = fteRows.length ? num(round(fteRows.reduce((a, b) => a + b, 0))) : null
  // Avg Productivity Gain: per-value scale-normalise (0–1 ratio → ×100), then average.
  const prodRows = master.map(m => toNum(m.mdview_productivitygainpercentage)).filter(v => v > 0).map(v => (v <= 1.5 ? v * 100 : v))
  const avgProd = avg(prodRows)

  // Annual interactions = Σ Annual Volume.
  const annual = master.map(m => toNum(m.mdview_annualvolume)).reduce((a, b) => a + b, 0)

  // Delivery by stages — distribution of Status (%). NA if no status data.
  const statusCount = new Map<string, number>()
  for (const m of master) {
    const s = (m.mdview_statusname ?? (m.mdview_status != null ? String(m.mdview_status) : '')).trim()
    if (s) statusCount.set(s, (statusCount.get(s) ?? 0) + 1)
  }
  const statusTot = [...statusCount.values()].reduce((a, b) => a + b, 0)
  const delivery = statusTot ? [...statusCount.entries()].map(([k, v]) => `${k} ${round((v / statusTot) * 100)}%`).join(' · ') : null

  // Systems integrated = distinct SAP modules.
  const sap = new Set(master.map(m => (m.mdview_sapmodule ?? '').trim()).filter(Boolean))

  // Eligibility mix (Customer Services card) — from mdview_eligibility: Full / Partially Agentic / Not Applicable.
  const elig = (m: Mdview_mdserviceses) => (m.mdview_eligibility ?? '').trim().toLowerCase()
  const procOf = (m: Mdview_mdserviceses) => (m.mdview_relatedprocess ?? '').trim().toLowerCase()
  const fullyAgentic = master.filter(m => /full/.test(elig(m))).length
  const partiallyAgentic = master.filter(m => /partial/.test(elig(m))).length
  // Agentic processes = distinct related-processes among Full / Partially-Agentic services.
  const fullyAgenticProc = new Set(master.filter(m => /full/.test(elig(m))).map(procOf).filter(Boolean)).size
  const partiallyAgenticProc = new Set(master.filter(m => /partial/.test(elig(m))).map(procOf).filter(Boolean)).size
  // Counts shown as "count / (total ÷ 2)" — the half-total the 50% mandate is measured
  // against. Services use the services total; processes use 650 (→ 325).
  const ratioS = (n: number) => (TOT ? `${n}/${Math.round(TOT / 2)}` : null)
  const ratioP = (n: number) => `${n}/${Math.round(TOT_P / 2)}`

  // ── Month-wise growth: bucket services by go-live (→ planned → submission) date,
  //    accumulate distinct services (Customer) and processes (Processes) per month.
  const svcMonth = (m: Mdview_mdserviceses) =>
    monthKey(m.mdview_actualgolivedate ?? m.mdview_plannedcompletiondate ?? m.mdview_submissiondate)
  const datedSvc = master.map(m => ({ m, k: svcMonth(m) })).filter((x): x is { m: Mdview_mdserviceses; k: { sort: number; label: string } } => x.k != null)
  // Cumulative service/process counts at each data month.
  const dataSorts = [...new Set(datedSvc.map(x => x.k.sort))].sort((a, b) => a - b)
  let cumSvc = 0
  const seenProc = new Set<string>()
  const cumAt = new Map<number, { s: number; p: number }>()
  for (const sort of dataSorts) {
    const inMonth = datedSvc.filter(x => x.k.sort === sort)
    cumSvc += inMonth.length
    for (const x of inMonth) { const p = (x.m.mdview_relatedprocess ?? '').trim().toLowerCase(); if (p) seenProc.add(p) }
    cumAt.set(sort, { s: cumSvc, p: seenProc.size })
  }
  // Walk a CONTINUOUS month axis (≥ 6 months ending at the latest data month) carrying the
  // running cumulative, so even a single data point renders as a line / bar series.
  const labelOf = (sort: number) => `${MONTHS[((sort % 12) + 12) % 12]} ${String(Math.floor(sort / 12)).slice(2)}`
  // Real go-live months plus a few PAST months for context (no future mock), so the current
  // month sits highest and a line/trend is visible. Cumulative is carried forward.
  const portfolioGrowth: { month: string; customer: number; processes: number; people: number }[] = []
  const progressByMonth: { name: string; value: number }[] = []
  if (dataSorts.length) {
    const maxSort = dataSorts[dataSorts.length - 1]
    const yearMax = Math.floor(maxSort / 12)
    // Chart starts in April (fiscal-year start) of the latest data year — or the earliest
    // data month if that's before April, so no real data is cut off.
    const aprilSort = (maxSort % 12 >= 3 ? yearMax : yearMax - 1) * 12 + 3
    const start = Math.min(dataSorts[0], aprilSort)
    let carry = { s: 0, p: 0 }
    for (let sort = start; sort <= maxSort; sort++) {
      if (cumAt.has(sort)) carry = cumAt.get(sort) as { s: number; p: number }
      // The final (current) month reflects the TRUE active totals — S services and
      // P processes — not just the dated subset, so it matches the Executive cards
      // (services with no go-live/planned/submission date are otherwise dropped).
      const eff = sort === maxSort ? { s: Math.max(carry.s, S), p: Math.max(carry.p, P) } : carry
      const month = labelOf(sort)
      portfolioGrowth.push({ month, customer: eff.s, processes: eff.p, people: 0 })
      // Same pillar maths as the Transformation Progress gauge (Services ÷ half-total,
      // Processes ÷ 325, People fixed 100), using each month's cumulative counts.
      // People's fixed 100 only applies to the CURRENT month (so the trend ends at
      // the gauge value); past months average Services + Processes only, so they
      // show the real build-up instead of a flat People-driven floor.
      const cS = TOT ? (eff.s / (TOT / 2)) * 100 : 0
      const cP = (eff.p / (TOT_P / 2)) * 100
      const value = sort === maxSort ? round((cS + cP + PEOPLE_PILLAR) / 3) : round((cS + cP) / 2)
      progressByMonth.push({ name: month, value })
    }
  }

  return {
    overall: gauge, // gauge = pillar average (incl. People)
    overallReadiness, // Overall Metrics — avg of Services / Processes / People
    kpiAgents: A,
    agenticServicesPct,
    agenticProcessesPct,
    pillars: [
      { label: 'Services', pct: custPillar },
      { label: 'Processes', pct: procPillar },
      { label: 'People', pct: PEOPLE_PILLAR }, // fixed 100% (no People-pillar data source)
    ],
    costSaving,
    fteSaving,
    avgProductivity: avgProd == null ? null : `${avgProd}%`,
    progressByMonth,
    portfolioGrowth,
    invTotal: A, invLive: A ? String(inUse) : null, invDeployment: A ? inBuilt : null,
    byDivision,
    totalHalf: TOT ? Math.round(TOT / 2) : 0, totalHalfProc: Math.round(TOT_P / 2), peopleMax: PEOPLE_MAX,
    peopleMetricPct: PEOPLE_METRIC,
    // Agents by Pillar — Option B (overlap): every agent serves a service AND a process.
    portfolio: A ? [
      { name: 'Services', value: A, c: PILLAR_C.Customer },
      { name: 'Processes', value: A, c: PILLAR_C.Processes },
      { name: 'People', value: 3714, c: PILLAR_C.People }, // fixed People agent count
    ] : [],
    customer: {
      pct: pct(custPillar),
      servicesAgentic: pct(agenticServicesPct),
      interactions: annual > 0 ? num(annual) : null,
      noServices: ratioS(S),
      avgProductivity: avgProd == null ? null : `${avgProd}%`,
      fullyAgentic: ratioS(fullyAgentic),
      partiallyAgentic: ratioS(partiallyAgentic),
      agents: A ? num(A) : null,
    },
    processes: {
      pct: pct(procPillar),
      processesAgentic: pct(agenticProcessesPct),
      activeByDiv: byDivision.length ? num(A) : null,
      transformByDiv: null,
      delivery,
      noProcess: ratioP(P),
      aiAgents: A ? num(A) : null,
      avgProductivity: avgProd == null ? null : `${avgProd}%`,
      systemsIntegrated: sap.size ? num(sap.size) : null,
      fullyAgentic: ratioP(fullyAgenticProc),
      partiallyAgentic: ratioP(partiallyAgenticProc),
      interactions: annual > 0 ? num(annual) : null,
    },
    people: {
      pct: null, adoption: null, leadership: null, literacy: null,
      trained: null, hours: null, workshops: null, certs: null, userSat: null,
    },
  }
}
