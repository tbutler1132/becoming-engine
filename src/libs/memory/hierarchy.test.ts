import { describe, it, expect } from "vitest";
import {
  getNodeById,
  getParentNodes,
  getChildNodes,
  getNodeAncestry,
  getNodeDescendants,
  getRootNodes,
  wouldCreateCycle,
  validatePartOfLink,
} from "./hierarchy.js";
import { createEmptyState } from "./types.js";
import type { Node, Link, State } from "./types.js";

// Helper to create test nodes
function createNode(id: string, name: string): Node {
  return {
    id,
    kind: "agent",
    name,
    createdAt: new Date().toISOString(),
  };
}

// Helper to create part_of links
function createPartOfLink(childId: string, parentId: string): Link {
  return {
    id: `link-${childId}-${parentId}`,
    sourceId: childId,
    targetId: parentId,
    relation: "part_of",
  };
}

// Test state with hierarchy:
// root
//  ├── child1
//  │    └── grandchild
//  └── child2
function createTestState(): State {
  const state = createEmptyState();
  state.nodes = [
    createNode("root", "Root Node"),
    createNode("child1", "Child 1"),
    createNode("child2", "Child 2"),
    createNode("grandchild", "Grandchild"),
  ];
  state.links = [
    createPartOfLink("child1", "root"),
    createPartOfLink("child2", "root"),
    createPartOfLink("grandchild", "child1"),
  ];
  return state;
}

describe("Hierarchy Functions", () => {
  describe("getNodeById", () => {
    it("returns the node when found", () => {
      const state = createTestState();
      const node = getNodeById(state, "root");
      expect(node).toBeDefined();
      expect(node?.name).toBe("Root Node");
    });

    it("returns undefined when not found", () => {
      const state = createTestState();
      const node = getNodeById(state, "nonexistent");
      expect(node).toBeUndefined();
    });
  });

  describe("getParentNodes", () => {
    it("returns parents for a node with one parent", () => {
      const state = createTestState();
      const parents = getParentNodes(state, "child1");
      expect(parents).toHaveLength(1);
      expect(parents[0]?.id).toBe("root");
    });

    it("returns empty array for root nodes", () => {
      const state = createTestState();
      const parents = getParentNodes(state, "root");
      expect(parents).toHaveLength(0);
    });

    it("supports multiple parents", () => {
      const state = createTestState();
      // Add another parent relationship
      state.nodes.push(createNode("domain", "Domain"));
      state.links.push(createPartOfLink("grandchild", "domain"));

      const parents = getParentNodes(state, "grandchild");
      expect(parents).toHaveLength(2);
      expect(parents.map((p) => p.id).sort()).toEqual(["child1", "domain"]);
    });
  });

  describe("getChildNodes", () => {
    it("returns children for a parent node", () => {
      const state = createTestState();
      const children = getChildNodes(state, "root");
      expect(children).toHaveLength(2);
      expect(children.map((c) => c.id).sort()).toEqual(["child1", "child2"]);
    });

    it("returns empty array for leaf nodes", () => {
      const state = createTestState();
      const children = getChildNodes(state, "grandchild");
      expect(children).toHaveLength(0);
    });
  });

  describe("getNodeAncestry", () => {
    it("returns all ancestors from immediate parent to root", () => {
      const state = createTestState();
      const ancestors = getNodeAncestry(state, "grandchild");
      expect(ancestors).toHaveLength(2);
      expect(ancestors.map((a) => a.id)).toEqual(["child1", "root"]);
    });

    it("returns empty array for root nodes", () => {
      const state = createTestState();
      const ancestors = getNodeAncestry(state, "root");
      expect(ancestors).toHaveLength(0);
    });

    it("handles cycles gracefully", () => {
      const state = createEmptyState();
      state.nodes = [createNode("a", "A"), createNode("b", "B")];
      // Create a cycle: a -> b -> a
      state.links = [createPartOfLink("a", "b"), createPartOfLink("b", "a")];

      // Should not infinite loop, should return both nodes
      const ancestors = getNodeAncestry(state, "a");
      expect(ancestors).toHaveLength(2);
    });
  });

  describe("getNodeDescendants", () => {
    it("returns all descendants", () => {
      const state = createTestState();
      const descendants = getNodeDescendants(state, "root");
      expect(descendants).toHaveLength(3);
      expect(descendants.map((d) => d.id).sort()).toEqual([
        "child1",
        "child2",
        "grandchild",
      ]);
    });

    it("returns empty array for leaf nodes", () => {
      const state = createTestState();
      const descendants = getNodeDescendants(state, "grandchild");
      expect(descendants).toHaveLength(0);
    });
  });

  describe("getRootNodes", () => {
    it("returns nodes without part_of relationships", () => {
      const state = createTestState();
      const roots = getRootNodes(state);
      expect(roots).toHaveLength(1);
      expect(roots[0]?.id).toBe("root");
    });

    it("returns all nodes if no hierarchy exists", () => {
      const state = createEmptyState();
      state.nodes = [createNode("a", "A"), createNode("b", "B")];
      // No links
      const roots = getRootNodes(state);
      expect(roots).toHaveLength(2);
    });
  });

  describe("wouldCreateCycle", () => {
    it("returns false for valid parent-child relationships", () => {
      const state = createTestState();
      expect(wouldCreateCycle(state, "child2", "child1")).toBe(false);
    });

    it("returns true for self-references", () => {
      const state = createTestState();
      expect(wouldCreateCycle(state, "root", "root")).toBe(true);
    });

    it("returns true when parent is a descendant of child", () => {
      const state = createTestState();
      // root -> grandchild would create: grandchild part_of root, but root is ancestor of grandchild
      expect(wouldCreateCycle(state, "root", "grandchild")).toBe(true);
    });

    it("returns true for direct back-edges", () => {
      const state = createTestState();
      // child1 part_of root already exists
      // root part_of child1 would create a cycle
      expect(wouldCreateCycle(state, "root", "child1")).toBe(true);
    });
  });

  describe("validatePartOfLink", () => {
    it("returns ok for valid links", () => {
      const state = createTestState();
      const link: Link = {
        id: "new-link",
        sourceId: "child2",
        targetId: "child1",
        relation: "part_of",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(true);
    });

    it("skips validation for non-part_of links", () => {
      const state = createTestState();
      const link: Link = {
        id: "new-link",
        sourceId: "root",
        targetId: "grandchild",
        relation: "supports",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(true);
    });

    it("rejects self-references", () => {
      const state = createTestState();
      const link: Link = {
        id: "self-link",
        sourceId: "root",
        targetId: "root",
        relation: "part_of",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("cannot be part_of itself");
      }
    });

    it("rejects links to nonexistent source nodes", () => {
      const state = createTestState();
      const link: Link = {
        id: "bad-link",
        sourceId: "nonexistent",
        targetId: "root",
        relation: "part_of",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Source node not found");
      }
    });

    it("rejects links to nonexistent target nodes", () => {
      const state = createTestState();
      const link: Link = {
        id: "bad-link",
        sourceId: "root",
        targetId: "nonexistent",
        relation: "part_of",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("Target node not found");
      }
    });

    it("rejects cycle-creating links", () => {
      const state = createTestState();
      const link: Link = {
        id: "cycle-link",
        sourceId: "root",
        targetId: "grandchild",
        relation: "part_of",
      };
      const result = validatePartOfLink(state, link);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("would create cycle");
      }
    });
  });
});
