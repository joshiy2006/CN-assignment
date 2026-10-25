// ─── Simulation Engine ────────────────────────────────────────────────────────
// Pure TypeScript, no React dependencies.
// Exposes: reset(), step(dt), send(n), setParams(), snapshot

import type {
  SimParams,
  SimSnapshot,
  DecisionEntry,
  TimelineEvent,
  Algorithm,
  TrafficPattern,
  SimSpeed,
} from './types'
import { createPattern, type PatternGenerator } from './patterns'

const TIMELINE_WINDOW = 10  // seconds of timeline history to keep
const LOG_MAX = 4           // max decision log entries shown

let _idCounter = 0
function nextId(): number { return ++_idCounter }

export class SimEngine {
  // ── state ──────────────────────────────────────────────────────────────────
  private t = 0
  private running = false

  private algorithm: Algorithm = 'token'
  private pattern: TrafficPattern = 'bursty'
  private speed: SimSpeed = 1
  private capacity = 8
  private rate = 4
  private windowSeconds = 4
  private inputRate = 3

  // stats
  private generated = 0
  private accepted = 0
  private rejected = 0

  // Token Bucket state
  private tokens = 8
  private tbCapacity = 8
  private tbRate = 4

  // Leaky Bucket state
  private lbQueue: number[] = []   // FIFO, each element is a request id
  private lbServed = 0
  private lbCarry = 0
  private lbCapacity = 8
  private lbRate = 4

  // Log & timeline
  private decisions: DecisionEntry[] = []
  private timeline: TimelineEvent[] = []

  // Pattern generator
  private gen: PatternGenerator

  constructor() {
    this.gen = createPattern(this.pattern, this.inputRate, this.capacity, this.windowSeconds)
    this.tokens = this.capacity
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  reset(): void {
    this.t = 0
    this.running = false
    this.generated = 0
    this.accepted = 0
    this.rejected = 0
    // Token Bucket
    this.tokens = this.capacity
    this.tbCapacity = this.capacity
    this.tbRate = this.rate
    // Leaky Bucket
    this.lbQueue = []
    this.lbServed = 0
    this.lbCarry = 0
    this.lbCapacity = this.capacity
    this.lbRate = this.rate
    // Log
    this.decisions = []
    this.timeline = []
    // Reset pattern generator
    this.gen = createPattern(this.pattern, this.inputRate, this.capacity, this.windowSeconds)
  }

  start(): void { this.running = true }
  stop(): void  { this.running = false }

  /**
   * Advance simulation by dt simulated seconds.
   * Call this with real dt × speed multiplier.
   */
  step(dtSeconds: number): void {
    if (!this.running) return
    this._stepInternal(dtSeconds, this.gen.tick(dtSeconds))
  }

  /**
   * Manually inject n requests immediately (works paused or running).
   */
  send(n: number): void {
    this._stepInternal(0, n)
  }

  setParams(params: Partial<SimParams>): void {
    let needPatternRebuild = false

    if (params.algorithm !== undefined && params.algorithm !== this.algorithm) {
      this.algorithm = params.algorithm
    }
    if (params.pattern !== undefined && params.pattern !== this.pattern) {
      this.pattern = params.pattern
      needPatternRebuild = true
    }
    if (params.speed !== undefined) {
      this.speed = params.speed
    }
    if (params.capacity !== undefined) {
      const newCap = Math.max(1, params.capacity)
      this.capacity = newCap
      this.tbCapacity = newCap
      this.lbCapacity = newCap
      // Clamp token bucket
      this.tokens = Math.min(this.tokens, newCap)
      // Clamp leaky queue
      while (this.lbQueue.length > newCap) {
        this.lbQueue.shift()
      }
      needPatternRebuild = true
    }
    if (params.rate !== undefined) {
      const newRate = Math.max(0, params.rate)
      this.rate = newRate
      this.tbRate = newRate
      this.lbRate = newRate
    }
    if (params.windowSeconds !== undefined) {
      this.windowSeconds = Math.max(1, params.windowSeconds)
      needPatternRebuild = true
    }
    if (params.inputRate !== undefined) {
      this.inputRate = Math.max(0, params.inputRate)
      needPatternRebuild = true
    }

    if (needPatternRebuild) {
      this.gen = createPattern(this.pattern, this.inputRate, this.capacity, this.windowSeconds)
    }
  }

  snapshot(): SimSnapshot {
    return {
      t: this.t,
      running: this.running,
      algorithm: this.algorithm,
      pattern: this.pattern,
      speed: this.speed,
      capacity: this.capacity,
      rate: this.rate,
      windowSeconds: this.windowSeconds,
      inputRate: this.inputRate,

      generated: this.generated,
      accepted: this.accepted,
      rejected: this.rejected,

      tokenBucket: {
        tokens: this.tokens,
        capacity: this.tbCapacity,
        rate: this.tbRate,
      },

      leakyBucket: {
        queued: this.lbQueue.length,
        capacity: this.lbCapacity,
        rate: this.lbRate,
        served: this.lbServed,
        carry: this.lbCarry,
      },

      decisions: [...this.decisions],
      timeline: this._filteredTimeline(),
    }
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _stepInternal(dt: number, requestCount: number): void {
    // Advance time first
    this.t += dt

    if (this.algorithm === 'token') {
      this._tokenBucketStep(dt, requestCount)
    } else {
      this._leakyBucketStep(dt, requestCount)
    }

    // Trim timeline
    this._pruneTimeline()
  }

  private _tokenBucketStep(dt: number, requestCount: number): void {
    // Refill tokens
    this.tokens = Math.min(this.tbCapacity, this.tokens + this.tbRate * dt)

    // Process requests
    for (let i = 0; i < requestCount; i++) {
      this.generated++
      if (this.tokens >= 1) {
        this.tokens -= 1
        this.accepted++
        this._log('token spent', 'allowed')
        this._addTimeline('allowed')
      } else {
        this.rejected++
        this._log('no token available', 'rejected')
        this._addTimeline('rejected')
      }
    }
  }

  private _leakyBucketStep(dt: number, requestCount: number): void {
    // Enqueue incoming requests
    for (let i = 0; i < requestCount; i++) {
      this.generated++
      if (this.lbQueue.length < this.lbCapacity) {
        this.lbQueue.push(nextId())
        this.accepted++
        this._log('entered queue', 'queued')
        this._addTimeline('enqueued')
      } else {
        this.rejected++
        this._log('queue full, dropped', 'rejected')
        this._addTimeline('rejected')
      }
    }

    // Leak (drain)
    if (this.lbQueue.length > 0) {
      this.lbCarry += this.lbRate * dt
      const n = Math.min(Math.floor(this.lbCarry), this.lbQueue.length)
      for (let i = 0; i < n; i++) {
        this.lbQueue.shift()
        this.lbServed++
        this._log('leaked to server', 'served')
        this._addTimeline('served')
      }
      this.lbCarry -= n
      // If queue emptied, discard whole-number carry (keep fractional)
      if (this.lbQueue.length === 0) {
        this.lbCarry = this.lbCarry - Math.floor(this.lbCarry)
      }
    }
  }

  private _log(reason: string, type: DecisionEntry['type']): void {
    const entry: DecisionEntry = { id: nextId(), reason, type, t: this.t }
    this.decisions.unshift(entry)
    if (this.decisions.length > LOG_MAX) {
      this.decisions.length = LOG_MAX
    }
  }

  private _addTimeline(type: TimelineEvent['type']): void {
    this.timeline.push({ id: nextId(), t: this.t, type })
  }

  private _pruneTimeline(): void {
    const cutoff = this.t - TIMELINE_WINDOW
    let start = 0
    while (start < this.timeline.length && this.timeline[start].t < cutoff) {
      start++
    }
    if (start > 0) this.timeline.splice(0, start)
  }

  private _filteredTimeline(): TimelineEvent[] {
    const cutoff = this.t - TIMELINE_WINDOW
    return this.timeline.filter(e => e.t >= cutoff)
  }
}

// Singleton engine instance
export const engine = new SimEngine()
