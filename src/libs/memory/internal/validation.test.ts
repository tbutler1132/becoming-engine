/**
 * Validation Module Tests
 *
 * Tests the trust boundary between external data and the system ontology.
 * These validators prevent corrupted or malformed state from entering the system.
 */

import { describe, it, expect } from "vitest";
import {
  isValidState,
  isValidLegacyStateV3,
  isValidLegacyStateV2,
  isValidLegacyStateV1,
  isValidLegacyStateV0,
  isValidLegacyStateV4,
  isValidLegacyStateV6,
  isValidLegacyStateV8,
  isValidLegacyStateV9,
  nodeRefFromLegacy,
} from "./validation.js";
import {
  migrateV4ToV5,
  migrateV5ToV6,
  migrateV6ToV7,
  migrateV7ToV8,
  migrateV8ToV9,
  migrateV9ToV10,
  migrateV10ToV11,
} from "./migrations.js";
import { validateProxy, validateProxyReading } from "./validators.js";
import {
  SCHEMA_VERSION,
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  VARIABLE_STATUSES,
  MEASUREMENT_CADENCES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  LINK_RELATIONS,
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
} from "../types.js";

// ============================================================================
// Factory Functions for Valid States
// ============================================================================

function createValidStateV7(): unknown {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: [
      {
        id: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
        openedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1",
      },
    ],
    notes: [
      {
        id: "n1",
        content: "Test note",
        createdAt: "2025-01-01T00:00:00.000Z",
        tags: [],
      },
    ],
    models: [],
    links: [],
    exceptions: [],
    proxies: [],
    proxyReadings: [],
  };
}

function createMinimalValidStateV7(): unknown {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: [],
    episodes: [],
    actions: [],
    notes: [],
    models: [],
    links: [],
    exceptions: [],
    proxies: [],
    proxyReadings: [],
  };
}

function createValidStateV4(): unknown {
  return {
    schemaVersion: 4,
    variables: [
      {
        id: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
        openedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1",
      },
    ],
    notes: [
      {
        id: "n1",
        content: "Test note",
      },
    ],
  };
}

function createValidStateV6(): unknown {
  return {
    schemaVersion: 6,
    variables: [
      {
        id: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
        openedAt: "2025-01-01T00:00:00.000Z",
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1",
      },
    ],
    notes: [
      {
        id: "n1",
        content: "Test note",
        createdAt: "2025-01-01T00:00:00.000Z",
        tags: [],
      },
    ],
    models: [],
  };
}

function createValidStateV3(): unknown {
  return {
    schemaVersion: 3,
    variables: [
      {
        id: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
        // No openedAt - V3 doesn't have timestamps
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        // episodeId is optional in V3
      },
    ],
    notes: [{ id: "n1", content: "Test note" }],
  };
}

function createValidStateV2(): unknown {
  return {
    schemaVersion: 2,
    variables: [
      {
        id: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1", // Required in V2
      },
    ],
    notes: [{ id: "n1", content: "Test note" }],
  };
}

function createValidStateV1(): unknown {
  return {
    schemaVersion: 1,
    variables: [
      {
        id: "v1",
        node: "Personal", // NodeType string, not NodeRef
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: "Personal",
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1",
      },
    ],
    notes: [{ id: "n1", content: "Test note" }],
  };
}

function createValidStateV0(): unknown {
  return {
    // No schemaVersion in V0
    variables: [
      {
        id: "v1",
        node: "Personal",
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      },
    ],
    episodes: [
      {
        id: "e1",
        node: "Personal",
        type: EPISODE_TYPES[0],
        objective: "Test objective",
        status: EPISODE_STATUSES[0],
      },
    ],
    actions: [
      {
        id: "a1",
        description: "Test action",
        status: ACTION_STATUSES[0],
        episodeId: "e1",
      },
    ],
    notes: [{ id: "n1", content: "Test note" }],
  };
}

// ============================================================================
// isValidState Tests (Current Schema)
// ============================================================================

describe("isValidState", () => {
  describe("valid cases", () => {
    it("accepts minimal valid state (empty arrays)", () => {
      expect(isValidState(createMinimalValidStateV7())).toBe(true);
    });

    it("accepts state with all entity types", () => {
      expect(isValidState(createValidStateV7())).toBe(true);
    });

    it("accepts state with all optional episode fields", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            variableId: "v1",
            objective: "Test",
            status: EPISODE_STATUSES[1], // Closed
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-01T12:00:00.000Z",
            closureNoteId: "n1",
          },
        ],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts action without episodeId (episode-less action)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Standalone action",
            status: ACTION_STATUSES[0],
            // No episodeId
          },
        ],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts state with Org node", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_ORG_NODE,
            name: "Capacity",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });
  });

  describe("structural rejections", () => {
    it("rejects null", () => {
      expect(isValidState(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(isValidState(undefined)).toBe(false);
    });

    it("rejects non-object primitives", () => {
      expect(isValidState("string")).toBe(false);
      expect(isValidState(123)).toBe(false);
      expect(isValidState(true)).toBe(false);
    });

    it("rejects missing schemaVersion", () => {
      const state = {
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects wrong schemaVersion", () => {
      const state = {
        schemaVersion: 3, // V3, not V4
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects missing variables array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects missing episodes array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects missing actions array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects missing notes array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects non-array variables", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: "not an array",
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });
  });

  describe("variable validation", () => {
    it("rejects variable with invalid status", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: "InvalidStatus",
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with invalid node ref (missing id)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: { type: "Personal" }, // Missing id
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with invalid node ref (invalid type)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: { type: "InvalidType", id: "test" },
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with empty node id", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: { type: "Personal", id: "" },
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate variable IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
          {
            id: "v1", // Duplicate
            node: DEFAULT_PERSONAL_NODE,
            name: "Continuity",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable without name", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with non-string name", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: 123,
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("accepts variable with all optional fields", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Energy",
            status: VARIABLE_STATUSES[1],
            description: "Physical and mental energy levels",
            preferredRange:
              "Enough to complete planned work with capacity for unexpected demands",
            measurementCadence: MEASUREMENT_CADENCES[1], // "weekly"
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts variable with Unknown status", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: "Unknown",
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("rejects variable with non-string description", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
            description: 123,
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with non-string preferredRange", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
            preferredRange: { min: 0, max: 10 },
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects variable with invalid measurementCadence", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
            measurementCadence: "invalid_cadence",
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
      };
      expect(isValidState(state)).toBe(false);
    });
  });

  describe("episode validation", () => {
    it("rejects episode without openedAt", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
            // Missing openedAt
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode with invalid type", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: "InvalidType",
            objective: "Test",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode with invalid status", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: "InvalidStatus",
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate episode IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test 1",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e1", // Duplicate
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
            objective: "Test 2",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode with non-string variableId", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            variableId: 123, // Should be string or undefined
            objective: "Test",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode with non-string closedAt", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[1],
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: 123, // Should be string
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode with non-string closureNoteId", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[1],
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-01T12:00:00.000Z",
            closureNoteId: 123, // Should be string
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects episode without objective", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });
  });

  describe("action validation", () => {
    it("rejects action referencing non-existent episode", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Test action",
            status: ACTION_STATUSES[0],
            episodeId: "nonexistent", // No such episode
          },
        ],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects action with invalid status", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Test action",
            status: "InvalidStatus",
          },
        ],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate action IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Action 1",
            status: ACTION_STATUSES[0],
          },
          {
            id: "a1", // Duplicate
            description: "Action 2",
            status: ACTION_STATUSES[0],
          },
        ],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects action without description", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            status: ACTION_STATUSES[0],
          },
        ],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects action with non-string episodeId", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [
          {
            id: "a1",
            description: "Test",
            status: ACTION_STATUSES[0],
            episodeId: 123, // Should be string or undefined
          },
        ],
        notes: [],
      };
      expect(isValidState(state)).toBe(false);
    });
  });

  describe("note validation", () => {
    it("rejects note without content", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [{ id: "n1" }],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects note with non-string content", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [{ id: "n1", content: 123 }],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate note IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          { id: "n1", content: "Note 1" },
          { id: "n1", content: "Note 2" }, // Duplicate
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects note without id", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [{ content: "No ID" }],
      };
      expect(isValidState(state)).toBe(false);
    });
  });
});

// ============================================================================
// isValidLegacyStateV3 Tests
// ============================================================================

describe("isValidLegacyStateV3", () => {
  it("accepts valid V3 state (episodes without timestamps)", () => {
    expect(isValidLegacyStateV3(createValidStateV3())).toBe(true);
  });

  it("rejects V4 state (wrong schemaVersion)", () => {
    expect(isValidLegacyStateV3(createValidStateV4())).toBe(false);
  });

  it("rejects V2 state", () => {
    expect(isValidLegacyStateV3(createValidStateV2())).toBe(false);
  });

  it("accepts optional variableId on episodes", () => {
    const state = {
      schemaVersion: 3,
      variables: [],
      episodes: [
        {
          id: "e1",
          node: DEFAULT_PERSONAL_NODE,
          type: EPISODE_TYPES[0],
          variableId: "v1", // Optional in V3
          objective: "Test",
          status: EPISODE_STATUSES[0],
        },
      ],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV3(state)).toBe(true);
  });

  it("accepts optional episodeId on actions", () => {
    const state = {
      schemaVersion: 3,
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "Standalone action",
          status: ACTION_STATUSES[0],
          // No episodeId - optional in V3
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV3(state)).toBe(true);
  });

  it("rejects episode with non-string variableId", () => {
    const state = {
      schemaVersion: 3,
      variables: [],
      episodes: [
        {
          id: "e1",
          node: DEFAULT_PERSONAL_NODE,
          type: EPISODE_TYPES[0],
          variableId: 123, // Should be string or undefined
          objective: "Test",
          status: EPISODE_STATUSES[0],
        },
      ],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV3(state)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidLegacyStateV3(null)).toBe(false);
  });

  it("rejects missing arrays", () => {
    const state = {
      schemaVersion: 3,
      variables: [],
      // Missing episodes, actions, notes
    };
    expect(isValidLegacyStateV3(state)).toBe(false);
  });
});

// ============================================================================
// isValidLegacyStateV2 Tests
// ============================================================================

describe("isValidLegacyStateV2", () => {
  it("accepts valid V2 state with NodeRef nodes", () => {
    expect(isValidLegacyStateV2(createValidStateV2())).toBe(true);
  });

  it("rejects V3 state", () => {
    expect(isValidLegacyStateV2(createValidStateV3())).toBe(false);
  });

  it("rejects V1 state", () => {
    expect(isValidLegacyStateV2(createValidStateV1())).toBe(false);
  });

  it("requires episodeId on all actions", () => {
    const state = {
      schemaVersion: 2,
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "No episode",
          status: ACTION_STATUSES[0],
          // Missing episodeId - required in V2
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV2(state)).toBe(false);
  });

  it("rejects action referencing non-existent episode", () => {
    const state = {
      schemaVersion: 2,
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "Test",
          status: ACTION_STATUSES[0],
          episodeId: "nonexistent",
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV2(state)).toBe(false);
  });

  it("uses NodeRef format for nodes", () => {
    // V2 should use NodeRef { type, id }, not just NodeType string
    const stateWithNodeType = {
      schemaVersion: 2,
      variables: [
        {
          id: "v1",
          node: "Personal", // NodeType string, not NodeRef
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV2(stateWithNodeType)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidLegacyStateV2(null)).toBe(false);
  });
});

// ============================================================================
// isValidLegacyStateV1 Tests
// ============================================================================

describe("isValidLegacyStateV1", () => {
  it("accepts valid V1 state with NodeType nodes", () => {
    expect(isValidLegacyStateV1(createValidStateV1())).toBe(true);
  });

  it("rejects state without schemaVersion", () => {
    // V0 has no schemaVersion, V1 requires it
    expect(isValidLegacyStateV1(createValidStateV0())).toBe(false);
  });

  it("rejects V2 state", () => {
    expect(isValidLegacyStateV1(createValidStateV2())).toBe(false);
  });

  it("uses NodeType strings instead of NodeRef", () => {
    const stateWithNodeRef = {
      schemaVersion: 1,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE, // NodeRef, not NodeType string
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    // V1 expects NodeType string, not NodeRef object
    expect(isValidLegacyStateV1(stateWithNodeRef)).toBe(false);
  });

  it("requires episodeId on all actions", () => {
    const state = {
      schemaVersion: 1,
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "No episode",
          status: ACTION_STATUSES[0],
          // Missing episodeId
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV1(state)).toBe(false);
  });

  it("accepts Org node type", () => {
    const state = {
      schemaVersion: 1,
      variables: [
        {
          id: "v1",
          node: "Org",
          name: "Capacity",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV1(state)).toBe(true);
  });

  it("rejects null", () => {
    expect(isValidLegacyStateV1(null)).toBe(false);
  });
});

// ============================================================================
// isValidLegacyStateV0 Tests
// ============================================================================

describe("isValidLegacyStateV0", () => {
  it("accepts valid V0 state (no schemaVersion)", () => {
    expect(isValidLegacyStateV0(createValidStateV0())).toBe(true);
  });

  it("uses NodeType strings instead of NodeRef", () => {
    const stateWithNodeRef = {
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE, // NodeRef, not NodeType string
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV0(stateWithNodeRef)).toBe(false);
  });

  it("rejects invalid node type", () => {
    const state = {
      variables: [
        {
          id: "v1",
          node: "InvalidType",
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV0(state)).toBe(false);
  });

  it("requires episodeId on all actions", () => {
    const state = {
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "No episode",
          status: ACTION_STATUSES[0],
          // Missing episodeId
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV0(state)).toBe(false);
  });

  it("rejects action referencing non-existent episode", () => {
    const state = {
      variables: [],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "Test",
          status: ACTION_STATUSES[0],
          episodeId: "nonexistent",
        },
      ],
      notes: [],
    };
    expect(isValidLegacyStateV0(state)).toBe(false);
  });

  it("rejects duplicate IDs", () => {
    const state = {
      variables: [
        {
          id: "same",
          node: "Personal",
          name: "V1",
          status: VARIABLE_STATUSES[0],
        },
        {
          id: "same",
          node: "Personal",
          name: "V2",
          status: VARIABLE_STATUSES[0],
        },
      ],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV0(state)).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidLegacyStateV0(null)).toBe(false);
  });

  it("rejects missing arrays", () => {
    const state = {
      variables: [],
      // Missing episodes, actions, notes
    };
    expect(isValidLegacyStateV0(state)).toBe(false);
  });
});

// ============================================================================
// nodeRefFromLegacy Tests
// ============================================================================

describe("nodeRefFromLegacy", () => {
  it("converts 'Personal' to { type: 'Personal', id: 'personal' }", () => {
    const result = nodeRefFromLegacy("Personal");
    expect(result).toEqual({ type: "Personal", id: "personal" });
  });

  it("converts 'Org' to { type: 'Org', id: 'org' }", () => {
    const result = nodeRefFromLegacy("Org");
    expect(result).toEqual({ type: "Org", id: "org" });
  });
});

// ============================================================================
// Model Validation Tests (MP6)
// ============================================================================

describe("isValidState - Model Validation", () => {
  describe("valid model cases", () => {
    it("accepts state with empty models array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts minimal model (required fields only)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0], // Descriptive
            statement: "Test belief",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts model with all optional fields", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[2], // Normative
            statement: "Test constraint",
            confidence: 0.85,
            scope: MODEL_SCOPES[0], // personal
            enforcement: ENFORCEMENT_LEVELS[2], // block
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts multiple valid models", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Descriptive belief",
          },
          {
            id: "m2",
            type: MODEL_TYPES[1], // Procedural
            statement: "Procedural knowledge",
            confidence: 0.5,
          },
          {
            id: "m3",
            type: MODEL_TYPES[2], // Normative
            statement: "Normative constraint",
            scope: MODEL_SCOPES[2], // domain
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts confidence at boundary values (0.0 and 1.0)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Zero confidence",
            confidence: 0.0,
          },
          {
            id: "m2",
            type: MODEL_TYPES[0],
            statement: "Full confidence",
            confidence: 1.0,
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });
  });

  describe("invalid model cases", () => {
    it("rejects missing models array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        // Missing models array
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with invalid type", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: "InvalidType",
            statement: "Test",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model missing statement", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            // Missing statement
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with non-string statement", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: 123,
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with invalid scope", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
            scope: "invalid_scope",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with confidence below 0", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
            confidence: -0.1,
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with confidence above 1", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
            confidence: 1.1,
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with non-number confidence", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
            confidence: "high",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects model with invalid enforcement level", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[2], // Normative
            statement: "Test",
            enforcement: "invalid",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate model IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "First",
          },
          {
            id: "m1", // Duplicate
            type: MODEL_TYPES[1],
            statement: "Second",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });
  });
});

// ============================================================================
// isValidLegacyStateV4 Tests
// ============================================================================

describe("isValidLegacyStateV4", () => {
  it("accepts valid V4 state (without models)", () => {
    const state = {
      schemaVersion: 4,
      variables: [],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV4(state)).toBe(true);
  });

  it("rejects V5 state (wrong schemaVersion)", () => {
    const state = {
      schemaVersion: SCHEMA_VERSION, // V5
      variables: [],
      episodes: [],
      actions: [],
      notes: [],
      models: [],
    };
    expect(isValidLegacyStateV4(state)).toBe(false);
  });

  it("rejects V3 state", () => {
    const state = {
      schemaVersion: 3,
      variables: [],
      episodes: [],
      actions: [],
      notes: [],
    };
    expect(isValidLegacyStateV4(state)).toBe(false);
  });
});

// ============================================================================
// migrateV4ToV5 Tests
// ============================================================================

describe("migrateV4ToV5", () => {
  it("adds empty models array and sets schemaVersion to 5", () => {
    const v4State = {
      schemaVersion: 4 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [
        {
          id: "e1",
          node: DEFAULT_PERSONAL_NODE,
          type: EPISODE_TYPES[0],
          objective: "Test",
          status: EPISODE_STATUSES[0],
          openedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      actions: [],
      notes: [{ id: "n1", content: "Note" }],
    };

    const v5State = migrateV4ToV5(v4State);

    expect(v5State.schemaVersion).toBe(5);
    expect(v5State.models).toEqual([]);
    // Preserves existing data
    expect(v5State.variables).toEqual(v4State.variables);
    expect(v5State.episodes).toEqual(v4State.episodes);
    expect(v5State.actions).toEqual(v4State.actions);
    expect(v5State.notes).toEqual(v4State.notes);
  });

  it("preserves all existing data during migration", () => {
    const v4State = {
      schemaVersion: 4 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Test",
          status: VARIABLE_STATUSES[0],
        },
        {
          id: "v2",
          node: DEFAULT_ORG_NODE,
          name: "Capacity",
          status: VARIABLE_STATUSES[2],
        },
      ],
      episodes: [],
      actions: [
        {
          id: "a1",
          description: "Do something",
          status: ACTION_STATUSES[0],
        },
      ],
      notes: [],
    };

    const v5State = migrateV4ToV5(v4State);

    expect(v5State.variables).toHaveLength(2);
    expect(v5State.actions).toHaveLength(1);
    expect(v5State.models).toEqual([]);
    expect(v5State.schemaVersion).toBe(5);
  });
});

// ============================================================================
// migrateV5ToV6 Tests
// ============================================================================

describe("migrateV5ToV6", () => {
  it("adds createdAt and tags to notes", () => {
    const v5State = {
      schemaVersion: 5 as const,
      variables: [],
      episodes: [],
      actions: [],
      notes: [
        { id: "n1", content: "Test note" },
        { id: "n2", content: "Another note" },
      ],
      models: [],
    };

    const v6State = migrateV5ToV6(v5State);

    expect(v6State.schemaVersion).toBe(6);
    expect(v6State.notes).toHaveLength(2);
    expect(v6State.notes[0]?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(v6State.notes[0]?.tags).toEqual([]);
    expect(v6State.notes[1]?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(v6State.notes[1]?.tags).toEqual([]);
  });

  it("produces V6 state (not valid current state, needs V7 migration)", () => {
    const v5State = {
      schemaVersion: 5 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [{ id: "n1", content: "Note" }],
      models: [],
    };

    const v6State = migrateV5ToV6(v5State);

    expect(v6State.schemaVersion).toBe(6);
    expect(isValidLegacyStateV6(v6State)).toBe(true);
  });
});

// ============================================================================
// migrateV6ToV7 Tests
// ============================================================================

describe("migrateV6ToV7", () => {
  it("adds empty links array and sets schemaVersion to 7", () => {
    const v6State = {
      schemaVersion: 6 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
    };

    const v7State = migrateV6ToV7(v6State);

    expect(v7State.schemaVersion).toBe(7);
    expect(v7State.links).toEqual([]);
    // Preserves existing data
    expect(v7State.variables).toEqual(v6State.variables);
    expect(v7State.notes).toEqual(v6State.notes);
  });

  it("produces valid V7 state (for further migration)", () => {
    const v6State = {
      schemaVersion: 6 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
    };

    const v7State = migrateV6ToV7(v6State);
    const v8State = migrateV7ToV8(v7State);

    expect(isValidLegacyStateV8(v8State)).toBe(true);
  });

  it("full migration chain V4 -> V5 -> V6 -> V7 -> V8 -> V9 -> V10 produces valid state", () => {
    const v4State = {
      schemaVersion: 4 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [
        {
          id: "e1",
          node: DEFAULT_PERSONAL_NODE,
          type: EPISODE_TYPES[0],
          objective: "Test",
          status: EPISODE_STATUSES[0],
          openedAt: "2025-01-01T00:00:00.000Z",
        },
      ],
      actions: [],
      notes: [{ id: "n1", content: "Note" }],
    };

    const v11State = migrateV10ToV11(
      migrateV9ToV10(
        migrateV8ToV9(
          migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(v4State)))),
        ),
      ),
    );

    expect(v11State.schemaVersion).toBe(SCHEMA_VERSION);
    expect(v11State.models).toEqual([]);
    expect(v11State.links).toEqual([]);
    expect(v11State.exceptions).toEqual([]);
    expect(v11State.proxies).toEqual([]);
    expect(v11State.proxyReadings).toEqual([]);
    expect(v11State.notes[0]?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(v11State.notes[0]?.tags).toEqual([]);
    expect(isValidState(v11State)).toBe(true);
  });
});

// ============================================================================
// migrateV7ToV8 Tests
// ============================================================================

describe("migrateV7ToV8", () => {
  it("adds empty exceptions array and sets schemaVersion to 8", () => {
    const v7State = {
      schemaVersion: 7 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
    };

    const v8State = migrateV7ToV8(v7State);

    expect(v8State.schemaVersion).toBe(8);
    expect(v8State.exceptions).toEqual([]);
    // Preserves existing data
    expect(v8State.variables).toEqual(v7State.variables);
    expect(v8State.notes).toEqual(v7State.notes);
    expect(v8State.links).toEqual(v7State.links);
  });

  it("produces valid V8 state (for further migration)", () => {
    const v7State = {
      schemaVersion: 7 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
    };

    const v8State = migrateV7ToV8(v7State);

    expect(isValidLegacyStateV8(v8State)).toBe(true);
  });
});

// ============================================================================
// migrateV8ToV9 Tests
// ============================================================================

describe("migrateV8ToV9", () => {
  it("sets schemaVersion to 9", () => {
    const v8State = {
      schemaVersion: 8 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
      exceptions: [],
    };

    const v9State = migrateV8ToV9(v8State);

    expect(v9State.schemaVersion).toBe(9);
    // Preserves existing data
    expect(v9State.variables).toEqual(v8State.variables);
    expect(v9State.notes).toEqual(v8State.notes);
    expect(v9State.links).toEqual(v8State.links);
    expect(v9State.exceptions).toEqual(v8State.exceptions);
  });

  it("produces valid V9 state (for further migration)", () => {
    const v8State = {
      schemaVersion: 8 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
      exceptions: [],
    };

    const v9State = migrateV8ToV9(v8State);

    expect(isValidLegacyStateV9(v9State)).toBe(true);
  });
});

// ============================================================================
// migrateV9ToV10 Tests
// ============================================================================

describe("migrateV9ToV10", () => {
  it("sets schemaVersion to 10", () => {
    const v9State = {
      schemaVersion: 9 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
      exceptions: [],
    };

    const v10State = migrateV9ToV10(v9State);

    expect(v10State.schemaVersion).toBe(10);
    // Preserves existing data
    expect(v10State.variables).toEqual(v9State.variables);
    expect(v10State.notes).toEqual(v9State.notes);
    expect(v10State.links).toEqual(v9State.links);
    expect(v10State.exceptions).toEqual(v9State.exceptions);
  });
});

// ============================================================================
// migrateV10ToV11 Tests
// ============================================================================

describe("migrateV10ToV11", () => {
  it("sets schemaVersion to 11 (current) and adds empty proxy arrays", () => {
    const v10State = {
      schemaVersion: 10 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
      exceptions: [],
    };

    const v11State = migrateV10ToV11(v10State);

    expect(v11State.schemaVersion).toBe(SCHEMA_VERSION);
    expect(v11State.proxies).toEqual([]);
    expect(v11State.proxyReadings).toEqual([]);
    // Preserves existing data
    expect(v11State.variables).toEqual(v10State.variables);
    expect(v11State.notes).toEqual(v10State.notes);
    expect(v11State.links).toEqual(v10State.links);
    expect(v11State.exceptions).toEqual(v10State.exceptions);
  });

  it("produces valid current state", () => {
    const v10State = {
      schemaVersion: 10 as const,
      variables: [
        {
          id: "v1",
          node: DEFAULT_PERSONAL_NODE,
          name: "Agency",
          status: VARIABLE_STATUSES[1],
        },
      ],
      episodes: [],
      actions: [],
      notes: [
        {
          id: "n1",
          content: "Note",
          createdAt: "2025-01-01T00:00:00.000Z",
          tags: [],
        },
      ],
      models: [],
      links: [],
      exceptions: [],
    };

    const v11State = migrateV10ToV11(v10State);

    expect(isValidState(v11State)).toBe(true);
  });
});

// ============================================================================
// isValidLegacyStateV6 Tests
// ============================================================================

describe("isValidLegacyStateV6", () => {
  it("accepts valid V6 state (without links)", () => {
    expect(isValidLegacyStateV6(createValidStateV6())).toBe(true);
  });

  it("rejects V7 state (wrong schemaVersion)", () => {
    expect(isValidLegacyStateV6(createValidStateV7())).toBe(false);
  });

  it("rejects V5 state", () => {
    const v5State = {
      schemaVersion: 5,
      variables: [],
      episodes: [],
      actions: [],
      notes: [{ id: "n1", content: "Note" }],
      models: [],
    };
    expect(isValidLegacyStateV6(v5State)).toBe(false);
  });
});

// ============================================================================
// Link Validation Tests (MP7)
// ============================================================================

describe("isValidState - Link Validation", () => {
  describe("valid link cases", () => {
    it("accepts state with empty links array", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts valid link with required fields", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
          {
            id: "v2",
            node: DEFAULT_PERSONAL_NODE,
            name: "V2",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v2",
            relation: LINK_RELATIONS[0], // "supports"
          },
        ],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts link with optional weight", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "supports",
            weight: 0.75,
          },
        ],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts weight at boundary values (0.0 and 1.0)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "supports",
            weight: 0.0,
          },
          {
            id: "l2",
            sourceId: "v1",
            targetId: "v1",
            relation: "tests",
            weight: 1.0,
          },
        ],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });

    it("accepts all valid relation types", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: LINK_RELATIONS.map((relation, i) => ({
          id: `l${i}`,
          sourceId: "v1",
          targetId: "v1",
          relation,
        })),
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };
      expect(isValidState(state)).toBe(true);
    });
  });

  describe("invalid link cases", () => {
    it("rejects link with invalid relation type", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "invalid_relation",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects link with weight below 0", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "supports",
            weight: -0.1,
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects link with weight above 1", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "supports",
            weight: 1.1,
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects duplicate link IDs", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "v1",
            relation: "supports",
          },
          {
            id: "l1", // Duplicate
            sourceId: "v1",
            targetId: "v1",
            relation: "tests",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects link with non-existent sourceId (referential integrity)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "nonexistent",
            targetId: "v1",
            relation: "supports",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects link with non-existent targetId (referential integrity)", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            targetId: "nonexistent",
            relation: "supports",
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });

    it("rejects link missing required fields", () => {
      const state = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [
          {
            id: "l1",
            sourceId: "v1",
            // Missing targetId and relation
          },
        ],
      };
      expect(isValidState(state)).toBe(false);
    });
  });
});

// ============================================================================
// Type Guard Functions — Foundation Bulletproofing
// ============================================================================

import {
  isNodeRef,
  isVariableStatus,
  isEpisodeType,
  isEpisodeStatus,
  isActionStatus,
  isModelType,
  isModelScope,
  isEnforcementLevel,
  isNoteTag,
  isLinkRelation,
  isMutationType,
  isOverrideDecision,
  isMeasurementCadence,
} from "./validation.js";
import { NOTE_TAGS, MUTATION_TYPES } from "../types.js";

describe("Type Guard Functions (Foundation)", () => {
  describe("isNodeRef", () => {
    it("accepts valid NodeRef with Personal type", () => {
      expect(isNodeRef({ type: "Personal", id: "personal" })).toBe(true);
    });

    it("accepts valid NodeRef with Org type", () => {
      expect(isNodeRef({ type: "Org", id: "org" })).toBe(true);
    });

    it("rejects invalid node type", () => {
      expect(isNodeRef({ type: "Invalid", id: "test" })).toBe(false);
    });

    it("rejects empty id", () => {
      expect(isNodeRef({ type: "Personal", id: "" })).toBe(false);
    });

    it("rejects null", () => {
      expect(isNodeRef(null)).toBe(false);
    });

    it("rejects non-object", () => {
      expect(isNodeRef("Personal:personal")).toBe(false);
      expect(isNodeRef(123)).toBe(false);
    });

    it("rejects missing type", () => {
      expect(isNodeRef({ id: "personal" })).toBe(false);
    });

    it("rejects missing id", () => {
      expect(isNodeRef({ type: "Personal" })).toBe(false);
    });
  });

  describe("isVariableStatus", () => {
    it.each(VARIABLE_STATUSES)("accepts valid status: %s", (status) => {
      expect(isVariableStatus(status)).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(isVariableStatus("NotAStatus")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isVariableStatus(123)).toBe(false);
      expect(isVariableStatus(null)).toBe(false);
      expect(isVariableStatus(undefined)).toBe(false);
    });
  });

  describe("isEpisodeType", () => {
    it.each(EPISODE_TYPES)("accepts valid type: %s", (type) => {
      expect(isEpisodeType(type)).toBe(true);
    });

    it("rejects invalid type", () => {
      expect(isEpisodeType("NotAType")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isEpisodeType(123)).toBe(false);
    });
  });

  describe("isEpisodeStatus", () => {
    it.each(EPISODE_STATUSES)("accepts valid status: %s", (status) => {
      expect(isEpisodeStatus(status)).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(isEpisodeStatus("NotAStatus")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isEpisodeStatus(null)).toBe(false);
    });
  });

  describe("isActionStatus", () => {
    it.each(ACTION_STATUSES)("accepts valid status: %s", (status) => {
      expect(isActionStatus(status)).toBe(true);
    });

    it("rejects invalid status", () => {
      expect(isActionStatus("NotAStatus")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isActionStatus({})).toBe(false);
    });
  });

  describe("isModelType", () => {
    it.each(MODEL_TYPES)("accepts valid type: %s", (type) => {
      expect(isModelType(type)).toBe(true);
    });

    it("rejects invalid type", () => {
      expect(isModelType("NotAType")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isModelType([])).toBe(false);
    });
  });

  describe("isModelScope", () => {
    it.each(MODEL_SCOPES)("accepts valid scope: %s", (scope) => {
      expect(isModelScope(scope)).toBe(true);
    });

    it("rejects invalid scope", () => {
      expect(isModelScope("NotAScope")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isModelScope(undefined)).toBe(false);
    });
  });

  describe("isEnforcementLevel", () => {
    it.each(ENFORCEMENT_LEVELS)("accepts valid level: %s", (level) => {
      expect(isEnforcementLevel(level)).toBe(true);
    });

    it("rejects invalid level", () => {
      expect(isEnforcementLevel("NotALevel")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isEnforcementLevel(0)).toBe(false);
    });
  });

  describe("isNoteTag", () => {
    it.each(NOTE_TAGS)("accepts valid tag: %s", (tag) => {
      expect(isNoteTag(tag)).toBe(true);
    });

    it("rejects invalid tag", () => {
      expect(isNoteTag("NotATag")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isNoteTag(true)).toBe(false);
    });
  });

  describe("isLinkRelation", () => {
    it.each(LINK_RELATIONS)("accepts valid relation: %s", (relation) => {
      expect(isLinkRelation(relation)).toBe(true);
    });

    it("rejects invalid relation", () => {
      expect(isLinkRelation("NotARelation")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isLinkRelation(Symbol("test"))).toBe(false);
    });
  });

  describe("isMutationType", () => {
    it.each(MUTATION_TYPES)("accepts valid type: %s", (type) => {
      expect(isMutationType(type)).toBe(true);
    });

    it("rejects invalid type", () => {
      expect(isMutationType("NotAType")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isMutationType({})).toBe(false);
    });
  });

  describe("isOverrideDecision", () => {
    it("accepts valid decisions", () => {
      expect(isOverrideDecision("warn")).toBe(true);
      expect(isOverrideDecision("block")).toBe(true);
    });

    it("rejects invalid decision", () => {
      expect(isOverrideDecision("allow")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isOverrideDecision(null)).toBe(false);
    });
  });

  describe("isMeasurementCadence", () => {
    it.each(MEASUREMENT_CADENCES)("accepts valid cadence: %s", (cadence) => {
      expect(isMeasurementCadence(cadence)).toBe(true);
    });

    it("rejects invalid cadence", () => {
      expect(isMeasurementCadence("NotACadence")).toBe(false);
    });

    it("rejects non-string", () => {
      expect(isMeasurementCadence(undefined)).toBe(false);
    });
  });
});

// ============================================================================
// Migration Robustness — Fuzz Testing
// ============================================================================

import fc from "fast-check";
import { migrateToLatest } from "./migrations.js";

describe("migrateToLatest Robustness (Fuzz)", () => {
  it("never throws on arbitrary input", () => {
    fc.assert(
      fc.property(fc.anything(), (garbage) => {
        // Should never throw, regardless of input
        const result = migrateToLatest(garbage);

        // Must return a valid result type
        expect(["current", "migrated", "invalid"]).toContain(result.status);

        // If valid, must have a state
        if (result.status === "current" || result.status === "migrated") {
          expect(result.state).toBeDefined();
          expect(isValidState(result.state)).toBe(true);
        }

        return true;
      }),
      { numRuns: 200 },
    );
  });

  it("handles null and undefined gracefully", () => {
    expect(migrateToLatest(null).status).toBe("invalid");
    expect(migrateToLatest(undefined).status).toBe("invalid");
  });

  it("handles empty object gracefully", () => {
    expect(migrateToLatest({}).status).toBe("invalid");
  });

  it("handles arrays gracefully", () => {
    expect(migrateToLatest([]).status).toBe("invalid");
    expect(migrateToLatest([1, 2, 3]).status).toBe("invalid");
  });

  it("handles primitive types gracefully", () => {
    expect(migrateToLatest("string").status).toBe("invalid");
    expect(migrateToLatest(12345).status).toBe("invalid");
    expect(migrateToLatest(true).status).toBe("invalid");
  });

  it("handles objects with wrong schemaVersion type", () => {
    expect(migrateToLatest({ schemaVersion: "10" }).status).toBe("invalid");
    expect(migrateToLatest({ schemaVersion: null }).status).toBe("invalid");
  });

  it("handles objects with future schemaVersion", () => {
    expect(migrateToLatest({ schemaVersion: 9999 }).status).toBe("invalid");
  });
});

// ============================================================================
// Schema Shape Snapshot — Catches Accidental Type Changes
// ============================================================================

describe("State Schema Snapshot", () => {
  it("State has expected top-level keys", () => {
    const validState = {
      schemaVersion: SCHEMA_VERSION,
      variables: [],
      episodes: [],
      actions: [],
      notes: [],
      models: [],
      links: [],
      exceptions: [],
      proxies: [],
      proxyReadings: [],
    };

    expect(isValidState(validState)).toBe(true);
    expect(Object.keys(validState).sort()).toMatchInlineSnapshot(`
      [
        "actions",
        "episodes",
        "exceptions",
        "links",
        "models",
        "notes",
        "proxies",
        "proxyReadings",
        "schemaVersion",
        "variables",
      ]
    `);
  });

  it("Variable has expected shape", () => {
    const variable = {
      id: "v1",
      node: DEFAULT_PERSONAL_NODE,
      name: "Test",
      status: VARIABLE_STATUSES[1],
    };

    expect(Object.keys(variable).sort()).toMatchInlineSnapshot(`
      [
        "id",
        "name",
        "node",
        "status",
      ]
    `);
  });

  it("Episode has expected required shape", () => {
    const episode = {
      id: "e1",
      node: DEFAULT_PERSONAL_NODE,
      type: EPISODE_TYPES[0],
      objective: "Test",
      status: EPISODE_STATUSES[0],
      openedAt: "2025-01-01T00:00:00.000Z",
    };

    expect(Object.keys(episode).sort()).toMatchInlineSnapshot(`
      [
        "id",
        "node",
        "objective",
        "openedAt",
        "status",
        "type",
      ]
    `);
  });

  it("NodeRef has expected shape", () => {
    expect(Object.keys(DEFAULT_PERSONAL_NODE).sort()).toMatchInlineSnapshot(`
      [
        "id",
        "type",
      ]
    `);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PROXY VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe("validateProxy", () => {
  const variableIds = new Set(["var-1"]);

  it("validates a minimal proxy", () => {
    const proxy = {
      id: "proxy-1",
      variableId: "var-1",
      name: "Sleep Hours",
      valueType: "numeric",
    };
    expect(validateProxy(proxy, variableIds)).toBe(true);
  });

  it("rejects non-object", () => {
    expect(validateProxy(null, variableIds)).toBe(false);
    expect(validateProxy("string", variableIds)).toBe(false);
  });

  it("rejects missing id", () => {
    const proxy = { variableId: "var-1", name: "Test", valueType: "numeric" };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects missing variableId", () => {
    const proxy = { id: "p1", name: "Test", valueType: "numeric" };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects missing name", () => {
    const proxy = { id: "p1", variableId: "var-1", valueType: "numeric" };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects invalid valueType", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "invalid",
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-string description", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "numeric",
      description: 123,
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-string unit", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "numeric",
      unit: 123,
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-array categories", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "categorical",
      categories: "not-an-array",
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-string category", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "categorical",
      categories: ["good", 123],
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-object thresholds", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "numeric",
      thresholds: "invalid",
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-number lowBelow threshold", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "numeric",
      thresholds: { lowBelow: "5" },
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects non-number highAbove threshold", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "numeric",
      thresholds: { highAbove: "10" },
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("rejects proxy with nonexistent variableId", () => {
    const proxy = {
      id: "p1",
      variableId: "nonexistent",
      name: "Test",
      valueType: "numeric",
    };
    expect(validateProxy(proxy, variableIds)).toBe(false);
  });

  it("accepts proxy with all optional fields", () => {
    const proxy = {
      id: "p1",
      variableId: "var-1",
      name: "Test",
      valueType: "categorical",
      description: "A description",
      unit: "status",
      categories: ["good", "bad"],
      thresholds: { lowBelow: 5, highAbove: 10 },
    };
    expect(validateProxy(proxy, variableIds)).toBe(true);
  });
});

describe("validateProxyReading", () => {
  const proxyIds = new Set(["proxy-1"]);

  it("validates a numeric reading", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(true);
  });

  it("validates a boolean reading", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "boolean", value: true },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(true);
  });

  it("validates a categorical reading", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "categorical", value: "good" },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(true);
  });

  it("rejects non-object", () => {
    expect(validateProxyReading(null, proxyIds)).toBe(false);
    expect(validateProxyReading("string", proxyIds)).toBe(false);
  });

  it("rejects missing id", () => {
    const reading = {
      proxyId: "proxy-1",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects missing proxyId", () => {
    const reading = {
      id: "r1",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects missing recordedAt", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "numeric", value: 7 },
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects non-object value", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: 7,
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects value without type", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects unknown value type", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "unknown", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects numeric value with non-number", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "numeric", value: "7" },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects boolean value with non-boolean", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "boolean", value: "true" },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects categorical value with non-string", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "categorical", value: 123 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects non-string source", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
      source: 123,
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("rejects reading with nonexistent proxyId", () => {
    const reading = {
      id: "r1",
      proxyId: "nonexistent",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(false);
  });

  it("accepts reading with optional source", () => {
    const reading = {
      id: "r1",
      proxyId: "proxy-1",
      value: { type: "numeric", value: 7 },
      recordedAt: "2025-01-01T00:00:00.000Z",
      source: "manual",
    };
    expect(validateProxyReading(reading, proxyIds)).toBe(true);
  });
});
