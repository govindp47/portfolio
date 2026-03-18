import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotion } from '../useReducedMotion'
import { useStore } from '@/core/store/index'

vi.mock('framer-motion', () => ({
  useReducedMotion: vi.fn(),
}))

import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'

describe('useReducedMotion', () => {
  it('returns true when activeMode is "safe", regardless of OS preference', () => {
    vi.mocked(useFramerReducedMotion).mockReturnValue(false)
    useStore.setState({ activeMode: 'safe' })
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns true when OS prefers reduced motion', () => {
    vi.mocked(useFramerReducedMotion).mockReturnValue(true)
    useStore.setState({ activeMode: 'explorer' })
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false when OS does not prefer reduced and mode is not safe', () => {
    vi.mocked(useFramerReducedMotion).mockReturnValue(false)
    useStore.setState({ activeMode: 'explorer' })
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })
})