// Ontology definitions for the Becoming Engine
// The Memory organ is responsible for these definitions

export const NODE_TYPES = ["Personal", "Org"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

// Default node identities (for single-node-per-type setups and v1 migration)
export const DEFAULT_PERSONAL_NODE_ID = "personal" as const;
export const DEFAULT_ORG_NODE_ID = "org" as const;

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

export const VARIABLE_STATUSES = ["Low", "InRange", "High"] as const;
export type VariableStatus = (typeof VARIABLE_STATUSES)[number];

export const EPISODE_TYPES = ["Stabilize", "Explore"] as const;
export type EpisodeType = (typeof EPISODE_TYPES)[number];

export const EPISODE_STATUSES = ["Active", "Closed"] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const ACTION_STATUSES = ["Pending", "Done"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const SCHEMA_VERSION = 3 as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

export interface Variable {
  id: string;
  node: NodeRef;
  name: string;
  status: VariableStatus;
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
}

export interface State {
  schemaVersion: SchemaVersion;
  variables: Variable[];
  episodes: Episode[];
  actions: Action[];
  notes: Note[];
}
