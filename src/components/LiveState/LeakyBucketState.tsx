// ─── Leaky Bucket Live State Panel ────────────────────────────────────────────
import React from 'react'
import type { LeakyBucketSnapshot } from '../../engine/types'

interface Props {
  state: LeakyBucketSnapshot
  t: number
}

// Stacked-waves SVG icon (amber)
function WavesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 12c.6.5 1.2 1 2.5 1C7 13 7 11 9.5 11c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
      <path d="M2 18c.6.5 1.2 1 2.5 1C7 19 7 17 9.5 17c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>
    </svg>
  )
}

export default function LeakyBucketState({ state, t }: Props) {
  const { queued, capacity, rate, served } = state
  const slots = Array.from({ length: capacity }, (_, i) => i < queued)

  return (
    <div
      className="panel"
      style={{
        flex: '0 0 55%',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.06em', marginBottom: 2 }}>
            live state
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Leaky Bucket</div>
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#64748b',
            border: '1px solid #e2e8f0',
            borderRadius: 999,
            padding: '3px 10px',
            fontVariantNumeric: 'tabular-nums',
            background: '#fff',
          }}
        >
          t&nbsp;=&nbsp;{t.toFixed(1)}s
        </div>
      </div>

      {/* Queue slots */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          alignItems: 'center',
        }}
        role="img"
        aria-label={`Leaky bucket queue: ${queued} of ${capacity} slots occupied`}
      >
        {slots.map((occupied, i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: occupied ? '1.5px solid #f0a94b' : '1.5px solid #e2e8f0',
              background: occupied ? '#fcd9a6' : '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, border-color 0.15s',
              flexShrink: 0,
            }}
          >
            {occupied && (
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#f59e0b',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Status line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: '#64748b',
          fontWeight: 500,
        }}
      >
        <WavesIcon />
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {queued} queued&nbsp;·&nbsp;{rate}/s steady drain&nbsp;·&nbsp;{served} served
        </span>
      </div>
    </div>
  )
}
