import {
  ACTION_STATUSES,
  DEFAULT_ORG_NODE_ID,
  DEFAULT_PERSONAL_NODE_ID,
  ENFORCEMENT_LEVELS,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  LINK_RELATIONS,
  MODEL_SCOPES,
  MODEL_TYPES,
  NODE_TYPES,
  NOTE_TAGS,
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
} from "../types.js";
import type {
  ActionStatus,
  EnforcementLevel,
  EpisodeStatus,
  EpisodeType,
  LinkRelation,
  ModelScope,
  ModelType,
  NodeRef,
  NodeType,
  NoteTag,
  SchemaVersion,
  State,
  VariableStatus,
} from "../types.js";

const LEGACY_SCHEMA_VERSION_V1 = 1 as const;
const LEGACY_SCHEMA_VERSION_V2 = 2 as const;
const LEGACY_SCHEMA_VERSION_V3 = 3 as const;
const LEGACY_SCHEMA_VERSION_V4 = 4 as const;
const LEGACY_SCHEMA_VERSION_V5 = 5 as const;
const LEGACY_SCHEMA_VERSION_V6 = 6 as const;

export type StateV2 = Omit<State, "schemaVersion" | "models" | "links"> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V2;
};

/** V4 State without models array */
export type StateV4 = Omit<
  State,
  "schemaVersion" | "models" | "notes" | "links"
> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V4;
  notes: Array<{
    id: string;
    content: string;
  }>;
};

/** V5 Note without createdAt/tags fields */
export type NoteV5 = {
  id: string;
  content: string;
};

/** V5 State with old Note structure (before createdAt/tags) */
export type StateV5 = Omit<State, "schemaVersion" | "notes" | "links"> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V5;
  notes: NoteV5[];
};

/** V6 State without links array */
export type StateV6 = Omit<State, "schemaVersion" | "links"> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V6;
};

/** V3 Episode without timestamp fields */
export type EpisodeV3 = {
  id: string;
  node: NodeRef;
  type: EpisodeType;
  variableId?: string;
  objective: string;
  status: EpisodeStatus;
};

export type StateV3 = {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V3;
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
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V1;
};

function isSchemaVersion(value: unknown): value is SchemaVersion {
  return value === SCHEMA_VERSION;
}

function isLegacySchemaVersionV1(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V1 {
  return value === LEGACY_SCHEMA_VERSION_V1;
}

function isLegacySchemaVersionV2(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V2 {
  return value === LEGACY_SCHEMA_VERSION_V2;
}

function isLegacySchemaVersionV3(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V3 {
  return value === LEGACY_SCHEMA_VERSION_V3;
}

function isMember<T extends readonly string[]>(
  allowed: T,
  value: string,
): value is T[number] {
  return (allowed as readonly string[]).includes(value);
}

function isNodeType(value: unknown): value is NodeType {
  return typeof value === "string" && isMember(NODE_TYPES, value);
}

export function nodeRefFromLegacy(node: NodeType): NodeRef {
  if (node === "Personal") {
    return { type: node, id: DEFAULT_PERSONAL_NODE_ID };
  }
  return { type: node, id: DEFAULT_ORG_NODE_ID };
}

function isNodeRef(value: unknown): value is NodeRef {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const obj = value as Record<string, unknown>;
  if (!isNodeType(obj.type)) {
    return false;
  }
  return typeof obj.id === "string" && obj.id.length > 0;
}

function isVariableStatus(value: unknown): value is VariableStatus {
  return typeof value === "string" && isMember(VARIABLE_STATUSES, value);
}

function isEpisodeType(value: unknown): value is EpisodeType {
  return typeof value === "string" && isMember(EPISODE_TYPES, value);
}

function isEpisodeStatus(value: unknown): value is EpisodeStatus {
  return typeof value === "string" && isMember(EPISODE_STATUSES, value);
}

function isActionStatus(value: unknown): value is ActionStatus {
  return typeof value === "string" && isMember(ACTION_STATUSES, value);
}

function isModelType(value: unknown): value is ModelType {
  return typeof value === "string" && isMember(MODEL_TYPES, value);
}

function isModelScope(value: unknown): value is ModelScope {
  return typeof value === "string" && isMember(MODEL_SCOPES, value);
}

function isEnforcementLevel(value: unknown): value is EnforcementLevel {
  return typeof value === "string" && isMember(ENFORCEMENT_LEVELS, value);
}

function isNoteTag(value: unknown): value is NoteTag {
  return typeof value === "string" && isMember(NOTE_TAGS, value);
}

function isLinkRelation(value: unknown): value is LinkRelation {
  return typeof value === "string" && isMember(LINK_RELATIONS, value);
}

function isLegacySchemaVersionV4(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V4 {
  return value === LEGACY_SCHEMA_VERSION_V4;
}

function isLegacySchemaVersionV5(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V5 {
  return value === LEGACY_SCHEMA_VERSION_V5;
}

function isLegacySchemaVersionV6(
  value: unknown,
): value is typeof LEGACY_SCHEMA_VERSION_V6 {
  return value === LEGACY_SCHEMA_VERSION_V6;
}

function hasUniqueIds(items: readonly unknown[]): boolean {
  const ids = new Set<string>();
  for (const item of items) {
    if (typeof item !== "object" || item === null) {
      return false;
    }
    const id = (item as Record<string, unknown>).id;
    if (typeof id !== "string") {
      return false;
    }
    if (ids.has(id)) {
      return false;
    }
    ids.add(id);
  }
  return true;
}

function actionsReferToEpisodes(
  actions: readonly unknown[],
  episodes: readonly unknown[],
): boolean {
  const episodeIds = new Set<string>();
  for (const episode of episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const id = (episode as Record<string, unknown>).id;
    if (typeof id !== "string") {
      return false;
    }
    episodeIds.add(id);
  }

  for (const action of actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const episodeId = (action as Record<string, unknown>).episodeId;
    if (typeof episodeId !== "string") {
      return false;
    }
    if (!episodeIds.has(episodeId)) {
      return false;
    }
  }

  return true;
}

function actionsWithEpisodeIdsReferToEpisodes(
  actions: readonly unknown[],
  episodes: readonly unknown[],
): boolean {
  const episodeIds = new Set<string>();
  for (const episode of episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const id = (episode as Record<string, unknown>).id;
    if (typeof id !== "string") {
      return false;
    }
    episodeIds.add(id);
  }

  for (const action of actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const episodeId = (action as Record<string, unknown>).episodeId;
    if (episodeId === undefined) {
      continue;
    }
    if (typeof episodeId !== "string") {
      return false;
    }
    if (!episodeIds.has(episodeId)) {
      return false;
    }
  }

  return true;
}

export function isValidLegacyStateV0(data: unknown): data is LegacyStateV0 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;

  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeType((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (
      typeof episode !== "object" ||
      episode === null ||
      typeof (episode as Record<string, unknown>).id !== "string" ||
      !isNodeType((episode as Record<string, unknown>).node) ||
      !isEpisodeType((episode as Record<string, unknown>).type) ||
      typeof (episode as Record<string, unknown>).objective !== "string" ||
      !isEpisodeStatus((episode as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (
      typeof action !== "object" ||
      action === null ||
      typeof (action as Record<string, unknown>).id !== "string" ||
      typeof (action as Record<string, unknown>).description !== "string" ||
      !isActionStatus((action as Record<string, unknown>).status) ||
      typeof (action as Record<string, unknown>).episodeId !== "string"
    ) {
      return false;
    }
  }

  for (const note of obj.notes) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof (note as Record<string, unknown>).id !== "string" ||
      typeof (note as Record<string, unknown>).content !== "string"
    ) {
      return false;
    }
  }

  return true;
}

export function isValidLegacyStateV1(data: unknown): data is LegacyStateV1 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV1(obj.schemaVersion)) {
    return false;
  }
  return isValidLegacyStateV0(data);
}

export function isValidLegacyStateV2(data: unknown): data is StateV2 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV2(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (
      typeof episode !== "object" ||
      episode === null ||
      typeof (episode as Record<string, unknown>).id !== "string" ||
      !isNodeRef((episode as Record<string, unknown>).node) ||
      !isEpisodeType((episode as Record<string, unknown>).type) ||
      typeof (episode as Record<string, unknown>).objective !== "string" ||
      !isEpisodeStatus((episode as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (
      typeof action !== "object" ||
      action === null ||
      typeof (action as Record<string, unknown>).id !== "string" ||
      typeof (action as Record<string, unknown>).description !== "string" ||
      !isActionStatus((action as Record<string, unknown>).status) ||
      typeof (action as Record<string, unknown>).episodeId !== "string"
    ) {
      return false;
    }
  }

  for (const note of obj.notes) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof (note as Record<string, unknown>).id !== "string" ||
      typeof (note as Record<string, unknown>).content !== "string"
    ) {
      return false;
    }
  }

  return true;
}

export function isValidLegacyStateV3(data: unknown): data is StateV3 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV3(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const e = episode as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      !isNodeRef(e.node) ||
      !isEpisodeType(e.type) ||
      typeof e.objective !== "string" ||
      !isEpisodeStatus(e.status)
    ) {
      return false;
    }
    if (e.variableId !== undefined && typeof e.variableId !== "string") {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const a = action as Record<string, unknown>;
    if (
      typeof a.id !== "string" ||
      typeof a.description !== "string" ||
      !isActionStatus(a.status)
    ) {
      return false;
    }
    if (a.episodeId !== undefined && typeof a.episodeId !== "string") {
      return false;
    }
  }

  for (const note of obj.notes) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof (note as Record<string, unknown>).id !== "string" ||
      typeof (note as Record<string, unknown>).content !== "string"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a V4 state (schema version 4, without models array).
 * Used for migration from V4 to V5.
 */
export function isValidLegacyStateV4(data: unknown): data is StateV4 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV4(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const e = episode as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      !isNodeRef(e.node) ||
      !isEpisodeType(e.type) ||
      typeof e.objective !== "string" ||
      !isEpisodeStatus(e.status)
    ) {
      return false;
    }
    if (e.variableId !== undefined && typeof e.variableId !== "string") {
      return false;
    }
    if (typeof e.openedAt !== "string") {
      return false;
    }
    if (e.closedAt !== undefined && typeof e.closedAt !== "string") {
      return false;
    }
    if (e.closureNoteId !== undefined && typeof e.closureNoteId !== "string") {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const a = action as Record<string, unknown>;
    if (
      typeof a.id !== "string" ||
      typeof a.description !== "string" ||
      !isActionStatus(a.status)
    ) {
      return false;
    }
    if (a.episodeId !== undefined && typeof a.episodeId !== "string") {
      return false;
    }
  }

  for (const note of obj.notes) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof (note as Record<string, unknown>).id !== "string" ||
      typeof (note as Record<string, unknown>).content !== "string"
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a V5 state (schema version 5, notes without createdAt/tags).
 * Used for migration from V5 to V6.
 */
export function isValidLegacyStateV5(data: unknown): data is StateV5 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV5(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes) ||
    !Array.isArray(obj.models)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !hasUniqueIds(obj.models) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const e = episode as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      !isNodeRef(e.node) ||
      !isEpisodeType(e.type) ||
      typeof e.objective !== "string" ||
      !isEpisodeStatus(e.status)
    ) {
      return false;
    }
    if (e.variableId !== undefined && typeof e.variableId !== "string") {
      return false;
    }
    if (typeof e.openedAt !== "string") {
      return false;
    }
    if (e.closedAt !== undefined && typeof e.closedAt !== "string") {
      return false;
    }
    if (e.closureNoteId !== undefined && typeof e.closureNoteId !== "string") {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const a = action as Record<string, unknown>;
    if (
      typeof a.id !== "string" ||
      typeof a.description !== "string" ||
      !isActionStatus(a.status)
    ) {
      return false;
    }
    if (a.episodeId !== undefined && typeof a.episodeId !== "string") {
      return false;
    }
  }

  // V5 notes only have id and content (no createdAt/tags)
  for (const note of obj.notes) {
    if (
      typeof note !== "object" ||
      note === null ||
      typeof (note as Record<string, unknown>).id !== "string" ||
      typeof (note as Record<string, unknown>).content !== "string"
    ) {
      return false;
    }
  }

  // Validate models
  for (const model of obj.models) {
    if (typeof model !== "object" || model === null) {
      return false;
    }
    const m = model as Record<string, unknown>;
    if (
      typeof m.id !== "string" ||
      !isModelType(m.type) ||
      typeof m.statement !== "string"
    ) {
      return false;
    }
    if (m.confidence !== undefined) {
      if (
        typeof m.confidence !== "number" ||
        m.confidence < 0 ||
        m.confidence > 1
      ) {
        return false;
      }
    }
    if (m.scope !== undefined && !isModelScope(m.scope)) {
      return false;
    }
    if (m.enforcement !== undefined && !isEnforcementLevel(m.enforcement)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates a V6 state (schema version 6, without links array).
 * Used for migration from V6 to V7.
 */
export function isValidLegacyStateV6(data: unknown): data is StateV6 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV6(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes) ||
    !Array.isArray(obj.models)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !hasUniqueIds(obj.models) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const e = episode as Record<string, unknown>;
    if (
      typeof e.id !== "string" ||
      !isNodeRef(e.node) ||
      !isEpisodeType(e.type) ||
      typeof e.objective !== "string" ||
      !isEpisodeStatus(e.status)
    ) {
      return false;
    }
    if (e.variableId !== undefined && typeof e.variableId !== "string") {
      return false;
    }
    if (typeof e.openedAt !== "string") {
      return false;
    }
    if (e.closedAt !== undefined && typeof e.closedAt !== "string") {
      return false;
    }
    if (e.closureNoteId !== undefined && typeof e.closureNoteId !== "string") {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const a = action as Record<string, unknown>;
    if (
      typeof a.id !== "string" ||
      typeof a.description !== "string" ||
      !isActionStatus(a.status)
    ) {
      return false;
    }
    if (a.episodeId !== undefined && typeof a.episodeId !== "string") {
      return false;
    }
  }

  // V6 notes have createdAt and tags
  for (const note of obj.notes) {
    if (typeof note !== "object" || note === null) {
      return false;
    }
    const n = note as Record<string, unknown>;
    if (
      typeof n.id !== "string" ||
      typeof n.content !== "string" ||
      typeof n.createdAt !== "string" ||
      !Array.isArray(n.tags)
    ) {
      return false;
    }
    for (const tag of n.tags) {
      if (!isNoteTag(tag)) {
        return false;
      }
    }
    if (n.linkedObjects !== undefined) {
      if (!Array.isArray(n.linkedObjects)) {
        return false;
      }
      for (const linked of n.linkedObjects) {
        if (typeof linked !== "string") {
          return false;
        }
      }
    }
  }

  // Validate models
  for (const model of obj.models) {
    if (typeof model !== "object" || model === null) {
      return false;
    }
    const m = model as Record<string, unknown>;
    if (
      typeof m.id !== "string" ||
      !isModelType(m.type) ||
      typeof m.statement !== "string"
    ) {
      return false;
    }
    if (m.confidence !== undefined) {
      if (
        typeof m.confidence !== "number" ||
        m.confidence < 0 ||
        m.confidence > 1
      ) {
        return false;
      }
    }
    if (m.scope !== undefined && !isModelScope(m.scope)) {
      return false;
    }
    if (m.enforcement !== undefined && !isEnforcementLevel(m.enforcement)) {
      return false;
    }
  }

  return true;
}

/**
 * Validates the current state schema (V7, with links array).
 */
export function isValidState(data: unknown): data is State {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isSchemaVersion(obj.schemaVersion)) {
    return false;
  }
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes) ||
    !Array.isArray(obj.models) ||
    !Array.isArray(obj.links)
  ) {
    return false;
  }

  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !hasUniqueIds(obj.models) ||
    !hasUniqueIds(obj.links) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  for (const variable of obj.variables) {
    if (
      typeof variable !== "object" ||
      variable === null ||
      typeof (variable as Record<string, unknown>).id !== "string" ||
      !isNodeRef((variable as Record<string, unknown>).node) ||
      typeof (variable as Record<string, unknown>).name !== "string" ||
      !isVariableStatus((variable as Record<string, unknown>).status)
    ) {
      return false;
    }
  }

  for (const episode of obj.episodes) {
    if (typeof episode !== "object" || episode === null) {
      return false;
    }
    const e = episode as Record<string, unknown>;
    // Validate base episode fields
    if (
      typeof e.id !== "string" ||
      !isNodeRef(e.node) ||
      !isEpisodeType(e.type) ||
      typeof e.objective !== "string" ||
      !isEpisodeStatus(e.status)
    ) {
      return false;
    }
    // variableId is optional
    if (e.variableId !== undefined && typeof e.variableId !== "string") {
      return false;
    }
    // openedAt is required (ISO timestamp string)
    if (typeof e.openedAt !== "string") {
      return false;
    }
    // closedAt is optional
    if (e.closedAt !== undefined && typeof e.closedAt !== "string") {
      return false;
    }
    // closureNoteId is optional
    if (e.closureNoteId !== undefined && typeof e.closureNoteId !== "string") {
      return false;
    }
  }

  for (const action of obj.actions) {
    if (typeof action !== "object" || action === null) {
      return false;
    }
    const a = action as Record<string, unknown>;
    if (
      typeof a.id !== "string" ||
      typeof a.description !== "string" ||
      !isActionStatus(a.status)
    ) {
      return false;
    }
    if (a.episodeId !== undefined && typeof a.episodeId !== "string") {
      return false;
    }
  }

  // Validate notes (V6: createdAt and tags required)
  for (const note of obj.notes) {
    if (typeof note !== "object" || note === null) {
      return false;
    }
    const n = note as Record<string, unknown>;
    // Required fields: id, content, createdAt, tags
    if (
      typeof n.id !== "string" ||
      typeof n.content !== "string" ||
      typeof n.createdAt !== "string" ||
      !Array.isArray(n.tags)
    ) {
      return false;
    }
    // Validate each tag is a valid NoteTag
    for (const tag of n.tags) {
      if (!isNoteTag(tag)) {
        return false;
      }
    }
    // linkedObjects is optional, must be string array if present
    if (n.linkedObjects !== undefined) {
      if (!Array.isArray(n.linkedObjects)) {
        return false;
      }
      for (const linked of n.linkedObjects) {
        if (typeof linked !== "string") {
          return false;
        }
      }
    }
  }

  // Validate models
  for (const model of obj.models) {
    if (typeof model !== "object" || model === null) {
      return false;
    }
    const m = model as Record<string, unknown>;
    // Required fields: id, type, statement
    if (
      typeof m.id !== "string" ||
      !isModelType(m.type) ||
      typeof m.statement !== "string"
    ) {
      return false;
    }
    // confidence is optional, must be number 0.0-1.0 if present
    if (m.confidence !== undefined) {
      if (
        typeof m.confidence !== "number" ||
        m.confidence < 0 ||
        m.confidence > 1
      ) {
        return false;
      }
    }
    // scope is optional, must be valid if present
    if (m.scope !== undefined && !isModelScope(m.scope)) {
      return false;
    }
    // enforcement is optional, must be valid if present
    if (m.enforcement !== undefined && !isEnforcementLevel(m.enforcement)) {
      return false;
    }
  }

  // Build set of all valid object IDs for referential integrity
  const allObjectIds = new Set<string>();
  for (const variable of obj.variables) {
    allObjectIds.add((variable as Record<string, unknown>).id as string);
  }
  for (const episode of obj.episodes) {
    allObjectIds.add((episode as Record<string, unknown>).id as string);
  }
  for (const action of obj.actions) {
    allObjectIds.add((action as Record<string, unknown>).id as string);
  }
  for (const note of obj.notes) {
    allObjectIds.add((note as Record<string, unknown>).id as string);
  }
  for (const model of obj.models) {
    allObjectIds.add((model as Record<string, unknown>).id as string);
  }
  for (const link of obj.links) {
    allObjectIds.add((link as Record<string, unknown>).id as string);
  }

  // Validate links
  for (const link of obj.links) {
    if (typeof link !== "object" || link === null) {
      return false;
    }
    const l = link as Record<string, unknown>;
    // Required fields: id, sourceId, targetId, relation
    if (
      typeof l.id !== "string" ||
      typeof l.sourceId !== "string" ||
      typeof l.targetId !== "string" ||
      !isLinkRelation(l.relation)
    ) {
      return false;
    }
    // weight is optional, must be number 0.0-1.0 if present
    if (l.weight !== undefined) {
      if (typeof l.weight !== "number" || l.weight < 0 || l.weight > 1) {
        return false;
      }
    }
    // Referential integrity: sourceId and targetId must exist
    if (!allObjectIds.has(l.sourceId) || !allObjectIds.has(l.targetId)) {
      return false;
    }
  }

  return true;
}
