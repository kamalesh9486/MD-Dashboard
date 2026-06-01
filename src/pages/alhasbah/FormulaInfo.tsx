import { useState } from 'react'
import Icon from '../../components/Icon'

type FormulaMetric = 'transactions' | 'adoption' | 'issues' | 'usecases' | 'ptu'

const FORMULAS: Record<FormulaMetric, { title: string; formula: string }> = {
  transactions: {
    title: 'Total Transactions',
    formula: 'Σ annualTransactions across all live use cases linked to this agent',
  },
  adoption: {
    title: 'AI Adoption %',
    formula: 'AI-Handled Transactions ÷ Total Transactions × 100\nHigher is better. Target: ≥ 80%',
  },
  issues: {
    title: 'Open Incidents',
    formula: 'Count of incidents with status ≠ "resolved" linked to this agent',
  },
  usecases: {
    title: 'Use Case Adoption',
    formula: 'Live Use Cases ÷ Total Use Cases linked to this agent',
  },
  ptu: {
    title: 'PTU Usage',
    formula: "Provisioned Throughput Units consumed per month by this agent's model deployments",
  },
}

interface Props {
  metric: FormulaMetric
}

export default function FormulaInfo({ metric }: Props) {
  const [visible, setVisible] = useState(false)
  const info = FORMULAS[metric]

  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        className="ah-formula-trigger"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={`Formula: ${info.title}`}
      >
        <Icon name="bi-info-circle" />
      </button>
      {visible && (
        <div className="ah-formula-tooltip" role="tooltip">
          <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11 }}>{info.title}</div>
          <div style={{ fontSize: 11.5, whiteSpace: 'pre-line', opacity: 0.9 }}>{info.formula}</div>
        </div>
      )}
    </span>
  )
}
