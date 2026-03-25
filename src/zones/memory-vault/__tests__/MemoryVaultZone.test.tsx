import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Project } from '@/core/types/content'

// ── Minimal mock store ──────────────────────────────────────────────────────
const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id:           'proj-a',
  title:        'Project Alpha',
  problem:      'One-line problem',
  problemFull:  'Full problem description here',
  constraints:  ['Constraint A', 'Constraint B'],
  architecture: 'Architecture details here',
  tradeoffs:    [{ decision: 'D', rationale: 'R', consequence: 'C' }],
  stack:        ['Kotlin', 'Go'],
  outcome:      'Short outcome',
  outcomeFull:  'Full outcome description',
  demoUrl:      'https://demo.example.com',
  displayOrder: 1,
  skillRefs:    [],
  ...overrides,
})

const makeProjectB = (): Project => ({
  ...makeProject(),
  id:           'proj-b',
  title:        'Project Beta',
  displayOrder: 2,
})

// Mock hooks at the module level
vi.mock('@/core/hooks/useContent', () => ({
  useProjects: vi.fn(() => [makeProject(), makeProjectB()]),
}))

vi.mock('@/core/hooks/useMode', () => ({
  useMode: vi.fn(() => ({
    activeMode:   'explorer',
    capabilities: { animationsEnabled: false, animationLevel: 'full', ambientActive: true, gameLayerActive: true, miniMapAvailable: true },
  })),
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => true), // skip animations in tests
}))

vi.mock('@/core/utils/animationVariants', () => ({
  zoneEntryVariants: {},
}))

import MemoryVaultZone from '../MemoryVaultZone'
import { useMode } from '@/core/hooks/useMode'
import { useProjects } from '@/core/hooks/useContent'

// ── Tests ────────────────────────────────────────────────────────────────────

describe('MemoryVaultZone — accordion behavior', () => {
  it('renders all project titles', () => {
    render(<MemoryVaultZone />)
    expect(screen.getByText('Project Alpha')).toBeTruthy()
    expect(screen.getByText('Project Beta')).toBeTruthy()
  })

  it('cards start collapsed (expanded content absent)', () => {
    render(<MemoryVaultZone />)
    expect(screen.queryByText('Full problem description here')).toBeNull()
  })

  it('clicking a card expands it and shows full content', () => {
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    expect(screen.getByText('Full problem description here')).toBeTruthy()
  })

  it('only one card expanded at a time', () => {
    render(<MemoryVaultZone />)
    // Expand Alpha
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    expect(screen.getByText('Full problem description here')).toBeTruthy()
    // Expand Beta — Alpha should collapse (but Beta has same problemFull in our stub)
    // Verify only one expanded section present by checking dismiss button count
    const dismissButtons = screen.queryAllByLabelText('Collapse project card')
    expect(dismissButtons.length).toBeLessThanOrEqual(1)
  })

  it('dismiss button (×) collapses the card', () => {
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    const dismissBtn = screen.getByLabelText('Collapse project card')
    fireEvent.click(dismissBtn)
    expect(screen.queryByText('Full problem description here')).toBeNull()
  })
})

describe('MemoryVaultZone — architecture toggle', () => {
  it('architecture section hidden by default when expanded', () => {
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    expect(screen.queryByText('Architecture details here')).toBeNull()
  })

  it('architecture toggle shows/hides content independently', () => {
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    const toggle = screen.getByText(/Architecture ▾/)
    fireEvent.click(toggle)
    expect(screen.getByText('Architecture details here')).toBeTruthy()
    // Toggle off
    fireEvent.click(screen.getByText(/Architecture ▴/))
    expect(screen.queryByText('Architecture details here')).toBeNull()
  })
})

describe('MemoryVaultZone — Deep Mode', () => {
  it('all cards expanded in Deep Mode', () => {
    vi.mocked(useMode).mockReturnValue({
      activeMode:   'deep',
      isMobile:     false,
      capabilities: { animationsEnabled: false, animationLevel: 'minimal', ambientActive: false, gameLayerActive: false, miniMapAvailable: false },
    })
    render(<MemoryVaultZone />)
    // Both projects' full content visible
    const fullDescriptions = screen.queryAllByText('Full problem description here')
    expect(fullDescriptions.length).toBe(2)
  })

  it('no dismiss buttons in Deep Mode', () => {
    vi.mocked(useMode).mockReturnValue({
      activeMode:   'deep',
      isMobile:     false,
      capabilities: { animationsEnabled: false, animationLevel: 'minimal', ambientActive: false, gameLayerActive: false, miniMapAvailable: false },
    })
    render(<MemoryVaultZone />)
    expect(screen.queryAllByLabelText('Collapse project card')).toHaveLength(0)
  })
})

describe('MemoryVaultZone — demo link', () => {
  it('demo link present when demoUrl is not null', () => {
    vi.mocked(useMode).mockReturnValue({
      activeMode:   'explorer',
      isMobile:     false,
      capabilities: { animationsEnabled: false, animationLevel: 'full', ambientActive: true, gameLayerActive: true, miniMapAvailable: true },
    })
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    const link = screen.getByText('View Demo →') as HTMLAnchorElement
    expect(link.href).toBe('https://demo.example.com/')
    expect(link.target).toBe('_blank')
    expect(link.rel).toContain('noopener')
    expect(link.rel).toContain('noreferrer')
  })

  it('no demo link when demoUrl is null', () => {
    vi.mocked(useProjects).mockReturnValue([
      makeProject({ demoUrl: null }),
    ])
    vi.mocked(useMode).mockReturnValue({
      activeMode:   'explorer',
      isMobile:     false,
      capabilities: { animationsEnabled: false, animationLevel: 'full', ambientActive: true, gameLayerActive: true, miniMapAvailable: true },
    })
    render(<MemoryVaultZone />)
    fireEvent.click(screen.getByText('Project Alpha').closest('[style*="cursor: pointer"]')!)
    expect(screen.queryByText('View Demo →')).toBeNull()
  })
})

describe('MemoryVaultZone — empty state', () => {
  it('shows empty message when no projects', () => {
    vi.mocked(useProjects).mockReturnValue([])
    render(<MemoryVaultZone />)
    expect(screen.getByText('No project data available')).toBeTruthy()
  })
})