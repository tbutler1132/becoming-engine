# Codebase Study Guide

A structured guide to understanding the Becoming Engine codebase.

---

## Phase 1: Read the Doctrine First (30 min)

Before touching code, internalize the _why_:

1. **`docs/doctrine.md`** — The philosophical foundation. Read it slowly. The code implements this literally.

2. **`docs/standards.md`** — The engineering rules. Pay attention to:
   - Result types over exceptions
   - Pure logic separation
   - Module boundaries
   - "Configure boundaries, not mechanisms"

3. **`docs/operating-manual.md`** — Practical usage guide. Understand Variables, Episodes, Actions, and the baseline concept.

**Checkpoint:** Can you explain why "idleness is success" to someone?

---

## Phase 2: Trace the Ontology (20 min)

Start with the **data shapes** — everything else is transformations on these:

### 2a. The DNA (source of truth)

**Read:** `src/dna.ts`

This is the "genetic code" of the organism — the single source of truth for all fundamental constants:

- **Ontology enums:**
  - `NODE_TYPES`, `VARIABLE_STATUSES`, `EPISODE_TYPES`, `EPISODE_STATUSES`
  - `ACTION_STATUSES`, `MODEL_TYPES`, `MODEL_SCOPES`, `ENFORCEMENT_LEVELS`
  - `NOTE_TAGS`, `LINK_RELATIONS`, `OBSERVATION_TYPES`, `SIGNAL_EVENT_TYPES`
  - `MUTATION_TYPES`, `OVERRIDE_DECISIONS`
- **Regulatory limits:** `MAX_ACTIVE_EXPLORE_PER_NODE`, `MAX_ACTIVE_STABILIZE_PER_VARIABLE`
- **Schema version:** `SCHEMA_VERSION`
- **Node defaults:** `DEFAULT_PERSONAL_NODE_ID`, `DEFAULT_ORG_NODE_ID`

All other modules import from here.

### 2b. The types

**Read:** `src/libs/memory/types.ts`

This imports constants from DNA and defines the type derivations and interfaces:

- How types are derived from const arrays (`NodeType = (typeof NODE_TYPES)[number]`)
- The core interfaces: `Variable`, `Episode`, `Action`, `Note`, `Model`, `Link`, `MembraneException`
- The `State` interface that holds everything

**Exercise:** Draw the data model on paper:

```
State
├── schemaVersion
├── variables: Variable[]
├── episodes: Episode[]
├── actions: Action[]
├── notes: Note[]
├── models: Model[]
├── links: Link[]
└── exceptions: MembraneException[]
```

---

## Phase 3: Understand the Shared Utilities (5 min)

**Read:** `src/libs/shared/types.ts`

The `Result<T>` type is defined here — this pattern is used everywhere:

```typescript
type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
```

All fallible operations return `Result<T>` instead of throwing. This makes errors explicit and composable.

---

## Phase 4: Understand the Regulator (45 min)

This is the brain. Read in this order:

### 4a. Types first

**Read:** `src/libs/regulator/types.ts`

- `OpenEpisodeParams` — discriminated union for Stabilize vs Explore
- `CloseEpisodeParams` — includes closure note and optional model updates
- `StatusData` — discriminated union for CLI display (baseline vs active mode)
- Many param types: `SignalParams`, `CreateActionParams`, `CreateModelParams`, `CreateNoteParams`, `CreateLinkParams`, `LogExceptionParams`, etc.

### 4b. Pure logic

**Read:** `src/libs/regulator/logic.ts`

This is the most important file. Notice:

- Every function is **pure**: `(State, Input) => Result<State>` or `(State, ...) => Data`
- No side effects, no I/O
- Guard clauses return early with errors
- State is never mutated — always spread into new objects

**Key functions to trace:**

1. `isBaseline()` — simplest, shows the pattern
2. `canStartExplore()` — constraint checking
3. `openEpisode()` — full mutation with validation
4. `closeEpisode()` — see how closureNote and modelUpdates flow through
5. `createModel()`, `updateModel()` — belief management
6. `createNote()`, `addNoteTag()`, `removeNoteTag()` — note workflow
7. `createLink()`, `deleteLink()` — relationship management
8. `logException()` — Membrane audit trail

**Exercise:** Add `console.log` statements and run a test to see the data flow:

```bash
npm test -- --grep "opens a Stabilize"
```

### 4c. The wrapper

**Read:** `src/libs/regulator/engine.ts`

The `Regulator` class is a thin facade over `logic.ts`:

- It holds policy config
- It adds logging
- It delegates everything to pure functions

**Question to answer:** Why is the class thin? (Answer: testability, composability)

### 4d. Policy

**Read:** `src/libs/regulator/policy.ts`

See how boundaries are configurable but mechanisms aren't. Policies can vary per node type or per specific node.

---

## Phase 5: Understand the Membrane (20 min)

The Membrane enforces **Normative Model constraints** before mutations.

### 5a. Why Membrane exists

The Regulator enforces hard invariants (e.g., max 1 Explore per node). The Membrane enforces soft constraints — user-defined Normative Models that can warn or block, with the ability to override when justified.

### 5b. Types and logic

**Read:** `src/libs/membrane/types.ts` and `src/libs/membrane/logic.ts`

Key concepts:

- **Enforcement levels:** `none`, `warn`, `block`
- **Scope matching:** `personal`, `org`, `domain`
- **Exception tracking:** When users override a block, it's logged as a `MembraneException`

**Key function:**

- `checkEpisodeConstraints(state, context)` — returns `MembraneResult` (allow/warn/block)

**Exercise:** Look at how the CLI calls Membrane before opening an episode.

---

## Phase 6: Trace I/O Through the System (30 min)

Now see how data flows end-to-end:

### 6a. Input parsing

**Read:** `src/libs/sensorium/cli.ts`

- `parseCli()` turns `string[]` into typed `SensoriumCommand`
- `parseObservation()` turns observation input into typed `Observation`
- `parseNodeRef()` parses strings like `"Personal:personal"` into `NodeRef`
- Notice the `Result<T>` pattern throughout

**Observation types:**

- `variableProxySignal` — signal about a variable's status
- `freeformNote` — unstructured input to become a Note
- `episodeProposal` — proposal to open an episode

### 6b. Persistence

**Read:** `src/libs/memory/store.ts`

- `load()` — reads JSON, validates, migrates if needed
- `save()` — atomic write with temp file + rename
- `createSeed()` — what happens on first run (Genesis)

### 6c. Orchestration

**Read:** `src/apps/cli/cli.ts`

This ties everything together with the canonical flow:

```
Sensorium (Input) → Membrane (Constraints) → Regulator (Mutation) → Memory (Persist)
```

Key points:

1. Load state from store
2. Parse CLI args via Sensorium
3. For episode operations, gate through Membrane first
4. Call Regulator to get new state
5. Save new state to store
6. Log any Membrane exceptions

**Exercise:** Trace a full command by hand:

```bash
npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Test"
```

Follow the data: argv → parseCli → checkMembraneForEpisode → openEpisode → save → JSON file

---

## Phase 7: Understand Signaling (15 min)

The Signaling organ handles **inter-node communication** through an append-only event log.

**Read:** `src/libs/signaling/README.md`

Key concepts:

- **Event types:** `intent`, `status`, `completion`
- **Storage:** `data/events.jsonl` (JSON Lines format)
- **Idempotency:** Emitting the same eventId twice is a no-op

This is the foundation for federation — enabling nodes to exchange signals without sharing internal state.

---

## Phase 8: Run and Break Things (30 min)

**Hands-on exercises:**

1. **Read the current state:**

   ```bash
   cat data/state.json
   ```

2. **Try the CLI commands:**

   ```bash
   npm run becoming:status
   npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Learn the codebase"
   npm run becoming:status
   cat data/state.json  # see the episode
   npm run becoming:dev -- close --episodeId <id-from-above> --note "Completed learning" --model-type Descriptive --model-statement "The codebase uses pure functions"
   ```

3. **Try the observation flow:**

   ```bash
   npm run becoming:dev -- observe signal --variableId <id> --status InRange
   npm run becoming:dev -- observe note --content "This is an observation"
   npm run becoming:dev -- observe episode --type Explore --objective "Test observation flow"
   ```

4. **Run the tests and read them:**

   ```bash
   npm test
   ```

   Tests are documentation. `logic.test.ts` shows every constraint.

5. **Break a constraint intentionally:**
   - Open an Explore episode
   - Try to open another Explore
   - See the error message

6. **Add a temporary log:**

   Add `console.log(state)` inside `openEpisode` in logic.ts, run a test, see the state shape.

---

## Phase 9: Understand the Module Pattern (15 min)

**Read the `index.ts` files:**

- `src/libs/memory/index.ts`
- `src/libs/regulator/index.ts`
- `src/libs/sensorium/index.ts`
- `src/libs/membrane/index.ts`
- `src/libs/signaling/index.ts`
- `src/libs/shared/index.ts`

These define the **public API** of each module. Notice:

- Only exported symbols are public
- `internal/` folders are never exported
- Cross-module imports go through index.ts

**Exercise:** Try importing from `internal/` in another module — your editor should warn you.

---

## Phase 10: Read a Migration (10 min)

**Read:** `src/libs/memory/internal/migrations.ts`

See how schema evolution works:

- Each version has a migration function
- Migrations are chained in `load()`
- Old data is transformed to new shape
- Current schema version is 8

---

## Quick Reference Card

| Layer         | File(s)               | Responsibility                         |
| ------------- | --------------------- | -------------------------------------- |
| DNA           | `dna.ts`              | Source of truth for all invariants     |
| Shared        | `shared/types.ts`     | Result type and shared utilities       |
| Ontology      | `memory/types.ts`     | Data shapes (imports from DNA)         |
| Persistence   | `memory/store.ts`     | JSON I/O with atomic writes            |
| Constraints   | `regulator/types.ts`  | Rules as constants (imports from DNA)  |
| Pure Logic    | `regulator/logic.ts`  | State transformations                  |
| Policy        | `regulator/policy.ts` | Configurable boundaries                |
| Facade        | `regulator/engine.ts` | Public interface                       |
| Membrane      | `membrane/logic.ts`   | Normative Model constraint enforcement |
| Input         | `sensorium/cli.ts`    | Parse CLI → Commands/Observations      |
| Signaling     | `signaling/`          | Inter-node event communication         |
| Orchestration | `cli/cli.ts`          | Wire everything together               |

---

## Organ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLI                                    │
│  (Orchestrator — owns no authority, never mutates State)        │
└────────┬────────────────┬──────────────────┬──────────────┬─────┘
         │                │                  │              │
         ▼                ▼                  ▼              ▼
    ┌─────────┐     ┌──────────┐      ┌───────────┐   ┌─────────┐
    │Sensorium│     │ Membrane │      │ Regulator │   │ Memory  │
    │(parsing)│────▶│(gating)  │─────▶│(mutation) │──▶│(persist)│
    └─────────┘     └──────────┘      └───────────┘   └─────────┘
                                            │
                                            ▼
                                      ┌───────────┐
                                      │ Signaling │
                                      │ (events)  │
                                      └───────────┘
```

---

## You're Done When...

- [ ] You can explain what `Result<T>` is and why it's used
- [ ] You can trace a CLI command from argv to JSON file
- [ ] You can explain why logic.ts has no I/O
- [ ] You can name the two Episode types and their constraints
- [ ] You can explain the difference between Regulator constraints and Membrane constraints
- [ ] You can describe what happens when closing an Explore episode (Model required)
- [ ] You can modify a test, break it, and fix it

---

## Bonus: Understand the Future Vision

Once you're comfortable with the current codebase, read about the **Two-Layer Ontology** vision:

- **Regulatory Layer** (Phase 1, current): Variables, Episodes, Actions — fixed, minimal
- **World Model Layer** (Phase 2, future): Schemas, Entities, Links, Models — extensible, user-defined

See `docs/roadmap.md` (Future Vision section) and `docs/doctrine.md` (sections 13-15) for details.

---

_Estimated time: 3-4 hours of focused reading_
