import { motion } from 'framer-motion'
import { GlassPanel } from '@/core/design-system/components'
import { useMode } from '@/core/hooks'

export default function ControlRoomZone() {
  const { activeMode } = useMode()
  void activeMode // confirms hook connection; consumed by full implementation later

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <GlassPanel>
        <h1 style={{ padding: 'var(--space-6)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xl)', margin: 0 }}>
          Control Room — Coming Soon
        </h1>
      </GlassPanel>
    </motion.div>
  )
}