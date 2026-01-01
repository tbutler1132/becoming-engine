// Ontology definitions for the Becoming Engine
// The Memory organ is responsible for these definitions

export const NODE_TYPES = ["Personal", "Org"] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const VARIABLE_STATUSES = ["Low", "InRange", "High"] as const;
export type VariableStatus = (typeof VARIABLE_STATUSES)[number];

export const EPISODE_TYPES = ["Stabilize", "Explore"] as const;
export type EpisodeType = (typeof EPISODE_TYPES)[number];

export const EPISODE_STATUSES = ["Active", "Closed"] as const;
export type EpisodeStatus = (typeof EPISODE_STATUSES)[number];

export const ACTION_STATUSES = ["Pending", "Done"] as const;
export type ActionStatus = (typeof ACTION_STATUSES)[number];

export const SCHEMA_VERSION = 1 as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

export interface Variable {
  id: string;
  node: NodeType;
  name: string;
  status: VariableStatus;
}

export interface Episode {
  id: string;
  node: NodeType;
  type: EpisodeType;
  objective: string;
  status: EpisodeStatus;
}

export interface Action {
  id: string;
  description: string;
  status: ActionStatus;
  episodeId: string; // Always linked to an Episode
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
