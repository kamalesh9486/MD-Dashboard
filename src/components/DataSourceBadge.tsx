export type DataSourceType = 'live' | 'internal' | 'simulated' | 'mixed'

const LABELS: Record<DataSourceType, string> = {
  live:      'Live Data',
  internal:  'Internal DB',
  simulated: 'Simulated',
  mixed:     'Mixed Sources',
}

interface Props {
  type: DataSourceType
  title?: string
  lastUpdated?: string
}

export default function DataSourceBadge({ type, title, lastUpdated }: Props) {
  return (
    <div className="ds-badge-wrap">
      <span className={`ds-badge ds-badge--${type}`} title={title}>
        {LABELS[type]}
      </span>
      {lastUpdated && (
        <span className="ds-badge-date">Last updated on {lastUpdated}</span>
      )}
    </div>
  )
}
