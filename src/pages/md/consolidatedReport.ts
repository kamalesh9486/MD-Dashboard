/* Fixed consolidated figures transcribed from DEWA_Full_Report_2.html — the
   541-record reconciled register (6 sources). MD View v3 shows these in
   "Consolidated (report)" mode. When the consolidated register is loaded into
   Dataverse, the "Live" toggle will compute the same KPIs and the two should
   converge. Update the values here if the report is regenerated.
   Source file: consolidation/DEWA_Full_Report_2.html */
import type { BoardData } from './boardv8Data'
import { C } from './boardv8Data'
import type { PeopleData } from './aumPeople'

export const REPORT_BOARD: BoardData = {
  sourceNote: 'consolidated register — 541 records · 6 sources (DEWA report)',
  // Overall Readiness is the average of the 3 pillar %s; the pillar split is not
  // solidly evidenced, so it (and this average) render NA.
  overall: null,
  kpiAgents: 75,
  kpiAgentsSub: 'AI applications + deployment projects',
  agenticServicesPct: 30, agenticServicesSub: '35 of 117 use cases',
  agenticProcessesPct: 26, agenticProcessesSub: '30 of 117 use cases',
  // Pillar split not evidenced → NA (no 0). Rendered as NA in Progress by Pillars.
  pillars: [
    { label: 'Customer services', pct: null },
    { label: 'Processes & ops', pct: null },
    { label: 'People', pct: null },
  ],
  costSaving: '273.7M', costSavingNote: 'AI apps 252.3M + agents 21.4M · excl. 880M outlier',
  fteSaving: '≈39', fteSavingNote: '80,920 hrs ÷ 2,080',
  costAvoidance: '40.5', costAvoidanceNote: '+ AED 300K other · FTE',
  invTotal: 75, invLive: null, invDeployment: null,
  byDivision: [['I&TF', 56], ['HR', 28], ['Finance', 27], ['Billing', 23], ['BS&HR', 12]],
  // Customer & Processes domain tabs: no evidenced data → all NA.
  customer: { pct: null, servicesAgentic: null, interactions: null },
  processes: {
    pct: null, processesAgentic: null, activeByDiv: null,
    transformByDiv: null, delivery: null,
  },
  people: {
    pct: '44%', adoption: null, leadership: '693', literacy: null,
    trained: '9,150', hours: '16,005', workshops: '295', certs: null, userSat: null,
  },
  // Pillar split (Customer/Processes/People) is NOT evidenced in the static
  // register — the 108/315/118 breakdown had no solid backing, so the static
  // source leaves it empty and the panel renders NA. The live Dataverse source
  // computes the split from actual use-case domains.
  portfolio: [],
  portfolioTotal: 541, footerPortfolio: 541,
}

/* People tab — report gives the headline event KPIs (trained / hours /
   workshops / leadership). The by-month and by-category series are the real
   static counts from the COE Events register (COE Events - FINAL import.xlsx,
   53 events); the live Dataverse toggle recomputes them from cr978_coe_events.
   No fabricated chart data. */
export const REPORT_PEOPLE: PeopleData = {
  eventsLoaded: true,
  // People KPIs — 100% from cr978_coe_events (COE Events - FINAL import.xlsx, 53 events).
  // Metrics with no event column (adoption rate, literacy, certs, satisfaction) are excluded → NA.
  kpis: [
    { key: 'equipped',   label: 'People equipped in AI',   icon: 'bi-people-fill',         accent: C.gold,  value: '2,205',           formula: 'Σ attendees across all events (cr978_coe_nofattendees).' },
    { key: 'events',     label: 'AI Training Delivered',    icon: 'bi-calendar-check-fill', accent: C.blue,  value: '53',              formula: 'COUNT of training events (cr978_coe_events).' },
    { key: 'hackathons', label: 'Hackathons held',          icon: 'bi-trophy-fill',         accent: C.green, value: '1',               formula: 'COUNT of events where type = Hackathon.' },
    { key: 'workshops',  label: 'Workshops held',           icon: 'bi-tools',               accent: C.teal,  value: null,              formula: 'COUNT of events where type = Workshop (none in the data → NA).' },
    { key: 'webinars',   label: 'Webinars & ILT sessions',  icon: 'bi-camera-video-fill',   accent: C.blue,  value: '50',              formula: 'COUNT of events where type ∈ {Webinar, Instructor-Led Training}.' },
    { key: 'hours',      label: 'Training hours delivered', icon: 'bi-clock-history',       accent: C.gold,  value: '15,856 person-hrs', formula: 'Σ (event duration × attendees).' },
    { key: 'attendance', label: 'Avg attendance rate',      icon: 'bi-graph-up-arrow',      accent: C.green, value: '77%',             formula: 'Attended ÷ Invited × 100, over events that recorded invitees.' },
    { key: 'leadership', label: 'Leadership sessions',      icon: 'bi-award-fill',          accent: C.teal,  value: '1',               formula: 'COUNT of events whose audience ~ leader / champion / EVP (26 reached).' },
  ],
  byCategory: [
    { name: 'Instructor-Led Training', value: 50 },
    { name: 'Hackathon', value: 1 },
  ],
  byMonth: [
    { name: 'Jan 26', value: 3 },
    { name: 'Feb 26', value: 5 },
    { name: 'Mar 26', value: 4 },
    { name: 'Apr 26', value: 3 },
    { name: 'May 26', value: 3 },
    { name: 'Jun 26', value: 27 },
    { name: 'Jul 26', value: 6 },
  ],
  arrows: [
    { key: 'attendance', label: 'Invited → Attended', icon: 'bi-people-fill',
      beforeLabel: 'Invited', before: '2,363', afterLabel: 'Attended', after: '1,816',
      note: null },
    { key: 'hours', label: 'Hours saved: monthly → yearly', icon: 'bi-hourglass-split',
      beforeLabel: 'Per month (avg)', before: '6,743 hrs', afterLabel: 'Per year', after: '80,920 hrs',
      note: null },
  ],
  // People-2 detail distributions — real counts from COE Events - FINAL import.xlsx
  // (tech stack / trainer / audience columns). Used to fill the People tab charts
  // in the static (Excel) source; the live source recomputes them from Dataverse.
  p2: {
    kpis: [],
    byMonth: [
      { name: 'Jan 26', value: 3 }, { name: 'Feb 26', value: 5 }, { name: 'Mar 26', value: 4 },
      { name: 'Apr 26', value: 3 }, { name: 'May 26', value: 3 }, { name: 'Jun 26', value: 27 }, { name: 'Jul 26', value: 6 },
    ],
    byTech: [
      { name: 'Power BI', value: 20 }, { name: 'Copilot', value: 20 },
      { name: 'AI Awareness', value: 4 }, { name: 'Claude Code', value: 2 }, { name: 'Claude Skill', value: 1 },
    ],
    byCategory: [
      { name: 'ILT', value: 50 }, { name: 'Hackathon', value: 1 },
    ],
    byTrainer: [
      { name: 'COO Team', value: 23 }, { name: 'Microsoft', value: 9 }, { name: 'Anusha', value: 8 },
      { name: 'Ankur', value: 6 }, { name: 'Udemy Instructor, Ed Doner', value: 2 }, { name: 'CFW', value: 1 },
    ],
    // Division-wise event count (COE Events - FINAL import.xlsx, 53 events; blanks excluded).
    byDivision: [
      { name: 'All Divisions', value: 37 }, { name: 'Distribution Power', value: 3 },
      { name: 'Innovation & The Future', value: 2 }, { name: 'Digital DEWA', value: 2 },
      { name: 'Business Support & HR', value: 1 }, { name: 'Transmission Power', value: 1 },
      { name: 'Generation', value: 1 }, { name: 'Strategy & Govt Comms', value: 1 },
    ],
    byAudience: [
      { name: 'All DEWA registered Employees', value: 26 }, { name: 'All', value: 3 },
      { name: 'Copilot - Non active users', value: 3 }, { name: 'Copilot - Studio', value: 2 },
      { name: 'New Joiners Jun 2026', value: 2 }, { name: 'Everyone', value: 2 },
    ],
  },
}
