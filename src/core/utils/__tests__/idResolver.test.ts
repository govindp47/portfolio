import { describe, it, expect } from 'vitest'
import { resolveSkillLabel, resolveProjectTitle } from '../idResolver'
import type { Skill, Project } from '@/core/types/content'

const mockSkills: Skill[] = [
  {
    id: 'ts',
    label: 'TypeScript',
    type: 'language',
    mastery: 90,
    depth: 'expert',
    confidence: 95,
    description: '',
    projectRefs: [],
  },
]

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    title: 'My Project',
    problem: '',
    problemFull: '',
    constraints: [],
    architecture: '',
    tradeoffs: [],
    stack: [],
    outcome: '',
    outcomeFull: '',
    demoUrl: null,
    displayOrder: 1,
    skillRefs: [],
  },
]

describe('resolveSkillLabel', () => {
  it('resolves a known skill ID to its label', () => {
    expect(resolveSkillLabel('ts', mockSkills)).toBe('TypeScript')
  })

  it('returns null for an unknown skill ID', () => {
    expect(resolveSkillLabel('unknown', mockSkills)).toBeNull()
  })

  it('returns null for an empty skills array', () => {
    expect(resolveSkillLabel('ts', [])).toBeNull()
  })
})

describe('resolveProjectTitle', () => {
  it('resolves a known project ID to its title', () => {
    expect(resolveProjectTitle('proj-1', mockProjects)).toBe('My Project')
  })

  it('returns null for an unknown project ID', () => {
    expect(resolveProjectTitle('nope', mockProjects)).toBeNull()
  })

  it('returns null for an empty projects array', () => {
    expect(resolveProjectTitle('proj-1', [])).toBeNull()
  })
})