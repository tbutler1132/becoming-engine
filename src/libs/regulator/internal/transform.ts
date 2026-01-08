/**
 * Transform Helpers — Pure State Assembly
 *
 * Functions that create new state objects from validated inputs.
 * These assume validation has already passed and focus purely
 * on constructing the new state.
 *
 * @module Regulator/Internal/Transform
 */

import {
  EPISODE_STATUSES,
  EPISODE_TYPES,
  ACTION_STATUSES,
} from "../../memory/index.js";
import type {
  Action,
  Episode,
  Link,
  Model,
  Note,
  Proxy,
  ProxyReading,
  State,
  Variable,
  VariableStatus,
  MembraneException,
  NoteTag,
} from "../../memory/index.js";
import type {
  CreateActionParams,
  CreateLinkParams,
  CreateModelParams,
  CreateNoteParams,
  CreateProxyParams,
  CreateVariableParams,
  LogExceptionParams,
  LogProxyReadingParams,
  ModelUpdate,
  OpenEpisodeParams,
  VariableUpdate,
} from "../types.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
const STABILIZE_TYPE = EPISODE_TYPES[0];
const ACTION_PENDING_STATUS = ACTION_STATUSES[0];
const ACTION_DONE_STATUS = ACTION_STATUSES[1];

const CLOSURE_NOTE_TAG: NoteTag = "closure_note";

// ═══════════════════════════════════════════════════════════════════════════
// VARIABLE TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Applies variable status updates to a list of variables.
 * Pure function: returns new array without mutating input.
 */
export function applyVariableUpdates(
  variables: Variable[],
  updates?: VariableUpdate[],
): Variable[] {
  if (!updates || updates.length === 0) {
    return variables;
  }
  return variables.map((v) => {
    const update = updates.find((u) => u.id === v.id);
    return update ? { ...v, status: update.status as VariableStatus } : v;
  });
}

/**
 * Creates a new variable and appends it to the state.
 */
export function applyCreateVariable(
  state: State,
  params: CreateVariableParams,
): State {
  const newVariable: Variable = {
    id: params.variableId,
    node: params.node,
    name: params.name.trim(),
    status: params.status,
    ...(params.description ? { description: params.description.trim() } : {}),
    ...(params.preferredRange
      ? { preferredRange: params.preferredRange.trim() }
      : {}),
    ...(params.measurementCadence
      ? { measurementCadence: params.measurementCadence }
      : {}),
  };

  return {
    ...state,
    variables: [...state.variables, newVariable],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EPISODE TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new episode and appends it to the state.
 */
export function applyOpenEpisode(
  state: State,
  params: OpenEpisodeParams,
): State {
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

  return {
    ...state,
    episodes: [...state.episodes, newEpisode],
  };
}

/**
 * Closes an episode and creates a closure note.
 */
export function applyCloseEpisode(
  state: State,
  episodeId: string,
  closedAt: string,
  closureNoteId: string,
  closureNoteContent: string,
  variableUpdates?: VariableUpdate[],
  modelUpdates?: ModelUpdate[],
): State {
  // Create the closure note
  const newNote: Note = {
    id: closureNoteId,
    content: closureNoteContent,
    createdAt: closedAt,
    tags: [CLOSURE_NOTE_TAG],
  };

  // Close the episode
  const updatedEpisodes = state.episodes.map((e) =>
    e.id === episodeId
      ? {
          ...e,
          status: CLOSED_STATUS,
          closedAt,
          closureNoteId,
        }
      : e,
  );

  return {
    ...state,
    episodes: updatedEpisodes,
    variables: applyVariableUpdates(state.variables, variableUpdates),
    notes: [...state.notes, newNote],
    models: applyModelUpdates(state.models, modelUpdates),
  };
}

/**
 * Updates an existing episode's fields.
 */
export function applyUpdateEpisode(
  state: State,
  episodeId: string,
  objective?: string,
  timeboxDays?: number | null,
): State {
  const updatedEpisodes = state.episodes.map((e) => {
    if (e.id !== episodeId) {
      return e;
    }

    const updates: Partial<Episode> = {};
    if (objective !== undefined) {
      updates.objective = objective;
    }
    if (timeboxDays !== undefined) {
      if (timeboxDays === null) {
        // Remove timeboxDays by omitting it
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { timeboxDays: _unused, ...rest } = e;
        return {
          ...rest,
          ...updates,
        };
      } else {
        updates.timeboxDays = timeboxDays;
      }
    }

    return {
      ...e,
      ...updates,
    };
  });

  return {
    ...state,
    episodes: updatedEpisodes,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new action and appends it to the state.
 */
export function applyCreateAction(
  state: State,
  params: CreateActionParams,
): State {
  const action: Action = {
    id: params.actionId,
    description: params.description,
    status: ACTION_PENDING_STATUS,
    ...(params.episodeId ? { episodeId: params.episodeId } : {}),
  };

  return {
    ...state,
    actions: [...state.actions, action],
  };
}

/**
 * Completes an action by setting its status to Done.
 */
export function applyCompleteAction(state: State, actionId: string): State {
  const updatedActions = state.actions.map((a) =>
    a.id === actionId ? { ...a, status: ACTION_DONE_STATUS } : a,
  );

  return {
    ...state,
    actions: updatedActions,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MODEL TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Applies model updates (create or update) to a list of models.
 * Pure function: returns new array without mutating input.
 */
export function applyModelUpdates(
  models: Model[],
  updates?: ModelUpdate[],
): Model[] {
  if (!updates || updates.length === 0) {
    return models;
  }

  const existingModelIds = new Set(models.map((m) => m.id));
  let result = models;
  const newModels: Model[] = [];

  for (const update of updates) {
    if (existingModelIds.has(update.id)) {
      // Update existing model
      result = result.map((m) =>
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

  return [...result, ...newModels];
}

/**
 * Creates a new model and appends it to the state.
 */
export function applyCreateModel(
  state: State,
  params: CreateModelParams,
): State {
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
    ...state,
    models: [...state.models, newModel],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTE TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new note and appends it to the state.
 */
export function applyCreateNote(state: State, params: CreateNoteParams): State {
  const newNote: Note = {
    id: params.noteId,
    content: params.content,
    createdAt: params.createdAt,
    tags: params.tags ?? [],
    ...(params.linkedObjects ? { linkedObjects: params.linkedObjects } : {}),
  };

  return {
    ...state,
    notes: [...state.notes, newNote],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// LINK TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new link and appends it to the state.
 */
export function applyCreateLink(state: State, params: CreateLinkParams): State {
  const newLink: Link = {
    id: params.linkId,
    sourceId: params.sourceId,
    targetId: params.targetId,
    relation: params.relation,
    ...(params.weight !== undefined ? { weight: params.weight } : {}),
  };

  return {
    ...state,
    links: [...state.links, newLink],
  };
}

/**
 * Deletes a link from the state.
 */
export function applyDeleteLink(state: State, linkId: string): State {
  return {
    ...state,
    links: state.links.filter((l) => l.id !== linkId),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROXY TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates a new proxy and appends it to the state.
 */
export function applyCreateProxy(
  state: State,
  params: CreateProxyParams,
): State {
  const newProxy: Proxy = {
    id: params.proxyId,
    variableId: params.variableId,
    name: params.name.trim(),
    valueType: params.valueType,
    ...(params.description ? { description: params.description.trim() } : {}),
    ...(params.unit ? { unit: params.unit.trim() } : {}),
    ...(params.categories ? { categories: params.categories } : {}),
    ...(params.thresholds ? { thresholds: params.thresholds } : {}),
  };

  return {
    ...state,
    proxies: [...state.proxies, newProxy],
  };
}

/**
 * Deletes a proxy and its readings from the state.
 */
export function applyDeleteProxy(state: State, proxyId: string): State {
  return {
    ...state,
    proxies: state.proxies.filter((p) => p.id !== proxyId),
    proxyReadings: state.proxyReadings.filter((r) => r.proxyId !== proxyId),
  };
}

/**
 * Logs a new proxy reading.
 */
export function applyLogProxyReading(
  state: State,
  params: LogProxyReadingParams,
): State {
  const newReading: ProxyReading = {
    id: params.readingId,
    proxyId: params.proxyId,
    value: params.value,
    recordedAt: params.recordedAt,
    ...(params.source ? { source: params.source } : {}),
  };

  return {
    ...state,
    proxyReadings: [...state.proxyReadings, newReading],
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXCEPTION TRANSFORMS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Logs a new membrane exception.
 */
export function applyLogException(
  state: State,
  params: LogExceptionParams,
): State {
  const newException: MembraneException = {
    id: params.exceptionId,
    modelId: params.modelId,
    originalDecision: params.originalDecision,
    justification: params.justification,
    mutationType: params.mutationType,
    mutationId: params.mutationId,
    createdAt: params.createdAt,
  };

  return {
    ...state,
    exceptions: [...state.exceptions, newException],
  };
}
