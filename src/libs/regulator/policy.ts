// Regulator policy configuration
// Configure boundaries (constraints), not mechanisms.

import type { NodeRef, NodeType } from "../memory/index.js";
import { formatNodeRef, NODE_TYPES } from "../memory/index.js";
import type { Result } from "../shared/index.js";
import {
  MAX_ACTIVE_EXPLORE_PER_NODE,
  MAX_ACTIVE_STABILIZE_PER_VARIABLE,
} from "./types.js";

export interface RegulatorPolicy {
  /**
   * Max number of active Explore episodes allowed per node.
   * Can be set globally and overridden per NodeType.
   */
  maxActiveExplorePerNode: number;
  maxActiveExplorePerNodeByType: Partial<Record<NodeType, number>>;
  maxActiveExplorePerNodeByNode: Partial<Record<string, number>>;

  /**
   * Max number of active Stabilize episodes allowed per Variable (per node).
   * Can be set globally and overridden per NodeType or per specific NodeRef.
   */
  maxActiveStabilizePerVariable: number;
  maxActiveStabilizePerVariableByType: Partial<Record<NodeType, number>>;
  maxActiveStabilizePerVariableByNode: Partial<Record<string, number>>;
}

export interface RegulatorPolicyForNode {
  maxActiveExplorePerNode: number;
  maxActiveStabilizePerVariable: number;
}

export const DEFAULT_REGULATOR_POLICY: RegulatorPolicy = {
  maxActiveExplorePerNode: MAX_ACTIVE_EXPLORE_PER_NODE,
  maxActiveExplorePerNodeByType: {},
  maxActiveExplorePerNodeByNode: {},

  maxActiveStabilizePerVariable: MAX_ACTIVE_STABILIZE_PER_VARIABLE,
  maxActiveStabilizePerVariableByType: {},
  maxActiveStabilizePerVariableByNode: {},
};

export function getRegulatorPolicyForNode(
  policy: RegulatorPolicy,
  node: NodeRef,
): RegulatorPolicyForNode {
  const exploreNodeOverride =
    policy.maxActiveExplorePerNodeByNode[formatNodeRef(node)];
  const exploreTypeOverride = policy.maxActiveExplorePerNodeByType[node.type];

  const stabilizeNodeOverride =
    policy.maxActiveStabilizePerVariableByNode[formatNodeRef(node)];
  const stabilizeTypeOverride =
    policy.maxActiveStabilizePerVariableByType[node.type];
  return {
    maxActiveExplorePerNode:
      exploreNodeOverride ??
      exploreTypeOverride ??
      policy.maxActiveExplorePerNode,
    maxActiveStabilizePerVariable:
      stabilizeNodeOverride ??
      stabilizeTypeOverride ??
      policy.maxActiveStabilizePerVariable,
  };
}

export function validateRegulatorPolicy(
  policy: RegulatorPolicy,
): Result<RegulatorPolicy> {
  if (!Number.isFinite(policy.maxActiveExplorePerNode)) {
    return {
      ok: false,
      error: "RegulatorPolicy.maxActiveExplorePerNode must be finite",
    };
  }
  if (policy.maxActiveExplorePerNode < 0) {
    return {
      ok: false,
      error: "RegulatorPolicy.maxActiveExplorePerNode must be >= 0",
    };
  }

  for (const node of NODE_TYPES) {
    const override = policy.maxActiveExplorePerNodeByType[node];
    if (override === undefined) continue;
    if (!Number.isFinite(override)) {
      return {
        ok: false,
        error: `RegulatorPolicy.maxActiveExplorePerNodeByType['${node}'] must be finite`,
      };
    }
    if (override < 0) {
      return {
        ok: false,
        error: `RegulatorPolicy.maxActiveExplorePerNodeByType['${node}'] must be >= 0`,
      };
    }
  }

  if (!Number.isFinite(policy.maxActiveStabilizePerVariable)) {
    return {
      ok: false,
      error: "RegulatorPolicy.maxActiveStabilizePerVariable must be finite",
    };
  }
  if (policy.maxActiveStabilizePerVariable < 0) {
    return {
      ok: false,
      error: "RegulatorPolicy.maxActiveStabilizePerVariable must be >= 0",
    };
  }

  for (const node of NODE_TYPES) {
    const override = policy.maxActiveStabilizePerVariableByType[node];
    if (override === undefined) continue;
    if (!Number.isFinite(override)) {
      return {
        ok: false,
        error: `RegulatorPolicy.maxActiveStabilizePerVariableByType['${node}'] must be finite`,
      };
    }
    if (override < 0) {
      return {
        ok: false,
        error: `RegulatorPolicy.maxActiveStabilizePerVariableByType['${node}'] must be >= 0`,
      };
    }
  }

  return { ok: true, value: policy };
}
