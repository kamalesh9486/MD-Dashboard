import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import Icon from '../../components/Icon'
import type { CopilotAdoptionData } from '../../services/CopilotAdoptionService'
import CopilotAppDivHeatmap from './CopilotAppDivHeatmap'

const B    = '#0078d4'
const G    = '#007560'
const GOLD = '#ca8a04'

const TT_STYLE = {
  background: 'rgba(28,28,30,0.93)', border: 'none',
  borderRadius: 9, padding: '8px 14px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.25)', fontSize: 12, color: '#fff',
}
const TT_LABEL = { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }
const TT_ITEM  = { color: '#fff', fontWeight: 600 as const }

// Friendly app display names
const APP_LABEL: Record<string, string> = {
  Outlook: 'Outlook', Word: 'Word', Excel: 'Excel', PowerPoint: 'PowerPoint',
  Teams: 'Teams', OutlookSidepane: 'Outlook Sidepane', Edge: 'Edge', Forms: 'Forms',
  Designer: 'Designer', SharePoint: 'SharePoint', 'Microsoft Teams': 'Teams (Classic)',
  Stream: 'Stream', OfficeCopilotNotebook: 'Office Notebook', OneNote: 'OneNote',
  Loop: 'Loop', OfficeCopilotSearchAnswer: 'Search Answer', m365copilot: 'M365 Copilot',
  Whiteboard: 'Whiteboard',
}

function SectionLabel({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${B}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: B, fontSize: 13, flexShrink: 0 }}>
        <Icon name={icon} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e', lineHeight: 1.2 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ flex: 1, height: 1, background: '#e5e7eb', marginLeft: 4 }} />
    </div>
  )
}

export default function CopilotAdoptionChartsSection({ data }: { data: CopilotAdoptionData }) {
  const { apps, divisions, topUsers } = data

  const top10Apps = apps.slice(0, 10).map(a => ({
    ...a,
    label: APP_LABEL[a.app] ?? a.app,
  }))
  const appChartHeight = Math.max(220, top10Apps.length * 38 + 48)

  const divChartData = divisions.map(d => ({
    ...d,
    shortName: d.division.length > 22 ? d.division.slice(0, 22) + '…' : d.division,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── App Usage ── */}
      <SectionLabel icon="bi-grid-1x2-fill" title="Copilot Usage by M365 App" sub="Total Copilot actions per Microsoft 365 application (all-time)" />
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: `1px solid ${B}18`, boxShadow: `0 2px 12px ${B}0a` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1c1c1e' }}>Top 10 Applications</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Outlook leads with {top10Apps[0]?.actions.toLocaleString()} actions</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${B}0d`, border: `1px solid ${B}25`, borderRadius: 8, padding: '5px 12px' }}>
            <Icon name="bi-bar-chart-horizontal-fill" style={{ color: B, fontSize: 13 }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: B }}>
              {apps.reduce((s, a) => s + a.actions, 0).toLocaleString()} total actions
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={appChartHeight}>
          <BarChart data={top10Apps} layout="vertical" margin={{ top: 0, right: 80, left: 0, bottom: 0 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)} />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} width={120} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
              formatter={(v: unknown) => [(v as number).toLocaleString(), 'Actions']} />
            <Bar dataKey="actions" radius={[0, 6, 6, 0]} name="Actions">
              {top10Apps.map((_, i) => <Cell key={i} fill={i === 0 ? B : `${B}${Math.round(90 - i * 6).toString(16)}`} />)}
              <LabelList dataKey="actions" position="right"
                content={({ value, x, y, width, height }) => {
                  if (value == null) return null
                  const v = value as number
                  const label = v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(v)
                  return (
                    <text x={(x as number) + (width as number) + 6} y={(y as number) + (height as number) / 2}
                      fill="#374151" fontSize={11} fontWeight={700} dominantBaseline="middle">{label}</text>
                  )
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── App × Division Heat Matrix ── */}
      {data.appDivision.length > 0 && (
        <>
          <SectionLabel
            icon="bi-table"
            title="App × Division Usage Matrix"
            sub="Adoption % or action volume for each M365 app across all DEWA divisions"
          />
          <CopilotAppDivHeatmap rows={data.appDivision} />
        </>
      )}

      {/* ── Division Adoption ── */}
      <SectionLabel icon="bi-diagram-3-fill" title="Adoption by Division" sub="Active Copilot users per DEWA division (sorted by volume)" />
      <div style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', border: `1px solid ${G}18`, boxShadow: `0 2px 12px ${G}0a` }}>
        <ResponsiveContainer width="100%" height={Math.max(180, divChartData.length * 36 + 40)}>
          <BarChart data={divChartData} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
            <YAxis type="category" dataKey="shortName" tick={{ fontSize: 10.5, fill: '#374151' }} axisLine={false} tickLine={false} width={178} />
            <Tooltip contentStyle={TT_STYLE} labelStyle={TT_LABEL} itemStyle={TT_ITEM}
              formatter={(v: unknown) => [(v as number).toLocaleString(), 'Active Users']} />
            <Bar dataKey="activeUsers" radius={[0, 6, 6, 0]} name="Active Users">
              {divChartData.map((d, i) => (
                <Cell key={i} fill={d.adoptionPct >= 100 ? G : d.adoptionPct >= 80 ? B : GOLD} />
              ))}
              <LabelList dataKey="activeUsers" position="right"
                style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
          {[
            { color: G,    label: '100% adoption' },
            { color: B,    label: '80–99% adoption' },
            { color: GOLD, label: '<80% adoption' },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span style={{ color: '#4b5563' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top Users ── */}
      <SectionLabel icon="bi-trophy-fill" title="Top Copilot Users" sub="Highest Copilot action counts across DEWA" />
      <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${GOLD}18`, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
              {['Rank', 'Name', 'Email', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Actions' ? 'right' : 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topUsers.map((u, i) => (
              <tr key={u.email} style={{ borderBottom: i < topUsers.length - 1 ? '1px solid #f3f4f6' : 'none', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '12px 16px', width: 52 }}>
                  {i === 0
                    ? <Icon name="bi-trophy-fill" style={{ color: GOLD, fontSize: 16 }} />
                    : <span style={{ fontWeight: 700, color: '#9ca3af', fontSize: 13 }}>#{i + 1}</span>
                  }
                </td>
                <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1c1c1e' }}>{u.name}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: 12 }}>{u.email}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: B }}>{u.actions.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
