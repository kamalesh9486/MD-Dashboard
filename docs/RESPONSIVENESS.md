# Responsiveness & Screen Size Handling — DEWA COE AI Intelligence Platform

> Reference document for applying the same responsive patterns to another project.
> Stack: React 19 + TypeScript + Vite + plain CSS (no Tailwind, no CSS-in-JS).

---

## 1. Core Philosophy

- **CSS-first responsiveness** — nearly all responsive behaviour lives in per-page `.css` files, not in component logic.
- **One JavaScript breakpoint** — the only JS resize listener is in `Layout.tsx` at `768px` to switch the sidebar between desktop-persistent and mobile-overlay modes.
- **Mobile-first padding, desktop-first columns** — content padding scales down with media queries; column counts are declared at desktop width and reduced at smaller breakpoints.
- **No utility framework** — breakpoints are hardcoded in each file's `@media` blocks; there are no Tailwind-style responsive prefixes.

---

## 2. Breakpoint Reference

| Breakpoint | Common usage |
|---|---|
| `1400px` | Reduce very wide KPI strips (6 cols → 3 cols) |
| `1280px` | Reflow 12-col executive summary grids |
| `1100px` | Charts row 3-col → 2-col; program grid 3 → 2 |
| `1024px` | App-level flex reflow; font-size reduction |
| `960px` | Switch data tables to card lists |
| `900px` | Chart rows 2-col → 1-col; agent grids 2 → 1 |
| `768px` | **Primary mobile breakpoint** — sidebar overlay, modal full-width, grid 2-col |
| `760px` | Events timeline: sticky → static; tab bar full-width |
| `640px` | Topbar title truncation; calendar legend hidden |
| `600px` | AI Command Center filter layout collapse |
| `480px` | Grid → single column; gap reduction |
| `420px` | Launch screen: reduced padding + font sizes |
| `380px` | Minimum mobile: padding `12px 10px`; logo shrinks |
| `360px` | Absolute minimum — events list compression |
| `max-height: 800px` | Launch screen viewport-height constraint |
| `max-height: 680px` | Launch screen: hide non-essential cards |

---

## 3. Sidebar / Shell Layout

### Desktop (> 768px)
- Sidebar is `position: fixed; left: 0;` with `width: 264px` (expanded) or `68px` (collapsed).
- Main content has `margin-left: 264px` (or `68px`), switching via a CSS class.
- User can toggle collapsed state with a button.

### Mobile (≤ 768px)
- Sidebar gets `transform: translateX(-100%)` — completely hidden off-screen.
- Adding `.mobile-open` applies `transform: translateX(0)` to slide it in.
- Main content gets `margin-left: 0 !important` — full width.
- A semi-transparent `.sidebar-overlay` div is rendered behind the open sidebar; clicking it closes the menu.

```css
/* layout.css — sidebar mobile rules */
@media (max-width: 768px) {
  .sidebar          { transform: translateX(-100%); }
  .sidebar.mobile-open { transform: translateX(0); }
  .main-wrapper     { margin-left: 0 !important; }
  .page-content     { padding: 20px 16px; }
}
@media (max-width: 640px) {
  .page-content { padding: 16px 12px; }
}
@media (max-width: 480px) {
  .page-content { padding: 12px 10px; }
}
```

### JavaScript — the one resize hook

```tsx
// Layout.tsx
const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
const [mobileOpen, setMobileOpen] = useState(false)

useEffect(() => {
  function handleResize() {
    const mobile = window.innerWidth <= 768
    setIsMobile(mobile)
    if (!mobile) setMobileOpen(false)   // auto-close sidebar when resizing to desktop
  }
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

// Sidebar overlay — only rendered on mobile
{isMobile && (
  <div
    className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
    onClick={() => setMobileOpen(false)}
  />
)}
```

`isMobile` is also used to suppress the collapsed-class logic on desktop:
```tsx
const mainClass = ['main-wrapper', !isMobile && collapsed ? 'collapsed' : '']
  .filter(Boolean).join(' ')
```

---

## 4. Page Content Padding Scale

Full desktop → tiny mobile, all in `layout.css`:

| Screen width | Padding |
|---|---|
| > 768px | `28px 32px` |
| ≤ 768px | `20px 16px` |
| ≤ 640px | `16px 12px` |
| ≤ 480px | `12px 10px` |

---

## 5. Grid Column Reflow Patterns

All grids use standard CSS Grid. Column counts are reduced progressively with breakpoints.

### KPI Strip — 6 → 3 → 2 → 1
```css
.dc-kpi-strip { grid-template-columns: repeat(6, 1fr); gap: 14px; }

@media (max-width: 1400px) { .dc-kpi-strip { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px)  { .dc-kpi-strip { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .dc-kpi-strip { grid-template-columns: 1fr 1fr; gap: 8px; } }
```

### KPI Cards — 4 → 2 → 1
```css
.kpi-4-grid { grid-template-columns: repeat(4, 1fr); }

@media (max-width: 1024px) { .kpi-4-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 480px)  { .kpi-4-grid { grid-template-columns: 1fr; } }
```

### Content Cards / Program Grid — 3 → 2 → 1
```css
.prog-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }

@media (max-width: 1100px) { .prog-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px)  { .prog-grid { grid-template-columns: 1fr; } }
```

### Chart Row — 3 cols → 2 → 1
```css
.ev2-charts-row { grid-template-columns: 2fr 1.2fr 1fr; gap: 14px; }

@media (max-width: 1100px) { .ev2-charts-row { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px)  { .ev2-charts-row { grid-template-columns: 1fr; } }
```

### Auto-fill (no explicit breakpoints needed)
```css
/* Automatically wraps when items can't fit at min 170px */
.ah-kpi-grid { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
.stats-grid  { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
```
`auto-fill` + `minmax` is used for uniform small-card grids where the count should be fluid rather than stepped.

---

## 6. Table → Card Switch Pattern

Tables are often unreadable on mobile. The pattern: render both, toggle visibility.

```css
/* Default desktop — table visible, card list hidden */
.inc-table-wrap { display: block; }
.inc-card-list  { display: none; }

@media (max-width: 960px) {
  .inc-table-wrap { display: none; }
  .inc-card-list  { display: flex; flex-direction: column; gap: 10px; }
}
```

Apply to any table that would require horizontal scrolling on mobile. The breakpoint varies by column count — 960px for wide tables, 768px for narrower ones.

---

## 7. Charts (Recharts) Responsive Sizing

**Every chart is wrapped in `<ResponsiveContainer width="100%">`** — this is the only mechanism for chart width scaling. Height is always a fixed pixel value.

```tsx
<ResponsiveContainer width="100%" height={220}>
  <BarChart data={data}>
    {/* ... */}
  </BarChart>
</ResponsiveContainer>
```

Chart containers are flex or grid items, so the chart fills whatever space the layout assigns. At narrow breakpoints the grid collapses from multi-column to single-column, and `width="100%"` ensures the chart fills the new full-width slot.

Do **not** use `height="100%"` — always provide an explicit pixel height.

---

## 8. Fluid Typography — `clamp()`

Used on large display text (launch screen headings, hero text):

```css
.ls-ht-center { font-size: clamp(38px, 5.5vw, 62px); }
```

Regular body and UI text uses fixed `px` sizes reduced at breakpoints, not `clamp()`.

---

## 9. Horizontal Scroll for Fixed-Width Content

When content has a minimum meaningful width (e.g., a heat-map or wide table), wrap it in a scrollable container rather than crushing it:

```css
.es-heat-scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;   /* smooth inertia scroll on iOS */
}
.es-heat-grid {
  min-width: 560px;   /* forces scroll at any viewport narrower than this */
}
```

---

## 10. Slide-in Panels (Detail / Form Overlays)

Panels are used instead of modals everywhere. On desktop they slide in from the right at a fixed width. On mobile they expand to full width.

```css
.panel { width: 480px; }

@media (max-width: 768px) {
  .panel { width: 100%; border-radius: 14px 14px 0 0; }
}
```

Panels use `position: fixed` with a backdrop overlay — same structure as the mobile sidebar overlay.

---

## 11. Filter Rows & Search Bars

Filter rows use `display: flex; flex-wrap: wrap; gap: 10px;` at all screen sizes. Individual filter controls get `min-width` to prevent them from shrinking below usability:

```css
.acc-filter-group > * {
  flex: 1;
  min-width: 140px;
  max-width: 380px;
}
```

At 768px, filter rows switch to `flex-direction: column; align-items: stretch;` so each control becomes full-width:

```css
@media (max-width: 768px) {
  .prog-filter-row  { flex-direction: column; align-items: stretch; }
  .prog-filter-right { flex-wrap: wrap; }
}
```

Search bars shrink or expand to full-width:
```css
.dc-search-wrap { max-width: 440px; }

@media (max-width: 768px) {
  .dc-search-wrap { width: 100%; max-width: 100%; }
}
```

---

## 12. Topbar Truncation

The page title in the topbar truncates on small screens to prevent overflow:

```css
@media (max-width: 640px) {
  .topbar-page-title {
    max-width: 160px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
```

---

## 13. Viewport-Height Constraints (Launch Screen)

The launch screen uses `max-height` media queries in addition to width breakpoints to handle short viewports (laptops with small screens, landscape phone):

```css
@media (max-height: 800px) {
  .ls-hero { padding-top: 24px; padding-bottom: 24px; }
  /* reduce vertical spacing */
}

@media (max-height: 680px) {
  .la-card-file,
  .la-card-context { display: none; }   /* hide secondary cards */
  /* minimal layout — only essentials remain */
}
```

---

## 14. Quick-Reference: What Changes at 768px

768px is the single most important breakpoint in this app. At this width:

| Element | Desktop | Mobile |
|---|---|---|
| Sidebar | Fixed left, always visible | Hidden, slides in as overlay |
| Main content margin | `264px` or `68px` | `0` |
| Page padding | `28px 32px` | `20px 16px` |
| KPI grids | 4 or more columns | 2 columns |
| Chart rows | 2–3 columns | 1 column |
| Filter rows | Horizontal flex | Vertical stack |
| Search bars | Fixed max-width | Full width |
| Modals / panels | Custom width, centred | Full width |
| Data tables (in some pages) | Visible | Hidden (replaced by card list) |

---

## 15. CSS Variable Reference (Layout Dimensions)

Defined once in `layout.css` / `index.css`, used everywhere:

```css
--sidebar-width:      264px;
--sidebar-collapsed:  68px;
--topbar-height:      62px;
--radius-card:        14px;
--radius-btn:         9px;
```

These are not overridden inside media queries — the JS logic swaps classes instead of changing the variables.
