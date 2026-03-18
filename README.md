# MIDI CC Oscillator

A minimal browser-based tool for generating MIDI CC values using oscillators.

## Features

- **Oscillator**: Single oscillator with real-time value generation
- **Waveforms**: Sine, Square, Triangle, and Sawtooth
- **Rate Control**: Adjust frequency from 0.1 to 10 Hz
- **Depth Control**: Set amplitude from 0 to 127
- **Offset Control**: Shift output from -64 to +64
- **Start/Stop**: Control oscillator playback
- **Visualization**: Animated waveform display with current value indicator
- **Output Display**: Real-time MIDI CC value (0-127)

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### Build for Production

```bash
npm run build
```

## Usage

1. Select a waveform type (Sine, Square, Triangle, or Sawtooth)
2. Adjust the Rate slider to control oscillation speed
3. Adjust the Depth slider to control the amplitude of the oscillation
4. Adjust the Offset slider to shift the center point of the oscillation
5. Click "Start" to begin generating values
6. Watch the waveform visualization and numeric output display

The output value ranges from 0 to 127, suitable for MIDI CC messages.

## Tech Stack

- React 19
- TypeScript
- Vite
- Canvas API for visualization

## Notes

This is a first pass implementation without Web MIDI integration. MIDI output can be added in future iterations.
