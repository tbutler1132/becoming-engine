# Membrane

The **Membrane** organ enforces Normative Model constraints before mutations.

## Why Membrane Exists

The system needs a way to express "soft" constraints — rules that can warn or block, with the ability to override when justified. This is different from the Regulator's hard constraints (invariants). Membrane allows users to define Normative Models ("I shouldn't start Explore episodes on weekdays") that gate mutations without being absolute. The separation keeps the Regulator focused on system invariants while Membrane handles user-defined norms.

## Role in the Doctrine

From the canonical flow: `Sense → Store → Check Procedure → **Enforce Constraints** → Execute → Log`

The Membrane is the "Enforce Constraints" step. It gates mutations (like opening Episodes) through Normative Models that define what is and isn't allowed.

## Scope Matching

Normative Models apply to nodes based on their `scope` field:

| Scope      | Applies to          |
| ---------- | ------------------- |
| `personal` | Personal nodes only |
| `org`      | Org nodes only      |
| `domain`   | All nodes           |

## Enforcement Levels

Each Normative Model has an `enforcement` level:

| Level   | Behavior                                   |
| ------- | ------------------------------------------ |
| `none`  | Informational only, no enforcement         |
| `warn`  | Mutation allowed, but warning is surfaced  |
| `block` | Mutation is forbidden, returns block error |

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `checkEpisodeConstraints(state, context)`

Checks if opening an episode is allowed by Normative Models:

```typescript
import { checkEpisodeConstraints } from "./libs/membrane/index.js";

const result = checkEpisodeConstraints(state, {
  node: { type: "Personal", id: "personal" },
  episodeType: "Explore",
});

switch (result.decision) {
  case "allow":
    // Proceed with mutation
    break;
  case "warn":
    // Proceed but show warnings to user
    for (const w of result.warnings) {
      console.warn(`Warning: ${w.statement}`);
    }
    break;
  case "block":
    // Mutation forbidden
    console.error(`Blocked: ${result.reason}`);
    if (result.exceptionAllowed) {
      console.log("Override available with --override flag");
    }
    break;
}
```

### Types

| Type                  | Purpose                                                               |
| --------------------- | --------------------------------------------------------------------- |
| `MembraneResult`      | Discriminated union: allow, warn, or block                            |
| `MembraneWarning`     | Warning from a Normative Model (modelId, statement, exceptionAllowed) |
| `EpisodeCheckContext` | Context for checking episode constraints (node, episodeType)          |
| `Result<T>`           | Success/error discriminated union (re-exported from shared)           |

## Future Extensions

The Membrane is designed to be extended to gate other mutation types:

- `checkActionConstraints` — gate action creation
- `checkSignalConstraints` — gate variable signals

The core matching and evaluation logic is reusable across all mutation types.
