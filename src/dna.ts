/**
 * DNA — The Genetic Code of the Becoming Engine
 *
 * This file is the single source of truth for all regulatory invariants.
 * All organs (Memory, Regulator, Sensorium, etc.) import from here.
 *
 * If you need to change a fundamental rule, change it HERE.
 * Changes here are mutations to the species, not to any single organism.
 *
 * The dna.test.ts file acts as a tripwire — it hardcodes expected values
 * so any change requires explicit acknowledgment.
 */

// ═══════════════════════════════════════════════════════════════════════════
// ONTOLOGY — The fundamental types that define the organism's structure
// ═══════════════════════════════════════════════════════════════════════════

/** The valid node types in the system (organisms being regulated) */
export const NODE_TYPES = ["Personal", "Org"] as const;

/** Default node ID for personal nodes (single-node setups and v1 migration) */
export const DEFAULT_PERSONAL_NODE_ID = "personal" as const;

/** Default node ID for org nodes (single-node setups and v1 migration) */
export const DEFAULT_ORG_NODE_ID = "org" as const;

/** The valid variable statuses (homeostatic states) */
export const VARIABLE_STATUSES = ["Low", "InRange", "High"] as const;

/** The valid episode types (temporary interventions) */
export const EPISODE_TYPES = ["Stabilize", "Explore"] as const;

/** The valid episode statuses (lifecycle states) */
export const EPISODE_STATUSES = ["Active", "Closed"] as const;

/** The valid action statuses (execution states) */
export const ACTION_STATUSES = ["Pending", "Done"] as const;

/** The valid model types (belief categories) */
export const MODEL_TYPES = ["Descriptive", "Procedural", "Normative"] as const;

/** The valid model scopes (where the belief applies) */
export const MODEL_SCOPES = ["personal", "org", "domain"] as const;

/** The valid enforcement levels (for Normative models) */
export const ENFORCEMENT_LEVELS = ["none", "warn", "block"] as const;

/** The valid semantic tags for Notes (inbox/processed workflow) */
export const NOTE_TAGS = [
  "inbox",
  "pending_approval",
  "processed",
  "closure_note",
] as const;

/** The valid relation types for Links (typed relationships) */
export const LINK_RELATIONS = [
  "supports",
  "tests",
  "blocks",
  "responds_to",
  "derived_from",
] as const;

/** The valid observation types (what Sensorium senses from input) */
export const OBSERVATION_TYPES = [
  "variableProxySignal",
  "freeformNote",
  "episodeProposal",
] as const;

/** The valid signal event types for federation (inter-node communication) */
export const SIGNAL_EVENT_TYPES = [
  "intent", // Node signals intent to act
  "status", // Node shares current status
  "completion", // Node signals task completion
] as const;

// ═══════════════════════════════════════════════════════════════════════════
// REGULATORY LIMITS — Constraints that preserve viability
// ═══════════════════════════════════════════════════════════════════════════

/** At most 1 active Explore Episode per Node (prevents learning sprawl) */
export const MAX_ACTIVE_EXPLORE_PER_NODE = 1;

/** At most 1 active Stabilize Episode per Variable (can't fix something two ways) */
export const MAX_ACTIVE_STABILIZE_PER_VARIABLE = 1;

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA — Versioning for data migrations
// ═══════════════════════════════════════════════════════════════════════════

/** Current schema version — increment when State shape changes */
export const SCHEMA_VERSION = 8 as const;

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRANE — Exception tracking for constraint bypasses
// ═══════════════════════════════════════════════════════════════════════════

/** The valid mutation types that can trigger Membrane exceptions */
export const MUTATION_TYPES = ["episode", "action", "signal"] as const;

/** The valid original decisions that can be overridden */
export const OVERRIDE_DECISIONS = ["warn", "block"] as const;
