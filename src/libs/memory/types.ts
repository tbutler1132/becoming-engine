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

export interface State {
  schemaVersion: SchemaVersion;
  variables: Variable[];
  episodes: Episode[];
  actions: Action[];
  notes: Note[];
  models: Model[];
  links: Link[];
  exceptions: MembraneException[];
}
