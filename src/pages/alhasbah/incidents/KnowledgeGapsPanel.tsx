import Icon from '../../../components/Icon'
import {
  AH_SLA_DAYS,
  daysSince,
  type AHIncident,
  type AHSeverity,
} from '../data'
import { useAlHasbah } from '../AlHasbahContext'

const SEV_COLORS: Record<AHSeverity, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#94a3b8',
}

function sevClass(s: AHSeverity) {
  return s === 'critical'
    ? 'ah-badge ah-sev-critical'
    : s === 'high'
      ? 'ah-badge ah-sev-high'
      : s === 'medium'
        ? 'ah-badge ah-sev-medium'
        : 'ah-badge ah-sev-low'
}

function statusBadge(status: string) {
  if (status === 'open')
    return <span className="ah-badge ah-inc-open">Open</span>
  if (status === 'in_progress')
    return <span className="ah-badge ah-inc-in-progress">In Progress</span>
  return <span className="ah-badge ah-inc-resolved">Resolved</span>
}

interface Props {
  onSelectIncident: (inc: AHIncident) => void
}

export default function KnowledgeGapsPanel({ onSelectIncident }: Props) {
  const { incidents, agents } = useAlHasbah()
  const gaps = incidents.filter(i => i.type === 'knowledge_gap')
  const agentMap = new Map(agents.map(a => [a.id, a.name]))

  if (gaps.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: 'var(--text-muted)',
        }}
      >
        <Icon name="bi-book" style={{ fontSize: 40, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 600 }}>No knowledge gap incidents recorded.</div>
        <div style={{ fontSize: 12, marginTop: 4 }}>Knowledge gap incidents will appear here once reported.</div>
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 14,
      }}
    >
      {gaps.map(inc => {
        const days     = daysSince(inc.reportedDate)
        const slaDays  = AH_SLA_DAYS[inc.severity]
        const breached = inc.status !== 'resolved' && days > slaDays
        const agentName = agentMap.get(inc.agentId) ?? '—'

        return (
          <div
            key={inc.id}
            className="ah-kg-card"
            role="button"
            tabIndex={0}
            onClick={() => onSelectIncident(inc)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectIncident(inc) } }}
            aria-label={`Knowledge gap: ${inc.title}`}
            style={{ borderLeft: `3px solid ${SEV_COLORS[inc.severity]}` }}
          >
            {/* Top badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span className={sevClass(inc.severity)}>{inc.severity.toUpperCase()}</span>
              {statusBadge(inc.status)}
            </div>

            {/* Title */}
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 6, lineHeight: 1.35 }}>
              {inc.title}
            </div>

            {/* Description (2-line clamp) */}
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
                marginBottom: 10,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {inc.description}
            </div>

            {/* Bottom row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="bi-robot" style={{ fontSize: 11 }} />
                {agentName}
              </span>
              <span
                style={{
                  color: breached ? '#dc2626' : '#007560',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {breached && <Icon name="bi-exclamation-triangle-fill" style={{ fontSize: 11 }} />}
                {days}d / {slaDays}d SLA
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
