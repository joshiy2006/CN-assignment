// ─── App Root ──────────────────────────────────────────────────────────────────
import React, { useState, useCallback } from 'react'
import { useSimulator } from './hooks/useSimulator'
import TabBar, { type ActiveTab } from './components/TabBar'
import MainCard from './components/MainCard'
import TrafficConsole from './components/TrafficConsole'
import ExplainerCard from './components/ExplainerCard'
import StepLog from './components/StepLog'
import CompareView from './components/CompareView'
import type { Algorithm } from './engine/types'

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('token')
  const controls = useSimulator()
  const { snapshot, particles } = controls

  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
    if (tab === 'token' || tab === 'leaky') {
      // Switch algorithm and reset
      controls.setParams({ algorithm: tab as Algorithm })
      controls.reset()
    }
    // 'compare' tab keeps its own independent engines
  }, [controls])

  if (activeTab === 'compare') {
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
          <TabBar active={activeTab} onChange={handleTabChange} />
          <CompareView />
        </div>
      </div>
    )
  }

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
        <TabBar active={activeTab} onChange={handleTabChange} />

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
          {/* Left column: Main card + Step Log + Explainer */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <MainCard snapshot={snapshot} particles={particles} />
            <StepLog
              events={snapshot.fullLog}
              onClear={controls.clearLog}
            />
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
