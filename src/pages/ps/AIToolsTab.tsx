import { useState, useEffect, useMemo } from 'react'
import { Ai_coe_toolsesService } from '../../generated'
import type { Ai_coe_toolses } from '../../generated/models/Ai_coe_toolsesModel'
import { type TechEntry, type TechCategory } from './data'
import { useCopilotData } from '../../context/CopilotDataContext'
import Icon from '../../components/Icon'
import CopilotKitPanel from '../CopilotKit'
import RammasAtWorkPanel from './RammasAtWorkPanel'
import CopilotAdoptionPanel from './CopilotAdoptionPanel'
import TechStackView from './TechStackView'
import TechStackDetailPanel from './TechStackDetailPanel'

type ViewMode = 'category' | 'table' | 'map'

const VIEW_OPTIONS: [ViewMode, string, string][] = [
  ['category', 'bi-grid-3x3-gap', 'Category'],
  ['table',    'bi-table',         'Table'],
  ['map',      'bi-kanban',        'Treemap'],
]

// ── Category color — deterministic hash from category string ──────
const CAT_PALETTE = ['#17944a','#2b63c8','#1a9a94','#d98c0a','#c8352c','#6a3fb3','#c43e7d','#dd6b20']

function catColor(str: string): string {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffffffff
  return CAT_PALETTE[Math.abs(h) % CAT_PALETTE.length]
}

// ── Icon mapper — name-first, generic fallback ────────────────────
function mapIcon(name: string): string {
  const n = name.toLowerCase()
  if (/microsoft|m365|office|teams/.test(n))                 return 'bi-microsoft'
  if (/copilot/.test(n))                                      return 'bi-microsoft'
  if (/azure/.test(n))                                        return 'bi-cloud-fill'
  if (/openai|gpt|chatgpt/.test(n))                           return 'bi-chat-dots-fill'
  if (/github/.test(n))                                       return 'bi-code-slash'
  if (/power.?bi|tableau|looker|qlik/.test(n))                return 'bi-bar-chart-fill'
  if (/power.?automate|automate|logic.?app|workflow/.test(n)) return 'bi-lightning-charge-fill'
  if (/sap|oracle(?!.*hcm)|dynamics/.test(n))                 return 'bi-diagram-3-fill'
  if (/servicenow|itsm/.test(n))                              return 'bi-collection'
  if (/sentinel|defender|siem|soc|crowdstrike|cortex/.test(n)) return 'bi-shield-check'
  if (/databricks|synapse|fabric|lakehouse|snowflake/.test(n)) return 'bi-collection'
  if (/kubernetes|k8s|docker|container|openshift/.test(n))    return 'bi-cpu-fill'
  if (/grafana|datadog|monitor|prometheus/.test(n))           return 'bi-speedometer2'
  if (/terraform|devops|pipeline|jenkins|hashicorp/.test(n))  return 'bi-gear'
  if (/rammas|bot|assistant|genie/.test(n))                   return 'bi-robot'
  if (/google|gemini/.test(n))                                return 'bi-google'
  if (/aws|amazon/.test(n))                                   return 'bi-cloud-fill'
  if (/kafka|confluent|stream/.test(n))                       return 'bi-lightning-charge-fill'
  if (/elastic|search|kibana/.test(n))                        return 'bi-collection'
  if (/aveva|pi system|scada|historian/.test(n))              return 'bi-speedometer2'
  if (/siemens|mindsphere|ecostruxure|schneider/.test(n))     return 'bi-cpu-fill'
  if (/honeywell|forge/.test(n))                              return 'bi-gear'
  if (/vmware|vcenter/.test(n))                               return 'bi-cpu'
  if (/hcm|payroll|workforce/.test(n))                        return 'bi-people-fill'
  if (/salesforce|crm/.test(n))                               return 'bi-people-fill'
  if (/arcgis|gis|esri/.test(n))                              return 'bi-geo-alt'
  if (/field.?service|fsm|dispatch/.test(n))                  return 'bi-people-fill'
  if (/erp|s\/4|hana|fusion/.test(n))                         return 'bi-diagram-3-fill'
  if (/genai|llm|gen.?ai/.test(n))                            return 'bi-braces-asterisk'
  if (/vision|cctv|drone|camera/.test(n))                     return 'bi-camera-video-fill'
  if (/voice|speech|nlp|audio/.test(n))                       return 'bi-mic-fill'
  return 'bi-tools'
}

// ── Dataverse record → TechEntry ──────────────────────────────────
function mapTool(r: Ai_coe_toolses): TechEntry {
  const name  = r.ai_coe_toolname
  const lname = name.toLowerCase()
  const cat   = (r.ai_coe_tool_category ?? 'Other').trim()

  // Detect Copilot Adoption Dashboard first (more specific than the broad copilot check)
  const isCopilotAdoption = /copilot.*(adoption|dashboard)/i.test(lname)
  // Scope Copilot detection to Microsoft only — avoids matching "GitHub Copilot" etc.
  const isCopilot = !isCopilotAdoption && /microsoft.*(copilot|studio)/.test(lname)
  const isRammas  = /rammas/.test(lname)

  const color = isCopilotAdoption ? '#0078d4'
              : isCopilot         ? '#0078d4'
              : isRammas          ? '#00695c'
              : catColor(cat)

  const tags = isCopilotAdoption ? ['GenAI', 'Adoption']
             : isCopilot         ? ['GenAI', 'Productivity']
             : isRammas          ? ['GenAI', 'Internal AI']
             : []

  const panelType: TechEntry['panelType'] = isCopilotAdoption ? 'copilot-adoption'
                                          : isCopilot         ? 'copilot'
                                          : isRammas          ? 'rammas'
                                          : undefined

  return {
    id:           r.ai_coe_toolsid,
    cat,
    name,
    vendor:       r.ai_coe_interatedenv    ?? '—',
    icon:         mapIcon(name),
    color,
    desc:         r.ai_coe_tooldescription ?? '',
    users:        '—',
    spend:        '—',
    uptime:       '—',
    projects:     0,
    integrations: 0,
    owner:        r.owneridname ?? '—',
    contract:     '—',
    sla:          '—',
    license:      '—',
    spoc:         r.owneridname ?? '—',
    tags,
    ...(panelType ? { panelType } : {}),
  }
}

// ── Component ─────────────────────────────────────────────────────
export default function AIToolsTab() {
  const [view,        setView]        = useState<ViewMode>('category')
  const [activeCat,   setActiveCat]   = useState('')
  const [panelTech,   setPanelTech]   = useState<TechEntry | null>(null)
  const [copilotOpen,   setCopilotOpen]   = useState(false)
  const [rammasOpen,    setRammasOpen]    = useState(false)
  const [adoptionOpen,  setAdoptionOpen]  = useState(false)
  const [tools,       setTools]       = useState<TechEntry[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const { agentDetails: agents, loading: agentLoading } = useCopilotData()
  const liveAgentCount = agentLoading ? null : agents.length

  useEffect(() => {
    let active = true
    setLoading(true)
    Ai_coe_toolsesService.getAll()
      .then(res => {
        if (!active) return
        const live = (res.data ?? []).map(mapTool)
        // Live-dashboard tools (Copilot, Rammas) always first
        live.sort((a, b) => (b.panelType ? 1 : 0) - (a.panelType ? 1 : 0))
        setTools(live)
        setLoading(false)
      })
      .catch((err: unknown) => {
        if (!active) return
        setError((err instanceof Error ? err.message : String(err)) || 'Failed to load tools')
        setTools([])
        setLoading(false)
      })
    return () => { active = false }
  }, [])

  // Derive categories dynamically from live data
  const cats = useMemo((): TechCategory[] => {
    const seen = new Set<string>()
    const result: TechCategory[] = []
    for (const t of tools) {
      if (t.cat && !seen.has(t.cat)) {
        seen.add(t.cat)
        result.push({ id: t.cat, name: t.cat, desc: '', color: catColor(t.cat) })
      }
    }
    return result
  }, [tools])

  const kpi = useMemo(() => ({
    total: tools.length,
  }), [tools])

  const filtered = useMemo(
    () => activeCat ? tools.filter(t => t.cat === activeCat) : tools,
    [tools, activeCat]
  )

  // All hooks above — conditional returns below are safe
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: '#9ca3af', fontSize: 14, fontWeight: 600 }}>
      <Icon name="bi-arrow-repeat" />Loading technologies…
    </div>
  )

  if (error) return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 20px', color: '#dc2626', fontSize: 13, fontWeight: 600 }}>
      <Icon name="bi-exclamation-triangle-fill" style={{ marginRight: 8 }} />{error}
    </div>
  )

  if (adoptionOpen) return <CopilotAdoptionPanel onBack={() => setAdoptionOpen(false)} />
  if (copilotOpen)  return <CopilotKitPanel      onBack={() => setCopilotOpen(false)} />
  if (rammasOpen)   return <RammasAtWorkPanel     onBack={() => setRammasOpen(false)} />

  function handleCardClick(t: TechEntry) {
    if (t.panelType === 'copilot-adoption') { setAdoptionOpen(true); return }
    if (t.panelType === 'copilot')          { setCopilotOpen(true);  return }
    if (t.panelType === 'rammas')           { setRammasOpen(true);   return }
    setPanelTech(t)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', background: '#fff', border: '1px solid rgba(0,117,96,0.13)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 16 }}>
        {([
          { label: 'Technologies',   value: kpi.total, unit: '',  delta: '▲ YoY',    up: true },
          { label: 'Annual run rate',value: 'AED 142', unit: 'M', delta: '▲ 8.4%',   up: true },
          { label: 'Avg uptime',     value: '99.82',   unit: '%', delta: '▲ 0.06 pt',up: true },
        ] as const).map((k, i) => (
          <div key={k.label} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid rgba(0,117,96,0.1)' : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9ca3af', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: '#1c1c1e' }}>
              {k.value}<span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af', marginLeft: 2 }}>{k.unit}</span>
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 600, padding: '1px 7px', borderRadius: 5, background: '#ecf7f0', color: '#17944a', display: 'inline-flex', marginTop: 4 }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Filter row + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid rgba(0,117,96,0.1)' }}>

        <button onClick={() => setActiveCat('')} style={{ fontSize: 12.5, padding: '6px 11px', borderRadius: 999, border: `1px solid ${activeCat === '' ? '#1c1c1e' : 'rgba(0,117,96,0.18)'}`, background: activeCat === '' ? '#1c1c1e' : '#fff', color: activeCat === '' ? '#fff' : '#374151', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          All <span style={{ fontSize: 11, color: activeCat === '' ? 'rgba(255,255,255,0.6)' : '#9ca3af', fontWeight: 600 }}>{tools.length}</span>
        </button>

        {cats.map(c => {
          const count = tools.filter(t => t.cat === c.id).length
          const on    = activeCat === c.id
          return (
            <button key={c.id} onClick={() => setActiveCat(on ? '' : c.id)} style={{ fontSize: 12.5, padding: '6px 11px', borderRadius: 999, border: `1px solid ${on ? '#1c1c1e' : 'rgba(0,117,96,0.18)'}`, background: on ? '#1c1c1e' : '#fff', color: on ? '#fff' : '#374151', fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: c.color, flexShrink: 0, display: 'inline-block' }} />
              {c.name}
              <span style={{ fontSize: 11, color: on ? 'rgba(255,255,255,0.6)' : '#9ca3af', fontWeight: 600 }}>{count}</span>
            </button>
          )
        })}

        <div style={{ marginLeft: 'auto', display: 'inline-flex', border: '1px solid rgba(0,117,96,0.18)', background: '#fff', borderRadius: 10, padding: 3 }}>
          {VIEW_OPTIONS.map(([v, icon, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ border: 0, padding: '6px 12px', fontSize: 12.5, fontWeight: 600, borderRadius: 7, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, background: view === v ? '#1c1c1e' : 'transparent', color: view === v ? '#fff' : '#6b7280', transition: 'background .15s, color .15s' }}>
              <Icon name={icon} style={{ fontSize: 13 }} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <TechStackView items={filtered} cats={cats} view={view} onSelect={handleCardClick} liveCount={liveAgentCount} />

      {/* Slide-over detail panel */}
      <TechStackDetailPanel tech={panelTech} cats={cats} onClose={() => setPanelTech(null)} />
    </div>
  )
}
