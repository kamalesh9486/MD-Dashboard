import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { AHAgent, AHUseCase, AHKPI, AHIncident, AHMonthlyFlow, AHDivision } from './data'
import { fetchAgents } from './services/agentService'
import { fetchUseCases } from './services/useCaseService'
import { fetchKpis } from './services/kpiService'
import { fetchIncidents } from './services/incidentService'
import { fetchFlowMetrics } from './services/flowService'

interface AlHasbahData {
  agents:      AHAgent[]
  useCases:    AHUseCase[]
  kpis:        AHKPI[]
  incidents:   AHIncident[]
  flowMetrics: AHMonthlyFlow[]
  loading:     boolean
  error:       string | null
  refreshAgents:    () => Promise<void>
  refreshUseCases:  () => Promise<void>
  refreshKpis:      () => Promise<void>
  refreshIncidents: () => Promise<void>
}

const Ctx = createContext<AlHasbahData | null>(null)

export function useAlHasbah(): AlHasbahData {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAlHasbah must be used inside AlHasbahProvider')
  return ctx
}

// Enrich agents with derived counts computed from use-cases and incidents.
// Called both on initial load and after any mutation refresh so counts stay live.
function enrichAgents(
  rawAgents: AHAgent[],
  allUseCases: AHUseCase[],
  allIncidents: AHIncident[],
): AHAgent[] {
  const ucByAgent      = new Map<string, number>()
  const liveUCByAgent  = new Map<string, number>()
  for (const uc of allUseCases) {
    ucByAgent.set(uc.agentId, (ucByAgent.get(uc.agentId) ?? 0) + 1)
    if (uc.status === 'live') liveUCByAgent.set(uc.agentId, (liveUCByAgent.get(uc.agentId) ?? 0) + 1)
  }
  const openIncByAgent = new Map<string, number>()
  for (const inc of allIncidents) {
    if (inc.status !== 'resolved') openIncByAgent.set(inc.agentId, (openIncByAgent.get(inc.agentId) ?? 0) + 1)
  }
  return rawAgents.map(a => ({
    ...a,
    totalUseCases: ucByAgent.get(a.id)      ?? 0,
    liveUseCases:  liveUCByAgent.get(a.id)  ?? 0,
    openIncidents: openIncByAgent.get(a.id) ?? 0,
  }))
}

export function AlHasbahProvider({ children }: { children: ReactNode }) {
  const [agents,      setAgents]      = useState<AHAgent[]>([])
  const [useCases,    setUseCases]    = useState<AHUseCase[]>([])
  const [kpis,        setKpis]        = useState<AHKPI[]>([])
  const [incidents,   setIncidents]   = useState<AHIncident[]>([])
  const [flowMetrics, setFlowMetrics] = useState<AHMonthlyFlow[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // Keep snapshots for cross-entity enrichment in targeted refresh functions
  const [latestUseCases,  setLatestUseCases]  = useState<AHUseCase[]>([])
  const [latestIncidents, setLatestIncidents] = useState<AHIncident[]>([])

  async function loadAll() {
    setLoading(true)
    setError(null)
    try {
      const rawAgents = await fetchAgents()
      const agentDivisionMap = new Map<string, AHDivision>(rawAgents.map(a => [a.id, a.division]))

      const [loadedUCs, loadedKpis, loadedIncidents, loadedFlow] = await Promise.all([
        fetchUseCases(),
        fetchKpis(agentDivisionMap),
        fetchIncidents(),
        fetchFlowMetrics(),
      ])

      const enriched = enrichAgents(rawAgents, loadedUCs, loadedIncidents)
      setAgents(enriched)
      setUseCases(loadedUCs)
      setKpis(loadedKpis)
      setIncidents(loadedIncidents)
      setFlowMetrics(loadedFlow)
      setLatestUseCases(loadedUCs)
      setLatestIncidents(loadedIncidents)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Al Hasbah data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadAll() }, [])

  // Targeted refresh functions — each re-enriches agents so derived counts stay correct.
  const refreshAgents = useCallback(async () => {
    const rawAgents = await fetchAgents()
    const enriched  = enrichAgents(rawAgents, latestUseCases, latestIncidents)
    setAgents(enriched)
  }, [latestUseCases, latestIncidents])

  const refreshUseCases = useCallback(async () => {
    const loaded = await fetchUseCases()
    setUseCases(loaded)
    setLatestUseCases(loaded)
    // Re-enrich agent UC counts with fresh use-case data
    setAgents(prev => enrichAgents(prev.map(a => ({ ...a })), loaded, latestIncidents))
  }, [latestIncidents])

  const refreshKpis = useCallback(async () => {
    const agentDivisionMap = new Map<string, AHDivision>(agents.map(a => [a.id, a.division]))
    const loaded = await fetchKpis(agentDivisionMap)
    setKpis(loaded)
  }, [agents])

  const refreshIncidents = useCallback(async () => {
    const loaded = await fetchIncidents()
    setIncidents(loaded)
    setLatestIncidents(loaded)
    // Re-enrich agent open-incident counts
    setAgents(prev => enrichAgents(prev.map(a => ({ ...a })), latestUseCases, loaded))
  }, [latestUseCases])

  return (
    <Ctx.Provider value={{
      agents, useCases, kpis, incidents, flowMetrics,
      loading, error,
      refreshAgents, refreshUseCases, refreshKpis, refreshIncidents,
    }}>
      {children}
    </Ctx.Provider>
  )
}
