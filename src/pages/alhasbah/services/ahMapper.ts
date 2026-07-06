// Al Hasbah — Dataverse field serialization helpers

export function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return []
  try { return JSON.parse(raw) as T[] } catch { return [] }
}

export function stringifyArray(arr: unknown[]): string {
  return JSON.stringify(arr)
}

export interface SubmitterFields {
  submitterName: string
  submitterEmail: string
  submitterPhone?: string
  submitterDepartment?: string
  submitterRole?: string
}

// Encode the full submitter object as JSON into the single ai_submitter Dataverse column.
export function encodeSubmitter(s: SubmitterFields): string {
  return JSON.stringify({
    name:       s.submitterName,
    email:      s.submitterEmail,
    phone:      s.submitterPhone ?? '',
    department: s.submitterDepartment ?? '',
    role:       s.submitterRole ?? '',
  })
}

// Decode ai_submitter. Supports both the new JSON format and the legacy "name|email" format.
export function decodeSubmitter(raw: string | undefined): SubmitterFields {
  if (!raw) return { submitterName: '', submitterEmail: '' }
  const trimmed = raw.trim()
  if (trimmed.startsWith('{')) {
    try {
      const o = JSON.parse(trimmed) as Record<string, string>
      return {
        submitterName:       o.name ?? '',
        submitterEmail:      o.email ?? '',
        submitterPhone:      o.phone || undefined,
        submitterDepartment: o.department || undefined,
        submitterRole:       o.role || undefined,
      }
    } catch { /* fall through to legacy */ }
  }
  // Legacy "name|email"
  const idx = trimmed.indexOf('|')
  if (idx === -1) return { submitterName: trimmed, submitterEmail: '' }
  return { submitterName: trimmed.slice(0, idx), submitterEmail: trimmed.slice(idx + 1) }
}

export function computeKpiStatus(
  current: number,
  target: number,
  lowerIsBetter: boolean,
): 'on_track' | 'at_risk' | 'off_track' {
  if (target === 0) return 'at_risk'
  const ratio = lowerIsBetter
    ? current <= target ? 1 : target / current
    : current / target
  if (ratio >= 0.9) return 'on_track'
  if (ratio >= 0.5) return 'at_risk'
  return 'off_track'
}

export function computeTrend(
  recent: number,
  previous: number,
): { trend: 'up' | 'down' | 'flat'; trendDelta: number } {
  const delta = Math.abs(recent - previous)
  if (recent > previous) return { trend: 'up', trendDelta: parseFloat(delta.toFixed(1)) }
  if (recent < previous) return { trend: 'down', trendDelta: parseFloat(delta.toFixed(1)) }
  return { trend: 'flat', trendDelta: 0 }
}
