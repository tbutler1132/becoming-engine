# **The Becoming Engine**

### _A cybernetic regulation system for individuals and organizations_

---

## **1. Core Philosophy**

The Becoming Engine is a **Cybernetic Regulator**, not a task manager or goal system.

Its purpose is to support _becoming_ by:

- maintaining **Viability** (homeostasis)
- enabling **Learning** (allostasis)
- preserving **Agency** under uncertainty
- allowing ambition without identity collapse

The system assumes:

> Individuals and organizations are not optimizing toward fixed goals.
>
> They are regulating around preferred ranges while learning under uncertainty.

---

### **Design Commitments**

- The system intervenes **only when needed**
- All interventions are **temporary**
- Learning must result in **explicit belief updates**
- Baseline functioning is the success state
- Identity is not managed; **boundaries are**

---

### **Technology Stack**

- **Architecture:** Modular Monorepo (Nx)
- **Backend:** Nest.js
- **Frontend:** Next.js
- **Database:** PostgreSQL (graph-relational via JSONB + link tables)
- **Paradigm:** Object-centric, federated, biological

---

## **2. System Architecture (The Organism)**

The codebase represents a **living organism** composed of organs (libs) and bodies (apps).

```
becoming-engine/
├── apps/
│   ├── individual-organism/# Executable node for a person
│   ├── collective-organism/# Executable node for an organization
│   └── cortex/# Next.js UI (interpretive surface)
│
├── libs/
│   ├── shared-types/# DTOs / shared contracts
│   ├── memory/# Ontology + persistence
│   ├── regulator/# Cybernetic control loop
│   ├── sensorium/# Ingestion + perception
│   ├── membrane/# Auth, validation, boundaries
│   └── signaling/# Inter-node federation
│
└── tools/# Migrations, generators, seeders

```

---

## **3. Core Ontology (Minimal and Complete)**

The system operates on a **small, closed set of object types**.

### **Primary Objects**

- **Variable** – dimensions of viability (regulated, not optimized)
- **Episode** – temporary interventions (stabilize or explore)
- **Action** – executable, disposable steps
- **Model** – beliefs, procedures, and constraints
- **Note** – observations, surprises, learning artifacts
- **Link** – typed relationships between objects
- **Node** – an organism (individual or collective)

No projects.

No goals.

No permanent habits.

---

## **4. Modules (Organs)**

---

### **A. Memory**

_(formerly Canon)_

**Biological role:** Long-term memory / world model

**Technical role:** Ontology + persistence layer

**Responsibilities**

- Stores all objects and links
- Maintains the organism’s internal model of reality
- Persists learning across time

**Stored object types**

- Variables
- Episodes
- Actions
- Models
- Notes
- Nodes
- Links

> Memory does not decide. It remembers.

---

### **B. Regulator**

_(formerly Metatron)_

**Biological role:** Homeostatic regulator

**Technical role:** Domain logic / control loop

**Responsibilities**

1. Evaluate Variable states (Low / In Range / High)
2. Detect pressure or uncertainty
3. Open, manage, and close Episodes
4. Enforce concurrency rules
5. Update Models from Episode outcomes

---

### **Episode Concurrency Rules**

- **Explore Episodes:**
  → **Maximum 1 active at any time**
- **Stabilize Episodes:**
  → **Maximum 1 per Variable**
- Explore Episodes **cannot** start if a critical Stabilize Episode is active

---

### **Bootstrapping Phase**

Early organisms operate in a **bootstrapping regime**:

- Baseline work does not yet exist
- Stabilize Episodes are frequent
- Variables are hypersensitive
- This phase is **observed**, not manually toggled

The Regulator may infer `node_phase = bootstrapping` based on instability density.

---

### **C. Sensorium**

_(formerly Ophanim)_

**Biological role:** Sensory system

**Technical role:** Ingestion + normalization

**Responsibilities**

- Ingest external signals (APIs, webhooks)
- Accept interoceptive input (manual logs)
- Convert noise into structured observations

**Key rule**

- Inputs must map to a Variable proxy **or** be stored as a Note
- No silent ontology mutation

---

### **D. Membrane**

_(formerly Halo)_

**Biological role:** Boundary / immune system

**Technical role:** Security + validation

**Responsibilities**

- Authentication and authorization
- Schema and input validation
- Constraint enforcement gates

**Examples**

- Block “publish” actions if constraints are unmet
- Require explicit exception logging

---

### **E. Signaling**

_(formerly Choir)_

**Biological role:** Inter-organism communication

**Technical role:** Federation layer

**Responsibilities**

- Node identity verification (public keys)
- Minimal event-based sync
- Clean separation between organisms

**Principle**

> Organisms coordinate via signals and artifacts, not shared backlogs.

---

### **F. Cortex**

_(formerly Revelation)_

**Biological role:** Interpretive surface

**Technical role:** UI / awareness layer

**Responsibilities**

- Visualize Variables and their states
- Display active Episodes
- Surface Actions from active Episodes only
- Show Models, Notes, and Constraints
- Make learning legible

> Cortex is not a planner.
>
> It is awareness.

---

## **5. Variables (Viability Dimensions)**

Variables are **regulated around preferred ranges**, not maximized.

### **Universal Variables**

- Continuity
- Coherence
- Social Embeddedness
- Optionality
- Agency
- Meaningful Engagement
- Learning / Model Accuracy

Each Variable has:

- preferred range
- current status
- stability level
- proxy signals

---

## **6. Episodes (Temporary Interventions)**

Episodes exist **only** when warranted.

### **Episode Types**

### **Stabilize**

- Triggered by Variable pressure
- Purpose: restore viability
- Ends when stability returns

### **Explore**

- Triggered by recurring uncertainty + surplus capacity
- Purpose: learn something true
- Ends when a Model changes

---

### **Episode Lifecycle Fields**

- `type`: stabilize | explore
- `status`: active | closing | closed | abandoned
- `variable_id` (required for stabilize)
- `opened_at`
- `timebox`
- `closure_conditions`
- `constraints` (normative model references)
- `closure_note_id`
- `resulting_model_updates`

---

## **7. Actions (Execution Substrate)**

Actions are:

- concrete
- binary
- disposable
- optionally scheduled

**Fields**

- status
- scheduled_for (optional)
- duration (optional)
- deadline (optional)
- episode_id (optional)
- requires_constraints_check (optional)

**UI rule**

> Only Actions from active Episodes are surfaced.

An empty board is a success state.

---

## **8. Models (Beliefs, Procedures, Constraints)**

Models are explicit, queryable statements.

### **Model Types**

### **Descriptive**

Beliefs about the world

> “Async reviews reduce friction.”

### **Procedural**

Reusable methods

> “Album review: async first, live synthesis last.”

### **Normative (Constraints)**

Non-negotiable boundaries

> “No public release below internal care threshold.”

---

### **Normative Model Fields**

- scope (personal/org + domain)
- enforcement (block | warn | log_required)
- exceptions_allowed
- exception_logging_required

Constraints define **what will not be done**, not who the organism is.

---

## **9. Notes (Learning Layer)**

Notes capture:

- observations
- surprises
- Episode closures
- Model updates
- future curiosities (idea pool)

Idea pool Notes **do not** imply future Episodes.

---

## **10. Data Model (Graph-Relational)**

### **Objects**

- uuid
- type
- name
- payload (JSONB)
- timestamps

### **Links**

- source_uuid
- target_uuid
- relation
- weight (optional)

### **Node Registry**

- node_id
- name
- api_url
- public_key
- trust_level

---

## **11. Implementation Plan**

### **Phase 1 – Incarnation**

- Initialize Nx workspace
- Implement Memory schema
- Implement Regulator for 1 Variable (Agency)
- Build Cortex dashboard
- Run locally

### **Phase 2 – Perception**

- Connect Sensorium to one real input
- Automate Variable status updates
- Trigger Stabilize Episodes

### **Phase 3 – Federation**

- Spin up Collective Organism
- Implement Signaling handshake
- Send Episode/Action events cross-node

---

## **12. Immediate Next Step**

1. Run Genesis commands
2. Define the first **Variable** and its proxies
3. Implement **Model typing** (descriptive / procedural / normative)
4. Create first **Normative Model** (“No slop”)

---

### **One-Paragraph Summary**

> The Becoming Engine is a cybernetic system for living and working without brittle goals.
>
> It replaces optimization with regulation, habits with temporary Episodes, and identity pressure with clear boundaries.
>
> Individuals and organizations learn by running finite experiments and integrating what works into baseline behavior.
>
> Ambition emerges through accumulated learning, not forced planning.
>
> The system intervenes only when something is leaking — and disappears when it’s not needed.
