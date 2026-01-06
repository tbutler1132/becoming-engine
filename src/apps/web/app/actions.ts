"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { DEFAULT_PERSONAL_NODE } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import type {
  EpisodeType,
  MeasurementCadence,
  ModelType,
  NodeType,
  NoteTag,
  VariableStatus,
} from "@libs/memory";
import type { Result } from "@libs/shared";
import { createStore } from "@/lib/store";

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
 */
export async function openStabilizeEpisode(
  variableId: string,
  objective: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const episodeType: EpisodeType = "Stabilize";

  const result = regulator.openEpisode(state, {
    episodeId: crypto.randomUUID(),
    node: DEFAULT_PERSONAL_NODE,
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
  return okVoid();
}

/**
 * Opens an Explore episode (not linked to a specific variable).
 */
export async function openExploreEpisode(
  objective: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const episodeType: EpisodeType = "Explore";

  const result = regulator.openEpisode(state, {
    episodeId: crypto.randomUUID(),
    node: DEFAULT_PERSONAL_NODE,
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
  return okVoid();
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
  description?: string;
  preferredRange?: string;
  measurementCadence?: MeasurementCadence;
}

/**
 * Creates a new variable.
 * Returns the new variable ID on success.
 */
export async function createVariable(
  input: CreateVariableInput
): Promise<Result<string>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const variableId = crypto.randomUUID();

  // Build node reference based on nodeType
  const node =
    input.nodeType === "Personal"
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
