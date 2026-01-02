# Sensorium Organ

The Sensorium organ is responsible for **Input Parsing**: converting raw external signals into typed commands the system can understand.

## 🎯 Role

Sensorium is the system's sensory layer. It takes unstructured input (CLI arguments) and produces structured, validated commands for the CLI to orchestrate.

## 🧠 Responsibilities

- Parse CLI arguments into typed `SensoriumCommand` objects
- Validate node references (`NodeRef`) and option values
- Return explicit `Result` types for invalid input (no silent failures)

## 🔌 Public API

The organ exposes its API via `index.ts`.

### `parseCli(argv)`

Parses a command-line argument array into a `SensoriumParseResult<SensoriumCommand>`.

### `parseNodeRef(input)`

Parses a string like `"Personal:personal"` into a `NodeRef`.

### `SensoriumCommand`

A discriminated union of supported commands:

- `status` — view node dashboard
- `signal` — update a Variable status
- `act` — create an Action

## 🧪 Testing

- **Unit Tests**: `cli.test.ts` (Vitest) — covers parsing for all command types and error cases.
