import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { type TechEntry, type TechCategory } from './data'
import Icon from '../../components/Icon'

const TT_STYLE = { background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9, padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff' }
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }


const SAMPLE_PROJECTS: Record<string, [string, string, string][]> = {
  ai:    [['Grid Demand Copilot','Power Generation','live'],['Asset Integrity Vision','Transmission','pilot'],['Solar Yield Forecaster','MBR Solar Park','live']],
  cloud: [['Customer Portal Migration','Customer Service','live'],['Smart Meter Telemetry','T&D','live'],['DR Region Setup','Corporate IT','pilot']],
  data:  [['Enterprise Data Fabric','Data Platform','live'],['Executive Insights Hub','Strategy','live'],['Realtime SCADA Stream','OT Platform','pilot']],
  iot:   [['Generation Digital Twin','Power Generation','live'],['Substation Asset Health','T&D','live'],['Water Plant Remote Ops','Water Ops','pilot']],
  sec:   [['IT/OT SOC Convergence','Cyber','live'],['Identity Modernisation','Cyber','dev']],
  erp:   [['S/4 Asset Master','Enterprise Apps','live'],['ServiceNow Risk Ops','Enterprise Apps','pilot']],
  cust:  [['Customer 360','Customer Service','live'],['Field Crew Dispatch','Field Ops','live']],
  dev:   [['Cloud Landing Zone','Cloud CoE','live'],['Developer Copilot Rollout','Engineering','live']],
}

const STAT_COLORS: Record<string, { bg: string; text: string }> = {
  live:  { bg: '#ecf7f0', text: '#17944a' },
  pilot: { bg: '#edf3fc', text: '#2b63c8' },
  dev:   { bg: '#fdf5e6', text: '#d98c0a' },
}

function trendData(t: TechEntry) {
  const base = parseInt(t.users.replace(/[^\d]/g, '')) || 100
  return ['May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr'].map((m, i) => ({
    month: m, users: Math.round(base * (0.55 + (i / 11) * 0.45)),
  }))
}

type PanelTab = 'overview' | 'projects' | 'contract'

export default function TechStackDetailPanel({ tech, cats, onClose }: {
  tech: TechEntry | null; cats: TechCategory[]; onClose: () => void
}) {
  const [tab, setTab] = useState<PanelTab>('overview')

  const cat = tech ? cats.find(c => c.id === tech.cat) : null
  const open = tech !== null

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(13,18,32,0.4)', backdropFilter: 'blur(2px)', zIndex: 90, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none', transition: 'opacity 0.25s' }}
      />

      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(860px, 92vw)', background: '#f5f5f5', boxShadow: '0 24px 60px rgba(15,23,42,.18)', transform: open ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(.2,.7,.2,1)', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {tech && (
          <>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', background: '#fff', borderBottom: '1px solid rgba(0,117,96,0.1)', display: 'flex', alignItems: 'flex-start', gap: 14, flexShrink: 0 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: tech.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={tech.icon ?? 'bi-tools'} style={{ fontSize: 22, color: '#fff' }} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: '-0.015em', color: '#1c1c1e' }}>{tech.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6, color: '#5a6672', fontSize: 12.5 }}>
                  <span>{tech.vendor}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: cat?.color, display: 'inline-block' }} />{cat?.name}</span>
                  <span style={{ color: '#d1d5db' }}>·</span>
                  <span>Owner · {tech.owner}</span>
                </div>
              </div>
              <button onClick={onClose} style={{ width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', color: '#5a6672', flexShrink: 0 }}>
                <Icon name="bi-x-lg" style={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', background: '#fff', padding: '0 24px', borderBottom: '1px solid rgba(0,117,96,0.1)', flexShrink: 0 }}>
              {(['overview', 'projects', 'contract'] as PanelTab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '11px 14px', fontSize: 12.5, fontWeight: 600, color: tab === t ? '#1c1c1e' : '#6b7280', background: 'transparent', border: 'none', borderBottom: `2px solid ${tab === t ? '#007560' : 'transparent'}`, cursor: 'pointer', textTransform: 'capitalize', transition: 'color .15s' }}>
                  {t === 'overview' ? 'Overview' : t === 'projects' ? `Projects ${tech.projects}` : 'Contract & SLA'}
                </button>
              ))}
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px 32px' }}>

              {/* KPI mini-strip */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#fff', border: '1px solid rgba(0,117,96,0.1)', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
                {[
                  ['Active users', tech.users, 'across 6 divisions'],
                  ['Annual run rate', tech.spend, 'FY26 plan +6%'],
                  ['Uptime · 90d', tech.uptime, `SLA ${tech.sla}`],
                ].map(([k, v, d]) => (
                  <div key={k} style={{ padding: '14px 16px', borderRight: '1px solid rgba(0,117,96,0.08)' }}>
                    <div style={{ fontSize: 10.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.022em', color: '#1c1c1e', marginTop: 4 }}>{v}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{d}</div>
                  </div>
                ))}
              </div>

              {tab === 'overview' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Adoption chart */}
                  <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px 10px', border: '1px solid rgba(0,117,96,0.1)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', marginBottom: 4 }}>Adoption — last 12 months</div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 10 }}>Active users trend · ▲ 38% YoY</div>
                    <ResponsiveContainer width="100%" height={160}>
                      <AreaChart data={trendData(tech)} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`grad-${tech.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={tech.color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={tech.color} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                        <Area type="monotone" dataKey="users" name="Users" stroke={tech.color} strokeWidth={2.2} fill={`url(#grad-${tech.id})`} dot={{ fill: tech.color, r: 3 }} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                </div>
              )}

              {tab === 'projects' && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(0,117,96,0.1)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', marginBottom: 12 }}>Projects using this technology</div>
                  {(SAMPLE_PROJECTS[tech.cat] ?? []).map(([name, div, status]) => {
                    const sc = STAT_COLORS[status] ?? STAT_COLORS.live
                    return (
                      <div key={name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, padding: '10px 0', borderTop: '1px solid rgba(0,117,96,0.07)', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#1c1c1e' }}>{name}</div>
                          <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 2 }}>{div}</div>
                        </div>
                        <span style={{ fontSize: 10.5, fontWeight: 600, padding: '2px 7px', borderRadius: 5, background: sc.bg, color: sc.text, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.text, display: 'inline-block' }} />{status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {tab === 'contract' && (
                <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid rgba(0,117,96,0.1)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', marginBottom: 14 }}>Contract & SLA</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    {[
                      ['Contract', tech.contract], ['SLA tier', tech.sla],
                      ['License model', tech.license], ['SPOC', tech.spoc],
                      ['Run rate', tech.spend + ' / year'], ['Uptime · 90d', tech.uptime],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10.5, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{k}</div>
                        <div style={{ fontWeight: 600, color: '#1c1c1e', marginTop: 3, fontSize: 13.5 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
