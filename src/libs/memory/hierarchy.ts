/**
 * Hierarchy — Node relationship queries via Links
 *
 * Hierarchy is expressed via `part_of` Links, not structural nesting.
 * This preserves autonomy: nodes are autonomous peers with relationships,
 * not containers with contents.
 */

import type { Link, Node, State } from "./types.js";
import type { Result } from "../shared/index.js";

/**
 * Get a node by its ID.
 */
export function getNodeById(state: State, nodeId: string): Node | undefined {
  return state.nodes.find((n) => n.id === nodeId);
}

/**
 * Get nodes that this node is "part_of" (its "parents").
 * A node can have multiple part_of relationships (multiple parents).
 */
export function getParentNodes(state: State, nodeId: string): Node[] {
  const parentLinks = state.links.filter(
    (link) => link.sourceId === nodeId && link.relation === "part_of",
  );
  return parentLinks
    .map((link) => getNodeById(state, link.targetId))
    .filter((n): n is Node => n !== undefined);
}

/**
 * Get nodes that are "part_of" this node (its "children").
 */
export function getChildNodes(state: State, nodeId: string): Node[] {
  const childLinks = state.links.filter(
    (link) => link.targetId === nodeId && link.relation === "part_of",
  );
  return childLinks
    .map((link) => getNodeById(state, link.sourceId))
    .filter((n): n is Node => n !== undefined);
}

/**
 * Get all ancestors (recursive traversal up part_of chain).
 * Returns nodes from immediate parent to root.
 * Handles cycles by tracking visited nodes.
 */
export function getNodeAncestry(state: State, nodeId: string): Node[] {
  const ancestors: Node[] = [];
  const visited = new Set<string>();

  function traverse(id: string): void {
    if (visited.has(id)) return; // Prevent cycles
    visited.add(id);

    const parents = getParentNodes(state, id);
    for (const parent of parents) {
      ancestors.push(parent);
      traverse(parent.id);
    }
  }

  traverse(nodeId);
  return ancestors;
}

/**
 * Get all descendants (recursive traversal down part_of chain).
 * Handles cycles by tracking visited nodes.
 */
export function getNodeDescendants(state: State, nodeId: string): Node[] {
  const descendants: Node[] = [];
  const visited = new Set<string>();

  function traverse(id: string): void {
    if (visited.has(id)) return; // Prevent cycles
    visited.add(id);

    const children = getChildNodes(state, id);
    for (const child of children) {
      descendants.push(child);
      traverse(child.id);
    }
  }

  traverse(nodeId);
  return descendants;
}

/**
 * Get root nodes (nodes that have no part_of relationships).
 */
export function getRootNodes(state: State): Node[] {
  const nodesWithParents = new Set(
    state.links
      .filter((link) => link.relation === "part_of")
      .map((link) => link.sourceId),
  );

  return state.nodes.filter((node) => !nodesWithParents.has(node.id));
}

/**
 * Check if creating a part_of link would create a cycle.
 * A cycle occurs if the proposed parent is already a descendant of the child.
 */
export function wouldCreateCycle(
  state: State,
  childId: string,
  parentId: string,
): boolean {
  // If the proposed parent is already a descendant of the child, it's a cycle
  const descendants = getNodeDescendants(state, childId);
  return descendants.some((d) => d.id === parentId) || childId === parentId;
}

/**
 * Validate a part_of link before creation.
 * Rejects cycles and validates that both nodes exist.
 */
export function validatePartOfLink(state: State, link: Link): Result<void> {
  if (link.relation !== "part_of") {
    return { ok: true, value: undefined };
  }

  // Self-link check
  if (link.sourceId === link.targetId) {
    return {
      ok: false,
      error: `Cannot create part_of link: a node cannot be part_of itself`,
    };
  }

  // Check that both nodes exist
  const sourceNode = getNodeById(state, link.sourceId);
  if (!sourceNode) {
    return { ok: false, error: `Source node not found: ${link.sourceId}` };
  }

  const targetNode = getNodeById(state, link.targetId);
  if (!targetNode) {
    return { ok: false, error: `Target node not found: ${link.targetId}` };
  }

  // Check for cycles
  if (wouldCreateCycle(state, link.sourceId, link.targetId)) {
    return {
      ok: false,
      error: `Cannot create part_of link: would create cycle between ${link.sourceId} and ${link.targetId}`,
    };
  }

  return { ok: true, value: undefined };
}
