import { useState } from 'react'

export interface UseTimelineExpansionReturn {
  expandedEntryId: string | null
  toggleEntry: (id: string) => void
}

export function useTimelineExpansion(): UseTimelineExpansionReturn {
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null)

  function toggleEntry(id: string): void {
    setExpandedEntryId((prev) => (prev === id ? null : id))
  }

  return { expandedEntryId, toggleEntry }
}