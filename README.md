# DEWA Agentic AI — MD Dashboard

A single-page dashboard tracking DEWA's agentic-AI transformation against a **50% mandate**.
Built as a Microsoft Power Apps code app (React 19 + TypeScript + Vite 7), reading live data from
Microsoft Dataverse and rendering executive KPIs, portfolio growth, and people/training analytics.

The app opens straight into the dashboard shell — a sidebar rail, a mandate banner, and a tab bar
with four views: **Executive Overview · People · Services · Processes**.

## Tech stack

- **React 19 + TypeScript** (strict) on **Vite 7**
- **Microsoft Power Apps SDK** (`@microsoft/power-apps`) → Dataverse
- **Recharts 3** for all charts
- **Bootstrap Icons** via an embedded `<Icon>` component (no font load)

## Getting started

```bash
npm install
npm run dev      # pac code run + Vite on http://localhost:3000
```

Outside a deployed Power Apps runtime the Dataverse SDK returns no data, so KPIs render as **NA**
(by design — the dashboard never fabricates numbers). Layout and charts still render.

```bash
npm run build    # tsc -b && vite build → ./dist
npm run lint     # ESLint
npm run preview  # preview ./dist locally
```

## Project layout

```
src/
  components/   shared UI (Layout, Icon, ErrorBoundary)
  hooks/        useCurrentUser
  generated/    Dataverse models + services (auto-generated — do not hand-edit)
  dashboard/    the MD Dashboard feature (MdDashboard + views + lib/ calculations)
  styles/       global + dashboard CSS
docs/           ARCHITECTURE.md, design.md, and reference docs
```

## Documentation

- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — every section, exact KPI calculation, data sources, and fixed business values. Start here.
- **[docs/design.md](docs/design.md)** — design system (colours, fonts, components).
- **[CLAUDE.md](CLAUDE.md)** — coding directives for this repo.
- `docs/legacy/` — docs for the earlier 13-page "COE Platform"; **not** current.

## Contributing

Don't push directly to `main` — branch, push, and open a PR. Don't publish to Power Apps without approval.
