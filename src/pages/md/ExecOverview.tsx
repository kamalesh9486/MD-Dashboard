/* Executive Overview — recreates the handoff's exec board pixel-for-pixel,
   wired entirely to computed BoardData (mdCompute). Single responsibility:
   render the executive rollup; exceeds the 250-line component cap because it is
   one contiguous grid of ~12 panels that would only fragment if split. */
import type { BoardData } from './boardTypes'
import { T, PILLAR, HEAD_FONT, BODY_FONT } from './tokens'
import { Head, Bar, Show, NAtag } from './ui'
import { Num } from './CountUp'
import Icon from '../../components/Icon'
import { Gauge, TrendArea, PortfolioBars, ReachDonut } from './charts'

/* one row in a pillar-detail card / overall-metrics list */
function Stat({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${T.inset}` }}>
      <span style={{ font: `500 12.5px/1.3 ${BODY_FONT}`, color: T.mut2 }}>{label}</span>
      <span style={{ font: `700 13px ${BODY_FONT}`, color: T.ink }}><Show v={value} /></span>
    </div>
  )
}

function PillarCard({ name, color, pct, stats }: { name: string; color: string; pct: number | null; stats: { label: string; value: string | null | undefined }[] }) {
  return (
    <div className="mdx-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
          <span style={{ font: `600 15px ${HEAD_FONT}`, color: T.ink }}>{name}</span>
        </div>
        <span style={{ font: `800 22px ${HEAD_FONT}`, color }}><Num v={pct == null ? null : `${pct}%`} /></span>
      </div>
      <div style={{ margin: '14px 0' }}><Bar pct={pct ?? 0} color={color} height={8} /></div>
      <div>{stats.map(s => <Stat key={s.label} {...s} />)}</div>
    </div>
  )
}

export default function ExecOverview({ d }: { d: BoardData }) {
  const pillarPct = (i: number) => d.pillars[i]?.pct ?? null
  const pillarCounts = [d.totalHalf, d.totalHalfProc, d.peopleMax]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ROW 1 */}
      <div className="g4">
        {/* gauge */}
        <div className="mdx-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <Head eyebrow="Overall" title="Transformation Progress" tip="Average of the pillar %s (Services + Processes + People). Each pillar = count ÷ (its half-total) × 100." />
          <div style={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Gauge value={d.overall} size={216} /></div>
        </div>
        {/* pillar progress */}
        <div className="mdx-card">
          <Head eyebrow="Breakdown" title="Progress by Pillars" tip="Each pillar's completion vs. its 50%-mandate half-total. Services ÷ (total services ÷ 2); Processes ÷ 325; People fixed 100%." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 18 }}>
            {d.pillars.map((p, i) => {
              const color = [PILLAR.Services, PILLAR.Processes, PILLAR.People][i]
              return (
                <div key={p.label}>
                  <div style={{ font: `600 13px ${BODY_FONT}`, color: T.ink, marginBottom: 6 }}>{p.label}</div>
                  <Bar pct={p.pct ?? 0} color={color} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
                    <span style={{ font: `700 15px ${HEAD_FONT}`, color }}><Num v={p.pct == null ? null : `${p.pct}%`} /></span>
                    <span style={{ font: `500 11px ${BODY_FONT}`, color: T.mut3 }}>{pillarCounts[i] ?? ''} </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {/* agents by pillar */}
        <div className="mdx-card">
          <Head eyebrow="Portfolio" title="Agents by Pillar" tip="Every agent serves a Service AND a Process (overlap), so both pillars count the same agents. People is a fixed programme figure." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
            {d.portfolio.length ? d.portfolio.map(p => (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${T.inset}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 3, background: p.c }} />
                  <span style={{ font: `500 13px ${BODY_FONT}`, color: T.mut2 }}>{p.name}</span>
                </div>
                <span style={{ font: `700 20px ${HEAD_FONT}`, color: T.ink }}><Num v={p.value} /></span>
              </div>
            )) : <div style={{ padding: '20px 0', textAlign: 'center' }}><NAtag /></div>}
          </div>
        </div>
        {/* top-line impact (green gradient) */}
        <div className="mdx-card mdx-card--dark" style={{ background: `linear-gradient(160deg,${T.greenDeep},${T.green})`, border: '1px solid #0A6A3D', boxShadow: '0 14px 30px -18px rgba(11,122,70,.7)', color: '#EAF6EF' }}>
          <Head eyebrow="Value" title="Top-Line Impact" tip="Projected annualised benefit once the current agent portfolio is fully in use." tone="dark" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 15, marginTop: 20 }}>
            {([
              { label: 'Target Cost Saving', val: d.costSaving ?? null, icon: 'bi-currency-dirham' },
              { label: 'Target Time Saving', val: d.timeSaving == null ? null : `${d.timeSaving} hrs` },
              { label: 'Target Productivity', val: d.avgProductivity ?? null },
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
      </div>

      {/* ROW 2 */}
      <div className="gHero">
        <div className="mdx-card">
          <Head eyebrow="" title="Progress Trend by Month" tip="Pillar %s using each month's cumulative counts (Services ÷ half-total, Processes ÷ 325). The current month also includes People (fixed 100) so it matches the Transformation Progress gauge; past months average Services + Processes only." />
          <div style={{ marginTop: 8 }}><TrendArea data={d.progressByMonth ?? []} unit="Progress %" /></div>
        </div>
        <div className="mdx-card">
          <Head eyebrow="Organisation" title="Active Agents by Division" tip="Agents grouped by the division of their linked service." />
          {d.byDivision.length
            ? <ReachDonut data={d.byDivision.map(([name, value]) => ({ name, value }))} total={d.byDivision.reduce((s, [, v]) => s + v, 0)} unit="Agents" />
            : <div style={{ padding: '20px 0', textAlign: 'center' }}><NAtag /></div>}
        </div>
        <div className="mdx-card">
          <Head eyebrow="" title="Agents Inventory" tip="Total agents; In Build (service not yet live) vs. In Use (linked service has an actual go-live date)." />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {[
              { label: 'Total Agents', val: '3721', bg: T.bgGreen, fg: T.green },
              { label: 'In Build', val: '3721', bg: T.bgBlue, fg: T.blue },
              { label: 'In Use',val: d.invLive, bg: T.bgSlate, fg: T.slate },
            ].map(iv => (
              <div key={iv.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ minWidth: 44, height: 44, flex: '0 0 auto', padding: '0 14px', borderRadius: 12, background: iv.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `800 18px ${HEAD_FONT}`, color: iv.fg, whiteSpace: 'nowrap' }}><Num v={iv.val} /></div>
                <div>
                  <div style={{ font: `600 13px ${BODY_FONT}`, color: T.ink }}>{iv.label}</div>
                  <div style={{ font: `500 11px/1.3 ${BODY_FONT}`, color: T.mut3, marginTop: 3 }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 3 — pillar detail */}
      <div className="g3">
        <PillarCard name="Services" color={PILLAR.Services} pct={pillarPct(0)} stats={[
          { label: 'Total Services', value: d.customer.noServices },
          { label: 'Fully Agentic', value: d.customer.fullyAgentic },
          { label: 'Partially Agentic', value: d.customer.partiallyAgentic },
          { label: 'Agents', value: d.customer.agents },
          { label: 'Productivity Gain', value: d.customer.avgProductivity },
          { label: 'Annual Transactions', value: d.customer.interactions },
        ]} />
        <PillarCard name="Processes" color={PILLAR.Processes} pct={pillarPct(1)} stats={[
          { label: 'Total Processes', value: d.processes.noProcess },
          { label: 'Fully Agentic', value: d.processes.fullyAgentic },
          { label: 'Partially Agentic', value: d.processes.partiallyAgentic },
          { label: 'Agents', value: d.processes.aiAgents },
          { label: 'Productivity Gain', value: d.processes.avgProductivity },
          { label: 'Annual Transactions', value: d.processes.interactions },
        ]} />
        <PillarCard name="People" color={PILLAR.People} pct={pillarPct(2)} stats={[
          { label: 'Total Employees', value: d.people.adoption },
          { label: 'Leadership Adoption', value: d.people.leadership },
          { label: 'People Trained', value: d.people.trained },
          { label: 'Training Hours Delivered', value: d.people.hours },
          { label: 'Workshops / Trainings', value: d.people.workshops },
          { label: 'Certifications Earned', value: d.people.certs },
        ]} />
      </div>

      {/* ROW 4 — portfolio growth */}
      <div className="mdx-card" style={{ padding: '22px 26px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 6 }}>
          <div>
            <div style={{ font: `600 16px/1.25 ${HEAD_FONT}`, color: T.ink, marginTop: 6 }}>Agentic AI Portfolio Growth</div>
          </div>
        </div>
        <PortfolioBars data={d.portfolioGrowth ?? []} />
      </div>
    </div>
  )
}
