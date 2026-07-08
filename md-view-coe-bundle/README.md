# MD View COE — drop-in bundle

The MD View dashboard (live from Dataverse `md_master`) as a self-contained set of files.
Copy these into a freshly cloned COE app, wire 1–2 lines, and add the `md_master` data source.

## What's included
```
src/pages/MDDashboardV8.tsx      ← MD View · LIVE  (reads md_master via the connector)
src/pages/MDDashboardV9.tsx      ← MD View · BOARD (fixed reference figures, no data needed)
src/pages/md/boardv8.tsx         ← shared board layout (tabs, gauge, charts) used by both
src/pages/md/boardv8Data.ts      ← shared display model + palette (BoardData, PILLAR_C)
src/pages/md/mdMasterFetch.ts    ← self-contained live loader (no seed; auto-resolves table name)
src/md-view-v8.css               ← V8/V9 styles (.mdv8)
src/md-view-v2.css               ← base tokens/panel styles the board reuses (.mdv2)  ← REQUIRED
src/generated/services/MicrosoftDataverseService.ts   ← generic Dataverse connector (for live fetch)
src/generated/models/MicrosoftDataverseModel.ts       ← its types
```

## Step 1 — copy files
Copy the whole `src/` tree from this bundle over your app's `src/` (nothing is overwritten except
the two generated Dataverse files, which are identical). Your cloned COE app already provides
`src/components/Icon.tsx`, `recharts`, and `@microsoft/power-apps` — no need to add those.

## Step 2 — show the screen
**Option A — make it the whole app** (simplest, "this screen only"). Replace your `src/App.tsx` body with:
```tsx
import { useState } from 'react'
import MDDashboardV8 from './pages/MDDashboardV8'   // live
import MDDashboardV9 from './pages/MDDashboardV9'   // board (fixed)

export default function App() {
  const [live, setLive] = useState(true)
  return (
    <div style={{ minHeight: '100vh', background: '#edf2f0', padding: '18px 22px' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button onClick={() => setLive(true)}  style={{ fontWeight: 800, padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}>MD View · Live</button>
        <button onClick={() => setLive(false)} style={{ fontWeight: 800, padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}>MD View · Board</button>
      </div>
      {live ? <MDDashboardV8 /> : <MDDashboardV9 />}
    </div>
  )
}
```
Wrap with `<PowerProvider>` in `main.tsx` exactly as the base COE app does (needed for Dataverse).

**Option B — add as tabs** in the existing `Layout.tsx` / `Sidebar.tsx`:
```tsx
// Layout.tsx
import MDDashboardV8 from '../pages/MDDashboardV8'
import MDDashboardV9 from '../pages/MDDashboardV9'
// ...in renderPage(): 
case 'md-view-v8': return <MDDashboardV8 />
case 'md-view-v9': return <MDDashboardV9 />
// Sidebar.tsx: add 'md-view-v8'/'md-view-v9' to the TabId union + a nav item for each.
```

## Step 3 — register the `md_master` data source
The **BOARD** view (V9) needs nothing. The **LIVE** view (V8) needs `md_master` reachable.

1. Add it to `power.config.json` under `databaseReferences → default.cds → dataSources`
   (see `power.config.snippet.json` in this folder):
   ```json
   "md_master": { "entitySetName": "md_masters", "logicalName": "md_master" }
   ```
2. Best: run it through the CLI so a typed service is generated too (needs a single DEWA sign-in):
   ```bash
   node ./node_modules/@microsoft/power-apps-cli/dist/Bin.js add-data-source \
     --api-id dataverse --resource-name md_master \
     --org-url "https://coeplatform-dev.crm15.dynamics.com/"
   ```
   (If it says "Multiple accounts", sign out of the non-DEWA account in Word/Teams first, or use
   service-principal env vars `SP_CLIENT_ID` / `SP_CLIENT_SECRET` / `SP_TENANT_ID`.)

## How to read the result
V8 prints its fetch status at the top of the page:
- 🟢 **"Live data connected — Live: N rows from 'md_masters'"** → working.
- 🟡 **"No live md_master data reachable — …"** → shows exactly why (table name, 0 rows, or no auth).
  Open the browser console for `[MD] md_master raw columns → [...]` to confirm the real column names,
  then adjust the `md_*_1` mappings in `mdMasterFetch.ts` if any differ.

## Notes
- V8 is **live-only, no seed fallback** by design. If you want it to always show numbers (like the
  other MD views), add a seed import and fall back when `rows.length === 0`.
- Runs only inside the Power Apps runtime for live data (the **Local Play** URL), not the plain
  `localhost` dev URL.
- Env: React 19 + Vite 7 + `recharts` + `@microsoft/power-apps` (all already in the COE app).
