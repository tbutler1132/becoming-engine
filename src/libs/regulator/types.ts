// Regulator types and constraints
// The Regulator organ enforces cybernetic homeostasis rules
// Constraint constants are imported from DNA (the source of truth) and re-exported

import { EPISODE_TYPES } from "../memory/index.js";
import type {
  EnforcementLevel,
  ModelScope,
  ModelType,
  NodeRef,
  NoteTag,
  VariableStatus,
} from "../memory/index.js";

// Re-export DNA constraint constants for consumers
export {
  MAX_ACTIVE_EXPLORE_PER_NODE,
  MAX_ACTIVE_STABILIZE_PER_VARIABLE,
} from "../../dna.js";

// Result type for operations that can fail
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

type StabilizeEpisodeType = (typeof EPISODE_TYPES)[0];
type ExploreEpisodeType = (typeof EPISODE_TYPES)[1];

export type OpenEpisodeParams =
  | {
      episodeId: string;
      node: NodeRef;
      type: StabilizeEpisodeType;
      variableId: string;
      objective: string;
      openedAt: string;
    }
  | {
      episodeId: string;
      node: NodeRef;
      type: ExploreEpisodeType;
      objective: string;
      openedAt: string;
    };

// Optional variable updates when closing an episode
export interface VariableUpdate {
  id: string;
  status: VariableStatus;
}

/** Note to be created and attached on episode closure */
export interface ClosureNote {
  id: string;
  content: string;
}

export interface CloseEpisodeParams {
  episodeId: string;
  closedAt: string;
  closureNote: ClosureNote;
  variableUpdates?: VariableUpdate[];
  modelUpdates?: ModelUpdate[];
}

export interface SignalParams {
  node: NodeRef;
  variableId: string;
  status: VariableStatus;
}

export interface CreateActionParams {
  actionId: string;
  node: NodeRef;
  episodeId?: string;
  description: string;
}

export interface CreateModelParams {
  modelId: string;
  type: ModelType;
  statement: string;
  confidence?: number;
  scope?: ModelScope;
  enforcement?: EnforcementLevel;
}

export interface UpdateModelParams {
  modelId: string;
  statement?: string;
  confidence?: number;
  scope?: ModelScope;
  enforcement?: EnforcementLevel;
}

/** Model to be created or updated when closing an episode */
export interface ModelUpdate {
  id: string;
  type: ModelType;
  statement: string;
  confidence?: number;
  scope?: ModelScope;
  enforcement?: EnforcementLevel;
}

/** Params for creating a new note */
export interface CreateNoteParams {
  noteId: string;
  content: string;
  createdAt: string;
  tags?: NoteTag[];
  linkedObjects?: string[];
}

/** Params for adding a tag to an existing note */
export interface AddNoteTagParams {
  noteId: string;
  tag: NoteTag;
}

/** Params for removing a tag from an existing note */
export interface RemoveNoteTagParams {
  noteId: string;
  tag: NoteTag;
}
