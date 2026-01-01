import { describe, it, expect } from "vitest";
import { parseCli, parseNodeRef } from "./cli.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  EPISODE_TYPES,
  VARIABLE_STATUSES,
} from "../memory/index.js";

describe("Sensorium CLI parsing", () => {
  describe("parseNodeRef", () => {
    it("parses Type:Id into NodeRef", () => {
      const result = parseNodeRef("Personal:personal");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(DEFAULT_PERSONAL_NODE);
      }
    });

    it("rejects invalid format", () => {
      const result = parseNodeRef("Personal");
      expect(result.ok).toBe(false);
    });
  });

  describe("parseCli", () => {
    it("defaults to status + default personal node", () => {
      const result = parseCli([]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("status");
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
      }
    });

    it("parses status with explicit node", () => {
      const result = parseCli(["status", "--node", "Org:org"]);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.kind).toBe("status");
        expect(result.value.node).toEqual(DEFAULT_ORG_NODE);
      }
    });

    it("parses signal command", () => {
      const result = parseCli([
        "signal",
        "--node",
        "Personal:personal",
        "--variableId",
        "v1",
        "--status",
        VARIABLE_STATUSES[1],
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "signal") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.variableId).toBe("v1");
        expect(result.value.status).toBe(VARIABLE_STATUSES[1]);
      }
    });

    it("parses act command", () => {
      const result = parseCli([
        "act",
        "--node",
        "Personal:personal",
        "--episodeId",
        "e1",
        "--description",
        "Do the thing",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "act") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.episodeId).toBe("e1");
        expect(result.value.description).toBe("Do the thing");
      }
    });

    it("parses act command without episodeId", () => {
      const result = parseCli([
        "act",
        "--node",
        "Personal:personal",
        "--description",
        "Do the thing",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "act") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.episodeId).toBeUndefined();
        expect(result.value.description).toBe("Do the thing");
      }
    });

    it("parses open command for Explore episode", () => {
      const result = parseCli([
        "open",
        "--node",
        "Personal:personal",
        "--type",
        "Explore",
        "--objective",
        "Learn something new",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "open") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.type).toBe(EPISODE_TYPES[1]);
        expect(result.value.objective).toBe("Learn something new");
        expect(result.value.variableId).toBeUndefined();
      }
    });

    it("parses open command for Stabilize episode", () => {
      const result = parseCli([
        "open",
        "--node",
        "Personal:personal",
        "--type",
        "Stabilize",
        "--variableId",
        "v1",
        "--objective",
        "Restore agency",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "open") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.type).toBe(EPISODE_TYPES[0]);
        expect(result.value.variableId).toBe("v1");
        expect(result.value.objective).toBe("Restore agency");
      }
    });

    it("fails open Stabilize without variableId", () => {
      const result = parseCli([
        "open",
        "--node",
        "Personal:personal",
        "--type",
        "Stabilize",
        "--objective",
        "Restore agency",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("variableId");
      }
    });

    it("fails open without type", () => {
      const result = parseCli([
        "open",
        "--node",
        "Personal:personal",
        "--objective",
        "Learn something",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--type");
      }
    });

    it("fails open without objective", () => {
      const result = parseCli([
        "open",
        "--node",
        "Personal:personal",
        "--type",
        "Explore",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--objective");
      }
    });

    it("parses close command", () => {
      const result = parseCli([
        "close",
        "--node",
        "Personal:personal",
        "--episodeId",
        "ep-123",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "close") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.episodeId).toBe("ep-123");
      }
    });

    it("fails close without episodeId", () => {
      const result = parseCli(["close", "--node", "Personal:personal"]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--episodeId");
      }
    });
  });
});
