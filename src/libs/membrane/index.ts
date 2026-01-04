/**
 * Membrane Organ — Normative Constraint Enforcement
 *
 * The Membrane gates mutations through Normative Model constraints.
 * It checks whether an action is allowed, warned, or blocked before
 * the Regulator applies it.
 *
 * @example
 * ```typescript
 * import { checkEpisodeConstraints } from '@libs/membrane';
 *
 * const result = checkEpisodeConstraints(state, {
 *   node: DEFAULT_PERSONAL_NODE,
 *   episodeType: 'Explore',
 * });
 *
 * if (result.decision === 'block') {
 *   console.log(`Blocked: ${result.reason}`);
 * }
 * ```
 *
 * @module Membrane
 */
export * from "./types.js";
export { checkEpisodeConstraints } from "./logic.js";
