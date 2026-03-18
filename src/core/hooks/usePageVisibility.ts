import { useState, useEffect } from 'react'

/**
 * Returns true when the page is visible, false when hidden.
 * Used by ParticleCanvas to suspend animation when the tab is inactive.
 */
export function usePageVisibility(): boolean {
  const [isVisible, setIsVisible] = useState<boolean>(
    () => document.visibilityState === 'visible'
  )

  useEffect(() => {
    function handleVisibilityChange(): void {
      setIsVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return isVisible
}