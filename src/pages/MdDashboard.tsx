import { useEffect, useMemo, useState } from 'react'
import { Mdview_mdservicesesService } from '../generated/services/Mdview_mdservicesesService'
import type { Mdview_mdserviceses } from '../generated/models/Mdview_mdservicesesModel'
import { Mdview_mdagentsesService } from '../generated/services/Mdview_mdagentsesService'
import type { Mdview_mdagentses } from '../generated/models/Mdview_mdagentsesModel'
import { Cr978_coe_eventsesService } from '../generated/services/Cr978_coe_eventsesService'
import type { Cr978_coe_eventses } from '../generated/models/Cr978_coe_eventsesModel'
import { Cr978_coe_divisionsService } from '../generated/services/Cr978_coe_divisionsService'
import type { Cr978_coe_divisions } from '../generated/models/Cr978_coe_divisionsModel'
import { Ai_alhasbausecasesesService } from '../generated/services/Ai_alhasbausecasesesService'
import type { Ai_alhasbausecaseses } from '../generated/models/Ai_alhasbausecasesesModel'
import { computeMetrics, peopleFromEvents } from './md/mdCompute'
import { peopleAnalytics, eventCountByMonth, type PeopleData } from './md/peopleAnalytics'
import type { BoardData } from './md/boardTypes'
import { BoardViewV2, type BoardSectionId } from './md/Board'
import '../md-redesign.css'

const TIMEOUT = Symbol('timeout')
function withTimeout<T>(p: Promise<T>, ms = 8000): Promise<T | typeof TIMEOUT> {
  return Promise.race([p, new Promise<typeof TIMEOUT>(res => setTimeout(() => res(TIMEOUT), ms))])
}

/**
 * MD Dashboard — every value is computed live from the two Dataverse tables
 * (mdview_mdservices = services, mdview_mdagents = agents) via computeMetrics
 * (DASHBOARD_LOGIC_SPEC §2–§3). People metrics come from cr978_coe_events.
 * Dataverse calls resolve to [] outside a deployed Power Apps runtime → NA.
 */
export default function MdDashboard({ section, onSectionChange }: { section?: BoardSectionId; onSectionChange?: (id: BoardSectionId) => void } = {}) {
  const [master, setMaster] = useState<Mdview_mdserviceses[] | null>(null)
  const [agents, setAgents] = useState<Mdview_mdagentses[] | null>(null)
  const [events, setEvents] = useState<Cr978_coe_eventses[] | null>(null)
  const [divisions, setDivisions] = useState<Cr978_coe_divisions[] | null>(null)
  const [alhasba, setAlhasba] = useState<Ai_alhasbausecaseses[] | null>(null)

  useEffect(() => {
    let active = true
    const grab = <T,>(p: Promise<{ data?: T[] }>): Promise<T[]> =>
      withTimeout(p.then(r => r.data ?? [])).then(r => (r === TIMEOUT ? [] : r)).catch(() => [])
    Promise.all([
      grab<Mdview_mdserviceses>(Mdview_mdservicesesService.getAll()),
      grab<Mdview_mdagentses>(Mdview_mdagentsesService.getAll()),
      grab<Cr978_coe_eventses>(Cr978_coe_eventsesService.getAll()),
      grab<Cr978_coe_divisions>(Cr978_coe_divisionsService.getAll()),
      grab<Ai_alhasbausecaseses>(Ai_alhasbausecasesesService.getAll()),
    ]).then(([m, a, e, d, h]) => { if (!active) return; setMaster(m); setAgents(a); setEvents(e); setDivisions(d); setAlhasba(h) })
    return () => { active = false }
  }, [])

  // Division lookup GUID → display label (People view). Long names fall back to
  // the shorter alias so the chart labels stay fully readable.
  const divisionMap = useMemo(
    () => new Map((divisions ?? []).map(d => {
      const name = (d.cr978_divisionname ?? '').trim()
      const alias = (d.cr978_divisionname_alias ?? '').trim()
      const label = name.length > 22 && alias ? alias : (name || alias)
      return [d.cr978_coe_divisionid, label] as [string, string]
    })),
    [divisions],
  )

  const board: BoardData | null = useMemo(() => {
    if (!master || !agents) return null
    const b = computeMetrics(master, agents, alhasba ?? [])
    if (events) {
      b.people = peopleFromEvents(events)
      // Wire the People series of the Portfolio Growth chart to the monthly count
      // of training events (cr978_coe_events), matched by the "Mon YY" month label.
      const ev = eventCountByMonth(events)
      if (b.portfolioGrowth) b.portfolioGrowth = b.portfolioGrowth.map(m => ({ ...m, people: ev.get(m.month) ?? 0 }))
    }
    return b
  }, [master, agents, events, alhasba])

  const people: PeopleData | null = useMemo(() => (events ? peopleAnalytics(events, [], divisionMap) : null), [events, divisionMap])

  if (!board || !people) {
    return <div className="mdx-loading"><div className="spin" />Loading data from Dataverse…</div>
  }
  return <BoardViewV2 data={board} people={people} active={section} onActiveChange={onSectionChange} />
}
