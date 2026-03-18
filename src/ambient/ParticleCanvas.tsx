import { useRef, useEffect } from 'react'
import { usePageVisibility } from '@/core/hooks/usePageVisibility'

// ── Constants ────────────────────────────────────────────────────────────────

const PARTICLE_COUNT_NORMAL  = 80
const PARTICLE_COUNT_REDUCED = 40
const BENCHMARK_THRESHOLD_MS = 16
const PARTICLE_RADIUS        = 2.5
const PARTICLE_BASE_OPACITY  = 0.35
const SPEED                  = 0.3  // px per frame

// ── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ParticleCanvas() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const isVisible    = usePageVisibility()
  const isVisibleRef = useRef<boolean>(isVisible)

  // Sync visibility into a ref so the rAF loop reads the latest value without
  // being re-created on every visibility change.
  useEffect(() => {
    isVisibleRef.current = isVisible
  }, [isVisible])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // ── Resize handling ───────────────────────────────────────────────────────
    function resize() {
      if (!canvas) return
      canvas.width  = canvas.offsetWidth  * devicePixelRatio
      canvas.height = canvas.offsetHeight * devicePixelRatio
      ctx!.scale(devicePixelRatio, devicePixelRatio)
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // ── Benchmark to determine particle tier ──────────────────────────────────
    // Render a small test batch and measure elapsed time.
    const benchStart   = performance.now()
    const benchCount   = PARTICLE_COUNT_NORMAL
    ctx.beginPath()
    for (let i = 0; i < benchCount; i++) {
      ctx.arc(
        rand(0, canvas.offsetWidth),
        rand(0, canvas.offsetHeight),
        PARTICLE_RADIUS,
        0,
        Math.PI * 2
      )
    }
    ctx.fill()
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    const benchElapsed = performance.now() - benchStart

    const count = benchElapsed > BENCHMARK_THRESHOLD_MS
      ? PARTICLE_COUNT_REDUCED
      : PARTICLE_COUNT_NORMAL

    // ── Particle state — Float32Array buffers (Doc 07 §5.3) ──────────────────
    const px  = new Float32Array(count)  // x positions
    const py  = new Float32Array(count)  // y positions
    const pvx = new Float32Array(count)  // x velocities
    const pvy = new Float32Array(count)  // y velocities
    const po  = new Float32Array(count)  // opacity

    const w = () => canvas!.offsetWidth
    const h = () => canvas!.offsetHeight

    for (let i = 0; i < count; i++) {
      px[i]  = rand(0, w())
      py[i]  = rand(0, h())
      pvx[i] = rand(-SPEED, SPEED)
      pvy[i] = rand(-SPEED, SPEED)
      po[i]  = rand(0.1, PARTICLE_BASE_OPACITY)
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    function tick() {
      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const cw = w()
      const ch = h()

      ctx!.clearRect(0, 0, cw, ch)

      // Single fillStyle set per frame — not per particle (Doc 07 §5.3)
      ctx!.fillStyle = `rgba(0, 245, 196, ${PARTICLE_BASE_OPACITY})`

      ctx!.beginPath()
      for (let i = 0; i < count; i++) {
        // Update position
        px[i] += pvx[i]
        py[i] += pvy[i]

        // Wrap around edges
        if (px[i] < 0)  px[i] = cw
        if (px[i] > cw) px[i] = 0
        if (py[i] < 0)  py[i] = ch
        if (py[i] > ch) py[i] = 0

        // Queue arc — all drawn in one fill call below
        ctx!.moveTo(px[i] + PARTICLE_RADIUS, py[i])
        ctx!.arc(px[i], py[i], PARTICLE_RADIUS, 0, Math.PI * 2)
      }
      ctx!.fill()

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
      }}
    />
  )
}