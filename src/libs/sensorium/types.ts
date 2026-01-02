// Sensorium type definitions
// Observations are structured outputs from parsing user input

import { OBSERVATION_TYPES } from "../../dna.js";
import type {
  EpisodeType,
  NodeRef,
  NoteTag,
  VariableStatus,
} from "../memory/index.js";

// Re-export DNA constant for consumers
export { OBSERVATION_TYPES } from "../../dna.js";

// Type derivation from DNA constant
export type ObservationType = (typeof OBSERVATION_TYPES)[number];

/**
 * Observation — A structured representation of what Sensorium sensed from input.
 *
 * Observations are ephemeral intermediate values that the CLI interprets
 * into Regulator mutations. They represent user intent, not automation.
 *
 * Per doctrine: "Sensorium never triggers Actions directly" — the CLI does.
 */
export type Observation =
  | VariableProxySignalObservation
  | FreeformNoteObservation
  | EpisodeProposalObservation;

/**
 * Signal about a variable's status (proxy update).
 * Maps to: Regulator.signal()
 */
export interface VariableProxySignalObservation {
  type: "variableProxySignal";
  node: NodeRef;
  variableId: string;
  status: VariableStatus;
}

/**
 * Unstructured input to become a Note.
 * Maps to: Regulator.createNote()
 */
export interface FreeformNoteObservation {
  type: "freeformNote";
  node: NodeRef;
  content: string;
  tags?: NoteTag[];
}

/**
 * Proposal to open an episode.
 * Maps to: Regulator.openEpisode()
 *
 * Note: This is user intent, not automation. The CLI interprets
 * this Observation and calls the Regulator. Sensorium does not
 * open Episodes directly.
 */
export interface EpisodeProposalObservation {
  type: "episodeProposal";
  node: NodeRef;
  episodeType: EpisodeType;
  variableId?: string;
  objective: string;
}

// Re-export Result type from shared
export type { Result } from "../shared/index.js";
