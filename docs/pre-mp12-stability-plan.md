# Pre-MP12 Stability Plan

> **Purpose**: A comprehensive checklist to verify the organism is stable before adding the Web UI.
>
> **Method**: Each section is a prompt you can bring to a conversation with Claude. Work through them sequentially. Mark items complete as you go.

---

## Overview

Before building the Web UI (MP12), we need to verify:

1. **Foundation is solid** — DNA, types, and invariants are correct
2. **All organs are healthy** — Each module works as documented
3. **Integration is seamless** — The CLI orchestrates everything correctly
4. **Edge cases are covered** — Property-based tests catch what unit tests miss
5. **Documentation is current** — READMEs match implementation

**Current Status**: `npm run check` passes (314 tests, TypeScript clean, ESLint clean, Prettier clean)

---

## Phase 1: Foundation Audit

### 1.1 DNA Tripwire Review

**Prompt to use:**

> "Review `src/dna.ts` and `src/dna.test.ts`. Verify that:
>
> 1. All ontology enums are complete (nothing missing from doctrine)
> 2. All regulatory limits are correctly defined
> 3. The tripwire test covers every exported constant
> 4. SCHEMA_VERSION matches the current state shape
>
> Cross-reference against `docs/doctrine.md` section 12 (Core Object Specifications)."

**Acceptance criteria:**

- [x] Every doctrine object type has corresponding DNA entries — **with known gaps (see below)**
- [x] Tripwire test fails if any DNA value changes (intentional design)
- [x] SCHEMA_VERSION is current (V7)

**Audit completed: 2026-01-02**

<details>
<summary>Known Gaps (Doctrine vs DNA)</summary>

These discrepancies between `docs/doctrine.md` Section 12 and `src/dna.ts` are documented as known gaps for future consideration:

| Constant            | DNA Values                   | Doctrine Says                           | Gap                            |
| ------------------- | ---------------------------- | --------------------------------------- | ------------------------------ |
| `VARIABLE_STATUSES` | `["Low", "InRange", "High"]` | "Low / InRange / High / Unknown"        | Missing "Unknown"              |
| `EPISODE_STATUSES`  | `["Active", "Closed"]`       | "Active / Closing / Closed / Abandoned" | Missing "Closing", "Abandoned" |

**Decision**: These represent aspirational doctrine that has not yet been implemented. The current DNA accurately reflects the implemented system. If these statuses are needed for future milestones, DNA should be updated at that time along with corresponding validation and migration code.

**What was verified complete:**

- All 17 DNA exports have tripwire tests
- Regulatory limits match doctrine (MAX_ACTIVE_EXPLORE_PER_NODE=1, MAX_ACTIVE_STABILIZE_PER_VARIABLE=1)
- SCHEMA_VERSION=7 matches current State shape (variables, episodes, actions, notes, models, links)
- NODE_TYPES, EPISODE_TYPES, ACTION_STATUSES, MODEL_TYPES, MODEL_SCOPES, ENFORCEMENT_LEVELS, NOTE_TAGS, LINK_RELATIONS, OBSERVATION_TYPES, SIGNAL_EVENT_TYPES all complete

</details>

---

### 1.2 Type Definitions Audit

**Prompt to use:**

> "Audit the type definitions across all modules. For each module (`memory`, `regulator`, `sensorium`, `membrane`, `signaling`):
>
> 1. Read the `types.ts` file
> 2. Verify types match the doctrine specifications
> 3. Check that Result types are used for fallible operations
> 4. Ensure no `any` types exist
> 5. Verify discriminated unions are used instead of boolean flags
>
> Create a summary of any discrepancies found."

**Acceptance criteria:**

- [ ] No `any` types in any module
- [ ] All fallible operations return `Result<T>`
- [ ] Discriminated unions used for state management
- [ ] Types align with doctrine section 12

---

## Phase 2: Organ Health Checks

### 2.1 Memory Organ

**Prompt to use:**

> "Deep dive into the Memory organ (`src/libs/memory/`):
>
> 1. Read the README and verify it matches implementation
> 2. Review the store's public API — does it expose only what's needed?
> 3. Check migrations — is there a clear upgrade path from each schema version?
> 4. Verify validation logic catches all invalid states
> 5. Test the persistence: create state, save, reload, verify
>
> Flag any inconsistencies between README and implementation."

**Acceptance criteria:**

- [ ] README accurately describes the module
- [ ] Public API is minimal (only index.ts exports)
- [ ] Migrations handle all version upgrades
- [ ] Validation is comprehensive

---

### 2.2 Regulator Organ

**Prompt to use:**

> "Deep dive into the Regulator organ (`src/libs/regulator/`):
>
> 1. Read the README and verify it matches implementation
> 2. Review all mutation functions — do they return Result types?
> 3. Verify episode constraints are enforced:
>    - Max 1 active Explore per node
>    - Max 1 active Stabilize per variable
> 4. Check that Explore closure requires Model updates
> 5. Verify all logic functions are pure (State, Input) => NewState
>
> Flag any doctrine violations."

**Acceptance criteria:**

- [ ] README matches implementation
- [ ] All mutations return Result types
- [ ] Episode constraints are enforced in tests
- [ ] Pure logic separation is maintained

---

### 2.3 Sensorium Organ

**Prompt to use:**

> "Deep dive into the Sensorium organ (`src/libs/sensorium/`):
>
> 1. Read the README and verify it matches implementation
> 2. Review the observation types — are they complete per DNA?
> 3. Verify CLI parsing handles all observation types
> 4. Check that Sensorium never triggers actions directly (doctrine)
> 5. Review test coverage for edge cases
>
> Flag any missing observation types or doctrine violations."

**Acceptance criteria:**

- [ ] README matches implementation
- [ ] All DNA observation types are handled
- [ ] Sensorium is passive (sense only, no action triggering)
- [ ] CLI parsing is robust

---

### 2.4 Membrane Organ

**Prompt to use:**

> "Deep dive into the Membrane organ (`src/libs/membrane/`):
>
> 1. Read the README and verify it matches implementation
> 2. Review the constraint checking logic
> 3. Verify integration with Normative Models (enforcement levels)
> 4. Check that blocked actions actually get blocked
> 5. Verify exceptions can be logged when allowed
>
> Flag any missing enforcement scenarios."

**Acceptance criteria:**

- [ ] README matches implementation
- [ ] All enforcement levels work (none, warn, block)
- [ ] Exceptions are tracked when allowed
- [ ] Integration with Regulator is clean

---

### 2.5 Signaling Organ

**Prompt to use:**

> "Deep dive into the Signaling organ (`src/libs/signaling/`):
>
> 1. Read the README and verify it matches implementation
> 2. Review the event envelope structure
> 3. Verify append-only semantics (events can't be modified)
> 4. Check idempotency in tests
> 5. Verify all signal event types from DNA are supported
>
> Flag any missing event types or idempotency issues."

**Acceptance criteria:**

- [ ] README matches implementation
- [ ] Event envelope matches doctrine
- [ ] Append-only is enforced
- [ ] Idempotency tests pass

---

## Phase 3: Integration Verification

### 3.1 CLI Orchestration

**Prompt to use:**

> "Audit the CLI (`src/apps/cli/`):
>
> 1. Map each CLI command to the organ it uses
> 2. Verify the command flow: Sensorium → Memory → Regulator → Membrane
> 3. Check that status output is quiet at baseline
> 4. Verify all commands use Result types for error handling
> 5. Test the actual CLI with sample inputs
>
> Create a command-to-organ mapping table."

**Acceptance criteria:**

- [ ] Every command routes through proper organs
- [ ] Error handling is consistent
- [ ] Baseline status is quiet
- [ ] Command responses are testable

---

### 3.2 Data Flow Verification

**Prompt to use:**

> "Trace the complete data flow for these scenarios:
>
> 1. **Create a Variable** — from CLI input to persisted state
> 2. **Open an Explore Episode** — including constraint checks
> 3. **Close an Episode with Model update** — including closure validation
> 4. **Add a Note** — including tag handling
> 5. **Create a Link** — including referential integrity
>
> For each, verify:
>
> - Sensorium parses input correctly
> - Regulator validates and mutates state
> - Membrane enforces constraints
> - Memory persists correctly
> - Signaling emits events (if applicable)"

**Acceptance criteria:**

- [ ] All five flows work end-to-end
- [ ] Each organ participates correctly
- [ ] State is consistent after each operation

---

## Phase 4: Edge Case & Stress Testing

### 4.1 Property-Based Test Review

**Prompt to use:**

> "Review the property-based tests in `src/libs/regulator/invariants.test.ts`:
>
> 1. What invariants are being tested?
> 2. Are there gaps — invariants from doctrine not covered?
> 3. Suggest additional property tests for:
>    - Episode concurrency limits
>    - Model confidence bounds
>    - Note tag semantics
>
> Implement any missing property tests."

**Acceptance criteria:**

- [ ] All doctrine invariants have property tests
- [ ] fast-check is being used effectively
- [ ] No invariant can be violated by random inputs

---

### 4.2 Boundary Conditions

**Prompt to use:**

> "Test boundary conditions across the system:
>
> 1. Empty state — what happens with no variables, episodes, etc.?
> 2. Maximum limits — what happens at MAX_ACTIVE_EXPLORE_PER_NODE?
> 3. Invalid inputs — are all rejected gracefully?
> 4. Unicode handling — do names/descriptions handle special characters?
> 5. Large state — does the system handle 1000+ objects?
>
> Run or write tests for each condition."

**Acceptance criteria:**

- [ ] Empty state is handled gracefully
- [ ] Limits are enforced with clear errors
- [ ] Invalid inputs return Result.error
- [ ] Unicode is supported
- [ ] Performance is acceptable at scale

---

## Phase 5: Documentation Sync

### 5.1 README Audit

**Prompt to use:**

> "For each module README (`memory`, `regulator`, `sensorium`, `membrane`, `signaling`):
>
> 1. Verify the 'Public API' section matches actual exports
> 2. Verify example usage still works
> 3. Check that internal implementation details aren't exposed
> 4. Ensure README explains 'why' not just 'what'
>
> Update any stale documentation."

**Acceptance criteria:**

- [ ] All READMEs are current
- [ ] Examples are copy-paste runnable
- [ ] Internal details are hidden

---

### 5.2 Roadmap Verification

**Prompt to use:**

> "Review `docs/roadmap.md` against the current implementation:
>
> 1. Verify all 'Completed' items are actually complete
> 2. Check MP6-MP11 acceptance criteria against tests
> 3. Identify any features marked complete but missing tests
> 4. Verify Phase 1 is truly complete before MP12
>
> Create a completion matrix: MP → Acceptance Criteria → Verified."

**Acceptance criteria:**

- [ ] Every completed MP has passing tests for its criteria
- [ ] No incomplete work is marked as done
- [ ] MP12 prerequisites are satisfied

---

## Phase 6: Web UI Readiness

### 6.1 API Surface for UI

**Prompt to use:**

> "Analyze what the Web UI (MP12) will need from the existing organs:
>
> 1. What data does 'status' need to display?
> 2. What types should be exposed for the UI layer?
> 3. Is `getStatusData` sufficient for the initial read-only UI?
> 4. What additional exports might be needed?
>
> Create a UI data requirements document."

**Acceptance criteria:**

- [ ] Status data structure is well-defined
- [ ] Types are exportable to the UI layer
- [ ] No new mutations needed for read-only UI

---

### 6.2 Viewer Stub Check

**Prompt to use:**

> "Check the existing viewer stub (`src/apps/viewer/`):
>
> 1. What exists already?
> 2. Is the serve configuration correct?
> 3. What patterns should the UI follow?
> 4. How will it consume state data?
>
> Propose the initial architecture for MP12."

**Acceptance criteria:**

- [ ] Viewer stub is functional
- [ ] Serve configuration works
- [ ] Architecture proposal is doctrine-aligned

---

## Execution Checklist

| Phase                    | Status | Notes                               |
| ------------------------ | ------ | ----------------------------------- |
| 1.1 DNA Tripwire         | ✅     | Complete with known gaps documented |
| 1.2 Type Definitions     | ⬜     |                                     |
| 2.1 Memory Organ         | ⬜     |                                     |
| 2.2 Regulator Organ      | ⬜     |                                     |
| 2.3 Sensorium Organ      | ⬜     |                                     |
| 2.4 Membrane Organ       | ⬜     |                                     |
| 2.5 Signaling Organ      | ⬜     |                                     |
| 3.1 CLI Orchestration    | ⬜     |                                     |
| 3.2 Data Flow            | ⬜     |                                     |
| 4.1 Property Tests       | ⬜     |                                     |
| 4.2 Boundary Conditions  | ⬜     |                                     |
| 5.1 README Audit         | ⬜     |                                     |
| 5.2 Roadmap Verification | ⬜     |                                     |
| 6.1 API Surface          | ⬜     |                                     |
| 6.2 Viewer Stub          | ⬜     |                                     |

---

## Final Gate

Before starting MP12, all of the following must be true:

1. **All phases above are complete** (checklist fully marked)
2. **`npm run check` passes** (tests, types, lint, format)
3. **No known issues or tech debt** logged
4. **Roadmap MP1-MP11 verified complete** with evidence
5. **Team confidence is high** — "this foundation is solid"

---

## Tips for Working Through This Plan

1. **One session per phase** — Don't rush. Each phase deserves focused attention.

2. **Start fresh each time** — Begin each session by pasting the relevant prompt. This gives Claude full context.

3. **Document findings** — If you find issues, fix them before moving on. The goal is MP12 readiness, not just checking boxes.

4. **Run `npm run check` after every change** — Keep the baseline green.

5. **Update this document** — As you complete phases, update the checklist here. This becomes your audit trail.

---

_Created: 2026-01-02_
_Last updated: 2026-01-02_
