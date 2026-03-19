import QuizModal from '@/overlays/quiz-modal'

/**
 * OverlayPlane — Layer 4.
 *
 * Mounted overlays:
 *   - QuizModal: conditionally rendered based on overlayStack (Phase 3)
 *   - TerminalOverlay: added in Phase 4 (T-030). Stub placeholder below.
 *
 * QuizModal manages its own AnimatePresence internally and reads
 * overlayStack directly from the store — no props needed here.
 */
export default function OverlayPlane() {
  return (
    <>
      <QuizModal />
      {/*
        TerminalOverlay is added in T-030 (Phase 4).
        It will be a persistent mount with CSS visibility toggling.
        Placeholder: <TerminalOverlay /> — do not activate until T-030.
      */}
    </>
  )
}