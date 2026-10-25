// ─── Tab Bar Component ─────────────────────────────────────────────────────────
import React from 'react'
import type { Algorithm } from '../engine/types'

interface Tab {
  id: Algorithm | 'fixed' | 'sliding'
  label: string
  disabled?: boolean
}

const TABS: Tab[] = [
  { id: 'token',   label: 'Token Bucket' },
  { id: 'leaky',   label: 'Leaky Bucket' },
  { id: 'fixed',   label: 'Fixed Window',       disabled: true },
  { id: 'sliding', label: 'Sliding Window Log',  disabled: true },
]

interface Props {
  active: Algorithm
  onChange: (alg: Algorithm) => void
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
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 4,
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === active
          const isDisabled = tab.disabled
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isDisabled && (tab.id === 'token' || tab.id === 'leaky')) {
                  onChange(tab.id)
                }
              }}
              title={isDisabled ? 'Coming soon' : undefined}
              aria-label={tab.label}
              disabled={isDisabled}
              style={{
                padding: '10px 16px',
                borderRadius: 20,
                border: 'none',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, system-ui, sans-serif',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                textAlign: 'left',
                transition: 'background 0.15s, color 0.15s',
                background: isActive ? '#10e08f' : 'transparent',
                color: isActive
                  ? '#064e3b'
                  : isDisabled
                  ? '#94a3b8'
                  : '#475569',
                opacity: isDisabled ? 0.5 : 1,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isActive && !isDisabled) {
                  ;(e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'
                }
              }}
              onMouseLeave={e => {
                if (!isActive && !isDisabled) {
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
