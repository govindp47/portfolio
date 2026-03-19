import { useRef, useEffect, useCallback, useState } from 'react'
import { useStore } from '@/core/hooks/useStore'
import { TerminalEntry } from './TerminalEntry'

const OVERSCAN = 5
const ESTIMATED_ENTRY_HEIGHT = 28

export default function TerminalHistory() {
  const history = useStore((s) => s.history)

  const scrollRef         = useRef<HTMLDivElement>(null)
  const heightCacheRef    = useRef<Map<number, number>>(new Map())
  const isAtBottomRef     = useRef(true)
  const prevLengthRef     = useRef(history.length)

  const [scrollTop,       setScrollTop]       = useState(0)
  const [containerHeight, setContainerHeight] = useState(400)

  // ── Flush height cache and reset scroll when history is cleared ───────────
  useEffect(() => {
    if (history.length === 0) {
      heightCacheRef.current.clear()
      setScrollTop(0)
      isAtBottomRef.current = true
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }
  }, [history.length])

  // ── ResizeObserver for container height ──────────────────────────────────
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerHeight(entries[0].contentRect.height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Auto-scroll on new entries ───────────────────────────────────────────
  useEffect(() => {
    if (history.length > prevLengthRef.current && isAtBottomRef.current) {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }
    prevLengthRef.current = history.length
  }, [history.length])

  // ── Track scroll position ────────────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollTop(el.scrollTop)
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8
    isAtBottomRef.current = atBottom
  }, [])

  // ── Compute virtualized window ───────────────────────────────────────────
  const heights = history.map((entry) =>
    heightCacheRef.current.get(entry.timestamp) ?? ESTIMATED_ENTRY_HEIGHT
  )
  const totalHeight = heights.reduce((s, h) => s + h, 0)

  let accumulated = 0
  let startIndex  = 0
  for (let i = 0; i < heights.length; i++) {
    if (accumulated + heights[i] >= scrollTop) { startIndex = i; break }
    accumulated += heights[i]
    startIndex = i + 1
  }

  const visibleStart = Math.max(0, startIndex - OVERSCAN)

  let visEnd    = visibleStart
  let visHeight = 0
  for (let i = visibleStart; i < history.length; i++) {
    visEnd = i
    visHeight += heights[i]
    if (visHeight > containerHeight + ESTIMATED_ENTRY_HEIGHT * OVERSCAN) break
  }
  const visibleEnd = Math.min(history.length - 1, visEnd + OVERSCAN)

  const topPadding = heights.slice(0, visibleStart).reduce((s, h) => s + h, 0)

  if (history.length === 0) {
    return (
      <div
        ref={scrollRef}
        style={{ height: '100%', overflowY: 'auto' }}
        role="log"
        aria-live="polite"
        aria-label="Terminal output"
      />
    )
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
      role="log"
      aria-live="polite"
      aria-label="Terminal output"
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: topPadding, left: 0, right: 0 }}>
          {history.slice(visibleStart, visibleEnd + 1).map((entry) => (
            <EntryMeasurer
              key={entry.timestamp}
              entry={entry}
              onHeight={(h) => { heightCacheRef.current.set(entry.timestamp, h) }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

interface EntryMeasurerProps {
  entry: Parameters<typeof TerminalEntry>[0]['entry']
  onHeight: (h: number) => void
}

function EntryMeasurer({ entry, onHeight }: EntryMeasurerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      onHeight(entries[0].contentRect.height || ESTIMATED_ENTRY_HEIGHT)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [onHeight])

  return (
    <div ref={ref}>
      <TerminalEntry entry={entry} />
    </div>
  )
}