# Flow Connection Skill — Architecture & Design

---

## 1. Purpose

Centralize Power Automate flow registration so the React Code App can invoke flows by a stable **logical key** instead of hardcoded Flow IDs. Admins manage flow metadata in a dedicated UI; environments and solutions can change without touching code.

---

## 2. Current Problem

- Flow IDs hardcoded in services/components
- No central place to see which flows exist or their status
- Environment migration (Dev → Test → Prod) requires manual code edits
- No validation of flow configuration before use
- Duplicate registrations possible
- No connection-test mechanism

---

## 3. Goals & Non-Goals

### Goals
- One source of truth for all Power Automate flows used in the app
- Environment-independent configuration
- Admin-managed lifecycle (add/edit/activate/deactivate/test/delete)
- Reusable across approval, notification, attachment, and routing flows
- Secure handling of connection references and trigger URLs

### Non-Goals
- Replacing the Power Automate authoring experience
- Building a flow designer
- Cross-tenant flow sharing

---

## 4. Architecture Overview

**Three layers:**

1. **Dataverse table** `dem_flowregistry` — persistent registry
2. **Service layer** `flowRegistryService` + `flowExecutionService` — CRUD, validation, invocation
3. **React layer** — `useFlow` / `useFlowRegistry` hooks + Admin UI

```
┌──────────────────────────────────────────────────────────────┐
│                     Admin UI (FlowConnectionPage)            │
│  List · Add · Edit (Drawer) · Test · Activate · Delete       │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│           useFlowRegistry (CRUD)   |   useFlow (invoke)      │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│  flowRegistryService           │  flowExecutionService       │
│  - list/get/create/update      │  - resolveKey()             │
│  - validate()                  │  - invoke(payload)          │
│  - testConnection()            │  - cache + auth refresh     │
└────────────────────────────┬─────────────────────────────────┘
                             │ Dataverse Web API
                             ▼
┌──────────────────────────────────────────────────────────────┐
│         Dataverse table: dem_flowregistry                    │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Data Model — `dem_flowregistry`

| Column | Type | Required | Purpose |
|---|---|---|---|
| `dem_flowregistryid` | GUID (PK) | yes | Primary key |
| `dem_flowkey` | Text (unique, max 100) | yes | Logical key consumers reference, e.g. `approval.demand.submit` |
| `dem_flowname` | Text (max 200) | yes | Display name |
| `dem_flowid` | Text (GUID format) | yes | Power Automate Flow GUID |
| `dem_environmentname` | Text | yes | Env display name |
| `dem_environmentid` | Text (GUID) | yes | Env GUID |
| `dem_solutionname` | Text | yes | Solution display name |
| `dem_solutionid` | Text (GUID) | yes | Solution GUID |
| `dem_connectionreference` | Text | conditional | Connection ref logical name |
| `dem_connectortype` | Choice | yes | HTTP / Dataverse / Outlook / SharePoint / Teams / Custom |
| `dem_authstatus` | Choice | yes | Connected / Expired / Failed / Unknown |
| `dem_category` | Choice | yes | Approval / Notification / Attachment / Routing / Other |
| `dem_owner` | Lookup (SystemUser) | yes | Admin owner |
| `dem_isactive` | Boolean | yes | Active/inactive toggle (default true) |
| `dem_triggerurl` | Text (secured) | conditional | HTTP trigger URL when connector type = HTTP |
| `dem_lasttestedon` | DateTime | no | Last successful test timestamp |
| `dem_lasttestresult` | Multiline Text | no | OK or last error message |
| `dem_description` | Multiline Text | no | Free-text notes |
| `statecode` / `statuscode` | Standard | yes | Active / Inactive lifecycle |

### Choice Sets

- **`dem_connectortype`**: `HTTP`, `Dataverse`, `Outlook`, `SharePoint`, `Teams`, `Custom`
- **`dem_authstatus`**: `Connected`, `Expired`, `Failed`, `Unknown`
- **`dem_category`**: `Approval`, `Notification`, `Attachment`, `Routing`, `Other`

### Indexes / Constraints
- Unique constraint on `dem_flowkey`
- Unique constraint on `dem_flowid` within the same `dem_environmentid`

---

## 6. Code Layout

```
src/
├── models/
│   └── FlowRegistry.ts              # FlowRegistryEntry, FlowCategory, ConnectorType, AuthStatus
├── constants/
│   └── flowKeys.ts                  # FLOW_KEYS constants
├── services/
│   ├── flowRegistryService.ts       # CRUD + validate()
│   └── flowExecutionService.ts      # Resolve key → invoke flow
├── hooks/
│   ├── useFlowRegistry.ts           # List/CRUD for admin UI
│   └── useFlow.ts                   # useFlow(key) → { invoke, status }
├── pages/AdminPanel/
│   └── FlowConnectionPage.tsx       # Admin screen route
└── components/admin/flow/
    ├── FlowList.tsx                 # DataGrid of registered flows
    ├── FlowEditorPanel.tsx          # Slide-in editor (Drawer)
    ├── FlowTestRunner.tsx           # Test payload invoker
    └── FlowStatusBadge.tsx          # Coloured status pill
```

---

## 7. Flow Key Convention

`<category>.<domain>.<action>` — lowercase, dot-separated, ASCII only.

Examples:
- `approval.demand.submit`
- `approval.demand.review`
- `notification.consent.request`
- `notification.stakeholder.assigned`
- `attachment.demand.upload`
- `routing.workorder.assign`

```typescript
// src/constants/flowKeys.ts
export const FLOW_KEYS = {
  APPROVAL_DEMAND_SUBMIT: 'approval.demand.submit',
  APPROVAL_DEMAND_REVIEW: 'approval.demand.review',
  NOTIFICATION_CONSENT_REQUEST: 'notification.consent.request',
  ATTACHMENT_DEMAND_UPLOAD: 'attachment.demand.upload',
  ROUTING_WORKORDER_ASSIGN: 'routing.workorder.assign',
} as const;

export type FlowKey = typeof FLOW_KEYS[keyof typeof FLOW_KEYS];
```

---

## 8. Validation & Registration Workflow

```
[Admin fills form]
      ↓
[Client-side validation]      GUID format, required fields, key format
      ↓
[flowRegistryService.validate()]
      ├─ flowId GUID format valid?
      ├─ environmentId matches current env (warning if not)?
      ├─ solutionId resolvable?
      ├─ connectionReference present for connector type?
      ├─ duplicate flowKey?
      ├─ duplicate (flowId, environmentId) pair?
      └─ isActive + isPublished?
      ↓
[Optional test invocation — FlowTestRunner]
      ↓
[Persist to dem_flowregistry]
      ↓
[Audit log entry → dem_flowregistryaudit]
```

`validate()` is a pure function returning `{ ok: boolean, errors: ValidationError[], warnings: ValidationWarning[] }`. UI surfaces results via Fluent `MessageBar`.

---

## 9. UI/UX Design

Follows D2D conventions: Fluent UI v9, slide-in panels (no modals), warm neutrals from project palette.

### `/admin/flows` page

- **Header:** "Flow Connections" + "+ Add Flow" primary button
- **Toolbar:** category filter dropdown, status filter, search box
- **DataGrid columns:** Key · Name · Category · Connector · Status badge · Last Tested · Owner · Actions
- **Row actions:** Edit · Test · Activate/Deactivate · Delete (with confirmation dialog)
- **Empty state:** illustration + CTA "Register your first flow"

### Flow Editor (slide-in Drawer)

Right-side drawer, 480px wide, four sections separated by dividers:

1. **Flow Identity** — `dem_flowkey`, `dem_flowname`, `dem_category`, `dem_description`
2. **Environment & Solution** — `dem_environmentname/id`, `dem_solutionname/id`, with **"Use current environment"** helper button that pre-fills from `window.PowerAppsSDK` context
3. **Connection** — `dem_connectortype` dropdown → conditional `dem_connectionreference` + `dem_triggerurl` fields
4. **Test** — embedded `FlowTestRunner`: JSON payload editor + "Run test" button + response viewer

Save button disabled until validation passes. Live `MessageBar` shows errors as user types.

### Status Badge Colours

| Status | Colour | Token |
|---|---|---|
| Connected | green | `colorPaletteGreenForeground1` |
| Expired | amber | `colorPaletteYellowForeground1` |
| Failed | red | `colorPaletteRedForeground1` |
| Unknown/Inactive | neutral | `colorNeutralForeground3` |

---

## 10. Consumer API

Application code never references Flow IDs directly.

```typescript
import { useFlow } from '@/hooks/useFlow';
import { FLOW_KEYS } from '@/constants/flowKeys';

function SubmitDemandButton({ demandId }: Props) {
  const { invoke, status, error } = useFlow(FLOW_KEYS.APPROVAL_DEMAND_SUBMIT);

  const handleClick = async () => {
    await invoke({ demandId, submittedBy: currentUser.id });
  };

  return <Button onClick={handleClick} disabled={status === 'invoking'}>Submit</Button>;
}
```

`useFlow` internals:
1. Resolves key → registry entry (cached in memory + sessionStorage, 5-min TTL)
2. Validates `isActive` and `authstatus === 'Connected'`
3. Invokes via Power Apps SDK generated client
4. Updates `dem_lasttestresult` / `dem_lasttestedon` on completion
5. Emits telemetry event

---

## 11. Error Handling

| Scenario | Behaviour |
|---|---|
| Flow key not in registry | Throw `FlowNotRegisteredError`, log telemetry, toast "Feature temporarily unavailable" |
| Flow inactive | Throw `FlowInactiveError`, block call, surface in admin UI |
| Auth expired | Auto-retry once after token refresh; if still fails, mark `dem_authstatus = Expired`, notify owner via email flow |
| Connector returns 4xx/5xx | Capture response, write to `dem_lasttestresult`, increment failure counter |
| Network timeout | Retry with exponential backoff (max 3 attempts), then `FlowInvocationError` |

A shared `FlowInvocationError` base class with discriminated `kind` field for type-safe handling.

```typescript
type FlowInvocationError =
  | { kind: 'not-registered'; key: string }
  | { kind: 'inactive'; key: string }
  | { kind: 'auth-expired'; key: string; connectionRef: string }
  | { kind: 'invocation-failed'; key: string; status: number; message: string };
```

---

## 12. Connection Testing

The `FlowTestRunner` component lets admins verify flows before activation:

- JSON payload editor with schema-aware autocomplete
- "Run test" button invokes the flow with the payload
- Response viewer: status code, latency (ms), full response body
- Result written to `dem_lasttestedon` and `dem_lasttestresult`
- Visual indicator: green check / amber warning / red cross

---

## 13. Security & Governance

### Roles
- **Flow Admin** (custom security role) — full CRUD on `dem_flowregistry`
- **Flow Reader** — read-only; assigned to all app users

### Audit
- Companion table `dem_flowregistryaudit` captures every change
- Columns: action, performed-by, timestamp, before-snapshot (JSON), after-snapshot (JSON)
- Retention: 365 days

### Secrets
- `dem_triggerurl` stored as **secured column**; visible only to Flow Admins
- `dem_connectionreference` masked in UI (last 4 chars only) except when admin clicks "Reveal"
- No flow IDs, URLs, or connection refs ever logged to console or telemetry

### Environment Independence
- Same logical key (`dem_flowkey`) used across Dev/Test/Prod
- Each environment has its own row with its own `dem_flowid` and `dem_environmentid`
- Solution export/import re-resolves bindings automatically

---

## 14. Reusability

The same registry serves all flow categories. Adding a new category only requires:
1. New value in `dem_category` choice set
2. New constant(s) in `flowKeys.ts`
3. Register the flow in the admin UI

No service-layer or hook changes needed.

---

## 15. Best Practices

- **Never hardcode** `dem_flowid` values in `.tsx` or `.ts` files
- **Always import** keys from `src/constants/flowKeys.ts`
- **Always invoke** flows through `useFlow` or `flowExecutionService`
- **Always validate** in the service layer, never trust client-side checks alone
- **Always audit** mutations to the registry
- **Always test** a flow after registration before marking it active
- **Always use** the `dem_` prefix for new Dataverse columns
- **Always confirm** demand-type applicability when wiring a flow into a stage

---

## 16. Build Sequence

1. Create `dem_flowregistry` table + choice columns in Dataverse (via maker.powerapps.com)
2. Create `dem_flowregistryaudit` companion table
3. Configure security roles (Flow Admin, Flow Reader) and field-level security profile for `dem_triggerurl`
4. Regenerate SDK models via `pac code add-data-source`
5. Add `src/models/FlowRegistry.ts`, `src/constants/flowKeys.ts`
6. Build `flowRegistryService.ts` with validate + CRUD
7. Build `flowExecutionService.ts` with resolve + invoke + cache
8. Build `useFlowRegistry` + `useFlow` hooks
9. Build admin page + editor drawer + test runner components
10. Migrate **one** existing hardcoded flow as reference implementation (proposed: AI Suggestion flow in [src/services/aiEnrichmentService.ts](../src/services/aiEnrichmentService.ts))
11. Update `CONVENTIONS.md` with flow-registry usage rules
12. Update `PROJECT.md` Current State section

---

## 17. Open Decisions (require user input)

1. Table name `dem_flowregistry` and column list — approve or adjust?
2. Scaffold Dataverse table first, or start with TypeScript models and admin UI assuming the table is created in maker.powerapps.com?
3. Pilot migration target — AI Suggestion flow, or pick a different one?
4. Should expired auth notifications go through a Power Automate flow (chicken-and-egg) or a direct Graph API call?
5. Retention period for `dem_flowregistryaudit` — 365 days, or different?

---

## 18. References

- [Power Apps Code Apps Docs](https://learn.microsoft.com/en-us/power-apps/maker/model-driven-apps/power-apps-code-apps)
- [Dataverse Web API Reference](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/about)
- [Fluent UI v9 — Drawer](https://react.fluentui.dev/?path=/docs/components-drawer)
- [Power Platform Connection References](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-connection-reference)
