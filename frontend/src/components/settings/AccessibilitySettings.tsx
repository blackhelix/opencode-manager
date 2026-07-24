import { useState, useEffect, useCallback, useRef } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { Loader2 } from 'lucide-react'
import { DEFAULT_PUSH_TO_TALK_CONFIG } from '@/api/types/settings'

const formatKeyDisplay = (key: string): string => {
  if (key === ' ') return 'Space'
  if (key === 'ArrowUp') return 'Up'
  if (key === 'ArrowDown') return 'Down'
  if (key === 'ArrowLeft') return 'Left'
  if (key === 'ArrowRight') return 'Right'
  if (key === 'Enter') return 'Return'
  if (key === 'Escape') return 'Esc'
  if (key === 'Tab') return 'Tab'
  if (key === 'Backspace') return 'Backspace'
  if (key === 'Delete') return 'Delete'
  if (key.length === 1) return key.toUpperCase()
  
  // Handle modifier keys with left/right - display nicely
  if (key === 'RightCtrl') return 'Right Ctrl'
  if (key === 'LeftCtrl') return 'Left Ctrl'
  if (key === 'RightShift') return 'Right Shift'
  if (key === 'LeftShift') return 'Left Shift'
  if (key === 'RightAlt') return 'Right Alt'
  if (key === 'LeftAlt') return 'Left Alt'
  if (key === 'RightMeta') return 'Right Meta'
  if (key === 'LeftMeta') return 'Left Meta'
  
  return key
}

const getKeyFromEvent = (e: KeyboardEvent): string => {
  const { key, location } = e
  
  // Handle modifier keys with left/right detection - match hook's expected format
  if (key === 'Control') return location === 2 ? 'RightCtrl' : 'LeftCtrl'
  if (key === 'Shift') return location === 2 ? 'RightShift' : 'LeftShift'
  if (key === 'Alt') return location === 2 ? 'RightAlt' : 'LeftAlt'
  if (key === 'Meta') return location === 2 ? 'RightMeta' : 'LeftMeta'
  
  if (key === ' ') return ' '
  if (key === 'ArrowUp') return 'ArrowUp'
  if (key === 'ArrowDown') return 'ArrowDown'
  if (key === 'ArrowLeft') return 'ArrowLeft'
  if (key === 'ArrowRight') return 'ArrowRight'
  if (key === 'Enter') return 'Enter'
  if (key === 'Escape') return 'Escape'
  if (key === 'Tab') return 'Tab'
  if (key === 'Backspace') return 'Backspace'
  if (key === 'Delete') return 'Delete'
  if (key.length === 1) return key.toUpperCase()
  
  return key
}

export function AccessibilitySettings() {
  const { preferences, isLoading, updateSettings } = useSettings()
  const ptt = preferences?.pushToTalk
  const [recordingPttKey, setRecordingPttKey] = useState(false)
  const [pttKeyDisplay, setPttKeyDisplay] = useState<string>('')

  const getPttWithDefaults = (overrides: Partial<typeof DEFAULT_PUSH_TO_TALK_CONFIG>) => ({
    enabled: overrides.enabled ?? ptt?.enabled ?? DEFAULT_PUSH_TO_TALK_CONFIG.enabled,
    key: overrides.key ?? ptt?.key ?? DEFAULT_PUSH_TO_TALK_CONFIG.key,
    soundOnStart: overrides.soundOnStart ?? ptt?.soundOnStart ?? DEFAULT_PUSH_TO_TALK_CONFIG.soundOnStart,
    soundOnStop: overrides.soundOnStop ?? ptt?.soundOnStop ?? DEFAULT_PUSH_TO_TALK_CONFIG.soundOnStop,
    soundOnInsert: overrides.soundOnInsert ?? ptt?.soundOnInsert ?? DEFAULT_PUSH_TO_TALK_CONFIG.soundOnInsert,
  })

  const currentKey = ptt?.key ?? DEFAULT_PUSH_TO_TALK_CONFIG.key
  const displayKey = pttKeyDisplay || formatKeyDisplay(currentKey)

  const stopRecording = useCallback(() => {
    setRecordingPttKey(false)
    setPttKeyDisplay('')
  }, [])

  const updateSettingsRef = useRef(updateSettings)
  updateSettingsRef.current = updateSettings

  useEffect(() => {
    if (!recordingPttKey) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      
      const key = getKeyFromEvent(e)
      setPttKeyDisplay(formatKeyDisplay(key))
      
      updateSettingsRef.current({
        pushToTalk: getPttWithDefaults({ key })
      })
      
      stopRecording()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [recordingPttKey, stopRecording])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Accessibility</h2>

      {/* Push to Talk Section */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="text-base font-medium text-foreground">Push to Talk (STT)</h3>
        <p className="text-sm text-muted-foreground">
          Hold a key to record, release to send transcription to the prompt input.
        </p>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ptt?.enabled ?? DEFAULT_PUSH_TO_TALK_CONFIG.enabled}
            onChange={(e) =>
              updateSettings({ pushToTalk: getPttWithDefaults({ enabled: e.target.checked }) })
            }
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">Enable Push to Talk</span>
        </label>

        <div className="flex items-center gap-3">
          <label className="text-sm text-foreground w-32">Key:</label>
          {recordingPttKey ? (
            <button
              className="px-3 py-1.5 bg-primary/20 border border-primary/50 hover:border-primary rounded text-sm font-mono text-foreground transition-colors w-32 text-center"
              onClick={stopRecording}
            >
              Press key...
            </button>
          ) : (
            <button
              onClick={() => setRecordingPttKey(true)}
              className="px-3 py-1.5 bg-accent border border-border hover:border-border rounded text-sm font-mono transition-colors w-32 text-center text-foreground"
            >
              {displayKey}
            </button>
          )}
          <span className="text-xs text-muted-foreground">Click to assign a key</span>
        </div>

        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-foreground">Sound notifications:</p>
          {([
            { key: 'soundOnStart' as const, label: 'When recording starts' },
            { key: 'soundOnStop' as const, label: 'When recording stops' },
            { key: 'soundOnInsert' as const, label: 'When text is inserted' },
          ]).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={ptt?.[key] ?? DEFAULT_PUSH_TO_TALK_CONFIG[key]}
                onChange={(e) =>
                  updateSettings({ pushToTalk: getPttWithDefaults({ [key]: e.target.checked }) })
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-muted-foreground">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Note */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-base font-medium text-foreground mb-2">Keyboard Shortcuts</h3>
        <p className="text-sm text-muted-foreground">
          Configure Focus Prompt Input, TTS Play/Pause/Interrupt shortcuts in the{' '}
          <span className="font-medium text-foreground">Shortcuts</span> tab.
        </p>
      </div>
    </div>
  )
}