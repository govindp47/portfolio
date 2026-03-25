import { useState, useEffect } from 'react'

export interface UseArchitectureToggleReturn {
  architectureVisible: boolean
  toggleArchitecture:  () => void
}

export function useArchitectureToggle(isExpanded: boolean): UseArchitectureToggleReturn {
  const [architectureVisible, setArchitectureVisible] = useState(false)

  // Reset when card collapses
  useEffect(() => {
    if (!isExpanded) setArchitectureVisible(false)
  }, [isExpanded])

  function toggleArchitecture(): void {
    setArchitectureVisible((prev) => !prev)
  }

  return { architectureVisible, toggleArchitecture }
}