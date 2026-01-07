# ADR 0006: Recursive Node Architecture

## Status

Proposed

## Context

The current system has a binary node type: `Personal | Org`. This was designed to protect against "identity bleed" between individuals and organizations—a valid concern rooted in the doctrine's insistence that organisms regulate independently.

However, this binary is too restrictive for real-world use:

1. **Sub-domains within a person**: A person might want to regulate Health, Creative Work, and Professional Identity as separate viable sub-systems, each with their own Variables and Episodes.

2. **Org hierarchy**: Organizations contain teams, teams contain projects. Each level has its own viability concerns. A Team might open a Stabilize Episode that the Company doesn't need to see.

3. **Non-human systems**: The Becoming Engine itself could be a Node—regulated by the same principles it implements. Other technical systems (infrastructure, services) could also be modeled as Nodes.

4. **Recursive viability**: Stafford Beer's Viable System Model demonstrates that viable systems are fractal—every viable system contains viable systems and is contained within viable systems. The current binary doesn't support this.

The goal is to generalize Node types while preserving the doctrine's constraints on autonomy and identity separation.

## Decision

### 1. Replace Binary Node Types with Node Kinds

Instead of `NODE_TYPES = ["Personal", "Org"]`, introduce semantic kinds:

```typescript
export const NODE_KINDS = ["agent", "system", "domain"] as const;
```

**Definitions:**

- **agent**: An entity with agency that can initiate actions and make decisions. Examples: a person, an organization, a team, an AI agent.
- **system**: A technical or infrastructure system that maintains operational viability. Examples: the Becoming Engine itself, a production service, a codebase.
- **domain**: A bounded context or life area within an agent. Examples: health, creative work, a specific project, financial management.

### 2. Hierarchy via Links, Not Structural Nesting

**Critical design decision**: Hierarchy is a _relationship_, not a _containment structure_.

Nodes are autonomous organisms. They don't "belong to" other nodes—they have _relationships with_ other nodes. This preserves the doctrine's principle:

> "Individuals and organizations are distinct organisms. They regulate independently, learn independently, interact via signals and artifacts."

**Implementation**: Extend `LINK_RELATIONS` to include hierarchical relationships:

```typescript
export const LINK_RELATIONS = [
  "supports",
  "tests",
  "blocks",
  "responds_to",
  "derived_from",
  // NEW: hierarchical relations
  "part_of", // child → parent (domain:health part_of agent:tim)
  "coordinates", // parent → child (agent:company coordinates agent:team)
] as const;
```

**Example hierarchy expressed as Links**:

```typescript
// Tim's health domain is part of Tim
{ sourceId: "domain:health", targetId: "agent:tim", relation: "part_of" }

// Tim's creative domain is part of Tim
{ sourceId: "domain:creative", targetId: "agent:tim", relation: "part_of" }

// Engineering team is part of the company
{ sourceId: "agent:team:eng", targetId: "agent:company", relation: "part_of" }

// A project could be part of BOTH a team and a domain (multiple relationships)
{ sourceId: "domain:project:x", targetId: "agent:team:eng", relation: "part_of" }
{ sourceId: "domain:project:x", targetId: "domain:creative", relation: "part_of" }
```

**Why Links instead of `parentId`**:

| Approach             | Pros                                                                                    | Cons                                              |
| -------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `parentId` on Node   | Simple queries, clear tree structure                                                    | Implies ownership, only one parent, less flexible |
| Links with `part_of` | Multiple relationships possible, nodes truly autonomous, consistent with existing model | Slightly more complex queries                     |

The Link approach is more doctrinally correct: nodes are peers with relationships, not containers with contents.

### 3. Preserve Autonomy: Nodes Regulate Independently

**Critical constraint**: All nodes are autonomous. They have their own Variables, Episodes, and Models. The doctrine's protection against "shared backlogs" and "identity bleed" is preserved:

- A node **owns** its Variables, Episodes, Actions, Models
- Another node **cannot** directly mutate a node's state (regardless of relationship)
- Episodes **do not** propagate across `part_of` relationships
- A "parent" node **may** sense related node status as a proxy (read-only aggregation via Links)

This is Beer's principle of **autonomy with accountability**: each recursive level regulates itself, but can be accountable to related nodes via signals.

### 4. Optional: Semantic Tags

For additional flexibility, Nodes can have optional tags:

```typescript
interface Node {
  id: string;
  kind: NodeKind;
  name: string;
  description?: string;
  tags?: string[]; // Optional semantic tags: ["personal"], ["team", "engineering"]
  createdAt: string;
}
```

Tags are informational, not structural. They enable filtering and grouping without changing the core ontology.

### 5. The Software as a Node (Dogfooding)

The Becoming Engine itself becomes a first-class Node of kind `system`. This enables:

- **Variables**: Code health, test coverage, UX coherence, doctrine alignment
- **Episodes**: "Stabilize: Fix CI pipeline", "Explore: What's the right Episode UX?"
- **Models**: "Normative: Never ship capture loops", "Procedural: All PRs require review"

This is genuine dogfooding at the ontological level—the system that helps you regulate is itself regulated by the same principles.

### 6. Migration from Binary Types

Existing `Personal` and `Org` nodes migrate as follows:

| Old Type | New Kind | Notes                                            |
| -------- | -------- | ------------------------------------------------ |
| Personal | agent    | Root node for an individual, tag: `["personal"]` |
| Org      | agent    | Root node for an organization, tag: `["org"]`    |

The migration is backwards-compatible. No hierarchy Links are created during migration—existing nodes remain as independent roots until the user explicitly creates relationships.

## Consequences

**Pros:**

- Enables true recursive viable systems (VSM-aligned)
- Supports sub-domains within a person (Health, Creative, etc.)
- Supports org hierarchy (Company → Team → Project)
- Enables the software itself as a regulated Node
- Preserves autonomy constraints from the doctrine
- Multiple relationships possible (a project can relate to both a team and a domain)
- Consistent with existing Link model
- Backwards-compatible with existing Personal/Org nodes

**Cons:**

- Hierarchy queries are slightly more complex (traverse Links instead of read `parentId`)
- UI must handle relationship-based hierarchy navigation
- Federation (Phase 4) must account for relationships in signal routing
- Risk of over-linking (users creating too many relationships)

**Mitigations:**

- Provide helper functions for common hierarchy queries
- UI defaults to showing the "current node" without deep relationship traversal
- Clear documentation on when to create sub-nodes vs. use Variables
- Soft warnings if a node has many `part_of` relationships

## Implementation Approach

See [Recursive Node Architecture Plan](../plans/recursive-node-architecture.md) for detailed microprojects.

**Summary:**

1. **MP-NODE-1**: Update DNA (Node kinds, new Link relations)
2. **MP-NODE-2**: Update Memory/Store (hierarchy queries via Links)
3. **MP-NODE-3**: Update Regulator (scoped episode limits, relationship-aware queries)
4. **MP-NODE-4**: Migrate existing data (Personal → agent, Org → agent)
5. **MP-NODE-5**: Bootstrap the Engine's own Node (system:becoming-engine)
6. **MP-NODE-6**: UI updates (node selector, relationship navigation)

## Notes

This decision aligns with Beer's Viable System Model principle of **recursion**: every viable system contains viable systems and is contained within viable systems. However, we implement this as _relationships_ rather than _containment_ to preserve the doctrine's emphasis on autonomy.

The three kinds (agent, system, domain) provide semantic meaning while remaining flexible. The `part_of` and `coordinates` Link relations express hierarchy without implying ownership.

**Key insight**: A team isn't "contained in" a company—it's a viable system that has a `part_of` relationship with another viable system. This is a subtle but important distinction that preserves the autonomy of each node.

## Related Decisions

- [ADR 0001: Organ Module Boundaries](0001-organ-module-boundaries.md) — Nodes are organisms with boundaries
- [ADR 0005: Plugin Architecture](0005-plugin-architecture.md) — Plugins may produce Observations scoped to specific Nodes
- Future: Federation with relationship-aware signal routing
