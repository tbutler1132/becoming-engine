/**
 * File Watcher
 *
 * Watches the src/ directory for changes and emits events.
 * Uses chokidar for cross-platform file system watching.
 */

import chokidar from "chokidar";
import { join } from "path";
import { EventEmitter } from "events";

/**
 * Event types emitted by the watcher.
 */
export type WatcherEventType = "change" | "add" | "unlink";

/**
 * Event emitted when a file changes.
 */
export interface WatcherEvent {
  type: WatcherEventType;
  path: string;
  /** Organ or surface ID if the change is within a module */
  moduleId?: string;
  /** Whether this is an organ or surface */
  moduleType?: "organ" | "surface";
}

/**
 * Typed event emitter for file watcher events.
 */
export interface WatcherEmitter {
  on(event: "change", listener: (data: WatcherEvent) => void): this;
  off(event: "change", listener: (data: WatcherEvent) => void): this;
  emit(event: "change", data: WatcherEvent): boolean;
}

/**
 * Creates a file watcher for the src/ directory.
 * Returns an event emitter that fires on file changes.
 */
export function createWatcher(basePath: string): WatcherEmitter {
  const emitter = new EventEmitter() as WatcherEmitter;
  const srcPath = join(basePath, "src");

  const watcher = chokidar.watch(srcPath, {
    ignored: [
      "**/node_modules/**",
      "**/.git/**",
      "**/dist/**",
      "**/*.test.ts",
      "**/*.d.ts",
    ],
    persistent: true,
    ignoreInitial: true,
    // Debounce rapid changes
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  function handleEvent(type: WatcherEventType, filePath: string): void {
    const relativePath = filePath.replace(basePath + "/", "");
    const event = parseFilePath(relativePath, type);
    emitter.emit("change", event);
  }

  watcher.on("change", (path) => handleEvent("change", path));
  watcher.on("add", (path) => handleEvent("add", path));
  watcher.on("unlink", (path) => handleEvent("unlink", path));

  return emitter;
}

/**
 * Parses a file path to extract module information.
 */
function parseFilePath(
  relativePath: string,
  type: WatcherEventType,
): WatcherEvent {
  const event: WatcherEvent = { type, path: relativePath };

  // Check if it's in src/libs/
  const libsMatch = relativePath.match(/^src\/libs\/([^/]+)/);
  if (libsMatch) {
    event.moduleId = libsMatch[1];
    event.moduleType = "organ";
    return event;
  }

  // Check if it's in src/apps/
  const appsMatch = relativePath.match(/^src\/apps\/([^/]+)/);
  if (appsMatch) {
    event.moduleId = appsMatch[1];
    event.moduleType = "surface";
    return event;
  }

  return event;
}
