# Developer Workflow (Humans + Agents)

This repository is a cybernetic system. The codebase should remain **quiet**, **legible**, and **easy to delete**.

## Canonical Loop

1. Install:

```bash
npm install
```

2. Make small changes.
3. Run the health gate:

```bash
npm run check
```

If `check` is green, the repo is healthy.

## Repository Health Gate

`npm run check` runs:

- unit tests (`npm test`)
- TypeScript typecheck (`npx tsc --noEmit`)
- lint (`npm run lint`)
- formatting check (`npm run format:check`)

## Module Boundaries (Organs)

Code under `src/libs/<organ>` is a module (“organ”).

### Rules

- Each module exposes a **public API** via `index.ts`.
- Other modules may only import from that public API:
  - ✅ `../memory/index.js`
  - ❌ `../memory/types.js`
  - ❌ `../memory/store.js`

ESLint enforces these boundaries. Do not bypass the rules.

## Where Code Goes

- `src/libs/*`: organs (pure logic + bounded side effects)
- `src/apps/*`: executables/interfaces (CLI/UI)
- `docs/*`: doctrine + standards + operating manual

## Configuration

Follow the **Selective Configuration Principle** in `docs/standards.md`:

> Configure boundaries, not mechanisms.

Prefer explicit policy objects (dependency injection) over environment-driven behavior.

## Subagents (Recommended Setup)

If you’re using subagents, see: `docs/subagents.md`.

## Adding a New Organ (Checklist)

- `src/libs/<organ>/index.ts` (public API)
- `src/libs/<organ>/README.md` (responsibility + contract)
- `src/libs/<organ>/*.test.ts` (tests focus on behavior)
- Use pure functions where possible: `(State, Input) => NewState`
- Keep baseline quiet (silent by default)
