// ── Rammas KPI engine ─────────────────────────────────────────────
// Formulas taken verbatim from RAMMAS_KPI_SPEC.md (Rammas Formula.xlsx).
// Consumes the raw Power Automate flow response (RammasAtWorkData) and
// derives the 14 official KPIs + chart datasets. No display logic here.
import { type RammasAtWorkData, oaToDate } from '../../services/RammasAtWorkService'

// ── Constants (from spec) ─────────────────────────────────────────
const USD_TO_AED         = 3.67
const INPUT_COST_PER_1K  = 0.005
const OUTPUT_COST_PER_1K = 0.015
const AED_PER_HOUR       = 50

// ── A loose row shape for any *_openai_analytics table ────────────
interface TokenRow {
  total_number_of_calls?: string
  total_input_tokens?: string
  total_output_tokens?: string
  total_tokens?: string
}

const num = (v: string | undefined): number => parseInt(v ?? '0', 10) || 0

interface ModuleAgg { calls: number; input: number; output: number; tokens: number }

function aggregate(rows: TokenRow[]): ModuleAgg {
  return rows.reduce<ModuleAgg>((a, r) => ({
    calls:  a.calls  + num(r.total_number_of_calls),
    input:  a.input  + num(r.total_input_tokens),
    output: a.output + num(r.total_output_tokens),
    tokens: a.tokens + (num(r.total_tokens) || num(r.total_input_tokens) + num(r.total_output_tokens)),
  }), { calls: 0, input: 0, output: 0, tokens: 0 })
}

// Cost (AED) for a token aggregate — spec KPI 5 / cost-by-module
function costAed(agg: ModuleAgg): number {
  const usd = (agg.input / 1000 * INPUT_COST_PER_1K) + (agg.output / 1000 * OUTPUT_COST_PER_1K)
  return usd * USD_TO_AED
}

// ── Output shapes ─────────────────────────────────────────────────
export interface RammasKpis {
  totalActions: number
  totalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  hoursSaved: number
  productivityValueAed: number
  usageCostAed: number
  netSavingsAed: number
  roiPct: number
  totalUsers: number
  activeUsers: number
  adoptionRatePct: number
  liveAgents: number
  brdGenerated: number
  kmDocsProcessed: number
}

export interface ModuleSlice { module: string; tokens: number; cost: number }
export interface ActivityPoint { date: string; BRD: number; KM: number; MYRAMMAS: number }
export interface DivisionAdoption { division: string; total: number; active: number; adoptionPct: number }
export interface DivisionEfficiency { division: string; calls: number; avgResponseMs: number }
export interface MonthlyAdoption { month: string; mau: number; registered: number; adoptionPct: number }

export interface RammasAnalytics {
  kpi: RammasKpis
  byModule: ModuleSlice[]
  activity: ActivityPoint[]
  adoptionByDivision: DivisionAdoption[]
  efficiencyByDivision: DivisionEfficiency[]
  monthlyAdoption: MonthlyAdoption[]
}

// ── Main compute ──────────────────────────────────────────────────
export function computeRammasAnalytics(data: RammasAtWorkData): RammasAnalytics {
  // BRD openai analytics is typed as conversation records; read loosely in
  // case the flow also carries token columns there (negligible if absent).
  const brdTok = aggregate(data.brd_openai_analytics as unknown as TokenRow[])
  const kmTok  = aggregate(data['km-open-ai-analytics'])
  const mrTok  = aggregate(data['myrammas-openai-analytics'])

  const total: ModuleAgg = {
    calls:  brdTok.calls  + kmTok.calls  + mrTok.calls,
    input:  brdTok.input  + kmTok.input  + mrTok.input,
    output: brdTok.output + kmTok.output + mrTok.output,
    tokens: brdTok.tokens + kmTok.tokens + mrTok.tokens,
  }

  // KPI 3 — Hours Saved  = (input + output)/1000 × 0.5 × 60
  const hoursSaved = (total.input + total.output) / 1000 * 0.5 * 60
  // KPI 4 — Productivity Value = Hours Saved × 50
  const productivityValueAed = hoursSaved * AED_PER_HOUR
  // KPI 5 — Usage Cost (AED)
  const usageCostAed = costAed(total)
  // KPI 6 — Net Savings
  const netSavingsAed = productivityValueAed - usageCostAed
  // KPI 7 — ROI (%)
  const roiPct = usageCostAed > 0 ? (netSavingsAed / usageCostAed) * 100 : 0

  // Users (KPI 8–10)
  const users = data['km-users']
  const totalUsers = users.length
  const activeUsers = users.filter(u => u.status?.toLowerCase() === 'active').length
  const adoptionRatePct = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0

  const kpi: RammasKpis = {
    totalActions:         total.calls,
    totalTokens:          total.tokens,
    totalInputTokens:     total.input,
    totalOutputTokens:    total.output,
    hoursSaved,
    productivityValueAed,
    usageCostAed,
    netSavingsAed,
    roiPct,
    totalUsers,
    activeUsers,
    adoptionRatePct,
    liveAgents:           data['myrammas-live-bot'].length,                        // KPI 11
    brdGenerated:         new Set(data.brd_records.map(b => b.brd_id)).size,        // KPI 12
    kmDocsProcessed:      new Set(data['km-document-details'].map(d => d.file_id)).size, // KPI 13
  }

  // ── Chart: token & cost by module ───────────────────────────────
  const byModule: ModuleSlice[] = [
    { module: 'KM',       tokens: kmTok.tokens,  cost: costAed(kmTok)  },
    { module: 'MyRammas', tokens: mrTok.tokens,  cost: costAed(mrTok)  },
    { module: 'BRD',      tokens: brdTok.tokens, cost: costAed(brdTok) },
  ].sort((a, b) => b.tokens - a.tokens)

  return {
    kpi,
    byModule,
    activity: buildActivity(data),
    adoptionByDivision: buildAdoption(data),
    efficiencyByDivision: buildEfficiency(data),
    monthlyAdoption: buildMonthlyAdoption(data),
  }
}

// ── Monthly Adoption Trend — MAU + adoption % over time ───────────
// MAU = distinct users active in a month (from API logs). Adoption %
// = MAU ÷ cumulative registered users up to that month. Historical
// active/inactive status isn't stored, so activity is the truth source.
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function monthKey(serial: string): string | null {
  if (!Number(serial)) return null
  return oaToDate(serial).toISOString().slice(0, 7) // YYYY-MM
}

function monthRange(min: string, max: string): string[] {
  const [y0, m0] = min.split('-').map(Number)
  const [y1, m1] = max.split('-').map(Number)
  const out: string[] = []
  let y = y0, m = m0
  while (y < y1 || (y === y1 && m <= m1)) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    if (++m > 12) { m = 1; y++ }
  }
  return out
}

function buildMonthlyAdoption(data: RammasAtWorkData): MonthlyAdoption[] {
  // user_id → email so MyRammas logs (user_id) share identity with email-keyed logs
  const idToEmail = new Map<string, string>()
  for (const u of data['km-users']) if (u.user_id && u.email_id) idToEmail.set(u.user_id, u.email_id.toLowerCase())

  // distinct active identities per month
  const activeByMonth: Record<string, Set<string>> = {}
  const mark = (month: string | null, identity: string) => {
    if (!month || !identity) return
    ;(activeByMonth[month] ??= new Set()).add(identity)
  }
  for (const l of data.brd_api_logs)         mark(monthKey(l.time_stamp), l.email_id?.toLowerCase())
  for (const l of data['km-api-logs'])        mark(monthKey(l.time_stamp), l.email_id?.toLowerCase())
  for (const l of data['myrammas-api-logs'])  mark(monthKey(l._ts), idToEmail.get(l.user_id) ?? l.user_id)

  // new registrations per month (from created_at)
  const regByMonth: Record<string, number> = {}
  for (const u of data['km-users']) {
    const mk = monthKey(u.created_at)
    if (mk) regByMonth[mk] = (regByMonth[mk] ?? 0) + 1
  }

  const keys = [...new Set([...Object.keys(activeByMonth), ...Object.keys(regByMonth)])].sort()
  if (keys.length === 0) return []

  let cumulative = 0
  return monthRange(keys[0], keys[keys.length - 1]).map(mk => {
    cumulative += regByMonth[mk] ?? 0
    const mau = activeByMonth[mk]?.size ?? 0
    const [y, m] = mk.split('-').map(Number)
    return {
      month: `${MONTH_ABBR[m - 1]} ${String(y).slice(2)}`,
      mau,
      registered: cumulative,
      adoptionPct: cumulative > 0 ? (mau / cumulative) * 100 : 0,
    }
  })
}

// ── KPI 14a — User Adoption by Division ───────────────────────────
function buildAdoption(data: RammasAtWorkData): DivisionAdoption[] {
  const divMap = new Map(data['km-division'].map(d => [d.div_id, d.div_name]))
  const acc: Record<string, { total: number; active: number }> = {}
  for (const u of data['km-users']) {
    const name = divMap.get(u.div_id) ?? 'Not Available'
    if (!acc[name]) acc[name] = { total: 0, active: 0 }
    acc[name].total++
    if (u.status?.toLowerCase() === 'active') acc[name].active++
  }
  return Object.entries(acc)
    .map(([division, s]) => ({ division, total: s.total, active: s.active, adoptionPct: s.total > 0 ? (s.active / s.total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

// ── KPI 14b — Operation Efficiency by Division ────────────────────
function buildEfficiency(data: RammasAtWorkData): DivisionEfficiency[] {
  const divMap     = new Map(data['km-division'].map(d => [d.div_id, d.div_name]))
  const emailToDiv = new Map<string, string>()
  const userToDiv  = new Map<string, string>()
  for (const u of data['km-users']) {
    const name = divMap.get(u.div_id) ?? 'Not Available'
    if (u.email_id) emailToDiv.set(u.email_id.toLowerCase(), name)
    if (u.user_id)  userToDiv.set(u.user_id, name)
  }
  const resolve = (email?: string, userId?: string): string =>
    (email && emailToDiv.get(email.toLowerCase())) ||
    (userId && userToDiv.get(userId)) || 'Unknown'

  const acc: Record<string, { calls: number; rtSum: number }> = {}
  const bump = (div: string, rt: number) => {
    if (!acc[div]) acc[div] = { calls: 0, rtSum: 0 }
    acc[div].calls++
    acc[div].rtSum += rt
  }
  for (const l of data.brd_api_logs)         bump(resolve(l.email_id),            parseFloat(l.response_time) || 0)
  for (const l of data['km-api-logs'])       bump(resolve(l.email_id),            parseFloat(l.response_time) || 0)
  for (const l of data['myrammas-api-logs']) bump(resolve(undefined, l.user_id),  parseFloat(l.response_time) || 0)

  return Object.entries(acc)
    .map(([division, s]) => ({ division, calls: s.calls, avgResponseMs: s.calls > 0 ? s.rtSum / s.calls : 0 }))
    .sort((a, b) => b.calls - a.calls)
}

// ── API Activity Over Time (last 60 days present in the data) ─────
function buildActivity(data: RammasAtWorkData): ActivityPoint[] {
  const byDay: Record<string, { BRD: number; KM: number; MYRAMMAS: number }> = {}
  const ensure = (k: string) => (byDay[k] ??= { BRD: 0, KM: 0, MYRAMMAS: 0 })
  const key = (serial: string): string | null => {
    const t = Number(serial)
    if (!t) return null
    return oaToDate(serial).toISOString().slice(0, 10)
  }
  for (const l of data.brd_api_logs)         { const k = key(l.time_stamp); if (k) ensure(k).BRD++ }
  for (const l of data['km-api-logs'])       { const k = key(l.time_stamp); if (k) ensure(k).KM++ }
  for (const l of data['myrammas-api-logs']) { const k = key(l._ts);        if (k) ensure(k).MYRAMMAS++ }

  return Object.entries(byDay)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-60)
    .map(([date, v]) => ({ date: date.slice(5), ...v }))
}

// ── Number formatting (spec "Number Formatting Guide") ────────────
export function compact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000)     return `${(n / 1_000).toFixed(1)}K`
  return Math.round(n).toLocaleString()
}

export const fmtAed     = (n: number): string => `AED ${compact(n)}`
export const fmtPct     = (n: number): string => `${compact(n)}%`
export const fmtInt     = (n: number): string => Math.round(n).toLocaleString()
export const fmtDecimal = (n: number, d = 1): string => n.toFixed(d)
