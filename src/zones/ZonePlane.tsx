export default function ZonePlane() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 'var(--z-zone)' as unknown as number,
        width: '100%',
        height: '100%',
      }}
    >
      Zone Placeholder
    </div>
  )
}