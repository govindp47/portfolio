# 06 — Dynamic UI Systems

**Product:** GovindOS v3.0  
**Document Type:** Rendering System Specifications for All Dynamic UI Components

---

## 1. Overview

GovindOS contains five distinct dynamic UI systems, each with its own rendering model, interaction contract, and animation behavior. These systems are not generic UI patterns — each is purpose-built for its zone and carries specific performance and behavioral requirements defined by the product spec.

The five systems are:

1. Skill Graph Rendering System (Neural Graph zone)
2. Terminal Rendering System (Terminal overlay)
3. Project Detail Expansion System (Memory Vault zone)
4. Dashboard Metrics Rendering (Control Room zone)
5. Animation Orchestration Model (cross-zone)

---

## 2. Skill Graph Rendering System

### 2.1 Rendering Architecture

The Neural Graph renders inside a dedicated SVG element hosted by `GraphCanvas.tsx`. The SVG occupies the full available zone area. D3's force simulation runs as a side-effect external to React's render cycle — it mutates node position data directly and triggers SVG attribute updates via D3's selection API, bypassing React reconciliation for position updates.

This is the correct architectural boundary: React owns **structural** changes (node additions/removals, panel open/close, mode switches), while D3 owns **positional** changes (simulation tick updates, zoom/pan transforms).

### 2.2 Force Simulation Lifecycle

```
Zone Mount
  │
  ▼
useForceSimulation initializes:
  - Nodes array from ContentState.skills (SimulationNode[])
  - Links array from ContentState.edges (SimulationLink[])
  - d3.forceSimulation with:
      forceLink (edge-based attraction)
      forceManyBody (node repulsion, strength by node type)
      forceCenter (centered on SVG viewport midpoint)
      forceCollide (minimum node separation by radius)
  │
  ▼
Simulation ticks:
  - Each tick updates SimulationNode.x, SimulationNode.y
  - D3 selection updates <circle> cx/cy and <line> x1/y1/x2/y2 attributes
  - React state is NOT updated on each tick
  │
  ▼
Simulation reaches alpha threshold (cooled):
  - Simulation stops automatically
  - Final positions are stable
  │
  ▼
Zone Unmount:
  - simulation.stop() called in useEffect cleanup
  - All D3 selections released
```

### 2.3 Node Rendering

Each skill node is rendered as an SVG `<circle>` with the following attribute bindings:

| Attribute | Source |
|---|---|
| `cx`, `cy` | SimulationNode position (D3-managed) |
| `r` | Node type constant: language=18, concept=14, domain=20 |
| `fill` | Derived from `Skill.mastery` via a color interpolation scale (low mastery → muted, high mastery → full accent color) |
| `stroke` | Accent color at 40% opacity (default); full accent on hover/selected |
| `stroke-width` | 1.5px default; 2.5px on hover/selected |
| `opacity` | 1.0 default; 0.15 when a different node is hovered (dimmed) |

Node labels (`<text>` elements) are rendered as siblings to `<circle>` elements, positioned at `cy + r + 6`. Labels are suppressed in Recruiter Mode's list fallback.

### 2.4 Edge Rendering

Each skill edge is rendered as an SVG `<line>` with:

| Attribute | Source |
|---|---|
| `x1`, `y1`, `x2`, `y2` | Source and target SimulationNode positions |
| `stroke` | Muted accent color |
| `stroke-width` | Mapped from `SkillEdge.weight` (0→1) to a pixel range of 0.5px–3px |
| `opacity` | 0.3 default; 0.8 when either endpoint node is hovered; 0.05 when neither endpoint is hovered and another node is |
| `stroke-dasharray` | None (solid lines only) |

Edges are rendered in a dedicated `<g class="edges">` group placed before the nodes group in the SVG DOM, ensuring nodes always render above edges.

### 2.5 Entry Animation Sequence

On zone mount, nodes and edges do not appear instantly. The entry animation sequence is:

```
Frame 0:       All nodes opacity: 0, all edges opacity: 0
               Force simulation starts running
               
Staggered fade (CSS transition on opacity):
  Nodes: fade in over 400ms with 20ms stagger per node (by displayIndex)
  Edges: fade in over 300ms after all nodes have started appearing (+200ms delay)

Simulation ticks run in parallel — positions settle while opacity animates
```

This is implemented via a CSS `transition: opacity 400ms ease` on each node element, with a `transitionDelay` computed from node index at render time. The delay is applied once and not reactive after mount.

### 2.6 Hover Interaction — Adjacency Highlighting

`useAdjacencyMap` pre-computes a `Map<SkillId, Set<SkillId>>` from the edge list at zone mount. On node hover:

```
hoveredNodeId set to hovered Skill.id (local state)

For each node in render:
  if node.id === hoveredNodeId → full opacity, strong stroke
  if adjacencyMap.get(hoveredNodeId).has(node.id) → full opacity
  else → 0.15 opacity

For each edge in render:
  if edge.source === hoveredNodeId OR edge.target === hoveredNodeId → 0.8 opacity
  else → 0.05 opacity
```

This computation runs synchronously in the render pass using the pre-built adjacency map. No graph traversal occurs on each hover event.

### 2.7 Node Detail Panel

Clicking a node sets `selectedNodeId` in local state and renders `NodeDetailPanel` as an absolutely-positioned element within the zone's layout (not an overlay). The panel displays:

- Skill label and type
- Mastery depth label (`Familiar / Advanced / Expert`)
- Confidence percentage
- Description
- Associated project count with a link to Memory Vault filtered by this skill (navigates to Memory Vault; filter is a session-scoped hint passed via global state)
- "Test this skill" prompt (triggers `openOverlay("quiz-modal")`)

The panel closes on clicking the node again, clicking elsewhere in the SVG, or on zone exit.

### 2.8 Pan and Zoom

D3's `zoom` behavior is attached to the SVG root element. Zoom applies a transform to a `<g class="viewport">` group wrapping all nodes and edges. Zoom range: minimum scale 0.4×, maximum scale 3×. Pan is unconstrained within a generous boundary to allow full graph exploration. The zoom transform is local state and resets on zone exit.

### 2.9 Recruiter / Safe Mode Fallback

When `activeMode` is `"recruiter"` or `"safe"`, `NeuralGraphZone` renders `GraphListFallback` instead of `GraphCanvas`. The fallback renders skills grouped by type (`Language`, `Concept`, `Domain`) as a structured list, each entry showing label and depth label. No D3 code is initialized.

---

## 3. Terminal Rendering System

### 3.1 Overlay Structure

The Terminal is a floating overlay positioned in the lower half of the viewport. It is a persistent React mount (never unmounted while the session is active) with CSS `visibility` toggled by `terminalOpen`. This preserves the terminal history in local DOM state without requiring every keystroke to write to the global store.

Layout:

```
TerminalOverlay
├── Header bar: "govind@os:~$" identifier + close button
├── TerminalHistory (scrollable, virtualized)
│   └── TerminalEntry × N
└── TerminalInput (always focused when terminal is open)
```

### 3.2 History Virtualization

`TerminalHistory` renders only the entries visible within the scrollable container plus an overscan buffer of 5 entries above and below the visible window. Entry height is fixed (one line for input/error entries; variable for multi-line output entries). Variable-height entries are measured on first render and cached.

The scroll position snaps to the bottom on each new entry append. If the user has scrolled up to review history, the auto-snap is suppressed until the user scrolls back to the bottom.

### 3.3 Command Input Behavior

`TerminalInput` is a controlled `<input type="text">` bound to the `inputBuffer` in the terminal slice. Key event handling:

| Key | Behavior |
|---|---|
| `Enter` | Dispatch `submitCommand(inputBuffer)`; clear `inputBuffer` |
| `Tab` | Run prefix-match autocomplete against command registry; update `inputBuffer` or append disambiguation output |
| `ArrowUp` | Walk backward through submitted command history (input-history navigation, local state) |
| `ArrowDown` | Walk forward through submitted command history |
| `Escape` | Blur the input field (does not close the terminal) |

Input history navigation is local state within `TerminalInput` — it does not modify the terminal history in the store. It tracks a `historyIndex` cursor over the `input`-type entries in `TerminalState.history`.

### 3.4 Output Rendering

Each `TerminalEntry` renders differently by type:

| Type | Rendering |
|---|---|
| `input` | Prompt prefix + command text, accent color |
| `output` | Plain monospace text; supports line breaks via `\n` split into multiple `<div>` elements |
| `error` | Error text in muted red/amber; no prompt prefix |

Output strings from command resolvers are plain strings. The rendering layer splits on `\n` — no Markdown, no HTML parsing. Multi-column output (e.g., a skills list with aligned columns) is achieved via pre-formatted string spacing in the resolver function.

### 3.5 Command Execution Flow

```
User presses Enter
  │
  ▼
submitCommand(inputBuffer) dispatched to terminal slice
  │
  ▼
Terminal slice:
  1. Appends input entry to history
  2. Resolves command from registry
  3. If found: invokes resolver(args, contentState)
     - If resolver returns string: appends output entry synchronously
     - If resolver returns Promise<string>: appends "..." placeholder,
       awaits resolution, replaces placeholder with result
  4. If not found: appends error entry
  5. Clears inputBuffer
```

### 3.6 `goto` Command Side-Effect

When the `goto` resolver runs with a valid zone ID, it calls `navigateTo(zoneId)` from the navigation slice. The terminal output confirms the navigation (`"Navigating to <zone-name>..."`). The terminal remains open during and after the zone transition.

---

## 4. Project Detail Expansion System

### 4.1 Accordion Behavior

Memory Vault maintains a single `expandedProjectId: string | null` in local state. At any time, at most one project card is in the expanded state.

Clicking a collapsed card:

- Sets `expandedProjectId` to that project's ID
- The previously expanded card (if any) collapses simultaneously

Clicking an expanded card or its `×` dismiss button:

- Sets `expandedProjectId` to `null`
- Card collapses

Deep Mode override: `expandedProjectId` is ignored; all cards render in their expanded state. The `×` button is hidden in Deep Mode.

### 4.2 Expand/Collapse Animation

Framer Motion's `layout` prop is applied to each `ProjectCard` container. Height transition is animated automatically by Framer Motion's layout animation system — no manual height calculation or CSS height transitions are used.

The expanded content (`ProjectExpanded`) is wrapped in `AnimatePresence` with a fade-in + upward translate entry animation (opacity: 0→1, y: 8→0, duration: 200ms). Exit animation is fade-out only (opacity: 1→0, duration: 150ms).

The surrounding cards reflow smoothly via Framer Motion's shared layout animation when one card expands or collapses.

### 4.3 Architecture Section Toggle

Each project card maintains an independent `architectureVisible: boolean` in local state via `useArchitectureToggle`. The toggle is only visible in the expanded state. The architecture section animates in/out using the same fade + translate pattern as the expanded content.

The architecture section toggle state is **independent of the accordion state** — a card can be expanded with architecture hidden, and toggling architecture does not affect the accordion.

### 4.4 Card Render States

| State | Components Rendered |
|---|---|
| Collapsed | Title, problem (one-line), stack tags, outcome metric |
| Expanded | Title, problemFull, constraints, tradeoffs, architecture (if toggled), outcomeFull, demo link |
| Deep Mode | All expanded content always visible; no expand/collapse controls |

### 4.5 Demo Link Handling

`demoUrl` is only rendered when non-null. It opens in a new tab with `rel="noopener noreferrer"`. No tracking parameters are appended. The link element is visually distinct (underlined, accent color) from the body text.

---

## 5. Dashboard Metrics Rendering

### 5.1 Control Room Metric Panel

The metrics panel renders a grid of `MetricBadge` components sourced from `SystemMeta.metrics`. Each badge displays:

- Value (large, accent color)
- Label (small, muted text below)
- Tooltip (revealed on hover)

### 5.2 Status Badge Behavior

The system status badge (`GovindOS v3.0 — STATUS: RUNNING`) has a two-phase animation:

```
Phase 1 (on mount, 0–3000ms):
  Pulse animation — opacity oscillates between 0.7 and 1.0 on a 600ms cycle
  Implemented as a CSS keyframe animation on the badge element

Phase 2 (after 3000ms):
  Animation stops; badge settles at opacity: 1.0
  Implemented via a local setTimeout that removes the animation class
```

The pulse is CSS-driven, not JavaScript-driven. The setTimeout only manages the class removal — it does not drive the animation itself.

### 5.3 Tooltip Behavior

Tooltips are hover-triggered, locally managed (no portal). They appear below the hovered metric badge after a 200ms hover delay (prevents flicker on cursor pass-through). They dismiss immediately on mouse-leave. Tooltip content comes from `MetricItem.tooltip`.

In Recruiter Mode, tooltips remain active — they are information-bearing and not decorative.

### 5.4 CTA Buttons

The two primary CTA buttons ("View Skills", "Open Projects") dispatch `navigateTo` on click. No hover animations beyond the standard glow state defined in the design system. No loading state — navigation is instant.

---

## 6. Animation Orchestration Model

### 6.1 Zone Entry Animation

Every zone root component applies a consistent entry animation on mount:

```
Initial:    opacity: 0, y: 12px
Animate:    opacity: 1, y: 0px
Duration:   300ms
Easing:     ease-out
Condition:  Skipped entirely if useReducedMotion() returns true
            Skipped if activeMode is "safe"
```

This is implemented as a Framer Motion `motion.div` wrapping the zone's root element. The animation is defined once in a shared `zoneEntryVariants` object in `/core/utils` and imported by all zone root components.

### 6.2 Zone Exit Animation

Zone exit is handled by Framer Motion's `AnimatePresence` in `ZonePlane`. The exiting zone plays:

```
Exit:       opacity: 0
Duration:   200ms
Easing:     ease-in
```

The entering zone's entry animation starts 50ms after the exit animation begins (overlap, not sequential). Total transition perceived duration: ~300ms.

### 6.3 Mode Switch Animation Contract

Mode switches produce **no cross-fade animation**. The active zone re-renders with the new mode immediately. Individual components within the zone may have their own show/hide transitions (e.g., the graph canvas fading out as the list fades in when switching to Recruiter Mode), but these are zone-internal and optional.

### 6.4 Stagger Patterns

Stagger is used in two locations:

**Neural Graph node entry** — 20ms stagger between nodes (by index). Implemented via `transitionDelay` CSS property set at render time.

**Memory Vault card list entry** — When the zone first mounts, cards stagger in with a 40ms delay between each card. Implemented via Framer Motion's `staggerChildren` in the container variants. This stagger only plays on initial zone mount, not when the accordion state changes.

### 6.5 Idle and Ambient Animations

The following animations are CSS-driven, loop-aware, and never tied to React render cycles:

| Element | Animation | Duration | Trigger |
|---|---|---|---|
| Status badge | Pulse (opacity) | 600ms cycle × 5 | On mount; stops after 3s |
| HUD glow elements | Soft glow pulse | 3s cycle | Continuous while visible |
| Particle system | Drift + fade | Per-particle variable | Continuous; paused on tab hide |
| Background grid | Static | — | No animation |
| Boot scanline | Sweep | 2s total | Once on boot |

No CSS animation loops indefinitely on interactive or content elements. Only ambient background elements loop — never cards, nodes, or data displays.

### 6.6 Reduced Motion Fallback Map

| Normal Animation | Reduced Motion Replacement |
|---|---|
| Zone entry fade + translate | No animation (instant render) |
| Card expand/collapse height | Instant height change (no transition) |
| Graph node fade-in stagger | Instant appearance |
| Graph edge draw-in | Instant appearance |
| Status badge pulse | No pulse; static display |
| Notification toast slide-in | Instant appearance |
| Boot sequence scanline | Shortened; 500ms total |

The reduced motion fallback is enforced at two levels: `useReducedMotion()` in component code for Framer Motion animations, and a `@media (prefers-reduced-motion: reduce)` rule in the global stylesheet that overrides all CSS keyframe animations.
