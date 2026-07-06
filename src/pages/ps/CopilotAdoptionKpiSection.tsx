import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import Icon from '../../components/Icon'
import type { CopilotAdoptionData } from '../../services/CopilotAdoptionService'

const B    = '#0078d4'
const G    = '#007560'
const GOLD = '#ca8a04'
const GREY = '#e5e7eb'

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none',
  borderRadius: 9, padding: '8px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

function KpiCard({ label, value, sub, icon, color }: {
  label: string; value: string | number; sub?: string; icon: string; color: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '16px 18px',
      border: `1px solid ${color}22`, boxShadow: `0 2px 8px ${color}08`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 11, background: `${color}12`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0, color,
      }}>
        <Icon name={icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9ca3af', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: typeof value === 'string' && value.length > 8 ? 14 : 20, fontWeight: 900, color, lineHeight: 1.1 }}>{value}</div>
        {sub && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  )
}

export default function CopilotAdoptionKpiSection({ data }: { data: CopilotAdoptionData }) {
  const { kpi, monthly } = data
  const adoptionPct = Math.round(kpi.adoptionPct * 100 * 10) / 10

  const donutData = [
    { name: 'Active',   value: kpi.activeUsers },
    { name: 'Inactive', value: kpi.inactiveUsers },
  ]

  // Show last 12 months of trend
  const trendData = monthly.slice(-12)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* KPI grid – 3-col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <KpiCard label="Active Users"     value={kpi.activeUsers.toLocaleString()}   sub={`of ${kpi.licensedUsers.toLocaleString()} licensed`} icon="bi-people-fill"           color={B}    />
        <KpiCard label="Adoption Rate"    value={`${adoptionPct}%`}                  sub="of licensed seats active"                           icon="bi-graph-up-arrow"       color={G}    />
        <KpiCard label="Total Actions"    value={`${(kpi.totalActions/1e6).toFixed(2)}M`} sub={`${kpi.totalActions.toLocaleString()} actions`} icon="bi-lightning-charge-fill" color={B}    />
        <KpiCard label="Hours Saved"      value={kpi.hoursSaved.toLocaleString()}    sub="cumulative hours reclaimed"                          icon="bi-hourglass-split"      color={G}    />
        <KpiCard label="Days Saved"       value={kpi.daysSaved.toLocaleString()}     sub="equivalent working days"                             icon="bi-calendar-check-fill"  color={GOLD} />
        <KpiCard label="Cost Savings"     value={`AED ${kpi.savingsFormatted}`}      sub="estimated productivity value"                        icon="bi-currency-dirham"      color={GOLD} />
      </div>

      {/* Active vs Inactive + Monthly trend row */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

        {/* Donut */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 20px', border: `1px solid ${B}18` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e' }}>Active vs Inactive</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>
            {kpi.inactiveUsers} unlicensed / inactive out of {kpi.licensedUsers.toLocaleString()}
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58}
                dataKey="value" startAngle={90} endAngle={-270}>
                <Cell fill={B} />
                <Cell fill={GREY} />
              </Pie>
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { color: B,    label: `Active · ${kpi.activeUsers.toLocaleString()}` },
              { color: GREY, label: `Inactive · ${kpi.inactiveUsers}`, border: '1px solid #d1d5db' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, border: l.border, flexShrink: 0 }} />
                <span style={{ color: '#4b5563' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly trend */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '18px 24px', border: `1px solid ${G}18` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e' }}>Adoption Trend — Last 12 Months</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 8 }}>Sustained 100% adoption among licensed users</div>
          <ResponsiveContainer width="100%" height={155}>
            <AreaChart data={trendData} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="adoptGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={B} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={B} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis domain={[90, 101]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
                formatter={(v: unknown) => [`${v as number}%`, 'Adoption']} />
              <Area type="monotone" dataKey="adoptionPct" stroke={B} strokeWidth={2.5}
                fill="url(#adoptGrad)" dot={{ fill: B, r: 3 }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
