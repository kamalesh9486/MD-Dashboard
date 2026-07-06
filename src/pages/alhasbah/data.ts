// Al Hasbah — type definitions and static reference data

export type AHDivision = 'HR' | 'Finance' | 'Billing'
export type AHStatus   = 'live' | 'pipeline' | 'planned'
export type AHKPIStatus = 'on_track' | 'at_risk' | 'off_track'
export type AHTrend    = 'up' | 'down' | 'flat'
export type AHSeverity = 'critical' | 'high' | 'medium' | 'low'
export type AHIncidentStatus = 'open' | 'in_progress' | 'resolved'
export type AHIncidentType   = 'ai_agent' | 'sap' | 'business_process' | 'knowledge_gap'

export interface AHAgent {
  id: string
  _dvId?: string  // Dataverse GUID — present when record comes from Dataverse
  name: string
  division: AHDivision
  status: AHStatus
  businessOwner: string
  modelsUsed: string[]
  systemsIntegrated: string[]
  targetCostSaving: number
  fteSavingsTarget: number
  totalUseCases: number
  liveUseCases: number
  openIncidents: number
  targetEndUsers: string
  annualTransactions: number
  aiAdoptionPct: number
  description: string
  mcpServers: string[]
  aiTools: string[]
  ptuUsage: number
}

export type AHMeasurementType = '' | 'Requests' | 'Transactions' | 'Device' | 'Systems'

export interface AHMilestone {
  name: string
  status: 'completed' | 'in_progress' | 'pending'
  plannedDate?: string
  actualDate?: string
}

export interface AHUseCase {
  id: string
  _dvId?: string  // Dataverse GUID
  agentId: string
  name: string
  division: AHDivision
  domain: string
  status: AHStatus
  startDate?: string
  plannedGoLive: string
  actualGoLive?: string
  targetEndDate?: string
  annualVolume: number
  expectedEfficiency: number
  fteAvoidance?: number
  fteSavingsTarget?: number
  targetCostSaving: number
  measurementType?: AHMeasurementType
  description: string
  sapModule: string
  systemsForIntegration: string[]
  currentState: string
  futureState: string
  processes: string[]
  totalDevelopmentEffort: number
  adoptionActual?: number
  milestones: AHMilestone[]
}

export interface AHKPIHistory { period: string; actual: number; target: number }

export interface AHKPI {
  id: string
  _dvId?: string  // Dataverse GUID
  agentId: string
  division: AHDivision
  function: string
  kpiName: string
  kpiDefinition: string
  unit: '%' | 'hours' | 'AED' | 'days' | 'count'
  targetValue: number
  currentValue: number
  status: AHKPIStatus
  trend: AHTrend
  trendDelta: number
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  owner: string
  history: AHKPIHistory[]
  lowerIsBetter?: boolean
  dataSource?: string
  kpiFamily: string
  scope: 'enterprise' | 'division' | 'department'
  achievable: 'yes' | 'partial' | 'no'
  notAchievableReason?: string
  lastMeasured: string
}

export interface AHIncidentComment {
  id: string
  author: string
  timestamp: string
  text: string
}

export interface AHIncidentResolution {
  summary: string
  rootCause: string
  fixedBy: string
  testedBy?: string
  preventiveMeasures?: string
}

export interface AHIncident {
  id: string
  _dvId?: string  // Dataverse GUID
  agentId: string
  title: string
  type: AHIncidentType
  severity: AHSeverity
  status: AHIncidentStatus
  division: AHDivision
  reportedDate: string
  resolvedDate?: string
  changeManagementTriggered: boolean
  description: string
  useCaseId?: string
  resolution?: AHIncidentResolution
  comments: AHIncidentComment[]
  submitterName: string
  submitterEmail: string
  submitterPhone?: string
  submitterDepartment?: string
  submitterRole?: string
}

export interface AHMonthlyFlow {
  month: string
  aiFlows: number
  manualFlows: number
  fteSaved: number
  costAvoided: number
}

export type AHCMActivityType   = 'awareness_session' | 'documentation' | 'training' | 'communication'
export type AHCMActivityStatus = 'planned' | 'in_progress' | 'completed'

export interface AHCMActivity {
  id: string
  incidentId: string
  title: string
  type: AHCMActivityType
  status: AHCMActivityStatus
  scheduledDate: string
  completedDate?: string
  targetAudience: string
  description: string
  attendees?: number
}

// Programme-level headline metrics
export const AH_PROGRAMME = {
  totalAgents: 75,
  liveAgents: 31,
  totalUseCases: 152,
  liveUseCases: 48,
  targetCostSaving: 4_200_000,
  realisedCostSaving: 1_680_000,
  targetFTE: 87_600,
  realisedFTE: 23_400,
  adoptionPct: 42,
}

export const AH_AGENTS: AHAgent[] = [
  {
    id: 'agt-001',
    name: 'Employee Onboarding Agent',
    division: 'HR',
    status: 'live',
    businessOwner: 'Sara Al Marzouqi',
    modelsUsed: ['Claude Sonnet 4.5', 'Azure OpenAI'],
    systemsIntegrated: ['SAP HCM', 'ServiceNow', 'Workday'],
    targetCostSaving: 520_000,
    fteSavingsTarget: 9_600,
    totalUseCases: 6,
    liveUseCases: 5,
    openIncidents: 1,
    targetEndUsers: 'HR Specialists, New Joiners',
    annualTransactions: 3600,
    aiAdoptionPct: 78,
    description: 'AI-powered agent that automates the end-to-end employee onboarding workflow, from document collection to IT provisioning and orientation scheduling.',
    mcpServers: ['MCP-SAP-HCM', 'MCP-ServiceNow'],
    aiTools: ['Anthropic SDK', 'Azure Document Intelligence'],
    ptuUsage: 200,
  },
  {
    id: 'agt-002',
    name: 'Payroll Reconciliation Agent',
    division: 'HR',
    status: 'live',
    businessOwner: 'Ahmed Al Blooshi',
    modelsUsed: ['Claude Sonnet 4.5'],
    systemsIntegrated: ['SAP Payroll', 'Oracle HRMS'],
    targetCostSaving: 380_000,
    fteSavingsTarget: 7_200,
    totalUseCases: 4,
    liveUseCases: 3,
    openIncidents: 2,
    targetEndUsers: 'Payroll Team, Finance Controllers',
    annualTransactions: 324,
    aiAdoptionPct: 88,
    description: 'Reconciles monthly payroll data across SAP and Oracle HRMS, detecting variances and flagging discrepancies before payroll finalisation.',
    mcpServers: ['MCP-SAP-Payroll', 'MCP-Oracle-HRMS'],
    aiTools: ['Anthropic SDK'],
    ptuUsage: 80,
  },
  {
    id: 'agt-003',
    name: 'Leave & Absence Advisor',
    division: 'HR',
    status: 'pipeline',
    businessOwner: 'Hessa Al Mansoori',
    modelsUsed: ['GPT-4o', 'Claude Haiku'],
    systemsIntegrated: ['SAP HCM', 'Teams'],
    targetCostSaving: 210_000,
    fteSavingsTarget: 4_800,
    totalUseCases: 3,
    liveUseCases: 0,
    openIncidents: 0,
    targetEndUsers: 'All DEWA Employees',
    annualTransactions: 0,
    aiAdoptionPct: 0,
    description: 'Conversational AI advisor that handles leave requests, eligibility checks, and absence management via Microsoft Teams integration.',
    mcpServers: ['MCP-SAP-HCM', 'MCP-Teams'],
    aiTools: ['Azure OpenAI SDK', 'Claude SDK'],
    ptuUsage: 0,
  },
  {
    id: 'agt-004',
    name: 'Three-Way Match Agent',
    division: 'Finance',
    status: 'live',
    businessOwner: 'Khalid Al Hammadi',
    modelsUsed: ['Azure OpenAI GPT-4o', 'Claude Sonnet 4.5'],
    systemsIntegrated: ['SAP FICO', 'Oracle ERP', 'Ariba'],
    targetCostSaving: 670_000,
    fteSavingsTarget: 12_000,
    totalUseCases: 7,
    liveUseCases: 6,
    openIncidents: 1,
    targetEndUsers: 'AP Team, Procurement Officers',
    annualTransactions: 32000,
    aiAdoptionPct: 82,
    description: 'Intelligent document matching agent that reconciles purchase orders, goods receipts, and vendor invoices automatically, routing exceptions to the AP team.',
    mcpServers: ['MCP-SAP-FICO', 'MCP-Oracle-ERP', 'MCP-Ariba'],
    aiTools: ['Azure OpenAI SDK', 'Anthropic SDK'],
    ptuUsage: 450,
  },
  {
    id: 'agt-005',
    name: 'Budget Variance Analyser',
    division: 'Finance',
    status: 'live',
    businessOwner: 'Fatima Al Rashidi',
    modelsUsed: ['Claude Opus 4.7'],
    systemsIntegrated: ['SAP BW', 'Power BI', 'Excel'],
    targetCostSaving: 290_000,
    fteSavingsTarget: 6_000,
    totalUseCases: 4,
    liveUseCases: 4,
    openIncidents: 0,
    targetEndUsers: 'Finance Controllers, Division Heads',
    annualTransactions: 16,
    aiAdoptionPct: 100,
    description: 'Generates automated monthly budget variance reports with AI-driven commentary on significant variances and recommended corrective actions for Division Heads.',
    mcpServers: ['MCP-SAP-BW', 'MCP-PowerBI'],
    aiTools: ['Anthropic SDK'],
    ptuUsage: 30,
  },
  {
    id: 'agt-006',
    name: 'Vendor Invoice Processor',
    division: 'Finance',
    status: 'pipeline',
    businessOwner: 'Mariam Al Ketbi',
    modelsUsed: ['GPT-4o mini', 'Azure Document Intelligence'],
    systemsIntegrated: ['SAP FICO', 'Tungsten Automation'],
    targetCostSaving: 450_000,
    fteSavingsTarget: 8_400,
    totalUseCases: 5,
    liveUseCases: 2,
    openIncidents: 1,
    targetEndUsers: 'AP Clerks, Finance Auditors',
    annualTransactions: 1200,
    aiAdoptionPct: 45,
    description: 'Document AI agent that extracts, validates, and routes vendor invoices with OCR capabilities for Arabic and English invoice formats.',
    mcpServers: ['MCP-SAP-FICO', 'MCP-Tungsten'],
    aiTools: ['Azure OpenAI SDK', 'Azure Document Intelligence'],
    ptuUsage: 60,
  },
  {
    id: 'agt-007',
    name: 'Account Validator Agent',
    division: 'Billing',
    status: 'live',
    businessOwner: 'Saeed Al Mheiri',
    modelsUsed: ['Claude Sonnet 4.5', 'Azure AI Vision'],
    systemsIntegrated: ['CIS Oracle', 'Emirates ID API', 'PACI'],
    targetCostSaving: 580_000,
    fteSavingsTarget: 10_800,
    totalUseCases: 8,
    liveUseCases: 7,
    openIncidents: 2,
    targetEndUsers: 'Customer Service Agents, Billing Team',
    annualTransactions: 54000,
    aiAdoptionPct: 91,
    description: 'Real-time identity verification agent for DEWA customer accounts, cross-referencing Emirates ID, PACI, and internal CIS Oracle records.',
    mcpServers: ['MCP-CIS-Oracle', 'MCP-Emirates-ID', 'MCP-PACI'],
    aiTools: ['Anthropic SDK', 'Azure AI Vision'],
    ptuUsage: 600,
  },
  {
    id: 'agt-008',
    name: 'Meter Reading Dispute Agent',
    division: 'Billing',
    status: 'live',
    businessOwner: 'Noura Al Shamsi',
    modelsUsed: ['Claude Sonnet 4.5'],
    systemsIntegrated: ['CIS Oracle', 'MDM System', 'GIS'],
    targetCostSaving: 310_000,
    fteSavingsTarget: 5_600,
    totalUseCases: 5,
    liveUseCases: 4,
    openIncidents: 0,
    targetEndUsers: 'Metering Team, Customer Service',
    annualTransactions: 33600,
    aiAdoptionPct: 76,
    description: 'Resolves smart meter reading disputes by cross-referencing MDM telemetry, GIS data, and historical consumption patterns with AI anomaly detection.',
    mcpServers: ['MCP-CIS-Oracle', 'MCP-MDM', 'MCP-GIS'],
    aiTools: ['Anthropic SDK'],
    ptuUsage: 380,
  },
  {
    id: 'agt-009',
    name: 'Move-In / Move-Out Processor',
    division: 'Billing',
    status: 'pipeline',
    businessOwner: 'Ali Al Kaabi',
    modelsUsed: ['GPT-4o', 'Claude Haiku 4.5'],
    systemsIntegrated: ['CIS Oracle', 'DLD API', 'RERA'],
    targetCostSaving: 420_000,
    fteSavingsTarget: 7_800,
    totalUseCases: 6,
    liveUseCases: 1,
    openIncidents: 1,
    targetEndUsers: 'Real Estate Team, Customer Service',
    annualTransactions: 500,
    aiAdoptionPct: 25,
    description: 'Automates property-linked service connection requests by validating DLD, RERA, and Ejari records before provisioning utilities.',
    mcpServers: ['MCP-CIS-Oracle', 'MCP-DLD', 'MCP-RERA'],
    aiTools: ['Azure OpenAI SDK', 'Claude SDK'],
    ptuUsage: 40,
  },
  {
    id: 'agt-010',
    name: 'Credit & Collection Advisor',
    division: 'Billing',
    status: 'planned',
    businessOwner: 'Reem Al Falasi',
    modelsUsed: ['Claude Opus 4.7'],
    systemsIntegrated: ['CIS Oracle', 'Credit Bureau API'],
    targetCostSaving: 370_000,
    fteSavingsTarget: 6_600,
    totalUseCases: 4,
    liveUseCases: 0,
    openIncidents: 0,
    targetEndUsers: 'Credit Control Team',
    annualTransactions: 0,
    aiAdoptionPct: 0,
    description: 'AI advisor for credit risk assessment and collection prioritisation, integrating with Credit Bureau API to recommend collection strategies.',
    mcpServers: ['MCP-CIS-Oracle', 'MCP-Credit-Bureau'],
    aiTools: ['Anthropic SDK'],
    ptuUsage: 0,
  },
]

export const AH_USE_CASES: AHUseCase[] = [
  // HR — Employee Onboarding Agent
  {
    id: 'uc-001', agentId: 'agt-001', name: 'New Hire Document Collection', division: 'HR', domain: 'Learning & Development', status: 'live',
    plannedGoLive: '2025-09-01', actualGoLive: '2025-09-15', annualVolume: 1200, expectedEfficiency: 72, targetCostSaving: 95_000,
    description: 'AI-powered collection and validation of new hire onboarding documents including passport, Emirates ID, educational certificates, and employment contracts, eliminating manual HR handling and accelerating clearance.',
    sapModule: 'SAP HCM — Onboarding', systemsForIntegration: ['SAP HCM', 'ServiceNow', 'Workday', 'Azure Blob Storage'],
    currentState: 'HR specialists manually request and track document submission from new hires via email, with no automated validation or reminder system.',
    futureState: 'AI agent automatically requests, collects, and validates all required onboarding documents with real-time status tracking and automated reminders.',
    processes: ['Document Request', 'Submission Validation', 'Completeness Check'],
    totalDevelopmentEffort: 85,
    adoptionActual: 74,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-002', agentId: 'agt-001', name: 'IT Provisioning Automation', division: 'HR', domain: 'Learning & Development', status: 'live',
    plannedGoLive: '2025-10-01', actualGoLive: '2025-10-20', annualVolume: 1200, expectedEfficiency: 65, targetCostSaving: 82_000,
    description: 'Automatically generates IT access provisioning requests to Active Directory, ServiceNow ITSM, and role-based systems upon new hire approval, eliminating IT team backlogs and reducing provisioning lead time.',
    sapModule: 'SAP HCM — Personnel Administration', systemsForIntegration: ['Active Directory', 'SAP HCM', 'ServiceNow'],
    currentState: 'IT provisioning requests are raised manually by HR after receiving signed onboarding forms, causing 2-3 day delays in system access.',
    futureState: 'IT access provisioning is triggered automatically upon new hire approval, reducing time-to-access from days to hours.',
    processes: ['Role Mapping', 'Access Request Generation', 'Ticket Creation'],
    totalDevelopmentEffort: 72,
    adoptionActual: 67,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-003', agentId: 'agt-001', name: 'Orientation Scheduling', division: 'HR', domain: 'Learning & Development', status: 'live',
    plannedGoLive: '2025-11-01', actualGoLive: '2025-11-10', annualVolume: 1200, expectedEfficiency: 58, targetCostSaving: 71_000,
    description: 'Schedules mandatory orientation sessions, assigns department buddies, and sends personalised calendar invites to new joiners and their line managers based on joining date and division.',
    sapModule: 'SAP HCM — Absence Management', systemsForIntegration: ['SAP HCM', 'Microsoft Teams', 'Outlook'],
    currentState: 'HR coordinators manually schedule orientation sessions, assign buddies, and send calendar invites via email chains.',
    futureState: 'AI agent automatically schedules sessions, assigns buddies based on department match, and sends personalised calendar invites.',
    processes: ['Session Scheduling', 'Buddy Assignment', 'Calendar Distribution'],
    totalDevelopmentEffort: 60,
    adoptionActual: 55,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-004', agentId: 'agt-001', name: 'Employee ID Card Issuance', division: 'HR', domain: 'Personnel Management', status: 'pipeline',
    plannedGoLive: '2026-07-01', annualVolume: 900, expectedEfficiency: 48, targetCostSaving: 55_000,
    description: 'Validates employee photo quality and ID card details, submits automated printing requests, and tracks physical card collection confirmation from new employees via digital acknowledgement.',
    sapModule: 'SAP HCM — Personnel Administration', systemsForIntegration: ['SAP HCM', 'ID Card Printer API', 'ServiceNow'],
    currentState: 'Employees submit physical photos for ID card requests and manually track collection status through HR email.',
    futureState: 'AI validates digital photo quality, submits automated printing requests, and confirms collection via digital acknowledgement.',
    processes: ['Photo Validation', 'Print Request', 'Collection Confirmation'],
    totalDevelopmentEffort: 45,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'in_progress' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
  // HR — Payroll Reconciliation Agent
  {
    id: 'uc-005', agentId: 'agt-002', name: 'Monthly Payroll Variance Check', division: 'HR', domain: 'C&B-EH Personnel Management', status: 'live',
    plannedGoLive: '2025-12-01', actualGoLive: '2025-12-05', annualVolume: 12, expectedEfficiency: 85, targetCostSaving: 140_000,
    description: 'Compares current and prior month payroll figures across all cost centres, flags statistically significant variances with AI-generated root cause hypotheses for immediate HR review before payroll finalisation.',
    sapModule: 'SAP Payroll — Payroll Processing', systemsForIntegration: ['SAP Payroll', 'Oracle HRMS', 'Power BI'],
    currentState: 'Finance team manually compares payroll outputs month-over-month in Excel, taking 2-3 days to identify and investigate variances.',
    futureState: 'AI runs automated variance detection within minutes of payroll closure, generating root cause hypotheses for immediate HR review.',
    processes: ['Data Extraction', 'Variance Computation', 'Exception Reporting'],
    totalDevelopmentEffort: 95,
    adoptionActual: 88,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-006', agentId: 'agt-002', name: 'Allowance Validation Automation', division: 'HR', domain: 'C&B-EH Personnel Management', status: 'live',
    plannedGoLive: '2026-01-01', actualGoLive: '2026-01-08', annualVolume: 12, expectedEfficiency: 78, targetCostSaving: 105_000,
    description: 'Validates housing, transport, and special allowances against grade-band entitlement matrices before payroll finalisation, automatically flagging discrepancies for correction and reducing compensation errors.',
    sapModule: 'SAP Payroll — Compensation Management', systemsForIntegration: ['SAP Payroll', 'SAP HCM', 'Oracle HRMS'],
    currentState: 'HR manually validates allowances against grade-band tables before each payroll run, prone to human error on complex entitlement rules.',
    futureState: 'AI cross-references all allowances against grade entitlement matrices automatically, flagging discrepancies before payroll finalisation.',
    processes: ['Entitlement Lookup', 'Variance Detection', 'Correction Flagging'],
    totalDevelopmentEffort: 80,
    adoptionActual: 76,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-007', agentId: 'agt-002', name: 'End-of-Service Calculation', division: 'HR', domain: 'C&B-EH Personnel Management', status: 'pipeline',
    plannedGoLive: '2026-08-01', annualVolume: 300, expectedEfficiency: 62, targetCostSaving: 88_000,
    description: 'Computes final settlement amounts including gratuity, leave encashment, and deductions for all departing employees in accordance with UAE Labour Law and internal DEWA policy, reducing manual calculation errors.',
    sapModule: 'SAP Payroll — End-of-Service', systemsForIntegration: ['SAP Payroll', 'DEWA HR Portal', 'MOL API'],
    currentState: 'HR manually computes end-of-service benefits using spreadsheets, with frequent errors on complex cases involving extended leave or grade changes.',
    futureState: 'AI calculates all settlement components per UAE Labour Law and DEWA policy, generating signed-off computation sheets for payroll processing.',
    processes: ['Entitlement Calculation', 'Deduction Computation', 'Settlement Sheet Generation'],
    totalDevelopmentEffort: 90,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'in_progress' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
  // Finance — Three-Way Match Agent
  {
    id: 'uc-008', agentId: 'agt-004', name: 'PO vs GRN vs Invoice Auto-Match', division: 'Finance', domain: 'Accounts Payable', status: 'live',
    plannedGoLive: '2025-10-15', actualGoLive: '2025-10-22', annualVolume: 24_000, expectedEfficiency: 88, targetCostSaving: 220_000,
    description: 'Automatically matches purchase orders, goods receipt notes, and vendor invoices using AI, clearing matched transactions instantly and routing only genuine exceptions to the AP team for investigation.',
    sapModule: 'SAP FICO — Accounts Payable', systemsForIntegration: ['SAP FICO', 'SAP MM', 'Oracle ERP', 'Ariba'],
    currentState: 'AP team manually matches purchase orders, goods receipts, and invoices in SAP — a 3-5 minute process per invoice creating payment bottlenecks.',
    futureState: 'AI matches all three documents automatically within seconds, routing only genuine exceptions to the AP team for investigation.',
    processes: ['Document Retrieval', 'Three-Way Comparison', 'Exception Routing'],
    totalDevelopmentEffort: 120,
    adoptionActual: 86,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-009', agentId: 'agt-004', name: 'Partial Delivery Reconciliation', division: 'Finance', domain: 'Accounts Payable', status: 'live',
    plannedGoLive: '2025-12-01', actualGoLive: '2025-12-15', annualVolume: 8_000, expectedEfficiency: 74, targetCostSaving: 165_000,
    description: 'Reconciles invoices against partially delivered purchase orders by aggregating GRN line items, comparing contracted quantities, and proposing partial payment amounts to reduce manual AP exception handling.',
    sapModule: 'SAP FICO — Accounts Payable', systemsForIntegration: ['SAP FICO', 'SAP MM', 'Ariba'],
    currentState: 'Partial GRN scenarios are manually tracked in Excel with complex aggregation before invoices can be approved, causing payment delays.',
    futureState: 'AI aggregates partial GRN quantities across multiple deliveries and reconciles against invoice amounts for partial payment approval.',
    processes: ['GRN Aggregation', 'Invoice Comparison', 'Partial Payment Calculation'],
    totalDevelopmentEffort: 100,
    adoptionActual: 71,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-010', agentId: 'agt-004', name: 'Supplier Dispute Resolution', division: 'Finance', domain: 'Supplier Management', status: 'pipeline',
    plannedGoLive: '2026-09-01', annualVolume: 2_400, expectedEfficiency: 55, targetCostSaving: 98_000,
    description: 'Manages vendor dispute resolution by cross-referencing disputed invoices with contract terms, delivery records, and payment history to generate AI-recommended resolution actions and draft supplier communications.',
    sapModule: 'SAP FICO — Vendor Management', systemsForIntegration: ['SAP FICO', 'Ariba', 'Supplier Portal'],
    currentState: 'AP team resolves supplier disputes manually by reviewing contract terms, email trails, and delivery records — typically 3-7 days per case.',
    futureState: 'AI cross-references all relevant documents and generates a recommended resolution with draft supplier communication for AP approval.',
    processes: ['Dispute Classification', 'Contract Cross-Reference', 'Resolution Drafting'],
    totalDevelopmentEffort: 110,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'in_progress' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
  // Finance — Budget Variance Analyser
  {
    id: 'uc-011', agentId: 'agt-005', name: 'Monthly Budget Variance Report', division: 'Finance', domain: 'Management Reporting', status: 'live',
    plannedGoLive: '2025-11-01', actualGoLive: '2025-11-05', annualVolume: 12, expectedEfficiency: 90, targetCostSaving: 75_000,
    description: 'Generates monthly budget variance reports by comparing actuals against approved budgets across all divisions, with AI commentary on significant variances, trend analysis, and recommended corrective actions.',
    sapModule: 'SAP BW — Financial Reporting', systemsForIntegration: ['SAP BW', 'Power BI', 'SAP FICO'],
    currentState: 'Finance team manually compiles budget variance reports from SAP BW data, taking 1-2 days after month-end close.',
    futureState: 'AI generates complete budget variance reports within minutes of month-end close with AI commentary on key variances.',
    processes: ['Data Extraction', 'Variance Analysis', 'Report Generation'],
    totalDevelopmentEffort: 70,
    adoptionActual: 92,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-012', agentId: 'agt-005', name: 'CAPEX Forecast Adjustment', division: 'Finance', domain: 'Management Reporting', status: 'live',
    plannedGoLive: '2026-01-15', actualGoLive: '2026-01-20', annualVolume: 4, expectedEfficiency: 82, targetCostSaving: 62_000,
    description: 'Analyses current CAPEX spend trajectories and projects year-end positions using AI forecasting, recommending budget reallocation actions to Finance Controllers and Division Heads to prevent underspend or overrun.',
    sapModule: 'SAP BW — Capital Planning', systemsForIntegration: ['SAP BW', 'SAP FICO', 'Excel Online'],
    currentState: 'Finance Controllers manually analyse CAPEX spend trajectories and project year-end positions using static Excel models.',
    futureState: 'AI forecasts CAPEX trajectories dynamically and recommends reallocation actions based on spend velocity and project milestones.',
    processes: ['Spend Analysis', 'Trajectory Forecasting', 'Reallocation Recommendations'],
    totalDevelopmentEffort: 75,
    adoptionActual: 80,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  // Billing — Account Validator Agent
  {
    id: 'uc-013', agentId: 'agt-007', name: 'Emirates ID Auto-Verification', division: 'Billing', domain: 'Customer 360', status: 'live',
    plannedGoLive: '2025-09-15', actualGoLive: '2025-09-18', annualVolume: 36_000, expectedEfficiency: 92, targetCostSaving: 185_000,
    description: 'Verifies customer Emirates ID data against the Federal Authority for Identity and Citizenship API and PACI records, automating identity confirmation for new account creation, ownership transfers, and profile updates.',
    sapModule: 'CIS Oracle — Customer Management', systemsForIntegration: ['Emirates ID API', 'PACI', 'CIS Oracle'],
    currentState: 'Customer service agents manually verify Emirates ID details by calling the FAIC API and comparing records — 5-8 minutes per customer.',
    futureState: 'AI verifies identity in under 10 seconds by automatically cross-referencing Emirates ID, PACI, and CIS Oracle in a single transaction.',
    processes: ['API Integration', 'Data Cross-Reference', 'Verification Decision'],
    totalDevelopmentEffort: 95,
    adoptionActual: 93,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-014', agentId: 'agt-007', name: 'Supply Management Revamp — Move-In Phase 1', division: 'Billing', domain: 'Customer 360', status: 'live',
    plannedGoLive: '2026-01-01', actualGoLive: '2026-01-10', annualVolume: 18_000, expectedEfficiency: 78, targetCostSaving: 148_000,
    description: 'Processes customer move-in requests by validating property records, confirming supply eligibility, and creating service agreements with automated meter assignment and activation scheduling.',
    sapModule: 'CIS Oracle — Move-In Processing', systemsForIntegration: ['CIS Oracle', 'SAP FICO', 'DEWA Portal'],
    currentState: 'Customer service agents manually verify property records and create service agreements through multiple SAP and CIS screens.',
    futureState: 'AI validates property eligibility and creates service agreements automatically, reducing move-in processing from 20 minutes to under 5 minutes.',
    processes: ['Property Validation', 'Service Agreement Creation', 'Meter Assignment'],
    totalDevelopmentEffort: 110,
    adoptionActual: 76,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-015', agentId: 'agt-007', name: 'PACI Record Cross-Check', division: 'Billing', domain: 'Customer 360', status: 'pipeline',
    plannedGoLive: '2026-07-15', annualVolume: 12_000, expectedEfficiency: 68, targetCostSaving: 112_000,
    description: 'Cross-references customer records against the PACI national registry to detect discrepancies in address, ownership status, and identity information for compliance assurance and billing accuracy.',
    sapModule: 'CIS Oracle — Customer Verification', systemsForIntegration: ['PACI API', 'CIS Oracle', 'DEWA Portal'],
    currentState: 'Compliance team manually audits customer records against PACI national registry on a batch basis, with months-long review cycles.',
    futureState: 'AI continuously cross-references customer records against PACI for real-time compliance and billing accuracy alerts.',
    processes: ['Registry Query', 'Discrepancy Detection', 'Alert Generation'],
    totalDevelopmentEffort: 85,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'in_progress' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
  // Billing — Meter Reading Dispute Agent
  {
    id: 'uc-016', agentId: 'agt-008', name: 'High Consumption Alert Resolution', division: 'Billing', domain: 'Predictive Meter', status: 'live',
    plannedGoLive: '2025-11-15', actualGoLive: '2025-12-01', annualVolume: 9_600, expectedEfficiency: 71, targetCostSaving: 88_000,
    description: 'Analyses high consumption alerts triggered by smart meters, cross-references historical baselines and seasonal factors, and autonomously resolves disputes where consumption is within acceptable deviation thresholds.',
    sapModule: 'CIS Oracle — Meter Management', systemsForIntegration: ['CIS Oracle', 'MDM System', 'GIS'],
    currentState: 'Metering team manually reviews high consumption alerts, comparing against historical data in MDM and GIS before issuing dispute resolutions.',
    futureState: 'AI analyses consumption alerts against historical baselines and seasonal factors, autonomously resolving cases within acceptable deviation ranges.',
    processes: ['Alert Analysis', 'Historical Comparison', 'Resolution Decision'],
    totalDevelopmentEffort: 80,
    adoptionActual: 69,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-017', agentId: 'agt-008', name: 'Smart Meter Data Validation', division: 'Billing', domain: 'Predictive Meter', status: 'live',
    plannedGoLive: '2026-02-01', actualGoLive: '2026-02-10', annualVolume: 24_000, expectedEfficiency: 83, targetCostSaving: 95_000,
    description: 'Validates smart meter readings against MDM telemetry data using AI anomaly detection to flag faulty or implausible readings before billing cycle generation, preventing customer bill disputes downstream.',
    sapModule: 'CIS Oracle — MDM Integration', systemsForIntegration: ['MDM System', 'CIS Oracle', 'Tableau'],
    currentState: 'Billing team performs daily manual spot-checks of smart meter readings against MDM telemetry to catch anomalies before billing.',
    futureState: 'AI continuously validates 100% of smart meter readings against MDM telemetry using anomaly detection, preventing billing disputes proactively.',
    processes: ['Telemetry Comparison', 'Anomaly Detection', 'Flagging & Correction'],
    totalDevelopmentEffort: 90,
    adoptionActual: 85,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  // Billing — Move-In / Move-Out Processor
  {
    id: 'uc-018', agentId: 'agt-009', name: 'Tenancy Contract Validation', division: 'Billing', domain: 'Supply Management', status: 'live',
    plannedGoLive: '2026-03-01', actualGoLive: '2026-03-08', annualVolume: 15_000, expectedEfficiency: 66, targetCostSaving: 78_000,
    description: 'Validates tenancy contracts submitted for move-in requests by verifying Ejari registration, landlord signatures, and property details against DLD and RERA records before service connection approval.',
    sapModule: 'CIS Oracle — Move-In Processing', systemsForIntegration: ['CIS Oracle', 'DLD API', 'RERA API', 'Ejari'],
    currentState: 'Customer service team manually verifies tenancy contracts by checking Ejari registration, DLD records, and landlord signatures — 15-30 minutes per case.',
    futureState: 'AI validates all contract elements automatically within seconds, approving standard cases and routing complex ones for human review.',
    processes: ['Ejari Verification', 'DLD Cross-Check', 'RERA Compliance Check'],
    totalDevelopmentEffort: 95,
    adoptionActual: 64,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'completed' }, { name: 'UAT', status: 'completed' }, { name: 'Go-Live', status: 'completed' }],
  },
  {
    id: 'uc-019', agentId: 'agt-009', name: 'DLD Title Deed Verification', division: 'Billing', domain: 'Supply Management', status: 'pipeline',
    plannedGoLive: '2026-08-01', annualVolume: 8_000, expectedEfficiency: 58, targetCostSaving: 95_000,
    description: 'Verifies property ownership by cross-referencing title deed data from the Dubai Land Department registry with the account applicant identity information before processing service connection requests.',
    sapModule: 'CIS Oracle — Move-In Processing', systemsForIntegration: ['DLD Registry API', 'CIS Oracle', 'Emirates ID API'],
    currentState: 'Property ownership is verified manually by calling the DLD registry and comparing against customer identity documents — a multi-day process.',
    futureState: 'AI verifies property ownership against DLD registry in real-time, instantly confirming service connection eligibility.',
    processes: ['Registry Lookup', 'Identity Matching', 'Eligibility Decision'],
    totalDevelopmentEffort: 75,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'in_progress' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
  {
    id: 'uc-020', agentId: 'agt-009', name: 'RERA Permit Cross-Reference', division: 'Billing', domain: 'Supply Management', status: 'pipeline',
    plannedGoLive: '2026-10-01', annualVolume: 6_000, expectedEfficiency: 51, targetCostSaving: 72_000,
    description: 'Cross-references RERA building permits and property registration data to confirm property compliance and permit validity before processing move-in service connections for new developments.',
    sapModule: 'CIS Oracle — Move-In Processing', systemsForIntegration: ['RERA Portal API', 'CIS Oracle', 'DLD Registry API'],
    currentState: 'Properties in new developments require manual RERA permit verification before service connections, causing backlogs for new building projects.',
    futureState: 'AI cross-references RERA building permits and DLD registration data to approve service connections automatically for compliant properties.',
    processes: ['Permit Verification', 'DLD Cross-Reference', 'Connection Approval'],
    totalDevelopmentEffort: 65,
    milestones: [{ name: 'Design', status: 'completed' }, { name: 'Development', status: 'pending' }, { name: 'UAT', status: 'pending' }, { name: 'Go-Live', status: 'pending' }],
  },
]

export const AH_KPIS: AHKPI[] = [
  { id: 'kpi-001', agentId: 'agt-001', division: 'HR', function: 'Learning & Development', kpiName: 'Document Collection Automation Rate', kpiDefinition: 'Percentage of new hire documents collected via AI agent vs manually', unit: '%', targetValue: 90, currentValue: 87, status: 'on_track', trend: 'up', trendDelta: 4.2, frequency: 'monthly', owner: 'Sara Al Marzouqi', history: [{ period: 'Dec', actual: 72, target: 80 }, { period: 'Jan', actual: 78, target: 82 }, { period: 'Feb', actual: 81, target: 84 }, { period: 'Mar', actual: 83, target: 86 }, { period: 'Apr', actual: 85, target: 88 }, { period: 'May', actual: 87, target: 90 }], kpiFamily: 'Efficiency', scope: 'division', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-002', agentId: 'agt-001', division: 'HR', function: 'Learning & Development', kpiName: 'Onboarding Cycle Time', kpiDefinition: 'Average days from offer acceptance to day-1 readiness', unit: 'days', targetValue: 5, currentValue: 6.2, status: 'at_risk', trend: 'down', trendDelta: -0.8, frequency: 'monthly', owner: 'Sara Al Marzouqi', lowerIsBetter: true, dataSource: 'SAP HCM', history: [{ period: 'Dec', actual: 9, target: 7 }, { period: 'Jan', actual: 8.5, target: 7 }, { period: 'Feb', actual: 8, target: 6 }, { period: 'Mar', actual: 7.5, target: 6 }, { period: 'Apr', actual: 7, target: 5.5 }, { period: 'May', actual: 6.2, target: 5 }], kpiFamily: 'Efficiency', scope: 'department', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-003', agentId: 'agt-002', division: 'HR', function: 'C&B-EH Personnel Management', kpiName: 'Payroll Variance Detection Rate', kpiDefinition: 'Percentage of payroll variances detected by AI before manual review', unit: '%', targetValue: 95, currentValue: 96.4, status: 'on_track', trend: 'up', trendDelta: 2.1, frequency: 'monthly', owner: 'Ahmed Al Blooshi', history: [{ period: 'Dec', actual: 88, target: 90 }, { period: 'Jan', actual: 90, target: 91 }, { period: 'Feb', actual: 92, target: 92 }, { period: 'Mar', actual: 93.5, target: 93 }, { period: 'Apr', actual: 95, target: 94 }, { period: 'May', actual: 96.4, target: 95 }], kpiFamily: 'Compliance', scope: 'division', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-004', agentId: 'agt-002', division: 'HR', function: 'C&B-EH Personnel Management', kpiName: 'Manual Override Rate', kpiDefinition: 'Percentage of payroll runs requiring human correction after AI processing', unit: '%', targetValue: 5, currentValue: 3.8, status: 'on_track', trend: 'down', trendDelta: -1.2, frequency: 'monthly', owner: 'Ahmed Al Blooshi', lowerIsBetter: true, dataSource: 'SAP Payroll', history: [{ period: 'Dec', actual: 8, target: 7 }, { period: 'Jan', actual: 7, target: 6.5 }, { period: 'Feb', actual: 6, target: 6 }, { period: 'Mar', actual: 5.2, target: 5.5 }, { period: 'Apr', actual: 4.5, target: 5.2 }, { period: 'May', actual: 3.8, target: 5 }], kpiFamily: 'Compliance', scope: 'division', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-005', agentId: 'agt-004', division: 'Finance', function: 'Accounts Payable', kpiName: 'Invoice Auto-Match Rate', kpiDefinition: 'Percentage of invoices matched automatically without human intervention', unit: '%', targetValue: 85, currentValue: 82, status: 'at_risk', trend: 'up', trendDelta: 3.0, frequency: 'weekly', owner: 'Khalid Al Hammadi', history: [{ period: 'Dec', actual: 65, target: 70 }, { period: 'Jan', actual: 70, target: 74 }, { period: 'Feb', actual: 74, target: 77 }, { period: 'Mar', actual: 77, target: 80 }, { period: 'Apr', actual: 80, target: 82 }, { period: 'May', actual: 82, target: 85 }], kpiFamily: 'Accuracy', scope: 'enterprise', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-006', agentId: 'agt-004', division: 'Finance', function: 'Accounts Payable', kpiName: 'Invoice Processing Time', kpiDefinition: 'Average hours from invoice receipt to payment approval', unit: 'hours', targetValue: 4, currentValue: 5.5, status: 'at_risk', trend: 'down', trendDelta: -1.5, frequency: 'daily', owner: 'Khalid Al Hammadi', lowerIsBetter: true, dataSource: 'SAP FICO', history: [{ period: 'Dec', actual: 12, target: 10 }, { period: 'Jan', actual: 10, target: 8 }, { period: 'Feb', actual: 8.5, target: 7 }, { period: 'Mar', actual: 7.5, target: 6 }, { period: 'Apr', actual: 6.5, target: 5 }, { period: 'May', actual: 5.5, target: 4 }], kpiFamily: 'Accuracy', scope: 'enterprise', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-007', agentId: 'agt-005', division: 'Finance', function: 'Management Reporting', kpiName: 'Budget Report Automation Rate', kpiDefinition: 'Percentage of monthly budget variance reports generated automatically', unit: '%', targetValue: 100, currentValue: 100, status: 'on_track', trend: 'flat', trendDelta: 0, frequency: 'monthly', owner: 'Fatima Al Rashidi', history: [{ period: 'Dec', actual: 75, target: 80 }, { period: 'Jan', actual: 90, target: 90 }, { period: 'Feb', actual: 100, target: 95 }, { period: 'Mar', actual: 100, target: 98 }, { period: 'Apr', actual: 100, target: 100 }, { period: 'May', actual: 100, target: 100 }], kpiFamily: 'Efficiency', scope: 'division', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-008', agentId: 'agt-005', division: 'Finance', function: 'Management Reporting', kpiName: 'Report Delivery Time', kpiDefinition: 'Hours from month-end close to budget variance report delivery', unit: 'hours', targetValue: 2, currentValue: 1.8, status: 'on_track', trend: 'down', trendDelta: -0.6, frequency: 'monthly', owner: 'Fatima Al Rashidi', history: [{ period: 'Dec', actual: 8, target: 6 }, { period: 'Jan', actual: 6, target: 5 }, { period: 'Feb', actual: 4, target: 4 }, { period: 'Mar', actual: 3, target: 3 }, { period: 'Apr', actual: 2.2, target: 2.5 }, { period: 'May', actual: 1.8, target: 2 }], kpiFamily: 'Efficiency', scope: 'division', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-009', agentId: 'agt-007', division: 'Billing', function: 'Customer 360', kpiName: 'Identity Verification Auto-Completion', kpiDefinition: 'Percentage of customer identity verifications completed without agent intervention', unit: '%', targetValue: 90, currentValue: 93.2, status: 'on_track', trend: 'up', trendDelta: 2.8, frequency: 'daily', owner: 'Saeed Al Mheiri', history: [{ period: 'Dec', actual: 80, target: 82 }, { period: 'Jan', actual: 84, target: 84 }, { period: 'Feb', actual: 87, target: 86 }, { period: 'Mar', actual: 89, target: 87 }, { period: 'Apr', actual: 91, target: 89 }, { period: 'May', actual: 93.2, target: 90 }], kpiFamily: 'Accuracy', scope: 'enterprise', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-010', agentId: 'agt-007', division: 'Billing', function: 'Customer 360', kpiName: 'Emirates ID API Success Rate', kpiDefinition: 'Percentage of Emirates ID verification API calls returning valid responses', unit: '%', targetValue: 99, currentValue: 97.4, status: 'at_risk', trend: 'up', trendDelta: 1.1, frequency: 'daily', owner: 'Saeed Al Mheiri', history: [{ period: 'Dec', actual: 92, target: 96 }, { period: 'Jan', actual: 94, target: 97 }, { period: 'Feb', actual: 95, target: 97.5 }, { period: 'Mar', actual: 96, target: 98 }, { period: 'Apr', actual: 96.8, target: 98.5 }, { period: 'May', actual: 97.4, target: 99 }], kpiFamily: 'Accuracy', scope: 'enterprise', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-011', agentId: 'agt-008', division: 'Billing', function: 'Predictive Meter', kpiName: 'Dispute Auto-Resolution Rate', kpiDefinition: 'Percentage of meter reading disputes resolved by AI without escalation', unit: '%', targetValue: 75, currentValue: 71, status: 'at_risk', trend: 'up', trendDelta: 5.0, frequency: 'weekly', owner: 'Noura Al Shamsi', history: [{ period: 'Dec', actual: 48, target: 55 }, { period: 'Jan', actual: 55, target: 60 }, { period: 'Feb', actual: 60, target: 64 }, { period: 'Mar', actual: 65, target: 68 }, { period: 'Apr', actual: 68, target: 72 }, { period: 'May', actual: 71, target: 75 }], kpiFamily: 'Efficiency', scope: 'division', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-012', agentId: 'agt-008', division: 'Billing', function: 'Predictive Meter', kpiName: 'Smart Meter Data Accuracy', kpiDefinition: 'Percentage of smart meter readings validated as accurate by AI cross-check', unit: '%', targetValue: 99.5, currentValue: 99.6, status: 'on_track', trend: 'flat', trendDelta: 0.1, frequency: 'daily', owner: 'Noura Al Shamsi', history: [{ period: 'Dec', actual: 98.8, target: 99 }, { period: 'Jan', actual: 99, target: 99.2 }, { period: 'Feb', actual: 99.2, target: 99.3 }, { period: 'Mar', actual: 99.4, target: 99.4 }, { period: 'Apr', actual: 99.5, target: 99.5 }, { period: 'May', actual: 99.6, target: 99.5 }], kpiFamily: 'Efficiency', scope: 'enterprise', achievable: 'yes', lastMeasured: '2026-05-24' },
  { id: 'kpi-013', agentId: 'agt-006', division: 'Finance', function: 'Accounts Payable', kpiName: 'Invoice Data Extraction Accuracy', kpiDefinition: 'Percentage of invoice fields correctly extracted by the AI document processor', unit: '%', targetValue: 95, currentValue: 88, status: 'off_track', trend: 'up', trendDelta: 3.0, frequency: 'weekly', owner: 'Mariam Al Ketbi', history: [{ period: 'Dec', actual: 72, target: 80 }, { period: 'Jan', actual: 77, target: 83 }, { period: 'Feb', actual: 80, target: 86 }, { period: 'Mar', actual: 83, target: 88 }, { period: 'Apr', actual: 86, target: 91 }, { period: 'May', actual: 88, target: 95 }], kpiFamily: 'Accuracy', scope: 'department', achievable: 'no', notAchievableReason: 'Arabic OCR model lacks fine-tuning on regional invoice formats. Accuracy has plateaued at 88% despite prompt engineering. A dedicated fine-tuning dataset and model retraining cycle is required before the 95% target is achievable.', lastMeasured: '2026-05-24' },
  { id: 'kpi-014', agentId: 'agt-009', division: 'Billing', function: 'Supply Management', kpiName: 'Contract Validation Cycle Time', kpiDefinition: 'Average hours to validate a tenancy contract for move-in processing', unit: 'hours', targetValue: 1, currentValue: 1.4, status: 'at_risk', trend: 'down', trendDelta: -0.4, frequency: 'daily', owner: 'Ali Al Kaabi', lowerIsBetter: true, dataSource: 'CIS Oracle', history: [{ period: 'Dec', actual: 4, target: 3 }, { period: 'Jan', actual: 3.2, target: 2.5 }, { period: 'Feb', actual: 2.8, target: 2 }, { period: 'Mar', actual: 2.2, target: 1.8 }, { period: 'Apr', actual: 1.8, target: 1.4 }, { period: 'May', actual: 1.4, target: 1 }], kpiFamily: 'Cycle Time', scope: 'department', achievable: 'partial', lastMeasured: '2026-05-24' },
  { id: 'kpi-015', agentId: 'agt-003', division: 'HR', function: 'Personnel Management', kpiName: 'Leave Request Self-Service Rate', kpiDefinition: 'Percentage of leave requests fully handled by AI without HR specialist intervention', unit: '%', targetValue: 80, currentValue: 0, status: 'off_track', trend: 'flat', trendDelta: 0, frequency: 'monthly', owner: 'Hessa Al Mansoori', history: [{ period: 'Dec', actual: 0, target: 0 }, { period: 'Jan', actual: 0, target: 0 }, { period: 'Feb', actual: 0, target: 0 }, { period: 'Mar', actual: 0, target: 20 }, { period: 'Apr', actual: 0, target: 40 }, { period: 'May', actual: 0, target: 60 }], kpiFamily: 'Adoption', scope: 'division', achievable: 'no', notAchievableReason: 'Agent deployment delayed to Q3 2026 due to SAP HCM integration complexity. No live transactions have been processed in the current reporting period. The 80% self-service target is not achievable until go-live is completed.', lastMeasured: '2026-05-24' },
]

export const AH_INCIDENTS: AHIncident[] = [
  {
    id: 'inc-001', agentId: 'agt-007', useCaseId: 'uc-013',
    title: 'Emirates ID API Timeout Errors', type: 'ai_agent', severity: 'critical', status: 'in_progress',
    division: 'Billing', reportedDate: '2026-05-18', changeManagementTriggered: true,
    submitterName: 'Saeed Al Mheiri', submitterEmail: 'saeed.almheiri@dewa.gov.ae',
    comments: [],
    description: 'The Emirates ID verification API is returning timeout errors for approximately 12% of requests during peak hours (8–10 AM). The Account Validator Agent is falling back to manual queue, causing customer wait times to spike.',
  },
  {
    id: 'inc-002', agentId: 'agt-004', useCaseId: 'uc-009',
    title: 'Three-Way Match Failing for Partial GRN', type: 'sap', severity: 'high', status: 'in_progress',
    division: 'Finance', reportedDate: '2026-05-15', changeManagementTriggered: false,
    submitterName: 'Khalid Al Hammadi', submitterEmail: 'khalid.alhammadi@dewa.gov.ae',
    comments: [],
    description: 'When a purchase order has multiple partial goods receipts, the SAP FICO integration is not correctly aggregating GRN quantities, causing valid invoices to be routed to exception queue.',
  },
  {
    id: 'inc-003', agentId: 'agt-002', useCaseId: 'uc-005',
    title: 'Incorrect Salary Calculation for Night Shift', type: 'ai_agent', severity: 'critical', status: 'open',
    division: 'HR', reportedDate: '2026-05-20', changeManagementTriggered: true,
    submitterName: 'Ahmed Al Blooshi', submitterEmail: 'ahmed.alblooshi@dewa.gov.ae',
    comments: [],
    description: 'The Payroll Reconciliation Agent is incorrectly computing night shift allowances for employees in Grades 5–7. The allowance multiplier from the March 2026 policy update was not incorporated into the agent\'s ruleset.',
  },
  {
    id: 'inc-004', agentId: 'agt-001', useCaseId: 'uc-001',
    title: 'Document Upload Size Limit Error', type: 'business_process', severity: 'medium', status: 'resolved',
    division: 'HR', reportedDate: '2026-05-10', resolvedDate: '2026-05-11', changeManagementTriggered: false,
    submitterName: 'Sara Al Marzouqi', submitterEmail: 'sara.almarzouqi@dewa.gov.ae',
    resolution: {
      summary: 'Increased document upload limit from 15 MB to 50 MB in the collection workflow configuration. Affected employees were contacted and successfully resubmitted documents.',
      rootCause: 'Default file upload limit in the collection workflow was not updated when the document specification requirements were revised to accept higher-quality scans.',
      fixedBy: 'Amna Al Suwaidi',
      testedBy: 'HR QA Team',
      preventiveMeasures: 'Added upload-limit validation to the deployment checklist. Workflow configuration parameters are now reviewed during each policy update cycle.',
    },
    comments: [],
    description: 'New hire document uploads above 15 MB are being silently dropped by the collection workflow. Affected ~30 new joiners in May who had to resubmit documents manually.',
  },
  {
    id: 'inc-005', agentId: 'agt-006',
    title: 'Arabic Invoice OCR Extraction Errors', type: 'ai_agent', severity: 'high', status: 'open',
    division: 'Finance', reportedDate: '2026-05-19', changeManagementTriggered: false,
    submitterName: 'Mariam Al Ketbi', submitterEmail: 'mariam.alketbi@dewa.gov.ae',
    comments: [],
    description: 'The Vendor Invoice Processor is misreading numeric amounts on Arabic-language invoices, transposing thousands separators. Approximately 8% of Arabic invoices are incorrectly extracted.',
  },
  {
    id: 'inc-006', agentId: 'agt-008', useCaseId: 'uc-017',
    title: 'Smart Meter MDM Sync Lag', type: 'sap', severity: 'medium', status: 'in_progress',
    division: 'Billing', reportedDate: '2026-05-12', changeManagementTriggered: false,
    submitterName: 'Noura Al Shamsi', submitterEmail: 'noura.alshamsi@dewa.gov.ae',
    comments: [],
    description: 'Smart meter readings are arriving in the MDM system with a 6-hour lag, causing the Meter Reading Dispute Agent to resolve disputes based on stale data. No billing errors yet but SLA for dispute resolution is at risk.',
  },
  {
    id: 'inc-007', agentId: 'agt-009', useCaseId: 'uc-020',
    title: 'RERA API Schema Change — Permit Field Missing', type: 'knowledge_gap', severity: 'high', status: 'open',
    division: 'Billing', reportedDate: '2026-05-21', changeManagementTriggered: true,
    submitterName: 'Ali Al Kaabi', submitterEmail: 'ali.alkaabi@dewa.gov.ae',
    comments: [],
    description: 'RERA updated their API on 20 May without prior notice, removing the permit_expiry_date field. The Move-In/Move-Out Processor is throwing null reference exceptions for all new permit lookups.',
  },
  {
    id: 'inc-008', agentId: 'agt-004', useCaseId: 'uc-008',
    title: 'Duplicate Payment Warning Suppressed', type: 'business_process', severity: 'low', status: 'resolved',
    division: 'Finance', reportedDate: '2026-05-05', resolvedDate: '2026-05-07', changeManagementTriggered: false,
    submitterName: 'Khalid Al Hammadi', submitterEmail: 'khalid.alhammadi@dewa.gov.ae',
    resolution: {
      summary: 'Identified and corrected the configuration flag that caused warning suppression. All 14 flagged potential duplicates were reviewed and confirmed as true duplicates; no payments were processed. Configuration management procedure updated.',
      rootCause: 'A configuration flag in the Three-Way Match Agent was set to suppress warnings in non-production mode but was inadvertently carried over to the production deployment during a hotfix release.',
      fixedBy: 'Finance AI Engineering Team',
      testedBy: 'Finance QA',
      preventiveMeasures: 'Deployment checklist updated to include configuration flag review. Non-production flags are now automatically stripped by the CI/CD pipeline before production builds.',
    },
    comments: [],
    description: 'A configuration issue caused the Three-Way Match Agent to suppress duplicate payment warnings for a two-day window (5–6 May). 14 potential duplicates were caught in the next manual audit cycle.',
  },
]

// ── Log / rejection summary (real AlHasbah data) ──────────────────────────────
export const AH_LOG_SUMMARY = {
  totalRecords:   6379,
  uniqueUsers:    1286,
  dateRangeStart: '2026-02-07',
  dateRangeEnd:   '2026-04-09',
  totalApproved:  2681,
  totalRejected:  3588,
  totalPending:   110,
  avgAiConfidence: 24.8,
  avgMatchPercent: 78.5,
}

export type AHRejectionIssueType = 'ai_issue' | 'user_awareness' | 'ocr_doc_quality' | 'other'

export interface AHRejectionCategory {
  category: string
  count: number
  label: string
  issueType: AHRejectionIssueType
}

export const AH_REJECTION_BREAKDOWN: AHRejectionCategory[] = [
  { category: 'completely_different', count: 1000, label: 'Completely Different', issueType: 'ai_issue' },
  { category: 'hr_undefined',         count: 995,  label: 'HR Fields Undefined',  issueType: 'user_awareness' },
  { category: 'date_mismatch',        count: 954,  label: 'Date Mismatch',         issueType: 'ai_issue' },
  { category: 'name_mismatch',        count: 553,  label: 'Name Mismatch',         issueType: 'ai_issue' },
  { category: 'ocr_low_confidence',   count: 23,   label: 'OCR Low Confidence',    issueType: 'ocr_doc_quality' },
  { category: 'other',                count: 63,   label: 'Other',                 issueType: 'other' },
]

export const AH_DIVISION_COUNTS = { HR: 26, Finance: 22, Billing: 21, Innovation: 6 }
export const AH_LIFECYCLE       = { planned: 47, pipeline: 20, live: 8 }

export interface AHKPIFamily { family: string; total: number; onTrack: number }
export const AH_KPI_FAMILIES: AHKPIFamily[] = [
  { family: 'Efficiency', total: 5, onTrack: 4 },
  { family: 'Accuracy',   total: 3, onTrack: 2 },
  { family: 'Cost',       total: 2, onTrack: 2 },
  { family: 'Adoption',   total: 2, onTrack: 1 },
  { family: 'SLA',        total: 1, onTrack: 1 },
]

export const AH_SLA_DAYS  = { critical: 1, high: 2, medium: 5, low: 7 } as const
export const AH_SLA_LABEL = { critical: 'Same day', high: '2 days', medium: '5 days', low: '7 days' } as const

// Document breakdown (approximate, derived from audit log structure)
export interface AHDocBreakdown {
  label: string
  ai_issue: number
  user_awareness: number
  ocr: number
  other: number
}
export const AH_DOC_BREAKDOWN: AHDocBreakdown[] = [
  { label: 'Passport',    ai_issue: 1200, user_awareness: 550, ocr: 18, other: 40 },
  { label: 'Emirates ID', ai_issue: 950,  user_awareness: 320, ocr: 5,  other: 15 },
  { label: 'Visa',        ai_issue: 357,  user_awareness: 125, ocr: 0,  other: 8  },
]

// ── Change Management Activities ──────────────────────────────────────────────
export const AH_CM_ACTIVITIES: AHCMActivity[] = [
  {
    id: 'cm-001', incidentId: 'inc-001', title: 'Emirates ID API Failover Awareness Session',
    type: 'awareness_session', status: 'completed',
    scheduledDate: '2026-05-19', completedDate: '2026-05-19',
    targetAudience: 'Customer Service Agents, Billing Team',
    description: 'Emergency awareness session briefing the customer service team on manual verification fallback procedures while Emirates ID API issues are resolved.',
    attendees: 34,
  },
  {
    id: 'cm-002', incidentId: 'inc-001', title: 'Manual Verification Runbook Update',
    type: 'documentation', status: 'completed',
    scheduledDate: '2026-05-20', completedDate: '2026-05-21',
    targetAudience: 'Customer Service Agents',
    description: 'Updated the manual identity verification runbook with step-by-step fallback procedures and escalation contacts for API downtime scenarios.',
  },
  {
    id: 'cm-003', incidentId: 'inc-003', title: 'Night Shift Allowance Policy Training',
    type: 'training', status: 'in_progress',
    scheduledDate: '2026-05-24',
    targetAudience: 'Payroll Team, HR Business Partners',
    description: 'Training session covering the March 2026 night shift allowance policy update and how it affects Grade 5–7 employee calculations.',
    attendees: 18,
  },
  {
    id: 'cm-004', incidentId: 'inc-003', title: 'Payroll Correction Communication',
    type: 'communication', status: 'planned',
    scheduledDate: '2026-05-28',
    targetAudience: 'All Night Shift Employees (Grades 5–7)',
    description: 'Communication to affected employees explaining the salary recalculation process and timeline for correction payment in the June payroll cycle.',
  },
  {
    id: 'cm-005', incidentId: 'inc-007', title: 'RERA API Integration Emergency Brief',
    type: 'awareness_session', status: 'completed',
    scheduledDate: '2026-05-21', completedDate: '2026-05-21',
    targetAudience: 'Real Estate Team, Customer Service, AI Engineering',
    description: 'Emergency briefing on the RERA API schema change and its impact on move-in processing. Interim manual verification process communicated.',
    attendees: 22,
  },
  {
    id: 'cm-006', incidentId: 'inc-007', title: 'RERA Integration API Adapter Documentation',
    type: 'documentation', status: 'in_progress',
    scheduledDate: '2026-05-27',
    targetAudience: 'AI Engineering Team',
    description: 'Technical documentation for the new RERA API adapter that will handle the missing permit_expiry_date field and implement graceful fallback logic.',
  },
]

// ── Storage helpers ────────────────────────────────────────────────────────────
function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const stored = localStorage.getItem(key)
    if (stored) return JSON.parse(stored) as T[]
  } catch { /* ignore */ }
  return [...fallback]
}

function saveToStorage(key: string, data: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { /* ignore */ }
}

// ── Change Management Activities — persisted in localStorage ──────────────────
const CM_KEY = 'ah_cm_activities_v1'
export const AH_CM_ACTIVITIES_MUT: AHCMActivity[] = loadFromStorage(CM_KEY, AH_CM_ACTIVITIES)

export function addCMActivity(act: Omit<AHCMActivity, 'id'>): AHCMActivity {
  const id = `cm-${String(AH_CM_ACTIVITIES_MUT.length + 1).padStart(3, '0')}`
  const newAct: AHCMActivity = { ...act, id }
  AH_CM_ACTIVITIES_MUT.push(newAct)
  saveToStorage(CM_KEY, AH_CM_ACTIVITIES_MUT)
  return newAct
}

export function updateCMActivity(id: string, patch: Partial<AHCMActivity>): void {
  const idx = AH_CM_ACTIVITIES_MUT.findIndex(a => a.id === id)
  if (idx !== -1) {
    AH_CM_ACTIVITIES_MUT[idx] = { ...AH_CM_ACTIVITIES_MUT[idx], ...patch }
    saveToStorage(CM_KEY, AH_CM_ACTIVITIES_MUT)
  }
}

// ── Utility functions ──────────────────────────────────────────────────────────
export function daysSince(dateStr: string): number {
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getAssignedTeam(type: AHIncidentType, division: AHDivision): string {
  if (type === 'ai_agent')      return division === 'Finance' ? 'AI Engineering' : 'AI Automation'
  if (type === 'sap')           return 'SAP Function'
  if (type === 'knowledge_gap') return 'AI Adoption'
  return `${division} Operations`
}
