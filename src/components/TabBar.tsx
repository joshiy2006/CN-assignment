// ─── Tab Bar Component ─────────────────────────────────────────────────────────
import React from 'react'

export type ActiveTab = 'token' | 'leaky' | 'compare'

interface Tab {
  id: ActiveTab
  label: string
}

const TABS: Tab[] = [
  { id: 'token',   label: 'Token Bucket' },
  { id: 'leaky',   label: 'Leaky Bucket' },
  { id: 'compare', label: 'Compare Algorithms' },
]

interface Props {
  active: ActiveTab
  onChange: (tab: ActiveTab) => void
}

export default function TabBar({ active, onChange }: Props) {
  return (
    <div
      className="card"
      style={{
        padding: '8px',
        marginBottom: 24,
        borderRadius: 24,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              aria-label={tab.label}
              aria-pressed={isActive}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
                background: isActive ? '#10e08f' : 'transparent',
                color: isActive ? '#064e3b' : '#475569',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
