import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { CopilotAdoptionService } from '../../services/CopilotAdoptionService'
import type { CopilotDivRow, CopilotAppDivRow } from '../../services/CopilotAdoptionService'
import Icon from '../../components/Icon'

// ── Tool lanes — 4 real M365 Copilot apps ────────────────────────────
// Icons sourced from bootstrap-icons package (already in node_modules, CSS imported in main.tsx)
const TOOLS = [
  { key: 'Outlook', label: 'Outlook', short: 'Outlook', icon: 'bi-envelope-at-fill',        color: '#0078d4', bg: '#edf4fb' },
  { key: 'Word',    label: 'Word',    short: 'Word',    icon: 'bi-file-earmark-word-fill',   color: '#185abd', bg: '#edf3fb' },
  { key: 'Teams',   label: 'Teams',   short: 'Teams',   icon: 'bi-microsoft-teams',          color: '#6264a7', bg: '#f0eff8' },
  { key: 'Excel',   label: 'Excel',   short: 'Excel',   icon: 'bi-file-earmark-excel-fill',  color: '#1d6f42', bg: '#edf6f0' },
] as const

type ToolKey = typeof TOOLS[number]['key']

// Short abbreviations for the 13 DEWA divisions
const DIV_ABBREV: Record<string, string> = {
  'INNOVATION & THE FUTURE':             'I&F',
  'DISTRIBUTION POWER':                  'Dist',
  'TRANSMISSION POWER':                  'Trans',
  'GENERATION (P&W)':                    'Gen',
  'WATER & CIVIL':                       'W&C',
  'BUSINESS SUPPORT & HUMAN RESOURCES':  'BSHR',
  'BUSINESS DEVELOPMENT & EXCELLENCE':   'BD&E',
  'BILLING SERVICES':                    'Bill',
  'FINANCE':                             'Fin',
  'POWER & WATER PLANNING':             'PWP',
  'INTERNAL AUDIT':                      'IA',
  'STRATEGY & GOVERNMENT COMMUNICATION': 'S&GC',
  'LEGAL AFFAIRS':                       'Legal',
}

// ── Heatmap cell coloring: blend white → tool color by adoption fraction ──
function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
function heatT(val: number) {
  return Math.min(1, Math.max(0, val / 100)) * 0.9 + 0.06
}
function heatFill(hex: string, val: number) {
  const t = heatT(val)
  const { r, g, b } = hexToRgb(hex)
  const m = (c: number) => Math.round(255 + (c - 255) * t)
  return `rgb(${m(r)}, ${m(g)}, ${m(b)})`
}
function heatText(hex: string, val: number) {
  const t = heatT(val)
  const { r, g, b } = hexToRgb(hex)
  const L = 0.299 * (255 + (r - 255) * t) + 0.587 * (255 + (g - 255) * t) + 0.114 * (255 + (b - 255) * t)
  return L < 150 ? '#fff' : '#374151'
}

function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(28,28,30,0.92)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{payload[0].value}% adopted</div>
    </div>
  )
}

interface HovState { division: string; toolKey: ToolKey; pct: number; x: number; y: number }

// Derive tool saturation rows from appDivision data
function buildToolData(appDivision: CopilotAppDivRow[], allDivs: string[]): Record<ToolKey, number>[] & { division: string }[] {
  return allDivs.map(div => {
    const get = (app: string) =>
      appDivision.find(r => r.division === div && r.app === app)?.adoptionPct ?? 0
    return {
      division: div,
      Outlook:  get('Outlook'),
      Word:     get('Word'),
      Teams:    get('Teams'),
      Excel:    get('Excel'),
    }
  }) as unknown as Record<ToolKey, number>[] & { division: string }[]
}

export default function AdoptionTab() {
  const [divisions,    setDivisions]    = useState<CopilotDivRow[]>([])
  const [appDivision,  setAppDivision]  = useState<CopilotAppDivRow[]>([])
  const [loading,      setLoading]      = useState(true)
  const [hov,          setHov]          = useState<HovState | null>(null)

  useEffect(() => {
    let active = true
    CopilotAdoptionService.fetch().then(r => {
      if (!active) return
      if (r.data) {
        setDivisions(r.data.divisions)
        setAppDivision(r.data.appDivision)
      }
      setLoading(false)
    }).catch(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const divisionAdoption = useMemo(
    () => divisions.map(d => ({
      division: d.division.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
      pct:      d.adoptionPct,
    })),
    [divisions]
  )

  const allDivNames = useMemo(() => divisions.map(d => d.division), [divisions])

  const toolData = useMemo(
    () => buildToolData(appDivision, allDivNames),
    [appDivision, allDivNames]
  )

  const toolAvgs = useMemo(() => ({
    Outlook: toolData.length ? Math.round(toolData.reduce((s, r) => s + (r as unknown as Record<string,number>)['Outlook'], 0) / toolData.length) : 0,
    Word:    toolData.length ? Math.round(toolData.reduce((s, r) => s + (r as unknown as Record<string,number>)['Word'],    0) / toolData.length) : 0,
    Teams:   toolData.length ? Math.round(toolData.reduce((s, r) => s + (r as unknown as Record<string,number>)['Teams'],   0) / toolData.length) : 0,
    Excel:   toolData.length ? Math.round(toolData.reduce((s, r) => s + (r as unknown as Record<string,number>)['Excel'],   0) / toolData.length) : 0,
  }), [toolData])

  const barColors = divisionAdoption.map(d =>
    d.pct >= 99 ? '#007560' : d.pct >= 95 ? '#ca8a04' : '#c8352c'
  )

  // Fixed division order (high → low overall adoption) shared across every heatmap row
  const orderedDivs = useMemo(
    () => [...divisions].sort((a, b) => b.adoptionPct - a.adoptionPct).map(d => d.division),
    [divisions]
  )
  const toolMap = useMemo(() => {
    const m = new Map<string, Record<string, number>>()
    toolData.forEach(r => m.set((r as unknown as { division: string }).division, r as unknown as Record<string, number>))
    return m
  }, [toolData])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── AI Adoption bar chart ─────────────────────────────────── */}
      <div className="ps-card">
        <div className="ps-card-header">
          <span className="ps-card-title"><Icon name="bi-bar-chart-line-fill" /> M365 Copilot Adoption by Division</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>% of licensed seats actively using Copilot</span>
        </div>
        <div style={{ padding: '16px 8px 8px' }}>
          {loading && (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              <Icon name="bi-arrow-repeat" style={{ marginRight: 6 }} />Loading chart…
            </div>
          )}
          {!loading && (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={divisionAdoption} margin={{ top: 4, right: 20, left: -16, bottom: 12 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" vertical={false} />
                <XAxis
                  dataKey="division"
                  tick={{ fontSize: 10.5, fill: '#6b7280' }}
                  tickFormatter={(v: string) => DIV_ABBREV[v.toUpperCase()] ?? v}
                  axisLine={false} tickLine={false} interval={0}
                />
                <YAxis domain={[85, 102]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,117,96,0.04)' }} />
                <Bar dataKey="pct" radius={[5, 5, 0, 0]}>
                  <LabelList dataKey="pct" position="top" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 10, fontWeight: 700, fill: '#374151' }} />
                  {divisionAdoption.map((d, i) => (
                    <Cell key={d.division} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '4px 0', flexWrap: 'wrap' }}>
            {[
              { color: '#007560', label: '≥99% (Full Adoption)' },
              { color: '#ca8a04', label: '95–98% (High)' },
              { color: '#c8352c', label: '<95% (Progressing)' },
            ].map(l => (
              <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tool Adoption Lanes ────────────────────────────────────── */}
      <div className="ps-card">
        <div className="ps-card-header">
          <span className="ps-card-title"><Icon name="bi-collection-fill" /> Tool Adoption by Division</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>% of each division actively using every M365 Copilot app</span>
        </div>

        {loading && (
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
            <Icon name="bi-arrow-repeat" style={{ marginRight: 6 }} />Loading…
          </div>
        )}

        {!loading && (
          <div style={{ padding: '8px 20px 16px', overflowX: 'auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `150px repeat(${orderedDivs.length}, minmax(44px, 1fr))`,
              gap: 4, minWidth: 660,
            }}>
              {/* Header row — division abbreviations (horizontal) */}
              <div />
              {orderedDivs.map(div => (
                <div key={div} style={{ fontSize: 9.5, fontWeight: 700, color: '#6b7280', textAlign: 'center', paddingBottom: 6, whiteSpace: 'nowrap' }}>
                  {DIV_ABBREV[div] ?? div.slice(0, 4)}
                </div>
              ))}

              {/* One row per tool */}
              {TOOLS.map(tool => (
                <Fragment key={tool.key}>
                  {/* Tool label + org avg */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`bi ${tool.icon}`} style={{ color: tool.color, fontSize: 16 }} />
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{tool.label}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: tool.color }}>org avg {toolAvgs[tool.key]}%</span>
                    </div>
                  </div>

                  {/* Heat cells */}
                  {orderedDivs.map(div => {
                    const val   = toolMap.get(div)?.[tool.key] ?? 0
                    const isHov = hov?.division === div && hov?.toolKey === tool.key
                    return (
                      <div
                        key={div}
                        onMouseEnter={e => {
                          const r = e.currentTarget.getBoundingClientRect()
                          setHov({ division: div, toolKey: tool.key, pct: val, x: r.left + r.width / 2, y: r.top })
                        }}
                        onMouseLeave={() => setHov(null)}
                        style={{
                          height: 34, borderRadius: 7,
                          background: heatFill(tool.color, val),
                          color: heatText(tool.color, val),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, cursor: 'default',
                          transition: 'box-shadow 0.15s',
                          boxShadow: isHov ? `0 0 0 2px ${tool.color}, 0 4px 12px ${tool.color}55` : 'none',
                        }}
                      >
                        {val}%
                      </div>
                    )
                  })}
                </Fragment>
              ))}
            </div>

            {/* Intensity legend */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Lower adoption</span>
              <span style={{ width: 130, height: 8, borderRadius: 4, background: 'linear-gradient(90deg, #f4f2ec, #6b6f74)' }} />
              <span style={{ fontSize: 10, color: '#9ca3af' }}>Higher adoption · hover a cell for detail</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Floating tooltip ──────────────────────────────────────── */}
      {hov && (() => {
        const tool = TOOLS.find(t => t.key === hov.toolKey)!
        const org  = toolAvgs[hov.toolKey]
        const diff = hov.pct - org
        const divLabel = DIV_ABBREV[hov.division]
          ? hov.division.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
          : hov.division
        return (
          <div style={{
            position: 'fixed', left: hov.x, top: hov.y - 10,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(22,22,24,0.97)', borderRadius: 10,
            padding: '10px 14px', boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
            border: `1px solid ${tool.color}40`, zIndex: 9999, pointerEvents: 'none', minWidth: 178,
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{divLabel}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <i className={`bi ${tool.icon}`} style={{ color: tool.color, fontSize: 16 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>{tool.label} Copilot</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${hov.pct}%`, height: '100%', background: tool.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{hov.pct}%</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: diff >= 0 ? '#22c55e' : '#f87171' }}>
              {diff >= 0 ? '+' : ''}{diff}% vs org avg ({org}%)
            </div>
          </div>
        )
      })()}
    </div>
  )
}
