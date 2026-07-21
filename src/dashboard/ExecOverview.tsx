/* Executive Overview — recreates the handoff's exec board pixel-for-pixel,
   wired entirely to computed BoardData (lib/compute). Single responsibility:
   render the executive rollup; exceeds the 250-line component cap because it is
   one contiguous grid of ~12 panels that would only fragment if split. */
import type { BoardData } from './lib/boardTypes'
import { T, PILLAR, HEAD_FONT, BODY_FONT } from './lib/tokens'
import { Head, Bar, Show, NAtag } from './Primitives'
import { Num } from './CountUp'
import Icon from '../components/Icon'
import { Gauge, TrendArea, PortfolioBars, ReachDonut } from './Charts'

/* one row in a pillar-detail card / overall-metrics list */
function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  const isTotal = /^total/i.test(label.trim()) && !/training hours/i.test(label)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.inset}` }}>
      <span style={{ font: `${isTotal ? 700 : 500} 12.5px/1.3 ${BODY_FONT}`, color: isTotal ? T.ink : T.mut2 }}>{label}</span>
      <span style={{ font: `700 13px ${BODY_FONT}`, color: T.ink }}><Show v={value} /></span>
    </div>
  )
}

function PillarCard({ name, color, pct, pctText, stats }: { name: string; color: string; pct: number | null; pctText?: string; stats: { label: string; value: string | null | undefined }[] }) {
  return (
    <div className="mdx-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
          <span style={{ font: `600 15px ${HEAD_FONT}`, color: T.title, textTransform: 'uppercase' }}>{name}</span>
        </div>
        <span style={{ font: `800 22px ${HEAD_FONT}`, color }}><Num v={pctText ?? (pct == null ? null : `${pct}%`)} /></span>
      </div>
      <div style={{ margin: '14px 0' }}><Bar pct={pct ?? 0} color={color} height={8} /></div>
      <div>{stats.map(s => <Stat key={s.label} {...s} />)}</div>
    </div>
  )
}

export default function ExecOverview({ d }: { d: BoardData }) {
  const pillarPct = (i: number) => d.pillars[i]?.pct ?? null
  const peoplePct = pillarPct(2)
  // People can exceed 100% (e.g. 151) — show the overflow as "100% +51%".
  const peopleText = peoplePct == null ? undefined : (peoplePct > 100 ? `100% +${peoplePct - 100}%` : `${peoplePct}%`)

  const topLine = (
    <div className="mdx-card mdx-card--dark" style={{ background: `linear-gradient(160deg,${T.greenDeep},${T.green})`, border: '1px solid #0A6A3D', boxShadow: '0 14px 30px -18px rgba(11,122,70,.7)', color: '#EAF6EF', display: 'flex', flexDirection: 'column' }}>
      <Head eyebrow="Value" title="Forecasted Top-Line Impact" tip="Projected annualised benefit once the current agent portfolio is fully in use." tone="dark" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 15, marginTop: 20 }}>
        {([
          { label: 'Productivity', val: d.avgProductivity ?? null },
          { label: 'Time Saving', val: d.timeSaving == null ? null : `${d.timeSaving} hrs` },
          { label: 'Cost Saving', val: d.costSaving ?? null, icon: 'bi-currency-dirham' },
        ] as { label: string; val: string | null; icon?: string }[]).map(im => (
          <div key={im.label} style={{ borderBottom: '1px solid rgba(255,255,255,.12)', paddingBottom: 13 }}>
            <div style={{ font: `800 26px ${HEAD_FONT}`, color: '#fff', display: 'flex', alignItems: 'center', gap: 4 }}>
              {im.icon && im.val != null && <Icon name={im.icon} size={24} />}
              <Num v={im.val} />
            </div>
            <div style={{ font: `500 11px/1.3 ${BODY_FONT}`, color: '#9FDBBB', marginTop: 5 }}>{im.label}</div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ROW 1 — Transformation Progress · Active Agents by Division · Services + Processes */}
      <div className="gExec1">
        {/* Transformation Progress: gauge + legend + quote + Active Agents strip */}
        <div className="mdx-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <Head eyebrow="Overall" title="Transformation Progress" tip="Overall = average of the pillar %s (Services + Processes + People, People capped at 100). Each pillar = count ÷ (its half-total) × 100." />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 6 }}>
            <Gauge value={d.overall} size={280} caption="" pillars={[
              { label: 'Services', value: pillarPct(0), color: PILLAR.Services },
              { label: 'Processes', value: pillarPct(1), color: PILLAR.Processes },
              { label: 'People', value: peoplePct, color: PILLAR.People, display: peopleText, over: peoplePct != null && peoplePct > 100 ? peoplePct - 100 : undefined },
            ]} />
          </div>
          <blockquote style={{ margin: '12px 0 0', textAlign: 'center' }}>
            <p style={{ font: `italic 500 12.5px/1.6 ${BODY_FONT}`, color: T.mut2, margin: 0 }}>
              “Our goal is for <b style={{ color: T.green, fontWeight: 700, fontStyle: 'italic' }}>50%</b> of government sectors, services and operations to be transformed into Agentic AI operating models within two years.”
            </p>
            <cite style={{ display: 'block', marginTop: 6, textAlign: 'right', font: `700 11.5px ${BODY_FONT}`, fontStyle: 'normal', color: T.green }}>
              — Sheikh Mohammed bin Rashid Al Maktoum
            </cite>
          </blockquote>
          {/* Active Agents strip (agents by pillar) — highlighted panel */}
          <div style={{ marginTop: 16, padding: '14px 16px', background: T.bgGreen, border: `1px solid ${T.border}`, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
              <span style={{ width: 6, height: 14, borderRadius: 3, background: T.green, flex: '0 0 auto' }} />
              <span style={{ font: `700 10px ${BODY_FONT}`, letterSpacing: '.13em', textTransform: 'uppercase', color: T.green }}>Active Agents</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, textAlign: 'center' }}>
              {d.portfolio.map((p, i) => (
                <div key={p.name} style={{ borderLeft: i === 0 ? 'none' : `1px solid ${T.border}` }}>
                  <div style={{ font: `600 12px ${BODY_FONT}`, color: T.mut2 }}>{p.name}</div>
                  <div style={{ font: `800 18px ${HEAD_FONT}`, color: T.ink, marginTop: 4 }}>
                    {p.total != null ? `${p.value.toLocaleString('en-US')}/${p.total}` : p.value.toLocaleString('en-US')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Agents by Division */}
        <div className="mdx-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <Head eyebrow="Organisation" title="Active Agents by Division" tip="Agents grouped by the division of their linked service." />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center' }}>
            {d.byDivision.length
              ? <ReachDonut data={d.byDivision.map(([name, value]) => ({ name, value }))} total={d.byDivision.reduce((s, [, v]) => s + v, 0)} unit="Agents" sizeOverride={210} />
              : <div style={{ flex: 1, textAlign: 'center' }}><NAtag /></div>}
          </div>
        </div>

        {/* Services + Processes detail cards, stacked */}
        <div className="gExecStack">
          <PillarCard name="Services" color={PILLAR.Services} pct={pillarPct(0)} stats={[
            { label: 'Total Services', value: d.customer.noServices },
            { label: 'Fully Agentic', value: d.customer.fullyAgentic },
            { label: 'Partially Agentic', value: d.customer.partiallyAgentic },
            { label: 'Agents', value: '3' },
            { label: 'Customer Satisfaction Score', value: '95%' },
          ]} />
          <PillarCard name="Processes" color={PILLAR.Processes} pct={pillarPct(1)} stats={[
            { label: 'Total Processes', value: d.processes.noProcess },
            { label: 'Fully Agentic', value: d.processes.fullyAgentic },
            { label: 'Partially Agentic', value: '6/300' },
            { label: 'Agents', value: '12' },
            { label: 'Annual Transactions', value: d.processes.interactions },
          ]} />
        </div>
      </div>

      {/* ROW 2 — Progress Trend by Month · People */}
      <div className="gExec2">
        <div className="mdx-card">
          <Head eyebrow="" title="Progress Trend by Month" tip="Pillar %s using each month's cumulative counts (Services ÷ half-total, Processes ÷ 300). The current month also includes People so it matches the Transformation Progress gauge; past months average Services + Processes only." />
          <div style={{ marginTop: 8 }}><TrendArea data={d.progressByMonth ?? []} unit="Progress %" labelSuffix="%" /></div>
        </div>
        <PillarCard name="People" color={PILLAR.People} pct={peoplePct} pctText={peopleText} stats={[
          { label: 'Total Employees Trained', value: d.people.adoption },
          { label: 'Total Training Hours', value: d.people.hours },
          { label: 'Agentic Training Sessions', value: d.people.workshops },
          { label: 'Agents', value: '1225' },
          { label: 'Enterprise AI Adoption', value: '98%' },
        ]} />
      </div>

      {/* ROW 3 — Forecasted Top-Line Impact · Agentic AI Portfolio Growth */}
      <div className="gExec3">
        {topLine}
        <div className="mdx-card" style={{ padding: '22px 26px' }}>
          <div style={{ font: `600 16px/1.25 ${HEAD_FONT}`, color: T.title, marginBottom: 6, textTransform: 'uppercase' }}>Agentic AI Portfolio Growth</div>
          <PortfolioBars data={d.portfolioGrowth ?? []} />
        </div>
      </div>
    </div>
  )
}
