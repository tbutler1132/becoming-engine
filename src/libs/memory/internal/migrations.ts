import type { State, Node } from "../types.js";
import {
  EPISODE_STATUSES,
  SCHEMA_VERSION,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
  ENGINE_NODE_ID,
} from "../types.js";
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
  StateV10,
  StateV11,
  StateV12,
} from "./validation.js";
import {
  nodeRefFromLegacy,
  isValidLegacyStateV0,
  isValidLegacyStateV1,
  isValidLegacyStateV2,
  isValidLegacyStateV3,
  isValidLegacyStateV4,
  isValidLegacyStateV5,
  isValidLegacyStateV6,
  isValidLegacyStateV7,
  isValidLegacyStateV8,
  isValidLegacyStateV9,
  isValidLegacyStateV10,
  isValidLegacyStateV11,
  isValidLegacyStateV12,
  isValidState,
} from "./validation.js";

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
export function migrateV9ToV10(v9: StateV9): StateV10 {
  return {
    ...v9,
    schemaVersion: 10 as const,
  };
}

/**
 * Migrates v10 state to v11 by adding empty proxies and proxyReadings arrays.
 */
export function migrateV10ToV11(v10: StateV10): StateV11 {
  return {
    ...v10,
    schemaVersion: 11 as const,
    proxies: [],
    proxyReadings: [],
  };
}

/**
 * Migrates v11 state to v12 by adding an empty nodes array.
 * This was the initial introduction of the Recursive Node Architecture (ADR 0006).
 */
export function migrateV11ToV12(v11: StateV11): StateV12 {
  return {
    ...v11,
    schemaVersion: 12,
    nodes: [],
  };
}

/**
 * Default nodes created during migration to v13.
 * These bootstrap the Recursive Node Architecture with the canonical nodes.
 */
function createDefaultNodes(existingNodes: Node[]): Node[] {
  const timestamp = new Date().toISOString();
  const result: Node[] = [...existingNodes];

  // Add Personal node if it doesn't exist
  if (!existingNodes.some((n) => n.id === DEFAULT_PERSONAL_NODE_ID)) {
    result.push({
      id: DEFAULT_PERSONAL_NODE_ID,
      kind: "agent",
      name: "Personal",
      description: "Your personal regulatory node",
      tags: ["personal", "default"],
      createdAt: timestamp,
    });
  }

  // Add Org node if it doesn't exist
  if (!existingNodes.some((n) => n.id === DEFAULT_ORG_NODE_ID)) {
    result.push({
      id: DEFAULT_ORG_NODE_ID,
      kind: "agent",
      name: "Organization",
      description: "Organizational or shared regulatory context",
      tags: ["org", "default"],
      createdAt: timestamp,
    });
  }

  // Add Engine node if it doesn't exist
  if (!existingNodes.some((n) => n.id === ENGINE_NODE_ID)) {
    result.push({
      id: ENGINE_NODE_ID,
      kind: "system",
      name: "Becoming Engine",
      description: "The regulatory system itself, eating its own dogfood",
      tags: ["meta", "infrastructure", "dogfood"],
      createdAt: timestamp,
    });
  }

  return result;
}

/**
 * Migrates v12 state to v13 by ensuring default nodes exist.
 * V12 introduced nodes but may have empty array from early migration.
 * V13 ensures Personal, Org, and Engine nodes are always present.
 */
export function migrateV12ToV13(v12: StateV12): State {
  return {
    ...v12,
    schemaVersion: SCHEMA_VERSION,
    nodes: createDefaultNodes(v12.nodes),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MIGRATION PIPELINE — Single entry point for all migrations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Result of attempting to detect and migrate state.
 * - 'current': State is already at the current schema version
 * - 'migrated': State was successfully migrated from an older version
 * - 'invalid': State could not be recognized as any valid schema version
 */
export type MigrationResult =
  | { status: "current"; state: State }
  | { status: "migrated"; state: State; fromVersion: number }
  | { status: "invalid" };

/**
 * Detects the schema version of the given data and migrates it to the current version.
 *
 * This is the single entry point for loading state from disk. It handles:
 * - Current version (returns as-is)
 * - All legacy versions (migrates through the chain)
 * - Invalid data (returns 'invalid' status)
 *
 * **Intent:** Replace nested migration chains with a clean, linear pipeline.
 *
 * **Contract:**
 * - Returns MigrationResult discriminated union
 * - Never throws; invalid data returns { status: 'invalid' }
 * - Migrations are applied in sequence from detected version to current
 */
export function migrateToLatest(data: unknown): MigrationResult {
  // Already current version
  if (isValidState(data)) {
    return { status: "current", state: data };
  }

  // V12 → V13 (adds default nodes if missing)
  if (isValidLegacyStateV12(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(data),
      fromVersion: 12,
    };
  }

  // V11 → V12 → V13
  if (isValidLegacyStateV11(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(migrateV11ToV12(data)),
      fromVersion: 11,
    };
  }

  // V10 → V11 → V12 → V13
  if (isValidLegacyStateV10(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(migrateV11ToV12(migrateV10ToV11(data))),
      fromVersion: 10,
    };
  }

  // V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV9(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(migrateV10ToV11(migrateV9ToV10(data))),
      ),
      fromVersion: 9,
    };
  }

  // V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV8(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(migrateV10ToV11(migrateV9ToV10(migrateV8ToV9(data)))),
      ),
      fromVersion: 8,
    };
  }

  // V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV7(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(migrateV9ToV10(migrateV8ToV9(migrateV7ToV8(data)))),
        ),
      ),
      fromVersion: 7,
    };
  }

  // V6 → V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV6(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(migrateV8ToV9(migrateV7ToV8(migrateV6ToV7(data)))),
          ),
        ),
      ),
      fromVersion: 6,
    };
  }

  // V5 → V6 → V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV5(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(data)))),
            ),
          ),
        ),
      ),
      fromVersion: 5,
    };
  }

  // V4 → V5 → V6 → V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV4(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(
                migrateV7ToV8(
                  migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(data))),
                ),
              ),
            ),
          ),
        ),
      ),
      fromVersion: 4,
    };
  }

  // V3 → V4 → V5 → V6 → V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV3(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(
                migrateV7ToV8(
                  migrateV6ToV7(
                    migrateV5ToV6(migrateV4ToV5(migrateV3ToV4(data))),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      fromVersion: 3,
    };
  }

  // V2 → V3 → V4 → V5 → V6 → V7 → V8 → V9 → V10 → V11 → V12 → V13
  if (isValidLegacyStateV2(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(
                migrateV7ToV8(
                  migrateV6ToV7(
                    migrateV5ToV6(
                      migrateV4ToV5(migrateV3ToV4(migrateV2ToV3(data))),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      fromVersion: 2,
    };
  }

  // V1 (legacy with schemaVersion: 1) → V4 → ... → V13
  if (isValidLegacyStateV1(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(
                migrateV7ToV8(
                  migrateV6ToV7(
                    migrateV5ToV6(migrateV4ToV5(migrateLegacyToV4(data))),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      fromVersion: 1,
    };
  }

  // V0 (legacy without schemaVersion) → V4 → ... → V13
  if (isValidLegacyStateV0(data)) {
    return {
      status: "migrated",
      state: migrateV12ToV13(
        migrateV11ToV12(
          migrateV10ToV11(
            migrateV9ToV10(
              migrateV8ToV9(
                migrateV7ToV8(
                  migrateV6ToV7(
                    migrateV5ToV6(migrateV4ToV5(migrateLegacyToV4(data))),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
      fromVersion: 0,
    };
  }

  // Data doesn't match any known schema
  return { status: "invalid" };
}
