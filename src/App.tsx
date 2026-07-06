import { useState } from 'react'
import LaunchScreen from './components/LaunchScreen'
import Layout from './components/Layout'
import CommandIQ from './components/CommandIQ'
import { CopilotDataProvider } from './context/CopilotDataContext'
import { CoELensProvider }     from './context/CoELensContext'

export default function App() {
  const [launched, setLaunched] = useState(false)

  if (!launched) {
    return <LaunchScreen onLaunch={() => setLaunched(true)} />
  }

  return (
    <CopilotDataProvider>
      <CoELensProvider>
        <Layout onLogout={() => setLaunched(false)} />
        <CommandIQ />
      </CoELensProvider>
    </CopilotDataProvider>
  )
}
