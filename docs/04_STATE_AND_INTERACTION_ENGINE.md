# 04 — State and Interaction Engine

**Product:** GovindOS v3.0  
**Document Type:** Global State Model, Zone Switching Logic, Interaction Event System

---

## 1. State Architecture Overview

The state system in GovindOS operates across two distinct scopes:

**Global State (Zustand store)** — Manages all concerns that cross zone boundaries or must survive zone transitions: active zone, active mode, terminal session, game layer progress, session flags, and loaded content data. Any component in the application tree can read from or write to this store without prop-drilling or context nesting.

**Zone-Local State (React component state)** — Manages all ephemeral, zone-internal interaction state: which project card is expanded, the current hover node in the graph, the timeline scroll offset, the terminal input buffer. This state is intentionally discarded on zone unmount. It is never promoted to global state unless it produces a cross-zone side-effect.

The boundary between these two scopes is enforced by convention: zone components own their local state internally and never write directly to global navigation or session state — they dispatch navigation events instead.

---

## 2. Global State Model

### Store Slices

The Zustand store is organized into discrete slices. Each slice is responsible for one coherent concern and exposes its own actions.

---

#### 2.1 Navigation Slice

```
NavigationState {
  activeZone:       ZoneId          // Currently mounted zone
  previousZone:     ZoneId | null   // Last mounted zone (used for transition inference)
  isTransitioning:  boolean         // True during cross-fade; blocks re-entry
  overlayStack:     OverlayId[]     // Ordered stack: last item is the topmost overlay
  miniMapOpen:      boolean
}

NavigationActions {
  navigateTo(zoneId: ZoneId): void
  openOverlay(overlayId: OverlayId): void
  closeOverlay(overlayId: OverlayId): void
  toggleMiniMap(): void
  onTransitionComplete(): void
}
```

**ZoneId** is a string union of all valid zone identifiers: `"control-room" | "memory-vault" | "neural-graph" | "timeline-tunnel" | "arena" | "gateway"`.

**OverlayId** is a string union of all valid overlay identifiers: `"terminal" | "quiz-modal" | "notification"`.

---

#### 2.2 Mode Slice

```
ModeState {
  activeMode:       UserMode        // "explorer" | "recruiter" | "deep" | "safe"
  isMobile:         boolean         // Set on init; drives mobile-default mode behavior
}

ModeActions {
  setMode(mode: UserMode): void
}
```

Mode changes are synchronous and produce no transition animation. The `isMobile` flag is derived from viewport width at application initialization and is never mutated during the session.

---

#### 2.3 Terminal Slice

```
TerminalState {
  isOpen:           boolean
  history:          TerminalEntry[] // Ordered list of all commands and outputs in session
  inputBuffer:      string          // Current value of the command input field
}

TerminalEntry {
  type:             "input" | "output" | "error"
  content:          string
  timestamp:        number          // Unix ms; used for virtualization key
}

TerminalActions {
  openTerminal(): void
  closeTerminal(): void
  submitCommand(input: string): void
  clearHistory(): void
  setInputBuffer(value: string): void
}
```

The terminal `history` array is append-only within a session. `clearHistory` empties the array (triggered by the `clear` command) but does not close the terminal. The `inputBuffer` represents the live text in the command input field, independent of submitted history.

---

#### 2.4 Game Layer Slice

```
GameState {
  isActive:         boolean         // True only in Explorer Mode
  unlockedZones:    ZoneId[]        // Zones visited in this session
  dismissedChallenges: string[]     // Challenge IDs permanently dismissed this session
  explorationLevel: number          // 0–N; increments on zone unlock
}

GameActions {
  unlockZone(zoneId: ZoneId): void
  dismissChallenge(challengeId: string): void
}
```

Game state is session-scoped only. It is not persisted to localStorage. The game layer is activated automatically when `activeMode` is `"explorer"` and deactivated on mode switch.

---

#### 2.5 Session Flags Slice

```
SessionFlags {
  bootPlayed:               boolean   // True after boot sequence completes
  guidedFlowDismissed:      boolean   // True after user dismisses "Start Here" prompt
  contentLoaded:            boolean   // True after all JSON content files are loaded
}

SessionFlagActions {
  markBootPlayed(): void
  dismissGuidedFlow(): void
  markContentLoaded(): void
}
```

`bootPlayed` is also checked against `sessionStorage` on application mount to suppress boot replay for returning visitors within the same browser session.

---

#### 2.6 Content Slice

```
ContentState {
  projects:         Project[]
  skills:           Skill[]
  edges:            SkillEdge[]
  timeline:         TimelineEntry[]
  arena:            ArenaProfile | null
  meta:             SystemMeta | null
}

ContentActions {
  loadContent(payload: ContentState): void
}
```

Content is written to this slice once at initialization and never mutated during the session. All zones read from this slice as a read-only data source.

---

## 3. Zone Switching Logic

### 3.1 Transition State Machine

Zone switching is a multi-step process managed by the Navigation Slice. The state machine has four states:

```
IDLE
  │
  │  navigateTo(zoneId) called
  │  (zoneId !== activeZone)
  ▼
TRANSITIONING_OUT
  │  isTransitioning = true
  │  previousZone = activeZone
  │  Exiting zone begins fade-out animation
  │
  │  Cross-fade duration elapses (~250ms)
  ▼
TRANSITIONING_IN
  │  activeZone = zoneId
  │  Entering zone begins fade-in animation
  │
  │  onTransitionComplete() called
  ▼
IDLE
  │  isTransitioning = false
```

During `TRANSITIONING_OUT` and `TRANSITIONING_IN`, `isTransitioning = true` blocks all further navigation calls. Calls to `navigateTo` while transitioning are **silently dropped** — they are not queued. The UI prevents user-initiated navigation during transition by disabling nav bar interaction while `isTransitioning` is true.

### 3.2 Transition Rules — Edge Cases

| Scenario | Behavior |
|---|---|
| Navigate to the currently active zone | No-op; no state change, no animation |
| Navigate during an active transition | Dropped; transition completes to original target |
| Mode switch while transitioning | Mode state updates immediately; zone layout reflects new mode on mount of entering zone |
| Terminal open during zone transition | Terminal overlay remains visible and unaffected; terminal state is independent |
| Overlay open during zone transition | Overlay remains mounted; zone transition occurs beneath it |
| navigateTo called from Terminal command | Same state machine; no special path |

### 3.3 Zone-Internal State Reset on Exit

When a zone unmounts (activeZone changes away from it), all zone-local React state is automatically discarded by React's component lifecycle. The following zone-internal states are explicitly ephemeral and are not preserved:

- Memory Vault: `expandedProjectId`, architecture toggle state
- Neural Graph: pan/zoom transform, hovered node ID, selected node ID
- Timeline Tunnel: horizontal scroll offset, expanded entry ID
- Arena: deep-dive toggle state

Exception: if a future requirement mandates state persistence across zone exits for a specific zone, that state must be explicitly promoted to the Global State `NavigationState` or a dedicated zone-persistence slice — not handled via workarounds.

---

## 4. Modal and Overlay Handling

### 4.1 Overlay Stack Model

The `overlayStack` in NavigationState is an **ordered array of OverlayIds**. The last element is the topmost overlay. Overlays are not mutually exclusive by default — the terminal can be open simultaneously with a notification toast. The quiz modal is exclusive and closes the terminal if both are triggered simultaneously (enforced in `openOverlay` action logic).

### 4.2 Overlay Lifecycle

```
openOverlay(id)
  │
  ├── If id === "quiz-modal" and "terminal" in overlayStack:
  │     closeOverlay("terminal") first
  │
  └── Append id to overlayStack

closeOverlay(id)
  └── Remove id from overlayStack (in-place; preserves order of others)
```

Clicking outside an overlay triggers `closeOverlay` for that overlay ID. This is implemented via a backdrop element at the overlay plane level, not by individual overlay components managing their own close logic.

The `exit` terminal command calls `closeOverlay("terminal")` directly via the terminal command registry.

### 4.3 Focus Management

When an overlay opens, focus is programmatically moved to the overlay's primary interactive element (terminal input field, quiz modal first option). When an overlay closes, focus returns to the last focused element in the active zone. This is managed by a shared `useFocusTrap` hook consumed by all overlay components.

---

## 5. Interaction Event System

GovindOS does not use a custom event bus. Interactions are handled through a combination of React event handlers (for zone-internal events) and Zustand action calls (for events with global side-effects). The classification of an event into one of these two paths is determined at the component level, not by a central dispatcher.

### 5.1 Event Classification

| Event Type | Handler Path | Example |
|---|---|---|
| Zone navigation | Zustand `navigateTo` action | "View Skills" CTA click |
| Overlay toggle | Zustand `openOverlay` / `closeOverlay` | Terminal button click |
| Mode switch | Zustand `setMode` action | Mode selector toggle |
| Zone-internal expand/collapse | React local state setter | Project card click |
| Graph node interaction | React local state setter | Node hover, node click |
| Terminal command submission | Zustand `submitCommand` action | Enter key in terminal |
| Game layer event | Zustand `unlockZone` / `dismissChallenge` | Zone visited for first time |
| Tooltip display | React local state (hover boolean) | Metric hover in Control Room |

### 5.2 Hover Interaction Contracts

Hover states are **always managed locally** — never in global state. They are transient, high-frequency events that must not trigger store subscriptions in other components.

Neural Graph hover state is an exception in complexity: hovering a node requires dimming all non-adjacent nodes and edges. This is managed within the Neural Graph zone component's local state as a `hoveredNodeId: string | null`. The rendering system derives adjacency from the in-memory edge list on each hover event. This computation is synchronous and cache-assisted.

---

## 6. Terminal Command Parsing Model

### 6.1 Parser Specification

The terminal input parser operates on the submitted string after the user presses Enter. The parsing pipeline is:

```
Raw input string
  │
  ▼
Trim whitespace
  │
  ▼
Tokenize by single whitespace
  │
  ├── tokens[0] → command name (lowercased)
  └── tokens[1..n] → argument list (strings)
  │
  ▼
Lookup command name in registry
  │
  ├── Found → invoke resolver(args) → append output to history
  └── Not found → append error string to history:
                  "command not found — type 'help' for options"
```

The parser does not support flags, pipes, chaining, or shell-style syntax. It is intentionally minimal.

### 6.2 Command Registry Structure

The command registry is a plain object with the following shape per entry:

```
CommandEntry {
  name:             string          // Canonical command name (key in registry)
  aliases:          string[]        // Alternative command strings that map to this entry
  description:      string          // One-line description (rendered by `help` command)
  resolver:         (args: string[], contentState: ContentState) => string | Promise<string>
}
```

The `contentState` parameter provides the resolver access to the full content layer — enabling commands like `projects` and `skills` to derive their output from live content data without hardcoding strings.

### 6.3 Built-in Command Definitions

| Command | Aliases | Output Description |
|---|---|---|
| `help` | `?` | Lists all registered commands with descriptions |
| `status` | — | Returns system identity panel from `SystemMeta` |
| `projects` | `ls projects` | Lists all projects with one-line problem statements |
| `skills` | `ls skills` | Lists all skills grouped by type with depth label |
| `github` | — | Returns GitHub URL and repo count from `SystemMeta` |
| `clear` | `cls` | Clears terminal history array |
| `exit` | `quit` | Closes terminal overlay |
| `goto` | `cd` | Navigates to a zone by ID (e.g., `goto neural-graph`) |

### 6.4 Tab Autocomplete

On `Tab` keypress in the terminal input field, the current `inputBuffer` value is prefix-matched against all registered command names and aliases. If exactly one match exists, the input buffer is replaced with the full command name. If multiple matches exist, a list of matching commands is appended to the terminal history as an output entry (shell-style disambiguation). No match produces no action.

### 6.5 `goto` Command — Navigation Side-Effect

The `goto` command is the only terminal command that produces a global state side-effect outside the terminal slice. When `goto <zoneId>` is submitted with a valid zone ID, the resolver calls `navigateTo(zoneId)` on the navigation slice and returns a confirmation string to the terminal output. If the zone ID is invalid, it returns an error string without triggering navigation.

---

## 7. Mode-Based Behavior Overrides

Mode state modifies the behavior of multiple systems simultaneously. The following table defines which systems are affected by each mode transition:

| System | Explorer | Recruiter | Deep | Safe |
|---|---|---|---|---|
| Ambient particle layer | Active | Inactive | Inactive | Inactive |
| Boot sequence | Plays (if not seen) | Plays (if not seen) | Plays (if not seen) | Skipped always |
| Game layer | Active | Inactive | Inactive | Inactive |
| HUD overlay | Visible | Hidden | Hidden | Hidden |
| Mini-map | Available | Hidden | Hidden | Hidden |
| Zone animations | Full (Framer Motion) | Reduced (fade only) | Minimal (instant) | None |
| Neural Graph render | SVG graph | Text list | SVG graph (expanded) | Text list |
| Timeline layout | Horizontal scroll | Vertical stack | Vertical stack | Vertical stack |
| Memory Vault cards | Accordion (one open) | Accordion (one open) | All expanded | Accordion (one open) |
| `prefers-reduced-motion` | Respected | Enforced regardless | Enforced regardless | Enforced regardless |

### Mode Override Rules

- Mode is read by each zone on mount and on mode change events.
- Zones do not observe mode changes via subscription polling — they re-render reactively when the `activeMode` value in the Zustand store changes.
- The game layer listens to `activeMode` and self-deactivates when the mode is not `"explorer"`.
- Deep Mode overrides Memory Vault's accordion behavior: all project cards are expanded simultaneously. The accordion lock (only one card open) is suspended in Deep Mode.

---

## 8. Session Flag Logic

### 8.1 Boot Sequence Skip Logic

On application mount, before the boot overlay renders, the following check runs:

```
if sessionStorage.getItem("govindos-boot-played") === "true":
  → markBootPlayed() immediately
  → Skip boot overlay; mount Control Room directly
else:
  → Play boot sequence
  → On completion: markBootPlayed()
               + sessionStorage.setItem("govindos-boot-played", "true")
```

This ensures the boot plays once per browser session tab. Opening the application in a new tab replays the boot; navigating within the same tab does not.

### 8.2 Guided Flow Logic

The "Start Here" prompt appears on the first render of the Control Room if `guidedFlowDismissed === false`. Dismissing it (clicking away or following the flow) sets `guidedFlowDismissed = true` for the session. This flag is not persisted — it resets on each session.

---

## 9. Game Layer Event Rules

Zone unlock events are triggered by the navigation system, not by the game layer itself. When `navigateTo(zoneId)` is called:

```
if activeMode === "explorer"
  AND zoneId not in gameState.unlockedZones:
    → dispatch unlockZone(zoneId)
    → increment explorationLevel
    → trigger notification: "<ZoneName> — Unlocked"
```

The notification is displayed via the Notification System overlay (auto-dismissing after 3 seconds). It does not interrupt navigation or block content access.

Challenge prompts are surfaced by individual zone components when the game layer is active. They are rendered as subtle inline prompts — not modal interruptions. A challenge is considered dismissed when the user clicks dismiss, and the `challengeId` is added to `dismissedChallenges`. Dismissed challenges do not reappear for the rest of the session.

---

## 10. Edge Cases and Invariants

| Scenario | Defined Behavior |
|---|---|
| Content fails to load for one zone | That zone renders an empty state; other zones unaffected |
| `navigateTo` called with invalid ZoneId | No-op; console warning logged in development |
| Overlay opened when overlayStack already has 3 items | Allowed; no maximum stack depth enforced |
| Mode set to current active mode | No-op; no re-render triggered |
| `goto` command used while transition is in progress | Terminal output confirms command; navigation drops silently (blocked by `isTransitioning`) |
| Terminal `clear` during active command output | History cleared; partial output discarded |
| Mobile viewport detected after initialization | `isMobile` flag is immutable post-init; page refresh required for re-detection |
| User presses Tab with empty input buffer | No-op; autocomplete does not trigger on empty input |
| `bootPlayed` set in sessionStorage but content not loaded | Content loading still completes before Control Room renders; boot is skipped but loading gate remains |
