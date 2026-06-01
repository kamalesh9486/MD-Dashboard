# DEWA COE AI Intelligence Platform — Claude Code Directives

> Coding rules for this project. Always follow these. Full architecture: `coearchitecture.md`. Design rules: `design.md`.

---

## Session Start — Mandatory First Action

**At the beginning of every new session, before doing anything else, read `coearchitecture.md`.**

This file is the single source of truth for what the platform does, which pages exist, what data each page uses, and what components are available. Do not guess at existing architecture — read it first. If a user asks about a page, component, or feature and you have not yet read the file this session, read it before answering.

---

## Auto-Dispatch Rule — Check Before Every Response

Before responding to any prompt, silently evaluate every entry in both tables below. If a match is found, invoke it **in the same turn** — never defer to a follow-up.

### Subagents

| Subagent | When to spawn |
|---|---|
| **Explore** | Open-ended codebase searches, unknown file locations, cross-file pattern analysis, "where is X defined" — spawn instead of manual grep across 3+ locations |
| **Plan** | Any task touching ≥ 3 files, architectural decisions, new features, significant refactors — enter plan mode before writing a single line of code |
| **frontend-engineer** | Complex UI implementation requiring responsive design, accessibility, component libraries, or performance optimisation |
| **general-purpose** | Multi-step research tasks, anything requiring web search + code search combined, or tasks too broad for a single focused agent |
| **claude-code-guide** | Questions about Claude Code CLI features, hooks, MCP servers, slash commands, settings, IDE integrations, or the Anthropic API/SDK |
| **prompt-enhancer** | User's request is vague, ambiguous, or poorly structured — enhance before acting on it |

### Skills (slash commands)

| Skill | When to invoke |
|---|---|
| **`/dewa-coe-platform`** | Any UI work, new page/tab, KPI card, chart, filter, Dataverse fetch, or design-system question in this project |
| **`/owasp-security`** | Any auth, input handling, API endpoint, token storage, or permission logic |
| **`/simplify`** | After completing any implementation task — review and clean up the diff |
| **`/review`** | User asks for a code or PR review |
| **`/security-review`** | User asks to audit the current branch for vulnerabilities |
| **`/claude-api`** | Code imports `anthropic` / `@anthropic-ai/sdk`, or task involves the Claude API, prompt caching, tool use, or model configuration |
| **`/update-config`** | User wants to change Claude Code settings, add permissions, configure hooks, or set env vars |
| **`/keybindings-help`** | User wants to customise keyboard shortcuts or rebind keys |
| **`/fewer-permission-prompts`** | User is seeing too many permission prompts during a session |
| **`/schedule`** | User wants to schedule a recurring or one-time automated task |

**Hard rule:** If anything in either table matches the request, invoke it immediately — do not silently skip it. Multiple matches → invoke all that apply, in parallel where possible.

---

## Project Snapshot

**Stack:** React 19 + TypeScript (strict) + Vite 7  
**Data:** Microsoft Dataverse via Power Apps SDK (`@microsoft/power-apps`)  
**Charts:** Recharts 3 — no other chart library  
**Icons:** Bootstrap Icons via `<Icon name="bi-*" />` — no other icon system  
**Styling:** Custom CSS in per-page `.css` files — no Tailwind, no CSS-in-JS  
**Active tabs:** `executive-summary` · `division-analytics` · `programs` · `events` · `people-skills` · `technology-stack` · `discovery-catalog` · `ai-incident` · `ai-command-center` · `al-hasbah` (sub-tabs: `ah-leadership` · `ah-kpi-performance` · `ah-kpi-repository` · `ah-agent-repository` · `ah-use-case-repository` · `ah-health`)

---

## Navigation

**There is no React Router.** Do not add it. Navigation is tab state in `Layout.tsx`:

```tsx
const [activeTab, setActiveTab] = useState<TabId>('executive-summary')
```

To add a new page: add a `TabId`, add a nav item in `Sidebar.tsx`, add a `case` in `Layout.tsx`'s `renderPage()`, create `src/pages/YourPage.tsx` + `src/your-page.css`.

---

## Dataverse Services

Auto-generated services live in `src/generated/`. Never hand-write model or service code. Pattern:

```ts
// Fetch on mount, store in local useState — no global store
useEffect(() => {
  Cr978_coe_programsService.getAll().then(res => setData(res.data ?? []))
}, [])
```

FK columns are GUIDs. Resolve to names with a Map:

```ts
const divisionMap = new Map(divisionsRes.data.map(d => [d.id, d.name]))
const name = divisionMap.get(record._cr978_coe_division_value) ?? 'Unknown'
```

Dataverse table prefix: `cr978_coe_*`. Environment ID: `07da6342-8cc4-e81c-95fa-9ce24e7c2f46`.

---

## Icons — Bootstrap Icons Only

**Never use emoji** anywhere in the codebase. Use the `<Icon>` component exclusively.

```tsx
// WRONG
<span>🤖</span>
{ icon: '📊' }

// CORRECT
<Icon name="bi-robot" />
{ icon: 'bi-bar-chart-line-fill' }
```

**Currency/finance contexts:** always use `bi-currency-dirham`. Never `bi-currency-dollar` or any other currency icon.

---

## Typography — Dubai Font

Always use the full font stack. Never use monospace, Roboto, Arial, or any other family.

```css
font-family: 'Dubai', 'Segoe UI', system-ui, sans-serif;
```

```tsx
fontFamily: "'Dubai', 'Segoe UI', system-ui, sans-serif"
```

CSS variables are already set in `src/index.css`: `--sans`, `--heading`, `--mono` all point to this stack.

---

## Styling Rules

- Each page has its own CSS file in `src/`. Import it at the top of the component: `import '../page-name.css'`
- All cards need the 3px `linear-gradient(90deg, #007560, #ca8a04)` top accent bar via `::before`
- Page `h1` headings use gradient text: `background: linear-gradient(90deg, #007560, #004937); -webkit-background-clip: text; -webkit-text-fill-color: transparent`
- Background: `#edf2f0` — never `#fff` on the page shell
- Primary text: `#1c1c1e` — never `#000`
- Sidebar accent/active colour: `#ca8a04` (DEWA gold) — not green
- See `design.md` for the full colour palette, spacing, animation keyframes, and component patterns

---

## Charts (Recharts)

- Always wrap in `<ResponsiveContainer width="100%">`
- Bar colour: `#007560` (green), secondary: `#ca8a04` (gold), tertiary: `#004937` (teal)
- Rounded bar tops: `radius={[8, 8, 0, 0]}`
- Custom tooltip: `background: rgba(28,28,30,0.93)`, white text
- Grid lines: `rgba(0,117,96,0.07)`
- Do not introduce Recharts alternatives (Chart.js, D3, Victory, etc.)

### Tooltip text visibility — mandatory rule

All tooltips use a near-black background (`rgba(28,28,30,0.93)`). Recharts does **not** inherit text colour from `contentStyle` — it renders label text in `#666` and item text in the series colour by default. On a dark background those colours are invisible. Every `<Tooltip>` must explicitly set:

```tsx
// Shared constants (define once per file)
const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none',
  borderRadius: 9, padding: '8px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
  fontSize: 12, color: '#fff',           // ← base colour safeguard
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 }

// Usage — always include all three props
<Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM} />
```

When using a fully custom `content={<MyTooltip />}` component, set explicit colours inline inside the component instead (the `labelStyle`/`itemStyle` props are ignored in that case). See `AICommandCenter.tsx`, `AIIncident.tsx`, and `Finance.tsx` for the custom-component pattern.

---

## Component Rules

- **No modals for new features** — use slide-in panels if a detail overlay is needed
- **No React Router** — tab state only
- **No global state manager** — each page owns its data via local `useState`
- **`<Icon>`** is the only way to render icons — 149 Bootstrap Icons are embedded as SVG paths, no external font load needed
- **`useCurrentUser()`** returns `{ name, role, email, loading }` — has 6s local-dev fallback to `{ name: "User", role: "Member" }`
- **`CopilotDataContext`** provides shared agent/copilot data fetched at app launch — consume with `useCopilotData()`

---

## Data: Live vs. Static

Pages that call Dataverse: People–Adoption, Programs, Events, Discovery Catalog, AI Incidents, AI Command Center.  
Pages with static/hardcoded data: Executive Summary, Division Analytics, People–Certifications/Skills/Performance, Technology Stack, Strategic Roadmap.  
Finance is hybrid (division names live, budget figures from `FINANCE_SEED` array — no Finance table in Dataverse yet).

When adding live data to a currently-static page, fetch in `useEffect` on mount and replace the hardcoded array.

---

## TypeScript

`strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`. Fix all type errors — do not use `any` as a shortcut.

Adding a new Dataverse table: re-run the Power Apps code generation tool. Do not hand-write types in `src/generated/`.

---

## Build Commands

```bash
npm run dev      # local dev on http://localhost:3000
npm run build    # tsc -b && vite build → ./dist
npm run lint     # ESLint check
npm run preview  # preview ./dist locally
```

Deploy via `pac code push` to Power Platform environment `07da6342-8cc4-e81c-95fa-9ce24e7c2f46`.

---

## What NOT To Do

- No emoji anywhere
- No React Router
- No global state manager (Redux, Zustand, etc.)
- No Tailwind or CSS-in-JS
- No chart libraries other than Recharts
- No icon libraries other than Bootstrap Icons via `<Icon>`
- No `bi-currency-dollar` — use `bi-currency-dirham`
- No pure white (`#fff`) page shell backgrounds — use `#edf2f0`
- No pure black (`#000`) text — use `#1c1c1e`
- No hand-written Dataverse model/service code — use `src/generated/`
- Do not add Finance or Strategic Roadmap back to the sidebar (hidden intentionally)
- Do not add dark mode (not implemented in this project)
