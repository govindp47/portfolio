interface BootSequenceProps {
  onComplete: () => void
}

export default function BootSequence({ onComplete }: BootSequenceProps) {
  return (
    <div
      onClick={onComplete}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-overlay)' as unknown as number,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
        color: 'var(--color-accent)',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-sm)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      Boot Stub — click to skip
    </div>
  )
}