import Icon from './Icon'
import '../lens-components.css'

export type LensChipType = 'positive' | 'attention' | 'critical' | 'neutral'

interface Props {
  text: string
  type?: LensChipType
}

export default function LensInsightChip({ text, type = 'neutral' }: Props) {
  return (
    <div className={`lic-chip lic-chip--${type}`}>
      <span className="lic-icon"><Icon name="bi-lightbulb-fill" aria-hidden="true" /></span>
      <span className="lic-label">CoE Lens:</span>
      <span className="lic-text">{text}</span>
    </div>
  )
}
