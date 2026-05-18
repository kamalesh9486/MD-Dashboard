// ─────────────────────────────────────────────────────────────
//  DEWA COE — People & Skills shared dummy data
// ─────────────────────────────────────────────────────────────

export type AdoptionStatus = 'Active' | 'In Progress' | 'Not Started'
export type CertStatus     = 'Completed' | 'In Progress' | 'Expired'
export type CertProvider   = 'Microsoft' | 'Google' | 'AWS' | 'Coursera' | 'DEWA Internal'
export type SkillCategory  = 'Programming' | 'AI/ML' | 'Data' | 'Tools'

export interface Employee {
  id: number
  name: string
  division: string
  department: string
  aiTools: string[]
  adoptionStatus: AdoptionStatus
  role: string
  performanceScore: number    // 1–5
  aiContributionRating: number // 1–5
  lastReview: string           // ISO date
}

export interface Certification {
  id: number
  employeeName: string
  division: string
  certName: string
  provider: CertProvider
  date: string
  status: CertStatus
}

export interface AdkarScore {
  division: string
  awareness: number
  desire: number
  knowledge: number
  ability: number
  reinforcement: number
}

export interface Skill {
  name: string
  count: number
  category: SkillCategory
}

export interface AIToolKPI {
  adoptionRate: number        // % of eligible staff actively using
  monthlyGrowth: number       // % growth month-over-month
  queriesPerMonth: number     // total queries/requests per month
  satisfactionScore: number   // out of 5
  avgSessionMins: number      // avg session duration in minutes
  useCases: string[]
  trend: { month: string; users: number }[]  // 6-month user trend
  deptBreakdown: { dept: string; count: number }[]
}

export interface AITool {
  name: string
  icon: string
  users: number
  departments: string[]
  color: string
  description: string
  kpi: AIToolKPI
}

export interface DivisionAdoption {
  division: string
  trained: number
  total: number
  pct: number
}

// ─── Employees ─────────────────────────────────────────────────
export const EMPLOYEES: Employee[] = [
  { id: 1,  name: 'Ahmed Al Mansoori',   division: 'IT & Digital',     department: 'Software Development',   aiTools: ['ChatGPT', 'Copilot', 'GitHub Copilot'],     adoptionStatus: 'Active',      role: 'Senior Software Engineer',    performanceScore: 5, aiContributionRating: 5, lastReview: '2026-02-15' },
  { id: 2,  name: 'Sara Al Hashimi',     division: 'IT & Digital',     department: 'Data Science',            aiTools: ['Azure AI', 'Power BI AI', 'Python ML'],     adoptionStatus: 'Active',      role: 'Data Scientist',              performanceScore: 5, aiContributionRating: 5, lastReview: '2026-02-20' },
  { id: 3,  name: 'Khalid Nasser',       division: 'Generation',       department: 'Operations Control',      aiTools: ['ChatGPT', 'Power BI AI'],                   adoptionStatus: 'In Progress', role: 'Operations Manager',          performanceScore: 4, aiContributionRating: 3, lastReview: '2026-01-30' },
  { id: 4,  name: 'Fatima Al Zaabi',     division: 'HR',               department: 'Talent Management',       aiTools: ['Copilot', 'ChatGPT'],                       adoptionStatus: 'Active',      role: 'HR Business Partner',         performanceScore: 4, aiContributionRating: 4, lastReview: '2026-02-10' },
  { id: 5,  name: 'Omar Bin Saeed',      division: 'Finance',          department: 'Financial Analysis',      aiTools: ['Power BI AI', 'ChatGPT', 'Copilot'],        adoptionStatus: 'Active',      role: 'Financial Analyst',           performanceScore: 4, aiContributionRating: 4, lastReview: '2026-02-05' },
  { id: 6,  name: 'Mariam Al Ketbi',     division: 'Customer Service', department: 'Customer Support',        aiTools: ['ChatGPT', 'Copilot'],                       adoptionStatus: 'Active',      role: 'Customer Experience Lead',    performanceScore: 5, aiContributionRating: 4, lastReview: '2026-02-18' },
  { id: 7,  name: 'Rashid Al Shamsi',    division: 'Transmission',     department: 'Grid Operations',         aiTools: ['Azure AI'],                                 adoptionStatus: 'In Progress', role: 'Grid Operations Engineer',    performanceScore: 3, aiContributionRating: 2, lastReview: '2026-01-25' },
  { id: 8,  name: 'Noura Al Dhaheri',    division: 'Distribution',     department: 'Asset Management',        aiTools: ['Power BI AI', 'Azure AI'],                  adoptionStatus: 'Active',      role: 'Asset Manager',               performanceScore: 4, aiContributionRating: 4, lastReview: '2026-02-12' },
  { id: 9,  name: 'Hassan Al Mazrouei', division: 'Corporate',         department: 'Strategy & Innovation',   aiTools: ['ChatGPT'],                                  adoptionStatus: 'In Progress', role: 'Strategy Analyst',            performanceScore: 3, aiContributionRating: 3, lastReview: '2026-01-20' },
  { id: 10, name: 'Aisha Al Muhairi',    division: 'IT & Digital',     department: 'Cybersecurity',           aiTools: ['Azure AI', 'Copilot'],                      adoptionStatus: 'Active',      role: 'Cybersecurity Specialist',    performanceScore: 5, aiContributionRating: 5, lastReview: '2026-02-22' },
  { id: 11, name: 'Ibrahim Al Nuaimi',   division: 'Generation',       department: 'Maintenance',             aiTools: [],                                           adoptionStatus: 'Not Started', role: 'Maintenance Technician',      performanceScore: 3, aiContributionRating: 1, lastReview: '2026-01-10' },
  { id: 12, name: 'Layla Al Kaabi',      division: 'Finance',          department: 'Budget Planning',         aiTools: ['Copilot', 'Power BI AI'],                   adoptionStatus: 'Active',      role: 'Budget Planner',              performanceScore: 4, aiContributionRating: 3, lastReview: '2026-02-08' },
  { id: 13, name: 'Mohammed Al Rashidi', division: 'Distribution',     department: 'Customer Operations',     aiTools: ['ChatGPT', 'Power BI AI'],                   adoptionStatus: 'Active',      role: 'Operations Coordinator',      performanceScore: 4, aiContributionRating: 3, lastReview: '2026-02-14' },
  { id: 14, name: 'Hessa Al Falasi',     division: 'HR',               department: 'Learning & Development',  aiTools: ['Copilot'],                                  adoptionStatus: 'In Progress', role: 'L&D Specialist',              performanceScore: 4, aiContributionRating: 3, lastReview: '2026-01-28' },
  { id: 15, name: 'Yousuf Al Hammadi',   division: 'Transmission',     department: 'Electrical Engineering',  aiTools: ['Azure AI', 'Python ML', 'GitHub Copilot'], adoptionStatus: 'Active',      role: 'Electrical Engineer',         performanceScore: 5, aiContributionRating: 5, lastReview: '2026-02-19' },
  { id: 16, name: 'Reem Al Blooshi',     division: 'Customer Service', department: 'Digital Channels',        aiTools: ['ChatGPT', 'DALL-E', 'Copilot'],             adoptionStatus: 'Active',      role: 'Digital Experience Analyst',  performanceScore: 4, aiContributionRating: 4, lastReview: '2026-02-16' },
  { id: 17, name: 'Saif Al Qubaisi',     division: 'Corporate',        department: 'Communications',          aiTools: ['ChatGPT', 'DALL-E'],                        adoptionStatus: 'In Progress', role: 'Communications Specialist',   performanceScore: 3, aiContributionRating: 2, lastReview: '2026-01-22' },
  { id: 18, name: 'Maitha Al Suwaidi',   division: 'IT & Digital',     department: 'Cloud Infrastructure',    aiTools: ['Azure AI', 'GitHub Copilot', 'Copilot'],    adoptionStatus: 'Active',      role: 'Cloud Architect',             performanceScore: 5, aiContributionRating: 5, lastReview: '2026-02-21' },
]

// ─── Certifications ─────────────────────────────────────────────
export const CERTIFICATIONS: Certification[] = [
  { id: 1,  employeeName: 'Sara Al Hashimi',      division: 'IT & Digital',     certName: 'Azure AI Engineer Associate',         provider: 'Microsoft',    date: '2026-01-15', status: 'Completed'   },
  { id: 2,  employeeName: 'Ahmed Al Mansoori',    division: 'IT & Digital',     certName: 'GitHub Copilot Certified Developer',  provider: 'Microsoft',    date: '2025-11-20', status: 'Completed'   },
  { id: 3,  employeeName: 'Aisha Al Muhairi',     division: 'IT & Digital',     certName: 'Microsoft Security AI Specialist',    provider: 'Microsoft',    date: '2026-02-10', status: 'Completed'   },
  { id: 4,  employeeName: 'Yousuf Al Hammadi',    division: 'Transmission',     certName: 'Google Cloud ML Engineer',            provider: 'Google',       date: '2026-01-28', status: 'Completed'   },
  { id: 5,  employeeName: 'Maitha Al Suwaidi',    division: 'IT & Digital',     certName: 'Azure Solutions Architect Expert',    provider: 'Microsoft',    date: '2026-02-18', status: 'Completed'   },
  { id: 6,  employeeName: 'Omar Bin Saeed',       division: 'Finance',          certName: 'Power BI Data Analyst Associate',     provider: 'Microsoft',    date: '2025-12-05', status: 'Completed'   },
  { id: 7,  employeeName: 'Noura Al Dhaheri',     division: 'Distribution',     certName: 'AWS Machine Learning Specialty',      provider: 'AWS',          date: '2026-03-01', status: 'In Progress' },
  { id: 8,  employeeName: 'Khalid Nasser',        division: 'Generation',       certName: 'Microsoft AI-900 Fundamentals',       provider: 'Microsoft',    date: '2026-03-15', status: 'In Progress' },
  { id: 9,  employeeName: 'Fatima Al Zaabi',      division: 'HR',               certName: 'Google Data Analytics Certificate',   provider: 'Google',       date: '2026-02-28', status: 'In Progress' },
  { id: 10, employeeName: 'Layla Al Kaabi',       division: 'Finance',          certName: 'Power BI Data Analyst Associate',     provider: 'Microsoft',    date: '2026-03-20', status: 'In Progress' },
  { id: 11, employeeName: 'Hassan Al Mazrouei',   division: 'Corporate',        certName: 'Microsoft AI-900 Fundamentals',       provider: 'Microsoft',    date: '2026-04-01', status: 'In Progress' },
  { id: 12, employeeName: 'Mohammed Al Rashidi',  division: 'Distribution',     certName: 'Power BI Data Analyst Associate',     provider: 'Microsoft',    date: '2026-03-10', status: 'In Progress' },
  { id: 13, employeeName: 'Rashid Al Shamsi',     division: 'Transmission',     certName: 'AWS Cloud Practitioner',              provider: 'AWS',          date: '2025-06-10', status: 'Expired'     },
  { id: 14, employeeName: 'Ibrahim Al Nuaimi',    division: 'Generation',       certName: 'Microsoft AI-900 Fundamentals',       provider: 'Microsoft',    date: '2024-12-01', status: 'Expired'     },
  { id: 15, employeeName: 'Reem Al Blooshi',      division: 'Customer Service', certName: 'Google UX Design Certificate',        provider: 'Google',       date: '2025-09-15', status: 'Expired'     },
  { id: 16, employeeName: 'Hessa Al Falasi',      division: 'HR',               certName: 'Coursera ML Specialization',          provider: 'Coursera',     date: '2026-04-10', status: 'In Progress' },
  { id: 17, employeeName: 'Saif Al Qubaisi',      division: 'Corporate',        certName: 'AI for Everyone – DEWA Track',        provider: 'DEWA Internal', date: '2026-03-25', status: 'In Progress' },
]

// ─── ADKAR ──────────────────────────────────────────────────────
export const ADKAR_SCORES: AdkarScore[] = [
  { division: 'IT & Digital',     awareness: 88, desire: 82, knowledge: 91, ability: 85, reinforcement: 78 },
  { division: 'Generation',       awareness: 72, desire: 65, knowledge: 70, ability: 68, reinforcement: 60 },
  { division: 'Transmission',     awareness: 68, desire: 60, knowledge: 65, ability: 62, reinforcement: 55 },
  { division: 'Distribution',     awareness: 75, desire: 70, knowledge: 72, ability: 69, reinforcement: 65 },
  { division: 'HR',               awareness: 80, desire: 75, knowledge: 78, ability: 72, reinforcement: 70 },
  { division: 'Finance',          awareness: 65, desire: 58, knowledge: 62, ability: 58, reinforcement: 52 },
  { division: 'Customer Service', awareness: 78, desire: 72, knowledge: 75, ability: 70, reinforcement: 68 },
  { division: 'Corporate',        awareness: 55, desire: 45, knowledge: 50, ability: 42, reinforcement: 40 },
]

// ─── Skills ─────────────────────────────────────────────────────
export const SKILLS: Skill[] = [
  { name: 'Prompt Engineering',      count: 145, category: 'AI/ML'       },
  { name: 'Data Analysis',           count: 121, category: 'Data'        },
  { name: 'Data Visualization',      count: 99,  category: 'Data'        },
  { name: 'Power BI',                count: 98,  category: 'Tools'       },
  { name: 'Microsoft Copilot',       count: 118, category: 'Tools'       },
  { name: 'SQL & Databases',         count: 112, category: 'Data'        },
  { name: 'Python',                  count: 89,  category: 'Programming' },
  { name: 'Azure AI Services',       count: 74,  category: 'Tools'       },
  { name: 'Machine Learning',        count: 67,  category: 'AI/ML'       },
  { name: 'Cloud Architecture',      count: 56,  category: 'Programming' },
  { name: 'Natural Language Proc.',  count: 45,  category: 'AI/ML'       },
  { name: 'Computer Vision',         count: 38,  category: 'AI/ML'       },
  { name: 'GitHub Copilot',          count: 95,  category: 'Tools'       },
  { name: 'MLOps',                   count: 29,  category: 'AI/ML'       },
  { name: 'R Programming',           count: 22,  category: 'Programming' },
]

// ─── AI Tools ────────────────────────────────────────────────────
export const AI_TOOLS: AITool[] = [
  {
    name: 'ChatGPT', icon: 'bi-chat-dots-fill', users: 340, color: '#10a37f',
    departments: ['IT & Digital', 'HR', 'Customer Service', 'Finance', 'Corporate'],
    description: 'General-purpose AI for text generation, analysis & problem-solving',
    kpi: {
      adoptionRate: 84, monthlyGrowth: 8, queriesPerMonth: 68000, satisfactionScore: 4.4, avgSessionMins: 14,
      useCases: ['Content drafting', 'Code review', 'Data summarisation', 'Email writing', 'Policy Q&A'],
      trend: [{ month: 'Oct', users: 260 }, { month: 'Nov', users: 285 }, { month: 'Dec', users: 298 }, { month: 'Jan', users: 315 }, { month: 'Feb', users: 330 }, { month: 'Mar', users: 340 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 92 }, { dept: 'HR', count: 68 }, { dept: 'Customer Service', count: 74 }, { dept: 'Finance', count: 58 }, { dept: 'Corporate', count: 48 }],
    },
  },
  {
    name: 'Claude', icon: 'bi-braces-asterisk', users: 280, color: '#cc785c',
    departments: ['IT & Digital', 'Finance', 'HR', 'Distribution', 'Corporate'],
    description: 'Anthropic\'s AI assistant — long-context reasoning and safe document analysis',
    kpi: {
      adoptionRate: 69, monthlyGrowth: 12, queriesPerMonth: 51000, satisfactionScore: 4.5, avgSessionMins: 20,
      useCases: ['Long document analysis', 'Code generation', 'Policy review', 'Research synthesis', 'Report writing'],
      trend: [{ month: 'Oct', users: 190 }, { month: 'Nov', users: 215 }, { month: 'Dec', users: 235 }, { month: 'Jan', users: 252 }, { month: 'Feb', users: 268 }, { month: 'Mar', users: 280 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 88 }, { dept: 'Finance', count: 62 }, { dept: 'HR', count: 54 }, { dept: 'Distribution', count: 46 }, { dept: 'Corporate', count: 30 }],
    },
  },
  {
    name: 'Microsoft Copilot', icon: 'bi-windows', users: 280, color: '#0078d4',
    departments: ['IT & Digital', 'Finance', 'HR', 'Distribution', 'Corporate'],
    description: 'AI productivity assistant embedded in Microsoft 365 suite',
    kpi: {
      adoptionRate: 70, monthlyGrowth: 6, queriesPerMonth: 49500, satisfactionScore: 4.2, avgSessionMins: 11,
      useCases: ['Email drafting', 'Meeting summaries', 'Presentation creation', 'Excel analysis', 'Teams chat assistance'],
      trend: [{ month: 'Oct', users: 218 }, { month: 'Nov', users: 232 }, { month: 'Dec', users: 248 }, { month: 'Jan', users: 260 }, { month: 'Feb', users: 272 }, { month: 'Mar', users: 280 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 80 }, { dept: 'Finance', count: 65 }, { dept: 'HR', count: 58 }, { dept: 'Distribution', count: 44 }, { dept: 'Corporate', count: 33 }],
    },
  },
  {
    name: 'PowerBI', icon: 'bi-bar-chart-fill', users: 210, color: '#F5A623',
    departments: ['Finance', 'Distribution', 'Generation', 'Customer Service'],
    description: 'AI-driven analytics, smart narratives & anomaly detection',
    kpi: {
      adoptionRate: 62, monthlyGrowth: 5, queriesPerMonth: 32000, satisfactionScore: 4.1, avgSessionMins: 28,
      useCases: ['Executive dashboards', 'Anomaly detection', 'Forecasting', 'KPI tracking', 'Smart narratives'],
      trend: [{ month: 'Oct', users: 168 }, { month: 'Nov', users: 178 }, { month: 'Dec', users: 188 }, { month: 'Jan', users: 196 }, { month: 'Feb', users: 204 }, { month: 'Mar', users: 210 }],
      deptBreakdown: [{ dept: 'Finance', count: 72 }, { dept: 'Distribution', count: 55 }, { dept: 'Generation', count: 48 }, { dept: 'Customer Service', count: 35 }],
    },
  },
  {
    name: 'Azure AI Services', icon: 'bi-cloud-fill', users: 158, color: '#0089d6',
    departments: ['IT & Digital', 'Transmission', 'Distribution'],
    description: 'Cloud APIs for vision, speech, language & decision intelligence',
    kpi: {
      adoptionRate: 45, monthlyGrowth: 9, queriesPerMonth: 125000, satisfactionScore: 4.0, avgSessionMins: 6,
      useCases: ['Image recognition', 'Speech-to-text', 'Sentiment analysis', 'Translation', 'Anomaly detection'],
      trend: [{ month: 'Oct', users: 112 }, { month: 'Nov', users: 122 }, { month: 'Dec', users: 132 }, { month: 'Jan', users: 142 }, { month: 'Feb', users: 150 }, { month: 'Mar', users: 158 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 92 }, { dept: 'Transmission', count: 38 }, { dept: 'Distribution', count: 28 }],
    },
  },
  {
    name: 'GitHub Copilot', icon: 'bi-code-slash', users: 95, color: '#24292e',
    departments: ['IT & Digital', 'Transmission'],
    description: 'AI pair-programming that suggests code in real time',
    kpi: {
      adoptionRate: 78, monthlyGrowth: 11, queriesPerMonth: 88000, satisfactionScore: 4.6, avgSessionMins: 45,
      useCases: ['Code completion', 'Unit test generation', 'Documentation', 'Bug fixing', 'Refactoring'],
      trend: [{ month: 'Oct', users: 62 }, { month: 'Nov', users: 70 }, { month: 'Dec', users: 76 }, { month: 'Jan', users: 82 }, { month: 'Feb', users: 89 }, { month: 'Mar', users: 95 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 78 }, { dept: 'Transmission', count: 17 }],
    },
  },
  {
    name: 'Power Automate', icon: 'bi-lightning-fill', users: 130, color: '#0066ff',
    departments: ['HR', 'Finance', 'Customer Service', 'Corporate'],
    description: 'Intelligent workflow automation with AI Builder capabilities',
    kpi: {
      adoptionRate: 40, monthlyGrowth: 7, queriesPerMonth: 22000, satisfactionScore: 3.9, avgSessionMins: 8,
      useCases: ['Invoice processing', 'Leave approvals', 'Report scheduling', 'Document classification', 'Alerts'],
      trend: [{ month: 'Oct', users: 98 }, { month: 'Nov', users: 106 }, { month: 'Dec', users: 112 }, { month: 'Jan', users: 118 }, { month: 'Feb', users: 125 }, { month: 'Mar', users: 130 }],
      deptBreakdown: [{ dept: 'HR', count: 42 }, { dept: 'Finance', count: 38 }, { dept: 'Customer Service', count: 30 }, { dept: 'Corporate', count: 20 }],
    },
  },
  {
    name: 'Azure OpenAI', icon: 'bi-braces-asterisk', users: 78, color: '#003366',
    departments: ['IT & Digital', 'Corporate'],
    description: 'Enterprise-grade GPT models with DEWA compliance & data controls',
    kpi: {
      adoptionRate: 32, monthlyGrowth: 15, queriesPerMonth: 41000, satisfactionScore: 4.3, avgSessionMins: 22,
      useCases: ['Custom chatbots', 'Internal search', 'Document Q&A', 'API integrations', 'Prototype AI apps'],
      trend: [{ month: 'Oct', users: 44 }, { month: 'Nov', users: 52 }, { month: 'Dec', users: 58 }, { month: 'Jan', users: 65 }, { month: 'Feb', users: 72 }, { month: 'Mar', users: 78 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 58 }, { dept: 'Corporate', count: 20 }],
    },
  },
  // ── New tools ──────────────────────────────────────────────
  {
    name: 'Rammas', icon: 'bi-chat-dots-fill', users: 185, color: '#00897b',
    departments: ['Customer Service', 'Corporate', 'HR', 'IT & Digital'],
    description: 'DEWA\'s AI-powered Arabic/English virtual assistant for customer queries',
    kpi: {
      adoptionRate: 72, monthlyGrowth: 18, queriesPerMonth: 42000, satisfactionScore: 4.2, avgSessionMins: 7,
      useCases: ['Bill enquiries', 'Outage reporting', 'Service requests', 'FAQ automation', 'Arabic NLP'],
      trend: [{ month: 'Oct', users: 95 }, { month: 'Nov', users: 115 }, { month: 'Dec', users: 135 }, { month: 'Jan', users: 152 }, { month: 'Feb', users: 170 }, { month: 'Mar', users: 185 }],
      deptBreakdown: [{ dept: 'Customer Service', count: 82 }, { dept: 'Corporate', count: 42 }, { dept: 'HR', count: 38 }, { dept: 'IT & Digital', count: 23 }],
    },
  },
  {
    name: 'Rammas At Work', icon: 'bi-people-fill', users: 128, color: '#00695c',
    departments: ['HR', 'Finance', 'Corporate', 'IT & Digital'],
    description: 'Workplace-integrated Rammas for internal DEWA employee productivity',
    kpi: {
      adoptionRate: 58, monthlyGrowth: 24, queriesPerMonth: 18500, satisfactionScore: 4.0, avgSessionMins: 12,
      useCases: ['Leave balance checks', 'Policy lookups', 'HR self-service', 'Internal announcements', 'Employee onboarding'],
      trend: [{ month: 'Oct', users: 52 }, { month: 'Nov', users: 68 }, { month: 'Dec', users: 84 }, { month: 'Jan', users: 98 }, { month: 'Feb', users: 114 }, { month: 'Mar', users: 128 }],
      deptBreakdown: [{ dept: 'HR', count: 48 }, { dept: 'Finance', count: 32 }, { dept: 'Corporate', count: 28 }, { dept: 'IT & Digital', count: 20 }],
    },
  },
  {
    name: 'Genspark', icon: 'bi-lightning-charge-fill', users: 62, color: '#f97316',
    departments: ['IT & Digital', 'Corporate', 'Customer Service'],
    description: 'AI-powered search & content spark generation for rapid research',
    kpi: {
      adoptionRate: 28, monthlyGrowth: 35, queriesPerMonth: 9200, satisfactionScore: 3.8, avgSessionMins: 18,
      useCases: ['AI-powered search', 'Report generation', 'Competitive research', 'Slide summarisation', 'Knowledge discovery'],
      trend: [{ month: 'Oct', users: 18 }, { month: 'Nov', users: 26 }, { month: 'Dec', users: 36 }, { month: 'Jan', users: 46 }, { month: 'Feb', users: 55 }, { month: 'Mar', users: 62 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 32 }, { dept: 'Corporate', count: 18 }, { dept: 'Customer Service', count: 12 }],
    },
  },
  {
    name: 'Notebook LLM', icon: 'bi-book-fill', users: 88, color: '#4f46e5',
    departments: ['IT & Digital', 'Finance', 'Distribution', 'Corporate'],
    description: 'Google NotebookLM for deep document analysis and research synthesis',
    kpi: {
      adoptionRate: 35, monthlyGrowth: 28, queriesPerMonth: 14600, satisfactionScore: 4.3, avgSessionMins: 25,
      useCases: ['Document Q&A', 'Research synthesis', 'Study guides', 'Podcast generation', 'Contract review'],
      trend: [{ month: 'Oct', users: 28 }, { month: 'Nov', users: 38 }, { month: 'Dec', users: 52 }, { month: 'Jan', users: 64 }, { month: 'Feb', users: 76 }, { month: 'Mar', users: 88 }],
      deptBreakdown: [{ dept: 'IT & Digital', count: 38 }, { dept: 'Finance', count: 22 }, { dept: 'Distribution', count: 16 }, { dept: 'Corporate', count: 12 }],
    },
  },
]

// ─── Technology Portfolio ────────────────────────────────────────

export type TechHealth = 'healthy' | 'warn' | 'risk'

export interface TechCategory {
  id: string; name: string; desc: string; color: string
}

export interface TechEntry {
  id: string; cat: string; name: string; vendor: string
  color: string; icon?: string; desc: string
  users: string; spend: string; uptime: string; projects: number
  integrations: number; owner: string; contract: string; sla: string
  license: string; spoc: string; tags: string[]
  panelType?: 'copilot' | 'rammas'
  // legacy fields kept for TECH_DATA compatibility — not rendered
  initials?: string; health?: TechHealth; deployments?: number
}

export const TECH_CATS: TechCategory[] = [
  { id: 'ai',   name: 'AI / ML Platforms', desc: 'Generative, predictive and computer-vision platforms.', color: '#17944a' },
  { id: 'cloud',name: 'Cloud & Compute',   desc: 'Hyperscaler and hybrid platforms hosting DEWA workloads.', color: '#2b63c8' },
  { id: 'data', name: 'Data & Analytics',  desc: 'Warehouses, lakes, streaming and BI for the data fabric.', color: '#1a9a94' },
  { id: 'iot',  name: 'IoT, Edge & OT',    desc: 'Field assets, SCADA, digital twins and edge inference.', color: '#d98c0a' },
  { id: 'sec',  name: 'Cybersecurity',     desc: 'SOC, identity, endpoint and OT-security stack.', color: '#c8352c' },
  { id: 'erp',  name: 'Enterprise Apps',   desc: 'ERP, HCM, FSM and core back-office systems.', color: '#6a3fb3' },
  { id: 'cust', name: 'Customer & Field',  desc: 'Engagement, billing, contact-centre and field operations.', color: '#c43e7d' },
  { id: 'dev',  name: 'DevOps & Infra',    desc: 'Pipelines, container platforms and observability.', color: '#dd6b20' },
]

export const TECH_DATA: TechEntry[] = [
  // AI / ML
  { id:'mscopilot',   cat:'ai',    name:'Microsoft Copilot',          vendor:'Microsoft',                         initials:'MC', color:'#0078d4', health:'healthy', desc:'Copilot Studio agents — live from Power Platform. Multi-environment deployment across DEWA divisions.',               deployments:38, users:'6,200',  spend:'AED 4.8M',  uptime:'99.94%', projects:12, integrations:28, owner:'IT & Digital',          contract:'Microsoft EA · 2024-2027',     sla:'99.9%',  license:'Seat · M365 bundle',      spoc:'Y. Al Suwaidi', tags:['GenAI','Productivity'],        panelType:'copilot' },
  { id:'rammas',      cat:'ai',    name:'Rammas At Work',             vendor:'DEWA COE · Azure OpenAI',           initials:'RA', color:'#00695c', health:'healthy', desc:'Workplace AI assistant for DEWA employees — BRD platform, MyRammas bot builder, and knowledge management.',          deployments:23, users:'1,820',  spend:'AED 2.6M',  uptime:'99.88%', projects:6,  integrations:14, owner:'COE · AI Engineering',  contract:'Internal · FY26',             sla:'99.5%',  license:'Usage-based',             spoc:'S. Al Mansoori',tags:['GenAI','Internal AI'],        panelType:'rammas'  },
  { id:'genai-hub',   cat:'ai',    name:'DEWA GenAI Hub',             vendor:'Azure OpenAI · in-house orch.',     initials:'GA', color:'#17944a', health:'healthy', desc:'Internal multi-model gateway routing prompts to GPT-4o, Llama 3 and Falcon for chat, RAG and copilot use-cases.',  deployments:23, users:'4,820',  spend:'AED 11.4M', uptime:'99.94%', projects:8,  integrations:14, owner:'COE · AI Engineering',  contract:'Framework · 2025-2028',       sla:'99.9%',  license:'Token · 12B/mo',          spoc:'S. Al Mansoori',tags:['GenAI','RAG','LLM-Ops']                          },
  { id:'vision-suite',cat:'ai',    name:'Asset Vision Suite',         vendor:'NVIDIA Metropolis + YOLO',          initials:'VS', color:'#17944a', health:'healthy', desc:'Computer-vision pipelines for substation, transmission and water-asset inspection from drones and CCTV.',            deployments:18, users:'310',    spend:'AED 6.8M',  uptime:'99.71%', projects:5,  integrations:9,  owner:'Transmission Engineering', contract:'3-year · Mar 2027',           sla:'99.5%',  license:'GPU-hour · 28 A100',      spoc:'K. Joshi',      tags:['Vision','Drones','Inspection']                   },
  { id:'voice-ai',    cat:'ai',    name:'Customer Voice AI',          vendor:'Google Cloud Speech + Cohere',      initials:'VA', color:'#17944a', health:'warn',    desc:'Bilingual AR/EN speech recognition, intent and synthesis for the customer voice channel.',                          deployments:4,  users:'180',    spend:'AED 2.4M',  uptime:'99.21%', projects:3,  integrations:6,  owner:'Customer Service',      contract:'Pilot · extended Jul 2026',   sla:'99.0%',  license:'Per-minute · 2.1M/mo',    spoc:'M. Saleh',      tags:['Speech','NLP','AR/EN']                           },
  // Cloud & Compute
  { id:'azure',       cat:'cloud', name:'Microsoft Azure',            vendor:'Microsoft',                         initials:'AZ', color:'#2b63c8', health:'healthy', desc:'Primary hyperscaler for analytics, AI and customer-facing workloads. Two-region active/active.',                     deployments:62, users:'6,200',  spend:'AED 38.6M', uptime:'99.96%', projects:34, integrations:42, owner:'Cloud CoE',             contract:'Microsoft EA · 2024-2027',     sla:'99.95%', license:'Reserved + PAYG',         spoc:'Y. Al Suwaidi', tags:['Hyperscaler','Hybrid','Cloud']                   },
  { id:'oci',         cat:'cloud', name:'Oracle Cloud (OCI)',         vendor:'Oracle',                            initials:'OC', color:'#2b63c8', health:'healthy', desc:'Hosts ERP, HCM and treasury workloads with sovereign-region residency.',                                              deployments:14, users:'3,400',  spend:'AED 12.7M', uptime:'99.92%', projects:6,  integrations:11, owner:'Enterprise Apps',       contract:'OCI ULA · 2023-2028',         sla:'99.95%', license:'Universal credits',        spoc:'P. Verma',      tags:['IaaS','Sovereign']                               },
  { id:'openshift',   cat:'cloud', name:'Red Hat OpenShift',          vendor:'Red Hat',                           initials:'OS', color:'#2b63c8', health:'healthy', desc:'On-premises container platform for OT-adjacent and regulated workloads.',                                             deployments:9,  users:'540',    spend:'AED 5.2M',  uptime:'99.89%', projects:11, integrations:8,  owner:'Infrastructure Eng.',  contract:'Subscription · Sep 2026',     sla:'99.5%',  license:'Core-pair · 480',         spoc:'H. Khalifa',    tags:['Kubernetes','On-prem']                           },
  { id:'vmware',      cat:'cloud', name:'VMware Cloud Foundation',    vendor:'Broadcom',                          initials:'VM', color:'#2b63c8', health:'warn',    desc:'Legacy virtualisation estate undergoing partial workload migration to OpenShift.',                                   deployments:6,  users:'1,100',  spend:'AED 8.4M',  uptime:'99.73%', projects:0,  integrations:5,  owner:'Infrastructure Eng.',  contract:'Renewal under negotiation',   sla:'99.9%',  license:'CPU-socket · 312',        spoc:'H. Khalifa',    tags:['Virtualisation','Legacy']                        },
  // Data & Analytics
  { id:'databricks',  cat:'data',  name:'Databricks Lakehouse',       vendor:'Databricks',                        initials:'DB', color:'#1a9a94', health:'healthy', desc:'Lakehouse for unified analytics, feature store and Unity catalog across 12 domains.',                                deployments:11, users:'720',    spend:'AED 9.1M',  uptime:'99.94%', projects:21, integrations:19, owner:'Data Platform',         contract:'ELA · 2024-2027',             sla:'99.9%',  license:'DBU · 4.1M/yr',          spoc:'R. Khoury',     tags:['Lakehouse','ML','Catalog']                       },
  { id:'powerbi',     cat:'data',  name:'Power BI Premium',           vendor:'Microsoft',                         initials:'PB', color:'#1a9a94', health:'healthy', desc:'Enterprise BI for executive, ops and finance reporting — 2,100 published reports.',                                  deployments:8,  users:'5,800',  spend:'AED 2.9M',  uptime:'99.98%', projects:14, integrations:24, owner:'Data Platform · BI',    contract:'Microsoft EA',                sla:'99.9%',  license:'P3 + PPU · 60 cap',      spoc:'Y. Al Suwaidi', tags:['BI','Reporting']                                 },
  { id:'kafka',       cat:'data',  name:'Confluent Kafka',            vendor:'Confluent',                         initials:'KF', color:'#1a9a94', health:'healthy', desc:'Event backbone streaming SCADA, meter and customer events at 4.2B msg/day.',                                          deployments:5,  users:'180',    spend:'AED 4.4M',  uptime:'99.97%', projects:18, integrations:31, owner:'Integration Platform',  contract:'3-year · 2024-2027',          sla:'99.95%', license:'CKU · 24',                spoc:'F. Iqbal',      tags:['Streaming','Events']                             },
  { id:'elastic',     cat:'data',  name:'Elastic Stack',              vendor:'Elastic',                           initials:'EL', color:'#1a9a94', health:'healthy', desc:'Search, observability and SIEM data backbone with 1.8 PB hot/warm storage.',                                         deployments:7,  users:'420',    spend:'AED 3.2M',  uptime:'99.91%', projects:9,  integrations:17, owner:'Observability',         contract:'ELA · 2025-2028',             sla:'99.9%',  license:'Resource-unit · 18k',     spoc:'H. Khalifa',    tags:['Search','Logs','SIEM']                           },
  // IoT, Edge & OT
  { id:'pi',          cat:'iot',   name:'AVEVA PI System',            vendor:'AVEVA',                             initials:'PI', color:'#d98c0a', health:'healthy', desc:'Operational data historian across generation, transmission and water plants — 1.7M tags.',                           deployments:12, users:'940',    spend:'AED 7.6M',  uptime:'99.99%', projects:14, integrations:22, owner:'OT Platform',           contract:'Enterprise · 2024-2029',      sla:'99.99%', license:'Tag · 2M cap',            spoc:'O. Bin Saleh',  tags:['Historian','OT','SCADA']                         },
  { id:'mindsphere',  cat:'iot',   name:'Siemens MindSphere',         vendor:'Siemens',                           initials:'MS', color:'#d98c0a', health:'healthy', desc:'Connects 18,000 OT assets to the digital-twin layer for performance & reliability.',                                deployments:6,  users:'260',    spend:'AED 4.8M',  uptime:'99.86%', projects:7,  integrations:13, owner:'Generation Engineering',contract:'5-year · 2023-2028',          sla:'99.9%',  license:'Asset · 20k cap',         spoc:'O. Bin Saleh',  tags:['IIoT','Digital Twin']                            },
  { id:'ecostruxure', cat:'iot',   name:'Schneider EcoStruxure',      vendor:'Schneider Electric',                initials:'ES', color:'#d98c0a', health:'healthy', desc:'Substation management and grid-edge controllers across 220 sites.',                                                   deployments:9,  users:'310',    spend:'AED 6.1M',  uptime:'99.92%', projects:5,  integrations:10, owner:'T&D Operations',        contract:'Multi-year · 2024-2029',      sla:'99.95%', license:'Site · 220',              spoc:'K. Joshi',      tags:['Grid','Substation']                              },
  { id:'forge',       cat:'iot',   name:'Honeywell Forge',            vendor:'Honeywell',                         initials:'HF', color:'#d98c0a', health:'warn',    desc:'Cybersecure remote-ops for water plants. Currently in patching window.',                                              deployments:3,  users:'96',     spend:'AED 2.2M',  uptime:'99.40%', projects:2,  integrations:6,  owner:'Water Operations',      contract:'3-year · Dec 2026',           sla:'99.5%',  license:'Plant · 12',              spoc:'M. Saleh',      tags:['Water','OT']                                     },
  // Cybersecurity
  { id:'sentinel',    cat:'sec',   name:'Microsoft Sentinel',         vendor:'Microsoft',                         initials:'SE', color:'#c8352c', health:'healthy', desc:'Cloud-native SIEM/SOAR with 980 active analytics rules across IT and OT environments.',                              deployments:1,  users:'42',     spend:'AED 5.6M',  uptime:'99.97%', projects:0,  integrations:48, owner:'Cyber SOC',             contract:'Microsoft EA',                sla:'99.9%',  license:'Ingestion · 18 TB/mo',    spoc:'A. Hashmi',     tags:['SIEM','SOAR','SOC']                              },
  { id:'crowdstrike', cat:'sec',   name:'CrowdStrike Falcon',         vendor:'CrowdStrike',                       initials:'CS', color:'#c8352c', health:'healthy', desc:'EDR/XDR across 28,400 endpoints with identity protection module enabled.',                                           deployments:1,  users:'28,400', spend:'AED 3.9M',  uptime:'99.98%', projects:0,  integrations:11, owner:'Cyber Defence',         contract:'3-year · 2024-2027',          sla:'99.95%', license:'Endpoint · 30k',          spoc:'A. Hashmi',     tags:['EDR','XDR']                                      },
  { id:'cortex',      cat:'sec',   name:'Palo Alto Cortex',           vendor:'Palo Alto Networks',                initials:'PA', color:'#c8352c', health:'healthy', desc:'Network detection, automation and OT-zone visibility across all DEWA network segments.',                            deployments:4,  users:'38',     spend:'AED 4.7M',  uptime:'99.94%', projects:0,  integrations:18, owner:'Cyber Defence',         contract:'3-year',                      sla:'99.9%',  license:'Sensor · 14',             spoc:'A. Hashmi',     tags:['NDR','NGFW']                                     },
  // Enterprise Apps
  { id:'sap',         cat:'erp',   name:'SAP S/4HANA',                vendor:'SAP · RISE',                        initials:'SP', color:'#6a3fb3', health:'healthy', desc:'Core finance, supply-chain and asset management on RISE private edition.',                                           deployments:1,  users:'8,400',  spend:'AED 22.3M', uptime:'99.96%', projects:9,  integrations:64, owner:'Enterprise Apps · ERP', contract:'RISE · 2024-2029',            sla:'99.95%', license:'FUE · 6,200',            spoc:'P. Verma',      tags:['ERP','Finance','S/4']                            },
  { id:'servicenow',  cat:'erp',   name:'ServiceNow',                 vendor:'ServiceNow',                        initials:'SN', color:'#6a3fb3', health:'healthy', desc:'ITSM, HR service delivery and integrated risk-management on a single platform.',                                    deployments:1,  users:'12,800', spend:'AED 8.6M',  uptime:'99.97%', projects:6,  integrations:38, owner:'Enterprise Apps',       contract:'3-year · 2024-2027',          sla:'99.9%',  license:'Fulfiller · 2,800',       spoc:'P. Verma',      tags:['ITSM','Workflow']                                },
  { id:'oraclehcm',   cat:'erp',   name:'Oracle Fusion HCM',          vendor:'Oracle',                            initials:'OH', color:'#6a3fb3', health:'healthy', desc:'HCM, payroll and learning for 22,000 staff including national-service members.',                                    deployments:1,  users:'22,000', spend:'AED 6.4M',  uptime:'99.94%', projects:3,  integrations:21, owner:'HR Tech',               contract:'5-year · 2023-2028',          sla:'99.9%',  license:'Employee · 23k',          spoc:'S. Al Mansoori',tags:['HCM','Payroll']                                  },
  // Customer & Field
  { id:'salesforce',  cat:'cust',  name:'Salesforce Service Cloud',   vendor:'Salesforce',                        initials:'SF', color:'#c43e7d', health:'healthy', desc:'Customer 360, omni-channel routing and case management for 4M customers.',                                          deployments:1,  users:'1,400',  spend:'AED 7.2M',  uptime:'99.95%', projects:5,  integrations:28, owner:'Customer Service',      contract:'3-year · 2024-2027',          sla:'99.9%',  license:'Service Cloud · 1,400',   spoc:'M. Saleh',      tags:['CX','CRM']                                       },
  { id:'arcgis',      cat:'cust',  name:'Esri ArcGIS Enterprise',     vendor:'Esri',                              initials:'AG', color:'#c43e7d', health:'healthy', desc:'GIS for network model, outage management and field-crew dispatch.',                                                  deployments:5,  users:'1,800',  spend:'AED 4.1M',  uptime:'99.92%', projects:8,  integrations:17, owner:'Geospatial Services',   contract:'ELA · 2024-2027',             sla:'99.5%',  license:'Named user · 2,000',      spoc:'K. Joshi',      tags:['GIS','Field']                                    },
  { id:'clickfsm',    cat:'cust',  name:'Click Field Service',        vendor:'Salesforce',                        initials:'CL', color:'#c43e7d', health:'healthy', desc:'Workforce scheduling for 1,200 field engineers across UAE.',                                                        deployments:1,  users:'1,200',  spend:'AED 1.9M',  uptime:'99.88%', projects:2,  integrations:9,  owner:'Field Operations',      contract:'3-year',                      sla:'99.5%',  license:'Resource · 1,500',        spoc:'M. Saleh',      tags:['Scheduling','FSM']                               },
  // DevOps & Infra
  { id:'github',      cat:'dev',   name:'GitHub Enterprise + Copilot',vendor:'Microsoft',                         initials:'GH', color:'#dd6b20', health:'healthy', desc:'Source control, pipelines and AI pair-programming for 1,400 developers.',                                           deployments:1,  users:'1,420',  spend:'AED 1.6M',  uptime:'99.99%', projects:47, integrations:36, owner:'Engineering Productivity',contract:'3-year · 2024-2027',         sla:'99.95%', license:'Seat · 1,500',            spoc:'R. Khoury',     tags:['DevEx','Copilot']                                },
  { id:'datadog',     cat:'dev',   name:'Datadog',                    vendor:'Datadog',                           initials:'DD', color:'#dd6b20', health:'healthy', desc:'Full-stack APM, logs and synthetics for cloud-native services.',                                                     deployments:1,  users:'320',    spend:'AED 2.8M',  uptime:'99.96%', projects:24, integrations:42, owner:'Observability',         contract:'2-year · Aug 2026',           sla:'99.9%',  license:'Host · 1,800',            spoc:'H. Khalifa',    tags:['APM','Observability']                            },
  { id:'terraform',   cat:'dev',   name:'HashiCorp Terraform',        vendor:'HashiCorp · IBM',                   initials:'TF', color:'#dd6b20', health:'warn',    desc:'IaC platform managing 12,400 cloud resources across Azure and OCI.',                                                deployments:1,  users:'180',    spend:'AED 1.4M',  uptime:'99.65%', projects:33, integrations:14, owner:'Cloud CoE',             contract:'Renewing Q3 2026',            sla:'99.9%',  license:'Workspace · 600',         spoc:'Y. Al Suwaidi', tags:['IaC','Automation']                               },
]

// ─── Division Adoption ───────────────────────────────────────────
export const DIVISION_ADOPTION: DivisionAdoption[] = [
  { division: 'IT & Digital',     trained: 145, total: 160, pct: 91 },
  { division: 'HR',               trained: 68,  total: 90,  pct: 76 },
  { division: 'Customer Service', trained: 120, total: 160, pct: 75 },
  { division: 'Distribution',     trained: 110, total: 155, pct: 71 },
  { division: 'Finance',          trained: 55,  total: 80,  pct: 69 },
  { division: 'Generation',       trained: 89,  total: 130, pct: 68 },
  { division: 'Transmission',     trained: 62,  total: 100, pct: 62 },
  { division: 'Corporate',        trained: 45,  total: 90,  pct: 50 },
]
