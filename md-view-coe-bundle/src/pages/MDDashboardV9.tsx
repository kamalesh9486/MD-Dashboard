import { BoardView } from './md/boardv8'
import { type BoardData, PILLAR_C } from './md/boardv8Data'
import '../md-view-v2.css'
import '../md-view-v8.css'

/* MD View V9 — EXACT reference board. Fixed figures, exactly as the MD
   reference image. Same layout/UI as V8 (live); here the numbers never
   change — this is the target the live board is measured against. */
const EXACT: BoardData = {
  sourceNote: 'per the MD reference board (fixed)',
  overall: 33,
  kpiAgents: 75,
  kpiAgentsSub: '13 live · 88 in deployment',
  agenticServicesPct: 30, agenticServicesSub: '35 of 117 use cases',
  agenticProcessesPct: 26, agenticProcessesSub: '30 of 117 use cases',
  pillars: [
    { label: 'Customer services', pct: 30 },
    { label: 'Processes & ops', pct: 26 },
    { label: 'People', pct: 44 },
  ],
  costSaving: '273.7M', costSavingNote: 'from live AI',
  fteSaving: '≈39', fteSavingNote: '80,920 hrs ÷ 2,080',
  costAvoidance: '40.5', costAvoidanceNote: '+ AED 300K',
  invTotal: 75, invLive: '13', invDeployment: 88,
  byDivision: [['I&TF', 56], ['HR', 28], ['Finance', 27], ['Billing', 23], ['BS&HR', 12]],
  customer: { pct: '30%', servicesAgentic: '30%', interactions: '1.25M' },
  processes: {
    pct: '26%', processesAgentic: '26%', activeByDiv: '75 / 15 div',
    transformByDiv: 'I&TF leads (56)', delivery: 'Build 64% · Test 20% · Live 16%',
  },
  people: {
    pct: '44%', adoption: null, leadership: '16 sessions · 693', literacy: null,
    trained: '9,150', hours: '16,005 person-hrs', workshops: '295', certs: null, userSat: null,
  },
  portfolio: [
    { name: 'Customer', value: 35, c: PILLAR_C.Customer },
    { name: 'Processes', value: 30, c: PILLAR_C.Processes },
    { name: 'People', value: 52, c: PILLAR_C.People },
  ],
  portfolioTotal: 117, footerPortfolio: 476,
}

export default function MDDashboardV9() {
  return <BoardView data={EXACT} />
}
