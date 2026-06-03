import { Ai_alhasbausecasesesService } from '../../../generated/services/Ai_alhasbausecasesesService'
import { Ai_alhasbamilestonesesService } from '../../../generated/services/Ai_alhasbamilestonesesService'
import type { Ai_alhasbausecaseses } from '../../../generated/models/Ai_alhasbausecasesesModel'
import type { Ai_alhasbamilestoneses } from '../../../generated/models/Ai_alhasbamilestonesesModel'
import type { AHUseCase, AHDivision, AHStatus } from '../data'
import { parseJsonArray, stringifyArray } from './ahMapper'

function toUseCase(r: Ai_alhasbausecaseses, milestones: Ai_alhasbamilestoneses[]): AHUseCase {
  const ucId = r.ai_id ?? r.ai_alhasbausecasesid
  const myMilestones = milestones
    .filter(m => m.ai_use_case_id === ucId)
    .map(m => ({
      name:   m.ai_name,
      status: (m.ai_status ?? 'pending') as 'completed' | 'in_progress' | 'pending',
    }))

  return {
    id:                    ucId,
    _dvId:                 r.ai_alhasbausecasesid,
    agentId:               r.ai_agent_id ?? '',
    name:                  r.ai_name,
    division:              (r.ai_division ?? 'HR') as AHDivision,
    domain:                r.ai_domain ?? '',
    status:                (r.ai_status ?? 'planned') as AHStatus,
    plannedGoLive:         r.ai_planned_go_live ?? '',
    actualGoLive:          r.ai_actual_go_live,
    annualVolume:          r.ai_annual_volume ?? 0,
    expectedEfficiency:    r.ai_expected_efficiency ?? 0,
    targetCostSaving:      r.ai_target_cost_saving ?? 0,
    description:           r.ai_description ?? '',
    sapModule:             r.ai_sap_module ?? '',
    systemsForIntegration: parseJsonArray<string>(r.ai_systems_for_integration),
    currentState:          r.ai_current_state ?? '',
    futureState:           r.ai_future_state ?? '',
    processes:             parseJsonArray<string>(r.ai_processes),
    totalDevelopmentEffort: r.ai_total_development_effort ?? 0,
    adoptionActual:        undefined,
    milestones:            myMilestones.length > 0 ? myMilestones : [
      { name: 'Design',      status: 'pending' },
      { name: 'Development', status: 'pending' },
      { name: 'UAT',         status: 'pending' },
      { name: 'Go-Live',     status: 'pending' },
    ],
  }
}

export async function fetchUseCases(): Promise<AHUseCase[]> {
  const [ucRes, msRes] = await Promise.all([
    Ai_alhasbausecasesesService.getAll({ filter: 'statecode eq 0' }),
    Ai_alhasbamilestonesesService.getAll({ filter: 'statecode eq 0' }),
  ])
  const milestones = msRes.data ?? []
  return (ucRes.data ?? []).map(r => toUseCase(r, milestones))
}

export async function createUseCase(uc: Omit<AHUseCase, 'id' | '_dvId'>): Promise<void> {
  await Ai_alhasbausecasesesService.create({
    ai_name:                    uc.name,
    ai_agent_id:                uc.agentId,
    ai_division:                uc.division,
    ai_domain:                  uc.domain,
    ai_status:                  uc.status,
    ai_planned_go_live:         uc.plannedGoLive,
    ai_actual_go_live:          uc.actualGoLive,
    ai_annual_volume:           uc.annualVolume,
    ai_expected_efficiency:     uc.expectedEfficiency,
    ai_target_cost_saving:      uc.targetCostSaving,
    ai_description:             uc.description,
    ai_sap_module:              uc.sapModule,
    ai_systems_for_integration: stringifyArray(uc.systemsForIntegration),
    ai_current_state:           uc.currentState,
    ai_future_state:            uc.futureState,
    ai_processes:               stringifyArray(uc.processes),
    ai_total_development_effort: uc.totalDevelopmentEffort,
  } as Parameters<typeof Ai_alhasbausecasesesService.create>[0])
}

export async function updateUseCase(dvId: string, patch: Partial<Omit<AHUseCase, 'id' | '_dvId'>>): Promise<void> {
  const fields: Record<string, unknown> = {}
  if (patch.name                   !== undefined) fields.ai_name                    = patch.name
  if (patch.agentId                !== undefined) fields.ai_agent_id                = patch.agentId
  if (patch.division               !== undefined) fields.ai_division                = patch.division
  if (patch.domain                 !== undefined) fields.ai_domain                  = patch.domain
  if (patch.status                 !== undefined) fields.ai_status                  = patch.status
  if (patch.plannedGoLive          !== undefined) fields.ai_planned_go_live         = patch.plannedGoLive
  if (patch.actualGoLive           !== undefined) fields.ai_actual_go_live          = patch.actualGoLive
  if (patch.annualVolume           !== undefined) fields.ai_annual_volume           = patch.annualVolume
  if (patch.expectedEfficiency     !== undefined) fields.ai_expected_efficiency     = patch.expectedEfficiency
  if (patch.targetCostSaving       !== undefined) fields.ai_target_cost_saving      = patch.targetCostSaving
  if (patch.description            !== undefined) fields.ai_description             = patch.description
  if (patch.sapModule              !== undefined) fields.ai_sap_module              = patch.sapModule
  if (patch.systemsForIntegration  !== undefined) fields.ai_systems_for_integration = stringifyArray(patch.systemsForIntegration)
  if (patch.currentState           !== undefined) fields.ai_current_state           = patch.currentState
  if (patch.futureState            !== undefined) fields.ai_future_state            = patch.futureState
  if (patch.processes              !== undefined) fields.ai_processes               = stringifyArray(patch.processes)
  if (patch.totalDevelopmentEffort !== undefined) fields.ai_total_development_effort = patch.totalDevelopmentEffort
  await Ai_alhasbausecasesesService.update(dvId, fields as Parameters<typeof Ai_alhasbausecasesesService.update>[1])
}
