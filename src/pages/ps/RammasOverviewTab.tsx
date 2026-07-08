import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer,
  Line, XAxis, YAxis, CartesianGrid, Bar, ComposedChart,
} from 'recharts'
import { type RammasAtWorkData } from '../../services/RammasAtWorkService'
import {
  computeRammasAnalytics, compact, fmtAed, fmtPct, fmtInt, fmtDecimal,
} from './rammasKpis'
import Icon from '../../components/Icon'
import '../../rammas-overview.css'

const COLOR = '#00695c'
const GOLD  = '#ca8a04'
const TEAL2 = '#004937'

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9,
  padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

const MODULE_COLORS: Record<string, string> = { KM: COLOR, MyRammas: GOLD, BRD: TEAL2 }

interface KpiDef {
  label: string; value: React.ReactNode; sub: string
  icon: string; color: string; formula: string
}

function KpiCard({ label, value, sub, icon, color, formula }: KpiDef) {
  return (
    <div className="rk-card" style={{ '--rk-accent': color } as React.CSSProperties}>
      <div className="rk-card-head">
        <div className="rk-icon" style={{ background: `${color}18` }}><Icon name={icon} aria-hidden="true" /></div>
        <button type="button" className="rk-info" aria-label={`How ${label} is calculated`}>
          <Icon name="bi-info-circle" aria-hidden="true" />
          <span className="rk-tip" role="tooltip">
            <span className="rk-tip-head">How it's calculated</span>
            {formula}
          </span>
        </button>
      </div>
      <div className="rk-value">{value}</div>
      <div className="rk-label">{label}</div>
      <div className="rk-sub">{sub}</div>
    </div>
  )
}

function Section({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="rk-section">
      <span className="rk-section-title">
        <Icon name={icon} style={{ color: COLOR }} aria-hidden="true" />
        {title}
      </span>
      <span className="rk-section-line" />
    </div>
  )
}

function ChartCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rk-chart-card">
      <div className="rk-chart-title">
        <Icon name={icon} style={{ color: COLOR }} aria-hidden="true" />
        {title}
      </div>
      {children}
    </div>
  )
}

export default function RammasOverviewTab({ data }: { data: RammasAtWorkData }) {
  const a = useMemo(() => computeRammasAnalytics(data), [data])
  const k = a.kpi

  const valueCards: KpiDef[] = [
    { label: 'Total Actions',      value: compact(k.totalActions),          sub: 'AI API calls · all modules',   icon: 'bi-activity',       color: COLOR, formula: 'Σ of total_number_of_calls across the BRD, KM and MyRammas OpenAI analytics tables.' },
    { label: 'Total Tokens',       value: compact(k.totalTokens),           sub: 'input + output tokens',        icon: 'bi-cpu-fill',       color: TEAL2, formula: 'Σ of total_tokens (input + output) across all three modules.' },
    { label: 'Hours Saved',        value: `${compact(k.hoursSaved)} hrs`,   sub: 'productivity time recovered',  icon: 'bi-clock-history',  color: GOLD,  formula: '(Input + Output tokens) ÷ 1,000 × 0.5 × 60.' },
    { label: 'Productivity Value', value: fmtAed(k.productivityValueAed),   sub: `${fmtInt(k.hoursSaved)} hrs × AED 50`, icon: 'bi-graph-up-arrow', color: COLOR, formula: 'Hours Saved × AED 50 (productivity value per hour saved).' },
    { label: 'Usage Cost',         value: fmtAed(k.usageCostAed),           sub: 'OpenAI token spend',           icon: 'bi-currency-dirham',color: TEAL2, formula: '[(Input ÷ 1K × $0.005) + (Output ÷ 1K × $0.015)] × 3.67 AED/USD.' },
    { label: 'Net Savings',        value: fmtAed(k.netSavingsAed),          sub: 'value − cost',                 icon: 'bi-trophy-fill',    color: COLOR, formula: 'Productivity Value − Usage Cost.' },
    { label: 'ROI',                value: fmtPct(k.roiPct),                 sub: 'return on AI investment',      icon: 'bi-bullseye',       color: GOLD,  formula: '(Net Savings ÷ Usage Cost) × 100.' },
  ]

  const adoptionCards: KpiDef[] = [
    { label: 'Total Users',        value: fmtInt(k.totalUsers),                 sub: 'registered on platform',        icon: 'bi-people-fill',       color: TEAL2, formula: 'Count of all rows in the users table.' },
    { label: 'Active Users',       value: fmtInt(k.activeUsers),                sub: `of ${k.totalUsers} registered`, icon: 'bi-check-circle-fill', color: COLOR, formula: 'Count of users where status = "active".' },
    { label: 'Adoption Rate',      value: `${fmtDecimal(k.adoptionRatePct)}%`,  sub: 'active ÷ total users',          icon: 'bi-speedometer2',      color: GOLD,  formula: '(Active Users ÷ Total Users) × 100.' },
    { label: 'Live Agents',        value: fmtInt(k.liveAgents),                 sub: 'published MyRammas bots',       icon: 'bi-robot',             color: COLOR, formula: 'Count of all rows in the myrammas_live_bots table (published bots).' },
    { label: 'BRD Generated',      value: fmtInt(k.brdGenerated),               sub: 'unique BRD documents',          icon: 'bi-file-text',         color: TEAL2, formula: 'Count of distinct brd_id values in the brd_records table.' },
    { label: 'KM Docs Processed',  value: fmtInt(k.kmDocsProcessed),            sub: 'knowledge base documents',      icon: 'bi-book-fill',         color: COLOR, formula: 'Count of distinct file_id values in km_document_details.' },
  ]

  return (
    <div className="rk-overview">

      {/* Value & cost KPIs */}
      <Section icon="bi-currency-dirham" title="Value & Cost Impact" />
      <div className="rk-grid">
        {valueCards.map(c => <KpiCard key={c.label} {...c} />)}
      </div>

      {/* Adoption KPIs */}
      <Section icon="bi-people-fill" title="Users & Platform Adoption" />
      <div className="rk-grid">
        {adoptionCards.map(c => <KpiCard key={c.label} {...c} />)}
      </div>

      {/* Token & cost donuts */}
      <Section icon="bi-pie-chart-fill" title="Distribution by Module" />
      <div className="rk-2col">
        <ChartCard title="Token Usage by Module" icon="bi-pie-chart-fill">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={a.byModule} dataKey="tokens" nameKey="module" cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3}>
                {a.byModule.map(m => <Cell key={m.module} fill={MODULE_COLORS[m.module] ?? '#6b7280'} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v) => [compact(Number(v)), 'Tokens']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cost Distribution by Module" icon="bi-currency-dirham">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={a.byModule} dataKey="cost" nameKey="module" cx="50%" cy="50%" innerRadius={58} outerRadius={90} paddingAngle={3}>
                {a.byModule.map(m => <Cell key={m.module} fill={MODULE_COLORS[m.module] ?? '#6b7280'} />)}
              </Pie>
              <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} formatter={(v) => [fmtAed(Number(v)), 'Cost']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Monthly adoption trend — MAU bars + adoption % line */}
      <Section icon="bi-graph-up-arrow" title="Adoption Over Time" />
      <ChartCard title="Monthly Adoption Trend" icon="bi-people-fill">
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={a.monthlyAdoption} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
            <Tooltip
              contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
              formatter={(v, n) => n === 'Adoption %' ? [`${fmtDecimal(Number(v))}%`, n] : [fmtInt(Number(v)), n]}
            />
            <Legend formatter={(v) => <span style={{ fontSize: 11, color: '#374151' }}>{v}</span>} />
            <Bar  yAxisId="left"  dataKey="mau"         name="Active Users" fill={COLOR} radius={[5, 5, 0, 0]} barSize={22} />
            <Line yAxisId="right" dataKey="adoptionPct" name="Adoption %"   stroke={GOLD} strokeWidth={2.5} dot={{ r: 3, fill: GOLD }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="rk-sub" style={{ margin: '2px 2px 6px' }}>
          Active users = distinct users making API calls each month · Adoption % = active ÷ cumulative registered users
        </div>
      </ChartCard>

    </div>
  )
}
