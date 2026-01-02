// Signaling organ — EventLog store
// Handles event emission and consumption with idempotency

import { silentLogger } from "../shared/index.js";
import type { Logger } from "../shared/index.js";
import type { Result } from "../shared/index.js";
import type { SignalEvent } from "./types.js";
import {
  acquireLock,
  appendEvent,
  getEventsFilePath,
  getLockFilePath,
  loadEventIdIndex,
  readAllEvents,
} from "./internal/fs.js";

// Re-export Logger for API compatibility
export type { Logger } from "../shared/index.js";

/**
 * EventLog manages the append-only event log for inter-node signaling.
 *
 * **Key behaviors:**
 * - Events are appended to `data/events.jsonl`
 * - Idempotent: emitting the same eventId twice is a no-op
 * - Events are read in order of emission
 */
export class EventLog {
  private basePath: string;
  private logger: Logger;
  private eventIdIndex: Set<string> | null = null;

  constructor(options?: { basePath?: string; logger?: Logger }) {
    this.basePath = options?.basePath ?? process.cwd();
    this.logger = options?.logger ?? silentLogger;
  }

  /**
   * Emits an event to the log.
   *
   * **Intent:** Append a new event to the log if it hasn't been emitted before.
   *
   * **Contract:**
   * - Parameters: A valid SignalEvent
   * - Returns: Result<boolean> where:
   *   - ok(true): Event was appended (new event)
   *   - ok(false): Event was already emitted (idempotent no-op)
   *   - error: If file I/O fails
   */
  async emit(event: SignalEvent): Promise<Result<boolean>> {
    const filePath = getEventsFilePath(this.basePath);
    const lockPath = getLockFilePath(this.basePath);

    try {
      // Ensure index is loaded
      if (this.eventIdIndex === null) {
        this.eventIdIndex = await loadEventIdIndex(filePath);
      }

      // Check for duplicate (idempotency)
      if (this.eventIdIndex.has(event.eventId)) {
        return { ok: true, value: false };
      }

      // Acquire lock, append event, update index
      const release = await acquireLock(lockPath);
      try {
        // Re-check after acquiring lock (another process may have added it)
        const freshIndex = await loadEventIdIndex(filePath);
        if (freshIndex.has(event.eventId)) {
          this.eventIdIndex = freshIndex;
          return { ok: true, value: false };
        }

        await appendEvent(filePath, event);
        this.eventIdIndex.add(event.eventId);

        return { ok: true, value: true };
      } finally {
        await release();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error during emit";
      this.logger.error("Failed to emit event", error);
      return { ok: false, error: message };
    }
  }

  /**
   * Consumes events from the log, optionally filtered by a predicate.
   *
   * **Intent:** Read events in order, optionally filtering by criteria.
   *
   * **Contract:**
   * - Parameters: Optional predicate function to filter events
   * - Returns: Array of SignalEvents matching the predicate (or all if none provided)
   */
  async consume(
    predicate?: (event: SignalEvent) => boolean,
  ): Promise<SignalEvent[]> {
    const filePath = getEventsFilePath(this.basePath);

    try {
      const events = await readAllEvents(filePath);

      // Update the in-memory index while we're at it
      this.eventIdIndex = new Set(events.map((e) => e.eventId));

      if (predicate) {
        return events.filter(predicate);
      }
      return events;
    } catch (error) {
      this.logger.error("Failed to consume events", error);
      return [];
    }
  }
}
