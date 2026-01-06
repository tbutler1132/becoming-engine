import type { State } from "../types.js";
import { EPISODE_STATUSES, SCHEMA_VERSION } from "../types.js";
import type {
  LegacyStateV0,
  LegacyStateV1,
  StateV2,
  StateV3,
  StateV4,
  StateV5,
  StateV6,
  StateV7,
  StateV8,
  StateV9,
} from "./validation.js";
import { nodeRefFromLegacy } from "./validation.js";

const CLOSED_STATUS = EPISODE_STATUSES[1];

/** Placeholder timestamp for legacy episodes that lack openedAt */
const LEGACY_EPOCH_TIMESTAMP = "1970-01-01T00:00:00.000Z" as const;

export function migrateLegacyToV4(
  state: LegacyStateV0 | LegacyStateV1,
): StateV4 {
  return {
    schemaVersion: 4,
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
export function migrateV3ToV4(v3: StateV3): StateV4 {
  return {
    ...v3,
    schemaVersion: 4,
    episodes: v3.episodes.map((e) => ({
      ...e,
      openedAt: LEGACY_EPOCH_TIMESTAMP,
      ...(e.status === CLOSED_STATUS
        ? { closedAt: LEGACY_EPOCH_TIMESTAMP }
        : {}),
    })),
  };
}

/**
 * Migrates v4 state to v5 by adding an empty models array.
 */
export function migrateV4ToV5(v4: StateV4): StateV5 {
  return {
    ...v4,
    schemaVersion: 5,
    models: [],
  };
}

/**
 * Migrates v5 state to v6 by adding createdAt and tags to notes.
 * - createdAt is set to epoch placeholder for existing notes
 * - tags is set to empty array for existing notes
 */
export function migrateV5ToV6(v5: StateV5): StateV6 {
  return {
    ...v5,
    schemaVersion: 6,
    notes: v5.notes.map((n) => ({
      ...n,
      createdAt: LEGACY_EPOCH_TIMESTAMP,
      tags: [],
    })),
  };
}

/**
 * Migrates v6 state to v7 by adding an empty links array.
 */
export function migrateV6ToV7(v6: StateV6): StateV7 {
  return {
    ...v6,
    schemaVersion: 7,
    links: [],
  };
}

/**
 * Migrates v7 state to v8 by adding an empty exceptions array.
 */
export function migrateV7ToV8(v7: StateV7): StateV8 {
  return {
    ...v7,
    schemaVersion: 8 as const,
    exceptions: [],
  };
}

/**
 * Migrates v8 state to v9.
 * This is a no-op migration since timeboxDays is optional.
 * Episodes without timeboxDays remain valid in v9.
 */
export function migrateV8ToV9(v8: StateV8): StateV9 {
  return {
    ...v8,
    schemaVersion: 9 as const,
  };
}

/**
 * Migrates v9 state to v10.
 * This is a no-op migration since new Variable fields are optional.
 * Variables without description/preferredRange/measurementCadence remain valid in v10.
 */
export function migrateV9ToV10(v9: StateV9): State {
  return {
    ...v9,
    schemaVersion: SCHEMA_VERSION,
  };
}
