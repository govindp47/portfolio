export default function HudPlane() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-hud)' as unknown as number,
        pointerEvents: 'none',
      }}
    />
  )
}