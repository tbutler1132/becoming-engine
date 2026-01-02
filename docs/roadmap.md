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
- [x] **MP3**: Cortex CLI + Sensorium stub (orchestration + status/signal/act)

---

## Next Micro-Projects

### MP4 — Episode Lifecycle (Open/Close Commands + Timestamps)

- [x] **Complete**

**Goal**: Make Episodes meaningfully "temporary" with explicit closure, timestamps, and CLI commands to drive the full lifecycle.

**Scope**

- Add CLI commands: `becoming open` and `becoming close`
- Add minimal fields to `Episode`: `openedAt`, optional `closedAt`, optional `closureNoteId`
- Cortex generates `episodeId` and passes to Regulator
- Keep status machine small and explicit (const assertions, narrow transitions)

**Acceptance**

- Can open an episode via CLI, see it in `status`, close it via CLI
- New fields are persisted and migrated cleanly
- Tests cover: creating an episode sets `openedAt`; closing sets `closedAt`; constraints enforced

---

### MP5 — Episode Closure Produces Learning (Notes as Closure Artifacts)

- [ ] **Complete**

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
- Add minimal Regulator mutations: create model, update model, attach model updates to an Episode closure

**Acceptance**

- `State` supports models; JSON store migrates; tests pass
- At least one Regulator test proves "closing an Explore can create/update a Model"

---

### MP7 — Links v0 (Typed Relationships Between Objects)

- [ ] **Complete**

**Goal**: Move toward a graph-relational memory without switching storage yet.

**Scope**

- Introduce a `Link` object: `{ id, source, target, relation }` where source/target are object refs
- Add minimal validation: links must reference existing objects

**Acceptance**

- Links can be created and persisted
- Tests prove referential integrity and "no silent mutation"

---

### MP8 — Cortex Status v1 (Still Quiet, More Legible When Not Baseline)

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
- Cortex converts Observations into explicit Regulator mutations (no implicit state changes)

**Acceptance**

- Tests prove invalid input cannot silently mutate ontology
- At least one path: observation → note created or variable status updated (explicitly)

---

### MP10 — Membrane v0 (Validation Gates + Exception Legibility)

- [ ] **Complete**

**Goal**: Add a boundary organ that enforces "what will not be done" as constraints, not identity.

**Scope**

- Create `src/libs/membrane/*` with explicit validation gates (start simple: synchronous rules)
- Introduce "exception required" behavior as explicit artifacts (notes/models), not hidden flags

**Acceptance**

- Cortex routes mutations through Membrane before Regulator mutation (as policy)
- Tests cover: blocked action, allowed action with explicit exception note

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

### MP12 — Cortex UI (Only After the Data and Rules Are Honest)

- [ ] **Complete**

**Goal**: Add a UI only after the underlying organism is stable and legible.

**Scope**

- Build a Next.js interpretive surface (read-only first)
- Preserve baseline quiet and avoid adding planning affordances

**Acceptance**

- UI can visualize the same Status semantics as the CLI
- No new authority is introduced (UI is awareness, not planning)

---

## Phase 2: World Model Layer (Future)

Phase 1 (MP1–MP12) establishes the **regulatory layer** — how the organism regulates itself. Phase 2 introduces the **world model layer** — how the organism represents and reasons about its external environment.

### Motivation

To regulate effectively, the system needs to understand context. Descriptive Models need something to describe. Procedural Models need domains to apply to. The current ontology can represent beliefs (Models) but not the *entities* those beliefs are about.

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
