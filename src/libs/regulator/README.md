# Regulator Organ

The Regulator organ is responsible for the **Cybernetic Control Loop**: enforcing homeostasis rules and managing temporary interventions (Episodes).

## Why Regulator Exists

The system needs a gatekeeper that ensures state transitions obey invariants. Without the Regulator, unlimited Episodes could be opened, orphaned Actions created, or variables updated without ownership checks. The Regulator is the single point where these rules are enforced, separating policy (what's allowed) from mechanism (how it's done).

## 🎯 Responsibilities

- **Constraint Enforcement**: Validates and enforces system rules (Max 1 Explore per node, Max 1 Stabilize per variable).
- **Episode Management**: Opens and closes Episodes while maintaining system invariants.
- **Variable Monitoring**: Provides filtered views of Variables by node type.
- **State Mutations**: Returns new State objects (immutable) reflecting episode lifecycle changes.

## 🛡 Constraints Enforced

| Constraint                 | Rule                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| **Max Active Explores**    | Each node can have at most `MAX_ACTIVE_EXPLORE_PER_NODE` (1) active Explore episodes                     |
| **Stabilize Per Variable** | Each node can have at most `MAX_ACTIVE_STABILIZE_PER_VARIABLE` (1) active Stabilize episode per Variable |
| **Valid Episodes**         | Episodes must have non-empty objectives                                                                  |

## ⚙️ Policy Configuration (Prepared for Networks of Organisms)

The Regulator supports a **policy layer** so boundaries can vary per node without changing the mechanism.

```typescript
import { Regulator, DEFAULT_REGULATOR_POLICY } from "./libs/regulator/index.js";
import { DEFAULT_PERSONAL_NODE } from "./libs/memory/index.js";

const regulator = new Regulator({
  policy: {
    ...DEFAULT_REGULATOR_POLICY,
    maxActiveExplorePerNodeByNode: {
      [`${DEFAULT_PERSONAL_NODE.type}:${DEFAULT_PERSONAL_NODE.id}`]: 3,
    },
  },
});
```

## 🏗 Architecture: Pure Logic First

- **`logic.ts`**: Pure functions `(State, Input) => Result | NewState`. Easily testable without mocks.
- **`engine.ts`**: Thin class wrapper that composes pure functions and provides logging integration.
- **`types.ts`**: Result types and constraint constants (no magic numbers).

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `Regulator` Class

The primary class for cybernetic control:

```typescript
import { Regulator } from "./libs/regulator/index.js";
import { DEFAULT_PERSONAL_NODE, EPISODE_TYPES } from "./libs/memory/index.js";

const regulator = new Regulator();

// Query methods
const canExplore = regulator.canStartExplore(state, DEFAULT_PERSONAL_NODE);

// Mutation methods (return Result<State>)
const result = regulator.openEpisode(state, {
  episodeId: "episode-1",
  node: DEFAULT_PERSONAL_NODE,
  type: "Explore",
  objective: "Learn new skill",
  openedAt: new Date().toISOString(),
});

if (result.ok) {
  const newState = result.value;
}
```

### `getStatusData(state, node)`

Returns status data for CLI display (baseline mode vs active mode with details):

```typescript
import { getStatusData } from "./libs/regulator/index.js";

const status = getStatusData(state, DEFAULT_PERSONAL_NODE);
if (status.mode === "baseline") {
  console.log("System at baseline");
} else {
  console.log(`Active episodes: ${status.episodes.length}`);
}
```

### Types

| Type                 | Purpose                                    |
| -------------------- | ------------------------------------------ |
| `Result<T>`          | Success/error discriminated union          |
| `StatusData`         | CLI display data (baseline or active mode) |
| `OpenEpisodeParams`  | Parameters for opening an episode          |
| `CloseEpisodeParams` | Parameters for closing an episode          |
| `SignalParams`       | Parameters for signaling variable status   |
| `CreateActionParams` | Parameters for creating an action          |
| `RegulatorPolicy`    | Policy configuration interface             |

### Constants

- `MAX_ACTIVE_EXPLORE_PER_NODE`: Explore episode limit per node (default: 1)
- `MAX_ACTIVE_STABILIZE_PER_VARIABLE`: Stabilize episode limit per variable (default: 1)
- `DEFAULT_REGULATOR_POLICY`: Default policy configuration

## 🧪 Testing

- **Unit Tests**: `logic.test.ts` (Vitest) - Tests pure functions directly without mocking.
- **Integration Tests**: `engine.test.ts` (Vitest) - Tests Regulator class wrapper and logger integration.

## 🔇 Cybernetic Quiet

Like the Memory organ, the Regulator is **silent by default**:

- Logger injection is optional
- Defaults to a silent logger (no console noise at baseline)
- Provides observability when explicitly requested

This aligns with the doctrine: **"Idleness is a success state."**
