# Recursive Node Architecture — Implementation Plan

> Implements [ADR 0006: Recursive Node Architecture](../decisions/0006-recursive-node-architecture.md)

This plan breaks down the transition from binary node types (`Personal | Org`) to a flexible node architecture with three semantic kinds (`agent | system | domain`) and hierarchy expressed through Links.

---

## Overview

| Microproject | Goal                  | Dependencies    |
| ------------ | --------------------- | --------------- |
| MP-NODE-1    | DNA + Types           | None            |
| MP-NODE-2    | Memory/Store          | MP-NODE-1       |
| MP-NODE-3    | Regulator             | MP-NODE-2       |
| MP-NODE-4    | Data Migration        | MP-NODE-2       |
| MP-NODE-5    | Engine Node Bootstrap | MP-NODE-4       |
| MP-NODE-6    | UI Updates            | MP-NODE-3, MP12 |

**Estimated total effort**: 3-5 days of focused work

---

## MP-NODE-1: DNA + Types

**Goal**: Update the genetic code to support flexible node kinds and hierarchical Link relations.

### Changes to `src/dna.ts`

```typescript
// BEFORE
export const NODE_TYPES = ["Personal", "Org"] as const;

// AFTER
/**
 * Node kinds with semantic meaning for regulation
 * - agent: has agency, can initiate (person, org, team, AI)
 * - system: technical/infrastructure (software, service, device)
 * - domain: life context or project (health, creative, "Project X")
 */
export const NODE_KINDS = ["agent", "system", "domain"] as const;

/** Legacy node types for migration compatibility */
export const LEGACY_NODE_TYPES = ["Personal", "Org"] as const;
```

```typescript
// BEFORE
export const LINK_RELATIONS = [
  "supports",
  "tests",
  "blocks",
  "responds_to",
  "derived_from",
] as const;

// AFTER
export const LINK_RELATIONS = [
  "supports",
  "tests",
  "blocks",
  "responds_to",
  "derived_from",
  // Hierarchical relations (nodes as autonomous peers with relationships)
  "part_of", // child → parent: "domain:health part_of agent:tim"
  "coordinates", // parent → child: "agent:company coordinates agent:team:eng"
] as const;
```

### Changes to `src/libs/memory/types.ts`

```typescript
// Update Node interface
export interface Node {
  id: string;
  kind: NodeKind; // NEW: replaces 'type'
  name: string;
  description?: string;
  tags?: string[]; // NEW: optional semantic tags
  createdAt: string;
  // NOTE: No parentId — hierarchy is expressed via Links
}

// Type exports
export type NodeKind = (typeof NODE_KINDS)[number];
```

### Tripwire Test Update

Update `src/dna.test.ts` to expect new values:

```typescript
it("NODE_KINDS has expected values", () => {
  expect(NODE_KINDS).toEqual(["agent", "system", "domain"]);
});

it("LINK_RELATIONS includes hierarchical relations", () => {
  expect(LINK_RELATIONS).toContain("part_of");
  expect(LINK_RELATIONS).toContain("coordinates");
});
```

### Acceptance Criteria

- [ ] `NODE_KINDS` replaces `NODE_TYPES` in DNA
- [ ] `LINK_RELATIONS` includes `part_of` and `coordinates`
- [ ] `Node` interface has `kind` and `tags` (no `parentId`)
- [ ] Tripwire test updated and passing
- [ ] `npm run check` green

---

## MP-NODE-2: Memory/Store

**Goal**: Add helper functions for querying hierarchy through Links.

### New Store Functions

```typescript
/**
 * Get nodes that this node is "part_of" (its "parents").
 * A node can have multiple part_of relationships.
 */
function getParentNodes(state: State, nodeId: string): Node[] {
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
function getChildNodes(state: State, nodeId: string): Node[] {
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
 */
function getNodeAncestry(state: State, nodeId: string): Node[] {
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
 */
function getNodeDescendants(state: State, nodeId: string): Node[] {
  const descendants: Node[] = [];
  const visited = new Set<string>();

  function traverse(id: string): void {
    if (visited.has(id)) return;
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
function getRootNodes(state: State): Node[] {
  const nodesWithParents = new Set(
    state.links
      .filter((link) => link.relation === "part_of")
      .map((link) => link.sourceId),
  );

  return state.nodes.filter((node) => !nodesWithParents.has(node.id));
}

/**
 * Check if creating a part_of link would create a cycle.
 */
function wouldCreateCycle(
  state: State,
  childId: string,
  parentId: string,
): boolean {
  // If the proposed parent is already a descendant of the child, it's a cycle
  const descendants = getNodeDescendants(state, childId);
  return descendants.some((d) => d.id === parentId);
}
```

### Link Validation

Add validation when creating `part_of` Links:

```typescript
function validatePartOfLink(state: State, link: Link): Result<void> {
  if (link.relation !== "part_of") {
    return { ok: true, value: undefined };
  }

  // Check for cycles
  if (wouldCreateCycle(state, link.sourceId, link.targetId)) {
    return {
      ok: false,
      error: `Cannot create part_of link: would create cycle between ${link.sourceId} and ${link.targetId}`,
    };
  }

  // Both nodes must exist
  if (!getNodeById(state, link.sourceId)) {
    return { ok: false, error: `Source node not found: ${link.sourceId}` };
  }
  if (!getNodeById(state, link.targetId)) {
    return { ok: false, error: `Target node not found: ${link.targetId}` };
  }

  return { ok: true, value: undefined };
}
```

### Acceptance Criteria

- [ ] `getParentNodes()` returns nodes linked via `part_of`
- [ ] `getChildNodes()` returns nodes that link to this node via `part_of`
- [ ] `getNodeAncestry()` returns full chain to roots
- [ ] `getNodeDescendants()` returns all descendants
- [ ] `getRootNodes()` returns nodes without `part_of` links
- [ ] `wouldCreateCycle()` detects potential cycles
- [ ] Cycle detection prevents invalid `part_of` links
- [ ] `npm run check` green

---

## MP-NODE-3: Regulator

**Goal**: Make regulatory constraints work with the new node kinds and relationship-based hierarchy.

### Scoped Constraints

Current constraints in DNA remain **per-node**, not aggregated across relationships:

```typescript
export const MAX_ACTIVE_EXPLORE_PER_NODE = 1;
export const MAX_ACTIVE_STABILIZE_PER_VARIABLE = 1;
```

A "parent" node's Episode limits are independent of its "children's". This preserves autonomy.

### Cross-Node Queries (Opt-In Aggregation)

New query functions for relationship-aware views:

```typescript
/**
 * Get all Variables for a node and its descendants.
 * Useful for aggregate dashboards.
 */
function getVariablesWithDescendants(state: State, nodeId: string): Variable[] {
  const descendantIds = new Set([
    nodeId,
    ...getNodeDescendants(state, nodeId).map((n) => n.id),
  ]);

  return state.variables.filter((v) => descendantIds.has(v.nodeId));
}

/**
 * Get all active Episodes for a node and its descendants.
 */
function getActiveEpisodesWithDescendants(
  state: State,
  nodeId: string,
): Episode[] {
  const descendantIds = new Set([
    nodeId,
    ...getNodeDescendants(state, nodeId).map((n) => n.id),
  ]);

  return state.episodes.filter(
    (e) => e.status === "Active" && descendantIds.has(e.nodeId),
  );
}

/**
 * Aggregate status: is any descendant in distress?
 * Returns the "worst" status across the node and its descendants.
 */
function getAggregateNodeHealth(
  state: State,
  nodeId: string,
): "healthy" | "warning" | "critical" {
  const variables = getVariablesWithDescendants(state, nodeId);

  const hasLow = variables.some((v) => v.status === "Low");
  const hasHigh = variables.some((v) => v.status === "High");
  const hasUnknown = variables.some((v) => v.status === "Unknown");

  if (hasLow) return "critical";
  if (hasHigh || hasUnknown) return "warning";
  return "healthy";
}
```

### Node Kind Validation (Soft)

Optionally warn on unusual relationship patterns:

```typescript
function validateNodeRelationship(state: State, link: Link): Result<void> {
  if (link.relation !== "part_of") {
    return { ok: true, value: undefined };
  }

  const child = getNodeById(state, link.sourceId);
  const parent = getNodeById(state, link.targetId);

  if (!child || !parent) {
    return { ok: false, error: "Node not found" };
  }

  // Soft warnings (not blocking)
  // domain nodes typically have agent parents
  // system nodes can be roots or have agent parents
  // These are conventions, not hard rules

  return { ok: true, value: undefined };
}
```

### Acceptance Criteria

- [ ] Episode limits enforced per-node (not aggregated across relationships)
- [ ] `getVariablesWithDescendants()` includes related nodes
- [ ] `getActiveEpisodesWithDescendants()` includes related nodes
- [ ] `getAggregateNodeHealth()` summarizes descendant health
- [ ] `npm run check` green

---

## MP-NODE-4: Data Migration

**Goal**: Migrate existing data from binary types to new kinds.

### Migration Logic

```typescript
function migrateNodeKinds(state: State): State {
  return {
    ...state,
    schemaVersion: SCHEMA_VERSION + 1,
    nodes: state.nodes.map((node) => {
      // Map old type to new kind
      const oldType = (node as { type?: string }).type;

      return {
        id: node.id,
        kind: "agent" as const, // Both Personal and Org become agent
        name: node.name,
        description: node.description,
        tags:
          oldType === "Personal"
            ? ["personal"]
            : oldType === "Org"
              ? ["org"]
              : [],
        createdAt: node.createdAt,
      };
    }),
  };
}
```

### Migration Strategy

1. Increment `SCHEMA_VERSION` in DNA
2. Add migration function to `src/libs/memory/internal/migrations.ts`
3. Migration runs automatically on state load if version mismatch
4. Old `type` field is dropped after migration
5. No `part_of` Links are created—existing nodes remain as independent roots

### Acceptance Criteria

- [ ] Existing `Personal` nodes become `agent` with tag `["personal"]`
- [ ] Existing `Org` nodes become `agent` with tag `["org"]`
- [ ] Schema version incremented
- [ ] Migration is idempotent (safe to run multiple times)
- [ ] No hierarchy Links created (user adds these explicitly later)
- [ ] `npm run check` green

---

## MP-NODE-5: Engine Node Bootstrap

**Goal**: Create the Becoming Engine's own Node as a demonstration of recursive viability.

### The Engine Node

```typescript
const ENGINE_NODE: Node = {
  id: "system:becoming-engine",
  kind: "system",
  name: "Becoming Engine",
  description: "The regulatory system itself, eating its own dogfood",
  tags: ["meta", "infrastructure", "dogfood"],
  createdAt: "2026-01-01T00:00:00.000Z",
};
```

### Engine Variables

| Variable ID                     | Name               | Description                           | Proxies                                   |
| ------------------------------- | ------------------ | ------------------------------------- | ----------------------------------------- |
| `var:engine:code-health`        | Code Health        | Is the codebase in good shape?        | Test coverage %, lint errors, type errors |
| `var:engine:ux-coherence`       | UX Coherence       | Is the UI consistent and usable?      | Manual assessment, user feedback          |
| `var:engine:doctrine-alignment` | Doctrine Alignment | Does the system match the philosophy? | ADR compliance, constraint violations     |
| `var:engine:adoption`           | Adoption           | Are people using it?                  | Active users, session frequency           |

### Engine Models (Initial)

```typescript
const ENGINE_MODELS: Model[] = [
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
];
```

### Bootstrap Location

Create `data/engine-state.json` (separate from user state) or add engine node to existing state with clear separation.

**Recommended**: Separate file for engine state. The engine regulates itself independently—this is autonomy in action.

### CLI Support

```bash
# Target the engine node explicitly
be --node system:becoming-engine status
be --node system:becoming-engine signal "Tests are failing, CI is red"
```

### Acceptance Criteria

- [ ] Engine Node created with kind `system`
- [ ] Engine Variables defined (code_health, ux_coherence, doctrine_alignment, adoption)
- [ ] Engine Models defined (normative constraints, procedural rules)
- [ ] Engine state persisted (separate file or clearly scoped)
- [ ] CLI can target engine node: `be --node system:becoming-engine status`
- [ ] `npm run check` green

---

## MP-NODE-6: UI Updates

**Goal**: Support flexible node kinds and relationship-based hierarchy in the web UI.

### Node Selector

Add a node selector to the UI header:

```tsx
// components/NodeSelector.tsx
function NodeSelector({ nodes, links, currentNodeId, onSelect }: Props) {
  const rootNodes = getRootNodes({ nodes, links } as State);

  return (
    <select value={currentNodeId} onChange={(e) => onSelect(e.target.value)}>
      {rootNodes.map((node) => (
        <NodeOption
          key={node.id}
          node={node}
          nodes={nodes}
          links={links}
          depth={0}
        />
      ))}
    </select>
  );
}

// Recursive option rendering for hierarchy
function NodeOption({ node, nodes, links, depth }: Props) {
  const children = getChildNodes({ nodes, links } as State, node.id);
  const indent = "\u00A0\u00A0".repeat(depth); // Non-breaking spaces
  const kindIcon =
    node.kind === "agent" ? "👤" : node.kind === "system" ? "⚙️" : "📁";

  return (
    <>
      <option value={node.id}>
        {indent}
        {kindIcon} {node.name}
      </option>
      {children.map((child) => (
        <NodeOption
          key={child.id}
          node={child}
          nodes={nodes}
          links={links}
          depth={depth + 1}
        />
      ))}
    </>
  );
}
```

### Breadcrumb Navigation

Show the current node's ancestry:

```tsx
function NodeBreadcrumb({ nodeId, state }: Props) {
  const currentNode = getNodeById(state, nodeId);
  const ancestors = getNodeAncestry(state, nodeId).reverse(); // Root first

  return (
    <nav className="breadcrumb">
      {ancestors.map((node) => (
        <span key={node.id}>
          <a href={`?node=${node.id}`}>{node.name}</a>
          <span className="separator">/</span>
        </span>
      ))}
      <span className="current">{currentNode?.name}</span>
    </nav>
  );
}
```

### Scoped Views

All existing views (Variables, Episodes, Actions) should respect the current node:

- Show only items belonging to the current node
- Toggle to "include related nodes" for aggregate views
- Node kind displayed with appropriate icon

### Node Relationship Management (Future)

For MP-NODE-6, focus on **reading** the hierarchy. Relationship creation can be a follow-up:

- Create new `part_of` link (add child to current node)
- Remove `part_of` link
- Visualize relationships

### Acceptance Criteria

- [ ] Node selector shows hierarchy based on `part_of` links
- [ ] Selecting a node scopes Variables/Episodes/Actions to that node
- [ ] Breadcrumb shows current node's ancestry
- [ ] Node kind displayed with icon (agent/system/domain)
- [ ] "Include related nodes" toggle for aggregate views
- [ ] `npm run check` green

---

## Sequencing

```
MP-NODE-1 (DNA + Types)
    │
    ▼
MP-NODE-2 (Memory/Store)
    │
    ├──────────────────┐
    ▼                  ▼
MP-NODE-3          MP-NODE-4
(Regulator)        (Migration)
    │                  │
    │                  ▼
    │              MP-NODE-5
    │              (Engine Node)
    │                  │
    ▼                  │
MP-NODE-6 ◄────────────┘
(UI Updates)
```

**Critical path**: MP-NODE-1 → MP-NODE-2 → MP-NODE-4 → MP-NODE-5

**Parallel work**: MP-NODE-3 can happen alongside MP-NODE-4/5

**Depends on MP12**: MP-NODE-6 requires the web UI foundation

---

## Risks & Mitigations

| Risk                                               | Mitigation                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------ |
| Over-linking (users create too many relationships) | Soft warnings; documentation on when to use sub-nodes vs Variables |
| Complex relationship graphs (hard to navigate)     | Default to flat view; hierarchy is opt-in progressive disclosure   |
| Cycles in relationships                            | Cycle detection in `validatePartOfLink()`                          |
| Migration breaks existing data                     | Thorough migration tests; backup before migration                  |
| Multiple parents confuse users                     | Clear UI showing all relationships; breadcrumb shows one path      |

---

## Key Design Decisions

### Why Links Instead of `parentId`?

The doctrine says nodes are autonomous organisms that "regulate independently." Structural containment (`parentId`) implies ownership. Links express relationships between peers.

**A team isn't "contained in" a company—it's a viable system that has a `part_of` relationship with another viable system.**

This is a subtle but important distinction that preserves autonomy.

### Why Three Kinds?

- **agent**: Things that can decide and act (humans, orgs, teams, AIs)
- **system**: Technical infrastructure that maintains viability (software, services)
- **domain**: Bounded contexts that organize regulation (health, creative, projects)

These are semantic hints, not hard constraints. A project could be a `domain` (context) or a `system` (technical) depending on what's being regulated.

### Why Allow Multiple Parents?

A project might be `part_of` both a team (organizationally) and a creative domain (contextually). This reflects real-world complexity where things belong to multiple categories.

---

## Success Criteria

The architecture is successful when:

1. **A user can model their life as a recursive viable system**: Personal node with Health, Creative, Professional as related domain nodes, each with their own Variables and Episodes.

2. **An organization can model its structure**: Company with Teams and Projects as related nodes, each regulating independently.

3. **The Becoming Engine regulates itself**: The system uses its own primitives to track code health, UX coherence, and doctrine alignment.

4. **Autonomy is preserved**: Nodes cannot directly mutate each other's state. Episodes don't propagate. Pressure doesn't leak across relationships.

5. **Multiple relationships work**: A project can be related to both a team and a domain without conflict.

6. **The doctrine holds**: Viability first, explicit learning, baseline quiet, anti-capture. Hierarchy doesn't undermine these principles.
