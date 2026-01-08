/**
 * Node Selection Context — URL-based node selection for the web UI
 *
 * In Next.js App Router (server components), node selection is passed via
 * URL search params (?node=<nodeId>). This module provides utilities for:
 * - Extracting the selected node from searchParams
 * - Resolving node ID to NodeRef
 * - Building URLs with node params
 *
 * @module Web/NodeContext
 */

// Import from specific modules to avoid pulling in server-only store.ts
// This allows client components to use these utilities safely
import type { Node, NodeRef, State } from "../../../libs/memory/types.js";
import {
  DEFAULT_PERSONAL_NODE,
  DEFAULT_PERSONAL_NODE_ID,
  DEFAULT_ORG_NODE_ID,
} from "../../../libs/memory/types.js";
import {
  getNodeById,
  getRootNodes,
} from "../../../libs/memory/hierarchy.js";

/** Query parameter name for node selection */
export const NODE_PARAM = "node";

/**
 * Gets the selected node ID from URL search params.
 * Falls back to default personal node if not specified or invalid.
 *
 * @param searchParams - URL search params object (may be undefined)
 * @returns The node ID string
 */
export function getSelectedNodeId(
  searchParams: Record<string, string | string[] | undefined> | undefined,
): string {
  if (!searchParams) {
    return DEFAULT_PERSONAL_NODE_ID;
  }
  const nodeParam = searchParams[NODE_PARAM];
  if (typeof nodeParam === "string" && nodeParam.length > 0) {
    return nodeParam;
  }
  return DEFAULT_PERSONAL_NODE_ID;
}

/**
 * Resolves a node ID to a Node object from state.
 * Returns undefined if the node doesn't exist.
 *
 * @param state - Current system state
 * @param nodeId - Node ID to look up
 * @returns The Node object or undefined
 */
export function resolveNode(state: State, nodeId: string): Node | undefined {
  return getNodeById(state, nodeId);
}

/**
 * Gets the NodeRef for the selected node.
 * This bridges the new Node system with the legacy NodeRef system.
 *
 * For now, we map:
 * - Nodes with tag "personal" → { type: "Personal", id: nodeId }
 * - Nodes with tag "org" → { type: "Org", id: nodeId }
 * - Default → { type: "Personal", id: nodeId }
 *
 * @param state - Current system state
 * @param nodeId - Selected node ID
 * @returns A NodeRef compatible with existing regulator logic
 */
export function getNodeRef(state: State, nodeId: string): NodeRef {
  const node = resolveNode(state, nodeId);

  if (!node) {
    // Fallback to default personal node
    return DEFAULT_PERSONAL_NODE;
  }

  // Determine legacy type from tags
  if (node.tags?.includes("org")) {
    return { type: "Org", id: node.id };
  }

  // Default to Personal for backward compatibility
  return { type: "Personal", id: node.id };
}

/**
 * Gets the default node to select when none is specified.
 * Prefers the first root node, then falls back to default personal.
 *
 * @param state - Current system state
 * @returns The default node ID
 */
export function getDefaultNodeId(state: State): string {
  const roots = getRootNodes(state);
  if (roots.length > 0) {
    return roots[0]?.id ?? DEFAULT_PERSONAL_NODE_ID;
  }
  // Fallback to known defaults
  const personal = state.nodes.find((n) => n.id === DEFAULT_PERSONAL_NODE_ID);
  if (personal) return personal.id;
  const org = state.nodes.find((n) => n.id === DEFAULT_ORG_NODE_ID);
  if (org) return org.id;
  // Last resort: first node or default
  return state.nodes[0]?.id ?? DEFAULT_PERSONAL_NODE_ID;
}

/**
 * Builds a URL path with the node parameter preserved.
 *
 * @param basePath - The base URL path (e.g., "/lenses/status")
 * @param nodeId - The node ID to include
 * @returns Full URL path with query string
 */
export function buildNodeUrl(basePath: string, nodeId: string): string {
  // Don't add param for default personal node (cleaner URLs)
  if (nodeId === DEFAULT_PERSONAL_NODE_ID) {
    return basePath;
  }
  const separator = basePath.includes("?") ? "&" : "?";
  return `${basePath}${separator}${NODE_PARAM}=${encodeURIComponent(nodeId)}`;
}

/**
 * Gets the icon for a node kind.
 *
 * @param kind - The node kind (agent, system, domain)
 * @returns An emoji icon representing the kind
 */
export function getNodeKindIcon(kind: "agent" | "system" | "domain"): string {
  switch (kind) {
    case "agent":
      return "👤";
    case "system":
      return "⚙️";
    case "domain":
      return "📁";
  }
}

