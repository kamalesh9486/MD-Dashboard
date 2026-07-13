/* Count-up number: animates 0 → target on mount (and whenever the target
   changes, e.g. when Dataverse data arrives). Accepts the already-formatted
   display value (number or string like "AED 46.4M", "16,005", "59.9%") and
   animates the leading numeric part in place, preserving prefix/suffix + commas.
   Non-numeric values ("NA", null) render as the NA tag. */
import { useEffect, useRef, useState } from 'react'
import { NAtag } from './ui'

interface Parsed { prefix: string; suffix: string; decimals: number; target: number }
function parse(s: string): Parsed | null {
  const m = s.match(/^(.*?)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const numStr = m[2]
  return {
    prefix: m[1], suffix: m[3],
    decimals: numStr.includes('.') ? numStr.split('.')[1].length : 0,
    target: parseFloat(numStr.replace(/,/g, '')),
  }
}
const fmt = (n: number, d: number) => n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

export function Num({ v, duration = 1100 }: { v: string | number | null | undefined; duration?: number }) {
  const text = v == null || v === '' ? null : String(v)
  const parsed = text == null ? null : parse(text)
  const target = parsed?.target ?? 0
  const [val, setVal] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (!parsed) return
    let startTs = 0
    const tick = (t: number) => {
      if (!startTs) startTs = t
      const p = Math.min(1, (t - startTs) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(target * eased)
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    // first frame (p≈0) yields 0, so no synchronous reset is needed
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
    // re-run only when the numeric target changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  if (text == null) return <NAtag />
  if (!parsed) return <>{text}</>
  return <>{parsed.prefix}{fmt(val, parsed.decimals)}{parsed.suffix}</>
}
