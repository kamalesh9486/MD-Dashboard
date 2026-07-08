import { useEffect, useMemo, useState } from 'react'
import { getAumRows, type AumRow } from './md/aumFetch'
import { aumBoardData } from './md/aumBoard'
import { peopleAnalytics } from './md/aumPeople'
import { Cr978_coe_eventsesService } from '../generated/services/Cr978_coe_eventsesService'
import type { Cr978_coe_eventses } from '../generated/models/Cr978_coe_eventsesModel'
import Icon from '../components/Icon'
import { BoardViewV2 } from './md/boardV2'
import '../md-view-v2.css'
import '../md-view-v8.css'

const EV_TIMEOUT = Symbol('ev-timeout')

/**
 * MD View v2 — the v1 board rebuilt as four independently switchable tabs with
 * card KPIs and an event-driven People tab. Strict data only: values come from
 * aum_aiinitiatives (initiatives) and cr978_coe_events (events); anything with
 * no backing data renders as NA — no dummy data, no proxy estimates.
 */
export default function AumBoardV2() {
  const [res, setRes] = useState<{ rows: AumRow[]; info: string } | null>(null)
  const [events, setEvents] = useState<Cr978_coe_eventses[] | null>(null)
  const [evInfo, setEvInfo] = useState<string>('Loading coe_events…')
  useEffect(() => {
    getAumRows().then(setRes).catch(e => setRes({ rows: [], info: `Fetch error: ${String(e)}` }))
    Promise.race([
      Cr978_coe_eventsesService.getAll().then(r => r.data ?? []),
      new Promise<typeof EV_TIMEOUT>(resolve => setTimeout(() => resolve(EV_TIMEOUT), 8000)),
    ])
      .then(r => {
        if (r === EV_TIMEOUT) {
          setEvents([])
          setEvInfo('coe_events call timed out — only reachable in a live/deployed Power Apps runtime')
          return
        }
        const rows = r as Cr978_coe_eventses[]
        setEvents(rows)
        setEvInfo(rows.length ? `Live: ${rows.length} rows from 'cr978_coe_eventses'` : 'coe_events returned 0 rows')
      })
      .catch(e => { setEvents([]); setEvInfo(`coe_events unreachable: ${String(e)}`) })
  }, [])

  const data = useMemo(() => (res ? aumBoardData(res.rows, 'strict') : null), [res])
  const people = useMemo(() => (res && events ? peopleAnalytics(events, res.rows) : null), [res, events])

  if (!data || !people || !res) return (
    <div className="mdv2 mdv8"><div className="state"><div className="spin" />Loading live data…</div></div>
  )

  const noData = res.rows.length === 0
  const noEvents = events != null && events.length === 0
  return (
    <>
      {noData && (
        <div className="mdv2 mdv8" style={{ marginBottom: -8 }}>
          <div className="panel" style={{ borderLeft: '3px solid #ca8a04' }}>
            <div className="ph" style={{ marginBottom: 0 }}>
              <div className="ic" style={{ background: 'rgba(202,138,4,.14)', color: '#9a6c08' }}><Icon name="bi-info-circle-fill" /></div>
              <div>
                <h3>No live aum_aiinitiatives data reachable</h3>
                <div className="s"><b>Fetch status:</b> {res.info}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      {noEvents && (
        <div className="mdv2 mdv8" style={{ marginBottom: -8 }}>
          <div className="panel" style={{ borderLeft: '3px solid #ca8a04' }}>
            <div className="ph" style={{ marginBottom: 0 }}>
              <div className="ic" style={{ background: 'rgba(202,138,4,.14)', color: '#9a6c08' }}><Icon name="bi-info-circle-fill" /></div>
              <div>
                <h3>People KPIs show NA — no coe_events data loaded</h3>
                <div className="s"><b>coe_events status:</b> {evInfo}</div>
              </div>
            </div>
          </div>
        </div>
      )}
      <BoardViewV2 data={data} people={people} />
    </>
  )
}
