import { CopilotAdoptionDashboard_SMService } from '../generated/services/CopilotAdoptionDashboard_SMService'

// ── Raw response types (field names match flow JSON exactly) ──────────
interface RawKpiRow {
  '[M_Active_users]': number
  '[M_Copilot_Licensed_Users]': number
  '[M_Adoption %]': number
  '[M_Copilot_Actions]': number
  '[M_Copilot_Hours]': number
  '[M_Copilot_Days]': number
  '[M_Copilot_Savings]': number
  '[M_Copilot_Savings_Formatted]': string
  '[Inactive users]': number
}
interface RawMonthRow {
  'Calendar_Master[Year]': number
  'Calendar_Master[Month]': number
  'Calendar_Master[Month Short]': string
  '[M_Adoption %]': number
}
interface RawAppRow {
  'Table_Copilot_Activities_Overall_Data[AppHost]': string
  '[M_Copilot_Actions]': number
  '[M_Copilot_Savings]': number
  '[M_Copilot_Hours]': number
  '[M_Copilot_Days]': number
}
interface RawDivRow {
  'Table_Copilot_Activities_Overall_Data[Division]': string
  '[M_Active_users]': number
  '[M_Copilot_Licensed_Users]': number
  '[M_Adoption %]': number
}
interface RawUserRow {
  'Table_Copilot_Activities_Overall_Data[Name]': string
  'Table_Copilot_Activities_Overall_Data[Email]': string
  '[M_Copilot_Actions]': number
}
// Note: Power BI exports this section with double-bracket field names
interface RawAppDivRow {
  'Table_Copilot_Activities_Overall_Data[AppHost]': string
  'Table_Copilot_Activities_Overall_Data[Division]': string
  '[[M_Copilot_Actions]]': number
  '[[M_Adoption %]]': number
}
interface RawOutput {
  KpiSummary:           { firstTableRows: RawKpiRow[]     }
  MonthlyTrend:         { firstTableRows: RawMonthRow[]   }
  AppSummary:           { firstTableRows: RawAppRow[]     }
  DivisionTracking:     { firstTableRows: RawDivRow[]     }
  TopUsers:             { firstTableRows: RawUserRow[]    }
  AppDivisionBrekdown?: { firstTableRows: RawAppDivRow[]  }
}

// ── Public typed interfaces ───────────────────────────────────────────
export interface CopilotKpi {
  activeUsers: number
  licensedUsers: number
  adoptionPct: number
  totalActions: number
  hoursSaved: number
  daysSaved: number
  savingsAed: number
  savingsFormatted: string
  inactiveUsers: number
}

export interface CopilotMonthRow {
  year: number
  month: number
  label: string
  adoptionPct: number
}

export interface CopilotAppRow {
  app: string
  actions: number
  savings: number
  hours: number
  days: number
}

export interface CopilotDivRow {
  division: string
  activeUsers: number
  licensedUsers: number
  adoptionPct: number
}

export interface CopilotTopUser {
  name: string
  email: string
  actions: number
}

export interface CopilotAppDivRow {
  app: string        // normalised app name (Teams deduped)
  division: string
  actions: number
  adoptionPct: number  // 0-100
}

export interface CopilotAdoptionData {
  kpi: CopilotKpi
  monthly: CopilotMonthRow[]
  apps: CopilotAppRow[]
  divisions: CopilotDivRow[]
  topUsers: CopilotTopUser[]
  appDivision: CopilotAppDivRow[]  // 7th section — may be empty if flow not yet updated
}

export interface CopilotAdoptionResult {
  data: CopilotAdoptionData | null
  error: string | null
}

// ── Transform raw response → typed data ──────────────────────────────
function transform(raw: RawOutput): CopilotAdoptionData {
  const k = raw.KpiSummary.firstTableRows[0]
  return {
    kpi: {
      activeUsers:      k['[M_Active_users]'],
      licensedUsers:    k['[M_Copilot_Licensed_Users]'],
      adoptionPct:      k['[M_Adoption %]'],
      totalActions:     k['[M_Copilot_Actions]'],
      hoursSaved:       Math.round(k['[M_Copilot_Hours]']),
      daysSaved:        Math.round(k['[M_Copilot_Days]']),
      savingsAed:       k['[M_Copilot_Savings]'],
      savingsFormatted: k['[M_Copilot_Savings_Formatted]'],
      inactiveUsers:    k['[Inactive users]'],
    },
    monthly: raw.MonthlyTrend.firstTableRows.map(r => ({
      year:        r['Calendar_Master[Year]'],
      month:       r['Calendar_Master[Month]'],
      label:       `${r['Calendar_Master[Month Short]']} '${String(r['Calendar_Master[Year]']).slice(2)}`,
      adoptionPct: Math.round(r['[M_Adoption %]'] * 100),
    })),
    apps: raw.AppSummary.firstTableRows
      .filter(r => r['Table_Copilot_Activities_Overall_Data[AppHost]'])
      .map(r => ({
        app:     r['Table_Copilot_Activities_Overall_Data[AppHost]'],
        actions: r['[M_Copilot_Actions]'],
        savings: r['[M_Copilot_Savings]'],
        hours:   r['[M_Copilot_Hours]'],
        days:    r['[M_Copilot_Days]'],
      }))
      .sort((a, b) => b.actions - a.actions),
    divisions: raw.DivisionTracking.firstTableRows.map(r => ({
      division:      r['Table_Copilot_Activities_Overall_Data[Division]'],
      activeUsers:   r['[M_Active_users]'],
      licensedUsers: r['[M_Copilot_Licensed_Users]'],
      adoptionPct:   Math.round(r['[M_Adoption %]'] * 100),
    })).sort((a, b) => b.activeUsers - a.activeUsers),
    topUsers: raw.TopUsers.firstTableRows.map(r => ({
      name:    r['Table_Copilot_Activities_Overall_Data[Name]'],
      email:   r['Table_Copilot_Activities_Overall_Data[Email]'],
      actions: r['[M_Copilot_Actions]'],
    })).sort((a, b) => b.actions - a.actions),
    appDivision: parseAppDivision(raw.AppDivisionBrekdown?.firstTableRows ?? []),
  }
}

// Normalise app names and deduplicate "Microsoft Teams" → "Teams"
function normaliseApp(raw: string): string {
  if (!raw) return raw
  if (raw === 'Microsoft Teams') return 'Teams'
  return raw
}

function parseAppDivision(rows: RawAppDivRow[]): CopilotAppDivRow[] {
  // Aggregate after deduplication (Teams + Microsoft Teams get merged)
  const map = new Map<string, CopilotAppDivRow>()
  for (const r of rows) {
    const app = normaliseApp(r['Table_Copilot_Activities_Overall_Data[AppHost]'])
    const division = r['Table_Copilot_Activities_Overall_Data[Division]']
    if (!app || !division) continue
    const key = `${app}::${division}`
    const existing = map.get(key)
    if (existing) {
      // merge Teams + Microsoft Teams
      existing.actions     += r['[[M_Copilot_Actions]]'] ?? 0
      existing.adoptionPct  = Math.max(existing.adoptionPct, Math.round((r['[[M_Adoption %]]'] ?? 0) * 100))
    } else {
      map.set(key, {
        app,
        division,
        actions:     r['[[M_Copilot_Actions]]'] ?? 0,
        adoptionPct: Math.round((r['[[M_Adoption %]]'] ?? 0) * 100),
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.actions - a.actions)
}

function isRawOutput(x: unknown): x is RawOutput {
  return (
    typeof x === 'object' && x !== null &&
    'KpiSummary' in x && 'MonthlyTrend' in x && 'AppSummary' in x
  )
}

// ── 5-min cache + in-flight deduplication ────────────────────────────
let _cache: { data: CopilotAdoptionData; ts: number } | null = null
let _inflight: Promise<CopilotAdoptionResult> | null = null
const CACHE_TTL = 5 * 60 * 1000

export class CopilotAdoptionService {
  static fetch(): Promise<CopilotAdoptionResult> {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL)
      return Promise.resolve({ data: _cache.data, error: null })
    if (_inflight) return _inflight

    _inflight = CopilotAdoptionDashboard_SMService.Run({})
      .then(result => {
        const raw = result.data?.output_
        let json: unknown
        try {
          json = raw != null
            ? (typeof raw === 'string' ? JSON.parse(raw) : raw)
            : result.data as unknown
        } catch (e) {
          throw new Error(`JSON parse failed: ${e instanceof Error ? e.message : e}`)
        }
        if (!isRawOutput(json)) throw new Error('Unexpected response shape from CopilotAdoptionDashboard_SM')
        const data = transform(json)
        _cache = { data, ts: Date.now() }
        return { data, error: null }
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[CopilotAdoption] flow error:', message)
        return { data: null, error: message }
      })
      .finally(() => { _inflight = null })

    return _inflight
  }
}
