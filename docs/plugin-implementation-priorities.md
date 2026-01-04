# Plugin Extension Implementation Priorities

This document prioritizes the plugin extension ideas from `platform-extension-ideas.md` based on impact, doctrine alignment, and implementation feasibility.

## Tier 1: Foundation (Implement with Core Plugin Architecture)

These are essential for a safe, viable plugin system. Implement these alongside Phase 1 of the plugin architecture (MP-PLUGIN-1).

### 1. Plugin Security Model

**Priority**: Critical — Must be implemented from day one

**Why**:

- Without permissions, plugins are a security risk
- Fine-grained permissions enable principle of least privilege
- Explicit permissions in manifest preserve agency (user sees what plugin can do)
- Foundation for future sandboxing (Phase 4)

**Implementation**:

- Add `permissions` field to plugin manifest
- Validate permissions at plugin load time
- Enforce permissions in `PluginContext` (read-only state, isolated storage)
- Permissions: `read-state`, `write-observations`, `write-notes`, `network-request`, `filesystem-read`, `filesystem-write`

**Doctrine Alignment**:

- ✅ Explicit (permissions visible in manifest)
- ✅ Anti-capture (limits plugin scope)
- ✅ Agency (user controls permissions)

**Dependencies**: None (foundational)

---

### 2. Plugin Templates / Scaffolding

**Priority**: High — Enables contribution immediately

**Why**:

- Lowers barrier to entry for contributors
- Ensures consistent plugin structure (matches organ boundaries)
- Includes best practices (error handling, Result types, validation)
- No doctrine risk — pure developer experience improvement

**Implementation**:

```bash
npm run plugin:create --name sleep-tracker --type sensorium
```

Generates:

- Plugin directory structure
- `plugin.json` manifest template
- TypeScript boilerplate matching project standards
- Example test file
- README template

**Doctrine Alignment**:

- ✅ Explicit (generated code is visible)
- ✅ Viability (reduces plugin creation friction)
- ✅ No capture risk

**Dependencies**: Core plugin architecture (MP-PLUGIN-1)

---

### 3. Plugin Testing Framework

**Priority**: High — Quality gate prevents broken plugins

**Why**:

- Validates plugin outputs match DNA types
- Tests error handling (plugins fail gracefully)
- Ensures plugins work before distribution
- Explicit (tests are visible, not hidden)

**Implementation**:

```typescript
import { testPlugin } from "@libs/plugins/testing";

testPlugin("sleep-tracker", async (plugin, context) => {
  const observations = await plugin.sense(context);
  expect(observations.ok).toBe(true);
  expect(observations.value[0].type).toBe("variableProxySignal");
  expect(observations.value[0].status).toMatch(/Low|InRange|High/);
});
```

Testing utilities:

- Mock `PluginContext` with test state
- Validate Observations against DNA types
- Test error paths (network failures, invalid config)
- Test Membrane validation integration

**Doctrine Alignment**:

- ✅ Viability (reduces plugin bugs)
- ✅ Explicit (tests are visible)
- ✅ No capture risk

**Dependencies**: Core plugin architecture (MP-PLUGIN-1), DNA types

---

## Tier 2: High Value, Moderate Complexity

Implement these after core plugin architecture is stable and plugins exist.

### 4. Shared Variable Configurations

**Priority**: High — Accelerates onboarding and knowledge sharing

**Why**:

- "Developer Viability" pack: Sleep, Exercise, Focus, Social with evidence-based ranges
- Faster setup for new users (don't start from scratch)
- Community knowledge sharing (what works for others)
- Pull-based (user chooses to adopt, can customize)

**Example Pack**:

```json
{
  "name": "developer-viability",
  "version": "1.0.0",
  "description": "Variables for developer health and productivity",
  "variables": [
    {
      "name": "Sleep",
      "preferredRange": { "min": 7, "max": 9 },
      "proxies": ["sleep-tracker-plugin"]
    },
    {
      "name": "Exercise",
      "preferredRange": { "min": 3, "max": 5 },
      "proxies": ["fitness-tracker-plugin"]
    }
  ],
  "proceduralModels": [
    {
      "type": "Procedural",
      "statement": "If Sleep < 6 hours for 3 days, create Stabilize episode",
      "automationLevel": 0
    }
  ]
}
```

**Implementation**:

- Variable pack format (JSON/YAML)
- Pack loader (imports Variables, Models into state)
- Pack customization (user can override ranges)
- Pack versioning (packs evolve over time)

**Doctrine Alignment**:

- ✅ Explicit (pack contents visible)
- ✅ Pull-based (users choose to adopt)
- ✅ Viability (faster setup)
- ⚠️ Risk: Could create "one-size-fits-all" (mitigate with customization)

**Dependencies**: Core plugin architecture, Variable Proxies (MP14)

---

### 5. Plugin Configuration UI

**Priority**: High — Reduces setup friction

**Why**:

- Visual forms generated from plugin manifest config schema
- Validation feedback (catch errors before plugin runs)
- Natural extension of web UI work (MP12)
- Makes plugins accessible to non-technical users

**Implementation**:

- Plugin manifest defines config schema (JSON Schema)
- UI generates form from schema
- Config saved to state (same as manual JSON config)
- Validation errors shown inline

**Example Schema**:

```json
{
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "sensitive": true,
      "description": "API key for sleep tracker service"
    },
    "pollInterval": {
      "type": "number",
      "default": 3600000,
      "description": "Polling interval in milliseconds"
    }
  }
}
```

**Doctrine Alignment**:

- ✅ Legibility (visual config is clearer)
- ✅ Viability (reduces setup friction)
- ✅ No capture risk

**Dependencies**: Web UI (MP12), Core plugin architecture

---

### 6. Plugin Versioning and Migration

**Priority**: Medium-High — Enables updates without breaking state

**Why**:

- Plugin updates don't break user config
- Backward compatibility
- Smooth upgrade path

**Implementation**:

- Plugin manifest includes version (semver)
- Migration scripts (plugin-defined)
- State schema changes handled gracefully
- Rollback mechanism (keep previous version)

**Example Migration**:

```typescript
// Plugin v1.0.0 → v2.0.0 migration
export function migrateConfig(config: V1Config): V2Config {
  return {
    ...config,
    newField: config.oldField, // Rename field
    apiKey: config.apiKey, // Preserve existing
  };
}
```

**Doctrine Alignment**:

- ✅ Viability (preserves working state)
- ✅ Explicit (migrations are visible)
- ✅ No capture risk

**Dependencies**: Core plugin architecture, State migration patterns (already exist)

---

## Tier 3: Powerful but Needs Careful Design

Implement these if use cases emerge and community requests them.

### 7. Plugin Composition / Pipelines

**Priority**: Medium — Powerful but could become workflow engine

**Why**:

- Composable automation without monolithic plugins
- Reusable plugin building blocks
- Clear data flow (Observations → Observations)

**Example Pipeline**:

```yaml
name: "sleep-recovery"
steps:
  - plugin: "sleep-tracker"
    output: "sleep-status"
  - condition: "sleep-status.status == 'Low'"
    then:
      - plugin: "note-creator"
        input: "sleep-status"
        output: "reminder-note"
      - plugin: "notification-sender"
        input: "reminder-note"
```

**Concerns**:

- Could become "workflow engine" (mitigate with simplicity)
- Pipeline complexity (keep it declarative, not imperative)
- Error handling (fail-fast vs. continue)

**Mitigation**:

- Keep pipelines declarative (YAML/JSON, not code)
- Each step produces Observations (not Actions)
- Membrane validation at each step
- Pipeline visualization in UI (makes behavior visible)

**Doctrine Alignment**:

- ✅ Explicit (pipeline definition visible)
- ✅ Bounded (each step is isolated)
- ✅ Membrane enforcement at each step
- ⚠️ Risk: Could become workflow engine (mitigate with simplicity)

**Dependencies**: Core plugin architecture, Multiple plugins exist

---

### 8. Plugin Event System

**Priority**: Medium — Enables loose coupling but needs explicit registry

**Why**:

- Loose coupling between plugins
- Event-driven automation
- Composable behaviors

**Example**:

```typescript
// Email Watcher plugin emits event
plugin.emit("email_received", { from: "...", subject: "..." });

// Follow-Up plugin listens
plugin.on("email_received", async (event) => {
  // Create Note
});
```

**Concerns**:

- Hidden dependencies (mitigate with explicit event registry)
- Event ordering guarantees
- Event persistence (replay?)

**Mitigation**:

- Explicit event registry (what events exist, who emits/listens)
- Event logging (audit trail)
- Event payload schemas (typed events)

**Doctrine Alignment**:

- ✅ Explicit (events are logged)
- ✅ Bounded (events are typed)
- ⚠️ Risk: Could create hidden dependencies (mitigate with explicit event registry)

**Dependencies**: Core plugin architecture, Multiple plugins exist

---

## Tier 4: Community-Enabling (Nice to Have)

Implement these to support a thriving plugin ecosystem.

### 9. Plugin Contribution Guidelines

**Priority**: Low-Medium — Sets quality standards

**Why**:

- Consistent plugin quality
- Easier plugin review
- Community standards

**Content**:

- Plugin naming conventions
- Code style (matches project standards)
- Testing requirements
- Documentation requirements
- Doctrine alignment checklist

**Dependencies**: Core plugin architecture, Plugin templates (#2)

---

### 10. Plugin Documentation Generator

**Priority**: Low-Medium — Makes plugins discoverable

**Why**:

- Consistent plugin docs
- Easier plugin discovery
- Clear usage instructions

**Implementation**:

- Extract JSDoc comments
- Generate markdown from manifest
- Include examples from tests

**Dependencies**: Core plugin architecture, Plugin testing framework (#3)

---

## Additional Idea: Plugin Health Dashboard

**Priority**: Medium — Makes plugin behavior legible

**Why**:

- Makes plugin behavior visible (anti-capture)
- Helps debugging (why isn't plugin working?)
- Fits "baseline quiet" principle (only shows when something's wrong)

**UI Elements**:

- Plugin status (enabled/disabled, last execution, error count)
- Observation production rate (how many Observations per day?)
- Error log (last 10 errors with stack traces)
- Resource usage (CPU, memory — if sandboxed)

**Doctrine Alignment**:

- ✅ Legibility (makes plugin behavior visible)
- ✅ Anti-capture (audit trail prevents hidden behavior)
- ✅ Baseline quiet (only shows when something's wrong)

**Dependencies**: Web UI (MP12), Core plugin architecture, Plugin observability (#5)

---

## Implementation Roadmap

### Phase 1: Foundation (with MP-PLUGIN-1)

1. ✅ Plugin Security Model (#12)
2. ✅ Plugin Templates / Scaffolding (#2)
3. ✅ Plugin Testing Framework (#4)

### Phase 2: High Value (after plugins exist)

4. ✅ Shared Variable Configurations (#6)
5. ✅ Plugin Configuration UI (#8)
6. ✅ Plugin Versioning and Migration (#10)

### Phase 3: Powerful Features (if use cases emerge)

7. ⚠️ Plugin Composition / Pipelines (#3) — if users want pipelines
8. ⚠️ Plugin Event System (#9) — if plugins need to coordinate

### Phase 4: Community Support

9. ⚠️ Plugin Contribution Guidelines (#13)
10. ⚠️ Plugin Documentation Generator (#11)
11. ⚠️ Plugin Health Dashboard (new idea)

---

## Ideas to Defer or Avoid

### Defer Until Later

- **Plugin Marketplace (#1)**: Wait until you have plugins. Curated > open.
- **Plugin Dependency Management (#7)**: Adds complexity. Start simple; add if needed.
- **Plugin Analytics / Observability (#5)**: Useful but not urgent. Can add after Health Dashboard.

### Avoid (Doctrine Risk)

- **Plugin Rating System (#16)**: Risk of popularity pressure. Focus on quality over popularity.
- **Plugin Auto-Updates (#17)**: Opt-in is fine, but not urgent. Manual updates preserve agency.

---

## Success Criteria

For each tier, success means:

**Tier 1**:

- Plugins can be created safely (security model)
- Plugins can be created easily (templates)
- Plugins can be tested reliably (testing framework)

**Tier 2**:

- Users can onboard quickly (Variable packs)
- Users can configure plugins easily (Config UI)
- Plugins can be updated safely (Versioning)

**Tier 3**:

- Plugins can compose (Pipelines)
- Plugins can coordinate (Event System)

**Tier 4**:

- Plugin ecosystem is healthy (Guidelines, Docs, Health Dashboard)

---

## Notes

- All ideas preserve doctrine constraints (anti-capture, agency, baseline quiet)
- Implementation order prioritizes viability and explicit behavior
- Defer complex features until use cases emerge (avoid premature optimization)
- Focus on quality over quantity (curated plugins > app store)
