import { describe, it, expect } from "vitest";
import { parseCli, parseNodeRef, parseObservation } from "./cli.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  EPISODE_TYPES,
  NOTE_TAGS,
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
        "--note",
        "What I learned from this episode",
      ]);
      expect(result.ok).toBe(true);
      if (result.ok && result.value.kind === "close") {
        expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
        expect(result.value.episodeId).toBe("ep-123");
        expect(result.value.noteContent).toBe(
          "What I learned from this episode",
        );
      }
    });

    it("fails close without episodeId", () => {
      const result = parseCli([
        "close",
        "--node",
        "Personal:personal",
        "--note",
        "Some learning",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--episodeId");
      }
    });

    it("fails close without note", () => {
      const result = parseCli([
        "close",
        "--node",
        "Personal:personal",
        "--episodeId",
        "ep-123",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("--note");
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // OBSERVATION PARSING TESTS (MP9)
  // ═══════════════════════════════════════════════════════════════════════════

  describe("parseObservation", () => {
    describe("variableProxySignal", () => {
      it("parses valid signal observation", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--variableId",
          "v1",
          "--status",
          VARIABLE_STATUSES[1],
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "variableProxySignal") {
          expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
          expect(result.value.variableId).toBe("v1");
          expect(result.value.status).toBe(VARIABLE_STATUSES[1]);
        }
      });

      it("parses signal with explicit node", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--node",
          "Org:org",
          "--variableId",
          "v1",
          "--status",
          "High",
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "variableProxySignal") {
          expect(result.value.node).toEqual(DEFAULT_ORG_NODE);
          expect(result.value.status).toBe("High");
        }
      });

      it("rejects signal without variableId", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--status",
          "InRange",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--variableId");
        }
      });

      it("rejects signal without status", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--variableId",
          "v1",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--status");
        }
      });

      it("rejects signal with invalid status", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--variableId",
          "v1",
          "--status",
          "InvalidStatus",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Invalid status");
          expect(result.error).toContain("InvalidStatus");
        }
      });
    });

    describe("freeformNote", () => {
      it("parses valid note observation", () => {
        const result = parseObservation([
          "observe",
          "note",
          "--content",
          "This is a test observation",
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "freeformNote") {
          expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
          expect(result.value.content).toBe("This is a test observation");
          expect(result.value.tags).toBeUndefined();
        }
      });

      it("parses note with tags", () => {
        const result = parseObservation([
          "observe",
          "note",
          "--content",
          "Inbox item",
          "--tags",
          "inbox,pending_approval",
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "freeformNote") {
          expect(result.value.content).toBe("Inbox item");
          expect(result.value.tags).toEqual([NOTE_TAGS[0], NOTE_TAGS[1]]);
        }
      });

      it("rejects note without content", () => {
        const result = parseObservation(["observe", "note"]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--content");
        }
      });

      it("rejects note with empty content", () => {
        const result = parseObservation([
          "observe",
          "note",
          "--content",
          "   ",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--content");
        }
      });

      it("rejects note with invalid tag", () => {
        const result = parseObservation([
          "observe",
          "note",
          "--content",
          "Test",
          "--tags",
          "inbox,invalid_tag",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Invalid tag");
          expect(result.error).toContain("invalid_tag");
        }
      });
    });

    describe("episodeProposal", () => {
      it("parses valid Explore episode proposal", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--type",
          "Explore",
          "--objective",
          "Learn something new",
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "episodeProposal") {
          expect(result.value.node).toEqual(DEFAULT_PERSONAL_NODE);
          expect(result.value.episodeType).toBe(EPISODE_TYPES[1]);
          expect(result.value.objective).toBe("Learn something new");
          expect(result.value.variableId).toBeUndefined();
        }
      });

      it("parses valid Stabilize episode proposal", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--type",
          "Stabilize",
          "--variableId",
          "v1",
          "--objective",
          "Restore agency",
        ]);
        expect(result.ok).toBe(true);
        if (result.ok && result.value.type === "episodeProposal") {
          expect(result.value.episodeType).toBe(EPISODE_TYPES[0]);
          expect(result.value.variableId).toBe("v1");
          expect(result.value.objective).toBe("Restore agency");
        }
      });

      it("rejects episode proposal without type", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--objective",
          "Learn something",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--type");
        }
      });

      it("rejects episode proposal with invalid type", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--type",
          "InvalidType",
          "--objective",
          "Test",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Invalid episode type");
        }
      });

      it("rejects episode proposal without objective", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--type",
          "Explore",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("--objective");
        }
      });

      it("rejects Stabilize episode without variableId", () => {
        const result = parseObservation([
          "observe",
          "episode",
          "--type",
          "Stabilize",
          "--objective",
          "Fix it",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("variableId");
        }
      });
    });

    describe("error handling", () => {
      it("rejects non-observe command", () => {
        const result = parseObservation(["status"]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Expected 'observe'");
        }
      });

      it("rejects unknown observe subcommand", () => {
        const result = parseObservation(["observe", "unknown"]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Unknown observe subcommand");
        }
      });

      it("rejects observe with invalid node format", () => {
        const result = parseObservation([
          "observe",
          "signal",
          "--node",
          "invalid",
          "--variableId",
          "v1",
          "--status",
          "InRange",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Invalid node format");
        }
      });

      it("rejects observe with invalid node type", () => {
        const result = parseObservation([
          "observe",
          "note",
          "--node",
          "Unknown:test",
          "--content",
          "Test",
        ]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.error).toContain("Invalid node type");
        }
      });
    });
  });
});
