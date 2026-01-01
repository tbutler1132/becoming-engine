import { describe, it, expect, vi } from "vitest";
import { Regulator } from "./engine.js";
import type { Logger } from "./engine.js";
import {
  NODE_TYPES,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  SCHEMA_VERSION,
} from "../memory/index.js";
import type { State } from "../memory/index.js";

describe("Regulator (Class Integration)", () => {
  describe("getVariables", () => {
    it("filters by node correctly", () => {
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

      const regulator = new Regulator();
      const vars = regulator.getVariables(state, NODE_TYPES[0]);
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
      const result = regulator.canStartExplore(state, NODE_TYPES[0]);
      expect(result.ok).toBe(true);
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
          },
        ],
        actions: [],
        notes: [],
      };

      const regulator = new Regulator();
      const result = regulator.canAct(state, NODE_TYPES[0]);
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
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "Test objective",
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
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "Test",
      });

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Episode opened")
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
        node: NODE_TYPES[0],
        type: EPISODE_TYPES[0],
        objective: "", // Empty objective should fail
      });

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("Episode open failed")
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
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
          },
        ],
        actions: [],
        notes: [],
      };

      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, "e1");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.status).toBe(EPISODE_STATUSES[1]);
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
            node: NODE_TYPES[0],
            name: "Agency",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [
          {
            id: "e1",
            node: NODE_TYPES[0],
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[0],
          },
        ],
        actions: [],
        notes: [],
      };

      const regulator = new Regulator({ logger: mockLogger });
      regulator.closeEpisode(state, "e1", [{ id: "v1", status: "InRange" }]);

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("Episode closed")
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining("1 variable(s) updated")
      );
    });

    it("uses silent logger by default (cybernetic quiet)", () => {
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
        ],
        actions: [],
        notes: [],
      };

      // Should not throw even without logger
      const regulator = new Regulator();
      const result = regulator.closeEpisode(state, "e1");
      expect(result.ok).toBe(true);
    });
  });
});

