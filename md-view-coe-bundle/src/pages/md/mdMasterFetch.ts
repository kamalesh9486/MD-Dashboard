// Self-contained MD master loader — live from the Dataverse `md_master` table.
// No embedded seed / no fallback. Uses the generic Dataverse connector
// (MicrosoftDataverseService.ListRecords), resolves the real EntitySetName at
// runtime from metadata, times out gracefully, and returns rows + an on-screen
// diagnostic string. Its only dependency is the generated MicrosoftDataverseService.
import { MicrosoftDataverseService } from '../../generated/services/MicrosoftDataverseService'

const str = (v: unknown) => (v == null ? '' : String(v)).trim()
const num = (v: unknown) => { const n = parseFloat(String(v ?? '').replace(/[%,]/g, '')); return isNaN(n) ? 0 : n }
const pct01 = (v: unknown) => { const t = str(v).replace('%', ''); const f = parseFloat(t); return isNaN(f) ? 0 : (f > 1 ? f / 100 : f) }
const dc = (v: unknown) => { const s = str(v); return (s === '' || s === '0' || s === '0.0' || s === '-') ? 'Unspecified' : s }

async function listRows(entitySet: string): Promise<Record<string, unknown>[]> {
  try {
    const res = await MicrosoftDataverseService.ListRecords(entitySet)
    const items = res?.data?.value ?? []
    return items.map(it => ((it?.dynamicProperties ?? it) as Record<string, unknown>))
  } catch { return [] }
}

/** Resolve `p`, but never wait longer than `ms` — falls back to `fallback`.
 *  Guards against the Dataverse SDK hanging when there is no Power Apps runtime context. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise<T>(resolve => {
    let done = false
    const finish = (v: T) => { if (!done) { done = true; resolve(v) } }
    const t = setTimeout(() => finish(fallback), ms)
    p.then(v => { clearTimeout(t); finish(v) }, () => { clearTimeout(t); finish(fallback) })
  })
}

/** First present (non-null) value among candidate logical names on a raw row. */
const pick = (r: Record<string, unknown>, keys: string[]): unknown => {
  for (const k of keys) if (r[k] != null && r[k] !== '') return r[k]
  return undefined
}

/** Resolve the real EntitySetName for a table from its logical name via metadata. */
async function resolveEntitySet(logicalName: string): Promise<string | null> {
  try {
    const res = await MicrosoftDataverseService.GetMetadataForGetEntity(logicalName)
    const es = (res?.data as { EntitySetName?: string } | undefined)?.EntitySetName
    return es || null
  } catch { return null }
}

export interface MdMasterRow {
  source: string; entitytype: string; division: string; domain: string
  status: string; stage: string; stagelevel: string; title: string
  costsaving: number; ftesavings: number; fteavoidance: number
  annualvolume: number; totalprocess: number; agenticprocess: number
  usersatisfaction: number; othercostsaving: number
  progresspct: number; aitransformpct: number; golive: string
}
export interface MdMasterResult { rows: MdMasterRow[]; info: string }

let _loggedKeys = false
/** Live md_master loader. Returns rows + a diagnostic. Empty (with a reason) when unreachable. */
export async function fetchMdMasterFull(): Promise<MdMasterResult> {
  const notes: string[] = []
  const resolved = await withTimeout(resolveEntitySet('md_master'), 7000, null)
  notes.push(resolved ? `metadata → '${resolved}'` : 'metadata lookup unavailable')
  const candidates = [...new Set([resolved, 'md_masters', 'md_master'].filter(Boolean) as string[])]
  let raw: Record<string, unknown>[] = []
  let used = ''
  for (const es of candidates) {
    const r = await withTimeout(listRows(es), 7000, [] as Record<string, unknown>[])
    notes.push(`${es}: ${r.length}`)
    if (r.length) { raw = r; used = es; break }
  }
  if (!_loggedKeys && raw.length) {
    _loggedKeys = true
    console.log('[MD] md_master raw columns →', Object.keys(raw[0]))
  }
  console.log('[MD] md_master rows →', raw.length, '| entitySet:', used || '(none)')
  const info = raw.length
    ? `Live: ${raw.length} rows from '${used}'`
    : `No live rows reachable — ${notes.join(' · ')}. Open via the Power Apps Local Play URL (Dataverse only works there).`
  const rows = raw.map(r => ({
    source: str(r.md_source_1) || '—',
    entitytype: str(r.md_entitytype_1),
    division: dc(r.md_division_1),
    domain: str(r.md_domain_1),
    status: str(r.md_status_1) || '—',
    stage: str(r.md_stage_1),
    stagelevel: str(r.md_stagelevel_1),
    title: str(r.md_title_1) || '(untitled)',
    costsaving: num(r.md_costsaving_1),
    ftesavings: num(r.md_ftesavings_1),
    fteavoidance: num(pick(r, ['md_fteavoidance_1', 'md_fte_avoidance_1'])),
    annualvolume: num(pick(r, ['md_annualvolume_1', 'md_annual_volume_1'])),
    totalprocess: num(pick(r, ['md_totalprocess_1', 'md_total_process_1'])),
    agenticprocess: num(pick(r, ['md_agenticprocess_1', 'md_agentic_process_1'])),
    usersatisfaction: num(pick(r, ['md_usersatisfaction_1', 'md_user_satisfaction_1', 'user_satisfaction'])),
    othercostsaving: num(pick(r, ['md_othercostsaving_1', 'md_other_cost_saving_1'])),
    progresspct: pct01(r.md_progresspct_1),
    aitransformpct: pct01(r.md_aitransformpct_1),
    golive: str(pick(r, ['md_actualgolive_1', 'md_actual_go_live_1', 'md_targetdate_1', 'md_startdate_1'])),
  }))
  return { rows, info }
}
