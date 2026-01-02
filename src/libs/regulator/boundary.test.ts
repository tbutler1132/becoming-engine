/**
 * Boundary Condition Tests
 *
 * Tests that verify system behavior at edge cases:
 * 1. Empty state — operations on empty collections
 * 2. Maximum limits — behavior at regulatory constraints
 * 3. Invalid inputs — graceful rejection of bad data
 * 4. Unicode handling — special characters in text fields
 * 5. Large state — performance at scale (1000+ objects)
 */

import { describe, it, expect } from "vitest";
import {
  getVariablesByNode,
  getActiveEpisodesByNode,
  countActiveExplores,
  countActiveStabilizesForVariable,
  canStartExplore,
  canCreateAction,
  applySignal,
  createAction,
  openEpisode,
  closeEpisode,
  createModel,
  updateModel,
  createNote,
  addNoteTag,
  createLink,
  deleteLink,
  logException,
  isBaseline,
  getPendingActionsForActiveEpisodes,
  getStatusData,
} from "./logic.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  MODEL_TYPES,
  LINK_RELATIONS,
  NOTE_TAGS,
  SCHEMA_VERSION,
} from "../memory/index.js";
import type { State } from "../memory/index.js";
import { MAX_ACTIVE_EXPLORE_PER_NODE } from "./types.js";
import { isValidState } from "../memory/internal/validation.js";

// ============================================================================
// Helper Functions
// ============================================================================

function createEmptyState(): State {
  return {
    schemaVersion: SCHEMA_VERSION,
    variables: [],
    episodes: [],
    actions: [],
    notes: [],
    models: [],
    links: [],
    exceptions: [],
  };
}

// Helper to safely cycle through status values
function getVariableStatus(i: number): "Low" | "InRange" | "High" {
  const idx = i % 3;
  if (idx === 0) return "Low";
  if (idx === 1) return "InRange";
  return "High";
}

function getEpisodeType(i: number): "Stabilize" | "Explore" {
  return i % 2 === 0 ? "Stabilize" : "Explore";
}

function getActionStatus(i: number): "Pending" | "Done" {
  return i % 2 === 0 ? "Pending" : "Done";
}

function getModelType(i: number): "Descriptive" | "Procedural" | "Normative" {
  const idx = i % 3;
  if (idx === 0) return "Descriptive";
  if (idx === 1) return "Procedural";
  return "Normative";
}

function createLargeState(objectCount: number): State {
  const state = createEmptyState();

  // Add variables
  for (let i = 0; i < objectCount; i++) {
    state.variables.push({
      id: `var-${i}`,
      node: i % 2 === 0 ? DEFAULT_PERSONAL_NODE : DEFAULT_ORG_NODE,
      name: `Variable ${i}`,
      status: getVariableStatus(i),
    });
  }

  // Add closed episodes (to avoid constraint conflicts)
  for (let i = 0; i < objectCount; i++) {
    const episode = {
      id: `ep-${i}`,
      node: i % 2 === 0 ? DEFAULT_PERSONAL_NODE : DEFAULT_ORG_NODE,
      type: getEpisodeType(i),
      objective: `Objective ${i}`,
      status: "Closed" as const,
      openedAt: new Date(Date.now() - 100000 + i).toISOString(),
      closedAt: new Date(Date.now() + i).toISOString(),
    };
    // Stabilize episodes have variableId, Explore episodes don't
    if (i % 2 === 0) {
      state.episodes.push({ ...episode, variableId: `var-${i}` });
    } else {
      state.episodes.push(episode);
    }
  }

  // Add actions
  for (let i = 0; i < objectCount; i++) {
    state.actions.push({
      id: `act-${i}`,
      description: `Action ${i}`,
      status: getActionStatus(i),
      episodeId: `ep-${i}`,
    });
  }

  // Add notes
  for (let i = 0; i < objectCount; i++) {
    state.notes.push({
      id: `note-${i}`,
      content: `Note content ${i}`,
      createdAt: new Date(Date.now() + i).toISOString(),
      tags: [],
    });
  }

  // Add models
  for (let i = 0; i < Math.min(objectCount, 100); i++) {
    state.models.push({
      id: `model-${i}`,
      type: getModelType(i),
      statement: `Model statement ${i}`,
      confidence: (i % 100) / 100,
    });
  }

  return state;
}

// ============================================================================
// 1. Empty State Tests
// ============================================================================

describe("Boundary: Empty State", () => {
  describe("query operations on empty state", () => {
    it("getVariablesByNode returns empty array", () => {
      const state = createEmptyState();
      expect(getVariablesByNode(state, DEFAULT_PERSONAL_NODE)).toEqual([]);
      expect(getVariablesByNode(state, DEFAULT_ORG_NODE)).toEqual([]);
    });

    it("getActiveEpisodesByNode returns empty array", () => {
      const state = createEmptyState();
      expect(getActiveEpisodesByNode(state, DEFAULT_PERSONAL_NODE)).toEqual([]);
    });

    it("countActiveExplores returns 0", () => {
      const state = createEmptyState();
      expect(countActiveExplores(state, DEFAULT_PERSONAL_NODE)).toBe(0);
    });

    it("isBaseline returns true", () => {
      const state = createEmptyState();
      expect(isBaseline(state, DEFAULT_PERSONAL_NODE)).toBe(true);
    });

    it("getPendingActionsForActiveEpisodes returns empty array", () => {
      const state = createEmptyState();
      expect(
        getPendingActionsForActiveEpisodes(state, DEFAULT_PERSONAL_NODE),
      ).toEqual([]);
    });

    it("getStatusData returns baseline mode", () => {
      const state = createEmptyState();
      const status = getStatusData(state, DEFAULT_PERSONAL_NODE);
      expect(status.mode).toBe("baseline");
    });
  });

  describe("constraint checks on empty state", () => {
    it("canStartExplore succeeds on empty state", () => {
      const state = createEmptyState();
      const result = canStartExplore(state, DEFAULT_PERSONAL_NODE);
      expect(result.ok).toBe(true);
    });

    it("countActiveStabilizesForVariable returns 0 on empty state", () => {
      const state = createEmptyState();
      const count = countActiveStabilizesForVariable(
        state,
        DEFAULT_PERSONAL_NODE,
        "var-1",
      );
      expect(count).toBe(0);
    });

    it("canCreateAction succeeds without episodeId on empty state", () => {
      const state = createEmptyState();
      const result = canCreateAction(state, { node: DEFAULT_PERSONAL_NODE });
      expect(result.ok).toBe(true);
    });
  });

  describe("mutations on empty state", () => {
    it("openEpisode succeeds on empty state", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "Test objective",
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes).toHaveLength(1);
      }
    });

    it("createAction succeeds on empty state (episode-less)", () => {
      const state = createEmptyState();
      const result = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "Test action",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.actions).toHaveLength(1);
      }
    });

    it("createNote succeeds on empty state", () => {
      const state = createEmptyState();
      const result = createNote(state, {
        noteId: "note-1",
        content: "Test note",
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.notes).toHaveLength(1);
      }
    });

    it("createModel succeeds on empty state", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "Test statement",
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.models).toHaveLength(1);
      }
    });
  });

  describe("operations that should fail on empty state", () => {
    it("closeEpisode fails on empty state (no episode to close)", () => {
      const state = createEmptyState();
      const result = closeEpisode(state, {
        episodeId: "nonexistent",
        closedAt: new Date().toISOString(),
        closureNote: { id: "note-1", content: "Closure" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("applySignal fails on empty state (no variable)", () => {
      const state = createEmptyState();
      const result = applySignal(state, {
        node: DEFAULT_PERSONAL_NODE,
        variableId: "nonexistent",
        status: VARIABLE_STATUSES[0],
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("updateModel fails on empty state (no model)", () => {
      const state = createEmptyState();
      const result = updateModel(state, {
        modelId: "nonexistent",
        statement: "Updated",
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });

    it("addNoteTag fails on empty state (no note)", () => {
      const state = createEmptyState();
      const result = addNoteTag(state, {
        noteId: "nonexistent",
        tag: NOTE_TAGS[0],
      });
      expect(result.ok).toBe(false);
    });

    it("deleteLink fails on empty state (no link)", () => {
      const state = createEmptyState();
      const result = deleteLink(state, { linkId: "nonexistent" });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("not found");
      }
    });
  });

  it("empty state passes validation", () => {
    const state = createEmptyState();
    expect(isValidState(state)).toBe(true);
  });
});

// ============================================================================
// 2. Maximum Limits Tests
// ============================================================================

describe("Boundary: Maximum Limits", () => {
  describe("MAX_ACTIVE_EXPLORE_PER_NODE", () => {
    it("allows exactly MAX_ACTIVE_EXPLORE_PER_NODE Explore episodes", () => {
      let state = createEmptyState();

      // Open MAX_ACTIVE_EXPLORE_PER_NODE episodes
      for (let i = 0; i < MAX_ACTIVE_EXPLORE_PER_NODE; i++) {
        const result = openEpisode(state, {
          episodeId: `explore-${i}`,
          node: DEFAULT_PERSONAL_NODE,
          type: "Explore",
          objective: `Explore ${i}`,
          openedAt: new Date().toISOString(),
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
          state = result.value;
        }
      }

      expect(countActiveExplores(state, DEFAULT_PERSONAL_NODE)).toBe(
        MAX_ACTIVE_EXPLORE_PER_NODE,
      );
    });

    it("blocks one more than MAX_ACTIVE_EXPLORE_PER_NODE", () => {
      let state = createEmptyState();

      // Fill to capacity
      for (let i = 0; i < MAX_ACTIVE_EXPLORE_PER_NODE; i++) {
        const result = openEpisode(state, {
          episodeId: `explore-${i}`,
          node: DEFAULT_PERSONAL_NODE,
          type: "Explore",
          objective: `Explore ${i}`,
          openedAt: new Date().toISOString(),
        });
        if (result.ok) {
          state = result.value;
        }
      }

      // Try to exceed
      const result = openEpisode(state, {
        episodeId: "explore-overflow",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "One too many",
        openedAt: new Date().toISOString(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Explore");
      }
    });

    it("allows Explore on different node when one is at capacity", () => {
      let state = createEmptyState();

      // Fill personal node
      for (let i = 0; i < MAX_ACTIVE_EXPLORE_PER_NODE; i++) {
        const result = openEpisode(state, {
          episodeId: `personal-explore-${i}`,
          node: DEFAULT_PERSONAL_NODE,
          type: "Explore",
          objective: `Personal Explore ${i}`,
          openedAt: new Date().toISOString(),
        });
        if (result.ok) {
          state = result.value;
        }
      }

      // Org node should still be open
      const result = openEpisode(state, {
        episodeId: "org-explore",
        node: DEFAULT_ORG_NODE,
        type: "Explore",
        objective: "Org explore",
        openedAt: new Date().toISOString(),
      });

      expect(result.ok).toBe(true);
    });

    it("allows new Explore after closing existing one", () => {
      let state = createEmptyState();

      // Open to capacity
      const openResult = openEpisode(state, {
        episodeId: "explore-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "First explore",
        openedAt: new Date().toISOString(),
      });
      expect(openResult.ok).toBe(true);
      if (openResult.ok) {
        state = openResult.value;
      }

      // Close it
      const closeResult = closeEpisode(state, {
        episodeId: "explore-1",
        closedAt: new Date().toISOString(),
        closureNote: { id: "note-1", content: "Learned something" },
        modelUpdates: [
          { id: "model-1", type: MODEL_TYPES[0], statement: "New learning" },
        ],
      });
      expect(closeResult.ok).toBe(true);
      if (closeResult.ok) {
        state = closeResult.value;
      }

      // Should be able to open another
      const newResult = openEpisode(state, {
        episodeId: "explore-2",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "Second explore",
        openedAt: new Date().toISOString(),
      });
      expect(newResult.ok).toBe(true);
    });
  });

  describe("MAX_ACTIVE_STABILIZE_PER_VARIABLE", () => {
    it("blocks second Stabilize for same variable", () => {
      let state = createEmptyState();

      // First Stabilize
      const result1 = openEpisode(state, {
        episodeId: "stabilize-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: "Stabilize var-1",
        openedAt: new Date().toISOString(),
      });
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        state = result1.value;
      }

      // Second Stabilize for same variable
      const result2 = openEpisode(state, {
        episodeId: "stabilize-2",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: "Another stabilize var-1",
        openedAt: new Date().toISOString(),
      });

      expect(result2.ok).toBe(false);
      if (!result2.ok) {
        expect(result2.error).toContain("Stabilize");
      }
    });

    it("allows Stabilize for different variable", () => {
      let state = createEmptyState();

      // First Stabilize
      const result1 = openEpisode(state, {
        episodeId: "stabilize-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: "Stabilize var-1",
        openedAt: new Date().toISOString(),
      });
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        state = result1.value;
      }

      // Stabilize for different variable
      const result2 = openEpisode(state, {
        episodeId: "stabilize-2",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-2",
        objective: "Stabilize var-2",
        openedAt: new Date().toISOString(),
      });

      expect(result2.ok).toBe(true);
    });
  });
});

// ============================================================================
// 3. Invalid Inputs Tests
// ============================================================================

describe("Boundary: Invalid Inputs", () => {
  describe("empty string validation", () => {
    it("rejects empty objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "",
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(false);
    });

    it("rejects whitespace-only objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "   ",
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(false);
    });

    it("rejects empty note content", () => {
      const state = createEmptyState();
      const result = createNote(state, {
        noteId: "note-1",
        content: "",
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(false);
    });

    it("rejects empty model statement", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "",
      });
      expect(result.ok).toBe(false);
    });

    it("rejects empty action description", () => {
      const state = createEmptyState();
      const result = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "",
      });
      expect(result.ok).toBe(false);
    });

    it("rejects empty closure note", () => {
      let state = createEmptyState();
      const openResult = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: "Test",
        openedAt: new Date().toISOString(),
      });
      if (openResult.ok) {
        state = openResult.value;
      }

      const result = closeEpisode(state, {
        episodeId: "ep-1",
        closedAt: new Date().toISOString(),
        closureNote: { id: "note-1", content: "" },
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("duplicate ID validation", () => {
    // Note: Episodes and Actions do NOT currently check for duplicate IDs.
    // This is documented behavior - uniqueness is enforced at Notes, Models, Links, Exceptions.
    // Consider adding episode/action duplicate checks in future if needed.

    it("allows duplicate episode ID (no current validation)", () => {
      let state = createEmptyState();
      const result1 = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: "First",
        openedAt: new Date().toISOString(),
      });
      if (result1.ok) {
        state = result1.value;
      }

      // NOTE: Currently succeeds - duplicate episode IDs are not checked
      const result2 = openEpisode(state, {
        episodeId: "ep-1", // Duplicate
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-2",
        objective: "Second",
        openedAt: new Date().toISOString(),
      });
      expect(result2.ok).toBe(true);
    });

    it("allows duplicate action ID (no current validation)", () => {
      let state = createEmptyState();
      const result1 = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "First",
      });
      if (result1.ok) {
        state = result1.value;
      }

      // NOTE: Currently succeeds - duplicate action IDs are not checked
      const result2 = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        description: "Second",
      });
      expect(result2.ok).toBe(true);
    });

    it("rejects duplicate note ID", () => {
      let state = createEmptyState();
      const result1 = createNote(state, {
        noteId: "note-1",
        content: "First",
        createdAt: new Date().toISOString(),
      });
      if (result1.ok) {
        state = result1.value;
      }

      const result2 = createNote(state, {
        noteId: "note-1",
        content: "Second",
        createdAt: new Date().toISOString(),
      });
      expect(result2.ok).toBe(false);
    });

    it("rejects duplicate model ID", () => {
      let state = createEmptyState();
      const result1 = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "First",
      });
      if (result1.ok) {
        state = result1.value;
      }

      const result2 = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[1],
        statement: "Second",
      });
      expect(result2.ok).toBe(false);
    });

    it("rejects duplicate link ID", () => {
      let state = createEmptyState();
      state.variables.push({
        id: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "V1",
        status: VARIABLE_STATUSES[1],
      });

      const result1 = createLink(state, {
        linkId: "link-1",
        sourceId: "var-1",
        targetId: "var-1",
        relation: LINK_RELATIONS[0],
      });
      if (result1.ok) {
        state = result1.value;
      }

      const result2 = createLink(state, {
        linkId: "link-1",
        sourceId: "var-1",
        targetId: "var-1",
        relation: LINK_RELATIONS[1],
      });
      expect(result2.ok).toBe(false);
    });
  });

  describe("referential integrity", () => {
    it("rejects action referencing non-existent episode", () => {
      const state = createEmptyState();
      const result = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "nonexistent",
        description: "Test",
      });
      expect(result.ok).toBe(false);
    });

    it("rejects link to non-existent source", () => {
      const state = createEmptyState();
      state.variables.push({
        id: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "V1",
        status: VARIABLE_STATUSES[1],
      });

      const result = createLink(state, {
        linkId: "link-1",
        sourceId: "nonexistent",
        targetId: "var-1",
        relation: LINK_RELATIONS[0],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects link to non-existent target", () => {
      const state = createEmptyState();
      state.variables.push({
        id: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "V1",
        status: VARIABLE_STATUSES[1],
      });

      const result = createLink(state, {
        linkId: "link-1",
        sourceId: "var-1",
        targetId: "nonexistent",
        relation: LINK_RELATIONS[0],
      });
      expect(result.ok).toBe(false);
    });

    it("rejects exception for non-existent model", () => {
      const state = createEmptyState();
      const result = logException(state, {
        exceptionId: "ex-1",
        modelId: "nonexistent",
        originalDecision: "warn",
        justification: "Test",
        mutationType: "episode",
        mutationId: "ep-1",
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("numeric range validation", () => {
    it("rejects model confidence below 0", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "Test",
        confidence: -0.1,
      });
      expect(result.ok).toBe(false);
    });

    it("rejects model confidence above 1", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "Test",
        confidence: 1.1,
      });
      expect(result.ok).toBe(false);
    });

    it("accepts model confidence at boundaries (0.0 and 1.0)", () => {
      let state = createEmptyState();

      const result1 = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[0],
        statement: "Zero confidence",
        confidence: 0.0,
      });
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        state = result1.value;
      }

      const result2 = createModel(state, {
        modelId: "model-2",
        type: MODEL_TYPES[0],
        statement: "Full confidence",
        confidence: 1.0,
      });
      expect(result2.ok).toBe(true);
    });

    it("rejects link weight below 0", () => {
      const state = createEmptyState();
      state.variables.push({
        id: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "V1",
        status: VARIABLE_STATUSES[1],
      });

      const result = createLink(state, {
        linkId: "link-1",
        sourceId: "var-1",
        targetId: "var-1",
        relation: LINK_RELATIONS[0],
        weight: -0.1,
      });
      expect(result.ok).toBe(false);
    });

    it("rejects link weight above 1", () => {
      const state = createEmptyState();
      state.variables.push({
        id: "var-1",
        node: DEFAULT_PERSONAL_NODE,
        name: "V1",
        status: VARIABLE_STATUSES[1],
      });

      const result = createLink(state, {
        linkId: "link-1",
        sourceId: "var-1",
        targetId: "var-1",
        relation: LINK_RELATIONS[0],
        weight: 1.1,
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("invalid state transitions", () => {
    it("rejects closing already closed episode", () => {
      const state: State = {
        ...createEmptyState(),
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[1], // Already Closed
            openedAt: new Date(Date.now() - 10000).toISOString(),
            closedAt: new Date().toISOString(),
          },
        ],
      };

      const result = closeEpisode(state, {
        episodeId: "ep-1",
        closedAt: new Date().toISOString(),
        closureNote: { id: "note-1", content: "Trying to close again" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("already closed");
      }
    });

    it("rejects action on closed episode", () => {
      const state: State = {
        ...createEmptyState(),
        episodes: [
          {
            id: "ep-1",
            node: DEFAULT_PERSONAL_NODE,
            type: EPISODE_TYPES[0],
            objective: "Test",
            status: EPISODE_STATUSES[1], // Closed
            openedAt: new Date(Date.now() - 10000).toISOString(),
            closedAt: new Date().toISOString(),
          },
        ],
      };

      const result = createAction(state, {
        actionId: "act-1",
        node: DEFAULT_PERSONAL_NODE,
        episodeId: "ep-1",
        description: "Action on closed episode",
      });
      expect(result.ok).toBe(false);
    });
  });
});

// ============================================================================
// 4. Unicode Handling Tests
// ============================================================================

describe("Boundary: Unicode Handling", () => {
  const unicodeStrings = {
    emoji: "🚀 Launch episode with 🎯 goals",
    chinese: "学习中文编程",
    japanese: "日本語テスト",
    korean: "한국어 테스트",
    arabic: "اختبار باللغة العربية",
    hebrew: "בדיקה בעברית",
    russian: "Тест на русском языке",
    greek: "Δοκιμή στα ελληνικά",
    mixed: "Hello 世界 🌍 مرحبا",
    zalgo: "T̴̛̫̖̜̹̞̱̙̦̱̰͔̭̲̞̄̑̈́̈́̔̔̊̃̑̂̓̓̕ȩ̷̛̥̤̰͇̭̼̤̱̳̭̙̔̿̅͐̄̀̈́s̴̨̛̼̯̜̲̳̝̰͖̫̗̜̀́̎̾̑̏̐̽̚͝t̸̛̥͚͇͕̮̲͔̖̩̦͙̪̣̔̀̋̈̈́̃̎͘͜͝",
    newlines: "Line 1\nLine 2\r\nLine 3",
    tabs: "Column1\tColumn2\tColumn3",
    specialChars: "Test with <script>alert('xss')</script>",
    nullChar: "Before\x00After", // Null character
  };

  describe("episode objectives", () => {
    it("accepts emoji in objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-emoji",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: unicodeStrings.emoji,
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.episodes[0]?.objective).toBe(unicodeStrings.emoji);
      }
    });

    it("accepts Chinese characters in objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-chinese",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: unicodeStrings.chinese,
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });

    it("accepts Arabic (RTL) in objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-arabic",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: unicodeStrings.arabic,
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });

    it("accepts mixed Unicode in objective", () => {
      const state = createEmptyState();
      const result = openEpisode(state, {
        episodeId: "ep-mixed",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: unicodeStrings.mixed,
        openedAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("note content", () => {
    it("accepts emoji in note content", () => {
      const state = createEmptyState();
      const result = createNote(state, {
        noteId: "note-emoji",
        content: unicodeStrings.emoji,
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });

    it("accepts multi-line content with special characters", () => {
      const state = createEmptyState();
      const result = createNote(state, {
        noteId: "note-multiline",
        content: unicodeStrings.newlines,
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });

    it("accepts tabs in content", () => {
      const state = createEmptyState();
      const result = createNote(state, {
        noteId: "note-tabs",
        content: unicodeStrings.tabs,
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("model statements", () => {
    it("accepts Japanese in model statement", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-jp",
        type: MODEL_TYPES[0],
        statement: unicodeStrings.japanese,
      });
      expect(result.ok).toBe(true);
    });

    it("accepts Russian in model statement", () => {
      const state = createEmptyState();
      const result = createModel(state, {
        modelId: "model-ru",
        type: MODEL_TYPES[0],
        statement: unicodeStrings.russian,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("action descriptions", () => {
    it("accepts Korean in action description", () => {
      const state = createEmptyState();
      const result = createAction(state, {
        actionId: "act-korean",
        node: DEFAULT_PERSONAL_NODE,
        description: unicodeStrings.korean,
      });
      expect(result.ok).toBe(true);
    });

    it("accepts Greek in action description", () => {
      const state = createEmptyState();
      const result = createAction(state, {
        actionId: "act-greek",
        node: DEFAULT_PERSONAL_NODE,
        description: unicodeStrings.greek,
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("exception justifications", () => {
    it("accepts Hebrew in exception justification", () => {
      let state = createEmptyState();
      const modelResult = createModel(state, {
        modelId: "model-1",
        type: MODEL_TYPES[2], // Normative
        statement: "Test constraint",
      });
      if (modelResult.ok) {
        state = modelResult.value;
      }

      const result = logException(state, {
        exceptionId: "ex-1",
        modelId: "model-1",
        originalDecision: "warn",
        justification: unicodeStrings.hebrew,
        mutationType: "episode",
        mutationId: "ep-1",
        createdAt: new Date().toISOString(),
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("preserves Unicode through operations", () => {
    it("preserves emoji through state mutations", () => {
      let state = createEmptyState();

      // Create with emoji
      const openResult = openEpisode(state, {
        episodeId: "ep-1",
        node: DEFAULT_PERSONAL_NODE,
        type: "Stabilize",
        variableId: "var-1",
        objective: unicodeStrings.emoji,
        openedAt: new Date().toISOString(),
      });
      expect(openResult.ok).toBe(true);
      if (openResult.ok) {
        state = openResult.value;
      }

      // Close and verify
      const closeResult = closeEpisode(state, {
        episodeId: "ep-1",
        closedAt: new Date().toISOString(),
        closureNote: { id: "note-1", content: unicodeStrings.chinese },
      });
      expect(closeResult.ok).toBe(true);
      if (closeResult.ok) {
        // Objective preserved
        expect(closeResult.value.episodes[0]?.objective).toBe(
          unicodeStrings.emoji,
        );
        // Note content preserved
        expect(closeResult.value.notes[0]?.content).toBe(
          unicodeStrings.chinese,
        );
      }
    });
  });
});

// ============================================================================
// 5. Large State Tests (Performance at Scale)
// ============================================================================

describe("Boundary: Large State (Performance)", () => {
  const LARGE_COUNT = 1000;

  describe("operations on state with 1000+ objects", () => {
    it("validates large state efficiently", () => {
      const state = createLargeState(LARGE_COUNT);

      const start = performance.now();
      const isValid = isValidState(state);
      const elapsed = performance.now() - start;

      expect(isValid).toBe(true);
      // Validation should complete in reasonable time (< 500ms)
      expect(elapsed).toBeLessThan(500);
    });

    it("queries variables efficiently on large state", () => {
      const state = createLargeState(LARGE_COUNT);

      const start = performance.now();
      const personalVars = getVariablesByNode(state, DEFAULT_PERSONAL_NODE);
      const elapsed = performance.now() - start;

      // Should find half the variables (even indices)
      expect(personalVars.length).toBe(Math.ceil(LARGE_COUNT / 2));
      // Query should be fast (< 50ms)
      expect(elapsed).toBeLessThan(50);
    });

    it("filters episodes efficiently on large state", () => {
      const state = createLargeState(LARGE_COUNT);
      // Add one active episode
      state.episodes.push({
        id: "active-ep",
        node: DEFAULT_PERSONAL_NODE,
        type: EPISODE_TYPES[1],
        objective: "Active",
        status: EPISODE_STATUSES[0], // Active
        openedAt: new Date().toISOString(),
      });

      const start = performance.now();
      const activeEpisodes = getActiveEpisodesByNode(
        state,
        DEFAULT_PERSONAL_NODE,
      );
      const elapsed = performance.now() - start;

      expect(activeEpisodes.length).toBe(1);
      expect(elapsed).toBeLessThan(50);
    });

    it("creates new objects efficiently on large state", () => {
      const state = createLargeState(LARGE_COUNT);

      const start = performance.now();
      const result = createNote(state, {
        noteId: "new-note",
        content: "New note on large state",
        createdAt: new Date().toISOString(),
      });
      const elapsed = performance.now() - start;

      expect(result.ok).toBe(true);
      // Creation should be fast (< 50ms)
      expect(elapsed).toBeLessThan(50);
    });

    it("openEpisode checks constraints efficiently on large state", () => {
      const state = createLargeState(LARGE_COUNT);

      const start = performance.now();
      const result = openEpisode(state, {
        episodeId: "new-ep",
        node: DEFAULT_PERSONAL_NODE,
        type: "Explore",
        objective: "New episode on large state",
        openedAt: new Date().toISOString(),
      });
      const elapsed = performance.now() - start;

      expect(result.ok).toBe(true);
      // Constraint checking should be fast (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });

    it("createLink with referential check scales reasonably", () => {
      const state = createLargeState(LARGE_COUNT);

      const start = performance.now();
      const result = createLink(state, {
        linkId: "new-link",
        sourceId: "var-0",
        targetId: "var-1",
        relation: LINK_RELATIONS[0],
      });
      const elapsed = performance.now() - start;

      expect(result.ok).toBe(true);
      // Referential integrity check should be fast (< 100ms)
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe("state remains valid after bulk operations", () => {
    it("state with 1000 objects passes validation", () => {
      const state = createLargeState(LARGE_COUNT);
      expect(isValidState(state)).toBe(true);
    });

    it("multiple sequential operations maintain validity", () => {
      let state = createEmptyState();

      // Add 100 notes
      for (let i = 0; i < 100; i++) {
        const result = createNote(state, {
          noteId: `note-${i}`,
          content: `Note ${i}`,
          createdAt: new Date().toISOString(),
        });
        if (result.ok) {
          state = result.value;
        }
      }

      // Add 100 models
      for (let i = 0; i < 100; i++) {
        const result = createModel(state, {
          modelId: `model-${i}`,
          type: getModelType(i),
          statement: `Model ${i}`,
        });
        if (result.ok) {
          state = result.value;
        }
      }

      expect(isValidState(state)).toBe(true);
      expect(state.notes.length).toBe(100);
      expect(state.models.length).toBe(100);
    });
  });
});
