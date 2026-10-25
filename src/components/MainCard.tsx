// ─── Main Simulation Card ──────────────────────────────────────────────────────
import React from 'react'
import { Activity } from 'lucide-react'
import type { SimSnapshot } from '../engine/types'
import type { ParticleData } from '../hooks/useSimulator'
import RequestLane from './RequestLane'
import TokenBucketState from './LiveState/TokenBucketState'
import LeakyBucketState from './LiveState/LeakyBucketState'
import DecisionLog from './DecisionLog'
import TimelineStrip from './TimelineStrip'

interface Props {
  snapshot: SimSnapshot
  particles: ParticleData[]
}

function getDescription(snapshot: SimSnapshot): string {
  const { algorithm, pattern } = snapshot
  if (algorithm === 'token') {
    if (pattern === 'bursty') {
      return 'Idle time stores tokens, so the first burst is graceful; sustained excess still gets rejected.'
    }
    return 'Requests spend tokens. Tokens refill continuously, so idle time becomes burst budget.'
  } else {
    if (pattern === 'bursty') {
      return 'Bursts become queueing delay first, drops second. The output remains smooth.'
    }
    return 'Requests join a finite FIFO queue. Work exits at a fixed leak rate.'
  }
}

function StatTile({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: string
}) {
  return (
    <div
      style={{
        border: '1px solid #e5e9f0',
        borderRadius: 14,
        padding: '10px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 72,
        flex: 1,
      }}
    >
      <div className="label-xs">{label}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: color || '#0f172a',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default function MainCard({ snapshot, particles }: Props) {
  const { algorithm, generated, accepted, rejected, t, tokenBucket, leakyBucket, decisions, timeline } = snapshot

  const acceptPct = generated > 0
    ? `${Math.round((accepted / generated) * 100)}%`
    : '—'

  const description = getDescription(snapshot)
  const algoLabel = algorithm === 'token' ? 'Token Bucket' : 'Leaky Bucket'

  return (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
        {/* Left: title + description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Activity size={18} color="#10e08f" />
            <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>{algoLabel}</span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.55 }}>
            {description}
          </p>
        </div>

        {/* Right: stat tiles */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <StatTile label="GENERATED" value={String(generated)} />
          <StatTile label="ACCEPTED" value={String(accepted)} color="#10e08f" />
          <StatTile label="REJECTED" value={String(rejected)} color="#d6155a" />
          <StatTile label="ACCEPT" value={acceptPct} />
        </div>
      </div>

      {/* Request lane */}
      <RequestLane particles={particles} algorithm={algorithm} />

      {/* Two panels: live state + decision log */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'stretch' }}>
        {algorithm === 'token'
          ? <TokenBucketState state={tokenBucket} t={t} />
          : <LeakyBucketState state={leakyBucket} t={t} />
        }
        <DecisionLog decisions={decisions} />
      </div>

      {/* Timeline */}
      <TimelineStrip events={timeline} currentT={t} algorithm={algorithm} />
    </div>
  )
}
