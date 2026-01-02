# ADR 0003: Automation Philosophy

## Status

Accepted

## Context

The Becoming Engine regulates viability and enables learning. As the system matures, there's a natural desire to automate repetitive, trusted behaviors — sending follow-up emails, formatting content, running standard workflows.

However, automation introduces risk:

- Runaway loops that optimize without constraint
- Hidden scope expansion that violates boundaries
- Reputational drift from unchecked actions
- Surveillance patterns that Goodhart-ify signals

We need an automation philosophy that enables execution power while preserving the core doctrine: regulate viability, learn explicitly, return to baseline.

## Decision

### First Principle: Automation Is Not the System

Automation is **not** the Regulator.
Automation is **not** decision-making.
Automation is **not** optimization.

**Automation is execution of already-trusted behavior.**

The system decides when something matters.
Automation decides how something repeats safely.

### Where Automation Lives

Automation lives across three existing modules:

| Module                | Role in Automation                                                                                    |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| **Sensorium**         | Ingests signals (events, emails, metrics, journal entries). Never decides or acts.                    |
| **Memory**            | Stores observations, Notes, Models, and state. Holds the learned procedures automation relies on.     |
| **Procedural Models** | Define how to act when conditions are met. The **only** legitimate bridge between sensing and action. |

The Regulator does **not** automate.
The Membrane **gates every** automated step.

### The Canonical Automation Flow

The only valid automation chain is:

```
Sense → Store → Check Procedure → Enforce Constraints → Execute → Log
```

More explicitly:

1. Sensorium senses something (event, signal, input)
2. Memory updates (Note, proxy, state)
3. A Procedural Model determines whether action is appropriate
4. Membrane enforces constraints and permissions
5. An Action executes (or is queued for approval)
6. Results are logged back into Memory

**Violations:**

- ❌ Sensorium never triggers Actions directly
- ❌ Automation never invents behavior
- ❌ Automation never opens Episodes

### Procedural Models: The Heart of Automation

Procedural Models are:

- **Explicit** — written down, not implicit
- **Bounded** — narrow scope, clear inputs/outputs
- **Reusable** — same procedure applies across contexts
- **Earned** — trust builds progressively through learning

They represent "this is safe to do automatically."

Examples:

- "Send follow-up email after 7 days if conditions are met"
- "Format content for platform X"
- "Run test suite on PR"
- "Draft reply but require approval"

### Chaining Procedural Models (Composition)

Procedural Models can be chained — at the execution level, following Unix philosophy:

**Correct chaining:**

- Small procedures with clear inputs/outputs
- Independent constraint checks at each step
- Stop cleanly on uncertainty

**Incorrect chaining:**

- One giant "do everything" procedure
- Hidden scope expansion mid-chain
- New judgment introduced during execution

### Automation Levels (Earned Trust)

Automation is progressive:

| Level     | Behavior                                         | Trust Required                       |
| --------- | ------------------------------------------------ | ------------------------------------ |
| **0**     | Suggest / draft only                             | Default for new procedures           |
| **1**     | Auto-queue with approval                         | After initial learning proves safety |
| **2**     | Auto-execute in narrow envelopes                 | After repeated success in level 1    |
| **Never** | High-stakes judgment or identity-bearing actions | Reserved for human decision          |

Automation expands only after learning proves safety. The approval queue lives in **Notes** — drafts are Notes, reviewed during the normal review cycle.

### The Membrane: Automation's Governor

The Membrane keeps automation sane. It enforces:

- Normative Model constraints
- Rate limits
- Approval requirements
- Scope boundaries ("envelopes")

**Key rule:** No automation step bypasses the Membrane — even if another automated step called it.

This prevents:

- Spam
- Reputational drift
- AI runaway behavior
- Accidental optimization loops

### Automation vs Episodes (Critical Distinction)

| Automation                       | Episodes                            |
| -------------------------------- | ----------------------------------- |
| Runs during baseline             | Opened by the Regulator             |
| Executes known, trusted behavior | Exist to restore stability or learn |
| Does not change beliefs          | May produce new Procedural Models   |
| Does not create pressure         | Never automated                     |

Automation **serves** Episodes, but **never replaces** them.

### "Sense Everything, Act on Almost Nothing"

The system can ingest:

- All email metadata
- Journal entries
- Activity logs
- Engagement signals

But defaults to:

- Observation
- Note creation
- Proxy updates

Action occurs **only** through trusted procedures. This avoids surveillance, Goodharting, and reflex loops.

### LLMs in Automation

LLMs may assist as **pattern detectors**, not authorities.

LLMs may:

- Highlight recurring themes
- Flag possible cognitive patterns (hedged)
- Surface questions

LLMs may **NOT**:

- Diagnose
- Prescribe
- Trigger Episodes
- Change Models directly

LLM outputs are **Notes only**, reviewed later by the human.

## Consequences

**Pros**

- Enables powerful automation without violating regulatory philosophy
- Progressive trust prevents premature auto-execution
- Membrane gating catches runaway behavior
- Approval queue uses existing Notes infrastructure
- Compatible with AI/LLM assistance (subordinate role)

**Cons**

- Requires explicit Procedural Model authoring (no magic)
- Approval friction for Level 1 procedures (by design)
- Chaining complexity must be managed carefully

## The Central Automation Doctrine (One Sentence)

> Automation in the Becoming Engine executes what is already known to be safe; it never decides what matters, and it never replaces learning.

## Notes

This decision establishes the **philosophy** of automation. Implementation details (trigger syntax, execution engine, scheduling) are deferred to the implementation milestone.

Key dependencies:

- MP6 (Models) — Procedural Models must exist
- MP9 (Sensorium v1) — Observations for signal ingestion
- MP10 (Membrane) — Constraint enforcement for gating
