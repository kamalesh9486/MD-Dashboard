---
name: md-dashboard-kpis
description: >-
  The single source of truth for the DEWA "MD View" agentic-AI dashboard: every
  KPI/panel by name, its REAL evidenced value vs NA, and which source report the
  data comes from. USE THIS SKILL whenever the user mentions the MD dashboard, MD
  View, the Agentic AI Progress board, or names any of its panels/KPIs — "Agent
  Inventory & Coverage", "Agents by Pillar", "Progress Trend by Month", "Top-Line
  Impact", "AI Maturity by Segment", "Progress by Pillars", "Transformation
  Progress", "Overall Readiness", "Customer Services / Process & Operations /
  People" cards, "DEWA AI Portfolio", "Delivery by stages", cost saving / FTE /
  interactions / people trained, or the Excel⇄Dataverse toggle. ALSO trigger when
  the user asks whether a number is real or should be NA, points at the reference
  PDF, or references the consolidation reports (Consolidated_Initiatives*,
  DEWA_Full_Report, KPI Register, import_md_*, ai-state-of-report). Read this
  BEFORE editing consolidatedReport.ts, boardV2.tsx, AumBoardV3.tsx, aumBoard.ts,
  or aumPeople.ts so you use only evidenced values and mark the rest NA.
---

# MD View Dashboard — KPI Reference

The MD View board (aka "Agentic AI Progress", DEWA COE) is the single dense dashboard
tracking DEWA's agentic-AI transformation. This skill maps **panel/KPI name →
what it is → real value or NA → source**, so you never have to re-derive it and
you never put an unevidenced number on the board.

**Golden rule (the user is firm on this):** only show numbers that are backed by a
real report. Everything else renders as **NA** — no estimates, no transcribing the
reference PDF's illustrative numbers. When unsure whether a value is real, assume
NA and check the table below / `references/kpi-resolution.md`.

## The reference layout (`consolidation/Agentic AI refference.pdf`)

The PDF is the **layout + KPI-name spec** the user wants matched (its *numbers* are
illustrative — use the evidenced values below, not the PDF's). Header: "Agentic AI
Progress · As of July 2026 · Target 50% by 2027". Panels:

- **Row 1:** Transformation Progress (gauge) · Progress by Pillars (Customer/Process/People + targets) · AI Maturity by Segment (EVP/VP/Sr Mgr/Employees) · Top-Line Impact (Cost Saving / FTE Saving / Cost Avoidance)
- **Row 2:** Progress Trend by Month (line) · Agents by Pillar (Customer/Processes/People) · Agent Inventory & Coverage (Total Services / **Internal / External**)
- **Row 3:** Customer Services card · Process & Operations card (with Delivery-by-stages donut) · People card · right column stat cards (Overall Readiness, Total Agents, Agentic Services %, Agentic Processes %)
- **Bottom:** DEWA AI Portfolio Growth (quarterly stacked bars Q1'25→Q3'26)

## KPI resolution — real value vs NA (authoritative)

Verified against `Consolidated_Initiatives_1.xlsx` (`KPI Register` = the report's own
"verified" answer key; `Master` = 541 raw records), the `import_md_*` raw files, and
`DEWA_Full_Report_2.html`. Full detail + provenance in
[references/kpi-resolution.md](references/kpi-resolution.md).

| Panel / KPI | Real value | NA? | Source |
|---|---|---|---|
| Transformation Progress / Overall Readiness | **33%** (avg of pillars 30/26/44) | — | KPI Register; Master pillar split |
| Transformation target / all pillar targets (22/110/8000) | — | **NA** | no target field anywhere |
| Progress by Pillars — Customer | **30%** (35 of 117 UC) | — | KPI Register; usecase Domain |
| Progress by Pillars — Process & OPS | **26%** (30 of 117) | — | KPI Register |
| Progress by Pillars — People | **44%** (52 of 117) | — | KPI Register |
| AI Maturity by Segment (EVP / VP / Sr Mgr / Employees) | — | **NA (all 4)** | no leadership-segment maturity field |
| Top-Line Impact — Cost Saving | **AED 273.7M** (excl. 880M outlier) | — | Master `aum_costsaving` |
| Top-Line Impact — FTE Saving | **≈39 FTE** (80,920 hrs ÷ 2,080) | — | agent file `FTE Savings Target` |
| Top-Line Impact — Cost Avoidance | **40.5 FTE + AED 300K** | — | usecase `FTE Avoidance`; deployment `Other Cost Saving` |
| Progress Trend by Month (transformation %) | — | **NA** | monthly snapshots not tracked |
| Progress Trend by Month (event count/mo) | **Jan3·Feb5·Mar4·Apr3·May3·Jun27·Jul6** | — | `COE Events - FINAL import.xlsx` (53 events). *User asked for event-count-by-month here.* |
| Agents by Pillar (ref 22/110/378) | — | **NA** | those numbers unsupported |
| Portfolio by pillar (real split) | **Customer 35 / Processes 30 / People 52** (of 117) | — | KPI Register; usecase Domain |
| Agent Inventory & Coverage panel | **Total Agents 75** · Internal **NA** · External **NA** | partial | board shows reference labels Total/Internal/External; agent file = 75. No internal/external split exists in the data, so those two are NA (user chose Internal/External labels over Live/Deployment). |
| Customer — % services agentic | **30%** | — | KPI Register |
| Customer — Agent resolution rate | — | **NA** | no resolution field |
| Customer — Avg response time | — | **NA** | Base/After-AI = #REF! |
| Customer — Total Interactions | **1.25M** (1,245,691) | — | Master `aum_annualvolume` |
| Customer — CSAT (before→after) | — | **NA** | only 2 records |
| Process — % services agentic | **26%** | — | KPI Register |
| Process — Active AI agents by divisions (ref 284) | — | **NA** | real = 159 initiatives / 13 divisions |
| Process — Delivery by stages | **Build 61% / Test 22% / Live 17%** (approx) | partial | deployment `Stage`; bucketing not locked |
| People — AI adoption rate | — | **NA** | needs workforce headcount denominator |
| People — Leadership adoption | **16 sessions / 693** | medium | COE `cr978_coe_targetedaudience` |
| People — AI literacy maturity (x/5) | — | **NA** | no maturity-level field |
| People — People trained | **9,150** | medium | COE `nofattendees` sum |
| People — Training hours delivered | **16,005** | medium | Σ eventduration × attendees |
| People — Workshops / Trainings | **295** | medium | COUNT `cr978_coe_eventcode` |
| People — Certifications earned | — | **NA** | no certification field |
| People — User satisfaction (x/5) | — | **NA** | only 2 records |
| Overall Readiness MoM delta / Total Agents MoM delta | — | **NA** | no month-over-month history |
| Total Agents (ref 740) | **75** | — | agent file = 75 rows |
| Agentic Services % of eligible | **30%** (35/117) | — | KPI Register |
| Agentic Processes % of eligible | **26%** (30/117) | — | KPI Register |
| DEWA AI Portfolio Growth (quarterly Q1'25→Q3'26) | — | **NA** | no time-series; only current snapshot |

**Medium-confidence People numbers** (leadership/trained/hours/workshops) come from
the KPI Register citing COE event columns (`cr978_coe_*`). Those raw event rows live
in Dataverse, not in the consolidation files — treat as "reported by the register".
The event Excel (`COE Events - FINAL import.xlsx`, 53 events, grouped by
`cr978_coe_eventdate` — the event date, NOT created date) gives: invitees **2,363**,
attendees **2,205**, invited-scope attended **1,816** (77% conversion); by month
Jan3·Feb5·Mar4·Apr3·May3·Jun27·Jul6; categories ILT 50 / Hackathon 1; tech Power BI 20 ·
Copilot 20 · AI Awareness 4 · Claude Code 2 · Claude Skill 1; trainers COO Team 23 ·
Microsoft 9 · Anusha 8 · Ankur 6. Training hours delivered = **15,856** (Σ duration × attendees). These populate the
People-tab charts in the static source (`REPORT_PEOPLE` incl. `.p2`) and are recomputed
live from `cr978_coe_events`.

**People tab is `cr978_coe_events`-ONLY (firm rule).** `peopleAnalytics` and
`REPORT_PEOPLE` expose only event-column metrics: People equipped/trained (2,205),
Training events (53), Hackathons (1), Workshops (NA — none in the import), Webinars & ILT
(50), Training hours (15,856), Avg attendance (77%), Leadership sessions (1). **Excluded →
NA** (no event column): AI adoption rate, AI literacy maturity, certifications, user
satisfaction. Do NOT reintroduce aum/report figures (e.g. the register's 9,150 trained)
into the People **KPI cards**. **One kept exception:** the "Hours saved: monthly → yearly"
arrow uses the aum time-savings column (80,920 hrs/yr · 6,743/mo avg = yr ÷ 12) — the user
wants it, labelled as automation impact, distinct from event-based "Training hours delivered" (15,856).

**Chart variety (per user):** the Customer/Process/People tabs must use *varied*
chart types with legends, not just bars + round charts. Renderers in `boardV2.tsx`:
`MiniArea` (trend), `MiniDonut` (composition + side legend), `MiniTreemap` (share),
`MiniHBar` (ranking), `MiniRadial`. Every chart sets a `unit` so the hover reads
"Events: 27", and a `subtitle` so it's legible without hovering.

## Corpus facts

- **541 total records.** Source split (`Master.aum_sourcemaster`): AI Retreat 186 ·
  Al Hasbah use-cases 117 · AI Deployment projects 86 · Agents 75 · State-of-AI apps
  33 · D2D demands 44.
- Use-case status: live 19 · pipeline 35 · planned 63. Agent status: live 12 ·
  pipeline 18 · planned 45.
- Divisions canonicalize to **13**; agents+deployment grouping reported as
  **I&TF 56 / HR 28 / Finance 27 / Billing 23 / BS&HR 12**.

## Source files (READ-ONLY — never write to these)

Under `consolidation/` (and `consolidation/MD Documents/`):
- `Consolidated_Initiatives_1.xlsx` — sheet **`KPI Register`** (the report's own verified answer key) + sheet **`Master`** (541 raw records, 61 cols). Also `Consolidated_Initiatives_Final.xlsx` (same), `Consolidated_Initiatives_by_Division.xlsx`.
- `DEWA_Full_Report_2.html` — narrative form + explicit NA list.
- `MD Documents/import_md_agent (1).xlsx` (75), `import_md_deployment (1).xlsx` (86), `import_md_usecase (2).xlsx` (117), `import_ai_retreat (1).xlsx`, `D2D NEW Data.xlsx` (44), `ai-state-of-report.csv` (33).
- `Agentic AI refference.pdf` — the layout/KPI-name spec.
- Event data: `COE Events - FINAL import.xlsx` (repo root) → the `cr978_coe_events` import (53 events).

## Code map (where each KPI lives)

Only **one** MD board is in the nav now: `md-view-v3` → `AumBoardV3` (labelled "MD View v2").

- `src/pages/AumBoardV3.tsx` — the board wrapper + **Excel(static)⇄Dataverse(live) toggle** (single on/off switch + ⓘ info button). `report` source = static; `live` = Dataverse fetch.
- `src/pages/md/consolidatedReport.ts` — **`REPORT_BOARD` / `REPORT_PEOPLE`** = the static "Excel" values. **Edit real/NA values here.**
- `src/pages/md/aumBoard.ts` — `aumBoardData(rows, mode)` = live values computed from `aum_aiinitiatives`.
- `src/pages/md/aumPeople.ts` — `peopleAnalytics(events, rows)` = live People/event KPIs from `cr978_coe_events`.
- `src/pages/md/aumFetch.ts` — `getAumRows()` loads `aum_aiinitiatives`.
- `src/pages/md/boardV2.tsx` — **`BoardViewV2`**, the tabbed UI (Overview · Processes · Customer · People). Renderers: `MiniArea` / `MiniHBar` / `MiniRadial` / `MiniTreemap` (all take a `unit` for the tooltip label), `ChartPanel` (has `unit` + `subtitle`), `KCard`, `Gauge`, `parseDelivery`.
- `src/pages/md/boardv8Data.ts` — `BoardData` type + `C` colour tokens. NA-able fields: `invLive`, `invDeployment`, optional `divByPillar`.

Charts must set a `unit` (tooltip shows "Events: 27", not a bare "value") and a
`subtitle` so a panel is legible without hovering. Empty data → the panel/tile renders NA.

## Deploy facts

- App **"MD VIEW COE V1"**, appId `38f53f1e-3094-427b-b0b7-b9dd8aff98d6`, env
  `07da6342-8cc4-e81c-95fa-9ce24e7c2f46` (**Ai-COEPlatform-Dev**, coeplatform-dev.crm15).
  Config: `power.config.json`. Live play URL app id = `38f53f1e…`.
- Deploy: `pac env select --environment 07da6342-…` then `pac code push` (build `./dist` first).
- **Known blocker:** pac **2.3.2** `pac code push` crashes with
  `TypeError: Cannot read properties of undefined (reading 'httpClient')`, even with a
  valid profile (suriya.kumar@dewa.gov.ae) and the env selected. Nothing reaches the
  live app until a push succeeds — so a code+build success is *not* a deploy. Candidate
  workaround: `pac code push --solutionName mdview` (solution "MD View" exists in the env).
  Push account: **Suriya DEWA**, pac **2.3.2** (newer pac crashes on this Mac).
