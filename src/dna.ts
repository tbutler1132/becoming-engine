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

/**
 * Node kinds with semantic meaning for regulation
 * - agent: has agency, can initiate (person, org, team, AI)
 * - system: technical/infrastructure (software, service, device)
 * - domain: life context or project (health, creative, "Project X")
 */
export const NODE_KINDS = ["agent", "system", "domain"] as const;

/** Legacy node types for migration compatibility */
export const LEGACY_NODE_TYPES = ["Personal", "Org"] as const;

/** @deprecated Use NODE_KINDS for new code. Kept for backwards compatibility. */
export const NODE_TYPES = LEGACY_NODE_TYPES;

/** Default node ID for personal nodes (single-node setups and v1 migration) */
export const DEFAULT_PERSONAL_NODE_ID = "personal" as const;

/** Default node ID for org nodes (single-node setups and v1 migration) */
export const DEFAULT_ORG_NODE_ID = "org" as const;

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE NODE — The Becoming Engine's own regulatory node (dogfooding)
// ═══════════════════════════════════════════════════════════════════════════

/** The Engine's node ID (a system node that regulates itself) */
export const ENGINE_NODE_ID = "system:becoming-engine" as const;

/** The Engine's variable IDs (what the Engine regulates about itself) */
export const ENGINE_VARIABLE_IDS = {
  codeHealth: "var:engine:code-health",
  uxCoherence: "var:engine:ux-coherence",
  doctrineAlignment: "var:engine:doctrine-alignment",
  adoption: "var:engine:adoption",
} as const;

/** The valid variable statuses (homeostatic states) */
export const VARIABLE_STATUSES = ["Low", "InRange", "High", "Unknown"] as const;

/** The valid measurement cadences for Variables (how often to evaluate) */
export const MEASUREMENT_CADENCES = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "asNeeded",
] as const;

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
  "audit",
] as const;

/** The valid relation types for Links (typed relationships) */
export const LINK_RELATIONS = [
  "supports",
  "tests",
  "blocks",
  "responds_to",
  "derived_from",
  // Hierarchical relations (nodes as autonomous peers with relationships)
  "part_of", // child → parent: "domain:health part_of agent:tim"
  "coordinates", // parent → child: "agent:company coordinates agent:team:eng"
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

/** The valid proxy value types (what kind of data a proxy measures) */
export const PROXY_VALUE_TYPES = ["numeric", "boolean", "categorical"] as const;

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
export const SCHEMA_VERSION = 13 as const;

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRANE — Exception tracking for constraint bypasses
// ═══════════════════════════════════════════════════════════════════════════

/** The valid mutation types that can trigger Membrane exceptions */
export const MUTATION_TYPES = ["episode", "action", "signal"] as const;

/** The valid original decisions that can be overridden */
export const OVERRIDE_DECISIONS = ["warn", "block"] as const;
