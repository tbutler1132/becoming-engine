// Regulator types and constraints
// The Regulator organ enforces cybernetic homeostasis rules

import type { NodeType, EpisodeType } from "../memory/index.js";

// Constraint constants (no magic numbers)
export const MAX_ACTIVE_EXPLORE_PER_NODE = 1;

// Result type for operations that can fail
export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// Parameters for episode operations
export interface OpenEpisodeParams {
  node: NodeType;
  type: EpisodeType;
  objective: string;
}

// Optional variable updates when closing an episode
export interface VariableUpdate {
  id: string;
  status: "Low" | "InRange" | "High";
}

