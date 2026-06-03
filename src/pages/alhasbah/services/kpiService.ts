import { Ai_alhasbaagentkpisesService } from '../../../generated/services/Ai_alhasbaagentkpisesService'
import { Ai_alhasbakpihistoriesService } from '../../../generated/services/Ai_alhasbakpihistoriesService'
import type { Ai_alhasbaagentkpises } from '../../../generated/models/Ai_alhasbaagentkpisesModel'
import type { Ai_alhasbakpihistories } from '../../../generated/models/Ai_alhasbakpihistoriesModel'
import type { AHKPI, AHDivision, AHKPIStatus, AHTrend, AHKPIHistory } from '../data'
import { computeKpiStatus, computeTrend } from './ahMapper'

function toKpi(
  r: Ai_alhasbaagentkpises,
  allHistory: Ai_alhasbakpihistories[],
  agentDivisionMap: Map<string, AHDivision>,
): AHKPI {
  const kpiId = r.ai_id ?? r.ai_alhasbaagentkpisid
  const history: AHKPIHistory[] = allHistory
    .filter(h => h.ai_kpi_id === kpiId)
    .sort((a, b) => (b.ai_period ?? '').localeCompare(a.ai_period ?? ''))
    .map(h => ({ period: h.ai_period ?? '', actual: h.ai_actual ?? 0, target: h.ai_target ?? 0 }))

  const targetValue  = r.ai_target_value ?? 0
  const lowerIsBetter = r.ai_lower_is_better ?? false
  const latest    = history[0]
  const previous  = history[1]
  const currentValue = latest?.actual ?? 0
  const lastMeasured = latest?.period ?? new Date().toISOString().slice(0, 10)
  const status: AHKPIStatus = computeKpiStatus(currentValue, targetValue, lowerIsBetter)
  const { trend, trendDelta } = latest && previous
    ? computeTrend(latest.actual, previous.actual)
    : { trend: 'flat' as AHTrend, trendDelta: 0 }
  const division = agentDivisionMap.get(r.ai_agent_id ?? '') ?? 'HR'

  return {
    id:                  kpiId,
    _dvId:               r.ai_alhasbaagentkpisid,
    agentId:             r.ai_agent_id ?? '',
    division,
    function:            r.ai_short_name ?? '',
    kpiName:             r.ai_name,
    kpiDefinition:       r.ai_description ?? '',
    unit:                (r.ai_unit ?? '%') as AHKPI['unit'],
    targetValue,
    currentValue,
    status,
    trend,
    trendDelta,
    frequency:           (r.ai_measuring_interval ?? 'monthly') as AHKPI['frequency'],
    owner:               r.ai_owner ?? '',
    history,
    lowerIsBetter,
    dataSource:          r.ai_data_source,
    kpiFamily:           r.ai_short_name ?? 'Other',
    scope:               'division' as AHKPI['scope'],
    achievable:          (r.ai_achievable ?? 'yes') as AHKPI['achievable'],
    notAchievableReason: r.ai_not_achievable_reason,
    lastMeasured,
  }
}

export async function fetchKpis(agentDivisionMap: Map<string, AHDivision>): Promise<AHKPI[]> {
  const [kpiRes, histRes] = await Promise.all([
    Ai_alhasbaagentkpisesService.getAll({ filter: 'statecode eq 0' }),
    Ai_alhasbakpihistoriesService.getAll({ filter: 'statecode eq 0' }),
  ])
  const allHistory = histRes.data ?? []
  return (kpiRes.data ?? []).map(r => toKpi(r, allHistory, agentDivisionMap))
}

export async function createKpi(
  kpi: Omit<AHKPI, 'id' | '_dvId' | 'currentValue' | 'status' | 'trend' | 'trendDelta' | 'lastMeasured' | 'history' | 'division'>,
): Promise<void> {
  await Ai_alhasbaagentkpisesService.create({
    ai_name:                  kpi.kpiName,
    ai_agent_id:              kpi.agentId,
    ai_description:           kpi.kpiDefinition,
    ai_unit:                  kpi.unit,
    ai_target_value:          kpi.targetValue,
    ai_lower_is_better:       kpi.lowerIsBetter,
    ai_measuring_interval:    kpi.frequency,
    ai_owner:                 kpi.owner,
    ai_achievable:            kpi.achievable,
    ai_not_achievable_reason: kpi.notAchievableReason,
    ai_short_name:            kpi.function,
    ai_data_source:           kpi.dataSource,
  } as Parameters<typeof Ai_alhasbaagentkpisesService.create>[0])
}
