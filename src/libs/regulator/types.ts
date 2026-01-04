/**
 * Regulator Types and Constraints
 *
 * Defines parameter types for Regulator operations and re-exports
 * constraint constants from DNA.
 */

import { EPISODE_TYPES } from "../memory/index.js";
import type {
  Action,
  EnforcementLevel,
  Episode,
  LinkRelation,
  ModelScope,
  ModelType,
  MutationType,
  NodeRef,
  NoteTag,
  OverrideDecision,
  Variable,
  VariableStatus,
} from "../memory/index.js";

// Re-export DNA constraint constants for consumers
export {
  MAX_ACTIVE_EXPLORE_PER_NODE,
  MAX_ACTIVE_STABILIZE_PER_VARIABLE,
} from "../../dna.js";

// Re-export Result type from shared
export type { Result } from "../shared/index.js";

type StabilizeEpisodeType = (typeof EPISODE_TYPES)[0];
type ExploreEpisodeType = (typeof EPISODE_TYPES)[1];

/**
 * Parameters for opening an episode.
 *
 * Discriminated union based on episode type:
 * - **Stabilize**: Requires `variableId` (scoped to fixing one variable)
 * - **Explore**: No `variableId` (learning across the node)
 */
export type OpenEpisodeParams =
  | {
      /** Unique identifier for the new episode */
      episodeId: string;
      /** The node this episode belongs to */
      node: NodeRef;
      /** Stabilize episodes fix a specific variable */
      type: StabilizeEpisodeType;
      /** The variable being stabilized (required for Stabilize) */
      variableId: string;
      /** What this episode aims to achieve */
      objective: string;
      /** ISO-8601 timestamp when episode was opened */
      openedAt: string;
    }
  | {
      /** Unique identifier for the new episode */
      episodeId: string;
      /** The node this episode belongs to */
      node: NodeRef;
      /** Explore episodes are for learning */
      type: ExploreEpisodeType;
      /** What this episode aims to learn */
      objective: string;
      /** ISO-8601 timestamp when episode was opened */
      openedAt: string;
    };

/**
 * A variable status update to apply when closing an episode.
 * Allows episodes to update variable states as part of their closure.
 */
export interface VariableUpdate {
  /** The variable ID to update */
  id: string;
  /** The new status for this variable */
  status: VariableStatus;
}

/**
 * A note to be created and attached when closing an episode.
 * Captures learnings or outcomes from the episode.
 */
export interface ClosureNote {
  /** Unique identifier for the new note */
  id: string;
  /** The content of the closure note */
  content: string;
}

/**
 * Parameters for closing an episode.
 *
 * Episodes must be closed with a closure note. Explore episodes
 * additionally require at least one model update (learning is mandatory).
 */
export interface CloseEpisodeParams {
  /** The episode to close */
  episodeId: string;
  /** ISO-8601 timestamp when episode was closed */
  closedAt: string;
  /** Required note capturing closure outcome */
  closureNote: ClosureNote;
  /** Optional variable status updates to apply */
  variableUpdates?: VariableUpdate[];
  /** Model updates (required for Explore episodes) */
  modelUpdates?: ModelUpdate[];
}

/**
 * Parameters for signaling a variable status change.
 * This updates a variable's homeostatic status.
 */
export interface SignalParams {
  /** The node owning the variable */
  node: NodeRef;
  /** The variable to update */
  variableId: string;
  /** The new status (Low, InRange, High) */
  status: VariableStatus;
}

/**
 * Parameters for creating a new action.
 * Actions can optionally be scoped to an episode for authority.
 */
export interface CreateActionParams {
  /** Unique identifier for the new action */
  actionId: string;
  /** The node this action belongs to */
  node: NodeRef;
  /** Optional episode scope (provides authority) */
  episodeId?: string;
  /** What this action does */
  description: string;
}

/**
 * Parameters for completing an action (marking as Done).
 * Idempotent: completing an already-done action succeeds.
 */
export interface CompleteActionParams {
  /** The action to mark as complete */
  actionId: string;
}

/**
 * Parameters for creating a new model (belief).
 * Models capture learned knowledge from episodes.
 */
export interface CreateModelParams {
  /** Unique identifier for the new model */
  modelId: string;
  /** Model type: Descriptive, Procedural, or Normative */
  type: ModelType;
  /** The belief statement */
  statement: string;
  /** Confidence level 0.0 to 1.0 */
  confidence?: number;
  /** Where this belief applies: personal, org, or domain */
  scope?: ModelScope;
  /** Enforcement level for Normative models: none, warn, or block */
  enforcement?: EnforcementLevel;
}

/**
 * Parameters for updating an existing model.
 * Only provided fields are updated; others remain unchanged.
 */
export interface UpdateModelParams {
  /** The model to update */
  modelId: string;
  /** New statement (optional) */
  statement?: string;
  /** New confidence level (optional) */
  confidence?: number;
  /** New scope (optional) */
  scope?: ModelScope;
  /** New enforcement level (optional) */
  enforcement?: EnforcementLevel;
}

/**
 * A model update to apply when closing an episode.
 * Creates a new model or updates an existing one.
 */
export interface ModelUpdate {
  /** Model ID (new or existing) */
  id: string;
  /** Model type (required for new models) */
  type: ModelType;
  /** The belief statement */
  statement: string;
  /** Confidence level 0.0 to 1.0 */
  confidence?: number;
  /** Where this belief applies */
  scope?: ModelScope;
  /** Enforcement level for Normative models */
  enforcement?: EnforcementLevel;
}

/**
 * Parameters for creating a new note.
 * Notes are timestamped content with optional semantic tags.
 */
export interface CreateNoteParams {
  /** Unique identifier for the new note */
  noteId: string;
  /** The note content */
  content: string;
  /** ISO-8601 timestamp when note was created */
  createdAt: string;
  /** Semantic tags for workflow categorization */
  tags?: NoteTag[];
  /** Object IDs this note is linked to */
  linkedObjects?: string[];
}

/**
 * Parameters for adding a tag to an existing note.
 * Idempotent: adding an existing tag succeeds.
 */
export interface AddNoteTagParams {
  /** The note to tag */
  noteId: string;
  /** The tag to add */
  tag: NoteTag;
}

/**
 * Parameters for removing a tag from an existing note.
 * Idempotent: removing a non-existent tag succeeds.
 */
export interface RemoveNoteTagParams {
  /** The note to untag */
  noteId: string;
  /** The tag to remove */
  tag: NoteTag;
}

/**
 * Parameters for creating a link between two objects.
 * Links represent typed relationships with optional weights.
 */
export interface CreateLinkParams {
  /** Unique identifier for the new link */
  linkId: string;
  /** Source object ID */
  sourceId: string;
  /** Target object ID */
  targetId: string;
  /** Relationship type: supports, tests, blocks, etc. */
  relation: LinkRelation;
  /** Optional relationship strength 0.0 to 1.0 */
  weight?: number;
}

/**
 * Parameters for deleting a link.
 */
export interface DeleteLinkParams {
  /** The link to delete */
  linkId: string;
}

/**
 * Parameters for logging a Membrane exception.
 * Records when a user bypassed a Normative Model constraint.
 */
export interface LogExceptionParams {
  /** Unique identifier for the exception record */
  exceptionId: string;
  /** The Normative Model that was bypassed */
  modelId: string;
  /** What decision was overridden: warn or block */
  originalDecision: OverrideDecision;
  /** User-provided reason for proceeding */
  justification: string;
  /** What mutation was attempted: episode, action, or signal */
  mutationType: MutationType;
  /** ID of the resulting mutation */
  mutationId: string;
  /** ISO-8601 timestamp when exception was logged */
  createdAt: string;
}

/**
 * Status data for CLI display.
 * Discriminated union: baseline (quiet) vs active (shows details).
 */
export type StatusData =
  | { mode: "baseline"; node: NodeRef }
  | {
      mode: "active";
      node: NodeRef;
      variables: Variable[];
      episodes: Episode[];
      actions: Action[];
    };
