# Regulator Organ

The Regulator organ is responsible for the **Cybernetic Control Loop**: enforcing homeostasis rules and managing temporary interventions (Episodes).

## 🎯 Responsibilities

- **Constraint Enforcement**: Validates and enforces system rules (Max 1 Explore per node, No Action without Episode).
- **Episode Management**: Opens and closes Episodes while maintaining system invariants.
- **Variable Monitoring**: Provides filtered views of Variables by node type.
- **State Mutations**: Returns new State objects (immutable) reflecting episode lifecycle changes.

## 🛡 Constraints Enforced

| Constraint | Rule |
|------------|------|
| **Max Active Explores** | Each node can have at most `MAX_ACTIVE_EXPLORE_PER_NODE` (1) active Explore episodes |
| **Silence Rule** | Actions can only be created when an active Episode exists for that node |
| **Valid Episodes** | Episodes must have non-empty objectives |

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
const variables = regulator.getVariables(state, "Personal");
const canExplore = regulator.canStartExplore(state, "Personal");
const canAct = regulator.canAct(state, "Personal");

// Mutation methods (return new State)
const result = regulator.openEpisode(state, {
  node: "Personal",
  type: "Stabilize",
  objective: "Restore agency"
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

