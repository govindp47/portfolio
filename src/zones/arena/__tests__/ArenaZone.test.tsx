import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { ArenaProfile } from '@/core/types/content'

vi.mock('@/core/hooks/useContent', () => ({
  useArena: vi.fn(),
}))

vi.mock('@/core/hooks/useMode', () => ({
  useMode: vi.fn(),
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => <div {...rest}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

import { useArena } from '@/core/hooks/useContent'
import { useMode } from '@/core/hooks/useMode'
import ArenaZone from '../ArenaZone'

const MOCK_ARENA: ArenaProfile = {
  platforms: [
    { platform: 'LeetCode', rating: 1852, context: 'Knight', profileUrl: 'https://leetcode.com/test' },
  ],
  difficultyBreakdown: [
    { label: 'Easy',   count: 182, percentage: 53 },
    { label: 'Medium', count: 124, percentage: 37 },
    { label: 'Hard',   count: 34,  percentage: 10 },
  ],
  patterns: [
    {
      pattern: 'Dynamic Programming',
      count:   68,
      problemRefs: ['Coin Change II', 'Edit Distance'],
    },
    {
      pattern: 'Graph Traversal',
      count:   52,
      problemRefs: ['Number of Islands'],
    },
  ],
  featuredProblem: {
    title:            'Burst Balloons',
    platform:         'LeetCode',
    difficulty:       'Hard',
    problemStatement: 'Burst balloons to maximize coins.',
    approach:         'Interval DP — last balloon framing.',
    complexity:       { time: 'O(n³)', space: 'O(n²)' },
    keyInsight:       'Reframe from first-burst to last-burst.',
  },
  certifications: [
    {
      domain: 'Android Development',
      items: [
        { title: 'Associate Android Developer', issuer: 'Google', focus: 'Android SDK', year: 2023 },
      ],
    },
    {
      domain: 'Backend & Cloud',
      items: [
        { title: 'GCP Associate', issuer: 'Google Cloud', focus: 'Cloud infra', year: 2023 },
      ],
    },
  ],
}

function setupMocks() {
  vi.mocked(useArena).mockReturnValue(MOCK_ARENA)
  vi.mocked(useMode).mockReturnValue({
    activeMode: 'explorer',
    isMobile: false,
    capabilities: {
      ambientActive: true, gameLayerActive: true, animationsEnabled: true,
      animationLevel: 'full', miniMapAvailable: true,
    },
  })
}

describe('ArenaZone', () => {
  it('renders platform ratings', () => {
    setupMocks()
    render(<ArenaZone />)
    expect(screen.getByText('LeetCode')).toBeInTheDocument()
    expect(screen.getByText('1852')).toBeInTheDocument()
  })

  it('renders difficulty bars', () => {
    setupMocks()
    render(<ArenaZone />)
    expect(screen.getByTestId('bar-Easy')).toBeInTheDocument()
    expect(screen.getByTestId('bar-Medium')).toBeInTheDocument()
    expect(screen.getByTestId('bar-Hard')).toBeInTheDocument()
  })

  it('shows difficulty count tooltip on hover after 200ms', async () => {
    vi.useFakeTimers()
    setupMocks()
    render(<ArenaZone />)
    const easyRow = screen.getByTestId('bar-Easy').closest('div[style*="position: relative"]') as HTMLElement
    fireEvent.mouseEnter(easyRow)
    expect(screen.queryByTestId('tooltip-Easy')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(200) })
    expect(screen.getByTestId('tooltip-Easy')).toBeInTheDocument()
    expect(screen.getByTestId('tooltip-Easy').textContent).toContain('182')
    fireEvent.mouseLeave(easyRow)
    expect(screen.queryByTestId('tooltip-Easy')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('reveals problem refs on pattern click', () => {
    setupMocks()
    render(<ArenaZone />)
    const dpButton = screen.getByText('Dynamic Programming').closest('button') as HTMLElement
    expect(screen.queryByTestId('refs-Dynamic Programming')).not.toBeInTheDocument()
    fireEvent.click(dpButton)
    expect(screen.getByTestId('refs-Dynamic Programming')).toBeInTheDocument()
    expect(screen.getByText('Coin Change II')).toBeInTheDocument()
  })

  it('collapses pattern refs on second click', () => {
    setupMocks()
    render(<ArenaZone />)
    const dpButton = screen.getByText('Dynamic Programming').closest('button') as HTMLElement
    fireEvent.click(dpButton)
    expect(screen.getByTestId('refs-Dynamic Programming')).toBeInTheDocument()
    fireEvent.click(dpButton)
    expect(screen.queryByTestId('refs-Dynamic Programming')).not.toBeInTheDocument()
  })

  it('shows featured problem on deep dive toggle', () => {
    setupMocks()
    render(<ArenaZone />)
    expect(screen.queryByText('Burst Balloons')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTestId('deep-dive-toggle'))
    expect(screen.getByText('Burst Balloons')).toBeInTheDocument()
    expect(screen.getByText('O(n³)')).toBeInTheDocument()
  })

  it('hides featured problem on second toggle', () => {
    setupMocks()
    render(<ArenaZone />)
    fireEvent.click(screen.getByTestId('deep-dive-toggle'))
    expect(screen.getByText('Burst Balloons')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('deep-dive-toggle'))
    expect(screen.queryByText('Burst Balloons')).not.toBeInTheDocument()
  })

  it('certifications rendered in domain groups — never flat', () => {
    setupMocks()
    render(<ArenaZone />)
    expect(screen.getByTestId('cert-group-Android Development')).toBeInTheDocument()
    expect(screen.getByTestId('cert-group-Backend & Cloud')).toBeInTheDocument()
    // Items are inside groups
    expect(screen.getByText('Associate Android Developer')).toBeInTheDocument()
    expect(screen.getByText('GCP Associate')).toBeInTheDocument()
  })

  it('renders null guard when arena is null', () => {
    vi.mocked(useArena).mockReturnValue(null)
    vi.mocked(useMode).mockReturnValue({
      activeMode: 'explorer',
      isMobile: false,
      capabilities: { ambientActive: true, gameLayerActive: true, animationsEnabled: true, animationLevel: 'full', miniMapAvailable: true },
    })
    render(<ArenaZone />)
    expect(screen.getByText('No arena data available')).toBeInTheDocument()
  })
})