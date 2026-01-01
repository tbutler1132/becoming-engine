# Becoming Engine

A cybernetic doctrine for preserving viability, enabling learning, and allowing ambition without identity collapse through temporary, bounded interventions.

## 🧬 Architecture: The Organism

The system is organized into discrete "organs" (modules) with strict boundaries and explicit responsibilities.

### `/src/libs` (Organs)
- **`memory`**: The system's soul. Handles ontology (definitions) and persistence. Ensures state survives restarts with atomic writes and schema versioning.
- **`regulator`**: The cybernetic control loop. Enforces homeostasis rules (Max 1 Explore, No Action without Episode) and manages temporary interventions through pure, composable functions.
- **`sensorium`**: (In development) Input processing. Converts external signals into internal state updates.

### `/src/apps` (Applications)
- **`cortex`**: (In development) The interface. A CLI application that consumes the organs to provide a human interface to the system.

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

## 📜 Doctrine

Refer to the `docs/` directory for the core principles:
- [System Context](./docs/system_context.md): The cybernetic philosophy.
- [Engineering Standards](./docs/standards.md): Coding rules and AI directives.

