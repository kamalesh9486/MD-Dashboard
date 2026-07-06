import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts'
import Icon from '../../components/Icon'
import type { CopilotAppDivRow } from '../../services/CopilotAdoptionService'

// ── Colours ──────────────────────────────────────────────────────────
const B = '#0078d4'
const G = '#007560'

const TT_STYLE = { background: 'rgba(20,26,43,0.95)', border: 'none', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

// Same multi-stop interpolation as ExecutiveSummary heatColor
function heatColor(v: number, max: number, mode: 'adoption' | 'actions'): string {
  if (!v || max === 0) return '#f4f6f9'
  const t = Math.min(1, mode === 'adoption' ? v / 100 : Math.log(v + 1) / Math.log(max + 1))
  if (t === 0) return '#f4f6f9'
  // Green stops for adoption, Blue stops for actions
  const stops: [number, [number,number,number]][] = mode === 'adoption'
    ? [[0,[236,247,240]],[0.35,[185,230,200]],[0.70,[42,169,90]],[1,[10,125,62]]]
    : [[0,[235,242,252]],[0.35,[168,204,241]],[0.70,[48,130,209]],[1,[0,78,160]]]
  for (let i = 0; i < stops.length - 1; i++) {
    const [a, ca] = stops[i]; const [b, cb] = stops[i + 1]
    if (t >= a && t <= b) {
      const k = (t - a) / (b - a)
      return `rgb(${Math.round(ca[0]+(cb[0]-ca[0])*k)},${Math.round(ca[1]+(cb[1]-ca[1])*k)},${Math.round(ca[2]+(cb[2]-ca[2])*k)})`
    }
  }
  return mode === 'adoption' ? 'rgb(10,125,62)' : 'rgb(0,78,160)'
}

function cellText(v: number, _max: number, mode: 'adoption' | 'actions'): string {
  if (!v) return ''
  return mode === 'adoption' ? `${v}%` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)
}

function cellFg(v: number, maxA: number, mode: 'adoption' | 'actions'): string {
  const t = mode === 'adoption' ? v / 100 : (maxA > 0 ? Math.log(v+1)/Math.log(maxA+1) : 0)
  return t > 0.55 ? '#fff' : '#1c1c1e'
}

type Mode      = 'adoption' | 'actions'
type HeatTip   = { label: string; app: string; adoption: number; actions: number; x: number; y: number } | null
type Spotlight = { type: 'row' | 'col'; key: string } | null

const TOP_N = 8

const APP_SHORT: Record<string,string> = {
  Outlook:'Outlook', Word:'Word', Excel:'Excel', PowerPoint:'PPT',
  Teams:'Teams', OutlookSidepane:'OL Sidepane', Edge:'Edge', Forms:'Forms',
  Designer:'Designer', SharePoint:'SharePoint',
}
const DIV_SHORT: Record<string,string> = {
  'INNOVATION & THE FUTURE':             'Innovation & Future',
  'DISTRIBUTION POWER':                  'Distribution Power',
  'TRANSMISSION POWER':                  'Transmission Power',
  'GENERATION (P&W)':                    'Generation (P&W)',
  'WATER & CIVIL':                       'Water & Civil',
  'BUSINESS SUPPORT & HUMAN RESOURCES':  'Business Support & HR',
  'BUSINESS DEVELOPMENT & EXCELLENCE':   'Business Dev. & Excellence',
  'BILLING SERVICES':                    'Billing Services',
  'FINANCE':                             'Finance',
  'POWER & WATER PLANNING':             'PW Planning',
  'INTERNAL AUDIT':                      'Internal Audit',
  'STRATEGY & GOVERNMENT COMMUNICATION': 'Strategy & Gov. Comm.',
  'LEGAL AFFAIRS':                       'Legal Affairs',
}
const sa = (a: string) => APP_SHORT[a] ?? (a.length > 10 ? a.slice(0,9)+'…' : a)
const sd = (d: string) => DIV_SHORT[d] ?? d

export default function CopilotAppDivHeatmap({ rows }: { rows: CopilotAppDivRow[] }) {
  const [mode,      setMode]      = useState<Mode>('adoption')
  const [heatTip,   setHeatTip]   = useState<HeatTip>(null)
  const [spotlight, setSpotlight] = useState<Spotlight>(null)

  const topApps = useMemo(() => {
    const tot = new Map<string,number>()
    rows.forEach(r => tot.set(r.app, (tot.get(r.app) ?? 0) + r.actions))
    return [...tot.entries()].sort((a,b) => b[1]-a[1]).slice(0, TOP_N).map(([a]) => a)
  }, [rows])

  const allDivs = useMemo(() => {
    const tot = new Map<string,number>()
    rows.forEach(r => tot.set(r.division, (tot.get(r.division) ?? 0) + r.actions))
    return [...tot.entries()].sort((a,b) => b[1]-a[1]).map(([d]) => d)
  }, [rows])

  const cellMap = useMemo(() => {
    const m = new Map<string,CopilotAppDivRow>()
    rows.forEach(r => m.set(`${r.division}::${r.app}`, r))
    return m
  }, [rows])

  const maxActions = useMemo(() => Math.max(...rows.map(r => r.actions), 1), [rows])

  const spotlightData = useMemo(() => {
    if (!spotlight) return []
    if (spotlight.type === 'row') {
      return topApps.map(app => {
        const c = cellMap.get(`${spotlight.key}::${app}`)
        return { label: sa(app), adoption: c?.adoptionPct ?? 0, actions: c?.actions ?? 0 }
      }).sort((a,b) => b.adoption - a.adoption)
    }
    return allDivs.map(div => {
      const c = cellMap.get(`${div}::${spotlight.key}`)
      return { label: sd(div), adoption: c?.adoptionPct ?? 0, actions: c?.actions ?? 0 }
    }).sort((a,b) => b.adoption - a.adoption)
  }, [spotlight, topApps, allDivs, cellMap])

  if (rows.length === 0) return null

  const gradientBar = mode === 'adoption'
    ? 'linear-gradient(90deg,#ecf7f0,#b9e6c8 40%,#2aa95a 75%,#0a7d3e)'
    : 'linear-gradient(90deg,#ebf3fc,#a8cef1 40%,#2f82d1 75%,#004ea0)'
  const scaleLabel = mode === 'adoption' ? ['0%','100%'] : ['Low','High']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Card ── */}
      <div className="es-card" style={{ padding: 20 }}>

        {/* Card head */}
        <div className="es-card-head">
          <div className="es-card-title-group">
            <div className="es-card-eyebrow">App × Division · Copilot usage breakdown</div>
            <h3 className="es-card-title">Usage matrix — top {TOP_N} apps × all divisions</h3>
            <div className="es-card-sub">
              Click a division label to spotlight its app mix · {allDivs.length} divisions · {topApps.length} apps shown
            </div>
          </div>
          <div className="es-card-actions">
            <button className={`es-mini-tab${mode === 'adoption' ? ' active' : ''}`} onClick={() => setMode('adoption')}>
              Adoption %
            </button>
            <button className={`es-mini-tab${mode === 'actions' ? ' active' : ''}`} onClick={() => setMode('actions')}>
              Actions
            </button>
          </div>
        </div>

        {/* Heat grid */}
        <div className="es-heat-scroll">
          {/* Column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `136px repeat(${TOP_N}, minmax(22px, 1fr))`,
            gap: 3, minWidth: 460, marginBottom: 3,
          }}>
            <div />
            {topApps.map(app => (
              <div key={app} className="es-heat-col-label" title={app}
                style={{ fontSize: 10.5, fontWeight: 600, color: spotlight?.key === app ? B : '#7a85a0', cursor: 'pointer', padding: '0 2px' }}
                onClick={() => setSpotlight(s => s?.key === app ? null : { type: 'col', key: app })}>
                {sa(app)}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {allDivs.map(div => (
            <div key={div} style={{
              display: 'grid',
              gridTemplateColumns: `136px repeat(${TOP_N}, minmax(22px, 1fr))`,
              gap: 3, marginTop: 3, minWidth: 460,
            }}>
              {/* Row label */}
              <div className="es-heat-label"
                title={div}
                style={{ cursor: 'pointer', color: spotlight?.key === div ? G : '#5a6682', fontWeight: spotlight?.key === div ? 700 : 400 }}
                onClick={() => setSpotlight(s => s?.key === div ? null : { type: 'row', key: div })}>
                {sd(div)}
              </div>

              {/* Cells */}
              {topApps.map(app => {
                const cell = cellMap.get(`${div}::${app}`)
                const val  = mode === 'adoption' ? (cell?.adoptionPct ?? 0) : (cell?.actions ?? 0)
                const bg   = heatColor(val, maxActions, mode)
                const fg   = cellFg(val, maxActions, mode)
                const txt  = cellText(val, maxActions, mode)
                return (
                  <div
                    key={app}
                    className="es-heat-cell"
                    style={{ background: bg, cursor: 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: fg, height: 36, aspectRatio: 'unset' }}
                    onMouseEnter={e => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setHeatTip({ label: sd(div), app: sa(app), adoption: cell?.adoptionPct ?? 0, actions: cell?.actions ?? 0, x: r.left + r.width / 2, y: r.top })
                    }}
                    onMouseLeave={() => setHeatTip(null)}
                  >
                    {cell ? txt : ''}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="es-heat-footer">
          <div className="es-heat-scale">
            <span>{scaleLabel[0]}</span>
            <span className="es-heat-scale-bar" style={{ background: gradientBar }} />
            <span>{scaleLabel[1]}</span>
          </div>
          <div style={{ fontSize: 11.5, color: '#5a6682', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Icon name="bi-cursor-fill" style={{ fontSize: 11 }} />
            Click a division or app header to spotlight breakdown
          </div>
        </div>
      </div>

      {/* ── Spotlight Card ── */}
      {spotlight && spotlightData.length > 0 && (
        <div className="es-card" style={{ padding: 20 }}>
          <div className="es-card-head">
            <div className="es-card-title-group">
              <div className="es-card-eyebrow">
                {spotlight.type === 'row' ? 'Division spotlight' : 'App spotlight'}
              </div>
              <h3 className="es-card-title">
                {spotlight.type === 'row'
                  ? `${sd(spotlight.key)} — app usage breakdown`
                  : `${sa(spotlight.key)} — division adoption breakdown`}
              </h3>
              <div className="es-card-sub">Sorted by adoption rate highest → lowest</div>
            </div>
            <div className="es-card-actions">
              <button
                onClick={() => setSpotlight(null)}
                style={{ border: 0, background: '#eef0f6', cursor: 'pointer', color: '#5a6682', fontSize: 13, fontWeight: 600, padding: '4px 10px', borderRadius: 6 }}
              >
                ✕ Close
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, spotlightData.length * 38 + 48)}>
            <BarChart data={spotlightData} layout="vertical"
              margin={{ top: 0, right: 60, left: 0, bottom: 0 }} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(v: number) => `${v}%`}
                tick={{ fontSize: 10.5, fill: '#9aa3bb' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="label"
                width={spotlight.type === 'row' ? 90 : 172}
                tick={{ fontSize: 11, fill: '#5a6682' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
                formatter={(v: unknown) => [`${v as number}%`, 'Adoption']} />
              <Bar dataKey="adoption" name="Adoption %" radius={[0, 5, 5, 0]}>
                {spotlightData.map((r, i) => (
                  <Cell key={i} fill={heatColor(r.adoption, 100, 'adoption')} />
                ))}
                <LabelList dataKey="adoption" position="right"
                  content={({ value, x, y, width, height }) => (
                    <text x={(x as number)+(width as number)+6} y={(y as number)+(height as number)/2}
                      fill="#5a6682" fontSize={11} fontWeight={700} dominantBaseline="middle">
                      {`${value as number}%`}
                    </text>
                  )}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Fixed hover tooltip (same pattern as ES heatmap) ── */}
      {heatTip && (
        <div className="es-heat-tooltip" style={{ left: heatTip.x, top: heatTip.y }}>
          <div className="es-tooltip-label">{heatTip.label} · {heatTip.app}</div>
          <div className="es-tooltip-val">Adoption: <strong>{heatTip.adoption}%</strong></div>
          <div className="es-tooltip-val" style={{ marginTop: 2 }}>Actions: <strong>{heatTip.actions.toLocaleString()}</strong></div>
        </div>
      )}
    </div>
  )
}
