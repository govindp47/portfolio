import { useStore } from './useStore'
import type { UserMode, ModeCapabilities } from '@/core/types/modes'

// ─── Mode → Capabilities Map ─────────────────────────────────────────────────
// Per Document 04, Section 7 — Mode Behavior Table

const CAPABILITIES_MAP: Record<UserMode, ModeCapabilities> = {
  explorer: {
    ambientActive: true,
    gameLayerActive: true,
    animationsEnabled: true,
    animationLevel: 'full',
    miniMapAvailable: true,
  },
  recruiter: {
    ambientActive: false,
    gameLayerActive: false,
    animationsEnabled: true,
    animationLevel: 'reduced',
    miniMapAvailable: false,
  },
  deep: {
    ambientActive: false,
    gameLayerActive: false,
    animationsEnabled: true,
    animationLevel: 'minimal',
    miniMapAvailable: false,
  },
  safe: {
    ambientActive: false,
    gameLayerActive: false,
    animationsEnabled: false,
    animationLevel: 'none',
    miniMapAvailable: false,
  },
}

export interface UseModeReturn {
  activeMode: UserMode
  isMobile: boolean
  capabilities: ModeCapabilities
}

export function useMode(): UseModeReturn {
  const activeMode = useStore((s) => s.activeMode)
  const isMobile = useStore((s) => s.isMobile)
  const capabilities = CAPABILITIES_MAP[activeMode]

  return { activeMode, isMobile, capabilities }
}