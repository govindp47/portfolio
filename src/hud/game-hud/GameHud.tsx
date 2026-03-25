import { useStore } from '@/core/hooks/useStore'
import { selectIsGameActive } from '@/core/store/index'
import { ExplorationLevel } from './ExplorationLevel'
import { ZoneUnlockNotification } from './ZoneUnlockNotification'
import { zoneRegistry } from '@/core/utils/zoneRegistry'

const TOTAL_ZONES = Object.keys(zoneRegistry).length

export default function GameHud() {
  const isGameActive    = useStore(selectIsGameActive)
  const explorationLevel = useStore((s) => s.explorationLevel)
  const unlockedZones   = useStore((s) => s.unlockedZones)

  if (!isGameActive) return null

  return (
    <>
      <ExplorationLevel
        level={explorationLevel}
        unlockedCount={unlockedZones.length}
        totalZones={TOTAL_ZONES}
      />
      <ZoneUnlockNotification />
    </>
  )
}