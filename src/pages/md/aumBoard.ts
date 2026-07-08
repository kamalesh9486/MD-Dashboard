/* Build the shared BoardData from aum_aiinitiatives rows, in two modes:
   - 'strict' (v1): only KPIs with a real backing column are populated; the rest
     are NA (null).
   - 'proxy'  (v2): the same board, but NA slots are filled with the nearest
     available column as an estimate, prefixed with "≈" so proxies are visible. */
import type { BoardData } from './boardv8Data'
import { PILLAR_C } from './boardv8Data'
import type { AumRow } from './aumFetch'

export type AumMode = 'strict' | 'proxy'

/** Hours one full-time employee works in a year — used ONLY to convert
 *  "hours saved" → "FTEs freed" (FTE = hours saved ÷ this). It's an HR
 *  convention, not a value in the data. DEWA standard work-year = 2,400 h
 *  (e.g. 8 h/day × ~300 working days, or 48 h/wk × 50 wk). Change here to
 *  update every FTE calc at once. */
const FTE_HOURS_PER_YEAR = 2400

type Pillar = 'Customer' | 'Processes' | 'People'
function pillarOf(domain: string): Pillar {
  const d = (domain || '').toUpperCase()
  if (/CUSTOMER|CONNECTION|RECONNECTION|CONTRACT|BILLING|SERVICE/.test(d)) return 'Customer'
  if (/PERSONNEL|C&B|TALENT|LEARNING|HR|PEOPLE|TRAINING/.test(d)) return 'People'
  return 'Processes'
}

const aed = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${Math.round(n)}`
const compact = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`
const num = (n: number) => Math.round(n).toLocaleString('en-US')
const pctStr = (v: number | null) => v == null ? null : `${v}%`

/** Representative AED value per FTE-cost-saving band, for the v2 proxy only. */
const FTE_BAND_AED: Record<string, number> = {
  ProductivityValue_AED2Mp_a_: 2_000_000,
  ProductivityValueAED0_5M_2Mp_a_: 1_250_000,
  ProductivityValue_AED0_5Mp_a_: 500_000,
}

export function aumBoardData(rows: AumRow[], mode: AumMode): BoardData {
  const proxy = mode === 'proxy'

  const agents = rows.filter(r => /AIApplication/i.test(r.entitytype))
  const ucs = rows.filter(r => /UseCase/i.test(r.entitytype))
  const deployments = rows.filter(r => /DeploymentProject/i.test(r.entitytype)).length
  const portfolioCount = rows.filter(r => !/D2D/i.test(r.source)).length

  const pillarCount: Record<Pillar, number> = { Customer: 0, Processes: 0, People: 0 }
  for (const r of ucs) pillarCount[pillarOf(r.domain)]++
  const ucTot = ucs.length
  const pp = (n: number): number | null => ucTot ? Math.round(n / ucTot * 100) : null
  const pillarPct = { Customer: pp(pillarCount.Customer), Processes: pp(pillarCount.Processes), People: pp(pillarCount.People) }
  const avail = [pillarPct.Customer, pillarPct.Processes, pillarPct.People].filter((x): x is number => x != null)
  const overall = avail.length ? Math.round(avail.reduce((s, x) => s + x, 0) / avail.length) : null

  const sum = (f: (r: AumRow) => number) => rows.reduce((s, r) => s + f(r), 0)

  const divMap = new Map<string, number>()
  for (const r of agents) { const d = r.division || 'Other'; divMap.set(d, (divMap.get(d) ?? 0) + 1) }
  const byDivision = [...divMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  // per-pillar division breakdown (agents grouped by domain-pillar × division) for the domain tabs
  const pillarDivMap: Record<Pillar, Map<string, number>> = { Customer: new Map(), Processes: new Map(), People: new Map() }
  for (const r of agents) {
    const dv = r.division || 'Other'
    const m = pillarDivMap[pillarOf(r.domain)]
    m.set(dv, (m.get(dv) ?? 0) + 1)
  }
  const topByPillar = (m: Map<string, number>): [string, number][] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  const divByPillar = {
    Customer: topByPillar(pillarDivMap.Customer),
    Processes: topByPillar(pillarDivMap.Processes),
    People: topByPillar(pillarDivMap.People),
  }

  const st = (re: RegExp) => agents.filter(r => re.test(r.status)).length
  const live = st(/Active|Deployed|Completed/i)
  const pctA = (n: number) => agents.length ? Math.round(n / agents.length * 100) : 0
  const delivery = agents.length ? `Build ${pctA(st(/Planning|Discovery/i))}% · Test ${pctA(st(/Pilot/i))}% · Live ${pctA(live)}%` : null

  // Cost Saving = "from live AI" → Σ cost savings over live AI apps + agents
  // (AIApplication records), not every row. Includes the large app values.
  const costSaving = agents.reduce((s, r) => s + r.costsaving, 0)
  const interactions = sum(r => r.annualvolume)

  // ── proxy-only derivations (v2) ─────────────────────────────
  const timeHrsYr = sum(r => r.timesavingshrsmonth) * 12
  const fteFromTime = timeHrsYr > 0 ? Math.round(timeHrsYr / FTE_HOURS_PER_YEAR) : 0
  const productivityValue = sum(r => FTE_BAND_AED[r.fteband] ?? 0)
  const adoptionRows = rows.filter(r => r.useradoption > 0)
  const adoptionAvg = adoptionRows.length ? Math.round(adoptionRows.reduce((s, r) => s + r.useradoption, 0) / adoptionRows.length) : 0
  const employees = sum(r => r.employeesimpacted)

  return {
    sourceNote: proxy
      ? 'live from aum_aiinitiatives · ≈ = near-value proxy filling gaps'
      : 'live from aum_aiinitiatives · available only (NA where no column)',
    overall,
    kpiAgents: agents.length + deployments,
    kpiAgentsSub: `${live} live · ${deployments} in deployment`,
    agenticServicesPct: pillarPct.Customer, agenticServicesSub: `${pillarCount.Customer} of ${ucTot} use cases`,
    agenticProcessesPct: pillarPct.Processes, agenticProcessesSub: `${pillarCount.Processes} of ${ucTot} use cases`,
    pillars: [
      { label: 'Customer services', pct: pillarPct.Customer },
      { label: 'Processes & ops', pct: pillarPct.Processes },
      { label: 'People', pct: pillarPct.People },
    ],
    costSaving: costSaving > 0 ? aed(costSaving) : null, costSavingNote: 'from live AI · Σ AI-app + agent cost savings',
    // FTE saving — derived from the real time-savings-hours column (÷2,080 = one work-year).
    // Shown in both modes; marked "est." because it's a derivation, not a reported headcount.
    fteSaving: fteFromTime > 0 ? `≈${fteFromTime}` : null,
    fteSavingNote: timeHrsYr > 0 ? `≈ ${num(timeHrsYr)} hrs/yr ÷ ${FTE_HOURS_PER_YEAR.toLocaleString('en-US')} (est.)` : 'no time-savings data',
    // Cost avoidance — from the real aum_ftecostsavings productivity-value bands (representative AED).
    costAvoidance: productivityValue > 0 ? aed(productivityValue) : null,
    costAvoidanceNote: 'Σ aum_ftecostsavings bands (≈ AED)',
    invTotal: agents.length + deployments, invLive: `${live}`, invDeployment: deployments, byDivision, divByPillar,
    customer: {
      pct: pctStr(pillarPct.Customer),
      servicesAgentic: pctStr(pillarPct.Customer),
      interactions: interactions > 0 ? compact(interactions) : null,
    },
    processes: {
      pct: pctStr(pillarPct.Processes),
      // count-ratio % has no column → NA (v1); proxy uses the domain-pillar % (v2)
      processesAgentic: proxy ? (pillarPct.Processes != null ? `≈ ${pillarPct.Processes}%` : null) : null,
      activeByDiv: `${agents.length}`,
      transformByDiv: byDivision[0] ? `${byDivision[0][0]} leads (${byDivision[0][1]})` : null,
      delivery,
    },
    people: {
      pct: pctStr(pillarPct.People),
      adoption: adoptionAvg > 0 ? `${adoptionAvg}%` : null,        // real column (aum_useradoption) — both modes
      leadership: null,                                            // event-sourced — no proxy
      literacy: null,                                              // no column — no proxy
      trained: proxy ? (employees > 0 ? `≈ ${num(employees)}` : null) : null,      // proxy: employees impacted
      hours: proxy ? (timeHrsYr > 0 ? `≈ ${num(timeHrsYr)} hrs (time saved)` : null) : null,
      workshops: null,                                             // event-sourced — no proxy
      certs: null,                                                 // no column — no proxy
      userSat: proxy ? (adoptionAvg > 0 ? `≈ ${adoptionAvg}%` : null) : null,       // proxy: adoption ≈ satisfaction
    },
    portfolio: [
      { name: 'Customer', value: pillarCount.Customer, c: PILLAR_C.Customer },
      { name: 'Processes', value: pillarCount.Processes, c: PILLAR_C.Processes },
      { name: 'People', value: pillarCount.People, c: PILLAR_C.People },
    ],
    portfolioTotal: ucTot, footerPortfolio: portfolioCount,
  }
}
