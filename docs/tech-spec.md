# **The Becoming Engine — Technical Specification**

## Version

`v0.1-draft`

---

## 1. System Overview

### 1.1 Purpose

The Becoming Engine is a **cybernetic regulation system** that maintains viability and enables learning for individuals and organizations (“Nodes”).

The system:

- intervenes only when pressure or uncertainty warrants it
- uses finite, temporary interventions
- encodes learning as explicit belief updates
- avoids persistent task backlogs or goal optimization

---

### 1.2 Non-Goals

The system does **not**:

- manage long-term plans
- optimize productivity metrics
- track habits indefinitely
- enforce identity commitments
- replace calendars or external execution tools

---

## 2. Core Concepts (Formal Definitions)

### 2.1 Node

A **Node** represents an independent organism.

Types:

- `individual`
- `collective`

Each Node has:

- its own Variables
- its own Episodes
- its own Models
- its own Regulator instance

Nodes do **not** share backlogs or pressure state.

---

### 2.2 Variable

A **Variable** is a regulated dimension of viability.

### Required fields

```json
{
  "id": "var_agency",
  "type": "Variable",
  "name": "Agency",
  "preferred_range": { "min": 0.4, "max": 0.7 },
  "status": "in_range | low | high | unknown",
  "stability": 0.0,
  "confidence": 0.0,
  "proxies": []
}
```

### Invariants

- Variables are **not optimized**
- Variables may be `unknown`
- “High” is not automatically bad
- Stability matters more than instantaneous value

---

### 2.3 Episode

An **Episode** is a temporary intervention.

### Episode types

- `stabilize`
- `explore`

### Required fields

```json
{
  "id": "ep_001",
  "type": "Episode",
  "episode_type": "stabilize | explore",
  "status": "active | closing | closed | abandoned",
  "variable_id": "var_agency | null",
  "opened_at": "ISO-8601",
  "timebox_days": 14,
  "closure_conditions": [],
  "linked_models": [],
  "linked_constraints": [],
  "closure_note_id": null
}
```

### Invariants

- Episodes are finite
- Episodes must be closeable
- At most **1 active Explore Episode per Node**
- At most **1 active Stabilize Episode per Variable**
- Explore Episodes require Model updates to close

---

### 2.4 Model

A **Model** is an explicit belief.

### Model types

- `descriptive`
- `procedural`
- `normative` (constraints)

### Required fields

```json
{
  "id": "model_001",
  "type": "Model",
  "model_type": "descriptive | procedural | normative",
  "statement": "Publishing under my name increases commitment.",
  "confidence": 0.0,
  "scope": "personal | org | domain",
  "enforcement": "none | warn | block",
  "exceptions_allowed": true
}
```

### Invariants

- Models must be explicit
- Models are revisable
- Normative Models may block actions or episodes

---

### 2.5 Action

An **Action** is a disposable execution unit.

### Required fields

```json
{
  "id": "act_001",
  "type": "Action",
  "status": "todo | done",
  "episode_id": "ep_001 | null",
  "scheduled_for": null,
  "deadline": null,
  "external_refs": []
}
```

### Invariants

- Actions carry no intrinsic meaning
- Actions may be orphaned
- Actions disappear when complete
- Only Actions from active Episodes are surfaced by default

---

### 2.6 Note

A **Note** is unstructured context.

### Required fields

```json
{
  "id": "note_001",
  "type": "Note",
  "content": "...",
  "created_at": "ISO-8601",
  "tags": [],
  "linked_objects": []
}
```

### Invariants

- Notes do not imply action
- Notes are inert until reviewed
- Notes may later be promoted to Models

---

### 2.7 Link

A **Link** defines a typed relationship.

```json
{
  "source_id": "uuid",
  "target_id": "uuid",
  "relation": "supports | tests | blocks | responds_to",
  "weight": 0.5
}
```

---

## 3. Regulator

### 3.1 Responsibilities

The Regulator:

1. Evaluates Variable states
2. Detects pressure and uncertainty
3. Selects candidate Episodes
4. Enforces concurrency and constraints
5. Monitors active Episodes
6. Validates closure conditions
7. Integrates learning into Models

The Regulator does **not**:

- schedule Actions
- assign work
- manage execution order

---

### 3.2 Regulator State Machine

States:

- `IDLE`
- `EVALUATING`
- `ASSESSING`
- `OPENING_EPISODE`
- `MONITORING`
- `CLOSING_EPISODE`
- `DEFERRING`

State transitions are event-driven and review-driven.

---

### 3.3 Candidate Episode Selection

Inputs:

- Variable pressure scores
- Uncertainty density
- Active Episodes
- Capacity estimates
- Normative constraints

Outputs:

- `stabilize` candidate
- `explore` candidate
- `none`
- `defer(reason)`

Rules:

- Critical Stabilize preempts Explore
- Explore requires surplus capacity
- “None” is a valid and common outcome

---

## 4. Sensorium

### 4.1 Role

The Sensorium ingests signals from:

- external APIs
- user input
- system artifacts

### 4.2 Output

All Sensorium inputs become either:

- Variable proxy updates
- Notes

No automatic ontology mutation is allowed.

---

## 5. Membrane

### 5.1 Role

The Membrane enforces:

- authentication
- authorization
- schema validation
- constraint enforcement

### 5.2 Constraint Handling

Normative Models may:

- block actions
- require exception logging
- emit warnings

---

## 6. Cortex (UI Layer)

### 6.1 Responsibilities

The Cortex:

- visualizes Variable states
- shows active Episodes
- surfaces relevant Actions
- exposes Models and Notes
- supports review workflows

### 6.2 UX Invariants

- Empty action lists are valid
- No persistent backlog views
- No global “to-do” board
- Review is the primary interaction

---

## 7. Review Cycle

### 7.1 Review Steps (Canonical)

1. Inspect Variables
2. Process Notes
3. Detect pressure
4. Decide on intervention (or none)
5. Open at most one Episode
6. Add Actions only if needed

Reviews may be heavier early on but do not change procedurally.

---

## 8. Baseline Behavior

Baseline behavior is defined as:

- no active Episodes
- Variables in range
- low cognitive overhead
- minimal surfaced Actions

Baseline work is intentionally untracked unless pressure emerges.

---

## 9. Federation (Multi-Node)

Nodes communicate via:

- Signals (intent, status, completion)
- Artifacts (documents, code, media)

Nodes do not share:

- tasks
- Episodes
- pressure state

---

## 10. Persistence Model

### 10.1 Storage

- Objects stored as typed records with JSON payloads
- Links stored as edge table
- Event log for regulator transitions

### 10.2 Guarantees

- Full auditability
- Explainable interventions
- Replayable regulator decisions

---

## 11. Bootstrapping

There is no explicit bootstrapping mode.

Bootstrapping is inferred from:

- instability density
- sparse Models
- frequent Episodes

High-volume capture is allowed at any time.

---

## 12. Safety and Failure Modes

### 12.1 Over-Intervention Prevention

- Concurrency limits
- Capacity gates
- “None” as valid outcome

### 12.2 Identity Safety

- No permanent Episodes
- No enforced habits
- No goal locking

---

## 13. Success Criteria

The system is successful when:

- it is mostly inactive
- users feel clarity without pressure
- learning accumulates
- baseline behavior stabilizes
- Episodes close cleanly

---

## 14. Versioning and Evolution

- Ontology changes require migration
- Models are versioned
- Regulator thresholds are configurable per Node

---

## 15. Summary

The Becoming Engine is a regulation-first system that formalizes:

- viability over optimization
- learning over planning
- intervention over tracking
- structure over pressure

Its technical design enforces restraint as a first-class property.

---

If you want next, I can:

- map this spec directly to **API endpoints**
- produce **database schemas**
- draft a **reference implementation outline**
- or write **acceptance tests** that encode the philosophy

Just say where you want to go.

[Tech Spec](https://www.notion.so/Tech-Spec-2d91d9b6dd6780f3aaa3d32af587fbf3?pvs=21)
