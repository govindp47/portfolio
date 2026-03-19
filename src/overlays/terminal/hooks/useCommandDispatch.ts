import { useStore } from '@/core/hooks/useStore'

export interface UseCommandDispatchReturn {
  dispatch: (input: string) => void
}

/**
 * Thin wrapper over submitCommand.
 * Command resolution logic lives in the terminal slice (replaced in T-032).
 */
export function useCommandDispatch(): UseCommandDispatchReturn {
  const submitCommand = useStore((s) => s.submitCommand)

  return {
    dispatch: (input: string) => submitCommand(input),
  }
}