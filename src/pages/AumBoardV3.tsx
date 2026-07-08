import { useEffect, useMemo, useState } from 'react'
import { getAumRows, type AumRow } from './md/aumFetch'
import { aumBoardData } from './md/aumBoard'
import { peopleAnalytics, type PeopleData } from './md/aumPeople'
import { Cr978_coe_eventsesService } from '../generated/services/Cr978_coe_eventsesService'
import type { Cr978_coe_eventses } from '../generated/models/Cr978_coe_eventsesModel'
import type { BoardData } from './md/boardv8Data'
import Icon from '../components/Icon'
import { BoardViewV2 } from './md/boardV2'
import { REPORT_BOARD, REPORT_PEOPLE } from './md/consolidatedReport'
import '../md-view-v2.css'
import '../md-view-v8.css'

const EV_TIMEOUT = Symbol('ev-timeout')
type Source = 'report' | 'live'

/* Show the "Excel (static) ⇄ Dataverse (live)" data-source toggle.
   Default source is Excel (static counts) so real numbers show before the app is
   pushed; switch to Dataverse once the app is deployed. */
const SHOW_SOURCE_TOGGLE = false

/** People training KPIs are event-sourced (cr978_coe_events), not in aum. */
function peopleFromEvents(events: Cr978_coe_eventses[]) {
  const n = (x: unknown) => Number(x) || 0
  const workshops = events.length
  const trained = events.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0)
  const hours = events.reduce((s, e) => s + n(e.cr978_coe_eventduration) * n(e.cr978_coe_nofattendees), 0)
  const lead = events.filter(e => /champion|ambassador|evp|leader/i.test(e.cr978_coe_targetedaudience ?? ''))
  const leadAtt = lead.reduce((s, e) => s + n(e.cr978_coe_nofattendees), 0)
  return {
    workshops: workshops ? String(workshops) : null,
    trained: trained ? trained.toLocaleString('en-US') : null,
    hours: hours ? Math.round(hours).toLocaleString('en-US') : null,
    leadership: leadAtt ? leadAtt.toLocaleString('en-US') : null,
  }
}

/**
 * MD View v3 — same UI as v2 (tabbed card board + People analytics) with a
 * data-source toggle:
 *   • Consolidated (report) — fixed figures from the 541-record consolidated
 *     register (consolidation/DEWA_Full_Report_2.html). Default, so the mapping
 *     and layout can be reviewed against the real reported numbers now.
 *   • Live (Dataverse) — computes the same KPIs from aum_aiinitiatives +
 *     cr978_coe_events (like v2). Values differ until the consolidated register
 *     is loaded into Dataverse, after which the two converge.
 */
export default function AumBoardV3() {
  const [source, setSource] = useState<Source>('report')
  const [showInfo, setShowInfo] = useState(false)
  const [res, setRes] = useState<{ rows: AumRow[]; info: string } | null>(null)
  const [events, setEvents] = useState<Cr978_coe_eventses[] | null>(null)
  const [evInfo, setEvInfo] = useState<string>('connecting to Dataverse…')
  const [loadedLive, setLoadedLive] = useState(false)

  // Fetch live data only when the Live toggle is first selected.
  useEffect(() => {
    if (source !== 'live' || loadedLive) return
    setLoadedLive(true)
    getAumRows().then(setRes).catch(e => setRes({ rows: [], info: `Fetch error: ${String(e)}` }))
    Promise.race([
      Cr978_coe_eventsesService.getAll().then(r => r.data ?? []),
      new Promise<typeof EV_TIMEOUT>(resolve => setTimeout(() => resolve(EV_TIMEOUT), 8000)),
    ])
      .then(r => {
        if (r === EV_TIMEOUT) { setEvents([]); setEvInfo('coe_events call timed out — only reachable in a live/deployed Power Apps runtime'); return }
        const rows = r as Cr978_coe_eventses[]
        setEvents(rows)
        setEvInfo(rows.length ? `Live: ${rows.length} rows from 'cr978_coe_eventses'` : 'coe_events returned 0 rows')
      })
      .catch(e => { setEvents([]); setEvInfo(`coe_events unreachable: ${String(e)}`) })
  }, [source, loadedLive])

  const liveBoard = useMemo(() => {
    if (!res) return null
    const b = aumBoardData(res.rows, 'strict')
    if (events && events.length) {
      const p = peopleFromEvents(events)
      b.people = { ...b.people, workshops: p.workshops, trained: p.trained, hours: p.hours, leadership: p.leadership }
    }
    return b
  }, [res, events])
  const livePeople = useMemo(() => (res && events ? peopleAnalytics(events, res.rows) : null), [res, events])

  const board: BoardData | null = source === 'report' ? REPORT_BOARD : liveBoard
  const people: PeopleData | null = source === 'report' ? REPORT_PEOPLE : livePeople

  const isLive = source === 'live'
  const srcInfo = source === 'report'
    ? 'Excel (static) — fixed counts from the COE Events & initiatives register (53 events). Toggle on to read live from Dataverse once the app is pushed.'
    : (res ? `${res.info} · ${evInfo}` : evInfo)
  const toggle = (
    <div className="v3-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={isLive}
        title={isLive ? 'Dataverse (live)' : 'Excel (static)'}
        className={`v3-switch${isLive ? ' on' : ''}`}
        onClick={() => setSource(isLive ? 'report' : 'live')}
      >
        <span className="v3-switch-track"><span className="v3-switch-knob" /></span>
        <span className="v3-switch-txt">
          <Icon name={isLive ? 'bi-database-fill' : 'bi-clipboard-check-fill'} />
          {isLive ? 'Dataverse (live)' : 'Excel (static)'}
        </span>
      </button>
      <div className="v3-info">
        <button type="button" className="v3-info-btn" aria-label="Data source details" aria-expanded={showInfo} onClick={() => setShowInfo(v => !v)}>
          <Icon name="bi-info-circle" />
        </button>
        {showInfo && <div className="v3-info-pop">{srcInfo}</div>}
      </div>
    </div>
  )

  const loadingLive = source === 'live' && (!board || !people)

  return loadingLive
    ? <div className="mdv2 mdv8"><div className="state"><div className="spin" />Loading live data from Dataverse…</div></div>
    : <BoardViewV2 data={board as BoardData} people={people as PeopleData} peopleMode="cards" toolbar={SHOW_SOURCE_TOGGLE ? toggle : undefined} />

}
