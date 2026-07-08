# KPI Resolution — full detail & provenance

Cross-verified from the consolidation reports. The `KPI Register` sheet in
`Consolidated_Initiatives_1.xlsx` (identical copy in `Consolidated_Initiatives_Final.xlsx`)
is a pre-computed, self-described "verified" answer key; its core figures were
independently confirmed against the raw `Master` sheet (541 records) and the
`import_*` files. The two HTML reports are the narrative form of the same register.

## Full table

| KPI | Real value | Source · where | Confidence |
|---|---|---|---|
| Transformation Progress % (overall) | 33% | KPI Register "Overall Readiness" = avg of pillars (30+26+44)/3 | High |
| …its target | NA | no target field anywhere | High |
| Customer Services % | 30% (35 of 117) | KPI Register; usecase Domain=CUSTOMER 360 (21) + CUSTOMER 360,Cross-Layer (14) = 35 | High |
| Process & OPS % | 26% (30 of 117) | KPI Register "Agentic Processes" | High |
| People % | 44% (52 of 117) | KPI Register "People progress" | High |
| Per-pillar targets (ref 22/110/8000) | NA | no target column | High |
| AI Maturity — EVP / VP / Sr Mgr / Employees | NA (all 4) | no leadership-segment maturity field | High |
| Cost Saving | AED 273.7M (273,723,884) | Master `aum_costsaving` sum excl. 880M outlier | High |
| FTE Saving | ≈39 FTE (80,920 hrs ÷ 2,080) | agent file `FTE Savings Target` sum = 80,920 | High |
| Cost Avoidance | 40.5 FTE + AED 300K | usecase `FTE Avoidance` sum = 40.46; deployment `Other Cost Saving` = 300,000 | High |
| Progress Trend by Month (transformation %) | NA | monthly snapshots not tracked | High |
| Progress Trend by Month (event count) | Jan 3 · Feb 5 · Mar 4 · Apr 3 · May 3 · Jun 27 · Jul 6 | `COE Events - FINAL import.xlsx` eventdate (53 events) | High |
| Agents by Pillar (ref 22 / 110 / 378) | NA | numbers unsupported | High |
| Portfolio by pillar (real) | Customer 35 / Processes 30 / People 52 (of 117) | KPI Register "Portfolio by pillar"; usecase Domain counts | High |
| Agent Inventory — Total Services 310 / Internal 248 / External 62 | NA | no internal/external concept in the data | High |
| Real inventory | Total Agents 75; Live in Production 13 (Prod 10 + Live 3); In Deployment 86 | agent file = 75 rows; deployment file = 88 rows (86 net) | High |
| Customer — % services agentic | 30% (35/117) | KPI Register | High |
| Customer — Agent resolution rate | NA | no resolution field | High |
| Customer — Avg response time | NA | Base Line / Time-After-AI = #REF! | High |
| Customer — Total Interactions | 1.25M (1,245,691) | Master `aum_annualvolume` sum = 1,245,691 | High |
| Customer — CSAT (before→after) | NA | CSAT not captured (only 2 records) | High |
| Process — % services agentic | 26% (30/117) | KPI Register | High |
| Process — Active AI agents by divisions (ref 284) | NA | real = 159 initiatives / 13 divisions | High |
| Process — Transformation progress % | 26% (agentic-processes proxy; no separate figure) | KPI Register | Medium |
| Process — Delivery by stages | Build 61% / Test 22% / Live 17% (of 82, excl. cancelled) | deployment `Stage`; flagged APPROX, bucketing not locked | Medium |
| People — AI adoption rate | NA | needs workforce-headcount denominator | High |
| People — Leadership adoption | 16 sessions / 693 | COE `cr978_coe_targetedaudience` | Medium* |
| People — AI literacy maturity (x/5) | NA | no maturity-level field | High |
| People — People trained | 9,150 | COE `nofattendees` sum | Medium* |
| People — Training hours delivered | 16,005 | Σ `eventduration × nofattendees` | Medium* |
| People — Workshops / Trainings | 295 | COUNT `cr978_coe_eventcode` | Medium* |
| People — Certifications earned | NA | no certification field | High |
| People — User satisfaction (x/5) | NA | only 2 records | High |
| Overall Readiness % | 33% | KPI Register / HTML dashboard | High |
| Overall Readiness / Total Agents MoM delta | NA | no month-over-month history | High |
| Total Agents (ref 740) | 75 | agent file = 75 rows; Master `sourcemaster`=Agents 75 | High |
| Agentic Services % of eligible | 30% (35 of 117) | KPI Register | High |
| Agentic Processes % of eligible | 26% (30 of 117) | KPI Register | High |
| AI Portfolio Growth (quarterly by pillar) | NA | no time-series; only current snapshot 35/30/52 | High |

\* Medium: these four People numbers appear only as derived figures in the KPI
Register/HTML, cited to COE event columns whose raw rows are NOT in the consolidation
files (they live in Dataverse). Treat as "reported by the register", not independently
re-derivable from these files.

## Must render as NA (no backing anywhere)

Transformation-progress target; all per-pillar targets (22/110/8000); AI Maturity by
Segment (all four); Progress Trend as transformation %; Agents-by-Pillar ref numbers
22/110/378; Agent Inventory internal/external split (310/248/62); Customer resolution
rate, avg response time, CSAT; Process "284 active agents" and any standalone
transformation % distinct from the 26% proxy; People AI-adoption rate, AI-literacy
maturity, certifications, user satisfaction; Overall-Readiness & Total-Agents MoM
deltas; Total Agents = 740; quarterly Portfolio Growth time-series.

## Corpus

- 541 records. `Master.aum_sourcemaster`: AI Retreat 186 · Al Hasbah use-cases 117 ·
  AI Deployment projects 86 · Agents 75 · State-of-AI apps 33 · D2D demands 44.
- Raw `import_*`: agents 75, deployment 88 rows (86 net), usecase 117, ai_retreat 163
  rows, D2D 44, `ai-state-of-report.csv` 33. The `.sql` is schema-only (no data).
- Use-case status: live 19 · pipeline 35 · planned 63. Agent status: live 12 ·
  pipeline 18 · planned 45.
- Division labels in `Master.aum_division` are messy/duplicated; the register
  canonicalizes to 13 divisions, agents+deployment grouped as
  I&TF 56 / HR 28 / Finance 27 / Billing 23 / BS&HR 12.
