/* Light/dark theme store. Drives two things:
   1. `data-theme` on <html> → the CSS variables in md-dashboard.css re-colour every
      DOM surface instantly (no re-render needed).
   2. A subscribable mode for the Recharts/SVG components, which CANNOT use CSS
      var() in fill/stroke attributes, so they read concrete hex per mode instead. */
import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark'
const KEY = 'md-theme'

function initial(): ThemeMode {
  try { return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light' } catch { return 'light' }
}
let mode: ThemeMode = initial()
const listeners = new Set<() => void>()

function apply(m: ThemeMode) {
  if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', m)
}
apply(mode) // set on first module load so the very first paint matches the saved choice

export function getThemeMode(): ThemeMode { return mode }
export function setThemeMode(m: ThemeMode) {
  if (m === mode) return
  mode = m
  try { localStorage.setItem(KEY, m) } catch { /* storage unavailable — ignore */ }
  apply(m)
  listeners.forEach(l => l())
}
export function toggleTheme() { setThemeMode(mode === 'dark' ? 'light' : 'dark') }

function subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } }
export function useThemeMode(): ThemeMode {
  return useSyncExternalStore(subscribe, getThemeMode, getThemeMode)
}
