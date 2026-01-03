"use server";

import crypto from "crypto";
import path from "path";
import { revalidatePath } from "next/cache";
import { JsonStore, DEFAULT_PERSONAL_NODE } from "@libs/memory";
import { Regulator } from "@libs/regulator";
import type { EpisodeType, ModelType } from "@libs/memory";

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

/**
 * Marks an action as Done.
 *
 * **Pattern**: Load → Mutate → Save → Revalidate
 */
export async function completeAction(actionId: string): Promise<void> {
  const store = createStore();
  const regulator = new Regulator();

  const state = await store.load();
  const result = regulator.completeAction(state, { actionId });

  if (!result.ok) {
    throw new Error(result.error);
  }

  await store.save(result.value);
  revalidatePath("/");
}

/**
 * Opens a Stabilize episode linked to a Variable.
 */
export async function openStabilizeEpisode(
  variableId: string,
  objective: string
): Promise<void> {
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
    throw new Error(result.error);
  }

  await store.save(result.value);
  revalidatePath("/");
}

/**
 * Opens an Explore episode (not linked to a specific variable).
 */
export async function openExploreEpisode(objective: string): Promise<void> {
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
    throw new Error(result.error);
  }

  await store.save(result.value);
  revalidatePath("/");
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
): Promise<void> {
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
    throw new Error(result.error);
  }

  await store.save(result.value);
  revalidatePath("/");
}
