import { describe, it, expect } from "vitest";
import {
  getVariablesByNode,
  getActiveEpisodesByNode,
  countActiveExplores,
  canStartExplore,
  canCreateAction,
  validateEpisodeParams,
  openEpisode,
  closeEpisode,
} from "./logic.js";
import {
  NODE_TYPES,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  SCHEMA_VERSION,
} from "../memory/index.js";
import type { State } from "../memory/index.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";

describe("Regulator Logic (Pure Functions)", () => {
  describe("getVariablesByNode", () => {
    it("filters variables by node type", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: NODE_TYPES[0],
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
          {
            id: "v2",
            node: NODE_TYPES[1],
            name: "Capacity",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };

      const personalVars = getVariablesByNode(state, NODE_TYPES[0]);
      expect(personalVars).toHaveLength(1);
      expect(personalVars[0]?.name).toBe("Agency");

      const orgVars = getVariablesByNode(state, NODE_TYPES[1]);
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
          },
          {
            id: "e2",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1],
            objective: "Test",
            status: EPISODE_STATUSES[1],
          },
          {
            id: "e3",
            node: NODE_TYPES[1],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
          },
        ],
        actions: [],
        notes: [],
      };

      const personalActive = getActiveEpisodesByNode(state, NODE_TYPES[0]);
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
          {
            id: "e2",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0], // Stabilize
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
          {
            id: "e3",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: EPISODE_STATUSES[1], // Closed
          },
        ],
        actions: [],
        notes: [],
      };

      const count = countActiveExplores(state, NODE_TYPES[0]);
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

      const result = canStartExplore(state, NODE_TYPES[0]);
      expect(result.ok).toBe(true);
    });

    it("blocks second Explore episode for same node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canStartExplore(state, NODE_TYPES[0]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain(
          `${MAX_ACTIVE_EXPLORE_PER_NODE} active Explore`
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canStartExplore(state, NODE_TYPES[1]);
      expect(result.ok).toBe(true);
    });
  });

  describe("canCreateAction", () => {
    it("allows action when active episode exists", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const result = canCreateAction(state, NODE_TYPES[0]);
      expect(result.ok).toBe(true);
    });

    it("fails without active episode (Silence rule)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const result = canCreateAction(state, NODE_TYPES[0]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("no active episodes");
      }
    });
  });

  describe("validateEpisodeParams", () => {
    it("validates non-empty objective", () => {
      const validParams = {
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "Valid objective",
      };
      const result = validateEpisodeParams(validParams);
      expect(result.ok).toBe(true);
    });

    it("fails on empty objective", () => {
      const invalidParams = {
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "",
      };
      const result = validateEpisodeParams(invalidParams);
      expect(result.ok).toBe(false);
    });
  });

  describe("openEpisode", () => {
    it("returns new state with episode added", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const params = {
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "Restore agency",
      };

      const result = openEpisode(state, params);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes).toHaveLength(1);
        expect(result.value.episodes[0]?.objective).toBe("Restore agency");
        expect(result.value.episodes[0]?.status).toBe(EPISODE_STATUSES[0]);
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
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "",
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[1], // Explore
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const params = {
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[1], // Try to open second Explore
        objective: "Another explore",
      };

      const result = openEpisode(state, params);
      expect(result.ok).toBe(false);
    });
  });

  describe("closeEpisode", () => {
    it("marks episode as closed", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: "e1",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, "e1");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.status).toBe(EPISODE_STATUSES[1]);
        // Original state unchanged (pure function)
        expect(state.episodes[0]?.status).toBe(EPISODE_STATUSES[0]);
      }
    });

    it("updates variables when provided", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [
          {
            id: "v1",
            node: NODE_TYPES[0],
            name: "Agency",
            status: VARIABLE_STATUSES[0], // Low
          },
        ],
        episodes: [
          {
            id: "e1",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0], // Active
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, "e1", [
        { id: "v1", status: "InRange" },
      ]);
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

      const result = closeEpisode(state, "nonexistent");
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[1], // Closed
          },
        ],
        actions: [],
        notes: [],
      };

      const result = closeEpisode(state, "e1");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already closed");
      }
    });
  });
});

