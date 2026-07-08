/* Shared constants + display model for the V8 (live) / V9 (exact) MD boards.
   Kept separate from boardv8.tsx so that file only exports the component
   (satisfies react-refresh/only-export-components). */

/* ── softened palette ──────────────────────────────────── */
export const C = { blue: '#5b9bd5', green: '#4bb18f', gold: '#d9a53b', teal: '#0a6e57', tx: '#1c1c1e' }
export const PILLAR_C = { Customer: C.blue, Processes: C.green, People: C.gold }

/* ── shared display model — every value pre-computed to string|null|number.
   `null` string fields render as NA. Fed by the LIVE aggregator (V8) or the
   EXACT reference figures (V9). ─────────────────────────── */
export interface BoardData {
  sourceNote: string
  overall: number | null
  kpiAgents: number
  kpiAgentsSub: string
  agenticServicesPct: number | null
  agenticServicesSub: string
  agenticProcessesPct: number | null
  agenticProcessesSub: string
  pillars: { label: string; pct: number | null }[]
  costSaving: string | null; costSavingNote: string
  fteSaving: string | null; fteSavingNote: string
  costAvoidance: string | null; costAvoidanceNote: string
  invTotal: number; invLive: string; invDeployment: number
  byDivision: [string, number][]
  customer: { pct: string | null; servicesAgentic: string | null; interactions: string | null }
  processes: { pct: string | null; processesAgentic: string | null; activeByDiv: string; transformByDiv: string | null; delivery: string | null }
  people: { pct: string | null; adoption: string | null; leadership: string | null; literacy: string | null; trained: string | null; hours: string | null; workshops: string | null; certs: string | null; userSat: string | null }
  portfolio: { name: string; value: number; c: string }[]
  portfolioTotal: number
  footerPortfolio: number
}
