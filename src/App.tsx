import { useState, useEffect, useRef } from 'react'
import './App.css'

type Waveform = 'sine' | 'square' | 'triangle' | 'sawtooth'

type Oscillator = {
  waveform: Waveform
  rate: number
  min: number
  max: number
}

function App() {
  const [isRunning, setIsRunning] = useState(false)
  const [oscillators, setOscillators] = useState<Oscillator[]>([
    { waveform: 'sine', rate: 1, min: 0, max: 127 },
    { waveform: 'square', rate: 1, min: 0, max: 127 },
    { waveform: 'triangle', rate: 1, min: 0, max: 127 },
    { waveform: 'sawtooth', rate: 1, min: 0, max: 127 }
  ])
  const [activeOscillatorIndex, setActiveOscillatorIndex] = useState(0)
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null)
  const [currentValue, setCurrentValue] = useState(0)
  
  const animationRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const waveformIconsRef = useRef<{ [key: string]: HTMLCanvasElement }>({})
  
  const activeOscillator = oscillators[activeOscillatorIndex]
  const allWaveforms: Waveform[] = ['sine', 'square', 'triangle', 'sawtooth']

  const calculateValue = (time: number, osc: Oscillator): number => {
    const frequency = osc.rate
    const t = time * frequency
    let normalized = 0

    switch (osc.waveform) {
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

    const range = osc.max - osc.min
    const scaled = (normalized + 1) / 2
    const value = osc.min + (scaled * range)
    return Math.max(0, Math.min(127, Math.round(value)))
  }

  const drawWaveformIcon = (canvas: HTMLCanvasElement, osc: Oscillator, isActive: boolean, time: number = 0) => {
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
      const t = time + (i / points - 0.5) * 2
      const value = calculateValue(t, osc)
      const y = height - (value / 127) * height
      ctx.lineTo(x, y)
    }
    
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fill()
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
      const value = calculateValue(currentTime, activeOscillator)
      setCurrentValue(value)

      oscillators.forEach((osc, index) => {
        const iconCanvas = waveformIconsRef.current[`${index}-${osc.waveform}`]
        if (iconCanvas) {
          const isActive = index === activeOscillatorIndex
          drawWaveformIcon(iconCanvas, osc, isActive, currentTime)
        }
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isRunning, activeOscillator, oscillators, activeOscillatorIndex])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      oscillators.forEach((osc, index) => {
        const key = `${index}-${osc.waveform}`
        const canvas = waveformIconsRef.current[key]
        if (canvas && canvas.parentElement) {
          const rect = canvas.parentElement.getBoundingClientRect()
          canvas.width = rect.width
          canvas.height = rect.height
          const isActive = index === activeOscillatorIndex
          drawWaveformIcon(canvas, osc, isActive)
        }
      })
    })

    oscillators.forEach((osc, index) => {
      const key = `${index}-${osc.waveform}`
      const canvas = waveformIconsRef.current[key]
      if (canvas && canvas.parentElement) {
        resizeObserver.observe(canvas.parentElement)
      }
    })

    return () => {
      resizeObserver.disconnect()
    }
  }, [activeOscillatorIndex, oscillators])
  
  const handleSlotClick = (index: number) => {
    setActiveOscillatorIndex(index)
    setOpenDropdownIndex(null)
  }
  
  const handleSlotDoubleClick = (index: number) => {
    if (openDropdownIndex === index) {
      setOpenDropdownIndex(null)
    } else {
      setOpenDropdownIndex(index)
    }
  }
  
  const handleSlotSelect = (slotIndex: number, newWaveform: Waveform) => {
    const newOscillators = [...oscillators]
    newOscillators[slotIndex] = { ...newOscillators[slotIndex], waveform: newWaveform }
    setOscillators(newOscillators)
    setActiveOscillatorIndex(slotIndex)
    setOpenDropdownIndex(null)
  }
  
  const updateActiveOscillator = (updates: Partial<Oscillator>) => {
    const newOscillators = [...oscillators]
    newOscillators[activeOscillatorIndex] = { ...newOscillators[activeOscillatorIndex], ...updates }
    setOscillators(newOscillators)
  }

  return (
    <div className="app">
      <div className="controls">
        <div className="control-group">
          <label>Waveform</label>
          <div className="waveform-selector">
            {oscillators.map((osc, index) => (
              <div key={index} className="waveform-slot">
                <button 
                  className={activeOscillatorIndex === index ? 'active' : ''}
                  onClick={() => handleSlotClick(index)}
                  onDoubleClick={() => handleSlotDoubleClick(index)}
                >
                  <canvas 
                    ref={(el) => { if (el) waveformIconsRef.current[`${index}-${osc.waveform}`] = el }}
                  />
                </button>
                {openDropdownIndex === index && (
                  <div className="waveform-dropdown">
                    {allWaveforms.map((waveType) => (
                      <button
                        key={waveType}
                        className="dropdown-item"
                        onClick={() => handleSlotSelect(index, waveType)}
                      >
                        <canvas 
                          ref={(el) => { 
                            if (el && el.parentElement) {
                              const rect = el.parentElement.getBoundingClientRect()
                              el.width = rect.width
                              el.height = rect.height
                              const tempOsc = { ...osc, waveform: waveType }
                              drawWaveformIcon(el, tempOsc, false)
                            }
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="control-group">
          <label>Rate: {activeOscillator.rate.toFixed(2)} Hz</label>
          <input
            type="range"
            min="0.1"
            max="10"
            step="0.1"
            value={activeOscillator.rate}
            onChange={(e) => updateActiveOscillator({ rate: parseFloat(e.target.value) })}
            onDoubleClick={() => updateActiveOscillator({ rate: 1.0 })}
          />
        </div>

        <div className="control-group">
          <label>Min: {activeOscillator.min}</label>
          <input
            type="range"
            min="0"
            max="127"
            step="1"
            value={activeOscillator.min}
            onChange={(e) => updateActiveOscillator({ min: parseInt(e.target.value) })}
            onDoubleClick={() => updateActiveOscillator({ min: 0 })}
          />
        </div>

        <div className="control-group">
          <label>Max: {activeOscillator.max}</label>
          <input
            type="range"
            min="0"
            max="127"
            step="1"
            value={activeOscillator.max}
            onChange={(e) => updateActiveOscillator({ max: parseInt(e.target.value) })}
            onDoubleClick={() => updateActiveOscillator({ max: 127 })}
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
