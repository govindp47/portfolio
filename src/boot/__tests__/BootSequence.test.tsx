import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import BootSequence from '../BootSequence'
import { BOOT_LINES } from '../bootLines'

// Mock useReducedMotion
vi.mock('@/core/hooks/useReducedMotion', () => ({ useReducedMotion: vi.fn(() => false) }))

import { useReducedMotion } from '@/core/hooks/useReducedMotion'

const mockUseReducedMotion = useReducedMotion as ReturnType<typeof vi.fn>

describe('BootSequence', () => {
  let onComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onComplete = vi.fn()
    vi.useFakeTimers()
    mockUseReducedMotion.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders the overlay on mount', () => {
    render(<BootSequence onComplete={onComplete} />)
    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('reveals lines over time and eventually calls onComplete', () => {
    render(<BootSequence onComplete={onComplete} />)
    // No lines initially
    expect(screen.queryByText(BOOT_LINES[0])).not.toBeInTheDocument()

    // Advance past scanline (600ms) + all lines (15 × 100ms = 1500ms)
    act(() => { vi.advanceTimersByTime(600 + BOOT_LINES.length * 100 + 400 + 300) })

    expect(screen.getByText(BOOT_LINES[BOOT_LINES.length - 1])).toBeInTheDocument()
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires onComplete immediately when skip is clicked', () => {
    render(<BootSequence onComplete={onComplete} />)
    const skipBtn = screen.getByRole('button', { name: /skip/i })
    fireEvent.click(skipBtn)
    act(() => { vi.advanceTimersByTime(200) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('prefers-reduced-motion: shows all lines immediately and fires onComplete after 500ms', () => {
    mockUseReducedMotion.mockReturnValue(true)
    render(<BootSequence onComplete={onComplete} />)

    BOOT_LINES.forEach((line) => {
      expect(screen.getByText(line)).toBeInTheDocument()
    })

    expect(onComplete).not.toHaveBeenCalled()
    // Advance past: REDUCED_HOLD_MS(500) + FADEOUT_DURATION_MS(200) + 50ms buffer
    act(() => { vi.advanceTimersByTime(800) })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})