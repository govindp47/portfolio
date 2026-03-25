import { commandRegistry } from '@/core/utils/commandRegistry'

export interface UseAutocompleteReturn {
  getSuggestions: (input: string) => string[]
  applyCompletion: (input: string) => string
}

/**
 * Prefix-matches the input against all registered command names and aliases.
 * commandRegistry is a stub until T-032 — will return empty suggestions until then.
 */
export function useAutocomplete(): UseAutocompleteReturn {
  function getSuggestions(input: string): string[] {
    if (!input.trim()) return []
    const lower = input.toLowerCase()
    const matches: string[] = []
    for (const key of Object.keys(commandRegistry)) {
      if (key.startsWith(lower)) matches.push(key)
    }
    return matches
  }

  function applyCompletion(input: string): string {
    const matches = getSuggestions(input)
    if (matches.length === 1) return matches[0]
    // Multiple or zero matches — caller handles the disambiguation display
    return input
  }

  return { getSuggestions, applyCompletion }
}