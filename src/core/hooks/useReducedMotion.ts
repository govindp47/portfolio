import { useReducedMotion as useFramerReducedMotion } from 'framer-motion'
import { useStore } from './useStore'

/**
 * Returns true if:
 *  1. The OS prefers reduced motion (via Framer Motion's hook), OR
 *  2. The active app mode is "safe" (explicit in-app preference).
 *
 * Both conditions independently trigger the true return.
 */
export function useReducedMotion(): boolean {
  const prefersReduced = useFramerReducedMotion()
  const activeMode = useStore((s) => s.activeMode)

  return prefersReduced === true || activeMode === 'safe'
}