# 03 — Data Model and Content Structure

**Product:** GovindOS v3.0  
**Document Type:** Normalized Content Schema and Entity Relationship Definition

---

## 1. Data Architecture Principles

All content in GovindOS is **authored, static, and session-loaded**. There is no backend database, no user-generated content, and no live data fetching after initialization. The content layer is a set of normalized JSON files that are loaded once during the boot sequence window and held in the global state store for the duration of the session.

The schema is designed around three constraints:

- **Rendering contract** — Each content entity must carry exactly the fields required by its consuming zone component; no ad hoc field access at render time.
- **Relationship integrity** — Cross-entity references (e.g., skills referenced from projects) use stable ID keys, not inline duplication.
- **Extensibility** — Adding new entries to any content type requires no structural code change; only the JSON source file is modified.

---

## 2. Content File Map

| File | Consumed By | Entity Type |
|---|---|---|
| `projects.json` | Memory Vault | `Project[]` |
| `skills.json` | Neural Graph, Terminal | `Skill[]` |
| `edges.json` | Neural Graph | `SkillEdge[]` |
| `timeline.json` | Timeline Tunnel | `TimelineEntry[]` |
| `arena.json` | Arena | `ArenaProfile` |
| `meta.json` | Control Room, Terminal, Gateway | `SystemMeta` |

All files are co-located in a `/content` directory at the project root, treated as static assets in the Vite build.

---

## 3. Project Data Structure (`projects.json`)

Each entry in the projects array represents one engineering project displayed in the Memory Vault.

### Schema: `Project`

```
Project {
  id:               string          // Stable unique identifier (slug format)
  title:            string          // Display name of the project
  problem:          string          // One-line problem statement (collapsed state)
  problemFull:      string          // Full problem description (expanded state)
  constraints:      string[]        // Challenge context items (e.g., "real-time latency at scale")
  architecture:     string          // Architecture summary paragraph (hidden by toggle)
  tradeoffs:        Tradeoff[]      // Explicit decision records
  stack:            string[]        // Tech stack tag identifiers (references Skill.id)
  outcome:          string          // Outcome metric — short form (collapsed)
  outcomeFull:      string          // Full outcome with quantified impact (expanded)
  demoUrl:          string | null   // External demo link; null if not available
  displayOrder:     number          // Render order (complexity/impact signal, not recency)
  skillRefs:        string[]        // Skill IDs associated with this project
}
```

### Schema: `Tradeoff`

```
Tradeoff {
  decision:         string          // What was chosen (e.g., "WebSocket over polling")
  rationale:        string          // Why this decision was made
  consequence:      string          // The known trade-off or cost of this decision
}
```

### Behavioral Notes

- `stack` tag values are display strings only; `skillRefs` holds the typed IDs that link to `skills.json`.
- `displayOrder` is the authoritative sort key — the rendering layer never applies its own sort logic.
- `architecture` is always present but rendered only when the architecture toggle is active.
- `demoUrl: null` suppresses the demo link element entirely — no empty link state.

---

## 4. Skill Graph Schema (`skills.json` + `edges.json`)

The Neural Graph renders from two separate files: a node list and an edge list. These are kept separate to allow independent updates to relationship data without touching node metadata.

### Schema: `Skill`

```
Skill {
  id:               string          // Stable unique identifier (slug format)
  label:            string          // Display name (e.g., "Kotlin", "Jetpack Compose")
  type:             SkillType       // Enum: "language" | "concept" | "domain"
  mastery:          number          // 0–100; drives node color intensity
  depth:            DepthLevel      // Enum: "familiar" | "advanced" | "expert"
  confidence:       number          // 0–100; displayed as "Confidence: X%"
  description:      string          // Short metadata shown in node detail panel
  projectRefs:      string[]        // Project IDs where this skill appears
}
```

### Schema: `SkillEdge`

```
SkillEdge {
  source:           string          // Skill.id of the source node
  target:           string          // Skill.id of the target node
  weight:           number          // 0–1; drives edge thickness at render time
  relationshipType: RelType         // Enum: "uses" | "extends" | "enables" | "relates-to"
}
```

### Behavioral Notes

- `mastery` maps to a color intensity scale defined in the rendering system; it is not displayed numerically.
- `confidence` is the user-facing precision metric, shown in the node detail panel.
- `depth` is the categorical label shown alongside confidence.
- `weight` on edges is a normalized float; the rendering system maps this to a stroke-width range.
- `projectRefs` allows the node detail panel to surface associated projects without a graph traversal query.
- Edges are undirected for layout purposes; `relationshipType` is metadata only and does not affect force simulation.

---

## 5. Timeline Model (`timeline.json`)

The Timeline Tunnel renders a horizontally scrollable sequence of career and education entries.

### Schema: `TimelineEntry`

```
TimelineEntry {
  id:               string          // Stable unique identifier
  type:             EntryType       // Enum: "work" | "education"
  organization:     string          // Company or institution name
  role:             string          // Job title or degree/program name
  duration:         string          // Human-readable duration (e.g., "1.5 years")
  startDate:        string          // ISO 8601 date string (for sort order)
  endDate:          string | null   // null if current position
  highlights:       string[]        // Key features built or academic achievements
  impact:           string[]        // Measurable outcomes (e.g., "Improved performance by 40%")
  technologies:     string[]        // Skill IDs used in context during this entry
  isCurrent:        boolean         // Drives "Present" label vs. endDate display
}
```

### Behavioral Notes

- Entries are sorted by `startDate` descending at load time; the render layer consumes a pre-sorted array.
- `highlights` and `impact` are only rendered in the expanded state.
- `technologies` references `Skill.id` values; the rendering layer resolves display labels from the skill store.
- Education entries follow the same schema; the `role` field holds the degree/program name, and `highlights` holds coursework or thesis focus areas.

---

## 6. Arena Profile Model (`arena.json`)

The Arena zone renders a single structured profile object rather than an array of entries.

### Schema: `ArenaProfile`

```
ArenaProfile {
  platforms:        PlatformRating[]
  difficultyBreakdown: DifficultyBand[]
  patterns:         SolvedPattern[]
  featuredProblem:  FeaturedProblem
  certifications:   CertificationGroup[]
}
```

### Schema: `PlatformRating`

```
PlatformRating {
  platform:         string          // e.g., "Codeforces", "LeetCode"
  rating:           number          // Numeric contest rating
  context:          string          // Contextual framing (e.g., "Top X% globally")
  profileUrl:       string          // External profile link
}
```

### Schema: `DifficultyBand`

```
DifficultyBand {
  label:            string          // e.g., "Easy", "Medium", "Hard"
  count:            number          // Number of problems solved in this band
  percentage:       number          // Proportion of total solved
}
```

### Schema: `SolvedPattern`

```
SolvedPattern {
  pattern:          string          // Algorithmic pattern name (e.g., "Dynamic Programming")
  count:            number          // Problems solved in this category
  problemRefs:      string[]        // Display titles of representative problems (not links)
}
```

### Schema: `FeaturedProblem`

```
FeaturedProblem {
  title:            string          // Problem name
  platform:         string          // Source platform
  difficulty:       string          // Difficulty label
  problemStatement: string          // Brief problem description
  approach:         string          // Reasoning walkthrough paragraph
  complexity:       ComplexityNote  // Time and space complexity
  keyInsight:       string          // The core insight that unlocks the solution
}
```

### Schema: `ComplexityNote`

```
ComplexityNote {
  time:             string          // e.g., "O(n log n)"
  space:            string          // e.g., "O(n)"
}
```

### Schema: `CertificationGroup`

```
CertificationGroup {
  domain:           string          // Group label (e.g., "Android Development")
  items:            Certification[]
}
```

### Schema: `Certification`

```
Certification {
  title:            string          // Certification or course name
  issuer:           string          // Issuing organization
  focus:            string          // Focus summary (not just the title repeated)
  year:             number          // Year completed
}
```

### Behavioral Notes

- `difficultyBreakdown` powers the interactive difficulty chart; `count` is revealed on hover per band.
- `patterns` are interactive — clicking a pattern surfaces `problemRefs` as a list.
- `featuredProblem` is rendered only when the "Deep Dive" toggle is active.
- Certifications are never rendered as a flat list; they are always grouped by `domain`.

---

## 7. System Meta Model (`meta.json`)

The `meta.json` file holds all static display values used in the Control Room, Terminal `status` command output, and Gateway zone.

### Schema: `SystemMeta`

```
SystemMeta {
  name:             string          // "Govind" or full name
  version:          string          // OS version string (e.g., "3.0")
  role:             string          // Current role label
  stack:            string          // Stack summary (e.g., "Android | Backend")
  metrics:          MetricItem[]    // Control Room dashboard values
  contact:          ContactInfo
  links:            ExternalLinks
  resumeAssetPath:  string          // Path to the static PDF resume asset
}
```

### Schema: `MetricItem`

```
MetricItem {
  label:            string          // Display label (e.g., "Projects Deployed")
  value:            string          // Display value (e.g., "18" or "50+")
  tooltip:          string          // Brief context shown on hover
}
```

### Schema: `ContactInfo`

```
ContactInfo {
  email:            string          // Contact email address
  preferCopy:       boolean         // If true, clicking copies to clipboard; else opens mail client
}
```

### Schema: `ExternalLinks`

```
ExternalLinks {
  github:           string          // Full GitHub profile URL
  linkedin:         string          // Full LinkedIn profile URL
}
```

---

## 8. Content Normalization Strategy

### ID Conventions

All entity IDs use **kebab-case slug format** (e.g., `jetpack-compose`, `realtime-chat-app`). IDs are stable across content updates — no auto-generated or sequential IDs. Renaming an ID requires a search-and-replace across all files that reference it.

### Cross-Entity References

Cross-references between entities are always expressed as **ID arrays** (`skillRefs`, `projectRefs`, `technologies`). The application resolves display labels from the in-memory store at render time. The JSON files never inline entity data from another file.

### No Denormalization at Source

Data is never duplicated across content files. If a skill name changes, it changes in one place (`skills.json`) and all referencing zones pick up the update via ID resolution.

### Null vs. Absent Fields

Fields that are conditionally present (e.g., `demoUrl`, `endDate`) use explicit `null` values rather than omission. This makes the rendering layer's conditional logic explicit and prevents undefined-access errors.

---

## 9. Relationships Between Entities

```
SystemMeta
  └── (standalone — no cross-references)

Project
  ├── stack[]         → display strings (no ID resolution)
  └── skillRefs[]     → Skill.id

Skill
  └── projectRefs[]   → Project.id

SkillEdge
  ├── source          → Skill.id
  └── target          → Skill.id

TimelineEntry
  └── technologies[]  → Skill.id

ArenaProfile
  └── (self-contained — no cross-references to other entity types)
```

The graph formed by these relationships is intentionally **sparse and unidirectional** in reference direction. No circular dependencies exist at the schema level.

---

## 10. Content Loading Strategy

Content files are fetched in parallel during the boot sequence window via `Promise.all`. The loaded data is validated against the expected schema shape (field presence checks, not deep type validation) before being committed to the global state store. If any file fails to load, the application falls back to an empty array for that content type and logs a warning — it does not crash.

The boot sequence's perceived duration (~2–3 seconds) provides a natural loading window; no separate loading state is required for content beyond the boot overlay itself.
