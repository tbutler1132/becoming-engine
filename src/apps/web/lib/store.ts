import path from "path";
import { JsonStore } from "@libs/memory";

/**
 * Get the project root path.
 * The web app runs from src/apps/web, so we go up 3 levels.
 */
function getProjectRoot(): string {
  const cwd = process.cwd();
  if (cwd.endsWith("src/apps/web") || cwd.includes("/src/apps/web")) {
    return path.resolve(cwd, "../../..");
  }
  return cwd;
}

/**
 * Create a JsonStore pointing to the project data directory.
 */
export function createStore(): JsonStore {
  return new JsonStore({ basePath: getProjectRoot() });
}

