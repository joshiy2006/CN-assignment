// ─── Request Lane (Particle Animation) ────────────────────────────────────────
import React from 'react'
import type { ParticleData } from '../hooks/useSimulator'

interface Props {
  particles: ParticleData[]
  algorithm: 'token' | 'leaky'
}

const COLOR_MAP = {
  blue:  '#3b82f6',
  amber: '#f59e0b',
  red:   '#d6155a',
}

export default function RequestLane({ particles }: Props) {
  return (
    <div
      style={{
        height: 56,
        border: '1px solid #e5e9f0',
        borderRadius: 14,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        marginBottom: 16,
        background: '#ffffff',
        overflow: 'hidden',
      }}
      aria-label="Request particle lane"
    >
      {/* Labels */}
      <span
        style={{
          fontSize: 11,
          color: '#94a3b8',
          fontWeight: 500,
          letterSpacing: '0.06em',
          zIndex: 2,
          background: '#fff',
          paddingRight: 8,
          userSelect: 'none',
        }}
      >
        clients
      </span>

      {/* Center line */}
      <div
        style={{
          flex: 1,
          height: 1,
          background: '#e2e8f0',
          position: 'relative',
        }}
      >
        {/* Particles */}
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{ background: COLOR_MAP[p.color] }}
          />
        ))}
      </div>

      <span
        style={{
          fontSize: 11,
          color: '#94a3b8',
          fontWeight: 500,
          letterSpacing: '0.06em',
          zIndex: 2,
          background: '#fff',
          paddingLeft: 8,
          userSelect: 'none',
        }}
      >
        limiter
      </span>
    </div>
  )
}
