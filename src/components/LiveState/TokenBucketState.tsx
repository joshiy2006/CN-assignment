// ─── Token Bucket Live State Panel ────────────────────────────────────────────
import React from 'react'
import type { TokenBucketSnapshot } from '../../engine/types'

interface Props {
  state: TokenBucketSnapshot
  t: number
}

export default function TokenBucketState({ state, t }: Props) {
  const { tokens, capacity, rate } = state
  const fillPct = Math.min(1, tokens / capacity) * 100
  const dotCount = Math.floor(tokens)

  // Layout dots in rows of 4 from bottom
  const rows: number[] = []
  let remaining = dotCount
  while (remaining > 0) {
    const rowSize = Math.min(4, remaining)
    rows.unshift(rowSize)
    remaining -= rowSize
  }

  const headroom = Math.floor(tokens)

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
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Token Bucket</div>
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

      {/* Content: bucket + stats */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Bucket graphic */}
        <div
          style={{
            width: 92,
            height: 105,
            flexShrink: 0,
            border: '2px solid #7ba5f2',
            borderRadius: 14,
            background: '#f0f6ff',
            position: 'relative',
            overflow: 'hidden',
          }}
          role="img"
          aria-label={`Token bucket: ${tokens.toFixed(2)} of ${capacity} tokens`}
        >
          {/* Water fill */}
          <div
            className="token-fill"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${fillPct}%`,
              background: '#bcd4fb',
              borderRadius: '0 0 12px 12px',
            }}
          />

          {/* Token dots */}
          <div
            style={{
              position: 'absolute',
              bottom: 6,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {rows.map((rowSize, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                {Array.from({ length: rowSize }).map((_, j) => (
                  <div
                    key={j}
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#2f6fed',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>tokens</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {tokens.toFixed(2)}&nbsp;/&nbsp;{capacity}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>refill</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
              {rate}/s
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 1 }}>burst headroom</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
              {headroom}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
