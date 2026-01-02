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

- Ontology enums (`NODE_TYPES`, `EPISODE_TYPES`, `VARIABLE_STATUSES`, etc.)
- Regulatory limits (`MAX_ACTIVE_EXPLORE_PER_NODE`, `MAX_ACTIVE_STABILIZE_PER_VARIABLE`)
- Schema version (`SCHEMA_VERSION`)

All other modules import from here.

### 2b. The types

**Read:** `src/libs/memory/types.ts`

This imports constants from DNA and defines the type derivations and interfaces:

- How types are derived from const arrays (`NodeType = (typeof NODE_TYPES)[number]`)
- The four core interfaces: `Variable`, `Episode`, `Action`, `Note`
- The `State` interface that holds everything

**Exercise:** Draw the data model on paper:

```
State
├── variables: Variable[]
├── episodes: Episode[]
├── actions: Action[]
└── notes: Note[]
```

---

## Phase 3: Understand the Regulator (45 min)

This is the brain. Read in this order:

### 3a. Types first

**Read:** `src/libs/regulator/types.ts`

- The `Result<T>` type — this pattern is everywhere
- `OpenEpisodeParams` — discriminated union for Stabilize vs Explore
- The constraint constants

### 3b. Pure logic

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
4. `closeEpisode()` — see how closureNoteId flows through

**Exercise:** Add `console.log` statements and run a test to see the data flow:

```bash
npm test -- --grep "opens a Stabilize"
```

### 3c. The wrapper

**Read:** `src/libs/regulator/engine.ts`

The `Regulator` class is a thin facade over `logic.ts`:

- It holds policy config
- It adds logging
- It delegates everything to pure functions

**Question to answer:** Why is the class thin? (Answer: testability, composability)

### 3d. Policy

**Read:** `src/libs/regulator/policy.ts`

See how boundaries are configurable but mechanisms aren't.

---

## Phase 4: Trace I/O Through the System (30 min)

Now see how data flows end-to-end:

### 4a. Input parsing

**Read:** `src/libs/sensorium/cli.ts`

- `parseCli()` turns `string[]` into typed `SensoriumCommand`
- Notice the `SensoriumParseResult<T>` — same Result pattern

### 4b. Persistence

**Read:** `src/libs/memory/store.ts`

- `load()` — reads JSON, validates, migrates if needed
- `save()` — atomic write with temp file + rename
- `createSeed()` — what happens on first run

### 4c. Orchestration

**Read:** `src/apps/cli/cli.ts`

This ties everything together:

1. Load state from store
2. Parse CLI args via sensorium
3. Call regulator to get new state
4. Save new state to store

**Exercise:** Trace a full command by hand:

```bash
npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Test"
```

Follow the data: argv → parseCli → openEpisode → save → JSON file

---

## Phase 5: Run and Break Things (30 min)

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
   npm run becoming:dev -- close --node Personal:personal --episodeId <id-from-above>
   ```

3. **Run the tests and read them:**

   ```bash
   npm test
   ```

   Tests are documentation. `logic.test.ts` shows every constraint.

4. **Break a constraint intentionally:**
   - Open an Explore episode
   - Try to open another Explore
   - See the error message

5. **Add a temporary log:**

   Add `console.log(state)` inside `openEpisode` in logic.ts, run a test, see the state shape.

---

## Phase 6: Understand the Module Pattern (15 min)

**Read the `index.ts` files:**

- `src/libs/memory/index.ts`
- `src/libs/regulator/index.ts`
- `src/libs/sensorium/index.ts`

These define the **public API** of each module. Notice:

- Only exported symbols are public
- `internal/` folders are never exported
- Cross-module imports go through index.ts

**Exercise:** Try importing from `internal/` in another module — your editor should warn you.

---

## Phase 7: Read a Migration (10 min)

**Read:** `src/libs/memory/internal/migrations.ts`

See how schema evolution works:

- Each version has a migration function
- Migrations are chained in `load()`
- Old data is transformed to new shape

---

## Quick Reference Card

| Layer         | File                  | Responsibility                        |
| ------------- | --------------------- | ------------------------------------- |
| DNA           | `dna.ts`              | Source of truth for all invariants    |
| Ontology      | `memory/types.ts`     | Data shapes (imports from DNA)        |
| Persistence   | `memory/store.ts`     | JSON I/O                              |
| Constraints   | `regulator/types.ts`  | Rules as constants (imports from DNA) |
| Pure Logic    | `regulator/logic.ts`  | State transformations                 |
| Policy        | `regulator/policy.ts` | Configurable boundaries               |
| Facade        | `regulator/engine.ts` | Public interface                      |
| Input         | `sensorium/cli.ts`    | Parse CLI → Commands                  |
| Orchestration | `cli/cli.ts`          | Wire everything together              |

---

## You're Done When...

- [ ] You can explain what `Result<T>` is and why it's used
- [ ] You can trace a CLI command from argv to JSON file
- [ ] You can explain why logic.ts has no I/O
- [ ] You can name the two Episode types and their constraints
- [ ] You can modify a test, break it, and fix it

---

## Bonus: Understand the Future Vision

Once you're comfortable with the current codebase, read about the **Two-Layer Ontology** vision:

- **Regulatory Layer** (Phase 1, current): Variables, Episodes, Actions — fixed, minimal
- **World Model Layer** (Phase 2, future): Schemas, Entities, Links, Models — extensible, user-defined

See `docs/roadmap.md` (Future Vision section) and `docs/doctrine.md` (section 13) for details.

---

_Estimated time: 2-3 hours of focused reading_
