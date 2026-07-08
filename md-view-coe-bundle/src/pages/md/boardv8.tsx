import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, CartesianGrid } from 'recharts'
import Icon from '../../components/Icon'
import { C, type BoardData } from './boardv8Data'

/* mandatory dark-tooltip constants (CLAUDE.md) */
const TT_STYLE = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM = { color: '#fff', fontWeight: 600 }

const NA = () => <span className="na">NA</span>
const val = (s: string | null): ReactNode => s == null ? <NA /> : s

/* ── semicircle gauge (0–100, 50% target tick) ─────────── */
function Gauge({ value }: { value: number | null }) {
  const R = 66, cx = 90, cy = 84, frac = Math.max(0, Math.min(1, (value ?? 0) / 100))
  const p = (a: number) => `${(cx + R * Math.cos(a)).toFixed(1)},${(cy - R * Math.sin(a)).toFixed(1)}`
  const tick = Math.PI * 0.5
  return (
    <svg viewBox="0 0 180 100" width="100%" height="120" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="v8g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={C.gold} /><stop offset="100%" stopColor={C.green} /></linearGradient></defs>
      <path d={`M${p(Math.PI)} A${R} ${R} 0 0 1 ${p(0)}`} fill="none" stroke="var(--track)" strokeWidth="13" strokeLinecap="round" />
      {value != null && <path d={`M${p(Math.PI)} A${R} ${R} 0 0 1 ${p(Math.PI * (1 - frac))}`} fill="none" stroke="url(#v8g)" strokeWidth="13" strokeLinecap="round" />}
      <line x1={cx + (R - 9) * Math.cos(tick)} y1={cy - (R - 9) * Math.sin(tick)} x2={cx + (R + 9) * Math.cos(tick)} y2={cy - (R + 9) * Math.sin(tick)} stroke="var(--gold)" strokeWidth="2.4" />
      <text x={cx} y={cy - 30} textAnchor="middle" style={{ fontSize: 11, fontWeight: 800, fill: 'var(--gold)' }}>50%</text>
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: 32, fontWeight: 800, fill: 'var(--tx)' }}>{value != null ? `${value}%` : 'NA'}</text>
      <text x={cx} y={cy + 11} textAnchor="middle" style={{ fontSize: 11, fill: 'var(--mut)' }}>target 50%</text>
    </svg>
  )
}

const TABS = [
  { id: 'readiness', label: 'Overall Readiness', icon: 'bi-speedometer2' },
  { id: 'domains', label: 'Domain Breakdown', icon: 'bi-grid-1x2-fill' },
  { id: 'portfolio', label: 'DEWA AI Portfolio', icon: 'bi-bar-chart-line-fill' },
] as const

/** Shared presentational board. Layout is identical across V8 (live) and V9 (exact). */
export function BoardView({ data: d }: { data: BoardData }) {
  const [active, setActive] = useState<string>('readiness')
  const readinessRef = useRef<HTMLElement>(null)
  const domainsRef = useRef<HTMLElement>(null)
  const portfolioRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const els = [readinessRef.current, domainsRef.current, portfolioRef.current].filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const io = new IntersectionObserver(
      entries => { const vis = entries.filter(e => e.isIntersecting).sort((x, y) => y.intersectionRatio - x.intersectionRatio)[0]; if (vis) setActive(vis.target.id) },
      { rootMargin: '-70px 0px -55% 0px', threshold: [0.1, 0.5] },
    )
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const go = (id: string) => {
    setActive(id)
    const el = id === 'readiness' ? readinessRef.current : id === 'domains' ? domainsRef.current : portfolioRef.current
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="mdv2 mdv8">
      {/* board header */}
      <div className="board-hd">
        <div className="logo">
          <div className="mark"><Icon name="bi-cpu" /></div>
          <div>
            <h1>DEWA AGENTIC AI TRANSFORMATION</h1>
            <div className="sub">Towards the 50% Mandate of Sheikh Mohammed bin Rashid Al Maktoum</div>
          </div>
        </div>
        <div className="quote">“Harness the power of AI for the benefit of our people and to build the future.”<div className="by">— Sheikh Mohammed bin Rashid Al Maktoum</div></div>
        <div className="upd">Last Updated<b>25 June 2026</b></div>
      </div>

      {/* sticky tabs */}
      <div className="tabbar">
        {TABS.map(t => (
          <button key={t.id} className={`tab${active === t.id ? ' on' : ''}`} onClick={() => go(t.id)}>
            <Icon name={t.icon} />{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1 — Overall Readiness ───────────────── */}
      <section id="readiness" ref={readinessRef}>
        <div className="eyebrow">Agentic AI Progress · MD Dashboard — Overall Readiness</div>
        <div className="kpis4">
          <div className="kpi" style={{ ['--ac' as string]: C.blue }}>
            <div className="kic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-speedometer2" /></div>
            <div className="kl">Overall Readiness</div>
            <div className="kv">{d.overall == null ? 'NA' : `${d.overall}%`}</div>
            <div className="ks">average of 3 pillars · towards 50% mandate</div>
          </div>
          <div className="kpi" style={{ ['--ac' as string]: C.tx }}>
            <div className="kic" style={{ background: 'var(--v8-tealBg)', color: C.teal }}><Icon name="bi-robot" /></div>
            <div className="kl">Total AI Agents</div>
            <div className="kv">{d.kpiAgents}</div>
            <div className="ks">{d.kpiAgentsSub}</div>
          </div>
          <div className="kpi" style={{ ['--ac' as string]: C.blue }}>
            <div className="kic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-headset" /></div>
            <div className="kl">Agentic Services</div>
            <div className="kv">{d.agenticServicesPct == null ? 'NA' : `${d.agenticServicesPct}%`}</div>
            <div className="ks">{d.agenticServicesSub}</div>
          </div>
          <div className="kpi" style={{ ['--ac' as string]: C.green }}>
            <div className="kic" style={{ background: 'var(--v8-greenBg)', color: C.green }}><Icon name="bi-gear-wide-connected" /></div>
            <div className="kl">Agentic Processes</div>
            <div className="kv">{d.agenticProcessesPct == null ? 'NA' : `${d.agenticProcessesPct}%`}</div>
            <div className="ks">{d.agenticProcessesSub}</div>
          </div>
        </div>

        <div className="row-a">
          <div className="panel">
            <div className="ph"><div className="ic" style={{ background: 'var(--v8-greenBg)', color: C.green }}><Icon name="bi-speedometer2" /></div><div><h3>Transformation Progress</h3></div></div>
            <Gauge value={d.overall} />
          </div>
          <div className="panel">
            <div className="ph"><div className="ic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-bar-chart-steps" /></div><div><h3>Progress by Pillars</h3></div></div>
            <div className="pill-bars">
              {d.pillars.map((p, i) => (
                <div className="pbrow" key={p.label}>
                  <span className="nm">{p.label}</span>
                  <div className="pbtrack"><i style={{ width: `${p.pct ?? 0}%`, background: [C.blue, C.green, C.gold][i] }} /><span className="pbmark" /></div>
                  <span className="pv">{p.pct == null ? <NA /> : `${p.pct}%`}</span>
                </div>
              ))}
            </div>
            <div className="pbnote">— 50% target line</div>
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
                <div className="iv"><Icon name="bi-currency-dirham" />{val(d.costSaving)}</div>
                <div className="is">{d.costSavingNote}</div>
              </div>
              <div className="imp" style={{ ['--cc' as string]: C.blue }}>
                <div className="il">FTE Saving</div>
                <div className="iv">{val(d.fteSaving)}<small>FTE</small></div>
                <div className="is">{d.fteSavingNote}</div>
              </div>
              <div className="imp" style={{ ['--cc' as string]: C.gold }}>
                <div className="il">Cost Avoidance</div>
                <div className="iv">{val(d.costAvoidance)}<small>FTE</small></div>
                <div className="is">{d.costAvoidanceNote}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="row-b">
          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ph"><div className="ic" style={{ background: 'var(--v8-blueBg)', color: C.blue }}><Icon name="bi-calendar3" /></div><div><h3>Progress Trend by Month</h3></div></div>
            <div className="na-panel"><div className="big">NA</div><div className="cap">Monthly transformation snapshots not tracked</div></div>
          </div>
          <div className="panel">
            <div className="ph"><div className="ic" style={{ background: 'var(--v8-tealBg)', color: C.teal }}><Icon name="bi-boxes" /></div><div><h3>Agent Inventory &amp; Coverage</h3></div></div>
            <div className="tiles3">
              <div className="tile"><div className="tl">Total Agents</div><div className="tv">{d.invTotal}</div></div>
              <div className="tile"><div className="tl">Live in Production</div><div className="tv" style={{ color: C.green }}>{d.invLive}</div></div>
              <div className="tile"><div className="tl">In Deployment</div><div className="tv" style={{ color: C.blue }}>{d.invDeployment}</div></div>
            </div>
            <div className="subhdr">Active Agents by Division</div>
            <div className="divtiles">
              {d.byDivision.length ? d.byDivision.map(([dv, n]) => (
                <div className="dt" key={dv}><span className="n">{n}</span><span className="l">{dv}</span></div>
              )) : <div className="na" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '10px 0' }}>NA</div>}
            </div>
          </div>
        </div>
      </section>

      {/* ── TAB 2 — Domain Breakdown ────────────────── */}
      <section id="domains" ref={domainsRef}>
        <div className="eyebrow">Domain Breakdown</div>
        <div className="domains">
          <div className="dcard" style={{ ['--dc' as string]: C.blue }}>
            <div className="dh"><span className="dot" /><h3>Customer services</h3><span className="dp">{val(d.customer.pct)}</span></div>
            <div className="drow"><span className="k">% services now agentic</span><span className="v">{val(d.customer.servicesAgentic)}</span></div>
            <div className="drow"><span className="k">Agent resolution rate</span><span className="v"><NA /></span></div>
            <div className="drow"><span className="k">Avg response time (before/after)</span><span className="v"><NA /></span></div>
            <div className="drow"><span className="k">Total interactions</span><span className="v">{val(d.customer.interactions)}</span></div>
            <div className="drow"><span className="k">Customer satisfaction</span><span className="v"><NA /></span></div>
          </div>
          <div className="dcard" style={{ ['--dc' as string]: C.green }}>
            <div className="dh"><span className="dot" /><h3>Processes &amp; operations</h3><span className="dp">{val(d.processes.pct)}</span></div>
            <div className="drow"><span className="k">% processes now agentic</span><span className="v"><span className="g">{val(d.processes.processesAgentic)}</span></span></div>
            <div className="drow"><span className="k">Active AI agents by divisions</span><span className="v">{d.processes.activeByDiv}</span></div>
            <div className="drow"><span className="k">Transformation progress by divisions</span><span className="v">{val(d.processes.transformByDiv)}</span></div>
            <div className="drow"><span className="k">Delivery by stages</span><span className="v">{val(d.processes.delivery)}</span></div>
          </div>
          <div className="dcard" style={{ ['--dc' as string]: C.gold }}>
            <div className="dh"><span className="dot" /><h3>People</h3><span className="dp">{val(d.people.pct)}</span></div>
            <div className="drow"><span className="k">AI adoption rate</span><span className="v">{val(d.people.adoption)}</span></div>
            <div className="drow"><span className="k">Leadership adoption</span><span className="v">{val(d.people.leadership)}</span></div>
            <div className="drow"><span className="k">AI literacy maturity</span><span className="v">{val(d.people.literacy)}</span></div>
            <div className="drow"><span className="k">No. of people trained</span><span className="v">{val(d.people.trained)}</span></div>
            <div className="drow"><span className="k">Training hours delivered</span><span className="v">{val(d.people.hours)}</span></div>
            <div className="drow"><span className="k">Workshops / trainings</span><span className="v">{val(d.people.workshops)}</span></div>
            <div className="drow"><span className="k">Agentic AI certifications</span><span className="v">{val(d.people.certs)}</span></div>
            <div className="drow"><span className="k">User satisfaction %</span><span className="v">{val(d.people.userSat)}</span></div>
          </div>
        </div>
      </section>

      {/* ── TAB 3 — DEWA AI Portfolio ───────────────── */}
      <section id="portfolio" ref={portfolioRef}>
        <div className="eyebrow">DEWA AI Portfolio</div>
        <div className="panel">
          <div className="ph"><div className="ic" style={{ background: 'var(--v8-goldBg)', color: C.gold }}><Icon name="bi-bar-chart-line-fill" /></div><div><h3>DEWA AI Portfolio — by pillar (use-case composition, {d.portfolioTotal} total)</h3></div></div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={d.portfolio} margin={{ top: 20, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#3c4945' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#62736d' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} cursor={{ fill: 'rgba(0,117,96,0.05)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={110}>
                {d.portfolio.map((s, i) => <Cell key={i} fill={s.c} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="chartcap">Quarterly growth history not tracked (NA)</div>
        </div>
        <div className="foot">Metrics {d.sourceNote} · AI portfolio = {d.footerPortfolio} non-D2D records · 50% mandate target = 238 initiatives</div>
      </section>
    </div>
  )
}
