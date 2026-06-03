import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadialBarChart, RadialBar,
} from 'recharts'
import Icon from '../../../components/Icon'
import {
  AH_LOG_SUMMARY,
  AH_REJECTION_BREAKDOWN,
  AH_DOC_BREAKDOWN,
  type AHRejectionIssueType,
} from '../data'
import { useAlHasbah } from '../AlHasbahContext'

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none', borderRadius: 9,
  padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(Math.round(n))
}

const DEPT_COLORS: Record<string, string> = {
  HR: '#7c3aed', Finance: '#0ea5e9', Billing: '#007560', Innovation: '#ca8a04',
}

const ISSUE_CONFIG: { type: AHRejectionIssueType; label: string; icon: string; color: string }[] = [
  { type: 'ai_issue',        label: 'AI Issues',       icon: 'bi-exclamation-circle', color: '#ef4444' },
  { type: 'user_awareness',  label: 'User Awareness',  icon: 'bi-people',             color: '#ca8a04' },
  { type: 'ocr_doc_quality', label: 'OCR Issues',      icon: 'bi-file-text',          color: '#7c3aed' },
  { type: 'other',           label: 'Other',           icon: 'bi-shield-exclamation', color: '#6b7280' },
]

interface Props {
  onDrillRequests: () => void
  onDrillCategory: (cat: AHRejectionIssueType) => void
}

export default function AgentPortfolioWidget({ onDrillRequests, onDrillCategory }: Props) {
  const { agents, flowMetrics } = useAlHasbah()

  // Compute lifecycle counts from live Dataverse agents (matches Agent Repository count)
  const lifecycle = useMemo(() => ({
    planned:  agents.filter(a => a.status === 'planned').length,
    pipeline: agents.filter(a => a.status === 'pipeline').length,
    live:     agents.filter(a => a.status === 'live').length,
  }), [agents])
  const lifecycleTotal = agents.length

  // Department breakdown from live agents (no static fallback)
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of agents) counts[a.division] = (counts[a.division] ?? 0) + 1
    return Object.entries(counts).map(([name, value]) => ({ name, value, fill: DEPT_COLORS[name] ?? '#9ca3af' }))
  }, [agents])

  const stats = useMemo(() => {
    const totalAI     = flowMetrics.reduce((s, m) => s + m.aiFlows, 0)
    const totalManual = flowMetrics.reduce((s, m) => s + m.manualFlows, 0)
    const timeSaved   = flowMetrics.reduce((s, m) => s + m.fteSaved, 0)
    const fteSaved    = timeSaved / 2080
    const adoptionPct = totalAI + totalManual > 0
      ? Math.round((totalAI / (totalAI + totalManual)) * 100)
      : 0

    const issuesByType: Record<AHRejectionIssueType, number> = {
      ai_issue: 0, user_awareness: 0, ocr_doc_quality: 0, other: 0,
    }
    for (const r of AH_REJECTION_BREAKDOWN) issuesByType[r.issueType] += r.count
    const totalIssues = Object.values(issuesByType).reduce((a, b) => a + b, 0)

    return { totalAI, totalManual, timeSaved, fteSaved, adoptionPct, issuesByType, totalIssues }
  }, [flowMetrics])

  const INSIGHTS = useMemo(() => {
    const innovationCount = agents.filter(a => a.division as string === 'Innovation').length
    return [
      { icon: 'bi-exclamation-triangle', color: '#ef4444', title: 'High AI Issue Rate', body: `AI issues account for ${Math.round(stats.issuesByType.ai_issue / Math.max(stats.totalIssues, 1) * 100)}% of all log rejections.` },
      { icon: 'bi-graph-down-arrow',     color: '#ca8a04', title: 'Low AI Confidence',  body: `Avg AI Confidence (${AH_LOG_SUMMARY.avgAiConfidence}%) is below 50% — model calibration review needed.` },
      { icon: 'bi-activity',             color: '#007560', title: 'Adoption Progress',   body: `AI Adoption at ${stats.adoptionPct}% — ${100 - stats.adoptionPct}% of flows are still manual.` },
      { icon: 'bi-lightbulb',            color: '#7c3aed', title: 'Innovation Coverage', body: `Innovation division has ${innovationCount} agents (${lifecycleTotal > 0 ? Math.round(innovationCount / lifecycleTotal * 100) : 0}%) — consider expanding AI coverage.` },
      { icon: 'bi-hourglass-split',      color: '#0ea5e9', title: 'Pipeline Pressure',   body: `${lifecycle.planned} agents (${lifecycleTotal > 0 ? Math.round(lifecycle.planned / lifecycleTotal * 100) : 0}%) are still in the Planned stage.` },
      { icon: 'bi-file-earmark-person',  color: '#ea580c', title: 'Document Offender',   body: 'Passport documents have the highest issue rate across all document types.' },
    ]
  }, [agents, lifecycle, lifecycleTotal, stats])

  const radialData = [{ name: 'Adoption', value: stats.adoptionPct, fill: '#007560' }]

  return (
    <div className="ah-widget-card">
      <div className="ah-widget-header">
        <div className="ah-widget-icon"><Icon name="bi-robot" /></div>
        <div>
          <div className="ah-widget-title">AI Agent Portfolio</div>
          <div className="ah-widget-sub">Comprehensive view across {lifecycleTotal} agents · {flowMetrics.length || 6}-month window</div>
        </div>
      </div>

      {/* A — Executive Summary */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Executive Summary</div>
        <div className="ah-exec-grid">
          <div className="ah-exec-card">
            <div className="ah-exec-val">{lifecycleTotal}</div>
            <div className="ah-exec-label">Total Agents</div>
          </div>
          <div className="ah-exec-card">
            <div className="ah-exec-val ah-sum-val-green">{lifecycle.live}</div>
            <div className="ah-exec-label">Live Agents</div>
          </div>
          <div className="ah-exec-card">
            <div className="ah-exec-val">{fmt(stats.timeSaved)}</div>
            <div className="ah-exec-label">Time Saved (hrs)</div>
          </div>
          <div className="ah-exec-card">
            <div className="ah-exec-val">{stats.fteSaved.toFixed(2)}</div>
            <div className="ah-exec-label">FTE Saved</div>
          </div>
          <div className="ah-exec-card">
            <div className="ah-exec-val ah-sum-val-gold">{stats.adoptionPct}%</div>
            <div className="ah-exec-label">AI Adoption</div>
          </div>
        </div>
      </div>

      {/* B — Portfolio Health */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Portfolio Health</div>
        <div className="ah-portfolio-health">
          {/* Lifecycle stacked bar */}
          <div style={{ flex: 3 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lifecycle</div>
            <div className="ah-lifecycle-bar">
              {[
                { label: 'Planned',  count: lifecycle.planned,  color: '#9ca3af' },
                { label: 'Pipeline', count: lifecycle.pipeline, color: '#ca8a04' },
                { label: 'Live',     count: lifecycle.live,     color: '#007560' },
              ].map(seg => (
                <div
                  key={seg.label}
                  className="ah-lifecycle-segment"
                  style={{ flex: seg.count, background: seg.color }}
                  title={`${seg.label}: ${seg.count}`}
                >
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>{seg.count}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              {[{ l: 'Planned', c: '#9ca3af', n: lifecycle.planned }, { l: 'Pipeline', c: '#ca8a04', n: lifecycle.pipeline }, { l: 'Live', c: '#007560', n: lifecycle.live }].map(s => (
                <span key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c, display: 'inline-block' }} />
                  {s.l} ({s.n})
                </span>
              ))}
            </div>
          </div>

          {/* Department donut */}
          <div style={{ flex: 2, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>By Department</div>
            <div style={{ position: 'relative' }}>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={44} outerRadius={64} paddingAngle={2} dataKey="value">
                    {deptData.map(d => <Cell key={d.name} fill={d.fill} />)}
                  </Pie>
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{lifecycleTotal}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Agents</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              {deptData.map(d => (
                <span key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.fill, display: 'inline-block' }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* C — Impact Panel */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Impact</div>
        <div className="ah-impact-panel">
          <div className="ah-impact-col">
            <div className="ah-impact-val">{fmt(stats.timeSaved)}</div>
            <div className="ah-impact-label">Total Hours Saved</div>
          </div>
          <div className="ah-impact-col ah-impact-divider">
            <div className="ah-impact-val">{stats.fteSaved.toFixed(2)}</div>
            <div className="ah-impact-label">FTE Saved</div>
          </div>
          <div className="ah-impact-col ah-impact-divider">
            <div style={{ position: 'relative', height: 100 }}>
              <ResponsiveContainer width="100%" height={100}>
                <RadialBarChart
                  cx="50%" cy="50%"
                  innerRadius="74%" outerRadius="96%"
                  startAngle={90} endAngle={-270}
                  data={radialData}
                  barSize={10}
                >
                  <RadialBar dataKey="value" background={{ fill: 'rgba(0,117,96,0.1)' }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{stats.adoptionPct}%</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>AI Adoption</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* D — Agent Performance */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Agent Performance</div>
        <div className="ah-perf-grid">
          {/* Volume bar (clickable) */}
          <div style={{ flex: 2 }}>
            <button className="ah-vol-clickable" onClick={onDrillRequests} style={{ width: '100%', background: 'none', border: '1px solid transparent', borderRadius: 10, padding: '10px', cursor: 'pointer', textAlign: 'left', transition: '.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,117,96,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
            >
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Requests (click to drill down)</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                {(flowMetrics.reduce((s, m) => s + m.aiFlows + m.manualFlows, 0)).toLocaleString()}
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={flowMetrics} margin={{ top: 4, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.07)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
                  <Bar dataKey="aiFlows"     name="AI Flows"     stackId="a" fill="#007560" radius={[0,0,0,0]} />
                  <Bar dataKey="manualFlows" name="Manual Flows" stackId="a" fill="#ca8a04" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </button>
          </div>

          {/* Quality chips */}
          <div style={{ flex: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, alignContent: 'start' }}>
            {[
              { label: 'Failed to Initiate', val: AH_LOG_SUMMARY.totalPending.toLocaleString(), icon: 'bi-x-circle',   color: '#dc2626' },
              { label: 'Avg Match %',         val: `${AH_LOG_SUMMARY.avgMatchPercent}%`,         icon: 'bi-percent',    color: '#007560' },
              { label: 'Avg AI Confidence',   val: `${AH_LOG_SUMMARY.avgAiConfidence}%`,         icon: 'bi-speedometer2', color: '#ca8a04' },
              { label: 'Unique Users',        val: AH_LOG_SUMMARY.uniqueUsers.toLocaleString(),  icon: 'bi-people',     color: '#7c3aed' },
            ].map(chip => (
              <div key={chip.label} className="ah-quality-chip">
                <div style={{ color: chip.color, marginBottom: 6 }}><Icon name={chip.icon} /></div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{chip.val}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{chip.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* E — Troubleshooting */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Troubleshooting</div>
        <div className="ah-trouble-grid">
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#dc2626' }}>{stats.totalIssues.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Total Issues Processed</div>
          </div>
          <div style={{ flex: 1 }}>
            {ISSUE_CONFIG.map(cfg => {
              const count = stats.issuesByType[cfg.type]
              const pct   = Math.round(count / stats.totalIssues * 100)
              return (
                <button
                  key={cfg.type}
                  className="ah-issue-bar"
                  onClick={() => onDrillCategory(cfg.type)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ color: cfg.color }}><Icon name={cfg.icon} /></span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)', flex: 1 }}>{cfg.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{count.toLocaleString()} ({pct}%)</span>
                  </div>
                  <div className="ah-issue-bar-track">
                    <div className="ah-issue-bar-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* F — Document Breakdown */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Document Breakdown</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {AH_DOC_BREAKDOWN.map(doc => {
            const total = doc.ai_issue + doc.user_awareness + doc.ocr + doc.other
            const segs = [
              { label: 'AI Issue',   count: doc.ai_issue,        color: '#ef4444' },
              { label: 'User Awareness', count: doc.user_awareness, color: '#ca8a04' },
              { label: 'OCR',        count: doc.ocr,             color: '#7c3aed' },
              { label: 'Other',      count: doc.other,           color: '#6b7280' },
            ]
            return (
              <div key={doc.label} className="ah-doc-card">
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{doc.label}</div>
                <div className="ah-lifecycle-bar" style={{ height: 18, marginBottom: 8 }}>
                  {segs.map(s => (
                    <div key={s.label} style={{ flex: s.count, background: s.color }} title={`${s.label}: ${s.count}`} />
                  ))}
                </div>
                {segs.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                      {s.label}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--text)' }}>{s.count} ({Math.round(s.count / total * 100)}%)</span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* G — Insights */}
      <div className="ah-widget-section">
        <div className="ah-widget-section-title">Auto-generated Insights</div>
        <div className="ah-insight-grid">
          {INSIGHTS.map(ins => (
            <div key={ins.title} className="ah-insight-card" style={{ borderLeftColor: ins.color }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color: ins.color }}><Icon name={ins.icon} /></span>
                <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text)' }}>{ins.title}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>{ins.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
