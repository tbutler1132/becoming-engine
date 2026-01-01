// The Memory organ remembers
// JsonStore handles persistence of the system state

import fs from "fs-extra";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { open as openFile } from "node:fs/promises";
import {
  ACTION_STATUSES,
  DEFAULT_ORG_NODE,
  DEFAULT_ORG_NODE_ID,
  DEFAULT_PERSONAL_NODE,
  DEFAULT_PERSONAL_NODE_ID,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  NODE_TYPES,
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
} from "./types.js";
import type {
  ActionStatus,
  EpisodeStatus,
  EpisodeType,
  NodeRef,
  NodeType,
  SchemaVersion,
  State,
  Variable,
  VariableStatus,
} from "./types.js";

const DATA_DIR = "data";
const STATE_FILE = "state.json";

const LEGACY_SCHEMA_VERSION_V1 = 1 as const;
const LEGACY_SCHEMA_VERSION_V2 = 2 as const;

type StateV2 = Omit<State, "schemaVersion"> & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V2;
};

type LegacyVariable = {
  id: string;
  node: NodeType;
  name: string;
  status: VariableStatus;
};

type LegacyEpisode = {
  id: string;
  node: NodeType;
  type: EpisodeType;
  objective: string;
  status: EpisodeStatus;
};

type LegacyAction = {
  id: string;
  description: string;
  status: ActionStatus;
  episodeId: string;
};

type LegacyNote = {
  id: string;
  content: string;
};

type LegacyStateV0 = {
  variables: LegacyVariable[];
  episodes: LegacyEpisode[];
  actions: LegacyAction[];
  notes: LegacyNote[];
};

type LegacyStateV1 = LegacyStateV0 & {
  schemaVersion: typeof LEGACY_SCHEMA_VERSION_V1;
};

// Seed state constants (exported for test use)
export const SEED_PERSONAL_NODE: NodeRef = {
  ...DEFAULT_PERSONAL_NODE,
};
export const SEED_ORG_NODE: NodeRef = { ...DEFAULT_ORG_NODE };
export const SEED_AGENCY_NAME = "Agency";
export const SEED_EXECUTION_CAPACITY_NAME = "Execution Capacity";
export const SEED_STATUS: VariableStatus = "InRange";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string, error?: unknown): void;
}

const silentLogger: Logger = {
  info(): void {},
  warn(): void {},
  error(): void {},
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

function isMember<T extends readonly string[]>(
  allowed: T,
  value: string,
): value is T[number] {
  // Casting allowed to readonly string[] is safe here; we're only reading.
  return (allowed as readonly string[]).includes(value);
}

function isNodeType(value: unknown): value is NodeType {
  return typeof value === "string" && isMember(NODE_TYPES, value);
}

function nodeRefFromLegacy(node: NodeType): NodeRef {
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

/**
 * Type guard to validate that loaded JSON matches State structure.
 * Ensures type safety when reading from disk by validating nested structures.
 */
function isValidLegacyStateV0(data: unknown): data is LegacyStateV0 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;

  // Validate top-level structure
  if (
    !Array.isArray(obj.variables) ||
    !Array.isArray(obj.episodes) ||
    !Array.isArray(obj.actions) ||
    !Array.isArray(obj.notes)
  ) {
    return false;
  }

  // Invariants: unique IDs per collection + referential integrity
  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  // Validate Variable structure
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

  // Validate Episode structure
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

  // Validate Action structure
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

  // Validate Note structure
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

function isValidLegacyStateV1(data: unknown): data is LegacyStateV1 {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isLegacySchemaVersionV1(obj.schemaVersion)) {
    return false;
  }
  return isValidLegacyStateV0(data);
}

function isValidLegacyStateV2(data: unknown): data is StateV2 {
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

  // Invariants: unique IDs per collection + referential integrity (v2 required)
  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  // Validate Variable structure (v2)
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

  // Validate Episode structure (v2)
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

  // Validate Action structure (v2)
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

  // Validate Note structure (v2)
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

function migrateV2ToV3(v2: StateV2): State {
  return {
    ...v2,
    schemaVersion: SCHEMA_VERSION,
  };
}

function isValidStateV3(data: unknown): data is State {
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

  // Invariants: unique IDs per collection + referential integrity (only when episodeId present)
  if (
    !hasUniqueIds(obj.variables) ||
    !hasUniqueIds(obj.episodes) ||
    !hasUniqueIds(obj.actions) ||
    !hasUniqueIds(obj.notes) ||
    !actionsWithEpisodeIdsReferToEpisodes(obj.actions, obj.episodes)
  ) {
    return false;
  }

  // Validate Variable structure (v3)
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

  // Validate Episode structure (v3)
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

  // Validate Action structure (v3)
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

  // Validate Note structure (v3)
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

function migrateLegacyToV2(state: LegacyStateV0 | LegacyStateV1): State {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: state.variables.map((v) => ({
      ...v,
      node: nodeRefFromLegacy(v.node),
    })),
    episodes: state.episodes.map((e) => ({
      ...e,
      node: nodeRefFromLegacy(e.node),
    })),
    actions: state.actions,
    notes: state.notes,
  };
}

export class JsonStore {
  private filePath: string;
  private lockPath: string;
  private logger: Logger;

  constructor(options?: { basePath?: string; logger?: Logger }) {
    const basePath = options?.basePath ?? process.cwd();
    this.filePath = path.join(basePath, DATA_DIR, STATE_FILE);
    this.lockPath = path.join(
      path.dirname(this.filePath),
      `${STATE_FILE}.lock`,
    );
    this.logger = options?.logger ?? silentLogger;
  }

  /**
   * Loads the system state from persistent storage.
   *
   * **Intent:** Provides access to the current system state, ensuring
   * a valid state always exists (seeds if missing).
   *
   * **Contract:**
   * - Returns: Promise resolving to a valid State object
   * - Side effects: May emit messages to the provided logger (defaults to silent)
   * - Error handling: Falls back to seed state on any error
   */
  async load(): Promise<State> {
    try {
      const exists = await fs.pathExists(this.filePath);
      if (!exists) {
        this.logger.info("No state file found. Generating seed state...");
        return this.createSeed();
      }
      const data: unknown = await fs.readJson(this.filePath);

      if (isValidStateV3(data)) {
        return data;
      }

      if (isValidLegacyStateV2(data)) {
        return migrateV2ToV3(data);
      }

      if (isValidLegacyStateV1(data)) {
        return migrateLegacyToV2(data);
      }

      if (isValidLegacyStateV0(data)) {
        // Backward-compatible: files without schemaVersion are treated as v0 (legacy).
        return migrateLegacyToV2(data);
      }

      await this.backupInvalidStateFile();
      this.logger.warn("Invalid state file format, returning seed");
      return this.createSeed();
    } catch (error) {
      await this.backupInvalidStateFile();
      this.logger.error("Error loading state, returning seed", error);
      return this.createSeed();
    }
  }

  /**
   * Persists the system state to disk.
   *
   * **Intent:** Ensures state survives process restarts by writing to JSON.
   *
   * **Contract:**
   * - Parameters: state - The complete State object to persist
   * - Returns: Promise resolving to void
   * - Side effects: Creates data directory if missing, writes JSON file
   * - Error handling: Propagates filesystem errors to caller
   */
  async save(state: State): Promise<void> {
    await fs.ensureDir(path.dirname(this.filePath));

    const release = await this.acquireLock();
    try {
      const tempPath = this.getTempPath();
      await fs.writeJson(tempPath, state, { spaces: 2 });
      await fs.move(tempPath, this.filePath, { overwrite: true });
    } finally {
      await release();
    }
  }

  /**
   * Generates the initial system state when no persisted state exists.
   *
   * **Intent:** Provides a baseline viable state with core variables
   * for both Personal and Org nodes, ensuring the system can start
   * from a known-good configuration.
   *
   * **Contract:**
   * - Returns: A valid State object with seed variables
   * - Variables: Agency (Personal) and Execution Capacity (Org), both InRange
   * - All other collections (episodes, actions, notes) are empty arrays
   */
  private createSeed(): State {
    const agencyVariable: Variable = {
      id: crypto.randomUUID(),
      node: SEED_PERSONAL_NODE,
      name: SEED_AGENCY_NAME,
      status: SEED_STATUS,
    };

    const executionCapacityVariable: Variable = {
      id: crypto.randomUUID(),
      node: SEED_ORG_NODE,
      name: SEED_EXECUTION_CAPACITY_NAME,
      status: SEED_STATUS,
    };

    return {
      schemaVersion: SCHEMA_VERSION,
      variables: [agencyVariable, executionCapacityVariable],
      episodes: [],
      actions: [],
      notes: [],
    };
  }

  private getTempPath(): string {
    const dir = path.dirname(this.filePath);
    const id = crypto.randomUUID();
    return path.join(dir, `${STATE_FILE}.tmp-${id}`);
  }

  private async acquireLock(): Promise<() => Promise<void>> {
    // Intent: prevent concurrent writers from clobbering state.json.
    // Contract: throws if lock cannot be acquired; always returns a release function on success.
    const handle = await openFile(this.lockPath, "wx");
    try {
      await handle.writeFile(
        JSON.stringify({
          pid: process.pid,
          createdAt: new Date().toISOString(),
        }),
      );
    } finally {
      await handle.close();
    }

    return async (): Promise<void> => {
      try {
        await fs.remove(this.lockPath);
      } catch {
        // best-effort cleanup
      }
    };
  }

  private async backupInvalidStateFile(): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupPath = path.join(dir, `${STATE_FILE}.corrupt-${timestamp}`);
      const exists = await fs.pathExists(this.filePath);
      if (!exists) {
        return;
      }
      await fs.move(this.filePath, backupPath, { overwrite: false });
    } catch {
      // best-effort; do not block recovery
    }
  }
}
