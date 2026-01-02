# Becoming Engine

[![CI](https://github.com/tbutler1132/becoming-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/tbutler1132/becoming-engine/actions/workflows/ci.yml)

A cybernetic doctrine for preserving viability, enabling learning, and allowing ambition without identity collapse through temporary, bounded interventions.

## 🧬 Architecture: The Organism

The system is organized into discrete "organs" (modules) with strict boundaries and explicit responsibilities.

### `/src/libs` (Organs)

- **`memory`**: The system's soul. Handles ontology (definitions) and persistence. Ensures state survives restarts with atomic writes and schema versioning.
- **`regulator`**: The cybernetic control loop. Enforces homeostasis rules (Max 1 Explore, Max 1 Stabilize per variable) and manages temporary interventions through pure, composable functions.
- **`sensorium`**: Input parsing (currently: CLI parsing stub). Converts external signals into typed commands for the system.

### `/src/apps` (Applications)

- **`cli`**: The command-line interface. Orchestrates `Sensorium → Regulator → Memory`.

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

### Development Commands

```bash
# Run all checks (tests, types, lint, format)
npm run check

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run memory organ integration smoke test
npm run test:memory
```

> **Note**: Pre-commit hooks (via Husky) automatically run linting and formatting on staged files.

## 🧠 CLI Usage

```bash
# Status dashboard (quiet on baseline)
npm run becoming:status

# Run any command
npm run becoming:dev -- status --node Personal:personal
npm run becoming:dev -- signal --node Personal:personal --variableId <id> --status InRange
npm run becoming:dev -- act --node Personal:personal --description "Do the thing"
npm run becoming:dev -- act --node Personal:personal --episodeId <id> --description "Do the thing"

# Episode lifecycle
npm run becoming:dev -- open --node Personal:personal --type Explore --objective "Learn X"
npm run becoming:dev -- open --node Personal:personal --type Stabilize --variableId <id> --objective "Restore agency"
npm run becoming:dev -- close --node Personal:personal --episodeId <id>
```

## 📜 Doctrine

Refer to the `docs/` directory for the core principles:

- [System Context](./docs/system_context.md): The cybernetic philosophy.
- [Engineering Standards](./docs/standards.md): Coding rules and AI directives.
- [Operating Manual](./docs/becoming-engine.md): Core objects, rules, and workflow.
- [Roadmap](./docs/roadmap.md): A non-binding sequence of next micro-projects.

## 🔮 Vision: Three-Phase Evolution

The system evolves in three phases:

1. **Phase 1 (Current)**: Regulatory Layer — Variables, Episodes, Actions, Models, Links. How the organism regulates itself. Closed, minimal ontology. Command-driven.

2. **Phase 2 (Future)**: World Model Layer — Schemas, Entities. How the organism represents its environment. Open, extensible ontology with user-defined object types.

3. **Phase 3 (Future)**: Autonomous Regulator — Variable thresholds, pressure detection, Episode timebox, Regulator state machine. The system proposes and manages interventions automatically.

See the [Roadmap](./docs/roadmap.md) for details on all phases, and the [Tech Spec](./docs/tech-spec.md) for the complete technical vision.

## 🤖 For AI Agents

Starting a fresh session? Read these in order:

1. [System Context](./docs/system_context.md) — philosophy and doctrine
2. [Engineering Standards](./docs/standards.md) — coding rules
3. [Developer Workflow](./docs/dev_workflow.md) — contribution patterns
4. [Operating Manual](./docs/becoming-engine.md) — core objects and rules
5. [Roadmap](./docs/roadmap.md) — what's next

Run `npm run check` after every change.
