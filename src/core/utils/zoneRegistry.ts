import React from 'react'
import type { ZoneId } from '@/core/types/zones'

// ─── Registry Type ────────────────────────────────────────────────────────────

export interface ZoneRegistryEntry {
  component: React.LazyExoticComponent<React.ComponentType>
  displayName: string
  navLabel: string
}

export type ZoneRegistry = Record<ZoneId, ZoneRegistryEntry>

// ─── Stub Placeholder ─────────────────────────────────────────────────────────
// Zone components are not yet built. Each entry uses a null-returning lazy
// component as a placeholder. These will be replaced when zones are scaffolded.

const NullZone: React.ComponentType = () => null

function makeLazyStub(): React.LazyExoticComponent<React.ComponentType> {
  return React.lazy(() => Promise.resolve({ default: NullZone }))
}

// ─── Registry ─────────────────────────────────────────────────────────────────
// All seven ZoneId values must be present — TypeScript enforces exhaustiveness
// via the Record<ZoneId, ...> type.

export const zoneRegistry: ZoneRegistry = {
  'control-room': {
    component: makeLazyStub(),
    displayName: 'Control Room',
    navLabel: 'Control',
  },
  'memory-vault': {
    component: makeLazyStub(),
    displayName: 'Memory Vault',
    navLabel: 'Projects',
  },
  'neural-graph': {
    component: makeLazyStub(),
    displayName: 'Neural Graph',
    navLabel: 'Skills',
  },
  'timeline-tunnel': {
    component: makeLazyStub(),
    displayName: 'Timeline Tunnel',
    navLabel: 'Timeline',
  },
  arena: {
    component: makeLazyStub(),
    displayName: 'Arena',
    navLabel: 'Arena',
  },
  gateway: {
    component: makeLazyStub(),
    displayName: 'Gateway',
    navLabel: 'Contact',
  },
}

// ─── Helper ───────────────────────────────────────────────────────────────────

export function getZone(id: ZoneId): ZoneRegistryEntry {
  return zoneRegistry[id]
}