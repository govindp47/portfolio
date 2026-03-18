# 07 — Performance and Optimization

**Product:** GovindOS v3.0  
**Document Type:** Performance Architecture, Optimization Strategies, and Fallback Contracts

---

## 1. Performance Philosophy

GovindOS is an interaction-heavy application with multiple competing rendering concerns: a force-directed graph simulation, a canvas-based particle system, Framer Motion layout animations, and dynamic terminal output — all potentially active within the same session. Performance decisions must account for this concurrency.

The governing principle is **isolation over optimization**: performance is preserved first by preventing interference between rendering systems, and second by optimizing individual systems. A poorly isolated fast system degrades the entire frame budget; a well-isolated slower system does not.

Three hard constraints drive all decisions:

- The application must maintain 60fps during zone transitions and all interactive states.
- Boot sequence must complete in under 3 seconds on a mid-range device on a standard broadband connection.
- Heavy zones (Neural Graph) must not penalize initial load time.

---

## 2. Bundle Architecture and Splitting

### 2.1 Chunk Strategy

The build produces the following chunk topology:

```
Entry chunk (eagerly loaded):
  - App shell
  - Core store (Zustand slices)
  - Core types and hooks
  - Design system components
  - Content loader utility
  - Zone registry (references only — not zone code)

Pre-fetched chunks (loaded during boot window, not blocking):
  - neural-graph (includes D3.js — largest dependency)
  - terminal overlay
  - control-room zone

Lazy chunks (loaded on first navigation):
  - memory-vault
  - timeline-tunnel
  - arena
  - gateway
  - quiz-modal
```

### 2.2 D3.js Isolation

D3 is imported only within the Neural Graph zone chunk. No other zone or core module imports D3. This confines the D3 bundle weight (~75kb minified + gzipped) to a single chunk that is pre-fetched during boot, never blocking the entry render.

Vite's `manualChunks` configuration explicitly assigns the `d3` package and all its sub-modules to the `neural-graph` chunk.

### 2.3 Framer Motion Tree-Shaking

Only the Framer Motion APIs in use are imported: `motion`, `AnimatePresence`, `useReducedMotion`, `useAnimation`. The full Framer Motion bundle is not imported. Vite's tree-shaking handles elimination of unused exports given named imports.

### 2.4 Content File Loading

Content JSON files are fetched as standard network requests (not bundled). They are fetched in parallel during the boot window via `Promise.all`. Total content payload is estimated at under 50kb for a complete portfolio dataset. No bundling of content into the JS chunks — content is separately cacheable by the CDN.

---

## 3. Lazy Loading Strategy

### 3.1 React.lazy Boundaries

Every zone component is wrapped in `React.lazy` within `zoneRegistry.ts`. The `Suspense` boundary is placed in `ZonePlane.tsx` with a minimal fallback (transparent — the boot sequence or previous zone content provides the visual during load).

```
Zone navigation triggered
  │
  ▼
ZonePlane reads zoneRegistry[activeZone]
  │
  ▼
If chunk not yet loaded:
  Suspense fallback activates (transparent)
  Chunk downloads in background
  On load: zone mounts, entry animation plays
  
If chunk already loaded (pre-fetched or previously visited):
  Zone mounts immediately, entry animation plays
```

For pre-fetched zones (Control Room, Neural Graph, Terminal), the Suspense fallback is never seen by the user — the chunk is ready before the first navigation.

### 3.2 Pre-fetch Timing

Pre-fetch is triggered using `<link rel="modulepreload">` tags injected into the HTML at build time for the Neural Graph and Terminal chunks. Control Room is in the entry chunk (always available). The browser fetches these in parallel with the entry chunk during the boot sequence window.

For remaining zones, pre-fetch is triggered via `import()` calls (without `await`) at the end of the boot sequence completion handler — after the Control Room is visible and the user is reading the initial state. This uses idle network capacity without competing with the visible render.

---

## 4. Rendering Optimization

### 4.1 Layer Compositing

All four rendering layers are promoted to their own GPU compositing layers via `will-change: transform` applied to their root elements. This ensures that repaints within one layer (e.g., a zone content update) do not trigger repaints in adjacent layers (e.g., the HUD or ambient plane).

The ambient particle canvas is always on its own composited layer by virtue of being a `<canvas>` element. No additional `will-change` is needed.

### 4.2 React Rendering Boundaries

`React.memo` is applied to the following components where re-render frequency is high and props change infrequently:

- `NavItem` — re-renders only when `activeZone` changes for its specific zone ID.
- `MetricBadge` — static content; never re-renders after mount.
- `GraphNode` and `GraphEdge` — re-render only when `hoveredNodeId` or `selectedNodeId` changes.
- `TerminalEntry` — historical entries are immutable; memoization prevents re-rendering the entire history on each new entry.

`GraphNode` and `GraphEdge` receive only their position-independent props from React. Position updates are applied directly by D3's selection API, bypassing React entirely.

### 4.3 D3 / React Boundary

The D3 force simulation operates entirely outside React's render cycle. The boundary is enforced as follows:

- React renders the SVG structure (node and edge elements) on mount.
- D3 attaches to these elements via refs and manages `cx`, `cy`, `x1`, `y1`, `x2`, `y2` attribute mutations directly.
- React never reads back position state from D3. Positions are not stored in React state.
- On interaction events (hover, click), React local state is updated (`hoveredNodeId`, `selectedNodeId`). React re-renders only the affected nodes' visual attributes (opacity, stroke). D3 is not involved in interaction re-renders.

This strict boundary means D3 ticks at 60fps without causing any React re-renders.

### 4.4 Zustand Subscription Granularity

Components subscribe to the minimum required slice of the Zustand store. No component subscribes to the entire store object. Selector functions are stable (defined outside the component or via `useCallback`) to prevent unnecessary re-subscriptions.

High-frequency state that changes rapidly (e.g., `inputBuffer` in the terminal) is handled via local state within `TerminalInput` and only written to the store on command submission — not on every keystroke.

---

## 5. Animation Performance

### 5.1 Animation Property Constraint

All Framer Motion and CSS animations are restricted to `opacity` and `transform` properties only. No animation touches `height`, `width`, `margin`, `padding`, `top`, `left`, or any property that triggers layout reflow.

The sole exception is Framer Motion's `layout` prop for accordion behavior in Memory Vault. Framer Motion handles this via `transform` internally using FLIP (First, Last, Invert, Play) — no layout reflow occurs during animation.

### 5.2 Animation Frame Budget

The target frame budget per frame is 16.67ms (60fps). Expected costs:

| System | Per-Frame Cost (estimated) | Notes |
|---|---|---|
| Particle canvas | 1–2ms | Canvas 2D, 50–80 particles |
| D3 simulation tick | 0.5–1ms | Only during active simulation |
| Framer Motion transitions | 1–3ms | Only during active transitions |
| React reconciliation | 0.5–2ms | Minimal; memoized components |
| HUD / nav re-render | <0.5ms | Infrequent; mode-change triggered |

Peak frame cost during Neural Graph entry animation (D3 running + Framer Motion fade-in simultaneously): estimated 5–7ms — within budget.

### 5.3 Particle System Optimization

The particle canvas applies the following optimizations:

- Particle count adapts to device capability. On initialization, a 100ms benchmark renders a fixed particle count and measures the elapsed time. If it exceeds a threshold, particle count is halved. This check runs once on startup.
- The canvas animation loop uses `requestAnimationFrame` and checks the Page Visibility API state on each frame. When the tab is hidden, the loop calls `cancelAnimationFrame` and suspends. It resumes via the `visibilitychange` event.
- Particle state (position, velocity, opacity) is stored in plain typed arrays (`Float32Array`) for cache-efficient iteration, not in an array of objects.
- Canvas context state changes (fillStyle, globalAlpha) are batched — a single `fillStyle` is set per frame, not per particle.

### 5.4 Terminal Output Performance

Terminal history is virtualized. Only entries within the scroll viewport plus a 5-entry overscan are rendered in the DOM. As the history grows, DOM node count remains bounded at approximately 20–30 nodes regardless of session length.

The virtualization implementation uses a fixed-height container with absolute-positioned entries. Variable-height output entries (multi-line command results) are measured on first render via a `ResizeObserver` and cached in a `Map<timestamp, number>`. Subsequent renders use the cached height.

### 5.5 Memory Vault Layout Animation

Framer Motion FLIP layout animations are efficient but require a layout read before each animation. To prevent layout thrash:

- All project card containers apply `layout` prop to a single wrapping element only, not to all internal children.
- The expanded content (`ProjectExpanded`) uses `opacity` + `y` animation only — no layout animation on the internal detail elements.
- Cards use `layoutId` to enable smooth reflow when the accordion state changes.

---

## 6. Initial Load Performance

### 6.1 Critical Render Path

```
Browser loads HTML
  │
  ├── Preloads: font files, neural-graph chunk, terminal chunk (modulepreload)
  │
  ▼
Entry JS chunk executes:
  - Zustand store initialized
  - Content files fetched (parallel)
  - Boot sequence component mounts
  │
  ▼
Boot sequence plays (2–3s window):
  - Content files finish loading
  - Pre-fetched chunks arrive
  │
  ▼
Boot completes:
  - Control Room mounts with entry animation
  - Content is available in store
  - All pre-fetched chunks are ready
```

No content is displayed before the boot sequence completes. The boot window is the loading window — no separate loading state is required or shown.

### 6.2 Font Loading

The monospace font (used in terminal and boot sequence) and the heading font are both preloaded via `<link rel="preload" as="font">`. Both use `font-display: swap` to prevent FOIT. Since the boot sequence uses monospace heavily, the preload ensures the font is available before the boot animation begins rendering text.

### 6.3 First Contentful Paint Target

FCP target: under 1 second (boot overlay with minimal CSS-rendered content appears immediately). The boot overlay is CSS-only for its first frame — no JavaScript-dependent content — so it paints before JS finishes executing.

### 6.4 Resume PDF

The resume PDF is a pre-generated static file served from the CDN. It is not loaded at application startup — only when the user triggers the download action. No prefetch is applied.

---

## 7. Device-Adaptive Rendering

### 7.1 Mobile Behavior

Mobile devices (viewport width < 768px) initialize in Recruiter Mode behavior regardless of stored session preference. This decision is made once at application startup in the `modeSlice` initialization and is not re-evaluated during the session.

Consequences of mobile initialization:

- Ambient particle system: inactive (canvas never initialized)
- Game layer: inactive
- Neural Graph: renders list fallback (D3 never initialized)
- Timeline: vertical stack layout
- Animation level: reduced (fade only)

### 7.2 Performance Tier Detection

On startup, a lightweight performance tier detection runs:

```
Detection sequence (runs once, before boot sequence):

1. Check navigator.hardwareConcurrency
   < 4 cores → low-tier flag

2. Check deviceMemory API (if available)
   < 4GB → low-tier flag

3. Canvas benchmark (100ms timeout):
   Render test pattern on offscreen canvas
   If elapsed > threshold → low-tier flag

Result:
  Any low-tier flag set → activate Safe Mode defaults:
    - Particle count: 0 (system inactive)
    - Animation level: reduced
    - D3 simulation: alpha decay increased (settles faster)
```

The user can always manually override the detected mode via the mode selector.

### 7.3 `prefers-reduced-motion` Handling

`prefers-reduced-motion: reduce` is treated identically to Safe Mode for animation purposes. Framer Motion's `useReducedMotion` hook is checked in every animated component. CSS `@media (prefers-reduced-motion: reduce)` overrides all keyframe animations globally. These checks are additive — both the OS-level preference and the in-app mode setting can independently suppress animations.

---

## 8. Caching and Asset Strategy

### 8.1 Cache-Control Headers

| Asset Type | Cache Strategy |
|---|---|
| HTML entry file | `no-cache` (always revalidated) |
| JS chunks (hashed filenames) | `immutable, max-age=31536000` |
| Content JSON files | `max-age=86400` (1 day; revalidated on next visit) |
| Font files | `immutable, max-age=31536000` |
| Resume PDF | `max-age=86400` (1 day) |

Hashed filenames on JS chunks ensure that cache invalidation is automatic on deployment without requiring cache-busting query parameters.

### 8.2 Service Worker

No service worker is implemented in the initial version. The application is not designed for offline use. If offline capability becomes a requirement in a future version, a Workbox-based service worker can be added without architectural changes — all assets are already static and cacheable.

---

## 9. Fallback Strategies

### 9.1 Content Load Failure

If one or more content JSON files fail to load:

- The failed content type defaults to an empty array in the content slice.
- Zones that depend on the failed content render an empty state (no error boundary crash).
- A console warning is logged identifying the failed file.
- The boot sequence completes normally — content failure does not block the UI.

### 9.2 D3 Initialization Failure

If D3 fails to initialize the force simulation (e.g., malformed edge data references a non-existent node ID):

- The simulation is aborted.
- `NeuralGraphZone` falls back to `GraphListFallback` automatically.
- The error is caught in the `useForceSimulation` hook's error boundary and logged.

### 9.3 Canvas Unavailability

If `canvas` is not supported (rare in target environments) or the 2D context cannot be acquired:

- `ParticleCanvas` renders null.
- `AmbientPlane` continues to render `BackgroundGrid` (CSS-only).
- No error is surfaced to the user.

### 9.4 Animation Library Failure

Framer Motion failures (e.g., import error) would cause affected components to fail rendering. To guard against this, zone root components wrap their Framer Motion usage in a try-catch equivalent error boundary. If the animation wrapper fails, the zone content renders without animation. This is a last-resort fallback and is not expected in normal operation.

---

## 10. Performance Monitoring Targets

The following metrics define the performance contract for the application:

| Metric | Target | Measurement Method |
|---|---|---|
| First Contentful Paint | < 1.0s | Lighthouse / Web Vitals |
| Boot sequence complete | < 3.0s | Manual timing from FCP to Control Room visible |
| Zone transition duration | < 350ms | Framer Motion animation duration + buffer |
| Neural Graph ready (after navigation) | < 500ms | Time from navigation trigger to simulation stable |
| Frame rate during interaction | ≥ 60fps | Chrome DevTools Performance panel |
| JS entry chunk size | < 150kb gzipped | Vite bundle analyzer |
| Neural Graph chunk size (with D3) | < 120kb gzipped | Vite bundle analyzer |
| Total content payload | < 50kb | Network tab |
| Terminal render (100 entries) | < 16ms | React Profiler |
