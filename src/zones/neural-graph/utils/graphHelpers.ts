import type { SkillType } from '@/core/types/content'

// ─── Node radii ───────────────────────────────────────────────────────────────

export function nodeRadius(type: SkillType): number {
  switch (type) {
    case 'language': return 32
    case 'concept':  return 26
    case 'domain':   return 36
  }
}

/** Collision radius — extra gap between node visual edges */
export function nodeCollisionRadius(type: SkillType): number {
  return nodeRadius(type) + 46
}

/** Logo display size — 50% of diameter, giving clear padding inside circle */
export function nodeLogoSize(type: SkillType): number {
  return Math.round(nodeRadius(type) * 1.0)
}

// ─── Edge width ───────────────────────────────────────────────────────────────

export function weightToWidth(weight: number): number {
  return 0.5 + Math.max(0, Math.min(1, weight)) * 2.5
}

// ─── Mastery alpha ────────────────────────────────────────────────────────────

/** Background fill intensity: 0.55–0.95 based on mastery */
export function masteryAlpha(mastery: number): number {
  return 0.65 + (Math.max(0, Math.min(100, mastery)) / 100) * 0.30
}

// ─── Connected subtree BFS ────────────────────────────────────────────────────

/**
 * Returns the set of node IDs directly connected to startId (1-hop neighbors).
 * Used for hover highlighting — direct neighbors only so the highlight is
 * meaningful and not the entire connected component.
 */
export function getDirectNeighbors(
  startId:  string,
  adjMap:   Map<string, Set<string>>
): Set<string> {
  const result = new Set<string>([startId])
  adjMap.get(startId)?.forEach((n) => result.add(n))
  return result
}

// ─── Skill visual config ──────────────────────────────────────────────────────

export interface SkillVisual {
  /** Primary brand color — used for stroke, label tint, gradient inner */
  color:     string
  /** Darker shade for gradient outer stop */
  colorDark: string
  /** SimpleIcons slug — icon served white from CDN */
  iconSlug?: string
}

/**
 * Per-skill brand colors + SimpleIcons slugs.
 * Two-color gradient (color → colorDark) creates the glowing badge effect.
 */
export const SKILL_VISUAL: Record<string, SkillVisual> = {
  // ── Languages ─────────────────────────────────────────────────────────────
  kotlin:     { color: '#B97DFF', colorDark: '#6A3CBF', iconSlug: 'kotlin'         },
  python:     { color: '#4FC3F7', colorDark: '#1565C0', iconSlug: 'python'         },
  java:       { color: '#FF9800', colorDark: '#BF360C', iconSlug: 'java'           },
  typescript: { color: '#5A9FEA', colorDark: '#1A4C8C', iconSlug: 'typescript'     },
  javascript: { color: '#F7DF1E', colorDark: '#795C0C', iconSlug: 'javascript'     },
  dart:       { color: '#64D8FF', colorDark: '#006494', iconSlug: 'dart'           },
  sql:        { color: '#7CC8FA', colorDark: '#1D4E89', iconSlug: 'postgresql'     },
  bash:       { color: '#4EC94E', colorDark: '#1B5E20', iconSlug: 'gnubash'        },
  go:         { color: '#00C6E0', colorDark: '#005F6B', iconSlug: 'go'             },
  cpp:        { color: '#89B4F8', colorDark: '#1A237E', iconSlug: 'cplusplus'      },

  // ── Concepts ──────────────────────────────────────────────────────────────
  'jetpack-compose':      { color: '#7CB9FF', colorDark: '#1A56DB', iconSlug: 'jetpackcompose'  },
  coroutines:             { color: '#C49DFF', colorDark: '#5B2EA6', iconSlug: 'kotlin'          },
  mvvm:                   { color: '#4DD9CD', colorDark: '#00695C'                              },
  'clean-architecture':   { color: '#81C784', colorDark: '#2E7D32'                              },
  'dependency-injection': { color: '#A5D86B', colorDark: '#33691E', iconSlug: 'spring'          },
  'rest-api':             { color: '#FF8A65', colorDark: '#BF360C', iconSlug: 'postman'         },
  websockets:             { color: '#90CAF9', colorDark: '#1565C0', iconSlug: 'socketdotio'     },
  rxjava:                 { color: '#E040FB', colorDark: '#6A1B9A', iconSlug: 'reactivex'       },
  'unit-testing':         { color: '#69F0AE', colorDark: '#1B5E20', iconSlug: 'vitest'          },
  'ci-cd':                { color: '#64B5F6', colorDark: '#0D47A1', iconSlug: 'githubactions'   },
  'graph-algorithms':     { color: '#EF9A9A', colorDark: '#B71C1C'                              },
  'dynamic-programming':  { color: '#CE93D8', colorDark: '#4A148C'                              },
  'system-design':        { color: '#80DEEA', colorDark: '#006064'                              },
  'state-management':     { color: '#B39DDB', colorDark: '#311B92', iconSlug: 'redux'           },

  // ── Domains ───────────────────────────────────────────────────────────────
  'android-development':        { color: '#69F0AE', colorDark: '#1B5E20', iconSlug: 'android'       },
  'backend-development':        { color: '#A5D86B', colorDark: '#33691E', iconSlug: 'nodedotjs'     },
  'competitive-programming':    { color: '#FFD54F', colorDark: '#E65100', iconSlug: 'leetcode'      },
  'data-structures-algorithms': { color: '#FF8A65', colorDark: '#BF360C'                            },
  'ui-ux':         { color: '#FF7B7B', colorDark: '#B71C1C', iconSlug: 'figma'         },
  devops:          { color: '#64B5F6', colorDark: '#0D47A1', iconSlug: 'docker'        },
  flutter:         { color: '#64D8FF', colorDark: '#006494', iconSlug: 'flutter'       },
  firebase:        { color: '#FFC107', colorDark: '#E65100', iconSlug: 'firebase'      },
  'database-design': { color: '#80CBC4', colorDark: '#004D40', iconSlug: 'postgresql'  },
  'machine-learning':{ color: '#FFAB40', colorDark: '#BF360C', iconSlug: 'tensorflow'  },
  react:           { color: '#61DAFB', colorDark: '#003E52', iconSlug: 'react'         },
}

const TYPE_FALLBACK: Record<SkillType, SkillVisual> = {
  language: { color: '#B39DDB', colorDark: '#311B92' },
  concept:  { color: '#80DEEA', colorDark: '#006064' },
  domain:   { color: '#FFCC80', colorDark: '#E65100' },
}

export function getSkillVisual(id: string, type: SkillType): SkillVisual {
  return SKILL_VISUAL[id] ?? TYPE_FALLBACK[type]
}