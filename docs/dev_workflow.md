# Developer Workflow (Humans + Agents)

This repository is a cybernetic system. The codebase should remain **quiet**, **legible**, and **easy to delete**.

## Canonical Loop

1. Install:

```bash
npm install
```

2. Make small changes.
3. Run the health gate:

```bash
npm run check
```

If `check` is green, the repo is healthy.

## Repository Health Gate

`npm run check` runs:

- unit tests (`npm test`)
- TypeScript typecheck (`npx tsc --noEmit`)
- lint (`npm run lint`)
- formatting check (`npm run format:check`)

## Module Boundaries (Organs)

Code under `src/libs/<organ>` is a module (“organ”).

### Rules

- Each module exposes a **public API** via `index.ts`.
- Other modules may only import from that public API:
  - ✅ `../memory/index.js`
  - ❌ `../memory/types.js`
  - ❌ `../memory/store.js`

ESLint enforces these boundaries. Do not bypass the rules.

## Where Code Goes

- `src/libs/*`: organs (pure logic + bounded side effects)
- `src/apps/*`: executables/interfaces (CLI/UI)
- `plugins/*`: extensions (integrations, sensors/oracles, procedural model packs)
- `docs/*`: doctrine + standards + operating manual

## Configuration

Follow the **Selective Configuration Principle** in `docs/standards.md`:

> Configure boundaries, not mechanisms.

Prefer explicit policy objects (dependency injection) over environment-driven behavior.

## Subagents (Recommended Setup)

If you’re using subagents, see: `docs/subagents.md`.

## Roadmap

If you want a lightweight “what next” list without over-committing, see: `docs/roadmap.md`.

## Adding a New Organ (Checklist)

- `src/libs/<organ>/index.ts` (public API)
- `src/libs/<organ>/README.md` (responsibility + contract)
- `src/libs/<organ>/*.test.ts` (tests focus on behavior)
- Use pure functions where possible: `(State, Input) => NewState`
- Keep baseline quiet (silent by default)

---

## Microproject Episode Protocol

Each Microproject (MP) is an **Explore Episode** for the codebase. It must be hypothesis-driven, bounded, and produce explicit learning.

This protocol ensures the human stays engaged at critical checkpoints rather than passively watching AI work.

### Phase 0: Issue Proposal (Agent Creates, Human Approves)

**Agent creates a GitHub issue** with:

```markdown
## MP[N] — [Title from Roadmap]

### Goal

[One sentence from roadmap]

### Hypothesis

What we're testing / learning.

### Proposed Changes

- [ ] File: `src/libs/x/y.ts` — add Z
- [ ] File: `src/libs/x/y.test.ts` — test for Z
- [ ] (etc.)

### Acceptance Criteria

- [ ] Criterion 1 (testable assertion)
- [ ] Criterion 2
- [ ] `npm run check` passes

### Scope Boundary

What this MP explicitly does NOT include.
```

**Human reviews the issue:**

- Does the goal match your understanding?
- Are acceptance criteria what you'd want to verify?
- Is scope appropriately small?

**Human comments:** `Approved` or requests changes.

> ⚠️ **No code is written until the issue is approved.**

---

### Phase 1: Test-First (Human Reviews Tests)

**Agent writes failing tests** that encode the acceptance criteria.

Tests should read as behavioral specifications:

```typescript
it('closing an episode requires a closure note', () => { ... });
it('closureNoteId is set when episode closes', () => { ... });
```

**Human verifies:**

1. Read the test names — "If these pass, is the MP done?"
2. Run `npm test` — confirm tests fail for the right reasons

**Human comments on issue:** `Tests approved, proceed` or requests changes.

---

### Phase 2: Implementation (Agent Works)

**Agent implements** code to make tests pass.

- Keeps `npm run check` green throughout
- Narrates key design decisions in PR or issue comments
- Human can check in but doesn't block progress

---

### Phase 3: UAT (Human Verifies — Critical)

**Human runs:**

```bash
npm run check                     # Health gate green
npm run cli -- [relevant commands] # Exercise the feature
```

**Human does manual verification:**

- Actually use the new capability end-to-end
- Try edge cases the tests might miss
- Ask: "Does this feel right? Does it fit the doctrine?"

**Human comments on issue:** `UAT passed` or `Found issue: [description]`

---

### Phase 4: Learning Capture (Human Writes)

Before closing the issue, **human writes a closure comment:**

```markdown
## Closure Note

### What worked well

- ...

### What was confusing or surprising

- ...

### Doctrine clarifications (if any)

- ...

### Process improvements (if any)

- ...
```

This is the explicit learning artifact. If no learning is captured, the Episode is not properly closed.

---

### Phase 5: Close

- Agent (or human) closes the issue
- Update `docs/roadmap.md` to mark MP complete: `- [x] **Complete**`
- Commit with message: `MP[N]: [title] (closes #issue)`

---

### Summary Checklist

| Phase        | Owner  | Artifact                      | Gate            |
| ------------ | ------ | ----------------------------- | --------------- |
| 0. Issue     | Agent  | GitHub Issue                  | Human approves  |
| 1. Tests     | Agent  | Failing tests                 | Human approves  |
| 2. Implement | Agent  | Passing code                  | `npm run check` |
| 3. UAT       | Human  | Manual verification           | Human approves  |
| 4. Learn     | Human  | Closure comment               | Written         |
| 5. Close     | Either | Issue closed, roadmap updated | Done            |

---

### Why This Matters

- **Phase 0** prevents scope creep and ensures shared understanding
- **Phase 1** makes acceptance concrete before code exists
- **Phase 3** forces you to actually use what was built
- **Phase 4** produces the learning the system is designed to accumulate

Without explicit human gates, it's easy to "ship" code you don't understand. This protocol keeps you the owner of your system.
