/* Live loader for the aum_aiinitiatives ("AI Initiatives") Dataverse table.
   Option-set columns come back as numeric codes — resolved to labels via the
   generated const maps so the board classifiers can regex on them. */
import { Aum_aiinitiativesesService } from '../../generated/services/Aum_aiinitiativesesService'
import {
  type Aum_aiinitiativeses,
  Aum_aiinitiativesesaum_entitytype as ENTITY,
  Aum_aiinitiativesesaum_status as STATUS,
  Aum_aiinitiativesesaum_source as SOURCE,
  Aum_aiinitiativesesaum_ftecostsavings as FTEBAND,
  Aum_aiinitiativesesaum_priority as PRIORITY,
  Aum_aiinitiativesesaum_aisolutiontype as SOLUTION,
  Aum_aiinitiativesesaum_benefittype as BENEFIT,
  Aum_aiinitiativesesaum_businessimpactcategory as IMPACT,
  Aum_aiinitiativesesaum_strategicalignment as ALIGNMENT,
  Aum_aiinitiativesesaum_feasibilitydatareadiness as FEASIBILITY,
  Aum_aiinitiativesesaum_timetofirstvalue as TTV,
} from '../../generated/models/Aum_aiinitiativesesModel'

export interface AumRow {
  entitytype: string      // e.g. 'UseCase' | 'AIApplication' | 'DeploymentProject' | 'Demand'
  source: string          // e.g. 'D2D' | 'AIDeployment' | ...
  status: string          // e.g. 'Active' | 'Deployed' | 'Pilot' | 'Planning'
  division: string
  domain: string
  costsaving: number
  annualvolume: number
  progresspct: number
  useradoption: number        // parsed from aum_useradoption (may be text)
  employeesimpacted: number   // parsed from aum_employeesimpactedcount
  timesavingshrsmonth: number // parsed from aum_estimatedtimesavingshoursmonth
  productivitygain: number    // parsed from aum_productivitygain
  costincurred: number
  fteband: string             // aum_ftecostsavings band label
  // categorical labels for v2 charts
  priority: string
  solutiontype: string
  benefittype: string
  businessimpact: string
  alignment: string
  feasibility: string
  timetovalue: string
}

const numOf = (v: unknown): number => {
  if (typeof v === 'number') return v
  if (typeof v === 'string') { const n = Number(v.replace(/[^0-9.\-]/g, '')); return isNaN(n) ? 0 : n }
  return 0
}
const labelOf = (map: Record<number, string>, code: unknown, name?: string): string =>
  (code != null && map[code as number]) || name || ''

const TIMEOUT = Symbol('timeout')

export async function getAumRows(): Promise<{ rows: AumRow[]; info: string }> {
  try {
    const result = await Promise.race([
      Aum_aiinitiativesesService.getAll().then(r => r.data ?? []),
      new Promise<typeof TIMEOUT>(res => setTimeout(() => res(TIMEOUT), 8000)),
    ])
    if (result === TIMEOUT) {
      // The Dataverse call never returned — a local-connection problem, not an
      // empty table. Report it honestly instead of showing "0 rows".
      return { rows: [], info: 'Dataverse connection not reachable (call timed out) — the table has data; this only works inside a live/deployed Power Apps runtime.' }
    }
    const recs = result as Aum_aiinitiativeses[]
    const rows: AumRow[] = recs.map(r => ({
      entitytype: labelOf(ENTITY, r.aum_entitytype, r.aum_entitytypename),
      source: labelOf(SOURCE, r.aum_source, r.aum_sourcename),
      status: labelOf(STATUS, r.aum_status, r.aum_statusname),
      division: r.aum_division ?? '',
      domain: r.aum_domain ?? '',
      costsaving: numOf(r.aum_costsaving),
      annualvolume: numOf(r.aum_annualvolume),
      progresspct: numOf(r.aum_progresspct),
      useradoption: numOf(r.aum_useradoption),
      employeesimpacted: numOf(r.aum_employeesimpactedcount),
      timesavingshrsmonth: numOf(r.aum_estimatedtimesavingshoursmonth),
      productivitygain: numOf(r.aum_productivitygain),
      costincurred: numOf(r.aum_costincurred),
      fteband: labelOf(FTEBAND, r.aum_ftecostsavings, r.aum_ftecostsavingsname),
      priority: labelOf(PRIORITY, r.aum_priority, r.aum_priorityname),
      solutiontype: labelOf(SOLUTION, r.aum_aisolutiontype, r.aum_aisolutiontypename),
      benefittype: labelOf(BENEFIT, r.aum_benefittype, r.aum_benefittypename),
      businessimpact: labelOf(IMPACT, r.aum_businessimpactcategory, r.aum_businessimpactcategoryname),
      alignment: labelOf(ALIGNMENT, r.aum_strategicalignment, r.aum_strategicalignmentname),
      feasibility: labelOf(FEASIBILITY, r.aum_feasibilitydatareadiness, r.aum_feasibilitydatareadinessname),
      timetovalue: labelOf(TTV, r.aum_timetofirstvalue, r.aum_timetofirstvaluename),
    }))
    return { rows, info: `Live: ${rows.length} rows from 'aum_aiinitiativeses'` }
  } catch (e) {
    return { rows: [], info: `aum_aiinitiatives unreachable: ${String(e)}` }
  }
}
