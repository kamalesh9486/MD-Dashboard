import { Ai_alhasbaincidentsesService } from '../../../generated/services/Ai_alhasbaincidentsesService'
import type { Ai_alhasbaincidentses } from '../../../generated/models/Ai_alhasbaincidentsesModel'
import type {
  AHIncident, AHDivision, AHSeverity, AHIncidentStatus, AHIncidentType,
  AHIncidentComment, AHIncidentResolution,
} from '../data'
import { encodeSubmitter, decodeSubmitter } from './ahMapper'

function tryParse<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T } catch { return fallback }
}

function toIncident(r: Ai_alhasbaincidentses): AHIncident {
  const { submitterName, submitterEmail } = decodeSubmitter(r.ai_submitter)
  return {
    id:                      r.ai_id ?? r.ai_alhasbaincidentsid,
    _dvId:                   r.ai_alhasbaincidentsid,
    agentId:                 r.ai_agent_id ?? '',
    useCaseId:               r.ai_use_case_id,
    title:                   r.ai_title,
    type:                    (r.ai_type ?? 'ai_agent') as AHIncidentType,
    severity:                (r.ai_severity ?? 'medium') as AHSeverity,
    status:                  (r.ai_status ?? 'open') as AHIncidentStatus,
    division:                (r.ai_division ?? 'HR') as AHDivision,
    reportedDate:            r.ai_reported_date ?? new Date().toISOString().slice(0, 10),
    resolvedDate:            r.ai_resolved_date,
    changeManagementTriggered: r.ai_change_management_triggered ?? false,
    description:             r.ai_description ?? '',
    resolution:              tryParse<AHIncidentResolution | undefined>(r.ai_resolution, undefined),
    comments:                tryParse<AHIncidentComment[]>(r.ai_comments, []),
    submitterName,
    submitterEmail,
  }
}

export async function fetchIncidents(): Promise<AHIncident[]> {
  const res = await Ai_alhasbaincidentsesService.getAll({ filter: 'statecode eq 0' })
  return (res.data ?? []).map(toIncident)
}

export async function createIncident(inc: Omit<AHIncident, 'id' | '_dvId'>): Promise<void> {
  await Ai_alhasbaincidentsesService.create({
    ai_title:                       inc.title,
    ai_agent_id:                    inc.agentId,
    ai_use_case_id:                 inc.useCaseId,
    ai_type:                        inc.type,
    ai_severity:                    inc.severity,
    ai_status:                      inc.status,
    ai_division:                    inc.division,
    ai_reported_date:               inc.reportedDate,
    ai_change_management_triggered: inc.changeManagementTriggered,
    ai_description:                 inc.description,
    ai_submitter:                   encodeSubmitter(inc.submitterName, inc.submitterEmail),
    ai_comments:                    JSON.stringify(inc.comments ?? []),
  } as Parameters<typeof Ai_alhasbaincidentsesService.create>[0])
}

export async function updateIncidentDv(dvId: string, patch: Partial<AHIncident>): Promise<void> {
  const fields: Record<string, unknown> = {}
  if (patch.status                    !== undefined) fields.ai_status                      = patch.status
  if (patch.resolution                !== undefined) fields.ai_resolution                  = JSON.stringify(patch.resolution)
  if (patch.resolvedDate              !== undefined) fields.ai_resolved_date               = patch.resolvedDate
  if (patch.comments                  !== undefined) fields.ai_comments                    = JSON.stringify(patch.comments)
  if (patch.changeManagementTriggered !== undefined) fields.ai_change_management_triggered = patch.changeManagementTriggered
  await Ai_alhasbaincidentsesService.update(dvId, fields as Parameters<typeof Ai_alhasbaincidentsesService.update>[1])
}

export async function addCommentDv(
  dvId: string,
  currentComments: AHIncidentComment[],
  comment: Omit<AHIncidentComment, 'id'>,
): Promise<AHIncidentComment[]> {
  const newComment: AHIncidentComment = { ...comment, id: `c-${Date.now()}` }
  const updated = [...currentComments, newComment]
  await Ai_alhasbaincidentsesService.update(dvId, { ai_comments: JSON.stringify(updated) } as Parameters<typeof Ai_alhasbaincidentsesService.update>[1])
  return updated
}
