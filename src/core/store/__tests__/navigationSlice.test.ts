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

describe('navigationSlice — integration: navigation state machine (Doc 08 §4.1)', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('full navigation cycle: A → B → onTransitionComplete → C', () => {
    useStore.getState().navigateTo('memory-vault')
    expect(useStore.getState().isTransitioning).toBe(true)
    expect(useStore.getState().activeZone).toBe('memory-vault')

    useStore.getState().onTransitionComplete()
    expect(useStore.getState().isTransitioning).toBe(false)

    useStore.getState().navigateTo('neural-graph')
    expect(useStore.getState().activeZone).toBe('neural-graph')
    expect(useStore.getState().isTransitioning).toBe(true)
    expect(useStore.getState().previousZone).toBe('memory-vault')
  })

  it('navigate to every zone from control-room: each results in correct activeZone', () => {
    const zones = [
      'memory-vault',
      'neural-graph',
      'timeline-tunnel',
      'arena',
      'gateway',
    ] as const

    for (const zone of zones) {
      useStore = makeStore()
      useStore.getState().navigateTo(zone)
      expect(useStore.getState().activeZone).toBe(zone)
    }
  })

  it('previousZone tracks last zone before transition', () => {
    useStore.getState().navigateTo('arena')
    useStore.getState().onTransitionComplete()
    useStore.getState().navigateTo('gateway')
    expect(useStore.getState().previousZone).toBe('arena')
  })

  it('navigateTo same zone while not transitioning: isTransitioning stays false', () => {
    useStore.getState().navigateTo('control-room')
    expect(useStore.getState().isTransitioning).toBe(false)
  })

  it('rapid calls during transition: only first navigateTo is applied', () => {
    useStore.getState().navigateTo('memory-vault')
    useStore.getState().navigateTo('arena')
    useStore.getState().navigateTo('gateway')
    expect(useStore.getState().activeZone).toBe('memory-vault')
    expect(useStore.getState().isTransitioning).toBe(true)
  })

  it('onTransitionComplete when not transitioning: isTransitioning stays false (idempotent)', () => {
    expect(useStore.getState().isTransitioning).toBe(false)
    useStore.getState().onTransitionComplete()
    expect(useStore.getState().isTransitioning).toBe(false)
  })
})

describe('navigationSlice — integration: overlay stack (Doc 08 §4.3)', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('open and close terminal: stack returns to empty', () => {
    useStore.getState().openOverlay('terminal')
    expect(useStore.getState().overlayStack).toEqual(['terminal'])
    useStore.getState().closeOverlay('terminal')
    expect(useStore.getState().overlayStack).toEqual([])
  })

  it('open terminal then quiz-modal: terminal is removed, quiz-modal is in stack', () => {
    useStore.getState().openOverlay('terminal')
    useStore.getState().openOverlay('quiz-modal')
    const stack = useStore.getState().overlayStack
    expect(stack).not.toContain('terminal')
    expect(stack).toContain('quiz-modal')
  })

  it('open quiz-modal without terminal: terminal not affected', () => {
    useStore.getState().openOverlay('quiz-modal')
    expect(useStore.getState().overlayStack).toEqual(['quiz-modal'])
  })

  it('open same overlay twice: overlay appears twice in stack', () => {
    useStore.getState().openOverlay('terminal')
    useStore.getState().openOverlay('terminal')
    expect(useStore.getState().overlayStack).toEqual(['terminal', 'terminal'])
  })

  it('closeOverlay removes only the first matching entry', () => {
    useStore.getState().openOverlay('terminal')
    useStore.getState().openOverlay('terminal')
    useStore.getState().closeOverlay('terminal')
    // filter removes ALL matching — both gone (implementation uses filter, not splice)
    expect(useStore.getState().overlayStack).toEqual([])
  })

  it('navigation is independent of overlay stack — both can be active simultaneously', () => {
    useStore.getState().navigateTo('arena')
    useStore.getState().openOverlay('terminal')
    expect(useStore.getState().activeZone).toBe('arena')
    expect(useStore.getState().overlayStack).toContain('terminal')
    expect(useStore.getState().isTransitioning).toBe(true)
  })
})