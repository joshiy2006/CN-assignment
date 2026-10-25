// ─── Shared types ─────────────────────────────────────────────────────────────

export type Algorithm = 'token' | 'leaky'
export type TrafficPattern = 'bursty' | 'steady' | 'window-edge' | 'manual'
export type SimSpeed = 0.5 | 1 | 2 | 4

export interface SimParams {
  algorithm: Algorithm
  pattern: TrafficPattern
  speed: SimSpeed
  capacity: number   // tokens capacity / queue size
  rate: number       // token refill rate / leak drain rate
  windowSeconds: number
  inputRate: number  // req/s offered load
}

export type DecisionType = 'allowed' | 'rejected' | 'queued' | 'served'

// Full step-by-step log entry (all events, unbounded, newest-first)
export interface LogEvent {
  id: number
  t: number
  algorithm: Algorithm
  type: DecisionType
  reason: string
  // extra context
  tokensAfter?: number     // token bucket: tokens remaining after event
  queueAfter?: number      // leaky bucket: queue length after event
}

export interface DecisionEntry {
  id: number
  reason: string
  type: DecisionType
  t: number
}

export interface TimelineEvent {
  id: number
  t: number
  type: 'allowed' | 'rejected' | 'enqueued' | 'served'
}

export interface Particle {
  id: number
  startedAt: number   // real timestamp (performance.now())
  color: 'blue' | 'amber' | 'red'
}

export interface TokenBucketSnapshot {
  tokens: number
  capacity: number
  rate: number
}

export interface LeakyBucketSnapshot {
  queued: number
  capacity: number
  rate: number
  served: number
  carry: number
}

export interface SimSnapshot {
  t: number
  running: boolean
  algorithm: Algorithm
  pattern: TrafficPattern
  speed: SimSpeed
  capacity: number
  rate: number
  windowSeconds: number
  inputRate: number

  // stats
  generated: number
  accepted: number
  rejected: number

  // algorithm state
  tokenBucket: TokenBucketSnapshot
  leakyBucket: LeakyBucketSnapshot

  // log (newest first, max 4) — for the "Why last decisions" panel
  decisions: DecisionEntry[]

  // full step-by-step event log (newest first, capped at 200 for UI)
  fullLog: LogEvent[]

  // timeline events (sorted by t, last 10s of sim time)
  timeline: TimelineEvent[]
}
