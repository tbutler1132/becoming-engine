// The Memory organ remembers
// JsonStore handles persistence of the system state

import fs from "fs-extra";
import * as path from "node:path";
import * as crypto from "node:crypto";
import { open as openFile } from "node:fs/promises";
import {
  ACTION_STATUSES,
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
  NodeType,
  SchemaVersion,
  State,
  Variable,
  VariableStatus,
} from "./types.js";

const DATA_DIR = "data";
const STATE_FILE = "state.json";

type StateV0 = Omit<State, "schemaVersion">;

// Seed state constants (exported for test use)
export const SEED_PERSONAL_NODE: NodeType = "Personal";
export const SEED_ORG_NODE: NodeType = "Org";
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

function isMember<T extends readonly string[]>(
  allowed: T,
  value: string
): value is T[number] {
  // Casting allowed to readonly string[] is safe here; we're only reading.
  return (allowed as readonly string[]).includes(value);
}

function isNodeType(value: unknown): value is NodeType {
  return typeof value === "string" && isMember(NODE_TYPES, value);
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
  episodes: readonly unknown[]
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

/**
 * Type guard to validate that loaded JSON matches State structure.
 * Ensures type safety when reading from disk by validating nested structures.
 */
function isValidStateV0(data: unknown): data is StateV0 {
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

function isValidStateV1(data: unknown): data is State {
  if (typeof data !== "object" || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  if (!isSchemaVersion(obj.schemaVersion)) {
    return false;
  }
  return isValidStateV0(data);
}

function migrateV0ToV1(state: StateV0): State {
  return { schemaVersion: SCHEMA_VERSION, ...state };
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
      `${STATE_FILE}.lock`
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

      if (isValidStateV1(data)) {
        return data;
      }

      if (isValidStateV0(data)) {
        // Backward-compatible: files without schemaVersion are treated as v0.
        return migrateV0ToV1(data);
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
        })
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
