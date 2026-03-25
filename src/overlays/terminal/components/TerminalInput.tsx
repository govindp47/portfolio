import { useState, useEffect, useRef, useCallback } from 'react'
import { MonoText } from '@/core/design-system/typography'
import { useStore } from '@/core/hooks/useStore'
import { useAutocomplete } from '../hooks/useAutocomplete'
import { useCommandDispatch } from '../hooks/useCommandDispatch'
import type { TerminalEntry } from '@/core/types/state'

export default function TerminalInput() {
  const isOpen              = useStore((s) => s.isOpen)
  const history             = useStore((s) => s.history)
  const addSuggestionOutput = useStore((s) => s.addSuggestionOutput)

  const [inputValue,   setInputValue]   = useState('')
  const [historyIndex, setHistoryIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const { getSuggestions, applyCompletion } = useAutocomplete()
  const { dispatch } = useCommandDispatch()

  // ── Auto-focus when terminal opens ─────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      // Small delay to let the slide animation start
      const id = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [isOpen])

  // ── Input entries for history navigation ────────────────────────────────
  const inputEntries: TerminalEntry[] = history.filter((e) => e.type === 'input')

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter': {
          e.preventDefault()
          dispatch(inputValue)
          setInputValue('')
          setHistoryIndex(-1)
          break
        }

        case 'Tab': {
          e.preventDefault()
          const trimmed = inputValue.trim()
          if (!trimmed) break
          const suggestions = getSuggestions(trimmed)
          if (suggestions.length === 0) break
          if (suggestions.length === 1) {
            setInputValue(applyCompletion(trimmed))
          } else {
            // Multiple matches — append disambiguation list to history
            addSuggestionOutput(suggestions.join('  '))
          }
          break
        }

        case 'ArrowUp': {
          e.preventDefault()
          const nextIdx = historyIndex + 1
          if (nextIdx >= inputEntries.length) break
          setHistoryIndex(nextIdx)
          // Navigate backwards (most recent first: last entry in array)
          const entry = inputEntries[inputEntries.length - 1 - nextIdx]
          if (entry) setInputValue(entry.content)
          break
        }

        case 'ArrowDown': {
          e.preventDefault()
          const prevIdx = historyIndex - 1
          if (prevIdx < 0) {
            setHistoryIndex(-1)
            setInputValue('')
            break
          }
          setHistoryIndex(prevIdx)
          const entry = inputEntries[inputEntries.length - 1 - prevIdx]
          if (entry) setInputValue(entry.content)
          break
        }

        default:
          break
      }
    },
    [inputValue, historyIndex, inputEntries, dispatch, getSuggestions, applyCompletion, addSuggestionOutput]
  )

  return (
    <div style={wrapperStyle}>
      {/* Prompt prefix */}
      <MonoText size="sm">
        <span style={{ color: 'var(--color-accent)', userSelect: 'none' }}>›&nbsp;</span>
      </MonoText>

      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Terminal command input"
        style={inputStyle}
      />
    </div>
  )
}

const wrapperStyle: React.CSSProperties = {
  display:    'flex',
  alignItems: 'center',
  padding:    'var(--space-2) var(--space-4)',
}

const inputStyle: React.CSSProperties = {
  flex:        1,
  background:  'transparent',
  border:      'none',
  outline:     'none',
  fontFamily:  'var(--font-mono)',
  fontSize:    'var(--text-sm)',
  color:       'var(--color-text-primary)',
  caretColor:  'var(--color-accent)',
}