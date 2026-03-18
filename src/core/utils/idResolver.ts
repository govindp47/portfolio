import type { Skill } from '@/core/types/content'
import type { Project } from '@/core/types/content'

/**
 * Resolves a skill ID to its display label.
 * Returns null if the skill is not found or the array is empty.
 */
export function resolveSkillLabel(skillId: string, skills: Skill[]): string | null {
  if (skills.length === 0) return null
  const skill = skills.find((s) => s.id === skillId)
  return skill?.label ?? null
}

/**
 * Resolves a project ID to its display title.
 * Returns null if the project is not found or the array is empty.
 */
export function resolveProjectTitle(
  projectId: string,
  projects: Project[]
): string | null {
  if (projects.length === 0) return null
  const project = projects.find((p) => p.id === projectId)
  return project?.title ?? null
}