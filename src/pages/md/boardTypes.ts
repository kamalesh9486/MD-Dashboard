/* Shared colour tokens + the display model (`BoardData`) for the MD Dashboard.
   Kept in its own file so Board.tsx only exports the component
   (satisfies react-refresh/only-export-components). Every value is pre-computed
   to string | null | number by computeMetrics(); `null` string fields render as NA. */

/* ── softened palette ──────────────────────────────────── */
export const C = { blue: '#5b9bd5', green: '#4bb18f', gold: '#d9a53b', teal: '#0a6e57', tx: '#1c1c1e' }
export const PILLAR_C = { Customer: C.blue, Processes: C.green, People: C.gold }

export interface BoardData {
  /** Transformation Progress gauge — average of the pillar %s (incl. People). */
  overall: number | null
  /** Overall Metrics "Overall Readiness" — average of Services / Processes / People. */
  overallReadiness?: number | null
  kpiAgents: number
  agenticServicesPct: number | null
  agenticProcessesPct: number | null
  pillars: { label: string; pct: number | null }[]
  costSaving: string | null
  fteSaving: string | null
  invTotal: number; invLive: string | null; invDeployment: number | null
  byDivision: [string, number][]
  /** Optional per-pillar division breakdown (used by the Services sub-tab chart). */
  divByPillar?: { Customer: [string, number][]; Processes: [string, number][]; People: [string, number][] }
  customer: {
    pct: string | null; servicesAgentic: string | null; interactions: string | null
    noServices?: string | null; avgProductivity?: string | null
    /** Eligibility mix (mdview_eligibility) + agent count. */
    fullyAgentic?: string | null; partiallyAgentic?: string | null; agents?: string | null
  }
  processes: {
    pct: string | null; processesAgentic: string | null; activeByDiv: string | null; transformByDiv: string | null; delivery: string | null
    noProcess?: string | null; aiAgents?: string | null; avgProductivity?: string | null; systemsIntegrated?: string | null
    /** Eligibility mix (distinct processes) + annual transactions. */
    fullyAgentic?: string | null; partiallyAgentic?: string | null; interactions?: string | null
  }
  /** Per-pillar half-total / max — the Progress-by-Pillars scale ends. */
  totalHalf?: number; totalHalfProc?: number; peopleMax?: number
  /** Fixed People value for the Overall Metrics section. */
  peopleMetricPct?: number
  people: { pct: string | null; adoption: string | null; leadership: string | null; literacy: string | null; trained: string | null; hours: string | null; workshops: string | null; certs: string | null; userSat: string | null }
  /** Agents by Pillar tiles (Services / Processes / People). */
  portfolio: { name: string; value: number; c: string }[]
  /** Top-Line Impact — average productivity gain across services. */
  avgProductivity?: string | null
  /** Cumulative transformation % per month (Progress Trend panel). */
  progressByMonth?: { name: string; value: number }[]
  /** Month-wise cumulative growth per pillar (DEWA Agentic AI Portfolio Growth chart). */
  portfolioGrowth?: { month: string; customer: number; processes: number; people: number }[]
}
