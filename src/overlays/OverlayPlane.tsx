import QuizModal from '@/overlays/quiz-modal'
import TerminalOverlay from '@/overlays/terminal'

export default function OverlayPlane() {
  return (
    <>
      {/* Terminal: persistent mount — visibility toggled by isOpen in store */}
      <TerminalOverlay />
      {/* QuizModal: conditional mount based on overlayStack */}
      <QuizModal />
    </>
  )
}