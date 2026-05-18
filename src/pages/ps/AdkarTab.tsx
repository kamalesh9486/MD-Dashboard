import { useState, useEffect } from 'react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import type { AdkarScore } from './data'
import { Cr978_coe_divisionsService } from '../../generated'
import type { Cr978_coe_divisions } from '../../generated/models/Cr978_coe_divisionsModel'
import Icon from '../../components/Icon'

function mapToAdkarScore(r: Cr978_coe_divisions): AdkarScore {
  return {
    division:      r.cr978_divisionname,
    awareness:     r.cr435_awarenessscore ?? 0,
    desire:        r.cr435_desirescore    ?? 0,
    knowledge:     r.cr435_knowledgescore ?? 0,
    ability:       r.cr435_ability        ?? 0,
    reinforcement: r.cr435_reinforcement  ?? 0,
  }
}

const DIMENSIONS = [
  { key: 'awareness',     label: 'Awareness',     short: 'A', color: '#007560', desc: 'Employees are aware of the need for AI adoption' },
  { key: 'desire',        label: 'Desire',         short: 'D', color: '#004937', desc: 'Employees have the desire to participate and support' },
  { key: 'knowledge',     label: 'Knowledge',      short: 'K', color: '#ca8a04', desc: 'Employees know how to use AI tools effectively' },
  { key: 'ability',       label: 'Ability',        short: 'Ab', color: '#3d9e7a', desc: 'Employees demonstrate the required skills in practice' },
  { key: 'reinforcement', label: 'Reinforcement',  short: 'R', color: '#dc2626', desc: 'Practices are embedded and sustained long-term' },
] as const

type DimKey = typeof DIMENSIONS[number]['key']

function scoreColor(v: number) {
  if (v >= 80) return '#007560'
  if (v >= 65) return '#ca8a04'
  return '#dc2626'
}

function heatBg(v: number): string {
  if (v >= 80) return 'rgba(0,117,96,0.16)'
  if (v >= 65) return 'rgba(202,138,4,0.15)'
  return 'rgba(220,38,38,0.12)'
}

function heatBorder(v: number): string {
  if (v >= 80) return 'rgba(0,117,96,0.22)'
  if (v >= 65) return 'rgba(202,138,4,0.22)'
  return 'rgba(220,38,38,0.2)'
}

function adkarRadarData(row: AdkarScore) {
  return DIMENSIONS.map(d => ({
    subject: d.label,
    value: row[d.key as DimKey],
    fullMark: 100,
  }))
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: { subject: string; value: number } }[] }) {
  if (!active || !payload?.length) return null
  const { subject, value } = payload[0].payload
  return (
    <div style={{ background: 'rgba(28,28,30,0.92)', borderRadius: 8, padding: '8px 12px' }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{subject}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: '#ca8a04' }}>{value}</div>
    </div>
  )
}

export default function AdkarTab() {
  const [adkarScores, setAdkarScores] = useState<AdkarScore[]>([])
  const [loading,     setLoading]     = useState(true)
  const [selectedDiv, setSelectedDiv] = useState('')

  useEffect(() => {
    Cr978_coe_divisionsService.getAll().then(result => {
      if (result.data) {
        const rows = result.data.map(mapToAdkarScore)
        setAdkarScores(rows)
        if (rows.length > 0) setSelectedDiv(rows[0].division)
      }
    }).finally(() => setLoading(false))
  }, [])

  const current = adkarScores.find(r => r.division === selectedDiv)
  const radarData = current ? adkarRadarData(current) : []
  const overallAvg = current ? Math.round(
    (current.awareness + current.desire + current.knowledge + current.ability + current.reinforcement) / 5
  ) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Overall summary strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {loading && (
          <span style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>
            <Icon name="bi-arrow-repeat" style={{ marginRight: 6 }} />Loading divisions…
          </span>
        )}
        {adkarScores.map(row => {
          const avg = Math.round((row.awareness + row.desire + row.knowledge + row.ability + row.reinforcement) / 5)
          return (
            <button
              key={row.division}
              onClick={() => setSelectedDiv(row.division)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10, border: '1.5px solid',
                borderColor: selectedDiv === row.division ? '#007560' : 'rgba(0,117,96,0.15)',
                background: selectedDiv === row.division ? '#007560' : '#fff',
                color: selectedDiv === row.division ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                transition: 'all 0.18s',
              }}
            >
              {row.division}
              <span style={{
                background: selectedDiv === row.division ? 'rgba(255,255,255,0.2)' : `${scoreColor(avg)}15`,
                color: selectedDiv === row.division ? '#fff' : scoreColor(avg),
                padding: '2px 7px', borderRadius: 20, fontSize: 11, fontWeight: 700,
              }}>
                {avg}
              </span>
            </button>
          )
        })}
      </div>

      {current && <div className="ps-adkar-layout">
        {/* Left: Radar + bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ps-card">
            <div className="ps-card-header">
              <span className="ps-card-title">
                <Icon name="bi-hexagon-fill" /> ADKAR Radar — {selectedDiv}
              </span>
              <span style={{
                background: `${scoreColor(overallAvg)}15`,
                color: scoreColor(overallAvg),
                fontWeight: 700, fontSize: 13,
                padding: '3px 12px', borderRadius: 20,
              }}>
                Avg {overallAvg}/100
              </span>
            </div>
            <div style={{ padding: '8px 0 0' }}>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="#e8e5de" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Radar
                    name={selectedDiv}
                    dataKey="value"
                    stroke="#007560"
                    fill="#007560"
                    fillOpacity={0.18}
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#007560', strokeWidth: 0 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Progress bars */}
          <div className="ps-card">
            <div className="ps-card-header">
              <span className="ps-card-title"><Icon name="bi-sliders" /> Dimension Breakdown</span>
            </div>
            <div className="ps-adkar-bars">
              {DIMENSIONS.map(dim => {
                const val = current[dim.key as DimKey]
                return (
                  <div className="ps-adkar-bar-row" key={dim.key}>
                    <div className="ps-adkar-bar-label">
                      <span>
                        <span style={{
                          display: 'inline-flex', width: 20, height: 20,
                          borderRadius: 6, background: `${dim.color}15`,
                          color: dim.color, fontSize: 10, fontWeight: 800,
                          alignItems: 'center', justifyContent: 'center',
                          marginRight: 8,
                        }}>{dim.short}</span>
                        {dim.label}
                      </span>
                      <span className="ps-adkar-score-val" style={{ color: scoreColor(val) }}>{val}/100</span>
                    </div>
                    <div className="ps-adkar-bar-track">
                      <div
                        className="ps-adkar-bar-fill"
                        style={{ width: `${val}%`, background: dim.color }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{dim.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right: ADKAR Dimension Heatmap */}
        <div className="ps-card">
          <div className="ps-card-header">
            <span className="ps-card-title"><Icon name="bi-grid-3x3-gap" /> Dimension Heatmap</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>All divisions</span>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '90px repeat(5, 1fr)', gap: 3, marginBottom: 4 }}>
              <div />
              {DIMENSIONS.map(d => (
                <div key={d.key} style={{ textAlign: 'center', padding: '4px 2px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>{d.short}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af', fontWeight: 400, marginTop: 1 }}>{d.label.slice(0, 5)}</div>
                </div>
              ))}
            </div>
            {/* Data rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {adkarScores.map(row => {
                const isSelected = row.division === selectedDiv
                return (
                  <div
                    key={row.division}
                    onClick={() => setSelectedDiv(row.division)}
                    style={{ display: 'grid', gridTemplateColumns: '90px repeat(5, 1fr)', gap: 3, cursor: 'pointer' }}
                  >
                    <div style={{
                      fontSize: 10, fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? '#007560' : '#6b7280',
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      paddingRight: 4,
                    }}>
                      {row.division}
                    </div>
                    {DIMENSIONS.map(d => {
                      const val = row[d.key as DimKey]
                      return (
                        <div
                          key={d.key}
                          title={`${row.division} — ${d.label}: ${val}`}
                          style={{
                            background: heatBg(val),
                            border: `1px solid ${isSelected ? 'rgba(0,117,96,0.45)' : heatBorder(val)}`,
                            borderRadius: 5,
                            height: 34,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            color: scoreColor(val),
                            transition: 'border-color 0.15s',
                          }}
                        >
                          {val}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
            {/* Legend */}
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid #e8e5de', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { bg: 'rgba(0,117,96,0.16)',   border: 'rgba(0,117,96,0.22)',   text: '#007560', label: '≥80 Strong'    },
                { bg: 'rgba(202,138,4,0.15)',   border: 'rgba(202,138,4,0.22)', text: '#ca8a04', label: '65–79 Progress' },
                { bg: 'rgba(220,38,38,0.12)',   border: 'rgba(220,38,38,0.2)',  text: '#dc2626', label: '<65 Focus'      },
              ].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#6b7280' }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, background: l.bg, border: `1px solid ${l.border}`, flexShrink: 0 }} />
                  <span style={{ color: l.text, fontWeight: 600 }}>{l.label}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>}
    </div>
  )
}
