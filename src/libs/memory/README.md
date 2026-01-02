# Memory Organ

The Memory organ is responsible for the system's **Ontology** (definitions of reality) and **Persistence** (remembrance).

## Why Memory Exists

The system needs a single source of truth for what exists (Variables, Episodes, Actions, Notes, Models, Links) and a way to persist that reality across process restarts. Memory provides both: it defines the shape of reality through types and constants, and it persists state reliably through atomic writes with migration support.

## 🧠 Responsibilities

- **Ontology**: Defines the core types for Variables, Episodes, Actions, Notes, Models, Links, and Exceptions.
- **Persistence**: Safely saves and loads the system `State` to `data/state.json`.
- **Genesis**: Seeds the system with initial viability variables (Agency, Execution Capacity) if no state exists.

## 🛡 Robustness Features

- **Atomic Writes**: Uses a temp-and-rename strategy to prevent data corruption if the process dies mid-save.
- **Concurrency Locking**: Uses a `.lock` file to prevent multiple writers from clobbering the state.
- **Schema Versioning**: Includes a `schemaVersion` in the state file.
- **Automated Migration**: Automatically migrates older state files (v0 through v7) to the current version (v8) on load.
- **Corruption Recovery**: If a state file is invalid or corrupt, it is backed up to a `.corrupt` file for inspection before the system falls back to a safe seed state.

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `JsonStore`

The primary class for state management.

```typescript
import { JsonStore } from "./libs/memory/index.js";

const store = new JsonStore({ basePath: process.cwd() });
const state = await store.load(); // Always returns valid State
await store.save(state); // Persists atomically
```

### Core Types

| Type                | Purpose                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `State`             | The complete system state (variables, episodes, actions, notes, models, links, exceptions) |
| `Variable`          | A viability variable with status (InRange, AtRisk, Critical)                               |
| `Episode`           | A temporary intervention (Stabilize or Explore)                                            |
| `Action`            | A pending task, optionally scoped to an Episode                                            |
| `Note`              | Timestamped content with semantic tags                                                     |
| `Model`             | A belief (Descriptive or Normative)                                                        |
| `Link`              | A relationship between objects                                                             |
| `MembraneException` | Audit record when a Normative constraint was bypassed                                      |
| `NodeRef`           | Reference to a node (type + id)                                                            |

### DNA Constants (re-exported)

All ontology constants come from `dna.ts` and are re-exported for convenience:

- `NODE_TYPES`, `VARIABLE_STATUSES`, `EPISODE_TYPES`, `EPISODE_STATUSES`
- `ACTION_STATUSES`, `MODEL_TYPES`, `MODEL_SCOPES`, `ENFORCEMENT_LEVELS`
- `NOTE_TAGS`, `LINK_RELATIONS`, `MUTATION_TYPES`, `OVERRIDE_DECISIONS`
- `SCHEMA_VERSION`

### Node Defaults

```typescript
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  formatNodeRef,
} from "./libs/memory/index.js";

console.log(formatNodeRef(DEFAULT_PERSONAL_NODE)); // "Personal:personal"
```

## 🧪 Testing

- **Unit Tests**: `store.test.ts` (Vitest) - Mocks the filesystem to test logic and invariants.
- **Integration Test**: `test-store.ts` (tsx) - Exercises real disk I/O and confirms the Genesis seed.
