# 10 — Execution Plan

**Product:** GovindOS v3.0  
**Document Type:** High-Level Engineering Phases and Delivery Sequence

---

## 1. Execution Philosophy

The execution plan is sequenced to produce a **working, deployable application at the end of every phase** — not a partially complete system that only functions when all pieces are assembled. Each phase delivers a vertical slice: real zones, real interactions, real content rendering. No phase produces infrastructure without visible output.

The sequence prioritizes:

- **Foundation before features** — Core shell, state, and navigation before any zone implementation.
- **High-complexity zones first** — Neural Graph and Terminal are the most technically novel systems; they surface unknowns early when there is maximum time to absorb them.
- **Progressive fidelity** — Functionality before visual polish; correct behavior before optimized behavior.
- **Content integration as a phase** — Content is not retrofitted at the end. Each zone is implemented against real content data from the moment it is built.

---

## 2. Phase Overview

| Phase | Name | Deliverable |
|---|---|---|
| 1 | Foundation | Project scaffold, design system, state store, content loading |
| 2 | Shell and Navigation | App shell, zone plane, HUD, mode selector, navigation state machine |
| 3 | Boot Sequence and Control Room | Boot overlay, Control Room zone, metrics panel |
| 4 | Neural Graph | D3 force graph, node interaction, adjacency highlight, detail panel |
| 5 | Terminal | Terminal overlay, command registry, full command set |
| 6 | Memory Vault | Project cards, accordion system, architecture toggle |
| 7 | Timeline Tunnel and Arena | Timeline horizontal scroll, Arena stat panels |
| 8 | Gateway and Game Layer | Gateway zone, game layer HUD, zone unlock notifications |
| 9 | Mode System Completion | Recruiter Mode fallbacks, Deep Mode, Safe Mode, mobile defaults |
| 10 | Performance, Polish, and Launch | Bundle optimization, animation refinement, accessibility audit, deployment |

---

## 3. Phase Detail

---

### Phase 1 — Foundation

**Scope:**
Establish the project scaffold, toolchain, and all shared infrastructure that every subsequent phase depends on. No user-visible features are built in this phase.

**Engineering work:**

- Initialize Vite + React 18 project with TypeScript configuration.
- Configure Tailwind CSS with the GovindOS design token set (colors, spacing, typography) defined as CSS custom properties.
- Implement the `/core/design-system` component library: `GlassPanel`, `Tag`, `ActionButton`, `MetricBadge`, `SectionHeading`, `MonoText`, `BodyText`.
- Define all TypeScript interfaces from the Data Model document (`Project`, `Skill`, `SkillEdge`, `TimelineEntry`, `ArenaProfile`, `SystemMeta`).
- Implement the Zustand store with all six slices (navigation, mode, terminal, game, session, content).
- Implement the content loader (`contentLoader.ts`) with parallel fetch and schema validation.
- Author initial content JSON files for all six content types (projects, skills, edges, timeline, arena, meta) with real data.
- Configure Vitest and React Testing Library.
- Write unit tests for all store slices and content loader.
- Configure GitHub Actions CI pipeline (PR workflow only at this stage).

**Completion signal:** `npm run test` passes. `npm run dev` serves an empty application with the design system demonstrable in isolation (e.g., a `/dev` sandbox page showing all design system components).

---

### Phase 2 — Shell and Navigation

**Scope:**
Build the application shell — the four rendering layers, zone plane, HUD, and the navigation state machine. Zones are stubbed with placeholder content. The navigation system is fully functional.

**Engineering work:**

- Implement `App.tsx` with the four-layer composition model (Ambient, Zone, HUD, Overlay planes).
- Implement `ZonePlane` with `React.lazy` zone loading via `zoneRegistry`, `Suspense` boundary, and `AnimatePresence` for zone transitions.
- Implement `AmbientPlane` with `ParticleCanvas` (full implementation) and `BackgroundGrid`.
- Implement `HudPlane` with `NavBar`, `NavItem`, and `ModeSelector`.
- Implement `MiniMap` component (Explorer Mode only).
- Implement zone transition animation (cross-fade, 300ms).
- Implement mode switching (instant re-render, no animation).
- Create stub zone components for all seven zones (renders zone name only).
- Configure code splitting: all zone chunks as separate Vite manual chunks.
- Write integration tests for navigation state machine (all transition scenarios from Document 04).
- Write UI tests for NavBar, ModeSelector.

**Completion signal:** All seven zones accessible via navigation. Zone transition animation plays correctly. Mode switching updates the application shell instantly. Particle system active in Explorer Mode. All navigation state machine tests pass.

---

### Phase 3 — Boot Sequence and Control Room

**Scope:**
Implement the boot sequence overlay and the Control Room zone with full metrics panel and CTA navigation.

**Engineering work:**

- Implement `BootSequence` component: scanline animation, fake module loading text sequence, progress to fade-in, `onComplete` callback.
- Implement `sessionStorage` boot-played check and skip logic.
- Implement Control Room zone: system status badge with 3-second pulse behavior, role and stack display, metrics grid with `MetricBadge` components, tooltip behavior, "View Skills" and "Open Projects" CTAs.
- Wire CTAs to `navigateTo` actions.
- Implement boot-window content pre-fetch: Neural Graph and Terminal chunks pre-fetched via `modulepreload` during boot.
- Write UI tests for Control Room (metrics, tooltips, CTAs, status badge).
- Write unit tests for boot session flag logic.

**Completion signal:** Boot sequence plays on first visit, skips on subsequent visits within the session. Control Room renders with real `SystemMeta` data. CTAs navigate correctly. Status badge pulses and stops.

---

### Phase 4 — Neural Graph

**Scope:**
Implement the Neural Graph zone with full D3 force simulation, SVG rendering, interaction system, and list fallback. This is the highest-complexity zone and is built before simpler zones to surface D3/React boundary issues early.

**Engineering work:**

- Implement `GraphCanvas` with D3 force simulation initialization (`useForceSimulation`).
- Implement SVG node and edge rendering with mastery-based color intensity and weight-based edge thickness.
- Implement node entry animation (staggered fade-in) and edge entry animation.
- Implement pan/zoom via D3 `zoom` behavior.
- Implement `useAdjacencyMap` pre-computation.
- Implement hover interaction: adjacency highlighting, node dimming.
- Implement node click: `NodeDetailPanel` with skill metadata, associated project count, quiz modal trigger.
- Implement `GraphListFallback` for Recruiter and Safe Mode.
- Implement `QuizModal` overlay (placeholder question content acceptable; interaction system must be complete).
- Write UI tests for graph interaction (node click, hover, panel render, fallback render).
- Validate D3/React rendering boundary: confirm D3 tick updates do not trigger React re-renders (React Profiler check).

**Completion signal:** Force graph renders with real skill and edge data. Node hover highlights adjacency correctly. Node click opens detail panel. Pan and zoom functional. Recruiter Mode renders list fallback. Quiz modal opens and closes. Frame rate ≥ 60fps during simulation.

---

### Phase 5 — Terminal

**Scope:**
Implement the Terminal overlay with the full command registry, autocomplete, input history navigation, and virtualized output history.

**Engineering work:**

- Implement `TerminalOverlay` with persistent mount, CSS visibility toggle.
- Implement `TerminalHistory` with virtualized rendering.
- Implement `TerminalInput` with controlled input, `Enter` submission, `Tab` autocomplete, arrow key history navigation.
- Implement command registry with all commands specified in the product spec: `help`, `status`, `projects`, `skills`, `github`, `clear`, `exit`, `goto`.
- Implement `goto` command with `navigateTo` side-effect.
- Implement terminal keyboard shortcut to open/close (as defined in the product spec).
- Implement backdrop click to close.
- Write unit tests for all command resolvers (correctness and edge cases).
- Write UI tests for terminal input behavior (submit, autocomplete, arrow navigation, clear, exit, click-outside).
- Write integration tests for `goto` command navigation side-effect.

**Completion signal:** Terminal accessible via nav button and keyboard shortcut. All eight commands return correct output. Autocomplete resolves correctly. Arrow key history navigation works. Terminal history persists across zone transitions. `goto` navigates correctly.

---

### Phase 6 — Memory Vault

**Scope:**
Implement the Memory Vault zone with the accordion project card system, architecture toggle, and Deep Mode expansion.

**Engineering work:**

- Implement `MemoryVaultZone` layout with project card grid.
- Implement `ProjectCard` (collapsed state) with title, one-line problem, stack tags, outcome metric.
- Implement `ProjectExpanded` (expanded state) with full problem, constraints, tradeoffs, architecture section, outcome, demo link.
- Implement `useProjectAccordion` hook: single-expanded-at-a-time behavior with Framer Motion `layout` animation.
- Implement `useArchitectureToggle` hook: per-card independent toggle.
- Implement `ArchitectureSection` with fade + translate animation.
- Implement Deep Mode: all cards expanded, `×` button hidden.
- Implement card list stagger animation on zone entry.
- Wire demo links: `target="_blank"`, `rel="noopener noreferrer"`, null guard.
- Write UI tests for accordion behavior, architecture toggle, Deep Mode, demo link rendering.

**Completion signal:** All projects render from real content data. Accordion opens and closes correctly. Only one card expanded at a time (non-Deep Mode). Architecture toggle independent per card. Deep Mode expands all. Framer Motion layout animation plays smoothly.

---

### Phase 7 — Timeline Tunnel and Arena

**Scope:**
Implement the remaining two content zones. Both are medium complexity and can be developed in parallel by separate engineers if the team size permits.

**Timeline Tunnel engineering work:**

- Implement horizontal scrolling timeline layout.
- Implement work and education `TimelineEntry` components in collapsed and expanded states.
- Implement `useTimelineExpansion` hook for entry expand/collapse.
- Implement Recruiter Mode vertical stack layout.
- Implement skill ID resolution for `technologies` field display.
- Write UI tests for entry expand/collapse, mode layout switch.

**Arena engineering work:**

- Implement Arena zone layout with stat panels.
- Implement `PlatformRating` display with contextual framing.
- Implement `DifficultyBreakdown` interactive chart (hover for count per band).
- Implement `SolvedPattern` list with click-to-surface problem refs.
- Implement `FeaturedProblem` deep-dive section with toggle.
- Implement `CertificationGroup` domain-grouped display.
- Write UI tests for difficulty chart interaction, deep-dive toggle, certification grouping.

**Completion signal:** Both zones render with real content data. All interactions function per spec. Timeline mode fallback correct. Arena deep-dive toggle works.

---

### Phase 8 — Gateway and Game Layer

**Scope:**
Implement the Gateway zone and the complete game layer system (HUD, zone unlock notifications, challenge prompts).

**Gateway engineering work:**

- Implement Gateway zone with LinkedIn, GitHub, email, and resume download links.
- Implement clipboard copy behavior for email (when `preferCopy = true`).
- Implement resume PDF download trigger.
- Apply correct `rel` attributes to all external links.
- Write UI tests for all link behaviors and download trigger.

**Game Layer engineering work:**

- Implement `GameHud` with exploration level display (Explorer Mode only).
- Implement zone unlock detection: `navigateTo` side-effect triggers `unlockZone` when zone not previously visited.
- Implement `ZoneUnlockNotification` toast: auto-dismiss after 3 seconds, Explorer Mode only.
- Implement challenge prompt rendering within Neural Graph and Memory Vault zones (opt-in, dismissible).
- Implement `dismissChallenge` action and session persistence.
- Write UI tests for zone unlock notification, game layer visibility by mode, challenge dismiss.

**Completion signal:** Gateway links all function correctly. Zone unlock notifications appear on first visit in Explorer Mode and do not repeat. Game HUD hidden in non-Explorer modes. Challenge prompts dismissible and non-recurring.

---

### Phase 9 — Mode System Completion

**Scope:**
Verify and complete the full four-mode behavioral contract across all zones. Many mode behaviors were implemented incrementally in previous phases; this phase audits the complete surface and fills gaps.

**Engineering work:**

- Audit every zone against the mode behavior table in Document 04. Document any gaps.
- Complete Recruiter Mode: verify reduced animations, hidden HUD, hidden mini-map, correct layout fallbacks in all zones.
- Complete Deep Mode: verify Memory Vault all-expanded behavior, minimal animations, correct layout in all other zones.
- Complete Safe Mode: verify no animations, no ambient layer, boot skip, all zones render readable content in list-based layouts.
- Implement mobile initialization: `isMobile` flag set on startup, Recruiter Mode defaults applied, never overridden by session storage.
- Implement `prefers-reduced-motion` enforcement: verify `useReducedMotion` hook applied in all animated components; verify `@media (prefers-reduced-motion: reduce)` CSS rules cover all keyframe animations.
- Implement performance tier detection: hardware concurrency and device memory checks, canvas benchmark, automatic particle and animation reduction on low-tier detection.
- Write integration tests for mode transition completeness across all zones.
- Run Playwright E2E tests simulating `prefers-reduced-motion: reduce` and verifying no animations play.

**Completion signal:** All four modes produce the correct visual and behavioral output in all zones. Mobile initialization correct. Reduced-motion fully respected. Performance tier detection functional. All mode integration tests pass.

---

### Phase 10 — Performance, Polish, and Launch

**Scope:**
Final optimization pass, visual fidelity review, accessibility audit, and production deployment configuration. No new features are added in this phase.

**Engineering work:**

*Performance:*

- Run Vite bundle analyzer; verify all chunk sizes within targets from Document 07.
- Run Lighthouse CI against production build; verify all scores meet targets.
- Profile frame rate in Chrome DevTools for all animation scenarios; verify ≥ 60fps.
- Verify D3 simulation produces no React re-renders during tick (React Profiler).
- Verify particle canvas suspends on tab hide.
- Verify content JSON files load within the boot window on a throttled connection (Chrome DevTools network throttling: Fast 3G).

*Accessibility:*

- Run axe-core audit across all zones via Playwright.
- Verify keyboard navigation reaches all interactive elements in all zones.
- Verify focus trap and focus restoration for Terminal and Quiz Modal.
- Verify all color contrast ratios meet WCAG AA.
- Verify all graph nodes carry `aria-label` attributes.

*Visual polish:*

- Review glassmorphism consistency across all zones.
- Review animation timing and easing consistency.
- Review typography scale and spacing consistency.
- Review all hover states and active states.
- Review reduced-motion state visual coherence (no jarring instant changes).

*Deployment:*

- Configure `vercel.json` with all cache-control and security headers.
- Configure GitHub Actions production deployment workflow.
- Verify rollback procedure works (test via a deliberate bad deploy to preview environment).
- Confirm resume PDF present and download functional in production build.
- Confirm all external links (GitHub, LinkedIn) correct and open in new tab.
- Deploy to production.

**Completion signal:** Lighthouse CI scores meet all targets. Bundle sizes within targets. Frame rate ≥ 60fps in all animation scenarios. axe-core audit passes with zero critical or serious violations. Production deployment live and verified.

---

## 4. Phase Dependencies

```
Phase 1 (Foundation)
  └── Phase 2 (Shell and Navigation)
        └── Phase 3 (Boot + Control Room)
              ├── Phase 4 (Neural Graph)
              │     └── Phase 8 (Gateway + Game Layer) [partial: quiz modal]
              ├── Phase 5 (Terminal)
              ├── Phase 6 (Memory Vault)
              │     └── Phase 8 (Gateway + Game Layer) [partial: challenge prompts]
              └── Phase 7 (Timeline + Arena)
                    └── Phase 9 (Mode System Completion)
                          └── Phase 10 (Performance + Launch)
```

Phases 4, 5, 6, and 7 are independent of each other and can be developed in parallel once Phase 3 is complete. Phase 8 has soft dependencies on Phase 4 (quiz modal) and Phase 6 (challenge prompts) but can begin Gateway independently.

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| D3 / React rendering boundary causes frame drops | Medium | High | Phase 4 includes explicit profiling gate; boundary enforced architecturally |
| Force simulation performance on low-end devices | Medium | Medium | Performance tier detection in Phase 9; list fallback always available |
| Content JSON schema errors block zones | Low | Medium | Schema validation tests run on every push; caught before deployment |
| Framer Motion `layout` animation causes layout thrash | Low | Medium | Restricted to single wrapper element per card; FLIP approach verified in Phase 6 |
| Bundle size exceeds targets after D3 addition | Medium | Low | D3 isolated to pre-fetched chunk; analyzer run in Phase 10; tree-shaking verified |
| Boot sequence exceeds 3-second target on slow connections | Low | High | Content pre-fetch during boot; boot duration is CSS-timed, not content-dependent |
| Mobile layout requires significant rework | Low | Medium | Mobile defaults established in Phase 2 (mode system); Recruiter Mode fallbacks built per zone |
