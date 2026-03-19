import type { Variants } from 'framer-motion'

/**
 * Shared Framer Motion variants used by ALL zone root components.
 * Defining once prevents animation drift across zones.
 */
export const zoneEntryVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}