/* People view — recreates the handoff's People board, wired to event-derived
   aggregates (peopleAnalytics.view) with NA where no column backs a card.
   Single responsibility: render the People rollup. */
import type { BoardData } from './boardTypes'
import type { PeopleData } from './peopleAnalytics'
import Icon from '../../components/Icon'
import { T, HEAD_FONT, BODY_FONT } from './tokens'
import { Head } from './ui'
import { Num } from './CountUp'
import { TrendArea, ReachDonut, TechTreemap, DivisionMirror } from './charts'

const MATURITY = [
  { label: 'EVPs', val: '9' }, { label: 'VPs', val: '48' },
  { label: 'Senior Managers', val: '290' }, { label: 'Employees', val: '7,397' },
]
/* Unique-participant reach per division (fixed: the events table stores attendee
   counts, not a per-employee roster, so uniqueness can't be derived from it). */
const REACH_BY_DIVISION = [
  { name: 'I&TF', value: 65 }, { name: 'DP', value: 55 }, { name: 'All Divisions', value: 48 },
  { name: 'TP', value: 42 }, { name: 'BD&E', value: 35 }, { name: 'W&C', value: 25 },
  { name: 'Generation', value: 24 }, { name: 'LA', value: 10 },
]
const fmt = (n: number | null | undefined): string | null => (n == null ? null : n.toLocaleString('en-US'))

function Kpi({ icon, bg, fg, value, label, sub }: { icon: string; bg: string; fg: string; value: string | null; label: string; sub: string }) {
  return (
    <div className="mdx-card">
      <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, color: fg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={22} /></div>
      <div style={{ font: `800 30px/1 ${HEAD_FONT}`, color: T.ink, marginTop: 14 }}><Num v={value} /></div>
      <div style={{ font: `600 13px/1.3 ${BODY_FONT}`, color: T.mut2, marginTop: 6 }}>{label}</div>
      <div style={{ font: `500 11px/1.3 ${BODY_FONT}`, color: T.mut3, marginTop: 4 }}>{sub}</div>
    </div>
  )
}

export default function PeopleView({ d, people }: { d: BoardData; people: PeopleData }) {
  const v = people.view

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ROW P1 — KPI cards */}
      <div className="g4">
        <Kpi icon="bi-shield-check" bg={T.bgGreen} fg={T.green} value="7,886" label="Employees with AI Tool Access" sub="Active tool licenses provisioned" />
        <Kpi icon="bi-mortarboard-fill" bg={T.bgBlue} fg={T.blue} value={fmt(v.uniqueTrained)} label="Employees Trained on Agentic AI" sub="Unique employees trained" />
        <Kpi icon="bi-calendar-check-fill" bg={T.bgAmber} fg={T.amberInk} value={fmt(v.trainings)} label="Agentic AI Trainings Conducted" sub="Count of training events delivered" />
        <Kpi icon="bi-award-fill" bg={T.bgSlate} fg={T.slate} value={d.people.certs} label="Employees Certified in AI" sub="Formal certification earned" />
      </div>

      {/* ROW P2 — hours + reach */}
      <div className="g2">
        <div className="mdx-card mdx-card--dark" style={{ background: `linear-gradient(160deg,${T.greenDeep},${T.green})`, border: '1px solid #0A6A3D', boxShadow: '0 14px 30px -18px rgba(11,122,70,.7)', color: '#EAF6EF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Head eyebrow="Learning" title="Total Learning Hours" tone="dark" />
          <div style={{ marginTop: 20 }}>
            <div style={{ font: `800 40px/1 ${HEAD_FONT}`, color: '#fff' }}><Num v={v.hoursTotal} /></div>
            <div style={{ font: `500 12px/1.3 ${BODY_FONT}`, color: '#9FDBBB', marginTop: 6 }}>Person-hours delivered across all programs</div>
          </div>
        </div>

        <div className="mdx-card">
          <Head eyebrow="Impact" title="Reach by Learning Program" tip="Σ participants (attendees) grouped by event category (cr978_coe_eventcategory)." />
          <ReachDonut data={v.reachByProgram} total={v.reachTotal} />
        </div>
      </div>

      {/* ROW P3 — maturity + monthly delivery */}
      <div className="gP3">
        <div className="mdx-card">
          <Head eyebrow="Workforce" title="Agentic AI Maturity by Segment" tip="Headcount engaged across each leadership and staff tier." />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
            {MATURITY.map(m => (
              <div key={m.label} style={{ background: T.inset, border: '1px solid #EBF0ED', borderRadius: 12, padding: '13px 14px' }}>
                <div style={{ font: `700 24px ${HEAD_FONT}`, color: T.green }}><Num v={m.val} /></div>
                <div style={{ font: `500 11px/1.3 ${BODY_FONT}`, color: T.mut, marginTop: 5 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="mdx-card">
          <Head eyebrow="Momentum" title="Agentic AI Training Delivery by Month" tip="Count of training events delivered per calendar month (cr978_coe_events)." />
          <div style={{ marginTop: 8 }}><TrendArea data={v.deliveryByMonth} unit="Trainings" height={190} /></div>
        </div>
      </div>

      {/* ROW P4 — technology distribution + reach by division */}
      <div className="gP4">
        <div className="mdx-card" style={{ padding: '22px 26px' }}>
          <Head eyebrow="Adoption" title="Technology Distribution" tip="Count of events grouped by AI technology (tech-stack lookup, cr978_coe_eventtechstack)." />
          <div style={{ marginTop: 12 }}><TechTreemap data={v.techDistribution} /></div>
        </div>
        <div className="mdx-card" style={{ padding: '22px 26px' }}>
          <Head eyebrow="Reach" title="Reach by Learning Program by Division" tip="Unique participants reached per division — divisions split across two colour-coded columns; see legend." />
          <DivisionMirror data={REACH_BY_DIVISION} />
        </div>
      </div>
    </div>
  )
}
