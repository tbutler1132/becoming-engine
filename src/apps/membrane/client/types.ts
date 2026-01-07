/**
 * Membrane Client Types
 *
 * Types for the browser-side visualization.
 */

import type { DiscoveryResult, Organ, Surface } from "../server/types.js";
import type { WatcherEvent } from "../server/watcher.js";

// Re-export server types for convenience
export type { DiscoveryResult, Organ, Surface, WatcherEvent };

/**
 * Messages received from the WebSocket server.
 */
export type ServerMessage =
  | { type: "discovery"; data: DiscoveryResult }
  | { type: "change"; event: WatcherEvent }
  | { type: "error"; message: string };

/**
 * Connection status.
 */
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

/**
 * Visual state of an organ node.
 */
export interface OrganNode {
  organ: Organ;
  x: number;
  y: number;
  radius: number;
  /** Animation phase offset for breathing */
  phase: number;
  /** Current pulse intensity (0-1) for change highlighting */
  pulse: number;
}

/**
 * Visual state of a surface node.
 */
export interface SurfaceNode {
  surface: Surface;
  x: number;
  y: number;
  width: number;
  height: number;
  phase: number;
  pulse: number;
}

/**
 * Complete client state.
 */
export interface ClientState {
  status: ConnectionStatus;
  discovery: DiscoveryResult | null;
  organs: OrganNode[];
  surfaces: SurfaceNode[];
  /** Timestamp for animation */
  time: number;
  /** Canvas dimensions */
  width: number;
  height: number;
}
