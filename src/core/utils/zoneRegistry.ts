import React from 'react'
import type { ZoneId } from '@/core/types/zones'

export interface ZoneRegistryEntry {
  component: React.LazyExoticComponent<React.ComponentType>
  displayName: string
  navLabel: string
}

export type ZoneRegistry = Record<ZoneId, ZoneRegistryEntry>

export const zoneRegistry: ZoneRegistry = {
  'control-room': {
    component: React.lazy(() => import('@/zones/control-room')),
    displayName: 'Control Room',
    navLabel: 'Control',
  },
  'memory-vault': {
    component: React.lazy(() => import('@/zones/memory-vault')),
    displayName: 'Memory Vault',
    navLabel: 'Projects',
  },
  'neural-graph': {
    component: React.lazy(() => import('@/zones/neural-graph')),
    displayName: 'Neural Graph',
    navLabel: 'Skills',
  },
  'timeline-tunnel': {
    component: React.lazy(() => import('@/zones/timeline-tunnel')),
    displayName: 'Timeline Tunnel',
    navLabel: 'Timeline',
  },
  arena: {
    component: React.lazy(() => import('@/zones/arena')),
    displayName: 'Arena',
    navLabel: 'Arena',
  },
  gateway: {
    component: React.lazy(() => import('@/zones/gateway')),
    displayName: 'Gateway',
    navLabel: 'Contact',
  },
}

export function getZone(id: ZoneId): ZoneRegistryEntry {
  return zoneRegistry[id]
}