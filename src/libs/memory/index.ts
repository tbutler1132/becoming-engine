/**
 * Memory Organ — Ontology and Persistence
 *
 * The Memory organ defines what exists (types) and remembers it (persistence).
 * It is the single source of truth for system state.
 *
 * @example
 * ```typescript
 * import { JsonStore, DEFAULT_PERSONAL_NODE, State } from '@libs/memory';
 *
 * const store = new JsonStore({ basePath: process.cwd() });
 * const state: State = await store.load();
 * ```
 *
 * @module Memory
 */
export * from "./types.js";
export * from "./store.js";
