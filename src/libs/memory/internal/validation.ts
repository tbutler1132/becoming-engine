/**
 * State Validation — Schema-based validation for all versions
 *
 * This module validates state objects against schema definitions.
 * Uses composable validators from validators.ts for DRY code.
 *
 * @module Memory/Internal/Validation
 */

import {
  ACTION_STATUSES,
  DEFAULT_ORG_NODE_ID,
  DEFAULT_PERSONAL_NODE_ID,
  ENFORCEMENT_LEVELS,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  LINK_RELATIONS,
  MEASUREMENT_CADENCES,
  MODEL_SCOPES,
  MODEL_TYPES,
  MUTATION_TYPES,
  NODE_TYPES,
  NOTE_TAGS,
  OVERRIDE_DECISIONS,
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
} from "../types.js";
import type {
  ActionStatus,
  EnforcementLevel,
  EpisodeStatus,
  EpisodeType,
  LinkRelation,
  MeasurementCadence,
  ModelScope,
  ModelType,
  MutationType,
  NodeRef,
  NodeType,
  NoteTag,
  OverrideDecision,
  SchemaVersion,
  State,
  VariableStatus,
} from "../types.js";
import { validateStateAgainstSchema, type StateSchema } from "./validators.js";

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY TYPE DEFINITIONS — Used by migrations.ts
// ═══════════════════════════════════════════════════════════════════════════

export type LegacyVariable = {
  id: string;
  node: NodeType;
  name: string;
  status: VariableStatus;
};

export type LegacyEpisode = {
  id: string;
  node: NodeType;
  type: EpisodeType;
  objective: string;
  status: EpisodeStatus;
};

export type LegacyAction = {
  id: string;
  description: string;
  status: ActionStatus;
  episodeId: string;
};

export type LegacyNote = {
  id: string;
  content: string;
};

export type LegacyStateV0 = {
  variables: LegacyVariable[];
  episodes: LegacyEpisode[];
  actions: LegacyAction[];
  notes: LegacyNote[];
};

export type LegacyStateV1 = LegacyStateV0 & {
  schemaVersion: 1;
};

export type StateV2 = Omit<State, "schemaVersion" | "models" | "links"> & {
  schemaVersion: 2;
};

export type EpisodeV3 = {
  id: string;
  node: NodeRef;
  type: EpisodeType;
  variableId?: string;
  objective: string;
  status: EpisodeStatus;
};

export type StateV3 = {
  schemaVersion: 3;
  variables: Array<{
    id: string;
    node: NodeRef;
    name: string;
    status: VariableStatus;
  }>;
  episodes: EpisodeV3[];
  actions: Array<{
    id: string;
    description: string;
    status: ActionStatus;
    episodeId?: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
  }>;
};

export type StateV4 = Omit<
  State,
  "schemaVersion" | "models" | "notes" | "links" | "exceptions"
> & {
  schemaVersion: 4;
  notes: Array<{
    id: string;
    content: string;
  }>;
};

export type NoteV5 = {
  id: string;
  content: string;
};

export type StateV5 = Omit<
  State,
  "schemaVersion" | "notes" | "links" | "exceptions"
> & {
  schemaVersion: 5;
  notes: NoteV5[];
};

export type StateV6 = Omit<State, "schemaVersion" | "links" | "exceptions"> & {
  schemaVersion: 6;
};

export type StateV7 = Omit<State, "schemaVersion" | "exceptions"> & {
  schemaVersion: 7;
};

export type EpisodeV8 = {
  id: string;
  node: NodeRef;
  type: EpisodeType;
  variableId?: string;
  objective: string;
  status: EpisodeStatus;
  openedAt: string;
  closedAt?: string;
  closureNoteId?: string;
};

export type StateV8 = Omit<State, "schemaVersion" | "episodes"> & {
  schemaVersion: 8;
  episodes: EpisodeV8[];
};

export type VariableV9 = {
  id: string;
  node: NodeRef;
  name: string;
  status: VariableStatus;
};

export type StateV9 = Omit<State, "schemaVersion" | "variables"> & {
  schemaVersion: 9;
  variables: VariableV9[];
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPE GUARDS — Exported for runtime validation
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

/** Validates that a value is a valid NodeRef (type + id) */
export function isNodeRef(value: unknown): value is NodeRef {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (!isNodeType(obj.type)) return false;
  return typeof obj.id === "string" && obj.id.length > 0;
}

/** Validates that a value is a valid VariableStatus */
export function isVariableStatus(value: unknown): value is VariableStatus {
  return typeof value === "string" && isMember(VARIABLE_STATUSES, value);
}

/** Validates that a value is a valid EpisodeType */
export function isEpisodeType(value: unknown): value is EpisodeType {
  return typeof value === "string" && isMember(EPISODE_TYPES, value);
}

/** Validates that a value is a valid EpisodeStatus */
export function isEpisodeStatus(value: unknown): value is EpisodeStatus {
  return typeof value === "string" && isMember(EPISODE_STATUSES, value);
}

/** Validates that a value is a valid ActionStatus */
export function isActionStatus(value: unknown): value is ActionStatus {
  return typeof value === "string" && isMember(ACTION_STATUSES, value);
}

/** Validates that a value is a valid ModelType */
export function isModelType(value: unknown): value is ModelType {
  return typeof value === "string" && isMember(MODEL_TYPES, value);
}

/** Validates that a value is a valid ModelScope */
export function isModelScope(value: unknown): value is ModelScope {
  return typeof value === "string" && isMember(MODEL_SCOPES, value);
}

/** Validates that a value is a valid EnforcementLevel */
export function isEnforcementLevel(value: unknown): value is EnforcementLevel {
  return typeof value === "string" && isMember(ENFORCEMENT_LEVELS, value);
}

/** Validates that a value is a valid NoteTag */
export function isNoteTag(value: unknown): value is NoteTag {
  return typeof value === "string" && isMember(NOTE_TAGS, value);
}

/** Validates that a value is a valid LinkRelation */
export function isLinkRelation(value: unknown): value is LinkRelation {
  return typeof value === "string" && isMember(LINK_RELATIONS, value);
}

/** Validates that a value is a valid MutationType */
export function isMutationType(value: unknown): value is MutationType {
  return typeof value === "string" && isMember(MUTATION_TYPES, value);
}

/** Validates that a value is a valid OverrideDecision */
export function isOverrideDecision(value: unknown): value is OverrideDecision {
  return typeof value === "string" && isMember(OVERRIDE_DECISIONS, value);
}

/** Validates that a value is a valid MeasurementCadence */
export function isMeasurementCadence(
  value: unknown,
): value is MeasurementCadence {
  return typeof value === "string" && isMember(MEASUREMENT_CADENCES, value);
}

/** Converts legacy NodeType to NodeRef */
export function nodeRefFromLegacy(node: NodeType): NodeRef {
  if (node === "Personal") {
    return { type: node, id: DEFAULT_PERSONAL_NODE_ID };
  }
  return { type: node, id: DEFAULT_ORG_NODE_ID };
}

// ═══════════════════════════════════════════════════════════════════════════
// SCHEMA DEFINITIONS — One per version
// ═══════════════════════════════════════════════════════════════════════════

const SCHEMA_V0_V1: StateSchema = {
  variable: { nodeFormat: "legacy" },
  episode: { nodeFormat: "legacy", timestamps: "none" },
  action: { episodeIdRequired: true },
  note: { requireMetadata: false },
};

const SCHEMA_V2: StateSchema = {
  schemaVersion: 2,
  variable: { nodeFormat: "ref" },
  episode: { nodeFormat: "ref", timestamps: "none" },
  action: { episodeIdRequired: true },
  note: { requireMetadata: false },
};

const SCHEMA_V3: StateSchema = {
  schemaVersion: 3,
  variable: { nodeFormat: "ref" },
  episode: { nodeFormat: "ref", timestamps: "none" },
  action: { episodeIdRequired: false },
  note: { requireMetadata: false },
};

const SCHEMA_V4: StateSchema = {
  schemaVersion: 4,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: false },
};

const SCHEMA_V5: StateSchema = {
  schemaVersion: 5,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: false },
  model: {},
};

const SCHEMA_V6: StateSchema = {
  schemaVersion: 6,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: true, allowLinkedObjects: true },
  model: {},
};

const SCHEMA_V7: StateSchema = {
  schemaVersion: 7,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: true, allowLinkedObjects: true },
  model: { allowExceptionsAllowed: true },
  hasLinks: true,
};

const SCHEMA_V8: StateSchema = {
  schemaVersion: 8,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: true, allowLinkedObjects: true },
  model: { allowExceptionsAllowed: true },
  hasLinks: true,
  hasExceptions: true,
};

const SCHEMA_V9: StateSchema = {
  schemaVersion: 9,
  variable: { nodeFormat: "ref" },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
    allowTimeboxDays: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: true, allowLinkedObjects: true },
  model: { allowExceptionsAllowed: true },
  hasLinks: true,
  hasExceptions: true,
};

const SCHEMA_V10: StateSchema = {
  schemaVersion: SCHEMA_VERSION,
  variable: { nodeFormat: "ref", allowEnrichments: true },
  episode: {
    nodeFormat: "ref",
    timestamps: "required",
    allowClosureNoteId: true,
    allowTimeboxDays: true,
  },
  action: { episodeIdRequired: false },
  note: { requireMetadata: true, allowLinkedObjects: true },
  model: { allowExceptionsAllowed: true },
  hasLinks: true,
  hasExceptions: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// STATE VALIDATORS — One per version, using schemas
// ═══════════════════════════════════════════════════════════════════════════

function isSchemaVersion(value: unknown): value is SchemaVersion {
  return value === SCHEMA_VERSION;
}

/**
 * Validates legacy V0 state (no schemaVersion field).
 */
export function isValidLegacyStateV0(data: unknown): data is LegacyStateV0 {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  // V0 has no schemaVersion
  if ("schemaVersion" in obj) return false;
  return validateStateAgainstSchema(data, SCHEMA_V0_V1);
}

/**
 * Validates legacy V1 state (schemaVersion: 1).
 */
export function isValidLegacyStateV1(data: unknown): data is LegacyStateV1 {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (obj.schemaVersion !== 1) return false;
  return validateStateAgainstSchema(data, SCHEMA_V0_V1);
}

/**
 * Validates V2 state (schemaVersion: 2).
 */
export function isValidLegacyStateV2(data: unknown): data is StateV2 {
  return validateStateAgainstSchema(data, SCHEMA_V2);
}

/**
 * Validates V3 state (schemaVersion: 3).
 */
export function isValidLegacyStateV3(data: unknown): data is StateV3 {
  return validateStateAgainstSchema(data, SCHEMA_V3);
}

/**
 * Validates V4 state (schemaVersion: 4).
 */
export function isValidLegacyStateV4(data: unknown): data is StateV4 {
  return validateStateAgainstSchema(data, SCHEMA_V4);
}

/**
 * Validates V5 state (schemaVersion: 5).
 */
export function isValidLegacyStateV5(data: unknown): data is StateV5 {
  return validateStateAgainstSchema(data, SCHEMA_V5);
}

/**
 * Validates V6 state (schemaVersion: 6).
 */
export function isValidLegacyStateV6(data: unknown): data is StateV6 {
  return validateStateAgainstSchema(data, SCHEMA_V6);
}

/**
 * Validates V7 state (schemaVersion: 7).
 */
export function isValidLegacyStateV7(data: unknown): data is StateV7 {
  return validateStateAgainstSchema(data, SCHEMA_V7);
}

/**
 * Validates V8 state (schemaVersion: 8).
 */
export function isValidLegacyStateV8(data: unknown): data is StateV8 {
  return validateStateAgainstSchema(data, SCHEMA_V8);
}

/**
 * Validates V9 state (schemaVersion: 9).
 */
export function isValidLegacyStateV9(data: unknown): data is StateV9 {
  return validateStateAgainstSchema(data, SCHEMA_V9);
}

/**
 * Validates current state (schemaVersion: 10).
 */
export function isValidState(data: unknown): data is State {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!isSchemaVersion(obj.schemaVersion)) return false;
  return validateStateAgainstSchema(data, SCHEMA_V10);
}
