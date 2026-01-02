/**
 * DNA Integrity Tests (Tripwire)
 *
 * These tests hardcode the expected values of DNA constants.
 * If you change the DNA, these tests will fail — forcing you to
 * explicitly acknowledge the change.
 *
 * This is intentional. Changing fundamental invariants should be a
 * deliberate act, not an accident.
 */

import { describe, it, expect } from "vitest";
import {
  NODE_TYPES,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  ACTION_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  NOTE_TAGS,
  LINK_RELATIONS,
  MAX_ACTIVE_EXPLORE_PER_NODE,
  MAX_ACTIVE_STABILIZE_PER_VARIABLE,
  SCHEMA_VERSION,
} from "./dna.js";

describe("DNA Integrity (Tripwire)", () => {
  describe("Ontology Constants", () => {
    it("has expected node types", () => {
      expect(NODE_TYPES).toEqual(["Personal", "Org"]);
    });

    it("has expected default node IDs", () => {
      expect(DEFAULT_PERSONAL_NODE_ID).toBe("personal");
      expect(DEFAULT_ORG_NODE_ID).toBe("org");
    });

    it("has expected variable statuses", () => {
      expect(VARIABLE_STATUSES).toEqual(["Low", "InRange", "High"]);
    });

    it("has expected episode types", () => {
      expect(EPISODE_TYPES).toEqual(["Stabilize", "Explore"]);
    });

    it("has expected episode statuses", () => {
      expect(EPISODE_STATUSES).toEqual(["Active", "Closed"]);
    });

    it("has expected action statuses", () => {
      expect(ACTION_STATUSES).toEqual(["Pending", "Done"]);
    });

    it("has expected model types", () => {
      expect(MODEL_TYPES).toEqual(["Descriptive", "Procedural", "Normative"]);
    });

    it("has expected model scopes", () => {
      expect(MODEL_SCOPES).toEqual(["personal", "org", "domain"]);
    });

    it("has expected enforcement levels", () => {
      expect(ENFORCEMENT_LEVELS).toEqual(["none", "warn", "block"]);
    });

    it("has expected note tags", () => {
      expect(NOTE_TAGS).toEqual([
        "inbox",
        "pending_approval",
        "processed",
        "closure_note",
      ]);
    });

    it("has expected link relations", () => {
      expect(LINK_RELATIONS).toEqual([
        "supports",
        "tests",
        "blocks",
        "responds_to",
        "derived_from",
      ]);
    });
  });

  describe("Regulatory Limits", () => {
    it("allows at most 1 active Explore per node", () => {
      expect(MAX_ACTIVE_EXPLORE_PER_NODE).toBe(1);
    });

    it("allows at most 1 active Stabilize per variable", () => {
      expect(MAX_ACTIVE_STABILIZE_PER_VARIABLE).toBe(1);
    });
  });

  describe("Schema Version", () => {
    it("has expected schema version", () => {
      expect(SCHEMA_VERSION).toBe(7);
    });
  });
});
