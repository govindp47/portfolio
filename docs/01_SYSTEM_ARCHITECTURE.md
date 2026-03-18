# 01 — System Architecture

**Product:** GovindOS v3.0  
**Classification:** UX-Centric Interactive Application — Zone-Based Single Page System  
**Architecture Style:** Component-Isolated Zone Architecture with Shared State Bus

---

## 1. Architectural Philosophy

GovindOS is not a document-rendered application. It is a **state-driven interactive experience** where the primary complexity lives in UI orchestration, rendering layers, mode transitions, and zone-level interaction systems. The architecture must reflect this: the zone is the atomic unit of composition, not the route or the page.

The system is designed around three governing principles:

- **Zone Isolation** — Each zone is a self-contained rendering context with its own layout system, interaction model, and lifecycle hooks.
- **Shared State Bus** — A lightweight global state layer coordinates zone transitions, active mode, terminal visibility, game layer state, and session flags — without coupling zone internals.
- **Rendering Layer Separation** — Background environment, content zones, overlays, and the HUD are rendered on distinct compositing layers to preserve animation performance and avoid layout thrashing.

---

## 2. Zone-Based Architecture

The product is structured around **seven named zones** plus two transient system layers (Boot Sequence, Terminal Overlay). Zones are not routes in the traditional sense — they are instantiated UI modules that mount and unmount within a single rendering root.

### Zone Registry

| Zone ID | Display Name | Rendering Complexity | Interaction Model |
|---|---|---|---|
| `control-room` | Control Room | Low | Static display + tooltips + CTA navigation |
| `memory-vault` | Memory Vault | Medium | Accordion expand/collapse, architecture toggle |
| `neural-graph` | Neural Graph | High | Graph render, pan/zoom, node click, hover highlight |
| `timeline-tunnel` | Timeline Tunnel | Medium | Horizontal scroll, entry expand/collapse |
| `arena` | Arena | Medium | Stat panels, difficulty chart, deep-dive toggle |
| `terminal` | Terminal | Medium | Overlay, command input/output stream |
| `gateway` | Gateway | Low | Link dispatch, file download trigger |

### Transient System Layers

| Layer | Type | Lifecycle |
|---|---|---|
| Boot Sequence | Full-screen blocking overlay | Plays once per session; dismissed on completion |
| Terminal | Non-blocking floating overlay | Toggled independently of active zone; persists within session |
| Mini-map | Floating positional overlay | Visible in Explorer Mode; reflects active zone |
| HUD | Persistent ambient layer | Active in Explorer Mode only; never overlaps content |
| Mode Selector | Persistent nav element | Always visible; triggers instant state transition |
| Notification System | Ambient overlay | Game layer only; auto-dismissing toasts |

---

## 3. UI Composition Model

The application is composed of **four stacked rendering layers**, each serving a distinct function and composited via CSS stacking context management.

```
┌──────────────────────────────────────────────┐
│  LAYER 4 — Overlay Plane                     │
│  Terminal | Modals | Notifications | Minimap  │
├──────────────────────────────────────────────┤
│  LAYER 3 — HUD Plane                         │
│  Game layer HUD | Mode selector | Nav bar     │
├──────────────────────────────────────────────┤
│  LAYER 2 — Zone Plane                        │
│  Active zone content (full-screen mount)     │
├──────────────────────────────────────────────┤
│  LAYER 1 — Ambient Environment Plane         │
│  Particle system | Background grid | Scanlines│
└──────────────────────────────────────────────┘
```

**Layer 1 — Ambient Environment Plane**  
Passive, non-interactive. Renders background particles, the dark OS grid, and ambient glow effects. Runs independently of zone content. Must be GPU-composited and isolated from layout reflow. Off in Safe Mode and Recruiter Mode.

**Layer 2 — Zone Plane**  
The active zone occupies this layer exclusively at full-screen width. Zone mounting and unmounting is governed by the navigation state machine. Only one zone is active at any time. Zone entry/exit is animated via cross-fade; internal zone layout is self-managed.

**Layer 3 — HUD Plane**  
Persistent chrome elements: navigation bar, mode selector, game layer HUD (Explorer Mode only), and mini-map toggle. These elements are always above zone content but below overlay content.

**Layer 4 — Overlay Plane**  
Non-blocking overlays: Terminal, quiz modals (Neural Graph), any notification toasts. The Terminal overlay does not replace the active zone; it sits above it at partial viewport coverage.

---

## 4. Navigation System Design

GovindOS uses a **zone-switching navigation model**, not a URL-routing model. Navigation is driven entirely by UI state — not by browser history or URL segments.

### Navigation State Machine

At any point in time, the navigation system tracks:

- `activeZone` — currently mounted zone ID
- `previousZone` — last mounted zone (for transition direction inference)
- `terminalOpen` — boolean, independent of zone state
- `miniMapOpen` — boolean
- `overlayStack` — ordered stack of active overlay IDs (e.g., quiz modal)

### Zone Transition Rules

1. Navigating to a zone that is already active is a no-op.
2. Zone transition triggers a **cross-fade animation** between the exiting and entering zone.
3. During transition, both the exiting zone (fading out) and the entering zone (fading in) are simultaneously mounted. The exiting zone becomes pointer-events-none immediately.
4. Zone-internal state (e.g., graph pan position, expanded project cards) is reset on zone exit unless explicitly persisted in global state.
5. Terminal overlay state is **not affected** by zone transitions.
6. Mode changes trigger instant re-render of the active zone without zone transition animation.

### Navigation Entry Points

- Navigation bar (always visible — zone icons or labels)
- Mini-map zone nodes (Explorer Mode)
- CTA buttons within zones (e.g., "View Skills" → `neural-graph`)
- Terminal commands (e.g., `goto projects` → `memory-vault`)

---

## 5. Rendering Layers — Performance Boundaries

The architecture imposes strict boundaries between rendering concerns to prevent performance interference between systems.

| Concern | Boundary Rule |
|---|---|
| Ambient particles | Must use Canvas or WebGL — never DOM-based |
| Zone content | DOM-rendered, but isolated in a dedicated stacking context |
| Graph (Neural Graph) | Rendered in its own Canvas or SVG context — not embedded in general DOM flow |
| Terminal output | Virtualized render — only visible lines in DOM |
| Animations | CSS transforms and opacity only — no layout-affecting property animations |
| HUD / nav | Composited layer via `will-change: transform` — never triggers zone repaints |

---

## 6. State Flow Between Zones

Zone-to-zone data flow is mediated through the **Global State Bus** — a centralized reactive store. Zones do not communicate directly.

```
User Action (e.g., "View Skills" CTA)
    │
    ▼
Navigation Event Dispatcher
    │
    ▼
Global State Bus — updates activeZone
    │
    ├──► Zone Plane — unmounts current zone, mounts neural-graph
    ├──► HUD Plane — updates active zone indicator
    └──► Mini-map — highlights neural-graph node
```

Zone-internal interaction events (e.g., expanding a project card in Memory Vault) remain **local to that zone's state** and are never propagated to the global bus unless they produce a navigation side-effect.

---

## 7. Interaction Lifecycle

Every user interaction in GovindOS follows a defined lifecycle:

```
1. INPUT CAPTURE
   User gesture (click / hover / keypress / scroll)

2. INTENT CLASSIFICATION
   Is this a navigation event, a zone-internal interaction,
   a terminal command, or a game layer event?

3. HANDLER DISPATCH
   Route event to the appropriate handler:
   - Navigation handler (zone transitions)
   - Zone interaction handler (local state mutations)
   - Terminal command processor
   - Game layer event handler

4. STATE MUTATION
   Update the appropriate state scope (global or local)

5. RENDER RESPONSE
   React to state mutation via reactive rendering —
   no manual DOM manipulation

6. ANIMATION EXECUTION
   Post-render animation hooks fire for entry/exit effects

7. IDLE RESET
   If applicable, transition to idle visual state
   (e.g., status badge stops pulsing after 3s)
```

---

## 8. Mode-Based Architecture Variants

The four user modes are not separate codepaths — they are **behavioral overlays** on top of the single application structure. Each mode modifies rendering decisions at the state level.

| Mode | Ambient Layer | HUD / Game Layer | Animation Level | Zone Layout |
|---|---|---|---|---|
| Explorer | Active | Active | Full | Full |
| Recruiter | Disabled | Disabled | Reduced | Condensed |
| Deep | Disabled | Disabled | Minimal | Expanded (all cards open) |
| Safe | Disabled | Disabled | None | List-only fallback |

**Mode Switching Contract:**

- Mode changes must complete in a single render cycle — no transition animation.
- The active zone remains mounted during a mode switch; only its presentation is updated.
- Mode is stored in global state and persisted in session storage for continuity.
- Mobile devices initialize in Recruiter Mode behavior regardless of stored preference.

---

## 9. Fallback Architecture (Recruiter Mode / Safe Mode)

The system degrades gracefully across two defined fallback states:

**Recruiter Mode Fallback**

- Ambient environment plane: inactive
- Game layer HUD: hidden
- Animations: CSS `prefers-reduced-motion` respected; fade-only transitions retained
- Neural Graph: rendered as a structured list view (no canvas/SVG graph)
- Timeline: rendered as a vertical stack instead of horizontal scroll
- Content density: unchanged; only presentation layer simplified

**Safe Mode Fallback**

- All animations and transitions disabled
- Ambient environment plane: inactive
- Terminal: still accessible
- Zone content: fully readable in list-based layout
- Neural Graph: text list only
- Boot Sequence: skipped entirely

---

## 10. Boot Sequence Integration

The Boot Sequence is a **blocking overlay** that occupies the entire viewport before the main application shell is visible. It is not a separate route — it is an overlay mounted on top of the fully initialized application.

This means:

- All zones are **pre-initialized** (not pre-rendered) while boot plays
- Heavy zones (Neural Graph) begin lazy-loading during the boot window
- Boot completion triggers a fade-in of the application shell and simultaneous fade-out of the boot overlay
- A session flag (`bootPlayed`) suppresses replay on subsequent navigation; the skip affordance checks this flag on mount

---

## 11. Scalability Considerations

The zone registry is designed to be **additive**. New zones can be introduced without modifying existing zone implementations, as long as they conform to the zone interface contract (mount/unmount lifecycle, mode-aware rendering, global state bus integration).

Content within zones (projects, skills, timeline entries) is sourced from a **normalized content layer** — a structured data schema loaded at application initialization. Adding, removing, or updating content requires no structural code changes — only content data updates.

The Terminal command registry is designed as a **declarative lookup table** — new commands are registered by adding entries to the command map, not by modifying the parser.
