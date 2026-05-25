import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { RammasAtWorkService } from '../services/RammasAtWorkService'
import { _1Service } from '../generated/services/_1Service'

// ── Shapes ────────────────────────────────────────────────────
export interface AgentDetail {
  cat_name?: string
  cat_agentid?: string
  cat_environmentname?: string
  cat_enduserauthenticationtype?: string
  cat_usesgenai?: boolean
  cat_usesactions?: boolean
  cat_agentcreateddate?: string
  cat_published?: boolean
  [key: string]: unknown
}

export interface AgentValue {
  cat_agentvalueid: string
  cat_name?: string
  cat_agentid?: string                 // FK → AgentDetail
  cat_agenttypes?: string              // Assistant | Advisor | Performer | Retriever | Orchestrator | Collaborator
  cat_agentbehaviors?: string          // Respond | Decide | Act | Sense | Collaborate | Reflect
  cat_agentvaluebenefit?: string       // Increased productivity | Smarter recommendations | …
  cat_environmentdisplayname?: string
  cat_environmentid?: string
  cat_classificationdate?: string      // ISO datetime
  statecode?: number                   // 0 = Active
  statuscode?: number                  // 1 = Active
  createdon?: string
  modifiedon?: string
  '_ownerid_value@OData.Community.Display.V1.FormattedValue'?: string
  '_modifiedby_value@OData.Community.Display.V1.FormattedValue'?: string
  [key: string]: unknown               // OData annotation pass-through
}

interface CopilotData {
  agentDetails: AgentDetail[]
  agentValue: AgentValue[]
  loading: boolean
  error: string | null
}

// ── Context ───────────────────────────────────────────────────
const CopilotDataContext = createContext<CopilotData>({
  agentDetails: [],
  agentValue: [],
  loading: true,
  error: null,
})

// ── Provider ──────────────────────────────────────────────────
export function CopilotDataProvider({ children }: { children: ReactNode }) {
  const [agentDetails, setAgentDetails] = useState<AgentDetail[]>([])
  const [agentValue,   setAgentValue]   = useState<AgentValue[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const result = await _1Service.Run({})
        if (cancelled) return

        // Diagnostic: log what the SDK actually returned (dev only)
        const rawData = result.data as unknown
        if (import.meta.env.DEV) {
          const rawKeys = rawData != null && typeof rawData === 'object'
            ? Object.keys(rawData as Record<string, unknown>).join(', ')
            : String(rawData)
          console.info('[CopilotData] raw result — data keys:', rawKeys)
        }

        // Normalize the SDK response — "Respond to PowerApp" wraps data differently:
        //   Shape A: result.data = { values: "<JSON string>" }     → parse string
        //   Shape B: result.data = { values: { agentdetails, … } } → unwrap object
        //   Shape C: result.data = { agentdetails, agentvalues }   → already flat
        //   Shape D: result.data = { values: { body: {…} } }       → nested body
        //   Shape E: camelCase keys agentDetails / agentValues
        let json: Record<string, unknown> = {}

        if (rawData != null && typeof rawData === 'object') {
          const d = rawData as Record<string, unknown>

          // Step 1: unwrap "values" field if present
          let candidate: unknown = d
          if (d['values'] != null) {
            const v = d['values']
            try {
              candidate = typeof v === 'string' ? JSON.parse(v) : v
            } catch {
              candidate = v
            }
          }

          // Step 2: unwrap "body" if we landed on an HTTP action wrapper
          if (candidate != null && typeof candidate === 'object') {
            const c = candidate as Record<string, unknown>
            if (!Array.isArray(c['agentdetails']) && !Array.isArray(c['agentDetails']) && c['body'] != null) {
              const b = c['body']
              try {
                candidate = typeof b === 'string' ? JSON.parse(b) : b
              } catch {
                candidate = b
              }
            }
            json = candidate as Record<string, unknown>
          }
        }

        // The flow returns keys in swapped order relative to what the dashboard expects:
        //   json['agentdetails'] = 290 classification/value records  → goes to agentValue state
        //   json['agentvalues']  = 2 master agent records            → goes to agentDetails state
        // Support all casing variants for resilience.
        const detailsRaw = json['agentvalues']  ?? json['agentValues']  ?? json['AgentValues']
          ?? json['agent_values']  ?? json['AgentValue']
        const valuesRaw  = json['agentdetails'] ?? json['agentDetails'] ?? json['AgentDetails']
          ?? json['agent_details'] ?? json['AgentDetail']

        if (import.meta.env.DEV) {
          const detailsCount = Array.isArray(detailsRaw) ? (detailsRaw as unknown[]).length : 'missing'
          const valuesCount  = Array.isArray(valuesRaw)  ? (valuesRaw  as unknown[]).length : 'missing'
          const topKeys      = Object.keys(json).slice(0, 8).join(', ') || '(empty)'
          console.info(`[CopilotData] resolved — masterAgents: ${String(detailsCount)}, classifications: ${String(valuesCount)}, keys: ${topKeys}`)
        }

        const details = Array.isArray(detailsRaw) ? (detailsRaw as AgentDetail[]) : []
        const values  = Array.isArray(valuesRaw)  ? (valuesRaw  as AgentValue[])  : []

        setAgentDetails(details)
        setAgentValue(values)
      } catch (err) {
        if (cancelled) return
        const msg = import.meta.env.PROD
          ? 'Failed to load agent data. Please try again.'
          : (err instanceof Error ? err.message : String(err))
        setError(msg)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()
    // Warm the Rammas cache at app startup so the panel loads instantly
    RammasAtWorkService.fetch().catch(() => {})

    return () => { cancelled = true }
  }, [])

  return (
    <CopilotDataContext.Provider value={{ agentDetails, agentValue, loading, error }}>
      {children}
    </CopilotDataContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────
export function useCopilotData() {
  return useContext(CopilotDataContext)
}
