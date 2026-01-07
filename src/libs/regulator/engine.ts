// The Regulator class: thin wrapper over pure logic functions
// Provides the public interface for the cybernetic control loop

import type {
  State,
  Variable,
  NodeRef,
  Proxy,
  ProxyReading,
} from "../memory/index.js";
import type {
  AddNoteLinkedObjectParams,
  AddNoteTagParams,
  CloseEpisodeParams,
  CompleteActionParams,
  CreateActionParams,
  CreateNoteParams,
  CreateProxyParams,
  CreateVariableParams,
  DeleteProxyParams,
  LogExceptionParams,
  LogProxyReadingParams,
  RemoveNoteTagParams,
  Result,
  OpenEpisodeParams,
  SignalParams,
  UpdateEpisodeParams,
  UpdateNoteParams,
  UpdateProxyParams,
} from "./types.js";
import * as logic from "./logic.js";
import type { RegulatorPolicy } from "./policy.js";
import {
  DEFAULT_REGULATOR_POLICY,
  getRegulatorPolicyForNode,
  validateRegulatorPolicy,
} from "./policy.js";
import { silentLogger } from "../shared/index.js";
import type { Logger } from "../shared/index.js";

/**
 * The Regulator organ: enforces cybernetic homeostasis rules.
 *
 * **Intent:** Provides a control loop that monitors variables and manages
 * episodes according to the doctrine's constraints (Max 1 Explore, Max 1 Stabilize per variable).
 *
 * **Contract:**
 * - All mutations return new State objects (immutable)
 * - Failed operations return Result<T> with error details
 * - Logging is optional and silent by default (cybernetic quiet baseline)
 */
export class Regulator {
  private logger: Logger;
  private policy: RegulatorPolicy;

  constructor(options?: { logger?: Logger; policy?: RegulatorPolicy }) {
    this.logger = options?.logger ?? silentLogger;
    const policy = options?.policy ?? DEFAULT_REGULATOR_POLICY;
    const validated = validateRegulatorPolicy(policy);
    if (validated.ok) {
      this.policy = validated.value;
    } else {
      this.logger.warn(
        `Invalid Regulator policy; falling back to DEFAULT_REGULATOR_POLICY. Reason: ${validated.error}`,
      );
      this.policy = DEFAULT_REGULATOR_POLICY;
    }
  }

  /**
   * Returns true when the node is in baseline (no active Episodes).
   */
  isBaseline(state: State, node: NodeRef): boolean {
    return logic.isBaseline(state, node);
  }

  /**
   * Gets all variables for a specific node.
   */
  getVariables(state: State, node: NodeRef): Variable[] {
    return logic.getVariablesByNode(state, node);
  }

  /**
   * Checks if a new Explore episode can be started for a node.
   * Enforces MAX_ACTIVE_EXPLORE_PER_NODE constraint.
   */
  canStartExplore(state: State, node: NodeRef): Result<void> {
    return logic.canStartExplore(
      state,
      node,
      getRegulatorPolicyForNode(this.policy, node),
    );
  }

  /**
   * Checks if an action can be created for a node.
   * If an Episode is referenced, it must exist and be Active.
   */
  canAct(state: State, node: NodeRef): Result<void> {
    return logic.canCreateAction(state, { node });
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
    const result = logic.openEpisode(
      state,
      params,
      getRegulatorPolicyForNode(this.policy, params.node),
    );
    if (result.ok) {
      this.logger.info(
        `Episode opened: ${params.type} for ${params.node} - "${params.objective}"`,
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
   * - Parameters: CloseEpisodeParams (episodeId, closedAt, optional closureNoteId, optional variableUpdates)
   * - Side effects: Logs episode closure (if logger provided)
   * - Error handling: Returns error if episode not found or already closed
   */
  closeEpisode(state: State, params: CloseEpisodeParams): Result<State> {
    const result = logic.closeEpisode(state, params);
    if (result.ok) {
      const updateCount = params.variableUpdates?.length ?? 0;
      this.logger.info(
        `Episode closed: ${params.episodeId}${updateCount > 0 ? ` (${updateCount} variable(s) updated)` : ""}`,
      );
    } else {
      this.logger.warn(`Episode close failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Updates an existing episode.
   *
   * **Intent:** Allows refining episode objective or adjusting timebox during active episodes.
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Parameters: UpdateEpisodeParams (episodeId, optional objective, optional timeboxDays)
   * - Side effects: Logs episode update (if logger provided)
   * - Error handling: Returns error if episode not found, not Active, or validation fails
   */
  updateEpisode(state: State, params: UpdateEpisodeParams): Result<State> {
    const result = logic.updateEpisode(state, params);
    if (result.ok) {
      const updates: string[] = [];
      if (params.objective !== undefined) {
        updates.push("objective");
      }
      if (params.timeboxDays !== undefined) {
        updates.push("timeboxDays");
      }
      this.logger.info(
        `Episode updated: ${params.episodeId} (${updates.join(", ")})`,
      );
    } else {
      this.logger.warn(`Episode update failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Applies a signal to update a Variable status via the Regulator.
   */
  signal(state: State, params: SignalParams): Result<State> {
    const result = logic.applySignal(state, params);
    if (result.ok) {
      this.logger.info(
        `Signal applied: ${params.node.type}:${params.node.id} variable ${params.variableId} -> ${params.status}`,
      );
    } else {
      this.logger.warn(`Signal failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Creates a new Variable.
   *
   * **Intent:** Adds a new dimension of viability to track.
   *
   * **Contract:**
   * - Returns: Result<State> with new state if successful
   * - Validates: name not empty, no duplicate name on same node
   * - Error handling: Returns error if validation fails
   */
  createVariable(state: State, params: CreateVariableParams): Result<State> {
    const result = logic.createVariable(state, params);
    if (result.ok) {
      this.logger.info(
        `Variable created: ${params.name} on ${params.node.type}:${params.node.id}`,
      );
    } else {
      this.logger.warn(`Variable creation failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Attempts to create an Action.
   */
  //TODO: Go through sensorium first
  act(state: State, params: CreateActionParams): Result<State> {
    const result = logic.createAction(state, params);
    if (result.ok) {
      this.logger.info(
        `Action created: ${params.node.type}:${params.node.id}${params.episodeId ? ` episode ${params.episodeId}` : ""}`,
      );
    } else {
      this.logger.warn(`Action failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Completes an Action by marking it as Done.
   *
   * **Intent:** Marks a pending action as completed.
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Idempotent: completing an already-done action returns success
   * - Error handling: Returns error if action not found
   */
  completeAction(state: State, params: CompleteActionParams): Result<State> {
    const result = logic.completeAction(state, params);
    if (result.ok) {
      this.logger.info(`Action completed: ${params.actionId}`);
    } else {
      this.logger.warn(`Action completion failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Creates a new note.
   *
   * **Intent:** Creates an unstructured context note with timestamp and optional tags.
   *
   * **Contract:**
   * - Returns: Result<State> with new state if successful
   * - Parameters: CreateNoteParams (noteId, content, createdAt, optional tags, optional linkedObjects)
   * - Side effects: Logs note creation (if logger provided)
   * - Error handling: Returns error if content empty or duplicate ID
   */
  createNote(state: State, params: CreateNoteParams): Result<State> {
    const result = logic.createNote(state, params);
    if (result.ok) {
      this.logger.info(`Note created: ${params.noteId}`);
    } else {
      this.logger.warn(`Note creation failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Adds a tag to an existing note.
   *
   * **Intent:** Tags a note for workflow categorization (inbox, processed, etc.).
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Idempotent: if tag already exists, returns success with unchanged state
   * - Error handling: Returns error if note not found or invalid tag
   */
  addNoteTag(state: State, params: AddNoteTagParams): Result<State> {
    const result = logic.addNoteTag(state, params);
    if (result.ok) {
      this.logger.info(`Tag '${params.tag}' added to note ${params.noteId}`);
    } else {
      this.logger.warn(`Add tag failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Removes a tag from an existing note.
   *
   * **Intent:** Untags a note when it transitions workflow states.
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Idempotent: if tag doesn't exist, returns success with unchanged state
   * - Error handling: Returns error if note not found or invalid tag
   */
  removeNoteTag(state: State, params: RemoveNoteTagParams): Result<State> {
    const result = logic.removeNoteTag(state, params);
    if (result.ok) {
      this.logger.info(
        `Tag '${params.tag}' removed from note ${params.noteId}`,
      );
    } else {
      this.logger.warn(`Remove tag failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Adds a linked object to an existing note.
   *
   * **Intent:** Enables Zettelkasten-style connections between notes and
   * regulated objects (Variables, Episodes, Models).
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Idempotent: if object already linked, returns success with unchanged state
   * - Error handling: Returns error if note not found or objectId empty
   */
  addNoteLinkedObject(
    state: State,
    params: AddNoteLinkedObjectParams,
  ): Result<State> {
    const result = logic.addNoteLinkedObject(state, params);
    if (result.ok) {
      this.logger.info(
        `Object '${params.objectId}' linked to note ${params.noteId}`,
      );
    } else {
      this.logger.warn(`Link object failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Updates an existing note's content.
   *
   * **Intent:** Allows refining note content during review workflow.
   *
   * **Contract:**
   * - Returns: Result<State> with updated state if successful
   * - Error handling: Returns error if note not found or content empty
   */
  updateNote(state: State, params: UpdateNoteParams): Result<State> {
    const result = logic.updateNote(state, params);
    if (result.ok) {
      this.logger.info(`Note updated: ${params.noteId}`);
    } else {
      this.logger.warn(`Note update failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Logs a Membrane exception when a user bypasses a Normative Model constraint.
   *
   * **Intent:** Provide audit trail for when users proceed despite warnings
   * or override blocks with justification.
   *
   * **Contract:**
   * - Returns: Result<State> with new exception appended
   * - Validates: modelId exists, mutationType and originalDecision are valid
   * - Error handling: Returns error if validation fails
   */
  logException(state: State, params: LogExceptionParams): Result<State> {
    const result = logic.logException(state, params);
    if (result.ok) {
      this.logger.info(
        `Exception logged: ${params.originalDecision} override for model ${params.modelId}`,
      );
    } else {
      this.logger.warn(`Exception logging failed: ${result.error}`);
    }
    return result;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROXY OPERATIONS (MP14)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Creates a new proxy for a Variable.
   *
   * **Intent:** Proxies are concrete signals that inform Variables.
   *
   * **Contract:**
   * - Returns: Result<State> with new proxy appended
   * - Validates: variableId exists, proxyId is unique, name is not empty
   * - Error handling: Returns error if validation fails
   */
  createProxy(state: State, params: CreateProxyParams): Result<State> {
    const result = logic.createProxy(state, params);
    if (result.ok) {
      this.logger.info(
        `Proxy created: ${params.name} for variable ${params.variableId}`,
      );
    } else {
      this.logger.warn(`Proxy creation failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Updates an existing proxy.
   *
   * **Intent:** Allow modifying proxy metadata without deleting and recreating.
   *
   * **Contract:**
   * - Returns: Result<State> with updated proxy
   * - Validates: proxyId exists
   * - Error handling: Returns error if validation fails
   */
  updateProxy(state: State, params: UpdateProxyParams): Result<State> {
    const result = logic.updateProxy(state, params);
    if (result.ok) {
      this.logger.info(`Proxy updated: ${params.proxyId}`);
    } else {
      this.logger.warn(`Proxy update failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Deletes a proxy and its associated readings.
   *
   * **Intent:** Remove a proxy that is no longer relevant.
   *
   * **Contract:**
   * - Returns: Result<State> with proxy and readings removed
   * - Validates: proxyId exists
   * - Error handling: Returns error if validation fails
   */
  deleteProxy(state: State, params: DeleteProxyParams): Result<State> {
    const result = logic.deleteProxy(state, params);
    if (result.ok) {
      this.logger.info(`Proxy deleted: ${params.proxyId}`);
    } else {
      this.logger.warn(`Proxy deletion failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Logs a proxy reading.
   *
   * **Intent:** Record a timestamped measurement from a proxy.
   *
   * **Contract:**
   * - Returns: Result<State> with new reading appended
   * - Validates: proxyId exists, value type matches proxy
   * - Error handling: Returns error if validation fails
   */
  logProxyReading(state: State, params: LogProxyReadingParams): Result<State> {
    const result = logic.logProxyReading(state, params);
    if (result.ok) {
      this.logger.info(`Reading logged for proxy: ${params.proxyId}`);
    } else {
      this.logger.warn(`Reading logging failed: ${result.error}`);
    }
    return result;
  }

  /**
   * Gets all proxies for a Variable.
   */
  getProxiesForVariable(state: State, variableId: string): Proxy[] {
    return logic.getProxiesForVariable(state, variableId);
  }

  /**
   * Gets recent readings for a proxy.
   */
  getRecentReadings(
    state: State,
    proxyId: string,
    limit?: number,
  ): ProxyReading[] {
    return logic.getRecentReadings(state, proxyId, limit);
  }
}
