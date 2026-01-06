# Roadmap (Non-Binding)

<!-- Last reviewed: 2026-01-02 -->

This roadmap describes **small, composable micro-projects** that move the system toward the doctrine without committing to a brittle plan.

**Principles:**

- **Viability first**: every step preserves a quiet baseline and keeps `npm run check` green.
- **Regulation over optimization**: we add regulation primitives, not planning features.
- **Configure boundaries, not mechanisms**: policy is explicit; the machinery stays simple.
- **Baseline is the goal**: "nothing happening" is success.
- **Avoid capture mechanics**: no hidden scoring, coercive metrics, or attention traps. (More context in `docs/vision.md`.)
- **Keep humans in the loop**: assistance can suggest, but changes are explicit and reviewable (start pull-based, draft artifacts).
- **Build for community**: features should support shared stewardship and coordination without turning into "productivity pressure."

---

## Completed

### Phase 1: Regulatory Layer ✅

- [x] **MP1**: Memory (ontology + persistence)
- [x] **MP2**: Regulator (policy + constraints + mutations)
- [x] **MP3**: CLI + Sensorium stub (orchestration + status/signal/act)
- [x] **MP4**: Episode Lifecycle (Open/Close Commands + Timestamps)
- [x] **MP5**: Episode Closure Produces Learning (Notes as Closure Artifacts)
- [x] **MP6**: Models v0 (Descriptive/Procedural/Normative)
- [x] **MP6.5**: Notes v1 (Tags + Timestamps)
- [x] **MP7**: Links v0 (Typed Relationships)
- [x] **MP8**: CLI Status v1
- [x] **MP9**: Sensorium v1 (Observations)
- [x] **MP10**: Membrane v0 (Validation Gates)
- [x] **MP11**: Signaling v0 (Federation Skeleton)

> **Checkpoint**: With the organ metaphor complete (Memory, Regulator, Sensorium, Membrane, Signaling), the regulatory layer is stable. Ready for UI and automation.

---

## Current

### MP12 — Web UI (Minimum Viable Loop)

**Goal**: Build the first usable loop — see state, see focus, complete actions.

**Vision context**: See `docs/vision.md` (anti-capture, baseline quiet, assistance without authority creep).

**Product intent**

- Make the system feel tangible and beautiful from day one (mythic aesthetic, not generic dashboard)
- Deliver immediate pragmatic value: "what's stable, what needs attention, what should I do?"
- Close the loop: users can actually _use_ the UI, not just look at it

**Implementation**

- **Next.js (App Router)**: API routes import existing regulator/memory modules directly
- **Local-first**: reads/writes `data/state.json` (same as CLI)
- **Styling**: Tailwind + custom CSS for mythic aesthetic
- **Location**: `src/apps/web/`

**Scope**

- Variables view (color-coded by status: InRange/Low/High)
- Active Episodes + pending Actions
- **One write-path: mark Action as Done** (minimum authority to close the loop)
- Baseline quiet: when stable, the UI feels calm and minimal
- Mobile-friendly: day-to-day usage often happens on phones

**Acceptance**

- UI visualizes Variables → Episodes → Actions without planning gravity
- User can mark an Action as Done from the UI
- Baseline is quiet (no nags; calm when stable)
- Looks beautiful — aesthetic is first-class, not an afterthought

---

### MP12.5 — Inbox + Quick Actions

**Goal**: Make thought capture and action creation frictionless.

**Product intent**

- Reduce friction for day-to-day capture (so people actually use the system)
- Let users add Actions to active Episodes without leaving the UI
- Provide a simple ritual for review/processing without creating a backlog machine

**Scope**

- Inbox view: create and review Notes (fast single input)
- Quick Action creation: add an Action to an active Episode from the UI
- Simple review ritual (tag/process Notes), not a workflow engine

**Invariants**

- ❌ Notes do not imply action (they're inert until reviewed)
- ✅ Actions can only be added to _active_ Episodes (no orphan action creation)
- ✅ Capture is explicit and reversible
- ✅ If assistance is added later, it is pull-based and creates draft artifacts (human approves)

**Acceptance**

- Create a Note into `inbox` quickly
- Create an Action within an active Episode from the UI
- Review Inbox list and mark Notes as processed/tagged
- No automatic episode opening or action creation from Inbox

---

### MP12.75 — Episode Management

**Goal**: Complete the intervention loop — open and close Episodes from the UI.

**Product intent**

- When a Variable drifts, you can start an intervention without leaving the UI
- When you're done, you can close with a note + learning (Model update for Explore)

**Scope**

- Open Episode (Stabilize or Explore) from the UI
- Close Episode with closure note
- For Explore: prompt for Model update on closure (required by doctrine)
- Membrane constraints enforced (e.g., max 1 active Explore per node)

**Acceptance**

- Open a Stabilize Episode linked to a Variable
- Open an Explore Episode with objective
- Close Episode with closure note
- Explore closure requires at least one Model update
- Membrane blocks shown clearly when constraints violated

---

### MP13 — Models View

**Goal**: Make learning tangible — see your accumulated beliefs, procedures, and boundaries.

**Product intent**

- Learning should feel real: "here's what I've learned over time"
- Normative Models (constraints) become visible as "the rules I live by"

**Scope**

- Read-only view of all Models (Descriptive, Procedural, Normative)
- Filter/group by type or scope
- See which Episodes produced which Models (lineage)

**Acceptance**

- View all Models with type, statement, confidence
- See linked Episode (where did this learning come from?)
- Normative Models show enforcement level

---

### MP14 — Variable Proxies

**Goal**: Make Variables feel alive by connecting them to real data sources.

**Product intent**

- Manual variable updates feel like homework; automatic signals feel alive
- This is where the system becomes genuinely useful for day-to-day life

**Scope**

- Define proxy sources for Variables (e.g., sleep tracker, calendar, mood log)
- Automatic or semi-automatic status updates based on proxy data
- Start simple: manual proxy entry, then expand to integrations

**Acceptance**

- Add a proxy to a Variable
- Proxy data influences Variable status (with user confirmation or auto)
- Clear audit trail of what changed the Variable

---

### MP-AUTO — Automation v0

**Status**: Proposed (see [ADR 0003](decisions/0003-automation-philosophy.md))

**Goal**: Enable Procedural Models to execute trusted behaviors under Membrane constraints.

**Scope**

- Extend `ProceduralModel` with: `automationLevel` (0/1/2), `trigger`, `chain`
- Create `src/libs/executor/*` — execution engine for Procedural Models
- Approval queue: Level 0 drafts, Level 1 queues, Level 2 auto-executes

**Invariants**

- ❌ Automation never opens Episodes
- ❌ Automation never modifies Models directly
- ❌ Automation never bypasses Membrane
- ✅ Automation serves baseline; Episodes serve learning

**Acceptance**

- Level 1 creates approval Note when triggered
- Level 2 executes and logs
- Membrane blocks if Normative Model has `enforcement: "block"`

---

## Future Vision (Phases 2-4)

The following phases are **speculative** — they represent architectural direction, not committed work. Details will be refined when Phase 1 is complete.

### Phase 2: World Model Layer

**Goal**: Add structured representation of external entities.

Phase 1 builds the **regulatory layer** (how the organism regulates itself). Phase 2 adds the **world model layer** (how the organism represents reality).

**Key additions:**

- **Schemas**: User-defined object types
- **Entities**: Instances conforming to schemas
- **Entity references**: Variables, Episodes, Models can reference entities
- **Knowledge graph queries**: Query across entities, links, models

This enables: "All my beliefs about Person:John" or "Variables affected by Project:X"

---

### Phase 3: Autonomous Regulator

**Goal**: Upgrade the Regulator from reactive to proactive.

Phase 1's Regulator is command-driven (user calls `openEpisode`). Phase 3 makes it autonomous.

**Key additions:**

- **Variable thresholds**: Preferred ranges, stability, confidence scores
- **Episode timebox**: Self-expiring episodes with closure conditions
- **Regulator state machine**: IDLE → EVALUATING → ASSESSING → OPENING_EPISODE → MONITORING → CLOSING_EPISODE
- **Candidate selection**: Regulator proposes Episodes based on pressure scores

"None" remains a valid and common outcome.

---

### Phase 4: Network Infrastructure

**Goal**: Support multiple users, multiple nodes, network coordination.

**Key additions:**

- **Database migration**: Replace `state.json` with SQLite/PostgreSQL
- **Dynamic node creation**: Create Org nodes programmatically
- **Authentication**: Control who accesses which nodes
- **Federation**: Nodes exchange signals over the network
- **Node size limits**: Hard Dunbar constraint (50-150 members) that forces mitosis — system becomes unusable until split
- **Artifact sharing**: Groups emit "completion" signals with creative artifacts attached (Models, Notes, external links). Other groups consume signals they care about—pull-based discovery, not algorithmic feeds. No engagement metrics, no ranking algorithms.
- **Codebase node**: Treat the codebase as a regulated organism

Federation principle: Nodes exchange signals and artifacts, never share state. Artifact sharing consolidates content at the group level (reducing quantity, increasing quality) while preserving natural social dynamics over competitive individualism.

---

## Nice to Have

Ideas that embody the philosophy but aren't core. Pursue when capacity allows.

### Membrane Visualization

A web visualization rendering the codebase as a living organism — self-discovering, zero configuration. See [ADR 0002](decisions/0002-membrane-visualization.md).

### AI-Assisted Capture

LLM-powered layer converting unstructured input into structured Observations. The AI proposes, human confirms.

### AI-Assisted Plugin Generation

Enable non-technical users to create plugins through natural language prompts. AI generates plugin code as **draft artifacts**; user reviews, edits (if needed), and approves. All validation and doctrine constraints still apply. See [AI Plugin Generation](ai-plugin-generation.md) for full specification.

### Mobile Companion

Minimal read-only app for glancing at status. If nothing is wrong, it shows almost nothing.

### Templates & Extensions

Shareable Variable configurations and custom proxy pipelines for non-native data sources.

### Plugin Architecture

Extensible platform for community-contributed plugins (oracles/sensors, procedural models, world models). See [ADR 0005](decisions/0005-plugin-architecture.md) for architecture design. Enables:

- Sensorium plugins (external data sources → Variable proxies)
- Procedural Model plugins (shareable automation procedures)
- World Model plugins (domain-specific schemas and entities)

Implementation phases: Foundation → Procedural Models → World Models → Sandboxing.

**Developer Experience**:

- See [Plugin Developer Experience](plugin-developer-experience.md) for immediate tooling specs (scaffolding, testing, validation)
- See [Plugin Developer Experience Vision](plugin-developer-experience-vision.md) for long-term vision (visual builder, marketplace, composition tools)

**Extension Ideas**:

- See [Plugin Implementation Priorities](plugin-implementation-priorities.md) for prioritized extension ideas (Security Model, Templates, Testing Framework, Variable Packs, Config UI, etc.)

### Persisted Observations

Currently, Observations are ephemeral intermediate values during CLI execution. A future enhancement could persist Observations to Memory, creating a log of what was sensed. This would enable:

- Audit trail of all input to the system
- Replay capabilities for debugging
- Analytics on observation patterns over time

This aligns with the doctrine's canonical flow: "Sense → Store → ..."
