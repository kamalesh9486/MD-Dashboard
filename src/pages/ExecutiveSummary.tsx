import { useState, useEffect, useMemo, useRef } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import Icon from '../components/Icon'
import DataSourceBadge from '../components/DataSourceBadge'
import LensBriefing from '../components/LensBriefing'
import { useCurrentUser } from '../hooks/useCurrentUser'
import { CopilotAdoptionService } from '../services/CopilotAdoptionService'
import type { CopilotDivRow } from '../services/CopilotAdoptionService'
import { Ai_alhasbaagentsesService } from '../generated/services/Ai_alhasbaagentsesService'
import '../executive-summary.css'

type ProgStatus = 'live' | 'pilot' | 'dev' | 'risk'
type ActiveKpi  = 'trained' | 'projects' | 'impact' | 'adoption' | 'issues' | 'agents' | null
type HeatCell   = { label: string; month: string; value: number; x: number; y: number } | null

// ─── Static chart data ────────────────────────────────────────────────────────
const TECH_DATA = [
  { month: 'May', genai: 5,  cv: 3,  pred: 7,  iot: 2,  auto: 1  },
  { month: 'Jun', genai: 7,  cv: 5,  pred: 9,  iot: 3,  auto: 1  },
  { month: 'Jul', genai: 10, cv: 8,  pred: 12, iot: 5,  auto: 2  },
  { month: 'Aug', genai: 14, cv: 11, pred: 15, iot: 7,  auto: 3  },
  { month: 'Sep', genai: 19, cv: 15, pred: 18, iot: 10, auto: 5  },
  { month: 'Oct', genai: 25, cv: 19, pred: 21, iot: 13, auto: 7  },
  { month: 'Nov', genai: 32, cv: 23, pred: 24, iot: 15, auto: 9  },
  { month: 'Dec', genai: 38, cv: 27, pred: 27, iot: 17, auto: 10 },
  { month: 'Jan', genai: 46, cv: 30, pred: 29, iot: 19, auto: 11 },
  { month: 'Feb', genai: 51, cv: 32, pred: 29, iot: 20, auto: 12 },
  { month: 'Mar', genai: 56, cv: 33, pred: 29, iot: 21, auto: 13 },
  { month: 'Apr', genai: 58, cv: 34, pred: 29, iot: 22, auto: 14 },
]

const TECH_LINES = [
  { key: 'genai' as const, label: 'Generative AI',   color: '#007560', count: 58, delta: '+34', dash: ''    },
  { key: 'cv'    as const, label: 'Computer Vision',  color: '#ca8a04', count: 34, delta: '+11', dash: ''    },
  { key: 'pred'  as const, label: 'Predictive / ML',  color: '#004937', count: 29, delta: '+7',  dash: ''    },
  { key: 'iot'   as const, label: 'IoT · Edge AI',    color: '#0891b2', count: 22, delta: '+9',  dash: '5 3' },
  { key: 'auto'  as const, label: 'Autonomous',       color: '#6366f1', count: 14, delta: '+5',  dash: '5 3' },
]

const PROGRAMMES: { name: string; dept: string; div: string; pct: number; impact: string; color: string; status: ProgStatus }[] = [
  { name: 'Grid Demand Copilot',          dept: 'Power Generation · LLM',    div: 'Power Generation',   pct: 86, impact: '18.2M', color: '#17944a', status: 'live'  },
  { name: 'Smart Meter Anomaly AI',       dept: 'Customer Service · Pred.',   div: 'Customer Service',   pct: 72, impact: '11.6M', color: '#2b63c8', status: 'live'  },
  { name: 'Desalination Efficiency Twin', dept: 'Water Ops · Digital twin',   div: 'Water Operations',   pct: 58, impact: '9.8M',  color: '#1a9a94', status: 'pilot' },
  { name: 'Solar Yield Forecaster',       dept: 'MBR Solar Park · Forecast',  div: 'Renewables',         pct: 64, impact: '7.4M',  color: '#d98c0a', status: 'live'  },
  { name: 'Customer Care Voice AI',       dept: 'Customer · GenAI · AR/EN',   div: 'Customer Service',   pct: 44, impact: '5.1M',  color: '#6a3fb3', status: 'dev'   },
  { name: 'Asset Integrity Vision',       dept: 'Transmission · CV inspect.', div: 'Transmission',       pct: 39, impact: 'flagged',color:'#c8352c', status: 'risk'  },
]

const PILLARS = [
  { num: '01', title: 'AI-first operations',       pct: 78, target: 66, note: 'on track',  gradient: 'linear-gradient(90deg,#54c47a,#17944a)' },
  { num: '02', title: 'Workforce transformation',  pct: 71, target: 68, note: 'on track',  gradient: 'linear-gradient(90deg,#54c47a,#17944a)' },
  { num: '03', title: 'Generative AI enablement',  pct: 84, target: 70, note: 'ahead',     gradient: 'linear-gradient(90deg,#3d7ae0,#1c4aa8)' },
  { num: '04', title: 'Trusted AI governance',     pct: 54, target: 62, note: 'attention', gradient: 'linear-gradient(90deg,#d98c0a,#b77007)' },
  { num: '05', title: 'Ecosystem & partnerships',  pct: 62, target: 60, note: 'on track',  gradient: 'linear-gradient(90deg,#31b6b0,#0e6f6a)' },
]


const HEAT_MONTHS = ['Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May','Jun']

const HEAT_VALS: number[][] = [
  [3.2,4.1,5.4,6.8,7.9,8.6,9.2,9.8,10.4,11.2,11.8,12.0],
  [2.1,2.6,3.2,3.8,4.4,4.9,5.2,5.8,6.4,6.9,7.3,7.6],
  [1.8,2.2,2.8,3.2,3.9,4.6,5.1,5.4,5.8,6.2,6.6,6.8],
  [2.6,3.0,3.4,3.9,4.8,5.6,6.4,7.1,7.8,8.4,8.9,9.3],
  [1.1,1.4,1.9,2.4,2.8,3.4,3.9,4.5,5.1,5.6,6.0,6.4],
  [0.6,0.8,1.0,1.2,1.5,1.7,1.9,2.1,2.4,2.6,2.8,3.0],
  [0.9,1.2,1.5,1.8,2.1,2.4,2.6,2.9,3.2,3.5,3.8,4.1],
]

const FALLBACK_DIV_NAMES = [
  'Power Generation','Transmission','Water Operations',
  'Customer Service','Renewables · Solar','Corporate Services','Innovation · R&D',
]

// ─── KPI mini-chart data ──────────────────────────────────────────────────────
const TRAINED_PTS = [
  { x: 0,   y: 34, month: "May '25", val: 6200  },
  { x: 20,  y: 30, month: "Jun '25", val: 6580  },
  { x: 40,  y: 28, month: "Jul '25", val: 7050  },
  { x: 60,  y: 24, month: "Aug '25", val: 7420  },
  { x: 80,  y: 22, month: "Sep '25", val: 7780  },
  { x: 100, y: 18, month: "Oct '25", val: 8110  },
  { x: 120, y: 14, month: "Nov '25", val: 8400  },
  { x: 140, y: 11, month: "Dec '25", val: 8640  },
  { x: 160, y: 8,  month: "Jan '26", val: 8820  },
  { x: 180, y: 5,  month: "Feb '26", val: 8970  },
  { x: 200, y: 3,  month: "Mar '26", val: 9087  },
]

const PROJECTS_PTS = [
  { x: 5,   month: "Jun '25", count: 29 },
  { x: 25,  month: "Jul '25", count: 31 },
  { x: 45,  month: "Aug '25", count: 33 },
  { x: 65,  month: "Sep '25", count: 35 },
  { x: 85,  month: "Oct '25", count: 37 },
  { x: 105, month: "Nov '25", count: 39 },
  { x: 125, month: "Dec '25", count: 41 },
  { x: 145, month: "Jan '26", count: 43 },
  { x: 165, month: "Feb '26", count: 45 },
  { x: 185, month: "Mar '26", count: 47 },
]

const IMPACT_DOTS_DATA = [
  { cx: 40,  cy: 30, month: "Aug '25", val: '22.1M AED' },
  { cx: 100, cy: 24, month: "Nov '25", val: '27.8M AED' },
  { cx: 160, cy: 12, month: "Feb '26", val: '31.2M AED' },
  { cx: 200, cy: 6,  month: "Mar '26", val: '34.3M AED' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function greeting(name: string) {
  const h = new Date().getHours()
  const part = h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'
  return `Good ${part}, ${name || 'welcome'}.`
}

function heatColor(v: number, max: number): string {
  if (v === 0) return '#f4f6f9'
  const t = Math.min(1, v / max)
  const stops: [number, [number, number, number]][] = [
    [0.00, [236, 247, 240]],
    [0.40, [185, 230, 200]],
    [0.75, [42,  169, 90 ]],
    [1.00, [10,  125, 62 ]],
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]
    const [b, cb] = stops[i + 1]
    if (t >= a && t <= b) {
      const k  = (t - a) / (b - a)
      const r  = Math.round(ca[0] + (cb[0] - ca[0]) * k)
      const g  = Math.round(ca[1] + (cb[1] - ca[1]) * k)
      const bl = Math.round(ca[2] + (cb[2] - ca[2]) * k)
      return `rgb(${r},${g},${bl})`
    }
  }
  return 'rgb(10,125,62)'
}

function adoptionBadge(rate: number): { label: string; cls: string } {
  if (rate >= 99) return { label: 'Full Adoption', cls: 'es-badge--high' }
  if (rate >= 95) return { label: 'High Adoption', cls: 'es-badge--med'  }
  return               { label: 'Progressing',   cls: 'es-badge--low'  }
}

// ─── Tooltip constants ────────────────────────────────────────────────────────
const TT       = { background: 'rgba(20,26,43,0.95)', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 }

function TechTip({ active, payload, label }: {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="es-tooltip">
      <div className="es-tooltip-label">{label}</div>
      {payload.map(p => (
        <div key={p.name} className="es-tooltip-val" style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function ExecutiveSummary() {
  const [activeKpi,       setActiveKpi]       = useState<ActiveKpi>(null)
  const [copilotDivs,     setCopilotDivs]     = useState<CopilotDivRow[]>([])
  const [overallAdoption, setOverallAdoption] = useState(97)
  const [divLoading,      setDivLoading]      = useState(true)
  const [liveAgents,      setLiveAgents]      = useState(0)
  const [agentsLoading,   setAgentsLoading]   = useState(true)
  const [heatCell,   setHeatCell]   = useState<HeatCell>(null)
  const [kpiMiniTip, setKpiMiniTip] = useState<{ lines: string[]; x: number; y: number } | null>(null)
  const { name } = useCurrentUser()

  function showTip(e: React.MouseEvent, lines: string[]) {
    setKpiMiniTip({ lines, x: e.clientX, y: e.clientY })
  }
  function hideTip() { setKpiMiniTip(null) }
  function moveTip(e: React.MouseEvent) {
    setKpiMiniTip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)
  }

  // Section refs for scroll-to on KPI click
  const refTech     = useRef<HTMLDivElement>(null)
  const refAdoption = useRef<HTMLDivElement>(null)
  const refHeat     = useRef<HTMLDivElement>(null)
  const refProg     = useRef<HTMLDivElement>(null)
  const refPulse    = useRef<HTMLDivElement>(null)

  // Fetch live agent count from Dataverse
  useEffect(() => {
    let active = true
    Ai_alhasbaagentsesService.getAll()
      .then(res => {
        if (!active) return
        const count = (res.data ?? []).filter(a => a.ai_status === 'Live').length
        setLiveAgents(count)
        setAgentsLoading(false)
      })
      .catch(() => { if (active) setAgentsLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    CopilotAdoptionService.fetch().then(r => {
      if (!active) return
      if (r.data) {
        setCopilotDivs(r.data.divisions)
        setOverallAdoption(Math.round(r.data.kpi.adoptionPct * 100))
      }
      setDivLoading(false)
    }).catch(() => { if (active) setDivLoading(false) })
    return () => { active = false }
  }, [])

  // ── Derived values ──────────────────────────────────────────────────────────
  const heatRows = useMemo(() =>
    HEAT_VALS.slice(0, 7).map((row, i) => ({
      label: copilotDivs[i]?.division ?? FALLBACK_DIV_NAMES[i] ?? `Division ${i + 1}`,
      row,
    })),
    [copilotDivs]
  )

  const sortedDivisions = useMemo(
    () => [...copilotDivs].sort((a, b) => b.adoptionPct - a.adoptionPct),
    [copilotDivs]
  )

  const adoptionBuckets = useMemo(() => {
    if (copilotDivs.length === 0) {
      return [
        { name: 'Full Adoption (≥99%)',  value: 8, color: '#007560' },
        { name: 'High Adoption (95–98%)', value: 4, color: '#ca8a04' },
        { name: 'Progressing (<95%)',     value: 1, color: '#c8352c' },
      ]
    }
    const full = copilotDivs.filter(d => d.adoptionPct >= 99).length
    const high = copilotDivs.filter(d => d.adoptionPct >= 95 && d.adoptionPct < 99).length
    const prog = copilotDivs.filter(d => d.adoptionPct < 95).length
    return [
      { name: 'Full Adoption (≥99%)',   value: full || 0, color: '#007560' },
      { name: 'High Adoption (95–98%)', value: high || 0, color: '#ca8a04' },
      { name: 'Progressing (<95%)',     value: prog || 0, color: '#c8352c' },
    ]
  }, [copilotDivs])

  // ── KPI click handler ───────────────────────────────────────────────────────
  function handleKpiClick(kpi: ActiveKpi, ref: React.RefObject<HTMLDivElement | null>) {
    setActiveKpi(prev => prev === kpi ? null : kpi)
    setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Page header */}
      <div className="es-page-head">
        <div className="es-page-head-text">
          <div className="es-page-eyebrow">Centre of Excellence · Artificial Intelligence</div>
          <h1>{greeting(name)} Here&apos;s where DEWA&apos;s AI transformation stands today.</h1>
        </div>
        <DataSourceBadge type="simulated" title="Dummy data from backend" lastUpdated="16 May 2026" />
      </div>

      <LensBriefing module="executive" />

      <div className="es-page">

        {/* ── KPI Strip ── */}
        <div className="es-kpi-strip">
            {/* Employees trained */}
            <div
              className={`es-kpi-cell es-kpi-cell--clickable${activeKpi === 'trained' ? ' es-kpi-cell--active' : ''}`}
              onClick={() => handleKpiClick('trained', refTech)}
            >
              <div className="es-kpi-eyebrow">Employees trained</div>
              <div className="es-kpi-row">
                <div className="es-kpi-value">9087<span className="es-kpi-unit"> / 14k</span></div>
                <span className="es-delta es-delta--up">+12.4%</span>
              </div>
              <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
                <defs><linearGradient id="sg1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#2aa95a" stopOpacity="0.3"/><stop offset="100%" stopColor="#2aa95a" stopOpacity="0"/></linearGradient></defs>
                <path d="M0,34 L20,30 40,28 60,24 80,22 100,18 120,14 140,11 160,8 180,5 200,3 L200,40 L0,40 Z" fill="url(#sg1)"/>
                <path d="M0,34 L20,30 40,28 60,24 80,22 100,18 120,14 140,11 160,8 180,5 200,3" fill="none" stroke="#17944a" strokeWidth="1.8"/>
                {TRAINED_PTS.map((pt, i) => (
                  <circle key={i} cx={pt.x} cy={pt.y} r="8" fill="transparent"
                    onMouseEnter={e => showTip(e, [pt.month, `${pt.val.toLocaleString()} trained`])}
                    onMouseLeave={hideTip}
                    onMouseMove={moveTip}
                    style={{ cursor: 'crosshair' }} />
                ))}
              </svg>
              <div className="es-kpi-hint">View tech growth <Icon name="bi-arrow-right" /></div>
            </div>

            {/* Live AI projects */}
            <div
              className={`es-kpi-cell es-kpi-cell--clickable${activeKpi === 'projects' ? ' es-kpi-cell--active' : ''}`}
              onClick={() => handleKpiClick('projects', refProg)}
            >
              <div className="es-kpi-eyebrow">Live AI projects</div>
              <div className="es-kpi-row">
                <div className="es-kpi-value">47<span className="es-kpi-unit"> active</span></div>
                <span className="es-delta es-delta--up">+9</span>
              </div>
              <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
                {PROJECTS_PTS.map((b, i) => (
                  <rect key={i} x={b.x} y={40 - (16 + i * 2)} width="10" height={16 + i * 2} rx="1"
                    fill="#2b63c8"
                    onMouseEnter={e => showTip(e, [b.month, `${b.count} active projects`])}
                    onMouseLeave={hideTip}
                    onMouseMove={moveTip}
                    style={{ cursor: 'crosshair' }} />
                ))}
              </svg>
              <div className="es-kpi-hint">View programmes <Icon name="bi-arrow-right" /></div>
            </div>

            {/* Impact realised */}
            <div
              className={`es-kpi-cell es-kpi-cell--clickable${activeKpi === 'impact' ? ' es-kpi-cell--active' : ''}`}
              onClick={() => handleKpiClick('impact', refHeat)}
            >
              <div className="es-kpi-eyebrow">Impact realised (AED)</div>
              <div className="es-kpi-row">
                <div className="es-kpi-value">34.3<span className="es-kpi-unit">M</span></div>
                <span className="es-delta es-delta--up">+21.3%</span>
              </div>
              <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
                <path d="M0,36 L20,34 40,30 60,32 80,26 100,24 120,18 140,20 160,12 180,10 200,6" fill="none" stroke="#1a9a94" strokeWidth="1.8"
                  onMouseMove={moveTip} />
                {IMPACT_DOTS_DATA.map((d, i) => (
                  <circle key={i} cx={d.cx} cy={d.cy} r={i === 3 ? 2.2 : 1.5} fill="#1a9a94" />
                ))}
                {IMPACT_DOTS_DATA.map((d, i) => (
                  <circle key={`hit-${i}`} cx={d.cx} cy={d.cy} r="8" fill="transparent"
                    onMouseEnter={e => showTip(e, [d.month, `Impact: ${d.val}`])}
                    onMouseLeave={hideTip}
                    onMouseMove={moveTip}
                    style={{ cursor: 'crosshair' }} />
                ))}
              </svg>
              <div className="es-kpi-hint">View heatmap <Icon name="bi-arrow-right" /></div>
            </div>

            {/* Overall Adoption Rate — from Dataverse */}
            
            {/* AI Readiness Score */}
            <div
              className={`es-kpi-cell es-kpi-cell--clickable${activeKpi === 'issues' ? ' es-kpi-cell--active' : ''}`}
              onClick={() => handleKpiClick('issues', refPulse)}
            >
              <div className="es-kpi-eyebrow">AI Readiness Score</div>
              <div className="es-kpi-row">
                <div className="es-kpi-value">78<span className="es-kpi-unit"> / 100</span></div>
                <span className="es-delta es-delta--up">+4</span>
              </div>
              <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
                <rect x="0" y="30" width="200" height="4" rx="2" fill="#eef0f6"/>
                <rect x="0" y="30" width="156" height="4" rx="2" fill="#007560"
                  onMouseEnter={e => showTip(e, ['AI Readiness Score', '78 / 100 — Strong', '+4 pts this quarter'])}
                  onMouseLeave={hideTip}
                  onMouseMove={moveTip}
                  style={{ cursor: 'crosshair' }} />
                <circle cx="156" cy="32" r="5" fill="#007560"
                  onMouseEnter={e => showTip(e, ['AI Readiness Score', '78 / 100 — Strong', '+4 pts this quarter'])}
                  onMouseLeave={hideTip}
                  onMouseMove={moveTip}
                  style={{ cursor: 'crosshair' }} />
                <text x="160" y="18" fontSize="11" fill="#007560" fontWeight="700">78%</text>
              </svg>
              <div className="es-kpi-hint">View AI pulse <Icon name="bi-arrow-right" /></div>
            </div>

            {/* Agents in Production */}
            <div
              className={`es-kpi-cell es-kpi-cell--clickable${activeKpi === 'agents' ? ' es-kpi-cell--active' : ''}`}
              onClick={() => handleKpiClick('agents', refPulse)}
            >
              <div className="es-kpi-eyebrow">Agents in production</div>
              <div className="es-kpi-row">
                <div className="es-kpi-value">
                  {agentsLoading ? <span className="es-kpi-loading" /> : liveAgents}
                  <span className="es-kpi-unit"> live</span>
                </div>
                <span className="es-delta es-delta--up">Active</span>
              </div>
              <svg viewBox="0 0 200 40" width="100%" height="36" preserveAspectRatio="none">
                {Array.from({ length: Math.min(liveAgents, 10) }, (_, i) => {
                  const cx = 20 + i * (160 / Math.max(liveAgents - 1, 1))
                  return (
                    <g key={i}>
                      <circle cx={cx} cy={28} r={6} fill="#6366f1" opacity={0.85}
                        onMouseEnter={e => showTip(e, [`Agent ${i + 1} of ${liveAgents}`, 'Status: Live', 'Al Hasbah programme'])}
                        onMouseLeave={hideTip}
                        onMouseMove={moveTip}
                        style={{ cursor: 'crosshair' }} />
                      {i < Math.min(liveAgents, 10) - 1 && (
                        <line x1={cx + 6} y1={28} x2={20 + (i + 1) * (160 / Math.max(liveAgents - 1, 1)) - 6} y2={28}
                          stroke="#6366f1" strokeWidth={1.5} opacity={0.3} />
                      )}
                    </g>
                  )
                })}
              </svg>
              <div className="es-kpi-hint">View agent portfolio <Icon name="bi-arrow-right" /></div>
            </div>
          </div>

        {/* ── 12-col grid ── */}
        <div className="es-grid">

          {/* Technologies Growth — span 8 */}
          <div ref={refTech} className={`es-card es-span-8${activeKpi === 'trained' ? ' es-card--active' : ''}`}>
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">Technologies growth</div>
                <h3 className="es-card-title">AI technology adoption across DEWA</h3>
                <div className="es-card-sub">Active deployments by technology category · last 12 months</div>
              </div>
              <div className="es-card-actions">
                <button className="es-mini-tab">6M</button>
                <button className="es-mini-tab active">12M</button>
                <button className="es-mini-tab">24M</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={TECH_DATA} margin={{ top: 4, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9aa3bb' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 65]} tick={{ fontSize: 11, fill: '#9aa3bb' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TechTip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                {TECH_LINES.map(t => (
                  <Line key={t.key} type="monotone" dataKey={t.key} name={t.label}
                    stroke={t.color} strokeWidth={2.2}
                    strokeDasharray={t.dash || undefined}
                    dot={false} activeDot={{ r: 4, fill: t.color }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            <div className="es-hr" />
            <div className="es-tech-legend">
              {TECH_LINES.map(t => (
                <div key={t.key} className="es-tech-legend-item">
                  <div className="es-tech-legend-dot">
                    <span className="es-tech-sw" style={{ background: t.color }} />
                    <span className="es-tech-name">{t.label}</span>
                  </div>
                  <div className="es-tech-count">{t.count}</div>
                  <div className="es-tech-delta">{t.delta} models</div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Adoption Rate — span 4 */}
          <div ref={refAdoption} className={`es-card es-span-4${activeKpi === 'adoption' ? ' es-card--active' : ''}`}>
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">AI Adoption by Division</div>
                <h3 className="es-card-title">Overall adoption rate</h3>
                <div className="es-card-sub">
                  {divLoading ? 'Loading…' : `${copilotDivs.length} divisions · M365 Copilot live`}
                </div>
              </div>
            </div>

            {/* Donut */}
            <div className="es-donut-wrap">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={adoptionBuckets} cx="50%" cy="50%" innerRadius={62} outerRadius={92}
                    dataKey="value" startAngle={90} endAngle={-270} paddingAngle={3}>
                    {adoptionBuckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Pie>
                  <Tooltip contentStyle={TT} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                </PieChart>
              </ResponsiveContainer>
              <div className="es-donut-center">
                <div className="es-donut-pct">
                  {divLoading ? '—' : overallAdoption}%
                </div>
                <div className="es-donut-label">avg adoption</div>
              </div>
            </div>

            {/* Legend */}
            <div className="es-legend">
              {adoptionBuckets.map(b => (
                <div key={b.name} className="es-legend-row">
                  <span className="es-legend-sw" style={{ background: b.color }} />
                  <span className="es-legend-label">{b.name}</span>
                  <span className="es-legend-val">{b.value} div.</span>
                </div>
              ))}
            </div>

            <div className="es-hr" />
            <div className="es-wf-footer">
              <div className="es-wf-col">
                <span className="es-wf-col-label">FY26 target</span>
                <span className="es-wf-col-val">80%</span>
              </div>
             
              <div className="es-wf-col" style={{ textAlign: 'right' }}>
                <span className="es-wf-col-label">Leading div.</span>
                <span className="es-wf-col-val">
                  {divLoading || copilotDivs.length === 0
                    ? 'Innovation'
                    : (sortedDivisions[0]?.division.split(' ').slice(0,2).map(w => w[0]+w.slice(1).toLowerCase()).join(' ') ?? '—')}
                </span>
              </div>
            </div>
          </div>

          {/* Impact Heatmap — span 8 */}
          <div ref={refHeat} className={`es-card es-span-8${activeKpi === 'impact' ? ' es-card--active' : ''}`}>
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">Impact analysis · division × month</div>
                <h3 className="es-card-title">AI programme value delivered (AED M)</h3>
                <div className="es-card-sub">All divisions · last 12 months · realised + committed</div>
              </div>
              <div className="es-card-actions">
                <button className="es-mini-tab active">Financial</button>
                <button className="es-mini-tab">Operational</button>
              </div>
            </div>
            <div className="es-heat-scroll">
              <div className="es-heat-grid">
                <div />
                {HEAT_MONTHS.map(m => <div key={m} className="es-heat-col-label">{m}</div>)}
              </div>
              {heatRows.map(div => (
                <div key={div.label} className="es-heat-grid" style={{ marginTop: 3 }}>
                  <div className="es-heat-label" title={div.label}>{div.label}</div>
                  {div.row.map((v, i) => (
                    <div key={i} className="es-heat-cell"
                      style={{ background: heatColor(v, 12) }}
                      onMouseEnter={e => {
                        const r = e.currentTarget.getBoundingClientRect()
                        setHeatCell({ label: div.label, month: HEAT_MONTHS[i], value: v, x: r.left + r.width / 2, y: r.top })
                      }}
                      onMouseLeave={() => setHeatCell(null)}
                    />
                  ))}
                </div>
              ))}
            </div>
            {heatCell && (
              <div className="es-heat-tooltip" style={{ left: heatCell.x, top: heatCell.y }}>
                <div className="es-tooltip-label">{heatCell.label}</div>
                <div className="es-tooltip-val">{heatCell.month} · <strong>AED {heatCell.value.toFixed(1)}M</strong></div>
              </div>
            )}
            <div className="es-heat-footer">
              <div className="es-heat-scale">
                <span>0 AED</span>
                <span className="es-heat-scale-bar" />
                <span>12 AED M</span>
              </div>
              <div style={{ fontSize: 12, color: '#5a6682' }}>
                Top this quarter: <strong style={{ color: '#141a2b' }}>
                  {heatRows[0]?.label ?? 'Power Generation'} · AED {
                    heatRows[0] ? Math.max(...heatRows[0].row.slice(9)).toFixed(1) : '29.4'
                  }M
                </strong>
              </div>
            </div>
          </div>

          {/* Top Programmes — span 4 */}
          <div ref={refProg} className={`es-card es-span-4${activeKpi === 'projects' ? ' es-card--active' : ''}`}>
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">Top programmes</div>
                <h3 className="es-card-title">Flagship initiatives</h3>
                <div className="es-card-sub">{PROGRAMMES.length} programmes · ranked by impact</div>
              </div>
            </div>
            <div className="es-prog-head">
              <span>Programme</span><span>Progress</span><span style={{ textAlign: 'right' }}>Status</span>
            </div>
            {PROGRAMMES.map(p => (
              <div key={p.name} className="es-prog-row">
                <div>
                  <div className="es-prog-name">{p.name}</div>
                  <div className="es-prog-dept">{p.dept}</div>
                </div>
                <div>
                  <div className="es-prog-bar-track">
                    <div className="es-prog-bar-fill" style={{ width: `${p.pct}%`, background: p.color }} />
                  </div>
                  <div className="es-prog-meta">{p.pct}% · AED {p.impact}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`es-status es-status--${p.status}`}>
                    {{ live: 'Live', pilot: 'Pilot', dev: 'Dev', risk: 'At risk' }[p.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Strategic Roadmap — span 8 */}
          <div className="es-card es-span-8">
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">Strategic Roadmap · FY25–FY27</div>
                <h3 className="es-card-title">Progress across the five strategic pillars</h3>
                <div className="es-card-sub">Milestones by pillar · weight-adjusted completion</div>
              </div>
              <div className="es-card-actions">
                <button className="es-mini-tab active">Pillars</button>
              </div>
            </div>
            <div className="es-roadmap">
              {PILLARS.map(p => (
                <div key={p.num} className="es-rm-pillar">
                  <div className="es-rm-pillar-head">
                    <div className="es-rm-name">
                      <span className="es-rm-num">{p.num}</span>
                      <span className="es-rm-title">{p.title}</span>
                    </div>
                    <div className="es-rm-progress"><b>{p.pct}%</b> · {p.note}</div>
                  </div>
                  <div className="es-rm-bar-track">
                    <div className="es-rm-bar-fill" style={{ width: `${p.pct}%`, background: p.gradient }} />
                    <div className="es-rm-target" style={{ left: `${p.target}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Pulse — span 4 */}
          <div ref={refPulse} className={`es-card es-span-4${activeKpi === 'issues' ? ' es-card--active' : ''}`}>
            <div className="es-card-head">
              <div className="es-card-title-group">
                <div className="es-card-eyebrow">AI Pulse · division health</div>
                <h3 className="es-card-title">Adoption by division</h3>
                <div className="es-card-sub">
                  {divLoading ? 'Loading…' : `${sortedDivisions.length} divisions · sorted by adoption rate`}
                </div>
              </div>
              <div className="es-card-actions">
                <Icon name="bi-bar-chart-horizontal-fill" />
              </div>
            </div>

            {divLoading ? (
              <div className="es-pulse-skeleton">
                {[1,2,3,4,5].map(i => <div key={i} className="es-skeleton-row" />)}
              </div>
            ) : sortedDivisions.slice(0, 7).map(div => {
              const rate = div.adoptionPct
              const { label: badgeLabel, cls: badgeCls } = adoptionBadge(rate)
              return (
                <div key={div.division} className="es-pulse-row">
                  <div className="es-pulse-info">
                    <span className="es-pulse-name">{div.division.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</span>
                    <div className="es-pulse-meta">
                      <span>{div.activeUsers.toLocaleString()} active</span>
                      <span>{div.licensedUsers.toLocaleString()} licensed</span>
                    </div>
                  </div>
                  <div className="es-pulse-bar-wrap">
                    <div className="es-pulse-bar" style={{ width: `${rate}%`, background: rate >= 99 ? '#17944a' : rate >= 95 ? '#d98c0a' : '#c8352c' }} />
                  </div>
                  <div className="es-pulse-right">
                    <span className="es-pulse-pct">{rate}%</span>
                    <span className={`es-badge ${badgeCls}`}>{badgeLabel}</span>
                  </div>
                </div>
              )
            })}

          </div>

        </div>
      </div>

      {kpiMiniTip && (
        <div className="es-kpi-mini-tip" style={{ left: kpiMiniTip.x + 14, top: kpiMiniTip.y - 10 }}>
          {kpiMiniTip.lines.map((line, i) => (
            <div key={i} className={i === 0 ? 'es-kpi-mini-tip-label' : 'es-kpi-mini-tip-val'}>{line}</div>
          ))}
        </div>
      )}
    </div>
  )
}
