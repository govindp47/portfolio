// OverlayPlane reads overlayStack from the store and is architecturally wired.
// Overlay implementations are deferred to Phase 2–4 per the execution plan.
// This stub satisfies the wiring contract without rendering anything yet.

import { useStore } from '@/core/hooks/useStore'

export default function OverlayPlane() {
  // overlayStack is read here to establish the subscription.
  // Overlay rendering will be activated per overlay (Phase 2–4).
  // @ts-expect-error: intentional subscription side-effect
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _overlayStack = useStore((s) => s.overlayStack)

  return null
}