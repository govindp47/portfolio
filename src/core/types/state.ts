import type { ZoneId } from './zones'
import type { OverlayId } from './overlays'
import type { UserMode } from './modes'
import type {
  Project,
  Skill,
  SkillEdge,
  TimelineEntry,
  ArenaProfile,
  SystemMeta,
} from './content'

// ─── 2.1 Navigation Slice ─────────────────────────────────────────────────────

export interface NavigationState {
  activeZone: ZoneId
  previousZone: ZoneId | null
  isTransitioning: boolean
  overlayStack: OverlayId[]
  miniMapOpen: boolean
}

export interface NavigationActions {
  navigateTo: (zoneId: ZoneId) => void
  openOverlay: (overlayId: OverlayId) => void
  closeOverlay: (overlayId: OverlayId) => void
  toggleMiniMap: () => void
  onTransitionComplete: () => void
}

// ─── 2.2 Mode Slice ───────────────────────────────────────────────────────────

export interface ModeState {
  activeMode: UserMode
  isMobile: boolean
}

export interface ModeActions {
  setMode: (mode: UserMode) => void
}

// ─── 2.3 Terminal Slice ───────────────────────────────────────────────────────

export interface TerminalEntry {
  type: 'input' | 'output' | 'error'
  content: string
  timestamp: number
}

export interface TerminalState {
  isOpen: boolean
  history: TerminalEntry[]
  inputBuffer: string
}

export interface TerminalActions {
  openTerminal: () => void
  closeTerminal: () => void
  submitCommand: (input: string) => void
  clearHistory: () => void
  setInputBuffer: (value: string) => void
}

// ─── 2.4 Game Layer Slice ─────────────────────────────────────────────────────

export interface GameState {
  isActive: boolean
  unlockedZones: ZoneId[]
  dismissedChallenges: string[]
  explorationLevel: number
}

export interface GameActions {
  unlockZone: (zoneId: ZoneId) => void
  dismissChallenge: (challengeId: string) => void
}

// ─── 2.5 Session Flags Slice ──────────────────────────────────────────────────

export interface SessionFlags {
  bootPlayed: boolean
  guidedFlowDismissed: boolean
  contentLoaded: boolean
}

export interface SessionFlagActions {
  markBootPlayed: () => void
  dismissGuidedFlow: () => void
  markContentLoaded: () => void
}

// ─── 2.6 Content Slice ────────────────────────────────────────────────────────

export interface ContentState {
  projects: Project[]
  skills: Skill[]
  edges: SkillEdge[]
  timeline: TimelineEntry[]
  arena: ArenaProfile | null
  meta: SystemMeta | null
}

export interface ContentActions {
  loadContent: (payload: ContentState) => void
}