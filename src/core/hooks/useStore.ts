/**
 * Typed useStore hook — single import point for all store access.
 * Components NEVER import from individual slice files.
 */
import { useStore as useZustandStore } from '@/core/store/index'
import type { AppState } from '@/core/store/index'

export { useZustandStore as useStore }
export type { AppState }