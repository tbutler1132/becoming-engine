# Plugins (Extensions)

This directory is the **home for extensions** to the Becoming Engine.

## What belongs here

- **Sensorium plugins** (oracles/sensors): external data sources → Observations
- **Procedural model plugins**: shareable procedures/automation (draft artifacts)
- **World model plugins** (future): schemas/entities for domain modeling
- **Starter packs**: opinionated, first-party defaults (optional, disable-able)

## What does NOT belong here

- Changes to the organism’s **constitution** (DNA, core ontology, core invariants)
- “Sneaking integrations into core” by hard-coding external APIs inside `src/libs/*`

If something is a _specific integration_ (sleep provider, calendar provider, email provider), treat it as a plugin.

## The rule of the organism

Plugins can **extend sensing and execution**, but never authority:

- Plugins produce **Observations**, not Actions directly
- All plugin outputs must pass through **Membrane** validation
- Plugins never open Episodes autonomously
- Plugins never mutate Models directly

See:

- `docs/decisions/0005-plugin-architecture.md`
- `docs/ai-plugin-generation.md`

## Proposed plugin layout (future)

Once the plugin system is implemented, each plugin will live under:

```
plugins/<plugin-name>/
  plugin.json
  README.md
  index.ts
  index.test.ts
```
