import { useState } from 'react'

export interface UseProjectAccordionReturn {
  expandedProjectId: string | null
  toggleProject: (id: string) => void
}

export function useProjectAccordion(): UseProjectAccordionReturn {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null)

  function toggleProject(id: string): void {
    setExpandedProjectId((prev) => (prev === id ? null : id))
  }

  return { expandedProjectId, toggleProject }
}