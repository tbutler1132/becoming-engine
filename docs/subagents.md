# Subagent Workflow (4-Agent Setup)

This repo is designed as an **Organism**: discrete organs in `src/libs/*` and executable bodies in `src/apps/*`.

When you can run **exactly 4** subagents, the most effective setup is **not** “one per organ.” Best practice is a **vertical-slice Integrator** plus **two organ owners** plus a **Quality Gate**.

## Recommended 4-Agent Roster

### 1) FeatureLead (Integrator)

**Owns:** a single end-to-end capability across organs (a “vertical slice”).

**Responsibilities**

- Define the slice’s acceptance criteria (observable behavior + tests).
- Decide where logic lives (Regulator vs CLI vs Memory).
- Make cross-organ API decisions (types, public APIs, boundaries).
- Integrate and resolve conflicts between parallel changes.

**Guardrails**

- Only this role should routinely touch multiple organs in a single change.
- Prefer additive, explicit APIs over implicit coupling.

### 2) OrganOwner: Memory

**Owns:** `src/libs/memory/*`

**Responsibilities**

- Ontology correctness (`State` shape, schema versions, migrations).
- Persistence integrity (atomicity, lock discipline, data validation).
- Backward compatibility strategy (when relevant).

**Guardrails**

- Memory remembers; it should not decide.
- Keep changes evolvable (versioning + migration story).

### 3) OrganOwner: Regulator

**Owns:** `src/libs/regulator/*`

**Responsibilities**

- Domain rules + invariants (viability-first, concurrency constraints).
- Policy design (configure boundaries, not mechanisms).
- Pure logic cleanliness + determinism (logic should be testable in isolation).

**Guardrails**

- Avoid leaking mechanism into configuration.
- Keep constraints legible and explicit.

### 4) QualityGate (Tests + Docs + Boundaries)

**Owns:** repo health, consistency, and drift prevention.

**Responsibilities**

- Keep `npm run check` green (tests + typecheck + lint + format).
- Add missing tests for new behaviors or invariants.
- Keep docs consistent with doctrine + implementation (no contradictions).
- Enforce module boundaries (imports via `index.ts`, no reaching into internals).

**Guardrails**

- QualityGate has veto power: if `check` fails or docs contradict doctrine, the slice is not “done.”

## Operating Rules (Simple and Effective)

- **One slice at a time:** pick a small capability with a crisp definition of “done.” Don’t mix refactors + new behavior unless the FeatureLead explicitly scopes it.
- **Only FeatureLead crosses organs:** other agents stay within their organ or their gate responsibilities.
- **Only one agent edits shared types per slice:** typically MemoryOwner for ontology changes, RegulatorOwner for policy/types inside Regulator.
- **Health gate is the finish line:** the final step is always a clean `npm run check`.

## When to Swap Roles

- If the next week is CLI/UX heavy, swap **MemoryOwner** for a **CLIOwner** (owns `src/apps/cli/*`), keeping FeatureLead + RegulatorOwner + QualityGate.
- If the next week is persistence/schema heavy, keep the lineup as-is.
