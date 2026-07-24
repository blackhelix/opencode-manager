let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  try {
    const ctx = getAudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playSound(type: 'start' | 'stop' | 'insert' | 'error'): void {
  switch (type) {
    case 'start':
      playTone(880, 0.15)    // High A5 — recording started
      break
    case 'stop':
      playTone(660, 0.2)     // E5 — recording stopped
      break
    case 'insert':
      // Double beep
      playTone(880, 0.1)
      setTimeout(() => playTone(880, 0.1), 120)
      break
    case 'error':
      playTone(220, 0.3, 'sawtooth')  // Low A3 — error
      break
  }
}
