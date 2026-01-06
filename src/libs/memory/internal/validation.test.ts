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
  nodeRefFromLegacy,
} from "./validation.js";
import {
  migrateV4ToV5,
  migrateV5ToV6,
  migrateV6ToV7,
  migrateV7ToV8,
  migrateV8ToV9,
} from "./migrations.js";
import {
  SCHEMA_VERSION,
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  VARIABLE_STATUSES,
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

  it("full migration chain V4 -> V5 -> V6 -> V7 -> V8 -> V9 produces valid state", () => {
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

    const v9State = migrateV8ToV9(
      migrateV7ToV8(migrateV6ToV7(migrateV5ToV6(migrateV4ToV5(v4State)))),
    );

    expect(v9State.schemaVersion).toBe(SCHEMA_VERSION);
    expect(v9State.models).toEqual([]);
    expect(v9State.links).toEqual([]);
    expect(v9State.exceptions).toEqual([]);
    expect(v9State.notes[0]?.createdAt).toBe("1970-01-01T00:00:00.000Z");
    expect(v9State.notes[0]?.tags).toEqual([]);
    expect(isValidState(v9State)).toBe(true);
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
  it("sets schemaVersion to 9 (current)", () => {
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

    expect(v9State.schemaVersion).toBe(SCHEMA_VERSION);
    // Preserves existing data
    expect(v9State.variables).toEqual(v8State.variables);
    expect(v9State.notes).toEqual(v8State.notes);
    expect(v9State.links).toEqual(v8State.links);
    expect(v9State.exceptions).toEqual(v8State.exceptions);
  });

  it("produces valid current state", () => {
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

    expect(isValidState(v9State)).toBe(true);
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
