"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { DEFAULT_PERSONAL_NODE } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import type {
  EpisodeType,
  ModelType,
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
 * Adds an action to an episode.
 */
export async function addAction(
  episodeId: string,
  description: string
): Promise<Result<void>> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();

  const result = regulator.act(state, {
    actionId: crypto.randomUUID(),
    node: DEFAULT_PERSONAL_NODE,
    episodeId,
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
  return okVoid();
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
