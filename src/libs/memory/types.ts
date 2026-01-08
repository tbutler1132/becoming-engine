// Ontology definitions for the Becoming Engine
// The Memory organ is responsible for these definitions
// Constants are imported from DNA (the source of truth) and re-exported

// Re-export DNA constants for consumers
export {
  NODE_TYPES,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
  VARIABLE_STATUSES,
  MEASUREMENT_CADENCES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  ACTION_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  NOTE_TAGS,
  LINK_RELATIONS,
  SCHEMA_VERSION,
  MUTATION_TYPES,
  OVERRIDE_DECISIONS,
  PROXY_VALUE_TYPES,
} from "../../dna.js";

// Import for local type derivations
import {
  NODE_TYPES,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
  VARIABLE_STATUSES,
  MEASUREMENT_CADENCES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  ACTION_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  NOTE_TAGS,
  LINK_RELATIONS,
  SCHEMA_VERSION,
  MUTATION_TYPES,
  OVERRIDE_DECISIONS,
  PROXY_VALUE_TYPES,
} from "../../dna.js";

// Type derivations from DNA constants
export type NodeType = (typeof NODE_TYPES)[number];
export type VariableStatus = (typeof VARIABLE_STATUSES)[number];
export type MeasurementCadence = (typeof MEASUREMENT_CADENCES)[number];
export type EpisodeType = (typeof EPISODE_TYPES)[number];
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];
export type ActionStatus = (typeof ACTION_STATUSES)[number];
export type ModelType = (typeof MODEL_TYPES)[number];
export type ModelScope = (typeof MODEL_SCOPES)[number];
export type EnforcementLevel = (typeof ENFORCEMENT_LEVELS)[number];
export type NoteTag = (typeof NOTE_TAGS)[number];
export type LinkRelation = (typeof LINK_RELATIONS)[number];
export type SchemaVersion = typeof SCHEMA_VERSION;
export type MutationType = (typeof MUTATION_TYPES)[number];
export type OverrideDecision = (typeof OVERRIDE_DECISIONS)[number];
export type ProxyValueType = (typeof PROXY_VALUE_TYPES)[number];

export type NodeId = string;

export interface NodeRef {
  type: NodeType;
  id: NodeId;
}

export const DEFAULT_PERSONAL_NODE: NodeRef = {
  type: "Personal",
  id: DEFAULT_PERSONAL_NODE_ID,
};

export const DEFAULT_ORG_NODE: NodeRef = {
  type: "Org",
  id: DEFAULT_ORG_NODE_ID,
};

/**
 * Formats a NodeRef as "Type:Id" string.
 * Used for display and as map keys.
 */
export function formatNodeRef(node: NodeRef): string {
  return `${node.type}:${node.id}`;
}

/**
 * Compares two NodeRefs for equality.
 * Two NodeRefs are equal if they have the same type and id.
 */
export function nodeRefEquals(a: NodeRef, b: NodeRef): boolean {
  return a.type === b.type && a.id === b.id;
}

export interface Variable {
  id: string;
  node: NodeRef;
  name: string;
  status: VariableStatus;
  /** What this variable regulates */
  description?: string;
  /** Qualitative belief: what "in range" means for this dimension */
  preferredRange?: string;
  /** How often to evaluate this variable */
  measurementCadence?: MeasurementCadence;
}

export interface Episode {
  id: string;
  node: NodeRef;
  type: EpisodeType;
  /**
   * Stabilize episodes are scoped to a Variable.
   * Explore episodes are typically unscoped (learning across a node).
   */
  variableId?: string;
  objective: string;
  status: EpisodeStatus;
  /** ISO timestamp when episode was opened */
  openedAt: string;
  /** ISO timestamp when episode was closed (set on close) */
  closedAt?: string;
  /** Optional link to closure note (set on close, prep for MP5) */
  closureNoteId?: string;
  /** Optional timebox in days — episode should close/expire after this duration */
  timeboxDays?: number;
}

export interface Action {
  id: string;
  description: string;
  status: ActionStatus;
  /**
   * Optional. Actions may exist without an Episode, but they carry zero authority by default.
   * When present, the Episode must exist and be Active for the Action to be considered "in-cycle".
   */
  episodeId?: string;
}

export interface Note {
  id: string;
  content: string;
  /** ISO timestamp when note was created */
  createdAt: string;
  /** Semantic tags for workflow distinction (inbox, processed, etc.) */
  tags: NoteTag[];
  /** Optional array of object IDs this note is linked to */
  linkedObjects?: string[];
}

export interface Model {
  id: string;
  type: ModelType;
  statement: string;
  /** Confidence level 0.0 to 1.0 */
  confidence?: number;
  /** Where the belief applies */
  scope?: ModelScope;
  /** Enforcement level (only applicable to Normative models) */
  enforcement?: EnforcementLevel;
  /** Whether exceptions can be logged against this model (default: true for warn, false for block) */
  exceptionsAllowed?: boolean;
}

export interface Link {
  id: string;
  /** Reference to the source object */
  sourceId: string;
  /** Reference to the target object */
  targetId: string;
  /** The type of relationship */
  relation: LinkRelation;
  /** Optional strength/confidence of the relationship (0.0 to 1.0) */
  weight?: number;
}

/**
 * A MembraneException records when a user bypassed a Normative Model constraint.
 * This provides audit trail for warn acknowledgments and block overrides.
 */
export interface MembraneException {
  id: string;
  /** The Normative Model that was bypassed */
  modelId: string;
  /** What kind of decision was overridden */
  originalDecision: OverrideDecision;
  /** User-provided reason for proceeding */
  justification: string;
  /** What mutation was being attempted */
  mutationType: MutationType;
  /** ID of the resulting mutation (episode/action ID) */
  mutationId: string;
  /** ISO timestamp */
  createdAt: string;
}

/**
 * Thresholds for inferring Variable status from proxy readings.
 * Used with numeric proxies to suggest when a Variable is Low/High.
 */
export interface ProxyThresholds {
  /** status = Low if value < this */
  lowBelow?: number;
  /** status = High if value > this */
  highAbove?: number;
}

/**
 * A Proxy is a concrete signal that informs a Variable.
 * Proxies are named data sources (e.g., "Sleep hours", "Morning energy")
 * that can be measured and used to suggest Variable status.
 */
export interface Proxy {
  id: string;
  /** The Variable this proxy informs */
  variableId: string;
  /** Human-readable name (e.g., "Sleep hours", "Morning energy") */
  name: string;
  /** Optional description of what this proxy measures */
  description?: string;
  /** What kind of values this proxy records */
  valueType: ProxyValueType;
  /** Unit of measurement (e.g., "hours", "1-10", "%") */
  unit?: string;
  /** For categorical proxies: the allowed values */
  categories?: string[];
  /** For numeric proxies: thresholds for status inference */
  thresholds?: ProxyThresholds;
}

/**
 * Discriminated union for proxy reading values.
 * Supports numeric, boolean, and categorical data.
 */
export type ProxyValue =
  | { type: "numeric"; value: number }
  | { type: "boolean"; value: boolean }
  | { type: "categorical"; value: string };

/**
 * A ProxyReading is a timestamped measurement from a proxy.
 * Readings are stored data used for status inference.
 */
export interface ProxyReading {
  id: string;
  /** Which proxy this reading is for */
  proxyId: string;
  /** The measured value */
  value: ProxyValue;
  /** ISO timestamp when reading was recorded */
  recordedAt: string;
  /** How the reading was obtained (e.g., "manual", integration name) */
  source?: string;
}

export interface State {
  schemaVersion: SchemaVersion;
  variables: Variable[];
  episodes: Episode[];
  actions: Action[];
  notes: Note[];
  models: Model[];
  links: Link[];
  exceptions: MembraneException[];
  proxies: Proxy[];
  proxyReadings: ProxyReading[];
}

/**
 * Creates an empty State object with the current schema version.
 *
 * **Intent:** Provides a clean, empty state for testing or initialization.
 * Use this instead of manually constructing empty states.
 *
 * **Contract:**
 * - Returns: Valid State object with empty collections
 * - Schema version is always current (SCHEMA_VERSION from DNA)
 */
export function createEmptyState(): State {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: [],
    episodes: [],
    actions: [],
    notes: [],
    models: [],
    links: [],
    exceptions: [],
    proxies: [],
    proxyReadings: [],
  };
}
