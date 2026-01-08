// Pure logic functions for the Regulator organ
// All functions are pure: (State, Input) => Result | NewState

import {
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  formatNodeRef,
  nodeRefEquals,
} from "../memory/index.js";
import type { State, Note, NoteTag, Proxy } from "../memory/index.js";
import type {
  AddNoteLinkedObjectParams,
  AddNoteTagParams,
  CloseEpisodeParams,
  CompleteActionParams,
  CreateActionParams,
  CreateLinkParams,
  CreateModelParams,
  CreateNoteParams,
  CreateProxyParams,
  CreateVariableParams,
  DeleteLinkParams,
  DeleteProxyParams,
  LogExceptionParams,
  LogProxyReadingParams,
  RemoveNoteTagParams,
  Result,
  OpenEpisodeParams,
  SignalParams,
  UpdateEpisodeParams,
  UpdateModelParams,
  UpdateNoteParams,
  UpdateProxyParams,
} from "./types.js";
import type { RegulatorPolicyForNode } from "./policy.js";
import {
  collectAllObjectIds,
  checkVariableExists,
  checkModelExists,
  checkProxyExists,
  checkNoDuplicateId,
} from "./internal/integrity.js";
import {
  validateEpisodeParams,
  canStartExplore,
  canStartStabilize,
  validateClosureNote,
  validateEpisodeClosure,
  validateEpisodeUpdate,
  validateActionCreation,
  validateModelParams,
  validateModelUpdate,
  validateNoteContent,
  validateNoteTag,
  validateNoteTags,
  validateLinkRelation,
  validateLinkWeight,
  validateExceptionParams,
} from "./internal/validation.js";
import {
  applyOpenEpisode,
  applyCloseEpisode,
  applyUpdateEpisode,
  applyCreateAction,
  applyCompleteAction,
  applyCreateModel,
  applyCreateNote,
  applyCreateLink,
  applyDeleteLink,
  applyCreateProxy,
  applyDeleteProxy,
  applyLogProxyReading,
  applyLogException,
  applyCreateVariable,
} from "./internal/transform.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const EXPLORE_TYPE = EPISODE_TYPES[1];
const ACTION_PENDING_STATUS = ACTION_STATUSES[0];
const ACTION_DONE_STATUS = ACTION_STATUSES[1];

type CanCreateActionParams = Pick<CreateActionParams, "node" | "episodeId">;

// Re-export canStartExplore for API compatibility
export { canStartExplore } from "./internal/validation.js";

/**
 * Validates whether an action can be created for a node.
 * Actions may exist without an Episode. If an Episode is referenced, it must be valid and active.
 */
export function canCreateAction(
  state: State,
  params: CanCreateActionParams,
): Result<void> {
  // For legacy API compatibility, we only check episode constraints (not description)
  if (!params.episodeId) {
    return { ok: true, value: undefined };
  }

  const episode = state.episodes.find((e) => e.id === params.episodeId);
  if (!episode) {
    return { ok: false, error: `Episode '${params.episodeId}' not found` };
  }

  if (!nodeRefEquals(episode.node, params.node)) {
    return {
      ok: false,
      error: `Episode '${params.episodeId}' does not belong to node ${formatNodeRef(params.node)}`,
    };
  }

  if (episode.status !== ACTIVE_STATUS) {
    return { ok: false, error: `Episode '${params.episodeId}' is not active` };
  }

  return { ok: true, value: undefined };
}

/**
 * Applies a signal to update a variable's status.
 * Returns a new State if successful.
 */
const AUDIT_NOTE_TAG: NoteTag = "audit";

export function applySignal(state: State, params: SignalParams): Result<State> {
  const variable = state.variables.find((v) => v.id === params.variableId);
  if (!variable) {
    return { ok: false, error: `Variable '${params.variableId}' not found` };
  }
  if (!nodeRefEquals(variable.node, params.node)) {
    return {
      ok: false,
      error: `Variable '${params.variableId}' does not belong to node ${params.node.type}:${params.node.id}`,
    };
  }

  const oldStatus = variable.status;
  const newStatus = params.status;

  const updatedVariables = state.variables.map((v) =>
    v.id === params.variableId ? { ...v, status: params.status } : v,
  );

  // If status actually changed, create an audit Note
  if (oldStatus !== newStatus) {
    const noteId = params.auditNoteId ?? crypto.randomUUID();
    const timestamp = params.auditTimestamp ?? new Date().toISOString();
    const reason = params.reason ?? "";
    const content = reason
      ? `Status changed: ${oldStatus} → ${newStatus}. ${reason}`
      : `Status changed: ${oldStatus} → ${newStatus}`;

    const auditNote: Note = {
      id: noteId,
      content,
      createdAt: timestamp,
      tags: [AUDIT_NOTE_TAG],
      linkedObjects: [params.variableId],
    };

    return {
      ok: true,
      value: {
        ...state,
        variables: updatedVariables,
        notes: [...state.notes, auditNote],
      },
    };
  }

  // No status change, no audit note needed
  return {
    ok: true,
    value: {
      ...state,
      variables: updatedVariables,
    },
  };
}

/**
 * Creates a new Action. Actions may be episode-less; when an Episode is referenced it must exist and be Active.
 * Returns a new State if successful.
 */
export function createAction(
  state: State,
  params: CreateActionParams,
): Result<State> {
  const validationCheck = validateActionCreation(
    state,
    params.node,
    params.episodeId,
    params.description,
  );
  if (!validationCheck.ok) return validationCheck;

  return { ok: true, value: applyCreateAction(state, params) };
}

/**
 * Completes an Action by transitioning its status from Pending to Done.
 *
 * **Intent:** Marks an action as completed. Actions are disposable execution units
 * that disappear when complete (per doctrine).
 *
 * **Contract:**
 * - Returns: Result<State> with updated state if successful
 * - Validates: action exists and is currently Pending
 * - Error handling: Returns error if action not found or already Done
 */
export function completeAction(
  state: State,
  params: CompleteActionParams,
): Result<State> {
  const action = state.actions.find((a) => a.id === params.actionId);

  if (!action) {
    return { ok: false, error: `Action '${params.actionId}' not found` };
  }

  if (action.status === ACTION_DONE_STATUS) {
    // Idempotent: already done is success
    return { ok: true, value: state };
  }

  if (action.status !== ACTION_PENDING_STATUS) {
    return {
      ok: false,
      error: `Action '${params.actionId}' has unexpected status: ${action.status}`,
    };
  }

  return { ok: true, value: applyCompleteAction(state, params.actionId) };
}

// Re-export validateEpisodeParams for API compatibility
export { validateEpisodeParams } from "./internal/validation.js";

/**
 * Opens a new episode.
 * Returns a new State with the episode added.
 * Pure function: does not mutate input state.
 */
export function openEpisode(
  state: State,
  params: OpenEpisodeParams,
  policy?: RegulatorPolicyForNode,
): Result<State> {
  // Validate params
  const paramsCheck = validateEpisodeParams(params);
  if (!paramsCheck.ok) return paramsCheck;

  // Check type-specific constraints
  if (params.type === EXPLORE_TYPE) {
    const exploreCheck = canStartExplore(state, params.node, policy);
    if (!exploreCheck.ok) return exploreCheck;
  }

  if (params.type === STABILIZE_TYPE) {
    const stabilizeCheck = canStartStabilize(
      state,
      params.node,
      params.variableId,
      policy,
    );
    if (!stabilizeCheck.ok) return stabilizeCheck;
  }

  return { ok: true, value: applyOpenEpisode(state, params) };
}

// Re-export validateClosureNote for API compatibility
export { validateClosureNote } from "./internal/validation.js";

/**
 * Closes an episode and creates a closure note.
 * Returns a new State with the episode closed, timestamps set, note created, variables updated, and models created/updated.
 * Pure function: does not mutate input state.
 *
 * Explore episodes MUST produce at least one Model update (learning is required).
 */
export function closeEpisode(
  state: State,
  params: CloseEpisodeParams,
): Result<State> {
  const { episodeId, closedAt, closureNote, variableUpdates, modelUpdates } =
    params;

  // Validate closure note
  const noteCheck = validateClosureNote(closureNote);
  if (!noteCheck.ok) return noteCheck;

  // Validate episode can be closed
  const closureCheck = validateEpisodeClosure(
    state,
    episodeId,
    modelUpdates?.length ?? 0,
  );
  if (!closureCheck.ok) return closureCheck;

  return {
    ok: true,
    value: applyCloseEpisode(
      state,
      episodeId,
      closedAt,
      closureNote.id,
      closureNote.content,
      variableUpdates,
      modelUpdates,
    ),
  };
}

/**
 * Updates an existing episode.
 * Returns a new State with the episode updated.
 * Pure function: does not mutate input state.
 *
 * Only Active episodes can be edited. Closed episodes are immutable.
 */
export function updateEpisode(
  state: State,
  params: UpdateEpisodeParams,
): Result<State> {
  const updateCheck = validateEpisodeUpdate(
    state,
    params.episodeId,
    params.objective,
    params.timeboxDays,
  );
  if (!updateCheck.ok) return updateCheck;

  return {
    ok: true,
    value: applyUpdateEpisode(
      state,
      params.episodeId,
      params.objective,
      params.timeboxDays,
    ),
  };
}

/**
 * Creates a new model.
 * Returns a new State with the model added.
 * Pure function: does not mutate input state.
 */
export function createModel(
  state: State,
  params: CreateModelParams,
): Result<State> {
  // Validate params
  const validation = validateModelParams(params);
  if (!validation.ok) return validation;

  // Check for duplicate ID
  const duplicateCheck = checkNoDuplicateId(
    state.models,
    params.modelId,
    "Model",
  );
  if (!duplicateCheck.ok) return duplicateCheck;

  return { ok: true, value: applyCreateModel(state, params) };
}

/**
 * Updates an existing model.
 * Returns a new State with the model updated.
 * Pure function: does not mutate input state.
 */
export function updateModel(
  state: State,
  params: UpdateModelParams,
): Result<State> {
  // Find the model
  const modelCheck = checkModelExists(state, params.modelId);
  if (!modelCheck.ok) return modelCheck;

  // Validate updates
  const updateCheck = validateModelUpdate(
    params.statement,
    params.confidence,
    params.scope,
    params.enforcement,
  );
  if (!updateCheck.ok) return updateCheck;

  const updatedModels = state.models.map((m) =>
    m.id === params.modelId
      ? {
          ...m,
          ...(params.statement !== undefined
            ? { statement: params.statement }
            : {}),
          ...(params.confidence !== undefined
            ? { confidence: params.confidence }
            : {}),
          ...(params.scope !== undefined ? { scope: params.scope } : {}),
          ...(params.enforcement !== undefined
            ? { enforcement: params.enforcement }
            : {}),
        }
      : m,
  );

  return {
    ok: true,
    value: {
      ...state,
      models: updatedModels,
    },
  };
}

/**
 * Creates a new note.
 * Returns a new State with the note added.
 * Pure function: does not mutate input state.
 */
export function createNote(
  state: State,
  params: CreateNoteParams,
): Result<State> {
  // Validate content
  const contentCheck = validateNoteContent(params.content);
  if (!contentCheck.ok) return contentCheck;

  // Check for duplicate ID
  const duplicateCheck = checkNoDuplicateId(state.notes, params.noteId, "Note");
  if (!duplicateCheck.ok) return duplicateCheck;

  // Validate tags if provided
  if (params.tags) {
    const tagsCheck = validateNoteTags(params.tags);
    if (!tagsCheck.ok) return tagsCheck;
  }

  return { ok: true, value: applyCreateNote(state, params) };
}

/**
 * Adds a tag to an existing note.
 * Idempotent: if tag already exists, returns success with unchanged state.
 * Pure function: does not mutate input state.
 */
export function addNoteTag(
  state: State,
  params: AddNoteTagParams,
): Result<State> {
  // Find the note
  const note = state.notes.find((n) => n.id === params.noteId);
  if (!note) {
    return { ok: false, error: `Note with id '${params.noteId}' not found` };
  }

  // Validate tag
  const tagCheck = validateNoteTag(params.tag);
  if (!tagCheck.ok) return tagCheck;

  // Idempotent: if tag already exists, return success with same state
  if (note.tags.includes(params.tag)) {
    return { ok: true, value: state };
  }

  // Add the tag
  const updatedNotes = state.notes.map((n) =>
    n.id === params.noteId ? { ...n, tags: [...n.tags, params.tag] } : n,
  );

  return {
    ok: true,
    value: {
      ...state,
      notes: updatedNotes,
    },
  };
}

/**
 * Removes a tag from an existing note.
 * Idempotent: if tag doesn't exist, returns success with unchanged state.
 * Pure function: does not mutate input state.
 */
export function removeNoteTag(
  state: State,
  params: RemoveNoteTagParams,
): Result<State> {
  // Find the note
  const note = state.notes.find((n) => n.id === params.noteId);
  if (!note) {
    return { ok: false, error: `Note with id '${params.noteId}' not found` };
  }

  // Validate tag
  const tagCheck = validateNoteTag(params.tag);
  if (!tagCheck.ok) return tagCheck;

  // Idempotent: if tag doesn't exist, return success with same state
  if (!note.tags.includes(params.tag)) {
    return { ok: true, value: state };
  }

  // Remove the tag
  const updatedNotes = state.notes.map((n) =>
    n.id === params.noteId
      ? { ...n, tags: n.tags.filter((t) => t !== params.tag) }
      : n,
  );

  return {
    ok: true,
    value: {
      ...state,
      notes: updatedNotes,
    },
  };
}

/**
 * Adds a linked object to an existing note.
 * Pure function: does not mutate input state.
 * Idempotent: adding an already-linked object succeeds with same state.
 *
 * @param state - Current state
 * @param params - AddNoteLinkedObjectParams with noteId and objectId
 * @returns Result<State> with updated note or error
 */
export function addNoteLinkedObject(
  state: State,
  params: AddNoteLinkedObjectParams,
): Result<State> {
  // Find the note
  const note = state.notes.find((n) => n.id === params.noteId);
  if (!note) {
    return { ok: false, error: `Note with id '${params.noteId}' not found` };
  }

  // Validate objectId is not empty
  if (!params.objectId || params.objectId.trim().length === 0) {
    return { ok: false, error: "Object ID cannot be empty" };
  }

  const currentLinkedObjects = note.linkedObjects ?? [];

  // Idempotent: if already linked, return success with same state
  if (currentLinkedObjects.includes(params.objectId)) {
    return { ok: true, value: state };
  }

  // Add the linked object
  const updatedNotes = state.notes.map((n) =>
    n.id === params.noteId
      ? { ...n, linkedObjects: [...currentLinkedObjects, params.objectId] }
      : n,
  );

  return {
    ok: true,
    value: {
      ...state,
      notes: updatedNotes,
    },
  };
}

/**
 * Updates an existing note's content.
 * Pure function: does not mutate input state.
 *
 * @param state - Current state
 * @param params - UpdateNoteParams with noteId and new content
 * @returns Result<State> with updated note or error
 */
export function updateNote(
  state: State,
  params: UpdateNoteParams,
): Result<State> {
  // Find the note
  const note = state.notes.find((n) => n.id === params.noteId);
  if (!note) {
    return { ok: false, error: `Note with id '${params.noteId}' not found` };
  }

  // Validate content
  const contentCheck = validateNoteContent(params.content);
  if (!contentCheck.ok) return contentCheck;

  // Update the note content
  const updatedNotes = state.notes.map((n) =>
    n.id === params.noteId ? { ...n, content: params.content } : n,
  );

  return {
    ok: true,
    value: {
      ...state,
      notes: updatedNotes,
    },
  };
}

/**
 * Creates a new link between two objects.
 * Returns a new State with the link added.
 * Pure function: does not mutate input state.
 */
export function createLink(
  state: State,
  params: CreateLinkParams,
): Result<State> {
  // Validate relation type
  const relationCheck = validateLinkRelation(params.relation);
  if (!relationCheck.ok) return relationCheck;

  // Validate weight if present
  const weightCheck = validateLinkWeight(params.weight);
  if (!weightCheck.ok) return weightCheck;

  // Check for duplicate ID
  const duplicateCheck = checkNoDuplicateId(state.links, params.linkId, "Link");
  if (!duplicateCheck.ok) return duplicateCheck;

  // Check referential integrity
  const allObjectIds = collectAllObjectIds(state);
  if (!allObjectIds.has(params.sourceId)) {
    return { ok: false, error: `Source object '${params.sourceId}' not found` };
  }
  if (!allObjectIds.has(params.targetId)) {
    return { ok: false, error: `Target object '${params.targetId}' not found` };
  }

  return { ok: true, value: applyCreateLink(state, params) };
}

/**
 * Deletes a link by ID.
 * Returns a new State with the link removed.
 * Pure function: does not mutate input state.
 */
export function deleteLink(
  state: State,
  params: DeleteLinkParams,
): Result<State> {
  // Find the link
  const linkExists = state.links.some((l) => l.id === params.linkId);
  if (!linkExists) {
    return { ok: false, error: `Link with id '${params.linkId}' not found` };
  }

  return { ok: true, value: applyDeleteLink(state, params.linkId) };
}

// ═══════════════════════════════════════════════════════════════════════════
// VARIABLE CREATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new variable.
 * Returns a new State with the variable added.
 * Pure function: does not mutate input state.
 *
 * @param state - Current state
 * @param params - CreateVariableParams with variableId, node, name, and status
 * @returns Result<State> with new variable or error
 */
export function createVariable(
  state: State,
  params: CreateVariableParams,
): Result<State> {
  // Validate name is not empty
  if (!params.name || params.name.trim().length === 0) {
    return { ok: false, error: "Variable name cannot be empty" };
  }

  // Check for duplicate variable name on same node
  const duplicateName = state.variables.some(
    (v) =>
      v.name.toLowerCase() === params.name.toLowerCase() &&
      nodeRefEquals(v.node, params.node),
  );
  if (duplicateName) {
    return {
      ok: false,
      error: `Variable with name '${params.name}' already exists on node ${formatNodeRef(params.node)}`,
    };
  }

  // Check for duplicate ID
  const duplicateCheck = checkNoDuplicateId(
    state.variables,
    params.variableId,
    "Variable",
  );
  if (!duplicateCheck.ok) return duplicateCheck;

  return { ok: true, value: applyCreateVariable(state, params) };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROXY OPERATIONS (MP14)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new proxy for a Variable.
 *
 * **Intent:** Proxies are concrete signals that inform Variables.
 * They provide measurable data points for status inference.
 *
 * **Contract:**
 * - Returns: Result<State> with new proxy appended
 * - Validates: variableId exists, proxyId is unique, name is not empty
 * - Pure function: does not mutate input state
 */
export function createProxy(
  state: State,
  params: CreateProxyParams,
): Result<State> {
  // Validate name is not empty
  if (!params.name || params.name.trim().length === 0) {
    return { ok: false, error: "Proxy name cannot be empty" };
  }

  // Validate variableId exists
  const variableCheck = checkVariableExists(state, params.variableId);
  if (!variableCheck.ok) return variableCheck;

  // Check for duplicate proxy ID
  const duplicateCheck = checkNoDuplicateId(
    state.proxies,
    params.proxyId,
    "Proxy",
  );
  if (!duplicateCheck.ok) return duplicateCheck;

  // For categorical proxies, validate categories are provided
  if (params.valueType === "categorical") {
    if (!params.categories || params.categories.length === 0) {
      return {
        ok: false,
        error: "Categorical proxies must have at least one category",
      };
    }
  }

  return { ok: true, value: applyCreateProxy(state, params) };
}

/**
 * Updates an existing proxy.
 *
 * **Intent:** Allow modifying proxy metadata without deleting and recreating.
 *
 * **Contract:**
 * - Returns: Result<State> with updated proxy
 * - Validates: proxyId exists
 * - Only provided fields are updated; others remain unchanged
 * - Pure function: does not mutate input state
 */
export function updateProxy(
  state: State,
  params: UpdateProxyParams,
): Result<State> {
  const proxyIndex = state.proxies.findIndex((p) => p.id === params.proxyId);
  if (proxyIndex === -1) {
    return {
      ok: false,
      error: `Proxy with id '${params.proxyId}' not found`,
    };
  }

  const existingProxy = state.proxies[proxyIndex];
  if (!existingProxy) {
    return {
      ok: false,
      error: `Proxy with id '${params.proxyId}' not found`,
    };
  }

  // Validate name if provided
  if (params.name !== undefined && params.name.trim().length === 0) {
    return { ok: false, error: "Proxy name cannot be empty" };
  }

  const updatedProxy: Proxy = {
    ...existingProxy,
    ...(params.name !== undefined ? { name: params.name.trim() } : {}),
    ...(params.description !== undefined
      ? { description: params.description.trim() }
      : {}),
    ...(params.unit !== undefined ? { unit: params.unit.trim() } : {}),
    ...(params.categories !== undefined
      ? { categories: params.categories }
      : {}),
    ...(params.thresholds !== undefined
      ? { thresholds: params.thresholds }
      : {}),
  };

  const updatedProxies = [...state.proxies];
  updatedProxies[proxyIndex] = updatedProxy;

  return {
    ok: true,
    value: {
      ...state,
      proxies: updatedProxies,
    },
  };
}

/**
 * Deletes a proxy.
 *
 * **Intent:** Remove a proxy that is no longer relevant.
 * Also removes associated readings.
 *
 * **Contract:**
 * - Returns: Result<State> with proxy and its readings removed
 * - Validates: proxyId exists
 * - Pure function: does not mutate input state
 */
export function deleteProxy(
  state: State,
  params: DeleteProxyParams,
): Result<State> {
  const proxyCheck = checkProxyExists(state, params.proxyId);
  if (!proxyCheck.ok) return proxyCheck;

  return { ok: true, value: applyDeleteProxy(state, params.proxyId) };
}

/**
 * Logs a proxy reading.
 *
 * **Intent:** Record a timestamped measurement from a proxy.
 * Readings are stored data for status inference.
 *
 * **Contract:**
 * - Returns: Result<State> with new reading appended
 * - Validates: proxyId exists, readingId is unique, value type matches proxy
 * - Pure function: does not mutate input state
 */
export function logProxyReading(
  state: State,
  params: LogProxyReadingParams,
): Result<State> {
  // Validate proxyId exists
  const proxy = state.proxies.find((p) => p.id === params.proxyId);
  if (!proxy) {
    return { ok: false, error: `Proxy with id '${params.proxyId}' not found` };
  }

  // Check for duplicate reading ID
  const duplicateCheck = checkNoDuplicateId(
    state.proxyReadings,
    params.readingId,
    "Reading",
  );
  if (!duplicateCheck.ok) return duplicateCheck;

  // Validate value type matches proxy type
  if (params.value.type !== proxy.valueType) {
    return {
      ok: false,
      error: `Value type '${params.value.type}' does not match proxy type '${proxy.valueType}'`,
    };
  }

  // For categorical proxies, validate value is in allowed categories
  if (
    params.value.type === "categorical" &&
    proxy.categories &&
    !proxy.categories.includes(params.value.value)
  ) {
    return {
      ok: false,
      error: `Value '${params.value.value}' is not in allowed categories: ${proxy.categories.join(", ")}`,
    };
  }

  return { ok: true, value: applyLogProxyReading(state, params) };
}

// ═══════════════════════════════════════════════════════════════════════════
// MEMBRANE EXCEPTION LOGGING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Logs a Membrane exception when a user bypasses a Normative Model constraint.
 *
 * **Intent:** Provide audit trail for when users proceed despite warnings
 * or override blocks with justification.
 *
 * **Contract:**
 * - Returns: Result<State> with new exception appended
 * - Validates: modelId exists, mutationType and originalDecision are valid
 * - Pure function: does not mutate input state
 */
export function logException(
  state: State,
  params: LogExceptionParams,
): Result<State> {
  // Validate modelId exists
  const modelCheck = checkModelExists(state, params.modelId);
  if (!modelCheck.ok) return modelCheck;

  // Validate exception params
  const paramsCheck = validateExceptionParams(params);
  if (!paramsCheck.ok) return paramsCheck;

  // Check for duplicate exception ID
  const duplicateCheck = checkNoDuplicateId(
    state.exceptions,
    params.exceptionId,
    "Exception",
  );
  if (!duplicateCheck.ok) return duplicateCheck;

  return { ok: true, value: applyLogException(state, params) };
}
