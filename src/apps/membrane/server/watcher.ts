// File watcher logic for state and code changes

import chokidar from "chokidar";
import { readFileSync } from "node:fs";
import type { State } from "../../../libs/memory/index.js";
import type { ServerMessage } from "./types.js";
import { pathToOrgan } from "./types.js";

export type WatcherEventHandler = (message: ServerMessage) => void;

export interface WatcherConfig {
  readonly stateFilePath: string;
  readonly sourceGlobs: readonly string[];
  readonly onMessage: WatcherEventHandler;
}

/**
 * Creates and starts file watchers for state and source files.
 * Returns a cleanup function to stop watching.
 */
export function createWatcher(config: WatcherConfig): () => void {
  const { stateFilePath, sourceGlobs, onMessage } = config;

  // Watch state file
  const stateWatcher = chokidar.watch(stateFilePath, {
    persistent: true,
    ignoreInitial: false,
  });

  stateWatcher.on("change", () => {
    try {
      const content = readFileSync(stateFilePath, "utf-8");
      const state = JSON.parse(content) as State;
      onMessage({ type: "state", payload: state });
    } catch {
      // Ignore parse errors (file may be mid-write)
    }
  });

  stateWatcher.on("add", () => {
    try {
      const content = readFileSync(stateFilePath, "utf-8");
      const state = JSON.parse(content) as State;
      onMessage({ type: "state", payload: state });
    } catch {
      // Ignore parse errors
    }
  });

  // Watch source files for code changes
  const sourceWatcher = chokidar.watch([...sourceGlobs], {
    persistent: true,
    ignoreInitial: true,
    ignored: ["**/node_modules/**", "**/.git/**"],
  });

  sourceWatcher.on("change", (filePath: string) => {
    const organ = pathToOrgan(filePath);
    if (organ) {
      onMessage({
        type: "codeChange",
        organ,
        file: filePath,
        timestamp: Date.now(),
      });
    }
  });

  // Return cleanup function
  return (): void => {
    void stateWatcher.close();
    void sourceWatcher.close();
  };
}
