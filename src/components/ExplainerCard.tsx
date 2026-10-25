// ─── Explainer Card ────────────────────────────────────────────────────────────
import React from 'react'
import { BookOpen } from 'lucide-react'
import type { Algorithm } from '../engine/types'

interface Props {
  algorithm: Algorithm
  capacity: number
  rate: number
}

const columnGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.3fr)',
  gap: 24,
  alignItems: 'start',
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="label-xs" style={{ marginBottom: 10 }}>{children}</div>
  )
}

function MathBox({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f3f5f8', borderRadius: 12, padding: '14px 16px', overflow: 'hidden' }}>
      <pre
        className="mono"
        style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'break-word' }}
      >
        {children}
      </pre>
    </div>
  )
}

function TokenBucketContent({ capacity, rate }: { capacity: number; rate: number }) {
  return (
    <div style={columnGrid}>
      {/* Mental Model */}
      <div>
        <SectionLabel>Mental Model</SectionLabel>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0 }}>
          A token bucket is a savings account for request permission. Tokens arrive continuously.
          A request is accepted only when it can spend one token. If traffic is quiet, tokens
          accumulate up to the bucket capacity, which is why the algorithm allows controlled
          bursts without violating the long-run rate.
        </p>
      </div>

      {/* Decision Math */}
      <div>
        <SectionLabel>Decision Math</SectionLabel>
        <MathBox>
          {`tokens(t) = min(${capacity}, tokens(t-Δt) + ${rate} × Δt).\nAllow when tokens ≥ 1;\nthen tokens := tokens - 1.\nOtherwise reject immediately.`}
        </MathBox>
      </div>

      {/* System Design Notes */}
      <div>
        <SectionLabel>System Design Notes</SectionLabel>
        <ul style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>Great for public APIs where short bursts are acceptable but sustained overload is not.</li>
          <li>Usually implemented with &#123;tokens, last_refill_timestamp&#125;; no background job required.</li>
          <li>In distributed systems, state is stored in Redis and updated atomically with Lua scripts.</li>
        </ul>
      </div>
    </div>
  )
}

function LeakyBucketContent({ capacity, rate }: { capacity: number; rate: number }) {
  return (
    <div style={columnGrid}>
      {/* Mental Model */}
      <div>
        <SectionLabel>Mental Model</SectionLabel>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0 }}>
          A leaky bucket is a finite queue with a metronome at the exit. Incoming requests
          can be accepted into the queue even when the backend cannot process them instantly.
          The backend sees a smooth output stream; callers may see queueing delay or rejection
          when the queue is full.
        </p>
      </div>

      {/* Decision Math */}
      <div>
        <SectionLabel>Decision Math</SectionLabel>
        <MathBox>
          {`queue_capacity = ${capacity}.\nOn arrival: enqueue if len < capacity,\notherwise reject.\nOn tick: served += floor(carry + ${rate} × Δt),\nbounded by queue length.`}
        </MathBox>
      </div>

      {/* System Design Notes */}
      <div>
        <SectionLabel>System Design Notes</SectionLabel>
        <ul style={{ fontSize: 14, color: '#64748b', lineHeight: 1.75, margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li>Best when traffic shaping matters: gateways, network links, media pipelines, or fragile downstream services.</li>
          <li>Unlike token bucket, accepted requests may wait. Latency is part of the design, not just allow/deny.</li>
          <li>A full queue means new work is rejected even if it would eventually fit the average rate.</li>
        </ul>
      </div>
    </div>
  )
}

export default function ExplainerCard({ algorithm, capacity, rate }: Props) {
  return (
    <div
      className="card"
      style={{ padding: '24px 28px', marginTop: 16, overflow: 'hidden' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <BookOpen size={18} color="#64748b" />
        <span style={{ fontSize: 17, fontWeight: 700, color: '#0f172a' }}>
          How this algorithm really works
        </span>
      </div>

      {algorithm === 'token'
        ? <TokenBucketContent capacity={capacity} rate={rate} />
        : <LeakyBucketContent capacity={capacity} rate={rate} />
      }
    </div>
  )
}
