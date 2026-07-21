import MdDashboard from '../dashboard/MdDashboard'
import { ErrorBoundary } from './ErrorBoundary'

/* The MD Dashboard owns its full shell now (slim rail + header banner + tabs,
   recreated from the Claude Design handoff), so Layout is just a thin mount —
   no extra topbar / sidebar chrome around it. */
export default function Layout() {
  return (
    <ErrorBoundary>
      <MdDashboard />
    </ErrorBoundary>
  )
}
