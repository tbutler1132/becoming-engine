# Sensorium Organ

The Sensorium organ is responsible for **Input Parsing**: converting raw external signals into typed commands and observations the system can understand.

## 🎯 Role

Sensorium is the system's sensory layer. It takes unstructured input (CLI arguments) and produces structured, validated commands for the CLI to orchestrate.

**Doctrine constraint:** Sensorium never triggers Actions directly — it only parses and validates. The CLI interprets observations and calls the Regulator.

## 🧠 Responsibilities

- Parse CLI arguments into typed `SensoriumCommand` objects
- Parse observation input into typed `Observation` objects
- Validate node references (`NodeRef`) and option values
- Return explicit `Result` types for invalid input (no silent failures)

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `parseCli(argv)`

Parses a command-line argument array into a `Result<SensoriumCommand>`.

### `parseObservation(argv)`

Parses observation input into a `Result<Observation>`. Used for the structured sensing flow.

### `parseNodeRef(input)`

Parses a string like `"Personal:personal"` into a `NodeRef`.

### `SensoriumCommand`

A discriminated union of supported commands:

- `status` — view node dashboard
- `signal` — update a Variable status
- `act` — create an Action
- `open` — open an Episode (Stabilize or Explore)
- `close` — close an Episode with a closure note

### `Observation`

A discriminated union of observation types (defined in DNA):

- `variableProxySignal` — signal about a variable's status
- `freeformNote` — unstructured input to become a Note
- `episodeProposal` — proposal to open an episode

Observations are ephemeral intermediate values that the CLI interprets into Regulator mutations.

## 🧪 Testing

- **Unit Tests**: `cli.test.ts` (Vitest) — covers parsing for all command types, observation types, and error cases.
