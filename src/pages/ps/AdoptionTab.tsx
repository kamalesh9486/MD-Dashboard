import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import { Cr978_coe_divisionsService } from '../../generated'
import type { Cr978_coe_divisions } from '../../generated/models/Cr978_coe_divisionsModel'
import Icon from '../../components/Icon'

interface DivisionAdoption { division: string; pct: number }

const TOOLS = [
  { key: 'copilot',       label: 'Microsoft Copilot',  short: 'Copilot',     icon: 'bi-microsoft',             color: '#007560', bg: '#edf7f4' },
  { key: 'customGpt',     label: 'Custom GPTs',         short: 'Custom GPTs', icon: 'bi-robot',                 color: '#3d9e7a', bg: '#edf7f3' },
  { key: 'powerAutomate', label: 'Power Automate AI',   short: 'Power Auto.', icon: 'bi-lightning-charge-fill', color: '#ca8a04', bg: '#fdf8ec' },
  { key: 'aiVision',      label: 'AI Vision',           short: 'AI Vision',   icon: 'bi-image-fill',            color: '#0891b2', bg: '#ecf6fb' },
] as const

type ToolKey = typeof TOOLS[number]['key']

interface ToolSaturation {
  division: string
  copilot: number; customGpt: number; powerAutomate: number; aiVision: number
}

const TOOL_SEED: ToolSaturation[] = [
  { division: 'IT & Digital',    copilot: 88, customGpt: 72, powerAutomate: 81, aiVision: 45 },
  { division: 'Generation',      copilot: 42, customGpt: 28, powerAutomate: 35, aiVision: 18 },
  { division: 'Transmission',    copilot: 38, customGpt: 25, powerAutomate: 40, aiVision: 22 },
  { division: 'Distribution',    copilot: 45, customGpt: 30, powerAutomate: 52, aiVision: 28 },
  { division: 'HR',              copilot: 75, customGpt: 48, powerAutomate: 62, aiVision: 30 },
  { division: 'Finance',         copilot: 78, customGpt: 55, powerAutomate: 70, aiVision: 20 },
  { division: 'Customer Service',copilot: 71, customGpt: 65, powerAutomate: 58, aiVision: 35 },
  { division: 'Corporate',       copilot: 60, customGpt: 42, powerAutomate: 50, aiVision: 25 },
]

const DIV_ABBREV: Record<string, string> = {
  'IT & Digital': 'IT', Generation: 'Gen', Transmission: 'Trans',
  Distribution: 'Dist', HR: 'HR', Finance: 'Fin',
  'Customer Service': 'CS', Corporate: 'Corp',
}

const TOOL_AVGS = TOOLS.reduce((acc, t) => {
  acc[t.key] = Math.round(TOOL_SEED.reduce((s, r) => s + r[t.key as ToolKey], 0) / TOOL_SEED.length)
  return acc
}, {} as Record<ToolKey, number>)

function mapToDivisionAdoption(r: Cr978_coe_divisions): DivisionAdoption {
  return { division: r.cr978_divisionname, pct: r.cr435_adoptionrate ?? 0 }
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

interface HovState { division: string; toolKey: ToolKey; x: number; y: number }

export default function AdoptionTab() {
  const [divisionAdoption, setDivisionAdoption] = useState<DivisionAdoption[]>([])
  const [chartLoading,     setChartLoading]     = useState(true)
  const [hov, setHov] = useState<HovState | null>(null)

  useEffect(() => {
    Cr978_coe_divisionsService.getAll().then(result => {
      if (result.data) setDivisionAdoption(result.data.map(mapToDivisionAdoption))
    }).catch((err: unknown) => {
      console.error('Failed to load divisions for adoption chart', err)
    }).finally(() => setChartLoading(false))
  }, [])

  const barColors = divisionAdoption.map(d =>
    d.pct >= 75 ? '#007560' : d.pct >= 60 ? '#ca8a04' : '#d4cfc7'
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Bar chart ─────────────────────────────────────────────── */}
      <div className="ps-card">
        <div className="ps-card-header">
          <span className="ps-card-title"><Icon name="bi-bar-chart-line-fill" /> AI Adoption by Division</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>% of employees trained</span>
        </div>
        <div style={{ padding: '16px 8px 8px' }}>
          {chartLoading && (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
              <Icon name="bi-arrow-repeat" style={{ marginRight: 6 }} />Loading chart…
            </div>
          )}
          {!chartLoading && (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={divisionAdoption} margin={{ top: 4, right: 20, left: -16, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e5de" vertical={false} />
                <XAxis dataKey="division" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,117,96,0.04)' }} />
                <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="pct" position="top" formatter={(v: unknown) => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
                  {divisionAdoption.map((d, i) => (
                    <Cell key={d.division} fill={barColors[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', padding: '8px 0 4px', flexWrap: 'wrap' }}>
            {[{ color: '#007560', label: '≥75% (Strong)' }, { color: '#ca8a04', label: '60–74% (Progressing)' }, { color: '#d4cfc7', label: '<60% (Needs Attention)' }].map(l => (
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
          <span className="ps-card-title"><Icon name="bi-collection-fill" /> Tool Adoption Lanes</span>
          <span style={{ fontSize: 12, color: '#9ca3af' }}>Divisions positioned by % actively using each tool</span>
        </div>
        <div style={{ padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>

          {/* Scale ticks — drawn once above all lanes */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', gap: 0, paddingBottom: 2 }}>
            <div />
            <div style={{ position: 'relative', height: 16 }}>
              {[0, 25, 50, 75, 100].map(tick => (
                <span key={tick} style={{
                  position: 'absolute',
                  left: `${tick}%`,
                  transform: 'translateX(-50%)',
                  fontSize: 9.5,
                  color: '#c4bfb8',
                  fontWeight: 500,
                  userSelect: 'none',
                }}>
                  {tick}%
                </span>
              ))}
            </div>
            <div />
          </div>

          {TOOLS.map(tool => {
            const avg = TOOL_AVGS[tool.key]
            // Sort by value, assign stagger row (0 = top, 1 = bottom) alternating
            const sorted = [...TOOL_SEED]
              .sort((a, b) => a[tool.key as ToolKey] - b[tool.key as ToolKey])
              .map((row, i) => ({ row, stagger: i % 2 }))

            return (
              <div key={tool.key} style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 64px',
                gap: 0,
                alignItems: 'center',
                background: tool.bg,
                borderRadius: 12,
                border: `1px solid ${tool.color}22`,
                padding: '10px 0',
                marginBottom: 4,
              }}>
                {/* Tool label */}
                <div style={{ padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icon name={tool.icon} style={{ color: tool.color, fontSize: 14, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', lineHeight: 1.2 }}>{tool.short}</span>
                  </div>
                  <span style={{
                    fontSize: 9.5, fontWeight: 600, color: tool.color,
                    background: `${tool.color}18`, padding: '1px 6px',
                    borderRadius: 20, width: 'fit-content',
                  }}>
                    avg {avg}%
                  </span>
                </div>

                {/* Track */}
                <div style={{ position: 'relative', height: 72 }}>
                  {/* Gridlines at 25% intervals */}
                  {[25, 50, 75].map(pct => (
                    <div key={pct} style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      top: 4, bottom: 4,
                      width: 1,
                      background: `${tool.color}18`,
                      pointerEvents: 'none',
                    }} />
                  ))}
                  {/* Avg marker */}
                  <div style={{
                    position: 'absolute',
                    left: `${avg}%`,
                    top: 4, bottom: 4,
                    width: 2,
                    background: tool.color,
                    opacity: 0.35,
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }} />

                  {/* Division pills */}
                  {sorted.map(({ row, stagger }) => {
                    const val    = row[tool.key as ToolKey]
                    const isHov  = hov?.division === row.division && hov?.toolKey === tool.key
                    const abbrev = DIV_ABBREV[row.division] ?? row.division.slice(0, 4)
                    const topPx  = stagger === 0 ? 6 : 36

                    return (
                      <div
                        key={row.division}
                        onMouseEnter={e => {
                          const r = e.currentTarget.getBoundingClientRect()
                          setHov({ division: row.division, toolKey: tool.key as ToolKey, x: r.left + r.width / 2, y: r.top })
                        }}
                        onMouseLeave={() => setHov(null)}
                        style={{
                          position: 'absolute',
                          left: `calc(${val}% - 20px)`,
                          top: topPx,
                          width: 40,
                          height: 28,
                          borderRadius: 7,
                          background: isHov ? tool.color : `${tool.color}22`,
                          border: `1.5px solid ${isHov ? tool.color : `${tool.color}45`}`,
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', gap: 0,
                          cursor: 'default',
                          transition: 'all 0.15s',
                          zIndex: isHov ? 10 : 1,
                          boxShadow: isHov ? `0 4px 12px ${tool.color}44` : 'none',
                        }}
                      >
                        <span style={{ fontSize: 9, fontWeight: 800, color: isHov ? '#fff' : tool.color, lineHeight: 1 }}>
                          {abbrev}
                        </span>
                        <span style={{ fontSize: 9.5, fontWeight: 700, color: isHov ? 'rgba(255,255,255,0.85)' : tool.color, lineHeight: 1.2 }}>
                          {val}%
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Avg badge right side */}
                <div style={{ paddingRight: 14, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                  <span style={{ fontSize: 9, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>org avg</span>
                  <span style={{ fontSize: 18, fontWeight: 800, color: tool.color, lineHeight: 1 }}>{avg}%</span>
                </div>
              </div>
            )
          })}

          {/* X-axis bottom label */}
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 64px', marginTop: 2 }}>
            <div />
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1px' }}>
              <span style={{ fontSize: 10, color: '#c4bfb8' }}>Low adoption</span>
              <span style={{ fontSize: 10, color: '#c4bfb8' }}>Full adoption</span>
            </div>
            <div />
          </div>
        </div>
      </div>

      {/* ── Floating tooltip ──────────────────────────────────────── */}
      {hov && (() => {
        const tool   = TOOLS.find(t => t.key === hov.toolKey)!
        const rowData = TOOL_SEED.find(r => r.division === hov.division)!
        const val    = rowData[hov.toolKey]
        const org    = TOOL_AVGS[hov.toolKey]
        const diff   = val - org
        return (
          <div style={{
            position: 'fixed',
            left: hov.x,
            top: hov.y - 10,
            transform: 'translate(-50%, -100%)',
            background: 'rgba(22,22,24,0.97)',
            borderRadius: 10,
            padding: '10px 14px',
            boxShadow: '0 8px 28px rgba(0,0,0,0.3)',
            border: `1px solid ${tool.color}40`,
            zIndex: 9999,
            pointerEvents: 'none',
            minWidth: 178,
          }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{hov.division}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Icon name={tool.icon} style={{ color: tool.color, fontSize: 13 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: tool.color }}>{tool.label}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${val}%`, height: '100%', background: tool.color, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{val}%</span>
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
