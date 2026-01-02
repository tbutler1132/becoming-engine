// Pure logic functions for the Membrane organ
// All functions are pure: (State, Context) => MembraneResult

import type { Model, ModelScope, NodeRef, State } from "../memory/index.js";
import type {
  EpisodeCheckContext,
  MembraneResult,
  MembraneWarning,
} from "./types.js";

/**
 * Determines if a Model's scope applies to a given Node.
 *
 * Scope matching rules:
 * - "personal" → applies to Personal nodes only
 * - "org" → applies to Org nodes only
 * - "domain" → applies to all nodes (universal constraint)
 */
function scopeMatchesNode(scope: ModelScope, node: NodeRef): boolean {
  switch (scope) {
    case "personal":
      return node.type === "Personal";
    case "org":
      return node.type === "Org";
    case "domain":
      return true; // Domain scope applies universally
  }
}

/**
 * Gets all Normative Models that apply to a given Node.
 * Filters by: type === "Normative" AND scope matches node
 */
function getNormativeModelsForNode(state: State, node: NodeRef): Model[] {
  return state.models.filter(
    (model) =>
      model.type === "Normative" &&
      model.scope !== undefined &&
      scopeMatchesNode(model.scope, node),
  );
}

/**
 * Determines if exceptions are allowed for a model.
 *
 * Default behavior:
 * - warn models: exceptions allowed by default (true)
 * - block models: exceptions NOT allowed by default (false)
 *
 * This can be overridden by the model's exceptionsAllowed field.
 */
function isExceptionAllowed(model: Model): boolean {
  if (model.exceptionsAllowed !== undefined) {
    return model.exceptionsAllowed;
  }
  // Default: warn allows exceptions, block does not
  return model.enforcement === "warn";
}

/**
 * Checks if opening an episode is allowed by Normative Models.
 *
 * **Intent:** Gate episode mutations through Normative Model constraints.
 * This is the "Enforce Constraints" step in the doctrine's canonical flow.
 *
 * **Contract:**
 * - Returns: MembraneResult (allow | warn | block)
 * - Pure function: no side effects
 * - Early exit on first blocking model
 * - Collects all warnings before returning
 *
 * **Matching rules:**
 * - scope: "personal" → applies to Personal nodes
 * - scope: "org" → applies to Org nodes
 * - scope: "domain" → applies to all nodes
 *
 * **Enforcement handling:**
 * - enforcement: "none" → ignored (model is informational only)
 * - enforcement: "warn" → mutation allowed, warning returned
 * - enforcement: "block" → mutation blocked, reason returned
 *
 * **Exception handling:**
 * - exceptionAllowed on warn: indicates if exception can be logged when proceeding
 * - exceptionAllowed on block: indicates if user can override with --override flag
 */
export function checkEpisodeConstraints(
  state: State,
  context: EpisodeCheckContext,
): MembraneResult {
  const applicableModels = getNormativeModelsForNode(state, context.node);

  const warnings: MembraneWarning[] = [];

  for (const model of applicableModels) {
    const enforcement = model.enforcement ?? "none";

    switch (enforcement) {
      case "none":
        // Informational only, no enforcement
        continue;

      case "warn":
        warnings.push({
          modelId: model.id,
          statement: model.statement,
          exceptionAllowed: isExceptionAllowed(model),
        });
        continue;

      case "block":
        // Early exit: first blocking model wins
        return {
          decision: "block",
          reason: model.statement,
          modelId: model.id,
          exceptionAllowed: isExceptionAllowed(model),
        };
    }
  }

  // No blocking models found
  if (warnings.length > 0) {
    return { decision: "warn", warnings };
  }

  return { decision: "allow" };
}
