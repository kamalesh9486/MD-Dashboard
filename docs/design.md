# DEWA AI COE Platform — Design System Reference

This document is the authoritative design reference for the DEWA AI COE Platform. All UI work must follow these rules exactly. Do not guess — read this file.

---

## 1. Project Identity

**Platform:** DEWA AI Center of Excellence (AI COE)
**Audience:** Internal DEWA leadership and staff — UAE government enterprise
**Character:** Analytical, authoritative, premium. Every screen should look boardroom-ready.
**Tech stack:** React 19 + TypeScript + Vite. Bootstrap Icons for iconography. Recharts for data visualization.

---

## 2. Fonts

The **primary font is Dubai** — a system font pre-installed on Windows 10+ and UAE devices. No import needed.

```css
font-family: 'Dubai', 'Segoe UI', system-ui, sans-serif;
```

Use this font stack for **all text** — headings, body, labels, and UI elements.

| Use case | Font | Weight |
|---|---|---|
| Page titles, headings | Dubai | 700 |
| Section labels, nav items | Dubai | 600–700 |
| Body text, descriptions | Dubai | 400 |
| Stat values (large numbers) | Dubai | 700 |
| Badges, tags, metadata | Dubai | 400–600 |

**Do not use** Space Grotesk, DM Sans, or JetBrains Mono — those belong to the EZ Design System and are not used here.

---

## 3. Color Palette

### Brand Colors

```css
--dewa-green:      #007560   /* primary action color, chart bars, icons, dots */
--dewa-teal:       #004937   /* dark variant — gradients, hover, heading text */
--dewa-gold:       #ca8a04   /* accent, active nav, badges, shimmer, CTAs */
--dewa-gold-light: #f6c343   /* active nav text, gold highlights */
--dewa-navy:       #1c1c1e   /* primary text color */
```

### Background & Surface

```css
--bg:          #edf2f0   /* page background — cool green tint */
--bg2:         #e4ebe7   /* secondary background — slightly darker green tint */
--surface:     #ffffff   /* card / panel background */
--surface-2:   rgba(255,255,255,0.85)   /* frosted overlay */
--surface-hover: rgba(255,255,255,0.97) /* card hover state */
```

### Text

```css
--text:       #1c1c1e   /* primary text — near-black, DEWA navy */
--text-muted: #5a6672   /* secondary text — descriptions, metadata */
--text-dim:   #9ca3af   /* tertiary text — timestamps, disabled */
```

### Borders

```css
--border:      rgba(0,117,96,0.13)  /* default border — green-tinted */
--border-card: rgba(0,117,96,0.16)  /* card borders */
```

### Semantic Status Colors

```css
#dc2626  /* high risk / error */
#ca8a04  /* medium risk / warning (same as dewa-gold) */
#007560  /* low risk / success (same as dewa-green) */
#3b82f6  /* info */
#22c55e  /* live/online indicator */
```

### Rule: No pure white (#fff) background on the page shell. No pure black (#000) text. The background is always `var(--bg)` (#edf2f0).

---

## 4. App Shell Layout

```
+── sidebar (264px) ──+──── main-wrapper ─────────────────────────────+
│  Dark forest green  │  topbar (62px, frosted glass)                 │
│  gradient           │  ─────────────────────────────────────────────│
│  brand logo-mark    │                                                │
│  "AI COE"           │  page-content (28px 32px padding)             │
│  "Center of         │                                                │
│   Excellence"       │  Each page renders here                       │
│  ─────────────────  │                                                │
│  nav items          │                                                │
│  (12 pages)         │                                                │
│  ─────────────────  │                                                │
│  user avatar        │                                                │
│  name + role        │                                                │
│  logout button      │                                                │
+─────────────────────+───────────────────────────────────────────────+
```

### CSS Variables

```css
--sidebar-width:     264px
--sidebar-collapsed: 68px
--topbar-height:     62px
--radius-card:       14px
--radius-btn:        9px
```

---

## 5. Sidebar

### Structure

- Fixed position, full viewport height
- **Dark forest green gradient:** `linear-gradient(175deg, #001f18 0%, #002d22 45%, #003828 100%)`
- Gold shimmer on top edge: 2px gradient bar `transparent → #ca8a04 → #f6c343 → transparent`
- Subtle crosshatch texture overlay (SVG data URI, 1.5% opacity white)
- `box-shadow: 4px 0 32px rgba(0,0,0,0.22)`

### Brand Header

- Height: 62px (matches topbar)
- Logo mark: 38×38px rounded square, gold gradient (`#ca8a04 → #d97706`), pulsing glow animation
- Brand name: "AI COE" — white, 15px, weight 700
- Sub label: "Center of Excellence" — 10.5px, 45% white opacity
- Collapsed state: hides brand text, shows only logo mark

### Nav Items

Active state styling:
```css
background: linear-gradient(90deg, rgba(202,138,4,0.22), rgba(202,138,4,0.06));
color: #f6c343;
border-left: 2px solid #ca8a04;
font-weight: 600;
/* Icon gets gold glow: filter: drop-shadow(0 0 5px rgba(202,138,4,0.6)); */
```

Default state:
```css
color: rgba(255,255,255,0.60);
border-left: 2px solid transparent;
border-radius: 10px;
font-size: 13.5px;
```

Hover state:
```css
background: rgba(255,255,255,0.07);
color: rgba(255,255,255,0.92);
border-left-color: rgba(255,255,255,0.2);
```

Section label: uppercase, 9px, 700 weight, letter-spacing 2px, 30% white opacity.

Collapsed tooltips: appear on hover, `#002d22` background, gold border, gold text.

Submenu items: 50px left padding, 12.5px font, 45% white opacity default.

### Navigation Structure (12 pages in order)

| Tab ID | Label | Icon |
|---|---|---|
| `executive-summary` | Executive Summary | `bi-bar-chart-line-fill` |
| `division-analytics` | Division Analytics | `bi-diagram-3-fill` |
| `programs` | Programs | `bi-folder2-open` |
| → `events` | ↳ Events (submenu) | `bi-calendar-event` |
| `people-skills` | People & Skills | `bi-people-fill` |
| `technology-stack` | Technology Stack | `bi-cpu-fill` |
| `discovery-catalog` | Discovery Catalog | `bi-kanban` |
| `ai-incident` | AI Incidents | `bi-shield-exclamation` |
| `ai-command-center` | AI Command Center | Custom Power BI SVG |

Finance and Strategic Roadmap are currently commented out — do not add them back without being asked.

### Sidebar Footer

- User avatar: 36×36px rounded square, gold gradient, white initials, 700 weight, 12px
- User name: 13px, 600 weight, 90% white
- User role: 10.5px, 40% white
- Logout button: `bi-box-arrow-right` icon, turns gold on hover

---

## 6. Topbar

```css
background: rgba(255,255,255,0.88);
backdrop-filter: blur(24px);
height: 62px;
padding: 0 28px;
border-bottom: 1px solid rgba(0,117,96,0.1);
box-shadow: 0 1px 0 rgba(0,117,96,0.08), 0 4px 20px rgba(0,0,0,0.05);
position: sticky; top: 0; z-index: 50;
```

**Page title styling** — gradient text, not solid:
```css
background: linear-gradient(90deg, #007560, #004937);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
font-size: 17px; font-weight: 700; letter-spacing: -0.2px;
```

**Toggle button:** white background, green border, rounded, subtle shadow. Hover: light green bg (`#f0faf7`), green icon.

**DEWA logo:** SVG, 36px height, top-right corner.

---

## 7. Page Content Area

```css
padding: 28px 32px;
```

### Page Header Pattern

```html
<div class="page-header">
  <h1>Page Title</h1>
  <p>Subtitle or description</p>
</div>
```

```css
.page-header h1 {
  font-size: 26px; font-weight: 700; letter-spacing: -0.3px;
  background: linear-gradient(90deg, #007560 0%, #004937 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  margin: 0 0 6px;
}
.page-header p { color: var(--text-muted); font-size: 13.5px; margin: 0; }
```

**Rule:** All page h1 headings use the DEWA green→teal gradient text treatment. Never solid black.

---

## 8. Cards

### Stat Card

Used for KPI numbers on dashboards.

```css
.stat-card {
  background: var(--surface);             /* white */
  border-radius: 14px;
  padding: 20px;
  border: 1px solid rgba(0,117,96,0.16);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
  position: relative; overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}
/* Top accent bar — always present */
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #007560, #ca8a04);
  border-radius: 14px 14px 0 0;
}
.stat-card:hover {
  box-shadow: 0 8px 28px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}
```

Stat card icon: 44×44px rounded square (12px radius), green bg at 10% opacity, green icon (20px), green border at 15%.

Gold variant icon: `rgba(202,138,4,0.1)` bg, `var(--dewa-gold)` color, `rgba(202,138,4,0.2)` border.

Stat value: 28px, 700 weight, `#1c1c1e`.

Stat label: 13px, `var(--text-muted)`.

### Content Card

Used for sections, lists, charts.

```css
.content-card {
  background: var(--surface);
  border-radius: 14px; padding: 24px;
  border: 1px solid rgba(0,117,96,0.16);
  box-shadow: 0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 20px; position: relative; overflow: hidden;
}
/* Same green→gold top accent bar */
.content-card::before { /* same as stat-card::before */ }
.content-card h2 {
  font-size: 15px; font-weight: 700; color: #1c1c1e;
  margin: 0 0 16px; padding-bottom: 12px;
  border-bottom: 1px solid rgba(0,117,96,0.1);
}
```

**Rule:** Every card (both stat and content) has the 3px green→gold gradient top accent bar. This is a non-negotiable visual signature.

---

## 9. Grid Layouts

```css
/* KPI row — 4 equal columns */
.kpi-4-grid  { display: grid; grid-template-columns: repeat(4, 1fr); }

/* Stats auto-fill — min 200px per column */
.stats-grid  { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 28px; }

/* Two-column form */
.form-2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
```

---

## 10. Lists

```css
.placeholder-list li {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0,117,96,0.07);
  font-size: 13.5px;
}
.li-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #007560;
  box-shadow: 0 0 6px rgba(0,117,96,0.4);  /* subtle green glow */
}
```

---

## 11. Charts (Recharts)

Use `recharts` for all data visualization. Do not introduce other chart libraries.

Standard bar color: `#007560` (DEWA green).
Secondary bar/line color: `#ca8a04` (DEWA gold).
Tertiary: `#004937` (DEWA teal).

Chart text: 12px, `#5a6672` (var(--text-muted)).
Grid lines: `rgba(0,117,96,0.07)`.
Tooltip: white background, `rgba(0,117,96,0.16)` border, 13px Dubai font.
`ResponsiveContainer` with `width="100%"`.

Example chart color array:
```tsx
const COLORS = ['#007560', '#ca8a04', '#004937', '#007560']
```

---

## 12. App Background

The `.dewa-app` shell has a layered radial gradient background:

```css
background:
  radial-gradient(ellipse 70% 50% at 15% 0%,   rgba(0,117,96,0.09) 0%, transparent 60%),
  radial-gradient(ellipse 55% 45% at 85% 100%,  rgba(0,73,55,0.07) 0%, transparent 55%),
  radial-gradient(ellipse 40% 35% at 50% 50%,   rgba(202,138,4,0.03) 0%, transparent 60%),
  #edf2f0;
```

This creates a subtle, warm green glow in the corners over the tinted background.

---

## 13. Shadows

```css
--shadow-card:       0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04);
--shadow-card-hover: 0 8px 28px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06);
```

Do not use heavy Material Design elevation. All shadows are low-opacity and subtle.

---

## 14. Border Radius

```css
--radius-card: 14px   /* cards, panels */
--radius-btn:  9px    /* buttons, inputs */
8px                   /* submenu items, small chips */
10px                  /* nav link buttons */
12px                  /* icon containers */
```

---

## 15. Animations & Transitions

Transition timing for interactive elements:
```css
transition: all 0.2s ease;       /* nav items, cards */
transition: all 0.18s;           /* buttons, small elements */
transition: 0.28s cubic-bezier(.4,0,.2,1);  /* sidebar collapse, submenu */
```

**Named keyframes** — use these, don't invent new ones:

| Name | Use | Spec |
|---|---|---|
| `es2-fade-up` | Page section entrances | opacity 0→1, translateY(28px→0) |
| `es2-hero-enter` | Hero banner load | opacity 0→1, translateY(-14px→0) |
| `es2-count-in` | Stat number reveal | opacity 0→1, translateY(8px→0) |
| `es2-shimmer` | Card shimmer sweep | translateX(-120%→250%) skewX(-12deg) |
| `es2-glow-pulse` | KPI card pulse | box-shadow intensity cycle |
| `es2-float` | Decorative float | translateY 0→-7px→0, 0%→50%→100% |
| `es2-live-pulse` | Live status dot | ring expand + fade |
| `logo-pulse` | Sidebar logo mark | gold glow intensity cycle |

**Rule:** No bounce/elastic easing. No CSS `animation-timing-function: spring()`. All animations decelerate smoothly.

---

## 16. Executive Summary Specific Patterns

The Executive Summary (`ExecutiveSummary.tsx`) is the most visually complex page. It sets the gold standard.

- Uses CSS class prefix `es2-` for all its styles
- Animated neural network SVG in the hero background (fixed stable node positions — do not regenerate randomly)
- Hero section: full-width, min-height 156px, position relative for overlay elements
- KPI stat cards with animated count-up effect on mount
- Recharts `ComposedChart` with `Bar` + `Line` combo for ROI trends
- Date range filter tabs: `month | quarter | year`
- Risk category badges: colored by severity (red/gold/green)
- Skill domain progress bars

---

## 17. Responsive Breakpoints

```css
/* Topbar and padding reduce */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-100%); }  /* hidden, toggled by hamburger */
  .sidebar.mobile-open { transform: translateX(0); }
  .main-wrapper { margin-left: 0; }
  .page-content { padding: 20px 16px; }
  .stats-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-4-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .page-content { padding: 16px 12px; }
  .topbar-page-title { font-size: 14px; max-width: 160px; overflow: hidden; text-overflow: ellipsis; }
}

@media (max-width: 480px) {
  .stats-grid { grid-template-columns: 1fr; }
  .page-header h1 { font-size: 22px; }
  .form-2-grid { grid-template-columns: 1fr; }
}

@media (max-width: 380px) {
  .page-content { padding: 12px 10px; }
  .topbar-logo { height: 28px; }
}
```

**Mobile behavior:** sidebar overlays with `position: fixed`, full-width, `z-index: 100`. Mobile overlay backdrop uses `backdrop-filter: blur(6px)`, `rgba(0,0,0,0.45)`.

---

## 18. Per-Page CSS Files

Each page has its own CSS file in `src/`. Follow this naming convention:

| Page | CSS file |
|---|---|
| Executive Summary | `executive-summary.css` (prefix: `es2-`) |
| AI Command Center | `ai-command-center.css` |
| AI Incidents | `ai-incident.css` |
| Discovery Catalog | `discovery-catalog.css` |
| Finance | `finance.css` |
| People & Skills | `people-skills.css` |
| Programs | `programs.css` |
| Strategic Roadmap | `strategic-roadmap.css` |
| Layout (sidebar+topbar) | `layout.css` |

Import each CSS file at the top of its corresponding component:
```tsx
import '../executive-summary.css'
```

---

## 19. Bootstrap Icons

All icons use Bootstrap Icons via class names with the `Icon` component:

```tsx
import Icon from '../components/Icon'

<Icon name="bi-bar-chart-line-fill" className="nav-icon" aria-hidden="true" />
```

Standard icon sizes:
- Nav icons: 17px (`font-size: 17px`), fixed 20px width
- Sub-nav icons: 13px, 15px width
- Stat card icons: 20px inside 44×44px container
- Topbar toggle: 18px

---

## 20. CSS Variable Reference

```css
/* Full set from layout.css */
--dewa-gold:          #ca8a04
--dewa-gold-light:    #f6c343
--dewa-green:         #007560
--dewa-teal:          #004937
--dewa-navy:          #1c1c1e
--sidebar-bg-from:    #001f18
--sidebar-bg-mid:     #002d22
--sidebar-bg-to:      #003828
--bg:                 #edf2f0
--bg2:                #e4ebe7
--surface:            #ffffff
--surface-2:          rgba(255,255,255,0.85)
--surface-hover:      rgba(255,255,255,0.97)
--border:             rgba(0,117,96,0.13)
--border-card:        rgba(0,117,96,0.16)
--text:               #1c1c1e
--text-muted:         #5a6672
--text-dim:           #9ca3af
--sb-text:            rgba(255,255,255,0.60)
--sb-text-hover:      rgba(255,255,255,0.92)
--sb-text-active:     #f6c343
--sidebar-width:      264px
--sidebar-collapsed:  68px
--topbar-height:      62px
--radius-card:        14px
--radius-btn:         9px
--shadow-card:        0 2px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)
--shadow-card-hover:  0 8px 28px rgba(0,0,0,0.11), 0 2px 6px rgba(0,0,0,0.06)
```

---

## 21. What NOT to Do

- No Tailwind classes
- No EZ Design System tokens (no `--font-display`, `--accent-600`, `--bg-primary`, etc.)
- No Space Grotesk, DM Sans, or JetBrains Mono fonts
- No pure black (#000) or pure white (#fff) on the page shell
- No drop shadows heavier than `--shadow-card-hover`
- No glassmorphism (no `blur()` except the topbar's intended frosted glass)
- No gradient text on anything except page h1 headings and the topbar page title
- No bounce/elastic animation easings
- No React Router — navigation is tab-based state in `Layout.tsx`
- No new chart libraries — use Recharts exclusively
- No modals — not currently in use; if needed, use a slide-in panel pattern instead
- Do not add Finance or Strategic Roadmap back to the sidebar without explicit instruction (they are commented out intentionally)
- Do not add dark mode — the current theme does not implement it
