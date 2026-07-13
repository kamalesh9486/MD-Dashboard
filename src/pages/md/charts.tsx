/* Recharts renderers for the redesigned MD Dashboard, styled to the handoff.
   The project mandates Recharts for charts (CLAUDE.md) — the handoff drew raw
   SVG, so these reproduce its look (colours, rounded bars, green area) while
   staying on the approved library. The gauge stays hand-drawn SVG (not a
   Recharts primitive). Dark tooltip constants are mandatory (CLAUDE.md). */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie,
} from 'recharts'
import { T, HEAD_FONT, BODY_FONT, PILLAR } from './tokens'
import { Num } from './CountUp'
import type { Datum } from './peopleAnalytics'

const TT_STYLE: CSSProperties = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL: CSSProperties = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM: CSSProperties = { color: '#fff', fontWeight: 600 }
const AXIS = { fontSize: 11, fill: T.mut } as const
const GRID = 'rgba(16,32,26,0.06)'
const PAL = [T.green, T.blue, T.amber, T.slate, T.greenPillar, '#7FB39F']

/* ── half-circle speedometer gauge — arc + number sweep in together ── */
export function Gauge({ value, caption = 'COMPLETE', size = 178 }: { value: number | null; caption?: string; size?: number }) {
  const R = 82, cx = 100, cy = 110, sw = 20
  const [shown, setShown] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (value == null) return
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t
      const p = Math.min(1, (t - start) / 1200)
      setShown(value * (1 - Math.pow(1 - p, 3)))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    // first frame (p≈0) sets the value to 0, so no synchronous reset needed
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  const frac = Math.max(0, Math.min(1, (value == null ? 0 : shown) / 100))
  // point on the upper semicircle at fraction f (0 = left/180°, 1 = right/0°)
  const pt = (f: number) => { const a = Math.PI * (1 - f); return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}` }
  const track = `M${pt(0)} A${R} ${R} 0 0 1 ${pt(1)}`
  const fill = `M${pt(0)} A${R} ${R} 0 0 1 ${pt(frac)}`
  return (
    <svg viewBox="0 0 200 132" style={{ width: '100%', maxWidth: size, display: 'block' }}>
      <title>{value != null ? `Transformation progress: ${value}%` : 'No data'}</title>
      <path d={track} fill="none" stroke={T.track} strokeWidth={sw} strokeLinecap="round" />
      {value != null && frac > 0.002 && (
        <path d={fill} fill="none" stroke="url(#gaugeGrad)" strokeWidth={sw} strokeLinecap="round" />
      )}
      <defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={T.greenBright} /><stop offset="1" stopColor={T.green} /></linearGradient></defs>
      <text x={cx} y={cy - 22} textAnchor="middle" style={{ font: `800 40px ${HEAD_FONT}`, fill: T.green }}>{value != null ? `${Math.round(shown)}%` : 'NA'}</text>
      <text x={cx} y={cy + 2} textAnchor="middle" style={{ font: `600 12px ${BODY_FONT}`, fill: T.mut, letterSpacing: '.06em' }}>{caption}</text>
    </svg>
  )
}

/* ── smooth green area (progress / delivery trend) ───────── */
export function TrendArea({ data, unit = 'Value', height = 200 }: { data: Datum[]; unit?: string; height?: number }) {
  if (!data.length) return <NaBox note="No dated data" />
  const step = Math.max(0, Math.ceil(data.length / 8) - 1)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 14, right: 14, left: -6, bottom: 4 }}>
        <defs><linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={T.greenBright} stopOpacity={0.28} /><stop offset="1" stopColor={T.greenBright} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval={step} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        <Area type="monotone" dataKey="value" name={unit} stroke={T.green} strokeWidth={3} fill="url(#trendArea)" dot={{ r: 3, fill: '#fff', stroke: T.green, strokeWidth: 2 }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── stacked portfolio-growth bars with toggle chips ───────
   One stacked column per month: Services + Processes (cumulative counts) and
   Training Events (events delivered that month). Only the topmost visible
   segment gets rounded corners so the stack reads as one bar. */
type Series = 'customer' | 'processes' | 'people'
export function PortfolioBars({ data }: { data: { month: string; customer: number; processes: number; people: number }[] }) {
  const [on, setOn] = useState<Record<Series, boolean>>({ customer: true, processes: true, people: true })
  const defs: { id: Series; label: string; color: string }[] = [
    { id: 'customer', label: 'Services', color: PILLAR.Services },
    { id: 'processes', label: 'Processes', color: PILLAR.Processes },
    { id: 'people', label: 'People', color: PILLAR.People },
  ]
  if (!data.length) return <NaBox note="No dated portfolio data" />
  const visible = defs.filter(s => on[s.id])
  return (
    <>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {defs.map(s => (
          <button key={s.id} onClick={() => setOn(o => ({ ...o, [s.id]: !o[s.id] }))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: `1px solid ${T.border}`, background: on[s.id] ? T.card : T.bgSlate, borderRadius: 999, padding: '6px 12px', cursor: 'pointer', opacity: on[s.id] ? 1 : 0.45 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span style={{ font: `600 12px ${BODY_FONT}`, color: T.mut2 }}>{s.label}</span>
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 16, right: 12, left: -6, bottom: 4 }} barCategoryGap="26%">
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
          <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} cursor={{ fill: 'rgba(16,32,26,0.04)' }} />
          {visible.map((s, i) => (
            <Bar key={s.id} dataKey={s.id} name={s.label} stackId="pg" fill={s.color}
              radius={i === visible.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={54} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

/* ── donut + side legend (People: reach by learning program) ── */
export function ReachDonut({ data, total, unit = 'Participants' }: { data: Datum[]; total: number | null; unit?: string }) {
  if (!data.length) return <NaBox note="No participation data" />
  const d = data.map((x, i) => ({ ...x, fill: PAL[i % PAL.length] }))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 14, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 150, height: 150, flex: '0 0 150px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={d} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={2} stroke="#fff" strokeWidth={2}>
              {d.map((s, i) => <Cell key={i} fill={s.fill} />)}
            </Pie>
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ font: `800 24px ${HEAD_FONT}`, color: T.ink }}><Num v={total} /></div>
          <div style={{ font: `600 9px ${BODY_FONT}`, color: T.mut3, letterSpacing: '.04em', textTransform: 'uppercase' }}>{unit}</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, flex: 1, minWidth: 160 }}>
        {d.map(s => (
          <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: s.fill }} />
              <span style={{ font: `500 12.5px ${BODY_FONT}`, color: T.mut2 }}>{s.name}</span>
            </div>
            <span style={{ font: `700 14px ${HEAD_FONT}`, color: T.ink }}>{s.value.toLocaleString('en-US')}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── technology distribution (People) — horizontal bars ──
   A treemap can't label the tiny tiles when the data is heavily skewed
   (e.g. 116 vs 3), so this uses ranked horizontal bars: every technology shows
   its name + count regardless of magnitude, each in its own colour. */
export function TechTreemap({ data }: { data: Datum[] }) {
  if (!data.length) return <NaBox note="No technology data" />
  const rows = [...data].sort((a, b) => b.value - a.value)
  const max = Math.max(...rows.map(r => r.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
      {rows.map((d, i) => {
        const color = PAL[i % PAL.length]
        return (
          <div key={d.name} title={`${d.name}: ${d.value.toLocaleString('en-US')}`}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `600 12.5px ${BODY_FONT}`, color: T.ink }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />{d.name}
              </span>
              <span style={{ font: `800 14px ${HEAD_FONT}`, color: T.ink }}>{d.value.toLocaleString('en-US')}</span>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: T.track, overflow: 'hidden' }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', borderRadius: 6, background: color, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── diverging two-sided division chart (People: reach by division) ──
   The ranked divisions are dealt alternately into two colour-coded columns:
   left column grows rightward toward the centre axis, right column grows
   leftward — a "mirror/tornado" split where each side holds different divisions.
   Every bar has its own colour, values sit on the outer ends, and a legend maps
   colours → divisions. Hand-laid-out (like the gauge/treemap) because Recharts
   has no diverging-mirror layout. */
const MIRROR_PAL = ['#0C4A2E', '#12B76A', '#2E6BE6', '#7C3AED', '#0EA5A3', '#F0A21B', '#1FA971', '#334155']
export function DivisionMirror({ data }: { data: Datum[] }) {
  if (!data.length) return <NaBox note="No division data" />
  const ranked = [...data].sort((a, b) => b.value - a.value).map((d, i) => ({ ...d, color: MIRROR_PAL[i % MIRROR_PAL.length] }))
  const max = Math.max(...ranked.map(r => r.value), 1)
  const left = ranked.filter((_, i) => i % 2 === 0)
  const right = ranked.filter((_, i) => i % 2 === 1)
  const nCols = Math.max(left.length, right.length)
  const name: CSSProperties = { flex: '0 0 96px', font: `600 12px ${BODY_FONT}`, color: T.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  const val: CSSProperties = { flex: '0 0 24px', font: `700 12px ${HEAD_FONT}`, color: T.mut2 }
  const bar = (v: number, c: string, side: 'l' | 'r') => (
    <div style={{ flex: 1, display: 'flex', justifyContent: side === 'l' ? 'flex-start' : 'flex-end' }}>
      <div style={{ width: `${(v / max) * 100}%`, height: 20, borderRadius: 6, background: c, transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  )
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: nCols }).map((_, i) => {
          const l = left[i], r = right[i]
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {l ? <><span style={{ ...name, textAlign: 'right' }}>{l.name}</span><span style={{ ...val, textAlign: 'right' }}>{l.value}</span>{bar(l.value, l.color, 'l')}</> : <span />}
              </div>
              <div style={{ width: 1, height: 22, background: T.track }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                {r ? <>{bar(r.value, r.color, 'r')}<span style={{ ...val, textAlign: 'left' }}>{r.value}</span><span style={{ ...name, textAlign: 'left' }}>{r.name}</span></> : <span />}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 16, paddingTop: 14, borderTop: `1px solid ${T.track}` }}>
        {ranked.map(d => (
          <span key={d.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, font: `500 11.5px ${BODY_FONT}`, color: T.mut2 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            {d.name} <b style={{ color: T.ink }}>{d.value}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

function NaBox({ note }: { note: string }) {
  return (
    <div style={{ minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <div style={{ font: `800 26px ${HEAD_FONT}`, color: T.mut3 }}>NA</div>
      <div style={{ font: `500 12px ${BODY_FONT}`, color: T.mut }}>{note}</div>
    </div>
  )
}
