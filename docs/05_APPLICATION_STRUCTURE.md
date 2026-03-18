# 05 — Application Structure

**Product:** GovindOS v3.0  
**Document Type:** Module Structure, Component Hierarchy, UI Composition Patterns

---

## 1. Structural Philosophy

The application is organized around **functional ownership boundaries**, not file-type grouping. Every directory contains everything needed for its concern — components, hooks, utilities, and types — rather than scattering related files across a flat structure by category (e.g., `/components`, `/hooks`, `/utils` at the root level).

This structure supports two properties essential for this product:

- **Zone isolation** — A zone's entire rendering surface, local state logic, and zone-specific utilities live in one directory. A developer working on the Neural Graph never navigates outside `/zones/neural-graph`.
- **Core shareability** — Cross-zone concerns (design system, state store, content types, shared hooks) live in `/core` and are the only layer that zones import from. Zones never import from other zones.

---

## 2. Top-Level Directory Structure

```
/govindos
├── /public
│   ├── resume.pdf                  // Static pre-generated resume asset
│   └── fonts/                      // Preloaded font files
│
├── /content
│   ├── projects.json
│   ├── skills.json
│   ├── edges.json
│   ├── timeline.json
│   ├── arena.json
│   └── meta.json
│
├── /src
│   ├── main.tsx                    // Application entry point
│   ├── App.tsx                     // Root shell — layer composition
│   │
│   ├── /core                       // Shared application infrastructure
│   │   ├── /store                  // Zustand store slices
│   │   ├── /types                  // Global TypeScript interfaces and enums
│   │   ├── /hooks                  // Shared React hooks
│   │   ├── /design-system          // Tokens, base components, glassmorphism
│   │   └── /utils                  // Pure utility functions
│   │
│   ├── /zones                      // One directory per zone
│   │   ├── /control-room
│   │   ├── /memory-vault
│   │   ├── /neural-graph
│   │   ├── /timeline-tunnel
│   │   ├── /arena
│   │   └── /gateway
│   │
│   ├── /overlays                   // Overlay-plane components
│   │   ├── /terminal
│   │   └── /quiz-modal
│   │
│   ├── /hud                        // HUD-plane components
│   │   ├── /navbar
│   │   ├── /minimap
│   │   ├── /mode-selector
│   │   └── /game-hud
│   │
│   ├── /ambient                    // Ambient environment plane
│   │   ├── ParticleCanvas.tsx
│   │   └── BackgroundGrid.tsx
│   │
│   └── /boot                       // Boot sequence module
│       └── BootSequence.tsx
│
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 3. Core Module Structure

### 3.1 `/core/store`

```
/store
├── index.ts                        // Composed store export (all slices merged)
├── navigationSlice.ts
├── modeSlice.ts
├── terminalSlice.ts
├── gameSlice.ts
├── sessionSlice.ts
└── contentSlice.ts
```

Each slice file exports its state interface, action definitions, and the slice creator function. The `index.ts` composes all slices into the single Zustand store instance exported application-wide. No component imports directly from a slice file — all store access goes through `index.ts`.

### 3.2 `/core/types`

```
/types
├── zones.ts                        // ZoneId union, zone metadata type
├── content.ts                      // All content entity interfaces (Project, Skill, etc.)
├── state.ts                        // Global state interfaces mirroring store shape
├── overlays.ts                     // OverlayId union, overlay metadata type
└── modes.ts                        // UserMode union, mode capability map type
```

All TypeScript interfaces defined in the Data Model document (Document 03) are declared here. Content types are the single source of truth for both the JSON loading layer and the rendering layer.

### 3.3 `/core/hooks`

```
/hooks
├── useStore.ts                     // Typed selector hook wrapping Zustand useStore
├── useNavigate.ts                  // Convenience hook: exposes navigateTo action
├── useMode.ts                      // Returns activeMode and mode capability flags
├── useContent.ts                   // Returns typed content slices from store
├── useFocusTrap.ts                 // Overlay focus management
├── useReducedMotion.ts             // Wraps Framer Motion's useReducedMotion
└── usePageVisibility.ts            // Page Visibility API for particle canvas suspension
```

Hooks in `/core/hooks` are **read-only or action-dispatch only** — they never hold local state. Any hook that holds local state belongs in the zone directory that owns it.

### 3.4 `/core/design-system`

```
/design-system
├── tokens.css                      // CSS custom properties (color, spacing, radius, shadow)
├── /components
│   ├── GlassPanel.tsx              // Glassmorphism container — used across all zones
│   ├── Tag.tsx                     // Tech stack tag chip
│   ├── MetricBadge.tsx             // Metric display with tooltip
│   ├── SectionHeading.tsx          // Consistent zone section title treatment
│   ├── ActionButton.tsx            // Primary CTA button with neon accent
│   └── DismissButton.tsx           // "×" close affordance (used in cards, modals)
└── /typography
    ├── MonoText.tsx                 // Monospace text wrapper (terminal, code)
    └── BodyText.tsx                 // Standard body text wrapper
```

`GlassPanel` is the most widely used shared component. It accepts `children` and optional modifier props (e.g., `elevated`, `bordered`) and applies the consistent `backdrop-filter`, border glow, and background treatment defined in the visual spec. No zone re-implements glassmorphism independently.

### 3.5 `/core/utils`

```
/utils
├── contentLoader.ts                // Parallel JSON fetch + schema validation
├── commandRegistry.ts              // Terminal command registry definition and lookup
├── zoneRegistry.ts                 // Zone metadata map (id → display name, lazy component)
├── idResolver.ts                   // Cross-entity ID-to-label resolution utilities
└── sessionStorage.ts               // sessionStorage read/write helpers
```

`zoneRegistry.ts` is the authoritative map of zone IDs to their lazy-loaded React components. The navigation system reads from this registry to mount zones — it does not import zone components directly.

---

## 4. Zone Module Structure

Each zone follows an identical internal structure. This consistency is enforced by convention and allows any developer to navigate any zone without orientation time.

```
/zones/<zone-id>
├── index.ts                        // Public export: the zone's root component (lazy boundary)
├── <ZoneName>Zone.tsx              // Root zone component — layout and mode branching
├── /components                     // Zone-private sub-components
│   └── ...
├── /hooks                          // Zone-private hooks (local state logic)
│   └── ...
└── types.ts                        // Zone-private types (if any)
```

The `index.ts` file is the **only export** from a zone directory. All internal components are private. No other zone or the application shell imports from a zone's `/components` or `/hooks` subdirectories.

### 4.1 Zone Root Component Contract

Every zone root component (`<ZoneName>Zone.tsx`) must satisfy the following interface:

- Accepts no props (all data sourced via `useContent` and `useMode` hooks).
- Renders a mode-appropriate layout branch based on `activeMode`.
- Manages its own local interaction state internally.
- Dispatches navigation events via `useNavigate` — never manipulates global state directly.
- Wraps its content in at least one `GlassPanel` for visual consistency.
- Applies Framer Motion entry animation on mount (unless `useReducedMotion` returns true).

### 4.2 Zone Directory Detail — Memory Vault (Example)

```
/zones/memory-vault
├── index.ts
├── MemoryVaultZone.tsx             // Layout: grid of project cards
├── /components
│   ├── ProjectCard.tsx             // Collapsed card state
│   ├── ProjectExpanded.tsx         // Expanded case study state
│   ├── TradeoffList.tsx            // Rendered tradeoff records
│   ├── ArchitectureSection.tsx     // Togglable architecture block
│   └── StackTags.tsx               // Tech stack tag row
├── /hooks
│   ├── useProjectAccordion.ts      // Manages expandedProjectId local state
│   └── useArchitectureToggle.ts    // Manages per-card architecture visibility
└── types.ts
```

### 4.3 Zone Directory Detail — Neural Graph (Example)

```
/zones/neural-graph
├── index.ts
├── NeuralGraphZone.tsx             // Layout: SVG canvas or list fallback
├── /components
│   ├── GraphCanvas.tsx             // D3 force simulation host + SVG root
│   ├── GraphNode.tsx               // Individual SVG node element
│   ├── GraphEdge.tsx               // Individual SVG edge element
│   ├── NodeDetailPanel.tsx         // Skill metadata panel (on node click)
│   └── GraphListFallback.tsx       // Text list render for Recruiter/Safe Mode
├── /hooks
│   ├── useForceSimulation.ts       // D3 force layout initialization and tick management
│   ├── useGraphInteraction.ts      // Hover node ID, selected node ID local state
│   ├── useZoomPan.ts               // D3 zoom behavior binding
│   └── useAdjacencyMap.ts          // Pre-computed adjacency lookup from edge list
└── types.ts                        // GraphNode position type, SimulationNode type
```

### 4.4 Zone Directory Detail — Terminal Overlay (Example)

```
/overlays/terminal
├── index.ts
├── TerminalOverlay.tsx             // Overlay container, position, backdrop
├── /components
│   ├── TerminalHistory.tsx         // Virtualized output history
│   ├── TerminalInput.tsx           // Command input field with autocomplete
│   └── TerminalEntry.tsx           // Single history line (input | output | error)
└── /hooks
    ├── useCommandDispatch.ts       // Submits command to Zustand terminal slice
    └── useAutocomplete.ts          // Tab-completion prefix matching logic
```

---

## 5. HUD Module Structure

```
/hud
├── HudPlane.tsx                    // Composes all HUD elements; rendered in Layer 3
├── /navbar
│   ├── NavBar.tsx                  // Zone navigation bar root
│   └── NavItem.tsx                 // Individual zone link/button
├── /minimap
│   ├── MiniMap.tsx                 // Floating zone map overlay
│   └── MiniMapNode.tsx             // Zone node within the mini-map
├── /mode-selector
│   └── ModeSelector.tsx            // Mode toggle control
└── /game-hud
    ├── GameHud.tsx                 // Explorer-mode HUD wrapper (hidden otherwise)
    ├── ExplorationLevel.tsx        // Level indicator display
    └── ZoneUnlockNotification.tsx  // Auto-dismissing toast
```

`HudPlane.tsx` reads `activeMode` from the store and conditionally renders `GameHud` only in Explorer Mode. It never unmounts `NavBar` or `ModeSelector` — these are always present.

---

## 6. Ambient and Boot Modules

### `/ambient`

```
/ambient
├── AmbientPlane.tsx                // Renders particle canvas + background grid
├── ParticleCanvas.tsx              // Canvas-based particle system
└── BackgroundGrid.tsx              // CSS-grid or SVG ambient grid overlay
```

`AmbientPlane.tsx` reads `activeMode` and renders `null` in Recruiter, Deep, and Safe modes. The particle canvas hooks into `usePageVisibility` to suspend its animation loop when the tab is hidden.

### `/boot`

```
/boot
├── BootSequence.tsx                // Full-screen boot overlay component
└── bootLines.ts                    // Static array of fake module loading strings
```

`BootSequence.tsx` is lazy-loaded via `React.lazy`. It self-manages its own animation timeline using CSS keyframes and a local timer. On completion, it calls `markBootPlayed()` and `sessionStorage.setItem`. It accepts an `onComplete` callback prop from `App.tsx`.

---

## 7. App Shell Composition (`App.tsx`)

`App.tsx` is the root composition layer. It assembles the four rendering layers and manages the boot gate.

```
App.tsx composition:

if !contentLoaded:
  → render loading gate (minimal; hidden behind boot overlay)

if !bootPlayed:
  → render <BootSequence onComplete={handleBootComplete} />

render:
  <div id="app-shell">
    <AmbientPlane />               // Layer 1 — always mounted, conditionally active
    <ZonePlane />                  // Layer 2 — active zone via zoneRegistry
    <HudPlane />                   // Layer 3 — always mounted
    <OverlayPlane />               // Layer 4 — conditionally rendered from overlayStack
  </div>
```

`ZonePlane` is a dedicated component that reads `activeZone` from the store, resolves the lazy component from `zoneRegistry`, and wraps it in a `Suspense` boundary and `AnimatePresence` for transition management.

`OverlayPlane` reads `overlayStack` and renders the appropriate overlay components in stack order. The Terminal overlay is always instantiated but conditionally visible (CSS visibility, not unmount) to preserve terminal history without persisting to the store on every keystroke.

---

## 8. Component Hierarchy Summary

```
App
├── BootSequence (lazy, conditional)
├── AmbientPlane
│   ├── ParticleCanvas
│   └── BackgroundGrid
├── ZonePlane
│   └── <ActiveZone> (lazy, via zoneRegistry)
│       └── [zone-specific component tree]
├── HudPlane
│   ├── NavBar
│   │   └── NavItem (×N)
│   ├── MiniMap (conditional: Explorer Mode)
│   │   └── MiniMapNode (×N)
│   ├── ModeSelector
│   └── GameHud (conditional: Explorer Mode)
│       ├── ExplorationLevel
│       └── ZoneUnlockNotification
└── OverlayPlane
    ├── TerminalOverlay (persistent mount, conditional visibility)
    │   ├── TerminalHistory
    │   │   └── TerminalEntry (×N, virtualized)
    │   └── TerminalInput
    └── QuizModal (conditional mount, from overlayStack)
```

---

## 9. Reuse Strategy

### What is reused across zones

- `GlassPanel` — Every zone uses this as its primary container primitive.
- `Tag` — Stack tag chips in Memory Vault and Timeline Tunnel.
- `ActionButton` — CTAs in Control Room and Gateway.
- `useMode` — Every zone reads active mode to branch its layout.
- `useContent` — Every zone reads its data from the content slice.
- `useReducedMotion` — Every animated component checks this before animating.

### What is intentionally not reused

Zone-internal components are never shared across zones even if superficially similar. For example, the expand/collapse behavior in Memory Vault and Timeline Tunnel have different data shapes, animation contracts, and interaction models. Abstracting them into a shared "expandable card" component would couple two unrelated zones and create a fragile abstraction. Each zone owns its own expansion logic.

### Reuse decision rule

A component or hook is promoted to `/core` only if it satisfies all three conditions:

1. It is consumed by two or more zones without modification.
2. It carries no zone-specific state or data dependency.
3. Extracting it does not require props that encode zone identity.

If any condition fails, the component stays local to the zone that owns it.

---

## 10. Code Splitting Boundaries

Vite is configured to treat each zone's `index.ts` as a separate chunk boundary via `React.lazy`. The following chunks are produced:

| Chunk | Contents | Load Trigger |
|---|---|---|
| `core` | Store, types, hooks, design system | Eagerly loaded at startup |
| `boot` | BootSequence | Loaded at application mount |
| `control-room` | Control Room zone | Loaded during boot window |
| `memory-vault` | Memory Vault zone | Loaded on first navigation |
| `neural-graph` | Neural Graph zone + D3 | Loaded during boot window (pre-fetch) |
| `timeline-tunnel` | Timeline Tunnel zone | Loaded on first navigation |
| `arena` | Arena zone | Loaded on first navigation |
| `gateway` | Gateway zone | Loaded on first navigation |
| `terminal` | Terminal overlay | Loaded during boot window |
| `quiz-modal` | Quiz modal overlay | Loaded on first Neural Graph visit |

Neural Graph is pre-fetched during the boot window (not eagerly bundled) because it carries the D3 dependency and has the largest chunk weight. Pre-fetching during boot eliminates perceived load delay on first navigation.
