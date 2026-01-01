// The Regulator class: thin wrapper over pure logic functions
// Provides the public interface for the cybernetic control loop

import type { State, Variable, NodeType } from "../memory/index.js";
import type { Result, OpenEpisodeParams, VariableUpdate } from "./types.js";
import * as logic from "./logic.js";

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

/**
 * The Regulator organ: enforces cybernetic homeostasis rules.
 *
 * **Intent:** Provides a control loop that monitors variables and manages
 * episodes according to the doctrine's constraints (Max 1 Explore, No Action
 * without Episode).
 *
 * **Contract:**
 * - All mutations return new State objects (immutable)
 * - Failed operations return Result<T> with error details
 * - Logging is optional and silent by default (cybernetic quiet baseline)
 */
export class Regulator {
  private logger: Logger;

  constructor(options?: { logger?: Logger }) {
    this.logger = options?.logger ?? silentLogger;
  }

  /**
   * Gets all variables for a specific node.
   */
  getVariables(state: State, node: NodeType): Variable[] {
    return logic.getVariablesByNode(state, node);
  }

  /**
   * Checks if a new Explore episode can be started for a node.
   * Enforces MAX_ACTIVE_EXPLORE_PER_NODE constraint.
   */
  canStartExplore(state: State, node: NodeType): Result<void> {
    return logic.canStartExplore(state, node);
  }

  /**
   * Checks if an action can be created for a node.
   * Enforces "Silence" rule: No Action without Active Episode.
   */
  canAct(state: State, node: NodeType): Result<void> {
    return logic.canCreateAction(state, node);
  }

  /**
   * Opens a new episode.
   *
   * **Intent:** Creates a temporary, bounded intervention (Episode).
   *
   * **Contract:**
   * - Returns: Result<State> with new state if successful
   * - Validates: objective not empty, Explore constraint if applicable
   * - Side effects: Logs episode creation (if logger provided)
   * - Error handling: Returns error in Result if constraints violated
   */
  openEpisode(state: State, params: OpenEpisodeParams): Result<State> {
    const result = logic.openEpisode(state, params);
    if (result.ok) {
      this.logger.info(
        `Episode opened: ${params.type} for ${params.node} - "${params.objective}"`
      );
    } else {
      this.logger.warn(`Episode open failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Closes an episode and optionally updates variables.
   *
   * **Intent:** Ends a temporary intervention and integrates learning
   * (variable updates) back into the system.
   *
   * **Contract:**
   * - Returns: Result<State> with new state if successful
   * - Parameters: episodeId, optional variableUpdates
   * - Side effects: Logs episode closure (if logger provided)
   * - Error handling: Returns error if episode not found or already closed
   */
  closeEpisode(
    state: State,
    episodeId: string,
    variableUpdates?: VariableUpdate[]
  ): Result<State> {
    const result = logic.closeEpisode(state, episodeId, variableUpdates);
    if (result.ok) {
      const updateCount = variableUpdates?.length ?? 0;
      this.logger.info(
        `Episode closed: ${episodeId}${updateCount > 0 ? ` (${updateCount} variable(s) updated)` : ""}`
      );
    } else {
      this.logger.warn(`Episode close failed: ${result.error}`);
    }
    return result;
  }
}

