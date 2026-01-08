import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  JsonStore,
  // Seed constants
  SEED_AGENCY_NAME,
  SEED_EXECUTION_CAPACITY_NAME,
  SEED_PERSONAL_NODE,
  SEED_ORG_NODE,
  SEED_STATUS,
  DEFAULT_PERSONAL_NODE,
  ACTION_STATUSES,
  EPISODE_STATUSES,
  EPISODE_TYPES,
  NODE_TYPES,
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
} from "./index.js";
import type { State } from "./index.js";

// Mock fs-extra
vi.mock("fs-extra", () => ({
  default: {
    pathExists: vi.fn(),
    readJson: vi.fn(),
    ensureDir: vi.fn(),
    writeJson: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
  },
}));

vi.mock("node:fs/promises", () => ({
  open: vi.fn(),
}));

import fs from "fs-extra";
import { open as openFile } from "node:fs/promises";

describe("JsonStore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createSeed (via load)", () => {
    it("generates valid state with Agency and Execution Capacity variables", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);

      const store = new JsonStore();
      const state = await store.load();

      expect(state.variables).toHaveLength(2);
      expect(state.episodes).toHaveLength(0);
      expect(state.actions).toHaveLength(0);
      expect(state.notes).toHaveLength(0);

      const agencyVar = state.variables.find(
        (v) => v.name === SEED_AGENCY_NAME,
      );
      expect(agencyVar).toBeDefined();
      expect(agencyVar?.node).toBe(SEED_PERSONAL_NODE);
      expect(agencyVar?.status).toBe(SEED_STATUS);

      const execVar = state.variables.find(
        (v) => v.name === SEED_EXECUTION_CAPACITY_NAME,
      );
      expect(execVar).toBeDefined();
      expect(execVar?.node).toBe(SEED_ORG_NODE);
      expect(execVar?.status).toBe(SEED_STATUS);
    });

    it("generates unique IDs for each variable", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);

      const store = new JsonStore();
      const state = await store.load();

      const ids = state.variables.map((v) => v.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
      // Verify IDs look like UUIDs (basic format check)
      for (const id of ids) {
        expect(id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }
    });
  });

  describe("load", () => {
    it("returns seed when file is missing", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(false as never);

      const store = new JsonStore();
      const state = await store.load();

      expect(fs.pathExists).toHaveBeenCalled();
      expect(fs.readJson).not.toHaveBeenCalled();
      expect(state.variables).toHaveLength(2);
      expect(state.schemaVersion).toBe(SCHEMA_VERSION);
    });

    it("reads existing state from file", async () => {
      const existingState: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "test-1",
            node: DEFAULT_PERSONAL_NODE,
            name: "Test Var",
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

      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readJson).mockResolvedValue(existingState as never);

      const store = new JsonStore();
      const state = await store.load();

      expect(fs.readJson).toHaveBeenCalled();
      expect(state).toEqual(existingState);
    });

    it("migrates a v0 state (missing schemaVersion) to v2", async () => {
      const v0State = {
        variables: [
          {
            id: "test-1",
            node: NODE_TYPES[0],
            name: "Test Var",
            status: VARIABLE_STATUSES[0],
          },
        ],
        episodes: [],
        actions: [],
        notes: [],
      };

      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readJson).mockResolvedValue(v0State as never);

      const store = new JsonStore();
      const state = await store.load();

      expect(state.schemaVersion).toBe(SCHEMA_VERSION);
      expect(state.variables).toHaveLength(1);
      expect(state.variables[0]?.name).toBe("Test Var");
      expect(state.variables[0]?.status).toBe(VARIABLE_STATUSES[0]);
      expect(state.variables[0]?.node).toEqual(DEFAULT_PERSONAL_NODE);
    });

    it("backs up invalid state file and returns seed", async () => {
      vi.mocked(fs.pathExists).mockResolvedValue(true as never);
      vi.mocked(fs.readJson).mockResolvedValue({
        // invalid: missing required arrays
        variables: "nope",
      } as never);
      vi.mocked(fs.move).mockResolvedValue(undefined as never);

      const store = new JsonStore({
        logger: { info() {}, warn() {}, error() {} },
      });
      const state = await store.load();

      expect(state.schemaVersion).toBe(SCHEMA_VERSION);
      expect(state.variables).toHaveLength(2);
      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining("state.json"),
        expect.stringContaining("state.json.corrupt-"),
        { overwrite: false },
      );
    });
  });

  describe("save", () => {
    it("writes valid JSON structure to file", async () => {
      vi.mocked(fs.ensureDir).mockResolvedValue(undefined as never);
      vi.mocked(fs.writeJson).mockResolvedValue(undefined as never);
      vi.mocked(fs.move).mockResolvedValue(undefined as never);

      vi.mocked(openFile).mockResolvedValue({
        writeFile: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
      } as never);

      const state: State = {
        schemaVersion: SCHEMA_VERSION,
        nodes: [],
        variables: [
          {
            id: "var-1",
            node: DEFAULT_PERSONAL_NODE,
            name: SEED_AGENCY_NAME,
            status: SEED_STATUS,
          },
        ],
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test objective",
            status: EPISODE_STATUSES[0],
            openedAt: "2025-01-01T00:00:00.000Z",
          },
        ],
        actions: [
          {
            id: "act-1",
            description: "Test action",
            status: ACTION_STATUSES[0],
            episodeId: "ep-1",
          },
        ],
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

      const store = new JsonStore();
      await store.save(state);

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining("state.json.tmp-"),
        state,
        { spaces: 2 },
      );
      expect(fs.move).toHaveBeenCalledWith(
        expect.stringContaining("state.json.tmp-"),
        expect.stringContaining("state.json"),
        { overwrite: true },
      );
      expect(openFile).toHaveBeenCalledWith(
        expect.stringContaining("state.json.lock"),
        "wx",
      );
    });
  });
});
