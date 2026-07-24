import { useEffect, useRef } from 'react'
import { useSettings } from './useSettings'
import { playSound } from '@/lib/soundNotifications'

interface UsePushToTalkOptions {
  startRecording: () => void
  stopRecording: () => void
  isRecording: boolean
  transcript: string
}

export function usePushToTalk({ startRecording, stopRecording, isRecording, transcript }: UsePushToTalkOptions) {
  const { preferences } = useSettings()
  const pttConfig = preferences?.pushToTalk
  const pttKey = pttConfig?.key || 'RightCtrl'
  const pttEnabled = pttConfig?.enabled ?? false

  // Refs to avoid stale closures in event handlers
  const isRecordingRef = useRef(isRecording)
  isRecordingRef.current = isRecording
  const startRef = useRef(startRecording)
  startRef.current = startRecording
  const stopRef = useRef(stopRecording)
  stopRef.current = stopRecording
  const pttConfigRef = useRef(pttConfig)
  pttConfigRef.current = pttConfig

  const isHoldingRef = useRef(false)
  const justStoppedRef = useRef(false)
  const lastSentTranscriptRef = useRef('')

  const isKeyMatch = (e: KeyboardEvent, key: string): boolean => {
    // Handle modifier keys with left/right detection
    if (key === 'RightCtrl' || key === 'LeftCtrl') {
      return e.key === 'Control' && e.location === (key === 'RightCtrl' ? 2 : 1)
    }
    if (key === 'RightShift' || key === 'LeftShift') {
      return e.key === 'Shift' && e.location === (key === 'RightShift' ? 2 : 1)
    }
    if (key === 'RightAlt' || key === 'LeftAlt') {
      return e.key === 'Alt' && e.location === (key === 'RightAlt' ? 2 : 1)
    }
    if (key === 'RightMeta' || key === 'LeftMeta') {
      return e.key === 'Meta' && e.location === (key === 'RightMeta' ? 2 : 1)
    }
    const eventKey = e.key === ' ' ? 'Space' : e.key
    // Normalize both to same case for comparison (e.key returns lowercase for letters)
    return eventKey.toLowerCase() === key.toLowerCase()
  }

  useEffect(() => {
    if (!pttEnabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true'
      if (isInInput) return

      if (!isKeyMatch(e, pttKey)) return

      // Determine if PTT key itself is a modifier
      const pttIsModifier = ['RightCtrl', 'LeftCtrl', 'RightShift', 'LeftShift', 'RightAlt', 'LeftAlt', 'RightMeta', 'LeftMeta'].includes(pttKey)

      // If PTT is NOT a modifier, block any modifier combination (e.g., Ctrl+Space when PTT is Space)
      if (!pttIsModifier && (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)) return

      // If the key pressed IS a modifier but PTT is not a modifier, block
      const pressedIsModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)
      if (pressedIsModifier && !pttIsModifier) return

      if (!isHoldingRef.current && !isRecordingRef.current) {
        e.preventDefault()
        isHoldingRef.current = true
        justStoppedRef.current = false
        lastSentTranscriptRef.current = ''
        startRef.current()
        const config = pttConfigRef.current
        if (config?.soundOnStart) playSound('start')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isKeyMatch(e, pttKey) || !isHoldingRef.current) return

      isHoldingRef.current = false
      if (isRecordingRef.current) {
        stopRef.current()
        justStoppedRef.current = true
        const config = pttConfigRef.current
        if (config?.soundOnStop) playSound('stop')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      if (isHoldingRef.current && isRecordingRef.current) {
        stopRef.current()
      }
      isHoldingRef.current = false
    }
    // Intentionally NOT including isRecording in deps — refs handle freshness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pttEnabled, pttKey])

  // Play sound on transcript insertion
  useEffect(() => {
    if (justStoppedRef.current && !isRecording && transcript && transcript !== lastSentTranscriptRef.current) {
      justStoppedRef.current = false
      lastSentTranscriptRef.current = transcript
      const config = pttConfigRef.current
      if (config?.soundOnInsert && transcript.trim()) {
        playSound('insert')
      }
    }
  }, [transcript, isRecording])
}