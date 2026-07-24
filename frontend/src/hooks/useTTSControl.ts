import { useCallback, useRef } from 'react'
import { useTTS } from './useTTS'
import type { MessageWithParts } from '@/api/types'

interface UseTTSControlOptions {
  messages: MessageWithParts[]
}

export function useTTSControl({ messages }: UseTTSControlOptions) {
  const { speak, stop, state } = useTTS()
  const wasInterruptedRef = useRef(false)

  const getLastAssistantText = useCallback((): { id: string; text: string } | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.info?.role === 'assistant' && msg.parts?.length) {
        const text = msg.parts
          .filter(part => part.type === 'text')
          .map(part => (part as { text: string }).text)
          .join('\n')
          .trim()
        if (text) return { id: msg.info.id, text }
      }
    }
    return null
  }, [messages])

  const handlePlay = useCallback(() => {
    if (state === 'playing' && !wasInterruptedRef.current) {
      // Already playing, stop + play from start
      stop()
      wasInterruptedRef.current = true
      return
    }

    if (state === 'playing' && wasInterruptedRef.current) {
      // Was interrupted, restart from beginning
      stop()
      wasInterruptedRef.current = false
      const last = getLastAssistantText()
      if (last) speak(last.text)
      return
    }

    // Not playing — start
    wasInterruptedRef.current = false
    const last = getLastAssistantText()
    if (last) speak(last.text)
  }, [state, stop, speak, getLastAssistantText])

  const handlePause = useCallback(() => {
    if (state === 'playing') {
      stop()
      // Keep wasInterruptedRef false — this indicates pause, not interrupt
    }
  }, [state, stop])

  const handleInterrupt = useCallback(() => {
    stop()
    wasInterruptedRef.current = true
  }, [stop])

  return {
    handlePlay,
    handlePause,
    handleInterrupt,
    hasAssistantMessage: !!getLastAssistantText(),
  }
}