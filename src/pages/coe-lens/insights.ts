import {
  AH_AGENTS, AH_KPIS, AH_INCIDENTS, AH_USE_CASES, AH_PROGRAMME,
} from '../alhasbah/data'

export type InsightSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'
export type InsightCategory = 'gap' | 'risk' | 'action' | 'opportunity' | 'summary'
export type InsightModule =
  | 'al-hasbah' | 'people' | 'programs' | 'incidents'
  | 'discovery' | 'technology' | 'executive' | 'division'

export interface Insight {
  id: string
  category: InsightCategory
  module: InsightModule
  severity: InsightSeverity
  title: string
  description: string
  affectedItems: string[]
  recommendedActions: string[]
}

export interface ModuleBriefing {
  narrative: string
  win: string | null
  watchlist: string | null
  critical: string | null
}

const SEV_ORDER: Record<InsightSeverity, number> = {
  critical: 0, high: 1, medium: 2, low: 3, info: 4,
}

export function computeInsights(): Insight[] {
  const out: Insight[] = []

  const critOpen  = AH_INCIDENTS.filter(i => i.severity === 'critical' && i.status !== 'resolved')
  const highOpen  = AH_INCIDENTS.filter(i => i.severity === 'high'     && i.status !== 'resolved')
  const offTrack  = AH_KPIS.filter(k => k.status === 'off_track')
  const atRisk    = AH_KPIS.filter(k => k.status === 'at_risk')
  const lowAdopt  = AH_AGENTS.filter(a => a.status !== 'planned' && a.aiAdoptionPct < 30)
  const topAgents = AH_AGENTS.filter(a => a.status === 'live' && a.aiAdoptionPct >= 80)

  if (critOpen.length) {
    out.push({
      id: 'risk-crit-incidents', category: 'risk', module: 'al-hasbah', severity: 'critical',
      title: `${critOpen.length} Critical Incident${critOpen.length > 1 ? 's' : ''} Require Immediate Action`,
      description: `Active critical incidents are breaching same-day SLA and impacting live agent operations across ${[...new Set(critOpen.map(i => i.division))].join(' and ')} divisions.`,
      affectedItems: critOpen.map(i => `[${i.division}] ${i.title}`),
      recommendedActions: [
        'Convene an emergency response call with AI Engineering and affected division heads.',
        'Activate manual fallback procedures until root cause is resolved.',
        'Trigger change management communication to affected end-users within 2 hours.',
      ],
    })
  }

  if (offTrack.length) {
    out.push({
      id: 'gap-off-track-kpis', category: 'gap', module: 'al-hasbah', severity: 'high',
      title: `${offTrack.length} KPIs Are Off-Track and Missing Targets`,
      description: 'These KPIs have consistently missed targets for multiple periods and are marked not-achievable without structural remediation.',
      affectedItems: offTrack.map(k => `[${k.division}] ${k.kpiName}: ${k.currentValue}${k.unit} vs ${k.targetValue}${k.unit} target`),
      recommendedActions: [
        'Schedule a KPI remediation workshop with the KPI owners and AI Engineering leads.',
        'Review and revise targets where root cause is external (e.g. API vendor changes).',
        'Add dedicated sprint capacity to address model or integration gaps.',
      ],
    })
  }

  if (highOpen.length) {
    out.push({
      id: 'risk-high-incidents', category: 'risk', module: 'incidents', severity: 'high',
      title: `${highOpen.length} High-Severity Incidents Are Open or In-Progress`,
      description: `High-severity incidents across Finance and Billing have exceeded 2-day SLA. ${highOpen.filter(i => i.changeManagementTriggered).length} have triggered change management workflows.`,
      affectedItems: highOpen.map(i => `[${i.division}] ${i.title} — ${i.status.replace('_', ' ')}`),
      recommendedActions: [
        'Assign dedicated resolution owners to each open high-severity incident.',
        'Escalate to division heads if resolution exceeds 48-hour SLA.',
        'Review recurring incident patterns for systemic root causes.',
      ],
    })
  }

  const atRiskByDiv = atRisk.reduce<Record<string, string[]>>((acc, k) => {
    ;(acc[k.division] = acc[k.division] ?? []).push(k.kpiName)
    return acc
  }, {})
  Object.entries(atRiskByDiv).forEach(([div, names], i) => {
    out.push({
      id: `risk-at-risk-kpis-${i}`, category: 'risk', module: 'al-hasbah', severity: 'medium',
      title: `${names.length} At-Risk KPI${names.length > 1 ? 's' : ''} in ${div} Division`,
      description: `${div} division KPIs are improving but remain in the at-risk zone. Without intervention, they risk sliding to off-track next quarter.`,
      affectedItems: names.map(n => `${div}: ${n}`),
      recommendedActions: [
        `Review ${div} agent performance logs for bottlenecks causing metric lag.`,
        'Set fortnightly monitoring cadence with KPI owners.',
        'Consider model retuning or process adjustment if trend stalls.',
      ],
    })
  })

  if (lowAdopt.length) {
    out.push({
      id: 'gap-low-adoption-agents', category: 'gap', module: 'al-hasbah', severity: 'medium',
      title: `${lowAdopt.length} Agent${lowAdopt.length > 1 ? 's' : ''} Have Sub-30% AI Adoption`,
      description: 'These agents are deployed or in pipeline but usage remains critically low. Without targeted change management, realised value will fall short of targets.',
      affectedItems: lowAdopt.map(a => `[${a.division}] ${a.name}: ${a.aiAdoptionPct}% adoption`),
      recommendedActions: [
        'Conduct user research sessions with target end-user groups to identify friction.',
        'Assign change management lead to each low-adoption agent within 2 weeks.',
        'Implement usage incentives or mandatory workflow integration to drive adoption.',
      ],
    })
  }

  const costPct = Math.round((AH_PROGRAMME.realisedCostSaving / AH_PROGRAMME.targetCostSaving) * 100)
  const ftePct  = Math.round((AH_PROGRAMME.realisedFTE / AH_PROGRAMME.targetFTE) * 100)
  out.push({
    id: 'gap-programme-realisation', category: 'gap', module: 'executive', severity: 'medium',
    title: `Programme Value Realisation at ${costPct}% — Behind Target`,
    description: `Al Hasbah has realised AED ${(AH_PROGRAMME.realisedCostSaving / 1e6).toFixed(1)}M of AED ${(AH_PROGRAMME.targetCostSaving / 1e6).toFixed(1)}M target savings (${costPct}%) and ${ftePct}% of FTE savings target.`,
    affectedItems: [
      `Cost Saving: AED ${(AH_PROGRAMME.realisedCostSaving / 1e6).toFixed(1)}M realised of AED ${(AH_PROGRAMME.targetCostSaving / 1e6).toFixed(1)}M target`,
      `FTE Savings: ${AH_PROGRAMME.realisedFTE.toLocaleString()} hrs of ${AH_PROGRAMME.targetFTE.toLocaleString()} hrs target`,
      `Live Agents: ${AH_PROGRAMME.liveAgents} of ${AH_PROGRAMME.totalAgents} agents live`,
    ],
    recommendedActions: [
      'Accelerate go-live of pipeline agents in Finance and Billing to unlock planned savings.',
      'Revisit FTE savings targets with division heads to confirm measurement methodology.',
      'Commission quarterly business value review with Finance and COE leadership.',
    ],
  })

  const today = new Date('2026-06-16')
  const atRiskGoLive = AH_USE_CASES.filter(uc => {
    if (uc.status !== 'pipeline') return false
    const daysAway = (new Date(uc.plannedGoLive).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    const pct = uc.milestones.filter(m => m.status === 'completed').length / uc.milestones.length
    return daysAway <= 90 && pct < 0.6
  })
  if (atRiskGoLive.length) {
    out.push({
      id: 'risk-go-live-milestones', category: 'action', module: 'al-hasbah', severity: 'medium',
      title: `${atRiskGoLive.length} Use Cases Risk Missing Go-Live Due to Incomplete Milestones`,
      description: 'Pipeline use cases with planned go-live within 90 days have under 60% milestone completion — schedule slippage risk.',
      affectedItems: atRiskGoLive.map(uc => {
        const done = uc.milestones.filter(m => m.status === 'completed').length
        return `[${uc.division}] ${uc.name}: ${done}/${uc.milestones.length} milestones done (go-live ${uc.plannedGoLive})`
      }),
      recommendedActions: [
        'Review resource allocation for each at-risk use case with the delivery lead.',
        'Escalate to division PMO if milestone slippage exceeds 2 weeks.',
        'Consider phased go-live to capture partial value while full delivery completes.',
      ],
    })
  }

  out.push({
    id: 'gap-rejection-rate', category: 'gap', module: 'al-hasbah', severity: 'medium',
    title: `56% Document Processing Rejection Rate — AI Accuracy Gap`,
    description: `Out of 6,379 records processed, 3,588 were rejected. 70% of rejections are AI-attributable (mismatches, incorrect extraction). Model accuracy gaps identified across 3 document types.`,
    affectedItems: [
      'Completely Different Match: 1,000 cases (AI issue)',
      'Date Mismatch: 954 cases (AI issue)',
      'Name Mismatch: 553 cases (AI issue)',
      'HR Fields Undefined: 995 cases (user awareness gap)',
    ],
    recommendedActions: [
      'Commission model fine-tuning sprint focused on document match accuracy.',
      'Run awareness sessions for HR users on required field definitions.',
      'Add pre-submission validation to reduce user-error rejections.',
    ],
  })

  if (topAgents.length) {
    out.push({
      id: 'opp-top-agents', category: 'opportunity', module: 'al-hasbah', severity: 'low',
      title: `${topAgents.length} Agents Above 80% Adoption — Ready for Scale`,
      description: 'High-performing agents in HR and Billing are exceeding adoption targets. These are proven models that could be replicated across additional divisions or use cases.',
      affectedItems: topAgents.map(a => `[${a.division}] ${a.name}: ${a.aiAdoptionPct}% adoption`),
      recommendedActions: [
        'Document success patterns and change management approaches from high-adoption agents.',
        'Identify 2–3 new divisions where the same agent pattern can be replicated.',
        'Present results in next COE leadership review as proof-of-value for programme expansion.',
      ],
    })
  }

  const openCount  = AH_INCIDENTS.filter(i => i.status !== 'resolved').length
  const liveCount  = AH_AGENTS.filter(a => a.status === 'live').length
  const onTrackCnt = AH_KPIS.filter(k => k.status === 'on_track').length
  out.push({
    id: 'summary-programme', category: 'summary', module: 'executive', severity: 'info',
    title: 'CoE Platform Health — Cross-Module Snapshot',
    description: `${liveCount} AI agents live · ${onTrackCnt}/${AH_KPIS.length} KPIs on track · ${openCount} open incidents · Programme adoption at ${AH_PROGRAMME.adoptionPct}%. The platform is generating measurable value with clear acceleration opportunities in Finance and Billing.`,
    affectedItems: [
      `Live Agents: ${liveCount} / ${AH_AGENTS.length} total`,
      `KPIs On-Track: ${onTrackCnt} / ${AH_KPIS.length}`,
      `Open Incidents: ${openCount} (${critOpen.length} critical)`,
      `Programme Adoption: ${AH_PROGRAMME.adoptionPct}%`,
    ],
    recommendedActions: [
      'Focus Q3 effort on closing the 2 critical incidents and recovering at-risk KPIs.',
      'Accelerate 3 pipeline agents in Finance to unlock AED 1.2M in unmet savings.',
      'Present cross-module summary to COE Steering Committee at next quarterly review.',
    ],
  })

  return out.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity])
}

export function getBriefingForModule(module: InsightModule): ModuleBriefing {
  const onTrack    = AH_KPIS.filter(k => k.status === 'on_track')
  const atRisk     = AH_KPIS.filter(k => k.status === 'at_risk')
  const offTrack   = AH_KPIS.filter(k => k.status === 'off_track')
  const critOpen   = AH_INCIDENTS.filter(i => i.severity === 'critical' && i.status !== 'resolved')
  const highOpen   = AH_INCIDENTS.filter(i => i.severity === 'high'     && i.status !== 'resolved')
  const liveAgents = AH_AGENTS.filter(a => a.status === 'live').length
  const topAgents  = AH_AGENTS.filter(a => a.status === 'live' && a.aiAdoptionPct >= 80)
  const openTotal  = AH_INCIDENTS.filter(i => i.status !== 'resolved').length
  const costPct    = Math.round((AH_PROGRAMME.realisedCostSaving / AH_PROGRAMME.targetCostSaving) * 100)
  const critText   = critOpen.length > 0 ? `${critOpen.length} critical incident${critOpen.length > 1 ? 's' : ''} breaching same-day SLA` : null

  const map: Record<InsightModule, ModuleBriefing> = {
    executive: {
      narrative: `${liveAgents} AI agents live · ${onTrack.length}/${AH_KPIS.length} KPIs on track · ${openTotal} active incidents. Adoption at ${AH_PROGRAMME.adoptionPct}% — value realisation at ${costPct}% of AED ${(AH_PROGRAMME.targetCostSaving / 1e6).toFixed(1)}M target.`,
      win:       `Smart Meter Validation exceeding 99.5% accuracy — Billing division leading programme performance`,
      watchlist: `Invoice Data Extraction at 88% vs 95% target — Arabic OCR model gap unresolved for 3 months`,
      critical:  critText,
    },
    'al-hasbah': {
      narrative: `${liveAgents} of ${AH_AGENTS.length} agents live across HR, Finance and Billing. ${onTrack.length}/${AH_KPIS.length} KPIs on track · ${offTrack.length} off-track · ${atRisk.length} at risk · ${critOpen.length} critical incident${critOpen.length !== 1 ? 's' : ''}.`,
      win:       `${topAgents.length} agent${topAgents.length !== 1 ? 's' : ''} above 80% adoption — top performers: ${topAgents.slice(0, 2).map(a => a.name.split(' ')[0]).join(' & ')}`,
      watchlist: `${atRisk.length} KPIs at risk across Finance and Billing — intervention recommended before Q3`,
      critical:  critOpen.length > 0 ? `${critOpen[0].title} — critical severity, SLA breached` : null,
    },
    incidents: {
      narrative: `${openTotal} open incidents: ${critOpen.length} critical, ${highOpen.length} high. ${AH_INCIDENTS.filter(i => i.changeManagementTriggered && i.status !== 'resolved').length} change management workflow${openTotal !== 1 ? 's' : ''} active. 2 incidents resolved this period.`,
      win:       `Document Upload Limit and Duplicate Payment Warning resolved — clean closure with preventive measures`,
      watchlist: `Emirates ID API timeout affecting ~12% of peak-hour requests — customer impact ongoing`,
      critical:  critOpen.length > 0 ? `Incorrect Salary Calculation (HR) — critical, Grade 5–7 night shift employees affected` : null,
    },
    division: {
      narrative: `AI adoption averages 64% across 8 DEWA divisions. 2 divisions below the 60% programme threshold. ADKAR Ability dimension below 65 in 3 divisions — practical skill application gap persists.`,
      win:       `2 divisions at ≥75% adoption — above programme target, leading the transformation`,
      watchlist: `2 divisions below 60% adoption — no upcoming training events scheduled in either`,
      critical:  null,
    },
    people: {
      narrative: `9,087 employees trained of 14,000 target (64.9%). Certification completion at 87%. ADKAR Ability dimension below threshold in 3 divisions — hands-on training gap not yet addressed.`,
      win:       `Generative AI certifications at 87% success rate — strongest-performing training category`,
      watchlist: `ADKAR Ability score below 65 in 3 divisions — practical application lagging behind awareness`,
      critical:  null,
    },
    programs: {
      narrative: `47 active AI programmes across all divisions. Generative AI leading with +34 projects YoY. Grid Demand Copilot and Smart Meter Anomaly AI delivering the highest ROI contributions.`,
      win:       `Grid Demand Copilot at 86% implementation — AED 18.2M impact realised ahead of schedule`,
      watchlist: `Asset Integrity Vision stalled at 39% — flagged at-risk, no milestone progress in 60 days`,
      critical:  null,
    },
    technology: {
      narrative: `7 AI tools active with average 68% adoption. Microsoft Copilot and Custom GPTs leading deployment. Autonomous AI tools at the lowest adoption tier — significant capability gap vs Generative AI.`,
      win:       `Generative AI tooling up 34 deployments YoY — fastest-growing category in the stack`,
      watchlist: `Autonomous AI at 14 deployments vs 58 Generative AI — adoption lag limits operational potential`,
      critical:  null,
    },
    discovery: {
      narrative: `Innovation pipeline active across all DEWA divisions with AI and non-AI submissions. Some discoveries have stalled in the IT Assessment stage beyond 30 days — velocity intervention needed.`,
      win:       `Multi-division discovery catalogue active — cross-functional innovation submissions flowing`,
      watchlist: `Discoveries stuck in IT Assessment stage >30 days — pipeline velocity at risk`,
      critical:  null,
    },
  }

  return map[module]
}

export type ModuleHealth = 'healthy' | 'attention' | 'critical'

export interface ModuleStatus {
  id: InsightModule
  label: string
  icon: string
  health: ModuleHealth
  detail: string
}

export function computeModuleHealth(): ModuleStatus[] {
  const onTrackPct = AH_KPIS.filter(k => k.status === 'on_track').length / AH_KPIS.length
  const openCrit   = AH_INCIDENTS.filter(i => i.severity === 'critical' && i.status !== 'resolved').length
  const openHigh   = AH_INCIDENTS.filter(i => i.severity === 'high' && i.status !== 'resolved').length
  const ahHealth: ModuleHealth = openCrit > 0 ? 'critical' : onTrackPct < 0.6 ? 'attention' : 'attention'
  const incHealth: ModuleHealth = openCrit > 0 ? 'critical' : openHigh > 2 ? 'attention' : 'attention'
  return [
    { id: 'executive',  label: 'Executive',    icon: 'bi-bar-chart-line-fill', health: 'healthy',   detail: 'KPIs and roadmap on track' },
    { id: 'al-hasbah',  label: 'Al Hasbah',    icon: 'bi-robot',               health: ahHealth,    detail: `${openCrit} critical, ${AH_KPIS.filter(k => k.status !== 'on_track').length} KPIs at risk` },
    { id: 'incidents',  label: 'AI Incidents', icon: 'bi-shield-exclamation',  health: incHealth,   detail: `${openCrit + openHigh} open high/critical` },
    { id: 'people',     label: 'People',        icon: 'bi-people-fill',         health: 'attention', detail: 'Ability score gaps in 3 divisions' },
    { id: 'programs',   label: 'Programs',      icon: 'bi-folder2-open',        health: 'healthy',   detail: '47 active programmes' },
    { id: 'division',   label: 'Divisions',     icon: 'bi-diagram-3-fill',      health: 'attention', detail: 'Avg adoption 64% — 2 divs below 60%' },
    { id: 'discovery',  label: 'Discovery',     icon: 'bi-kanban',              health: 'healthy',   detail: 'Pipeline flowing' },
    { id: 'technology', label: 'Technology',    icon: 'bi-cpu-fill',            health: 'healthy',   detail: '7 tools active, avg 68% adoption' },
  ]
}
