/**
 * Validation Helpers — Semantic Constraint Checks
 *
 * Functions that validate business rules and semantic constraints
 * without modifying state. Used by logic functions to separate
 * validation from transformation.
 *
 * @module Regulator/Internal/Validation
 */

import {
  EPISODE_STATUSES,
  EPISODE_TYPES,
  formatNodeRef,
  nodeRefEquals,
  NOTE_TAGS,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  LINK_RELATIONS,
  MUTATION_TYPES,
  OVERRIDE_DECISIONS,
} from "../../memory/index.js";
import type { State, NodeRef, NoteTag } from "../../memory/index.js";
import type {
  Result,
  OpenEpisodeParams,
  ClosureNote,
  CreateModelParams,
  LogExceptionParams,
} from "../types.js";
import type { RegulatorPolicyForNode } from "../policy.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "../types.js";
import {
  countActiveExplores,
  countActiveStabilizesForVariable,
} from "../selectors.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const EXPLORE_TYPE = EPISODE_TYPES[1];

// ═══════════════════════════════════════════════════════════════════════════
// EPISODE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates episode creation parameters (fields only, no state checks).
 */
export function validateEpisodeParams(params: OpenEpisodeParams): Result<void> {
  if (params.type === STABILIZE_TYPE) {
    if (!params.variableId || params.variableId.trim().length === 0) {
      return { ok: false, error: "Stabilize episodes require variableId" };
    }
  }
  if (!params.objective || params.objective.trim().length === 0) {
    return { ok: false, error: "Episode objective cannot be empty" };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates whether a new Explore episode can be started for a node.
 * Enforces MAX_ACTIVE_EXPLORE_PER_NODE constraint.
 */
export function canStartExplore(
  state: State,
  node: NodeRef,
  policy?: RegulatorPolicyForNode,
): Result<void> {
  const activeExplores = countActiveExplores(state, node);
  const maxAllowed =
    policy?.maxActiveExplorePerNode ?? MAX_ACTIVE_EXPLORE_PER_NODE;
  if (activeExplores >= maxAllowed) {
    return {
      ok: false,
      error: `Cannot start Explore: node '${formatNodeRef(node)}' already has ${activeExplores} active Explore episode(s). Max allowed: ${maxAllowed}`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates whether a new Stabilize episode can be started for a variable.
 * Enforces max active Stabilize per variable constraint.
 */
export function canStartStabilize(
  state: State,
  node: NodeRef,
  variableId: string,
  policy?: RegulatorPolicyForNode,
): Result<void> {
  const activeStabilizes = countActiveStabilizesForVariable(
    state,
    node,
    variableId,
  );
  const maxAllowed = policy?.maxActiveStabilizePerVariable ?? 1;
  if (activeStabilizes >= maxAllowed) {
    return {
      ok: false,
      error: `Cannot start Stabilize: node '${formatNodeRef(node)}' already has ${activeStabilizes} active Stabilize episode(s) for variable '${variableId}'. Max allowed: ${maxAllowed}`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates closure note content.
 */
export function validateClosureNote(note: ClosureNote): Result<void> {
  if (!note.content || note.content.trim().length === 0) {
    return { ok: false, error: "Closure note content cannot be empty" };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates that an episode can be closed.
 */
export function validateEpisodeClosure(
  state: State,
  episodeId: string,
  modelUpdatesCount: number,
): Result<void> {
  const episode = state.episodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { ok: false, error: `Episode with id '${episodeId}' not found` };
  }

  if (episode.status === CLOSED_STATUS) {
    return { ok: false, error: `Episode '${episodeId}' is already closed` };
  }

  // Explore episodes must produce learning (at least one Model update)
  if (episode.type === EXPLORE_TYPE && modelUpdatesCount === 0) {
    return {
      ok: false,
      error:
        "Explore episodes must produce at least one Model update on closure",
    };
  }

  return { ok: true, value: undefined };
}

/**
 * Validates that an episode can be updated.
 */
export function validateEpisodeUpdate(
  state: State,
  episodeId: string,
  objective?: string,
  timeboxDays?: number | null,
): Result<void> {
  const episode = state.episodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { ok: false, error: `Episode with id '${episodeId}' not found` };
  }

  if (episode.status !== ACTIVE_STATUS) {
    return {
      ok: false,
      error: `Episode '${episodeId}' cannot be edited: only Active episodes can be modified`,
    };
  }

  if (
    objective !== undefined &&
    (!objective || objective.trim().length === 0)
  ) {
    return { ok: false, error: "Episode objective cannot be empty" };
  }

  if (timeboxDays !== undefined && timeboxDays !== null && timeboxDays <= 0) {
    return {
      ok: false,
      error: "Episode timeboxDays must be positive if provided",
    };
  }

  return { ok: true, value: undefined };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates whether an action can be created for a node.
 * Actions may exist without an Episode. If an Episode is referenced, it must be valid and active.
 */
export function validateActionCreation(
  state: State,
  node: NodeRef,
  episodeId?: string,
  description?: string,
): Result<void> {
  if (episodeId) {
    const episode = state.episodes.find((e) => e.id === episodeId);
    if (!episode) {
      return { ok: false, error: `Episode '${episodeId}' not found` };
    }

    if (!nodeRefEquals(episode.node, node)) {
      return {
        ok: false,
        error: `Episode '${episodeId}' does not belong to node ${formatNodeRef(node)}`,
      };
    }

    if (episode.status !== ACTIVE_STATUS) {
      return { ok: false, error: `Episode '${episodeId}' is not active` };
    }
  }

  if (!description || description.trim().length === 0) {
    return { ok: false, error: "Action description cannot be empty" };
  }

  return { ok: true, value: undefined };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates model creation parameters.
 */
export function validateModelParams(params: CreateModelParams): Result<void> {
  if (!params.statement || params.statement.trim().length === 0) {
    return { ok: false, error: "Model statement cannot be empty" };
  }
  if (!(MODEL_TYPES as readonly string[]).includes(params.type)) {
    return { ok: false, error: `Invalid model type: ${params.type}` };
  }
  if (params.confidence !== undefined) {
    if (params.confidence < 0 || params.confidence > 1) {
      return {
        ok: false,
        error: "Model confidence must be between 0.0 and 1.0",
      };
    }
  }
  if (
    params.scope !== undefined &&
    !(MODEL_SCOPES as readonly string[]).includes(params.scope)
  ) {
    return { ok: false, error: `Invalid model scope: ${params.scope}` };
  }
  if (
    params.enforcement !== undefined &&
    !(ENFORCEMENT_LEVELS as readonly string[]).includes(params.enforcement)
  ) {
    return {
      ok: false,
      error: `Invalid enforcement level: ${params.enforcement}`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates model update parameters.
 */
export function validateModelUpdate(
  statement?: string,
  confidence?: number,
  scope?: string,
  enforcement?: string,
): Result<void> {
  if (statement !== undefined && statement.trim().length === 0) {
    return { ok: false, error: "Model statement cannot be empty" };
  }
  if (confidence !== undefined && (confidence < 0 || confidence > 1)) {
    return { ok: false, error: "Model confidence must be between 0.0 and 1.0" };
  }
  if (
    scope !== undefined &&
    !(MODEL_SCOPES as readonly string[]).includes(scope)
  ) {
    return { ok: false, error: `Invalid model scope: ${scope}` };
  }
  if (
    enforcement !== undefined &&
    !(ENFORCEMENT_LEVELS as readonly string[]).includes(enforcement)
  ) {
    return { ok: false, error: `Invalid enforcement level: ${enforcement}` };
  }
  return { ok: true, value: undefined };
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTE VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates note content.
 */
export function validateNoteContent(content: string): Result<void> {
  if (!content || content.trim().length === 0) {
    return { ok: false, error: "Note content cannot be empty" };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates a note tag.
 */
export function validateNoteTag(tag: string): Result<void> {
  if (!(NOTE_TAGS as readonly string[]).includes(tag)) {
    return { ok: false, error: `Invalid note tag: ${tag}` };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates an array of note tags.
 */
export function validateNoteTags(tags: NoteTag[]): Result<void> {
  for (const tag of tags) {
    const result = validateNoteTag(tag);
    if (!result.ok) return result;
  }
  return { ok: true, value: undefined };
}

// ═══════════════════════════════════════════════════════════════════════════
// LINK VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates link relation type.
 */
export function validateLinkRelation(relation: string): Result<void> {
  if (!(LINK_RELATIONS as readonly string[]).includes(relation)) {
    return { ok: false, error: `Invalid link relation: ${relation}` };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates link weight.
 */
export function validateLinkWeight(weight?: number): Result<void> {
  if (weight !== undefined && (weight < 0 || weight > 1)) {
    return { ok: false, error: "Link weight must be between 0.0 and 1.0" };
  }
  return { ok: true, value: undefined };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEPTION VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validates exception logging parameters.
 */
export function validateExceptionParams(
  params: LogExceptionParams,
): Result<void> {
  if (!MUTATION_TYPES.includes(params.mutationType)) {
    return {
      ok: false,
      error: `Invalid mutationType: '${params.mutationType}'`,
    };
  }

  if (!OVERRIDE_DECISIONS.includes(params.originalDecision)) {
    return {
      ok: false,
      error: `Invalid originalDecision: '${params.originalDecision}'`,
    };
  }

  if (params.justification.trim() === "") {
    return { ok: false, error: "Justification cannot be empty" };
  }

  return { ok: true, value: undefined };
}
