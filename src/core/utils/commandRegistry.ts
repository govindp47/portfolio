/**
 * Command Registry — STUB
 *
 * Full command registry is implemented in T-032 (Phase 4 — Terminal).
 * This file exists now because the terminal slice references it conceptually
 * and downstream imports must resolve without error.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandRegistry = Record<string, any>

export const commandRegistry: CommandRegistry = {}