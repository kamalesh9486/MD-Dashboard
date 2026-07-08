import { useEffect, useMemo, useState } from 'react'
import { fetchMdMasterFull, type MdMasterRow } from './md/mdMasterFetch'
import Icon from '../components/Icon'
import { BoardView } from './md/boardv8'
import { type BoardData, PILLAR_C } from './md/boardv8Data'
import '../md-view-v2.css'
import '../md-view-v8.css'

/* domain → pillar classifier (documented in the plan's derivation ledger) */
type Pillar = 'Customer' | 'Processes' | 'People'
function pillarOf(domain: string): Pillar {
  const d = (domain || '').toUpperCase()
  if (/CUSTOMER 360|CONNECTION|RECONNECTION|CONTRACT/.test(d)) return 'Customer'
  if (/PERSONNEL|C&B|TALENT|LEARNING|HR SELF|\bHR\b/.test(d)) return 'People'
  return 'Processes'
}

const aed = (n: number) => n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${Math.round(n)}`
const compact = (n: number) => n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${Math.round(n)}`
const num = (n: number) => Math.round(n).toLocaleString('en-US')
const pctStr = (v: number | null) => v == null ? null : `${v}%`

/** Aggregate live md_master rows into the shared BoardData shape. */
function liveBoardData(rows: MdMasterRow[]): BoardData {
  const isAgent = (r: MdMasterRow) => /agent/i.test(r.entitytype)
  const agents = rows.filter(isAgent)
  const ucs = rows.filter(r => /use case/i.test(r.entitytype))
  const deployments = rows.filter(r => /deploy/i.test(r.entitytype)).length
  const portfolio = rows.filter(r => !/d2d/i.test(r.source)).length

  const pillarCount: Record<Pillar, number> = { Customer: 0, Processes: 0, People: 0 }
  for (const r of ucs) pillarCount[pillarOf(r.domain)]++
  const ucTot = ucs.length
  const pp = (n: number): number | null => ucTot ? Math.round(n / ucTot * 100) : null
  const pillarPct = { Customer: pp(pillarCount.Customer), Processes: pp(pillarCount.Processes), People: pp(pillarCount.People) }
  const avail = [pillarPct.Customer, pillarPct.Processes, pillarPct.People].filter((x): x is number => x != null)
  const overall = avail.length ? Math.round(avail.reduce((s, x) => s + x, 0) / avail.length) : null

  const sum = (f: (r: MdMasterRow) => number) => rows.reduce((s, r) => s + f(r), 0)
  const totalProcess = sum(r => r.totalprocess), agenticProcess = sum(r => r.agenticprocess)
  const agenticProcessPct = totalProcess ? Math.round(agenticProcess / totalProcess * 100) : null

  const divMap = new Map<string, number>()
  for (const r of agents) { const d = r.division && r.division !== 'Unspecified' ? r.division : 'Other'; divMap.set(d, (divMap.get(d) ?? 0) + 1) }
  const byDivision = [...divMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)

  const st = (re: RegExp) => agents.filter(r => re.test(r.status)).length
  const live = st(/live|active|prod/i)
  const delivery = agents.length ? `Build ${st(/plan/i)} · Test ${st(/pipeline|test/i)} · Live ${live}` : null

  const satRows = rows.filter(r => r.usersatisfaction > 0)
  const userSat = satRows.length ? `${(satRows.reduce((s, r) => s + r.usersatisfaction, 0) / satRows.length).toFixed(1)}%` : null
  const costSaving = sum(r => r.costsaving), fteSaving = sum(r => r.ftesavings), costAvoidance = sum(r => r.fteavoidance), interactions = sum(r => r.annualvolume)

  return {
    sourceNote: 'live from Dataverse md_master',
    overall,
    kpiAgents: agents.length,
    kpiAgentsSub: `${live} live · ${deployments} in deployment`,
    agenticServicesPct: pillarPct.Customer, agenticServicesSub: `${pillarCount.Customer} of ${ucTot} use cases`,
    agenticProcessesPct: pillarPct.Processes, agenticProcessesSub: `${pillarCount.Processes} of ${ucTot} use cases`,
    pillars: [
      { label: 'Customer services', pct: pillarPct.Customer },
      { label: 'Processes & ops', pct: pillarPct.Processes },
      { label: 'People', pct: pillarPct.People },
    ],
    costSaving: costSaving > 0 ? aed(costSaving) : null, costSavingNote: 'Σ md_master cost saving',
    fteSaving: fteSaving > 0 ? `≈${Math.round(fteSaving / 2080)}` : null, fteSavingNote: fteSaving > 0 ? `${num(fteSaving)} hrs ÷ 2,080` : '—',
    costAvoidance: costAvoidance > 0 ? costAvoidance.toFixed(1) : null, costAvoidanceNote: 'Σ FTE avoidance',
    invTotal: agents.length, invLive: `${live}`, invDeployment: deployments, byDivision,
    customer: { pct: pctStr(pillarPct.Customer), servicesAgentic: pctStr(pillarPct.Customer), interactions: interactions > 0 ? compact(interactions) : null },
    processes: {
      pct: pctStr(pillarPct.Processes), processesAgentic: agenticProcessPct == null ? null : `${agenticProcessPct}%`,
      activeByDiv: `${agents.length} / ${byDivision.length || '—'} div`,
      transformByDiv: byDivision[0] ? `${byDivision[0][0]} leads (${byDivision[0][1]})` : null, delivery,
    },
    people: { pct: pctStr(pillarPct.People), adoption: null, leadership: null, literacy: null, trained: null, hours: null, workshops: null, certs: null, userSat },
    portfolio: [
      { name: 'Customer', value: pillarCount.Customer, c: PILLAR_C.Customer },
      { name: 'Processes', value: pillarCount.Processes, c: PILLAR_C.Processes },
      { name: 'People', value: pillarCount.People, c: PILLAR_C.People },
    ],
    portfolioTotal: ucTot, footerPortfolio: portfolio,
  }
}

/** MD View V8 — LIVE board (numbers computed from md_master; change with the data). */
export default function MDDashboardV8() {
  const [res, setRes] = useState<{ rows: MdMasterRow[]; info: string } | null>(null)
  useEffect(() => { fetchMdMasterFull().then(setRes).catch(e => setRes({ rows: [], info: `Fetch error: ${String(e)}` })) }, [])
  const data = useMemo(() => res ? liveBoardData(res.rows) : null, [res])

  if (!data || !res) return (
    <div className="mdv2 mdv8"><div className="state"><div className="spin" />Loading live data from Dataverse…</div></div>
  )
  const noData = res.rows.length === 0
  return (
    <>
      <div className="mdv2 mdv8" style={{ marginBottom: -8 }}>
        <div className="panel" style={{ borderLeft: `3px solid ${noData ? '#ca8a04' : '#007560'}` }}>
          <div className="ph" style={{ marginBottom: 0 }}>
            <div className="ic" style={{ background: noData ? 'rgba(202,138,4,.14)' : 'rgba(0,117,96,.12)', color: noData ? '#9a6c08' : '#066b57' }}><Icon name={noData ? 'bi-info-circle-fill' : 'bi-check-circle-fill'} /></div>
            <div>
              <h3>{noData ? 'No live md_master data reachable' : 'Live data connected'}</h3>
              <div className="s"><b>Fetch status:</b> {res.info}{noData && <> — see <b>MD View V9 · Board</b> for the fixed reference figures.</>}</div>
            </div>
          </div>
        </div>
      </div>
      <BoardView data={data} />
    </>
  )
}
