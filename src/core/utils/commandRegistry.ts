import type { ContentState } from '@/core/types/state'
import type { ZoneId } from '@/core/types/zones'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandEntry {
  name:        string
  aliases:     string[]
  description: string
  resolver: (
    args:       string[],
    content:    ContentState,
    navigateTo: (id: ZoneId) => void
  ) => string | Promise<string>
}

// ─── Zone metadata — defined here to avoid React.lazy in test environments ───
// Keep in sync with zoneRegistry.ts display names.

const ZONE_META: Record<ZoneId, string> = {
  'control-room':   'Control Room',
  'memory-vault':   'Memory Vault',
  'neural-graph':   'Neural Graph',
  'timeline-tunnel':'Timeline Tunnel',
  'arena':          'Arena',
  'gateway':        'Gateway',
}

const VALID_ZONE_IDS = Object.keys(ZONE_META) as ZoneId[]

function zoneDisplayName(id: ZoneId): string {
  return ZONE_META[id] ?? id
}

// ─── Command Definitions ──────────────────────────────────────────────────────

const COMMANDS: CommandEntry[] = [
  {
    name:        'help',
    aliases:     ['?'],
    description: 'List all available commands',
    resolver:    () => {
      const lines = COMMANDS.map((cmd) => {
        const aliasStr = cmd.aliases.length > 0 ? ` (${cmd.aliases.join(', ')})` : ''
        return `  ${cmd.name}${aliasStr}  —  ${cmd.description}`
      })
      return ['Available commands:', ...lines].join('\n')
    },
  },

  {
    name:        'status',
    aliases:     [],
    description: 'Show system identity and current status',
    resolver:    (_args, content) => {
      const m = content.meta
      if (!m) return 'System meta not yet loaded.'
      return [
        `GovindOS v${m.version}`,
        `Name    : ${m.name}`,
        `Role    : ${m.role}`,
        `Stack   : ${m.stack}`,
        `Status  : RUNNING`,
      ].join('\n')
    },
  },

  {
    name:        'projects',
    aliases:     ['ls projects'],
    description: 'List all projects with one-line summaries',
    resolver:    (_args, content) => {
      if (content.projects.length === 0) return 'No project data loaded.'
      const sorted = [...content.projects].sort((a, b) => a.displayOrder - b.displayOrder)
      const lines  = sorted.map((p) => `  ${p.title}: ${p.problem}`)
      return ['Projects:', ...lines].join('\n')
    },
  },

  {
    name:        'skills',
    aliases:     ['ls skills'],
    description: 'List skills grouped by type with depth indicator',
    resolver:    (_args, content) => {
      if (content.skills.length === 0) return 'No skill data loaded.'
      const groups: Record<string, typeof content.skills> = {
        language: [],
        concept:  [],
        domain:   [],
      }
      for (const s of content.skills) groups[s.type]?.push(s)
      const DEPTH_LABEL: Record<string, string> = {
        familiar: 'Familiar',
        advanced: 'Advanced',
        expert:   'Expert',
      }
      const out: string[] = []
      for (const [type, skills] of Object.entries(groups)) {
        if (skills.length === 0) continue
        out.push(`\n${type.charAt(0).toUpperCase() + type.slice(1)}s:`)
        for (const s of skills) {
          out.push(`  ${s.label} [${DEPTH_LABEL[s.depth] ?? s.depth}]`)
        }
      }
      return out.join('\n').trim()
    },
  },

  {
    name:        'github',
    aliases:     [],
    description: 'Show GitHub profile URL',
    resolver:    (_args, content) => {
      if (!content.meta) return 'Meta not loaded.'
      return `GitHub: ${content.meta.links.github}`
    },
  },

  {
    name:        'clear',
    aliases:     ['cls'],
    description: 'Clear the terminal history',
    // Slice special-cases this — resolver never called for clear
    resolver:    () => '',
  },

  {
    name:        'exit',
    aliases:     ['quit'],
    description: 'Close the terminal',
    resolver:    () => 'Closing terminal...',
  },

  {
    name:        'goto',
    aliases:     ['cd'],
    description: 'Navigate to a zone  (e.g. goto neural-graph)',
    resolver:    (args, _content, navigateTo) => {
      if (args.length === 0) {
        return `Usage: goto <zone-id>\nValid zones: ${VALID_ZONE_IDS.join(', ')}`
      }
      const target = args[0].toLowerCase() as ZoneId
      if (!VALID_ZONE_IDS.includes(target)) {
        return `Unknown zone: "${args[0]}"\nValid zones: ${VALID_ZONE_IDS.join(', ')}`
      }
      navigateTo(target)
      return `Navigating to ${zoneDisplayName(target)}...`
    },
  },
]

// ─── Registry Map ─────────────────────────────────────────────────────────────

export const commandRegistry: Record<string, CommandEntry> = {}

for (const cmd of COMMANDS) {
  commandRegistry[cmd.name] = cmd
  for (const alias of cmd.aliases) {
    commandRegistry[alias] = cmd
  }
}

// ─── Public Helpers ───────────────────────────────────────────────────────────

export function resolveCommand(rawInput: string): CommandEntry | null {
  const trimmed = rawInput.trim().toLowerCase()
  if (!trimmed) return null

  // Direct single-token match
  const firstToken = trimmed.split(/\s+/)[0]
  if (commandRegistry[firstToken]) return commandRegistry[firstToken]

  // Multi-word alias match (e.g. "ls projects")
  const tokens = trimmed.split(/\s+/)
  for (let len = tokens.length; len >= 2; len--) {
    const candidate = tokens.slice(0, len).join(' ')
    if (commandRegistry[candidate]) return commandRegistry[candidate]
  }

  return null
}

/**
 * Returns args after stripping the matched command token(s).
 * Works for both single-word commands ("goto") and multi-word aliases ("ls projects").
 */
export function extractArgs(rawInput: string, entry: CommandEntry): string[] {
  const trimmed = rawInput.trim().toLowerCase()

  // Find which key was matched (name or one of its aliases)
  const allKeys = [entry.name, ...entry.aliases]
  let matchedKey = entry.name
  for (const key of allKeys) {
    if (trimmed === key || trimmed.startsWith(key + ' ')) {
      matchedKey = key
      break
    }
  }

  const remainder = trimmed.slice(matchedKey.length).trim()
  return remainder.length === 0 ? [] : remainder.split(/\s+/)
}