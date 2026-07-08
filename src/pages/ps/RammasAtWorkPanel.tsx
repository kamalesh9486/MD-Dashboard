import { useEffect, useState } from 'react'
import { RammasAtWorkService, type RammasAtWorkData } from '../../services/RammasAtWorkService'
import Icon from '../../components/Icon'
import RammasOverviewTab from './RammasOverviewTab'
import RammasBrdTab from './RammasBrdTab'
import RammasMyRammasTab from './RammasMyRammasTab'
import RammasKmTab from './RammasKmTab'

const COLOR = '#00695c'
const RED   = '#dc2626'

type TabId = 'overview' | 'brd' | 'myrammas' | 'km'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'KPI Overview',          icon: 'bi-columns-gap'      },
  { id: 'brd',      label: 'BRD Analytics',        icon: 'bi-file-text'        },
  { id: 'myrammas', label: 'MyRammas',              icon: 'bi-robot'            },
  { id: 'km',       label: 'Knowledge Management',  icon: 'bi-book-fill'        },
]

export default function RammasAtWorkPanel({ onBack }: { onBack: () => void }) {
  const [data,    setData]    = useState<RammasAtWorkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  useEffect(() => {
    let active = true
    RammasAtWorkService.fetch().then(r => {
      if (!active) return
      if (r.error) setError(r.error)
      else setData(r.data)
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1.5px solid var(--border-card)', borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--dewa-green)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,117,96,0.3)' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-card)' }}>
        <Icon name="bi-chevron-left" /> Back to all Technology
      </button>

      {/* Hero card */}
      <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: `0 4px 24px ${COLOR}22`, border: `1px solid ${COLOR}33` }}>
        <div style={{ background: `linear-gradient(135deg, ${COLOR}ee 0%, #004d40bb 100%)`, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 15, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            <Icon name="bi-people-fill" style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Rammas At Work</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
              BRD Platform · MyRammas Bot Builder · Knowledge Management — unified AI analytics
            </div>
          </div>
          <div style={{ background: loading ? '#e5e7eb' : '#dcfce7', color: loading ? '#6b7280' : '#15803d', fontSize: 9, fontWeight: 800, letterSpacing: '0.6px', padding: '3px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            {!loading && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />}
            {loading ? 'LOADING' : 'LIVE'}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ background: 'rgba(255,255,255,0.97)', borderTop: `1px solid ${COLOR}20`, display: 'flex', gap: 0 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '11px 20px',
                fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? COLOR : '#6b7280',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? `3px solid ${COLOR}` : '3px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: -1,
              }}
              onMouseEnter={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = COLOR }}
              onMouseLeave={e => { if (activeTab !== tab.id) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280' }}>
              <Icon name={tab.icon} style={{ fontSize: 14 }} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: COLOR, fontSize: 14, fontWeight: 600 }}>
          <Icon name="bi-arrow-repeat" style={{ marginRight: 8 }} />Loading analytics…
        </div>
      )}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 20px', color: RED, fontSize: 13, fontWeight: 600 }}>
          <Icon name="bi-exclamation-triangle-fill" style={{ marginRight: 8 }} />{error}
        </div>
      )}

      {/* Active tab content */}
      {data && activeTab === 'overview' && <RammasOverviewTab data={data} />}
      {data && activeTab === 'brd'      && <RammasBrdTab      data={data} />}
      {data && activeTab === 'myrammas' && <RammasMyRammasTab data={data} />}
      {data && activeTab === 'km'       && <RammasKmTab       data={data} />}

    </div>
  )
}
