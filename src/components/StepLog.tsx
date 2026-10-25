// ─── Step-by-Step Event Log ────────────────────────────────────────────────────
import React, { useRef, useEffect, useState } from 'react'
import { List, Trash2 } from 'lucide-react'
import type { LogEvent } from '../engine/types'

interface Props {
  events: LogEvent[]
  onClear: () => void
}

const TYPE_CONFIG = {
  allowed: {
    badgeClass: 'badge-allowed',
    label: 'allowed',
    dotColor: '#10e08f',
    rowBg: '#f0fdf4',
    rowBorder: '#bbf7d0',
  },
  queued: {
    badgeClass: 'badge-queued',
    label: 'queued',
    dotColor: '#10e08f',
    rowBg: '#f0fdf4',
    rowBorder: '#bbf7d0',
  },
  served: {
    badgeClass: 'badge-served',
    label: 'served',
    dotColor: '#f59e0b',
    rowBg: '#fffbeb',
    rowBorder: '#fde68a',
  },
  rejected: {
    badgeClass: 'badge-rejected',
    label: 'rejected',
    dotColor: '#d6155a',
    rowBg: '#fff1f4',
    rowBorder: '#fecdd3',
  },
}

function formatContext(e: LogEvent): string {
  if (e.tokensAfter !== undefined) {
    return `tokens remaining: ${e.tokensAfter.toFixed(2)}`
  }
  if (e.queueAfter !== undefined) {
    return `queue length: ${e.queueAfter}`
  }
  return ''
}

function LogRow({ event, index }: { event: LogEvent; index: number }) {
  const cfg = TYPE_CONFIG[event.type]
  const context = formatContext(event)
  const algoLabel = event.algorithm === 'token' ? 'Token Bucket' : 'Leaky Bucket'

  return (
    <div
      className={index === 0 ? 'log-entry-animate' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: '60px 90px minmax(0,1fr) minmax(0,1.2fr) auto',
        gap: 10,
        alignItems: 'center',
        padding: '7px 14px',
        borderBottom: '1px solid #f1f5f9',
        background: index % 2 === 0 ? '#fff' : '#fafbfc',
        fontSize: 13,
        transition: 'background 0.1s',
      }}
    >
      {/* Time */}
      <span style={{ color: '#94a3b8', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
        {event.t.toFixed(2)}s
      </span>

      {/* Algorithm pill */}
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: event.algorithm === 'token' ? '#1d4ed8' : '#92400e',
          background: event.algorithm === 'token' ? '#eff6ff' : '#fffbeb',
          border: `1px solid ${event.algorithm === 'token' ? '#bfdbfe' : '#fde68a'}`,
          borderRadius: 999,
          padding: '2px 8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {algoLabel}
      </span>

      {/* Reason */}
      <span style={{ color: '#334155', fontWeight: 500 }}>
        {event.reason}
      </span>

      {/* Context */}
      <span style={{ color: '#94a3b8', fontSize: 12 }}>
        {context}
      </span>

      {/* Status badge */}
      <span className={cfg.badgeClass}>
        {cfg.label}
      </span>
    </div>
  )
}

export default function StepLog({ events, onClear }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [pinnedEvents, setPinnedEvents] = useState<LogEvent[]>([])
  const userScrolled = useRef(false)

  // When not paused, sync displayed list with live events
  const displayed = paused ? pinnedEvents : events

  // Auto-scroll to top when new events arrive (newest first = top)
  useEffect(() => {
    if (!paused && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events.length, paused])

  const handlePause = () => {
    if (!paused) {
      setPinnedEvents([...events])
    }
    setPaused(p => !p)
  }

  const counts = {
    allowed: displayed.filter(e => e.type === 'allowed').length,
    queued:  displayed.filter(e => e.type === 'queued').length,
    served:  displayed.filter(e => e.type === 'served').length,
    rejected: displayed.filter(e => e.type === 'rejected').length,
  }

  return (
    <div
      className="card"
      style={{ marginTop: 16, overflow: 'hidden' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px 14px',
          borderBottom: '1px solid #f1f5f9',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <List size={17} color="#64748b" />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
            Step-by-step event log
          </span>
          {events.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#94a3b8',
              background: '#f1f5f9', borderRadius: 999,
              padding: '2px 9px', marginLeft: 4,
            }}>
              {events.length} events
            </span>
          )}
        </div>

        {/* Summary pills + controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Summary counts */}
          {events.length > 0 && (
            <div style={{ display: 'flex', gap: 6 }}>
              {counts.allowed > 0 && (
                <span className="badge-allowed">{counts.allowed} allowed</span>
              )}
              {counts.queued > 0 && (
                <span className="badge-queued">{counts.queued} queued</span>
              )}
              {counts.served > 0 && (
                <span className="badge-served">{counts.served} served</span>
              )}
              {counts.rejected > 0 && (
                <span className="badge-rejected">{counts.rejected} rejected</span>
              )}
            </div>
          )}

          {/* Pause/resume scroll */}
          <button
            onClick={handlePause}
            title={paused ? 'Resume live updates' : 'Freeze log'}
            style={{
              border: '1px solid #e5e9f0',
              borderRadius: 8,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              color: paused ? '#064e3b' : '#64748b',
              background: paused ? '#d1fae5' : '#fff',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
          >
            {paused ? '▶ Resume' : '⏸ Freeze'}
          </button>

          {/* Clear */}
          <button
            onClick={onClear}
            title="Clear log"
            aria-label="Clear step log"
            style={{
              border: '1px solid #e5e9f0',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 12,
              color: '#94a3b8',
              background: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#d6155a'
              e.currentTarget.style.color = '#d6155a'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#e5e9f0'
              e.currentTarget.style.color = '#94a3b8'
            }}
          >
            <Trash2 size={13} />
            Clear
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 90px minmax(0,1fr) minmax(0,1.2fr) auto',
          gap: 10,
          padding: '6px 14px',
          background: '#f8fafc',
          borderBottom: '1px solid #e5e9f0',
        }}
      >
        {['Time', 'Algorithm', 'Event', 'Context', 'Status'].map(h => (
          <span key={h} className="label-xs">{h}</span>
        ))}
      </div>

      {/* Log rows */}
      <div
        ref={scrollRef}
        style={{
          maxHeight: 320,
          overflowY: 'auto',
        }}
        aria-live={paused ? 'off' : 'polite'}
        aria-label="Step-by-step event log"
      >
        {displayed.length === 0 ? (
          <div
            style={{
              padding: '40px 22px',
              textAlign: 'center',
              color: '#94a3b8',
              fontSize: 14,
            }}
          >
            Events will appear here once traffic starts. Press <strong>Run</strong> to begin.
          </div>
        ) : (
          displayed.map((e, i) => (
            <LogRow key={e.id} event={e} index={i} />
          ))
        )}
      </div>
    </div>
  )
}
