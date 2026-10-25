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

  // log (newest first, max 4)
  decisions: DecisionEntry[]

  // timeline events (sorted by t, last 10s of sim time)
  timeline: TimelineEvent[]
}
