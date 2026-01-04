# ADR 0005: Plugin Architecture for Extensibility

## Status

Proposed

## Context

The Becoming Engine is designed as a cybernetic regulation system with strict organ boundaries and explicit learning. As the system matures, there's natural desire to extend it with:

- **Oracles/Sensors**: External data sources that feed Variable proxies (sleep trackers, calendars, mood logs, API integrations)
- **Procedural Models**: Shareable automation procedures that encode learned behaviors
- **Automation Pipelines**: Composable workflows that execute trusted sequences
- **World Models**: Domain-specific schemas and entity types (projects, people, concepts)

However, extensibility introduces risks:

- Plugins could bypass Membrane constraints
- Hidden optimization loops that violate anti-capture
- Agency erosion through opaque automation
- Brittleness from ungoverned external dependencies
- Surveillance patterns from poorly-scoped sensors

We need a plugin architecture that enables community contribution while preserving the core doctrine: regulate viability, learn explicitly, return to baseline, preserve agency.

## Decision

### First Principle: Plugins Are Organs, Not Overlords

Plugins extend the system's **sensing** and **execution** capabilities, but never its **decision-making** authority.

- Plugins sense → produce Observations (never Actions directly)
- Plugins contribute Procedural Models → validated through normal Model lifecycle
- Plugins contribute Schemas → extend World Model Layer (Phase 2)
- Plugins never bypass Membrane
- Plugins never open Episodes
- Plugins never modify Models directly

### Plugin Types

Plugins fall into three categories, each with distinct contracts:

#### 1. Sensorium Plugins (Oracles/Sensors)

**Purpose**: Extend sensing capabilities by ingesting external signals.

**Contract**:

- Implement `SensoriumPlugin` interface
- Produce `Observation[]` (variableProxySignal, freeformNote, episodeProposal)
- Never produce Actions directly
- All outputs pass through Membrane validation

**Examples**:

- Sleep tracker integration → Variable proxy signals
- Calendar parser → Notes with tags
- Email watcher → Variable proxy signals (inbox pressure)
- Mood logger → Variable proxy signals

**Lifecycle**:

```
Plugin.sense() → Observation[] → Membrane.validate() → Regulator.processObservation()
```

#### 2. Procedural Model Plugins

**Purpose**: Share learned automation procedures.

**Contract**:

- Contribute `ProceduralModel[]` definitions
- Models are **draft artifacts** until explicitly adopted
- Must specify automation level (0/1/2) and trigger conditions
- Subject to same Membrane enforcement as user-created Models

**Examples**:

- "Format content for platform X" procedure
- "Send follow-up email after N days" procedure
- "Run test suite on PR" procedure

**Lifecycle**:

```
Plugin.getProceduralModels() → Model[] (draft) → User reviews → User adopts → Active
```

#### 3. World Model Plugins (Phase 2)

**Purpose**: Extend ontology with domain-specific schemas and entity types.

**Contract**:

- Contribute `Schema[]` definitions
- Schemas define Entity types (e.g., `Person`, `Project`, `Domain`)
- Entities can be referenced by Variables, Episodes, Models
- Schemas are validated against DNA invariants

**Examples**:

- "Project management" schema (Project, Milestone, Task entities)
- "Social network" schema (Person, Relationship, Event entities)
- "Knowledge domain" schema (Concept, Reference, Claim entities)

**Lifecycle**:

```
Plugin.getSchemas() → Schema[] → User reviews → User adopts → Available for Entity creation
```

### Plugin Interface Specification

```typescript
/**
 * Base plugin interface. All plugins must implement this.
 */
interface Plugin {
  /** Unique identifier (e.g., "sleep-tracker", "email-watcher") */
  readonly name: string;

  /** Semantic version (e.g., "1.2.3") */
  readonly version: string;

  /** Human-readable description */
  readonly description: string;

  /** Plugin author/contributor */
  readonly author?: string;

  /** Plugin metadata (tags, category, etc.) */
  readonly metadata?: Record<string, unknown>;

  /**
   * Initialize plugin with context.
   * Called once when plugin is loaded.
   */
  initialize?(context: PluginContext): Promise<Result<void>>;

  /**
   * Cleanup resources.
   * Called when plugin is unloaded.
   */
  teardown?(): Promise<void>;
}

/**
 * Sensorium plugin: produces Observations from external signals.
 */
interface SensoriumPlugin extends Plugin {
  /**
   * Sense external signals and produce Observations.
   * Never produces Actions directly.
   *
   * @param context - Plugin execution context (state access, logger, etc.)
   * @returns Array of Observations (variableProxySignal, freeformNote, episodeProposal)
   */
  sense(context: PluginContext): Promise<Result<Observation[]>>;

  /**
   * Optional: define polling interval or event-driven triggers.
   * If not provided, plugin is invoked manually or via scheduler.
   */
  readonly trigger?: {
    type: "poll" | "event" | "manual";
    interval?: number; // milliseconds for poll
    event?: string; // event name for event-driven
  };
}

/**
 * Procedural Model plugin: contributes automation procedures.
 */
interface ProceduralModelPlugin extends Plugin {
  /**
   * Contribute Procedural Models as draft artifacts.
   * Models are not active until user explicitly adopts them.
   */
  getProceduralModels(): ProceduralModel[];
}

/**
 * World Model plugin: contributes domain schemas (Phase 2).
 */
interface WorldModelPlugin extends Plugin {
  /**
   * Contribute Schemas as draft artifacts.
   * Schemas are not active until user explicitly adopts them.
   */
  getSchemas(): Schema[];
}

/**
 * Plugin execution context provided to plugins.
 */
interface PluginContext {
  /** Read-only access to current State */
  readonly state: ReadonlyState;

  /** Logger for plugin operations */
  readonly logger: Logger;

  /** Plugin-specific configuration */
  readonly config: Record<string, unknown>;

  /** Plugin storage (isolated from main state) */
  readonly storage: PluginStorage;
}

/**
 * Isolated storage for plugin state.
 * Plugins cannot access main Memory directly.
 */
interface PluginStorage {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T): void;
  delete(key: string): void;
  clear(): void;
}
```

### Plugin Registry and Loading

**Location**: `src/libs/plugins/`

**Structure**:

```
src/libs/plugins/
  ├── index.ts              # Public API
  ├── types.ts              # Plugin interfaces
  ├── registry.ts           # Plugin discovery and loading
  ├── context.ts            # PluginContext implementation
  ├── storage.ts            # PluginStorage implementation
  └── internal/
      ├── loader.ts         # Dynamic plugin loading
      ├── sandbox.ts        # Plugin isolation (future)
      └── validation.ts     # Plugin output validation
```

**Plugin Discovery**:

- Plugins live in `plugins/` directory (user-defined location)
- Each plugin is a directory with `plugin.json` manifest
- Manifest defines entry point, type, dependencies
- Registry loads plugins on startup

**Example Plugin Manifest**:

```json
{
  "name": "sleep-tracker",
  "version": "1.0.0",
  "type": "sensorium",
  "entry": "./index.js",
  "description": "Integrates with sleep tracking API",
  "author": "community",
  "dependencies": {
    "api-key": "required"
  },
  "permissions": {
    "read-state": true,
    "write-observations": true,
    "write-notes": true
  }
}
```

### Plugin Lifecycle

1. **Discovery**: Registry scans `plugins/` directory, reads manifests
2. **Loading**: Dynamic import of plugin entry point
3. **Initialization**: Call `plugin.initialize(context)` if provided
4. **Registration**: Plugin added to registry, available for use
5. **Execution**: Plugin invoked based on trigger (poll/event/manual)
6. **Validation**: All plugin outputs validated through Membrane
7. **Teardown**: Call `plugin.teardown()` when unloaded

### Membrane Integration (Critical)

**All plugin outputs must pass through Membrane**:

```typescript
// Plugin produces Observations
const observations = await plugin.sense(context);

// Each Observation validated through Membrane
for (const obs of observations) {
  const validation = await membrane.validateObservation(obs);

  if (!validation.ok) {
    logger.warn(
      `Plugin ${plugin.name} produced invalid observation: ${validation.error}`,
    );
    continue; // Skip invalid observation
  }

  // Only valid observations reach Regulator
  await regulator.processObservation(validation.value);
}
```

**Membrane enforces**:

- Schema validation (Observation types match DNA)
- Normative Model constraints (if applicable)
- Rate limiting (prevent spam)
- Scope boundaries (plugin cannot mutate outside its envelope)

### Plugin Sandboxing (Future)

**Phase 1**: Trust-based (plugins run in same process, validated outputs)

**Phase 2**: Isolation (plugins run in separate worker threads or processes)

**Sandbox boundaries**:

- Plugins cannot access filesystem directly (except via PluginStorage)
- Plugins cannot make network requests (unless explicitly allowed in manifest)
- Plugins cannot import arbitrary modules (whitelist approach)
- Plugin errors are caught and logged, never crash main process

### Plugin Configuration

Plugins accept configuration via `PluginContext.config`:

```typescript
// User configures plugin in state
{
  "plugins": {
    "sleep-tracker": {
      "enabled": true,
      "config": {
        "api-key": "***",
        "poll-interval": 3600000, // 1 hour
        "variable-id": "var_sleep"
      }
    }
  }
}
```

Configuration is validated against plugin manifest `dependencies` and `permissions`.

### Plugin Output Validation

**Sensorium Plugins**:

- Observations must match `OBSERVATION_TYPES` from DNA
- Variable IDs must exist in state
- Node references must be valid
- Status values must match `VARIABLE_STATUSES`

**Procedural Model Plugins**:

- Models must match `MODEL_TYPES` from DNA
- Automation levels must be 0, 1, or 2
- Triggers must be valid event names or conditions

**World Model Plugins**:

- Schemas must not conflict with DNA ontology
- Entity types must be valid identifiers
- Relationships must use `LINK_RELATIONS` from DNA

### Anti-Capture Safeguards

**Plugins must not**:

- Create hidden optimization loops
- Generate silent scoring/ranking
- Pressure behavior through notifications
- Create permanent mobilization
- Bypass human approval gates

**Enforcement**:

- All plugin-generated Actions require approval (Level 0/1) unless explicitly Level 2
- Plugin Observations are logged and auditable
- Plugin outputs are visible in UI (no hidden state)
- Rate limiting prevents spam
- Membrane blocks violate normative constraints

### Agency Preservation

**Plugins enhance, never replace, human judgment**:

- Plugin Observations are **suggestions** until human reviews
- Procedural Models are **draft artifacts** until explicitly adopted
- Schemas are **proposals** until user accepts
- Automation levels require progressive trust (0 → 1 → 2)

**Pull-based by default**:

- Plugins don't push notifications
- Plugin outputs appear in Inbox/Notes for review
- User explicitly enables plugin automation

### Baseline Quiet Preservation

**Plugins must respect baseline**:

- Plugins can be disabled without breaking system
- Plugin failures don't crash main process
- Plugin outputs don't create persistent backlogs
- "None" remains valid outcome even with plugins active

**Configuration**:

- Users can disable plugins individually
- Users can set plugin to "observe only" (no automation)
- Plugin outputs can be filtered/ignored

## Consequences

**Pros**:

- Enables community contribution without compromising doctrine
- Extends sensing capabilities (Variable proxies, Notes)
- Shares learned procedures (Procedural Models)
- Extends ontology (World Model Layer)
- Maintains strict boundaries (Membrane enforcement)
- Preserves agency (pull-based, draft artifacts)
- Supports baseline quiet (plugins can be disabled)

**Cons**:

- Requires plugin infrastructure (registry, loader, validation)
- Plugin sandboxing adds complexity (Phase 2)
- Plugin validation must be thorough (security risk if lax)
- Plugin errors must be handled gracefully (resilience)
- Plugin versioning and updates need management

## Implementation Phases

### Phase 1: Foundation (MP-PLUGIN-1)

**Goal**: Basic plugin infrastructure without sandboxing.

**Scope**:

- Plugin interfaces (`types.ts`)
- Plugin registry (`registry.ts`)
- Plugin context (`context.ts`)
- Plugin storage (`storage.ts`)
- Basic loader (`loader.ts`)
- Membrane integration
- One example Sensorium plugin (sleep tracker stub)

**Acceptance**:

- Load plugin from `plugins/` directory
- Plugin produces Observations
- Observations validated through Membrane
- Plugin outputs reach Regulator
- Plugin can be disabled via config

### Phase 2: Procedural Model Plugins (MP-PLUGIN-2)

**Goal**: Enable plugins to contribute Procedural Models.

**Scope**:

- `ProceduralModelPlugin` interface
- Model adoption workflow (draft → review → adopt)
- Model validation against DNA
- UI for reviewing plugin-contributed Models

**Acceptance**:

- Plugin contributes Procedural Models
- Models appear as drafts in UI
- User can adopt/reject Models
- Adopted Models work like user-created Models

### Phase 3: World Model Plugins (MP-PLUGIN-3)

**Goal**: Enable plugins to contribute Schemas (requires Phase 2 World Model Layer).

**Scope**:

- `WorldModelPlugin` interface
- Schema adoption workflow
- Entity creation from plugin Schemas
- Schema validation against DNA

**Acceptance**:

- Plugin contributes Schemas
- Schemas appear as proposals in UI
- User can adopt/reject Schemas
- Entities can be created from adopted Schemas

### Phase 4: Plugin Sandboxing (MP-PLUGIN-4)

**Goal**: Isolate plugins in separate processes/workers.

**Scope**:

- Worker thread or child process execution
- Plugin IPC (Inter-Process Communication)
- Resource limits (CPU, memory)
- Network request whitelisting
- Module import restrictions

**Acceptance**:

- Plugins run in isolated context
- Plugin crashes don't affect main process
- Resource limits enforced
- Network requests require explicit permission

## Examples

### Example 1: Sleep Tracker Sensorium Plugin

```typescript
import type {
  SensoriumPlugin,
  PluginContext,
  Observation,
  Result,
} from "@libs/plugins";

export class SleepTrackerPlugin implements SensoriumPlugin {
  readonly name = "sleep-tracker";
  readonly version = "1.0.0";
  readonly description = "Integrates with sleep tracking API";

  readonly trigger = {
    type: "poll" as const,
    interval: 3600000, // 1 hour
  };

  async sense(context: PluginContext): Promise<Result<Observation[]>> {
    const apiKey = context.config.apiKey as string;
    const variableId = context.config.variableId as string;

    if (!apiKey || !variableId) {
      return {
        ok: false,
        error: "Missing required config: apiKey, variableId",
      };
    }

    // Fetch sleep data from external API
    const sleepData = await fetchSleepData(apiKey);

    // Determine Variable status based on sleep quality
    const status = sleepData.qualityScore < 0.6 ? "Low" : "InRange";

    // Produce Observation (not Action)
    return {
      ok: true,
      value: [
        {
          type: "variableProxySignal",
          node: context.state.currentNode,
          variableId,
          status,
        },
      ],
    };
  }
}
```

### Example 2: Email Follow-Up Procedural Model Plugin

```typescript
import type { ProceduralModelPlugin, ProceduralModel } from "@libs/plugins";

export class EmailFollowUpPlugin implements ProceduralModelPlugin {
  readonly name = "email-follow-up";
  readonly version = "1.0.0";
  readonly description = "Sends follow-up emails after N days";

  getProceduralModels(): ProceduralModel[] {
    return [
      {
        id: "proc_email_followup_7d",
        type: "Procedural",
        statement:
          "Send follow-up email 7 days after initial contact if no response",
        confidence: 0.8,
        scope: "personal",
        automationLevel: 1, // Auto-queue with approval
        trigger: "email_received",
        chain: [
          "check_last_contact",
          "if_days_since > 7",
          "draft_followup_email",
          "queue_for_approval",
        ],
      },
    ];
  }
}
```

### Example 3: Project Management World Model Plugin

```typescript
import type { WorldModelPlugin, Schema } from "@libs/plugins";

export class ProjectManagementPlugin implements WorldModelPlugin {
  readonly name = "project-management";
  readonly version = "1.0.0";
  readonly description = "Project, Milestone, Task schemas";

  getSchemas(): Schema[] {
    return [
      {
        name: "Project",
        fields: [
          { name: "name", type: "string", required: true },
          {
            name: "status",
            type: "enum",
            values: ["active", "paused", "completed"],
          },
          { name: "startDate", type: "date" },
          { name: "endDate", type: "date" },
        ],
      },
      {
        name: "Milestone",
        fields: [
          { name: "projectId", type: "reference", target: "Project" },
          { name: "name", type: "string", required: true },
          { name: "targetDate", type: "date" },
        ],
      },
      {
        name: "Task",
        fields: [
          { name: "milestoneId", type: "reference", target: "Milestone" },
          { name: "description", type: "string", required: true },
          {
            name: "status",
            type: "enum",
            values: ["pending", "in_progress", "done"],
          },
        ],
      },
    ];
  }
}
```

## Notes

This decision establishes the **architecture** for plugins. Implementation details (plugin format, loading mechanism, sandboxing approach) will be refined during implementation phases.

Key dependencies:

- MP9 (Sensorium v1) — Observations for plugin outputs
- MP10 (Membrane) — Constraint enforcement for plugin validation
- MP-AUTO (Automation v0) — Procedural Models for plugin contributions
- Phase 2 (World Model Layer) — Schemas for World Model plugins

This architecture preserves all critical doctrine constraints:

- **Anti-capture**: Plugins cannot create optimization loops
- **Agency**: Plugins suggest, humans approve
- **Baseline quiet**: Plugins can be disabled, failures don't crash system
- **Membrane enforcement**: All plugin outputs validated
- **Explicit learning**: Plugin Models are draft artifacts until adopted

## Related Decisions

- [ADR 0003: Automation Philosophy](0003-automation-philosophy.md) — Plugins contribute Procedural Models, subject to automation levels
- [ADR 0001: Organ Module Boundaries](0001-organ-module-boundaries.md) — Plugins are organs with public APIs
- Future: Plugin Security Model (sandboxing, permissions, validation)
