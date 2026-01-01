import { describe, it, expect } from "vitest";
import { parseCli, parseNodeRef } from "./cli.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
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
  });
});
