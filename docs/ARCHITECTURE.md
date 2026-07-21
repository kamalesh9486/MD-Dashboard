# Agentic AI – MD Dashboard — Functional & Calculation Documentation

_Last updated: 2026-07-11_

This document describes what the **MD Dashboard** currently does: every section, the exact
calculation behind each KPI, which Dataverse tables feed it, and the fixed/business‑logic
values applied at specific places.

> Single source of truth for all numbers: **`src/dashboard/lib/compute.ts`** (`computeMetrics()` +
> `peopleFromEvents()`). UI/layout: **`src/dashboard/Board.tsx`** (`BoardViewV2`). Data fetch:
> **`src/dashboard/MdDashboard.tsx`**. Shared type: **`src/dashboard/lib/boardTypes.ts`** (`BoardData`).

---

## 1. What the app is

A single‑page dashboard (React 19 + TypeScript + Vite, Microsoft Power Apps code‑app) that tracks
DEWA’s agentic‑AI transformation against a **50% mandate**. It is the only screen in the app:
a launch is not required — it opens straight into the dashboard shell (sidebar + topbar + board).

The board has a **mandate banner**, a **board header**, a **tab bar** (also mirrored in the
sidebar), and five content areas under the **Executive Overview** tab, plus three domain sub‑tabs.

---

## 2. Data sources (Dataverse tables)

| # | Table (logical name) | Entity set | Role | Where used |
|---|----------------------|-----------|------|-----------|
| 1 | **`mdview_mdservices`** (Master / Services) | `mdview_mdserviceses` | 1 row = 1 **service** | Almost every KPI: services/processes counts, pillars, Overall Metrics, Top‑Line Impact, domain cards, month charts, eligibility |
| 2 | **`mdview_mdagents`** (AI_MD_Agents) | `mdview_mdagentses` | 1 row = 1 **agent** (linked to a service by Initiative Title) | Agent counts, Agents by Pillar, Agent Inventory, Active Agents by Division |
| 3 | **`cr978_coe_events`** | `cr978_coe_eventses` | Training events | **People** tab + People domain‑card rows (trained / hours / workshops / leadership) |
| 4 | **`cr978_coe_persons`** | `cr978_coe_persons` | People directory | `useCurrentUser()` — the signed‑in user’s name/role in the sidebar (not a dashboard KPI) |

Fetching: `MdDashboard` calls `getAll()` on tables 1–3 on mount (8s timeout; returns `[]` outside a
deployed Power Apps runtime → everything renders **NA**). `computeMetrics(services, agents)` builds
the board; `peopleFromEvents(events)` fills the People rows.

### Key columns used from `mdview_mdservices`
`mdview_initiativetitle` (join key to agents), `mdview_initiativereferencenumber` (dedupe key),
`mdview_relatedprocess` (distinct → process count), `mdview_division`, `mdview_servicestate`
(Active/Inactive filter), `mdview_eligibility` (Full / Partially Agentic / Not Applicable),
`mdview_productivitygainpercentage`, `mdview_annualvolume`, `mdview_targetcostsaving`,
`mdview_targetftesaving`, `mdview_sapmodule`, `mdview_status`, `mdview_actualgolivedate`,
`mdview_plannedcompletiondate`, `mdview_submissiondate`, `statecode`.

### Key columns from `mdview_mdagents`
`mdview_agentname` + `mdview_initiativetitle` (dedupe key + service join), `statecode`.

---

## 3. Data hygiene (applied before any calculation)

1. **Record‑active only** — rows with `statecode = 1` (Inactive record state) are dropped (services & agents).
2. **De‑duplication** — duplicate import rows collapsed:
   - services by `mdview_initiativereferencenumber` (fallback `mdview_initiativetitle`)
   - agents by `mdview_agentname | mdview_initiativetitle`
3. **Business Service State** — only services where `mdview_servicestate = "Active"` count toward the
   numerators (`S`, processes, pillars, eligibility, Top‑Line, domain cards).

### Derived counts
| Symbol | Meaning | Definition |
|---|---|---|
| `TOT` | total services | count of all record‑active, deduped `mdview_mdservices` rows (live; e.g. **22**) |
| `S` | active services | `TOT` rows filtered to `servicestate = Active` (e.g. **3**) |
| `P` | processes | distinct `mdview_relatedprocess` across the active services (e.g. **3**) |
| `A` | agents | count of record‑active, deduped `mdview_mdagents` rows (e.g. **7**) |
| `TOT_P` | total processes | **fixed 650** (business constant) |

---

## 4. Fixed / business‑logic values (the “specific logic” — count = 12)

These are **hardcoded** in `mdCompute.ts` because there is no data source for them, or because a
business rule overrides the raw data:

| # | Value | Where |
|---|-------|-------|
| 1 | `TOT_P = 650` (processes total; half = 325) | Processes pillar, Overall Metrics “Processes”, process ratios |
| 2 | `PEOPLE_PILLAR = 100` (People pillar %) | Progress by Pillars, Transformation Progress gauge |
| 3 | `PEOPLE_MAX = 4000` (People bar scale max) | Progress by Pillars end‑of‑bar label |
| 4 | `PEOPLE_METRIC = 59.9%` | Overall Metrics “People”, Overall Readiness average |
| 5 | People **AI Adoption Rate = 98%** | People domain card |
| 6 | People **Certifications Earned = 730** | People domain card |
| 7 | Agents by Pillar **People = 3714** | Agents by Pillar tile |
| 8 | AI Maturity **EVPs = 9** | AI Maturity by Segment |
| 9 | AI Maturity **VPs = 48** | AI Maturity by Segment |
| 10 | AI Maturity **Senior Managers = 290** | AI Maturity by Segment |
| 11 | AI Maturity **Employees = 7,397** | AI Maturity by Segment |
| 12 | Cost‑saving unit threshold (`≥ 1000` = AED) & productivity scale (`≤ 1.5` = ratio ×100) & charts start in **April** | Top‑Line Impact / month charts (rounding & normalisation rules) |

---

## 5. Two different “totals” — important

The dashboard measures percentages against **two bases**, on purpose:

- **Progress by Pillars** uses the **half‑total** (the 50%‑mandate scale): Services ÷ `TOT/2` (= 11),
  Processes ÷ `TOT_P/2` (= 325). This is why Services shows **27%** there.
- **Overall Metrics** uses the **full actual total**: Services ÷ `TOT` (= 22), Processes ÷ `TOT_P` (= 650).
  This is why Services shows **14%** there.

Both are correct; they answer different questions (progress‑toward‑50%‑mandate vs share‑of‑total).

---

## 6. Sections & KPI calculations

### 6.0 Board shell
- **Mandate banner** (below tabs): text `AI Transformation - 50% Mandate` (“50% Mandate” is a green→gold gradient). Static.
- **Board header**: title `DEWA AGENTIC AI TRANSFORMATION`; right side `As of <Month Year>` (dynamic, `new Date()`), and the mandate target line.
- **Tabs / sidebar sections** (same order): **Executive Overview · People · Services · Processes**.

### 6.1 Row A

| Panel | KPI | Calculation |
|-------|-----|-------------|
| **Transformation Progress** (gauge) | gauge % | `average( Services‑pillar, Processes‑pillar, People‑pillar )` = `avg(27, 1, 100)` ≈ **43%**. (Pillars use the half‑total; People is fixed 100%.) |
| **Progress by Pillars** | Services | `round( S ÷ (TOT÷2) × 100 )` = 3÷11 = **27%**; end‑of‑bar max = `TOT÷2` (**11**) |
| | Processes | `round( P ÷ (TOT_P÷2) × 100 )` = 3÷325 = **1%**; end‑of‑bar max = `TOT_P÷2` (**325**) |
| | People | **100%** (fixed); end‑of‑bar max = **4000** (fixed) |
| **AI Maturity by Segment** | EVPs / VPs / Senior Managers / Employees | Fixed **9 / 48 / 290 / 7,397** (no data source) |
| **Top‑Line Impact** | Target Cost Saving | `Σ mdview_targetcostsaving` for rows **≥ 1000** (smaller values are time‑reduction ratios, excluded), formatted AED (K/M/B) |
| | Target FTE Saving | `round( Σ mdview_targetftesaving )` |
| | Avg Productivity Gain | `average( mdview_productivitygainpercentage )`; each value ≤ 1.5 treated as a 0–1 ratio (×100) |

### 6.2 Trend + agent row

| Panel | KPI | Calculation |
|-------|-----|-------------|
| **Progress Trend by Month** | line | Per month = `round( avg( cumulativeServices÷TOT×100 , cumulativeProcesses÷TOT×100 ) )`, bucketed by service go‑live (→ planned → submission) date; axis starts in **April** (real months only, cumulative carried forward) |
| **Agents by Pillar** (overlap, Option B) | Services / Processes / People | `A / A / 3714` — every agent serves a service **and** a process (counted under both, not additive); People fixed **3714** |
| **Agent Inventory & Coverage** | Total | `A` |
| | In Build | agents whose service has **no** actual go‑live date = `A − inUse` |
| | In Use | agents whose service **has** an actual go‑live date |

### 6.3 Domain summary cards

Counts render as **`count / (total ÷ 2)`** — Services use `TOT÷2` (11); Processes use `TOT_P÷2` (325).

**Services card** (header = Services pillar % = 27%)
| Row | Calculation |
|-----|-------------|
| Total Services | `S / (TOT÷2)` → `3/11` |
| Fully Agentic | services with `mdview_eligibility = Full` → `count/11` |
| Partially Agentic | services with `mdview_eligibility = Partially Agentic` → `count/11` |
| Agent | `A` |
| Avg Productivity Gain | `average( productivitygainpercentage )` |
| Annual Transaction | `Σ mdview_annualvolume` |

**Processes card** (header = Processes pillar % = 1%)
| Row | Calculation |
|-----|-------------|
| Total Processes | `P / (TOT_P÷2)` → `3/325` |
| Fully Agentic | distinct related‑processes among **Full** services → `count/325` |
| Partially Agentic | distinct related‑processes among **Partially Agentic** services → `count/325` |
| Agent | `A` |
| Avg Productivity Gain | `average( productivitygainpercentage )` |
| Annual Transaction | `Σ mdview_annualvolume` |

**People card** (header = 100% — from the People pillar)
| Row | Source |
|-----|--------|
| AI Adoption Rate | **98%** (fixed) |
| Leadership Adoption | Σ attendees of events whose audience ~ champion/ambassador/EVP/leader (`cr978_coe_events`) |
| AI Literacy Maturity | NA (no column) |
| People Trained | `Σ cr978_coe_nofattendees` |
| Training Hours Delivered | `Σ (eventduration × attendees)` |
| Workshop / Trainings | count of events |
| Certifications Earned | **730** (fixed) |
| User Satisfaction | NA (no column) |

### 6.4 Overall Metrics + Active Agents

**Overall Metrics** (uses **full** totals)
| Row | Calculation | Example |
|-----|-------------|---------|
| Overall Readiness | `average( Services, Processes, People )` | avg(14, 0.5, 59.9) ≈ **25%** |
| Services | `round( S ÷ TOT × 100 )` = 3÷22 | **14%** |
| Processes | `(P ÷ TOT_P × 100)` to **1 decimal** = 3÷650 | **0.5%** |
| People | fixed | **59.9%** |
| Total Agents | `A` | **7** |

**Active Agents by Division** — agents joined to their service via `mdview_initiativetitle` →
`mdview_division`, counted per division, sorted desc.

### 6.5 DEWA Agentic AI Portfolio Growth
Clustered bar chart, month on X, cumulative counts on Y. Series order (bars + custom legend):
**Services (`A` cumulative services) · Processes (cumulative distinct processes) · People (0)**.
Axis starts in **April**; cumulative carried forward; real go‑live months only (no future mock).

### 6.6 Domain sub‑tabs (Services / Processes / People)
Deeper views of the same domains. **People** tab is 100% live from `cr978_coe_events`
(equipped, training events, hackathons, webinars/ILT, hours, attendance rate, leadership sessions +
distribution charts). Services/Processes tabs reuse the domain figures + division charts.

---

## 7. Month / date logic
- A service’s month = first available of `actualgolivedate` → `plannedcompletiondate` → `submissiondate`.
- Charts accumulate services/processes **cumulatively** by month.
- The window starts at **April of the latest data year** (fiscal‑year start), or the earliest real month if that is before April; it never mocks **future** months.

---

## 8. NA / rounding rules
- Any metric without a backing column/value renders **NA** (never fabricated) — except the 12 fixed values in §4.
- All percentages/counts are rounded to the nearest whole number, **except** Overall‑Metrics “Processes”, which keeps **1 decimal** so a tiny `0.46%` shows as `0.5%` instead of `0%`.
- Currency formatted K/M/B (`aed()`).

---

## 9. Build & files
```
npm run build     # tsc -b && vite build → ./dist
```
- `src/dashboard/lib/compute.ts` — all calculations + fixed values.
- `src/dashboard/Board.tsx` — `BoardViewV2` UI (all panels, tabs, i‑icons).
- `src/dashboard/lib/boardTypes.ts` — `BoardData` type + colour tokens.
- `src/dashboard/MdDashboard.tsx` — fetches the 3 tables, calls `computeMetrics` + `peopleFromEvents`.
- `src/dashboard/lib/peopleAnalytics.ts` — People‑tab analytics from `cr978_coe_events`.
- Data source registration: `.power/schemas/appschemas/dataSourcesInfo.ts`, `power.config.json`, `src/generated/` (models + services).
