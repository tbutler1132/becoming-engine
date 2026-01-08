/**
 * Referential Integrity Helpers
 *
 * Centralized utilities for checking object existence across state.
 * Used by logic functions to validate referential integrity before mutations.
 *
 * @module Regulator/Internal/Integrity
 */

import type { State } from "../../memory/index.js";
import type { Result } from "../types.js";

/**
 * Collects all object IDs from the state for referential integrity checks.
 * Includes: variables, episodes, actions, notes, models, links.
 */
export function collectAllObjectIds(state: State): Set<string> {
  const ids = new Set<string>();
  for (const v of state.variables) {
    ids.add(v.id);
  }
  for (const e of state.episodes) {
    ids.add(e.id);
  }
  for (const a of state.actions) {
    ids.add(a.id);
  }
  for (const n of state.notes) {
    ids.add(n.id);
  }
  for (const m of state.models) {
    ids.add(m.id);
  }
  for (const l of state.links) {
    ids.add(l.id);
  }
  return ids;
}

/**
 * Checks if an object ID exists in the state.
 *
 * **Intent:** Centralized referential integrity check for any object.
 *
 * **Contract:**
 * - Returns: Result<void> - ok if object exists, error otherwise
 * - Pure function: does not mutate state
 */
export function checkObjectExists(
  state: State,
  objectId: string,
  objectType: string = "Object",
): Result<void> {
  const allObjectIds = collectAllObjectIds(state);
  if (!allObjectIds.has(objectId)) {
    return {
      ok: false,
      error: `${objectType} '${objectId}' not found`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Checks if a variable exists in the state.
 */
export function checkVariableExists(
  state: State,
  variableId: string,
): Result<void> {
  const exists = state.variables.some((v) => v.id === variableId);
  if (!exists) {
    return {
      ok: false,
      error: `Variable with id '${variableId}' not found`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Checks if a model exists in the state.
 */
export function checkModelExists(state: State, modelId: string): Result<void> {
  const exists = state.models.some((m) => m.id === modelId);
  if (!exists) {
    return {
      ok: false,
      error: `Model with id '${modelId}' not found`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Checks if a proxy exists in the state.
 */
export function checkProxyExists(state: State, proxyId: string): Result<void> {
  const exists = state.proxies.some((p) => p.id === proxyId);
  if (!exists) {
    return {
      ok: false,
      error: `Proxy with id '${proxyId}' not found`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Checks for duplicate ID in a collection.
 */
export function checkNoDuplicateId<T extends { id: string }>(
  collection: T[],
  id: string,
  entityType: string,
): Result<void> {
  if (collection.some((item) => item.id === id)) {
    return {
      ok: false,
      error: `${entityType} with id '${id}' already exists`,
    };
  }
  return { ok: true, value: undefined };
}
