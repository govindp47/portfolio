# 08 — Testing Strategy

**Product:** GovindOS v3.0  
**Document Type:** Testing Architecture, Coverage Targets, and Validation Contracts

---

## 1. Testing Philosophy

GovindOS is a UX-centric interactive application. Its correctness is defined not by data transformation accuracy but by **behavioral fidelity**: does the application respond to user interactions in precisely the way the product specification defines? Testing strategy must reflect this — the dominant concern is interaction correctness, state transition validity, and rendering system behavior, not unit-level pure function coverage.

Three testing layers address this:

- **Unit tests** — Pure functions, command registry resolvers, content schema validation, utility functions.
- **Integration tests** — State machine behavior, zone transition correctness, overlay lifecycle, mode switching, terminal command execution end-to-end.
- **UI interaction tests** — User-facing behavior: click targets, keyboard interactions, expand/collapse, hover states, terminal input flow.

Performance benchmarks sit outside the standard test suite and are run as a separate measurement step.

---

## 2. Testing Stack

| Concern | Tool |
|---|---|
| Unit and integration tests | Vitest |
| UI interaction tests | React Testing Library |
| End-to-end interaction flows | Playwright |
| Component visual regression | None in initial version (deferred) |
| Performance benchmarking | Lighthouse CI + Chrome DevTools manual |
| Accessibility auditing | axe-core (via Playwright integration) |

**Vitest** is chosen over Jest for native ESM support, Vite config reuse, and faster test execution in a Vite-based project. React Testing Library is the standard for React component behavior tests. Playwright provides full browser-based end-to-end coverage for critical flows that require real DOM and CSS behavior (e.g., focus management, scroll behavior, canvas presence detection).

---

## 3. Unit Test Coverage

### 3.1 Content Schema Validation

Every content JSON file has a corresponding schema validator test. Tests assert:

- All required fields are present on each entity.
- ID fields match the kebab-case slug format.
- Cross-reference IDs (e.g., `skillRefs` in projects) resolve to existing entities in the referenced file.
- Enum fields (`type`, `depth`, `mode`) contain only valid values.
- Numeric fields (`mastery`, `confidence`, `weight`) are within defined ranges.

These tests run against the actual content files in `/content`, not mock data. A content authoring error is caught at test time, not at runtime.

### 3.2 Command Registry

Each registered terminal command has a dedicated unit test asserting:

- The resolver returns a non-empty string for valid input.
- The resolver returns the expected error string for invalid arguments.
- Aliases map to the same output as the canonical command name.
- The `help` command output includes every registered command name.
- The `goto` command resolves valid zone IDs and rejects invalid ones.

### 3.3 Utility Functions

Pure utility functions in `/core/utils` are unit-tested exhaustively:

| Utility | Test Coverage |
|---|---|
| `idResolver` | Resolves known IDs; returns null for unknown; handles empty arrays |
| `contentLoader` | Mocked fetch: success path, partial failure, total failure |
| `sessionStorage helpers` | Read/write/clear with mock `sessionStorage` |
| Adjacency map builder | Correct adjacency for simple graphs; handles disconnected nodes; handles bidirectional edges |
| Autocomplete prefix matcher | Exact match, prefix match, multiple matches, no match, empty input |

### 3.4 Zustand Store Slices

Each store slice is tested in isolation using Zustand's testing utilities (store initialized fresh per test):

- Initial state shape matches the defined interface.
- Each action produces the expected state mutation.
- Actions that are no-ops (e.g., navigating to the current zone) produce no state change.
- Composed state (e.g., game layer deactivating on mode switch) is tested at the slice composition level.

---

## 4. State Transition Testing

State transition tests use Vitest with the composed Zustand store. They test multi-step sequences — not individual actions — to validate that the state machine behaves correctly across realistic user flows.

### 4.1 Navigation State Machine Tests

| Scenario | Assertions |
|---|---|
| Navigate from control-room to memory-vault | `activeZone` = memory-vault; `previousZone` = control-room; `isTransitioning` flips true then false |
| Navigate to currently active zone | State unchanged; no transition initiated |
| Navigate during active transition | Second navigation dropped; first completes to original target |
| `navigateTo` with invalid zone ID | State unchanged; no transition |
| Sequential navigations (rapid) | Only the first navigation executes; subsequent dropped |

### 4.2 Mode Transition Tests

| Scenario | Assertions |
|---|---|
| Switch from Explorer to Recruiter | `activeMode` updates; no animation; game layer state preserved but inactive |
| Switch to same mode | No state change |
| Switch to Safe Mode | `activeMode` updates; subsequent animation checks reflect no-animation contract |
| Mobile initialization | `isMobile` = true; `activeMode` defaults to Recruiter-equivalent |

### 4.3 Overlay Stack Tests

| Scenario | Assertions |
|---|---|
| Open terminal | `overlayStack` = ["terminal"]; `terminalOpen` = true |
| Open quiz modal with terminal open | Terminal closed first; `overlayStack` = ["quiz-modal"] |
| Close overlay not in stack | No state change |
| Close one overlay with multiple open | Correct overlay removed; others preserved |
| Zone transition with overlays open | Overlays remain in stack unchanged |

### 4.4 Terminal Session Tests

| Scenario | Assertions |
|---|---|
| Submit known command | History appended with input + output entries |
| Submit unknown command | History appended with input + error entry |
| Submit `clear` command | History array emptied; terminal remains open |
| Submit `exit` command | Terminal closed; history preserved |
| Input buffer cleared after submit | `inputBuffer` = "" after any submission |
| Session history preserved across zone transitions | `history` array unchanged after `navigateTo` |

### 4.5 Game Layer Tests

| Scenario | Assertions |
|---|---|
| Navigate to new zone in Explorer Mode | `unlockedZones` updated; `explorationLevel` incremented |
| Navigate to already-visited zone | No change to game state |
| Navigate in Recruiter Mode | Game state not updated |
| Dismiss challenge | `dismissedChallenges` updated; challenge not re-dismissed on duplicate call |

### 4.6 Session Flag Tests

| Scenario | Assertions |
|---|---|
| First visit: `bootPlayed` = false | Boot sequence renders |
| After boot completion | `bootPlayed` = true; `sessionStorage` updated |
| Second visit (sessionStorage set) | `bootPlayed` initialized to true; boot skipped |
| `guidedFlowDismissed` toggle | State updates correctly; persists through zone transitions |

---

## 5. UI Interaction Testing

UI interaction tests use React Testing Library and run against mounted component trees with mocked store state. They test user-facing behavior at the component level without requiring a full browser.

### 5.1 Memory Vault — Accordion

| Test | User Action | Expected Outcome |
|---|---|---|
| Expand card | Click collapsed card | Card expands; expanded content visible |
| Collapse card | Click expanded card | Card collapses; expanded content hidden |
| Dismiss via × button | Click × on expanded card | Card collapses |
| Only one card expanded | Expand card A then card B | Card A collapses; card B expands |
| Architecture toggle | Click architecture toggle on expanded card | Architecture section appears/disappears independently |
| Deep Mode: all expanded | Set mode to Deep | All cards render expanded; × buttons absent |
| Demo link: null | Render card with `demoUrl: null` | No link element rendered |
| Demo link: present | Render card with valid `demoUrl` | Link rendered; `target="_blank"` present |

### 5.2 Neural Graph — Interaction

| Test | User Action | Expected Outcome |
|---|---|---|
| Node click | Click a graph node | `NodeDetailPanel` renders with correct skill data |
| Node click again | Click same node | Panel closes; `selectedNodeId` = null |
| Click elsewhere | Click SVG background | Panel closes |
| Hover node | Hover over node | Non-adjacent nodes dimmed; adjacent nodes full opacity |
| Hover end | Mouse-leave node | All nodes return to default opacity |
| Recruiter Mode render | Set mode to Recruiter | `GraphListFallback` renders; `GraphCanvas` absent |
| Quiz modal trigger | Click "Test this skill" in panel | `openOverlay("quiz-modal")` dispatched |

### 5.3 Terminal — Input and Output

| Test | User Action | Expected Outcome |
|---|---|---|
| Open terminal | Click terminal button in nav | Terminal overlay visible; input focused |
| Type and submit | Type "help", press Enter | Input entry + output entry in history |
| Unknown command | Type "foo", press Enter | Error entry in history |
| Tab autocomplete: unique match | Type "pr", press Tab | Input buffer = "projects" |
| Tab autocomplete: multiple matches | Type "s", press Tab | Disambiguation output appended to history |
| Tab autocomplete: empty input | Press Tab with empty input | No change |
| Arrow up | Press ↑ | Input buffer = last submitted command |
| Arrow up multiple | Press ↑ × 3 | Input buffer = third-to-last submitted command |
| Clear command | Submit "clear" | History array empty; terminal visible |
| Exit command | Submit "exit" | Terminal overlay hidden |
| Click outside | Click backdrop | Terminal overlay hidden |

### 5.4 Control Room — Metrics and Navigation

| Test | User Action | Expected Outcome |
|---|---|---|
| Metric hover | Hover over metric badge | Tooltip appears after 200ms delay |
| Metric hover-out | Mouse-leave metric badge | Tooltip dismissed |
| View Skills CTA | Click "View Skills" | `navigateTo("neural-graph")` dispatched |
| Open Projects CTA | Click "Open Projects" | `navigateTo("memory-vault")` dispatched |
| Status badge | On mount | Pulse animation active; stops after 3s |

### 5.5 Mode Selector

| Test | User Action | Expected Outcome |
|---|---|---|
| Switch mode | Click Recruiter mode | `activeMode` = "recruiter"; re-render immediate |
| Switch to current mode | Click active mode | No state change |
| Explorer → Recruiter | Switch mode | Game HUD hidden; mini-map hidden; particle canvas inactive |
| Recruiter → Explorer | Switch mode | Game HUD visible; mini-map available |

### 5.6 Gateway Zone

| Test | User Action | Expected Outcome |
|---|---|---|
| GitHub link | Click GitHub link | Opens in new tab; `rel="noopener noreferrer"` present |
| LinkedIn link | Click LinkedIn link | Opens in new tab; `rel="noopener noreferrer"` present |
| Resume download | Click resume button | Triggers file download for `resume.pdf` |
| Contact email: preferCopy=true | Click contact link | Clipboard write triggered |
| Contact email: preferCopy=false | Click contact link | `mailto:` link behavior |

### 5.7 Boot Sequence

| Test | User Action | Expected Outcome |
|---|---|---|
| First session | No action | Boot sequence renders; control room hidden |
| Boot completion | Animation completes | `markBootPlayed()` called; control room visible |
| `sessionStorage` flag set | Re-mount component | Boot sequence skipped; control room visible immediately |
| Safe Mode | Initialize in Safe Mode | Boot sequence skipped |

---

## 6. Terminal Command Validation Tests

Terminal command validation tests are a distinct subset of unit tests that verify the command registry's complete behavior surface.

### 6.1 Command Completeness

- Every command listed in the product spec has a registered entry.
- Every registered command has a non-empty `description` field (required by `help` output).
- No two commands share a canonical name.
- Aliases do not conflict with canonical names of other commands.

### 6.2 Output Correctness

For each command:

- Output is a non-empty string.
- Output does not contain `undefined` or `[object Object]` (guards against resolver implementation errors).
- Multi-line output uses `\n` as the line separator (rendering contract).
- `help` output contains each registered command's `name` and `description`.
- `status` output contains the version string and role from `SystemMeta`.
- `projects` output contains each project's `title` and `problem` (one-line).
- `skills` output contains each skill's `label` and `depth` label.

### 6.3 Edge Cases

| Input | Expected Output |
|---|---|
| Empty string | Error string |
| Whitespace only | Error string |
| Command with extra whitespace | Resolved correctly (trim applied) |
| Command with uppercase letters | Resolved correctly (lowercased before lookup) |
| `goto` with valid zone ID | Navigation dispatched; confirmation string returned |
| `goto` with invalid zone ID | Error string; no navigation dispatched |
| `goto` with no argument | Error string explaining usage |

---

## 7. Accessibility Testing

Accessibility testing is automated via axe-core integrated into Playwright end-to-end tests. Audits run against:

- Control Room (default state)
- Memory Vault (collapsed state and one card expanded)
- Neural Graph (graph rendered, one node selected)
- Terminal (open, with history entries)
- Gateway zone

### 7.1 Accessibility Requirements

| Requirement | Verification Method |
|---|---|
| All interactive elements keyboard-accessible | Playwright keyboard navigation test |
| Focus visible on all interactive elements | CSS audit + visual check |
| Terminal input always focused when terminal is open | Playwright: open terminal, assert `document.activeElement` |
| Focus trapped within open overlays | Playwright: Tab key cycles within overlay |
| Focus restored to zone on overlay close | Playwright: close terminal, assert last focused element |
| Graph nodes have `aria-label` with skill name | axe-core automated |
| Color contrast meets WCAG AA | axe-core automated |
| Animated elements have `prefers-reduced-motion` fallback | CSS `@media` rule verified; Playwright emulation |
| No content behind animations only | All content readable in Safe Mode |

---

## 8. Performance Benchmarks

Performance benchmarks are not part of the automated test suite. They run as a separate Lighthouse CI step in the deployment pipeline.

### 8.1 Lighthouse CI Targets

| Metric | Minimum Score / Target |
|---|---|
| Performance score | ≥ 90 |
| Accessibility score | ≥ 95 |
| First Contentful Paint | < 1.0s |
| Time to Interactive | < 3.5s |
| Total Blocking Time | < 200ms |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.05 |

### 8.2 Manual Benchmark: Animation Frame Rate

Measured manually via Chrome DevTools Performance panel on a representative mid-range device (or via CPU throttling at 4×):

| Scenario | Target |
|---|---|
| Zone transition (fade) | ≥ 60fps sustained |
| Neural Graph entry animation | ≥ 60fps sustained |
| D3 simulation active (ticking) | ≥ 60fps sustained |
| Particle canvas active | ≥ 60fps sustained |
| Memory Vault accordion expand | ≥ 60fps sustained |
| Terminal: 50+ entry history scroll | ≥ 60fps sustained |

### 8.3 Bundle Size Benchmarks

Verified via Vite bundle analyzer after each build:

| Chunk | Maximum Size (gzipped) |
|---|---|
| Entry chunk | 150kb |
| Neural Graph chunk (with D3) | 120kb |
| Terminal overlay chunk | 30kb |
| Per-zone chunks (average) | 25kb |
| Total initial load (entry + boot) | 200kb |

If any chunk exceeds its target, the build step logs a warning. Exceeding by more than 20% blocks the deployment pipeline.

---

## 9. Test Execution Model

### 9.1 Local Development

Developers run `vitest` in watch mode during development. All unit and integration tests execute on file save. React Testing Library UI tests run on demand (`vitest run`). Playwright tests run on demand (`playwright test`) — not in watch mode due to browser launch overhead.

### 9.2 CI Pipeline Integration

| Pipeline Stage | Tests Run |
|---|---|
| On every push | Unit tests, store slice tests, command registry tests |
| On pull request | All unit + integration + UI interaction tests |
| On merge to main | All tests + Playwright E2E + Lighthouse CI |

### 9.3 Test File Colocation

Test files are colocated with the code they test, using the `.test.ts` / `.test.tsx` suffix convention. Zone-specific tests live in the zone directory alongside the components they test. Store slice tests live in `/core/store`. Command registry tests live in `/core/utils`.

A single `/tests/e2e` directory at the project root contains all Playwright end-to-end test files, which by their nature span multiple components and zones.
