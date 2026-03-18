import { useStore } from './useStore'
import type { ZoneId } from '@/core/types/zones'

export interface UseNavigateReturn {
  navigateTo: (zoneId: ZoneId) => void
  activeZone: ZoneId
  isTransitioning: boolean
}

export function useNavigate(): UseNavigateReturn {
  const navigateTo = useStore((s) => s.navigateTo)
  const activeZone = useStore((s) => s.activeZone)
  const isTransitioning = useStore((s) => s.isTransitioning)

  return { navigateTo, activeZone, isTransitioning }
}