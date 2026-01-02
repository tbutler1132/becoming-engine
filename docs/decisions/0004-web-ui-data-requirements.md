# ADR 0004: Web UI Data Requirements

**Status:** Proposed  
**Date:** 2026-01-02  
**Context:** Pre-MP12 analysis of what the Web UI will need from existing organs

---

## Summary

The Web UI (MP12) requires read-only access to system state for visualization. This document analyzes what data, types, and exports the UI layer needs, and confirms that `getStatusData` is sufficient for the initial read-only interface.

---

## 1. What Data Does 'status' Need to Display?

### Primary Status Display (Minimal)

The `StatusData` discriminated union from `regulator/types.ts` provides two modes:

```typescript
type StatusData =
  | { mode: "baseline"; node: NodeRef } // Quiet state
  | { mode: "active"; node: NodeRef; variables; episodes; actions }; // Active state
```

**Baseline mode displays:**

- Node reference (`Personal:personal` or `Org:org`)
- "Silence is Success" indicator

**Active mode displays:**

- Node reference
- Variables: `id`, `name`, `status` (Low | InRange | High)
- Episodes: `id`, `type`, `variableId?`, `objective`, `openedAt`
- Actions: `id`, `description`, `status`, `episodeId?`

### Extended Display (Rich UI)

For a full dashboard experience, the UI may also want:

| Data                  | Purpose                                        | Source                                              |
| --------------------- | ---------------------------------------------- | --------------------------------------------------- |
| `Model[]`             | Show beliefs, especially Normative constraints | `state.models`                                      |
| `Note[]`              | Display observations and closure notes         | `state.notes`                                       |
| `Link[]`              | Visualize relationships between objects        | `state.links`                                       |
| `MembraneException[]` | Show audit trail of constraint bypasses        | `state.exceptions`                                  |
| Closed `Episode[]`    | Display history and completed work             | `state.episodes.filter(e => e.status === "Closed")` |

---

## 2. Types to Expose for the UI Layer

### Core Ontology Types (from `memory/types.ts`)

These types define the data structures the UI will render:

```typescript
// Entity types
export type { Variable, Episode, Action, Note, Model, Link, MembraneException };
export type { State }; // Full state shape
export type { NodeRef, NodeId, NodeType }; // Multi-node support

// Enum types (for filters, badges, selectors)
export type { VariableStatus }; // "Low" | "InRange" | "High"
export type { EpisodeType }; // "Stabilize" | "Explore"
export type { EpisodeStatus }; // "Active" | "Closed"
export type { ActionStatus }; // "Pending" | "Done"
export type { ModelType }; // "Descriptive" | "Procedural" | "Normative"
export type { ModelScope }; // "personal" | "org" | "domain"
export type { EnforcementLevel }; // "none" | "warn" | "block"
export type { NoteTag }; // "inbox" | "pending_approval" | "processed" | "closure_note"
export type { LinkRelation }; // "supports" | "tests" | "blocks" | "responds_to" | "derived_from"
```

### Regulator Types (from `regulator/types.ts`)

```typescript
export type { StatusData }; // Primary status display data
```

### Membrane Types (from `membrane/types.ts`)

For displaying constraint feedback:

```typescript
export type { MembraneResult }; // "allow" | "warn" | "block" with details
export type { MembraneWarning }; // Warning details when proceeding
```

### Constants for UI Selectors

The UI needs constant arrays for dropdowns/filters:

```typescript
// From dna.ts (via memory/types.ts)
export { NODE_TYPES }; // ["Personal", "Org"]
export { VARIABLE_STATUSES }; // ["Low", "InRange", "High"]
export { EPISODE_TYPES }; // ["Stabilize", "Explore"]
export { EPISODE_STATUSES }; // ["Active", "Closed"]
export { ACTION_STATUSES }; // ["Pending", "Done"]
export { MODEL_TYPES }; // ["Descriptive", "Procedural", "Normative"]
export { NOTE_TAGS }; // ["inbox", "pending_approval", ...]
export { ENFORCEMENT_LEVELS }; // ["none", "warn", "block"]
```

---

## 3. Is `getStatusData` Sufficient for Initial Read-Only UI?

**Yes**, for an MVP read-only status display.

### What `getStatusData` Provides

```typescript
function getStatusData(state: State, node: NodeRef): StatusData;
```

| Capability                          | Provided? |
| ----------------------------------- | --------- |
| Baseline/Active mode detection      | ✅        |
| Variables for a node                | ✅        |
| Active episodes for a node          | ✅        |
| Pending actions for active episodes | ✅        |
| Node-scoped filtering               | ✅        |

### Limitations for Extended UI

| Feature               | `getStatusData` | Requires                          |
| --------------------- | --------------- | --------------------------------- |
| Closed episodes       | ❌              | Direct state access or new helper |
| Models display        | ❌              | Direct state access               |
| Notes display         | ❌              | Direct state access               |
| Links visualization   | ❌              | Direct state access               |
| Exception audit trail | ❌              | Direct state access               |
| Cross-node views      | ❌              | Multiple calls or new helper      |

**Recommendation:** For MVP, `getStatusData` is sufficient. For extended features, provide read-only `State` access.

---

## 4. Additional Exports Needed

### Already Exported (Sufficient for MVP)

From `regulator/index.ts`:

- `getStatusData` — Main status function
- `StatusData` type — Status display type

From `memory/index.ts`:

- All entity types and constants
- `Store` class for state persistence

### Recommended New Exports for Rich UI

No new exports required for read-only MVP. For extended features:

| Export                    | Location             | Purpose                   |
| ------------------------- | -------------------- | ------------------------- |
| `getClosedEpisodesByNode` | `regulator/logic.ts` | History display           |
| `getModelsByType`         | `regulator/logic.ts` | Filter models by category |
| `getNotesByTag`           | `regulator/logic.ts` | Inbox/processed filtering |

These can be added as needed following existing patterns.

---

## 5. UI Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web UI        │     │   API Layer     │     │   Organs        │
│   (React/etc)   │────▶│   (read-only)   │────▶│   (Memory/Reg)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
   Renders                 Calls                   Returns
   StatusData         getStatusData()           Pure data
   types                    │                       │
        │                   │                       │
        ▼                   ▼                       ▼
   ┌─────────┐        ┌─────────┐            ┌─────────┐
   │  View   │        │  JSON   │            │  State  │
   │ Layer   │◀───────│Response │◀───────────│   .json │
   └─────────┘        └─────────┘            └─────────┘
```

### Type Sharing Strategy

The UI layer can import types directly from the shared modules:

```typescript
// In UI code
import type { StatusData } from "@becoming-engine/regulator";
import type { Variable, Episode, Action } from "@becoming-engine/memory";
import { VARIABLE_STATUSES, EPISODE_TYPES } from "@becoming-engine/memory";
```

This maintains type safety across the boundary without runtime dependencies.

---

## 6. Conclusions

| Question                        | Answer                                                 |
| ------------------------------- | ------------------------------------------------------ |
| Status data well-defined?       | ✅ Yes — `StatusData` discriminated union              |
| Types exportable to UI?         | ✅ Yes — all types in public API (`index.ts`)          |
| No new mutations for read-only? | ✅ Correct — `getStatusData` is pure read              |
| Additional exports needed?      | ⚠️ Only for extended features (history, models, notes) |

### Acceptance Criteria Met

- [x] Status data structure is well-defined (`StatusData` type)
- [x] Types are exportable to the UI layer (via barrel exports)
- [x] No new mutations needed for read-only UI (`getStatusData` is sufficient)

---

## References

- `src/libs/regulator/types.ts` — StatusData definition
- `src/libs/regulator/logic.ts` — getStatusData implementation
- `src/libs/memory/types.ts` — Core ontology types
- `src/apps/cli/format.ts` — Example of StatusData consumption
