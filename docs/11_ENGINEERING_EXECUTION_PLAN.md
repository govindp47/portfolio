# 11 — Engineering Execution Plan

**Product:** GovindOS v3.0
**Document Type:** Structured Engineering Task Plan — Production Build Guide
**Version:** 1.0
**Classification:** Living Document — Append-Only Per Phase

---

### 1. Execution Principles

#### 1.1 UI-First Development

GovindOS is not a data-processing system — it is an interactive experience. Every engineering task must produce visible, testable output. Infrastructure tasks that produce no UI artifact are only justified when they directly unblock a UI-visible task in the same phase. Tasks are scoped to deliver a rendered, interactable result by their completion — never a half-built system waiting for another task to become visible.

This means:

- Zone tasks begin with the rendered layout shell, even if populated with stub data.
- Animation tasks follow functionality — never precede it.
- State tasks are written against a consuming UI component, not in isolation unless they are store slice definitions.

#### 1.2 Zone Isolation as the Atomic Development Unit

The zone is the smallest meaningful unit of feature development. Zones are not built in layers across the whole application (e.g., "now add Framer Motion to all zones"). They are built to completion, one at a time, with their full interaction surface, mode variants, and tests before the next zone is begun. This eliminates context-switching overhead, keeps each session's scope manageable, and ensures each completed zone is shippable.

Cross-zone work (design system, navigation, state) is the only exception — these are foundational systems built before zones.

#### 1.3 State Safety

State changes must be deliberate and scoped. The following rules apply across all tasks:

- Global state (Zustand) is only extended when a new cross-zone concern is introduced. Zone-internal interaction state (accordion, hover, scroll offset) stays local.
- A state change is never made speculatively — only in response to a defined product behavior.
- All new Zustand actions are tested in isolation (store slice tests) before being wired to components.
- Session flags (`bootPlayed`, `guidedFlowDismissed`) are written once and consumed read-only everywhere else.

#### 1.4 Animation-Performance Balance

Animations are built after core functionality is confirmed working. No animation is added to a component that has unresolved behavior bugs. Animation complexity is governed by the mode system — tasks that implement animations must also implement their `prefers-reduced-motion` and Safe Mode bypass from the start, not as a later retrofit.

The D3/React rendering boundary is a first-class concern. During Neural Graph development, the React Profiler is checked as a mandatory acceptance criterion — not an optional audit.

#### 1.5 Progressive Feature Layering

Each task delivers a working slice, not a partial slice. The layering order within any zone is always:

1. Data shape confirmed (content JSON entry exists and is valid)
2. Zone renders without crashing (stub layout)
3. Zone renders real content (data bound to components)
4. Zone interactions work correctly (accordion, hover, click, etc.)
5. Zone responds to mode changes (Recruiter, Deep, Safe variants)
6. Zone entry/exit animation applied
7. Zone tests pass (unit + UI interaction)

A task may cover one or more of these layers, but it never skips a layer in the sequence.

#### 1.6 Safe Incremental Commits

Every task is written to be safely committable at its completion without breaking any previously working behavior. This requires:

- No task modifies a previously completed zone's internal components.
- No task changes the global state model in a way that breaks existing consumers without updating those consumers in the same task.
- Stub zones protect the navigation system from breaking during zone development.

---

### 2. Model Usage Strategy

The execution plan assigns each task to a specific AI model based on the cognitive demand profile of the task. Model assignments are not defaults — they are deliberate allocations.

#### 2.1 Claude Opus — Reasoning-Heavy Orchestration Tasks

**Assigned to:** Interaction engine architecture, state orchestration design, complex behavioral logic, cross-system integration decisions, D3/React boundary enforcement.

**Profile:** Tasks requiring reasoning over multiple architectural constraints simultaneously. Tasks where a wrong decision has downstream consequences across multiple files or systems. Tasks that define contracts other systems will depend on.

**Examples:**

- Zustand store slice composition and action design
- Zone transition state machine implementation
- Terminal command registry architecture
- D3 force simulation lifecycle and React boundary definition
- Mode system behavior audit across all zones

**Usage rule:** Use Opus when the task requires holding the full architecture context in mind while making decisions with cascading consequences. Do not use Opus for tasks that are primarily about rendering markup or wiring known APIs.

#### 2.2 Claude Sonnet (Extended Thinking) — Complex Feature Development

**Assigned to:** Zone implementation tasks, graph system, terminal system, animation orchestration, complex interaction hooks.

**Profile:** Tasks requiring careful step-by-step reasoning within a bounded scope. The zone is well-defined; the complexity is in executing it correctly — picking the right hook decomposition, managing the D3 selection lifecycle, building the virtualization logic.

**Examples:**

- Neural Graph zone implementation (all sub-tasks)
- Terminal overlay implementation
- Memory Vault accordion with Framer Motion layout
- `useForceSimulation`, `useAdjacencyMap`, `useZoomPan` hooks
- Performance tier detection logic

**Usage rule:** Use Sonnet with thinking enabled when the task has a well-defined output but requires reasoning through implementation choices. This is the primary model for zone development.

#### 2.3 Claude Sonnet (Standard) — Refinement and Incremental Updates

**Assigned to:** UI refinements, small component updates, adding tests to existing implementations, fixing isolated bugs, adding mode variants to a zone that is already structurally complete.

**Profile:** Tasks with a clear, narrow scope where the structure is already established. The work is additive, not architectural.

**Examples:**

- Adding `prefers-reduced-motion` bypass to an already-animated component
- Writing UI interaction tests for a completed component
- Updating a content JSON file with new data
- Fixing a visual spacing or alignment issue in a zone
- Adding a missing `aria-label` to a graph node

**Usage rule:** Use standard Sonnet for any task where the structure already exists and the work is modification or addition. No need for extended thinking.

#### 2.4 Gemini Pro (or equivalent fast model) — Scaffolding and Repetitive Generation

**Assigned to:** Project scaffolding, boilerplate generation, repetitive zone structure replication, test stub generation.

**Profile:** Tasks with highly predictable structure that follow an established pattern already defined in the codebase. These tasks benefit from speed, not reasoning depth.

**Examples:**

- Generating the initial directory and file structure for a new zone
- Creating stub zone components for all seven zones following the established contract
- Generating type definition files from the schema documentation
- Producing the initial content JSON file templates

**Usage rule:** Use Gemini for any task where the output is structurally predictable and the primary value is eliminating manual boilerplate. Always review Gemini output against the architecture contracts before committing.

---

### 3. Context Optimization Strategy

Long context windows degrade model response quality on precise implementation tasks. The context strategy is designed to keep each session focused on the exact task at hand.

#### 3.1 Chat Reset Rules

Start a new chat session when:

- **Switching zones.** Each zone is a self-contained development context. After completing a zone (or a major sub-task within a zone), reset the chat. Zone A's implementation details are not relevant to Zone B.
- **After approximately 8 sequential tasks.** Regardless of zone, context accumulation degrades precision. Reset proactively.
- **After any major subsystem completion.** After completing the store slices, the navigation system, the terminal, or the Neural Graph, reset before proceeding. These are clean architectural boundaries.
- **After a significant debugging session.** If more than 3 back-and-forth exchanges were needed to resolve an issue, the context is noisy. Reset and carry forward only the working code.

Never reset mid-task. Complete the current task before resetting, even if the session is long.

#### 3.2 File Selection Rules

Each task defines an explicit list of required files. These rules govern what to include:

**Always include:**

- The specific task's target files (the files being created or modified)
- The architectural document(s) most relevant to the task (e.g., `04_STATE_AND_INTERACTION_ENGINE.md` for store tasks, `06_DYNAMIC_UI_SYSTEMS.md` for Neural Graph tasks)
- The types file (`/core/types/*.ts`) for any task that consumes typed data

**Include conditionally:**

- The full store `index.ts` only when adding a new slice or modifying a cross-slice behavior
- Zone-private hook files only when implementing or debugging that zone's interactions
- Content JSON files only when validating data shape or implementing content-bound rendering

**Never include (unless specifically debugging):**

- Unrelated zone components
- The full blueprint document set (load only the relevant documents per task)
- Test files from previous tasks (unless the current task is extending those tests)
- Node module types or build configuration unless the task is specifically about those

#### 3.3 Token Minimization

- Prefer sharing file paths and asking the model to generate from the architectural spec rather than pasting the full file content when files are large.
- For store slice tasks: paste only the relevant slice interface from `04_STATE_AND_INTERACTION_ENGINE.md`, not the full document.
- For zone tasks: paste only the relevant section from `06_DYNAMIC_UI_SYSTEMS.md` for that zone's system.
- For test tasks: paste only the relevant test scenario table from `08_TESTING_STRATEGY.md`.
- Never paste the same document twice in a session. If a reference is needed again, quote the specific section.

#### 3.4 Context Seeding Pattern

Every new chat session that begins a task should open with this context block (adapted per task):

```
Task: [Task ID + Title]
System: GovindOS v3.0
Architecture: [one-line description of the relevant system]
Target files: [list from task definition]
Constraint: [one key constraint from the architecture docs]
```

This seeds the model's context efficiently without loading full documents upfront.

---

### 4. Dependency Graph Overview

The following graph defines the build-order dependencies between all major systems. A system cannot begin until all systems it depends on are complete.

#### 4.1 Foundational Layer (No Dependencies)

These systems have no upstream dependencies. They must be built first. They form the infrastructure that every other system consumes.

```
┌─────────────────────────────────────────┐
│  FOUNDATIONAL LAYER                     │
│                                         │
│  TypeScript Types (/core/types)         │
│  CSS Design Tokens (tokens.css)         │
│  Zustand Store Slices (/core/store)     │
│  Content JSON Files (/content)          │
│  Design System Components (/core/ds)   │
│  Core Hooks (/core/hooks)               │
│  Content Loader (/core/utils)           │
│  Zone Registry (/core/utils)            │
└─────────────────────────────────────────┘
```

#### 4.2 Application Shell Layer (Depends on: Foundational)

```
┌─────────────────────────────────────────┐
│  APPLICATION SHELL LAYER                │
│                                         │
│  App.tsx (layer composition)            │
│  AmbientPlane + ParticleCanvas          │
│  ZonePlane (lazy load + AnimatePresence)│
│  HudPlane (NavBar, ModeSelector)        │
│  OverlayPlane (structure only)          │
│  Navigation State Machine               │
│  Zone Transition Animation              │
│  Stub Zones (all 7)                     │
└─────────────────────────────────────────┘
```

#### 4.3 Boot + Entry Zone Layer (Depends on: Shell)

```
┌─────────────────────────────────────────┐
│  BOOT + ENTRY LAYER                     │
│                                         │
│  BootSequence overlay                   │
│  Session flag logic (bootPlayed)        │
│  Control Room Zone (full)               │
│  Content pre-fetch during boot          │
└─────────────────────────────────────────┘
```

#### 4.4 Zone Development Layer (Depends on: Boot + Entry; Mutually Independent)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  NEURAL GRAPH    │  │  TERMINAL        │  │  MEMORY VAULT    │
│  GraphCanvas     │  │  TerminalOverlay │  │  ProjectCards    │
│  D3 Simulation   │  │  Command Registry│  │  Accordion       │
│  Node/Edge SVG   │  │  History Virt.   │  │  Arch. Toggle    │
│  Hover/Click     │  │  Autocomplete    │  │  Deep Mode       │
│  Pan/Zoom        │  │  goto side-effect│  └──────────────────┘
│  List Fallback   │  └──────────────────┘
│  Quiz Modal      │
└──────────────────┘

┌──────────────────┐  ┌──────────────────┐
│  TIMELINE TUNNEL │  │  ARENA           │
│  Horiz. Scroll   │  │  Stat Panels     │
│  Entry Expand    │  │  Difficulty Chart│
│  Vert. Fallback  │  │  Deep Dive Toggle│
└──────────────────┘  └──────────────────┘
```

#### 4.5 Integration Layer (Depends on: Zones 4.4)

```
┌─────────────────────────────────────────┐
│  INTEGRATION LAYER                      │
│                                         │
│  Gateway Zone                           │
│  Game Layer HUD + Zone Unlock           │
│  Challenge Prompt System                │
│  MiniMap (Explorer Mode)                │
└─────────────────────────────────────────┘
```

#### 4.6 Completion Layer (Depends on: Integration)

```
┌─────────────────────────────────────────┐
│  COMPLETION LAYER                       │
│                                         │
│  Mode System Audit (all zones)          │
│  Mobile Init + Perf Tier Detection      │
│  prefers-reduced-motion Enforcement     │
│  Bundle Optimization                    │
│  Accessibility Audit                    │
│  Production Deployment                  │
└─────────────────────────────────────────┘
```

#### 4.7 Critical Path

The critical path — the sequence that gates final delivery — is:

```
Types → Store → Content Loader → App Shell → Navigation → Boot →
Control Room → Neural Graph → Mode System → Performance → Launch
```

Terminal, Memory Vault, Timeline, and Arena are off the critical path once the shell is established. They can be developed in parallel or sequentially without blocking the launch gate.

---

### 5. Phased Engineering Plan

#### Phase 0 — Project Setup

**Objective:** Establish the project scaffold, toolchain, all TypeScript types, the Zustand store, the design system, and the content JSON files. No user-visible zones are built. This phase produces the shared infrastructure that every subsequent phase depends on.

**Risk Level:** Low. All technologies are established. The primary risk is type system design choices that prove inadequate later — mitigated by grounding every type directly in the schema definitions from Document 03.

**Completion Criteria:**

- `npm run dev` serves an application without errors (blank shell is acceptable)
- `npm run test` passes all store slice tests and content loader tests
- All six content JSON files exist with at least one valid entry per type
- Design system components are demonstrable in a dev sandbox route
- GitHub Actions CI pipeline runs on push and PR

---

#### Phase 1 — Core Shell, Navigation, and HUD

**Objective:** Build the four-layer application shell, the navigation state machine, zone transition animation, and the persistent HUD (NavBar, ModeSelector). All seven zones are stubbed. The system is fully navigable.

**Risk Level:** Low-Medium. The zone transition animation with `AnimatePresence` and `React.lazy` is the highest-risk element — it requires correct interaction between Framer Motion and React Suspense. This is surfaced early.

**Completion Criteria:**

- All seven stub zones are navigable via NavBar
- Zone cross-fade transition plays correctly on navigation
- Mode selector switches mode instantly with correct shell behavior per mode
- Particle system active in Explorer Mode; inactive in other modes
- Navigation state machine integration tests all pass

---

#### Phase 2 — Boot Sequence and Control Room

**Objective:** Implement the boot sequence overlay and the fully functional Control Room zone. The application now has a complete "first impression" flow from boot to landing zone.

**Risk Level:** Low. Boot sequence is CSS-animation-driven with minimal JS logic. Control Room is a low-complexity zone.

**Completion Criteria:**

- Boot plays on first session visit; skips on same-session revisit
- Control Room renders real data from `meta.json`
- Status badge pulse behavior correct (pulses 3s, stops)
- Metric tooltips function on hover
- Both CTAs navigate to correct zones
- Content pre-fetch of Neural Graph and Terminal chunks initiated during boot window

---

#### Phase 3 — Neural Graph Zone

**Objective:** Implement the highest-complexity zone. D3 force simulation, full SVG rendering, hover adjacency highlighting, node detail panel, pan/zoom, entry animation, list fallback, and quiz modal integration.

**Risk Level:** High. D3/React boundary is the dominant technical risk. Frame rate during simulation must be confirmed before this phase is considered complete.

**Completion Criteria:**

- Force graph renders with real skill and edge data
- Node hover correctly dims non-adjacent nodes and edges
- Node click opens detail panel with correct skill metadata
- Pan and zoom functional within defined bounds
- Recruiter/Safe Mode renders list fallback (no D3 initialized)
- Quiz modal opens from detail panel, focus-trapped, closeable
- React Profiler confirms zero React re-renders during D3 tick updates
- Frame rate ≥ 60fps during simulation on development machine

---

#### Phase 4 — Terminal Overlay

**Objective:** Implement the Terminal overlay with complete command registry, tab autocomplete, command history navigation, and virtualized output history. The `goto` command provides a second navigation pathway.

**Risk Level:** Medium. Virtualization of variable-height output entries is the highest-complexity sub-task.

**Completion Criteria:**

- Terminal opens and closes correctly (keyboard shortcut + HUD button)
- All 8 commands return correct output from real content data
- Tab autocomplete prefix-matches correctly (exact, multiple, none)
- Arrow-up/down navigates command history
- `goto` command navigates zones and leaves terminal open
- `clear` empties history; `exit` closes terminal
- Terminal history persists across zone transitions
- Virtualized history renders correctly at 100+ entries without DOM bloat

---

#### Phase 5 — Memory Vault Zone

**Objective:** Implement the project cards, accordion expand/collapse system, architecture toggle, Deep Mode override, and demo link handling.

**Risk Level:** Medium. Framer Motion `layout` animation with FLIP for the accordion must be confirmed to not cause layout thrash.

**Completion Criteria:**

- Projects render from real `projects.json` data
- Accordion: only one card expanded at a time
- Expand/collapse animation runs without layout reflow
- Architecture section toggles independently per card
- Deep Mode expands all cards simultaneously; hides expand/collapse controls
- Demo link absent when `demoUrl` is null; correct attributes when present
- Card stagger entry animation on zone mount
- All Memory Vault UI interaction tests pass

---

#### Phase 6 — Timeline Tunnel and Arena Zones

**Objective:** Implement the Timeline Tunnel horizontal scroll zone and the Arena coding statistics zone. Both are content-display-primary zones with defined interaction surfaces.

**Risk Level:** Low-Medium. Timeline horizontal scroll on mobile and the Arena difficulty chart are the moderate-risk elements.

**Completion Criteria:**

- Timeline renders entries from real `timeline.json` data in correct date-descending order
- Entry expand/collapse functions correctly
- Horizontal scroll layout active in Explorer/Deep mode; vertical stack in Recruiter/Safe
- Arena renders all stat panels from real `arena.json` data
- Difficulty chart hover reveals per-band counts
- Pattern click surfaces problem references
- Featured Problem deep-dive toggle functions
- Certifications grouped by domain

---

#### Phase 7 — Gateway Zone and Game Layer

**Objective:** Implement the Gateway zone (all external links, email copy, resume download) and the complete game layer system (HUD, zone unlock notifications, challenge prompts).

**Risk Level:** Low. Gateway is simple link dispatch. Game layer is additive state with toast UI.

**Completion Criteria:**

- All Gateway links open correctly with proper `rel` attributes
- Clipboard copy triggers on email click when `preferCopy: true`
- Resume PDF download triggers correctly
- Zone unlock notification appears on first visit in Explorer Mode; does not repeat
- Game HUD hidden in all non-Explorer modes
- Challenge prompts render and dismiss correctly in Neural Graph and Memory Vault
- MiniMap reflects active zone in Explorer Mode

---

#### Phase 8 — Mode System Completion

**Objective:** Audit and complete the full four-mode behavioral contract across every zone. Fill any gaps left by incremental mode implementation during zone development phases.

**Risk Level:** Low-Medium. Not technically complex, but requires systematic coverage of every zone × every mode combination.

**Completion Criteria:**

- Every zone × every mode combination produces the correct layout and behavior per Document 04's mode behavior table
- Mobile initialization (`isMobile` flag) sets correct defaults and cannot be overridden by session storage
- `prefers-reduced-motion` is respected by every animated component (Framer Motion hook + CSS media query)
- Performance tier detection runs on startup and correctly adjusts particle count and animation level
- All mode integration tests pass
- Playwright test confirms zero animations under `prefers-reduced-motion: reduce` emulation

---

#### Phase 9 — Performance, Polish, and Launch

**Objective:** Final optimization pass, visual fidelity review, accessibility audit, production deployment configuration, and live deployment.

**Risk Level:** Low (if prior phases were executed correctly). Risk increases if bundle sizes or frame rates are significantly over target — these must have been monitored throughout development.

**Completion Criteria:**

- All Lighthouse CI scores meet Document 07 targets
- All chunk sizes within gzipped targets
- Frame rate ≥ 60fps in all animation scenarios under 4× CPU throttle
- axe-core audit: zero critical or serious violations in all zones
- All keyboard navigation paths confirmed
- Focus trap and restoration confirmed for Terminal and Quiz Modal
- `vercel.json` configured with correct cache-control and security headers
- Production deployment live and functional
- Rollback procedure verified

---

## PHASE 0 — Project Setup

**Objective:** Establish the project scaffold, toolchain, TypeScript type system, Zustand store, design system, content JSON files, content loader, and core hooks. No user-visible zones are built. Every subsequent phase depends entirely on the output of this phase.

---

### T-001 — Project Scaffold and Toolchain Configuration

**Phase:** 0 — Project Setup
**Subsystem:** Build Infrastructure

**Description:**
Initialize the Vite + React 18 + TypeScript project. Configure all foundational toolchain files: `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `.nvmrc`, `package.json` with correct `engines` field, and `eslint` configuration. Establish the top-level directory structure as defined in Document 05 Section 2 — creating all directories as empty placeholders with `.gitkeep` files where needed. Configure Vitest within `vite.config.ts` for co-located test discovery. Configure GitHub Actions CI stub (PR trigger, Node setup, `npm ci`, `npm run test` — no deployment step yet).

**Scope Boundaries**

Files affected:

- `vite.config.ts` (new)
- `tsconfig.json` (new)
- `tailwind.config.ts` (new)
- `package.json` (new)
- `.nvmrc` (new)
- `.eslintrc.ts` (new)
- `.github/workflows/pull_request.yml` (new — stub)
- All top-level directories created: `/src`, `/content`, `/public/fonts`, `/public`

Modules affected:

- Build system only

NOT touching:

- Any React component files
- Any store files
- Any content JSON files
- Framer Motion, D3, Zustand — installed as dependencies but not yet used

**Implementation Steps**

1. Run `npm create vite@latest govindos -- --template react-ts`. Verify React 18 is installed. Set `"type": "module"` in `package.json`.
2. Install all production and dev dependencies declared in Document 02's tech stack summary: `framer-motion`, `zustand`, `d3`, `tailwindcss`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@vitejs/plugin-react`, `typescript`. Record exact versions in `package.json`.
3. Configure `vite.config.ts`: set `plugins: [react()]`, configure `test` block for Vitest with `environment: 'jsdom'`, `setupFiles: './src/test-setup.ts'`, and `globals: true`. Do not configure `build.rollupOptions.output.manualChunks` yet — deferred to T-016.
4. Configure `tsconfig.json`: strict mode on, `moduleResolution: "bundler"`, path alias `@/` → `./src/`, no implicit any.
5. Configure `tailwind.config.ts`: set `content` to `["./index.html", "./src/**/*.{ts,tsx}"]`. Leave `theme.extend` empty — design tokens are defined in T-002.
6. Create `.nvmrc` with the Node version. Add `"engines": { "node": ">=20.0.0" }` to `package.json`.
7. Create `/src/test-setup.ts` with `@testing-library/jest-dom` import.
8. Create directory skeleton per Document 05 Section 2: `/src/core/{store,types,hooks,design-system,utils}`, `/src/zones/{control-room,memory-vault,neural-graph,timeline-tunnel,arena,gateway}`, `/src/overlays/{terminal,quiz-modal}`, `/src/hud/{navbar,minimap,mode-selector,game-hud}`, `/src/ambient`, `/src/boot`, `/content`, `/public/fonts`.
9. Create stub `src/main.tsx` (renders `<div>GovindOS</div>`) and `src/App.tsx` (returns `null`).
10. Create `.github/workflows/pull_request.yml`: trigger on `pull_request`, steps: checkout, setup-node (from `.nvmrc`), `npm ci`, `npm run test`.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests: None in this task.
Integration tests: None.
Manual verification: `npm run dev` serves without errors. `npm run test` runs (zero tests, zero failures). `npm run build` produces `/dist/index.html`. Directory structure matches Document 05 Section 2.

**Acceptance Criteria**

- `npm install`, `npm run dev`, `npm run build`, and `npm run test` all complete without errors
- TypeScript strict mode is active (`"strict": true` in tsconfig)
- Directory structure matches Document 05 Section 2 exactly
- GitHub Actions workflow file is syntactically valid (YAML lint passes)
- `.nvmrc` and `package.json` engines field specify the same Node version

**Rollback Strategy**
Delete repository and reinitialize. No code of consequence exists at this stage.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Gemini Pro (or equivalent fast model)
Recommended Mode: Standard generation

Reason: Pure scaffolding task. Output is entirely structural and deterministic. No architectural reasoning required — the structure is fully specified in Document 05.

---

**Context Strategy**

Start new chat: Yes (first task)

Required files:

- `05_APPLICATION_STRUCTURE.md` (Section 2 — directory structure only)
- `02_TECH_DECISIONS.md` (Section 10 — technology stack summary only)

Architecture docs: Document 05 (structure), Document 02 (stack)
Exclude: All other blueprint documents

---

### T-002 — CSS Design Token System and Tailwind Theme Extension

**Phase:** 0 — Project Setup
**Subsystem:** Design System — Token Layer

**Description:**
Define the complete CSS custom property token set for GovindOS as specified by the visual design system. Create `tokens.css` in `/core/design-system` with all color, spacing, typography, radius, shadow, and animation duration tokens. Extend `tailwind.config.ts` to consume these tokens via `theme.extend`, making all design tokens available as Tailwind utility classes. Establish the `@media (prefers-reduced-motion: reduce)` global override rule that disables all CSS keyframe animations — this must be in the global stylesheet from the start, not added later.

**Scope Boundaries**

Files affected:

- `src/core/design-system/tokens.css` (new)
- `tailwind.config.ts` (modify — add `theme.extend`)
- `src/index.css` (modify — import tokens.css, add reduced-motion override rule)

Modules affected:

- Design system token layer only

NOT touching:

- Any React component
- Any Zustand store
- Any zone directory

**Implementation Steps**

1. Create `src/core/design-system/tokens.css`. Define the following CSS custom property groups:
   - **Colors:** `--color-bg` (near-black), `--color-surface` (glass panel base), `--color-accent` (neon primary — single accent color per the OS aesthetic), `--color-accent-muted`, `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`, `--color-border`, `--color-border-glow`, `--color-error`, `--color-success`.
   - **Typography:** `--font-mono` (monospace stack — terminal, code, boot), `--font-sans` (heading and body stack), `--text-xs` through `--text-2xl` (scale in rem), `--font-weight-normal`, `--font-weight-medium`, `--font-weight-bold`.
   - **Spacing:** `--space-1` through `--space-16` (4px base unit scale).
   - **Radius:** `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`.
   - **Shadows/Glows:** `--glow-accent` (box-shadow using accent color at low opacity), `--glow-accent-strong`, `--shadow-glass` (glassmorphism depth shadow).
   - **Animation durations:** `--duration-fast` (150ms), `--duration-normal` (300ms), `--duration-slow` (600ms).
   - **Z-index scale:** `--z-ambient` (0), `--z-zone` (10), `--z-hud` (20), `--z-overlay` (30).
2. Extend `tailwind.config.ts` `theme.extend` block: map Tailwind color names to CSS custom properties (e.g., `colors.bg: 'var(--color-bg)'`), map font families, map spacing tokens.
3. Add `@import './core/design-system/tokens.css'` to `src/index.css`.
4. Add the following global rules to `src/index.css`:
   - `* { box-sizing: border-box; }` and base margin/padding reset.
   - `html, body, #root { height: 100%; margin: 0; }` — full-viewport application shell.
   - `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; } }` — global reduced-motion override.
5. Verify Tailwind processes `tokens.css` correctly by confirming generated CSS contains the custom property references (inspect build output).

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests: None.
Integration tests: None.
Manual verification: `npm run dev` — confirm no CSS errors in browser console. Inspect `--color-accent` value in browser DevTools computed styles on `html`. Confirm Tailwind class `bg-bg` or equivalent maps to `var(--color-bg)`.

**Acceptance Criteria**

- All CSS custom properties are defined under `:root` in `tokens.css`
- `tailwind.config.ts` `theme.extend` maps all design tokens to Tailwind utilities
- Global `prefers-reduced-motion` override is present in `index.css`
- `npm run build` produces no CSS warnings
- No hardcoded hex color values appear anywhere outside of `tokens.css`

**Rollback Strategy**
Revert `tokens.css`, `index.css`, and `tailwind.config.ts` to prior state. No runtime behavior is affected.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Requires knowledge of the design system's aesthetic intent and CSS custom property best practices, but the output is declarative and non-architectural.

---

**Context Strategy**

Start new chat: No (continue from T-001)

Required files:

- `src/core/design-system/tokens.css` (currently empty)
- `tailwind.config.ts` (current state)
- `src/index.css` (current state)

Architecture docs: None required — token values are design decisions, not specified in blueprint docs.
Exclude: All blueprint documents

---

### T-003 — TypeScript Content Type Definitions

**Phase:** 0 — Project Setup
**Subsystem:** Core Types — Content Layer

**Description:**
Define all TypeScript interfaces for the content data model as specified in Document 03. These types are the contract between the JSON content files and every zone that renders them. All content interfaces must be precise — optional fields use `null` explicitly (not `undefined`), enums are string literal unions, numeric ranges are typed as `number` (range enforcement is a runtime validation concern, not a TypeScript concern). No content type references zone-specific types.

**Scope Boundaries**

Files affected:

- `src/core/types/content.ts` (new)

Modules affected:

- Core types only

NOT touching:

- Any store file
- Any zone file
- Any JSON content file
- Any component

**Implementation Steps**

1. Open `src/core/types/content.ts`. Define all interfaces exactly matching Document 03's schema definitions:
   - `SkillType` — string literal union: `"language" | "concept" | "domain"`
   - `DepthLevel` — string literal union: `"familiar" | "advanced" | "expert"`
   - `RelType` — string literal union: `"uses" | "extends" | "enables" | "relates-to"`
   - `EntryType` — string literal union: `"work" | "education"`
   - `Tradeoff` — `{ decision: string; rationale: string; consequence: string }`
   - `Project` — full interface per Document 03 Section 3. `demoUrl: string | null`.
   - `Skill` — full interface per Document 03 Section 4.
   - `SkillEdge` — full interface per Document 03 Section 4.
   - `TimelineEntry` — full interface per Document 03 Section 5. `endDate: string | null`.
   - `PlatformRating`, `DifficultyBand`, `SolvedPattern`, `FeaturedProblem`, `ComplexityNote`, `CertificationGroup`, `Certification`, `ArenaProfile` — all per Document 03 Section 6.
   - `MetricItem`, `ContactInfo`, `ExternalLinks`, `SystemMeta` — per Document 03 Section 7.
2. Export all interfaces and type aliases named. Do not use `default` exports in type files.
3. Create a barrel export: `export * from './content'` pattern will be handled in `src/core/types/index.ts` (created in T-004).

**Data Impact**

Schema changes: This task defines the schema — it is the canonical source.
Migration required: No.

**Test Plan**

Unit tests: None for type definitions themselves (TypeScript compiler is the test).
Integration tests: None at this stage.
Manual verification: `npx tsc --noEmit` passes with zero errors after this task.

**Acceptance Criteria**

- All interfaces from Document 03 are present and match the schema definitions exactly
- All optional/nullable fields use `field: Type | null` — no `field?: Type` pattern (unless truly optional in the spec)
- All enum types are string literal unions — no TypeScript `enum` keyword
- `npx tsc --noEmit` passes with zero type errors

**Rollback Strategy**
Delete `src/core/types/content.ts`. No runtime behavior affected.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Gemini Pro (or equivalent fast model)
Recommended Mode: Standard generation

Reason: Direct transcription of schema spec into TypeScript interfaces. Fully deterministic given Document 03.

---

**Context Strategy**

Start new chat: No (continue from T-002)

Required files:

- `src/core/types/content.ts` (currently empty)

Architecture docs: `03_DATA_MODEL_AND_CONTENT_STRUCTURE.md` (Sections 3–7 only — schema definitions)
Exclude: All other documents

---

### T-004 — TypeScript Zone, State, and Mode Type Definitions

**Phase:** 0 — Project Setup
**Subsystem:** Core Types — Application Layer

**Description:**
Define all non-content TypeScript types: zone IDs, overlay IDs, user modes, global state interfaces, and the mode capability map. These types are consumed by the Zustand store, navigation system, and every HUD and overlay component. The `ZoneId` and `OverlayId` types are string literal unions that define the complete set of valid identifiers — they are the authoritative registry against which all navigation calls are validated at compile time.

**Scope Boundaries**

Files affected:

- `src/core/types/zones.ts` (new)
- `src/core/types/overlays.ts` (new)
- `src/core/types/modes.ts` (new)
- `src/core/types/state.ts` (new)
- `src/core/types/index.ts` (new — barrel export)

Modules affected:

- Core types only

NOT touching:

- Any store file
- Any component
- `content.ts` (already complete)

**Implementation Steps**

1. `src/core/types/zones.ts`:
   - `ZoneId` — string literal union: `"control-room" | "memory-vault" | "neural-graph" | "timeline-tunnel" | "arena" | "gateway"`.
   - `ZoneMeta` — `{ id: ZoneId; displayName: string; navLabel: string }`.
   - Export both.
2. `src/core/types/overlays.ts`:
   - `OverlayId` — string literal union: `"terminal" | "quiz-modal" | "notification"`.
   - Export.
3. `src/core/types/modes.ts`:
   - `UserMode` — string literal union: `"explorer" | "recruiter" | "deep" | "safe"`.
   - `ModeCapabilities` — interface: `{ ambientActive: boolean; gameLayerActive: boolean; animationsEnabled: boolean; animationLevel: "full" | "reduced" | "minimal" | "none"; miniMapAvailable: boolean }`.
   - Export both.
4. `src/core/types/state.ts` — Define interfaces mirroring the Zustand store shape from Document 04 Section 2. Define each slice interface separately:
   - `NavigationState` and `NavigationActions` — per Document 04 Section 2.1.
   - `ModeState` and `ModeActions` — per Document 04 Section 2.2.
   - `TerminalState`, `TerminalEntry`, and `TerminalActions` — per Document 04 Section 2.3.
   - `GameState` and `GameActions` — per Document 04 Section 2.4.
   - `SessionFlags` and `SessionFlagActions` — per Document 04 Section 2.5.
   - `ContentState` and `ContentActions` — per Document 04 Section 2.6 (uses `Project[]`, `Skill[]` etc. from `content.ts`).
5. `src/core/types/index.ts` — re-export all types from all four files: `export * from './content'; export * from './zones'; export * from './overlays'; export * from './modes'; export * from './state'`.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests: None.
Manual verification: `npx tsc --noEmit` passes. All imports resolve.

**Acceptance Criteria**

- `ZoneId` and `OverlayId` are string literal unions matching the product spec exactly
- `UserMode` is a string literal union (no `enum` keyword)
- All state interfaces match Document 04 Section 2 precisely
- `src/core/types/index.ts` barrel export covers all type files
- `npx tsc --noEmit` passes with zero errors

**Rollback Strategy**
Delete the four new type files and `index.ts`. No runtime behavior affected.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Gemini Pro (or equivalent fast model)
Recommended Mode: Standard generation

Reason: Direct transcription from Document 04 state model into TypeScript interfaces. Fully deterministic.

---

**Context Strategy**

Start new chat: No (continue from T-003)

Required files:

- `src/core/types/content.ts` (existing, for cross-reference in `state.ts`)

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 2 only — store slice interfaces)
Exclude: All other documents

---

### T-005 — Zustand Store — Navigation and Mode Slices

**Phase:** 0 — Project Setup
**Subsystem:** Global State — Navigation + Mode

**Description:**
Implement the Navigation and Mode Zustand store slices. These two slices are the most critical in the application — navigation governs zone mounting/unmounting, and mode governs rendering decisions in every zone. The navigation slice implements the full state machine described in Document 04 Section 3: idle → transitioning-out → transitioning-in → idle. The mode slice implements synchronous mode switching with mobile-default initialization.

**Scope Boundaries**

Files affected:

- `src/core/store/navigationSlice.ts` (new)
- `src/core/store/modeSlice.ts` (new)
- `src/core/store/index.ts` (new — stub that will grow with each slice task)

Modules affected:

- Core store only

NOT touching:

- Any component
- Terminal, game, session, or content slices (T-006)
- Zone registry

**Implementation Steps**

1. `src/core/store/navigationSlice.ts`:
   - Import `NavigationState`, `NavigationActions`, `ZoneId`, `OverlayId` from `@/core/types`.
   - Define the slice creator function compatible with Zustand's `StateCreator` type.
   - Initial state: `activeZone: "control-room"`, `previousZone: null`, `isTransitioning: false`, `overlayStack: []`, `miniMapOpen: false`.
   - Implement `navigateTo(zoneId)`: guard — if `zoneId === activeZone` or `isTransitioning`, return. Otherwise: set `isTransitioning: true`, set `previousZone: activeZone`, set `activeZone: zoneId`. (Note: `isTransitioning` is reset to `false` by `onTransitionComplete()` called by the animation layer, not by a timer.)
   - Implement `openOverlay(overlayId)`: enforce the terminal-close-before-quiz-modal rule from Document 04 Section 4.2. Append to `overlayStack`.
   - Implement `closeOverlay(overlayId)`: remove the specified ID from `overlayStack` by value.
   - Implement `toggleMiniMap()`: flip `miniMapOpen`.
   - Implement `onTransitionComplete()`: set `isTransitioning: false`.
2. `src/core/store/modeSlice.ts`:
   - Import `ModeState`, `ModeActions`, `UserMode` from `@/core/types`.
   - Implement `setMode(mode)`: if `mode === activeMode`, return (no-op). Otherwise set `activeMode: mode`.
   - Initialize `isMobile` by reading `window.innerWidth < 768` at slice creation time. This value is set once and never mutated.
   - Default `activeMode`: if `isMobile`, initialize to `"recruiter"`. Otherwise `"explorer"`.
3. `src/core/store/index.ts`:
   - Import `create` from `zustand`.
   - Compose navigation and mode slices into a single store using Zustand's slice pattern (`...createNavigationSlice(set, get)`, `...createModeSlice(set, get)`).
   - Export `useStore` as the single Zustand store instance.
   - Export the composed state type as `AppState`.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests (Vitest — `src/core/store/navigationSlice.test.ts`):

- Initial state matches defined defaults.
- `navigateTo` with a different zone: `activeZone` updates, `previousZone` set, `isTransitioning` true.
- `navigateTo` with the same zone: no state change.
- `navigateTo` while `isTransitioning: true`: no state change (second call dropped).
- `onTransitionComplete`: `isTransitioning` resets to false.
- `openOverlay("terminal")`: `overlayStack` = `["terminal"]`.
- `openOverlay("quiz-modal")` when terminal open: terminal removed, `overlayStack` = `["quiz-modal"]`.
- `closeOverlay` for an ID not in stack: no state change.
- `navigateTo` with an invalid ZoneId string: no state change (TypeScript enforces at compile time; runtime guard still needed for safety).

Unit tests (Vitest — `src/core/store/modeSlice.test.ts`):

- `setMode` with different mode: `activeMode` updates.
- `setMode` with current mode: no state change.

**Acceptance Criteria**

- Navigation state machine transitions match Document 04 Section 3.1 exactly
- `isTransitioning` blocks re-entry (duplicate `navigateTo` calls during transition are no-ops)
- `openOverlay("quiz-modal")` with terminal open: terminal is closed first
- `isMobile` initialized once and not exposed via `setMode` or any mutation
- All unit tests pass

**Rollback Strategy**
Delete `navigationSlice.ts` and `modeSlice.ts`. Revert `index.ts` to previous state.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Opus
Recommended Mode: Standard

Reason: The navigation state machine has precise behavioral rules with edge cases (re-entry blocking, overlay exclusivity, no-op guards) that require careful reasoning. The correctness of this slice determines the correctness of all navigation across the entire application.

---

**Context Strategy**

Start new chat: Yes (switching to state architecture — new concern context)

Required files:

- `src/core/types/state.ts`
- `src/core/types/zones.ts`
- `src/core/types/overlays.ts`
- `src/core/types/modes.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Sections 2.1, 2.2, 3.1, 4.1, 4.2)
Exclude: All zone documents, UI documents, content documents

---

### T-006 — Zustand Store — Terminal, Game, Session, and Content Slices

**Phase:** 0 — Project Setup
**Subsystem:** Global State — Remaining Slices

**Description:**
Implement the four remaining Zustand store slices: Terminal, Game Layer, Session Flags, and Content. Compose all six slices into the final unified store. The Terminal slice's `submitCommand` action includes the command dispatch pipeline stub — it appends input and output entries to history but does not yet connect to the command registry (which is built in a later task). The Content slice is a simple write-once store.

**Scope Boundaries**

Files affected:

- `src/core/store/terminalSlice.ts` (new)
- `src/core/store/gameSlice.ts` (new)
- `src/core/store/sessionSlice.ts` (new)
- `src/core/store/contentSlice.ts` (new)
- `src/core/store/index.ts` (modify — add remaining slices to composition)

Modules affected:

- Core store only

NOT touching:

- Navigation or mode slices (complete)
- Command registry (built later in T-032)
- Any component

**Implementation Steps**

1. `src/core/store/terminalSlice.ts`:
   - Implement `TerminalState` initial state: `isOpen: false`, `history: []`, `inputBuffer: ""`.
   - Implement `openTerminal()`, `closeTerminal()` actions.
   - Implement `setInputBuffer(value)`: updates `inputBuffer` (write-through — this is the one case where a frequently-updated field is in global state, but per Document 04 Section 4, `inputBuffer` moves to local state in the `TerminalInput` component and is only written to store on submission. Implement the store field but note this in a code comment for the component developer).
   - Implement `submitCommand(input)`: append an input `TerminalEntry` to history. **Stub the command resolution**: append a placeholder output entry `"[command registry not yet connected]"`. The command registry will replace this logic in T-032.
   - Implement `clearHistory()`: set `history: []`. Does not close terminal.
2. `src/core/store/gameSlice.ts`:
   - Implement `GameState` initial state: `isActive: false`, `unlockedZones: []`, `dismissedChallenges: []`, `explorationLevel: 0`.
   - Implement `unlockZone(zoneId)`: guard — if already in `unlockedZones`, no-op. Append to `unlockedZones`, increment `explorationLevel`.
   - Implement `dismissChallenge(challengeId)`: guard — if already in `dismissedChallenges`, no-op. Append.
   - Note: `isActive` is derived from `activeMode === "explorer"` — it is **not set by a dedicated action**. It is a computed value. Remove `isActive` from the slice state and instead have it be a selector. Add a comment documenting this.
3. `src/core/store/sessionSlice.ts`:
   - Implement `SessionFlags` initial state. For `bootPlayed`: initialize by reading `sessionStorage.getItem("govindos-boot-played") === "true"`.
   - Implement `markBootPlayed()`: set `bootPlayed: true`; call `sessionStorage.setItem("govindos-boot-played", "true")`.
   - Implement `dismissGuidedFlow()`: set `guidedFlowDismissed: true`.
   - Implement `markContentLoaded()`: set `contentLoaded: true`.
4. `src/core/store/contentSlice.ts`:
   - Implement `ContentState` initial state: all arrays empty, `arena: null`, `meta: null`.
   - Implement `loadContent(payload: ContentState)`: single write-through action. Replaces entire content state with payload.
5. `src/core/store/index.ts`:
   - Compose all six slices. Export the unified `useStore` hook and `AppState` type.
   - Add a named selector helper `selectIsGameActive` that derives `isActive` as `(state) => state.activeMode === "explorer"`.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests for each slice (Vitest):

- Terminal: `submitCommand` appends input entry and output stub. `clearHistory` empties array. `closeTerminal` preserves history. `inputBuffer` updates via `setInputBuffer`.
- Game: `unlockZone` appends to `unlockedZones` and increments `explorationLevel`. Duplicate `unlockZone` calls are no-ops. `dismissChallenge` deduplicates.
- Session: `markBootPlayed` sets flag and writes to sessionStorage. `sessionStorage` read on initialization correctly seeds `bootPlayed`.
- Content: `loadContent` replaces entire content state. Subsequent reads reflect loaded data.
- Composed store: all slice actions available from single `useStore` hook without conflicts.

**Acceptance Criteria**

- All six slices compose into a single store with no key conflicts
- `bootPlayed` is seeded from `sessionStorage` on initialization
- `isActive` for the game layer is a derived selector, not a mutable state field
- `submitCommand` stub makes intent clear via code comment without breaking the slice contract
- All unit tests pass

**Rollback Strategy**
Delete the four new slice files. Revert `index.ts` to the two-slice version from T-005.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: Multiple slices with behavioral edge cases (game layer derivation, sessionStorage initialization, terminal history contract). Requires careful attention to the nuances documented in Document 04.

---

**Context Strategy**

Start new chat: No (continue from T-005)

Required files:

- `src/core/store/index.ts` (current state — two slices)
- `src/core/types/state.ts`
- `src/core/types/content.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Sections 2.3, 2.4, 2.5, 2.6)
Exclude: Navigation/mode sections already implemented, all zone documents

---

### T-007 — Design System Base Components

**Phase:** 0 — Project Setup
**Subsystem:** Design System — Component Layer

**Description:**
Implement the primary design system components that every zone will consume: `GlassPanel`, `ActionButton`, `Tag`, and `MetricBadge`. These components are the visual building blocks of the entire application — they must be correct, consistent, and fully typed before any zone begins development. `GlassPanel` is the most critical: it is the primary container primitive for all zones and must implement the glassmorphism treatment precisely.

**Scope Boundaries**

Files affected:

- `src/core/design-system/components/GlassPanel.tsx` (new)
- `src/core/design-system/components/ActionButton.tsx` (new)
- `src/core/design-system/components/Tag.tsx` (new)
- `src/core/design-system/components/MetricBadge.tsx` (new)
- `src/core/design-system/components/index.ts` (new — barrel export)

Modules affected:

- Design system component layer only

NOT touching:

- Any zone component
- Any store or hook
- Typography components (T-008)

**Implementation Steps**

1. `GlassPanel.tsx`:
   - Props: `children: React.ReactNode`, `className?: string`, `elevated?: boolean`, `bordered?: boolean`.
   - Implement glassmorphism via: `background: rgba(var(--color-surface-rgb), 0.08)`, `backdrop-filter: blur(12px) saturate(180%)`, `-webkit-backdrop-filter: blur(12px) saturate(180%)`, border `1px solid var(--color-border)`, `border-radius: var(--radius-md)`.
   - `elevated` modifier: add `box-shadow: var(--shadow-glass)`.
   - `bordered` modifier: set border color to `var(--color-border-glow)` (accent-tinted border).
   - Ensure `overflow: hidden` is set to prevent content bleeding outside the border-radius.
   - Note: `backdrop-filter` requires the panel to not have `transform: translateZ(0)` on itself (it creates a stacking context that breaks blur in some browsers). Add a code comment documenting this constraint.
2. `ActionButton.tsx`:
   - Props: `children: React.ReactNode`, `onClick: () => void`, `variant?: "primary" | "secondary"`, `disabled?: boolean`, `className?: string`.
   - Primary: accent color background with dark text, strong glow on hover.
   - Secondary: transparent background, accent color border and text, reduced glow on hover.
   - Apply CSS transitions for hover state: `transition: box-shadow var(--duration-fast), background var(--duration-fast)`.
   - Disabled state: reduced opacity, pointer-events-none.
   - Must be a `<button>` element (not a `<div>`).
3. `Tag.tsx`:
   - Props: `label: string`, `className?: string`.
   - Small pill shape: `border-radius: var(--radius-full)`, muted background, muted text.
   - No interactive behavior — purely display.
4. `MetricBadge.tsx`:
   - Props: `value: string`, `label: string`, `tooltip: string`, `className?: string`.
   - Layout: value (large, accent color) stacked above label (small, muted).
   - Tooltip: shown on hover after 200ms delay. Positioned below the badge. Tooltip content comes from `tooltip` prop. Uses local `useState` for hover state and `setTimeout` for delay. Tooltip is not a portal — it's absolutely positioned relative to the badge wrapper.
5. `src/core/design-system/components/index.ts`: export all four components.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification: Create a temporary `/dev` route in `main.tsx` that renders all four components with representative props. Verify:

- GlassPanel shows correct glass effect (backdrop blur visible against a dark background)
- ActionButton hover glow animates correctly
- MetricBadge tooltip appears after 200ms, disappears on mouse-leave
- Tag renders correctly at different label lengths

**Acceptance Criteria**

- `GlassPanel` glassmorphism renders correctly (no fallback to opaque background)
- All components use only CSS custom properties — no hardcoded color values
- `ActionButton` is a `<button>` element with correct `disabled` behavior
- `MetricBadge` tooltip delay is implemented via `setTimeout` (not CSS `transition-delay`)
- `backdrop-filter` browser compatibility note is present as a code comment
- TypeScript types are correct for all props — no `any` types

**Rollback Strategy**
Delete the four component files and `index.ts`. No runtime behavior affected.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: GlassPanel's glassmorphism implementation has browser-specific nuances (backdrop-filter stacking context) that require careful reasoning. MetricBadge tooltip timing needs precise implementation.

---

**Context Strategy**

Start new chat: Yes (switching from state architecture to UI components — clear context boundary)

Required files:

- `src/core/design-system/tokens.css`

Architecture docs: None required — implementation is driven by the visual spec, not the blueprint architecture docs.
Exclude: All blueprint documents

---

### T-008 — Design System Typography Components and Secondary Components

**Phase:** 0 — Project Setup
**Subsystem:** Design System — Typography and Utility Components

**Description:**
Implement the remaining design system components: `SectionHeading`, `DismissButton`, `MonoText`, and `BodyText`. These are simpler components that complete the design system's component inventory before zone development begins.

**Scope Boundaries**

Files affected:

- `src/core/design-system/typography/MonoText.tsx` (new)
- `src/core/design-system/typography/BodyText.tsx` (new)
- `src/core/design-system/components/SectionHeading.tsx` (new)
- `src/core/design-system/components/DismissButton.tsx` (new)
- `src/core/design-system/components/index.ts` (modify — add new exports)
- `src/core/design-system/typography/index.ts` (new — barrel export)

Modules affected:

- Design system only

NOT touching:

- Previously implemented components (`GlassPanel`, `ActionButton`, `Tag`, `MetricBadge`)

**Implementation Steps**

1. `MonoText.tsx`: Wrapper applying `font-family: var(--font-mono)`. Props: `children`, `className?`, `size?: "xs" | "sm" | "md"`. Used in terminal, boot sequence, metric values.
2. `BodyText.tsx`: Wrapper applying `font-family: var(--font-sans)`, standard body color. Props: `children`, `className?`, `muted?: boolean`. `muted` applies `color: var(--color-text-muted)`.
3. `SectionHeading.tsx`: Zone section title treatment. Props: `children`, `className?`. Renders as `<h2>` with appropriate size from the type scale and a subtle bottom border using `--color-border`.
4. `DismissButton.tsx`: The `×` close affordance used in expanded cards and modals. Props: `onClick: () => void`, `ariaLabel: string`, `className?`. Renders as a `<button>` with `aria-label` from prop. Uses `×` character. Small size, muted color, accent color on hover.
5. Update barrel exports in both `index.ts` files.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification: Add all new components to the existing `/dev` sandbox route. Confirm visual rendering.

**Acceptance Criteria**

- `DismissButton` has `aria-label` prop (not hardcoded) — required for accessibility
- `MonoText` renders in the monospace font defined in `--font-mono`
- `SectionHeading` renders as `<h2>` — not a `<div>` (semantic HTML requirement)
- All components added to barrel exports

**Rollback Strategy**
Delete the new files. No runtime behavior affected.

**Estimated Complexity:** XS

---

**LLM Execution Assignment**

Recommended Model: Gemini Pro (or equivalent fast model)
Recommended Mode: Standard generation

Reason: Simple, low-complexity components following established patterns. No architectural reasoning required.

---

**Context Strategy**

Start new chat: No (continue from T-007)

Required files:

- `src/core/design-system/tokens.css`
- `src/core/design-system/components/index.ts` (current state)

Architecture docs: None required.
Exclude: All blueprint documents

---

### T-009 — Content JSON Files — Initial Data Authoring

**Phase:** 0 — Project Setup
**Subsystem:** Content Layer

**Description:**
Author the initial content JSON files for all six content types using real data. These files are not placeholder stubs — they contain complete, accurate content that will be rendered by zones from the moment those zones are built. The schema for each file must match the TypeScript interfaces defined in T-003 exactly. Content IDs must follow the kebab-case slug convention and remain stable across all future edits.

**Scope Boundaries**

Files affected:

- `content/meta.json` (new)
- `content/projects.json` (new)
- `content/skills.json` (new)
- `content/edges.json` (new)
- `content/timeline.json` (new)
- `content/arena.json` (new)

Modules affected:

- Content layer only

NOT touching:

- Any source code file
- Any component or store

**Implementation Steps**

1. `content/meta.json`: Author `SystemMeta` with: real name, version `"3.0"`, current role, stack summary, 4–6 metric items (e.g., projects deployed, years experience, problems solved, certifications), contact info, GitHub and LinkedIn URLs, `resumeAssetPath: "/resume.pdf"`.
2. `content/projects.json`: Author a `Project[]` array with 4–8 real projects. Each project must have all required fields. `displayOrder` values must be unique. `skillRefs` values must reference IDs that will exist in `skills.json`. At least one project should have `demoUrl: null` to test the null-suppression rendering path.
3. `content/skills.json`: Author a `Skill[]` array with 20–40 skills covering languages, concepts, and domains. Assign stable kebab-case IDs. Ensure `projectRefs` are consistent with `skillRefs` in `projects.json` (bidirectional).
4. `content/edges.json`: Author a `SkillEdge[]` array defining relationships between skills. Each edge `source` and `target` must reference valid `Skill.id` values. Minimum 30 edges for a meaningful force graph layout.
5. `content/timeline.json`: Author a `TimelineEntry[]` array for all work experience and education entries. Sort by `startDate` descending. At least one entry should have `isCurrent: true` with `endDate: null`.
6. `content/arena.json`: Author the `ArenaProfile` object with real competitive programming data: platform ratings, difficulty breakdown, solved patterns with representative problem titles, a featured problem with full approach walkthrough, and certification groups.

**Data Impact**

Schema changes: Content files are the schema implementation.
Migration required: No.

**Test Plan**

Unit tests: Content schema validation tests will be written in T-010 and will run against these files.
Manual verification: Parse each file in Node.js (`JSON.parse`) — no parse errors. Cross-check: every `skillRef` in `projects.json` resolves to a valid ID in `skills.json`. Every `projectRef` in `skills.json` resolves to a valid ID in `projects.json`. Every edge `source` and `target` resolves to a valid ID in `skills.json`.

**Acceptance Criteria**

- All six JSON files parse without errors
- All cross-reference IDs resolve to valid entries in the referenced files
- All IDs use kebab-case slug format (no spaces, no camelCase)
- At least one `Project` has `demoUrl: null`
- At least one `TimelineEntry` has `isCurrent: true` and `endDate: null`
- `content/edges.json` contains at least 30 edges
- `content/skills.json` contains entries of all three `SkillType` values

**Rollback Strategy**
Content files can be freely edited or reverted. No code depends on specific content values — only the schema shape.

**Estimated Complexity:** M (authoring complexity, not technical complexity)

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Content authoring requires understanding the product's domain and the schema contracts, but is not technically complex. Standard Sonnet handles structured JSON generation well.

---

**Context Strategy**

Start new chat: Yes (content authoring is a distinct task domain from code implementation)

Required files:

- `src/core/types/content.ts` (for schema reference)

Architecture docs: `03_DATA_MODEL_AND_CONTENT_STRUCTURE.md` (full document — all schema definitions and behavioral notes)
Exclude: All other documents

---

### T-010 — Content Loader and Schema Validation

**Phase:** 0 — Project Setup
**Subsystem:** Core Utilities — Content Loading

**Description:**
Implement `contentLoader.ts` — the utility that fetches all six content JSON files in parallel, validates them against the expected schema shape, and returns a `ContentState` object for the store. Implement content schema validation tests that run against the actual `/content` files — these tests catch authoring errors at CI time, not at runtime.

**Scope Boundaries**

Files affected:

- `src/core/utils/contentLoader.ts` (new)
- `src/core/utils/contentLoader.test.ts` (new)
- `content/` files: read-only (validation target)

Modules affected:

- Core utilities only

NOT touching:

- Store (content loader is called by the store initialization, but the store itself is not modified here)
- Any component

**Implementation Steps**

1. `contentLoader.ts`:
   - Export an async function `loadContent(): Promise<ContentState>`.
   - Fetch all six content files in parallel: `Promise.all([fetch('/content/meta.json'), ...])`.
   - Parse each response to JSON.
   - Run field-presence validation (not deep type validation): check that each required top-level field is present and of the correct primitive type. For arrays, check that the array is non-empty and the first element has the required fields. Log a `console.warn` for any failed validation — do not throw.
   - If a single file fetch fails (network error or non-200 response): set that content type to its empty-array default (`projects: []`, etc.). Log `console.warn` with the file name. Do not throw.
   - Return the assembled `ContentState` object.
2. `contentLoader.test.ts`:
   - **Content schema validation tests** — these import and parse the actual `/content/*.json` files (using Vitest's Node environment file reading, not fetch mocks):
     - Every `Project` in `projects.json` has all required fields. `demoUrl` is `string | null` (never `undefined`). All `skillRefs` resolve to IDs in `skills.json`.
     - Every `Skill` in `skills.json` has all required fields. `type` is one of the three valid values. `mastery` and `confidence` are numbers between 0 and 100. All `projectRefs` resolve to IDs in `projects.json`.
     - Every `SkillEdge` in `edges.json`: `source` and `target` resolve to valid Skill IDs. `weight` is between 0 and 1.
     - Every `TimelineEntry` in `timeline.json`: `startDate` is a valid ISO date string. `endDate` is `string | null`. `isCurrent: true` entries have `endDate: null`.
     - `arena.json` has all required top-level fields.
     - `meta.json` has all required fields. `resumeAssetPath` starts with `/`.
   - **Content loader unit tests** (with fetch mocked via Vitest):
     - Success path: all fetches succeed → returns complete `ContentState`.
     - Partial failure: one file returns 404 → that type defaults to empty array, others populated.
     - Parse error: one file returns invalid JSON → that type defaults to empty, others populated.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

The content schema validation tests themselves are the test plan for this task.

**Acceptance Criteria**

- `loadContent()` returns a `ContentState` even when individual files fail
- Content schema tests pass against the actual content files in `/content`
- Cross-reference integrity tests pass (skillRefs, projectRefs, edge source/target)
- All fetch-mock unit tests pass
- `npx tsc --noEmit` passes (loader is fully typed)

**Rollback Strategy**
Delete `contentLoader.ts` and `contentLoader.test.ts`. No runtime behavior affected at this stage.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The cross-reference integrity checks and the partial-failure behavior require careful reasoning about the error handling contract.

---

**Context Strategy**

Start new chat: No (continue from T-009)

Required files:

- `src/core/types/content.ts`
- `src/core/types/state.ts` (for `ContentState`)
- `content/projects.json`, `content/skills.json`, `content/edges.json` (for schema test writing)

Architecture docs: `03_DATA_MODEL_AND_CONTENT_STRUCTURE.md` (Section 10 — content loading strategy), `08_TESTING_STRATEGY.md` (Section 3.1 — content schema validation tests)
Exclude: All other documents

---

### T-011 — Core Hooks

**Phase:** 0 — Project Setup
**Subsystem:** Core Hooks

**Description:**
Implement all shared hooks in `/core/hooks`. These hooks are the primary interface between components and the Zustand store. They enforce granular store subscriptions (components subscribe to only what they need), provide typed convenience wrappers, and encapsulate cross-cutting concerns like focus management and page visibility.

**Scope Boundaries**

Files affected:

- `src/core/hooks/useStore.ts` (new)
- `src/core/hooks/useNavigate.ts` (new)
- `src/core/hooks/useMode.ts` (new)
- `src/core/hooks/useContent.ts` (new)
- `src/core/hooks/useFocusTrap.ts` (new)
- `src/core/hooks/useReducedMotion.ts` (new)
- `src/core/hooks/usePageVisibility.ts` (new)
- `src/core/hooks/index.ts` (new — barrel export)

Modules affected:

- Core hooks only

NOT touching:

- Store slices (already implemented)
- Any component

**Implementation Steps**

1. `useStore.ts`: Export a typed `useStore` hook wrapping the Zustand store instance from `src/core/store/index.ts`. This is the single import point for store access — components never import from individual slice files.
2. `useNavigate.ts`: Returns `{ navigateTo, activeZone, isTransitioning }` from the navigation slice. Components that only need navigation don't need to subscribe to unrelated state.
3. `useMode.ts`: Returns `{ activeMode, isMobile }` and a derived `capabilities: ModeCapabilities` object computed from `activeMode`. The capability map translates `activeMode` into boolean flags (`ambientActive`, `gameLayerActive`, `animationsEnabled`, `animationLevel`, `miniMapAvailable`) per Document 04 Section 7's mode behavior table.
4. `useContent.ts`: Returns typed content selectors. Export individual named hooks: `useProjects()`, `useSkills()`, `useEdges()`, `useTimeline()`, `useArena()`, `useMeta()` — each subscribes to only its own slice of the content state.
5. `useFocusTrap.ts`: Accepts a `containerRef: React.RefObject<HTMLElement>` and an `isActive: boolean`. When active, traps Tab/Shift+Tab focus within the container. On activation, moves focus to the first focusable element in the container. On deactivation, restores focus to the previously focused element. Uses `document.querySelectorAll` with a focusable element selector string.
6. `useReducedMotion.ts`: Thin wrapper around Framer Motion's `useReducedMotion`. Returns `boolean`. Also returns `true` if `activeMode` is `"safe"` — combining OS preference with in-app mode.
7. `usePageVisibility.ts`: Uses `document.addEventListener("visibilitychange", ...)`. Returns `isVisible: boolean`. Used by `ParticleCanvas` to suspend its animation loop when the tab is hidden.
8. `src/core/hooks/index.ts`: Barrel export for all hooks.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests (Vitest with React Testing Library `renderHook`):

- `useMode` returns correct `capabilities` for each of the four modes.
- `useFocusTrap`: focus moves into container on activation; focus returns on deactivation.
- `useReducedMotion` returns `true` when `activeMode` is `"safe"`.
- `usePageVisibility` returns `false` when `document.visibilityState` is `"hidden"`.

**Acceptance Criteria**

- No hook imports from a slice file directly — all go through `src/core/store/index.ts`
- `useMode` returns a `capabilities` object for every valid `UserMode` value
- `useFocusTrap` handles the case where no focusable elements are found in the container (no crash)
- `useReducedMotion` combines OS preference AND app mode — both independently trigger the `true` return

**Rollback Strategy**
Delete all hook files. No runtime behavior is affected since no components consume them yet.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: `useFocusTrap` has browser-specific behavior nuances. `useReducedMotion`'s dual-source logic and `useMode`'s capability derivation require careful implementation.

---

**Context Strategy**

Start new chat: Yes (new concern — hooks bridge layer)

Required files:

- `src/core/store/index.ts`
- `src/core/types/modes.ts`
- `src/core/types/state.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 7 — mode behavior table), `08_TESTING_STRATEGY.md` (Section 5.5 — mode selector tests, for behavior reference)
Exclude: Content documents, zone documents

---

### T-012 — Zone Registry and Utility Scaffolding

**Phase:** 0 — Project Setup
**Subsystem:** Core Utilities — Registry Layer

**Description:**
Implement `zoneRegistry.ts`, `idResolver.ts`, and `sessionStorage.ts` utilities. The zone registry is the authoritative mapping from `ZoneId` to lazy-loaded React components — it is the only place zone components are imported in the application shell. `idResolver.ts` provides the cross-entity ID-to-label resolution needed by Timeline Tunnel and other zones. The command registry shell (`commandRegistry.ts`) is created as a stub only — full command implementation is a Phase 4 task.

**Scope Boundaries**

Files affected:

- `src/core/utils/zoneRegistry.ts` (new)
- `src/core/utils/idResolver.ts` (new)
- `src/core/utils/sessionStorage.ts` (new)
- `src/core/utils/commandRegistry.ts` (new — stub only)
- `src/core/utils/index.ts` (new — barrel export)

Modules affected:

- Core utilities only

NOT touching:

- Zone components (not yet created)
- Store slices

**Implementation Steps**

1. `zoneRegistry.ts`: Define a `ZoneRegistry` type as `Record<ZoneId, { component: React.LazyExoticComponent<React.ComponentType>; displayName: string; navLabel: string }>`. Populate using `React.lazy(() => import('@/zones/<zone-id>'))` for all seven zones. Since stub zone files do not yet exist, use inline lazy components that return `null` as temporary entries — these will be replaced when actual zones are built. Export the registry and a `getZone(id: ZoneId)` helper.
2. `idResolver.ts`: Export `resolveSkillLabel(skillId: string, skills: Skill[]): string | null`. Returns the `label` of the skill matching the ID, or `null` if not found. Export `resolveProjectTitle(projectId: string, projects: Project[]): string | null`. These are the only two resolution functions needed based on the cross-reference patterns in Document 03 Section 9.
3. `sessionStorage.ts`: Export `readSession(key: string): string | null`, `writeSession(key: string, value: string): void`, `clearSession(key: string): void`. Wrap in try-catch for environments where `sessionStorage` is unavailable.
4. `commandRegistry.ts` (stub): Export an empty `CommandRegistry` type and an empty `commandRegistry` object. Add a comment: "Full command registry implemented in T-032 (Phase 4 — Terminal)." This file must exist now because the terminal slice already references it conceptually.
5. `src/core/utils/index.ts`: Barrel export for all utilities.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests:

- `idResolver`: resolves known IDs, returns `null` for unknown IDs, handles empty arrays without crashing.
- `sessionStorage` helpers: read returns `null` for absent keys, write+read round-trip, clear removes key.

**Acceptance Criteria**

- `zoneRegistry.ts` covers all seven `ZoneId` values — TypeScript will error if any are missing (exhaustive key type)
- `idResolver` functions handle empty input arrays without throwing
- `sessionStorage` helpers are wrapped in try-catch (defensive against restricted environments)
- `commandRegistry.ts` is a valid TypeScript file (even if empty)

**Rollback Strategy**
Delete utility files. No runtime behavior affected.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Straightforward utility implementations with clear contracts. No complex reasoning required.

---

**Context Strategy**

Start new chat: No (continue from T-011)

Required files:

- `src/core/types/zones.ts`
- `src/core/types/content.ts`

Architecture docs: `05_APPLICATION_STRUCTURE.md` (Section 3.5 — utils module), `03_DATA_MODEL_AND_CONTENT_STRUCTURE.md` (Section 9 — cross-entity relationships)
Exclude: All other documents

---

## PHASE 1 — Core Shell, Navigation, and HUD

**Objective:** Build the four-layer application shell, the navigation state machine wired to UI, zone transition animation with `AnimatePresence`, the persistent HUD (NavBar, ModeSelector), and all seven stub zones. By the end of this phase, the application is fully navigable.

---

### T-013 — App Shell Layer Composition

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** Application Shell

**Description:**
Implement `App.tsx` as the root four-layer composition. Implement the `AmbientPlane`, `ZonePlane`, `HudPlane`, and `OverlayPlane` structural components as stubs that will be filled in subsequent tasks. Implement the content loading gate: `App.tsx` triggers `loadContent()` on mount and dispatches `loadContent(payload)` to the store via `markContentLoaded()`. Wire the boot sequence gate logic: if `bootPlayed` is false, the boot overlay renders; otherwise, the main shell renders directly.

**Scope Boundaries**

Files affected:

- `src/App.tsx` (implement from stub)
- `src/ambient/AmbientPlane.tsx` (new — stub)
- `src/zones/ZonePlane.tsx` (new — stub renders `<div>Zone Plane</div>`)
- `src/hud/HudPlane.tsx` (new — stub renders `<div>HUD Plane</div>`)
- `src/overlays/OverlayPlane.tsx` (new — stub renders `null`)
- `src/boot/BootSequence.tsx` (new — stub renders `<div>Boot Sequence</div>`)

Modules affected:

- Application shell structure

NOT touching:

- Zone components (stubs only)
- NavBar, ModeSelector (T-015, T-016)
- Particle system (T-014)

**Implementation Steps**

1. `App.tsx`:
   - On mount (`useEffect`), call `loadContent()` from `contentLoader.ts`. On resolution, dispatch `markContentLoaded()` to the session slice and `loadContent(payload)` to the content slice.
   - Read `bootPlayed` and `contentLoaded` from the session slice via `useStore`.
   - Render logic: if `!contentLoaded`, render a minimal transparent loading state (not visible to user — boot overlay covers it). Once `contentLoaded` is true and `!bootPlayed`, render `<BootSequence onComplete={handleBootComplete} />`. Once `bootPlayed` is true, render the four-layer shell.
   - `handleBootComplete`: calls `markBootPlayed()` on the session slice.
   - Four-layer shell: `<div id="app-shell" style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>` wrapping `<AmbientPlane />`, `<ZonePlane />`, `<HudPlane />`, `<OverlayPlane />` with correct `position: absolute` and `z-index` values derived from the CSS z-index tokens.
2. Stacking context: each plane root element has `position: absolute`, `inset: 0`, `z-index: var(--z-<layer>)`.
3. `AmbientPlane.tsx`: Stub — renders `<div>` with `position: absolute`, `inset: 0`, `pointer-events: none`. Will be filled in T-014.
4. `ZonePlane.tsx`: Stub — renders `<div style={{ width: '100%', height: '100%' }}>Zone Placeholder</div>`. Will be replaced in T-015.
5. `HudPlane.tsx`, `OverlayPlane.tsx`: Stubs rendering `null`. Will be filled in T-016, T-017.
6. `BootSequence.tsx`: Stub rendering `<div onClick={onComplete}>Boot Stub (click to skip)</div>`. Full implementation is Phase 2.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification: `npm run dev` renders the app shell. Clicking the boot stub advances to the zone plane. Refreshing the page after clicking replays the boot stub (sessionStorage cleared between dev reloads).

**Acceptance Criteria**

- `loadContent()` is called on mount; content is in the store once loaded
- Boot gate logic works: boot stub shows first, clicking it advances to the shell
- Four layers are stacked with correct z-indices (inspect via browser DevTools)
- `App.tsx` uses only hook imports — no direct store imports
- No TypeScript errors

**Rollback Strategy**
Revert `App.tsx` to the blank stub. Delete the four plane stubs and boot stub.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The boot gate / content load sequencing logic has ordering constraints that require careful reasoning.

---

**Context Strategy**

Start new chat: Yes (beginning Phase 1 — new context boundary)

Required files:

- `src/core/store/index.ts`
- `src/core/hooks/index.ts`
- `src/core/utils/contentLoader.ts`
- `src/core/types/state.ts`

Architecture docs: `05_APPLICATION_STRUCTURE.md` (Section 7 — App shell composition), `01_SYSTEM_ARCHITECTURE.md` (Section 10 — boot sequence integration)
Exclude: Zone documents, dynamic UI documents

---

### T-014 — Ambient Plane — Particle Canvas and Background Grid

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** Ambient Environment — Layer 1

**Description:**
Implement the `ParticleCanvas` canvas-based particle system and the `BackgroundGrid` CSS component. Implement `AmbientPlane.tsx` to compose them and apply mode-based visibility (inactive in Recruiter, Deep, and Safe modes). The particle system must implement all performance optimizations defined in Document 07 Section 5.3: adaptive particle count, Page Visibility API suspension, `Float32Array` particle state storage, and batched canvas state changes.

**Scope Boundaries**

Files affected:

- `src/ambient/AmbientPlane.tsx` (implement from stub)
- `src/ambient/ParticleCanvas.tsx` (new)
- `src/ambient/BackgroundGrid.tsx` (new)

Modules affected:

- Ambient environment plane only

NOT touching:

- Any zone component
- HUD plane
- Mode selector (mode is read-only here via `useMode` hook)

**Implementation Steps**

1. `ParticleCanvas.tsx`:
   - Use a `<canvas>` element that fills its container (`width: 100%; height: 100%`). Use `useRef` for the canvas element and `useEffect` for the animation loop.
   - Particle state: three `Float32Array` buffers — `x`, `y`, `opacity` (size = particle count). Velocity in `vx`, `vy` arrays. This is the cache-efficient iteration pattern from Document 07.
   - Initialization: run the 100ms benchmark on mount (render a test batch, measure elapsed time). If elapsed > threshold (e.g., 16ms), halve the particle count. Cap particle count at 80 for normal tier, 40 for reduced tier.
   - Animation loop: `requestAnimationFrame` → clear canvas → update positions → draw all particles with a single `fillStyle` set per frame. Each particle is a small circle (2–3px radius) at low opacity.
   - Page Visibility: hook into `usePageVisibility`. Cancel animation frame when hidden; resume on visible.
   - `useEffect` cleanup: `cancelAnimationFrame(rafId)`.
2. `BackgroundGrid.tsx`:
   - CSS-only implementation using `background-image: repeating-linear-gradient(...)` to create a subtle dot-grid or line-grid pattern. Low opacity. `pointer-events: none`.
   - Uses `--color-border` at very low opacity for the grid lines.
3. `AmbientPlane.tsx`:
   - Read `capabilities.ambientActive` from `useMode()`.
   - If `!capabilities.ambientActive`, return `null`. Both `ParticleCanvas` and `BackgroundGrid` are unmounted.
   - Otherwise render both components within the plane wrapper.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification:

- Switch to Explorer Mode: particle canvas renders and animates.
- Switch to Recruiter Mode: canvas disappears instantly (no fade, per mode switch contract).
- Hide browser tab: animation loop suspends (Chrome DevTools Performance tab — no canvas work while hidden).
- Inspect canvas element: confirm `Float32Array` buffers in use (check in React DevTools).

Unit tests: None for animation systems (animation correctness is visual; performance is measured via manual profiling).

**Acceptance Criteria**

- Particle canvas renders in Explorer Mode only
- Animation loop suspends when tab is hidden (Page Visibility API integration verified)
- Particle state uses `Float32Array` (not array-of-objects)
- Single `fillStyle` set per frame, not per particle
- `useEffect` cleanup properly cancels `requestAnimationFrame` on unmount
- Background grid renders as a CSS-only pattern (no JS, no canvas)

**Rollback Strategy**
Replace `AmbientPlane.tsx` with the stub from T-013. The rest of the shell is unaffected.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: Canvas animation loop lifecycle, `Float32Array` particle state management, and Page Visibility integration have multiple interacting concerns that require careful implementation.

---

**Context Strategy**

Start new chat: No (continue from T-013)

Required files:

- `src/core/hooks/useMode.ts`
- `src/core/hooks/usePageVisibility.ts`

Architecture docs: `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 5.3 — particle system optimization)
Exclude: All other documents

---

### T-015 — Stub Zone Components

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** Zone Scaffolding

**Description:**
Create the stub zone component for all seven zones. Each stub is a proper zone module following the structure defined in Document 05 Section 4, with the correct directory layout, `index.ts` export, and a root component that renders the zone name in a `GlassPanel`. The stubs satisfy the zone interface contract — they accept no props, use `useMode`, and apply a Framer Motion entry animation (stub-level). The zone registry in `zoneRegistry.ts` is updated to point to these real stub components instead of the inline `React.lazy` stubs.

**Scope Boundaries**

Files affected:

- `src/zones/control-room/index.ts` (new)
- `src/zones/control-room/ControlRoomZone.tsx` (new — stub)
- `src/zones/memory-vault/index.ts` (new)
- `src/zones/memory-vault/MemoryVaultZone.tsx` (new — stub)
- `src/zones/neural-graph/index.ts` (new)
- `src/zones/neural-graph/NeuralGraphZone.tsx` (new — stub)
- `src/zones/timeline-tunnel/index.ts` (new)
- `src/zones/timeline-tunnel/TimelineTunnelZone.tsx` (new — stub)
- `src/zones/arena/index.ts` (new)
- `src/zones/arena/ArenaZone.tsx` (new — stub)
- `src/zones/gateway/index.ts` (new)
- `src/zones/gateway/GatewayZone.tsx` (new — stub)
- `src/core/utils/zoneRegistry.ts` (modify — point to real stub components)

Modules affected:

- Zone scaffolding, zone registry

NOT touching:

- Any zone's actual content implementation
- Any store slice

**Implementation Steps**

1. For each of the six zones, create the directory structure per Document 05 Section 4: `index.ts` (re-exports the zone root component as default), `<ZoneName>Zone.tsx` (stub implementation), empty `/components` and `/hooks` subdirectories.
2. Each `<ZoneName>Zone.tsx` stub:
   - Imports `GlassPanel` from `@/core/design-system/components`.
   - Imports `useMode` from `@/core/hooks`.
   - Reads `activeMode` (to confirm mode hook connection works).
   - Renders: `<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GlassPanel><h1>[Zone Display Name] — Coming Soon</h1></GlassPanel></motion.div>`.
3. Update `src/core/utils/zoneRegistry.ts`: replace inline lazy stubs with `React.lazy(() => import('@/zones/<zone-id>'))` for each zone.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification: Navigate to each zone via the (not yet built) NavBar — or temporarily render NavBar buttons directly in `App.tsx`. Confirm each stub renders its zone name within a glass panel.

**Acceptance Criteria**

- All six zone directories follow Document 05 Section 4 structure
- Each zone's `index.ts` has a default export of the zone root component
- Zone registry points to all six real (stub) zone components
- `npx tsc --noEmit` passes — no type errors in any stub

**Rollback Strategy**
Delete zone directories. Revert `zoneRegistry.ts` to inline stub form.

**Estimated Complexity:** XS

---

**LLM Execution Assignment**

Recommended Model: Gemini Pro (or equivalent fast model)
Recommended Mode: Standard generation

Reason: Highly repetitive scaffolding task. Pattern is fully defined. Six identical structures with name variation.

---

**Context Strategy**

Start new chat: No (continue from T-014)

Required files:

- `src/core/utils/zoneRegistry.ts` (current state)
- `src/core/design-system/components/GlassPanel.tsx` (for import reference)

Architecture docs: `05_APPLICATION_STRUCTURE.md` (Section 4 — zone module structure)
Exclude: All other documents

---

### T-016 — Zone Plane — Lazy Loading, Suspense, and Zone Transitions

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** Navigation — Zone Rendering Engine

**Description:**
Implement `ZonePlane.tsx` — the component that reads `activeZone` from the store, resolves the lazy zone component from `zoneRegistry`, wraps it in a `Suspense` boundary, and applies `AnimatePresence` for zone cross-fade transitions. Implement the zone transition animation contract: exiting zone fades out (200ms), entering zone fades in (300ms) with a 50ms overlap. Configure Vite's `manualChunks` to assign each zone to its own bundle chunk. Wire `onTransitionComplete` to reset `isTransitioning` in the navigation slice after the exit animation completes.

**Scope Boundaries**

Files affected:

- `src/zones/ZonePlane.tsx` (implement from stub)
- `vite.config.ts` (modify — add `build.rollupOptions.output.manualChunks`)
- `src/core/utils/zoneRegistry.ts` (read-only reference — no changes)

Modules affected:

- Zone rendering layer, build configuration

NOT touching:

- Any zone component's internal content
- HUD plane
- Navigation slice actions (already implemented — called from here)

**Implementation Steps**

1. `ZonePlane.tsx`:
   - Read `activeZone` and `onTransitionComplete` from `useNavigate()`.
   - Resolve the current zone component from `zoneRegistry.ts`.
   - Render structure:

     ```
     <Suspense fallback={null}>
       <AnimatePresence mode="wait" onExitComplete={onTransitionComplete}>
         <CurrentZoneComponent key={activeZone} />
       </AnimatePresence>
     </Suspense>
     ```

   - `AnimatePresence` `mode="wait"` ensures the exit animation completes before the enter animation begins. `onExitComplete` fires `onTransitionComplete()` which sets `isTransitioning: false` in the navigation slice.
   - `key={activeZone}` is essential: it signals to `AnimatePresence` that the component has changed, triggering the exit/enter cycle.
   - The zone's own Framer Motion `motion.div` wrapper handles both entry (opacity 0→1, y 12→0, 300ms) and exit (opacity 1→0, 200ms). `ZonePlane` does not apply animation directly — it delegates to `AnimatePresence`.
   - Suspense fallback is `null` — during the boot window, pre-fetched zones load invisibly. For non-pre-fetched zones, the previous zone or a blank screen covers the load time (acceptable for infrequent navigations).
2. `vite.config.ts` — add `build.rollupOptions.output.manualChunks`:
   - Assign `d3` and all `d3-*` sub-packages to `neural-graph` chunk.
   - Assign `framer-motion` to the `core` chunk (shared by all zones).
   - Assign `zustand` to the `core` chunk.
   - Zone chunks are handled automatically by `React.lazy` code-splitting — no manual assignment needed for zone files themselves.
3. Add `<link rel="modulepreload">` tags to `index.html` for the neural-graph and terminal chunks (pre-fetch during boot window per Document 07 Section 3.2).

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Integration tests (Vitest + React Testing Library):

- Navigate from zone A to zone B: `activeZone` updates in store; zone B component renders.
- `isTransitioning` is `true` during transition and `false` after `onExitComplete` fires.
- Navigating to the current zone: no re-render, no transition.

Manual verification: Navigate between stub zones. Confirm cross-fade animation plays (slow it down in Chrome DevTools Animations panel if needed). Confirm Vite build produces separate chunk files per zone (`npm run build` then inspect `/dist/assets/`).

**Acceptance Criteria**

- Cross-fade transition plays correctly: exit (200ms) then enter (300ms)
- `isTransitioning` is reset to `false` after exit animation completes (not on a timer)
- `key={activeZone}` is present on the zone component in `AnimatePresence`
- `npm run build` produces separate chunk files for each zone
- Neural-graph and terminal chunks have `modulepreload` tags in `index.html`
- Suspense fallback is `null` (transparent, not a loading spinner)

**Rollback Strategy**
Replace `ZonePlane.tsx` with the stub. Revert `vite.config.ts` `manualChunks` entry.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Opus
Recommended Mode: Standard

Reason: The interaction between `AnimatePresence mode="wait"`, `onExitComplete`, and the Zustand `isTransitioning` flag requires precise reasoning. Getting this wrong produces visual bugs that are hard to isolate later.

---

**Context Strategy**

Start new chat: Yes (critical rendering system — clean context)

Required files:

- `src/core/store/index.ts`
- `src/core/hooks/useNavigate.ts`
- `src/core/utils/zoneRegistry.ts`
- `src/core/types/zones.ts`

Architecture docs: `01_SYSTEM_ARCHITECTURE.md` (Section 4 — navigation system design), `04_STATE_AND_INTERACTION_ENGINE.md` (Section 3 — zone switching logic), `06_DYNAMIC_UI_SYSTEMS.md` (Section 6.2, 6.3 — zone entry/exit animation)
Exclude: Content documents, zone documents, HUD documents

---

### T-017 — NavBar and NavItem Components

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** HUD — Navigation Bar

**Description:**
Implement `NavBar.tsx` and `NavItem.tsx`. The NavBar renders one `NavItem` per zone from the zone registry. The active zone item is visually distinguished. Clicking an item that is not the active zone dispatches `navigateTo`. Clicking the active zone item is a no-op (confirmed visually by a disabled-state treatment). Navigation is blocked during `isTransitioning` — NavBar items are pointer-events-none while a transition is in progress.

**Scope Boundaries**

Files affected:

- `src/hud/navbar/NavBar.tsx` (new)
- `src/hud/navbar/NavItem.tsx` (new)

Modules affected:

- HUD navbar subsystem

NOT touching:

- `HudPlane.tsx` (wired in T-019)
- ModeSelector (T-018)
- Any zone component

**Implementation Steps**

1. `NavItem.tsx`:
   - Props: `zoneId: ZoneId`, `label: string`, `isActive: boolean`, `isDisabled: boolean`, `onClick: () => void`.
   - Apply `React.memo` — `NavItem` should only re-render when its `isActive` or `isDisabled` prop changes (per Document 07 Section 4.2).
   - Active state: accent color text and border, or accent underline treatment.
   - Disabled state (`isDisabled = isTransitioning`): `pointer-events: none`, reduced opacity.
   - Active zone (`isActive = true`): cursor remains default (not pointer) to signal non-clickability. Apply accent indicator (e.g., a small dot or line below the label).
   - Use `ActionButton` secondary variant or a custom button element — must be a `<button>` for accessibility.
2. `NavBar.tsx`:
   - Read `activeZone` and `isTransitioning` from `useNavigate()`.
   - Read zone metadata (labels) from `zoneRegistry` — use `Object.entries(zoneRegistry)` to derive the navigation items.
   - Render a horizontal list of `NavItem` components.
   - For each item: `isActive = (zoneId === activeZone)`, `isDisabled = isTransitioning`, `onClick = () => navigateTo(zoneId)` (the `navigateTo` function itself guards against active zone and transitioning state, but NavBar's visual disabled state provides the user-facing feedback).

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI interaction tests (React Testing Library):

- Render `NavBar` with `activeZone: "control-room"`. All zone items render.
- Click a non-active zone item: `navigateTo` called with correct zone ID.
- Click the active zone item: `navigateTo` not called.
- `isTransitioning: true`: all items have `pointer-events: none` (verify via computed styles or `aria-disabled`).

**Acceptance Criteria**

- `NavItem` uses `React.memo` — confirmed via React Profiler (no re-renders when unrelated state changes)
- Active zone item is visually distinguished with accent treatment
- All NavBar items are `<button>` elements (not `<div>` or `<a>`)
- NavBar width does not grow unboundedly with zone count (fixed-width items or flex layout)
- All UI interaction tests pass

**Rollback Strategy**
Delete `NavBar.tsx` and `NavItem.tsx`. No shell behavior is affected until `HudPlane.tsx` is wired in T-019.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Clear component specification. The interaction logic is simple. Main concern is correct accessibility treatment and `React.memo` application.

---

**Context Strategy**

Start new chat: No (continue from T-016)

Required files:

- `src/core/hooks/useNavigate.ts`
- `src/core/utils/zoneRegistry.ts`
- `src/core/types/zones.ts`
- `src/core/design-system/components/ActionButton.tsx` (visual reference)

Architecture docs: `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 4.2 — React.memo targets)
Exclude: All other documents

---

### T-018 — Mode Selector Component

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** HUD — Mode Selector

**Description:**
Implement `ModeSelector.tsx` — the always-visible mode toggle control. The selector displays all four mode options. The active mode is visually distinct. Switching modes is instant (no animation per the mode switch contract in Document 04 Section 2.2). The component uses `useMode` to read `activeMode` and dispatches `setMode` on click.

**Scope Boundaries**

Files affected:

- `src/hud/mode-selector/ModeSelector.tsx` (new)

Modules affected:

- HUD mode selector subsystem

NOT touching:

- `HudPlane.tsx` (wired in T-019)
- NavBar
- Any zone component

**Implementation Steps**

1. `ModeSelector.tsx`:
   - Read `activeMode` from `useMode()`. Read `setMode` from `useStore()`.
   - Render four mode buttons in a compact group: Explorer, Recruiter, Deep, Safe.
   - Active mode button: accent color treatment, non-clickable (pointer-events: none or cursor: default). Visual indicator (filled vs outlined, or accent background).
   - Inactive mode buttons: muted treatment, hover glow, pointer cursor.
   - Mode labels: use short labels that fit the compact HUD context (e.g., "EXP", "REC", "DEEP", "SAFE" or full names — design decision, document in code).
   - Each button: `<button type="button" aria-pressed={mode === activeMode} onClick={() => setMode(mode)}>`.
   - No transition animation on mode change — instant re-render contract.
   - Apply `React.memo` to the component.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI interaction tests:

- All four mode buttons render.
- Click Recruiter: `setMode("recruiter")` dispatched; Recruiter button shows active state.
- Click currently active mode: no state change.
- `aria-pressed` attribute reflects active state correctly.

**Acceptance Criteria**

- Mode switch is visually instant — no Framer Motion wrapper on this component
- `aria-pressed` is present and correct on all four buttons
- Clicking active mode button produces no re-render (confirmed via React Profiler if `setMode` is a no-op for same mode)
- All four `UserMode` values are represented

**Rollback Strategy**
Delete `ModeSelector.tsx`. No shell behavior affected until `HudPlane.tsx` is wired.

**Estimated Complexity:** XS

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Simple component. Primary concern is correct `aria-pressed` and no-op behavior for active mode.

---

**Context Strategy**

Start new chat: No (continue from T-017)

Required files:

- `src/core/hooks/useMode.ts`
- `src/core/store/index.ts` (for `setMode` access)
- `src/core/types/modes.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 2.2 — mode slice), `06_DYNAMIC_UI_SYSTEMS.md` (Section 6.3 — mode switch animation contract)
Exclude: All other documents

---

### T-019 — HUD Plane Composition and Phase 1 Integration

**Phase:** 1 — Core Shell, Navigation, and HUD
**Subsystem:** HUD — Layer 3 Composition

**Description:**
Implement `HudPlane.tsx` to compose `NavBar` and `ModeSelector`. Wire the `OverlayPlane` stub to the overlay stack in the store. Confirm that the full four-layer application shell works end-to-end: navigation via NavBar switches zones with animation, mode switching via ModeSelector updates the application shell. Write all Phase 1 navigation state machine integration tests.

**Scope Boundaries**

Files affected:

- `src/hud/HudPlane.tsx` (implement from stub)
- `src/overlays/OverlayPlane.tsx` (implement basic stub — reads `overlayStack`, renders nothing yet)
- `src/core/store/navigationSlice.test.ts` (extend — add all integration scenarios from Document 08 Section 4.1)

Modules affected:

- HUD plane composition, overlay plane structure, navigation integration tests

NOT touching:

- MiniMap (deferred to Phase 7 with game layer)
- GameHud (deferred to Phase 7)
- Any zone component internals

**Implementation Steps**

1. `HudPlane.tsx`:
   - Read `activeMode` from `useMode()`.
   - Render `<NavBar />` and `<ModeSelector />` in a fixed-position HUD layout.
   - HUD position: top bar or side panel — document the layout choice in a code comment.
   - Apply `will-change: transform` to the HUD wrapper for GPU compositing (per Document 07 Section 4.1).
   - Stubs for `<MiniMap />` and `<GameHud />`: render `null` for now. Add `{capabilities.miniMapAvailable && <MiniMap />}` placeholder commented out — these will be uncommented in Phase 7.
2. `OverlayPlane.tsx`:
   - Read `overlayStack` from `useStore()`.
   - For now, render `null` regardless of stack contents. This stub satisfies the architectural wiring without requiring overlay implementations.
3. Navigation integration tests in `navigationSlice.test.ts` (extend from T-005):
   - All scenarios from Document 08 Section 4.1 (navigation state machine tests).
   - All overlay stack scenarios from Document 08 Section 4.3.
4. Mode transition tests in `modeSlice.test.ts` (extend from T-005):
   - All scenarios from Document 08 Section 4.2.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Integration tests: All navigation and mode transition tests from Document 08 Sections 4.1 and 4.2 must pass.

Manual verification: Full navigation flow — click each zone in the NavBar, observe cross-fade animation, observe HUD active zone indicator updates. Switch modes via ModeSelector, observe particle canvas activating/deactivating.

**Acceptance Criteria**

- Navigating between all six zones via NavBar works with cross-fade animation
- Mode switching via ModeSelector immediately updates the shell (particle canvas, zone renders correctly per mode)
- `HudPlane` applies `will-change: transform` on its root element
- All navigation state machine integration tests pass (Document 08 Section 4.1)
- All mode transition tests pass (Document 08 Section 4.2)
- All overlay stack tests pass (Document 08 Section 4.3)
- `npm run test` passes with zero failures

**Rollback Strategy**
Revert `HudPlane.tsx` to the null-rendering stub. The shell remains navigable via direct store dispatches for debugging.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Composition task with clear structure. The primary deliverable here is the test suite completion — the component implementation is straightforward.

---

**Context Strategy**

Start new chat: No (continue from T-018)

Required files:

- `src/hud/navbar/NavBar.tsx`
- `src/hud/mode-selector/ModeSelector.tsx`
- `src/core/store/navigationSlice.test.ts` (current state)
- `src/core/store/modeSlice.test.ts` (current state)

Architecture docs: `08_TESTING_STRATEGY.md` (Sections 4.1, 4.2, 4.3 — state transition test scenarios)
Exclude: All other documents

---

## PHASE 2 — Boot Sequence and Control Room

**Objective:** Implement the boot sequence overlay and the fully functional Control Room zone. By the end of this phase, the application has a complete "first impression" flow: boot animation plays, content pre-fetches in the background, and the Control Room zone renders with real data. The application is now demonstrable end-to-end.

---

### T-020 — Boot Sequence — Animation and Session Logic

**Phase:** 2 — Boot Sequence and Control Room
**Subsystem:** Boot — Full-Screen Overlay

**Description:**
Implement the full `BootSequence.tsx` component, replacing the stub from T-013. The boot sequence is a full-screen blocking overlay with a CSS-driven scanline animation, a timed sequence of fake module-loading text lines, and a fade-out completion handler. The component is lazy-loaded via `React.lazy`. The session flag logic (sessionStorage read on mount, write on completion) is already wired in the store — this task wires it to the component behavior. Safe Mode must skip the boot sequence entirely: `BootSequence` never renders if `activeMode` is `"safe"`.

**Scope Boundaries**

Files affected:

- `src/boot/BootSequence.tsx` (implement from stub)
- `src/boot/bootLines.ts` (new — static array of fake module loading strings)
- `src/App.tsx` (modify — add Safe Mode boot-skip logic)

Modules affected:

- Boot overlay module

NOT touching:

- Session slice (already wired in T-006)
- Any zone component
- Content loading logic (already wired in T-013)

**Implementation Steps**

1. `src/boot/bootLines.ts`:
   - Export a `BOOT_LINES: string[]` constant. Write 12–18 fake module-loading strings that fit the OS aesthetic. Examples: `"[INIT] Loading neural substrate..."`, `"[OK] Content manifold validated"`, `"[LOAD] Injecting interaction engine"`, `"[READY] Skill graph topology resolved"`. These are entirely static — no dynamic content.
   - Lines should feel like a real OS boot sequence. Group them in three phases: initialization, loading, ready.

2. `src/boot/BootSequence.tsx`:
   - Props: `onComplete: () => void`.
   - The component manages its own animation timeline using `useState` and `useEffect`. No Framer Motion — this is a CSS keyframe and `setTimeout`-driven sequence.
   - **Phase 1 — Scanline sweep (0–600ms):** A `<div>` element with `position: absolute`, `width: 100%`, `height: 4px`, `background: var(--color-accent)`, animated via CSS keyframe `@keyframes scanline-sweep` from `top: 0%` to `top: 100%` over 600ms. Applied as an inline `style` block using a `<style>` tag in the component or a CSS module.
   - **Phase 2 — Line reveal (600ms–2400ms):** `bootLines` are revealed one at a time using a `setInterval` at 100ms per line. Each line fades in via CSS `opacity: 0 → 1` transition (100ms). Lines accumulate — they do not replace each other. Lines render in `MonoText` component.
   - **Phase 3 — Completion flash (2400ms–2800ms):** All lines present. A brief full-screen flash (opacity pulse on the overlay background) indicates system ready. CSS keyframe, single pulse, 400ms.
   - **Phase 4 — Fade out (2800ms–3000ms):** The entire overlay fades out via a `useState`-controlled CSS `opacity` transition (200ms). On `transitionend`, calls `onComplete`.
   - Skip affordance: a `<button>` in the bottom-right corner labeled "SKIP →". On click, clears all timeouts, sets overlay opacity to 0, fires `onComplete` after a 100ms delay (to allow the fade to start visually).
   - `prefers-reduced-motion` bypass: if `useReducedMotion()` returns true, the scanline and line-reveal phases are skipped. The overlay renders all lines at once, holds for 500ms, then fades out and fires `onComplete`.

3. `src/App.tsx` — Safe Mode boot-skip:
   - Add a check before the boot gate: `if (activeMode === "safe") { /* skip boot: treat as bootPlayed */ }`. Specifically: if `activeMode === "safe"` and `!bootPlayed`, call `markBootPlayed()` directly without rendering the boot sequence. This ensures Safe Mode never shows the boot sequence per Document 04 Section 7.

4. `src/App.tsx` — Content pre-fetch trigger:
   - After boot completes and `contentLoaded` is true, trigger pre-fetch of remaining zone chunks (not yet loaded). Per Document 07 Section 3.2: use non-awaited `import()` calls for `memory-vault`, `timeline-tunnel`, `arena`, and `gateway` chunks at the end of `handleBootComplete`. This uses idle network capacity without blocking the Control Room render.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Unit tests (`src/boot/BootSequence.test.tsx`):

- Render with `sessionStorage` flag absent: boot sequence renders (lines appear over time in mocked timers via `vi.useFakeTimers()`).
- Render after `onComplete` fires: `markBootPlayed()` was called and sessionStorage was written (mock both).
- Safe Mode: `BootSequence` never reaches render — the `App.tsx` gate prevents it.
- `prefers-reduced-motion`: all lines appear immediately; `onComplete` fires after 500ms without scanline animation.

From Document 08 Section 5.7 — boot sequence UI tests:

- First session: boot sequence renders; control room hidden.
- Boot completion: `markBootPlayed()` called; control room visible.
- `sessionStorage` flag set: boot sequence skipped; control room visible immediately.
- Safe Mode: boot sequence skipped.

**Acceptance Criteria**

- Boot sequence plays on first session visit (sessionStorage flag absent)
- Boot sequence is skipped on second visit within the same session (sessionStorage flag present)
- Safe Mode skips boot sequence entirely — Control Room renders immediately
- `onComplete` fires after the full sequence OR after the skip button is clicked
- Scanline and line-reveal phases are skipped when `prefers-reduced-motion` is true
- No Framer Motion dependency — animation is CSS + setTimeout only
- All boot sequence UI tests from Document 08 Section 5.7 pass

**Rollback Strategy**
Replace `BootSequence.tsx` with the click-to-skip stub from T-013. Revert App.tsx Safe Mode addition.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The multi-phase animation timeline with `setInterval`, `setTimeout`, and cleanup on skip requires careful state management. The reduced-motion bypass adds a branching path that must be reasoned through carefully.

---

**Context Strategy**

Start new chat: Yes (Phase 2 begins — new context)

Required files:

- `src/core/hooks/useReducedMotion.ts`
- `src/core/hooks/useStore.ts`
- `src/core/design-system/typography/MonoText.tsx`
- `src/App.tsx` (current state — for the Safe Mode addition)

Architecture docs: `01_SYSTEM_ARCHITECTURE.md` (Section 10 — boot sequence integration), `04_STATE_AND_INTERACTION_ENGINE.md` (Section 8.1 — boot sequence skip logic), `08_TESTING_STRATEGY.md` (Section 5.7 — boot sequence UI tests)
Exclude: Zone documents, dynamic UI documents

---

### T-021 — Control Room Zone — Layout and Status Panel

**Phase:** 2 — Boot Sequence and Control Room
**Subsystem:** Zone — Control Room (Part 1 of 2)

**Description:**
Implement the Control Room zone layout and the system status panel. The Control Room is the landing zone — the first content the user sees after boot. This task covers the zone root component, mode-aware layout branching, the system identity display (name, version, role, stack), and the animated status badge. It does not yet include the metrics grid or CTA buttons (those are T-022).

**Scope Boundaries**

Files affected:

- `src/zones/control-room/ControlRoomZone.tsx` (implement from stub)
- `src/zones/control-room/components/StatusBadge.tsx` (new)
- `src/zones/control-room/components/SystemIdentity.tsx` (new)

Modules affected:

- Control Room zone only

NOT touching:

- Metrics grid (T-022)
- CTA buttons (T-022)
- Any other zone

**Implementation Steps**

1. `ControlRoomZone.tsx`:
   - Read `meta` from `useMeta()`. If `meta` is null (content not yet loaded), render a minimal skeleton state (empty `GlassPanel`).
   - Read `capabilities` from `useMode()`.
   - Apply zone entry animation: `motion.div` with `zoneEntryVariants` (opacity 0→1, y 12→0, 300ms ease-out). Skip if `useReducedMotion()` returns true.
   - Layout: full-height zone with a centered or top-anchored content column. Wrap primary content in `GlassPanel elevated bordered`.
   - Render `<SystemIdentity meta={meta} />` at the top of the panel.
   - Render `<StatusBadge />` below the identity.
   - Placeholder areas for `<MetricsGrid />` and `<CtaButtons />` (render `null` for now — filled in T-022).
   - Define `zoneEntryVariants` in `src/core/utils/animationVariants.ts` (new file — a shared Framer Motion variants object used by all zone root components).

2. `src/core/utils/animationVariants.ts` (new file — created in this task as it is first needed here):
   - Export `zoneEntryVariants`: `{ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }, exit: { opacity: 0, transition: { duration: 0.2, ease: "easeIn" } } }`.
   - This object is imported by every zone root component. Defining it once prevents drift between zone animations.

3. `SystemIdentity.tsx`:
   - Props: `meta: SystemMeta`.
   - Renders: `meta.name` (large heading, `SectionHeading`), `meta.version` as `"v{version}"` (small, `MonoText`, accent color), `meta.role` (body text, secondary color), `meta.stack` (body text, muted color).
   - Layout: left-aligned column or centered column — consistent with the OS dashboard aesthetic.

4. `StatusBadge.tsx`:
   - Renders the string `"GovindOS v{version} — STATUS: RUNNING"` in `MonoText`.
   - Implements the two-phase CSS animation from Document 06 Section 5.2:
     - Phase 1: Apply a CSS class `status-pulse` on mount. The class defines `animation: pulse-opacity 600ms ease-in-out 5` (5 cycles × 600ms = 3000ms total).
     - Phase 2: `useEffect` with a 3000ms `setTimeout` removes the `status-pulse` class. Badge settles at full opacity.
   - The pulse animation is a CSS keyframe: `@keyframes pulse-opacity { 0%, 100% { opacity: 1 } 50% { opacity: 0.7 } }`.
   - The `setTimeout` only manages class removal — it does not drive the animation.
   - `prefers-reduced-motion`: if true, `status-pulse` class is never applied. Badge renders at full opacity from mount.

**Data Impact**

Schema changes: None (reads from `SystemMeta` in content store).
Migration required: No.

**Test Plan**

UI interaction tests:

- Control Room renders with real `meta.json` data: name, role, version all present.
- Status badge is present in the DOM.
- Status badge has pulse class on mount; pulse class removed after 3000ms (use `vi.useFakeTimers()`).
- `prefers-reduced-motion`: pulse class never applied.
- `meta` null state: zone renders skeleton without crashing.

**Acceptance Criteria**

- Zone entry animation plays on mount (opacity 0→1, y 12→0)
- `zoneEntryVariants` is imported from shared utils — not redefined in the component
- Status badge pulse uses CSS keyframe animation, not JavaScript-driven opacity changes
- `setTimeout` in `StatusBadge` is cleaned up in `useEffect` return to prevent memory leaks
- Control Room renders real `meta.json` data (name, version, role, stack all visible)
- TypeScript: no `any` types in this zone

**Rollback Strategy**
Revert `ControlRoomZone.tsx` to the stub from T-015. Delete `StatusBadge.tsx`, `SystemIdentity.tsx`, and `animationVariants.ts`.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Well-specified component implementations. The CSS animation pattern is clearly defined in Document 06. No complex reasoning required.

---

**Context Strategy**

Start new chat: No (continue from T-020)

Required files:

- `src/core/hooks/useContent.ts`
- `src/core/hooks/useMode.ts`
- `src/core/hooks/useReducedMotion.ts`
- `src/core/design-system/components/GlassPanel.tsx`
- `src/core/design-system/typography/MonoText.tsx`
- `src/core/design-system/components/SectionHeading.tsx`
- `src/core/types/content.ts` (for `SystemMeta` type)

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 5.2 — status badge behavior)
Exclude: All other documents

---

### T-022 — Control Room Zone — Metrics Grid and CTA Buttons

**Phase:** 2 — Boot Sequence and Control Room
**Subsystem:** Zone — Control Room (Part 2 of 2)

**Description:**
Implement the metrics grid with `MetricBadge` components and tooltip behavior, and the two primary CTA buttons ("View Skills" and "Open Projects"). Wire CTA navigation to the store. This task completes the Control Room zone. Write all Control Room UI interaction tests from Document 08.

**Scope Boundaries**

Files affected:

- `src/zones/control-room/ControlRoomZone.tsx` (modify — add metrics grid and CTA placeholders)
- `src/zones/control-room/components/MetricsGrid.tsx` (new)
- `src/zones/control-room/components/CtaButtons.tsx` (new)
- `src/zones/control-room/ControlRoomZone.test.tsx` (new — UI interaction tests)

Modules affected:

- Control Room zone only

NOT touching:

- StatusBadge, SystemIdentity (complete)
- Any other zone

**Implementation Steps**

1. `MetricsGrid.tsx`:
   - Props: `metrics: MetricItem[]`.
   - Renders a CSS grid of `MetricBadge` components sourced from `metrics`.
   - Grid layout: 2–3 columns depending on metric count (use CSS `auto-fill` or fixed 3-column grid). Responsive: 2 columns on narrower viewports.
   - Each `MetricBadge` receives `value`, `label`, and `tooltip` from the `MetricItem`.
   - Apply `React.memo` — metrics never change after content load.
   - The tooltip behavior is already implemented in `MetricBadge` from T-007. No additional tooltip logic here.

2. `CtaButtons.tsx`:
   - Props: none (reads navigation from `useNavigate()`).
   - Renders two `ActionButton` components:
     - "View Skills" → `navigateTo("neural-graph")` on click. Primary variant.
     - "Open Projects" → `navigateTo("memory-vault")` on click. Secondary variant or both primary — document the visual choice.
   - Both buttons are `pointer-events: none` while `isTransitioning` (read from `useNavigate()`).
   - Layout: horizontal row, evenly spaced.

3. `ControlRoomZone.tsx` (modify):
   - Replace the placeholder `null` renders from T-021 with `<MetricsGrid metrics={meta.metrics} />` and `<CtaButtons />`.
   - Confirm the full zone layout is complete: SystemIdentity → StatusBadge → MetricsGrid → CtaButtons, all within the primary `GlassPanel`.

4. `ControlRoomZone.test.tsx`:
   - All test scenarios from Document 08 Section 5.4:
     - Metric hover: tooltip appears after 200ms delay.
     - Metric hover-out: tooltip dismissed.
     - "View Skills" CTA click: `navigateTo("neural-graph")` dispatched.
     - "Open Projects" CTA click: `navigateTo("memory-vault")` dispatched.
     - Status badge: pulse class present on mount; removed after 3s (fake timers).
   - Use a mocked store with `meta` populated with representative data.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI interaction tests from Document 08 Section 5.4 (all scenarios). See implementation step 4.

**Acceptance Criteria**

- `MetricsGrid` renders all items from `meta.metrics` with correct values, labels, and tooltips
- `MetricBadge` uses `React.memo` — does not re-render when unrelated store state changes
- Both CTA buttons dispatch correct `navigateTo` actions
- CTA buttons are `pointer-events: none` during active zone transition
- Tooltip appears after 200ms delay (not immediately on hover)
- All Control Room UI interaction tests pass (Document 08 Section 5.4)
- `npm run test` passes with zero failures

**Rollback Strategy**
Remove `MetricsGrid.tsx` and `CtaButtons.tsx`. Revert `ControlRoomZone.tsx` to T-021 state.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Component composition with clear specifications. Test writing is the dominant work. No complex reasoning needed.

---

**Context Strategy**

Start new chat: No (continue from T-021)

Required files:

- `src/zones/control-room/ControlRoomZone.tsx` (current state)
- `src/core/design-system/components/MetricBadge.tsx`
- `src/core/design-system/components/ActionButton.tsx`
- `src/core/hooks/useNavigate.ts`

Architecture docs: `08_TESTING_STRATEGY.md` (Section 5.4 — Control Room UI tests)
Exclude: All other documents

---

### T-023 — Guided Flow Prompt and Phase 2 Completion

**Phase:** 2 — Boot Sequence and Control Room
**Subsystem:** Zone — Control Room (Session UX)

**Description:**
Implement the "Start Here" guided flow prompt that appears on the first render of the Control Room when `guidedFlowDismissed` is false. The prompt is a subtle inline callout — not a modal — that surfaces a recommended navigation path for new visitors. Dismissing it sets the `guidedFlowDismissed` session flag. Run the full Phase 2 test suite to confirm all tests pass.

**Scope Boundaries**

Files affected:

- `src/zones/control-room/components/GuidedFlowPrompt.tsx` (new)
- `src/zones/control-room/ControlRoomZone.tsx` (modify — conditionally render the prompt)
- `src/zones/control-room/ControlRoomZone.test.tsx` (extend — add guided flow tests)

Modules affected:

- Control Room zone only

NOT touching:

- Session slice (already wired — `guidedFlowDismissed` and `dismissGuidedFlow` exist)
- Any other zone

**Implementation Steps**

1. `GuidedFlowPrompt.tsx`:
   - Props: `onDismiss: () => void`.
   - Renders a small inline callout panel (not a full-screen modal) with text: e.g., `"New here? Start with Skills →"` and a dismiss button (uses `DismissButton`).
   - Positioned as an inline element within the Control Room layout — below the CTA buttons, or as a subtle banner at the top.
   - Framer Motion entry: fade in (opacity 0→1, 250ms). Exit (via `AnimatePresence`): fade out (opacity 1→0, 150ms) on dismiss.
   - `prefers-reduced-motion`: skip entry/exit animation; prompt appears and disappears instantly.
   - The "Start with Skills →" link (if present) calls `navigateTo("neural-graph")` and simultaneously calls `onDismiss`.

2. `ControlRoomZone.tsx` (modify):
   - Read `guidedFlowDismissed` from the session slice via `useStore`.
   - Read `dismissGuidedFlow` action.
   - Conditionally render `<GuidedFlowPrompt onDismiss={dismissGuidedFlow} />` wrapped in `AnimatePresence` when `!guidedFlowDismissed`.

3. `ControlRoomZone.test.tsx` (extend):
   - Guided flow prompt renders when `guidedFlowDismissed: false`.
   - Guided flow prompt absent when `guidedFlowDismissed: true`.
   - Clicking dismiss: `dismissGuidedFlow` action dispatched; prompt removed from DOM.
   - Clicking "Start with Skills →": `navigateTo("neural-graph")` dispatched AND `dismissGuidedFlow` dispatched.

4. Phase 2 completion check: run `npm run test`. Zero failures required before proceeding to Phase 3.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI tests from implementation step 3. Full test suite (`npm run test`) must pass.

**Acceptance Criteria**

- Guided flow prompt visible on first Control Room render when `guidedFlowDismissed: false`
- Prompt absent on subsequent renders within the session after dismissal
- Dismissal sets `guidedFlowDismissed: true` in session slice
- `AnimatePresence` wraps the prompt for smooth exit animation
- `npm run test` passes with zero failures — Phase 2 complete

**Rollback Strategy**
Remove `GuidedFlowPrompt.tsx`. Revert `ControlRoomZone.tsx` to T-022 state.

**Estimated Complexity:** XS

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Small, well-specified component. Primary work is the session flag wiring and the `AnimatePresence` integration — both are established patterns by this point.

---

**Context Strategy**

Start new chat: No (continue from T-022)

Required files:

- `src/zones/control-room/ControlRoomZone.tsx` (current state)
- `src/core/store/index.ts` (for `guidedFlowDismissed` and `dismissGuidedFlow`)
- `src/core/design-system/components/DismissButton.tsx`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 8.2 — guided flow logic)
Exclude: All other documents

---

## PHASE 3 — Neural Graph Zone

**Objective:** Implement the highest-complexity zone. This phase surfaces the primary technical risk of the entire project — the D3/React rendering boundary — and resolves it definitively before simpler zones are built. The Neural Graph must reach 60fps during simulation before this phase is considered complete. There are no shortcuts on the profiling gate.

---

### T-024 — Neural Graph — Types, Hooks Scaffolding, and Zone Shell

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (Foundation)

**Description:**
Establish the Neural Graph zone's complete internal structure: types file, all four zone-private hooks as stubs, and the `NeuralGraphZone.tsx` root component with mode branching. The root component implements the mode fork: `"recruiter"` and `"safe"` modes render `GraphListFallback`; all other modes render `GraphCanvas` (stub for now). This task establishes the architectural skeleton that T-025 through T-029 will fill.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/types.ts` (new)
- `src/zones/neural-graph/NeuralGraphZone.tsx` (implement from stub)
- `src/zones/neural-graph/hooks/useForceSimulation.ts` (new — stub)
- `src/zones/neural-graph/hooks/useGraphInteraction.ts` (new — stub)
- `src/zones/neural-graph/hooks/useZoomPan.ts` (new — stub)
- `src/zones/neural-graph/hooks/useAdjacencyMap.ts` (new — stub)
- `src/zones/neural-graph/components/GraphCanvas.tsx` (new — stub: renders `<svg>` placeholder)
- `src/zones/neural-graph/components/GraphListFallback.tsx` (new — stub: renders "List Fallback")

Modules affected:

- Neural Graph zone only

NOT touching:

- Any other zone
- D3 imports (deferred to T-025)

**Implementation Steps**

1. `src/zones/neural-graph/types.ts`:
   - `SimulationNode`: extends `Skill` with D3 simulation fields: `x?: number`, `y?: number`, `vx?: number`, `vy?: number`, `fx?: number | null`, `fy?: number | null`, `index?: number`. (These are the fields D3's `forceSimulation` adds to nodes at runtime.)
   - `SimulationLink`: `{ source: string | SimulationNode; target: string | SimulationNode; weight: number; relationshipType: RelType }`. (D3 mutates `source` and `target` from ID strings to node object references during simulation init.)
   - `GraphInteractionState`: `{ hoveredNodeId: string | null; selectedNodeId: string | null }`.
   - Export all three types.

2. `NeuralGraphZone.tsx`:
   - Read `skills` and `edges` from `useSkills()` and `useEdges()`.
   - Read `capabilities` from `useMode()`.
   - Mode branch: if `capabilities.animationLevel === "none"` or `activeMode === "recruiter"` or `activeMode === "safe"` → render `<GraphListFallback skills={skills} />`. Otherwise → render `<GraphCanvas skills={skills} edges={edges} />`.
   - Apply zone entry animation via `zoneEntryVariants` (imported from `animationVariants.ts`). Skip if `useReducedMotion()`.
   - Empty state guard: if `skills.length === 0`, render an empty `GlassPanel` with a "No skill data available" message.

3. Hook stubs — each returns a minimal valid shape with a `// TODO: implement in T-0XX` comment:
   - `useForceSimulation.ts`: returns `{ svgRef: React.RefObject<SVGSVGElement>, nodes: SimulationNode[], isStable: boolean }`. Stub: `svgRef = useRef(null)`, `nodes = []`, `isStable = false`.
   - `useGraphInteraction.ts`: returns `GraphInteractionState` and setters. Stub: `hoveredNodeId = null`, `selectedNodeId = null`.
   - `useZoomPan.ts`: returns `{ zoomRef: React.RefObject<SVGGElement>, resetZoom: () => void }`. Stub: `zoomRef = useRef(null)`.
   - `useAdjacencyMap.ts`: returns `Map<string, Set<string>>`. Stub: returns empty `new Map()`.

4. `GraphCanvas.tsx` stub: renders `<svg style={{ width: '100%', height: '100%' }}><text x="50%" y="50%">Graph Canvas (stub)</text></svg>`.
5. `GraphListFallback.tsx` stub: renders `<div>Graph List Fallback (stub)</div>`.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification: Navigate to Neural Graph zone. In Explorer Mode: GraphCanvas stub visible. Switch to Recruiter Mode: GraphListFallback stub visible. Switch back: GraphCanvas stub visible.

**Acceptance Criteria**

- Mode branch in `NeuralGraphZone` correctly forks to fallback for recruiter and safe modes
- All four hook stubs export the correct return type shape (TypeScript validates this)
- `SimulationNode` and `SimulationLink` types correctly extend D3's expected simulation node/link shape
- `npm run build` produces no TypeScript errors in the neural-graph zone

**Rollback Strategy**
Revert `NeuralGraphZone.tsx` to the original stub from T-015. Delete all new files in the neural-graph zone directory.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The `SimulationNode` and `SimulationLink` types must correctly anticipate how D3 mutates the data structures at runtime. Getting these types wrong causes cascading issues in T-025–T-028.

---

**Context Strategy**

Start new chat: Yes (Phase 3 begins — Neural Graph is a fully distinct technical domain)

Required files:

- `src/core/types/content.ts` (for `Skill`, `SkillEdge`, `RelType`)
- `src/core/hooks/useContent.ts`
- `src/core/hooks/useMode.ts`
- `src/core/hooks/useReducedMotion.ts`
- `src/core/utils/animationVariants.ts`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 2 — skill graph rendering system overview), `05_APPLICATION_STRUCTURE.md` (Section 4.3 — neural graph zone directory detail)
Exclude: All other documents

---

### T-025 — Neural Graph — D3 Force Simulation Hook

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (D3 Core)

**Description:**
Implement `useForceSimulation.ts` — the hook that owns the complete D3 force simulation lifecycle. This is the most critical hook in the application. It initializes the D3 force simulation with nodes and links, manages the `requestAnimationFrame`-equivalent tick cycle, applies D3 selections to update SVG attributes during ticks, and cleans up on unmount. The React/D3 rendering boundary is enforced here: D3 mutates DOM attributes directly via selection, React state is never updated during ticks.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/hooks/useForceSimulation.ts` (implement from stub)

Modules affected:

- Neural Graph zone — D3 simulation hook only

NOT touching:

- `GraphCanvas.tsx` (wired in T-026)
- Any other hook
- Any React component state

**Implementation Steps**

1. `useForceSimulation.ts`:
   - **Parameters:** `skills: Skill[]`, `edges: SkillEdge[]`.
   - **Returns:** `{ svgRef: RefObject<SVGSVGElement>, nodes: SimulationNode[], isSimulationStable: boolean }`.
     - `svgRef`: attaches to the SVG root element. D3 uses this ref to attach the zoom behavior (in `useZoomPan`).
     - `nodes`: the `SimulationNode[]` array after D3 has assigned initial positions. This is a React state value — updated once when the simulation cools (alpha reaches threshold), not on every tick.
     - `isSimulationStable`: `false` while simulation is running; `true` after alpha threshold reached.

2. **Initialization (`useEffect` with `[skills, edges]` deps):**
   - Convert `skills` to `SimulationNode[]` by shallow-copying (D3 mutates the objects it receives — never pass the original content store objects directly).
   - Convert `edges` to `SimulationLink[]` by shallow-copying. Set `source` and `target` to the skill ID strings initially (D3 resolves them to node object references on simulation init).
   - Initialize `d3.forceSimulation(simulationNodes)` with:
     - `d3.forceLink(simulationLinks).id((d) => d.id).distance(80).strength(0.5)`
     - `d3.forceManyBody().strength((d) => d.type === "domain" ? -200 : -120)` — domain nodes repel more strongly
     - `d3.forceCenter(svgWidth / 2, svgHeight / 2)` — centered on SVG viewport midpoint. SVG dimensions read from `svgRef.current.getBoundingClientRect()` after mount.
     - `d3.forceCollide().radius((d) => nodeRadius(d.type) + 8)` — minimum separation. `nodeRadius`: language=18, concept=14, domain=20 per Document 06 Section 2.3.
   - Register the `tick` handler: `simulation.on("tick", handleTick)`.
   - Register the `end` handler: `simulation.on("end", () => setIsSimulationStable(true); setNodes([...simulation.nodes()]))`.

3. **Tick handler (`handleTick`):**
   - This function updates SVG element attributes directly via D3 selection. It does NOT call any React state setter.
   - Node position updates: `d3.selectAll(".graph-node").attr("cx", d => d.x).attr("cy", d => d.y)`.
   - Label position updates: `d3.selectAll(".graph-label").attr("x", d => d.x).attr("y", d => d.y + nodeRadius(d.type) + 6)`.
   - Edge position updates: `d3.selectAll(".graph-edge").attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y)`.
   - **Critical:** these D3 class selectors (`.graph-node`, `.graph-edge`, `.graph-label`) must match the class names applied to SVG elements by `GraphNode.tsx` and `GraphEdge.tsx` in T-026.

4. **Alpha decay and cooling:**
   - Default D3 alpha decay is acceptable. The simulation will cool and stop automatically after ~300 ticks.
   - Set `simulation.alphaDecay(0.02)` for a slightly faster settle (prevents excessively long unsettled states).
   - For low-tier devices (from performance tier detection flag in store), set `simulation.alphaDecay(0.05)` for faster settle.

5. **Cleanup (`useEffect` return):**
   - `simulation.stop()` — stops the simulation tick loop.
   - Remove all D3 event listeners: `simulation.on("tick", null).on("end", null)`.
   - This is critical — failure to clean up causes D3 to continue modifying a detached SVG after zone unmount.

6. **SVG dimension handling:**
   - Read SVG dimensions after mount via `svgRef.current.getBoundingClientRect()`. Use a `ResizeObserver` on the SVG element to re-initialize the `forceCenter` when the container resizes. On resize, update the center force and reheat the simulation slightly: `simulation.alpha(0.3).restart()`.

**Data Impact**

Schema changes: None (reads from content store; writes derived simulation node positions).
Migration required: No.

**Test Plan**

Manual verification via React Profiler:

- Mount the Neural Graph zone. Open React Profiler. Record for 5 seconds while the simulation runs. Confirm: zero React re-renders occur during the D3 tick cycle. Only two renders should appear: (1) initial mount, (2) after simulation stabilizes (`isSimulationStable` becomes true).

Unit tests (`useForceSimulation.test.ts`):

- Simulation initializes with the correct number of nodes (matches `skills.length`).
- Cleanup: `simulation.stop()` called on hook unmount (spy on D3 simulation instance).
- Empty `skills` array: hook initializes without crashing; `nodes` remains empty.

**Acceptance Criteria**

- React Profiler confirms zero React re-renders during D3 tick updates (this is the phase gate)
- Simulation cleanup is verified: `simulation.stop()` called on unmount (test or manual check)
- D3 class selectors in tick handler match the class names defined in T-026 (document the contract in a code comment)
- Low-tier device path sets increased `alphaDecay` (read from store performance flag)
- `useEffect` dependency array is `[skills, edges]` — simulation re-initializes if content changes

**Rollback Strategy**
Revert `useForceSimulation.ts` to the stub from T-024. No visual regressions in the zone (GraphCanvas stub still renders).

**Estimated Complexity:** L

---

**LLM Execution Assignment**

Recommended Model: Claude Opus
Recommended Mode: Standard

Reason: The D3/React rendering boundary is the highest-risk technical decision in the entire project. The tick handler's D3 selection approach — bypassing React reconciliation entirely — requires architectural precision. A mistake here produces either frame drops (if React is triggered) or memory leaks (if cleanup is wrong).

---

**Context Strategy**

Start new chat: Yes (D3 implementation is a distinct technical domain — clean context critical)

Required files:

- `src/zones/neural-graph/types.ts`
- `src/core/types/content.ts`
- `content/skills.json` (for representative data shape reference)
- `content/edges.json` (for representative data shape reference)

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 2.1 — rendering architecture, Section 2.2 — force simulation lifecycle), `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 4.3 — D3/React boundary), `02_TECH_DECISIONS.md` (Section 3 — graph rendering decision)
Exclude: All other documents

---

### T-026 — Neural Graph — SVG Node and Edge Rendering

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (SVG Rendering)

**Description:**
Implement `GraphCanvas.tsx`, `GraphNode.tsx`, and `GraphEdge.tsx`. React renders the SVG structure (node circles, edge lines, node labels) on mount. D3 manages position via the tick handler defined in T-025. React re-renders nodes only when interaction state changes (`hoveredNodeId`, `selectedNodeId`) — not during position ticks. Apply `React.memo` to `GraphNode` and `GraphEdge` to enforce this boundary. Implement the node entry animation (staggered CSS opacity transition) and edge entry animation.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/components/GraphCanvas.tsx` (implement from stub)
- `src/zones/neural-graph/components/GraphNode.tsx` (new)
- `src/zones/neural-graph/components/GraphEdge.tsx` (new)

Modules affected:

- Neural Graph zone — SVG rendering layer

NOT touching:

- `useForceSimulation` (complete)
- `useGraphInteraction`, `useZoomPan`, `useAdjacencyMap` (stubs — wired in subsequent tasks)
- `NodeDetailPanel` (T-028)

**Implementation Steps**

1. `GraphCanvas.tsx`:
   - Reads `skills` and `edges` from props (passed from `NeuralGraphZone`).
   - Calls `useForceSimulation(skills, edges)` → gets `svgRef`, `nodes`, `isSimulationStable`.
   - Calls `useGraphInteraction()` (stub) → gets `hoveredNodeId`, `selectedNodeId`, interaction handlers.
   - Calls `useZoomPan(svgRef)` (stub).
   - Calls `useAdjacencyMap(edges)` (stub) → gets adjacency map.
   - Renders:

     ```
     <svg ref={svgRef} style={{ width: '100%', height: '100%' }}>
       <g className="viewport">           // D3 zoom target
         <g className="edges">            // Edges rendered below nodes
           {edges.map(edge => <GraphEdge ... />)}
         </g>
         <g className="nodes">
           {nodes.map((node, i) => <GraphNode ... entryIndex={i} />)}
         </g>
       </g>
     </svg>
     ```

   - `GraphEdge` and `GraphNode` receive only non-positional props from React. Position is handled by D3 selections in the tick handler.

2. `GraphNode.tsx`:
   - Props: `node: SimulationNode`, `entryIndex: number`, `isHovered: boolean`, `isAdjacent: boolean`, `isDimmed: boolean`, `isSelected: boolean`, `onHover: (id: string | null) => void`, `onClick: (id: string) => void`.
   - Apply `React.memo` with a custom comparator that only re-renders when `isHovered`, `isAdjacent`, `isDimmed`, or `isSelected` changes. Position (`node.x`, `node.y`) is never in the comparator — position is managed by D3, not React.
   - Renders:
     - `<circle className="graph-node" data-id={node.id} r={nodeRadius(node.type)} fill={masteryToColor(node.mastery)} stroke={...} strokeWidth={...} opacity={...} />` — initial position `cx=0 cy=0` (D3 will update these immediately).
     - `<text className="graph-label" data-id={node.id} textAnchor="middle" fontSize="11" opacity={...}>` — the skill label.
   - Entry animation: `style={{ transition: 'opacity 400ms ease', transitionDelay:`${entryIndex * 20}ms`, opacity: 0 }}` on mount. After mount, opacity transitions to its interaction-state value. Implement via a `useEffect` that sets a local `hasEntered` state to `true` after a 1-frame delay (`requestAnimationFrame`), which switches the opacity from 0 to the base value.
   - `masteryToColor(mastery: number): string` — a helper function that maps 0–100 to a CSS color interpolation between `--color-accent-muted` (low mastery) and `--color-accent` (high mastery). Use D3's `d3.interpolate` or a manual linear interpolation against CSS custom property values.
   - `nodeRadius(type: SkillType): number` — returns 18 for `"language"`, 14 for `"concept"`, 20 for `"domain"`.
   - Mouse event handlers: `onMouseEnter → onHover(node.id)`, `onMouseLeave → onHover(null)`, `onClick → onClick(node.id)`.

3. `GraphEdge.tsx`:
   - Props: `edge: SimulationLink`, `isHighlighted: boolean`, `isDimmed: boolean`.
   - Apply `React.memo` — re-renders only when `isHighlighted` or `isDimmed` changes.
   - Renders: `<line className="graph-edge" data-source={edge.source} data-target={edge.target} stroke={...} strokeWidth={weightToWidth(edge.weight)} opacity={...} />`.
   - Initial `x1/y1/x2/y2` are 0 — D3 tick handler updates them immediately.
   - Entry animation: opacity starts at 0, transitions to base opacity after a `+200ms` delay from when nodes start appearing. CSS transition on opacity.
   - `weightToWidth(weight: number): number` — maps 0–1 linearly to 0.5–3px.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

Manual verification:

- Navigate to Neural Graph. Confirm nodes and edges render. Confirm staggered entry animation plays (nodes fade in sequentially, edges fade in after).
- React Profiler: confirm nodes do not re-render during D3 tick (only `GraphCanvas` and the simulation hook component re-render on stable event).

UI interaction tests (`GraphCanvas.test.tsx`):

- Graph renders with correct node count matching `skills` input.
- Each node has `className="graph-node"` and `data-id` attribute (required for D3 selection in tick handler).
- Each edge has `className="graph-edge"` (required for D3 selection).
- `React.memo` custom comparator: update `isHovered` for one node → only that node re-renders.

**Acceptance Criteria**

- Every `<circle>` has `className="graph-node"` — this class is the D3 selection target in the tick handler
- Every `<line>` has `className="graph-edge"` — same requirement
- `React.memo` prevents re-renders during D3 tick (verified via React Profiler)
- Node entry animation: staggered 20ms per node, opacity 0→base value
- Edge entry animation: all edges at opacity 0 initially; fade in after 200ms delay relative to node entry start
- `masteryToColor` and `nodeRadius` and `weightToWidth` are pure functions (no side effects)
- `npx tsc --noEmit` passes

**Rollback Strategy**
Revert `GraphCanvas.tsx` to stub from T-024. Delete `GraphNode.tsx` and `GraphEdge.tsx`.

**Estimated Complexity:** L

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The `React.memo` custom comparator that deliberately excludes position from the comparison is an unusual pattern that requires careful reasoning. The entry animation approach via `requestAnimationFrame` + CSS transition also needs precise implementation.

---

**Context Strategy**

Start new chat: No (continue from T-025 — same D3/React boundary context)

Required files:

- `src/zones/neural-graph/types.ts`
- `src/zones/neural-graph/hooks/useForceSimulation.ts` (complete)
- `src/zones/neural-graph/hooks/useGraphInteraction.ts` (stub — for interface reference)
- `src/core/types/content.ts`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Sections 2.3, 2.4, 2.5 — node rendering, edge rendering, entry animation), `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 4.2 — React.memo targets, Section 4.3 — D3/React boundary)
Exclude: All other documents

---

### T-027 — Neural Graph — Hover Interaction and Adjacency Highlighting

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (Interaction Layer)

**Description:**
Implement `useAdjacencyMap.ts` and `useGraphInteraction.ts`. Wire the hover interaction to the SVG rendering: hovering a node dims all non-adjacent nodes and edges, highlights the hovered node and its adjacent edges. The adjacency map is pre-computed at zone mount and used synchronously in the render pass — no graph traversal on each hover event.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/hooks/useAdjacencyMap.ts` (implement from stub)
- `src/zones/neural-graph/hooks/useGraphInteraction.ts` (implement from stub)
- `src/zones/neural-graph/components/GraphCanvas.tsx` (modify — wire interaction state to node/edge props)

Modules affected:

- Neural Graph zone — interaction layer

NOT touching:

- `useForceSimulation`, `GraphNode`, `GraphEdge` (complete)
- `NodeDetailPanel` (T-028)

**Implementation Steps**

1. `useAdjacencyMap.ts`:
   - **Parameter:** `edges: SkillEdge[]`.
   - **Returns:** `adjacencyMap: Map<string, Set<string>>`.
   - Computed once in a `useMemo` with `[edges]` dependency.
   - For each edge: `adjacencyMap.get(edge.source)?.add(edge.target)` and `adjacencyMap.get(edge.target)?.add(edge.source)` — edges are treated as undirected for adjacency purposes.
   - Returns the map. This is a pure memoized computation.

2. `useGraphInteraction.ts`:
   - **Parameters:** `adjacencyMap: Map<string, Set<string>>`.
   - **Returns:** `{ hoveredNodeId: string | null, selectedNodeId: string | null, handleNodeHover: (id: string | null) => void, handleNodeClick: (id: string) => void, handleSvgClick: () => void }`.
   - `handleNodeHover(id)`: sets `hoveredNodeId` to `id` (or `null` on mouse-leave). Local React state.
   - `handleNodeClick(id)`: if `selectedNodeId === id`, set to `null` (deselect). Otherwise set to `id`. Local React state. Calls `openOverlay` only when triggered from the "Test this skill" button (handled in `NodeDetailPanel`, not here).
   - `handleSvgClick()`: sets `selectedNodeId` to `null` (click SVG background closes the panel).

3. `GraphCanvas.tsx` (modify — wire interaction):
   - Pass `adjacencyMap` from `useAdjacencyMap` to `GraphCanvas`.
   - For each `GraphNode`, compute `isHovered`, `isAdjacent`, `isDimmed` from current interaction state:
     - `isHovered = node.id === hoveredNodeId`
     - `isAdjacent = hoveredNodeId !== null && adjacencyMap.get(hoveredNodeId)?.has(node.id) === true`
     - `isDimmed = hoveredNodeId !== null && !isHovered && !isAdjacent`
   - For each `GraphEdge`, compute `isHighlighted`, `isDimmed`:
     - `isHighlighted = edge.source === hoveredNodeId || edge.target === hoveredNodeId` (using resolved node IDs)
     - `isDimmed = hoveredNodeId !== null && !isHighlighted`
   - Pass `onHover={handleNodeHover}` and `onClick={handleNodeClick}` to each `GraphNode`.
   - Add `onClick={handleSvgClick}` to the SVG root (for background click deselect). Stop propagation in `GraphNode` click handler to prevent the SVG background click from firing simultaneously.

4. Verify `GraphNode.tsx` opacity computation uses the new boolean props:
   - `isHovered`: opacity 1.0, strong stroke (full accent, 2.5px)
   - `isAdjacent`: opacity 1.0, default stroke
   - `isDimmed`: opacity 0.15, default stroke
   - default (no hover active): opacity 1.0, default stroke (40% opacity accent, 1.5px)

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI interaction tests (`GraphCanvas.test.tsx`, extend from T-026):

- Hover a node: that node has full opacity; non-adjacent nodes have 0.15 opacity; adjacent nodes have 1.0 opacity.
- Hover end (mouse-leave): all nodes return to full opacity.
- All tests from Document 08 Section 5.2 (hover node, hover end, node click, click elsewhere).

Unit test (`useAdjacencyMap.test.ts`):

- Correct adjacency set for a simple 3-node, 2-edge graph.
- Undirected: adjacency is bidirectional.
- Disconnected nodes: present in map with empty set.
- Empty edge list: returns map with no adjacency entries.

**Acceptance Criteria**

- `useAdjacencyMap` is `useMemo`-computed — not recomputed on hover events (only on `edges` change)
- Hover interaction dims non-adjacent nodes to opacity 0.15 and adjacent edges to 0.8 opacity, per Document 06 Section 2.6
- Adjacent edge highlighting: edges with either endpoint as the hovered node are highlighted
- SVG background click clears `selectedNodeId`
- All Document 08 Section 5.2 hover interaction tests pass

**Rollback Strategy**
Revert `useGraphInteraction.ts` and `useAdjacencyMap.ts` to stubs from T-024. Revert `GraphCanvas.tsx` to T-026 state.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The interaction state derivation (isHovered, isAdjacent, isDimmed computed per node in render) must be efficient and correct. The click event propagation handling (node click vs SVG background click) requires careful reasoning.

---

**Context Strategy**

Start new chat: No (continue from T-026 — same Neural Graph session)

Required files:

- `src/zones/neural-graph/hooks/useGraphInteraction.ts` (current stub)
- `src/zones/neural-graph/hooks/useAdjacencyMap.ts` (current stub)
- `src/zones/neural-graph/components/GraphCanvas.tsx` (current state)
- `src/zones/neural-graph/components/GraphNode.tsx`
- `src/zones/neural-graph/components/GraphEdge.tsx`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 2.6 — hover interaction and adjacency highlighting), `08_TESTING_STRATEGY.md` (Section 5.2 — neural graph interaction tests)
Exclude: All other documents

---

### T-028 — Neural Graph — Node Detail Panel and Pan/Zoom

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (Detail Panel + Viewport)

**Description:**
Implement `NodeDetailPanel.tsx` — the skill metadata panel that appears when a node is clicked. Implement `useZoomPan.ts` — the D3 zoom behavior applied to the SVG viewport. These complete the Neural Graph's core interactive surface. The node detail panel surfaces the "Test this skill" quiz trigger, which opens the quiz modal overlay.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/components/NodeDetailPanel.tsx` (new)
- `src/zones/neural-graph/hooks/useZoomPan.ts` (implement from stub)
- `src/zones/neural-graph/components/GraphCanvas.tsx` (modify — render NodeDetailPanel, wire zoom)
- `src/zones/neural-graph/NeuralGraphZone.tsx` (modify — add `AnimatePresence` wrapper for panel)

Modules affected:

- Neural Graph zone — detail panel and viewport control

NOT touching:

- Quiz modal implementation (T-029 — stub trigger only here)
- GraphNode, GraphEdge (complete)

**Implementation Steps**

1. `useZoomPan.ts`:
   - **Parameters:** `svgRef: RefObject<SVGSVGElement>`, `viewportRef: RefObject<SVGGElement>` (the `<g className="viewport">` group that D3 will apply the zoom transform to).
   - **Returns:** `{ resetZoom: () => void }`.
   - In `useEffect([svgRef, viewportRef])`:
     - Create `d3.zoom().scaleExtent([0.4, 3]).on("zoom", handleZoom)`.
     - `handleZoom`: applies the D3 zoom event's transform to `viewportRef.current` via `d3.select(viewportRef.current).attr("transform", event.transform)`.
     - Attach zoom behavior to `d3.select(svgRef.current).call(zoomBehavior)`.
   - `resetZoom()`: calls `d3.select(svgRef.current).transition().duration(300).call(zoomBehavior.transform, d3.zoomIdentity)`.
   - Cleanup: `d3.select(svgRef.current).on(".zoom", null)` — removes the zoom event listeners.
   - Pan constraint: not implemented (pan is unconstrained per Document 06 Section 2.8).

2. `NodeDetailPanel.tsx`:
   - Props: `skill: Skill | null`, `projectCount: number`, `onClose: () => void`, `onQuizTrigger: () => void`.
   - If `skill` is null, returns null (panel is not rendered when no node is selected).
   - Layout: absolutely positioned within the zone's layout (not an overlay-plane element). Position: right side of the zone or bottom-left — document the choice. Sized to fit content.
   - Content (per Document 06 Section 2.7):
     - `skill.label` (large heading)
     - `skill.type` (small tag — capitalize first letter)
     - Depth label: `skill.depth` (e.g., "Expert")
     - `Confidence: {skill.confidence}%`
     - `skill.description`
     - Project count: `"{projectCount} associated project{s}" — link text that calls`navigateTo("memory-vault")` + `onClose()`. The Memory Vault filter hint is out of scope for this task — navigation to Memory Vault without filter is acceptable now; filter will be wired in T-033.
     - "Test this skill →" button: calls `onQuizTrigger()` (which in turn calls `openOverlay("quiz-modal")` from the store).
     - `DismissButton` in the corner: calls `onClose()`.
   - Framer Motion entry: `initial={{ opacity: 0, x: 12 }}`, `animate={{ opacity: 1, x: 0 }}`, `exit={{ opacity: 0, x: 12 }}`, 200ms. Wrapped in `AnimatePresence` at the call site.
   - `prefers-reduced-motion`: skip entry/exit animation.

3. `GraphCanvas.tsx` (modify):
   - Add `viewportRef` for the `<g className="viewport">` element. Pass both `svgRef` and `viewportRef` to `useZoomPan`.
   - Derive `selectedSkill: Skill | null` from `selectedNodeId` and `skills` array (lookup by ID).
   - Derive `projectCount`: `skills.find(s => s.id === selectedNodeId)?.projectRefs.length ?? 0`.
   - Pass `onQuizTrigger={() => openOverlay("quiz-modal")}` to `NodeDetailPanel`. Read `openOverlay` from the store.
   - Pass `onClose={() => handleNodeClick(selectedNodeId!)}` (deselects by re-clicking — same behavior as clicking the selected node).

4. `NeuralGraphZone.tsx` (modify):
   - Wrap `GraphCanvas` in `AnimatePresence` at the `NeuralGraphZone` level — this handles panel entry/exit animation via `AnimatePresence` propagating to the `NodeDetailPanel` inside `GraphCanvas`. (Note: `NodeDetailPanel` is inside `GraphCanvas`, which is inside the `AnimatePresence` boundary. The panel needs its own local `AnimatePresence` wrapper.)
   - Add a local `AnimatePresence` in `GraphCanvas.tsx` around `<NodeDetailPanel>` instead.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

UI interaction tests (extend `GraphCanvas.test.tsx`):

- Node click → `NodeDetailPanel` renders with correct skill data (label, type, depth, confidence, description).
- Click same node again → panel closes.
- Click SVG background → panel closes.
- Panel "Test this skill" button → `openOverlay("quiz-modal")` dispatched.
- Associated projects count renders correctly.
- DismissButton click → panel closes.

Pan/zoom: manual verification only (automated testing of D3 zoom behavior is not practical).

**Acceptance Criteria**

- `NodeDetailPanel` renders all skill metadata fields from Document 06 Section 2.7
- Panel entry/exit animation plays (opacity + x translate)
- Pan and zoom functional within 0.4× minimum and 3× maximum scale
- `resetZoom` function returns the viewport to identity transform with a 300ms transition
- D3 zoom cleanup removes event listeners on hook unmount
- All node detail panel UI interaction tests pass

**Rollback Strategy**
Delete `NodeDetailPanel.tsx`. Revert `GraphCanvas.tsx` to T-027 state. Revert `useZoomPan.ts` to stub.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: D3 zoom behavior cleanup, the `AnimatePresence` placement decision for the panel, and the `viewportRef` vs `svgRef` distinction require careful reasoning.

---

**Context Strategy**

Start new chat: No (continue from T-027 — same Neural Graph session)

Required files:

- `src/zones/neural-graph/components/GraphCanvas.tsx` (current state)
- `src/zones/neural-graph/hooks/useZoomPan.ts` (current stub)
- `src/zones/neural-graph/hooks/useGraphInteraction.ts` (complete)
- `src/core/design-system/components/DismissButton.tsx`
- `src/core/hooks/useNavigate.ts`
- `src/core/hooks/useStore.ts` (for `openOverlay`)

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 2.7 — node detail panel, Section 2.8 — pan and zoom)
Exclude: All other documents

---

### T-029 — Neural Graph — List Fallback, Quiz Modal Stub, and Phase 3 Validation

**Phase:** 3 — Neural Graph Zone
**Subsystem:** Zone — Neural Graph (Fallback + Validation)

**Description:**
Implement `GraphListFallback.tsx` — the full text-based skill list rendered in Recruiter and Safe modes. Implement the `QuizModal` overlay as a functional stub (correct overlay lifecycle, focus trap, dismiss behavior — placeholder question content acceptable). Run the Phase 3 validation gate: React Profiler confirms zero React re-renders during D3 ticks, frame rate ≥ 60fps.

**Scope Boundaries**

Files affected:

- `src/zones/neural-graph/components/GraphListFallback.tsx` (implement from stub)
- `src/overlays/quiz-modal/index.ts` (new)
- `src/overlays/quiz-modal/QuizModal.tsx` (new — functional stub)
- `src/overlays/OverlayPlane.tsx` (modify — render QuizModal when `overlayStack` contains `"quiz-modal"`)
- `src/zones/neural-graph/NeuralGraphZone.test.tsx` (new — full Neural Graph test suite)

Modules affected:

- Neural Graph zone fallback, quiz modal overlay, overlay plane

NOT touching:

- GraphCanvas, GraphNode, GraphEdge (complete)
- Full quiz modal question content (out of scope for this phase)

**Implementation Steps**

1. `GraphListFallback.tsx`:
   - Props: `skills: Skill[]`.
   - Groups skills by `type`: `"language"`, `"concept"`, `"domain"`. Renders three sections, each with a `SectionHeading` and a list of skill entries.
   - Each entry: `skill.label` (body text) + `skill.depth` label (small, muted). No D3, no SVG, no canvas.
   - Layout: clean vertical list in a `GlassPanel`. Scrollable if content overflows.
   - Apply zone entry animation (`zoneEntryVariants`) — the fallback is a full zone replacement, not a sub-panel.

2. `QuizModal.tsx` (functional stub):
   - Reads `overlayStack` from store. Renders when `overlayStack.includes("quiz-modal")`.
   - Overlay structure: semi-transparent backdrop covering the viewport (Layer 4 — overlay plane). Modal panel centered using flex. `GlassPanel elevated`.
   - Content stub: heading `"Skill Challenge"`, body text `"(Quiz content coming soon)"`, and a `DismissButton` that calls `closeOverlay("quiz-modal")`.
   - Implements `useFocusTrap` on the modal panel container — focus is trapped within the modal while it is open.
   - Framer Motion: entry `opacity 0 → 1, scale 0.95 → 1.0`, 200ms. Exit `opacity 1 → 0`, 150ms. Wrapped in `AnimatePresence`.
   - Backdrop click: calls `closeOverlay("quiz-modal")`.
   - `Escape` key: calls `closeOverlay("quiz-modal")`.

3. `OverlayPlane.tsx` (modify):
   - Read `overlayStack` from `useStore`.
   - Render `<QuizModal />` when `overlayStack.includes("quiz-modal")`. (Terminal overlay is added in Phase 4 — T-030.)
   - Terminal overlay mount: add `<TerminalOverlay />` placeholder (CSS `visibility: hidden` for now — structure exists but terminal not yet implemented).

4. `NeuralGraphZone.test.tsx` — complete Neural Graph test suite:
   - All test scenarios from Document 08 Section 5.2 (node click, hover, panel render, fallback render).
   - Quiz modal: opens on "Test this skill" click; focus trapped; closes on dismiss; closes on backdrop click; closes on Escape.
   - Fallback: skills grouped correctly by type in list view.
   - Mode switching: graph canvas → list fallback → graph canvas (mode toggle).

5. Phase 3 validation gate:
   - **React Profiler check:** Mount Neural Graph in Explorer Mode. Record in React Profiler for 5 seconds. Confirm zero re-renders during D3 tick. Document the profiler screenshot or recording result in a code comment in `useForceSimulation.ts`: `// PROFILER VALIDATED: zero React re-renders during tick. [date]`.
   - **Frame rate check:** In Chrome DevTools Performance tab, record 5 seconds of Neural Graph with simulation running. Confirm ≥ 60fps frame rate (no frames > 16.67ms).
   - Both checks must pass before proceeding to Phase 4. If either fails, debug before advancing.

**Data Impact**

Schema changes: None.
Migration required: No.

**Test Plan**

All scenarios from Document 08 Section 5.2. Full `npm run test` suite.

**Acceptance Criteria**

- `GraphListFallback` groups skills by all three `SkillType` values
- `QuizModal` stub: focus trapped on open, `Escape` closes, backdrop click closes
- `useFocusTrap` confirmed working in quiz modal (Tab key cycles within modal — manual Playwright-style check)
- `OverlayPlane` renders quiz modal when `overlayStack` contains `"quiz-modal"`
- **Phase 3 gate: React Profiler confirms zero React re-renders during D3 tick** — documented in code comment
- **Phase 3 gate: Chrome DevTools confirms ≥ 60fps during simulation** — documented
- All Neural Graph UI tests pass
- `npm run test` passes with zero failures

**Rollback Strategy**
Revert `GraphListFallback.tsx` to stub. Delete `QuizModal.tsx`. Revert `OverlayPlane.tsx` to null-rendering stub.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: `GraphListFallback` and `QuizModal` are well-specified components following established patterns. The primary work in this task is test writing and the manual validation gate — not complex implementation.

---

**Context Strategy**

Start new chat: No (continue from T-028 — same Neural Graph session for consistency)

Required files:

- `src/zones/neural-graph/NeuralGraphZone.tsx` (current state)
- `src/zones/neural-graph/components/GraphListFallback.tsx` (current stub)
- `src/overlays/OverlayPlane.tsx` (current state)
- `src/core/hooks/useFocusTrap.ts`
- `src/core/design-system/components/DismissButton.tsx`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 2.9 — recruiter/safe mode fallback), `08_TESTING_STRATEGY.md` (Section 5.2 — neural graph interaction tests)
Exclude: All other documents

---

## PHASE 4 — Terminal Overlay

**Objective:** Implement the Terminal overlay with the complete command registry, tab autocomplete, arrow-key command history navigation, and virtualized output history. The `goto` command provides a second navigation pathway independent of the NavBar. By phase end, the Terminal is a fully functional session-persistent command interface.

---

### T-030 — Terminal Overlay — Container and Persistent Mount

**Phase:** 4 — Terminal Overlay
**Subsystem:** Overlay — Terminal (Structure)

**Description:**
Implement `TerminalOverlay.tsx` — the floating overlay container. The terminal is a persistent React mount (never unmounted during the session) with `visibility` toggled by `isOpen` from the store. The persistent mount pattern preserves terminal history in DOM state without writing every keystroke to the global store. Wire the terminal open/close trigger to a keyboard shortcut and a HUD button. Update `OverlayPlane.tsx` to include the terminal.

**Scope Boundaries**

Files affected:

- `src/overlays/terminal/TerminalOverlay.tsx` (new)
- `src/overlays/terminal/index.ts` (new)
- `src/overlays/OverlayPlane.tsx` (modify — mount terminal persistently)
- `src/hud/HudPlane.tsx` (modify — add terminal toggle button)

Modules affected:

- Terminal overlay structure, overlay plane, HUD

NOT touching:

- `TerminalHistory`, `TerminalInput` (T-031)
- Command registry (T-032)

**Implementation Steps**

1. `TerminalOverlay.tsx`:
   - Read `isOpen` from terminal slice via `useStore`. Read `closeTerminal` action.
   - Apply `visibility: isOpen ? "visible" : "hidden"` and `pointer-events: isOpen ? "auto" : "none"` to the overlay root. Do NOT use `display: none` or conditional rendering — the component must stay mounted.
   - Layout: positioned in the lower 55% of the viewport. `position: fixed`, `bottom: 0`, `left: 0`, `right: 0`, `height: 55vh`. `GlassPanel elevated bordered` as the surface.
   - Header bar: monospace text `"govind@os:~$"` left-aligned + `DismissButton` right-aligned that calls `closeTerminal()`.
   - Backdrop: a semi-transparent `position: fixed, inset: 0` element rendered behind the terminal panel (lower z-index within the overlay plane). Clicking the backdrop calls `closeTerminal()`. The backdrop is only visible/interactive when `isOpen`.
   - Placeholder areas for `<TerminalHistory />` and `<TerminalInput />` (render `null` — filled in T-031).
   - Framer Motion: entry `y: "100%" → y: 0`, exit `y: 0 → y: "100%"`, 250ms ease-out/in. Applied to the panel element — not the persistent wrapper. Use `AnimatePresence`-style conditional approach: animate a child element based on `isOpen` using Framer Motion `animate` prop directly (not `AnimatePresence` — since the component stays mounted, animate the panel position reactively).
   - `useFocusTrap` applied when `isOpen`. On terminal open, focus moves to terminal input.

2. `OverlayPlane.tsx` (modify):
   - Mount `<TerminalOverlay />` always (persistent) — remove the `visibility: hidden` placeholder from T-029.
   - Keep `<QuizModal />` rendering from T-029 (conditional).

3. `HudPlane.tsx` (modify):
   - Add a terminal toggle button to the HUD. Label: `">"` or `"TERMINAL"`. On click: if terminal is open, `closeTerminal()`; if closed, `openTerminal()`. Read state from store.
   - Also register a global `keydown` listener in `HudPlane` for the `` ` `` (backtick) key: toggles terminal open/close. Cleanup the listener in `useEffect` return.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
UI tests: Terminal shows on open, hides on close. Backdrop click closes terminal. HUD button toggles terminal. Focus moves to terminal input on open (manual check).
From Document 08 Section 5.3: `click outside → terminal overlay hidden`.

**Acceptance Criteria**

- Terminal overlay is always mounted — never unmounted during the session
- `visibility` toggle (not `display: none`) preserves DOM state
- Backdrop click calls `closeTerminal()`
- HUD terminal toggle button functions
- Backtick keyboard shortcut toggles terminal
- `useFocusTrap` applied when `isOpen`
- Framer Motion slide animation plays on open/close

**Rollback Strategy**
Revert `OverlayPlane.tsx` and `HudPlane.tsx` to prior state. Delete `TerminalOverlay.tsx`.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The persistent-mount + visibility pattern with Framer Motion animation on the panel (not the wrapper) is an uncommon pattern that requires careful reasoning to avoid animation conflicts with the mount/unmount lifecycle.

---

**Context Strategy**

Start new chat: Yes (Phase 4 begins — Terminal is a distinct system)

Required files:

- `src/core/hooks/useFocusTrap.ts`
- `src/core/store/index.ts`
- `src/overlays/OverlayPlane.tsx` (current state)
- `src/hud/HudPlane.tsx` (current state)

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 2.3 — terminal slice), `05_APPLICATION_STRUCTURE.md` (Section 4.4 — terminal overlay directory detail)
Exclude: All other documents

---

### T-031 — Terminal — History Virtualization and Command Input

**Phase:** 4 — Terminal Overlay
**Subsystem:** Overlay — Terminal (Rendering)

**Description:**
Implement `TerminalHistory.tsx` with virtualized rendering and `TerminalInput.tsx` with controlled input, `Enter` submission, `Tab` autocomplete prefix, and arrow-key command history navigation. The input buffer is local state within `TerminalInput` — it is only written to the global store on command submission, not on every keystroke.

**Scope Boundaries**

Files affected:

- `src/overlays/terminal/components/TerminalHistory.tsx` (new)
- `src/overlays/terminal/components/TerminalEntry.tsx` (new)
- `src/overlays/terminal/components/TerminalInput.tsx` (new)
- `src/overlays/terminal/hooks/useAutocomplete.ts` (new)
- `src/overlays/terminal/hooks/useCommandDispatch.ts` (new)
- `src/overlays/terminal/TerminalOverlay.tsx` (modify — wire in TerminalHistory and TerminalInput)

Modules affected:

- Terminal overlay rendering layer

NOT touching:

- Command registry (T-032 — `useCommandDispatch` will call a stub resolver until T-032)

**Implementation Steps**

1. `TerminalEntry.tsx`:
   - Props: `entry: TerminalEntry`.
   - Apply `React.memo` — historical entries are immutable.
   - Renders `MonoText` with color-coded prefix: `>` (cyan/accent) for input, plain for output, red for error.
   - Multi-line output: split `entry.content` on `\n`, render each line in a separate `<div>`.

2. `TerminalHistory.tsx`:
   - Reads `history: TerminalEntry[]` from terminal slice via `useStore`.
   - Virtualization: maintains a scroll container with `overflow-y: auto`. Tracks scroll container height and entry heights using `ResizeObserver`. Renders only visible entries plus 5-entry overscan above and below.
   - Variable-height entries: measure on first render via `ResizeObserver` on each entry wrapper. Cache heights in a `Map<number, number>` keyed by entry `timestamp`.
   - Auto-scroll: on each new `history.length` increment, scroll to bottom — unless the user has manually scrolled up (track with a `isScrolledToBottom` local flag, reset when user scrolls to bottom manually).
   - Uses `React.memo` on `TerminalEntry` to prevent full-list re-renders on each new entry.

3. `useAutocomplete.ts`:
   - **Parameters:** `inputBuffer: string`.
   - **Returns:** `{ getSuggestions: () => string[], applyCompletion: (input: string) => string }`.
   - `getSuggestions`: prefix-matches `inputBuffer` against all keys and aliases in `commandRegistry`. Returns matching command names.
   - `applyCompletion(input)`: if exactly one match → return the full command name string. If multiple matches → return the original input (unchanged; the disambiguation list is appended to history by the caller). If no matches → return original input.

4. `useCommandDispatch.ts`:
   - **Returns:** `{ dispatch: (input: string) => void }`.
   - `dispatch(input)`: calls `submitCommand(input)` from the terminal slice. This is a thin wrapper — the command resolution logic lives in the terminal slice action (T-032 will replace the stub resolver with the real one).

5. `TerminalInput.tsx`:
   - Local state: `inputValue: string` (the live input — not written to store until submission).
   - Local state: `historyIndex: number` (current position in command history navigation, `-1` = no navigation active).
   - Key handlers:
     - `Enter`: call `dispatch(inputValue)`, reset `inputValue` to `""`, reset `historyIndex` to `-1`.
     - `Tab`: get suggestions via `useAutocomplete`. If one match: `setInputValue(applyCompletion(inputValue))`. If multiple matches: call `dispatch("")` with a formatted suggestions string — actually, directly append to history via `submitCommand` with the list — re-think: call `addSuggestionOutput(suggestions)` action (add a lightweight action to terminal slice that appends an output entry without treating it as a command). If no match: no-op.
     - `ArrowUp`: navigate history backwards. Increment `historyIndex`. Set `inputValue` to `history.filter(e => e.type === "input")[historyIndex]?.content ?? inputValue`.
     - `ArrowDown`: navigate history forwards. Decrement `historyIndex`. When `historyIndex === -1`, restore `inputValue` to `""`.
   - Render: `<input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} />` prefixed with `MonoText` `">_"` prompt character. Always focused when terminal is open (auto-focus via `useEffect` when `isOpen` changes to `true`).

6. `TerminalOverlay.tsx` (modify): replace null placeholders with `<TerminalHistory />` and `<TerminalInput />`.

**Data Impact**
Schema changes: Add `addSuggestionOutput(content: string)` action to `terminalSlice.ts` — appends an output-type entry without command processing.
Migration required: No.

**Test Plan**
From Document 08 Section 5.3 — all terminal UI tests:

- Arrow up/down navigates command history.
- Tab with one match: input replaced with full command.
- Tab with multiple matches: disambiguation list appended to history.
- `clear` command empties history; terminal remains visible.
- `exit` command hides terminal overlay.
- Click outside: terminal hidden.
Virtualization: render terminal with 100 history entries — confirm only ~15–25 DOM nodes present.

**Acceptance Criteria**

- `inputValue` is local state — not written to store on every keystroke
- `React.memo` on `TerminalEntry` — historical entries never re-render
- Virtualization: ≤ 30 DOM nodes for 100-entry history
- Arrow key history navigation works correctly in both directions
- Tab autocomplete: single match replaces input; multiple matches appends list to history
- All Document 08 Section 5.3 terminal UI tests pass

**Rollback Strategy**
Revert `TerminalOverlay.tsx` to T-030 state. Delete `TerminalHistory.tsx`, `TerminalEntry.tsx`, `TerminalInput.tsx`, and the two hooks.

**Estimated Complexity:** L

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: Variable-height entry virtualization with `ResizeObserver` and height caching is the highest-complexity sub-task. The auto-scroll suppression logic (user scrolled up detection) requires careful state management.

---

**Context Strategy**

Start new chat: No (continue from T-030)

Required files:

- `src/overlays/terminal/TerminalOverlay.tsx` (current state)
- `src/core/store/terminalSlice.ts` (for history and action shapes)
- `src/core/types/state.ts` (for `TerminalEntry` type)
- `src/core/design-system/typography/MonoText.tsx`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Sections 3.1–3.5 — terminal rendering system), `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 5.4 — terminal output performance), `08_TESTING_STRATEGY.md` (Section 5.3 — terminal UI tests)
Exclude: All other documents

---

### T-032 — Terminal — Command Registry Full Implementation

**Phase:** 4 — Terminal Overlay
**Subsystem:** Overlay — Terminal (Command Layer)

**Description:**
Implement the complete command registry in `commandRegistry.ts` — replacing the stub from T-012. Implement all eight commands specified in the product spec: `help`, `status`, `projects`, `skills`, `github`, `clear`, `exit`, `goto`. Wire the registry into the terminal slice's `submitCommand` action. The `goto` command is the only command with a global state side-effect: it calls `navigateTo` on the navigation slice.

**Scope Boundaries**

Files affected:

- `src/core/utils/commandRegistry.ts` (implement from stub)
- `src/core/store/terminalSlice.ts` (modify — replace stub resolver with real registry lookup)

Modules affected:

- Terminal command layer, terminal slice

NOT touching:

- Any terminal UI component (complete)
- Any zone component

**Implementation Steps**

1. `commandRegistry.ts`:
   - Define `CommandEntry` type: `{ name: string; aliases: string[]; description: string; resolver: (args: string[], content: ContentState, navigateTo: (id: ZoneId) => void) => string | Promise<string> }`.
   - Note: `navigateTo` is passed into the resolver as a parameter — the registry itself is stateless. The terminal slice injects it when invoking the resolver.
   - Implement all eight commands per Document 04 Section 6.3:
     - `help` / `?`: iterates all entries, returns formatted table of `name: description` pairs.
     - `status`: returns formatted string from `content.meta` — name, version, role, stack.
     - `projects` / `ls projects`: maps `content.projects` → `"{title}: {problem}"` lines.
     - `skills` / `ls skills`: groups `content.skills` by `type`, formats as `"{label} [{depth}]"` per group.
     - `github`: returns `content.meta.links.github` with a `"GitHub: "` prefix.
     - `clear` / `cls`: returns an empty string — the slice handles history clearing separately (special-cased in the slice, not via resolver output).
     - `exit` / `quit`: returns `"Closing terminal..."` — the slice handles `closeTerminal()` after this command.
     - `goto` / `cd`: validates `args[0]` against the `ZoneId` union. If valid: calls `navigateTo(args[0] as ZoneId)`, returns `"Navigating to {zoneName}..."`. If invalid: returns `"Unknown zone. Valid zones: {list}"`. If no arg: returns `"Usage: goto <zone-id>"`.
   - Export `commandRegistry: Record<string, CommandEntry>` and `resolveCommand(input: string): CommandEntry | null`.

2. `terminalSlice.ts` (modify — replace stub resolver):
   - In `submitCommand(input)`:
     - Trim and lowercase for command lookup.
     - Append input entry to history.
     - Look up command via `resolveCommand(input)`.
     - If not found: append error entry `"command not found — type 'help' for options"`.
     - If `clear`: call `clearHistory()` (clear the array, not append) then return.
     - If `exit`: append output entry, then call `closeTerminal()`.
     - Otherwise: invoke `resolver(args, contentState, navigateTo)`. If result is a string: append output entry. If Promise: append `"..."` placeholder, await, replace placeholder with result (use `timestamp` key to find the placeholder entry).
   - `contentState` is read from the store's content slice in the action body (Zustand allows `get()` for cross-slice reads in actions).
   - `navigateTo` is read from the navigation slice via `get().navigateTo`.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
From Document 08 Section 3.2 (command registry unit tests) and Section 6 (terminal command validation):

- Every command has a non-empty `description`.
- `help` output includes all command names.
- `status` output contains version and role strings.
- `projects` output contains each project title and problem line.
- `skills` output contains each skill label and depth.
- `goto` with valid zone ID: `navigateTo` called; confirmation returned.
- `goto` with invalid zone: error string; `navigateTo` not called.
- `goto` with no arg: usage error string.
- All edge cases from Document 08 Section 6.3 (empty input, whitespace, uppercase, extra whitespace).

**Acceptance Criteria**

- All eight commands registered with correct names and aliases
- `help` output includes every registered command (validated by test)
- `goto` with invalid zone ID does not call `navigateTo`
- `clear` empties history array (not appends an empty line)
- `exit` closes terminal after appending a confirmation output entry
- Command aliases all resolve to the same output as canonical names
- All Document 08 Sections 3.2 and 6 tests pass

**Rollback Strategy**
Revert `commandRegistry.ts` to empty stub. Revert `terminalSlice.ts` to stub resolver from T-006.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The cross-slice reads within `submitCommand` (accessing content and navigation from the terminal action), the `clear` and `exit` special cases, and the Promise-handling path require careful coordination.

---

**Context Strategy**

Start new chat: No (continue from T-031)

Required files:

- `src/core/utils/commandRegistry.ts` (current stub)
- `src/core/store/terminalSlice.ts` (current state)
- `src/core/store/index.ts` (for cross-slice `get()` pattern)
- `src/core/types/content.ts`
- `src/core/types/zones.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Sections 6.2, 6.3 — command registry structure and built-in commands), `08_TESTING_STRATEGY.md` (Sections 3.2, 6 — command registry tests and validation)
Exclude: All other documents

---

### T-033 — Terminal — Session Tests and Phase 4 Completion

**Phase:** 4 — Terminal Overlay
**Subsystem:** Overlay — Terminal (Integration + Validation)

**Description:**
Write all terminal session integration tests from Document 08 Section 4.4. Wire the Memory Vault filter hint from `NodeDetailPanel`'s "associated projects" link (deferred from T-028): when navigating to Memory Vault from the Node Detail Panel, a session-scoped filter hint is passed via a lightweight global state field that Memory Vault reads on mount. Run full Phase 4 test suite.

**Scope Boundaries**

Files affected:

- `src/core/store/navigationSlice.ts` (modify — add `zoneEntryHint: Record<string, unknown> | null` field and `setZoneEntryHint` action)
- `src/zones/neural-graph/components/NodeDetailPanel.tsx` (modify — pass filter hint on "X associated projects" click)
- `src/core/store/terminalSlice.test.ts` (new — session integration tests)

Modules affected:

- Navigation slice (minor extension), Neural Graph zone, terminal tests

NOT touching:

- Memory Vault zone (reads the hint in T-037)
- Command registry (complete)

**Implementation Steps**

1. `navigationSlice.ts` (modify):
   - Add `zoneEntryHint: Record<string, unknown> | null` to `NavigationState`. Default `null`.
   - Add `setZoneEntryHint(hint: Record<string, unknown> | null): void` action.
   - `navigateTo` clears `zoneEntryHint` to `null` after consuming (reset on each navigation so hints don't persist across unrelated navigations).

2. `NodeDetailPanel.tsx` (modify):
   - "X associated projects" link: call `setZoneEntryHint({ filterSkillId: skill.id })` then `navigateTo("memory-vault")`.

3. `terminalSlice.test.ts` — all scenarios from Document 08 Section 4.4:
   - Submit known command → history appended with input + output entries.
   - Submit unknown command → history appended with input + error entry.
   - `clear` → history array emptied; terminal remains open.
   - `exit` → terminal closed; history preserved.
   - Input buffer cleared after submit.
   - Session history preserved across zone transitions.

4. Run `npm run test`. All terminal tests, command registry tests, and session flag tests must pass before proceeding to Phase 5.

**Data Impact**
Schema changes: `NavigationState` gains `zoneEntryHint` field.
Migration required: No — existing tests use the initial state which defaults `zoneEntryHint: null`.

**Test Plan**
Document 08 Section 4.4 — all terminal session integration tests.
`npm run test` — full suite, zero failures.

**Acceptance Criteria**

- `zoneEntryHint` cleared on each `navigateTo` call
- "Associated projects" link in NodeDetailPanel sets hint before navigating
- All Document 08 Section 4.4 session tests pass
- `npm run test` passes with zero failures — Phase 4 complete

**Rollback Strategy**
Revert `navigationSlice.ts` `zoneEntryHint` addition. Revert `NodeDetailPanel.tsx` to T-028 state.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Primarily test writing with a minor state extension. The `zoneEntryHint` pattern is simple.

---

**Context Strategy**

Start new chat: No (continue from T-032)

Required files:

- `src/core/store/navigationSlice.ts` (current state)
- `src/core/store/terminalSlice.ts` (current state)
- `src/zones/neural-graph/components/NodeDetailPanel.tsx` (current state)

Architecture docs: `08_TESTING_STRATEGY.md` (Section 4.4 — terminal session tests)
Exclude: All other documents

---

## PHASE 5 — Memory Vault Zone

**Objective:** Implement the Memory Vault project cards, accordion expand/collapse system, architecture section toggle, Deep Mode override (all cards expanded), and demo link handling.

---

### T-034 — Memory Vault — Zone Shell and Project Card Collapsed State

**Phase:** 5 — Memory Vault Zone
**Subsystem:** Zone — Memory Vault (Foundation)

**Description:**
Implement `MemoryVaultZone.tsx` with mode-aware layout, the `expandedProjectId` accordion state, and `ProjectCard.tsx` in its collapsed state. The collapsed card shows: title, one-line problem statement, stack tags, and outcome metric. Card stagger entry animation on zone mount. Deep Mode renders all cards in expanded state — this task handles the Deep Mode structural branch.

**Scope Boundaries**

Files affected:

- `src/zones/memory-vault/MemoryVaultZone.tsx` (implement from stub)
- `src/zones/memory-vault/components/ProjectCard.tsx` (new)
- `src/zones/memory-vault/hooks/useProjectAccordion.ts` (new)

Modules affected:

- Memory Vault zone

NOT touching:

- `ProjectExpanded` content (T-035)
- Architecture toggle (T-035)
- `zoneEntryHint` filter reading (T-037)

**Implementation Steps**

1. `useProjectAccordion.ts`:
   - Returns `{ expandedProjectId: string | null, toggleProject: (id: string) => void }`.
   - `toggleProject(id)`: if `id === expandedProjectId`, set to `null` (collapse). Otherwise set to `id` (expand, collapsing the previous).
   - In Deep Mode (`activeMode === "deep"`): `expandedProjectId` is irrelevant — all cards render expanded. The hook still exists but its return value is ignored by the zone in Deep Mode.

2. `MemoryVaultZone.tsx`:
   - Read `projects` from `useProjects()`. Sort by `displayOrder` ascending (lowest first = highest priority rendered first).
   - Read `capabilities` and `activeMode` from `useMode()`.
   - Apply zone entry animation (`zoneEntryVariants`). Skip if `useReducedMotion()`.
   - Deep Mode branch: if `activeMode === "deep"`, render all `ProjectCard` components with `isExpanded: true` and `showDismiss: false`. No accordion state used.
   - Normal mode: use `useProjectAccordion`. Each card receives `isExpanded: expandedProjectId === project.id` and `onToggle: () => toggleProject(project.id)`.
   - Stagger entry animation: Framer Motion container with `staggerChildren: 0.04` (40ms per card). Only fires on initial zone mount — not on accordion state changes. Implement via a `variants` object on the card list container with `staggerChildren` in the `animate` variant.
   - Layout: vertical stack of cards in a scrollable container. `GlassPanel` wraps the zone.
   - Empty state guard: if `projects.length === 0`, render `"No project data available"` message.

3. `ProjectCard.tsx`:
   - Props: `project: Project`, `isExpanded: boolean`, `onToggle: () => void`, `showDismiss: boolean`.
   - Apply `layout` prop to the card's root `motion.div` (Framer Motion FLIP accordion layout animation).
   - Apply `layoutId={project.id}` — enables smooth reflow when accordion state changes.
   - Collapsed render (when `!isExpanded`):
     - `SectionHeading`: `project.title`
     - `BodyText muted`: `project.problem` (one-line)
     - Tag row: `project.stack.map(s => <Tag label={s} />)`
     - Outcome metric: `BodyText`: `project.outcome`
     - Click anywhere on the card: `onToggle()`.
   - Cursor `pointer` on collapsed card.
   - `ProjectExpanded` content (when `isExpanded`): rendered in T-035 — for now, `null` placeholder.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Manual: Navigate to Memory Vault. Cards render in `displayOrder` order. Click a card — it expands (stub). Click again — collapses. Switch to Deep Mode — all cards show expanded layout.

**Acceptance Criteria**

- Cards sorted by `displayOrder` (not insertion order from JSON)
- `layout` and `layoutId` applied to card root `motion.div`
- `staggerChildren` fires on initial mount only
- Deep Mode: all cards rendered with `isExpanded: true`, no dismiss button
- `useProjectAccordion` enforces single-card-expanded constraint

**Rollback Strategy**
Revert `MemoryVaultZone.tsx` to stub from T-015. Delete `ProjectCard.tsx` and `useProjectAccordion.ts`.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: Framer Motion `layout` + `layoutId` + `staggerChildren` interaction has subtle constraints. The stagger-only-on-mount requirement needs deliberate implementation.

---

**Context Strategy**

Start new chat: Yes (Phase 5 — Memory Vault is a distinct zone context)

Required files:

- `src/core/hooks/useContent.ts`
- `src/core/hooks/useMode.ts`
- `src/core/hooks/useReducedMotion.ts`
- `src/core/utils/animationVariants.ts`
- `src/core/design-system/components/GlassPanel.tsx`
- `src/core/design-system/components/Tag.tsx`
- `src/core/types/content.ts`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Sections 4.1, 4.2, 4.4 — accordion behavior, animation, card render states), `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 5.5 — Memory Vault layout animation)
Exclude: All other documents

---

### T-035 — Memory Vault — Expanded Card, Architecture Toggle, and Demo Link

**Phase:** 5 — Memory Vault Zone
**Subsystem:** Zone — Memory Vault (Expanded State)

**Description:**
Implement `ProjectExpanded.tsx` (the expanded card detail content), `useArchitectureToggle.ts`, and the demo link handling. Wire `ProjectExpanded` into `ProjectCard`. Write the complete Memory Vault UI interaction test suite.

**Scope Boundaries**

Files affected:

- `src/zones/memory-vault/components/ProjectExpanded.tsx` (new)
- `src/zones/memory-vault/hooks/useArchitectureToggle.ts` (new)
- `src/zones/memory-vault/components/ProjectCard.tsx` (modify — wire expanded state)
- `src/zones/memory-vault/MemoryVaultZone.test.tsx` (new — full test suite)

Modules affected:

- Memory Vault zone — expanded state

NOT touching:

- `useProjectAccordion` (complete)
- `zoneEntryHint` filter (T-037)

**Implementation Steps**

1. `useArchitectureToggle.ts`:
   - Per-card hook: `{ architectureVisible: boolean, toggleArchitecture: () => void }`.
   - Local state — independent of accordion state.
   - Resets to `false` when the card collapses (via `useEffect` with `isExpanded` dep: if `!isExpanded`, reset to `false`).

2. `ProjectExpanded.tsx`:
   - Props: `project: Project`, `architectureVisible: boolean`, `onToggleArchitecture: () => void`, `onDismiss: () => void`, `showDismiss: boolean`.
   - Framer Motion entry: `initial={{ opacity: 0, y: 8 }}`, `animate={{ opacity: 1, y: 0 }}`, 200ms. Exit: `opacity: 0`, 150ms. Wrapped in `AnimatePresence` at the call site in `ProjectCard`.
   - Renders (per Document 06 Section 4.4 expanded state):
     - `project.problemFull` (full problem description)
     - Constraints list: `project.constraints.map(c => <li>{c}</li>)`
     - Tradeoffs: each `Tradeoff` as a three-line block: decision / rationale / consequence.
     - Architecture section (conditionally rendered based on `architectureVisible`):
       - Toggle button: `"Architecture ▾"` / `"Architecture ▴"`. On click: `onToggleArchitecture()`.
       - Content: `project.architecture` text in `BodyText`. Animated with Framer Motion `AnimatePresence` + fade+translate.
     - `project.outcomeFull`
     - Demo link: only rendered when `project.demoUrl !== null`. `<a href={project.demoUrl} target="_blank" rel="noopener noreferrer">View Demo →</a>`. Accent color, underlined.
     - `DismissButton` calling `onDismiss()` — only rendered when `showDismiss` is true (hidden in Deep Mode).

3. `ProjectCard.tsx` (modify):
   - Add `useArchitectureToggle(isExpanded)` inside the component.
   - Wrap `ProjectExpanded` in `AnimatePresence`. Render when `isExpanded`.
   - Pass `onDismiss={() => onToggle()}` (same as the toggle — collapses the card).

4. `MemoryVaultZone.test.tsx` — all scenarios from Document 08 Section 5.1:
   - Expand card → expanded content visible.
   - Collapse card (click expanded card) → collapsed.
   - Dismiss via `×` → collapses.
   - Only one card expanded at a time.
   - Architecture toggle independent of accordion state.
   - Deep Mode: all expanded, `×` buttons absent.
   - `demoUrl: null` → no link rendered.
   - `demoUrl` present → link with `target="_blank"` and `rel="noopener noreferrer"`.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
All Document 08 Section 5.1 scenarios. `npm run test` full suite.

**Acceptance Criteria**

- Architecture section toggle state is independent of accordion state (per Document 06 Section 4.3)
- Architecture section resets to hidden when card collapses
- Demo link absent when `demoUrl: null` — no empty `href` rendered
- `AnimatePresence` wraps `ProjectExpanded` for smooth exit
- All Document 08 Section 5.1 Memory Vault tests pass
- `npm run test` passes with zero failures

**Rollback Strategy**
Revert `ProjectCard.tsx` to T-034 state. Delete `ProjectExpanded.tsx` and `useArchitectureToggle.ts`.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Well-specified component with established patterns. The `AnimatePresence` usage and architecture toggle are straightforward given prior work on the same patterns in other zones.

---

**Context Strategy**

Start new chat: No (continue from T-034)

Required files:

- `src/zones/memory-vault/components/ProjectCard.tsx` (current state)
- `src/core/design-system/components/DismissButton.tsx`
- `src/core/types/content.ts`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Sections 4.3, 4.4, 4.5 — architecture toggle, card render states, demo link), `08_TESTING_STRATEGY.md` (Section 5.1 — Memory Vault accordion tests)
Exclude: All other documents

---

## PHASE 6 — Timeline Tunnel and Arena Zones

**Objective:** Implement the Timeline Tunnel horizontal-scroll zone and the Arena competitive programming statistics zone. Both are content-display-primary zones with defined interaction surfaces.

---

### T-036 — Timeline Tunnel — Zone Implementation

**Phase:** 6 — Timeline Tunnel and Arena
**Subsystem:** Zone — Timeline Tunnel

**Description:**
Implement the complete Timeline Tunnel zone: horizontal scroll layout (Explorer/Deep mode), vertical stack fallback (Recruiter/Safe mode), entry expand/collapse, and skill tag resolution for the `technologies` field display.

**Scope Boundaries**

Files affected:

- `src/zones/timeline-tunnel/TimelineTunnelZone.tsx` (implement from stub)
- `src/zones/timeline-tunnel/components/TimelineEntry.tsx` (new)
- `src/zones/timeline-tunnel/components/TimelineEntryExpanded.tsx` (new)
- `src/zones/timeline-tunnel/hooks/useTimelineExpansion.ts` (new)
- `src/zones/timeline-tunnel/TimelineTunnelZone.test.tsx` (new)

Modules affected:

- Timeline Tunnel zone only

NOT touching:

- Any other zone
- Skill resolution (uses `idResolver` from core utils — already implemented)

**Implementation Steps**

1. `useTimelineExpansion.ts`:
   - Same accordion pattern as Memory Vault: `{ expandedEntryId: string | null, toggleEntry: (id: string) => void }`.
   - Unlike Memory Vault, Timeline does not have a Deep Mode "all expanded" override — all modes use the same accordion behavior.

2. `TimelineTunnelZone.tsx`:
   - Read `timeline` from `useTimeline()`. Pre-sorted descending by `startDate` in the content loader — render in array order.
   - Read `skills` from `useSkills()` (for technology label resolution).
   - Mode branch: Explorer and Deep modes → horizontal scroll layout. Recruiter and Safe modes → vertical stack.
   - Horizontal scroll: a `<div>` with `overflow-x: auto`, `display: flex`, `flex-direction: row`, `gap: 24px`, `padding: 24px`. Each entry card has a fixed width (e.g., 320px). Custom scroll behavior: snap to card boundaries via `scroll-snap-type: x mandatory` on the container and `scroll-snap-align: start` on each card.
   - Apply zone entry animation. Empty state guard.

3. `TimelineEntry.tsx` (collapsed):
   - Props: `entry: TimelineEntry`, `isExpanded: boolean`, `onToggle: () => void`, `skills: Skill[]`.
   - Collapsed: `entry.organization`, `entry.role`, duration display (`entry.duration`), `entry.isCurrent ? "Present" : entry.endDate` formatted label. `entry.type` as a small badge ("Work" or "Education").
   - Framer Motion `layout` prop on card root (smooth height animation on expand).

4. `TimelineEntryExpanded.tsx`:
   - Renders: highlights list (`entry.highlights`), impact list (`entry.impact`), technology tags resolved via `resolveSkillLabel(id, skills)` from `idResolver`. If a skill ID doesn't resolve, display the raw ID as fallback.
   - Framer Motion entry: fade + y translate, 200ms. `AnimatePresence` at call site in `TimelineEntry`.

5. Test suite (`TimelineTunnelZone.test.tsx`):
   - Entries rendered in correct date order.
   - Expand/collapse functions correctly.
   - Recruiter mode: vertical stack layout rendered.
   - Technology IDs resolved to labels via `idResolver`.
   - `isCurrent: true` entry shows "Present" label.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Test suite from implementation step 5. Manual: horizontal scroll in Explorer mode; vertical stack in Recruiter mode.

**Acceptance Criteria**

- Horizontal scroll with CSS snap in Explorer/Deep modes
- Vertical stack in Recruiter/Safe modes
- Expand/collapse with Framer Motion `layout` animation
- Technology IDs resolved to display labels
- `isCurrent` entry shows "Present" (not the `endDate` value)
- All timeline zone tests pass

**Rollback Strategy**
Revert `TimelineTunnelZone.tsx` to stub. Delete new components and hook.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: CSS scroll snap with the Framer Motion `layout` animation inside a scrolling container can interact unexpectedly and requires careful reasoning.

---

**Context Strategy**

Start new chat: Yes (Phase 6 — new zone, clean context)

Required files:

- `src/core/hooks/useContent.ts`
- `src/core/hooks/useMode.ts`
- `src/core/utils/idResolver.ts`
- `src/core/types/content.ts`
- `src/core/utils/animationVariants.ts`

Architecture docs: `06_DYNAMIC_UI_SYSTEMS.md` (Section 4 — for Framer Motion `layout` pattern reference), `04_STATE_AND_INTERACTION_ENGINE.md` (Section 7 — mode behavior table for Timeline layout rules)
Exclude: All other documents

---

### T-037 — Arena Zone and Memory Vault Filter Hint

**Phase:** 6 — Timeline Tunnel and Arena
**Subsystem:** Zone — Arena + Memory Vault Integration

**Description:**
Implement the complete Arena zone: platform ratings, difficulty breakdown chart, solved patterns with click-to-surface problem refs, featured problem deep-dive toggle, and certification groups. Also implement Memory Vault's reading of the `zoneEntryHint` from T-033 to visually highlight a skill-filtered view on entry.

**Scope Boundaries**

Files affected:

- `src/zones/arena/ArenaZone.tsx` (implement from stub)
- `src/zones/arena/components/PlatformRatings.tsx` (new)
- `src/zones/arena/components/DifficultyChart.tsx` (new)
- `src/zones/arena/components/SolvedPatterns.tsx` (new)
- `src/zones/arena/components/FeaturedProblem.tsx` (new)
- `src/zones/arena/components/CertificationGroups.tsx` (new)
- `src/zones/arena/ArenaZone.test.tsx` (new)
- `src/zones/memory-vault/MemoryVaultZone.tsx` (modify — read `zoneEntryHint`)

Modules affected:

- Arena zone (full), Memory Vault (minor hint integration)

NOT touching:

- Memory Vault accordion behavior (complete)

**Implementation Steps**

1. `ArenaZone.tsx`:
   - Read `arena` from `useArena()`. Null guard.
   - Layout: sectioned panel with `GlassPanel` sections for each category. Scrollable.
   - Renders all five sub-components.
   - Apply zone entry animation.

2. `PlatformRatings.tsx`: renders each `PlatformRating` as a card showing `platform`, `rating` (large, accent), `context`, and a link to `profileUrl` with correct `rel` attributes.

3. `DifficultyChart.tsx`:
   - Renders `arena.difficultyBreakdown` as a horizontal bar chart using pure CSS (no D3 — bars are `<div>` elements with `width` proportional to `percentage`).
   - Hover each band: show `count` value in a tooltip (same pattern as `MetricBadge` tooltip — 200ms delay, local state).
   - Bar colors: different shade per difficulty label (Easy=green-tinted, Medium=yellow-tinted, Hard=red-tinted using accent color variations or muted colors).

4. `SolvedPatterns.tsx`:
   - Renders a list of `SolvedPattern` entries. Each shows `pattern` name and `count`.
   - Click a pattern: reveal `problemRefs` as an inline list below the entry. Local state `expandedPatternId: string | null` (same accordion pattern).

5. `FeaturedProblem.tsx`:
   - Hidden by default. Toggle button: "Deep Dive →" / "Collapse ◀". When visible, renders `title`, `platform`, `difficulty`, `problemStatement`, `approach`, `complexity.time` and `complexity.space`, and `keyInsight` in formatted blocks.
   - `AnimatePresence` on the content. Framer Motion fade+translate entry.

6. `CertificationGroups.tsx`: groups `certifications` by `domain`. Each group: `SectionHeading` for domain name, then list of `Certification` entries showing `title`, `issuer`, `focus`, `year`. Never renders as a flat list.

7. `MemoryVaultZone.tsx` (modify):
   - On mount, read `zoneEntryHint` from navigation slice. If `hint?.filterSkillId` is set, visually highlight cards that include that `skillId` in their `skillRefs` (e.g., a subtle accent border on matching cards). Call `setZoneEntryHint(null)` immediately after reading to clear the hint. Local state `highlightedSkillId: string | null`.

8. `ArenaZone.test.tsx`: difficulty chart hover shows count; pattern click reveals problem refs; deep-dive toggle shows/hides featured problem; certifications always grouped by domain (never flat list).

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Document 08 guidance + implementation step 8 test scenarios.

**Acceptance Criteria**

- Difficulty chart hover shows count per band after 200ms delay
- Pattern click reveals `problemRefs` list; second click collapses
- Featured problem toggle shows/hides content with animation
- Certifications always rendered in domain groups — no flat list
- Memory Vault reads and clears `zoneEntryHint` on mount
- All Arena tests pass; Memory Vault hint integration manual-verified

**Rollback Strategy**
Revert `ArenaZone.tsx` to stub. Delete arena components. Revert `MemoryVaultZone.tsx` to T-035 state.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Well-specified components following established patterns. The difficulty chart is CSS-only. No novel technical challenges.

---

**Context Strategy**

Start new chat: No (continue from T-036)

Required files:

- `src/core/hooks/useContent.ts`
- `src/core/hooks/useMode.ts`
- `src/core/store/navigationSlice.ts` (for `zoneEntryHint`)
- `src/core/types/content.ts`
- `src/zones/memory-vault/MemoryVaultZone.tsx` (current state)

Architecture docs: `03_DATA_MODEL_AND_CONTENT_STRUCTURE.md` (Section 6 — Arena profile schema), `06_DYNAMIC_UI_SYSTEMS.md` (Section 5 — dashboard metrics rendering, for tooltip pattern reference)
Exclude: All other documents

---

## PHASE 7 — Gateway Zone and Game Layer

**Objective:** Implement the Gateway zone (all external links, email copy, resume download) and the complete game layer system (HUD, zone unlock notifications, challenge prompts, MiniMap).

---

### T-038 — Gateway Zone

**Phase:** 7 — Gateway Zone and Game Layer
**Subsystem:** Zone — Gateway

**Description:**
Implement the Gateway zone with all external link dispatch, clipboard copy for email, resume PDF download trigger, and correct `rel` attributes on all external links. Write all Gateway UI interaction tests from Document 08.

**Scope Boundaries**

Files affected:

- `src/zones/gateway/GatewayZone.tsx` (implement from stub)
- `src/zones/gateway/GatewayZone.test.tsx` (new)

Modules affected:

- Gateway zone only

NOT touching:

- Any other zone
- Game layer (T-039)

**Implementation Steps**

1. `GatewayZone.tsx`:
   - Read `meta` from `useMeta()`. Null guard.
   - Apply zone entry animation.
   - Layout: centered panel in a `GlassPanel`. Three sections: Social Links, Contact, Resume.
   - **GitHub link**: `<a href={meta.links.github} target="_blank" rel="noopener noreferrer">GitHub →</a>`.
   - **LinkedIn link**: `<a href={meta.links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn →</a>`.
   - **Email contact**:
     - If `meta.contact.preferCopy === true`: `<button onClick={handleEmailCopy}>Copy Email</button>`. `handleEmailCopy` calls `navigator.clipboard.writeText(meta.contact.email)`. On success, briefly show a "Copied!" feedback label (local state, auto-dismiss after 2000ms via `setTimeout`).
     - If `meta.contact.preferCopy === false`: `<a href={\`mailto:${meta.contact.email}\`}>Email →</a>`.
   - **Resume download**: `<a href={meta.resumeAssetPath} download>Download Resume (PDF)</a>`. The `download` attribute triggers a file download. No `target="_blank"` — the `download` attribute handles the behavior.
   - All external `<a>` elements: `rel="noopener noreferrer"`.

2. `GatewayZone.test.tsx` — all scenarios from Document 08 Section 5.6:
   - GitHub link: opens new tab; correct `rel`.
   - LinkedIn link: opens new tab; correct `rel`.
   - Resume download: `download` attribute present on link.
   - `preferCopy: true`: clipboard write triggered on click.
   - `preferCopy: false`: `mailto:` href present.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
All Document 08 Section 5.6 scenarios.

**Acceptance Criteria**

- All external links have `rel="noopener noreferrer"`
- `preferCopy: true` triggers `navigator.clipboard.writeText` (mock in tests)
- `preferCopy: false` renders `mailto:` link (not a button)
- Resume link has `download` attribute (no `target="_blank"`)
- "Copied!" feedback appears and auto-dismisses after 2s
- All Document 08 Section 5.6 tests pass

**Rollback Strategy**
Revert `GatewayZone.tsx` to stub. Delete test file.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Low-complexity zone. Mainly link composition and clipboard API usage.

---

**Context Strategy**

Start new chat: Yes (Phase 7 — clean context)

Required files:

- `src/core/hooks/useContent.ts`
- `src/core/types/content.ts`
- `src/core/utils/animationVariants.ts`

Architecture docs: `08_TESTING_STRATEGY.md` (Section 5.6 — Gateway zone tests)
Exclude: All other documents

---

### T-039 — Game Layer — Zone Unlock, HUD, and Notifications

**Phase:** 7 — Gateway Zone and Game Layer
**Subsystem:** Game Layer — Core System

**Description:**
Implement the game layer: wire zone unlock detection into the navigation flow, implement `GameHud.tsx` with exploration level display, implement `ZoneUnlockNotification.tsx` as an auto-dismissing toast, and mount both in `HudPlane`. The game layer is active only in Explorer Mode.

**Scope Boundaries**

Files affected:

- `src/hud/game-hud/GameHud.tsx` (implement from stub placeholder)
- `src/hud/game-hud/ExplorationLevel.tsx` (new)
- `src/hud/game-hud/ZoneUnlockNotification.tsx` (new)
- `src/hud/HudPlane.tsx` (modify — mount GameHud conditionally)
- `src/core/store/navigationSlice.ts` (modify — add game layer side-effect to `navigateTo`)

Modules affected:

- HUD game layer, navigation slice (side-effect addition)

NOT touching:

- Zone challenge prompts (T-040)
- MiniMap (T-040)

**Implementation Steps**

1. `navigationSlice.ts` (modify):
   - In `navigateTo(zoneId)` action body: after updating `activeZone`, check if `activeMode === "explorer"` AND `zoneId` is not in `gameState.unlockedZones`. If so, call `unlockZone(zoneId)` (cross-slice action via `get().unlockZone`).
   - This is the sole game layer integration point in the navigation slice.

2. `ExplorationLevel.tsx`:
   - Props: `level: number`, `unlockedCount: number`, `totalZones: number`.
   - Renders: `"EXPLORATION LVL {level}"` in `MonoText`. A progress indicator: `"{unlockedCount} / {totalZones} zones"`.
   - Small, non-intrusive. No animation — static display.

3. `ZoneUnlockNotification.tsx`:
   - Driven by `gameState.unlockedZones` changes. When a new zone is added to `unlockedZones`, trigger a notification.
   - Implementation: watch `unlockedZones.length` in a `useEffect`. On increment, set local state `notificationZoneId` to the latest entry. After 3000ms `setTimeout`, clear `notificationZoneId` to `null`.
   - Render: `AnimatePresence`. When `notificationZoneId` is not null: a toast panel slides in from top-right. Content: `"{ZoneName} — Unlocked"` in `MonoText`. Framer Motion: `initial={{ opacity: 0, x: 40 }}`, `animate={{ opacity: 1, x: 0 }}`, exit `opacity 0, x: 40`. 250ms.
   - `prefers-reduced-motion`: instant appear and disappear; still auto-dismisses after 3s.

4. `GameHud.tsx`:
   - Reads `gameState` via `useStore`. Reads `selectIsGameActive` selector.
   - Renders `<ExplorationLevel />` and `<ZoneUnlockNotification />`.
   - Entire component returns `null` when `!selectIsGameActive`.

5. `HudPlane.tsx` (modify):
   - Uncomment the `{capabilities.gameLayerActive && <GameHud />}` line (previously stubbed as a comment in T-019).

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
From Document 08 Section 4.5 (game layer tests):

- Navigate to new zone in Explorer Mode → `unlockedZones` updated; `explorationLevel` incremented.
- Navigate to already-visited zone → no game state change.
- Navigate in Recruiter Mode → game state not updated.
- From Document 08 Section 5.5: Explorer → Recruiter → GameHud hidden; MiniMap hidden.
Toast: notification appears on unlock; auto-dismisses after 3s (fake timers).

**Acceptance Criteria**

- Zone unlock only triggers in Explorer Mode (`activeMode === "explorer"`)
- Duplicate zone navigations are no-ops on game state (Document 08 Section 4.5)
- Notification auto-dismisses after exactly 3000ms
- `GameHud` returns `null` in all non-Explorer modes
- All Document 08 Section 4.5 game layer state tests pass

**Rollback Strategy**
Revert `navigationSlice.ts` zone-unlock addition. Revert `HudPlane.tsx` to T-019 state. Delete `GameHud.tsx` and sub-components.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The cross-slice action call within `navigateTo` (unlocking zone from the navigation slice action) requires careful Zustand pattern reasoning to avoid cross-slice dependency issues.

---

**Context Strategy**

Start new chat: No (continue from T-038)

Required files:

- `src/core/store/navigationSlice.ts`
- `src/core/store/gameSlice.ts`
- `src/core/store/index.ts`
- `src/hud/HudPlane.tsx`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 9 — game layer event rules), `08_TESTING_STRATEGY.md` (Section 4.5 — game layer tests)
Exclude: All other documents

---

### T-040 — MiniMap, Challenge Prompts, and Phase 7 Completion

**Phase:** 7 — Gateway Zone and Game Layer
**Subsystem:** Game Layer — MiniMap and Challenge System

**Description:**
Implement the `MiniMap` component (Explorer Mode only — floating zone navigation overlay). Implement the challenge prompt system in Neural Graph and Memory Vault zones (subtle inline dismiss-able prompts). Run the full Phase 7 test suite.

**Scope Boundaries**

Files affected:

- `src/hud/minimap/MiniMap.tsx` (new)
- `src/hud/minimap/MiniMapNode.tsx` (new)
- `src/hud/HudPlane.tsx` (modify — mount MiniMap)
- `src/zones/neural-graph/components/ChallengePrompt.tsx` (new)
- `src/zones/memory-vault/components/ChallengePrompt.tsx` (new)
- `src/zones/neural-graph/NeuralGraphZone.tsx` (modify — render challenge prompt)
- `src/zones/memory-vault/MemoryVaultZone.tsx` (modify — render challenge prompt)

Modules affected:

- HUD MiniMap, Neural Graph and Memory Vault challenge prompts

NOT touching:

- Game HUD (complete)

**Implementation Steps**

1. `MiniMapNode.tsx`:
   - Props: `zoneId: ZoneId`, `label: string`, `isActive: boolean`, `isUnlocked: boolean`, `onClick: () => void`.
   - Small circle or square node. Active zone: accent color fill. Unlocked: full opacity. Locked: 40% opacity.
   - Click: `navigateTo(zoneId)`.

2. `MiniMap.tsx`:
   - Reads `activeZone`, `navigateTo` from navigation slice.
   - Reads `unlockedZones` from game slice.
   - Renders a compact floating panel (top-right or bottom-right — document choice) with one `MiniMapNode` per zone. A toggle button shows/hides the MiniMap (stores `miniMapOpen` in navigation slice).
   - Only visible when `capabilities.miniMapAvailable` (Explorer Mode).

3. Challenge prompts (one per zone — same component pattern in both zones):
   - Props: `challengeId: string`, `message: string`, `onDismiss: () => void`.
   - Reads `dismissedChallenges` from game slice. If `challengeId` is in `dismissedChallenges`, return `null`.
   - Render: a small subtle banner at the bottom of the zone content area. Text from `message` prop. `DismissButton` calls `onDismiss()` → dispatches `dismissChallenge(challengeId)`.
   - Only rendered when `selectIsGameActive` is true.
   - Framer Motion: fade in on mount, fade out on dismiss.

4. Wire challenge prompts in both zones with a representative `challengeId` and `message` string (content-authored prompts, not hardcoded — define them in `meta.json` or inline as zone constants).

5. `HudPlane.tsx`: uncomment `{capabilities.miniMapAvailable && <MiniMap />}`.

6. Phase 7 tests: all game layer UI tests from Document 08 Section 5.5. Dismiss challenge: `dismissedChallenges` updated, prompt removed from DOM, does not reappear. Zone unlock notification tests (fake timers). `npm run test` full suite.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Document 08 Section 5.5. Challenge dismiss tests. `npm run test` full suite.

**Acceptance Criteria**

- MiniMap visible only in Explorer Mode
- MiniMap reflects current `activeZone` and `unlockedZones`
- Challenge prompts only render when `selectIsGameActive` is true
- Dismissed challenges never reappear within the session
- All Document 08 Section 5.5 mode selector and game layer tests pass
- `npm run test` passes with zero failures — Phase 7 complete

**Rollback Strategy**
Delete MiniMap and challenge prompt components. Revert zone files to pre-challenge state. Revert `HudPlane.tsx`.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Established patterns applied to new components. No novel technical challenges after the game layer core was established in T-039.

---

**Context Strategy**

Start new chat: No (continue from T-039)

Required files:

- `src/core/store/index.ts`
- `src/core/hooks/useMode.ts`
- `src/hud/HudPlane.tsx`
- `src/core/design-system/components/DismissButton.tsx`

Architecture docs: `01_SYSTEM_ARCHITECTURE.md` (Section 2 — zone registry for MiniMap node list)
Exclude: All other documents

---

## PHASE 8 — Mode System Completion

**Objective:** Systematic audit and completion of the full four-mode behavioral contract across every zone. Mobile initialization, `prefers-reduced-motion` enforcement, and performance tier detection.

---

### T-041 — Mode System Audit — All Zones

**Phase:** 8 — Mode System Completion
**Subsystem:** Cross-Zone — Mode Behavior Completeness

**Description:**
Audit every zone against the mode behavior table in Document 04 Section 7. Document any gaps found. Fill all gaps. This task is a systematic cross-zone review — not a new feature. The output is a confirmed complete mode behavior matrix.

**Scope Boundaries**

Files affected:

- Any zone component that has a gap in its mode behavior implementation
- Audit findings documented in a code comment in each zone's root component: `// MODE AUDIT COMPLETE: [date] — all modes verified`

Modules affected:

- All six zone root components (read-only audit; modify only where gaps exist)

NOT touching:

- Performance tier detection (T-042)
- Mobile initialization (T-042)

**Implementation Steps**

1. For each zone, verify against Document 04 Section 7's mode behavior table:

   | Zone | Explorer | Recruiter | Deep | Safe |
   |---|---|---|---|---|
   | Control Room | Full animations | Reduced animations | Minimal animations | No animations |
   | Memory Vault | Accordion (one open) | Accordion (one open) | All expanded | Accordion (one open) |
   | Neural Graph | SVG graph | Text list | SVG graph (expanded) | Text list |
   | Timeline Tunnel | Horizontal scroll | Vertical stack | Vertical stack | Vertical stack |
   | Arena | Normal | Normal | Normal | Normal |
   | Gateway | Normal | Normal | Normal | Normal |

2. For each gap found, implement the missing behavior in the relevant zone component. The most likely gaps:
   - Neural Graph "Deep Mode expanded": the SVG graph renders but with all node detail panels pre-opened. Implement: if `activeMode === "deep"`, `NodeDetailPanel` renders for all nodes simultaneously (or the first node is auto-selected). Document the implementation choice.
   - Animation level compliance: verify every zone's Framer Motion wrappers check `useReducedMotion()` and the `capabilities.animationsEnabled` flag.
   - Recruiter Mode in Control Room: verify animation is fade-only (no translate).

3. Add the audit complete comment to each zone root component once verified.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Integration tests from Document 08 Section 4.2 (mode transition tests). Manual: switch through all four modes while in each zone and verify the expected layout and behavior per the table above.

**Acceptance Criteria**

- Every zone × every mode combination produces the correct layout per Document 04 Section 7
- All zone root components have the `// MODE AUDIT COMPLETE` comment
- All Document 08 Section 4.2 mode transition integration tests pass

**Rollback Strategy**
Revert any zone changes to their pre-audit state. The audit comment is the only permanent artifact.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Opus
Recommended Mode: Standard

Reason: The audit requires holding the full mode behavior matrix in mind while inspecting six zones simultaneously — a multi-constraint reasoning task suited to Opus.

---

**Context Strategy**

Start new chat: Yes (Phase 8 — mode audit requires fresh full-system context)

Required files:

- All six zone root components (current state)
- `src/core/hooks/useMode.ts`
- `src/core/hooks/useReducedMotion.ts`

Architecture docs: `04_STATE_AND_INTERACTION_ENGINE.md` (Section 7 — mode-based behavior overrides, full table), `08_TESTING_STRATEGY.md` (Section 4.2 — mode transition tests)
Exclude: All other documents

---

### T-042 — Mobile Init, Performance Tier Detection, and Reduced Motion Enforcement

**Phase:** 8 — Mode System Completion
**Subsystem:** Cross-System — Device Adaptation

**Description:**
Implement performance tier detection (hardware concurrency + device memory + canvas benchmark). Verify mobile initialization behavior. Enforce `prefers-reduced-motion` at the CSS global level and confirm all animated components consume `useReducedMotion()`. Run Playwright E2E test simulating `prefers-reduced-motion: reduce`.

**Scope Boundaries**

Files affected:

- `src/core/utils/performanceTier.ts` (new)
- `src/core/store/modeSlice.ts` (modify — integrate performance tier detection)
- `src/ambient/ParticleCanvas.tsx` (modify — read low-tier flag for particle count)
- `src/index.css` (verify — `prefers-reduced-motion` global rule present from T-002)
- `tests/e2e/reducedMotion.spec.ts` (new — Playwright test)

Modules affected:

- Performance tier detection, mode slice initialization, particle system, E2E tests

NOT touching:

- Any zone component rendering logic
- Zustand store slice structure (mode slice modification is initialization-time only)

**Implementation Steps**

1. `performanceTier.ts`:
   - Export `async function detectPerformanceTier(): Promise<"standard" | "low">`.
   - Steps per Document 07 Section 7.2:
     - Check `navigator.hardwareConcurrency < 4` → low flag.
     - Check `(navigator as any).deviceMemory < 4` (if available) → low flag.
     - Canvas benchmark: create offscreen canvas (100×100), render 500 fillRect calls, measure elapsed time. If elapsed > 16ms → low flag.
   - If any low flag: return `"low"`. Otherwise return `"standard"`.

2. `modeSlice.ts` (modify — initialization):
   - Add `performanceTier: "standard" | "low"` to `ModeState`. Default `"standard"`.
   - Add `setPerformanceTier(tier: "standard" | "low")` action.
   - In `App.tsx` (T-013's mount effect), call `detectPerformanceTier()` and dispatch `setPerformanceTier(result)` before the boot sequence renders. This detection runs once — result is immutable for the session.

3. `ParticleCanvas.tsx` (modify):
   - Read `performanceTier` from `useMode()` (add to `ModeCapabilities` or read directly from store).
   - If `performanceTier === "low"`: use halved particle count; skip the runtime benchmark (tier is already detected).
   - If `performanceTier === "low"`: set `alphaDecay` hint in the store for Neural Graph (via a new store field `lowTierDevice: boolean`) — Neural Graph's `useForceSimulation` already reads a low-tier flag (from T-025 step 4).

4. Reduced motion enforcement verification:
   - Grep all zone components for Framer Motion usage (`motion.div`, `AnimatePresence`). Confirm each usage has a `useReducedMotion()` check or is wrapped in a conditional that respects the return value.
   - Verify `src/index.css` contains the `@media (prefers-reduced-motion: reduce)` CSS override from T-002. If any keyframe animations were added after T-002 without the media query override, add them.

5. `tests/e2e/reducedMotion.spec.ts` (Playwright):
   - Set `page.emulateMedia({ reducedMotion: "reduce" })`.
   - Navigate to each zone.
   - Assert no CSS `animation` or `transition` properties with duration > 10ms are present on any element (using `page.evaluate` to check computed styles).
   - Assert Neural Graph renders list fallback (because `useReducedMotion` returns true → treated as Safe Mode for animation).

**Data Impact**
Schema changes: `ModeState` gains `performanceTier` and `lowTierDevice` fields.
Migration required: Update initial state shape. All existing tests use default `"standard"` tier — no behavior change.

**Test Plan**
Mobile initialization tests from Document 08 Section 4.2. Playwright reduced motion E2E test. Manual: throttle CPU 4× in Chrome DevTools, run Neural Graph, confirm simulation settles faster with increased `alphaDecay`.

**Acceptance Criteria**

- `detectPerformanceTier()` returns `"low"` when any low-tier signal is detected
- Performance tier detection runs exactly once at startup (not on every render)
- Particle count halved on low-tier devices
- `prefers-reduced-motion: reduce` Playwright test passes (zero long-duration animations detected)
- Mobile viewport initializes in Recruiter-equivalent mode regardless of sessionStorage
- All Document 08 Section 4.2 mobile initialization tests pass

**Rollback Strategy**
Delete `performanceTier.ts`. Revert `modeSlice.ts` to pre-modification state. Revert `ParticleCanvas.tsx`. Delete Playwright test file.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: The canvas benchmark timing, the cross-component propagation of the performance tier flag, and the Playwright CSS animation assertion approach require careful planning.

---

**Context Strategy**

Start new chat: No (continue from T-041)

Required files:

- `src/core/store/modeSlice.ts`
- `src/ambient/ParticleCanvas.tsx`
- `src/zones/neural-graph/hooks/useForceSimulation.ts`
- `src/App.tsx`

Architecture docs: `07_PERFORMANCE_AND_OPTIMIZATION.md` (Sections 7.1, 7.2, 7.3 — device-adaptive rendering), `08_TESTING_STRATEGY.md` (Section 4.2 — mobile initialization tests)
Exclude: All other documents

---

### T-043 — Mode System Integration Tests and Phase 8 Completion

**Phase:** 8 — Mode System Completion
**Subsystem:** Cross-System — Integration Test Completion

**Description:**
Write and run all remaining cross-zone mode integration tests from Document 08 Section 4. Confirm every mode transition produces correct behavior in every zone. Run `npm run test` for the full suite. This is the final gate before performance work begins.

**Scope Boundaries**

Files affected:

- `tests/e2e/modeTransitions.spec.ts` (new — Playwright E2E for mode switching across zones)
- Any test files that need extension based on audit findings from T-041

Modules affected:

- Test suite only

NOT touching:

- Any application code (all code should be complete before this task)

**Implementation Steps**

1. Review all Document 08 Section 4 integration test scenarios not yet covered by existing tests. Write missing tests.
2. `modeTransitions.spec.ts` (Playwright):
   - Switch mode → navigate to each zone → verify zone layout matches the mode.
   - Explorer → Recruiter: game HUD disappears; minimap disappears; particle canvas disappears.
   - Recruiter → Explorer: game HUD appears; particle canvas appears.
   - Deep Mode: Memory Vault all-expanded verification; Timeline vertical stack; Neural Graph SVG rendered.
   - Safe Mode: boot skipped; no animations; Neural Graph text list; all zones render content.
3. Run `npm run test` (Vitest). Zero failures required.
4. Run `npx playwright test`. Zero failures required.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
The test files produced are the test plan.

**Acceptance Criteria**

- All Document 08 Section 4 integration test scenarios have corresponding test implementations
- `npm run test` passes with zero failures
- `npx playwright test` passes with zero failures
- Phase 8 complete — system is ready for performance optimization

**Rollback Strategy**
Delete new test files. No application code affected.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Test writing against well-defined scenarios. Playwright E2E syntax is straightforward.

---

**Context Strategy**

Start new chat: No (continue from T-042)

Required files:

- All zone root components (for behavior reference in test assertions)

Architecture docs: `08_TESTING_STRATEGY.md` (Section 4 — all state transition tests)
Exclude: All other documents

---

## PHASE 9 — Performance, Polish, and Launch

**Objective:** Final optimization pass, visual fidelity review, accessibility audit, production deployment configuration, and live deployment. No new features are introduced in this phase.

---

### T-044 — Bundle Analysis and Chunk Size Optimization

**Phase:** 9 — Performance, Polish, and Launch
**Subsystem:** Build Optimization

**Description:**
Run the Vite bundle analyzer. Measure all chunk sizes against Document 07 Section 8.3 targets. Fix any overages. Verify D3 is isolated to the neural-graph chunk. Verify Framer Motion tree-shaking. Add the bundle size check step to the GitHub Actions CI pipeline.

**Scope Boundaries**

Files affected:

- `vite.config.ts` (modify if chunk assignments need adjustment)
- `.github/workflows/deploy.yml` (modify — add bundle size check step)
- `package.json` (modify — add `analyze` script)

Modules affected:

- Build configuration only

NOT touching:

- Any application code (unless a specific import is causing unexpected bundle growth)

**Implementation Steps**

1. Install `rollup-plugin-visualizer` as a dev dependency. Add a `vite:analyze` script to `package.json` that builds with the visualizer plugin enabled.
2. Run `npm run build` and analyze the visualizer output. Record actual chunk sizes.
3. Compare against targets from Document 07 Section 8.3:
   - Entry chunk: < 150kb gzipped
   - Neural Graph chunk (with D3): < 120kb gzipped
   - Terminal overlay chunk: < 30kb gzipped
   - Per-zone chunks (average): < 25kb gzipped
   - Total initial load: < 200kb gzipped
4. For any overage:
   - Check if D3 sub-modules (e.g., `d3-force`, `d3-zoom`, `d3-selection`) are being imported outside the neural-graph chunk. Fix by ensuring only `NeuralGraphZone` imports D3.
   - Check Framer Motion: confirm only named imports (`motion`, `AnimatePresence`, `useReducedMotion`, `useAnimation`) are used — no `import * as` patterns.
   - Check for unintentional cross-zone imports (a zone importing from another zone). These violate the zone isolation contract and also merge chunks unexpectedly.
5. Add bundle size check to `deploy.yml` CI pipeline (after build step): read chunk sizes from build output, compare against thresholds, `exit 1` if any exceed target by more than 20% (per Document 09 Section 4.3 validation step 3).

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Bundle analyzer output must show all chunks within targets. `npm run build` CI step logs chunk sizes.

**Acceptance Criteria**

- All chunk sizes within Document 07 Section 8.3 gzipped targets
- D3 package appears only in the neural-graph chunk (verified via visualizer)
- Framer Motion tree-shaking confirmed (only used exports present in bundle)
- Bundle size check added to `deploy.yml` — will block deployment if chunks exceed target by 20%
- `npm run build` completes without bundle size warnings

**Rollback Strategy**
Revert `vite.config.ts` changes. Remove bundle size check from CI (non-blocking if needed temporarily).

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Build configuration and bundle analysis. Deterministic given the analyzer output.

---

**Context Strategy**

Start new chat: Yes (Phase 9 — performance focus, fresh context)

Required files:

- `vite.config.ts` (current state)
- `.github/workflows/deploy.yml` (current state)

Architecture docs: `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 8.3 — bundle size benchmarks), `09_DEPLOYMENT_WORKFLOW.md` (Section 4.3 — build validation steps)
Exclude: All zone documents, state documents

---

### T-045 — Lighthouse CI Setup and Performance Validation

**Phase:** 9 — Performance, Polish, and Launch
**Subsystem:** Performance Validation

**Description:**
Configure Lighthouse CI. Run it against the production build locally. Verify all Lighthouse metrics meet Document 07 Section 10 targets. Verify frame rate ≥ 60fps across all animation scenarios using Chrome DevTools Performance panel. Document any regressions found and fix them.

**Scope Boundaries**

Files affected:

- `.lighthouserc.json` (new — Lighthouse CI configuration)
- `.github/workflows/deploy.yml` (modify — add Lighthouse CI step)
- Any component files where performance regressions are found (fix-only scope)

Modules affected:

- CI configuration, any components with performance issues

NOT touching:

- Zone feature logic (this is fix-only, not feature-addition)

**Implementation Steps**

1. Install `@lhci/cli` as a dev dependency. Create `.lighthouserc.json`:

   ```json
   {
     "ci": {
       "collect": { "staticDistDir": "./dist" },
       "assert": {
         "assertions": {
           "categories:performance": ["error", { "minScore": 0.9 }],
           "categories:accessibility": ["error", { "minScore": 0.95 }],
           "first-contentful-paint": ["error", { "maxNumericValue": 1000 }],
           "interactive": ["error", { "maxNumericValue": 3500 }],
           "total-blocking-time": ["error", { "maxNumericValue": 200 }],
           "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
           "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }]
         }
       }
     }
   }
   ```

2. Add `lhci autorun` step to `deploy.yml` after the build step (per Document 09 Section 5.2).
3. Run Lighthouse CI locally: `npx lhci autorun`. Review report.
4. If any metric fails: diagnose and fix. Common causes:
   - High TBT: a zone component is doing expensive synchronous work in the main thread during boot. Move to `useEffect` or defer.
   - Poor FCP: boot overlay CSS is not rendering before JS executes. Verify boot overlay is CSS-only for its first frame (T-020's boot design handles this).
   - High CLS: a layout shift from font loading or image loading (no images in this app, so font-display: swap is the likely culprit — verify `font-display: swap` in CSS).
5. Frame rate verification (manual):
   - Open Chrome DevTools Performance panel. Record 10 seconds covering: zone transition, Neural Graph simulation, Memory Vault accordion, particle canvas active.
   - Confirm no frames > 16.67ms (60fps floor).
   - If frame drops found: profile the specific component. Common fix: missing `React.memo`, incorrect Framer Motion property animation (layout-affecting property instead of transform/opacity).

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Lighthouse CI report output. Chrome DevTools Performance recording.

**Acceptance Criteria**

- Lighthouse CI passes all assertion thresholds from Document 07 Section 10
- Lighthouse performance score ≥ 90, accessibility score ≥ 95
- FCP < 1.0s; TTI < 3.5s; TBT < 200ms; LCP < 2.5s; CLS < 0.05
- Chrome DevTools confirms ≥ 60fps in all animation scenarios
- Lighthouse CI step added to `deploy.yml` — blocks deployment on failure

**Rollback Strategy**
Remove `.lighthouserc.json`. Remove Lighthouse CI step from `deploy.yml`. No application code is affected.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Configuration and diagnostic work. If fixes are needed, they are typically small and targeted.

---

**Context Strategy**

Start new chat: No (continue from T-044)

Required files:

- `.github/workflows/deploy.yml` (current state)
- `vite.config.ts`

Architecture docs: `07_PERFORMANCE_AND_OPTIMIZATION.md` (Section 10 — performance monitoring targets), `08_TESTING_STRATEGY.md` (Section 8.1 — Lighthouse CI targets), `09_DEPLOYMENT_WORKFLOW.md` (Section 5.2 — deploy pipeline)
Exclude: All other documents

---

### T-046 — Accessibility Audit

**Phase:** 9 — Performance, Polish, and Launch
**Subsystem:** Accessibility

**Description:**
Run axe-core accessibility audit across all zones via Playwright. Fix all critical and serious violations. Manually verify keyboard navigation, focus trap, and focus restoration for all interactive zones and overlays.

**Scope Boundaries**

Files affected:

- `tests/e2e/accessibility.spec.ts` (new — Playwright + axe-core)
- Any component files where accessibility violations are found (fix-only scope)

Modules affected:

- E2E test suite, any components with violations

NOT touching:

- Zone feature logic (fix-only)

**Implementation Steps**

1. Install `@axe-core/playwright` as a dev dependency.
2. `accessibility.spec.ts`:
   - For each zone (Control Room, Memory Vault with one card expanded, Neural Graph with one node selected, Terminal open, Gateway):
     - `await page.goto("/")` → navigate to the zone.
     - `const results = await new AxeBuilder({ page }).analyze()`.
     - `expect(results.violations).toHaveLength(0)` — or filter to `impact: "critical" | "serious"` per Document 08 Section 7.
3. For each violation found, fix the component:
   - Missing `aria-label` on SVG graph nodes: add `aria-label={skill.label}` to `<circle>` in `GraphNode.tsx`.
   - Missing `aria-label` on icon buttons: add to all `DismissButton` instances (already uses `ariaLabel` prop — verify all usages provide a value).
   - Insufficient color contrast: adjust token values in `tokens.css` if any text/background combinations fail WCAG AA (4.5:1 for normal text).
   - Missing `role` on the terminal history container: add `role="log" aria-live="polite" aria-label="Terminal output"`.
   - Missing `role` on the mode selector buttons: verify `aria-pressed` is present (implemented in T-018 — verify it remains).
4. Manual keyboard navigation verification per Document 08 Section 7.1:
   - Tab through every zone — all interactive elements reachable.
   - Terminal: Tab cycles within input. `Shift+Tab` stays within terminal when open.
   - Quiz Modal: focus trapped; `Tab` cycles within modal.
   - After closing Terminal: focus returns to the HUD terminal button.
   - After closing Quiz Modal: focus returns to the "Test this skill" button in NodeDetailPanel.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
`npx playwright test tests/e2e/accessibility.spec.ts` — zero critical/serious violations. Manual keyboard navigation checklist (documented in a checklist file in `/tests/accessibility-checklist.md`).

**Acceptance Criteria**

- axe-core reports zero critical or serious violations across all zones
- All graph nodes have `aria-label` with skill name
- Terminal history container has `role="log"` and `aria-live="polite"`
- Focus trap confirmed working for Terminal and Quiz Modal (Playwright keyboard navigation test)
- Focus restoration confirmed after closing each overlay
- All color contrast ratios meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
- Accessibility Playwright tests pass

**Rollback Strategy**
Delete `accessibility.spec.ts`. Revert any component changes to pre-audit state (unlikely to be needed — fixes are additive).

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Extended Thinking)
Recommended Mode: Thinking enabled

Reason: Accessibility fixes often require understanding the semantic intent behind the component. ARIA role and live region decisions require reasoning about assistive technology behavior.

---

**Context Strategy**

Start new chat: No (continue from T-045)

Required files:

- `src/zones/neural-graph/components/GraphNode.tsx`
- `src/overlays/terminal/components/TerminalHistory.tsx`
- `src/hud/mode-selector/ModeSelector.tsx`

Architecture docs: `08_TESTING_STRATEGY.md` (Section 7 — accessibility requirements)
Exclude: All other documents

---

### T-047 — Visual Polish Pass

**Phase:** 9 — Performance, Polish, and Launch
**Subsystem:** Visual Fidelity

**Description:**
Systematic visual review of all zones and overlays against the design system. Identify and fix: glassmorphism inconsistencies, animation timing drift between zones, typography scale violations, hover state gaps, and Safe Mode visual coherence (no jarring instant changes).

**Scope Boundaries**

Files affected:

- Any component files where visual inconsistencies are found (fix-only, small changes only)
- `src/core/design-system/tokens.css` (if token values need adjustment)

Modules affected:

- Any zone or design system components needing visual corrections

NOT touching:

- Any behavioral or interaction logic
- State management
- Test files

**Implementation Steps**

1. Open each zone in Explorer Mode. Review against the design system:
   - `GlassPanel` backdrop-filter is visible in all browsers (check Safari — `-webkit-backdrop-filter` present via T-007).
   - Accent color consistent across all zones (all using `var(--color-accent)` — no hardcoded hex values).
   - Typography scale: zone headings use `SectionHeading`, body uses `BodyText`, mono uses `MonoText` — no ad hoc inline styles.
   - Spacing: margins and padding use `var(--space-*)` tokens — no magic number `px` values (except for animation properties).
2. Review hover states across all interactive elements:
   - `ActionButton` glow on hover: present in Control Room CTAs, Gateway links.
   - `NavItem` active indicator: consistent across all zone navigations.
   - Graph node hover: accent stroke thickness increase present.
   - All clickable elements have `cursor: pointer`.
3. Animation timing review:
   - Zone entry: all zones play at 300ms (check `zoneEntryVariants` usage — verify no zone overrides with a different duration).
   - Card expand/collapse: 200ms entry, 150ms exit — consistent across Memory Vault and Timeline.
   - Toast notification: 250ms entry, verify in both GameHud and QuizModal.
4. Safe Mode visual coherence:
   - Switch to Safe Mode. Navigate through all zones. Verify content is readable without animation context — no elements that depend on animation state for layout visibility.
   - Verify no "flash of unstyled content" when Safe Mode skips the boot sequence.
5. Fix all issues found. If a fix requires more than 10 lines of code, create a separate sub-task note for review before implementing.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Manual visual review — no automated tests. Record all issues found and fixes applied in a review comment or commit message.

**Acceptance Criteria**

- Glassmorphism consistent across all `GlassPanel` instances
- No hardcoded hex colors outside `tokens.css`
- All interactive elements have `cursor: pointer`
- Safe Mode: all zones are fully readable without animation
- No TypeScript errors introduced by polish fixes (`npx tsc --noEmit` passes)

**Rollback Strategy**
Revert individual component changes. Token value changes can be reverted in `tokens.css`.

**Estimated Complexity:** M

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Review and targeted fixes. No complex reasoning required — it's observational and corrective.

---

**Context Strategy**

Start new chat: No (continue from T-046)

Required files:

- `src/core/design-system/tokens.css`
- `src/core/utils/animationVariants.ts`

Architecture docs: None — this is a visual review, not an architecture task.
Exclude: All blueprint documents (visual review is empirical)

---

### T-048 — Vercel Deployment Configuration and Production Deployment

**Phase:** 9 — Performance, Polish, and Launch
**Subsystem:** Deployment

**Description:**
Configure `vercel.json` with all cache-control headers and security headers from Document 09. Configure the GitHub Actions production deployment workflow. Verify the rollback procedure. Deploy to production. Confirm all external links are correct in the live environment.

**Scope Boundaries**

Files affected:

- `vercel.json` (new)
- `.github/workflows/deploy.yml` (complete — add Vercel deploy step)
- `public/resume.pdf` (verify present)

Modules affected:

- Deployment configuration only

NOT touching:

- Any application code

**Implementation Steps**

1. `vercel.json`:
   - Configure all headers per Document 09 Section 6 (cache-control) and Section 7 (security):
     - `/assets/*` and `/fonts/*`: `"Cache-Control": "public, max-age=31536000, immutable"`
     - `/content/*`: `"Cache-Control": "public, max-age=86400, stale-while-revalidate=3600"`
     - `/resume.pdf`: `"Cache-Control": "public, max-age=86400"`
     - `index.html`: `"Cache-Control": "no-cache"`
   - Security headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
   - CSP per Document 09 Section 7.1: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'`.
   - SPA routing: Vercel handles automatically for projects with a single `index.html`.

2. `deploy.yml` (complete):
   - Add final steps per Document 09 Section 5.2:
     - `vercel deploy --prod` using `VERCEL_TOKEN` secret.
     - Post deployment summary: commit hash, Lighthouse scores, chunk sizes.

3. Add `VERCEL_TOKEN` to GitHub repository secrets (manual step — document in `README.md`).

4. Verify rollback procedure per Document 09 Section 10:
   - Deploy a deliberate no-op to production preview. Use `vercel rollback` CLI to roll back to the previous deployment. Confirm the previous version is live. Document that the rollback was tested.

5. Production deployment:
   - Merge all changes to `main` branch.
   - GitHub Actions `deploy.yml` runs automatically.
   - After deployment: manually verify all six zones load and function correctly at the production URL. Verify resume PDF downloads. Verify external links (GitHub, LinkedIn) open correctly.

6. Post-deployment checklist:
   - Boot sequence plays on first visit (no sessionStorage flag from prior sessions).
   - Neural Graph loads within 500ms of navigation (pre-fetch confirmed working).
   - Terminal opens and commands respond.
   - All zone transitions animate correctly.
   - Mode selector functions in production build.

**Data Impact**
Schema changes: None.
Migration required: No.

**Test Plan**
Manual post-deployment verification checklist. Rollback procedure documented and tested on preview.

**Acceptance Criteria**

- `vercel.json` cache-control and security headers match Document 09 exactly
- CSP does not block any application resources (test by checking browser console for CSP errors on production)
- Production deployment is live and all zones function correctly
- Rollback procedure tested and confirmed working
- Resume PDF present at `/resume.pdf` and downloadable
- All external links open correctly with correct `rel` attributes
- No CSP violations in browser console

**Rollback Strategy**
Use `vercel rollback` to the previous deployment immediately if any production issue is detected. Fix the issue in a new PR before re-deploying.

**Estimated Complexity:** S

---

**LLM Execution Assignment**

Recommended Model: Claude Sonnet (Standard)
Recommended Mode: Standard

Reason: Configuration and deployment steps. Well-specified in Document 09. No complex reasoning required.

---

**Context Strategy**

Start new chat: No (continue from T-047)

Required files:

- `.github/workflows/deploy.yml` (current state)

Architecture docs: `09_DEPLOYMENT_WORKFLOW.md` (Sections 4, 5, 6, 7, 8, 10 — build strategy, CI/CD pipeline, cache headers, security headers, routing, rollback)
Exclude: All other documents

---

## FINAL VALIDATION MILESTONES

The following milestones serve as formal go/no-go gates at the end of the execution plan. Each milestone must be confirmed complete before the deployment task (T-048) is considered done.

---

### MILESTONE 1 — Functional Completeness

**Confirmed by:** `npm run test` passing with zero failures after Phase 8 completion (T-043).

Checklist:

- [ ] All six zones render real content data from their respective JSON files
- [ ] All zone interactions function per Document 08 UI interaction tests
- [ ] All four modes produce correct behavior in all zones per Document 04 Section 7
- [ ] Terminal responds to all eight commands with correct output
- [ ] Boot sequence plays once per session; skips on return visit
- [ ] Zone transitions animate correctly via `AnimatePresence`
- [ ] Game layer (Explorer Mode): zone unlocks trigger notifications; challenges dismissible
- [ ] Gateway: all links correct; resume downloads; email copy works
- [ ] All Vitest tests: zero failures
- [ ] All Playwright E2E tests: zero failures

---

### MILESTONE 2 — Performance Gate

**Confirmed by:** Lighthouse CI passing all thresholds + Chrome DevTools frame rate verification (T-045).

Checklist:

- [ ] Lighthouse performance score ≥ 90
- [ ] Lighthouse accessibility score ≥ 95
- [ ] FCP < 1.0s
- [ ] TTI < 3.5s
- [ ] TBT < 200ms
- [ ] LCP < 2.5s
- [ ] CLS < 0.05
- [ ] All chunk sizes within Document 07 Section 8.3 gzipped targets
- [ ] React Profiler confirms zero React re-renders during D3 tick (documented in T-029)
- [ ] Chrome DevTools confirms ≥ 60fps during all animation scenarios
- [ ] Particle canvas suspends when tab is hidden (Page Visibility API confirmed in T-014)

---

### MILESTONE 3 — Accessibility Gate

**Confirmed by:** axe-core Playwright audit zero critical/serious violations (T-046).

Checklist:

- [ ] axe-core: zero critical or serious violations in all zones
- [ ] All graph nodes have `aria-label` with skill name
- [ ] All interactive elements keyboard-reachable (manual verification)
- [ ] Focus trapped within Terminal overlay when open
- [ ] Focus trapped within Quiz Modal when open
- [ ] Focus restored to correct element after overlay close
- [ ] All color contrast ratios meet WCAG AA
- [ ] `prefers-reduced-motion: reduce` Playwright test passes
- [ ] Terminal history container has `role="log"` and `aria-live="polite"`

---

### MILESTONE 4 — Deployment Gate

**Confirmed by:** Production deployment live and all post-deployment checks passing (T-048).

Checklist:

- [ ] `vercel.json` cache-control headers verified in browser DevTools Network tab
- [ ] Security headers present (verify via securityheaders.com or browser DevTools)
- [ ] CSP: zero CSP violations in browser console
- [ ] Boot sequence plays on first visit to production URL
- [ ] All six zones accessible and functional at production URL
- [ ] Neural Graph renders and simulates (pre-fetch working)
- [ ] Terminal commands respond with live content data
- [ ] Resume PDF downloads successfully
- [ ] GitHub and LinkedIn links open correctly
- [ ] Rollback procedure tested and confirmed working
- [ ] `VITE_APP_VERSION` environment variable injected correctly into boot sequence

---

### TASK SUMMARY

| Phase | Tasks | Task IDs | Cumulative |
|---|---|---|---|
| Phase 0 — Project Setup | 12 | T-001 – T-012 | 12 |
| Phase 1 — Core Shell + Navigation | 7 | T-013 – T-019 | 19 |
| Phase 2 — Boot + Control Room | 4 | T-020 – T-023 | 23 |
| Phase 3 — Neural Graph | 6 | T-024 – T-029 | 29 |
| Phase 4 — Terminal Overlay | 4 | T-030 – T-033 | 33 |
| Phase 5 — Memory Vault | 2 | T-034 – T-035 | 35 |
| Phase 6 — Timeline + Arena | 2 | T-036 – T-037 | 37 |
| Phase 7 — Gateway + Game Layer | 3 | T-038 – T-040 | 40 |
| Phase 8 — Mode System Completion | 3 | T-041 – T-043 | 43 |
| Phase 9 — Performance + Launch | 5 | T-044 – T-048 | 48 |
| **Total** | **48 tasks** | **T-001 – T-048** | |

---
