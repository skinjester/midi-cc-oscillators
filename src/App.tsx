import { useState, useEffect, useRef } from 'react'
import './App.css'

type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth'

function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [waveform, setWaveform] = useState<Waveform>('sine')
  const [rate, setRate] = useState(1)
  const [min, setMin] = useState(0)
  const [max, setMax] = useState(127)
  const [currentValue, setCurrentValue] = useState(0)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)

  const calculateValue = (time: number): number => {
    const frequency = rate
    const t = time * frequency
    let normalized = 0

    switch (waveform) {
      case 'sine':
        normalized = Math.sin(t * Math.PI * 2)
        break
      case 'square':
        normalized = Math.sin(t * Math.PI * 2) >= 0 ? 1 : -1
        break
      case 'triangle':
        normalized = 2 * Math.abs(2 * (t - Math.floor(t + 0.5))) - 1
        break
      case 'sawtooth':
        normalized = 2 * (t - Math.floor(t + 0.5))
        break
    }

    const range = max - min
    const scaled = (normalized + 1) / 2
    const value = min + (scaled * range)
    return Math.max(0, Math.min(127, Math.round(value)))
  }

  const drawWaveform = (ctx: CanvasRenderingContext2D, width: number, height: number, time: number, dotValue: number) => {
    ctx.clearRect(0, 0, width, height)
    
    ctx.fillStyle = '#c42828'
    ctx.beginPath()

    const points = 200
    
    ctx.moveTo(0, height)
    
    for (let i = 0; i < points; i++) {
      const x = (i / points) * width
      const t = time + (i / points - 0.5) * 2
      const value = calculateValue(t)
      const y = height - (value / 127) * height
      
      ctx.lineTo(x, y)
    }
    
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(width / 2, 0)
    ctx.lineTo(width / 2, height)
    ctx.stroke()
  }

  useEffect(() => {
    if (!isRunning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    startTimeRef.current = performance.now() / 1000

    const animate = () => {
      const currentTime = performance.now() / 1000 - startTimeRef.current
      const value = calculateValue(currentTime)
      setCurrentValue(value)

      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawWaveform(ctx, canvas.width, canvas.height, currentTime, value)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRunning, waveform, rate, min, max])

  useEffect(() => {
    if (!isRunning) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          drawWaveform(ctx, canvas.width, canvas.height, 0, currentValue)
        }
      }
    }
  }, [waveform, rate, min, max, isRunning])

  return (
    <div className="app">
      <h1>MIDI CC Oscillator</h1>
      
      <div className="visualization">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={200}
        />
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Waveform</label>
          <select 
            value={waveform} 
            onChange={(e) => setWaveform(e.target.value as Waveform)}
          >
            <option value="sine">Sine</option>
            <option value="square">Square</option>
            <option value="triangle">Triangle</option>
            <option value="sawtooth">Sawtooth</option>
          </select>
        </div>

        <div className="control-group">
          <label>Rate: {rate.toFixed(2)} Hz</label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            onDoubleClick={() => setRate(1.0)}
          />
        </div>

        <div className="control-group">
          <label>Min: {min}</label>
          <input
            type="range"
            min="0"
            max="127"
            step="1"
            value={min}
            onChange={(e) => setMin(parseInt(e.target.value))}
            onDoubleClick={() => setMin(0)}
          />
        </div>

        <div className="control-group">
          <label>Max: {max}</label>
          <input
            type="range"
            min="0"
            max="127"
            step="1"
            value={max}
            onChange={(e) => setMax(parseInt(e.target.value))}
            onDoubleClick={() => setMax(127)}
          />
        </div>

        <button 
          className="start-stop"
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Stop' : 'Start'}
        </button>
      </div>

      <div className="output">
        <div className="value-display">
          {currentValue}
        </div>
        <div className="value-label">MIDI CC Value (0-127)</div>
      </div>
    </div>
  )
}

export default App
