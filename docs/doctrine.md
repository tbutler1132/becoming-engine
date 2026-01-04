# The Doctrine of the Becoming Engine

> The philosophical foundation. Read this first.

If you want the broader product-level framing (what we’re building, what it is not, and the anti-capture boundary), see `docs/vision.md`.

---

## 1. Ontological Premise

Humans and organizations are not optimizing systems.
They are regulatory organisms operating under uncertainty.

Their primary imperative is viability, not maximization.

## 2. Core Claim

Sustainable change does not emerge from fixed goals, persistent plans, or identity commitments.

It emerges from:

- regulating critical variables within viable ranges
- detecting instability early
- intervening temporarily
- learning explicitly
- returning to baseline functioning

## 3. Viability First

A system is successful when it:

- remains functional
- preserves agency
- maintains optionality
- avoids brittleness
- recovers from disturbance

Excellence is secondary.
Optimization is conditional.
Survival precedes ambition.

### 3a. Ambition Through Viability

This system is not anti-ambition. It is a bet on how ambition actually works.

Direct optimization is fragile:

- it creates brittleness
- it burns capacity faster than it builds
- it collapses under uncertainty

Regulated ambition compounds:

- Viability creates capacity
- Capacity enables Explore episodes
- Explore produces learning
- Learning accumulates in Models
- Models become competitive advantage

Excellence emerges from organisms that can sustain effort, not just exert it.

The system supports intensity — bounded, finite, recoverable intensity.
It does not support permanent mobilization.

The goal is not to want less. The goal is to pursue what you want from stable ground.

## 4. Regulation Over Optimization

The system does not pursue ends directly.

It:

- monitors dimensions of viability (Variables)
- intervenes only when drift or uncertainty accumulates
- applies finite, bounded interventions (Episodes)
- integrates learning into future behavior (Models)

When nothing is leaking, the system is idle.

Idleness is a success state.

## 5. Temporary Intervention

All deliberate change occurs through Episodes.

Episodes are:

- explicitly temporary
- hypothesis-driven
- non-identity-defining
- closeable by design

There are two kinds:

- **Stabilize**: restore viability
- **Explore**: reduce uncertainty through learning

No Episode is permanent.
No intervention becomes identity.

### 5a. Homeostasis and Homeorhesis

This system regulates for both short-term stability and long-term becoming.

**Homeostasis** (Variables): maintaining viability around preferred ranges in the short term. Deviations are corrected. Return to baseline is the goal.

**Homeorhesis** (Episodes): maintaining coherence of _trajectory_ over time. Preferred ranges themselves may evolve. Stability exists along a path, not at a fixed point.

Variables preserve short-term viability.
Episodes enable long-term becoming.

Preferred ranges are not fixed constants. They are beliefs about what "viable" means _now_, given this organism in this environment. Updating a preferred range is a Model update — deliberate, rare, and governed through an Episode.

During Explore Episodes, temporary excursions outside current preferred ranges are expected. The system does not treat growth as instability.

A growing organism must change its baselines. This is not dysregulation — it is becoming.

## 6. Explicit Learning

Learning is not implicit or assumed.

A system has learned only if:

- a belief is made explicit
- a procedure is articulated
- or a boundary is clarified

If no Model changes, learning has not occurred.

## 7. Boundaries Without Identity

Values and standards exist as constraints, not self-concepts.

They define:

- what will not be done
- what requires explicit exception

They are revisable if reality proves them wrong.

Moralization is replaced with legibility.

## 8. Baseline Is the Goal

Most life and work should occur outside the system.

The system exists to:

- prevent collapse
- reduce unnecessary pressure
- surface learning when needed

It disappears when stability returns.

## 9. Separation of Organisms

Individuals and organizations are distinct organisms.

They:

- regulate independently
- learn independently
- interact via signals and artifacts
- do not share internal pressure or backlogs

Coordination occurs without identity bleed.

## 10. Anti-Myth Principle

The system rejects:

- heroic narratives
- permanent motivation
- total clarity
- forced meaning

Meaning is allowed to emerge.
Ambition is permitted, not enforced.

## 11. Final Axiom

You do not optimize your life or your organization.

You regulate viability and learn under uncertainty.

Change emerges through finite experiments, not self-coercion.

When stability holds, the system goes quiet. It does not go blind.

Capacity surplus is visible in Variables. The choice to act remains yours.

And from that quiet, excellence becomes possible.

---

## 12. Core Object Specifications

### Variables

A Variable is a regulated dimension of viability.

**Fields:**

- id, name, status (Low / InRange / High / Unknown)
- preferredRange (min, max) — target bounds
- stability — how stable over time (0.0 to 1.0)
- confidence — how confident in the reading (0.0 to 1.0)
- proxies — what signals inform this variable

**Invariants:**

- Variables are not optimized
- Variables may be "unknown"
- "High" is not automatically bad
- Stability matters more than instantaneous value
- Preferred ranges are revisable beliefs, not fixed constants (see 5a)

### Episodes

An Episode is a temporary intervention.

**Types:** Stabilize (restore viability) or Explore (reduce uncertainty through learning)

**Fields:**

- id, type, status (Active / Closing / Closed / Abandoned)
- variableId — what Variable this addresses (Stabilize only)
- objective — the hypothesis or goal
- openedAt, closedAt — timestamps
- timeboxDays — how long before episode expires
- closureConditions — what must be true to close
- linkedModelIds — models this episode should update
- closureNoteId — artifact produced on close

**Invariants:**

- Episodes are finite and must be closeable
- At most 1 active Explore Episode per Node
- At most 1 active Stabilize Episode per Variable
- Explore Episodes require Model updates to close

### Models

A Model is an explicit belief.

**Types:** Descriptive (how reality behaves), Procedural (methods that work), Normative (constraints)

**Fields:**

- id, type, statement (the belief content)
- confidence — how certain (0.0 to 1.0)
- scope — personal, org, or domain
- enforcement — none, warn, or block (for Normative)
- exceptionsAllowed — whether exceptions can be logged

**Invariants:**

- Models must be explicit
- Models are revisable
- Normative Models may block actions or episodes

### Actions

An Action is a disposable execution unit.

**Fields:**

- id, description, status (Pending / Done)
- episodeId — optional; only episode-scoped actions carry authority

**Invariants:**

- Actions carry no intrinsic meaning
- Actions may be orphaned
- Actions disappear when complete
- Only Actions from active Episodes are surfaced by default

### Links

A Link defines a typed relationship between objects.

**Fields:**

- sourceId, targetId — object references
- relation — supports, tests, blocks, responds_to, etc.
- weight — optional strength/confidence

### Notes

A Note is unstructured context.

**Fields:**

- id, content, createdAt
- tags, linkedObjects

**Invariants:**

- Notes do not imply action
- Notes are inert until reviewed
- Notes may later be promoted to Models

---

## 13. Two-Layer Ontology (Future Vision)

The system distinguishes between two ontological layers:

### Regulatory Layer (Fixed)

Variables, Episodes, Actions — how the organism regulates itself.

This layer is closed and minimal. Its constraints are hard-coded.

### World Model Layer (Dynamic)

Entities, Schemas, Links, Models, Notes — what the organism believes about reality.

This layer is open and extensible. Users may define new object types (Schemas) and create instances (Entities) to model their external environment: people, projects, domains, concepts.

The regulatory layer references the world model layer. Variables may be affected by specific entities. Episodes may be scoped to domains. Models describe beliefs about entities.

This separation preserves regulatory simplicity while enabling rich, structured knowledge representation.

---

## 14. Autonomous Regulator (Future Vision)

The Regulator operates as a state machine:

**States:** IDLE, EVALUATING, ASSESSING, OPENING_EPISODE, MONITORING, CLOSING_EPISODE, DEFERRING

The Regulator:

- Evaluates Variable states against thresholds
- Detects pressure and uncertainty
- Selects candidate Episodes (or "none")
- Enforces concurrency and constraints
- Monitors active Episodes
- Validates closure conditions
- Integrates learning into Models

The Regulator does NOT:

- Schedule Actions
- Assign work
- Manage execution order

"None" is a valid and common outcome. The system is successful when it is mostly inactive.

---

## 15. Automation Doctrine

Automation is execution of already-trusted behavior. It is subordinate to regulation and learning.

**First Principle:**

Automation is NOT the Regulator.
Automation is NOT decision-making.
Automation is NOT optimization.

The system decides when something matters.
Automation decides how something repeats safely.

**Canonical Flow:**

Sense → Store → Check Procedure → Enforce Constraints → Execute → Log

1. Sensorium senses something (event, signal, input)
2. Memory updates (Note, proxy, state)
3. A Procedural Model determines whether action is appropriate
4. Membrane enforces constraints and permissions
5. An Action executes (or is queued for approval)
6. Results are logged back into Memory

**Invariants:**

- Sensorium never triggers Actions directly
- Automation never invents behavior
- Automation never opens Episodes
- Every automated step passes through Membrane

**Automation Levels (Earned Trust):**

- Level 0: Suggest / draft only (default)
- Level 1: Auto-queue with approval
- Level 2: Auto-execute in narrow envelopes
- Never: High-stakes judgment or identity-bearing actions

**Automation serves homeostasis, not homeorhesis.**

Automate what preserves baseline. Never automate identity change, growth, or "what you should become." Growth requires awareness and choice — it cannot be delegated to a procedure.

Procedural Models are the only legitimate bridge between sensing and action. They are explicit, bounded, reusable, and earned through learning.

The approval queue lives in Notes. Drafts are Notes, reviewed during the normal review cycle.

**Central Doctrine (One Sentence):**

Automation in the Becoming Engine executes what is already known to be safe; it never decides what matters, and it never replaces learning.

---

## One-Line Summary

The Becoming Engine is a cybernetic doctrine for preserving viability, enabling learning, and allowing ambition without identity collapse through temporary, bounded interventions.
