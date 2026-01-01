import type { State } from "../types.js";
import { SCHEMA_VERSION } from "../types.js";
import type { LegacyStateV0, LegacyStateV1, StateV2 } from "./validation.js";
import { nodeRefFromLegacy } from "./validation.js";

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
    })),
    actions: state.actions,
    notes: state.notes,
  };
}

export function migrateV2ToV3(v2: StateV2): State {
  return {
    ...v2,
    schemaVersion: SCHEMA_VERSION,
  };
}
