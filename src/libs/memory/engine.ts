/**
 * Engine Node Bootstrap — The Becoming Engine regulating itself
 *
 * This module defines the Engine as a first-class system node that uses
 * its own regulatory primitives to track code health, UX coherence,
 * doctrine alignment, and adoption.
 *
 * The Engine eating its own dogfood is the ultimate test of recursive viability.
 *
 * @module Memory/Engine
 */

import {
  ENGINE_NODE_ID,
  ENGINE_VARIABLE_IDS,
  SCHEMA_VERSION,
} from "../../dna.js";
import type { Node, Variable, Model, State, NodeRef } from "./types.js";

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE NODE — The system that regulates itself
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The Becoming Engine's own node definition.
 * This is a "system" kind node — technical infrastructure that maintains viability.
 */
export const ENGINE_NODE: Node = {
  id: ENGINE_NODE_ID,
  kind: "system",
  name: "Becoming Engine",
  description: "The regulatory system itself, eating its own dogfood",
  tags: ["meta", "infrastructure", "dogfood"],
  createdAt: "2026-01-01T00:00:00.000Z",
};

/**
 * NodeRef for the Engine node (used by Variables, Episodes, etc.)
 * Note: This uses the legacy NodeRef format for backwards compatibility
 * with existing regulator logic that expects type: NodeType.
 */
export const ENGINE_NODE_REF: NodeRef = {
  type: "Org", // Using Org as the legacy type for system nodes
  id: ENGINE_NODE_ID,
};

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE VARIABLES — What the Engine regulates about itself
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The Engine's essential variables (what it must keep viable).
 */
export const ENGINE_VARIABLES: Variable[] = [
  {
    id: ENGINE_VARIABLE_IDS.codeHealth,
    node: ENGINE_NODE_REF,
    name: "Code Health",
    status: "InRange",
    description: "Is the codebase in good shape?",
    preferredRange:
      "Test coverage >80%, zero lint errors, zero type errors, all tests passing",
    measurementCadence: "daily",
  },
  {
    id: ENGINE_VARIABLE_IDS.uxCoherence,
    node: ENGINE_NODE_REF,
    name: "UX Coherence",
    status: "InRange",
    description: "Is the UI consistent and usable?",
    preferredRange:
      "UI follows design system, no visual regressions, intuitive navigation",
    measurementCadence: "weekly",
  },
  {
    id: ENGINE_VARIABLE_IDS.doctrineAlignment,
    node: ENGINE_NODE_REF,
    name: "Doctrine Alignment",
    status: "InRange",
    description: "Does the system match the philosophy?",
    preferredRange:
      "ADR compliance, no anti-patterns, constraints enforced, baseline quiet",
    measurementCadence: "weekly",
  },
  {
    id: ENGINE_VARIABLE_IDS.adoption,
    node: ENGINE_NODE_REF,
    name: "Adoption",
    status: "Unknown",
    description: "Are people using it?",
    preferredRange: "Active users, regular sessions, growing usage over time",
    measurementCadence: "monthly",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE MODELS — Normative constraints and procedural rules
// ═══════════════════════════════════════════════════════════════════════════

/**
 * The Engine's world model (beliefs about how to build and maintain itself).
 */
export const ENGINE_MODELS: Model[] = [
  // Normative: Hard constraints that block violation
  {
    id: "model:engine:no-capture",
    type: "Normative",
    statement:
      "Never ship features that create capture loops or coercive patterns",
    confidence: 1.0,
    scope: "domain",
    enforcement: "block",
    exceptionsAllowed: false,
  },
  // Normative: Soft constraints that warn
  {
    id: "model:engine:baseline-quiet",
    type: "Normative",
    statement:
      "The default state is quiet. Features should reduce noise, not add it.",
    confidence: 1.0,
    scope: "domain",
    enforcement: "warn",
    exceptionsAllowed: true,
  },
  // Procedural: How we work
  {
    id: "model:engine:pr-review",
    type: "Procedural",
    statement: "All pull requests require review before merge",
    confidence: 0.9,
    scope: "domain",
  },
  {
    id: "model:engine:check-before-commit",
    type: "Procedural",
    statement:
      "Run npm run check before committing. If it fails, fix before moving on.",
    confidence: 1.0,
    scope: "domain",
  },
  // Descriptive: What we've learned
  {
    id: "model:engine:small-functions",
    type: "Descriptive",
    statement: "Functions over 20 lines tend to accumulate bugs. Split them.",
    confidence: 0.85,
    scope: "domain",
  },
  {
    id: "model:engine:explicit-types",
    type: "Descriptive",
    statement:
      "Explicit return types catch errors earlier than inferred types.",
    confidence: 0.9,
    scope: "domain",
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// ENGINE STATE — Bootstrap function for creating engine's initial state
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates the initial state for the Engine's own regulatory system.
 * This is a separate state file from user data — the Engine regulates itself
 * independently (autonomy in action).
 *
 * @returns A fresh State containing the Engine node, variables, and models
 */
export function createEngineState(): State {
  return {
    schemaVersion: SCHEMA_VERSION,
    nodes: [ENGINE_NODE],
    variables: ENGINE_VARIABLES,
    episodes: [],
    actions: [],
    notes: [],
    models: ENGINE_MODELS,
    links: [],
    exceptions: [],
    proxies: [],
    proxyReadings: [],
  };
}
