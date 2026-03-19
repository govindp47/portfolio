import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act, fireEvent } from '@testing-library/react'
import type { SystemMeta } from '@/core/types/content'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigateTo        = vi.fn()
const mockDismissGuidedFlow = vi.fn()

const mockMeta: SystemMeta = {
  name:    'Govind',
  version: '3.0',
  role:    'Software Engineer — Android & Backend',
  stack:   'Kotlin | Android | Go | TypeScript',
  metrics: [
    { label: 'Projects Deployed', value: '12+', tooltip: 'Production apps shipped' },
    { label: 'Years Experience',  value: '3+',  tooltip: 'Professional experience' },
    { label: 'Problems Solved',   value: '340+', tooltip: 'Competitive programming' },
  ],
  contact: { email: 'govind@govindos.dev', preferCopy: true },
  links:   { github: 'https://github.com/govind-kumarr', linkedin: 'https://linkedin.com/in/govind-kumarr' },
  resumeAssetPath: '/resume.pdf',
}

let mockGuidedFlowDismissed = false
let mockIsTransitioning     = false
let mockMetaValue: SystemMeta | null = mockMeta

vi.mock('@/core/hooks/useContent', () => ({
  useMeta:      () => mockMetaValue,
  useProjects:  () => [],
  useSkills:    () => [],
  useEdges:     () => [],
  useTimeline:  () => [],
  useArena:     () => null,
}))

vi.mock('@/core/hooks/useNavigate', () => ({
  useNavigate: () => ({
    navigateTo:      mockNavigateTo,
    activeZone:      'control-room',
    isTransitioning: mockIsTransitioning,
  }),
}))

vi.mock('@/core/hooks/useMode', () => ({
  useMode: () => ({
    activeMode:   'explorer',
    isMobile:     false,
    capabilities: {
      ambientActive:     true,
      gameLayerActive:   true,
      animationsEnabled: true,
      animationLevel:    'full',
      miniMapAvailable:  true,
    },
  }),
}))

vi.mock('@/core/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false),
}))

vi.mock('@/core/hooks/useStore', () => ({
  useStore: vi.fn((selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      guidedFlowDismissed: mockGuidedFlowDismissed,
      dismissGuidedFlow:   mockDismissGuidedFlow,
    })
  ),
}))

import { useReducedMotion } from '@/core/hooks/useReducedMotion'
const mockUseReducedMotion = useReducedMotion as ReturnType<typeof vi.fn>

import ControlRoomZone from '../ControlRoomZone'

function renderZone() {
  return render(<ControlRoomZone />)
}

describe('ControlRoomZone', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockUseReducedMotion.mockReturnValue(false)
    mockMetaValue           = mockMeta
    mockGuidedFlowDismissed = false
    mockIsTransitioning     = false
    vi.clearAllMocks()
    mockUseReducedMotion.mockReturnValue(false)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── Identity & meta ────────────────────────────────────────────────────────
  it('renders name, version, role, and stack from meta', () => {
    renderZone()
    expect(screen.getByText('Govind')).toBeInTheDocument()
    expect(screen.getByText('v3.0')).toBeInTheDocument()
    expect(screen.getByText('Software Engineer — Android & Backend')).toBeInTheDocument()
    expect(screen.getByText('Kotlin | Android | Go | TypeScript')).toBeInTheDocument()
  })

  it('renders skeleton when meta is null', () => {
    mockMetaValue = null
    renderZone()
    expect(screen.queryByText('Govind')).not.toBeInTheDocument()
    expect(screen.queryByText('STATUS: RUNNING')).not.toBeInTheDocument()
  })

  // ── Status badge ───────────────────────────────────────────────────────────
  it('status badge has pulse class on mount', () => {
    renderZone()
    const badge = screen.getByText(/STATUS: RUNNING/)
    expect(badge.closest('.status-pulse')).not.toBeNull()
  })

  it('status badge pulse class removed after 3000ms', () => {
    renderZone()
    act(() => { vi.advanceTimersByTime(3100) })
    const badge = screen.getByText(/STATUS: RUNNING/)
    expect(badge.closest('.status-pulse')).toBeNull()
  })

  it('status badge never has pulse class when prefers-reduced-motion', () => {
    mockUseReducedMotion.mockReturnValue(true)
    renderZone()
    const badge = screen.getByText(/STATUS: RUNNING/)
    expect(badge.closest('.status-pulse')).toBeNull()
  })

  // ── Metrics grid ───────────────────────────────────────────────────────────
  it('renders all metric values and labels', () => {
    renderZone()
    expect(screen.getByText('12+')).toBeInTheDocument()
    expect(screen.getByText('Projects Deployed')).toBeInTheDocument()
    expect(screen.getByText('3+')).toBeInTheDocument()
    expect(screen.getByText('Years Experience')).toBeInTheDocument()
    expect(screen.getByText('340+')).toBeInTheDocument()
  })

  it('metric tooltip appears after 200ms hover delay', () => {
    renderZone()
    const badge = screen.getByText('12+').closest('div')!
    fireEvent.mouseEnter(badge)
    expect(screen.queryByText('Production apps shipped')).not.toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(210) })
    expect(screen.getByText('Production apps shipped')).toBeInTheDocument()
  })

  it('metric tooltip dismissed on mouse leave', () => {
    renderZone()
    const badge = screen.getByText('12+').closest('div')!
    fireEvent.mouseEnter(badge)
    act(() => { vi.advanceTimersByTime(210) })
    expect(screen.getByText('Production apps shipped')).toBeInTheDocument()
    fireEvent.mouseLeave(badge)
    expect(screen.queryByText('Production apps shipped')).not.toBeInTheDocument()
  })

  // ── CTA buttons ────────────────────────────────────────────────────────────
  it('"View Skills" dispatches navigateTo("neural-graph")', () => {
    renderZone()
    fireEvent.click(screen.getByRole('button', { name: /view skills/i }))
    expect(mockNavigateTo).toHaveBeenCalledWith('neural-graph')
  })

  it('"Open Projects" dispatches navigateTo("memory-vault")', () => {
    renderZone()
    fireEvent.click(screen.getByRole('button', { name: /open projects/i }))
    expect(mockNavigateTo).toHaveBeenCalledWith('memory-vault')
  })

  it('CTA buttons are pointer-events:none while isTransitioning', () => {
    mockIsTransitioning = true
    renderZone()
    expect(screen.getByRole('button', { name: /view skills/i })).toBeDisabled()
  })

  // ── Guided flow prompt ─────────────────────────────────────────────────────
  it('guided flow prompt renders when guidedFlowDismissed is false', () => {
    mockGuidedFlowDismissed = false
    renderZone()
    expect(screen.getByRole('note', { name: /getting started/i })).toBeInTheDocument()
    expect(screen.getByText(/new here/i)).toBeInTheDocument()
  })

  it('guided flow prompt is absent when guidedFlowDismissed is true', () => {
    mockGuidedFlowDismissed = true
    renderZone()
    expect(screen.queryByRole('note', { name: /getting started/i })).not.toBeInTheDocument()
  })

  it('clicking dismiss fires dismissGuidedFlow', () => {
    mockGuidedFlowDismissed = false
    renderZone()
    fireEvent.click(screen.getByRole('button', { name: /dismiss guided flow/i }))
    expect(mockDismissGuidedFlow).toHaveBeenCalledTimes(1)
  })

  it('clicking "Start with Skills →" dispatches navigateTo and dismissGuidedFlow', () => {
    mockGuidedFlowDismissed = false
    renderZone()
    fireEvent.click(screen.getByRole('button', { name: /start with skills/i }))
    expect(mockNavigateTo).toHaveBeenCalledWith('neural-graph')
    expect(mockDismissGuidedFlow).toHaveBeenCalledTimes(1)
  })
})