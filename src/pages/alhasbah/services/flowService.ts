import { Ai_alhasbaflowmetricsesService } from '../../../generated/services/Ai_alhasbaflowmetricsesService'
import type { AHMonthlyFlow } from '../data'
export async function fetchFlowMetrics(): Promise<AHMonthlyFlow[]> {
  const res = await Ai_alhasbaflowmetricsesService.getAll({ filter: 'statecode eq 0' })
  const rows = res.data ?? []

  // Aggregate by month — Dataverse may have per-agent rows
  const byMonth = new Map<string, AHMonthlyFlow>()
  for (const r of rows) {
    const month    = r.ai_month ?? 'Unknown'
    const existing = byMonth.get(month) ?? { month, aiFlows: 0, manualFlows: 0, fteSaved: 0, costAvoided: 0 }
    byMonth.set(month, {
      month,
      aiFlows:     existing.aiFlows     + (r.ai_ai_flow_count    ?? 0),
      manualFlows: existing.manualFlows + (r.ai_manual_flow_count ?? 0),
      fteSaved:    existing.fteSaved    + (r.ai_fte_saved         ?? 0),
      costAvoided: existing.costAvoided + (r.ai_cost_avoided      ?? 0),
    })
  }
  return Array.from(byMonth.values())
}
