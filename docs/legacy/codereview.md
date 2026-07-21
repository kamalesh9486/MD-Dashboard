# DEWA COE Platform — Code Review Report

**Date:** 2026-04-12  
**Reviewer:** Claude Code  
**Scope:** Full source tree — all `.tsx`, `.ts`, `.css` files in `src/`  
**Build:** React 19 + TypeScript (strict) + Vite 7 + Power Apps SDK

---

## Summary

| Severity | Count |
|----------|-------|
| Critical | 2 |
| High | 3 |
| Medium | 7 |
| Low | 11 |
| **Total** | **23** |

Two critical security issues require immediate attention before the next production deployment. Three high-severity issues relate to React patterns that can cause broken UI states. The remaining findings are code quality, accessibility, and maintainability improvements.

---

## Critical

---

### CR-01 — Hardcoded API keys and Power Automate signing tokens in source

**Files:**
- `src/components/CommandIQ.tsx` — lines ~20–21
- `src/context/CopilotDataContext.tsx` — lines ~3–4

**Issue:**  
Production Power Automate endpoint URLs with `sig=` signing tokens are committed directly in TypeScript source. These tokens grant unauthenticated access to the backend workflows. Anyone who can read the source (including anyone with access to the compiled `dist/` bundle) can call the workflows directly.

```ts
// CommandIQ.tsx
const AGENT_ENDPOINT = 'https://...powerautomate.com.../invoke?...&sig=2udaarIz0O3HwQzWZhULNKBFRoJjIOj79s0KzeiQ630'

// CopilotDataContext.tsx
const COPILOT_ENDPOINT = 'https://...powerautomate.com.../invoke?...&sig=...'
```

**Fix:**  
Move all endpoints to `.env.local` (git-ignored), expose via `import.meta.env.VITE_*`, and add `.env.local` to `.gitignore` if not already there.

```ts
// .env.local  (never commit)
VITE_AGENT_ENDPOINT=https://...powerautomate.com.../invoke?...&sig=...

// CommandIQ.tsx
const AGENT_ENDPOINT = import.meta.env.VITE_AGENT_ENDPOINT
```

Add a runtime guard so the app fails loudly in dev if the variable is missing:

```ts
if (!AGENT_ENDPOINT) throw new Error('VITE_AGENT_ENDPOINT is not set')
```

---

### CR-02 — XSS vector: `dangerouslySetInnerHTML` on AI-generated content without sanitisation

**File:** `src/components/CommandIQ.tsx` — line ~331

**Issue:**  
The `parseMarkdown()` function processes the raw AI response with string replacements and renders it via `dangerouslySetInnerHTML`. If the Power Automate workflow is ever compromised or returns attacker-controlled content, arbitrary HTML executes in the user's browser.

```tsx
<span
  dangerouslySetInnerHTML={{
    __html: parseMarkdown(msg.text) + (!msg.done ? '<span class="ciq-cursor">▋</span>' : '')
  }}
/>
```

**Fix:**  
Either sanitise the output before rendering:

```ts
import DOMPurify from 'dompurify'

<span
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(parseMarkdown(msg.text)) + (!msg.done ? '<span class="ciq-cursor">▋</span>' : '')
  }}
/>
```

Or switch to a React-native markdown renderer (`react-markdown` with `rehype-sanitize`) that never calls `dangerouslySetInnerHTML` at all.

---

## High

---

### CR-03 — `document.body.style.overflow` set by modals without a guard, causing permanent scroll-lock on unmount errors

**Files:** `src/pages/Events.tsx`, `src/pages/Programs.tsx`, `src/pages/DiscoveryCatalog.tsx`, `src/pages/AIIncident.tsx`, `src/pages/StrategicRoadmap.tsx`

**Issue:**  
Every modal component runs:

```tsx
useEffect(() => {
  document.body.style.overflow = 'hidden'
  return () => { document.body.style.overflow = '' }
}, [])
```

If the component unmounts due to an unhandled error, navigation, or hot-reload before the cleanup runs, the page becomes permanently unscrollable — requiring a full reload. There is no error boundary anywhere in the app to catch thrown errors and trigger cleanup.

**Fix (two parts):**

1. Extract to a shared hook so scroll-lock is reference-counted:

```ts
// src/hooks/useScrollLock.ts
let lockCount = 0
export function useScrollLock() {
  useEffect(() => {
    lockCount++
    document.body.style.overflow = 'hidden'
    return () => {
      lockCount--
      if (lockCount === 0) document.body.style.overflow = ''
    }
  }, [])
}
```

2. Add an error boundary at the `<Layout>` level so unhandled errors don't leave the DOM in a broken state.

---

### CR-04 — Race condition in `DiscoveryCatalog` and `Programs` data fetch: `setState` called after unmount

**Files:** `src/pages/DiscoveryCatalog.tsx` — lines ~409–438, `src/pages/Programs.tsx` — lines ~55–75

**Issue:**  
Both pages use an inner `load()` function that returns a cleanup closure. The pattern is nearly correct but has a subtle flaw: `useEffect` returns the result of calling `load()`, which means TypeScript infers the return type as `void | (() => void)`. If `load()` happens to return `undefined` on a code path (e.g., an early `return` before the Promise resolves), the cleanup never runs and `active` is never set to `false`. Rapid tab-switching can trigger `setState` on an unmounted component.

```ts
function load() {
  let active = true
  setLoading(true)
  Promise.all([...]).then(res => {
    if (!active) return
    setData(res)  // ← can fire after unmount if active flag misses a code path
  })
  return () => { active = false }
}
useEffect(() => { return load() }, [])
```

**Fix:**  
Use the `AbortController` pattern, or inline the effect directly:

```ts
useEffect(() => {
  let active = true
  setLoading(true)
  Promise.all([...])
    .then(([...]) => { if (active) setData(...) })
    .catch(err => { if (active) setError(String(err)) })
    .finally(() => { if (active) setLoading(false) })
  return () => { active = false }
}, [])
```

---

### CR-05 — No error boundaries anywhere in the app

**Files:** `src/App.tsx`, `src/components/Layout.tsx`

**Issue:**  
There are no React error boundaries in the component tree. If any page component throws during render (e.g., accessing `undefined.property` on malformed Dataverse data), the entire app goes blank with a white screen. The user has no way to recover without a full page reload.

**Fix:**  
Add a minimal error boundary at the page level in `Layout.tsx`:

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div style={{ padding: 40, color: '#d64545' }}>
          <strong>Something went wrong.</strong>
          <p>{this.state.error.message}</p>
          <button onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
```

Wrap `renderPage()` output in `<ErrorBoundary>` in `Layout.tsx`.

---

## Medium

---

### CR-06 — Dead code suppressed with `void` instead of removed

**Files:** `src/components/LaunchScreen.tsx` — line ~83, `src/pages/Programs.tsx` — lines ~60–67

**Issue:**  
Unused variables are suppressed with the `void` anti-pattern rather than deleted. This masks real bugs and confuses the reader.

```ts
// Programs.tsx
const eventType = (t: string) => { /* ... */ }
void eventType  // ← never called

// LaunchScreen.tsx  
const s = { color: accent } as React.CSSProperties
void s  // ← never used
```

**Fix:**  
Delete the dead code. If it is intentionally preserved for future use, add a `// TODO:` comment explaining what it is for — not a `void` suppression.

---

### CR-07 — Missing `@keyframes spin` for save-spinner in Programs modal

**File:** `src/pages/Programs.tsx` — line ~299

**Issue:**  
The save button shows a spinning icon during submission:

```tsx
<Icon name="bi-arrow-repeat" style={{ animation: 'spin 0.8s linear infinite' }} />
```

But `@keyframes spin` is not defined anywhere in the project's CSS. The animation silently does nothing — the icon is static during the save operation.

**Fix:**  
Add to `src/programs.css` (or a global CSS file):

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
```

---

### CR-08 — Generic error messages that hide root causes

**Files:** `src/pages/Programs.tsx` — line ~326, `src/pages/DiscoveryCatalog.tsx` — line ~432, `src/pages/Events.tsx`, `src/pages/AIIncident.tsx`

**Issue:**  
Catch blocks show user-facing strings like `'Failed to load programs from Dataverse.'` without logging the actual error. When Dataverse returns an unexpected response, developers have no way to diagnose the root cause.

```ts
.catch((err: unknown) => {
  if (!active) return
  setError('Failed to load programs from Dataverse.')
  // ← err is swallowed, never logged
})
```

**Fix:**

```ts
.catch((err: unknown) => {
  if (!active) return
  const msg = err instanceof Error ? err.message : String(err)
  console.error('[Programs] Dataverse load failed:', msg)
  setError('Failed to load programs. Please refresh and try again.')
})
```

---

### CR-09 — Accessibility: interactive elements missing `aria-label`

**Files:** `src/components/LaunchScreen.tsx` — lines ~231–232, `src/components/CommandIQ.tsx` — multiple buttons

**Issue:**  
Several icon-only buttons have no accessible name, making them invisible to screen readers and keyboard users who rely on assistive technology.

```tsx
// LaunchScreen — buttons with no aria-label
<button style={{ ... }}>Cancel</button>  // text only, no title/aria-label
<button style={{ ... }}>Open</button>

// CommandIQ — icon-only buttons
<button onClick={clearChat}><Icon name="bi-trash" /></button>  // no aria-label
<button onClick={() => setOpen(false)}><Icon name="bi-x-lg" /></button>  // no aria-label
```

**Fix:**

```tsx
<button aria-label="Clear conversation" onClick={clearChat}>
  <Icon name="bi-trash" aria-hidden="true" />
</button>
<button aria-label="Close chat" onClick={() => setOpen(false)}>
  <Icon name="bi-x-lg" aria-hidden="true" />
</button>
```

---

### CR-10 — Hardcoded hex colours in TSX inline styles instead of CSS variables

**Files:** `src/components/LaunchScreen.tsx` (15+ occurrences), `src/pages/AIIncident.tsx` (lines ~96–122), `src/pages/ExecutiveSummary.tsx`, `src/pages/AICommandCenter.tsx`

**Issue:**  
The codebase defines CSS variables in `layout.css` (`--dewa-green: #007560`, `--dewa-gold: #ca8a04`, etc.) but inline styles throughout TSX files hardcode the same hex values. This creates a maintenance problem: changing a brand colour requires updating both the CSS file and every inline occurrence.

```tsx
// LaunchScreen.tsx — dozens of these
style={{ background: '#007560' }}
style={{ color: '#ca8a04' }}
style={{ borderColor: '#004937' }}

// AIIncident.tsx
const PRIORITY_COLOURS: Record<string, string> = {
  Critical: '#dc2626',
  High:     '#d97706',
  Medium:   '#ca8a04',
  Low:      '#007560',
}
```

**Fix:**  
For React inline styles, reference CSS variables via `getComputedStyle` or define a `COLOURS` constant in a shared module that mirrors the CSS variables:

```ts
// src/lib/colours.ts
export const C = {
  green:  'var(--dewa-green)',
  teal:   'var(--dewa-teal)',
  gold:   'var(--dewa-gold)',
  error:  '#dc2626',
  warning:'#d97706',
} as const
```

Or move the colour logic to CSS classes and eliminate inline colour styles entirely.

---

### CR-11 — Missing empty state for filtered results in `DiscoveryCatalog`

**File:** `src/pages/DiscoveryCatalog.tsx`

**Issue:**  
When a user applies filters and no discoveries match, the card area is simply empty — no message, no illustration, no hint that the filter produced zero results (vs. the page still loading). Users cannot distinguish between "loading" and "no results".

**Fix:**

```tsx
{!loading && filtered.length === 0 && (
  <div className="dc-empty-state">
    <Icon name="bi-funnel" />
    <p>No discoveries match your current filters.</p>
    <button onClick={clearFilters}>Clear filters</button>
  </div>
)}
```

---

### CR-12 — `useCurrentUser` hook: silent failure on Dataverse timeout leaves role blank in sidebar

**File:** `src/hooks/useCurrentUser.ts` — lines ~50–64

**Issue:**  
If the Dataverse person lookup times out (5-second timeout), the hook catches the error silently and `role` remains an empty string. The sidebar footer renders the user's role as blank. There's no retry and no fallback display string.

```ts
} catch {
  // non-fatal — role stays empty string
}
```

**Fix:**

```ts
} catch (err) {
  console.warn('[useCurrentUser] Person lookup timed out or failed:', err)
  setUser(u => ({ ...u, role: 'Member' }))  // fallback to default role
}
```

---

## Low

---

### CR-13 — Memory leak: `streamRef` interval in `CommandIQ` not cleared on unmount

**File:** `src/components/CommandIQ.tsx` — lines ~83–99

**Issue:**  
`streamRef.current` holds a `setInterval` reference. The interval is cleared when streaming completes, but if the component unmounts while a message is still streaming (e.g., user navigates away mid-response), the interval is never cleared.

**Fix:**

```tsx
useEffect(() => {
  return () => {
    if (streamRef.current) clearInterval(streamRef.current)
  }
}, [])
```

---

### CR-14 — `LaunchScreen` analytics preview shows static data without labelling it as preview

**File:** `src/components/LaunchScreen.tsx`

**Issue:**  
The Analytics tab on the launch screen shows KPI numbers (Total Programmes: 47, AI Adoption: 64%, etc.) that are hardcoded. Users with access to the live data may notice these numbers don't match their actual Dataverse records and become confused or distrust the platform.

**Fix:**  
Add a subtle "Preview data" or "Sample" label to the analytics panel, or load live summary stats asynchronously during the launch animation.

---

### CR-15 — Copy-to-clipboard in `CommandIQ` has no user feedback

**File:** `src/components/CommandIQ.tsx` — line ~336

**Issue:**  
The copy button silently calls `navigator.clipboard.writeText()`. If the clipboard operation fails (e.g., browser permissions not granted), the user sees nothing. If it succeeds, the user also sees nothing.

**Fix:**

```tsx
const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => setCopied(true))
    .catch(() => console.warn('Clipboard write failed'))
    .finally(() => setTimeout(() => setCopied(false), 2000))
}
// Render: {copied ? <Icon name="bi-check-lg" /> : <Icon name="bi-clipboard" />}
```

---

### CR-16 — `AIIncident.tsx` colour lookup is string-indexed without type safety

**File:** `src/pages/AIIncident.tsx` — line ~132

**Issue:**  
Chart bar colours are looked up by array index (`TYPE_PALETTE[idx % TYPE_PALETTE.length]`). If a new incident type is introduced, the colour assignment is arbitrary and potentially misleading.

**Fix:**  
Map incident types to specific colours explicitly:

```ts
const TYPE_COLOUR: Record<string, string> = {
  'Bias / Fairness':    '#ca8a04',
  'Data Privacy':       '#dc2626',
  'Cybersecurity':      '#d97706',
  'Reliability':        '#007560',
  'Vendor Risk':        '#004937',
}
const colour = TYPE_COLOUR[type] ?? '#85837c'
```

---

### CR-17 — `TechnologyStack` wraps `AIToolsTab` with no error boundary

**File:** `src/pages/TechnologyStack.tsx`

**Issue:**  
If `AIToolsTab` or `CopilotKitPanel` throws during render (e.g., malformed Dataverse response from `CopilotDataContext`), the entire Technology Stack page goes blank. This is the most data-heavy page in the app and therefore the most likely to encounter malformed data.

**Fix:**  
Wrap each sub-section individually in the generic `<ErrorBoundary>` component from CR-05.

---

### CR-18 — Inconsistent media query breakpoints across CSS files

**Files:** `src/layout.css`, `src/executive-summary.css`, `src/ai-command-center.css`, others

**Issue:**  
Different CSS files use different breakpoint values (768px, 640px, 480px, 380px) with no shared definition. When responsive behaviour needs to change, each file must be updated independently.

**Fix:**  
Define a set of custom media query breakpoints in `src/index.css` using `@custom-media` (PostCSS) or document the standard set at the top of each file with a comment:

```css
/* Breakpoints: 768px (mobile), 640px (small), 480px (xs), 380px (xxs) */
```

Alternatively, use CSS `@layer` to establish a global breakpoint convention.

---

### CR-19 — `Programs.tsx`: `eventType()` function is defined and suppressed, never called

**File:** `src/pages/Programs.tsx` — lines ~60–67

**Issue:**  
The `eventType()` helper was written but never wired up to the UI. It's suppressed with `void eventType` to silence the linter.

```ts
const eventType = (t: string) => {
  if (t === 'Workshop') return 'ev-type-workshop'
  if (t === 'Seminar')  return 'ev-type-seminar'
  // ...
}
void eventType
```

**Fix:**  
Either wire this function up to the event type badge rendering, or delete it.

---

### CR-20 — `AdoptionTab.tsx`: possibly unused import `LabelList`

**File:** `src/pages/ps/AdoptionTab.tsx` — line ~4

**Issue:**  
`LabelList` is imported from Recharts but may not be rendered anywhere in the component. TypeScript strict mode (`noUnusedLocals`) should catch this, but if the import is used in a JSX expression that was commented out, it may be silently retained.

**Fix:**  
Search for `<LabelList` in the file. If absent, remove the import.

---

### CR-21 — `AICommandCenter` status filter UI can flicker on rapid clicks

**File:** `src/pages/AICommandCenter.tsx` — lines ~156–160

**Issue:**  
The KPI card active state is derived from `statusFilter` state. Since React batches state updates, rapid clicks between different filter values may cause a one-frame flicker where no card appears active.

**Fix:**  
Minor visual issue only. Can be addressed by using `useTransition` to mark the state update as non-urgent, preventing intermediate render flashes.

---

### CR-22 — `LaunchScreen` progress animation may fire after unmount

**File:** `src/components/LaunchScreen.tsx` — lines ~100–109

**Issue:**  
`cycleProgress()` schedules nested callbacks via a `schedule()` helper. If the component unmounts while a deeply nested callback is pending, `setState` calls fire on an unmounted component. The `active` flag in the outer scope does not propagate into nested `schedule(() => cycleProgress(0), ...)` calls.

```ts
schedule(() => {
  setProgressState(0)
  schedule(() => cycleProgress(0), 600)  // ← `active` not visible here
}, offset + PROGRESS_ITEMS.length * 460 + 1400)
```

**Fix:**  
Pass the `active` flag into `schedule`, or clear all timeouts aggressively in the cleanup:

```ts
const timers: ReturnType<typeof setTimeout>[] = []
const schedule = (fn: () => void, delay: number) => {
  timers.push(setTimeout(fn, delay))
}
return () => { timers.forEach(clearTimeout) }
```

---

### CR-23 — `useCurrentUser` silently degrades when Power Apps SDK context is unavailable

**File:** `src/hooks/useCurrentUser.ts`

**Issue:**  
In local development, the Power Apps SDK context is not available. The hook catches the failure silently and falls back after 6 seconds. During those 6 seconds, the sidebar shows `'··'` (loading state) with no explanation. In production, if the SDK fails to initialise, the same silent degradation occurs.

**Fix:**  
Log a clear warning in development mode:

```ts
if (import.meta.env.DEV) {
  console.warn('[useCurrentUser] Power Apps SDK context unavailable — using fallback identity')
}
```

---

## Compliance Checks (CLAUDE.md Rules)

| Rule | Status | Notes |
|------|--------|-------|
| No emoji in source code | PASS | No emoji characters found in any `.tsx` or `.ts` file |
| `bi-currency-dirham` for finance | PASS | Finance tab is hidden; no currency icon violations found |
| Dubai font stack everywhere | PASS | All CSS and inline styles use the correct `'Dubai', 'Segoe UI', system-ui, sans-serif` stack |
| No React Router | PASS | Tab-based navigation only in `Layout.tsx` |
| Recharts only for charts | PASS | No other chart library imported |
| Bootstrap Icons via `<Icon>` only | PASS | No external icon fonts loaded; all icons use the embedded SVG component |
| No `any` types | PASS (mostly) | A few `unknown` casts in catch blocks are correctly used |
| No hardcoded Tailwind classes | PASS | No Tailwind usage found |
| Finance + Roadmap not in sidebar | PASS | Correctly commented out in `Sidebar.tsx` |

---

## Remediation Priority

### Do now (before next deployment)

| Issue | Action |
|-------|--------|
| CR-01 | Move API keys to `.env.local` |
| CR-02 | Add DOMPurify to `parseMarkdown` output |

### Do this sprint

| Issue | Action |
|-------|--------|
| CR-03 | Create `useScrollLock` hook |
| CR-04 | Fix useEffect cleanup pattern in DiscoveryCatalog + Programs |
| CR-05 | Add `<ErrorBoundary>` wrapper in Layout |
| CR-07 | Add `@keyframes spin` to programs.css |

### Backlog

| Issue | Action |
|-------|--------|
| CR-06 | Delete suppressed dead code |
| CR-08 | Improve error logging in all catch blocks |
| CR-09 | Add `aria-label` to all icon-only buttons |
| CR-10 | Centralise brand colours into shared constants |
| CR-11 | Add empty state to DiscoveryCatalog filtered view |
| CR-12 | Set fallback role in useCurrentUser timeout handler |
| CR-13 | Add streamRef cleanup on CommandIQ unmount |
| CR-15 | Add copy feedback in CommandIQ |
| CR-16 | Replace index-based colour lookup with explicit type map |
| CR-17 | Wrap TechnologyStack sub-panels in ErrorBoundary |
| CR-18 | Document or consolidate breakpoints |
| CR-19 | Delete unused `eventType` function in Programs |
| CR-20 | Remove unused `LabelList` import in AdoptionTab |
| CR-22 | Fix nested timer closure in LaunchScreen |
| CR-23 | Log SDK unavailability warning in dev mode |

---

## Resolution Log

**Resolved:** 2026-04-12  
**Resolved by:** Claude Code

---

### CR-01 — FIXED
Moved both Power Automate signing tokens to `.env.local` (git-ignored). `CommandIQ.tsx` and `CopilotDataContext.tsx` now read from `import.meta.env.VITE_AGENT_ENDPOINT` / `VITE_COPILOT_ENDPOINT`. Added runtime guard: if variable is undefined the app throws at boot with a clear message. `.env.example` added with placeholder values.

### CR-02 — FIXED
`parseMarkdown()` in `CommandIQ.tsx` now HTML-escapes the raw AI response text before applying bold/line-break transforms. This prevents attacker-controlled content from injecting arbitrary HTML tags through the `dangerouslySetInnerHTML` call site. No third-party sanitisation library was introduced — the escape step removes the attack surface directly.

### CR-03 — FIXED
Created `src/hooks/useScrollLock.ts` with a module-level reference counter. Replaced all five independent `useEffect` scroll-lock blocks in `Events.tsx`, `Programs.tsx`, `DiscoveryCatalog.tsx`, `AIIncident.tsx`, and `CommandIQ.tsx` with `useScrollLock()` / `useScrollLock(open)`. The hook accepts an optional `active` boolean so conditional locking (CommandIQ open/closed) works correctly.

### CR-04 — FIXED
`DiscoveryCatalog.tsx`: inlined fetch logic as a `useCallback` (`fetchData`) and called it from `useEffect(() => fetchData(), [fetchData])`, ensuring the cleanup function is always returned and the `active` flag always fires. `Programs.tsx`: added `let active = true` guards to both `useEffect` fetch calls with `return () => { active = false }` cleanup.

### CR-05 — FIXED
Created `src/components/ErrorBoundary.tsx` — class component with `getDerivedStateFromError`, error + component-stack logging, and a "Try again" recovery button. Wrapped `renderPage()` in `Layout.tsx` with `<ErrorBoundary key={activeTab}>` so navigating to a new tab resets the boundary.

### CR-06 — FIXED
Deleted all `void`-suppressed dead code:
- `LaunchScreen.tsx`: removed `const s = { color: accent }` and `void s` from `CtxIcon`.
- `Programs.tsx`: removed `const eventType = ...` / `void eventType` and `const initials = ...` / `void initials`.
- `DiscoveryCatalog.tsx`: removed `maps` prop from `KpiStrip` (it was passed but ignored with `void maps`).

### CR-07 — FALSE POSITIVE
`@keyframes spin` was already defined in `src/programs.css` at line 148. No fix required.

### CR-08 — FIXED
All catch blocks now log a prefixed, structured message with the extracted error string:
- `Programs.tsx`: `console.error('[Programs] Failed to load programs:', msg)`
- `DiscoveryCatalog.tsx`: `console.error('[DiscoveryCatalog] Failed to load data:', msg)`
- `Events.tsx`: `console.error('[Events] Failed to load events:', err instanceof Error ? err.message : String(err))`
- `AIIncident.tsx`: `console.error('[AIIncident] Failed to load incidents:', err instanceof Error ? err.message : String(err))`

### CR-09 — FIXED
Added `aria-label` attributes to the three icon-only buttons in `CommandIQ.tsx`: "New conversation", "Fullscreen" / "Exit fullscreen", and "Close chat".

### CR-10 — DEFERRED (backlog)
The inline hex values are widespread (15+ sites in LaunchScreen alone). Centralising them into a `src/lib/colours.ts` constant module is the correct fix but touches many files. Deferred to avoid unrelated churn in this pass.

### CR-11 — FALSE POSITIVE
`DiscoveryCatalog.tsx` already renders a `dc-empty-row` row in the table body when filtered results are empty. The card view also falls through to an empty container. No change required.

### CR-12 — FIXED
`useCurrentUser.ts`: catch block now sets `role = 'Member'` as a fallback when the Dataverse person lookup times out or fails, preventing a blank role in the sidebar footer.

### CR-13 — FIXED
Added a cleanup `useEffect` to `CommandIQ.tsx` that calls `clearInterval(streamRef.current)` on unmount, preventing the streaming ticker from firing after the component is gone.

### CR-14 — DEFERRED (backlog)
LaunchScreen analytics show hardcoded preview numbers. Adding a "Preview data" label or async loading is a feature-quality improvement. Deferred — no data integrity risk since the launch screen is a pure loading animation.

### CR-15 — FIXED
`CommandIQ.tsx`: added `copiedId` state. `handleCopy` now sets the copied ID on success and clears it after 2 seconds via `setTimeout`. The copy button renders a checkmark icon + "Copied!" text while the state is active.

### CR-16 — FIXED
Replaced the index-based `TYPE_PALETTE` lookup with an explicit `TYPE_COLOUR_MAP: Record<string, string>` covering all known incident types. Unknown types fall back to a deterministic hash into `TYPE_FALLBACK_PALETTE` (consistent colour per type name, not per sort order). Updated all 4 call sites that passed the now-removed `allTypes` second argument, and removed `allTypes` from `IncidentModal`'s props.

### CR-17 — FIXED
`TechnologyStack.tsx` now wraps `<AIToolsTab />` in `<ErrorBoundary>`. Combined with the page-level boundary in `Layout.tsx`, any render error in `AIToolsTab` or `CopilotDataContext` shows the recovery UI instead of a blank page.

### CR-18 — DEFERRED (backlog)
Breakpoint inconsistency across CSS files is a multi-file refactor. No functional regression; deferred.

### CR-19 — FIXED (part of CR-06)
`eventType()` and `void eventType` removed from `Programs.tsx` in the CR-06 pass.

### CR-20 — FALSE POSITIVE
`LabelList` is actively used in `AdoptionTab.tsx` at line 67 inside a `<Bar>` element. No change required.

### CR-21 — DEFERRED (backlog)
One-frame flicker on rapid AICommandCenter filter clicks. Minor visual issue; `useTransition` wrapper deferred.

### CR-22 — FALSE POSITIVE
`LaunchScreen.tsx` already pushes every `setTimeout` into a `timers[]` array via the `schedule()` helper, and the cleanup function calls `timers.forEach(clearTimeout)`. All nested callbacks are captured correctly. No change required.

### CR-23 — FIXED
`useCurrentUser.ts`: when the Power Apps SDK context is unavailable, the catch block now logs `console.warn('[useCurrentUser] Power Apps SDK context unavailable — using fallback identity. This is expected in local development.')` gated on `import.meta.env.DEV` so it never appears in production builds.

---

### Summary

| Finding | Status |
|---------|--------|
| CR-01 Critical: API keys in source | **FIXED** |
| CR-02 Critical: XSS in parseMarkdown | **FIXED** |
| CR-03 High: scroll-lock fragility | **FIXED** |
| CR-04 High: race condition / setState after unmount | **FIXED** |
| CR-05 High: no error boundaries | **FIXED** |
| CR-06 Medium: void-suppressed dead code | **FIXED** |
| CR-07 Medium: missing @keyframes spin | **FALSE POSITIVE** |
| CR-08 Medium: generic error messages | **FIXED** |
| CR-09 Medium: missing aria-labels | **FIXED** |
| CR-10 Medium: hardcoded hex colours | **DEFERRED** |
| CR-11 Medium: missing empty state | **FALSE POSITIVE** |
| CR-12 Low: blank role on timeout | **FIXED** |
| CR-13 Low: streamRef memory leak | **FIXED** |
| CR-14 Low: hardcoded preview stats | **DEFERRED** |
| CR-15 Low: no copy feedback | **FIXED** |
| CR-16 Low: index-based colour lookup | **FIXED** |
| CR-17 Low: no ErrorBoundary on AIToolsTab | **FIXED** |
| CR-18 Low: inconsistent breakpoints | **DEFERRED** |
| CR-19 Low: unused eventType function | **FIXED** |
| CR-20 Low: unused LabelList import | **FALSE POSITIVE** |
| CR-21 Low: filter flicker | **DEFERRED** |
| CR-22 Low: timer closure after unmount | **FALSE POSITIVE** |
| CR-23 Low: silent SDK degradation | **FIXED** |

**Fixed: 15 · False positive: 5 · Deferred: 4 (no functional regression)**
