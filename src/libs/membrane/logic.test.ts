import { describe, it, expect } from "vitest";
import { checkEpisodeConstraints } from "./logic.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  SCHEMA_VERSION,
} from "../memory/index.js";
import type { State, Model } from "../memory/index.js";

/**
 * Creates an empty state for testing.
 */
function emptyState(): State {
  return {
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
}

/**
 * Creates a Normative Model with the given properties.
 */
function normativeModel(
  id: string,
  statement: string,
  scope: "personal" | "org" | "domain",
  enforcement: "none" | "warn" | "block",
): Model {
  return {
    id,
    type: "Normative",
    statement,
    scope,
    enforcement,
  };
}

describe("Membrane Logic (Pure Functions)", () => {
  describe("checkEpisodeConstraints", () => {
    describe("allow scenarios", () => {
      it("allows when no Normative Models exist", () => {
        const state = emptyState();
        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });

      it("allows when Normative Models have enforcement: none", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Informational constraint", "personal", "none"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });

      it("allows when no models match the node scope", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Org-only constraint", "org", "block"),
        ];

        // Personal node should not be blocked by org-scoped model
        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });
    });

    describe("warn scenarios", () => {
      it("warns when Normative Model has enforcement: warn", () => {
        const state = emptyState();
        state.models = [
          normativeModel(
            "m1",
            "Consider your energy levels",
            "personal",
            "warn",
          ),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("warn");
        if (result.decision === "warn") {
          expect(result.warnings).toHaveLength(1);
          expect(result.warnings[0]?.modelId).toBe("m1");
          expect(result.warnings[0]?.statement).toBe(
            "Consider your energy levels",
          );
        }
      });

      it("collects multiple warnings", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Warning 1", "personal", "warn"),
          normativeModel("m2", "Warning 2", "personal", "warn"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("warn");
        if (result.decision === "warn") {
          expect(result.warnings).toHaveLength(2);
        }
      });
    });

    describe("block scenarios", () => {
      it("blocks when Normative Model has enforcement: block", () => {
        const state = emptyState();
        state.models = [
          normativeModel(
            "m1",
            "No new episodes during recovery week",
            "personal",
            "block",
          ),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("block");
        if (result.decision === "block") {
          expect(result.modelId).toBe("m1");
          expect(result.reason).toBe("No new episodes during recovery week");
        }
      });

      it("returns first blocking model (early exit)", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "First blocker", "personal", "block"),
          normativeModel("m2", "Second blocker", "personal", "block"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("block");
        if (result.decision === "block") {
          expect(result.modelId).toBe("m1");
        }
      });

      it("block takes precedence over warn (if block comes first)", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Blocker", "personal", "block"),
          normativeModel("m2", "Warner", "personal", "warn"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("block");
      });
    });

    describe("scope matching", () => {
      it("personal scope matches Personal nodes only", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Personal constraint", "personal", "block"),
        ];

        // Should block Personal node
        const personalResult = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });
        expect(personalResult.decision).toBe("block");

        // Should allow Org node
        const orgResult = checkEpisodeConstraints(state, {
          node: DEFAULT_ORG_NODE,
          episodeType: "Explore",
        });
        expect(orgResult.decision).toBe("allow");
      });

      it("org scope matches Org nodes only", () => {
        const state = emptyState();
        state.models = [normativeModel("m1", "Org constraint", "org", "block")];

        // Should allow Personal node
        const personalResult = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });
        expect(personalResult.decision).toBe("allow");

        // Should block Org node
        const orgResult = checkEpisodeConstraints(state, {
          node: DEFAULT_ORG_NODE,
          episodeType: "Explore",
        });
        expect(orgResult.decision).toBe("block");
      });

      it("domain scope matches all nodes", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Universal constraint", "domain", "block"),
        ];

        // Should block Personal node
        const personalResult = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });
        expect(personalResult.decision).toBe("block");

        // Should block Org node
        const orgResult = checkEpisodeConstraints(state, {
          node: DEFAULT_ORG_NODE,
          episodeType: "Explore",
        });
        expect(orgResult.decision).toBe("block");
      });
    });

    describe("edge cases", () => {
      it("ignores non-Normative models", () => {
        const state = emptyState();
        state.models = [
          {
            id: "m1",
            type: "Descriptive",
            statement: "This is a belief",
            scope: "personal",
            enforcement: "block", // Even with block, should be ignored
          },
          {
            id: "m2",
            type: "Procedural",
            statement: "This is a procedure",
            scope: "personal",
            enforcement: "block",
          },
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });

      it("ignores Normative models without scope", () => {
        const state = emptyState();
        state.models = [
          {
            id: "m1",
            type: "Normative",
            statement: "No scope defined",
            // scope is undefined
            enforcement: "block",
          },
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });

      it("handles models with undefined enforcement as none", () => {
        const state = emptyState();
        state.models = [
          {
            id: "m1",
            type: "Normative",
            statement: "No enforcement defined",
            scope: "personal",
            // enforcement is undefined
          },
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("allow");
      });
    });

    describe("exceptionAllowed behavior", () => {
      it("warn models default to exceptionAllowed: true", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Warning constraint", "personal", "warn"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("warn");
        if (result.decision === "warn") {
          expect(result.warnings[0]?.exceptionAllowed).toBe(true);
        }
      });

      it("block models default to exceptionAllowed: false", () => {
        const state = emptyState();
        state.models = [
          normativeModel("m1", "Blocking constraint", "personal", "block"),
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("block");
        if (result.decision === "block") {
          expect(result.exceptionAllowed).toBe(false);
        }
      });

      it("respects explicit exceptionsAllowed: true on block model", () => {
        const state = emptyState();
        state.models = [
          {
            id: "m1",
            type: "Normative",
            statement: "Overridable block",
            scope: "personal",
            enforcement: "block",
            exceptionsAllowed: true,
          },
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("block");
        if (result.decision === "block") {
          expect(result.exceptionAllowed).toBe(true);
        }
      });

      it("respects explicit exceptionsAllowed: false on warn model", () => {
        const state = emptyState();
        state.models = [
          {
            id: "m1",
            type: "Normative",
            statement: "Warning without exception",
            scope: "personal",
            enforcement: "warn",
            exceptionsAllowed: false,
          },
        ];

        const result = checkEpisodeConstraints(state, {
          node: DEFAULT_PERSONAL_NODE,
          episodeType: "Explore",
        });

        expect(result.decision).toBe("warn");
        if (result.decision === "warn") {
          expect(result.warnings[0]?.exceptionAllowed).toBe(false);
        }
      });
    });
  });
});
