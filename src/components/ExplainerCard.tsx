// ─── Explainer Card ────────────────────────────────────────────────────────────
import React from 'react'
import { BookOpen } from 'lucide-react'
import type { Algorithm } from '../engine/types'

interface Props {
  algorithm: Algorithm
  capacity: number
  rate: number
}

function TokenBucketContent({ capacity, rate }: { capacity: number; rate: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '30% 30% 40%', gap: 24 }}>
      {/* Mental Model */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>Mental Model</div>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0 }}>
          A token bucket is a savings account for request permission. Tokens arrive continuously.
          A request is accepted only when it can spend one token. If traffic is quiet, tokens
          accumulate up to the bucket capacity, which is why the algorithm allows controlled
          bursts without violating the long-run rate.
        </p>
      </div>

      {/* Decision Math */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>Decision Math</div>
        <div
          style={{
            background: '#f3f5f8',
            borderRadius: 12,
            padding: '16px',
          }}
        >
          <pre className="mono" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`tokens(t) = min(${capacity}, tokens(t-Δt) + ${rate} × Δt). A request is allowed when tokens ≥ 1; then tokens := tokens - 1. Otherwise it is rejected immediately.`}
          </pre>
        </div>
      </div>

      {/* System Design Notes */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>System Design Notes</div>
        <ul style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li>Great for public APIs where short bursts are acceptable but sustained overload is not.</li>
          <li>Usually implemented with &#123;tokens, last_refill_timestamp&#125;; no background job is required.</li>
          <li>In distributed systems, the state is commonly stored in Redis and updated atomically with Lua or server-side scripts.</li>
        </ul>
      </div>
    </div>
  )
}

function LeakyBucketContent({ capacity, rate }: { capacity: number; rate: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '30% 30% 40%', gap: 24 }}>
      {/* Mental Model */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>Mental Model</div>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0 }}>
          A leaky bucket is a finite queue with a metronome at the exit. Incoming requests
          can be accepted into the queue even when the backend cannot process them instantly.
          The backend sees a smooth output stream; callers may see queueing delay or rejection
          when the queue is full.
        </p>
      </div>

      {/* Decision Math */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>Decision Math</div>
        <div
          style={{
            background: '#f3f5f8',
            borderRadius: 12,
            padding: '16px',
          }}
        >
          <pre className="mono" style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
{`queue_capacity = ${capacity}. On arrival: enqueue if queue length < capacity, otherwise reject. On every tick: served += floor(carry + ${rate} × Δt), bounded by queue length.`}
          </pre>
        </div>
      </div>

      {/* System Design Notes */}
      <div>
        <div className="label-xs" style={{ marginBottom: 10 }}>System Design Notes</div>
        <ul style={{ fontSize: 15, color: '#64748b', lineHeight: 1.75, margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <li>Best when traffic shaping matters: gateways, network links, media pipelines, or fragile downstream services.</li>
          <li>Unlike token bucket, accepted requests may wait. This makes latency part of the design, not just allow/deny.</li>
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
      style={{ padding: '24px 28px', marginTop: 16 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <BookOpen size={18} color="#64748b" />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>
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
