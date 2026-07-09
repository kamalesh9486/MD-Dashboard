import { useState, type ReactNode } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid, LabelList, AreaChart, Area, Treemap, RadialBarChart, RadialBar, Legend, PieChart, Pie } from 'recharts'
import Icon from '../../components/Icon'
import { C, type BoardData } from './boardv8Data'
import type { PeopleData, Datum } from './aumPeople'

/* mandatory dark-tooltip constants (CLAUDE.md) */
const TT_STYLE = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM = { color: '#fff', fontWeight: 600 }

const NA = () => <span className="na">NA</span>
const show = (s: string | null): ReactNode => (s == null ? <NA /> : s)

/* ── semicircle gauge (0–100, 50% target tick) — same as v1 ─────────── */
function Gauge({ value, naText }: { value: number | null; naText?: string }) {
  const R = 66, cx = 90, cy = 84, frac = Math.max(0, Math.min(1, (value ?? 0) / 100))
  const p = (a: number) => `${(cx + R * Math.cos(a)).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}`
  const tick = Math.PI * 0.5
  return (
    <div style={{ width: '100%' }}>
      {/* target label above the arc; only the value sits under the arc */}
      <div style={{ textAlign: 'center', fontSize: 11.5, fontWeight: 700, letterSpacing: '.02em', color: 'var(--mut)', marginBottom: 2 }}>target 50%</div>
      <svg viewBox="0 0 180 92" width="100%" height="132" preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id="v2g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.gold} /><stop offset="100%" stopColor={C.green} /></linearGradient></defs>
        <path d={`M${p(Math.PI)} A${R} ${R} 0 0 1 ${p(0)}`} fill="none" stroke="var(--track)" strokeWidth="13" strokeLinecap="round" />
        {value != null && <path d={`M${p(Math.PI)} A${R} ${R} 0 0 1 ${p(Math.PI * (1 - frac))}`} fill="none" stroke="url(#v2g)" strokeWidth="13" strokeLinecap="round" />}
        <line x1={cx + (R - 9) * Math.cos(tick)} y1={cy - (R - 9) * Math.sin(tick)} x2={cx + (R + 9) * Math.cos(tick)} y2={cy - (R + 9) * Math.sin(tick)} stroke="var(--gold)" strokeWidth="2.4" />
        <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 34, fontWeight: 800, fill: naText ? 'var(--mut)' : 'var(--tx)' }}>{naText ?? (value != null ? `${value}%` : 'NA')}</text>
      </svg>
    </div>
  )
}

/* ── KPI card (a former table row, now a card) ───────────
   `info`/`formula` are revealed by hovering the card's own metric icon (no extra
   ⓘ button — that would overlap the corner icon). */
function KCard({ label, icon, value, accent, sub, info, formula }: { label: string; icon: string; value: string | null; accent: string; sub?: string; info?: string; formula?: string }) {
  const tip = formula ?? info
  const [open, setOpen] = useState(false)
  return (
    <div className="kpi" style={{ ['--ac' as string]: accent }}>
      <div className="kic" style={{ background: 'var(--inset)', color: accent, cursor: tip ? 'help' : undefined }}
        onMouseEnter={() => tip && setOpen(true)} onMouseLeave={() => setOpen(false)}>
        <Icon name={icon} />
      </div>
      {tip && open && (
        <div style={{ position: 'absolute', top: 50, right: 12, zIndex: 40, width: 220, background: 'rgba(28,28,30,0.96)', color: '#fff', fontSize: 11.5, lineHeight: 1.55, padding: '9px 11px', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.28)', fontWeight: 500, textAlign: 'left' }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>Formula</div>
          {tip}
        </div>
      )}
      <div className="kl">{label}</div>
      <div className="kv">{show(value)}</div>
      {sub && <div className="ks">{sub}</div>}
    </div>
  )
}

/* ── varied chart renderers (no two panels share a type) ─── */
/* mild, on-brand palette — soft blue/green/gold/teal tints, no harsh purple/red */
const PALETTE = ['#6fa8d0', '#5fb39a', '#d7b25e', '#3f8f7d', '#9cc0dd', '#8fcbb6', '#e3cd88', '#7fb39f']

/** Time series → smooth area (handles many months without label pile-up).
 *  `unit` names the measured quantity so the tooltip reads "Events: 27", not
 *  a bare "value" the viewer can't interpret. */
function MiniArea({ data, unit = 'Count' }: { data: Datum[]; unit?: string }) {
  const step = Math.max(0, Math.ceil(data.length / 9) - 1)
  return (
    <ResponsiveContainer width="100%" height={230}>
      <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
        <defs><linearGradient id="v2area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.green} stopOpacity={0.5} /><stop offset="100%" stopColor={C.green} stopOpacity={0.04} /></linearGradient></defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 10.5, fill: '#62736d' }} axisLine={false} tickLine={false} interval={step} angle={-22} textAnchor="end" height={46} />
        <YAxis tick={{ fontSize: 11, fill: '#62736d' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        <Area type="monotone" dataKey="value" name={unit} stroke={C.green} strokeWidth={2.5} fill="url(#v2area)" dot={{ r: 2.5, fill: C.green }} activeDot={{ r: 5 }} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/** Many/long categories → horizontal bars (labels sit on the Y axis). */
function MiniHBar({ data, unit = 'Count' }: { data: Datum[]; unit?: string }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(210, data.length * 34)}>
      <BarChart layout="vertical" data={data} margin={{ top: 8, right: 30, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: '#62736d' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={124} tick={{ fontSize: 11, fill: '#3c4945' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} cursor={{ fill: 'rgba(0,117,96,0.05)' }} />
        <Bar dataKey="value" name={unit} radius={[0, 6, 6, 0]} maxBarSize={22} fill={C.green}>
          <LabelList dataKey="value" position="right" style={{ fontSize: 12, fontWeight: 800, fill: '#1c1c1e' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

/** Few categories → radial bars with a side legend (no axis to overlap).
 *  Each segment is a named category (shown in the legend), so no series unit is
 *  needed — the legend + colour identify what each value means. */
function MiniRadial({ data }: { data: Datum[] }) {
  const d = data.map((x, i) => ({ ...x, fill: PALETTE[i % PALETTE.length] }))
  return (
    <ResponsiveContainer width="100%" height={230}>
      <RadialBarChart innerRadius="28%" outerRadius="100%" data={d} startAngle={90} endAngle={-270}>
        <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(0,117,96,0.06)' }} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
      </RadialBarChart>
    </ResponsiveContainer>
  )
}

/** Share-of-total across many items → treemap (area = size, zero axis clutter). */
interface TreeCellProps { x?: number; y?: number; width?: number; height?: number; name?: string; value?: number; index?: number }
function TreeCell({ x = 0, y = 0, width = 0, height = 0, name = '', value, index = 0 }: TreeCellProps) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={PALETTE[index % PALETTE.length]} stroke="#fff" strokeWidth={2} rx={4} />
      {width > 56 && height > 24 && <text x={x + 8} y={y + 19} fill="#fff" fontSize={11.5} fontWeight={700}>{name}</text>}
      {width > 56 && height > 40 && <text x={x + 8} y={y + 36} fill="rgba(255,255,255,0.9)" fontSize={12} fontWeight={800}>{value}</text>}
    </g>
  )
}
function MiniTreemap({ data }: { data: Datum[] }) {
  const td: { [k: string]: string | number }[] = data.map(d => ({ name: d.name, value: d.value }))
  return (
    <ResponsiveContainer width="100%" height={230}>
      <Treemap data={td} dataKey="value" nameKey="name" stroke="#fff" content={<TreeCell />}>
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
      </Treemap>
    </ResponsiveContainer>
  )
}

/** Composition of a few named parts → donut with a side legend. The legend
 *  names each slice and the tooltip shows "<slice> : <value>", so the reader
 *  never has to guess what a colour or number means. */
function MiniDonut({ data }: { data: Datum[] }) {
  const d = data.map((x, i) => ({ ...x, fill: PALETTE[i % PALETTE.length] }))
  return (
    <ResponsiveContainer width="100%" height={230}>
      <PieChart>
        <Pie data={d} dataKey="value" nameKey="name" cx="42%" cy="50%" innerRadius={46} outerRadius={82} paddingAngle={2} stroke="#fff" strokeWidth={2}>
          {d.map((s, i) => <Cell key={i} fill={s.fill} />)}
        </Pie>
        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" layout="vertical" verticalAlign="middle" align="right" />
      </PieChart>
    </ResponsiveContainer>
  )
}

/** Proportions of a few parts → one horizontal "band" (a flatter, cleaner
 *  variation of the round chart) with an inline legend. Each segment's width is
 *  its share of the total; the value sits inside when the segment is wide enough. */
function MiniBand({ data }: { data: Datum[] }) {
  const total = data.reduce((s, x) => s + x.value, 0) || 1
  const d = data.map((x, i) => ({ ...x, fill: PALETTE[i % PALETTE.length] }))
  return (
    <div style={{ padding: '34px 8px 10px' }}>
      <div style={{ display: 'flex', height: 40, borderRadius: 11, overflow: 'hidden', boxShadow: '0 1px 5px rgba(16,40,34,.10)' }}>
        {d.map(s => (
          <div key={s.name} title={`${s.name}: ${s.value}`}
            style={{ width: `${(s.value / total) * 100}%`, background: s.fill, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13 }}>
            {(s.value / total) >= 0.09 ? s.value : ''}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
        {d.map(s => (
          <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#3c4945' }}>
            <i style={{ width: 11, height: 11, borderRadius: 3, background: s.fill, display: 'inline-block' }} />
            {s.name} <b style={{ color: '#1c1c1e' }}>{s.value}</b>
          </span>
        ))}
      </div>
    </div>
  )
}

/** Time series → month heat-strip (colored cells, intensity = value). A calmer,
 *  non-area way to read cadence — one cell per period, value printed inside. */
function MiniHeat({ data, unit = 'Count' }: { data: Datum[]; unit?: string }) {
  const max = Math.max(1, ...data.map(d => d.value))
  const cols = Math.min(data.length, 12)
  return (
    <div style={{ padding: '20px 6px 10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 8 }}>
        {data.map(d => {
          const t = d.value / max
          return (
            <div key={d.name} title={`${d.name} — ${unit}: ${d.value}`} style={{ textAlign: 'center' }}>
              <div style={{ height: 56, borderRadius: 10, background: `rgba(10,110,87,${(0.12 + t * 0.8).toFixed(2)})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: t > 0.45 ? '#fff' : '#1c3a32', fontWeight: 800, fontSize: 15 }}>{d.value}</div>
              <div style={{ fontSize: 10.5, color: '#62736d', marginTop: 5 }}>{d.name}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** Ranking → dot-plot / lollipop (thin track + dot at value). Not a bar chart. */
function MiniLollipop({ data, unit = 'Count' }: { data: Datum[]; unit?: string }) {
  const rows = data.slice(0, 10)
  const max = Math.max(1, ...rows.map(d => d.value))
  return (
    <div style={{ padding: '14px 10px 8px', display: 'flex', flexDirection: 'column', gap: 13 }}>
      {rows.map((d, i) => {
        const pct = (d.value / max) * 100
        const col = PALETTE[i % PALETTE.length]
        return (
          <div key={d.name} title={`${d.name} — ${unit}: ${d.value}`} style={{ display: 'grid', gridTemplateColumns: '132px 1fr 30px', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11.5, color: '#3c4945', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</span>
            <div style={{ position: 'relative', height: 14 }}>
              <div style={{ position: 'absolute', top: 6, left: 0, right: 0, height: 2, background: 'rgba(0,117,96,0.10)', borderRadius: 2 }} />
              <div style={{ position: 'absolute', top: 6, left: 0, width: `${pct}%`, height: 2, background: col, borderRadius: 2 }} />
              <span style={{ position: 'absolute', top: 1, left: `calc(${pct}% - 6px)`, width: 12, height: 12, borderRadius: '50%', background: col, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <b style={{ fontSize: 12.5, color: '#1c1c1e', textAlign: 'right' }}>{d.value}</b>
          </div>
        )
      })}
    </div>
  )
}

type VizKind = 'hbar' | 'area' | 'treemap' | 'radial' | 'donut' | 'band' | 'heat' | 'lollipop'
function Viz({ kind, data, unit }: { kind: VizKind; data: Datum[]; unit?: string }) {
  if (kind === 'area') return <MiniArea data={data} unit={unit} />
  if (kind === 'treemap') return <MiniTreemap data={data} />
  if (kind === 'radial') return <MiniRadial data={data} />
  if (kind === 'donut') return <MiniDonut data={data} />
  if (kind === 'band') return <MiniBand data={data} />
  if (kind === 'heat') return <MiniHeat data={data} unit={unit} />
  if (kind === 'lollipop') return <MiniLollipop data={data} unit={unit} />
  return <MiniHBar data={data} unit={unit} />
}

/* ── "i" info button → reveals the chart's calculation formula on click ──
   The user wants every chart to carry its formula behind an info button. */
function InfoBtn({ formula }: { formula: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', marginLeft: 'auto', flexShrink: 0 }}>
      <button
        type="button" aria-label="Show formula" title="Show formula"
        onClick={() => setOpen(v => !v)}
        onBlur={() => setOpen(false)}
        style={{ border: 'none', background: 'var(--inset)', color: open ? C.green : '#8a938f', width: 24, height: 24, borderRadius: '50%', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, lineHeight: 1 }}
      >
        <Icon name="bi-info-circle" />
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 30, right: 0, zIndex: 40, width: 250, background: 'rgba(28,28,30,0.96)', color: '#fff', fontSize: 11.5, lineHeight: 1.55, padding: '10px 12px', borderRadius: 9, boxShadow: '0 8px 26px rgba(0,0,0,0.28)', textAlign: 'left', fontWeight: 500 }}>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>Formula</div>
          {formula}
        </div>
      )}
    </span>
  )
}

/* ── panel with an NA fallback when there is no live data ──
   `unit` labels the tooltip value; `subtitle` explains the metric in the header
   so the chart is legible without hovering; `formula` sits behind the ⓘ button. */
function ChartPanel({ title, icon, accent, data, kind, unit, subtitle, formula }: { title: string; icon: string; accent: string; data: Datum[]; kind: VizKind; unit?: string; subtitle?: string; formula?: string }) {
  return (
    <div className="panel">
      <div className="ph"><div className="ic" style={{ background: 'var(--inset)', color: accent }}><Icon name={icon} /></div><div><h3>{title}</h3>{subtitle && <div style={{ fontSize: 11.5, color: '#8a938f', marginTop: 2 }}>{subtitle}</div>}</div>{formula && <InfoBtn formula={formula} />}</div>
      {data.length ? <Viz kind={kind} data={data} unit={unit} /> : <div className="na-panel"><div className="big">NA</div><div className="cap">No live event data</div></div>}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Executive Overview', icon: 'bi-speedometer2' },
  { id: 'people', label: 'People', icon: 'bi-people-fill' },
  { id: 'people2', label: 'People', icon: 'bi-people-fill' },
  { id: 'processes', label: 'Processes & Operations', icon: 'bi-gear' },
  { id: 'customer', label: 'Customer Services', icon: 'bi-chat-dots-fill' },
] as const
export type BoardSectionId = typeof TABS[number]['id']
type TabId = BoardSectionId

/** The visible board sections (tab 'people' is hidden — merged into 'people2').
 *  Shared with the sidebar so both navigate the same set. */
export const BOARD_SECTIONS: { id: BoardSectionId; label: string; icon: string }[] =
  TABS.filter(t => t.id !== 'people').map(t => ({ id: t.id, label: t.label, icon: t.icon }))

/** Parse "Build 0% · Test 0% · Live 100%" into {label,pct} stage segments. */
function parseDelivery(s: string | null): { label: string; pct: number }[] | null {
  if (!s) return null
  const parts = s.split('·').map(p => {
    const m = p.trim().match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/)
    return m ? { label: m[1].trim(), pct: Number(m[2]) } : null
  }).filter((x): x is { label: string; pct: number } => x != null)
  return parts.length ? parts : null
}

/** Expand a division acronym to its full name when known (else pass through).
 *  Used so abbreviations like "I&TF" show as "Innovation & The Future". */
const DIV_FULL: Record<string, string> = {
  'I&TF': 'Innovation & The Future',
  'BS&HR': 'Business Support & Human Resources',
  'HR': 'Human Resources',
  'Billing': 'Billing Services',
  'Finance': 'Finance',
}
function divFull(name: string): string { return DIV_FULL[(name || '').trim()] ?? name }

/** MD View v2 — same content domains as v1 but as four independently
 *  switchable tabs, with the domain tables rendered as KPI cards and an
 *  event-driven People tab. 100% live data; NA where a column has no data. */
export function BoardViewV2({ data: d, people, peopleMode = 'analytics', toolbar, active: activeProp, onActiveChange }: { data: BoardData; people: PeopleData; peopleMode?: 'analytics' | 'cards'; toolbar?: ReactNode; active?: BoardSectionId; onActiveChange?: (id: BoardSectionId) => void }) {
  const [activeState, setActiveState] = useState<TabId>('overview')
  // Controlled when `active` is supplied (e.g. driven by the sidebar); else internal.
  const active = activeProp ?? activeState
  const setActive = (id: TabId) => { setActiveState(id); onActiveChange?.(id) }
  const deliverySplit = parseDelivery(d.processes.delivery)
  const stagePct = (label: string) => {
    const seg = deliverySplit?.find(s => s.label.toLowerCase() === label.toLowerCase())
    return seg ? `${seg.pct}%` : null
  }
  /* domain-tab chart data — built from what's already in BoardData / PeopleData */
  const deliveryData: Datum[] = deliverySplit ? deliverySplit.map(s => ({ name: s.label, value: s.pct })) : []
  // Processes tab is NA when its backing fields are null → don't borrow the Overview byDivision here.
  const divisionData: Datum[] = d.processes.activeByDiv == null ? [] : d.byDivision.map(([name, value]) => ({ name, value }))
  const customerDivData: Datum[] = (d.divByPillar?.Customer ?? []).map(([name, value]) => ({ name, value }))
  // Delivery-by-stages donut for the Processes summary card (Build / Test / Live).
  const stageColor = (label: string) => (/build/i.test(label) ? C.blue : /test/i.test(label) ? C.gold : C.green)
  const procDelivery = deliverySplit ? deliverySplit.map(s => ({ name: s.label, value: s.pct, c: stageColor(s.label) })) : null
  // "As of <Month Year>" — current month, recomputed on each render.
  const asOf = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="mdv2 mdv8 bd-v2">
      {/* board header */}
      <div className="board-hd">
        <div className="logo">
          <div className="mark"><Icon name="bi-grid-3x3-gap" /></div>
          <div>
            <h1>DEWA AGENTIC AI TRANSFORMATION</h1>
          </div>
        </div>
        <div className="board-asof">
          <span>As of {asOf}</span>
          <span className="sep">|</span>
          <span>Target:50% by April 2027</span>
        </div>
      </div>

      {/* real switchable tabs */}
      <div className="tabbar">
        {/* Tab 1 'people' is hidden — its content is migrated into 'people2' (labelled "People"). */}
        {TABS.filter(t => t.id !== 'people').map(t => (
          <button key={t.id} className={`tab${active === t.id ? ' on' : ''}`} onClick={() => setActive(t.id)}>
            <Icon name={t.icon} />{t.label}
          </button>
        ))}
        {toolbar && <div className="tabbar-tools">{toolbar}</div>}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {active === 'overview' && (
        <>
          <div className="row-a">
            <div className="panel vcenter">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-greenBg)', color: C.green }}><Icon name="bi-speedometer2" /></div><div><h3>Transformation Progress</h3></div>{d.overall != null && <InfoBtn formula="Overall Readiness = average of the 3 pillar %s (Customer + Processes + People) ÷ 3. Target 50%." />}</div>
              {/* When overall is NA, keep the arc filled (demo ~33%) so the gauge still reads visually, but show NA as the number. */}
              <div className="vcenter-body"><Gauge value={d.overall ?? 33} naText={d.overall == null ? 'NA' : undefined} /></div>
            </div>
            <div className="panel vcenter">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-bar-chart-line" /></div><div><h3>Progress by Pillars</h3></div><InfoBtn formula="Each pillar % = use cases in that pillar ÷ 117 total use cases × 100." /></div>
              <div className="vcenter-body">
                <div className="pill-bars">
                  {d.pillars.map((p, i) => (
                    <div className="pbrow" key={p.label}>
                      <span className="nm">{p.label}</span>
                      <div className="pbtrack"><i style={{ width: `${p.pct ?? 0}%`, background: [C.blue, C.green, C.gold][i] }} /><span className="pbmark" /></div>
                      <span className="pv">{p.pct == null ? <NA /> : `${p.pct}%`}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-goldBg)', color: C.gold }}><Icon name="bi-diagram-3-fill" /></div><div><h3>AI Maturity by Segment</h3></div></div>
              <div className="seg">
                {['EVP Level', 'VPS', 'Senior Mgrs', 'Employees'].map(s => (
                  <div className="segcell" key={s}><div className="sl">{s}</div><div className="na" style={{ fontSize: 22 }}>NA</div><div className="sbar" /></div>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-goldBg)', color: C.gold }}><Icon name="bi-graph-up-arrow" /></div><div><h3>Top-Line Impact</h3></div></div>
              <div className="impact">
                <div className="imp" style={{ ['--cc' as string]: C.green }}>
                  <div className="il">Cost Saving</div>
                  <div className="iv"><Icon name="bi-currency-dirham" />{show(d.costSaving)}</div>
                  <div className="is">{d.costSavingNote}</div>
                </div>
                <div className="imp" style={{ ['--cc' as string]: C.blue }}>
                  <div className="il">FTE Saving</div>
                  <div className="iv">{show(d.fteSaving)}<small>FTE</small></div>
                  <div className="is">{d.fteSavingNote}</div>
                </div>
                <div className="imp" style={{ ['--cc' as string]: C.gold }}>
                  <div className="il">Cost Avoidance</div>
                  <div className="iv">{show(d.costAvoidance)}</div>
                  <div className="is">{d.costAvoidanceNote}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Trend by Month — parallel to Agentic Pillar + Agent Inventory & Coverage */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-calendar3" /></div><div><h3>Progress Trend by Month</h3><div style={{ fontSize: 11.5, color: '#8a938f', marginTop: 2 }}>AI training events delivered per month</div></div><InfoBtn formula="COUNT(training events) grouped by calendar month of cr978_coe_eventdate." /></div>
              {people.byMonth.length
                ? <MiniArea data={people.byMonth} unit="Events" />
                : <div className="na-panel"><div className="big">NA</div><div className="cap">No monthly event data</div></div>}
            </div>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-diagram-3-fill" /></div><div><h3>Agentic Pillar</h3><div style={{ fontSize: 11.5, color: '#8a938f', marginTop: 2 }}>Use cases by pillar{d.portfolioTotal ? ` · of ${d.portfolioTotal}` : ''}</div></div><InfoBtn formula="Use cases grouped by domain into Customer / Processes / People (of 117 classified use cases)." /></div>
              {d.portfolio.length ? (
                <div className="tiles3">
                  {d.portfolio.map(p => (
                    <div className="tile" key={p.name}><div className="tl">{p.name}</div><div className="tv" style={{ color: p.c }}>{p.value}</div></div>
                  ))}
                </div>
              ) : <div className="na-panel"><div className="big">NA</div><div className="cap">No pillar split</div></div>}
            </div>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-tealBg)', color: C.teal }}><Icon name="bi-collection-fill" /></div><div><h3>Agent Inventory &amp; Coverage</h3></div></div>
              <div className="tiles3">
                <div className="tile"><div className="tl">Total Agents</div><div className="tv">{d.invTotal}</div></div>
                <div className="tile"><div className="tl">Internal</div><div className="tv" style={{ color: C.green }}><NA /></div></div>
                <div className="tile"><div className="tl">External</div><div className="tv" style={{ color: C.blue }}><NA /></div></div>
              </div>
            </div>
          </div>

          {/* Domain summary — Customer / Processes / People roll-up of the three sub-tabs */}
          <div className="dom-summary">
            {/* Customer Services */}
            <div className="panel dom-card" style={{ ['--cc' as string]: C.blue }}>
              <div className="dc-top"><h3>Customer Services</h3><div className="dc-pct">{d.pillars[0]?.pct == null ? <NA /> : <>{d.pillars[0].pct}<small>%</small></>}</div></div>
              <div className="dc-bar"><i style={{ width: `${d.pillars[0]?.pct ?? 0}%` }} /></div>
              <div className="dc-list">
                <div className="dc-li"><span className="l">% service now agentic</span><span className="v">{show(d.customer.servicesAgentic)}</span></div>
                <div className="dc-li"><span className="l">Agent resolution rate</span><span className="v"><NA /></span></div>
                <div className="dc-li"><span className="l">Avg. response time</span><span className="v"><NA /></span></div>
                <div className="dc-li"><span className="l">Total interactions</span><span className="v">{show(d.customer.interactions)}</span></div>
                <div className="dc-li"><span className="l">Customer satisfaction (CSAT)</span><span className="v"><NA /></span></div>
              </div>
            </div>

            {/* Process & Operations */}
            <div className="panel dom-card" style={{ ['--cc' as string]: C.green }}>
              <div className="dc-top"><h3>Process &amp; Operations</h3><div className="dc-pct">{d.pillars[1]?.pct == null ? <NA /> : <>{d.pillars[1].pct}<small>%</small></>}</div></div>
              <div className="dc-bar"><i style={{ width: `${d.pillars[1]?.pct ?? 0}%` }} /></div>
              <div className="dc-list">
                <div className="dc-li"><span className="l">% service now agentic</span><span className="v">{show(d.processes.processesAgentic)}</span></div>
                <div className="dc-li"><span className="l">Active AI agents by divisions</span><span className="v">{show(d.processes.activeByDiv)}</span></div>
                <div className="dc-li"><span className="l">Transformation Progress</span><span className="v">{show(d.processes.transformByDiv)}</span></div>
              </div>
              {procDelivery && (
                <div className="dc-donut">
                  <div className="dd-cap">Delivery by stages</div>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie data={procDelivery} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={34} outerRadius={54} paddingAngle={2} stroke="none">
                        {procDelivery.map((s, i) => <Cell key={i} fill={s.c} />)}
                      </Pie>
                      <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', marginTop: 2 }}>
                    {procDelivery.map(s => (
                      <span key={s.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'var(--mut)' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: s.c, display: 'inline-block' }} />{s.name} {s.value}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* People */}
            <div className="panel dom-card" style={{ ['--cc' as string]: C.gold }}>
              <div className="dc-top"><h3>People</h3><div className="dc-pct">{d.pillars[2]?.pct == null ? <NA /> : <>{d.pillars[2].pct}<small>%</small></>}</div></div>
              <div className="dc-bar"><i style={{ width: `${d.pillars[2]?.pct ?? 0}%` }} /></div>
              <div className="dc-list">
                <div className="dc-li"><span className="l">AI adoption rate</span><span className="v">{show(d.people.adoption)}</span></div>
                <div className="dc-li"><span className="l">Leadership adoption</span><span className="v">{show(d.people.leadership)}</span></div>
                <div className="dc-li"><span className="l">AI literacy maturity</span><span className="v">{show(d.people.literacy)}</span></div>
                <div className="dc-li"><span className="l">People trained</span><span className="v">{show(d.people.trained)}</span></div>
                <div className="dc-li"><span className="l">Training hours delivered</span><span className="v">{show(d.people.hours)}</span></div>
                <div className="dc-li"><span className="l">Workshop / Trainings</span><span className="v">{show(d.people.workshops)}</span></div>
                <div className="dc-li"><span className="l">Certifications Earned</span><span className="v">{show(d.people.certs)}</span></div>
                <div className="dc-li"><span className="l">User Satisfaction</span><span className="v">{show(d.people.userSat)}</span></div>
              </div>
            </div>
          </div>

          {/* Key Metrics next to Active Agents by Division */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-tealBg)', color: C.teal }}><Icon name="bi-speedometer2" /></div><div><h3>Key Metrics</h3></div></div>
              <div className="impact">
                <div className="imp" style={{ ['--cc' as string]: C.blue }}>
                  <div className="il">Overall Readiness</div>
                  <div className="iv">{d.overall == null ? <NA /> : `${d.overall}%`}</div>
                  <div className="is">avg of 3 pillar %s</div>
                </div>
                <div className="imp" style={{ ['--cc' as string]: C.teal }}>
                  <div className="il">Total AI Agents</div>
                  <div className="iv">{d.kpiAgents}</div>
                  <div className="is">{d.kpiAgentsSub}</div>
                </div>
                <div className="imp" style={{ ['--cc' as string]: C.blue }}>
                  <div className="il">Agentic Services</div>
                  <div className="iv">{d.agenticServicesPct == null ? <NA /> : `${d.agenticServicesPct}%`}</div>
                  <div className="is">{d.agenticServicesSub}</div>
                </div>
                <div className="imp" style={{ ['--cc' as string]: C.green }}>
                  <div className="il">Agentic Processes</div>
                  <div className="iv">{d.agenticProcessesPct == null ? <NA /> : `${d.agenticProcessesPct}%`}</div>
                  <div className="is">{d.agenticProcessesSub}</div>
                </div>
              </div>
            </div>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-tealBg)', color: C.teal }}><Icon name="bi-diagram-3-fill" /></div><div><h3>Active Agents by Division</h3></div><InfoBtn formula="COUNT(agents + deployment projects) grouped by division; top divisions shown." /></div>
              <div className="divtiles divtiles-v">
                {d.byDivision.length ? d.byDivision.map(([dv, n]) => (
                  <div className="dt" key={dv}><span className="l" title={dv}>{divFull(dv)}</span><span className="n">{n}</span></div>
                )) : <div className="na" style={{ textAlign: 'center', padding: '10px 0' }}>NA</div>}
              </div>
            </div>
          </div>

          {/* DEWA AI Portfolio — full width */}
          <div className="panel">
            <div className="ph"><div className="ic" style={{ background: 'var(--v8-goldBg)', color: C.gold }}><Icon name="bi-bar-chart-line-fill" /></div><div><h3>DEWA AI Portfolio Growth{d.portfolio.length ? ` (${d.portfolioTotal} initiatives)` : ''}</h3></div><InfoBtn formula="Use cases grouped by domain into Customer / Processes / People (of 117 classified use cases)." /></div>
            {d.portfolio.length ? (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={d.portfolio} layout="vertical" margin={{ top: 6, right: 44, left: 6, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#62736d' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#3c4945', fontWeight: 600 }} axisLine={false} tickLine={false} width={96} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} cursor={{ fill: 'rgba(0,117,96,0.05)' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                    {d.portfolio.map((s, i) => <Cell key={i} fill={s.c} />)}
                    <LabelList dataKey="value" position="right" style={{ fontSize: 13, fontWeight: 800, fill: '#1c1c1e' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="na-panel"><div className="big">NA</div><div className="cap">Pillar split not evidenced in the register</div></div>}
          </div>
        </>
      )}

      {/* ── CUSTOMER SERVICES ────────────────────────── */}
      {active === 'customer' && (
        <>
          <div className="eyebrow">Domain — Customer Services{d.customer.pct ? ` · ${d.customer.pct} agentic` : ''}</div>
          <div className="people-kpis">
            <KCard label="% services now agentic" icon="bi-chat-dots-fill" accent={C.blue} value={d.customer.servicesAgentic} />
            <KCard label="Total interactions" icon="bi-arrow-repeat" accent={C.green} value={d.customer.interactions} />
            <KCard label="Agent resolution rate" icon="bi-check2-circle" accent={C.teal} value={null} sub="no column" />
            <KCard label="Avg response time (before/after)" icon="bi-clock-fill" accent={C.gold} value={null} sub="no column" />
            <KCard label="Customer satisfaction" icon="bi-star-fill" accent={C.blue} value={null} sub="no column" />
          </div>

          <div style={{ marginTop: 14 }}>
            <ChartPanel title="Customer AI initiatives by division" subtitle="Customer-pillar initiatives per division (live)" unit="Initiatives" icon="bi-diagram-3-fill" accent={C.blue} data={customerDivData} kind="hbar" formula="COUNT(initiatives) where use-case domain = Customer, grouped by aum_division." />
          </div>
        </>
      )}

      {/* ── PROCESSES & OPERATIONS ───────────────────── */}
      {active === 'processes' && (
        <>
          <div className="eyebrow">Domain — Processes & Operations{d.processes.pct ? ` · ${d.processes.pct} agentic` : ''}</div>
          <div className="people-kpis pk-3">
            <KCard label="Delivery by stages — Build" icon="bi-tools" accent={C.blue} value={stagePct('Build')} />
            <KCard label="Delivery by stages — Test" icon="bi-clipboard-check-fill" accent={C.gold} value={stagePct('Test')} />
            <KCard label="Delivery by stages — Live" icon="bi-rocket-takeoff" accent={C.green} value={stagePct('Live')} />
            <KCard label="Transformation progress by divisions" icon="bi-graph-up-arrow" accent={C.gold} value={d.processes.transformByDiv} />
            <KCard label="Active AI agents by divisions" icon="bi-diagram-3-fill" accent={C.blue} value={d.processes.activeByDiv} />
            <KCard label="% processes now agentic" icon="bi-gear" accent={C.green} value={d.processes.processesAgentic} sub={d.processes.processesAgentic == null ? 'no column' : undefined} />
          </div>

          <div className="charts-grid" style={{ marginTop: 14 }}>
            <ChartPanel title="Delivery by stage" subtitle="Build / Test / Live split of agents (%)" unit="%" icon="bi-kanban-fill" accent={C.blue} data={deliveryData} kind="band" formula="Agents grouped by delivery stage; each = stage count ÷ total agents × 100 (Build / Test / Live)." />
            <ChartPanel title="Active AI agents by division" subtitle="Agents deployed per division (area = share)" unit="Agents" icon="bi-diagram-3-fill" accent={C.teal} data={divisionData} kind="treemap" formula="COUNT(agents + deployment projects) grouped by division; box area = share of total." />
          </div>
        </>
      )}

      {/* ── PEOPLE ───────────────────────────────────── */}
      {active === 'people' && peopleMode === 'cards' && (
        <>
          <div className="eyebrow">Domain — People · live from cr978_coe_events</div>
          <div className="people-kpis pk-4">
            {people.kpis.map(k => <KCard key={k.key} label={k.label} icon={k.icon} accent={k.accent} value={k.value} sub={k.sub} />)}
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            {people.arrows.map(a => (
              <div className="panel arrowcard" key={a.key}>
                <div className="ph"><div className="ic" style={{ background: 'var(--inset)', color: C.gold }}><Icon name={a.icon} /></div><div><h3>{a.label}</h3></div></div>
                <div className="arow">
                  <div className="aside"><div className="al">{a.beforeLabel}</div><div className="av">{show(a.before)}</div></div>
                  <div className="aarrow"><Icon name="bi-arrow-right" /></div>
                  <div className="aside"><div className="al">{a.afterLabel}</div><div className="av strong">{show(a.after)}</div></div>
                </div>
                <div className="anote">{a.note ?? <span className="na">no live data</span>}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid" style={{ marginTop: 14 }}>
            <ChartPanel title="Events by category" subtitle="Training events by type" unit="Events" icon="bi-collection-fill" accent={C.blue} data={people.byCategory} kind="radial" formula="COUNT(events) grouped by event type (Webinar / ILT / Workshop / Hackathon) from cr978_coe_events." />
            <ChartPanel title="Training cadence by month" subtitle="Events delivered per month" unit="Events" icon="bi-calendar3" accent={C.green} data={people.byMonth} kind="area" formula="COUNT(events) grouped by calendar month of cr978_coe_eventdate." />
          </div>
        </>
      )}
      {active === 'people' && peopleMode === 'analytics' && (
        <>
          <div className="eyebrow">Domain — People · live from cr978_coe_events + aum_aiinitiatives</div>
          <div className="people-kpis">
            {people.kpis.map(k => <KCard key={k.key} label={k.label} icon={k.icon} accent={k.accent} value={k.value} sub={k.sub} />)}
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            {people.arrows.map(a => (
              <div className="panel arrowcard" key={a.key}>
                <div className="ph"><div className="ic" style={{ background: 'var(--inset)', color: C.gold }}><Icon name={a.icon} /></div><div><h3>{a.label}</h3></div></div>
                <div className="arow">
                  <div className="aside"><div className="al">{a.beforeLabel}</div><div className="av">{show(a.before)}</div></div>
                  <div className="aarrow"><Icon name="bi-arrow-right" /></div>
                  <div className="aside"><div className="al">{a.afterLabel}</div><div className="av strong">{show(a.after)}</div></div>
                </div>
                <div className="anote">{a.note ?? <span className="na">no live data</span>}</div>
              </div>
            ))}
          </div>

          <div className="charts-grid" style={{ marginTop: 14 }}>
            <ChartPanel title="Events by category" subtitle="Training events by type" unit="Events" icon="bi-collection-fill" accent={C.blue} data={people.byCategory} kind="radial" formula="COUNT(events) grouped by event type (Webinar / ILT / Workshop / Hackathon) from cr978_coe_events." />
            <ChartPanel title="Training cadence by month" subtitle="Events delivered per month" unit="Events" icon="bi-calendar3" accent={C.green} data={people.byMonth} kind="area" formula="COUNT(events) grouped by calendar month of cr978_coe_eventdate." />
          </div>
        </>
      )}

      {/* ── PEOPLE (consolidated: KPIs + arrows + distributions) ─── */}
      {active === 'people2' && (
        <>
          <div className="eyebrow">Domain — People · live from cr978_coe_events</div>
          <div className="people-kpis pk-4">
            {people.kpis.map(k => <KCard key={k.key} label={k.label} icon={k.icon} accent={k.accent} value={k.value} formula={k.formula} />)}
          </div>

          <div className="grid2" style={{ marginTop: 14 }}>
            {people.arrows.map(a => (
              <div className="panel arrowcard" key={a.key}>
                <div className="ph"><div className="ic" style={{ background: 'var(--inset)', color: C.gold }}><Icon name={a.icon} /></div><div><h3>{a.label}</h3></div></div>
                <div className="arow">
                  <div className="aside"><div className="al">{a.beforeLabel}</div><div className="av">{show(a.before)}</div></div>
                  <div className="aarrow"><Icon name="bi-arrow-right" /></div>
                  <div className="aside"><div className="al">{a.afterLabel}</div><div className="av strong">{show(a.after)}</div></div>
                </div>
              </div>
            ))}
          </div>

          {/* Old chart types, per request: area (trend) · donut (composition) · treemap · bar (ranking) */}
          <div className="charts-grid" style={{ marginTop: 14 }}>
            <ChartPanel title="Training cadence by month" subtitle="Events delivered per month" unit="Events" icon="bi-calendar3" accent={C.green} data={people.byMonth} kind="area" formula="COUNT(events) grouped by calendar month of cr978_coe_eventdate." />
            <ChartPanel title="Events by category" subtitle="Training events by type" unit="Events" icon="bi-collection-fill" accent={C.blue} data={people.byCategory} kind="donut" formula="COUNT(events) grouped by event type (Webinar / Instructor-Led Training / Workshop / Hackathon)." />
            <ChartPanel title="Technology distribution" subtitle="Events by technology" unit="Events" icon="bi-cpu-fill" accent={C.gold} data={people.p2.byTech} kind="treemap" formula="COUNT(events) grouped by technology / tech-stack (cr978_coe_event_technology); box area = share." />
            <ChartPanel title="Events by division" subtitle="Events by targeted division" unit="Events" icon="bi-diagram-3-fill" accent={C.teal} data={people.p2.byDivision} kind="hbar" formula="COUNT(events) grouped by division (cr978_coe_eventdivision); top 10 shown." />
          </div>

          {/* Leadership maturity segments — static NA, shown last (replaces Audience distribution) */}
          <div style={{ marginTop: 14 }}>
            <div className="panel">
              <div className="ph"><div className="ic" style={{ background: 'var(--v8-goldBg)', color: C.gold }}><Icon name="bi-diagram-3-fill" /></div><div><h3>AI Maturity by Segment</h3></div></div>
              <div className="seg">
                {['EVP Level', 'VPS', 'Senior Mgrs', 'Employees'].map(s => (
                  <div className="segcell" key={s}><div className="sl">{s}</div><div className="na" style={{ fontSize: 22 }}>NA</div><div className="sbar" /></div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="foot">Metrics {d.sourceNote} · People tabs live from cr978_coe_events · NA where a column has no data</div>
    </div>
  )
}
