/**
 * Static boot-sequence lines.
 * Three phases: initialization → loading → ready.
 * Purely decorative — no dynamic content.
 */
export const BOOT_LINES: string[] = [
  // Phase 1 — Initialization
  '[INIT] Mounting neural substrate...',
  '[INIT] Allocating memory manifold...',
  '[INIT] Bootstrapping interaction engine...',
  '[INIT] Verifying entropy seed... OK',

  // Phase 2 — Loading
  '[LOAD] Hydrating content corpus...',
  '[LOAD] Resolving skill graph topology...',
  '[LOAD] Indexing project manifold...',
  '[LOAD] Linking timeline entries...',
  '[LOAD] Injecting arena profile data...',
  '[LOAD] Validating edge weights... OK',
  '[LOAD] Pre-fetching zone chunks...',

  // Phase 3 — Ready
  '[OK] Content manifold validated',
  '[OK] Session state synchronized',
  '[OK] All subsystems nominal',
  '[READY] GovindOS v3.0 — SYSTEM ONLINE',
]