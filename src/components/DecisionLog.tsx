// ─── Decision Log Panel ────────────────────────────────────────────────────────
import React from 'react'
import { Sparkles } from 'lucide-react'
import type { DecisionEntry } from '../engine/types'

interface Props {
  decisions: DecisionEntry[]
}

function Badge({ type }: { type: DecisionEntry['type'] }) {
  const cls = {
    allowed:  'badge-allowed',
    queued:   'badge-queued',
    served:   'badge-served',
    rejected: 'badge-rejected',
  }[type]
  return <span className={cls}>{type}</span>
}

export default function DecisionLog({ decisions }: Props) {
  return (
    <div
      className="panel"
      style={{
        flex: '0 0 45%',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Sparkles size={14} color="#64748b" />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
          Why the last decisions happened
        </span>
      </div>

      {/* Content */}
      <div
        aria-live="polite"
        aria-label="Decision log"
        style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}
      >
        {decisions.length === 0 ? (
          <div style={{ fontSize: 13, color: '#94a3b8', paddingTop: 4 }}>
            Send traffic to make the limiter speak.
          </div>
        ) : (
          decisions.map(d => (
            <div
              key={d.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
                borderRadius: 10,
                padding: '7px 12px',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                {d.reason}
              </span>
              <Badge type={d.type} />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
