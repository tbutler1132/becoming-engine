// Membrane types and constraints
// The Membrane organ enforces Normative Model constraints before mutations
// This is the validation gate described in the doctrine's canonical flow

import type { EpisodeType, NodeRef } from "../memory/index.js";

// Re-export shared Result type for consumers
export type { Result } from "../shared/index.js";

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRANE RESULTS — Outcomes of constraint checks
// ═══════════════════════════════════════════════════════════════════════════

/**
 * A warning from a Normative Model with enforcement: "warn".
 * The mutation is allowed, but the caller should surface this to the user.
 */
export interface MembraneWarning {
  modelId: string;
  statement: string;
}

/**
 * Result of a Membrane constraint check.
 * Discriminated union: allow | warn | block
 *
 * - allow: No blocking constraints, proceed with mutation
 * - warn: Proceed but surface warnings to user
 * - block: Mutation is forbidden by a Normative Model
 */
export type MembraneResult =
  | { decision: "allow" }
  | { decision: "warn"; warnings: MembraneWarning[] }
  | { decision: "block"; reason: string; modelId: string };

// ═══════════════════════════════════════════════════════════════════════════
// CHECK CONTEXTS — Input for different mutation types
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Context for checking episode opening constraints.
 * Membrane uses this to find applicable Normative Models.
 */
export interface EpisodeCheckContext {
  node: NodeRef;
  episodeType: EpisodeType;
}

// Future: ActionCheckContext, SignalCheckContext, etc.
// The pattern is: provide enough context for Membrane to match applicable models
