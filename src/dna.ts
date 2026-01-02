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
export const SCHEMA_VERSION = 4 as const;
