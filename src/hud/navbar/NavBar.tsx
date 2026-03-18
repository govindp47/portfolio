import { useStore } from '@/core/hooks/useStore'
import { zoneRegistry } from '@/core/utils/zoneRegistry'
import NavItem from './NavItem'
import type { ZoneId } from '@/core/types/zones'

// Derive nav items once at module level — zoneRegistry is static
const navItems = Object.entries(zoneRegistry).map(([zoneId, entry]) => ({
  zoneId: zoneId as ZoneId,
  label: entry.navLabel,
}))

export default function NavBar() {
  const activeZone = useStore((s) => s.activeZone)
  const isTransitioning = useStore((s) => s.isTransitioning)
  const navigateTo = useStore((s) => s.navigateTo)

  return (
    <nav
      aria-label="Zone navigation"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 'var(--space-1)',
        flexWrap: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {navItems.map(({ zoneId, label }) => (
        <NavItem
          key={zoneId}
          zoneId={zoneId}
          label={label}
          isActive={zoneId === activeZone}
          isDisabled={isTransitioning}
          onClick={() => navigateTo(zoneId)}
        />
      ))}
    </nav>
  )
}