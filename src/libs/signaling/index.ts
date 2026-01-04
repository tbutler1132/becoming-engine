/**
 * Signaling Organ — Inter-Node Communication
 *
 * The Signaling organ provides an append-only event log for federation.
 * Nodes emit signals and consume signals from others without sharing
 * internal state.
 *
 * @example
 * ```typescript
 * import { EventLog, createEvent } from '@libs/signaling';
 *
 * const log = new EventLog({ basePath: process.cwd() });
 * const event = createEvent({
 *   eventId: 'evt-1',
 *   nodeId: 'Personal:personal',
 *   type: 'intent',
 *   payload: { action: 'start' },
 *   timestamp: new Date().toISOString(),
 * });
 * await log.emit(event);
 * ```
 *
 * @module Signaling
 */
export * from "./types.js";
export * from "./logic.js";
export * from "./store.js";
