import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

let mockDismissed: string[] = []
let mockIsGameActive = true
const mockDismissChallenge = vi.fn()

vi.mock('@/core/hooks/useStore', () => ({
  useStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      activeMode:          mockIsGameActive ? 'explorer' : 'recruiter',
      dismissedChallenges: mockDismissed,
      dismissChallenge:    mockDismissChallenge,
    })
  ),
}))

vi.mock('@/core/store/index', () => ({
  selectIsGameActive: (s: { activeMode: string }) => s.activeMode === 'explorer',
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

import { ChallengePrompt } from '../components/ChallengePrompt'

beforeEach(() => {
  mockDismissed   = []
  mockIsGameActive = true
  mockDismissChallenge.mockReset()
})

describe('ChallengePrompt — render conditions', () => {
  it('renders when game is active and challenge not dismissed', () => {
    render(
      <ChallengePrompt
        challengeId="test-challenge"
        message="Try this!"
        onDismiss={mockDismissChallenge}
      />
    )
    expect(screen.getByText('Try this!')).toBeTruthy()
  })

  it('does NOT render when game is inactive', () => {
    mockIsGameActive = false
    const { container } = render(
      <ChallengePrompt
        challengeId="test-challenge"
        message="Try this!"
        onDismiss={mockDismissChallenge}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('does NOT render when challenge is already dismissed', () => {
    mockDismissed = ['test-challenge']
    const { container } = render(
      <ChallengePrompt
        challengeId="test-challenge"
        message="Try this!"
        onDismiss={mockDismissChallenge}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  it('calling onDismiss fires the dismiss callback', () => {
    render(
      <ChallengePrompt
        challengeId="test-challenge"
        message="Try this!"
        onDismiss={mockDismissChallenge}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(mockDismissChallenge).toHaveBeenCalledOnce()
  })
})