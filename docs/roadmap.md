# Roadmap (Non-Binding)

This roadmap is intentionally lightweight. It describes **small, composable micro-projects** that move the system toward the doctrine and tech design without committing to a brittle plan.

Principles:

- **Viability first**: every step preserves a quiet baseline and keeps `npm run check` green.
- **Regulation over optimization**: we add regulation primitives, not planning features.
- **Configure boundaries, not mechanisms**: policy is explicit; the machinery stays simple.
- **Baseline is the goal**: "nothing happening" is success.

---

## Completed

- [x] **MP1**: Memory (ontology + persistence)
- [x] **MP2**: Regulator (policy + constraints + mutations)
- [x] **MP3**: CLI + Sensorium stub (orchestration + status/signal/act)

---

## Next Micro-Projects

### MP4 — Episode Lifecycle (Open/Close Commands + Timestamps)

- [x] **Complete**

**Goal**: Make Episodes meaningfully "temporary" with explicit closure, timestamps, and CLI commands to drive the full lifecycle.

**Scope**

- Add CLI commands: `becoming open` and `becoming close`
- Add minimal fields to `Episode`: `openedAt`, optional `closedAt`, optional `closureNoteId`
- CLI generates `episodeId` and passes to Regulator
- Keep status machine small and explicit (const assertions, narrow transitions)

**Acceptance**

- Can open an episode via CLI, see it in `status`, close it via CLI
- New fields are persisted and migrated cleanly
- Tests cover: creating an episode sets `openedAt`; closing sets `closedAt`; constraints enforced

---

### MP5 — Episode Closure Produces Learning (Notes as Closure Artifacts)

- [x] **Complete**

**Goal**: When an Episode closes, something explicit is produced (at minimum: a closure Note).

**Scope**

- `close` command requires a note (e.g., `--note "What I learned"`)
- Regulator mutation creates a Note and links it via `closureNoteId`
- Keep it cybernetically honest: "learning exists only if an explicit artifact exists."

**Acceptance**

- Closing an episode requires and attaches a `closureNoteId`
- Tests demonstrate: closing creates/links a Note and returns a new State immutably

---

### MP6 — Models v0 (Descriptive/Procedural/Normative as First-Class Objects)

- [ ] **Complete**

**Goal**: Introduce **Models** as explicit artifacts so learning is queryable.

**Scope**

- Add `Model` to the ontology with `type: Descriptive | Procedural | Normative`
- Include fields from tech-spec:
  - `statement: string` — the belief content
  - `confidence?: number` — 0.0 to 1.0, how certain
  - `scope?: "personal" | "org" | "domain"` — where the belief applies
- Add minimal Regulator mutations: create model, update model, attach model updates to an Episode closure
- Normative Models may include `enforcement` field (prep for Membrane in MP10)

**Acceptance**

- `State` supports models; JSON store migrates; tests pass
- At least one Regulator test proves "closing an Explore can create/update a Model"
- Models include confidence and scope fields

---

### MP7 — Links v0 (Typed Relationships Between Objects)

- [ ] **Complete**

**Goal**: Move toward a graph-relational memory without switching storage yet.

**Scope**

- Introduce a `Link` object with fields from tech-spec:
  - `id: string`
  - `sourceId: string` — object reference
  - `targetId: string` — object reference
  - `relation: string` — e.g., `"supports" | "tests" | "blocks" | "responds_to"`
  - `weight?: number` — optional strength/confidence of relationship
- Add minimal validation: links must reference existing objects

**Acceptance**

- Links can be created and persisted
- Tests prove referential integrity and "no silent mutation"
- Relation types are validated (const assertion for known types)

---

### MP8 — CLI Status v1 (Still Quiet, More Legible When Not Baseline)

- [ ] **Complete**

**Goal**: Make the non-baseline dashboard genuinely useful while remaining boring at baseline.

**Scope**

- Only surface:
  - Variables for node
  - Active Episodes
  - Episode-scoped Actions for active episodes
  - (Optionally) closure notes / model diffs

**Acceptance**

- Baseline output remains minimal
- Non-baseline output is structured and testable (snapshot tests or string assertions)

---

### MP9 — Sensorium v1 (Observations vs Commands)

- [ ] **Complete**

**Goal**: Upgrade Sensorium from "CLI parsing" to "ingestion + normalization," producing structured Observations.

**Scope**

- Add an `Observation` type (e.g., `variableProxySignal`, `freeformNote`, `episodeProposal`)
- CLI converts Observations into explicit Regulator mutations (no implicit state changes)

**Acceptance**

- Tests prove invalid input cannot silently mutate ontology
- At least one path: observation → note created or variable status updated (explicitly)

---

### MP10 — Membrane v0 (Validation Gates + Exception Legibility)

- [ ] **Complete**

**Goal**: Add a boundary organ that enforces "what will not be done" as constraints, not identity.

**Scope**

- Create `src/libs/membrane/*` with explicit validation gates (start simple: synchronous rules)
- Integrate with Normative Models from MP6:
  - `enforcement: "none" | "warn" | "block"` — how strictly to enforce
  - `exceptionsAllowed: boolean` — whether exceptions can be logged
- Introduce "exception required" behavior as explicit artifacts (notes/models), not hidden flags
- Membrane checks Normative Models before allowing mutations

**Acceptance**

- CLI routes mutations through Membrane before Regulator mutation (as policy)
- Tests cover: blocked action, allowed action with explicit exception note
- Normative Models with `enforcement: "block"` prevent actions unless exception logged

---

### MP11 — Signaling v0 (Federation Skeleton)

- [ ] **Complete**

**Goal**: Prepare a network of organisms without building a full distributed system yet.

**Scope**

- Define a minimal event envelope (Node identity, event id, type, payload, timestamp)
- Implement "append-only events" locally (file-based) as a stepping stone

**Acceptance**

- Events can be emitted/consumed locally
- Tests prove idempotency and basic validation of envelopes

---

### MP12 — Web UI (Only After the Data and Rules Are Honest)

- [ ] **Complete**

**Goal**: Add a UI only after the underlying organism is stable and legible.

**Scope**

- Build a Next.js interpretive surface (read-only first)
- Preserve baseline quiet and avoid adding planning affordances

**Acceptance**

- UI can visualize the same Status semantics as the CLI
- No new authority is introduced (UI is awareness, not planning)

---

### MP-AUTO — Automation v0 (Procedural Model Execution)

- [ ] **Complete**

**Status**: Proposed (see [ADR 0003](decisions/0003-automation-philosophy.md))

**Goal**: Enable Procedural Models to execute trusted behaviors under Membrane constraints, without replacing regulation or learning.

**Scope**

- Extend `ProceduralModel` with automation fields:
  - `automationLevel: 0 | 1 | 2` — earned trust level
  - `trigger?: TriggerCondition` — when to evaluate (event type, state pattern)
  - `chain?: string[]` — optional sequence of Procedural Model IDs for composition
- Create `src/libs/executor/*` — execution engine for Procedural Models:
  - Evaluates triggers against incoming Observations
  - Routes every execution through Membrane before external action
  - Logs results back to Memory as Notes (Level 0/1) or completed Actions (Level 2)
- Approval queue:
  - Level 0: Creates draft Note only
  - Level 1: Creates Note with `tag: "pending_approval"`, surfaced during review
  - Level 2: Executes in narrow envelope, logs result
- Static chain composition only (no runtime assembly)

**Invariants**

- ❌ Automation never opens Episodes
- ❌ Automation never modifies Models directly
- ❌ Automation never bypasses Membrane
- ✅ Automation serves baseline; Episodes serve learning

**Acceptance**

- A Procedural Model with `automationLevel: 1` creates an approval Note when triggered
- A Procedural Model with `automationLevel: 2` executes and logs without human intervention
- Membrane blocks execution if linked Normative Model has `enforcement: "block"`
- Tests cover: trigger matching, Membrane gating, approval flow, chain execution, logging

**Dependencies**

- MP6 (Models) — Procedural Models must exist
- MP9 (Sensorium v1) — Observations as trigger source
- MP10 (Membrane) — Constraint enforcement

---

## Phase 2: World Model Layer (Future)

Phase 1 (MP1–MP12, MP-AUTO) establishes the **regulatory layer** — how the organism regulates itself. Phase 2 introduces the **world model layer** — how the organism represents and reasons about its external environment.

### Motivation

To regulate effectively, the system needs to understand context. Descriptive Models need something to describe. Procedural Models need domains to apply to. The current ontology can represent beliefs (Models) but not the _entities_ those beliefs are about.

Phase 2 enables:

- Structured representation of external entities (people, projects, domains, concepts)
- User-defined schemas for new object types
- Rich querying and reasoning over the knowledge graph
- Models that reference specific entities

### Architectural Principle: Two-Layer Ontology

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGULATORY LAYER (Fixed)                     │
│  Variables · Episodes · Actions                                 │
│  → "How the organism regulates itself"                          │
│  → Closed ontology, hard-coded constraints                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ references
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORLD MODEL LAYER (Dynamic)                  │
│  Entities · Schemas · Links · Models · Notes                    │
│  → "What the organism believes about reality"                   │
│  → Open ontology, user-defined schemas                          │
└─────────────────────────────────────────────────────────────────┘
```

The regulatory layer remains **minimal and fixed**. The world model layer is **extensible** — it grows as the organism learns about its environment.

---

### MP13 — Schemas v0 (User-Defined Object Types)

- [ ] **Complete**

**Goal**: Allow users to define new object types with structured fields.

**Scope**

- Add `Schema` to the ontology: `{ id, name, fields: SchemaField[] }`
- `SchemaField`: `{ name, type: "string" | "number" | "boolean" | "date" | "reference", required?, referenceSchemaId? }`
- Schemas are stored in State and validated on load

**Acceptance**

- Can create a Schema via CLI or programmatically
- Schema definitions persist and migrate cleanly
- Tests cover: valid schema creation, field type validation

---

### MP14 — Entities v0 (Instances of Schemas)

- [ ] **Complete**

**Goal**: Allow creation of entities that conform to user-defined schemas.

**Scope**

- Add `Entity` to the ontology: `{ id, schemaId, data: Record<string, unknown>, createdAt }`
- Validation: entities must conform to their schema's field definitions
- Basic CRUD operations in Regulator

**Acceptance**

- Can create an Entity referencing a Schema
- Validation rejects entities with missing required fields or wrong types
- Entities can reference other entities via `reference` fields

---

### MP15 — Entity References in Core Objects

- [ ] **Complete**

**Goal**: Allow regulatory objects to reference entities.

**Scope**

- Variables can optionally reference an Entity (e.g., "Agency is Low because of Entity:project-x")
- Episodes can optionally be scoped to an Entity (e.g., "Explore Entity:domain-music")
- Models can reference Entities they describe

**Acceptance**

- Core objects can include `entityRef?: { schemaId, entityId }`
- Tests demonstrate linking and querying

---

### MP16 — Knowledge Graph Queries

- [ ] **Complete**

**Goal**: Enable querying across entities, links, and models.

**Scope**

- Query by schema type: "all Person entities"
- Query by relationship: "all entities linked to Entity:project-x"
- Query models by entity: "all beliefs about Entity:person-john"

**Acceptance**

- Query API returns filtered results
- Performance acceptable for hundreds of entities

---

### MP17 — Schema Evolution

- [ ] **Complete**

**Goal**: Allow schemas to evolve over time without breaking existing entities.

**Scope**

- Add optional fields to existing schemas
- Rename fields with migration
- Deprecate fields gracefully

**Acceptance**

- Schema changes don't corrupt existing entities
- Migration path is explicit and testable

---

### Future Considerations (Beyond MP17)

- **Inference**: Derive new facts from existing entities and models
- **Temporal modeling**: Track entity state over time
- **External sync**: Import/export entities from external systems (Notion, Obsidian, etc.)
- **AI-assisted modeling**: Suggest schemas and entities from unstructured notes

---

## Phase 3: Autonomous Regulator (Future)

Phase 1 builds the core regulatory machinery (command-driven). Phase 2 adds the world model. Phase 3 upgrades the Regulator to be **autonomous** — it can evaluate pressure, propose interventions, and manage episodes without explicit user commands.

### Motivation

The tech-spec describes a Regulator that:

- Evaluates Variable states against thresholds
- Detects pressure and uncertainty
- Selects candidate Episodes automatically
- Operates as an explicit state machine

Phase 1's Regulator is reactive (user calls `openEpisode`). Phase 3 makes it proactive.

---

### MP18 — Variable Thresholds (Pressure Detection)

- [ ] **Complete**

**Goal**: Enrich Variables with numeric thresholds so the system can detect pressure automatically.

**Scope**

- Extend `Variable` with fields from tech-spec:
  - `preferredRange?: { min: number, max: number }` — target bounds
  - `stability?: number` — 0.0 to 1.0, how stable over time
  - `confidence?: number` — 0.0 to 1.0, how confident in the reading
  - `proxies?: ProxyRef[]` — what signals inform this variable
- Add `"unknown"` as a valid status (in addition to Low/InRange/High)
- Add pressure scoring function: `calculatePressure(variable) => number`

**Acceptance**

- Variables can define preferred ranges
- Tests demonstrate pressure calculation based on status vs. range
- Migration preserves existing variables (new fields optional)

---

### MP19 — Episode Timebox and Closure Conditions

- [ ] **Complete**

**Goal**: Make Episodes self-expiring with explicit closure conditions.

**Scope**

- Extend `Episode` with fields from tech-spec:
  - `timeboxDays?: number` — how long before episode expires
  - `closureConditions?: string[]` — what must be true to close
  - `linkedModelIds?: string[]` — models this episode should update
  - `linkedConstraintIds?: string[]` — normative models that apply
- Add Episode status: `"abandoned"` (for expired/failed episodes)
- Regulator can flag overdue episodes

**Acceptance**

- Episodes can have timebox; status shows overdue state
- Closure conditions are tracked (human-evaluated for now)
- Tests cover: timebox expiration, closure condition tracking

---

### MP20 — Regulator State Machine

- [ ] **Complete**

**Goal**: Implement the Regulator as an explicit state machine per the tech-spec.

**Scope**

- Define Regulator states:
  - `IDLE` — baseline, no active evaluation
  - `EVALUATING` — scanning Variables for pressure
  - `ASSESSING` — deciding whether to intervene
  - `OPENING_EPISODE` — creating a new Episode
  - `MONITORING` — tracking active Episodes
  - `CLOSING_EPISODE` — completing an Episode
  - `DEFERRING` — choosing not to intervene (with reason)
- State transitions are event-driven and review-driven
- Regulator emits events for each transition (integrates with MP11 Signaling)

**Acceptance**

- Regulator has explicit state that persists
- Transitions are logged/auditable
- Tests cover: full state machine traversal

---

### MP21 — Candidate Episode Selection

- [ ] **Complete**

**Goal**: Regulator can propose Episodes based on system state.

**Scope**

- Implement candidate selection algorithm from tech-spec:
  - Input: Variable pressure scores, uncertainty density, active Episodes, capacity estimates
  - Output: `stabilize` candidate, `explore` candidate, `none`, or `defer(reason)`
- Rules:
  - Critical Stabilize preempts Explore
  - Explore requires surplus capacity
  - `"none"` is a valid and common outcome
- Proposals are surfaced to user (not auto-opened initially)

**Acceptance**

- Regulator can propose candidate Episodes
- Proposals include rationale
- Tests cover: pressure-based selection, capacity constraints, "none" outcome

---

### MP22 — Autonomous Intervention (Optional)

- [ ] **Complete**

**Goal**: Allow Regulator to open Episodes automatically (with user consent).

**Scope**

- Add policy flag: `autoOpenEpisodes: boolean`
- When enabled, Regulator can open Episodes without explicit command
- All auto-opened Episodes are logged with rationale
- User can always close or override

**Acceptance**

- Auto-open can be enabled/disabled per Node
- Auto-opened Episodes include `autoOpened: true` flag
- Tests cover: auto-open respects concurrency limits

---

### Future Considerations (Beyond MP22)

- **Learning velocity tracking**: How fast are Models being updated?
- **Regulator meta-learning**: Adjust thresholds based on Episode outcomes
- **Predictive intervention**: Anticipate pressure before it arrives

---

## Phase 4: Network Infrastructure (Future)

Phase 1–3 assume a single-user, local deployment. Phase 4 evolves the infrastructure to support multiple users, multiple nodes, and network-based coordination.

### Motivation

The current design uses `state.json` for persistence—simple and honest for local use. But if we want:

- Multiple people running their own nodes
- Users creating new Org nodes dynamically
- Nodes coordinating across a network
- A hosted/web version of the system

...we need real infrastructure: database persistence, authentication, and network federation.

### Architectural Principle: Federation Over Centralization

Nodes do not share state. They exchange **signals** and **artifacts**. This means:

- Each node can have its own database (or partition)
- No central source of truth for everyone
- Federation happens at the event layer, not the data layer
- Nodes can be self-hosted or cloud-hosted independently

---

### MP23 — Database Migration (JsonStore → DbStore)

- [ ] **Complete**

**Goal**: Replace file-based persistence with a proper database while maintaining the same API.

**Scope**

- Create `DbStore` implementing the same interface as `JsonStore`
- Support SQLite (local) and PostgreSQL (hosted) as backends
- Migration script to import existing `state.json` files
- Transactions for atomic state updates
- Memory organ's public API unchanged

**Acceptance**

- Existing tests pass with both JsonStore and DbStore
- Migration script successfully imports `state.json`
- Concurrent access is safe (no race conditions)

---

### MP24 — Dynamic Node Creation

- [ ] **Complete**

**Goal**: Allow users to create and manage multiple nodes programmatically.

**Scope**

- API to create new nodes: `createNode({ type, name }) => NodeRef`
- List nodes: `getNodes() => NodeRef[]`
- Delete/archive nodes
- Each node has isolated state (Variables, Episodes, Actions)
- NodeRef uses UUID, not hardcoded defaults

**Acceptance**

- Can create multiple Org nodes dynamically
- Each node has its own isolated state
- CLI supports `--node` flag for all commands

---

### MP25 — Authentication & Authorization

- [ ] **Complete**

**Goal**: Control who can access which nodes.

**Scope**

- User identity (start simple: API keys or JWT)
- Node ownership: each node belongs to a user
- Permission model:
  - Owner: full read/write
  - Collaborator: read + limited write (future)
  - Viewer: read-only (future)
- Membrane enforces auth before mutations

**Acceptance**

- Unauthenticated requests are rejected
- Users can only access their own nodes
- Tests cover permission boundaries

---

### MP26 — Federation v1 (Network Signaling)

- [ ] **Complete**

**Goal**: Nodes can exchange signals over the network.

**Scope**

- Extend MP11's event envelope for network transport
- WebSocket or HTTP-based signal relay
- Node discovery: how nodes find each other
- Signal types: intent, status, completion, artifact reference
- Nodes remain independent—no shared state, only signals

**Acceptance**

- Two nodes can send/receive signals over network
- Signal delivery is at-least-once with idempotency
- Network failures are handled gracefully

---

### MP27 — Codebase Node (Software Organism)

- [ ] **Complete**

**Goal**: Treat the codebase itself as a regulated organism with its own Variables.

**Scope**

- Add `Codebase` as a NodeType (alongside Personal, Org)
- Define software-specific Variables:
  - **Continuity**: builds/tests/deploys run reliably
  - **Agency**: small changes ship without regressions
  - **Optionality**: architecture isn't boxing you in
  - **Coherence**: patterns are consistent, low special-case sprawl
  - **Learning**: you understand why things work; no cargo cult
- Proxies that infer status from CI, static analysis, dependencies
- Episodes for codebase stabilization/exploration

**Acceptance**

- Codebase node can be created and regulated like Personal/Org
- At least one Variable has an automated proxy (e.g., CI status → Continuity)
- Membrane can visualize codebase health as overlay

---

### Future Considerations (Beyond MP27)

- **Multi-node dashboards**: View multiple organisms at once
- **Cross-node artifacts**: Share Models or Notes between nodes
- **Self-hosting guides**: Docker, Railway, Fly.io deployment
- **Mobile/web clients**: Access nodes from anywhere

---

## Nice to Have / Maybe

These are ideas that embody the philosophy but aren't core to the regulatory machinery. They can be pursued when capacity allows or as exploratory side projects.

### Membrane — Living Codebase Visualization

**Status**: Proposed (see [ADR 0002](decisions/0002-membrane-visualization.md))

**Concept**: A web visualization that renders the **codebase itself** as a living organism. Self-discovering, zero configuration, grows automatically as the codebase evolves.

**Key Insight**: This is about **code structure**, not application state. State visualization (Variables, Episodes) belongs in Web UI. Membrane visualizes the code itself.

**What It Shows**:

| Layer          | What You See                                   | Audience          |
| -------------- | ---------------------------------------------- | ----------------- |
| **Organs**     | Auto-discovered modules with data flow arrows  | Anyone            |
| **Files**      | Files within an organ as smaller cells         | Curious observers |
| **Code Graph** | Functions, types, and their call relationships | Developers        |

**Why it fits the philosophy**:

- Organs as living entities → breathing, pulsing animation
- Self-discovering → no manual configuration, grows with codebase
- Plain-language descriptions → non-technical people understand code structure
- Reactive to code changes → save a file, see the organism respond

**Dependencies**: None required—orthogonal to the core MP track.

---

#### MV1 — Foundation (Server + Shell)

- [ ] **Complete**

**Goal**: Establish the dev environment and real-time file watching.

**Scope**

- Add Vite + chokidar + ws as dev dependencies
- Create `src/apps/membrane/` directory structure
- WebSocket server that watches `src/**/*.ts` for code changes
- Minimal HTML shell with dark background and canvas element

**Acceptance**

- `npm run membrane:server` starts WebSocket relay on port 8081
- `npm run membrane:dev` starts Vite dev server
- Browser connects to WebSocket and logs file change events to console

---

#### MV2 — Animation System (Pure Math)

- [ ] **Complete**

**Goal**: Create reusable animation primitives that feel organic.

**Scope**

- Spring physics: `advanceSpring(state, target, config) => newState`
- Breathing cycle: `breathe(time, period) => 0..1`
- Pulse decay: `pulseDecay(age, decayMs) => 0..1`
- Easing functions: `easeOutCubic`, `easeInOutCubic`

**Acceptance**

- All animation functions are pure (no side effects)
- Unit tests verify expected curves and decay behavior

---

#### MV3 — Auto-Discovery (Scan + Parse)

- [ ] **Complete**

**Goal**: Automatically discover organs from the filesystem—no configuration.

**Scope**

- Scan `src/libs/*` → discover organs (core modules)
- Scan `src/apps/*` → discover surfaces (user-facing apps)
- Parse each module's `README.md` to extract:
  - Name (first heading)
  - Description (first paragraph)
  - Philosophy quote (if present)
- Watch for new directories → update organ list in real-time

**Acceptance**

- Adding `src/libs/newOrgan/README.md` makes it appear in the visualization
- No manual JSON configuration required
- Discovery runs on server startup and on directory changes

---

#### MV4 — Organs Layer (Render Discovered Modules)

- [ ] **Complete**

**Goal**: Render discovered organs as living cellular structures.

**Scope**

- Render each organ as a membrane cell with icon and label
- Position organs using a force-directed or circular layout
- Breathing animation on all organs
- Hover: show organ description in plain language
- Click: focus on organ and show philosophy quote

**Acceptance**

- All discovered organs render with names
- Hover shows accessible description from README
- Animation runs continuously

---

#### MV5 — Data Flow Inference (Parse Imports)

- [ ] **Complete**

**Goal**: Infer data flow relationships by parsing import statements.

**Scope**

- For each organ, scan its TypeScript files for imports
- If organ A imports from organ B, create an edge A → B
- Render edges as subtle, pulsing arrows between organs
- Deduplicate and consolidate edges

**Acceptance**

- Import relationships appear as arrows automatically
- Adding an import updates the visualization
- No manual configuration of data flow

---

#### MV6 — Code Change Pulses

- [ ] **Complete**

**Goal**: Make the visualization reactive to source code changes.

**Scope**

- File watcher broadcasts `codeChange` events with organ ID
- Organs pulse/glow briefly when their code is edited
- Pulses decay over ~3 seconds
- Multiple rapid edits stack (brighter pulse)

**Acceptance**

- Editing a file causes the relevant organ to pulse
- Pulses are visible and feel responsive
- Works for any file in any discovered organ

---

#### MV7 — Navigation + Interaction

- [ ] **Complete**

**Goal**: Enable exploration through zoom and click.

**Scope**

- Scroll/pinch to zoom in/out
- Click on organ to focus and reveal details
- Esc key to zoom out or clear focus
- Smooth transitions between states (eased, not instant)

**Acceptance**

- Can navigate between zoom levels with scroll or click
- Esc returns to previous state
- Transitions feel organic

---

#### MV8 — Accessibility Layer (Plain Language)

- [ ] **Complete**

**Goal**: Make the visualization understandable by non-technical viewers.

**Scope**

- Organ descriptions use plain language from READMEs
- Add "What this does" tooltips for each organ
- Philosophy fragments display as ambient floating text
- Legends or hints for first-time viewers

**Acceptance**

- Someone unfamiliar with code understands what each organ does
- No technical jargon in hover states
- Clear visual hierarchy

---

#### MV9 — Files Layer

- [ ] **Complete**

**Goal**: Drill into an organ to see its files as smaller cells.

**Scope**

- Click an organ to zoom into its file structure
- Files rendered as smaller membrane cells
- Recent file changes cause pulses
- Internal files (e.g., `internal/`) slightly dimmed
- Back navigation via Esc or clicking outside

**Acceptance**

- Can navigate: Organs → Files → back to Organs
- Files show names and pulse on save
- Internal vs. public files visually distinct

---

#### MV10 — Code Graph Layer

- [ ] **Complete**

**Goal**: Visualize function-call relationships within a file (AST).

**Scope**

- Parse TypeScript files using compiler API
- Extract functions, types, imports, and call relationships
- Render as node-link diagram within the file view
- Color-code by role: query (read-only), validation, mutation
- Pure functions marked distinctively

**Acceptance**

- Clicking a file shows its internal call graph
- Functions connected by "calls" edges
- Hover shows function signature and JSDoc comment

---

### AI-Assisted Capture (Sensorium Extension)

**Concept**: An LLM-powered layer that converts unstructured input (voice notes, chat messages, raw text) into structured Observations, Notes, and Model proposals.

**Why it fits**: "No automatic ontology mutation" — the AI proposes, human confirms.

**Dependencies**: MP9 (Sensorium v1 with Observations)

---

### Mobile Companion (Read-Only)

**Concept**: A minimal mobile app for glancing at status. No planning affordances—just awareness.

**Why it fits**: "Baseline quiet" — if nothing is wrong, the app shows almost nothing.

**Dependencies**: MP12 (Web UI) or an API layer

---

### Templates & Extensions (Community Sharing)

**Concept**: Enable users to create, share, and import reusable configurations and custom proxy pipelines.

**Two layers**:

1. **Templates** — Shareable bundles of Variable definitions (with preferred ranges, proxies) and related Models. A user who discovers that tracking "Creative Output Momentum" with specific ranges and proxies works well for solo creative work can export that as a template for others to import and adapt.

2. **Custom Proxy Pipelines** — User-defined Sensorium extensions that connect non-native data sources (Garmin, Oura, Notion, custom APIs) to the system. A pipeline defines:
   - A data source connector (API, file watcher, webhook)
   - A transform function (raw data → normalized proxy signal)
   - Metadata (what Variable types it suits, confidence weighting)

**Why it fits**:

- Procedural Models already encode "methods that work" — templates extend this to Variable configurations
- Sensorium is the sensing boundary — plugins extend what it can sense, not what it decides
- Federation supports artifact sharing — templates are just a specialized artifact type
- All imported templates become the user's own objects, immediately subject to revision

**Design constraints**:

- Templates are _starting points for convergence_, not "optimal configurations"
- Custom proxies only provide _sensing_, never _decision-making_ — the Regulator still decides what matters
- Community curation over marketplace proliferation to avoid optimization culture

**Dependencies**: MP9 (Sensorium v1), MP6 (Models), Phase 2 (for richer Entity-based templates)
