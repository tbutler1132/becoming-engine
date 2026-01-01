# ADR 0001: Organ Module Boundaries via `index.ts`

## Status

Accepted

## Context

The Becoming Engine is organized into organs under `src/libs/*`. Each organ should be independently understandable, replaceable, and testable. As the system grows, accidental coupling and “reaching into internals” will cause brittleness.

## Decision

1. Each organ exposes a **public API** via `index.ts`.
2. Other organs must import only from that public API (e.g., `../memory/index.js`), not internal files (e.g., `../memory/store.js`).
3. ESLint enforces these boundaries via restricted imports.

## Consequences

- **Pros**
  - Strong encapsulation and disposability
  - Clear contracts between organs
  - Lower risk of circular dependencies and hidden coupling
  - Agentic workflows stay consistent and low-friction

- **Cons**
  - Slightly more boilerplate (`index.ts` exports)
  - Some refactors require updating the public API intentionally

## Notes

This decision supports the doctrine’s emphasis on viability, legibility, and “quiet baseline.” Boundaries are explicit constraints, not identity commitments.
