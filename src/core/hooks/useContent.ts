import { useStore } from './useStore'
import type { Project, Skill, SkillEdge, TimelineEntry, ArenaProfile, SystemMeta } from '@/core/types/content'

export function useProjects(): Project[] {
  return useStore((s) => s.projects)
}

export function useSkills(): Skill[] {
  return useStore((s) => s.skills)
}

export function useEdges(): SkillEdge[] {
  return useStore((s) => s.edges)
}

export function useTimeline(): TimelineEntry[] {
  return useStore((s) => s.timeline)
}

export function useArena(): ArenaProfile | null {
  return useStore((s) => s.arena)
}

export function useMeta(): SystemMeta | null {
  return useStore((s) => s.meta)
}