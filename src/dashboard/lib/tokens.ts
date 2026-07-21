/* Design tokens for the redesigned MD Dashboard (colours, fonts, card shell).
   Kept in a constants-only module so ui.tsx can export components only
   (satisfies react-refresh/only-export-components). Values are verbatim from
   the Claude Design handoff (Agentic AI-MD Dashboard.dc.html). */
import type { CSSProperties } from 'react'

/* Surfaces, text and soft tints are CSS variables (defined in md-dashboard.css for
   :root + [data-theme="dark"]) so they re-colour on theme switch with no re-render.
   Brand accents (green/blue/amber…) stay concrete hex because they're also fed to
   Recharts as SVG fill/stroke attributes, which don't resolve var(). */
export const T = {
  bg: 'var(--md-bg)', card: 'var(--md-card)', border: 'var(--md-border)',
  ink: 'var(--md-ink)', inkDeep: 'var(--md-inkDeep)', title: 'var(--md-title)',
  mut: 'var(--md-mut)', mut2: 'var(--md-mut2)', mut3: 'var(--md-mut3)',
  green: '#0B7A46', greenBright: '#12B76A', greenDeep: '#0C4A2E', greenPillar: '#1FA971',
  blue: '#2E6BE6', amber: '#F0A21B', amberInk: 'var(--md-amberInk)', slate: '#64748B',
  track: 'var(--md-track)', inset: 'var(--md-inset)',
  bgBlue: 'var(--md-bgBlue)', bgGreen: 'var(--md-bgGreen)', bgAmber: 'var(--md-bgAmber)', bgSlate: 'var(--md-bgSlate)',
}
/** Pillar colours — Services / Processes / People (design order). */
export const PILLAR = { Services: T.blue, Processes: T.greenPillar, People: T.amber }

export const HEAD_FONT = "'Archivo','Dubai','Segoe UI',system-ui,sans-serif"
export const BODY_FONT = "'IBM Plex Sans','Dubai','Segoe UI',system-ui,sans-serif"

export const cardStyle: CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '20px 22px',
  boxShadow: '0 1px 2px rgba(16,32,26,.04),0 14px 30px -22px rgba(16,32,26,.3)', position: 'relative',
}
