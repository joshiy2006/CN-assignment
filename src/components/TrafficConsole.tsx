// ─── Traffic Console Card ──────────────────────────────────────────────────────
import React from 'react'
import {
  Play, Pause, RotateCcw, Send, ArrowRight, Info,
} from 'lucide-react'
import type { SimSnapshot, TrafficPattern, SimSpeed, Algorithm } from '../engine/types'
import type { SimControls } from '../hooks/useSimulator'

interface Props {
  snapshot: SimSnapshot
  controls: SimControls
}

// Tooltip-style info icon
function InfoIcon({ tip }: { tip: string }) {
  return (
    <span title={tip} style={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>
      <Info size={12} color="#94a3b8" />
    </span>
  )
}

const PATTERN_LABELS: Record<TrafficPattern, string> = {
  bursty:       'bursty',
  steady:       'steady',
  'window-edge':'window-edge attack',
  manual:       'manual only',
}

export default function TrafficConsole({ snapshot, controls }: Props) {
  const { toggleRunning, reset, sendRequests, setParams } = controls

  const inputStyle: React.CSSProperties = {
    border: '1px solid #e5e9f0',
    borderRadius: 12,
    padding: '8px 12px',
    fontSize: 14,
    color: '#0f172a',
    width: '100%',
    background: '#fff',
    outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif',
    appearance: 'none',
    WebkitAppearance: 'none',
  }

  const outlinedBtnStyle: React.CSSProperties = {
    border: '1px solid #e5e9f0',
    borderRadius: 12,
    padding: '10px 0',
    fontSize: 14,
    fontWeight: 600,
    color: '#475569',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'background 0.12s',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  }

  const ruleBox = snapshot.algorithm === 'token'
    ? {
        rule: 'allow if tokens ≥ 1, then subtract 1; refill by rate × Δt up to capacity',
        tryThis: 'Pause, wait for a full bucket, then send a burst. Resume with high input to watch spare burst budget turn into steady rejection.',
      }
    : {
        rule: 'enqueue until capacity; serve queue at rate × Δt; reject only when queue is full',
        tryThis: 'Send a burst larger than the queue, then watch accepted requests drain at a constant pace while overflow is rejected.',
      }

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Title */}
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Traffic console</div>
        <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
          Run patterns or inject bursts manually.
        </div>
      </div>

      {/* Button Grid 2×2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {/* Run / Pause */}
        <button
          onClick={toggleRunning}
          aria-label={snapshot.running ? 'Pause simulation' : 'Run simulation'}
          style={{
            ...outlinedBtnStyle,
            background: '#10e08f',
            color: '#064e3b',
            border: 'none',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0bcf82')}
          onMouseLeave={e => (e.currentTarget.style.background = '#10e08f')}
        >
          {snapshot.running ? <Pause size={15} /> : <Play size={15} />}
          {snapshot.running ? 'Pause' : 'Run'}
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          aria-label="Reset simulation"
          style={outlinedBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <RotateCcw size={14} />
          Reset
        </button>

        {/* Send 1 */}
        <button
          onClick={() => sendRequests(1)}
          aria-label="Send 1 request"
          style={outlinedBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <Send size={14} />
          Send 1
        </button>

        {/* Burst 8 */}
        <button
          onClick={() => sendRequests(8)}
          aria-label="Send burst of 8 requests"
          style={outlinedBtnStyle}
          onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
          onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
        >
          <ArrowRight size={14} />
          Burst 8
        </button>
      </div>

      {/* Traffic Pattern */}
      <div>
        <label htmlFor="traffic-pattern" style={labelStyle}>
          traffic pattern
          <InfoIcon tip="bursty: clusters of requests; steady: evenly spaced; window-edge attack: bursts at window boundaries; manual only: no automatic traffic" />
        </label>
        <div style={{ position: 'relative' }}>
          <select
            id="traffic-pattern"
            value={snapshot.pattern}
            onChange={e => setParams({ pattern: e.target.value as TrafficPattern })}
            style={{ ...inputStyle, paddingRight: 32, cursor: 'pointer' }}
          >
            <option value="bursty">bursty</option>
            <option value="steady">steady</option>
            <option value="window-edge">window-edge attack</option>
            <option value="manual">manual only</option>
          </select>
          <div style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none'
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </div>
        </div>
      </div>

      {/* Simulation Speed */}
      <div>
        <label htmlFor="sim-speed" style={labelStyle}>
          simulation speed
          <InfoIcon tip="Speed multiplier: 1x = real time, 2x = twice as fast, etc." />
        </label>
        <div style={{ position: 'relative' }}>
          <select
            id="sim-speed"
            value={snapshot.speed}
            onChange={e => setParams({ speed: parseFloat(e.target.value) as SimSpeed })}
            style={{ ...inputStyle, paddingRight: 32, cursor: 'pointer' }}
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
          <div style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none'
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </div>
        </div>
      </div>

      {/* Capacity + Rate */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label htmlFor="capacity" style={labelStyle}>
            capacity / limit
            <InfoIcon tip="Token bucket capacity or leaky bucket queue size" />
          </label>
          <input
            id="capacity"
            type="number"
            min="1"
            step="1"
            value={snapshot.capacity}
            onChange={e => {
              const v = Math.max(1, Math.round(parseFloat(e.target.value) || 1))
              setParams({ capacity: v })
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="rate" style={labelStyle}>
            rate / second
            <InfoIcon tip="Token refill rate (token bucket) or drain rate (leaky bucket)" />
          </label>
          <input
            id="rate"
            type="number"
            min="0.1"
            step="0.5"
            value={snapshot.rate}
            onChange={e => {
              const v = Math.max(0, parseFloat(e.target.value) || 0)
              setParams({ rate: v })
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Window Seconds + Input Req/s */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label htmlFor="window-seconds" style={labelStyle}>
            window seconds
            <InfoIcon tip="Window size used by window-edge attack pattern" />
          </label>
          <input
            id="window-seconds"
            type="number"
            min="1"
            step="1"
            value={snapshot.windowSeconds}
            onChange={e => {
              const v = Math.max(1, parseFloat(e.target.value) || 1)
              setParams({ windowSeconds: v })
            }}
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="input-rate" style={labelStyle}>
            input req / second
            <InfoIcon tip="Average offered load for bursty/steady patterns" />
          </label>
          <input
            id="input-rate"
            type="number"
            min="0.1"
            step="0.5"
            value={snapshot.inputRate}
            onChange={e => {
              const v = Math.max(0, parseFloat(e.target.value) || 0)
              setParams({ inputRate: v })
            }}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Rule + Try This */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e5e9f0',
          borderRadius: 16,
          padding: '16px',
        }}
      >
        <div style={{ fontSize: 13, marginBottom: 10, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Rule:&nbsp;</span>
          <span style={{ color: '#64748b' }}>{ruleBox.rule}</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>Try this&nbsp;</span>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.6 }}>
          {ruleBox.tryThis}
        </div>
      </div>
    </div>
  )
}
