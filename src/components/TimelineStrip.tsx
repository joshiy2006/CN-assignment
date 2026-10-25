// ─── Timeline Strip ────────────────────────────────────────────────────────────
import React, { useMemo } from 'react'
import type { TimelineEvent, Algorithm } from '../engine/types'

interface Props {
  events: TimelineEvent[]
  currentT: number
  algorithm: Algorithm
}

const WINDOW = 10   // seconds of history shown
const STRIP_HEIGHT = 36
const BAR_W = 5
const BAR_H = 14

function getBarColor(type: TimelineEvent['type'], algorithm: Algorithm): string {
  if (type === 'rejected') return '#ef4444'
  if (algorithm === 'token') {
    return '#10b981'  // green for allowed
  } else {
    // Leaky bucket
    if (type === 'enqueued') return '#0ea5e9'  // blue
    if (type === 'served')   return '#f59e0b'  // amber
    return '#10b981'
  }
}

export default function TimelineStrip({ events, currentT, algorithm }: Props) {
  const gridLines = [-8, -6, -4, -2]
  const axisLabels = ['-10s', '-8s', '-6s', '-4s', '-2s', '-0s']

  // Position events: right edge = "now", left edge = now - 10s
  const bars = useMemo(() => {
    return events.map(e => {
      const age = currentT - e.t  // seconds ago
      const pct = (1 - age / WINDOW) * 100  // percent from left
      return { ...e, pct }
    }).filter(e => e.pct >= 0 && e.pct <= 100)
  }, [events, currentT])

  return (
    <div style={{ marginBottom: 8 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500, letterSpacing: '0.06em' }}>
          last 10 simulated seconds
        </span>
        <span
          style={{
            fontSize: 12,
            color: '#64748b',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {currentT.toFixed(1)}s
        </span>
      </div>

      {/* Strip */}
      <div
        style={{
          height: STRIP_HEIGHT,
          border: '1px solid #e5e9f0',
          borderRadius: 8,
          background: '#f8fafc',
          position: 'relative',
          overflow: 'hidden',
        }}
        role="img"
        aria-label={`Timeline of last 10 seconds, ${bars.length} events shown`}
      >
        {/* Grid lines */}
        {gridLines.map(offset => {
          const pct = (1 - Math.abs(offset) / WINDOW) * 100
          return (
            <div
              key={offset}
              style={{
                position: 'absolute',
                left: `${pct}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: '#e2e8f0',
              }}
            />
          )
        })}

        {/* Event bars */}
        {bars.map(bar => (
          <div
            key={bar.id}
            style={{
              position: 'absolute',
              left: `calc(${bar.pct}% - ${BAR_W / 2}px)`,
              bottom: (STRIP_HEIGHT - BAR_H) / 2,
              width: BAR_W,
              height: BAR_H,
              borderRadius: 3,
              background: getBarColor(bar.type, algorithm),
              opacity: 0.85,
            }}
          />
        ))}
      </div>

      {/* Axis labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 4,
        }}
      >
        {axisLabels.map(label => (
          <span
            key={label}
            style={{
              fontSize: 10,
              color: '#94a3b8',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
