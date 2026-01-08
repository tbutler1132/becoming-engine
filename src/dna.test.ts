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
  NODE_KINDS,
  NODE_TYPES,
  LEGACY_NODE_TYPES,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
  ENGINE_NODE_ID,
  ENGINE_VARIABLE_IDS,
  VARIABLE_STATUSES,
  MEASUREMENT_CADENCES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  ACTION_STATUSES,
  MODEL_TYPES,
  MODEL_SCOPES,
  ENFORCEMENT_LEVELS,
  NOTE_TAGS,
  LINK_RELATIONS,
  OBSERVATION_TYPES,
  SIGNAL_EVENT_TYPES,
  MUTATION_TYPES,
  OVERRIDE_DECISIONS,
  PROXY_VALUE_TYPES,
  MAX_ACTIVE_EXPLORE_PER_NODE,
  MAX_ACTIVE_STABILIZE_PER_VARIABLE,
  SCHEMA_VERSION,
} from "./dna.js";

describe("DNA Integrity (Tripwire)", () => {
  describe("Ontology Constants", () => {
    it("has expected node kinds", () => {
      expect(NODE_KINDS).toEqual(["agent", "system", "domain"]);
    });

    it("has expected legacy node types for backwards compatibility", () => {
      expect(LEGACY_NODE_TYPES).toEqual(["Personal", "Org"]);
      // NODE_TYPES is an alias for backwards compatibility
      expect(NODE_TYPES).toEqual(LEGACY_NODE_TYPES);
    });

    it("has expected default node IDs", () => {
      expect(DEFAULT_PERSONAL_NODE_ID).toBe("personal");
      expect(DEFAULT_ORG_NODE_ID).toBe("org");
    });

    it("has expected engine node ID", () => {
      expect(ENGINE_NODE_ID).toBe("system:becoming-engine");
    });

    it("has expected engine variable IDs", () => {
      expect(ENGINE_VARIABLE_IDS).toEqual({
        codeHealth: "var:engine:code-health",
        uxCoherence: "var:engine:ux-coherence",
        doctrineAlignment: "var:engine:doctrine-alignment",
        adoption: "var:engine:adoption",
      });
    });

    it("has expected variable statuses", () => {
      expect(VARIABLE_STATUSES).toEqual(["Low", "InRange", "High", "Unknown"]);
    });

    it("has expected measurement cadences", () => {
      expect(MEASUREMENT_CADENCES).toEqual([
        "daily",
        "weekly",
        "monthly",
        "quarterly",
        "asNeeded",
      ]);
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
        "audit",
      ]);
    });

    it("has expected link relations", () => {
      expect(LINK_RELATIONS).toEqual([
        "supports",
        "tests",
        "blocks",
        "responds_to",
        "derived_from",
        "part_of",
        "coordinates",
      ]);
    });

    it("includes hierarchical link relations", () => {
      expect(LINK_RELATIONS).toContain("part_of");
      expect(LINK_RELATIONS).toContain("coordinates");
    });

    it("has expected observation types", () => {
      expect(OBSERVATION_TYPES).toEqual([
        "variableProxySignal",
        "freeformNote",
        "episodeProposal",
      ]);
    });

    it("has expected signal event types", () => {
      expect(SIGNAL_EVENT_TYPES).toEqual(["intent", "status", "completion"]);
    });

    it("has expected mutation types", () => {
      expect(MUTATION_TYPES).toEqual(["episode", "action", "signal"]);
    });

    it("has expected override decisions", () => {
      expect(OVERRIDE_DECISIONS).toEqual(["warn", "block"]);
    });

    it("has expected proxy value types", () => {
      expect(PROXY_VALUE_TYPES).toEqual(["numeric", "boolean", "categorical"]);
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
      expect(SCHEMA_VERSION).toBe(13);
    });
  });
});
