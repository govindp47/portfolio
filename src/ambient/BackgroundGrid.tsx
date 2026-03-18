// CSS-only dot-grid pattern — no JS, no canvas (Doc 06 §2.1)
export default function BackgroundGrid() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(
            circle,
            rgba(255, 255, 255, 0.06) 1px,
            transparent 1px
          )
        `,
        backgroundSize: '32px 32px',
        backgroundPosition: '0 0',
      }}
    />
  )
}