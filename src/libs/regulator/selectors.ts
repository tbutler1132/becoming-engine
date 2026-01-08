// Pure query functions for the Regulator organ
// These functions only read from state and do not perform transitions.

import {
  EPISODE_STATUSES,
  EPISODE_TYPES,
  ACTION_STATUSES,
} from "../memory/index.js";
import type {
  Action,
  Proxy,
  ProxyReading,
  State,
  Variable,
  Episode,
  NodeRef,
} from "../memory/index.js";
import type { StatusData } from "./types.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const EXPLORE_TYPE = EPISODE_TYPES[1];
const ACTION_PENDING_STATUS = ACTION_STATUSES[0];

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
 * Checks if a node is in baseline mode (no active episodes).
 */
export function isBaseline(state: State, node: NodeRef): boolean {
  return getActiveEpisodesByNode(state, node).length === 0;
}

/**
 * Gets pending actions scoped to active episodes for a node.
 * Only returns actions with status "Pending" that reference an active episode.
 */
export function getPendingActionsForActiveEpisodes(
  state: State,
  node: NodeRef,
): Action[] {
  const activeEpisodeIds = new Set(
    getActiveEpisodesByNode(state, node).map((e) => e.id),
  );
  return state.actions.filter(
    (a) =>
      a.status === ACTION_PENDING_STATUS &&
      a.episodeId !== undefined &&
      activeEpisodeIds.has(a.episodeId),
  );
}

/**
 * Gets status data for CLI display.
 * Returns baseline mode if no active episodes, otherwise returns active mode with details.
 */
export function getStatusData(state: State, node: NodeRef): StatusData {
  if (isBaseline(state, node)) {
    return { mode: "baseline", node };
  }
  return {
    mode: "active",
    node,
    variables: getVariablesByNode(state, node),
    episodes: getActiveEpisodesByNode(state, node),
    actions: getPendingActionsForActiveEpisodes(state, node),
  };
}

/**
 * Counts active Explore episodes for a node.
 */
export function countActiveExplores(state: State, node: NodeRef): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === EXPLORE_TYPE,
  ).length;
}

/**
 * Counts active Stabilize episodes for a specific variable on a node.
 */
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
 * Gets all proxies for a Variable.
 */
export function getProxiesForVariable(
  state: State,
  variableId: string,
): Proxy[] {
  return state.proxies.filter((p) => p.variableId === variableId);
}

/**
 * Gets recent readings for a proxy.
 * Returns readings sorted by recordedAt (newest first).
 */
export function getRecentReadings(
  state: State,
  proxyId: string,
  limit?: number,
): ProxyReading[] {
  const readings = state.proxyReadings
    .filter((r) => r.proxyId === proxyId)
    .sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );

  return limit !== undefined ? readings.slice(0, limit) : readings;
}
