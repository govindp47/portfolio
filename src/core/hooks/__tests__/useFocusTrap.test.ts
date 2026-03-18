import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement('div')
    const btn1 = document.createElement('button')
    btn1.textContent = 'First'
    const btn2 = document.createElement('button')
    btn2.textContent = 'Second'
    container.appendChild(btn1)
    container.appendChild(btn2)
    document.body.appendChild(container)
  })

  afterEach(() => {
    document.body.removeChild(container)
  })

  it('moves focus into container on activation', () => {
    const ref = { current: container }
    act(() => {
      renderHook(() => useFocusTrap(ref, true))
    })
    expect(document.activeElement).toBe(container.querySelectorAll('button')[0])
  })

  it('restores previous focus on deactivation', () => {
    const externalBtn = document.createElement('button')
    document.body.appendChild(externalBtn)
    externalBtn.focus()

    const ref = { current: container }
    let rerender: (props: { active: boolean }) => void

    act(() => {
      const result = renderHook(
        ({ active }) => useFocusTrap(ref, active),
        { initialProps: { active: true } }
      )
      rerender = result.rerender
    })

    act(() => {
      rerender({ active: false })
    })

    expect(document.activeElement).toBe(externalBtn)
    document.body.removeChild(externalBtn)
  })

  it('does not crash when container has no focusable elements', () => {
    const emptyContainer = document.createElement('div')
    document.body.appendChild(emptyContainer)
    const ref = { current: emptyContainer }
    expect(() => {
      act(() => {
        renderHook(() => useFocusTrap(ref, true))
      })
    }).not.toThrow()
    document.body.removeChild(emptyContainer)
  })
})