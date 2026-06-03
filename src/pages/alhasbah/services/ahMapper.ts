// Al Hasbah — Dataverse field serialization helpers

export function parseJsonArray<T>(raw: string | undefined): T[] {
  if (!raw) return []
  try { return JSON.parse(raw) as T[] } catch { return [] }
}

export function stringifyArray(arr: unknown[]): string {
  return JSON.stringify(arr)
}

export function encodeSubmitter(name: string, email: string): string {
  return `${name}|${email}`
}

export function decodeSubmitter(raw: string | undefined): { submitterName: string; submitterEmail: string } {
  if (!raw) return { submitterName: '', submitterEmail: '' }
  const idx = raw.indexOf('|')
  if (idx === -1) return { submitterName: raw, submitterEmail: '' }
  return { submitterName: raw.slice(0, idx), submitterEmail: raw.slice(idx + 1) }
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
