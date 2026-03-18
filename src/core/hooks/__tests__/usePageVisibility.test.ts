import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePageVisibility } from '../usePageVisibility'

describe('usePageVisibility', () => {
  it('returns false when document.visibilityState is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'hidden',
      configurable: true,
    })
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe(false)
  })

  it('returns true when document.visibilityState is visible', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    const { result } = renderHook(() => usePageVisibility())
    expect(result.current).toBe(true)
  })

  it('updates on visibilitychange event', () => {
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })
    const { result } = renderHook(() => usePageVisibility())

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(false)
  })
})