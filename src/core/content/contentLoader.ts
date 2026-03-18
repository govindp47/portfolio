import type {
  Project,
  Skill,
  SkillEdge,
  TimelineEntry,
  ArenaProfile,
  SystemMeta,
} from '@/core/types/content'
import type { ContentState } from '@/core/types/state'

// ─── Field-Presence Validators ────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function isNonEmptyArray(v: unknown): v is unknown[] {
  return Array.isArray(v) && v.length > 0
}

function validateProject(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    typeof r['id'] === 'string' &&
    typeof r['title'] === 'string' &&
    typeof r['problem'] === 'string' &&
    typeof r['problemFull'] === 'string' &&
    Array.isArray(r['constraints']) &&
    typeof r['architecture'] === 'string' &&
    Array.isArray(r['tradeoffs']) &&
    Array.isArray(r['stack']) &&
    typeof r['outcome'] === 'string' &&
    typeof r['outcomeFull'] === 'string' &&
    (typeof r['demoUrl'] === 'string' || r['demoUrl'] === null) &&
    typeof r['displayOrder'] === 'number' &&
    Array.isArray(r['skillRefs'])
  )
}

function validateSkill(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    typeof r['id'] === 'string' &&
    typeof r['label'] === 'string' &&
    (r['type'] === 'language' || r['type'] === 'concept' || r['type'] === 'domain') &&
    typeof r['mastery'] === 'number' &&
    (r['depth'] === 'familiar' || r['depth'] === 'advanced' || r['depth'] === 'expert') &&
    typeof r['confidence'] === 'number' &&
    typeof r['description'] === 'string' &&
    Array.isArray(r['projectRefs'])
  )
}

function validateSkillEdge(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    typeof r['source'] === 'string' &&
    typeof r['target'] === 'string' &&
    typeof r['weight'] === 'number' &&
    (r['relationshipType'] === 'uses' ||
      r['relationshipType'] === 'extends' ||
      r['relationshipType'] === 'enables' ||
      r['relationshipType'] === 'relates-to')
  )
}

function validateTimelineEntry(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    typeof r['id'] === 'string' &&
    (r['type'] === 'work' || r['type'] === 'education') &&
    typeof r['organization'] === 'string' &&
    typeof r['role'] === 'string' &&
    typeof r['duration'] === 'string' &&
    typeof r['startDate'] === 'string' &&
    (typeof r['endDate'] === 'string' || r['endDate'] === null) &&
    Array.isArray(r['highlights']) &&
    Array.isArray(r['impact']) &&
    Array.isArray(r['technologies']) &&
    typeof r['isCurrent'] === 'boolean'
  )
}

function validateArenaProfile(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    Array.isArray(r['platforms']) &&
    Array.isArray(r['difficultyBreakdown']) &&
    Array.isArray(r['patterns']) &&
    isObject(r['featuredProblem']) &&
    Array.isArray(r['certifications'])
  )
}

function validateSystemMeta(raw: unknown): boolean {
  if (!isObject(raw)) return false
  const r = raw
  return (
    typeof r['name'] === 'string' &&
    typeof r['version'] === 'string' &&
    typeof r['role'] === 'string' &&
    typeof r['stack'] === 'string' &&
    Array.isArray(r['metrics']) &&
    isObject(r['contact']) &&
    isObject(r['links']) &&
    typeof r['resumeAssetPath'] === 'string'
  )
}

// ─── Fetch Helpers ────────────────────────────────────────────────────────────

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${path}`)
  }
  return response.json()
}

// ─── Array Loader — validates and casts an array content type ─────────────────

function loadArray<T>(
  raw: unknown,
  fileName: string,
  validate: (item: unknown) => boolean
): T[] {
  if (!isNonEmptyArray(raw)) {
    console.warn(`[contentLoader] ${fileName}: expected non-empty array, got`, typeof raw)
    return []
  }
  if (!validate(raw[0])) {
    console.warn(
      `[contentLoader] ${fileName}: first element failed field-presence check`,
      raw[0]
    )
    return []
  }
  return raw as T[]
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetches all six content JSON files in parallel and assembles a ContentState.
 *
 * - All fetches run concurrently via Promise.allSettled.
 * - A failed fetch (network error or non-200) falls back to the empty default
 *   for that content type; it does NOT throw.
 * - Field-presence validation is performed on the first element of each array
 *   type and on the shape of singleton objects. Failures emit console.warn
 *   and fall back to the empty default.
 */
export async function loadContent(): Promise<ContentState> {
  const [
    projectsResult,
    skillsResult,
    edgesResult,
    timelineResult,
    arenaResult,
    metaResult,
  ] = await Promise.allSettled([
    fetchJson('/content/projects.json'),
    fetchJson('/content/skills.json'),
    fetchJson('/content/edges.json'),
    fetchJson('/content/timeline.json'),
    fetchJson('/content/arena.json'),
    fetchJson('/content/meta.json'),
  ])

  // ── Projects ──────────────────────────────────────────────────────────────
  let projects: Project[] = []
  if (projectsResult.status === 'fulfilled') {
    projects = loadArray<Project>(projectsResult.value, 'projects.json', validateProject)
  } else {
    console.warn('[contentLoader] projects.json failed to load:', projectsResult.reason)
  }

  // ── Skills ────────────────────────────────────────────────────────────────
  let skills: Skill[] = []
  if (skillsResult.status === 'fulfilled') {
    skills = loadArray<Skill>(skillsResult.value, 'skills.json', validateSkill)
  } else {
    console.warn('[contentLoader] skills.json failed to load:', skillsResult.reason)
  }

  // ── Edges ─────────────────────────────────────────────────────────────────
  let edges: SkillEdge[] = []
  if (edgesResult.status === 'fulfilled') {
    edges = loadArray<SkillEdge>(edgesResult.value, 'edges.json', validateSkillEdge)
  } else {
    console.warn('[contentLoader] edges.json failed to load:', edgesResult.reason)
  }

  // ── Timeline ──────────────────────────────────────────────────────────────
  let timeline: TimelineEntry[] = []
  if (timelineResult.status === 'fulfilled') {
    timeline = loadArray<TimelineEntry>(
      timelineResult.value,
      'timeline.json',
      validateTimelineEntry
    )
  } else {
    console.warn('[contentLoader] timeline.json failed to load:', timelineResult.reason)
  }

  // ── Arena ─────────────────────────────────────────────────────────────────
  let arena: ArenaProfile | null = null
  if (arenaResult.status === 'fulfilled') {
    if (validateArenaProfile(arenaResult.value)) {
      arena = arenaResult.value as ArenaProfile
    } else {
      console.warn('[contentLoader] arena.json failed field-presence check', arenaResult.value)
    }
  } else {
    console.warn('[contentLoader] arena.json failed to load:', arenaResult.reason)
  }

  // ── Meta ──────────────────────────────────────────────────────────────────
  let meta: SystemMeta | null = null
  if (metaResult.status === 'fulfilled') {
    if (validateSystemMeta(metaResult.value)) {
      meta = metaResult.value as SystemMeta
    } else {
      console.warn('[contentLoader] meta.json failed field-presence check', metaResult.value)
    }
  } else {
    console.warn('[contentLoader] meta.json failed to load:', metaResult.reason)
  }

  return { projects, skills, edges, timeline, arena, meta }
}