# Memory Organ

The Memory organ is responsible for the system's **Ontology** (definitions of reality) and **Persistence** (remembrance).

## 🧠 Responsibilities

- **Ontology**: Defines the core types for Variables, Episodes, Actions, and Notes.
- **Persistence**: Safely saves and loads the system `State` to `data/state.json`.
- **Genesis**: Seeds the system with initial viability variables (Agency, Execution Capacity) if no state exists.

## 🛡 Robustness Features

- **Atomic Writes**: Uses a temp-and-rename strategy to prevent data corruption if the process dies mid-save.
- **Concurrency Locking**: Uses a `.lock` file to prevent multiple writers from clobbering the state.
- **Schema Versioning**: Includes a `schemaVersion` in the state file.
- **Automated Migration**: Automatically migrates older state files (v0/v1) to the current version (v2) on load.
- **Corruption Recovery**: If a state file is invalid or corrupt, it is backed up to a `.corrupt` file for inspection before the system falls back to a safe seed state.

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `JsonStore`

The primary class for state management.

- `load()`: Returns a `Promise<State>`. Always returns a valid state.
- `save(state)`: Returns a `Promise<void>`. Persists state atomically.

### `State` & `Variable`

The core interfaces of the system's current reality.

### Ontology Constants

Exported constants for valid types/statuses (e.g., `NODE_TYPES`, `VARIABLE_STATUSES`) to avoid "magic strings" in the rest of the application.

### Node Identity (`NodeRef`)

For multi-organism/network readiness, entities reference a node via `NodeRef`:

- `type`: `NodeType` (e.g., Personal, Org)
- `id`: stable identifier within that type (defaults exist for single-node-per-type setups)

## 🧪 Testing

- **Unit Tests**: `store.test.ts` (Vitest) - Mocks the filesystem to test logic and invariants.
- **Integration Test**: `test-store.ts` (tsx) - Exercises real disk I/O and confirms the Genesis seed.
