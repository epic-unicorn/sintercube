import React from 'react'

type Props = {
  timeLimitMinutes: number
  setTimeLimitMinutes: (n: number) => void
  running: boolean
  setRunning: (b: boolean) => void
  onFinish: () => void
}

export default function DevPanel({ timeLimitMinutes, setTimeLimitMinutes, running, setRunning, onFinish }: Props) {
  return (
    <div className="dev-panel">
      <div>
        <label>Time (min):</label>
        <input
          type="number"
          min={0.1}
          step={0.5}
          value={timeLimitMinutes}
          onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
        />
      </div>
      <div className="dev-buttons">
        <button onClick={() => setRunning(!running)}>{running ? 'Pause' : 'Run'}</button>
        <button onClick={() => onFinish()}>Finish (dev)</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('scramble'))}>Scramble</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('reset-cube'))}>Reset</button>
        <div style={{marginTop:8}}>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'U'}))}>U</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'Ui'}))}>U'</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'R'}))}>R</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'Ri'}))}>R'</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'F'}))}>F</button>
          <button onClick={() => window.dispatchEvent(new CustomEvent('move', {detail: 'Fi'}))}>F'</button>
        </div>
      </div>
    </div>
  )
}
