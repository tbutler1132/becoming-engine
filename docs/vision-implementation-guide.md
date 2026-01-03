# Vision Implementation Guide

> Practical paths from current foundation to full vision.

This document bridges `vision.md` (what we're building) and the current codebase (what exists). It sketches implementation approaches for the ambitious elements not yet built.

---

## 1. Federation: Multi-Node Coordination

**Vision goal:** Distributed, human-scale cybernetic network. Orgs as shared organisms. Tribe-like containers.

**Current state:** Single-node operation. `signaling/types.ts` defines `SignalEvent` envelope but no transport or consumption.

### Implementation Approach

#### Phase 1: Local Multi-Node

Before network transport, enable multiple nodes in one state file.

```typescript
// Already supported: NodeRef { type: "Personal" | "Org", id: string }
// Add: node registry and node-scoped views

interface NodeRegistry {
  nodes: NodeRef[];
  relationships: NodeRelationship[]; // e.g., "tim" memberOf "studio"
}
```

**Key moves:**

1. CLI/UI node switcher (`--node org:studio`)
2. Variables, Episodes, Actions already have `node: NodeRef`
3. Add `NodeRelationship` type for membership/stewardship

#### Phase 2: Signal Transport

Signals enable coordination without sharing internal state.

```typescript
// Already defined in dna.ts:
// SIGNAL_EVENT_TYPES = ["intent", "status", "completion"]

// Add: Outbox/Inbox pattern
interface SignalOutbox {
  pending: SignalEvent[]; // Not yet sent
  sent: SignalEvent[]; // Sent, awaiting ack
}

interface SignalInbox {
  received: SignalEvent[]; // Received, not processed
  processed: SignalEvent[]; // Handled
}
```

**Key moves:**

1. Add `signalOutbox` and `signalInbox` to State
2. CLI command: `signal emit intent "Starting exploration on X"`
3. File-based transport first (drop files in shared folder)
4. Later: HTTP/WebSocket transport via simple server

#### Phase 3: Shared Variables

Orgs have Variables that multiple personal nodes can signal to.

```typescript
// Variable already has node: NodeRef
// Add: who can signal to this variable

interface Variable {
  // ... existing fields
  signalPermissions?: {
    allowedNodes: NodeRef[]; // Who can send signals
    aggregation: "latest" | "consensus" | "steward-decides";
  };
}
```

**Anti-capture check:** Shared variables must not create hidden pressure. Signals are visible. No silent scoring.

---

## 2. Automation Doctrine: Earned Trust Levels

**Vision goal:** Automation executes what is already known to be safe. Never decides what matters.

**Current state:** All actions are manual. Procedural Models exist as a type but have no execution engine.

### Implementation Approach

#### Level 0: Suggest/Draft Only (Default)

Already partially present via Notes with `pending_approval` tag.

```typescript
// Automation proposes, human disposes
interface AutomationDraft {
  id: string;
  type: "episode" | "action" | "model";
  draft: OpenEpisodeParams | CreateActionParams | CreateModelParams;
  rationale: string; // Why automation suggests this
  proceduralModelId: string; // Which model authorized the suggestion
  createdAt: string;
  status: "pending" | "approved" | "rejected";
}
```

**Key moves:**

1. Add `drafts: AutomationDraft[]` to State
2. Sensorium interprets input → creates draft (not mutation)
3. CLI: `drafts list`, `drafts approve <id>`, `drafts reject <id>`
4. UI: Drafts section with approve/reject buttons

#### Level 1: Auto-Queue with Approval

```typescript
// Procedural Model gains automation config
interface Model {
  // ... existing fields
  automation?: {
    level: 0 | 1 | 2;
    envelope?: AutomationEnvelope; // Only for level 2
  };
}

interface AutomationEnvelope {
  maxActionsPerDay: number;
  allowedActionPatterns: string[]; // Regex patterns
  requiresEpisodeContext: boolean;
}
```

**Key moves:**

1. Procedural Model with `automation.level: 1` can auto-create Actions
2. Actions land in "approval queue" (Note with special tag or new collection)
3. Human reviews batch: approve all / reject all / cherry-pick

#### Level 2: Auto-Execute in Narrow Envelopes

```typescript
// Envelope constrains what can auto-execute
const exampleEnvelope: AutomationEnvelope = {
  maxActionsPerDay: 5,
  allowedActionPatterns: ["^Draft:", "^Schedule:"],
  requiresEpisodeContext: true, // Only within active episodes
};
```

**Key moves:**

1. Regulator checks envelope before auto-execution
2. All auto-executions logged to `automationLog: AutomationLogEntry[]`
3. Membrane still enforces Normative constraints (automation never bypasses)
4. Weekly digest: "Automation executed 12 actions. Review log."

**Anti-capture check:** Automation must never feel like pressure. If automation creates anxiety, reduce envelope or drop to Level 0.

---

## 3. Two-Layer Ontology: Regulatory + World Model

**Vision goal:** Fixed regulatory layer (Variables, Episodes, Actions) + extensible world model layer (Entities, Schemas, custom types).

**Current state:** Flat State with all types at same level.

### Implementation Approach

#### Conceptual Split

```typescript
// Regulatory Layer - FIXED, minimal, hard constraints
interface RegulatoryState {
  variables: Variable[];
  episodes: Episode[];
  actions: Action[];
}

// World Model Layer - EXTENSIBLE, user-defined
interface WorldModelState {
  schemas: Schema[]; // User-defined types
  entities: Entity[]; // Instances of schemas
  models: Model[]; // Beliefs about entities
  notes: Note[]; // Unstructured context
  links: Link[]; // Relationships
}

// Combined State
interface State {
  schemaVersion: SchemaVersion;
  regulatory: RegulatoryState;
  worldModel: WorldModelState;
  // ... membrane, signaling, etc.
}
```

#### Schema System (Minimal)

```typescript
interface Schema {
  id: string;
  name: string; // e.g., "Project", "Person", "Domain"
  fields: SchemaField[];
  icon?: string; // For UI
}

interface SchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "reference";
  required: boolean;
  referenceSchemaId?: string; // If type is "reference"
}

interface Entity {
  id: string;
  schemaId: string;
  data: Record<string, unknown>;
  createdAt: string;
}
```

**Key moves:**

1. Start with 2-3 built-in schemas: Project, Person, Domain
2. CLI: `entity create project "Becoming Engine"`
3. Episodes can reference entities: `episodeContext?: string[]` (entity IDs)
4. Models can describe entities: `aboutEntityId?: string`
5. Later: Custom schema creation via UI

**Anti-capture check:** World model is for understanding, not surveillance. No auto-tracking, no activity scores on entities.

---

## 4. Aesthetic Direction: Mythic Instrument

**Vision goal:** Mythic and aggressively beautiful. Baroque-modern. Capable of silence.

**Current state:** Clean, functional Next.js UI. Standard modern web aesthetic.

### Implementation Approach

#### Design Tokens First

```css
/* globals.css - mythic foundation */
:root {
  /* Palette: deep, reverent, not corporate */
  --bg-void: #0a0a0c;
  --bg-surface: #14141a;
  --text-primary: #e8e4dc;
  --text-muted: #8a8678;

  /* Accents: warm golds, not tech blues */
  --accent-gold: #c9a227;
  --accent-ember: #b85c38;

  /* States: organic, not traffic-light */
  --state-low: #b85c38; /* Ember, not red */
  --state-inrange: #4a7c59; /* Forest, not green */
  --state-high: #c9a227; /* Gold, not yellow */

  /* Typography: distinctive, not generic */
  --font-display: "Cormorant Garamond", serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "IBM Plex Mono", monospace;
}
```

#### Silence as Design Principle

```typescript
// UI should feel quiet when system is quiet
// Baseline mode: minimal chrome, maximum negative space

// Active mode: information appears, but without urgency
// No pulsing badges, no notification counts, no red dots
```

**Key moves:**

1. Dark theme as default (not dark-mode-as-afterthought)
2. Generous whitespace. Let UI breathe.
3. Typography hierarchy: Serif for titles, sans for body
4. Subtle animations: fade-in, not bounce. Ease, not spring.
5. Iconography: Custom, not generic. Consider: alchemical, astronomical, cartographic.
6. Baseline state: Almost empty screen. "All quiet." as the celebration.

#### Sound (Future)

Mythic instruments have sound. Consider:

- Subtle audio feedback for state transitions
- Optional. Always optional. Never notification sounds.
- More "singing bowl" than "ding"

---

## 5. Suggested Sequence

Based on current foundation and vision priorities:

| Phase | Focus                       | Why First                                       |
| ----- | --------------------------- | ----------------------------------------------- |
| **A** | Aesthetic overhaul          | Sets the tone. Affects all future work.         |
| **B** | Level 0 automation (drafts) | Low risk, high learning. Tests the pattern.     |
| **C** | Local multi-node            | Enables org testing without network complexity. |
| **D** | Two-layer ontology          | Natural once entities are needed for context.   |
| **E** | Signal transport            | After multi-node proves useful locally.         |
| **F** | Level 1-2 automation        | After Level 0 is trusted and understood.        |

---

## 6. Decision Checkpoints

Before implementing any of the above, run through the vision's decision filter:

- [ ] **Anti-capture:** Could this become surveillance/optimization? What prevents it?
- [ ] **Agency:** Does it increase ability to choose under pressure?
- [ ] **Continuity:** Does it preserve judgment + embodied rhythms?
- [ ] **Viability:** Does it preserve baseline quiet? Avoid permanent mobilization?
- [ ] **Learning:** Does it create better explicit models over time?
- [ ] **Beauty:** Does it deepen clarity/reverence rather than stimulate compulsion?

If any answer is unclear, pause and redesign.

---

## 7. What NOT to Build

Per the vision, explicitly avoid:

- ❌ Activity dashboards showing "engagement" metrics
- ❌ Streaks, points, or gamification
- ❌ Notification badges or unread counts
- ❌ AI that acts without explicit human approval
- ❌ Hidden rankings or comparisons between nodes
- ❌ Features that require daily check-in to feel "okay"
- ❌ Optimization targets masquerading as viability indicators

The system succeeds by disappearing when not needed. Build accordingly.
