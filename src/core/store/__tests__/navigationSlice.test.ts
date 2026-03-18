import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import {
  createNavigationSlice,
  type NavigationSlice,
} from '../navigationSlice'

const makeStore = () => create<NavigationSlice>()((...args) => ({
  ...createNavigationSlice(...args),
}))

describe('navigationSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('initial state matches defined defaults', () => {
    const s = useStore.getState()
    expect(s.activeZone).toBe('control-room')
    expect(s.previousZone).toBeNull()
    expect(s.isTransitioning).toBe(false)
    expect(s.overlayStack).toEqual([])
    expect(s.miniMapOpen).toBe(false)
  })

  it('navigateTo different zone: updates activeZone, sets previousZone, sets isTransitioning', () => {
    useStore.getState().navigateTo('memory-vault')
    const s = useStore.getState()
    expect(s.activeZone).toBe('memory-vault')
    expect(s.previousZone).toBe('control-room')
    expect(s.isTransitioning).toBe(true)
  })

  it('navigateTo same zone: no state change', () => {
    const before = useStore.getState()
    useStore.getState().navigateTo('control-room')
    const after = useStore.getState()
    expect(after.isTransitioning).toBe(before.isTransitioning)
    expect(after.previousZone).toBe(before.previousZone)
  })

  it('navigateTo while isTransitioning: call is dropped', () => {
    useStore.getState().navigateTo('memory-vault')
    expect(useStore.getState().isTransitioning).toBe(true)
    useStore.getState().navigateTo('neural-graph')
    // Second call dropped — zone stays memory-vault
    expect(useStore.getState().activeZone).toBe('memory-vault')
  })

  it('onTransitionComplete: resets isTransitioning to false', () => {
    useStore.getState().navigateTo('memory-vault')
    expect(useStore.getState().isTransitioning).toBe(true)
    useStore.getState().onTransitionComplete()
    expect(useStore.getState().isTransitioning).toBe(false)
  })

  it('openOverlay terminal: overlayStack = ["terminal"]', () => {
    useStore.getState().openOverlay('terminal')
    expect(useStore.getState().overlayStack).toEqual(['terminal'])
  })

  it('openOverlay quiz-modal when terminal open: terminal removed, quiz-modal added', () => {
    useStore.getState().openOverlay('terminal')
    useStore.getState().openOverlay('quiz-modal')
    expect(useStore.getState().overlayStack).not.toContain('terminal')
    expect(useStore.getState().overlayStack).toContain('quiz-modal')
  })

  it('closeOverlay for ID not in stack: no state change', () => {
    useStore.getState().closeOverlay('terminal')
    expect(useStore.getState().overlayStack).toEqual([])
  })

  it('toggleMiniMap: flips miniMapOpen', () => {
    expect(useStore.getState().miniMapOpen).toBe(false)
    useStore.getState().toggleMiniMap()
    expect(useStore.getState().miniMapOpen).toBe(true)
    useStore.getState().toggleMiniMap()
    expect(useStore.getState().miniMapOpen).toBe(false)
  })
})