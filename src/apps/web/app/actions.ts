"use server";

import crypto from "crypto";
import path from "path";
import { revalidatePath } from "next/cache";
import { JsonStore, DEFAULT_PERSONAL_NODE } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import type { EpisodeType, ModelType, VariableStatus } from "@libs/memory";
import type { Result } from "@libs/shared";

/**
 * Get the project root path.
 * The web app is at src/apps/web, so we go up 3 levels from cwd.
 * This handles both `npm run dev:web` (from root) and direct runs.
 */
function getProjectRoot(): string {
  // When running via `npm run dev:web`, cwd is src/apps/web
  // When running directly from web folder, cwd is also src/apps/web
  // Either way, we need to go up 3 levels to reach the project root
  const cwd = process.cwd();
  if (cwd.endsWith("src/apps/web") || cwd.includes("/src/apps/web")) {
    return path.resolve(cwd, "../../..");
  }
  // If somehow running from project root, use it directly
  return cwd;
}

const PROJECT_ROOT = getProjectRoot();

/**
 * Create a JsonStore pointing to the project root.
 */
function createStore(): JsonStore {
  return new JsonStore({ basePath: PROJECT_ROOT });
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

function okVoid(): Result<void> {
  return { ok: true, value: undefined };
}

/**
 * Marks an action as Done.
 *
 * **Pattern**: Load → Mutate → Save → Revalidate
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
  objective: string,
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
 * For Explore episodes, a model statement is required (learning must be explicit).
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

  // Build model updates for Explore episodes
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

  //TODO: Goes through Sensorium first?
  
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
 * This is a manual override — eventually proxies will drive this.
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
