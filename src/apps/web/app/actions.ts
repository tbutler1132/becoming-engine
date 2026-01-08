"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { DEFAULT_PERSONAL_NODE, getNodeById } from "@libs/memory";
import type { NodeRef } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import type {
  EpisodeType,
  MeasurementCadence,
  ModelScope,
  ModelType,
  NodeType,
  NoteTag,
  Proxy,
  ProxyReading,
  ProxyThresholds,
  ProxyValue,
  ProxyValueType,
  VariableStatus,
  State,
} from "@libs/memory";
import type { Result } from "@libs/shared";
import { createStore } from "@/lib/store";

/**
 * Resolves a node ID to a NodeRef.
 * Maps new node kinds to legacy NodeRef format for backward compatibility.
 */
function resolveNodeRef(state: State, nodeId?: string): NodeRef {
  if (!nodeId) {
    return DEFAULT_PERSONAL_NODE;
  }

  const node = getNodeById(state, nodeId);
  if (!node) {
    return DEFAULT_PERSONAL_NODE;
  }

  // Map tags to legacy type
  if (node.tags?.includes("org")) {
    return { type: "Org", id: node.id };
  }
  return { type: "Personal", id: node.id };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function okVoid(): Result<void> {
  return { ok: true, value: undefined };
}

/**
 * Marks an action as Done.
 */
export async function completeAction(actionId: string): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const result = regulator.completeAction(state, { actionId });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Opens a Stabilize episode linked to a Variable.
 * Returns the new episode ID on success.
 */
export async function openStabilizeEpisode(
  variableId: string,
  objective: string,
  nodeId?: string,
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const episodeType: EpisodeType = "Stabilize";
  const episodeId = crypto.randomUUID();
  const node = resolveNodeRef(state, nodeId);

  const result = regulator.openEpisode(state, {
    episodeId,
    node,
    type: episodeType,
    variableId,
    objective,
    openedAt: new Date().toISOString(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: episodeId };
}

/**
 * Opens an Explore episode (not linked to a specific variable).
 * Returns the new episode ID on success.
 */
export async function openExploreEpisode(
  objective: string,
  nodeId?: string,
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const episodeType: EpisodeType = "Explore";
  const episodeId = crypto.randomUUID();
  const node = resolveNodeRef(state, nodeId);

  const result = regulator.openEpisode(state, {
    episodeId,
    node,
    type: episodeType,
    objective,
    openedAt: new Date().toISOString(),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: episodeId };
}

/**
 * Closes an episode with a closure note.
 * For Explore episodes, a model statement is required.
 */
export async function closeEpisode(
  episodeId: string,
  closureNoteContent: string,
  episodeType: EpisodeType,
  modelStatement?: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const closedAt = new Date().toISOString();

  const modelUpdates =
    episodeType === "Explore" && modelStatement
      ? [
          {
            id: crypto.randomUUID(),
            type: "Descriptive" as ModelType,
            statement: modelStatement,
            confidence: 0.7,
          },
        ]
      : undefined;

  const result = regulator.closeEpisode(state, {
    episodeId,
    closedAt,
    closureNote: {
      id: crypto.randomUUID(),
      content: closureNoteContent,
    },
    modelUpdates,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Updates an existing episode.
 * Only Active episodes can be edited.
 */
export async function updateEpisode(
  episodeId: string,
  objective?: string,
  timeboxDays?: number | null
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.updateEpisode(state, {
    episodeId,
    ...(objective !== undefined ? { objective } : {}),
    ...(timeboxDays !== undefined ? { timeboxDays } : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  revalidatePath(`/episodes/${episodeId}`);
  return okVoid();
}

/**
 * Adds an action, optionally linked to an episode.
 * Returns the new action ID on success.
 */
export async function addAction(
  description: string,
  episodeId?: string
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const actionId = crypto.randomUUID();

  const result = regulator.act(state, {
    actionId,
    node: DEFAULT_PERSONAL_NODE,
    ...(episodeId ? { episodeId } : {}),
    description,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: actionId };
}

/**
 * Signals a new status for a variable.
 */
export async function signalVariable(
  variableId: string,
  status: VariableStatus
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.signal(state, {
    node: DEFAULT_PERSONAL_NODE,
    variableId,
    status,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Input for creating a variable with all fields.
 */
export interface CreateVariableInput {
  name: string;
  nodeType: NodeType;
  nodeId?: string;
  description?: string;
  preferredRange?: string;
  measurementCadence?: MeasurementCadence;
}

/**
 * Creates a new variable.
 * Returns the new variable ID on success.
 */
export async function createVariable(
  input: CreateVariableInput,
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const variableId = crypto.randomUUID();

  // Use nodeId if provided, otherwise fall back to nodeType-based lookup
  const node = input.nodeId
    ? resolveNodeRef(state, input.nodeId)
    : input.nodeType === "Personal"
      ? DEFAULT_PERSONAL_NODE
      : { type: input.nodeType as NodeType, id: input.nodeType.toLowerCase() };

  const result = regulator.createVariable(state, {
    variableId,
    node,
    name: input.name,
    status: "Unknown",
    ...(input.description ? { description: input.description } : {}),
    ...(input.preferredRange ? { preferredRange: input.preferredRange } : {}),
    ...(input.measurementCadence
      ? { measurementCadence: input.measurementCadence }
      : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: variableId };
}

/**
 * Creates a new note.
 * Returns the new note ID on success.
 */
export async function createNote(
  content: string,
  tags?: NoteTag[]
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const noteId = crypto.randomUUID();

  const result = regulator.createNote(state, {
    noteId,
    content,
    createdAt: new Date().toISOString(),
    ...(tags && tags.length > 0 ? { tags } : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: noteId };
}

/**
 * Updates an existing note's content.
 */
export async function updateNote(
  noteId: string,
  content: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.updateNote(state, {
    noteId,
    content,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Adds a tag to an existing note.
 */
export async function addNoteTag(
  noteId: string,
  tag: NoteTag
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.addNoteTag(state, {
    noteId,
    tag,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Removes a tag from an existing note.
 */
export async function removeNoteTag(
  noteId: string,
  tag: NoteTag
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.removeNoteTag(state, {
    noteId,
    tag,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return okVoid();
}

/**
 * Episode option for dropdown display.
 */
export interface EpisodeOption {
  id: string;
  objective: string;
  type: string;
}

/**
 * Gets all active episodes for dropdown selection.
 */
export async function getActiveEpisodes(): Promise<EpisodeOption[]> {
  const store = createStore();
  const state = await store.load();

  return state.episodes
    .filter((e) => e.status === "Active")
    .map((e) => ({
      id: e.id,
      objective: e.objective,
      type: e.type,
    }));
}

/**
 * Variable option for dropdown display.
 */
export interface VariableOption {
  id: string;
  name: string;
}

/**
 * Gets all variables for dropdown selection.
 */
export async function getVariables(): Promise<VariableOption[]> {
  const store = createStore();
  const state = await store.load();

  return state.variables.map((v) => ({
    id: v.id,
    name: v.name,
  }));
}

/**
 * Creates a new model (explicit belief).
 * Returns the new model ID on success.
 */
export async function createModel(
  type: ModelType,
  statement: string,
  confidence?: number,
  scope?: ModelScope
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const modelId = crypto.randomUUID();

  const result = regulator.createModel(state, {
    modelId,
    type,
    statement,
    ...(confidence !== undefined ? { confidence } : {}),
    ...(scope !== undefined ? { scope } : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  return { ok: true, value: modelId };
}

/**
 * Links a note to an object (e.g., a Variable).
 * Enables Zettelkasten-style connections between notes and regulated objects.
 */
export async function linkNoteToObject(
  noteId: string,
  objectId: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.addNoteLinkedObject(state, {
    noteId,
    objectId,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  revalidatePath(`/notes/${noteId}`);
  return okVoid();
}

/**
 * Processes a note by removing inbox tag and adding processed tag.
 * This is the explicit "I've reviewed this" action.
 */
export async function processNote(noteId: string): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  let state = await store.load();

  // Find the note to check current tags
  const note = state.notes.find((n) => n.id === noteId);
  if (!note) {
    return { ok: false, error: `Note with id '${noteId}' not found` };
  }

  // Remove inbox tag if present
  if (note.tags.includes("inbox")) {
    const removeResult = regulator.removeNoteTag(state, {
      noteId,
      tag: "inbox",
    });
    if (!removeResult.ok) {
      return { ok: false, error: removeResult.error };
    }
    state = removeResult.value;
  }

  // Add processed tag if not already present
  if (!note.tags.includes("processed")) {
    const addResult = regulator.addNoteTag(state, {
      noteId,
      tag: "processed",
    });
    if (!addResult.ok) {
      return { ok: false, error: addResult.error };
    }
    state = addResult.value;
  }

  try {
    await store.save(state);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  revalidatePath(`/notes/${noteId}`);
  return okVoid();
}

// ═══════════════════════════════════════════════════════════════════════════
// PROXY OPERATIONS (MP14)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Input for creating a proxy.
 */
export interface CreateProxyInput {
  variableId: string;
  name: string;
  valueType: ProxyValueType;
  description?: string;
  unit?: string;
  categories?: string[];
  thresholds?: ProxyThresholds;
}

/**
 * Creates a new proxy for a Variable.
 * Returns the new proxy ID on success.
 */
export async function createProxy(
  input: CreateProxyInput
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const proxyId = crypto.randomUUID();

  const result = regulator.createProxy(state, {
    proxyId,
    variableId: input.variableId,
    name: input.name,
    valueType: input.valueType,
    ...(input.description ? { description: input.description } : {}),
    ...(input.unit ? { unit: input.unit } : {}),
    ...(input.categories ? { categories: input.categories } : {}),
    ...(input.thresholds ? { thresholds: input.thresholds } : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  revalidatePath(`/variables/${input.variableId}`);
  return { ok: true, value: proxyId };
}

/**
 * Deletes a proxy and its readings.
 */
export async function deleteProxy(proxyId: string): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  // Find the proxy to get variableId for revalidation
  const proxy = state.proxies.find((p) => p.id === proxyId);
  const variableId = proxy?.variableId;

  const result = regulator.deleteProxy(state, { proxyId });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  if (variableId) {
    revalidatePath(`/variables/${variableId}`);
  }
  return okVoid();
}

/**
 * Input for logging a proxy reading.
 */
export interface LogReadingInput {
  proxyId: string;
  value: ProxyValue;
  source?: string;
}

/**
 * Logs a proxy reading.
 * Returns the new reading ID on success.
 */
export async function logProxyReading(
  input: LogReadingInput
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const readingId = crypto.randomUUID();

  // Find the proxy to get variableId for revalidation
  const proxy = state.proxies.find((p) => p.id === input.proxyId);
  const variableId = proxy?.variableId;

  const result = regulator.logProxyReading(state, {
    readingId,
    proxyId: input.proxyId,
    value: input.value,
    recordedAt: new Date().toISOString(),
    ...(input.source ? { source: input.source } : {}),
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  if (variableId) {
    revalidatePath(`/variables/${variableId}`);
  }
  return { ok: true, value: readingId };
}

/**
 * Gets all proxies for a Variable.
 */
export async function getProxiesForVariable(
  variableId: string
): Promise<Proxy[]> {
  const store = createStore();
  const regulator = new Regulator();
  const state = await store.load();

  return regulator.getProxiesForVariable(state, variableId);
}

/**
 * Gets recent readings for a proxy.
 */
export async function getRecentReadings(
  proxyId: string,
  limit?: number
): Promise<ProxyReading[]> {
  const store = createStore();
  const regulator = new Regulator();
  const state = await store.load();

  return regulator.getRecentReadings(state, proxyId, limit);
}

/**
 * Signals a variable status change with a reason (for audit trail).
 */
export async function signalVariableWithReason(
  variableId: string,
  status: VariableStatus,
  reason: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.signal(state, {
    node: DEFAULT_PERSONAL_NODE,
    variableId,
    status,
    reason,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  try {
    await store.save(result.value);
  } catch (error: unknown) {
    return { ok: false, error: getErrorMessage(error) };
  }
  revalidatePath("/");
  revalidatePath(`/variables/${variableId}`);
  return okVoid();
}
