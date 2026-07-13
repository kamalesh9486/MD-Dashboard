/* Design tokens for the redesigned MD Dashboard (colours, fonts, card shell).
   Kept in a constants-only module so ui.tsx can export components only
   (satisfies react-refresh/only-export-components). Values are verbatim from
   the Claude Design handoff (Agentic AI-MD Dashboard.dc.html). */
import type { CSSProperties } from 'react'

export const T = {
  bg: '#EEF2F0', card: '#fff', border: '#E7ECE9',
  ink: '#10201A', inkDeep: '#0C2A1C', mut: '#7C8A82', mut2: '#6A7871', mut3: '#9AA79F',
  green: '#0B7A46', greenBright: '#12B76A', greenDeep: '#0C4A2E', greenPillar: '#1FA971',
  blue: '#2E6BE6', amber: '#F0A21B', amberInk: '#9A6712', slate: '#64748B',
  track: '#EDF1EF', inset: '#F6F9F7',
  bgBlue: '#EEF3FE', bgGreen: '#EAF6EF', bgAmber: '#FEF3E1', bgSlate: '#F1F3F2',
}
/** Pillar colours — Services / Processes / People (design order). */
export const PILLAR = { Services: T.blue, Processes: T.greenPillar, People: T.amber }

export const HEAD_FONT = "'Archivo','Dubai','Segoe UI',system-ui,sans-serif"
export const BODY_FONT = "'IBM Plex Sans','Dubai','Segoe UI',system-ui,sans-serif"

export const cardStyle: CSSProperties = {
  background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: '20px 22px',
  boxShadow: '0 1px 2px rgba(16,32,26,.04),0 14px 30px -22px rgba(16,32,26,.3)', position: 'relative',
}
