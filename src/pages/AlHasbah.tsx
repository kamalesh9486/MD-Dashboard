import { useState, useEffect, useRef, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ComposedChart, Line,
} from 'recharts'
import Icon from '../components/Icon'
import DataSourceBadge from '../components/DataSourceBadge'
import '../al-hasbah.css'

// ─── Types ────────────────────────────────────────────────────────────────────
type UseCaseStatus = 'Active' | 'POC' | 'Completed' | 'On Hold'
type AgentStatus   = 'Production' | 'Testing' | 'Development' | 'Deprecated'
type StageId       = 'input' | 'pre-check' | 'ai-idc' | 'post-check' | 'output' | 'monitoring'
type DrawerTab     = 'overview' | 'agents' | 'technology' | 'benefits'

interface UseCase {
  id: string
  name: string
  status: UseCaseStatus
  division: string
  department: string
  agentCount: number
  technologies: string[]
  description: string
  benefitSummary: string
  costSavingAED: number
  phase: string
  startDate: string
}

interface Agent {
  id: string
  useCaseId: string
  name: string
  status: AgentStatus
  technology: string
  accuracyScore: number
  responseTimeSec: number
  uptime: number
  evalScore: number
  monthlyCallCount: number
  costPerMonthAED: number
}

interface BenefitComparison {
  metric: string
  before: string
  after: string
  improvement: string
  color: 'green' | 'blue' | 'amber' | 'purple'
  icon: string
}

// ─── Static Data ──────────────────────────────────────────────────────────────
const USE_CASES: UseCase[] = [
  {
    id: 'uc-001', name: 'Smart Meter Anomaly Detection',
    status: 'Active', division: 'Distribution', department: 'Network Operations',
    agentCount: 3, phase: 'Production', startDate: 'Aug 2025',
    technologies: ['Azure ML', 'Power Automate', 'Copilot Studio'],
    description: 'Detects abnormal consumption patterns in smart meters using ML-based anomaly scoring and automated alert dispatch to field teams.',
    benefitSummary: 'Reduced manual inspection calls by 62%', costSavingAED: 480000,
  },
  {
    id: 'uc-002', name: 'Customer Complaint Triage',
    status: 'Active', division: 'Customer Affairs', department: 'Contact Center',
    agentCount: 2, phase: 'Production', startDate: 'Sep 2025',
    technologies: ['Azure OpenAI', 'Copilot Studio'],
    description: 'Classifies and routes incoming customer complaints using NLP, reducing handle time and improving first-contact resolution rates.',
    benefitSummary: 'Average handle time reduced by 38%', costSavingAED: 320000,
  },
  {
    id: 'uc-003', name: 'Document Intelligence Pipeline',
    status: 'POC', division: 'Finance', department: 'Accounts Payable',
    agentCount: 1, phase: 'POC', startDate: 'Jan 2026',
    technologies: ['Azure Document Intelligence', 'Power Apps'],
    description: 'Extracts structured data from invoices and vendor documents automatically, eliminating manual data entry in AP workflows.',
    benefitSummary: 'Eliminates 80% of manual data entry', costSavingAED: 210000,
  },
  {
    id: 'uc-004', name: 'HR Onboarding Assistant',
    status: 'Active', division: 'Human Resources', department: 'Talent Acquisition',
    agentCount: 2, phase: 'Production', startDate: 'Oct 2025',
    technologies: ['Copilot Studio', 'Power Automate'],
    description: 'Guides new employees through onboarding tasks, answers HR policy questions, and automates document collection workflows.',
    benefitSummary: 'Onboarding time cut from 5 days to 1.5 days', costSavingAED: 180000,
  },
  {
    id: 'uc-005', name: 'Asset Inspection AI',
    status: 'Active', division: 'Operations', department: 'Field Services',
    agentCount: 2, phase: 'Production', startDate: 'Jul 2025',
    technologies: ['Azure ML', 'Azure OpenAI'],
    description: 'Analyzes field inspection photos and sensor data to identify equipment defects and prioritize maintenance work orders.',
    benefitSummary: 'Defect detection accuracy improved by 44%', costSavingAED: 560000,
  },
  {
    id: 'uc-006', name: 'Predictive Maintenance Engine',
    status: 'Active', division: 'Engineering', department: 'Asset Management',
    agentCount: 3, phase: 'Production', startDate: 'Jun 2025',
    technologies: ['Azure ML', 'Power Automate', 'Power Apps'],
    description: 'Predicts equipment failure probability using sensor telemetry, enabling proactive maintenance scheduling before failures occur.',
    benefitSummary: 'Unplanned downtime reduced by 52%', costSavingAED: 740000,
  },
  {
    id: 'uc-007', name: 'Regulatory Reporting Automation',
    status: 'Completed', division: 'Compliance', department: 'Regulatory Affairs',
    agentCount: 1, phase: 'Completed', startDate: 'Mar 2025',
    technologies: ['Azure OpenAI', 'Power Automate'],
    description: 'Automates the compilation and formatting of mandatory regulatory reports, cross-referencing data sources and flagging anomalies.',
    benefitSummary: '90% reduction in report preparation time', costSavingAED: 130000,
  },
  {
    id: 'uc-008', name: 'Water Quality Monitoring',
    status: 'POC', division: 'Environment', department: 'Water Operations',
    agentCount: 2, phase: 'POC', startDate: 'Feb 2026',
    technologies: ['Azure ML', 'Copilot Studio'],
    description: 'Continuously monitors water quality sensor streams, detects parameter deviations, and generates automated compliance alerts.',
    benefitSummary: 'Monitoring coverage increased by 300%', costSavingAED: 270000,
  },
]

const AGENTS: Agent[] = [
  { id: 'agt-001', useCaseId: 'uc-001', name: 'Meter Anomaly Scorer',     status: 'Production',  technology: 'Azure ML',                    accuracyScore: 94, responseTimeSec: 0.8,  uptime: 99.2, evalScore: 96, monthlyCallCount: 18400, costPerMonthAED: 4200 },
  { id: 'agt-002', useCaseId: 'uc-001', name: 'Alert Dispatcher',          status: 'Production',  technology: 'Power Automate',              accuracyScore: 99, responseTimeSec: 1.2,  uptime: 99.8, evalScore: 99, monthlyCallCount: 6200,  costPerMonthAED: 800  },
  { id: 'agt-003', useCaseId: 'uc-001', name: 'Threshold Calibration Bot', status: 'Testing',     technology: 'Copilot Studio',              accuracyScore: 82, responseTimeSec: 2.1,  uptime: 97.4, evalScore: 80, monthlyCallCount: 1200,  costPerMonthAED: 600  },
  { id: 'agt-004', useCaseId: 'uc-002', name: 'Complaint Classifier',      status: 'Production',  technology: 'Azure OpenAI',                accuracyScore: 91, responseTimeSec: 1.4,  uptime: 98.9, evalScore: 93, monthlyCallCount: 22000, costPerMonthAED: 5100 },
  { id: 'agt-005', useCaseId: 'uc-002', name: 'Routing Orchestrator',      status: 'Production',  technology: 'Copilot Studio',              accuracyScore: 97, responseTimeSec: 0.6,  uptime: 99.5, evalScore: 97, monthlyCallCount: 22000, costPerMonthAED: 1200 },
  { id: 'agt-006', useCaseId: 'uc-003', name: 'Invoice Data Extractor',    status: 'Development', technology: 'Azure Document Intelligence', accuracyScore: 88, responseTimeSec: 3.2,  uptime: 95.0, evalScore: 84, monthlyCallCount: 3400,  costPerMonthAED: 2800 },
  { id: 'agt-007', useCaseId: 'uc-004', name: 'Onboarding Guide Agent',    status: 'Production',  technology: 'Copilot Studio',              accuracyScore: 93, responseTimeSec: 1.1,  uptime: 99.1, evalScore: 91, monthlyCallCount: 840,   costPerMonthAED: 900  },
  { id: 'agt-008', useCaseId: 'uc-004', name: 'Document Collection Bot',   status: 'Production',  technology: 'Power Automate',              accuracyScore: 98, responseTimeSec: 0.9,  uptime: 99.6, evalScore: 98, monthlyCallCount: 840,   costPerMonthAED: 400  },
  { id: 'agt-009', useCaseId: 'uc-005', name: 'Defect Vision Classifier',  status: 'Production',  technology: 'Azure ML',                    accuracyScore: 92, responseTimeSec: 2.8,  uptime: 98.3, evalScore: 90, monthlyCallCount: 9600,  costPerMonthAED: 3800 },
  { id: 'agt-010', useCaseId: 'uc-005', name: 'Work Order Prioritizer',    status: 'Testing',     technology: 'Azure OpenAI',                accuracyScore: 85, responseTimeSec: 1.6,  uptime: 97.2, evalScore: 83, monthlyCallCount: 4200,  costPerMonthAED: 1600 },
  { id: 'agt-011', useCaseId: 'uc-006', name: 'Failure Probability Model', status: 'Production',  technology: 'Azure ML',                    accuracyScore: 89, responseTimeSec: 4.5,  uptime: 98.7, evalScore: 88, monthlyCallCount: 14000, costPerMonthAED: 5600 },
  { id: 'agt-012', useCaseId: 'uc-006', name: 'Maintenance Scheduler',     status: 'Production',  technology: 'Power Automate',              accuracyScore: 96, responseTimeSec: 1.0,  uptime: 99.4, evalScore: 95, monthlyCallCount: 8200,  costPerMonthAED: 1100 },
  { id: 'agt-013', useCaseId: 'uc-006', name: 'Parts Demand Forecaster',   status: 'Development', technology: 'Power Apps',                  accuracyScore: 78, responseTimeSec: 3.8,  uptime: 94.0, evalScore: 74, monthlyCallCount: 2100,  costPerMonthAED: 700  },
  { id: 'agt-014', useCaseId: 'uc-007', name: 'Regulatory Report Builder', status: 'Production',  technology: 'Azure OpenAI',                accuracyScore: 97, responseTimeSec: 12.0, uptime: 99.0, evalScore: 96, monthlyCallCount: 180,   costPerMonthAED: 2400 },
  { id: 'agt-015', useCaseId: 'uc-008', name: 'Water Quality Classifier',  status: 'Development', technology: 'Azure ML',                    accuracyScore: 81, responseTimeSec: 2.4,  uptime: 93.5, evalScore: 76, monthlyCallCount: 28000, costPerMonthAED: 3200 },
  { id: 'agt-016', useCaseId: 'uc-008', name: 'Compliance Alert Agent',    status: 'Testing',     technology: 'Copilot Studio',              accuracyScore: 87, responseTimeSec: 1.3,  uptime: 96.8, evalScore: 85, monthlyCallCount: 6400,  costPerMonthAED: 1100 },
]

// Maps each agent to its pipeline stage
const AGENT_STAGE: Record<string, StageId> = {
  'agt-001': 'ai-idc',      // Meter Anomaly Scorer → core AI
  'agt-002': 'output',      // Alert Dispatcher → delivery
  'agt-003': 'post-check',  // Threshold Calibration Bot → post-validation
  'agt-004': 'ai-idc',      // Complaint Classifier → core AI
  'agt-005': 'output',      // Routing Orchestrator → delivery
  'agt-006': 'ai-idc',      // Invoice Data Extractor → core AI
  'agt-007': 'ai-idc',      // Onboarding Guide Agent → core AI
  'agt-008': 'input',       // Document Collection Bot → data retrieval
  'agt-009': 'ai-idc',      // Defect Vision Classifier → core AI
  'agt-010': 'post-check',  // Work Order Prioritizer → post-validation
  'agt-011': 'ai-idc',      // Failure Probability Model → core AI
  'agt-012': 'output',      // Maintenance Scheduler → delivery
  'agt-013': 'post-check',  // Parts Demand Forecaster → post-validation
  'agt-014': 'ai-idc',      // Regulatory Report Builder → core AI
  'agt-015': 'ai-idc',      // Water Quality Classifier → core AI
  'agt-016': 'output',      // Compliance Alert Agent → delivery
}

const PIPELINE_STAGES: { id: StageId; name: string; icon: string; color: string; description: string }[] = [
  { id: 'input',      name: 'Input Data Retrieval',  icon: 'bi-inbox',           color: '#0891b2', description: 'Ingests raw data from source systems & sensors' },
  { id: 'pre-check',  name: 'Pre-Validation Check',  icon: 'bi-search',          color: '#6366f1', description: 'Validates data quality, schema & completeness' },
  { id: 'ai-idc',     name: 'AI Processing (IDC)',   icon: 'bi-cpu-fill',        color: '#007560', description: 'Core AI inference & decision component' },
  { id: 'post-check', name: 'Post-Validation Check', icon: 'bi-shield-check',    color: '#ca8a04', description: 'Output confidence review & business rule check' },
  { id: 'output',     name: 'Output & Delivery',     icon: 'bi-send',            color: '#059669', description: 'Results dispatched to downstream systems' },
  { id: 'monitoring', name: 'Logging & Monitoring',  icon: 'bi-activity',        color: '#7c3aed', description: 'Observability, drift detection & audit trail' },
]

// Per-agent pipeline stage notes (unique for each agent)
const AGENT_PIPELINE_NOTES: Record<string, Record<StageId, string[]>> = {
  'agt-001': {
    input:       ['AMI meter readings (15-min intervals)', 'SAP IS-U historical consumption', 'Weather API correlation data'],
    'pre-check': ['Null/missing reading detection', 'Value range validation (0–5000 kWh)', 'Time-series gap check'],
    'ai-idc':    ['Isolation Forest anomaly model (v3.2)', 'Rolling 30-day baseline comparison', 'Confidence score per meter'],
    'post-check':['Score threshold filter (>0.85)', 'Seasonal pattern cross-check', 'Duplicate anomaly suppression (24h)'],
    output:      ['Push alert to field technician app', 'Create work order in Dynamics 365', 'Update anomaly registry'],
    monitoring:  ['Daily model drift score calc', 'Precision/recall in Azure Monitor', 'Weekly calibration review'],
  },
  'agt-002': {
    input:       ['Anomaly alerts from Meter Anomaly Scorer', 'Field team availability schedule', 'Priority classification result'],
    'pre-check': ['Alert deduplication (15-min window)', 'Field team shift validation', 'Geographic zone assignment check'],
    'ai-idc':    ['Rule-based priority routing engine', 'Team load balancing algorithm', 'SLA escalation trigger logic'],
    'post-check':['Confirm dispatch acknowledgement', 'SLA time-to-dispatch validation (<5 min)', 'Coverage gap detection'],
    output:      ['Push notification to field mobile app', 'Email digest to NOC supervisor', 'Teams alert to on-call engineer'],
    monitoring:  ['Dispatch success rate KPI', 'SLA breach count tracking', 'Power Automate flow run history'],
  },
  'agt-003': {
    input:       ['Historical anomaly ground-truth labels', 'Seasonal demand pattern data', 'False positive reports from field'],
    'pre-check': ['Sufficient data volume check (≥30 days)', 'Label quality validation', 'Seasonal period alignment check'],
    'ai-idc':    ['Threshold optimization (Bayesian)', 'False positive rate minimization', 'Precision-recall curve analysis'],
    'post-check':['Proposed threshold human review gate', 'A/B impact simulation', 'Rollback plan validation'],
    output:      ['Update model thresholds in Azure ML', 'Publish calibration report to SharePoint', 'Notify ML Ops team'],
    monitoring:  ['Calibration run logs', 'Before/after FP rate comparison', 'Monthly calibration schedule'],
  },
  'agt-004': {
    input:       ['Inbound call transcripts (post-ASR)', 'Chat session text from web/app', 'Email body from support inbox'],
    'pre-check': ['Language detection & ISO 639-1 tagging', 'PII masking (name, account number)', 'Min token length check (>5 words)'],
    'ai-idc':    ['GPT-4o classification prompt chain', '34-category taxonomy inference', 'Urgency & sentiment scoring'],
    'post-check':['Low-confidence flag (<0.70)', 'Multi-label conflict resolution', 'SLA priority assignment (P1–P4)'],
    output:      ['Route to department queue in ServiceNow', 'Auto-populate CRM case fields', 'Customer acknowledgement SMS'],
    monitoring:  ['Classification accuracy dashboard', 'Category distribution drift alert', 'Daily inference cost report'],
  },
  'agt-005': {
    input:       ['Classified complaint from Complaint Classifier', 'Agent availability from CRM', 'Customer tier & history data'],
    'pre-check': ['Classifier confidence ≥0.70 gate', 'Agent availability slot check', 'Customer profile enrichment'],
    'ai-idc':    ['Skills-based routing rule engine', 'Customer tier priority weighting', 'Workload balancing calculation'],
    'post-check':['Route confirmation to receiving agent', 'Escalation path validation', 'SLA compliance pre-check'],
    output:      ['Assign case in ServiceNow queue', 'Notify receiving agent via Teams bot', 'Update CRM case routing log'],
    monitoring:  ['First-contact resolution rate', 'Routing accuracy KPI (monthly)', 'Queue depth trend in Power BI'],
  },
  'agt-006': {
    input:       ['Scanned PDF invoices from SharePoint', 'Email attachments from vendor inbox', 'EDI invoice feeds from ERP'],
    'pre-check': ['File format validation (PDF/TIFF/PNG)', 'DPI resolution check (≥200 dpi)', 'Duplicate invoice hash check'],
    'ai-idc':    ['Azure Form Recognizer pre-built model', 'Custom field extraction (PO, tax, lines)', 'Confidence score per field'],
    'post-check':['Amount tolerance check (±0.5% vs PO)', 'Tax code validation against SAP table', 'Mandatory field completeness'],
    output:      ['Post data to SAP FICO AP module', 'Trigger 3-way match workflow', 'Notify approver via Power Automate'],
    monitoring:  ['Field extraction accuracy per vendor', 'Exception rate by document type', 'Processing time P95 latency'],
  },
  'agt-007': {
    input:       ['New employee record from SuccessFactors', 'Onboarding task template by dept', 'IT access requirements'],
    'pre-check': ['Employee profile completeness check', 'Department & role mapping validation', 'Start date ≥1 day ahead check'],
    'ai-idc':    ['Copilot Studio conversational flow engine', 'HR policy Q&A knowledge base (RAG)', 'Personalized task sequencing'],
    'post-check':['Mandatory task completion gate', 'Manager confirmation checkpoint', 'Missing document flagging'],
    output:      ['HR manager dashboard in Power Apps', 'IT access provisioning trigger', 'Welcome kit delivery scheduling'],
    monitoring:  ['Onboarding completion rate by dept', 'Query resolution rate (bot vs human)', 'Employee CSAT survey score'],
  },
  'agt-008': {
    input:       ['Onboarding checklist from HR system', 'Employee email & SharePoint access', 'Document template library'],
    'pre-check': ['Required document list completeness', 'Employee identity verification', 'SharePoint folder access check'],
    'ai-idc':    ['Automated reminder scheduling engine', 'Document receipt confirmation logic', 'Escalation trigger for overdue items'],
    'post-check':['All mandatory docs received gate', 'Document format validation (PDF/DOCX)', 'Expiry date check on certifications'],
    output:      ['Mark checklist complete in HRIS', 'Notify onboarding manager', 'Archive signed copies to employee vault'],
    monitoring:  ['Collection completion rate by cohort', 'Avg days-to-complete tracking', 'Power Automate flow run analytics'],
  },
  'agt-009': {
    input:       ['Field inspection photos (mobile app)', 'GPS-tagged asset location data', 'Asset master data from MAXIMO'],
    'pre-check': ['Image resolution check (≥1MP)', 'GPS accuracy validation (<10m)', 'Asset ID barcode scan verification'],
    'ai-idc':    ['ResNet-50 transfer learning classifier', '14 defect category taxonomy', 'Severity scoring model (1–5 scale)'],
    'post-check':['Severity ≥4 human review gate', 'Duplicate vs open WO check', 'Safety flag escalation (severity 5)'],
    output:      ['Create/update MAXIMO work order', 'Notify field supervisor via Teams', 'Update asset health registry score'],
    monitoring:  ['Detection precision by asset class', 'Inspector app usage metrics', 'False positive rate by defect type'],
  },
  'agt-010': {
    input:       ['Defect classification from Vision Classifier', 'Asset criticality scores from registry', 'Maintenance team capacity data'],
    'pre-check': ['Asset criticality tier validation', 'Crew availability window check', 'Parts & materials inventory check'],
    'ai-idc':    ['GPT-4o reasoning for priority ranking', 'Risk-impact scoring matrix', 'Optimal scheduling window calculation'],
    'post-check':['Planner review gate for P1 assets', 'Schedule conflict resolution check', 'SLA compliance pre-validation'],
    output:      ['Update MAXIMO work order priority', 'Schedule to field crew calendar', 'Notify procurement for parts'],
    monitoring:  ['Planned vs emergency WO ratio', 'Schedule adherence KPI', 'Cost avoidance per prioritization'],
  },
  'agt-011': {
    input:       ['SCADA sensor time-series (100Hz)', 'Equipment maintenance history logs', 'Vendor MTBF specifications'],
    'pre-check': ['Sensor signal quality validation (SNR>20dB)', 'Missing data interpolation (<5% gaps)', 'Asset criticality classification'],
    'ai-idc':    ['Gradient Boosting failure probability model', 'Remaining Useful Life (RUL) calculation', 'Multi-asset correlation analysis'],
    'post-check':['Probability threshold filter (>70%)', 'Maintenance window feasibility check', 'Fleet-wide impact assessment'],
    output:      ['Maintenance prediction to SAP PM module', 'Failure risk report to asset managers', 'Trigger SAP PM work order'],
    monitoring:  ['Model recall on actual failures (monthly)', 'RUL prediction error (MAE)', 'Sensor data quality index'],
  },
  'agt-012': {
    input:       ['Failure predictions from Failure Probability Model', 'Crew availability from workforce system', 'Spare parts stock from SAP MM'],
    'pre-check': ['Prediction confidence ≥70% gate', 'Crew qualification match check', 'Parts lead time vs urgency check'],
    'ai-idc':    ['Rule-based optimal scheduling engine', 'Crew-asset skill matching logic', 'Parts procurement trigger rules'],
    'post-check':['Schedule conflict validation', 'Supervisor approval for P1 jobs', 'Safety permit pre-check'],
    output:      ['Schedule to SAP PM maintenance calendar', 'Parts requisition to procurement', 'Crew notification via mobile app'],
    monitoring:  ['Schedule adherence rate', 'Mean time to schedule (MTTS)', 'Power Automate run history'],
  },
  'agt-013': {
    input:       ['Maintenance schedule from Scheduler agent', 'Historical parts consumption data', 'Vendor lead time data from SAP MM'],
    'pre-check': ['Part number validity check (SAP catalog)', 'Historical data sufficiency (≥12 months)', 'Seasonal adjustment flag check'],
    'ai-idc':    ['Time-series demand forecasting model', 'Safety stock optimization algorithm', 'Supplier lead time risk model'],
    'post-check':['Forecast variance vs actual review', 'Budget availability check', 'Critical spares minimum stock gate'],
    output:      ['Auto-generate purchase requisition in SAP', 'Update min/max stock levels', 'Alert procurement planner for exceptions'],
    monitoring:  ['Forecast accuracy (MAPE)', 'Stockout incident rate', 'Inventory cost reduction tracking'],
  },
  'agt-014': {
    input:       ['Operational data from 14 source systems', 'Previous submission templates', 'Regulatory framework requirements'],
    'pre-check': ['Data completeness verification (all fields)', 'Regulatory deadline countdown check', 'Source system reconciliation check'],
    'ai-idc':    ['GPT-4o report generation (structured output)', 'Cross-reference data validation logic', 'Regulatory language compliance check'],
    'post-check':['Compliance officer review gate (mandatory)', 'Numerical accuracy spot-check', 'Digital signature pre-validation'],
    output:      ['Submit to DEWA regulatory portal', 'Archive signed copy to SharePoint DMS', 'Email confirmation to compliance team'],
    monitoring:  ['Submission on-time rate (100% target)', 'Review cycle time (days)', 'Regulatory portal submission status'],
  },
  'agt-015': {
    input:       ['IoT water sensor network (120 stations)', 'Lab analysis results (daily batch)', 'Environmental flow data'],
    'pre-check': ['Sensor calibration status check', 'Reading range validation per parameter', 'Station connectivity status check'],
    'ai-idc':    ['Multi-parameter anomaly detection model', 'WHO/UAE standard compliance scoring', 'Contamination probability classifier'],
    'post-check':['Alert deduplication (15-min window)', 'False alarm suppression model', 'Escalation level assignment (L1–L3)'],
    output:      ['SMS/email alert to operations duty manager', 'Log compliance event in Dataverse', 'Notify DEWA Environment team'],
    monitoring:  ['Sensor uptime by station (%)', 'Alert false positive rate', 'Detection sensitivity vs specificity'],
  },
  'agt-016': {
    input:       ['Water quality classifications from Classifier', 'Regulatory threshold reference table', 'Duty manager contact directory'],
    'pre-check': ['Threshold exceedance severity check', 'On-call manager availability check', 'Regulatory notification window check'],
    'ai-idc':    ['Alert severity routing rule engine', 'Regulatory escalation protocol logic', 'Notification channel selection model'],
    'post-check':['Acknowledgement receipt confirmation', 'Secondary escalation timer (15 min)', 'Report generation trigger'],
    output:      ['Multi-channel alert dispatch (SMS/email/Teams)', 'Generate compliance incident report', 'Update regulatory event log'],
    monitoring:  ['Alert delivery success rate (>99.9%)', 'Time-to-acknowledge metric', 'Escalation rate per threshold type'],
  },
}

// Per-use-case benefits comparison
const UC_BENEFITS: Record<string, BenefitComparison[]> = {
  'uc-001': [
    { metric: 'Manual Inspections', before: '840/month', after: '320/month', improvement: '−62%', color: 'green',  icon: 'bi-search' },
    { metric: 'Detection Accuracy', before: '71%',       after: '94%',       improvement: '+23pp', color: 'blue',   icon: 'bi-bullseye' },
    { metric: 'Avg Response Time',  before: '4.2 hours', after: '8 minutes', improvement: '−97%',  color: 'amber',  icon: 'bi-clock-history' },
    { metric: 'Annual Opex',        before: 'AED 640K',  after: 'AED 160K',  improvement: '−75%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
  'uc-002': [
    { metric: 'Avg Handle Time',    before: '8.4 min',  after: '5.2 min',   improvement: '−38%',  color: 'green',  icon: 'bi-clock-history' },
    { metric: 'Misroute Rate',      before: '22%',      after: '4%',        improvement: '−82%',  color: 'blue',   icon: 'bi-arrow-right' },
    { metric: 'FCR Rate',           before: '61%',      after: '84%',       improvement: '+23pp', color: 'amber',  icon: 'bi-check-circle-fill' },
    { metric: 'Annual Labour Cost', before: 'AED 520K', after: 'AED 200K',  improvement: '−62%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
  'uc-003': [
    { metric: 'Manual Data Entry',  before: '100%',     after: '20%',       improvement: '−80%',  color: 'green',  icon: 'bi-table' },
    { metric: 'Processing Time',    before: '4.5 days', after: '6 hours',   improvement: '−94%',  color: 'blue',   icon: 'bi-clock-history' },
    { metric: 'Entry Error Rate',   before: '3.4%',     after: '0.3%',      improvement: '−91%',  color: 'amber',  icon: 'bi-shield-check' },
    { metric: 'Annual Saving',      before: 'AED 310K', after: 'AED 100K',  improvement: '−68%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
  'uc-004': [
    { metric: 'Onboarding Duration',before: '5 days',   after: '1.5 days',  improvement: '−70%',  color: 'green',  icon: 'bi-clock-history' },
    { metric: 'HR Query Volume',    before: '340/mo',   after: '90/mo',     improvement: '−74%',  color: 'blue',   icon: 'bi-people-fill' },
    { metric: 'Task Completion',    before: '68%',      after: '96%',       improvement: '+28pp', color: 'amber',  icon: 'bi-check-circle-fill' },
    { metric: 'Annual HR Cost',     before: 'AED 260K', after: 'AED 80K',   improvement: '−69%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
  'uc-005': [
    { metric: 'Defect Detection',   before: '68%',      after: '92%',       improvement: '+24pp', color: 'green',  icon: 'bi-bullseye' },
    { metric: 'Inspection Cost',    before: 'AED 820K', after: 'AED 260K',  improvement: '−68%',  color: 'blue',   icon: 'bi-currency-dirham' },
    { metric: 'Re-inspection Rate', before: '34%',      after: '8%',        improvement: '−76%',  color: 'amber',  icon: 'bi-shield-check' },
    { metric: 'Fault-to-fix Time',  before: '6.2 days', after: '1.8 days',  improvement: '−71%',  color: 'purple', icon: 'bi-clock-history' },
  ],
  'uc-006': [
    { metric: 'Unplanned Downtime', before: '420 hrs/yr',after: '200 hrs/yr',improvement: '−52%', color: 'green',  icon: 'bi-activity' },
    { metric: 'Maintenance Cost',   before: 'AED 1.4M', after: 'AED 0.66M', improvement: '−53%', color: 'blue',   icon: 'bi-currency-dirham' },
    { metric: 'Asset Availability', before: '87.4%',    after: '96.8%',     improvement: '+9pp',  color: 'amber',  icon: 'bi-graph-up-arrow' },
    { metric: 'Emergency Calls',    before: '48/month', after: '14/month',  improvement: '−71%',  color: 'purple', icon: 'bi-shield-check' },
  ],
  'uc-007': [
    { metric: 'Prep Time/Report',   before: '3.5 days', after: '4 hours',   improvement: '−95%',  color: 'green',  icon: 'bi-clock-history' },
    { metric: 'Data Errors',        before: '2.1%',     after: '0.1%',      improvement: '−95%',  color: 'blue',   icon: 'bi-shield-check' },
    { metric: 'Compliance Rate',    before: '91%',      after: '100%',      improvement: '+9pp',  color: 'amber',  icon: 'bi-check-circle-fill' },
    { metric: 'Annual Labour Save', before: 'AED 210K', after: 'AED 80K',   improvement: '−62%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
  'uc-008': [
    { metric: 'Monitoring Coverage',before: '28 pts',   after: '120 pts',   improvement: '+329%', color: 'green',  icon: 'bi-activity' },
    { metric: 'Alert Lead Time',    before: '2.5 hours',after: '12 minutes',improvement: '−92%',  color: 'blue',   icon: 'bi-clock-history' },
    { metric: 'False Alarms',       before: '18/month', after: '3/month',   improvement: '−83%',  color: 'amber',  icon: 'bi-shield-check' },
    { metric: 'Annual Opex',        before: 'AED 440K', after: 'AED 170K',  improvement: '−61%',  color: 'purple', icon: 'bi-currency-dirham' },
  ],
}

// ROI trend (overall)
const ROI_TREND = [
  { month: 'Oct', savingsAED: 180, hoursAutomated: 1200 },
  { month: 'Nov', savingsAED: 240, hoursAutomated: 1600 },
  { month: 'Dec', savingsAED: 290, hoursAutomated: 1900 },
  { month: 'Jan', savingsAED: 380, hoursAutomated: 2400 },
  { month: 'Feb', savingsAED: 450, hoursAutomated: 2900 },
  { month: 'Mar', savingsAED: 510, hoursAutomated: 3400 },
]

// Technology utilization (for the tech tab inside drawer)
const TECH_META: Record<string, { color: string; description: string; monthlyCostAED: number; useCaseCount: number }> = {
  'Azure OpenAI':               { color: '#0891b2', description: 'Large language model API for NLP, classification and generation tasks', monthlyCostAED: 18400, useCaseCount: 4 },
  'Azure ML':                   { color: '#ca8a04', description: 'End-to-end ML platform for model training, deployment and monitoring', monthlyCostAED: 14200, useCaseCount: 4 },
  'Power Automate':             { color: '#007560', description: 'Low-code workflow automation for system integrations and data routing', monthlyCostAED: 4800,  useCaseCount: 5 },
  'Copilot Studio':             { color: '#6366f1', description: 'Conversational AI and chatbot platform with custom Knowledge bases', monthlyCostAED: 9200,  useCaseCount: 4 },
  'Azure Document Intelligence':{ color: '#7c3aed', description: 'AI-powered form & document data extraction service', monthlyCostAED: 2800,  useCaseCount: 1 },
  'Power Apps':                 { color: '#ea580c', description: 'Low-code app builder for custom UI and data entry workflows', monthlyCostAED: 1600,  useCaseCount: 2 },
}


const TOOLTIP_STYLE = {
  background: 'rgba(28,28,30,0.93)', borderRadius: 9,
  padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.25)', border: 'none',
  color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 }

// Status color map
const STATUS_COLOR: Record<UseCaseStatus, string> = {
  'Active':    '#007560',
  'POC':       '#0891b2',
  'Completed': '#6366f1',
  'On Hold':   '#ca8a04',
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

function useCounter(target: number, duration: number, go: boolean): number {
  const [val, setVal] = useState(0)
  const raf = useRef(0)
  useEffect(() => {
    if (!go) return
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, go])
  return val
}

// ─── Shared Badges ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: UseCaseStatus }) {
  const cls = status === 'On Hold' ? 'on-hold' : status.toLowerCase()
  return <span className={`alh-badge alh-badge--${cls}`}>{status}</span>
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, target, displayValue, sub, accent, delay, go }: {
  icon: string; label: string; target: number; displayValue?: string
  sub: string; accent: string; delay: number; go: boolean
}) {
  const count = useCounter(target, 1400, go)
  return (
    <div className="alh-kpi-card" style={{ '--alh-accent': accent, animationDelay: `${delay}s` } as React.CSSProperties}>
      <div className="alh-kpi-shimmer" />
      <div className="alh-kpi-icon"><Icon name={icon} aria-hidden="true" /></div>
      <div className={`alh-kpi-value${go ? ' alh-kpi-value--in' : ''}`}>{displayValue ?? count}</div>
      <div className="alh-kpi-label">{label}</div>
      <div className="alh-kpi-sub">{sub}</div>
    </div>
  )
}

// ─── Use Case Card (redesigned) ───────────────────────────────────────────────
function UseCaseCard({ uc, onClick }: { uc: UseCase; onClick: () => void }) {
  const accentColor = STATUS_COLOR[uc.status]
  return (
    <div className="alh-uc2-card" onClick={onClick}
      style={{ '--alh-uc-accent': accentColor } as React.CSSProperties}>
      {/* Colored top ribbon */}
      <div className="alh-uc2-ribbon">
        <StatusBadge status={uc.status} />
      </div>
      <div className="alh-uc2-body">
        <div className="alh-uc2-name">{uc.name}</div>
        <div className="alh-uc2-desc">{uc.description}</div>
        <div className="alh-uc2-tech-row">
          {uc.technologies.map(t => (
            <span key={t} className="alh-uc-tech-tag">{t}</span>
          ))}
        </div>
      </div>
      <div className="alh-uc2-footer">
        <div className="alh-uc2-meta">
          <span className="alh-uc2-agents">
            <Icon name="bi-cpu-fill" aria-hidden="true" />{uc.agentCount} agents
          </span>
          <span className="alh-uc2-phase">{uc.phase}</span>
        </div>
        <div className="alh-uc2-saving">
          AED {uc.costSavingAED >= 1000000
            ? `${(uc.costSavingAED / 1000000).toFixed(1)}M`
            : `${(uc.costSavingAED / 1000).toFixed(0)}K`}
          <span className="alh-uc2-saving-label">/yr saved</span>
        </div>
        <button className="alh-uc2-cta">
          View Details <Icon name="bi-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}

// ─── Drawer: Overview Tab ─────────────────────────────────────────────────────
function OverviewTab({ uc }: { uc: UseCase }) {
  const agents = AGENTS.filter(a => a.useCaseId === uc.id)
  const avgUptime = agents.length
    ? Math.round(agents.reduce((s, a) => s + a.uptime, 0) / agents.length * 10) / 10
    : 0
  const avgEval = agents.length
    ? Math.round(agents.reduce((s, a) => s + a.evalScore, 0) / agents.length)
    : 0

  return (
    <div className="alh-dtab-content">
      {/* 4 metric tiles */}
      <div className="alh-ov-metrics">
        <div className="alh-ov-tile alh-ov-tile--green">
          <Icon name="bi-cpu-fill" aria-hidden="true" />
          <div className="alh-ov-tile-value">{uc.agentCount}</div>
          <div className="alh-ov-tile-label">Agents</div>
        </div>
        <div className="alh-ov-tile alh-ov-tile--blue">
          <Icon name="bi-speedometer2" aria-hidden="true" />
          <div className="alh-ov-tile-value">{avgEval}</div>
          <div className="alh-ov-tile-label">Avg Eval Score</div>
        </div>
        <div className="alh-ov-tile alh-ov-tile--gold">
          <Icon name="bi-currency-dirham" aria-hidden="true" />
          <div className="alh-ov-tile-value">
            {uc.costSavingAED >= 1000000
              ? `${(uc.costSavingAED / 1000000).toFixed(1)}M`
              : `${(uc.costSavingAED / 1000).toFixed(0)}K`}
          </div>
          <div className="alh-ov-tile-label">AED Saved/yr</div>
        </div>
        <div className="alh-ov-tile alh-ov-tile--teal">
          <Icon name="bi-activity" aria-hidden="true" />
          <div className="alh-ov-tile-value">{avgUptime}%</div>
          <div className="alh-ov-tile-label">Avg Uptime</div>
        </div>
      </div>

      {/* Description */}
      <div className="alh-ov-block">
        <div className="alh-ov-block-title">
          <Icon name="bi-info-circle" aria-hidden="true" /> Use Case Description
        </div>
        <p className="alh-ov-desc">{uc.description}</p>
        <div className="alh-ov-benefit-chip">
          <Icon name="bi-graph-up-arrow" aria-hidden="true" />
          {uc.benefitSummary}
        </div>
      </div>

      {/* Meta info */}
      <div className="alh-ov-meta-grid">
        <div className="alh-ov-meta-item">
          <span className="alh-ov-meta-label">Division</span>
          <span className="alh-ov-meta-value">{uc.division}</span>
        </div>
        <div className="alh-ov-meta-item">
          <span className="alh-ov-meta-label">Department</span>
          <span className="alh-ov-meta-value">{uc.department}</span>
        </div>
        <div className="alh-ov-meta-item">
          <span className="alh-ov-meta-label">Launch Date</span>
          <span className="alh-ov-meta-value">{uc.startDate}</span>
        </div>
        <div className="alh-ov-meta-item">
          <span className="alh-ov-meta-label">Current Phase</span>
          <span className="alh-ov-meta-value">{uc.phase}</span>
        </div>
      </div>

      {/* Phase progress track */}
      <div className="alh-ov-block">
        <div className="alh-ov-block-title">
          <Icon name="bi-diagram-3-fill" aria-hidden="true" /> Maturity Track
        </div>
        <div className="alh-phase-track">
          {['Ideation', 'POC', 'Development', 'Testing', 'Production'].map((phase, i) => {
            const phases = ['Ideation', 'POC', 'Development', 'Testing', 'Production']
            const currentIdx = phases.indexOf(uc.phase)
            const isCompleted = i <= currentIdx
            const isActive = i === currentIdx
            return (
              <div key={phase} className="alh-phase-step">
                <div className={`alh-phase-dot${isCompleted ? ' alh-phase-dot--done' : ''}${isActive ? ' alh-phase-dot--active' : ''}`} />
                <span className={`alh-phase-label${isActive ? ' alh-phase-label--active' : ''}`}>{phase}</span>
                {i < 4 && <div className={`alh-phase-line${isCompleted && i < currentIdx ? ' alh-phase-line--done' : ''}`} />}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Drawer: Agent Detail View ────────────────────────────────────────────────
function AgentDetailView({ agent, onBack }: { agent: Agent; onBack: () => void }) {
  const notes = AGENT_PIPELINE_NOTES[agent.id] ?? {}
  const primaryStage = AGENT_STAGE[agent.id]

  return (
    <div className="alh-dtab-content">
      <button className="alh-agent-back" onClick={onBack}>
        <span className="alh-back-icon"><Icon name="bi-arrow-right" aria-hidden="true" /></span>
        Back to Agents
      </button>

      <div className="alh-agent-detail-header">
        <div className="alh-adh-left">
          <span className={`alh-pa-dot alh-pa-dot--${agent.status.toLowerCase()}`} />
          <div>
            <div className="alh-adh-name">{agent.name}</div>
            <div className="alh-adh-tech">{agent.technology} · {agent.status}</div>
          </div>
        </div>
        <div className="alh-adh-stats">
          <div className="alh-adh-stat">
            <span className="alh-adh-stat-value">{agent.accuracyScore}%</span>
            <span className="alh-adh-stat-label">Accuracy</span>
          </div>
          <div className="alh-adh-stat">
            <span className={`alh-adh-stat-value ${agent.evalScore >= 90 ? 'alh-score-high' : agent.evalScore >= 70 ? 'alh-score-mid' : 'alh-score-low'}`}>{agent.evalScore}</span>
            <span className="alh-adh-stat-label">Eval Score</span>
          </div>
          <div className="alh-adh-stat">
            <span className="alh-adh-stat-value">{agent.uptime}%</span>
            <span className="alh-adh-stat-label">Uptime</span>
          </div>
          <div className="alh-adh-stat">
            <span className="alh-adh-stat-value">{agent.responseTimeSec}s</span>
            <span className="alh-adh-stat-label">Response</span>
          </div>
        </div>
      </div>

      <div className="alh-pipeline-header">
        <span className="alh-pipeline-subtitle">
          Agent pipeline · stage <strong>{PIPELINE_STAGES.findIndex(s => s.id === primaryStage) + 1}</strong> is this agent's primary role
        </span>
      </div>

      <div className="alh-pipeline-scroll">
        <div className="alh-pipeline-track">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isPrimary = stage.id === primaryStage
            const isLast = idx === PIPELINE_STAGES.length - 1
            const stageNotes = notes[stage.id] ?? []
            return (
              <div key={stage.id} className={`alh-pipeline-col${isPrimary ? ' alh-pipeline-col--primary' : ''}`}>
                <div className="alh-stage-node" style={{ '--alh-stage-color': stage.color } as React.CSSProperties}>
                  <div className="alh-stage-num">{idx + 1}</div>
                  <div className="alh-stage-icon-wrap">
                    <Icon name={stage.icon} aria-hidden="true" />
                  </div>
                  <div className="alh-stage-name">{stage.name}</div>
                  <div className="alh-stage-desc">{stage.description}</div>
                  {isPrimary && <div className="alh-stage-primary-badge">Primary Role</div>}
                  {stageNotes.length > 0 && (
                    <ul className="alh-stage-notes">
                      {stageNotes.map((note, ni) => (
                        <li key={ni} className="alh-stage-note">{note}</li>
                      ))}
                    </ul>
                  )}
                </div>
                {!isLast && (
                  <div className="alh-pipeline-connector">
                    <div className="alh-connector-line">
                      <div className="alh-connector-dot alh-connector-dot--1" />
                      <div className="alh-connector-dot alh-connector-dot--2" />
                      <div className="alh-connector-dot alh-connector-dot--3" />
                    </div>
                    <Icon name="bi-arrow-right" className="alh-connector-arrow" aria-hidden="true" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Drawer: Agents Tab ───────────────────────────────────────────────────────
function AgentsTab({ uc, onSelectAgent }: { uc: UseCase; onSelectAgent: (agent: Agent) => void }) {
  const ucAgents = AGENTS.filter(a => a.useCaseId === uc.id)
  return (
    <div className="alh-dtab-content">
      <div className="alh-agents-intro">
        <span className="alh-agents-count">{ucAgents.length} agent{ucAgents.length !== 1 ? 's' : ''} in this use case</span>
        <span className="alh-agents-hint">Click an agent to view its unique pipeline</span>
      </div>
      <div className="alh-agents-grid">
        {ucAgents.map(agent => (
          <button key={agent.id} className="alh-agent-card" onClick={() => onSelectAgent(agent)}>
            <div className="alh-agent-card-head">
              <span className={`alh-pa-dot alh-pa-dot--${agent.status.toLowerCase()}`} />
              <span className="alh-agent-card-name">{agent.name}</span>
              <span className={`alh-agent-card-status alh-agent-card-status--${agent.status.toLowerCase()}`}>{agent.status}</span>
            </div>
            <div className="alh-agent-card-tech">{agent.technology}</div>
            <div className="alh-agent-card-stats">
              <div className="alh-agent-stat-cell">
                <span className="alh-agent-stat-val">{agent.accuracyScore}%</span>
                <span className="alh-agent-stat-lbl">Accuracy</span>
              </div>
              <div className="alh-agent-stat-cell">
                <span className={`alh-agent-stat-val ${agent.evalScore >= 90 ? 'alh-score-high' : agent.evalScore >= 70 ? 'alh-score-mid' : 'alh-score-low'}`}>{agent.evalScore}</span>
                <span className="alh-agent-stat-lbl">Eval Score</span>
              </div>
              <div className="alh-agent-stat-cell">
                <span className="alh-agent-stat-val">{agent.uptime}%</span>
                <span className="alh-agent-stat-lbl">Uptime</span>
              </div>
              <div className="alh-agent-stat-cell">
                <span className="alh-agent-stat-val">{agent.responseTimeSec}s</span>
                <span className="alh-agent-stat-lbl">Response</span>
              </div>
            </div>
            <div className="alh-pa-bar-bg">
              <div className="alh-pa-bar-fill" style={{ width: `${agent.accuracyScore}%` }} />
            </div>
            <div className="alh-agent-card-cta">
              View Pipeline <Icon name="bi-chevron-right" aria-hidden="true" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Drawer: Technology Tab ───────────────────────────────────────────────────
function TechTab({ uc }: { uc: UseCase }) {
  const ucAgents = AGENTS.filter(a => a.useCaseId === uc.id)

  const techCards = uc.technologies.map(techName => {
    const meta = TECH_META[techName]
    const agentsUsingTech = ucAgents.filter(a => a.technology === techName)
    const costPerUc = meta ? Math.round(meta.monthlyCostAED / meta.useCaseCount) : 0
    const totalAgentCost = agentsUsingTech.reduce((s, a) => s + a.costPerMonthAED, 0)
    return { techName, meta, agentsUsingTech, costPerUc, totalAgentCost }
  })

  const totalCost = techCards.reduce((s, t) => s + t.totalAgentCost, 0)

  const barData = techCards.map(t => ({
    name: t.techName.replace('Azure ', '').replace(' Intelligence', ' Intel.'),
    cost: t.totalAgentCost,
    color: t.meta?.color ?? '#9ca3af',
  }))

  return (
    <div className="alh-dtab-content">
      {/* Tech cards */}
      <div className="alh-tech-cards">
        {techCards.map(({ techName, meta, agentsUsingTech, totalAgentCost }) => (
          <div key={techName} className="alh-tech-card"
            style={{ '--alh-tc-color': meta?.color ?? '#007560' } as React.CSSProperties}>
            <div className="alh-tc-head">
              <span className="alh-tc-name-pill" style={{ background: meta?.color ?? '#007560' }}>
                {techName}
              </span>
              <span className="alh-tc-cost">AED {totalAgentCost.toLocaleString()}/mo</span>
            </div>
            <p className="alh-tc-desc">{meta?.description ?? 'Cloud AI/automation platform'}</p>
            <div className="alh-tc-footer">
              <span className="alh-tc-agents">
                <Icon name="bi-cpu-fill" aria-hidden="true" />
                {agentsUsingTech.length > 0
                  ? `${agentsUsingTech.length} agent${agentsUsingTech.length > 1 ? 's' : ''}: ${agentsUsingTech.map(a => a.name).join(', ')}`
                  : 'System / infrastructure usage'
                }
              </span>
            </div>
            <div className="alh-tc-bar-bg">
              <div
                className="alh-tc-bar-fill"
                style={{
                  width: totalCost > 0 ? `${Math.round((totalAgentCost / totalCost) * 100)}%` : '20%',
                  background: meta?.color ?? '#007560',
                }}
              />
            </div>
            <span className="alh-tc-pct">
              {totalCost > 0 ? Math.round((totalAgentCost / totalCost) * 100) : '--'}% of use case cost
            </span>
          </div>
        ))}
      </div>

      {/* Cost bar chart */}
      <div className="alh-tc-chart-card">
        <div className="alh-chart-title">
          <Icon name="bi-bar-chart-fill" aria-hidden="true" />
          Monthly Cost by Technology
        </div>
        <ResponsiveContainer width="100%" height={Math.max(barData.length * 44 + 20, 120)}>
          <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 60, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.08)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${v.toLocaleString()}`} />
            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              labelStyle={TT_LABEL} itemStyle={TT_ITEM}
              formatter={(val) => [`AED ${Number(val).toLocaleString()}`, 'Monthly Cost']} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
            <Bar dataKey="cost" name="Monthly Cost (AED)" radius={[0, 6, 6, 0]} barSize={20}>
              {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="alh-tc-total-row">
          <span className="alh-tc-total-label">Total monthly cost for this use case</span>
          <span className="alh-tc-total-val">AED {totalCost.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Drawer: Benefits Tab ─────────────────────────────────────────────────────
function BenefitsTab({ uc }: { uc: UseCase }) {
  const comparisons = UC_BENEFITS[uc.id] ?? []
  const colorMap = {
    green: { bg: 'rgba(0,117,96,0.07)',   border: 'rgba(0,117,96,0.18)',   text: '#007560',  icon: 'rgba(0,117,96,0.12)' },
    blue:  { bg: 'rgba(8,145,178,0.07)',  border: 'rgba(8,145,178,0.18)',  text: '#0891b2',  icon: 'rgba(8,145,178,0.12)' },
    amber: { bg: 'rgba(202,138,4,0.07)',  border: 'rgba(202,138,4,0.18)',  text: '#ca8a04',  icon: 'rgba(202,138,4,0.12)' },
    purple:{ bg: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.18)', text: '#6366f1',  icon: 'rgba(99,102,241,0.12)' },
  }

  return (
    <div className="alh-dtab-content">
      <div className="alh-ben-intro">
        <Icon name="bi-graph-up-arrow" aria-hidden="true" className="alh-ben-intro-icon" />
        <div>
          <div className="alh-ben-intro-title">Impact Summary</div>
          <div className="alh-ben-intro-sub">{uc.benefitSummary}</div>
        </div>
      </div>

      {/* Before / After comparisons */}
      <div className="alh-ben-list">
        {comparisons.map((comp, i) => {
          const c = colorMap[comp.color]
          return (
            <div key={i} className="alh-ben-row" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="alh-ben-icon-wrap" style={{ background: c.icon, color: c.text }}>
                <Icon name={comp.icon} aria-hidden="true" />
              </div>
              <div className="alh-ben-metric">{comp.metric}</div>
              <div className="alh-ben-before">
                <span className="alh-ben-label">Before</span>
                <span className="alh-ben-val alh-ben-val--before">{comp.before}</span>
              </div>
              <div className="alh-ben-arrow">
                <Icon name="bi-arrow-right" aria-hidden="true" />
              </div>
              <div className="alh-ben-after">
                <span className="alh-ben-label">After</span>
                <span className="alh-ben-val alh-ben-val--after" style={{ color: c.text }}>{comp.after}</span>
              </div>
              <div className="alh-ben-badge" style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
                {comp.improvement}
              </div>
            </div>
          )
        })}
      </div>

      {/* ROI trend */}
      <div className="alh-roi-chart-card" style={{ marginTop: 24 }}>
        <div className="alh-roi-chart-title">
          <Icon name="bi-bar-chart-fill" aria-hidden="true" />
          Portfolio ROI Trend — Cost Savings &amp; Hours Automated
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={ROI_TREND} margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,117,96,0.08)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left"  tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="K" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
            <Tooltip contentStyle={TOOLTIP_STYLE}
              labelStyle={TT_LABEL} itemStyle={TT_ITEM}
              formatter={(val, name) =>
                name === 'savingsAED'
                  ? [`AED ${Number(val)}K`, 'Cost Savings']
                  : [`${Number(val).toLocaleString()} hrs`, 'Hours Automated']
              }
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
            <Bar yAxisId="left" dataKey="savingsAED" name="Cost Savings (AED K)" fill="var(--dewa-green)" radius={[6,6,0,0]} barSize={26} opacity={0.85} />
            <Line yAxisId="right" type="monotone" dataKey="hoursAutomated" name="Hours Automated" stroke="#ca8a04" strokeWidth={2.5} dot={{ r: 4, fill: '#ca8a04' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function UseCaseDrawer({ uc, onClose }: { uc: UseCase | null; onClose: () => void }) {
  const [tab, setTab] = useState<DrawerTab>('overview')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const isOpen = uc !== null

  // Reset tab and agent when switching use case
  useEffect(() => { if (uc) { setTab('overview'); setSelectedAgent(null) } }, [uc?.id])

  // Clear selected agent when changing tabs
  useEffect(() => { setSelectedAgent(null) }, [tab])

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const tabs: { id: DrawerTab; label: string; icon: string }[] = [
    { id: 'overview',   label: 'Overview',   icon: 'bi-info-circle' },
    { id: 'agents',     label: 'Agents',     icon: 'bi-people-fill' },
    { id: 'technology', label: 'Technology', icon: 'bi-cpu-fill' },
    { id: 'benefits',   label: 'Benefits',   icon: 'bi-graph-up-arrow' },
  ]

  return (
    <>
      {/* Overlay */}
      <div
        className={`alh-drawer-overlay${isOpen ? ' alh-drawer-overlay--open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className={`alh-drawer${isOpen ? ' alh-drawer--open' : ''}`} role="dialog" aria-modal="true">
        {uc && (
          <>
            {/* Header */}
            <div className="alh-drawer-header" style={{ '--alh-dh-color': STATUS_COLOR[uc.status] } as React.CSSProperties}>
              <div className="alh-drawer-header-inner">
                <h2 className="alh-drawer-title">{uc.name}</h2>
                <div className="alh-drawer-dept">{uc.division} · {uc.department}</div>
              </div>
              <button className="alh-drawer-close" onClick={onClose} aria-label="Close">
                <Icon name="bi-x" aria-hidden="true" />
              </button>
            </div>

            {/* Tabs */}
            <div className="alh-drawer-tabs">
              {tabs.map(t => (
                <button
                  key={t.id}
                  className={`alh-dtab-btn${tab === t.id ? ' alh-dtab-btn--active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  <Icon name={t.icon} aria-hidden="true" />
                  {t.label}
                </button>
              ))}
            </div>

            {/* Body */}
            <div className="alh-drawer-body">
              {tab === 'overview'   && <OverviewTab uc={uc} />}
              {tab === 'agents'     && (selectedAgent
                ? <AgentDetailView agent={selectedAgent} onBack={() => setSelectedAgent(null)} />
                : <AgentsTab uc={uc} onSelectAgent={setSelectedAgent} />
              )}
              {tab === 'technology' && <TechTab uc={uc} />}
              {tab === 'benefits'   && <BenefitsTab uc={uc} />}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AlHasbah() {
  const [drawerUc,     setDrawerUc]     = useState<UseCase | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [divFilter,    setDivFilter]    = useState<string>('All')
  const [search,       setSearch]       = useState('')

  const { ref: kpiRef, inView: kpiInView } = useInView(0.1)

  const divisions = useMemo(() => {
    const set = new Set(USE_CASES.map(uc => uc.division))
    return ['All', ...Array.from(set).sort()]
  }, [])

  const filtered = useMemo(() =>
    USE_CASES.filter(uc => {
      if (statusFilter !== 'All' && uc.status !== statusFilter) return false
      if (divFilter    !== 'All' && uc.division !== divFilter)  return false
      if (search) {
        const q = search.toLowerCase()
        return uc.name.toLowerCase().includes(q) ||
               uc.description.toLowerCase().includes(q) ||
               uc.technologies.some(t => t.toLowerCase().includes(q))
      }
      return true
    }),
    [statusFilter, divFilter, search]
  )

  const totalSavings = USE_CASES.reduce((s, uc) => s + uc.costSavingAED, 0)

  return (
    <div className="alh-root">
      {/* ── Hero ── */}
      <div className="page-header">
        <div>
          <h1 style={{ padding: '5px' }}>AL Hasbah</h1>
          <p>Live AI Use Cases Across Dewa's Division and Department</p>
        </div>
        <DataSourceBadge type="simulated" title="Dummy data" lastUpdated="3 May 2026" />
      </div>

      {/* ── KPI Row ── */}
      <div className="alh-section" ref={kpiRef}>
        <div className="alh-kpi-grid">
          <KpiCard icon="bi-collection"    label="Total Use Cases"   target={USE_CASES.length}  sub="Across all divisions"         accent="#007560" delay={0}   go={kpiInView} />
          <KpiCard icon="bi-cpu-fill"      label="Total Agents"      target={AGENTS.length}     sub="Across all use cases"       accent="#0891b2" delay={0.1} go={kpiInView} />
          <KpiCard icon="bi-currency-dirham" label="Cost Savings"    target={Math.round(totalSavings / 1000)} displayValue={`AED ${(totalSavings / 1000000).toFixed(1)}M`} sub="Annual across use cases" accent="#ca8a04" delay={0.2} go={kpiInView} />
          <KpiCard icon="bi-check-circle-fill" label="Agents Live"   target={AGENTS.filter(a => a.status === 'Production').length} sub="In production now" accent="#004937" delay={0.3} go={kpiInView} />
          <KpiCard icon="bi-graph-up-arrow" label="Hours Automated"  target={14200}             displayValue="14,200 hrs"         sub="Process hours saved"       accent="#007560" delay={0.4} go={kpiInView} />
        </div>
      </div>

      {/* ── Use Case Gallery ── */}
      <div className="alh-section">
        <div className="alh-section-header">
          <div className="alh-section-title">
            <Icon name="bi-kanban-fill" className="alh-section-icon" aria-hidden="true" />
            Use Case Portfolio
            <span className="alh-section-line" />
          </div>
          <span className="alh-section-sub">Click any card to explore details, pipeline &amp; benefits</span>
        </div>

        <div className="alh-filter-bar">
          <div className="alh-search-wrap">
            <Icon name="bi-search" className="alh-search-icon" aria-hidden="true" />
            <input className="alh-search" type="text" placeholder="Search use cases or technology…"
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button className="alh-search-clear" onClick={() => setSearch('')} aria-label="Clear">
                <Icon name="bi-x" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="alh-select-wrap">
            <Icon name="bi-sliders" className="alh-select-icon" aria-hidden="true" />
            <select className="alh-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="POC">POC</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>
          <div className="alh-select-wrap">
            <Icon name="bi-sliders" className="alh-select-icon" aria-hidden="true" />
            <select className="alh-select" value={divFilter} onChange={e => setDivFilter(e.target.value)}>
              {divisions.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <span className="alh-result-count">{filtered.length} use cases</span>
        </div>

        <div className="alh-uc2-grid">
          {filtered.map(uc => (
            <UseCaseCard key={uc.id} uc={uc} onClick={() => setDrawerUc(uc)} />
          ))}
        </div>
      </div>

      {/* ── Drawer ── */}
      <UseCaseDrawer uc={drawerUc} onClose={() => setDrawerUc(null)} />
    </div>
  )
}
