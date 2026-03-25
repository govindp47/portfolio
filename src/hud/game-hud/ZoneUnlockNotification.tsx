import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MonoText } from '@/core/design-system/typography'
import { GlassPanel } from '@/core/design-system/components'
import { useStore } from '@/core/hooks/useStore'
import { useReducedMotion } from '@/core/hooks/useReducedMotion'
import type { ZoneId } from '@/core/types/zones'

const ZONE_DISPLAY_NAMES: Record<ZoneId, string> = {
  'control-room':   'Control Room',
  'memory-vault':   'Memory Vault',
  'neural-graph':   'Neural Graph',
  'timeline-tunnel':'Timeline Tunnel',
  'arena':          'Arena',
  'gateway':        'Gateway',
}

const DISMISS_DELAY_MS = 3000

export function ZoneUnlockNotification() {
  const unlockedZones = useStore((s) => s.unlockedZones)
  const reducedMotion = useReducedMotion()

  const [notificationZoneId, setNotificationZoneId] = useState<ZoneId | null>(null)
  const prevLengthRef = useRef(unlockedZones.length)
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const prev = prevLengthRef.current
    const curr = unlockedZones.length

    if (curr > prev) {
      // A new zone was unlocked — show its notification
      const latestZoneId = unlockedZones[curr - 1]
      setNotificationZoneId(latestZoneId)

      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        setNotificationZoneId(null)
      }, DISMISS_DELAY_MS)
    }

    prevLengthRef.current = curr
  }, [unlockedZones])

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  const toastMotion = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, x: 40 },
        animate: { opacity: 1, x: 0,  transition: { duration: 0.25 } },
        exit:    { opacity: 0, x: 40,  transition: { duration: 0.2  } },
      }

  return (
    <AnimatePresence>
      {notificationZoneId !== null && (
        <motion.div
          key={notificationZoneId}
          {...toastMotion}
          style={toastStyle}
          role="status"
          aria-live="polite"
          data-testid="zone-unlock-notification"
        >
          <GlassPanel bordered>
            <div style={innerStyle}>
              <MonoText size="xs">
                <span style={unlockedLabelStyle}>UNLOCKED</span>
              </MonoText>
              <MonoText size="sm">
                <span style={zoneNameStyle}>
                  {ZONE_DISPLAY_NAMES[notificationZoneId] ?? notificationZoneId}
                </span>
              </MonoText>
            </div>
          </GlassPanel>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const toastStyle: React.CSSProperties = {
  position:  'fixed',
  top:       'calc(var(--hud-height) + var(--space-4))',
  right:     'var(--space-4)',
  zIndex:    'calc(var(--z-hud) + 5)' as unknown as number,
  pointerEvents: 'none',
}

const innerStyle: React.CSSProperties = {
  padding:       'var(--space-2) var(--space-4)',
  display:       'flex',
  flexDirection: 'column',
  gap:           '2px',
}

const unlockedLabelStyle: React.CSSProperties = {
  color:         'var(--color-accent)',
  letterSpacing: '0.1em',
  fontSize:      'var(--text-xs)',
}

const zoneNameStyle: React.CSSProperties = {
  color: 'var(--color-text-primary)',
}