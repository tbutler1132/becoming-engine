/**
 * Template Integrity Tests
 *
 * Validates that builtin templates are well-formed and consistent.
 * These tests catch structural issues, not content correctness.
 */

import { describe, it, expect } from "vitest";
import { BUILTIN_TEMPLATES } from "./templates.js";
import { MEASUREMENT_CADENCES } from "./types.js";

describe("ArticulationTemplate Integrity", () => {
  describe("BUILTIN_TEMPLATES structure", () => {
    it("has expected number of templates", () => {
      // Tripwire: change this if you add/remove templates
      expect(BUILTIN_TEMPLATES).toHaveLength(7);
    });

    it("has unique template IDs", () => {
      const ids = BUILTIN_TEMPLATES.map((t) => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("has unique template names", () => {
      const names = BUILTIN_TEMPLATES.map((t) => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it("all templates have origin 'builtin'", () => {
      for (const template of BUILTIN_TEMPLATES) {
        expect(template.origin).toBe("builtin");
      }
    });

    it("all templates have valid suggestedCadence", () => {
      const validCadences = new Set(MEASUREMENT_CADENCES);
      for (const template of BUILTIN_TEMPLATES) {
        expect(validCadences.has(template.suggestedCadence)).toBe(true);
      }
    });

    it("all templates have non-empty required fields", () => {
      for (const template of BUILTIN_TEMPLATES) {
        expect(template.id.length).toBeGreaterThan(0);
        expect(template.name.length).toBeGreaterThan(0);
        expect(template.description.length).toBeGreaterThan(0);
        expect(template.suggestedPreferredRange.length).toBeGreaterThan(0);
        expect(template.rationale.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Template IDs (tripwire)", () => {
    it("has expected template IDs", () => {
      // Tripwire: update this if you rename templates
      const ids = BUILTIN_TEMPLATES.map((t) => t.id);
      expect(ids).toEqual([
        "continuity",
        "coherence",
        "social-embeddedness",
        "optionality",
        "agency",
        "meaningful-engagement",
        "learning",
      ]);
    });
  });
});
