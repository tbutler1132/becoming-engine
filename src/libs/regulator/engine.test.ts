import { describe, it, expect, vi } from "vitest";
import { Regulator } from "./engine.js";
import type { Logger } from "./engine.js";
import { DEFAULT_REGULATOR_POLICY } from "./policy.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
      };

      const regulator = new Regulator();
      const result = regulator.canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });

    it("supports policy overrides (prepared for multi-node networks)", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
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

      const regulator = new Regulator();
      const result = regulator.canAct(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });
  });

  describe("openEpisode", () => {
    it("returns Result<State> on success", () => {
      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
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
        variables: [],
        episodes: [],
        actions: [],
        notes: [],
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
});
