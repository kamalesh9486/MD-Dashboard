import { Rammas_Send_ResponseService } from '../generated/services/Rammas_Send_ResponseService'

// ── Shared utils ─────────────────────────────────────────────
export const oaToDate = (oa: string | number): Date =>
  new Date((Number(oa) - 25569) * 86400000)

export const parseRT = (s: string): number => parseFloat(s) || 0

// ── BRD Types ────────────────────────────────────────────────
export interface BrdApiLog {
  ItemInternalId: string
  api_id: string
  email_id: string
  route_name: string
  input_params: string
  status: 'pass' | 'fail'
  error_message: string
  response_time: string
  time_stamp: string
}

export interface BrdConversationRecord {
  ItemInternalId: string
  id: string
  brd_id: string
  brd_version: string
  user_id: string
  conversation_id: string
  session_id: string
  conversation_name: string
  user_query: string
  final_response: string
  response_time: string
  _ts: string
}

export interface BrdRecord {
  ItemInternalId: string
  brd_id: string
  brd_version: string
  brd_name: string
  user_id: string
  template_id: string
  brd_section_name: string
  is_selected: string
  is_edited: string
  user_section_input: string
  gpt_section_brief_value: string
  gpt_section_html_value: string
  status: 'completed' | 'draft' | 'active'
  generated_date: string
  updated_date: string
  html_value_regenerate_count: string
  content_generation_size: 'low' | 'high'
  path: string
}

export interface BrdTemplateRecord {
  ItemInternalId: string
  template_id: string
  template_name: string
  created_by: string
  template_section_name: string
  template_section_value: string
  created_date: string
  updated_date: string
  is_mandatory: string
}

// ── MyRammas Types ───────────────────────────────────────────
export interface MyRammasBot {
  ItemInternalId: string
  bot_id: string
  bot_name: string
  bot_description: string
  bot_owner: string
  visibility: string
  status: string
  created_at: string
  updated_at: string
  bot_starter: string
  bot_tags: string
}

export interface MyRammasApiLog {
  ItemInternalId: string
  id: string
  session_id: string
  conversation_id: string
  conversation_name: string
  user_id: string
  bot_id: string
  user_query: string
  user_query_category: string
  response_time: string
  _ts: string
}

export interface MyRammasOAIAnalytic {
  ItemInternalId: string
  id: string
  user_id: string
  call_in: string
  call_type: string
  total_number_of_calls: string
  total_input_tokens: string
  total_output_tokens: string
  total_tokens: string
  total_time_taken: string
  _ts: string
}

export interface MyRammasSharedBot {
  ItemInternalId: string
  bot_id: string
  user_id: string
  shared_by: string
  owner_id: string
  shared_at: string
}

// ── KM Types ─────────────────────────────────────────────────
export interface KmDocument {
  ItemInternalId: string
  file_id: string
  name: string
  folder_id: string
  owner_id: string
  file_tag: string
  file_category: string
  upload_to: string
  target_div_id: string
  file_summary: string
  created_at: string
  modified_at: string
  upload_status: string
}

export interface KmUser {
  ItemInternalId: string
  user_id: string
  email_id: string
  username: string
  org_id: string
  div_id: string
  dept_id: string
  job_title: string
  user_role: string
  bot_access: string
  status: string
  daily_request_limit: string
  remaining_requests: string
  created_at: string
  modified_at: string
}

export interface KmConversationAnalytic {
  ItemInternalId: string
  id: string
  session_id: string
  conversation_id: string
  conversation_name: string
  email_id: string
  user_query: string
  user_query_type: string
  user_query_category: string
  response: string
  response_time: string
  ts: string
}

export interface KmOAIAnalytic {
  ItemInternalId: string
  id: string
  email_id: string
  call_in: string
  call_type: string
  total_number_of_calls: string
  total_input_tokens: string
  total_output_tokens: string
  total_tokens: string
  total_time_taken: string
  ts: string
}

export interface KmApiLog {
  ItemInternalId: string
  api_id: string
  email_id: string
  route_name: string
  input_params: string
  api_status: string
  message_error: string
  response_time: string
  time_stamp: string
}

export interface KmFolder {
  ItemInternalId: string
  folder_id: string
  name: string
  parent_id: string
  owner_id: string
  created_at: string
  modified_at: string
}

export interface KmDivision {
  ItemInternalId: string
  id: string
  div_id: string
  div_name: string
  org_id: string
  created_at: string
}

export interface KmDepartment {
  ItemInternalId: string
  id: string
  dept_id: string
  dept_name: string
  div_id: string
  created_at: string
}

// ── Full response shape ───────────────────────────────────────
export interface RammasAtWorkData {
  brd_api_logs: BrdApiLog[]
  brd_openai_analytics: BrdConversationRecord[]
  brd_records: BrdRecord[]
  brd_template_records: BrdTemplateRecord[]
  'myrammas-live-bot': MyRammasBot[]
  'myrammas-draft-bot': MyRammasBot[]
  'myrammas-api-logs': MyRammasApiLog[]
  'myrammas-openai-analytics': MyRammasOAIAnalytic[]
  'myrammas-preview-qna': MyRammasApiLog[]
  'myrammas-shared-bots': MyRammasSharedBot[]
  'km-document-details': KmDocument[]
  'km-users': KmUser[]
  'km-conversation-analytics': KmConversationAnalytic[]
  'km-open-ai-analytics': KmOAIAnalytic[]
  'km-api-logs': KmApiLog[]
  'km-folder-details': KmFolder[]
  'km-division': KmDivision[]
  'km-department': KmDepartment[]
}

export interface ApiResult<T> {
  data: T | null
  error: string | null
}

// ── Cache + in-flight deduplication ──────────────────────────
let _cache: { data: RammasAtWorkData; ts: number } | null = null
let _inflight: Promise<ApiResult<RammasAtWorkData>> | null = null
const CACHE_TTL = 5 * 60 * 1000

function isRammasData(x: unknown): x is RammasAtWorkData {
  return (
    typeof x === 'object' && x !== null &&
    Array.isArray((x as RammasAtWorkData).brd_api_logs) &&
    Array.isArray((x as RammasAtWorkData)['myrammas-live-bot'])
  )
}

// ── Service ───────────────────────────────────────────────────
export class RammasAtWorkService {
  static fetch(): Promise<ApiResult<RammasAtWorkData>> {
    if (_cache && Date.now() - _cache.ts < CACHE_TTL) return Promise.resolve({ data: _cache.data, error: null })
    if (_inflight) return _inflight   // concurrent callers share the same request

    _inflight = Rammas_Send_ResponseService.Run({})
      .then(result => {
        const outputField = result.data?.output
        const json: unknown = outputField != null
          ? (typeof outputField === 'string' ? JSON.parse(outputField) : outputField)
          : result.data as unknown

        console.info('[RammasAtWork] raw result', { hasOutput: outputField != null, type: typeof outputField })

        if (!isRammasData(json)) throw new Error('Unexpected response shape')
        _cache = { data: json, ts: Date.now() }
        console.info('[RammasAtWork] flow invoked successfully')
        return { data: json, error: null } as ApiResult<RammasAtWorkData>
      })
      .catch(err => {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('[RammasAtWork] flow invocation failed', { message })
        return { data: null, error: message } as ApiResult<RammasAtWorkData>
      })
      .finally(() => { _inflight = null })

    return _inflight
  }
}
