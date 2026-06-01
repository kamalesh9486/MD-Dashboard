# DEWA COE AI Intelligence Platform — Architecture Reference

> Full architecture reference. For coding directives, see `CLAUDE.md`. For design rules, see `design.md`.

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Who It's For](#2-who-its-for)
3. [Core Value Proposition](#3-core-value-proposition)
4. [Technical Foundation](#4-technical-foundation)
5. [Complete Screen Inventory](#5-complete-screen-inventory)
6. [User Flow Maps](#6-user-flow-maps)
7. [Screen State Descriptions](#7-screen-state-descriptions)
8. [Component Inventory](#8-component-inventory)
9. [Data Relationships](#9-data-relationships)
10. [Build & Deployment](#10-build--deployment)
11. [Recent Changes](#11-recent-changes)

---

## 1. What the App Does

The DEWA COE AI Intelligence Platform is the single operational dashboard for the Dubai Electricity and Water Authority's Centre of Excellence. It tracks every dimension of DEWA's AI transformation programme in one place: how many employees have been trained, which AI projects are live, what risks exist, how much money has been saved, and where the organisation stands on its strategic roadmap.

The app connects to Microsoft Dataverse (DEWA's Power Platform environment) to read live records for programmes, events, people, incidents, and discoveries. It enriches that data with calculated metrics and visualisations so that both executives and operational staff can answer their questions without opening Excel or chasing reports.

It also embeds a floating AI chat assistant (CommandIQ) powered by a Power Automate workflow, letting users ask natural-language questions about the platform data at any time.

A dedicated **Al Hasbah** module tracks DEWA's AI agent adoption programme — the portfolio of deployed agents (HR, Finance, Billing), their KPIs, use cases, and incidents — giving programme owners a single view of agent health and business value.

---

## 2. Who It's For

| Audience | What They Use It For |
|----------|----------------------|
| **C-suite / Executive sponsors** | Executive Summary — top-level KPIs, ROI, risk posture, strategic roadmap progress |
| **COE Programme managers** | Programs + Events — tracking active programmes, upcoming events, participant counts |
| **HR / L&D leads** | People & Skills — employee training completion, certifications, skill gaps, ADKAR readiness |
| **Division heads** | Division Analytics — per-division AI adoption rates and change-readiness scores |
| **Technology & IT leads** | Technology Stack, AI Command Center — tool adoption, Power BI dashboard deployment status |
| **Risk & compliance officers** | AI Incidents — incident pipeline, severity, SLA status, risk categorisation |
| **Finance / PMO** | Finance — budget allocation vs. actuals, utilisation rates, YoY spend trends |
| **Innovation / Discovery teams** | Discovery Catalog — innovation submissions, pipeline status, IT lead assignments |
| **Al Hasbah programme owners** | Al Hasbah — AI agent portfolio health, KPI tracking, use case lifecycle, incident management |

The app is intentionally multi-persona. The sidebar navigation lets each user type jump directly to their area without wading through irrelevant sections.

---

## 3. Core Value Proposition

Before this platform, DEWA's AI COE data lived in scattered spreadsheets, Power BI reports, and email threads. The platform consolidates everything into one authenticated, role-aware interface with three core benefits:

1. **Single source of truth.** One URL, one login, live Dataverse data — no more "which spreadsheet is current?"
2. **Executive-grade visibility.** Animated KPIs, trend charts, and risk matrices designed for senior leadership reviews, not just analysts.
3. **Operational depth.** Drill down from a KPI to the individual employee, programme, or incident behind it, without switching tools.

---

## 4. Technical Foundation

```
React 19 + TypeScript (strict mode)
  └─ Vite 7 build toolchain
  └─ Microsoft Power Apps SDK (@microsoft/power-apps)
      └─ Dataverse integration via @pa-client/power-code-sdk
  └─ Recharts 3 for all data visualisations
  └─ Bootstrap 5 for grid/utilities + Bootstrap Icons
  └─ Power Automate for CommandIQ AI chat backend
```

**Path alias:** `@` resolves to `./src`  
**Dataverse environment ID:** `07da6342-8cc4-e81c-95fa-9ce24e7c2f46`  
**Dataverse table prefix:** `cr978_coe_*`  
**Build output:** `./dist/index.html`  
**Local dev port:** `http://localhost:3000`

### Entry Flow

```
main.tsx
  └─ <StrictMode>
       └─ <PowerProvider>   ← initialises Power Apps SDK + Dataverse context
            └─ <App>
                 ├─ launched=false → <LaunchScreen>   ← animated intro + auth
                 └─ launched=true  → <Layout> + <CommandIQ>   ← full app
```

### No Router

There is no React Router. `Layout.tsx` holds a single `activeTab` string state. The sidebar emits tab name strings; the layout renders the correct page component with a conditional switch. This means every page is always rendered in the same DOM shell — no URL changes, no browser history.

### Responsive Layout

`Layout.tsx` tracks `isMobile` (`window.innerWidth ≤ 768`) via a `resize` listener. On mobile the sidebar slides in as an overlay (`mobileOpen` state) instead of collapsing to icon-only. An `onLogout` prop is threaded from `App` → `Layout` → `Sidebar` to handle session sign-out.

Every page is wrapped in an `<ErrorBoundary key={activeTab}>` so a runtime error in one tab never blanks the whole app.

### Al Hasbah Sub-Navigation

Al Hasbah has its own nested tab system. `Layout.tsx` maintains two translation maps:
- `AH_TO_SUB` — maps global `TabId` (e.g. `'ah-kpi-performance'`) → `AlHasbahTabId` (`'kpi-performance'`)
- `SUB_TO_AH` — reverse map for `AlHasbah`'s `onNavigate` callback → global `TabId`

This lets the sidebar drive sub-tab changes from the top level without `AlHasbah` knowing about global routing.

### Dataverse Service Pattern

Every Dataverse table has an auto-generated service class in `src/generated/`. All methods are static and return `Promise<IOperationResult<T>>`:

```ts
Cr978_coe_programsService.getAll()        // fetch all rows
Cr978_coe_programsService.get(id)         // fetch one row
Cr978_coe_programsService.create(obj)     // insert
Cr978_coe_programsService.update(id, diff) // patch
Cr978_coe_programsService.delete(id)      // delete
```

Pages call these in `useEffect` on mount, store results in local `useState`, and render. There is no global state manager — each page owns its data.

---

## 5. Complete Screen Inventory

### 5.1 Launch Screen

**File:** `src/components/LaunchScreen.tsx`

Full-viewport animated splash screen. Left half: hero title ("CENTER OF EXCELLENCE"), launch button, authenticated user's name from Dataverse. Right half: two-tab preview panel.

- **Analytics tab:** Platform KPI summary (Total Programmes: 47, AI Adoption: 64%, People Trained: 1182, Risk Score: 94%), module coverage progress list, "Powered by DEWA COE" footer.
- **Platform tab:** Animated cards — file browser showing Dataverse tables, progress sync showing 6 loading steps, context sources card.

User clicks "Launch Platform" → 700ms spinner → `launched` state flips to true → full app renders.

---

### 5.2 Executive Summary

**Route key:** `executive-summary`  
**File:** `src/pages/ExecutiveSummary.tsx`  
**CSS:** `src/executive-summary.css` (prefix: `es2-`)

Flagship view for leadership reviews. All data is currently static (hardcoded Q1 2026 snapshots). Scroll-triggered animations fire as each section enters the viewport.

**Sections:**
- **Hero strip:** Dark banner, animated SVG neural network (16 nodes, 22 edges). Title: "AI Intelligence Command Center". Live badge.
- **Section 1 — KPIs (4 cards):** AI Adoption Rate 64% (ring chart), Total AI Initiatives 47, Active AI Projects 31, People Trained 1,182.
- **Section 2 — Impact Analysis:** 4 impact cards (AED 4.2M savings, 28,400 hours automated, +34% efficiency, −62% error rate). ROI Trend ComposedChart (green bars + gold line, Oct→Mar).
- **Section 3 — AI Risk & Governance:** 4 stat badges + risk-by-category breakdown.
- **Section 4 — AI Workforce Readiness:** 4 metric cards with progress bars + Skill Domain Completion panel (6 horizontal bars).
- **Section 5 — Programs Overview:** Date range toggle (Month/Quarter/Year), bar chart by category, count tiles.

---

### 5.3 Division Analytics

**Route key:** `division-analytics`  
**File:** `src/pages/DivisionAnalytics.tsx`  
**Sub-tabs:** `src/pages/ps/AdoptionTab.tsx`, `src/pages/ps/AdkarTab.tsx`

Live Dataverse (`cr978_coe_divisions`). Two sub-tabs:

**Adoption tab (`AdoptionTab.tsx`)**
- **AI Adoption by Division** — BarChart, 8 divisions, adoption % colour-coded (green ≥75%, amber 60–74%, grey <60%). Live Dataverse.
- **Tool Adoption Lanes** — 4 horizontal swim lanes (Microsoft Copilot, Custom GPTs, Power Automate AI, AI Vision). Each lane positions all 8 divisions as floating pills at their exact adoption % along a 0–100% axis, staggered into two rows to avoid overlap. An org-average marker (vertical line) runs through each lane. Hovering a pill shows a tooltip with division name, tool, % value, and delta vs org average. Data is simulated seed (`TOOL_SEED`).

**ADKAR tab (`AdkarTab.tsx`)**
- **Division selector strip** — pill buttons with ADKAR composite average per division.
- **Radar chart** — 5-dimension polygon for the selected division (Awareness, Desire, Knowledge, Ability, Reinforcement).
- **Dimension breakdown** — 5 progress bars with descriptions for the selected division.
- **ADKAR Dimension Heatmap** — replaces the legacy all-divisions table. An 8×5 grid of colour-coded cells (divisions × ADKAR dimensions). Green ≥80, gold 65–79, red <65. Cell intensity scales with score. Clicking a row changes the selected division. Hover tooltip shows exact division + dimension + value.

---

### 5.4 People & Skills

**Route key:** `people-skills`  
**File:** `src/pages/PeopleSkills.tsx`

Four sub-tabs (`adoption`, `certifications`, `skills`, `performance`):

- **Adoption** (`PeopleAdoptionTab.tsx`) — Live Dataverse. Fetches persons, divisions, departments, approles. Filterable table of all employees.
- **Certifications** (`CertificationsTab.tsx`) — Static. 17 certifications across 18 employees. Provider breakdown bar chart, status distribution donut.
- **Skills** (`SkillsTab.tsx`) — Static. Tag cloud of 15 skills, category filters, top-10 bar chart.
- **Performance** (`PerformanceTab.tsx`) — Static. Score distribution histogram, AI contribution heatmap.

---

### 5.5 Programs

**Route key:** `programs`  
**File:** `src/pages/Programs.tsx`

Live Dataverse (`cr978_coe_programs`). Cards for each programme: name, status badge, description, date range, division, event count, participant count. Toolbar: text search, status filter tabs, "+ Add Program" button.

Clicking "View Events" sets `contextProgram` in Layout and switches to Events tab — the only cross-page navigation.

"+ Add Program" opens `AddProgramModal`: name, start/end dates, division (dropdown), owner. Calls `Cr978_coe_programsService.create()`.

---

### 5.6 Events

**Route key:** `events`  
**File:** `src/pages/Events.tsx`  
**CSS:** `src/events.css` (prefix: `ev2-`)

Live Dataverse (`cr978_coe_eventses` + `cr978_coe_divisions` for division name lookup). Full v2 redesign.

**Charts row (`EventsChartsRow`)** — rendered above the list when not filtered by programme:
- **Events Delivered & Planned** — Stacked BarChart (10-month rolling window, Completed/Upcoming/Cancelled per month).
- **By Division** — Donut PieChart (top 6 divisions, colour-coded, legend alongside).
- **Attendance Rate** — LineChart (last 6 completed events with `attendees/invitees` ratio).

**Layout modes** (segmented control in toolbar):
- **Timeline** — Events grouped by month (newest first), each group shows month header + stacked `EventCard` rows.
- **Grid** — `EventCard` cards with a coloured cover image (gradient per event type / red for Cancelled), type icon, badges.
- **Calendar** — Monthly grid with event pills per day (click opens `EventDetailPanel`). Prev/Next month navigation, "Today" jump button.

**Toolbar:**
- 3 status tabs: Upcoming / Completed / Cancelled (with event counts per tab).
- Search input with clear button.
- Division `<select>` (only shown when >1 division present).
- Type filter chip row: All / Webinar / Instructor-led Training / Hands-on Workshop / Hackathon.

**Featured banner (`FeaturedBanner`)** — shown above timeline for the soonest upcoming event (no type/division/search filter active). Shows date block, title, time/location/division meta, countdown "N days away", "View Details" button.

**Event detail (`EventDetailPanel`)** — slide-in right panel (not a modal). Coloured header gradient matches event type. Body: type pill, status pill, date, time, location, division, attendees, invitees, attendance rate progress bar, duration, event code, programme, target audience, tech stack, description, speakers, outcomes, cancelled note. Uses `useScrollLock`. Backdrop click closes.

**`ProgramDetailPanel`** — rendered at top when `fromProgram` is set (Programs → Events drill-down). Dark gradient header with "← Back to Programs" button, programme metadata.

**Data shape (`AppEvent`):** `id`, `programId`, `title`, `type`, `date`, `time`, `location`, `attendees`, `status`, `description`, `speakers[]`, `attendeesList[]`, `outcomes[]`, `duration`, `invitees`, `adoptionRate`, `techStack`, `eventCode`, `targetAudience`, `division`, `program`.

**Event type ↔ gradient map:** Workshop/Hands-on Workshop → teal, Webinar → purple, Hackathon → green, Seminar/ILT → blue, Town Hall → navy. Cancelled overrides all with red.

---

### 5.7 Technology Stack

**Route key:** `technology-stack`  
**File:** `src/pages/TechnologyStack.tsx`  
**Sub-component:** `src/pages/ps/AIToolsTab.tsx`

Static data. 7 AI tools (ChatGPT, Claude, Microsoft Copilot, Power BI, Azure AI Services, DALL-E, GitHub Copilot). Tool list with adoption %, monthly growth %, queries/month, NPS score. Clicking a tool opens detail panel: KPI cards, 6-month trend chart, department breakdown bar chart.

Also contains **Agent Value Intelligence** section: 6 KPI tiles, 2 pie charts, type/behavior/benefit charts, registry table. Powered by `CopilotDataContext`.

---

### 5.8 Discovery Catalog

**Route key:** `discovery-catalog`  
**File:** `src/pages/DiscoveryCatalog.tsx`  
**CSS:** `src/discovery-catalog.css`

Live Dataverse (`cr978_coe_discoveries` + division/department/person lookups).

KPI strip: totals by type, divisions/departments represented, IT leads assigned. Cards showing discovery title, division, type badge (AI/Non-AI), status badge (pipeline stages), IT lead, date. Charts: status pie, type split, department bar. Filters: search, status, type, division.

---

### 5.9 AI Incidents

**Route key:** `ai-incident`  
**File:** `src/pages/AIIncident.tsx`  
**CSS:** `src/ai-incident.css`

Live Dataverse (`cr978_coe_aiincidents`). Table: ticket number, name, AI platform, type, priority badge (Critical/High/Medium/Low), severity badge (P1-P4), status, date, assignee, data-risk flag. Toolbar: status filter, priority filter, search. Clicking a row opens Incident Detail Modal with timeline, tags, root cause, people affected.

Summary charts above table: status bar, priority horizontal bar, type breakdown bar.

---

### 5.10 Finance *(sidebar hidden — not in active nav)*

**File:** `src/pages/Finance.tsx`  
**CSS:** `src/finance.css`

Hybrid data: division names from Dataverse, budget figures from hardcoded `FINANCE_SEED` (no Finance table in Dataverse yet). Per-division cards: allocated vs actual spend, forecast, utilisation % with status flag, YoY change, project count. Charts: grouped bar, utilisation rank, scatter, pie.

---

### 5.11 Strategic Roadmap *(sidebar hidden — not in active nav)*

**File:** `src/pages/StrategicRoadmap.tsx`

Static. Four phases (Foundation, Growth, Excellence, Innovation). Phase cards strip with % complete and progress bar. Initiative list with search/filter. Initiative detail modal with milestones and KPIs.

---

### 5.12 AI Command Center

**Route key:** `ai-command-center`  
**File:** `src/pages/AICommandCenter.tsx`  
**CSS:** `src/ai-command-center.css`

Live Dataverse (`cr978_powerbidashboards`). Tracks Power BI dashboard deployment. KPI strip by status/phase/priority. Status donut + phase bar + priority bar charts. Searchable/filterable dashboard table with expandable rows.

---

### 5.13 Al Hasbah

**Route keys:** `al-hasbah` · `ah-leadership` · `ah-kpi-performance` · `ah-kpi-repository` · `ah-agent-repository` · `ah-use-case-repository` · `ah-health`  
**Container:** `src/pages/AlHasbah.tsx`  
**CSS:** `src/al-hasbah.css`  
**Data source:** Static seed data (`src/pages/alhasbah/data.ts`) — backend integration pending  

Al Hasbah is DEWA's AI agent adoption programme dashboard. It covers three pilot divisions: HR, Finance, and Billing. The page acts as a thin router that maps an `AlHasbahTabId` prop to one of six sub-views.

**Sub-tabs:**

| Tab | Component | Purpose |
|-----|-----------|---------|
| Leadership Dashboard (`ah-leadership`) | `LeadershipDashboard.tsx` | Executive roll-up: animated tech-radar intro strip, Agent Portfolio Widget, 2-col grid (Use Cases card + KPI Monitoring card), Incidents section. Drill-down panels: `RequestDrillDown`, `FailureDrillDown`. |
| KPI Performance (`ah-kpi-performance`) | `KPIPerformance.tsx` | Per-KPI trend line charts with target reference line, status badges (On Track / At Risk / Off Track), achievement %, filter by division/status. |
| KPI Repository (`ah-kpi-repository`) | `KPIRepository.tsx` | Full KPI catalogue: searchable/filterable table, KPI definition, unit, frequency, scope, achievability flag. `KPIFormPanel` (slide-in) for add/edit. `NotAchievableModal` for marking KPIs not achievable with reason. |
| AI Agent Repository (`ah-agent-repository`) | `AIAgentRepository.tsx` | Agent card grid — name, division, status (Live/Pipeline/Planned), KPI metrics (transactions, adoption %, open incidents, PTU usage). `AgentDetailPanel` (slide-in) + `AgentFormPanel` for add/edit. `FormulaInfo` tooltip explains metric calculations. |
| Use Case Repository (`ah-use-case-repository`) | `UseCaseRepository.tsx` | Use case cards linked to agents — domain, SAP module, milestone progress, go-live dates, expected efficiency/savings. `UseCaseDetailPanel` + `UseCaseFormPanel` slide-in panels. |
| AI Health & Incidents (`ah-health`) | `Incidents.tsx` | Incident table with severity (Critical–Low), type (AI Agent / SAP / Business Process / Knowledge Gap), status pipeline. `IncidentDetailPanel` (slide-in). Two analysis panels: `KnowledgeGapsPanel`, `ChangeManagementPanel`. |

**Shared utilities (inside `src/pages/alhasbah/`):**
- `NotificationToast.tsx` + `useToast` hook — ephemeral success/error toasts used across all CRUD actions
- `FormulaInfo.tsx` — small icon that reveals the calculation formula for a given metric on hover

**Data types (`src/pages/alhasbah/data.ts`):**

| Type | Key fields |
|------|-----------|
| `AHAgent` | id, name, division, status, modelsUsed, systemsIntegrated, annualTransactions, aiAdoptionPct, ptuUsage, mcpServers |
| `AHUseCase` | id, agentId, domain, sapModule, plannedGoLive, milestones[], expectedEfficiency, targetCostSaving |
| `AHKPI` | id, agentId, kpiName, unit, targetValue, currentValue, status, trend, history[], achievable |
| `AHIncident` | id, severity, type, status, description, affectedAgent |

---

## 6. User Flow Maps

### 6.1 First-Time Launch

```
User opens Power Apps container
  └─ PowerProvider initialises SDK
  └─ useCurrentUser() fires
       ├─ getContext() → user.fullName + user.userPrincipalName
       ├─ Dataverse lookup in cr978_coe_persons by email
       │    ├─ Found → name = record.name, role = record.role
       │    └─ Not found / timeout → name = 'User', role = 'Member'
       └─ LaunchScreen renders with user.name in greeting
  └─ User clicks "Launch Platform"
       └─ 700ms spinner → App.launched = true → Layout renders
```

### 6.2 Standard Navigation

```
User clicks nav item
  └─ Sidebar calls onTabChange(tabId)
       └─ Layout sets activeTab = tabId
       └─ New page renders, useEffect fires → Dataverse fetch (if live page)
```

### 6.3 Programs → Events Drill-Down

```
User clicks "View Events" on a programme card
  └─ Layout sets contextProgram = { id, name, ... }
  └─ Layout sets activeTab = "events"
  └─ Events page filters to that programme + shows "← Back to Programs"
  └─ User clicks back → contextProgram = null, activeTab = "programs"
```

### 6.4 Adding a New Programme

```
User clicks "+ Add Program"
  └─ Form fields: name, start date, end date, division, owner
  └─ Client validation → Cr978_coe_programsService.create(formData)
       ├─ Success → modal closes, list refetches
       └─ Error → error banner inside modal, stays open
```

### 6.5 Using CommandIQ (AI Chat)

```
User clicks floating orb (bottom-right)
  └─ Chat panel slides in (welcome message + 6 quick prompts on first open)
  └─ User sends message
       └─ POST to Power Automate endpoint: { Prompt, ConverId }
            ├─ Success → typewriter animation at 2 chars/20ms
            └─ Error → "I couldn't reach the AI endpoint" fallback
  └─ conversationIdRef persists for multi-turn context
```

---

## 7. Screen State Descriptions

### Programs Page States

| State | Behaviour |
|-------|-----------|
| Loading | 3 skeleton card placeholders |
| Empty | "No programmes found" + "+ Add your first programme" CTA |
| Populated | Cards wrap across rows, toolbar filters functional |
| Filtered (no matches) | "No programmes match your search" empty state |
| Add Modal — save in progress | Save button shows spinner, inputs disabled |
| Add Modal — save error | Error banner inside modal, inputs re-enabled |

### Events Page States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton cards (list) or skeleton calendar grid |
| List view | Event cards, status tabs with counts |
| Calendar view | Month grid, coloured dots on event dates |
| Filtered by contextProgram | Breadcrumb visible, list narrowed, title updated |

### AI Incidents Page States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton rows + empty charts |
| Active critical incident | Red "Critical" row appears first (sorted by priority) |
| Modal open | Timeline, tags, root cause, data-risk flag if set |

### CommandIQ States

| State | Behaviour |
|-------|-----------|
| Closed | Floating orb, unread badge if new messages |
| Open — first time | Welcome message + 6 quick-prompt buttons |
| Thinking | Typing indicator (3 pulsing dots), Send disabled |
| Streaming response | Typewriter animation at 2 chars/20ms |

---

## 8. Component Inventory

### Shell & Navigation

| Component | File | Purpose |
|-----------|------|---------|
| `Layout` | `src/components/Layout.tsx` | App shell. Owns `activeTab`, `collapsed`, `mobileOpen`, `isMobile`, `contextProgram`. Handles responsive resize, `AH_TO_SUB`/`SUB_TO_AH` maps for Al Hasbah routing, `onLogout` prop. Wraps each page in `<ErrorBoundary key={activeTab}>`. |
| `Sidebar` | `src/components/Sidebar.tsx` | Left nav. Accordion sub-menus for Programs/Events and Al Hasbah (6 sub-items). Collapses to icon-only on desktop; slides in as overlay on mobile. Logout button in footer. |
| `Icon` | `src/components/Icon.tsx` | 149 Bootstrap Icons embedded as path strings. No external font load. |
| `LaunchScreen` | `src/components/LaunchScreen.tsx` | Animated splash + auth screen. Calls `useCurrentUser()`. |
| `CommandIQ` | `src/components/CommandIQ.tsx` | Floating orb + chat panel. Self-contained — no props, no context. Wired to Copilot Studio agent via `MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2`. |
| `DataSourceBadge` | `src/components/DataSourceBadge.tsx` | Small badge shown in page headers. Props: `type` (`"live" \| "simulated" \| "hybrid"`), `title`, `lastUpdated` (displayed date string). Renders a coloured dot + label + "Last updated" date. Used on every page for data provenance. |
| `FloatingLines` | `src/components/FloatingLines.tsx` | Animated SVG decorative background used in the launch screen and hero sections. |

### Custom Hooks

| Hook | File | Returns |
|------|------|---------|
| `useCurrentUser` | `src/hooks/useCurrentUser.ts` | `{ name, role, email, loading }`. 6s timeout in local dev. |
| `useScrollLock` | `src/hooks/useScrollLock.ts` | Locks `document.body.style.overflow` to `'hidden'` on mount and restores on unmount. Used by slide-in detail panels (Events) to prevent background scroll. |

### People & Skills Sub-Components

| Component | File | Purpose |
|-----------|------|---------|
| `AdoptionTab` | `src/pages/ps/AdoptionTab.tsx` | AI Adoption by Division BarChart + Tool Adoption Lanes strip plot. |
| `AdkarTab` | `src/pages/ps/AdkarTab.tsx` | ADKAR radar + dimension bars + heatmap. |
| `AIToolsTab` | `src/pages/ps/AIToolsTab.tsx` | Technology Stack tool list + detail panel with trend charts. |
| `CertificationsTab` | `src/pages/ps/CertificationsTab.tsx` | Static certifications table + charts. |
| `SkillsTab` | `src/pages/ps/SkillsTab.tsx` | Tag cloud + category filter + bar chart. |
| `PerformanceTab` | `src/pages/ps/PerformanceTab.tsx` | Histogram + contribution heatmap. |

### Technology Stack Sub-Components

| Component | File | Purpose |
|-----------|------|---------|
| `TechStackView` | `src/pages/ps/TechStackView.tsx` | Tool card grid with adoption/growth metrics. |
| `TechStackDetailPanel` | `src/pages/ps/TechStackDetailPanel.tsx` | Right slide-in panel for a selected tool (KPI tiles, trend chart, department breakdown). |

### Rammas at Work Sub-Components

| Component | File | Purpose |
|-----------|------|---------|
| `RammasAtWorkPanel` | *(integrated in TechnologyStack or PeopleSkills)* | Container for the Rammas-specific views. |
| `RammasBrdTab` | *(sub-tab)* | Board / summary view for Rammas data. |
| `RammasKmTab` | *(sub-tab)* | Knowledge management view for Rammas data. |
| `RammasMyRammasTab` | *(sub-tab)* | Personal Rammas usage view. |

### Al Hasbah Sub-Components

**Top-level tabs (`src/pages/alhasbah/`):**

| Component | File | Purpose |
|-----------|------|---------|
| `LeadershipDashboard` | `LeadershipDashboard.tsx` | Executive roll-up: radar animation, Agent Portfolio Widget, KPI/Use Cases 2-col grid, Incidents strip. |
| `KPIPerformance` | `KPIPerformance.tsx` | KPI trend charts with target reference lines, status/division filters, achievement % calculation. |
| `KPIRepository` | `KPIRepository.tsx` | KPI catalogue table, add/edit via `KPIFormPanel`, mark-not-achievable via `NotAchievableModal`. |
| `AIAgentRepository` | `AIAgentRepository.tsx` | Agent card grid with `StatBox` metrics, `AgentDetailPanel`, `AgentFormPanel`, `FormulaInfo` tooltips. |
| `UseCaseRepository` | `UseCaseRepository.tsx` | Use case cards with milestone bars, `UseCaseDetailPanel`, `UseCaseFormPanel`. |
| `Incidents` | `Incidents.tsx` | Incident table, `IncidentDetailPanel`, `KnowledgeGapsPanel`, `ChangeManagementPanel`. |

**Leadership sub-components (`src/pages/alhasbah/leadership/`):**

| Component | Purpose |
|-----------|---------|
| `AgentPortfolioWidget` | KPI strip + agent status summary + drill-down triggers |
| `UseCasesCard` | Use cases count by status with nav link to repository |
| `KPIMonitoringCard` | KPI on-track/at-risk/off-track summary with nav link |
| `IncidentsSection` | Recent incidents strip with severity badges |
| `RequestDrillDown` | Slide-in panel: full request volume analysis |
| `FailureDrillDown` | Slide-in panel: failure breakdown by category |
| `AgentDetailPanel` | Slide-in: full agent profile (models, systems, KPIs, use cases) |
| `UseCaseDetailPanel` | Slide-in: use case detail with milestones and system integrations |
| `KPIDetailOverlay` | Overlay: expanded KPI chart + history table |

**Form/utility components:**

| Component | Purpose |
|-----------|---------|
| `AgentFormPanel` (`agents/`) | Add/edit agent slide-in form |
| `KPIFormPanel` (`kpis/`) | Add/edit KPI slide-in form |
| `UseCaseFormPanel` (`usecases/`) | Add/edit use case slide-in form |
| `IncidentFormPanel` (`incidents/`) | Add/edit incident slide-in form |
| `KnowledgeGapsPanel` (`incidents/`) | Analysis panel for knowledge-gap type incidents |
| `ChangeManagementPanel` (`incidents/`) | ADKAR change impact panel for incidents |
| `NotAchievableModal` (`kpis/`) | Modal: capture reason when marking a KPI not achievable |
| `NotificationToast` | Ephemeral toast + `useToast` hook for CRUD feedback |
| `FormulaInfo` | Hover tooltip explaining metric calculation formulas |

### Recharts Usage by Page

| Chart type | Pages | Notes |
|------------|-------|-------|
| `BarChart + Bar` | ExecutiveSummary, DivisionAnalytics, Finance, AICommandCenter | `radius={[8,8,0,0]}`, `Cell` per-bar for custom colours |
| `ComposedChart + Bar + Line` | ExecutiveSummary (ROI Trend) | Dual Y-axes |
| `LineChart + Line` | TechnologyStack | With `activeDot` |
| `PieChart + Pie + Cell` | DiscoveryCatalog, AICommandCenter | Custom `labelLine` |

Custom tooltip background: `#1c2a24`, white text.

### Reusable Patterns (inline, not yet extracted)

- **Status Badge** — pill span, colour-coded: green (Active/Completed/Low), amber (In Progress/Medium), red (Critical/High), grey (On Hold/Unknown)
- **KPI Card** — icon + animated counter + label + sub-text. Optional ring chart variant.
- **Filter Toolbar** — text search + status tab buttons + optional dropdowns
- **Detail Modal** — full-screen overlay, close top-right, scrollable content
- **AnimBar** — div track + div fill, width transitions 0% → value% on `inView`
- **AnimatedRing** — SVG circle `strokeDashoffset` transition + counter overlay
- **useCounter** — `requestAnimationFrame` loop with cubic-bezier easing

---

## 9. Data Relationships

### Dataverse Tables

```
cr978_coe_divisions
  ├─ cr978_coe_departments  (_cr978_coe_division_value FK)
  ├─ cr978_coe_persons      (_cr978_coe_division_value, _cr978_coe_department_value, _cr978_coe_approle_value FKs)
  ├─ cr978_coe_programs     (_cr978_coe_division_value FK)
  └─ cr978_coe_discoveries  (_cr978_coe_requestingdivision_value, _cr978_coe_requestingdepartment_value, _cr978_it_lead_value FKs)

cr978_coe_programs
  └─ cr978_coe_eventses  (_cr978_coe_program_value FK)

cr978_coe_aiincidents
  └─ _cr978_coe_reportedby_value, _cr978_coe_assignedto_value FKs → persons

cr978_coe_approles
  └─ referenced by persons

cr978_powerbidashboards
  └─ _cr978_coe_program_value FK → programs (optional)
```

### FK Resolution Pattern

FK columns are stored as GUIDs. Pages must resolve to human-readable names via Map:

```ts
const [divisionsRes, departmentsRes] = await Promise.all([
  Cr978_coe_divisionsService.getAll(),
  Cr978_coe_departmentsService.getAll(),
])
const divisionMap = new Map(divisionsRes.data.map(d => [d.id, d.name]))
const divisionName = divisionMap.get(person._cr978_coe_division_value) ?? 'Unknown'
```

### Live vs. Static Data

| Page / Section | Source | Notes |
|----------------|--------|-------|
| Executive Summary | Static | Q1 2026 snapshot hardcoded |
| Division Analytics | Static | Hardcoded per-division scores |
| People — Adoption tab | Live Dataverse | 4 tables fetched on mount |
| People — Certifications / Skills / Performance | Static | `src/pages/ps/data.ts` |
| Programs | Live Dataverse | Full CRUD (read + create) |
| Events | Live Dataverse | Read-only |
| Technology Stack | Static | `src/pages/ps/data.ts` (AI tools) |
| Discovery Catalog | Live Dataverse | Read-only, 3 lookup tables |
| AI Incidents | Live Dataverse | Read-only |
| Finance | Hybrid | Division names live, budget from FINANCE_SEED array |
| Strategic Roadmap | Static | Hardcoded phases + initiatives |
| AI Command Center | Live Dataverse | Read-only |
| Al Hasbah (all sub-tabs) | Static seed | `src/pages/alhasbah/data.ts` — backend Dataverse integration pending |
| CommandIQ chat | Live Power Automate | Real-time POST per message |

### Cross-Page State

Only `contextProgram` crosses page boundaries (set by Programs, consumed by Events, stored in Layout). All other page data is local `useState`. No global store.

### Data Persistence

| Data | Persisted | Lifecycle |
|------|-----------|-----------|
| Dataverse records | Dataverse cloud | Permanent |
| Active tab | Layout useState | Session only |
| contextProgram | Layout useState | Clears on back-navigation |
| CommandIQ conversation ID | useRef | Session only |
| Filter/search inputs | Local useState per page | Clears on tab switch |
| Animation state | Local useState | Re-animates on next scroll |

---

## 10. Build & Deployment

### Development

```bash
npm run dev       # pac code run + vite on http://localhost:3000
npm run lint      # ESLint (TypeScript strict)
```

Dataverse calls fail gracefully in local dev (SDK context unavailable). Static pages work fully offline. `useCurrentUser` falls back to `{ name: "User", role: "Member" }` after 6 seconds.

### Production Build

```bash
npm run build     # tsc -b && vite build → ./dist
npm run preview   # preview ./dist locally
```

Standard Vite bundle. The Microsoft Power Apps Vite plugin packages for deployment via `pac code push`.

### Deployment Target

Power Platform environment `07da6342-8cc4-e81c-95fa-9ce24e7c2f46`. Runs inside the Power Apps runtime container which provides SDK context, Dataverse connectivity, and user authentication.

### TypeScript Config

`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. All Dataverse models are strongly typed from generated code in `src/generated/`. Adding a new Dataverse table requires re-running the Power Apps code generation tool — do not hand-write model code.

---

## 11. Recent Changes

### RammasAtWorkService (`src/services/RammasAtWorkService.ts`)

Fetches data from a Power Automate flow (`Rammas_Send_ResponseService.Run({})`) and returns a `RammasAtWorkData` object containing 18 typed arrays across three product areas:

| Area | Arrays |
|------|--------|
| **BRD** | `brd_api_logs`, `brd_openai_analytics`, `brd_records`, `brd_template_records` |
| **MyRammas** | `myrammas-live-bot`, `myrammas-draft-bot`, `myrammas-api-logs`, `myrammas-openai-analytics`, `myrammas-preview-qna`, `myrammas-shared-bots` |
| **KM** | `km-document-details`, `km-users`, `km-conversation-analytics`, `km-open-ai-analytics`, `km-api-logs`, `km-folder-details`, `km-division`, `km-department` |

The service has a 5-minute in-memory cache and in-flight deduplication (concurrent callers share one request). `CopilotDataContext` warms this cache at app startup so Rammas panels load instantly.

---

| Date | Change |
|------|--------|
| 2026-05-28 | **Al Hasbah module.** New top-level section tracking DEWA's AI agent adoption programme. 6 sub-tabs: Leadership Dashboard, KPI Performance, KPI Repository, AI Agent Repository, Use Case Repository, AI Health & Incidents. All data from static seed (`src/pages/alhasbah/data.ts`) — backend integration pending. Container: `src/pages/AlHasbah.tsx` + `src/al-hasbah.css`. 25 sub-components across `src/pages/alhasbah/`. |
| 2026-05-28 | **Responsive layout.** `Layout.tsx` tracks `isMobile` (≤768 px) via resize listener. Mobile: sidebar becomes a slide-in overlay (`mobileOpen`). Desktop: collapses to icon-only. `onLogout` prop threaded App→Layout→Sidebar. Each page wrapped in `<ErrorBoundary key={activeTab}>`. |
| 2026-05-28 | **Al Hasbah sidebar nav.** `Sidebar.tsx`: `TabId` extended with 6 `ah-*` sub-tabs. Accordion menu for Al Hasbah (alongside existing Programs accordion). `landingTab` mechanism: clicking the Al Hasbah parent navigates to `ah-leadership`. Logout button added to sidebar footer. |
| 2026-05-28 | **RammasAtWorkService typed.** Full TypeScript types added for all 18 response arrays (BRD, MyRammas, KM). 5-minute cache + in-flight dedup. `CopilotDataContext` warm-start call added. |
| 2026-05-17 | **Division Analytics — Tool Adoption Lanes.** New section in `AdoptionTab.tsx`. 4 horizontal swim lanes (Microsoft Copilot, Custom GPTs, Power Automate AI, AI Vision). Each lane positions 8 divisions as floating pills at their adoption % along a 0–100% axis, staggered two rows to avoid overlap. Org-average marker per lane. Fixed-position tooltip on hover (`getBoundingClientRect`). Seed data in `TOOL_SEED`. |
| 2026-05-17 | **Division Analytics — ADKAR Dimension Heatmap.** Replaced the duplicate all-divisions table in `AdkarTab.tsx` with an 8×5 colour-coded grid (divisions × ADKAR dimensions). Green ≥80, gold 65–79, red <65. Clicking a row updates the radar/bars selection. `heatBg` + `heatBorder` helper functions added. |
| 2026-05-17 | **Events v2 full redesign.** `src/pages/Events.tsx` rewritten. Added `EventsChartsRow` (3 charts: monthly stacked bar, division donut, attendance sparkline). Added `FeaturedBanner` for soonest upcoming event. Added Timeline / Grid layout modes alongside Calendar. `EventDetailPanel` replaces modal as slide-in panel. Division filter select + type chip filters added. `useScrollLock` used in panel. `DataSourceBadge` added. |
| 2026-05-17 | **`DataSourceBadge` component.** Added `lastUpdated` prop. Now shown on every page in the page-header to communicate data provenance and freshness date. |
| 2026-05-17 | **`/copilot-agent-connect` skill created.** `.claude/skills/copilot-agent-connect/SKILL.md` + TSX template + CSS template + connector JSON reference. Portable Claude Code skill: prompts for agent logical name, environment ID, display name, colours, quick prompts; generates a complete `{{PASCAL_NAME}}Chat.tsx` + CSS component wired to `MicrosoftCopilotStudioService.ExecuteCopilotAsyncV2`. |
| 2026-04-12 | Font stack updated to `'Dubai', 'Segoe UI', system-ui, sans-serif` across all CSS files. |
| 2026-04-12 | No-emoji rule enforced. All emoji replaced with `<Icon name="bi-*" />`. `bi-currency-dirham` mandatory for finance contexts. |
| 2026-04-12 | CopilotKit restructured — embedded inside Technology Stack as `CopilotKitPanel`. `copilot-kit` tab removed. `CopilotDataContext` added. Agent Value Intelligence section added. |
| 2026-04-11 | Technology Stack page wraps `AIToolsTab`. `AIToolsTab.tsx` — Microsoft Copilot live card + detail panel. |

*Active tabs: executive-summary, division-analytics, programs, events, people-skills, technology-stack, discovery-catalog, ai-incident, ai-command-center, al-hasbah (+ sub-tabs: ah-leadership, ah-kpi-performance, ah-kpi-repository, ah-agent-repository, ah-use-case-repository, ah-health).*
