import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import type { Skill } from '@/core/types/content'
import { useStore as useZustandStore } from '@/core/store/index'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeSkill = (overrides: Partial<Skill> & { id: string; type: Skill['type'] }): Skill => ({
  label:       overrides.id,
  mastery:     80,
  depth:       'advanced',
  confidence:  80,
  description: 'test skill',
  projectRefs: [],
  ...overrides,
})

const languageSkill = makeSkill({ id: 'kotlin',  type: 'language', label: 'Kotlin',  projectRefs: ['p1'] })
const conceptSkill  = makeSkill({ id: 'mvvm',    type: 'concept',  label: 'MVVM' })
const domainSkill   = makeSkill({ id: 'android', type: 'domain',   label: 'Android' })

const MOCK_SKILLS: Skill[] = [languageSkill, conceptSkill, domainSkill]

// ── GraphListFallback ─────────────────────────────────────────────────────────

import GraphListFallback from '../components/GraphListFallback'

describe('GraphListFallback', () => {
  it('renders a section for each SkillType present', () => {
    render(<GraphListFallback skills={MOCK_SKILLS} />)
    expect(screen.getByText('Languages')).toBeTruthy()
    expect(screen.getByText('Concepts')).toBeTruthy()
    expect(screen.getByText('Domains')).toBeTruthy()
  })

  it('renders each skill label', () => {
    render(<GraphListFallback skills={MOCK_SKILLS} />)
    expect(screen.getByText('Kotlin')).toBeTruthy()
    expect(screen.getByText('MVVM')).toBeTruthy()
    expect(screen.getByText('Android')).toBeTruthy()
  })

  it('groups skills correctly — Kotlin appears under Languages only', () => {
    const { container } = render(<GraphListFallback skills={MOCK_SKILLS} />)
    const lists = container.querySelectorAll('ul')
    expect(lists[0].textContent).toContain('Kotlin')
    expect(lists[0].textContent).not.toContain('MVVM')
  })

  it('renders depth tag for each skill', () => {
    render(<GraphListFallback skills={MOCK_SKILLS} />)
    const advancedTags = screen.getAllByText('Advanced')
    expect(advancedTags.length).toBe(3)
  })

  it('renders without crashing when skills array is empty', () => {
    const { container } = render(<GraphListFallback skills={[]} />)
    expect(container).toBeTruthy()
  })

  it('omits a section when no skills of that type exist', () => {
    render(<GraphListFallback skills={[languageSkill]} />)
    expect(screen.queryByText('Concepts')).toBeNull()
    expect(screen.queryByText('Domains')).toBeNull()
  })
})

// ── QuizModal ─────────────────────────────────────────────────────────────────

import QuizModal from '@/overlays/quiz-modal'

describe('QuizModal', () => {
  beforeEach(() => {
    act(() => { useZustandStore.getState().closeOverlay('quiz-modal') })
  })

  it('does not render when quiz-modal is not in overlayStack', () => {
    render(<QuizModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders when quiz-modal is in overlayStack', () => {
    render(<QuizModal />)
    act(() => { useZustandStore.getState().openOverlay('quiz-modal') })
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(screen.getByText('Skill Challenge')).toBeTruthy()
  })

  it('closes when DismissButton is clicked', () => {
    render(<QuizModal />)
    act(() => { useZustandStore.getState().openOverlay('quiz-modal') })
    fireEvent.click(screen.getByLabelText('Close skill challenge modal'))
    expect(useZustandStore.getState().overlayStack).not.toContain('quiz-modal')
  })

  it('closes when backdrop is clicked', () => {
    render(<QuizModal />)
    act(() => { useZustandStore.getState().openOverlay('quiz-modal') })
    const backdrop = document.querySelector('[aria-hidden="true"]') as HTMLElement
    fireEvent.click(backdrop)
    expect(useZustandStore.getState().overlayStack).not.toContain('quiz-modal')
  })

  it('closes on Escape keypress', () => {
    render(<QuizModal />)
    act(() => { useZustandStore.getState().openOverlay('quiz-modal') })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(useZustandStore.getState().overlayStack).not.toContain('quiz-modal')
  })
})

// ── NeuralGraphZone mode switching ────────────────────────────────────────────

import NeuralGraphZone from '../NeuralGraphZone'

describe('NeuralGraphZone — mode fallback', () => {
  beforeEach(() => {
    act(() => {
      useZustandStore.getState().loadContent({
        projects: [], skills: MOCK_SKILLS, edges: [],
        timeline: [], arena: null, meta: null,
      })
    })
  })

  it('renders GraphListFallback in recruiter mode', () => {
    act(() => { useZustandStore.getState().setMode('recruiter') })
    render(<NeuralGraphZone />)
    expect(screen.getByText('Languages')).toBeTruthy()
  })

  it('renders GraphListFallback in safe mode', () => {
    act(() => { useZustandStore.getState().setMode('safe') })
    render(<NeuralGraphZone />)
    expect(screen.getByText('Languages')).toBeTruthy()
  })

  it('renders SVG canvas in explorer mode', () => {
    act(() => { useZustandStore.getState().setMode('explorer') })
    const { container } = render(<NeuralGraphZone />)
    // GraphCanvas renders an <svg> element
    expect(container.querySelector('svg')).toBeTruthy()
  })
})