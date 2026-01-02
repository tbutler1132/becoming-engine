// Pure logic functions for the Regulator organ
// All functions are pure: (State, Input) => Result | NewState

import {
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
} from "../memory/index.js";
import type {
  Action,
  State,
  Variable,
  Episode,
  NodeRef,
  VariableStatus,
} from "../memory/index.js";
import type {
  CloseEpisodeParams,
  ClosureNote,
  CreateActionParams,
  CreateModelParams,
  Result,
  OpenEpisodeParams,
  SignalParams,
  UpdateModelParams,
} from "./types.js";
import type { RegulatorPolicyForNode } from "./policy.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";
import {
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
} from "../memory/index.js";
import type { Model } from "../memory/index.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const EXPLORE_TYPE = EPISODE_TYPES[1];
const ACTION_PENDING_STATUS = ACTION_STATUSES[0];

type CanCreateActionParams = Pick<CreateActionParams, "node" | "episodeId">;

function nodeRefEquals(a: NodeRef, b: NodeRef): boolean {
  return a.type === b.type && a.id === b.id;
}

function formatNodeRef(node: NodeRef): string {
  return `${node.type}:${node.id}`;
}

/**
 * Filters variables by node type.
 */
export function getVariablesByNode(state: State, node: NodeRef): Variable[] {
  return state.variables.filter(
    (v) => v.node.type === node.type && v.node.id === node.id,
  );
}

/**
 * Filters active episodes by node type.
 */
export function getActiveEpisodesByNode(
  state: State,
  node: NodeRef,
): Episode[] {
  return state.episodes.filter(
    (e) =>
      e.node.type === node.type &&
      e.node.id === node.id &&
      e.status === ACTIVE_STATUS,
  );
}

export function isBaseline(state: State, node: NodeRef): boolean {
  return getActiveEpisodesByNode(state, node).length === 0;
}

/**
 * Counts active Explore episodes for a node.
 */
export function countActiveExplores(state: State, node: NodeRef): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === EXPLORE_TYPE,
  ).length;
}

export function countActiveStabilizesForVariable(
  state: State,
  node: NodeRef,
  variableId: string,
): number {
  return getActiveEpisodesByNode(state, node).filter(
    (e) => e.type === STABILIZE_TYPE && e.variableId === variableId,
  ).length;
}

/**
 * Validates whether a new Explore episode can be started for a node.
 * Enforces MAX_ACTIVE_EXPLORE_PER_NODE constraint.
 */
export function canStartExplore(
  state: State,
  node: NodeRef,
  policy?: RegulatorPolicyForNode,
): Result<void> {
  const activeExplores = countActiveExplores(state, node);
  const maxAllowed =
    policy?.maxActiveExplorePerNode ?? MAX_ACTIVE_EXPLORE_PER_NODE;
  if (activeExplores >= maxAllowed) {
    return {
      ok: false,
      error: `Cannot start Explore: node '${formatNodeRef(node)}' already has ${activeExplores} active Explore episode(s). Max allowed: ${maxAllowed}`,
    };
  }
  return { ok: true, value: undefined };
}

/**
 * Validates whether an action can be created for a node.
 * Actions may exist without an Episode. If an Episode is referenced, it must be valid and active.
 */
export function canCreateAction(
  state: State,
  params: CanCreateActionParams,
): Result<void> {
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

  const updatedVariables = state.variables.map((v) =>
    v.id === params.variableId ? { ...v, status: params.status } : v,
  );

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
  const canActResult = canCreateAction(state, {
    node: params.node,
    ...(params.episodeId ? { episodeId: params.episodeId } : {}),
  });
  if (!canActResult.ok) {
    return canActResult;
  }

  if (!params.description || params.description.trim().length === 0) {
    return { ok: false, error: "Action description cannot be empty" };
  }

  const action: Action = {
    id: params.actionId,
    description: params.description,
    status: ACTION_PENDING_STATUS,
    ...(params.episodeId ? { episodeId: params.episodeId } : {}),
  };

  return {
    ok: true,
    value: {
      ...state,
      actions: [...state.actions, action],
    },
  };
}

/**
 * Validates episode creation parameters.
 */
export function validateEpisodeParams(params: OpenEpisodeParams): Result<void> {
  if (params.type === STABILIZE_TYPE) {
    if (!params.variableId || params.variableId.trim().length === 0) {
      return { ok: false, error: "Stabilize episodes require variableId" };
    }
  }
  if (!params.objective || params.objective.trim().length === 0) {
    return { ok: false, error: "Episode objective cannot be empty" };
  }
  return { ok: true, value: undefined };
}

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
  const paramsValidation = validateEpisodeParams(params);
  if (!paramsValidation.ok) {
    return paramsValidation;
  }

  // Check Explore constraint if applicable
  if (params.type === EXPLORE_TYPE) {
    const exploreValidation = canStartExplore(state, params.node, policy);
    if (!exploreValidation.ok) {
      return exploreValidation;
    }
  }

  // Check Stabilize per-variable constraint if applicable
  if (params.type === STABILIZE_TYPE) {
    const variableId = params.variableId;
    const activeStabilizes = countActiveStabilizesForVariable(
      state,
      params.node,
      variableId,
    );
    const maxAllowed = policy?.maxActiveStabilizePerVariable ?? 1;
    if (activeStabilizes >= maxAllowed) {
      return {
        ok: false,
        error: `Cannot start Stabilize: node '${formatNodeRef(params.node)}' already has ${activeStabilizes} active Stabilize episode(s) for variable '${variableId}'. Max allowed: ${maxAllowed}`,
      };
    }
  }

  // Create new episode
  const newEpisode: Episode = {
    id: params.episodeId,
    node: params.node,
    type: params.type,
    ...(params.type === STABILIZE_TYPE
      ? { variableId: params.variableId }
      : {}),
    objective: params.objective,
    status: ACTIVE_STATUS,
    openedAt: params.openedAt,
  };

  // Return new state with episode added
  return {
    ok: true,
    value: {
      ...state,
      episodes: [...state.episodes, newEpisode],
    },
  };
}

/**
 * Validates closure note content.
 */
export function validateClosureNote(note: ClosureNote): Result<void> {
  if (!note.content || note.content.trim().length === 0) {
    return { ok: false, error: "Closure note content cannot be empty" };
  }
  return { ok: true, value: undefined };
}

/**
 * Closes an episode and creates a closure note.
 * Returns a new State with the episode closed, timestamps set, note created, variables updated, and models created/updated.
 * Pure function: does not mutate input state.
 */
export function closeEpisode(
  state: State,
  params: CloseEpisodeParams,
): Result<State> {
  const { episodeId, closedAt, closureNote, variableUpdates, modelUpdates } =
    params;

  // Validate closure note
  const noteValidation = validateClosureNote(closureNote);
  if (!noteValidation.ok) {
    return noteValidation;
  }

  // Find the episode
  const episode = state.episodes.find((e) => e.id === episodeId);
  if (!episode) {
    return { ok: false, error: `Episode with id '${episodeId}' not found` };
  }

  if (episode.status === CLOSED_STATUS) {
    return { ok: false, error: `Episode '${episodeId}' is already closed` };
  }

  // Create the closure note
  const newNote = {
    id: closureNote.id,
    content: closureNote.content,
  };

  // Close the episode with timestamp and closureNoteId
  const updatedEpisodes = state.episodes.map((e) =>
    e.id === episodeId
      ? {
          ...e,
          status: CLOSED_STATUS,
          closedAt,
          closureNoteId: closureNote.id,
        }
      : e,
  );

  // Update variables if provided
  let updatedVariables = state.variables;
  if (variableUpdates && variableUpdates.length > 0) {
    updatedVariables = state.variables.map((v) => {
      const update = variableUpdates.find((u) => u.id === v.id);
      return update ? { ...v, status: update.status as VariableStatus } : v;
    });
  }

  // Create or update models if provided
  let updatedModels = state.models;
  if (modelUpdates && modelUpdates.length > 0) {
    const existingModelIds = new Set(state.models.map((m) => m.id));
    const newModels: Model[] = [];

    for (const update of modelUpdates) {
      if (existingModelIds.has(update.id)) {
        // Update existing model
        updatedModels = updatedModels.map((m) =>
          m.id === update.id
            ? {
                ...m,
                statement: update.statement,
                ...(update.confidence !== undefined
                  ? { confidence: update.confidence }
                  : {}),
                ...(update.scope !== undefined ? { scope: update.scope } : {}),
                ...(update.enforcement !== undefined
                  ? { enforcement: update.enforcement }
                  : {}),
              }
            : m,
        );
      } else {
        // Create new model
        const newModel: Model = {
          id: update.id,
          type: update.type,
          statement: update.statement,
          ...(update.confidence !== undefined
            ? { confidence: update.confidence }
            : {}),
          ...(update.scope !== undefined ? { scope: update.scope } : {}),
          ...(update.enforcement !== undefined
            ? { enforcement: update.enforcement }
            : {}),
        };
        newModels.push(newModel);
      }
    }
    updatedModels = [...updatedModels, ...newModels];
  }

  return {
    ok: true,
    value: {
      ...state,
      episodes: updatedEpisodes,
      variables: updatedVariables,
      notes: [...state.notes, newNote],
      models: updatedModels,
    },
  };
}

/**
 * Validates model creation parameters.
 */
function validateModelParams(params: CreateModelParams): Result<void> {
  if (!params.statement || params.statement.trim().length === 0) {
    return { ok: false, error: "Model statement cannot be empty" };
  }
  if (!(MODEL_TYPES as readonly string[]).includes(params.type)) {
    return { ok: false, error: `Invalid model type: ${params.type}` };
  }
  if (params.confidence !== undefined) {
    if (params.confidence < 0 || params.confidence > 1) {
      return {
        ok: false,
        error: "Model confidence must be between 0.0 and 1.0",
      };
    }
  }
  if (
    params.scope !== undefined &&
    !(MODEL_SCOPES as readonly string[]).includes(params.scope)
  ) {
    return { ok: false, error: `Invalid model scope: ${params.scope}` };
  }
  if (
    params.enforcement !== undefined &&
    !(ENFORCEMENT_LEVELS as readonly string[]).includes(params.enforcement)
  ) {
    return {
      ok: false,
      error: `Invalid enforcement level: ${params.enforcement}`,
    };
  }
  return { ok: true, value: undefined };
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
  if (!validation.ok) {
    return validation;
  }

  // Check for duplicate ID
  if (state.models.some((m) => m.id === params.modelId)) {
    return {
      ok: false,
      error: `Model with id '${params.modelId}' already exists`,
    };
  }

  const newModel: Model = {
    id: params.modelId,
    type: params.type,
    statement: params.statement,
    ...(params.confidence !== undefined
      ? { confidence: params.confidence }
      : {}),
    ...(params.scope !== undefined ? { scope: params.scope } : {}),
    ...(params.enforcement !== undefined
      ? { enforcement: params.enforcement }
      : {}),
  };

  return {
    ok: true,
    value: {
      ...state,
      models: [...state.models, newModel],
    },
  };
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
  const model = state.models.find((m) => m.id === params.modelId);
  if (!model) {
    return { ok: false, error: `Model with id '${params.modelId}' not found` };
  }

  // Validate updates
  if (params.statement !== undefined && params.statement.trim().length === 0) {
    return { ok: false, error: "Model statement cannot be empty" };
  }
  if (params.confidence !== undefined) {
    if (params.confidence < 0 || params.confidence > 1) {
      return {
        ok: false,
        error: "Model confidence must be between 0.0 and 1.0",
      };
    }
  }
  if (
    params.scope !== undefined &&
    !(MODEL_SCOPES as readonly string[]).includes(params.scope)
  ) {
    return { ok: false, error: `Invalid model scope: ${params.scope}` };
  }
  if (
    params.enforcement !== undefined &&
    !(ENFORCEMENT_LEVELS as readonly string[]).includes(params.enforcement)
  ) {
    return {
      ok: false,
      error: `Invalid enforcement level: ${params.enforcement}`,
    };
  }

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
