import { useMemo, useState, type ReactNode } from 'react'
import Icon from '../../components/Icon'
import { C, type BoardData } from './boardv8Data'
import type { PeopleData } from './aumPeople'

const NA = () => <span className="na">NA</span>
const show = (s: string | null): ReactNode => (s == null ? <NA /> : s)

/** Find a People-tab KPI by matching one of the given keywords against its
 *  label (case-insensitive substring match), in `people.kpis` array order.
 *  Returns the raw string value, or null when nothing matches / no data. */
function findPeopleKpi(people: PeopleData, ...keywords: string[]): string | null {
  const kws = keywords.map(k => k.toLowerCase())
  const found = people.kpis.find(k => kws.some(kw => k.label.toLowerCase().includes(kw)))
  return found ? found.value : null
}

/* ── KPI register row ──────────────────────────────────────
   `raw` drives availability (raw != null → Available); `render` lets a row
   show something richer (e.g. an icon-prefixed value) while `raw` still
   carries the plain value used for the Available/NA computation. */
interface RegRow { kpi: string; raw: string | null; calc: string; render?: ReactNode }

function StatusBadge({ available }: { available: boolean }) {
  return <span className={`regbadge${available ? ' ok' : ' na'}`}>{available ? 'Available' : 'Not available'}</span>
}

function RegisterTable({ rows }: { rows: RegRow[] }) {
  return (
    <div className="panel regpanel">
      <div className="regtable-wrap">
        <table className="regtable">
          <thead>
            <tr><th>KPI</th><th>Value / Outcome</th><th>Calculation</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.kpi}>
                <td className="regkpi">{r.kpi}</td>
                <td className="regval">{r.render ?? show(r.raw)}</td>
                <td className="regcalc">{r.calc}</td>
                <td><StatusBadge available={r.raw != null} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** A section sub-header + its register table, with a live available/NA count
 *  computed from that section's own rows. */
function Section({ title, rows }: { title: string; rows: RegRow[] }) {
  const avail = rows.filter(r => r.raw != null).length
  const na = rows.length - avail
  return (
    <div className="reg-section">
      <div className="reg-subhd">
        <span className="reg-subhd-name">{title}</span>
        <span className="reg-subhd-counts">{avail} available · {na} NA</span>
      </div>
      <RegisterTable rows={rows} />
    </div>
  )
}

/** Summary stat card (Total / Available / NA strip). */
function KCard({ label, icon, value, accent }: { label: string; icon: string; value: string; accent: string }) {
  return (
    <div className="kpi" style={{ ['--ac' as string]: accent }}>
      <div className="kic" style={{ background: 'var(--inset)', color: accent }}><Icon name={icon} /></div>
      <div className="kl">{label}</div>
      <div className="kv">{value}</div>
    </div>
  )
}

const TABS = [
  { id: 'overall', label: 'Overall Readiness', icon: 'bi-speedometer2' },
  { id: 'inventory', label: 'Agent Inventory', icon: 'bi-collection-fill' },
  { id: 'customer', label: 'Customer Services', icon: 'bi-chat-dots-fill' },
  { id: 'processes', label: 'Processes & Operations', icon: 'bi-gear' },
  { id: 'people', label: 'People', icon: 'bi-people-fill' },
  { id: 'portfolio', label: 'AI Portfolio', icon: 'bi-pie-chart-fill' },
] as const
type TabId = typeof TABS[number]['id']

/** MD View v3 — KPI Register. Every KPI in the transformation model, rendered
 *  as a formula/value/status register table instead of cards or charts. 100%
 *  live data via `BoardData`/`PeopleData`; NA where a KPI has no backing column. */
export function BoardViewV3({ data: d, people }: { data: BoardData; people: PeopleData }) {
  const [active, setActive] = useState<TabId>('overall')

  const sReadiness: RegRow[] = [
    { kpi: 'Overall Readiness / Transformation', raw: d.overall == null ? null : `${d.overall}%`, calc: 'average of 3 pillars ÷ 3 · speedometer with 50% mark' },
    { kpi: 'Total AI Agents', raw: String(d.kpiAgents), calc: 'COUNT(Entity Type = Agent)' },
    { kpi: 'Agentic Services (Customer)', raw: d.agenticServicesPct == null ? null : `${d.agenticServicesPct}%`, calc: 'customer-domain use cases ÷ total use cases' },
    { kpi: 'Agentic Processes', raw: d.agenticProcessesPct == null ? null : `${d.agenticProcessesPct}%`, calc: 'operations-domain use cases ÷ total use cases' },
    { kpi: 'People progress', raw: d.pillars[2]?.pct == null ? null : `${d.pillars[2].pct}%`, calc: 'people-domain use cases ÷ total use cases' },
  ]

  const sImpact: RegRow[] = [
    {
      kpi: 'Cost Saving', raw: d.costSaving, calc: d.costSavingNote,
      render: d.costSaving == null ? undefined : <><Icon name="bi-currency-dirham" />{d.costSaving}</>,
    },
    { kpi: 'FTE Saving', raw: d.fteSaving, calc: d.fteSavingNote },
    { kpi: 'Hours Saved', raw: null, calc: 'Σ FTE Savings (hours column)' },
    { kpi: 'Cost Avoidance', raw: d.costAvoidance, calc: d.costAvoidanceNote },
  ]

  const sInventory: RegRow[] = [
    { kpi: 'Live in Production', raw: d.invLive, calc: 'Production + Live (deployment stage)' },
    { kpi: 'In Deployment', raw: String(d.invDeployment), calc: 'COUNT(Deployment Projects)' },
    { kpi: 'Active Agents by Division', raw: d.byDivision.length ? d.byDivision.map(([k, n]) => `${k} ${n}`).join(' · ') : null, calc: 'COUNT(Agent) grouped by Division' },
    { kpi: 'Delivery by Stages', raw: d.processes.delivery, calc: 'stage buckets of agents: Build/Test/Live' },
    { kpi: 'Progress Trend by Month', raw: null, calc: 'monthly transformation snapshots not tracked' },
  ]

  const sMaturity: RegRow[] = [
    { kpi: 'AI Maturity — EVP level', raw: null, calc: 'no leadership-segment maturity data' },
    { kpi: 'AI Maturity — VPs', raw: null, calc: 'no leadership-segment maturity data' },
    { kpi: 'AI Maturity — Senior mgrs', raw: null, calc: 'no leadership-segment maturity data' },
    { kpi: 'AI Maturity — Employees', raw: null, calc: 'no leadership-segment maturity data' },
  ]

  const sCustomer: RegRow[] = [
    { kpi: '% services now agentic', raw: d.customer.servicesAgentic, calc: 'customer use cases ÷ total use cases' },
    { kpi: 'Total interactions', raw: d.customer.interactions, calc: 'Σ Annual Volume' },
    { kpi: 'Agent resolution rate', raw: null, calc: 'no resolution field in data' },
    { kpi: 'Avg. response time (before/after)', raw: null, calc: 'Base Line / Time-After-AI = #REF!' },
    { kpi: 'Customer satisfaction', raw: null, calc: 'CSAT not captured (User Satisfaction only 2 recs)' },
  ]

  const sProcesses: RegRow[] = [
    { kpi: '% processes now agentic', raw: d.agenticProcessesPct == null ? null : `${d.agenticProcessesPct}%`, calc: 'operations-domain use cases ÷ total use cases' },
    { kpi: 'Active AI agents by divisions', raw: d.processes.activeByDiv, calc: 'COUNT(Agent) grouped by named Division' },
    { kpi: 'Transformation progress by divisions', raw: d.processes.transformByDiv, calc: 'rank of agent count per division' },
  ]

  const sPeople: RegRow[] = [
    { kpi: 'Leadership adoption', raw: findPeopleKpi(people, 'leadership'), calc: 'COE events targeted at AI Champions / Ambassadors / EVP' },
    { kpi: 'No. of people trained', raw: findPeopleKpi(people, 'trained', 'equipped'), calc: 'Σ attendees across COE events' },
    { kpi: 'Training hours delivered', raw: findPeopleKpi(people, 'hours'), calc: 'Σ (event duration × attendees)' },
    { kpi: 'Workshops / trainings', raw: findPeopleKpi(people, 'workshop'), calc: 'COUNT(COE events)' },
    { kpi: 'AI adoption rate', raw: d.people.adoption ?? null, calc: 'needs workforce headcount denominator' },
    { kpi: 'AI literacy maturity', raw: d.people.literacy, calc: 'no maturity-level field' },
    { kpi: 'Agentic AI certifications', raw: d.people.certs, calc: 'no certification field' },
    { kpi: 'User satisfaction %', raw: d.people.userSat ?? null, calc: 'only 2 records' },
  ]

  const sPortfolio: RegRow[] = [
    {
      kpi: 'Portfolio by pillar (current)',
      raw: d.portfolio.length ? d.portfolio.map(p => `${p.name} ${p.value}`).join(' · ') : null,
      calc: `use-case domain split (${d.portfolioTotal} total)`,
    },
  ]

  const allRows = useMemo(
    () => [...sReadiness, ...sImpact, ...sInventory, ...sMaturity, ...sCustomer, ...sProcesses, ...sPeople, ...sPortfolio],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [d, people],
  )
  const totalKpis = allRows.length
  const availableKpis = allRows.filter(r => r.raw != null).length
  const naKpis = totalKpis - availableKpis

  return (
    <div className="mdv2 mdv8 bd-v2">
      {/* board header */}
      <div className="board-hd">
        <div className="logo">
          <div className="mark"><Icon name="bi-table" /></div>
          <div>
            <h1>DEWA AGENTIC AI TRANSFORMATION — V3</h1>
            <div className="sub">KPI Register · every KPI with its formula, live value, and coverage status</div>
          </div>
        </div>
        <div className="upd">Overall Readiness<b>{d.overall == null ? 'NA' : `${d.overall}%`}</b></div>
      </div>

      {/* always-visible summary strip */}
      <div className="kpi3">
        <KCard label="Total KPIs" icon="bi-table" accent={C.teal} value={String(totalKpis)} />
        <KCard label="Available" icon="bi-check2-circle" accent={C.green} value={String(availableKpis)} />
        <KCard label="Not Available" icon="bi-x-circle" accent={C.gold} value={String(naKpis)} />
      </div>

      {/* real switchable tabs */}
      <div className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`tab${active === t.id ? ' on' : ''}`} onClick={() => setActive(t.id)}>
            <Icon name={t.icon} />{t.label}
          </button>
        ))}
      </div>

      {active === 'overall' && (
        <>
          <Section title="Overall Readiness & AI Score" rows={sReadiness} />
          <Section title="Top-Line Impact" rows={sImpact} />
        </>
      )}

      {active === 'inventory' && (
        <>
          <Section title="Agent Inventory & Progress" rows={sInventory} />
          <Section title="AI Maturity by Segment" rows={sMaturity} />
        </>
      )}

      {active === 'customer' && <Section title="Customer Services" rows={sCustomer} />}
      {active === 'processes' && <Section title="Processes & Operations" rows={sProcesses} />}
      {active === 'people' && <Section title="People" rows={sPeople} />}
      {active === 'portfolio' && <Section title="DEWA AI Portfolio" rows={sPortfolio} />}

      <div className="foot">Metrics {d.sourceNote} · People rows live from cr978_coe_events · NA where a KPI has no backing column</div>
    </div>
  )
}
