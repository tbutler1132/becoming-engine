import { describe, it, expect } from "vitest";
import {
  getVariablesByNode,
  getActiveEpisodesByNode,
  countActiveExplores,
  canStartExplore,
  canCreateAction,
  applySignal,
  createAction,
  completeAction,
  validateEpisodeParams,
  openEpisode,
  closeEpisode,
  updateEpisode,
  createModel,
  updateModel,
  createNote,
  addNoteTag,
  removeNoteTag,
  addNoteLinkedObject,
  updateNote,
  createLink,
  deleteLink,
  logException,
  createVariable,
  createProxy,
  updateProxy,
  deleteProxy,
  logProxyReading,
  getProxiesForVariable,
  getRecentReadings,
} from "./logic.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  ACTION_STATUSES,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  LINK_RELATIONS,
  NOTE_TAGS,
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const count = countActiveExplores(state, DEFAULT_PERSONAL_NODE);
      expect(count).toBe(1);
    });
  });

  describe("canStartExplore", () => {
    it("allows starting Explore when none active", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });

    it("blocks second Explore episode for same node", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = canStartExplore(state, DEFAULT_ORG_NODE);
      expect(result.ok).toBe(true);
    });

    it("respects configurable policy override", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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

      const result = canCreateAction(state, {
        node: DEFAULT_PERSONAL_NODE,
      });
      expect(result.ok).toBe(true);
    });

    it("allows action when referenced episode is active and node matches", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        nodes: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        // Note was created with timestamp and closure_note tag
        expect(result.value.notes).toHaveLength(1);
        expect(result.value.notes[0]?.id).toBe("note-1");
        expect(result.value.notes[0]?.content).toBe(
          "Learned something valuable",
        );
        expect(result.value.notes[0]?.createdAt).toBe(closedAt);
        expect(result.value.notes[0]?.tags).toEqual(["closure_note"]);
        // Original state unchanged (pure function)
        expect(state.episodes[0]?.status).toBe(ACTIVE_STATUS);
        expect(state.episodes[0]?.closedAt).toBeUndefined();
        expect(state.notes).toHaveLength(0);
      }
    });

    it("updates variables when provided", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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

    it("requires Model updates when closing an Explore episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Discover something",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      // Closing Explore without modelUpdates should fail
      const resultNoModels = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned nothing" },
      });
      expect(resultNoModels.ok).toBe(false);
      if (!resultNoModels.ok) {
        expect(resultNoModels.error).toContain("Model update");
      }

      // Closing Explore with empty modelUpdates array should fail
      const resultEmptyModels = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned nothing" },
        modelUpdates: [],
      });
      expect(resultEmptyModels.ok).toBe(false);

      // Closing Explore WITH modelUpdates should succeed
      const resultWithModels = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned about X" },
        modelUpdates: [
          {
            id: "model-1",
            type: MODEL_TYPES[0],
            statement: "X leads to Y",
          },
        ],
      });
      expect(resultWithModels.ok).toBe(true);
    });

    it("does NOT require Model updates when closing a Stabilize episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
            variableId: "v1",
            objective: "Restore agency",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      // Closing Stabilize without modelUpdates should succeed
      const result = closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Variable restored" },
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("applySignal", () => {
    it("updates only the intended variable", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        nodes: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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
        nodes: [],
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
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
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

  describe("completeAction", () => {
    it("marks a pending action as done", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Do the thing",
            status: ACTION_STATUSES[0], // Pending
          },
        ],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = completeAction(state, { actionId: "a1" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions[0]?.status).toBe(ACTION_STATUSES[1]); // Done
        // Original state unchanged (pure function)
        expect(state.actions[0]?.status).toBe(ACTION_STATUSES[0]);
      }
    });

    it("fails if action not found", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = completeAction(state, { actionId: "nonexistent" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("is idempotent - completing already-done action returns success", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "Already done",
            status: ACTION_STATUSES[1], // Done
          },
        ],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = completeAction(state, { actionId: "a1" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        // State unchanged (already done)
        expect(result.value.actions[0]?.status).toBe(ACTION_STATUSES[1]);
      }
    });

    it("preserves other actions when completing one", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [
          {
            id: "a1",
            description: "First action",
            status: ACTION_STATUSES[0], // Pending
          },
          {
            id: "a2",
            description: "Second action",
            status: ACTION_STATUSES[0], // Pending
          },
        ],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = completeAction(state, { actionId: "a1" });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions).toHaveLength(2);
        expect(result.value.actions[0]?.status).toBe(ACTION_STATUSES[1]); // Done
        expect(result.value.actions[1]?.status).toBe(ACTION_STATUSES[0]); // Still Pending
      }
    });
  });

  describe("createModel", () => {
    it("creates a model with valid params", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[0], // Descriptive
        statement: "Publishing under my name increases commitment",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models).toHaveLength(1);
        expect(result.value.models[0]?.id).toBe("m1");
        expect(result.value.models[0]?.type).toBe(MODEL_TYPES[0]);
        expect(result.value.models[0]?.statement).toBe(
          "Publishing under my name increases commitment",
        );
        // Original state unchanged (pure function)
        expect(state.models).toHaveLength(0);
      }
    });

    it("creates model with all optional fields", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[2], // Normative
        statement: "Never commit on Friday",
        confidence: 0.9,
        scope: MODEL_SCOPES[0], // personal
        enforcement: ENFORCEMENT_LEVELS[1], // warn
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models[0]?.confidence).toBe(0.9);
        expect(result.value.models[0]?.scope).toBe(MODEL_SCOPES[0]);
        expect(result.value.models[0]?.enforcement).toBe(ENFORCEMENT_LEVELS[1]);
      }
    });

    it("fails on empty statement", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[0],
        statement: "",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("statement");
      }
    });

    it("fails on whitespace-only statement", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[0],
        statement: "   ",
      });

      expect(result.ok).toBe(false);
    });

    it("fails on confidence below 0", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[0],
        statement: "Test",
        confidence: -0.1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("confidence");
      }
    });

    it("fails on confidence above 1", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createModel(state, {
        modelId: "m1",
        type: MODEL_TYPES[0],
        statement: "Test",
        confidence: 1.5,
      });

      expect(result.ok).toBe(false);
    });

    it("fails on duplicate model ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Existing model",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createModel(state, {
        modelId: "m1", // Duplicate
        type: MODEL_TYPES[1],
        statement: "New model",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });
  });

  describe("updateModel", () => {
    it("updates statement on existing model", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Original statement",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateModel(state, {
        modelId: "m1",
        statement: "Updated statement",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models[0]?.statement).toBe("Updated statement");
        // Original state unchanged (pure function)
        expect(state.models[0]?.statement).toBe("Original statement");
      }
    });

    it("updates confidence on existing model", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
            confidence: 0.5,
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateModel(state, {
        modelId: "m1",
        confidence: 0.8,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models[0]?.confidence).toBe(0.8);
      }
    });

    it("updates multiple fields at once", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Original",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateModel(state, {
        modelId: "m1",
        statement: "Updated",
        confidence: 0.75,
        scope: MODEL_SCOPES[1], // org
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models[0]?.statement).toBe("Updated");
        expect(result.value.models[0]?.confidence).toBe(0.75);
        expect(result.value.models[0]?.scope).toBe(MODEL_SCOPES[1]);
      }
    });

    it("fails on non-existent model", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = updateModel(state, {
        modelId: "nonexistent",
        statement: "Updated",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails on empty statement update", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Original",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateModel(state, {
        modelId: "m1",
        statement: "",
      });

      expect(result.ok).toBe(false);
    });

    it("fails on invalid confidence update", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateModel(state, {
        modelId: "m1",
        confidence: 2.0,
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("createNote", () => {
    it("creates a note with timestamp and empty tags", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const createdAt = "2025-01-01T12:00:00.000Z";
      const result = createNote(state, {
        noteId: "n1",
        content: "Test note content",
        createdAt,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toHaveLength(1);
        expect(result.value.notes[0]?.id).toBe("n1");
        expect(result.value.notes[0]?.content).toBe("Test note content");
        expect(result.value.notes[0]?.createdAt).toBe(createdAt);
        expect(result.value.notes[0]?.tags).toEqual([]);
        // Original state unchanged
        expect(state.notes).toHaveLength(0);
      }
    });

    it("creates a note with initial tags", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createNote(state, {
        noteId: "n1",
        content: "Inbox note",
        createdAt: "2025-01-01T12:00:00.000Z",
        tags: [NOTE_TAGS[0]], // "inbox"
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.tags).toEqual(["inbox"]);
      }
    });

    it("creates a note with linkedObjects", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createNote(state, {
        noteId: "n1",
        content: "Linked note",
        createdAt: "2025-01-01T12:00:00.000Z",
        linkedObjects: ["obj-1", "obj-2"],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.linkedObjects).toEqual([
          "obj-1",
          "obj-2",
        ]);
      }
    });

    it("fails on empty content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createNote(state, {
        noteId: "n1",
        content: "",
        createdAt: "2025-01-01T12:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("content");
      }
    });

    it("fails on duplicate note ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Existing",
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

      const result = createNote(state, {
        noteId: "n1",
        content: "New note",
        createdAt: "2025-01-01T12:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });
  });

  describe("addNoteTag", () => {
    it("adds a tag to an existing note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
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

      const result = addNoteTag(state, {
        noteId: "n1",
        tag: NOTE_TAGS[0], // "inbox"
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.tags).toEqual(["inbox"]);
        // Original state unchanged
        expect(state.notes[0]?.tags).toEqual([]);
      }
    });

    it("is idempotent - adding existing tag returns success", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Test note",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: ["inbox"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = addNoteTag(state, {
        noteId: "n1",
        tag: "inbox",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // State unchanged
        expect(result.value).toBe(state);
        expect(result.value.notes[0]?.tags).toEqual(["inbox"]);
      }
    });

    it("fails on non-existent note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = addNoteTag(state, {
        noteId: "nonexistent",
        tag: "inbox",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("removeNoteTag", () => {
    it("removes a tag from an existing note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Test note",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: ["inbox", "processed"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = removeNoteTag(state, {
        noteId: "n1",
        tag: "inbox",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.tags).toEqual(["processed"]);
        // Original state unchanged
        expect(state.notes[0]?.tags).toEqual(["inbox", "processed"]);
      }
    });

    it("is idempotent - removing non-existent tag returns success", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Test note",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: ["processed"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = removeNoteTag(state, {
        noteId: "n1",
        tag: "inbox",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // State unchanged
        expect(result.value).toBe(state);
        expect(result.value.notes[0]?.tags).toEqual(["processed"]);
      }
    });

    it("fails on non-existent note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = removeNoteTag(state, {
        noteId: "nonexistent",
        tag: "inbox",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("addNoteLinkedObject", () => {
    it("adds a linked object to an existing note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
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

      const result = addNoteLinkedObject(state, {
        noteId: "n1",
        objectId: "var-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.linkedObjects).toEqual(["var-1"]);
        // Original state unchanged
        expect(state.notes[0]?.linkedObjects).toBeUndefined();
      }
    });

    it("adds to existing linkedObjects array", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Test note",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: [],
            linkedObjects: ["var-1"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = addNoteLinkedObject(state, {
        noteId: "n1",
        objectId: "var-2",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.linkedObjects).toEqual([
          "var-1",
          "var-2",
        ]);
      }
    });

    it("is idempotent - adding already-linked object returns success", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Test note",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: [],
            linkedObjects: ["var-1"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = addNoteLinkedObject(state, {
        noteId: "n1",
        objectId: "var-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // State unchanged (same reference)
        expect(result.value).toBe(state);
        expect(result.value.notes[0]?.linkedObjects).toEqual(["var-1"]);
      }
    });

    it("fails on non-existent note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = addNoteLinkedObject(state, {
        noteId: "nonexistent",
        objectId: "var-1",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails on empty objectId", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
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

      const result = addNoteLinkedObject(state, {
        noteId: "n1",
        objectId: "",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });
  });

  describe("updateNote", () => {
    it("updates an existing note's content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Original content",
            createdAt: "2025-01-01T00:00:00.000Z",
            tags: ["inbox"],
          },
        ],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = updateNote(state, {
        noteId: "n1",
        content: "Updated content",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.content).toBe("Updated content");
        // Tags and other fields preserved
        expect(result.value.notes[0]?.tags).toEqual(["inbox"]);
        expect(result.value.notes[0]?.createdAt).toBe(
          "2025-01-01T00:00:00.000Z",
        );
        // Original state unchanged
        expect(state.notes[0]?.content).toBe("Original content");
      }
    });

    it("fails on non-existent note", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = updateNote(state, {
        noteId: "nonexistent",
        content: "New content",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails on empty content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Original content",
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

      const result = updateNote(state, {
        noteId: "n1",
        content: "",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });

    it("fails on whitespace-only content", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "n1",
            content: "Original content",
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

      const result = updateNote(state, {
        noteId: "n1",
        content: "   ",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });
  });

  describe("updateEpisode", () => {
    it("updates an existing episode's objective", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.objective).toBe("Updated objective");
        // Other fields preserved
        expect(result.value.episodes[0]?.id).toBe("e1");
        expect(result.value.episodes[0]?.status).toBe(ACTIVE_STATUS);
        expect(result.value.episodes[0]?.openedAt).toBe(
          "2025-01-01T00:00:00.000Z",
        );
        // Original state unchanged
        expect(state.episodes[0]?.objective).toBe("Original objective");
      }
    });

    it("updates an existing episode's timeboxDays", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            timeboxDays: 7,
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        timeboxDays: 14,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.timeboxDays).toBe(14);
        // Objective preserved
        expect(result.value.episodes[0]?.objective).toBe("Test objective");
        // Original state unchanged
        expect(state.episodes[0]?.timeboxDays).toBe(7);
      }
    });

    it("updates both objective and timeboxDays together", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            timeboxDays: 7,
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
        timeboxDays: 21,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.objective).toBe("Updated objective");
        expect(result.value.episodes[0]?.timeboxDays).toBe(21);
      }
    });

    it("removes timeboxDays when set to null", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            timeboxDays: 7,
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        timeboxDays: null,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.timeboxDays).toBeUndefined();
      }
    });

    it("preserves other episode fields", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
            variableId: "v1",
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            timeboxDays: 7,
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        const episode = result.value.episodes[0];
        expect(episode?.id).toBe("e1");
        expect(episode?.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(episode?.type).toBe(EPISODE_TYPES[1]);
        expect(episode?.variableId).toBe("v1");
        expect(episode?.status).toBe(ACTIVE_STATUS);
        expect(episode?.openedAt).toBe("2025-01-01T00:00:00.000Z");
        expect(episode?.timeboxDays).toBe(7);
      }
    });

    it("fails on non-existent episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = updateEpisode(state, {
        episodeId: "nonexistent",
        objective: "New objective",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails on empty objective", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });

    it("fails on whitespace-only objective", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "   ",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });

    it("fails on negative timeboxDays", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        timeboxDays: -1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("positive");
      }
    });

    it("fails on zero timeboxDays", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        timeboxDays: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("positive");
      }
    });

    it("fails on closed episode", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: CLOSED_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
            closedAt: "2025-01-15T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("cannot be edited");
        expect(result.error).toContain("Active");
      }
    });

    it("allows editing Active episodes", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Original objective",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
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

      const result = updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("createLink", () => {
    it("creates a link between two existing objects", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "n1",
        relation: LINK_RELATIONS[0], // "supports"
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.links).toHaveLength(1);
        expect(result.value.links[0]).toEqual({
          id: "l1",
          sourceId: "v1",
          targetId: "n1",
          relation: "supports",
        });
        // Original state unchanged
        expect(state.links).toHaveLength(0);
      }
    });

    it("creates a link with optional weight", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
          {
            id: "v2",
            node: DEFAULT_PERSONAL_NODE,
            name: "Continuity",
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

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v2",
        relation: "supports",
        weight: 0.75,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.links[0]?.weight).toBe(0.75);
      }
    });

    it("accepts weight at boundary values (0.0 and 1.0)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result1 = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v2",
        relation: "supports",
        weight: 0.0,
      });
      expect(result1.ok).toBe(true);

      const result2 = createLink(state, {
        linkId: "l2",
        sourceId: "v1",
        targetId: "v2",
        relation: "supports",
        weight: 1.0,
      });
      expect(result2.ok).toBe(true);
    });

    it("fails on invalid relation type", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v1",
        relation: "invalid_relation" as "supports",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Invalid link relation");
      }
    });

    it("fails on weight below 0", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v1",
        relation: "supports",
        weight: -0.1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("weight must be between 0.0 and 1.0");
      }
    });

    it("fails on weight above 1", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v1",
        relation: "supports",
        weight: 1.1,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("weight must be between 0.0 and 1.0");
      }
    });

    it("fails on duplicate link ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        ],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "v1",
        relation: "tests",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });

    it("fails on non-existent sourceId (referential integrity)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "nonexistent",
        targetId: "v1",
        relation: "supports",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Source object 'nonexistent' not found");
      }
    });

    it("fails on non-existent targetId (referential integrity)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "nonexistent",
        relation: "supports",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Target object 'nonexistent' not found");
      }
    });

    it("can link to any object type (variable, episode, action, note, model, link)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "V1",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [
          {
            id: "a1",
            description: "Test action",
            status: ACTION_STATUSES[0],
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
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[0],
            statement: "Test model",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      // Link variable to episode
      const r1 = createLink(state, {
        linkId: "l1",
        sourceId: "v1",
        targetId: "e1",
        relation: "supports",
      });
      expect(r1.ok).toBe(true);

      // Link action to note
      const r2 = createLink(state, {
        linkId: "l2",
        sourceId: "a1",
        targetId: "n1",
        relation: "responds_to",
      });
      expect(r2.ok).toBe(true);

      // Link model to variable
      const r3 = createLink(state, {
        linkId: "l3",
        sourceId: "m1",
        targetId: "v1",
        relation: "tests",
      });
      expect(r3.ok).toBe(true);
    });
  });

  describe("deleteLink", () => {
    it("deletes an existing link", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
            id: "l2",
            sourceId: "v1",
            targetId: "v1",
            relation: "tests",
          },
        ],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = deleteLink(state, { linkId: "l1" });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.links).toHaveLength(1);
        expect(result.value.links[0]?.id).toBe("l2");
        // Original state unchanged
        expect(state.links).toHaveLength(2);
      }
    });

    it("fails on non-existent link", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = deleteLink(state, { linkId: "nonexistent" });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });
  });

  describe("logException", () => {
    it("logs a membrane exception", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[2],
            statement: "No late-night work",
            scope: MODEL_SCOPES[0],
            enforcement: ENFORCEMENT_LEVELS[2],
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = logException(state, {
        exceptionId: "ex1",
        modelId: "m1",
        originalDecision: "block",
        justification: "Urgent deadline",
        mutationType: "episode",
        mutationId: "e1",
        createdAt: "2025-01-02T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.exceptions).toHaveLength(1);
        expect(result.value.exceptions[0]?.modelId).toBe("m1");
        expect(result.value.exceptions[0]?.originalDecision).toBe("block");
        expect(result.value.exceptions[0]?.justification).toBe(
          "Urgent deadline",
        );
        // Original state unchanged
        expect(state.exceptions).toHaveLength(0);
      }
    });

    it("fails when model does not exist", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = logException(state, {
        exceptionId: "ex1",
        modelId: "nonexistent",
        originalDecision: "warn",
        justification: "Test",
        mutationType: "episode",
        mutationId: "e1",
        createdAt: "2025-01-02T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("fails with empty justification", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[2],
            statement: "Test",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = logException(state, {
        exceptionId: "ex1",
        modelId: "m1",
        originalDecision: "warn",
        justification: "   ",
        mutationType: "episode",
        mutationId: "e1",
        createdAt: "2025-01-02T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("empty");
      }
    });

    it("fails with duplicate exception ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "m1",
            type: MODEL_TYPES[2],
            statement: "Test",
          },
        ],
        links: [],
        exceptions: [
          {
            id: "ex1",
            modelId: "m1",
            originalDecision: "warn",
            justification: "Already exists",
            mutationType: "episode",
            mutationId: "e0",
            createdAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        proxies: [],
        proxyReadings: [],
      };

      const result = logException(state, {
        exceptionId: "ex1",
        modelId: "m1",
        originalDecision: "warn",
        justification: "New justification",
        mutationType: "episode",
        mutationId: "e1",
        createdAt: "2025-01-02T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });
  });

  describe("createVariable", () => {
    it("creates a variable with valid params", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createVariable(state, {
        variableId: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Runway",
        status: VARIABLE_STATUSES[3], // Unknown
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables).toHaveLength(1);
        expect(result.value.variables[0]?.id).toBe("v1");
        expect(result.value.variables[0]?.name).toBe("Runway");
        expect(result.value.variables[0]?.status).toBe(VARIABLE_STATUSES[3]);
        expect(result.value.variables[0]?.node).toEqual(DEFAULT_PERSONAL_NODE);
        // Original state unchanged (pure function)
        expect(state.variables).toHaveLength(0);
      }
    });

    it("trims whitespace from name", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createVariable(state, {
        variableId: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "  Runway  ",
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables[0]?.name).toBe("Runway");
      }
    });

    it("fails on empty name", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createVariable(state, {
        variableId: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "",
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("name cannot be empty");
      }
    });

    it("fails on whitespace-only name", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createVariable(state, {
        variableId: "v1",
        node: DEFAULT_PERSONAL_NODE,
        name: "   ",
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("name cannot be empty");
      }
    });

    it("fails on duplicate name within same node (case-insensitive)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createVariable(state, {
        variableId: "v2",
        node: DEFAULT_PERSONAL_NODE,
        name: "AGENCY", // Same name, different case
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });

    it("allows same name on different nodes", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "v1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Runway",
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

      const result = createVariable(state, {
        variableId: "v2",
        node: DEFAULT_ORG_NODE,
        name: "Runway", // Same name, different node
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables).toHaveLength(2);
      }
    });

    it("fails on duplicate variable ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createVariable(state, {
        variableId: "v1", // Duplicate ID
        node: DEFAULT_ORG_NODE,
        name: "New Variable",
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already exists");
      }
    });

    it("preserves existing variables when adding new one", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const result = createVariable(state, {
        variableId: "v2",
        node: DEFAULT_PERSONAL_NODE,
        name: "Runway",
        status: VARIABLE_STATUSES[3],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables).toHaveLength(2);
        expect(result.value.variables[0]?.name).toBe("Agency");
        expect(result.value.variables[1]?.name).toBe("Runway");
      }
    });
  });

  // =========================================================================
  // PROXY MANAGEMENT
  // =========================================================================

  describe("createProxy", () => {
    it("creates a proxy with required fields", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
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

      const result = createProxy(state, {
        proxyId: "proxy-1",
        variableId: "var-1",
        name: "Sleep hours",
        valueType: "numeric",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies).toHaveLength(1);
        expect(result.value.proxies[0]?.name).toBe("Sleep hours");
        expect(result.value.proxies[0]?.valueType).toBe("numeric");
      }
    });

    it("fails if variable does not exist", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = createProxy(state, {
        proxyId: "proxy-1",
        variableId: "var-nonexistent",
        name: "Sleep hours",
        valueType: "numeric",
      });

      expect(result.ok).toBe(false);
    });

    it("fails with empty name", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
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

      const result = createProxy(state, {
        proxyId: "proxy-1",
        variableId: "var-1",
        name: "  ",
        valueType: "numeric",
      });

      expect(result.ok).toBe(false);
    });

    it("fails with duplicate proxy ID", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Existing Proxy",
            valueType: "numeric",
          },
        ],
        proxyReadings: [],
      };

      const result = createProxy(state, {
        proxyId: "proxy-1",
        variableId: "var-1",
        name: "New Proxy",
        valueType: "boolean",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("updateProxy", () => {
    it("updates proxy name", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Old Name",
            valueType: "numeric",
          },
        ],
        proxyReadings: [],
      };

      const result = updateProxy(state, {
        proxyId: "proxy-1",
        name: "New Name",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies[0]?.name).toBe("New Name");
      }
    });

    it("fails for non-existent proxy", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = updateProxy(state, {
        proxyId: "proxy-nonexistent",
        name: "New Name",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("deleteProxy", () => {
    it("deletes a proxy and its readings", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
        ],
        proxyReadings: [
          {
            id: "reading-1",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 7 },
            recordedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      };

      const result = deleteProxy(state, {
        proxyId: "proxy-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies).toHaveLength(0);
        expect(result.value.proxyReadings).toHaveLength(0);
      }
    });

    it("fails for non-existent proxy", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = deleteProxy(state, {
        proxyId: "proxy-nonexistent",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("logProxyReading", () => {
    it("logs a numeric reading", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
        ],
        proxyReadings: [],
      };

      const result = logProxyReading(state, {
        readingId: "reading-1",
        proxyId: "proxy-1",
        value: { type: "numeric", value: 7.5 },
        recordedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxyReadings).toHaveLength(1);
        expect(result.value.proxyReadings[0]?.value).toEqual({
          type: "numeric",
          value: 7.5,
        });
      }
    });

    it("fails for non-existent proxy", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
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

      const result = logProxyReading(state, {
        readingId: "reading-1",
        proxyId: "proxy-nonexistent",
        value: { type: "numeric", value: 7 },
        recordedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
    });

    it("fails with mismatched value type", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
        ],
        proxyReadings: [],
      };

      const result = logProxyReading(state, {
        readingId: "reading-1",
        proxyId: "proxy-1",
        value: { type: "boolean", value: true },
        recordedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
    });
  });

  describe("getProxiesForVariable", () => {
    it("returns proxies for a variable", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0],
          },
          {
            id: "var-2",
            node: DEFAULT_PERSONAL_NODE,
            name: "Energy",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
          {
            id: "proxy-2",
            variableId: "var-1",
            name: "Sleep Quality Rating",
            valueType: "categorical",
          },
          {
            id: "proxy-3",
            variableId: "var-2",
            name: "Energy Level",
            valueType: "numeric",
          },
        ],
        proxyReadings: [],
      };

      const proxies = getProxiesForVariable(state, "var-1");
      expect(proxies).toHaveLength(2);
      expect(proxies[0]?.name).toBe("Sleep Hours");
      expect(proxies[1]?.name).toBe("Sleep Quality Rating");
    });
  });

  describe("getRecentReadings", () => {
    it("returns readings sorted by timestamp (newest first)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
        ],
        proxyReadings: [
          {
            id: "reading-1",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 6 },
            recordedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "reading-2",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 8 },
            recordedAt: "2025-01-03T00:00:00.000Z",
          },
          {
            id: "reading-3",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 7 },
            recordedAt: "2025-01-02T00:00:00.000Z",
          },
        ],
      };

      const readings = getRecentReadings(state, "proxy-1");
      expect(readings).toHaveLength(3);
      expect(readings[0]?.id).toBe("reading-2"); // Newest
      expect(readings[1]?.id).toBe("reading-3");
      expect(readings[2]?.id).toBe("reading-1"); // Oldest
    });

    it("limits results when limit is provided", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [
          {
            id: "proxy-1",
            variableId: "var-1",
            name: "Sleep Hours",
            valueType: "numeric",
          },
        ],
        proxyReadings: [
          {
            id: "reading-1",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 6 },
            recordedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "reading-2",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 8 },
            recordedAt: "2025-01-03T00:00:00.000Z",
          },
          {
            id: "reading-3",
            proxyId: "proxy-1",
            value: { type: "numeric", value: 7 },
            recordedAt: "2025-01-02T00:00:00.000Z",
          },
        ],
      };

      const readings = getRecentReadings(state, "proxy-1", 2);
      expect(readings).toHaveLength(2);
      expect(readings[0]?.id).toBe("reading-2");
      expect(readings[1]?.id).toBe("reading-3");
    });
  });

  describe("applySignal with audit trail", () => {
    it("creates audit note when status changes", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[0], // Low
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

      const result = applySignal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "var-1",
        status: VARIABLE_STATUSES[1], // InRange
        reason: "Sleep improved",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toHaveLength(1);
        expect(result.value.notes[0]?.content).toContain("Low → InRange");
        expect(result.value.notes[0]?.content).toContain("Sleep improved");
        expect(result.value.notes[0]?.tags).toContain("audit");
      }
    });

    it("does not create audit note when status unchanged", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Sleep Quality",
            status: VARIABLE_STATUSES[1], // InRange
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

      const result = applySignal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "var-1",
        status: VARIABLE_STATUSES[1], // Same status
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toHaveLength(0);
      }
    });
  });
});
