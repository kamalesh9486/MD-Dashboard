---
name: copilot-agent-connect
description: |
  Scaffold a complete chatbot UI component connected to a Microsoft Copilot Studio agent.
  Use when user wants to add a chatbot, connect to a Copilot agent, integrate a Power Platform
  agent, build a chat interface, add a virtual assistant, or wire up a Copilot Studio bot.
  Triggers on: "add chatbot", "connect my agent", "copilot agent setup", "chatbot interface",
  "integrate Copilot Studio", "add AI assistant", "connect to my bot", "wire up agent",
  "create chatbot", "new chat component", "scaffold agent UI".
  Always invoke BEFORE writing any chat component or agent integration code.
---

# copilot-agent-connect

Scaffold a fully functional chatbot UI component wired to a **Microsoft Copilot Studio** agent
via the Power Apps SDK. Works in any React + TypeScript project using `@microsoft/power-apps`.

## What This Skill Produces

Two files dropped into `src/components/`:
- `<PascalName>Chat.tsx` — standalone React component, zero project-specific dependencies
- `<PascalName>Chat.css` — scoped CSS, `ac-` namespace, CSS custom properties for colours

Plus connector guidance and integration instructions printed at the end.

---

## Step 1 — Collect Inputs

Ask the user these questions **one at a time** in order. Do not ask all at once.

### Q1 — Agent logical name (REQUIRED)
```
What is the agent logical name?

This is the string passed as the first argument to ExecuteCopilotAsyncV2().
Where to find it: Power Apps Studio → Data panel → Microsoft Copilot Studio connector
→ the agent entry name shown there (e.g. copilots_header_da4fe).
```

### Q2 — Environment ID (REQUIRED)
```
What is your Power Platform environment ID?

A GUID that identifies your Power Platform environment.
Where to find it: power.config.json → "environmentId" field,
OR copy from the Power Platform Admin Center URL.
Example: 07da6342-8cc4-e81c-95fa-9ce24e7c2f46
```

### Q3 — Agent display name (REQUIRED)
```
What should the chat UI call this agent?

This is the human-readable name shown in the panel header.
Examples: "HR Assistant", "Finance Bot", "Command IQ"
```

### Q4 — Agent description (optional — press Enter to skip)
```
What is the agent's subtitle / description shown under the header?
Default: "Your AI Assistant"
```

### Q5 — Primary colour (optional)
```
Primary brand hex colour? Used for the orb, header gradient, user message bubbles.
Default: #007560  (DEWA green — change to your brand colour)
```

### Q6 — Accent colour (optional)
```
Accent hex colour? Used for AI bubble borders, thinking dots, animated cursor.
Default: #ca8a04
```

### Q7 — Quick prompt buttons (optional)
```
Up to 6 quick-prompt buttons shown on the welcome screen.
Format: label|query,label|query,...
Example: "Overview|Give me an overview,Help|How can you help?"
Press Enter to use the defaults.
```

Default quick prompts (used when Q7 is skipped):
```typescript
[
  { label: 'Overview',        query: 'Give me an overview of the current status' },
  { label: 'How can you help?', query: 'What are your capabilities?' },
  { label: 'Recent updates',  query: 'What are the most recent updates?' },
  { label: 'Key metrics',     query: 'Show me the key metrics' },
]
```

---

## Step 2 — Project Detection

Before generating any files, check these three things:

### 2a — Service file
Check: does `src/generated/services/MicrosoftCopilotStudioService.ts` exist?

**If missing → STOP.** Tell the user:
> "The auto-generated service is missing. Run `pac code generate` in your project root to regenerate
> `src/generated/`, then invoke `/copilot-agent-connect` again."

### 2b — Connector registration
Check: does `power.config.json` contain the string `978c3d96-f333-48ca-8172-6b3429a948d9`?

**If missing →** show the user the connector JSON from
`reference/power-config-connector.json` and say:
> "Add this object under the `connectionReferences` key in your `power.config.json`, using
> the connector ID as the key, then run `pac code generate` to refresh the service."

### 2c — Name collision
Check: does `src/components/<PascalCaseName>Chat.tsx` already exist?

**If exists →** ask:
> "A component named `<PascalCaseName>Chat.tsx` already exists. Overwrite it, or enter a
> different display name?"

---

## Step 3 — Derive Values

From the user's answers, derive:

| Derived value | Rule |
|---------------|------|
| `PASCAL_NAME` | Split display name on `/[\s\-_]+/`, capitalise first letter of each word, join. `"HR Assistant"` → `HrAssistant` |
| Component file | `src/components/{{PASCAL_NAME}}Chat.tsx` |
| CSS file | `src/components/{{PASCAL_NAME}}Chat.css` |
| `INPUT_PLACEHOLDER` | `Ask {{AGENT_DISPLAY_NAME}} anything…` |
| `FOOTER_TEXT` | `Powered by {{AGENT_DISPLAY_NAME}}` |
| `QUICK_PROMPTS_ARRAY` | TS array literal from Q7 pairs, or the 4 defaults |

**Quick prompts from Q7:** parse `label|query` pairs split by comma. Generate:
```typescript
[
  { label: '<label1>', query: '<query1>' },
  { label: '<label2>', query: '<query2>' },
  // ...up to 6
]
```
Escape any single quotes inside values by using double-quoted strings.

---

## Step 4 — Generate Files

Read `reference/chat-component.tsx.template` and `reference/chat-component.css.template`.

Replace every `{{TOKEN}}` with the derived values:

| Token | Replacement |
|-------|-------------|
| `{{PASCAL_NAME}}` | Derived PascalCase |
| `{{AGENT_LOGICAL_NAME}}` | Q1 |
| `{{AGENT_DISPLAY_NAME}}` | Q3 |
| `{{AGENT_DESCRIPTION}}` | Q4 or `Your AI Assistant` |
| `{{PRIMARY_COLOR}}` | Q5 or `#007560` |
| `{{ACCENT_COLOR}}` | Q6 or `#ca8a04` |
| `{{QUICK_PROMPTS_ARRAY}}` | TS array literal |
| `{{INPUT_PLACEHOLDER}}` | Derived |
| `{{FOOTER_TEXT}}` | Derived |

Write the result to:
- `src/components/{{PASCAL_NAME}}Chat.tsx`
- `src/components/{{PASCAL_NAME}}Chat.css`

---

## Step 5 — Print Integration Instructions

After writing the files, output exactly this (with values substituted):

```
✓ {{PASCAL_NAME}}Chat.tsx created
✓ {{PASCAL_NAME}}Chat.css created

To add {{AGENT_DISPLAY_NAME}} to your app:

1. In your root component (e.g. App.tsx or main.tsx):
   import {{PASCAL_NAME}}Chat from './components/{{PASCAL_NAME}}Chat'

2. Render it as a sibling to your main layout (outside any scroll container):
   return (
     <>
       <YourLayout />
       <{{PASCAL_NAME}}Chat />
     </>
   )

3. Build check:
   npm run build

4. The floating orb appears fixed at the bottom-right corner.
   Click it to open the chat panel and start a conversation.
```

---

## Verification Checklist

Confirm with the user after generating:
- [ ] `src/components/{{PASCAL_NAME}}Chat.tsx` created with correct agent name
- [ ] `src/components/{{PASCAL_NAME}}Chat.css` created
- [ ] `src/generated/services/MicrosoftCopilotStudioService.ts` is present
- [ ] Connector ID `978c3d96-f333-48ca-8172-6b3429a948d9` is in `power.config.json`
- [ ] `npm run build` — zero TypeScript errors
- [ ] Floating orb visible at runtime, chat panel slides in on click

---

## Portability Notes

This skill generates code with **zero project-specific dependencies**:
- Does NOT import `useScrollLock`, `useCurrentUser`, `<Icon>`, or any DEWA-specific utilities
- Scroll lock is inlined (3-line `useEffect`)
- All icons are inline SVG `<path>` elements — no external icon font required
- Only external import is `MicrosoftCopilotStudioService` from `../generated/services/MicrosoftCopilotStudioService`
  which is standard in every Power Apps project after `pac code generate`

To deploy this skill to another project: copy the entire `copilot-agent-connect/` folder
into that project's `.claude/skills/` directory. No other changes needed.
