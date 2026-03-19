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
  const waveformIconsRef = useRef<{ [key: string]: HTMLCanvasElement }>({})

  const drawWaveformIcon = (canvas: HTMLCanvasElement, type: Waveform, isActive: boolean) => {
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    
    ctx.clearRect(0, 0, width, height)
    
    const color = isActive ? '#ffffff' : '#e84545'
    ctx.fillStyle = color
    ctx.beginPath()
    
    const points = 100
    ctx.moveTo(0, height)
    
    for (let i = 0; i < points; i++) {
      const x = (i / points) * width
      let t = i / points
      
      switch (type) {
        case 'sine':
          t = t - 0.25
          break
        case 'square':
          t = t - 0.25
          break
        case 'sawtooth':
          t = t + 0
          break
      }
      
      let normalized = 0
      
      switch (type) {
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
      
      const heightScale = type === 'square' ? 0.3 : 0.35
      const baseline = height * 0.65
      const y = baseline - (normalized * height * heightScale)
      ctx.lineTo(x, y)
    }
    
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
  }

  useEffect(() => {
    Object.keys(waveformIconsRef.current).forEach(key => {
      const canvas = waveformIconsRef.current[key]
      if (canvas) {
        drawWaveformIcon(canvas, key as Waveform, waveform === key)
      }
    })
  }, [waveform])

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

  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current
      if (canvas) {
        const container = canvas.parentElement
        if (container) {
          const width = container.clientWidth
          const height = Math.min(Math.max(width * 0.3, 200), 400)
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            drawWaveform(ctx, canvas.width, canvas.height, 0, currentValue)
          }
        }
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    return () => {
      window.removeEventListener('resize', updateCanvasSize)
    }
  }, [currentValue])

  return (
    <div className="app">
      <div className="visualization">
        <canvas 
          ref={canvasRef}
        />
      </div>

      <div className="controls">
        <div className="control-group">
          <label>Waveform</label>
          <div className="waveform-selector">
            <button 
              className={waveform === 'sine' ? 'active' : ''}
              onClick={() => setWaveform('sine')}
            >
              <canvas 
                ref={(el) => { if (el) waveformIconsRef.current['sine'] = el }}
                width={120}
                height={74}
              />
            </button>
            <button 
              className={waveform === 'square' ? 'active' : ''}
              onClick={() => setWaveform('square')}
            >
              <canvas 
                ref={(el) => { if (el) waveformIconsRef.current['square'] = el }}
                width={120}
                height={74}
              />
            </button>
            <button 
              className={waveform === 'triangle' ? 'active' : ''}
              onClick={() => setWaveform('triangle')}
            >
              <canvas 
                ref={(el) => { if (el) waveformIconsRef.current['triangle'] = el }}
                width={120}
                height={74}
              />
            </button>
            <button 
              className={waveform === 'sawtooth' ? 'active' : ''}
              onClick={() => setWaveform('sawtooth')}
            >
              <canvas 
                ref={(el) => { if (el) waveformIconsRef.current['sawtooth'] = el }}
                width={120}
                height={74}
              />
            </button>
          </div>
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
