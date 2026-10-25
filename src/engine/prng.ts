// ─── Seeded PRNG (Mulberry32) ─────────────────────────────────────────────────
// Deterministic, reproducible pseudo-random number generator.

export class SeededPRNG {
  private state: number

  constructor(seed: number = 42) {
    this.state = seed >>> 0
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let z = this.state
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
  }

  /** Returns an integer in [min, max] inclusive */
  randInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** Returns a float in [min, max) */
  randFloat(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  reset(seed: number = 42): void {
    this.state = seed >>> 0
  }
}
