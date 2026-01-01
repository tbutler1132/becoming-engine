// Pure logic functions for the Regulator organ
// All functions are pure: (State, Input) => Result | NewState

import * as crypto from "node:crypto";
import type {
  State,
  Variable,
  Episode,
  NodeType,
  VariableStatus,
} from "../memory/index.js";
import type { Result, OpenEpisodeParams, VariableUpdate } from "./types.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";

/**
 * Filters variables by node type.
 */
export function getVariablesByNode(state: State, node: NodeType): Variable[] {
  return state.variables.filter((v) => v.node === node);
}

/**
 * Filters active episodes by node type.
 */
export function getActiveEpisodesByNode(
  state: State,
  node: NodeType
): Episode[] {
  return state.episodes.filter((e) => e.node === node && e.status === "Active");
}

/**
 * Counts active Explore episodes for a node.
 */
export function countActiveExplores(state: State, node: NodeType): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === "Explore"
  ).length;
}

/**
 * Validates whether a new Explore episode can be started for a node.
 * Enforces MAX_ACTIVE_EXPLORE_PER_NODE constraint.
 */
export function canStartExplore(
  state: State,
  node: NodeType
): Result<void> {
  const activeExplores = countActiveExplores(state, node);
  if (activeExplores >= MAX_ACTIVE_EXPLORE_PER_NODE) {
    return {
      ok: false,
      error: `Cannot start Explore: node '${node}' already has ${activeExplores} active Explore episode(s). Max allowed: ${MAX_ACTIVE_EXPLORE_PER_NODE}`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates whether an action can be created for a node.
 * Enforces "Silence" rule: No Action without Active Episode.
 */
export function canCreateAction(
  state: State,
  node: NodeType
): Result<void> {
  const activeEpisodes = getActiveEpisodesByNode(state, node);
  if (activeEpisodes.length === 0) {
    return {
      ok: false,
      error: `Cannot create Action: node '${node}' has no active episodes. Actions require an active episode.`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates episode creation parameters.
 */
export function validateEpisodeParams(
  params: OpenEpisodeParams
): Result<void> {
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
  params: OpenEpisodeParams
): Result<State> {
  // Validate params
  const paramsValidation = validateEpisodeParams(params);
  if (!paramsValidation.ok) {
    return paramsValidation;
  }

  // Check Explore constraint if applicable
  if (params.type === "Explore") {
    const exploreValidation = canStartExplore(state, params.node);
    if (!exploreValidation.ok) {
      return exploreValidation;
    }
  }

  // Create new episode
  const newEpisode: Episode = {
    id: crypto.randomUUID(),
    node: params.node,
    type: params.type,
    objective: params.objective,
    status: "Active",
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
  variableUpdates?: VariableUpdate[]
): Result<State> {
  // Find the episode
  const episode = state.episodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { ok: false, error: `Episode with id '${episodeId}' not found` };
  }

  if (episode.status === "Closed") {
    return { ok: false, error: `Episode '${episodeId}' is already closed` };
  }

  // Close the episode
  const updatedEpisodes = state.episodes.map((e) =>
    e.id === episodeId ? { ...e, status: "Closed" as const } : e
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

