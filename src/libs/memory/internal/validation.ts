import {
  ACTION_STATUSES,
  DEFAULT_ORG_NODE_ID,
  DEFAULT_PERSONAL_NODE_ID,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  NODE_TYPES,
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
} from "../types.js";
import type {
  ActionStatus,
  EpisodeStatus,
  EpisodeType,
  NodeRef,
  NodeType,
  SchemaVersion,
  State,
  VariableStatus,
} from "../types.js";

const LEGACY_SCHEMA_VERSION_V1 = 1 as const;
const LEGACY_SCHEMA_VERSION_V2 = 2 as const;
const LEGACY_SCHEMA_VERSION_V3 = 3 as const;

export type StateV2 = Omit<State, "schemaVersion"> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V2;
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

export function isValidStateV4(data: unknown): data is State {
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
