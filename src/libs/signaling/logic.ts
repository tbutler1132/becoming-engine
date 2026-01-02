// Signaling organ — Pure logic functions
// These functions are pure: no I/O, no side effects

import { SIGNAL_EVENT_TYPES } from "./types.js";
import type { CreateSignalEventParams, SignalEvent } from "./types.js";

/**
 * Creates a valid SignalEvent from the provided parameters.
 *
 * **Intent:** Constructs a properly shaped event envelope.
 *
 * **Contract:**
 * - Parameters: CreateSignalEventParams with all required fields
 * - Returns: A valid SignalEvent object
 * - Pure: No side effects
 */
export function createEvent(params: CreateSignalEventParams): SignalEvent {
  return {
    eventId: params.eventId,
    nodeId: params.nodeId,
    type: params.type,
    payload: params.payload,
    timestamp: params.timestamp,
  };
}

/**
 * Type guard that validates an unknown value is a valid SignalEvent.
 *
 * **Intent:** Safely parse and validate event data from external sources.
 *
 * **Contract:**
 * - Parameters: unknown data (e.g., parsed from JSON)
 * - Returns: true if data is a valid SignalEvent, false otherwise
 * - Pure: No side effects
 */
export function isValidEvent(data: unknown): data is SignalEvent {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  const obj = data as Record<string, unknown>;

  // Check required string fields
  if (typeof obj.eventId !== "string" || obj.eventId.length === 0) {
    return false;
  }
  if (typeof obj.nodeId !== "string" || obj.nodeId.length === 0) {
    return false;
  }
  if (typeof obj.timestamp !== "string" || obj.timestamp.length === 0) {
    return false;
  }

  // Check type is a valid signal event type
  if (
    typeof obj.type !== "string" ||
    !SIGNAL_EVENT_TYPES.includes(
      obj.type as (typeof SIGNAL_EVENT_TYPES)[number],
    )
  ) {
    return false;
  }

  // payload can be anything (unknown), so we just check it exists
  if (!("payload" in obj)) {
    return false;
  }

  return true;
}
