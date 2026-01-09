import React, { useEffect, useMemo, useState } from 'react'
import CubeScene from './components/CubeScene'
import DevPanel from './components/DevPanel'

export default function App() {
  const defaultMinutes = Number(import.meta.env.VITE_TIME_LIMIT_MINUTES || 3)
  const [timeLimitMin, setTimeLimitMin] = useState<number>(defaultMinutes)
  const [running, setRunning] = useState(true)
  const [solved, setSolved] = useState(false)

  useEffect(() => {
    setTimeLimitMin(defaultMinutes)
  }, [defaultMinutes])

  return (
    <div className="app-root">
      <header className="topbar">Sintercube</header>
      <main className="main-area">
        <CubeScene
          timeLimitMinutes={timeLimitMin}
          running={running}
          onSolved={() => setSolved(true)}
          onTimeout={() => { /* handled inside */ }}
        />
      </main>
      <DevPanel
        timeLimitMinutes={timeLimitMin}
        setTimeLimitMinutes={setTimeLimitMin}
        running={running}
        setRunning={setRunning}
        onFinish={() => setSolved(true)}
      />

      {solved && (
        <div className="solved-overlay">
          <div className="message">🎉 Hidden message: You did it! 🎉</div>
        </div>
      )}
    </div>
  )
}
