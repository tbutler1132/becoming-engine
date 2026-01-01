// Pure logic functions for the Regulator organ
// All functions are pure: (State, Input) => Result | NewState

import * as crypto from "node:crypto";
import {
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
} from "../memory/index.js";
import type {
  Action,
  State,
  Variable,
  Episode,
  NodeRef,
  VariableStatus,
} from "../memory/index.js";
import type {
  CreateActionParams,
  Result,
  OpenEpisodeParams,
  SignalParams,
  VariableUpdate,
} from "./types.js";
import type { RegulatorPolicyForNode } from "./policy.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const EXPLORE_TYPE = EPISODE_TYPES[1];
const ACTION_PENDING_STATUS = ACTION_STATUSES[0];

type CanCreateActionParams = Pick<CreateActionParams, "node" | "episodeId">;

function nodeRefEquals(a: NodeRef, b: NodeRef): boolean {
  return a.type === b.type && a.id === b.id;
}

function formatNodeRef(node: NodeRef): string {
  return `${node.type}:${node.id}`;
}

/**
 * Filters variables by node type.
 */
export function getVariablesByNode(state: State, node: NodeRef): Variable[] {
  return state.variables.filter(
    (v) => v.node.type === node.type && v.node.id === node.id,
  );
}

/**
 * Filters active episodes by node type.
 */
export function getActiveEpisodesByNode(
  state: State,
  node: NodeRef,
): Episode[] {
  return state.episodes.filter(
    (e) =>
      e.node.type === node.type &&
      e.node.id === node.id &&
      e.status === ACTIVE_STATUS,
  );
}

/**
 * Counts active Explore episodes for a node.
 */
export function countActiveExplores(state: State, node: NodeRef): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === EXPLORE_TYPE,
  ).length;
}

export function countActiveStabilizesForVariable(
  state: State,
  node: NodeRef,
  variableId: string,
): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === STABILIZE_TYPE && e.variableId === variableId,
  ).length;
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
 * Validates whether an action can be created for a node.
 * Actions may exist without an Episode. If an Episode is referenced, it must be valid and active.
 */
export function canCreateAction(
  state: State,
  params: CanCreateActionParams,
): Result<void> {
  if (!params.episodeId) {
    return { ok: true, value: undefined };
  }

  const episode = state.episodes.find((e) => e.id === params.episodeId);
  if (!episode) {
    return { ok: false, error: `Episode '${params.episodeId}' not found` };
  }

  if (!nodeRefEquals(episode.node, params.node)) {
    return {
      ok: false,
      error: `Episode '${params.episodeId}' does not belong to node ${formatNodeRef(params.node)}`,
    };
  }

  if (episode.status !== ACTIVE_STATUS) {
    return { ok: false, error: `Episode '${params.episodeId}' is not active` };
  }

  return { ok: true, value: undefined };
}

/**
 * Applies a signal to update a variable's status.
 * Returns a new State if successful.
 */
export function applySignal(state: State, params: SignalParams): Result<State> {
  const variable = state.variables.find((v) => v.id === params.variableId);
  if (!variable) {
    return { ok: false, error: `Variable '${params.variableId}' not found` };
  }
  if (!nodeRefEquals(variable.node, params.node)) {
    return {
      ok: false,
      error: `Variable '${params.variableId}' does not belong to node ${params.node.type}:${params.node.id}`,
    };
  }

  const updatedVariables = state.variables.map((v) =>
    v.id === params.variableId ? { ...v, status: params.status } : v,
  );

  return {
    ok: true,
    value: {
      ...state,
      variables: updatedVariables,
    },
  };
}

/**
 * Creates a new Action. Actions may be episode-less; when an Episode is referenced it must exist and be Active.
 * Returns a new State if successful.
 */
export function createAction(
  state: State,
  params: CreateActionParams,
): Result<State> {
  const canActResult = canCreateAction(state, {
    node: params.node,
    ...(params.episodeId ? { episodeId: params.episodeId } : {}),
  });
  if (!canActResult.ok) {
    return canActResult;
  }

  if (!params.description || params.description.trim().length === 0) {
    return { ok: false, error: "Action description cannot be empty" };
  }

  const action: Action = {
    id: crypto.randomUUID(),
    description: params.description,
    status: ACTION_PENDING_STATUS,
    ...(params.episodeId ? { episodeId: params.episodeId } : {}),
  };

  return {
    ok: true,
    value: {
      ...state,
      actions: [...state.actions, action],
    },
  };
}

/**
 * Validates episode creation parameters.
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
 * Opens a new episode.
 * Returns a new State with the episode added.
 * Pure function: does not mutate input state.
 */
export function openEpisode(
  state: State,
  params: OpenEpisodeParams,
  policy?: RegulatorPolicyForNode,
): Result<State> {
  // Validate params
  const paramsValidation = validateEpisodeParams(params);
  if (!paramsValidation.ok) {
    return paramsValidation;
  }

  // Check Explore constraint if applicable
  if (params.type === EXPLORE_TYPE) {
    const exploreValidation = canStartExplore(state, params.node, policy);
    if (!exploreValidation.ok) {
      return exploreValidation;
    }
  }

  // Check Stabilize per-variable constraint if applicable
  if (params.type === STABILIZE_TYPE) {
    const variableId = params.variableId;
    const activeStabilizes = countActiveStabilizesForVariable(
      state,
      params.node,
      variableId,
    );
    const maxAllowed = policy?.maxActiveStabilizePerVariable ?? 1;
    if (activeStabilizes >= maxAllowed) {
      return {
        ok: false,
        error: `Cannot start Stabilize: node '${formatNodeRef(params.node)}' already has ${activeStabilizes} active Stabilize episode(s) for variable '${variableId}'. Max allowed: ${maxAllowed}`,
      };
    }
  }

  // Create new episode
  const newEpisode: Episode = {
    id: crypto.randomUUID(),
    node: params.node,
    type: params.type,
    ...(params.type === STABILIZE_TYPE
      ? { variableId: params.variableId }
      : {}),
    objective: params.objective,
    status: ACTIVE_STATUS,
  };

  // Return new state with episode added
  return {
    ok: true,
    value: {
      ...state,
      episodes: [...state.episodes, newEpisode],
    },
  };
}

/**
 * Closes an episode and optionally updates variables.
 * Returns a new State with the episode closed and variables updated.
 * Pure function: does not mutate input state.
 */
export function closeEpisode(
  state: State,
  episodeId: string,
  variableUpdates?: VariableUpdate[],
): Result<State> {
  // Find the episode
  const episode = state.episodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { ok: false, error: `Episode with id '${episodeId}' not found` };
  }

  if (episode.status === CLOSED_STATUS) {
    return { ok: false, error: `Episode '${episodeId}' is already closed` };
  }

  // Close the episode
  const updatedEpisodes = state.episodes.map((e) =>
    e.id === episodeId ? { ...e, status: CLOSED_STATUS } : e,
  );

  // Update variables if provided
  let updatedVariables = state.variables;
  if (variableUpdates && variableUpdates.length > 0) {
    updatedVariables = state.variables.map((v) => {
      const update = variableUpdates.find((u) => u.id === v.id);
      return update ? { ...v, status: update.status as VariableStatus } : v;
    });
  }

  return {
    ok: true,
    value: {
      ...state,
      episodes: updatedEpisodes,
      variables: updatedVariables,
    },
  };
}
