/**
 * CoELensContext — fires the CoELens_PTU_v1_0 flow after user login.
 *
 * Scope (for now): incidents module only.
 * Expansion: add more modules here when their live data is ready.
 *
 * Pattern mirrors CopilotDataContext — one call on app mount, result stored
 * in context, LensBriefing reads from it. No per-page fetching.
 */

import {
  createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode,
} from 'react'
import type { ModuleBriefing } from '../pages/coe-lens/insights'
import { getBriefingForModule } from '../pages/coe-lens/insights'
import { CoELens_PTU_v1_0Service } from '../generated/services/CoELens_PTU_v1_0Service'
import { Cr978_coe_aiincidentsService } from '../generated/services/Cr978_coe_aiincidentsService'

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are CoE Lens, an AI intelligence advisor for DEWA's Centre of Excellence AI Intelligence Platform.
Analyse the AI incidents data provided and return a concise executive briefing for senior leadership.

Respond ONLY with a valid JSON object — no markdown code fences, no explanation, no extra text:
{
  "narrative": "2-sentence summary of the current incidents status referencing real numbers from the data",
  "win": "The most significant positive (resolved incidents or low severity) in 1 sentence, or null if none",
  "watchlist": "The most important incident to monitor (1 sentence), or null if none",
  "critical": "The most critical risk requiring immediate action (1 sentence), or null if there are no critical issues"
}

Rules: reference actual incident titles, severity levels, platforms, and counts. Be direct — senior leadership tone.`

// ── Incidents data formatter ──────────────────────────────────────────────────

async function fetchAndFormatIncidents(): Promise<string> {
  const res = await Cr978_coe_aiincidentsService.getAll()
  const rows = res.data ?? []
  if (!rows.length) return 'No incidents found in Dataverse.'

  const open     = rows.filter(r => (r.cr978_coe_status ?? '').toLowerCase() !== 'resolved')
  const resolved = rows.filter(r => (r.cr978_coe_status ?? '').toLowerCase() === 'resolved')

  const bySev = (s: string) =>
    open.filter(r => (r.cr978_coe_severity ?? r.cr978_coe_priority ?? '').toLowerCase() === s)

  const lines = [
    `INCIDENTS SUMMARY`,
    `Total: ${rows.length} (${open.length} open · ${resolved.length} resolved)`,
    `By severity — Critical: ${bySev('critical').length} · High: ${bySev('high').length} · Medium: ${bySev('medium').length} · Low: ${bySev('low').length}`,
    '',
    `OPEN INCIDENTS (${open.length}):`,
    ...open.map(r =>
      `  [${(r.cr978_coe_severity ?? r.cr978_coe_priority ?? 'Unknown').toUpperCase()}]` +
      ` ${r.cr978_coe_title ?? r.cr978_coe_ticketnumber ?? 'Untitled'}` +
      ` | Platform: ${r.cr978_coe_platform ?? 'Unknown'}` +
      ` | Type: ${r.cr978_coe_incident_type ?? 'Unknown'}` +
      ` | Status: ${r.cr978_coe_status ?? 'Unknown'}` +
      ` | Reported: ${r.cr978_coe_reportedon ?? 'Unknown'}` +
      (r.cr978_coe_isdatarisk ? ' | ⚠ DATA RISK' : '')
    ),
    '',
    `RESOLVED (${resolved.length}):`,
    ...resolved.slice(0, 3).map(r =>
      `  ${r.cr978_coe_title ?? 'Untitled'} — resolved ${r.cr978_coe_resolvedon ?? 'recently'}`
    ),
  ]

  return lines.join('\n')
}

// ── Response parser ───────────────────────────────────────────────────────────
// Handles every shape the PA SDK / Power Automate "Respond to PowerApp" step
// can produce — direct string, nested object, capital keys, JSON-in-JSON.

function extractText(raw: unknown): string | null {
  if (typeof raw === 'string') return raw

  if (raw != null && typeof raw === 'object') {
    const d = raw as Record<string, unknown>

    // Try common field names the PA "Respond to PowerApp" step uses
    const FIELDS = ['output', 'output_', 'Output', 'response', 'Response', 'content', 'Content', 'result', 'Result', 'text', 'Text']
    for (const field of FIELDS) {
      if (typeof d[field] === 'string') return d[field] as string
    }

    // PA SDK sometimes wraps in { values: "..." } or { values: { output: "..." } }
    if (d['values'] != null) {
      const v = d['values']
      const vText = typeof v === 'string' ? v : extractText(v)
      if (vText) return vText
    }

    // Try body wrapper
    if (d['body'] != null) {
      const bText = extractText(d['body'])
      if (bText) return bText
    }
  }

  return null
}

function parseBriefingJson(text: string): ModuleBriefing | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try {
    const obj = JSON.parse(cleaned) as Record<string, unknown>
    if (typeof obj['narrative'] !== 'string') return null
    return {
      narrative: obj['narrative'],
      win:       typeof obj['win']       === 'string' ? obj['win']       : null,
      watchlist: typeof obj['watchlist'] === 'string' ? obj['watchlist'] : null,
      critical:  typeof obj['critical']  === 'string' ? obj['critical']  : null,
    }
  } catch {
    return null
  }
}

function parsePTUResponse(raw: unknown): ModuleBriefing | null {
  const text = extractText(raw)
  if (!text) return null

  // The PA flow returns the full Azure OpenAI chat completion JSON.
  // Unwrap choices[0].message.content to get the actual briefing JSON string.
  try {
    const oai = JSON.parse(text) as Record<string, unknown>
    const choices = oai['choices'] as Array<{ message: { content: string } }> | undefined
    const content = choices?.[0]?.message?.content
    if (typeof content === 'string') return parseBriefingJson(content)
  } catch {
    // Not an OpenAI completion wrapper — try parsing directly
  }

  return parseBriefingJson(text)
}

// ── Context shape ─────────────────────────────────────────────────────────────

interface CoELensContextValue {
  incidentsBriefing: ModuleBriefing | null
  incidentsLoading:  boolean
  incidentsIsAI:     boolean          // true = PTU result, false = static fallback
  refreshIncidents:  () => void
}

const CoELensContext = createContext<CoELensContextValue>({
  incidentsBriefing: null,
  incidentsLoading:  true,
  incidentsIsAI:     false,
  refreshIncidents:  () => {},
})

// ── Provider ──────────────────────────────────────────────────────────────────

export function CoELensProvider({ children }: { children: ReactNode }) {
  const [briefing, setBriefing] = useState<ModuleBriefing | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [isAI,     setIsAI]     = useState(false)

  const fetchIncidents = useCallback(async () => {
    setLoading(true)

    try {
      // Step 1 — fetch live Dataverse incidents (resilient: if fetch fails, use placeholder)
      let dataStr = 'Live Dataverse data unavailable — using known incident patterns.'
      try {
        dataStr = await fetchAndFormatIncidents()
      } catch (fetchErr) {
        console.warn('[CoE Lens] Dataverse fetch failed, proceeding with placeholder:', fetchErr)
      }

      // Step 2 — build user prompt
      const userPrompt = [
        'Generate a CoE Lens executive briefing for the AI INCIDENTS module of the DEWA COE platform.',
        '',
        'CURRENT DATA FROM DATAVERSE:',
        dataStr,
        '',
        'Produce the JSON briefing object now.',
      ].join('\n')

      // Step 3 — call CoELens_PTU_v1_0 flow
      // Input format: { text: string } where text = JSON.stringify(messages)
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt    },
      ]
      const result = await CoELens_PTU_v1_0Service.Run({
        text: JSON.stringify(messages),
      })

      // Step 4 — parse response
      const parsed = parsePTUResponse(result.data)
      if (parsed) {
        setBriefing(parsed)
        setIsAI(true)
      } else {
        console.warn('[CoE Lens] PTU response could not be parsed — using static fallback. Raw:', result.data)
        setBriefing(getBriefingForModule('incidents'))
        setIsAI(false)
      }
    } catch (err) {
      console.error('[CoE Lens] incidents flow failed:', err)
      setBriefing(getBriefingForModule('incidents'))
      setIsAI(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fire exactly once after the user logs in.
  // useRef guard prevents the StrictMode double-invocation in development
  // (React mounts → unmounts → remounts in dev; refs survive that cycle).
  const hasFetched = useRef(false)
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    void fetchIncidents()
  }, [fetchIncidents])

  return (
    <CoELensContext.Provider value={{
      incidentsBriefing: briefing,
      incidentsLoading:  loading,
      incidentsIsAI:     isAI,
      refreshIncidents:  fetchIncidents,
    }}>
      {children}
    </CoELensContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

// eslint-disable-next-line react-refresh/only-export-components
export function useCoELens() {
  return useContext(CoELensContext)
}
