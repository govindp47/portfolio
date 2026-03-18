// ─── Enum Unions ──────────────────────────────────────────────────────────────

export type SkillType = 'language' | 'concept' | 'domain'

export type DepthLevel = 'familiar' | 'advanced' | 'expert'

export type RelType = 'uses' | 'extends' | 'enables' | 'relates-to'

export type EntryType = 'work' | 'education'

// ─── Shared Sub-types ─────────────────────────────────────────────────────────

export interface Tradeoff {
  decision: string
  rationale: string
  consequence: string
}

// ─── Project ──────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  title: string
  problem: string
  problemFull: string
  constraints: string[]
  architecture: string
  tradeoffs: Tradeoff[]
  stack: string[]
  outcome: string
  outcomeFull: string
  demoUrl: string | null
  displayOrder: number
  skillRefs: string[]
}

// ─── Skill Graph ──────────────────────────────────────────────────────────────

export interface Skill {
  id: string
  label: string
  type: SkillType
  mastery: number
  depth: DepthLevel
  confidence: number
  description: string
  projectRefs: string[]
}

export interface SkillEdge {
  source: string
  target: string
  weight: number
  relationshipType: RelType
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export interface TimelineEntry {
  id: string
  type: EntryType
  organization: string
  role: string
  duration: string
  startDate: string
  endDate: string | null
  highlights: string[]
  impact: string[]
  technologies: string[]
  isCurrent: boolean
}

// ─── Arena ────────────────────────────────────────────────────────────────────

export interface PlatformRating {
  platform: string
  rating: number
  context: string
  profileUrl: string
}

export interface DifficultyBand {
  label: string
  count: number
  percentage: number
}

export interface SolvedPattern {
  pattern: string
  count: number
  problemRefs: string[]
}

export interface ComplexityNote {
  time: string
  space: string
}

export interface FeaturedProblem {
  title: string
  platform: string
  difficulty: string
  problemStatement: string
  approach: string
  complexity: ComplexityNote
  keyInsight: string
}

export interface Certification {
  title: string
  issuer: string
  focus: string
  year: number
}

export interface CertificationGroup {
  domain: string
  items: Certification[]
}

export interface ArenaProfile {
  platforms: PlatformRating[]
  difficultyBreakdown: DifficultyBand[]
  patterns: SolvedPattern[]
  featuredProblem: FeaturedProblem
  certifications: CertificationGroup[]
}

// ─── System Meta ──────────────────────────────────────────────────────────────

export interface MetricItem {
  label: string
  value: string
  tooltip: string
}

export interface ContactInfo {
  email: string
  preferCopy: boolean
}

export interface ExternalLinks {
  github: string
  linkedin: string
}

export interface SystemMeta {
  name: string
  version: string
  role: string
  stack: string
  metrics: MetricItem[]
  contact: ContactInfo
  links: ExternalLinks
  resumeAssetPath: string
}