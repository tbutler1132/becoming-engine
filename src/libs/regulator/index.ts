/**
 * Regulator Organ — Cybernetic Control Loop
 *
 * The Regulator enforces homeostasis rules and manages episode lifecycle.
 * All state mutations flow through the Regulator, which validates constraints
 * before returning new immutable state.
 *
 * @example
 * ```typescript
 * import { Regulator } from '@libs/regulator';
 * import { DEFAULT_PERSONAL_NODE } from '@libs/memory';
 *
 * const regulator = new Regulator();
 * const result = regulator.openEpisode(state, {
 *   episodeId: 'ep-1',
 *   node: DEFAULT_PERSONAL_NODE,
 *   type: 'Explore',
 *   objective: 'Learn something',
 *   openedAt: new Date().toISOString(),
 * });
 * ```
 *
 * @module Regulator
 */
export * from "./types.js";
export * from "./policy.js";
export { Regulator } from "./engine.js";
export type { Logger } from "../shared/index.js";
export {
  getStatusData,
  getVariablesWithDescendants,
  getActiveEpisodesWithDescendants,
  getAggregateNodeHealth,
} from "./logic.js";
export type { AggregateHealth } from "./logic.js";
