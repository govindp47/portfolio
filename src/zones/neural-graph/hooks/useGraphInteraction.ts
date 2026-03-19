import { useState } from 'react'

export interface UseGraphInteractionReturn {
  hoveredNodeId: string | null
  selectedNodeId: string | null
  handleNodeHover: (id: string | null) => void
  handleNodeClick: (id: string) => void
  handleSvgClick: () => void
}

/**
 * Manages hover and selection state for the Neural Graph.
 * All state is local — never promoted to global store.
 *
 * openOverlay for quiz is NOT called here — that is NodeDetailPanel's
 * responsibility (T-028), keeping this hook free of store dependencies.
 */
export function useGraphInteraction(): UseGraphInteractionReturn {
  const [hoveredNodeId, setHoveredNodeId]   = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  function handleNodeHover(id: string | null): void {
    setHoveredNodeId(id)
  }

  function handleNodeClick(id: string): void {
    // Toggle: clicking the selected node deselects it
    setSelectedNodeId((prev) => (prev === id ? null : id))
  }

  function handleSvgClick(): void {
    // Background click closes the detail panel
    setSelectedNodeId(null)
  }

  return {
    hoveredNodeId,
    selectedNodeId,
    handleNodeHover,
    handleNodeClick,
    handleSvgClick,
  }
}