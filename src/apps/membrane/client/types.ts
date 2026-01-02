// Client-side types for the membrane visualization

import type { Variable, Episode, NodeRef } from "../../../libs/memory/index.js";

export const VIEW_LEVELS = [
  "organism",
  "organs",
  "files",
  "codeGraph",
] as const;
export type ViewLevel = (typeof VIEW_LEVELS)[number];

export interface NodeState {
  readonly node: NodeRef;
  readonly variables: readonly Variable[];
  readonly activeEpisodes: readonly Episode[];
  readonly isBaseline: boolean;
}

export interface OrganPulse {
  readonly organId: string;
  readonly timestamp: number;
  readonly intensity: number;
}

export interface ClientState {
  readonly connected: boolean;
  readonly personalNode: NodeState | null;
  readonly orgNode: NodeState | null;
  readonly organPulses: readonly OrganPulse[];
  readonly viewLevel: ViewLevel;
  readonly focusedOrgan: string | null;
}

export const INITIAL_CLIENT_STATE: ClientState = {
  connected: false,
  personalNode: null,
  orgNode: null,
  organPulses: [],
  viewLevel: "organism",
  focusedOrgan: null,
} as const;
