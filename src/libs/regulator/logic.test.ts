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
  createModel,
  updateModel,
  createNote,
  addNoteTag,
  removeNoteTag,
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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
        models: [],
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

  describe("createModel", () => {
    it("creates a model with valid params", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [],
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
});
