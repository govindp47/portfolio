/**
 * contentLoader.test.ts
 *
 * Two test suites:
 *
 * 1. Content Schema Validation — reads actual /content/*.json files from disk
 *    using Node's `fs` module (Vitest node environment). These tests act as
 *    CI-time authoring guards: if a content author introduces a schema error
 *    or a broken cross-reference, these tests fail before the build ships.
 *
 * 2. Content Loader Unit Tests — uses `vi.stubGlobal('fetch', ...)` to mock
 *    network responses and verifies the loader's success, partial-failure, and
 *    parse-error handling paths.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { loadContent } from '../contentLoader'
import type {
  Project,
  Skill,
  SkillEdge,
  TimelineEntry,
  ArenaProfile,
  SystemMeta,
} from '@/core/types/content'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readContent<T>(filename: string): T {
  const filePath = resolve(process.cwd(), 'content', filename)
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}/

// ─── Suite 1: Content Schema Validation ──────────────────────────────────────

describe('Content Schema Validation — projects.json', () => {
  const projects = readContent<Project[]>('projects.json')

  it('is a non-empty array', () => {
    expect(Array.isArray(projects)).toBe(true)
    expect(projects.length).toBeGreaterThan(0)
  })

  it.each(projects.map((p) => [p.id, p] as [string, Project]))(
    'project "%s" has all required fields',
    (_, project) => {
      expect(typeof project.id).toBe('string')
      expect(project.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/) // kebab-case
      expect(typeof project.title).toBe('string')
      expect(typeof project.problem).toBe('string')
      expect(typeof project.problemFull).toBe('string')
      expect(Array.isArray(project.constraints)).toBe(true)
      expect(typeof project.architecture).toBe('string')
      expect(Array.isArray(project.tradeoffs)).toBe(true)
      expect(Array.isArray(project.stack)).toBe(true)
      expect(typeof project.outcome).toBe('string')
      expect(typeof project.outcomeFull).toBe('string')
      // demoUrl is string | null — never undefined
      expect(project.demoUrl === null || typeof project.demoUrl === 'string').toBe(true)
      expect(typeof project.displayOrder).toBe('number')
      expect(Array.isArray(project.skillRefs)).toBe(true)
    }
  )

  it('has at least one project with demoUrl: null', () => {
    expect(projects.some((p) => p.demoUrl === null)).toBe(true)
  })

  it('has unique displayOrder values', () => {
    const orders = projects.map((p) => p.displayOrder)
    expect(new Set(orders).size).toBe(orders.length)
  })

  it('all tradeoffs have required fields', () => {
    for (const project of projects) {
      for (const t of project.tradeoffs) {
        expect(typeof t.decision).toBe('string')
        expect(typeof t.rationale).toBe('string')
        expect(typeof t.consequence).toBe('string')
      }
    }
  })

  it('all skillRefs resolve to valid Skill IDs', () => {
    const skills = readContent<Skill[]>('skills.json')
    const skillIds = new Set(skills.map((s) => s.id))
    for (const project of projects) {
      for (const ref of project.skillRefs) {
        expect(skillIds.has(ref), `Project "${project.id}" has unresolvable skillRef: "${ref}"`).toBe(
          true
        )
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Content Schema Validation — skills.json', () => {
  const skills = readContent<Skill[]>('skills.json')
  const VALID_TYPES = new Set(['language', 'concept', 'domain'])
  const VALID_DEPTHS = new Set(['familiar', 'advanced', 'expert'])

  it('is a non-empty array', () => {
    expect(Array.isArray(skills)).toBe(true)
    expect(skills.length).toBeGreaterThan(0)
  })

  it('contains all three SkillType values', () => {
    const types = new Set(skills.map((s) => s.type))
    expect(types.has('language')).toBe(true)
    expect(types.has('concept')).toBe(true)
    expect(types.has('domain')).toBe(true)
  })

  it.each(skills.map((s) => [s.id, s] as [string, Skill]))(
    'skill "%s" has all required fields with valid values',
    (_, skill) => {
      expect(typeof skill.id).toBe('string')
      expect(skill.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/) // kebab-case
      expect(typeof skill.label).toBe('string')
      expect(VALID_TYPES.has(skill.type), `type "${skill.type}" is not valid`).toBe(true)
      expect(typeof skill.mastery).toBe('number')
      expect(skill.mastery).toBeGreaterThanOrEqual(0)
      expect(skill.mastery).toBeLessThanOrEqual(100)
      expect(VALID_DEPTHS.has(skill.depth), `depth "${skill.depth}" is not valid`).toBe(true)
      expect(typeof skill.confidence).toBe('number')
      expect(skill.confidence).toBeGreaterThanOrEqual(0)
      expect(skill.confidence).toBeLessThanOrEqual(100)
      expect(typeof skill.description).toBe('string')
      expect(Array.isArray(skill.projectRefs)).toBe(true)
    }
  )

  it('all projectRefs resolve to valid Project IDs', () => {
    const projects = readContent<Project[]>('projects.json')
    const projectIds = new Set(projects.map((p) => p.id))
    for (const skill of skills) {
      for (const ref of skill.projectRefs) {
        expect(
          projectIds.has(ref),
          `Skill "${skill.id}" has unresolvable projectRef: "${ref}"`
        ).toBe(true)
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Content Schema Validation — edges.json', () => {
  const edges = readContent<SkillEdge[]>('edges.json')
  const VALID_REL_TYPES = new Set(['uses', 'extends', 'enables', 'relates-to'])

  it('contains at least 30 edges', () => {
    expect(edges.length).toBeGreaterThanOrEqual(30)
  })

  it.each(edges.map((e, i) => [i, e] as [number, SkillEdge]))(
    'edge %i has valid source, target, weight, and relationshipType',
    (_, edge) => {
      expect(typeof edge.source).toBe('string')
      expect(typeof edge.target).toBe('string')
      expect(typeof edge.weight).toBe('number')
      expect(edge.weight).toBeGreaterThanOrEqual(0)
      expect(edge.weight).toBeLessThanOrEqual(1)
      expect(
        VALID_REL_TYPES.has(edge.relationshipType),
        `relationshipType "${edge.relationshipType}" is not valid`
      ).toBe(true)
    }
  )

  it('all edge source IDs resolve to valid Skill IDs', () => {
    const skills = readContent<Skill[]>('skills.json')
    const skillIds = new Set(skills.map((s) => s.id))
    for (const edge of edges) {
      expect(
        skillIds.has(edge.source),
        `Edge source "${edge.source}" is not a valid Skill ID`
      ).toBe(true)
    }
  })

  it('all edge target IDs resolve to valid Skill IDs', () => {
    const skills = readContent<Skill[]>('skills.json')
    const skillIds = new Set(skills.map((s) => s.id))
    for (const edge of edges) {
      expect(
        skillIds.has(edge.target),
        `Edge target "${edge.target}" is not a valid Skill ID`
      ).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Content Schema Validation — timeline.json', () => {
  const timeline = readContent<TimelineEntry[]>('timeline.json')
  const VALID_TYPES = new Set(['work', 'education'])

  it('is a non-empty array', () => {
    expect(Array.isArray(timeline)).toBe(true)
    expect(timeline.length).toBeGreaterThan(0)
  })

  it.each(timeline.map((t) => [t.id, t] as [string, TimelineEntry]))(
    'entry "%s" has all required fields with valid values',
    (_, entry) => {
      expect(typeof entry.id).toBe('string')
      expect(entry.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/) // kebab-case
      expect(VALID_TYPES.has(entry.type), `type "${entry.type}" is not valid`).toBe(true)
      expect(typeof entry.organization).toBe('string')
      expect(typeof entry.role).toBe('string')
      expect(typeof entry.duration).toBe('string')
      expect(typeof entry.startDate).toBe('string')
      expect(entry.startDate).toMatch(ISO_DATE)
      expect(entry.endDate === null || typeof entry.endDate === 'string').toBe(true)
      if (typeof entry.endDate === 'string') {
        expect(entry.endDate).toMatch(ISO_DATE)
      }
      expect(Array.isArray(entry.highlights)).toBe(true)
      expect(Array.isArray(entry.impact)).toBe(true)
      expect(Array.isArray(entry.technologies)).toBe(true)
      expect(typeof entry.isCurrent).toBe('boolean')
    }
  )

  it('isCurrent:true entries have endDate: null', () => {
    for (const entry of timeline) {
      if (entry.isCurrent) {
        expect(
          entry.endDate,
          `Entry "${entry.id}" has isCurrent:true but endDate is not null`
        ).toBeNull()
      }
    }
  })

  it('has at least one entry with isCurrent: true', () => {
    expect(timeline.some((t) => t.isCurrent === true)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Content Schema Validation — arena.json', () => {
  const arena = readContent<ArenaProfile>('arena.json')

  it('has all required top-level fields', () => {
    expect(Array.isArray(arena.platforms)).toBe(true)
    expect(arena.platforms.length).toBeGreaterThan(0)
    expect(Array.isArray(arena.difficultyBreakdown)).toBe(true)
    expect(arena.difficultyBreakdown.length).toBeGreaterThan(0)
    expect(Array.isArray(arena.patterns)).toBe(true)
    expect(arena.patterns.length).toBeGreaterThan(0)
    expect(typeof arena.featuredProblem).toBe('object')
    expect(arena.featuredProblem).not.toBeNull()
    expect(Array.isArray(arena.certifications)).toBe(true)
    expect(arena.certifications.length).toBeGreaterThan(0)
  })

  it('each PlatformRating has required fields', () => {
    for (const p of arena.platforms) {
      expect(typeof p.platform).toBe('string')
      expect(typeof p.rating).toBe('number')
      expect(typeof p.context).toBe('string')
      expect(typeof p.profileUrl).toBe('string')
    }
  })

  it('each DifficultyBand has required fields', () => {
    for (const d of arena.difficultyBreakdown) {
      expect(typeof d.label).toBe('string')
      expect(typeof d.count).toBe('number')
      expect(typeof d.percentage).toBe('number')
    }
  })

  it('each SolvedPattern has required fields', () => {
    for (const p of arena.patterns) {
      expect(typeof p.pattern).toBe('string')
      expect(typeof p.count).toBe('number')
      expect(Array.isArray(p.problemRefs)).toBe(true)
    }
  })

  it('featuredProblem has all required fields', () => {
    const fp = arena.featuredProblem
    expect(typeof fp.title).toBe('string')
    expect(typeof fp.platform).toBe('string')
    expect(typeof fp.difficulty).toBe('string')
    expect(typeof fp.problemStatement).toBe('string')
    expect(typeof fp.approach).toBe('string')
    expect(typeof fp.complexity?.time).toBe('string')
    expect(typeof fp.complexity?.space).toBe('string')
    expect(typeof fp.keyInsight).toBe('string')
  })

  it('each CertificationGroup has required fields and non-empty items', () => {
    for (const group of arena.certifications) {
      expect(typeof group.domain).toBe('string')
      expect(Array.isArray(group.items)).toBe(true)
      expect(group.items.length).toBeGreaterThan(0)
      for (const cert of group.items) {
        expect(typeof cert.title).toBe('string')
        expect(typeof cert.issuer).toBe('string')
        expect(typeof cert.focus).toBe('string')
        expect(typeof cert.year).toBe('number')
      }
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('Content Schema Validation — meta.json', () => {
  const meta = readContent<SystemMeta>('meta.json')

  it('has all required fields', () => {
    expect(typeof meta.name).toBe('string')
    expect(typeof meta.version).toBe('string')
    expect(typeof meta.role).toBe('string')
    expect(typeof meta.stack).toBe('string')
    expect(Array.isArray(meta.metrics)).toBe(true)
    expect(meta.metrics.length).toBeGreaterThanOrEqual(4)
    expect(typeof meta.contact).toBe('object')
    expect(typeof meta.links).toBe('object')
    expect(typeof meta.resumeAssetPath).toBe('string')
  })

  it('resumeAssetPath starts with /', () => {
    expect(meta.resumeAssetPath.startsWith('/')).toBe(true)
  })

  it('each MetricItem has required fields', () => {
    for (const item of meta.metrics) {
      expect(typeof item.label).toBe('string')
      expect(typeof item.value).toBe('string')
      expect(typeof item.tooltip).toBe('string')
    }
  })

  it('contact has email and preferCopy', () => {
    expect(typeof meta.contact.email).toBe('string')
    expect(typeof meta.contact.preferCopy).toBe('boolean')
  })

  it('links has github and linkedin URLs', () => {
    expect(meta.links.github.startsWith('https://')).toBe(true)
    expect(meta.links.linkedin.startsWith('https://')).toBe(true)
  })
})

// ─── Suite 2: Content Loader Unit Tests (fetch mocked) ───────────────────────

const MOCK_PROJECTS = [
  {
    id: 'test-project',
    title: 'Test',
    problem: 'p',
    problemFull: 'pf',
    constraints: [],
    architecture: 'a',
    tradeoffs: [],
    stack: [],
    outcome: 'o',
    outcomeFull: 'of',
    demoUrl: null,
    displayOrder: 1,
    skillRefs: [],
  },
]

const MOCK_SKILLS = [
  {
    id: 'test-skill',
    label: 'Test',
    type: 'language',
    mastery: 80,
    depth: 'advanced',
    confidence: 80,
    description: 'desc',
    projectRefs: [],
  },
]

const MOCK_EDGES = [
  { source: 'test-skill', target: 'test-skill', weight: 0.5, relationshipType: 'uses' },
]

const MOCK_TIMELINE = [
  {
    id: 'test-entry',
    type: 'work',
    organization: 'Org',
    role: 'Dev',
    duration: '1 year',
    startDate: '2023-01-01',
    endDate: null,
    highlights: [],
    impact: [],
    technologies: [],
    isCurrent: true,
  },
]

const MOCK_ARENA = {
  platforms: [],
  difficultyBreakdown: [],
  patterns: [],
  featuredProblem: {
    title: 't',
    platform: 'p',
    difficulty: 'easy',
    problemStatement: 'ps',
    approach: 'a',
    complexity: { time: 'O(n)', space: 'O(1)' },
    keyInsight: 'ki',
  },
  certifications: [],
}

const MOCK_META = {
  name: 'Test',
  version: '3.0',
  role: 'Engineer',
  stack: 'Kotlin',
  metrics: [],
  contact: { email: 'test@test.com', preferCopy: true },
  links: { github: 'https://github.com/test', linkedin: 'https://linkedin.com/in/test' },
  resumeAssetPath: '/resume.pdf',
}

function makeFetchMock(responses: Record<string, { ok: boolean; body: unknown }>) {
  return vi.fn((url: string) => {
    const path = url.replace('/content/', '')
    const config = responses[path]
    if (!config) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.reject(new Error('not found')),
      })
    }
    return Promise.resolve({
      ok: config.ok,
      status: config.ok ? 200 : 500,
      json: () =>
        config.ok
          ? Promise.resolve(config.body)
          : Promise.reject(new Error('server error')),
    })
  })
}

describe('loadContent() — success path', () => {
  beforeEach(() => {
    const fetchMock = makeFetchMock({
      'projects.json': { ok: true, body: MOCK_PROJECTS },
      'skills.json': { ok: true, body: MOCK_SKILLS },
      'edges.json': { ok: true, body: MOCK_EDGES },
      'timeline.json': { ok: true, body: MOCK_TIMELINE },
      'arena.json': { ok: true, body: MOCK_ARENA },
      'meta.json': { ok: true, body: MOCK_META },
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns a complete ContentState with all fields populated', async () => {
    const state = await loadContent()
    expect(state.projects).toHaveLength(1)
    expect(state.skills).toHaveLength(1)
    expect(state.edges).toHaveLength(1)
    expect(state.timeline).toHaveLength(1)
    expect(state.arena).not.toBeNull()
    expect(state.meta).not.toBeNull()
  })

  it('projects data is passed through correctly', async () => {
    const state = await loadContent()
    expect(state.projects[0].id).toBe('test-project')
    expect(state.projects[0].demoUrl).toBeNull()
  })

  it('meta data is passed through correctly', async () => {
    const state = await loadContent()
    expect(state.meta?.name).toBe('Test')
    expect(state.meta?.resumeAssetPath).toBe('/resume.pdf')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('loadContent() — partial failure (one file returns 404)', () => {
  beforeEach(() => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('projects.json')) {
        return Promise.resolve({ ok: false, status: 404, json: () => Promise.reject() })
      }
      const bodyMap: Record<string, unknown> = {
        '/content/skills.json': MOCK_SKILLS,
        '/content/edges.json': MOCK_EDGES,
        '/content/timeline.json': MOCK_TIMELINE,
        '/content/arena.json': MOCK_ARENA,
        '/content/meta.json': MOCK_META,
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(bodyMap[url] ?? []),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns empty array for the failed type, others populated', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = await loadContent()
    expect(state.projects).toEqual([])
    expect(state.skills).toHaveLength(1)
    expect(state.meta).not.toBeNull()
    warnSpy.mockRestore()
  })

  it('does not throw', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(loadContent()).resolves.toBeDefined()
    vi.restoreAllMocks()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('loadContent() — parse error (one file returns invalid JSON)', () => {
  beforeEach(() => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('skills.json')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new SyntaxError('Unexpected token')),
        })
      }
      const bodyMap: Record<string, unknown> = {
        '/content/projects.json': MOCK_PROJECTS,
        '/content/edges.json': MOCK_EDGES,
        '/content/timeline.json': MOCK_TIMELINE,
        '/content/arena.json': MOCK_ARENA,
        '/content/meta.json': MOCK_META,
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(bodyMap[url] ?? []),
      })
    })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults the parse-error type to empty array, others populated', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const state = await loadContent()
    expect(state.skills).toEqual([])
    expect(state.projects).toHaveLength(1)
    expect(state.meta).not.toBeNull()
    warnSpy.mockRestore()
  })

  it('does not throw', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(loadContent()).resolves.toBeDefined()
    vi.restoreAllMocks()
  })
})