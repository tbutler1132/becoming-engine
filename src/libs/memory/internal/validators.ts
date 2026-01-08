/**
 * Composable Validators — Building blocks for state validation
 *
 * This module provides reusable validation functions that can be
 * composed to validate different schema versions. This reduces
 * duplication in validation.ts by ~80%.
 *
 * @module Memory/Internal/Validators
 */

import {
  ACTION_STATUSES,
  ENFORCEMENT_LEVELS,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  LINK_RELATIONS,
  MEASUREMENT_CADENCES,
  MODEL_SCOPES,
  MODEL_TYPES,
  MUTATION_TYPES,
  NODE_KINDS,
  NODE_TYPES,
  NOTE_TAGS,
  OVERRIDE_DECISIONS,
  PROXY_VALUE_TYPES,
  VARIABLE_STATUSES,
} from "../types.js";
import type { NodeKind, NodeRef, NodeType } from "../types.js";

// ═══════════════════════════════════════════════════════════════════════════
// PRIMITIVE VALIDATORS
// ═══════════════════════════════════════════════════════════════════════════

function isMember<T extends readonly string[]>(
  allowed: T,
  value: string,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function isNodeType(value: unknown): value is NodeType {
  return typeof value === "string" && isMember(NODE_TYPES, value);
}

function isNodeKind(value: unknown): value is NodeKind {
  return typeof value === "string" && isMember(NODE_KINDS, value);
}

export function isNodeRef(value: unknown): value is NodeRef {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!isNodeType(obj.type)) return false;
  return typeof obj.id === "string" && obj.id.length > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// ENTITY VALIDATORS — Each validates a single entity
// ═══════════════════════════════════════════════════════════════════════════

/** Options for variable validation */
export interface VariableValidationOptions {
  /** Node format: 'legacy' (just NodeType) or 'ref' (NodeRef with type+id) */
  nodeFormat: "legacy" | "ref";
  /** Whether to allow optional enrichment fields (description, preferredRange, measurementCadence) */
  allowEnrichments?: boolean;
}

/** Validates a single variable */
export function validateVariable(
  v: unknown,
  options: VariableValidationOptions,
): boolean {
  if (typeof v !== "object" || v === null) return false;
  const obj = v as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (
    typeof obj.status !== "string" ||
    !isMember(VARIABLE_STATUSES, obj.status)
  )
    return false;

  // Node validation depends on format
  if (options.nodeFormat === "legacy") {
    if (!isNodeType(obj.node)) return false;
  } else {
    if (!isNodeRef(obj.node)) return false;
  }

  // Optional enrichment fields (V10+)
  if (options.allowEnrichments) {
    if (obj.description !== undefined && typeof obj.description !== "string")
      return false;
    if (
      obj.preferredRange !== undefined &&
      typeof obj.preferredRange !== "string"
    )
      return false;
    if (
      obj.measurementCadence !== undefined &&
      !isMember(MEASUREMENT_CADENCES, obj.measurementCadence as string)
    )
      return false;
  }

  return true;
}

/** Options for episode validation */
export interface EpisodeValidationOptions {
  /** Node format: 'legacy' (just NodeType) or 'ref' (NodeRef with type+id) */
  nodeFormat: "legacy" | "ref";
  /** Whether timestamps (openedAt, closedAt) are required/allowed */
  timestamps: "none" | "required";
  /** Whether closureNoteId is allowed */
  allowClosureNoteId?: boolean;
  /** Whether timeboxDays is allowed */
  allowTimeboxDays?: boolean;
}

/** Validates a single episode */
export function validateEpisode(
  e: unknown,
  options: EpisodeValidationOptions,
): boolean {
  if (typeof e !== "object" || e === null) return false;
  const obj = e as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.objective !== "string") return false;
  if (typeof obj.type !== "string" || !isMember(EPISODE_TYPES, obj.type))
    return false;
  if (typeof obj.status !== "string" || !isMember(EPISODE_STATUSES, obj.status))
    return false;

  // variableId is optional
  if (obj.variableId !== undefined && typeof obj.variableId !== "string")
    return false;

  // Node validation depends on format
  if (options.nodeFormat === "legacy") {
    if (!isNodeType(obj.node)) return false;
  } else {
    if (!isNodeRef(obj.node)) return false;
  }

  // Timestamps
  if (options.timestamps === "required") {
    if (typeof obj.openedAt !== "string") return false;
    if (obj.closedAt !== undefined && typeof obj.closedAt !== "string")
      return false;
  }

  // closureNoteId
  if (options.allowClosureNoteId) {
    if (
      obj.closureNoteId !== undefined &&
      typeof obj.closureNoteId !== "string"
    )
      return false;
  }

  // timeboxDays
  if (options.allowTimeboxDays) {
    if (obj.timeboxDays !== undefined && typeof obj.timeboxDays !== "number")
      return false;
  }

  return true;
}

/** Options for action validation */
export interface ActionValidationOptions {
  /** Whether episodeId is required or optional */
  episodeIdRequired: boolean;
}

/** Validates a single action */
export function validateAction(
  a: unknown,
  options: ActionValidationOptions,
): boolean {
  if (typeof a !== "object" || a === null) return false;
  const obj = a as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.description !== "string") return false;
  if (typeof obj.status !== "string" || !isMember(ACTION_STATUSES, obj.status))
    return false;

  if (options.episodeIdRequired) {
    if (typeof obj.episodeId !== "string") return false;
  } else {
    if (obj.episodeId !== undefined && typeof obj.episodeId !== "string")
      return false;
  }

  return true;
}

/** Options for note validation */
export interface NoteValidationOptions {
  /** Whether createdAt and tags are required */
  requireMetadata: boolean;
  /** Whether linkedObjects is allowed */
  allowLinkedObjects?: boolean;
}

/** Validates a single note */
export function validateNote(
  n: unknown,
  options: NoteValidationOptions,
): boolean {
  if (typeof n !== "object" || n === null) return false;
  const obj = n as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.content !== "string") return false;

  if (options.requireMetadata) {
    if (typeof obj.createdAt !== "string") return false;
    if (!Array.isArray(obj.tags)) return false;
    for (const tag of obj.tags) {
      if (typeof tag !== "string" || !isMember(NOTE_TAGS, tag)) return false;
    }
  }

  if (options.allowLinkedObjects && obj.linkedObjects !== undefined) {
    if (!Array.isArray(obj.linkedObjects)) return false;
    for (const linked of obj.linkedObjects) {
      if (typeof linked !== "string") return false;
    }
  }

  return true;
}

/** Options for model validation */
export interface ModelValidationOptions {
  /** Whether exceptionsAllowed field is allowed */
  allowExceptionsAllowed?: boolean;
}

/** Validates a single model */
export function validateModel(
  m: unknown,
  options: ModelValidationOptions = {},
): boolean {
  if (typeof m !== "object" || m === null) return false;
  const obj = m as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.statement !== "string") return false;
  if (typeof obj.type !== "string" || !isMember(MODEL_TYPES, obj.type))
    return false;

  // Optional fields
  if (obj.confidence !== undefined) {
    if (
      typeof obj.confidence !== "number" ||
      obj.confidence < 0 ||
      obj.confidence > 1
    )
      return false;
  }
  if (
    obj.scope !== undefined &&
    (typeof obj.scope !== "string" || !isMember(MODEL_SCOPES, obj.scope))
  )
    return false;
  if (
    obj.enforcement !== undefined &&
    (typeof obj.enforcement !== "string" ||
      !isMember(ENFORCEMENT_LEVELS, obj.enforcement))
  )
    return false;
  if (options.allowExceptionsAllowed) {
    if (
      obj.exceptionsAllowed !== undefined &&
      typeof obj.exceptionsAllowed !== "boolean"
    )
      return false;
  }

  return true;
}

/** Validates a single link (requires object IDs set for referential integrity) */
export function validateLink(l: unknown, allObjectIds: Set<string>): boolean {
  if (typeof l !== "object" || l === null) return false;
  const obj = l as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.sourceId !== "string") return false;
  if (typeof obj.targetId !== "string") return false;
  if (
    typeof obj.relation !== "string" ||
    !isMember(LINK_RELATIONS, obj.relation)
  )
    return false;

  // Optional weight
  if (obj.weight !== undefined) {
    if (typeof obj.weight !== "number" || obj.weight < 0 || obj.weight > 1)
      return false;
  }

  // Referential integrity
  if (!allObjectIds.has(obj.sourceId) || !allObjectIds.has(obj.targetId))
    return false;

  return true;
}

/** Validates a single membrane exception (requires model IDs set for referential integrity) */
export function validateException(ex: unknown, modelIds: Set<string>): boolean {
  if (typeof ex !== "object" || ex === null) return false;
  const obj = ex as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.modelId !== "string") return false;
  if (
    typeof obj.originalDecision !== "string" ||
    !isMember(OVERRIDE_DECISIONS, obj.originalDecision)
  )
    return false;
  if (typeof obj.justification !== "string") return false;
  if (
    typeof obj.mutationType !== "string" ||
    !isMember(MUTATION_TYPES, obj.mutationType)
  )
    return false;
  if (typeof obj.mutationId !== "string") return false;
  if (typeof obj.createdAt !== "string") return false;

  // Referential integrity
  if (!modelIds.has(obj.modelId)) return false;

  return true;
}

/** Validates a single proxy (requires variable IDs set for referential integrity) */
export function validateProxy(p: unknown, variableIds: Set<string>): boolean {
  if (typeof p !== "object" || p === null) return false;
  const obj = p as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.variableId !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (
    typeof obj.valueType !== "string" ||
    !isMember(PROXY_VALUE_TYPES, obj.valueType)
  )
    return false;

  // Optional fields
  if (obj.description !== undefined && typeof obj.description !== "string")
    return false;
  if (obj.unit !== undefined && typeof obj.unit !== "string") return false;
  if (obj.categories !== undefined) {
    if (!Array.isArray(obj.categories)) return false;
    for (const cat of obj.categories) {
      if (typeof cat !== "string") return false;
    }
  }
  if (obj.thresholds !== undefined) {
    if (typeof obj.thresholds !== "object" || obj.thresholds === null)
      return false;
    const thresholds = obj.thresholds as Record<string, unknown>;
    if (
      thresholds.lowBelow !== undefined &&
      typeof thresholds.lowBelow !== "number"
    )
      return false;
    if (
      thresholds.highAbove !== undefined &&
      typeof thresholds.highAbove !== "number"
    )
      return false;
  }

  // Referential integrity
  if (!variableIds.has(obj.variableId)) return false;

  return true;
}

/** Validates a single node entity */
export function validateNode(n: unknown): boolean {
  if (typeof n !== "object" || n === null) return false;
  const obj = n as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.name !== "string") return false;
  if (!isNodeKind(obj.kind)) return false;
  if (typeof obj.createdAt !== "string") return false;

  // Optional fields
  if (obj.description !== undefined && typeof obj.description !== "string")
    return false;
  if (obj.tags !== undefined) {
    if (!Array.isArray(obj.tags)) return false;
    for (const tag of obj.tags) {
      if (typeof tag !== "string") return false;
    }
  }

  return true;
}

/** Validates a single proxy reading */
export function validateProxyReading(
  r: unknown,
  proxyIds: Set<string>,
): boolean {
  if (typeof r !== "object" || r === null) return false;
  const obj = r as Record<string, unknown>;

  if (typeof obj.id !== "string") return false;
  if (typeof obj.proxyId !== "string") return false;
  if (typeof obj.recordedAt !== "string") return false;

  // Value must be a discriminated union
  if (typeof obj.value !== "object" || obj.value === null) return false;
  const value = obj.value as Record<string, unknown>;
  if (typeof value.type !== "string") return false;
  if (value.type === "numeric") {
    if (typeof value.value !== "number") return false;
  } else if (value.type === "boolean") {
    if (typeof value.value !== "boolean") return false;
  } else if (value.type === "categorical") {
    if (typeof value.value !== "string") return false;
  } else {
    return false;
  }

  // Optional source
  if (obj.source !== undefined && typeof obj.source !== "string") return false;

  // Referential integrity
  if (!proxyIds.has(obj.proxyId)) return false;

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// COLLECTION VALIDATORS — Validate arrays with unique IDs
// ═══════════════════════════════════════════════════════════════════════════

/** Checks that all items in an array have unique id fields */
export function hasUniqueIds(items: readonly unknown[]): boolean {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item !== "object" || item === null) return false;
    const id = (item as Record<string, unknown>).id;
    if (typeof id !== "string") return false;
    if (ids.has(id)) return false;
    ids.add(id);
  }
  return true;
}

/** Collects all IDs from an array of objects with id field */
export function collectIds(items: readonly unknown[]): Set<string> {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item === "object" && item !== null) {
      const id = (item as Record<string, unknown>).id;
      if (typeof id === "string") ids.add(id);
    }
  }
  return ids;
}

/** Checks action → episode referential integrity */
export function actionsReferToEpisodes(
  actions: readonly unknown[],
  episodes: readonly unknown[],
  episodeIdRequired: boolean,
): boolean {
  const episodeIds = collectIds(episodes);

  for (const action of actions) {
    if (typeof action !== "object" || action === null) return false;
    const episodeId = (action as Record<string, unknown>).episodeId;

    if (episodeIdRequired) {
      if (typeof episodeId !== "string") return false;
      if (!episodeIds.has(episodeId)) return false;
    } else {
      if (episodeId !== undefined) {
        if (typeof episodeId !== "string") return false;
        if (!episodeIds.has(episodeId)) return false;
      }
    }
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE SCHEMA — Defines what each version requires
// ═══════════════════════════════════════════════════════════════════════════

/** Schema definition for a state version */
export interface StateSchema {
  /** Expected schemaVersion value (undefined for v0) */
  schemaVersion?: number;
  /** Variable validation options */
  variable: VariableValidationOptions;
  /** Episode validation options */
  episode: EpisodeValidationOptions;
  /** Action validation options */
  action: ActionValidationOptions;
  /** Note validation options */
  note: NoteValidationOptions;
  /** Model validation options (undefined if models array shouldn't exist) */
  model?: ModelValidationOptions;
  /** Whether links array should exist */
  hasLinks?: boolean;
  /** Whether exceptions array should exist */
  hasExceptions?: boolean;
  /** Whether proxies array should exist */
  hasProxies?: boolean;
  /** Whether proxyReadings array should exist */
  hasProxyReadings?: boolean;
  /** Whether nodes array should exist */
  hasNodes?: boolean;
}

/** Validates a state object against a schema */
export function validateStateAgainstSchema(
  data: unknown,
  schema: StateSchema,
): boolean {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;

  // Schema version check
  if (schema.schemaVersion !== undefined) {
    if (obj.schemaVersion !== schema.schemaVersion) return false;
  }

  // Required arrays
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  )
    return false;

  // Optional arrays
  if (schema.model !== undefined && !Array.isArray(obj.models)) return false;
  if (schema.hasLinks && !Array.isArray(obj.links)) return false;
  if (schema.hasExceptions && !Array.isArray(obj.exceptions)) return false;
  if (schema.hasProxies && !Array.isArray(obj.proxies)) return false;
  if (schema.hasProxyReadings && !Array.isArray(obj.proxyReadings))
    return false;
  if (schema.hasNodes && !Array.isArray(obj.nodes)) return false;

  // Unique IDs
  if (!hasUniqueIds(obj.variables)) return false;
  if (!hasUniqueIds(obj.episodes)) return false;
  if (!hasUniqueIds(obj.actions)) return false;
  if (!hasUniqueIds(obj.notes)) return false;
  if (schema.model !== undefined && !hasUniqueIds(obj.models as unknown[]))
    return false;
  if (schema.hasLinks && !hasUniqueIds(obj.links as unknown[])) return false;
  if (schema.hasExceptions && !hasUniqueIds(obj.exceptions as unknown[]))
    return false;
  if (schema.hasProxies && !hasUniqueIds(obj.proxies as unknown[]))
    return false;
  if (schema.hasProxyReadings && !hasUniqueIds(obj.proxyReadings as unknown[]))
    return false;
  if (schema.hasNodes && !hasUniqueIds(obj.nodes as unknown[])) return false;

  // Action → Episode referential integrity
  if (
    !actionsReferToEpisodes(
      obj.actions,
      obj.episodes,
      schema.action.episodeIdRequired,
    )
  )
    return false;

  // Validate each variable
  for (const v of obj.variables) {
    if (!validateVariable(v, schema.variable)) return false;
  }

  // Validate each episode
  for (const e of obj.episodes) {
    if (!validateEpisode(e, schema.episode)) return false;
  }

  // Validate each action
  for (const a of obj.actions) {
    if (!validateAction(a, schema.action)) return false;
  }

  // Validate each note
  for (const n of obj.notes) {
    if (!validateNote(n, schema.note)) return false;
  }

  // Validate models if present
  if (schema.model !== undefined) {
    for (const m of obj.models as unknown[]) {
      if (!validateModel(m, schema.model)) return false;
    }
  }

  // Build object IDs for link validation
  if (schema.hasLinks || schema.hasExceptions) {
    const allObjectIds = new Set<string>();
    for (const v of obj.variables)
      allObjectIds.add((v as Record<string, unknown>).id as string);
    for (const e of obj.episodes)
      allObjectIds.add((e as Record<string, unknown>).id as string);
    for (const a of obj.actions)
      allObjectIds.add((a as Record<string, unknown>).id as string);
    for (const n of obj.notes)
      allObjectIds.add((n as Record<string, unknown>).id as string);
    if (schema.model !== undefined) {
      for (const m of obj.models as unknown[])
        allObjectIds.add((m as Record<string, unknown>).id as string);
    }
    if (schema.hasLinks) {
      for (const l of obj.links as unknown[])
        allObjectIds.add((l as Record<string, unknown>).id as string);
    }
    if (schema.hasExceptions) {
      for (const ex of obj.exceptions as unknown[])
        allObjectIds.add((ex as Record<string, unknown>).id as string);
    }

    // Validate links
    if (schema.hasLinks) {
      for (const l of obj.links as unknown[]) {
        if (!validateLink(l, allObjectIds)) return false;
      }
    }

    // Validate exceptions
    if (schema.hasExceptions) {
      const modelIds = collectIds(obj.models as unknown[]);
      for (const ex of obj.exceptions as unknown[]) {
        if (!validateException(ex, modelIds)) return false;
      }
    }
  }

  // Validate proxies if present
  if (schema.hasProxies) {
    const variableIds = collectIds(obj.variables);
    for (const p of obj.proxies as unknown[]) {
      if (!validateProxy(p, variableIds)) return false;
    }
  }

  // Validate proxy readings if present
  if (schema.hasProxyReadings) {
    const proxyIds = schema.hasProxies
      ? collectIds(obj.proxies as unknown[])
      : new Set<string>();
    for (const r of obj.proxyReadings as unknown[]) {
      if (!validateProxyReading(r, proxyIds)) return false;
    }
  }

  // Validate nodes if present
  if (schema.hasNodes) {
    for (const n of obj.nodes as unknown[]) {
      if (!validateNode(n)) return false;
    }
  }

  return true;
}
