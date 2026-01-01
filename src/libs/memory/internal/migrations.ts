import type { State } from "../types.js";
import { EPISODE_STATUSES, SCHEMA_VERSION } from "../types.js";
import type {
  LegacyStateV0,
  LegacyStateV1,
  StateV2,
  StateV3,
} from "./validation.js";
import { nodeRefFromLegacy } from "./validation.js";

const CLOSED_STATUS = EPISODE_STATUSES[1];

/** Placeholder timestamp for legacy episodes that lack openedAt */
const LEGACY_EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z" as const;

export function migrateLegacyToV2(state: LegacyStateV0 | LegacyStateV1): State {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: state.variables.map((v) => ({
      ...v,
      node: nodeRefFromLegacy(v.node),
    })),
    episodes: state.episodes.map((e) => ({
      ...e,
      node: nodeRefFromLegacy(e.node),
      openedAt: LEGACY_EPOCH_TIMESTAMP,
      ...(e.status === CLOSED_STATUS
        ? { closedAt: LEGACY_EPOCH_TIMESTAMP }
        : {}),
    })),
    actions: state.actions,
    notes: state.notes,
  };
}

export function migrateV2ToV3(v2: StateV2): StateV3 {
  return {
    ...v2,
    schemaVersion: 3,
  };
}

/**
 * Migrates v3 state to v4 by adding timestamp fields to episodes.
 * - openedAt is set to epoch placeholder for existing episodes
 * - closedAt is set to epoch placeholder for closed episodes
 */
export function migrateV3ToV4(v3: StateV3): State {
  return {
    ...v3,
    schemaVersion: SCHEMA_VERSION,
    episodes: v3.episodes.map((e) => ({
      ...e,
      openedAt: LEGACY_EPOCH_TIMESTAMP,
      ...(e.status === CLOSED_STATUS
        ? { closedAt: LEGACY_EPOCH_TIMESTAMP }
        : {}),
    })),
  };
}
