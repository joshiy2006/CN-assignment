// ─── Traffic Pattern Generators ───────────────────────────────────────────────
// Each generator returns the number of requests to fire at a given sim time step.
// They are stateful (accumulator-based) so each step call is deterministic.

import { SeededPRNG } from './prng'
import type { TrafficPattern } from './types'

export interface PatternGenerator {
  tick(dt: number): number   // returns number of requests to fire this tick
  reset(): void
}

// ── Steady ────────────────────────────────────────────────────────────────────
export class SteadyPattern implements PatternGenerator {
  private carry = 0
  constructor(private inputRate: number) {}

  tick(dt: number): number {
    this.carry += this.inputRate * dt
    const n = Math.floor(this.carry)
    this.carry -= n
    return n
  }

  reset(): void {
    this.carry = 0
  }

  setRate(r: number): void {
    this.inputRate = r
  }
}

// ── Bursty ────────────────────────────────────────────────────────────────────
// Clusters of 5-8 requests within ~0.2s, spaced ~2-3s apart, with occasional
// single requests between bursts. Long-run mean ≈ inputRate req/s.
export class BurstyPattern implements PatternGenerator {
  private prng = new SeededPRNG(42)
  private nextBurstAt = 0           // sim time for next cluster
  private burstQueue: number[] = [] // sub-burst emission times within cluster
  private betweenCarry = 0          // carry for sparse inter-burst singles
  private simTime = 0

  constructor(private inputRate: number) {
    this.scheduleNextBurst()
  }

  private scheduleNextBurst(): void {
    const gap = this.prng.randFloat(2.0, 3.5)
    this.nextBurstAt = this.simTime + gap
    const burstSize = this.prng.randInt(5, 8)
    this.burstQueue = []
    for (let i = 0; i < burstSize; i++) {
      this.burstQueue.push(this.prng.randFloat(0, 0.2))
    }
    this.burstQueue.sort((a, b) => a - b)
  }

  tick(dt: number): number {
    const prevTime = this.simTime
    this.simTime += dt
    let count = 0

    // Fire burst sub-events that fall in [prevTime, simTime)
    while (
      this.burstQueue.length > 0 &&
      this.nextBurstAt + this.burstQueue[0] < this.simTime
    ) {
      this.burstQueue.shift()
      count++
    }

    // When cluster is done, schedule next
    if (this.burstQueue.length === 0 && this.simTime >= this.nextBurstAt + 0.2) {
      this.scheduleNextBurst()
    }

    // Occasional singles between bursts (~15% of inputRate as fill)
    const singleRate = this.inputRate * 0.15
    this.betweenCarry += singleRate * dt
    const singles = Math.floor(this.betweenCarry)
    this.betweenCarry -= singles
    count += singles

    return count
  }

  reset(): void {
    this.prng.reset(42)
    this.simTime = 0
    this.nextBurstAt = 0
    this.burstQueue = []
    this.betweenCarry = 0
    this.scheduleNextBurst()
  }

  setRate(r: number): void {
    this.inputRate = r
  }
}

// ── Window-Edge Attack ─────────────────────────────────────────────────────────
// At every window boundary k×windowSeconds, fire a burst of ~capacity requests
// at (k×W - 0.25) and another at (k×W + 0.25). Nothing in between.
export class WindowEdgePattern implements PatternGenerator {
  private simTime = 0
  private pendingAt: Map<number, number> = new Map() // sim-time → count
  private nextWindowBoundary: number

  constructor(
    private capacity: number,
    private windowSeconds: number,
  ) {
    this.nextWindowBoundary = windowSeconds
    this.planEvents()
  }

  private planEvents(): void {
    const k = this.nextWindowBoundary
    const size = Math.ceil(this.capacity)
    const before = k - 0.25
    const after = k + 0.25
    if (before > 0) this.pendingAt.set(before, size)
    this.pendingAt.set(after, size)
  }

  tick(dt: number): number {
    const prevTime = this.simTime
    this.simTime += dt
    let count = 0

    for (const [t, n] of this.pendingAt.entries()) {
      if (t > prevTime && t <= this.simTime) {
        count += n
        this.pendingAt.delete(t)
        // schedule next window if we just passed the boundary
        if (t === this.nextWindowBoundary + 0.25) {
          this.nextWindowBoundary += this.windowSeconds
          this.planEvents()
        }
      }
    }

    return count
  }

  reset(): void {
    this.simTime = 0
    this.pendingAt.clear()
    this.nextWindowBoundary = this.windowSeconds
    this.planEvents()
  }

  setParams(capacity: number, windowSeconds: number): void {
    this.capacity = capacity
    this.windowSeconds = windowSeconds
  }
}

// ── Manual ─────────────────────────────────────────────────────────────────────
export class ManualPattern implements PatternGenerator {
  tick(_dt: number): number { return 0 }
  reset(): void {}
}

// ── Factory ────────────────────────────────────────────────────────────────────
export function createPattern(
  pattern: TrafficPattern,
  inputRate: number,
  capacity: number,
  windowSeconds: number,
): PatternGenerator {
  switch (pattern) {
    case 'steady': return new SteadyPattern(inputRate)
    case 'bursty': return new BurstyPattern(inputRate)
    case 'window-edge': return new WindowEdgePattern(capacity, windowSeconds)
    case 'manual': return new ManualPattern()
  }
}
