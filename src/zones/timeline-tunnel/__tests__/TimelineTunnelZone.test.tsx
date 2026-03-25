import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { TimelineEntry, Skill } from '@/core/types/content'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/core/hooks/useContent', () => ({
  useTimeline: vi.fn(),
  useSkills:   vi.fn(),
}))

vi.mock('@/core/hooks/useMode', () => ({
  useMode: vi.fn(),
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true, // skip animations in tests
}))

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...rest }: React.HTMLAttributes<HTMLDivElement>) =>
        <div {...rest}>{children}</div>,
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

import { useTimeline, useSkills } from '@/core/hooks/useContent'
import { useMode } from '@/core/hooks/useMode'
import TimelineTunnelZone from '../TimelineTunnelZone'

const MOCK_SKILLS: Skill[] = [
  {
    id: 'kotlin', label: 'Kotlin', type: 'language',
    mastery: 90, depth: 'expert', confidence: 90,
    description: '', projectRefs: [],
  },
  {
    id: 'go', label: 'Go', type: 'language',
    mastery: 74, depth: 'advanced', confidence: 74,
    description: '', projectRefs: [],
  },
]

const MOCK_TIMELINE: TimelineEntry[] = [
  {
    id: 'entry-a',
    type: 'work',
    organization: 'Acme Corp',
    role: 'Senior Engineer',
    duration: '2 years',
    startDate: '2023-01-01',
    endDate: null,
    highlights: ['Built feature A'],
    impact: ['Reduced latency by 30%'],
    technologies: ['kotlin', 'go'],
    isCurrent: true,
  },
  {
    id: 'entry-b',
    type: 'education',
    organization: 'State University',
    role: 'B.E. Computer Science',
    duration: '4 years',
    startDate: '2019-08-01',
    endDate: '2023-06-30',
    highlights: ['Graduated with distinction'],
    impact: [],
    technologies: ['go'],
    isCurrent: false,
  },
]

function setupMocks(mode: string = 'explorer') {
  vi.mocked(useTimeline).mockReturnValue(MOCK_TIMELINE)
  vi.mocked(useSkills).mockReturnValue(MOCK_SKILLS)
  vi.mocked(useMode).mockReturnValue({
    activeMode: mode as 'explorer' | 'recruiter' | 'deep' | 'safe',
    isMobile: false,
    capabilities: {
      ambientActive: mode === 'explorer',
      gameLayerActive: mode === 'explorer',
      animationsEnabled: true,
      animationLevel: 'full',
      miniMapAvailable: mode === 'explorer',
    },
  })
}

describe('TimelineTunnelZone', () => {
  it('renders entries from timeline data', () => {
    setupMocks('explorer')
    render(<TimelineTunnelZone />)
    expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    expect(screen.getByText('State University')).toBeInTheDocument()
  })

  it('renders entries in array order (pre-sorted descending)', () => {
    setupMocks('explorer')
    render(<TimelineTunnelZone />)
    const orgs = screen.getAllByText(/Acme Corp|State University/)
    expect(orgs[0].textContent).toBe('Acme Corp')
    expect(orgs[1].textContent).toBe('State University')
  })

  it('shows horizontal scroll layout in explorer mode', () => {
    setupMocks('explorer')
    render(<TimelineTunnelZone />)
    expect(screen.getByTestId('horizontal-scroll')).toBeInTheDocument()
  })

  it('shows horizontal scroll layout in deep mode', () => {
    setupMocks('deep')
    render(<TimelineTunnelZone />)
    expect(screen.getByTestId('horizontal-scroll')).toBeInTheDocument()
  })

  it('shows vertical stack layout in recruiter mode', () => {
    setupMocks('recruiter')
    render(<TimelineTunnelZone />)
    expect(screen.getByTestId('vertical-stack')).toBeInTheDocument()
  })

  it('shows vertical stack layout in safe mode', () => {
    setupMocks('safe')
    render(<TimelineTunnelZone />)
    expect(screen.getByTestId('vertical-stack')).toBeInTheDocument()
  })

  it('expands an entry on click and shows expanded content', () => {
    setupMocks('recruiter')
    render(<TimelineTunnelZone />)
    const card = screen.getByText('Acme Corp').closest('div[style*="cursor"]') as HTMLElement
    // Click to expand
    fireEvent.click(card)
    expect(screen.getByText('Built feature A')).toBeInTheDocument()
    expect(screen.getByText('Reduced latency by 30%')).toBeInTheDocument()
  })

  it('collapses expanded entry on second toggle', () => {
    setupMocks('recruiter')
    render(<TimelineTunnelZone />)
    const card = screen.getByText('Acme Corp').closest('div[style*="cursor"]') as HTMLElement
    fireEvent.click(card)
    expect(screen.getByText('Built feature A')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Collapse ▴'))
    expect(screen.queryByText('Built feature A')).not.toBeInTheDocument()
  })

  it('resolves technology IDs to labels', () => {
    setupMocks('recruiter')
    render(<TimelineTunnelZone />)
    const card = screen.getByText('Acme Corp').closest('div[style*="cursor"]') as HTMLElement
    fireEvent.click(card)
    // Technologies 'kotlin' and 'go' should resolve to 'Kotlin' and 'Go'
    expect(screen.getByText('Kotlin')).toBeInTheDocument()
    expect(screen.getByText('Go')).toBeInTheDocument()
  })

  it('shows "Present" for isCurrent: true entry', () => {
    setupMocks('recruiter')
    render(<TimelineTunnelZone />)
    expect(screen.getByText(/Present/)).toBeInTheDocument()
  })

  it('shows "No timeline data available" when timeline is empty', () => {
    vi.mocked(useTimeline).mockReturnValue([])
    vi.mocked(useSkills).mockReturnValue([])
    vi.mocked(useMode).mockReturnValue({
      activeMode: 'explorer',
      isMobile: false,
      capabilities: { ambientActive: true, gameLayerActive: true, animationsEnabled: true, animationLevel: 'full', miniMapAvailable: true },
    })
    render(<TimelineTunnelZone />)
    expect(screen.getByText('No timeline data available')).toBeInTheDocument()
  })
})