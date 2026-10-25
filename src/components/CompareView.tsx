// ─── Compare View: Token Bucket vs Leaky Bucket side-by-side ──────────────────
// Two fully independent SimEngine instances, shared traffic pattern + params.

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, RotateCcw, Send, ArrowRight, GitCompare } from 'lucide-react'
import { SimEngine } from '../engine'
import type { SimSnapshot, TrafficPattern, SimSpeed } from '../engine/types'
import type { ParticleData } from '../hooks/useSimulator'
import TokenBucketState from './LiveState/TokenBucketState'
import LeakyBucketState from './LiveState/LeakyBucketState'
import RequestLane from './RequestLane'
import TimelineStrip from './TimelineStrip'

// ── Two dedicated engine instances ────────────────────────────────────────────
const tokenEngine = new SimEngine()
const leakyEngine = new SimEngine()

tokenEngine.setParams({ algorithm: 'token' })
leakyEngine.setParams({ algorithm: 'leaky' })

let _pid = 0

interface PanelState {
  snapshot: SimSnapshot
  particles: ParticleData[]
}

// ── Shared control state ──────────────────────────────────────────────────────
interface SharedParams {
  pattern: TrafficPattern
  speed: SimSpeed
  capacity: number
  rate: number
  inputRate: number
}

// ── Mini stat bar ──────────────────────────────────────────────────────────────
function MiniStats({ snap }: { snap: SimSnapshot }) {
  const pct = snap.generated > 0
    ? `${Math.round((snap.accepted / snap.generated) * 100)}%`
    : '—'
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[
        { label: 'GEN', val: String(snap.generated), color: '#0f172a' },
        { label: 'OK', val: String(snap.accepted), color: '#10e08f' },
        { label: 'REJ', val: String(snap.rejected), color: '#d6155a' },
        { label: 'RATE', val: pct, color: '#0f172a' },
      ].map(s => (
        <div
          key={s.label}
          style={{
            border: '1px solid #e5e9f0', borderRadius: 10,
            padding: '6px 10px', minWidth: 52, textAlign: 'center',
            background: '#fff',
          }}
        >
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            {s.label}
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
            {s.val}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Single algorithm panel ─────────────────────────────────────────────────────
function AlgoPanel({
  eng,
  title,
  accentColor,
  borderColor,
  panel,
  onSend,
}: {
  eng: SimEngine
  title: string
  accentColor: string
  borderColor: string
  panel: PanelState
  onSend: (n: number) => void
}) {
  const { snapshot: snap, particles } = panel

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        border: `2px solid ${borderColor}`,
        borderRadius: 20,
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #f1f5f9',
          background: `${accentColor}10`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</span>
          <span style={{
            fontSize: 12, fontWeight: 600, color: '#64748b',
            border: '1px solid #e2e8f0', borderRadius: 999,
            padding: '2px 10px', fontVariantNumeric: 'tabular-nums',
            background: '#fff',
          }}>
            t&nbsp;=&nbsp;{snap.t.toFixed(1)}s
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <MiniStats snap={snap} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Request lane */}
        <RequestLane particles={particles} algorithm={snap.algorithm} />

        {/* Live state */}
        <div style={{ minHeight: 140 }}>
          {snap.algorithm === 'token'
            ? <TokenBucketState state={snap.tokenBucket} t={snap.t} standalone />
            : <LeakyBucketState state={snap.leakyBucket} t={snap.t} standalone />
          }
        </div>

        {/* Timeline */}
        <TimelineStrip events={snap.timeline} currentT={snap.t} algorithm={snap.algorithm} />

        {/* Manual inject */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => onSend(1)}
            style={{
              flex: 1, border: '1px solid #e5e9f0', borderRadius: 10,
              padding: '7px 0', fontSize: 13, fontWeight: 600,
              color: '#475569', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <Send size={13} /> Send 1
          </button>
          <button
            onClick={() => onSend(8)}
            style={{
              flex: 1, border: '1px solid #e5e9f0', borderRadius: 10,
              padding: '7px 0', fontSize: 13, fontWeight: 600,
              color: '#475569', background: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              fontFamily: 'inherit',
            }}
          >
            <ArrowRight size={13} /> Burst 8
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Difference insight bar ─────────────────────────────────────────────────────
function InsightBar({ tokenSnap, leakySnap }: { tokenSnap: SimSnapshot; leakySnap: SimSnapshot }) {
  const tPct = tokenSnap.generated > 0
    ? Math.round((tokenSnap.accepted / tokenSnap.generated) * 100) : 0
  const lPct = leakySnap.generated > 0
    ? Math.round((leakySnap.accepted / leakySnap.generated) * 100) : 0
  const diff = tPct - lPct

  if (tokenSnap.generated === 0 && leakySnap.generated === 0) return null

  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e5e9f0',
        borderRadius: 14,
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        fontSize: 13,
      }}
    >
      <span style={{ color: '#64748b', fontWeight: 500 }}>
        📊 <strong style={{ color: '#0f172a' }}>Live comparison:</strong>
      </span>
      <span>
        Token Bucket accept rate: <strong style={{ color: '#10e08f' }}>{tPct}%</strong>
      </span>
      <span style={{ color: '#cbd5e1' }}>|</span>
      <span>
        Leaky Bucket accept rate: <strong style={{ color: '#f59e0b' }}>{lPct}%</strong>
      </span>
      {Math.abs(diff) >= 2 && (
        <>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <span style={{ color: '#64748b' }}>
            Token Bucket is <strong style={{ color: diff > 0 ? '#10e08f' : '#d6155a' }}>
              {Math.abs(diff)}% {diff > 0 ? 'more' : 'less'} permissive
            </strong> under this traffic pattern.
          </span>
        </>
      )}
    </div>
  )
}

// ── Main CompareView ───────────────────────────────────────────────────────────
export default function CompareView() {
  const [running, setRunning] = useState(false)
  const [params, setParamsState] = useState<SharedParams>({
    pattern: 'bursty',
    speed: 1,
    capacity: 8,
    rate: 4,
    inputRate: 3,
  })

  const [tokenPanel, setTokenPanel] = useState<PanelState>({
    snapshot: tokenEngine.snapshot(),
    particles: [],
  })
  const [leakyPanel, setLeakyPanel] = useState<PanelState>({
    snapshot: leakyEngine.snapshot(),
    particles: [],
  })

  const rafRef = useRef<number>(0)
  const lastRealRef = useRef<number | null>(null)

  // Apply params to both engines
  const applyParams = useCallback((p: SharedParams) => {
    tokenEngine.setParams({
      algorithm: 'token',
      pattern: p.pattern,
      speed: p.speed,
      capacity: p.capacity,
      rate: p.rate,
      inputRate: p.inputRate,
    })
    leakyEngine.setParams({
      algorithm: 'leaky',
      pattern: p.pattern,
      speed: p.speed,
      capacity: p.capacity,
      rate: p.rate,
      inputRate: p.inputRate,
    })
  }, [])

  useEffect(() => {
    applyParams(params)
  }, [params, applyParams])

  // RAF loop
  const loop = useCallback((now: number) => {
    const tSnap = tokenEngine.snapshot()

    if (tSnap.running) {
      if (lastRealRef.current !== null) {
        const realDt = (now - lastRealRef.current) / 1000
        const simDt = realDt * params.speed

        // Step token engine
        const tbefore = tokenEngine.snapshot()
        tokenEngine.step(simDt)
        const tafter = tokenEngine.snapshot()

        // Step leaky engine
        const lbefore = leakyEngine.snapshot()
        leakyEngine.step(simDt)
        const lafter = leakyEngine.snapshot()

        // Spawn particles
        const newTP: ParticleData[] = []
        const tAcc = tafter.accepted - tbefore.accepted
        const tRej = tafter.rejected - tbefore.rejected
        for (let i = 0; i < tAcc; i++) newTP.push({ id: ++_pid, color: 'blue', startedAt: now })
        for (let i = 0; i < tRej; i++) newTP.push({ id: ++_pid, color: 'red', startedAt: now })

        const newLP: ParticleData[] = []
        const lAcc = lafter.accepted - lbefore.accepted
        const lRej = lafter.rejected - lbefore.rejected
        for (let i = 0; i < lAcc; i++) newLP.push({ id: ++_pid, color: 'amber', startedAt: now })
        for (let i = 0; i < lRej; i++) newLP.push({ id: ++_pid, color: 'red', startedAt: now })

        setTokenPanel(prev => ({
          snapshot: tafter,
          particles: [...prev.particles, ...newTP].filter(p => now - p.startedAt < 1100),
        }))
        setLeakyPanel(prev => ({
          snapshot: lafter,
          particles: [...prev.particles, ...newLP].filter(p => now - p.startedAt < 1100),
        }))
      }
      lastRealRef.current = now
    } else {
      lastRealRef.current = null
      // Prune stale particles
      setTokenPanel(prev => ({ ...prev, particles: prev.particles.filter(p => now - p.startedAt < 1100) }))
      setLeakyPanel(prev => ({ ...prev, particles: prev.particles.filter(p => now - p.startedAt < 1100) }))
    }

    rafRef.current = requestAnimationFrame(loop)
  }, [params.speed])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [loop])

  const handleToggle = () => {
    if (running) {
      tokenEngine.stop()
      leakyEngine.stop()
    } else {
      tokenEngine.start()
      leakyEngine.start()
    }
    setRunning(r => !r)
    setTokenPanel(prev => ({ ...prev, snapshot: tokenEngine.snapshot() }))
    setLeakyPanel(prev => ({ ...prev, snapshot: leakyEngine.snapshot() }))
  }

  const handleReset = () => {
    tokenEngine.stop()
    leakyEngine.stop()
    tokenEngine.reset()
    leakyEngine.reset()
    applyParams(params)
    setRunning(false)
    lastRealRef.current = null
    setTokenPanel({ snapshot: tokenEngine.snapshot(), particles: [] })
    setLeakyPanel({ snapshot: leakyEngine.snapshot(), particles: [] })
  }

  const handleSend = (eng: SimEngine, setState: typeof setTokenPanel, color: 'blue' | 'amber', n: number) => {
    const before = eng.snapshot()
    eng.send(n)
    const after = eng.snapshot()
    const now = performance.now()
    const acc = after.accepted - before.accepted
    const rej = after.rejected - before.rejected
    const newP: ParticleData[] = []
    for (let i = 0; i < acc; i++) newP.push({ id: ++_pid, color, startedAt: now })
    for (let i = 0; i < rej; i++) newP.push({ id: ++_pid, color: 'red', startedAt: now })
    setState(prev => ({ snapshot: after, particles: [...prev.particles, ...newP] }))
  }

  const updateParam = (patch: Partial<SharedParams>) => {
    setParamsState(p => ({ ...p, ...patch }))
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #e5e9f0', borderRadius: 10,
    padding: '7px 10px', fontSize: 13, color: '#0f172a',
    width: '100%', background: '#fff', outline: 'none',
    fontFamily: 'Inter, system-ui, sans-serif', appearance: 'none',
    WebkitAppearance: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: '#64748b',
    marginBottom: 4, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase',
  }

  return (
    <div>
      {/* Page header */}
      <div
        className="card"
        style={{ padding: '20px 24px', marginBottom: 20 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <GitCompare size={18} color="#10e08f" />
              <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
                Token Bucket vs Leaky Bucket
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Both algorithms run simultaneously with identical traffic. Watch how they differ in acceptance and smoothing.
            </p>
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Run/Pause */}
            <button
              onClick={handleToggle}
              style={{
                border: 'none', borderRadius: 12, padding: '9px 20px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                background: '#10e08f', color: '#064e3b',
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: 'inherit', transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0bcf82')}
              onMouseLeave={e => (e.currentTarget.style.background = '#10e08f')}
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? 'Pause' : 'Run Both'}
            </button>
            <button
              onClick={handleReset}
              style={{
                border: '1px solid #e5e9f0', borderRadius: 12, padding: '9px 16px',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                color: '#475569', background: '#fff',
                display: 'flex', alignItems: 'center', gap: 7,
                fontFamily: 'inherit',
              }}
            >
              <RotateCcw size={14} /> Reset Both
            </button>

            {/* Pattern */}
            <div style={{ position: 'relative' }}>
              <select
                value={params.pattern}
                onChange={e => updateParam({ pattern: e.target.value as TrafficPattern })}
                style={{ ...inputStyle, width: 160, paddingRight: 28 }}
              >
                <option value="bursty">bursty</option>
                <option value="steady">steady</option>
                <option value="window-edge">window-edge attack</option>
                <option value="manual">manual only</option>
              </select>
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
              </div>
            </div>

            {/* Speed */}
            <div style={{ position: 'relative' }}>
              <select
                value={params.speed}
                onChange={e => updateParam({ speed: parseFloat(e.target.value) as SimSpeed })}
                style={{ ...inputStyle, width: 80, paddingRight: 28 }}
              >
                <option value="0.5">0.5x</option>
                <option value="1">1x</option>
                <option value="2">2x</option>
                <option value="4">4x</option>
              </select>
              <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <svg width="11" height="11" viewBox="0 0 12 12"><path d="M2 4l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
              </div>
            </div>
          </div>
        </div>

        {/* Shared param inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
          <div>
            <label style={labelStyle}>Capacity / limit</label>
            <input
              type="number" min="1" step="1" value={params.capacity}
              onChange={e => updateParam({ capacity: Math.max(1, Math.round(parseFloat(e.target.value) || 1)) })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Rate / second</label>
            <input
              type="number" min="0.1" step="0.5" value={params.rate}
              onChange={e => updateParam({ rate: Math.max(0, parseFloat(e.target.value) || 0) })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Input req / second</label>
            <input
              type="number" min="0.1" step="0.5" value={params.inputRate}
              onChange={e => updateParam({ inputRate: Math.max(0, parseFloat(e.target.value) || 0) })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Insight bar */}
        <div style={{ marginTop: 14 }}>
          <InsightBar tokenSnap={tokenPanel.snapshot} leakySnap={leakyPanel.snapshot} />
        </div>
      </div>

      {/* Side-by-side panels */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }} className="compare-panels">
        <AlgoPanel
          eng={tokenEngine}
          title="Token Bucket"
          accentColor="#10e08f"
          borderColor="#bbf7d0"
          panel={tokenPanel}
          onSend={(n) => handleSend(tokenEngine, setTokenPanel, 'blue', n)}
        />
        <AlgoPanel
          eng={leakyEngine}
          title="Leaky Bucket"
          accentColor="#f59e0b"
          borderColor="#fde68a"
          panel={leakyPanel}
          onSend={(n) => handleSend(leakyEngine, setLeakyPanel, 'amber', n)}
        />
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 800px) {
          .compare-panels {
            flex-direction: column !important;
          }
        }
      `}</style>
    </div>
  )
}
