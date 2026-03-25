import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ── Store mock ────────────────────────────────────────────────────────────────

let mockMode    = 'explorer'
let mockUnlocked: string[] = []
let mockLevel   = 0

vi.mock('@/core/hooks/useStore', () => ({
  useStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeMode:        mockMode,
      unlockedZones:     mockUnlocked,
      explorationLevel:  mockLevel,
      dismissedChallenges: [],
      dismissChallenge:  vi.fn(),
    })
  ),
}))

vi.mock('@/core/store/index', () => ({
  selectIsGameActive: (s: { activeMode: string }) => s.activeMode === 'explorer',
}))

vi.mock('@/core/utils/zoneRegistry', () => ({
  zoneRegistry: {
    'control-room':   { navLabel: 'Control' },
    'memory-vault':   { navLabel: 'Projects' },
    'neural-graph':   { navLabel: 'Skills' },
    'timeline-tunnel':{ navLabel: 'Timeline' },
    'arena':          { navLabel: 'Arena' },
    'gateway':        { navLabel: 'Contact' },
  },
}))

import GameHud from '../GameHud'

beforeEach(() => {
  mockMode     = 'explorer'
  mockUnlocked = []
  mockLevel    = 0
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('GameHud — visibility by mode', () => {
  it('renders in Explorer Mode', () => {
    mockMode = 'explorer'
    render(<GameHud />)
    expect(screen.getByText(/EXPLORATION LVL/i)).toBeTruthy()
  })

  it('returns null in Recruiter Mode', () => {
    mockMode = 'recruiter'
    const { container } = render(<GameHud />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null in Deep Mode', () => {
    mockMode = 'deep'
    const { container } = render(<GameHud />)
    expect(container.firstChild).toBeNull()
  })

  it('returns null in Safe Mode', () => {
    mockMode = 'safe'
    const { container } = render(<GameHud />)
    expect(container.firstChild).toBeNull()
  })
})

describe('GameHud — ExplorationLevel display', () => {
  it('shows explorationLevel and unlocked count', () => {
    mockLevel    = 3
    mockUnlocked = ['control-room', 'neural-graph', 'memory-vault']
    render(<GameHud />)
    expect(screen.getByText(/EXPLORATION LVL 3/)).toBeTruthy()
    expect(screen.getByText(/3 \/ 6 zones/)).toBeTruthy()
  })
})