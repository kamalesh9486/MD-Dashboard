/* Recharts renderers for the redesigned MD Dashboard, styled to the handoff.
   The project mandates Recharts for charts (CLAUDE.md) — the handoff drew raw
   SVG, so these reproduce its look (colours, rounded bars, green area) while
   staying on the approved library. The gauge stays hand-drawn SVG (not a
   Recharts primitive). Dark tooltip constants are mandatory (CLAUDE.md). */
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, PieChart, Pie, LabelList,
} from 'recharts'
import { T, HEAD_FONT, BODY_FONT, PILLAR } from './lib/tokens'
import { Num } from './CountUp'
import type { Datum } from './lib/peopleAnalytics'
import { useThemeMode, type ThemeMode } from './lib/theme'

/* Recharts writes fill/stroke as SVG ATTRIBUTES, which don't resolve CSS var(),
   so chart glyphs get concrete hex per theme (DOM parts still use the T vars). */
function svgTheme(mode: ThemeMode) {
  const dark = mode === 'dark'
  return {
    axis: dark ? '#93A29A' : '#7C8A82',
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(16,32,26,0.06)',
    track: dark ? '#232E28' : '#EDF1EF',
    surface: dark ? '#1B2520' : '#ffffff',
    accent: dark ? '#18B877' : '#0B7A46',
  }
}

const TT_STYLE: CSSProperties = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL: CSSProperties = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM: CSSProperties = { color: '#fff', fontWeight: 600 }
const AXIS = { fontSize: 11 } as const
const PAL = [T.green, T.blue, T.amber, T.slate, T.greenPillar, '#7C3AED', '#0EA5A3', '#EF6F53', '#12B76A', '#C026A6', '#0C4A2E', '#D97706', '#3B82F6']

/* ── half-circle gauge ─────────────────────────────────────
   Default: a single speedometer arc + centre number (both sweep in together).
   With `pillars`, it becomes a CONCENTRIC gauge — one nested half-arc per pillar
   (outer→inner), each in its own colour, with the overall value in the centre and
   a small colour legend below. Arcs clamp visually at 100% but the legend shows the
   real % (e.g. People 151%). */
type GaugePillar = { label: string; value: number | null; color: string; display?: string; over?: number }
export function Gauge({ value, caption = 'Towards Agentic AI Mandate', size = 178, pillars, showLegend = true }: { value: number | null; caption?: string; size?: number; pillars?: GaugePillar[]; showLegend?: boolean }) {
  const cx = 100, cy = 110
  const sv = svgTheme(useThemeMode())
  const rings = pillars?.slice(0, 3) ?? null
  const [p, setP] = useState(0) // shared 0→1 animation progress
  const raf = useRef(0)
  useEffect(() => {
    if (value == null) return
    let start = 0
    const tick = (t: number) => {
      if (!start) start = t
      const prog = Math.min(1, (t - start) / 1200)
      setP(1 - Math.pow(1 - prog, 3))
      if (prog < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])
  // point on the upper semicircle of radius R at fraction f (0 = left/180°, 1 = right/0°)
  const pt = (R: number, f: number) => { const a = Math.PI * (1 - f); return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}` }
  const arc = (R: number, f: number) => `M${pt(R, 0)} A${R} ${R} 0 0 1 ${pt(R, f)}`
  const clampFrac = (v: number | null) => Math.max(0, Math.min(1, (v ?? 0) / 100))
  const shownOverall = Math.round((value ?? 0) * p)

  // ── single 180° half-ring split into N EQUAL partitions — one per pillar ──
  // Each partition is its own 0–100% gauge (its coloured fill = that pillar's % of
  // its own zone); thin radial ticks separate the partitions; People fills to 100
  // and shows a "+51%" exceed marker.
  if (rings) {
    const gcy = 116, R = 74, sw = 15
    const SPAN = 180, START = -90     // degrees, clockwise from top → upper semicircle
    const g = 0.02                    // gap (arc fraction) between partitions
    const rad = (f: number) => (START + SPAN * f) * Math.PI / 180
    const pAt = (f: number) => { const th = rad(f); return `${(cx + R * Math.sin(th)).toFixed(1)},${(gcy - R * Math.cos(th)).toFixed(1)}` }
    const seg = (f0: number, f1: number) => `M${pAt(f0)} A${R} ${R} 0 ${(f1 - f0) * SPAN > 180 ? 1 : 0} 1 ${pAt(f1)}`
    // radial separator tick straddling the ring at boundary fraction fb
    const tick = (fb: number) => {
      const th = rad(fb), s = Math.sin(th), c = Math.cos(th), r0 = R - sw / 2 - 3, r1 = R + sw / 2 + 3
      return `M${(cx + r0 * s).toFixed(1)},${(gcy - r0 * c).toFixed(1)} L${(cx + r1 * s).toFixed(1)},${(gcy - r1 * c).toFixed(1)}`
    }
    const zoneLen = 1 / rings.length
    const overPl = rings.find(r => r.over)
    return (
      <div style={{ width: '100%', maxWidth: size }}>
        <svg viewBox="0 0 200 126" style={{ width: '100%', display: 'block' }}>
          <title>{value != null ? `Transformation progress: ${value}% (Services/Processes/People)` : 'No data'}</title>
          {rings.map((pl, i) => {
            const a = i * zoneLen + g          // partition start (inset by the gap)
            const b = (i + 1) * zoneLen - g    // partition end
            const fillFrac = Math.max(0, Math.min(1, (pl.value ?? 0) / 100))
            const end = a + (b - a) * fillFrac * p
            return (
              <g key={i}>
                {/* butt caps so a filled partition never bleeds past its boundary line */}
                <path d={seg(a, b)} fill="none" stroke={sv.track} strokeWidth={sw} strokeLinecap="butt" />
                {value != null && end > a + 0.004 && <path d={seg(a, end)} fill="none" stroke={pl.color} strokeWidth={sw} strokeLinecap="butt" />}
              </g>
            )
          })}
          {/* separator lines between partitions */}
          {rings.slice(1).map((_, i) => (
            <path key={`sep${i}`} d={tick((i + 1) * zoneLen)} stroke={sv.surface} strokeWidth={4} strokeLinecap="round" />
          ))}
          <text x={cx} y={gcy - 22} textAnchor="middle" style={{ font: `800 32px ${HEAD_FONT}`, fill: sv.accent }}>{value != null ? `${shownOverall}%` : 'NA'}</text>
          {value != null && overPl && (
            <text x={cx} y={gcy - 6} textAnchor="middle" style={{ font: `700 9.5px ${BODY_FONT}`, fill: overPl.color }}>{overPl.label} exceeded by +{overPl.over}%</text>
          )}
        </svg>
        {showLegend && <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 4 }}>
          {rings.map(pl => (
            <span key={pl.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: 3, background: pl.color, flex: '0 0 auto' }} />
              <span style={{ font: `600 12px ${BODY_FONT}`, color: T.mut2 }}>{pl.label}</span>
              <span style={{ font: `700 12.5px ${HEAD_FONT}`, color: T.ink, fontVariantNumeric: 'tabular-nums' }}>{pl.display ?? (pl.value == null ? 'NA' : `${pl.value}%`)}</span>
            </span>
          ))}
        </div>}
      </div>
    )
  }

  // ── single-value speedometer (default) ──
  const R = 82, sw = 20
  const frac = clampFrac(value) * p
  return (
    <svg viewBox="0 0 200 166" style={{ width: '100%', maxWidth: size, display: 'block' }}>
      <title>{value != null ? `Transformation progress: ${value}%` : 'No data'}</title>
      <path d={arc(R, 1)} fill="none" stroke={sv.track} strokeWidth={sw} strokeLinecap="round" />
      {value != null && frac > 0.002 && (
        <path d={arc(R, frac)} fill="none" stroke="url(#gaugeGrad)" strokeWidth={sw} strokeLinecap="round" />
      )}
      <defs><linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={T.greenBright} /><stop offset="1" stopColor={T.green} /></linearGradient></defs>
      <text x={cx} y={cy - 8} textAnchor="middle" style={{ font: `800 40px ${HEAD_FONT}`, fill: sv.accent }}>{value != null ? `${shownOverall}%` : 'NA'}</text>
      {caption && <text x={cx} y={cy + 50} textAnchor="middle" style={{ font: `700 11px ${BODY_FONT}`, fill: sv.axis, letterSpacing: '.08em' }}>{caption.toUpperCase()}</text>}
    </svg>
  )
}

/* ── smooth green area (progress / delivery trend) ───────── */
export function TrendArea({ data, unit = 'Value', height = 200, labelSuffix = '' }: { data: Datum[]; unit?: string; height?: number; labelSuffix?: string }) {
  const sv = svgTheme(useThemeMode())
  if (!data.length) return <NaBox note="No dated data" />
  const step = Math.max(0, Math.ceil(data.length / 8) - 1)
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 26, right: 16, left: -6, bottom: 4 }}>
        <defs><linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={T.greenBright} stopOpacity={0.28} /><stop offset="1" stopColor={T.greenBright} stopOpacity={0} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke={sv.grid} vertical={false} />
        <XAxis dataKey="name" tick={{ ...AXIS, fill: sv.axis }} axisLine={false} tickLine={false} interval={step} padding={{ left: 18, right: 22 }} />
        <YAxis tick={{ ...AXIS, fill: sv.axis }} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        <Area type="monotone" dataKey="value" name={unit} stroke={sv.accent} strokeWidth={3} fill="url(#trendArea)" dot={{ r: 3, fill: sv.surface, stroke: sv.accent, strokeWidth: 2 }} activeDot={{ r: 5 }}>
          {/* always-visible value labels so the progress reads without hovering */}
          <LabelList dataKey="value" position="top" offset={10} formatter={(v) => `${v}${labelSuffix}`} style={{ font: `700 11px ${HEAD_FONT}`, fill: sv.accent }} />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── stacked portfolio-growth bars ─────────────────────────
   One stacked column per month: Services + Processes (cumulative counts) and
   Training Events (events delivered that month). Only the topmost segment gets
   rounded corners so the stack reads as one bar. Legend is a static label row
   (no filtering). */
type Series = 'customer' | 'processes' | 'people'
export function PortfolioBars({ data }: { data: { month: string; customer: number; processes: number; people: number }[] }) {
  const defs: { id: Series; label: string; color: string }[] = [
    { id: 'customer', label: 'Services', color: PILLAR.Services },
    { id: 'processes', label: 'Processes', color: PILLAR.Processes },
    { id: 'people', label: 'People', color: PILLAR.People },
  ]
  const sv = svgTheme(useThemeMode())
  if (!data.length) return <NaBox note="No dated portfolio data" />
  return (
    <>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {defs.map(s => (
          <span key={s.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
            <span style={{ font: `600 12px ${BODY_FONT}`, color: T.mut2 }}>{s.label}</span>
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 16, right: 12, left: -6, bottom: 4 }} barCategoryGap="26%">
          <CartesianGrid strokeDasharray="3 3" stroke={sv.grid} vertical={false} />
          <XAxis dataKey="month" tick={{ ...AXIS, fill: sv.axis }} axisLine={false} tickLine={false} />
          <YAxis tick={{ ...AXIS, fill: sv.axis }} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
          <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} cursor={{ fill: 'rgba(16,32,26,0.04)' }} />
          {defs.map((s, i) => (
            <Bar key={s.id} dataKey={s.id} name={s.label} stackId="pg" fill={s.color}
              radius={i === defs.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={54} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

/* ── donut + side legend (People: reach by learning program) ── */
export function ReachDonut({ data, total, unit = 'Participants', sizeOverride }: { data: Datum[]; total: number | null; unit?: string; sizeOverride?: number }) {
  const sv = svgTheme(useThemeMode())
  if (!data.length) return <NaBox note="No participation data" />
  const d = data.map((x, i) => ({ ...x, fill: PAL[i % PAL.length] }))
  // Many categories → wider donut + a two-column legend beside it; few → the
  // classic donut + single-column legend. Legend values are right-aligned within
  // each column so all the numbers line up.
  const many = d.length > 6
  const size = sizeOverride ?? (many ? 182 : 158)
  const donut = (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={d} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={size * 0.34} outerRadius={size * 0.5} paddingAngle={2} stroke={sv.surface} strokeWidth={2}>
            {d.map((s, i) => <Cell key={i} fill={s.fill} />)}
          </Pie>
          <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <div style={{ font: `800 28px ${HEAD_FONT}`, color: T.ink }}><Num v={total} /></div>
        <div style={{ font: `600 9px ${BODY_FONT}`, color: T.mut3, letterSpacing: '.04em', textTransform: 'uppercase' }}>{unit}</div>
      </div>
    </div>
  )
  const legend = (
    <div style={{
      display: 'grid',
      gridTemplateColumns: many ? 'repeat(2, minmax(0, 1fr))' : '1fr',
      columnGap: 28,
      rowGap: 11,
      flex: many ? '1 1 300px' : '1 1 170px',
      minWidth: many ? 260 : 160,
      maxWidth: many ? 380 : 240,
      alignContent: 'center',
    }}>
      {d.map(s => (
        <div key={s.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.fill, flex: '0 0 auto' }} />
            <span style={{ font: `500 12.5px ${BODY_FONT}`, color: T.mut2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
          </div>
          <span style={{ font: `700 14px ${HEAD_FONT}`, color: T.ink, flex: '0 0 auto', fontVariantNumeric: 'tabular-nums' }}>{s.value.toLocaleString('en-US')}</span>
        </div>
      ))}
    </div>
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: many ? 28 : 24, width: '100%', height: '100%', minHeight: 190, marginTop: 8, flexWrap: 'wrap' }}>
      {donut}
      {legend}
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
