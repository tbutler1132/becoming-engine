/**
 * Property-Based Invariant Tests
 *
 * These tests use fast-check to verify that fundamental system invariants
 * hold across all possible inputs. Unlike example-based tests which prove
 * specific cases, property tests prove properties hold universally.
 *
 * Core invariants tested:
 * 1. State validity is preserved through all mutations
 * 2. Constraint violations are always caught
 * 3. No silent corruption (failed ops don't modify state)
 * 4. Episode lifecycle consistency
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  openEpisode,
  closeEpisode,
  applySignal,
  createAction,
  countActiveExplores,
  countActiveStabilizesForVariable,
} from "./logic.js";
import { isValidState } from "../memory/internal/validation.js";
import {
  SCHEMA_VERSION,
  VARIABLE_STATUSES,
  EPISODE_TYPES,
  EPISODE_STATUSES,
  NODE_TYPES,
  NOTE_TAGS,
  DEFAULT_PERSONAL_NODE,
  DEFAULT_ORG_NODE,
} from "../memory/index.js";
import type {
  State,
  NodeRef,
  Variable,
  Episode,
  Action,
  Note,
} from "../memory/index.js";

// ============================================================================
// Arbitraries (Test Data Generators)
// ============================================================================

/** Generate a valid ISO timestamp string (avoids NaN date issues during shrinking) */
const isoTimestampArb: fc.Arbitrary<string> = fc
  .integer({ min: 946684800000, max: 1924991999999 }) // 2000-01-01 to 2030-12-31
  .map((ms) => new Date(ms).toISOString());

/** Generate a valid NodeRef */
const nodeRefArb: fc.Arbitrary<NodeRef> = fc.oneof(
  fc.constant(DEFAULT_PERSONAL_NODE),
  fc.constant(DEFAULT_ORG_NODE),
  fc.record({
    type: fc.constantFrom(...NODE_TYPES),
    id: fc
      .string({ minLength: 1, maxLength: 20 })
      .filter((s) => s.trim().length > 0),
  }),
);

/** Generate a valid Variable */
const variableArb = (node: NodeRef): fc.Arbitrary<Variable> =>
  fc.record({
    id: fc.uuid(),
    node: fc.constant(node),
    name: fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0),
    status: fc.constantFrom(...VARIABLE_STATUSES),
  });

/** Generate a valid closed Episode */
const closedEpisodeArb = (node: NodeRef): fc.Arbitrary<Episode> =>
  fc
    .record({
      id: fc.uuid(),
      node: fc.constant(node),
      type: fc.constantFrom(...EPISODE_TYPES),
      objective: fc
        .string({ minLength: 1, maxLength: 100 })
        .filter((s) => s.trim().length > 0),
      status: fc.constant(EPISODE_STATUSES[1]), // Closed
      openedAt: isoTimestampArb,
      closedAt: isoTimestampArb,
    })
    .map((ep) => ep as Episode);

/** Generate a valid Note */
const noteArb: fc.Arbitrary<Note> = fc.record({
  id: fc.uuid(),
  content: fc.string({ minLength: 1, maxLength: 500 }),
  createdAt: isoTimestampArb,
  tags: fc.array(fc.constantFrom(...NOTE_TAGS), { minLength: 0, maxLength: 2 }),
});

/** Generate a valid closure note for closeEpisode */
const closureNoteArb = fc.record({
  id: fc.uuid(),
  content: fc
    .string({ minLength: 1, maxLength: 200 })
    .filter((s) => s.trim().length > 0),
});

/** Generate a minimal valid State (empty arrays) */
const minimalStateArb: fc.Arbitrary<State> = fc.constant({
  schemaVersion: SCHEMA_VERSION,
  variables: [],
  episodes: [],
  actions: [],
  notes: [],
  models: [],
  links: [],
  exceptions: [],
  proxies: [],
  proxyReadings: [],
});

/** Generate a valid State with some content */
const validStateArb: fc.Arbitrary<State> = fc
  .tuple(nodeRefArb, fc.array(noteArb, { minLength: 0, maxLength: 3 }))
  .chain(([node, notes]) =>
    fc
      .array(variableArb(node), { minLength: 0, maxLength: 3 })
      .chain((variables) =>
        fc
          .array(closedEpisodeArb(node), { minLength: 0, maxLength: 3 })
          .map((episodes) => ({
            schemaVersion: SCHEMA_VERSION,
            variables,
            episodes,
            actions: [] as Action[],
            notes,
            models: [],
            links: [],
            exceptions: [],
            proxies: [],
            proxyReadings: [],
          })),
      ),
  );

/** Generate a state with exactly one active episode */
const stateWithActiveEpisodeArb: fc.Arbitrary<{
  state: State;
  episodeId: string;
}> = fc
  .tuple(nodeRefArb, fc.uuid(), isoTimestampArb)
  .map(([node, episodeId, openedAt]) => ({
    state: {
      schemaVersion: SCHEMA_VERSION,
      variables: [],
      episodes: [
        {
          id: episodeId,
          node,
          type: EPISODE_TYPES[0], // Stabilize
          objective: "Test objective",
          status: EPISODE_STATUSES[0], // Active
          openedAt,
        },
      ],
      actions: [],
      notes: [],
      models: [],
      links: [],
      exceptions: [],
      proxies: [],
      proxyReadings: [],
    },
    episodeId,
  }));

/** Generate a state with an active Explore episode at max capacity */
const stateWithMaxExploresArb: fc.Arbitrary<{ state: State; node: NodeRef }> =
  nodeRefArb.chain((node) =>
    fc.uuid().map((episodeId) => ({
      state: {
        schemaVersion: SCHEMA_VERSION,
        variables: [],
        episodes: [
          {
            id: episodeId,
            node,
            type: EPISODE_TYPES[1], // Explore
            objective: "Active explore",
            status: EPISODE_STATUSES[0], // Active
            openedAt: new Date().toISOString(),
          },
        ],
        actions: [],
        notes: [],
        models: [],
        links: [],
        exceptions: [],
        proxies: [],
        proxyReadings: [],
      },
      node,
    })),
  );

/** Generate a state with an active Stabilize for a specific variable */
const stateWithActiveStabilizeArb: fc.Arbitrary<{
  state: State;
  node: NodeRef;
  variableId: string;
}> = fc
  .tuple(nodeRefArb, fc.uuid(), fc.uuid())
  .map(([node, variableId, episodeId]) => ({
    state: {
      schemaVersion: SCHEMA_VERSION,
      variables: [
        {
          id: variableId,
          node,
          name: "Test Variable",
          status: VARIABLE_STATUSES[0],
        },
      ],
      episodes: [
        {
          id: episodeId,
          node,
          type: EPISODE_TYPES[0], // Stabilize
          variableId,
          objective: "Active stabilize",
          status: EPISODE_STATUSES[0], // Active
          openedAt: new Date().toISOString(),
        },
      ],
      actions: [],
      notes: [],
      models: [],
      links: [],
      exceptions: [],
      proxies: [],
      proxyReadings: [],
    },
    node,
    variableId,
  }));

// ============================================================================
// Property Tests
// ============================================================================

describe("Invariant: State Validity Preservation", () => {
  it("opening an episode on valid state produces valid state or explicit error", () => {
    fc.assert(
      fc.property(
        validStateArb,
        nodeRefArb,
        fc.constantFrom(...EPISODE_TYPES),
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        (state, node, type, episodeId, objective, openedAt) => {
          const params =
            type === "Stabilize"
              ? {
                  episodeId,
                  node,
                  type: type as "Stabilize",
                  variableId: "v1",
                  objective,
                  openedAt: openedAt,
                }
              : {
                  episodeId,
                  node,
                  type: type as "Explore",
                  objective,
                  openedAt: openedAt,
                };

          const result = openEpisode(state, params);

          if (result.ok) {
            // Success must produce valid state
            expect(isValidState(result.value)).toBe(true);
          }
          // Failure is acceptable (constraint violation)
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("closing an episode on valid state produces valid state or explicit error", () => {
    fc.assert(
      fc.property(
        stateWithActiveEpisodeArb,
        isoTimestampArb,
        closureNoteArb,
        ({ state, episodeId }, closedAt, closureNote) => {
          const result = closeEpisode(state, {
            episodeId,
            closedAt,
            closureNote,
          });

          if (result.ok) {
            expect(isValidState(result.value)).toBe(true);
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("applying a signal on valid state produces valid state or explicit error", () => {
    fc.assert(
      fc.property(
        validStateArb,
        fc.uuid(),
        fc.constantFrom(...VARIABLE_STATUSES),
        (state, variableId, status) => {
          // Add a variable to signal
          const stateWithVar: State = {
            ...state,
            variables: [
              ...state.variables,
              {
                id: variableId,
                node: DEFAULT_PERSONAL_NODE,
                name: "Test",
                status: VARIABLE_STATUSES[1],
              },
            ],
          };

          const result = applySignal(stateWithVar, {
            node: DEFAULT_PERSONAL_NODE,
            variableId,
            status,
          });

          if (result.ok) {
            expect(isValidState(result.value)).toBe(true);
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("creating an action on valid state produces valid state or explicit error", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (state, actionId, description) => {
          const result = createAction(state, {
            actionId,
            node: DEFAULT_PERSONAL_NODE,
            description,
          });

          if (result.ok) {
            expect(isValidState(result.value)).toBe(true);
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Invariant: Explore Constraint Enforcement", () => {
  it("opening a second Explore on a node at capacity always fails", () => {
    fc.assert(
      fc.property(
        stateWithMaxExploresArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        ({ state, node }, episodeId, objective, openedAt) => {
          // Verify we're at capacity
          expect(countActiveExplores(state, node)).toBe(1);

          const result = openEpisode(state, {
            episodeId,
            node,
            type: "Explore",
            objective,
            openedAt: openedAt,
          });

          // Must reject
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("Explore");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("opening Explore on a different node succeeds when another node is at capacity", () => {
    fc.assert(
      fc.property(
        stateWithMaxExploresArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        ({ state, node }, episodeId, objective, openedAt) => {
          // Use a different node
          const otherNode =
            node.type === "Personal" ? DEFAULT_ORG_NODE : DEFAULT_PERSONAL_NODE;

          const result = openEpisode(state, {
            episodeId,
            node: otherNode,
            type: "Explore",
            objective,
            openedAt: openedAt,
          });

          // Should succeed on different node
          expect(result.ok).toBe(true);
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Invariant: Stabilize Per-Variable Constraint", () => {
  it("opening a second Stabilize for the same variable always fails", () => {
    fc.assert(
      fc.property(
        stateWithActiveStabilizeArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        ({ state, node, variableId }, episodeId, objective, openedAt) => {
          // Verify we have an active stabilize for this variable
          expect(
            countActiveStabilizesForVariable(state, node, variableId),
          ).toBe(1);

          const result = openEpisode(state, {
            episodeId,
            node,
            type: "Stabilize",
            variableId,
            objective,
            openedAt: openedAt,
          });

          // Must reject
          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("Stabilize");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("opening Stabilize for a different variable succeeds", () => {
    fc.assert(
      fc.property(
        stateWithActiveStabilizeArb,
        fc.uuid(),
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        ({ state, node }, newVariableId, episodeId, objective, openedAt) => {
          const result = openEpisode(state, {
            episodeId,
            node,
            type: "Stabilize",
            variableId: newVariableId, // Different variable
            objective,
            openedAt: openedAt,
          });

          // Should succeed for different variable
          expect(result.ok).toBe(true);
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Invariant: Episode Lifecycle Consistency", () => {
  it("closing an episode always sets closedAt and status=Closed", () => {
    fc.assert(
      fc.property(
        stateWithActiveEpisodeArb,
        isoTimestampArb,
        closureNoteArb,
        ({ state, episodeId }, closedAt, closureNote) => {
          const result = closeEpisode(state, {
            episodeId,
            closedAt,
            closureNote,
          });

          expect(result.ok).toBe(true);
          if (result.ok) {
            const closedEpisode = result.value.episodes.find(
              (e) => e.id === episodeId,
            );
            expect(closedEpisode).toBeDefined();
            expect(closedEpisode?.status).toBe(EPISODE_STATUSES[1]); // Closed
            expect(closedEpisode?.closedAt).toBe(closedAt);
            expect(closedEpisode?.closureNoteId).toBe(closureNote.id);
          }
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("closing a non-existent episode always fails", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        isoTimestampArb,
        closureNoteArb,
        (state, episodeId, closedAt, closureNote) => {
          const result = closeEpisode(state, {
            episodeId,
            closedAt,
            closureNote,
          });

          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("not found");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("closing an already closed episode always fails", () => {
    fc.assert(
      fc.property(
        nodeRefArb,
        fc.uuid(),
        isoTimestampArb,
        isoTimestampArb,
        isoTimestampArb,
        closureNoteArb,
        (node, episodeId, openedAt, firstClose, secondClose, closureNote) => {
          const state: State = {
            schemaVersion: SCHEMA_VERSION,
            variables: [],
            episodes: [
              {
                id: episodeId,
                node,
                type: EPISODE_TYPES[0],
                objective: "Test",
                status: EPISODE_STATUSES[1], // Already Closed
                openedAt: openedAt,
                closedAt: firstClose,
              },
            ],
            actions: [],
            notes: [],
            models: [],
            links: [],
            exceptions: [],
            proxies: [],
            proxyReadings: [],
          };

          const result = closeEpisode(state, {
            episodeId,
            closedAt: secondClose,
            closureNote,
          });

          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("already closed");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});

describe("Invariant: Signal Idempotence", () => {
  it("applying the same signal twice produces equivalent state", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc.constantFrom(...VARIABLE_STATUSES),
        (baseState, variableId, newStatus) => {
          // Create state with a variable
          const state: State = {
            ...baseState,
            variables: [
              {
                id: variableId,
                node: DEFAULT_PERSONAL_NODE,
                name: "Test",
                status: VARIABLE_STATUSES[1],
              },
            ],
          };

          const signal = {
            node: DEFAULT_PERSONAL_NODE,
            variableId,
            status: newStatus,
          };

          const result1 = applySignal(state, signal);
          expect(result1.ok).toBe(true);
          if (!result1.ok) return true;

          const result2 = applySignal(result1.value, signal);
          expect(result2.ok).toBe(true);
          if (!result2.ok) return true;

          // States should be equivalent
          expect(result2.value.variables).toEqual(result1.value.variables);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Invariant: Pure Functions Don't Mutate Input", () => {
  it("openEpisode never mutates the input state", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        isoTimestampArb,
        (state, episodeId, objective, openedAt) => {
          const originalJson = JSON.stringify(state);

          openEpisode(state, {
            episodeId,
            node: DEFAULT_PERSONAL_NODE,
            type: "Explore",
            objective,
            openedAt: openedAt,
          });

          // Original state should be unchanged
          expect(JSON.stringify(state)).toBe(originalJson);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("closeEpisode never mutates the input state", () => {
    fc.assert(
      fc.property(
        stateWithActiveEpisodeArb,
        isoTimestampArb,
        closureNoteArb,
        ({ state, episodeId }, closedAt, closureNote) => {
          const originalJson = JSON.stringify(state);

          closeEpisode(state, {
            episodeId,
            closedAt,
            closureNote,
          });

          expect(JSON.stringify(state)).toBe(originalJson);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("applySignal never mutates the input state", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc.constantFrom(...VARIABLE_STATUSES),
        (baseState, variableId, status) => {
          const state: State = {
            ...baseState,
            variables: [
              {
                id: variableId,
                node: DEFAULT_PERSONAL_NODE,
                name: "Test",
                status: VARIABLE_STATUSES[1],
              },
            ],
          };
          const originalJson = JSON.stringify(state);

          applySignal(state, {
            node: DEFAULT_PERSONAL_NODE,
            variableId,
            status,
          });

          expect(JSON.stringify(state)).toBe(originalJson);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });

  it("createAction never mutates the input state", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (state, actionId, description) => {
          const originalJson = JSON.stringify(state);

          createAction(state, {
            actionId,
            node: DEFAULT_PERSONAL_NODE,
            description,
          });

          expect(JSON.stringify(state)).toBe(originalJson);
          return true;
        },
      ),
      { numRuns: 100 },
    );
  });
});

describe("Invariant: Failed Operations Return Errors, Not Corruption", () => {
  it("signaling a non-existent variable fails with clear error", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc.constantFrom(...VARIABLE_STATUSES),
        (state, variableId, status) => {
          const result = applySignal(state, {
            node: DEFAULT_PERSONAL_NODE,
            variableId, // Doesn't exist
            status,
          });

          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("not found");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("creating action with non-existent episode fails with clear error", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        fc.uuid(),
        fc
          .string({ minLength: 1, maxLength: 50 })
          .filter((s) => s.trim().length > 0),
        (state, actionId, episodeId, description) => {
          const result = createAction(state, {
            actionId,
            node: DEFAULT_PERSONAL_NODE,
            episodeId, // Doesn't exist
            description,
          });

          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("not found");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });

  it("opening episode with empty objective fails with clear error", () => {
    fc.assert(
      fc.property(
        minimalStateArb,
        fc.uuid(),
        isoTimestampArb,
        (state, episodeId, openedAt) => {
          const result = openEpisode(state, {
            episodeId,
            node: DEFAULT_PERSONAL_NODE,
            type: "Explore",
            objective: "", // Empty
            openedAt: openedAt,
          });

          expect(result.ok).toBe(false);
          if (!result.ok) {
            expect(result.error).toContain("objective");
          }
          return true;
        },
      ),
      { numRuns: 50 },
    );
  });
});
