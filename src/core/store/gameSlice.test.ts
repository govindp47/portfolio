import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createGameSlice, type GameSlice } from './gameSlice'

const makeStore = () =>
  create<GameSlice>()((...args) => ({ ...createGameSlice(...args) }))

describe('gameSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    useStore = makeStore()
  })

  it('unlockZone appends to unlockedZones and increments explorationLevel', () => {
    useStore.getState().unlockZone('memory-vault')
    expect(useStore.getState().unlockedZones).toContain('memory-vault')
    expect(useStore.getState().explorationLevel).toBe(1)
  })

  it('unlockZone duplicate call is a no-op', () => {
    useStore.getState().unlockZone('memory-vault')
    useStore.getState().unlockZone('memory-vault')
    expect(useStore.getState().unlockedZones).toHaveLength(1)
    expect(useStore.getState().explorationLevel).toBe(1)
  })

  it('dismissChallenge appends challengeId', () => {
    useStore.getState().dismissChallenge('c-001')
    expect(useStore.getState().dismissedChallenges).toContain('c-001')
  })

  it('dismissChallenge duplicate call is a no-op', () => {
    useStore.getState().dismissChallenge('c-001')
    useStore.getState().dismissChallenge('c-001')
    expect(useStore.getState().dismissedChallenges).toHaveLength(1)
  })
})