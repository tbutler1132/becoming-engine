# Sensorium Organ

The Sensorium organ is responsible for **Input Parsing**: converting raw external signals into typed commands and observations the system can understand.

## Why Sensorium Exists

The system needs a clean boundary between messy external input (CLI arguments, future: natural language) and the typed world of the Regulator. Sensorium is that boundary: it parses, validates, and produces structured output. It never executes — that's the CLI's job. This separation keeps parsing testable and the Regulator free of string-handling complexity.

**Doctrine constraint:** Sensorium never triggers Actions directly — it only parses and validates. The CLI interprets observations and calls the Regulator.

## 🧠 Responsibilities

- Parse CLI arguments into typed `SensoriumCommand` objects
- Parse observation input into typed `Observation` objects
- Validate node references (`NodeRef`) and option values
- Return explicit `Result` types for invalid input (no silent failures)

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `parseCli(argv)`

Parses a command-line argument array into a `Result<SensoriumCommand>`:

```typescript
import { parseCli } from "./libs/sensorium/index.js";

const result = parseCli([
  "open",
  "--type",
  "Explore",
  "--objective",
  "Learn X",
]);
if (result.ok) {
  console.log(result.value.kind); // "open"
}
```

### `parseObservation(argv)`

Parses observation input into a `Result<Observation>`:

```typescript
import { parseObservation } from "./libs/sensorium/index.js";

const result = parseObservation([
  "observe",
  "signal",
  "--variableId",
  "v1",
  "--status",
  "InRange",
]);
if (result.ok && result.value.type === "variableProxySignal") {
  console.log(result.value.status); // "InRange"
}
```

### `parseNodeRef(input)`

Parses a string like `"Personal:personal"` into a `Result<NodeRef>`:

```typescript
import { parseNodeRef } from "./libs/sensorium/index.js";

const result = parseNodeRef("Personal:personal");
if (result.ok) {
  console.log(result.value.type, result.value.id); // "Personal" "personal"
}
```

### Types

| Type                             | Purpose                                                                 |
| -------------------------------- | ----------------------------------------------------------------------- |
| `SensoriumCommand`               | Discriminated union: status, signal, act, open, close                   |
| `Observation`                    | Discriminated union: variableProxySignal, freeformNote, episodeProposal |
| `VariableProxySignalObservation` | Signal about a variable's status                                        |
| `FreeformNoteObservation`        | Unstructured input to become a Note                                     |
| `EpisodeProposalObservation`     | Proposal to open an episode                                             |
| `Result<T>`                      | Success/error discriminated union (re-exported from shared)             |

### Constants

- `OBSERVATION_TYPES`: Valid observation type values (from DNA)

## 🧪 Testing

- **Unit Tests**: `cli.test.ts` (Vitest) — covers parsing for all command types, observation types, and error cases.
