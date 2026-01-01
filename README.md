# Becoming Engine

A cybernetic doctrine for preserving viability, enabling learning, and allowing ambition without identity collapse through temporary, bounded interventions.

## 🧬 Architecture: The Organism

The system is organized into discrete "organs" (modules) with strict boundaries and explicit responsibilities.

### `/src/libs` (Organs)

- **`memory`**: The system's soul. Handles ontology (definitions) and persistence. Ensures state survives restarts with atomic writes and schema versioning.
- **`regulator`**: The cybernetic control loop. Enforces homeostasis rules (Max 1 Explore, Max 1 Stabilize per variable) and manages temporary interventions through pure, composable functions.
- **`sensorium`**: Input parsing (currently: CLI parsing stub). Converts external signals into typed commands for the system.

### `/src/apps` (Applications)

- **`cortex`**: The interface (CLI). Orchestrates `Sensorium → Regulator → Memory`.

## 🛠 Tech Stack

- **Runtime**: Node.js (ESM)
- **Language**: TypeScript (Strict mode)
- **Runner**: [tsx](https://tsx.is/)
- **Testing**: [Vitest](https://vitest.dev/)
- **Persistence**: Atomic JSON storage with `fs-extra`

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Running Tests

```bash
# Run unit tests (Vitest)
npm test

# Run unit tests in watch mode
npm run test:watch

# Run memory organ integration smoke test
npm run test:memory
```

## 🧠 Cortex CLI

```bash
# Status dashboard (quiet on baseline)
npm run becoming:status

# Run any command
npm run becoming:dev -- status --node Personal:personal
npm run becoming:dev -- signal --node Personal:personal --variableId <id> --status InRange
npm run becoming:dev -- act --node Personal:personal --description "Do the thing"
npm run becoming:dev -- act --node Personal:personal --episodeId <id> --description "Do the thing"
```

## 📜 Doctrine

Refer to the `docs/` directory for the core principles:

- [System Context](./docs/system_context.md): The cybernetic philosophy.
- [Engineering Standards](./docs/standards.md): Coding rules and AI directives.
