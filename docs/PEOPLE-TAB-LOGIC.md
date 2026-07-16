# People Tab — KPI & Chart Logic

> Reference for every section rendered on the **People** view of the MD Dashboard.
> Source files:
> - `src/pages/md/PeopleView.tsx` — layout & which value feeds each card/chart
> - `src/pages/md/peopleAnalytics.ts` — the `peopleView()` aggregation engine
> - `src/pages/md/mdCompute.ts` — `d.people.*` fields (certs, etc.)
>
> **Data source:** all *live* figures come from the Dataverse table `cr978_coe_events` (one row per training event). Outside the deployed Power Apps runtime Dataverse returns `[]`, so live values render as **NA** locally — only the fixed constants show.

---

## Key building blocks

| Helper | What it does |
|---|---|
| `att(e)` | Attendees on an event = `cr978_coe_nofattendees` (coerced to a number, blank → 0). |
| `durationHours(raw)` | Parses `cr978_coe_eventduration` → **hours**. Accepts `"HH:MM"` (`"18:00"` = 18h, `"1:30"` = 1.5h) **or** a plain number (`"18"` = 18h). Blank/unparseable → 0. |
| **"reach"** | Everywhere "reach" appears it means **Σ attendees** (participant headcount), *not* a count of events. |
| Year guard | Month-bucketing ignores dates before 2020 or after 2035 (drops placeholder rows that parse to stray years like "Nov 99"). |

---

## ROW P1 — The four KPI cards

| # | Card | Value | Source | Type |
|---|---|---|---|---|
| 1 | **Employees with AI Tool Access** | `7,886` | Hardcoded in `PeopleView.tsx` | **Fixed** |
| 2 | **Employees Trained on Agentic AI** | `6,041` | `v.uniqueTrained` = `UNIQUE_TRAINED` constant | **Fixed** |
| 3 | **Agentic AI Trainings Conducted** | `events.length` | `v.trainings` — COUNT of all event rows | **Live** |
| 4 | **Employees Certified in AI** | `730` | `d.people.certs` (from `mdCompute.ts`) | **Fixed** |

**Card 1 — Employees with AI Tool Access (`7,886`)**
Active tool licenses provisioned. No event column backs this, so it is a fixed figure.

**Card 2 — Employees Trained on Agentic AI (`6,041`)**
*Unique* employees trained. The events table stores per-event **attendee counts**, not a per-employee roster, so uniqueness cannot be derived from it — it is set as the fixed constant `UNIQUE_TRAINED = 6041` in `peopleAnalytics.ts`. This same 6,041 is the numerator of the Executive-view adoption figure (`6041/4000`).

**Card 3 — Agentic AI Trainings Conducted (live)**
`v.trainings = events.length || null` — a straight COUNT of rows in `cr978_coe_events`.

**Card 4 — Employees Certified in AI (`730`)**
Formal certifications earned. Fixed value carried on `d.people.certs`.

---

## ROW P2 — Learning hours & program reach

### Total Learning Hours (big dark card) — **Live**
```
hoursTotal = Σ over all events of ( durationHours(cr978_coe_eventduration) × attendees )
```
It is **person-hours**: each event contributes `its duration in hours × how many people attended`.
Example: an event of `"18:00"` (18h) with 377 attendees contributes `18 × 377 = 6,786` person-hours.

### Reach by Learning Program (donut) — **Live**
```
reachByProgram = Σ attendees grouped by cr978_coe_eventcategory (free-text)
```
- Blank categories are skipped.
- Sorted descending by reach; the donut also shows `reachTotal` (sum of all slices) in the centre.

---

## ROW P3 — Maturity & monthly momentum

### Agentic AI Maturity by Segment — **Fixed**
Hardcoded `MATURITY` array in `PeopleView.tsx` (headcount engaged per tier):

| Segment | Value |
|---|---|
| EVPs | 9 |
| VPs | 48 |
| Senior Managers | 290 |
| Employees | 7,397 |

### Agentic AI Training Delivery by Month (area chart) — **Live**
```
deliveryByMonth = COUNT of events per calendar month
```
- Month key derived from `cr978_coe_eventdate` (label `"Mon YY"`, e.g. `"Jul 26"`).
- Each event adds **1** to its month's bucket (this is an event count, **not** attendees).
- Sorted chronologically; the year-guard (2020–2035) drops placeholder dates.

---

## ROW P4 — Technology & division reach

### Technology Distribution (horizontal bars) — **Live**
```
techDistribution = COUNT of events per AI technology, top 6
```
- Technology resolved per event by `techStackLabels(e)`, which reads, in priority order:
  1. `cr978_coe_eventtechstackname` (the tech-stack **lookup** name),
  2. the `cr978_coe_techstack` multi-select option-set,
  3. the `cr978_coe_event_technology` / `cr978_coe_techstackname` free-text field.
- Multi-value cells are split on `;`, `,`, `/`; each technology on an event adds **1**.
- Option-set codes are normalised so a tool never appears twice (e.g. `"893470000"` and `"Copilot Studio"` collapse to `Copilot Studio`).
- Sorted descending, capped at the **top 6**.

### Reach by Learning Program by Division (mirror / diverging bar chart) — **Fixed**
Hardcoded `REACH_BY_DIVISION` array in `PeopleView.tsx` — *unique* participants reached per division (uniqueness can't come from the attendee-count table, so it is fixed):

| Division | Reach |
|---|---|
| I&TF | 65 |
| DP | 55 |
| All Divisions | 48 |
| TP | 42 |
| BD&E | 35 |
| W&C | 25 |
| Generation | 24 |
| LA | 10 |

The chart deals divisions alternately into two colour-coded columns (left/right of a centre divider) with a legend at the bottom.

> **Note:** `peopleAnalytics.ts` *does* compute a live `reachByDivision` (Σ attendees per division, resolving the division GUID via the divisions map → formatted name → free-text), but the view intentionally renders the fixed `REACH_BY_DIVISION` array instead.

---

## Live vs. Fixed — at a glance

| Section | Status |
|---|---|
| Employees with AI Tool Access | 🔒 Fixed (`7,886`) |
| Employees Trained on Agentic AI | 🔒 Fixed (`6,041`, unique) |
| Agentic AI Trainings Conducted | 🟢 Live (event count) |
| Employees Certified in AI | 🔒 Fixed (`730`) |
| Total Learning Hours | 🟢 Live (Σ duration × attendees) |
| Reach by Learning Program (donut) | 🟢 Live (Σ attendees by category) |
| Agentic AI Maturity by Segment | 🔒 Fixed |
| Training Delivery by Month | 🟢 Live (event count / month) |
| Technology Distribution | 🟢 Live (event count by tech, top 6) |
| Reach by Program by Division (mirror) | 🔒 Fixed |

All live figures are sourced exclusively from `cr978_coe_events`; anything without a backing column is a fixed constant and rendered as NA if the underlying computation returns empty.
