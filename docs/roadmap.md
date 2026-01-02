# Roadmap (Non-Binding)

<!-- Last reviewed: 2026-01-02 -->

This roadmap describes **small, composable micro-projects** that move the system toward the doctrine without committing to a brittle plan.

**Principles:**

- **Viability first**: every step preserves a quiet baseline and keeps `npm run check` green.
- **Regulation over optimization**: we add regulation primitives, not planning features.
- **Configure boundaries, not mechanisms**: policy is explicit; the machinery stays simple.
- **Baseline is the goal**: "nothing happening" is success.

---

## Completed

- [x] **MP1**: Memory (ontology + persistence)
- [x] **MP2**: Regulator (policy + constraints + mutations)
- [x] **MP3**: CLI + Sensorium stub (orchestration + status/signal/act)
- [x] **MP4**: Episode Lifecycle (Open/Close Commands + Timestamps)
- [x] **MP5**: Episode Closure Produces Learning (Notes as Closure Artifacts)
- [x] **MP9**: Sensorium v1 (Observations)

---

## Phase 1: Regulatory Layer (Current)

### MP6 — Models v0 (Descriptive/Procedural/Normative)

**Goal**: Introduce **Models** as explicit artifacts so learning is queryable.

**Scope**

- Add `Model` to the ontology with `type: Descriptive | Procedural | Normative`
- Include fields: `statement`, `confidence`, `scope`
- Add minimal Regulator mutations: create model, update model, attach to Episode closure
- Normative Models may include `enforcement` field (prep for Membrane)

**Acceptance**

- `State` supports models; JSON store migrates; tests pass
- At least one Regulator test proves "closing an Explore can create/update a Model"
- Models include confidence and scope fields

---

### MP6.5 — Notes v1 (Tags + Timestamps)

**Goal**: Enrich Notes with fields needed for inbox/processed distinction.

**Scope**

- Extend `Note` with: `createdAt`, `tags`, `linkedObjects`
- Define semantic tags: `inbox`, `pending_approval`, `processed`, `closure_note`

**Acceptance**

- Notes include `createdAt` on creation
- Tags can be added/removed via Regulator mutations
- Tests cover: note creation with timestamp, tag filtering

---

### MP7 — Links v0 (Typed Relationships)

**Goal**: Move toward graph-relational memory without switching storage.

**Scope**

- Introduce `Link` object: `id`, `sourceId`, `targetId`, `relation`, `weight`
- Add minimal validation: links must reference existing objects

**Acceptance**

- Links can be created and persisted
- Tests prove referential integrity
- Relation types are validated (const assertion)

---

### MP8 — CLI Status v1

**Goal**: Make the non-baseline dashboard useful while remaining boring at baseline.

**Scope**

- Surface: Variables, Active Episodes, Episode-scoped Actions
- Baseline output remains minimal

**Acceptance**

- Baseline output is quiet
- Non-baseline output is structured and testable

---

### MP10 — Membrane v0 (Validation Gates)

**Goal**: Add a boundary organ that enforces constraints.

**Scope**

- Create `src/libs/membrane/*` with validation gates
- Integrate with Normative Models (`enforcement: "none" | "warn" | "block"`)
- Membrane checks Normative Models before allowing mutations

**Acceptance**

- CLI routes mutations through Membrane
- Tests cover: blocked action, allowed action with explicit exception

> **Checkpoint**: With the organ metaphor complete (Memory, Regulator, Sensorium, Membrane), this is a good moment to consider starting the [Membrane Visualization](decisions/0002-membrane-visualization.md).

---

### MP11 — Signaling v0 (Federation Skeleton)

**Goal**: Prepare for multi-node coordination.

**Scope**

- Define minimal event envelope (Node identity, event id, type, payload, timestamp)
- Implement local append-only events (file-based)

**Acceptance**

- Events can be emitted/consumed locally
- Tests prove idempotency

---

### MP12 — Web UI

**Goal**: Add a UI only after the underlying organism is stable.

**Scope**

- Build a read-only interpretive surface
- Preserve baseline quiet; no planning affordances

**Acceptance**

- UI can visualize Status semantics
- No new authority is introduced

---

### MP-AUTO — Automation v0

**Status**: Proposed (see [ADR 0003](decisions/0003-automation-philosophy.md))

**Goal**: Enable Procedural Models to execute trusted behaviors under Membrane constraints.

**Scope**

- Extend `ProceduralModel` with: `automationLevel` (0/1/2), `trigger`, `chain`
- Create `src/libs/executor/*` — execution engine for Procedural Models
- Approval queue: Level 0 drafts, Level 1 queues, Level 2 auto-executes

**Invariants**

- ❌ Automation never opens Episodes
- ❌ Automation never modifies Models directly
- ❌ Automation never bypasses Membrane
- ✅ Automation serves baseline; Episodes serve learning

**Acceptance**

- Level 1 creates approval Note when triggered
- Level 2 executes and logs
- Membrane blocks if Normative Model has `enforcement: "block"`

---

## Future Vision (Phases 2-4)

The following phases are **speculative** — they represent architectural direction, not committed work. Details will be refined when Phase 1 is complete.

### Phase 2: World Model Layer

**Goal**: Add structured representation of external entities.

Phase 1 builds the **regulatory layer** (how the organism regulates itself). Phase 2 adds the **world model layer** (how the organism represents reality).

**Key additions:**

- **Schemas**: User-defined object types
- **Entities**: Instances conforming to schemas
- **Entity references**: Variables, Episodes, Models can reference entities
- **Knowledge graph queries**: Query across entities, links, models

This enables: "All my beliefs about Person:John" or "Variables affected by Project:X"

---

### Phase 3: Autonomous Regulator

**Goal**: Upgrade the Regulator from reactive to proactive.

Phase 1's Regulator is command-driven (user calls `openEpisode`). Phase 3 makes it autonomous.

**Key additions:**

- **Variable thresholds**: Preferred ranges, stability, confidence scores
- **Episode timebox**: Self-expiring episodes with closure conditions
- **Regulator state machine**: IDLE → EVALUATING → ASSESSING → OPENING_EPISODE → MONITORING → CLOSING_EPISODE
- **Candidate selection**: Regulator proposes Episodes based on pressure scores

"None" remains a valid and common outcome.

---

### Phase 4: Network Infrastructure

**Goal**: Support multiple users, multiple nodes, network coordination.

**Key additions:**

- **Database migration**: Replace `state.json` with SQLite/PostgreSQL
- **Dynamic node creation**: Create Org nodes programmatically
- **Authentication**: Control who accesses which nodes
- **Federation**: Nodes exchange signals over the network
- **Codebase node**: Treat the codebase as a regulated organism

Federation principle: Nodes exchange signals and artifacts, never share state.

---

## Nice to Have

Ideas that embody the philosophy but aren't core. Pursue when capacity allows.

### Membrane Visualization

A web visualization rendering the codebase as a living organism — self-discovering, zero configuration. See [ADR 0002](decisions/0002-membrane-visualization.md).

### AI-Assisted Capture

LLM-powered layer converting unstructured input into structured Observations. The AI proposes, human confirms.

### Mobile Companion

Minimal read-only app for glancing at status. If nothing is wrong, it shows almost nothing.

### Templates & Extensions

Shareable Variable configurations and custom proxy pipelines for non-native data sources.

### Persisted Observations

Currently, Observations are ephemeral intermediate values during CLI execution. A future enhancement could persist Observations to Memory, creating a log of what was sensed. This would enable:

- Audit trail of all input to the system
- Replay capabilities for debugging
- Analytics on observation patterns over time

This aligns with the doctrine's canonical flow: "Sense → Store → ..."
