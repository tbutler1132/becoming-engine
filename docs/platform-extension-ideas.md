# Platform Extension Ideas

This document captures ideas for extending the Becoming Engine platform beyond the core plugin architecture. These are exploratory concepts that align with the doctrine but are not yet committed to the roadmap.

## 1. Plugin Marketplace / Registry

**Concept**: A curated registry of community-contributed plugins.

**Benefits**:

- Discoverability for useful plugins
- Version management and updates
- Community ratings/reviews
- Security scanning for malicious plugins

**Considerations**:

- Curated vs. open (curated aligns better with doctrine)
- Plugin signing/verification
- Update mechanism (pull-based, user controls)
- Plugin deprecation lifecycle

**Alignment with Doctrine**:

- ✅ Pull-based (users choose to install)
- ✅ Explicit (plugin manifest shows permissions)
- ✅ Auditable (plugin source visible)
- ⚠️ Risk: Could create "app store" pressure (mitigate with quiet baseline)

## 2. Plugin Templates / Scaffolding

**Concept**: CLI tooling to generate plugin boilerplate.

**Benefits**:

- Lowers barrier to plugin creation
- Ensures consistent plugin structure
- Includes best practices (error handling, logging, validation)

**Implementation**:

```bash
npm run plugin:create --name sleep-tracker --type sensorium
```

**Alignment with Doctrine**:

- ✅ Explicit (generated code is visible)
- ✅ Viability (reduces plugin creation friction)
- ✅ No capture risk

## 3. Plugin Composition / Pipelines

**Concept**: Chain plugins together to create automation pipelines.

**Example**: Sleep tracker → Variable proxy → If Low → Create Note → Send reminder

**Benefits**:

- Composable automation without monolithic plugins
- Reusable plugin building blocks
- Clear data flow (Observations → Observations)

**Considerations**:

- Pipeline definition language (YAML? JSON?)
- Pipeline execution engine
- Error handling (fail-fast vs. continue)
- Pipeline visualization in UI

**Alignment with Doctrine**:

- ✅ Explicit (pipeline definition visible)
- ✅ Bounded (each step is isolated)
- ✅ Membrane enforcement at each step
- ⚠️ Risk: Could become "workflow engine" (mitigate with simplicity)

## 4. Plugin Testing Framework

**Concept**: Testing utilities for plugin developers.

**Benefits**:

- Ensures plugins work correctly before distribution
- Validates plugin outputs match DNA types
- Tests plugin error handling

**Implementation**:

```typescript
import { testPlugin } from "@libs/plugins/testing";

testPlugin("sleep-tracker", async (plugin, context) => {
  const observations = await plugin.sense(context);
  expect(observations.ok).toBe(true);
  expect(observations.value[0].type).toBe("variableProxySignal");
});
```

**Alignment with Doctrine**:

- ✅ Viability (reduces plugin bugs)
- ✅ Explicit (tests are visible)
- ✅ No capture risk

## 5. Plugin Analytics / Observability

**Concept**: Built-in observability for plugin execution.

**Benefits**:

- Debug plugin issues
- Understand plugin performance
- Audit plugin behavior (anti-capture)

**Metrics**:

- Plugin execution frequency
- Observation production rate
- Error rates
- Resource usage (CPU, memory)

**Considerations**:

- Privacy (analytics opt-in?)
- Storage (where to store metrics?)
- Visualization (UI for plugin health?)

**Alignment with Doctrine**:

- ✅ Legibility (makes plugin behavior visible)
- ✅ Anti-capture (audit trail prevents hidden behavior)
- ⚠️ Risk: Could create surveillance (mitigate with user control)

## 6. Shared Variable Configurations

**Concept**: Shareable Variable definitions with preferred ranges, proxies, and Models.

**Example**: "Developer Viability" Variable pack with:

- Variables: Sleep, Exercise, Focus, Social
- Preferred ranges based on research
- Procedural Models for common interventions

**Benefits**:

- Community knowledge sharing
- Faster onboarding for new users
- Evidence-based defaults

**Considerations**:

- Variable pack format (JSON/YAML?)
- Customization (users can override ranges)
- Versioning (packs evolve over time)

**Alignment with Doctrine**:

- ✅ Explicit (pack contents visible)
- ✅ Pull-based (users choose to adopt)
- ✅ Viability (faster setup)
- ⚠️ Risk: Could create "one-size-fits-all" (mitigate with customization)

## 7. Plugin Dependency Management

**Concept**: Plugins can depend on other plugins or shared libraries.

**Example**: "Calendar Integration" plugin depends on "Date Parser" plugin.

**Benefits**:

- Code reuse
- Modular plugin architecture
- Shared utilities (API clients, parsers)

**Considerations**:

- Dependency resolution
- Version conflicts
- Circular dependencies
- Plugin isolation (sandboxing complicates this)

**Alignment with Doctrine**:

- ✅ Viability (reduces duplication)
- ✅ Explicit (dependencies in manifest)
- ⚠️ Risk: Could create complexity (mitigate with simplicity)

## 8. Plugin Configuration UI

**Concept**: Web UI for configuring plugins (beyond JSON config).

**Benefits**:

- Easier plugin setup
- Visual configuration (forms, wizards)
- Configuration validation feedback

**Implementation**:

- Plugin manifest defines config schema
- UI generates form from schema
- Config saved to state

**Alignment with Doctrine**:

- ✅ Legibility (visual config is clearer)
- ✅ Viability (reduces setup friction)
- ✅ No capture risk

## 9. Plugin Event System

**Concept**: Plugins can emit and listen to events.

**Example**: "Email Watcher" emits `email_received` event → "Follow-Up" plugin listens → creates Note.

**Benefits**:

- Loose coupling between plugins
- Event-driven automation
- Composable behaviors

**Considerations**:

- Event naming conventions
- Event payload schemas
- Event ordering guarantees
- Event persistence (replay?)

**Alignment with Doctrine**:

- ✅ Explicit (events are logged)
- ✅ Bounded (events are typed)
- ⚠️ Risk: Could create hidden dependencies (mitigate with explicit event registry)

## 10. Plugin Versioning and Migration

**Concept**: Plugin versioning with migration support.

**Benefits**:

- Plugin updates don't break user state
- Backward compatibility
- Smooth upgrade path

**Considerations**:

- Migration scripts (plugin-defined?)
- State schema changes
- Rollback mechanism

**Alignment with Doctrine**:

- ✅ Viability (preserves working state)
- ✅ Explicit (migrations are visible)
- ✅ No capture risk

## 11. Plugin Documentation Generator

**Concept**: Auto-generate plugin documentation from code and manifest.

**Benefits**:

- Consistent plugin docs
- Easier plugin discovery
- Clear usage instructions

**Implementation**:

- Extract JSDoc comments
- Generate markdown from manifest
- Include examples from tests

**Alignment with Doctrine**:

- ✅ Legibility (clear docs)
- ✅ Explicit (docs are visible)
- ✅ No capture risk

## 12. Plugin Security Model

**Concept**: Fine-grained permissions for plugins.

**Permissions**:

- `read-state`: Read current State (read-only)
- `write-observations`: Produce Observations
- `write-notes`: Create Notes
- `network-request`: Make HTTP requests
- `filesystem-read`: Read files (sandboxed)
- `filesystem-write`: Write files (sandboxed)

**Benefits**:

- Principle of least privilege
- Security auditability
- User control over plugin capabilities

**Alignment with Doctrine**:

- ✅ Explicit (permissions in manifest)
- ✅ Anti-capture (limits plugin scope)
- ✅ Agency (user controls permissions)

## 13. Plugin Contribution Guidelines

**Concept**: Community guidelines for plugin development.

**Guidelines**:

- Plugin naming conventions
- Code style (matches project standards)
- Testing requirements
- Documentation requirements
- Doctrine alignment checklist

**Benefits**:

- Consistent plugin quality
- Easier plugin review
- Community standards

**Alignment with Doctrine**:

- ✅ Explicit (guidelines are visible)
- ✅ Viability (reduces plugin maintenance burden)
- ✅ No capture risk

## 14. Plugin Debugging Tools

**Concept**: Developer tools for debugging plugins.

**Tools**:

- Plugin execution logger
- Observation inspector
- State snapshot viewer
- Error stack traces
- Performance profiler

**Benefits**:

- Faster plugin development
- Easier troubleshooting
- Better plugin quality

**Alignment with Doctrine**:

- ✅ Legibility (debugging makes behavior visible)
- ✅ Viability (reduces development friction)
- ✅ No capture risk

## 15. Plugin Marketplace Categories

**Concept**: Organize plugins by category.

**Categories**:

- **Sensors**: Variable proxy sources (sleep, exercise, mood)
- **Automation**: Procedural Models (email, formatting, workflows)
- **World Models**: Domain schemas (projects, people, knowledge)
- **Integrations**: External service connectors (APIs, tools)
- **Utilities**: Helper plugins (parsers, formatters, validators)

**Benefits**:

- Easier plugin discovery
- Clear plugin purpose
- Community organization

**Alignment with Doctrine**:

- ✅ Legibility (categories clarify purpose)
- ✅ Explicit (categories are visible)
- ✅ No capture risk

## 16. Plugin Rating / Review System

**Concept**: Community ratings and reviews for plugins.

**Benefits**:

- Quality signal for users
- Feedback for plugin authors
- Community curation

**Considerations**:

- Rating criteria (functionality, stability, doctrine alignment?)
- Review moderation
- Abuse prevention

**Alignment with Doctrine**:

- ✅ Explicit (reviews are visible)
- ⚠️ Risk: Could create popularity pressure (mitigate with quiet baseline, focus on quality over popularity)

## 17. Plugin Auto-Updates (Opt-In)

**Concept**: Automatic plugin updates with user control.

**Benefits**:

- Security patches
- Bug fixes
- Feature updates

**Considerations**:

- Opt-in vs. opt-out (opt-in aligns with doctrine)
- Update notification
- Rollback mechanism
- Breaking changes (semver)

**Alignment with Doctrine**:

- ✅ Agency (user controls updates)
- ✅ Viability (security patches)
- ⚠️ Risk: Could create update pressure (mitigate with opt-in, quiet notifications)

## 18. Plugin Contribution Credits

**Concept**: Attribution system for plugin contributors.

**Benefits**:

- Recognition for contributors
- Plugin provenance
- Community building

**Considerations**:

- Credit format (author field in manifest?)
- Contribution tracking
- Recognition UI

**Alignment with Doctrine**:

- ✅ Explicit (credits are visible)
- ✅ No capture risk (attribution is neutral)

## 19. Plugin Compatibility Matrix

**Concept**: Document plugin compatibility with system versions.

**Benefits**:

- Clear upgrade path
- Plugin compatibility checking
- Version management

**Implementation**:

- Plugin manifest includes `compatibility` field
- Registry checks compatibility on load
- UI shows compatibility warnings

**Alignment with Doctrine**:

- ✅ Legibility (compatibility is visible)
- ✅ Viability (prevents breakage)
- ✅ No capture risk

## 20. Plugin Sandbox Visualization

**Concept**: Visual representation of plugin execution in sandbox.

**Benefits**:

- Understand plugin behavior
- Debug plugin issues
- Security auditability

**Visualization**:

- Plugin execution timeline
- Observation flow
- Membrane validation results
- Resource usage graphs

**Alignment with Doctrine**:

- ✅ Legibility (visualization makes behavior visible)
- ✅ Anti-capture (audit trail)
- ✅ No capture risk

---

## Prioritization Framework

When evaluating these ideas, consider:

1. **Doctrine Alignment**: Does it preserve anti-capture, agency, baseline quiet?
2. **Viability**: Does it reduce friction or increase stability?
3. **Explicitness**: Is behavior visible and auditable?
4. **Complexity**: Does it add unnecessary complexity?
5. **Community Value**: Does it enable meaningful contributions?

## Next Steps

1. **Phase 1**: Implement core plugin architecture (ADR 0005)
2. **Phase 2**: Add plugin marketplace/registry (if community interest)
3. **Phase 3**: Add plugin composition/pipelines (if use cases emerge)
4. **Phase 4**: Add plugin sandboxing (security hardening)

Most other ideas can be added incrementally based on community needs and feedback.

---

## Prioritization Guide

See [Plugin Implementation Priorities](plugin-implementation-priorities.md) for a detailed prioritization of these ideas based on:

- Impact and value
- Doctrine alignment
- Implementation feasibility
- Dependencies

The priorities document recommends starting with:

1. **Tier 1 (Foundation)**: Plugin Security Model, Templates, Testing Framework
2. **Tier 2 (High Value)**: Shared Variable Configurations, Configuration UI, Versioning
3. **Tier 3 (Powerful Features)**: Composition/Pipelines, Event System (if use cases emerge)
4. **Tier 4 (Community Support)**: Guidelines, Documentation, Health Dashboard
