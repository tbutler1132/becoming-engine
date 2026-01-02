// Signaling organ — Internal file system operations
// Handles append-only event log I/O with idempotency

import fs from "fs-extra";
import * as path from "node:path";
import { open as openFile } from "node:fs/promises";
import type { SignalEvent } from "../types.js";
import { isValidEvent } from "../logic.js";

const DATA_DIR = "data";
const EVENTS_FILE = "events.jsonl";

/**
 * Gets the path to the events log file.
 */
export function getEventsFilePath(basePath: string): string {
  return path.join(basePath, DATA_DIR, EVENTS_FILE);
}

/**
 * Gets the path to the lock file for the events log.
 */
export function getLockFilePath(basePath: string): string {
  return path.join(basePath, DATA_DIR, `${EVENTS_FILE}.lock`);
}

/**
 * Acquires an exclusive lock on the events file.
 * Returns a release function to call when done.
 */
export async function acquireLock(
  lockPath: string,
): Promise<() => Promise<void>> {
  await fs.ensureDir(path.dirname(lockPath));

  const handle = await openFile(lockPath, "wx");
  try {
    await handle.writeFile(
      JSON.stringify({
        pid: process.pid,
        createdAt: new Date().toISOString(),
      }),
    );
  } finally {
    await handle.close();
  }

  return async (): Promise<void> => {
    try {
      await fs.remove(lockPath);
    } catch {
      // best-effort cleanup
    }
  };
}

/**
 * Appends a single event to the log file.
 * Does NOT check for duplicates — caller is responsible for idempotency.
 */
export async function appendEvent(
  filePath: string,
  event: SignalEvent,
): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  const line = JSON.stringify(event) + "\n";
  await fs.appendFile(filePath, line, "utf-8");
}

/**
 * Reads all events from the log file.
 * Returns empty array if file doesn't exist.
 * Skips malformed lines (logs nothing — baseline is quiet).
 */
export async function readAllEvents(filePath: string): Promise<SignalEvent[]> {
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    return [];
  }

  const content = await fs.readFile(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim().length > 0);

  const events: SignalEvent[] = [];
  for (const line of lines) {
    try {
      const parsed: unknown = JSON.parse(line);
      if (isValidEvent(parsed)) {
        events.push(parsed);
      }
      // Invalid events are silently skipped (baseline is quiet)
    } catch {
      // Malformed JSON lines are silently skipped
    }
  }

  return events;
}

/**
 * Builds a Set of all eventIds from the log file.
 * Used for idempotency checks.
 */
export async function loadEventIdIndex(filePath: string): Promise<Set<string>> {
  const events = await readAllEvents(filePath);
  return new Set(events.map((e) => e.eventId));
}
