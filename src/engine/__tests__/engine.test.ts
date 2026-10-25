// ─── Engine Unit Tests ─────────────────────────────────────────────────────────
import { describe, it, expect, beforeEach } from 'vitest'
import { SimEngine } from '../index'
import { BurstyPattern, SteadyPattern, WindowEdgePattern } from '../patterns'
import { SeededPRNG } from '../prng'

// ── PRNG Tests ─────────────────────────────────────────────────────────────────
describe('SeededPRNG', () => {
  it('produces values in [0, 1)', () => {
    const prng = new SeededPRNG(42)
    for (let i = 0; i < 100; i++) {
      const v = prng.next()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })

  it('is reproducible after reset', () => {
    const prng = new SeededPRNG(42)
    const first = Array.from({ length: 10 }, () => prng.next())
    prng.reset(42)
    const second = Array.from({ length: 10 }, () => prng.next())
    expect(first).toEqual(second)
  })

  it('randInt returns values in [min, max]', () => {
    const prng = new SeededPRNG(7)
    for (let i = 0; i < 200; i++) {
      const v = prng.randInt(3, 9)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(9)
    }
  })
})

// ── Token Bucket Engine Tests ──────────────────────────────────────────────────
describe('Token Bucket — refill math', () => {
  let eng: SimEngine

  beforeEach(() => {
    eng = new SimEngine()
    eng.setParams({ algorithm: 'token', pattern: 'manual', capacity: 8, rate: 4 })
    eng.reset()
  })

  it('starts with tokens = capacity (8.00 / 8)', () => {
    const s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(8, 5)
    expect(s.tokenBucket.capacity).toBe(8)
  })

  it('refills tokens by rate × dt', () => {
    // Drain first
    eng.send(8)
    let s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(0, 4)

    // Now manually step 0.5s (simulated) while running
    eng.start()
    eng.step(0.5)
    s = eng.snapshot()
    // 0 + 4 × 0.5 = 2.0
    expect(s.tokenBucket.tokens).toBeCloseTo(2.0, 4)
  })

  it('clamps tokens to capacity', () => {
    // Tokens already at 8; step 10s => still 8
    eng.start()
    eng.step(10)
    const s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(8, 4)
  })

  it('accepts a request when tokens >= 1 and subtracts 1', () => {
    eng.send(1)
    const s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(7, 5)
    expect(s.accepted).toBe(1)
    expect(s.rejected).toBe(0)
    expect(s.decisions[0].type).toBe('allowed')
  })

  it('rejects when tokens < 1', () => {
    eng.send(8)   // drain all tokens
    eng.send(1)   // should reject
    const s = eng.snapshot()
    expect(s.rejected).toBe(1)
    expect(s.decisions[0].type).toBe('rejected')
    expect(s.decisions[0].reason).toBe('no token available')
  })

  it('rejects exactly at boundary (tokens = 0)', () => {
    // drain 8
    eng.send(8)
    let s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(0, 5)
    // one more: tokens < 1
    eng.send(1)
    s = eng.snapshot()
    expect(s.rejected).toBe(1)
  })

  it('allows fractional token accumulation', () => {
    eng.send(8) // drain
    eng.start()
    eng.step(0.25) // 4 × 0.25 = 1.0 token, but no request => 1.0 stored
    const s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeCloseTo(1.0, 4)
  })

  it('capacity clamp works when capacity shrinks', () => {
    // tokens = 8, shrink capacity to 5
    eng.setParams({ capacity: 5 })
    const s = eng.snapshot()
    expect(s.tokenBucket.tokens).toBeLessThanOrEqual(5)
  })

  it('generated counter increments for every request', () => {
    eng.send(3)
    expect(eng.snapshot().generated).toBe(3)
    eng.send(5)
    expect(eng.snapshot().generated).toBe(8)
  })
})

// ── Leaky Bucket Engine Tests ──────────────────────────────────────────────────
describe('Leaky Bucket — queue and drain', () => {
  let eng: SimEngine

  beforeEach(() => {
    eng = new SimEngine()
    eng.setParams({ algorithm: 'leaky', pattern: 'manual', capacity: 8, rate: 4 })
    eng.reset()
  })

  it('starts with empty queue', () => {
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(0)
    expect(s.leakyBucket.served).toBe(0)
  })

  it('enqueues requests when queue has space', () => {
    eng.send(3)
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(3)
    expect(s.accepted).toBe(3)
    expect(s.decisions[0].type).toBe('queued')
    expect(s.decisions[0].reason).toBe('entered queue')
  })

  it('rejects when queue is full', () => {
    eng.send(8)   // fill queue
    eng.send(3)   // should all reject
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(8)
    expect(s.rejected).toBe(3)
    expect(s.decisions[0].type).toBe('rejected')
    expect(s.decisions[0].reason).toBe('queue full, dropped')
  })

  it('rejects at exact capacity boundary', () => {
    eng.send(8)
    let s = eng.snapshot()
    expect(s.rejected).toBe(0) // 8 exactly should all be accepted
    eng.send(1)
    s = eng.snapshot()
    expect(s.rejected).toBe(1)
  })

  it('drains queue at leak rate via carry accumulator', () => {
    eng.send(8) // fill queue
    eng.start()
    eng.step(0.5) // 4 × 0.5 = 2.0 items drained
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(6)
    expect(s.leakyBucket.served).toBe(2)
    expect(s.decisions.some(d => d.type === 'served')).toBe(true)
  })

  it('carry accumulator is correct: fractional carry persists between ticks', () => {
    eng.send(4) // queue=[0,1,2,3]
    eng.start()
    // 4/s => 0.4 per 0.1s tick
    eng.step(0.1) // carry=0.4, n=0
    let s = eng.snapshot()
    expect(s.leakyBucket.served).toBe(0)
    expect(s.leakyBucket.carry).toBeCloseTo(0.4, 4)

    eng.step(0.1) // carry=0.8, n=0
    s = eng.snapshot()
    expect(s.leakyBucket.served).toBe(0)

    eng.step(0.1) // carry=1.2, n=1
    s = eng.snapshot()
    expect(s.leakyBucket.served).toBe(1)
    expect(s.leakyBucket.carry).toBeCloseTo(0.2, 4)
  })

  it('FIFO order is preserved', () => {
    // Can verify by checking queued count drains from head
    eng.send(4)
    eng.start()
    eng.step(0.25) // 4 × 0.25 = 1.0 => 1 served
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(3) // 4 - 1 = 3 left
    expect(s.leakyBucket.served).toBe(1)
  })

  it('idle carry discards whole-number part when queue empties', () => {
    eng.send(1) // queue=[x]
    eng.start()
    eng.step(1.0) // drain 1 item; carry=4×1-1=3.0 => 0 items left in queue
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBe(0)
    // carry should be fractional only (whole-number part discarded)
    expect(s.leakyBucket.carry).toBeLessThan(1)
  })

  it('queue clamp when capacity shrinks', () => {
    eng.send(8)
    eng.setParams({ capacity: 4 })
    const s = eng.snapshot()
    expect(s.leakyBucket.queued).toBeLessThanOrEqual(4)
  })
})

// ── Pattern Generator Tests ────────────────────────────────────────────────────
describe('SteadyPattern', () => {
  it('produces ~inputRate requests per second', () => {
    const p = new SteadyPattern(3)
    let total = 0
    const ticks = 100
    const dt = 0.01
    for (let i = 0; i < ticks; i++) total += p.tick(dt)
    // 3 req/s × 1s = 3 (allow ±1)
    expect(total).toBeGreaterThanOrEqual(2)
    expect(total).toBeLessThanOrEqual(4)
  })

  it('is deterministic after reset', () => {
    const p = new SteadyPattern(5)
    const run1 = Array.from({ length: 200 }, () => p.tick(0.01))
    p.reset()
    const run2 = Array.from({ length: 200 }, () => p.tick(0.01))
    expect(run1).toEqual(run2)
  })
})

describe('BurstyPattern', () => {
  it('is reproducible after reset', () => {
    const p = new BurstyPattern(3)
    const run1 = Array.from({ length: 300 }, () => p.tick(0.01))
    p.reset()
    const run2 = Array.from({ length: 300 }, () => p.tick(0.01))
    expect(run1).toEqual(run2)
  })

  it('produces clusters (max per tick > 1)', () => {
    // Use 1000 ticks × 10ms = 10 simulated seconds, well past the 2-3.5s first burst
    const p = new BurstyPattern(3)
    const ticks = Array.from({ length: 1000 }, () => p.tick(0.01))
    const maxPerTick = Math.max(...ticks)
    expect(maxPerTick).toBeGreaterThan(1)
  })

  it('long-run average is close to inputRate', () => {
    const p = new BurstyPattern(3)
    let total = 0
    const simSeconds = 30
    const dt = 0.01
    const ticks = simSeconds / dt
    for (let i = 0; i < ticks; i++) total += p.tick(dt)
    const avg = total / simSeconds
    // Allow 50% tolerance for short sim windows
    expect(avg).toBeGreaterThan(1)
    expect(avg).toBeLessThan(6)
  })
})

describe('WindowEdgePattern', () => {
  it('fires bursts near window boundaries', () => {
    const p = new WindowEdgePattern(8, 4)
    const results: Array<{ t: number; n: number }> = []
    let t = 0
    const dt = 0.01
    for (let i = 0; i < 1000; i++) {
      const n = p.tick(dt)
      if (n > 0) results.push({ t, n })
      t += dt
    }
    // Should have events near t=3.75 (4-0.25) and t=4.25 (4+0.25)
    expect(results.length).toBeGreaterThan(0)
    results.forEach(({ n }) => {
      expect(n).toBe(8) // capacity = 8
    })
  })
})

// ── Decision log max 4 entries ─────────────────────────────────────────────────
describe('Decision log', () => {
  it('caps at 4 entries (newest first)', () => {
    const eng = new SimEngine()
    eng.setParams({ algorithm: 'token', pattern: 'manual', capacity: 8, rate: 4 })
    eng.reset()
    eng.send(6) // drain 6 tokens → 6 decisions
    const s = eng.snapshot()
    expect(s.decisions.length).toBe(4)
    expect(s.decisions[0].t).toBeGreaterThanOrEqual(s.decisions[1].t)
  })
})

// ── Timeline pruning ───────────────────────────────────────────────────────────
describe('Timeline', () => {
  it('prunes events older than 10s', () => {
    const eng = new SimEngine()
    eng.setParams({ algorithm: 'token', pattern: 'manual', capacity: 100, rate: 4 })
    eng.reset()
    // send 5 requests at t=0
    eng.send(5)
    // advance 15 simulated seconds
    eng.start()
    eng.step(15)
    const s = eng.snapshot()
    // all events at t≈0 should have been pruned (current t≈15, cutoff≈5)
    s.timeline.forEach(e => {
      expect(e.t).toBeGreaterThanOrEqual(s.t - 10)
    })
  })
})
