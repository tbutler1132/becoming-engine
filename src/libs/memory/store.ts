// The Memory organ remembers
// JsonStore handles persistence of the system state

import fs from "fs-extra";
import * as path from "node:path";
import * as crypto from "node:crypto";
import {
  DEFAULT_ORG_NODE,
  DEFAULT_PERSONAL_NODE,
  SCHEMA_VERSION,
} from "./types.js";
import type { NodeRef, State, Variable, VariableStatus } from "./types.js";
import { getConfig, silentLogger } from "../shared/index.js";
import type { Logger } from "../shared/index.js";
import { migrateToLatest } from "./internal/migrations.js";
import {
  acquireLock,
  backupInvalidStateFile,
  getTempPath,
} from "./internal/fs.js";

// Use centralized configuration
const config = getConfig();

// Seed state constants (exported for test use)
export const SEED_PERSONAL_NODE: NodeRef = {
  ...DEFAULT_PERSONAL_NODE,
};
export const SEED_ORG_NODE: NodeRef = { ...DEFAULT_ORG_NODE };
export const SEED_AGENCY_NAME = "Agency";
export const SEED_EXECUTION_CAPACITY_NAME = "Execution Capacity";
export const SEED_STATUS: VariableStatus = "InRange";

// Re-export Logger for API compatibility
export type { Logger } from "../shared/index.js";

export class JsonStore {
  private filePath: string;
  private lockPath: string;
  private logger: Logger;

  constructor(options?: { basePath?: string; logger?: Logger }) {
    const basePath = options?.basePath ?? process.cwd();
    this.filePath = path.join(basePath, config.dataDir, config.stateFile);
    this.lockPath = path.join(
      path.dirname(this.filePath),
      `${config.stateFile}.lock`,
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
      const result = migrateToLatest(data);

      switch (result.status) {
        case "current":
          return result.state;

        case "migrated":
          this.logger.info(
            `Migrated state from v${result.fromVersion} to v${SCHEMA_VERSION}`,
          );
          return result.state;

        case "invalid":
          await this.backupInvalidStateFile();
          this.logger.warn("Invalid state file format, returning seed");
          return this.createSeed();
      }
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

    const release = await acquireLock(this.lockPath);
    try {
      const tempPath = getTempPath(this.filePath, config.stateFile);
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
      models: [],
      links: [],
      exceptions: [],
      proxies: [],
      proxyReadings: [],
    };
  }

  private async backupInvalidStateFile(): Promise<void> {
    await backupInvalidStateFile(this.filePath, config.stateFile);
  }
}
