// ─── App Root ──────────────────────────────────────────────────────────────────
import React, { useCallback } from 'react'
import { useSimulator } from './hooks/useSimulator'
import { engine } from './engine'
import TabBar from './components/TabBar'
import MainCard from './components/MainCard'
import TrafficConsole from './components/TrafficConsole'
import ExplainerCard from './components/ExplainerCard'
import type { Algorithm } from './engine/types'

export default function App() {
  const controls = useSimulator()
  const { snapshot, particles } = controls

  const handleTabChange = useCallback((alg: Algorithm) => {
    // Set algorithm first, then reset so the new algo state is applied
    controls.setParams({ algorithm: alg })
    controls.reset()
  }, [controls])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fafbfc',
        padding: '32px 24px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>

        {/* Tab Bar */}
        <TabBar active={snapshot.algorithm} onChange={handleTabChange} />

        {/* Two-column grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
            gap: 24,
            alignItems: 'start',
          }}
          className="sim-grid"
        >
          {/* Left column: Main card + Explainer */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <MainCard snapshot={snapshot} particles={particles} />
            <ExplainerCard
              algorithm={snapshot.algorithm}
              capacity={snapshot.capacity}
              rate={snapshot.rate}
            />
          </div>

          {/* Right column: Traffic Console */}
          <TrafficConsole snapshot={snapshot} controls={controls} />
        </div>
      </div>

      {/* Responsive style */}
      <style>{`
        @media (max-width: 900px) {
          .sim-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
