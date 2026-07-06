import { Ai_alhasbaagentsesService } from '../../../generated/services/Ai_alhasbaagentsesService'
import type { Ai_alhasbaagentses } from '../../../generated/models/Ai_alhasbaagentsesModel'
import type { AHAgent, AHDivision, AHStatus } from '../data'
import { parseJsonArray, stringifyArray } from './ahMapper'

function toAgent(r: Ai_alhasbaagentses): AHAgent {
  return {
    id:                r.ai_id ?? r.ai_alhasbaagentsid,
    _dvId:             r.ai_alhasbaagentsid,
    name:              r.ai_name,
    division:          (r.ai_division ?? 'HR') as AHDivision,
    status:            (r.ai_status ?? 'planned') as AHStatus,
    businessOwner:     r.ai_business_owner ?? '',
    modelsUsed:        parseJsonArray<string>(r.ai_models_used),
    systemsIntegrated: parseJsonArray<string>(r.ai_systems_integrated),
    targetCostSaving:  r.ai_target_cost_saving ?? 0,
    fteSavingsTarget:  r.ai_fte_savings_target ?? 0,
    ptuUsage:          r.ai_ptu_usage ?? 0,
    targetEndUsers:    r.ai_target_end_users ?? '',
    mcpServers:        parseJsonArray<string>(r.ai_mcp_servers),
    aiTools:           parseJsonArray<string>(r.ai_aitools),
    // Derived client-side by AlHasbahContext from use-case / incident records
    totalUseCases:     0,
    liveUseCases:      0,
    openIncidents:     0,
    // Stored columns
    annualTransactions: Number(r.ai_annualtransactions) || 0,
    aiAdoptionPct:     Number(r.ai_adoptionpct) || 0,
    description:       r.ai_description ?? '',
  }
}

export async function fetchAgents(): Promise<AHAgent[]> {
  const res = await Ai_alhasbaagentsesService.getAll({ filter: 'statecode eq 0' })
  return (res.data ?? []).map(toAgent)
}

export async function createAgent(agent: Omit<AHAgent, 'id' | '_dvId'>): Promise<void> {
  // ownerid is omitted — Power Apps platform assigns it to the authenticated user
  await Ai_alhasbaagentsesService.create({
    ai_name:               agent.name,
    ai_division:           agent.division,
    ai_status:             agent.status,
    ai_business_owner:     agent.businessOwner,
    ai_models_used:        stringifyArray(agent.modelsUsed),
    ai_systems_integrated: stringifyArray(agent.systemsIntegrated),
    ai_target_cost_saving: agent.targetCostSaving,
    ai_fte_savings_target: agent.fteSavingsTarget,
    ai_ptu_usage:          agent.ptuUsage,
    ai_target_end_users:   agent.targetEndUsers,
    ai_mcp_servers:        stringifyArray(agent.mcpServers),
    ai_aitools:            stringifyArray(agent.aiTools),
    ai_description:        agent.description,
    ai_annualtransactions: String(agent.annualTransactions ?? 0),
    ai_adoptionpct:        String(agent.aiAdoptionPct ?? 0),
  } as Parameters<typeof Ai_alhasbaagentsesService.create>[0])
}

export async function updateAgent(dvId: string, patch: Partial<AHAgent>): Promise<void> {
  const fields: Record<string, unknown> = {}
  if (patch.name              !== undefined) fields.ai_name               = patch.name
  if (patch.division          !== undefined) fields.ai_division           = patch.division
  if (patch.status            !== undefined) fields.ai_status             = patch.status
  if (patch.businessOwner     !== undefined) fields.ai_business_owner     = patch.businessOwner
  if (patch.modelsUsed        !== undefined) fields.ai_models_used        = stringifyArray(patch.modelsUsed)
  if (patch.systemsIntegrated !== undefined) fields.ai_systems_integrated = stringifyArray(patch.systemsIntegrated)
  if (patch.targetCostSaving  !== undefined) fields.ai_target_cost_saving = patch.targetCostSaving
  if (patch.fteSavingsTarget  !== undefined) fields.ai_fte_savings_target = patch.fteSavingsTarget
  if (patch.ptuUsage          !== undefined) fields.ai_ptu_usage          = patch.ptuUsage
  if (patch.targetEndUsers    !== undefined) fields.ai_target_end_users   = patch.targetEndUsers
  if (patch.mcpServers        !== undefined) fields.ai_mcp_servers        = stringifyArray(patch.mcpServers)
  if (patch.aiTools           !== undefined) fields.ai_aitools            = stringifyArray(patch.aiTools)
  if (patch.description        !== undefined) fields.ai_description        = patch.description
  if (patch.annualTransactions !== undefined) fields.ai_annualtransactions = String(patch.annualTransactions)
  if (patch.aiAdoptionPct      !== undefined) fields.ai_adoptionpct        = String(patch.aiAdoptionPct)
  await Ai_alhasbaagentsesService.update(dvId, fields as Parameters<typeof Ai_alhasbaagentsesService.update>[1])
}
