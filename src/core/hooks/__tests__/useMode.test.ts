import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMode } from '../useMode'
import { useStore } from '@/core/store/index'
import type { UserMode } from '@/core/types/modes'

describe('useMode', () => {
  const MODES: UserMode[] = ['explorer', 'recruiter', 'deep', 'safe']

  it('returns capabilities for every valid UserMode', () => {
    MODES.forEach((mode) => {
      act(() => { useStore.setState({ activeMode: mode }) })
      const { result } = renderHook(() => useMode())
      expect(result.current.capabilities).toBeDefined()
      expect(typeof result.current.capabilities.ambientActive).toBe('boolean')
      expect(typeof result.current.capabilities.gameLayerActive).toBe('boolean')
      expect(typeof result.current.capabilities.animationsEnabled).toBe('boolean')
      expect(['full', 'reduced', 'minimal', 'none']).toContain(
        result.current.capabilities.animationLevel
      )
    })
  })

  it('explorer mode has game layer and ambient active', () => {
    act(() => { useStore.setState({ activeMode: 'explorer' }) })
    const { result } = renderHook(() => useMode())
    expect(result.current.capabilities.gameLayerActive).toBe(true)
    expect(result.current.capabilities.ambientActive).toBe(true)
    expect(result.current.capabilities.animationLevel).toBe('full')
  })

  it('safe mode disables all visual features', () => {
    act(() => { useStore.setState({ activeMode: 'safe' }) })
    const { result } = renderHook(() => useMode())
    expect(result.current.capabilities.gameLayerActive).toBe(false)
    expect(result.current.capabilities.ambientActive).toBe(false)
    expect(result.current.capabilities.animationsEnabled).toBe(false)
    expect(result.current.capabilities.animationLevel).toBe('none')
  })
})