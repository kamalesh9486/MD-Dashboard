/* Shared component primitives for the redesigned MD Dashboard: the NA tag, the
   hover-info "i" chip, the card head (eyebrow + title) and the progress bar.
   Component-only exports (design tokens live in ./tokens) so Fast Refresh is
   happy (react-refresh/only-export-components). */
import { useState, type CSSProperties } from 'react'
import { T, HEAD_FONT, BODY_FONT } from './lib/tokens'

/** Muted "NA" marker for missing/absent values. */
export function NAtag() { return <span style={{ color: T.mut3, fontWeight: 600 }}>NA</span> }

/** Render a value, or the NA tag when it is null / empty. */
export function Show({ v }: { v: string | number | null | undefined }) {
  return <>{v == null || v === '' ? <NAtag /> : v}</>
}

/** Hover-info chip (design: circular ⓘ → dark tooltip). */
export function Tip({ text, tone = 'light' }: { text: string; tone?: 'light' | 'dark' }) {
  const [open, setOpen] = useState(false)
  const chip: CSSProperties = tone === 'dark'
    ? { background: 'rgba(255,255,255,.16)', color: '#EAF6EF' }
    : { background: T.bg, color: T.mut }
  return (
    <span style={{ marginLeft: 'auto', flexShrink: 0, position: 'relative' }}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span style={{ width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', font: `700 11px ${HEAD_FONT}`, cursor: 'help', ...chip }}>i</span>
      {open && (
        <span style={{ position: 'absolute', top: 26, right: 0, zIndex: 30, width: 190, background: '#0C2A1C', color: '#DCEFE5', font: `500 11px/1.5 ${BODY_FONT}`, padding: '9px 11px', borderRadius: 9, boxShadow: '0 12px 28px -8px rgba(0,0,0,.4)', textAlign: 'left' }}>{text}</span>
      )}
    </span>
  )
}

/** Card head: eyebrow + title (+ optional info tip). */
export function Head({ eyebrow, title, tip, tone = 'light' }: { eyebrow: string; title: string; tip?: string; tone?: 'light' | 'dark' }) {
  const eyeColor = tone === 'dark' ? '#8FE0B6' : T.mut
  // Card titles are uppercased; dark-tone cards keep white text, light cards use the themed title token.
  const titleColor = tone === 'dark' ? '#fff' : T.title
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ font: `600 10px/1 ${BODY_FONT}`, letterSpacing: '.13em', textTransform: 'uppercase', color: eyeColor }}>{eyebrow}</div>
        <div style={{ font: `600 15px/1.25 ${HEAD_FONT}`, color: titleColor, marginTop: 6, textTransform: 'uppercase' }}>{title}</div>
      </div>
      {tip && <Tip text={tip} tone={tone} />}
    </div>
  )
}

/** Progress bar (track + fill) used by pillar rows and detail cards. */
export function Bar({ pct, color, height = 9 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, borderRadius: 6, background: T.track, overflow: 'hidden' }}>
      <div style={{ height: '100%', borderRadius: 6, background: color, width: `${Math.max(0, Math.min(100, pct))}%`, transition: 'width 1.1s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  )
}
