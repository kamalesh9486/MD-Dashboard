import { useEffect, useMemo, useState } from 'react'
import { Mdview_mdservicesesService } from '../generated/services/Mdview_mdservicesesService'
import type { Mdview_mdserviceses } from '../generated/models/Mdview_mdservicesesModel'
import { Mdview_mdagentsesService } from '../generated/services/Mdview_mdagentsesService'
import type { Mdview_mdagentses } from '../generated/models/Mdview_mdagentsesModel'
import { Cr978_coe_eventsesService } from '../generated/services/Cr978_coe_eventsesService'
import type { Cr978_coe_eventses } from '../generated/models/Cr978_coe_eventsesModel'
import { computeMetrics, peopleFromEvents } from './md/mdCompute'
import { peopleAnalytics, type PeopleData } from './md/peopleAnalytics'
import type { BoardData } from './md/boardTypes'
import { BoardViewV2, type BoardSectionId } from './md/Board'
import '../md-view-v2.css'
import '../md-view-v8.css'

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

  useEffect(() => {
    let active = true
    const grab = <T,>(p: Promise<{ data?: T[] }>): Promise<T[]> =>
      withTimeout(p.then(r => r.data ?? [])).then(r => (r === TIMEOUT ? [] : r)).catch(() => [])
    Promise.all([
      grab<Mdview_mdserviceses>(Mdview_mdservicesesService.getAll()),
      grab<Mdview_mdagentses>(Mdview_mdagentsesService.getAll()),
      grab<Cr978_coe_eventses>(Cr978_coe_eventsesService.getAll()),
    ]).then(([m, a, e]) => { if (!active) return; setMaster(m); setAgents(a); setEvents(e) })
    return () => { active = false }
  }, [])

  const board: BoardData | null = useMemo(() => {
    if (!master || !agents) return null
    const b = computeMetrics(master, agents)
    if (events) b.people = peopleFromEvents(events)
    return b
  }, [master, agents, events])

  const people: PeopleData | null = useMemo(() => (events ? peopleAnalytics(events, []) : null), [events])

  if (!board || !people) {
    return <div className="mdv2 mdv8"><div className="state"><div className="spin" />Loading data from Dataverse…</div></div>
  }
  return <BoardViewV2 data={board} people={people} peopleMode="cards" active={section} onActiveChange={onSectionChange} />
}
