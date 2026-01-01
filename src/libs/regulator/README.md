# Regulator Organ

The Regulator organ is responsible for the **Cybernetic Control Loop**: enforcing homeostasis rules and managing temporary interventions (Episodes).

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

- **Default policy**: `DEFAULT_REGULATOR_POLICY` (uses `MAX_ACTIVE_EXPLORE_PER_NODE`)
- **Overrides**:
  - `maxActiveExplorePerNodeByType` lets you set limits per `NodeType`
  - `maxActiveExplorePerNodeByNode` lets you set limits per specific node (keyed by `"${node.type}:${node.id}"`)
  - `maxActiveStabilizePerVariableByType` lets you set Stabilize limits per `NodeType`
  - `maxActiveStabilizePerVariableByNode` lets you set Stabilize limits per specific node (keyed by `"${node.type}:${node.id}"`)

Example:

```typescript
import { Regulator, DEFAULT_REGULATOR_POLICY } from "./index.js";
import { DEFAULT_PERSONAL_NODE } from "../memory/index.js";

const regulator = new Regulator({
  policy: {
    ...DEFAULT_REGULATOR_POLICY,
    maxActiveExplorePerNodeByNode: {
      [`${DEFAULT_PERSONAL_NODE.type}:${DEFAULT_PERSONAL_NODE.id}`]: 3, // This specific node can have 3 active Explore episodes
    },
  },
});
```

## 🏗 Architecture: Pure Logic First

The Regulator follows the **Pure Logic Separation** principle from the engineering standards:

- **`logic.ts`**: Pure functions `(State, Input) => Result | NewState`. Easily testable without mocks.
- **`engine.ts`**: Thin class wrapper that composes pure functions and provides logging integration.
- **`types.ts`**: Result types and constraint constants (no magic numbers).

This design makes the core control loop logic universally testable and the class layer disposable if needed.

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `Regulator`

The primary class for cybernetic control.

```typescript
const regulator = new Regulator({ logger: optionalLogger });

// Query methods
import { DEFAULT_PERSONAL_NODE } from "../memory/index.js";

const variables = regulator.getVariables(state, DEFAULT_PERSONAL_NODE);
const canExplore = regulator.canStartExplore(state, DEFAULT_PERSONAL_NODE);
const canAct = regulator.canAct(state, DEFAULT_PERSONAL_NODE);

// Mutation methods (return new State)
const result = regulator.openEpisode(state, {
  episodeId: "episode-1",
  node: DEFAULT_PERSONAL_NODE,
  type: EPISODE_TYPES[0],
  variableId: "var-1",
  objective: "Restore agency",
});

if (result.ok) {
  const newState = result.value;
}
```

### `Result<T>`

Operations return `Result<T>` instead of throwing, making errors explicit and composable:

```typescript
type Result<T> = { ok: true; value: T } | { ok: false; error: string };
```

### Constants

- `MAX_ACTIVE_EXPLORE_PER_NODE`: The explore episode limit per node (exported for transparency).

## 🧪 Testing

- **Unit Tests**: `logic.test.ts` (Vitest) - Tests pure functions directly without mocking.
- **Integration Tests**: `engine.test.ts` (Vitest) - Tests Regulator class wrapper and logger integration.

## 🔇 Cybernetic Quiet

Like the Memory organ, the Regulator is **silent by default**:

- Logger injection is optional
- Defaults to a silent logger (no console noise at baseline)
- Provides observability when explicitly requested

This aligns with the doctrine: **"Idleness is a success state."**
