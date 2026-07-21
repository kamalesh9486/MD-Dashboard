# DEWA Agentic AI — MD Dashboard — Claude Code Directives

> Coding rules for this project. Always follow these.
> Full functional/calculation reference: `docs/ARCHITECTURE.md`. Design rules: `docs/design.md`.

---

## Session Start — Mandatory First Action

**At the beginning of every new session, before doing anything else, read `docs/ARCHITECTURE.md`.**

It is the single source of truth for what the dashboard shows, every KPI's exact calculation,
which Dataverse tables feed it, and the fixed business-logic values. Do not guess at existing
behaviour — read it first. If the numbers or KPI logic are involved, also invoke the
`md-dashboard-kpis` skill.

---

## What This App Is

A **single-page dashboard** (React 19 + TypeScript strict + Vite 7, Microsoft Power Apps code app)
tracking DEWA's agentic-AI transformation against a **50% mandate**. It opens straight into the
dashboard shell — there is no launch screen and no multi-page router. `src/dashboard/Board.tsx`
holds four internal views selected by local state: **Executive Overview · People · Services · Processes**.

> This app was slimmed down from an earlier 13-page "COE Platform." Docs describing that old app
> live in `docs/legacy/` and **do not** reflect the current code — ignore them for current work.

**Stack:** React 19 + TypeScript (strict) + Vite 7
**Data:** Microsoft Dataverse via Power Apps SDK (`@microsoft/power-apps`)
**Charts:** Recharts 3 — no other chart library
**Icons:** Bootstrap Icons via `<Icon name="bi-*" />` — no other icon system
**Styling:** Plain CSS (`src/styles/md-dashboard.css`) + inline design tokens (`src/dashboard/lib/tokens.ts`) — no Tailwind, no CSS-in-JS
**Environment ID:** `07da6342-8cc4-e81c-95fa-9ce24e7c2f46`

---

## Project Structure

```
src/
  main.tsx                  entry — mounts <App>, imports styles/index.css
  App.tsx                   renders <Layout>
  components/               shared, app-wide
    Layout.tsx              thin mount → <ErrorBoundary><MdDashboard/></ErrorBoundary>
    Icon.tsx                Bootstrap Icons as embedded SVG paths (no font load)
    ErrorBoundary.tsx
  hooks/
    useCurrentUser.ts       { name, role, email, loading } — 6s local-dev fallback
  generated/                Dataverse models + services (AUTO-GENERATED — never hand-edit)
  dashboard/                the MD Dashboard feature
    MdDashboard.tsx         fetches Dataverse tables, computes BoardData/PeopleData
    Board.tsx               shell: banner + tab bar, routes the 4 views
    ExecOverview.tsx        Executive Overview view
    PeopleView.tsx          People view
    DesignSidebar.tsx       icon rail (nav mirrors the board tabs)
    CountUp.tsx             animated count-up number
    Charts.tsx              all Recharts renderers
    Primitives.tsx          NA tag, info chip, card head, progress bar
    lib/                    pure logic + data (no JSX)
      compute.ts            computeMetrics() + peopleFromEvents() — SINGLE SOURCE of every number
      peopleAnalytics.ts    People-tab analytics from cr978_coe_events
      boardTypes.ts         BoardData type + colour tokens
      tokens.ts             design tokens (T, PILLAR, fonts)
  styles/
    index.css               global
    md-dashboard.css        dashboard styles
```

**Where things live:** numbers/calculations → `src/dashboard/lib/compute.ts`. Layout/panels →
`src/dashboard/Board.tsx` + the view files. Chart rendering → `src/dashboard/Charts.tsx`.
Never put calculation logic in a JSX component — it belongs in `lib/`.

---

## Dataverse Services

Auto-generated services live in `src/generated/`. **Never hand-write model or service code** — to
add a table, re-run the Power Apps code generation tool. Tables the dashboard uses:

| Table (logical) | Role |
|---|---|
| `mdview_mdservices` | 1 row = 1 service — feeds most KPIs |
| `mdview_mdagents` | 1 row = 1 agent (joined to a service by Initiative Title) |
| `mdview_mdl3processes` | L3 processes |
| `cr978_coe_events` | training events → People tab |
| `cr978_coe_divisions` | division-name lookup |
| `cr978_coe_persons` | signed-in user (via `useCurrentUser`) |

Fetch pattern — call `getAll()` in `useEffect` on mount, store in local `useState`. No global store.
Outside a deployed Power Apps runtime, calls return `[]` and every KPI renders **NA** — never fabricate.

```ts
useEffect(() => {
  Mdview_mdservicesesService.getAll().then(res => setServices(res.data ?? []))
}, [])
```

FK columns are GUIDs — resolve to names with a `Map` (see `docs/ARCHITECTURE.md`).

---

## Icons — Bootstrap Icons Only

**Never use emoji** anywhere. Use the `<Icon>` component exclusively.

```tsx
<Icon name="bi-robot" />          // CORRECT
<span>🤖</span>                    // WRONG
```

**Currency/finance contexts:** always `bi-currency-dirham`. Never `bi-currency-dollar`.

---

## Typography — Dubai Font

Always use the full stack. Never monospace, Roboto, or Arial.

```css
font-family: 'Dubai', 'Segoe UI', system-ui, sans-serif;
```

Font tokens live in `src/dashboard/lib/tokens.ts` (`HEAD_FONT`, `BODY_FONT`).

---

## Styling & Colours

- Primary green `#007560`, gold `#ca8a04`, teal `#004937`.
- Page background is a cool neutral — never pure white (`#fff`). Primary text `#1c1c1e` — never pure black (`#000`).
- Design tokens object `T` in `src/dashboard/lib/tokens.ts`; dashboard CSS in `src/styles/md-dashboard.css`.
- No dark mode (not implemented).
- See `docs/design.md` for the full palette, spacing, and component patterns.

---

## Charts (Recharts)

- Always wrap in `<ResponsiveContainer width="100%">`.
- Bar green `#007560`, gold `#ca8a04`, teal `#004937`. Rounded bar tops `radius={[8,8,0,0]}`.
- Do not introduce Recharts alternatives (Chart.js, D3, Victory, etc.).

### Tooltip text visibility — mandatory

Tooltips use a near-black background — Recharts does **not** inherit text colour from `contentStyle`.
Every `<Tooltip>` must explicitly set white text via `contentStyle` + `labelStyle` + `itemStyle`
(or set colours inline when using a custom `content={}` component). See `src/dashboard/Charts.tsx`.

---

## TypeScript

`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Fix all type errors — never use
`any` as a shortcut. Path alias `@` → `./src` (imports are currently relative).

---

## Build Commands

```bash
npm run dev      # pac code run + vite on http://localhost:3000
npm run build    # tsc -b && vite build → ./dist
npm run lint     # ESLint
npm run preview  # preview ./dist
```

Don't push directly to `main` — create a feature branch, push, and open a PR for review.
Don't push the application to Power Apps without user approval.

---

## What NOT To Do

- No emoji anywhere
- No React Router / multi-page routing (the app is one page; views switch via `Board.tsx` state)
- No global state manager (Redux, Zustand, etc.) — each area owns its data via local `useState`
- No Tailwind or CSS-in-JS
- No chart libraries other than Recharts
- No icon libraries other than Bootstrap Icons via `<Icon>`
- No `bi-currency-dollar` — use `bi-currency-dirham`
- No pure white (`#fff`) page background; no pure black (`#000`) text
- No hand-written Dataverse model/service code — use `src/generated/`
- Don't fabricate KPI values — missing data renders **NA** (except the fixed business constants documented in `docs/ARCHITECTURE.md §4`)
- Don't treat `docs/legacy/` as current — it describes the old 13-page COE app
