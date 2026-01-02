# Membrane

The **Membrane** organ enforces Normative Model constraints before mutations.

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

## Public API

```typescript
import { checkEpisodeConstraints } from "./membrane/index.js";

const result = checkEpisodeConstraints(state, {
  node: { type: "Personal", id: "personal" },
  episodeType: "Explore",
});

if (result.decision === "block") {
  console.error(`Blocked: ${result.reason}`);
}
```

## Future Extensions

The Membrane is designed to be extended to gate other mutation types:

- `checkActionConstraints` — gate action creation
- `checkSignalConstraints` — gate variable signals
- Generic `checkMutationConstraints` for any mutation type

The core matching and evaluation logic is reusable across all mutation types.
