import { describe, it, expect } from "vitest";
import { formatStatus } from "./format.js";
import type { StatusData } from "../../libs/regulator/index.js";
import type {
  Variable,
  Episode,
  Action,
  NodeRef,
} from "../../libs/memory/index.js";

const testNode: NodeRef = { type: "Personal", id: "personal" };

describe("formatStatus", () => {
  describe("baseline mode", () => {
    it("returns minimal quiet output", () => {
      const data: StatusData = { mode: "baseline", node: testNode };
      const result = formatStatus(data);

      expect(result).toBe(
        "becoming status Personal:personal\nSilence is Success (baseline).",
      );
    });

    it("includes node type and id in header", () => {
      const orgNode: NodeRef = { type: "Org", id: "myorg" };
      const data: StatusData = { mode: "baseline", node: orgNode };
      const result = formatStatus(data);

      expect(result).toContain("becoming status Org:myorg");
      expect(result).toContain("Silence is Success (baseline).");
    });
  });

  describe("active mode", () => {
    const baseVariable: Variable = {
      id: "v1",
      node: testNode,
      name: "Energy",
      status: "InRange",
    };

    const baseEpisode: Episode = {
      id: "ep1",
      node: testNode,
      type: "Explore",
      objective: "Learn TypeScript patterns",
      status: "Active",
      openedAt: "2026-01-01T00:00:00Z",
    };

    const baseAction: Action = {
      id: "a1",
      description: "Read the docs",
      status: "Pending",
      episodeId: "ep1",
    };

    it("includes header with node reference", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [baseEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("becoming status Personal:personal");
    });

    it("displays Variables section with status", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [baseVariable],
        episodes: [baseEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("Variables:");
      expect(result).toContain("- v1: Energy = InRange");
    });

    it("displays (none) when no variables exist", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [baseEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("Variables:");
      expect(result).toContain("(none)");
    });

    it("displays Active Episodes with type and objective", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [baseEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("Active Episodes:");
      expect(result).toContain("- ep1: Explore — Learn TypeScript patterns");
    });

    it("displays Stabilize episodes with variableId", () => {
      const stabilizeEpisode: Episode = {
        id: "ep2",
        node: testNode,
        type: "Stabilize",
        variableId: "v1",
        objective: "Restore energy levels",
        status: "Active",
        openedAt: "2026-01-01T00:00:00Z",
      };
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [stabilizeEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("- ep2: Stabilize [v1] — Restore energy levels");
    });

    it("displays Pending Actions with episode reference", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [baseEpisode],
        actions: [baseAction],
      };
      const result = formatStatus(data);

      expect(result).toContain("Pending Actions:");
      expect(result).toContain("- [ep1] Read the docs");
    });

    it("displays (none) when no pending actions exist", () => {
      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [],
        episodes: [baseEpisode],
        actions: [],
      };
      const result = formatStatus(data);

      expect(result).toContain("Pending Actions:");
      expect(result).toContain("(none)");
    });

    it("displays multiple items in each section", () => {
      const variable2: Variable = {
        id: "v2",
        node: testNode,
        name: "Focus",
        status: "Low",
      };
      const episode2: Episode = {
        id: "ep2",
        node: testNode,
        type: "Stabilize",
        variableId: "v2",
        objective: "Improve focus",
        status: "Active",
        openedAt: "2026-01-01T00:00:00Z",
      };
      const action2: Action = {
        id: "a2",
        description: "Take a break",
        status: "Pending",
        episodeId: "ep2",
      };

      const data: StatusData = {
        mode: "active",
        node: testNode,
        variables: [baseVariable, variable2],
        episodes: [baseEpisode, episode2],
        actions: [baseAction, action2],
      };
      const result = formatStatus(data);

      // Variables
      expect(result).toContain("- v1: Energy = InRange");
      expect(result).toContain("- v2: Focus = Low");

      // Episodes
      expect(result).toContain("- ep1: Explore — Learn TypeScript patterns");
      expect(result).toContain("- ep2: Stabilize [v2] — Improve focus");

      // Actions
      expect(result).toContain("- [ep1] Read the docs");
      expect(result).toContain("- [ep2] Take a break");
    });
  });
});
