import { describe, it, expect, vi } from "vitest";
import { Regulator } from "./engine.js";
import type { Logger } from "../shared/index.js";
import { DEFAULT_REGULATOR_POLICY } from "./policy.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  SCHEMA_VERSION,
} from "../memory/index.js";

const ACTIVE_STATUS = EPISODE_STATUSES[0];
const CLOSED_STATUS = EPISODE_STATUSES[1];
import type { State } from "../memory/index.js";

describe("Regulator (Class Integration)", () => {
  describe("getVariables", () => {
    it("filters by node correctly", () => {
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

      const regulator = new Regulator();
      const vars = regulator.getVariables(state, DEFAULT_PERSONAL_NODE);
      expect(vars).toHaveLength(1);
      expect(vars[0]?.name).toBe("Agency");
    });
  });

  describe("canStartExplore", () => {
    it("returns Result correctly", () => {
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

      const regulator = new Regulator();
      const result = regulator.canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });

    it("supports policy overrides (prepared for multi-node networks)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
            objective: "Test",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
          {
            id: "e2",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1],
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

      const regulatorDefault = new Regulator();
      expect(
        regulatorDefault.canStartExplore(state, DEFAULT_PERSONAL_NODE).ok,
      ).toBe(false);

      const regulatorOverride = new Regulator({
        policy: {
          ...DEFAULT_REGULATOR_POLICY,
          maxActiveExplorePerNodeByNode: {
            [`${DEFAULT_PERSONAL_NODE.type}:${DEFAULT_PERSONAL_NODE.id}`]: 3,
          },
        },
      });
      expect(
        regulatorOverride.canStartExplore(state, DEFAULT_PERSONAL_NODE).ok,
      ).toBe(true);
    });
  });

  describe("canAct", () => {
    it("returns Result correctly", () => {
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

      const regulator = new Regulator();
      const result = regulator.canAct(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });
  });

  describe("openEpisode", () => {
    it("returns Result<State> on success", () => {
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

      const regulator = new Regulator();
      const result = regulator.openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "Test objective",
        openedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes).toHaveLength(1);
      }
    });

    it("logs to injected logger on success", () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

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

      const regulator = new Regulator({ logger: mockLogger });
      regulator.openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "Test",
        openedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Episode opened"),
      );
    });

    it("logs warning on failure", () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

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

      const regulator = new Regulator({ logger: mockLogger });
      regulator.openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[0],
        variableId: "v1",
        objective: "", // Empty objective should fail
        openedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Episode open failed"),
      );
    });
  });

  describe("closeEpisode", () => {
    it("returns Result<State> on success", () => {
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

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned something valuable" },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.status).toBe(CLOSED_STATUS);
        expect(result.value.episodes[0]?.closedAt).toBe(
          "2025-01-01T12:00:00.000Z",
        );
        expect(result.value.episodes[0]?.closureNoteId).toBe("note-1");
        expect(result.value.notes).toHaveLength(1);
      }
    });

    it("logs to injected logger", () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

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

      const regulator = new Regulator({ logger: mockLogger });
      regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Variable restored" },
        variableUpdates: [{ id: "v1", status: VARIABLE_STATUSES[1] }],
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Episode closed"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 variable(s) updated"),
      );
    });

    it("uses silent logger by default (cybernetic quiet)", () => {
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

      // Should not throw even without logger
      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned something" },
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("updateEpisode", () => {
    it("calls logic function correctly", () => {
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

      const regulator = new Regulator();
      const result = regulator.updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.objective).toBe("Updated objective");
      }
    });

    it("logs on success", () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

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

      const regulator = new Regulator({ logger: mockLogger });
      regulator.updateEpisode(state, {
        episodeId: "e1",
        objective: "Updated objective",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Episode updated"),
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("objective"),
      );
    });

    it("logs on failure", () => {
      const mockLogger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

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

      const regulator = new Regulator({ logger: mockLogger });
      regulator.updateEpisode(state, {
        episodeId: "nonexistent",
        objective: "Updated objective",
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Episode update failed"),
      );
    });
  });

  // =========================================================================
  // Acceptance Test: Closing Explore Creates Model (MP6)
  // =========================================================================
  describe("closeEpisode with Model creation (MP6)", () => {
    it("closing an Explore can create a new Model", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Discover what drives commitment",
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

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Learned about commitment" },
        modelUpdates: [
          {
            id: "model-1",
            type: MODEL_TYPES[0], // Descriptive
            statement: "Publishing under my name increases commitment",
            confidence: 0.7,
            scope: MODEL_SCOPES[0], // personal
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Model was created
        expect(result.value.models).toHaveLength(1);
        expect(result.value.models[0]?.id).toBe("model-1");
        expect(result.value.models[0]?.statement).toBe(
          "Publishing under my name increases commitment",
        );
        expect(result.value.models[0]?.confidence).toBe(0.7);
        expect(result.value.models[0]?.scope).toBe(MODEL_SCOPES[0]);
        // Episode was closed
        expect(result.value.episodes[0]?.status).toBe(CLOSED_STATUS);
        // Note was created
        expect(result.value.notes).toHaveLength(1);
      }
    });

    it("closing an Explore can update an existing Model", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Refine understanding of commitment",
            status: ACTIVE_STATUS,
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [],
        notes: [],
        models: [
          {
            id: "model-1",
            type: MODEL_TYPES[0],
            statement: "Publishing increases commitment",
            confidence: 0.5,
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: { id: "note-1", content: "Confirmed hypothesis" },
        modelUpdates: [
          {
            id: "model-1", // Same ID as existing model
            type: MODEL_TYPES[0],
            statement: "Publishing under my own name increases commitment",
            confidence: 0.85, // Increased confidence
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        // Model was updated (not duplicated)
        expect(result.value.models).toHaveLength(1);
        expect(result.value.models[0]?.statement).toBe(
          "Publishing under my own name increases commitment",
        );
        expect(result.value.models[0]?.confidence).toBe(0.85);
      }
    });

    it("closing an Explore can create multiple Models", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "e1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[1], // Explore
            objective: "Explore workflow patterns",
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

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "e1",
        closedAt: "2025-01-01T12:00:00.000Z",
        closureNote: {
          id: "note-1",
          content: "Discovered multiple workflow insights",
        },
        modelUpdates: [
          {
            id: "model-1",
            type: MODEL_TYPES[0], // Descriptive
            statement: "Morning focus blocks are most productive",
            confidence: 0.8,
          },
          {
            id: "model-2",
            type: MODEL_TYPES[1], // Procedural
            statement: "Break complex tasks into 25-minute chunks",
            confidence: 0.6,
          },
        ],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models).toHaveLength(2);
        expect(result.value.models[0]?.id).toBe("model-1");
        expect(result.value.models[1]?.id).toBe("model-2");
      }
    });
  });

  // =========================================================================
  // PROXY MANAGEMENT
  // =========================================================================

  describe("createProxy", () => {
    it("creates a proxy via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.createProxy(state, {
        proxyId: "proxy-1",
        variableId: "var-1",
        name: "Sleep hours",
        valueType: "numeric",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies).toHaveLength(1);
      }
    });

    it("logs warning when creation fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.createProxy(state, {
        proxyId: "proxy-1",
        variableId: "nonexistent",
        name: "Sleep hours",
        valueType: "numeric",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("updateProxy", () => {
    it("updates a proxy via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.updateProxy(state, {
        proxyId: "proxy-1",
        name: "New Name",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies[0]?.name).toBe("New Name");
      }
    });

    it("logs warning when update fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.updateProxy(state, {
        proxyId: "nonexistent",
        name: "New Name",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("deleteProxy", () => {
    it("deletes a proxy via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.deleteProxy(state, {
        proxyId: "proxy-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxies).toHaveLength(0);
      }
    });

    it("logs warning when deletion fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.deleteProxy(state, {
        proxyId: "nonexistent",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("logProxyReading", () => {
    it("logs a reading via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.logProxyReading(state, {
        readingId: "reading-1",
        proxyId: "proxy-1",
        value: { type: "numeric", value: 7.5 },
        recordedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.proxyReadings).toHaveLength(1);
      }
    });

    it("logs warning when reading logging fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.logProxyReading(state, {
        readingId: "reading-1",
        proxyId: "nonexistent",
        value: { type: "numeric", value: 7.5 },
        recordedAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("getProxiesForVariable", () => {
    it("returns proxies via regulator", () => {
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

      const regulator = new Regulator();
      const proxies = regulator.getProxiesForVariable(state, "var-1");
      expect(proxies).toHaveLength(1);
    });
  });

  describe("getRecentReadings", () => {
    it("returns readings via regulator", () => {
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
            value: { type: "numeric", value: 7 },
            recordedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
      };

      const regulator = new Regulator();
      const readings = regulator.getRecentReadings(state, "proxy-1");
      expect(readings).toHaveLength(1);
    });
  });

  // =========================================================================
  // SIGNAL
  // =========================================================================

  describe("signal", () => {
    it("applies signal via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
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

      const regulator = new Regulator();
      const result = regulator.signal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "var-1",
        status: VARIABLE_STATUSES[1], // InRange
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables[0]?.status).toBe("InRange");
      }
    });

    it("logs warning when signal fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.signal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "nonexistent",
        status: VARIABLE_STATUSES[1],
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CREATE VARIABLE
  // =========================================================================

  describe("createVariable", () => {
    it("creates variable via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.createVariable(state, {
        variableId: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "Agency",
        status: VARIABLE_STATUSES[1],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.variables).toHaveLength(1);
      }
    });

    it("logs warning when creation fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.createVariable(state, {
        variableId: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "", // Empty name should fail
        status: VARIABLE_STATUSES[1],
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // ACT (CREATE ACTION)
  // =========================================================================

  describe("act", () => {
    it("creates action via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.act(state, {
        actionId: "action-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "Test action",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions).toHaveLength(1);
      }
    });

    it("logs warning when action fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.act(state, {
        actionId: "action-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "", // Empty description should fail
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // COMPLETE ACTION
  // =========================================================================

  describe("completeAction", () => {
    it("completes action via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [
          {
            id: "action-1",
            description: "Test action",
            status: "Pending",
          },
        ],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const regulator = new Regulator();
      const result = regulator.completeAction(state, {
        actionId: "action-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions[0]?.status).toBe("Done");
      }
    });

    it("logs warning when completion fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.completeAction(state, {
        actionId: "nonexistent",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // NOTE OPERATIONS
  // =========================================================================

  describe("createNote", () => {
    it("creates note via regulator", () => {
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

      const regulator = new Regulator();
      const result = regulator.createNote(state, {
        noteId: "note-1",
        content: "Test note",
        createdAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toHaveLength(1);
      }
    });

    it("logs warning when creation fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.createNote(state, {
        noteId: "note-1",
        content: "", // Empty content should fail
        createdAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("addNoteTag", () => {
    it("adds tag via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "note-1",
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

      const regulator = new Regulator();
      const result = regulator.addNoteTag(state, {
        noteId: "note-1",
        tag: "inbox",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.tags).toContain("inbox");
      }
    });

    it("logs warning when add tag fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.addNoteTag(state, {
        noteId: "nonexistent",
        tag: "inbox",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("removeNoteTag", () => {
    it("removes tag via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "note-1",
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

      const regulator = new Regulator();
      const result = regulator.removeNoteTag(state, {
        noteId: "note-1",
        tag: "inbox",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.tags).not.toContain("inbox");
      }
    });

    it("logs warning when remove tag fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.removeNoteTag(state, {
        noteId: "nonexistent",
        tag: "inbox",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("addNoteLinkedObject", () => {
    it("links object via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Agency",
            status: VARIABLE_STATUSES[1],
          },
        ],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "note-1",
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

      const regulator = new Regulator();
      const result = regulator.addNoteLinkedObject(state, {
        noteId: "note-1",
        objectId: "var-1",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.linkedObjects).toContain("var-1");
      }
    });

    it("logs warning when link fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.addNoteLinkedObject(state, {
        noteId: "nonexistent",
        objectId: "var-1",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  describe("updateNote", () => {
    it("updates note via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [
          {
            id: "note-1",
            content: "Old content",
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

      const regulator = new Regulator();
      const result = regulator.updateNote(state, {
        noteId: "note-1",
        content: "New content",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes[0]?.content).toBe("New content");
      }
    });

    it("logs warning when update fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.updateNote(state, {
        noteId: "nonexistent",
        content: "New content",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // LOG EXCEPTION
  // =========================================================================

  describe("logException", () => {
    it("logs exception via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
        models: [
          {
            id: "model-1",
            type: MODEL_TYPES[2], // Normative
            statement: "Test model",
          },
        ],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      };

      const regulator = new Regulator();
      const result = regulator.logException(state, {
        exceptionId: "ex-1",
        modelId: "model-1",
        originalDecision: "warn",
        justification: "Test justification",
        mutationType: "episode",
        mutationId: "ep-1",
        createdAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.exceptions).toHaveLength(1);
      }
    });

    it("logs warning when exception logging fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.logException(state, {
        exceptionId: "ex-1",
        modelId: "nonexistent",
        originalDecision: "warn",
        justification: "Test justification",
        mutationType: "episode",
        mutationId: "ep-1",
        createdAt: "2025-01-01T00:00:00.000Z",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // UPDATE EPISODE
  // =========================================================================

  describe("updateEpisode", () => {
    it("updates episode via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
            objective: "Old objective",
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

      const regulator = new Regulator();
      const result = regulator.updateEpisode(state, {
        episodeId: "ep-1",
        objective: "New objective",
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.objective).toBe("New objective");
      }
    });

    it("updates episode timebox via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
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

      const regulator = new Regulator();
      const result = regulator.updateEpisode(state, {
        episodeId: "ep-1",
        timeboxDays: 14,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.timeboxDays).toBe(14);
      }
    });

    it("logs warning when update fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.updateEpisode(state, {
        episodeId: "nonexistent",
        objective: "New objective",
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CLOSE EPISODE
  // =========================================================================

  describe("closeEpisode", () => {
    it("closes episode via regulator", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
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

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, {
        episodeId: "ep-1",
        closedAt: "2025-01-02T00:00:00.000Z",
        closureNote: {
          id: "note-1",
          content: "Closing note",
        },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.status).toBe("Closed");
      }
    });

    it("logs warning when close fails", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
      });

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

      const result = regulator.closeEpisode(state, {
        episodeId: "nonexistent",
        closedAt: "2025-01-02T00:00:00.000Z",
        closureNote: {
          id: "note-1",
          content: "Closing note",
        },
      });

      expect(result.ok).toBe(false);
      expect(mockWarn).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // IS BASELINE
  // =========================================================================

  describe("isBaseline", () => {
    it("returns true when no active episodes", () => {
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

      const regulator = new Regulator();
      const result = regulator.isBaseline(state, DEFAULT_PERSONAL_NODE);
      expect(result).toBe(true);
    });

    it("returns false when there are active episodes", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [],
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0], // Stabilize
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

      const regulator = new Regulator();
      const result = regulator.isBaseline(state, DEFAULT_PERSONAL_NODE);
      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // INVALID POLICY FALLBACK
  // =========================================================================

  describe("invalid policy fallback", () => {
    it("falls back to default policy when invalid policy provided", () => {
      const mockWarn = vi.fn();
      const regulator = new Regulator({
        logger: {
          info: vi.fn(),
          warn: mockWarn,
          error: vi.fn(),
        },
        policy: {
          maxActiveExplorePerNode: -1, // Invalid
          maxActiveExplorePerNodeByType: {},
          maxActiveExplorePerNodeByNode: {},
          maxActiveStabilizePerVariable: 1,
          maxActiveStabilizePerVariableByType: {},
          maxActiveStabilizePerVariableByNode: {},
        },
      });

      expect(mockWarn).toHaveBeenCalled();

      // Regulator should still work because it fell back to default
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

      const result = regulator.canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });
  });
});
