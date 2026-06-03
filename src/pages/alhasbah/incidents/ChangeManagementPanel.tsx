import Icon from '../../../components/Icon'
import {
  AH_CM_ACTIVITIES_MUT,
  type AHCMActivityType,
  type AHCMActivityStatus,
} from '../data'
import { useAlHasbah } from '../AlHasbahContext'

const TYPE_CONFIG: Record<AHCMActivityType, { label: string; color: string; icon: string }> = {
  awareness_session: { label: 'Awareness Sessions', color: '#7c3aed', icon: 'bi-megaphone' },
  documentation:     { label: 'Documentation',      color: '#0ea5e9', icon: 'bi-file-text' },
  training:          { label: 'Training',            color: '#007560', icon: 'bi-mortarboard' },
  communication:     { label: 'Communication',       color: '#ca8a04', icon: 'bi-envelope' },
}

const TYPE_ORDER: AHCMActivityType[] = ['awareness_session', 'training', 'documentation', 'communication']

function statusBadge(status: AHCMActivityStatus) {
  if (status === 'completed')
    return <span className="ah-badge" style={{ background: 'rgba(0,117,96,0.1)', color: '#007560' }}>Completed</span>
  if (status === 'in_progress')
    return <span className="ah-badge" style={{ background: 'rgba(202,138,4,0.1)', color: '#ca8a04' }}>In Progress</span>
  return <span className="ah-badge" style={{ background: 'rgba(107,114,128,0.1)', color: '#6b7280' }}>Planned</span>
}

export default function ChangeManagementPanel() {
  const { incidents } = useAlHasbah()
  const activities  = AH_CM_ACTIVITIES_MUT
  const incidentMap = new Map(incidents.map(i => [i.id, i.title]))

  const total      = activities.length
  const completed  = activities.filter(a => a.status === 'completed').length
  const inProgress = activities.filter(a => a.status === 'in_progress').length
  const planned    = activities.filter(a => a.status === 'planned').length

  const tiles = [
    { label: 'Total Activities', value: total,      color: '#007560' },
    { label: 'Completed',        value: completed,   color: '#007560' },
    { label: 'In Progress',      value: inProgress,  color: '#ca8a04' },
    { label: 'Planned',          value: planned,     color: '#6b7280' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary tiles */}
      <div className="ah-inc-summary-row">
        {tiles.map(t => (
          <div key={t.label} className="ah-inc-summary-tile" style={{ cursor: 'default' }}>
            <div className="ah-inc-summary-tile-val" style={{ color: t.color }}>{t.value}</div>
            <div className="ah-inc-summary-tile-label">{t.label}</div>
          </div>
        ))}
      </div>

      {/* Grouped by type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {TYPE_ORDER.map(typeName => {
          const cfg   = TYPE_CONFIG[typeName]
          const items = activities.filter(a => a.type === typeName)
          if (items.length === 0) return null

          return (
            <div key={typeName}>
              {/* Group header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 10,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    background: `${cfg.color}18`,
                    color: cfg.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    flexShrink: 0,
                  }}
                >
                  <Icon name={cfg.icon} />
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{items.length} activit{items.length === 1 ? 'y' : 'ies'}</div>
                </div>
              </div>

              {/* Activity cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(act => {
                  const incidentTitle = incidentMap.get(act.incidentId) ?? act.incidentId
                  return (
                    <div key={act.id} className="ah-cm-activity-card">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, flex: 1, lineHeight: 1.35 }}>{act.title}</div>
                        {statusBadge(act.status)}
                      </div>

                      <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 10 }}>
                        {act.description}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '6px 16px',
                          fontSize: 11,
                          color: 'var(--text-muted)',
                          paddingTop: 8,
                          borderTop: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="bi-calendar3" style={{ fontSize: 11 }} />
                          Scheduled: {act.scheduledDate}
                        </span>
                        {act.completedDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="bi-check-circle" style={{ fontSize: 11 }} />
                            Completed: {act.completedDate}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Icon name="bi-people" style={{ fontSize: 11 }} />
                          {act.targetAudience}
                        </span>
                        {act.attendees !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Icon name="bi-person-check" style={{ fontSize: 11 }} />
                            {act.attendees} attendees
                          </span>
                        )}
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#007560',
                            marginLeft: 'auto',
                          }}
                        >
                          <Icon name="bi-link-45deg" style={{ fontSize: 11 }} />
                          {incidentTitle}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
