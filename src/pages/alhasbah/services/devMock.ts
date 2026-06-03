/**
 * DEV MODE MOCK — used only when import.meta.env.DEV === true.
 * In production (Power Apps runtime) these are never imported.
 *
 * Allows full end-to-end UI verification without a live Dataverse connection.
 * Mutates in-memory arrays so create/update operations reflect immediately.
 */
import type { AHAgent, AHUseCase, AHKPI, AHIncident, AHMonthlyFlow, AHKPIHistory } from '../data'
import {
  AH_AGENTS, AH_USE_CASES, AH_KPIS, AH_INCIDENTS,
} from '../data'
import { computeKpiStatus, computeTrend } from './ahMapper'

// Mutable in-memory stores (copies of seeds — mutations survive for the session)
let _agents:    AHAgent[]    = AH_AGENTS.map(a => ({ ...a, _dvId: `dv-${a.id}` }))
let _useCases:  AHUseCase[]  = AH_USE_CASES.map(u => ({ ...u, _dvId: `dv-${u.id}` }))
let _kpis:      AHKPI[]      = AH_KPIS.map(k => ({ ...k, _dvId: `dv-${k.id}` }))
let _incidents: AHIncident[] = AH_INCIDENTS.map(i => ({ ...i, _dvId: `dv-${i.id}` }))

const _flow: AHMonthlyFlow[] = [
  { month: 'Dec', aiFlows: 1850, manualFlows: 4200, fteSaved: 310, costAvoided: 48_000 },
  { month: 'Jan', aiFlows: 3200, manualFlows: 4050, fteSaved: 520, costAvoided: 82_000 },
  { month: 'Feb', aiFlows: 5100, manualFlows: 3800, fteSaved: 840, costAvoided: 128_000 },
  { month: 'Mar', aiFlows: 7400, manualFlows: 3500, fteSaved: 1180, costAvoided: 185_000 },
  { month: 'Apr', aiFlows: 9600, manualFlows: 3200, fteSaved: 1520, costAvoided: 240_000 },
  { month: 'May', aiFlows: 11800, manualFlows: 2900, fteSaved: 1850, costAvoided: 295_000 },
]

export const devMock = {
  fetchAgents:    (): Promise<AHAgent[]>    => Promise.resolve([..._agents]),
  fetchUseCases:  (): Promise<AHUseCase[]>  => Promise.resolve([..._useCases]),
  fetchKpis:      (): Promise<AHKPI[]>      => Promise.resolve([..._kpis]),
  fetchIncidents: (): Promise<AHIncident[]> => Promise.resolve([..._incidents]),
  fetchFlowMetrics: (): Promise<AHMonthlyFlow[]> => Promise.resolve([..._flow]),

  createAgent(agent: Omit<AHAgent, 'id' | '_dvId'>): Promise<void> {
    const id   = `agt-dev-${Date.now()}`
    const dvId = `dv-${id}`
    _agents = [..._agents, { ...agent, id, _dvId: dvId }]
    return Promise.resolve()
  },

  updateAgent(dvId: string, patch: Partial<AHAgent>): Promise<void> {
    _agents = _agents.map(a => a._dvId === dvId ? { ...a, ...patch } : a)
    return Promise.resolve()
  },

  createUseCase(uc: Omit<AHUseCase, 'id' | '_dvId'>): Promise<void> {
    const id = `uc-dev-${Date.now()}`
    _useCases = [..._useCases, { ...uc, id, _dvId: `dv-${id}` }]
    return Promise.resolve()
  },

  updateUseCase(dvId: string, patch: Partial<AHUseCase>): Promise<void> {
    _useCases = _useCases.map(u => u._dvId === dvId ? { ...u, ...patch } : u)
    return Promise.resolve()
  },

  createKpi(kpi: Omit<AHKPI, 'id' | '_dvId' | 'currentValue' | 'status' | 'trend' | 'trendDelta' | 'lastMeasured' | 'history' | 'division'>): Promise<void> {
    const id      = `kpi-dev-${Date.now()}`
    const history: AHKPIHistory[] = []
    const agentDiv = (_agents.find(a => a.id === kpi.agentId)?.division) ?? 'HR'
    _kpis = [..._kpis, {
      ...kpi,
      id,
      _dvId:        `dv-${id}`,
      division:     agentDiv,
      currentValue: 0,
      status:       computeKpiStatus(0, kpi.targetValue, kpi.lowerIsBetter ?? false),
      trend:        'flat' as const,
      trendDelta:   0,
      lastMeasured: new Date().toISOString().slice(0, 10),
      history,
    }]
    return Promise.resolve()
  },

  createIncident(inc: Omit<AHIncident, 'id' | '_dvId'>): Promise<void> {
    const id = `inc-dev-${Date.now()}`
    _incidents = [..._incidents, { ...inc, id, _dvId: `dv-${id}` }]
    return Promise.resolve()
  },

  updateIncident(dvId: string, patch: Partial<AHIncident>): Promise<void> {
    _incidents = _incidents.map(i => i._dvId === dvId ? { ...i, ...patch } : i)
    return Promise.resolve()
  },

  addComment(dvId: string, currentComments: AHIncident['comments'], comment: Omit<AHIncident['comments'][0], 'id'>): Promise<AHIncident['comments']> {
    const newComment = { ...comment, id: `c-dev-${Date.now()}` }
    const updated = [...currentComments, newComment]
    _incidents = _incidents.map(i => i._dvId === dvId ? { ...i, comments: updated } : i)
    return Promise.resolve(updated)
  },
}

// Expose computeTrend so kpiService can use it in dev mode without circular import
export { computeTrend }
