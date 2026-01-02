import { describe, it, expect } from "vitest";
import {
  getVariablesByNode,
  getActiveEpisodesByNode,
  countActiveExplores,
  canStartExplore,
  canCreateAction,
  applySignal,
  createAction,
  validateEpisodeParams,
  openEpisode,
  closeEpisode,
} from "./logic.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  ACTION_STATUSES,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  SCHEMA_VERSION,
} from "../memory/index.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
import type { State } from "../memory/index.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";
import type { RegulatorPolicyForNode } from "./policy.js";

describe("Regulator Logic (Pure Functions)", () => {
  describe("getVariablesByNode", () => {
    it("filters variables by node type", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
          {
            id: "v2",
            node: DEFAULT_ORG_NODE,
            name: "Capacity",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };

      const personalVars = getVariablesByNode(state, DEFAULT_PERSONAL_NODE);
      expect(personalVars).toHaveLength(1);
      expect(personalVars[0]?.name).toBe("Agency");

      const orgVars = getVariablesByNode(state, DEFAULT_ORG_NODE);
      expect(orgVars).toHaveLength(1);
      expect(orgVars[0]?.name).toBe("Capacity");
    });
  });

  describe("getActiveEpisodesByNode", () => {
    it("filters active episodes by node type", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e2",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
            objective: "Test",
            status: CLOSED_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-01T01:00:00.000Z",
          },
          {
            id: "e3",
            node: DEFAULT_ORG_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const personalActive = getActiveEpisodesByNode(
        state,
        DEFAULT_PERSONAL_NODE,
      );
      expect(personalActive).toHaveLength(1);
      expect(personalActive[0]?.id).toBe("e1");
    });
  });

  describe("countActiveExplores", () => {
    it("counts active Explore episodes for a node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e2",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e3",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: CLOSED_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-01T01:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const count = countActiveExplores(state, DEFAULT_PERSONAL_NODE);
      expect(count).toBe(1);
    });
  });

  describe("canStartExplore", () => {
    it("allows starting Explore when none active", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });

    it("blocks second Explore episode for same node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS, // Active
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(
          `${MAX_ACTIVE_EXPLORE_PER_NODE} active Explore`,
        );
      }
    });

    it("allows Explore for different node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS, // Active
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canStartExplore(state, DEFAULT_ORG_NODE);
      expect(result.ok).toBe(true);
    });

    it("respects configurable policy override", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e2",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const policyTwo: RegulatorPolicyForNode = {
        maxActiveExplorePerNode: 2,
        maxActiveStabilizePerVariable: 1,
      };
      const resultTwo = canStartExplore(
        state,
        DEFAULT_PERSONAL_NODE,
        policyTwo,
      );
      expect(resultTwo.ok).toBe(false); // cannot start third when max=2

      const policyThree: RegulatorPolicyForNode = {
        maxActiveExplorePerNode: 3,
        maxActiveStabilizePerVariable: 1,
      };
      const resultThree = canStartExplore(
        state,
        DEFAULT_PERSONAL_NODE,
        policyThree,
      );
      expect(resultThree.ok).toBe(true); // can start third when max=3
    });
  });

  describe("canCreateAction", () => {
    it("allows action without episodeId", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = canCreateAction(state, {
        node: DEFAULT_PERSONAL_NODE,
      });
      expect(result.ok).toBe(true);
    });

    it("allows action when referenced episode is active and node matches", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canCreateAction(state, {
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "e1",
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("validateEpisodeParams", () => {
    it("validates non-empty objective", () => {
      const validParams = {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "Valid objective",
        openedAt: "2025-01-01T00:00:00.000Z",
      };
      const result = validateEpisodeParams(validParams);
      expect(result.ok).toBe(true);
    });

    it("fails on empty objective", () => {
      const invalidParams = {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "",
        openedAt: "2025-01-01T00:00:00.000Z",
      };
      const result = validateEpisodeParams(invalidParams);
      expect(result.ok).toBe(false);
    });
  });

  describe("openEpisode", () => {
    it("returns new state with episode added and sets openedAt", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const openedAt = "2025-01-01T12:00:00.000Z";
      const params = {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "Restore agency",
        openedAt,
      };

      const result = openEpisode(state, params);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes).toHaveLength(1);
        expect(result.value.episodes[0]?.objective).toBe("Restore agency");
        expect(result.value.episodes[0]?.status).toBe(ACTIVE_STATUS);
        expect(result.value.episodes[0]?.openedAt).toBe(openedAt);
        expect(result.value.episodes[0]?.closedAt).toBeUndefined();
        // Original state unchanged (pure function)
        expect(state.episodes).toHaveLength(0);
      }
    });

    it("fails on empty objective", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const params = {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "",
        openedAt: "2025-01-01T00:00:00.000Z",
      };

      const result = openEpisode(state, params);
      expect(result.ok).toBe(false);
    });

    it("enforces Explore constraint", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: ACTIVE_STATUS, // Active
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const params = {
        episodeId: "ep-2",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[1], // Try to open second Explore
        objective: "Another explore",
        openedAt: "2025-01-01T01:00:00.000Z",
      };

      const result = openEpisode(state, params);
      expect(result.ok).toBe(false);
    });

    it("enforces Stabilize constraint per variable", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "s1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
            variableId: "v1",
            objective: "Stabilize v1",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const sameVariable = openEpisode(state, {
        episodeId: "s2",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "Another stabilize v1",
        openedAt: "2025-01-01T01:00:00.000Z",
      });
      expect(sameVariable.ok).toBe(false);

      const differentVariable = openEpisode(state, {
        episodeId: "s3",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v2",
        objective: "Stabilize v2",
        openedAt: "2025-01-01T01:00:00.000Z",
      });
      expect(differentVariable.ok).toBe(true);
    });
  });

  describe("closeEpisode", () => {
    it("marks episode as closed, sets closedAt, and creates closure note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const closedAt = "2025-01-01T12:00:00.000Z";
      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt,
        closureNote: { id: "note-1", content: "Learned something valuable" },
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.status).toBe(CLOSED_STATUS);
        expect(result.value.episodes[0]?.closedAt).toBe(closedAt);
        expect(result.value.episodes[0]?.closureNoteId).toBe("note-1");
        // Note was created
        expect(result.value.notes).toHaveLength(1);
        expect(result.value.notes[0]?.id).toBe("note-1");
        expect(result.value.notes[0]?.content).toBe(
          "Learned something valuable",
        );
        // Original state unchanged (pure function)
        expect(state.episodes[0]?.status).toBe(ACTIVE_STATUS);
        expect(state.episodes[0]?.closedAt).toBeUndefined();
        expect(state.notes).toHaveLength(0);
      }
    });

    it("updates variables when provided", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[0], // Low
          },
        ],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Variable restored" },
        variableUpdates: [{ id: "v1", status: VARIABLE_STATUSES[1] }],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables[0]?.status).toBe(VARIABLE_STATUSES[1]);
        // Original state unchanged (pure function)
        expect(state.variables[0]?.status).toBe(VARIABLE_STATUSES[0]);
      }
    });

    it("fails on non-existent episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, {
        episodeId: "nonexistent",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Some learning" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails on already closed episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: CLOSED_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-01T06:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Some learning" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already closed");
      }
    });

    it("fails on empty closure note content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Closure note content cannot be empty");
      }
    });

    it("fails on whitespace-only closure note content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "   " },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Closure note content cannot be empty");
      }
    });
  });

  describe("applySignal", () => {
    it("updates only the intended variable", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[0],
          },
          {
            id: "v2",
            node: DEFAULT_PERSONAL_NODE,
            name: "Continuity",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = applySignal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "v1",
        status: VARIABLE_STATUSES[1],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables.find((v) => v.id === "v1")?.status).toBe(
          VARIABLE_STATUSES[1],
        );
        expect(result.value.variables.find((v) => v.id === "v2")?.status).toBe(
          VARIABLE_STATUSES[0],
        );
      }
    });
  });

  describe("createAction", () => {
    it("succeeds without episodeId (episode-less action)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = createAction(state, {
        actionId: "a1",
        node: DEFAULT_PERSONAL_NODE,
        description: "Do the thing",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions).toHaveLength(1);
        expect(result.value.actions[0]?.episodeId).toBeUndefined();
      }
    });

    it("fails if episode does not exist", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = createAction(state, {
        actionId: "a1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "e1",
        description: "Do the thing",
      });
      expect(result.ok).toBe(false);
    });

    it("fails if episode is wrong node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_ORG_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const wrongNode = createAction(state, {
        actionId: "a1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "e1",
        description: "Do the thing",
      });
      expect(wrongNode.ok).toBe(false);
    });

    it("fails if episode is not active", () => {
      const state: State = {
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
            closedAt: "2025-01-01T06:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = createAction(state, {
        actionId: "a1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "e1",
        description: "Do the thing",
      });
      expect(result.ok).toBe(false);
    });

    it("succeeds when episode is active and node matches", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
      };

      const result = createAction(state, {
        actionId: "a1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "e1",
        description: "Do the thing",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions).toHaveLength(1);
        expect(result.value.actions[0]?.episodeId).toBe("e1");
        expect(result.value.actions[0]?.status).toBe(ACTION_STATUSES[0]);
      }
    });
  });
});
