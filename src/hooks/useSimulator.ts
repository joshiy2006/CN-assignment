// ─── useSimulator hook ────────────────────────────────────────────────────────
// Drives the engine via requestAnimationFrame, returns snapshots.

import { useState, useEffect, useRef, useCallback } from 'react'
import { engine } from '../engine'
import type { SimSnapshot, SimParams, Algorithm, TrafficPattern, SimSpeed } from '../engine/types'

export interface SimControls {
  snapshot: SimSnapshot
  toggleRunning: () => void
  reset: () => void
  sendRequests: (n: number) => void
  setParams: (p: Partial<SimParams>) => void
  particles: ParticleData[]
}

export interface ParticleData {
  id: number
  color: 'blue' | 'amber' | 'red'
  startedAt: number   // performance.now()
}

let _particleId = 0

export function useSimulator(): SimControls {
  const [snapshot, setSnapshot] = useState<SimSnapshot>(() => engine.snapshot())
  const [particles, setParticles] = useState<ParticleData[]>([])

  const rafRef = useRef<number>(0)
  const lastRealTimeRef = useRef<number | null>(null)
  const pendingParticlesRef = useRef<ParticleData[]>([])

  // RAF loop
  const loop = useCallback((now: number) => {
    const snap = engine.snapshot()
    if (snap.running) {
      if (lastRealTimeRef.current !== null) {
        const realDt = (now - lastRealTimeRef.current) / 1000  // seconds
        const simDt = realDt * snap.speed
        const prevGen = snap.generated
        const prevAccepted = snap.accepted
        const prevRejected = snap.rejected
        const prevTimeline = snap.timeline.length

        engine.step(simDt)

        const newSnap = engine.snapshot()
        // Spawn particles for newly generated requests
        const newReqs = newSnap.generated - prevGen
        if (newReqs > 0) {
          const newParticles: ParticleData[] = []
          // Determine how many were accepted vs rejected
          const newAccepted = newSnap.accepted - prevAccepted
          const newRejected = newSnap.rejected - prevRejected
          for (let i = 0; i < newAccepted; i++) {
            newParticles.push({
              id: ++_particleId,
              color: newSnap.algorithm === 'token' ? 'blue' : 'amber',
              startedAt: performance.now(),
            })
          }
          for (let i = 0; i < newRejected; i++) {
            newParticles.push({
              id: ++_particleId,
              color: 'red',
              startedAt: performance.now(),
            })
          }
          if (newParticles.length > 0) {
            setParticles(prev => [...prev, ...newParticles])
          }
        }

        setSnapshot(newSnap)
      }
      lastRealTimeRef.current = now
    } else {
      lastRealTimeRef.current = null
    }

    // Prune particles older than 1.1s
    setParticles(prev => prev.filter(p => now - p.startedAt < 1100))

    rafRef.current = requestAnimationFrame(loop)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [loop])

  const toggleRunning = useCallback(() => {
    const s = engine.snapshot()
    if (s.running) {
      engine.stop()
    } else {
      engine.start()
    }
    setSnapshot(engine.snapshot())
  }, [])

  const reset = useCallback(() => {
    engine.reset()
    setParticles([])
    lastRealTimeRef.current = null
    setSnapshot(engine.snapshot())
  }, [])

  const sendRequests = useCallback((n: number) => {
    const before = engine.snapshot()
    engine.send(n)
    const after = engine.snapshot()
    // Spawn particles
    const newAccepted = after.accepted - before.accepted
    const newRejected = after.rejected - before.rejected
    const newParticles: ParticleData[] = []
    for (let i = 0; i < newAccepted; i++) {
      newParticles.push({
        id: ++_particleId,
        color: after.algorithm === 'token' ? 'blue' : 'amber',
        startedAt: performance.now(),
      })
    }
    for (let i = 0; i < newRejected; i++) {
      newParticles.push({
        id: ++_particleId,
        color: 'red',
        startedAt: performance.now(),
      })
    }
    if (newParticles.length > 0) {
      setParticles(prev => [...prev, ...newParticles])
    }
    setSnapshot(after)
  }, [])

  const setParams = useCallback((p: Partial<SimParams>) => {
    engine.setParams(p)
    setSnapshot(engine.snapshot())
  }, [])

  return { snapshot, toggleRunning, reset, sendRequests, setParams, particles }
}
